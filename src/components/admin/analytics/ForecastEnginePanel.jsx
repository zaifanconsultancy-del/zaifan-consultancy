// ForecastEnginePanel V4 PARTNER-OS ALIGNED — Zaifan Analytics OS
// Full replacement for:
// src/components/admin/analytics/ForecastEnginePanel.jsx
//
// Production principles:
// - no arbitrary multipliers
// - no invented confidence percentages
// - no fake "active model" states
// - current baseline is separated from true forecast output
// - forecasts only appear when supplied
// - supports analytics.forecasts keyed by horizon or flat arrays
// - supports analytics.forecastAssumptions
// - unified Zaifan navy/orange/cream Analytics OS visual language
//
// Supported props:
// analytics = {
//   metrics?: {
//     students, applications, offers, visas, revenue,
//     applicationRate, offerRate, visaRate
//   },
//   forecasts?: [] | {
//     "30": [],
//     "90": [],
//     "180": [],
//     "365": []
//   },
//   forecastAssumptions?: [
//     { title, detail, source? }
//   ],
//   forecastSource?: string
// }
// compact?: boolean

import React, { useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  CircleGauge,
  Database,
  FileText,
  GraduationCap,
  Info,
  LineChart,
  Search,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingDown,
  TrendingUp,
  Users,
  WalletCards,
  X,
} from "lucide-react";

const HORIZONS = [
  { value: "30", label: "30 Days" },
  { value: "90", label: "90 Days" },
  { value: "180", label: "6 Months" },
  { value: "365", label: "12 Months" },
];

function safeArray(value) {
  return Array.isArray(value) ? value.filter(Boolean) : [];
}

function hasValue(value) {
  return value !== undefined && value !== null && value !== "";
}

