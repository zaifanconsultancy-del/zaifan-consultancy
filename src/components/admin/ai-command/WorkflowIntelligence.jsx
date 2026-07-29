// WorkflowIntelligence V3 EXTREME — Zaifan AI Command OS
// Full replacement for:
// src/components/admin/ai-command/WorkflowIntelligence.jsx
//
// Production goals:
// - remove fabricated workflow counts, percentages and recovery claims
// - use only parent-supplied workflow intelligence
// - keep missing integrations visibly unavailable instead of rendering fake zeroes
// - give Overview and Analytics genuinely different views
// - make Refresh real when onRefresh is supplied
// - expose real optional actions for stage inspection, bottleneck review and recovery work
// - share the same navy + orange + cream language as AICommandCenter V3
// - support mobile, tablet and wide Admin workspace layouts
// - provide useful loading/error/empty/search/filter states
// - preserve safe rendering when used with no props
//
// Optional props:
// snapshot = {
//   stages: [
//     {
//       id,
//       stage | name | label,
//       health,
//       active,
//       delayed,
//       completed,
//       blocked,
//       avgAgeHours,
//       targetHours,
//       owner,
//       status,
//       trend,
//       detail,
//       source
//     }
//   ],
//   bottlenecks: [
//     {
//       id,
//       workflow | title | name,
//       issue | detail | description,
//       severity,
//       affected,
//       ageHours,
//       owner,
//       source
//     }
//   ],
//   recoveryQueue: [
//     {
//       id,
//       title | name,
//       detail,
//       priority,
//       status,
//       owner,
//       createdAt,
//       source
//     }
//   ],
//   automationCoverage,
//   verificationCoverage,
//   activeAutomations,
//   recoverySuccess,
//   workflowHealth,
//   activeWorkflows,
//   delayedItems,
//   criticalIssues,
//   updatedAt | generatedAt | lastUpdated,
//   sourceLabel
// }
//
// onRefresh?: async () => void
// onInspectStage?: (stage) => void
// onInspectBottleneck?: (bottleneck) => void
// onOpenRecovery?: (recoveryItem) => void

import React, { useMemo, useState } from "react";
import AICommandModuleNav from "./AICommandModuleNav";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Brain,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  CircleGauge,
  Clock3,
  Database,
  Filter,
  Gauge,
  Info,
  ListFilter,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  Target,
  TimerReset,
  TrendingDown,
  TrendingUp,
  Workflow,
  X,
  XCircle,
  Zap,
} from "lucide-react";

const VIEW_OPTIONS = [
  { id: "overview", label: "Overview" },
  { id: "analytics", label: "Analytics" },
];

const STAGE_FILTERS = [
  { id: "all", label: "All stages" },
  { id: "healthy", label: "Healthy" },
  { id: "watch", label: "Watch" },
  { id: "critical", label: "Critical" },
  { id: "delayed", label: "Delayed" },
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

function formatHours(value) {
  if (!hasValue(value)) return "—";
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return "—";

  if (parsed < 24) return `${Math.round(parsed)}h`;

  const days = parsed / 24;
  return `${days >= 10 ? Math.round(days) : days.toFixed(1)}d`;
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
    clean.includes("severe")
  ) {
    return "red";
  }

  if (
    clean.includes("high") ||
    clean.includes("medium") ||
    clean.includes("warning") ||
    clean.includes("attention")
  ) {
    return "orange";
  }

  return "blue";
}

function getStageState(stage) {
  const status = normalize(stage?.status);
  const health = hasValue(stage?.health) ? safeNumber(stage.health) : null;
  const delayed = hasValue(stage?.delayed) ? safeNumber(stage.delayed) : null;
  const blocked = hasValue(stage?.blocked) ? safeNumber(stage.blocked) : null;

  if (
    status.includes("critical") ||
    status.includes("blocked") ||
    (health !== null && health < 70) ||
    (blocked !== null && blocked > 0)
  ) {
    return "critical";
  }

  if (
    status.includes("warning") ||
    status.includes("watch") ||
    status.includes("delayed") ||
    (health !== null && health < 90) ||
    (delayed !== null && delayed > 0)
  ) {
    return "watch";
  }

  if (
    status.includes("healthy") ||
    status.includes("ready") ||
    status.includes("stable") ||
    (health !== null && health >= 90)
  ) {
    return "healthy";
  }

  return "unknown";
}

function getTrendState(value) {
  if (!hasValue(value)) return "neutral";

  if (typeof value === "number") {
    if (value > 0) return "up";
    if (value < 0) return "down";
    return "neutral";
  }

  const clean = normalize(value);

  if (
    clean.includes("up") ||
    clean.includes("increase") ||
    clean.includes("improving") ||
    clean.startsWith("+")
  ) {
    return "up";
  }

  if (
    clean.includes("down") ||
    clean.includes("decrease") ||
    clean.includes("declining") ||
    clean.startsWith("-")
  ) {
    return "down";
  }

  return "neutral";
}

function resolveStageName(item, index) {
  return (
    item?.stage ||
    item?.name ||
    item?.label ||
    `Workflow stage ${index + 1}`
  );
}

function resolveTitle(item, fallback) {
  if (typeof item === "string") return item;
  return item?.title || item?.name || item?.workflow || fallback;
}

