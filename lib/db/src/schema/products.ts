import { pgTable, text, timestamp, numeric, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { categoriesTable } from "./categories";

export const productsTable = pgTable("products", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  nameAr: text("name_ar").notNull(),
  nameEn: text("name_en").notNull(),
  descriptionAr: text("description_ar"),
  descriptionEn: text("description_en"),
  price: numeric("price", { precision: 10, scale: 2 }).notNull(),
  salePrice: numeric("sale_price", { precision: 10, scale: 2 }),
  images: text("images").array().notNull().default([]),
  categoryId: text("category_id").references(() => categoriesTable.id, { onDelete: "set null" }),
  quantity: integer("quantity").notNull().default(0),
  sku: text("sku"),
  featured: boolean("featured").notNull().default(false),
  onSale: boolean("on_sale").notNull().default(false),
  rating: numeric("rating", { precision: 3, scale: 2 }).default("0"),
  reviewCount: integer("review_count").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertProductSchema = createInsertSchema(productsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Product = typeof productsTable.$inferSelect;
