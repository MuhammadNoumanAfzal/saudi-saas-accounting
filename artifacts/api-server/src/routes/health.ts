import { Router, type IRouter } from "express";
import { HealthCheckResponse } from "@workspace/api-zod";
import { pool } from "@workspace/db";

const router: IRouter = Router();

router.get("/healthz", (_req, res) => {
  const data = HealthCheckResponse.parse({ status: "ok" });
  res.json(data);
});

router.get("/healthz/db", async (_req, res) => {
  try {
    const result = await pool.query(`
      select
        current_database() as database_name,
        current_schema() as schema_name,
        to_regclass('public.users') is not null as has_users_table,
        to_regclass('public.organizations') is not null as has_organizations_table,
        exists (
          select 1
          from information_schema.columns
          where table_schema = 'public'
            and table_name = 'organizations'
            and column_name = 'onboarding_current_step'
        ) as has_onboarding_current_step
    `);

    res.json({ status: "ok", database: result.rows[0] });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: error instanceof Error ? error.message : String(error),
    });
  }
});

export default router;