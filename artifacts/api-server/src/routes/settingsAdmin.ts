import { Router, type IRouter } from "express";
import { and, desc, eq, ne, sql } from "drizzle-orm";
import {
  auditLogsTable,
  db,
  organizationBranchesTable,
  organizationInvitationsTable,
  organizationMembershipsTable,
  usersTable,
} from "@workspace/db";
import { getMembership, getOrCreateLocalUser, requireAuthentication } from "../middlewares/auth";

const router: IRouter = Router();
router.use(requireAuthentication);

type Role = "owner" | "admin" | "accountant" | "sales" | "purchasing" | "viewer";
const roles: Role[] = ["owner", "admin", "accountant", "sales", "purchasing", "viewer"];
const writeRoles = new Set<Role>(["owner", "admin"]);
const branchWriteRoles = new Set<Role>(["owner", "admin", "accountant"]);

const permissionMatrix: Record<Role, string[]> = {
  owner: ["dashboard.read", "customers.read", "customers.write", "customers.delete", "suppliers.read", "suppliers.write", "suppliers.delete", "catalog.read", "catalog.write", "catalog.delete", "quotations.read", "quotations.write", "quotations.delete", "quotations.convert", "invoices.read", "invoices.write", "invoices.post", "invoices.cancel", "invoices.delete", "bills.read", "bills.write", "bills.post", "bills.delete", "expenses.read", "expenses.write", "expenses.delete", "accounting.read", "accounting.write", "accounting.post", "reports.read", "reports.export", "branches.read", "branches.write", "branches.delete", "users.read", "users.invite", "users.update", "users.remove", "settings.read", "settings.write"],
  admin: ["dashboard.read", "customers.read", "customers.write", "customers.delete", "suppliers.read", "suppliers.write", "suppliers.delete", "catalog.read", "catalog.write", "catalog.delete", "quotations.read", "quotations.write", "quotations.delete", "quotations.convert", "invoices.read", "invoices.write", "invoices.post", "invoices.cancel", "bills.read", "bills.write", "bills.post", "expenses.read", "expenses.write", "expenses.delete", "accounting.read", "accounting.write", "accounting.post", "reports.read", "reports.export", "branches.read", "branches.write", "branches.delete", "users.read", "users.invite", "users.update", "users.remove", "settings.read", "settings.write"],
  accountant: ["dashboard.read", "customers.read", "customers.write", "suppliers.read", "suppliers.write", "catalog.read", "catalog.write", "quotations.read", "invoices.read", "invoices.write", "invoices.post", "bills.read", "bills.write", "bills.post", "expenses.read", "expenses.write", "accounting.read", "accounting.write", "accounting.post", "reports.read", "reports.export", "branches.read", "branches.write", "settings.read"],
  sales: ["dashboard.read", "customers.read", "customers.write", "catalog.read", "quotations.read", "quotations.write", "quotations.convert", "invoices.read", "invoices.write", "reports.read", "branches.read"],
  purchasing: ["dashboard.read", "suppliers.read", "suppliers.write", "catalog.read", "bills.read", "bills.write", "expenses.read", "expenses.write", "reports.read", "branches.read"],
  viewer: ["dashboard.read", "customers.read", "suppliers.read", "catalog.read", "quotations.read", "invoices.read", "bills.read", "expenses.read", "accounting.read", "reports.read", "branches.read", "settings.read"],
};

async function getActor(req: any, organizationId: string) {
  const user = await getOrCreateLocalUser(req);
  if (!user) return { error: [401, "Unauthorized"] as const };
  const membership = await getMembership(user.id, organizationId);
  if (!membership || membership.status !== "ACTIVE") return { error: [403, "Organization access denied"] as const };
  return { user, membership };
}

async function audit(organizationId: string, userId: string, action: string, entityType: string, entityId: string | null, previousValues: unknown, newValues: unknown) {
  await db.insert(auditLogsTable).values({ organizationId, userId, action, entityType, entityId, previousValues, newValues });
}

function serializeBranch(branch: typeof organizationBranchesTable.$inferSelect) {
  return { ...branch, createdAt: branch.createdAt.toISOString(), updatedAt: branch.updatedAt.toISOString() };
}

