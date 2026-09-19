import { Router, type IRouter } from "express";
import { and, desc, eq, ilike, or, sql } from "drizzle-orm";
import {
  db,
  invoicesTable,
  invoiceItemsTable,
  invoiceSequenceCountersTable,
  quotationsTable,
  quotationItemsTable,
  businessPartiesTable,
} from "@workspace/db";
import {
  CreateInvoiceBody,
  UpdateInvoiceBody,
  UpdateInvoiceStatusBody,
} from "@workspace/api-zod";
import { requireAuthentication } from "../middlewares/auth";
import { requireModule } from "../middlewares/moduleEntitlement";
import { writeAuditLog } from "../lib/audit";
import { generateZatcaTlvQrCode } from "../lib/zatca";

const router: IRouter = Router();
router.use(requireAuthentication);
router.use("/organizations/:organizationId", requireModule("finance"));

const getOrgId = (req: any) => String(req.params.organizationId);
const getInvoiceId = (req: any) => String(req.params.invoiceId);
const getQuotationId = (req: any) => String(req.params.quotationId);

// Sequence generator: INV-00001
async function getNextInvoiceNumber(organizationId: string): Promise<string> {
  const existing = await db
    .select()
    .from(invoiceSequenceCountersTable)
    .where(eq(invoiceSequenceCountersTable.organizationId, organizationId))
    .limit(1);

  let nextSeq = 1;
  if (existing.length > 0) {
    nextSeq = existing[0].lastSequence + 1;
    await db
      .update(invoiceSequenceCountersTable)
      .set({ lastSequence: nextSeq })
      .where(eq(invoiceSequenceCountersTable.organizationId, organizationId));
  } else {
    await db.insert(invoiceSequenceCountersTable).values({
      organizationId,
      lastSequence: 1,
    });
  }

  return `INV-${String(nextSeq).padStart(5, "0")}`;
}

// Helper to calculate line totals
function calculateInvoiceTotals(items: Array<any>) {
  let subtotalAcc = 0;
  let taxAcc = 0;

  const processed = items.map((it: any, idx: number) => {
    const qty = Number(it.quantity) || 1;
    const price = Number(it.unitPrice) || 0;
    const disc = Number(it.discountAmount) || 0;
    const taxCat = it.taxCategory || "STANDARD";
    const rate = taxCat === "STANDARD" ? 15 : 0;

    const lineSub = Math.max(0, qty * price - disc);
    const lineTax = (lineSub * rate) / 100;
    const lineTotal = lineSub + lineTax;

    subtotalAcc += lineSub;
    taxAcc += lineTax;

    return {
      catalogItemId: it.catalogItemId || null,
      itemCode: it.itemCode || null,
      description: it.description,
      descriptionAr: it.descriptionAr || null,
      unitId: it.unitId || null,
      quantity: qty.toFixed(4),
      unitPrice: price.toFixed(2),
      discountAmount: disc.toFixed(2),
      taxCategory: taxCat,
      taxRate: rate.toFixed(2),
      taxAmount: lineTax.toFixed(2),
      lineTotal: lineTotal.toFixed(2),
      sortOrder: idx,
    };
  });

  const totalAcc = subtotalAcc + taxAcc;

  return {
    subtotal: subtotalAcc.toFixed(2),
    discountAmount: "0.00",
    taxAmount: taxAcc.toFixed(2),
    totalAmount: totalAcc.toFixed(2),
    items: processed,
  };
}

async function getFullInvoice(organizationId: string, invoiceId: string) {
  const found = await db
    .select()
    .from(invoicesTable)
    .where(
      and(
        eq(invoicesTable.organizationId, organizationId),
        eq(invoicesTable.id, invoiceId)
      )
    )
    .limit(1);

  if (found.length === 0) return null;
  const invoice = found[0];

  const items = await db
    .select()
    .from(invoiceItemsTable)
    .where(eq(invoiceItemsTable.invoiceId, invoiceId))
    .orderBy(invoiceItemsTable.sortOrder);

  return {
    ...invoice,
    items,
  };
}

