import { supabase } from "../../lib/supabaseClient";

export async function fetchAppointmentRows() {
  return supabase
    .from("appointments")
    .select("*")
    .order("created_at", { ascending: false });
}

export async function deleteAppointmentRow(id) {
  return supabase.from("appointments").delete().eq("id", id);
}

export async function updateAppointmentStatusRow(id, status) {
  return supabase.from("appointments").update({ status }).eq("id", id);
}

export async function updateAppointmentPriorityRow(id, priority) {
  return supabase.from("appointments").update({ priority }).eq("id", id);
}

export async function updateAppointmentStageRow(id, appointmentStage, status) {
  return supabase
    .from("appointments")
    .update({
      appointment_stage: appointmentStage,
      status,
    })
    .eq("id", id);
}