function branchPayload(body: any) {
  return {
    code: String(body.code || "").trim().toUpperCase(),
    nameEnglish: String(body.nameEnglish || body.nameEn || "").trim(),
    nameArabic: body.nameArabic || body.nameAr || null,
    vatNumber: body.vatNumber || null,
    commercialRegistrationNumber: body.commercialRegistrationNumber || body.crNumber || null,
    buildingNumber: body.buildingNumber || null,
    street: body.street || null,
    district: body.district || null,
    city: body.city || null,
    province: body.province || body.region || null,
    postalCode: body.postalCode || null,
    additionalNumber: body.additionalNumber || null,
    country: body.country || "Saudi Arabia",
    phone: body.phone || null,
    email: body.email || null,
    status: body.status === "INACTIVE" ? "INACTIVE" : "ACTIVE",
    isMain: Boolean(body.isMain),
  };
}

router.get("/organizations/:organizationId/permissions", async (req, res) => {
  const actor = await getActor(req, req.params.organizationId);
  if ("error" in actor) return res.status(actor.error[0]).json({ error: actor.error[1] });
  const role = actor.membership.role as Role;
  res.json({ role, permissions: permissionMatrix[role] || [], branchId: actor.membership.branchId, status: actor.membership.status });
});

router.get("/organizations/:organizationId/branches", async (req, res) => {
  const actor = await getActor(req, req.params.organizationId);
  if ("error" in actor) return res.status(actor.error[0]).json({ error: actor.error[1] });
  const role = actor.membership.role as Role;
  const branchScope = actor.membership.branchId;
  const whereClause = branchScope && !["owner", "admin"].includes(role)
    ? and(eq(organizationBranchesTable.organizationId, req.params.organizationId), eq(organizationBranchesTable.id, branchScope), eq(organizationBranchesTable.status, "ACTIVE"))
    : eq(organizationBranchesTable.organizationId, req.params.organizationId);
  const rows = await db.select().from(organizationBranchesTable).where(whereClause).orderBy(desc(organizationBranchesTable.isMain), organizationBranchesTable.code);
  res.json(rows.map(serializeBranch));
});

router.post("/organizations/:organizationId/branches", async (req, res) => {
  const actor = await getActor(req, req.params.organizationId);
  if ("error" in actor) return res.status(actor.error[0]).json({ error: actor.error[1] });
  if (!branchWriteRoles.has(actor.membership.role as Role)) return res.status(403).json({ error: "Permission denied" });
  const data = branchPayload(req.body);
  if (!data.code || !data.nameEnglish) return res.status(400).json({ error: "Branch code and English name are required" });
  if (data.isMain) await db.update(organizationBranchesTable).set({ isMain: false, updatedAt: new Date() }).where(eq(organizationBranchesTable.organizationId, req.params.organizationId));
  const [created] = await db.insert(organizationBranchesTable).values({ ...data, organizationId: req.params.organizationId }).returning();
  await audit(req.params.organizationId, actor.user.id, "branch.created", "organization_branch", created.id, null, created);
  res.status(201).json(serializeBranch(created));
});

router.get("/organizations/:organizationId/branches/:branchId", async (req, res) => {
  const actor = await getActor(req, req.params.organizationId);
  if ("error" in actor) return res.status(actor.error[0]).json({ error: actor.error[1] });
  const [branch] = await db.select().from(organizationBranchesTable).where(and(eq(organizationBranchesTable.organizationId, req.params.organizationId), eq(organizationBranchesTable.id, req.params.branchId))).limit(1);
  if (!branch) return res.status(404).json({ error: "Branch not found" });
  res.json(serializeBranch(branch));
});

