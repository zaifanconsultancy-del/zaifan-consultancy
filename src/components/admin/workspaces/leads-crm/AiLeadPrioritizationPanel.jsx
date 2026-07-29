// AiLeadPrioritizationPanel V4 MAXIMUM — Counselor Priority Command Engine
// src/components/admin/AiLeadPrioritizationPanel.jsx
//
// Maximum pass:
// - preserves inquiries / appointments API
// - keeps local/rule-based scoring: no fake GPT/AI claim
// - richer scoring: priority, contactability, stage, ownership, recency,
//   appointment intent, study intent and stale-risk deductions
// - deterministic ranking with stable tie-breaking
// - explains WHY each lead ranks where it does
// - operational next-action recommendation per lead
// - queue summary + score distribution
// - handles empty/invalid data safely
// - reduced-motion support
// - explicit white text on navy surfaces
// - responsive high-contrast Zaifan Admin OS design

import { motion, useReducedMotion } from "framer-motion";
import {
  AlertTriangle,
  CalendarCheck2,
  CheckCircle2,
  Clock3,
  Crown,
  Flame,
  Mail,
  Phone,
  ShieldAlert,
  Snowflake,
  Sparkles,
  Target,
  TrendingUp,
  UserCheck,
  UserRoundCheck,
  Users,
  Zap,
} from "lucide-react";
import { useMemo } from "react";

const DAY_MS = 86400000;

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

function normalize(value = "") {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[_-]+/g, " ");
}

function safeDateMs(value) {
  if (!value) return 0;
  const parsed = new Date(value).getTime();
  return Number.isFinite(parsed) ? parsed : 0;
}

function ageDays(value) {
  const timestamp = safeDateMs(value);
  if (!timestamp) return null;
  return Math.max(0, Math.floor((Date.now() - timestamp) / DAY_MS));
}

function getName(lead = {}) {
  return (
    lead.full_name ||
    lead.student_name ||
    lead.name ||
    lead.student_full_name ||
    "Unnamed Lead"
  );
}

function getPhone(lead = {}) {
  return (
    lead.phone ||
    lead.phone_number ||
    lead.whatsapp ||
    lead.whatsapp_number ||
    ""
  );
}

function getStatus(lead = {}) {
  return (
    lead.status ||
    lead.pipeline_stage ||
    lead.appointment_stage ||
    "New"
  );
}

function getCountry(lead = {}) {
  return (
    lead.country_interest ||
    lead.country ||
    lead.destination_country ||
    lead.preferred_country ||
    ""
  );
}

function getProgram(lead = {}) {
  return (
    lead.program ||
    lead.field_of_interest ||
    lead.course ||
    lead.study_field ||
    ""
  );
}

function hasOwner(lead = {}) {
  return Boolean(
    lead.assigned_admin_id ||
      lead.assigned_to ||
      lead.counselor_id ||
      lead.owner_id
  );
}

function clamp(value, min = 0, max = 100) {
  return Math.min(max, Math.max(min, value));
}

