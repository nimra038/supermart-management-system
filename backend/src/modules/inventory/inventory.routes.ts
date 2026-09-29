import { Router } from "express";
import { requireAuth } from "../../middleware/auth.middleware.js";
import { requirePermission } from "../../middleware/permission.middleware.js";
import {
  createInventoryMovementController,
  getLowStockProductsController,
  getProductMovementHistoryController,
  getProductStockController,
} from "./inventory.controller.js";

const router = Router();

router.post(
  "/movements",
  requireAuth,
  requirePermission("inventory.adjust"),
  createInventoryMovementController
);

router.get(
  "/stock/:productId",
  requireAuth,
  requirePermission("inventory.view"),
  getProductStockController
);

router.get(
  "/history/:productId",
  requireAuth,
  requirePermission("inventory.view"),
  getProductMovementHistoryController
);

router.get(
  "/low-stock",
  requireAuth,
  requirePermission("inventory.view"),
  getLowStockProductsController
);

export default router;