// GET /api/organizations/:organizationId/invoices
router.get("/organizations/:organizationId/invoices", async (req, res): Promise<void> => {
  const organizationId = getOrgId(req);
  const search = req.query.search ? String(req.query.search) : undefined;
  const status = req.query.status ? String(req.query.status) : undefined;
  const invoiceType = req.query.invoiceType ? String(req.query.invoiceType) : undefined;
  const customerId = req.query.customerId ? String(req.query.customerId) : undefined;
  const page = Math.max(1, Number(req.query.page) || 1);
  const pageSize = Math.min(100, Math.max(1, Number(req.query.pageSize) || 25));

  const conditions = [eq(invoicesTable.organizationId, organizationId)];

  if (status) conditions.push(eq(invoicesTable.status, status));
  if (invoiceType) conditions.push(eq(invoicesTable.invoiceType, invoiceType));
  if (customerId) conditions.push(eq(invoicesTable.customerId, customerId));
  if (search) {
    conditions.push(
      or(
        ilike(invoicesTable.invoiceNumber, `%${search}%`),
        ilike(invoicesTable.customerName, `%${search}%`)
      )!
    );
  }

  const whereClause = and(...conditions);

  const items = await db
    .select()
    .from(invoicesTable)
    .where(whereClause)
    .orderBy(desc(invoicesTable.createdAt))
    .limit(pageSize)
    .offset((page - 1) * pageSize);

  const totalResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(invoicesTable)
    .where(whereClause);

  const total = Number(totalResult[0]?.count || 0);

  res.json({
    items,
    total,
    page,
    pageSize,
  });
});

// POST /api/organizations/:organizationId/invoices
router.post("/organizations/:organizationId/invoices", async (req, res): Promise<void> => {
  const organizationId = getOrgId(req);
  const parsed = CreateInvoiceBody.safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({ error: "Invalid invoice data", details: parsed.error.format() });
    return;
  }

  const data = parsed.data;

  // Validate customer
  const customerRes = await db
    .select()
    .from(businessPartiesTable)
    .where(
      and(
        eq(businessPartiesTable.organizationId, organizationId),
        eq(businessPartiesTable.id, data.customerId)
      )
    )
    .limit(1);

  if (customerRes.length === 0) {
    res.status(404).json({ error: "Customer not found" });
    return;
  }

  const customer = customerRes[0];
  const customerName = customer.businessNameEnglish || customer.legalNameEnglish || `${customer.firstName || ""} ${customer.lastName || ""}`.trim() || "Customer";
  const customerVatNumber = customer.vatNumber || null;

  const invoiceNumber = await getNextInvoiceNumber(organizationId);
  const totals = calculateInvoiceTotals(data.items);
  const issueDate = data.issueDate ? new Date(data.issueDate) : new Date();

  // Generate ZATCA Phase 1 Base64 TLV QR Code
  const zatcaQrCode = generateZatcaTlvQrCode({
    sellerName: "KHANBAS NEXUS Store",
    vatNumber: "310000000000003",
    timestamp: issueDate.toISOString(),
    totalAmount: totals.totalAmount,
    taxAmount: totals.taxAmount,
  });

  const [created] = await db
    .insert(invoicesTable)
    .values({
      organizationId,
      invoiceNumber,
      invoiceType: data.invoiceType || "STANDARD",
      customerId: data.customerId,
      customerName,
      customerVatNumber,
      issueDate,
      dueDate: data.dueDate ? new Date(data.dueDate) : null,
      currency: data.currency || "SAR",
      subtotal: totals.subtotal,
      discountAmount: totals.discountAmount,
      taxAmount: totals.taxAmount,
      totalAmount: totals.totalAmount,
      status: "ISSUED",
      zatcaQrCode,
      notes: data.notes || null,
      terms: data.terms || null,
    })
    .returning();

  const itemInserts = totals.items.map((it) => ({
    ...it,
    invoiceId: created.id,
  }));

  await db.insert(invoiceItemsTable).values(itemInserts);

  await writeAuditLog({
    organizationId,
    userId: res.locals?.partyUser?.id,
    action: "invoice.created",
    entityType: "invoice",
    entityId: created.id,
    newValues: { invoiceNumber, totalAmount: created.totalAmount },
    req,
  });

  const result = await getFullInvoice(organizationId, created.id);
  res.status(201).json(result);
});

