export const inquiryStages = [
  {
    id: "new",
    key: "new",
    label: "New Lead",
    icon: "✨",
    description: "Fresh inquiry entered into CRM.",
  },
  {
    id: "contacted",
    key: "contacted",
    label: "Contacted",
    icon: "📞",
    description: "Student has been contacted.",
  },
  {
    id: "documents_pending",
    key: "documents_pending",
    label: "Documents Pending",
    icon: "📄",
    description: "Waiting for student documents.",
  },
  {
    id: "applied",
    key: "applied",
    label: "Applied",
    icon: "🎓",
    description: "Application submitted.",
  },
  {
    id: "offer_letter",
    key: "offer_letter",
    label: "Offer Letter",
    icon: "📬",
    description: "Offer letter received.",
  },
  {
    id: "visa_process",
    key: "visa_process",
    label: "Visa Process",
    icon: "🛂",
    description: "Visa process ongoing.",
  },
  {
    id: "approved",
    key: "approved",
    label: "Approved",
    icon: "✅",
    description: "Student fully approved.",
  },
];

export const appointmentStages = [
  {
    id: "new_booking",
    key: "new_booking",
    label: "New Booking",
    icon: "📥",
    description: "Appointment recently booked.",
  },
  {
    id: "confirmed",
    key: "confirmed",
    label: "Confirmed",
    icon: "✅",
    description: "Appointment confirmed.",
  },
  {
    id: "consultation_done",
    key: "consultation_done",
    label: "Consultation Done",
    icon: "🎓",
    description: "Consultation completed.",
  },
  {
    id: "follow_up_needed",
    key: "follow_up_needed",
    label: "Follow-up Needed",
    icon: "⏰",
    description: "Student requires follow-up.",
  },
  {
    id: "converted_to_lead",
    key: "converted_to_lead",
    label: "Converted to Lead",
    icon: "🚀",
    description: "Appointment converted into inquiry lead.",
  },
  {
    id: "not_interested",
    key: "not_interested",
    label: "Not Interested",
    icon: "🧊",
    description: "Student not interested.",
  },
  {
    id: "cancelled",
    key: "cancelled",
    label: "Cancelled",
    icon: "❌",
    description: "Appointment cancelled.",
  },
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

export function getPipelineStages(type = "inquiry") {
  return type === "appointment"
    ? appointmentStages
    : inquiryStages;
}

export function getPipelineStage(stages, key, fallbackKey) {
  return (
    stages.find((stage) => stage.key === key) ||
    stages.find((stage) => stage.key === fallbackKey) ||
    stages[0]
  );
}

export function getPipelineStageById(type = "inquiry", stageId = "") {
  const stages = getPipelineStages(type);

  return (
    stages.find(
      (stage) =>
        stage.id === stageId || stage.key === stageId
    ) || stages[0]
  );
}

export function getPipelineProgress(type = "inquiry", stageId = "") {
  const stages = getPipelineStages(type);

  if (!stages.length) return 0;

  const index = stages.findIndex(
    (stage) =>
      stage.id === stageId || stage.key === stageId
  );

  if (index === -1) return 0;

  return Math.round(((index + 1) / stages.length) * 100);
}