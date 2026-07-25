import { supabase } from "./supabaseClient";

const REQUEST_TIMEOUT_MS = 12000;

async function withTimeout(promise, message = "Request timed out.") {
  let timer;

  const timeoutPromise = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error(message)), REQUEST_TIMEOUT_MS);
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    clearTimeout(timer);
  }
}

function cleanText(value = "") {
  return String(value ?? "").trim();
}

function normalizeStudentType(value = "") {
  return cleanText(value).toLowerCase();
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
  const normalizedStudentId = cleanText(studentId);
  const normalizedStudentType = normalizeStudentType(studentType);
  const normalizedTitle = cleanText(title);
  const normalizedDueDate = cleanText(dueDate);

  if (
    !normalizedStudentId ||
    !normalizedStudentType ||
    !normalizedTitle ||
    !normalizedDueDate
  ) {
    return { data: null, error: new Error("Missing reminder fields") };
  }

  const payload = {
    student_id: normalizedStudentId,
    student_type: normalizedStudentType,
    title: normalizedTitle,
    notes: cleanText(notes),
    due_date: normalizedDueDate,
    due_time: dueTime || null,
    created_by: adminProfile?.id || null,
    created_by_name:
      adminProfile?.full_name ||
      adminProfile?.email ||
      adminProfile?.role ||
      "Admin",
  };

  try {
    const { data, error } = await withTimeout(
      supabase
        .from("follow_up_reminders")
        .insert(payload)
        .select()
        .single(),
      "Create reminder timed out."
    );

    return { data: data || payload, error };
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
        .eq("student_id", cleanText(studentId))
        .eq("student_type", normalizeStudentType(studentType))
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