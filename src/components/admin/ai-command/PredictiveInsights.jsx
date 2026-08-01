// PredictiveInsights V5 PARTNER-OS PREMIUM — Zaifan AI Command OS
// Full replacement for:
// src/components/admin/ai-command/PredictiveInsights.jsx
//
// Production rules:
// - never fabricate enrollment, revenue, application, offer, visa or growth forecasts
// - forecast values only appear when supplied by a real forecasting source
// - current portfolio baselines may be derived from snapshot.scores, but are labelled "Current baseline"
// - confidence, change and trend remain unavailable unless explicitly supplied
// - timeframe selection genuinely filters/selects supplied forecast payloads
// - refresh only works when the parent provides onRefresh
// - all AI Command modules share one navigation rail
// - responsive from mobile to wide Admin workspace
//
// Supported props:
// snapshot = {
//   scores?: [],
//   forecasts?: [] | { "30": [], "90": [], "180": [], "365": [] },
//   predictions?: [] | { "30": [], "90": [], "180": [], "365": [] },
//   opportunities?: [],
//   risks?: [],
//   assumptions?: [],
//   updatedAt | generatedAt | lastUpdated,
//   sourceLabel,
// }
// onRefresh?: async () => void
// onInspectForecast?: (forecast) => void
// onInspectPrediction?: (prediction) => void
// onInspectOpportunity?: (opportunity) => void
// onInspectRisk?: (risk) => void
// onOpenModule?: (moduleId) => void

import React, { useMemo, useState } from "react";
import AICommandModuleNav from "./AICommandModuleNav";
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Brain,
  CalendarDays,
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
  TrendingDown,
  TrendingUp,
  Users,
  X,
  XCircle,
} from "lucide-react";

const TIMEFRAMES = [
  { label: "30 Days", value: "30" },
  { label: "90 Days", value: "90" },
  { label: "6 Months", value: "180" },
  { label: "12 Months", value: "365" },
];

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

function formatMoney(value, currency = "GBP") {
  if (!hasValue(value)) return "—";

  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return safeText(value);

  try {
    return new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency: currency || "GBP",
      maximumFractionDigits: 0,
    }).format(parsed);
  } catch {
    return `${parsed.toLocaleString("en-GB")} ${currency || "GBP"}`;
  }
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

function pickTimedPayload(value, timeframe) {
  if (Array.isArray(value)) {
    return value.filter((item) => {
      if (!item || typeof item !== "object") return true;
      if (!hasValue(item.timeframe) && !hasValue(item.horizonDays)) return true;
      return String(item.timeframe ?? item.horizonDays) === String(timeframe);
    });
  }

  if (value && typeof value === "object") {
    return safeArray(
      value[timeframe] ||
      value[`${timeframe}d`] ||
      value[Number(timeframe)]
    );
  }

  return [];
}

function resolveTitle(item, fallback) {
  if (typeof item === "string") return item;
  return item?.title || item?.name || item?.label || item?.category || fallback;
}

function resolveDetail(item, fallback) {
  if (typeof item === "string") return fallback;
  return (
    item?.prediction ||
    item?.detail ||
    item?.description ||
    item?.insight ||
    item?.message ||
    fallback
  );
}

function getTone(value = "") {
  const clean = normalize(value);

  if (
    clean.includes("critical") ||
    clean.includes("high risk") ||
    clean.includes("negative") ||
    clean.includes("down") ||
    clean.startsWith("-")
  ) {
    return "red";
  }

  if (
    clean.includes("warning") ||
    clean.includes("medium") ||
    clean.includes("watch") ||
    clean.includes("moderate")
  ) {
    return "orange";
  }

  if (
    clean.includes("positive") ||
    clean.includes("growth") ||
    clean.includes("up") ||
    clean.includes("healthy") ||
    clean.startsWith("+")
  ) {
    return "green";
  }

  return "blue";
}

function getTrendIcon(value) {
  const clean = normalize(value);
  if (clean.includes("down") || clean.includes("decrease") || clean.startsWith("-")) {
    return TrendingDown;
  }
  return TrendingUp;
}

function searchable(...parts) {
  return normalize(parts.filter(Boolean).join(" "));
}

