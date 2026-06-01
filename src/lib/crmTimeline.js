import { supabase } from "./supabaseClient";

const REQUEST_TIMEOUT_MS = 12000;

async function withTimeout(promise, message = "Request timed out.") {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error(message)), REQUEST_TIMEOUT_MS)
    ),
  ]);
}

export async function addTimelineEvent({
  studentId,
  studentType,
  actionType,
  title,
  description = "",
  oldValue = "",
  newValue = "",
  adminProfile = null,
  metadata = {},
}) {
  if (!studentId || !studentType || !actionType || !title) {
    console.warn("Timeline event skipped: missing required fields.");
    return { data: null, error: null };
  }

  const payload = {
    student_id: String(studentId),
    student_type: studentType,
    action_type: actionType,
    title,
    description,
    old_value: oldValue,
    new_value: newValue,
    created_by: adminProfile?.id || null,
    created_by_name:
      adminProfile?.full_name ||
      adminProfile?.email ||
      adminProfile?.role ||
      "Admin",
    metadata,
  };

  try {
    const { data, error } = await withTimeout(
      supabase.from("crm_timeline").insert(payload).select().single(),
      "Timeline save timed out."
    );

    if (error) {
      console.error("Failed to add timeline event:", error);
    }

    return { data, error };
  } catch (error) {
    console.error("Timeline save crashed:", error);
    return { data: null, error };
  }
}

export async function fetchTimelineEvents(studentId, studentType) {
  if (!studentId || !studentType) {
    return { data: [], error: null };
  }

  try {
    const { data, error } = await withTimeout(
      supabase
        .from("crm_timeline")
        .select("*")
        .eq("student_id", String(studentId))
        .eq("student_type", studentType)
        .order("created_at", { ascending: false }),
      "CRM timeline loading timed out."
    );

    if (error) {
      console.error("Failed to fetch timeline events:", error);
    }

    return { data: data || [], error };
  } catch (error) {
    console.error("Timeline load crashed:", error);
    return { data: [], error };
  }
}