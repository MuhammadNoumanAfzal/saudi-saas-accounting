import { Router, type IRouter } from "express";
import { and, desc, eq, inArray } from "drizzle-orm";
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
  OrganizationMembership,
  UpdateOrganizationBody,
  UpdateOrganizationParams,
  UpdateOrganizationResponse,
} from "@workspace/api-zod";
import {
  auditLogsTable,
  db,
  organizationMembershipsTable,
  organizationsTable,
  usersTable,
} from "@workspace/db";
import {
  getMembership,
  getOrCreateLocalUser,
  requireAuthentication,
} from "../middlewares/auth";

const router: IRouter = Router();
router.use(requireAuthentication);

function toOrganization(value: typeof organizationsTable.$inferSelect) {
  return {
    ...value,
    createdAt: value.createdAt.toISOString(),
  };
}

router.get("/me", async (req, res): Promise<void> => {
  const user = await getOrCreateLocalUser(req);
  if (!user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
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
    }),
  );
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
      .select({ currency: organizationsTable.currency })
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
      }),
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
        createdAt: auditLogsTable.createdAt,
      })
      .from(auditLogsTable)
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

export default router;