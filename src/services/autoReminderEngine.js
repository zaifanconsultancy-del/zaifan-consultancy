export function buildAutoReminderSuggestions({ inquiries = [], appointments = [] } = {}) {
  const suggestions = [];

  inquiries.forEach((lead) => {
    const status = lead.status || "new";

    if (status === "new" || status === "contacted") {
      suggestions.push({
        id: `auto-reminder-inquiry-${lead.id}`,
        studentId: lead.id,
        studentType: "inquiry",
        title: `Follow up with ${lead.full_name || "student"}`,
        note: `Auto suggestion: ${lead.full_name || "This student"} should be followed up because their inquiry is still ${status}.`,
        dueInDays: status === "new" ? 1 : 2,
        priority: lead.priority || "medium",
      });
    }
  });

  appointments.forEach((lead) => {
    const status = lead.status || "pending";

    if (status === "pending" || status === "confirmed") {
      suggestions.push({
        id: `auto-reminder-appointment-${lead.id}`,
        studentId: lead.id,
        studentType: "appointment",
        title: `Follow up appointment with ${lead.full_name || "student"}`,
        note: `Auto suggestion: ${lead.full_name || "This student"} has appointment status ${status}.`,
        dueInDays: status === "pending" ? 1 : 3,
        priority: lead.priority || "medium",
      });
    }
  });

  return suggestions;
}