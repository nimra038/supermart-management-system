import { z } from "zod";

export const createSaleSchema = z.object({
  customer_id: z.string().uuid().nullable().optional(),

  discount_amount: z.number().min(0).default(0),
  tax_amount: z.number().min(0).default(0),

  notes: z.string().optional(),

  items: z
    .array(
      z.object({
        product_id: z.string().uuid(),
        quantity: z.number().positive(),
        unit_price: z.number().min(0),
        discount_amount: z.number().min(0).default(0),
      })
    )
    .min(1, "At least one sale item is required"),

  payments: z
    .array(
      z.object({
        payment_method: z.enum([
          "CASH",
          "CARD",
          "EASYPAISA",
          "JAZZCASH",
        ]),
        amount: z.number().positive(),
        reference_number: z.string().nullable().optional(),
      })
    )
    .min(1, "At least one payment is required"),
});