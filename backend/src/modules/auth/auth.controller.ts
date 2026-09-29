import type { Request, Response } from "express";
import type { AuthenticatedRequest } from "../../middleware/auth.middleware.js";
import { getUserProfile, loginUser } from "./auth.service.js";

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Email and password are required",
        },
      });
    }

    const data = await loginUser(email, password);

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Login failed";

    return res.status(401).json({
      success: false,
      error: {
        code: "LOGIN_FAILED",
        message,
      },
    });
  }
};

export const getMe = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    if (!req.authUser) {
      return res.status(401).json({
        success: false,
        error: {
          code: "UNAUTHORIZED",
          message: "Authenticated user not found",
        },
      });
    }

    const profile = await getUserProfile(req.authUser.id);

    return res.status(200).json({
      success: true,
      data: {
        auth: req.authUser,
        profile,
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load user profile";

    return res.status(500).json({
      success: false,
      error: {
        code: "PROFILE_LOAD_FAILED",
        message,
      },
    });
  }
};