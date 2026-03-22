import { pgTable, text, timestamp, numeric, integer, boolean, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const discountTypeEnum = pgEnum("discount_type", ["percentage", "fixed"]);

export const offersTable = pgTable("offers", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  code: text("code").notNull().unique(),
  discountType: discountTypeEnum("discount_type").notNull(),
  discountValue: numeric("discount_value", { precision: 10, scale: 2 }).notNull(),
  minOrderAmount: numeric("min_order_amount", { precision: 10, scale: 2 }),
  maxUses: integer("max_uses"),
  usedCount: integer("used_count").notNull().default(0),
  expiresAt: timestamp("expires_at"),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertOfferSchema = createInsertSchema(offersTable).omit({
  id: true,
  usedCount: true,
  createdAt: true,
});

export type InsertOffer = z.infer<typeof insertOfferSchema>;
export type Offer = typeof offersTable.$inferSelect;
