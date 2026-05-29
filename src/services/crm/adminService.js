import { supabase } from "../../lib/supabaseClient";

export async function fetchAdminRows() {
  return supabase
    .from("admin_profiles")
    .select("*")
    .order("created_at", { ascending: false });
}

export async function updateAdminRole(id, role) {
  return supabase
    .from("admin_profiles")
    .update({ role })
    .eq("id", id);
}