function resolveDetail(item, fallback) {
  if (typeof item === "string") return fallback;
  return (
    item?.detail ||
    item?.description ||
    item?.issue ||
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

export default function WorkflowIntelligence({
  snapshot = {},
  onRefresh,
  onInspectStage,
  onInspectBottleneck,
  onOpenRecovery,
  onOpenModule,
}) {
  const [viewMode, setViewMode] = useState("overview");
  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState("all");
  const [refreshing, setRefreshing] = useState(false);
  const [refreshError, setRefreshError] = useState("");
  const [showBottlenecks, setShowBottlenecks] = useState(true);
  const [showRecovery, setShowRecovery] = useState(true);
  const [showAutomation, setShowAutomation] = useState(true);

  const stages = useMemo(
    () =>
      safeArray(snapshot.stages).map((item, index) => ({
        id: item?.id || `stage-${index}`,
        stage: resolveStageName(item, index),
        health: item?.health,
        active: item?.active,
        delayed: item?.delayed,
        completed: item?.completed,
        blocked: item?.blocked,
        avgAgeHours: item?.avgAgeHours ?? item?.averageAgeHours,
        targetHours: item?.targetHours ?? item?.slaHours,
        owner: item?.owner || item?.team || "",
        status: item?.status || "",
        trend: item?.trend,
        detail:
          item?.detail ||
          item?.description ||
          "No workflow-stage detail supplied.",
        source: item?.source || item?.module || "",
        raw: item,
      })),
    [snapshot.stages]
  );

  const bottlenecks = useMemo(
    () =>
      safeArray(snapshot.bottlenecks).map((item, index) => ({
        id: item?.id || `bottleneck-${index}`,
        workflow: resolveTitle(item, `Workflow bottleneck ${index + 1}`),
        issue: resolveDetail(
          item,
          "No supporting bottleneck explanation supplied."
        ),
        severity:
          typeof item === "string"
            ? "Watch"
            : item?.severity || item?.priority || item?.level || "Watch",
        affected:
          typeof item === "string"
            ? undefined
            : item?.affected ?? item?.count ?? item?.items,
        ageHours:
          typeof item === "string"
            ? undefined
            : item?.ageHours ?? item?.waitingHours,
        owner: typeof item === "string" ? "" : item?.owner || item?.team || "",
        source:
          typeof item === "string" ? "" : item?.source || item?.module || "",
        raw: item,
      })),
    [snapshot.bottlenecks]
  );

  const recoveryQueue = useMemo(
    () =>
      safeArray(snapshot.recoveryQueue).map((item, index) => ({
        id: item?.id || `recovery-${index}`,
        title: resolveTitle(item, `Recovery item ${index + 1}`),
        detail: resolveDetail(
          item,
          "No supporting recovery detail supplied."
        ),
        priority:
          typeof item === "string"
            ? ""
            : item?.priority || item?.severity || item?.level || "",
        status:
          typeof item === "string" ? "" : item?.status || item?.state || "",
        owner: typeof item === "string" ? "" : item?.owner || item?.assignee || "",
        createdAt:
          typeof item === "string"
            ? null
            : item?.createdAt || item?.created_at || null,
        source:
          typeof item === "string" ? "" : item?.source || item?.module || "",
        raw: item,
      })),
    [snapshot.recoveryQueue]
  );

  const calculated = useMemo(() => {
    const activeFromStages = stages
      .filter((stage) => hasValue(stage.active))
      .reduce((sum, stage) => sum + safeNumber(stage.active), 0);

    const delayedFromStages = stages
      .filter((stage) => hasValue(stage.delayed))
      .reduce((sum, stage) => sum + safeNumber(stage.delayed), 0);

    const criticalFromStages = stages.filter(
      (stage) => getStageState(stage) === "critical"
    ).length;

    const healthValues = stages
      .filter((stage) => hasValue(stage.health))
      .map((stage) => safeNumber(stage.health))
      .filter((value) => Number.isFinite(value));

    const healthAverage = healthValues.length
      ? Math.round(
          healthValues.reduce((sum, value) => sum + value, 0) /
            healthValues.length
        )
      : undefined;

    return {
      activeFromStages,
      delayedFromStages,
      criticalFromStages,
      healthAverage,
      hasActive: stages.some((stage) => hasValue(stage.active)),
      hasDelayed: stages.some((stage) => hasValue(stage.delayed)),
      hasHealth: healthValues.length > 0,
    };
  }, [stages]);

  const overviewMetrics = useMemo(
    () => [
      {
        label: "Workflow Health",
        value: hasValue(snapshot.workflowHealth)
          ? formatPercent(snapshot.workflowHealth)
          : calculated.hasHealth
            ? formatPercent(calculated.healthAverage)
            : "—",
        connected:
          hasValue(snapshot.workflowHealth) || calculated.hasHealth,
        derived: !hasValue(snapshot.workflowHealth) && calculated.hasHealth,
        detail: hasValue(snapshot.workflowHealth)
          ? "Workflow health supplied by the connected source."
          : calculated.hasHealth
            ? "Average derived only from supplied stage health values."
            : "No workflow-health data is connected.",
        icon: Activity,
        tone: "green",
      },
      {
        label: "Active Workflows",
        value: hasValue(snapshot.activeWorkflows)
          ? formatCount(snapshot.activeWorkflows)
          : calculated.hasActive
            ? formatCount(calculated.activeFromStages)
            : "—",
        connected:
          hasValue(snapshot.activeWorkflows) || calculated.hasActive,
        derived: !hasValue(snapshot.activeWorkflows) && calculated.hasActive,
        detail: hasValue(snapshot.activeWorkflows)
          ? "Active workflow count supplied by the connected source."
          : calculated.hasActive
            ? "Total derived from supplied stage active counts."
            : "No active-workflow count is connected.",
        icon: Target,
        tone: "blue",
      },
      {
        label: "Delayed Items",
        value: hasValue(snapshot.delayedItems)
          ? formatCount(snapshot.delayedItems)
          : calculated.hasDelayed
            ? formatCount(calculated.delayedFromStages)
            : "—",
        connected: hasValue(snapshot.delayedItems) || calculated.hasDelayed,
        derived: !hasValue(snapshot.delayedItems) && calculated.hasDelayed,
        detail: hasValue(snapshot.delayedItems)
          ? "Delayed item count supplied by the connected source."
          : calculated.hasDelayed
            ? "Total derived from supplied stage delayed counts."
            : "No delayed-item count is connected.",
        icon: Clock3,
        tone: "orange",
      },
      {
        label: "Critical Issues",
        value: hasValue(snapshot.criticalIssues)
          ? formatCount(snapshot.criticalIssues)
          : stages.length
            ? formatCount(
                calculated.criticalFromStages +
                  bottlenecks.filter(
                    (item) => getSeverityTone(item.severity) === "red"
                  ).length
              )
            : bottlenecks.length
              ? formatCount(
                  bottlenecks.filter(
                    (item) => getSeverityTone(item.severity) === "red"
                  ).length
                )
              : "—",
        connected:
          hasValue(snapshot.criticalIssues) ||
          stages.length > 0 ||
          bottlenecks.length > 0,
        derived:
          !hasValue(snapshot.criticalIssues) &&
          (stages.length > 0 || bottlenecks.length > 0),
        detail: hasValue(snapshot.criticalIssues)
          ? "Critical issue count supplied by the connected source."
          : stages.length || bottlenecks.length
            ? "Derived from supplied critical stages and bottlenecks."
            : "No critical-issue intelligence is connected.",
        icon: AlertTriangle,
        tone: "red",
      },
    ],
    [
      snapshot.workflowHealth,
      snapshot.activeWorkflows,
      snapshot.delayedItems,
      snapshot.criticalIssues,
      calculated,
      stages.length,
      bottlenecks,
    ]
  );

  const automationMetrics = useMemo(
    () => [
      {
        label: "Automation Coverage",
        value: formatPercent(snapshot.automationCoverage),
        connected: hasValue(snapshot.automationCoverage),
        detail: "Automation coverage reported by the connected source.",
        icon: Brain,
        tone: "navy",
      },
      {
        label: "Verification Coverage",
        value: formatPercent(snapshot.verificationCoverage),
        connected: hasValue(snapshot.verificationCoverage),
        detail: "Verification coverage reported by the connected source.",
        icon: ShieldCheck,
        tone: "green",
      },
      {
        label: "Active Automations",
        value: formatCount(snapshot.activeAutomations),
        connected: hasValue(snapshot.activeAutomations),
        detail: "Active automation count reported by the connected source.",
        icon: Workflow,
        tone: "blue",
      },
      {
        label: "Recovery Success",
        value: formatPercent(snapshot.recoverySuccess),
        connected: hasValue(snapshot.recoverySuccess),
        detail:
          "Recovery success rate only appears when a real source supplies it.",
        icon: TrendingUp,
        tone: "orange",
      },
    ],
    [
      snapshot.automationCoverage,
      snapshot.verificationCoverage,
      snapshot.activeAutomations,
      snapshot.recoverySuccess,
    ]
  );

  const query = normalize(search);

  const filteredStages = useMemo(
    () =>
      stages.filter((stage) => {
        const state = getStageState(stage);

        const matchesFilter =
          stageFilter === "all" ||
          stageFilter === state ||
          (stageFilter === "delayed" && safeNumber(stage.delayed) > 0);

        if (!matchesFilter) return false;

        return isMatch(
          query,
          stage.stage,
          stage.status,
          stage.owner,
          stage.detail,
          stage.source
        );
      }),
    [stages, stageFilter, query]
  );

  const filteredBottlenecks = useMemo(
    () =>
      bottlenecks.filter((item) =>
        isMatch(
          query,
          item.workflow,
          item.issue,
          item.severity,
          item.owner,
          item.source
        )
      ),
    [bottlenecks, query]
  );

  const filteredRecovery = useMemo(
    () =>
      recoveryQueue.filter((item) =>
        isMatch(
          query,
          item.title,
          item.detail,
          item.priority,
          item.status,
          item.owner,
          item.source
        )
      ),
    [recoveryQueue, query]
  );

  const connectedOverviewCount = overviewMetrics.filter(
    (metric) => metric.connected
  ).length;

  const connectedAutomationCount = automationMetrics.filter(
    (metric) => metric.connected
  ).length;

  const stageHealthValues = stages
    .filter((stage) => hasValue(stage.health))
    .map((stage) => safeNumber(stage.health));

  const stageHealthSpread =
    stageHealthValues.length >= 2
      ? Math.max(...stageHealthValues) - Math.min(...stageHealthValues)
      : null;

  const delayRate = useMemo(() => {
    const active = stages
      .filter((stage) => hasValue(stage.active))
      .reduce((sum, stage) => sum + safeNumber(stage.active), 0);

    const delayed = stages
      .filter((stage) => hasValue(stage.delayed))
      .reduce((sum, stage) => sum + safeNumber(stage.delayed), 0);

    if (!active || !stages.some((stage) => hasValue(stage.delayed))) {
      return null;
    }

    return Math.round((delayed / active) * 100);
  }, [stages]);

  const totalBlocked = stages
    .filter((stage) => hasValue(stage.blocked))
    .reduce((sum, stage) => sum + safeNumber(stage.blocked), 0);

  const stageDataCoverage = stages.length
    ? Math.round(
        (stages.filter(
          (stage) =>
            hasValue(stage.health) ||
            hasValue(stage.active) ||
            hasValue(stage.delayed) ||
            hasValue(stage.status)
        ).length /
          stages.length) *
          100
      )
    : 0;

  const updatedAt =
    snapshot.generatedAt || snapshot.updatedAt || snapshot.lastUpdated || null;

  const sourceLabel =
    safeText(snapshot.sourceLabel).trim() || "Workflow snapshot";

  const hasRefresh = typeof onRefresh === "function";
  const hasStageInspect = typeof onInspectStage === "function";
  const hasBottleneckInspect = typeof onInspectBottleneck === "function";
  const hasRecoveryOpen = typeof onOpenRecovery === "function";

  const clearSearch = () => {
    setSearch("");
    setStageFilter("all");
  };

  const handleRefresh = async () => {
    if (!hasRefresh || refreshing) return;

    setRefreshing(true);
    setRefreshError("");

    try {
      await onRefresh();
    } catch (error) {
      console.error("Workflow Intelligence refresh failed:", error);
      setRefreshError(
        error?.message || "Workflow Intelligence could not refresh."
      );
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <section className="space-y-4 p-3 sm:space-y-5 sm:p-5">
      <AICommandModuleNav activeModule="workflow-intelligence" onOpenModule={onOpenModule} />
      <header className="overflow-hidden rounded-[1.8rem] border-[3px] border-orange-400 bg-[#FFF8EE] shadow-[0_18px_48px_rgba(23,36,61,0.09)]">
        <div className="grid xl:grid-cols-[minmax(0,1.5fr)_minmax(300px,0.5fr)]">
          <div className="bg-[#123865] p-5 text-white sm:p-7">
            <div className="flex flex-wrap items-center gap-2">
              <HeaderChip icon={Workflow} label="Workflow Intelligence" />
              <HeaderChip icon={ShieldCheck} label="Human Controlled" />
              <HeaderChip icon={Database} label={sourceLabel} />
            </div>

            <div className="mt-4 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
              <div className="max-w-4xl">
                <h1 className="text-2xl font-black tracking-[-0.03em] text-white sm:text-3xl">
                  Workflow Intelligence & Recovery
                </h1>

                <p className="mt-2 text-sm font-semibold leading-6 text-white/90 sm:text-[15px]">
                  Monitor the student journey, detect real operational delays,
                  isolate bottlenecks and surface recovery work without
                  inventing workflow health or automation claims.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:min-w-[420px]">
                <DarkMetric label="Stages" value={stages.length} />
                <DarkMetric
                  label="Bottlenecks"
                  value={bottlenecks.length}
                />
                <DarkMetric label="Recovery Queue" value={recoveryQueue.length} />
                <DarkMetric
                  label="Delayed Stages"
                  value={
                    stages.length
                      ? stages.filter((stage) => safeNumber(stage.delayed) > 0)
                          .length
                      : 0
                  }
                />
              </div>
            </div>
          </div>

          <div className="border-t-[3px] border-orange-300 bg-orange-500 p-5 text-white xl:border-l-[3px] xl:border-t-0 sm:p-7">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <CircleGauge size={18} />
                  <p className="text-[9px] font-black uppercase tracking-[0.12em] text-white">
                    Workflow data coverage
                  </p>
                </div>

                <p className="mt-3 text-5xl font-black leading-none text-white">
                  {stages.length ? `${stageDataCoverage}%` : "—"}
                </p>

                <p className="mt-2 text-xs font-black uppercase tracking-[0.09em] text-white">
                  {stages.length
                    ? stageDataCoverage >= 80
                      ? "Strong coverage"
                      : stageDataCoverage >= 40
                        ? "Partial coverage"
                        : "Limited coverage"
                    : "No stage payload"}
                </p>
              </div>

              <span className="flex h-12 w-12 items-center justify-center rounded-2xl border-2 border-white/30 bg-white/10">
                <Gauge size={22} />
              </span>
            </div>

            <div className="mt-5 rounded-2xl border-2 border-white/25 bg-white/10 p-3">
              <div className="flex items-center justify-between gap-3">
                <span className="text-[9px] font-black uppercase tracking-[0.1em] text-white">
                  Connected headline metrics
                </span>
                <strong className="text-sm font-black text-white">
                  {connectedOverviewCount}/{overviewMetrics.length}
                </strong>
              </div>

              <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/20">
                <div
                  className="h-full rounded-full bg-white transition-[width] duration-300"
                  style={{
                    width: `${
                      (connectedOverviewCount / overviewMetrics.length) * 100
                    }%`,
                  }}
                />
              </div>

              <p className="mt-2 text-[10px] font-semibold leading-4 text-white/85">
                Includes directly supplied metrics and honest stage-derived
                totals where possible.
              </p>
            </div>
          </div>
        </div>

        <div className="border-t-[3px] border-orange-300 bg-[#FFF8EE] p-3 sm:p-4">
          <div className="grid gap-3 xl:grid-cols-[auto_minmax(260px,1fr)_auto]">
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {VIEW_OPTIONS.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setViewMode(option.id)}
                  aria-pressed={viewMode === option.id}
                  className={`min-h-12 shrink-0 rounded-xl border-2 px-4 text-xs font-black transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300 ${
                    viewMode === option.id
                      ? "border-[#123865] bg-[#123865] text-white"
                      : "border-slate-300 bg-white text-[#10233F] hover:border-orange-300 hover:bg-orange-50"
                  }`}
                >
                  {option.label}
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
                placeholder="Search stages, bottlenecks, owners or recovery work..."
                aria-label="Search workflow intelligence"
                className="min-h-12 w-full rounded-xl border-2 border-slate-300 bg-white py-2.5 pl-11 pr-11 text-sm font-semibold text-[#10233F] outline-none transition placeholder:text-slate-400 focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
              />

              {search ? (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  aria-label="Clear workflow search"
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
                  ? "Refresh connected workflow intelligence"
                  : "No refresh handler is connected"
              }
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border-2 border-orange-500 bg-orange-500 px-5 text-xs font-black text-white transition hover:bg-orange-600 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-orange-200 disabled:cursor-not-allowed disabled:border-slate-300 disabled:bg-slate-200 disabled:text-slate-500"
            >
              <RefreshCw
                size={15}
                className={refreshing ? "animate-spin" : ""}
              />
              {refreshing
                ? "Refreshing..."
                : hasRefresh
                  ? "Refresh Workflows"
                  : "Refresh Not Connected"}
            </button>
          </div>

          <div className="mt-3 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex max-w-full items-center gap-2 overflow-x-auto pb-1">
              <span className="flex shrink-0 items-center gap-1.5 rounded-lg border-2 border-[#234E78] bg-[#EEF4FA] px-3 py-2 text-[9px] font-black uppercase tracking-[0.08em] text-[#123865]">
                <ListFilter size={12} />
                Stage filter
              </span>

              {STAGE_FILTERS.map((filter) => (
                <button
                  key={filter.id}
                  type="button"
                  onClick={() => setStageFilter(filter.id)}
                  aria-pressed={stageFilter === filter.id}
                  className={`shrink-0 rounded-lg border-2 px-3 py-2 text-[10px] font-black transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300 ${
                    stageFilter === filter.id
                      ? "border-orange-500 bg-orange-500 text-white"
                      : "border-slate-300 bg-white text-[#10233F] hover:border-orange-300 hover:bg-orange-50"
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-2 text-[10px] font-bold text-slate-600">
              <StatusMeta icon={Clock3} label={formatTimestamp(updatedAt)} />
              <StatusMeta
                icon={Filter}
                label={`${filteredStages.length}/${stages.length} stages visible`}
              />
            </div>
          </div>
        </div>
      </header>

      {refreshError ? (
        <InlineNotice
          tone="red"
          icon={XCircle}
          title="Workflow refresh failed"
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
          detail="No onRefresh handler is connected. Workflow Intelligence will never pretend that static data has refreshed."
        />
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {overviewMetrics.map((metric) => (
          <MetricCard key={metric.label} {...metric} />
        ))}
      </div>

      {viewMode === "overview" ? (
        <OverviewView
          stages={filteredStages}
          allStages={stages}
          query={query}
          stageFilter={stageFilter}
          canInspect={hasStageInspect}
          onInspect={(stage) => onInspectStage(stage.raw ?? stage)}
          onClear={clearSearch}
        />
      ) : (
        <AnalyticsView
          stages={filteredStages}
          allStages={stages}
          delayRate={delayRate}
          totalBlocked={totalBlocked}
          stageHealthSpread={stageHealthSpread}
          query={query}
          onClear={clearSearch}
        />
      )}

      <div className="grid gap-4 xl:grid-cols-2">
        <CollapsibleSection
          tone="red"
          eyebrow="Operational Pressure"
          title="Bottleneck Detection"
          description="Only bottlenecks supplied by a connected workflow source are shown."
          icon={AlertTriangle}
          count={filteredBottlenecks.length}
          open={showBottlenecks}
          onToggle={() => setShowBottlenecks((current) => !current)}
        >
          {filteredBottlenecks.length ? (
            <div className="space-y-3">
              {filteredBottlenecks.map((item) => (
                <BottleneckCard
                  key={item.id}
                  item={item}
                  canInspect={hasBottleneckInspect}
                  onInspect={() =>
                    onInspectBottleneck(item.raw ?? item)
                  }
                />
              ))}
            </div>
          ) : (
            <EmptyState
              title={
                query
                  ? "No matching bottlenecks"
                  : "No bottlenecks connected"
              }
              text={
                query
                  ? "Try another search term or clear the current filter."
                  : "When the workflow engine supplies bottleneck signals, they will appear here."
              }
              onClear={query ? clearSearch : undefined}
            />
          )}
        </CollapsibleSection>

        <CollapsibleSection
          tone="orange"
          eyebrow="Recovery Operations"
          title="Recovery Queue"
          description="Recovery work is shown as actionable only when a real parent handler exists."
          icon={TimerReset}
          count={filteredRecovery.length}
          open={showRecovery}
          onToggle={() => setShowRecovery((current) => !current)}
        >
          {filteredRecovery.length ? (
            <div className="space-y-3">
              {filteredRecovery.map((item) => (
                <RecoveryCard
                  key={item.id}
                  item={item}
                  canOpen={hasRecoveryOpen}
                  onOpen={() => onOpenRecovery(item.raw ?? item)}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              title={
                query ? "No matching recovery work" : "Recovery queue is empty"
              }
              text={
                query
                  ? "Try another search term or clear the current filter."
                  : "No recovery items were supplied to this workflow snapshot."
              }
              onClear={query ? clearSearch : undefined}
            />
          )}
        </CollapsibleSection>
      </div>

      <CollapsibleSection
        tone="navy"
        eyebrow="Automation + Verification"
        title="Workflow Automation Coverage"
        description="These metrics remain unavailable until real automation and verification sources supply them."
        icon={Brain}
        count={automationMetrics.length}
        open={showAutomation}
        onToggle={() => setShowAutomation((current) => !current)}
      >
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {automationMetrics.map((metric) => (
            <MetricCard
              key={metric.label}
              {...metric}
              compact
              derived={false}
            />
          ))}
        </div>

        <div className="mt-4 grid gap-3 lg:grid-cols-3">
          <ReadinessCard
            icon={Database}
            label="Stage Records"
            value={formatCount(stages.length)}
            detail="Workflow stage records supplied to this component."
          />
          <ReadinessCard
            icon={AlertTriangle}
            label="Bottleneck Signals"
            value={formatCount(bottlenecks.length)}
            detail="Connected bottleneck records available for review."
          />
          <ReadinessCard
            icon={ShieldCheck}
            label="Automation Metrics"
            value={`${connectedAutomationCount}/${automationMetrics.length}`}
            detail="Automation/verification metrics carrying real values."
          />
        </div>
      </CollapsibleSection>

      <footer className="grid gap-3 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-[1.35rem] border-[3px] border-[#234E78] bg-[#EEF4FA] p-4">
          <div className="flex items-start gap-3">
            <ShieldCheck
              className="mt-0.5 shrink-0 text-[#123865]"
              size={18}
            />
            <div>
              <p className="font-black text-[#10233F]">
                Workflow intelligence integrity
              </p>
              <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">
                No student journey counts, health percentages, automation
                coverage or recovery-success claims are invented in this
                component. Derived totals are explicitly labelled and use only
                supplied stage records.
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-[1.35rem] border-[3px] border-orange-400 bg-orange-50 p-4">
          <div className="flex items-start gap-3">
            <Workflow
              className="mt-0.5 shrink-0 text-orange-700"
              size={18}
            />
            <div>
              <p className="font-black text-[#10233F]">
                Real operational actions
              </p>
              <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">
                Stage inspection, bottleneck review and recovery actions only
                appear when their real handlers are connected by the parent.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </section>
  );
}

function OverviewView({
  stages,
  allStages,
  query,
  stageFilter,
  canInspect,
  onInspect,
  onClear,
}) {
  return (
    <section className="overflow-hidden rounded-[1.75rem] border-[3px] border-[#234E78] bg-[#FFFDF8] shadow-[0_12px_32px_rgba(23,36,61,0.06)]">
      <SectionHeader
        eyebrow="Student Journey"
        title="Workflow Stage Health"
        description="A stage-by-stage operational view using only connected workflow records."
        icon={Workflow}
        count={stages.length}
      />

      <div className="p-4 sm:p-5">
        {!allStages.length ? (
          <EmptyState
            title="No workflow stages connected"
            text="Supply snapshot.stages to turn this area into a live student-journey workflow monitor."
          />
        ) : stages.length ? (
          <>
            <div className="hidden overflow-x-auto lg:block">
              <table className="w-full min-w-[900px] border-separate border-spacing-0">
                <thead>
                  <tr>
                    {[
                      "Stage",
                      "Health",
                      "Active",
                      "Delayed",
                      "Blocked",
                      "Avg Age",
                      "Owner",
                      "State",
                      "",
                    ].map((heading) => (
                      <th
                        key={heading || "action"}
                        className="border-b-2 border-slate-300 bg-[#F7F1E8] px-3 py-3 text-left text-[9px] font-black uppercase tracking-[0.09em] text-slate-600"
                      >
                        {heading}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {stages.map((stage) => (
                    <StageTableRow
                      key={stage.id}
                      stage={stage}
                      canInspect={canInspect}
                      onInspect={() => onInspect(stage)}
                    />
                  ))}
                </tbody>
              </table>
            </div>

            <div className="grid gap-3 lg:hidden">
              {stages.map((stage) => (
                <StageMobileCard
                  key={stage.id}
                  stage={stage}
                  canInspect={canInspect}
                  onInspect={() => onInspect(stage)}
                />
              ))}
            </div>
          </>
        ) : (
          <EmptyState
            title="No stages match this view"
            text={
              query
                ? "The current search or stage filter is hiding every supplied stage."
                : `No stages match the "${stageFilter}" filter.`
            }
            onClear={onClear}
          />
        )}
      </div>
    </section>
  );
}

function AnalyticsView({
  stages,
  allStages,
  delayRate,
  totalBlocked,
  stageHealthSpread,
  query,
  onClear,
}) {
  const highestDelayStage = useMemo(() => {
    const candidates = stages
      .filter((stage) => hasValue(stage.delayed))
      .sort((a, b) => safeNumber(b.delayed) - safeNumber(a.delayed));

    return candidates[0] || null;
  }, [stages]);

  const slowestStage = useMemo(() => {
    const candidates = stages
      .filter((stage) => hasValue(stage.avgAgeHours))
      .sort((a, b) => safeNumber(b.avgAgeHours) - safeNumber(a.avgAgeHours));

    return candidates[0] || null;
  }, [stages]);

  return (
    <section className="overflow-hidden rounded-[1.75rem] border-[3px] border-[#234E78] bg-[#FFFDF8] shadow-[0_12px_32px_rgba(23,36,61,0.06)]">
      <SectionHeader
        eyebrow="Workflow Analytics"
        title="Operational Pattern Analysis"
        description="Analytics are derived only from the stage fields actually supplied to this component."
        icon={BarChart3}
        count={stages.length}
      />

      <div className="p-4 sm:p-5">
        {!allStages.length ? (
          <EmptyState
            title="No workflow analytics available"
            text="Analytics become available after real workflow stage data is connected."
          />
        ) : !stages.length ? (
          <EmptyState
            title="No stages match this analytics view"
            text="The current search or filter is hiding every supplied stage."
            onClear={onClear}
          />
        ) : (
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <AnalysisCard
                icon={Clock3}
                label="Delay Rate"
                value={delayRate === null ? "—" : `${delayRate}%`}
                detail="Derived from supplied active and delayed stage counts."
                tone="orange"
              />
              <AnalysisCard
                icon={AlertTriangle}
                label="Blocked Items"
                value={
                  stages.some((stage) => hasValue(stage.blocked))
                    ? formatCount(totalBlocked)
                    : "—"
                }
                detail="Total blocked items across stages that supply this field."
                tone="red"
              />
              <AnalysisCard
                icon={Activity}
                label="Health Spread"
                value={
                  stageHealthSpread === null
                    ? "—"
                    : `${Math.round(stageHealthSpread)} pts`
                }
                detail="Difference between the highest and lowest supplied stage health."
                tone="blue"
              />
              <AnalysisCard
                icon={Target}
                label="Visible Stages"
                value={formatCount(stages.length)}
                detail="Stages currently included after search and filtering."
                tone="navy"
              />
            </div>

            <div className="grid gap-4 xl:grid-cols-2">
              <InsightPanel
                title="Highest delay pressure"
                icon={Clock3}
                tone="orange"
              >
                {highestDelayStage ? (
                  <StageInsight
                    stage={highestDelayStage}
                    primaryLabel="Delayed"
                    primaryValue={formatCount(highestDelayStage.delayed)}
                  />
                ) : (
                  <SmallEmpty text="No stage supplies delayed-item counts." />
                )}
              </InsightPanel>

              <InsightPanel
                title="Longest average stage age"
                icon={TimerReset}
                tone="blue"
              >
                {slowestStage ? (
                  <StageInsight
                    stage={slowestStage}
                    primaryLabel="Average age"
                    primaryValue={formatHours(slowestStage.avgAgeHours)}
                  />
                ) : (
                  <SmallEmpty text="No stage supplies average-age data." />
                )}
              </InsightPanel>
            </div>

            <div className="rounded-[1.35rem] border-[3px] border-orange-300 bg-orange-50 p-4">
              <div className="flex items-start gap-3">
                <Info
                  size={18}
                  className="mt-0.5 shrink-0 text-orange-700"
                />
                <div>
                  <p className="font-black text-[#10233F]">
                    Analytics confidence
                  </p>
                  <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">
                    These analytics do not predict outcomes. They summarise
                    supplied stage fields. Missing health, age, blocked or delay
                    fields remain unavailable rather than being estimated.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function StageTableRow({ stage, canInspect, onInspect }) {
  const state = getStageState(stage);

  return (
    <tr className="group">
      <td className="border-b border-slate-200 px-3 py-3">
        <div className="min-w-[150px]">
          <p className="font-black text-[#10233F]">{stage.stage}</p>
          {stage.source ? <SourceBadge source={stage.source} /> : null}
        </div>
      </td>

      <td className="border-b border-slate-200 px-3 py-3">
        <strong className="text-sm text-[#10233F]">
          {formatPercent(stage.health)}
        </strong>
      </td>

      <td className="border-b border-slate-200 px-3 py-3 font-bold text-[#10233F]">
        {formatCount(stage.active)}
      </td>

      <td className="border-b border-slate-200 px-3 py-3 font-bold text-orange-800">
        {formatCount(stage.delayed)}
      </td>

      <td className="border-b border-slate-200 px-3 py-3 font-bold text-red-800">
        {formatCount(stage.blocked)}
      </td>

      <td className="border-b border-slate-200 px-3 py-3 font-bold text-[#10233F]">
        {formatHours(stage.avgAgeHours)}
      </td>

      <td className="border-b border-slate-200 px-3 py-3 text-xs font-semibold text-slate-600">
        {stage.owner || "—"}
      </td>

      <td className="border-b border-slate-200 px-3 py-3">
        <StageStateBadge state={state} status={stage.status} />
      </td>

      <td className="border-b border-slate-200 px-3 py-3 text-right">
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

function StageMobileCard({ stage, canInspect, onInspect }) {
  const state = getStageState(stage);

  return (
    <article
      className={`rounded-[1.2rem] border-[3px] bg-white p-4 ${stateBorder(
        state
      )}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-black text-[#10233F]">{stage.stage}</p>
          <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">
            {stage.detail}
          </p>
          {stage.source ? <SourceBadge source={stage.source} /> : null}
        </div>

        <StageStateBadge state={state} status={stage.status} />
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
        <MiniStat label="Health" value={formatPercent(stage.health)} />
        <MiniStat label="Active" value={formatCount(stage.active)} />
        <MiniStat label="Delayed" value={formatCount(stage.delayed)} />
        <MiniStat label="Blocked" value={formatCount(stage.blocked)} />
        <MiniStat label="Avg Age" value={formatHours(stage.avgAgeHours)} />
        <MiniStat label="Owner" value={stage.owner || "—"} />
      </div>

      {canInspect ? (
        <div className="mt-3">
          <ActionButton label="Inspect Stage" onClick={onInspect} />
        </div>
      ) : null}
    </article>
  );
}

function BottleneckCard({ item, canInspect, onInspect }) {
  const tone = getSeverityTone(item.severity);

  return (
    <article
      className={`rounded-[1.2rem] border-[3px] bg-white p-4 ${outerBorder(
        tone
      )}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-black text-[#10233F]">{item.workflow}</p>
            {item.source ? <SourceBadge source={item.source} /> : null}
          </div>

          <p className="mt-2 text-xs font-semibold leading-5 text-slate-600">
            {item.issue}
          </p>
        </div>

        <span
          className={`shrink-0 rounded-lg border-2 px-2.5 py-1 text-[8px] font-black uppercase ${toneClass(
            tone
          )}`}
        >
          {item.severity}
        </span>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
        <MiniStat label="Affected" value={formatCount(item.affected)} />
        <MiniStat label="Age" value={formatHours(item.ageHours)} />
        <MiniStat label="Owner" value={item.owner || "—"} />
      </div>

      {canInspect ? (
        <div className="mt-3">
          <ActionButton label="Review Bottleneck" onClick={onInspect} />
        </div>
      ) : null}
    </article>
  );
}

function RecoveryCard({ item, canOpen, onOpen }) {
  const tone = getSeverityTone(item.priority || item.status);

  return (
    <article
      className={`rounded-[1.2rem] border-[3px] bg-white p-4 ${outerBorder(
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

        {item.status || item.priority ? (
          <span
            className={`shrink-0 rounded-lg border-2 px-2.5 py-1 text-[8px] font-black uppercase ${toneClass(
              tone
            )}`}
          >
            {item.status || item.priority}
          </span>
        ) : null}
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <MiniStat label="Owner" value={item.owner || "—"} />
        <MiniStat
          label="Created"
          value={
            item.createdAt
              ? formatTimestamp(item.createdAt)
              : "—"
          }
        />
      </div>

      {canOpen ? (
        <div className="mt-3">
          <ActionButton label="Open Recovery Work" onClick={onOpen} />
        </div>
      ) : (
        <p className="mt-3 text-[9px] font-black uppercase tracking-[0.07em] text-slate-400">
          Read-only recovery signal
        </p>
      )}
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
  derived = false,
  compact = false,
}) {
  return (
    <article
      className={`relative overflow-hidden rounded-[1.4rem] border-[3px] ${
        compact ? "p-4" : "p-4 sm:p-5"
      } shadow-[0_10px_28px_rgba(23,36,61,0.055)] ${toneClass(
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
          {connected ? (derived ? "Derived from stages" : "Connected") : "Awaiting source"}
        </span>

        {derived ? (
          <span className="rounded-md border border-orange-300 bg-white px-2 py-0.5 text-[8px] font-black uppercase text-orange-800">
            Calculated
          </span>
        ) : null}
      </div>
    </article>
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

function InsightPanel({ title, icon: Icon, tone, children }) {
  return (
    <div
      className={`rounded-[1.35rem] border-[3px] bg-white p-4 ${outerBorder(
        tone
      )}`}
    >
      <div className="flex items-center gap-2">
        <Icon size={17} className={toneIconClass(tone)} />
        <h3 className="font-black text-[#10233F]">{title}</h3>
      </div>

      <div className="mt-3">{children}</div>
    </div>
  );
}

function StageInsight({ stage, primaryLabel, primaryValue }) {
  return (
    <div className="rounded-xl border-2 border-slate-300 bg-[#FFFDF8] p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-black text-[#10233F]">{stage.stage}</p>
          <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">
            {stage.detail}
          </p>
        </div>

        <div className="text-right">
          <p className="text-[8px] font-black uppercase tracking-[0.07em] text-slate-500">
            {primaryLabel}
          </p>
          <p className="mt-1 text-xl font-black text-[#10233F]">
            {primaryValue}
          </p>
        </div>
      </div>
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

function CollapsibleSection({
  tone,
  eyebrow,
  title,
  description,
  icon: Icon,
  count,
  open,
  onToggle,
  children,
}) {
  return (
    <section
      className={`overflow-hidden rounded-[1.75rem] border-[3px] bg-[#FFF8EE] shadow-[0_12px_30px_rgba(23,36,61,0.055)] ${outerBorder(
        tone
      )}`}
    >
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-4 border-b-[3px] border-orange-400 bg-[#123865] px-4 py-4 text-left text-white transition hover:bg-[#0F3158] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-orange-300/60 sm:px-5"
      >
        <div className="flex min-w-0 items-start gap-3">
          <span
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border-2 bg-white ${toneClass(
              tone
            )}`}
          >
            <Icon size={17} />
          </span>

          <div className="min-w-0">
            <p className="text-[9px] font-black uppercase tracking-[0.14em] text-orange-300">
              {eyebrow}
            </p>
            <h3 className="mt-0.5 text-lg font-black text-white sm:text-xl">
              {title}
            </h3>
            <p className="mt-1 max-w-4xl text-xs font-semibold leading-5 text-white/80">
              {description}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <span className="rounded-lg border-2 border-white/20 bg-white/10 px-2.5 py-1 text-xs font-black text-white">
            {count}
          </span>

          <span className="flex h-10 w-10 items-center justify-center rounded-xl border-2 border-white/25 bg-white/10 text-white">
            {open ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </span>
        </div>
      </button>

      {open ? <div className="p-4 sm:p-5">{children}</div> : null}
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
    <span className="inline-flex min-h-8 items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-2.5 py-1.5">
      <Icon size={12} className="shrink-0 text-[#123865]" />
      <span>{label}</span>
    </span>
  );
}

function ReadinessCard({ icon: Icon, label, value, detail }) {
  return (
    <div className="rounded-xl border-2 border-slate-300 bg-white p-4">
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

function MiniStat({ label, value }) {
  return (
    <div className="min-w-0 rounded-lg border-2 border-slate-200 bg-slate-50 p-2.5">
      <p className="truncate text-[8px] font-black uppercase tracking-[0.07em] text-slate-500">
        {label}
      </p>
      <p className="mt-1 break-words text-xs font-black text-[#10233F]">
        {value}
      </p>
    </div>
  );
}

function StageStateBadge({ state, status }) {
  const label =
    safeText(status).trim() ||
    (state === "healthy"
      ? "Healthy"
      : state === "watch"
        ? "Watch"
        : state === "critical"
          ? "Critical"
          : "Unknown");

  const classes =
    state === "healthy"
      ? "border-emerald-300 bg-emerald-50 text-emerald-800"
      : state === "watch"
        ? "border-orange-300 bg-orange-50 text-orange-800"
        : state === "critical"
          ? "border-red-300 bg-red-50 text-red-800"
          : "border-slate-300 bg-slate-50 text-slate-600";

  return (
    <span
      className={`inline-flex max-w-[130px] truncate rounded-lg border-2 px-2.5 py-1 text-[8px] font-black uppercase ${classes}`}
    >
      {label}
    </span>
  );
}

function SourceBadge({ source }) {
  return (
    <span className="mt-1 inline-flex max-w-full truncate rounded-md border border-slate-300 bg-slate-50 px-2 py-0.5 text-[8px] font-black uppercase tracking-[0.06em] text-slate-600">
      {source}
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
          Clear search & filters
        </button>
      ) : null}
    </div>
  );
}

function SmallEmpty({ text }) {
  return (
    <div className="rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 p-4 text-center">
      <p className="text-xs font-semibold leading-5 text-slate-600">{text}</p>
    </div>
  );
}

function toneClass(tone = "navy") {
  if (tone === "red") return "border-red-400 bg-red-50 text-red-800";
  if (tone === "orange")
    return "border-orange-400 bg-orange-50 text-orange-800";
  if (tone === "green")
    return "border-emerald-400 bg-emerald-50 text-emerald-800";
  if (tone === "blue") return "border-blue-400 bg-blue-50 text-blue-800";
  if (tone === "muted")
    return "border-slate-300 bg-slate-50 text-slate-500";

  return "border-[#234E78] bg-[#EEF4FA] text-[#123865]";
}

function outerBorder(tone = "navy") {
  if (tone === "red") return "border-red-400";
  if (tone === "orange") return "border-orange-400";
  if (tone === "green") return "border-emerald-400";
  if (tone === "blue") return "border-blue-400";

  return "border-[#234E78]";
}

function stateBorder(state) {
  if (state === "critical") return "border-red-400";
  if (state === "watch") return "border-orange-400";
  if (state === "healthy") return "border-emerald-400";
  return "border-slate-300";
}

function accentBar(tone = "navy") {
  if (tone === "red") return "bg-red-500";
  if (tone === "orange") return "bg-orange-500";
  if (tone === "green") return "bg-emerald-500";
  if (tone === "blue") return "bg-blue-500";

  return "bg-[#123865]";
}

function toneIconClass(tone) {
  if (tone === "red") return "text-red-700";
  if (tone === "orange") return "text-orange-700";
  if (tone === "green") return "text-emerald-700";
  if (tone === "blue") return "text-blue-700";
  return "text-[#123865]";
}