function number(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function normalize(value = "") {
  return String(value)
    .toLowerCase()
    .trim()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ");
}

function money(value) {
  const amount = number(value);

  try {
    return new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency: "GBP",
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `£${amount.toLocaleString("en-GB")}`;
  }
}

function formatPercent(value) {
  if (!hasValue(value)) return "—";
  const parsed = Number(value);
  return Number.isFinite(parsed) ? `${Math.round(parsed)}%` : String(value);
}

function formatValue(value, format, unit) {
  if (!hasValue(value)) return "—";

  if (format === "money") return money(value);
  if (format === "percent") return formatPercent(value);

  const parsed = Number(value);
  const base = Number.isFinite(parsed)
    ? parsed.toLocaleString("en-GB")
    : String(value);

  return unit ? `${base} ${unit}` : base;
}

function pickForecasts(value, horizon) {
  if (Array.isArray(value)) {
    return value.filter((item) => {
      if (!item || typeof item !== "object") return true;

      const supplied =
        item.horizon ??
        item.horizonDays ??
        item.timeframe ??
        item.days;

      return !hasValue(supplied) || String(supplied) === String(horizon);
    });
  }

  if (value && typeof value === "object") {
    return safeArray(
      value[horizon] ||
      value[`${horizon}d`] ||
      value[Number(horizon)]
    );
  }

  return [];
}

function resolveTitle(item, fallback) {
  if (typeof item === "string") return item;
  return item?.title || item?.name || item?.label || item?.metric || fallback;
}

function resolveDetail(item, fallback) {
  if (typeof item === "string") return fallback;
  return item?.detail || item?.description || item?.note || item?.message || fallback;
}

function inferFormat(item) {
  const title = normalize(item?.title || item?.name || item?.label);
  const unit = normalize(item?.unit);

  if (
    unit.includes("currency") ||
    unit.includes("gbp") ||
    title.includes("revenue")
  ) {
    return "money";
  }

  if (unit.includes("%") || unit.includes("percent")) {
    return "percent";
  }

  return "number";
}

function getTone(value = "") {
  const clean = normalize(value);

  if (
    clean.includes("negative") ||
    clean.includes("down") ||
    clean.includes("decline") ||
    clean.startsWith("-")
  ) {
    return "red";
  }

  if (
    clean.includes("warning") ||
    clean.includes("moderate") ||
    clean.includes("medium")
  ) {
    return "orange";
  }

  if (
    clean.includes("positive") ||
    clean.includes("up") ||
    clean.includes("growth") ||
    clean.startsWith("+")
  ) {
    return "green";
  }

  return "navy";
}

function trendIcon(value = "") {
  const clean = normalize(value);

  if (
    clean.includes("down") ||
    clean.includes("decline") ||
    clean.startsWith("-")
  ) {
    return TrendingDown;
  }

  return TrendingUp;
}

export default function ForecastEnginePanel({
  analytics = {},
  compact = false,
}) {
  const [horizon, setHorizon] = useState("90");
  const [search, setSearch] = useState("");

  const metrics = analytics.metrics || {};

  const baseline = useMemo(
    () => [
      {
        key: "students",
        label: "Students",
        value: metrics.students,
        icon: Users,
        format: "number",
      },
      {
        key: "applications",
        label: "Applications",
        value: metrics.applications,
        icon: FileText,
        format: "number",
      },
      {
        key: "offers",
        label: "Offers",
        value: metrics.offers,
        icon: GraduationCap,
        format: "number",
      },
      {
        key: "visas",
        label: "Visas",
        value: metrics.visas,
        icon: ShieldCheck,
        format: "number",
      },
      {
        key: "revenue",
        label: "Connected Revenue",
        value: metrics.revenue,
        icon: WalletCards,
        format: "money",
      },
    ],
    [metrics]
  );

  const forecasts = useMemo(
    () =>
      pickForecasts(analytics.forecasts, horizon).map((item, index) => ({
        id: item?.id || `forecast-${index}`,
        title: resolveTitle(item, `Forecast ${index + 1}`),
        value:
          typeof item === "string"
            ? undefined
            : item?.value ?? item?.forecast ?? item?.projectedValue,
        baseline:
          typeof item === "string"
            ? undefined
            : item?.baseline ?? item?.current,
        change:
          typeof item === "string"
            ? ""
            : item?.change ?? item?.delta ?? item?.trend ?? "",
        confidence:
          typeof item === "string"
            ? undefined
            : item?.confidence ?? item?.confidenceScore,
        unit: typeof item === "string" ? "" : item?.unit || "",
        format: inferFormat(item),
        detail: resolveDetail(
          item,
          "No supporting forecast explanation supplied."
        ),
        source:
          typeof item === "string"
            ? ""
            : item?.source || item?.model || item?.module || "",
        raw: item,
      })),
    [analytics.forecasts, horizon]
  );

  const assumptions = useMemo(
    () =>
      safeArray(analytics.forecastAssumptions).map((item, index) => ({
        id: item?.id || `assumption-${index}`,
        title: resolveTitle(item, `Assumption ${index + 1}`),
        detail: resolveDetail(item, "No assumption detail supplied."),
        source:
          typeof item === "string"
            ? ""
            : item?.source || item?.module || "",
      })),
    [analytics.forecastAssumptions]
  );

  const query = normalize(search);

  const visibleForecasts = useMemo(
    () =>
      forecasts.filter((item) =>
        normalize(
          [
            item.title,
            item.detail,
            item.change,
            item.source,
            item.unit,
          ]
            .filter(Boolean)
            .join(" ")
        ).includes(query)
      ),
    [forecasts, query]
  );

  const confidenceValues = forecasts
    .filter((item) => hasValue(item.confidence))
    .map((item) => number(item.confidence, NaN))
    .filter((value) => Number.isFinite(value));

  const averageConfidence = confidenceValues.length
    ? Math.round(
        confidenceValues.reduce((sum, value) => sum + value, 0) /
          confidenceValues.length
      )
    : null;

  const sourceLabel =
    analytics.forecastSource ||
    analytics.sourceLabel ||
    "No forecast source connected";

  if (compact) {
    return (
      <section className="overflow-hidden rounded-[1.5rem] border-[3px] border-[#234E78] bg-[#FFFDF8]">
        <div className="flex items-center justify-between gap-3 border-b-[3px] border-[#F97316] bg-[#123865] px-4 py-3 text-white">
          <div>
            <p className="text-[8px] font-black uppercase tracking-[0.13em] text-orange-300">
              Analytics OS
            </p>
            <h2 className="mt-0.5 text-base font-black text-white">
              Forecast Engine
            </h2>
          </div>

          <LineChart size={18} />
        </div>

        <div className="grid gap-3 p-4 sm:grid-cols-2">
          {forecasts.length ? (
            forecasts.slice(0, 4).map((item) => (
              <CompactForecast key={item.id} item={item} />
            ))
          ) : (
            <div className="sm:col-span-2">
              <SmallEmpty text="No forecast output connected." />
            </div>
          )}
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-4 sm:space-y-5">
      <header className="overflow-hidden rounded-[1.9rem] border-[3px] border-[#F97316] bg-[#FFFDF8] shadow-[0_14px_38px_rgba(15,35,63,0.07)]">
        <div className="grid xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)]">
          <div className="bg-[#123865] p-5 text-white sm:p-6">
            <div className="flex flex-wrap items-center gap-2">
              <HeaderChip icon={LineChart} label="Forecast Engine" />
              <HeaderChip icon={ShieldCheck} label="Evidence First" />
            </div>

            <h1 className="mt-4 text-2xl font-black tracking-[-0.025em] text-white sm:text-3xl">
              Forecast Engine
            </h1>

            <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-white/90">
              Keep current Analytics OS baselines separate from real forecast
              outputs. No arbitrary growth multiplier or confidence percentage
              is created inside this component.
            </p>

            <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
              <DarkMetric label="Forecasts" value={forecasts.length} />
              <DarkMetric
                label="Confidence Values"
                value={confidenceValues.length}
              />
              <DarkMetric label="Assumptions" value={assumptions.length} />
              <DarkMetric label="Horizon" value={`${horizon}d`} />
            </div>
          </div>

          <div className="border-t-[3px] border-[#F97316] bg-[#FF5A0A] p-5 text-white xl:border-l-[3px] xl:border-t-0 sm:p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[9px] font-black uppercase tracking-[0.12em] text-white">
                  Forecast connection
                </p>

                <p className="mt-2 text-4xl font-black text-white">
                  {forecasts.length ? "LIVE" : "OFF"}
                </p>

                <p className="mt-1 text-xs font-black uppercase tracking-[0.08em] text-white">
                  {forecasts.length
                    ? "forecast payload present"
                    : "no forecast payload"}
                </p>
              </div>

              <span className="flex h-12 w-12 items-center justify-center rounded-2xl border-2 border-white/30 bg-white/10">
                <CircleGauge size={22} />
              </span>
            </div>

            <div className="mt-5 rounded-2xl border-2 border-white/25 bg-white/10 p-3">
              <p className="text-[9px] font-black uppercase tracking-[0.1em] text-white">
                Average supplied confidence
              </p>

              <p className="mt-2 text-xl font-black text-white">
                {averageConfidence === null ? "—" : `${averageConfidence}%`}
              </p>

              <p className="mt-1 text-[10px] font-semibold leading-4 text-white/85">
                Confidence is only averaged when the forecast source explicitly
                supplies it.
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className="rounded-[1.45rem] border-[3px] border-[#234E78] bg-[#FFF8EF] p-3">
        <div className="grid gap-3 xl:grid-cols-[auto_minmax(260px,1fr)]">
          <div className="flex max-w-full gap-2 overflow-x-auto pb-1 xl:pb-0">
            {HORIZONS.map((item) => (
              <button
                key={item.value}
                type="button"
                onClick={() => setHorizon(item.value)}
                className={`min-h-12 shrink-0 rounded-xl border-2 px-4 text-[10px] font-black uppercase tracking-[0.06em] transition ${
                  horizon === item.value
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
              placeholder="Search forecast outputs, assumptions or sources..."
              aria-label="Search Forecast Engine"
              className="min-h-12 w-full rounded-xl border-2 border-[#C9D7E6] bg-white py-2.5 pl-11 pr-11 text-sm font-semibold text-[#10233F] outline-none transition placeholder:text-slate-400 focus:border-[#F97316] focus:ring-4 focus:ring-orange-100"
            />

            {search ? (
              <button
                type="button"
                onClick={() => setSearch("")}
                aria-label="Clear forecast search"
                className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-[#123865]"
              >
                <X size={16} />
              </button>
            ) : null}
          </div>
        </div>
      </div>

      <section>
        <SectionIntro
          eyebrow="Current Reality"
          title="Analytics Baseline"
          description="These values describe the current connected operating snapshot. They are not forecasts."
          badge="Current baseline"
        />

        <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          {baseline.map((item) => (
            <BaselineCard key={item.key} item={item} />
          ))}
        </div>
      </section>

      <section className="overflow-hidden rounded-[1.65rem] border-[3px] border-[#234E78] bg-[#FFFDF8]">
        <SectionHeader
          eyebrow="Forecast Output"
          title={`${HORIZONS.find((item) => item.value === horizon)?.label || horizon} Forecasts`}
          description="Only explicitly supplied forecast records are displayed."
          icon={BarChart3}
          count={visibleForecasts.length}
        />

        <div className="p-4 sm:p-5">
          {!forecasts.length ? (
            <ForecastUnavailable
              horizon={horizon}
              sourceLabel={sourceLabel}
            />
          ) : visibleForecasts.length ? (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              {visibleForecasts.map((item) => (
                <ForecastCard key={item.id} item={item} />
              ))}
            </div>
          ) : (
            <EmptyState
              title="No forecasts match this search"
              text="Try another search term."
              onClear={() => setSearch("")}
            />
          )}
        </div>
      </section>

      <div className="grid gap-4 xl:grid-cols-[1fr_1fr]">
        <section className="overflow-hidden rounded-[1.65rem] border-[3px] border-[#F97316] bg-[#FFF8EF]">
          <SectionHeader
            eyebrow="Forecast Governance"
            title="Assumptions"
            description="Forecast assumptions should be visible before leadership relies on the output."
            icon={ShieldCheck}
            count={assumptions.length}
          />

          <div className="p-4">
            {assumptions.length ? (
              <div className="space-y-3">
                {assumptions.map((item, index) => (
                  <AssumptionCard key={item.id} item={item} index={index} />
                ))}
              </div>
            ) : (
              <EmptyState
                title="No forecast assumptions supplied"
                text="Connect analytics.forecastAssumptions so the forecast engine can expose its evidence and limitations."
              />
            )}
          </div>
        </section>

        <section className="overflow-hidden rounded-[1.65rem] border-[3px] border-[#234E78] bg-[#FFFDF8]">
          <SectionHeader
            eyebrow="Model Status"
            title="Forecast Readiness"
            description="Model status is based on actual forecast payload availability, not hard-coded Active/Planned labels."
            icon={Database}
            count={HORIZONS.length}
          />

          <div className="space-y-3 p-4">
            {HORIZONS.map((item) => {
              const count = pickForecasts(analytics.forecasts, item.value).length;

              return (
                <div
                  key={item.value}
                  className={`rounded-xl border-2 p-4 ${
                    count
                      ? "border-emerald-300 bg-emerald-50"
                      : "border-[#C9D7E6] bg-white"
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-black text-[#10233F]">{item.label}</p>
                      <p className="mt-1 text-[10px] font-semibold text-slate-500">
                        {count
                          ? `${count} forecast output${count === 1 ? "" : "s"} supplied`
                          : "No forecast output supplied"}
                      </p>
                    </div>

                    {count ? (
                      <CheckCircle2 size={18} className="text-emerald-700" />
                    ) : (
                      <Info size={18} className="text-slate-400" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>

      <footer className="grid gap-3 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-[1.35rem] border-[3px] border-[#C9D7E6] bg-[#FFFDF8] p-4">
          <div className="flex items-start gap-3">
            <ShieldCheck size={18} className="mt-0.5 shrink-0 text-[#123865]" />
            <div>
              <p className="font-black text-[#10233F]">
                Forecast integrity
              </p>
              <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">
                The old 15%, 18%, 22% and 25% projection multipliers and
                invented confidence values are completely removed.
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-[1.35rem] border-[3px] border-[#F97316] bg-[#FFF4EA] p-4">
          <div className="flex items-start gap-3">
            <LineChart size={18} className="mt-0.5 shrink-0 text-[#B84F0E]" />
            <div>
              <p className="font-black text-[#10233F]">
                Baseline ≠ forecast
              </p>
              <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">
                Current student, application, offer, visa and revenue values are
                never automatically converted into future outcomes.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </section>
  );
}

function BaselineCard({ item }) {
  const Icon = item.icon;

  return (
    <article className="rounded-[1.25rem] border-[3px] border-[#C9D7E6] bg-[#FFFDF8] p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[9px] font-black uppercase tracking-[0.08em] text-slate-500">
            {item.label}
          </p>
          <p className="mt-2 text-2xl font-black text-[#10233F]">
            {formatValue(item.value, item.format)}
          </p>
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

function ForecastCard({ item }) {
  const tone = getTone(item.change);
  const TrendIcon = trendIcon(item.change);

  return (
    <article className={`rounded-[1.35rem] border-[3px] p-4 ${toneClass(tone)}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[9px] font-black uppercase tracking-[0.08em] text-slate-500">
            Forecast
          </p>
          <h3 className="mt-1 text-sm font-black text-[#10233F]">
            {item.title}
          </h3>
        </div>

        <span className="flex h-10 w-10 items-center justify-center rounded-xl border-2 border-current/20 bg-white/70 text-[#123865]">
          <TrendIcon size={17} />
        </span>
      </div>

      <p className="mt-4 text-3xl font-black text-[#10233F]">
        {formatValue(item.value, item.format, item.unit)}
      </p>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <MiniStat
          label="Baseline"
          value={formatValue(item.baseline, item.format, item.unit)}
        />
        <MiniStat
          label="Confidence"
          value={formatPercent(item.confidence)}
        />
      </div>

      <div className="mt-2 rounded-lg border-2 border-[#E1E8F0] bg-white/70 p-2.5">
        <p className="text-[8px] font-black uppercase tracking-[0.07em] text-slate-500">
          Change
        </p>
        <p className="mt-1 text-xs font-black text-[#10233F]">
          {hasValue(item.change) ? String(item.change) : "—"}
        </p>
      </div>

      <p className="mt-3 text-[10px] font-semibold leading-4 text-slate-600">
        {item.detail}
      </p>

      {item.source ? (
        <span className="mt-3 inline-flex rounded-md border border-[#C9D7E6] bg-white px-2 py-0.5 text-[8px] font-black uppercase tracking-[0.06em] text-slate-600">
          {item.source}
        </span>
      ) : null}
    </article>
  );
}

function AssumptionCard({ item, index }) {
  return (
    <article className="rounded-xl border-2 border-[#F97316] bg-white p-4">
      <div className="flex items-start gap-3">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border-2 border-[#F97316] bg-[#FFF4EA] text-xs font-black text-[#B84F0E]">
          {index + 1}
        </span>

        <div>
          <p className="font-black text-[#10233F]">{item.title}</p>
          <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">
            {item.detail}
          </p>

          {item.source ? (
            <span className="mt-2 inline-flex rounded-md border border-[#C9D7E6] bg-slate-50 px-2 py-0.5 text-[8px] font-black uppercase tracking-[0.06em] text-slate-600">
              {item.source}
            </span>
          ) : null}
        </div>
      </div>
    </article>
  );
}

function ForecastUnavailable({ horizon, sourceLabel }) {
  const label =
    HORIZONS.find((item) => item.value === horizon)?.label ||
    `${horizon} days`;

  return (
    <div className="rounded-[1.35rem] border-[3px] border-dashed border-[#F97316] bg-[#FFF4EA] p-6 text-center">
      <LineChart size={24} className="mx-auto text-[#B84F0E]" />
      <p className="mt-3 text-base font-black text-[#10233F]">
        No {label} forecast output connected
      </p>
      <p className="mx-auto mt-2 max-w-2xl text-xs font-semibold leading-5 text-slate-600">
        Current Analytics OS baseline data is available, but it will not be
        multiplied into fake future outcomes. Forecast source: {sourceLabel}.
      </p>
    </div>
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

      <span className="w-fit rounded-lg border-2 border-[#C9D7E6] bg-[#FFFDF8] px-3 py-2 text-[9px] font-black uppercase tracking-[0.08em] text-[#123865]">
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
    <div className="flex items-start justify-between gap-3 border-b-[3px] border-[#F97316] bg-[#123865] px-4 py-4 text-white">
      <div>
        <p className="text-[9px] font-black uppercase tracking-[0.13em] text-orange-300">
          {eyebrow}
        </p>
        <h2 className="mt-1 text-lg font-black text-white">{title}</h2>
        <p className="mt-1 text-xs font-semibold leading-5 text-white/80">
          {description}
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        {hasValue(count) ? (
          <span className="rounded-lg border-2 border-white/20 bg-white/10 px-2.5 py-1 text-xs font-black text-white">
            {count}
          </span>
        ) : null}

        <span className="flex h-10 w-10 items-center justify-center rounded-xl border-2 border-white/20 bg-white/10">
          <Icon size={17} />
        </span>
      </div>
    </div>
  );
}

function HeaderChip({ icon: Icon, label }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border-2 border-white/20 bg-white/10 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.09em] text-white">
      <Icon size={11} />
      {label}
    </span>
  );
}

function DarkMetric({ label, value }) {
  return (
    <div className="rounded-xl border-2 border-white/20 bg-white/10 p-3">
      <p className="text-[8px] font-black uppercase tracking-[0.08em] text-white/85">
        {label}
      </p>
      <p className="mt-1 text-xl font-black text-white">
        {typeof value === "number"
          ? value.toLocaleString("en-GB")
          : value}
      </p>
    </div>
  );
}

function CompactForecast({ item }) {
  return (
    <article className="rounded-xl border-2 border-[#C9D7E6] bg-white p-3">
      <p className="text-[9px] font-black uppercase tracking-[0.07em] text-slate-500">
        {item.title}
      </p>
      <p className="mt-1 text-xl font-black text-[#10233F]">
        {formatValue(item.value, item.format, item.unit)}
      </p>
      <p className="mt-1 text-[9px] font-semibold text-slate-500">
        Confidence: {formatPercent(item.confidence)}
      </p>
    </article>
  );
}

function MiniStat({ label, value }) {
  return (
    <div className="rounded-lg border-2 border-[#E1E8F0] bg-white p-2.5">
      <p className="text-[8px] font-black uppercase tracking-[0.07em] text-slate-500">
        {label}
      </p>
      <p className="mt-1 break-words text-xs font-black text-[#10233F]">
        {value}
      </p>
    </div>
  );
}

function SmallEmpty({ text }) {
  return (
    <div className="rounded-xl border-2 border-dashed border-[#C9D7E6] bg-slate-50 p-4 text-center">
      <p className="text-xs font-semibold text-slate-600">{text}</p>
    </div>
  );
}

function EmptyState({ title, text, onClear }) {
  return (
    <div className="rounded-[1.25rem] border-2 border-dashed border-[#C9D7E6] bg-slate-50 p-6 text-center">
      <Info size={20} className="mx-auto text-orange-600" />
      <p className="mt-2 text-sm font-black text-[#10233F]">{title}</p>
      <p className="mx-auto mt-1 max-w-2xl text-xs font-semibold leading-5 text-slate-600">
        {text}
      </p>

      {onClear ? (
        <button
          type="button"
          onClick={onClear}
          className="mt-3 inline-flex items-center gap-1.5 rounded-lg border-2 border-[#F97316] bg-white px-3 py-2 text-[9px] font-black uppercase tracking-[0.07em] text-[#B84F0E] transition hover:bg-[#FFF4EA]"
        >
          Clear search
          <ArrowRight size={12} />
        </button>
      ) : null}
    </div>
  );
}

function toneClass(tone) {
  if (tone === "red") return "border-red-400 bg-red-50";
  if (tone === "orange") return "border-[#F97316] bg-[#FFF4EA]";
  if (tone === "green") return "border-emerald-400 bg-emerald-50";
  return "border-[#C9D7E6] bg-[#FFFDF8]";
}
