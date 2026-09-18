import type { RequestHandler } from "express";
import type { ModuleKey } from "@workspace/platform-core";
import { getMembership, getOrCreateLocalUser } from "./auth";
import { hasModuleEntitlement } from "../lib/moduleEntitlements";
import { hasCatalogPermission, type CatalogPermission } from "../lib/partyPermissions";

export function requireCatalogPermission(permission: CatalogPermission): RequestHandler {
  return async (req, res, next) => {
    try {
      const organizationId = String(req.params.organizationId || "");
      if (!organizationId) return res.status(400).json({ error: "Organization id is required" });
      const user = await getOrCreateLocalUser(req);
      if (!user) return res.status(401).json({ error: "Unauthorized" });
      const membership = await getMembership(user.id, organizationId);
      if (!membership) return res.status(403).json({ error: "Organization access denied" });
      if (!(await hasModuleEntitlement(organizationId, "finance" as ModuleKey))) {
        return res.status(403).json({ error: "Module is not enabled" });
      }
      if (!hasCatalogPermission(membership, permission)) return res.status(403).json({ error: "Permission denied" });
      res.locals.partyUser = user;
      res.locals.partyMembership = membership;
      return next();
    } catch (error) { next(error); }
  };
}