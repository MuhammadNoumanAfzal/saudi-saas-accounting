import { Router, type IRouter } from "express";
import { and, desc, eq, ilike, or, sql } from "drizzle-orm";
import {
  db,
  accountsTable,
  journalEntriesTable,
  journalEntryLinesTable,
  accountingSequenceCountersTable,
  invoicesTable,
  purchaseBillsTable,
  expensesTable,
} from "@workspace/db";
import { requireAuthentication } from "../middlewares/auth";
import { requireModule } from "../middlewares/moduleEntitlement";
import { writeAuditLog } from "../lib/audit";

const router: IRouter = Router();
router.use(requireAuthentication);
router.use("/organizations/:organizationId", requireModule("finance"));

const getOrgId = (req: any) => String(req.params.organizationId);
const getEntryId = (req: any) => String(req.params.entryId);

// Sequence generator: JV-00001
async function getNextJournalNumber(organizationId: string): Promise<string> {
  const existing = await db
    .select()
    .from(accountingSequenceCountersTable)
    .where(eq(accountingSequenceCountersTable.organizationId, organizationId))
    .limit(1);

  let nextSeq = 1;
  if (existing.length > 0) {
    nextSeq = existing[0].lastSequence + 1;
    await db
      .update(accountingSequenceCountersTable)
      .set({ lastSequence: nextSeq })
      .where(eq(accountingSequenceCountersTable.organizationId, organizationId));
  } else {
    await db.insert(accountingSequenceCountersTable).values({
      organizationId,
      lastSequence: 1,
    });
  }

  return `JV-${String(nextSeq).padStart(5, "0")}`;
}

// Default SOCPA Chart of Accounts Seeder
async function ensureDefaultAccounts(organizationId: string) {
  const count = await db
    .select({ count: sql<number>`count(*)` })
    .from(accountsTable)
    .where(eq(accountsTable.organizationId, organizationId));

  if (Number(count[0]?.count || 0) > 0) return;

  const defaultAccounts = [
    { code: "10100", nameEnglish: "Cash on Hand", nameArabic: "النقدية بالصندوق", type: "ASSET", subtype: "CURRENT_ASSET", isSystemAccount: true },
    { code: "10200", nameEnglish: "Bank Accounts", nameArabic: "الحسابات البنكية", type: "ASSET", subtype: "CURRENT_ASSET", isSystemAccount: true },
    { code: "10300", nameEnglish: "Accounts Receivable", nameArabic: "العملاء والمدينون", type: "ASSET", subtype: "CURRENT_ASSET", isControlAccount: true, isSystemAccount: true },
    { code: "10400", nameEnglish: "Input VAT Recoverable", nameArabic: "ضريبة القيمة المضافة المدخلات", type: "ASSET", subtype: "CURRENT_ASSET", isSystemAccount: true },
    { code: "20100", nameEnglish: "Accounts Payable", nameArabic: "الموردون والدائنون", type: "LIABILITY", subtype: "CURRENT_LIABILITY", isControlAccount: true, isSystemAccount: true },
    { code: "20200", nameEnglish: "Output VAT Payable", nameArabic: "ضريبة القيمة المضافة المخرجات", type: "LIABILITY", subtype: "CURRENT_LIABILITY", isSystemAccount: true },
    { code: "30100", nameEnglish: "Capital", nameArabic: "رأس المال", type: "EQUITY", subtype: "EQUITY_DIRECT", isSystemAccount: true },
    { code: "30200", nameEnglish: "Retained Earnings", nameArabic: "الأرباح المبقاة", type: "EQUITY", subtype: "EQUITY_DIRECT", isSystemAccount: true },
    { code: "40100", nameEnglish: "Sales Revenue", nameArabic: "إيرادات المبيعات", type: "REVENUE", subtype: "OPERATING_REVENUE", isSystemAccount: true },
    { code: "50100", nameEnglish: "Cost of Goods Sold", nameArabic: "تكلفة البضاعة المباعة", type: "EXPENSE", subtype: "OPERATING_EXPENSE", isSystemAccount: true },
    { code: "50200", nameEnglish: "Rent Expense", nameArabic: "مصروف الإيجار", type: "EXPENSE", subtype: "OPERATING_EXPENSE", isSystemAccount: false },
    { code: "50300", nameEnglish: "Utilities Expense", nameArabic: "مصروف الكهرباء والمنافع", type: "EXPENSE", subtype: "OPERATING_EXPENSE", isSystemAccount: false },
    { code: "50400", nameEnglish: "Salaries & Wages", nameArabic: "الرواتب والأجور", type: "EXPENSE", subtype: "OPERATING_EXPENSE", isSystemAccount: false },
    { code: "50500", nameEnglish: "General & Admin Expenses", nameArabic: "المصروفات العمومية والإدارية", type: "EXPENSE", subtype: "OTHER_EXPENSE", isSystemAccount: false },
  ];

  await Promise.all(
    defaultAccounts.map((acc) =>
      db.insert(accountsTable).values({
        organizationId,
        code: acc.code,
        nameEnglish: acc.nameEnglish,
        nameArabic: acc.nameArabic,
        type: acc.type,
        subtype: acc.subtype,
        isSystemAccount: acc.isSystemAccount,
        isControlAccount: acc.isControlAccount || false,
        status: "ACTIVE",
      })
    )
  );
}

