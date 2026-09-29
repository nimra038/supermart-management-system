import type { Response } from "express";
import type { AuthenticatedRequest } from "../../middleware/auth.middleware.js";
import {
  createProduct,
  getProductByBarcode,
  getProducts,
  updateProduct,
} from "./product.service.js";
import {
  createProductSchema,
  updateProductSchema,
} from "./product.schema.js";

const getBusinessId = async (req: AuthenticatedRequest) => {
  if (!req.authUser) {
    throw new Error("Authenticated user not found");
  }

  const { supabaseAdmin } = await import("../../config/supabase.js");

  const { data, error } = await supabaseAdmin
    .from("users")
    .select("business_id")
    .eq("auth_user_id", req.authUser.id)
    .single();

  if (error || !data) {
    throw new Error("Business not found for user");
  }

  return data.business_id as string;
};

export const createProductController = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const parsed = createProductSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: parsed.error.issues,
        },
      });
    }

    const businessId = await getBusinessId(req);

    const product = await createProduct(
      businessId,
      parsed.data
    );

    return res.status(201).json({
      success: true,
      data: product,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to create product";

    return res.status(500).json({
      success: false,
      error: {
        code: "PRODUCT_CREATE_FAILED",
        message,
      },
    });
  }
};

export const getProductsController = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const businessId = await getBusinessId(req);

    const products = await getProducts(businessId);

    return res.status(200).json({
      success: true,
      data: products,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to load products";

    return res.status(500).json({
      success: false,
      error: {
        code: "PRODUCTS_LOAD_FAILED",
        message,
      },
    });
  }
};

export const getProductByBarcodeController = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const businessId = await getBusinessId(req);
    const barcode = String(req.params.barcode);

    const product = await getProductByBarcode(
      businessId,
      barcode
    );

    if (!product) {
      return res.status(404).json({
        success: false,
        error: {
          code: "PRODUCT_NOT_FOUND",
          message: "Product not found",
        },
      });
    }

    return res.status(200).json({
      success: true,
      data: product,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to load product";

    return res.status(500).json({
      success: false,
      error: {
        code: "PRODUCT_LOAD_FAILED",
        message,
      },
    });
  }
};

export const updateProductController = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const parsed = updateProductSchema.safeParse(
      req.body
    );

    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: parsed.error.issues,
        },
      });
    }

    const businessId = await getBusinessId(req);

    const product = await updateProduct(
      businessId,
      String(req.params.id),
      parsed.data
    );

    return res.status(200).json({
      success: true,
      data: product,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to update product";

    return res.status(500).json({
      success: false,
      error: {
        code: "PRODUCT_UPDATE_FAILED",
        message,
      },
    });
  }
};