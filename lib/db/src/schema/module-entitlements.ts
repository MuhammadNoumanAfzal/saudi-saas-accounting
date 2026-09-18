import { relations } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { organizationsTable } from "./foundation";

export const modulesTable = pgTable(
  "modules",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    key: text("key").notNull().unique(),
    name: text("name").notNull(),
    nameAr: text("name_ar").notNull(),
    description: text("description").notNull(),
    descriptionAr: text("description_ar").notNull(),
    category: text("category").notNull(),
    icon: text("icon").notNull(),
    route: text("route").notNull(),
    status: text("status").notNull(),
    sortOrder: integer("sort_order").notNull(),
    dependencies: jsonb("dependencies").$type<string[]>().notNull().default([]),
    availableForActivation: boolean("available_for_activation")
      .notNull()
      .default(false),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("modules_status_sort_idx").on(table.status, table.sortOrder),
  ],
);

export const organizationModulesTable = pgTable(
  "organization_modules",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizationsTable.id, { onDelete: "cascade" }),
    moduleKey: text("module_key")
      .notNull()
      .references(() => modulesTable.key, { onDelete: "restrict" }),
    enabled: boolean("enabled").notNull().default(false),
    activatedAt: timestamp("activated_at", { withTimezone: true }),
    deactivatedAt: timestamp("deactivated_at", { withTimezone: true }),
    configuration: jsonb("configuration")
      .$type<Record<string, unknown>>()
      .notNull()
      .default({}),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("organization_modules_org_key_idx").on(
      table.organizationId,
      table.moduleKey,
    ),
    index("organization_modules_enabled_idx").on(
      table.organizationId,
      table.enabled,
    ),
  ],
);

export const modulesRelations = relations(modulesTable, ({ many }) => ({
  organizations: many(organizationModulesTable),
}));

export const organizationModulesRelations = relations(
  organizationModulesTable,
  ({ one }) => ({
    organization: one(organizationsTable, {
      fields: [organizationModulesTable.organizationId],
      references: [organizationsTable.id],
    }),
    module: one(modulesTable, {
      fields: [organizationModulesTable.moduleKey],
      references: [modulesTable.key],
    }),
  }),
);

export type NexusModule = typeof modulesTable.$inferSelect;
export type OrganizationModule = typeof organizationModulesTable.$inferSelect;