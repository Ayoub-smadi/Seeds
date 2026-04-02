import { Router } from "express";
import { db } from "@workspace/db";
import { ordersTable, cartItemsTable, productsTable, usersTable, shippingZonesTable, offersTable } from "@workspace/db/schema";
import { eq, desc, sql } from "drizzle-orm";
import { requireAuth, requireAdmin, optionalAuth } from "../lib/auth";
import type { JwtPayload } from "../lib/auth";
import { sendOrderConfirmedSms, sendOrderShippedSms } from "../lib/sms";
import { sendOrderConfirmationEmail, sendOrderCancelledEmail, sendAdminNewOrderEmail } from "../lib/email";

const router = Router();

function generateOrderNumber(): string {
  return "ORD-" + Date.now().toString(36).toUpperCase() + Math.random().toString(36).slice(2, 5).toUpperCase();
}

router.get("/", requireAuth, async (req, res) => {
  try {
    const { userId, role } = (req as typeof req & { user: JwtPayload }).user;
    const page = parseInt(String(req.query["page"] || "1"));
    const limit = parseInt(String(req.query["limit"] || "20"));
    const offset = (page - 1) * limit;

    const isAdmin = role === "admin";

    const where = isAdmin
      ? undefined
      : eq(ordersTable.userId, userId);

    const [orders, countResult] = await Promise.all([
      db.select({
        order: ordersTable,
        user: { id: usersTable.id, name: usersTable.name, email: usersTable.email, phone: usersTable.phone },
      })
        .from(ordersTable)
        .leftJoin(usersTable, eq(ordersTable.userId, usersTable.id))
        .where(where)
        .orderBy(desc(ordersTable.createdAt))
        .limit(limit)
        .offset(offset),
      db.select({ count: sql<number>`count(*)` }).from(ordersTable).where(where),
    ]);

    const total = Number(countResult[0]?.count || 0);
    res.json({
      orders: orders.map(({ order, user }) => ({
        ...order,
        subtotal: parseFloat(String(order.subtotal)),
        shippingCost: parseFloat(String(order.shippingCost)),
        discount: parseFloat(String(order.discount)),
        total: parseFloat(String(order.total)),
        user: user?.id ? user : undefined,
      })),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    req.log.error({ err }, "Get orders error");
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.post("/", optionalAuth, async (req, res) => {
  try {
    const userId = (req as typeof req & { user?: JwtPayload }).user?.userId ?? null;
    const { shippingAddress, shippingZoneId, paymentMethod, offerCode, notes, cartItems: bodyCartItems, customerEmail } = req.body;

    if (!shippingAddress?.name || !shippingAddress?.phone) {
      res.status(400).json({ error: "Bad Request", message: "Shipping address with name and phone is required" });
      return;
    }

    // Use items from request body (local cart) — or fall back to DB cart for logged-in users
    let items: Array<{ productId: string; productNameAr: string; productNameEn: string; productImage?: string; quantity: number; price: number }> = [];

    if (Array.isArray(bodyCartItems) && bodyCartItems.length > 0) {
      // Items sent from frontend local cart
      items = bodyCartItems.map((ci: any) => ({
        productId: ci.productId,
        productNameAr: ci.productNameAr || "",
        productNameEn: ci.productNameEn || "",
        productImage: ci.productImage,
        quantity: ci.quantity,
        price: parseFloat(String(ci.price)) || 0,
      }));
    } else if (userId) {
      // Fall back to DB cart for logged-in users
      const dbCart = await db.select({
        cartItem: cartItemsTable,
        product: productsTable,
      })
        .from(cartItemsTable)
        .leftJoin(productsTable, eq(cartItemsTable.productId, productsTable.id))
        .where(eq(cartItemsTable.userId, userId));

      items = dbCart.map(({ cartItem, product }) => {
        const p = product!;
        const price = p.onSale && p.salePrice ? parseFloat(String(p.salePrice)) : parseFloat(String(p.price));
        return {
          productId: p.id,
          productNameAr: p.nameAr,
          productNameEn: p.nameEn,
          productImage: p.images[0] || undefined,
          quantity: cartItem.quantity,
          price,
        };
      });
    }

    if (items.length === 0) {
      res.status(400).json({ error: "Bad Request", message: "Cart is empty" });
      return;
    }

    const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);

    const FREE_SHIPPING_THRESHOLD = 80;
    const isFreeShipping = subtotal >= FREE_SHIPPING_THRESHOLD;

    let shippingCost = 0;
    if (!isFreeShipping && shippingZoneId) {
      const [zone] = await db.select().from(shippingZonesTable).where(eq(shippingZonesTable.id, shippingZoneId)).limit(1);
      if (zone) shippingCost = parseFloat(String(zone.price));
    }

    let discount = 0;
    if (offerCode) {
      const [offer] = await db.select().from(offersTable).where(eq(offersTable.code, offerCode)).limit(1);
      if (offer && offer.active) {
        if (offer.discountType === "percentage") {
          discount = subtotal * parseFloat(String(offer.discountValue)) / 100;
        } else {
          discount = parseFloat(String(offer.discountValue));
        }
        await db.update(offersTable).set({ usedCount: offer.usedCount + 1 }).where(eq(offersTable.id, offer.id));
      }
    }

    const total = subtotal + shippingCost - discount;

    const [order] = await db.insert(ordersTable).values({
      orderNumber: generateOrderNumber(),
      userId,
      items,
      subtotal: String(subtotal),
      shippingCost: String(shippingCost),
      discount: String(discount),
      total: String(total),
      status: "pending",
      paymentStatus: paymentMethod === "cash_on_delivery" ? "pending" : "pending",
      paymentMethod,
      shippingAddress,
      shippingZoneId,
      notes,
    }).returning();

    // Clear DB cart for logged-in users
    if (userId) {
      await db.delete(cartItemsTable).where(eq(cartItemsTable.userId, userId));
    }

    let clientSecret: string | undefined;
    if (paymentMethod === "stripe" && process.env["STRIPE_SECRET_KEY"]) {
      const stripe = (await import("stripe")).default(process.env["STRIPE_SECRET_KEY"]!);
      const intent = await stripe.paymentIntents.create({
        amount: Math.round(total * 100),
        currency: "jod",
        metadata: { orderId: order.id },
      });
      clientSecret = intent.client_secret || undefined;
    }

    const emailPayload = {
      orderNumber: order.orderNumber,
      items: items.map(i => ({
        nameAr: i.productNameAr || i.productNameEn,
        nameEn: i.productNameEn || i.productNameAr,
        quantity: i.quantity,
        price: i.price,
        productImage: i.productImage,
      })),
      subtotal,
      shippingCost,
      discount,
      total,
      shippingAddress,
      paymentMethod,
    };

    // Send response immediately — don't block on email/SMS
    res.status(201).json({
      order: { ...order, subtotal: parseFloat(String(order.subtotal)), total: parseFloat(String(order.total)) },
      clientSecret,
    });

    // Send notifications in background (fire-and-forget)
    (async () => {
      try {
        let resolvedCustomerName = shippingAddress?.name || "عزيزي العميل";
        let resolvedCustomerEmail: string | undefined = customerEmail;

        if (userId) {
          const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
          if (user?.name) resolvedCustomerName = user.name;
          if (user?.email) resolvedCustomerEmail = user.email;
          if (user?.phone) {
            await sendOrderConfirmedSms(user.phone, order.orderNumber).catch(() => {});
          }
          if (user?.email) {
            await sendOrderConfirmationEmail({
              customerName: resolvedCustomerName,
              customerEmail: user.email,
              ...emailPayload,
            }).catch(() => {});
          }
        } else if (customerEmail) {
          await sendOrderConfirmationEmail({
            customerName: resolvedCustomerName,
            customerEmail,
            ...emailPayload,
          }).catch(() => {});
        }

        await sendAdminNewOrderEmail({
          customerName: resolvedCustomerName,
          customerEmail: resolvedCustomerEmail,
          ...emailPayload,
        }).catch(() => {});
      } catch {
        // Notification errors are non-fatal
      }
    })();
  } catch (err) {
    req.log.error({ err }, "Create order error");
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/:id", requireAuth, async (req, res) => {
  try {
    const { userId, role } = (req as typeof req & { user: JwtPayload }).user;
    const [row] = await db.select({
      order: ordersTable,
      user: { id: usersTable.id, name: usersTable.name, email: usersTable.email, phone: usersTable.phone },
    })
      .from(ordersTable)
      .leftJoin(usersTable, eq(ordersTable.userId, usersTable.id))
      .where(eq(ordersTable.id, req.params["id"]!))
      .limit(1);

    if (!row) {
      res.status(404).json({ error: "Not Found" });
      return;
    }

    if (role !== "admin" && row.order.userId !== userId) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }

    const { order, user } = row;
    res.json({
      ...order,
      subtotal: parseFloat(String(order.subtotal)),
      total: parseFloat(String(order.total)),
      user: user?.id ? user : undefined,
    });
  } catch (err) {
    req.log.error({ err }, "Get order error");
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.delete("/:id", requireAdmin, async (req, res) => {
  try {
    const [order] = await db.delete(ordersTable)
      .where(eq(ordersTable.id, req.params["id"]!))
      .returning();

    if (!order) {
      res.status(404).json({ error: "Not Found" });
      return;
    }

    res.json({ success: true });
  } catch (err) {
    req.log.error({ err }, "Delete order error");
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.put("/:id/status", requireAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    const [order] = await db.update(ordersTable)
      .set({ status, updatedAt: new Date() })
      .where(eq(ordersTable.id, req.params["id"]!))
      .returning();

    if (!order) {
      res.status(404).json({ error: "Not Found" });
      return;
    }

    if (order.userId) {
      const [user] = await db.select().from(usersTable).where(eq(usersTable.id, order.userId)).limit(1);

      if (status === "shipped" && user?.phone) {
        await sendOrderShippedSms(user.phone, order.orderNumber);
      }

      if (status === "cancelled" && user?.email) {
        const items = (order.items as any[]).map((i: any) => ({
          nameAr: i.productNameAr || i.nameAr || "",
          nameEn: i.productNameEn || i.nameEn || "",
          quantity: i.quantity,
          price: i.price,
          productImage: i.productImage,
        }));
        await sendOrderCancelledEmail({
          customerName: user.name || (order.shippingAddress as any)?.name || "عزيزي العميل",
          customerEmail: user.email,
          orderNumber: order.orderNumber,
          items,
        });
      }
    } else if (status === "shipped") {
      const shippingAddr = order.shippingAddress as any;
      if (shippingAddr?.phone) {
        await sendOrderShippedSms(shippingAddr.phone, order.orderNumber);
      }
    }

    res.json({ ...order, total: parseFloat(String(order.total)) });
  } catch (err) {
    req.log.error({ err }, "Update order status error");
    res.status(500).json({ error: "Internal Server Error" });
  }
});

export default router;
