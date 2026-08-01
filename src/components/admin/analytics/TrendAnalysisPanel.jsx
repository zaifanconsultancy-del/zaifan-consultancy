// TrendAnalysisPanel V4 PARTNER-OS ALIGNED — Zaifan Analytics OS
// Full replacement for:
// src/components/admin/analytics/TrendAnalysisPanel.jsx
//
// Production principles:
// - no hard-coded growth percentages
// - no fake trend direction
// - no fake country / revenue / agent opportunity claims
// - trend deltas require real current + previous period values
// - missing historical baseline = Trend unavailable
// - supports optional analytics.history / analytics.previousMetrics
// - unified Zaifan navy/orange/cream Analytics OS visual language
//
// Supported props:
// analytics = {
//   metrics?: {
//     students, applications, offers, visas, revenue,
//     applicationRate, offerRate, visaRate
//   },
//   previousMetrics?: {
//     students, applications, offers, visas, revenue,
//     applicationRate, offerRate, visaRate
//   },
//   history?: [
//     {
//       period,
//       students,
//       applications,
//       offers,
//       visas,
//       revenue,
//       applicationRate,
//       offerRate,
//       visaRate
//     }
//   ],
//   opportunitySignals?: [
//     { title, detail, impact?, source? }
//   ],
//   riskSignals?: [
//     { title, detail, severity?, source? }
//   ]
// }
// compact?: boolean

