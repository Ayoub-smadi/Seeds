import { pgTable, text, timestamp, numeric, integer, pgEnum, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const orderStatusEnum = pgEnum("order_status", [
  "pending", "confirmed", "processing", "shipped", "delivered", "cancelled"
]);

export const paymentStatusEnum = pgEnum("payment_status", [
  "pending", "paid", "failed", "refunded"
]);

export const ordersTable = pgTable("orders", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  orderNumber: text("order_number").notNull().unique(),
  userId: text("user_id").references(() => usersTable.id, { onDelete: "set null" }),
  items: jsonb("items").notNull().$type<Array<{
    productId: string;
    productNameAr: string;
    productNameEn: string;
    productImage?: string;
    quantity: number;
    price: number;
  }>>(),
  subtotal: numeric("subtotal", { precision: 10, scale: 2 }).notNull(),
  shippingCost: numeric("shipping_cost", { precision: 10, scale: 2 }).notNull().default("0"),
  discount: numeric("discount", { precision: 10, scale: 2 }).notNull().default("0"),
  total: numeric("total", { precision: 10, scale: 2 }).notNull(),
  status: orderStatusEnum("status").notNull().default("pending"),
  paymentStatus: paymentStatusEnum("payment_status").notNull().default("pending"),
  paymentMethod: text("payment_method"),
  transactionId: text("transaction_id"),
  shippingAddress: jsonb("shipping_address").$type<{
    name: string;
    phone: string;
    city: string;
    area?: string;
    street?: string;
    building?: string;
  }>(),
  shippingZoneId: text("shipping_zone_id"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertOrderSchema = createInsertSchema(ordersTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type Order = typeof ordersTable.$inferSelect;