// ==========================================
// CHART OF ACCOUNTS ROUTES
// ==========================================

// GET /organizations/:organizationId/accounting/accounts
router.get("/organizations/:organizationId/accounting/accounts", async (req, res) => {
  try {
    const orgId = getOrgId(req);
    await ensureDefaultAccounts(orgId);

    const search = req.query.search ? String(req.query.search).trim() : "";
    const type = req.query.type ? String(req.query.type).trim() : "";

    const conditions = [eq(accountsTable.organizationId, orgId)];

    if (search) {
      conditions.push(
        or(
          ilike(accountsTable.code, `%${search}%`),
          ilike(accountsTable.nameEnglish, `%${search}%`),
          ilike(accountsTable.nameArabic, `%${search}%`)
        )!
      );
    }

    if (type) {
      conditions.push(eq(accountsTable.type, type));
    }

    const accounts = await db
      .select()
      .from(accountsTable)
      .where(and(...conditions))
      .orderBy(accountsTable.code);

    res.json({
      items: accounts,
      total: accounts.length,
    });
    return;
  } catch (error: any) {
    console.error("Error listing accounts:", error);
    res.status(500).json({ error: error.message || "Failed to list accounts" });
    return;
  }
});

// POST /organizations/:organizationId/accounting/accounts
router.post("/organizations/:organizationId/accounting/accounts", async (req, res) => {
  try {
    const orgId = getOrgId(req);
    const body = req.body;

    if (!body.code || !body.nameEnglish || !body.nameArabic || !body.type) {
      res.status(400).json({ error: "code, nameEnglish, nameArabic, and type are required" });
      return;
    }

    // Check code uniqueness
    const existing = await db
      .select()
      .from(accountsTable)
      .where(and(eq(accountsTable.organizationId, orgId), eq(accountsTable.code, body.code)))
      .limit(1);

    if (existing.length > 0) {
      res.status(400).json({ error: `Account code ${body.code} already exists` });
      return;
    }

    const [newAccount] = await db
      .insert(accountsTable)
      .values({
        organizationId: orgId,
        code: body.code,
        nameEnglish: body.nameEnglish,
        nameArabic: body.nameArabic,
        type: body.type.toUpperCase(),
        subtype: body.subtype || "OTHER",
        parentAccountId: body.parentAccountId || null,
        isSystemAccount: false,
        isControlAccount: false,
        status: "ACTIVE",
      })
      .returning();

    await writeAuditLog({
      organizationId: orgId,
      userId: (req as any).user?.id || "system",
      action: "account.created",
      entityType: "account",
      entityId: newAccount.id,
      newValues: { code: newAccount.code, name: newAccount.nameEnglish },
    });

    res.status(201).json(newAccount);
    return;
  } catch (error: any) {
    console.error("Error creating account:", error);
    res.status(500).json({ error: error.message || "Failed to create account" });
    return;
  }
});

