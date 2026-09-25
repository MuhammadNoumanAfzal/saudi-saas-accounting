import { Router, type IRouter } from "express";
import { and, desc, eq, ilike, or, sql } from "drizzle-orm";
import {
  db,
  quotationsTable,
  quotationItemsTable,
  quotationSequenceCountersTable,
  businessPartiesTable,
  catalogItemsTable,
} from "@workspace/db";
import {
  CreateQuotationBody,
  UpdateQuotationBody,
  UpdateQuotationStatusBody,
} from "@workspace/api-zod";
import { requireAuthentication } from "../middlewares/auth";
import { requireModule } from "../middlewares/moduleEntitlement";
import { writeAuditLog } from "../lib/audit";

const router: IRouter = Router();
router.use(requireAuthentication);
router.use("/organizations/:organizationId", requireModule("finance"));

const getOrgId = (req: any) => String(req.params.organizationId);
const getQuotationId = (req: any) => String(req.params.quotationId);

// Helper to calculate line items & quotation totals deterministically
function calculateQuotationTotals(items: Array<any>) {
  let subtotalAcc = 0;
  let discountAcc = 0;
  let taxAcc = 0;

  const processedItems = items.map((item, index) => {
    const qty = Math.max(0, parseFloat(item.quantity) || 1);
    const unitPrice = Math.max(0, parseFloat(item.unitPrice) || 0);
    const discount = Math.max(0, parseFloat(item.discountAmount) || 0);
    
    // Tax category rate logic
    let taxRate = 15.00;
    if (item.taxCategory === "ZERO" || item.taxCategory === "EXEMPT" || item.taxCategory === "OUT_OF_SCOPE") {
      taxRate = 0.00;
    } else if (item.taxRate !== undefined && item.taxRate !== null) {
      taxRate = Math.max(0, parseFloat(item.taxRate));
    }

    const lineSubtotalRaw = Math.max(0, (qty * unitPrice) - discount);
    const lineTaxRaw = (lineSubtotalRaw * taxRate) / 100;
    const lineTotalRaw = lineSubtotalRaw + lineTaxRaw;

    subtotalAcc += lineSubtotalRaw;
    discountAcc += discount;
    taxAcc += lineTaxRaw;

    return {
      catalogItemId: item.catalogItemId || null,
      itemCode: item.itemCode || null,
      description: item.description,
      descriptionAr: item.descriptionAr || null,
      unitId: item.unitId || null,
      quantity: qty.toFixed(4),
      unitPrice: unitPrice.toFixed(2),
      discountAmount: discount.toFixed(2),
      taxCategory: item.taxCategory || "STANDARD",
      taxRate: taxRate.toFixed(2),
      taxAmount: lineTaxRaw.toFixed(2),
      lineTotal: lineTotalRaw.toFixed(2),
      sortOrder: index,
    };
  });

  const totalAmountAcc = subtotalAcc + taxAcc;

  return {
    items: processedItems,
    subtotal: subtotalAcc.toFixed(2),
    discountAmount: discountAcc.toFixed(2),
    taxAmount: taxAcc.toFixed(2),
    totalAmount: totalAmountAcc.toFixed(2),
  };
}

// Concurrency-safe quotation number sequence generator
async function generateNextQuotationNumber(organizationId: string): Promise<string> {
  return db.transaction(async (tx) => {
    await tx
      .insert(quotationSequenceCountersTable)
      .values({ organizationId, nextValue: 1 })
      .onConflictDoNothing();

    const [counter] = await tx
      .select()
      .from(quotationSequenceCountersTable)
      .where(eq(quotationSequenceCountersTable.organizationId, organizationId))
      .for("update");

    const nextVal = counter?.nextValue ?? 1;

    if (counter) {
      await tx
        .update(quotationSequenceCountersTable)
        .set({ nextValue: nextVal + 1, updatedAt: new Date() })
        .where(eq(quotationSequenceCountersTable.id, counter.id));
    }

    return `QT-${String(nextVal).padStart(5, "0")}`;
  });
}

