// FollowUpPerformancePanel PARTNER OS EXTREME — Zaifan Follow-Up Performance Intelligence
// src/components/admin/FollowUpPerformancePanel.jsx
//
// Partner OS pass:
// - preserves reminders / inquiries / appointments props and all calculations
// - preserves read-only analytics behavior
// - preserves reduced-motion support
// - applies the locked Partner OS navy / orange / cream command structure
// - strengthens outer and inner framing, spacing rhythm, hierarchy and containment
// - adds responsive min-w-0 protection and clearer semantic performance states

import {
  AlertTriangle,
  CalendarCheck,
  CheckCircle2,
  Clock3,
  CircleGauge,
  Radar,
  ShieldCheck,
  TrendingUp,
  UsersRound,
} from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { useMemo } from "react";

function normalize(value = "") {
  return String(value || "").toLowerCase().trim();
}

function safeArray(value) {
  return Array.isArray(value) ? value.filter(Boolean) : [];
}

function dateKey(value) {
  if (!value) return "";

  const raw = String(value);

  if (/^\d{4}-\d{2}-\d{2}/.test(raw)) {
    return raw.slice(0, 10);
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toISOString().slice(0, 10);
}

function percent(value, total) {
  if (!total) return 0;

  return Math.max(
    0,
    Math.min(100, Math.round((value / total) * 100))
  );
}

function buildPerformanceHealth({
  completionRate = 0,
  overdueRate = 0,
  coverageRate = 0,
  dueToday = 0,
}) {
  const score = Math.max(
    0,
    Math.min(
      100,
      Math.round(
        completionRate * 0.45 +
          coverageRate * 0.35 +
          (100 - overdueRate) * 0.2 -
          Math.min(15, dueToday * 2)
      )
    )
  );

  if (score >= 85) {
    return {
      score,
      label: "Strong",
      message:
        "Follow-up execution is healthy with good completion, coverage, and low overdue pressure.",
    };
  }

  if (score >= 65) {
    return {
      score,
      label: "Healthy",
      message:
        "Follow-up performance is generally healthy, but some open reminders still need attention.",
    };
  }

  if (score >= 45) {
    return {
      score,
      label: "Needs Attention",
      message:
        "Reminder completion or coverage is weak enough to create CRM leakage.",
    };
  }

  return {
    score,
    label: "Critical",
    message:
      "Follow-up discipline is under pressure. Overdue reminders and uncovered CRM records need intervention.",
  };
}

function FollowUpPerformancePanel({
  cardClass = "",
  reminders = [],
  inquiries = [],
  appointments = [],
}) {
  const reduceMotion = useReducedMotion();

  const safeReminders = useMemo(
    () => safeArray(reminders),
    [reminders]
  );

  const safeInquiries = useMemo(
    () => safeArray(inquiries),
    [inquiries]
  );

  const safeAppointments = useMemo(
    () => safeArray(appointments),
    [appointments]
  );

  const metrics = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);

    const completedStatuses = new Set([
      "completed",
      "done",
      "closed",
    ]);

    const pendingStatuses = new Set([
      "pending",
      "open",
      "active",
    ]);

    const cancelledStatuses = new Set([
      "cancelled",
      "canceled",
    ]);

    let completed = 0;
    let pending = 0;
    let cancelled = 0;
    let overdue = 0;
    let dueToday = 0;
    let upcoming = 0;

    safeReminders.forEach((reminder) => {
      const status = normalize(reminder.status);

      const due = dateKey(
        reminder.due_date || reminder.dueDate
      );

      if (completedStatuses.has(status)) {
        completed += 1;
        return;
      }

      if (cancelledStatuses.has(status)) {
        cancelled += 1;
        return;
      }

      const isOpen = pendingStatuses.has(status) || !status;

      if (isOpen) {
        pending += 1;

        if (due) {
          if (due < today) {
            overdue += 1;
          } else if (due === today) {
            dueToday += 1;
          } else {
            upcoming += 1;
          }
        }
      }
    });

    const total = safeReminders.length;
    const trackedRecords =
      safeInquiries.length + safeAppointments.length;

    const completionRate = percent(completed, total);
    const overdueRate = percent(overdue, total);
    const pendingRate = percent(pending, total);

    const coverageRate = trackedRecords
      ? Math.min(
          100,
          Math.round((total / trackedRecords) * 100)
        )
      : total
      ? 100
      : 0;

    const health = buildPerformanceHealth({
      completionRate,
      overdueRate,
      coverageRate,
      dueToday,
    });

    return {
      total,
      completed,
      pending,
      cancelled,
      overdue,
      dueToday,
      upcoming,
      trackedRecords,
      completionRate,
      overdueRate,
      pendingRate,
      coverageRate,
      health,
    };
  }, [safeReminders, safeInquiries, safeAppointments]);

  const statCards = [
    {
      label: "Total Follow-Ups",
      value: metrics.total,
      icon: CalendarCheck,
      helper: "All reminder records",
      tone: "navy",
    },
    {
      label: "Completed",
      value: metrics.completed,
      icon: CheckCircle2,
      helper: `${metrics.completionRate}% completion`,
      tone: "green",
    },
    {
      label: "Pending",
      value: metrics.pending,
      icon: Clock3,
      helper: `${metrics.pendingRate}% still open`,
      tone: "blue",
    },
    {
      label: "Due Today",
      value: metrics.dueToday,
      icon: Radar,
      helper: "Needs action today",
      tone: "orange",
    },
    {
      label: "Overdue",
      value: metrics.overdue,
      icon: AlertTriangle,
      helper: `${metrics.overdueRate}% overdue pressure`,
      tone: "danger",
    },
    {
      label: "Cancelled",
      value: metrics.cancelled,
      icon: ShieldCheck,
      helper: "Closed without completion",
      tone: "neutral",
    },
  ];

  return (
    <motion.section
      initial={
        reduceMotion
          ? false
          : { opacity: 0, y: 14 }
      }
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: reduceMotion ? 0 : 0.3,
        ease: [0.22, 1, 0.36, 1],
      }}
      className={`${cardClass} min-w-0 space-y-5 rounded-[2.15rem] border-[3px] border-[#123865] bg-[#FFF8EF] p-3 shadow-[0_20px_55px_rgba(18,56,101,0.12)] sm:p-4`}
    >
      <header className="min-w-0 overflow-hidden rounded-[1.8rem] border-[3px] border-[#FF5A0A] bg-white">
        <div className="grid min-w-0 xl:grid-cols-[minmax(0,1.3fr)_minmax(20rem,0.7fr)]">
          <div className="min-w-0 bg-[#123865] p-5 text-white sm:p-6 lg:p-7">
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <HeaderChip
                icon={TrendingUp}
                label="Follow-Up Performance"
              />

              <HeaderChip
                icon={UsersRound}
                label={`${metrics.trackedRecords} CRM Records`}
              />

              <span className="inline-flex max-w-full items-center rounded-full border-2 border-white/15 bg-white/5 px-3 py-1.5 text-[8px] font-black uppercase tracking-[0.1em] text-white">
                Read-only intelligence
              </span>
            </div>

            <h2 className="mt-4 max-w-4xl break-words text-2xl font-black leading-tight tracking-[-0.03em] text-white sm:text-3xl lg:text-[2.15rem]">
              Reminder Completion Intelligence
            </h2>

            <p className="mt-2 max-w-3xl break-words text-sm font-semibold leading-6 text-slate-100">
              Measure completion, overdue pressure, due-today workload,
              reminder coverage, and open follow-up discipline across
              inquiries and appointments.
            </p>

            <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
              <DarkMetric label="Follow-Ups" value={metrics.total} />
              <DarkMetric label="Pending" value={metrics.pending} />
              <DarkMetric label="Overdue" value={metrics.overdue} />
              <DarkMetric
                label="Coverage"
                value={`${metrics.coverageRate}%`}
              />
            </div>
          </div>

          <div className="min-w-0 border-t-[3px] border-[#FF5A0A] bg-[#FF5A0A] p-5 text-white sm:p-6 lg:p-7 xl:border-l-[3px] xl:border-t-0">
            <div className="flex items-center gap-2">
              <CircleGauge size={18} />

              <p className="text-[9px] font-black uppercase tracking-[0.12em] text-white">
                Follow-Up Health
              </p>
            </div>

            <div className="mt-4 flex items-end justify-between gap-4">
              <div className="min-w-0">
                <p className="text-5xl font-black leading-none text-white">
                  {metrics.health.score}
                </p>

                <p className="mt-2 break-words text-sm font-black uppercase tracking-[0.08em] text-white">
                  {metrics.health.label}
                </p>
              </div>

              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border-2 border-white/30 bg-white/10">
                <TrendingUp size={25} />
              </div>
            </div>

            <div className="mt-5 h-3 overflow-hidden rounded-full border-2 border-white/30 bg-white/10">
              <motion.div
                initial={
                  reduceMotion ? false : { width: 0 }
                }
                animate={{
                  width: `${metrics.health.score}%`,
                }}
                transition={{
                  duration: reduceMotion ? 0 : 0.65,
                  ease: [0.22, 1, 0.36, 1],
                }}
                className="h-full rounded-full bg-white"
              />
            </div>

            <p className="mt-4 break-words text-xs font-semibold leading-5 text-orange-50">
              {metrics.health.message}
            </p>
          </div>
        </div>
      </header>

      <section className="min-w-0 rounded-[1.7rem] border-[3px] border-[#C9D7E6] bg-white p-4 shadow-[0_10px_28px_rgba(18,56,101,0.05)] sm:p-5">
        <div className="mb-4 flex min-w-0 flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <p className="text-[9px] font-black uppercase tracking-[0.12em] text-orange-700">
              Performance Command
            </p>

            <h3 className="mt-1 text-xl font-black text-[#10233F]">
              Follow-up execution overview
            </h3>

            <p className="mt-1 max-w-3xl text-xs font-semibold leading-5 text-slate-600">
              A live operational reading of reminder volume, completion,
              pressure, coverage, and next-action exposure.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <SummaryPill label="Completed" value={metrics.completed} tone="green" />
            <SummaryPill label="Due today" value={metrics.dueToday} tone="orange" />
            <SummaryPill label="Overdue" value={metrics.overdue} tone="danger" />
          </div>
        </div>

        {metrics.total === 0 ? (
          <EmptyState
            trackedRecords={metrics.trackedRecords}
          />
        ) : (
          <div className="min-w-0 space-y-5">
            <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,10.5rem),1fr))] gap-3">
              {statCards.map((item, index) => (
                <StatCard
                  key={item.label}
                  item={item}
                  index={index}
                  reduceMotion={reduceMotion}
                />
              ))}
            </div>

            {metrics.overdue > 0 ? (
              <div
                role="alert"
                className="rounded-[1.4rem] border-[3px] border-[#FB7185] bg-[#FFF4F4] p-4 shadow-[0_7px_18px_rgba(190,24,93,0.06)]"
              >
                <div className="flex items-start gap-3">
                  <AlertTriangle
                    size={18}
                    className="mt-0.5 shrink-0 text-red-700"
                  />

                  <div className="min-w-0">
                    <p className="font-black text-[#10233F]">
                      Overdue follow-up pressure detected
                    </p>

                    <p className="mt-1 break-words text-sm font-semibold leading-6 text-slate-600">
                      {metrics.overdue} reminder
                      {metrics.overdue === 1 ? "" : "s"} are overdue.
                      Clear or reschedule these before adding more
                      follow-up workload.
                    </p>
                  </div>
                </div>
              </div>
            ) : null}

            <div className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
              <ProgressPanel
                title="Completion Progress"
                label={`${metrics.completed} of ${metrics.total} reminders completed`}
                value={metrics.completionRate}
                tone="orange"
                icon={CheckCircle2}
                reduceMotion={reduceMotion}
              />

              <ProgressPanel
                title="CRM Reminder Coverage"
                label={`${metrics.total} reminders across ${metrics.trackedRecords} CRM records`}
                value={metrics.coverageRate}
                tone="navy"
                icon={UsersRound}
                reduceMotion={reduceMotion}
              />
            </div>

            <div className="grid min-w-0 gap-4 md:grid-cols-3">
              <HealthSummary
                label="Due Today"
                value={metrics.dueToday}
                detail="Needs action before day-end."
                icon={Radar}
                tone="orange"
              />

              <HealthSummary
                label="Upcoming"
                value={metrics.upcoming}
                detail="Open reminders scheduled after today."
                icon={Clock3}
                tone="blue"
              />

              <HealthSummary
                label="Overdue Rate"
                value={`${metrics.overdueRate}%`}
                detail="Share of reminders currently overdue."
                icon={AlertTriangle}
                tone={metrics.overdue > 0 ? "danger" : "green"}
              />
            </div>

            <div className="rounded-[1.4rem] border-[3px] border-[#123865] bg-[#FFF8EF] p-4 shadow-[0_7px_18px_rgba(18,56,101,0.05)]">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border-2 border-[#123865] bg-[#123865] text-white">
                  <ShieldCheck size={18} />
                </div>

                <div className="min-w-0">
                  <p className="font-black text-[#10233F]">
                    Analytics scope
                  </p>

                  <p className="mt-1 break-words text-xs font-semibold leading-5 text-slate-600">
                    This panel reads reminder, inquiry, and appointment
                    data only. It does not mutate reminder state and does
                    not require a priority column. Operational actions
                    remain inside the CRM Follow-up Dashboard and reminder
                    workflows.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </section>
    </motion.section>
  );
}

