// CounselorPerformanceAI V4 MAXIMUM — Counselor Intelligence & Performance OS
// src/components/admin/CounselorPerformanceAI.jsx
//
// Maximum pass:
// - preserves inquiries / appointments API
// - keeps this as deterministic local intelligence (no fake GPT claim)
// - safer counselor assignment detection
// - separates workload, outcome, priority ownership and data quality
// - avoids raw lead-volume domination in the score
// - adds explainable score reasons
// - adds team averages and performance tiers
// - flags overload / low conversion / weak contactability
// - distinguishes inquiry vs appointment outcomes
// - reduced-motion support
// - explicit white text on navy surfaces
// - stronger Zaifan Admin OS hierarchy
// - mobile-safe ranked team layout

import { motion, useReducedMotion } from "framer-motion";
import {
  AlertTriangle,
  BadgeCheck,
  BarChart3,
  Crown,
  Gauge,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
  UserCheck,
  Users,
} from "lucide-react";
import { useMemo } from "react";

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

function safeNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function normalize(value = "") {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[_-]+/g, " ");
}

function percent(numerator, denominator) {
  const top = safeNumber(numerator);
  const bottom = safeNumber(denominator);

  if (bottom <= 0) return 0;

  return Math.max(
    0,
    Math.min(100, Math.round((top / bottom) * 100))
  );
}

function getCounselorName(lead = {}) {
  return (
    lead.assigned_admin_name ||
    lead.assigned_counselor_name ||
    lead.counselor_name ||
    lead.owner_name ||
    ""
  );
}

function isAssigned(lead = {}) {
  return Boolean(
    getCounselorName(lead) ||
      lead.assigned_admin_id ||
      lead.assigned_to ||
      lead.counselor_id ||
      lead.owner_id
  );
}

function getOutcomeStatus(lead = {}) {
  return normalize(
    lead.status ||
      lead.pipeline_stage ||
      lead.appointment_stage ||
      ""
  );
}

function isConverted(lead = {}) {
  const status = getOutcomeStatus(lead);

  return [
    "approved",
    "converted",
    "completed",
    "confirmed",
    "offer letter",
    "visa process",
    "visa approved",
    "consultation done",
    "converted to lead",
  ].some((token) => status.includes(token));
}

function isVip(lead = {}) {
  return ["vip", "high", "urgent", "critical"].includes(
    normalize(lead.priority)
  );
}

function hasContact(lead = {}) {
  return Boolean(
    lead.phone ||
      lead.phone_number ||
      lead.whatsapp ||
      lead.email
  );
}

function buildCounselorRecord(name, leads) {
  const total = leads.length;
  let converted = 0;
  let vip = 0;
  let contactable = 0;
  let inquiryCount = 0;

  for (const lead of leads) {
    if (isConverted(lead)) converted += 1;
    if (isVip(lead)) vip += 1;
    if (hasContact(lead)) contactable += 1;

    const type = normalize(
      lead.student_type ||
        lead.__leadType ||
        lead.type
    );

    if (
      type
        ? type.includes("inquiry")
        : !lead.appointment_date
    ) {
      inquiryCount += 1;
    }
  }

  const appointmentCount = total - inquiryCount;

  const conversionRate = percent(converted, total);
  const contactabilityRate = percent(contactable, total);
  const vipShare = percent(vip, total);

  // Balanced local scoring: outcomes matter most, volume helps but is capped.
  const workloadScore = Math.min(25, total * 3);
  const outcomeScore = Math.round(conversionRate * 0.45);
  const contactabilityScore = Math.round(contactabilityRate * 0.15);
  const vipOwnershipScore = Math.min(15, Math.round(vipShare * 0.15));

  const score = Math.max(
    0,
    Math.min(
      100,
      workloadScore +
        outcomeScore +
        contactabilityScore +
        vipOwnershipScore
    )
  );

  const reasons = [];
  const warnings = [];

  if (conversionRate >= 60) {
    reasons.push("Strong conversion");
  }

  if (contactabilityRate >= 90) {
    reasons.push("Strong contactability");
  }

  if (vip > 0) {
    reasons.push(`${vip} VIP/high-priority lead${vip === 1 ? "" : "s"}`);
  }

  if (total >= 8) {
    reasons.push("Meaningful workload");
  }

  if (conversionRate < 25 && total >= 4) {
    warnings.push("Low conversion");
  }

  if (contactabilityRate < 70 && total >= 3) {
    warnings.push("Contact data gaps");
  }

  if (total >= 15) {
    warnings.push("Heavy workload");
  }

  return {
    name,
    leads: total,
    converted,
    vip,
    contactable,
    inquiryCount,
    appointmentCount,
    conversionRate,
    contactabilityRate,
    vipShare,
    score,
    reasons,
    warnings,
  };
}

