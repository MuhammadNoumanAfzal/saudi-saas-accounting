import type { RequestHandler } from "express";
import type { ModuleKey } from "@workspace/platform-core";
import { getMembership, getOrCreateLocalUser } from "./auth";
import { hasModuleEntitlement } from "../lib/moduleEntitlements";

const readMethods = new Set(["GET", "HEAD", "OPTIONS"]);

export function requireModule(moduleKey: ModuleKey): RequestHandler {
  return async (req, res, next) => {
    try {
      const rawOrganizationId = req.params["organizationId"];
      const organizationId = Array.isArray(rawOrganizationId)
        ? rawOrganizationId[0]
        : rawOrganizationId;
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
      if (!(await hasModuleEntitlement(organizationId, moduleKey))) {
        res.status(403).json({ error: "Module is not enabled" });
        return;
      }
      if (!readMethods.has(req.method) && membership.role === "viewer") {
        res.status(403).json({ error: "Permission denied" });
        return;
      }
      res.locals.partyUser = user;
      res.locals.partyMembership = membership;
      res.locals.organizationRole = membership.role;
      next();
    } catch (error) {
      next(error);
    }
  };
}