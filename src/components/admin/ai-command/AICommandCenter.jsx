// AICommandCenter V2 MAXIMUM — Zaifan Executive Intelligence Command
// Full replacement for: src/components/admin/AICommandCenter.jsx
//
// Goals:
// - replace placeholder/wireframe styling with Zaifan Admin OS hierarchy
// - remove fake hard-coded business claims as default live metrics
// - make search actually filter intelligence
// - make Refresh functional when parent supplies onRefresh()
// - make static/read-only intelligence visually distinct from real controls
// - strengthen navy/orange/cream system and semantic risk/opportunity colors
// - reduce empty white space and repetitive box walls
// - add collapsible lower intelligence sections to reduce scrolling
// - preserve compatibility when rendered with no props
//
// Optional props:
// snapshot = {
//   students, applications, offers, revenue,
//   automationCoverage, verificationHealth,
//   activeWorkflows, criticalAlerts,
//   risks, opportunities, recommendations,
//   alerts, systems
// }
// onRefresh?: async () => void

import React, { useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Bot,
  Brain,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  CircleGauge,
  DollarSign,
  FileText,
  GraduationCap,
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
  XCircle,
} from "lucide-react";

function safeArray(value) {
  return Array.isArray(value) ? value.filter(Boolean) : [];
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
    .replace(/[_-]+/g, " ");
}

