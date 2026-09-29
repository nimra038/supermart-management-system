import { z } from "zod";

export const createProductSchema = z.object({
  name: z.string().min(1, "Product name is required"),
  barcode: z.string().min(1, "Barcode is required"),

  sku: z.string().optional(),

  category_id: z.string().uuid().nullable().optional(),
  brand_id: z.string().uuid().nullable().optional(),

  cost_price: z.number().min(0),
  retail_price: z.number().min(0),
  bulk_price: z.number().min(0).nullable().optional(),

  reorder_level: z.number().min(0).default(0),
  track_expiry: z.boolean().default(false),
  unit: z.string().min(1).default("piece"),
});

export const updateProductSchema = z.object({
  name: z.string().min(1).optional(),
  barcode: z.string().min(1).optional(),

  sku: z.string().optional(),

  category_id: z.string().uuid().nullable().optional(),
  brand_id: z.string().uuid().nullable().optional(),

  cost_price: z.number().min(0).optional(),
  retail_price: z.number().min(0).optional(),
  bulk_price: z.number().min(0).nullable().optional(),

  reorder_level: z.number().min(0).optional(),
  track_expiry: z.boolean().optional(),
  unit: z.string().min(1).optional(),
});