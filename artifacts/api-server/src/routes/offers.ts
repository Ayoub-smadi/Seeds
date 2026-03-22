import { Router } from "express";
import { db } from "@workspace/db";
import { offersTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import { requireAdmin } from "../lib/auth";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const offers = await db.select().from(offersTable);
    res.json(offers.map(o => ({ ...o, discountValue: parseFloat(String(o.discountValue)) })));
  } catch (err) {
    req.log.error({ err }, "Get offers error");
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.post("/", requireAdmin, async (req, res) => {
  try {
    const { code, discountType, discountValue, minOrderAmount, maxUses, expiresAt } = req.body;
    const [offer] = await db.insert(offersTable).values({
      code: code.toUpperCase(),
      discountType,
      discountValue: String(discountValue),
      minOrderAmount: minOrderAmount ? String(minOrderAmount) : undefined,
      maxUses,
      expiresAt: expiresAt ? new Date(expiresAt) : undefined,
    }).returning();
    res.status(201).json({ ...offer, discountValue: parseFloat(String(offer.discountValue)) });
  } catch (err) {
    req.log.error({ err }, "Create offer error");
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.delete("/:id", requireAdmin, async (req, res) => {
  try {
    await db.delete(offersTable).where(eq(offersTable.id, req.params["id"]!));
    res.json({ success: true, message: "Offer deleted" });
  } catch (err) {
    req.log.error({ err }, "Delete offer error");
    res.status(500).json({ error: "Internal Server Error" });
  }
});

export default router;
