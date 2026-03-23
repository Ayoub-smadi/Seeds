import { Router } from "express";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db/schema";
import { eq, sql } from "drizzle-orm";
import { requireAdmin, requireAuth } from "../lib/auth";
import type { JwtPayload } from "../lib/auth";

const PROTECTED_EMAILS = ["ayoub@bazour.jo"];

const router = Router();

router.get("/", requireAdmin, async (req, res) => {
  try {
    const page = parseInt(String(req.query["page"] || "1"));
    const limit = parseInt(String(req.query["limit"] || "20"));
    const offset = (page - 1) * limit;

    const [users, countResult] = await Promise.all([
      db.select({
        id: usersTable.id, name: usersTable.name, email: usersTable.email,
        phone: usersTable.phone, role: usersTable.role, createdAt: usersTable.createdAt,
      }).from(usersTable).limit(limit).offset(offset),
      db.select({ count: sql<number>`count(*)` }).from(usersTable),
    ]);

    const total = Number(countResult[0]?.count || 0);
    res.json({ users, total, page, totalPages: Math.ceil(total / limit) });
  } catch (err) {
    req.log.error({ err }, "Get users error");
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.put("/:id", requireAuth, async (req, res) => {
  try {
    const { userId, role } = (req as typeof req & { user: JwtPayload }).user;
    if (role !== "admin" && userId !== req.params["id"]) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }
    const { name, phone } = req.body;
    const [user] = await db.update(usersTable)
      .set({ name, phone, updatedAt: new Date() })
      .where(eq(usersTable.id, req.params["id"]!))
      .returning({
        id: usersTable.id, name: usersTable.name, email: usersTable.email,
        phone: usersTable.phone, role: usersTable.role, createdAt: usersTable.createdAt,
      });
    if (!user) {
      res.status(404).json({ error: "Not Found" });
      return;
    }
    res.json(user);
  } catch (err) {
    req.log.error({ err }, "Update user error");
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.delete("/:id", requireAdmin, async (req, res) => {
  try {
    const [target] = await db.select().from(usersTable).where(eq(usersTable.id, req.params["id"]!)).limit(1);
    if (!target) {
      res.status(404).json({ error: "Not Found" });
      return;
    }
    if (target.protected || PROTECTED_EMAILS.includes(target.email)) {
      res.status(403).json({ error: "Forbidden", message: "This account is protected and cannot be deleted." });
      return;
    }
    await db.delete(usersTable).where(eq(usersTable.id, req.params["id"]!));
    res.json({ success: true });
  } catch (err) {
    req.log.error({ err }, "Delete user error");
    res.status(500).json({ error: "Internal Server Error" });
  }
});

export default router;
