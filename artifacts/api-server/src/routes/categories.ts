import { Router } from "express";
import { db } from "@workspace/db";
import { categoriesTable, productsTable } from "@workspace/db/schema";
import { eq, sql, isNull } from "drizzle-orm";
import { requireAdmin } from "../lib/auth";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const rows = await db.select({
      id: categoriesTable.id,
      nameAr: categoriesTable.nameAr,
      nameEn: categoriesTable.nameEn,
      slug: categoriesTable.slug,
      imageUrl: categoriesTable.imageUrl,
      parentId: categoriesTable.parentId,
      productCount: sql<number>`count(${productsTable.id})`,
    })
      .from(categoriesTable)
      .leftJoin(productsTable, eq(productsTable.categoryId, categoriesTable.id))
      .groupBy(categoriesTable.id);

    const all = rows.map(c => ({ ...c, productCount: Number(c.productCount) }));

    const subMap = new Map<string, typeof all>();
    for (const c of all) {
      if (c.parentId) {
        if (!subMap.has(c.parentId)) subMap.set(c.parentId, []);
        subMap.get(c.parentId)!.push(c);
      }
    }

    const parents = all
      .filter(c => !c.parentId)
      .map(c => ({ ...c, subcategories: subMap.get(c.id) ?? [] }));

    const orphans = all
      .filter(c => c.parentId && !all.find(p => p.id === c.parentId))
      .map(c => ({ ...c, subcategories: [] }));

    res.json([...parents, ...orphans]);
  } catch (err) {
    req.log.error({ err }, "Get categories error");
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.post("/", requireAdmin, async (req, res) => {
  try {
    const { nameAr, nameEn, slug, imageUrl, parentId } = req.body;
    const [category] = await db.insert(categoriesTable)
      .values({ nameAr, nameEn, slug, imageUrl, parentId: parentId || null })
      .returning();
    res.status(201).json({ ...category, productCount: 0, subcategories: [] });
  } catch (err) {
    req.log.error({ err }, "Create category error");
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.put("/:id", requireAdmin, async (req, res) => {
  try {
    const { nameAr, nameEn, slug, imageUrl, parentId } = req.body;
    const [category] = await db.update(categoriesTable)
      .set({ nameAr, nameEn, slug, imageUrl, parentId: parentId || null })
      .where(eq(categoriesTable.id, req.params["id"]!))
      .returning();
    if (!category) {
      res.status(404).json({ error: "Not Found" });
      return;
    }
    res.json({ ...category, productCount: 0, subcategories: [] });
  } catch (err) {
    req.log.error({ err }, "Update category error");
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.delete("/:id", requireAdmin, async (req, res) => {
  try {
    await db.delete(categoriesTable).where(eq(categoriesTable.id, req.params["id"]!));
    res.json({ success: true, message: "Category deleted" });
  } catch (err) {
    req.log.error({ err }, "Delete category error");
    res.status(500).json({ error: "Internal Server Error" });
  }
});

export default router;
