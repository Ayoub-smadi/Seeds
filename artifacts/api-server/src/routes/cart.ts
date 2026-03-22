import { Router } from "express";
import { db } from "@workspace/db";
import { cartItemsTable, productsTable } from "@workspace/db/schema";
import { eq, and } from "drizzle-orm";
import { requireAuth } from "../lib/auth";
import type { JwtPayload } from "../lib/auth";

const router = Router();

async function getCartForUser(userId: string) {
  const items = await db.select({
    cartItem: cartItemsTable,
    product: productsTable,
  })
    .from(cartItemsTable)
    .leftJoin(productsTable, eq(cartItemsTable.productId, productsTable.id))
    .where(eq(cartItemsTable.userId, userId));

  const cartItems = items
    .filter(i => i.product !== null)
    .map(i => {
      const p = i.product!;
      const price = p.onSale && p.salePrice ? parseFloat(String(p.salePrice)) : parseFloat(String(p.price));
      return {
        productId: i.cartItem.productId,
        quantity: i.cartItem.quantity,
        price,
        product: {
          id: p.id, nameAr: p.nameAr, nameEn: p.nameEn,
          price: parseFloat(String(p.price)),
          salePrice: p.salePrice ? parseFloat(String(p.salePrice)) : undefined,
          images: p.images, onSale: p.onSale, quantity: p.quantity,
        },
      };
    });

  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const itemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  return { items: cartItems, subtotal, total: subtotal, itemCount };
}

router.get("/", requireAuth, async (req, res) => {
  try {
    const { userId } = (req as typeof req & { user: JwtPayload }).user;
    res.json(await getCartForUser(userId));
  } catch (err) {
    req.log.error({ err }, "Get cart error");
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.post("/", requireAuth, async (req, res) => {
  try {
    const { userId } = (req as typeof req & { user: JwtPayload }).user;
    const { productId, quantity } = req.body;

    const existing = await db.select().from(cartItemsTable)
      .where(and(eq(cartItemsTable.userId, userId), eq(cartItemsTable.productId, productId)))
      .limit(1);

    if (existing.length > 0) {
      await db.update(cartItemsTable)
        .set({ quantity: existing[0]!.quantity + (quantity || 1) })
        .where(and(eq(cartItemsTable.userId, userId), eq(cartItemsTable.productId, productId)));
    } else {
      await db.insert(cartItemsTable).values({ userId, productId, quantity: quantity || 1 });
    }

    res.json(await getCartForUser(userId));
  } catch (err) {
    req.log.error({ err }, "Add to cart error");
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.put("/:productId", requireAuth, async (req, res) => {
  try {
    const { userId } = (req as typeof req & { user: JwtPayload }).user;
    const { quantity } = req.body;
    await db.update(cartItemsTable)
      .set({ quantity })
      .where(and(eq(cartItemsTable.userId, userId), eq(cartItemsTable.productId, req.params["productId"]!)));
    res.json(await getCartForUser(userId));
  } catch (err) {
    req.log.error({ err }, "Update cart item error");
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.delete("/:productId", requireAuth, async (req, res) => {
  try {
    const { userId } = (req as typeof req & { user: JwtPayload }).user;
    await db.delete(cartItemsTable)
      .where(and(eq(cartItemsTable.userId, userId), eq(cartItemsTable.productId, req.params["productId"]!)));
    res.json(await getCartForUser(userId));
  } catch (err) {
    req.log.error({ err }, "Remove from cart error");
    res.status(500).json({ error: "Internal Server Error" });
  }
});

export default router;
