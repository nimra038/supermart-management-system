import { Router } from "express";
import { login, getMe } from "./auth.controller.js";
import { requireAuth } from "../../middleware/auth.middleware.js";
import { requirePermission } from "../../middleware/permission.middleware.js";

const router = Router();

router.post("/login", login);

router.get("/me", requireAuth, getMe);

router.get(
  "/test-product-create",
  requireAuth,
  requirePermission("product.create"),
  (_req, res) => {
    res.status(200).json({
      success: true,
      message: "Permission check passed",
    });
  }
);

export default router;