// CounselorLeaderboardPanel V4 MAXIMUM — Founder Team Performance Intelligence
// src/components/admin/CounselorLeaderboardPanel.jsx
//
// Maximum pass:
// - preserves growth + compact API
// - keeps leaderboard read-only / derived (no fake Supabase writes added)
// - safer counselor data normalization
// - more balanced explainable scoring model
// - separates raw volume from outcome quality
// - adds conversion, revenue, workload and delivery signals
// - prevents huge revenue numbers from dominating the score
// - adds score normalization and rank tiers
// - adds team averages / concentration / top-performer share
// - adds warning signals for weak conversion or overloaded counselor workload
// - compact mode preserved
// - responsive mobile-safe rows
// - reduced-motion support
// - stronger navy/orange/cream Admin OS styling
// - explicit white text on navy surfaces
// - no fake AI/GPT claim: deterministic founder analytics only

import { motion, useReducedMotion } from "framer-motion";
import {
  AlertTriangle,
  Award,
  BadgeCheck,
  BarChart3,
  BriefcaseBusiness,
  CheckCircle2,
  CircleDollarSign,
  Crown,
  Gauge,
  GraduationCap,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
  UserRoundCheck,
  UsersRound,
  WalletCards,
} from "lucide-react";
import { useMemo } from "react";

function safeNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function clamp(value, min = 0, max = 100) {
  return Math.min(max, Math.max(min, safeNumber(value)));
}

function money(value) {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    maximumFractionDigits: 0,
  }).format(safeNumber(value));
}

function percent(numerator, denominator) {
  const top = safeNumber(numerator);
  const bottom = safeNumber(denominator);

  if (bottom <= 0) return 0;

  return clamp(Math.round((top / bottom) * 100));
}

function getInitials(name = "") {
  const initials = String(name || "Counselor")
    .split(" ")
    .map((part) => part.trim())
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  return initials || "C";
}

function normalizeCounselor(item = {}) {
  return {
    ...item,
    name:
      item.name ||
      item.full_name ||
      item.counselor_name ||
      "Unnamed Counselor",
    students: safeNumber(item.students),
    applications: safeNumber(item.applications),
    offers: safeNumber(item.offers),
    cas: safeNumber(item.cas),
    visas: safeNumber(item.visas),
    tasks: safeNumber(item.tasks),
    support: safeNumber(item.support),
    revenue: safeNumber(item.revenue),
  };
}

function rawPerformanceScore(item = {}) {
  const normalized = normalizeCounselor(item);

  const applicationBase = normalized.applications * 6;
  const offerQuality = normalized.offers * 12;
  const casQuality = normalized.cas * 18;
  const visaQuality = normalized.visas * 28;

  const taskContribution = Math.min(normalized.tasks, 60) * 1.2;
  const supportContribution = Math.min(normalized.support, 40) * 0.8;

  // Revenue is intentionally logarithmic-ish / capped so money cannot
  // completely overpower outcome quality.
  const revenueContribution = Math.min(normalized.revenue / 1500, 120);

  const studentLoadBonus =
    normalized.students > 0
      ? Math.min(normalized.students * 0.8, 35)
      : 0;

  return (
    applicationBase +
    offerQuality +
    casQuality +
    visaQuality +
    taskContribution +
    supportContribution +
    revenueContribution +
    studentLoadBonus
  );
}

function getOutcomeQuality(item = {}) {
  const normalized = normalizeCounselor(item);

  const offerRate = percent(
    normalized.offers,
    normalized.applications
  );

  const casRate = percent(
    normalized.cas,
    normalized.offers
  );

  const visaRate = percent(
    normalized.visas,
    normalized.cas
  );

  const available = [
    normalized.applications > 0 ? offerRate : null,
    normalized.offers > 0 ? casRate : null,
    normalized.cas > 0 ? visaRate : null,
  ].filter((value) => value !== null);

  return {
    offerRate,
    casRate,
    visaRate,
    qualityScore: available.length
      ? Math.round(
          available.reduce((sum, value) => sum + value, 0) /
            available.length
        )
      : 0,
  };
}

function getRankLabel(index) {
  if (index === 0) return "Top Performer";
  if (index === 1) return "Strong Momentum";
  if (index === 2) return "High Contributor";
  return `Rank ${index + 1}`;
}

function getRankTier(index) {
  if (index === 0) return "gold";
  if (index === 1) return "blue";
  if (index === 2) return "emerald";
  return "slate";
}

