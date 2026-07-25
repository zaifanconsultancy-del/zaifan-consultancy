const CLOSED_STATUSES = new Set([
  "completed",
  "complete",
  "done",
  "closed",
  "cancelled",
  "canceled",
  "rejected",
  "lost",
  "not_interested",
  "inactive",
]);

function normalize(value = "") {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");
}

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

function getStudentName(lead = {}) {
  return lead.full_name || lead.name || lead.student_name || "student";
}

function getPriority(lead = {}) {
  const priority = normalize(lead.priority || "medium");

  if (priority === "vip") return "vip";
  if (priority === "high") return "high";
  if (priority === "low") return "low";
  return "medium";
}

export function buildAutoReminderSuggestions({
  inquiries = [],
  appointments = [],
} = {}) {
  const suggestions = [];

  for (const lead of safeArray(inquiries)) {
    const status = normalize(lead.status || "new");

    if (CLOSED_STATUSES.has(status)) continue;
    if (status !== "new" && status !== "contacted") continue;

    const studentName = getStudentName(lead);

    suggestions.push({
      id: `auto-reminder-inquiry-${lead.id}`,
      studentId: lead.id,
      studentType: "inquiry",
      title: `Follow up with ${studentName}`,
      note: `Auto suggestion: ${
        studentName === "student" ? "This student" : studentName
      } should be followed up because their inquiry is still ${status}.`,
      dueInDays: status === "new" ? 1 : 2,
      priority: getPriority(lead),
    });
  }

  for (const lead of safeArray(appointments)) {
    const status = normalize(lead.status || "pending");
    const stage = normalize(lead.appointment_stage || "new_booking");

    if (CLOSED_STATUSES.has(status) || CLOSED_STATUSES.has(stage)) continue;

    const shouldSuggest =
      status === "pending" ||
      (status === "confirmed" &&
        !["consultation_done", "converted_to_lead"].includes(stage));

    if (!shouldSuggest) continue;

    const studentName = getStudentName(lead);

    suggestions.push({
      id: `auto-reminder-appointment-${lead.id}`,
      studentId: lead.id,
      studentType: "appointment",
      title: `Follow up appointment with ${studentName}`,
      note: `Auto suggestion: ${
        studentName === "student" ? "This student" : studentName
      } has appointment status ${status}.`,
      dueInDays: status === "pending" ? 1 : 3,
      priority: getPriority(lead),
    });
  }

  return suggestions;
}
