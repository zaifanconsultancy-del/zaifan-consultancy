export function getLeadName(lead = {}) {
  return lead.full_name || lead.name || lead.email || "Unknown student";
}

export function getLeadTypeLabel(type = "") {
  if (type === "appointment") return "Appointment";
  if (type === "inquiry") return "Inquiry";
  return "Lead";
}

export function buildAutomationSuggestions({
  inquiries = [],
  appointments = [],
  reminders = [],
} = {}) {
  const suggestions = [];

  inquiries.forEach((lead) => {
    if ((lead.status || "new") === "new") {
      suggestions.push({
        id: `new-inquiry-${lead.id}`,
        type: "new_lead_followup",
        title: "Follow up with new inquiry",
        message: `${getLeadName(lead)} has not been contacted yet.`,
        priority: lead.priority === "vip" ? "urgent" : "medium",
        studentId: lead.id,
        studentType: "inquiry",
      });
    }
  });

  appointments.forEach((appointment) => {
    if ((appointment.status || "pending") === "pending") {
      suggestions.push({
        id: `pending-appointment-${appointment.id}`,
        type: "confirm_appointment",
        title: "Confirm pending appointment",
        message: `${getLeadName(appointment)} has a pending consultation booking.`,
        priority: appointment.priority === "vip" ? "urgent" : "high",
        studentId: appointment.id,
        studentType: "appointment",
      });
    }
  });

  reminders.forEach((reminder) => {
    if (reminder.status === "completed") return;

    suggestions.push({
      id: `reminder-action-${reminder.id}`,
      type: "followup_reminder",
      title: "Complete follow-up reminder",
      message: reminder.title || reminder.note || "A follow-up reminder needs action.",
      priority: "high",
      studentId: reminder.student_id,
      studentType: reminder.student_type,
    });
  });

  return suggestions;
}