function CounselorPerformanceAI({
  inquiries = [],
  appointments = [],
}) {
  const reduceMotion = useReducedMotion();

  const model = useMemo(() => {
    const allLeads = [
      ...safeArray(inquiries).map((lead) => ({
        ...lead,
        __leadType: "inquiry",
      })),
      ...safeArray(appointments).map((lead) => ({
        ...lead,
        __leadType: "appointment",
      })),
    ];

    const assigned = allLeads.filter(isAssigned);

    const grouped = assigned.reduce((accumulator, lead) => {
      const name = getCounselorName(lead) || "Assigned Counselor";

      if (!accumulator[name]) {
        accumulator[name] = [];
      }

      accumulator[name].push(lead);

      return accumulator;
    }, {});

    const counselors = Object.entries(grouped)
      .map(([name, leads]) => buildCounselorRecord(name, leads))
      .sort((a, b) => {
        if (b.score !== a.score) {
          return b.score - a.score;
        }

        if (b.conversionRate !== a.conversionRate) {
          return b.conversionRate - a.conversionRate;
        }

        return b.leads - a.leads;
      });

    let assignedCount = 0;
    let vipOwned = 0;
    let convertedCount = 0;
    let scoreTotal = 0;
    let conversionTotal = 0;

    for (const item of counselors) {
      assignedCount += item.leads;
      vipOwned += item.vip;
      convertedCount += item.converted;
      scoreTotal += item.score;
      conversionTotal += item.conversionRate;
    }

    const averageScore = counselors.length
      ? Math.round(scoreTotal / counselors.length)
      : 0;

    const averageConversion = counselors.length
      ? Math.round(conversionTotal / counselors.length)
      : 0;

    const unassignedCount = allLeads.length - assigned.length;

    return {
      allLeads,
      counselors,
      assignedCount,
      vipOwned,
      convertedCount,
      averageScore,
      averageConversion,
      unassignedCount,
    };
  }, [inquiries, appointments]);

  return (
    <motion.section
      initial={reduceMotion ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reduceMotion ? 0 : 0.28 }}
      className="space-y-5"
    >
      <section className="overflow-hidden rounded-[2rem] border-[3px] border-orange-300 bg-white shadow-[0_16px_42px_rgba(15,35,63,0.07)]">
        <div className="grid xl:grid-cols-[1.18fr_0.82fr]">
          <div className="bg-[#123865] p-5 text-white sm:p-6">
            <div className="flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-2 rounded-full border-2 border-white/20 bg-white/10 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.14em] text-white">
                <Sparkles size={12} />
                Counselor Intelligence
              </span>

              <span className="inline-flex items-center gap-2 rounded-full border-2 border-white/20 bg-white/10 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.14em] text-white">
                <ShieldCheck size={12} />
                Local Scoring Engine
              </span>
            </div>

            <h2 className="mt-4 text-2xl font-black tracking-tight text-white sm:text-3xl">
              Counselor Performance Intelligence
            </h2>

            <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-white">
              Compare workload, conversion handling, priority ownership and
              contactability across live inquiry and appointment assignments.
            </p>

            <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
              <DarkMetric
                label="Counselors"
                value={model.counselors.length}
              />
              <DarkMetric
                label="Assigned"
                value={model.assignedCount}
              />
              <DarkMetric
                label="Converted"
                value={model.convertedCount}
              />
              <DarkMetric
                label="VIP Owned"
                value={model.vipOwned}
              />
            </div>
          </div>

          <div className="bg-orange-500 p-5 text-white sm:p-6">
            <p className="text-[9px] font-black uppercase tracking-[0.15em] text-white">
              Team Signal
            </p>

            <p className="mt-3 text-5xl font-black text-white">
              {model.averageScore}
            </p>

            <p className="mt-1 text-xs font-black uppercase tracking-[0.1em] text-white">
              average performance score
            </p>

            <div className="mt-4 grid grid-cols-2 gap-2">
              <OrangeMetric
                label="Avg Conversion"
                value={`${model.averageConversion}%`}
              />
              <OrangeMetric
                label="Unassigned"
                value={model.unassignedCount}
              />
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Metric
          icon={Users}
          label="Counselors"
          value={model.counselors.length}
          helper="Counselors with active assignments"
          tone="blue"
        />

        <Metric
          icon={Target}
          label="Assigned Leads"
          value={model.assignedCount}
          helper="Inquiry + appointment workload"
          tone="orange"
        />

        <Metric
          icon={Crown}
          label="VIP / High Owned"
          value={model.vipOwned}
          helper="Priority student ownership"
          tone="amber"
        />

        <Metric
          icon={TrendingUp}
          label="Advanced / Converted"
          value={model.convertedCount}
          helper="Students at meaningful later stages"
          tone="green"
        />
      </div>

      <section className="overflow-hidden rounded-[1.8rem] border-[3px] border-orange-300 bg-white shadow-[0_12px_30px_rgba(15,35,63,0.05)]">
        <div className="bg-[#123865] p-5 text-white sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.14em] text-white">
                Ranked Team
              </p>

              <h3 className="mt-1 text-xl font-black text-white">
                Workload & Conversion Performance
              </h3>
            </div>

            <span className="inline-flex w-fit rounded-full border-2 border-white/20 bg-white/10 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.1em] text-white">
              Explainable local scoring
            </span>
          </div>
        </div>

        <div className="bg-[#fff8ee] p-4 sm:p-5">
          {model.counselors.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="space-y-3">
              {model.counselors.map((counselor, index) => (
                <CounselorRow
                  key={counselor.name}
                  counselor={counselor}
                  index={index}
                  reduceMotion={reduceMotion}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      <MethodologyNote />
    </motion.section>
  );
}

function CounselorRow({
  counselor,
  index,
  reduceMotion,
}) {
  const tier = getTier(counselor.score);

  return (
    <motion.article
      initial={reduceMotion ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: reduceMotion ? 0 : 0.22,
        delay: reduceMotion ? 0 : Math.min(index * 0.025, 0.12),
      }}
      className={`overflow-hidden rounded-[1.45rem] border-[3px] bg-white shadow-[0_8px_20px_rgba(15,35,63,0.04)] ${
        index === 0 ? "border-orange-400" : "border-slate-300"
      }`}
    >
      <div className="grid xl:grid-cols-[1fr_auto]">
        <div className="p-4 sm:p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`flex h-10 w-10 items-center justify-center rounded-xl border-2 text-sm font-black ${tier.rankBox}`}
                >
                  #{index + 1}
                </span>

                <div>
                  <h4 className="font-black text-[#10233f]">
                    {counselor.name}
                  </h4>

                  <p className="mt-1 text-xs font-semibold text-slate-600">
                    {counselor.leads} assigned · {counselor.converted} advanced ·{" "}
                    {counselor.vip} priority-owned
                  </p>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                <SignalBadge
                  icon={BadgeCheck}
                  label={`${counselor.conversionRate}% conversion`}
                  tone={
                    counselor.conversionRate >= 60
                      ? "green"
                      : counselor.conversionRate >= 35
                      ? "orange"
                      : "red"
                  }
                />

                <SignalBadge
                  icon={Gauge}
                  label={`${counselor.contactabilityRate}% contactable`}
                  tone={
                    counselor.contactabilityRate >= 85
                      ? "green"
                      : "amber"
                  }
                />

                <SignalBadge
                  icon={Crown}
                  label={`${counselor.vipShare}% priority share`}
                  tone="blue"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:min-w-[410px]">
              <SmallMetric
                label="Leads"
                value={counselor.leads}
              />
              <SmallMetric
                label="Converted"
                value={counselor.converted}
              />
              <SmallMetric
                label="Inquiries"
                value={counselor.inquiryCount}
              />
              <SmallMetric
                label="Appointments"
                value={counselor.appointmentCount}
              />
            </div>
          </div>

          <div className="mt-4 grid gap-3 lg:grid-cols-[1fr_1fr_auto]">
            <ReasonBlock
              title="Positive Signals"
              items={counselor.reasons}
              empty="No strong positive signal yet."
              positive
            />

            <ReasonBlock
              title="Watch Items"
              items={counselor.warnings}
              empty="No major warning detected."
            />

            <div className={`rounded-xl border-2 p-4 lg:min-w-[160px] ${tier.scoreBox}`}>
              <p className="text-[8px] font-black uppercase tracking-[0.1em]">
                Performance Score
              </p>

              <p className="mt-1 text-3xl font-black text-[#10233f]">
                {counselor.score}
              </p>

              <p className="mt-1 text-[10px] font-black uppercase tracking-[0.08em]">
                {tier.label}
              </p>
            </div>
          </div>

          <div className="mt-4 h-2.5 overflow-hidden rounded-full border border-slate-200 bg-slate-100">
            <motion.div
              initial={reduceMotion ? false : { width: 0 }}
              animate={{ width: `${counselor.score}%` }}
              transition={{
                duration: reduceMotion ? 0 : 0.55,
                delay: reduceMotion ? 0 : 0.04,
              }}
              className="h-full rounded-full bg-orange-500"
            />
          </div>
        </div>

        <div className="flex min-w-[120px] items-center justify-center border-t-2 border-slate-200 bg-[#fffaf4] p-4 xl:border-l-2 xl:border-t-0">
          <div className="text-center">
            <p className="text-[8px] font-black uppercase tracking-[0.1em] text-slate-500">
              Rank
            </p>

            <p className="mt-1 text-3xl font-black text-[#10233f]">
              #{index + 1}
            </p>

            <p className="mt-2 text-[10px] font-bold text-slate-500">
              {tier.label}
            </p>
          </div>
        </div>
      </div>
    </motion.article>
  );
}

function Metric({
  icon: Icon,
  label,
  value,
  helper,
  tone = "orange",
}) {
  const styles = {
    orange:
      "border-orange-300 bg-orange-50 text-orange-800",
    blue:
      "border-blue-300 bg-blue-50 text-blue-800",
    green:
      "border-emerald-300 bg-emerald-50 text-emerald-800",
    amber:
      "border-amber-300 bg-amber-50 text-amber-900",
    red:
      "border-red-300 bg-red-50 text-red-800",
  };

  return (
    <div
      className={`rounded-[1.4rem] border-[3px] p-4 shadow-[0_8px_22px_rgba(15,35,63,0.04)] ${
        styles[tone] || styles.orange
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[9px] font-black uppercase tracking-[0.13em]">
            {label}
          </p>

          <p className="mt-2 text-3xl font-black text-[#10233f]">
            {value}
          </p>
        </div>

        <div className="flex h-10 w-10 items-center justify-center rounded-xl border-2 border-current/20 bg-white">
          <Icon size={17} />
        </div>
      </div>

      <p className="mt-2 text-xs font-semibold leading-5 text-slate-600">
        {helper}
      </p>
    </div>
  );
}

function SmallMetric({
  label,
  value,
}) {
  return (
    <div className="rounded-xl border-2 border-slate-300 bg-[#fffaf4] px-3 py-3 text-center">
      <p className="text-[8px] font-black uppercase tracking-[0.1em] text-slate-500">
        {label}
      </p>

      <p className="mt-1 text-xl font-black text-[#10233f]">
        {value}
      </p>
    </div>
  );
}

function SignalBadge({
  icon: Icon,
  label,
  tone = "blue",
}) {
  const styles = {
    green:
      "border-emerald-300 bg-emerald-50 text-emerald-800",
    orange:
      "border-orange-300 bg-orange-50 text-orange-800",
    amber:
      "border-amber-300 bg-amber-50 text-amber-900",
    red:
      "border-red-300 bg-red-50 text-red-800",
    blue:
      "border-blue-300 bg-blue-50 text-blue-800",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border-2 px-2.5 py-1 text-[9px] font-black ${
        styles[tone] || styles.blue
      }`}
    >
      <Icon size={11} />
      {label}
    </span>
  );
}

function ReasonBlock({
  title,
  items = [],
  empty,
  positive = false,
}) {
  return (
    <div
      className={`rounded-xl border-2 p-3 ${
        positive
          ? "border-emerald-300 bg-emerald-50"
          : "border-amber-300 bg-amber-50"
      }`}
    >
      <p
        className={`text-[8px] font-black uppercase tracking-[0.1em] ${
          positive ? "text-emerald-800" : "text-amber-900"
        }`}
      >
        {title}
      </p>

      <div className="mt-2 flex flex-wrap gap-1.5">
        {items.length ? (
          items.map((item) => (
            <span
              key={item}
              className={`rounded-full border bg-white px-2 py-1 text-[9px] font-bold ${
                positive
                  ? "border-emerald-300 text-emerald-800"
                  : "border-amber-300 text-amber-900"
              }`}
            >
              {item}
            </span>
          ))
        ) : (
          <span className="text-xs font-semibold text-slate-600">
            {empty}
          </span>
        )}
      </div>
    </div>
  );
}

function DarkMetric({
  label,
  value,
}) {
  return (
    <div className="rounded-xl border-2 border-white/20 bg-white/10 p-3 text-white">
      <p className="text-[8px] font-black uppercase tracking-[0.1em] text-white">
        {label}
      </p>

      <p className="mt-1 text-xl font-black text-white">
        {value}
      </p>
    </div>
  );
}

function OrangeMetric({
  label,
  value,
}) {
  return (
    <div className="rounded-xl border-2 border-white/25 bg-white/10 p-3 text-white">
      <p className="text-[8px] font-black uppercase tracking-[0.1em] text-white">
        {label}
      </p>

      <p className="mt-1 text-xl font-black text-white">
        {value}
      </p>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-[1.5rem] border-[3px] border-dashed border-slate-300 bg-white p-8 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border-2 border-orange-300 bg-orange-50 text-orange-700">
        <Users size={22} />
      </div>

      <h3 className="mt-4 text-lg font-black text-[#10233f]">
        No assigned counselor data yet
      </h3>

      <p className="mx-auto mt-2 max-w-xl text-sm font-semibold leading-6 text-slate-600">
        Assign inquiries or appointments to counselors and this performance
        intelligence will populate automatically.
      </p>
    </div>
  );
}

function MethodologyNote() {
  return (
    <div className="rounded-[1.4rem] border-[3px] border-blue-300 bg-blue-50 p-4">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border-2 border-blue-300 bg-white text-blue-700">
          <BarChart3 size={17} />
        </div>

        <div>
          <p className="text-sm font-black text-[#10233f]">
            How the score works
          </p>

          <p className="mt-1 text-xs font-semibold leading-5 text-slate-700">
            This is a local operational score based on workload, conversion,
            contactability and priority ownership. It should support management
            decisions, not replace human review of counselor workload, student
            difficulty or assignment quality.
          </p>
        </div>
      </div>
    </div>
  );
}

function getTier(score) {
  if (score >= 80) {
    return {
      label: "Excellent",
      rankBox:
        "border-orange-400 bg-orange-500 text-white",
      scoreBox:
        "border-emerald-300 bg-emerald-50 text-emerald-800",
    };
  }

  if (score >= 60) {
    return {
      label: "Strong",
      rankBox:
        "border-blue-300 bg-blue-50 text-blue-700",
      scoreBox:
        "border-blue-300 bg-blue-50 text-blue-800",
    };
  }

  if (score >= 40) {
    return {
      label: "Developing",
      rankBox:
        "border-amber-300 bg-amber-50 text-amber-900",
      scoreBox:
        "border-amber-300 bg-amber-50 text-amber-900",
    };
  }

  return {
    label: "Needs Review",
    rankBox:
      "border-red-300 bg-red-50 text-red-700",
    scoreBox:
      "border-red-300 bg-red-50 text-red-800",
  };
}

export default CounselorPerformanceAI;