// PATCH /organizations/:organizationId/accounting/accounts/:accountId
router.patch("/organizations/:organizationId/accounting/accounts/:accountId", async (req, res) => {
  try {
    const orgId = getOrgId(req);
    const accountId = String(req.params.accountId);
    const body = req.body;

    const existing = await db
      .select()
      .from(accountsTable)
      .where(and(eq(accountsTable.id, accountId), eq(accountsTable.organizationId, orgId)))
      .limit(1);

    if (existing.length === 0) {
      res.status(404).json({ error: "Account not found" });
      return;
    }

    const updates: any = {};
    if (body.nameEnglish) updates.nameEnglish = body.nameEnglish;
    if (body.nameArabic) updates.nameArabic = body.nameArabic;
    if (body.type) updates.type = body.type.toUpperCase();
    if (body.subtype) updates.subtype = body.subtype;

    const [updatedAccount] = await db
      .update(accountsTable)
      .set(updates)
      .where(and(eq(accountsTable.id, accountId), eq(accountsTable.organizationId, orgId)))
      .returning();

    res.json(updatedAccount);
    return;
  } catch (error: any) {
    console.error("Error updating account:", error);
    res.status(500).json({ error: error.message || "Failed to update account" });
    return;
  }
});

// DELETE /organizations/:organizationId/accounting/accounts/:accountId
router.delete("/organizations/:organizationId/accounting/accounts/:accountId", async (req, res) => {
  try {
    const orgId = getOrgId(req);
    const accountId = String(req.params.accountId);

    const existing = await db
      .select()
      .from(accountsTable)
      .where(and(eq(accountsTable.id, accountId), eq(accountsTable.organizationId, orgId)))
      .limit(1);

    if (existing.length === 0) {
      res.status(404).json({ error: "Account not found" });
      return;
    }

    if (existing[0].isSystemAccount) {
      res.status(400).json({ error: "System accounts cannot be deleted" });
      return;
    }

    await db
      .delete(accountsTable)
      .where(and(eq(accountsTable.id, accountId), eq(accountsTable.organizationId, orgId)));

    res.json({ success: true, message: "Account deleted successfully" });
    return;
  } catch (error: any) {
    console.error("Error deleting account:", error);
    res.status(500).json({ error: error.message || "Failed to delete account" });
    return;
  }
});

// ==========================================
// JOURNAL ENTRIES ROUTES
// ==========================================

