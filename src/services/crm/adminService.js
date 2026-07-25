import { supabase } from "../../lib/supabaseClient";

export async function fetchAdminRows() {
  return supabase
    .from("admin_profiles")
    .select("*")
    .order("created_at", { ascending: false });
}

export async function updateAdminRole(id, role) {
  if (id === null || id === undefined || String(id).trim() === "") {
    return {
      data: null,
      error: new Error("Missing admin ID for role update."),
    };
  }

  const nextRole = String(role ?? "").trim();

  if (!nextRole) {
    return {
      data: null,
      error: new Error("Missing admin role."),
    };
  }

  return supabase
    .from("admin_profiles")
    .update({ role: nextRole })
    .eq("id", id);
}
