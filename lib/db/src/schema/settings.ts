import {
  boolean,
  integer,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const settingsTable = pgTable("merchant_settings", {
  id: integer("id").primaryKey().default(1),
  enabled: boolean("enabled").notNull().default(true),
  autoResolveAddress: boolean("auto_resolve_address").notNull().default(false),
  askForPhoto: boolean("ask_for_photo").notNull().default(true),
  customerMessage: text("customer_message")
    .notNull()
    .default(
      "We noticed there may be a delivery detail to confirm. Please review your order so we can ship it without delay.",
    ),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const insertSettingsSchema = createInsertSchema(settingsTable).omit({
  updatedAt: true,
});
export type InsertSettings = z.infer<typeof insertSettingsSchema>;
export type Settings = typeof settingsTable.$inferSelect;