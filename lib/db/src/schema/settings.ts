import { pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const settingsTable = pgTable("settings", {
  id: text("id").primaryKey().default("singleton"),
  storeName: text("store_name").default("Seeds Store"),
  storeNameAr: text("store_name_ar").default("بذور"),
  logoUrl: text("logo_url"),
  bannerUrl: text("banner_url"),
  footerText: text("footer_text"),
  footerTextAr: text("footer_text_ar"),
  contactEmail: text("contact_email"),
  contactPhone: text("contact_phone"),
  socialFacebook: text("social_facebook"),
  socialInstagram: text("social_instagram"),
  socialTwitter: text("social_twitter"),
  currency: text("currency").default("JOD"),
  currencySymbol: text("currency_symbol").default("د.أ"),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type Settings = typeof settingsTable.$inferSelect;
