export function buildReminderNotifications(reminders = []) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return reminders
    .filter((reminder) => reminder.status !== "completed")
    .map((reminder) => {
      const dueDate = reminder.due_date ? new Date(reminder.due_date) : null;

      if (dueDate) {
        dueDate.setHours(0, 0, 0, 0);
      }

      const isOverdue = dueDate && dueDate < today;
      const isToday = dueDate && dueDate.getTime() === today.getTime();

      return {
        id: `reminder-${reminder.id}`,
        type: isOverdue ? "overdue_reminder" : "follow_up_reminder",
        title: isOverdue ? "Overdue follow-up" : "Follow-up reminder",
        message:
          reminder.title ||
          reminder.note ||
          "A student follow-up needs attention.",
        priority: isOverdue ? "high" : isToday ? "medium" : "normal",
        createdAt: reminder.created_at || reminder.due_date || new Date().toISOString(),
        studentId: reminder.student_id,
        studentType: reminder.student_type,
        raw: reminder,
      };
    });
}

export function buildAppointmentNotifications(appointments = []) {
  const today = new Date().toISOString().slice(0, 10);

  return appointments
    .filter((appointment) => appointment.date === today)
    .map((appointment) => ({
      id: `appointment-${appointment.id}`,
      type: "appointment_today",
      title: "Appointment today",
      message: `${appointment.name || "Student"} has an appointment today.`,
      priority: "medium",
      createdAt: appointment.created_at || new Date().toISOString(),
      studentId: appointment.id,
      studentType: "appointment",
      raw: appointment,
    }));
}

export function buildLeadNotifications(inquiries = [], appointments = []) {
  const inquiryNotifications = inquiries
    .filter((lead) => lead.priority === "vip" || lead.priority === "high")
    .map((lead) => ({
      id: `lead-inquiry-${lead.id}`,
      type: "priority_lead",
      title: "High priority inquiry",
      message: `${lead.name || "A student"} is marked as ${lead.priority?.toUpperCase()}.`,
      priority: lead.priority === "vip" ? "urgent" : "high",
      createdAt: lead.created_at || new Date().toISOString(),
      studentId: lead.id,
      studentType: "inquiry",
      raw: lead,
    }));

  const appointmentNotifications = appointments
    .filter((lead) => lead.priority === "vip" || lead.priority === "high")
    .map((lead) => ({
      id: `lead-appointment-${lead.id}`,
      type: "priority_appointment",
      title: "High priority appointment",
      message: `${lead.name || "A student"} is marked as ${lead.priority?.toUpperCase()}.`,
      priority: lead.priority === "vip" ? "urgent" : "high",
      createdAt: lead.created_at || new Date().toISOString(),
      studentId: lead.id,
      studentType: "appointment",
      raw: lead,
    }));

  return [...inquiryNotifications, ...appointmentNotifications];
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

  return notifications.sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
  );
}