// ExecutiveCopilot V3 EXTREME — Zaifan AI Command OS
// Full replacement for:
// src/components/admin/ai-command/ExecutiveCopilot.jsx
//
// Production rules:
// - no fabricated executive summaries, student counts, revenue, growth or compliance claims
// - Ask only becomes active when a real onAsk handler is supplied
// - supplied snapshot data may be summarized locally, but never invented
// - suggested prompts are real controls only when onAsk exists
// - tabs expose real snapshot-backed operational context
// - all AI Command modules share one navigation rail
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
//   recoveryActions?: {},
//   recommendations?: [],
//   copilotHistory?: [],
//   updatedAt | generatedAt | lastUpdated,
//   sourceLabel,
// }
// onAsk?: async ({ prompt, context }) => string | { answer, ...meta }
// onRefresh?: async () => void
// onOpenModule?: (moduleId) => void
// onOpenSystem?: (viewId) => void

import React, { useMemo, useState } from "react";
import AICommandModuleNav from "./AICommandModuleNav";
import {
  AlertTriangle,
  ArrowRight,
  Bot,
  Brain,
  BriefcaseBusiness,
  CheckCircle2,
  CircleGauge,
  Clock3,
  Database,
  FileText,
  GraduationCap,
  Info,
  MessageSquareText,
  RefreshCw,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
  Users,
  Workflow,
  X,
  XCircle,
} from "lucide-react";

const TABS = [
  { id: "brief", label: "Executive Brief", icon: Brain },
  { id: "students", label: "Student Intelligence", icon: Users },
  { id: "operations", label: "Operations", icon: Workflow },
  { id: "revenue", label: "Revenue", icon: BriefcaseBusiness },
  { id: "growth", label: "Growth", icon: TrendingUp },
  { id: "compliance", label: "Compliance", icon: ShieldCheck },
];

