export const inquiryStages = [
  { key: "new", label: "New Lead", icon: "✨" },
  { key: "contacted", label: "Contacted", icon: "📞" },
  { key: "documents_pending", label: "Documents Pending", icon: "📄" },
  { key: "applied", label: "Applied", icon: "🎓" },
  { key: "offer_letter", label: "Offer Letter", icon: "📬" },
  { key: "visa_process", label: "Visa Process", icon: "🛂" },
  { key: "approved", label: "Approved", icon: "✅" },
];

export const appointmentStages = [
  { key: "new_booking", label: "New Booking", icon: "📥" },
  { key: "confirmed", label: "Confirmed", icon: "✅" },
  { key: "consultation_done", label: "Consultation Done", icon: "🎓" },
  { key: "follow_up_needed", label: "Follow-up Needed", icon: "⏰" },
  { key: "converted_to_lead", label: "Converted to Lead", icon: "🚀" },
  { key: "not_interested", label: "Not Interested", icon: "🧊" },
  { key: "cancelled", label: "Cancelled", icon: "❌" },
];

export const priorityOptions = [
  { key: "vip", label: "VIP", icon: "👑" },
  { key: "high", label: "High", icon: "🔥" },
  { key: "medium", label: "Medium", icon: "⭐" },
  { key: "low", label: "Low", icon: "🌙" },
];

export const appointmentStageToStatus = {
  new_booking: "pending",
  confirmed: "confirmed",
  consultation_done: "completed",
  follow_up_needed: "pending",
  converted_to_lead: "completed",
  not_interested: "completed",
  cancelled: "cancelled",
};

export const legacyAppointmentStatusToStage = {
  pending: "new_booking",
  confirmed: "confirmed",
  completed: "consultation_done",
  cancelled: "cancelled",
};

export function getPipelineStage(stages, key, fallbackKey) {
  return (
    stages.find((stage) => stage.key === key) ||
    stages.find((stage) => stage.key === fallbackKey) ||
    stages[0]
  );
}