// Fetch single quotation with items and customer details
async function getFullQuotation(organizationId: string, quotationId: string) {
  const [q] = await db
    .select({
      quotation: quotationsTable,
      customerName: businessPartiesTable.displayName,
    })
    .from(quotationsTable)
    .leftJoin(businessPartiesTable, eq(quotationsTable.customerId, businessPartiesTable.id))
    .where(
      and(
        eq(quotationsTable.organizationId, organizationId),
        eq(quotationsTable.id, quotationId),
      ),
    )
    .limit(1);

  if (!q) return null;

  const items = await db
    .select()
    .from(quotationItemsTable)
    .where(
      and(
        eq(quotationItemsTable.organizationId, organizationId),
        eq(quotationItemsTable.quotationId, quotationId),
      ),
    )
    .orderBy(quotationItemsTable.sortOrder);

  return {
    ...q.quotation,
    customerName: q.customerName,
    issueDate: q.quotation.issueDate.toISOString(),
    validUntilDate: q.quotation.validUntilDate ? q.quotation.validUntilDate.toISOString() : null,
    createdAt: q.quotation.createdAt.toISOString(),
    updatedAt: q.quotation.updatedAt.toISOString(),
    items,
  };
}

// ---------------------------------------------------------------------------
// Route Handlers
// ---------------------------------------------------------------------------

// GET /api/organizations/:organizationId/quotations
router.get("/organizations/:organizationId/quotations", async (req, res): Promise<void> => {
  const organizationId = getOrgId(req);
  const search = typeof req.query.search === "string" ? req.query.search.trim() : "";
  const status = typeof req.query.status === "string" ? req.query.status.trim() : "";
  const customerId = typeof req.query.customerId === "string" ? req.query.customerId.trim() : "";
  const page = Math.max(1, parseInt(String(req.query.page || "1"), 10));
  const pageSize = Math.min(100, Math.max(1, parseInt(String(req.query.pageSize || "25"), 10)));
  const offset = (page - 1) * pageSize;

  const conditions = [eq(quotationsTable.organizationId, organizationId)];

  if (search) {
    conditions.push(
      or(
        ilike(quotationsTable.quotationNumber, `%${search}%`),
        ilike(businessPartiesTable.displayName, `%${search}%`),
      )!,
    );
  }

  if (status) {
    conditions.push(eq(quotationsTable.status, status));
  }

  if (customerId) {
    conditions.push(eq(quotationsTable.customerId, customerId));
  }

  const whereClause = and(...conditions);

  const [totalResult] = await db
    .select({ count: sql<number>`count(*)` })
    .from(quotationsTable)
    .leftJoin(businessPartiesTable, eq(quotationsTable.customerId, businessPartiesTable.id))
    .where(whereClause);

  const total = Number(totalResult?.count || 0);

  const rows = await db
    .select({
      quotation: quotationsTable,
      customerName: businessPartiesTable.displayName,
    })
    .from(quotationsTable)
    .leftJoin(businessPartiesTable, eq(quotationsTable.customerId, businessPartiesTable.id))
    .where(whereClause)
    .orderBy(desc(quotationsTable.createdAt))
    .limit(pageSize)
    .offset(offset);

  const quotationIds = rows.map((r) => r.quotation.id);

  let itemsMap: Record<string, Array<any>> = {};
  if (quotationIds.length > 0) {
    const allItems = await db
      .select()
      .from(quotationItemsTable)
      .where(and(eq(quotationItemsTable.organizationId, organizationId)));

    for (const item of allItems) {
      if (!itemsMap[item.quotationId]) itemsMap[item.quotationId] = [];
      itemsMap[item.quotationId].push(item);
    }
  }

  const items = rows.map((r) => ({
    ...r.quotation,
    customerName: r.customerName,
    issueDate: r.quotation.issueDate.toISOString(),
    validUntilDate: r.quotation.validUntilDate ? r.quotation.validUntilDate.toISOString() : null,
    createdAt: r.quotation.createdAt.toISOString(),
    updatedAt: r.quotation.updatedAt.toISOString(),
    items: itemsMap[r.quotation.id] || [],
  }));

  res.json({ items, total, page, pageSize });
});

