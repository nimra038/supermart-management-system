import { supabaseAdmin } from "../../config/supabase.js";

type ReturnItemInput = {
  sale_item_id: string;
  quantity: number;
  condition: "RESTOCKABLE" | "DAMAGED";
};

type CreateReturnInput = {
  sale_id: string;
  reason?: string;
  items: ReturnItemInput[];
};

export const createReturn = async (
  businessId: string,
  userId: string,
  payload: CreateReturnInput
) => {
  const { data: sale, error: saleError } = await supabaseAdmin
    .from("sales")
    .select("id, business_id, status")
    .eq("id", payload.sale_id)
    .eq("business_id", businessId)
    .single();

  if (saleError || !sale) {
    throw new Error("Sale not found");
  }

  if (sale.status === "CANCELLED") {
    throw new Error("Cancelled sale cannot be returned");
  }

  let totalRefund = 0;

  const returnItemsData = [];

  for (const item of payload.items) {
    const { data: saleItem, error: saleItemError } =
      await supabaseAdmin
        .from("sale_items")
        .select(`
          id,
          sale_id,
          product_id,
          quantity,
          unit_price,
          discount_amount,
          line_total
        `)
        .eq("id", item.sale_item_id)
        .eq("sale_id", payload.sale_id)
        .single();

    if (saleItemError || !saleItem) {
      throw new Error("Sale item not found");
    }

    const { data: previousReturns, error: previousReturnsError } =
      await supabaseAdmin
        .from("return_items")
        .select("quantity")
        .eq("sale_item_id", saleItem.id);

    if (previousReturnsError) {
      throw new Error(previousReturnsError.message);
    }

    const alreadyReturned = (previousReturns ?? []).reduce(
      (total, row) => total + Number(row.quantity),
      0
    );

    const soldQuantity = Number(saleItem.quantity);

    if (alreadyReturned + item.quantity > soldQuantity) {
      throw new Error(
        `Return quantity exceeds sold quantity for product ${saleItem.product_id}`
      );
    }

    const perUnitRefund =
      Number(saleItem.line_total) / soldQuantity;

    const refundAmount =
      perUnitRefund * item.quantity;

    totalRefund += refundAmount;

    returnItemsData.push({
      sale_item_id: saleItem.id,
      product_id: saleItem.product_id,
      quantity: item.quantity,
      refund_amount: refundAmount,
      condition: item.condition,
    });
  }

  const returnNumber = `RET-${Date.now()}`;

  const { data: returnRecord, error: returnError } =
    await supabaseAdmin
      .from("returns")
      .insert({
        business_id: businessId,
        sale_id: payload.sale_id,
        processed_by: userId,
        return_number: returnNumber,
        refund_amount: totalRefund,
        reason: payload.reason ?? null,
      })
      .select("*")
      .single();

  if (returnError) {
    throw new Error(returnError.message);
  }

  const rows = returnItemsData.map((item) => ({
    return_id: returnRecord.id,
    ...item,
  }));

  const { data: insertedItems, error: itemsError } =
    await supabaseAdmin
      .from("return_items")
      .insert(rows)
      .select("*");

  if (itemsError) {
    throw new Error(itemsError.message);
  }

  for (const item of returnItemsData) {
    if (item.condition === "RESTOCKABLE") {
      const { error: movementError } = await supabaseAdmin
        .from("inventory_movements")
        .insert({
          business_id: businessId,
          product_id: item.product_id,
          movement_type: "RETURN",
          quantity_change: Math.abs(item.quantity),
          reference_type: "RETURN",
          reference_id: returnRecord.id,
          reason: "Customer return",
          performed_by: userId,
        });

      if (movementError) {
        throw new Error(movementError.message);
      }
    }
  }

  const { data: saleItems, error: saleItemsError } =
    await supabaseAdmin
      .from("sale_items")
      .select("id, quantity")
      .eq("sale_id", payload.sale_id);

  if (saleItemsError) {
    throw new Error(saleItemsError.message);
  }

  let fullyReturned = true;

  for (const saleItem of saleItems ?? []) {
    const { data: returnedRows, error: returnedError } =
      await supabaseAdmin
        .from("return_items")
        .select("quantity")
        .eq("sale_item_id", saleItem.id);

    if (returnedError) {
      throw new Error(returnedError.message);
    }

    const returnedQty = (returnedRows ?? []).reduce(
      (total, row) => total + Number(row.quantity),
      0
    );

    if (returnedQty < Number(saleItem.quantity)) {
      fullyReturned = false;
      break;
    }
  }

  const saleStatus = fullyReturned
    ? "REFUNDED"
    : "PARTIALLY_REFUNDED";

  const { error: statusError } = await supabaseAdmin
    .from("sales")
    .update({
      status: saleStatus,
    })
    .eq("id", payload.sale_id);

  if (statusError) {
    throw new Error(statusError.message);
  }

  return {
    return: returnRecord,
    items: insertedItems ?? [],
    sale_status: saleStatus,
  };
};