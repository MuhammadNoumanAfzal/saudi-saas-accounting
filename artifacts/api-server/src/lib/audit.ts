import type { Request } from "express";
import { auditLogsTable, db } from "@workspace/db";

export async function writeAuditLog(input: {
  organizationId: string;
  userId?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  previousValues?: unknown;
  newValues?: unknown;
  req?: Request;
}) {
  await db.insert(auditLogsTable).values({
    organizationId: input.organizationId,
    userId: input.userId ?? null,
    action: input.action,
    entityType: input.entityType,
    entityId: input.entityId ?? null,
    previousValues: input.previousValues ?? null,
    newValues: input.newValues ?? null,
    ipAddress: input.req?.ip,
    userAgent: input.req?.get("user-agent") ?? null,
  });
}