import { Router } from "express";
import { db } from "@workspace/db";
import { articlesTable } from "@workspace/db/schema";
import { eq, desc } from "drizzle-orm";
import { requireAdmin, optionalAuth } from "../lib/auth";

const router = Router();

router.get("/", optionalAuth, async (req, res) => {
  try {
    const isAdmin = (req as any).user?.role === "admin";
    const all = await db
      .select()
      .from(articlesTable)
      .orderBy(desc(articlesTable.createdAt));

    const result = isAdmin ? all : all.filter(a => a.published);
    res.json(result);
  } catch (err) {
    req.log.error({ err }, "Get articles error");
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/:slug", optionalAuth, async (req, res) => {
  try {
    const [article] = await db
      .select()
      .from(articlesTable)
      .where(eq(articlesTable.slug, req.params["slug"]!))
      .limit(1);

    if (!article) {
      res.status(404).json({ error: "Not Found" });
      return;
    }

    const isAdmin = (req as any).user?.role === "admin";
    if (!article.published && !isAdmin) {
      res.status(404).json({ error: "Not Found" });
      return;
    }

    res.json(article);
  } catch (err) {
    req.log.error({ err }, "Get article error");
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.post("/", requireAdmin, async (req, res) => {
  try {
    const { titleAr, titleEn, slug, excerptAr, excerptEn, coverImage, sections, published } = req.body;

    if (!titleAr || !titleEn || !slug) {
      res.status(400).json({ error: "Bad Request", message: "titleAr, titleEn, and slug are required" });
      return;
    }

    const [article] = await db.insert(articlesTable).values({
      titleAr,
      titleEn,
      slug,
      excerptAr,
      excerptEn,
      coverImage,
      sections: sections ?? [],
      published: published ?? false,
    }).returning();

    res.status(201).json(article);
  } catch (err: any) {
    if (err?.code === "23505") {
      res.status(409).json({ error: "Conflict", message: "Slug already exists" });
      return;
    }
    req.log.error({ err }, "Create article error");
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.put("/:id", requireAdmin, async (req, res) => {
  try {
    const { titleAr, titleEn, slug, excerptAr, excerptEn, coverImage, sections, published } = req.body;

    const [article] = await db
      .update(articlesTable)
      .set({ titleAr, titleEn, slug, excerptAr, excerptEn, coverImage, sections, published, updatedAt: new Date() })
      .where(eq(articlesTable.id, req.params["id"]!))
      .returning();

    if (!article) {
      res.status(404).json({ error: "Not Found" });
      return;
    }

    res.json(article);
  } catch (err) {
    req.log.error({ err }, "Update article error");
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.delete("/:id", requireAdmin, async (req, res) => {
  try {
    const [article] = await db
      .delete(articlesTable)
      .where(eq(articlesTable.id, req.params["id"]!))
      .returning();

    if (!article) {
      res.status(404).json({ error: "Not Found" });
      return;
    }

    res.json({ success: true });
  } catch (err) {
    req.log.error({ err }, "Delete article error");
    res.status(500).json({ error: "Internal Server Error" });
  }
});

export default router;
