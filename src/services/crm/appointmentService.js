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

export async function fetchAppointmentRows() {
  return supabase
    .from("appointments")
    .select("*")
    .order("created_at", { ascending: false });
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