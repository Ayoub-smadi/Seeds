import { Router } from "express";
import { db } from "@workspace/db";
import { productsTable, categoriesTable, reviewsTable } from "@workspace/db/schema";
import { eq, ilike, and, gte, lte, sql, desc, asc, ne, avg } from "drizzle-orm";
import { requireAdmin, requireAuth, optionalAuth } from "../lib/auth";
import type { JwtPayload } from "../lib/auth";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const page = parseInt(String(req.query["page"] || "1"));
    const limit = parseInt(String(req.query["limit"] || "20"));
    const offset = (page - 1) * limit;
    const search = req.query["search"] as string | undefined;
    const categoryId = req.query["categoryId"] as string | undefined;
    const minPrice = req.query["minPrice"] ? parseFloat(String(req.query["minPrice"])) : undefined;
    const maxPrice = req.query["maxPrice"] ? parseFloat(String(req.query["maxPrice"])) : undefined;
    const onSale = req.query["onSale"] === "true";
    const sortBy = req.query["sortBy"] as string | undefined;

    const conditions = [];
    if (search) conditions.push(sql`(${productsTable.nameAr} ILIKE ${'%' + search + '%'} OR ${productsTable.nameEn} ILIKE ${'%' + search + '%'})`);
    if (categoryId) conditions.push(eq(productsTable.categoryId, categoryId));
    if (minPrice !== undefined) conditions.push(gte(productsTable.price, String(minPrice)));
    if (maxPrice !== undefined) conditions.push(lte(productsTable.price, String(maxPrice)));
    if (onSale) conditions.push(eq(productsTable.onSale, true));

    const where = conditions.length > 0 ? and(...conditions) : undefined;

    let orderBy;
    if (sortBy === "price_asc") orderBy = asc(productsTable.price);
    else if (sortBy === "price_desc") orderBy = desc(productsTable.price);
    else if (sortBy === "popular") orderBy = desc(productsTable.reviewCount);
    else orderBy = desc(productsTable.createdAt);

    const [products, countResult] = await Promise.all([
      db.select({
        product: productsTable,
        category: categoriesTable,
      })
        .from(productsTable)
        .leftJoin(categoriesTable, eq(productsTable.categoryId, categoriesTable.id))
        .where(where)
        .orderBy(orderBy)
        .limit(limit)
        .offset(offset),
      db.select({ count: sql<number>`count(*)` }).from(productsTable).where(where),
    ]);

    const total = Number(countResult[0]?.count || 0);

    res.json({
      products: products.map(({ product, category }) => ({
        ...product,
        price: parseFloat(String(product.price)),
        salePrice: product.salePrice ? parseFloat(String(product.salePrice)) : undefined,
        rating: product.rating ? parseFloat(String(product.rating)) : 0,
        category: category ? { id: category.id, nameAr: category.nameAr, nameEn: category.nameEn, slug: category.slug, imageUrl: category.imageUrl } : undefined,
      })),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    req.log.error({ err }, "Get products error");
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const [row] = await db.select({
      product: productsTable,
      category: categoriesTable,
    })
      .from(productsTable)
      .leftJoin(categoriesTable, eq(productsTable.categoryId, categoriesTable.id))
      .where(eq(productsTable.id, req.params["id"]!))
      .limit(1);

    if (!row) {
      res.status(404).json({ error: "Not Found", message: "Product not found" });
      return;
    }

    const { product, category } = row;
    res.json({
      ...product,
      price: parseFloat(String(product.price)),
      salePrice: product.salePrice ? parseFloat(String(product.salePrice)) : undefined,
      rating: product.rating ? parseFloat(String(product.rating)) : 0,
      category: category ? { id: category.id, nameAr: category.nameAr, nameEn: category.nameEn, slug: category.slug, imageUrl: category.imageUrl } : undefined,
    });
  } catch (err) {
    req.log.error({ err }, "Get product error");
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.post("/", requireAdmin, async (req, res) => {
  try {
    const { nameAr, nameEn, descriptionAr, descriptionEn, price, salePrice, images, categoryId, quantity, sku, featured, onSale } = req.body;
    const [product] = await db.insert(productsTable).values({
      nameAr, nameEn, descriptionAr, descriptionEn,
      price: String(price),
      salePrice: salePrice ? String(salePrice) : undefined,
      images: images || [],
      categoryId, quantity: quantity || 0, sku,
      featured: featured || false,
      onSale: onSale || false,
    }).returning();
    res.status(201).json({ ...product, price: parseFloat(String(product.price)) });
  } catch (err) {
    req.log.error({ err }, "Create product error");
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.put("/:id", requireAdmin, async (req, res) => {
  try {
    const { nameAr, nameEn, descriptionAr, descriptionEn, price, salePrice, images, categoryId, quantity, sku, featured, onSale } = req.body;
    const [product] = await db.update(productsTable)
      .set({
        nameAr, nameEn, descriptionAr, descriptionEn,
        price: price ? String(price) : undefined,
        salePrice: salePrice ? String(salePrice) : null,
        images, categoryId,
        quantity, sku, featured, onSale,
        updatedAt: new Date(),
      })
      .where(eq(productsTable.id, req.params["id"]!))
      .returning();

    if (!product) {
      res.status(404).json({ error: "Not Found" });
      return;
    }
    res.json({ ...product, price: parseFloat(String(product.price)) });
  } catch (err) {
    req.log.error({ err }, "Update product error");
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.delete("/:id", requireAdmin, async (req, res) => {
  try {
    await db.delete(productsTable).where(eq(productsTable.id, req.params["id"]!));
    res.json({ success: true, message: "Product deleted" });
  } catch (err) {
    req.log.error({ err }, "Delete product error");
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// GET related products by category
router.get("/:id/related", async (req, res) => {
  try {
    const [product] = await db.select({ categoryId: productsTable.categoryId })
      .from(productsTable).where(eq(productsTable.id, req.params["id"]!)).limit(1);
    if (!product) { res.json({ products: [] }); return; }

    const conditions = [ne(productsTable.id, req.params["id"]!)];
    if (product.categoryId) conditions.push(eq(productsTable.categoryId, product.categoryId));

    const related = await db.select({ product: productsTable, category: categoriesTable })
      .from(productsTable)
      .leftJoin(categoriesTable, eq(productsTable.categoryId, categoriesTable.id))
      .where(and(...conditions))
      .orderBy(desc(productsTable.createdAt))
      .limit(4);

    res.json({
      products: related.map(({ product: p, category: c }) => ({
        ...p,
        price: parseFloat(String(p.price)),
        salePrice: p.salePrice ? parseFloat(String(p.salePrice)) : undefined,
        rating: p.rating ? parseFloat(String(p.rating)) : 0,
        category: c ? { id: c.id, nameAr: c.nameAr, nameEn: c.nameEn } : undefined,
      })),
    });
  } catch (err) {
    req.log.error({ err }, "Get related products error");
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// GET reviews for a product
router.get("/:id/reviews", async (req, res) => {
  try {
    const reviews = await db.select()
      .from(reviewsTable)
      .where(eq(reviewsTable.productId, req.params["id"]!))
      .orderBy(desc(reviewsTable.createdAt));
    res.json({ reviews });
  } catch (err) {
    req.log.error({ err }, "Get reviews error");
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// GET all reviews (admin only)
router.get("/reviews/all", requireAdmin, async (req, res) => {
  try {
    const reviews = await db.select({
      id: reviewsTable.id,
      productId: reviewsTable.productId,
      userId: reviewsTable.userId,
      userName: reviewsTable.userName,
      rating: reviewsTable.rating,
      comment: reviewsTable.comment,
      createdAt: reviewsTable.createdAt,
      productNameAr: productsTable.nameAr,
      productNameEn: productsTable.nameEn,
    })
      .from(reviewsTable)
      .leftJoin(productsTable, eq(reviewsTable.productId, productsTable.id))
      .orderBy(desc(reviewsTable.createdAt));
    res.json({ reviews });
  } catch (err) {
    req.log.error({ err }, "Get all reviews error");
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// DELETE a review (admin only)
router.delete("/reviews/:reviewId", requireAdmin, async (req, res) => {
  try {
    const reviewId = req.params["reviewId"]!;
    const [deleted] = await db.select({ productId: reviewsTable.productId })
      .from(reviewsTable)
      .where(eq(reviewsTable.id, reviewId))
      .limit(1);
    if (!deleted) {
      res.status(404).json({ error: "Not Found" });
      return;
    }
    await db.delete(reviewsTable).where(eq(reviewsTable.id, reviewId));
    // Recalculate product rating and count
    const [agg] = await db.select({
      avg: avg(reviewsTable.rating),
      count: sql<number>`count(*)`,
    }).from(reviewsTable).where(eq(reviewsTable.productId, deleted.productId));
    await db.update(productsTable).set({
      rating: agg?.avg ? String(parseFloat(String(agg.avg)).toFixed(2)) : "0",
      reviewCount: Number(agg?.count || 0),
      updatedAt: new Date(),
    }).where(eq(productsTable.id, deleted.productId));
    res.json({ success: true });
  } catch (err) {
    req.log.error({ err }, "Delete review error");
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// POST a review (auth required, one per user per product)
router.post("/:id/reviews", requireAuth, async (req, res) => {
  try {
    const { userId, email } = (req as typeof req & { user: JwtPayload }).user;
    const productId = req.params["id"]!;

    const existing = await db.select({ id: reviewsTable.id })
      .from(reviewsTable)
      .where(and(eq(reviewsTable.productId, productId), eq(reviewsTable.userId, userId)))
      .limit(1);
    if (existing.length > 0) {
      res.status(400).json({ error: "Bad Request", message: "You have already reviewed this product" });
      return;
    }

    const { rating, comment, userName } = req.body as { rating: number; comment?: string; userName?: string };
    if (!rating || rating < 1 || rating > 5) {
      res.status(400).json({ error: "Bad Request", message: "Rating must be between 1 and 5" });
      return;
    }

    const [review] = await db.insert(reviewsTable).values({
      productId, userId,
      userName: userName || email.split("@")[0]!,
      rating,
      comment: comment || null,
    }).returning();

    // Recalculate product rating and count
    const [agg] = await db.select({
      avg: avg(reviewsTable.rating),
      count: sql<number>`count(*)`,
    }).from(reviewsTable).where(eq(reviewsTable.productId, productId));

    await db.update(productsTable).set({
      rating: agg?.avg ? String(parseFloat(String(agg.avg)).toFixed(2)) : "0",
      reviewCount: Number(agg?.count || 0),
      updatedAt: new Date(),
    }).where(eq(productsTable.id, productId));

    res.status(201).json(review);
  } catch (err) {
    req.log.error({ err }, "Post review error");
    res.status(500).json({ error: "Internal Server Error" });
  }
});

export default router;