function scoreLead(lead = {}, leadType = "inquiry") {
  let score = 35;
  const reasons = [];
  const warnings = [];

  const priority = normalize(lead.priority || "medium");
  const status = normalize(getStatus(lead));
  const phone = getPhone(lead);
  const email = lead.email || "";
  const country = getCountry(lead);
  const program = getProgram(lead);
  const owner = hasOwner(lead);

  const lastActivityAge = ageDays(
    lead.updated_at ||
      lead.last_activity_at ||
      lead.last_contacted_at ||
      lead.created_at
  );

  if (priority === "vip") {
    score += 30;
    reasons.push("VIP priority");
  } else if (
    ["high", "urgent", "critical"].includes(priority)
  ) {
    score += 20;
    reasons.push("High priority");
  } else if (priority === "medium") {
    score += 8;
  }

  if (phone) {
    score += 7;
    reasons.push("Phone available");
  } else {
    warnings.push("Phone missing");
  }

  if (email) {
    score += 6;
    reasons.push("Email available");
  } else {
    warnings.push("Email missing");
  }

  if (phone && email) {
    score += 4;
    reasons.push("Fully contactable");
  }

  if (
    status.includes("contacted") ||
    status.includes("confirmed")
  ) {
    score += 12;
    reasons.push("Engagement confirmed");
  }

  if (
    status.includes("documents") ||
    status.includes("document")
  ) {
    score += 10;
    reasons.push("Document stage");
  }

  if (
    status.includes("application") ||
    status.includes("applied")
  ) {
    score += 12;
    reasons.push("Application movement");
  }

  if (
    status.includes("offer") ||
    status.includes("visa")
  ) {
    score += 14;
    reasons.push("Advanced pipeline stage");
  }

  if (
    status.includes("closed") ||
    status.includes("rejected") ||
    status.includes("cancelled") ||
    status.includes("canceled")
  ) {
    score -= 30;
    warnings.push("Closed / inactive status");
  }

  if (leadType === "appointment") {
    score += 8;
    reasons.push("Consultation intent");
  }

  if (country) {
    score += 4;
    reasons.push("Destination selected");
  }

  if (program) {
    score += 4;
    reasons.push("Study interest known");
  }

  if (owner) {
    score += 3;
    reasons.push("Counselor assigned");
  } else {
    score -= 3;
    warnings.push("No counselor owner");
  }

  if (lastActivityAge !== null) {
    if (lastActivityAge <= 2) {
      score += 7;
      reasons.push("Recently active");
    } else if (lastActivityAge >= 14) {
      score -= 16;
      warnings.push(`${lastActivityAge} days without recent movement`);
    } else if (lastActivityAge >= 7) {
      score -= 8;
      warnings.push(`${lastActivityAge} days without recent movement`);
    }
  }

  score = clamp(Math.round(score));

  let temperature = "Cold";
  if (score >= 80) temperature = "Hot";
  else if (score >= 60) temperature = "Warm";

  return {
    score,
    temperature,
    reasons,
    warnings,
    priority,
    status,
    phone,
    email,
    country,
    program,
    owner,
    lastActivityAge,
  };
}

function getNextAction(lead) {
  if (!lead.phone && !lead.email) {
    return "Recover contact details";
  }

  if (!lead.owner) {
    return "Assign counselor owner";
  }

  if (
    lead.lastActivityAge !== null &&
    lead.lastActivityAge >= 7
  ) {
    return "Run recovery follow-up";
  }

  if (
    lead.priority === "vip" ||
    ["high", "urgent", "critical"].includes(lead.priority)
  ) {
    return lead.phone
      ? "Priority call / WhatsApp"
      : "Priority email follow-up";
  }

  if (lead.__leadType === "appointment") {
    return "Confirm consultation";
  }

  if (
    lead.status.includes("documents") ||
    lead.status.includes("document")
  ) {
    return "Review pending documents";
  }

  if (
    lead.status.includes("contacted") ||
    lead.status.includes("confirmed")
  ) {
    return "Move qualification forward";
  }

  return lead.phone
    ? "Start counselor contact"
    : "Send qualification email";
}

