// AIAnalytics V3 EXTREME — Zaifan AI Command OS
// Full replacement for:
// src/components/admin/ai-command/AIAnalytics.jsx
//
// Production rules:
// - no fabricated model accuracy, prediction counts, confidence or success rates
// - analytics are derived only from supplied Executive snapshot data
// - calculated metrics are labelled as calculated/observed
// - unavailable evidence stays unavailable instead of becoming fake percentages
// - refresh only works when a real parent handler exists
// - shared AI Command OS navigation
// - responsive from mobile to wide Admin workspace
//
// Supported props:
// snapshot = {
//   scores?: [],
//   summary?: {},
//   operations?: {},
//   commandMetrics?: {},
//   alertSnapshot?: {},
//   executiveSnapshot?: {},
//   verificationSnapshot?: {},
//   workflowScanner?: {},
//   workflowIntegrity?: {},
//   productionReadiness?: {},
//   forecasts?: [],
//   predictions?: [],
//   recommendations?: [],
//   analytics?: {},
//   updatedAt | generatedAt | lastUpdated,
//   sourceLabel,
// }
// onRefresh?: async () => void
// onOpenModule?: (moduleId) => void
// onOpenSystem?: (viewId) => void

import React, { useMemo, useState } from "react";
import AICommandModuleNav from "./AICommandModuleNav";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Brain,
  CheckCircle2,
  CircleGauge,
  Clock3,
  Database,
  FileText,
  GraduationCap,
  Info,
  LineChart,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
  Users,
  Workflow,
  X,
  XCircle,
} from "lucide-react";

function safeArray(value) {
  return Array.isArray(value) ? value.filter(Boolean) : [];
}

function hasValue(value) {
  return value !== undefined && value !== null && value !== "";
}

function safeText(value, fallback = "") {
  if (value === undefined || value === null) return fallback;
  return String(value);
}

function safeNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function normalize(value = "") {
  return safeText(value)
    .toLowerCase()
    .trim()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ");
}

function formatCount(value) {
  if (!hasValue(value)) return "—";
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed.toLocaleString("en-GB") : safeText(value);
}

function formatPercent(value) {
  if (!hasValue(value)) return "—";
  const parsed = Number(value);
  return Number.isFinite(parsed) ? `${Math.round(parsed)}%` : safeText(value);
}

