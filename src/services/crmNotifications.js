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

function startOfLocalDayMs(value = new Date()) {
  const date = value instanceof Date ? new Date(value) : new Date(value);

  if (Number.isNaN(date.getTime())) return null;

  date.setHours(0, 0, 0, 0);
  return date.getTime();
}

function getSortTime(value) {
  const time = new Date(value || 0).getTime();
  return Number.isFinite(time) ? time : 0;
}

export function buildReminderNotifications(reminders = []) {
  const now = new Date();
  const nowIso = now.toISOString();
  const todayMs = startOfLocalDayMs(now);
  const notifications = [];

  for (const reminder of safeArray(reminders)) {
    if (CLOSED_REMINDER_STATUSES.has(normalize(reminder.status))) {
      continue;
    }

    const dueDateMs = reminder.due_date
      ? startOfLocalDayMs(reminder.due_date)
      : null;

    const isOverdue = dueDateMs !== null && dueDateMs < todayMs;
    const isToday = dueDateMs !== null && dueDateMs === todayMs;

    notifications.push({
      id: `reminder-${reminder.id}`,
      type: isOverdue ? "overdue_reminder" : "follow_up_reminder",
      title: isOverdue ? "Overdue follow-up" : "Follow-up reminder",
      message:
        reminder.title ||
        reminder.note ||
        reminder.notes ||
        "A student follow-up needs attention.",
      priority: isOverdue ? "high" : isToday ? "medium" : "normal",
      createdAt: reminder.created_at || reminder.due_date || nowIso,
      studentId: reminder.student_id,
      studentType: reminder.student_type,
      raw: reminder,
    });
  }

  return notifications;
}

export function buildAppointmentNotifications(appointments = []) {
  const now = new Date();
  const nowIso = now.toISOString();
  const todayMs = startOfLocalDayMs(now);
  const notifications = [];

  for (const appointment of safeArray(appointments)) {
    const appointmentDate =
      appointment.appointment_date ||
      appointment.date ||
      appointment.preferred_date;

    if (!appointmentDate || startOfLocalDayMs(appointmentDate) !== todayMs) {
      continue;
    }

    notifications.push({
      id: `appointment-${appointment.id}`,
      type: "appointment_today",
      title: "Appointment today",
      message: `${
        appointment.full_name ||
        appointment.name ||
        appointment.student_name ||
        "Student"
      } has an appointment today.`,
      priority: "medium",
      createdAt: appointment.created_at || appointmentDate || nowIso,
      studentId: appointment.id,
      studentType: "appointment",
      raw: appointment,
    });
  }

  return notifications;
}

export function buildLeadNotifications(inquiries = [], appointments = []) {
  const nowIso = new Date().toISOString();
  const notifications = [];

  const appendPriorityLead = (lead, studentType) => {
    const priority = normalize(lead.priority);

    if (priority !== "vip" && priority !== "high") return;

    const isAppointment = studentType === "appointment";

    notifications.push({
      id: `lead-${studentType}-${lead.id}`,
      type: isAppointment ? "priority_appointment" : "priority_lead",
      title: isAppointment
        ? "High priority appointment"
        : "High priority inquiry",
      message: `${
        lead.full_name || lead.name || lead.student_name || "A student"
      } is marked as ${priority.toUpperCase()}.`,
      priority: priority === "vip" ? "urgent" : "high",
      createdAt: lead.created_at || nowIso,
      studentId: lead.id,
      studentType,
      raw: lead,
    });
  };

  for (const lead of safeArray(inquiries)) {
    appendPriorityLead(lead, "inquiry");
  }

  for (const lead of safeArray(appointments)) {
    appendPriorityLead(lead, "appointment");
  }

  return notifications;
}

export function buildCrmNotifications({
  reminders = [],
  inquiries = [],
  appointments = [],
} = {}) {
  const notifications = [
    ...buildReminderNotifications(reminders),
    ...buildAppointmentNotifications(appointments),
    ...buildLeadNotifications(inquiries, appointments),
  ];

  notifications.sort(
    (a, b) => getSortTime(b.createdAt) - getSortTime(a.createdAt)
  );

  return notifications;
}