function money(value, currency = "GBP") {
  const amount = safeNumber(value);

  try {
    return new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${amount.toLocaleString("en-GB")} ${currency}`;
  }
}

function getRiskTone(severity = "") {
  const clean = normalize(severity);

  if (clean.includes("critical") || clean.includes("high")) return "red";
  if (clean.includes("medium") || clean.includes("warning")) return "orange";
  return "blue";
}

function AICommandCenter({
  snapshot = {},
  onRefresh,
}) {
  const [search, setSearch] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [refreshError, setRefreshError] = useState("");
  const [showRecommendations, setShowRecommendations] = useState(true);
  const [showAlerts, setShowAlerts] = useState(true);
  const [showAutomation, setShowAutomation] = useState(true);

  const metrics = useMemo(
    () => [
      {
        label: "Students",
        value: safeNumber(snapshot.students),
        icon: Users,
        tone: "blue",
        detail: "Student records currently connected to this command view.",
      },
      {
        label: "Applications",
        value: safeNumber(snapshot.applications),
        icon: FileText,
        tone: "navy",
        detail: "Application records available to executive intelligence.",
      },
      {
        label: "Offers",
        value: safeNumber(snapshot.offers),
        icon: GraduationCap,
        tone: "green",
        detail: "Offer-stage records visible in the current snapshot.",
      },
      {
        label: "Revenue",
        value: money(snapshot.revenue || 0, snapshot.currency || "GBP"),
        icon: DollarSign,
        tone: "orange",
        detail: "Connected revenue value. No fabricated forecast is added here.",
      },
    ],
    [snapshot]
  );

  const risks = useMemo(() => {
    const source = safeArray(snapshot.risks);

    return source.map((risk, index) => ({
      id: risk.id || `risk-${index}`,
      title: risk.title || risk.name || "Unnamed risk",
      severity: risk.severity || risk.level || "Watch",
      detail:
        risk.detail ||
        risk.description ||
        risk.message ||
        "No supporting risk explanation supplied.",
    }));
  }, [snapshot.risks]);

  const opportunities = useMemo(() => {
    return safeArray(snapshot.opportunities).map((item, index) => ({
      id: item.id || `opportunity-${index}`,
      title: item.title || item.name || safeText(item),
      detail:
        item.detail ||
        item.description ||
        "No opportunity explanation supplied.",
      value: item.value ?? item.score ?? null,
    }));
  }, [snapshot.opportunities]);

  const recommendations = useMemo(() => {
    const source =
      safeArray(snapshot.recommendations).length > 0
        ? safeArray(snapshot.recommendations)
        : opportunities;

    return source.map((item, index) => ({
      id: item.id || `recommendation-${index}`,
      title:
        typeof item === "string"
          ? item
          : item.title || item.name || "Executive recommendation",
      detail:
        typeof item === "string"
          ? "Review this signal against the underlying Student OS data before acting."
          : item.detail ||
            item.description ||
            "Review the supporting Student OS record before taking action.",
    }));
  }, [snapshot.recommendations, opportunities]);

  const alerts = useMemo(() => {
    return safeArray(snapshot.alerts).map((item, index) => ({
      id: item.id || `alert-${index}`,
      title:
        typeof item === "string"
          ? item
          : item.title || item.name || "Executive alert",
      status:
        typeof item === "string"
          ? "Watch"
          : item.status || item.severity || "Watch",
      detail:
        typeof item === "string"
          ? "Read-only command signal."
          : item.detail ||
            item.description ||
            item.message ||
            "No alert explanation supplied.",
    }));
  }, [snapshot.alerts]);

  const systems = useMemo(() => {
    const provided = safeArray(snapshot.systems);

    const defaults = [
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

    return (provided.length ? provided : defaults).map((item, index) => {
      if (typeof item === "string") {
        return {
          id: `system-${index}`,
          name: item,
          status: provided.length ? "Live" : "Not connected",
          detail: provided.length
            ? "Connected operating system."
            : "No live health payload supplied to AI Command Center.",
        };
      }

      return {
        id: item.id || `system-${index}`,
        name: item.name || item.label || "System",
        status: item.status || "Unknown",
        detail: item.detail || item.description || "No health detail supplied.",
      };
    });
  }, [snapshot.systems]);

  const automationMetrics = useMemo(
    () => [
      {
        label: "Automation Coverage",
        value:
          snapshot.automationCoverage === undefined
            ? "—"
            : `${safeNumber(snapshot.automationCoverage)}%`,
        icon: Bot,
        tone: "navy",
        detail: "Coverage reported by the connected automation layer.",
      },
      {
        label: "Verification Health",
        value:
          snapshot.verificationHealth === undefined
            ? "—"
            : `${safeNumber(snapshot.verificationHealth)}%`,
        icon: ShieldCheck,
        tone: "green",
        detail: "Verification/readiness health from the connected scanner.",
      },
      {
        label: "Active Workflows",
        value:
          snapshot.activeWorkflows === undefined
            ? "—"
            : safeNumber(snapshot.activeWorkflows),
        icon: Workflow,
        tone: "blue",
        detail: "Currently active workflows reported to this dashboard.",
      },
      {
        label: "Critical Alerts",
        value:
          snapshot.criticalAlerts === undefined
            ? risks.filter((risk) =>
                ["red"].includes(getRiskTone(risk.severity))
              ).length
            : safeNumber(snapshot.criticalAlerts),
        icon: AlertTriangle,
        tone: "red",
        detail: "Critical alert pressure requiring executive review.",
      },
    ],
    [snapshot, risks]
  );

  const query = normalize(search);

  const filteredRisks = useMemo(
    () =>
      risks.filter((risk) => {
        if (!query) return true;
        return normalize(
          `${risk.title} ${risk.severity} ${risk.detail}`
        ).includes(query);
      }),
    [risks, query]
  );

  const filteredOpportunities = useMemo(
    () =>
      opportunities.filter((item) => {
        if (!query) return true;
        return normalize(
          `${item.title} ${item.detail} ${item.value ?? ""}`
        ).includes(query);
      }),
    [opportunities, query]
  );

  const filteredRecommendations = useMemo(
    () =>
      recommendations.filter((item) => {
        if (!query) return true;
        return normalize(`${item.title} ${item.detail}`).includes(query);
      }),
    [recommendations, query]
  );

  const filteredAlerts = useMemo(
    () =>
      alerts.filter((item) => {
        if (!query) return true;
        return normalize(
          `${item.title} ${item.status} ${item.detail}`
        ).includes(query);
      }),
    [alerts, query]
  );

  const filteredSystems = useMemo(
    () =>
      systems.filter((item) => {
        if (!query) return true;
        return normalize(
          `${item.name} ${item.status} ${item.detail}`
        ).includes(query);
      }),
    [systems, query]
  );

  const criticalCount = risks.filter(
    (risk) => getRiskTone(risk.severity) === "red"
  ).length;

  const commandPressure = Math.min(
    100,
    criticalCount * 20 +
      risks.length * 6 +
      alerts.length * 4
  );

  const handleRefresh = async () => {
    if (refreshing) return;

    if (typeof onRefresh !== "function") {
      setRefreshError(
        "No refresh handler is connected to AI Command Center yet."
      );
      return;
    }

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

  return (
    <section className="space-y-5 p-3 sm:p-5">
      <div className="rounded-[2rem] border-[3px] border-orange-400 bg-[#FFF8EE] p-3 shadow-[0_20px_55px_rgba(23,36,61,0.09)] sm:p-4">
        <div className="grid overflow-hidden rounded-[1.65rem] border-2 border-[#234E78] xl:grid-cols-[1.35fr_0.65fr]">
          <div className="bg-[#123865] p-5 text-white sm:p-7">
            <div className="flex flex-wrap items-center gap-2">
              <HeaderChip icon={Brain} label="AI Command Center" />
              <HeaderChip icon={Shield} label="Human Controlled" />
              <HeaderChip icon={Activity} label="Executive Intelligence" />
            </div>

            <h1 className="mt-4 text-2xl font-black tracking-[-0.025em] text-white sm:text-3xl">
              Zaifan Executive Intelligence Command
            </h1>

            <p className="mt-2 max-w-4xl text-sm font-semibold leading-6 text-white/90">
              One leadership surface for operating risk, opportunity, system
              health, recommendations, alerts, automation coverage, and
              verification readiness.
            </p>

            <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
              <DarkMetric label="Risk Signals" value={risks.length} />
              <DarkMetric label="Critical" value={criticalCount} />
              <DarkMetric label="Opportunities" value={opportunities.length} />
              <DarkMetric label="Alerts" value={alerts.length} />
            </div>
          </div>

          <div className="border-t-2 border-orange-300 bg-orange-500 p-5 text-white xl:border-l-2 xl:border-t-0 sm:p-7">
            <div className="flex items-center gap-2">
              <CircleGauge size={18} />
              <p className="text-[9px] font-black uppercase tracking-[0.11em] text-white">
                Command Pressure
              </p>
            </div>

            <p className="mt-3 text-5xl font-black text-white">
              {commandPressure}
            </p>
            <p className="mt-1 text-sm font-black uppercase tracking-[0.08em] text-white">
              {commandPressure >= 70
                ? "Intervention"
                : commandPressure >= 35
                ? "Attention"
                : "Stable"}
            </p>

            <div className="mt-5 grid grid-cols-2 gap-2">
              <OrangeMetric label="Students" value={safeNumber(snapshot.students)} />
              <OrangeMetric label="Applications" value={safeNumber(snapshot.applications)} />
              <OrangeMetric label="Offers" value={safeNumber(snapshot.offers)} />
              <OrangeMetric label="Systems" value={systems.length} />
            </div>
          </div>
        </div>

        <div className="mt-3 grid gap-3 rounded-[1.3rem] border-2 border-orange-200 bg-[#FFFDF8] p-4 xl:grid-cols-[minmax(260px,1fr)_auto]">
          <div className="relative">
            <Search
              size={16}
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
            />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search risk, opportunities, alerts, recommendations or systems..."
              className="min-h-11 w-full rounded-xl border-2 border-slate-300 bg-white py-2.5 pl-11 pr-4 text-sm font-semibold text-[#10233F] outline-none placeholder:text-slate-400 focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
            />
          </div>

          <button
            type="button"
            onClick={() => void handleRefresh()}
            disabled={refreshing}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border-2 border-orange-500 bg-orange-500 px-5 text-xs font-black text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RefreshCw
              size={15}
              className={refreshing ? "animate-spin" : ""}
            />
            {refreshing ? "Refreshing..." : "Refresh Intelligence"}
          </button>
        </div>
      </div>

      {refreshError ? (
        <div className="rounded-[1.35rem] border-[3px] border-red-400 bg-red-50 p-4">
          <div className="flex items-start gap-3">
            <XCircle className="mt-0.5 shrink-0 text-red-700" size={18} />
            <div>
              <p className="font-black text-[#10233F]">
                Intelligence refresh unavailable
              </p>
              <p className="mt-1 text-sm font-semibold leading-6 text-slate-600">
                {refreshError}
              </p>
            </div>
          </div>
        </div>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((item) => (
          <CommandMetricCard key={item.label} {...item} />
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_1fr_0.95fr]">
        <CommandPanel
          tone="red"
          eyebrow="Executive Risk"
          title="Risk Center"
          description="Read-only risk intelligence. Open the originating Student OS record for operational changes."
          icon={AlertTriangle}
          count={filteredRisks.length}
        >
          {filteredRisks.length ? (
            <div className="space-y-3">
              {filteredRisks.map((risk) => (
                <RiskCard key={risk.id} risk={risk} />
              ))}
            </div>
          ) : (
            <EmptyState text="No matching risks." />
          )}
        </CommandPanel>

        <CommandPanel
          tone="green"
          eyebrow="Growth Intelligence"
          title="Opportunity Center"
          description="Conversion and growth signals from the current intelligence payload."
          icon={TrendingUp}
          count={filteredOpportunities.length}
        >
          {filteredOpportunities.length ? (
            <div className="space-y-3">
              {filteredOpportunities.map((item) => (
                <OpportunityCard key={item.id} item={item} />
              ))}
            </div>
          ) : (
            <EmptyState text="No matching opportunities." />
          )}
        </CommandPanel>

        <CommandPanel
          tone="blue"
          eyebrow="Platform Operations"
          title="Platform Health"
          description="System availability reported to this command layer."
          icon={ShieldCheck}
          count={filteredSystems.length}
        >
          <div className="space-y-2.5">
            {filteredSystems.map((system) => (
              <SystemHealthRow key={system.id} system={system} />
            ))}
          </div>
        </CommandPanel>
      </div>

      <CollapsibleCommandSection
        tone="navy"
        eyebrow="Leadership Guidance"
        title="Executive Recommendations"
        description="Read-only recommendations. Review underlying operating data before acting."
        open={showRecommendations}
        onToggle={() => setShowRecommendations((current) => !current)}
        count={filteredRecommendations.length}
        icon={Target}
      >
        {filteredRecommendations.length ? (
          <div className="grid gap-3 md:grid-cols-2">
            {filteredRecommendations.map((item, index) => (
              <RecommendationCard
                key={item.id}
                item={item}
                index={index}
              />
            ))}
          </div>
        ) : (
          <EmptyState text="No matching recommendations." />
        )}
      </CollapsibleCommandSection>

      <CollapsibleCommandSection
        tone="orange"
        eyebrow="Signal Feed"
        title="Executive Alert Feed"
        description="Current read-only alert intelligence from the connected payload."
        open={showAlerts}
        onToggle={() => setShowAlerts((current) => !current)}
        count={filteredAlerts.length}
        icon={AlertTriangle}
      >
        {filteredAlerts.length ? (
          <div className="grid gap-3 md:grid-cols-2">
            {filteredAlerts.map((item) => (
              <AlertFeedCard key={item.id} item={item} />
            ))}
          </div>
        ) : (
          <EmptyState text="No matching alerts." />
        )}
      </CollapsibleCommandSection>

      <CollapsibleCommandSection
        tone="navy"
        eyebrow="Automation + Verification"
        title="Operational Coverage Snapshot"
        description="Read-only automation and verification health. Missing payloads display as — rather than fake percentages."
        open={showAutomation}
        onToggle={() => setShowAutomation((current) => !current)}
        count={automationMetrics.length}
        icon={Bot}
      >
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {automationMetrics.map((item) => (
            <AutomationMetricCard key={item.label} {...item} />
          ))}
        </div>
      </CollapsibleCommandSection>

      <div className="rounded-[1.35rem] border-[3px] border-[#234E78] bg-[#EEF4FA] p-4">
        <div className="flex items-start gap-3">
          <ShieldCheck className="mt-0.5 shrink-0 text-[#123865]" size={18} />
          <div>
            <p className="font-black text-[#10233F]">
              Intelligence scope
            </p>
            <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">
              This component now avoids fabricated live business numbers. It
              renders only the snapshot supplied by the parent. Read-only cards
              explain intelligence; the search and refresh controls are the only
              direct interactions in this component.
            </p>
          </div>
        </div>
      </div>
    </section>
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
      <p className="text-[8px] font-black uppercase tracking-[0.08em] text-white">
        {label}
      </p>
      <p className="mt-1 break-words text-xl font-black text-white">
        {value}
      </p>
    </div>
  );
}

function OrangeMetric({ label, value }) {
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

function CommandMetricCard({
  label,
  value,
  detail,
  icon: Icon,
  tone = "navy",
}) {
  return (
    <div
      className={`relative overflow-hidden rounded-[1.5rem] border-[3px] p-4 shadow-[0_10px_28px_rgba(23,36,61,0.06)] ${toneClass(
        tone
      )}`}
    >
      <div className="absolute inset-x-0 top-0 h-1.5 bg-current opacity-70" />

      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="break-words text-[9px] font-black uppercase leading-4 tracking-[0.1em] text-[#10233F]">
            {label}
          </p>
          <p className="mt-3 break-words text-3xl font-black leading-none text-[#10233F]">
            {value}
          </p>
        </div>

        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border-2 border-current/20 bg-white/75">
          <Icon size={17} />
        </span>
      </div>

      <p className="mt-3 min-h-[40px] text-xs font-semibold leading-5 text-slate-600">
        {detail}
      </p>

      <p className="mt-3 text-[9px] font-black uppercase tracking-[0.1em] opacity-70">
        Read-only business signal
      </p>
    </div>
  );
}

function CommandPanel({
  eyebrow,
  title,
  description,
  icon: Icon,
  tone = "navy",
  count = 0,
  children,
}) {
  return (
    <section
      className={`overflow-hidden rounded-[1.75rem] border-[3px] bg-[#FFFDF8] shadow-[0_12px_32px_rgba(23,36,61,0.065)] ${outerBorder(
        tone
      )}`}
    >
      <div className="flex items-start justify-between gap-3 border-b-[3px] border-orange-400 bg-[#123865] px-5 py-4 text-white">
        <div>
          <p className="text-[9px] font-black uppercase tracking-[0.14em] text-orange-300">
            {eyebrow}
          </p>
          <h2 className="mt-1 text-lg font-black text-white">
            {title}
          </h2>
          <p className="mt-1 text-xs font-semibold leading-5 text-white/80">
            {description}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <span className="rounded-lg border-2 border-white/20 bg-white/10 px-2.5 py-1 text-xs font-black text-white">
            {count}
          </span>
          <span className={`flex h-10 w-10 items-center justify-center rounded-xl border-2 bg-white ${toneClass(tone)}`}>
            <Icon size={17} />
          </span>
        </div>
      </div>

      <div className="p-4">{children}</div>
    </section>
  );
}

function RiskCard({ risk }) {
  const tone = getRiskTone(risk.severity);

  return (
    <div
      className={`rounded-[1.2rem] border-[3px] bg-white p-4 ${outerBorder(
        tone
      )}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="break-words font-black leading-5 text-[#10233F]">
            {risk.title}
          </p>
          <p className="mt-2 text-xs font-semibold leading-5 text-slate-600">
            {risk.detail}
          </p>
        </div>

        <span className={`shrink-0 rounded-lg border-2 px-3 py-1.5 text-[9px] font-black uppercase ${toneClass(tone)}`}>
          {risk.severity}
        </span>
      </div>
    </div>
  );
}

