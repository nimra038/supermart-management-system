import type { NextFunction, Request, Response } from "express";
import { supabaseAuth } from "../config/supabase.js";

export interface AuthenticatedRequest extends Request {
  authUser?: {
    id: string;
    email?: string;
  };
}

export const requireAuth = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        error: {
          code: "UNAUTHORIZED",
          message: "Authentication token is required",
        },
      });
    }

    const token = authHeader.substring(7);

    const { data, error } = await supabaseAuth.auth.getUser(token);

    if (error || !data.user) {
      return res.status(401).json({
        success: false,
        error: {
          code: "INVALID_TOKEN",
          message: "Invalid or expired authentication token",
        },
      });
    }

    req.authUser = {
      id: data.user.id,
      email: data.user.email,
    };

    next();
  } catch {
    return res.status(500).json({
      success: false,
      error: {
        code: "AUTH_ERROR",
        message: "Authentication failed",
      },
    });
  }
};