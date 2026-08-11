// src/services/gptOutputStore.js
// Zaifan GPT Workspace permanent output storage + emergency browser recovery.

import { supabase } from "../lib/supabaseClient";

const TABLE = "student_gpt_outputs";
const DEFAULT_LIMIT = 24;
const RECOVERY_PREFIX = "zaifan:gpt-output-recovery:v1";

function cleanText(value = "") {
  return String(value ?? "").trim();
}

function normalizeStudentType(value = "inquiry") {
  return cleanText(value || "inquiry").toLowerCase() || "inquiry";
}

function normalizeSavedRow(row = {}) {
  return {
    id: row.id,
    studentId: String(row.student_id ?? ""),
    studentType: normalizeStudentType(row.student_type),
    mode: cleanText(row.mode, "summary") || "summary",
    label: cleanText(row.label, "GPT Output") || "GPT Output",
    output: cleanText(row.output),
    generatedAt: row.generated_at || row.created_at || null,
    savedAt: row.created_at
      ? new Date(row.created_at).toLocaleString()
      : new Date().toLocaleString(),
    savedAtIso: row.created_at || null,
    savedByName: row.saved_by_name || "",
    savedByEmail: row.saved_by_email || "",
    metadata:
      row.metadata && typeof row.metadata === "object" && !Array.isArray(row.metadata)
        ? row.metadata
        : {},
    persisted: true,
  };
}

function parseJsonOutput(output) {
  const raw = cleanText(output);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? parsed
      : null;
  } catch {
    return null;
  }
}

function getRecoveryKey({ studentId, studentType }) {
  return `${RECOVERY_PREFIX}:${normalizeStudentType(studentType)}:${String(
    studentId || "unknown"
  )}`;
}

function explainStoreError(error, fallback) {
  const message =
    error?.message ||
    error?.details ||
    error?.hint ||
    fallback ||
    "GPT output storage failed.";

  const lower = String(message).toLowerCase();

  if (
    lower.includes("student_gpt_outputs") &&
    (lower.includes("does not exist") ||
      lower.includes("schema cache") ||
      lower.includes("relation"))
  ) {
    return new Error(
      "Permanent GPT storage is not installed yet. Run the supplied student_gpt_outputs migration once, then save again. Your browser recovery copy remains safe."
    );
  }

  if (
    lower.includes("row-level security") ||
    lower.includes("permission") ||
    lower.includes("not authorized") ||
    lower.includes("jwt")
  ) {
    return new Error(
      "Permanent GPT storage was blocked by Supabase authentication/RLS. Your browser recovery copy remains safe."
    );
  }

  return new Error(String(message));
}

export function backupGptOutputLocally({
  studentId,
  studentType = "inquiry",
  mode = "summary",
  label = "GPT Output",
  output,
  generatedAt = null,
} = {}) {
  const cleanOutput = cleanText(output);
  if (!cleanOutput || typeof window === "undefined") return false;

  try {
    const key = getRecoveryKey({ studentId, studentType });

    window.localStorage.setItem(
      key,
      JSON.stringify({
        version: 1,
        studentId: String(studentId || ""),
        studentType: normalizeStudentType(studentType),
        mode: cleanText(mode) || "summary",
        label: cleanText(label) || "GPT Output",
        output: cleanOutput,
        generatedAt: generatedAt || new Date().toISOString(),
        recoveredAt: new Date().toISOString(),
      })
    );

    return true;
  } catch (error) {
    console.warn("GPT browser recovery backup failed:", error);
    return false;
  }
}