function getWorkloadSignal(item = {}, teamAverageStudents = 0) {
  const students = safeNumber(item.students);

  if (teamAverageStudents <= 0) {
    return {
      label: "No baseline",
      tone: "slate",
      detail: "Team workload baseline is not available yet.",
    };
  }

  const ratio = students / teamAverageStudents;

  if (ratio >= 1.5) {
    return {
      label: "Heavy Load",
      tone: "amber",
      detail: "Student load is well above the current team average.",
    };
  }

  if (ratio <= 0.55) {
    return {
      label: "Light Load",
      tone: "blue",
      detail: "This counselor is carrying a lighter student load.",
    };
  }

  return {
    label: "Balanced",
    tone: "green",
    detail: "Student load is reasonably close to the team average.",
  };
}

function buildCounselorModel(source = []) {
  const normalized = source.map(normalizeCounselor);

  const rankedRaw = normalized
    .map((item) => ({
      ...item,
      rawScore: rawPerformanceScore(item),
      outcome: getOutcomeQuality(item),
    }))
    .sort((a, b) => {
      if (b.rawScore !== a.rawScore) {
        return b.rawScore - a.rawScore;
      }

      if (b.outcome.qualityScore !== a.outcome.qualityScore) {
        return b.outcome.qualityScore - a.outcome.qualityScore;
      }

      return b.revenue - a.revenue;
    });

  const maxRawScore = Math.max(
    1,
    ...rankedRaw.map((item) => item.rawScore)
  );

  const teamAverageStudents = rankedRaw.length
    ? rankedRaw.reduce((sum, item) => sum + item.students, 0) /
      rankedRaw.length
    : 0;

  return rankedRaw.map((item, index) => ({
    ...item,
    rank: index + 1,
    score: Math.round((item.rawScore / maxRawScore) * 100),
    workload: getWorkloadSignal(item, teamAverageStudents),
  }));
}

