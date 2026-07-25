// CrmKpiAnalytics V5 MAXIMUM — Executive CRM KPI Intelligence + Framed Hero
// src/components/admin/CrmKpiAnalytics.jsx
//
// Maximum pass:
// - preserves cardClass / inquiries / appointments API
// - safer inquiry + appointment normalization
// - stronger assignment detection across common ownership fields
// - separates inquiry progression from appointment completion
// - adds active/inactive workload awareness
// - adds ownership, priority, engagement and outcome KPIs
// - replaces emoji icons with Lucide icons
// - reduced-motion support
// - explicit white text on navy surfaces
// - stronger responsive/mobile behavior
// - no fake GPT/AI claim; deterministic CRM analytics only
// - read-only analytics layer: no Supabase writes invented

import { motion, useReducedMotion } from "framer-motion";
import {
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  Crown,
  Gauge,
  ShieldCheck,
  Target,
  TrendingUp,
  UserCheck,
  Users,
  Zap,
} from "lucide-react";
import { useMemo } from "react";

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

function normalize(value = "") {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[_-]+/g, " ");
}

function clamp(value, min = 0, max = 100) {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return min;
  }

  return Math.min(max, Math.max(min, number));
}

function percent(numerator, denominator) {
  const top = Number(numerator) || 0;
  const bottom = Number(denominator) || 0;

  if (bottom <= 0) return 0;

  return clamp(Math.round((top / bottom) * 100));
}

function isAssigned(item = {}) {
  return Boolean(
    item.assigned_admin_id ||
      item.assigned_to ||
      item.counselor_id ||
      item.owner_id ||
      item.assigned_counselor_id
  );
}

function isPriority(item = {}) {
  return ["vip", "high", "urgent", "critical"].includes(
    normalize(item.priority)
  );
}

function getInquiryStatus(item = {}) {
  return normalize(
    item.status ||
      item.pipeline_stage ||
      "new"
  );
}

function getAppointmentStatus(item = {}) {
  return normalize(
    item.appointment_stage ||
      item.status ||
      "pending"
  );
}

function isInquiryProgressed(item = {}) {
  const status = getInquiryStatus(item);

  return [
    "contacted",
    "documents pending",
    "applied",
    "offer letter",
    "visa process",
    "approved",
  ].some((token) => status.includes(token));
}

function isInquiryOutcome(item = {}) {
  const status = getInquiryStatus(item);

  return (
    status === "approved" ||
    status.includes("visa approved") ||
    status.includes("completed")
  );
}

function isAppointmentProgressed(item = {}) {
  const status = getAppointmentStatus(item);

  return [
    "confirmed",
    "consultation done",
    "completed",
    "converted to lead",
  ].some((token) => status.includes(token));
}

function isAppointmentOutcome(item = {}) {
  const status = getAppointmentStatus(item);

  return (
    status === "completed" ||
    status.includes("consultation done") ||
    status.includes("converted to lead")
  );
}

function isInactive(item = {}) {
  const status = normalize(
    item.status ||
      item.pipeline_stage ||
      item.appointment_stage
  );

  return [
    "cancelled",
    "canceled",
    "rejected",
    "closed",
    "not interested",
  ].some((token) => status.includes(token));
}

