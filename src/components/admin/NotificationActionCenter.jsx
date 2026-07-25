// NotificationActionCenter V3 MAXIMUM — CRM Action Queue
// src/components/admin/NotificationActionCenter.jsx
//
// Maximum pass:
// - preserves inquiry / appointment / follow-up action contracts
// - preserves updateInquiryStatus / updateAppointmentStatus / setActiveTab props
// - adds safer input normalization and malformed-date handling
// - adds reduced-motion support
// - adds action search + severity/type filters
// - adds workload metrics and visible-action counters
// - detects stale new inquiries and overdue reminders more clearly
// - avoids duplicate "new + priority" noise by ranking intelligently
// - adds action feedback and guarded execution
// - better section-opening fallbacks
// - stronger Admin OS cream/orange/navy contrast
// - no backend writes added beyond existing callback actions
// - no schema changes and no fake AI

import { motion, useReducedMotion } from "framer-motion";
import {
  AlertTriangle,
  BellRing,
  CalendarCheck,
  CheckCircle2,
  Clock3,
  ExternalLink,
  Flame,
  MailCheck,
  Search,
  ShieldCheck,
  Sparkles,
  Target,
  UserCheck,
  Zap,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";

function safeArray(value) {
  return Array.isArray(value) ? value.filter(Boolean) : [];
}

function normalize(value = "") {
  return String(value || "").toLowerCase().trim();
}

function safeDate(value) {
  if (!value) return null;

  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? null : date;
}

function ageInDays(value) {
  const date = safeDate(value);
  if (!date) return 0;

  return Math.max(
    0,
    Math.floor((Date.now() - date.getTime()) / 86400000)
  );
}

function NotificationActionCenter({
  cardClass = "",
  inquiries = [],
  appointments = [],
  followUpReminders = [],
  updateInquiryStatus = () => {},
  updateAppointmentStatus = () => {},
  setActiveTab = null,
}) {
  const reduceMotion = useReducedMotion();

  const [priorityFilter, setPriorityFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [runningKey, setRunningKey] = useState("");
  const [feedback, setFeedback] = useState("");

  const actions = useMemo(
    () =>
      buildNotificationActions({
        inquiries: safeArray(inquiries),
        appointments: safeArray(appointments),
        followUpReminders: safeArray(followUpReminders),
      }),
    [inquiries, appointments, followUpReminders]
  );

  const metrics = useMemo(() => {
    let urgent = 0;
    let medium = 0;
    let appointmentActions = 0;
    let inquiryActions = 0;
    let reminderActions = 0;
    let staleLeadActions = 0;

    for (const item of actions) {
      if (item.priority === "urgent") urgent += 1;
      else if (item.priority === "medium") medium += 1;

      if (item.type === "appointment") appointmentActions += 1;
      else if (item.type === "inquiry") inquiryActions += 1;
      else if (item.type === "reminder") reminderActions += 1;

      if (item.category === "Stale Lead") {
        staleLeadActions += 1;
      }
    }

    return {
      total: actions.length,
      urgent,
      medium,
      appointmentActions,
      inquiryActions,
      reminderActions,
      staleLeadActions,
    };
  }, [actions]);

  const filteredActions = useMemo(() => {
    const cleanQuery = normalize(query);

    return actions.filter((action) => {
      if (
        priorityFilter !== "all" &&
        action.priority !== priorityFilter
      ) {
        return false;
      }

      if (typeFilter !== "all" && action.type !== typeFilter) {
        return false;
      }

      if (!cleanQuery) return true;

      return [
        action.title,
        action.name,
        action.description,
        action.category,
        action.type,
        action.priority,
      ]
        .map(normalize)
        .some((value) => value.includes(cleanQuery));
    });
  }, [actions, priorityFilter, typeFilter, query]);

  const topActions = filteredActions.slice(0, 12);

  const openTab = (tabName) => {
    if (typeof setActiveTab === "function") {
      setActiveTab(tabName);
      return true;
    }

    setFeedback("Section navigation is not connected here.");
    return false;
  };

  const runAction = async (action) => {
    if (!action || runningKey) return;

    setRunningKey(action.key);
    setFeedback("");

    try {
      if (action.actionType === "mark_contacted") {
        await Promise.resolve(
          updateInquiryStatus(action.id, "contacted")
        );
        setFeedback(
          `${action.name} moved to Contacted.`
        );
        return;
      }

      if (action.actionType === "confirm_appointment") {
        await Promise.resolve(
          updateAppointmentStatus(action.id, "confirmed")
        );
        setFeedback(
          `${action.name}'s appointment was confirmed.`
        );
        return;
      }

      if (action.actionType === "complete_appointment") {
        await Promise.resolve(
          updateAppointmentStatus(action.id, "completed")
        );
        setFeedback(
          `${action.name}'s appointment was completed.`
        );
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
        return;
      }

      setFeedback("This action is not connected yet.");
    } catch (error) {
      console.error("Notification action failed:", error);
      setFeedback(
        error?.message || "Action failed. Please retry."
      );
    } finally {
      setRunningKey("");
    }
  };

  const clearFilters = () => {
    setPriorityFilter("all");
    setTypeFilter("all");
    setQuery("");
  };

  const hasActiveFilters =
    priorityFilter !== "all" ||
    typeFilter !== "all" ||
    Boolean(query.trim());

  return (
    <motion.section
      initial={reduceMotion ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reduceMotion ? 0 : 0.28 }}
      className="space-y-5 text-[#10233f]"
    >
      <section className="overflow-hidden rounded-[2rem] border-[3px] border-orange-300 bg-white shadow-[0_14px_36px_rgba(15,35,63,0.06)]">
        <div className="grid xl:grid-cols-[1.3fr_0.7fr]">
          <div
            className="bg-[#123865] p-5 sm:p-6"
            style={{ color: "#FFFFFF" }}
          >
            <div className="inline-flex items-center gap-2 rounded-full border-2 border-white/25 bg-white/10 px-3 py-1.5">
              <Sparkles
                size={13}
                style={{ color: "#FDBA74" }}
              />

              <p
                className="text-[9px] font-black uppercase tracking-[0.1em]"
                style={{ color: "#FFFFFF" }}
              >
                Notification Action Center
              </p>
            </div>

            <h2
              className="mt-3 text-2xl font-black tracking-tight sm:text-3xl"
              style={{ color: "#FFFFFF" }}
            >
              Smart CRM Action Queue
            </h2>

            <p
              className="mt-2 max-w-3xl text-sm font-semibold leading-6"
              style={{ color: "#F8FAFC" }}
            >
              Converts CRM signals into practical counselor actions for first
              response, appointment handling, overdue follow-ups, and priority
              lead attention.
            </p>
          </div>

          <div
            className="bg-orange-500 p-5 sm:p-6"
            style={{ color: "#FFFFFF" }}
          >
            <div className="flex items-center gap-2">
              <BellRing size={18} />

              <p className="text-[9px] font-black uppercase tracking-[0.1em] text-white">
                Queue Pressure
              </p>
            </div>

            <p className="mt-3 text-4xl font-black text-white">
              {metrics.total}
            </p>

            <p className="mt-1 text-xs font-black uppercase tracking-[0.08em] text-white">
              Smart Actions
            </p>

            <p className="mt-4 text-xs font-semibold leading-5 text-white">
              {metrics.urgent} urgent · {metrics.medium} medium ·{" "}
              {metrics.reminderActions} follow-up action
              {metrics.reminderActions === 1 ? "" : "s"}.
            </p>
          </div>
        </div>
      </section>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Urgent"
          value={metrics.urgent}
          icon={Flame}
          tone="danger"
          helper="Needs immediate counselor attention."
        />

        <MetricCard
          label="Lead Actions"
          value={metrics.inquiryActions}
          icon={UserCheck}
          tone="navy"
          helper="Inquiry response and priority handling."
        />

        <MetricCard
          label="Appointments"
          value={metrics.appointmentActions}
          icon={CalendarCheck}
          tone="orange"
          helper="Confirm or complete consultation bookings."
        />

        <MetricCard
          label="Follow-Ups"
          value={metrics.reminderActions}
          icon={Clock3}
          tone={metrics.reminderActions ? "warning" : "good"}
          helper="Overdue reminder workload."
        />
      </div>

      <section
        className={`${cardClass} rounded-[1.6rem] border-[3px] border-slate-300 bg-white p-4 shadow-[0_7px_20px_rgba(15,35,63,0.04)]`}
      >
        <div className="grid gap-3 lg:grid-cols-[1fr_auto_auto_auto]">
          <label className="relative block">
            <Search
              size={16}
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              value={query}
              onChange={(event) =>
                setQuery(event.target.value)
              }
              placeholder="Search student, action, category..."
              className="min-h-11 w-full rounded-xl border-2 border-slate-300 bg-white pl-11 pr-4 text-sm font-semibold text-[#10233f] outline-none placeholder:text-slate-400 focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
            />
          </label>

          <select
            value={priorityFilter}
            onChange={(event) =>
              setPriorityFilter(event.target.value)
            }
            className="min-h-11 rounded-xl border-2 border-slate-300 bg-white px-4 text-sm font-black text-[#10233f] outline-none focus:border-orange-400"
          >
            <option value="all">All Severity</option>
            <option value="urgent">Urgent</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>

          <select
            value={typeFilter}
            onChange={(event) =>
              setTypeFilter(event.target.value)
            }
            className="min-h-11 rounded-xl border-2 border-slate-300 bg-white px-4 text-sm font-black text-[#10233f] outline-none focus:border-orange-400"
          >
            <option value="all">All Types</option>
            <option value="inquiry">Inquiries</option>
            <option value="appointment">Appointments</option>
            <option value="reminder">Follow-Ups</option>
          </select>

          <button
            type="button"
            onClick={clearFilters}
            disabled={!hasActiveFilters}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border-2 border-slate-300 bg-white px-4 text-xs font-black text-slate-700 transition hover:border-orange-300 hover:bg-orange-50 hover:text-orange-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <X size={13} />
            Clear
          </button>
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs font-semibold text-slate-500">
            Showing {Math.min(topActions.length, 12)} of{" "}
            {filteredActions.length} matching actions.
          </p>

          {metrics.staleLeadActions > 0 ? (
            <span className="rounded-full border-2 border-amber-300 bg-amber-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.08em] text-amber-800">
              {metrics.staleLeadActions} stale lead
              {metrics.staleLeadActions === 1 ? "" : "s"}
            </span>
          ) : null}
        </div>
      </section>

      {feedback ? (
        <div className="rounded-[1.4rem] border-2 border-orange-300 bg-orange-50 p-4">
          <div className="flex items-start gap-3">
            <CheckCircle2
              size={17}
              className="mt-0.5 shrink-0 text-orange-700"
            />

            <p className="text-sm font-semibold leading-6 text-orange-900">
              {feedback}
            </p>
          </div>
        </div>
      ) : null}

      {topActions.length === 0 ? (
        <div
          className={`${cardClass} rounded-[2rem] border-[3px] border-emerald-300 bg-white p-8 text-center shadow-[0_10px_28px_rgba(15,35,63,0.05)]`}
        >
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-xl border-2 border-emerald-300 bg-emerald-50">
            <CheckCircle2 className="h-8 w-8 text-emerald-700" />
          </div>

          <h3 className="mt-4 text-xl font-black text-[#10233f]">
            {hasActiveFilters
              ? "No matching actions"
              : "No urgent actions right now"}
          </h3>

          <p className="mx-auto mt-2 max-w-xl text-sm font-semibold leading-6 text-slate-600">
            {hasActiveFilters
              ? "Adjust the filters to see more CRM actions."
              : "Your action queue is clean. New leads, pending appointments, stale inquiries, and overdue follow-ups will appear here."}
          </p>

          {hasActiveFilters ? (
            <button
              type="button"
              onClick={clearFilters}
              className="mt-5 rounded-xl bg-orange-500 px-5 py-3 text-sm font-black text-white transition hover:bg-orange-600"
            >
              Reset Filters
            </button>
          ) : null}
        </div>
      ) : (
        <div className="grid gap-4">
          {topActions.map((action, index) => {
            const Icon = action.icon;
            const isRunning = runningKey === action.key;

            return (
              <motion.article
                key={action.key}
                initial={
                  reduceMotion
                    ? false
                    : { opacity: 0, y: 12 }
                }
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: reduceMotion ? 0 : 0.24,
                  delay: reduceMotion ? 0 : index * 0.025,
                }}
                className={`${cardClass} group relative overflow-hidden rounded-[1.7rem] border-[3px] border-slate-300 bg-white p-5 shadow-[0_7px_20px_rgba(15,35,63,0.04)] transition duration-300 hover:-translate-y-0.5 hover:border-orange-300 sm:p-6`}
              >
                <div className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-transparent via-orange-500 to-transparent opacity-0 transition duration-300 group-hover:opacity-100" />

                <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex min-w-0 flex-1 items-start gap-4">
                    <div
                      className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border-2 ${getPriorityStyle(
                        action.priority
                      )}`}
                    >
                      <Icon className="h-5 w-5" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`rounded-full border px-3 py-1 text-[9px] font-black uppercase tracking-[0.08em] ${getPriorityBadge(
                            action.priority
                          )}`}
                        >
                          {action.priority}
                        </span>

                        <span className="rounded-full border border-blue-300 bg-blue-50 px-3 py-1 text-[9px] font-black uppercase tracking-[0.08em] text-blue-700">
                          {action.type}
                        </span>

                        <span className="rounded-full border border-orange-300 bg-orange-50 px-3 py-1 text-[9px] font-black uppercase tracking-[0.08em] text-orange-700">
                          {action.category}
                        </span>

                        {action.ageDays >= 3 ? (
                          <span className="rounded-full border border-amber-300 bg-amber-50 px-3 py-1 text-[9px] font-black uppercase tracking-[0.08em] text-amber-800">
                            {action.ageDays}d old
                          </span>
                        ) : null}
                      </div>

                      <h3 className="mt-3 text-xl font-black text-[#10233f]">
                        {action.title}
                      </h3>

                      <p className="mt-1 text-sm font-black text-[#526178]">
                        {action.name}
                      </p>

                      <p className="mt-3 max-w-4xl text-sm font-semibold leading-6 text-slate-600">
                        {action.description}
                      </p>
                    </div>
                  </div>

                  <div className="flex shrink-0 flex-col gap-3 lg:w-[220px]">
                    <button
                      type="button"
                      onClick={() => runAction(action)}
                      disabled={Boolean(runningKey)}
                      className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border-2 border-orange-600 bg-orange-500 px-5 text-xs font-black uppercase tracking-[0.08em] text-white shadow-[0_10px_24px_rgba(249,115,22,0.18)] transition hover:-translate-y-0.5 hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <Zap className="h-4 w-4" />
                      {isRunning
                        ? "Working..."
                        : action.buttonLabel}
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        openTab(
                          action.type === "appointment"
                            ? "appointments"
                            : action.type === "reminder"
                            ? "followups"
                            : "inquiries"
                        )
                      }
                      className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border-2 border-slate-300 bg-white px-5 text-xs font-black uppercase tracking-[0.08em] text-[#10233f] transition hover:-translate-y-0.5 hover:border-orange-300 hover:bg-orange-50 hover:text-orange-700"
                    >
                      <ExternalLink className="h-4 w-4" />
                      Open Section
                    </button>
                  </div>
                </div>
              </motion.article>
            );
          })}
        </div>
      )}
    </motion.section>
  );
}

function MetricCard({
  label,
  value,
  icon: Icon,
  tone = "orange",
  helper,
}) {
  const dark = tone === "navy";

  const style =
    tone === "danger"
      ? "border-red-300 bg-red-50"
      : tone === "warning"
      ? "border-amber-300 bg-amber-50"
      : tone === "good"
      ? "border-emerald-300 bg-emerald-50"
      : tone === "navy"
      ? "border-[#123865] bg-[#123865]"
      : "border-orange-300 bg-orange-50";

  return (
    <div
      className={`rounded-[1.35rem] border-[3px] p-4 ${style}`}
      style={{ color: dark ? "#FFFFFF" : "#10233F" }}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p
            className="text-[9px] font-black uppercase tracking-[0.1em]"
            style={{ color: dark ? "#FDBA74" : "#64748B" }}
          >
            {label}
          </p>

          <p
            className="mt-2 text-3xl font-black"
            style={{ color: dark ? "#FFFFFF" : "#10233F" }}
          >
            {value}
          </p>
        </div>

        <Icon
          size={18}
          style={{ color: dark ? "#FDBA74" : "#C2410C" }}
        />
      </div>

      <p
        className="mt-2 text-xs font-semibold leading-5"
        style={{ color: dark ? "#F8FAFC" : "#64748B" }}
      >
        {helper}
      </p>
    </div>
  );
}

function buildNotificationActions({
  inquiries = [],
  appointments = [],
  followUpReminders = [],
}) {
  const actions = [];
  const now = new Date();

  safeArray(inquiries).forEach((inquiry) => {
    const status = normalize(inquiry.status || "new");
    const priority = normalize(inquiry.priority || "low");
    const ageDays = ageInDays(inquiry.created_at);

    if (status === "new") {
      actions.push({
        key: `inquiry-new-${inquiry.id}`,
        id: inquiry.id,
        type: "inquiry",
        category:
          ageDays >= 3 ? "Stale Lead" : "New Lead",
        priority:
          priority === "vip" ||
          priority === "high" ||
          ageDays >= 3
            ? "urgent"
            : "medium",
        icon: ageDays >= 3 ? AlertTriangle : MailCheck,
        title:
          ageDays >= 3
            ? "New inquiry is going stale"
            : "New inquiry needs first response",
        name:
          inquiry.full_name ||
          inquiry.name ||
          "Unnamed Student",
        description:
          ageDays >= 3
            ? `This inquiry has remained in New stage for ${ageDays} days. Contact the student or move the record to the correct pipeline stage.`
            : "This inquiry is still in New stage. Mark it contacted after first WhatsApp, call, or email response.",
        buttonLabel: "Mark Contacted",
        actionType: "mark_contacted",
        ageDays,
      });
    }

    if (
      ["vip", "high"].includes(priority) &&
      status !== "new"
    ) {
      actions.push({
        key: `inquiry-priority-${inquiry.id}`,
        id: inquiry.id,
        type: "inquiry",
        category: "High Priority",
        priority: "urgent",
        icon: Flame,
        title: "High-value lead requires attention",
        name:
          inquiry.full_name ||
          inquiry.name ||
          "Unnamed Student",
        description:
          "This inquiry is marked VIP or High priority. Open the inquiry list and handle it before normal-priority workload.",
        buttonLabel: "Open Leads",
        actionType: "open_inquiries",
        ageDays,
      });
    }
  });

  safeArray(appointments).forEach((appointment) => {
    const status = normalize(
      appointment.status || "pending"
    );
    const priority = normalize(
      appointment.priority || "low"
    );

    const appointmentDate =
      safeDate(
        appointment.appointment_date &&
          appointment.appointment_time
          ? `${appointment.appointment_date}T${appointment.appointment_time}`
          : appointment.appointment_date
      );

    const isPastDue =
      appointmentDate &&
      appointmentDate < now &&
      !["completed", "cancelled"].includes(status);

    if (status === "pending") {
      actions.push({
        key: `appointment-pending-${appointment.id}`,
        id: appointment.id,
        type: "appointment",
        category: isPastDue
          ? "Past Appointment"
          : "Confirmation",
        priority:
          isPastDue ||
          priority === "vip" ||
          priority === "high"
            ? "urgent"
            : "medium",
        icon: isPastDue
          ? AlertTriangle
          : CalendarCheck,
        title: isPastDue
          ? "Pending appointment date has passed"
          : "Pending appointment needs confirmation",
        name:
          appointment.full_name ||
          appointment.name ||
          "Unnamed Student",
        description: isPastDue
          ? "This appointment is still pending even though its scheduled date has passed. Confirm, cancel, or resolve the booking status."
          : "This appointment is still pending. Confirm it after verifying date and time with the student.",
        buttonLabel: isPastDue
          ? "Open Appointments"
          : "Confirm",
        actionType: isPastDue
          ? "open_appointments"
          : "confirm_appointment",
        ageDays: ageInDays(appointment.created_at),
      });
    }

    if (status === "confirmed") {
      actions.push({
        key: `appointment-confirmed-${appointment.id}`,
        id: appointment.id,
        type: "appointment",
        category: "Consultation",
        priority: isPastDue ? "urgent" : "low",
        icon: ShieldCheck,
        title: isPastDue
          ? "Confirmed consultation needs completion"
          : "Confirmed consultation ready",
        name:
          appointment.full_name ||
          appointment.name ||
          "Unnamed Student",
        description: isPastDue
          ? "The scheduled consultation time has passed. Mark it completed if counseling happened, or open appointments to correct the record."
          : "This consultation is confirmed. Mark it completed after the counseling session is done.",
        buttonLabel: "Complete",
        actionType: "complete_appointment",
        ageDays: ageInDays(appointment.created_at),
      });
    }
  });

  safeArray(followUpReminders).forEach((reminder) => {
    const status = normalize(
      reminder.status || "pending"
    );

    const dueDate = safeDate(
      reminder.due_date || reminder.dueDate
    );

    const isCompleted = [
      "completed",
      "done",
      "closed",
    ].includes(status);

    const isOverdue =
      dueDate && dueDate < now && !isCompleted;

    if (isOverdue) {
      actions.push({
        key: `reminder-overdue-${reminder.id}`,
        id: reminder.id,
        type: "reminder",
        category: "Overdue Follow-up",
        priority: "urgent",
        icon: AlertTriangle,
        title: "Overdue follow-up needs action",
        name:
          reminder.student_name ||
          reminder.full_name ||
          "Student Reminder",
        description:
          "This follow-up reminder is overdue. Open Follow-ups and complete, reschedule, or close it.",
        buttonLabel: "Open Follow-ups",
        actionType: "open_followups",
        ageDays: dueDate
          ? Math.max(
              0,
              Math.floor(
                (now.getTime() - dueDate.getTime()) /
                  86400000
              )
            )
          : 0,
      });
    }
  });

  const priorityWeight = {
    urgent: 3,
    medium: 2,
    low: 1,
  };

  return actions.sort((a, b) => {
    const priorityDifference =
      (priorityWeight[b.priority] || 0) -
      (priorityWeight[a.priority] || 0);

    if (priorityDifference !== 0) {
      return priorityDifference;
    }

    return (b.ageDays || 0) - (a.ageDays || 0);
  });
}

function getPriorityStyle(priority) {
  if (priority === "urgent") {
    return "border-red-300 bg-red-50 text-red-700";
  }

  if (priority === "medium") {
    return "border-orange-300 bg-orange-50 text-orange-700";
  }

  return "border-emerald-300 bg-emerald-50 text-emerald-700";
}

function getPriorityBadge(priority) {
  if (priority === "urgent") {
    return "border-red-300 bg-red-50 text-red-700";
  }

  if (priority === "medium") {
    return "border-orange-300 bg-orange-50 text-orange-700";
  }

  return "border-emerald-300 bg-emerald-50 text-emerald-700";
}

export default NotificationActionCenter;
