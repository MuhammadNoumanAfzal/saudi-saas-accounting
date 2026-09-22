import { Router } from "express";
import { and, asc, desc, eq, ilike, or, sql } from "drizzle-orm";
import {
  db, businessPartiesTable, partyRolesTable, partyContactsTable,
  partyAddressesTable, organizationTagsTable, partyTagsTable,
  partyDocumentsTable, partySequenceCountersTable,
} from "@workspace/db";
import {
  CreateCustomerBody, CreateSupplierBody, UpdateCustomerBody, UpdateSupplierBody,
  UpdatePartyStatusBody, CreatePartyContactBody, UpdatePartyContactBody,
  CreatePartyAddressBody, UpdatePartyAddressBody,
} from "@workspace/api-zod";
import { requireAnyFinancePartyPermission, requireFinancePartyPermission } from "../middlewares/partyAccess";
import { writeAuditLog } from "../lib/audit";
import { ObjectStorageService, ObjectNotFoundError } from "../lib/objectStorage";
import { Readable } from "node:stream";
import { parseCsvRows } from "../lib/csv";

const router = Router();
const storage = new ObjectStorageService();
const org = (req: any) => String(req.params.organizationId);
const party = (req: any) => String(req.params.partyId);
const permission = (role: string, action: string) => `${role}s.${action}` as any;
const now = () => new Date();
const clean = (v: any) => v === "" ? null : v;
function name(v: any) { return v.businessNameEnglish || v.legalNameEnglish || [v.firstName, v.lastName].filter(Boolean).join(" ") || v.businessNameArabic || v.legalNameArabic || v.arabicName || "Unnamed party"; }
function validVat(v: any) { 
  if (!v.vatRegistered || !v.vatNumber) return true;
  const trimmed = String(v.vatNumber).trim();
  return /^\d{15}$/.test(trimmed) && trimmed.startsWith("3") && trimmed.endsWith("3");
}
function safe(v: any) { const out = { ...v }; delete out.objectPath; delete out.bytes; delete out.size; return out; }
async function audit(req: any, action: string, entityType: string, entityId: string | undefined, previousValues?: any, newValues?: any) {
  await writeAuditLog({ organizationId: org(req), userId: req.res?.locals?.partyUser?.id, action, entityType, entityId, previousValues: safe(previousValues), newValues: safe(newValues), req });
}
async function getParty(organizationId: string, partyId: string) {
  const [p] = await db.select().from(businessPartiesTable).where(and(eq(businessPartiesTable.organizationId, organizationId), eq(businessPartiesTable.id, partyId))).limit(1);
  if (!p) return null;
  const [roles, contacts, addresses, tags, documents] = await Promise.all([
    db.select().from(partyRolesTable).where(and(eq(partyRolesTable.organizationId, organizationId), eq(partyRolesTable.partyId, partyId))),
    db.select().from(partyContactsTable).where(and(eq(partyContactsTable.organizationId, organizationId), eq(partyContactsTable.partyId, partyId))),
    db.select().from(partyAddressesTable).where(and(eq(partyAddressesTable.organizationId, organizationId), eq(partyAddressesTable.partyId, partyId))),
    db.select({ id: organizationTagsTable.id, name: organizationTagsTable.name, color: organizationTagsTable.color }).from(partyTagsTable).innerJoin(organizationTagsTable, eq(partyTagsTable.tagId, organizationTagsTable.id)).where(and(eq(partyTagsTable.organizationId, organizationId), eq(partyTagsTable.partyId, partyId))),
    db.select().from(partyDocumentsTable).where(and(eq(partyDocumentsTable.organizationId, organizationId), eq(partyDocumentsTable.partyId, partyId))),
  ]);
  return { ...p, roles, contacts, addresses, tags, documents };
}
async function nextNumber(organizationId: string, role: string) {
  return db.transaction(async tx => {
    const key = role === "customer" ? "customer" : "supplier";
    await tx.insert(partySequenceCountersTable).values({ organizationId, sequenceKey: key, nextValue: 1 }).onConflictDoNothing();
    const [counter] = await tx.select().from(partySequenceCountersTable).where(and(eq(partySequenceCountersTable.organizationId, organizationId), eq(partySequenceCountersTable.sequenceKey, key))).for("update");
    const n = counter?.nextValue ?? 1;
    if (counter) await tx.update(partySequenceCountersTable).set({ nextValue: n + 1, updatedAt: now() }).where(eq(partySequenceCountersTable.id, counter.id));
    else await tx.insert(partySequenceCountersTable).values({ organizationId, sequenceKey: key, nextValue: 2 });
    return `${role === "customer" ? "CUS" : "SUP"}-${String(n).padStart(5, "0")}`;
  });
}
function parse(schema: any, body: any, res: any) {
  const result = schema.safeParse(body);
  if (!result.success) { res.status(400).json({ error: "Invalid input", details: result.error.issues }); return null; }
  return result.data;
}
async function create(req: any, res: any, role: string) {
  const body = parse(role === "customer" ? CreateCustomerBody : CreateSupplierBody, req.body, res);
  if (!body) return;
  if (body.vatNumber) body.vatNumber = String(body.vatNumber).trim();
  if (!validVat(body)) return res.status(400).json({ error: "VAT number must contain 15 digits and start and end with 3" });
  const organizationId = org(req);
  const partyNumber = await nextNumber(organizationId, role);
  const values: any = { ...body, organizationId, displayName: name(body), updatedAt: now() };
  for (const k of ["paymentTerms", "creditLimit", "taxTreatment"]) delete values[k];
  const [p] = await db.insert(businessPartiesTable).values(values).returning();
  const [r] = await db.insert(partyRolesTable).values({ organizationId, partyId: p.id, role, partyNumber, paymentTerms: body.paymentTerms, creditLimit: body.creditLimit, taxTreatment: body.taxTreatment }).returning();
  const result = { p, r };
  await audit(req, "created", "business_party", result.p.id, null, result.p);
  await audit(req, "role_added", "party_role", result.r.id, null, result.r);
  res.status(201).json({ ...result.p, roles: [result.r], contacts: [], addresses: [], tags: [], documents: [] });
}
async function list(req: any, res: any, role: string) {
  const q = String(req.query.search || ""); const conditions: any[] = [eq(businessPartiesTable.organizationId, org(req)), eq(partyRolesTable.role, role)];
  if (q) { const s = `%${q}%`; conditions.push(or(...[businessPartiesTable.displayName, businessPartiesTable.businessNameEnglish, businessPartiesTable.businessNameArabic, businessPartiesTable.arabicName, businessPartiesTable.primaryEmail, businessPartiesTable.primaryPhone, businessPartiesTable.vatNumber, businessPartiesTable.commercialRegistrationNumber].map(c => ilike(c, s)), ilike(partyRolesTable.partyNumber, s))); }
  for (const [key, col] of [["status", businessPartiesTable.status], ["partyType", businessPartiesTable.partyType], ["vatRegistered", businessPartiesTable.vatRegistered]] as any[]) if (req.query[key] !== undefined) conditions.push(eq(col, key === "vatRegistered" ? String(req.query[key]) === "true" : String(req.query[key])));
  if (req.query.city) conditions.push(sql`exists (
    select 1 from party_addresses pa
    where pa.organization_id = ${org(req)}
      and pa.party_id = ${businessPartiesTable.id}
      and pa.city ilike ${`%${String(req.query.city)}%`}
  )`);
  if (req.query.tagId) conditions.push(sql`exists (
    select 1 from party_tags pt
    where pt.organization_id = ${org(req)}
      and pt.party_id = ${businessPartiesTable.id}
      and pt.tag_id = ${String(req.query.tagId)}
  )`);
  const page = Math.max(1, Number(req.query.page || 1)), pageSize = Math.min(100, Math.max(1, Number(req.query.pageSize || 25)));
  const sort: any = ({ name: businessPartiesTable.displayName, number: partyRolesTable.partyNumber, created: businessPartiesTable.createdAt, updated: businessPartiesTable.updatedAt } as any)[req.query.sort || "name"] || businessPartiesTable.displayName;
  const rows = await db.select({ party: businessPartiesTable, role: partyRolesTable }).from(businessPartiesTable).innerJoin(partyRolesTable, eq(partyRolesTable.partyId, businessPartiesTable.id)).where(and(...conditions)).orderBy(asc(sort)).limit(pageSize).offset((page - 1) * pageSize);
  const [{ count }] = await db.select({ count: sql<number>`count(*)` }).from(businessPartiesTable).innerJoin(partyRolesTable, eq(partyRolesTable.partyId, businessPartiesTable.id)).where(and(...conditions));
  res.json({ items: rows.map(x => ({ ...x.party, roles: [x.role] })), page, pageSize, total: Number(count), summary: { total: Number(count), active: rows.filter(x => x.party.status === "active").length, withBalance: 0 } });
}
router.get(
  "/organizations/:organizationId/:role/export",
  async (req: any, res, next) => {
    const required = importPermission(req, "export");
    if (!required) return res.status(400).json({ error: "Invalid role" });
    return requireFinancePartyPermission(required)(req, res, next);
  },
  exportParties,
);
function partyRoutes(role: string) {
  router.get(`/organizations/:organizationId/${role}s`, requireFinancePartyPermission(permission(role, "view")), (req, res) => list(req, res, role));
  router.post(`/organizations/:organizationId/${role}s`, requireFinancePartyPermission(permission(role, "create")), (req, res) => create(req, res, role));
  router.get(`/organizations/:organizationId/${role}s/:partyId`, requireFinancePartyPermission(permission(role, "view")), async (req, res) => {
    const p = await getParty(org(req), party(req));
    p?.roles.some((item: any) => item.role === role) ? res.json(p) : res.status(404).json({ error: "Party not found" });
  });
  router.patch(`/organizations/:organizationId/${role}s/:partyId`, requireFinancePartyPermission(permission(role, "edit")), async (req: any, res) => {
    const body = parse(role === "customer" ? UpdateCustomerBody : UpdateSupplierBody, req.body, res); if (!body) return;
    if (!validVat(body)) return res.status(400).json({ error: "VAT number must contain 15 digits and start and end with 3" });
    const old = await getParty(org(req), party(req)); if (!old) return res.status(404).json({ error: "Party not found" });
    const values: any = Object.fromEntries(Object.entries(body).filter(([, v]) => v !== undefined));
    const roleSettings = Object.fromEntries(
      ["paymentTerms", "creditLimit", "taxTreatment"]
        .filter((key) => values[key] !== undefined)
        .map((key) => [key, values[key]]),
    );
    for (const key of ["paymentTerms", "creditLimit", "taxTreatment"]) delete values[key];
    if (Object.keys(values).some(k => k.includes("Name") || ["firstName", "lastName", "arabicName"].includes(k))) values.displayName = name({ ...old, ...values }); values.updatedAt = now();
    const [updated] = await db.update(businessPartiesTable).set(values).where(and(eq(businessPartiesTable.organizationId, org(req)), eq(businessPartiesTable.id, party(req)))).returning();
    if (Object.keys(roleSettings).length) await db.update(partyRolesTable).set({ ...roleSettings, updatedAt: now() }).where(and(
      eq(partyRolesTable.organizationId, org(req)),
      eq(partyRolesTable.partyId, party(req)),
      eq(partyRolesTable.role, role),
    ));
    await audit(req, "updated", "business_party", updated.id, old, updated); return res.json(await getParty(org(req), party(req)));
  });
}
partyRoutes("customer"); partyRoutes("supplier");
router.patch("/organizations/:organizationId/parties/:partyId/status", requireAnyFinancePartyPermission(["customers.deactivate", "suppliers.deactivate"]), async (req: any, res) => {
  const body = parse(UpdatePartyStatusBody, req.body, res); if (!body) return; const old = await getParty(org(req), party(req)); if (!old) return res.status(404).json({ error: "Party not found" });
  const [p] = await db.update(businessPartiesTable).set({ status: body.status, updatedAt: now() }).where(and(eq(businessPartiesTable.organizationId, org(req)), eq(businessPartiesTable.id, party(req)))).returning();
  await audit(req, "status_changed", "business_party", p.id, { status: old.status }, { status: p.status }); return res.json(await getParty(org(req), party(req)));
});
router.post("/organizations/:organizationId/parties/:partyId/roles/:role", requireFinancePartyPermission("customers.create"), async (req: any, res) => {
  const role = String(req.params.role); if (!["customer", "supplier"].includes(role)) return res.status(400).json({ error: "Invalid role" }); const p = await getParty(org(req), party(req)); if (!p) return res.status(404).json({ error: "Party not found" });
  if (p.roles.some((r: any) => r.role === role)) return res.status(409).json({ error: "Role already exists" }); const [r] = await db.insert(partyRolesTable).values({ organizationId: org(req), partyId: party(req), role, partyNumber: await nextNumber(org(req), role), ...req.body }).returning(); await audit(req, "role_added", "party_role", r.id, null, r); return res.status(201).json(r);
});
async function child(req: any, res: any, kind: "contacts" | "addresses", action: string) {
  const table: any = kind === "contacts" ? partyContactsTable : partyAddressesTable; const base = { organizationId: org(req), partyId: party(req) };
  if (!(await getParty(org(req), party(req)))) return res.status(404).json({ error: "Party not found" });
  if (action === "list") return res.json(await db.select().from(table).where(and(eq(table.organizationId, base.organizationId), eq(table.partyId, base.partyId))));
  const childId = String(req.params[`${kind === "contacts" ? "contact" : "address"}Id`]);
  if (action === "create") {
    const schema = kind === "contacts" ? CreatePartyContactBody : CreatePartyAddressBody;
    const body = parse(schema, req.body, res); if (!body) return;
    if (kind === "contacts" && body.isPrimary) await db.update(partyContactsTable).set({ isPrimary: false, updatedAt: now() }).where(and(eq(partyContactsTable.organizationId, base.organizationId), eq(partyContactsTable.partyId, base.partyId)));
    if (kind === "addresses" && body.isDefaultBilling) await db.update(partyAddressesTable).set({ isDefaultBilling: false, updatedAt: now() }).where(and(eq(partyAddressesTable.organizationId, base.organizationId), eq(partyAddressesTable.partyId, base.partyId)));
    if (kind === "addresses" && body.isDefaultShipping) await db.update(partyAddressesTable).set({ isDefaultShipping: false, updatedAt: now() }).where(and(eq(partyAddressesTable.organizationId, base.organizationId), eq(partyAddressesTable.partyId, base.partyId)));
    const inserted: any = await db.insert(table).values({ ...body, ...base, updatedAt: now() }).returning(); const row = inserted[0]; await audit(req, "created", kind.slice(0, -1), row.id, null, row); return res.status(201).json(row);
  }
  const [old] = await db.select().from(table).where(and(eq(table.id, childId), eq(table.organizationId, base.organizationId), eq(table.partyId, base.partyId))); if (!old) return res.status(404).json({ error: "Not found" });
  if (action === "delete") { await db.delete(table).where(eq(table.id, childId)); await audit(req, "deleted", kind.slice(0, -1), childId, old, null); return res.status(204).send(); }
  const schema = kind === "contacts" ? UpdatePartyContactBody.partial() : UpdatePartyAddressBody.partial();
  const body = parse(schema, req.body, res); if (!body) return;
  if (kind === "contacts" && body.isPrimary) await db.update(partyContactsTable).set({ isPrimary: false, updatedAt: now() }).where(and(eq(partyContactsTable.organizationId, base.organizationId), eq(partyContactsTable.partyId, base.partyId)));
  if (kind === "addresses" && body.isDefaultBilling) await db.update(partyAddressesTable).set({ isDefaultBilling: false, updatedAt: now() }).where(and(eq(partyAddressesTable.organizationId, base.organizationId), eq(partyAddressesTable.partyId, base.partyId)));
  if (kind === "addresses" && body.isDefaultShipping) await db.update(partyAddressesTable).set({ isDefaultShipping: false, updatedAt: now() }).where(and(eq(partyAddressesTable.organizationId, base.organizationId), eq(partyAddressesTable.partyId, base.partyId)));
  const [row] = await db.update(table).set({ ...body, updatedAt: now() }).where(and(eq(table.id, childId), eq(table.organizationId, base.organizationId), eq(table.partyId, base.partyId))).returning(); await audit(req, "updated", kind.slice(0, -1), childId, old, row); return res.json(row);
}
for (const kind of ["contacts", "addresses"] as const) {
  const singular = kind === "contacts" ? "contact" : "address";
  for (const method of ["get", "post", "patch", "delete"] as const) {
    const action = method === "get" ? "list" : method === "post" ? "create" : method;
    (router as any)[method](
      `/organizations/:organizationId/parties/:partyId/${kind}${method === "patch" || method === "delete" ? `/:${singular}Id` : ""}`,
      requireFinancePartyPermission("contacts.manage"),
      (req: any, res: any) => child(req, res, kind, action),
    );
  }
}
router.get("/organizations/:organizationId/party-search", requireFinancePartyPermission("customers.view"), async (req, res) => { const q = `%${String(req.query.q || "")}%`; const rows = await db.select({ p: businessPartiesTable, r: partyRolesTable }).from(businessPartiesTable).innerJoin(partyRolesTable, eq(partyRolesTable.partyId, businessPartiesTable.id)).where(and(eq(businessPartiesTable.organizationId, org(req)), or(...[businessPartiesTable.displayName, businessPartiesTable.businessNameEnglish, businessPartiesTable.businessNameArabic, businessPartiesTable.arabicName, businessPartiesTable.primaryEmail, businessPartiesTable.primaryPhone, businessPartiesTable.vatNumber, businessPartiesTable.commercialRegistrationNumber, partyRolesTable.partyNumber].map(c => ilike(c, q))))).limit(20); res.json(rows.map(x => ({ ...x.p, role: x.r.role, type: x.p.partyType, number: x.r.partyNumber }))); });
router.get("/organizations/:organizationId/parties/:partyId/documents", requireFinancePartyPermission("party_documents.manage"), async (req, res) => res.json(await db.select().from(partyDocumentsTable).where(and(eq(partyDocumentsTable.organizationId, org(req)), eq(partyDocumentsTable.partyId, party(req))))));
router.post("/organizations/:organizationId/parties/:partyId/documents", requireFinancePartyPermission("party_documents.manage"), async (req: any, res) => { if (!/^\/objects\/[^/]+(?:\/[^/]+)*$/.test(String(req.body.objectPath || ""))) return res.status(400).json({ error: "objectPath must be normalized" }); const inserted: any = await db.insert(partyDocumentsTable).values({ ...req.body, organizationId: org(req), partyId: party(req), uploadedBy: res.locals.partyUser?.id }).returning(); const d = inserted[0]; await audit(req, "created", "party_document", d.id, null, { fileName: d.fileName, documentType: d.documentType }); return res.status(201).json(d); });
router.patch("/organizations/:organizationId/parties/:partyId/documents/:documentId", requireFinancePartyPermission("party_documents.manage"), async (req: any, res) => { const [d] = await db.update(partyDocumentsTable).set({ fileName: req.body.fileName, updatedAt: now() }).where(and(eq(partyDocumentsTable.id, String(req.params.documentId)), eq(partyDocumentsTable.organizationId, org(req)), eq(partyDocumentsTable.partyId, party(req)))).returning(); if (!d) return res.status(404).json({ error: "Document not found" }); await audit(req, "updated", "party_document", d.id, null, { fileName: d.fileName }); return res.json(d); });
router.get("/organizations/:organizationId/parties/:partyId/documents/:documentId/download", requireFinancePartyPermission("party_documents.manage"), async (req, res) => { const [d] = await db.select().from(partyDocumentsTable).where(and(eq(partyDocumentsTable.organizationId, org(req)), eq(partyDocumentsTable.partyId, party(req)), eq(partyDocumentsTable.id, String(req.params.documentId)))); if (!d) return res.status(404).json({ error: "Document not found" }); try { const r = await storage.downloadObject(await storage.getObjectEntityFile(d.objectPath)); res.status(r.status); r.headers.forEach((v, k) => res.setHeader(k, v)); if (r.body) Readable.fromWeb(r.body as ReadableStream<Uint8Array>).pipe(res); else res.end(); return; } catch (e) { return res.status(e instanceof ObjectNotFoundError ? 404 : 500).json({ error: "Failed to download document" }); } });
router.delete("/organizations/:organizationId/parties/:partyId/documents/:documentId", requireFinancePartyPermission("party_documents.manage"), async (req, res) => {
  const [d] = await db.delete(partyDocumentsTable).where(and(eq(partyDocumentsTable.id, String(req.params.documentId)), eq(partyDocumentsTable.organizationId, org(req)), eq(partyDocumentsTable.partyId, party(req)))).returning();
  if (!d) return res.status(404).json({ error: "Document not found" });
  try { await (await storage.getObjectEntityFile(d.objectPath)).delete(); } catch { /* Metadata removal remains safe if the object is already gone. */ }
  await audit(req, "deleted", "party_document", d.id, { fileName: d.fileName }, null);
  return res.status(204).send();
});
function importRole(req: any) { const role = String(req.params.role); return role === "customers" ? "customer" : role === "suppliers" ? "supplier" : null; }
function importPermission(req: any, action: string) { const role = importRole(req); return role ? `${role}s.${action}` as any : null; }
router.get("/organizations/:organizationId/:role/import/template", async (req: any, res, next) => { const p = importPermission(req, "export"); if (!p) return res.status(400).json({ error: "Invalid role" }); return requireFinancePartyPermission(p)(req, res, next); }, (req, res) => res.type("text/csv").send("partyType,businessNameEnglish,businessNameArabic,firstName,lastName,commercialRegistrationNumber,vatRegistered,vatNumber,primaryEmail,primaryPhone\norganization,,,,,,,false,,,\n"));
router.post("/organizations/:organizationId/:role/import/preview", async (req: any, res, next) => { const p = importPermission(req, "import"); if (!p) return res.status(400).json({ error: "Invalid role" }); return requireFinancePartyPermission(p)(req, res, next); }, async (req: any, res) => {
  const rows = Array.isArray(req.body.rows) ? req.body.rows : parseCsvRows(String(req.body.csv || "")); const errors: any[] = [];
  rows.forEach((r: any, i: number) => { if (!["organization", "individual"].includes(r.partyType)) errors.push({ row: i + 2, field: "partyType", error: "Must be organization or individual" }); if (r.vatRegistered === "true" && !(/^\d{15}$/.test(r.vatNumber || "") && String(r.vatNumber).startsWith("3") && String(r.vatNumber).endsWith("3"))) errors.push({ row: i + 2, field: "vatNumber", error: "Invalid Saudi VAT format" }); });
  res.json({ role: importRole(req), totalRows: rows.length, validRows: rows.length - errors.length, errors, rows });
});
router.post("/organizations/:organizationId/:role/import/confirm", async (req: any, res, next) => { const p = importPermission(req, "import"); if (!p) return res.status(400).json({ error: "Invalid role" }); return requireFinancePartyPermission(p)(req, res, next); }, async (req: any, res) => {
  const role = importRole(req)!; const rows = Array.isArray(req.body.rows) ? req.body.rows : parseCsvRows(String(req.body.csv || "")); const invalid = rows.filter((r: any) => !["organization", "individual"].includes(r.partyType) || (r.vatRegistered === "true" && !(/^\d{15}$/.test(r.vatNumber || "") && String(r.vatNumber).startsWith("3") && String(r.vatNumber).endsWith("3"))));
  if (invalid.length) return res.status(400).json({ error: "Import contains invalid rows", invalidRows: invalid.length });
  for (const row of rows) { const body = { ...row, vatRegistered: row.vatRegistered === true || row.vatRegistered === "true" }; const [p] = await db.insert(businessPartiesTable).values({ ...body, organizationId: org(req), displayName: name(body) } as any).returning(); const r = await nextNumber(org(req), role); await db.insert(partyRolesTable).values({ organizationId: org(req), partyId: p.id, role, partyNumber: r }); await audit(req, "imported", "business_party", p.id, null, p); }
  return res.status(201).json({ imported: rows.length, skipped: 0 });
});
async function exportParties(req: any, res: any) {
  const role = importRole(req)!;
  const rows = await db.select({
    partyNumber: partyRolesTable.partyNumber,
    partyType: businessPartiesTable.partyType,
    displayName: businessPartiesTable.displayName,
    businessNameEnglish: businessPartiesTable.businessNameEnglish,
    businessNameArabic: businessPartiesTable.businessNameArabic,
    vatNumber: businessPartiesTable.vatNumber,
    commercialRegistrationNumber: businessPartiesTable.commercialRegistrationNumber,
    city: businessPartiesTable.city,
    primaryEmail: businessPartiesTable.primaryEmail,
    primaryPhone: businessPartiesTable.primaryPhone,
    status: businessPartiesTable.status,
  }).from(businessPartiesTable)
    .innerJoin(partyRolesTable, and(
      eq(partyRolesTable.partyId, businessPartiesTable.id),
      eq(partyRolesTable.organizationId, businessPartiesTable.organizationId),
    ))
    .where(and(
      eq(businessPartiesTable.organizationId, org(req)),
      eq(partyRolesTable.organizationId, org(req)),
      eq(partyRolesTable.role, role),
    ));
  const headers = ["partyNumber", "partyType", "displayName", "businessNameEnglish", "businessNameArabic", "vatNumber", "commercialRegistrationNumber", "city", "primaryEmail", "primaryPhone", "status"] as const;
  const quote = (x: unknown) => `"${String(x ?? "").replace(/"/g, '""')}"`;
  return res.type("text/csv").send([
    headers.join(","),
    ...rows.map((row) => headers.map((header) => quote(row[header])).join(",")),
  ].join("\n"));
}
export default router;