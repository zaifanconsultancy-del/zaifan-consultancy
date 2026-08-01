// AnalyticsOSDashboard V3 PARTNER-OS ALIGNED — Zaifan Business Intelligence Command Center
// Full replacement for: src/components/admin/AnalyticsOSDashboard.jsx
//
// Preserves:
// - buildAnalyticsOSData(snapshot)
// - KPICommandCenter
// - BusinessIntelligencePanel
// - ForecastEnginePanel
// - TrendAnalysisPanel
// - ExecutiveReportingPanel
// - snapshot / adminProfile / onRefresh props
//
// Upgrades:
// - replaces the disconnected dark/gray "imposter" styling
// - brings Analytics OS into the same Zaifan navy/orange/cream Admin system
// - makes view navigation unmistakably interactive
// - adds safe refresh loading/error handling
// - strengthens the overview into a real executive snapshot
// - clarifies read-only metrics vs navigation/actions
// - improves responsive spacing, card hierarchy, borders, typography, and semantic colors
// - keeps all existing child panels and analytics data contract intact

import React, {
  useCallback,
  useMemo,
  useState,
} from "react";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  BriefcaseBusiness,
  CheckCircle2,
  CircleGauge,
  FileText,
  GraduationCap,
  Landmark,
  RefreshCw,
  ShieldCheck,
  Target,
  TrendingUp,
  Users,
  WalletCards,
} from "lucide-react";

import KPICommandCenter from "./KPICommandCenter";
import BusinessIntelligencePanel from "./BusinessIntelligencePanel";
import ForecastEnginePanel from "./ForecastEnginePanel";
import TrendAnalysisPanel from "./TrendAnalysisPanel";
import ExecutiveReportingPanel from "./ExecutiveReportingPanel";

const safeArray = (value) =>
  Array.isArray(value)
    ? value.filter(Boolean)
    : [];

const number = (
  value,
  fallback = 0
) => {
  const parsed =
    Number(value);

  return Number.isFinite(parsed)
    ? parsed
    : fallback;
};

const money = (
  value,
  currency = "GBP"
) => {
  const amount =
    number(value);

  try {
    return new Intl.NumberFormat(
      "en-GB",
      {
        style: "currency",
        currency,
        maximumFractionDigits: 0,
      }
    ).format(amount);
  } catch {
    return `£${amount.toLocaleString(
      "en-GB"
    )}`;
  }
};

export function buildAnalyticsOSData(
  snapshot = {}
) {
  const students =
    safeArray(
      snapshot.students ||
        snapshot.inquiries
    );

  const applications =
    safeArray(
      snapshot.applications
    );

  const offers =
    safeArray(
      snapshot.offers
    );

  const visas =
    safeArray(
      snapshot.visas
    );

  const payments =
    safeArray(
      snapshot.payments
    );

  const revenue =
    payments.reduce(
      (sum, payment) =>
        sum +
        number(
          payment.amount ||
            payment.paid_amount
        ),
      0
    );

  const applicationRate =
    students.length
      ? Math.min(
          100,
          Math.round(
            (applications.length /
              students.length) *
              100
          )
        )
      : 0;

  const offerRate =
    applications.length
      ? Math.min(
          100,
          Math.round(
            (offers.length /
              applications.length) *
              100
          )
        )
      : 0;

  const visaRate =
    offers.length
      ? Math.min(
          100,
          Math.round(
            (visas.length /
              offers.length) *
              100
          )
        )
      : 0;

  return {
    students,
    applications,
    offers,
    visas,
    payments,
    revenue,

    metrics: {
      students:
        students.length,
      applications:
        applications.length,
      offers:
        offers.length,
      visas:
        visas.length,
      revenue,
      applicationRate,
      offerRate,
      visaRate,
    },
  };
}

