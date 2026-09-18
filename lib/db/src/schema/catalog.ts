import {
  boolean, index, integer, numeric, pgTable, text, timestamp, uniqueIndex, uuid,
} from "drizzle-orm/pg-core";
import { organizationsTable } from "./foundation";

export const organizationUnitsTable = pgTable("organization_units", {
  id: uuid("id").defaultRandom().primaryKey(),
  organizationId: uuid("organization_id").notNull().references(() => organizationsTable.id, { onDelete: "cascade" }),
  code: text("code").notNull(),
  name: text("name").notNull(),
  nameAr: text("name_ar").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  uniqueIndex("organization_units_org_code_idx").on(table.organizationId, table.code),
  index("organization_units_org_idx").on(table.organizationId),
]);

export const catalogItemsTable = pgTable("catalog_items", {
  id: uuid("id").defaultRandom().primaryKey(),
  organizationId: uuid("organization_id").notNull().references(() => organizationsTable.id, { onDelete: "cascade" }),
  type: text("type").notNull().default("PRODUCT"),
  code: text("code").notNull(),
  name: text("name").notNull(),
  nameAr: text("name_ar").notNull(),
  description: text("description"),
  descriptionAr: text("description_ar"),
  unitId: uuid("unit_id").notNull().references(() => organizationUnitsTable.id, { onDelete: "restrict" }),
  salesPrice: numeric("sales_price", { precision: 18, scale: 2 }).notNull().default("0"),
  purchasePrice: numeric("purchase_price", { precision: 18, scale: 2 }).notNull().default("0"),
  taxCategory: text("tax_category").notNull().default("STANDARD"),
  taxRate: numeric("tax_rate", { precision: 5, scale: 2 }).notNull().default("15"),
  sku: text("sku"),
  barcode: text("barcode"),
  trackInventory: boolean("track_inventory").notNull().default(false),
  status: text("status").notNull().default("ACTIVE"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  uniqueIndex("catalog_items_org_code_idx").on(table.organizationId, table.code),
  index("catalog_items_org_type_idx").on(table.organizationId, table.type),
  index("catalog_items_org_status_idx").on(table.organizationId, table.status),
  index("catalog_items_org_tax_idx").on(table.organizationId, table.taxCategory),
  index("catalog_items_org_sku_idx").on(table.organizationId, table.sku),
  index("catalog_items_org_barcode_idx").on(table.organizationId, table.barcode),
]);

export type CatalogItem = typeof catalogItemsTable.$inferSelect;
export type OrganizationUnit = typeof organizationUnitsTable.$inferSelect;