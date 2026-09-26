import { relations } from "drizzle-orm";
import {
  boolean,
  index,
  jsonb,
  integer,
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
export const businessTypeEnum = pgEnum("business_type", [
  "establishment",
  "limited_liability_company",
  "joint_stock_company",
  "professional_company",
  "non_profit",
  "other",
]);
export const numberFormatEnum = pgEnum("number_format", ["western", "arabic"]);
export const invoiceLanguageEnum = pgEnum("invoice_language", [
  "en",
  "ar",
  "bilingual",
]);
export const appearanceEnum = pgEnum("appearance", [
  "light",
  "dark",
  "system",
]);
export const densityEnum = pgEnum("density", ["compact", "comfortable"]);
export const branchStatusEnum = pgEnum("branch_status", ["ACTIVE", "INACTIVE"]);
export const invitationStatusEnum = pgEnum("invitation_status", ["PENDING", "ACCEPTED", "REVOKED", "EXPIRED"]);

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
    businessType: businessTypeEnum("business_type"),
    vatNumber: text("vat_number"),
    commercialRegistrationNumber: text("commercial_registration_number"),
    country: text("country").notNull().default("Saudi Arabia"),
    city: text("city"),
    address: text("address"),
    streetName: text("street_name"),
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
    numberFormat: numberFormatEnum("number_format")
      .notNull()
      .default("western"),
    invoiceLanguage: invoiceLanguageEnum("invoice_language")
      .notNull()
      .default("bilingual"),
    onboardingCompleted: boolean("onboarding_completed")
      .notNull()
      .default(false),
    onboardingCurrentStep: integer("onboarding_current_step")
      .notNull()
      .default(1),
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

export const organizationBranchesTable = pgTable(
  "organization_branches",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizationsTable.id, { onDelete: "cascade" }),
    code: text("code").notNull(),
    nameEnglish: text("name_english").notNull(),
    nameArabic: text("name_arabic"),
    vatNumber: text("vat_number"),
    commercialRegistrationNumber: text("commercial_registration_number"),
    buildingNumber: text("building_number"),
    street: text("street"),
    district: text("district"),
    city: text("city"),
    province: text("province"),
    postalCode: text("postal_code"),
    additionalNumber: text("additional_number"),
    country: text("country").notNull().default("Saudi Arabia"),
    phone: text("phone"),
    email: text("email"),
    status: branchStatusEnum("status").notNull().default("ACTIVE"),
    isMain: boolean("is_main").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("organization_branches_org_code_idx").on(table.organizationId, table.code),
    index("organization_branches_org_status_idx").on(table.organizationId, table.status),
  ],
);

export const organizationInvitationsTable = pgTable(
  "organization_invitations",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizationsTable.id, { onDelete: "cascade" }),
    email: text("email").notNull(),
    displayName: text("display_name"),
    role: membershipRoleEnum("role").notNull().default("viewer"),
    branchId: text("branch_id"),
    status: invitationStatusEnum("status").notNull().default("PENDING"),
    clerkInvitationId: text("clerk_invitation_id"),
    invitedByUserId: uuid("invited_by_user_id").references(() => usersTable.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("organization_invitations_org_email_idx").on(table.organizationId, table.email),
    index("organization_invitations_org_status_idx").on(table.organizationId, table.status),
  ],
);

export const userPreferencesTable = pgTable(
  "user_preferences",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    language: languageEnum("language").notNull().default("en"),
    appearance: appearanceEnum("appearance").notNull().default("light"),
    density: densityEnum("density").notNull().default("comfortable"),
    sidebarCollapsed: boolean("sidebar_collapsed").notNull().default(false),
    currentOrganizationId: uuid("current_organization_id").references(
      () => organizationsTable.id,
      { onDelete: "set null" },
    ),
    currentBranchId: text("current_branch_id"),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("user_preferences_user_idx").on(table.userId),
    index("user_preferences_current_org_idx").on(table.currentOrganizationId),
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
    branchId: text("branch_id"),
    status: text("status").notNull().default("ACTIVE"),
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

export const usersRelations = relations(usersTable, ({ many, one }) => ({
  memberships: many(organizationMembershipsTable),
  preferences: one(userPreferencesTable, {
    fields: [usersTable.id],
    references: [userPreferencesTable.userId],
  }),
}));

export const organizationsRelations = relations(
  organizationsTable,
  ({ many }) => ({
    memberships: many(organizationMembershipsTable),
    auditLogs: many(auditLogsTable),
  }),
);

export const organizationBranchesRelations = relations(
  organizationBranchesTable,
  ({ one, many }) => ({
    organization: one(organizationsTable, {
      fields: [organizationBranchesTable.organizationId],
      references: [organizationsTable.id],
    }),
    memberships: many(organizationMembershipsTable),
    invitations: many(organizationInvitationsTable),
  }),
);

export const organizationInvitationsRelations = relations(
  organizationInvitationsTable,
  ({ one }) => ({
    organization: one(organizationsTable, {
      fields: [organizationInvitationsTable.organizationId],
      references: [organizationsTable.id],
    }),
    branch: one(organizationBranchesTable, {
      fields: [organizationInvitationsTable.branchId],
      references: [organizationBranchesTable.id],
    }),
    invitedBy: one(usersTable, {
      fields: [organizationInvitationsTable.invitedByUserId],
      references: [usersTable.id],
    }),
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
export const insertUserPreferencesSchema =
  createInsertSchema(userPreferencesTable);

export type User = typeof usersTable.$inferSelect;
export type Organization = typeof organizationsTable.$inferSelect;
export type OrganizationMembership =
  typeof organizationMembershipsTable.$inferSelect;
export type AuditLog = typeof auditLogsTable.$inferSelect;
export type UserPreferences = typeof userPreferencesTable.$inferSelect;