function HeaderChip({ icon: Icon, label }) {
  return (
    <span className="inline-flex max-w-full items-center gap-1.5 rounded-full border-2 border-orange-300/30 bg-orange-400/10 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.1em] text-orange-200">
      <Icon size={11} className="shrink-0" />
      <span className="truncate">{label}</span>
    </span>
  );
}

function DarkMetric({ label, value }) {
  return (
    <div className="min-w-0 rounded-xl border-2 border-white/20 bg-white/10 p-3 text-white shadow-inner">
      <p className="break-words text-[8px] font-black uppercase leading-4 tracking-[0.08em] text-slate-200">
        {label}
      </p>

      <p className="mt-1 break-words text-xl font-black text-white">
        {value ?? 0}
      </p>
    </div>
  );
}

function SummaryPill({ label, value, tone = "navy" }) {
  const tones = {
    navy: "border-[#123865] bg-[#123865] text-white",
    green: "border-[#34D399] bg-[#F0FFF8] text-emerald-800",
    orange: "border-[#FF5A0A] bg-[#FFF4E8] text-orange-800",
    danger: "border-[#FB7185] bg-[#FFF4F4] text-red-800",
  };

  return (
    <span className={`inline-flex items-center gap-2 rounded-full border-2 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.08em] ${tones[tone] || tones.navy}`}>
      {label}
      <strong className="text-xs">{value}</strong>
    </span>
  );
}

