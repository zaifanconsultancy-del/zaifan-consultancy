// FounderGrowthDashboard V4 MAXIMUM — Founder Growth & Business Intelligence OS
// src/components/admin/FounderGrowthDashboard.jsx
//
// Maximum pass:
// - preserves snapshot / executiveSnapshot / counselorSnapshot / paymentSnapshot APIs
// - preserves all child panels and buildFounderGrowthData export
// - safer array/number/string/date normalization
// - clamps conversion rates to honest 0–100% ranges
// - avoids double-count inflation where possible
// - removes decorative fake "AI" claims
// - adds business health, funnel pressure, revenue health, counselor coverage, and stalled-workload intelligence
// - adds persistent Founder OS view selection
// - safer refresh handling with loading/error state
// - current Zaifan Admin OS cream/orange/navy design system
// - navy surfaces use explicit white text only
// - red reserved for real pressure/risk
// - responsive/mobile-first structure
// - no fake Supabase writes or invented backend tables

import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  AlertTriangle,
  BarChart3,
  BriefcaseBusiness,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  CircleGauge,
  Clock3,
  Coins,
  GraduationCap,
  Landmark,
  RefreshCw,
  Rocket,
  ShieldCheck,
  Target,
  TrendingUp,
  UserRoundCheck,
  UsersRound,
  WalletCards,
} from "lucide-react";

import GrowthFunnelPanel from "./GrowthFunnelPanel";
import RevenueIntelligencePanel from "./RevenueIntelligencePanel";
import CounselorLeaderboardPanel from "../team/CounselorLeaderboardPanel";
import MarketIntelligencePanel from "./MarketIntelligencePanel";
import BusinessForecastPanel from "./BusinessForecastPanel";

const VIEW_STORAGE_KEY = "zaifan-founder-growth-active-view";

const VALID_VIEWS = new Set([
  "overview",
  "funnel",
  "revenue",
  "team",
  "market",
  "forecast",
]);

function safeArray(value) {
  return Array.isArray(value) ? value.filter(Boolean) : [];
}

function safeNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function safeString(value, fallback = "") {
  if (value === null || value === undefined) return fallback;
  return String(value);
}

function lower(value) {
  return safeString(value).toLowerCase().trim();
}

function clamp(value, min = 0, max = 100) {
  return Math.max(min, Math.min(max, safeNumber(value)));
}

function percent(numerator, denominator) {
  const top = safeNumber(numerator);
  const bottom = safeNumber(denominator);

  if (bottom <= 0) return 0;

  return clamp(Math.round((top / bottom) * 100));
}

