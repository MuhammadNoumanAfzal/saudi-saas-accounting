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

export function hasPartyPermission(
  membership: OrganizationMembership,
  permission: PartyPermission,
) {
  return rolePermissions[membership.role]?.has(permission) ?? false;
}

export function permissionsForRole(role: string) {
  return [...(rolePermissions[role] ?? [])];
}