export function readGptOutputRecovery({
  studentId,
  studentType = "inquiry",
} = {}) {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(
      getRecoveryKey({ studentId, studentType })
    );

    if (!raw) return null;

    const parsed = JSON.parse(raw);
    const output = cleanText(parsed?.output);

    if (!output) return null;

    return {
      id: "browser-recovery",
      mode: cleanText(parsed?.mode) || "summary",
      label: cleanText(parsed?.label) || "Recovered GPT Output",
      output,
      generatedAt: parsed?.generatedAt || parsed?.recoveredAt || null,
      savedAt: parsed?.recoveredAt
        ? new Date(parsed.recoveredAt).toLocaleString()
        : "Browser recovery",
      persisted: false,
      recovery: true,
    };
  } catch (error) {
    console.warn("GPT browser recovery read failed:", error);
    return null;
  }
}

export function clearGptOutputRecovery({
  studentId,
  studentType = "inquiry",
} = {}) {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.removeItem(
      getRecoveryKey({ studentId, studentType })
    );
  } catch {
    // Recovery cleanup must never break the workspace.
  }
}

export async function listStudentGptOutputs({
  studentId,
  studentType = "inquiry",
  limit = DEFAULT_LIMIT,
} = {}) {
  const id = String(studentId || "").trim();
  if (!id) return [];

  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .eq("student_id", id)
    .eq("student_type", normalizeStudentType(studentType))
    .order("created_at", { ascending: false })
    .limit(Math.max(1, Math.min(Number(limit) || DEFAULT_LIMIT, 100)));

  if (error) throw explainStoreError(error, "Saved GPT outputs could not load.");

  return Array.isArray(data) ? data.map(normalizeSavedRow) : [];
}

export async function saveStudentGptOutput({
  studentId,
  studentType = "inquiry",
  mode = "summary",
  label = "GPT Output",
  output,
  generatedAt = null,
  adminProfile = null,
  metadata = {},
} = {}) {
  const id = String(studentId || "").trim();
  const cleanOutput = cleanText(output);

  if (!id) throw new Error("Student ID is missing. GPT output cannot be saved permanently.");
  if (!cleanOutput) throw new Error("There is no GPT output to save.");

  const normalizedType = normalizeStudentType(studentType);
  const cleanMode = cleanText(mode) || "summary";

  // Duplicate guard: do not create another row for the same exact paid output.
  const { data: recent, error: recentError } = await supabase
    .from(TABLE)
    .select("*")
    .eq("student_id", id)
    .eq("student_type", normalizedType)
    .eq("mode", cleanMode)
    .order("created_at", { ascending: false })
    .limit(12);

  if (recentError) {
    throw explainStoreError(recentError, "Saved GPT output duplicate check failed.");
  }

  const duplicate = (recent || []).find(
    (row) => cleanText(row?.output) === cleanOutput
  );

  if (duplicate) {
    return {
      ...normalizeSavedRow(duplicate),
      duplicate: true,
    };
  }

  const payload = {
    student_id: id,
    student_type: normalizedType,
    mode: cleanMode,
    label: cleanText(label) || "GPT Output",
    output: cleanOutput,
    output_json: parseJsonOutput(cleanOutput),
    generated_at: generatedAt || new Date().toISOString(),
    saved_by_name:
      adminProfile?.full_name ||
      adminProfile?.name ||
      adminProfile?.displayName ||
      "Zaifan Staff",
    saved_by_email:
      adminProfile?.email ||
      adminProfile?.user_email ||
      null,
    metadata: {
      ...(
        metadata && typeof metadata === "object" && !Array.isArray(metadata)
          ? metadata
          : {}
      ),
      source: "gpt_workspace",
      saved_from: "StudentDetailModal",
    },
  };

  const { data, error } = await supabase
    .from(TABLE)
    .insert(payload)
    .select("*")
    .single();

  if (error) throw explainStoreError(error, "GPT output could not be saved.");

  return normalizeSavedRow(data || payload);
}

export async function deleteStudentGptOutput(id) {
  const cleanId = String(id || "").trim();
  if (!cleanId) return false;

  const { error } = await supabase
    .from(TABLE)
    .delete()
    .eq("id", cleanId);

  if (error) throw explainStoreError(error, "Saved GPT output could not be deleted.");

  return true;
}
