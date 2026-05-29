import { supabase } from "../../lib/supabaseClient";

export async function fetchNotificationRows() {
  return supabase
    .from("notifications")
    .select("*")
    .order("created_at", { ascending: false });
}

export async function markNotificationRead(id) {
  return supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("id", id);
}

export async function deleteNotificationRow(id) {
  return supabase
    .from("notifications")
    .delete()
    .eq("id", id);
}