import { and, eq } from "drizzle-orm";
import {
  db,
  modulesTable,
  organizationModulesTable,
  organizationsTable,
} from "@workspace/db";
import {
  MODULE_REGISTRY,
  type ModuleKey,
} from "@workspace/platform-core";

export async function synchronizeModuleRegistry() {
  for (const module of MODULE_REGISTRY) {
    await db
      .insert(modulesTable)
      .values({
        key: module.key,
        name: module.name,
        nameAr: module.nameAr,
        description: module.description,
        descriptionAr: module.descriptionAr,
        category: module.category,
        icon: module.icon,
        route: module.route,
        status: module.status,
        sortOrder: module.sortOrder,
        dependencies: [...module.dependencies],
        availableForActivation: module.availableForActivation,
      })
      .onConflictDoUpdate({
        target: modulesTable.key,
        set: {
          name: module.name,
          nameAr: module.nameAr,
          description: module.description,
          descriptionAr: module.descriptionAr,
          category: module.category,
          icon: module.icon,
          route: module.route,
          status: module.status,
          sortOrder: module.sortOrder,
          dependencies: [...module.dependencies],
          availableForActivation: module.availableForActivation,
          updatedAt: new Date(),
        },
      });
  }

  const organizations = await db
    .select({ id: organizationsTable.id })
    .from(organizationsTable);
  if (organizations.length) {
    await db
      .insert(organizationModulesTable)
      .values(
        organizations.map((organization) => ({
          organizationId: organization.id,
          moduleKey: "finance",
          enabled: true,
          activatedAt: new Date(),
        })),
      )
      .onConflictDoNothing();
  }
}

export async function enableFinanceForOrganization(organizationId: string) {
  await db
    .insert(organizationModulesTable)
    .values({
      organizationId,
      moduleKey: "finance",
      enabled: true,
      activatedAt: new Date(),
    })
    .onConflictDoNothing();
}

export async function hasModuleEntitlement(
  organizationId: string,
  moduleKey: ModuleKey,
) {
  const [entitlement] = await db
    .select({ enabled: organizationModulesTable.enabled })
    .from(organizationModulesTable)
    .where(
      and(
        eq(organizationModulesTable.organizationId, organizationId),
        eq(organizationModulesTable.moduleKey, moduleKey),
        eq(organizationModulesTable.enabled, true),
      ),
    );
  return entitlement?.enabled ?? false;
}