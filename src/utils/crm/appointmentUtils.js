export const appointmentStageToStatus = {
  new_booking: "pending",
  confirmed: "confirmed",
  consultation_done: "completed",
  follow_up_needed: "pending",
  converted_to_lead: "completed",
  not_interested: "completed",
  cancelled: "cancelled",
};

export function getStatusFromAppointmentStage(stage) {
  return appointmentStageToStatus[stage] || "pending";
}