import React, { useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  CircleGauge,
  Clock3,
  Database,
  FileText,
  GraduationCap,
  Info,
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

const TREND_DEFINITIONS = [
  {
    key: "students",
    label: "Student Volume",
    icon: Users,
    tone: "blue",
    format: "number",
    detail: "Current student records compared with the previous supplied period.",
  },
  {
    key: "applications",
    label: "Application Volume",
    icon: FileText,
    tone: "navy",
    format: "number",
    detail: "Current application records compared with the previous supplied period.",
  },
  {
    key: "offers",
    label: "Offer Volume",
    icon: GraduationCap,
    tone: "green",
    format: "number",
    detail: "Current offer records compared with the previous supplied period.",
  },
  {
    key: "visas",
    label: "Visa Volume",
    icon: ShieldCheck,
    tone: "green",
    format: "number",
    detail: "Current visa records compared with the previous supplied period.",
  },
  {
    key: "revenue",
    label: "Connected Revenue",
    icon: WalletCards,
    tone: "orange",
    format: "money",
    detail: "Collected payment value compared with the previous supplied period.",
  },
  {
    key: "applicationRate",
    label: "Application Rate",
    icon: CircleGauge,
    tone: "navy",
    format: "percent",
    detail: "Student-to-application indicator compared with the previous period.",
  },
  {
    key: "offerRate",
    label: "Offer Rate",
    icon: Target,
    tone: "green",
    format: "percent",
    detail: "Application-to-offer indicator compared with the previous period.",
  },
  {
    key: "visaRate",
    label: "Visa Rate",
    icon: Activity,
    tone: "green",
    format: "percent",
    detail: "Offer-to-visa indicator compared with the previous period.",
  },
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

function formatValue(value, format) {
  if (!hasValue(value)) return "—";
  if (format === "money") return money(value);
  if (format === "percent") return `${Math.round(number(value))}%`;
  return number(value).toLocaleString("en-GB");
}

function calculateDelta(current, previous) {
  if (!hasValue(current) || !hasValue(previous)) return null;

  const currentNumber = number(current, NaN);
  const previousNumber = number(previous, NaN);

  if (
    !Number.isFinite(currentNumber) ||
    !Number.isFinite(previousNumber) ||
    previousNumber === 0
  ) {
    return null;
  }

  return ((currentNumber - previousNumber) / Math.abs(previousNumber)) * 100;
}

function deltaState(delta) {
  if (delta === null || !Number.isFinite(delta)) return "unknown";
  if (delta > 0) return "up";
  if (delta < 0) return "down";
  return "flat";
}

function resolvePreviousMetrics(analytics = {}) {
  if (analytics.previousMetrics && typeof analytics.previousMetrics === "object") {
    return analytics.previousMetrics;
  }

  const history = safeArray(analytics.history);

  if (history.length >= 2) {
    return history[history.length - 2] || {};
  }

  return {};
}

function resolveCurrentMetrics(analytics = {}) {
  const history = safeArray(analytics.history);

  if (history.length) {
    return {
      ...(analytics.metrics || {}),
      ...history[history.length - 1],
    };
  }

  return analytics.metrics || {};
}

function resolveTitle(item, fallback) {
  if (typeof item === "string") return item;
  return item?.title || item?.name || item?.label || fallback;
}

function resolveDetail(item, fallback) {
  if (typeof item === "string") return fallback;
  return item?.detail || item?.description || item?.message || fallback;
}

export default function TrendAnalysisPanel({
  analytics = {},
  compact = false,
}) {
  const [search, setSearch] = useState("");
  const [activeView, setActiveView] = useState("trends");

  const currentMetrics = useMemo(
    () => resolveCurrentMetrics(analytics),
    [analytics]
  );

  const previousMetrics = useMemo(
    () => resolvePreviousMetrics(analytics),
    [analytics]
  );

  const trends = useMemo(
    () =>
      TREND_DEFINITIONS.map((definition) => {
        const current = currentMetrics?.[definition.key];
        const previous = previousMetrics?.[definition.key];
        const delta = calculateDelta(current, previous);

        return {
          ...definition,
          current,
          previous,
          delta,
          state: deltaState(delta),
        };
      }),
    [currentMetrics, previousMetrics]
  );

  const opportunitySignals = useMemo(
    () =>
      safeArray(analytics.opportunitySignals).map((item, index) => ({
        id: item?.id || `opportunity-${index}`,
        title: resolveTitle(item, `Opportunity signal ${index + 1}`),
        detail: resolveDetail(item, "No opportunity detail supplied."),
        impact:
          typeof item === "string"
            ? ""
            : item?.impact || item?.priority || item?.severity || "",
        source:
          typeof item === "string"
            ? ""
            : item?.source || item?.module || "",
      })),
    [analytics.opportunitySignals]
  );

  const riskSignals = useMemo(
    () =>
      safeArray(analytics.riskSignals).map((item, index) => ({
        id: item?.id || `risk-${index}`,
        title: resolveTitle(item, `Risk signal ${index + 1}`),
        detail: resolveDetail(item, "No risk detail supplied."),
        severity:
          typeof item === "string"
            ? ""
            : item?.severity || item?.priority || item?.impact || "",
        source:
          typeof item === "string"
            ? ""
            : item?.source || item?.module || "",
      })),
    [analytics.riskSignals]
  );

  const history = useMemo(
    () => safeArray(analytics.history),
    [analytics.history]
  );

  const query = normalize(search);

  const visibleTrends = useMemo(
    () =>
      trends.filter((item) =>
        normalize(
          [
            item.label,
            item.detail,
            item.current,
            item.previous,
            item.state,
          ]
            .filter(Boolean)
            .join(" ")
        ).includes(query)
      ),
    [trends, query]
  );

  const visibleOpportunities = useMemo(
    () =>
      opportunitySignals.filter((item) =>
        normalize(
          [item.title, item.detail, item.impact, item.source]
            .filter(Boolean)
            .join(" ")
        ).includes(query)
      ),
    [opportunitySignals, query]
  );

  const visibleRisks = useMemo(
    () =>
      riskSignals.filter((item) =>
        normalize(
          [item.title, item.detail, item.severity, item.source]
            .filter(Boolean)
            .join(" ")
        ).includes(query)
      ),
    [riskSignals, query]
  );

  const comparableCount = trends.filter(
    (item) => item.delta !== null
  ).length;

  const improvingCount = trends.filter(
    (item) => item.state === "up"
  ).length;

  const decliningCount = trends.filter(
    (item) => item.state === "down"
  ).length;

  const flatCount = trends.filter(
    (item) => item.state === "flat"
  ).length;

  if (compact) {
    return (
      <section className="overflow-hidden rounded-[1.5rem] border-[3px] border-[#234E78] bg-[#FFFDF8]">
        <div className="flex items-center justify-between gap-3 border-b-[3px] border-[#F97316] bg-[#123865] px-4 py-3 text-white">
          <div>
            <p className="text-[8px] font-black uppercase tracking-[0.13em] text-orange-300">
              Analytics OS
            </p>
            <h2 className="mt-0.5 text-base font-black text-white">
              Trend Analysis
            </h2>
          </div>

          <TrendingUp size={18} />
        </div>

        <div className="grid gap-3 p-4 sm:grid-cols-2">
          {trends.slice(0, 4).map((item) => (
            <CompactTrend key={item.key} item={item} />
          ))}
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
              <HeaderChip icon={TrendingUp} label="Trend Analysis" />
              <HeaderChip icon={ShieldCheck} label="Historical Evidence" />
            </div>

            <h1 className="mt-4 text-2xl font-black tracking-[-0.025em] text-white sm:text-3xl">
              Trend Analysis Center
            </h1>

            <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-white/90">
              Compare current operating metrics with a real previous period.
              Trend direction stays unavailable when historical evidence is not
              supplied.
            </p>

            <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
              <DarkMetric label="Comparable" value={comparableCount} />
              <DarkMetric label="Improving" value={improvingCount} />
              <DarkMetric label="Declining" value={decliningCount} />
              <DarkMetric label="Flat" value={flatCount} />
            </div>
          </div>

          <div className="border-t-[3px] border-[#F97316] bg-[#FF5A0A] p-5 text-white xl:border-l-[3px] xl:border-t-0 sm:p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[9px] font-black uppercase tracking-[0.12em] text-white">
                  Historical coverage
                </p>
                <p className="mt-2 text-4xl font-black text-white">
                  {comparableCount}/{trends.length}
                </p>
                <p className="mt-1 text-xs font-black uppercase tracking-[0.08em] text-white">
                  metrics comparable
                </p>
              </div>

              <span className="flex h-12 w-12 items-center justify-center rounded-2xl border-2 border-white/30 bg-white/10">
                <BarChart3 size={22} />
              </span>
            </div>

            <div className="mt-5 rounded-2xl border-2 border-white/25 bg-white/10 p-3">
              <p className="text-xs font-black text-white">
                {history.length >= 2
                  ? `${history.length} historical periods connected`
                  : hasValue(Object.keys(previousMetrics).length)
                    ? "Previous-period metrics connected"
                    : "No historical baseline connected"}
              </p>

              <p className="mt-1 text-[10px] font-semibold leading-4 text-white/85">
                No +12%, +18%, +9% or +21% template growth values are generated
                inside this component.
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className="rounded-[1.45rem] border-[3px] border-[#234E78] bg-[#FFF8EF] p-3">
        <div className="grid gap-3 xl:grid-cols-[auto_minmax(260px,1fr)]">
          <div className="flex max-w-full gap-2 overflow-x-auto pb-1 xl:pb-0">
            {[
              ["trends", "Metric Trends"],
              ["history", "History"],
              ["opportunities", "Opportunities"],
              ["risks", "Risks"],
            ].map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setActiveView(key)}
                className={`min-h-12 shrink-0 rounded-xl border-2 px-4 text-[10px] font-black uppercase tracking-[0.06em] transition ${
                  activeView === key
                    ? "border-[#123865] bg-[#123865] text-white"
                    : "border-[#C9D7E6] bg-white text-[#10233F] hover:border-[#F97316] hover:bg-[#FFF4EA]"
                }`}
              >
                {label}
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
              placeholder="Search trends, history, opportunities or risks..."
              aria-label="Search Trend Analysis"
              className="min-h-12 w-full rounded-xl border-2 border-[#C9D7E6] bg-white py-2.5 pl-11 pr-11 text-sm font-semibold text-[#10233F] outline-none transition placeholder:text-slate-400 focus:border-[#F97316] focus:ring-4 focus:ring-orange-100"
            />

            {search ? (
              <button
                type="button"
                onClick={() => setSearch("")}
                aria-label="Clear trend search"
                className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-[#123865]"
              >
                <X size={16} />
              </button>
            ) : null}
          </div>
        </div>
      </div>

      {comparableCount === 0 ? (
        <div className="rounded-[1.35rem] border-[3px] border-blue-300 bg-blue-50 p-4">
          <div className="flex items-start gap-3">
            <Info
              size={18}
              className="mt-0.5 shrink-0 text-blue-700"
            />
            <div>
              <p className="font-black text-[#10233F]">
                Historical comparison is not connected yet
              </p>
              <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">
                Current values remain visible, but trend percentages stay
                unavailable until
                <code className="mx-1 rounded bg-white px-1 py-0.5 text-[10px] font-black text-[#123865]">
                  analytics.previousMetrics
                </code>
                or at least two
                <code className="mx-1 rounded bg-white px-1 py-0.5 text-[10px] font-black text-[#123865]">
                  analytics.history
                </code>
                periods are supplied.
              </p>
            </div>
          </div>
        </div>
      ) : null}

      {activeView === "trends" ? (
        <section className="overflow-hidden rounded-[1.65rem] border-[3px] border-[#234E78] bg-[#FFFDF8]">
          <SectionHeader
            eyebrow="Observed Movement"
            title="Metric Trend Comparison"
            description="Every percentage below is calculated from current versus previous supplied values."
            icon={TrendingUp}
            count={visibleTrends.length}
          />

          <div className="grid gap-3 p-4 sm:grid-cols-2 xl:grid-cols-4">
            {visibleTrends.length ? (
              visibleTrends.map((item) => (
                <TrendCard key={item.key} item={item} />
              ))
            ) : (
              <div className="sm:col-span-2 xl:col-span-4">
                <EmptyState
                  title="No trends match this search"
                  text="Try another search term."
                  onClear={() => setSearch("")}
                />
              </div>
            )}
          </div>
        </section>
      ) : null}

      {activeView === "history" ? (
        <HistoryWorkspace history={history} query={query} onClear={() => setSearch("")} />
      ) : null}

      {activeView === "opportunities" ? (
        <SignalWorkspace
          tone="green"
          eyebrow="Opportunity Signals"
          title="Evidence-Backed Opportunities"
          description="Opportunity statements only appear when supplied by the analytics layer."
          icon={Sparkles}
          items={visibleOpportunities}
          emptyTitle="No opportunity signals connected"
          emptyText="The old static claims about UK demand, visa conversion, revenue acceleration and agent expansion are removed."
          query={query}
          onClear={() => setSearch("")}
        />
      ) : null}

      {activeView === "risks" ? (
        <SignalWorkspace
          tone="red"
          eyebrow="Risk Signals"
          title="Evidence-Backed Risks"
          description="Risk statements only appear when supplied by the analytics layer."
          icon={AlertTriangle}
          items={visibleRisks}
          emptyTitle="No risk signals connected"
          emptyText="The component no longer invents counselor pressure, offer delays, seasonal spikes, compliance growth or support-volume risk."
          query={query}
          onClear={() => setSearch("")}
        />
      ) : null}

      <div className="grid gap-3 md:grid-cols-3">
        <GovernanceCard
          icon={Database}
          label="Current Period"
          value={
            Object.keys(currentMetrics).length
              ? "Connected"
              : "Unavailable"
          }
          detail="Current values used by the trend workspace."
        />
        <GovernanceCard
          icon={Clock3}
          label="Previous Period"
          value={
            Object.keys(previousMetrics).length
              ? "Connected"
              : "Unavailable"
          }
          detail="Required before trend direction or delta is calculated."
        />
        <GovernanceCard
          icon={ShieldCheck}
          label="Trend Integrity"
          value={comparableCount ? `${comparableCount} comparable` : "No comparison"}
          detail="Only metrics with both periods produce a trend percentage."
        />
      </div>
    </section>
  );
}

function TrendCard({ item }) {
  const Icon = item.icon;
  const DirectionIcon =
    item.state === "up"
      ? ArrowUpRight
      : item.state === "down"
        ? ArrowDownRight
        : Activity;

  const directionLabel =
    item.state === "up"
      ? "Increased"
      : item.state === "down"
        ? "Decreased"
        : item.state === "flat"
          ? "No change"
          : "Trend unavailable";

  return (
    <article className={`rounded-[1.35rem] border-[3px] p-4 ${toneClass(item.tone)}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[9px] font-black uppercase tracking-[0.08em] text-slate-500">
            {item.label}
          </p>
          <p className="mt-2 text-2xl font-black text-[#10233F]">
            {formatValue(item.current, item.format)}
          </p>
        </div>

        <span className="flex h-10 w-10 items-center justify-center rounded-xl border-2 border-current/20 bg-white/70 text-[#123865]">
          <Icon size={17} />
        </span>
      </div>

      <div className="mt-3 rounded-xl border-2 border-[#C9D7E6] bg-white/75 p-3">
        <div className="flex items-center justify-between gap-3">
          <span className="text-[9px] font-black uppercase tracking-[0.07em] text-slate-500">
            Previous
          </span>
          <span className="text-xs font-black text-[#10233F]">
            {formatValue(item.previous, item.format)}
          </span>
        </div>

        <div className="mt-2 flex items-center justify-between gap-3">
          <span className="text-[9px] font-black uppercase tracking-[0.07em] text-slate-500">
            Change
          </span>
          <span className={`inline-flex items-center gap-1 text-xs font-black ${deltaTextClass(item.state)}`}>
            <DirectionIcon size={13} />
            {item.delta === null
              ? "Unavailable"
              : `${item.delta > 0 ? "+" : ""}${item.delta.toFixed(1)}%`}
          </span>
        </div>
      </div>

      <p className="mt-3 text-[10px] font-semibold leading-4 text-slate-600">
        {item.detail}
      </p>

      <p className={`mt-3 text-[9px] font-black uppercase tracking-[0.07em] ${deltaTextClass(item.state)}`}>
        {directionLabel}
      </p>
    </article>
  );
}

function HistoryWorkspace({ history, query, onClear }) {
  const visible = history.filter((item) =>
    normalize(
      [
        item.period,
        item.students,
        item.applications,
        item.offers,
        item.visas,
        item.revenue,
      ]
        .filter(Boolean)
        .join(" ")
    ).includes(query)
  );

  return (
    <section className="overflow-hidden rounded-[1.65rem] border-[3px] border-[#234E78] bg-[#FFFDF8]">
      <SectionHeader
        eyebrow="Historical Context"
        title="Analytics History"
        description="Raw historical periods supplied to the trend engine."
        icon={BarChart3}
        count={visible.length}
      />

      <div className="p-4 sm:p-5">
        {!history.length ? (
          <EmptyState
            title="No historical periods connected"
            text="Supply analytics.history to compare more than one period and inspect change over time."
          />
        ) : visible.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[850px] border-separate border-spacing-0">
              <thead>
                <tr>
                  {[
                    "Period",
                    "Students",
                    "Applications",
                    "Offers",
                    "Visas",
                    "Revenue",
                  ].map((heading) => (
                    <th
                      key={heading}
                      className="border-b-2 border-[#C9D7E6] bg-[#F7F1E8] px-3 py-3 text-left text-[9px] font-black uppercase tracking-[0.08em] text-slate-600"
                    >
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {visible.map((item, index) => (
                  <tr key={item.id || item.period || index}>
                    <td className="border-b border-[#E1E8F0] px-3 py-3 font-black text-[#10233F]">
                      {item.period || `Period ${index + 1}`}
                    </td>
                    <td className="border-b border-[#E1E8F0] px-3 py-3 font-semibold text-[#10233F]">
                      {formatValue(item.students, "number")}
                    </td>
                    <td className="border-b border-[#E1E8F0] px-3 py-3 font-semibold text-[#10233F]">
                      {formatValue(item.applications, "number")}
                    </td>
                    <td className="border-b border-[#E1E8F0] px-3 py-3 font-semibold text-[#10233F]">
                      {formatValue(item.offers, "number")}
                    </td>
                    <td className="border-b border-[#E1E8F0] px-3 py-3 font-semibold text-[#10233F]">
                      {formatValue(item.visas, "number")}
                    </td>
                    <td className="border-b border-[#E1E8F0] px-3 py-3 font-semibold text-[#10233F]">
                      {formatValue(item.revenue, "money")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            title="No historical periods match this search"
            text="Try another search term."
            onClear={onClear}
          />
        )}
      </div>
    </section>
  );
}

function SignalWorkspace({
  tone,
  eyebrow,
  title,
  description,
  icon: Icon,
  items,
  emptyTitle,
  emptyText,
  query,
  onClear,
}) {
  return (
    <section className={`overflow-hidden rounded-[1.65rem] border-[3px] bg-[#FFFDF8] ${tone === "red" ? "border-red-400" : "border-emerald-400"}`}>
      <SectionHeader
        eyebrow={eyebrow}
        title={title}
        description={description}
        icon={Icon}
        count={items.length}
      />

      <div className="p-4 sm:p-5">
        {items.length ? (
          <div className="grid gap-3 md:grid-cols-2">
            {items.map((item) => (
              <article
                key={item.id}
                className={`rounded-xl border-2 bg-white p-4 ${
                  tone === "red" ? "border-red-300" : "border-emerald-300"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-black text-[#10233F]">{item.title}</p>
                    <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">
                      {item.detail}
                    </p>
                  </div>

                  <Icon
                    size={17}
                    className={tone === "red" ? "text-red-700" : "text-emerald-700"}
                  />
                </div>

                {(item.impact || item.severity || item.source) ? (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {item.impact ? <MetaChip label={`Impact: ${item.impact}`} /> : null}
                    {item.severity ? <MetaChip label={`Severity: ${item.severity}`} /> : null}
                    {item.source ? <MetaChip label={`Source: ${item.source}`} /> : null}
                  </div>
                ) : null}
              </article>
            ))}
          </div>
        ) : (
          <EmptyState
            title={query ? "No signals match this search" : emptyTitle}
            text={query ? "Try another search term." : emptyText}
            onClear={query ? onClear : undefined}
          />
        )}
      </div>
    </section>
  );
}

function GovernanceCard({ icon: Icon, label, value, detail }) {
  return (
    <article className="rounded-xl border-[3px] border-[#C9D7E6] bg-[#FFFDF8] p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[9px] font-black uppercase tracking-[0.08em] text-slate-500">
            {label}
          </p>
          <p className="mt-1 text-lg font-black text-[#10233F]">{value}</p>
        </div>

        <Icon size={17} className="text-[#123865]" />
      </div>

      <p className="mt-2 text-[10px] font-semibold leading-4 text-slate-600">
        {detail}
      </p>
    </article>
  );
}

function CompactTrend({ item }) {
  return (
    <div className="rounded-xl border-2 border-[#C9D7E6] bg-white p-3">
      <p className="text-[9px] font-black uppercase tracking-[0.07em] text-slate-500">
        {item.label}
      </p>
      <p className="mt-1 text-xl font-black text-[#10233F]">
        {formatValue(item.current, item.format)}
      </p>
      <p className={`mt-1 text-[9px] font-black ${deltaTextClass(item.state)}`}>
        {item.delta === null
          ? "Trend unavailable"
          : `${item.delta > 0 ? "+" : ""}${item.delta.toFixed(1)}%`}
      </p>
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
        {number(value).toLocaleString("en-GB")}
      </p>
    </div>
  );
}

function MetaChip({ label }) {
  return (
    <span className="rounded-md border border-[#C9D7E6] bg-slate-50 px-2 py-0.5 text-[8px] font-black text-slate-600">
      {label}
    </span>
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
  if (tone === "orange") return "border-[#F97316] bg-[#FFF4EA]";
  if (tone === "green") return "border-emerald-400 bg-emerald-50";
  if (tone === "blue") return "border-blue-400 bg-blue-50";
  return "border-[#C9D7E6] bg-[#FFFDF8]";
}

function deltaTextClass(state) {
  if (state === "up") return "text-emerald-700";
  if (state === "down") return "text-red-700";
  if (state === "flat") return "text-blue-700";
  return "text-slate-500";
}
