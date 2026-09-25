# Production Hardening Notes

## Required environment variables
- `DATABASE_URL`
- `CLERK_SECRET_KEY`
- `CLERK_PUBLISHABLE_KEY`
- `FRONTEND_URL`
- `REQUEST_BODY_LIMIT` optional, defaults to `1mb`
- `RATE_LIMIT_WINDOW_MS` optional, defaults to `60000`
- `RATE_LIMIT_MAX` optional, defaults to `300`
- `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` recommended for Railway production distributed rate limits
- `ZATCA_ENV`, `ZATCA_CSR_BASE64`, `ZATCA_PRIVATE_KEY_PEM` required when real ZATCA production mode is enabled

## Permissions
- Backend enforces organization membership for every finance module route using `requireModule("finance")`.
- Viewer role is read-only for module routes.
- Mutating writes must stay behind role/membership middleware even when UI buttons are hidden.

## Rate limits
- API routes are rate limited per signed-in Clerk user where available, otherwise per IP.
- If `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` are set, rate limits are shared across Railway instances.
- If Redis is not configured or temporarily fails, the API falls back to in-memory limits so requests are still protected in development/single-instance mode.

## Logging and monitoring
- API errors are logged with Pino.
- Production responses do not expose raw exception messages.
- Railway production should connect one log drain/provider:
  - Axiom: create dataset, add Railway log drain or token-based collector.
  - Datadog: enable Railway Datadog log drain/agent and set the Datadog API key in Railway.
  - Sentry: set `SENTRY_DSN`; install and initialize `@sentry/node` if stack-trace issue tracking is required beyond logs.

## Database backup and restore
- Enable Supabase automatic backups before real customer use.
- Supabase Dashboard path: Project Settings -> Database -> Backups.
- Test restore on a staging Supabase project before restoring production.
- Keep a recurring manual restore test checklist: backup available, restore to staging, run app smoke tests, verify latest invoices/reports.
- Never run destructive cleanup scripts against production unless an explicit `ALLOW_PRODUCTION_DB_RESET=true` style guard is added and reviewed.
- Keep migrations/schema files in version control; do not edit historical migrations to fix live data.

## Migration and seed safety
- Production deployments should run reviewed migrations only.
- Seed/demo scripts must not run automatically in production.
- Any one-off data repair should be committed as a named migration or a reviewed operational script.