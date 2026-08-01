// CrossSystemIntelligence V4 PARTNER-OS ALIGNED — Zaifan AI Command OS
// Full replacement for:
// src/components/admin/ai-command/CrossSystemIntelligence.jsx
//
// Production goals:
// - remove all fabricated system health, signal counts, correlations and risk claims
// - use only parent-supplied cross-system intelligence
// - make Signals / Correlations / Risks genuinely different working views
// - keep missing integrations visibly unavailable instead of pretending everything is healthy
// - support real refresh / system-open / signal-inspect / correlation-inspect / risk-inspect handlers
// - share the same navy + orange + cream visual language as AICommandCenter + WorkflowIntelligence
// - responsive from mobile to wide Admin workspace
// - preserve safe rendering with no props
//
// Optional props:
// snapshot = {
//   systems: [
//     {
//       id,
//       name | label,
//       status,
//       health,
//       signals,
//       detail,
//       source,
//       updatedAt
//     }
//   ],
//   signals: [
//     {
//       id,
//       title | name,
//       impact,
//       insight | detail | description,
//       sourceSystem,
//       targetSystem,
//       category,
//       status,
//       confidence,
//       createdAt,
//       source
//     }
//   ],
//   correlations: [
//     {
//       id,
//       source,
//       target,
//       impact,
//       strength,
//       confidence,
//       direction,
//       detail,
//       status,
//       evidenceCount,
//       sourceLabel
//     }
//   ],
//   risks: [
//     {
//       id,
//       title | name,
//       detail | description,
//       severity,
//       sourceSystem,
//       targetSystem,
//       affected,
//       status,
//       source
//     }
//   ],
//   intelligenceSignals,
//   correlationCount,
//   riskSignals,
//   platformHealth,
//   updatedAt | generatedAt | lastUpdated,
//   sourceLabel
// }
//
// onRefresh?: async () => void
// onOpenSystem?: (system) => void
// onInspectSignal?: (signal) => void
// onInspectCorrelation?: (correlation) => void
// onInspectRisk?: (risk) => void

import React, { useMemo, useState } from "react";
import AICommandModuleNav from "./AICommandModuleNav";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Brain,
  CheckCircle2,
  ChevronRight,
  CircleGauge,
  Clock3,
  Database,
  Filter,
  GitBranch,
  Info,
  Link2,
  Network,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingDown,
  TrendingUp,
  Workflow,
  X,
  XCircle,
} from "lucide-react";

const VIEW_OPTIONS = [
  { id: "signals", label: "Signals", icon: Brain },
  { id: "correlations", label: "Correlations", icon: Link2 },
  { id: "risks", label: "Risks", icon: AlertTriangle },
];

const SIGNAL_FILTERS = [
  { id: "all", label: "All signals" },
  { id: "high", label: "High impact" },
  { id: "medium", label: "Medium" },
  { id: "low", label: "Low" },
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
  return Number.isFinite(parsed) ? parsed.toLocaleString("en-GB") : "—";
}

