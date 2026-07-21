import { motion } from "framer-motion";
import {
  AlertTriangle,
  BellRing,
  CalendarCheck,
  CheckCircle2,
  Clock3,
  ExternalLink,
  Flame,
  MailCheck,
  ShieldCheck,
  Sparkles,
  UserCheck,
  Zap,
} from "lucide-react";

function NotificationActionCenter({
  cardClass = "",
  inquiries = [],
  appointments = [],
  followUpReminders = [],
  updateInquiryStatus = () => {},
  updateAppointmentStatus = () => {},
  setActiveTab = null,
}) {
  const actions = buildNotificationActions({
    inquiries,
    appointments,
    followUpReminders,
  });

  const topActions = actions.slice(0, 8);
  const urgentActions = actions.filter((item) => item.priority === "urgent");
  const appointmentActions = actions.filter((item) => item.type === "appointment");
  const inquiryActions = actions.filter((item) => item.type === "inquiry");

  const openTab = (tabName) => {
    if (typeof setActiveTab === "function") {
      setActiveTab(tabName);
    }
  };

  const runAction = (action) => {
    if (!action) return;

    if (action.actionType === "mark_contacted") {
      updateInquiryStatus(action.id, "contacted");
      return;
    }

    if (action.actionType === "confirm_appointment") {
      updateAppointmentStatus(action.id, "confirmed");
      return;
    }

    if (action.actionType === "complete_appointment") {
      updateAppointmentStatus(action.id, "completed");
      return;
    }

    if (action.actionType === "open_inquiries") {
      openTab("inquiries");
      return;
    }

    if (action.actionType === "open_appointments") {
      openTab("appointments");
      return;
    }

    if (action.actionType === "open_followups") {
      openTab("followups");
    }
  };

  const metricCards = [
    {
      label: "Smart Actions",
      value: actions.length,
      icon: BellRing,
      color: "text-[#ff4b12]",
      border: "border-[#ff4b12]/20",
      bg: "bg-[#ff4b12]/10",
    },
    {
      label: "Urgent",
      value: urgentActions.length,
      icon: Flame,
      color: "text-red-700",
      border: "border-red-400/20",
      bg: "bg-red-400/10",
    },
    {
      label: "Lead Actions",
      value: inquiryActions.length,
      icon: UserCheck,
      color: "text-blue-700",
      border: "border-blue-400/20",
      bg: "bg-blue-400/10",
    },
    {
      label: "Appointment Actions",
      value: appointmentActions.length,
      icon: CalendarCheck,
      color: "text-emerald-700",
      border: "border-green-400/20",
      bg: "bg-green-400/10",
    },
  ];

  return (
    <section className="space-y-5">
      <div className="relative overflow-hidden rounded-[2rem] border border-[#ff4b12]/15 bg-gradient-to-br from-[#ff4b12]/10 via-white/[0.035] to-black/30 p-5 backdrop-blur-2xl sm:p-6">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,75,18,0.13),transparent_36%)]" />

        <div className="relative flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[#ff4b12]/20 bg-[#ff4b12]/10 px-3 py-1.5">
              <Sparkles className="h-3.5 w-3.5 text-[#ff4b12]" />

              <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-[#ff4b12]">
                Notification Action Center
              </p>
            </div>

            <h2 className="mt-3 text-2xl font-black tracking-tight text-[#071f50] sm:text-3xl">
              Smart CRM Action Queue
            </h2>

            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-[#526178]">
              Converts CRM alerts into action buttons for faster response,
              appointment confirmation, follow-up handling, and lead pipeline
              movement.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:min-w-[560px] xl:grid-cols-4">
            {metricCards.map((metric) => {
              const Icon = metric.icon;

              return (
                <div
                  key={metric.label}
                  className={`rounded-2xl border ${metric.border} ${metric.bg} p-4 backdrop-blur-xl`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#526178]">
                      {metric.label}
                    </p>

                    <Icon className={`h-4 w-4 ${metric.color}`} />
                  </div>

                  <h3 className={`mt-2 text-2xl font-black ${metric.color}`}>
                    {metric.value}
                  </h3>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {topActions.length === 0 ? (
        <div className={`${cardClass} rounded-[2rem] p-8 text-center`}>
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-green-400/20 bg-green-500/10">
            <CheckCircle2 className="h-8 w-8 text-emerald-700" />
          </div>

          <h3 className="mt-4 text-xl font-black text-[#071f50]">
            No urgent actions right now
          </h3>

          <p className="mx-auto mt-2 max-w-xl text-sm leading-relaxed text-[#526178]">
            Your CRM notification queue is clean. New leads, pending
            appointments, and overdue follow-ups will appear here.
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {topActions.map((action, index) => {
            const Icon = action.icon;

            return (
              <motion.div
                key={action.key}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: index * 0.05 }}
                className={`${cardClass} group relative overflow-hidden rounded-[2rem] p-5 transition duration-300 ease-out hover:-translate-y-1 hover:border-orange-200 hover:shadow-[0_22px_55px_rgba(7,31,80,0.10)] sm:p-6`}
              >
                <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-[#ff4b12] to-transparent opacity-0 transition duration-300 group-hover:opacity-100" />

                <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex min-w-0 flex-1 items-start gap-4">
                    <div
                      className={`flex h-13 w-13 shrink-0 items-center justify-center rounded-2xl border p-3 ${getPriorityStyle(
                        action.priority
                      )}`}
                    >
                      <Icon className="h-5 w-5" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`rounded-full border px-3 py-1 text-[9px] font-black uppercase tracking-[0.18em] ${getPriorityBadge(
                            action.priority
                          )}`}
                        >
                          {action.priority}
                        </span>

                        <span className="rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-[9px] font-bold uppercase tracking-[0.18em] text-blue-700">
                          {action.type}
                        </span>

                        <span className="rounded-full border border-orange-100 bg-[#fffaf5] px-3 py-1 text-[9px] font-bold uppercase tracking-[0.18em] text-[#526178]">
                          {action.category}
                        </span>
                      </div>

                      <h3 className="mt-3 text-xl font-black text-[#071f50]">
                        {action.title}
                      </h3>

                      <p className="mt-1 text-sm font-semibold text-[#526178]">
                        {action.name}
                      </p>

                      <p className="mt-3 max-w-4xl text-sm leading-relaxed text-[#526178]">
                        {action.description}
                      </p>
                    </div>
                  </div>

                  <div className="flex shrink-0 flex-col gap-3 lg:w-[220px]">
                    <button
                      type="button"
                      onClick={() => runAction(action)}
                      className="inline-flex items-center justify-center gap-2 rounded-full bg-[#ff4b12] px-5 py-3 text-xs font-black uppercase tracking-[0.16em] text-white shadow-[0_14px_30px_rgba(255,75,18,0.20)] transition duration-300 ease-out hover:-translate-y-1 hover:bg-[#ff642f]"
                    >
                      <Zap className="h-4 w-4" />
                      {action.buttonLabel}
                    </button>

                    <button
                      type="button"
                      onClick={() => openTab(action.type === "appointment" ? "appointments" : action.type === "reminder" ? "followups" : "inquiries")}
                      className="inline-flex items-center justify-center gap-2 rounded-full border border-orange-100 bg-white px-5 py-3 text-xs font-bold uppercase tracking-[0.16em] text-[#071f50] transition duration-300 ease-out hover:-translate-y-1 hover:border-orange-200 hover:bg-[#fff1ea] hover:text-[#ff4b12]"
                    >
                      <ExternalLink className="h-4 w-4" />
                      Open Section
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </section>
  );
}

function buildNotificationActions({ inquiries = [], appointments = [], followUpReminders = [] }) {
  const actions = [];

  inquiries.forEach((inquiry) => {
    const status = String(inquiry.status || "new").toLowerCase();
    const priority = String(inquiry.priority || "low").toLowerCase();

    if (status === "new") {
      actions.push({
        key: `inquiry-new-${inquiry.id}`,
        id: inquiry.id,
        type: "inquiry",
        category: "New Lead",
        priority: priority === "vip" || priority === "high" ? "urgent" : "medium",
        icon: MailCheck,
        title: "New inquiry needs first response",
        name: inquiry.full_name || "Unnamed Student",
        description:
          "This inquiry is still in New stage. Mark it contacted after first WhatsApp, call, or email response.",
        buttonLabel: "Mark Contacted",
        actionType: "mark_contacted",
      });
    }

    if (priority === "vip" || priority === "high") {
      actions.push({
        key: `inquiry-priority-${inquiry.id}`,
        id: inquiry.id,
        type: "inquiry",
        category: "High Priority",
        priority: "urgent",
        icon: Flame,
        title: "High-value lead requires attention",
        name: inquiry.full_name || "Unnamed Student",
        description:
          "This inquiry is marked VIP or High priority. Open the inquiry list and handle it before normal leads.",
        buttonLabel: "Open Leads",
        actionType: "open_inquiries",
      });
    }
  });

  appointments.forEach((appointment) => {
    const status = String(appointment.status || "pending").toLowerCase();
    const priority = String(appointment.priority || "low").toLowerCase();

    if (status === "pending") {
      actions.push({
        key: `appointment-pending-${appointment.id}`,
        id: appointment.id,
        type: "appointment",
        category: "Confirmation",
        priority: priority === "vip" || priority === "high" ? "urgent" : "medium",
        icon: CalendarCheck,
        title: "Pending appointment needs confirmation",
        name: appointment.full_name || "Unnamed Student",
        description:
          "This appointment is still pending. Confirm it after verifying date and time with the student.",
        buttonLabel: "Confirm",
        actionType: "confirm_appointment",
      });
    }

    if (status === "confirmed") {
      actions.push({
        key: `appointment-confirmed-${appointment.id}`,
        id: appointment.id,
        type: "appointment",
        category: "Consultation",
        priority: "low",
        icon: ShieldCheck,
        title: "Confirmed consultation ready",
        name: appointment.full_name || "Unnamed Student",
        description:
          "This consultation is confirmed. Mark it completed after the counseling session is done.",
        buttonLabel: "Complete",
        actionType: "complete_appointment",
      });
    }
  });

  followUpReminders.forEach((reminder) => {
    const status = String(reminder.status || "pending").toLowerCase();
    const dueDate = reminder.due_date ? new Date(reminder.due_date) : null;
    const isOverdue = dueDate && dueDate < new Date() && status !== "completed";

    if (isOverdue) {
      actions.push({
        key: `reminder-overdue-${reminder.id}`,
        id: reminder.id,
        type: "reminder",
        category: "Overdue Follow-up",
        priority: "urgent",
        icon: AlertTriangle,
        title: "Overdue follow-up needs action",
        name: reminder.student_name || reminder.full_name || "Student Reminder",
        description:
          "This follow-up reminder is overdue. Open Follow-ups and complete or reschedule it.",
        buttonLabel: "Open Follow-ups",
        actionType: "open_followups",
      });
    }
  });

  const priorityWeight = {
    urgent: 3,
    medium: 2,
    low: 1,
  };

  return actions.sort(
    (a, b) => (priorityWeight[b.priority] || 0) - (priorityWeight[a.priority] || 0)
  );
}

function getPriorityStyle(priority) {
  if (priority === "urgent") {
    return "border-red-200 bg-red-50 text-red-700";
  }

  if (priority === "medium") {
    return "border-orange-200 bg-[#fff1ea] text-[#ff4b12]";
  }

  return "border-emerald-200 bg-emerald-50 text-emerald-700";
}

function getPriorityBadge(priority) {
  if (priority === "urgent") {
    return "border-red-200 bg-red-50 text-red-700";
  }

  if (priority === "medium") {
    return "border-orange-200 bg-[#fff1ea] text-[#ff4b12]";
  }

  return "border-emerald-200 bg-emerald-50 text-emerald-700";
}

export default NotificationActionCenter;
