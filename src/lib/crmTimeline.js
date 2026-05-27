import { supabase } from "./supabaseClient";

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

  const { data, error } = await supabase
    .from("crm_timeline")
    .insert(payload)
    .select()
    .single();

  if (error) {
    console.error("Failed to add timeline event:", error);
  }

  return { data, error };
}

export async function fetchTimelineEvents(studentId, studentType) {
  if (!studentId || !studentType) {
    return { data: [], error: null };
  }

  const { data, error } = await supabase
    .from("crm_timeline")
    .select("*")
    .eq("student_id", String(studentId))
.eq("student_type", studentType)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Failed to fetch timeline events:", error);
  }

  return { data: data || [], error };
}