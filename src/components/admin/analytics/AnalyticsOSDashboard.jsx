// AnalyticsOSDashboard V2 MAXIMUM — Zaifan Business Intelligence Command Center
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
      ? "border-orange-400 bg-orange-50 text-orange-800"
      : tone === "green"
      ? "border-emerald-400 bg-emerald-50 text-emerald-800"
      : tone === "blue"
      ? "border-blue-400 bg-blue-50 text-blue-800"
      : tone === "red"
      ? "border-red-400 bg-red-50 text-red-800"
      : "border-[#234E78] bg-[#EEF4FA] text-[#123865]";

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
      ? "border-orange-400 bg-orange-50"
      : tone === "green"
      ? "border-emerald-400 bg-emerald-50"
      : "border-[#234E78] bg-[#EEF4FA]";

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
      ? "border-orange-400"
      : "border-[#234E78]";

  return (
    <section
      className={`overflow-hidden rounded-[1.7rem] border-[3px] bg-[#FFFDF8] shadow-[0_12px_32px_rgba(23,36,61,0.06)] ${outer}`}
    >
      <div
        className={`flex items-start gap-3 border-b-[3px] px-5 py-4 ${
          tone === "orange"
            ? "border-orange-300 bg-orange-50"
            : "border-orange-400 bg-[#123865] text-white"
        }`}
      >
        <span
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border-2 ${
            tone === "orange"
              ? "border-orange-300 bg-white text-orange-700"
              : "border-white/25 bg-white/10 text-white"
          }`}
        >
          <Icon size={18} />
        </span>

        <div>
          <p
            className={`text-[9px] font-black uppercase tracking-[0.14em] ${
              tone === "orange"
                ? "text-orange-700"
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
    <section className="space-y-5">
      <div className="rounded-[2rem] border-[3px] border-orange-400 bg-[#FFF8EE] p-3 shadow-[0_20px_55px_rgba(23,36,61,0.09)] sm:p-4">
        <div className="grid overflow-hidden rounded-[1.65rem] border-2 border-[#234E78] xl:grid-cols-[1.35fr_0.65fr]">
          <div className="bg-[#123865] p-5 text-white sm:p-7">
            <div className="flex flex-wrap items-center gap-2">
              <HeaderChip
                icon={BarChart3}
                label="Analytics OS"
              />

              <HeaderChip
                icon={ShieldCheck}
                label="Business Intelligence"
              />
            </div>

            <h1 className="mt-4 text-2xl font-black tracking-[-0.025em] text-white sm:text-3xl">
              Business Intelligence Command Center
            </h1>

            <p className="mt-2 max-w-4xl text-sm font-semibold leading-6 text-white/90">
              One connected executive analytics system for current KPIs, business intelligence, historical trends, evidence-based forecasts and leadership reporting.
            </p>

            {adminProfile?.email ? (
              <p className="mt-3 text-xs font-semibold text-white/80">
                Executive analytics view for {adminProfile.email}
              </p>
            ) : null}

            <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
              <DarkMetric
                label="Students"
                value={analytics.metrics.students}
              />
              <DarkMetric
                label="Applications"
                value={analytics.metrics.applications}
              />
              <DarkMetric
                label="Offers"
                value={analytics.metrics.offers}
              />
              <DarkMetric
                label="Visas"
                value={analytics.metrics.visas}
              />
            </div>
          </div>

          <div className="border-t-2 border-orange-300 bg-orange-500 p-5 text-white xl:border-l-2 xl:border-t-0 sm:p-7">
            <div className="flex items-center gap-2">
              <CircleGauge size={18} />
              <p className="text-[9px] font-black uppercase tracking-[0.1em] text-white">
                Analytics Snapshot
              </p>
            </div>

            <p className="mt-3 text-4xl font-black text-white">
              {money(
                analytics.metrics.revenue
              )}
            </p>

            <p className="mt-1 text-sm font-black uppercase tracking-[0.08em] text-white">
              Connected Revenue
            </p>

            <div className="mt-5 grid grid-cols-2 gap-2">
              <OrangeMetric
                label="App Rate"
                value={`${analytics.metrics.applicationRate}%`}
              />
              <OrangeMetric
                label="Offer Rate"
                value={`${analytics.metrics.offerRate}%`}
              />
              <OrangeMetric
                label="Visa Rate"
                value={`${analytics.metrics.visaRate}%`}
              />
              <OrangeMetric
                label="Views"
                value={views.length}
              />
            </div>
          </div>
        </div>

        <div className="mt-3 rounded-[1.35rem] border-2 border-orange-200 bg-[#FFFDF8] p-4">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex flex-wrap gap-2">
              {views.map((view) => {
                const Icon =
                  view.icon;

                const active =
                  activeView ===
                  view.key;

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
                      active
                        ? "border-[#123865] bg-[#123865] text-white shadow-[0_7px_16px_rgba(18,56,101,0.14)]"
                        : "border-slate-300 bg-white text-[#10233F] hover:border-orange-400 hover:bg-orange-50"
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
                onClick={() =>
                  void handleRefresh()
                }
                disabled={
                  refreshing
                }
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border-2 border-orange-500 bg-orange-500 px-4 text-xs font-black text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-50"
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
                  : "Refresh Analytics OS"}
              </button>
            ) : null}
          </div>
        </div>
      </div>

      {refreshError ? (
        <div className="rounded-[1.35rem] border-[3px] border-red-400 bg-red-50 p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle
              size={18}
              className="mt-0.5 shrink-0 text-red-700"
            />

            <div>
              <p className="font-black text-[#10233F]">
                Analytics refresh failed
              </p>

              <p className="mt-1 text-sm font-semibold leading-6 text-slate-600">
                {refreshError}
              </p>
            </div>
          </div>
        </div>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <MetricCard
          label="Students"
          value={
            analytics.metrics
              .students
          }
          detail="Student records available to the Analytics OS snapshot."
          icon={Users}
          tone="blue"
        />

        <MetricCard
          label="Applications"
          value={
            analytics.metrics
              .applications
          }
          detail={`${analytics.metrics.applicationRate}% of current students represented in application records.`}
          icon={FileText}
          tone="navy"
        />

        <MetricCard
          label="Offers"
          value={
            analytics.metrics
              .offers
          }
          detail={`${analytics.metrics.offerRate}% application-to-offer indicator.`}
          icon={GraduationCap}
          tone="green"
        />

        <MetricCard
          label="Visas"
          value={
            analytics.metrics.visas
          }
          detail={`${analytics.metrics.visaRate}% offer-to-visa indicator.`}
          icon={CheckCircle2}
          tone="green"
        />

        <MetricCard
          label="Revenue"
          value={money(
            analytics.metrics.revenue
          )}
          detail="Collected value from the payment rows supplied to this snapshot."
          icon={WalletCards}
          tone="orange"
        />
      </div>

      {activeView ===
      "overview" ? (
        <>
          <div className="grid gap-3 rounded-[1.7rem] border-[3px] border-[#234E78] bg-[#FFF8EE] p-4 md:grid-cols-3">
            <AnalyticsGuideCard
              label="Pipeline Visibility"
              value={`${analytics.metrics.applicationRate}%`}
              detail="Current student-to-application representation in the connected snapshot."
              tone="navy"
            />

            <AnalyticsGuideCard
              label="Offer Conversion"
              value={`${analytics.metrics.offerRate}%`}
              detail="Application-to-offer operating indicator. Read-only, not a guaranteed outcome."
              tone="green"
            />

            <AnalyticsGuideCard
              label="Revenue Signal"
              value={money(
                analytics.metrics.revenue
              )}
              detail="Current collected payment value visible to Analytics OS."
              tone="orange"
            />
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            <OverviewCard
              eyebrow="Executive Snapshot"
              title="Pipeline Position"
              description="A compact read-only view of the current operating snapshot."
              icon={Activity}
              tone="navy"
            >
              <div className="grid gap-3 sm:grid-cols-2">
                <SnapshotRow
                  label="Total Students"
                  value={
                    analytics.metrics
                      .students
                  }
                />
                <SnapshotRow
                  label="Applications"
                  value={
                    analytics.metrics
                      .applications
                  }
                />
                <SnapshotRow
                  label="Offers"
                  value={
                    analytics.metrics
                      .offers
                  }
                />
                <SnapshotRow
                  label="Visas"
                  value={
                    analytics.metrics
                      .visas
                  }
                />
              </div>
            </OverviewCard>

            <OverviewCard
              eyebrow="Analytics Health"
              title="Operating Coverage"
              description="What this Analytics OS container currently exposes."
              icon={ShieldCheck}
              tone="orange"
            >
              <div className="grid gap-3 sm:grid-cols-2">
                <CoverageRow
                  label="KPI Command"
                  detail="Executive KPI workspace"
                />
                <CoverageRow
                  label="Business Intelligence"
                  detail="Cross-business analysis"
                />
                <CoverageRow
                  label="Forecast Engine"
                  detail="Forward-looking indicators"
                />
                <CoverageRow
                  label="Trend Analysis"
                  detail="Movement and change detection"
                />
                <CoverageRow
                  label="Executive Reports"
                  detail="Leadership reporting"
                />
                <CoverageRow
                  label="Analytics Data Contract"
                  detail="History, targets, BI, forecasts and reports can be wired through this anchor"
                />
              </div>
            </OverviewCard>
          </div>
        </>
      ) : null}

      {activeView ===
      "kpi" ? (
        <KPICommandCenter
          analytics={analytics}
        />
      ) : null}

      {activeView ===
      "bi" ? (
        <BusinessIntelligencePanel
          analytics={analytics}
        />
      ) : null}

      {activeView ===
      "forecast" ? (
        <ForecastEnginePanel
          analytics={analytics}
        />
      ) : null}

      {activeView ===
      "trends" ? (
        <TrendAnalysisPanel
          analytics={analytics}
        />
      ) : null}

      {activeView ===
      "reports" ? (
        <ExecutiveReportingPanel
          analytics={analytics}
          onGenerateReport={onGenerateReport}
          onOpenReport={onOpenReport}
          onDistributeReport={onDistributeReport}
        />
      ) : null}

      <div className="rounded-[1.35rem] border-[3px] border-[#234E78] bg-[#EEF4FA] p-4">
        <div className="flex items-start gap-3">
          <ShieldCheck
            size={18}
            className="mt-0.5 shrink-0 text-[#123865]"
          />

          <div>
            <p className="font-black text-[#10233F]">
              Analytics OS scope
            </p>

            <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">
              This parent dashboard is the Analytics OS anchor: it builds the deterministic current snapshot, safely merges optional historical, KPI, BI, forecast and reporting inputs, and routes them into the connected child workspaces. It performs no backend mutation by itself; reporting mutations only run through explicitly supplied handlers.
            </p>
          </div>
        </div>
      </div>
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
    <div className="rounded-[1.15rem] border-2 border-orange-300 bg-orange-50 p-4">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border-2 border-orange-300 bg-white text-orange-700">
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
