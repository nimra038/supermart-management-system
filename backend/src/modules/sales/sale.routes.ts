import { Router } from "express";
import { requireAuth } from "../../middleware/auth.middleware.js";
import { requirePermission } from "../../middleware/permission.middleware.js";
import { createSaleController } from "./sale.controller.js";

const router = Router();

router.post(
  "/",
  requireAuth,
  requirePermission("sale.create"),
  createSaleController
);

export default router;