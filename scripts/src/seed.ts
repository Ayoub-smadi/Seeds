import pg from "pg";
import { createHash } from "crypto";

const { Client } = pg;

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is not set. Skipping seed.");
  process.exit(0);
}

const client = new Client({ connectionString: process.env.DATABASE_URL });

async function hashPassword(password: string): Promise<string> {
  const bcrypt = await import("bcryptjs");
  return bcrypt.hash(password, 10);
}

async function seed() {
  await client.connect();

  try {
    const adminEmail = "admin@bazour.jo";
    const adminPassword = "admin123";

    const existing = await client.query(
      "SELECT id FROM users WHERE email = $1",
      [adminEmail]
    );

    if (existing.rowCount === 0) {
      const passwordHash = await hashPassword(adminPassword);
      await client.query(
        `INSERT INTO users (id, name, email, password_hash, role, protected)
         VALUES (gen_random_uuid()::text, 'Admin', $1, $2, 'admin', true)`,
        [adminEmail, passwordHash]
      );
      console.log("✓ Admin user created:", adminEmail);
    } else {
      console.log("✓ Admin user already exists, skipping.");
    }

    const settingsExisting = await client.query(
      "SELECT id FROM settings WHERE id = 'singleton'"
    );
    if (settingsExisting.rowCount === 0) {
      await client.query(
        `INSERT INTO settings (id, store_name, store_name_ar, currency, currency_symbol)
         VALUES ('singleton', 'Seeds Store', 'بذور', 'JOD', 'د.أ')`
      );
      console.log("✓ Default settings created.");
    } else {
      console.log("✓ Settings already exist, skipping.");
    }

    const shippingExisting = await client.query(
      "SELECT COUNT(*) FROM shipping_zones"
    );
    if (parseInt(shippingExisting.rows[0].count) === 0) {
      const zones = [
        { ar: "عمّان",    en: "Amman",   price: "2.00", days: 1 },
        { ar: "الزرقاء", en: "Zarqa",   price: "2.50", days: 2 },
        { ar: "إربد",    en: "Irbid",   price: "3.00", days: 2 },
        { ar: "العقبة",  en: "Aqaba",   price: "4.00", days: 3 },
        { ar: "السلط",   en: "Salt",    price: "3.00", days: 2 },
        { ar: "مادبا",   en: "Madaba",  price: "3.00", days: 2 },
        { ar: "الكرك",   en: "Karak",   price: "3.50", days: 3 },
        { ar: "الطفيلة", en: "Tafilah", price: "3.50", days: 3 },
        { ar: "معان",    en: "Maan",    price: "4.00", days: 3 },
        { ar: "جرش",     en: "Jerash",  price: "3.00", days: 2 },
        { ar: "عجلون",   en: "Ajloun",  price: "3.00", days: 2 },
        { ar: "المفرق",  en: "Mafraq",  price: "3.00", days: 2 },
      ];
      for (const z of zones) {
        await client.query(
          `INSERT INTO shipping_zones (id, name_ar, name_en, price, estimated_days)
           VALUES (gen_random_uuid()::text, $1, $2, $3, $4)`,
          [z.ar, z.en, z.price, z.days]
        );
      }
      console.log("✓ Shipping zones created (12 Jordanian cities).");
    } else {
      console.log("✓ Shipping zones already exist, skipping.");
    }

    console.log("✓ Database seed complete.");
  } finally {
    await client.end();
  }
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
