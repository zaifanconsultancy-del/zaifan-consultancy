// DashboardOverview V6 MAXIMUM — Framed Executive Daily CRM Overview
// src/components/admin/DashboardOverview.jsx
//
// Maximum pass:
// - preserves buildAiLeadInsights integration
// - preserves all current public props
// - keeps local deterministic AI scoring separate from paid GPT generation
// - safer latest-lead normalization
// - safer date parsing
// - stronger today-activity modeling
// - removes decorative fake pulse bars when no activity exists
// - replaces emoji icons with Lucide icons
// - stronger role of daily CRM pulse
// - adds operational health summary
// - better AI executive briefing
// - clearer hot/warm/urgent interpretation
// - stronger latest inquiry / appointment cards
// - reduced-motion support
// - explicit white text on navy surfaces
// - consistent Zaifan orange/navy/cream Admin OS visual system
// - mobile-safe layouts
// - no fake Supabase writes or automatic GPT calls
//
// NOTE:
// This component is intentionally read-only and receives already-fetched CRM data.
// Backend writes should remain in the parent/child workflow handlers.

import {
  Activity,
  AlertTriangle,
  Bot,
  BrainCircuit,
  CalendarCheck2,
  CheckCircle2,
  Clock3,
  Crown,
  Flame,
  Gauge,
  Mail,
  MapPin,
  MessageCircle,
  Radar,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
  UserCheck,
  UserRoundSearch,
  Users,
  Zap,
} from "lucide-react";
import {
  motion,
  useReducedMotion,
} from "framer-motion";
import { useMemo } from "react";
import { buildAiLeadInsights } from "../../services/aiLeadEngine";

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

function normalize(value = "") {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[_-]+/g, " ");
}

function safeDate(value) {
  if (!value) return null;

  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? null
    : date;
}

function getOwnerName(lead = {}) {
  return (
    lead.assigned_admin_name ||
    lead.assigned_counselor_name ||
    lead.counselor_name ||
    lead.owner_name ||
    ""
  );
}

function getPriority(lead = {}) {
  const priority = normalize(lead.priority || "low");

  if (priority === "vip") return "vip";

  if (
    [
      "critical",
      "urgent",
      "high",
    ].includes(priority)
  ) {
    return "high";
  }

  if (priority === "medium") {
    return "medium";
  }

  return "low";
}

function getLeadStatus(lead = {}, type = "inquiry") {
  if (type === "appointment") {
    return normalize(
      lead.appointment_stage ||
        lead.status ||
        "pending"
    );
  }

  return normalize(
    lead.pipeline_stage ||
      lead.status ||
      "new"
  );
}

function isAssigned(lead = {}) {
  return Boolean(
    lead.assigned_admin_id ||
      lead.assigned_to ||
      lead.counselor_id ||
      lead.owner_id ||
      lead.assigned_counselor_id ||
      getOwnerName(lead)
  );
}