function money(value, currency = "GBP") {
  const amount = safeNumber(value);

  try {
    return new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency: safeString(currency, "GBP").toUpperCase(),
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${amount.toLocaleString("en-GB")} ${safeString(currency, "GBP")}`;
  }
}

function isDateWithinDays(value, days = 30) {
  if (!value) return false;

  const time = new Date(value).getTime();

  if (!Number.isFinite(time)) return false;

  const diff = Date.now() - time;

  // Future-dated records should not count as "recent".
  return diff >= 0 && diff <= days * 24 * 60 * 60 * 1000;
}

function daysSince(value) {
  if (!value) return null;

  const time = new Date(value).getTime();

  if (!Number.isFinite(time)) return null;

  const diff = Date.now() - time;

  if (diff < 0) return 0;

  return Math.floor(diff / 86400000);
}

function getStudentName(student = {}) {
  return (
    student.student_name ||
    student.full_name ||
    student.name ||
    student.lead_name ||
    student.first_name ||
    student.email ||
    "Student"
  );
}

function getStudentStage(student = {}) {
  const raw = lower(
    student.stage ||
      student.current_stage ||
      student.application_stage ||
      student.status ||
      student.student_status ||
      student.journey_stage
  );

  if (
    raw.includes("visa granted") ||
    raw.includes("visa approved") ||
    raw.includes("enrolled") ||
    raw.includes("arrived")
  ) {
    return "Visa/Enrollment";
  }

  if (raw.includes("visa")) return "Visa";
  if (raw.includes("cas")) return "CAS";
  if (raw.includes("offer")) return "Offer";

  if (
    raw.includes("application") ||
    raw.includes("applied")
  ) {
    return "Application";
  }

  if (
    raw.includes("university") ||
    raw.includes("shortlist") ||
    raw.includes("planning")
  ) {
    return "University Planning";
  }

  return "Inquiry";
}

function getCounselorName(record = {}) {
  return (
    record.assigned_admin_name ||
    record.assigned_counselor ||
    record.counselor_name ||
    record.counselor ||
    record.assigned_to_name ||
    record.assigned_to ||
    record.owner_name ||
    record.owner ||
    record.created_by_name ||
    record.created_by ||
    "Unassigned"
  );
}

function getCountry(record = {}) {
  return (
    record.country ||
    record.country_interest ||
    record.destination_country ||
    record.study_country ||
    record.preferred_country ||
    record.university_country ||
    "Unknown"
  );
}

function getUniversity(record = {}) {
  return (
    record.university_name ||
    record.university ||
    record.institution_name ||
    record.school_name ||
    "Unknown"
  );
}

function getCourse(record = {}) {
  return (
    record.course_name ||
    record.course ||
    record.program_name ||
    record.program ||
    record.field_of_interest ||
    "Unknown"
  );
}

function getSource(record = {}) {
  return (
    record.source ||
    record.lead_source ||
    record.marketing_source ||
    record.referral_source ||
    record.channel ||
    "Unknown"
  );
}

function getAmount(record = {}) {
  return safeNumber(
    record.amount ??
      record.total_amount ??
      record.invoice_amount ??
      record.paid_amount ??
      record.payment_amount ??
      record.fee_amount ??
      0
  );
}

function getCurrency(rawSnapshot = {}) {
  return (
    rawSnapshot.currency ||
    rawSnapshot.baseCurrency ||
    rawSnapshot.financeCurrency ||
    "GBP"
  );
}

function getRecordId(record = {}) {
  return safeString(
    record.id ||
      record.student_id ||
      record.application_id ||
      record.email ||
      record.phone ||
      ""
  );
}

function uniqueById(records = []) {
  const seen = new Set();

  return safeArray(records).filter((record, index) => {
    const id = getRecordId(record);

    if (!id) {
      // Preserve anonymous rows rather than silently dropping legitimate records.
      return true;
    }

    const key = `${id}`;

    if (seen.has(key)) return false;

    seen.add(key);
    return true;
  });
}

function getCounselorSeed(name) {
  return {
    name,
    students: 0,
    applications: 0,
    offers: 0,
    cas: 0,
    visas: 0,
    tasks: 0,
    support: 0,
    revenue: 0,
  };
}

function incrementCounselor(map, record, field, amount = 1) {
  const name = getCounselorName(record);

  const current =
    map.get(name) ||
    getCounselorSeed(name);

  current[field] += amount;

  map.set(name, current);
}

function buildFrequencyList(map) {
  return Array.from(map.entries())
    .map(([name, count]) => ({
      name,
      count,
    }))
    .sort((a, b) => b.count - a.count);
}

function buildFounderGrowthData(rawSnapshot = {}) {
  const students = uniqueById(
    safeArray(
      rawSnapshot.students ||
        rawSnapshot.inquiries ||
        rawSnapshot.assignedStudents
    )
  );

  const applications = uniqueById(
    safeArray(
      rawSnapshot.applications ||
        rawSnapshot.studentApplications
    )
  );

  const offers = uniqueById(
    safeArray(
      rawSnapshot.offers ||
        rawSnapshot.studentOffers
    )
  );

  const casRecords = uniqueById(
    safeArray(
      rawSnapshot.casRecords ||
        rawSnapshot.cas ||
        rawSnapshot.studentCAS
    )
  );

  const visas = uniqueById(
    safeArray(
      rawSnapshot.visas ||
        rawSnapshot.visaApplications ||
        rawSnapshot.studentVisas
    )
  );

  const invoices = uniqueById(
    safeArray(
      rawSnapshot.invoices ||
        rawSnapshot.studentInvoices
    )
  );

  const payments = uniqueById(
    safeArray(
      rawSnapshot.payments ||
        rawSnapshot.studentPayments
    )
  );

  const tasks = uniqueById(
    safeArray(
      rawSnapshot.tasks ||
        rawSnapshot.studentTasks
    )
  );

  const support = uniqueById(
    safeArray(
      rawSnapshot.supportRequests ||
        rawSnapshot.support ||
        rawSnapshot.studentSupportRequests
    )
  );

  const universities = uniqueById(
    safeArray(
      rawSnapshot.universities ||
        rawSnapshot.studentUniversities ||
        rawSnapshot.shortlists
    )
  );

  const currency = getCurrency(rawSnapshot);

  const stages = [
    {
      key: "inquiry",
      label: "Inquiry",
      count: students.length,
    },
    {
      key: "planning",
      label: "University Planning",
      count: Math.max(
        universities.length,
        students.filter(
          (student) =>
            getStudentStage(student) ===
            "University Planning"
        ).length
      ),
    },
    {
      key: "application",
      label: "Applications",
      count: Math.max(
        applications.length,
        students.filter(
          (student) =>
            getStudentStage(student) ===
            "Application"
        ).length
      ),
    },
    {
      key: "offer",
      label: "Offers",
      count: Math.max(
        offers.length,
        students.filter(
          (student) =>
            getStudentStage(student) === "Offer"
        ).length
      ),
    },
    {
      key: "cas",
      label: "CAS",
      count: Math.max(
        casRecords.length,
        students.filter(
          (student) =>
            getStudentStage(student) === "CAS"
        ).length
      ),
    },
    {
      key: "visa",
      label: "Visa",
      count: Math.max(
        visas.length,
        students.filter((student) =>
          getStudentStage(student).includes(
            "Visa"
          )
        ).length
      ),
    },
  ];

  const collectedRevenue = payments.reduce(
    (sum, item) =>
      sum + getAmount(item),
    0
  );

  const invoicedRevenue = invoices.reduce(
    (sum, item) =>
      sum + getAmount(item),
    0
  );

  const outstandingRevenue = Math.max(
    0,
    invoicedRevenue -
      collectedRevenue
  );

  const recentStudents = students.filter(
    (student) =>
      isDateWithinDays(
        student.created_at ||
          student.createdAt ||
          student.date ||
          student.updated_at,
        30
      )
  ).length;

  const counselorMap = new Map();

  students.forEach((item) =>
    incrementCounselor(
      counselorMap,
      item,
      "students"
    )
  );

  applications.forEach((item) =>
    incrementCounselor(
      counselorMap,
      item,
      "applications"
    )
  );

  offers.forEach((item) =>
    incrementCounselor(
      counselorMap,
      item,
      "offers"
    )
  );

  casRecords.forEach((item) =>
    incrementCounselor(
      counselorMap,
      item,
      "cas"
    )
  );

  visas.forEach((item) =>
    incrementCounselor(
      counselorMap,
      item,
      "visas"
    )
  );

  tasks.forEach((item) =>
    incrementCounselor(
      counselorMap,
      item,
      "tasks"
    )
  );

  support.forEach((item) =>
    incrementCounselor(
      counselorMap,
      item,
      "support"
    )
  );

  payments.forEach((item) =>
    incrementCounselor(
      counselorMap,
      item,
      "revenue",
      getAmount(item)
    )
  );

  const countries = new Map();
  const universitiesMap = new Map();
  const courses = new Map();
  const sources = new Map();

  [
    ...students,
    ...applications,
    ...universities,
  ].forEach((item) => {
    const country = getCountry(item);
    const university = getUniversity(item);
    const course = getCourse(item);
    const source = getSource(item);

    countries.set(
      country,
      (countries.get(country) || 0) + 1
    );

    universitiesMap.set(
      university,
      (universitiesMap.get(university) ||
        0) + 1
    );

    courses.set(
      course,
      (courses.get(course) || 0) + 1
    );

    sources.set(
      source,
      (sources.get(source) || 0) + 1
    );
  });

  const stalledStudents = students
    .map((student) => {
      const activity =
        student.updated_at ||
        student.updatedAt ||
        student.last_activity_at ||
        student.lastActivityAt ||
        student.created_at;

      return {
        student,
        ageDays: daysSince(activity),
        activity,
      };
    })
    .filter(
      ({ ageDays }) =>
        Number.isFinite(ageDays) &&
        ageDays >= 21
    )
    .sort(
      (a, b) =>
        safeNumber(b.ageDays) -
        safeNumber(a.ageDays)
    )
    .slice(0, 12)
    .map(
      ({
        student,
        activity,
        ageDays,
      }) => ({
        id:
          student.id ||
          student.student_id ||
          student.email,
        name: getStudentName(student),
        stage: getStudentStage(student),
        counselor:
          getCounselorName(student),
        lastActivity: activity,
        ageDays,
      })
    );

  const offerRate = percent(
    offers.length,
    applications.length
  );

  const casRate = percent(
    casRecords.length,
    offers.length
  );

  const visaRate = percent(
    visas.length,
    casRecords.length
  );

  const conversionRate = percent(
    visas.length,
    students.length
  );

  const assignmentCoverage = percent(
    students.filter(
      (student) =>
        getCounselorName(student) !==
        "Unassigned"
    ).length,
    students.length
  );

  const collectionRate = percent(
    collectedRevenue,
    invoicedRevenue
  );

  const stalledRate = percent(
    stalledStudents.length,
    students.length
  );

  const businessHealth = students.length
    ? clamp(
        Math.round(
          assignmentCoverage * 0.22 +
            offerRate * 0.18 +
            casRate * 0.18 +
            visaRate * 0.18 +
            collectionRate * 0.18 +
            (100 - stalledRate) * 0.06
        )
      )
    : 0;

  return {
    students,
    applications,
    offers,
    casRecords,
    visas,
    invoices,
    payments,
    tasks,
    support,
    universities,
    stages,
    currency,
    recentStudents,
    collectedRevenue,
    invoicedRevenue,
    outstandingRevenue,
    conversionRate,
    offerRate,
    casRate,
    visaRate,
    assignmentCoverage,
    collectionRate,
    stalledRate,
    businessHealth,

    counselorLeaderboard:
      Array.from(
        counselorMap.values()
      ).sort((a, b) => {
        const aScore =
          a.visas * 40 +
          a.cas * 25 +
          a.offers * 15 +
          a.applications * 8 +
          a.tasks * 2 +
          a.support * 2 +
          a.revenue / 1000;

        const bScore =
          b.visas * 40 +
          b.cas * 25 +
          b.offers * 15 +
          b.applications * 8 +
          b.tasks * 2 +
          b.support * 2 +
          b.revenue / 1000;

        return bScore - aScore;
      }),

    market: {
      countries:
        buildFrequencyList(countries),
      universities:
        buildFrequencyList(
          universitiesMap
        ),
      courses:
        buildFrequencyList(courses),
      sources:
        buildFrequencyList(sources),
    },

    stalledStudents,
  };
}

function getStoredView() {
  if (typeof window === "undefined") {
    return "overview";
  }

  try {
    const saved =
      window.localStorage.getItem(
        VIEW_STORAGE_KEY
      );

    return VALID_VIEWS.has(saved)
      ? saved
      : "overview";
  } catch {
    return "overview";
  }
}

function getBusinessHealthConfig(score) {
  if (score >= 80) {
    return {
      label: "Strong",
      message:
        "Growth operations are healthy across conversion, ownership, collection, and pipeline movement.",
    };
  }

  if (score >= 60) {
    return {
      label: "Healthy",
      message:
        "Business health is generally good, with some room to improve funnel conversion or revenue collection.",
    };
  }

  if (score >= 40) {
    return {
      label: "Needs Attention",
      message:
        "Founder attention is needed across funnel leakage, stalled cases, ownership, or payment collection.",
    };
  }

  return {
    label: "Critical",
    message:
      "Business health is under pressure. Clean the funnel, assign ownership, recover outstanding revenue, and revive stalled students.",
  };
}

function FounderMetricCard({
  label,
  value,
  helper,
  icon: Icon,
  tone = "orange",
}) {
  const tones = {
    orange:
      "border-orange-400 bg-orange-50 text-orange-800",
    amber:
      "border-amber-400 bg-amber-50 text-amber-900",
    red:
      "border-red-400 bg-red-50 text-red-800",
    navy:
      "border-[#234E78] bg-[#EEF4FA] text-[#123865]",
    green:
      "border-emerald-400 bg-emerald-50 text-emerald-800",
    blue:
      "border-blue-400 bg-blue-50 text-blue-800",
    default:
      "border-slate-300 bg-[#F8FAFC] text-[#123865]",
  };

  const style =
    tones[tone] ||
    tones.orange;

  return (
    <div
      className={`relative min-w-0 overflow-hidden rounded-[1.5rem] border-[3px] p-4 shadow-[0_10px_26px_rgba(23,36,61,0.06)] ${style}`}
    >
      <div className="absolute inset-x-0 top-0 h-1.5 bg-current opacity-70" />

      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="break-words text-[9px] font-black uppercase leading-4 tracking-[0.11em] text-[#10233F]">
            {label}
          </p>

          <p className="mt-3 break-words text-3xl font-black leading-none tracking-[-0.025em] text-[#10233F]">
            {value}
          </p>
        </div>

        {Icon ? (
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border-2 border-current/25 bg-white/75">
            <Icon size={17} />
          </span>
        ) : null}
      </div>

      {helper ? (
        <p className="mt-3 min-h-[40px] text-xs font-semibold leading-5 text-slate-600">
          {helper}
        </p>
      ) : null}

      <p className="mt-3 text-[9px] font-black uppercase tracking-[0.1em] opacity-70">
        Read-only business signal
      </p>
    </div>
  );
}

function FounderRecommendationCard({
  title,
  detail,
  tone = "orange",
  icon: Icon = Target,
}) {
  const tones = {
    orange:
      "border-orange-400 bg-orange-50",
    amber:
      "border-amber-400 bg-amber-50",
    red:
      "border-red-400 bg-red-50",
    navy:
      "border-[#234E78] bg-[#EEF4FA]",
    green:
      "border-emerald-400 bg-emerald-50",
  };

  const iconTone =
    tone === "red"
      ? "border-red-300 text-red-700"
      : tone === "navy"
      ? "border-[#234E78] text-[#123865]"
      : tone === "green"
      ? "border-emerald-300 text-emerald-700"
      : "border-orange-300 text-orange-700";

  return (
    <div
      className={`relative overflow-hidden rounded-[1.45rem] border-[3px] p-4 shadow-[0_9px_24px_rgba(23,36,61,0.055)] ${
        tones[tone] ||
        tones.orange
      }`}
    >
      <div className="flex items-start gap-3">
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border-2 bg-white ${iconTone}`}>
          <Icon size={17} />
        </div>

        <div className="min-w-0">
          <p className="break-words font-black leading-5 text-[#10233F]">
            {title}
          </p>

          <p className="mt-1 text-sm font-semibold leading-6 text-slate-600">
            {detail}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function FounderGrowthDashboard({
  snapshot,
  executiveSnapshot,
  counselorSnapshot,
  paymentSnapshot,
  adminProfile,
  onRefresh,
}) {
  const [
    activeView,
    setActiveView,
  ] = useState(() =>
    getStoredView()
  );

  const [
    refreshing,
    setRefreshing,
  ] = useState(false);

  const [
    refreshError,
    setRefreshError,
  ] = useState("");

  const [
    showRecommendations,
    setShowRecommendations,
  ] = useState(true);

  const [
    showStalledWorkload,
    setShowStalledWorkload,
  ] = useState(true);

  useEffect(() => {
    if (
      typeof window ===
      "undefined"
    ) {
      return;
    }

    try {
      window.localStorage.setItem(
        VIEW_STORAGE_KEY,
        activeView
      );
    } catch {
      // View persistence must never break Founder OS.
    }
  }, [activeView]);

  const growth = useMemo(
    () =>
      buildFounderGrowthData({
        ...(snapshot || {}),
        ...(executiveSnapshot ||
          {}),
        ...(counselorSnapshot ||
          {}),
        ...(paymentSnapshot ||
          {}),
      }),
    [
      snapshot,
      executiveSnapshot,
      counselorSnapshot,
      paymentSnapshot,
    ]
  );

  const health =
    getBusinessHealthConfig(
      growth.businessHealth
    );

  const recommendations = useMemo(() => {
    const items = [];

    if (
      growth.outstandingRevenue >
      0
    ) {
      items.push({
        title:
          "Recover outstanding revenue",
        detail: `${money(
          growth.outstandingRevenue,
          growth.currency
        )} is still outstanding. Prioritize payment follow-ups before increasing manual workload.`,
        tone: "amber",
        icon: WalletCards,
      });
    }

    if (
      growth.offerRate < 40 &&
      growth.applications.length >
        0
    ) {
      items.push({
        title:
          "Application-to-offer bottleneck",
        detail: `Offer conversion is ${growth.offerRate}%. Review university fit, document quality, and application execution.`,
        tone: "red",
        icon: AlertTriangle,
      });
    }

    if (
      growth.assignmentCoverage <
        90 &&
      growth.students.length >
        0
    ) {
      items.push({
        title:
          "Counselor ownership gap",
        detail: `${growth.assignmentCoverage}% of students have clear counselor ownership. Assign the remaining records before they leak from the funnel.`,
        tone: "navy",
        icon: UserRoundCheck,
      });
    }

    if (
      growth.stalledStudents.length >
      0
    ) {
      items.push({
        title:
          "Revive stalled students",
        detail: `${growth.stalledStudents.length} student record${
          growth.stalledStudents
            .length === 1
            ? ""
            : "s"
        } show 21+ days without meaningful activity.`,
        tone: "red",
        icon: Clock3,
      });
    }

    if (
      growth.recentStudents > 0
    ) {
      items.push({
        title:
          "Protect new inquiry momentum",
        detail: `${growth.recentStudents} students entered in the last 30 days. Keep assignment, first-contact speed, and reminder discipline tight.`,
        tone: "orange",
        icon: Rocket,
      });
    }

    if (!items.length) {
      items.push({
        title:
          "Founder OS is stable",
        detail:
          "No major growth bottleneck is visible from the current snapshot. Continue improving funnel conversion and revenue collection.",
        tone: "orange",
        icon: CheckCircle2,
      });
    }

    return items.slice(0, 4);
  }, [growth]);

  const handleRefresh =
    useCallback(async () => {
      if (
        refreshing ||
        typeof onRefresh !==
          "function"
      ) {
        return;
      }

      setRefreshing(true);
      setRefreshError("");

      try {
        await onRefresh();
      } catch (error) {
        console.error(
          "Founder Growth refresh failed:",
          error
        );

        setRefreshError(
          error?.message ||
            "Founder Growth data could not refresh."
        );
      } finally {
        setRefreshing(false);
      }
    }, [
      onRefresh,
      refreshing,
    ]);

  const views = [
    {
      key: "overview",
      label: "Overview",
      icon: BriefcaseBusiness,
    },
    {
      key: "funnel",
      label: "Funnel",
      icon: TrendingUp,
    },
    {
      key: "revenue",
      label: "Revenue",
      icon: WalletCards,
    },
    {
      key: "team",
      label: "Counselors",
      icon: UsersRound,
    },
    {
      key: "market",
      label: "Market",
      icon: Landmark,
    },
    {
      key: "forecast",
      label: "Forecast",
      icon: BarChart3,
    },
  ];

  return (
    <section className="space-y-5">
      <div className="rounded-[2rem] border-[3px] border-orange-400 bg-[#FFF8EE] p-3 shadow-[0_20px_55px_rgba(23,36,61,0.08)] sm:p-4">
        <div className="grid overflow-hidden rounded-[1.65rem] border-2 border-[#234E78] xl:grid-cols-[1.35fr_0.65fr]">
          <div className="bg-[#123865] p-5 text-white sm:p-7">
            <div className="flex flex-wrap items-center gap-2">
              <HeaderChip
                icon={
                  BriefcaseBusiness
                }
                label="Founder Growth OS"
              />

              <HeaderChip
                icon={ShieldCheck}
                label="Business Intelligence"
              />
            </div>

            <h1 className="mt-4 text-2xl font-black tracking-[-0.025em] text-white sm:text-3xl">
              Business Intelligence Command
            </h1>

            <p className="mt-2 max-w-4xl text-sm font-semibold leading-6 text-white">
              Growth, revenue, counselor productivity, market demand, conversion
              funnel, stalled workload, and 30/60/90-day planning from the
              existing Zaifan Student OS data layer.
            </p>

            {adminProfile?.email ? (
              <p className="mt-3 text-xs font-semibold text-white">
                Founder view for{" "}
                {adminProfile.email}
              </p>
            ) : null}

            <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
              <DarkMetric
                label="Students"
                value={
                  growth.students.length
                }
              />

              <DarkMetric
                label="Applications"
                value={
                  growth
                    .applications
                    .length
                }
              />

              <DarkMetric
                label="Visas"
                value={
                  growth.visas.length
                }
              />

              <DarkMetric
                label="Collection"
                value={`${growth.collectionRate}%`}
              />
            </div>
          </div>

          <div className="border-t-2 border-orange-300 bg-orange-500 p-5 text-white xl:border-l-2 xl:border-t-0 sm:p-7">
            <div className="flex items-center gap-2">
              <CircleGauge
                size={18}
              />

              <p className="text-[9px] font-black uppercase tracking-[0.1em] text-white">
                Business Health
              </p>
            </div>

            <p className="mt-3 text-5xl font-black text-white">
              {growth.businessHealth}
            </p>

            <p className="mt-1 text-sm font-black uppercase tracking-[0.08em] text-white">
              {health.label}
            </p>

            <div className="mt-4 h-3 overflow-hidden rounded-full border border-white/25 bg-white/10">
              <div
                className="h-full rounded-full bg-white transition-all duration-500"
                style={{
                  width: `${growth.businessHealth}%`,
                }}
              />
            </div>

            <p className="mt-4 text-xs font-semibold leading-5 text-white">
              {health.message}
            </p>
          </div>
        </div>

        <div className="mt-3 rounded-[1.35rem] border-2 border-orange-200 bg-[#FFFDF8] p-4">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex flex-wrap gap-2">
              {views.map((view) => {
                const Icon =
                  view.icon;

                return (
                  <button
                    key={view.key}
                    type="button"
                    onClick={() =>
                      setActiveView(
                        view.key
                      )
                    }
                    className={`inline-flex min-h-11 items-center gap-2 rounded-xl border-2 px-4 py-2.5 text-xs font-black transition ${
                      activeView ===
                      view.key
                        ? "border-[#123865] bg-[#123865] text-white shadow-[0_7px_16px_rgba(18,56,101,0.14)]"
                        : "border-slate-300 bg-white text-[#10233f] hover:border-orange-400 hover:bg-orange-50"
                    }`}
                  >
                    <Icon
                      size={14}
                    />
                    {view.label}
                  </button>
                );
              })}
            </div>

            {onRefresh ? (
              <button
                type="button"
                onClick={() =>
                  void handleRefresh()
                }
                disabled={
                  refreshing
                }
                className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border-2 border-orange-300 bg-orange-50 px-4 text-xs font-black text-orange-800 transition hover:border-orange-500 hover:bg-orange-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <RefreshCw
                  size={14}
                  className={
                    refreshing
                      ? "animate-spin"
                      : ""
                  }
                />

                {refreshing
                  ? "Refreshing..."
                  : "Refresh Growth OS"}
              </button>
            ) : null}
          </div>
        </div>
      </div>

      {refreshError ? (
        <div className="rounded-[1.3rem] border-[3px] border-red-300 bg-red-50 p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle
              size={17}
              className="mt-0.5 shrink-0 text-red-700"
            />

            <div>
              <p className="font-black text-[#10233f]">
                Founder Growth refresh failed
              </p>

              <p className="mt-1 text-sm font-semibold leading-6 text-slate-600">
                {refreshError}
              </p>
            </div>
          </div>
        </div>
      ) : null}

      {activeView ===
      "overview" ? (
        <>
          <div className="grid gap-3 rounded-[1.7rem] border-[3px] border-[#234E78] bg-[#FFF8EE] p-4 md:grid-cols-3">
            <FounderGuideCard
              label="Business health"
              value={`${growth.businessHealth}/100`}
              detail="Composite operating signal across conversion, collection, ownership, and stalled work."
              tone="navy"
            />
            <FounderGuideCard
              label="Immediate pressure"
              value={`${growth.stalledStudents.length} stalled`}
              detail="Students with 21+ days of inactivity are the clearest current recovery queue."
              tone={growth.stalledStudents.length ? "red" : "green"}
            />
            <FounderGuideCard
              label="Revenue exposure"
              value={money(growth.outstandingRevenue, growth.currency)}
              detail="Outstanding invoiced value still waiting to be collected."
              tone={growth.outstandingRevenue > 0 ? "orange" : "green"}
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            <FounderMetricCard
              label="Students"
              value={
                growth.students.length
              }
              helper={`${growth.recentStudents} new in 30 days`}
              icon={UsersRound}
              tone="blue"
            />

            <FounderMetricCard
              label="Applications"
              value={
                growth
                  .applications
                  .length
              }
              helper={`${growth.offerRate}% app → offer`}
              icon={GraduationCap}
              tone="navy"
            />

            <FounderMetricCard
              label="Offers"
              value={
                growth.offers.length
              }
              helper={`${growth.casRate}% offer → CAS`}
              icon={Target}
              tone="orange"
            />

            <FounderMetricCard
              label="Visas"
              value={
                growth.visas.length
              }
              helper={`${growth.visaRate}% CAS → visa`}
              icon={Rocket}
              tone="green"
            />

            <FounderMetricCard
              label="Collected"
              value={money(
                growth.collectedRevenue,
                growth.currency
              )}
              helper={`${money(
                growth.outstandingRevenue,
                growth.currency
              )} outstanding`}
              icon={Coins}
              tone="green"
            />

            <FounderMetricCard
              label="Stalled"
              value={
                growth
                  .stalledStudents
                  .length
              }
              helper={`${growth.stalledRate}% of student portfolio`}
              icon={Clock3}
              tone={
                growth
                  .stalledStudents
                  .length
                  ? "red"
                  : "default"
              }
            />
          </div>

          <div className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
            <GrowthFunnelPanel
              growth={growth}
              compact
            />

            <RevenueIntelligencePanel
              growth={growth}
              compact
            />
          </div>

          <FounderDisclosure
            eyebrow="Founder Priorities"
            title="What needs attention next"
            description="Deterministic operating recommendations from the current Student OS growth snapshot."
            open={showRecommendations}
            onToggle={() =>
              setShowRecommendations(
                (current) =>
                  !current
              )
            }
          >
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {recommendations.map(
                (item) => (
                  <FounderRecommendationCard
                    key={
                      item.title
                    }
                    {...item}
                  />
                )
              )}
            </div>
          </FounderDisclosure>

          <div className="grid gap-4 xl:grid-cols-[1fr_1fr]">
            <CounselorLeaderboardPanel
              growth={growth}
              compact
            />

            <MarketIntelligencePanel
              growth={growth}
              compact
            />
          </div>

          {growth.stalledStudents
            .length ? (
            <FounderDisclosure
              eyebrow="Recovery Queue"
              title="Stalled Student Workload"
              description={`${growth.stalledStudents.length} student record${
                growth.stalledStudents.length === 1 ? "" : "s"
              } need recovery attention after 21+ days of inactivity.`}
              open={showStalledWorkload}
              onToggle={() =>
                setShowStalledWorkload(
                  (current) =>
                    !current
                )
              }
              tone="red"
            >
              <StalledStudentPanel
                students={
                  growth.stalledStudents
                }
              />
            </FounderDisclosure>
          ) : null}
        </>
      ) : null}

      {activeView ===
      "funnel" ? (
        <GrowthFunnelPanel
          growth={growth}
        />
      ) : null}

      {activeView ===
      "revenue" ? (
        <RevenueIntelligencePanel
          growth={growth}
        />
      ) : null}

      {activeView ===
      "team" ? (
        <CounselorLeaderboardPanel
          growth={growth}
        />
      ) : null}

      {activeView ===
      "market" ? (
        <MarketIntelligencePanel
          growth={growth}
        />
      ) : null}

      {activeView ===
      "forecast" ? (
        <BusinessForecastPanel
          growth={growth}
        />
      ) : null}

      <div className="rounded-[1.4rem] border-[3px] border-[#234E78] bg-[#EEF4FA] p-4">
        <div className="flex items-start gap-3">
          <ShieldCheck
            size={17}
            className="mt-0.5 shrink-0 text-orange-700"
          />

          <div>
            <p className="font-black text-[#10233f]">
              Founder analytics scope
            </p>

            <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">
              This dashboard derives deterministic operational metrics from the
              supplied Student OS snapshots. Conversion and forecast figures are
              indicators, not guaranteed admissions, revenue, or visa outcomes.
              No backend mutations are performed here.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function FounderGuideCard({
  label,
  value,
  detail,
  tone = "navy",
}) {
  const tones = {
    navy: "border-[#234E78] bg-[#EEF4FA]",
    orange: "border-orange-400 bg-orange-50",
    red: "border-red-400 bg-red-50",
    green: "border-emerald-400 bg-emerald-50",
  };

  return (
    <div className={`rounded-[1.35rem] border-[3px] p-4 ${tones[tone] || tones.navy}`}>
      <p className="text-[9px] font-black uppercase tracking-[0.11em] text-[#10233F]">
        {label}
      </p>
      <p className="mt-2 break-words text-2xl font-black text-[#10233F]">
        {value}
      </p>
      <p className="mt-2 text-xs font-semibold leading-5 text-slate-600">
        {detail}
      </p>
    </div>
  );
}

function FounderDisclosure({
  eyebrow,
  title,
  description,
  open,
  onToggle,
  tone = "navy",
  children,
}) {
  const red = tone === "red";

  return (
    <section className={`overflow-hidden rounded-[1.8rem] border-[3px] bg-[#FFF8EE] shadow-[0_10px_28px_rgba(23,36,61,0.06)] ${
      red ? "border-red-400" : "border-[#234E78]"
    }`}>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className={`flex w-full items-center justify-between gap-4 border-b-[3px] px-5 py-4 text-left text-white transition ${
          red
            ? "border-red-300 bg-[#8F2530] hover:bg-[#7A1F29]"
            : "border-orange-400 bg-[#123865] hover:bg-[#0F3158]"
        }`}
      >
        <div>
          <p className={`text-[9px] font-black uppercase tracking-[0.14em] ${
            red ? "text-red-100" : "text-orange-300"
          }`}>
            {eyebrow}
          </p>
          <h3 className="mt-0.5 text-xl font-black text-white">{title}</h3>
          <p className="mt-1 max-w-4xl text-xs font-semibold leading-5 text-white/80">
            {description}
          </p>
        </div>

        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border-2 border-white/25 bg-white/10 text-white">
          {open ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </span>
      </button>

      {open ? <div className="p-4 sm:p-5">{children}</div> : null}
    </section>
  );
}

function HeaderChip({
  icon: Icon,
  label,
}) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border-2 border-white/20 bg-white/10 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.09em] text-white">
      <Icon size={11} />
      {label}
    </span>
  );
}

function DarkMetric({
  label,
  value,
}) {
  return (
    <div className="rounded-xl border-2 border-white/20 bg-white/10 p-3 text-white">
      <p className="text-[8px] font-black uppercase tracking-[0.08em] text-white">
        {label}
      </p>

      <p className="mt-1 break-words text-xl font-black text-white">
        {value}
      </p>
    </div>
  );
}

function StalledStudentPanel({
  students = [],
}) {
  return (
    <section className="rounded-[1.5rem] border-[3px] border-red-400 bg-[#FFF8F6] p-4 sm:p-5">
      <div className="grid gap-3 lg:grid-cols-2">
        {students.map(
          (student) => (
            <div
              key={
                student.id ||
                student.name
              }
              className="rounded-[1.2rem] border-2 border-red-300 bg-white p-4 shadow-[0_7px_18px_rgba(194,65,59,0.045)]"
            >
              <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_90px]">
                <div className="min-w-0">
                  <p className="break-words font-black leading-5 text-[#10233f]">
                    {student.name}
                  </p>

                  <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">
                    {student.stage} • {student.counselor}
                  </p>
                </div>

                <div className="rounded-xl border-2 border-red-300 bg-red-50 p-3 text-center">
                  <p className="text-[8px] font-black uppercase tracking-[0.08em] text-red-700">
                    Inactive
                  </p>
                  <p className="mt-1 text-2xl font-black text-red-800">
                    {student.ageDays}d
                  </p>
                </div>
              </div>

              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                <StalledFact label="Stage" value={student.stage} />
                <StalledFact label="Owner" value={student.counselor} />
              </div>
            </div>
          )
        )}
      </div>
    </section>
  );
}

function StalledFact({ label, value }) {
  return (
    <div className="min-w-0 rounded-xl border-2 border-slate-200 bg-[#F8FAFC] px-3 py-2">
      <p className="text-[8px] font-black uppercase tracking-[0.08em] text-slate-500">
        {label}
      </p>
      <p className="mt-1 break-words text-xs font-black text-[#243A60]">
        {value || "—"}
      </p>
    </div>
  );
}

export {
  buildFounderGrowthData,
};
