import { z } from "zod";

export const inventoryAdjustmentSchema = z.object({
  product_id: z.string().uuid(),
  quantity: z.number().positive(),

  movement_type: z.enum([
    "PURCHASE",
    "SALE",
    "RETURN",
    "DAMAGE",
    "WASTAGE",
    "ADJUSTMENT_IN",
    "ADJUSTMENT_OUT",
  ]),

  reason: z.string().min(1).optional(),
  reference_type: z.string().optional(),
  reference_id: z.string().uuid().nullable().optional(),
});