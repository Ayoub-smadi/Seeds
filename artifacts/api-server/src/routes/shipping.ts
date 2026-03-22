import { Router } from "express";
import { db } from "@workspace/db";
import { shippingZonesTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import { requireAdmin } from "../lib/auth";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const zones = await db.select().from(shippingZonesTable);
    res.json(zones.map(z => ({ ...z, price: parseFloat(String(z.price)) })));
  } catch (err) {
    req.log.error({ err }, "Get shipping zones error");
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.post("/", requireAdmin, async (req, res) => {
  try {
    const { nameAr, nameEn, price, estimatedDays } = req.body;
    const [zone] = await db.insert(shippingZonesTable)
      .values({ nameAr, nameEn, price: String(price), estimatedDays })
      .returning();
    res.status(201).json({ ...zone, price: parseFloat(String(zone.price)) });
  } catch (err) {
    req.log.error({ err }, "Create shipping zone error");
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.put("/:id", requireAdmin, async (req, res) => {
  try {
    const { nameAr, nameEn, price, estimatedDays } = req.body;
    const [zone] = await db.update(shippingZonesTable)
      .set({ nameAr, nameEn, price: price ? String(price) : undefined, estimatedDays })
      .where(eq(shippingZonesTable.id, req.params["id"]!))
      .returning();
    if (!zone) {
      res.status(404).json({ error: "Not Found" });
      return;
    }
    res.json({ ...zone, price: parseFloat(String(zone.price)) });
  } catch (err) {
    req.log.error({ err }, "Update shipping zone error");
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.delete("/:id", requireAdmin, async (req, res) => {
  try {
    await db.delete(shippingZonesTable).where(eq(shippingZonesTable.id, req.params["id"]!));
    res.json({ success: true, message: "Shipping zone deleted" });
  } catch (err) {
    req.log.error({ err }, "Delete shipping zone error");
    res.status(500).json({ error: "Internal Server Error" });
  }
});

export default router;
