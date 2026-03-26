import bcrypt from "bcryptjs";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import { logger } from "./logger";

export async function seedAdmin() {
  const ADMIN_EMAIL = process.env["ADMIN_EMAIL"] ?? "admin@bazour.jo";
  const ADMIN_PASSWORD = process.env["ADMIN_PASSWORD"] ?? "admin@123";
  const ADMIN_NAME = process.env["ADMIN_NAME"] ?? "Admin";

  const existing = await db.select().from(usersTable).where(eq(usersTable.email, ADMIN_EMAIL)).limit(1);
  if (existing.length > 0) {
    if (!existing[0]!.protected) {
      await db.update(usersTable)
        .set({ protected: true, role: "admin" })
        .where(eq(usersTable.email, ADMIN_EMAIL));
    }
    return;
  }
  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 10);
  await db.insert(usersTable).values({
    name: ADMIN_NAME,
    email: ADMIN_EMAIL,
    passwordHash,
    role: "admin",
    protected: true,
  });
  logger.info({ email: ADMIN_EMAIL }, "Admin user seeded successfully");
}
