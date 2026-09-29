import { Router } from "express";
import { requireAuth } from "../../middleware/auth.middleware.js";
import { requirePermission } from "../../middleware/permission.middleware.js";
import {
  createProductController,
  getProductByBarcodeController,
  getProductsController,
  updateProductController,
} from "./product.controller.js";

const router = Router();

router.get(
  "/",
  requireAuth,
  requirePermission("product.view"),
  getProductsController
);

router.get(
  "/barcode/:barcode",
  requireAuth,
  requirePermission("product.view"),
  getProductByBarcodeController
);

router.post(
  "/",
  requireAuth,
  requirePermission("product.create"),
  createProductController
);

router.patch(
  "/:id",
  requireAuth,
  requirePermission("product.update"),
  updateProductController
);

export default router;