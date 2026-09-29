import type { Response } from "express";
import type { AuthenticatedRequest } from "../../middleware/auth.middleware.js";
import { supabaseAdmin } from "../../config/supabase.js";
import {
  createPurchaseOrderSchema,
  receivePurchaseOrderSchema,
} from "./purchase.schema.js";
import {
  createPurchaseOrder,
  receivePurchaseOrder,
} from "./purchase.service.js";

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

export const createPurchaseOrderController = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const parsed = createPurchaseOrderSchema.safeParse(req.body);

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

    const purchaseOrder = await createPurchaseOrder(
      businessId,
      userId,
      parsed.data
    );

    return res.status(201).json({
      success: true,
      data: purchaseOrder,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to create purchase order";

    return res.status(500).json({
      success: false,
      error: {
        code: "PURCHASE_ORDER_CREATE_FAILED",
        message,
      },
    });
  }
};

export const receivePurchaseOrderController = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const parsed = receivePurchaseOrderSchema.safeParse(req.body);

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
    const purchaseOrderId = String(req.params.id);

    const result = await receivePurchaseOrder(
      businessId,
      userId,
      purchaseOrderId,
      parsed.data
    );

    return res.status(201).json({
      success: true,
      data: result,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to receive purchase order";

    return res.status(500).json({
      success: false,
      error: {
        code: "PURCHASE_RECEIVE_FAILED",
        message,
      },
    });
  }
};