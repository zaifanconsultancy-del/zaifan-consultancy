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
  Activity,
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
      activeLeads,
      totalLeads
    );

    const priorityShare = percent(
      priorityLeads,
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
      initial={reduceMotion ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: reduceMotion ? 0 : 0.26,
        ease: [0.22, 1, 0.36, 1],
      }}
      className={`${cardClass} min-w-0 space-y-5 rounded-[2rem] border-[3px] border-[#123865] bg-[#FFF8EF] p-4 text-[#10233F] shadow-[0_18px_50px_rgba(23,63,107,0.12)] sm:p-5`}
    >
      <header className="overflow-hidden rounded-[1.75rem] border-[3px] border-[#F97316]">
        <div className="grid xl:grid-cols-[minmax(0,1.25fr)_minmax(18rem,0.75fr)]">
          <div className="bg-[#123865] p-5 text-white sm:p-6">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-2 rounded-full border-2 border-orange-300/30 bg-orange-400/10 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.12em] text-orange-300">
                <BarChart3 size={12} />
                CRM KPI OS
              </span>

              <span className="inline-flex items-center gap-2 rounded-full border-2 border-white/15 bg-white/5 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.12em] text-white">
                <ShieldCheck size={12} />
                Deterministic Analytics
              </span>
            </div>

            <h2 className="mt-3 text-3xl font-black text-white">
              CRM Performance Command
            </h2>

            <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-200">
              One operating picture for CRM volume, engagement, outcomes,
              ownership, priority pressure and active workload—derived only
              from the inquiry and appointment records already loaded.
            </p>
          </div>

          <div className="bg-[#FF5A0A] p-5 text-white sm:p-6">
            <p className="text-[9px] font-black uppercase tracking-[0.12em]">
              Current Workspace
            </p>

            <p className="mt-2 text-2xl font-black">KPI Portfolio</p>

            <p className="mt-2 text-xs font-semibold leading-5 text-orange-50">
              Executive CRM snapshot with no fabricated targets, forecasts or
              AI claims.
            </p>

            <div className="mt-4 grid grid-cols-2 gap-2">
              <HeroMetric label="Tracked" value={model.totalLeads} />
              <HeroMetric label="Active" value={model.activeLeads} />
              <HeroMetric label="Outcomes" value={model.outcomeTotal} />
              <HeroMetric label="Unassigned" value={model.unassignedLeads} />
            </div>
          </div>
        </div>
      </header>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <PartnerMetricCard
          label="Total CRM Leads"
          value={model.totalLeads}
          helper={`${model.safeInquiries.length} inquiries · ${model.safeAppointments.length} appointments`}
          icon={Target}
          tone="navy"
          badge="CRM Context"
        />

        <PartnerMetricCard
          label="Engagement Rate"
          value={`${model.engagementRate}%`}
          helper={`${model.progressedTotal} records progressed beyond an initial stage`}
          icon={TrendingUp}
          tone={model.engagementRate >= 60 ? "green" : "blue"}
          badge="Progression"
        />

        <PartnerMetricCard
          label="Outcome Rate"
          value={`${model.outcomeRate}%`}
          helper={`${model.outcomeTotal} approved, completed or converted outcomes`}
          icon={CheckCircle2}
          tone={model.outcomeRate >= 35 ? "green" : "amber"}
          badge="Outcomes"
        />

        <PartnerMetricCard
          label="Assigned Rate"
          value={`${model.assignedRate}%`}
          helper={`${model.assignedLeads} active records have clear ownership`}
          icon={UserCheck}
          tone={model.assignedRate >= 90 ? "green" : "blue"}
          badge="Ownership"
        />
      </div>

      <section className="rounded-[1.5rem] border-[3px] border-[#C9D7E6] bg-white p-4 sm:p-5">
        <div className="mb-4">
          <p className="text-[9px] font-black uppercase tracking-[0.11em] text-orange-700">
            CRM Command
          </p>

          <h3 className="mt-1 text-xl font-black text-[#10233F]">
            Operating KPI portfolio
          </h3>

          <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">
            A compact evidence workspace replacing the old eight-card dashboard.
          </p>
        </div>

        <div className="space-y-2.5">
          <KpiEvidenceRow
            label="Active Workload"
            value={model.activeLeads}
            status={`${model.activeRate}% active`}
            detail={`${model.inactiveLeads} records are inactive or terminal`}
            icon={Zap}
            tone="blue"
          />

          <KpiEvidenceRow
            label="Priority Pressure"
            value={model.priorityLeads}
            status={`${model.priorityShare}% of active`}
            detail={`${model.vipLeads} VIP · ${model.highLeads} high or urgent`}
            icon={Crown}
            tone={model.priorityLeads ? "amber" : "green"}
          />

          <KpiEvidenceRow
            label="Ownership Gap"
            value={model.unassignedLeads}
            status={
              model.unassignedLeads
                ? "Action required"
                : "Ownership complete"
            }
            detail={
              model.unassignedLeads
                ? "Active records without a clear counselor or owner"
                : "Every active record currently has ownership"
            }
            icon={Users}
            tone={model.unassignedLeads ? "red" : "green"}
          />

          <KpiEvidenceRow
            label="CRM KPI Health"
            value={`${model.healthScore}%`}
            status={health.label}
            detail="Weighted engagement, outcomes, ownership and active workload"
            icon={Gauge}
            tone={
              model.healthScore >= 75
                ? "green"
                : model.healthScore >= 50
                  ? "amber"
                  : "red"
            }
          />
        </div>
      </section>

      <div className="grid gap-3 lg:grid-cols-3">
        <IntegrityCard
          icon={ShieldCheck}
          eyebrow="Analytics Integrity"
          title="Read-only CRM evidence"
          helper="No Supabase writes, targets or AI recommendations are introduced."
          tone="green"
        />

        <IntegrityCard
          icon={Activity}
          eyebrow="Progression Boundary"
          title={`${model.progressedTotal} progressed records`}
          helper="Progression comes only from recognized inquiry and appointment stages."
          tone="blue"
        />

        <IntegrityCard
          icon={AlertTriangle}
          eyebrow="Ownership Pressure"
          title={`${model.unassignedLeads} unassigned active records`}
          helper="This remains visible as operational pressure instead of being hidden in a secondary card."
          tone={model.unassignedLeads ? "amber" : "green"}
        />
      </div>
    </motion.section>
  );
}


