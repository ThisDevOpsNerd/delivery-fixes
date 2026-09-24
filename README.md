# Delivery Fixes

Delivery Fixes is an embedded Shopify app for finding and correcting delivery-address problems before fulfillment. It reads open, unfulfilled orders from the merchant's own store and only updates a shipping address after the merchant confirms the change.

## Railway deployment

Deploy this repository as a new Railway project with an app service and a separate Railway PostgreSQL service. `railway.json` builds the frontend and API together and runs the Express server on Railway's `PORT`.

Configure these app-service variables in Railway:

- `NODE_ENV=production`
- `DATABASE_URL` as a reference to the Railway PostgreSQL service's `DATABASE_URL`
- `SHOPIFY_API_KEY` (the public Client ID from the Shopify Dev Dashboard; required at build time)
- `SHOPIFY_API_SECRET` (Shopify app Client secret; keep private)
- `SESSION_SECRET` (long random encryption key; keep private and retain it across deployments)

Initialize the new PostgreSQL schema once before accepting Shopify installations with `pnpm --filter @workspace/db run push` using the Railway database URL. Do not run schema push automatically on every production deploy. `scripts/push-db-schema.sh` wraps this command with a `DATABASE_URL` guard and can be run against production (e.g. via `railway run ./scripts/push-db-schema.sh`) to create missing tables, such as `shopify_installations`, without dropping or altering unrelated data.

Use the Railway app's HTTPS domain in the Shopify Dev Dashboard as the **App URL**. Enable embedded App Home and Shopify-managed installation, request `read_orders,write_orders`, and register `https://<railway-domain>/api/shopify/webhooks` for `app/uninstalled`, `customers/data_request`, `customers/redact`, and `shop/redact`. Access to customer names and shipping addresses may require Shopify protected-customer-data approval.

The Replit Shopify connector is for local development preview only; production requests must have a valid Shopify App Bridge ID token.

## Development

Use Node.js 24 and pnpm. Install dependencies with `pnpm install`, run `pnpm run typecheck`, and start the API and web workflows locally. See `replit.md` for more details.