// POST /api/organizations/:organizationId/quotations
router.post("/organizations/:organizationId/quotations", async (req, res): Promise<void> => {
  const organizationId = getOrgId(req);
  const parsed = CreateQuotationBody.safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({ error: "Invalid quotation data", details: parsed.error.issues });
    return;
  }

  const body = parsed.data;

  // Verify customer belongs to organization
  const [customer] = await db
    .select()
    .from(businessPartiesTable)
    .where(
      and(
        eq(businessPartiesTable.organizationId, organizationId),
        eq(businessPartiesTable.id, body.customerId),
      ),
    )
    .limit(1);

  if (!customer) {
    res.status(400).json({ error: "Customer not found in this organization" });
    return;
  }

  const quotationNumber = await generateNextQuotationNumber(organizationId);
  const calculated = calculateQuotationTotals(body.items);

  const [createdQuotation] = await db
    .insert(quotationsTable)
    .values({
      organizationId,
      quotationNumber,
      customerId: body.customerId,
      issueDate: body.issueDate ? new Date(body.issueDate) : new Date(),
      validUntilDate: body.validUntilDate ? new Date(body.validUntilDate) : null,
      currency: body.currency || "SAR",
      subtotal: calculated.subtotal,
      discountAmount: calculated.discountAmount,
      taxAmount: calculated.taxAmount,
      totalAmount: calculated.totalAmount,
      status: "DRAFT",
      notes: body.notes || null,
      terms: body.terms || null,
    })
    .returning();

  if (calculated.items.length > 0) {
    await db.insert(quotationItemsTable).values(
      calculated.items.map((item) => ({
        ...item,
        organizationId,
        quotationId: createdQuotation.id,
      })),
    );
  }

  await writeAuditLog({
    organizationId,
    userId: res.locals?.partyUser?.id,
    action: "quotation.created",
    entityType: "quotation",
    entityId: createdQuotation.id,
    newValues: { quotationNumber, totalAmount: calculated.totalAmount },
    req,
  });

  const result = await getFullQuotation(organizationId, createdQuotation.id);
  res.status(201).json(result);
});

// GET /api/organizations/:organizationId/quotations/:quotationId
router.get("/organizations/:organizationId/quotations/:quotationId", async (req, res): Promise<void> => {
  const organizationId = getOrgId(req);
  const quotationId = getQuotationId(req);

  const quotation = await getFullQuotation(organizationId, quotationId);

  if (!quotation) {
    res.status(404).json({ error: "Quotation not found" });
    return;
  }

  res.json(quotation);
});

