import type { Response } from "express";
import type { AuthenticatedRequest } from "../../middleware/auth.middleware.js";
import { supabaseAdmin } from "../../config/supabase.js";
import { createSaleSchema } from "./sale.schema.js";
import { createSale } from "./sale.service.js";

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

export const createSaleController = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const parsed = createSaleSchema.safeParse(req.body);

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

    const result = await createSale(
      businessId,
      userId,
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
        : "Failed to create sale";

    return res.status(500).json({
      success: false,
      error: {
        code: "SALE_CREATE_FAILED",
        message,
      },
    });
  }
};