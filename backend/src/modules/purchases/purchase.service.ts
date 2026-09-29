import { supabaseAdmin } from "../../config/supabase.js";

type PurchaseItemInput = {
  product_id: string;
  ordered_quantity: number;
  unit_cost: number;
};

type CreatePurchaseOrderInput = {
  supplier_id: string;
  expected_delivery_date?: string | null;
  notes?: string;
  items: PurchaseItemInput[];
};

type ReceivePurchaseItemInput = {
  purchase_order_item_id: string;
  received_quantity: number;
  batch_number?: string | null;
  expiry_date?: string | null;
};

type ReceivePurchaseOrderInput = {
  notes?: string;
  items: ReceivePurchaseItemInput[];
};

export const createPurchaseOrder = async (
  businessId: string,
  userId: string,
  payload: CreatePurchaseOrderInput
) => {
  const orderNumber = `PO-${Date.now()}`;

  const { data: purchaseOrder, error: orderError } =
    await supabaseAdmin
      .from("purchase_orders")
      .insert({
        business_id: businessId,
        supplier_id: payload.supplier_id,
        order_number: orderNumber,
        status: "PENDING",
        order_date: new Date().toISOString().slice(0, 10),
        expected_delivery_date:
          payload.expected_delivery_date ?? null,
        notes: payload.notes ?? null,
        created_by: userId,
      })
      .select("*")
      .single();

  if (orderError) {
    throw new Error(orderError.message);
  }

  const items = payload.items.map((item) => ({
    purchase_order_id: purchaseOrder.id,
    product_id: item.product_id,
    ordered_quantity: item.ordered_quantity,
    received_quantity: 0,
    unit_cost: item.unit_cost,
  }));

  const { data: purchaseItems, error: itemsError } =
    await supabaseAdmin
      .from("purchase_order_items")
      .insert(items)
      .select("*");

  if (itemsError) {
    throw new Error(itemsError.message);
  }

  return {
    ...purchaseOrder,
    items: purchaseItems ?? [],
  };
};

export const receivePurchaseOrder = async (
  businessId: string,
  userId: string,
  purchaseOrderId: string,
  payload: ReceivePurchaseOrderInput
) => {
  const { data: purchaseOrder, error: orderError } =
    await supabaseAdmin
      .from("purchase_orders")
      .select("id, business_id, status")
      .eq("id", purchaseOrderId)
      .eq("business_id", businessId)
      .single();

  if (orderError || !purchaseOrder) {
    throw new Error("Purchase order not found");
  }

  if (purchaseOrder.status === "CANCELLED") {
    throw new Error("Cancelled purchase order cannot be received");
  }

  if (purchaseOrder.status === "FULLY_RECEIVED") {
    throw new Error("Purchase order is already fully received");
  }

  const receiptNumber = `GR-${Date.now()}`;

  const { data: goodsReceipt, error: receiptError } =
    await supabaseAdmin
      .from("goods_receipts")
      .insert({
        business_id: businessId,
        purchase_order_id: purchaseOrderId,
        receipt_number: receiptNumber,
        received_by: userId,
        notes: payload.notes ?? null,
      })
      .select("*")
      .single();

  if (receiptError) {
    throw new Error(receiptError.message);
  }

  for (const receivedItem of payload.items) {
    const { data: poItem, error: poItemError } =
      await supabaseAdmin
        .from("purchase_order_items")
        .select(`
          id,
          purchase_order_id,
          product_id,
          ordered_quantity,
          received_quantity,
          unit_cost
        `)
        .eq("id", receivedItem.purchase_order_item_id)
        .eq("purchase_order_id", purchaseOrderId)
        .single();

    if (poItemError || !poItem) {
      throw new Error("Purchase order item not found");
    }

    const alreadyReceived = Number(poItem.received_quantity);
    const orderedQuantity = Number(poItem.ordered_quantity);

    const newReceivedTotal =
      alreadyReceived + receivedItem.received_quantity;

    if (newReceivedTotal > orderedQuantity) {
      throw new Error(
        `Received quantity exceeds ordered quantity for product ${poItem.product_id}`
      );
    }

    const { error: receiptItemError } = await supabaseAdmin
      .from("goods_receipt_items")
      .insert({
        goods_receipt_id: goodsReceipt.id,
        purchase_order_item_id: poItem.id,
        product_id: poItem.product_id,
        received_quantity: receivedItem.received_quantity,
        unit_cost: poItem.unit_cost,
        batch_number: receivedItem.batch_number ?? null,
        expiry_date: receivedItem.expiry_date ?? null,
      });

    if (receiptItemError) {
      throw new Error(receiptItemError.message);
    }

    const { error: updateItemError } = await supabaseAdmin
      .from("purchase_order_items")
      .update({
        received_quantity: newReceivedTotal,
      })
      .eq("id", poItem.id);

    if (updateItemError) {
      throw new Error(updateItemError.message);
    }

    const { error: movementError } = await supabaseAdmin
      .from("inventory_movements")
      .insert({
        business_id: businessId,
        product_id: poItem.product_id,
        movement_type: "PURCHASE",
        quantity_change: receivedItem.received_quantity,
        reference_type: "GOODS_RECEIPT",
        reference_id: goodsReceipt.id,
        reason: "Purchase order receipt",
        performed_by: userId,
      });

    if (movementError) {
      throw new Error(movementError.message);
    }
  }

  const { data: allItems, error: allItemsError } =
    await supabaseAdmin
      .from("purchase_order_items")
      .select("ordered_quantity, received_quantity")
      .eq("purchase_order_id", purchaseOrderId);

  if (allItemsError) {
    throw new Error(allItemsError.message);
  }

  const fullyReceived = (allItems ?? []).every(
    (item) =>
      Number(item.received_quantity) >=
      Number(item.ordered_quantity)
  );

  const partiallyReceived = (allItems ?? []).some(
    (item) => Number(item.received_quantity) > 0
  );

  const newStatus = fullyReceived
    ? "FULLY_RECEIVED"
    : partiallyReceived
      ? "PARTIALLY_RECEIVED"
      : "PENDING";

  const { error: statusError } = await supabaseAdmin
    .from("purchase_orders")
    .update({
      status: newStatus,
    })
    .eq("id", purchaseOrderId);

  if (statusError) {
    throw new Error(statusError.message);
  }

  return {
    receipt: goodsReceipt,
    purchase_order_status: newStatus,
  };
};