import express from "express";
import cors from "cors";
import helmet from "helmet";
import { supabaseAdmin } from "./config/supabase.js";
import authRoutes from "./modules/auth/auth.routes.js";
import productRoutes from "./modules/products/product.routes.js";
import inventoryRoutes from "./modules/inventory/inventory.routes.js";
import purchaseRoutes from "./modules/purchases/purchase.routes.js";
import saleRoutes from "./modules/sales/sale.routes.js";
import returnRoutes from "./modules/returns/return.routes.js";

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/inventory", inventoryRoutes);
app.use("/api/purchases", purchaseRoutes);
app.use("/api/sales", saleRoutes);
app.use("/api/returns", returnRoutes);

app.get("/api/health", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "Supermart API is running",
  });
});

app.get("/api/supabase-health", async (_req, res) => {
  try {
    const { error } = await supabaseAdmin
      .from("businesses")
      .select("id")
      .limit(1);

    if (error) {
      throw error;
    }

    res.status(200).json({
      success: true,
      message: "Supabase connection is working",
    });
  } catch (error) {
    console.error("Supabase health error:", error);

    res.status(500).json({
      success: false,
      message: "Supabase connection failed",
    });
  }
});

export default app;