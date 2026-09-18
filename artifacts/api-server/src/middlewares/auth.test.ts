import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { inArray } from "drizzle-orm";
import request from "supertest";
import {
  db,
  organizationMembershipsTable,
  organizationModulesTable,
  organizationsTable,
  usersTable,
} from "@workspace/db";
import { getMembership } from "./auth";
import { synchronizeModuleRegistry } from "../lib/moduleEntitlements";

vi.mock("@clerk/express", () => ({
  clerkMiddleware:
    () =>
    (_req: unknown, _res: unknown, next: () => void) =>
      next(),
  getAuth: (req: { header(name: string): string | undefined }) => ({
    userId: req.header("x-test-clerk-user-id") ?? null,
  }),
  clerkClient: {
    users: {
      getUser: vi.fn(),
    },
  },
}));

describe("tenant membership isolation", () => {
  const nonce = randomUUID();
  let userAId = "";
  let userBId = "";
  let organizationAId = "";
  let organizationBId = "";

  beforeAll(async () => {
    await synchronizeModuleRegistry();
    const [userA, userB] = await db
      .insert(usersTable)
      .values([
        {
          clerkUserId: `tenant-test-a-${nonce}`,
          email: `tenant-a-${nonce}@example.test`,
          displayName: "Tenant A test user",
        },
        {
          clerkUserId: `tenant-test-b-${nonce}`,
          email: `tenant-b-${nonce}@example.test`,
          displayName: "Tenant B test user",
        },
      ])
      .returning();
    const [organizationA, organizationB] = await db
      .insert(organizationsTable)
      .values([
        { legalNameEnglish: `Tenant A ${nonce}` },
        { legalNameEnglish: `Tenant B ${nonce}` },
      ])
      .returning();

    if (!userA || !userB || !organizationA || !organizationB) {
      throw new Error("Unable to create tenant isolation fixtures");
    }
    userAId = userA.id;
    userBId = userB.id;
    organizationAId = organizationA.id;
    organizationBId = organizationB.id;

    await db.insert(organizationMembershipsTable).values([
      { userId: userAId, organizationId: organizationAId, role: "owner" },
      { userId: userBId, organizationId: organizationBId, role: "owner" },
      { userId: userBId, organizationId: organizationAId, role: "viewer" },
    ]);
    await db.insert(organizationModulesTable).values({
      organizationId: organizationAId,
      moduleKey: "finance",
      enabled: true,
      activatedAt: new Date(),
    });
  });

  afterAll(async () => {
    if (organizationAId && organizationBId) {
      await db
        .delete(organizationsTable)
        .where(
          inArray(organizationsTable.id, [
            organizationAId,
            organizationBId,
          ]),
        );
    }
    if (userAId && userBId) {
      await db
        .delete(usersTable)
        .where(inArray(usersTable.id, [userAId, userBId]));
    }
  });

  it("allows a user to retrieve their own organization membership", async () => {
    const membership = await getMembership(userAId, organizationAId);
    expect(membership?.organizationId).toBe(organizationAId);
    expect(membership?.userId).toBe(userAId);
  });

  it("denies a user access to another organization's membership boundary", async () => {
    const crossTenantMembership = await getMembership(
      userAId,
      organizationBId,
    );
    expect(crossTenantMembership).toBeUndefined();
  });

  it("returns 403 for a direct API request using another organization's id", async () => {
    const { default: app } = await import("../app");
    const response = await request(app)
      .get(`/api/organizations/${organizationBId}`)
      .set("x-test-clerk-user-id", `tenant-test-a-${nonce}`);

    expect(response.status).toBe(403);
    expect(response.body).toEqual({ error: "Organization access denied" });
  });

  it("allows Finance access when the organization entitlement is enabled", async () => {
    const { default: app } = await import("../app");
    const response = await request(app)
      .get(`/api/organizations/${organizationAId}/dashboard`)
      .set("x-test-clerk-user-id", `tenant-test-a-${nonce}`);

    expect(response.status).toBe(200);
    expect(response.body.currency).toBe("SAR");
  });

  it("rejects direct Finance API access when the module is disabled", async () => {
    const { default: app } = await import("../app");
    const response = await request(app)
      .get(`/api/organizations/${organizationBId}/dashboard`)
      .set("x-test-clerk-user-id", `tenant-test-b-${nonce}`);

    expect(response.status).toBe(403);
    expect(response.body).toEqual({ error: "Module is not enabled" });
  });

  it("keeps RBAC restrictions after module entitlement succeeds", async () => {
    const { default: app } = await import("../app");
    const response = await request(app)
      .patch(`/api/organizations/${organizationAId}`)
      .set("x-test-clerk-user-id", `tenant-test-b-${nonce}`)
      .send({ legalNameEnglish: "Viewer must not update" });

    expect(response.status).toBe(403);
    expect(response.body).toEqual({ error: "Organization access denied" });
  });
});