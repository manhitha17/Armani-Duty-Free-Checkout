import { createInsertSchema } from "drizzle-zod";
import { integer, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { z } from "zod/v4";

export const customerAccountsTable = pgTable("customer_accounts", {
  clerkUserId: text("clerk_user_id").primaryKey(),
  storeCreditCents: integer("store_credit_cents").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const insertCustomerAccountSchema = createInsertSchema(
  customerAccountsTable,
).omit({
  createdAt: true,
  updatedAt: true,
});

export type InsertCustomerAccount = z.infer<
  typeof insertCustomerAccountSchema
>;
export type CustomerAccount = typeof customerAccountsTable.$inferSelect;