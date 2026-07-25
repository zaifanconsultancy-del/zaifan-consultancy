const CLOSED_REMINDER_STATUSES = new Set([
  "completed",
  "complete",
  "done",
  "closed",
  "cancelled",
  "canceled",
]);

function normalize(value = "") {
  return String(value ?? "").trim().toLowerCase().replace(/[\s-]+/g, "_");
}

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

export function getLeadName(lead = {}) {
  return (
    lead.full_name ||
    lead.name ||
    lead.student_name ||
    lead.email ||
    "Unknown student"
  );
}

export function getLeadTypeLabel(type = "") {
  const normalizedType = normalize(type);

  if (normalizedType === "appointment") return "Appointment";
  if (normalizedType === "inquiry") return "Inquiry";
  return "Lead";
}

export function buildAutomationSuggestions({
  inquiries = [],
  appointments = [],
  reminders = [],
} = {}) {
  const suggestions = [];

  for (const lead of safeArray(inquiries)) {
    const status = normalize(lead.status || "new");

    if (status !== "new") continue;

    suggestions.push({
      id: `new-inquiry-${lead.id}`,
      type: "new_lead_followup",
      title: "Follow up with new inquiry",
      message: `${getLeadName(lead)} has not been contacted yet.`,
      priority: normalize(lead.priority) === "vip" ? "urgent" : "medium",
      studentId: lead.id,
      studentType: "inquiry",
    });
  }

  for (const appointment of safeArray(appointments)) {
    const status = normalize(appointment.status || "pending");

    if (status !== "pending") continue;

    suggestions.push({
      id: `pending-appointment-${appointment.id}`,
      type: "confirm_appointment",
      title: "Confirm pending appointment",
      message: `${getLeadName(
        appointment
      )} has a pending consultation booking.`,
      priority:
        normalize(appointment.priority) === "vip" ? "urgent" : "high",
      studentId: appointment.id,
      studentType: "appointment",
    });
  }

  for (const reminder of safeArray(reminders)) {
    const status = normalize(reminder.status);

    if (CLOSED_REMINDER_STATUSES.has(status)) continue;

    suggestions.push({
      id: `reminder-action-${reminder.id}`,
      type: "followup_reminder",
      title: "Complete follow-up reminder",
      message:
        reminder.title ||
        reminder.note ||
        reminder.notes ||
        "A follow-up reminder needs action.",
      priority: "high",
      studentId: reminder.student_id,
      studentType: reminder.student_type,
    });
  }

  return suggestions;
}
