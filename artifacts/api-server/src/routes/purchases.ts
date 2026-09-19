import { Router, type IRouter } from "express";
import { and, desc, eq, ilike, or, sql } from "drizzle-orm";
import {
  db,
  purchaseBillsTable,
  purchaseBillItemsTable,
  expensesTable,
  purchaseSequenceCountersTable,
  expenseSequenceCountersTable,
  businessPartiesTable,
} from "@workspace/db";
import { requireAuthentication } from "../middlewares/auth";
import { requireModule } from "../middlewares/moduleEntitlement";
import { writeAuditLog } from "../lib/audit";

const router: IRouter = Router();
router.use(requireAuthentication);
router.use("/organizations/:organizationId", requireModule("finance"));

const getOrgId = (req: any) => String(req.params.organizationId);
const getBillId = (req: any) => String(req.params.billId);
const getExpenseId = (req: any) => String(req.params.expenseId);

// Sequence generator: BILL-00001
async function getNextBillNumber(organizationId: string): Promise<string> {
  const existing = await db
    .select()
    .from(purchaseSequenceCountersTable)
    .where(eq(purchaseSequenceCountersTable.organizationId, organizationId))
    .limit(1);

  let nextSeq = 1;
  if (existing.length > 0) {
    nextSeq = existing[0].lastSequence + 1;
    await db
      .update(purchaseSequenceCountersTable)
      .set({ lastSequence: nextSeq })
      .where(eq(purchaseSequenceCountersTable.organizationId, organizationId));
  } else {
    await db.insert(purchaseSequenceCountersTable).values({
      organizationId,
      lastSequence: 1,
    });
  }

  return `BILL-${String(nextSeq).padStart(5, "0")}`;
}

// Sequence generator: EXP-00001
async function getNextExpenseNumber(organizationId: string): Promise<string> {
  const existing = await db
    .select()
    .from(expenseSequenceCountersTable)
    .where(eq(expenseSequenceCountersTable.organizationId, organizationId))
    .limit(1);

  let nextSeq = 1;
  if (existing.length > 0) {
    nextSeq = existing[0].lastSequence + 1;
    await db
      .update(expenseSequenceCountersTable)
      .set({ lastSequence: nextSeq })
      .where(eq(expenseSequenceCountersTable.organizationId, organizationId));
  } else {
    await db.insert(expenseSequenceCountersTable).values({
      organizationId,
      lastSequence: 1,
    });
  }

  return `EXP-${String(nextSeq).padStart(5, "0")}`;
}

