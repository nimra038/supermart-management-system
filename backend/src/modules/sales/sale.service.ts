import { supabaseAdmin } from "../../config/supabase.js";
import { getProductStock } from "../inventory/inventory.service.js";

type SaleItemInput = {
  product_id: string;
  quantity: number;
  unit_price: number;
  discount_amount: number;
};

type PaymentInput = {
  payment_method: "CASH" | "CARD" | "EASYPAISA" | "JAZZCASH";
  amount: number;
  reference_number?: string | null;
};

type CreateSaleInput = {
  customer_id?: string | null;
  discount_amount: number;
  tax_amount: number;
  notes?: string;
  items: SaleItemInput[];
  payments: PaymentInput[];
};

export const createSale = async (
  businessId: string,
  cashierUserId: string,
  payload: CreateSaleInput
) => {
  const invoiceNumber = `INV-${Date.now()}`;

  let subtotal = 0;

  const saleItemsData = [];

  for (const item of payload.items) {
    const { data: product, error: productError } = await supabaseAdmin
      .from("products")
      .select("id, name, cost_price, is_active")
      .eq("id", item.product_id)
      .eq("business_id", businessId)
      .single();

    if (productError || !product) {
      throw new Error(`Product not found: ${item.product_id}`);
    }

    if (!product.is_active) {
      throw new Error(`Product is inactive: ${product.name}`);
    }

    const currentStock = await getProductStock(
      businessId,
      item.product_id
    );

    if (currentStock < item.quantity) {
      throw new Error(
        `Insufficient stock for ${product.name}. Available: ${currentStock}, requested: ${item.quantity}`
      );
    }

    const lineSubtotal = item.unit_price * item.quantity;

    if (item.discount_amount > lineSubtotal) {
      throw new Error(
        `Discount exceeds line total for ${product.name}`
      );
    }

    const lineTotal =
      lineSubtotal - item.discount_amount;

    subtotal += lineTotal;

    saleItemsData.push({
      product_id: item.product_id,
      product_name: product.name,
      quantity: item.quantity,
      unit_price: item.unit_price,
      unit_cost: Number(product.cost_price),
      discount_amount: item.discount_amount,
      line_total: lineTotal,
    });
  }

  const totalAmount =
    subtotal -
    payload.discount_amount +
    payload.tax_amount;

  if (totalAmount < 0) {
    throw new Error("Sale total cannot be negative");
  }

  const paymentTotal = payload.payments.reduce(
    (total, payment) => total + payment.amount,
    0
  );

  if (paymentTotal < totalAmount) {
    throw new Error(
      `Insufficient payment. Required: ${totalAmount}, received: ${paymentTotal}`
    );
  }

  const { data: sale, error: saleError } = await supabaseAdmin
    .from("sales")
    .insert({
      business_id: businessId,
      customer_id: payload.customer_id ?? null,
      cashier_user_id: cashierUserId,
      invoice_number: invoiceNumber,
      status: "COMPLETED",
      subtotal,
      discount_amount: payload.discount_amount,
      tax_amount: payload.tax_amount,
      total_amount: totalAmount,
      notes: payload.notes ?? null,
    })
    .select("*")
    .single();

  if (saleError) {
    throw new Error(saleError.message);
  }

  const saleItems = saleItemsData.map((item) => ({
    sale_id: sale.id,
    ...item,
  }));

  const { data: insertedItems, error: itemsError } =
    await supabaseAdmin
      .from("sale_items")
      .insert(saleItems)
      .select("*");

  if (itemsError) {
    throw new Error(itemsError.message);
  }

  const payments = payload.payments.map((payment) => ({
    sale_id: sale.id,
    payment_method: payment.payment_method,
    amount: payment.amount,
    reference_number: payment.reference_number ?? null,
  }));

  const { data: insertedPayments, error: paymentsError } =
    await supabaseAdmin
      .from("payments")
      .insert(payments)
      .select("*");

  if (paymentsError) {
    throw new Error(paymentsError.message);
  }

  for (const item of payload.items) {
    const { error: movementError } = await supabaseAdmin
      .from("inventory_movements")
      .insert({
        business_id: businessId,
        product_id: item.product_id,
        movement_type: "SALE",
        quantity_change: -Math.abs(item.quantity),
        reference_type: "SALE",
        reference_id: sale.id,
        reason: "POS sale",
        performed_by: cashierUserId,
      });

    if (movementError) {
      throw new Error(movementError.message);
    }
  }

  return {
    sale,
    items: insertedItems ?? [],
    payments: insertedPayments ?? [],
    payment_total: paymentTotal,
    change_due: paymentTotal - totalAmount,
  };
};