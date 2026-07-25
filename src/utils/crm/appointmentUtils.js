export const appointmentStageToStatus = Object.freeze({
  new_booking: "pending",
  confirmed: "confirmed",
  consultation_done: "completed",
  follow_up_needed: "pending",
  converted_to_lead: "completed",
  not_interested: "completed",
  cancelled: "cancelled",
});

function normalizeStage(stage = "") {
  return String(stage ?? "")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");
}

export function getStatusFromAppointmentStage(stage) {
  return appointmentStageToStatus[normalizeStage(stage)] || "pending";
}