function StatCard({
  item,
  index,
  reduceMotion,
}) {
  const Icon = item.icon;
  const style = getToneStyle(item.tone);
  const dark = item.tone === "navy";

  return (
    <motion.article
      initial={
        reduceMotion
          ? false
          : { opacity: 0, y: 10 }
      }
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: reduceMotion ? 0 : 0.25,
        delay: reduceMotion ? 0 : index * 0.035,
      }}
      className={`min-w-0 rounded-[1.35rem] border-[3px] p-4 shadow-[0_7px_20px_rgba(18,56,101,0.05)] transition hover:-translate-y-0.5 hover:shadow-md ${style}`}
    >
      <div className="flex min-w-0 items-start justify-between gap-3">
        <div className="min-w-0">
          <p className={`break-words text-[9px] font-black uppercase leading-4 tracking-[0.08em] ${dark ? "text-orange-200" : "text-slate-600"}`}>
            {item.label}
          </p>

          <p className={`mt-2 text-3xl font-black ${dark ? "text-white" : "text-[#10233F]"}`}>
            {item.value}
          </p>
        </div>

        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border-2 ${dark ? "border-white/20 bg-white/10 text-white" : "border-current/25 bg-white"}`}>
          <Icon size={17} />
        </div>
      </div>

      <p className={`mt-3 break-words text-xs font-semibold leading-5 ${dark ? "text-slate-200" : "text-slate-600"}`}>
        {item.helper}
      </p>
    </motion.article>
  );
}

function ProgressPanel({
  title,
  label,
  value,
  tone = "orange",
  icon: Icon,
  reduceMotion,
}) {
  const navy = tone === "navy";

  return (
    <div
      className={`min-w-0 rounded-[1.5rem] border-[3px] p-5 shadow-[0_10px_24px_rgba(18,56,101,0.06)] ${
        navy
          ? "border-[#123865] bg-[#F2F7FF]"
          : "border-[#FF5A0A] bg-[#FFF4E8]"
      }`}
    >
      <div className="flex min-w-0 items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="break-words text-sm font-black text-[#10233F]">
            {title}
          </p>

          <p className="mt-1 break-words text-xs font-semibold leading-5 text-slate-600">
            {label}
          </p>
        </div>

        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border-2 bg-white ${
            navy
              ? "border-[#123865] text-[#123865]"
              : "border-[#FF5A0A] text-orange-700"
          }`}
        >
          <Icon size={17} />
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between gap-3">
        <div className="h-3 flex-1 overflow-hidden rounded-full border-2 border-[#C9D7E6] bg-white">
          <motion.div
            initial={reduceMotion ? false : { width: 0 }}
            animate={{ width: `${value}%` }}
            transition={{
              duration: reduceMotion ? 0 : 0.65,
              ease: [0.22, 1, 0.36, 1],
            }}
            className={`h-full rounded-full ${
              navy ? "bg-[#123865]" : "bg-[#FF5A0A]"
            }`}
          />
        </div>

        <span className="min-w-[54px] text-right text-sm font-black text-[#10233F]">
          {value}%
        </span>
      </div>
    </div>
  );
}

