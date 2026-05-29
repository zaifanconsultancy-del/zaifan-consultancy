import { supabase } from "../../lib/supabaseClient";

export async function createActivityLogRow({
  adminId,
  adminName,
  action,
  targetType,
  targetId,
  details,
}) {
  return supabase.from("activity_logs").insert({
    admin_id: adminId || null,
    admin_name: adminName || "Unknown Admin",
    action,
    target_type: targetType,
    target_id: String(targetId || ""),
    details,
  });
}