import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import request from "supertest";
import { and, eq, inArray } from "drizzle-orm";
import {
  auditLogsTable, db, organizationMembershipsTable, organizationModulesTable,
  organizationsTable, organizationUnitsTable, usersTable,
} from "@workspace/db";
import { synchronizeModuleRegistry } from "../lib/moduleEntitlements";

vi.mock("@clerk/express", () => ({
  clerkMiddleware: () => (_req: unknown, _res: unknown, next: () => void) => next(),
  getAuth: (req: { header(name: string): string | undefined }) => ({
    userId: req.header("x-test-clerk-user-id") ?? null,
  }),
  clerkClient: { users: { getUser: vi.fn() } },
}));

describe("Products & Services catalog API", () => {
  const nonce = randomUUID();
  let app: (typeof import("../app"))["default"];
  let orgA = "", orgB = "", unitId = "";
  const users: Record<string, { id: string; clerk: string }> = {};
  const auth = (role: string) => ({ "x-test-clerk-user-id": users[role].clerk });
  const api = (role: string) => ({
    get: (path: string) => request(app).get(path).set(auth(role)),
    post: (path: string) => request(app).post(path).set(auth(role)),
    patch: (path: string) => request(app).patch(path).set(auth(role)),
  });
  const path = (org = orgA) => `/api/organizations/${org}/catalog`;
  const product = (name = `Product ${nonce}`, extra: Record<string, unknown> = {}) => ({
    type: "PRODUCT", name, nameAr: `منتج ${nonce}`, unitId, salesPrice: "100.00",
    purchasePrice: "50.00", taxCategory: "STANDARD", taxRate: "15",
    ...extra,
  });

  beforeAll(async () => {
    await synchronizeModuleRegistry();
    app = (await import("../app")).default;
    const roleNames = ["owner", "sales", "viewer", "ownerB"];
    const created = await db.insert(usersTable).values(roleNames.map((role) => ({
      clerkUserId: `catalog-${role}-${nonce}`, email: `catalog-${role}-${nonce}@example.test`, displayName: `Catalog ${role}`,
    }))).returning();
    created.forEach((u, i) => { users[roleNames[i]] = { id: u.id, clerk: u.clerkUserId }; });
    const organizations = await db.insert(organizationsTable).values([
      { legalNameEnglish: `Catalog A ${nonce}` }, { legalNameEnglish: `Catalog B ${nonce}` },
    ]).returning();
    orgA = organizations[0].id; orgB = organizations[1].id;
    await db.insert(organizationMembershipsTable).values([
      { organizationId: orgA, userId: users.owner.id, role: "owner" },
      { organizationId: orgA, userId: users.sales.id, role: "sales" },
      { organizationId: orgA, userId: users.viewer.id, role: "viewer" },
      { organizationId: orgB, userId: users.ownerB.id, role: "owner" },
    ]);
    await db.insert(organizationModulesTable).values([
      { organizationId: orgA, moduleKey: "finance", enabled: true, activatedAt: new Date() },
      { organizationId: orgB, moduleKey: "finance", enabled: true, activatedAt: new Date() },
    ]);
    const units = await api("owner").get(`${path()}/units`);
    expect(units.status).toBe(200);
    unitId = units.body.find((u: any) => u.code === "piece").id;
  });

  afterAll(async () => {
    await db.delete(organizationsTable).where(inArray(organizationsTable.id, [orgA, orgB]));
    await db.delete(usersTable).where(inArray(usersTable.id, Object.values(users).map((u) => u.id)));
  });

  it("creates products and services, forcing service inventory off", async () => {
    const p = await api("owner").post(`${path()}/items`).send(product());
    expect(p.status).toBe(201);
    expect(p.body.code).toBe("ITEM-00001");
    expect(p.body.trackInventory).toBe(false);
    const s = await api("owner").post(`${path()}/items`).send(product(`Service ${nonce}`, { type: "SERVICE", trackInventory: false }));
    expect(s.status).toBe(201);
    expect(s.body.type).toBe("SERVICE");
    expect(s.body.trackInventory).toBe(false);
    expect((await api("owner").post(`${path()}/items`).send(product("bad service", { type: "SERVICE", trackInventory: true }))).status).toBe(400);
  });

  it("allocates unique codes concurrently and accepts only canonical taxes", async () => {
    const responses = await Promise.all([1, 2, 3, 4].map((i) => api("owner").post(`${path()}/items`).send(product(`Concurrent ${i} ${nonce}`))));
    expect(responses.every((r) => r.status === 201)).toBe(true);
    expect(new Set(responses.map((r) => r.body.code)).size).toBe(4);
    for (const [taxCategory, taxRate] of [["ZERO_RATED", "0"], ["EXEMPT", "0"], ["OUT_OF_SCOPE", "0"]] as const) {
      expect((await api("owner").post(`${path()}/items`).send(product(`${taxCategory} ${nonce}`, { taxCategory, taxRate }))).status).toBe(201);
    }
    expect((await api("owner").post(`${path()}/items`).send(product("bad tax", { taxCategory: "STANDARD", taxRate: "0" }))).status).toBe(400);
  });

  it("enforces tenant isolation, roles, and Finance entitlement", async () => {
    const foreignUnits = await api("ownerB").get(`${path(orgB)}/units`);
    const foreignUnitId = foreignUnits.body.find((u: any) => u.code === "piece").id;
    const foreign = await api("ownerB").post(`${path(orgB)}/items`).send(product(`Foreign ${nonce}`, { unitId: foreignUnitId }));
    expect(foreign.status).toBe(201);
    expect((await api("owner").get(`${path(orgB)}/items/${foreign.body.id}`)).status).toBe(403);
    expect((await api("viewer").post(`${path()}/items`).send(product("viewer denied"))).status).toBe(403);
    expect((await api("sales").post(`${path()}/items`).send(product(`Sales ${nonce}`))).status).toBe(201);
    await db.update(organizationModulesTable).set({ enabled: false }).where(and(eq(organizationModulesTable.organizationId, orgB), eq(organizationModulesTable.moduleKey, "finance")));
    expect((await api("ownerB").get(`${path(orgB)}/items`)).status).toBe(403);
  });

  it("searches and filters, deactivates and reactivates", async () => {
    const created = await api("owner").post(`${path()}/items`).send(product(`Findable ${nonce}`, { sku: `SKU-${nonce}` }));
    expect(created.status).toBe(201);
    const list = await api("owner").get(`${path()}/items?search=Findable&type=PRODUCT&status=ACTIVE`);
    expect(list.status).toBe(200);
    expect(list.body.items.some((i: any) => i.id === created.body.id)).toBe(true);
    expect((await api("owner").get(`${path()}/search?q=Findable`)).body.some((i: any) => i.id === created.body.id)).toBe(true);
    const statusPath = `${path()}/items/${created.body.id}/status`;
    expect((await api("owner").patch(statusPath).send({ status: "INACTIVE" })).body.status).toBe("INACTIVE");
    expect((await api("owner").patch(statusPath).send({ status: "ACTIVE" })).body.status).toBe("ACTIVE");
  });

  it("validates CSV preview, isolates export, dashboard checklist, and audits", async () => {
    const preview = await api("owner").post(`${path()}/import/preview`).send({ rows: [
      { ...product("CSV valid"), trackInventory: false },
      { ...product("CSV invalid"), taxCategory: "STANDARD", taxRate: "0" },
    ]});
    expect(preview.status).toBe(200);
    expect(preview.body.validRows).toBe(1);
    const csvPreview = await api("owner").post(`${path()}/import/preview`).send({
      csv: `type,name,nameAr,unitId,salesPrice,purchasePrice,taxCategory,taxRate,sku,barcode,trackInventory\nPRODUCT,"Quoted, name","اسم",${unitId},1.00,0.50,STANDARD,15,,,false`,
    });
    expect(csvPreview.status).toBe(200);
    expect(csvPreview.body.rows[0].name).toBe("Quoted, name");
    const exported = await api("owner").get(`${path()}/export`);
    expect(exported.status).toBe(200);
    expect(exported.text).toContain(nonce);
    expect(exported.text).not.toContain("Foreign");
    const dashboard = await api("owner").get(`/api/organizations/${orgA}/dashboard`);
    expect(dashboard.status).toBe(200);
    expect(dashboard.body.itemCount).toBeGreaterThan(0);
    expect(dashboard.body.itemChecklist).toEqual({ hasItems: true, complete: true });
    const logs = await db.select().from(auditLogsTable).where(and(eq(auditLogsTable.organizationId, orgA), eq(auditLogsTable.entityType, "catalog_item")));
    expect(logs.some((log) => log.action === "created")).toBe(true);
  });
});