function MetricCard({
  label,
  value,
  detail,
  icon: Icon,
  tone = "navy",
}) {
  const toneClass =
    tone === "orange"
      ? "border-[#F97316] bg-[#FFF4EA] text-[#B84F0E]"
      : tone === "green"
      ? "border-[#34D399] bg-[#F0FFF8] text-emerald-700"
      : tone === "blue"
      ? "border-[#60A5FA] bg-[#F2F7FF] text-blue-700"
      : tone === "red"
      ? "border-red-400 bg-red-50 text-red-800"
      : "border-[#C9D7E6] bg-[#FFFDF8] text-[#123865]";

  return (
    <div
      className={`relative min-w-0 overflow-hidden rounded-[1.5rem] border-[3px] p-4 shadow-[0_10px_28px_rgba(23,36,61,0.06)] ${toneClass}`}
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

        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border-2 border-current/20 bg-white/75">
          {Icon ? (
            <Icon size={17} />
          ) : null}
        </span>
      </div>

      {detail ? (
        <p className="mt-3 min-h-[40px] text-xs font-semibold leading-5 text-slate-600">
          {detail}
        </p>
      ) : null}

      <p className="mt-3 text-[9px] font-black uppercase tracking-[0.1em] opacity-70">
        Read-only analytics signal
      </p>
    </div>
  );
}

