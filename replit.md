# Delivery Fixes

A self-serve Shopify companion that helps merchants resolve address and delivery issues before fulfilment.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
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

- `artifacts/delivery-fixes` — merchant-facing React app
- `artifacts/api-server/src/routes` — issue and settings APIs
- `lib/api-spec/openapi.yaml` — API contract
- `lib/db/src/schema` — PostgreSQL tables

## Architecture decisions

- Keep the first product narrowly focused on post-purchase delivery corrections.
- Use self-serve onboarding and marketplace distribution rather than outbound sales.
- Shopify connectivity is intentionally deferred until the core workflow is validated.

## Product

- Merchant dashboard with summary metrics and a filterable issue queue
- Resolve, reopen, and simulate delivery issues
- Configure automation and customer messaging

## User preferences

- Do not rely on direct sales as the customer acquisition strategy.

## Gotchas

_Populate as you build — sharp edges, "always run X before Y" rules._

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
