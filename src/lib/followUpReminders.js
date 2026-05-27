import { supabase } from "./supabaseClient";

export async function createFollowUpReminder({
  studentId,
  studentType,
  title,
  notes = "",
  dueDate,
  dueTime = null,
  adminProfile = null,
}) {
  if (!studentId || !studentType || !title || !dueDate) {
    return { data: null, error: new Error("Missing reminder fields") };
  }

  const payload = {
    student_id: String(studentId),
    student_type: studentType,
    title,
    notes,
    due_date: dueDate,
    due_time: dueTime || null,
    created_by: adminProfile?.id || null,
    created_by_name:
      adminProfile?.full_name ||
      adminProfile?.email ||
      adminProfile?.role ||
      "Admin",
  };

  return await supabase
    .from("follow_up_reminders")
    .insert(payload)
    .select()
    .single();
}

export async function fetchFollowUpReminders(studentId, studentType) {
  return await supabase
    .from("follow_up_reminders")
    .select("*")
    .eq("student_id", String(studentId))
    .eq("student_type", studentType)
    .order("due_date", { ascending: true })
    .order("due_time", { ascending: true });
}

export async function updateFollowUpReminderStatus(reminderId, status) {
  const payload = {
    status,
    completed_at: status === "done" ? new Date().toISOString() : null,
  };

  return await supabase
    .from("follow_up_reminders")
    .update(payload)
    .eq("id", reminderId)
    .select()
    .single();
}

export async function deleteFollowUpReminder(reminderId) {
  return await supabase
    .from("follow_up_reminders")
    .delete()
    .eq("id", reminderId);
}