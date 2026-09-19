import { pgTable, uuid, varchar, numeric, text, timestamp, integer, boolean } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { organizationsTable } from './foundation';

export const accountsTable = pgTable('accounts', {
  id: uuid('id').defaultRandom().primaryKey(),
  organizationId: uuid('organization_id')
    .notNull()
    .references(() => organizationsTable.id, { onDelete: 'cascade' }),
  code: varchar('code', { length: 50 }).notNull(),
  nameEnglish: varchar('name_english', { length: 255 }).notNull(),
  nameArabic: varchar('name_arabic', { length: 255 }).notNull(),
  type: varchar('type', { length: 30 }).notNull(), // ASSET, LIABILITY, EQUITY, REVENUE, EXPENSE
  subtype: varchar('subtype', { length: 50 }).notNull().default('OTHER'),
  parentAccountId: uuid('parent_account_id'),
  isSystemAccount: boolean('is_system_account').notNull().default(false),
  isControlAccount: boolean('is_control_account').notNull().default(false),
  status: varchar('status', { length: 20 }).notNull().default('ACTIVE'), // ACTIVE, INACTIVE
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const journalEntriesTable = pgTable('journal_entries', {
  id: uuid('id').defaultRandom().primaryKey(),
  organizationId: uuid('organization_id')
    .notNull()
    .references(() => organizationsTable.id, { onDelete: 'cascade' }),
  entryNumber: varchar('entry_number', { length: 50 }).notNull(),
  entryDate: timestamp('entry_date', { withTimezone: true }).notNull(),
  postingDate: timestamp('posting_date', { withTimezone: true }).notNull(),
  referenceNumber: varchar('reference_number', { length: 100 }),
  sourceDocumentType: varchar('source_document_type', { length: 50 }).notNull().default('MANUAL_JOURNAL'), // INVOICE, PURCHASE_BILL, EXPENSE, MANUAL_JOURNAL
  sourceDocumentId: uuid('source_document_id'),
  description: text('description').notNull(),
  descriptionAr: text('description_ar'),
  status: varchar('status', { length: 20 }).notNull().default('POSTED'), // DRAFT, POSTED, REVERSED, CANCELLED
  totalDebit: numeric('total_debit', { precision: 18, scale: 2 }).notNull().default('0.00'),
  totalCredit: numeric('total_credit', { precision: 18, scale: 2 }).notNull().default('0.00'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const journalEntryLinesTable = pgTable('journal_entry_lines', {
  id: uuid('id').defaultRandom().primaryKey(),
  journalEntryId: uuid('journal_entry_id')
    .notNull()
    .references(() => journalEntriesTable.id, { onDelete: 'cascade' }),
  accountId: uuid('account_id')
    .notNull()
    .references(() => accountsTable.id, { onDelete: 'restrict' }),
  description: text('description'),
  debit: numeric('debit', { precision: 18, scale: 2 }).notNull().default('0.00'),
  credit: numeric('credit', { precision: 18, scale: 2 }).notNull().default('0.00'),
  sortOrder: integer('sort_order').notNull().default(0),
});

export const accountingSequenceCountersTable = pgTable('accounting_sequence_counters', {
  organizationId: uuid('organization_id')
    .primaryKey()
    .references(() => organizationsTable.id, { onDelete: 'cascade' }),
  lastSequence: integer('last_sequence').notNull().default(0),
});

export const accountsRelations = relations(accountsTable, ({ one, many }) => ({
  organization: one(organizationsTable, {
    fields: [accountsTable.organizationId],
    references: [organizationsTable.id],
  }),
  parentAccount: one(accountsTable, {
    fields: [accountsTable.parentAccountId],
    references: [accountsTable.id],
  }),
  journalLines: many(journalEntryLinesTable),
}));

export const journalEntriesRelations = relations(journalEntriesTable, ({ one, many }) => ({
  organization: one(organizationsTable, {
    fields: [journalEntriesTable.organizationId],
    references: [organizationsTable.id],
  }),
  lines: many(journalEntryLinesTable),
}));

export const journalEntryLinesRelations = relations(journalEntryLinesTable, ({ one }) => ({
  entry: one(journalEntriesTable, {
    fields: [journalEntryLinesTable.journalEntryId],
    references: [journalEntriesTable.id],
  }),
  account: one(accountsTable, {
    fields: [journalEntryLinesTable.accountId],
    references: [accountsTable.id],
  }),
}));
