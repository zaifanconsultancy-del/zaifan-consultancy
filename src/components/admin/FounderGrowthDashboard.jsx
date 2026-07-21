import React, { useMemo, useState } from "react";
import GrowthFunnelPanel from "./GrowthFunnelPanel";
import RevenueIntelligencePanel from "./RevenueIntelligencePanel";
import CounselorLeaderboardPanel from "./CounselorLeaderboardPanel";
import MarketIntelligencePanel from "./MarketIntelligencePanel";
import BusinessForecastPanel from "./BusinessForecastPanel";

function safeArray(value) {
  return Array.isArray(value) ? value : [];
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
  return safeString(value).toLowerCase();
}

function money(value) {
  const amount = safeNumber(value);
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    maximumFractionDigits: 0,
  }).format(amount);
}

function isDateWithinDays(value, days = 30) {
  if (!value) return false;
  const time = new Date(value).getTime();
  if (!Number.isFinite(time)) return false;
  return Date.now() - time <= days * 24 * 60 * 60 * 1000;
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

  if (raw.includes("visa granted") || raw.includes("enrolled") || raw.includes("arrived")) return "Visa/Enrollment";
  if (raw.includes("visa")) return "Visa";
  if (raw.includes("cas")) return "CAS";
  if (raw.includes("offer")) return "Offer";
  if (raw.includes("application") || raw.includes("applied")) return "Application";
  if (raw.includes("university") || raw.includes("shortlist") || raw.includes("planning")) return "University Planning";
  return "Inquiry";
}

function getCounselorName(record = {}) {
  return (
    record.assigned_counselor ||
    record.counselor_name ||
    record.counselor ||
    record.assigned_to ||
    record.owner ||
    record.created_by ||
    "Unassigned"
  );
}

function getCountry(record = {}) {
  return (
    record.country ||
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
    record.amount ||
      record.total_amount ||
      record.invoice_amount ||
      record.paid_amount ||
      record.payment_amount ||
      record.fee_amount ||
      0
  );
}

