import type { Request } from "express";
import type { OrganizationMembership } from "@workspace/db";

export type PartyPermission =
  | "customers.view"
  | "customers.create"
  | "customers.edit"
  | "customers.deactivate"
  | "customers.export"
  | "customers.import"
  | "suppliers.view"
  | "suppliers.create"
  | "suppliers.edit"
  | "suppliers.deactivate"
  | "suppliers.export"
  | "suppliers.import"
  | "contacts.manage"
  | "party_documents.manage";
  // Catalog permissions intentionally live alongside the existing finance RBAC.
export type CatalogPermission =
  | "products.view" | "products.create" | "products.edit" | "products.deactivate"
  | "products.import" | "products.export";

const rolePermissions: Record<string, Set<PartyPermission>> = {
  owner: new Set([
    "customers.view", "customers.create", "customers.edit", "customers.deactivate", "customers.export", "customers.import",
    "suppliers.view", "suppliers.create", "suppliers.edit", "suppliers.deactivate", "suppliers.export", "suppliers.import",
    "contacts.manage", "party_documents.manage",
  ]),
  admin: new Set([
    "customers.view", "customers.create", "customers.edit", "customers.deactivate", "customers.export", "customers.import",
    "suppliers.view", "suppliers.create", "suppliers.edit", "suppliers.deactivate", "suppliers.export", "suppliers.import",
    "contacts.manage", "party_documents.manage",
  ]),
  accountant: new Set([
    "customers.view", "customers.create", "customers.edit",
    "suppliers.view", "suppliers.create", "suppliers.edit",
    "contacts.manage", "party_documents.manage",
  ]),
  sales: new Set(["customers.view", "customers.create", "customers.edit", "customers.deactivate", "customers.export", "customers.import", "contacts.manage", "party_documents.manage"]),
  purchasing: new Set(["suppliers.view", "suppliers.create", "suppliers.edit", "suppliers.deactivate", "suppliers.export", "suppliers.import", "contacts.manage", "party_documents.manage"]),
  viewer: new Set(["customers.view", "suppliers.view"]),
};
const catalogPermissions: Record<string, Set<CatalogPermission>> = {
  owner: new Set(["products.view", "products.create", "products.edit", "products.deactivate", "products.import", "products.export"]),
  admin: new Set(["products.view", "products.create", "products.edit", "products.deactivate", "products.import", "products.export"]),
  accountant: new Set(["products.view", "products.create", "products.edit"]),
  sales: new Set(["products.view", "products.create", "products.edit"]),
  purchasing: new Set(["products.view", "products.create", "products.edit"]),
  viewer: new Set(["products.view"]),
};

export function hasPartyPermission(
  membership: OrganizationMembership,
  permission: PartyPermission,
) {
  return rolePermissions[membership.role]?.has(permission) ?? false;
}

export function permissionsForRole(role: string) {
  return [...(rolePermissions[role] ?? []), ...(catalogPermissions[role] ?? [])];
}

export function hasCatalogPermission(membership: OrganizationMembership, permission: CatalogPermission) {
  return catalogPermissions[membership.role]?.has(permission) ?? false;
}