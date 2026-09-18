# Mizan — Saudi Accounting Foundation

A multi-tenant, Saudi-first accounting SaaS workspace with secure authentication, five-step organization onboarding, bilingual RTL/LTR navigation, persisted preferences, settings, audit logging, and an empty-safe dashboard.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm --filter @workspace/saudi-accounting run dev` — run the web app through its managed workflow
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/saudi-accounting` — React web application and visual system
- `artifacts/api-server` — Express API and authorization boundaries
- `lib/api-spec/openapi.yaml` — API source of truth
- `lib/db/src/schema/foundation.ts` — tenant foundation schema

## Architecture decisions

- Clerk owns authentication; browser API calls use its same-origin session cookie.
- Organization membership is checked on every tenant-scoped API route.
- Financial dashboard values remain zero until real accounting modules exist.
- ZATCA is isolated as future functionality and has no fake integration.

## Product

Public product introduction, secure sign-in/sign-up and password recovery through Clerk, five-step organization onboarding, organization switching, bilingual responsive workspace, command search, honest quick-create and notification foundations, dashboard, settings, and audit history.

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- Regenerate API clients after every OpenAPI change.
- Run `pnpm run typecheck:libs` after changing shared database exports.
- Do not authorize tenant access from organization IDs supplied by the client alone.
- Resolve the active organization from a membership plus `currentOrganizationId`; never query tenant data from the preference without checking membership.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