function HealthSummary({
  label,
  value,
  detail,
  icon: Icon,
  tone = "orange",
}) {
  const style = getToneStyle(tone);

  return (
    <div
      className={`min-w-0 rounded-[1.35rem] border-[3px] p-4 shadow-[0_7px_18px_rgba(18,56,101,0.05)] ${style}`}
    >
      <div className="flex min-w-0 items-center justify-between gap-3">
        <p className="break-words text-[9px] font-black uppercase leading-4 tracking-[0.08em] text-slate-600">
          {label}
        </p>

        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border-2 border-[#123865]/15 bg-white text-[#123865]">
          <Icon size={16} />
        </div>
      </div>

      <p className="mt-2 text-3xl font-black text-[#10233F]">
        {value}
      </p>

      <p className="mt-2 break-words text-xs font-semibold leading-5 text-slate-600">
        {detail}
      </p>
    </div>
  );
}

function EmptyState({ trackedRecords }) {
  return (
    <div className="rounded-[1.6rem] border-[3px] border-dashed border-[#FF5A0A] bg-[#FFF8EF] p-8 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border-2 border-[#FF5A0A] bg-[#FFF4E8]">
        <CalendarCheck
          size={26}
          className="text-orange-600"
        />
      </div>

      <h3 className="mt-4 text-xl font-black text-[#10233F]">
        No follow-up performance data yet
      </h3>

      <p className="mx-auto mt-2 max-w-xl text-sm font-semibold leading-6 text-slate-600">
        {trackedRecords
          ? `${trackedRecords} CRM record${
              trackedRecords === 1 ? "" : "s"
            } are available, but no reminders have been created yet.`
          : "No reminder, inquiry, or appointment records are available yet."}
      </p>
    </div>
  );
}

function getToneStyle(tone = "") {
  if (tone === "navy") {
    return "border-[#123865] bg-[#123865]";
  }

  if (tone === "danger") {
    return "border-[#FB7185] bg-[#FFF4F4]";
  }

  if (tone === "green") {
    return "border-[#34D399] bg-[#F0FFF8]";
  }

  if (tone === "blue") {
    return "border-[#60A5FA] bg-[#F2F7FF]";
  }

  if (tone === "amber" || tone === "orange") {
    return "border-[#FF5A0A] bg-[#FFF4E8]";
  }

  return "border-[#C9D7E6] bg-[#FFFDF8]";
}

export default FollowUpPerformancePanel;
