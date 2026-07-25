import { supabase } from "../../lib/supabaseClient";

function missingIdError(action) {
  return {
    data: null,
    error: new Error(`Missing inquiry ID for ${action}.`),
  };
}

export async function fetchInquiryRows() {
  return supabase
    .from("inquiries")
    .select("*")
    .order("created_at", { ascending: false });
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
