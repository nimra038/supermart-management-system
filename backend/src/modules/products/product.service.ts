import { supabaseAdmin } from "../../config/supabase.js";

export const createProduct = async (
  businessId: string,
  payload: Record<string, unknown>
) => {
  const { data, error } = await supabaseAdmin
    .from("products")
    .insert({
      business_id: businessId,
      ...payload,
    })
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
};

export const getProducts = async (businessId: string) => {
  const { data, error } = await supabaseAdmin
    .from("products")
    .select(`
      *,
      categories (
        id,
        name
      ),
      brands (
        id,
        name
      )
    `)
    .eq("business_id", businessId)
    .eq("is_active", true)
    .order("name");

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
};

export const getProductByBarcode = async (
  businessId: string,
  barcode: string
) => {
  const { data, error } = await supabaseAdmin
    .from("products")
    .select(`
      *,
      categories (
        id,
        name
      ),
      brands (
        id,
        name
      )
    `)
    .eq("business_id", businessId)
    .eq("barcode", barcode)
    .eq("is_active", true)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data;
};

export const updateProduct = async (
  businessId: string,
  productId: string,
  payload: Record<string, unknown>
) => {
  const { data, error } = await supabaseAdmin
    .from("products")
    .update(payload)
    .eq("id", productId)
    .eq("business_id", businessId)
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
};