const SUGGESTED_PROMPTS = [
  "Show top platform risks",
  "Generate executive summary",
  "Identify conversion opportunities",
  "Which students need attention?",
  "Summarize workflow bottlenecks",
  "Show verification blockers",
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

function getJourneyStage(score = {}) {
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

function resolveTitle(item, fallback) {
  if (typeof item === "string") return item;
  return item?.title || item?.name || item?.label || fallback;
}

function resolveDetail(item, fallback) {
  if (typeof item === "string") return fallback;
  return item?.detail || item?.description || item?.message || fallback;
}

export default function ExecutiveCopilot({
  snapshot = {},
  onAsk,
  onRefresh,
  onOpenModule,
  onOpenSystem,
}) {
  const [prompt, setPrompt] = useState("");
  const [activeTab, setActiveTab] = useState("brief");
  const [asking, setAsking] = useState(false);
  const [answer, setAnswer] = useState("");
  const [askError, setAskError] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [refreshError, setRefreshError] = useState("");
  const [search, setSearch] = useState("");

  const scores = useMemo(
    () => safeArray(snapshot.scores || snapshot.students),
    [snapshot.scores, snapshot.students]
  );

  const recommendations = useMemo(
    () =>
      safeArray(snapshot.recommendations).map((item, index) => ({
        id: item?.id || `recommendation-${index}`,
        title: resolveTitle(item, `Recommendation ${index + 1}`),
        detail: resolveDetail(
          item,
          "No recommendation detail supplied."
        ),
        priority:
          typeof item === "string"
            ? ""
            : item?.priority || item?.severity || item?.level || "",
        source:
          typeof item === "string"
            ? ""
            : item?.source || item?.module || "",
      })),
    [snapshot.recommendations]
  );

  const localContext = useMemo(() => {
    const commandMetrics = snapshot.commandMetrics || {};
    const operations = snapshot.operations || {};
    const alerts = snapshot.alertSnapshot || {};
    const workflowScanner = snapshot.workflowScanner || {};
    const workflowIntegrity = snapshot.workflowIntegrity || {};
    const productionReadiness = snapshot.productionReadiness || {};

    const applications = scores.filter((score) =>
      ["application started", "application submitted", "application under review"].includes(getJourneyStage(score))
    ).length;

    const offers = scores.filter((score) =>
      ["offer received", "offer accepted"].includes(getJourneyStage(score))
    ).length;

    const visaWatch = scores.filter((score) =>
      ["cas pending", "cas issued", "visa pending", "visa rejected"].includes(getJourneyStage(score))
    ).length;

    const approved = scores.filter((score) =>
      ["visa approved", "enrolled"].includes(getJourneyStage(score))
    ).length;

    return {
      students: scores.length,
      applications,
      offers,
      visaWatch,
      approved,
      critical: hasValue(commandMetrics.critical)
        ? commandMetrics.critical
        : alerts.critical,
      executivePriority: commandMetrics.executivePriority,
      conversionReady: commandMetrics.conversionReady,
      averageRisk: commandMetrics.averageRisk,
      averageOpportunity: commandMetrics.averageOpportunity,
      pendingTasks: operations?.today?.pendingTasks,
      overdueTasks: operations?.today?.overdueTasks,
      communicationFollowups: operations?.today?.communicationFollowups,
      documentFollowups: operations?.today?.documentFollowups,
      visaFollowups: operations?.today?.visaFollowups,
      conversionReadyRevenue: operations?.revenue?.conversionReady,
      paymentRisk: operations?.revenue?.paymentRiskStudents,
      workflowIntegrity: workflowIntegrity?.overallIntegrity,
      brokenWorkflows: workflowScanner?.totalBrokenWorkflows,
      productionReadiness: productionReadiness?.readinessScore,
      goLiveStatus: productionReadiness?.goLiveStatus,
      criticalAlerts: alerts?.critical,
      totalAlerts: alerts?.total,
    };
  }, [scores, snapshot]);

  const briefItems = useMemo(() => {
    const items = [];

    if (hasValue(localContext.critical)) {
      items.push({
        label: "Critical risk",
        value: formatCount(localContext.critical),
        detail: "Students currently classified as critical by the loaded executive portfolio.",
        tone: safeNumber(localContext.critical) > 0 ? "red" : "green",
      });
    }

    if (hasValue(localContext.conversionReady)) {
      items.push({
        label: "Conversion ready",
        value: formatCount(localContext.conversionReady),
        detail: "Students currently positioned in conversion-ready journey stages.",
        tone: "green",
      });
    }

    if (hasValue(localContext.overdueTasks)) {
      items.push({
        label: "Overdue tasks",
        value: formatCount(localContext.overdueTasks),
        detail: "Overdue tasks derived from the loaded executive score portfolio.",
        tone: safeNumber(localContext.overdueTasks) > 0 ? "orange" : "green",
      });
    }

    if (hasValue(localContext.workflowIntegrity)) {
      items.push({
        label: "Workflow integrity",
        value: formatPercent(localContext.workflowIntegrity),
        detail: "Integrity score from the platform verification engine.",
        tone: safeNumber(localContext.workflowIntegrity) >= 75 ? "green" : "orange",
      });
    }

    return items;
  }, [localContext]);

  const tabData = useMemo(
    () => ({
      students: [
        {
          label: "Students Scored",
          value: formatCount(localContext.students),
          detail: "Current executive portfolio records.",
          tone: "blue",
        },
        {
          label: "Applications",
          value: formatCount(localContext.applications),
          detail: "Current application-stage students.",
          tone: "navy",
        },
        {
          label: "Offers",
          value: formatCount(localContext.offers),
          detail: "Students with received or accepted offers.",
          tone: "green",
        },
        {
          label: "Visa/CAS Watch",
          value: formatCount(localContext.visaWatch),
          detail: "Students in CAS or visa watch stages.",
          tone: localContext.visaWatch > 0 ? "orange" : "green",
        },
        {
          label: "Approved / Enrolled",
          value: formatCount(localContext.approved),
          detail: "Observed approved or enrolled outcomes.",
          tone: "green",
        },
      ],
      operations: [
        {
          label: "Pending Tasks",
          value: formatCount(localContext.pendingTasks),
          detail: "Open tasks reported by Executive Operations.",
          tone: "blue",
        },
        {
          label: "Overdue Tasks",
          value: formatCount(localContext.overdueTasks),
          detail: "Overdue work requiring team attention.",
          tone: safeNumber(localContext.overdueTasks) > 0 ? "orange" : "green",
        },
        {
          label: "Communication Follow-ups",
          value: formatCount(localContext.communicationFollowups),
          detail: "Students needing communication follow-up.",
          tone: "blue",
        },
        {
          label: "Document Follow-ups",
          value: formatCount(localContext.documentFollowups),
          detail: "Students with weak document readiness.",
          tone: "orange",
        },
        {
          label: "Visa Follow-ups",
          value: formatCount(localContext.visaFollowups),
          detail: "Students currently requiring visa/CAS follow-up.",
          tone: "orange",
        },
      ],
      revenue: [
        {
          label: "Conversion Ready",
          value: formatCount(localContext.conversionReadyRevenue),
          detail: "Operational conversion-ready proxy; not booked revenue.",
          tone: "green",
        },
        {
          label: "Payment Risk Watch",
          value: formatCount(localContext.paymentRisk),
          detail: "Students currently flagged for collection/payment pressure.",
          tone: safeNumber(localContext.paymentRisk) > 0 ? "orange" : "green",
        },
      ],
      growth: [
        {
          label: "Executive Priority",
          value: formatCount(localContext.executivePriority),
          detail: "High-risk/high-opportunity records requiring leadership review.",
          tone: "orange",
        },
        {
          label: "Average Opportunity",
          value: formatCount(localContext.averageOpportunity),
          detail: "Average opportunity score from the loaded portfolio.",
          tone: "green",
        },
        {
          label: "Conversion Ready",
          value: formatCount(localContext.conversionReady),
          detail: "Current conversion-ready student count.",
          tone: "green",
        },
      ],
      compliance: [
        {
          label: "Production Readiness",
          value: formatPercent(localContext.productionReadiness),
          detail: "Readiness score from the production verification engine.",
          tone: safeNumber(localContext.productionReadiness) >= 75 ? "green" : "orange",
        },
        {
          label: "Workflow Integrity",
          value: formatPercent(localContext.workflowIntegrity),
          detail: "Workflow integrity from verification checks.",
          tone: safeNumber(localContext.workflowIntegrity) >= 75 ? "green" : "orange",
        },
        {
          label: "Broken Workflows",
          value: formatCount(localContext.brokenWorkflows),
          detail: "Broken workflow count from the workflow scanner.",
          tone: safeNumber(localContext.brokenWorkflows) > 0 ? "red" : "green",
        },
      ],
    }),
    [localContext]
  );

  const query = normalize(search);

  const filteredRecommendations = useMemo(
    () =>
      recommendations.filter((item) =>
        normalize(
          [item.title, item.detail, item.priority, item.source].join(" ")
        ).includes(query)
      ),
    [recommendations, query]
  );

  const hasAsk = typeof onAsk === "function";
  const hasRefresh = typeof onRefresh === "function";

  const sourceLabel =
    safeText(snapshot.sourceLabel).trim() || "Executive snapshot";

  const updatedAt =
    snapshot.generatedAt || snapshot.updatedAt || snapshot.lastUpdated || null;

  const handleAsk = async (overridePrompt) => {
    const nextPrompt = safeText(overridePrompt ?? prompt).trim();

    if (!hasAsk || asking || !nextPrompt) return;

    setAsking(true);
    setAskError("");
    setAnswer("");

    try {
      const result = await onAsk({
        prompt: nextPrompt,
        context: {
          snapshot,
          localContext,
        },
      });

      const nextAnswer =
        typeof result === "string"
          ? result
          : result?.answer || result?.message || result?.text || "";

      if (!nextAnswer) {
        throw new Error("The connected copilot returned no answer.");
      }

      setAnswer(nextAnswer);
      setPrompt("");
    } catch (error) {
      console.error("Executive Copilot request failed:", error);
      setAskError(
        error?.message || "Executive Copilot could not answer the request."
      );
    } finally {
      setAsking(false);
    }
  };

  const handleSuggestedPrompt = (value) => {
    setPrompt(value);

    if (hasAsk) {
      void handleAsk(value);
    }
  };

  const handleRefresh = async () => {
    if (!hasRefresh || refreshing) return;

    setRefreshing(true);
    setRefreshError("");

    try {
      await onRefresh();
    } catch (error) {
      console.error("Executive Copilot refresh failed:", error);
      setRefreshError(
        error?.message || "Executive Copilot could not refresh."
      );
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <section className="space-y-4 p-3 sm:space-y-5 sm:p-5">
      <AICommandModuleNav
        activeModule="executive-copilot"
        onOpenModule={onOpenModule}
      />

      <header className="overflow-hidden rounded-[1.8rem] border-[3px] border-orange-400 bg-[#FFF8EE] shadow-[0_18px_48px_rgba(23,36,61,0.09)]">
        <div className="grid xl:grid-cols-[minmax(0,1.5fr)_minmax(300px,0.5fr)]">
          <div className="bg-[#123865] p-5 text-white sm:p-7">
            <div className="flex flex-wrap items-center gap-2">
              <HeaderChip icon={Bot} label="Executive Copilot" />
              <HeaderChip icon={ShieldCheck} label="Human Controlled" />
              <HeaderChip icon={Database} label={sourceLabel} />
            </div>

            <div className="mt-4 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
              <div className="max-w-4xl">
                <h1 className="text-2xl font-black tracking-[-0.03em] text-white sm:text-3xl">
                  Executive Decision Copilot
                </h1>

                <p className="mt-2 text-sm font-semibold leading-6 text-white/90 sm:text-[15px]">
                  Ask leadership questions against real Zaifan operating
                  context, inspect the portfolio, and separate genuine executive
                  intelligence from unsupported AI claims.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:min-w-[420px]">
                <DarkMetric label="Students" value={formatCount(localContext.students)} />
                <DarkMetric label="Critical" value={formatCount(localContext.critical)} />
                <DarkMetric label="Ready" value={formatCount(localContext.conversionReady)} />
                <DarkMetric label="Alerts" value={formatCount(localContext.totalAlerts)} />
              </div>
            </div>
          </div>

          <div className="border-t-[3px] border-orange-300 bg-orange-500 p-5 text-white xl:border-l-[3px] xl:border-t-0 sm:p-7">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <CircleGauge size={18} />
                  <p className="text-[9px] font-black uppercase tracking-[0.12em] text-white">
                    Copilot connection
                  </p>
                </div>

                <p className="mt-3 text-4xl font-black leading-none text-white">
                  {hasAsk ? "READY" : "OFF"}
                </p>

                <p className="mt-2 text-xs font-black uppercase tracking-[0.09em] text-white">
                  {hasAsk
                    ? "Real ask handler connected"
                    : "No AI handler connected"}
                </p>
              </div>

              <span className="flex h-12 w-12 items-center justify-center rounded-2xl border-2 border-white/30 bg-white/10">
                <Brain size={22} />
              </span>
            </div>

            <div className="mt-5 rounded-2xl border-2 border-white/25 bg-white/10 p-3">
              <p className="text-[9px] font-black uppercase tracking-[0.1em] text-white">
                Data freshness
              </p>

              <p className="mt-2 text-xs font-black text-white">
                {formatTimestamp(updatedAt)}
              </p>

              <p className="mt-1 text-[10px] font-semibold leading-4 text-white/85">
                The copilot receives the current Executive snapshot when a real
                request handler is connected.
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
                placeholder="Search recommendations and executive context..."
                aria-label="Search Executive Copilot context"
                className="min-h-12 w-full rounded-xl border-2 border-slate-300 bg-white py-2.5 pl-11 pr-11 text-sm font-semibold text-[#10233F] outline-none transition placeholder:text-slate-400 focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
              />

              {search ? (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  aria-label="Clear Executive Copilot search"
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
                  ? "Refresh Context"
                  : "Refresh Not Connected"}
            </button>
          </div>
        </div>
      </header>

      {refreshError ? (
        <InlineNotice
          tone="red"
          icon={XCircle}
          title="Copilot context refresh failed"
          detail={refreshError}
          actionLabel="Dismiss"
          onAction={() => setRefreshError("")}
        />
      ) : null}

      {!hasAsk ? (
        <InlineNotice
          tone="blue"
          icon={Info}
          title="Executive AI is not connected yet"
          detail="The Ask button and suggested prompts stay safely disabled until ExecutiveCommandSystem supplies a real onAsk handler. Snapshot-backed tabs below remain useful without AI."
        />
      ) : null}

      <section className="overflow-hidden rounded-[1.75rem] border-[3px] border-[#234E78] bg-[#FFFDF8]">
        <SectionHeader
          eyebrow="Human → AI"
          title="Ask Executive Copilot"
          description="Questions are sent only through the real parent-provided AI handler."
          icon={MessageSquareText}
          count={hasAsk ? 1 : 0}
        />

        <div className="p-4 sm:p-5">
          <div className="flex flex-col gap-3 lg:flex-row">
            <textarea
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              placeholder={
                hasAsk
                  ? "Ask about risks, operations, workflow, readiness or current portfolio..."
                  : "Connect onAsk before using Executive Copilot..."
              }
              disabled={!hasAsk || asking}
              rows={3}
              className="min-h-[92px] flex-1 resize-y rounded-xl border-2 border-slate-300 bg-white px-4 py-3 text-sm font-semibold leading-6 text-[#10233F] outline-none transition placeholder:text-slate-400 focus:border-orange-400 focus:ring-4 focus:ring-orange-100 disabled:cursor-not-allowed disabled:bg-slate-100"
            />

            <button
              type="button"
              onClick={() => void handleAsk()}
              disabled={!hasAsk || asking || !prompt.trim()}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border-2 border-orange-500 bg-orange-500 px-6 text-xs font-black text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:border-slate-300 disabled:bg-slate-200 disabled:text-slate-500 lg:self-stretch"
            >
              <Send size={15} />
              {asking ? "Thinking..." : hasAsk ? "Ask Copilot" : "AI Not Connected"}
            </button>
          </div>

          <div className="mt-4 flex max-w-full gap-2 overflow-x-auto pb-1">
            {SUGGESTED_PROMPTS.map((item) => (
              <button
                key={item}
                type="button"
                disabled={!hasAsk || asking}
                onClick={() => handleSuggestedPrompt(item)}
                className="shrink-0 rounded-full border-2 border-slate-300 bg-white px-3 py-2 text-[10px] font-black text-[#10233F] transition hover:border-orange-400 hover:bg-orange-50 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
              >
                {item}
              </button>
            ))}
          </div>

          {askError ? (
            <div className="mt-4 rounded-xl border-2 border-red-300 bg-red-50 p-4">
              <div className="flex items-start gap-3">
                <XCircle size={17} className="mt-0.5 shrink-0 text-red-700" />
                <div>
                  <p className="font-black text-[#10233F]">Copilot request failed</p>
                  <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">
                    {askError}
                  </p>
                </div>
              </div>
            </div>
          ) : null}

          {answer ? (
            <div className="mt-4 rounded-[1.35rem] border-[3px] border-orange-300 bg-orange-50 p-5">
              <div className="flex items-start gap-3">
                <Bot size={20} className="mt-0.5 shrink-0 text-orange-700" />
                <div className="min-w-0">
                  <p className="text-[9px] font-black uppercase tracking-[0.1em] text-orange-800">
                    Executive Copilot Answer
                  </p>
                  <p className="mt-2 whitespace-pre-wrap text-sm font-semibold leading-6 text-[#10233F]">
                    {answer}
                  </p>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </section>

      <div className="flex max-w-full gap-2 overflow-x-auto pb-1">
        {TABS.map((tab) => {
          const Icon = tab.icon;

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              aria-pressed={activeTab === tab.id}
              className={`inline-flex min-h-11 shrink-0 items-center gap-2 rounded-xl border-2 px-4 text-[10px] font-black transition ${
                activeTab === tab.id
                  ? "border-[#123865] bg-[#123865] text-white"
                  : "border-slate-300 bg-white text-[#10233F] hover:border-orange-300 hover:bg-orange-50"
              }`}
            >
              <Icon size={14} />
              {tab.label}
            </button>
          );
        })}
      </div>

      <CopilotTabPanel
        activeTab={activeTab}
        briefItems={briefItems}
        tabData={tabData}
        localContext={localContext}
        onOpenSystem={onOpenSystem}
      />

      <section className="overflow-hidden rounded-[1.75rem] border-[3px] border-orange-400 bg-[#FFF8EE]">
        <SectionHeader
          eyebrow="Leadership Guidance"
          title="Connected Recommendations"
          description="Recommendations appear only when the parent supplies real recommendation records."
          icon={Target}
          count={filteredRecommendations.length}
        />

        <div className="p-4 sm:p-5">
          {filteredRecommendations.length ? (
            <div className="grid gap-3 md:grid-cols-2">
              {filteredRecommendations.map((item, index) => (
                <article
                  key={item.id}
                  className="rounded-xl border-2 border-orange-300 bg-white p-4"
                >
                  <div className="flex items-start gap-3">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border-2 border-orange-300 bg-orange-50 text-xs font-black text-orange-800">
                      {index + 1}
                    </span>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-black text-[#10233F]">{item.title}</p>
                        {item.source ? <SourceBadge source={item.source} /> : null}
                      </div>
                      <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">
                        {item.detail}
                      </p>
                      {item.priority ? (
                        <p className="mt-2 text-[9px] font-black uppercase tracking-[0.07em] text-orange-800">
                          Priority: {item.priority}
                        </p>
                      ) : null}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <EmptyState
              title={query ? "No recommendations match this search" : "No recommendations connected"}
              text={
                query
                  ? "Try another search term."
                  : "The copilot will not invent leadership recommendations. Connect snapshot.recommendations to populate this area."
              }
              onClear={query ? () => setSearch("") : undefined}
            />
          )}
        </div>
      </section>

      <footer className="grid gap-3 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-[1.35rem] border-[3px] border-[#234E78] bg-[#EEF4FA] p-4">
          <div className="flex items-start gap-3">
            <ShieldCheck size={18} className="mt-0.5 shrink-0 text-[#123865]" />
            <div>
              <p className="font-black text-[#10233F]">Copilot integrity</p>
              <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">
                The old template's fake revenue, growth, counselor capacity,
                compliance and visa claims are gone. Snapshot tabs now show
                only loaded Executive data.
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-[1.35rem] border-[3px] border-orange-400 bg-orange-50 p-4">
          <div className="flex items-start gap-3">
            <Brain size={18} className="mt-0.5 shrink-0 text-orange-700" />
            <div>
              <p className="font-black text-[#10233F]">Human-controlled AI</p>
              <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">
                A real AI response can only be produced through onAsk. Without
                it, the component remains an honest read-only executive
                workspace.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </section>
  );
}

function CopilotTabPanel({
  activeTab,
  briefItems,
  tabData,
  localContext,
  onOpenSystem,
}) {
  if (activeTab === "brief") {
    return (
      <section className="overflow-hidden rounded-[1.75rem] border-[3px] border-[#234E78] bg-[#FFFDF8]">
        <SectionHeader
          eyebrow="Executive Snapshot"
          title="Evidence-Based Executive Brief"
          description="A local summary of the currently loaded Executive portfolio."
          icon={Brain}
          count={briefItems.length}
        />

        <div className="p-4 sm:p-5">
          {briefItems.length ? (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              {briefItems.map((item) => (
                <ContextCard key={item.label} {...item} />
              ))}
            </div>
          ) : (
            <EmptyState
              title="No executive brief data available"
              text="Load Executive scores and verification data to populate the brief."
            />
          )}

          <div className="mt-4 rounded-xl border-2 border-slate-300 bg-slate-50 p-4">
            <p className="font-black text-[#10233F]">What this brief does not do</p>
            <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">
              It does not claim application growth, revenue above target, stable
              visa outcomes or automation success unless those facts exist in
              the supplied snapshot.
            </p>
          </div>
        </div>
      </section>
    );
  }

  const items = tabData[activeTab] || [];

  return (
    <section className="overflow-hidden rounded-[1.75rem] border-[3px] border-[#234E78] bg-[#FFFDF8]">
      <SectionHeader
        eyebrow="Executive Context"
        title={TABS.find((tab) => tab.id === activeTab)?.label || "Executive Context"}
        description="Read-only operational context derived from the loaded Executive snapshot."
        icon={TABS.find((tab) => tab.id === activeTab)?.icon || Brain}
        count={items.length}
      />

      <div className="p-4 sm:p-5">
        {items.length ? (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {items.map((item) => (
              <ContextCard key={item.label} {...item} />
            ))}
          </div>
        ) : (
          <EmptyState
            title="No connected data for this tab"
            text="The required Executive snapshot fields are not available yet."
          />
        )}

        {typeof onOpenSystem === "function" ? (
          <div className="mt-4 flex flex-wrap gap-2">
            {activeTab === "operations" ? (
              <SystemAction label="Open Operations" onClick={() => onOpenSystem("operations")} />
            ) : null}
            {activeTab === "compliance" ? (
              <SystemAction label="Open Verification" onClick={() => onOpenSystem("verification")} />
            ) : null}
            {activeTab === "growth" ? (
              <SystemAction label="Open Founder Growth" onClick={() => onOpenSystem("founder-growth")} />
            ) : null}
          </div>
        ) : null}
      </div>
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

function SourceBadge({ source }) {
  return (
    <span className="inline-flex max-w-full truncate rounded-md border border-slate-300 bg-slate-50 px-2 py-0.5 text-[8px] font-black uppercase tracking-[0.06em] text-slate-600">
      {source}
    </span>
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
          Clear search
        </button>
      ) : null}
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
