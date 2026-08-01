// NotificationActionCenter V7 PARTNER OS — CRM Action Queue
// src/components/admin/workspaces/communications/NotificationActionCenter.jsx
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
// - applies the locked Partner OS navy / orange / cream visual system
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
      className="min-w-0 space-y-5 overflow-hidden rounded-[2.2rem] border-[4px] border-[#123865] bg-[#FFF8EF] p-3 text-[#10233F] shadow-[0_24px_65px_rgba(18,56,101,0.15)] sm:p-4 lg:p-5"
    >
      <header className="overflow-hidden rounded-[1.75rem] border-[3px] border-[#FF5A0A]">
        <div className="grid xl:grid-cols-[minmax(0,1.25fr)_minmax(18rem,0.75fr)]">
          <div className="bg-[#123865] p-5 text-white sm:p-6">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-2 rounded-full border-2 border-orange-300/30 bg-orange-400/10 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.12em] text-orange-300">
                <BellRing size={12} />
                Notification OS
              </span>

              <span className="rounded-full border-2 border-white/15 bg-white/5 px-3 py-1 text-[8px] font-black uppercase tracking-[0.08em] text-white">
                CRM action queue
              </span>

              <span className="rounded-full border-2 border-white/15 bg-white/5 px-3 py-1 text-[8px] font-black uppercase tracking-[0.08em] text-white">
                Evidence first
              </span>
            </div>

            <h1 className="mt-3 text-3xl font-black text-white">
              Notification & Action Command
            </h1>

            <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-200">
              Turn real inquiry, appointment and follow-up signals into one
              focused operating queue. No delivery, open-rate or messaging
              telemetry is invented.
            </p>
          </div>

          <div className="bg-[#FF5A0A] p-5 text-white sm:p-6">
            <p className="text-[9px] font-black uppercase tracking-[0.12em]">
              Current Workspace
            </p>

            <p className="mt-2 text-2xl font-black">Action Queue</p>

            <p className="mt-2 text-xs font-semibold leading-5 text-orange-50">
              Prioritised counselor work derived from live CRM records.
            </p>

            <div className="mt-4 flex flex-wrap gap-2">
              <span className="rounded-full border-2 border-white/25 bg-white/10 px-3 py-1 text-[8px] font-black uppercase tracking-[0.08em]">
                {metrics.total} actions
              </span>

              <span className="rounded-full border-2 border-white/25 bg-white/10 px-3 py-1 text-[8px] font-black uppercase tracking-[0.08em]">
                {metrics.urgent} urgent
              </span>
            </div>
          </div>
        </div>
      </header>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Total Actions"
          value={metrics.total}
          icon={BellRing}
          tone="navy"
          helper="All actionable CRM signals currently in the queue."
        />

        <MetricCard
          label="Urgent"
          value={metrics.urgent}
          icon={Flame}
          tone={metrics.urgent ? "danger" : "good"}
          helper="Needs immediate counselor attention."
        />

        <MetricCard
          label="Lead Actions"
          value={metrics.inquiryActions}
          icon={UserCheck}
          tone="blue"
          helper="Inquiry response and priority handling."
        />

        <MetricCard
          label="Follow-Ups"
          value={metrics.reminderActions}
          icon={Clock3}
          tone={metrics.reminderActions ? "warning" : "good"}
          helper="Overdue reminder workload."
        />
      </div>

      <section className="rounded-[1.5rem] border-[3px] border-[#C9D7E6] bg-white p-4 shadow-[0_10px_30px_rgba(15,35,63,0.06)] sm:p-5">
        <div className="mb-4 flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.11em] text-orange-700">
              Notification Command
            </p>
            <h2 className="mt-1 text-xl font-black text-[#10233F]">
              CRM action portfolio
            </h2>
            <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">
              Search, filter and execute real inquiry, appointment and follow-up
              actions from one operating workspace.
            </p>
          </div>

          <div className="grid gap-2 sm:grid-cols-[minmax(14rem,1fr)_9rem_10rem_auto]">
            <label className="relative block">
              <Search
                size={15}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search actions..."
                className="min-h-11 w-full rounded-xl border-2 border-[#C9D7E6] bg-[#FFF8EF] pl-9 pr-3 text-xs font-semibold text-[#10233F] outline-none transition placeholder:text-slate-400 hover:border-[#123865]/40 focus:border-[#FF5A0A] focus:ring-4 focus:ring-[#FF5A0A]/10"
              />
            </label>

            <select
              value={priorityFilter}
              onChange={(event) => setPriorityFilter(event.target.value)}
              className="min-h-11 rounded-xl border-2 border-[#C9D7E6] bg-[#FFF8EF] px-3 text-xs font-black text-[#10233F] outline-none transition hover:border-[#123865]/40 focus:border-[#FF5A0A] focus:ring-4 focus:ring-[#FF5A0A]/10"
            >
              <option value="all">All severity</option>
              <option value="urgent">Urgent</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>

            <select
              value={typeFilter}
              onChange={(event) => setTypeFilter(event.target.value)}
              className="min-h-11 rounded-xl border-2 border-[#C9D7E6] bg-[#FFF8EF] px-3 text-xs font-black text-[#10233F] outline-none transition hover:border-[#123865]/40 focus:border-[#FF5A0A] focus:ring-4 focus:ring-[#FF5A0A]/10"
            >
              <option value="all">All types</option>
              <option value="inquiry">Inquiries</option>
              <option value="appointment">Appointments</option>
              <option value="reminder">Follow-Ups</option>
            </select>

            <button
              type="button"
              onClick={clearFilters}
              disabled={!hasActiveFilters}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border-2 border-[#C9D7E6] bg-white px-3 text-xs font-black text-[#10233F] transition hover:border-[#123865] hover:bg-[#FFF8EF] disabled:cursor-not-allowed disabled:opacity-40"
            >
              <X size={13} />
              Clear
            </button>
          </div>
        </div>

        {feedback ? (
          <div className="mb-3 rounded-xl border-2 border-[#FF5A0A] bg-[#FFF4EA] px-4 py-3">
            <div className="flex items-start gap-3">
              <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-[#B84F0E]" />
              <p className="text-xs font-semibold leading-5 text-orange-900">
                {feedback}
              </p>
            </div>
          </div>
        ) : null}

        <div className="space-y-2.5">
          {topActions.length ? (
            topActions.map((action, index) => (
              <NotificationQueueRow
                key={action.key}
                action={action}
                index={index}
                reduceMotion={reduceMotion}
                runningKey={runningKey}
                runAction={runAction}
                openTab={openTab}
              />
            ))
          ) : (
            <div className="rounded-[1.4rem] border-[3px] border-dashed border-[#C9D7E6] bg-[#FFF8EF] p-8 text-center">
              <CheckCircle2 size={25} className="mx-auto text-emerald-700" />
              <p className="mt-3 font-black text-[#10233F]">
                {hasActiveFilters
                  ? "No actions match these filters."
                  : "No urgent actions right now."}
              </p>
              <p className="mx-auto mt-2 max-w-xl text-sm font-semibold leading-6 text-slate-600">
                {hasActiveFilters
                  ? "Clear or change the action filters."
                  : "New leads, pending appointments, stale inquiries and overdue follow-ups will appear here."}
              </p>
            </div>
          )}
        </div>
      </section>

      <div className="grid gap-3 lg:grid-cols-3">
        <IntegrityCard
          icon={ShieldCheck}
          eyebrow="Queue Integrity"
          title="CRM-derived actions only"
          helper="The queue is built from inquiry, appointment and reminder evidence."
          tone="green"
        />

        <IntegrityCard
          icon={Target}
          eyebrow="Action Coverage"
          title={`${metrics.inquiryActions + metrics.appointmentActions + metrics.reminderActions} actionable records`}
          helper="Only supported status updates and real section navigation are exposed."
          tone="blue"
        />

        <IntegrityCard
          icon={AlertTriangle}
          eyebrow="Pressure Boundary"
          title={`${metrics.urgent} urgent · ${metrics.medium} medium`}
          helper="Severity comes from explicit priority, stale age, overdue dates and unresolved appointments."
          tone={metrics.urgent ? "amber" : "green"}
        />
      </div>
    </motion.section>
  );
}