// GET /organizations/:organizationId/accounting/journal-entries
router.get("/organizations/:organizationId/accounting/journal-entries", async (req, res) => {
  try {
    const orgId = getOrgId(req);
    const search = req.query.search ? String(req.query.search).trim() : "";
    const sourceDocumentType = req.query.sourceDocumentType ? String(req.query.sourceDocumentType).trim() : "";
    const page = Math.max(1, parseInt(String(req.query.page || "1"), 10));
    const pageSize = Math.min(100, Math.max(1, parseInt(String(req.query.pageSize || "25"), 10)));
    const offset = (page - 1) * pageSize;

    const conditions = [eq(journalEntriesTable.organizationId, orgId)];

    if (search) {
      conditions.push(
        or(
          ilike(journalEntriesTable.entryNumber, `%${search}%`),
          ilike(journalEntriesTable.description, `%${search}%`),
          ilike(journalEntriesTable.referenceNumber, `%${search}%`)
        )!
      );
    }

    if (sourceDocumentType) {
      conditions.push(eq(journalEntriesTable.sourceDocumentType, sourceDocumentType));
    }

    const whereClause = and(...conditions);

    const [entries, totalCountResult] = await Promise.all([
      db
        .select()
        .from(journalEntriesTable)
        .where(whereClause)
        .orderBy(desc(journalEntriesTable.createdAt))
        .limit(pageSize)
        .offset(offset),
      db
        .select({ count: sql<number>`count(*)` })
        .from(journalEntriesTable)
        .where(whereClause),
    ]);

    const total = Number(totalCountResult[0]?.count || 0);

    // Fetch lines for each entry
    const linesByEntryId = new Map<string, any[]>();
    if (entries.length > 0) {
      const entryIds = entries.map((e) => e.id);
      const allLines = await db
        .select({
          id: journalEntryLinesTable.id,
          journalEntryId: journalEntryLinesTable.journalEntryId,
          accountId: journalEntryLinesTable.accountId,
          accountCode: accountsTable.code,
          accountName: accountsTable.nameEnglish,
          description: journalEntryLinesTable.description,
          debit: journalEntryLinesTable.debit,
          credit: journalEntryLinesTable.credit,
          sortOrder: journalEntryLinesTable.sortOrder,
        })
        .from(journalEntryLinesTable)
        .leftJoin(accountsTable, eq(journalEntryLinesTable.accountId, accountsTable.id))
        .where(sql`${journalEntryLinesTable.journalEntryId} IN ${entryIds}`)
        .orderBy(journalEntryLinesTable.sortOrder);

      for (const line of allLines) {
        const list = linesByEntryId.get(line.journalEntryId) || [];
        list.push(line);
        linesByEntryId.set(line.journalEntryId, list);
      }
    }

    const formattedEntries = entries.map((e) => ({
      id: e.id,
      organizationId: e.organizationId,
      entryNumber: e.entryNumber,
      entryDate: e.entryDate.toISOString(),
      postingDate: e.postingDate.toISOString(),
      referenceNumber: e.referenceNumber,
      sourceDocumentType: e.sourceDocumentType,
      sourceDocumentId: e.sourceDocumentId,
      description: e.description,
      descriptionAr: e.descriptionAr,
      status: e.status,
      totalDebit: e.totalDebit,
      totalCredit: e.totalCredit,
      lines: linesByEntryId.get(e.id) || [],
      createdAt: e.createdAt.toISOString(),
      updatedAt: e.updatedAt.toISOString(),
    }));

    res.json({
      items: formattedEntries,
      total,
      page,
      pageSize,
    });
    return;
  } catch (error: any) {
    console.error("Error listing journal entries:", error);
    res.status(500).json({ error: error.message || "Failed to list journal entries" });
    return;
  }
});

