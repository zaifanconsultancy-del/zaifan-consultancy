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
  const normalizedStudentId = cleanText(studentId);
  const normalizedStudentType = normalizeStudentType(studentType);
  const normalizedActionType = cleanText(actionType);
  const normalizedTitle = cleanText(title);

  if (
    !normalizedStudentId ||
    !normalizedStudentType ||
    !normalizedActionType ||
    !normalizedTitle
  ) {
    console.warn("Timeline event skipped: missing required fields.");
    return { data: null, error: null };
  }

  const payload = {
    student_id: normalizedStudentId,
    student_type: normalizedStudentType,
    action_type: normalizedActionType,
    title: normalizedTitle,
    description: cleanText(description),
    old_value: cleanText(oldValue),
    new_value: cleanText(newValue),
    created_by: adminProfile?.id || null,
    created_by_name:
      adminProfile?.full_name ||
      adminProfile?.email ||
      adminProfile?.role ||
      "Admin",
    metadata:
      metadata && typeof metadata === "object" && !Array.isArray(metadata)
        ? metadata
        : {},
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
  const normalizedStudentId = cleanText(studentId);
  const normalizedStudentType = normalizeStudentType(studentType);

  if (!normalizedStudentId || !normalizedStudentType) {
    return { data: [], error: null };
  }

  try {
    const { data, error } = await withTimeout(
      supabase
        .from("crm_timeline")
        .select("*")
        .eq("student_id", normalizedStudentId)
        .eq("student_type", normalizedStudentType)
        .order("created_at", { ascending: false }),
      "CRM timeline loading timed out."
    );

    if (error) {
      console.error("Failed to fetch timeline events:", error);
    }

    return { data: Array.isArray(data) ? data : [], error };
  } catch (error) {
    console.error("Timeline load crashed:", error);
    return { data: [], error };
  }
}