export default function CounselorLeaderboardPanel({
  growth = {},
  compact = false,
}) {
  const reduceMotion = useReducedMotion();

  const model = useMemo(() => {
    const source = Array.isArray(growth.counselorLeaderboard)
      ? growth.counselorLeaderboard
      : [];

    const fullRows = buildCounselorModel(source);

    const rows = compact ? fullRows.slice(0, 4) : fullRows;

    const totalStudents = fullRows.reduce(
      (sum, item) => sum + item.students,
      0
    );

    const totalRevenue = fullRows.reduce(
      (sum, item) => sum + item.revenue,
      0
    );

    const totalApplications = fullRows.reduce(
      (sum, item) => sum + item.applications,
      0
    );

    const totalOffers = fullRows.reduce(
      (sum, item) => sum + item.offers,
      0
    );

    const totalCas = fullRows.reduce(
      (sum, item) => sum + item.cas,
      0
    );

    const totalVisas = fullRows.reduce(
      (sum, item) => sum + item.visas,
      0
    );

    const averageQuality = fullRows.length
      ? Math.round(
          fullRows.reduce(
            (sum, item) => sum + item.outcome.qualityScore,
            0
          ) / fullRows.length
        )
      : 0;

    const topRevenueShare =
      fullRows.length && totalRevenue > 0
        ? percent(fullRows[0]?.revenue, totalRevenue)
        : 0;

    const teamOfferRate = percent(totalOffers, totalApplications);
    const teamCasRate = percent(totalCas, totalOffers);
    const teamVisaRate = percent(totalVisas, totalCas);

    return {
      rows,
      fullRows,
      totalStudents,
      totalRevenue,
      totalApplications,
      totalOffers,
      totalCas,
      totalVisas,
      averageQuality,
      topRevenueShare,
      teamOfferRate,
      teamCasRate,
      teamVisaRate,
    };
  }, [growth.counselorLeaderboard, compact]);

  return (
    <motion.section
      initial={reduceMotion ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reduceMotion ? 0 : 0.28 }}
      className="min-w-0 overflow-hidden rounded-[2rem] border-[3px] border-orange-300 bg-white shadow-[0_16px_42px_rgba(15,35,63,0.07)]"
    >
      <div className="grid min-w-0 2xl:grid-cols-[minmax(0,1fr)_minmax(20rem,0.42fr)]">
        <div className="min-w-0 bg-[#123866] p-5 text-white sm:p-6">
          <div className="flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-2 rounded-full border-2 border-white/20 bg-white/10 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.14em] text-white">
              <UsersRound size={12} />
              Counselor Leaderboard
            </span>

            <span className="inline-flex items-center gap-2 rounded-full border-2 border-white/20 bg-white/10 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.14em] text-white">
              <ShieldCheck size={12} />
              Founder View
            </span>
          </div>

          <h2 className="mt-4 break-words text-2xl font-black leading-tight tracking-tight text-white sm:text-3xl">
            Team Performance
          </h2>

          <p className="mt-2 max-w-3xl break-words text-sm font-semibold leading-6 text-white">
            Compare counselor output using student workload, applications,
            offers, CAS, visas, support activity, tasks and collected revenue
            without letting a single metric dominate the ranking.
          </p>

          <div className="mt-5 grid grid-cols-[repeat(auto-fit,minmax(min(100%,7rem),1fr))] gap-2">
            <DarkMetric
              label="Counselors"
              value={model.fullRows.length}
            />
            <DarkMetric
              label="Students"
              value={model.totalStudents}
            />
            <DarkMetric
              label="Applications"
              value={model.totalApplications}
            />
            <DarkMetric
              label="Visas"
              value={model.totalVisas}
            />
          </div>
        </div>

        <div className="min-w-0 bg-orange-500 p-5 text-white sm:p-6">
          <p className="text-[9px] font-black uppercase tracking-[0.15em] text-white">
            Team Outcome Health
          </p>

          <p className="mt-3 text-5xl font-black text-white">
            {model.averageQuality}%
          </p>

          <p className="mt-1 text-xs font-black uppercase tracking-[0.1em] text-white">
            average outcome quality
          </p>

          <div className="mt-4 grid grid-cols-[repeat(auto-fit,minmax(min(100%,8rem),1fr))] gap-2">
            <OrangeMetric
              label="Revenue"
              value={money(model.totalRevenue)}
            />
            <OrangeMetric
              label="Top Revenue Share"
              value={`${model.topRevenueShare}%`}
            />
          </div>
        </div>
      </div>

      <div className="space-y-5 bg-[#fff8ee] p-4 sm:p-5">
        {!compact ? (
          <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,13rem),1fr))] gap-3">
            <HealthMetric
              label="Offer Rate"
              value={`${model.teamOfferRate}%`}
              helper={`${model.totalOffers} offers from ${model.totalApplications} applications`}
              tone={model.teamOfferRate >= 50 ? "green" : "orange"}
            />

            <HealthMetric
              label="CAS Rate"
              value={`${model.teamCasRate}%`}
              helper={`${model.totalCas} CAS from ${model.totalOffers} offers`}
              tone={model.teamCasRate >= 50 ? "green" : "orange"}
            />

            <HealthMetric
              label="Visa Rate"
              value={`${model.teamVisaRate}%`}
              helper={`${model.totalVisas} visas from ${model.totalCas} CAS records`}
              tone={model.teamVisaRate >= 50 ? "green" : "orange"}
            />
          </div>
        ) : null}

        {model.rows.length ? (
          <div className="min-w-0 space-y-4">
            {model.rows.map((item, index) => (
              <LeaderboardRow
                key={`${item.name}-${index}`}
                item={item}
                index={index}
                compact={compact}
                reduceMotion={reduceMotion}
              />
            ))}
          </div>
        ) : (
          <EmptyState />
        )}

        {!compact && model.fullRows.length > 0 ? (
          <FounderNote />
        ) : null}
      </div>
    </motion.section>
  );
}

