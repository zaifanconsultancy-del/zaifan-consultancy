import { supabase } from "../../lib/supabaseClient";

function cleanText(value = "", fallback = "") {
  const text = String(value ?? "").trim();
  return text || fallback;
}

export async function createActivityLogRow({
  adminId,
  adminName,
  action,
  targetType,
  targetId,
  details,
} = {}) {
  const safeAction = cleanText(action);
  const safeTargetType = cleanText(targetType);

  if (!safeAction || !safeTargetType) {
    return {
      data: null,
      error: new Error(
        "Activity log requires both action and target type."
      ),
    };
  }

  const payload = {
    admin_id: adminId || null,
    admin_name: cleanText(adminName, "Unknown Admin"),
    action: safeAction,
    target_type: safeTargetType,
    target_id:
      targetId === null || targetId === undefined
        ? ""
        : String(targetId).trim(),
    details:
      details === null || details === undefined
        ? ""
        : String(details),
  };

  return supabase.from("activity_logs").insert(payload);
}