import { relations } from "drizzle-orm";
import {
  boolean,
  index,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";

export const languageEnum = pgEnum("language", ["en", "ar"]);
export const membershipRoleEnum = pgEnum("membership_role", [
  "owner",
  "admin",
  "accountant",
  "sales",
  "purchasing",
  "viewer",
]);

export const usersTable = pgTable(
  "users",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    clerkUserId: text("clerk_user_id").notNull(),
    email: text("email").notNull(),
    displayName: text("display_name").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [uniqueIndex("users_clerk_user_id_idx").on(table.clerkUserId)],
);

export const organizationsTable = pgTable(
  "organizations",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    legalNameEnglish: text("legal_name_english").notNull(),
    legalNameArabic: text("legal_name_arabic"),
    tradingNameEnglish: text("trading_name_english"),
    tradingNameArabic: text("trading_name_arabic"),
    vatNumber: text("vat_number"),
    commercialRegistrationNumber: text("commercial_registration_number"),
    country: text("country").notNull().default("Saudi Arabia"),
    city: text("city"),
    address: text("address"),
    postalCode: text("postal_code"),
    additionalNumber: text("additional_number"),
    buildingNumber: text("building_number"),
    district: text("district"),
    phone: text("phone"),
    email: text("email"),
    website: text("website"),
    logoUrl: text("logo_url"),
    currency: text("currency").notNull().default("SAR"),
    fiscalYearStart: text("fiscal_year_start").notNull().default("01-01"),
    defaultLanguage: languageEnum("default_language").notNull().default("en"),
    timezone: text("timezone").notNull().default("Asia/Riyadh"),
    vatRegistered: boolean("vat_registered").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("organizations_country_idx").on(table.country),
    index("organizations_created_at_idx").on(table.createdAt),
  ],
);

export const organizationMembershipsTable = pgTable(
  "organization_memberships",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizationsTable.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    role: membershipRoleEnum("role").notNull().default("viewer"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("organization_memberships_org_user_idx").on(
      table.organizationId,
      table.userId,
    ),
    index("organization_memberships_user_idx").on(table.userId),
  ],
);

export const auditLogsTable = pgTable(
  "audit_logs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizationsTable.id, { onDelete: "cascade" }),
    userId: uuid("user_id").references(() => usersTable.id, {
      onDelete: "set null",
    }),
    action: text("action").notNull(),
    entityType: text("entity_type").notNull(),
    entityId: text("entity_id"),
    previousValues: jsonb("previous_values"),
    newValues: jsonb("new_values"),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("audit_logs_org_created_at_idx").on(
      table.organizationId,
      table.createdAt,
    ),
  ],
);

export const usersRelations = relations(usersTable, ({ many }) => ({
  memberships: many(organizationMembershipsTable),
}));

export const organizationsRelations = relations(
  organizationsTable,
  ({ many }) => ({
    memberships: many(organizationMembershipsTable),
    auditLogs: many(auditLogsTable),
  }),
);

export const organizationMembershipsRelations = relations(
  organizationMembershipsTable,
  ({ one }) => ({
    organization: one(organizationsTable, {
      fields: [organizationMembershipsTable.organizationId],
      references: [organizationsTable.id],
    }),
    user: one(usersTable, {
      fields: [organizationMembershipsTable.userId],
      references: [usersTable.id],
    }),
  }),
);

export const auditLogsRelations = relations(auditLogsTable, ({ one }) => ({
  organization: one(organizationsTable, {
    fields: [auditLogsTable.organizationId],
    references: [organizationsTable.id],
  }),
  user: one(usersTable, {
    fields: [auditLogsTable.userId],
    references: [usersTable.id],
  }),
}));

export const insertUserSchema = createInsertSchema(usersTable);
export const insertOrganizationSchema = createInsertSchema(organizationsTable);
export const insertMembershipSchema = createInsertSchema(
  organizationMembershipsTable,
);
export const insertAuditLogSchema = createInsertSchema(auditLogsTable);

export type User = typeof usersTable.$inferSelect;
export type Organization = typeof organizationsTable.$inferSelect;
export type OrganizationMembership =
  typeof organizationMembershipsTable.$inferSelect;
export type AuditLog = typeof auditLogsTable.$inferSelect;