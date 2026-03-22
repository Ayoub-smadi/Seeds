import { pgTable, text, timestamp, numeric, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const shippingZonesTable = pgTable("shipping_zones", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  nameAr: text("name_ar").notNull(),
  nameEn: text("name_en").notNull(),
  price: numeric("price", { precision: 10, scale: 2 }).notNull(),
  estimatedDays: integer("estimated_days").default(3),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertShippingZoneSchema = createInsertSchema(shippingZonesTable).omit({
  id: true,
  createdAt: true,
});

export type InsertShippingZone = z.infer<typeof insertShippingZoneSchema>;
export type ShippingZone = typeof shippingZonesTable.$inferSelect;
