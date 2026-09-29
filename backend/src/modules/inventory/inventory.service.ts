import { supabaseAdmin } from "../../config/supabase.js";

type InventoryMovementPayload = {
  product_id: string;
  quantity: number;
  movement_type:
    | "PURCHASE"
    | "SALE"
    | "RETURN"
    | "DAMAGE"
    | "WASTAGE"
    | "ADJUSTMENT_IN"
    | "ADJUSTMENT_OUT";
  reason?: string;
  reference_type?: string;
  reference_id?: string | null;
};

export const getProductStock = async (
  businessId: string,
  productId: string
) => {
  const { data, error } = await supabaseAdmin
    .from("inventory_movements")
    .select("quantity_change")
    .eq("business_id", businessId)
    .eq("product_id", productId);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).reduce(
    (total, movement) =>
      total + Number(movement.quantity_change),
    0
  );
};

export const createInventoryMovement = async (
  businessId: string,
  userId: string,
  payload: InventoryMovementPayload
) => {
  const isStockOut =
    payload.movement_type === "SALE" ||
    payload.movement_type === "DAMAGE" ||
    payload.movement_type === "WASTAGE" ||
    payload.movement_type === "ADJUSTMENT_OUT";

  if (isStockOut) {
    const currentStock = await getProductStock(
      businessId,
      payload.product_id
    );

    if (currentStock < payload.quantity) {
      throw new Error(
        `Insufficient stock. Available: ${currentStock}, requested: ${payload.quantity}`
      );
    }
  }

  const quantityChange = isStockOut
    ? -Math.abs(payload.quantity)
    : Math.abs(payload.quantity);

  const { data, error } = await supabaseAdmin
    .from("inventory_movements")
    .insert({
      business_id: businessId,
      product_id: payload.product_id,
      movement_type: payload.movement_type,
      quantity_change: quantityChange,
      reason: payload.reason ?? null,
      reference_type: payload.reference_type ?? null,
      reference_id: payload.reference_id ?? null,
      performed_by: userId,
    })
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
};

export const getProductMovementHistory = async (
  businessId: string,
  productId: string
) => {
  const { data, error } = await supabaseAdmin
    .from("inventory_movements")
    .select(`
      id,
      product_id,
      batch_id,
      movement_type,
      quantity_change,
      reference_type,
      reference_id,
      reason,
      performed_by,
      created_at
    `)
    .eq("business_id", businessId)
    .eq("product_id", productId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
};

export const getLowStockProducts = async (
  businessId: string
) => {
  const { data: products, error: productsError } = await supabaseAdmin
    .from("products")
    .select(`
      id,
      name,
      barcode,
      reorder_level,
      unit,
      is_active
    `)
    .eq("business_id", businessId)
    .eq("is_active", true);

  if (productsError) {
    throw new Error(productsError.message);
  }

  const lowStockProducts = [];

  for (const product of products ?? []) {
    const currentStock = await getProductStock(
      businessId,
      product.id
    );

    if (currentStock <= Number(product.reorder_level)) {
      lowStockProducts.push({
        ...product,
        current_stock: currentStock,
      });
    }
  }

  return lowStockProducts;
};