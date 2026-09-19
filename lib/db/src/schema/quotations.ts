import { relations } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  numeric,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { organizationsTable } from "./foundation";
import { businessPartiesTable } from "./parties";
import { catalogItemsTable, organizationUnitsTable } from "./catalog";

export const quotationsTable = pgTable(
  "quotations",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id").notNull().references(() => organizationsTable.id, { onDelete: "cascade" }),
    quotationNumber: text("quotation_number").notNull(),
    customerId: uuid("customer_id").notNull().references(() => businessPartiesTable.id, { onDelete: "restrict" }),
    issueDate: timestamp("issue_date", { withTimezone: true }).notNull().defaultNow(),
    validUntilDate: timestamp("valid_until_date", { withTimezone: true }),
    currency: text("currency").notNull().default("SAR"),
    subtotal: numeric("subtotal", { precision: 18, scale: 2 }).notNull().default("0.00"),
    discountAmount: numeric("discount_amount", { precision: 18, scale: 2 }).notNull().default("0.00"),
    taxAmount: numeric("tax_amount", { precision: 18, scale: 2 }).notNull().default("0.00"),
    totalAmount: numeric("total_amount", { precision: 18, scale: 2 }).notNull().default("0.00"),
    status: text("status").notNull().default("DRAFT"), // DRAFT | SENT | ACCEPTED | DECLINED | EXPIRED | CONVERTED
    notes: text("notes"),
    terms: text("terms"),
    convertedInvoiceId: uuid("converted_invoice_id"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("quotations_org_number_idx").on(table.organizationId, table.quotationNumber),
    index("quotations_org_customer_idx").on(table.organizationId, table.customerId),
    index("quotations_org_status_idx").on(table.organizationId, table.status),
    index("quotations_org_issue_date_idx").on(table.organizationId, table.issueDate),
  ],
);

export const quotationItemsTable = pgTable(
  "quotation_items",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id").notNull().references(() => organizationsTable.id, { onDelete: "cascade" }),
    quotationId: uuid("quotation_id").notNull().references(() => quotationsTable.id, { onDelete: "cascade" }),
    catalogItemId: uuid("catalog_item_id").references(() => catalogItemsTable.id, { onDelete: "set null" }),
    itemCode: text("item_code"),
    description: text("description").notNull(),
    descriptionAr: text("description_ar"),
    unitId: uuid("unit_id").references(() => organizationUnitsTable.id, { onDelete: "set null" }),
    quantity: numeric("quantity", { precision: 18, scale: 4 }).notNull().default("1.0000"),
    unitPrice: numeric("unit_price", { precision: 18, scale: 2 }).notNull().default("0.00"),
    discountAmount: numeric("discount_amount", { precision: 18, scale: 2 }).notNull().default("0.00"),
    taxCategory: text("tax_category").notNull().default("STANDARD"), // STANDARD | ZERO | EXEMPT | OUT_OF_SCOPE
    taxRate: numeric("tax_rate", { precision: 5, scale: 2 }).notNull().default("15.00"),
    taxAmount: numeric("tax_amount", { precision: 18, scale: 2 }).notNull().default("0.00"),
    lineTotal: numeric("line_total", { precision: 18, scale: 2 }).notNull().default("0.00"),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("quotation_items_org_quotation_idx").on(table.organizationId, table.quotationId),
    index("quotation_items_org_catalog_idx").on(table.organizationId, table.catalogItemId),
  ],
);

export const quotationSequenceCountersTable = pgTable(
  "quotation_sequence_counters",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id").notNull().references(() => organizationsTable.id, { onDelete: "cascade" }),
    nextValue: integer("next_value").notNull().default(1),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [uniqueIndex("quotation_sequence_org_idx").on(table.organizationId)],
);

export const quotationsRelations = relations(quotationsTable, ({ one, many }) => ({
  customer: one(businessPartiesTable, {
    fields: [quotationsTable.customerId],
    references: [businessPartiesTable.id],
  }),
  items: many(quotationItemsTable),
}));

export const quotationItemsRelations = relations(quotationItemsTable, ({ one }) => ({
  quotation: one(quotationsTable, {
    fields: [quotationItemsTable.quotationId],
    references: [quotationsTable.id],
  }),
  catalogItem: one(catalogItemsTable, {
    fields: [quotationItemsTable.catalogItemId],
    references: [catalogItemsTable.id],
  }),
  unit: one(organizationUnitsTable, {
    fields: [quotationItemsTable.unitId],
    references: [organizationUnitsTable.id],
  }),
}));

export type Quotation = typeof quotationsTable.$inferSelect;
export type QuotationItem = typeof quotationItemsTable.$inferSelect;