router.patch("/organizations/:organizationId/branches/:branchId", async (req, res) => {
  const actor = await getActor(req, req.params.organizationId);
  if ("error" in actor) return res.status(actor.error[0]).json({ error: actor.error[1] });
  if (!branchWriteRoles.has(actor.membership.role as Role)) return res.status(403).json({ error: "Permission denied" });
  const [existing] = await db.select().from(organizationBranchesTable).where(and(eq(organizationBranchesTable.organizationId, req.params.organizationId), eq(organizationBranchesTable.id, req.params.branchId))).limit(1);
  if (!existing) return res.status(404).json({ error: "Branch not found" });
  const data = branchPayload({ ...existing, ...req.body });
  if (!data.code || !data.nameEnglish) return res.status(400).json({ error: "Branch code and English name are required" });
  if (data.isMain) await db.update(organizationBranchesTable).set({ isMain: false, updatedAt: new Date() }).where(and(eq(organizationBranchesTable.organizationId, req.params.organizationId), ne(organizationBranchesTable.id, req.params.branchId)));
  const [updated] = await db.update(organizationBranchesTable).set({ ...data, updatedAt: new Date() }).where(eq(organizationBranchesTable.id, req.params.branchId)).returning();
  await audit(req.params.organizationId, actor.user.id, "branch.updated", "organization_branch", updated.id, existing, updated);
  res.json(serializeBranch(updated));
});

router.delete("/organizations/:organizationId/branches/:branchId", async (req, res) => {
  const actor = await getActor(req, req.params.organizationId);
  if ("error" in actor) return res.status(actor.error[0]).json({ error: actor.error[1] });
  if (!writeRoles.has(actor.membership.role as Role)) return res.status(403).json({ error: "Permission denied" });
  const [existing] = await db.select().from(organizationBranchesTable).where(and(eq(organizationBranchesTable.organizationId, req.params.organizationId), eq(organizationBranchesTable.id, req.params.branchId))).limit(1);
  if (!existing) return res.status(404).json({ error: "Branch not found" });
  if (existing.isMain) return res.status(409).json({ error: "Main branch cannot be deleted. Deactivate it or assign another main branch first." });
  const [{ count }] = await db.select({ count: sql<number>`count(*)` }).from(organizationMembershipsTable).where(and(eq(organizationMembershipsTable.organizationId, req.params.organizationId), eq(organizationMembershipsTable.branchId, req.params.branchId)));
  if (Number(count) > 0) return res.status(409).json({ error: "Branch has assigned users. Reassign users before deleting." });
  await db.delete(organizationBranchesTable).where(eq(organizationBranchesTable.id, req.params.branchId));
  await audit(req.params.organizationId, actor.user.id, "branch.deleted", "organization_branch", existing.id, existing, null);
  res.json({ success: true, id: existing.id });
});

function serializeMember(row: any) {
  return { ...row, createdAt: row.createdAt.toISOString(), type: "member" };
}
function serializeInvite(row: any) {
  return { id: row.id, organizationId: row.organizationId, userId: null, role: row.role, branchId: row.branchId, status: row.status, createdAt: row.createdAt.toISOString(), displayName: row.displayName || row.email.split("@")[0], email: row.email, type: "invitation" };
}

router.get("/organizations/:organizationId/members", async (req, res) => {
  const actor = await getActor(req, req.params.organizationId);
  if ("error" in actor) return res.status(actor.error[0]).json({ error: actor.error[1] });
  if (!permissionMatrix[actor.membership.role as Role]?.includes("users.read")) return res.status(403).json({ error: "Permission denied" });
  const members = await db.select({ id: organizationMembershipsTable.id, organizationId: organizationMembershipsTable.organizationId, userId: organizationMembershipsTable.userId, role: organizationMembershipsTable.role, branchId: organizationMembershipsTable.branchId, status: organizationMembershipsTable.status, createdAt: organizationMembershipsTable.createdAt, displayName: usersTable.displayName, email: usersTable.email }).from(organizationMembershipsTable).innerJoin(usersTable, eq(usersTable.id, organizationMembershipsTable.userId)).where(eq(organizationMembershipsTable.organizationId, req.params.organizationId)).orderBy(desc(organizationMembershipsTable.createdAt));
  const invites = await db.select().from(organizationInvitationsTable).where(and(eq(organizationInvitationsTable.organizationId, req.params.organizationId), eq(organizationInvitationsTable.status, "PENDING"))).orderBy(desc(organizationInvitationsTable.createdAt));
  res.json([...members.map(serializeMember), ...invites.map(serializeInvite)]);
});

