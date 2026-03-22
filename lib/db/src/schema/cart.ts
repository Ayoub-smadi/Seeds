import { pgTable, text, timestamp, integer } from "drizzle-orm/pg-core";
import { usersTable } from "./users";
import { productsTable } from "./products";

export const cartItemsTable = pgTable("cart_items", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  productId: text("product_id").notNull().references(() => productsTable.id, { onDelete: "cascade" }),
  quantity: integer("quantity").notNull().default(1),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type CartItem = typeof cartItemsTable.$inferSelect;
