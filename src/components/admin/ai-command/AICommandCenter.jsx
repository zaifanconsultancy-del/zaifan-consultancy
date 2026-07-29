// AICommandCenter V3 EXTREME — Zaifan AI Command OS
// Full replacement for: src/components/admin/AICommandCenter.jsx
//
// Production rules:
// - never invent live business metrics
// - missing payloads render as "—" / "Not connected", never as fake zeroes
// - every interactive-looking control is either functional or visibly disabled
// - supports real parent-provided refresh / inspect / navigation handlers
// - consistent Zaifan Admin OS navy + orange + cream visual language
// - responsive from mobile to wide Admin workspace
// - strong loading, error, empty, search, filter and data-freshness states
// - preserves no-prop rendering without crashing
//
// Optional props:
// snapshot = {
//   students, applications, offers, revenue, currency,
//   automationCoverage, verificationHealth, activeWorkflows, criticalAlerts,
//   risks, opportunities, recommendations, alerts, systems,
//   generatedAt | updatedAt | lastUpdated,
//   sourceLabel,
// }
// onRefresh?: async () => void
// onInspectSignal?: ({ type, item }) => void
// onOpenSystem?: (system) => void
// onOpenRecommendation?: (recommendation) => void
// onOpenModule?: (moduleId) => void
//
// Module ids:
// command-center | executive-copilot | predictive-insights |
// workflow-intelligence | cross-system-intelligence | ai-analytics

import React, { useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Bot,
  Brain,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  CircleGauge,
  GitBranch,
  LineChart,
  Network,
  Clock3,
  Database,
  DollarSign,
  FileText,
  Filter,
  GraduationCap,
  Info,
  RefreshCw,
  Rocket,
  Search,
  Shield,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
  Users,
  Workflow,
  X,
  XCircle,
} from "lucide-react";

const DEFAULT_SYSTEMS = [
  "Student OS",
  "Counselor OS",
  "University OS",
  "Application OS",
  "Visa OS",
  "Payment OS",
  "Finance OS",
  "Marketing OS",
  "Compliance OS",
];

const FILTERS = [
  { id: "all", label: "All intelligence" },
  { id: "risk", label: "Risks" },
  { id: "opportunity", label: "Opportunities" },
  { id: "alert", label: "Alerts" },
  { id: "system", label: "Systems" },
  { id: "recommendation", label: "Recommendations" },
];

function safeArray(value) {
  return Array.isArray(value) ? value.filter(Boolean) : [];
}

function hasValue(value) {
  return value !== undefined && value !== null && value !== "";
}

function safeNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function safeText(value, fallback = "") {
  if (value === null || value === undefined) return fallback;
  return String(value);
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

function formatMoney(value, currency = "GBP") {
  if (!hasValue(value)) return "—";
  const amount = Number(value);
  if (!Number.isFinite(amount)) return "—";

  try {
    return new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency: currency || "GBP",
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${amount.toLocaleString("en-GB")} ${currency || "GBP"}`;
  }
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

function getRiskTone(severity = "") {
  const clean = normalize(severity);
  if (clean.includes("critical") || clean.includes("urgent")) return "red";
  if (clean.includes("high")) return "red";
  if (clean.includes("medium") || clean.includes("warning")) return "orange";
  return "blue";
}

function getSystemState(status = "") {
  const clean = normalize(status);

  if (
    ["live", "healthy", "connected", "operational", "ready", "verified"].some(
      (value) => clean.includes(value)
    )
  ) {
    return "healthy";
  }

  if (
    ["degraded", "warning", "attention", "partial", "delayed"].some((value) =>
      clean.includes(value)
    )
  ) {
    return "warning";
  }

  if (
    ["offline", "failed", "critical", "error", "blocked"].some((value) =>
      clean.includes(value)
    )
  ) {
    return "critical";
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
    item?.detail ||
    item?.description ||
    item?.message ||
    item?.reason ||
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

const COMMAND_MODULES = [
  {
    id: "command-center",
    label: "Command Center",
    shortLabel: "Command",
    description: "Executive operating signals, risks, opportunities and system health.",
    icon: Brain,
  },
  {
    id: "executive-copilot",
    label: "Executive Copilot",
    shortLabel: "Copilot",
    description: "Leadership assistance, decision support and executive guidance.",
    icon: Bot,
  },
  {
    id: "predictive-insights",
    label: "Predictive Insights",
    shortLabel: "Predictive",
    description: "Forecasting, trend intelligence and forward-looking operating signals.",
    icon: LineChart,
  },
  {
    id: "workflow-intelligence",
    label: "Workflow Intelligence",
    shortLabel: "Workflow",
    description: "Journey health, bottlenecks, delays and recovery intelligence.",
    icon: GitBranch,
  },
  {
    id: "cross-system-intelligence",
    label: "Cross-System Intelligence",
    shortLabel: "Cross-System",
    description: "Relationships and dependencies across Zaifan operating systems.",
    icon: Network,
  },
  {
    id: "ai-analytics",
    label: "AI Analytics",
    shortLabel: "Analytics",
    description: "Intelligence coverage, model outputs and analytical operating context.",
    icon: BarChart3,
  },
];

function AICommandCenter({
  snapshot = {},
  onRefresh,
  onInspectSignal,
  onOpenSystem,
  onOpenRecommendation,
  onOpenModule,
}) {
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [refreshing, setRefreshing] = useState(false);
  const [refreshError, setRefreshError] = useState("");
  const [showRecommendations, setShowRecommendations] = useState(true);
  const [showAlerts, setShowAlerts] = useState(true);
  const [showCoverage, setShowCoverage] = useState(true);

  const risks = useMemo(
    () =>
      safeArray(snapshot.risks).map((risk, index) => ({
        id: risk?.id || `risk-${index}`,
        title: resolveTitle(risk, "Unnamed risk"),
        severity:
          typeof risk === "string"
            ? "Watch"
            : risk?.severity || risk?.level || risk?.status || "Watch",
        detail: resolveDetail(
          risk,
          "No supporting explanation was supplied for this risk signal."
        ),
        source: typeof risk === "string" ? "" : risk?.source || risk?.module || "",
        raw: risk,
      })),
    [snapshot.risks]
  );

  const opportunities = useMemo(
    () =>
      safeArray(snapshot.opportunities).map((item, index) => ({
        id: item?.id || `opportunity-${index}`,
        title: resolveTitle(item, "Opportunity signal"),
        detail: resolveDetail(
          item,
          "No supporting explanation was supplied for this opportunity."
        ),
        value:
          typeof item === "string"
            ? null
            : item?.value ?? item?.score ?? item?.impact ?? null,
        source: typeof item === "string" ? "" : item?.source || item?.module || "",
        raw: item,
      })),
    [snapshot.opportunities]
  );

  const recommendations = useMemo(() => {
    const provided = safeArray(snapshot.recommendations);
    const source = provided.length ? provided : opportunities;

    return source.map((item, index) => ({
      id: item?.id || `recommendation-${index}`,
      title: resolveTitle(item, "Executive recommendation"),
      detail: resolveDetail(
        item,
        "Review the supporting operating record before taking action."
      ),
      priority:
        typeof item === "string"
          ? ""
          : item?.priority || item?.severity || item?.level || "",
      source: typeof item === "string" ? "" : item?.source || item?.module || "",
      raw: item?.raw ?? item,
      inherited: !provided.length,
    }));
  }, [snapshot.recommendations, opportunities]);

  const alerts = useMemo(
    () =>
      safeArray(snapshot.alerts).map((item, index) => ({
        id: item?.id || `alert-${index}`,
        title: resolveTitle(item, "Executive alert"),
        status:
          typeof item === "string"
            ? "Watch"
            : item?.status || item?.severity || item?.level || "Watch",
        detail: resolveDetail(
          item,
          "No supporting explanation was supplied for this alert."
        ),
        source: typeof item === "string" ? "" : item?.source || item?.module || "",
        raw: item,
      })),
    [snapshot.alerts]
  );

  const systems = useMemo(() => {
    const provided = safeArray(snapshot.systems);
    const source = provided.length ? provided : DEFAULT_SYSTEMS;

    return source.map((item, index) => {
      if (typeof item === "string") {
        return {
          id: `system-${index}`,
          name: item,
          status: provided.length ? "Connected" : "Not connected",
          detail: provided.length
            ? "System reported to the command layer."
            : "No live health payload supplied.",
          raw: item,
        };
      }

      return {
        id: item?.id || `system-${index}`,
        name: item?.name || item?.label || "System",
        status: item?.status || "Unknown",
        detail:
          item?.detail ||
          item?.description ||
          item?.message ||
          "No system health detail supplied.",
        raw: item,
      };
    });
  }, [snapshot.systems]);

  const primaryMetrics = useMemo(
    () => [
      {
        label: "Students",
        value: formatCount(snapshot.students),
        connected: hasValue(snapshot.students),
        icon: Users,
        tone: "blue",
        detail: "Student records supplied to this command snapshot.",
      },
      {
        label: "Applications",
        value: formatCount(snapshot.applications),
        connected: hasValue(snapshot.applications),
        icon: FileText,
        tone: "navy",
        detail: "Application records supplied to executive intelligence.",
      },
      {
        label: "Offers",
        value: formatCount(snapshot.offers),
        connected: hasValue(snapshot.offers),
        icon: GraduationCap,
        tone: "green",
        detail: "Offer-stage records supplied to this command snapshot.",
      },
      {
        label: "Revenue",
        value: formatMoney(snapshot.revenue, snapshot.currency || "GBP"),
        connected: hasValue(snapshot.revenue),
        icon: DollarSign,
        tone: "orange",
        detail: "Connected revenue value only; no forecast is invented here.",
      },
    ],
    [
      snapshot.students,
      snapshot.applications,
      snapshot.offers,
      snapshot.revenue,
      snapshot.currency,
    ]
  );

  const coverageMetrics = useMemo(
    () => [
      {
        label: "Automation Coverage",
        value: formatPercent(snapshot.automationCoverage),
        connected: hasValue(snapshot.automationCoverage),
        icon: Bot,
        tone: "navy",
        detail: "Coverage reported by the connected automation layer.",
      },
      {
        label: "Verification Health",
        value: formatPercent(snapshot.verificationHealth),
        connected: hasValue(snapshot.verificationHealth),
        icon: ShieldCheck,
        tone: "green",
        detail: "Verification/readiness reported by the connected scanner.",
      },
      {
        label: "Active Workflows",
        value: formatCount(snapshot.activeWorkflows),
        connected: hasValue(snapshot.activeWorkflows),
        icon: Workflow,
        tone: "blue",
        detail: "Workflows currently reported to this command surface.",
      },
      {
        label: "Critical Alerts",
        value: hasValue(snapshot.criticalAlerts)
          ? formatCount(snapshot.criticalAlerts)
          : formatCount(
              risks.filter((risk) => getRiskTone(risk.severity) === "red").length
            ),
        connected: hasValue(snapshot.criticalAlerts) || risks.length > 0,
        icon: AlertTriangle,
        tone: "red",
        detail: hasValue(snapshot.criticalAlerts)
          ? "Critical alert count supplied by the connected source."
          : risks.length
            ? "Derived only from supplied high/critical risk signals."
            : "No critical-alert payload is connected.",
      },
    ],
    [
      snapshot.automationCoverage,
      snapshot.verificationHealth,
      snapshot.activeWorkflows,
      snapshot.criticalAlerts,
      risks,
    ]
  );

  const query = normalize(search);

  const showType = (type) =>
    activeFilter === "all" || activeFilter === type;

  const filteredRisks = useMemo(
    () =>
      showType("risk")
        ? risks.filter((risk) =>
            isMatch(
              query,
              risk.title,
              risk.severity,
              risk.detail,
              risk.source
            )
          )
        : [],
    [risks, query, activeFilter]
  );

  const filteredOpportunities = useMemo(
    () =>
      showType("opportunity")
        ? opportunities.filter((item) =>
            isMatch(query, item.title, item.detail, item.value, item.source)
          )
        : [],
    [opportunities, query, activeFilter]
  );

  const filteredRecommendations = useMemo(
    () =>
      showType("recommendation")
        ? recommendations.filter((item) =>
            isMatch(
              query,
              item.title,
              item.detail,
              item.priority,
              item.source
            )
          )
        : [],
    [recommendations, query, activeFilter]
  );

  const filteredAlerts = useMemo(
    () =>
      showType("alert")
        ? alerts.filter((item) =>
            isMatch(query, item.title, item.status, item.detail, item.source)
          )
        : [],
    [alerts, query, activeFilter]
  );

  const filteredSystems = useMemo(
    () =>
      showType("system")
        ? systems.filter((item) =>
            isMatch(query, item.name, item.status, item.detail)
          )
        : [],
    [systems, query, activeFilter]
  );

  const connectedPrimaryCount = primaryMetrics.filter(
    (item) => item.connected
  ).length;

  const connectedCoverageCount = coverageMetrics.filter(
    (item) => item.connected
  ).length;

  const providedSystemCount = safeArray(snapshot.systems).length;

  const dataCoverage = useMemo(() => {
    const checks = [
      hasValue(snapshot.students),
      hasValue(snapshot.applications),
      hasValue(snapshot.offers),
      hasValue(snapshot.revenue),
      safeArray(snapshot.risks).length > 0,
      safeArray(snapshot.opportunities).length > 0,
      safeArray(snapshot.alerts).length > 0,
      safeArray(snapshot.systems).length > 0,
      hasValue(snapshot.automationCoverage),
      hasValue(snapshot.verificationHealth),
      hasValue(snapshot.activeWorkflows),
    ];

    const connected = checks.filter(Boolean).length;
    return {
      connected,
      total: checks.length,
      percent: Math.round((connected / checks.length) * 100),
    };
  }, [snapshot]);

  const criticalRiskCount = risks.filter(
    (risk) => getRiskTone(risk.severity) === "red"
  ).length;

  const criticalAlertCount = alerts.filter(
    (alert) => getRiskTone(alert.status) === "red"
  ).length;

  // This is intentionally labelled as a derived priority indicator, not a real
  // business KPI. It uses only supplied risk/alert records.
  const priorityPressure = Math.min(
    100,
    criticalRiskCount * 22 +
      criticalAlertCount * 18 +
      Math.max(0, risks.length - criticalRiskCount) * 4 +
      Math.max(0, alerts.length - criticalAlertCount) * 3
  );

  const visibleResultCount =
    filteredRisks.length +
    filteredOpportunities.length +
    filteredRecommendations.length +
    filteredAlerts.length +
    filteredSystems.length;

  const sourceLabel =
    safeText(snapshot.sourceLabel).trim() || "Parent snapshot";

  const updatedAt =
    snapshot.generatedAt || snapshot.updatedAt || snapshot.lastUpdated || null;

  const hasRefresh = typeof onRefresh === "function";
  const hasInspect = typeof onInspectSignal === "function";
  const hasSystemOpen = typeof onOpenSystem === "function";
  const hasRecommendationOpen = typeof onOpenRecommendation === "function";
  const hasModuleNavigation = typeof onOpenModule === "function";

  const clearSearch = () => {
    setSearch("");
    setActiveFilter("all");
  };

  const handleRefresh = async () => {
    if (!hasRefresh || refreshing) return;

    setRefreshing(true);
    setRefreshError("");

    try {
      await onRefresh();
    } catch (error) {
      console.error("AI Command Center refresh failed:", error);
      setRefreshError(
        error?.message || "AI Command Center could not refresh."
      );
    } finally {
      setRefreshing(false);
    }
  };

  const inspect = (type, item) => {
    if (!hasInspect) return;
    onInspectSignal({ type, item: item?.raw ?? item });
  };

  return (
    <section className="space-y-4 p-3 sm:space-y-5 sm:p-5">
      <header className="overflow-hidden rounded-[1.8rem] border-[3px] border-orange-400 bg-[#FFF8EE] shadow-[0_18px_48px_rgba(23,36,61,0.09)]">
        <div className="grid xl:grid-cols-[minmax(0,1.5fr)_minmax(300px,0.5fr)]">
          <div className="bg-[#123865] p-5 text-white sm:p-7">
            <div className="flex flex-wrap items-center gap-2">
              <HeaderChip icon={Brain} label="AI Command OS" />
              <HeaderChip icon={Shield} label="Human Controlled" />
              <HeaderChip icon={Database} label={sourceLabel} />
            </div>

            <div className="mt-4 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
              <div className="max-w-4xl">
                <h1 className="text-2xl font-black tracking-[-0.03em] text-white sm:text-3xl">
                  Zaifan Executive Intelligence Command
                </h1>
                <p className="mt-2 text-sm font-semibold leading-6 text-white/88 sm:text-[15px]">
                  A single leadership surface for genuine operating signals,
                  risk, opportunity, platform health, recommendations and
                  connected automation intelligence.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:min-w-[390px]">
                <DarkMetric label="Risks" value={risks.length} />
                <DarkMetric label="Critical" value={criticalRiskCount} />
                <DarkMetric label="Opportunities" value={opportunities.length} />
                <DarkMetric label="Alerts" value={alerts.length} />
              </div>
            </div>
          </div>

          <div className="border-t-[3px] border-orange-300 bg-orange-500 p-5 text-white xl:border-l-[3px] xl:border-t-0 sm:p-7">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <CircleGauge size={18} />
                  <p className="text-[9px] font-black uppercase tracking-[0.12em] text-white">
                    Derived priority pressure
                  </p>
                </div>

                <p className="mt-3 text-5xl font-black leading-none text-white">
                  {risks.length || alerts.length ? priorityPressure : "—"}
                </p>

                <p className="mt-2 text-xs font-black uppercase tracking-[0.09em] text-white">
                  {!risks.length && !alerts.length
                    ? "No signal payload"
                    : priorityPressure >= 70
                      ? "Intervention"
                      : priorityPressure >= 35
                        ? "Attention"
                        : "Stable"}
                </p>
              </div>

              <span className="flex h-12 w-12 items-center justify-center rounded-2xl border-2 border-white/30 bg-white/10">
                <Activity size={22} />
              </span>
            </div>

            <div className="mt-5 rounded-2xl border-2 border-white/25 bg-white/10 p-3">
              <div className="flex items-center justify-between gap-3">
                <span className="text-[9px] font-black uppercase tracking-[0.1em] text-white">
                  Data coverage
                </span>
                <strong className="text-sm font-black text-white">
                  {dataCoverage.connected}/{dataCoverage.total}
                </strong>
              </div>

              <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/20">
                <div
                  className="h-full rounded-full bg-white transition-[width] duration-300"
                  style={{ width: `${dataCoverage.percent}%` }}
                />
              </div>

              <p className="mt-2 text-[10px] font-semibold leading-4 text-white/85">
                {dataCoverage.percent}% of supported command inputs are
                currently connected.
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
                placeholder="Search risks, opportunities, alerts, recommendations or systems..."
                aria-label="Search AI command intelligence"
                className="min-h-12 w-full rounded-xl border-2 border-slate-300 bg-white py-2.5 pl-11 pr-11 text-sm font-semibold text-[#10233F] outline-none transition placeholder:text-slate-400 focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
              />

              {search ? (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  aria-label="Clear intelligence search"
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
                  ? "Refresh connected intelligence"
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
                  ? "Refresh Intelligence"
                  : "Refresh Not Connected"}
            </button>
          </div>

          <div className="mt-3 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex max-w-full items-center gap-2 overflow-x-auto pb-1">
              <span className="flex shrink-0 items-center gap-1.5 rounded-lg border-2 border-[#234E78] bg-[#EEF4FA] px-3 py-2 text-[9px] font-black uppercase tracking-[0.08em] text-[#123865]">
                <Filter size={12} />
                Filter
              </span>

              {FILTERS.map((filter) => (
                <button
                  key={filter.id}
                  type="button"
                  onClick={() => setActiveFilter(filter.id)}
                  aria-pressed={activeFilter === filter.id}
                  className={`shrink-0 rounded-lg border-2 px-3 py-2 text-[10px] font-black transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300 ${
                    activeFilter === filter.id
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
                icon={Search}
                label={`${visibleResultCount} visible result${
                  visibleResultCount === 1 ? "" : "s"
                }`}
              />
            </div>
          </div>
        </div>
      </header>

      <section
        aria-label="AI Command OS modules"
        className="overflow-hidden rounded-[1.65rem] border-[3px] border-[#234E78] bg-[#FFF8EE] shadow-[0_12px_30px_rgba(23,36,61,0.055)]"
      >
        <div className="flex flex-col gap-3 border-b-[3px] border-orange-400 bg-[#123865] px-4 py-4 text-white sm:px-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.14em] text-orange-300">
              AI Executive Workspace
            </p>
            <h2 className="mt-1 text-lg font-black text-white">
              Command OS Modules
            </h2>
            <p className="mt-1 max-w-3xl text-xs font-semibold leading-5 text-white/80">
              Move between the six executive intelligence workspaces without leaving AI Executive.
            </p>
          </div>

          <span className="w-fit rounded-lg border-2 border-white/20 bg-white/10 px-3 py-2 text-[9px] font-black uppercase tracking-[0.08em] text-white">
            6 modules
          </span>
        </div>

        <div className="grid gap-2 p-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6">
          {COMMAND_MODULES.map((module) => {
            const Icon = module.icon;
            const isCurrent = module.id === "command-center";

            return (
              <button
                key={module.id}
                type="button"
                disabled={isCurrent || !hasModuleNavigation}
                onClick={() => onOpenModule?.(module.id)}
                title={
                  isCurrent
                    ? "Current module"
                    : hasModuleNavigation
                      ? `Open ${module.label}`
                      : `${module.label} is not wired to the parent yet`
                }
                className={`group min-w-0 rounded-xl border-2 p-3 text-left transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-orange-200 ${
                  isCurrent
                    ? "cursor-default border-orange-500 bg-orange-500 text-white"
                    : hasModuleNavigation
                      ? "border-slate-300 bg-white text-[#10233F] hover:-translate-y-0.5 hover:border-orange-400 hover:bg-orange-50 hover:shadow-sm"
                      : "cursor-not-allowed border-slate-300 bg-slate-100 text-slate-500"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <span
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border-2 ${
                      isCurrent
                        ? "border-white/30 bg-white/10 text-white"
                        : "border-[#234E78]/20 bg-[#EEF4FA] text-[#123865]"
                    }`}
                  >
                    <Icon size={16} />
                  </span>

                  {isCurrent ? (
                    <span className="rounded-md border border-white/30 bg-white/10 px-2 py-1 text-[7px] font-black uppercase tracking-[0.08em] text-white">
                      Current
                    </span>
                  ) : (
                    <ArrowRight
                      size={14}
                      className={hasModuleNavigation ? "text-orange-600" : "text-slate-400"}
                    />
                  )}
                </div>

                <p className={`mt-3 text-xs font-black ${isCurrent ? "text-white" : ""}`}>
                  {module.label}
                </p>
                <p
                  className={`mt-1 text-[9px] font-semibold leading-4 ${
                    isCurrent ? "text-white/85" : "text-slate-600"
                  }`}
                >
                  {module.description}
                </p>
              </button>
            );
          })}
        </div>

        {!hasModuleNavigation ? (
          <div className="border-t-2 border-slate-200 bg-[#EEF4FA] px-4 py-3">
            <p className="flex items-start gap-2 text-[10px] font-bold leading-4 text-[#123865]">
              <Info size={14} className="mt-0.5 shrink-0" />
              The module rail is ready, but navigation stays safely disabled until
              ExecutiveCommandSystem supplies the real module-switch handler.
            </p>
          </div>
        ) : null}
      </section>

      {refreshError ? (
        <InlineNotice
          tone="red"
          icon={XCircle}
          title="Intelligence refresh failed"
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
          detail="This component has no onRefresh handler yet. The button stays disabled instead of pretending to refresh data."
        />
      ) : null}

      <section aria-label="Connected command metrics">
        <SectionIntro
          eyebrow="Operating Snapshot"
          title="Connected business context"
          description="Only values supplied by the parent are displayed. Missing integrations stay visibly unconnected."
          badge={`${connectedPrimaryCount}/${primaryMetrics.length} connected`}
        />

        <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {primaryMetrics.map((item) => (
            <CommandMetricCard key={item.label} {...item} />
          ))}
        </div>
      </section>

      <div className="grid gap-4 xl:grid-cols-[1fr_1fr_0.95fr]">
        <CommandPanel
          tone="red"
          eyebrow="Executive Risk"
          title="Risk Center"
          description="Supplied risk signals only. Operational changes remain human-controlled."
          icon={AlertTriangle}
          count={filteredRisks.length}
          hidden={!showType("risk")}
        >
          {filteredRisks.length ? (
            <div className="space-y-3">
              {filteredRisks.map((risk) => (
                <RiskCard
                  key={risk.id}
                  risk={risk}
                  canInspect={hasInspect}
                  onInspect={() => inspect("risk", risk)}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              title={query ? "No matching risks" : "No risk signals connected"}
              text={
                query
                  ? "Try another search term or clear the current filter."
                  : "When the parent supplies risk intelligence, it will appear here."
              }
              onClear={query ? clearSearch : undefined}
            />
          )}
        </CommandPanel>

        <CommandPanel
          tone="green"
          eyebrow="Growth Intelligence"
          title="Opportunity Center"
          description="Connected conversion, growth and operating opportunity signals."
          icon={TrendingUp}
          count={filteredOpportunities.length}
          hidden={!showType("opportunity")}
        >
          {filteredOpportunities.length ? (
            <div className="space-y-3">
              {filteredOpportunities.map((item) => (
                <OpportunityCard
                  key={item.id}
                  item={item}
                  canInspect={hasInspect}
                  onInspect={() => inspect("opportunity", item)}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              title={
                query
                  ? "No matching opportunities"
                  : "No opportunity signals connected"
              }
              text={
                query
                  ? "Try another search term or clear the current filter."
                  : "Opportunity intelligence will appear here when supplied."
              }
              onClear={query ? clearSearch : undefined}
            />
          )}
        </CommandPanel>

        <CommandPanel
          tone="blue"
          eyebrow="Platform Operations"
          title="Platform Health"
          description="System status from the supplied health payload."
          icon={ShieldCheck}
          count={filteredSystems.length}
          hidden={!showType("system")}
        >
          {filteredSystems.length ? (
            <div className="space-y-2.5">
              {filteredSystems.map((system) => (
                <SystemHealthRow
                  key={system.id}
                  system={system}
                  canOpen={hasSystemOpen}
                  onOpen={() => onOpenSystem(system.raw ?? system)}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              title="No matching systems"
              text="Try another search term or clear the current filter."
              onClear={query ? clearSearch : undefined}
            />
          )}
        </CommandPanel>
      </div>

      <CollapsibleCommandSection
        tone="navy"
        eyebrow="Leadership Guidance"
        title="Executive Recommendations"
        description={
          safeArray(snapshot.recommendations).length
            ? "Recommendations supplied by the connected intelligence layer."
            : opportunities.length
              ? "No dedicated recommendation payload exists, so supplied opportunities are shown as review prompts."
              : "No recommendation intelligence is connected yet."
        }
        open={showRecommendations}
        onToggle={() => setShowRecommendations((current) => !current)}
        count={filteredRecommendations.length}
        icon={Target}
        hidden={!showType("recommendation")}
      >
        {filteredRecommendations.length ? (
          <div className="grid gap-3 md:grid-cols-2">
            {filteredRecommendations.map((item, index) => (
              <RecommendationCard
                key={item.id}
                item={item}
                index={index}
                canOpen={hasRecommendationOpen}
                onOpen={() => onOpenRecommendation(item.raw ?? item)}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            title={
              query
                ? "No matching recommendations"
                : "No recommendations connected"
            }
            text={
              query
                ? "Try another search term or clear the current filter."
                : "Recommendations will appear here when real intelligence is supplied."
            }
            onClear={query ? clearSearch : undefined}
          />
        )}
      </CollapsibleCommandSection>

      <CollapsibleCommandSection
        tone="orange"
        eyebrow="Signal Feed"
        title="Executive Alert Feed"
        description="Current supplied alert signals. No synthetic alerts are generated inside this UI."
        open={showAlerts}
        onToggle={() => setShowAlerts((current) => !current)}
        count={filteredAlerts.length}
        icon={AlertTriangle}
        hidden={!showType("alert")}
      >
        {filteredAlerts.length ? (
          <div className="grid gap-3 md:grid-cols-2">
            {filteredAlerts.map((item) => (
              <AlertFeedCard
                key={item.id}
                item={item}
                canInspect={hasInspect}
                onInspect={() => inspect("alert", item)}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            title={query ? "No matching alerts" : "No alerts connected"}
            text={
              query
                ? "Try another search term or clear the current filter."
                : "Connected alert intelligence will appear here."
            }
            onClear={query ? clearSearch : undefined}
          />
        )}
      </CollapsibleCommandSection>

      <CollapsibleCommandSection
        tone="navy"
        eyebrow="Automation + Verification"
        title="Operational Coverage Snapshot"
        description="Coverage and workflow metrics remain unavailable until a real source supplies them."
        open={showCoverage}
        onToggle={() => setShowCoverage((current) => !current)}
        count={coverageMetrics.length}
        icon={Bot}
        hidden={activeFilter !== "all"}
      >
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {coverageMetrics.map((item) => (
            <AutomationMetricCard key={item.label} {...item} />
          ))}
        </div>

        <div className="mt-4 grid gap-3 lg:grid-cols-3">
          <ReadinessCard
            icon={Database}
            label="Command Inputs"
            value={`${dataCoverage.connected}/${dataCoverage.total}`}
            detail="Supported input groups currently carrying real data."
          />
          <ReadinessCard
            icon={ShieldCheck}
            label="Coverage Metrics"
            value={`${connectedCoverageCount}/${coverageMetrics.length}`}
            detail="Automation/verification metrics connected to this surface."
          />
          <ReadinessCard
            icon={Activity}
            label="System Health Payloads"
            value={
              providedSystemCount
                ? `${providedSystemCount} supplied`
                : "Not connected"
            }
            detail="System records explicitly supplied by the parent."
          />
        </div>
      </CollapsibleCommandSection>

      {(query || activeFilter !== "all") && visibleResultCount === 0 ? (
        <EmptySearchResult onClear={clearSearch} />
      ) : null}

      <footer className="grid gap-3 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-[1.35rem] border-[3px] border-[#234E78] bg-[#EEF4FA] p-4">
          <div className="flex items-start gap-3">
            <ShieldCheck
              className="mt-0.5 shrink-0 text-[#123865]"
              size={18}
            />
            <div>
              <p className="font-black text-[#10233F]">
                Intelligence integrity
              </p>
              <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">
                This command layer does not fabricate students, revenue,
                accuracy, system health, forecasts or business outcomes. Missing
                inputs remain visibly unavailable. Any derived pressure score
                uses only supplied risk and alert records.
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-[1.35rem] border-[3px] border-orange-400 bg-orange-50 p-4">
          <div className="flex items-start gap-3">
            <Brain
              className="mt-0.5 shrink-0 text-orange-700"
              size={18}
            />
            <div>
              <p className="font-black text-[#10233F]">
                Human-controlled actions
              </p>
              <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">
                Inspect/open actions only appear when the parent supplies a real
                handler. Intelligence stays advisory until a person chooses an
                operational action.
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
    <span className="inline-flex min-h-8 items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-2.5 py-1.5">
      <Icon size={12} className="shrink-0 text-[#123865]" />
      <span>{label}</span>
    </span>
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

function CommandMetricCard({
  label,
  value,
  detail,
  icon: Icon,
  tone = "navy",
  connected,
}) {
  return (
    <article
      className={`relative overflow-hidden rounded-[1.45rem] border-[3px] p-4 shadow-[0_10px_28px_rgba(23,36,61,0.055)] ${toneClass(
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

      <p className="mt-3 min-h-[40px] text-xs font-semibold leading-5 text-slate-600">
        {detail}
      </p>

      <div className="mt-3 flex items-center gap-1.5">
        {connected ? (
          <CheckCircle2 size={13} className="text-emerald-700" />
        ) : (
          <Database size={13} className="text-slate-500" />
        )}
        <p
          className={`text-[9px] font-black uppercase tracking-[0.09em] ${
            connected ? "text-emerald-800" : "text-slate-500"
          }`}
        >
          {connected ? "Connected value" : "Not connected"}
        </p>
      </div>
    </article>
  );
}

function CommandPanel({
  eyebrow,
  title,
  description,
  icon: Icon,
  tone = "navy",
  count = 0,
  hidden = false,
  children,
}) {
  if (hidden) return null;

  return (
    <section
      className={`overflow-hidden rounded-[1.7rem] border-[3px] bg-[#FFFDF8] shadow-[0_12px_32px_rgba(23,36,61,0.06)] ${outerBorder(
        tone
      )}`}
    >
      <div className="flex items-start justify-between gap-3 border-b-[3px] border-orange-400 bg-[#123865] px-4 py-4 text-white sm:px-5">
        <div className="min-w-0">
          <p className="text-[9px] font-black uppercase tracking-[0.14em] text-orange-300">
            {eyebrow}
          </p>
          <h2 className="mt-1 text-lg font-black text-white">{title}</h2>
          <p className="mt-1 text-xs font-semibold leading-5 text-white/80">
            {description}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <span className="rounded-lg border-2 border-white/20 bg-white/10 px-2.5 py-1 text-xs font-black text-white">
            {count}
          </span>
          <span
            className={`flex h-10 w-10 items-center justify-center rounded-xl border-2 bg-white ${toneClass(
              tone
            )}`}
          >
            <Icon size={17} />
          </span>
        </div>
      </div>

      <div className="p-4">{children}</div>
    </section>
  );
}

function RiskCard({ risk, canInspect, onInspect }) {
  const tone = getRiskTone(risk.severity);

  return (
    <article
      className={`rounded-[1.15rem] border-[3px] bg-white p-4 ${outerBorder(
        tone
      )}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="break-words font-black leading-5 text-[#10233F]">
              {risk.title}
            </p>
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

      <OptionalAction
        enabled={canInspect}
        label="Inspect signal"
        onClick={onInspect}
      />
    </article>
  );
}

function OpportunityCard({ item, canInspect, onInspect }) {
  return (
    <article className="rounded-[1.15rem] border-[3px] border-emerald-400 bg-emerald-50 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="break-words font-black leading-5 text-[#10233F]">
              {item.title}
            </p>
            {item.source ? <SourceBadge source={item.source} /> : null}
          </div>

          <p className="mt-2 text-xs font-semibold leading-5 text-slate-600">
            {item.detail}
          </p>
        </div>

        {item.value !== null ? (
          <span className="shrink-0 rounded-xl border-2 border-emerald-400 bg-white px-3 py-2 text-sm font-black text-emerald-800">
            {safeText(item.value)}
          </span>
        ) : (
          <Rocket className="shrink-0 text-emerald-700" size={18} />
        )}
      </div>

      <OptionalAction
        enabled={canInspect}
        label="Inspect signal"
        onClick={onInspect}
      />
    </article>
  );
}

function SystemHealthRow({ system, canOpen, onOpen }) {
  const state = getSystemState(system.status);

  const classes =
    state === "healthy"
      ? "border-emerald-300 bg-emerald-50"
      : state === "warning"
        ? "border-orange-300 bg-orange-50"
        : state === "critical"
          ? "border-red-300 bg-red-50"
          : "border-slate-300 bg-slate-50";

  const badge =
    state === "healthy"
      ? "border-emerald-300 text-emerald-800"
      : state === "warning"
        ? "border-orange-300 text-orange-800"
        : state === "critical"
          ? "border-red-300 text-red-800"
          : "border-slate-300 text-slate-600";

  const body = (
    <>
      <div className="min-w-0">
        <p className="break-words text-sm font-black text-[#10233F]">
          {system.name}
        </p>
        <p className="mt-1 text-[10px] font-semibold leading-4 text-slate-600">
          {system.detail}
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <span
          className={`rounded-lg border-2 bg-white px-2.5 py-1 text-[8px] font-black uppercase ${badge}`}
        >
          {system.status}
        </span>
        {canOpen ? <ArrowRight size={15} className="text-[#123865]" /> : null}
      </div>
    </>
  );

  if (canOpen) {
    return (
      <button
        type="button"
        onClick={onOpen}
        className={`flex w-full items-start justify-between gap-3 rounded-[1.05rem] border-2 p-3 text-left transition hover:-translate-y-0.5 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300 ${classes}`}
      >
        {body}
      </button>
    );
  }

  return (
    <div
      className={`flex items-start justify-between gap-3 rounded-[1.05rem] border-2 p-3 ${classes}`}
    >
      {body}
    </div>
  );
}

function CollapsibleCommandSection({
  eyebrow,
  title,
  description,
  open,
  onToggle,
  count,
  icon: Icon,
  tone = "navy",
  hidden = false,
  children,
}) {
  if (hidden) return null;

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

function RecommendationCard({ item, index, canOpen, onOpen }) {
  return (
    <article className="rounded-[1.15rem] border-[3px] border-orange-300 bg-orange-50 p-4">
      <div className="flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border-2 border-orange-300 bg-white text-sm font-black text-orange-800">
          {index + 1}
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="break-words font-black leading-5 text-[#10233F]">
              {item.title}
            </p>
            {item.inherited ? (
              <span className="rounded-md border border-orange-300 bg-white px-2 py-0.5 text-[8px] font-black uppercase text-orange-800">
                Opportunity review
              </span>
            ) : null}
            {item.source ? <SourceBadge source={item.source} /> : null}
          </div>

          <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">
            {item.detail}
          </p>

          {item.priority ? (
            <p className="mt-2 text-[9px] font-black uppercase tracking-[0.08em] text-orange-800">
              Priority: {item.priority}
            </p>
          ) : null}

          <OptionalAction
            enabled={canOpen}
            label="Open recommendation"
            onClick={onOpen}
          />
        </div>
      </div>
    </article>
  );
}

function AlertFeedCard({ item, canInspect, onInspect }) {
  const tone = getRiskTone(item.status);

  return (
    <article
      className={`rounded-[1.15rem] border-[3px] bg-white p-4 ${outerBorder(
        tone
      )}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="break-words font-black leading-5 text-[#10233F]">
              {item.title}
            </p>
            {item.source ? <SourceBadge source={item.source} /> : null}
          </div>

          <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">
            {item.detail}
          </p>
        </div>

        <span
          className={`shrink-0 rounded-lg border-2 px-2.5 py-1 text-[8px] font-black uppercase ${toneClass(
            tone
          )}`}
        >
          {item.status}
        </span>
      </div>

      <OptionalAction
        enabled={canInspect}
        label="Inspect alert"
        onClick={onInspect}
      />
    </article>
  );
}

function AutomationMetricCard({
  label,
  value,
  detail,
  tone,
  icon: Icon,
  connected,
}) {
  return (
    <article
      className={`rounded-[1.25rem] border-[3px] p-4 ${toneClass(
        connected ? tone : "muted"
      )}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[9px] font-black uppercase leading-4 tracking-[0.1em] text-[#10233F]">
            {label}
          </p>
          <p className="mt-2 break-words text-3xl font-black text-[#10233F]">
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

      <p
        className={`mt-3 text-[9px] font-black uppercase tracking-[0.08em] ${
          connected ? "text-emerald-800" : "text-slate-500"
        }`}
      >
        {connected ? "Connected" : "Awaiting source"}
      </p>
    </article>
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

function SourceBadge({ source }) {
  return (
    <span className="max-w-full truncate rounded-md border border-slate-300 bg-slate-50 px-2 py-0.5 text-[8px] font-black uppercase tracking-[0.06em] text-slate-600">
      {source}
    </span>
  );
}

function OptionalAction({ enabled, label, onClick }) {
  if (!enabled) return null;

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

function EmptySearchResult({ onClear }) {
  return (
    <div className="rounded-[1.35rem] border-[3px] border-orange-300 bg-orange-50 p-5 text-center">
      <Search className="mx-auto text-orange-700" size={22} />
      <h3 className="mt-2 font-black text-[#10233F]">
        Nothing matches the current command view
      </h3>
      <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">
        The data has not disappeared. Your search or intelligence filter is
        hiding all currently available results.
      </p>
      <button
        type="button"
        onClick={onClear}
        className="mt-3 rounded-lg border-2 border-orange-500 bg-orange-500 px-4 py-2 text-[10px] font-black uppercase tracking-[0.07em] text-white transition hover:bg-orange-600"
      >
        Reset command view
      </button>
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

function accentBar(tone = "navy") {
  if (tone === "red") return "bg-red-500";
  if (tone === "orange") return "bg-orange-500";
  if (tone === "green") return "bg-emerald-500";
  if (tone === "blue") return "bg-blue-500";
  return "bg-[#123865]";
}

export default AICommandCenter;
