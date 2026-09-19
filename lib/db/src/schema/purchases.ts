import { pgTable, uuid, varchar, numeric, text, timestamp, integer } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { organizationsTable } from './foundation';
import { businessPartiesTable } from './parties';

export const purchaseBillsTable = pgTable('purchase_bills', {
  id: uuid('id').defaultRandom().primaryKey(),
  organizationId: uuid('organization_id')
    .notNull()
    .references(() => organizationsTable.id, { onDelete: 'cascade' }),
  billNumber: varchar('bill_number', { length: 50 }).notNull(),
  supplierInvoiceNumber: varchar('supplier_invoice_number', { length: 100 }),
  supplierId: uuid('supplier_id')
    .notNull()
    .references(() => businessPartiesTable.id, { onDelete: 'restrict' }),
  supplierName: varchar('supplier_name', { length: 255 }).notNull(),
  supplierVatNumber: varchar('supplier_vat_number', { length: 50 }),
  billDate: timestamp('bill_date', { withTimezone: true }).notNull(),
  dueDate: timestamp('due_date', { withTimezone: true }),
  currency: varchar('currency', { length: 10 }).notNull().default('SAR'),
  subtotal: numeric('subtotal', { precision: 18, scale: 2 }).notNull().default('0.00'),
  discountAmount: numeric('discount_amount', { precision: 18, scale: 2 }).notNull().default('0.00'),
  taxAmount: numeric('tax_amount', { precision: 18, scale: 2 }).notNull().default('0.00'),
  totalAmount: numeric('total_amount', { precision: 18, scale: 2 }).notNull().default('0.00'),
  status: varchar('status', { length: 30 }).notNull().default('RECEIVED'), // DRAFT, RECEIVED, PAID, PARTIALLY_PAID, OVERDUE, CANCELLED
  notes: text('notes'),
  terms: text('terms'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const purchaseBillItemsTable = pgTable('purchase_bill_items', {
  id: uuid('id').defaultRandom().primaryKey(),
  billId: uuid('bill_id')
    .notNull()
    .references(() => purchaseBillsTable.id, { onDelete: 'cascade' }),
  catalogItemId: uuid('catalog_item_id'),
  itemCode: varchar('item_code', { length: 50 }),
  description: text('description').notNull(),
  descriptionAr: text('description_ar'),
  unitId: uuid('unit_id'),
  quantity: numeric('quantity', { precision: 18, scale: 4 }).notNull().default('1.0000'),
  unitPrice: numeric('unit_price', { precision: 18, scale: 2 }).notNull().default('0.00'),
  discountAmount: numeric('discount_amount', { precision: 18, scale: 2 }).notNull().default('0.00'),
  taxCategory: varchar('tax_category', { length: 30 }).notNull().default('STANDARD'),
  taxRate: numeric('tax_rate', { precision: 5, scale: 2 }).notNull().default('15.00'),
  taxAmount: numeric('tax_amount', { precision: 18, scale: 2 }).notNull().default('0.00'),
  lineTotal: numeric('line_total', { precision: 18, scale: 2 }).notNull().default('0.00'),
  sortOrder: integer('sort_order').notNull().default(0),
});

export const expensesTable = pgTable('expenses', {
  id: uuid('id').defaultRandom().primaryKey(),
  organizationId: uuid('organization_id')
    .notNull()
    .references(() => organizationsTable.id, { onDelete: 'cascade' }),
  expenseNumber: varchar('expense_number', { length: 50 }).notNull(),
  category: varchar('category', { length: 100 }).notNull().default('OTHER'), // RENT, UTILITIES, SALARIES, OFFICE_SUPPLIES, TRAVEL, MARKETING, OTHER
  supplierId: uuid('supplier_id').references(() => businessPartiesTable.id, { onDelete: 'set null' }),
  payeeName: varchar('payee_name', { length: 255 }).notNull(),
  expenseDate: timestamp('expense_date', { withTimezone: true }).notNull(),
  paymentMethod: varchar('payment_method', { length: 50 }).notNull().default('BANK_TRANSFER'), // CASH, BANK_TRANSFER, CREDIT_CARD, CHECK
  subtotal: numeric('subtotal', { precision: 18, scale: 2 }).notNull().default('0.00'),
  taxAmount: numeric('tax_amount', { precision: 18, scale: 2 }).notNull().default('0.00'),
  totalAmount: numeric('total_amount', { precision: 18, scale: 2 }).notNull().default('0.00'),
  taxCategory: varchar('tax_category', { length: 30 }).notNull().default('STANDARD'),
  referenceNumber: varchar('reference_number', { length: 100 }),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const purchaseSequenceCountersTable = pgTable('purchase_sequence_counters', {
  organizationId: uuid('organization_id')
    .primaryKey()
    .references(() => organizationsTable.id, { onDelete: 'cascade' }),
  lastSequence: integer('last_sequence').notNull().default(0),
});

export const expenseSequenceCountersTable = pgTable('expense_sequence_counters', {
  organizationId: uuid('organization_id')
    .primaryKey()
    .references(() => organizationsTable.id, { onDelete: 'cascade' }),
  lastSequence: integer('last_sequence').notNull().default(0),
});

export const purchaseBillsRelations = relations(purchaseBillsTable, ({ one, many }) => ({
  organization: one(organizationsTable, {
    fields: [purchaseBillsTable.organizationId],
    references: [organizationsTable.id],
  }),
  supplier: one(businessPartiesTable, {
    fields: [purchaseBillsTable.supplierId],
    references: [businessPartiesTable.id],
  }),
  items: many(purchaseBillItemsTable),
}));

export const purchaseBillItemsRelations = relations(purchaseBillItemsTable, ({ one }) => ({
  bill: one(purchaseBillsTable, {
    fields: [purchaseBillItemsTable.billId],
    references: [purchaseBillsTable.id],
  }),
}));

export const expensesRelations = relations(expensesTable, ({ one }) => ({
  organization: one(organizationsTable, {
    fields: [expensesTable.organizationId],
    references: [organizationsTable.id],
  }),
  supplier: one(businessPartiesTable, {
    fields: [expensesTable.supplierId],
    references: [businessPartiesTable.id],
  }),
}));
