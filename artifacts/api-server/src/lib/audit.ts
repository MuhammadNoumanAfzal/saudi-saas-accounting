import type { Request } from "express";
import { auditLogsTable, db } from "@workspace/db";

const isValidUuid = (id: string | null | undefined): boolean => {
  if (!id) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
};

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
  const validUserId = isValidUuid(input.userId) ? input.userId : null;

  await db.insert(auditLogsTable).values({
    organizationId: input.organizationId,
    userId: validUserId,
    action: input.action,
    entityType: input.entityType,
    entityId: input.entityId ?? null,
    previousValues: input.previousValues ?? null,
    newValues: input.newValues ?? null,
    ipAddress: input.req?.ip,
    userAgent: input.req?.get("user-agent") ?? null,
  });
}