function buildFounderGrowthData(rawSnapshot = {}) {
  const students = safeArray(rawSnapshot.students || rawSnapshot.inquiries || rawSnapshot.assignedStudents);
  const applications = safeArray(rawSnapshot.applications || rawSnapshot.studentApplications);
  const offers = safeArray(rawSnapshot.offers || rawSnapshot.studentOffers);
  const casRecords = safeArray(rawSnapshot.casRecords || rawSnapshot.cas || rawSnapshot.studentCAS);
  const visas = safeArray(rawSnapshot.visas || rawSnapshot.visaApplications || rawSnapshot.studentVisas);
  const invoices = safeArray(rawSnapshot.invoices || rawSnapshot.studentInvoices);
  const payments = safeArray(rawSnapshot.payments || rawSnapshot.studentPayments);
  const tasks = safeArray(rawSnapshot.tasks || rawSnapshot.studentTasks);
  const support = safeArray(rawSnapshot.supportRequests || rawSnapshot.support || rawSnapshot.studentSupportRequests);
  const universities = safeArray(rawSnapshot.universities || rawSnapshot.studentUniversities || rawSnapshot.shortlists);

  const stages = [
    { key: "inquiry", label: "Inquiry", count: students.length },
    { key: "planning", label: "University Planning", count: Math.max(universities.length, students.filter((s) => getStudentStage(s) === "University Planning").length) },
    { key: "application", label: "Applications", count: Math.max(applications.length, students.filter((s) => getStudentStage(s) === "Application").length) },
    { key: "offer", label: "Offers", count: Math.max(offers.length, students.filter((s) => getStudentStage(s) === "Offer").length) },
    { key: "cas", label: "CAS", count: Math.max(casRecords.length, students.filter((s) => getStudentStage(s) === "CAS").length) },
    { key: "visa", label: "Visa", count: Math.max(visas.length, students.filter((s) => getStudentStage(s).includes("Visa")).length) },
  ];

  const collectedRevenue = payments.reduce((sum, item) => sum + getAmount(item), 0);
  const invoicedRevenue = invoices.reduce((sum, item) => sum + getAmount(item), 0);
  const outstandingRevenue = Math.max(0, invoicedRevenue - collectedRevenue);
  const recentStudents = students.filter((student) =>
    isDateWithinDays(student.created_at || student.createdAt || student.date || student.updated_at, 30)
  ).length;

  const counselorMap = new Map();

  students.forEach((student) => {
    const name = getCounselorName(student);
    const current = counselorMap.get(name) || {
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
    current.students += 1;
    counselorMap.set(name, current);
  });

  applications.forEach((item) => {
    const name = getCounselorName(item);
    const current = counselorMap.get(name) || { name, students: 0, applications: 0, offers: 0, cas: 0, visas: 0, tasks: 0, support: 0, revenue: 0 };
    current.applications += 1;
    counselorMap.set(name, current);
  });

  offers.forEach((item) => {
    const name = getCounselorName(item);
    const current = counselorMap.get(name) || { name, students: 0, applications: 0, offers: 0, cas: 0, visas: 0, tasks: 0, support: 0, revenue: 0 };
    current.offers += 1;
    counselorMap.set(name, current);
  });

  casRecords.forEach((item) => {
    const name = getCounselorName(item);
    const current = counselorMap.get(name) || { name, students: 0, applications: 0, offers: 0, cas: 0, visas: 0, tasks: 0, support: 0, revenue: 0 };
    current.cas += 1;
    counselorMap.set(name, current);
  });

  visas.forEach((item) => {
    const name = getCounselorName(item);
    const current = counselorMap.get(name) || { name, students: 0, applications: 0, offers: 0, cas: 0, visas: 0, tasks: 0, support: 0, revenue: 0 };
    current.visas += 1;
    counselorMap.set(name, current);
  });

  tasks.forEach((item) => {
    const name = getCounselorName(item);
    const current = counselorMap.get(name) || { name, students: 0, applications: 0, offers: 0, cas: 0, visas: 0, tasks: 0, support: 0, revenue: 0 };
    current.tasks += 1;
    counselorMap.set(name, current);
  });

  support.forEach((item) => {
    const name = getCounselorName(item);
    const current = counselorMap.get(name) || { name, students: 0, applications: 0, offers: 0, cas: 0, visas: 0, tasks: 0, support: 0, revenue: 0 };
    current.support += 1;
    counselorMap.set(name, current);
  });

  payments.forEach((item) => {
    const name = getCounselorName(item);
    const current = counselorMap.get(name) || { name, students: 0, applications: 0, offers: 0, cas: 0, visas: 0, tasks: 0, support: 0, revenue: 0 };
    current.revenue += getAmount(item);
    counselorMap.set(name, current);
  });

  const countries = new Map();
  const universitiesMap = new Map();
  const courses = new Map();
  const sources = new Map();

  [...students, ...applications, ...universities].forEach((item) => {
    const country = getCountry(item);
    const university = getUniversity(item);
    const course = getCourse(item);
    const source = getSource(item);

    countries.set(country, (countries.get(country) || 0) + 1);
    universitiesMap.set(university, (universitiesMap.get(university) || 0) + 1);
    courses.set(course, (courses.get(course) || 0) + 1);
    sources.set(source, (sources.get(source) || 0) + 1);
  });

  const stalledStudents = students
    .filter((student) => {
      const updated = student.updated_at || student.updatedAt || student.last_activity_at || student.lastActivityAt;
      return updated ? !isDateWithinDays(updated, 21) : false;
    })
    .slice(0, 12)
    .map((student) => ({
      id: student.id || student.student_id || student.email,
      name: getStudentName(student),
      stage: getStudentStage(student),
      counselor: getCounselorName(student),
      lastActivity: student.updated_at || student.updatedAt || student.last_activity_at || student.lastActivityAt,
    }));

  const conversionRate = students.length ? Math.round((Math.max(visas.length, offers.length) / students.length) * 100) : 0;
  const offerRate = applications.length ? Math.round((offers.length / applications.length) * 100) : 0;
  const casRate = offers.length ? Math.round((casRecords.length / offers.length) * 100) : 0;
  const visaRate = casRecords.length ? Math.round((visas.length / casRecords.length) * 100) : 0;

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
    recentStudents,
    collectedRevenue,
    invoicedRevenue,
    outstandingRevenue,
    conversionRate,
    offerRate,
    casRate,
    visaRate,
    counselorLeaderboard: Array.from(counselorMap.values()).sort((a, b) => {
      const aScore = a.visas * 40 + a.cas * 25 + a.offers * 15 + a.applications * 8 + a.tasks * 2 + a.revenue / 1000;
      const bScore = b.visas * 40 + b.cas * 25 + b.offers * 15 + b.applications * 8 + b.tasks * 2 + b.revenue / 1000;
      return bScore - aScore;
    }),
    market: {
      countries: Array.from(countries.entries()).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count),
      universities: Array.from(universitiesMap.entries()).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count),
      courses: Array.from(courses.entries()).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count),
      sources: Array.from(sources.entries()).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count),
    },
    stalledStudents,
  };
}