router.post("/organizations/:organizationId/members", async (req, res) => {
  const actor = await getActor(req, req.params.organizationId);
  if ("error" in actor) return res.status(actor.error[0]).json({ error: actor.error[1] });
  if (!permissionMatrix[actor.membership.role as Role]?.includes("users.invite")) return res.status(403).json({ error: "Permission denied" });
  const email = String(req.body.email || "").trim().toLowerCase();
  const displayName = String(req.body.displayName || "").trim();
  const role = roles.includes(req.body.role) ? req.body.role as Role : "viewer";
  const branchId = req.body.branchId || null;
  if (!email || !/^\S+@\S+\.\S+$/.test(email)) return res.status(400).json({ error: "Valid email is required" });
  if (branchId) {
    const [branch] = await db.select({ id: organizationBranchesTable.id }).from(organizationBranchesTable).where(and(eq(organizationBranchesTable.organizationId, req.params.organizationId), eq(organizationBranchesTable.id, branchId))).limit(1);
    if (!branch) return res.status(400).json({ error: "Selected branch does not belong to this organization" });
  }
  const [targetUser] = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
  if (targetUser) {
    const [existingMember] = await db
      .select()
      .from(organizationMembershipsTable)
      .where(and(eq(organizationMembershipsTable.organizationId, req.params.organizationId), eq(organizationMembershipsTable.userId, targetUser.id)))
      .limit(1);
    if (existingMember) return res.status(409).json({ error: "User is already a member of this organization" });
  }
  const [invite] = await db.insert(organizationInvitationsTable).values({ organizationId: req.params.organizationId, email, displayName: displayName || null, role, branchId, status: "PENDING", invitedByUserId: actor.user.id }).onConflictDoUpdate({ target: [organizationInvitationsTable.organizationId, organizationInvitationsTable.email], set: { displayName: displayName || null, role, branchId, status: "PENDING", invitedByUserId: actor.user.id, updatedAt: new Date() } }).returning();
  await audit(req.params.organizationId, actor.user.id, "invitation.created", "organization_invitation", invite.id, null, invite);
  res.status(202).json({ ...serializeInvite(invite), message: "Invitation saved. The organization owner must approve it after the invited email signs up." });
});