// POST /organizations/:organizationId/accounting/journal-entries
router.post("/organizations/:organizationId/accounting/journal-entries", async (req, res) => {
  try {
    const orgId = getOrgId(req);
    const body = req.body;

    if (!body.description) {
      res.status(400).json({ error: "description is required" });
      return;
    }
    if (!body.lines || !Array.isArray(body.lines) || body.lines.length < 2) {
      res.status(400).json({ error: "At least two entry lines are required for a double-entry journal voucher" });
      return;
    }

    // Verify double-entry balance: total debit == total credit
    let sumDebit = 0;
    let sumCredit = 0;

    body.lines.forEach((line: any) => {
      const d = parseFloat(line.debit) || 0;
      const c = parseFloat(line.credit) || 0;
      sumDebit += d;
      sumCredit += c;
    });

    if (Math.abs(sumDebit - sumCredit) > 0.009) {
      res.status(400).json({
        error: `Journal voucher must be balanced. Total Debits (${sumDebit.toFixed(2)}) must equal Total Credits (${sumCredit.toFixed(2)})`,
      });
      return;
    }

    const entryNumber = await getNextJournalNumber(orgId);
    const entryDate = body.entryDate ? new Date(body.entryDate) : new Date();
    const postingDate = body.postingDate ? new Date(body.postingDate) : entryDate;

    const [newEntry] = await db
      .insert(journalEntriesTable)
      .values({
        organizationId: orgId,
        entryNumber,
        entryDate,
        postingDate,
        referenceNumber: body.referenceNumber || null,
        sourceDocumentType: "MANUAL_JOURNAL",
        description: body.description,
        descriptionAr: body.descriptionAr || null,
        status: "POSTED",
        totalDebit: sumDebit.toFixed(2),
        totalCredit: sumCredit.toFixed(2),
      })
      .returning();

    // Insert lines
    const insertedLines = await Promise.all(
      body.lines.map((line: any, idx: number) =>
        db
          .insert(journalEntryLinesTable)
          .values({
            journalEntryId: newEntry.id,
            accountId: line.accountId,
            description: line.description || body.description,
            debit: (parseFloat(line.debit) || 0).toFixed(2),
            credit: (parseFloat(line.credit) || 0).toFixed(2),
            sortOrder: idx,
          })
          .returning()
      )
    );

    await writeAuditLog({
      organizationId: orgId,
      userId: (req as any).user?.id || "system",
      action: "journal_entry.created",
      entityType: "journal_entry",
      entityId: newEntry.id,
      newValues: { entryNumber: newEntry.entryNumber, amount: newEntry.totalDebit },
    });

    // Lookup account codes for response
    const linesWithAccountInfo = await db
      .select({
        id: journalEntryLinesTable.id,
        journalEntryId: journalEntryLinesTable.journalEntryId,
        accountId: journalEntryLinesTable.accountId,
        accountCode: accountsTable.code,
        accountName: accountsTable.nameEnglish,
        description: journalEntryLinesTable.description,
        debit: journalEntryLinesTable.debit,
        credit: journalEntryLinesTable.credit,
        sortOrder: journalEntryLinesTable.sortOrder,
      })
      .from(journalEntryLinesTable)
      .leftJoin(accountsTable, eq(journalEntryLinesTable.accountId, accountsTable.id))
      .where(eq(journalEntryLinesTable.journalEntryId, newEntry.id))
      .orderBy(journalEntryLinesTable.sortOrder);

    const responseObj = {
      id: newEntry.id,
      organizationId: newEntry.organizationId,
      entryNumber: newEntry.entryNumber,
      entryDate: newEntry.entryDate.toISOString(),
      postingDate: newEntry.postingDate.toISOString(),
      referenceNumber: newEntry.referenceNumber,
      sourceDocumentType: newEntry.sourceDocumentType,
      sourceDocumentId: newEntry.sourceDocumentId,
      description: newEntry.description,
      descriptionAr: newEntry.descriptionAr,
      status: newEntry.status,
      totalDebit: newEntry.totalDebit,
      totalCredit: newEntry.totalCredit,
      lines: linesWithAccountInfo,
      createdAt: newEntry.createdAt.toISOString(),
      updatedAt: newEntry.updatedAt.toISOString(),
    };

    res.status(201).json(responseObj);
    return;
  } catch (error: any) {
    console.error("Error creating journal entry:", error);
    res.status(500).json({ error: error.message || "Failed to create journal entry" });
    return;
  }
});

