import { useEffect, useMemo, useState } from "react";
import ExecutiveScoreGeneratorPanel from "./ExecutiveScoreGeneratorPanel";
import ExecutiveAlertsPanel from "./ExecutiveAlertsPanel";
import ExecutiveActionQueue from "./ExecutiveActionQueue";
import ExecutiveAutomationEngine from "./ExecutiveAutomationEngine";
import ExecutiveActionExecutorPanel from "./ExecutiveActionExecutorPanel";
import ExecutivePortfolioSummary from "./ExecutivePortfolioSummary";
import ExecutiveAutomationAnalytics from "./ExecutiveAutomationAnalytics";
import ExecutiveAIDashboard from "./ExecutiveAIDashboard";
import { getExecutiveScoreSummary } from "../../lib/executivePortfolioGenerator";

function normalize(value = "") {
  return String(value || "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "_")
    .replace(/-/g, "_");
}

function number(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function formatLabel(value = "") {
  const clean = normalize(value);
  if (!clean) return "Unknown";
  return clean
    .split("_")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function getJourneyStage(score = {}) {
  const direct = normalize(score.journey_stage || score?.diagnostics?.journey_stage);
  if (direct) return direct;

  const applicationStatus = normalize(score.application_status);
  const offerStatus = normalize(score.offer_status);
  const visaStatus = normalize(score.visa_status);

  if (applicationStatus === "enrolled") return "enrolled";
  if (["visa_approved", "approved"].includes(visaStatus)) return "visa_approved";
  if (["visa_rejected", "rejected", "refused", "visa_refused"].includes(visaStatus)) return "visa_rejected";
  if (["visa_pending", "pending", "submitted", "under_review", "review", "processing"].includes(visaStatus)) return "visa_pending";
  if (applicationStatus === "cas_issued") return "cas_issued";
  if (applicationStatus === "cas_pending") return "cas_pending";
  if (["offer_accepted", "accepted", "confirmed"].includes(applicationStatus) || ["offer_accepted", "accepted", "confirmed"].includes(offerStatus)) return "offer_accepted";
  if (["offer_received", "offer", "received", "conditional_offer", "unconditional_offer"].includes(applicationStatus) || ["offer_received", "offer", "received", "conditional_offer", "unconditional_offer"].includes(offerStatus)) return "offer_received";
  if (["under_review", "review", "processing"].includes(applicationStatus)) return "application_under_review";
  if (["applied", "submitted"].includes(applicationStatus)) return "application_submitted";
  if (["started", "in_progress", "draft"].includes(applicationStatus)) return "application_started";
  return "not_started";
}

function getScoreValue(score = {}, key, fallback = 0) {
  return score?.[key] ?? score?.diagnostics?.[key] ?? fallback;
}

function getStudentName(score = {}) {
  return score.student_name || score.full_name || score.name || "Unknown Student";
}

function buildCommandMetrics(scores = []) {
  const total = scores.length;

  const critical = scores.filter(
    (score) =>
      normalize(score.executive_category) === "critical_risk" ||
      normalize(score.risk_level) === "critical" ||
      number(score.risk_score) >= 85
  ).length;

  const executivePriority = scores.filter(
    (score) =>
      normalize(score.priority_level) === "executive" ||
      number(score.risk_score) >= 85 ||
      number(score.opportunity_score) >= 85
  ).length;

  const conversionReady = scores.filter((score) => {
    const category = normalize(score.executive_category);
    const stage = getJourneyStage(score);
    return (
      category === "conversion_ready" ||
      ["offer_accepted", "cas_pending", "cas_issued", "visa_pending"].includes(stage)
    );
  }).length;

  const visaWatch = scores.filter((score) =>
    ["cas_pending", "cas_issued", "visa_pending", "visa_rejected"].includes(getJourneyStage(score))
  ).length;

  const successStories = scores.filter(
    (score) =>
      normalize(score.executive_category) === "success_story" ||
      getJourneyStage(score) === "visa_approved" ||
      getJourneyStage(score) === "enrolled"
  ).length;

  const averageRisk = total
    ? Math.round(scores.reduce((sum, score) => sum + number(score.risk_score), 0) / total)
    : 0;

  const averageOpportunity = total
    ? Math.round(scores.reduce((sum, score) => sum + number(score.opportunity_score), 0) / total)
    : 0;

  return {
    total,
    critical,
    executivePriority,
    conversionReady,
    visaWatch,
    successStories,
    averageRisk,
    averageOpportunity,
  };
}

function buildOperationsCenter(scores = []) {
  const stages = {
    notStarted: 0,
    started: 0,
    applied: 0,
    offer: 0,
    cas: 0,
    visa: 0,
    approved: 0,
  };

  const watchlist = {
    criticalRisk: [],
    casDelays: [],
    visaDelays: [],
    documentWeakness: [],
    taskProblems: [],
    universityGaps: [],
    stalled: [],
  };

  const today = {
    pendingApprovals: 0,
    pendingTasks: 0,
    overdueTasks: 0,
    documentFollowups: 0,
    visaFollowups: 0,
    universityFollowups: 0,
    communicationFollowups: 0,
  };

  const revenue = {
    paymentRiskStudents: 0,
    conversionReady: 0,
    offerAccepted: 0,
    visaReadySoon: 0,
    successStudents: 0,
  };

  const health = {
    applications: 0,
    universities: 0,
    visa: 0,
    documents: 0,
    tasks: 0,
    automation: 0,
  };

  scores.forEach((score) => {
    const stage = getJourneyStage(score);
    const risk = number(score.risk_score);
    const opportunity = number(score.opportunity_score);
    const docs = number(getScoreValue(score, "document_readiness_percent"));
    const taskCompletion = number(getScoreValue(score, "task_completion_percent"));
    const pendingTasks = number(getScoreValue(score, "pending_tasks_count"));
    const overdueTasks = number(getScoreValue(score, "overdue_tasks_count"));
    const universityPlan = number(getScoreValue(score, "university_plan_count"));
    const safeCount = number(getScoreValue(score, "safe_university_count"));
    const daysSinceUpdated = number(getScoreValue(score, "days_since_updated"), -1);
    const automationActions = number(getScoreValue(score, "automation_action_count"));

    if (stage === "not_started") stages.notStarted += 1;
    else if (stage === "application_started") stages.started += 1;
    else if (["application_submitted", "application_under_review"].includes(stage)) stages.applied += 1;
    else if (["offer_received", "offer_accepted"].includes(stage)) stages.offer += 1;
    else if (["cas_pending", "cas_issued"].includes(stage)) stages.cas += 1;
    else if (["visa_pending", "visa_rejected"].includes(stage)) stages.visa += 1;
    else if (["visa_approved", "enrolled"].includes(stage)) stages.approved += 1;

    if (risk >= 85 || normalize(score.executive_category) === "critical_risk") watchlist.criticalRisk.push(score);
    if (stage === "cas_pending" && daysSinceUpdated >= 5) watchlist.casDelays.push(score);
    if (["visa_pending", "visa_rejected"].includes(stage) && (daysSinceUpdated >= 5 || risk >= 65)) watchlist.visaDelays.push(score);
    if (docs < 60) watchlist.documentWeakness.push(score);
    if (overdueTasks > 0 || pendingTasks >= 5 || taskCompletion < 50) watchlist.taskProblems.push(score);
    if (universityPlan === 0 || (universityPlan > 0 && safeCount === 0)) watchlist.universityGaps.push(score);
    if (daysSinceUpdated >= 10 || ["not_started", "application_started"].includes(stage)) watchlist.stalled.push(score);

    if (risk >= 65 || opportunity >= 80) today.pendingApprovals += 1;
    today.pendingTasks += pendingTasks;
    today.overdueTasks += overdueTasks;
    if (docs < 70) today.documentFollowups += 1;
    if (["cas_issued", "visa_pending", "visa_rejected"].includes(stage)) today.visaFollowups += 1;
    if (universityPlan === 0 || safeCount === 0) today.universityFollowups += 1;
    if (daysSinceUpdated >= 10 || opportunity >= 70) today.communicationFollowups += 1;

    if (docs < 60 || overdueTasks > 0) revenue.paymentRiskStudents += 1;
    if (["offer_accepted", "cas_pending", "cas_issued", "visa_pending"].includes(stage)) revenue.conversionReady += 1;
    if (stage === "offer_accepted") revenue.offerAccepted += 1;
    if (["cas_pending", "cas_issued"].includes(stage)) revenue.visaReadySoon += 1;
    if (["visa_approved", "enrolled"].includes(stage)) revenue.successStudents += 1;

    if (!["not_started"].includes(stage)) health.applications += 1;
    if (universityPlan > 0) health.universities += 1;
    if (["cas_issued", "visa_pending", "visa_approved", "enrolled"].includes(stage)) health.visa += 1;
    if (docs >= 60) health.documents += 1;
    if (overdueTasks === 0 && taskCompletion >= 50) health.tasks += 1;
    if (automationActions > 0 || risk >= 35 || opportunity >= 55) health.automation += 1;
  });

  const total = Math.max(scores.length, 1);
  const healthPercent = Object.fromEntries(
    Object.entries(health).map(([key, value]) => [key, Math.round((value / total) * 100)])
  );

  return {
    stages,
    watchlist,
    today,
    revenue,
    health: healthPercent,
    topWatchlist: [
      ...watchlist.criticalRisk,
      ...watchlist.visaDelays,
      ...watchlist.casDelays,
      ...watchlist.taskProblems,
      ...watchlist.documentWeakness,
    ]
      .filter(Boolean)
      .sort((a, b) => number(b.risk_score) - number(a.risk_score))
      .slice(0, 8),
  };
}

function ExecutiveCommandSystem({ adminProfile = null }) {
  const [scores, setScores] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loadingScores, setLoadingScores] = useState(false);
  const [error, setError] = useState("");
  const [showDeveloperTools, setShowDeveloperTools] = useState(false);
  const [activeView, setActiveView] = useState("operations");

  const loadExecutiveScores = async () => {
    setLoadingScores(true);
    setError("");

    try {
      const result = await getExecutiveScoreSummary();

      if (result.error) {
        setError(result.error.message || "Executive scores failed to load.");
        setScores([]);
        setSummary(null);
        return;
      }

      setScores(result.scores || []);
      setSummary(result);
    } catch (err) {
      setError(err.message || "Executive scores crashed while loading.");
      setScores([]);
      setSummary(null);
    } finally {
      setLoadingScores(false);
    }
  };

  useEffect(() => {
    loadExecutiveScores();
  }, []);

  const commandMetrics = useMemo(() => buildCommandMetrics(scores), [scores]);
  const operations = useMemo(() => buildOperationsCenter(scores), [scores]);

  const handleGenerated = async () => {
    await loadExecutiveScores();
  };

  const handleActionExecuted = async () => {
    await loadExecutiveScores();
  };

  return (
    <div className="space-y-6">
      <div className="rounded-[2rem] border border-[#D4AF37]/20 bg-[#D4AF37]/[0.045] p-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.25em] text-[#D4AF37]">
              Executive Operations Center
            </p>

            <h2 className="mt-2 text-3xl font-black text-white">
              Student OS Admin Command Layer
            </h2>

            <p className="mt-2 max-w-3xl text-sm leading-6 text-white/55">
              Unified command view for student journey movement, executive watchlists,
              counselor actions, revenue pressure, automation readiness, and operational health.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={loadExecutiveScores}
              disabled={loadingScores}
              className="rounded-full border border-[#D4AF37]/30 bg-[#D4AF37]/10 px-5 py-2 text-sm font-bold text-[#D4AF37] transition hover:bg-[#D4AF37] hover:text-black disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loadingScores ? "Loading..." : "Reload Scores"}
            </button>

            <button
              type="button"
              onClick={() => setShowDeveloperTools((prev) => !prev)}
              className="rounded-full border border-white/10 bg-white/[0.04] px-5 py-2 text-sm font-bold text-white/55 transition hover:border-[#D4AF37]/30 hover:text-[#D4AF37]"
            >
              {showDeveloperTools ? "Hide Tools" : "Developer Tools"}
            </button>
          </div>
        </div>

        {error ? (
          <div className="mt-5 rounded-2xl border border-red-400/20 bg-red-500/10 p-4 text-sm text-red-300">
            {error}
          </div>
        ) : null}

        <div className="mt-6 grid gap-4 md:grid-cols-3 xl:grid-cols-8">
          <SummaryCard label="Students Scored" value={summary?.total || commandMetrics.total} />
          <SummaryCard label="Critical Risk" value={summary?.criticalRisk || summary?.critical || commandMetrics.critical} tone="red" />
          <SummaryCard label="Executive Priority" value={commandMetrics.executivePriority} tone="gold" />
          <SummaryCard label="Conversion Ready" value={summary?.conversionReady || commandMetrics.conversionReady} tone="gold" />
          <SummaryCard label="Visa/CAS Watch" value={commandMetrics.visaWatch} tone="blue" />
          <SummaryCard label="Success Stories" value={summary?.successStories || commandMetrics.successStories} tone="green" />
          <SummaryCard label="Avg Risk" value={summary?.averageRisk || commandMetrics.averageRisk} tone="orange" />
          <SummaryCard label="Avg Opportunity" value={summary?.averageOpportunity || commandMetrics.averageOpportunity} tone="green" />
        </div>
      </div>

      <CommandTabs activeView={activeView} setActiveView={setActiveView} />

      {activeView === "operations" ? (
        <ExecutiveOperationsCenter operations={operations} totalStudents={scores.length} />
      ) : null}

      {activeView === "intelligence" ? (
        <ExecutiveAIDashboard students={scores} />
      ) : null}

      {activeView === "alerts" ? (
        <ExecutiveAlertsPanel scores={scores} />
      ) : null}

      {activeView === "portfolio" ? (
        <ExecutivePortfolioSummary students={scores} />
      ) : null}

      {activeView === "actions" ? (
        <ExecutiveActionQueue
          scores={scores}
          adminProfile={adminProfile}
          onActionExecuted={handleActionExecuted}
        />
      ) : null}

      {activeView === "automation" ? (
        <ExecutiveAutomationAnalytics adminProfile={adminProfile} />
      ) : null}

      {showDeveloperTools ? (
        <div className="space-y-6 rounded-[2rem] border border-white/10 bg-black/30 p-5">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.25em] text-white/35">
              Developer Tools
            </p>
            <h3 className="mt-2 text-xl font-black text-white">
              Hidden Executive AI Tools
            </h3>
            <p className="mt-2 text-sm text-white/45">
              Useful for generating scores, inspecting automation payloads, and
              executing approved actions. Keep hidden during normal CEO/dashboard use.
            </p>
          </div>

          <ExecutiveScoreGeneratorPanel onGenerated={handleGenerated} />

          <ExecutiveAutomationEngine scores={scores} />

          <ExecutiveActionExecutorPanel
            scores={scores}
            adminProfile={adminProfile}
            onActionExecuted={handleActionExecuted}
          />
        </div>
      ) : null}
    </div>
  );
}

function ExecutiveOperationsCenter({ operations, totalStudents = 0 }) {
  const stageRows = [
    ["Not Started", operations.stages.notStarted, "Students with no active application movement."],
    ["Started", operations.stages.started, "Application started or draft stage."],
    ["Applied", operations.stages.applied, "Submitted or under review applications."],
    ["Offer", operations.stages.offer, "Offer received or accepted."],
    ["CAS", operations.stages.cas, "CAS pending or issued."],
    ["Visa", operations.stages.visa, "Visa pending or recovery watch."],
    ["Approved", operations.stages.approved, "Visa approved or enrolled students."],
  ];

  return (
    <div className="space-y-6">
      <div className="rounded-[2rem] border border-[#D4AF37]/20 bg-[#D4AF37]/[0.045] p-6">
        <p className="text-xs font-black uppercase tracking-[0.25em] text-[#D4AF37]">
          CEO / Counselor Command Screen
        </p>
        <h3 className="mt-2 text-2xl font-black text-white">
          Executive Operations Center
        </h3>
        <p className="mt-2 max-w-4xl text-sm leading-6 text-white/55">
          This screen turns Executive AI scores into a day-to-day operating map:
          where students are, what is blocked, what needs action today, and where
          revenue or visa movement may be at risk.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-7">
        {stageRows.map(([label, value, detail]) => (
          <JourneyStageCard key={label} label={label} value={value} total={totalStudents} detail={detail} />
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-[1.75rem] border border-red-400/20 bg-red-500/[0.04] p-5">
          <SectionHeader
            eyebrow="Executive Watchlist"
            title="Students that need leadership attention"
            description="Risk, CAS, visa, document, task, university, and stalled journey pressure."
          />

          <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            <WatchMetric label="Critical Risk" value={operations.watchlist.criticalRisk.length} tone="red" />
            <WatchMetric label="CAS Delays" value={operations.watchlist.casDelays.length} tone="orange" />
            <WatchMetric label="Visa Delays" value={operations.watchlist.visaDelays.length} tone="red" />
            <WatchMetric label="Weak Documents" value={operations.watchlist.documentWeakness.length} tone="yellow" />
            <WatchMetric label="Task Problems" value={operations.watchlist.taskProblems.length} tone="orange" />
            <WatchMetric label="University Gaps" value={operations.watchlist.universityGaps.length} tone="blue" />
          </div>

          <div className="mt-5 space-y-3">
            {operations.topWatchlist.length ? (
              operations.topWatchlist.map((score, index) => (
                <WatchStudentRow key={`${score.student_id || score.id || index}-${index}`} score={score} />
              ))
            ) : (
              <EmptyState text="No urgent watchlist students detected." />
            )}
          </div>
        </div>

        <div className="space-y-6">
          <TodayActionsPanel today={operations.today} />
          <RevenueCenterPanel revenue={operations.revenue} />
        </div>
      </div>

      <OperationsHealthPanel health={operations.health} />
    </div>
  );
}

function TodayActionsPanel({ today }) {
  const items = [
    ["Pending Approvals", today.pendingApprovals, "Executive/high-risk actions likely requiring approval."],
    ["Pending Tasks", today.pendingTasks, "Open task load across scored students."],
    ["Overdue Tasks", today.overdueTasks, "Tasks that need counselor cleanup."],
    ["Document Follow-ups", today.documentFollowups, "Students with weak document readiness."],
    ["Visa Follow-ups", today.visaFollowups, "Students in CAS/visa watch zones."],
    ["University Follow-ups", today.universityFollowups, "Missing or unbalanced university planning."],
    ["Communication Follow-ups", today.communicationFollowups, "Stale or high-opportunity students to contact."],
  ];

  return (
    <div className="rounded-[1.75rem] border border-[#D4AF37]/20 bg-[#D4AF37]/[0.04] p-5">
      <SectionHeader
        eyebrow="Today's Actions"
        title="Counselor workload map"
        description="Fast view of what the team should clear first."
      />
      <div className="mt-4 grid gap-3">
        {items.map(([label, value, detail]) => (
          <ActionRow key={label} label={label} value={value} detail={detail} />
        ))}
      </div>
    </div>
  );
}

function RevenueCenterPanel({ revenue }) {
  const items = [
    ["Conversion Ready", revenue.conversionReady],
    ["Offer Accepted", revenue.offerAccepted],
    ["Visa Ready Soon", revenue.visaReadySoon],
    ["Success Students", revenue.successStudents],
    ["Payment Risk Watch", revenue.paymentRiskStudents],
  ];

  return (
    <div className="rounded-[1.75rem] border border-emerald-400/20 bg-emerald-500/[0.04] p-5">
      <SectionHeader
        eyebrow="Revenue Center"
        title="Revenue and conversion pressure"
        description="A practical proxy until direct invoice revenue is added to Executive scores."
      />
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {items.map(([label, value]) => (
          <SmallMetric key={label} label={label} value={value} />
        ))}
      </div>
    </div>
  );
}

function OperationsHealthPanel({ health }) {
  const rows = [
    ["Applications", health.applications],
    ["Universities", health.universities],
    ["Visa", health.visa],
    ["Documents", health.documents],
    ["Tasks", health.tasks],
    ["Automation", health.automation],
  ];

  return (
    <div className="rounded-[1.75rem] border border-white/10 bg-white/[0.035] p-5">
      <SectionHeader
        eyebrow="Operations Health"
        title="Student OS module readiness"
        description="Percent of scored students with healthy data or clear automation pressure in each operating system."
      />

      <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {rows.map(([label, value]) => (
          <HealthProgress key={label} label={label} value={value} />
        ))}
      </div>
    </div>
  );
}

function CommandTabs({ activeView, setActiveView }) {
  const tabs = [
    { key: "operations", label: "Operations Center" },
    { key: "intelligence", label: "Intelligence" },
    { key: "alerts", label: "Alerts" },
    { key: "portfolio", label: "Portfolio" },
    { key: "actions", label: "Actions" },
    { key: "automation", label: "Automation Analytics" },
  ];

  return (
    <div className="flex flex-wrap gap-2 rounded-[1.5rem] border border-white/10 bg-black/20 p-2">
      {tabs.map((tab) => {
        const active = activeView === tab.key;

        return (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveView(tab.key)}
            className={`rounded-full px-5 py-2 text-sm font-bold transition ${
              active
                ? "bg-[#D4AF37] text-black"
                : "border border-white/10 bg-white/[0.03] text-white/45 hover:border-[#D4AF37]/25 hover:text-[#D4AF37]"
            }`}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}

function SummaryCard({ label, value, tone = "default" }) {
  const style = getToneStyle(tone);

  return (
    <div className={`rounded-2xl border p-4 ${style}`}>
      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/35">
        {label}
      </p>

      <p className="mt-3 text-3xl font-black text-white">{value || 0}</p>
    </div>
  );
}

function JourneyStageCard({ label, value, total, detail }) {
  const percentage = total ? Math.round((Number(value || 0) / total) * 100) : 0;

  return (
    <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.035] p-4">
      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/35">{label}</p>
      <p className="mt-3 text-3xl font-black text-[#D4AF37]">{value}</p>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
        <div className="h-full rounded-full bg-[#D4AF37]" style={{ width: `${percentage}%` }} />
      </div>
      <p className="mt-3 text-xs leading-5 text-white/40">{detail}</p>
    </div>
  );
}

function SectionHeader({ eyebrow, title, description }) {
  return (
    <div>
      <p className="text-xs font-black uppercase tracking-[0.22em] text-[#D4AF37]/80">{eyebrow}</p>
      <h3 className="mt-1 text-xl font-black text-white">{title}</h3>
      {description ? <p className="mt-1 text-sm leading-6 text-white/45">{description}</p> : null}
    </div>
  );
}

function WatchMetric({ label, value, tone = "default" }) {
  return (
    <div className={`rounded-2xl border p-4 ${getToneStyle(tone)}`}>
      <p className="text-[10px] font-black uppercase tracking-[0.16em] text-white/35">{label}</p>
      <p className="mt-2 text-3xl font-black text-white">{value}</p>
    </div>
  );
}

function WatchStudentRow({ score = {} }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="truncate font-black text-white">{getStudentName(score)}</p>
          <p className="mt-1 text-xs text-white/45">
            {formatLabel(getJourneyStage(score))} • {score.executive_category || "Standard"}
          </p>
        </div>

        <div className="flex gap-2">
          <span className="rounded-full border border-red-400/25 bg-red-500/10 px-3 py-1 text-xs font-black text-red-300">
            Risk {number(score.risk_score)}
          </span>
          <span className="rounded-full border border-[#D4AF37]/25 bg-[#D4AF37]/10 px-3 py-1 text-xs font-black text-[#D4AF37]">
            Opp {number(score.opportunity_score)}
          </span>
        </div>
      </div>

      <p className="mt-2 line-clamp-2 text-xs leading-5 text-white/45">
        {score.summary || score.gpt_summary || "No summary available."}
      </p>
    </div>
  );
}

function ActionRow({ label, value, detail }) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-2xl border border-white/10 bg-black/20 p-4">
      <div>
        <p className="font-semibold text-white">{label}</p>
        <p className="mt-1 text-xs leading-5 text-white/40">{detail}</p>
      </div>
      <span className="rounded-full border border-[#D4AF37]/25 bg-[#D4AF37]/10 px-3 py-1 text-sm font-black text-[#D4AF37]">
        {value}
      </span>
    </div>
  );
}

function SmallMetric({ label, value }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
      <p className="text-[10px] font-black uppercase tracking-[0.16em] text-white/35">{label}</p>
      <p className="mt-2 text-2xl font-black text-white">{value}</p>
    </div>
  );
}

function HealthProgress({ label, value }) {
  const clean = Math.max(0, Math.min(100, Number(value || 0)));

  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
      <div className="flex items-center justify-between text-sm">
        <span className="font-semibold text-white">{label}</span>
        <span className="font-black text-[#D4AF37]">{clean}%</span>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
        <div className="h-full rounded-full bg-[#D4AF37]" style={{ width: `${clean}%` }} />
      </div>
    </div>
  );
}

function EmptyState({ text }) {
  return (
    <p className="rounded-2xl border border-dashed border-white/10 bg-white/[0.025] p-5 text-sm text-white/40">
      {text}
    </p>
  );
}

function getToneStyle(tone = "") {
  if (tone === "red") return "border-red-400/25 bg-red-500/10";
  if (tone === "orange") return "border-orange-400/25 bg-orange-500/10";
  if (tone === "yellow") return "border-yellow-400/25 bg-yellow-500/10";
  if (tone === "green") return "border-emerald-400/25 bg-emerald-500/10";
  if (tone === "gold") return "border-[#D4AF37]/25 bg-[#D4AF37]/10";
  if (tone === "blue") return "border-blue-400/25 bg-blue-500/10";
  return "border-white/10 bg-white/[0.03]";
}

export default ExecutiveCommandSystem;
