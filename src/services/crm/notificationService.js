import { supabase } from "../../lib/supabaseClient";

function validateNotificationId(id, action) {
  if (id !== null && id !== undefined && String(id).trim() !== "") {
    return null;
  }

  return {
    data: null,
    error: new Error(`Missing notification ID for ${action}.`),
  };
}

export async function fetchNotificationRows() {
  return supabase
    .from("notifications")
    .select("*")
    .order("created_at", { ascending: false });
}

export async function markNotificationRead(id) {
  const validationError = validateNotificationId(id, "mark read");
  if (validationError) return validationError;

  return supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("id", id);
}

export async function deleteNotificationRow(id) {
  const validationError = validateNotificationId(id, "delete");
  if (validationError) return validationError;

  return supabase
    .from("notifications")
    .delete()
    .eq("id", id);
}
