import {
  doublePrecision,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const deliveryIssuesTable = pgTable("delivery_issues", {
  id: serial("id").primaryKey(),
  orderNumber: text("order_number").notNull(),
  customerName: text("customer_name").notNull(),
  customerEmail: text("customer_email").notNull(),
  issueType: text("issue_type").notNull(),
  status: text("status").notNull().default("needs_attention"),
  currentAddress: text("current_address").notNull(),
  requestedAddress: text("requested_address").notNull(),
  orderValue: doublePrecision("order_value").notNull(),
  itemCount: integer("item_count").notNull(),
  note: text("note"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const insertDeliveryIssueSchema = createInsertSchema(
  deliveryIssuesTable,
).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertDeliveryIssue = z.infer<typeof insertDeliveryIssueSchema>;
export type DeliveryIssue = typeof deliveryIssuesTable.$inferSelect;