router.patch("/organizations/:organizationId/members/:memberId", async (req, res) => {
  const actor = await getActor(req, req.params.organizationId);
  if ("error" in actor) return res.status(actor.error[0]).json({ error: actor.error[1] });
  if (!permissionMatrix[actor.membership.role as Role]?.includes("users.update")) return res.status(403).json({ error: "Permission denied" });
  const role = req.body.role && roles.includes(req.body.role) ? req.body.role as Role : undefined;
  const branchId = req.body.branchId === undefined ? undefined : req.body.branchId || null;
  const status = req.body.status === "INACTIVE" ? "INACTIVE" : req.body.status === "ACTIVE" ? "ACTIVE" : undefined;
  const [existing] = await db.select().from(organizationMembershipsTable).where(and(eq(organizationMembershipsTable.id, req.params.memberId), eq(organizationMembershipsTable.organizationId, req.params.organizationId))).limit(1);
  if (existing) {
    if (existing.role === "owner" && role && role !== "owner") {
      const [{ count }] = await db.select({ count: sql<number>`count(*)` }).from(organizationMembershipsTable).where(and(eq(organizationMembershipsTable.organizationId, req.params.organizationId), eq(organizationMembershipsTable.role, "owner")));
      if (Number(count) <= 1) return res.status(409).json({ error: "Cannot change the last owner role" });
    }
    const updates: any = {};
    if (role) updates.role = role;
    if (branchId !== undefined) updates.branchId = branchId;
    if (status) updates.status = status;
    const [updated] = await db.update(organizationMembershipsTable).set(updates).where(eq(organizationMembershipsTable.id, existing.id)).returning();
    if (req.body.displayName) await db.update(usersTable).set({ displayName: String(req.body.displayName).trim() }).where(eq(usersTable.id, existing.userId));
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, existing.userId)).limit(1);
    await audit(req.params.organizationId, actor.user.id, "member.updated", "organization_membership", updated.id, existing, updated);
    return res.json(serializeMember({ ...updated, displayName: user?.displayName || "", email: user?.email || "" }));
  }
  const [invite] = await db.select().from(organizationInvitationsTable).where(and(eq(organizationInvitationsTable.id, req.params.memberId), eq(organizationInvitationsTable.organizationId, req.params.organizationId))).limit(1);
  if (!invite) return res.status(404).json({ error: "Member or invitation not found" });
  if (req.body.status === "ACTIVE") {
    if (actor.membership.role !== "owner") return res.status(403).json({ error: "Only the organization owner can approve invitations" });
    const [targetUser] = await db.select().from(usersTable).where(eq(usersTable.email, invite.email)).limit(1);
    if (!targetUser) return res.status(409).json({ error: "The invited user must sign up with this email before approval" });
    const approvalRole = role || invite.role;
    const approvalBranchId = branchId === undefined ? invite.branchId : branchId;
    const [member] = await db
      .insert(organizationMembershipsTable)
      .values({ organizationId: req.params.organizationId, userId: targetUser.id, role: approvalRole, branchId: approvalBranchId, status: "ACTIVE" })
      .onConflictDoUpdate({ target: [organizationMembershipsTable.organizationId, organizationMembershipsTable.userId], set: { role: approvalRole, branchId: approvalBranchId, status: "ACTIVE" } })
      .returning();
    const [acceptedInvite] = await db.update(organizationInvitationsTable).set({ status: "ACCEPTED", updatedAt: new Date() }).where(eq(organizationInvitationsTable.id, invite.id)).returning();
    await audit(req.params.organizationId, actor.user.id, "invitation.approved", "organization_invitation", invite.id, invite, acceptedInvite);
    return res.json(serializeMember({ ...member, displayName: targetUser.displayName, email: targetUser.email }));
  }
  const [updatedInvite] = await db.update(organizationInvitationsTable).set({ role: role || invite.role, branchId: branchId === undefined ? invite.branchId : branchId, displayName: req.body.displayName ?? invite.displayName, status: req.body.status === "REVOKED" ? "REVOKED" : invite.status, updatedAt: new Date() }).where(eq(organizationInvitationsTable.id, invite.id)).returning();
  await audit(req.params.organizationId, actor.user.id, "invitation.updated", "organization_invitation", invite.id, invite, updatedInvite);
  res.json(serializeInvite(updatedInvite));
});

router.delete("/organizations/:organizationId/members/:memberId", async (req, res) => {
  const actor = await getActor(req, req.params.organizationId);
  if ("error" in actor) return res.status(actor.error[0]).json({ error: actor.error[1] });
  if (!permissionMatrix[actor.membership.role as Role]?.includes("users.remove")) return res.status(403).json({ error: "Permission denied" });
  const [existing] = await db.select().from(organizationMembershipsTable).where(and(eq(organizationMembershipsTable.id, req.params.memberId), eq(organizationMembershipsTable.organizationId, req.params.organizationId))).limit(1);
  if (existing) {
    if (existing.role === "owner") {
      const [{ count }] = await db.select({ count: sql<number>`count(*)` }).from(organizationMembershipsTable).where(and(eq(organizationMembershipsTable.organizationId, req.params.organizationId), eq(organizationMembershipsTable.role, "owner")));
      if (Number(count) <= 1) return res.status(409).json({ error: "Cannot remove the last owner" });
    }
    await db.delete(organizationMembershipsTable).where(eq(organizationMembershipsTable.id, existing.id));
    await audit(req.params.organizationId, actor.user.id, "member.removed", "organization_membership", existing.id, existing, null);
    return res.json({ success: true, id: existing.id });
  }
  const [invite] = await db.update(organizationInvitationsTable).set({ status: "REVOKED", updatedAt: new Date() }).where(and(eq(organizationInvitationsTable.id, req.params.memberId), eq(organizationInvitationsTable.organizationId, req.params.organizationId))).returning();
  if (!invite) return res.status(404).json({ error: "Member or invitation not found" });
  await audit(req.params.organizationId, actor.user.id, "invitation.revoked", "organization_invitation", invite.id, invite, null);
  res.json({ success: true, id: invite.id });
});

export default router;