// GET /organizations/:organizationId/accounting/journal-entries/:entryId
router.get("/organizations/:organizationId/accounting/journal-entries/:entryId", async (req, res) => {
  try {
    const orgId = getOrgId(req);
    const entryId = getEntryId(req);

    const entries = await db
      .select()
      .from(journalEntriesTable)
      .where(and(eq(journalEntriesTable.id, entryId), eq(journalEntriesTable.organizationId, orgId)))
      .limit(1);

    if (entries.length === 0) {
      res.status(404).json({ error: "Journal entry not found" });
      return;
    }

    const entry = entries[0];
    const lines = await db
      .select({
        id: journalEntryLinesTable.id,
        journalEntryId: journalEntryLinesTable.journalEntryId,
        accountId: journalEntryLinesTable.accountId,
        accountCode: accountsTable.code,
        accountName: accountsTable.nameEnglish,
        description: journalEntryLinesTable.description,
        debit: journalEntryLinesTable.debit,
        credit: journalEntryLinesTable.credit,
        sortOrder: journalEntryLinesTable.sortOrder,
      })
      .from(journalEntryLinesTable)
      .leftJoin(accountsTable, eq(journalEntryLinesTable.accountId, accountsTable.id))
      .where(eq(journalEntryLinesTable.journalEntryId, entry.id))
      .orderBy(journalEntryLinesTable.sortOrder);

    const responseObj = {
      id: entry.id,
      organizationId: entry.organizationId,
      entryNumber: entry.entryNumber,
      entryDate: entry.entryDate.toISOString(),
      postingDate: entry.postingDate.toISOString(),
      referenceNumber: entry.referenceNumber,
      sourceDocumentType: entry.sourceDocumentType,
      sourceDocumentId: entry.sourceDocumentId,
      description: entry.description,
      descriptionAr: entry.descriptionAr,
      status: entry.status,
      totalDebit: entry.totalDebit,
      totalCredit: entry.totalCredit,
      lines,
      createdAt: entry.createdAt.toISOString(),
      updatedAt: entry.updatedAt.toISOString(),
    };

    res.json(responseObj);
    return;
  } catch (error: any) {
    console.error("Error getting journal entry:", error);
    res.status(500).json({ error: error.message || "Failed to get journal entry" });
    return;
  }
});

// ==========================================
// TRIAL BALANCE ROUTE
// ==========================================

