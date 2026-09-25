import { and, eq, sql } from "drizzle-orm";
import {
  db,
  accountsTable,
  accountingSequenceCountersTable,
  journalEntriesTable,
  journalEntryLinesTable,
} from "@workspace/db";

type JournalLineInput = {
  accountCode: string;
  description?: string;
  debit?: number | string;
  credit?: number | string;
};

const DEFAULT_ACCOUNTS: Record<string, { nameEnglish: string; nameArabic: string; type: string; subtype: string; isSystemAccount?: boolean; isControlAccount?: boolean }> = {
  "10100": { nameEnglish: "Cash on Hand", nameArabic: "Cash on Hand", type: "ASSET", subtype: "CURRENT_ASSET", isSystemAccount: true },
  "10200": { nameEnglish: "Bank Accounts", nameArabic: "Bank Accounts", type: "ASSET", subtype: "CURRENT_ASSET", isSystemAccount: true },
  "10300": { nameEnglish: "Accounts Receivable", nameArabic: "Accounts Receivable", type: "ASSET", subtype: "CURRENT_ASSET", isSystemAccount: true, isControlAccount: true },
  "10400": { nameEnglish: "Input VAT Recoverable", nameArabic: "Input VAT Recoverable", type: "ASSET", subtype: "CURRENT_ASSET", isSystemAccount: true },
  "20100": { nameEnglish: "Accounts Payable", nameArabic: "Accounts Payable", type: "LIABILITY", subtype: "CURRENT_LIABILITY", isSystemAccount: true, isControlAccount: true },
  "20200": { nameEnglish: "Output VAT Payable", nameArabic: "Output VAT Payable", type: "LIABILITY", subtype: "CURRENT_LIABILITY", isSystemAccount: true },
  "40100": { nameEnglish: "Sales Revenue", nameArabic: "Sales Revenue", type: "REVENUE", subtype: "OPERATING_REVENUE", isSystemAccount: true },
  "50500": { nameEnglish: "General & Admin Expenses", nameArabic: "General & Admin Expenses", type: "EXPENSE", subtype: "OTHER_EXPENSE" },
};

async function nextJournalNumber(organizationId: string) {
  const existing = await db.select().from(accountingSequenceCountersTable).where(eq(accountingSequenceCountersTable.organizationId, organizationId)).limit(1);
  const nextSeq = existing.length ? existing[0].lastSequence + 1 : 1;
  if (existing.length) {
    await db.update(accountingSequenceCountersTable).set({ lastSequence: nextSeq }).where(eq(accountingSequenceCountersTable.organizationId, organizationId));
  } else {
    await db.insert(accountingSequenceCountersTable).values({ organizationId, lastSequence: nextSeq });
  }
  return `JV-${String(nextSeq).padStart(5, "0")}`;
}

async function getAccountId(organizationId: string, code: string) {
  const found = await db.select().from(accountsTable).where(and(eq(accountsTable.organizationId, organizationId), eq(accountsTable.code, code))).limit(1);
  if (found[0]) return found[0].id;
  const fallback = DEFAULT_ACCOUNTS[code] || { nameEnglish: `Account ${code}`, nameArabic: `Account ${code}`, type: "EXPENSE", subtype: "OTHER" };
  const [created] = await db.insert(accountsTable).values({
    organizationId,
    code,
    nameEnglish: fallback.nameEnglish,
    nameArabic: fallback.nameArabic,
    type: fallback.type,
    subtype: fallback.subtype,
    isSystemAccount: fallback.isSystemAccount || false,
    isControlAccount: fallback.isControlAccount || false,
    status: "ACTIVE",
  }).returning();
  return created.id;
}

export async function postJournalEntry(input: {
  organizationId: string;
  sourceDocumentType: string;
  sourceDocumentId: string;
  referenceNumber?: string | null;
  description: string;
  entryDate?: Date;
  lines: JournalLineInput[];
  replaceExisting?: boolean;
}) {
  const lines = input.lines
    .map((line) => ({ ...line, debit: Number(line.debit || 0), credit: Number(line.credit || 0) }))
    .filter((line) => line.debit > 0 || line.credit > 0);
  const totalDebit = lines.reduce((sum, line) => sum + line.debit, 0);
  const totalCredit = lines.reduce((sum, line) => sum + line.credit, 0);
  if (lines.length < 2 || Math.abs(totalDebit - totalCredit) > 0.005) {
    throw new Error("Journal entry must be balanced");
  }

  if (input.replaceExisting) {
    await db.delete(journalEntriesTable).where(and(
      eq(journalEntriesTable.organizationId, input.organizationId),
      eq(journalEntriesTable.sourceDocumentType, input.sourceDocumentType),
      eq(journalEntriesTable.sourceDocumentId, input.sourceDocumentId),
    ));
  }

  const entryNumber = await nextJournalNumber(input.organizationId);
  const entryDate = input.entryDate || new Date();
  const [entry] = await db.insert(journalEntriesTable).values({
    organizationId: input.organizationId,
    entryNumber,
    entryDate,
    postingDate: entryDate,
    referenceNumber: input.referenceNumber || null,
    sourceDocumentType: input.sourceDocumentType,
    sourceDocumentId: input.sourceDocumentId,
    description: input.description,
    status: "POSTED",
    totalDebit: totalDebit.toFixed(2),
    totalCredit: totalCredit.toFixed(2),
  }).returning();

  await db.insert(journalEntryLinesTable).values(await Promise.all(lines.map(async (line, index) => ({
    journalEntryId: entry.id,
    accountId: await getAccountId(input.organizationId, line.accountCode),
    description: line.description || input.description,
    debit: line.debit.toFixed(2),
    credit: line.credit.toFixed(2),
    sortOrder: index,
  }))));

  return entry;
}

export async function getPostedAmount(organizationId: string, sourceDocumentType: string, sourceDocumentId: string, accountCode: string, side: "debit" | "credit") {
  const account = await db.select().from(accountsTable).where(and(eq(accountsTable.organizationId, organizationId), eq(accountsTable.code, accountCode))).limit(1);
  if (!account[0]) return 0;
  const [row] = await db.select({ total: sql<string>`coalesce(sum(${side === "debit" ? journalEntryLinesTable.debit : journalEntryLinesTable.credit}), '0.00')` })
    .from(journalEntryLinesTable)
    .innerJoin(journalEntriesTable, eq(journalEntryLinesTable.journalEntryId, journalEntriesTable.id))
    .where(and(
      eq(journalEntriesTable.organizationId, organizationId),
      eq(journalEntriesTable.sourceDocumentType, sourceDocumentType),
      eq(journalEntriesTable.sourceDocumentId, sourceDocumentId),
      eq(journalEntryLinesTable.accountId, account[0].id),
    ));
  return Number(row?.total || 0);
}
