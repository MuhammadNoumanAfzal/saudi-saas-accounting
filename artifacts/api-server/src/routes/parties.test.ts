import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import request from "supertest";
import { and, eq, inArray } from "drizzle-orm";
import {
  auditLogsTable,
  db,
  organizationMembershipsTable,
  organizationModulesTable,
  organizationsTable,
  usersTable,
} from "@workspace/db";
import { synchronizeModuleRegistry } from "../lib/moduleEntitlements";

// This is deliberately an API-only test. Document paths below are database metadata
// fixtures; no test uploads to or downloads from App Storage/GCS.
vi.mock("@clerk/express", () => ({
  clerkMiddleware: () => (_req: unknown, _res: unknown, next: () => void) => next(),
  getAuth: (req: { header(name: string): string | undefined }) => ({
    userId: req.header("x-test-clerk-user-id") ?? null,
  }),
  clerkClient: { users: { getUser: vi.fn() } },
}));

describe("Phase 4 BusinessParty API", () => {
  const nonce = randomUUID();
  let app: (typeof import("../app"))["default"];
  let orgA = "", orgB = "";
  const users: Record<string, { id: string; clerk: string }> = {};
  const auth = (role: string) => ({ "x-test-clerk-user-id": users[role].clerk });
  const base = (_org: string, role: string) => ({
    get: (path: string) => request(app).get(path).set(auth(role)),
    post: (path: string) => request(app).post(path).set(auth(role)),
    patch: (path: string) => request(app).patch(path).set(auth(role)),
    delete: (path: string) => request(app).delete(path).set(auth(role)),
  });
  let customerId = "", supplierId = "", contactId = "", addressId = "", documentId = "";

  beforeAll(async () => {
    await synchronizeModuleRegistry();
    app = (await import("../app")).default;
    const roles = ["owner", "ownerB", "sales", "purchasing", "viewer"];
    const createdUsers = await db.insert(usersTable).values(
      roles.map((role) => ({
        clerkUserId: `phase4-${role}-${nonce}`,
        email: `phase4-${role}-${nonce}@example.test`,
        displayName: `Phase 4 ${role}`,
      })),
    ).returning();
    createdUsers.forEach((u, i) => {
      const role = roles[i];
      users[role] = { id: u.id, clerk: u.clerkUserId };
    });
    const orgs = await db.insert(organizationsTable).values([
      { legalNameEnglish: `Phase 4 A ${nonce}` },
      { legalNameEnglish: `Phase 4 B ${nonce}` },
    ]).returning();
    orgA = orgs[0].id; orgB = orgs[1].id;
    await db.insert(organizationMembershipsTable).values([
      { organizationId: orgA, userId: users.owner.id, role: "owner" },
      { organizationId: orgA, userId: users.sales.id, role: "sales" },
      { organizationId: orgA, userId: users.purchasing.id, role: "purchasing" },
      { organizationId: orgA, userId: users.viewer.id, role: "viewer" },
      { organizationId: orgB, userId: users.ownerB.id, role: "owner" },
    ]);
    await db.insert(organizationModulesTable).values({
      organizationId: orgA, moduleKey: "finance", enabled: true, activatedAt: new Date(),
    });
    await db.insert(organizationModulesTable).values({
      organizationId: orgB, moduleKey: "finance", enabled: true, activatedAt: new Date(),
    });
  });

  afterAll(async () => {
    if (orgA || orgB) await db.delete(organizationsTable).where(inArray(organizationsTable.id, [orgA, orgB].filter(Boolean)));
    await db.delete(usersTable).where(inArray(usersTable.id, Object.values(users).map((u) => u.id)));
  });

  const customer = (name = `Acme ${nonce}`, extra: Record<string, unknown> = {}) => ({
    partyType: "organization", businessNameEnglish: name, ...extra,
  });
  const supplier = (name = `Vendor ${nonce}`, extra: Record<string, unknown> = {}) => ({
    partyType: "organization", businessNameEnglish: name, ...extra,
  });

  it("creates customer/supplier roles with organization-safe numbers", async () => {
    const c = await base(orgA, "owner").post(`/api/organizations/${orgA}/customers`).send(customer());
    expect(c.status).toBe(201); expect(c.body.roles[0].partyNumber).toBe("CUS-00001"); customerId = c.body.id;
    const s = await base(orgA, "owner").post(`/api/organizations/${orgA}/suppliers`).send(supplier());
    expect(s.status).toBe(201); expect(s.body.roles[0].partyNumber).toBe("SUP-00001"); supplierId = s.body.id;
    const role = await base(orgA, "owner").post(`/api/organizations/${orgA}/parties/${customerId}/roles/supplier`).send({});
    expect(role.status).toBe(201);
    expect((await base(orgA, "owner").get(`/api/organizations/${orgA}/suppliers/${customerId}`)).body.roles).toHaveLength(2);
    const reverseRole = await base(orgA, "owner").post(`/api/organizations/${orgA}/parties/${supplierId}/roles/customer`).send({});
    expect(reverseRole.status).toBe(201);
    expect((await base(orgA, "owner").post(`/api/organizations/${orgA}/parties/${customerId}/roles/customer`).send({})).status).toBe(409);
  });

  it("allocates unique sequential numbers under concurrent creates", async () => {
    const cs = await Promise.all([1, 2, 3].map((i) => base(orgA, "owner").post(`/api/organizations/${orgA}/customers`).send(customer(`Concurrent C ${i} ${nonce}`))));
    const ss = await Promise.all([1, 2, 3].map((i) => base(orgA, "owner").post(`/api/organizations/${orgA}/suppliers`).send(supplier(`Concurrent S ${i} ${nonce}`))));
    expect(cs.every((r) => r.status === 201)).toBe(true); expect(ss.every((r) => r.status === 201)).toBe(true);
    expect(new Set(cs.map((r) => r.body.roles[0].partyNumber)).size).toBe(3);
    expect(new Set(ss.map((r) => r.body.roles[0].partyNumber)).size).toBe(3);
    expect(cs.every((r) => /^CUS-\d{5}$/.test(r.body.roles[0].partyNumber))).toBe(true);
    expect(ss.every((r) => /^SUP-\d{5}$/.test(r.body.roles[0].partyNumber))).toBe(true);
  });

  it("rejects invalid VAT and accepts structurally valid Saudi VAT", async () => {
    expect((await base(orgA, "owner").post(`/api/organizations/${orgA}/customers`).send(customer("Bad VAT", { vatRegistered: true, vatNumber: "123" }))).status).toBe(400);
    const r = await base(orgA, "owner").post(`/api/organizations/${orgA}/customers`).send(customer("Valid VAT", { vatRegistered: true, vatNumber: "312345678901233" }));
    expect(r.status).toBe(201); expect(r.body.vatNumber).toBe("312345678901233");
  });

  it("enforces tenant and role permission boundaries", async () => {
    const b = await base(orgB, "ownerB").post(`/api/organizations/${orgB}/customers`).send(customer(`Other tenant ${nonce}`));
    expect(b.status).toBe(201);
    for (const method of ["get", "patch"]) {
      const r = method === "get" ? base(orgA, "owner").get(`/api/organizations/${orgB}/customers/${b.body.id}`) : base(orgA, "owner").patch(`/api/organizations/${orgB}/customers/${b.body.id}`).send({ notes: "nope" });
      expect((await r).status).toBe(403);
    }
    expect((await base(orgA, "sales").post(`/api/organizations/${orgA}/suppliers`).send(supplier("Sales denied"))).status).toBe(403);
    expect((await base(orgA, "purchasing").post(`/api/organizations/${orgA}/customers`).send(customer("Purchasing denied"))).status).toBe(403);
    expect((await base(orgA, "viewer").patch(`/api/organizations/${orgA}/customers/${customerId}`).send({ notes: "nope" })).status).toBe(403);
    await db.update(organizationModulesTable).set({ enabled: false }).where(and(
      eq(organizationModulesTable.organizationId, orgB),
      eq(organizationModulesTable.moduleKey, "finance"),
    ));
    expect((await base(orgB, "owner").get(`/api/organizations/${orgB}/customers`)).status).toBe(403);
  });

  it("supports contacts, addresses, defaults and lifecycle status", async () => {
    const cp = `/api/organizations/${orgA}/parties/${customerId}`;
    const c = await base(orgA, "owner").post(`${cp}/contacts`).send({ firstName: "Nora", email: `nora-${nonce}@example.test`, isPrimary: true });
    expect(c.status).toBe(201); contactId = c.body.id;
    const c2 = await base(orgA, "owner").post(`${cp}/contacts`).send({ firstName: "Omar", isPrimary: true });
    expect(c2.status).toBe(201);
    expect((await base(orgA, "owner").patch(`${cp}/contacts/${contactId}`).send({ phone: "+966500000000" })).status).toBe(200);
    const a = await base(orgA, "owner").post(`${cp}/addresses`).send({ addressType: "billing", city: "Riyadh", isDefaultBilling: true });
    expect(a.status).toBe(201); addressId = a.body.id;
    const addressUpdate = await base(orgA, "owner").patch(`${cp}/addresses/${addressId}`).send({ city: "Jeddah" });
    expect(addressUpdate.body.city).toBe("Jeddah");
    expect((await base(orgA, "owner").patch(`/api/organizations/${orgA}/parties/${customerId}/status`).send({ status: "inactive" })).status).toBe(200);
    expect((await base(orgA, "owner").patch(`/api/organizations/${orgA}/parties/${customerId}/status`).send({ status: "active" })).body.status).toBe("active");
    expect((await base(orgA, "owner").delete(`${cp}/contacts/${contactId}`)).status).toBe(204);
    expect((await base(orgA, "owner").delete(`${cp}/addresses/${addressId}`)).status).toBe(204);
  });

  it("searches, filters, paginates, imports and exports only its tenant", async () => {
    const list = await base(orgA, "owner").get(`/api/organizations/${orgA}/customers?search=Valid%20VAT&page=1&pageSize=1&sort=number&vatRegistered=true`);
    expect(list.status).toBe(200); expect(list.body.pageSize).toBe(1); expect(list.body.items.length).toBe(1);
    expect((await base(orgA, "owner").get(`/api/organizations/${orgA}/party-search?q=${encodeURIComponent("Acme")}`)).status).toBe(200);
    const preview = await base(orgA, "owner").post(`/api/organizations/${orgA}/customers/import/preview`).send({ rows: [customer("Import good"), { partyType: "organization", vatRegistered: "true", vatNumber: "bad" }] });
    expect(preview.status).toBe(200); expect(preview.body.validRows).toBe(1); expect(preview.body.errors.length).toBe(1);
    expect((await base(orgA, "owner").post(`/api/organizations/${orgA}/customers/import/confirm`).send({ rows: [customer(`Imported ${nonce}`)] })).status).toBe(201);
    const exp = await base(orgA, "owner").get(`/api/organizations/${orgA}/customers/export`);
    expect(exp.status).toBe(200); expect(exp.text).toContain(nonce); expect(exp.text).not.toContain("Other tenant");
    expect((await base(orgA, "sales").get(`/api/organizations/${orgA}/suppliers/export`)).status).toBe(403);
  });

  it("protects contact and document metadata IDs across tenants and writes audit logs", async () => {
    const cp = `/api/organizations/${orgA}/parties/${customerId}`;
    const d = await base(orgA, "owner").post(`${cp}/documents`).send({ fileName: "invoice.pdf", documentType: "invoice", objectPath: `/objects/${nonce}/invoice.pdf` });
    expect(d.status).toBe(201); documentId = d.body.id;
    const foreign = `/api/organizations/${orgB}/parties/${customerId}`;
    expect((await base(orgB, "owner").get(`${foreign}/documents/${documentId}`)).status).not.toBe(200);
    expect((await base(orgB, "owner").patch(`${foreign}/documents/${documentId}`).send({ fileName: "stolen.pdf" })).status).not.toBe(200);
    expect((await base(orgB, "owner").delete(`${foreign}/documents/${documentId}`)).status).not.toBe(204);
    const logs = await db.select().from(auditLogsTable).where(and(eq(auditLogsTable.organizationId, orgA), eq(auditLogsTable.entityType, "business_party")));
    expect(logs.some((l) => l.action === "created")).toBe(true);
    expect((await base(orgA, "owner").delete(`${cp}/documents/${documentId}`)).status).toBe(204);
  });
});