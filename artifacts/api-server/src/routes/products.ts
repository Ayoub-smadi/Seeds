import { Router } from "express";
import { db } from "@workspace/db";
import { productsTable, categoriesTable } from "@workspace/db/schema";
import { eq, ilike, and, gte, lte, sql, desc, asc } from "drizzle-orm";
import { requireAdmin } from "../lib/auth";

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

export default router;
