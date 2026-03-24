import { pgTable, text, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";

export const articlesTable = pgTable("articles", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  titleAr: text("title_ar").notNull(),
  titleEn: text("title_en").notNull(),
  slug: text("slug").notNull().unique(),
  excerptAr: text("excerpt_ar"),
  excerptEn: text("excerpt_en"),
  coverImage: text("cover_image"),
  sections: jsonb("sections").notNull().default([]),
  published: boolean("published").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type Article = typeof articlesTable.$inferSelect;
export type NewArticle = typeof articlesTable.$inferInsert;