// GET /api/organizations/:organizationId/invoices/:invoiceId
router.get("/organizations/:organizationId/invoices/:invoiceId", async (req, res): Promise<void> => {
  const organizationId = getOrgId(req);
  const invoiceId = getInvoiceId(req);

  const invoice = await getFullInvoice(organizationId, invoiceId);
  if (!invoice) {
    res.status(404).json({ error: "Invoice not found" });
    return;
  }

  res.json(invoice);
});

// PATCH /api/organizations/:organizationId/invoices/:invoiceId
router.patch("/organizations/:organizationId/invoices/:invoiceId", async (req, res): Promise<void> => {
  const organizationId = getOrgId(req);
  const invoiceId = getInvoiceId(req);

  const existing = await getFullInvoice(organizationId, invoiceId);
  if (!existing) {
    res.status(404).json({ error: "Invoice not found" });
    return;
  }

  const parsed = UpdateInvoiceBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid update data", details: parsed.error.format() });
    return;
  }

  const data = parsed.data;
  const updateData: Record<string, any> = { updatedAt: new Date() };

  if (data.invoiceType) updateData.invoiceType = data.invoiceType;
  if (data.notes !== undefined) updateData.notes = data.notes;
  if (data.terms !== undefined) updateData.terms = data.terms;
  if (data.issueDate) updateData.issueDate = new Date(data.issueDate);
  if (data.dueDate !== undefined) updateData.dueDate = data.dueDate ? new Date(data.dueDate) : null;

  if (data.items && data.items.length > 0) {
    const totals = calculateInvoiceTotals(data.items);
    updateData.subtotal = totals.subtotal;
    updateData.taxAmount = totals.taxAmount;
    updateData.totalAmount = totals.totalAmount;

    updateData.zatcaQrCode = generateZatcaTlvQrCode({
      sellerName: "KHANBAS NEXUS Store",
      vatNumber: "310000000000003",
      timestamp: (updateData.issueDate || existing.issueDate).toISOString(),
      totalAmount: totals.totalAmount,
      taxAmount: totals.taxAmount,
    });

    await db.delete(invoiceItemsTable).where(eq(invoiceItemsTable.invoiceId, invoiceId));
    const itemInserts = totals.items.map((it) => ({
      ...it,
      invoiceId,
    }));
    await db.insert(invoiceItemsTable).values(itemInserts);
  }

  await db
    .update(invoicesTable)
    .set(updateData)
    .where(
      and(
        eq(invoicesTable.organizationId, organizationId),
        eq(invoicesTable.id, invoiceId)
      )
    );

  await writeAuditLog({
    organizationId,
    userId: res.locals?.partyUser?.id,
    action: "invoice.updated",
    entityType: "invoice",
    entityId: invoiceId,
    previousValues: { totalAmount: existing.totalAmount },
    newValues: updateData,
    req,
  });

  const updated = await getFullInvoice(organizationId, invoiceId);
  res.json(updated);
});

// POST /api/organizations/:organizationId/invoices/:invoiceId/status
router.post("/organizations/:organizationId/invoices/:invoiceId/status", async (req, res): Promise<void> => {
  const organizationId = getOrgId(req);
  const invoiceId = getInvoiceId(req);

  const existing = await getFullInvoice(organizationId, invoiceId);
  if (!existing) {
    res.status(404).json({ error: "Invoice not found" });
    return;
  }

  const parsed = UpdateInvoiceStatusBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid status data", details: parsed.error.format() });
    return;
  }

  const { status } = parsed.data;

  await db
    .update(invoicesTable)
    .set({ status, updatedAt: new Date() })
    .where(
      and(
        eq(invoicesTable.organizationId, organizationId),
        eq(invoicesTable.id, invoiceId)
      )
    );

  await writeAuditLog({
    organizationId,
    userId: res.locals?.partyUser?.id,
    action: "invoice.status_updated",
    entityType: "invoice",
    entityId: invoiceId,
    previousValues: { status: existing.status },
    newValues: { status },
    req,
  });

  const updated = await getFullInvoice(organizationId, invoiceId);
  res.json(updated);
});

