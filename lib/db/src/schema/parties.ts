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
import { organizationsTable, usersTable } from "./foundation";

export const businessPartiesTable = pgTable(
  "business_parties",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id").notNull().references(() => organizationsTable.id, { onDelete: "cascade" }),
    partyType: text("party_type").notNull().default("organization"),
    businessNameEnglish: text("business_name_english"),
    businessNameArabic: text("business_name_arabic"),
    legalNameEnglish: text("legal_name_english"),
    legalNameArabic: text("legal_name_arabic"),
    firstName: text("first_name"),
    lastName: text("last_name"),
    arabicName: text("arabic_name"),
    displayName: text("display_name").notNull(),
    commercialRegistrationNumber: text("commercial_registration_number"),
    vatRegistered: boolean("vat_registered").notNull().default(false),
    vatNumber: text("vat_number"),
    primaryEmail: text("primary_email"),
    primaryPhone: text("primary_phone"),
    city: text("city"),
    website: text("website"),
    defaultCurrency: text("default_currency").notNull().default("SAR"),
    defaultLanguage: text("default_language").notNull().default("en"),
    notes: text("notes"),
    status: text("status").notNull().default("active"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("business_parties_org_idx").on(table.organizationId),
    index("business_parties_org_display_idx").on(table.organizationId, table.displayName),
    index("business_parties_org_vat_idx").on(table.organizationId, table.vatNumber),
    index("business_parties_org_cr_idx").on(table.organizationId, table.commercialRegistrationNumber),
    index("business_parties_org_email_idx").on(table.organizationId, table.primaryEmail),
    index("business_parties_org_status_idx").on(table.organizationId, table.status),
  ],
);

export const partyRolesTable = pgTable(
  "party_roles",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id").notNull().references(() => organizationsTable.id, { onDelete: "cascade" }),
    partyId: uuid("party_id").notNull().references(() => businessPartiesTable.id, { onDelete: "cascade" }),
    role: text("role").notNull(),
    partyNumber: text("party_number").notNull(),
    paymentTerms: text("payment_terms"),
    creditLimit: numeric("credit_limit", { precision: 18, scale: 2 }),
    taxTreatment: text("tax_treatment"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("party_roles_org_party_role_idx").on(table.organizationId, table.partyId, table.role),
    uniqueIndex("party_roles_org_number_idx").on(table.organizationId, table.partyNumber),
    index("party_roles_org_role_idx").on(table.organizationId, table.role),
  ],
);

export const partySequenceCountersTable = pgTable(
  "party_sequence_counters",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id").notNull().references(() => organizationsTable.id, { onDelete: "cascade" }),
    sequenceKey: text("sequence_key").notNull(),
    nextValue: integer("next_value").notNull().default(1),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [uniqueIndex("party_sequence_org_key_idx").on(table.organizationId, table.sequenceKey)],
);

export const partyContactsTable = pgTable(
  "party_contacts",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id").notNull().references(() => organizationsTable.id, { onDelete: "cascade" }),
    partyId: uuid("party_id").notNull().references(() => businessPartiesTable.id, { onDelete: "cascade" }),
    firstName: text("first_name").notNull(),
    lastName: text("last_name"),
    jobTitle: text("job_title"),
    department: text("department"),
    email: text("email"),
    phone: text("phone"),
    mobile: text("mobile"),
    preferredLanguage: text("preferred_language").notNull().default("en"),
    notes: text("notes"),
    isPrimary: boolean("is_primary").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("party_contacts_org_party_idx").on(table.organizationId, table.partyId),
    index("party_contacts_org_primary_idx").on(table.organizationId, table.partyId, table.isPrimary),
  ],
);

export const partyAddressesTable = pgTable(
  "party_addresses",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id").notNull().references(() => organizationsTable.id, { onDelete: "cascade" }),
    partyId: uuid("party_id").notNull().references(() => businessPartiesTable.id, { onDelete: "cascade" }),
    label: text("label"),
    addressType: text("address_type").notNull().default("other"),
    buildingNumber: text("building_number"),
    street: text("street"),
    district: text("district"),
    city: text("city"),
    province: text("province"),
    postalCode: text("postal_code"),
    additionalNumber: text("additional_number"),
    country: text("country").notNull().default("Saudi Arabia"),
    isDefaultBilling: boolean("is_default_billing").notNull().default(false),
    isDefaultShipping: boolean("is_default_shipping").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index("party_addresses_org_party_idx").on(table.organizationId, table.partyId)],
);

export const organizationTagsTable = pgTable(
  "organization_tags",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id").notNull().references(() => organizationsTable.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    color: text("color"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [uniqueIndex("organization_tags_org_name_idx").on(table.organizationId, table.name)],
);

export const partyTagsTable = pgTable(
  "party_tags",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id").notNull().references(() => organizationsTable.id, { onDelete: "cascade" }),
    partyId: uuid("party_id").notNull().references(() => businessPartiesTable.id, { onDelete: "cascade" }),
    tagId: uuid("tag_id").notNull().references(() => organizationTagsTable.id, { onDelete: "cascade" }),
  },
  (table) => [
    uniqueIndex("party_tags_org_party_tag_idx").on(table.organizationId, table.partyId, table.tagId),
    index("party_tags_org_party_idx").on(table.organizationId, table.partyId),
  ],
);

export const partyDocumentsTable = pgTable(
  "party_documents",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id").notNull().references(() => organizationsTable.id, { onDelete: "cascade" }),
    partyId: uuid("party_id").notNull().references(() => businessPartiesTable.id, { onDelete: "cascade" }),
    fileName: text("file_name").notNull(),
    documentType: text("document_type").notNull().default("other"),
    objectPath: text("object_path").notNull(),
    contentType: text("content_type"),
    size: integer("size"),
    uploadedBy: uuid("uploaded_by").references(() => usersTable.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("party_documents_org_party_idx").on(table.organizationId, table.partyId),
    uniqueIndex("party_documents_object_path_idx").on(table.organizationId, table.objectPath),
  ],
);

export const businessPartiesRelations = relations(businessPartiesTable, ({ many }) => ({
  roles: many(partyRolesTable),
  contacts: many(partyContactsTable),
  addresses: many(partyAddressesTable),
  tags: many(partyTagsTable),
  documents: many(partyDocumentsTable),
}));