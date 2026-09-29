import { supabaseAuth, supabaseAdmin } from "../../config/supabase.js";

export const loginUser = async (email: string, password: string) => {
  const { data, error } = await supabaseAuth.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    throw new Error(error.message);
  }

  return data;
};

export const getUserProfile = async (authUserId: string) => {
  const { data: user, error: userError } = await supabaseAdmin
    .from("users")
    .select(`
      id,
      auth_user_id,
      business_id,
      full_name,
      phone,
      is_active,
      businesses (
        id,
        name,
        currency,
        is_active
      )
    `)
    .eq("auth_user_id", authUserId)
    .single();

  if (userError) {
    throw new Error(userError.message);
  }

  const { data: userRoles, error: rolesError } = await supabaseAdmin
    .from("user_roles")
    .select(`
      roles (
        id,
        name,
        description
      )
    `)
    .eq("user_id", user.id);

  if (rolesError) {
    throw new Error(rolesError.message);
  }

  return {
    ...user,
    roles: userRoles?.map((item: any) => item.roles) ?? [],
  };
};