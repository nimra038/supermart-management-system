import { z } from "zod";

export const createReturnSchema = z.object({
  sale_id: z.string().uuid(),
  reason: z.string().optional(),

  items: z
    .array(
      z.object({
        sale_item_id: z.string().uuid(),
        quantity: z.number().positive(),
        condition: z.enum([
          "RESTOCKABLE",
          "DAMAGED",
        ]),
      })
    )
    .min(1, "At least one return item is required"),
});