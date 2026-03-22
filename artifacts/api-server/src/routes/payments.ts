import { Router } from "express";
import { db } from "@workspace/db";
import { ordersTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import { requireAuth } from "../lib/auth";
import type { JwtPayload } from "../lib/auth";
import type { Request } from "express";

const router = Router();

router.post("/stripe/create-intent", requireAuth, async (req, res) => {
  try {
    const stripeKey = process.env["STRIPE_SECRET_KEY"];
    if (!stripeKey) {
      res.status(503).json({ error: "Service Unavailable", message: "Stripe not configured" });
      return;
    }

    const { orderId } = req.body;
    const [order] = await db.select().from(ordersTable).where(eq(ordersTable.id, orderId)).limit(1);
    if (!order) {
      res.status(404).json({ error: "Not Found", message: "Order not found" });
      return;
    }

    const stripe = (await import("stripe")).default(stripeKey);
    const intent = await stripe.paymentIntents.create({
      amount: Math.round(parseFloat(String(order.total)) * 100),
      currency: "jod",
      metadata: { orderId },
    });

    res.json({
      clientSecret: intent.client_secret,
      publishableKey: process.env["STRIPE_PUBLISHABLE_KEY"] || "",
    });
  } catch (err) {
    req.log.error({ err }, "Create payment intent error");
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.post("/stripe/webhook", async (req, res) => {
  try {
    const stripeKey = process.env["STRIPE_SECRET_KEY"];
    const webhookSecret = process.env["STRIPE_WEBHOOK_SECRET"];

    if (!stripeKey) {
      res.status(503).json({ error: "Stripe not configured" });
      return;
    }

    const stripe = (await import("stripe")).default(stripeKey);
    let event;

    if (webhookSecret) {
      const sig = req.headers["stripe-signature"] as string;
      event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    } else {
      event = req.body;
    }

    if (event.type === "payment_intent.succeeded") {
      const orderId = event.data.object.metadata?.orderId;
      if (orderId) {
        await db.update(ordersTable)
          .set({ paymentStatus: "paid", transactionId: event.data.object.id, status: "confirmed", updatedAt: new Date() })
          .where(eq(ordersTable.id, orderId));
      }
    } else if (event.type === "payment_intent.payment_failed") {
      const orderId = event.data.object.metadata?.orderId;
      if (orderId) {
        await db.update(ordersTable)
          .set({ paymentStatus: "failed", updatedAt: new Date() })
          .where(eq(ordersTable.id, orderId));
      }
    }

    res.json({ success: true });
  } catch (err) {
    req.log.error({ err }, "Stripe webhook error");
    res.status(400).json({ error: "Webhook error" });
  }
});

export default router;
