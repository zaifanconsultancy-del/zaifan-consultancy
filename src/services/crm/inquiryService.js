import { supabase } from "../../lib/supabaseClient";

function missingIdError(action) {
  return {
    data: null,
    error: new Error(`Missing inquiry ID for ${action}.`),
  };
}

function toTimestamp(value) {
  if (!value) return 0;

  const timestamp = new Date(value).getTime();
  return Number.isFinite(timestamp) ? timestamp : 0;
}

function sortNewestFirst(rows = []) {
  return [...rows].sort((a, b) => {
    const aTime = toTimestamp(
      a?.created_at ||
        a?.submitted_at ||
        a?.updated_at
    );

    const bTime = toTimestamp(
      b?.created_at ||
        b?.submitted_at ||
        b?.updated_at
    );

    return bTime - aTime;
  });
}

export async function fetchInquiryRows() {
  // Fetch first, sort locally.
  // This avoids turning a missing/renamed timestamp column into an empty Admin CRM.
  const { data, error } = await supabase
    .from("inquiries")
    .select("*");

  if (error) {
    console.error("Inquiry rows fetch failed:", error);
    return { data: null, error };
  }

  return {
    data: sortNewestFirst(Array.isArray(data) ? data : []),
    error: null,
  };
}

export async function deleteInquiryRow(id) {
  if (id === null || id === undefined || String(id).trim() === "") {
    return missingIdError("delete");
  }

  return supabase.from("inquiries").delete().eq("id", id);
}

export async function updateInquiryStatusRow(id, status) {
  if (id === null || id === undefined || String(id).trim() === "") {
    return missingIdError("status update");
  }

  const nextStatus = String(status ?? "").trim();

  if (!nextStatus) {
    return {
      data: null,
      error: new Error("Missing inquiry status."),
    };
  }

  return supabase
    .from("inquiries")
    .update({ status: nextStatus })
    .eq("id", id);
}

export async function updateInquiryPriorityRow(id, priority) {
  if (id === null || id === undefined || String(id).trim() === "") {
    return missingIdError("priority update");
  }

  const nextPriority = String(priority ?? "").trim();

  if (!nextPriority) {
    return {
      data: null,
      error: new Error("Missing inquiry priority."),
    };
  }

  return supabase
    .from("inquiries")
    .update({ priority: nextPriority })
    .eq("id", id);
}