// POST /api/organizations/:organizationId/quotations/:quotationId/convert
router.post("/organizations/:organizationId/quotations/:quotationId/convert", async (req, res): Promise<void> => {
  const organizationId = getOrgId(req);
  const quotationId = getQuotationId(req);

  const quotationRes = await db
    .select()
    .from(quotationsTable)
    .where(
      and(
        eq(quotationsTable.organizationId, organizationId),
        eq(quotationsTable.id, quotationId)
      )
    )
    .limit(1);

  if (quotationRes.length === 0) {
    res.status(404).json({ error: "Quotation not found" });
    return;
  }

  const quotation = quotationRes[0];
  const quotationItems = await db
    .select()
    .from(quotationItemsTable)
    .where(eq(quotationItemsTable.quotationId, quotationId))
    .orderBy(quotationItemsTable.sortOrder);

  const customerRes = await db
    .select()
    .from(businessPartiesTable)
    .where(eq(businessPartiesTable.id, quotation.customerId))
    .limit(1);

  const customer = customerRes[0];
  const customerName = customer
    ? (customer.businessNameEnglish || customer.legalNameEnglish || `${customer.firstName || ""} ${customer.lastName || ""}`.trim() || "Customer")
    : "Customer";
  const customerVatNumber = customer?.vatNumber || null;

  const invoiceNumber = await getNextInvoiceNumber(organizationId);
  const issueDate = new Date();

  const zatcaQrCode = generateZatcaTlvQrCode({
    sellerName: "KHANBAS NEXUS Store",
    vatNumber: "310000000000003",
    timestamp: issueDate.toISOString(),
    totalAmount: quotation.totalAmount,
    taxAmount: quotation.taxAmount,
  });

  const [createdInvoice] = await db
    .insert(invoicesTable)
    .values({
      organizationId,
      invoiceNumber,
      invoiceType: "STANDARD",
      quotationId: quotation.id,
      customerId: quotation.customerId,
      customerName,
      customerVatNumber,
      issueDate,
      currency: quotation.currency || "SAR",
      subtotal: quotation.subtotal,
      discountAmount: quotation.discountAmount,
      taxAmount: quotation.taxAmount,
      totalAmount: quotation.totalAmount,
      status: "ISSUED",
      zatcaQrCode,
      notes: quotation.notes,
      terms: quotation.terms,
    })
    .returning();

  const itemInserts = quotationItems.map((it) => ({
    invoiceId: createdInvoice.id,
    catalogItemId: it.catalogItemId,
    itemCode: it.itemCode,
    description: it.description,
    descriptionAr: it.descriptionAr,
    unitId: it.unitId,
    quantity: it.quantity,
    unitPrice: it.unitPrice,
    discountAmount: it.discountAmount,
    taxCategory: it.taxCategory,
    taxRate: it.taxRate,
    taxAmount: it.taxAmount,
    lineTotal: it.lineTotal,
    sortOrder: it.sortOrder,
  }));

  await db.insert(invoiceItemsTable).values(itemInserts);

  // Update quotation status to CONVERTED
  await db
    .update(quotationsTable)
    .set({
      status: "CONVERTED",
      convertedInvoiceId: createdInvoice.id,
      updatedAt: new Date(),
    })
    .where(eq(quotationsTable.id, quotationId));

  await writeAuditLog({
    organizationId,
    userId: res.locals?.partyUser?.id,
    action: "quotation.converted",
    entityType: "quotation",
    entityId: quotationId,
    newValues: { status: "CONVERTED", invoiceId: createdInvoice.id, invoiceNumber },
    req,
  });

  const result = await getFullInvoice(organizationId, createdInvoice.id);
  res.status(201).json(result);
});

export default router;