// PATCH /api/organizations/:organizationId/quotations/:quotationId
router.patch("/organizations/:organizationId/quotations/:quotationId", async (req, res): Promise<void> => {
  const organizationId = getOrgId(req);
  const quotationId = getQuotationId(req);

  const parsed = UpdateQuotationBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid quotation data", details: parsed.error.issues });
    return;
  }

  const existing = await getFullQuotation(organizationId, quotationId);
  if (!existing) {
    res.status(404).json({ error: "Quotation not found" });
    return;
  }

  const body = parsed.data;
  const updateData: Record<string, any> = { updatedAt: new Date() };

  if (body.customerId) updateData.customerId = body.customerId;
  if (body.issueDate !== undefined) updateData.issueDate = body.issueDate ? new Date(body.issueDate) : new Date();
  if (body.validUntilDate !== undefined) updateData.validUntilDate = body.validUntilDate ? new Date(body.validUntilDate) : null;
  if (body.currency) updateData.currency = body.currency;
  if (body.notes !== undefined) updateData.notes = body.notes;
  if (body.terms !== undefined) updateData.terms = body.terms;

  if (body.items) {
    const calculated = calculateQuotationTotals(body.items);
    updateData.subtotal = calculated.subtotal;
    updateData.discountAmount = calculated.discountAmount;
    updateData.taxAmount = calculated.taxAmount;
    updateData.totalAmount = calculated.totalAmount;

    // Replace items
    await db
      .delete(quotationItemsTable)
      .where(
        and(
          eq(quotationItemsTable.organizationId, organizationId),
          eq(quotationItemsTable.quotationId, quotationId),
        ),
      );

    if (calculated.items.length > 0) {
      await db.insert(quotationItemsTable).values(
        calculated.items.map((item) => ({
          ...item,
          organizationId,
          quotationId,
        })),
      );
    }
  }

  await db
    .update(quotationsTable)
    .set(updateData)
    .where(
      and(
        eq(quotationsTable.organizationId, organizationId),
        eq(quotationsTable.id, quotationId),
      ),
    );

  await writeAuditLog({
    organizationId,
    userId: res.locals?.partyUser?.id,
    action: "quotation.updated",
    entityType: "quotation",
    entityId: quotationId,
    previousValues: { status: existing.status, totalAmount: existing.totalAmount },
    newValues: updateData,
    req,
  });

  const updated = await getFullQuotation(organizationId, quotationId);
  res.json(updated);
});

// POST /api/organizations/:organizationId/quotations/:quotationId/status
router.post("/organizations/:organizationId/quotations/:quotationId/status", async (req, res): Promise<void> => {
  const organizationId = getOrgId(req);
  const quotationId = getQuotationId(req);

  const parsed = UpdateQuotationStatusBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid quotation status", details: parsed.error.issues });
    return;
  }

  const existing = await getFullQuotation(organizationId, quotationId);
  if (!existing) {
    res.status(404).json({ error: "Quotation not found" });
    return;
  }

  const { status } = parsed.data;

  await db
    .update(quotationsTable)
    .set({ status, updatedAt: new Date() })
    .where(
      and(
        eq(quotationsTable.organizationId, organizationId),
        eq(quotationsTable.id, quotationId),
      ),
    );

  await writeAuditLog({
    organizationId,
    userId: res.locals?.partyUser?.id,
    action: "quotation.status_updated",
    entityType: "quotation",
    entityId: quotationId,
    previousValues: { status: existing.status },
    newValues: { status },
    req,
  });

  const updated = await getFullQuotation(organizationId, quotationId);
  res.json(updated);
});

// DELETE /api/organizations/:organizationId/quotations/:quotationId
router.delete("/organizations/:organizationId/quotations/:quotationId", async (req, res): Promise<void> => {
  const organizationId = getOrgId(req);
  const quotationId = getQuotationId(req);

  const existing = await getFullQuotation(organizationId, quotationId);
  if (!existing) {
    res.status(404).json({ error: "Quotation not found" });
    return;
  }

  if (existing.status === "CONVERTED") {
    res.status(409).json({ error: "Converted quotations cannot be deleted" });
    return;
  }

  await db
    .delete(quotationItemsTable)
    .where(
      and(
        eq(quotationItemsTable.organizationId, organizationId),
        eq(quotationItemsTable.quotationId, quotationId),
      ),
    );

  await db
    .delete(quotationsTable)
    .where(
      and(
        eq(quotationsTable.organizationId, organizationId),
        eq(quotationsTable.id, quotationId),
      ),
    );

  await writeAuditLog({
    organizationId,
    userId: res.locals?.partyUser?.id,
    action: "quotation.deleted",
    entityType: "quotation",
    entityId: quotationId,
    previousValues: existing,
    req,
  });

  res.status(204).send();
});
export default router;
