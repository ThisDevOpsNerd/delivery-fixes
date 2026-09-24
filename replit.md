# Delivery Fixes

A public embedded Shopify app for finding and correcting delivery-address problems before fulfillment.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string
- Required secrets: `SHOPIFY_API_KEY`, `SHOPIFY_API_SECRET`, `SESSION_SECRET`
- Railway deployment: `railway.json` builds the Vite App Home and Express API, then runs Express to serve both on the same origin. Set `NODE_ENV=production` and attach a Railway Postgres `DATABASE_URL`. The app serves the frontend from Express when Railway provides `RAILWAY_ENVIRONMENT_NAME`.

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/delivery-fixes` — embedded App Home frontend and merchant workbench
- `artifacts/api-server` — Shopify ID-token authentication and Admin GraphQL operations
- `lib/api-spec/openapi.yaml` — API contract and generated client source
- `lib/db/src/schema` — encrypted Shopify installation-token storage

## Architecture decisions

- Host Delivery Fixes in its own Railway project (app service + dedicated Postgres), not alongside unrelated Shopify services, to isolate credentials, order access, and deploy failures.
- Use Shopify-managed installation and App Bridge ID-token exchange rather than legacy browser OAuth redirects.
- Verify every embedded request against the Shopify app secret; derive the shop from the signed token, never from a client-supplied shop parameter.
- Store offline Admin API tokens encrypted with a key derived from `SESSION_SECRET`.
- The Replit Shopify connector is development-preview fallback only and must never authenticate production requests.

## Product

- Syncs open, unfulfilled orders from the authenticated Shopify store.
- Flags obvious incomplete, malformed, or PO Box delivery addresses.
- Lets merchants review and edit the shipping address before explicitly writing it back to Shopify.
- Provides demo issues for evaluating the workflow without modifying store data.

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- The Shopify Dev Dashboard must enable embedded App Home, Shopify-managed installation, and scopes `read_orders,write_orders`.
- New public apps require protected customer data approval to access order contact and shipping-address fields in production.
- The production App URL must be the Railway service's public HTTPS domain. Do not configure the Replit preview or legacy Replit deployment as the Shopify App URL.
- Register `https://<railway-domain>/api/shopify/webhooks` for `app/uninstalled`, `customers/data_request`, `customers/redact`, and `shop/redact`.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
