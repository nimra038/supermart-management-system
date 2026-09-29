import { Router } from "express";
import { requireAuth } from "../../middleware/auth.middleware.js";
import { requirePermission } from "../../middleware/permission.middleware.js";
import {
  createPurchaseOrderController,
  receivePurchaseOrderController,
} from "./purchase.controller.js";

const router = Router();

router.post(
  "/",
  requireAuth,
  requirePermission("purchase.create"),
  createPurchaseOrderController
);

router.post(
  "/:id/receive",
  requireAuth,
  requirePermission("purchase.receive"),
  receivePurchaseOrderController
);

export default router;