// Helper to calculate bill totals
function calculateBillTotals(items: Array<any>) {
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

// ==========================================
// PURCHASE BILLS ROUTES
// ==========================================

// GET /organizations/:organizationId/purchase-bills
router.get("/organizations/:organizationId/purchase-bills", async (req, res) => {
  try {
    const orgId = getOrgId(req);
    const search = req.query.search ? String(req.query.search).trim() : "";
    const status = req.query.status ? String(req.query.status).trim() : "";
    const page = Math.max(1, parseInt(String(req.query.page || "1"), 10));
    const pageSize = Math.min(100, Math.max(1, parseInt(String(req.query.pageSize || "25"), 10)));
    const offset = (page - 1) * pageSize;

    const conditions = [eq(purchaseBillsTable.organizationId, orgId)];

    if (search) {
      conditions.push(
        or(
          ilike(purchaseBillsTable.billNumber, `%${search}%`),
          ilike(purchaseBillsTable.supplierInvoiceNumber, `%${search}%`),
          ilike(purchaseBillsTable.supplierName, `%${search}%`)
        )!
      );
    }

    if (status) {
      conditions.push(eq(purchaseBillsTable.status, status));
    }

    const whereClause = and(...conditions);

    const [bills, totalCountResult] = await Promise.all([
      db
        .select()
        .from(purchaseBillsTable)
        .where(whereClause)
        .orderBy(desc(purchaseBillsTable.createdAt))
        .limit(pageSize)
        .offset(offset),
      db
        .select({ count: sql<number>`count(*)` })
        .from(purchaseBillsTable)
        .where(whereClause),
    ]);

    const total = Number(totalCountResult[0]?.count || 0);

    // Fetch items for each bill
    const itemsByBillId = new Map<string, any[]>();
    if (bills.length > 0) {
      const billIds = bills.map((b) => b.id);
      const allItems = await db
        .select()
        .from(purchaseBillItemsTable)
        .where(sql`${purchaseBillItemsTable.billId} IN ${billIds}`)
        .orderBy(purchaseBillItemsTable.sortOrder);

      for (const item of allItems) {
        const list = itemsByBillId.get(item.billId) || [];
        list.push(item);
        itemsByBillId.set(item.billId, list);
      }
    }

    const formattedBills = bills.map((b) => ({
      id: b.id,
      organizationId: b.organizationId,
      billNumber: b.billNumber,
      supplierId: b.supplierId,
      supplierName: b.supplierName,
      supplierVatNumber: b.supplierVatNumber,
      supplierBillNumber: b.supplierInvoiceNumber,
      issueDate: b.billDate.toISOString(),
      dueDate: b.dueDate ? b.dueDate.toISOString() : null,
      currency: b.currency,
      subtotal: b.subtotal,
      discountAmount: b.discountAmount,
      taxAmount: b.taxAmount,
      totalAmount: b.totalAmount,
      status: b.status,
      notes: b.notes,
      items: itemsByBillId.get(b.id) || [],
      createdAt: b.createdAt.toISOString(),
      updatedAt: b.updatedAt.toISOString(),
    }));

    res.json({
      items: formattedBills,
      total,
      page,
      pageSize,
    });
    return;
  } catch (error: any) {
    console.error("Error listing purchase bills:", error);
    res.status(500).json({ error: error.message || "Failed to list purchase bills" });
    return;
  }
});

// POST /organizations/:organizationId/purchase-bills
router.post("/organizations/:organizationId/purchase-bills", async (req, res) => {
  try {
    const orgId = getOrgId(req);
    const body = req.body;

    if (!body.supplierId) {
      res.status(400).json({ error: "supplierId is required" });
      return;
    }
    if (!body.items || !Array.isArray(body.items) || body.items.length === 0) {
      res.status(400).json({ error: "At least one item is required" });
      return;
    }

    // Lookup supplier
    const supplierList = await db
      .select()
      .from(businessPartiesTable)
      .where(
        and(
          eq(businessPartiesTable.id, body.supplierId),
          eq(businessPartiesTable.organizationId, orgId)
        )
      )
      .limit(1);

    if (supplierList.length === 0) {
      res.status(404).json({ error: "Supplier not found" });
      return;
    }

    const supplier = supplierList[0];
    const billNumber = await getNextBillNumber(orgId);
    const totals = calculateBillTotals(body.items);
    const billDate = body.issueDate ? new Date(body.issueDate) : new Date();
    const dueDate = body.dueDate ? new Date(body.dueDate) : null;

    const [newBill] = await db
      .insert(purchaseBillsTable)
      .values({
        organizationId: orgId,
        billNumber,
        supplierInvoiceNumber: body.supplierBillNumber || null,
        supplierId: supplier.id,
        supplierName: supplier.legalNameEnglish || supplier.legalNameArabic || "Unknown Supplier",
        supplierVatNumber: supplier.vatNumber || null,
        billDate,
        dueDate,
        currency: body.currency || "SAR",
        subtotal: totals.subtotal,
        discountAmount: totals.discountAmount,
        taxAmount: totals.taxAmount,
        totalAmount: totals.totalAmount,
        status: "RECEIVED",
        notes: body.notes || null,
      })
      .returning();

    // Insert bill items
    const insertedItems = await Promise.all(
      totals.items.map((it) =>
        db
          .insert(purchaseBillItemsTable)
          .values({
            billId: newBill.id,
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
          })
          .returning()
      )
    );

    await writeAuditLog({
      organizationId: orgId,
      userId: (req as any).user?.id || "system",
      action: "purchase_bill.created",
      entityType: "purchase_bill",
      entityId: newBill.id,
      newValues: { billNumber: newBill.billNumber, totalAmount: newBill.totalAmount },
    });

    const responseObj = {
      id: newBill.id,
      organizationId: newBill.organizationId,
      billNumber: newBill.billNumber,
      supplierId: newBill.supplierId,
      supplierName: newBill.supplierName,
      supplierVatNumber: newBill.supplierVatNumber,
      supplierBillNumber: newBill.supplierInvoiceNumber,
      issueDate: newBill.billDate.toISOString(),
      dueDate: newBill.dueDate ? newBill.dueDate.toISOString() : null,
      currency: newBill.currency,
      subtotal: newBill.subtotal,
      discountAmount: newBill.discountAmount,
      taxAmount: newBill.taxAmount,
      totalAmount: newBill.totalAmount,
      status: newBill.status,
      notes: newBill.notes,
      items: insertedItems.map((itemArr) => itemArr[0]),
      createdAt: newBill.createdAt.toISOString(),
      updatedAt: newBill.updatedAt.toISOString(),
    };

    res.status(201).json(responseObj);
    return;
  } catch (error: any) {
    console.error("Error creating purchase bill:", error);
    res.status(500).json({ error: error.message || "Failed to create purchase bill" });
    return;
  }
});

// GET /organizations/:organizationId/purchase-bills/:billId
router.get("/organizations/:organizationId/purchase-bills/:billId", async (req, res) => {
  try {
    const orgId = getOrgId(req);
    const billId = getBillId(req);

    const bills = await db
      .select()
      .from(purchaseBillsTable)
      .where(and(eq(purchaseBillsTable.id, billId), eq(purchaseBillsTable.organizationId, orgId)))
      .limit(1);

    if (bills.length === 0) {
      res.status(404).json({ error: "Purchase bill not found" });
      return;
    }

    const bill = bills[0];
    const items = await db
      .select()
      .from(purchaseBillItemsTable)
      .where(eq(purchaseBillItemsTable.billId, bill.id))
      .orderBy(purchaseBillItemsTable.sortOrder);

    const responseObj = {
      id: bill.id,
      organizationId: bill.organizationId,
      billNumber: bill.billNumber,
      supplierId: bill.supplierId,
      supplierName: bill.supplierName,
      supplierVatNumber: bill.supplierVatNumber,
      supplierBillNumber: bill.supplierInvoiceNumber,
      issueDate: bill.billDate.toISOString(),
      dueDate: bill.dueDate ? bill.dueDate.toISOString() : null,
      currency: bill.currency,
      subtotal: bill.subtotal,
      discountAmount: bill.discountAmount,
      taxAmount: bill.taxAmount,
      totalAmount: bill.totalAmount,
      status: bill.status,
      notes: bill.notes,
      items,
      createdAt: bill.createdAt.toISOString(),
      updatedAt: bill.updatedAt.toISOString(),
    };

    res.json(responseObj);
    return;
  } catch (error: any) {
    console.error("Error getting purchase bill:", error);
    res.status(500).json({ error: error.message || "Failed to get purchase bill" });
    return;
  }
});

// PATCH /organizations/:organizationId/purchase-bills/:billId/status
router.patch("/organizations/:organizationId/purchase-bills/:billId/status", async (req, res) => {
  try {
    const orgId = getOrgId(req);
    const billId = getBillId(req);
    const { status } = req.body;

    if (!status) {
      res.status(400).json({ error: "status is required" });
      return;
    }

    const bills = await db
      .select()
      .from(purchaseBillsTable)
      .where(and(eq(purchaseBillsTable.id, billId), eq(purchaseBillsTable.organizationId, orgId)))
      .limit(1);

    if (bills.length === 0) {
      res.status(404).json({ error: "Purchase bill not found" });
      return;
    }

    const [updatedBill] = await db
      .update(purchaseBillsTable)
      .set({ status, updatedAt: new Date() })
      .where(eq(purchaseBillsTable.id, billId))
      .returning();

    const items = await db
      .select()
      .from(purchaseBillItemsTable)
      .where(eq(purchaseBillItemsTable.billId, billId))
      .orderBy(purchaseBillItemsTable.sortOrder);

    await writeAuditLog({
      organizationId: orgId,
      userId: (req as any).user?.id || "system",
      action: "purchase_bill.status_updated",
      entityType: "purchase_bill",
      entityId: billId,
      newValues: { newStatus: status },
    });

    const responseObj = {
      id: updatedBill.id,
      organizationId: updatedBill.organizationId,
      billNumber: updatedBill.billNumber,
      supplierId: updatedBill.supplierId,
      supplierName: updatedBill.supplierName,
      supplierVatNumber: updatedBill.supplierVatNumber,
      supplierBillNumber: updatedBill.supplierInvoiceNumber,
      issueDate: updatedBill.billDate.toISOString(),
      dueDate: updatedBill.dueDate ? updatedBill.dueDate.toISOString() : null,
      currency: updatedBill.currency,
      subtotal: updatedBill.subtotal,
      discountAmount: updatedBill.discountAmount,
      taxAmount: updatedBill.taxAmount,
      totalAmount: updatedBill.totalAmount,
      status: updatedBill.status,
      notes: updatedBill.notes,
      items,
      createdAt: updatedBill.createdAt.toISOString(),
      updatedAt: updatedBill.updatedAt.toISOString(),
    };

    res.json(responseObj);
    return;
  } catch (error: any) {
    console.error("Error updating bill status:", error);
    res.status(500).json({ error: error.message || "Failed to update bill status" });
    return;
  }
});

// DELETE /organizations/:organizationId/purchase-bills/:billId
router.delete("/organizations/:organizationId/purchase-bills/:billId", async (req, res) => {
  try {
    const orgId = getOrgId(req);
    const billId = getBillId(req);

    const bills = await db
      .select()
      .from(purchaseBillsTable)
      .where(and(eq(purchaseBillsTable.id, billId), eq(purchaseBillsTable.organizationId, orgId)))
      .limit(1);

    if (bills.length === 0) {
      res.status(404).json({ error: "Purchase bill not found" });
      return;
    }

    await db.delete(purchaseBillsTable).where(eq(purchaseBillsTable.id, billId));

    await writeAuditLog({
      organizationId: orgId,
      userId: (req as any).user?.id || "system",
      action: "purchase_bill.deleted",
      entityType: "purchase_bill",
      entityId: billId,
      newValues: {},
    });

    res.status(204).send();
    return;
  } catch (error: any) {
    console.error("Error deleting purchase bill:", error);
    res.status(500).json({ error: error.message || "Failed to delete purchase bill" });
    return;
  }
});

// ==========================================
// EXPENSES ROUTES
// ==========================================

// GET /organizations/:organizationId/expenses
router.get("/organizations/:organizationId/expenses", async (req, res) => {
  try {
    const orgId = getOrgId(req);
    const search = req.query.search ? String(req.query.search).trim() : "";
    const category = req.query.category ? String(req.query.category).trim() : "";
    const page = Math.max(1, parseInt(String(req.query.page || "1"), 10));
    const pageSize = Math.min(100, Math.max(1, parseInt(String(req.query.pageSize || "25"), 10)));
    const offset = (page - 1) * pageSize;

    const conditions = [eq(expensesTable.organizationId, orgId)];

    if (search) {
      conditions.push(
        or(
          ilike(expensesTable.expenseNumber, `%${search}%`),
          ilike(expensesTable.payeeName, `%${search}%`),
          ilike(expensesTable.referenceNumber, `%${search}%`),
          ilike(expensesTable.category, `%${search}%`)
        )!
      );
    }

    if (category) {
      conditions.push(eq(expensesTable.category, category));
    }

    const whereClause = and(...conditions);

    const [expenses, totalCountResult] = await Promise.all([
      db
        .select()
        .from(expensesTable)
        .where(whereClause)
        .orderBy(desc(expensesTable.createdAt))
        .limit(pageSize)
        .offset(offset),
      db
        .select({ count: sql<number>`count(*)` })
        .from(expensesTable)
        .where(whereClause),
    ]);

    const total = Number(totalCountResult[0]?.count || 0);

    const formattedExpenses = expenses.map((e) => ({
      id: e.id,
      organizationId: e.organizationId,
      expenseNumber: e.expenseNumber,
      category: e.category,
      description: e.payeeName,
      amount: e.totalAmount,
      taxAmount: e.taxAmount,
      paymentMethod: e.paymentMethod,
      expenseDate: e.expenseDate.toISOString(),
      supplierId: e.supplierId,
      supplierName: e.payeeName,
      referenceNumber: e.referenceNumber,
      receiptUrl: null,
      notes: e.notes,
      status: "PAID",
      createdAt: e.createdAt.toISOString(),
      updatedAt: e.updatedAt.toISOString(),
    }));

    res.json({
      items: formattedExpenses,
      total,
      page,
      pageSize,
    });
    return;
  } catch (error: any) {
    console.error("Error listing expenses:", error);
    res.status(500).json({ error: error.message || "Failed to list expenses" });
    return;
  }
});

// POST /organizations/:organizationId/expenses
router.post("/organizations/:organizationId/expenses", async (req, res) => {
  try {
    const orgId = getOrgId(req);
    const body = req.body;

    if (!body.category || !body.description) {
      res.status(400).json({ error: "category and description are required" });
      return;
    }

    const expenseNumber = await getNextExpenseNumber(orgId);
    const amount = Number(body.amount) || 0;
    const taxAmount = Number(body.taxAmount) || 0;
    const subtotal = Math.max(0, amount - taxAmount);
    const expenseDate = body.expenseDate ? new Date(body.expenseDate) : new Date();

    let supplierName = body.description;
    if (body.supplierId) {
      const sup = await db
        .select()
        .from(businessPartiesTable)
        .where(
          and(
            eq(businessPartiesTable.id, body.supplierId),
            eq(businessPartiesTable.organizationId, orgId)
          )
        )
        .limit(1);
      if (sup.length > 0) {
        supplierName = sup[0].legalNameEnglish || sup[0].legalNameArabic || body.description;
      }
    }

    const [newExpense] = await db
      .insert(expensesTable)
      .values({
        organizationId: orgId,
        expenseNumber,
        category: body.category.toUpperCase(),
        supplierId: body.supplierId || null,
        payeeName: supplierName,
        expenseDate,
        paymentMethod: (body.paymentMethod || "CASH").toUpperCase(),
        subtotal: subtotal.toFixed(2),
        taxAmount: taxAmount.toFixed(2),
        totalAmount: amount.toFixed(2),
        taxCategory: taxAmount > 0 ? "STANDARD" : "EXEMPT",
        referenceNumber: body.referenceNumber || null,
        notes: body.notes || null,
      })
      .returning();

    await writeAuditLog({
      organizationId: orgId,
      userId: (req as any).user?.id || "system",
      action: "expense.created",
      entityType: "expense",
      entityId: newExpense.id,
      newValues: { expenseNumber: newExpense.expenseNumber, amount: newExpense.totalAmount },
    });

    const responseObj = {
      id: newExpense.id,
      organizationId: newExpense.organizationId,
      expenseNumber: newExpense.expenseNumber,
      category: newExpense.category,
      description: newExpense.payeeName,
      amount: newExpense.totalAmount,
      taxAmount: newExpense.taxAmount,
      paymentMethod: newExpense.paymentMethod,
      expenseDate: newExpense.expenseDate.toISOString(),
      supplierId: newExpense.supplierId,
      supplierName: newExpense.payeeName,
      referenceNumber: newExpense.referenceNumber,
      receiptUrl: null,
      notes: newExpense.notes,
      status: "PAID",
      createdAt: newExpense.createdAt.toISOString(),
      updatedAt: newExpense.updatedAt.toISOString(),
    };

    res.status(201).json(responseObj);
    return;
  } catch (error: any) {
    console.error("Error creating expense:", error);
    res.status(500).json({ error: error.message || "Failed to create expense" });
    return;
  }
});

// GET /organizations/:organizationId/expenses/:expenseId
router.get("/organizations/:organizationId/expenses/:expenseId", async (req, res) => {
  try {
    const orgId = getOrgId(req);
    const expenseId = getExpenseId(req);

    const expenses = await db
      .select()
      .from(expensesTable)
      .where(and(eq(expensesTable.id, expenseId), eq(expensesTable.organizationId, orgId)))
      .limit(1);

    if (expenses.length === 0) {
      res.status(404).json({ error: "Expense not found" });
      return;
    }

    const e = expenses[0];
    const responseObj = {
      id: e.id,
      organizationId: e.organizationId,
      expenseNumber: e.expenseNumber,
      category: e.category,
      description: e.payeeName,
      amount: e.totalAmount,
      taxAmount: e.taxAmount,
      paymentMethod: e.paymentMethod,
      expenseDate: e.expenseDate.toISOString(),
      supplierId: e.supplierId,
      supplierName: e.payeeName,
      referenceNumber: e.referenceNumber,
      receiptUrl: null,
      notes: e.notes,
      status: "PAID",
      createdAt: e.createdAt.toISOString(),
      updatedAt: e.updatedAt.toISOString(),
    };

    res.json(responseObj);
    return;
  } catch (error: any) {
    console.error("Error getting expense:", error);
    res.status(500).json({ error: error.message || "Failed to get expense" });
    return;
  }
});

// DELETE /organizations/:organizationId/expenses/:expenseId
router.delete("/organizations/:organizationId/expenses/:expenseId", async (req, res) => {
  try {
    const orgId = getOrgId(req);
    const expenseId = getExpenseId(req);

    const expenses = await db
      .select()
      .from(expensesTable)
      .where(and(eq(expensesTable.id, expenseId), eq(expensesTable.organizationId, orgId)))
      .limit(1);

    if (expenses.length === 0) {
      res.status(404).json({ error: "Expense not found" });
      return;
    }

    await db.delete(expensesTable).where(eq(expensesTable.id, expenseId));

    await writeAuditLog({
      organizationId: orgId,
      userId: (req as any).user?.id || "system",
      action: "expense.deleted",
      entityType: "expense",
      entityId: expenseId,
      newValues: {},
    });

    res.status(204).send();
    return;
  } catch (error: any) {
    console.error("Error deleting expense:", error);
    res.status(500).json({ error: error.message || "Failed to delete expense" });
    return;
  }
});

export default router;
