import { supabase } from "../../lib/supabaseClient";

function validateAppointmentId(id, action) {
  if (id !== null && id !== undefined && String(id).trim() !== "") {
    return null;
  }

  return {
    data: null,
    error: new Error(`Missing appointment ID for ${action}.`),
  };
}

function validateText(value, label) {
  const text = String(value ?? "").trim();

  if (text) {
    return { value: text, error: null };
  }

  return {
    value: "",
    error: new Error(`Missing appointment ${label}.`),
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
        a?.appointment_date ||
        a?.updated_at
    );

    const bTime = toTimestamp(
      b?.created_at ||
        b?.submitted_at ||
        b?.appointment_date ||
        b?.updated_at
    );

    return bTime - aTime;
  });
}

export async function fetchAppointmentRows() {
  // Fetch first, sort locally.
  // This avoids a missing/renamed created_at column causing the whole Admin view
  // to receive an empty appointments array.
  const { data, error } = await supabase
    .from("appointments")
    .select("*");

  if (error) {
    console.error("Appointment rows fetch failed:", error);
    return { data: null, error };
  }

  return {
    data: sortNewestFirst(Array.isArray(data) ? data : []),
    error: null,
  };
}

export async function deleteAppointmentRow(id) {
  const validationError = validateAppointmentId(id, "delete");
  if (validationError) return validationError;

  return supabase.from("appointments").delete().eq("id", id);
}

export async function updateAppointmentStatusRow(id, status) {
  const validationError = validateAppointmentId(id, "status update");
  if (validationError) return validationError;

  const validatedStatus = validateText(status, "status");
  if (validatedStatus.error) {
    return { data: null, error: validatedStatus.error };
  }

  return supabase
    .from("appointments")
    .update({ status: validatedStatus.value })
    .eq("id", id);
}

export async function updateAppointmentPriorityRow(id, priority) {
  const validationError = validateAppointmentId(id, "priority update");
  if (validationError) return validationError;

  const validatedPriority = validateText(priority, "priority");
  if (validatedPriority.error) {
    return { data: null, error: validatedPriority.error };
  }

  return supabase
    .from("appointments")
    .update({ priority: validatedPriority.value })
    .eq("id", id);
}

export async function updateAppointmentStageRow(
  id,
  appointmentStage,
  status
) {
  const validationError = validateAppointmentId(id, "pipeline update");
  if (validationError) return validationError;

  const validatedStage = validateText(
    appointmentStage,
    "pipeline stage"
  );
  if (validatedStage.error) {
    return { data: null, error: validatedStage.error };
  }

  const validatedStatus = validateText(status, "status");
  if (validatedStatus.error) {
    return { data: null, error: validatedStatus.error };
  }

  return supabase
    .from("appointments")
    .update({
      appointment_stage: validatedStage.value,
      status: validatedStatus.value,
    })
    .eq("id", id);
}