// GET /organizations/:organizationId/accounting/trial-balance
router.get("/organizations/:organizationId/accounting/trial-balance", async (req, res) => {
  try {
    const orgId = getOrgId(req);
    await ensureDefaultAccounts(orgId);

    const accounts = await db
      .select()
      .from(accountsTable)
      .where(eq(accountsTable.organizationId, orgId))
      .orderBy(accountsTable.code);

    const totalsMap = new Map<string, { debit: number; credit: number }>();

    // 1. Sum posted Journal Entries
    const lineTotals = await db
      .select({
        accountId: journalEntryLinesTable.accountId,
        totalDebit: sql<string>`coalesce(sum(${journalEntryLinesTable.debit}), '0.00')`,
        totalCredit: sql<string>`coalesce(sum(${journalEntryLinesTable.credit}), '0.00')`,
      })
      .from(journalEntryLinesTable)
      .innerJoin(journalEntriesTable, eq(journalEntryLinesTable.journalEntryId, journalEntriesTable.id))
      .where(
        and(
          eq(journalEntriesTable.organizationId, orgId),
          eq(journalEntriesTable.status, "POSTED")
        )
      )
      .groupBy(journalEntryLinesTable.accountId);

    for (const lt of lineTotals) {
      totalsMap.set(lt.accountId, {
        debit: parseFloat(lt.totalDebit) || 0,
        credit: parseFloat(lt.totalCredit) || 0,
      });
    }

    // Helper to add debit/credit to account by code
    const addAccountBalance = (code: string, debit: number, credit: number) => {
      const acc = accounts.find((a) => a.code === code);
      if (acc) {
        const cur = totalsMap.get(acc.id) || { debit: 0, credit: 0 };
        totalsMap.set(acc.id, {
          debit: cur.debit + debit,
          credit: cur.credit + credit,
        });
      }
    };

    // 2. Aggregate Sales Invoices
    const invoicesList = await db
      .select()
      .from(invoicesTable)
      .where(eq(invoicesTable.organizationId, orgId));

    for (const inv of invoicesList) {
      if (inv.status === 'CANCELLED') continue;
      const subtotal = Number(inv.subtotal || 0);
      const taxAmount = Number(inv.taxAmount || 0);
      const total = Number(inv.totalAmount || 0);
      const paidAmount = Number((inv as any).paidAmount || (inv.status === 'PAID' ? total : 0));
      const unpaidAmount = Math.max(0, total - paidAmount);

      // Revenue (40100) -> Credit subtotal
      addAccountBalance('40100', 0, subtotal);
      // Output VAT (20200) -> Credit taxAmount
      addAccountBalance('20200', 0, taxAmount);
      // Cash/Bank (10100) -> Debit paidAmount
      if (paidAmount > 0) {
        addAccountBalance('10100', paidAmount, 0);
      }
      // Accounts Receivable (10300) -> Debit unpaidAmount
      if (unpaidAmount > 0) {
        addAccountBalance('10300', unpaidAmount, 0);
      }
    }

    // 3. Aggregate Purchase Bills
    const billsList = await db
      .select()
      .from(purchaseBillsTable)
      .where(eq(purchaseBillsTable.organizationId, orgId));

    for (const bill of billsList) {
      if (bill.status === 'CANCELLED') continue;
      const subtotal = Number(bill.subtotal || 0);
      const taxAmount = Number(bill.taxAmount || 0);
      const total = Number(bill.totalAmount || 0);
      const paidAmount = Number((bill as any).paidAmount || (bill.status === 'PAID' ? total : 0));
      const unpaidAmount = Math.max(0, total - paidAmount);

      // Cost of Goods Sold / Expense (50100) -> Debit subtotal
      addAccountBalance('50100', subtotal, 0);
      // Input VAT Recoverable (10400) -> Debit taxAmount
      addAccountBalance('10400', taxAmount, 0);
      // Cash/Bank (10100) -> Credit paidAmount
      if (paidAmount > 0) {
        addAccountBalance('10100', 0, paidAmount);
      }
      // Accounts Payable (20100) -> Credit unpaidAmount
      if (unpaidAmount > 0) {
        addAccountBalance('20100', 0, unpaidAmount);
      }
    }

    // 4. Aggregate Direct Expenses
    const expensesList = await db
      .select()
      .from(expensesTable)
      .where(eq(expensesTable.organizationId, orgId));

    for (const exp of expensesList) {
      const subtotal = Number(exp.subtotal || 0);
      const taxAmount = Number(exp.taxAmount || 0);
      const total = Number(exp.totalAmount || 0);

      // General & Admin Expenses (50500) -> Debit subtotal
      addAccountBalance('50500', subtotal, 0);
      // Input VAT Recoverable (10400) -> Debit taxAmount
      addAccountBalance('10400', taxAmount, 0);
      // Cash/Bank (10100) -> Credit total
      addAccountBalance('10100', 0, total);
    }

    let overallDebit = 0;
    let overallCredit = 0;

    const trialBalanceItems = accounts.map((acc) => {
      const totals = totalsMap.get(acc.id) || { debit: 0, credit: 0 };
      const debit = totals.debit;
      const credit = totals.credit;

      overallDebit += debit;
      overallCredit += credit;

      // Net balance calculation by account category
      let netBalance = 0;
      if (acc.type === "ASSET" || acc.type === "EXPENSE") {
        netBalance = debit - credit;
      } else {
        netBalance = credit - debit;
      }

      return {
        accountId: acc.id,
        code: acc.code,
        nameEnglish: acc.nameEnglish,
        nameArabic: acc.nameArabic,
        type: acc.type,
        debit: debit.toFixed(2),
        credit: credit.toFixed(2),
        netBalance: netBalance.toFixed(2),
      };
    });

    res.json({
      items: trialBalanceItems,
      totalDebit: overallDebit.toFixed(2),
      totalCredit: overallCredit.toFixed(2),
      isBalanced: Math.abs(overallDebit - overallCredit) < 0.01,
      asOfDate: new Date().toISOString(),
    });
    return;
  } catch (error: any) {
    console.error("Error fetching trial balance:", error);
    res.status(500).json({ error: error.message || "Failed to fetch trial balance" });
    return;
  }
});

export default router;
