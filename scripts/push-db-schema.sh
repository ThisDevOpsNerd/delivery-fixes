#!/bin/bash
# Applies the current Drizzle schema (packages under lib/db/src/schema) to the
# database referenced by DATABASE_URL.
#
# This is intended to be run manually (or from a one-off Railway/CI job)
# against the production database whenever a new table or column has been
# added to the Drizzle schema but has not yet been created in the database,
# e.g. the `shopify_installations` table.
#
# It intentionally uses `drizzle-kit push` (via `pnpm --filter @workspace/db
# run push`) rather than a destructive migration, so it only applies the
# additive diff between the schema and the live database — it will not drop
# or alter unrelated tables/columns.
#
# Usage:
#   DATABASE_URL="postgres://..." ./scripts/push-db-schema.sh
#
# In Railway, DATABASE_URL should already be set as a service variable
# referencing the Postgres plugin, so this can be run via:
#   railway run ./scripts/push-db-schema.sh
set -euo pipefail

if [ -z "${DATABASE_URL:-}" ]; then
  echo "DATABASE_URL is not set. Refusing to run schema push." >&2
  echo "Set DATABASE_URL to the target Postgres connection string first." >&2
  exit 1
fi

echo "Pushing @workspace/db Drizzle schema to the database..."
pnpm install --frozen-lockfile
pnpm --filter @workspace/db run push

echo "Schema push complete."
