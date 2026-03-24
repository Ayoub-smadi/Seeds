import { Router } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import productsRouter from "./products";
import categoriesRouter from "./categories";
import cartRouter from "./cart";
import ordersRouter from "./orders";
import paymentsRouter from "./payments";
import usersRouter from "./users";
import shippingRouter from "./shipping";
import offersRouter from "./offers";
import uploadRouter from "./upload";
import settingsRouter from "./settings";
import articlesRouter from "./articles";

const router = Router();

router.use(healthRouter);
router.use("/auth", authRouter);
router.use("/products", productsRouter);
router.use("/categories", categoriesRouter);
router.use("/cart", cartRouter);
router.use("/orders", ordersRouter);
router.use("/payments", paymentsRouter);
router.use("/users", usersRouter);
router.use("/shipping", shippingRouter);
router.use("/offers", offersRouter);
router.use("/upload", uploadRouter);
router.use("/settings", settingsRouter);
router.use("/articles", articlesRouter);

export default router;