export default function PredictiveInsights({
  snapshot = {},
  onRefresh,
  onInspectForecast,
  onInspectPrediction,
  onInspectOpportunity,
  onInspectRisk,
  onOpenModule,
}) {
  const [timeframe, setTimeframe] = useState("90");
  const [search, setSearch] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [refreshError, setRefreshError] = useState("");

  const scores = useMemo(() => safeArray(snapshot.scores || snapshot.students), [snapshot.scores, snapshot.students]);

  const currentBaseline = useMemo(() => {
    const applications = scores.filter((score) =>
      ["application started", "application submitted", "application under review"].includes(resolveJourneyStage(score))
    ).length;

    const offers = scores.filter((score) =>
      ["offer received", "offer accepted"].includes(resolveJourneyStage(score))
    ).length;

    const visa = scores.filter((score) =>
      ["visa pending", "visa rejected", "visa approved", "enrolled"].includes(resolveJourneyStage(score))
    ).length;

    const enrolled = scores.filter((score) =>
      ["visa approved", "enrolled"].includes(resolveJourneyStage(score))
    ).length;

    return {
      students: scores.length,
      applications,
      offers,
      visa,
      enrolled,
    };
  }, [scores]);

  const forecasts = useMemo(
    () =>
      pickTimedPayload(snapshot.forecasts, timeframe).map((item, index) => ({
        id: item?.id || `forecast-${index}`,
        title: resolveTitle(item, `Forecast ${index + 1}`),
        value: item?.value ?? item?.forecast ?? item?.projectedValue,
        change: item?.change ?? item?.growth ?? item?.delta,
        confidence: item?.confidence ?? item?.confidenceScore,
        currency: item?.currency || snapshot.currency || "GBP",
        unit: item?.unit || "",
        detail: resolveDetail(
          item,
          "No supporting forecasting explanation supplied."
        ),
        status: item?.status || "",
        source: item?.source || item?.module || "",
        raw: item,
      })),
    [snapshot.forecasts, snapshot.currency, timeframe]
  );

  const predictions = useMemo(
    () =>
      pickTimedPayload(snapshot.predictions, timeframe).map((item, index) => ({
        id: item?.id || `prediction-${index}`,
        title: resolveTitle(item, `Prediction ${index + 1}`),
        detail: resolveDetail(
          item,
          "No supporting prediction explanation supplied."
        ),
        confidence: item?.confidence ?? item?.confidenceScore,
        direction: item?.direction || item?.trend || item?.change || "",
        impact: item?.impact || item?.severity || "",
        source: item?.source || item?.module || "",
        raw: item,
      })),
    [snapshot.predictions, timeframe]
  );

  const opportunities = useMemo(
    () =>
      safeArray(snapshot.opportunities).map((item, index) => ({
        id: item?.id || `opportunity-${index}`,
        title: resolveTitle(item, `Opportunity ${index + 1}`),
        detail: resolveDetail(
          item,
          "No supporting opportunity explanation supplied."
        ),
        impact: typeof item === "string" ? "" : item?.impact || item?.priority || "",
        source: typeof item === "string" ? "" : item?.source || item?.module || "",
        raw: item,
      })),
    [snapshot.opportunities]
  );

  const risks = useMemo(
    () =>
      safeArray(snapshot.risks).map((item, index) => ({
        id: item?.id || `risk-${index}`,
        title: resolveTitle(item, `Forecast risk ${index + 1}`),
        detail: resolveDetail(
          item,
          "No supporting risk explanation supplied."
        ),
        severity: typeof item === "string" ? "Watch" : item?.severity || item?.priority || item?.level || "Watch",
        source: typeof item === "string" ? "" : item?.source || item?.module || "",
        raw: item,
      })),
    [snapshot.risks]
  );

  const assumptions = useMemo(
    () =>
      safeArray(snapshot.assumptions).map((item, index) => ({
        id: item?.id || `assumption-${index}`,
        title: resolveTitle(item, `Assumption ${index + 1}`),
        detail: resolveDetail(item, "No assumption detail supplied."),
        source: typeof item === "string" ? "" : item?.source || "",
      })),
    [snapshot.assumptions]
  );

  const query = normalize(search);

  const visibleForecasts = useMemo(
    () =>
      forecasts.filter((item) =>
        searchable(
          item.title,
          item.detail,
          item.status,
          item.source,
          item.change,
          item.unit
        ).includes(query)
      ),
    [forecasts, query]
  );

  const visiblePredictions = useMemo(
    () =>
      predictions.filter((item) =>
        searchable(
          item.title,
          item.detail,
          item.direction,
          item.impact,
          item.source
        ).includes(query)
      ),
    [predictions, query]
  );

  const visibleOpportunities = useMemo(
    () =>
      opportunities.filter((item) =>
        searchable(item.title, item.detail, item.impact, item.source).includes(query)
      ),
    [opportunities, query]
  );

  const visibleRisks = useMemo(
    () =>
      risks.filter((item) =>
        searchable(item.title, item.detail, item.severity, item.source).includes(query)
      ),
    [risks, query]
  );

  const hasForecastSource = forecasts.length > 0;
  const hasPredictionSource = predictions.length > 0;

  const confidenceValues = forecasts
    .filter((item) => hasValue(item.confidence))
    .map((item) => safeNumber(item.confidence))
    .filter((value) => Number.isFinite(value));

  const averageConfidence = confidenceValues.length
    ? Math.round(
        confidenceValues.reduce((sum, value) => sum + value, 0) /
          confidenceValues.length
      )
    : null;

  const dataCoverageChecks = [
    scores.length > 0,
    forecasts.length > 0,
    predictions.length > 0,
    opportunities.length > 0,
    risks.length > 0,
    assumptions.length > 0,
  ];

  const connectedInputs = dataCoverageChecks.filter(Boolean).length;
  const dataCoverage = Math.round(
    (connectedInputs / dataCoverageChecks.length) * 100
  );

  const sourceLabel =
    safeText(snapshot.sourceLabel).trim() || "Predictive snapshot";

  const updatedAt =
    snapshot.generatedAt || snapshot.updatedAt || snapshot.lastUpdated || null;

  const hasRefresh = typeof onRefresh === "function";
  const canInspectForecast = typeof onInspectForecast === "function";
  const canInspectPrediction = typeof onInspectPrediction === "function";
  const canInspectOpportunity = typeof onInspectOpportunity === "function";
  const canInspectRisk = typeof onInspectRisk === "function";

  const clearSearch = () => setSearch("");

  const handleRefresh = async () => {
    if (!hasRefresh || refreshing) return;

    setRefreshing(true);
    setRefreshError("");

    try {
      await onRefresh();
    } catch (error) {
      console.error("Predictive Insights refresh failed:", error);
      setRefreshError(
        error?.message || "Predictive Insights could not refresh."
      );
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <section className="space-y-4 p-3 sm:space-y-5 sm:p-5">
      <AICommandModuleNav
        activeModule="predictive-insights"
        onOpenModule={onOpenModule}
      />

      <header className="overflow-hidden rounded-[2rem] border-[3px] border-[#F97316] bg-[#FFFDF8] shadow-[0_22px_55px_rgba(15,35,63,0.12)]">
        <div className="grid xl:grid-cols-[minmax(0,1.42fr)_minmax(340px,0.58fr)]">
          <div className="bg-[#123865] p-5 text-white sm:p-7 lg:p-8">
            <div className="flex flex-wrap items-center gap-2">
              <HeaderChip icon={LineChart} label="Predictive Insights" />
              <HeaderChip icon={ShieldCheck} label="Evidence First" />
              <HeaderChip icon={Database} label={sourceLabel} />
            </div>

            <div className="mt-4 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
              <div className="max-w-4xl">
                <h1 className="text-3xl font-black tracking-[-0.04em] text-white sm:text-4xl">
                  Forecasting & Predictive Intelligence
                </h1>

                <p className="mt-2 text-sm font-semibold leading-6 text-white/90 sm:text-[15px]">
                  Separate current portfolio reality from true forecasts. Zaifan
                  only displays projected outcomes when a real forecasting
                  source supplies the value, horizon and confidence.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:min-w-[440px]">
                <DarkMetric label="Forecasts" value={forecasts.length} />
                <DarkMetric label="Predictions" value={predictions.length} />
                <DarkMetric label="Opportunities" value={opportunities.length} />
                <DarkMetric label="Risks" value={risks.length} />
              </div>
            </div>
          </div>

          <div className="border-t-[3px] border-[#F97316] bg-[#FF5A0A] p-5 text-white xl:border-l-[3px] xl:border-t-0 sm:p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <CircleGauge size={18} />
                  <p className="text-[9px] font-black uppercase tracking-[0.12em] text-white">
                    Forecast input coverage
                  </p>
                </div>

                <p className="mt-3 text-5xl font-black leading-none text-white">
                  {dataCoverage}%
                </p>

                <p className="mt-2 text-xs font-black uppercase tracking-[0.09em] text-white">
                  {dataCoverage >= 80
                    ? "Strong evidence"
                    : dataCoverage >= 40
                      ? "Partial evidence"
                      : "Limited evidence"}
                </p>
              </div>

              <span className="flex h-12 w-12 items-center justify-center rounded-2xl border-2 border-white/30 bg-white/10">
                <BarChart3 size={22} />
              </span>
            </div>

            <div className="mt-5 rounded-2xl border-2 border-white/30 bg-white/15 p-4">
              <div className="flex items-center justify-between gap-3">
                <span className="text-[9px] font-black uppercase tracking-[0.1em] text-white">
                  Average supplied confidence
                </span>
                <strong className="text-sm font-black text-white">
                  {averageConfidence === null
                    ? "—"
                    : `${averageConfidence}%`}
                </strong>
              </div>

              <p className="mt-2 text-[10px] font-semibold leading-4 text-white/85">
                Confidence is never estimated by this UI. It only averages
                confidence values explicitly supplied by the forecast source.
              </p>
            </div>
          </div>
        </div>

        <div className="border-t-[3px] border-[#F97316] bg-[#FFF8EF] p-4 sm:p-5">
          <div className="grid gap-3 xl:grid-cols-[auto_minmax(320px,1fr)_auto]">
            <div className="flex max-w-full items-center gap-2 overflow-x-auto pb-1">
              {TIMEFRAMES.map((item) => (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => setTimeframe(item.value)}
                  aria-pressed={timeframe === item.value}
                  className={`min-h-12 shrink-0 rounded-xl border-2 px-4 text-xs font-black transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300 ${
                    timeframe === item.value
                      ? "border-[#123865] bg-[#123865] text-white"
                      : "border-[#C9D7E6] bg-white text-[#10233F] hover:border-[#F97316] hover:bg-[#FFF4EA]"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            <div className="relative">
              <Search
                size={17}
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
              />

              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search forecasts, predictions, opportunities or risks..."
                aria-label="Search predictive intelligence"
                className="min-h-12 w-full rounded-xl border-2 border-[#C9D7E6] bg-white py-2.5 pl-11 pr-11 text-sm font-semibold text-[#10233F] outline-none transition placeholder:text-slate-400 focus:border-[#F97316] focus:ring-4 focus:ring-orange-100"
              />

              {search ? (
                <button
                  type="button"
                  onClick={clearSearch}
                  aria-label="Clear predictive search"
                  className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-[#123865] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400"
                >
                  <X size={16} />
                </button>
              ) : null}
            </div>

            <button
              type="button"
              onClick={() => void handleRefresh()}
              disabled={!hasRefresh || refreshing}
              title={
                hasRefresh
                  ? "Refresh predictive intelligence"
                  : "No refresh handler is connected"
              }
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border-2 border-[#FF5A0A] bg-[#FF5A0A] px-5 text-xs font-black text-white transition hover:bg-[#E94F00] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-orange-200 disabled:cursor-not-allowed disabled:border-[#C9D7E6] disabled:bg-slate-200 disabled:text-slate-500"
            >
              <RefreshCw
                size={15}
                className={refreshing ? "animate-spin" : ""}
              />
              {refreshing
                ? "Refreshing..."
                : hasRefresh
                  ? "Refresh Forecasts"
                  : "Refresh Not Connected"}
            </button>
          </div>

          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-[10px] font-bold text-slate-600">
            <StatusMeta
              icon={CalendarDays}
              label={`${TIMEFRAMES.find((item) => item.value === timeframe)?.label || timeframe} horizon`}
            />
            <StatusMeta icon={Clock3} label={formatTimestamp(updatedAt)} />
          </div>
        </div>
      </header>

      {refreshError ? (
        <InlineNotice
          tone="red"
          icon={XCircle}
          title="Predictive refresh failed"
          detail={refreshError}
          actionLabel="Dismiss"
          onAction={() => setRefreshError("")}
        />
      ) : null}

      {!hasRefresh ? (
        <InlineNotice
          tone="blue"
          icon={Info}
          title="Refresh is intentionally disabled"
          detail="No onRefresh handler is connected. Predictive Insights will never pretend that static forecast data has refreshed."
        />
      ) : null}

      <section className="rounded-[1.75rem] border-[3px] border-[#234E78] bg-[#FFFDF8] p-4 shadow-[0_12px_30px_rgba(23,36,61,0.06)] sm:p-5">
        <SectionIntro
          eyebrow="Reality Check"
          title="Current portfolio baseline"
          description="These are current observed portfolio counts derived from loaded executive scores. They are not forecasts."
          badge={scores.length ? `${scores.length} scored records` : "No score baseline"}
        />

        <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <BaselineCard
            label="Students"
            value={scores.length ? formatCount(currentBaseline.students) : "—"}
            icon={Users}
          />
          <BaselineCard
            label="Applications"
            value={scores.length ? formatCount(currentBaseline.applications) : "—"}
            icon={FileText}
          />
          <BaselineCard
            label="Offers"
            value={scores.length ? formatCount(currentBaseline.offers) : "—"}
            icon={GraduationCap}
          />
          <BaselineCard
            label="Visa Watch"
            value={scores.length ? formatCount(currentBaseline.visa) : "—"}
            icon={Target}
          />
          <BaselineCard
            label="Approved / Enrolled"
            value={scores.length ? formatCount(currentBaseline.enrolled) : "—"}
            icon={CheckCircle2}
          />
        </div>
      </section>

      <section className="overflow-hidden rounded-[1.75rem] border-[3px] border-[#234E78] bg-[#FFFDF8] shadow-[0_18px_42px_rgba(23,36,61,0.08)]">
        <SectionHeader
          eyebrow="Forecast Engine"
          title="Supplied Forecast Outputs"
          description={`Only real ${TIMEFRAMES.find((item) => item.value === timeframe)?.label || timeframe} forecast outputs are shown.`}
          icon={LineChart}
          count={visibleForecasts.length}
        />

        <div className="p-4 sm:p-5">
          {!hasForecastSource ? (
            <ForecastUnavailableState timeframe={timeframe} />
          ) : visibleForecasts.length ? (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              {visibleForecasts.map((item) => (
                <ForecastCard
                  key={item.id}
                  item={item}
                  canInspect={canInspectForecast}
                  onInspect={() => onInspectForecast(item.raw ?? item)}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              title="No forecasts match this search"
              text="The forecast source is connected, but the current search hides every forecast."
              onClear={clearSearch}
            />
          )}
        </div>
      </section>

      <div className="grid gap-4 xl:grid-cols-[1.18fr_0.82fr]">
        <section className="overflow-hidden rounded-[1.75rem] border-[3px] border-[#234E78] bg-[#FFFDF8]">
          <SectionHeader
            eyebrow="Prediction Evidence"
            title="Forecast Predictions"
            description="Prediction statements remain unavailable until a forecasting source supplies them."
            icon={TrendingUp}
            count={visiblePredictions.length}
          />

          <div className="p-4">
            {!hasPredictionSource ? (
              <EmptyState
                title="No prediction engine output connected"
                text="Connect snapshot.predictions to show evidence-backed predictive statements and confidence."
              />
            ) : visiblePredictions.length ? (
              <div className="space-y-3">
                {visiblePredictions.map((item) => (
                  <PredictionCard
                    key={item.id}
                    item={item}
                    canInspect={canInspectPrediction}
                    onInspect={() => onInspectPrediction(item.raw ?? item)}
                  />
                ))}
              </div>
            ) : (
              <EmptyState
                title="No predictions match this search"
                text="Try another search term."
                onClear={clearSearch}
              />
            )}
          </div>
        </section>

        <div className="space-y-4">
          <InsightList
            tone="green"
            eyebrow="Strategic Upside"
            title="Opportunities"
            icon={Target}
            items={visibleOpportunities}
            emptyTitle="No predictive opportunities connected"
            canInspect={canInspectOpportunity}
            onInspect={(item) => onInspectOpportunity(item.raw ?? item)}
            query={query}
            onClear={clearSearch}
          />

          <InsightList
            tone="red"
            eyebrow="Forecast Pressure"
            title="Key Risks"
            icon={AlertTriangle}
            items={visibleRisks}
            emptyTitle="No predictive risks connected"
            canInspect={canInspectRisk}
            onInspect={(item) => onInspectRisk(item.raw ?? item)}
            query={query}
            onClear={clearSearch}
          />
        </div>
      </div>

      <section className="overflow-hidden rounded-[1.75rem] border-[3px] border-[#F97316] bg-[#FFF8EF] shadow-[0_16px_38px_rgba(249,115,22,0.08)]">
        <SectionHeader
          eyebrow="Forecast Governance"
          title="Assumptions & Confidence"
          description="Forecasting should expose assumptions, evidence and uncertainty—not just a confident-looking number."
          icon={ShieldCheck}
          count={assumptions.length}
        />

        <div className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-3">
          <GovernanceCard
            icon={Database}
            label="Forecast Source"
            value={forecasts.length ? sourceLabel : "Not connected"}
            detail="The source responsible for the current forecast payload."
          />
          <GovernanceCard
            icon={CircleGauge}
            label="Confidence Coverage"
            value={
              forecasts.length
                ? `${confidenceValues.length}/${forecasts.length}`
                : "0/0"
            }
            detail="Forecast records that explicitly provide confidence."
          />
          <GovernanceCard
            icon={CalendarDays}
            label="Active Horizon"
            value={
              TIMEFRAMES.find((item) => item.value === timeframe)?.label ||
              `${timeframe} days`
            }
            detail="The selected forecast horizon for this workspace."
          />
        </div>

        <div className="border-t-2 border-orange-200 p-4">
          {assumptions.length ? (
            <div className="grid gap-3 md:grid-cols-2">
              {assumptions.map((item, index) => (
                <div
                  key={item.id}
                  className="rounded-xl border-2 border-[#C9D7E6] bg-white p-4"
                >
                  <div className="flex items-start gap-3">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border-2 border-[#F97316] bg-[#FFF4EA] text-xs font-black text-[#B84F0E]">
                      {index + 1}
                    </span>
                    <div>
                      <p className="font-black text-[#10233F]">{item.title}</p>
                      <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">
                        {item.detail}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              title="No forecasting assumptions supplied"
              text="Predictions are easier to trust when the forecasting source exposes its assumptions and limitations."
            />
          )}
        </div>
      </section>

      <footer className="grid gap-3 lg:grid-cols-3">
        <div className="rounded-[1.35rem] border-[3px] border-[#234E78] bg-[#F2F7FF] p-4 shadow-[0_10px_24px_rgba(18,56,101,0.07)]">
          <div className="flex items-start gap-3">
            <ShieldCheck
              size={18}
              className="mt-0.5 shrink-0 text-[#123865]"
            />
            <div>
              <p className="font-black text-[#10233F]">
                Forecast integrity
              </p>
              <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">
                This component no longer invents enrollment, revenue,
                applications, offers, visa approval rates or growth percentages.
                Current portfolio counts are separated from actual forecast
                outputs.
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-[1.35rem] border-[3px] border-[#F97316] bg-[#FFF4EA] p-4 shadow-[0_10px_24px_rgba(249,115,22,0.08)]">
          <div className="flex items-start gap-3">
            <Brain
              size={18}
              className="mt-0.5 shrink-0 text-[#B84F0E]"
            />
            <div>
              <p className="font-black text-[#10233F]">
                Decision support, not certainty
              </p>
              <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">
                Predictions should guide review and planning. They should never
                be presented as guaranteed admissions, revenue, visa or student
                outcomes.
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-[1.35rem] border-[3px] border-emerald-400 bg-emerald-50 p-4 shadow-[0_10px_24px_rgba(16,185,129,0.07)]">
          <div className="flex items-start gap-3">
            <Database
              size={18}
              className="mt-0.5 shrink-0 text-emerald-700"
            />
            <div>
              <p className="font-black text-[#10233F]">
                Source accountability
              </p>
              <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">
                Every displayed forecast remains tied to supplied source data,
                selected horizon, disclosed confidence and visible assumptions.
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

function StatusMeta({ icon: Icon, label }) {
  return (
    <span className="inline-flex min-h-8 items-center gap-1.5 rounded-lg border border-[#C9D7E6] bg-white px-2.5 py-1.5">
      <Icon size={12} className="shrink-0 text-[#123865]" />
      <span>{label}</span>
    </span>
  );
}

function SectionIntro({ eyebrow, title, description, badge }) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="text-[9px] font-black uppercase tracking-[0.13em] text-[#B84F0E]">
          {eyebrow}
        </p>
        <h2 className="mt-1 text-xl font-black text-[#10233F]">{title}</h2>
        <p className="mt-1 max-w-3xl text-xs font-semibold leading-5 text-slate-600">
          {description}
        </p>
      </div>

      <span className="w-fit rounded-lg border-2 border-[#234E78] bg-[#F2F7FF] px-3 py-2 text-[9px] font-black uppercase tracking-[0.08em] text-[#123865]">
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
    <div className="flex items-start justify-between gap-3 border-b-[3px] border-[#F97316] bg-[#123865] px-4 py-4 text-white sm:px-5">
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

function BaselineCard({ label, value, icon: Icon }) {
  return (
    <article className="rounded-[1.25rem] border-[3px] border-[#234E78] bg-[#F2F7FF] p-4 shadow-[0_9px_20px_rgba(18,56,101,0.06)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_14px_28px_rgba(18,56,101,0.10)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[9px] font-black uppercase tracking-[0.09em] text-[#123865]">
            {label}
          </p>
          <p className="mt-2 text-2xl font-black text-[#10233F]">{value}</p>
        </div>
        <span className="flex h-10 w-10 items-center justify-center rounded-xl border-2 border-[#234E78]/20 bg-white text-[#123865]">
          <Icon size={17} />
        </span>
      </div>
      <p className="mt-3 text-[9px] font-black uppercase tracking-[0.07em] text-slate-500">
        Current baseline
      </p>
    </article>
  );
}

function ForecastCard({ item, canInspect, onInspect }) {
  const tone = getTone(item.change || item.status);
  const TrendIcon = getTrendIcon(item.change || item.status);

  const formattedValue =
    normalize(item.unit).includes("currency") ||
    normalize(item.title).includes("revenue")
      ? formatMoney(item.value, item.currency)
      : hasValue(item.unit)
        ? `${formatCount(item.value)} ${item.unit}`
        : formatCount(item.value);

  return (
    <article
      className={`rounded-[1.3rem] border-[3px] bg-white p-4 shadow-[0_10px_24px_rgba(15,35,63,0.06)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_16px_32px_rgba(15,35,63,0.10)] ${outerBorder(
        tone
      )}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[9px] font-black uppercase tracking-[0.08em] text-slate-500">
            Forecast
          </p>
          <h3 className="mt-1 font-black text-[#10233F]">{item.title}</h3>
        </div>

        <span
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border-2 ${toneClass(
            tone
          )}`}
        >
          <TrendIcon size={17} />
        </span>
      </div>

      <p className="mt-4 break-words text-3xl font-black text-[#10233F]">
        {formattedValue}
      </p>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <MiniStat label="Change" value={hasValue(item.change) ? safeText(item.change) : "—"} />
        <MiniStat label="Confidence" value={formatPercent(item.confidence)} />
      </div>

      <p className="mt-3 text-xs font-semibold leading-5 text-slate-600">
        {item.detail}
      </p>

      {item.source ? <SourceBadge source={item.source} /> : null}

      {canInspect ? (
        <ActionButton label="Inspect Forecast" onClick={onInspect} />
      ) : null}
    </article>
  );
}

function PredictionCard({ item, canInspect, onInspect }) {
  const tone = getTone(item.impact || item.direction);

  return (
    <article
      className={`rounded-[1.2rem] border-[3px] bg-white p-4 shadow-[0_8px_20px_rgba(15,35,63,0.05)] ${outerBorder(
        tone
      )}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-black text-[#10233F]">{item.title}</p>
            {item.source ? <SourceBadge source={item.source} /> : null}
          </div>
          <p className="mt-2 text-xs font-semibold leading-5 text-slate-600">
            {item.detail}
          </p>
        </div>

        <span
          className={`shrink-0 rounded-lg border-2 px-2.5 py-1 text-[8px] font-black uppercase ${toneClass(
            tone
          )}`}
        >
          {formatPercent(item.confidence)}
        </span>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <MiniStat label="Direction" value={item.direction || "—"} />
        <MiniStat label="Impact" value={item.impact || "—"} />
      </div>

      {canInspect ? (
        <ActionButton label="Inspect Prediction" onClick={onInspect} />
      ) : null}
    </article>
  );
}

function InsightList({
  tone,
  eyebrow,
  title,
  icon: Icon,
  items,
  emptyTitle,
  canInspect,
  onInspect,
  query,
  onClear,
}) {
  return (
    <section
      className={`overflow-hidden rounded-[1.75rem] border-[3px] bg-[#FFFDF8] ${outerBorder(
        tone
      )}`}
    >
      <SectionHeader
        eyebrow={eyebrow}
        title={title}
        description="Only supplied intelligence is displayed."
        icon={Icon}
        count={items.length}
      />

      <div className="p-4">
        {items.length ? (
          <div className="space-y-3">
            {items.map((item) => (
              <article
                key={item.id}
                className={`rounded-xl border-2 bg-white p-4 ${outerBorder(
                  tone
                )}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-black text-[#10233F]">{item.title}</p>
                    <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">
                      {item.detail}
                    </p>
                  </div>

                  <Icon size={17} className={toneIconClass(tone)} />
                </div>

                {item.source ? <SourceBadge source={item.source} /> : null}

                {canInspect ? (
                  <ActionButton
                    label={`Inspect ${title === "Key Risks" ? "Risk" : "Opportunity"}`}
                    onClick={() => onInspect(item)}
                  />
                ) : null}
              </article>
            ))}
          </div>
        ) : (
          <EmptyState
            title={query ? `No ${title.toLowerCase()} match this search` : emptyTitle}
            text={
              query
                ? "Try another search term."
                : "This section stays empty until a real predictive source supplies intelligence."
            }
            onClear={query ? onClear : undefined}
          />
        )}
      </div>
    </section>
  );
}

function GovernanceCard({ icon: Icon, label, value, detail }) {
  return (
    <article className="rounded-xl border-2 border-[#C9D7E6] bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[9px] font-black uppercase tracking-[0.09em] text-slate-500">
            {label}
          </p>
          <p className="mt-1 break-words text-lg font-black text-[#10233F]">
            {value}
          </p>
        </div>

        <Icon size={17} className="shrink-0 text-[#123865]" />
      </div>

      <p className="mt-2 text-[10px] font-semibold leading-4 text-slate-600">
        {detail}
      </p>
    </article>
  );
}

function ForecastUnavailableState({ timeframe }) {
  const label =
    TIMEFRAMES.find((item) => item.value === timeframe)?.label ||
    `${timeframe} days`;

  return (
    <div className="rounded-[1.35rem] border-[3px] border-dashed border-[#F97316] bg-[#FFF4EA] p-6 text-center">
      <LineChart className="mx-auto text-[#B84F0E]" size={24} />
      <h3 className="mt-3 font-black text-[#10233F]">
        No {label} forecast source connected
      </h3>
      <p className="mx-auto mt-2 max-w-2xl text-xs font-semibold leading-5 text-slate-600">
        Current portfolio counts are available above, but this screen will not
        convert them into fake future outcomes. Connect a forecasting engine or
        historical model output through <code className="font-black">snapshot.forecasts</code>.
      </p>
    </div>
  );
}

function MiniStat({ label, value }) {
  return (
    <div className="min-w-0 rounded-lg border-2 border-[#E1E8F0] bg-[#F7FAFC] p-2.5">
      <p className="truncate text-[8px] font-black uppercase tracking-[0.07em] text-slate-500">
        {label}
      </p>
      <p className="mt-1 break-words text-xs font-black text-[#10233F]">
        {value}
      </p>
    </div>
  );
}

function SourceBadge({ source }) {
  return (
    <span className="mt-3 inline-flex max-w-full truncate rounded-md border border-[#C9D7E6] bg-[#F7FAFC] px-2 py-0.5 text-[8px] font-black uppercase tracking-[0.06em] text-slate-600">
      {source}
    </span>
  );
}

function ActionButton({ label, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="mt-3 inline-flex items-center gap-1.5 rounded-lg border-2 border-[#234E78] bg-white px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.07em] text-[#123865] transition hover:bg-[#123865] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300"
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

  const iconClass = tone === "red" ? "text-red-700" : "text-blue-700";

  return (
    <div className={`rounded-[1.25rem] border-[3px] p-4 ${classes}`}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <Icon className={`mt-0.5 shrink-0 ${iconClass}`} size={18} />
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
            className="shrink-0 rounded-lg border-2 border-[#C9D7E6] bg-white px-3 py-2 text-[9px] font-black uppercase tracking-[0.07em] text-[#10233F] transition hover:border-[#F97316] hover:bg-[#FFF4EA]"
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
    <div className="rounded-xl border-2 border-dashed border-[#C9D7E6] bg-[#F7FAFC] p-5 text-center">
      <Sparkles className="mx-auto text-orange-600" size={20} />
      <p className="mt-2 text-sm font-black text-[#10233F]">{title}</p>
      <p className="mx-auto mt-1 max-w-md text-xs font-semibold leading-5 text-slate-600">
        {text}
      </p>

      {onClear ? (
        <button
          type="button"
          onClick={onClear}
          className="mt-3 rounded-lg border-2 border-[#F97316] bg-white px-3 py-2 text-[9px] font-black uppercase tracking-[0.07em] text-[#B84F0E] transition hover:bg-[#FFF4EA]"
        >
          Clear search
        </button>
      ) : null}
    </div>
  );
}

function toneClass(tone = "blue") {
  if (tone === "red") return "border-red-400 bg-red-50 text-red-800";
  if (tone === "orange")
    return "border-[#F97316] bg-[#FFF4EA] text-[#B84F0E]";
  if (tone === "green")
    return "border-emerald-400 bg-emerald-50 text-emerald-800";
  return "border-blue-400 bg-blue-50 text-blue-800";
}

function outerBorder(tone = "blue") {
  if (tone === "red") return "border-red-400";
  if (tone === "orange") return "border-[#F97316]";
  if (tone === "green") return "border-emerald-400";
  return "border-[#234E78]";
}

function toneIconClass(tone = "blue") {
  if (tone === "red") return "text-red-700";
  if (tone === "orange") return "text-[#B84F0E]";
  if (tone === "green") return "text-emerald-700";
  return "text-[#123865]";
}