function formatDate(date) {
  const parsed = safeDate(date);

  if (!parsed) return "No date";

  return parsed.toLocaleString("en-PK", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function DashboardOverview({
  cardClass = "",
  todayInquiriesCount = 0,
  todayAppointmentsCount = 0,
  latestInquiry = null,
  latestAppointment = null,
  inquiries = [],
  appointments = [],
}) {
  const reduceMotion = useReducedMotion();

  const model = useMemo(() => {
    const safeInquiries = safeArray(inquiries);
    const safeAppointments = safeArray(appointments);

    const totalToday =
      Number(todayInquiriesCount || 0) +
      Number(todayAppointmentsCount || 0);

    const inquiryPercent =
      totalToday === 0
        ? 0
        : Math.round(
            (Number(todayInquiriesCount || 0) / totalToday) *
              100
          );

    const appointmentPercent =
      totalToday === 0
        ? 0
        : Math.round(
            (Number(todayAppointmentsCount || 0) / totalToday) *
              100
          );

    const aiRaw =
      buildAiLeadInsights({
        inquiries: safeInquiries,
        appointments: safeAppointments,
      }) || {};

    const aiInsights = {
      totalAnalyzed:
        Number(aiRaw.totalAnalyzed || 0),
      hotLeads: safeArray(aiRaw.hotLeads),
      warmLeads: safeArray(aiRaw.warmLeads),
      immediateLeads: safeArray(aiRaw.immediateLeads),
      highUrgencyLeads: safeArray(
        aiRaw.highUrgencyLeads
      ),
      topLeads: safeArray(aiRaw.topLeads),
      averageScore: Number(aiRaw.averageScore || 0),
    };

    const allLeads = [
      ...safeInquiries,
      ...safeAppointments,
    ];

    const assignedCount =
      allLeads.filter(isAssigned).length;

    const openPoolCount =
      Math.max(allLeads.length - assignedCount, 0);

    const vipHighCount =
      allLeads.filter((lead) =>
        ["vip", "high"].includes(
          getPriority(lead)
        )
      ).length;

    const hotCount =
      aiInsights.hotLeads.length;

    const warmCount =
      aiInsights.warmLeads.length;

    const urgentCount =
      aiInsights.immediateLeads.length +
      aiInsights.highUrgencyLeads.length;

    const assignmentRate =
      allLeads.length
        ? Math.round(
            (assignedCount / allLeads.length) * 100
          )
        : 0;

    const operationalHealth =
      allLeads.length === 0
        ? 0
        : Math.max(
            0,
            Math.min(
              100,
              Math.round(
                assignmentRate * 0.35 +
                  aiInsights.averageScore * 0.35 +
                  Math.min(
                    20,
                    hotCount * 5
                  ) +
                  (totalToday > 0 ? 10 : 0) -
                  Math.min(
                    25,
                    urgentCount * 4
                  )
              )
            )
          );

    const health = getHealthConfig(
      operationalHealth,
      allLeads.length
    );

    const latestCards = [
      buildLatestCard({
        type: "inquiry",
        title: "Latest Inquiry",
        lead: latestInquiry,
      }),
      buildLatestCard({
        type: "appointment",
        title: "Latest Appointment",
        lead: latestAppointment,
      }),
    ];

    const briefingLines = buildBriefingLines({
      totalAnalyzed:
        aiInsights.totalAnalyzed,
      hotCount,
      warmCount,
      urgentCount,
      averageScore:
        aiInsights.averageScore,
      topOpportunity:
        aiInsights.topLeads?.[0] || null,
      topRisk: [
        ...aiInsights.immediateLeads,
        ...aiInsights.highUrgencyLeads,
      ].sort(
        (a, b) =>
          Number(b.ai_score || 0) -
          Number(a.ai_score || 0)
      )[0] || null,
      assignedCount,
      openPoolCount,
    });

    return {
      totalToday,
      inquiryPercent,
      appointmentPercent,
      aiInsights,
      hotCount,
      warmCount,
      urgentCount,
      assignedCount,
      openPoolCount,
      vipHighCount,
      assignmentRate,
      operationalHealth,
      health,
      latestCards,
      briefingLines,
    };
  }, [
    todayInquiriesCount,
    todayAppointmentsCount,
    latestInquiry,
    latestAppointment,
    inquiries,
    appointments,
  ]);

  return (
    <div className="mb-5 space-y-5 xl:mb-6">
      <section className="min-w-0 overflow-hidden rounded-[2rem] border-[3px] border-[#C9D7E6] bg-[#FFFDF8] p-3 shadow-[0_16px_42px_rgba(15,35,63,0.08)] sm:p-4">
        <div className="grid min-w-0 overflow-hidden rounded-[1.7rem] border-[3px] border-[#F97316] xl:grid-cols-[minmax(0,1.2fr)_minmax(20rem,0.8fr)]">
          <div className="min-w-0 bg-[#173F6B] p-5 text-white sm:p-6">
            <div className="flex flex-wrap items-center gap-2">
              <HeaderBadge>
                <Activity size={12} />
                Daily Operations
              </HeaderBadge>

              <HeaderBadge>
                <ShieldCheck size={12} />
                Executive Overview
              </HeaderBadge>
            </div>

            <h1 className="mt-4 text-2xl font-black text-white sm:text-3xl">
              Today&apos;s CRM Pulse
            </h1>

            <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-white">
              A live executive overview of today&apos;s inquiry and appointment activity,
              current ownership, priority workload, and local CRM intelligence.
            </p>

            <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
              <DarkMetric
                label="Today"
                value={model.totalToday}
              />

              <DarkMetric
                label="Assigned"
                value={model.assignedCount}
              />

              <DarkMetric
                label="Open Pool"
                value={model.openPoolCount}
              />

              <DarkMetric
                label="VIP / High"
                value={model.vipHighCount}
              />
            </div>
          </div>

          <div className="min-w-0 border-t-[3px] border-[#F97316] bg-[#E96512] p-5 text-white sm:p-6 xl:border-l-[3px] xl:border-t-0">
            <p className="text-[9px] font-black uppercase tracking-[0.14em] text-white">
              Operational Health
            </p>

            <div className="mt-3 flex items-end gap-3">
              <p className="text-5xl font-black text-white">
                {model.operationalHealth}
              </p>

              <p className="pb-1 text-xs font-black uppercase tracking-[0.1em] text-white">
                {model.health.label}
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
                  width: `${model.operationalHealth}%`,
                }}
                transition={{
                  duration: reduceMotion ? 0 : 0.65,
                }}
                className="h-full rounded-full bg-white"
              />
            </div>

            <p className="mt-4 text-xs font-semibold leading-5 text-white">
              {model.health.message}
            </p>
          </div>
        </div>
      </section>

      <AIExecutiveBriefing
        cardClass={cardClass}
        aiInsights={model.aiInsights}
        briefingLines={model.briefingLines}
        hotCount={model.hotCount}
        warmCount={model.warmCount}
        urgentCount={model.urgentCount}
        reduceMotion={reduceMotion}
      />

      <div className="grid gap-4 xl:grid-cols-[1.25fr_0.95fr]">
        <DailyPulseCard
          cardClass={cardClass}
          totalToday={model.totalToday}
          inquiryPercent={model.inquiryPercent}
          appointmentPercent={model.appointmentPercent}
          todayInquiriesCount={todayInquiriesCount}
          todayAppointmentsCount={todayAppointmentsCount}
          reduceMotion={reduceMotion}
        />

        <div className="grid gap-4">
          {model.latestCards.map((card, index) => (
            <LatestLeadCard
              key={card.title}
              card={card}
              cardClass={cardClass}
              index={index}
              reduceMotion={reduceMotion}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function DailyPulseCard({
  cardClass,
  totalToday,
  inquiryPercent,
  appointmentPercent,
  todayInquiriesCount,
  todayAppointmentsCount,
  reduceMotion,
}) {
  const bars = [
    {
      label: "Inquiries",
      value: inquiryPercent,
      count: todayInquiriesCount,
      icon: UserRoundSearch,
      tone: "orange",
    },
    {
      label: "Appointments",
      value: appointmentPercent,
      count: todayAppointmentsCount,
      icon: CalendarCheck2,
      tone: "blue",
    },
  ];

  return (
    <motion.section
      initial={
        reduceMotion
          ? false
          : { opacity: 0, y: 12 }
      }
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: reduceMotion ? 0 : 0.26,
      }}
      className={`${cardClass} min-w-0 overflow-hidden rounded-[1.75rem] border-[3px] border-[#C9D7E6] bg-[#FFFDF8] p-3 shadow-[0_12px_32px_rgba(15,35,63,0.06)]`}
    >
      <div className="overflow-hidden rounded-[1.45rem] border-[3px] border-[#F97316]">
      <div className="min-w-0 bg-[#173F6B] p-5 text-white">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border-2 border-white/20 bg-white/10 text-white">
            <Activity size={17} />
          </div>

          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.13em] text-white">
              Daily CRM Activity
            </p>

            <h2 className="mt-1 text-xl font-black text-white">
              Today&apos;s Activity Split
            </h2>
          </div>
        </div>
      </div>

      <div className="grid min-w-0 gap-4 bg-[#FFF8EE] p-4 sm:p-5 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
        <div className="rounded-[1.4rem] border-[3px] border-orange-300 bg-orange-50 p-5">
          <p className="text-[9px] font-black uppercase tracking-[0.13em] text-orange-800">
            Activity Count
          </p>

          <p className="mt-3 text-5xl font-black text-[#10233f]">
            {totalToday}
          </p>

          <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
            {totalToday === 0
              ? "No new CRM activity has been recorded today yet."
              : `${todayInquiriesCount} inquiries and ${todayAppointmentsCount} appointments were logged today.`}
          </p>

          <div className="mt-5 space-y-4">
            {bars.map((bar) => (
              <ProgressMetric
                key={bar.label}
                {...bar}
                reduceMotion={reduceMotion}
              />
            ))}
          </div>
        </div>

        <div className="rounded-[1.4rem] border-[3px] border-slate-300 bg-white p-4 sm:p-5">
          {totalToday === 0 ? (
            <DailyEmptyState />
          ) : (
            <ActivityDistribution
              bars={bars}
              reduceMotion={reduceMotion}
            />
          )}
        </div>
      </div>
      </div>
    </motion.section>
  );
}

function ActivityDistribution({
  bars,
  reduceMotion,
}) {
  return (
    <div className="flex min-h-[250px] flex-col justify-center">
      <div className="grid gap-3 sm:grid-cols-2">
        {bars.map((bar) => {
          const Icon = bar.icon;
          const style = getToneStyle(bar.tone);

          return (
            <div
              key={bar.label}
              className={`min-w-0 rounded-[1.3rem] border-[3px] p-4 shadow-[0_6px_16px_rgba(15,35,63,0.04)] ${style.card}`}
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[9px] font-black uppercase tracking-[0.1em]">
                    {bar.label}
                  </p>

                  <p className="mt-2 text-3xl font-black text-[#10233f]">
                    {bar.count}
                  </p>
                </div>

                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-xl border-2 bg-white ${style.icon}`}
                >
                  <Icon size={17} />
                </div>
              </div>

              <div className="mt-4 h-2.5 overflow-hidden rounded-full border border-slate-200 bg-white">
                <motion.div
                  initial={
                    reduceMotion
                      ? false
                      : { width: 0 }
                  }
                  animate={{
                    width: `${bar.value}%`,
                  }}
                  transition={{
                    duration: reduceMotion ? 0 : 0.65,
                  }}
                  className={`h-full rounded-full ${style.bar}`}
                />
              </div>

              <p className="mt-2 text-xs font-bold text-slate-500">
                {bar.value}% of today&apos;s activity
              </p>
            </div>
          );
        })}
      </div>

      <div className="mt-4 rounded-xl border-2 border-blue-300 bg-blue-50 p-4">
        <div className="flex items-start gap-3">
          <TrendingUp
            size={17}
            className="mt-0.5 shrink-0 text-blue-700"
          />

          <div>
            <p className="text-sm font-black text-[#10233f]">
              Daily mix
            </p>

            <p className="mt-1 text-xs font-semibold leading-5 text-slate-700">
              This chart shows the share of today&apos;s CRM activity only. It does not
              treat an appointment as a converted inquiry.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function ProgressMetric({
  label,
  value,
  count,
  icon: Icon,
  tone,
  reduceMotion,
}) {
  const style = getToneStyle(tone);

  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Icon
            size={14}
            className={style.text}
          />

          <span className="text-xs font-black text-slate-700">
            {label}
          </span>
        </div>

        <span className="text-xs font-black text-[#10233f]">
          {count} · {value}%
        </span>
      </div>

      <div className="h-2.5 overflow-hidden rounded-full border border-slate-200 bg-white">
        <motion.div
          initial={
            reduceMotion
              ? false
              : { width: 0 }
          }
          animate={{
            width: `${value}%`,
          }}
          transition={{
            duration: reduceMotion ? 0 : 0.65,
          }}
          className={`h-full rounded-full ${style.bar}`}
        />
      </div>
    </div>
  );
}

function AIExecutiveBriefing({
  cardClass,
  aiInsights,
  briefingLines,
  hotCount,
  warmCount,
  urgentCount,
  reduceMotion,
}) {
  const totalAnalyzed =
    aiInsights.totalAnalyzed || 0;

  const averageScore =
    aiInsights.averageScore || 0;

  const statCards = [
    {
      label: "Local Score Avg",
      value: `${averageScore}/100`,
      icon: BrainCircuit,
      tone: "blue",
    },
    {
      label: "Hot Leads",
      value: hotCount,
      icon: Flame,
      tone: "red",
    },
    {
      label: "Warm Leads",
      value: warmCount,
      icon: Zap,
      tone: "orange",
    },
    {
      label: "Urgent Follow-Ups",
      value: urgentCount,
      icon: AlertTriangle,
      tone: "amber",
    },
  ];

  return (
    <motion.section
      initial={
        reduceMotion
          ? false
          : { opacity: 0, y: 10 }
      }
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: reduceMotion ? 0 : 0.25,
      }}
      className={`${cardClass} min-w-0 overflow-hidden rounded-[1.9rem] border-[3px] border-[#C9D7E6] bg-[#FFFDF8] p-3 shadow-[0_12px_32px_rgba(15,35,63,0.06)]`}
    >
      <div className="grid min-w-0 overflow-hidden rounded-[1.55rem] border-[3px] border-[#F97316] xl:grid-cols-[minmax(0,1.14fr)_minmax(20rem,0.86fr)]">
        <div className="min-w-0 bg-[#173F6B] p-5 text-white sm:p-6">
          <div className="flex flex-wrap items-center gap-2">
            <HeaderBadge>
              <BrainCircuit size={11} />
              Student OS Intelligence
            </HeaderBadge>

            <HeaderBadge>
              <ShieldCheck size={11} />
              No Automatic GPT Cost
            </HeaderBadge>
          </div>

          <h2 className="mt-4 text-2xl font-black text-white sm:text-3xl">
            AI Executive Briefing
          </h2>

          <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-white">
            Local deterministic scoring ranks opportunity and urgency. Paid GPT stays
            optional inside the student workspace for high-value summaries, messages,
            strategy, scripts, or deeper reasoning.
          </p>

          <div className="mt-5 space-y-2.5">
            {briefingLines.map((line, index) => (
              <div
                key={`${line}-${index}`}
                className="rounded-xl border-2 border-white/20 bg-white/10 px-4 py-3 text-sm font-semibold leading-6 text-white"
              >
                {line}
              </div>
            ))}
          </div>
        </div>

        <div className="grid min-w-0 gap-3 bg-[#FFF8EE] p-4 sm:grid-cols-2 sm:p-5">
          {statCards.map((stat) => (
            <AIStatCard
              key={stat.label}
              stat={stat}
            />
          ))}

          <div className="sm:col-span-2 rounded-xl border-2 border-blue-300 bg-blue-50 p-4">
            <div className="flex items-start gap-3">
              <Bot
                size={16}
                className="mt-0.5 shrink-0 text-blue-700"
              />

              <div>
                <p className="text-sm font-black text-[#10233f]">
                  Intelligence coverage
                </p>

                <p className="mt-1 text-xs font-semibold leading-5 text-slate-700">
                  {totalAnalyzed > 0
                    ? `${totalAnalyzed} CRM record${totalAnalyzed === 1 ? "" : "s"} are currently being evaluated by the local scoring engine.`
                    : "No inquiry or appointment records are currently available for local scoring."}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.section>
  );
}

function AIStatCard({ stat }) {
  const Icon = stat.icon;
  const style = getToneStyle(stat.tone);

  return (
    <div
      className={`min-w-0 rounded-[1.3rem] border-[3px] p-4 shadow-[0_6px_16px_rgba(15,35,63,0.04)] ${style.card}`}
    >
      <div className="flex items-center justify-between gap-3">
        <p className="text-[9px] font-black uppercase tracking-[0.1em]">
          {stat.label}
        </p>

        <div
          className={`flex h-10 w-10 items-center justify-center rounded-xl border-2 bg-white ${style.icon}`}
        >
          <Icon size={17} />
        </div>
      </div>

      <p className="mt-3 text-3xl font-black text-[#10233f]">
        {stat.value}
      </p>
    </div>
  );
}

function LatestLeadCard({
  card,
  cardClass,
  index,
  reduceMotion,
}) {
  const hasLead = Boolean(card.lead);
  const lead = card.lead || {};
  const assignedAdmin =
    getOwnerName(lead) || null;

  const priority =
    getPriority(lead);

  const status =
    getLeadStatus(
      lead,
      card.type
    );

  const style =
    getToneStyle(
      card.tone
    );

  const CardIcon =
    card.icon;

  return (
    <motion.section
      initial={
        reduceMotion
          ? false
          : { opacity: 0, y: 10 }
      }
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: reduceMotion ? 0 : 0.24,
        delay: reduceMotion ? 0 : index * 0.05,
      }}
      className={`${cardClass} min-w-0 overflow-hidden rounded-[1.6rem] border-[3px] border-[#C9D7E6] bg-[#FFFDF8] p-3 shadow-[0_10px_28px_rgba(15,35,63,0.06)]`}
    >
      <div className="overflow-hidden rounded-[1.4rem] border-[3px] border-[#F97316]">
      <div className="min-w-0 bg-[#173F6B] p-4 text-white">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.12em] text-white">
              {card.title}
            </p>

            <h2 className="mt-1 break-words text-lg font-black leading-6 text-white">
              {hasLead
                ? lead.full_name ||
                  lead.student_name ||
                  lead.name ||
                  "Unnamed Student"
                : card.fallbackTitle}
            </h2>
          </div>

          <div className="flex h-10 w-10 items-center justify-center rounded-xl border-2 border-white/20 bg-white/10 text-white">
            <CardIcon size={17} />
          </div>
        </div>
      </div>

      <div className="min-w-0 bg-[#FFF8EE] p-4">
        <p className="break-words text-sm font-semibold leading-6 text-slate-700">
          {hasLead
            ? card.detail || "No detail available"
            : card.fallbackText}
        </p>

        <div className="mt-3 flex flex-wrap gap-2">
          <span
            className={`rounded-full border-2 px-3 py-1 text-[9px] font-black uppercase tracking-[0.1em] ${style.badge}`}
          >
            {card.type}
          </span>

          {hasLead ? (
            <>
              <PriorityBadge
                priority={priority}
              />

              <span className="rounded-full border-2 border-slate-300 bg-white px-3 py-1 text-[9px] font-black uppercase tracking-[0.1em] text-slate-700">
                {status || "unknown"}
              </span>

              <span
                className={`rounded-full border-2 px-3 py-1 text-[9px] font-black uppercase tracking-[0.1em] ${
                  assignedAdmin
                    ? "border-[#34D399] bg-[#F0FFF8] text-emerald-800"
                    : "border-[#F59E0B] bg-[#FFF7ED] text-amber-900"
                }`}
              >
                {assignedAdmin
                  ? `Assigned: ${assignedAdmin}`
                  : "Open Pool"}
              </span>
            </>
          ) : null}
        </div>

        {hasLead ? (
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            <MiniInfo
              icon={Mail}
              label="Email"
              value={lead.email}
            />

            <MiniInfo
              icon={Clock3}
              label="Created"
              value={formatDate(card.time)}
            />

            <MiniInfo
              icon={MapPin}
              label="Country"
              value={
                lead.country_interest ||
                lead.country ||
                lead.destination_country
              }
            />

            <MiniInfo
              icon={MessageCircle}
              label="Phone"
              value={
                lead.phone ||
                lead.phone_number ||
                lead.whatsapp
              }
            />
          </div>
        ) : (
          <div className="mt-4 rounded-xl border-2 border-dashed border-slate-300 bg-white p-4 text-center">
            <p className="text-xs font-semibold text-slate-500">
              This card will populate automatically when a new record arrives.
            </p>
          </div>
        )}
      </div>
      </div>
    </motion.section>
  );
}

function MiniInfo({
  icon: Icon,
  label,
  value,
}) {
  return (
    <div className="min-w-0 overflow-hidden rounded-xl border-2 border-[#C9D7E6] bg-white px-3 py-3">
      <div className="flex items-center gap-2">
        <Icon
          size={12}
          className="text-orange-700"
        />

        <p className="text-[8px] font-black uppercase tracking-[0.1em] text-slate-500">
          {label}
        </p>
      </div>

      <p className="mt-1 break-all text-xs font-bold leading-5 text-[#10233f] sm:break-words">
        {value || "—"}
      </p>
    </div>
  );
}

function PriorityBadge({
  priority,
}) {
  const style =
    priority === "vip"
      ? "border-[#F97316] bg-[#FFF4E8] text-orange-800"
      : priority === "high"
      ? "border-[#FB7185] bg-[#FFF4F4] text-red-800"
      : priority === "medium"
      ? "border-[#60A5FA] bg-[#F2F7FF] text-blue-800"
      : "border-slate-300 bg-slate-50 text-slate-700";

  return (
    <span
      className={`rounded-full border-2 px-3 py-1 text-[9px] font-black uppercase tracking-[0.1em] ${style}`}
    >
      {priority}
    </span>
  );
}

function DailyEmptyState() {
  return (
    <div className="flex min-h-[250px] flex-col items-center justify-center text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl border-2 border-orange-300 bg-orange-50 text-orange-700">
        <Radar size={22} />
      </div>

      <h3 className="mt-4 text-lg font-black text-[#10233f]">
        No activity today yet
      </h3>

      <p className="mt-2 max-w-sm text-sm font-semibold leading-6 text-slate-600">
        Real inquiry and appointment activity will appear here automatically. No fake
        placeholder activity bars are shown.
      </p>
    </div>
  );
}

function buildLatestCard({
  type,
  title,
  lead,
}) {
  if (type === "appointment") {
    return {
      title,
      icon: CalendarCheck2,
      lead,
      fallbackTitle: "No booking yet",
      fallbackText:
        "Waiting for the first consultation booking.",
      type,
      tone: "blue",
      detail: lead
        ? `${lead.appointment_date || "No date"} · ${
            lead.appointment_time || "No time"
          }`
        : "",
      time:
        lead?.created_at ||
        lead?.submitted_at ||
        lead?.appointment_date,
    };
  }

  return {
    title,
    icon: UserRoundSearch,
    lead,
    fallbackTitle: "No inquiry yet",
    fallbackText:
      "Waiting for the first website inquiry.",
    type,
    tone: "orange",
    detail:
      lead?.country_interest ||
      lead?.country ||
      lead?.field_of_interest ||
      lead?.program ||
      "",
    time:
      lead?.created_at ||
      lead?.submitted_at,
  };
}

function buildBriefingLines({
  totalAnalyzed,
  hotCount,
  warmCount,
  urgentCount,
  averageScore,
  topOpportunity,
  topRisk,
  assignedCount,
  openPoolCount,
}) {
  if (!totalAnalyzed) {
    return [
      "No active CRM records have been scored yet. Intelligence will appear automatically when inquiries or appointments arrive.",
      "Paid GPT remains optional and should be used only when a counselor needs generated content or deeper reasoning.",
    ];
  }

  const lines = [
    `${totalAnalyzed} active CRM record${
      totalAnalyzed === 1 ? "" : "s"
    } analyzed with an average local score of ${averageScore}/100.`,
  ];

  if (hotCount > 0 || warmCount > 0) {
    lines.push(
      `${hotCount} hot lead${
        hotCount === 1 ? "" : "s"
      } and ${warmCount} warm lead${
        warmCount === 1 ? "" : "s"
      } should be reviewed before lower-intent follow-ups.`
    );
  } else {
    lines.push(
      "No hot leads are detected right now. Focus on qualification quality, follow-up discipline, and moving promising students forward."
    );
  }

  if (urgentCount > 0) {
    lines.push(
      `${urgentCount} urgent follow-up${
        urgentCount === 1 ? "" : "s"
      } currently need counselor attention.`
    );
  } else {
    lines.push(
      "No urgent follow-up pressure is detected right now."
    );
  }

  if (openPoolCount > 0) {
    lines.push(
      `${openPoolCount} active CRM record${
        openPoolCount === 1 ? "" : "s"
      } remain in the open pool while ${assignedCount} are assigned.`
    );
  }

  if (topOpportunity) {
    lines.push(
      `Top opportunity: ${
        topOpportunity.full_name ||
        topOpportunity.student_name ||
        "Unnamed Student"
      } with ${Number(topOpportunity.ai_score || 0)}/100 local score.`
    );
  }

  if (topRisk) {
    lines.push(
      `Highest urgency risk: ${
        topRisk.full_name ||
        topRisk.student_name ||
        "Unnamed Student"
      }${
        topRisk.ai_urgency?.message
          ? ` — ${topRisk.ai_urgency.message}`
          : "."
      }`
    );
  }

  return lines.slice(0, 5);
}

function HeaderBadge({
  children,
}) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border-2 border-white/20 bg-white/10 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.1em] text-white">
      {children}
    </span>
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

function getToneStyle(tone) {
  const styles = {
    orange: {
      card:
        "border-[#F97316] bg-[#FFF4E8] text-orange-800",
      icon:
        "border-orange-300 text-orange-700",
      badge:
        "border-[#F97316] bg-[#FFF4E8] text-orange-800",
      text: "text-orange-700",
      bar: "bg-orange-500",
    },

    red: {
      card:
        "border-[#FB7185] bg-[#FFF4F4] text-red-800",
      icon:
        "border-red-300 text-red-700",
      badge:
        "border-[#FB7185] bg-[#FFF4F4] text-red-800",
      text: "text-red-700",
      bar: "bg-red-500",
    },

    amber: {
      card:
        "border-[#F59E0B] bg-[#FFF7ED] text-amber-900",
      icon:
        "border-amber-300 text-amber-800",
      badge:
        "border-[#F59E0B] bg-[#FFF7ED] text-amber-900",
      text: "text-amber-800",
      bar: "bg-amber-500",
    },

    green: {
      card:
        "border-[#34D399] bg-[#F0FFF8] text-emerald-800",
      icon:
        "border-emerald-300 text-emerald-700",
      badge:
        "border-[#34D399] bg-[#F0FFF8] text-emerald-800",
      text: "text-emerald-700",
      bar: "bg-emerald-500",
    },

    blue: {
      card:
        "border-[#60A5FA] bg-[#F2F7FF] text-blue-800",
      icon:
        "border-blue-300 text-blue-700",
      badge:
        "border-[#60A5FA] bg-[#F2F7FF] text-blue-800",
      text: "text-blue-700",
      bar: "bg-blue-500",
    },
  };

  return (
    styles[tone] ||
    styles.orange
  );
}

function getHealthConfig(
  score,
  totalLeads
) {
  if (totalLeads === 0) {
    return {
      label: "No Data",
      message:
        "Operational health will activate when inquiry or appointment records are available.",
    };
  }

  if (score >= 80) {
    return {
      label: "Excellent",
      message:
        "Ownership, lead quality, and current activity are strong with manageable urgency pressure.",
    };
  }

  if (score >= 60) {
    return {
      label: "Healthy",
      message:
        "CRM operations look healthy overall, with some room to improve ownership or urgency handling.",
    };
  }

  if (score >= 40) {
    return {
      label: "Needs Attention",
      message:
        "Operational pressure is building. Review open-pool records, urgent follow-ups, and lead quality.",
    };
  }

  return {
    label: "Critical",
    message:
      "Current CRM operations need attention. Resolve urgency, improve ownership coverage, and work the highest-value records first.",
  };
}

export default DashboardOverview;
