import type { Request, Response } from "express";
import { and, eq } from "drizzle-orm";
import { db, organizationBranchesTable, userPreferencesTable } from "@workspace/db";

const ADMIN_ROLES = new Set(["owner", "admin"]);

export async function getActiveBranchId(req: Request, res: Response, organizationId: string): Promise<string | null> {
  const membership = res.locals.partyMembership as { role?: string; branchId?: string | null } | undefined;
  if (membership?.branchId && !ADMIN_ROLES.has(membership.role || "")) {
    return membership.branchId;
  }

  const explicit = String(req.query.branchId || req.headers["x-branch-id"] || req.body?.branchId || "").trim();
  if (ADMIN_ROLES.has(membership?.role || "") && explicit && explicit !== "all") {
    await assertBranchAccess(organizationId, explicit);
    return explicit;
  }

  const userId = res.locals.partyUser?.id as string | undefined;
  if (userId) {
    const [prefs] = await db.select().from(userPreferencesTable).where(eq(userPreferencesTable.userId, userId)).limit(1);
    if (prefs?.currentBranchId) {
      await assertBranchAccess(organizationId, prefs.currentBranchId);
      return prefs.currentBranchId;
    }
  }

  const [main] = await db
    .select({ id: organizationBranchesTable.id })
    .from(organizationBranchesTable)
    .where(and(eq(organizationBranchesTable.organizationId, organizationId), eq(organizationBranchesTable.isMain, true), eq(organizationBranchesTable.status, "ACTIVE")))
    .limit(1);
  if (main?.id) return main.id;

  const [first] = await db
    .select({ id: organizationBranchesTable.id })
    .from(organizationBranchesTable)
    .where(and(eq(organizationBranchesTable.organizationId, organizationId), eq(organizationBranchesTable.status, "ACTIVE")))
    .limit(1);
  return first?.id || null;
}

export async function assertBranchAccess(organizationId: string, branchId: string): Promise<void> {
  const [branch] = await db
    .select({ id: organizationBranchesTable.id })
    .from(organizationBranchesTable)
    .where(and(eq(organizationBranchesTable.organizationId, organizationId), eq(organizationBranchesTable.id, branchId), eq(organizationBranchesTable.status, "ACTIVE")))
    .limit(1);
  if (!branch) throw new Error("Selected branch is not active for this organization.");
}

export function branchMatches(rowBranchId: string | null | undefined, branchId: string | null): boolean {
  return !branchId || !rowBranchId || rowBranchId === branchId;
}