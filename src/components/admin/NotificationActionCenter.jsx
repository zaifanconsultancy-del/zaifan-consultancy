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
      color: "text-[#D4AF37]",
      border: "border-[#D4AF37]/20",
      bg: "bg-[#D4AF37]/10",
    },
    {
      label: "Urgent",
      value: urgentActions.length,
      icon: Flame,
      color: "text-red-300",
      border: "border-red-400/20",
      bg: "bg-red-400/10",
    },
    {
      label: "Lead Actions",
      value: inquiryActions.length,
      icon: UserCheck,
      color: "text-blue-300",
      border: "border-blue-400/20",
      bg: "bg-blue-400/10",
    },
    {
      label: "Appointment Actions",
      value: appointmentActions.length,
      icon: CalendarCheck,
      color: "text-green-300",
      border: "border-green-400/20",
      bg: "bg-green-400/10",
    },
  ];

  return (
    <section className="space-y-5">
      <div className="relative overflow-hidden rounded-[2rem] border border-[#D4AF37]/15 bg-gradient-to-br from-[#D4AF37]/10 via-white/[0.035] to-black/30 p-5 backdrop-blur-2xl sm:p-6">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(212,175,55,0.13),transparent_36%)]" />

        <div className="relative flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[#D4AF37]/20 bg-[#D4AF37]/10 px-3 py-1.5">
              <Sparkles className="h-3.5 w-3.5 text-[#D4AF37]" />

              <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-[#D4AF37]">
                Notification Action Center
              </p>
            </div>

            <h2 className="mt-3 text-2xl font-black tracking-tight text-white sm:text-3xl">
              Smart CRM Action Queue
            </h2>

            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-gray-400">
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
                    <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-gray-400">
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
            <CheckCircle2 className="h-8 w-8 text-green-300" />
          </div>

          <h3 className="mt-4 text-xl font-black text-white">
            No urgent actions right now
          </h3>

          <p className="mx-auto mt-2 max-w-xl text-sm leading-relaxed text-gray-400">
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
                className={`${cardClass} group relative overflow-hidden rounded-[2rem] p-5 transition duration-500 hover:-translate-y-0.5 hover:border-[#D4AF37]/30 sm:p-6`}
              >
                <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent opacity-0 transition duration-500 group-hover:opacity-100" />

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

                        <span className="rounded-full border border-blue-400/20 bg-blue-400/10 px-3 py-1 text-[9px] font-bold uppercase tracking-[0.18em] text-blue-300">
                          {action.type}
                        </span>

                        <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-[9px] font-bold uppercase tracking-[0.18em] text-gray-400">
                          {action.category}
                        </span>
                      </div>

                      <h3 className="mt-3 text-xl font-black text-white">
                        {action.title}
                      </h3>

                      <p className="mt-1 text-sm font-semibold text-gray-300">
                        {action.name}
                      </p>

                      <p className="mt-3 max-w-4xl text-sm leading-relaxed text-gray-400">
                        {action.description}
                      </p>
                    </div>
                  </div>

                  <div className="flex shrink-0 flex-col gap-3 lg:w-[220px]">
                    <button
                      type="button"
                      onClick={() => runAction(action)}
                      className="inline-flex items-center justify-center gap-2 rounded-full bg-[#D4AF37] px-5 py-3 text-xs font-black uppercase tracking-[0.16em] text-black transition duration-300 hover:-translate-y-0.5 hover:bg-[#E7C768]"
                    >
                      <Zap className="h-4 w-4" />
                      {action.buttonLabel}
                    </button>

                    <button
                      type="button"
                      onClick={() => openTab(action.type === "appointment" ? "appointments" : action.type === "reminder" ? "followups" : "inquiries")}
                      className="inline-flex items-center justify-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-5 py-3 text-xs font-bold uppercase tracking-[0.16em] text-gray-300 transition duration-300 hover:border-[#D4AF37]/30 hover:text-white"
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
    return "border-red-400/25 bg-red-500/10 text-red-300";
  }

  if (priority === "medium") {
    return "border-[#D4AF37]/25 bg-[#D4AF37]/10 text-[#D4AF37]";
  }

  return "border-green-400/25 bg-green-500/10 text-green-300";
}

function getPriorityBadge(priority) {
  if (priority === "urgent") {
    return "border-red-400/25 bg-red-500/10 text-red-300";
  }

  if (priority === "medium") {
    return "border-[#D4AF37]/25 bg-[#D4AF37]/10 text-[#D4AF37]";
  }

  return "border-green-400/25 bg-green-500/10 text-green-300";
}

export default NotificationActionCenter;
