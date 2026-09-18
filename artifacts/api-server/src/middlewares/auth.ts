import { clerkClient, getAuth } from "@clerk/express";
import type { Request, RequestHandler } from "express";
import { and, eq } from "drizzle-orm";
import {
  db,
  organizationMembershipsTable,
  usersTable,
  type User,
} from "@workspace/db";

export function getAuthenticatedClerkUserId(req: Request): string | null {
  return getAuth(req).userId ?? null;
}

export const requireAuthentication: RequestHandler = (req, res, next) => {
  if (!getAuthenticatedClerkUserId(req)) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  next();
};

export async function getOrCreateLocalUser(
  req: Request,
): Promise<User | null> {
  const clerkUserId = getAuthenticatedClerkUserId(req);
  if (!clerkUserId) return null;

  const [existing] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.clerkUserId, clerkUserId))
    .limit(1);
  if (existing) return existing;

  const clerkUser = await clerkClient.users.getUser(clerkUserId);
  const email =
    clerkUser.primaryEmailAddress?.emailAddress ??
    clerkUser.emailAddresses[0]?.emailAddress;
  if (!email) {
    throw new Error("Authenticated Clerk user has no email address");
  }

  const displayName =
    clerkUser.fullName ??
    clerkUser.username ??
    email.split("@")[0] ??
    "Workspace user";
  const [created] = await db
    .insert(usersTable)
    .values({ clerkUserId, email, displayName })
    .onConflictDoUpdate({
      target: usersTable.clerkUserId,
      set: { email, displayName },
    })
    .returning();
  return created ?? null;
}

export async function getMembership(
  userId: string,
  organizationId: string,
) {
  const [membership] = await db
    .select()
    .from(organizationMembershipsTable)
    .where(
      and(
        eq(organizationMembershipsTable.userId, userId),
        eq(organizationMembershipsTable.organizationId, organizationId),
      ),
    )
    .limit(1);
  return membership;
}