function LeaderboardRow({
  item,
  index,
  compact,
  reduceMotion,
}) {
  const rankTone = getRankTone(getRankTier(index));

  const metrics = [
    {
      label: "Applications",
      short: "Apps",
      value: item.applications,
    },
    {
      label: "Offers",
      short: "Offers",
      value: item.offers,
    },
    {
      label: "CAS",
      short: "CAS",
      value: item.cas,
    },
    {
      label: "Visas",
      short: "Visas",
      value: item.visas,
    },
  ];

  return (
    <motion.article
      initial={reduceMotion ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: reduceMotion ? 0 : 0.22,
        delay: reduceMotion ? 0 : Math.min(index * 0.025, 0.12),
      }}
      className={`min-w-0 overflow-hidden rounded-[1.5rem] border-[3px] bg-white shadow-[0_8px_22px_rgba(15,35,63,0.04)] transition hover:-translate-y-0.5 hover:border-orange-400 ${
        index === 0 ? "border-orange-400" : "border-slate-300"
      }`}
    >
      <div className="min-w-0 p-4 sm:p-5">
        {/* Identity + rank stay together. No detached side rail. */}
        <div className="flex min-w-0 flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="flex min-w-0 flex-1 items-start gap-3">
            <div
              className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border-[3px] text-sm font-black ${rankTone.avatar}`}
            >
              {index === 0 ? <Crown size={18} /> : getInitials(item.name)}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex min-w-0 flex-wrap items-center gap-2">
                <p className="min-w-0 break-words text-base font-black leading-5 text-[#10233f]">
                  {item.name}
                </p>

                <span
                  className={`max-w-full rounded-full border-2 px-2.5 py-1 text-[9px] font-black uppercase leading-4 tracking-[0.08em] ${rankTone.badge}`}
                >
                  {getRankLabel(index)}
                </span>
              </div>

              <p className="mt-1 break-words text-xs font-semibold leading-5 text-slate-600">
                {item.students} students · {money(item.revenue)} collected
              </p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-3 rounded-2xl border-2 border-orange-300 bg-[#fff8ee] px-4 py-3">
            <div>
              <p className="text-[8px] font-black uppercase tracking-[0.1em] text-slate-500">
                Rank
              </p>
              <p className="mt-0.5 text-2xl font-black leading-none text-[#10233f]">
                #{index + 1}
              </p>
            </div>

            <div className="h-9 w-px bg-orange-200" />

            <div>
              <p className="text-[8px] font-black uppercase tracking-[0.1em] text-slate-500">
                Score
              </p>
              <p className="mt-0.5 text-lg font-black leading-none text-orange-700">
                {item.score}
              </p>
            </div>
          </div>
        </div>

        {/* Metrics always receive the full card width. */}
        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {metrics.map((metric) => (
            <div
              key={metric.label}
              className="min-w-0 rounded-xl border-2 border-slate-300 bg-[#fffaf4] p-3 text-center"
            >
              <p className="text-xl font-black text-[#10233f]">
                {metric.value}
              </p>
              <p className="mt-1 break-words text-[9px] font-black uppercase leading-4 tracking-[0.06em] text-slate-500">
                {metric.short}
              </p>
            </div>
          ))}
        </div>

        {/* Signals no longer share width with metrics or rank. */}
        <div className="mt-4 flex min-w-0 flex-wrap gap-2">
          <MiniSignal
            icon={BadgeCheck}
            label="Quality"
            value={`${item.outcome.qualityScore}%`}
            tone={
              item.outcome.qualityScore >= 70
                ? "green"
                : item.outcome.qualityScore >= 45
                ? "orange"
                : "red"
            }
          />

          <MiniSignal
            icon={BriefcaseBusiness}
            label="Workload"
            value={item.workload.label}
            tone={item.workload.tone}
          />

          <MiniSignal
            icon={CircleDollarSign}
            label="Revenue"
            value={money(item.revenue)}
            tone="blue"
          />
        </div>

        {!compact ? (
          <>
            <div className="mt-5 grid grid-cols-[repeat(auto-fit,minmax(min(100%,11rem),1fr))] gap-3">
              <ConversionCard
                label="Application → Offer"
                value={`${item.outcome.offerRate}%`}
                good={item.outcome.offerRate >= 50}
              />

              <ConversionCard
                label="Offer → CAS"
                value={`${item.outcome.casRate}%`}
                good={item.outcome.casRate >= 50}
              />

              <ConversionCard
                label="CAS → Visa"
                value={`${item.outcome.visaRate}%`}
                good={item.outcome.visaRate >= 50}
              />
            </div>

            <div className="mt-4">
              <div className="mb-2 flex min-w-0 flex-wrap items-center justify-between gap-3">
                <p className="min-w-0 text-xs font-black text-slate-600">
                  Founder performance score
                </p>

                <span className="shrink-0 rounded-full border-2 border-orange-300 bg-orange-50 px-3 py-1 text-xs font-black text-orange-800">
                  {item.score}/100
                </span>
              </div>

              <div className="h-2.5 overflow-hidden rounded-full border border-slate-200 bg-slate-100">
                <motion.div
                  initial={reduceMotion ? false : { width: 0 }}
                  animate={{ width: `${item.score}%` }}
                  transition={{
                    duration: reduceMotion ? 0 : 0.6,
                    delay: reduceMotion ? 0 : 0.05,
                  }}
                  className="h-full rounded-full bg-orange-500"
                />
              </div>
            </div>
          </>
        ) : null}
      </div>
    </motion.article>
  );
}

function HealthMetric({
  label,
  value,
  helper,
  tone = "orange",
}) {
  const style =
    tone === "green"
      ? "border-emerald-300 bg-emerald-50"
      : "border-orange-300 bg-orange-50";

  return (
    <div className={`min-w-0 rounded-[1.3rem] border-[3px] p-4 ${style}`}>
      <p className="text-[9px] font-black uppercase tracking-[0.12em] text-slate-600">
        {label}
      </p>

      <p className="mt-2 text-3xl font-black text-[#10233f]">
        {value}
      </p>

      <p className="mt-1 break-words text-xs font-semibold leading-5 text-slate-600">
        {helper}
      </p>
    </div>
  );
}

function ConversionCard({
  label,
  value,
  good,
}) {
  return (
    <div
      className={`min-w-0 rounded-xl border-2 p-3 ${
        good
          ? "border-emerald-300 bg-emerald-50"
          : "border-amber-300 bg-amber-50"
      }`}
    >
      <p
        className={`break-words text-[8px] font-black uppercase leading-4 tracking-[0.07em] ${
          good ? "text-emerald-800" : "text-amber-900"
        }`}
      >
        {label}
      </p>

      <p className="mt-1 text-xl font-black text-[#10233f]">
        {value}
      </p>
    </div>
  );
}

function MiniSignal({
  icon: Icon,
  label,
  value,
  tone = "blue",
}) {
  const styles = {
    green:
      "border-emerald-300 bg-emerald-50 text-emerald-800",
    orange:
      "border-orange-300 bg-orange-50 text-orange-800",
    red:
      "border-red-300 bg-red-50 text-red-800",
    amber:
      "border-amber-300 bg-amber-50 text-amber-900",
    blue:
      "border-blue-300 bg-blue-50 text-blue-800",
    slate:
      "border-slate-300 bg-slate-50 text-slate-600",
  };

  return (
    <span
      className={`inline-flex max-w-full shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border-2 px-2.5 py-1 text-[9px] font-black leading-4 ${
        styles[tone] || styles.blue
      }`}
    >
      <Icon size={11} className="shrink-0" />
      <span>{label}: {value}</span>
    </span>
  );
}

function FounderNote() {
  return (
    <div className="rounded-[1.4rem] border-[3px] border-blue-300 bg-blue-50 p-4">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border-2 border-blue-300 bg-white text-blue-700">
          <BarChart3 size={17} />
        </div>

        <div>
          <p className="text-sm font-black text-[#10233f]">
            How this leaderboard should be used
          </p>

          <p className="mt-1 text-xs font-semibold leading-5 text-slate-700">
            The ranking is a management signal, not a salary or disciplinary
            decision by itself. Counselor workload, student difficulty, intake
            timing and assignment mix can materially affect outcomes.
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
    <div className="min-w-0 rounded-xl border-2 border-white/20 bg-white/10 p-3 text-white">
      <p className="break-words text-[8px] font-black uppercase leading-4 tracking-[0.07em] text-white">
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
    <div className="min-w-0 rounded-xl border-2 border-white/25 bg-white/10 p-3 text-white">
      <p className="break-words text-[8px] font-black uppercase leading-4 tracking-[0.07em] text-white">
        {label}
      </p>

      <p className="mt-1 break-words text-lg font-black text-white">
        {value}
      </p>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-[1.5rem] border-[3px] border-dashed border-slate-300 bg-white p-8 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border-2 border-orange-300 bg-orange-50 text-orange-700">
        <UsersRound size={22} />
      </div>

      <h3 className="mt-4 text-lg font-black text-[#10233f]">
        No counselor performance data yet
      </h3>

      <p className="mx-auto mt-2 max-w-xl text-sm font-semibold leading-6 text-slate-600">
        Assign students and connect real application, offer, CAS, visa, task,
        support and revenue data to populate the leaderboard.
      </p>
    </div>
  );
}

function getRankTone(tier) {
  const tones = {
    gold: {
      avatar:
        "border-orange-400 bg-orange-500 text-white",
      badge:
        "border-orange-300 bg-orange-50 text-orange-800",
    },
    blue: {
      avatar:
        "border-blue-300 bg-blue-50 text-blue-700",
      badge:
        "border-blue-300 bg-blue-50 text-blue-800",
    },
    emerald: {
      avatar:
        "border-emerald-300 bg-emerald-50 text-emerald-700",
      badge:
        "border-emerald-300 bg-emerald-50 text-emerald-800",
    },
    slate: {
      avatar:
        "border-slate-300 bg-slate-50 text-slate-700",
      badge:
        "border-slate-300 bg-slate-50 text-slate-600",
    },
  };

  return tones[tier] || tones.slate;
}