function CrmKpiAnalytics({
  cardClass = "",
  inquiries = [],
  appointments = [],
}) {
  const reduceMotion = useReducedMotion();

  const model = useMemo(() => {
    const safeInquiries = safeArray(inquiries);
    const safeAppointments = safeArray(appointments);

    const allLeads = [
      ...safeInquiries.map((item) => ({
        ...item,
        __type: "inquiry",
      })),
      ...safeAppointments.map((item) => ({
        ...item,
        __type: "appointment",
      })),
    ];

    const totalLeads = allLeads.length;

    let activeLeads = 0;
    let assignedLeads = 0;
    let priorityLeads = 0;
    let vipLeads = 0;
    let progressedInquiries = 0;
    let inquiryOutcomes = 0;
    let progressedAppointments = 0;
    let appointmentOutcomes = 0;

    for (const item of safeInquiries) {
      if (isInquiryProgressed(item)) progressedInquiries += 1;
      if (isInquiryOutcome(item)) inquiryOutcomes += 1;

      if (!isInactive(item)) {
        activeLeads += 1;
        if (isAssigned(item)) assignedLeads += 1;

        if (isPriority(item)) {
          priorityLeads += 1;
          if (normalize(item.priority) === "vip") vipLeads += 1;
        }
      }
    }

    for (const item of safeAppointments) {
      if (isAppointmentProgressed(item)) progressedAppointments += 1;
      if (isAppointmentOutcome(item)) appointmentOutcomes += 1;

      if (!isInactive(item)) {
        activeLeads += 1;
        if (isAssigned(item)) assignedLeads += 1;

        if (isPriority(item)) {
          priorityLeads += 1;
          if (normalize(item.priority) === "vip") vipLeads += 1;
        }
      }
    }

    const inactiveLeads = totalLeads - activeLeads;
    const unassignedLeads = activeLeads - assignedLeads;
    const highLeads = priorityLeads - vipLeads;

    const progressedTotal =
      progressedInquiries + progressedAppointments;

    const outcomeTotal =
      inquiryOutcomes + appointmentOutcomes;

    const engagementRate = percent(
      progressedTotal,
      totalLeads
    );

    const outcomeRate = percent(
      outcomeTotal,
      totalLeads
    );

    const assignedRate = percent(
      assignedLeads,
      activeLeads
    );

    const activeRate = percent(
      activeLeads.length,
      totalLeads
    );

    const priorityShare = percent(
      priorityLeads.length,
      activeLeads
    );

    const healthScore = totalLeads
      ? clamp(
          Math.round(
            engagementRate * 0.3 +
              outcomeRate * 0.25 +
              assignedRate * 0.3 +
              activeRate * 0.15
          ),
          0,
          100
        )
      : 0;

    return {
      safeInquiries,
      safeAppointments,
      totalLeads,
      activeLeads,
      inactiveLeads,
      progressedInquiries,
      inquiryOutcomes,
      progressedAppointments,
      appointmentOutcomes,
      assignedLeads,
      unassignedLeads,
      priorityLeads,
      vipLeads,
      highLeads,
      progressedTotal,
      outcomeTotal,
      engagementRate,
      outcomeRate,
      assignedRate,
      activeRate,
      priorityShare,
      healthScore,
    };
  }, [inquiries, appointments]);

  const kpis = [
    {
      label: "Total CRM Leads",
      value: model.totalLeads,
      helper: `${model.safeInquiries.length} inquiries · ${model.safeAppointments.length} appointments`,
      icon: Target,
      tone: "orange",
    },
    {
      label: "Engagement Rate",
      value: `${model.engagementRate}%`,
      helper: `${model.progressedTotal} records moved beyond an initial stage`,
      icon: TrendingUp,
      tone: model.engagementRate >= 60 ? "green" : "blue",
    },
    {
      label: "Outcome Rate",
      value: `${model.outcomeRate}%`,
      helper: `${model.outcomeTotal} approved/completed/converted outcomes`,
      icon: CheckCircle2,
      tone: model.outcomeRate >= 35 ? "green" : "orange",
    },
    {
      label: "Assigned Rate",
      value: `${model.assignedRate}%`,
      helper: `${model.assignedLeads} active records have clear ownership`,
      icon: UserCheck,
      tone: model.assignedRate >= 90 ? "green" : "blue",
    },
    {
      label: "Priority Leads",
      value: model.priorityLeads,
      helper: `${model.vipLeads} VIP · ${model.highLeads} High/Urgent`,
      icon: Crown,
      tone: "amber",
    },
    {
      label: "Unassigned",
      value: model.unassignedLeads,
      helper:
        model.unassignedLeads > 0
          ? "Active records without a clear owner"
          : "All active records have ownership",
      icon: Users,
      tone: model.unassignedLeads > 0 ? "red" : "green",
    },
    {
      label: "Active Workload",
      value: model.activeLeads,
      helper: `${model.activeRate}% of tracked CRM records are active`,
      icon: Zap,
      tone: "orange",
    },
    {
      label: "CRM KPI Health",
      value: `${model.healthScore}%`,
      helper:
        model.totalLeads > 0
          ? "Weighted engagement, outcomes, ownership, and active workload"
          : "Waiting for CRM data",
      icon: Gauge,
      tone:
        model.healthScore >= 75
          ? "green"
          : model.healthScore >= 50
          ? "orange"
          : "red",
    },
  ];

  const health = getHealthConfig(
    model.healthScore,
    model.totalLeads
  );

  return (
    <motion.section
      key="crm-kpi-analytics"
      initial={
        reduceMotion
          ? false
          : { opacity: 0, y: 14 }
      }
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: reduceMotion ? 0 : 0.28,
        ease: [0.22, 1, 0.36, 1],
      }}
      className="space-y-5"
    >
      <section
        className={`${cardClass} overflow-hidden rounded-[2rem] border-[3px] border-[#C9D7E6] bg-[#FFFDF8] p-3 shadow-[0_16px_42px_rgba(15,35,63,0.08)] sm:p-4`}
      >
        <div className="grid min-w-0 overflow-hidden rounded-[1.65rem] border-[3px] border-[#F97316] xl:grid-cols-[minmax(0,1.18fr)_minmax(20rem,0.82fr)]">
          <div className="min-w-0 bg-[#173F6B] p-5 text-white sm:p-6">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-2 rounded-full border-2 border-white/20 bg-white/10 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.14em] text-white">
                <BarChart3 size={12} />
                Executive CRM Intelligence
              </span>

              <span className="inline-flex items-center gap-2 rounded-full border-2 border-white/20 bg-white/10 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.14em] text-white">
                <ShieldCheck size={12} />
                Live CRM Snapshot
              </span>
            </div>

            <h2 className="mt-4 break-words text-2xl font-black leading-tight tracking-tight text-white sm:text-3xl">
              KPI Analytics
            </h2>

            <p className="mt-2 max-w-3xl break-words text-sm font-semibold leading-6 text-white">
              High-level CRM performance across student volume, engagement,
              outcomes, ownership, priority workload, and active case health.
            </p>

            <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
              <DarkMetric
                label="Tracked"
                value={model.totalLeads}
              />
              <DarkMetric
                label="Active"
                value={model.activeLeads}
              />
              <DarkMetric
                label="Outcomes"
                value={model.outcomeTotal}
              />
              <DarkMetric
                label="Unassigned"
                value={model.unassignedLeads}
              />
            </div>
          </div>

          <div className="min-w-0 border-t-[3px] border-[#F97316] bg-[#E96512] p-5 text-white sm:p-6 xl:border-l-[3px] xl:border-t-0">
            <p className="text-[9px] font-black uppercase tracking-[0.15em] text-white">
              KPI Health
            </p>

            <div className="mt-3 flex items-end gap-3">
              <p className="text-5xl font-black text-white">
                {model.healthScore}
              </p>

              <p className="pb-1 text-xs font-black uppercase tracking-[0.1em] text-white">
                {health.label}
              </p>
            </div>

            <div className="mt-4 h-3 overflow-hidden rounded-full border border-white/25 bg-white/10">
              <motion.div
                initial={
                  reduceMotion
                    ? false
                    : { width: 0 }
                }
                animate={{
                  width: `${model.healthScore}%`,
                }}
                transition={{
                  duration: reduceMotion ? 0 : 0.65,
                }}
                className="h-full rounded-full bg-white"
              />
            </div>

            <p className="mt-4 text-xs font-semibold leading-5 text-white">
              {health.message}
            </p>
          </div>
        </div>
      </section>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((item, index) => (
          <KpiCard
            key={item.label}
            item={item}
            index={index}
            reduceMotion={reduceMotion}
          />
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <PipelineBreakdown
          title="Inquiry Pipeline"
          subtitle="Progress and successful outcomes from inquiry records"
          total={model.safeInquiries.length}
          progressed={model.progressedInquiries}
          outcomes={model.inquiryOutcomes}
          tone="orange"
        />

        <PipelineBreakdown
          title="Appointment Pipeline"
          subtitle="Confirmation/completion movement from appointment records"
          total={model.safeAppointments.length}
          progressed={model.progressedAppointments}
          outcomes={model.appointmentOutcomes}
          tone="blue"
        />
      </div>

      <MethodologyNote />
    </motion.section>
  );
}

