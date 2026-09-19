import { pgTable, uuid, varchar, numeric, text, timestamp, integer } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { organizationsTable } from './foundation';
import { businessPartiesTable } from './parties';
import { quotationsTable } from './quotations';

export const invoicesTable = pgTable('invoices', {
  id: uuid('id').defaultRandom().primaryKey(),
  organizationId: uuid('organization_id')
    .notNull()
    .references(() => organizationsTable.id, { onDelete: 'cascade' }),
  invoiceNumber: varchar('invoice_number', { length: 50 }).notNull(),
  invoiceType: varchar('invoice_type', { length: 30 }).notNull().default('STANDARD'), // STANDARD (B2B), SIMPLIFIED (B2C)
  quotationId: uuid('quotation_id').references(() => quotationsTable.id, { onDelete: 'set null' }),
  customerId: uuid('customer_id')
    .notNull()
    .references(() => businessPartiesTable.id, { onDelete: 'restrict' }),
  customerName: varchar('customer_name', { length: 255 }).notNull(),
  customerVatNumber: varchar('customer_vat_number', { length: 50 }),
  issueDate: timestamp('issue_date', { withTimezone: true }).notNull(),
  dueDate: timestamp('due_date', { withTimezone: true }),
  currency: varchar('currency', { length: 10 }).notNull().default('SAR'),
  subtotal: numeric('subtotal', { precision: 18, scale: 2 }).notNull().default('0.00'),
  discountAmount: numeric('discount_amount', { precision: 18, scale: 2 }).notNull().default('0.00'),
  taxAmount: numeric('tax_amount', { precision: 18, scale: 2 }).notNull().default('0.00'),
  totalAmount: numeric('total_amount', { precision: 18, scale: 2 }).notNull().default('0.00'),
  status: varchar('status', { length: 30 }).notNull().default('DRAFT'), // DRAFT, ISSUED, PAID, PARTIALLY_PAID, OVERDUE, CANCELLED
  zatcaQrCode: text('zatca_qr_code'),
  notes: text('notes'),
  terms: text('terms'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const invoiceItemsTable = pgTable('invoice_items', {
  id: uuid('id').defaultRandom().primaryKey(),
  invoiceId: uuid('invoice_id')
    .notNull()
    .references(() => invoicesTable.id, { onDelete: 'cascade' }),
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

export const invoiceSequenceCountersTable = pgTable('invoice_sequence_counters', {
  organizationId: uuid('organization_id')
    .primaryKey()
    .references(() => organizationsTable.id, { onDelete: 'cascade' }),
  lastSequence: integer('last_sequence').notNull().default(0),
});

export const invoicesRelations = relations(invoicesTable, ({ one, many }) => ({
  organization: one(organizationsTable, {
    fields: [invoicesTable.organizationId],
    references: [organizationsTable.id],
  }),
  customer: one(businessPartiesTable, {
    fields: [invoicesTable.customerId],
    references: [businessPartiesTable.id],
  }),
  quotation: one(quotationsTable, {
    fields: [invoicesTable.quotationId],
    references: [quotationsTable.id],
  }),
  items: many(invoiceItemsTable),
}));

export const invoiceItemsRelations = relations(invoiceItemsTable, ({ one }) => ({
  invoice: one(invoicesTable, {
    fields: [invoiceItemsTable.invoiceId],
    references: [invoicesTable.id],
  }),
}));
