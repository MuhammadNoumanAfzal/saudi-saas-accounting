# KHANBAS NEXUS — Connected Business Platform

KHANBAS NEXUS is a modular, interconnected Saudi business platform. Nexus Core
provides shared organizations, users, roles, settings, audit logs, search, and
module entitlements. Nexus Finance is the first available business module.
Fleet, Projects, Assets, Intelligence, and Automate are registry entries only
and contain no fabricated product functionality.

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
- `lib/platform-core` — shared module and integration registries

The application is a modular monolith. Shared business concepts belong to Nexus
Core, while module APIs remain behind centralized organization entitlements and
existing RBAC checks.

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

The current schema contains users, organizations, organization memberships,
user preferences, audit logs, module definitions, and organization module
entitlements. Existing and newly created organizations receive Nexus Finance
as an enabled entitlement. No accounting transaction tables exist yet.

## Validation

Run the complete TypeScript validation:

```bash
pnpm run typecheck
```

## Security foundation

- Clerk-managed password and session security
- Server-side authentication middleware
- Server-side organization membership checks
- Server-side module entitlement guards
- Role checks for organization settings mutations
- Zod request and response validation generated from OpenAPI
- Parameterized Drizzle queries
- Redacted structured request logging
- Environment-based secrets
- Auditable organization create/update actions
- Automated cross-tenant, module denial, and RBAC tests

## Current limitations

- Nexus Finance customers, suppliers, accounting, inventory, VAT, and financial
  reporting features are not built.
- Fleet, Projects, Assets, Intelligence, and Automate are Coming Soon and cannot
  be activated.
- Feature entitlements and subscriptions are architecturally anticipated but
  commercial plans and billing are not implemented.
- ZATCA is represented only as a future settings destination; no API,
  signing, clearance, or credential handling is implemented.
- Users and branches screens establish the product surface but their CRUD APIs
  are deferred.
- Google OAuth availability is controlled by Clerk configuration; the
  application does not provide a fake OAuth implementation.
- Team invitation delivery remains unavailable until a secure email-delivery
  workflow is configured.
- Docker packaging is not included because this Replit runtime does not support
  Docker-based development. The application remains portable through standard
  Node.js, PostgreSQL, and environment-variable interfaces.