function NotificationQueueRow({
  action,
  index,
  reduceMotion,
  runningKey,
  runAction,
  openTab,
}) {
  const Icon = action.icon;
  const isRunning = runningKey === action.key;

  return (
    <motion.article
      initial={reduceMotion ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: reduceMotion ? 0 : 0.2,
        delay: reduceMotion ? 0 : index * 0.02,
      }}
      className="overflow-hidden rounded-[1.3rem] border-2 border-[#C9D7E6] bg-white shadow-[0_7px_20px_rgba(15,35,63,0.05)] transition duration-200 hover:-translate-y-0.5 hover:border-[#FF5A0A] hover:shadow-[0_12px_28px_rgba(15,35,63,0.09)]"
    >
      <div className="grid min-w-0 lg:grid-cols-[minmax(0,1fr)_13rem]">
        <div className="min-w-0 p-4">
          <div className="flex min-w-0 items-start gap-3">
            <div
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border-2 ${getPriorityStyle(
                action.priority
              )}`}
            >
              <Icon size={17} />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="min-w-0 [overflow-wrap:anywhere] font-black text-[#10233F]">
                  {action.name}
                </p>

                <span
                  className={`rounded-full border-2 px-2.5 py-1 text-[8px] font-black uppercase tracking-[0.07em] ${getPriorityBadge(
                    action.priority
                  )}`}
                >
                  {action.priority}
                </span>
              </div>

              <p className="mt-1 font-black text-[#10233F]">
                {action.title}
              </p>

              <p className="mt-1 text-[11px] font-semibold leading-4 text-slate-500">
                {action.description}
              </p>

              <div className="mt-3 grid gap-2 sm:grid-cols-3">
                <div className="min-w-0 rounded-xl border border-[#E1E8F0] bg-[#FFF8EF] px-3 py-2.5">
                  <p className="text-[7px] font-black uppercase tracking-[0.09em] text-slate-500">
                    Type
                  </p>
                  <p className="mt-1 truncate text-xs font-black capitalize text-[#10233F]">
                    {action.type}
                  </p>
                </div>

                <div className="min-w-0 rounded-xl border border-[#E1E8F0] bg-[#FFF8EF] px-3 py-2.5">
                  <p className="text-[7px] font-black uppercase tracking-[0.09em] text-slate-500">
                    Category
                  </p>
                  <p className="mt-1 truncate text-xs font-black text-[#10233F]">
                    {action.category}
                  </p>
                </div>

                <div className="min-w-0 rounded-xl border border-[#E1E8F0] bg-[#FFF8EF] px-3 py-2.5">
                  <p className="text-[7px] font-black uppercase tracking-[0.09em] text-slate-500">
                    Age
                  </p>
                  <p className="mt-1 text-xs font-black text-[#10233F]">
                    {action.ageDays ? `${action.ageDays}d old` : "New"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex min-w-0 flex-col justify-center gap-2 border-t-2 border-[#E1E8F0] bg-[#F7FAFC] p-4 lg:border-l-2 lg:border-t-0">
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
            className="inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-xl border-2 border-[#C9D7E6] bg-white px-3 text-[10px] font-black text-[#10233F] transition hover:border-[#FF5A0A] hover:bg-[#FFF4EA] focus:outline-none focus:ring-4 focus:ring-[#FF5A0A]/10"
          >
            <ExternalLink size={14} />
            Open Section
          </button>

          <button
            type="button"
            onClick={() => runAction(action)}
            disabled={Boolean(runningKey)}
            className="inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-xl border-2 border-[#123865] bg-[#123865] px-3 text-center text-[10px] font-black leading-4 text-white shadow-[0_6px_16px_rgba(18,56,101,0.18)] transition hover:border-[#FF5A0A] hover:bg-[#245886] focus:outline-none focus:ring-4 focus:ring-[#123865]/15 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Zap size={14} />
            {isRunning ? "Working..." : action.buttonLabel}
          </button>
        </div>
      </div>
    </motion.article>
  );
}

function IntegrityCard({ icon: Icon, eyebrow, title, helper, tone = "blue" }) {
  const tones = {
    green: "border-[#34D399] bg-[#F0FFF8]",
    blue: "border-[#60A5FA] bg-[#F2F7FF]",
    amber: "border-[#F59E0B] bg-[#FFF8E8]",
  };

  return (
    <div className={`rounded-[1.35rem] border-[3px] p-4 ${tones[tone]}`}>
      <div className="flex items-start gap-3">
        <Icon size={17} className="mt-0.5 shrink-0 text-[#123865]" />
        <div>
          <p className="text-[8px] font-black uppercase tracking-[0.11em] text-slate-500">
            {eyebrow}
          </p>
          <p className="mt-1 font-black text-[#10233F]">{title}</p>
          <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">
            {helper}
          </p>
        </div>
      </div>
    </div>
  );
}

function DarkMetric({ label, value }) {
  return (
    <div className="min-w-0 rounded-xl border-2 border-white/20 bg-white/10 p-3">
      <p className="truncate text-[8px] font-black uppercase tracking-[0.08em] text-white/85">
        {label}
      </p>
      <p className="mt-1 truncate text-xl font-black text-white">
        {Number(value || 0).toLocaleString("en-GB")}
      </p>
    </div>
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
      : tone === "blue"
      ? "border-[#60A5FA] bg-[#F2F7FF]"
      : "border-[#FF5A0A] bg-[#FFF4EA]";

  return (
    <div
      className={`flex min-h-[176px] h-full flex-col justify-between rounded-[1.4rem] border-[3px] p-4 shadow-[0_7px_20px_rgba(15,35,63,0.05)] ${style}`}
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
        className="mt-4 text-xs font-semibold leading-5"
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
    return "border-[#FF5A0A] bg-[#FFF4EA] text-[#B84F0E]";
  }

  return "border-emerald-300 bg-emerald-50 text-emerald-700";
}

function getPriorityBadge(priority) {
  if (priority === "urgent") {
    return "border-red-300 bg-red-50 text-red-700";
  }

  if (priority === "medium") {
    return "border-[#FF5A0A] bg-[#FFF4EA] text-[#B84F0E]";
  }

  return "border-emerald-300 bg-emerald-50 text-emerald-700";
}

export default NotificationActionCenter;