function AiLeadPrioritizationPanel({
  inquiries = [],
  appointments = [],
}) {
  const shouldReduceMotion = useReducedMotion();

  const data = useMemo(() => {
    const source = [
      ...safeArray(inquiries).map((lead, sourceIndex) => ({
        ...lead,
        __leadType: "inquiry",
        __sourceIndex: sourceIndex,
      })),
      ...safeArray(appointments).map((lead, sourceIndex) => ({
        ...lead,
        __leadType: "appointment",
        __sourceIndex: sourceIndex,
      })),
    ];

    const allRanked = source
      .map((lead) => {
        const scoring = scoreLead(lead, lead.__leadType);

        return {
          ...lead,
          ...scoring,
          name: getName(lead),
          nextAction: getNextAction({
            ...lead,
            ...scoring,
          }),
          createdMs: safeDateMs(lead.created_at),
        };
      })
      .sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        if (b.createdMs !== a.createdMs) return b.createdMs - a.createdMs;
        return a.__sourceIndex - b.__sourceIndex;
      });

    const visible = allRanked.slice(0, 10);
    const hot = allRanked.filter((lead) => lead.temperature === "Hot").length;
    const warm = allRanked.filter((lead) => lead.temperature === "Warm").length;
    const cold = allRanked.filter((lead) => lead.temperature === "Cold").length;
    const vip = allRanked.filter((lead) => lead.priority === "vip").length;
    const unassigned = allRanked.filter((lead) => !lead.owner).length;

    const average = allRanked.length
      ? Math.round(
          allRanked.reduce((sum, lead) => sum + lead.score, 0) /
            allRanked.length
        )
      : 0;

    return {
      allRanked,
      visible,
      hot,
      warm,
      cold,
      vip,
      unassigned,
      average,
    };
  }, [inquiries, appointments]);

  return (
    <motion.section
      initial={shouldReduceMotion ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: shouldReduceMotion ? 0 : 0.28 }}
      className="overflow-hidden rounded-[2rem] border-[3px] border-orange-300 bg-white shadow-[0_14px_36px_rgba(15,35,63,0.07)]"
    >
      <div className="grid xl:grid-cols-[1.15fr_0.85fr]">
        <div className="bg-[#123866] p-5 text-white sm:p-6">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-2 rounded-full border-2 border-white/20 bg-white/10 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.14em] text-white">
              <TrendingUp size={12} />
              Lead Prioritization
            </span>

            <span className="inline-flex items-center gap-2 rounded-full border-2 border-white/20 bg-white/10 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.14em] text-white">
              <Sparkles size={12} />
              Local Scoring Engine
            </span>
          </div>

          <h3 className="mt-4 text-2xl font-black tracking-tight text-white sm:text-3xl">
            Counselor Priority Queue
          </h3>

          <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-white">
            Rank the strongest next opportunities using CRM priority,
            engagement, contactability, ownership, recency and pipeline
            movement.
          </p>

          <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
            <DarkMetric label="Leads Ranked" value={data.allRanked.length} />
            <DarkMetric label="Average Score" value={`${data.average}/100`} />
            <DarkMetric label="VIP" value={data.vip} />
            <DarkMetric label="Open Pool" value={data.unassigned} />
          </div>
        </div>

        <div className="bg-orange-500 p-5 text-white sm:p-6">
          <p className="text-[9px] font-black uppercase tracking-[0.16em] text-white">
            Queue Temperature
          </p>

          <div className="mt-4 grid grid-cols-3 gap-2">
            <OrangeMetric label="Hot" value={data.hot} icon={Flame} />
            <OrangeMetric label="Warm" value={data.warm} icon={Target} />
            <OrangeMetric label="Cold" value={data.cold} icon={Snowflake} />
          </div>

          <p className="mt-4 text-xs font-semibold leading-5 text-white">
            Scores are operational guidance only. Counselors remain responsible
            for the final contact and case decision.
          </p>
        </div>
      </div>

      <div className="bg-[#fff8ee] p-4 sm:p-5">
        {data.visible.length ? (
          <>
            <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-[9px] font-black uppercase tracking-[0.15em] text-orange-700">
                  Ranked Work Queue
                </p>
                <h4 className="mt-1 text-xl font-black text-[#10233f]">
                  Who should the counselor handle first?
                </h4>
              </div>

              <span className="inline-flex w-fit rounded-full border-2 border-slate-300 bg-white px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.1em] text-slate-600">
                Top {data.visible.length} shown
              </span>
            </div>

            <div className="space-y-3">
              {data.visible.map((lead, index) => (
                <LeadRow
                  key={`${lead.__leadType}-${lead.id || lead.email || lead.phone || index}`}
                  lead={lead}
                  index={index}
                  shouldReduceMotion={shouldReduceMotion}
                />
              ))}
            </div>
          </>
        ) : (
          <EmptyState />
        )}
      </div>
    </motion.section>
  );
}

