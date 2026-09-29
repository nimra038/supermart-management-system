import type { NextFunction, Response } from "express";
import { supabaseAdmin } from "../config/supabase.js";
import type { AuthenticatedRequest } from "./auth.middleware.js";

export const requirePermission = (requiredPermission: string) => {
  return async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) => {
    try {
      if (!req.authUser) {
        return res.status(401).json({
          success: false,
          error: {
            code: "UNAUTHORIZED",
            message: "Authentication is required",
          },
        });
      }

      const { data: user, error: userError } = await supabaseAdmin
        .from("users")
        .select("id, is_active")
        .eq("auth_user_id", req.authUser.id)
        .single();

      if (userError || !user) {
        return res.status(403).json({
          success: false,
          error: {
            code: "USER_PROFILE_NOT_FOUND",
            message: "Application user profile was not found",
          },
        });
      }

      if (!user.is_active) {
        return res.status(403).json({
          success: false,
          error: {
            code: "USER_INACTIVE",
            message: "User account is inactive",
          },
        });
      }

      const { data: userRoles, error: rolesError } = await supabaseAdmin
        .from("user_roles")
        .select(`
          roles (
            role_permissions (
              permissions (
                code
              )
            )
          )
        `)
        .eq("user_id", user.id);

      if (rolesError) {
        throw new Error(rolesError.message);
      }

      const permissions = new Set<string>();

      for (const userRole of userRoles ?? []) {
        const role = userRole.roles as any;

        for (const rolePermission of role?.role_permissions ?? []) {
          const permission = rolePermission.permissions;

          if (permission?.code) {
            permissions.add(permission.code);
          }
        }
      }

      if (!permissions.has(requiredPermission)) {
        return res.status(403).json({
          success: false,
          error: {
            code: "FORBIDDEN",
            message: "You do not have permission to perform this action",
          },
        });
      }

      next();
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Permission check failed";

      return res.status(500).json({
        success: false,
        error: {
          code: "PERMISSION_CHECK_FAILED",
          message,
        },
      });
    }
  };
};