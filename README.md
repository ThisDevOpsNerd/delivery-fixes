# Delivery Fixes

Delivery Fixes is a working MVP for Shopify merchants who need to resolve address and delivery problems before fulfilment. It provides a focused, self-serve operations queue rather than a general customer-support suite.

The intended distribution model is the Shopify App Store. Direct sales and outbound-led onboarding are not part of the product strategy.

## What works today

- Dashboard summary metrics for open and resolved delivery issues
- Filterable delivery-issue queue
- Create/simulate a delivery issue
- Move issues between needs-attention, in-progress, and resolved states
- Reopen resolved issues
- Automation and customer-message settings
- PostgreSQL persistence behind an OpenAPI-described Express API

## Repository structure

- `artifacts/delivery-fixes` — React and Vite merchant interface
- `artifacts/api-server` — Express API
- `lib/api-spec/openapi.yaml` — shared API contract
- `lib/api-client-react` and `lib/api-zod` — generated client hooks and validation
- `lib/db` — Drizzle schema and database access
- `docs/ui-selection-brief.md` — baseline and future UI exploration plan

## Run locally on Replit

### Requirements

- Node.js 24
- pnpm
- PostgreSQL exposed through `DATABASE_URL`

Install dependencies from the repository root:

```sh
pnpm install
```

Push the development schema:

```sh
pnpm --filter @workspace/db run push
```

Run the API and web app using the configured Replit workflows:

```sh
pnpm --filter @workspace/api-server run dev
pnpm --filter @workspace/delivery-fixes run dev
```

The API server listens on port 5000. In Replit, open the Delivery Fixes artifact through its proxied preview rather than navigating to localhost directly.

## Useful checks

```sh
pnpm run typecheck
pnpm run build
pnpm --filter @workspace/api-spec run codegen
```

Run code generation after changing `lib/api-spec/openapi.yaml`.

## Architecture

The frontend uses React, Vite, TanStack Query, Wouter, Tailwind CSS, and reusable Radix-based components. The Express API validates request and response data against generated Zod schemas. PostgreSQL data is accessed through Drizzle ORM. The OpenAPI contract is the source for generated frontend hooks and shared validation.

The MVP is intentionally narrow: it validates the merchant workflow for post-purchase delivery corrections before introducing Shopify platform complexity.

## Intentionally deferred

- Shopify OAuth, store installation, webhooks, and order synchronization
- Billing and subscription plans
- Shopify App Store submission and production publishing
- A final visual direction or generated UI variants
- Additional carrier, help-desk, or messaging integrations

See [the UI selection brief](docs/ui-selection-brief.md) for the visual decisions that remain open. These items should be added as self-serve product flows; they should not introduce a direct-sales workflow.