function LeadRow({ lead, index, shouldReduceMotion }) {
  const temperature = getTemperatureConfig(lead.temperature);

  return (
    <motion.article
      initial={shouldReduceMotion ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: shouldReduceMotion ? 0 : 0.22,
        delay: shouldReduceMotion ? 0 : Math.min(index * 0.025, 0.12),
      }}
      className={`overflow-hidden rounded-[1.5rem] border-[3px] bg-white shadow-[0_5px_16px_rgba(15,35,63,0.035)] ${
        index === 0 ? "border-orange-400" : "border-slate-300"
      }`}
    >
      <div className="grid lg:grid-cols-[auto_minmax(0,1fr)_auto]">
        <div
          className={`flex min-w-[76px] items-center justify-center border-b-2 p-4 lg:border-b-0 lg:border-r-2 ${
            index === 0
              ? "border-orange-400 bg-orange-500 text-white"
              : "border-slate-200 bg-[#fffaf2] text-[#10233f]"
          }`}
        >
          <div className="text-center">
            <p className={`text-[8px] font-black uppercase tracking-[0.12em] ${
              index === 0 ? "text-white" : "text-slate-500"
            }`}>
              Rank
            </p>
            <p className={`mt-1 text-2xl font-black ${
              index === 0 ? "text-white" : "text-[#10233f]"
            }`}>
              #{index + 1}
            </p>
          </div>
        </div>

        <div className="min-w-0 p-4">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h5 className="break-words text-base font-black text-[#10233f]">
                  {lead.name}
                </h5>

                {lead.priority === "vip" ? (
                  <Badge icon={Crown} text="VIP" tone="orange" />
                ) : null}

                <Badge
                  icon={lead.__leadType === "appointment" ? CalendarCheck2 : Users}
                  text={lead.__leadType === "appointment" ? "Appointment" : "Inquiry"}
                  tone="blue"
                />

                <Badge
                  icon={temperature.icon}
                  text={lead.temperature}
                  tone={temperature.tone}
                />
              </div>

              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs font-semibold text-slate-600">
                <span>Status: {getStatus(lead)}</span>
                {lead.country ? <span>Country: {lead.country}</span> : null}
                {lead.program ? <span>Program: {lead.program}</span> : null}
                {lead.lastActivityAge !== null ? (
                  <span>Activity age: {lead.lastActivityAge}d</span>
                ) : null}
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <div className={`rounded-xl border-2 px-3 py-2 ${temperature.scoreBox}`}>
                <p className="text-[8px] font-black uppercase tracking-[0.1em]">
                  Priority Score
                </p>
                <p className="mt-0.5 text-xl font-black">{lead.score}/100</p>
              </div>
            </div>
          </div>

          <div className="mt-4 grid gap-3 xl:grid-cols-[1fr_1fr_auto]">
            <ReasonBlock
              title="Positive Signals"
              items={lead.reasons.slice(0, 4)}
              empty="No strong positive signals yet."
              positive
            />

            <ReasonBlock
              title="Watch Items"
              items={lead.warnings.slice(0, 3)}
              empty="No major warning signal."
            />

            <div className="rounded-xl border-2 border-orange-300 bg-orange-50 p-3 xl:min-w-[210px]">
              <p className="text-[8px] font-black uppercase tracking-[0.11em] text-orange-700">
                Recommended Next Move
              </p>
              <div className="mt-2 flex items-start gap-2">
                <Zap className="mt-0.5 h-4 w-4 shrink-0 text-orange-700" />
                <p className="text-xs font-black leading-5 text-[#10233f]">
                  {lead.nextAction}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center border-t-2 border-slate-200 bg-[#fffaf2] p-4 lg:border-l-2 lg:border-t-0">
          <div className="grid gap-2">
            <ContactFlag
              icon={Phone}
              label="Phone"
              ready={Boolean(lead.phone)}
            />
            <ContactFlag
              icon={Mail}
              label="Email"
              ready={Boolean(lead.email)}
            />
            <ContactFlag
              icon={UserRoundCheck}
              label="Owner"
              ready={lead.owner}
            />
          </div>
        </div>
      </div>
    </motion.article>
  );
}