function HeroMetric({ label, value }) {
  return (
    <div className="rounded-xl border-2 border-white/25 bg-white/10 p-3">
      <p className="text-[8px] font-black uppercase tracking-[0.1em] text-orange-50">
        {label}
      </p>
      <p className="mt-1 text-lg font-black text-white">{value}</p>
    </div>
  );
}

function PartnerMetricCard({
  label,
  value,
  helper,
  icon: Icon,
  tone = "blue",
  badge = "",
}) {
  const tones = {
    navy: "border-[#123865] bg-[#123865]",
    blue: "border-[#60A5FA] bg-[#F2F7FF]",
    green: "border-[#34D399] bg-[#F0FFF8]",
    amber: "border-[#F59E0B] bg-[#FFF8E8]",
    red: "border-[#FB7185] bg-[#FFF4F4]",
  };

  const dark = tone === "navy";

  return (
    <article
      className={`flex min-h-[176px] h-full flex-col justify-between rounded-[1.4rem] border-[3px] p-4 shadow-[0_7px_20px_rgba(15,35,63,0.05)] ${
        tones[tone] || tones.blue
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p
            className={`text-[9px] font-black uppercase tracking-[0.11em] ${
              dark ? "text-orange-300" : "text-slate-500"
            }`}
          >
            {label}
          </p>

          <p
            className={`mt-2 break-words text-2xl font-black ${
              dark ? "text-white" : "text-[#10233F]"
            }`}
          >
            {value}
          </p>
        </div>

        <div
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border-2 ${
            dark
              ? "border-white/20 bg-white/10 text-orange-200"
              : "border-[#123865]/15 bg-white text-[#123865]"
          }`}
        >
          <Icon size={16} />
        </div>
      </div>

      <div>
        <p
          className={`mt-4 text-xs font-semibold leading-5 ${
            dark ? "text-slate-200" : "text-slate-600"
          }`}
        >
          {helper}
        </p>

        {badge ? (
          <span
            className={`mt-3 inline-flex rounded-full border-2 px-2.5 py-1 text-[8px] font-black uppercase tracking-[0.08em] ${
              dark
                ? "border-white/20 bg-white/10 text-white"
                : "border-[#C9D7E6] bg-white text-slate-600"
            }`}
          >
            {badge}
          </span>
        ) : null}
      </div>
    </article>
  );
}

function KpiEvidenceRow({
  label,
  value,
  status,
  detail,
  icon: Icon,
  tone = "blue",
}) {
  const tones = {
    blue: "border-[#60A5FA] bg-[#F2F7FF] text-blue-700",
    green: "border-[#34D399] bg-[#F0FFF8] text-emerald-700",
    amber: "border-[#F59E0B] bg-[#FFF8E8] text-amber-800",
    red: "border-[#FB7185] bg-[#FFF4F4] text-red-700",
  };

  return (
    <article className="grid min-w-0 gap-3 rounded-[1.25rem] border-2 border-[#C9D7E6] bg-white p-4 md:grid-cols-[minmax(14rem,1.35fr)_8rem_10rem_minmax(14rem,1fr)] md:items-center">
      <div className="flex min-w-0 items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border-2 border-[#F97316] bg-[#FFF4EA] text-orange-700">
          <Icon size={17} />
        </div>
        <div className="min-w-0">
          <p className="font-black text-[#10233F]">{label}</p>
          <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">
            {detail}
          </p>
        </div>
      </div>

      <div className="min-w-0 rounded-xl border border-[#E1E8F0] bg-[#FFF8EF] px-3 py-2.5">
        <p className="text-[7px] font-black uppercase tracking-[0.09em] text-slate-500">
          Current
        </p>
        <p className="mt-1 text-sm font-black text-[#10233F]">{value}</p>
      </div>

      <span
        className={`inline-flex max-w-full justify-center rounded-full border-2 px-2.5 py-1.5 text-center text-[8px] font-black uppercase tracking-[0.07em] ${
          tones[tone] || tones.blue
        }`}
      >
        {status}
      </span>

      <div className="min-w-0 rounded-xl border border-[#E1E8F0] bg-[#F7FAFC] px-3 py-2.5">
        <p className="text-[7px] font-black uppercase tracking-[0.09em] text-slate-500">
          Evidence
        </p>
        <p className="mt-1 text-xs font-black text-[#10233F]">
          Live inquiry + appointment snapshot
        </p>
      </div>
    </article>
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
