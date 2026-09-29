import { Router } from "express";
import { requireAuth } from "../../middleware/auth.middleware.js";
import { requirePermission } from "../../middleware/permission.middleware.js";
import { createReturnController } from "./return.controller.js";

const router = Router();

router.post(
  "/",
  requireAuth,
  requirePermission("sale.refund"),
  createReturnController
);

export default router;