function ReasonBlock({ title, items = [], empty, positive = false }) {
  return (
    <div
      className={`rounded-xl border-2 p-3 ${
        positive
          ? "border-emerald-300 bg-emerald-50"
          : "border-amber-300 bg-amber-50"
      }`}
    >
      <p
        className={`text-[8px] font-black uppercase tracking-[0.11em] ${
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

function ContactFlag({ icon: Icon, label, ready }) {
  return (
    <div
      className={`flex items-center gap-2 rounded-lg border-2 px-2.5 py-2 text-[9px] font-black ${
        ready
          ? "border-emerald-300 bg-emerald-50 text-emerald-800"
          : "border-slate-300 bg-white text-slate-500"
      }`}
    >
      {ready ? <CheckCircle2 size={12} /> : <AlertTriangle size={12} />}
      <Icon size={12} />
      {label}
    </div>
  );
}

function Badge({ icon: Icon, text, tone = "blue" }) {
  const colors = {
    red: "border-red-300 bg-red-50 text-red-700",
    orange: "border-orange-300 bg-orange-50 text-orange-800",
    blue: "border-blue-300 bg-blue-50 text-blue-700",
    green: "border-emerald-300 bg-emerald-50 text-emerald-700",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border-2 px-2.5 py-1 text-[9px] font-black ${colors[tone] || colors.blue}`}
    >
      <Icon size={11} />
      {text}
    </span>
  );
}

function DarkMetric({ label, value }) {
  return (
    <div className="rounded-[1.1rem] border-2 border-white/20 bg-white/10 p-3 text-white">
      <p className="text-[8px] font-black uppercase tracking-[0.1em] text-white">
        {label}
      </p>
      <p className="mt-1 text-xl font-black text-white">{value}</p>
    </div>
  );
}

function OrangeMetric({ label, value, icon: Icon }) {
  return (
    <div className="rounded-[1.1rem] border-2 border-white/25 bg-white/10 p-3 text-white">
      <Icon size={15} className="text-white" />
      <p className="mt-2 text-[8px] font-black uppercase tracking-[0.1em] text-white">
        {label}
      </p>
      <p className="mt-1 text-xl font-black text-white">{value}</p>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-[1.5rem] border-[3px] border-dashed border-slate-300 bg-white p-8 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border-2 border-orange-300 bg-orange-50 text-orange-700">
        <Target size={20} />
      </div>
      <h4 className="mt-4 text-lg font-black text-[#10233f]">
        No leads available to rank
      </h4>
      <p className="mx-auto mt-2 max-w-lg text-sm font-semibold leading-6 text-slate-600">
        The priority engine will populate automatically when inquiry or
        appointment records are supplied to this panel.
      </p>
    </div>
  );
}

function getTemperatureConfig(temperature) {
  if (temperature === "Hot") {
    return {
      icon: Flame,
      tone: "red",
      scoreBox: "border-red-300 bg-red-50 text-red-700",
    };
  }

  if (temperature === "Warm") {
    return {
      icon: Target,
      tone: "orange",
      scoreBox: "border-orange-300 bg-orange-50 text-orange-800",
    };
  }

  return {
    icon: Snowflake,
    tone: "blue",
    scoreBox: "border-blue-300 bg-blue-50 text-blue-700",
  };
}

export default AiLeadPrioritizationPanel;
