import { Router, type IRouter } from "express";
import { and, desc, eq, inArray, sql } from "drizzle-orm";
import {
  AuditLog,
  CreateOrganizationBody,
  CreateOrganizationResponse,
  GetCurrentSessionResponse,
  GetDashboardSummaryParams,
  GetDashboardSummaryResponse,
  GetOrganizationParams,
  GetOrganizationResponse,
  ListAuditLogsParams,
  ListAuditLogsResponse,
  ListModulesResponse,
  ListOrganizationModulesParams,
  ListOrganizationModulesResponse,
  OrganizationMembership,
  UpdateUserPreferencesBody,
  UpdateUserPreferencesResponse,
  UpdateOrganizationBody,
  UpdateOrganizationParams,
  UpdateOrganizationResponse,
} from "@workspace/api-zod";
import {
  auditLogsTable,
  businessPartiesTable,
  partyRolesTable,
  db,
  organizationMembershipsTable,
  organizationInvitationsTable,
  organizationModulesTable,
  organizationsTable,
  userPreferencesTable,
  usersTable,
  catalogItemsTable,
} from "@workspace/db";
import { MODULE_REGISTRY } from "@workspace/platform-core";
import {
  getMembership,
  getOrCreateLocalUser,
  requireAuthentication,
} from "../middlewares/auth";
import { enableFinanceForOrganization } from "../lib/moduleEntitlements";
import { requireModule } from "../middlewares/moduleEntitlement";

const router: IRouter = Router();
router.use(requireAuthentication);

function toOrganization(value: typeof organizationsTable.$inferSelect) {
  return {
    ...value,
    createdAt: value.createdAt.toISOString(),
  };
}

async function getOrCreatePreferences(userId: string) {
  const [existing] = await db
    .select()
    .from(userPreferencesTable)
    .where(eq(userPreferencesTable.userId, userId))
    .limit(1);
  if (existing) return existing;
  const [created] = await db
    .insert(userPreferencesTable)
    .values({ userId })
    .onConflictDoNothing({ target: userPreferencesTable.userId })
    .returning();
  if (created) return created;
  const [concurrent] = await db
    .select()
    .from(userPreferencesTable)
    .where(eq(userPreferencesTable.userId, userId))
    .limit(1);
  if (!concurrent) throw new Error("Unable to initialize user preferences");
  return concurrent;
}

function toPreferences(value: typeof userPreferencesTable.$inferSelect) {
  return {
    language: value.language,
    appearance: value.appearance,
    density: value.density,
    sidebarCollapsed: value.sidebarCollapsed,
    currentOrganizationId: value.currentOrganizationId,
    currentBranchId: value.currentBranchId,
  };
}