function KpiCard({
  item,
  index,
  reduceMotion,
}) {
  const Icon = item.icon;
  const style = getToneStyle(item.tone);

  return (
    <motion.article
      initial={
        reduceMotion
          ? false
          : { opacity: 0, y: 10 }
      }
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: reduceMotion ? 0 : 0.22,
        delay: reduceMotion ? 0 : index * 0.03,
      }}
      className={`rounded-[1.4rem] border-[3px] p-4 shadow-[0_8px_22px_rgba(15,35,63,0.04)] ${style.card}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[9px] font-black uppercase tracking-[0.13em]">
            {item.label}
          </p>

          <p className="mt-2 text-3xl font-black text-[#10233f]">
            {item.value}
          </p>
        </div>

        <div
          className={`flex h-10 w-10 items-center justify-center rounded-xl border-2 bg-white ${style.icon}`}
        >
          <Icon size={17} />
        </div>
      </div>

      <p className="mt-2 text-xs font-semibold leading-5 text-slate-600">
        {item.helper}
      </p>
    </motion.article>
  );
}

function PipelineBreakdown({
  title,
  subtitle,
  total,
  progressed,
  outcomes,
  tone = "orange",
}) {
  const progressedRate = percent(progressed, total);
  const outcomeRate = percent(outcomes, total);

  const accent =
    tone === "blue"
      ? "border-blue-300 bg-blue-50"
      : "border-orange-300 bg-orange-50";

  return (
    <section className={`rounded-[1.6rem] border-[3px] p-5 ${accent}`}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-[9px] font-black uppercase tracking-[0.12em] text-slate-600">
            Pipeline Breakdown
          </p>

          <h3 className="mt-1 text-xl font-black text-[#10233f]">
            {title}
          </h3>

          <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">
            {subtitle}
          </p>
        </div>

        <span className="rounded-full border-2 border-slate-300 bg-white px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.1em] text-slate-600">
          {total} records
        </span>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <SmallMetric
          label="Tracked"
          value={total}
        />

        <SmallMetric
          label="Progressed"
          value={`${progressedRate}%`}
        />

        <SmallMetric
          label="Outcome"
          value={`${outcomeRate}%`}
        />
      </div>

      <div className="mt-4">
        <div className="mb-2 flex items-center justify-between gap-3">
          <span className="text-[9px] font-black uppercase tracking-[0.1em] text-slate-500">
            Progressed share
          </span>

          <span className="text-xs font-black text-[#10233f]">
            {progressed}/{total}
          </span>
        </div>

        <div className="h-2.5 overflow-hidden rounded-full border border-slate-200 bg-white">
          <div
            className={`h-full rounded-full ${
              tone === "blue"
                ? "bg-blue-500"
                : "bg-orange-500"
            }`}
            style={{
              width: `${progressedRate}%`,
            }}
          />
        </div>
      </div>
    </section>
  );
}

function SmallMetric({
  label,
  value,
}) {
  return (
    <div className="rounded-xl border-2 border-slate-300 bg-white p-3 text-center">
      <p className="text-[8px] font-black uppercase tracking-[0.1em] text-slate-500">
        {label}
      </p>

      <p className="mt-1 text-xl font-black text-[#10233f]">
        {value}
      </p>
    </div>
  );
}

function DarkMetric({
  label,
  value,
}) {
  return (
    <div className="min-w-0 rounded-xl border-2 border-white/30 bg-white/10 p-3 text-white">
      <p className="text-[8px] font-black uppercase tracking-[0.1em] text-white">
        {label}
      </p>

      <p className="mt-1 text-xl font-black text-white">
        {value}
      </p>
    </div>
  );
}

function MethodologyNote() {
  return (
    <div className="rounded-[1.45rem] border-[3px] border-blue-300 bg-blue-50 p-4">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border-2 border-blue-300 bg-white text-blue-700">
          <AlertTriangle size={17} />
        </div>

        <div>
          <p className="text-sm font-black text-[#10233f]">
            KPI methodology
          </p>

          <p className="mt-1 text-xs font-semibold leading-5 text-slate-700">
            Engagement means a record has moved beyond its initial stage.
            Outcome rate counts approved/completed/converted records. KPI Health
            combines engagement, outcomes, ownership, and active workload. It is
            an operational snapshot, not a guaranteed business or visa-success
            metric.
          </p>
        </div>
      </div>
    </div>
  );
}

function getToneStyle(tone) {
  const styles = {
    red: {
      card: "border-red-300 bg-red-50 text-red-800",
      icon: "border-red-300 text-red-700",
    },
    amber: {
      card: "border-amber-300 bg-amber-50 text-amber-900",
      icon: "border-amber-300 text-amber-800",
    },
    blue: {
      card: "border-blue-300 bg-blue-50 text-blue-800",
      icon: "border-blue-300 text-blue-700",
    },
    green: {
      card: "border-emerald-300 bg-emerald-50 text-emerald-800",
      icon: "border-emerald-300 text-emerald-700",
    },
    orange: {
      card: "border-orange-300 bg-orange-50 text-orange-800",
      icon: "border-orange-300 text-orange-700",
    },
  };

  return styles[tone] || styles.orange;
}

function getHealthConfig(score, totalLeads) {
  if (totalLeads === 0) {
    return {
      label: "No Data",
      message:
        "KPI health will activate once inquiry or appointment records are available.",
    };
  }

  if (score >= 80) {
    return {
      label: "Excellent",
      message:
        "CRM engagement, ownership, and outcome signals are currently strong.",
    };
  }

  if (score >= 60) {
    return {
      label: "Healthy",
      message:
        "CRM performance is generally healthy, with some room to improve ownership or progression.",
    };
  }

  if (score >= 40) {
    return {
      label: "Needs Attention",
      message:
        "CRM performance needs attention. Review unassigned records, early-stage stagnation, and weak outcomes.",
    };
  }

  return {
    label: "Critical",
    message:
      "The CRM snapshot shows weak progression or ownership coverage. Prioritize cleanup before adding more workload.",
  };
}

export default CrmKpiAnalytics;
