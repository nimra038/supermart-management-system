import type { Response } from "express";
import type { AuthenticatedRequest } from "../../middleware/auth.middleware.js";
import { supabaseAdmin } from "../../config/supabase.js";
import { inventoryAdjustmentSchema } from "./inventory.schema.js";
import {
  createInventoryMovement,
  getLowStockProducts,
  getProductMovementHistory,
  getProductStock,
} from "./inventory.service.js";

const getUserContext = async (req: AuthenticatedRequest) => {
  if (!req.authUser) {
    throw new Error("Authenticated user not found");
  }

  const { data, error } = await supabaseAdmin
    .from("users")
    .select("id, business_id")
    .eq("auth_user_id", req.authUser.id)
    .single();

  if (error || !data) {
    throw new Error("Application user profile not found");
  }

  return {
    userId: data.id as string,
    businessId: data.business_id as string,
  };
};

export const createInventoryMovementController = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const parsed = inventoryAdjustmentSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: parsed.error.issues,
        },
      });
    }

    const { userId, businessId } = await getUserContext(req);

    const movement = await createInventoryMovement(
      businessId,
      userId,
      parsed.data
    );

    const stock = await getProductStock(
      businessId,
      parsed.data.product_id
    );

    return res.status(201).json({
      success: true,
      data: {
        movement,
        current_stock: stock,
      },
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to create inventory movement";

    return res.status(500).json({
      success: false,
      error: {
        code: "INVENTORY_MOVEMENT_FAILED",
        message,
      },
    });
  }
};

export const getProductStockController = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { businessId } = await getUserContext(req);
    const productId = String(req.params.productId);

    const stock = await getProductStock(
      businessId,
      productId
    );

    return res.status(200).json({
      success: true,
      data: {
        product_id: productId,
        current_stock: stock,
      },
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to load product stock";

    return res.status(500).json({
      success: false,
      error: {
        code: "STOCK_LOAD_FAILED",
        message,
      },
    });
  }
};

export const getProductMovementHistoryController = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { businessId } = await getUserContext(req);
    const productId = String(req.params.productId);

    const movements = await getProductMovementHistory(
      businessId,
      productId
    );

    return res.status(200).json({
      success: true,
      data: movements,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to load inventory history";

    return res.status(500).json({
      success: false,
      error: {
        code: "INVENTORY_HISTORY_LOAD_FAILED",
        message,
      },
    });
  }
};

export const getLowStockProductsController = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { businessId } = await getUserContext(req);

    const products = await getLowStockProducts(businessId);

    return res.status(200).json({
      success: true,
      data: products,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to load low stock products";

    return res.status(500).json({
      success: false,
      error: {
        code: "LOW_STOCK_LOAD_FAILED",
        message,
      },
    });
  }
};