router.get("/me", async (req, res): Promise<void> => {
  try {
    const user = await getOrCreateLocalUser(req);
    if (!user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    // Auto-accept pending organization invitations for this verified Clerk email.
    const pendingInvitations = await db
      .select()
      .from(organizationInvitationsTable)
      .where(and(eq(organizationInvitationsTable.email, user.email.toLowerCase()), eq(organizationInvitationsTable.status, "PENDING")));

    for (const invite of pendingInvitations) {
      await db
        .insert(organizationMembershipsTable)
        .values({
          organizationId: invite.organizationId,
          userId: user.id,
          role: invite.role,
          branchId: invite.branchId,
          status: "ACTIVE",
        })
        .onConflictDoUpdate({
          target: [organizationMembershipsTable.organizationId, organizationMembershipsTable.userId],
          set: { role: invite.role, branchId: invite.branchId, status: "ACTIVE" },
        });
      await db
        .update(organizationInvitationsTable)
        .set({ status: "ACCEPTED", updatedAt: new Date() })
        .where(eq(organizationInvitationsTable.id, invite.id));
    }

    const memberships = await db
      .select({
        organization: organizationsTable,
        role: organizationMembershipsTable.role,
      })
      .from(organizationMembershipsTable)
      .innerJoin(
        organizationsTable,
        eq(organizationsTable.id, organizationMembershipsTable.organizationId),
      )
      .where(eq(organizationMembershipsTable.userId, user.id))
      .orderBy(desc(organizationsTable.createdAt));

    const preferences = await getOrCreatePreferences(user.id);

    if (
      memberships.length > 0 &&
      (!preferences.currentOrganizationId ||
        !memberships.some((m) => m.organization.id === preferences.currentOrganizationId))
    ) {
      await db
        .update(userPreferencesTable)
        .set({ currentOrganizationId: memberships[0].organization.id })
        .where(eq(userPreferencesTable.userId, user.id));
      preferences.currentOrganizationId = memberships[0].organization.id;
    }

    res.json(
      GetCurrentSessionResponse.parse({
        user: {
          id: user.id,
          email: user.email,
          displayName: user.displayName,
        },
        organizations: memberships.map((item) => ({
          organization: toOrganization(item.organization),
          role: item.role,
        })),
        preferences: toPreferences(preferences),
      }),
    );
  } catch (error) {
    console.error("Failed to build current session", error);
    res.status(500).json({
      error: "Failed to load current session",
      message: error instanceof Error ? error.message : String(error),
    });
  }
});

router.patch("/me/preferences", async (req, res): Promise<void> => {
  const parsed = UpdateUserPreferencesBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const user = await getOrCreateLocalUser(req);
  if (!user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  if (parsed.data.currentOrganizationId) {
    const membership = await getMembership(
      user.id,
      parsed.data.currentOrganizationId,
    );
    if (!membership) {
      res.status(403).json({ error: "Organization access denied" });
      return;
    }
  }
  await getOrCreatePreferences(user.id);
  const [updated] = await db
    .update(userPreferencesTable)
    .set({
      ...parsed.data,
      ...(req.body?.currentBranchId !== undefined ? { currentBranchId: req.body.currentBranchId } : {}),
      updatedAt: new Date()
    })
    .where(eq(userPreferencesTable.userId, user.id))
    .returning();
  if (!updated) {
    res.status(500).json({ error: "Unable to update preferences" });
    return;
  }
  res.json(UpdateUserPreferencesResponse.parse(toPreferences(updated)));
});

router.post("/organizations", async (req, res): Promise<void> => {
  const parsed = CreateOrganizationBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const user = await getOrCreateLocalUser(req);
  if (!user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const [organization] = await db
    .insert(organizationsTable)
    .values(parsed.data)
    .returning();
  if (!organization) {
    res.status(500).json({ error: "Unable to create organization" });
    return;
  }

  await db.insert(organizationMembershipsTable).values({
    organizationId: organization.id,
    userId: user.id,
    role: "owner",
  });
  await enableFinanceForOrganization(organization.id);
  await db.insert(auditLogsTable).values({
    organizationId: organization.id,
    userId: user.id,
    action: "created",
    entityType: "organization",
    entityId: organization.id,
    newValues: parsed.data,
  });

  res.status(201).json(
    CreateOrganizationResponse.parse(toOrganization(organization)),
  );
});

router.get(
  "/organizations/:organizationId",
  async (req, res): Promise<void> => {
    const params = GetOrganizationParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }
    const user = await getOrCreateLocalUser(req);
    if (!user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    const membership = await getMembership(
      user.id,
      params.data.organizationId,
    );
    if (!membership) {
      res.status(403).json({ error: "Organization access denied" });
      return;
    }
    const [organization] = await db
      .select()
      .from(organizationsTable)
      .where(eq(organizationsTable.id, params.data.organizationId))
      .limit(1);
    if (!organization) {
      res.status(404).json({ error: "Organization not found" });
      return;
    }
    res.json(GetOrganizationResponse.parse(toOrganization(organization)));
  },
);

router.patch(
  "/organizations/:organizationId",
  async (req, res): Promise<void> => {
    const params = UpdateOrganizationParams.safeParse(req.params);
    const parsed = UpdateOrganizationBody.safeParse(req.body);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }
    const user = await getOrCreateLocalUser(req);
    if (!user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    const membership = await getMembership(
      user.id,
      params.data.organizationId,
    );
    if (!membership || !["owner", "admin"].includes(membership.role)) {
      res.status(403).json({ error: "Organization access denied" });
      return;
    }
    const [organization] = await db
      .update(organizationsTable)
      .set({ ...parsed.data, updatedAt: new Date() })
      .where(eq(organizationsTable.id, params.data.organizationId))
      .returning();
    if (!organization) {
      res.status(404).json({ error: "Organization not found" });
      return;
    }
    await db.insert(auditLogsTable).values({
      organizationId: organization.id,
      userId: user.id,
      action: "updated",
      entityType: "organization",
      entityId: organization.id,
      newValues: parsed.data,
    });
    res.json(UpdateOrganizationResponse.parse(toOrganization(organization)));
  },
);

router.get(
  "/organizations/:organizationId/dashboard",
  requireModule("finance"),
  async (req, res): Promise<void> => {
    const params = GetDashboardSummaryParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }
    const user = await getOrCreateLocalUser(req);
    if (!user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    const membership = await getMembership(
      user.id,
      params.data.organizationId,
    );
    if (!membership) {
      res.status(403).json({ error: "Organization access denied" });
      return;
    }
    const [organization] = await db
      .select({ currency: organizationsTable.currency, onboardingCompleted: organizationsTable.onboardingCompleted })
      .from(organizationsTable)
      .where(eq(organizationsTable.id, params.data.organizationId))
      .limit(1);
    if (!organization) {
      res.status(404).json({ error: "Organization not found" });
      return;
    }
    res.json(
      GetDashboardSummaryResponse.parse({
        currency: organization.currency,
        revenue: "0.00",
        receivables: "0.00",
        expenses: "0.00",
        netProfit: "0.00",
        hasComparativeData: false,
        recentTransactions: [],
        customerCount: Number((await db.select({ count: sql<number>`count(*)` }).from(partyRolesTable).where(and(eq(partyRolesTable.organizationId, params.data.organizationId), eq(partyRolesTable.role, "customer"))))[0]?.count ?? 0),
        supplierCount: Number((await db.select({ count: sql<number>`count(*)` }).from(partyRolesTable).where(and(eq(partyRolesTable.organizationId, params.data.organizationId), eq(partyRolesTable.role, "supplier"))))[0]?.count ?? 0),
         itemCount: Number((await db.select({ count: sql<number>`count(*)` }).from(catalogItemsTable).where(eq(catalogItemsTable.organizationId, params.data.organizationId)))[0]?.count ?? 0),
         itemChecklist: {
           hasItems: Number((await db.select({ count: sql<number>`count(*)` }).from(catalogItemsTable).where(eq(catalogItemsTable.organizationId, params.data.organizationId)))[0]?.count ?? 0) > 0,
           complete: Number((await db.select({ count: sql<number>`count(*)` }).from(catalogItemsTable).where(eq(catalogItemsTable.organizationId, params.data.organizationId)))[0]?.count ?? 0) > 0,
         },
        customerChecklist: {
          hasCustomers: Number((await db.select({ count: sql<number>`count(*)` }).from(partyRolesTable).where(and(eq(partyRolesTable.organizationId, params.data.organizationId), eq(partyRolesTable.role, "customer"))))[0]?.count ?? 0) > 0,
          complete: Number((await db.select({ count: sql<number>`count(*)` }).from(partyRolesTable).where(and(eq(partyRolesTable.organizationId, params.data.organizationId), eq(partyRolesTable.role, "customer"))))[0]?.count ?? 0) > 0,
        },
      }),
    );
  },
);

router.get("/modules", (_req, res): void => {
  res.json(ListModulesResponse.parse(MODULE_REGISTRY));
});

router.get(
  "/organizations/:organizationId/modules",
  async (req, res): Promise<void> => {
    const params = ListOrganizationModulesParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }
    const user = await getOrCreateLocalUser(req);
    if (!user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    const membership = await getMembership(
      user.id,
      params.data.organizationId,
    );
    if (!membership) {
      res.status(403).json({ error: "Organization access denied" });
      return;
    }
    const entitlements = await db
      .select()
      .from(organizationModulesTable)
      .where(
        eq(
          organizationModulesTable.organizationId,
          params.data.organizationId,
        ),
      );
    const byKey = new Map(
      entitlements.map((entitlement) => [
        entitlement.moduleKey,
        entitlement,
      ]),
    );
    res.json(
      ListOrganizationModulesResponse.parse(
        MODULE_REGISTRY.map((module) => {
          const entitlement = byKey.get(module.key);
          return {
            module,
            enabled: entitlement?.enabled ?? false,
            activatedAt: entitlement?.activatedAt?.toISOString() ?? null,
          };
        }),
      ),
    );
  },
);

router.get(
  "/organizations/:organizationId/audit-logs",
  async (req, res): Promise<void> => {
    const params = ListAuditLogsParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }
    const user = await getOrCreateLocalUser(req);
    if (!user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    const membership = await getMembership(
      user.id,
      params.data.organizationId,
    );
    if (!membership) {
      res.status(403).json({ error: "Organization access denied" });
      return;
    }
    const logs = await db
      .select({
        id: auditLogsTable.id,
        action: auditLogsTable.action,
        entityType: auditLogsTable.entityType,
        entityId: auditLogsTable.entityId,
        actorName: usersTable.displayName,
        previousValues: auditLogsTable.previousValues,
        newValues: auditLogsTable.newValues,
        createdAt: auditLogsTable.createdAt,
      })
      .from(auditLogsTable)
      .leftJoin(usersTable, eq(auditLogsTable.userId, usersTable.id))
      .where(eq(auditLogsTable.organizationId, params.data.organizationId))
      .orderBy(desc(auditLogsTable.createdAt))
      .limit(50);
    res.json(
      ListAuditLogsResponse.parse(
        logs.map((log) => ({ ...log, createdAt: log.createdAt.toISOString() })),
      ),
    );
  },
);

router.get("/organizations/:organizationId/members", async (req, res): Promise<void> => {
  try {
    const { organizationId } = req.params;
    const members = await db
      .select({
        id: organizationMembershipsTable.id,
        organizationId: organizationMembershipsTable.organizationId,
        userId: organizationMembershipsTable.userId,
        role: organizationMembershipsTable.role,
        branchId: organizationMembershipsTable.branchId,
        status: organizationMembershipsTable.status,
        createdAt: organizationMembershipsTable.createdAt,
        displayName: usersTable.displayName,
        email: usersTable.email,
      })
      .from(organizationMembershipsTable)
      .innerJoin(usersTable, eq(usersTable.id, organizationMembershipsTable.userId))
      .where(eq(organizationMembershipsTable.organizationId, organizationId))
      .orderBy(desc(organizationMembershipsTable.createdAt));

    res.json(members.map(m => ({
      ...m,
      createdAt: m.createdAt.toISOString()
    })));
  } catch (error) {
    console.error("Failed to list members", error);
    res.status(500).json({ error: "Failed to list organization members" });
  }
});

router.post("/organizations/:organizationId/members", async (req, res): Promise<void> => {
  try {
    const { organizationId } = req.params;
    const { displayName, email, role, branchId, status } = req.body;

    if (!displayName || !email) {
      res.status(400).json({ error: "displayName and email are required" });
      return;
    }

    let [targetUser] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, email.toLowerCase().trim()))
      .limit(1);

    if (!targetUser) {
      const clerkPlaceholder = `invited_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
      [targetUser] = await db
        .insert(usersTable)
        .values({
          clerkUserId: clerkPlaceholder,
          email: email.toLowerCase().trim(),
          displayName: displayName.trim(),
        })
        .returning();
    }

    const [existingMembership] = await db
      .select()
      .from(organizationMembershipsTable)
      .where(
        and(
          eq(organizationMembershipsTable.organizationId, organizationId),
          eq(organizationMembershipsTable.userId, targetUser.id)
        )
      )
      .limit(1);

    if (existingMembership) {
      const [updated] = await db
        .update(organizationMembershipsTable)
        .set({
          role: role || existingMembership.role,
          branchId: branchId !== undefined ? branchId : existingMembership.branchId,
          status: status || existingMembership.status,
        })
        .where(eq(organizationMembershipsTable.id, existingMembership.id))
        .returning();

      res.json({
        ...updated,
        displayName: targetUser.displayName,
        email: targetUser.email,
        createdAt: updated.createdAt.toISOString()
      });
      return;
    }

    const [newMembership] = await db
      .insert(organizationMembershipsTable)
      .values({
        organizationId,
        userId: targetUser.id,
        role: role || "viewer",
        branchId: branchId || null,
        status: status || "ACTIVE",
      })
      .returning();

    res.status(201).json({
      ...newMembership,
      displayName: targetUser.displayName,
      email: targetUser.email,
      createdAt: newMembership.createdAt.toISOString()
    });
  } catch (error) {
    console.error("Failed to add member", error);
    res.status(500).json({ error: "Failed to add organization member" });
  }
});

router.patch("/organizations/:organizationId/members/:memberId", async (req, res): Promise<void> => {
  try {
    const { organizationId, memberId } = req.params;
    const { role, branchId, status, displayName } = req.body;

    const [existing] = await db
      .select()
      .from(organizationMembershipsTable)
      .where(
        and(
          eq(organizationMembershipsTable.id, memberId),
          eq(organizationMembershipsTable.organizationId, organizationId)
        )
      )
      .limit(1);

    if (!existing) {
      res.status(404).json({ error: "Membership not found" });
      return;
    }

    if (displayName) {
      await db
        .update(usersTable)
        .set({ displayName: displayName.trim() })
        .where(eq(usersTable.id, existing.userId));
    }

    const updates: Partial<typeof organizationMembershipsTable.$inferInsert> = {};
    if (role !== undefined) updates.role = role;
    if (branchId !== undefined) updates.branchId = branchId;
    if (status !== undefined) updates.status = status;

    const [updated] = await db
      .update(organizationMembershipsTable)
      .set(updates)
      .where(eq(organizationMembershipsTable.id, memberId))
      .returning();

    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, existing.userId)).limit(1);

    res.json({
      ...updated,
      displayName: user?.displayName || '',
      email: user?.email || '',
      createdAt: updated.createdAt.toISOString()
    });
  } catch (error) {
    console.error("Failed to update member", error);
    res.status(500).json({ error: "Failed to update member" });
  }
});

router.delete("/organizations/:organizationId/members/:memberId", async (req, res): Promise<void> => {
  try {
    const { organizationId, memberId } = req.params;

    const [deleted] = await db
      .delete(organizationMembershipsTable)
      .where(
        and(
          eq(organizationMembershipsTable.id, memberId),
          eq(organizationMembershipsTable.organizationId, organizationId)
        )
      )
      .returning();

    if (!deleted) {
      res.status(404).json({ error: "Membership not found" });
      return;
    }

    res.json({ success: true, id: memberId });
  } catch (error) {
    console.error("Failed to delete member", error);
    res.status(500).json({ error: "Failed to delete member" });
  }
});

export default router;