function FounderMetricCard({ label, value, helper, tone = "cyan" }) {
  const tones = {
    cyan: "border-[#E9802D]/35 bg-[#FFF3E7]",
    emerald: "border-[#E9802D]/35 bg-[#FFF3E7]",
    amber: "border-[#A36A18]/30 bg-[#FFF7E8]",
    rose: "border-[#C2413B]/30 bg-[#FFF0EE]",
    violet: "border-[#243A60]/25 bg-[#F3F5F8]",
    slate: "border-[#243A60]/20 bg-white",
  };

  return (
    <div className={`rounded-3xl border p-5 shadow-[0_10px_24px_rgba(23,36,61,0.05)] ${tones[tone] || tones.cyan}`}>
      <p className="text-xs font-black uppercase tracking-[0.24em] text-[#667085]">{label}</p>
      <p className="mt-3 text-3xl font-black text-[#17243D]">{value}</p>
      {helper ? <p className="mt-2 text-sm text-[#667085]">{helper}</p> : null}
    </div>
  );
}

function FounderRecommendationCard({ title, detail, tone = "cyan" }) {
  const tones = {
    cyan: "border-cyan-400/20 bg-cyan-500/10 text-[#B84F0E]",
    emerald: "border-emerald-400/20 bg-emerald-500/10 text-[#B84F0E]",
    amber: "border-amber-400/20 bg-amber-500/10 text-[#8A5611]",
    rose: "border-rose-400/20 bg-rose-500/10 text-[#A8342F]",
    violet: "border-violet-400/20 bg-violet-500/10 text-[#243A60]",
  };

  return (
    <div className={`rounded-3xl border p-4 shadow-[0_10px_24px_rgba(23,36,61,0.05)] ${tones[tone] || tones.cyan}`}>
      <p className="text-sm font-black">{title}</p>
      <p className="mt-2 text-sm leading-6 opacity-80">{detail}</p>
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
  const [activeView, setActiveView] = useState("overview");

  const growth = useMemo(
    () =>
      buildFounderGrowthData({
        ...(snapshot || {}),
        ...(executiveSnapshot || {}),
        ...(counselorSnapshot || {}),
        ...(paymentSnapshot || {}),
      }),
    [snapshot, executiveSnapshot, counselorSnapshot, paymentSnapshot]
  );

  const recommendations = useMemo(() => {
    const items = [];

    if (growth.outstandingRevenue > 0) {
      items.push({
        title: "Recover outstanding revenue",
        detail: `${money(growth.outstandingRevenue)} is still outstanding. Prioritize payment follow-ups before adding new manual operations work.`,
        tone: "amber",
      });
    }

    if (growth.offerRate < 40 && growth.applications.length > 0) {
      items.push({
        title: "Application-to-offer bottleneck",
        detail: `Offer conversion is ${growth.offerRate}%. Review weak university routes, document quality, and counselor application execution.`,
        tone: "rose",
      });
    }

    if (growth.recentStudents > 0) {
      items.push({
        title: "New inquiry momentum",
        detail: `${growth.recentStudents} students entered in the last 30 days. Keep counselor assignment and first-contact speed tight.`,
        tone: "emerald",
      });
    }

    if (!items.length) {
      items.push({
        title: "Founder OS ready for real data",
        detail: "The dashboard is prepared. Once live records are inserted, this layer will expose growth, funnel, revenue, and team performance patterns.",
        tone: "cyan",
      });
    }

    return items.slice(0, 4);
  }, [growth]);

  const views = [
    { key: "overview", label: "Overview" },
    { key: "funnel", label: "Funnel" },
    { key: "revenue", label: "Revenue" },
    { key: "team", label: "Counselors" },
    { key: "market", label: "Market" },
    { key: "forecast", label: "Forecast" },
  ];

  return (
    <div className="space-y-6 rounded-[2rem] border-2 border-[#E9802D]/40 bg-[#FFFDF8] p-5 text-[#17243D] shadow-[0_20px_55px_rgba(23,36,61,0.08)]">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.3em] text-[#B84F0E]">Founder Growth OS</p>
          <h1 className="mt-3 text-3xl font-black tracking-tight">Business Intelligence Command</h1>
          <p className="mt-2 max-w-4xl text-sm leading-6 text-[#667085]">
            Growth, revenue, counselor productivity, market demand, conversion funnel, and 30/60/90 day forecast built from the
            existing Zaifan Student OS data layer.
          </p>
          {adminProfile?.email ? <p className="mt-2 text-xs text-[#7A8392]">Founder view for {adminProfile.email}</p> : null}
        </div>

        <div className="flex flex-wrap gap-2">
          {views.map((view) => (
            <button
              key={view.key}
              type="button"
              onClick={() => setActiveView(view.key)}
              className={`rounded-2xl px-4 py-2 text-xs font-black ${
                activeView === view.key
                  ? "bg-[#E9802D] text-[#17243D] shadow-[0_8px_18px_rgba(233,128,45,0.20)]"
                  : "border border-[#243A60]/20 bg-white text-[#596579] hover:border-[#E9802D]/40 hover:text-[#B84F0E]"
              }`}
            >
              {view.label}
            </button>
          ))}

          {onRefresh ? (
            <button
              type="button"
              onClick={onRefresh}
              className="rounded-2xl border border-[#E9802D]/40 bg-[#FFF3E7] px-4 py-2 text-xs font-black text-[#B84F0E] hover:bg-[#FFE8D3]"
            >
              Refresh
            </button>
          ) : null}
        </div>
      </div>

      {activeView === "overview" ? (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            <FounderMetricCard label="Students" value={growth.students.length} helper={`${growth.recentStudents} new in 30 days`} tone="cyan" />
            <FounderMetricCard label="Applications" value={growth.applications.length} helper={`${growth.offerRate}% app → offer`} tone="violet" />
            <FounderMetricCard label="Offers" value={growth.offers.length} helper={`${growth.casRate}% offer → CAS`} tone="emerald" />
            <FounderMetricCard label="Visas" value={growth.visas.length} helper={`${growth.visaRate}% CAS → visa`} tone="amber" />
            <FounderMetricCard label="Collected" value={money(growth.collectedRevenue)} helper={`${money(growth.outstandingRevenue)} outstanding`} tone="emerald" />
          </div>

          <div className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
            <GrowthFunnelPanel growth={growth} compact />
            <RevenueIntelligencePanel growth={growth} compact />
          </div>

          <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-4">
            {recommendations.map((item) => (
              <FounderRecommendationCard key={item.title} title={item.title} detail={item.detail} tone={item.tone} />
            ))}
          </div>

          <div className="grid gap-4 xl:grid-cols-[1fr_1fr]">
            <CounselorLeaderboardPanel growth={growth} compact />
            <MarketIntelligencePanel growth={growth} compact />
          </div>
        </>
      ) : null}

      {activeView === "funnel" ? <GrowthFunnelPanel growth={growth} /> : null}
      {activeView === "revenue" ? <RevenueIntelligencePanel growth={growth} /> : null}
      {activeView === "team" ? <CounselorLeaderboardPanel growth={growth} /> : null}
      {activeView === "market" ? <MarketIntelligencePanel growth={growth} /> : null}
      {activeView === "forecast" ? <BusinessForecastPanel growth={growth} /> : null}
    </div>
  );
}

export { buildFounderGrowthData };