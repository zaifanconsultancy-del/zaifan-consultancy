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

  try {
    const { error } = await withTimeout(
  supabase.from("follow_up_reminders").insert(payload),
  "Create reminder timed out."
);

return { data: payload, error };
  } catch (error) {
    return { data: null, error };
  }
}

export async function fetchFollowUpReminders(studentId, studentType) {
  if (!studentId || !studentType) {
    return { data: [], error: null };
  }

  try {
    return await withTimeout(
      supabase
        .from("follow_up_reminders")
        .select("*")
        .eq("student_id", String(studentId))
        .eq("student_type", studentType)
        .order("due_date", { ascending: true })
        .order("due_time", { ascending: true }),
      "Follow-up reminders loading timed out."
    );
  } catch (error) {
    return { data: [], error };
  }
}

export async function updateFollowUpReminderStatus(reminderId, status) {
  if (!reminderId || !status) {
    return { data: null, error: new Error("Missing reminder status fields") };
  }

  const payload = {
    status,
    completed_at: status === "done" ? new Date().toISOString() : null,
  };

  try {
    return await withTimeout(
      supabase
        .from("follow_up_reminders")
        .update(payload)
        .eq("id", reminderId)
        .select()
        .single(),
      "Reminder status update timed out."
    );
  } catch (error) {
    return { data: null, error };
  }
}

export async function deleteFollowUpReminder(reminderId) {
  if (!reminderId) {
    return { data: null, error: new Error("Missing reminder ID") };
  }

  try {
    return await withTimeout(
      supabase.from("follow_up_reminders").delete().eq("id", reminderId),
      "Reminder delete timed out."
    );
  } catch (error) {
    return { data: null, error };
  }
}