function formatTimestamp(value) {
  if (!value) return "No update time supplied";

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "Update time unavailable";

  try {
    return new Intl.DateTimeFormat("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  } catch {
    return "Update time unavailable";
  }
}

function resolveJourneyStage(score = {}) {
  const direct = normalize(score.journey_stage || score?.diagnostics?.journey_stage);
  if (direct) return direct;

  const applicationStatus = normalize(score.application_status);
  const offerStatus = normalize(score.offer_status);
  const visaStatus = normalize(score.visa_status);

  if (applicationStatus === "enrolled") return "enrolled";
  if (["visa approved", "approved"].includes(visaStatus)) return "visa approved";
  if (["visa rejected", "rejected", "refused", "visa refused"].includes(visaStatus)) return "visa rejected";
  if (["visa pending", "pending", "submitted", "under review", "review", "processing"].includes(visaStatus)) return "visa pending";
  if (applicationStatus === "cas issued") return "cas issued";
  if (applicationStatus === "cas pending") return "cas pending";
  if (["offer accepted", "accepted", "confirmed"].includes(applicationStatus) || ["offer accepted", "accepted", "confirmed"].includes(offerStatus)) return "offer accepted";
  if (["offer received", "offer", "received", "conditional offer", "unconditional offer"].includes(applicationStatus) || ["offer received", "offer", "received", "conditional offer", "unconditional offer"].includes(offerStatus)) return "offer received";
  if (["under review", "review", "processing"].includes(applicationStatus)) return "application under review";
  if (["applied", "submitted"].includes(applicationStatus)) return "application submitted";
  if (["started", "in progress", "draft"].includes(applicationStatus)) return "application started";

  return "not started";
}

function resolveRisk(score = {}) {
  const value = safeNumber(
    score.risk_score ?? score.riskScore ?? score?.diagnostics?.risk_score,
    NaN
  );
  return Number.isFinite(value) ? value : null;
}

function resolveOpportunity(score = {}) {
  const value = safeNumber(
    score.opportunity_score ??
      score.opportunityScore ??
      score?.diagnostics?.opportunity_score,
    NaN
  );
  return Number.isFinite(value) ? value : null;
}

function average(values) {
  const clean = values.filter((value) => Number.isFinite(value));
  if (!clean.length) return null;
  return clean.reduce((sum, value) => sum + value, 0) / clean.length;
}

function percentage(part, total) {
  if (!total) return null;
  return Math.round((part / total) * 100);
}

function searchable(...parts) {
  return normalize(parts.filter(Boolean).join(" "));
}

export default function AIAnalytics({
  snapshot = {},
  onRefresh,
  onOpenModule,
  onOpenSystem,
}) {
  const [search, setSearch] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [refreshError, setRefreshError] = useState("");

  const scores = useMemo(
    () => safeArray(snapshot.scores || snapshot.students),
    [snapshot.scores, snapshot.students]
  );

  const forecasts = useMemo(
    () =>
      Array.isArray(snapshot.forecasts)
        ? safeArray(snapshot.forecasts)
        : snapshot.forecasts && typeof snapshot.forecasts === "object"
          ? Object.values(snapshot.forecasts).flatMap(safeArray)
          : [],
    [snapshot.forecasts]
  );

  const predictions = useMemo(
    () =>
      Array.isArray(snapshot.predictions)
        ? safeArray(snapshot.predictions)
        : snapshot.predictions && typeof snapshot.predictions === "object"
          ? Object.values(snapshot.predictions).flatMap(safeArray)
          : [],
    [snapshot.predictions]
  );

  const recommendations = useMemo(
    () => safeArray(snapshot.recommendations),
    [snapshot.recommendations]
  );

  const analytics = snapshot.analytics || {};
  const commandMetrics = snapshot.commandMetrics || {};
  const operations = snapshot.operations || {};
  const alerts = snapshot.alertSnapshot || {};
  const workflowIntegrity = snapshot.workflowIntegrity || {};
  const productionReadiness = snapshot.productionReadiness || {};
  const workflowScanner = snapshot.workflowScanner || {};

  const derived = useMemo(() => {
    const total = scores.length;

    const applications = scores.filter((score) =>
      [
        "application started",
        "application submitted",
        "application under review",
      ].includes(resolveJourneyStage(score))
    ).length;

    const offers = scores.filter((score) =>
      ["offer received", "offer accepted"].includes(resolveJourneyStage(score))
    ).length;

    const visaWatch = scores.filter((score) =>
      ["cas pending", "cas issued", "visa pending", "visa rejected"].includes(
        resolveJourneyStage(score)
      )
    ).length;

    const approved = scores.filter((score) =>
      ["visa approved", "enrolled"].includes(resolveJourneyStage(score))
    ).length;

    const riskValues = scores.map(resolveRisk).filter((value) => value !== null);
    const opportunityValues = scores
      .map(resolveOpportunity)
      .filter((value) => value !== null);

    const highRisk = riskValues.filter((value) => value >= 70).length;
    const highOpportunity = opportunityValues.filter((value) => value >= 70).length;

    const scoredRiskCoverage = percentage(riskValues.length, total);
    const scoredOpportunityCoverage = percentage(opportunityValues.length, total);

    return {
      total,
      applications,
      offers,
      visaWatch,
      approved,
      averageRisk: average(riskValues),
      averageOpportunity: average(opportunityValues),
      highRisk,
      highOpportunity,
      scoredRiskCoverage,
      scoredOpportunityCoverage,
    };
  }, [scores]);

  const journeyStages = useMemo(() => {
    const stageMap = new Map();

    scores.forEach((score) => {
      const stage = resolveJourneyStage(score);
      stageMap.set(stage, (stageMap.get(stage) || 0) + 1);
    });

    return [...stageMap.entries()]
      .map(([stage, count]) => ({
        stage,
        count,
        share: percentage(count, scores.length),
      }))
      .sort((a, b) => b.count - a.count);
  }, [scores]);

  const evidenceMetrics = useMemo(
    () => [
      {
        id: "portfolio",
        label: "Portfolio Records",
        value: formatCount(derived.total),
        detail: "Executive student score records currently loaded.",
        source: "scores",
        tone: "navy",
        icon: Users,
      },
      {
        id: "risk-coverage",
        label: "Risk Score Coverage",
        value: formatPercent(derived.scoredRiskCoverage),
        detail: "Share of loaded records carrying an explicit numeric risk score.",
        source: "calculated",
        tone:
          derived.scoredRiskCoverage !== null && derived.scoredRiskCoverage >= 80
            ? "green"
            : "orange",
        icon: AlertTriangle,
      },
      {
        id: "opportunity-coverage",
        label: "Opportunity Coverage",
        value: formatPercent(derived.scoredOpportunityCoverage),
        detail: "Share of loaded records carrying an explicit numeric opportunity score.",
        source: "calculated",
        tone:
          derived.scoredOpportunityCoverage !== null &&
          derived.scoredOpportunityCoverage >= 80
            ? "green"
            : "orange",
        icon: Target,
      },
      {
        id: "forecasts",
        label: "Forecast Outputs",
        value: formatCount(forecasts.length),
        detail: "Forecast records currently supplied to AI Command OS.",
        source: "snapshot.forecasts",
        tone: forecasts.length ? "green" : "blue",
        icon: LineChart,
      },
      {
        id: "predictions",
        label: "Prediction Outputs",
        value: formatCount(predictions.length),
        detail: "Prediction records currently supplied to AI Command OS.",
        source: "snapshot.predictions",
        tone: predictions.length ? "green" : "blue",
        icon: Brain,
      },
      {
        id: "recommendations",
        label: "Recommendations",
        value: formatCount(recommendations.length),
        detail: "Connected recommendation records available for decision support.",
        source: "snapshot.recommendations",
        tone: recommendations.length ? "green" : "blue",
        icon: Sparkles,
      },
    ],
    [derived, forecasts.length, predictions.length, recommendations.length]
  );

  const operationalMetrics = useMemo(
    () => [
      {
        label: "Critical Students",
        value: formatCount(
          hasValue(commandMetrics.critical)
            ? commandMetrics.critical
            : alerts.critical
        ),
        detail: "Critical portfolio count supplied by Executive Command.",
        tone:
          safeNumber(
            hasValue(commandMetrics.critical)
              ? commandMetrics.critical
              : alerts.critical
          ) > 0
            ? "red"
            : "green",
      },
      {
        label: "Executive Priority",
        value: formatCount(commandMetrics.executivePriority),
        detail: "Leadership-priority student records.",
        tone: "orange",
      },
      {
        label: "Conversion Ready",
        value: formatCount(
          hasValue(commandMetrics.conversionReady)
            ? commandMetrics.conversionReady
            : operations?.revenue?.conversionReady
        ),
        detail: "Current conversion-ready operational proxy.",
        tone: "green",
      },
      {
        label: "Overdue Tasks",
        value: formatCount(operations?.today?.overdueTasks),
        detail: "Overdue tasks from Executive Operations.",
        tone:
          safeNumber(operations?.today?.overdueTasks) > 0 ? "orange" : "green",
      },
      {
        label: "Workflow Integrity",
        value: formatPercent(workflowIntegrity?.overallIntegrity),
        detail: "Verification-engine workflow integrity score.",
        tone:
          safeNumber(workflowIntegrity?.overallIntegrity) >= 75
            ? "green"
            : "orange",
      },
      {
        label: "Production Readiness",
        value: formatPercent(productionReadiness?.readinessScore),
        detail: "Production verification readiness score.",
        tone:
          safeNumber(productionReadiness?.readinessScore) >= 75
            ? "green"
            : "orange",
      },
    ],
    [
      commandMetrics,
      alerts,
      operations,
      workflowIntegrity,
      productionReadiness,
    ]
  );

  const qualityMetrics = useMemo(() => {
    const supplied = [
      {
        label: "Model Accuracy",
        value:
          analytics.modelAccuracy ??
          analytics.accuracy ??
          snapshot.modelAccuracy,
        detail:
          "Only displayed when a real evaluated model accuracy value is supplied.",
      },
      {
        label: "Prediction Confidence",
        value:
          analytics.predictionConfidence ??
          analytics.confidence ??
          snapshot.predictionConfidence,
        detail:
          "Only displayed when the prediction system supplies an aggregate confidence measure.",
      },
      {
        label: "Forecast Success",
        value:
          analytics.forecastSuccess ??
          analytics.forecastSuccessRate ??
          snapshot.forecastSuccess,
        detail:
          "Requires a real historical forecast evaluation source.",
      },
      {
        label: "Automation Success",
        value:
          analytics.automationSuccess ??
          analytics.automationSuccessRate ??
          snapshot.automationSuccess,
        detail:
          "Requires observed automation outcome telemetry.",
      },
    ];

    return supplied.map((item) => ({
      ...item,
      available: hasValue(item.value),
      display: hasValue(item.value) ? formatPercent(item.value) : "Unavailable",
    }));
  }, [analytics, snapshot]);

  const sourceCoverage = useMemo(() => {
    const checks = [
      { label: "Executive scores", connected: scores.length > 0 },
      {
        label: "Command metrics",
        connected: Object.keys(commandMetrics).length > 0,
      },
      {
        label: "Operations",
        connected: Object.keys(operations).length > 0,
      },
      {
        label: "Alerts",
        connected: Object.keys(alerts).length > 0,
      },
      {
        label: "Workflow integrity",
        connected: Object.keys(workflowIntegrity).length > 0,
      },
      {
        label: "Production readiness",
        connected: Object.keys(productionReadiness).length > 0,
      },
      { label: "Forecasts", connected: forecasts.length > 0 },
      { label: "Predictions", connected: predictions.length > 0 },
    ];

    const connected = checks.filter((item) => item.connected).length;

    return {
      checks,
      connected,
      percent: Math.round((connected / checks.length) * 100),
    };
  }, [
    scores.length,
    commandMetrics,
    operations,
    alerts,
    workflowIntegrity,
    productionReadiness,
    forecasts.length,
    predictions.length,
  ]);

  const query = normalize(search);

  const visibleEvidenceMetrics = useMemo(
    () =>
      evidenceMetrics.filter((item) =>
        searchable(item.label, item.detail, item.source).includes(query)
      ),
    [evidenceMetrics, query]
  );

  const visibleOperationalMetrics = useMemo(
    () =>
      operationalMetrics.filter((item) =>
        searchable(item.label, item.detail, item.value).includes(query)
      ),
    [operationalMetrics, query]
  );

  const visibleJourneyStages = useMemo(
    () =>
      journeyStages.filter((item) =>
        searchable(item.stage, item.count, item.share).includes(query)
      ),
    [journeyStages, query]
  );

  const hasRefresh = typeof onRefresh === "function";
  const hasOpenSystem = typeof onOpenSystem === "function";

  const sourceLabel =
    safeText(snapshot.sourceLabel).trim() || "Executive snapshot";

  const updatedAt =
    snapshot.generatedAt || snapshot.updatedAt || snapshot.lastUpdated || null;

  const handleRefresh = async () => {
    if (!hasRefresh || refreshing) return;

    setRefreshing(true);
    setRefreshError("");

    try {
      await onRefresh();
    } catch (error) {
      console.error("AI Analytics refresh failed:", error);
      setRefreshError(error?.message || "AI Analytics could not refresh.");
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <section className="space-y-4 p-3 sm:space-y-5 sm:p-5">
      <AICommandModuleNav
        activeModule="ai-analytics"
        onOpenModule={onOpenModule}
      />

      <header className="overflow-hidden rounded-[1.8rem] border-[3px] border-orange-400 bg-[#FFF8EE] shadow-[0_18px_48px_rgba(23,36,61,0.09)]">
        <div className="grid xl:grid-cols-[minmax(0,1.5fr)_minmax(300px,0.5fr)]">
          <div className="bg-[#123865] p-5 text-white sm:p-7">
            <div className="flex flex-wrap items-center gap-2">
              <HeaderChip icon={BarChart3} label="AI Analytics" />
              <HeaderChip icon={ShieldCheck} label="Evidence First" />
              <HeaderChip icon={Database} label={sourceLabel} />
            </div>

            <div className="mt-4 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
              <div className="max-w-4xl">
                <h1 className="text-2xl font-black tracking-[-0.03em] text-white sm:text-3xl">
                  AI Intelligence Analytics
                </h1>

                <p className="mt-2 text-sm font-semibold leading-6 text-white/90 sm:text-[15px]">
                  Measure the evidence feeding Zaifan's executive intelligence:
                  portfolio coverage, operating signals, forecast inputs,
                  verification context and real model telemetry when available.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:min-w-[420px]">
                <DarkMetric label="Records" value={formatCount(derived.total)} />
                <DarkMetric label="Forecasts" value={formatCount(forecasts.length)} />
                <DarkMetric label="Predictions" value={formatCount(predictions.length)} />
                <DarkMetric label="Sources" value={`${sourceCoverage.connected}/8`} />
              </div>
            </div>
          </div>

          <div className="border-t-[3px] border-orange-300 bg-orange-500 p-5 text-white xl:border-l-[3px] xl:border-t-0 sm:p-7">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <CircleGauge size={18} />
                  <p className="text-[9px] font-black uppercase tracking-[0.12em] text-white">
                    Intelligence coverage
                  </p>
                </div>

                <p className="mt-3 text-5xl font-black leading-none text-white">
                  {sourceCoverage.percent}%
                </p>

                <p className="mt-2 text-xs font-black uppercase tracking-[0.09em] text-white">
                  {sourceCoverage.percent >= 75
                    ? "Strong context"
                    : sourceCoverage.percent >= 40
                      ? "Partial context"
                      : "Limited context"}
                </p>
              </div>

              <span className="flex h-12 w-12 items-center justify-center rounded-2xl border-2 border-white/30 bg-white/10">
                <Activity size={22} />
              </span>
            </div>

            <div className="mt-5 rounded-2xl border-2 border-white/25 bg-white/10 p-3">
              <p className="text-[9px] font-black uppercase tracking-[0.1em] text-white">
                Last snapshot
              </p>
              <p className="mt-2 text-xs font-black text-white">
                {formatTimestamp(updatedAt)}
              </p>
              <p className="mt-1 text-[10px] font-semibold leading-4 text-white/85">
                Coverage measures connected data sources, not AI accuracy.
              </p>
            </div>
          </div>
        </div>

        <div className="border-t-[3px] border-orange-300 bg-[#FFF8EE] p-3 sm:p-4">
          <div className="grid gap-3 xl:grid-cols-[minmax(260px,1fr)_auto]">
            <div className="relative">
              <Search
                size={17}
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
              />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search analytics, stages, coverage or operational signals..."
                aria-label="Search AI Analytics"
                className="min-h-12 w-full rounded-xl border-2 border-slate-300 bg-white py-2.5 pl-11 pr-11 text-sm font-semibold text-[#10233F] outline-none transition placeholder:text-slate-400 focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
              />
              {search ? (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  aria-label="Clear AI Analytics search"
                  className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-[#123865]"
                >
                  <X size={16} />
                </button>
              ) : null}
            </div>

            <button
              type="button"
              onClick={() => void handleRefresh()}
              disabled={!hasRefresh || refreshing}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border-2 border-orange-500 bg-orange-500 px-5 text-xs font-black text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:border-slate-300 disabled:bg-slate-200 disabled:text-slate-500"
            >
              <RefreshCw
                size={15}
                className={refreshing ? "animate-spin" : ""}
              />
              {refreshing
                ? "Refreshing..."
                : hasRefresh
                  ? "Refresh Analytics"
                  : "Refresh Not Connected"}
            </button>
          </div>
        </div>
      </header>

      {refreshError ? (
        <InlineNotice
          tone="red"
          icon={XCircle}
          title="Analytics refresh failed"
          detail={refreshError}
          actionLabel="Dismiss"
          onAction={() => setRefreshError("")}
        />
      ) : null}

      {!hasRefresh ? (
        <InlineNotice
          icon={Info}
          title="Refresh is not connected"
          detail="AI Analytics remains read-only until the parent supplies onRefresh. Static data is never presented as freshly synchronized."
        />
      ) : null}

      <section>
        <SectionIntro
          eyebrow="Evidence Layer"
          title="Intelligence Coverage"
          description="Coverage shows which real inputs are available to the AI Command OS. It is not a model-quality score."
          badge={`${sourceCoverage.connected} of ${sourceCoverage.checks.length} sources`}
        />

        <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {visibleEvidenceMetrics.length ? (
            visibleEvidenceMetrics.map((item) => (
              <MetricCard key={item.id} {...item} />
            ))
          ) : (
            <div className="sm:col-span-2 xl:col-span-3">
              <EmptyState
                title="No evidence metrics match this search"
                text="Try another search term."
                onClear={() => setSearch("")}
              />
            </div>
          )}
        </div>
      </section>

      <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <section className="overflow-hidden rounded-[1.75rem] border-[3px] border-[#234E78] bg-[#FFFDF8]">
          <SectionHeader
            eyebrow="Portfolio Analytics"
            title="Student Journey Distribution"
            description="Observed journey-stage distribution across the currently loaded Executive portfolio."
            icon={GraduationCap}
            count={visibleJourneyStages.length}
          />

          <div className="p-4 sm:p-5">
            {visibleJourneyStages.length ? (
              <div className="space-y-3">
                {visibleJourneyStages.map((item) => (
                  <JourneyRow key={item.stage} item={item} />
                ))}
              </div>
            ) : (
              <EmptyState
                title={scores.length ? "No journey stages match this search" : "No student journey data loaded"}
                text={
                  scores.length
                    ? "Try another search term."
                    : "Load Executive student score records to calculate the journey distribution."
                }
                onClear={query ? () => setSearch("") : undefined}
              />
            )}
          </div>
        </section>

        <section className="overflow-hidden rounded-[1.75rem] border-[3px] border-orange-400 bg-[#FFF8EE]">
          <SectionHeader
            eyebrow="Model Governance"
            title="AI Quality Telemetry"
            description="These values remain unavailable unless a real evaluation source supplies them."
            icon={Brain}
            count={qualityMetrics.filter((item) => item.available).length}
          />

          <div className="grid gap-3 p-4">
            {qualityMetrics.map((item) => (
              <QualityCard key={item.label} item={item} />
            ))}
          </div>
        </section>
      </div>

      <section className="overflow-hidden rounded-[1.75rem] border-[3px] border-[#234E78] bg-[#FFFDF8]">
        <SectionHeader
          eyebrow="Operating Layer"
          title="Executive Operational Analytics"
          description="Current operating signals from Executive Command, verification and workflow systems."
          icon={Workflow}
          count={visibleOperationalMetrics.length}
        />

        <div className="grid gap-3 p-4 sm:grid-cols-2 xl:grid-cols-3">
          {visibleOperationalMetrics.length ? (
            visibleOperationalMetrics.map((item) => (
              <ContextCard key={item.label} {...item} />
            ))
          ) : (
            <div className="sm:col-span-2 xl:col-span-3">
              <EmptyState
                title="No operational analytics match this search"
                text="Try another search term."
                onClear={() => setSearch("")}
              />
            </div>
          )}
        </div>

        {hasOpenSystem ? (
          <div className="flex flex-wrap gap-2 border-t-2 border-slate-200 bg-[#EEF4FA] p-4">
            <SystemAction
              label="Open Operations"
              onClick={() => onOpenSystem("operations")}
            />
            <SystemAction
              label="Open Verification"
              onClick={() => onOpenSystem("verification")}
            />
            <SystemAction
              label="Open Executive Intelligence"
              onClick={() => onOpenSystem("intelligence")}
            />
          </div>
        ) : null}
      </section>

      <section className="overflow-hidden rounded-[1.75rem] border-[3px] border-orange-400 bg-[#FFF8EE]">
        <SectionHeader
          eyebrow="Source Audit"
          title="Connected Intelligence Sources"
          description="A transparent view of which inputs are actually connected to this analytics workspace."
          icon={Database}
          count={sourceCoverage.connected}
        />

        <div className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-4">
          {sourceCoverage.checks.map((item) => (
            <article
              key={item.label}
              className={`rounded-xl border-2 p-4 ${
                item.connected
                  ? "border-emerald-400 bg-emerald-50"
                  : "border-slate-300 bg-white"
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-black text-[#10233F]">
                  {item.label}
                </p>
                {item.connected ? (
                  <CheckCircle2 size={17} className="text-emerald-700" />
                ) : (
                  <Clock3 size={17} className="text-slate-400" />
                )}
              </div>

              <p
                className={`mt-2 text-[9px] font-black uppercase tracking-[0.08em] ${
                  item.connected ? "text-emerald-800" : "text-slate-500"
                }`}
              >
                {item.connected ? "Connected" : "Not supplied"}
              </p>
            </article>
          ))}
        </div>
      </section>

      <footer className="grid gap-3 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-[1.35rem] border-[3px] border-[#234E78] bg-[#EEF4FA] p-4">
          <div className="flex items-start gap-3">
            <ShieldCheck size={18} className="mt-0.5 shrink-0 text-[#123865]" />
            <div>
              <p className="font-black text-[#10233F]">
                Analytics integrity
              </p>
              <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">
                Model accuracy, prediction confidence, forecast success and
                automation success are no longer hard-coded. They stay
                unavailable until measured telemetry exists.
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-[1.35rem] border-[3px] border-orange-400 bg-orange-50 p-4">
          <div className="flex items-start gap-3">
            <BarChart3 size={18} className="mt-0.5 shrink-0 text-orange-700" />
            <div>
              <p className="font-black text-[#10233F]">
                Observed vs evaluated
              </p>
              <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">
                Portfolio distributions are observed/calculated. AI quality
                claims require separate evaluation evidence.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </section>
  );
}

function HeaderChip({ icon: Icon, label }) {
  return (
    <span className="inline-flex max-w-full items-center gap-1.5 rounded-full border-2 border-white/20 bg-white/10 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.09em] text-white">
      <Icon size={11} className="shrink-0" />
      <span className="truncate">{label}</span>
    </span>
  );
}

function DarkMetric({ label, value }) {
  return (
    <div className="min-w-0 rounded-xl border-2 border-white/20 bg-white/10 p-3">
      <p className="truncate text-[8px] font-black uppercase tracking-[0.08em] text-white/85">
        {label}
      </p>
      <p className="mt-1 truncate text-xl font-black text-white">{value}</p>
    </div>
  );
}

function SectionIntro({ eyebrow, title, description, badge }) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="text-[9px] font-black uppercase tracking-[0.13em] text-orange-700">
          {eyebrow}
        </p>
        <h2 className="mt-1 text-xl font-black text-[#10233F]">{title}</h2>
        <p className="mt-1 max-w-3xl text-xs font-semibold leading-5 text-slate-600">
          {description}
        </p>
      </div>

      <span className="w-fit rounded-lg border-2 border-[#234E78] bg-[#EEF4FA] px-3 py-2 text-[9px] font-black uppercase tracking-[0.08em] text-[#123865]">
        {badge}
      </span>
    </div>
  );
}

function SectionHeader({
  eyebrow,
  title,
  description,
  icon: Icon,
  count,
}) {
  return (
    <div className="flex items-start justify-between gap-3 border-b-[3px] border-orange-400 bg-[#123865] px-4 py-4 text-white sm:px-5">
      <div className="min-w-0">
        <p className="text-[9px] font-black uppercase tracking-[0.14em] text-orange-300">
          {eyebrow}
        </p>
        <h2 className="mt-1 text-lg font-black text-white">{title}</h2>
        <p className="mt-1 max-w-4xl text-xs font-semibold leading-5 text-white/80">
          {description}
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <span className="rounded-lg border-2 border-white/20 bg-white/10 px-2.5 py-1 text-xs font-black text-white">
          {count}
        </span>
        <span className="flex h-10 w-10 items-center justify-center rounded-xl border-2 border-white/25 bg-white/10">
          <Icon size={17} />
        </span>
      </div>
    </div>
  );
}

function MetricCard({ label, value, detail, source, tone = "navy", icon: Icon }) {
  return (
    <article className={`rounded-[1.25rem] border-[3px] p-4 ${toneClass(tone)}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[9px] font-black uppercase tracking-[0.09em] text-[#10233F]">
            {label}
          </p>
          <p className="mt-2 text-2xl font-black text-[#10233F]">{value}</p>
        </div>
        <Icon size={18} className="shrink-0 text-[#123865]" />
      </div>

      <p className="mt-2 text-[10px] font-semibold leading-4 text-slate-600">
        {detail}
      </p>

      <span className="mt-3 inline-flex rounded-md border border-slate-300 bg-white/70 px-2 py-0.5 text-[8px] font-black uppercase tracking-[0.06em] text-slate-600">
        {source}
      </span>
    </article>
  );
}

function ContextCard({ label, value, detail, tone = "navy" }) {
  return (
    <article className={`rounded-[1.25rem] border-[3px] p-4 ${toneClass(tone)}`}>
      <p className="text-[9px] font-black uppercase tracking-[0.09em] text-[#10233F]">
        {label}
      </p>
      <p className="mt-2 text-2xl font-black text-[#10233F]">{value}</p>
      <p className="mt-2 text-[10px] font-semibold leading-4 text-slate-600">
        {detail}
      </p>
    </article>
  );
}

function JourneyRow({ item }) {
  const width = item.share === null ? 0 : Math.max(2, Math.min(100, item.share));

  return (
    <article className="rounded-xl border-2 border-slate-300 bg-white p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="font-black capitalize text-[#10233F]">
            {item.stage}
          </p>
          <p className="mt-1 text-[9px] font-black uppercase tracking-[0.07em] text-slate-500">
            Observed journey stage
          </p>
        </div>

        <div className="text-right">
          <p className="font-black text-[#10233F]">{formatCount(item.count)}</p>
          <p className="text-[9px] font-black text-slate-500">
            {formatPercent(item.share)}
          </p>
        </div>
      </div>

      <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200">
        <div
          className="h-full rounded-full bg-[#123865]"
          style={{ width: `${width}%` }}
        />
      </div>
    </article>
  );
}

function QualityCard({ item }) {
  return (
    <article
      className={`rounded-xl border-2 p-4 ${
        item.available
          ? "border-emerald-400 bg-emerald-50"
          : "border-slate-300 bg-white"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-black text-[#10233F]">{item.label}</p>
          <p
            className={`mt-2 text-xl font-black ${
              item.available ? "text-emerald-800" : "text-slate-500"
            }`}
          >
            {item.display}
          </p>
        </div>

        {item.available ? (
          <CheckCircle2 size={18} className="text-emerald-700" />
        ) : (
          <Info size={18} className="text-slate-400" />
        )}
      </div>

      <p className="mt-2 text-[10px] font-semibold leading-4 text-slate-600">
        {item.detail}
      </p>
    </article>
  );
}

function SystemAction({ label, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1.5 rounded-lg border-2 border-[#234E78] bg-white px-3 py-2 text-[9px] font-black uppercase tracking-[0.07em] text-[#123865] transition hover:bg-[#123865] hover:text-white"
    >
      {label}
      <ArrowRight size={12} />
    </button>
  );
}

function InlineNotice({
  tone = "blue",
  icon: Icon = Info,
  title,
  detail,
  actionLabel,
  onAction,
}) {
  const classes =
    tone === "red"
      ? "border-red-400 bg-red-50"
      : "border-blue-300 bg-blue-50";

  return (
    <div className={`rounded-[1.25rem] border-[3px] p-4 ${classes}`}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <Icon
            className={`mt-0.5 shrink-0 ${
              tone === "red" ? "text-red-700" : "text-blue-700"
            }`}
            size={18}
          />
          <div>
            <p className="font-black text-[#10233F]">{title}</p>
            <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">
              {detail}
            </p>
          </div>
        </div>

        {actionLabel && onAction ? (
          <button
            type="button"
            onClick={onAction}
            className="shrink-0 rounded-lg border-2 border-slate-300 bg-white px-3 py-2 text-[9px] font-black uppercase tracking-[0.07em] text-[#10233F] transition hover:border-orange-300 hover:bg-orange-50"
          >
            {actionLabel}
          </button>
        ) : null}
      </div>
    </div>
  );
}

function EmptyState({ title, text, onClear }) {
  return (
    <div className="rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 p-5 text-center">
      <Sparkles className="mx-auto text-orange-600" size={20} />
      <p className="mt-2 text-sm font-black text-[#10233F]">{title}</p>
      <p className="mx-auto mt-1 max-w-md text-xs font-semibold leading-5 text-slate-600">
        {text}
      </p>

      {onClear ? (
        <button
          type="button"
          onClick={onClear}
          className="mt-3 rounded-lg border-2 border-orange-400 bg-white px-3 py-2 text-[9px] font-black uppercase tracking-[0.07em] text-orange-800 transition hover:bg-orange-50"
        >
          Clear search
        </button>
      ) : null}
    </div>
  );
}

function toneClass(tone = "navy") {
  if (tone === "red") return "border-red-400 bg-red-50";
  if (tone === "orange") return "border-orange-400 bg-orange-50";
  if (tone === "green") return "border-emerald-400 bg-emerald-50";
  if (tone === "blue") return "border-blue-400 bg-blue-50";
  return "border-[#234E78] bg-[#EEF4FA]";
}