function OpportunityCard({ item }) {
  return (
    <div className="rounded-[1.2rem] border-[3px] border-emerald-400 bg-emerald-50 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="break-words font-black leading-5 text-[#10233F]">
            {item.title}
          </p>
          <p className="mt-2 text-xs font-semibold leading-5 text-slate-600">
            {item.detail}
          </p>
        </div>

        {item.value !== null ? (
          <span className="shrink-0 rounded-xl border-2 border-emerald-400 bg-white px-3 py-2 text-sm font-black text-emerald-800">
            {item.value}
          </span>
        ) : (
          <Rocket className="shrink-0 text-emerald-700" size={18} />
        )}
      </div>
    </div>
  );
}

function SystemHealthRow({ system }) {
  const clean = normalize(system.status);
  const live =
    ["live", "healthy", "connected", "operational", "ready"].some((value) =>
      clean.includes(value)
    );

  const unknown =
    clean.includes("not connected") ||
    clean.includes("unknown") ||
    clean.includes("unavailable");

  return (
    <div
      className={`rounded-[1.05rem] border-2 p-3 ${
        live
          ? "border-emerald-300 bg-emerald-50"
          : unknown
          ? "border-slate-300 bg-slate-50"
          : "border-orange-300 bg-orange-50"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="break-words text-sm font-black text-[#10233F]">
            {system.name}
          </p>
          <p className="mt-1 text-[10px] font-semibold leading-4 text-slate-600">
            {system.detail}
          </p>
        </div>

        <span
          className={`shrink-0 rounded-lg border-2 px-2.5 py-1 text-[8px] font-black uppercase ${
            live
              ? "border-emerald-300 bg-white text-emerald-800"
              : unknown
              ? "border-slate-300 bg-white text-slate-600"
              : "border-orange-300 bg-white text-orange-800"
          }`}
        >
          {system.status}
        </span>
      </div>
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
  children,
}) {
  return (
    <section
      className={`overflow-hidden rounded-[1.8rem] border-[3px] bg-[#FFF8EE] shadow-[0_12px_30px_rgba(23,36,61,0.06)] ${outerBorder(
        tone
      )}`}
    >
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-4 border-b-[3px] border-orange-400 bg-[#123865] px-5 py-4 text-left text-white transition hover:bg-[#0F3158]"
      >
        <div className="flex items-start gap-3">
          <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border-2 bg-white ${toneClass(tone)}`}>
            <Icon size={17} />
          </span>

          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.14em] text-orange-300">
              {eyebrow}
            </p>
            <h3 className="mt-0.5 text-xl font-black text-white">
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

function RecommendationCard({ item, index }) {
  return (
    <div className="rounded-[1.2rem] border-[3px] border-orange-300 bg-orange-50 p-4">
      <div className="flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border-2 border-orange-300 bg-white text-sm font-black text-orange-800">
          {index + 1}
        </span>

        <div className="min-w-0">
          <p className="break-words font-black leading-5 text-[#10233F]">
            {item.title}
          </p>
          <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">
            {item.detail}
          </p>
        </div>
      </div>
    </div>
  );
}

function AlertFeedCard({ item }) {
  const tone = getRiskTone(item.status);

  return (
    <div
      className={`rounded-[1.2rem] border-[3px] bg-white p-4 ${outerBorder(
        tone
      )}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="break-words font-black leading-5 text-[#10233F]">
            {item.title}
          </p>
          <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">
            {item.detail}
          </p>
        </div>

        <span className={`shrink-0 rounded-lg border-2 px-2.5 py-1 text-[8px] font-black uppercase ${toneClass(tone)}`}>
          {item.status}
        </span>
      </div>
    </div>
  );
}

function AutomationMetricCard({
  label,
  value,
  detail,
  tone,
  icon: Icon,
}) {
  return (
    <div
      className={`rounded-[1.3rem] border-[3px] p-4 ${toneClass(
        tone
      )}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="break-words text-[9px] font-black uppercase leading-4 tracking-[0.1em] text-[#10233F]">
            {label}
          </p>
          <p className="mt-2 break-words text-3xl font-black text-[#10233F]">
            {value}
          </p>
        </div>

        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border-2 border-current/20 bg-white/75">
          <Icon size={17} />
        </span>
      </div>

      <p className="mt-3 text-xs font-semibold leading-5 text-slate-600">
        {detail}
      </p>
    </div>
  );
}

function EmptyState({ text }) {
  return (
    <div className="rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 p-5 text-center">
      <Sparkles className="mx-auto text-orange-600" size={20} />
      <p className="mt-2 text-sm font-bold text-slate-600">
        {text}
      </p>
    </div>
  );
}

function toneClass(tone = "navy") {
  if (tone === "red") return "border-red-400 bg-red-50 text-red-800";
  if (tone === "orange") return "border-orange-400 bg-orange-50 text-orange-800";
  if (tone === "green") return "border-emerald-400 bg-emerald-50 text-emerald-800";
  if (tone === "blue") return "border-blue-400 bg-blue-50 text-blue-800";
  return "border-[#234E78] bg-[#EEF4FA] text-[#123865]";
}

function outerBorder(tone = "navy") {
  if (tone === "red") return "border-red-400";
  if (tone === "orange") return "border-orange-400";
  if (tone === "green") return "border-emerald-400";
  if (tone === "blue") return "border-blue-400";
  return "border-[#234E78]";
}

export default AICommandCenter;
