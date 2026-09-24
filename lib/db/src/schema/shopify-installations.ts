import { pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const shopifyInstallationsTable = pgTable("shopify_installations", {
  shopDomain: text("shop_domain").primaryKey(),
  accessToken: text("access_token").notNull(),
  refreshToken: text("refresh_token"),
  scope: text("scope").notNull(),
  accessTokenExpiresAt: timestamp("access_token_expires_at", {
    withTimezone: true,
  }),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at", {
    withTimezone: true,
  }),
  installedAt: timestamp("installed_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type ShopifyInstallation =
  typeof shopifyInstallationsTable.$inferSelect;