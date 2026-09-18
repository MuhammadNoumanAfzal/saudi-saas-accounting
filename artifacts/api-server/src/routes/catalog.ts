import { Router } from "express";
import { and, asc, desc, eq, ilike, or, sql } from "drizzle-orm";
import {
  catalogItemsTable, db, organizationUnitsTable, partySequenceCountersTable,
} from "@workspace/db";
import {
  CreateCatalogItemBody, GetCatalogItemParams, ListCatalogItemsQueryParams,
  UpdateCatalogItemBody, UpdateCatalogItemStatusBody, PreviewCatalogImportBody,
  ConfirmCatalogImportBody, ExportCatalogItemsQueryParams,
} from "@workspace/api-zod";
import { requireCatalogPermission } from "../middlewares/catalogAccess";
import { writeAuditLog } from "../lib/audit";
import { parseCsvRows } from "../lib/csv";

const router = Router();
const org = (req: any) => String(req.params.organizationId);
const now = () => new Date();
const defaults = [
  ["piece", "Piece", "قطعة"], ["unit", "Unit", "وحدة"], ["hour", "Hour", "ساعة"],
  ["day", "Day", "يوم"], ["month", "Month", "شهر"], ["meter", "Meter", "متر"],
  ["square_meter", "Square Meter", "متر مربع"], ["kilogram", "Kilogram", "كيلوجرام"],
  ["liter", "Liter", "لتر"], ["box", "Box", "صندوق"], ["service", "Service", "خدمة"],
] as const;
async function provisionUnits(organizationId: string) {
  for (const [code, name, nameAr] of defaults) {
    await db.insert(organizationUnitsTable).values({ organizationId, code, name, nameAr }).onConflictDoNothing();
  }
}
async function audit(req: any, action: string, id: string, previousValues: unknown, newValues: unknown) {
  await writeAuditLog({ organizationId: org(req), userId: req.res?.locals?.partyUser?.id, action, entityType: "catalog_item", entityId: id, previousValues, newValues, req });
}
async function nextCode(organizationId: string) {
  return db.transaction(async (tx) => {
    await tx.insert(partySequenceCountersTable).values({ organizationId, sequenceKey: "catalog_item", nextValue: 1 }).onConflictDoNothing();
    const [counter] = await tx.select().from(partySequenceCountersTable).where(and(eq(partySequenceCountersTable.organizationId, organizationId), eq(partySequenceCountersTable.sequenceKey, "catalog_item"))).for("update");
    const n = counter?.nextValue ?? 1;
    if (counter) await tx.update(partySequenceCountersTable).set({ nextValue: n + 1, updatedAt: now() }).where(eq(partySequenceCountersTable.id, counter.id));
    return `ITEM-${String(n).padStart(5, "0")}`;
  });
}
function parse(schema: any, value: unknown, res: any) {
  const parsed = schema.safeParse(value);
  if (!parsed.success) { res.status(400).json({ error: "Invalid input", details: parsed.error.issues }); return null; }
  return parsed.data;
}
async function validUnit(organizationId: string, id: string) {
  const [unit] = await db.select().from(organizationUnitsTable).where(and(eq(organizationUnitsTable.organizationId, organizationId), eq(organizationUnitsTable.id, id))).limit(1);
  return unit;
}
function validTax(category: string, rate: string) {
  return (category === "STANDARD" && rate === "15") || (category === "ZERO_RATED" && rate === "0") || (category === "EXEMPT" && rate === "0") || (category === "OUT_OF_SCOPE" && rate === "0");
}
router.get("/organizations/:organizationId/catalog/items", requireCatalogPermission("products.view"), async (req, res) => {
  const query = parse(ListCatalogItemsQueryParams, req.query, res); if (!query) return;
  await provisionUnits(org(req));
  const conditions: any[] = [eq(catalogItemsTable.organizationId, org(req))];
  if (query.search) { const s = `%${query.search}%`; conditions.push(or(ilike(catalogItemsTable.code, s), ilike(catalogItemsTable.name, s), ilike(catalogItemsTable.nameAr, s), ilike(catalogItemsTable.sku, s), ilike(catalogItemsTable.barcode, s))); }
  if (query.type) conditions.push(eq(catalogItemsTable.type, query.type));
  if (query.status) conditions.push(eq(catalogItemsTable.status, query.status));
  if (query.taxCategory) conditions.push(eq(catalogItemsTable.taxCategory, query.taxCategory));
  const page = query.page ?? 1, pageSize = query.pageSize ?? 25;
  const sort: any = ({ name: catalogItemsTable.name, code: catalogItemsTable.code, created: catalogItemsTable.createdAt, updated: catalogItemsTable.updatedAt } as any)[query.sort ?? "name"] ?? catalogItemsTable.name;
  const items = await db.select().from(catalogItemsTable).where(and(...conditions)).orderBy(asc(sort)).limit(pageSize).offset((page - 1) * pageSize);
  const [{ count }] = await db.select({ count: sql<number>`count(*)` }).from(catalogItemsTable).where(and(...conditions));
  const [[{ products }], [{ services }], [{ active }]] = await Promise.all([
    db.select({ products: sql<number>`count(*)` }).from(catalogItemsTable).where(and(...conditions, eq(catalogItemsTable.type, "PRODUCT"))),
    db.select({ services: sql<number>`count(*)` }).from(catalogItemsTable).where(and(...conditions, eq(catalogItemsTable.type, "SERVICE"))),
    db.select({ active: sql<number>`count(*)` }).from(catalogItemsTable).where(and(...conditions, eq(catalogItemsTable.status, "ACTIVE"))),
  ]);
  res.json({ items, page, pageSize, total: Number(count), summary: { total: Number(count), products: Number(products), services: Number(services), active: Number(active) } });
});
router.post("/organizations/:organizationId/catalog/items", requireCatalogPermission("products.create"), async (req, res) => {
  const body = parse(CreateCatalogItemBody, req.body, res); if (!body) return;
  if (body.type === "SERVICE" && body.trackInventory) return res.status(400).json({ error: "Services cannot track inventory" });
  if (!validTax(body.taxCategory, body.taxRate)) return res.status(400).json({ error: "Invalid tax rate for category" });
  await provisionUnits(org(req)); if (!(await validUnit(org(req), body.unitId))) return res.status(400).json({ error: "Unit not found" });
  const [item] = await db.insert(catalogItemsTable).values({ ...body, organizationId: org(req), code: await nextCode(org(req)), trackInventory: body.type === "SERVICE" ? false : (body.trackInventory ?? false), updatedAt: now() }).returning();
  await audit(req, "created", item.id, null, item); return res.status(201).json(item);
});
// Fixed catalog collection endpoints are declared before /:itemId routes.
router.get("/organizations/:organizationId/catalog/search", requireCatalogPermission("products.view"), async (req, res) => {
  const q = `%${String(req.query.q || "")}%`;
  const items = await db.select().from(catalogItemsTable).where(and(eq(catalogItemsTable.organizationId, org(req)), or(ilike(catalogItemsTable.code, q), ilike(catalogItemsTable.name, q), ilike(catalogItemsTable.nameAr, q), ilike(catalogItemsTable.sku, q), ilike(catalogItemsTable.barcode, q)))).limit(20);
  return res.json(items);
});
router.get("/organizations/:organizationId/catalog/export", requireCatalogPermission("products.export"), async (req, res) => {
  const query = parse(ExportCatalogItemsQueryParams, req.query, res); if (!query) return;
  const conditions: any[] = [eq(catalogItemsTable.organizationId, org(req))];
  if (query.search) { const s = `%${query.search}%`; conditions.push(or(ilike(catalogItemsTable.code, s), ilike(catalogItemsTable.name, s), ilike(catalogItemsTable.nameAr, s), ilike(catalogItemsTable.sku, s), ilike(catalogItemsTable.barcode, s))); }
  if (query.type) conditions.push(eq(catalogItemsTable.type, query.type));
  if (query.status) conditions.push(eq(catalogItemsTable.status, query.status));
  if (query.taxCategory) conditions.push(eq(catalogItemsTable.taxCategory, query.taxCategory));
  const items = await db.select().from(catalogItemsTable).where(and(...conditions));
  const quote = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  return res.type("text/csv").send([csvHeader, ...items.map((i) => [i.type, i.name, i.nameAr, i.unitId, i.salesPrice, i.purchasePrice, i.taxCategory, i.taxRate, i.sku, i.barcode, i.trackInventory].map(quote).join(","))].join("\n"));
});
router.get("/organizations/:organizationId/catalog/items/:itemId", requireCatalogPermission("products.view"), async (req, res) => {
  const p = parse(GetCatalogItemParams, req.params, res); if (!p) return;
  const [item] = await db.select().from(catalogItemsTable).where(and(eq(catalogItemsTable.organizationId, org(req)), eq(catalogItemsTable.id, p.itemId)));
  item ? res.json(item) : res.status(404).json({ error: "Item not found" });
});
router.patch("/organizations/:organizationId/catalog/items/:itemId", requireCatalogPermission("products.edit"), async (req, res) => {
  const params = parse(GetCatalogItemParams, req.params, res); const body = parse(UpdateCatalogItemBody, req.body, res); if (!params || !body) return;
  if (body.type === "SERVICE" && body.trackInventory) return res.status(400).json({ error: "Services cannot track inventory" });
  if (!validTax(body.taxCategory, body.taxRate)) return res.status(400).json({ error: "Invalid tax rate for category" });
  if (!(await validUnit(org(req), body.unitId))) return res.status(400).json({ error: "Unit not found" });
  const [old] = await db.select().from(catalogItemsTable).where(and(eq(catalogItemsTable.organizationId, org(req)), eq(catalogItemsTable.id, params.itemId)));
  if (!old) return res.status(404).json({ error: "Item not found" });
  const [item] = await db.update(catalogItemsTable).set({ ...body, trackInventory: body.type === "SERVICE" ? false : (body.trackInventory ?? false), updatedAt: now() }).where(and(eq(catalogItemsTable.organizationId, org(req)), eq(catalogItemsTable.id, params.itemId))).returning();
  await audit(req, "updated", item.id, old, item); return res.json(item);
});
router.patch("/organizations/:organizationId/catalog/items/:itemId/status", requireCatalogPermission("products.deactivate"), async (req, res) => {
  const params = parse(GetCatalogItemParams, req.params, res); const body = parse(UpdateCatalogItemStatusBody, req.body, res); if (!params || !body) return;
  const [old] = await db.select().from(catalogItemsTable).where(and(eq(catalogItemsTable.organizationId, org(req)), eq(catalogItemsTable.id, params.itemId)));
  if (!old) return res.status(404).json({ error: "Item not found" });
  const [item] = await db.update(catalogItemsTable).set({ status: body.status, updatedAt: now() }).where(and(eq(catalogItemsTable.organizationId, org(req)), eq(catalogItemsTable.id, params.itemId))).returning();
  await audit(req, body.status === "ACTIVE" ? "reactivated" : "deactivated", item.id, old, item); return res.json(item);
});
router.get("/organizations/:organizationId/catalog/units", requireCatalogPermission("products.view"), async (req, res) => { await provisionUnits(org(req)); res.json(await db.select().from(organizationUnitsTable).where(eq(organizationUnitsTable.organizationId, org(req))).orderBy(asc(organizationUnitsTable.name))); });
router.get("/organizations/:organizationId/catalog/tax-definitions", requireCatalogPermission("products.view"), async (_req, res) => res.json([
  { category: "STANDARD", rate: "15", name: "Standard VAT", nameAr: "ضريبة القيمة المضافة القياسية" },
  { category: "ZERO_RATED", rate: "0", name: "Zero Rated", nameAr: "صفرية" },
  { category: "EXEMPT", rate: "0", name: "Exempt", nameAr: "معفاة" },
  { category: "OUT_OF_SCOPE", rate: "0", name: "Out of Scope", nameAr: "خارج النطاق" },
]));
router.get("/organizations/:organizationId/catalog/search", requireCatalogPermission("products.view"), async (req, res) => {
  const q = `%${String(req.query.q || "")}%`;
  const items = await db.select().from(catalogItemsTable).where(and(eq(catalogItemsTable.organizationId, org(req)), or(ilike(catalogItemsTable.code, q), ilike(catalogItemsTable.name, q), ilike(catalogItemsTable.nameAr, q), ilike(catalogItemsTable.sku, q), ilike(catalogItemsTable.barcode, q)))).limit(20);
  return res.json(items);
});
const csvHeader = "type,name,nameAr,unitId,salesPrice,purchasePrice,taxCategory,taxRate,sku,barcode,trackInventory";
router.get("/organizations/:organizationId/catalog/import/template", requireCatalogPermission("products.export"), (_req, res) => res.type("text/csv").send(`${csvHeader}\n`));
router.post("/organizations/:organizationId/catalog/import/preview", requireCatalogPermission("products.import"), async (req, res) => {
  const body = parse(PreviewCatalogImportBody, req.body, res); if (!body) return;
  const rows = Array.isArray(body.rows) ? body.rows : parseCsvRows(String(body.csv || ""));
  const errors: unknown[] = [];
  rows.forEach((row: any, i: number) => {
    if (!["PRODUCT", "SERVICE"].includes(row.type)) errors.push({ row: i + 2, field: "type", error: "Must be PRODUCT or SERVICE" });
    if (!validTax(row.taxCategory, row.taxRate)) errors.push({ row: i + 2, field: "taxRate", error: "Invalid tax rate for category" });
    if (row.type === "SERVICE" && (row.trackInventory === true || row.trackInventory === "true")) errors.push({ row: i + 2, field: "trackInventory", error: "Services cannot track inventory" });
  });
  return res.json({ totalRows: rows.length, validRows: rows.length - errors.length, errors, rows });
});
router.post("/organizations/:organizationId/catalog/import/confirm", requireCatalogPermission("products.import"), async (req, res) => {
  const body = parse(ConfirmCatalogImportBody, req.body, res); if (!body) return;
  const rows = Array.isArray(body.rows) ? body.rows : parseCsvRows(String(body.csv || ""));
  const imported: unknown[] = [];
  for (const row of rows) {
    if (!["PRODUCT", "SERVICE"].includes(row.type) || !validTax(row.taxCategory, row.taxRate)) return res.status(400).json({ error: "Import contains invalid rows" });
    if (!(await validUnit(org(req), row.unitId))) return res.status(400).json({ error: "Unit not found" });
    const [item] = await db.insert(catalogItemsTable).values({
      ...row, organizationId: org(req), code: await nextCode(org(req)),
      trackInventory: row.type === "SERVICE" ? false : row.trackInventory === true || row.trackInventory === "true",
      updatedAt: now(),
    }).returning();
    imported.push(item); await audit(req, "imported", item.id, null, item);
  }
  return res.status(201).json({ imported: imported.length, skipped: 0 });
});
export default router;