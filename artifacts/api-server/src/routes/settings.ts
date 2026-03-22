import { Router } from "express";
import { db } from "@workspace/db";
import { settingsTable } from "@workspace/db/schema";
import { requireAdmin } from "../lib/auth";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const rows = await db.select().from(settingsTable).limit(1);
    if (rows.length === 0) {
      const [settings] = await db.insert(settingsTable).values({
        id: "singleton",
        storeName: "Seeds Store",
        storeNameAr: "بذور",
        currency: "JOD",
        currencySymbol: "د.أ",
      }).returning();
      res.json(settings);
      return;
    }
    res.json(rows[0]);
  } catch (err) {
    req.log.error({ err }, "Get settings error");
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.put("/", requireAdmin, async (req, res) => {
  try {
    const updates = req.body;
    const rows = await db.select().from(settingsTable).limit(1);

    if (rows.length === 0) {
      const [settings] = await db.insert(settingsTable).values({ id: "singleton", ...updates }).returning();
      res.json(settings);
      return;
    }

    const [settings] = await db.update(settingsTable)
      .set({ ...updates, updatedAt: new Date() })
      .returning();
    res.json(settings);
  } catch (err) {
    req.log.error({ err }, "Update settings error");
    res.status(500).json({ error: "Internal Server Error" });
  }
});

export default router;
