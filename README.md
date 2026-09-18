# Mizan — Saudi Accounting Foundation

Mizan is the Phase 1 foundation for a multi-tenant accounting and e-invoicing
platform for Saudi SMEs. This phase establishes authentication, organization
isolation, onboarding, settings, localization-ready UI, audit logging, and an
empty-state financial dashboard. Accounting transactions and ZATCA operations
are intentionally deferred.

## Stack

- React, Vite, TypeScript, Tailwind CSS
- Express 5 and TypeScript
- PostgreSQL with Drizzle ORM
- OpenAPI-first generated React Query and Zod clients
- Clerk authentication
- pnpm workspaces

## Architecture

- `artifacts/saudi-accounting` — public site and authenticated web application
- `artifacts/api-server` — shared Express API mounted at `/api`
- `lib/api-spec` — source-of-truth OpenAPI contract
- `lib/api-client-react` — generated browser client and React Query hooks
- `lib/api-zod` — generated server validation schemas
- `lib/db` — PostgreSQL schema and database client

The API contract must be updated before handlers or callers. After changing
`lib/api-spec/openapi.yaml`, regenerate clients:

```bash
pnpm --filter @workspace/api-spec run codegen
```

## Multi-tenancy rules

Every organization-owned record must contain an `organizationId`. API handlers
must derive the authenticated user from Clerk, verify an organization
membership server-side, and only then query or mutate organization data.
Frontend filtering is never an authorization boundary.

Roles are centralized as `owner`, `admin`, `accountant`, `sales`, `purchasing`,
and `viewer`. Organization updates currently require an owner or admin role.

## Local development

Managed Replit workflows run the services:

```bash
pnpm --filter @workspace/api-server run dev
pnpm --filter @workspace/saudi-accounting run dev
```

Required environment values are provisioned through project secrets:

- `DATABASE_URL`
- `CLERK_SECRET_KEY`
- `CLERK_PUBLISHABLE_KEY`
- `VITE_CLERK_PUBLISHABLE_KEY`

Never commit these values.

## Database

Apply development schema changes with:

```bash
pnpm --filter @workspace/db run push
```

The current schema contains users, organizations, organization memberships, and
audit logs. No accounting transaction tables exist in Phase 1.

## Validation

Run the complete TypeScript validation:

```bash
pnpm run typecheck
```

## Security foundation

- Clerk-managed password and session security
- Server-side authentication middleware
- Server-side organization membership checks
- Role checks for organization settings mutations
- Zod request and response validation generated from OpenAPI
- Parameterized Drizzle queries
- Redacted structured request logging
- Environment-based secrets
- Auditable organization create/update actions

## Current limitations

- Accounting, inventory, VAT, and financial reporting modules are not built.
- ZATCA is represented only as a future settings destination; no API,
  signing, clearance, or credential handling is implemented.
- Users and branches screens establish the product surface but their CRUD APIs
  are deferred.
- Full Arabic translation and runtime RTL switching remain a dedicated follow-up
  phase; the current shell includes bilingual terminology and Arabic-ready
  typography.
- Docker packaging is not included because this Replit runtime does not support
  Docker-based development. The application remains portable through standard
  Node.js, PostgreSQL, and environment-variable interfaces.