import { z } from "zod";

export const createPurchaseOrderSchema = z.object({
  supplier_id: z.string().uuid(),

  expected_delivery_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .nullable()
    .optional(),

  notes: z.string().optional(),

  items: z
    .array(
      z.object({
        product_id: z.string().uuid(),
        ordered_quantity: z.number().positive(),
        unit_cost: z.number().min(0),
      })
    )
    .min(1, "At least one purchase item is required"),
});

export const purchaseOrderStatusSchema = z.enum([
  "PENDING",
  "PARTIALLY_RECEIVED",
  "FULLY_RECEIVED",
  "CANCELLED",
]);

export const receivePurchaseOrderSchema = z.object({
  notes: z.string().optional(),

  items: z
    .array(
      z.object({
        purchase_order_item_id: z.string().uuid(),
        received_quantity: z.number().positive(),

        batch_number: z.string().nullable().optional(),

        expiry_date: z
          .string()
          .regex(/^\d{4}-\d{2}-\d{2}$/)
          .nullable()
          .optional(),
      })
    )
    .min(1, "At least one received item is required"),
});