function AnalyticsGuideCard({
  label,
  value,
  detail,
  tone = "navy",
}) {
  const style =
    tone === "orange"
      ? "border-[#F97316] bg-[#FFF4EA]"
      : tone === "green"
      ? "border-[#34D399] bg-[#F0FFF8]"
      : "border-[#C9D7E6] bg-[#FFFDF8]";

  return (
    <div className={`rounded-[1.35rem] border-[3px] p-4 ${style}`}>
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

function OverviewCard({
  eyebrow,
  title,
  description,
  icon: Icon,
  tone = "navy",
  children,
}) {
  const outer =
    tone === "orange"
      ? "border-[#F97316]"
      : "border-[#C9D7E6]";

  return (
    <section
      className={`overflow-hidden rounded-[1.7rem] border-[3px] bg-[#FFFDF8] shadow-[0_12px_32px_rgba(23,36,61,0.06)] ${outer}`}
    >
      <div
        className={`flex items-start gap-3 border-b-[3px] px-5 py-4 ${
          tone === "orange"
            ? "border-[#F97316] bg-[#FFF4EA]"
            : "border-[#F97316] bg-[#123865] text-white"
        }`}
      >
        <span
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border-2 ${
            tone === "orange"
              ? "border-[#F97316] bg-white text-[#B84F0E]"
              : "border-white/25 bg-white/10 text-white"
          }`}
        >
          <Icon size={18} />
        </span>

        <div>
          <p
            className={`text-[9px] font-black uppercase tracking-[0.14em] ${
              tone === "orange"
                ? "text-[#B84F0E]"
                : "text-orange-300"
            }`}
          >
            {eyebrow}
          </p>

          <h2
            className={`mt-1 text-lg font-black ${
              tone === "orange"
                ? "text-[#10233F]"
                : "text-white"
            }`}
          >
            {title}
          </h2>

          <p
            className={`mt-1 text-xs font-semibold leading-5 ${
              tone === "orange"
                ? "text-slate-600"
                : "text-white/80"
            }`}
          >
            {description}
          </p>
        </div>
      </div>

      <div className="p-5">
        {children}
      </div>
    </section>
  );
}

export default function AnalyticsOSDashboard({
  snapshot,
  adminProfile,
  onRefresh,

  // Optional Analytics OS enrichment contract.
  // These keep the parent backward-compatible while allowing the upgraded
  // child workspaces to receive real history, targets, forecasts, BI and reports.
  analyticsData,
  kpiTargets,
  previousMetrics,
  history,
  geography,
  counselorBreakdown,
  sourceBreakdown,
  programBreakdown,
  universityBreakdown,
  opportunitySignals,
  riskSignals,
  forecasts,
  forecastAssumptions,
  forecastSource,
  reports,
  reportArchive,
  reportDistribution,
  executiveSnapshots,
  reportingSource,

  // Optional real reporting actions.
  onGenerateReport,
  onOpenReport,
  onDistributeReport,
}) {
  const [
    activeView,
    setActiveView,
  ] = useState("overview");

  const [
    refreshing,
    setRefreshing,
  ] = useState(false);

  const [
    refreshError,
    setRefreshError,
  ] = useState("");

  const analytics =
    useMemo(() => {
      const base = buildAnalyticsOSData(snapshot || {});
      const supplied =
        analyticsData && typeof analyticsData === "object"
          ? analyticsData
          : {};

      return {
        ...base,
        ...supplied,

        // Never lose the deterministic current metrics generated from snapshot.
        // Explicit analyticsData.metrics may enrich/override individual fields.
        metrics: {
          ...base.metrics,
          ...(supplied.metrics || {}),
        },

        kpiTargets:
          supplied.kpiTargets ??
          kpiTargets ??
          snapshot?.kpiTargets ??
          snapshot?.analytics?.kpiTargets,

        previousMetrics:
          supplied.previousMetrics ??
          previousMetrics ??
          snapshot?.previousMetrics ??
          snapshot?.analytics?.previousMetrics,

        history:
          supplied.history ??
          history ??
          snapshot?.history ??
          snapshot?.analytics?.history,

        geography:
          supplied.geography ??
          geography ??
          snapshot?.geography ??
          snapshot?.analytics?.geography,

        counselorBreakdown:
          supplied.counselorBreakdown ??
          counselorBreakdown ??
          snapshot?.counselorBreakdown ??
          snapshot?.analytics?.counselorBreakdown,

        sourceBreakdown:
          supplied.sourceBreakdown ??
          sourceBreakdown ??
          snapshot?.sourceBreakdown ??
          snapshot?.analytics?.sourceBreakdown,

        programBreakdown:
          supplied.programBreakdown ??
          programBreakdown ??
          snapshot?.programBreakdown ??
          snapshot?.analytics?.programBreakdown,

        universityBreakdown:
          supplied.universityBreakdown ??
          universityBreakdown ??
          snapshot?.universityBreakdown ??
          snapshot?.analytics?.universityBreakdown,

        opportunitySignals:
          supplied.opportunitySignals ??
          opportunitySignals ??
          snapshot?.opportunitySignals ??
          snapshot?.analytics?.opportunitySignals,

        riskSignals:
          supplied.riskSignals ??
          riskSignals ??
          snapshot?.riskSignals ??
          snapshot?.analytics?.riskSignals,

        forecasts:
          supplied.forecasts ??
          forecasts ??
          snapshot?.forecasts ??
          snapshot?.analytics?.forecasts,

        forecastAssumptions:
          supplied.forecastAssumptions ??
          forecastAssumptions ??
          snapshot?.forecastAssumptions ??
          snapshot?.analytics?.forecastAssumptions,

        forecastSource:
          supplied.forecastSource ??
          forecastSource ??
          snapshot?.forecastSource ??
          snapshot?.analytics?.forecastSource,

        reports:
          supplied.reports ??
          reports ??
          snapshot?.reports ??
          snapshot?.analytics?.reports,

        reportArchive:
          supplied.reportArchive ??
          reportArchive ??
          snapshot?.reportArchive ??
          snapshot?.analytics?.reportArchive,

        reportDistribution:
          supplied.reportDistribution ??
          reportDistribution ??
          snapshot?.reportDistribution ??
          snapshot?.analytics?.reportDistribution,

        executiveSnapshots:
          supplied.executiveSnapshots ??
          executiveSnapshots ??
          snapshot?.executiveSnapshots ??
          snapshot?.analytics?.executiveSnapshots,

        reportingSource:
          supplied.reportingSource ??
          reportingSource ??
          snapshot?.reportingSource ??
          snapshot?.analytics?.reportingSource,

        updatedAt:
          supplied.updatedAt ??
          snapshot?.updatedAt ??
          snapshot?.analytics?.updatedAt,

        generatedAt:
          supplied.generatedAt ??
          snapshot?.generatedAt ??
          snapshot?.analytics?.generatedAt,

        lastUpdated:
          supplied.lastUpdated ??
          snapshot?.lastUpdated ??
          snapshot?.analytics?.lastUpdated,
      };
    }, [
      snapshot,
      analyticsData,
      kpiTargets,
      previousMetrics,
      history,
      geography,
      counselorBreakdown,
      sourceBreakdown,
      programBreakdown,
      universityBreakdown,
      opportunitySignals,
      riskSignals,
      forecasts,
      forecastAssumptions,
      forecastSource,
      reports,
      reportArchive,
      reportDistribution,
      executiveSnapshots,
      reportingSource,
    ]);

  const views = [
    {
      key: "overview",
      label: "Overview",
      icon: BriefcaseBusiness,
    },
    {
      key: "kpi",
      label: "KPI Command",
      icon: Target,
    },
    {
      key: "bi",
      label: "Business Intelligence",
      icon: Landmark,
    },
    {
      key: "forecast",
      label: "Forecast Engine",
      icon: BarChart3,
    },
    {
      key: "trends",
      label: "Trend Analysis",
      icon: TrendingUp,
    },
    {
      key: "reports",
      label: "Executive Reports",
      icon: FileText,
    },
  ];

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
          "Analytics OS refresh failed:",
          error
        );

        setRefreshError(
          error?.message ||
            "Analytics OS could not refresh."
        );
      } finally {
        setRefreshing(false);
      }
    }, [
      onRefresh,
      refreshing,
    ]);

  return (
    <section className="min-w-0 space-y-5 rounded-[2rem] border-[3px] border-[#123865] bg-[#FFF8EF] p-4 text-[#10233F] shadow-[0_18px_50px_rgba(23,63,107,0.12)] sm:p-5">
      <header className="overflow-hidden rounded-[1.75rem] border-[3px] border-[#F97316]">
        <div className="grid xl:grid-cols-[minmax(0,1.25fr)_minmax(18rem,0.75fr)]">
          <div className="bg-[#123865] p-5 text-white sm:p-6">
            <div className="flex flex-wrap items-center gap-2">
              <HeaderChip icon={BarChart3} label="Analytics OS" />
              <HeaderChip icon={ShieldCheck} label="Evidence First" />
            </div>

            <h1 className="mt-3 text-3xl font-black text-white">
              Business Intelligence Command
            </h1>

            <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-200">
              One operating system for current KPIs, business intelligence,
              trends, forecasts and executive reporting. Missing evidence
              remains unavailable instead of becoming an invented insight.
            </p>
          </div>

          <div className="bg-[#FF5A0A] p-5 text-white sm:p-6">
            <p className="text-[9px] font-black uppercase tracking-[0.12em]">
              Current Workspace
            </p>
            <p className="mt-2 text-2xl font-black">
              {views.find((view) => view.key === activeView)?.label || "Overview"}
            </p>
            <p className="mt-2 text-xs font-semibold leading-5 text-orange-50">
              {adminProfile?.email
                ? `Executive analytics view for ${adminProfile.email}`
                : "Executive analytics operating workspace"}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="rounded-full border-2 border-white/25 bg-white/10 px-3 py-1 text-[8px] font-black uppercase tracking-[0.08em]">
                {analytics.metrics.students} students
              </span>
              <span className="rounded-full border-2 border-white/25 bg-white/10 px-3 py-1 text-[8px] font-black uppercase tracking-[0.08em]">
                {money(analytics.metrics.revenue)} revenue
              </span>
            </div>
          </div>
        </div>
      </header>

      <nav className="flex flex-col gap-3 rounded-[1.45rem] border-[3px] border-[#C9D7E6] bg-white p-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 flex-wrap gap-2">
          {views.map((view) => {
            const Icon = view.icon;
            const active = activeView === view.key;

            return (
              <button
                key={view.key}
                type="button"
                onClick={() => setActiveView(view.key)}
                className={`inline-flex items-center gap-2 rounded-xl border-2 px-3 py-2.5 text-xs font-black transition ${
                  active
                    ? "border-[#F97316] bg-[#FF5A0A] text-white"
                    : "border-[#C9D7E6] bg-[#FFF8EF] text-[#10233F] hover:border-[#F97316]"
                }`}
              >
                <Icon size={14} />
                {view.label}
              </button>
            );
          })}
        </div>

        {onRefresh ? (
          <button
            type="button"
            onClick={() => void handleRefresh()}
            disabled={refreshing}
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border-2 border-[#123865] bg-[#123865] px-4 text-xs font-black text-white disabled:opacity-50"
          >
            <RefreshCw size={13} className={refreshing ? "animate-spin" : ""} />
            {refreshing ? "Refreshing..." : "Refresh Analytics"}
          </button>
        ) : null}
      </nav>

      {refreshError ? (
        <div className="rounded-[1.35rem] border-[3px] border-red-400 bg-red-50 p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle size={18} className="mt-0.5 shrink-0 text-red-700" />
            <div>
              <p className="font-black text-[#10233F]">Analytics refresh failed</p>
              <p className="mt-1 text-sm font-semibold text-slate-600">{refreshError}</p>
            </div>
          </div>
        </div>
      ) : null}

      {activeView === "overview" ? (
        <>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <MetricCard label="Students" value={analytics.metrics.students} detail="Student records in the current snapshot." icon={Users} tone="navy" />
            <MetricCard label="Applications" value={analytics.metrics.applications} detail={`${analytics.metrics.applicationRate}% student-to-application indicator.`} icon={FileText} tone="blue" />
            <MetricCard label="Offers" value={analytics.metrics.offers} detail={`${analytics.metrics.offerRate}% application-to-offer indicator.`} icon={GraduationCap} tone="green" />
            <MetricCard label="Connected Revenue" value={money(analytics.metrics.revenue)} detail="Collected payment value supplied to Analytics OS." icon={WalletCards} tone="orange" />
          </div>

          <section className="rounded-[1.5rem] border-[3px] border-[#C9D7E6] bg-white p-4 sm:p-5">
            <div className="mb-4">
              <p className="text-[9px] font-black uppercase tracking-[0.11em] text-orange-700">
                Analytics Command
              </p>
              <h2 className="mt-1 text-xl font-black text-[#10233F]">
                Executive evidence portfolio
              </h2>
              <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">
                One compact operating picture of pipeline volume, conversion and collected value.
              </p>
            </div>

            <div className="space-y-2.5">
              <AnalyticsEvidenceRow label="Student Pipeline" value={analytics.metrics.students} detail="Current student records represented." source="Students snapshot" />
              <AnalyticsEvidenceRow label="Applications" value={analytics.metrics.applications} detail={`${analytics.metrics.applicationRate}% application rate.`} source="Applications snapshot" />
              <AnalyticsEvidenceRow label="Offers" value={analytics.metrics.offers} detail={`${analytics.metrics.offerRate}% offer rate.`} source="Offers snapshot" />
              <AnalyticsEvidenceRow label="Visas" value={analytics.metrics.visas} detail={`${analytics.metrics.visaRate}% visa rate.`} source="Visa snapshot" />
              <AnalyticsEvidenceRow label="Connected Revenue" value={money(analytics.metrics.revenue)} detail="Collected payment evidence currently supplied." source="Payments snapshot" />
            </div>
          </section>

          <div className="grid gap-3 lg:grid-cols-3">
            <AnalyticsGuideCard label="Data Integrity" value="Deterministic" detail="Current metrics are built from supplied snapshot records." tone="green" />
            <AnalyticsGuideCard label="Historical Boundary" value={safeArray(analytics.history).length ? "Connected" : "Unavailable"} detail="Trend claims activate only when real prior-period evidence exists." tone="navy" />
            <AnalyticsGuideCard label="Forecast Boundary" value={analytics.forecasts ? "Connected" : "Unavailable"} detail="Forecast output appears only when explicitly supplied." tone="orange" />
          </div>
        </>
      ) : null}

      {activeView === "kpi" ? <KPICommandCenter analytics={analytics} /> : null}
      {activeView === "bi" ? <BusinessIntelligencePanel analytics={analytics} /> : null}
      {activeView === "forecast" ? <ForecastEnginePanel analytics={analytics} /> : null}
      {activeView === "trends" ? <TrendAnalysisPanel analytics={analytics} /> : null}
      {activeView === "reports" ? (
        <ExecutiveReportingPanel
          analytics={analytics}
          onGenerateReport={onGenerateReport}
          onOpenReport={onOpenReport}
          onDistributeReport={onDistributeReport}
        />
      ) : null}
    </section>
  );
}

function AnalyticsEvidenceRow({ label, value, detail, source }) {
  return (
    <article className="grid gap-3 rounded-[1.25rem] border-2 border-[#C9D7E6] bg-white p-4 md:grid-cols-[minmax(14rem,1.25fr)_10rem_minmax(14rem,1fr)] md:items-center">
      <div className="min-w-0">
        <p className="font-black text-[#10233F]">{label}</p>
        <p className="mt-1 text-xs font-semibold text-slate-500">{detail}</p>
      </div>
      <div className="rounded-xl border border-[#E1E8F0] bg-[#FFF8EF] px-3 py-2.5">
        <p className="text-[7px] font-black uppercase tracking-[0.09em] text-slate-500">Current</p>
        <p className="mt-1 text-sm font-black text-[#10233F]">{value}</p>
      </div>
      <div className="rounded-xl border border-[#E1E8F0] bg-[#F7FAFC] px-3 py-2.5">
        <p className="text-[7px] font-black uppercase tracking-[0.09em] text-slate-500">Evidence Source</p>
        <p className="mt-1 text-xs font-black text-[#10233F]">{source}</p>
      </div>
    </article>
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
    <div className="rounded-xl border-2 border-white/20 bg-white/10 p-3">
      <p className="text-[8px] font-black uppercase tracking-[0.08em] text-white">
        {label}
      </p>

      <p className="mt-1 break-words text-xl font-black text-white">
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
    <div className="rounded-xl border-2 border-white/25 bg-white/10 p-3">
      <p className="text-[8px] font-black uppercase tracking-[0.08em] text-white">
        {label}
      </p>

      <p className="mt-1 break-words text-lg font-black text-white">
        {value}
      </p>
    </div>
  );
}

function SnapshotRow({
  label,
  value,
}) {
  return (
    <div className="rounded-[1.15rem] border-2 border-[#B8CBE0] bg-[#F5F8FC] p-4">
      <p className="text-[9px] font-black uppercase tracking-[0.1em] text-slate-500">
        {label}
      </p>

      <p className="mt-2 text-2xl font-black text-[#10233F]">
        {value}
      </p>
    </div>
  );
}

function CoverageRow({
  label,
  detail,
}) {
  return (
    <div className="rounded-[1.15rem] border-2 border-[#F97316] bg-[#FFF4EA] p-4">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border-2 border-[#F97316] bg-white text-[#B84F0E]">
          <CheckCircle2 size={14} />
        </span>

        <div>
          <p className="text-sm font-black text-[#10233F]">
            {label}
          </p>

          <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">
            {detail}
          </p>
        </div>
      </div>
    </div>
  );
}
