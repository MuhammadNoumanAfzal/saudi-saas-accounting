import type { RequestHandler } from "express";
import type { ModuleKey } from "@workspace/platform-core";
import { getMembership, getOrCreateLocalUser } from "./auth";
import { hasModuleEntitlement } from "../lib/moduleEntitlements";
import { hasPartyPermission, type PartyPermission } from "../lib/partyPermissions";

export function requireFinancePartyPermission(permission: PartyPermission): RequestHandler {
  return async (req, res, next) => {
    try {
      const raw = req.params.organizationId;
      const organizationId = Array.isArray(raw) ? raw[0] : raw;
      if (!organizationId) {
        res.status(400).json({ error: "Organization id is required" });
        return;
      }
      const user = await getOrCreateLocalUser(req);
      if (!user) {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }
      const membership = await getMembership(user.id, organizationId);
      if (!membership) {
        res.status(403).json({ error: "Organization access denied" });
        return;
      }
      if (!(await hasModuleEntitlement(organizationId, "finance" as ModuleKey))) {
        res.status(403).json({ error: "Module is not enabled" });
        return;
      }
      const requested = (req.params.role === "suppliers" || req.params.role === "supplier")
        ? permission.replace(/^customers\./, "suppliers.")
        : permission;
      if (!hasPartyPermission(membership, requested as PartyPermission)) {
        res.status(403).json({ error: "Permission denied" });
        return;
      }
      res.locals.partyUser = user;
      res.locals.partyMembership = membership;
      next();
    } catch (error) {
      next(error);
    }
  };
}

export function requireAnyFinancePartyPermission(permissions: PartyPermission[]): RequestHandler {
  return async (req, res, next) => {
    try {
      const raw = req.params.organizationId;
      const organizationId = Array.isArray(raw) ? raw[0] : raw;
      if (!organizationId) {
        res.status(400).json({ error: "Organization id is required" });
        return;
      }
      const user = await getOrCreateLocalUser(req);
      if (!user) {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }
      const membership = await getMembership(user.id, organizationId);
      if (!membership) {
        res.status(403).json({ error: "Organization access denied" });
        return;
      }
      if (!(await hasModuleEntitlement(organizationId, "finance" as ModuleKey))) {
        res.status(403).json({ error: "Module is not enabled" });
        return;
      }
      if (!permissions.some((permission) => hasPartyPermission(membership, permission))) {
        res.status(403).json({ error: "Permission denied" });
        return;
      }
      res.locals.partyUser = user;
      res.locals.partyMembership = membership;
      next();
    } catch (error) {
      next(error);
    }
  };
}