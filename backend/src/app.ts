import express from "express";
import cors from "cors";
import helmet from "helmet";
import { supabase } from "./config/supabase.js";

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "Supermart API is running",
  });
});

app.get("/api/supabase-health", async (_req, res) => {
  try {
    const { error } = await supabase.auth.getSession();

    if (error) {
      throw error;
    }

    res.status(200).json({
      success: true,
      message: "Supabase connection is working",
    });
  } catch {
    res.status(500).json({
      success: false,
      message: "Supabase connection failed",
    });
  }
});

export default app;