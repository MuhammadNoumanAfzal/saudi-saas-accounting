import { Router, type IRouter } from "express";
import { and, desc, eq, ilike, or, sql } from "drizzle-orm";
import { db, auditLogsTable, usersTable } from "@workspace/db";
import { requireAuthentication } from "../middlewares/auth";
import { requireModule } from "../middlewares/moduleEntitlement";

const router: IRouter = Router();
router.use(requireAuthentication);
router.use("/organizations/:organizationId", requireModule("finance"));

const getOrgId = (req: any) => String(req.params.organizationId);

router.get("/organizations/:organizationId/audit-logs", async (req, res) => {
  try {
    const organizationId = getOrgId(req);
    const search = req.query.search ? String(req.query.search).trim() : "";
    const entityType = req.query.entityType ? String(req.query.entityType).trim() : "";
    const action = req.query.action ? String(req.query.action).trim() : "";

    const page = Math.max(1, Number(req.query.page || 1));
    const pageSize = Math.min(100, Math.max(1, Number(req.query.pageSize || 25)));
    const offset = (page - 1) * pageSize;

    const conditions = [eq(auditLogsTable.organizationId, organizationId)];

    if (entityType) {
      conditions.push(eq(auditLogsTable.entityType, entityType));
    }

    if (action) {
      conditions.push(ilike(auditLogsTable.action, `%${action}%`));
    }

    if (search) {
      conditions.push(
        or(
          ilike(auditLogsTable.action, `%${search}%`),
          ilike(auditLogsTable.entityType, `%${search}%`),
          ilike(auditLogsTable.entityId, `%${search}%`)
        )!
      );
    }

    const whereClause = and(...conditions);

    const totalRes = await db
      .select({ count: sql<number>`count(*)` })
      .from(auditLogsTable)
      .where(whereClause);

    const total = Number(totalRes[0]?.count || 0);

    const rows = await db
      .select({
        id: auditLogsTable.id,
        organizationId: auditLogsTable.organizationId,
        userId: auditLogsTable.userId,
        action: auditLogsTable.action,
        entityType: auditLogsTable.entityType,
        entityId: auditLogsTable.entityId,
        previousValues: auditLogsTable.previousValues,
        newValues: auditLogsTable.newValues,
        ipAddress: auditLogsTable.ipAddress,
        userAgent: auditLogsTable.userAgent,
        createdAt: auditLogsTable.createdAt,
        actorName: usersTable.displayName,
      })
      .from(auditLogsTable)
      .leftJoin(usersTable, eq(auditLogsTable.userId, usersTable.id))
      .where(whereClause)
      .orderBy(desc(auditLogsTable.createdAt))
      .limit(pageSize)
      .offset(offset);

    const items = rows.map(r => ({
      id: r.id,
      organizationId: r.organizationId,
      userId: r.userId,
      action: r.action,
      entityType: r.entityType,
      entityId: r.entityId,
      actorName: r.actorName || "System / Admin",
      previousValues: r.previousValues || null,
      newValues: r.newValues || null,
      ipAddress: r.ipAddress,
      userAgent: r.userAgent,
      createdAt: r.createdAt.toISOString(),
    }));

    return res.json(items);
  } catch (err: any) {
    console.error("[Audit Logs API] Error listing audit logs:", err);
    return res.status(500).json({ error: "Failed to list audit logs", message: err.message });
  }
});

export default router;
