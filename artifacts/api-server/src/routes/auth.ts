import { Router } from "express";
import bcrypt from "bcryptjs";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import { signToken, requireAuth } from "../lib/auth";
import type { JwtPayload } from "../lib/auth";

const router = Router();

router.post("/register", async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;
    if (!name || !email || !password) {
      res.status(400).json({ error: "Bad Request", message: "Name, email and password are required" });
      return;
    }
    const existing = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
    if (existing.length > 0) {
      res.status(400).json({ error: "Bad Request", message: "Email already in use" });
      return;
    }
    const passwordHash = await bcrypt.hash(password, 10);
    const [user] = await db.insert(usersTable).values({ name, email, passwordHash, phone, role: "customer" }).returning();
    const token = signToken({ userId: user.id, email: user.email, role: user.role });
    res.status(201).json({
      token,
      user: { id: user.id, name: user.name, email: user.email, phone: user.phone, role: user.role, createdAt: user.createdAt },
    });
  } catch (err) {
    req.log.error({ err }, "Register error");
    res.status(500).json({ error: "Internal Server Error", message: "Registration failed" });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ error: "Bad Request", message: "Email and password required" });
      return;
    }
    const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
    if (!user) {
      res.status(401).json({ error: "Unauthorized", message: "Invalid credentials" });
      return;
    }
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      res.status(401).json({ error: "Unauthorized", message: "Invalid credentials" });
      return;
    }
    const token = signToken({ userId: user.id, email: user.email, role: user.role });
    res.json({
      token,
      user: { id: user.id, name: user.name, email: user.email, phone: user.phone, role: user.role, createdAt: user.createdAt },
    });
  } catch (err) {
    req.log.error({ err }, "Login error");
    res.status(500).json({ error: "Internal Server Error", message: "Login failed" });
  }
});

router.get("/me", requireAuth, async (req, res) => {
  try {
    const { userId } = (req as typeof req & { user: JwtPayload }).user;
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
    if (!user) {
      res.status(401).json({ error: "Unauthorized", message: "User not found" });
      return;
    }
    res.json({ id: user.id, name: user.name, email: user.email, phone: user.phone, role: user.role, avatarUrl: user.avatarUrl, createdAt: user.createdAt });
  } catch (err) {
    req.log.error({ err }, "Get me error");
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.put("/update-credentials", requireAuth, async (req, res) => {
  try {
    const { userId, role } = (req as typeof req & { user: JwtPayload }).user;
    if (role !== "admin") {
      res.status(403).json({ error: "Forbidden", message: "Admin only" });
      return;
    }
    const { email, currentPassword, newPassword } = req.body as { email?: string; currentPassword?: string; newPassword?: string };

    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
    if (!user) {
      res.status(404).json({ error: "Not Found" });
      return;
    }

    if (newPassword) {
      if (!currentPassword) {
        res.status(400).json({ error: "Bad Request", message: "Current password required" });
        return;
      }
      const valid = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!valid) {
        res.status(401).json({ error: "Unauthorized", message: "Current password is incorrect" });
        return;
      }
    }

    const updates: Record<string, unknown> = { updatedAt: new Date() };
    if (email && email !== user.email) {
      const existing = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
      if (existing.length > 0) {
        res.status(400).json({ error: "Bad Request", message: "Email already in use" });
        return;
      }
      updates["email"] = email;
    }
    if (newPassword) {
      updates["passwordHash"] = await bcrypt.hash(newPassword, 10);
    }

    const [updated] = await db.update(usersTable)
      .set(updates)
      .where(eq(usersTable.id, userId))
      .returning({ id: usersTable.id, name: usersTable.name, email: usersTable.email, role: usersTable.role });

    const token = signToken({ userId: updated!.id, email: updated!.email, role: updated!.role });
    res.json({ success: true, token, user: updated });
  } catch (err) {
    req.log.error({ err }, "Update credentials error");
    res.status(500).json({ error: "Internal Server Error" });
  }
});

export default router;