function formatPercent(value) {
  if (!hasValue(value)) return "—";
  const parsed = Number(value);
  return Number.isFinite(parsed) ? `${Math.round(parsed)}%` : "—";
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

function getSeverityTone(value = "") {
  const clean = normalize(value);

  if (
    clean.includes("critical") ||
    clean.includes("urgent") ||
    clean.includes("severe") ||
    clean.includes("high")
  ) {
    return "red";
  }

  if (
    clean.includes("medium") ||
    clean.includes("warning") ||
    clean.includes("watch") ||
    clean.includes("attention")
  ) {
    return "orange";
  }

  return "blue";
}

function getImpactTone(value = "") {
  const clean = normalize(value);

  if (
    clean.includes("critical") ||
    clean.includes("very high") ||
    clean === "high"
  ) {
    return "red";
  }

  if (clean.includes("medium") || clean.includes("moderate")) {
    return "orange";
  }

  if (
    clean.includes("positive") ||
    clean.includes("growth") ||
    clean.includes("opportunity")
  ) {
    return "green";
  }

  return "blue";
}

function getSystemState(system = {}) {
  const status = normalize(system.status);
  const health = hasValue(system.health) ? safeNumber(system.health) : null;

  if (
    status.includes("critical") ||
    status.includes("offline") ||
    status.includes("failed") ||
    status.includes("error") ||
    (health !== null && health < 60)
  ) {
    return "critical";
  }

  if (
    status.includes("warning") ||
    status.includes("degraded") ||
    status.includes("partial") ||
    status.includes("attention") ||
    (health !== null && health < 90)
  ) {
    return "warning";
  }

  if (
    status.includes("live") ||
    status.includes("healthy") ||
    status.includes("ready") ||
    status.includes("connected") ||
    status.includes("operational") ||
    (health !== null && health >= 90)
  ) {
    return "healthy";
  }

  return "unknown";
}

function resolveTitle(item, fallback) {
  if (typeof item === "string") return item;
  return item?.title || item?.name || item?.label || fallback;
}

function resolveDetail(item, fallback) {
  if (typeof item === "string") return fallback;

  return (
    item?.insight ||
    item?.detail ||
    item?.description ||
    item?.message ||
    fallback
  );
}

function searchable(...parts) {
  return normalize(parts.filter(Boolean).join(" "));
}

function isMatch(query, ...parts) {
  if (!query) return true;
  return searchable(...parts).includes(query);
}

function getDirectionState(value = "") {
  const clean = normalize(value);

  if (
    clean.includes("positive") ||
    clean.includes("up") ||
    clean.includes("increase") ||
    clean.startsWith("+")
  ) {
    return "up";
  }

  if (
    clean.includes("negative") ||
    clean.includes("down") ||
    clean.includes("decrease") ||
    clean.startsWith("-")
  ) {
    return "down";
  }

  return "neutral";
}

export default function CrossSystemIntelligence({
  snapshot = {},
  onRefresh,
  onOpenSystem,
  onInspectSignal,
  onInspectCorrelation,
  onInspectRisk,
  onOpenModule,
}) {
  const [activeView, setActiveView] = useState("signals");
  const [search, setSearch] = useState("");
  const [signalFilter, setSignalFilter] = useState("all");
  const [refreshing, setRefreshing] = useState(false);
  const [refreshError, setRefreshError] = useState("");

  const systems = useMemo(
    () =>
      safeArray(snapshot.systems).map((item, index) => ({
        id: item?.id || `system-${index}`,
        name: item?.name || item?.label || `System ${index + 1}`,
        status: item?.status || "",
        health: item?.health,
        signals: item?.signals,
        detail:
          item?.detail ||
          item?.description ||
          "No system-health detail supplied.",
        source: item?.source || item?.module || "",
        updatedAt: item?.updatedAt || item?.updated_at || null,
        raw: item,
      })),
    [snapshot.systems]
  );

  const signals = useMemo(
    () =>
      safeArray(snapshot.signals || snapshot.intelligenceFeed).map(
        (item, index) => ({
          id: item?.id || `signal-${index}`,
          title: resolveTitle(item, `Intelligence signal ${index + 1}`),
          impact:
            typeof item === "string"
              ? ""
              : item?.impact || item?.severity || item?.priority || "",
          insight: resolveDetail(
            item,
            "No supporting intelligence explanation supplied."
          ),
          sourceSystem:
            typeof item === "string"
              ? ""
              : item?.sourceSystem ||
                item?.source_system ||
                item?.system ||
                "",
          targetSystem:
            typeof item === "string"
              ? ""
              : item?.targetSystem || item?.target_system || "",
          category:
            typeof item === "string" ? "" : item?.category || item?.type || "",
          status:
            typeof item === "string" ? "" : item?.status || item?.state || "",
          confidence:
            typeof item === "string"
              ? undefined
              : item?.confidence ?? item?.confidenceScore,
          createdAt:
            typeof item === "string"
              ? null
              : item?.createdAt || item?.created_at || null,
          source:
            typeof item === "string"
              ? ""
              : item?.source || item?.module || "",
          raw: item,
        })
      ),
    [snapshot.signals, snapshot.intelligenceFeed]
  );

  const correlations = useMemo(
    () =>
      safeArray(snapshot.correlations).map((item, index) => ({
        id: item?.id || `correlation-${index}`,
        source:
          item?.source ||
          item?.sourceSystem ||
          item?.source_system ||
          "Unknown source",
        target:
          item?.target ||
          item?.targetSystem ||
          item?.target_system ||
          "Unknown target",
        impact: item?.impact,
        strength: item?.strength,
        confidence: item?.confidence,
        direction: item?.direction || item?.trend || item?.impact || "",
        detail:
          item?.detail ||
          item?.description ||
          "No supporting correlation explanation supplied.",
        status: item?.status || "",
        evidenceCount: item?.evidenceCount ?? item?.evidence_count,
        sourceLabel: item?.sourceLabel || item?.source_label || item?.module || "",
        raw: item,
      })),
    [snapshot.correlations]
  );

  const risks = useMemo(
    () =>
      safeArray(snapshot.risks).map((item, index) => ({
        id: item?.id || `risk-${index}`,
        title: resolveTitle(item, `Cross-system risk ${index + 1}`),
        detail: resolveDetail(
          item,
          "No supporting cross-system risk explanation supplied."
        ),
        severity:
          typeof item === "string"
            ? "Watch"
            : item?.severity || item?.priority || item?.level || "Watch",
        sourceSystem:
          typeof item === "string"
            ? ""
            : item?.sourceSystem || item?.source_system || "",
        targetSystem:
          typeof item === "string"
            ? ""
            : item?.targetSystem || item?.target_system || "",
        affected:
          typeof item === "string"
            ? undefined
            : item?.affected ?? item?.count ?? item?.items,
        status:
          typeof item === "string" ? "" : item?.status || item?.state || "",
        source:
          typeof item === "string"
            ? ""
            : item?.source || item?.module || "",
        raw: item,
      })),
    [snapshot.risks]
  );

  const calculated = useMemo(() => {
    const signalCountFromSystems = systems
      .filter((system) => hasValue(system.signals))
      .reduce((sum, system) => sum + safeNumber(system.signals), 0);

    const healthValues = systems
      .filter((system) => hasValue(system.health))
      .map((system) => safeNumber(system.health))
      .filter((value) => Number.isFinite(value));

    const healthAverage = healthValues.length
      ? Math.round(
          healthValues.reduce((sum, value) => sum + value, 0) /
            healthValues.length
        )
      : undefined;

    return {
      signalCountFromSystems,
      hasSystemSignals: systems.some((system) => hasValue(system.signals)),
      healthAverage,
      hasSystemHealth: healthValues.length > 0,
      criticalSystems: systems.filter(
        (system) => getSystemState(system) === "critical"
      ).length,
      warningSystems: systems.filter(
        (system) => getSystemState(system) === "warning"
      ).length,
      connectedSystems: systems.filter(
        (system) => getSystemState(system) !== "unknown"
      ).length,
    };
  }, [systems]);

  const headlineMetrics = useMemo(
    () => [
      {
        label: "Intelligence Signals",
        value: hasValue(snapshot.intelligenceSignals)
          ? formatCount(snapshot.intelligenceSignals)
          : signals.length
            ? formatCount(signals.length)
            : calculated.hasSystemSignals
              ? formatCount(calculated.signalCountFromSystems)
              : "—",
        connected:
          hasValue(snapshot.intelligenceSignals) ||
          signals.length > 0 ||
          calculated.hasSystemSignals,
        derived:
          !hasValue(snapshot.intelligenceSignals) &&
          (signals.length > 0 || calculated.hasSystemSignals),
        icon: Brain,
        tone: "blue",
        detail: hasValue(snapshot.intelligenceSignals)
          ? "Signal count supplied by the connected intelligence source."
          : signals.length
            ? "Derived from supplied intelligence signal records."
            : calculated.hasSystemSignals
              ? "Derived from supplied system signal counts."
              : "No intelligence-signal data is connected.",
      },
      {
        label: "Correlations",
        value: hasValue(snapshot.correlationCount)
          ? formatCount(snapshot.correlationCount)
          : correlations.length
            ? formatCount(correlations.length)
            : "—",
        connected:
          hasValue(snapshot.correlationCount) || correlations.length > 0,
        derived:
          !hasValue(snapshot.correlationCount) && correlations.length > 0,
        icon: Link2,
        tone: "green",
        detail: hasValue(snapshot.correlationCount)
          ? "Correlation count supplied by the connected source."
          : correlations.length
            ? "Derived from supplied correlation records."
            : "No correlation records are connected.",
      },
      {
        label: "Risk Signals",
        value: hasValue(snapshot.riskSignals)
          ? formatCount(snapshot.riskSignals)
          : risks.length
            ? formatCount(risks.length)
            : "—",
        connected: hasValue(snapshot.riskSignals) || risks.length > 0,
        derived: !hasValue(snapshot.riskSignals) && risks.length > 0,
        icon: AlertTriangle,
        tone: "red",
        detail: hasValue(snapshot.riskSignals)
          ? "Risk count supplied by the connected source."
          : risks.length
            ? "Derived from supplied cross-system risk records."
            : "No cross-system risk intelligence is connected.",
      },
      {
        label: "Platform Health",
        value: hasValue(snapshot.platformHealth)
          ? formatPercent(snapshot.platformHealth)
          : calculated.hasSystemHealth
            ? formatPercent(calculated.healthAverage)
            : "—",
        connected:
          hasValue(snapshot.platformHealth) || calculated.hasSystemHealth,
        derived:
          !hasValue(snapshot.platformHealth) && calculated.hasSystemHealth,
        icon: ShieldCheck,
        tone: "navy",
        detail: hasValue(snapshot.platformHealth)
          ? "Platform health supplied by the connected source."
          : calculated.hasSystemHealth
            ? "Average derived only from supplied system-health values."
            : "No platform-health source is connected.",
      },
    ],
    [
      snapshot.intelligenceSignals,
      snapshot.correlationCount,
      snapshot.riskSignals,
      snapshot.platformHealth,
      signals.length,
      correlations.length,
      risks.length,
      calculated,
    ]
  );

  const query = normalize(search);

  const filteredSystems = useMemo(
    () =>
      systems.filter((system) =>
        isMatch(
          query,
          system.name,
          system.status,
          system.detail,
          system.source
        )
      ),
    [systems, query]
  );

  const filteredSignals = useMemo(
    () =>
      signals.filter((signal) => {
        const impact = normalize(signal.impact);

        const matchesFilter =
          signalFilter === "all" ||
          (signalFilter === "high" &&
            (impact.includes("high") || impact.includes("critical"))) ||
          (signalFilter === "medium" &&
            (impact.includes("medium") || impact.includes("moderate"))) ||
          (signalFilter === "low" &&
            (impact.includes("low") || impact.includes("minor")));

        if (!matchesFilter) return false;

        return isMatch(
          query,
          signal.title,
          signal.insight,
          signal.impact,
          signal.sourceSystem,
          signal.targetSystem,
          signal.category,
          signal.status,
          signal.source
        );
      }),
    [signals, query, signalFilter]
  );

  const filteredCorrelations = useMemo(
    () =>
      correlations.filter((item) =>
        isMatch(
          query,
          item.source,
          item.target,
          item.impact,
          item.strength,
          item.direction,
          item.detail,
          item.status,
          item.sourceLabel
        )
      ),
    [correlations, query]
  );

  const filteredRisks = useMemo(
    () =>
      risks.filter((risk) =>
        isMatch(
          query,
          risk.title,
          risk.detail,
          risk.severity,
          risk.sourceSystem,
          risk.targetSystem,
          risk.status,
          risk.source
        )
      ),
    [risks, query]
  );

  const systemCoverage = systems.length
    ? Math.round((calculated.connectedSystems / systems.length) * 100)
    : 0;

  const criticalRiskCount = risks.filter(
    (risk) => getSeverityTone(risk.severity) === "red"
  ).length;

  const strongCorrelations = correlations.filter((item) => {
    const strength = safeNumber(item.strength, NaN);
    if (Number.isFinite(strength)) return strength >= 70;

    const clean = normalize(item.strength);
    return clean.includes("strong") || clean.includes("high");
  }).length;

  const crossSystemPressure = Math.min(
    100,
    calculated.criticalSystems * 25 +
      calculated.warningSystems * 10 +
      criticalRiskCount * 15
  );

  const updatedAt =
    snapshot.generatedAt || snapshot.updatedAt || snapshot.lastUpdated || null;

  const sourceLabel =
    safeText(snapshot.sourceLabel).trim() || "Cross-system snapshot";

  const hasRefresh = typeof onRefresh === "function";
  const hasSystemOpen = typeof onOpenSystem === "function";
  const hasSignalInspect = typeof onInspectSignal === "function";
  const hasCorrelationInspect = typeof onInspectCorrelation === "function";
  const hasRiskInspect = typeof onInspectRisk === "function";

  const visibleCount =
    activeView === "signals"
      ? filteredSignals.length
      : activeView === "correlations"
        ? filteredCorrelations.length
        : filteredRisks.length;

  const clearFilters = () => {
    setSearch("");
    setSignalFilter("all");
  };

  const handleRefresh = async () => {
    if (!hasRefresh || refreshing) return;

    setRefreshing(true);
    setRefreshError("");

    try {
      await onRefresh();
    } catch (error) {
      console.error("Cross-System Intelligence refresh failed:", error);
      setRefreshError(
        error?.message || "Cross-System Intelligence could not refresh."
      );
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <section className="space-y-4 p-3 sm:space-y-5 sm:p-5">
      <AICommandModuleNav activeModule="cross-system-intelligence" onOpenModule={onOpenModule} />
      <header className="overflow-hidden rounded-[1.9rem] border-[3px] border-[#F97316] bg-[#FFFDF8] shadow-[0_14px_38px_rgba(15,35,63,0.07)]">
        <div className="grid xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)]">
          <div className="bg-[#123865] p-5 text-white sm:p-7">
            <div className="flex flex-wrap items-center gap-2">
              <HeaderChip icon={Network} label="Cross-System Intelligence" />
              <HeaderChip icon={ShieldCheck} label="Human Controlled" />
              <HeaderChip icon={Database} label={sourceLabel} />
            </div>

            <div className="mt-4 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
              <div className="max-w-4xl">
                <h1 className="text-2xl font-black tracking-[-0.03em] text-white sm:text-3xl">
                  Cross-System Intelligence Network
                </h1>

                <p className="mt-2 text-sm font-semibold leading-6 text-white/90 sm:text-[15px]">
                  Connect operating signals across Zaifan systems, inspect real
                  relationships, surface cross-system risk and keep every
                  correlation evidence-based instead of decorative.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:min-w-[420px]">
                <DarkMetric label="Systems" value={systems.length} />
                <DarkMetric label="Signals" value={signals.length} />
                <DarkMetric label="Links" value={correlations.length} />
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
                    Derived network pressure
                  </p>
                </div>

                <p className="mt-3 text-5xl font-black leading-none text-white">
                  {systems.length || risks.length ? crossSystemPressure : "—"}
                </p>

                <p className="mt-2 text-xs font-black uppercase tracking-[0.09em] text-white">
                  {!systems.length && !risks.length
                    ? "No network payload"
                    : crossSystemPressure >= 70
                      ? "Intervention"
                      : crossSystemPressure >= 35
                        ? "Attention"
                        : "Stable"}
                </p>
              </div>

              <span className="flex h-12 w-12 items-center justify-center rounded-2xl border-2 border-white/30 bg-white/10">
                <GitBranch size={22} />
              </span>
            </div>

            <div className="mt-5 rounded-2xl border-2 border-white/25 bg-white/10 p-3">
              <div className="flex items-center justify-between gap-3">
                <span className="text-[9px] font-black uppercase tracking-[0.1em] text-white">
                  System-state coverage
                </span>

                <strong className="text-sm font-black text-white">
                  {systems.length
                    ? `${calculated.connectedSystems}/${systems.length}`
                    : "0/0"}
                </strong>
              </div>

              <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/20">
                <div
                  className="h-full rounded-full bg-white transition-[width] duration-300"
                  style={{ width: `${systemCoverage}%` }}
                />
              </div>

              <p className="mt-2 text-[10px] font-semibold leading-4 text-white/85">
                {systems.length
                  ? `${systemCoverage}% of supplied systems include a recognisable live, warning or critical state.`
                  : "No system status payload has been supplied yet."}
              </p>
            </div>
          </div>
        </div>

        <div className="border-t-[3px] border-[#F97316] bg-[#FFF8EF] p-3 sm:p-4">
          <div className="grid gap-3 xl:grid-cols-[auto_minmax(260px,1fr)_auto]">
            <div className="flex max-w-full items-center gap-2 overflow-x-auto pb-1">
              {VIEW_OPTIONS.map((option) => {
                const Icon = option.icon;

                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => setActiveView(option.id)}
                    aria-pressed={activeView === option.id}
                    className={`inline-flex min-h-12 shrink-0 items-center gap-2 rounded-xl border-2 px-4 text-xs font-black transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300 ${
                      activeView === option.id
                        ? "border-[#123865] bg-[#123865] text-white"
                        : "border-[#C9D7E6] bg-white text-[#10233F] hover:border-[#F97316] hover:bg-[#FFF4EA]"
                    }`}
                  >
                    <Icon size={14} />
                    {option.label}
                  </button>
                );
              })}
            </div>

            <div className="relative">
              <Search
                size={17}
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
              />

              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search systems, signals, correlations or risks..."
                aria-label="Search cross-system intelligence"
                className="min-h-12 w-full rounded-xl border-2 border-[#C9D7E6] bg-white py-2.5 pl-11 pr-11 text-sm font-semibold text-[#10233F] outline-none transition placeholder:text-slate-400 focus:border-[#F97316] focus:ring-4 focus:ring-orange-100"
              />

              {search ? (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  aria-label="Clear cross-system intelligence search"
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
                  ? "Refresh connected cross-system intelligence"
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
                  ? "Refresh Network"
                  : "Refresh Not Connected"}
            </button>
          </div>

          <div className="mt-3 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            {activeView === "signals" ? (
              <div className="flex max-w-full items-center gap-2 overflow-x-auto pb-1">
                <span className="flex shrink-0 items-center gap-1.5 rounded-lg border-2 border-[#234E78] bg-[#F2F7FF] px-3 py-2 text-[9px] font-black uppercase tracking-[0.08em] text-[#123865]">
                  <Filter size={12} />
                  Impact filter
                </span>

                {SIGNAL_FILTERS.map((filter) => (
                  <button
                    key={filter.id}
                    type="button"
                    onClick={() => setSignalFilter(filter.id)}
                    aria-pressed={signalFilter === filter.id}
                    className={`shrink-0 rounded-lg border-2 px-3 py-2 text-[10px] font-black transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300 ${
                      signalFilter === filter.id
                        ? "border-[#FF5A0A] bg-[#FF5A0A] text-white"
                        : "border-[#C9D7E6] bg-white text-[#10233F] hover:border-[#F97316] hover:bg-[#FFF4EA]"
                    }`}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="rounded-lg border-2 border-[#234E78] bg-[#F2F7FF] px-3 py-2 text-[9px] font-black uppercase tracking-[0.08em] text-[#123865]">
                  {activeView === "correlations"
                    ? "Relationship analysis"
                    : "Cross-system risk review"}
                </span>
              </div>
            )}

            <div className="flex flex-wrap items-center gap-2 text-[10px] font-bold text-slate-600">
              <StatusMeta icon={Clock3} label={formatTimestamp(updatedAt)} />
              <StatusMeta
                icon={Search}
                label={`${visibleCount} visible result${
                  visibleCount === 1 ? "" : "s"
                }`}
              />
            </div>
          </div>
        </div>
      </header>

      {refreshError ? (
        <InlineNotice
          tone="red"
          icon={XCircle}
          title="Cross-system refresh failed"
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
          detail="No onRefresh handler is connected. This screen will never pretend that static intelligence has refreshed."
        />
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {headlineMetrics.map((metric) => (
          <MetricCard key={metric.label} {...metric} />
        ))}
      </div>

      <section className="overflow-hidden rounded-[1.75rem] border-[3px] border-[#234E78] bg-[#FFFDF8] shadow-[0_12px_32px_rgba(23,36,61,0.06)]">
        <SectionHeader
          eyebrow="Enterprise Network"
          title="Connected System Signals"
          description="Every system card reflects only the health, status and signal values supplied by the parent."
          icon={Network}
          count={filteredSystems.length}
        />

        <div className="p-4 sm:p-5">
          {!systems.length ? (
            <EmptyState
              title="No systems connected"
              text="Supply snapshot.systems to turn this area into a live cross-system health network."
            />
          ) : filteredSystems.length ? (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {filteredSystems.map((system) => (
                <SystemCard
                  key={system.id}
                  system={system}
                  canOpen={hasSystemOpen}
                  onOpen={() => onOpenSystem(system.raw ?? system)}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              title="No systems match this search"
              text="Try another search term or clear the current view."
              onClear={clearFilters}
            />
          )}
        </div>
      </section>

      {activeView === "signals" ? (
        <SignalsView
          signals={filteredSignals}
          allSignals={signals}
          query={query}
          filter={signalFilter}
          canInspect={hasSignalInspect}
          onInspect={(signal) => onInspectSignal(signal.raw ?? signal)}
          onClear={clearFilters}
        />
      ) : null}

      {activeView === "correlations" ? (
        <CorrelationsView
          correlations={filteredCorrelations}
          allCorrelations={correlations}
          query={query}
          strongCorrelations={strongCorrelations}
          canInspect={hasCorrelationInspect}
          onInspect={(item) => onInspectCorrelation(item.raw ?? item)}
          onClear={clearFilters}
        />
      ) : null}

      {activeView === "risks" ? (
        <RisksView
          risks={filteredRisks}
          allRisks={risks}
          query={query}
          canInspect={hasRiskInspect}
          onInspect={(risk) => onInspectRisk(risk.raw ?? risk)}
          onClear={clearFilters}
        />
      ) : null}

      <div className="grid gap-3 lg:grid-cols-4">
        <ReadinessCard
          icon={Database}
          label="System Records"
          value={formatCount(systems.length)}
          detail="Systems explicitly supplied to this intelligence layer."
        />
        <ReadinessCard
          icon={Brain}
          label="Signal Records"
          value={formatCount(signals.length)}
          detail="Cross-system intelligence signals explicitly supplied."
        />
        <ReadinessCard
          icon={Link2}
          label="Correlation Records"
          value={formatCount(correlations.length)}
          detail="Relationships explicitly supplied for analysis."
        />
        <ReadinessCard
          icon={AlertTriangle}
          label="Critical Risks"
          value={formatCount(criticalRiskCount)}
          detail="High/critical risks derived only from supplied risk records."
        />
      </div>

      <footer className="grid gap-3 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-[1.35rem] border-[3px] border-[#234E78] bg-[#F2F7FF] p-4">
          <div className="flex items-start gap-3">
            <ShieldCheck
              className="mt-0.5 shrink-0 text-[#123865]"
              size={18}
            />

            <div>
              <p className="font-black text-[#10233F]">
                Cross-system intelligence integrity
              </p>

              <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">
                This component does not invent platform health, correlations,
                signal counts, future outcomes or risk. Derived values are
                explicitly labelled and use only supplied system, signal,
                correlation and risk records.
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-[1.35rem] border-[3px] border-[#F97316] bg-[#FFF4EA] p-4">
          <div className="flex items-start gap-3">
            <Network
              className="mt-0.5 shrink-0 text-[#B84F0E]"
              size={18}
            />

            <div>
              <p className="font-black text-[#10233F]">
                Human-controlled network actions
              </p>

              <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">
                Inspect and open actions only appear when their real parent
                handlers are connected. Intelligence remains advisory until a
                person chooses the operational action.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </section>
  );
}

function SignalsView({
  signals,
  allSignals,
  query,
  filter,
  canInspect,
  onInspect,
  onClear,
}) {
  return (
    <section className="overflow-hidden rounded-[1.75rem] border-[3px] border-[#F97316] bg-[#FFFDF8] shadow-[0_12px_32px_rgba(23,36,61,0.06)]">
      <SectionHeader
        eyebrow="Live Intelligence Feed"
        title="Cross-System Signals"
        description="Signals are only shown when explicitly supplied by a connected intelligence source."
        icon={Brain}
        count={signals.length}
      />

      <div className="p-4 sm:p-5">
        {!allSignals.length ? (
          <EmptyState
            title="No intelligence signals connected"
            text="Supply snapshot.signals to turn this area into a real cross-system intelligence feed."
          />
        ) : signals.length ? (
          <div className="grid gap-3 lg:grid-cols-2">
            {signals.map((signal) => (
              <SignalCard
                key={signal.id}
                signal={signal}
                canInspect={canInspect}
                onInspect={() => onInspect(signal)}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            title="No signals match this view"
            text={
              query
                ? "The current search or impact filter is hiding every supplied signal."
                : `No signals match the "${filter}" impact filter.`
            }
            onClear={onClear}
          />
        )}
      </div>
    </section>
  );
}

function CorrelationsView({
  correlations,
  allCorrelations,
  query,
  strongCorrelations,
  canInspect,
  onInspect,
  onClear,
}) {
  return (
    <section className="overflow-hidden rounded-[1.75rem] border-[3px] border-[#234E78] bg-[#FFFDF8] shadow-[0_12px_32px_rgba(23,36,61,0.06)]">
      <SectionHeader
        eyebrow="Relationship Analysis"
        title="Enterprise Correlation Map"
        description="Evidence-backed system relationships. No percentages or causal claims are created by this UI."
        icon={Link2}
        count={correlations.length}
      />

      <div className="p-4 sm:p-5">
        {!allCorrelations.length ? (
          <EmptyState
            title="No correlations connected"
            text="Supply snapshot.correlations to build the live cross-system relationship map."
          />
        ) : correlations.length ? (
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-3">
              <AnalysisCard
                icon={Link2}
                label="Visible Links"
                value={formatCount(correlations.length)}
                detail="Relationships included after the current search."
                tone="blue"
              />
              <AnalysisCard
                icon={TrendingUp}
                label="Strong Links"
                value={formatCount(strongCorrelations)}
                detail="Derived only where supplied strength clearly indicates high/strong."
                tone="green"
              />
              <AnalysisCard
                icon={Database}
                label="Evidence-backed"
                value={formatCount(
                  correlations.filter((item) =>
                    hasValue(item.evidenceCount)
                  ).length
                )}
                detail="Relationships that include an explicit evidence count."
                tone="orange"
              />
            </div>

            <div className="hidden overflow-x-auto lg:block">
              <table className="w-full min-w-[900px] border-separate border-spacing-0">
                <thead>
                  <tr>
                    {[
                      "Source",
                      "Connection",
                      "Target",
                      "Impact",
                      "Strength",
                      "Confidence",
                      "Evidence",
                      "",
                    ].map((heading) => (
                      <th
                        key={heading || "action"}
                        className="border-b-2 border-[#C9D7E6] bg-[#F7F1E8] px-3 py-3 text-left text-[9px] font-black uppercase tracking-[0.09em] text-slate-600"
                      >
                        {heading}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {correlations.map((item) => (
                    <CorrelationTableRow
                      key={item.id}
                      item={item}
                      canInspect={canInspect}
                      onInspect={() => onInspect(item)}
                    />
                  ))}
                </tbody>
              </table>
            </div>

            <div className="grid gap-3 lg:hidden">
              {correlations.map((item) => (
                <CorrelationMobileCard
                  key={item.id}
                  item={item}
                  canInspect={canInspect}
                  onInspect={() => onInspect(item)}
                />
              ))}
            </div>
          </div>
        ) : (
          <EmptyState
            title="No correlations match this search"
            text="Try another search term or reset the current view."
            onClear={onClear}
          />
        )}
      </div>
    </section>
  );
}

function RisksView({
  risks,
  allRisks,
  query,
  canInspect,
  onInspect,
  onClear,
}) {
  const critical = allRisks.filter(
    (risk) => getSeverityTone(risk.severity) === "red"
  ).length;

  const watch = allRisks.length - critical;

  return (
    <section className="overflow-hidden rounded-[1.75rem] border-[3px] border-red-400 bg-[#FFFDF8] shadow-[0_12px_32px_rgba(23,36,61,0.06)]">
      <SectionHeader
        eyebrow="Cross-System Risk"
        title="Risk Correlation Engine"
        description="Cross-system risks only appear when explicitly supplied by the connected intelligence layer."
        icon={AlertTriangle}
        count={risks.length}
      />

      <div className="p-4 sm:p-5">
        {!allRisks.length ? (
          <EmptyState
            title="No cross-system risks connected"
            text="No risk records were supplied. This UI does not fabricate risk to make the dashboard look active."
          />
        ) : risks.length ? (
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-3">
              <AnalysisCard
                icon={AlertTriangle}
                label="Critical / High"
                value={formatCount(critical)}
                detail="Derived from supplied risk severity labels."
                tone="red"
              />
              <AnalysisCard
                icon={Target}
                label="Watch / Other"
                value={formatCount(watch)}
                detail="Supplied risk records outside the critical/high group."
                tone="orange"
              />
              <AnalysisCard
                icon={Workflow}
                label="Visible Risks"
                value={formatCount(risks.length)}
                detail="Risks included after the current search."
                tone="blue"
              />
            </div>

            <div className="grid gap-3 lg:grid-cols-2">
              {risks.map((risk) => (
                <RiskCard
                  key={risk.id}
                  risk={risk}
                  canInspect={canInspect}
                  onInspect={() => onInspect(risk)}
                />
              ))}
            </div>
          </div>
        ) : (
          <EmptyState
            title="No risks match this search"
            text={
              query
                ? "The current search is hiding every supplied cross-system risk."
                : "No risks are visible in the current view."
            }
            onClear={onClear}
          />
        )}
      </div>
    </section>
  );
}

function SystemCard({ system, canOpen, onOpen }) {
  const state = getSystemState(system);

  const body = (
    <>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-black text-[#10233F]">{system.name}</h3>
            {system.source ? <SourceBadge source={system.source} /> : null}
          </div>

          <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">
            {system.detail}
          </p>
        </div>

        <SystemStateBadge state={state} status={system.status} />
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <MiniStat label="Health" value={formatPercent(system.health)} />
        <MiniStat label="Signals" value={formatCount(system.signals)} />
      </div>

      <div className="mt-3 flex items-center justify-between gap-3">
        <p className="text-[9px] font-black uppercase tracking-[0.07em] text-slate-500">
          {system.updatedAt
            ? `Updated ${formatTimestamp(system.updatedAt)}`
            : "No update time supplied"}
        </p>

        {canOpen ? (
          <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-[0.07em] text-[#123865]">
            Open
            <ArrowRight size={12} />
          </span>
        ) : null}
      </div>
    </>
  );

  if (canOpen) {
    return (
      <button
        type="button"
        onClick={onOpen}
        className={`w-full rounded-[1.2rem] border-[3px] p-4 text-left transition hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-orange-200 ${stateCardClass(
          state
        )}`}
      >
        {body}
      </button>
    );
  }

  return (
    <article
      className={`rounded-[1.2rem] border-[3px] p-4 ${stateCardClass(
        state
      )}`}
    >
      {body}
    </article>
  );
}

function SignalCard({ signal, canInspect, onInspect }) {
  const tone = getImpactTone(signal.impact);

  return (
    <article
      className={`rounded-[1.2rem] border-[3px] bg-white p-4 ${outerBorder(
        tone
      )}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-black text-[#10233F]">{signal.title}</p>
            {signal.source ? <SourceBadge source={signal.source} /> : null}
          </div>

          <p className="mt-2 text-xs font-semibold leading-5 text-slate-600">
            {signal.insight}
          </p>
        </div>

        {signal.impact ? (
          <span
            className={`shrink-0 rounded-lg border-2 px-2.5 py-1 text-[8px] font-black uppercase ${toneClass(
              tone
            )}`}
          >
            {signal.impact}
          </span>
        ) : null}
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <MiniStat
          label="Source System"
          value={signal.sourceSystem || "—"}
        />
        <MiniStat
          label="Target System"
          value={signal.targetSystem || "—"}
        />
        <MiniStat label="Category" value={signal.category || "—"} />
        <MiniStat
          label="Confidence"
          value={formatPercent(signal.confidence)}
        />
      </div>

      {canInspect ? (
        <div className="mt-3">
          <ActionButton label="Inspect Signal" onClick={onInspect} />
        </div>
      ) : (
        <p className="mt-3 text-[9px] font-black uppercase tracking-[0.07em] text-slate-400">
          Read-only intelligence signal
        </p>
      )}
    </article>
  );
}

function RiskCard({ risk, canInspect, onInspect }) {
  const tone = getSeverityTone(risk.severity);

  return (
    <article
      className={`rounded-[1.2rem] border-[3px] bg-white p-4 ${outerBorder(
        tone
      )}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-black text-[#10233F]">{risk.title}</p>
            {risk.source ? <SourceBadge source={risk.source} /> : null}
          </div>

          <p className="mt-2 text-xs font-semibold leading-5 text-slate-600">
            {risk.detail}
          </p>
        </div>

        <span
          className={`shrink-0 rounded-lg border-2 px-2.5 py-1 text-[8px] font-black uppercase ${toneClass(
            tone
          )}`}
        >
          {risk.severity}
        </span>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <MiniStat label="Source" value={risk.sourceSystem || "—"} />
        <MiniStat label="Target" value={risk.targetSystem || "—"} />
        <MiniStat label="Affected" value={formatCount(risk.affected)} />
        <MiniStat label="Status" value={risk.status || "—"} />
      </div>

      {canInspect ? (
        <div className="mt-3">
          <ActionButton label="Inspect Risk" onClick={onInspect} />
        </div>
      ) : null}
    </article>
  );
}

function CorrelationTableRow({ item, canInspect, onInspect }) {
  return (
    <tr>
      <td className="border-b border-[#E1E8F0] px-3 py-3 font-black text-[#10233F]">
        {item.source}
      </td>

      <td className="border-b border-[#E1E8F0] px-3 py-3">
        <div className="flex items-center gap-2 text-slate-500">
          <span className="h-px w-5 bg-slate-300" />
          <ChevronRight size={14} />
          <span className="h-px w-5 bg-slate-300" />
        </div>
      </td>

      <td className="border-b border-[#E1E8F0] px-3 py-3 font-black text-[#10233F]">
        {item.target}
      </td>

      <td className="border-b border-[#E1E8F0] px-3 py-3">
        <DirectionBadge value={item.impact || item.direction} />
      </td>

      <td className="border-b border-[#E1E8F0] px-3 py-3 font-bold text-[#10233F]">
        {hasValue(item.strength)
          ? typeof item.strength === "number"
            ? formatPercent(item.strength)
            : safeText(item.strength)
          : "—"}
      </td>

      <td className="border-b border-[#E1E8F0] px-3 py-3 font-bold text-[#10233F]">
        {formatPercent(item.confidence)}
      </td>

      <td className="border-b border-[#E1E8F0] px-3 py-3 font-bold text-[#10233F]">
        {formatCount(item.evidenceCount)}
      </td>

      <td className="border-b border-[#E1E8F0] px-3 py-3 text-right">
        {canInspect ? (
          <ActionButton label="Inspect" onClick={onInspect} />
        ) : (
          <span className="text-[9px] font-black uppercase tracking-[0.06em] text-slate-400">
            Read only
          </span>
        )}
      </td>
    </tr>
  );
}

function CorrelationMobileCard({ item, canInspect, onInspect }) {
  return (
    <article className="rounded-[1.2rem] border-[3px] border-[#234E78] bg-white p-4">
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
        <div className="min-w-0 rounded-lg border-2 border-[#E1E8F0] bg-[#F7FAFC] p-3">
          <p className="text-[8px] font-black uppercase tracking-[0.07em] text-slate-500">
            Source
          </p>
          <p className="mt-1 break-words text-xs font-black text-[#10233F]">
            {item.source}
          </p>
        </div>

        <ChevronRight size={18} className="text-orange-600" />

        <div className="min-w-0 rounded-lg border-2 border-[#E1E8F0] bg-[#F7FAFC] p-3">
          <p className="text-[8px] font-black uppercase tracking-[0.07em] text-slate-500">
            Target
          </p>
          <p className="mt-1 break-words text-xs font-black text-[#10233F]">
            {item.target}
          </p>
        </div>
      </div>

      <p className="mt-3 text-xs font-semibold leading-5 text-slate-600">
        {item.detail}
      </p>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <MiniStat
          label="Impact"
          value={hasValue(item.impact) ? safeText(item.impact) : "—"}
        />
        <MiniStat
          label="Strength"
          value={
            hasValue(item.strength)
              ? typeof item.strength === "number"
                ? formatPercent(item.strength)
                : safeText(item.strength)
              : "—"
          }
        />
        <MiniStat
          label="Confidence"
          value={formatPercent(item.confidence)}
        />
        <MiniStat
          label="Evidence"
          value={formatCount(item.evidenceCount)}
        />
      </div>

      {canInspect ? (
        <div className="mt-3">
          <ActionButton label="Inspect Correlation" onClick={onInspect} />
        </div>
      ) : null}
    </article>
  );
}

function MetricCard({
  label,
  value,
  detail,
  icon: Icon,
  tone = "navy",
  connected,
  derived,
}) {
  return (
    <article
      className={`relative overflow-hidden rounded-[1.4rem] border-[3px] p-4 shadow-[0_10px_28px_rgba(23,36,61,0.055)] sm:p-5 ${toneClass(
        connected ? tone : "muted"
      )}`}
    >
      <div
        className={`absolute inset-x-0 top-0 h-1.5 ${
          connected ? accentBar(tone) : "bg-slate-300"
        }`}
      />

      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[9px] font-black uppercase leading-4 tracking-[0.1em] text-[#10233F]">
            {label}
          </p>

          <p className="mt-3 break-words text-3xl font-black leading-none text-[#10233F]">
            {value}
          </p>
        </div>

        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border-2 border-current/20 bg-white/80">
          <Icon size={17} />
        </span>
      </div>

      <p className="mt-3 text-xs font-semibold leading-5 text-slate-600">
        {detail}
      </p>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span
          className={`text-[9px] font-black uppercase tracking-[0.08em] ${
            connected ? "text-emerald-800" : "text-slate-500"
          }`}
        >
          {connected
            ? derived
              ? "Derived from supplied data"
              : "Connected"
            : "Awaiting source"}
        </span>

        {derived ? (
          <span className="rounded-md border border-[#F97316] bg-white px-2 py-0.5 text-[8px] font-black uppercase text-[#B84F0E]">
            Calculated
          </span>
        ) : null}
      </div>
    </article>
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

function AnalysisCard({ icon: Icon, label, value, detail, tone }) {
  return (
    <div
      className={`rounded-[1.25rem] border-[3px] p-4 ${toneClass(tone)}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[9px] font-black uppercase tracking-[0.09em] text-[#10233F]">
            {label}
          </p>
          <p className="mt-2 text-2xl font-black text-[#10233F]">{value}</p>
        </div>

        <span className="flex h-9 w-9 items-center justify-center rounded-xl border-2 border-current/20 bg-white/80">
          <Icon size={16} />
        </span>
      </div>

      <p className="mt-2 text-[10px] font-semibold leading-4 text-slate-600">
        {detail}
      </p>
    </div>
  );
}

function ReadinessCard({ icon: Icon, label, value, detail }) {
  return (
    <div className="rounded-xl border-2 border-[#C9D7E6] bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[9px] font-black uppercase tracking-[0.09em] text-slate-500">
            {label}
          </p>

          <p className="mt-1 text-xl font-black text-[#10233F]">{value}</p>
        </div>

        <Icon size={17} className="shrink-0 text-[#123865]" />
      </div>

      <p className="mt-2 text-[10px] font-semibold leading-4 text-slate-600">
        {detail}
      </p>
    </div>
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

function SystemStateBadge({ state, status }) {
  const label =
    safeText(status).trim() ||
    (state === "healthy"
      ? "Healthy"
      : state === "warning"
        ? "Warning"
        : state === "critical"
          ? "Critical"
          : "Unknown");

  const classes =
    state === "healthy"
      ? "border-emerald-300 bg-emerald-50 text-emerald-800"
      : state === "warning"
        ? "border-[#F97316] bg-[#FFF4EA] text-[#B84F0E]"
        : state === "critical"
          ? "border-red-300 bg-red-50 text-red-800"
          : "border-[#C9D7E6] bg-[#F7FAFC] text-slate-600";

  return (
    <span
      className={`inline-flex max-w-[135px] truncate rounded-lg border-2 px-2.5 py-1 text-[8px] font-black uppercase ${classes}`}
    >
      {label}
    </span>
  );
}

function SourceBadge({ source }) {
  return (
    <span className="inline-flex max-w-full truncate rounded-md border border-[#C9D7E6] bg-[#F7FAFC] px-2 py-0.5 text-[8px] font-black uppercase tracking-[0.06em] text-slate-600">
      {source}
    </span>
  );
}

function DirectionBadge({ value }) {
  if (!hasValue(value)) {
    return (
      <span className="rounded-lg border-2 border-[#C9D7E6] bg-[#F7FAFC] px-2.5 py-1 text-[8px] font-black uppercase text-slate-600">
        —
      </span>
    );
  }

  const state = getDirectionState(value);

  if (state === "up") {
    return (
      <span className="inline-flex items-center gap-1 rounded-lg border-2 border-emerald-300 bg-emerald-50 px-2.5 py-1 text-[8px] font-black uppercase text-emerald-800">
        <TrendingUp size={11} />
        {safeText(value)}
      </span>
    );
  }

  if (state === "down") {
    return (
      <span className="inline-flex items-center gap-1 rounded-lg border-2 border-red-300 bg-red-50 px-2.5 py-1 text-[8px] font-black uppercase text-red-800">
        <TrendingDown size={11} />
        {safeText(value)}
      </span>
    );
  }

  return (
    <span className="rounded-lg border-2 border-blue-300 bg-blue-50 px-2.5 py-1 text-[8px] font-black uppercase text-blue-800">
      {safeText(value)}
    </span>
  );
}

function ActionButton({ label, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1.5 rounded-lg border-2 border-[#234E78] bg-white px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.07em] text-[#123865] transition hover:bg-[#123865] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300"
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
          Clear search & filters
        </button>
      ) : null}
    </div>
  );
}

function toneClass(tone = "navy") {
  if (tone === "red") return "border-red-400 bg-red-50 text-red-800";
  if (tone === "orange")
    return "border-[#F97316] bg-[#FFF4EA] text-[#B84F0E]";
  if (tone === "green")
    return "border-emerald-400 bg-emerald-50 text-emerald-800";
  if (tone === "blue") return "border-blue-400 bg-blue-50 text-blue-800";
  if (tone === "muted")
    return "border-[#C9D7E6] bg-[#F7FAFC] text-slate-500";

  return "border-[#234E78] bg-[#F2F7FF] text-[#123865]";
}

function outerBorder(tone = "navy") {
  if (tone === "red") return "border-red-400";
  if (tone === "orange") return "border-[#F97316]";
  if (tone === "green") return "border-emerald-400";
  if (tone === "blue") return "border-blue-400";

  return "border-[#234E78]";
}

function accentBar(tone = "navy") {
  if (tone === "red") return "bg-red-500";
  if (tone === "orange") return "bg-[#FF5A0A]";
  if (tone === "green") return "bg-emerald-500";
  if (tone === "blue") return "bg-blue-500";

  return "bg-[#123865]";
}

function stateCardClass(state) {
  if (state === "healthy")
    return "border-emerald-400 bg-emerald-50";
  if (state === "warning")
    return "border-[#F97316] bg-[#FFF4EA]";
  if (state === "critical") return "border-red-400 bg-red-50";

  return "border-[#C9D7E6] bg-[#F7FAFC]";
}
