import { useEffect, useMemo, useState } from "react";
import ExecutiveScoreGeneratorPanel from "./ExecutiveScoreGeneratorPanel";
import ExecutiveAlertsPanel from "./ExecutiveAlertsPanel";
import ExecutiveActionQueue from "./ExecutiveActionQueue";
import ExecutiveAutomationEngine from "./ExecutiveAutomationEngine";
import ExecutiveActionExecutorPanel from "./ExecutiveActionExecutorPanel";
import ExecutivePortfolioSummary from "./ExecutivePortfolioSummary";
import ExecutiveAutomationAnalytics from "./ExecutiveAutomationAnalytics";
import ExecutiveAutomationControlCenter from "./ExecutiveAutomationControlCenter";
import ExecutiveAIDashboard from "./ExecutiveAIDashboard";
import MissionControlNotificationCenter from "./MissionControlNotificationCenter";
import { getExecutiveScoreSummary } from "../../lib/executivePortfolioGenerator";
import ExecutiveBulkOperationsPanel from "./ExecutiveBulkOperationsPanel";
import FounderGrowthDashboard from "./FounderGrowthDashboard";
import AnalyticsOSDashboard from "./analytics/AnalyticsOSDashboard";
import KnowledgeOSDashboard from "./knowledge/KnowledgeOSDashboard";
import CommunicationOSDashboard from "./communication/CommunicationOSDashboard";
import PartnerOSDashboard from "./partner/PartnerOSDashboard";
import AICommandCenter from "./ai-command/AICommandCenter";
import {
  buildExecutiveVerificationSnapshot,
  buildBrokenWorkflowScannerSnapshot,
  buildWorkflowIntegrityScore,
  generateProductionReadinessReport,
  buildExecutiveRecoveryActions,
} from "../../lib/platformVerificationEngine";

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


function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

function clampPercent(value, fallback = 0) {
  return Math.max(0, Math.min(100, number(value, fallback)));
}

function getFirstNumber(source = {}, keys = [], fallback = 0) {
  for (const key of keys) {
    const value = source?.[key];
    if (Number.isFinite(Number(value))) return Number(value);
  }
  return fallback;
}

function runVerificationBuilder(builder, scores = [], fallback = {}) {
  try {
    const result = builder?.(safeArray(scores));
    return result && typeof result === "object" ? result : fallback;
  } catch (err) {
    console.error("Executive verification builder failed:", err);
    return {
      ...fallback,
      error: err?.message || "Verification builder failed.",
    };
  }
}

function normalizeWorkflowIntegrity(raw = {}) {
  const overallIntegrity = clampPercent(
    raw.overallIntegrity ?? raw.overall_integrity ?? raw.score ?? raw.integrityScore ?? raw.workflowIntegrityScore,
    0
  );

  return {
    ...raw,
    overallIntegrity,
    inquiryIntegrity: clampPercent(raw.inquiryIntegrity ?? raw.inquiry_integrity ?? raw.inquiry ?? raw.stageScores?.inquiry, overallIntegrity),
    applicationIntegrity: clampPercent(raw.applicationIntegrity ?? raw.application_integrity ?? raw.application ?? raw.stageScores?.application, overallIntegrity),
    visaIntegrity: clampPercent(raw.visaIntegrity ?? raw.visa_integrity ?? raw.visa ?? raw.stageScores?.visa, overallIntegrity),
    paymentIntegrity: clampPercent(raw.paymentIntegrity ?? raw.payment_integrity ?? raw.payment ?? raw.stageScores?.payment, overallIntegrity),
    portalIntegrity: clampPercent(raw.portalIntegrity ?? raw.portal_integrity ?? raw.portal ?? raw.stageScores?.portal, overallIntegrity),
    enterpriseIntegrity: clampPercent(raw.enterpriseIntegrity ?? raw.enterprise_integrity ?? raw.enterprise ?? raw.stageScores?.enterprise, overallIntegrity),
  };
}

function normalizeWorkflowScanner(raw = {}) {
  const brokenWorkflows = safeArray(raw.brokenWorkflows || raw.broken_workflows || raw.issues || raw.workflowIssues);
  const stalledStudents = safeArray(raw.stalledStudents || raw.stalled_students);
  const missingTransitions = safeArray(raw.missingTransitions || raw.missing_transitions);
  const orphanRecords = safeArray(raw.orphanRecords || raw.orphan_records);
  const criticalFailures = safeArray(raw.criticalFailures || raw.critical_failures).length
    ? safeArray(raw.criticalFailures || raw.critical_failures)
    : brokenWorkflows.filter((issue) => normalize(issue.severity || issue.priority) === "critical");
  const severityBreakdown = raw.severityBreakdown || raw.severity_breakdown || {};

  return {
    ...raw,
    brokenWorkflows,
    stalledStudents,
    missingTransitions,
    orphanRecords,
    criticalFailures,
    totalBrokenWorkflows: getFirstNumber(
      raw,
      ["totalBrokenWorkflows", "total_broken_workflows", "brokenWorkflowCount", "issueCount", "totalIssues"],
      brokenWorkflows.length + missingTransitions.length + orphanRecords.length
    ),
    severityBreakdown: {
      critical: number(severityBreakdown.critical, criticalFailures.length),
      high: number(severityBreakdown.high, brokenWorkflows.filter((issue) => normalize(issue.severity || issue.priority) === "high").length),
      medium: number(severityBreakdown.medium, brokenWorkflows.filter((issue) => normalize(issue.severity || issue.priority) === "medium").length),
      low: number(severityBreakdown.low, brokenWorkflows.filter((issue) => normalize(issue.severity || issue.priority) === "low").length),
    },
  };
}

function normalizeProductionReadiness(raw = {}) {
  const launchBlockers = safeArray(raw.launchBlockers || raw.launch_blockers || raw.blockers);
  const criticalIssues = safeArray(raw.criticalIssues || raw.critical_issues || raw.criticalFailures);
  const readinessScore = clampPercent(raw.readinessScore ?? raw.readiness_score ?? raw.score ?? raw.productionReadinessScore, 0);
  const statusRaw = normalize(raw.goLiveStatus || raw.go_live_status || raw.status || raw.launchStatus);
  const goLiveStatus = statusRaw || (readinessScore >= 90 && !launchBlockers.length ? "go" : readinessScore >= 75 ? "go_with_warnings" : "no_go");

  return {
    ...raw,
    readinessScore,
    goLiveStatus,
    launchBlockers,
    criticalIssues,
  };
}

function normalizeExecutiveRecoveryActions(raw = {}) {
  const immediateActions = safeArray(raw.immediateActions || raw.immediate_actions || raw.immediate || raw.actions?.immediate);
  const executiveActions = safeArray(raw.executiveActions || raw.executive_actions || raw.executive || raw.actions?.executive);
  const counselorActions = safeArray(raw.counselorActions || raw.counselor_actions || raw.counselor || raw.actions?.counselor);
  const allActions = safeArray(raw.allActions || raw.all_actions || raw.actionsList).length
    ? safeArray(raw.allActions || raw.all_actions || raw.actionsList)
    : [...immediateActions, ...executiveActions, ...counselorActions];

  return {
    ...raw,
    immediateActions,
    executiveActions,
    counselorActions,
    allActions,
    totals: {
      ...(raw.totals || {}),
      immediate: number(raw.totals?.immediate, immediateActions.length),
      executive: number(raw.totals?.executive, executiveActions.length),
      counselor: number(raw.totals?.counselor, counselorActions.length),
      total: number(raw.totals?.total, allActions.length),
    },
  };
}

function normalizeExecutiveVerificationSnapshot(raw = {}) {
  return {
    ...raw,
    recoveryQueue: safeArray(raw.recoveryQueue || raw.recovery_queue || raw.executiveRecoveryQueue),
    criticalFailures: safeArray(raw.criticalFailures || raw.critical_failures),
    healthReport: raw.healthReport || raw.health_report || {},
  };
}

function getGoLiveTone(status = "", readinessScore = 0) {
  const clean = normalize(status);
  if (["go", "ready", "production_ready"].includes(clean)) return "green";
  if (["go_with_warnings", "ready_with_warnings", "warning", "warnings"].includes(clean)) return "gold";
  if (["no_go", "not_ready", "blocked", "fail", "failed"].includes(clean)) return "red";
  return readinessScore >= 90 ? "green" : readinessScore >= 75 ? "gold" : "red";
}


function buildExecutiveAlertSnapshot(scores = []) {
  const critical = scores.filter((score) => number(score.risk_score) >= 85 || normalize(score.risk_level) === "critical").length;
  const high = scores.filter((score) => number(score.risk_score) >= 70 || normalize(score.risk_level) === "high").length;
  const visa = scores.filter((score) => ["cas_pending", "cas_issued", "visa_pending", "visa_rejected"].includes(getJourneyStage(score))).length;
  const stalled = scores.filter((score) => number(getScoreValue(score, "days_since_updated"), 0) >= 10).length;
  const documents = scores.filter((score) => number(getScoreValue(score, "document_readiness_percent"), 100) < 60).length;
  const tasks = scores.filter((score) => number(getScoreValue(score, "overdue_tasks_count"), 0) > 0).length;

  return {
    critical,
    high,
    visa,
    stalled,
    documents,
    tasks,
    total: critical + high + visa + stalled + documents + tasks,
  };
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


function buildExecutiveSnapshotV2(scores = [], operations = {}, commandMetrics = {}, alertSnapshot = {}) {
  const total = scores.length;
  const applications = scores.filter((score) =>
    ["application_started", "application_submitted", "application_under_review"].includes(getJourneyStage(score))
  ).length;
  const offers = scores.filter((score) =>
    ["offer_received", "offer_accepted"].includes(getJourneyStage(score))
  ).length;
  const cas = scores.filter((score) =>
    ["cas_pending", "cas_issued"].includes(getJourneyStage(score))
  ).length;
  const visas = scores.filter((score) =>
    ["visa_pending", "visa_rejected", "visa_approved", "enrolled"].includes(getJourneyStage(score))
  ).length;
  const approved = scores.filter((score) => ["visa_approved", "enrolled"].includes(getJourneyStage(score))).length;
  const overdueTasks = scores.reduce((sum, score) => sum + number(getScoreValue(score, "overdue_tasks_count"), 0), 0);
  const pendingTasks = scores.reduce((sum, score) => sum + number(getScoreValue(score, "pending_tasks_count"), 0), 0);
  const weakDocs = scores.filter((score) => number(getScoreValue(score, "document_readiness_percent"), 100) < 70).length;
  const staleStudents = scores.filter((score) => number(getScoreValue(score, "days_since_updated"), 0) >= 10).length;
  const automationCoverage = operations?.health?.automation || 0;
  const verificationHealth = Math.max(0, Math.min(99, Math.round(((operations?.health?.applications || 0) + (operations?.health?.documents || 0) + (operations?.health?.tasks || 0)) / 3)));
  const revenuePressure = operations?.revenue?.conversionReady || 0;
  const collectionRisk = operations?.revenue?.paymentRiskStudents || 0;

  return {
    headline: {
      platformHealth: Math.round(((operations?.health?.applications || 0) + (operations?.health?.universities || 0) + (operations?.health?.visa || 0) + (operations?.health?.documents || 0) + (operations?.health?.tasks || 0) + automationCoverage) / 6),
      executiveRisk: alertSnapshot?.critical || commandMetrics?.critical || 0,
      opportunities: commandMetrics?.executivePriority || 0,
      conversionReady: commandMetrics?.conversionReady || revenuePressure || 0,
    },
    journey: [
      { label: "Students", value: total, detail: "Scored records", tone: "gold" },
      { label: "Applications", value: applications, detail: "Started/submitted/review", tone: "blue" },
      { label: "Offers", value: offers, detail: "Received or accepted", tone: "green" },
      { label: "CAS", value: cas, detail: "Pending or issued", tone: "orange" },
      { label: "Visa", value: visas, detail: `${approved} approved/enrolled`, tone: "blue" },
      { label: "Revenue", value: revenuePressure, detail: `${collectionRisk} collection risk`, tone: "green" },
    ],
    systems: [
      { label: "Student OS", value: `${operations?.health?.applications || 0}%`, detail: "Journey coverage", tone: "gold" },
      { label: "Counselor OS", value: pendingTasks, detail: `${overdueTasks} overdue tasks`, tone: overdueTasks > 0 ? "orange" : "green" },
      { label: "University OS", value: `${operations?.health?.universities || 0}%`, detail: "Planning coverage", tone: "blue" },
      { label: "Application OS", value: applications, detail: "Active application movement", tone: "blue" },
      { label: "Visa OS", value: visas, detail: `${alertSnapshot?.visa || 0} visa watch`, tone: "orange" },
      { label: "Payment OS", value: collectionRisk, detail: "Payment risk watch", tone: collectionRisk > 0 ? "orange" : "green" },
      { label: "Analytics OS", value: "Live", detail: "Executive reporting connected", tone: "gold" },
      { label: "Knowledge OS", value: "Live", detail: "SOP, training, policy layer", tone: "gold" },
      { label: "Communication OS", value: staleStudents, detail: "Students needing follow-up", tone: staleStudents > 0 ? "orange" : "green" },
      { label: "Partner OS", value: "Live", detail: "Agent and university partner layer", tone: "gold" },
      { label: "AI Command", value: "Live", detail: "Prediction and intelligence layer", tone: "gold" },
      { label: "Verification", value: `${verificationHealth}%`, detail: "Readiness estimate", tone: verificationHealth >= 85 ? "green" : "orange" },
    ],
    riskFeed: [
      { label: "Critical Students", value: alertSnapshot?.critical || 0, detail: "Immediate executive attention", tone: "red" },
      { label: "High Risk", value: alertSnapshot?.high || 0, detail: "Needs counselor ownership", tone: "orange" },
      { label: "Weak Documents", value: weakDocs, detail: "Document readiness below 70%", tone: weakDocs > 0 ? "orange" : "green" },
      { label: "Stale Records", value: staleStudents, detail: "No movement for 10+ days", tone: staleStudents > 0 ? "orange" : "green" },
    ],
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
  const alertSnapshot = useMemo(() => buildExecutiveAlertSnapshot(scores), [scores]);
  const executiveSnapshotV2 = useMemo(
    () => buildExecutiveSnapshotV2(scores, operations, commandMetrics, alertSnapshot),
    [scores, operations, commandMetrics, alertSnapshot]
  );

  const platformVerificationSnapshot = useMemo(
    () =>
      normalizeExecutiveVerificationSnapshot(
        runVerificationBuilder(buildExecutiveVerificationSnapshot, scores, { recoveryQueue: [] })
      ),
    [scores]
  );

  const brokenWorkflowScanner = useMemo(
    () =>
      normalizeWorkflowScanner(
        runVerificationBuilder(buildBrokenWorkflowScannerSnapshot, scores, { brokenWorkflows: [] })
      ),
    [scores]
  );

  const workflowIntegrity = useMemo(
    () =>
      normalizeWorkflowIntegrity(
        runVerificationBuilder(buildWorkflowIntegrityScore, scores, { overallIntegrity: 0 })
      ),
    [scores]
  );

  const productionReadiness = useMemo(
    () =>
      normalizeProductionReadiness(
        runVerificationBuilder(generateProductionReadinessReport, scores, { readinessScore: 0, goLiveStatus: "no_go" })
      ),
    [scores]
  );

  const executiveRecoveryActions = useMemo(
    () =>
      normalizeExecutiveRecoveryActions(
        runVerificationBuilder(buildExecutiveRecoveryActions, scores, { immediateActions: [], executiveActions: [], counselorActions: [] })
      ),
    [scores]
  );

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

        <div className="mt-6 grid gap-4 md:grid-cols-3 xl:grid-cols-10">
          <SummaryCard label="Students Scored" value={summary?.total || commandMetrics.total} />
          <SummaryCard label="Critical Risk" value={summary?.criticalRisk || summary?.critical || commandMetrics.critical} tone="red" />
          <SummaryCard label="Executive Priority" value={commandMetrics.executivePriority} tone="gold" />
          <SummaryCard label="Conversion Ready" value={summary?.conversionReady || commandMetrics.conversionReady} tone="gold" />
          <SummaryCard label="Visa/CAS Watch" value={commandMetrics.visaWatch} tone="blue" />
          <SummaryCard label="Success Stories" value={summary?.successStories || commandMetrics.successStories} tone="green" />
          <SummaryCard label="Avg Risk" value={summary?.averageRisk || commandMetrics.averageRisk} tone="orange" />
          <SummaryCard label="Avg Opportunity" value={summary?.averageOpportunity || commandMetrics.averageOpportunity} tone="green" />
          <SummaryCard label="Workflow Integrity" value={`${workflowIntegrity.overallIntegrity || 0}%`} tone={(workflowIntegrity.overallIntegrity || 0) >= 75 ? "green" : "orange"} />
          <SummaryCard label="Production Ready" value={`${productionReadiness.readinessScore || 0}%`} tone={getGoLiveTone(productionReadiness.goLiveStatus, productionReadiness.readinessScore)} />
        </div>

        <ExecutiveSnapshotV2
          snapshot={executiveSnapshotV2}
          setActiveView={setActiveView}
          verificationSnapshot={platformVerificationSnapshot}
          workflowScanner={brokenWorkflowScanner}
          workflowIntegrity={workflowIntegrity}
          productionReadiness={productionReadiness}
          executiveRecoveryActions={executiveRecoveryActions}
        />

        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <CommandLaunchCard
            title="Notification Center"
            value={alertSnapshot.total}
            detail={`${alertSnapshot.critical} critical • ${alertSnapshot.visa} visa watch`}
            tone={alertSnapshot.total > 0 ? "red" : "green"}
            onClick={() => setActiveView("notification-center")}
          />
          <CommandLaunchCard
            title="Automation Control"
            value="Live"
            detail="Approval queue, failures, duplicate protection"
            tone="gold"
            onClick={() => setActiveView("automation-control")}
          />
          <CommandLaunchCard
            title="Revenue Intelligence"
            value={operations.revenue.conversionReady}
            detail={`${operations.revenue.offerAccepted} offer accepted • ${operations.revenue.visaReadySoon} visa ready`}
            tone="green"
            onClick={() => setActiveView("operations")}
          />
          <CommandLaunchCard
            title="Operations Health"
            value={`${operations.health.applications || 0}%`}
            detail="Applications, documents, tasks, visa, automation"
            tone="blue"
            onClick={() => setActiveView("operations")}
          />
          <CommandLaunchCard
            title="Verification Readiness"
            value={`${productionReadiness.readinessScore || 0}%`}
            detail={`${brokenWorkflowScanner.totalBrokenWorkflows || 0} broken workflows • ${workflowIntegrity.overallIntegrity || 0}% integrity`}
            tone={getGoLiveTone(productionReadiness.goLiveStatus, productionReadiness.readinessScore)}
            onClick={() => setActiveView("verification")}
          />

          <CommandLaunchCard
            title="Founder Growth"
            value={`${commandMetrics.conversionReady || 0}`}
            detail="Funnel, revenue, market demand, counselor performance"
            tone="gold"
            onClick={() => setActiveView("founder-growth")}
          />
          <CommandLaunchCard
            title="Analytics OS"
            value="Live"
            detail="KPI command, BI, forecasts, trends, reports"
            tone="blue"
            onClick={() => setActiveView("analytics-os")}
          />
          <CommandLaunchCard
            title="Knowledge OS"
            value="Live"
            detail="SOP, training, university, visa, policy hub"
            tone="gold"
            onClick={() => setActiveView("knowledge-os")}
          />
          <CommandLaunchCard
            title="Communication OS"
            value={operations.today.communicationFollowups}
            detail="Email, WhatsApp, calls, meetings, follow-ups"
            tone="blue"
            onClick={() => setActiveView("communication-os")}
          />
          <CommandLaunchCard
            title="Partner OS"
            value="Live"
            detail="Agents, universities, commissions, partner analytics"
            tone="green"
            onClick={() => setActiveView("partner-os")}
          />
          <CommandLaunchCard
            title="AI Command OS"
            value="Live"
            detail="Copilot, forecasts, workflow, cross-system intelligence"
            tone="gold"
            onClick={() => setActiveView("ai-command")}
          />
        </div>
      </div>

      <CommandTabs activeView={activeView} setActiveView={setActiveView} />

      {activeView === "operations" ? (
        <ExecutiveOperationsCenter operations={operations} totalStudents={scores.length} />
      ) : null}

      {activeView === "verification" ? (
        <ExecutiveVerificationReadinessPanel
          productionReadiness={productionReadiness}
          workflowIntegrity={workflowIntegrity}
          workflowScanner={brokenWorkflowScanner}
          verificationSnapshot={platformVerificationSnapshot}
          executiveRecoveryActions={executiveRecoveryActions}
        />
      ) : null}

      {activeView === "founder-growth" ? (
        <FounderGrowthDashboard
          snapshot={{
            students: scores,
            applications: scores.filter((score) =>
              ["application_started", "application_submitted", "application_under_review"].includes(getJourneyStage(score))
            ),
            offers: scores.filter((score) =>
              ["offer_received", "offer_accepted"].includes(getJourneyStage(score))
            ),
            casRecords: scores.filter((score) =>
              ["cas_pending", "cas_issued"].includes(getJourneyStage(score))
            ),
            visas: scores.filter((score) =>
              ["visa_pending", "visa_rejected", "visa_approved", "enrolled"].includes(getJourneyStage(score))
            ),
            tasks: scores.flatMap((score) => {
              const pending = number(getScoreValue(score, "pending_tasks_count"), 0);
              const overdue = number(getScoreValue(score, "overdue_tasks_count"), 0);
              return Array.from({ length: pending + overdue }).map((_, index) => ({
                id: `${score.student_id || score.id || "student"}-task-${index}`,
                student_name: getStudentName(score),
                status: index < overdue ? "overdue" : "pending",
                assigned_counselor: score.assigned_counselor || score.counselor_name || score.assigned_to,
              }));
            }),
            supportRequests: scores
              .filter((score) => number(getScoreValue(score, "support_requests_count"), 0) > 0)
              .map((score) => ({
                id: `${score.student_id || score.id || "student"}-support`,
                student_name: getStudentName(score),
                status: "open",
                assigned_counselor: score.assigned_counselor || score.counselor_name || score.assigned_to,
              })),
          }}
          executiveSnapshot={{
            scores,
            summary,
            operations,
            commandMetrics,
            alertSnapshot,
          }}
          counselorSnapshot={{ students: scores }}
          paymentSnapshot={{ invoices: [], payments: [] }}
          adminProfile={adminProfile}
          onRefresh={loadExecutiveScores}
        />
      ) : null}

      {activeView === "analytics-os" ? (
        <AnalyticsOSDashboard adminProfile={adminProfile} />
      ) : null}

      {activeView === "knowledge-os" ? (
        <KnowledgeOSDashboard adminProfile={adminProfile} />
      ) : null}

      {activeView === "communication-os" ? (
        <CommunicationOSDashboard adminProfile={adminProfile} />
      ) : null}

      {activeView === "partner-os" ? (
        <PartnerOSDashboard adminProfile={adminProfile} />
      ) : null}

      {activeView === "ai-command" ? (
        <AICommandCenter adminProfile={adminProfile} />
      ) : null}

      {activeView === "intelligence" ? (
        <ExecutiveAIDashboard students={scores} />
      ) : null}

      {activeView === "notification-center" ? (
        <MissionControlNotificationCenter
          scores={scores}
          studentRiskScores={scores}
          adminProfile={adminProfile}
        />
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
      {activeView === "bulk-operations" ? (
  <ExecutiveBulkOperationsPanel
    scores={scores}
    adminProfile={adminProfile}
    onActionExecuted={handleActionExecuted}
  />
) : null}

      {activeView === "automation-control" ? (
        <ExecutiveAutomationControlCenter
          adminProfile={adminProfile}
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


function ExecutiveSnapshotV2({
  snapshot = {},
  setActiveView,
  verificationSnapshot = {},
  workflowScanner = {},
  workflowIntegrity = {},
  productionReadiness = {},
  executiveRecoveryActions = {},
}) {
  const headline = snapshot.headline || {};
  const journey = snapshot.journey || [];
  const systems = snapshot.systems || [];
  const riskFeed = snapshot.riskFeed || [];
  const readinessScore = productionReadiness.readinessScore || 0;
  const integrityScore = workflowIntegrity.overallIntegrity || 0;
  const brokenWorkflows = workflowScanner.totalBrokenWorkflows || 0;
  const criticalFailures = workflowScanner.criticalFailures?.length || 0;
  const recoveryTotal =
    executiveRecoveryActions?.totals?.total ||
    executiveRecoveryActions?.totals?.immediate ||
    verificationSnapshot?.recoveryQueue?.length ||
    0;

  return (
    <div className="mt-6 space-y-5 rounded-[2rem] border border-white/10 bg-black/25 p-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.25em] text-[#D4AF37]">
            Executive Snapshot V2
          </p>
          <h3 className="mt-2 text-2xl font-black text-white">
            Unified Enterprise Health Wall
          </h3>
          <p className="mt-2 max-w-4xl text-sm leading-6 text-white/45">
            One view across students, applications, CAS, visa, revenue, tasks, communication, partners,
            analytics, AI, automation, and verification. This is the new top-level snapshot before full verification.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <MiniSnapshotMetric label="Platform" value={`${headline.platformHealth || 0}%`} tone="green" />
          <MiniSnapshotMetric label="Risk" value={headline.executiveRisk || 0} tone="red" />
          <MiniSnapshotMetric label="Priority" value={headline.opportunities || 0} tone="gold" />
          <MiniSnapshotMetric label="Ready" value={headline.conversionReady || 0} tone="blue" />
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        <SnapshotTile
          label="Production Readiness"
          value={`${readinessScore}%`}
          detail={formatLabel(productionReadiness.goLiveStatus || "not_ready")}
          tone={readinessScore >= 75 ? "green" : "red"}
        />
        <SnapshotTile
          label="Workflow Integrity"
          value={`${integrityScore}%`}
          detail="Inquiry, application, visa, payment, portal, enterprise integrity"
          tone={integrityScore >= 75 ? "green" : "orange"}
        />
        <SnapshotTile
          label="Broken Workflows"
          value={brokenWorkflows}
          detail={`${criticalFailures} critical failures detected`}
          tone={criticalFailures > 0 ? "red" : brokenWorkflows > 0 ? "orange" : "green"}
        />
        <SnapshotTile
          label="Recovery Queue"
          value={recoveryTotal}
          detail="Immediate executive/counselor recovery actions"
          tone={recoveryTotal > 0 ? "gold" : "green"}
        />
        <button
          type="button"
          onClick={() => setActiveView?.("verification")}
          className="rounded-2xl border border-[#D4AF37]/25 bg-[#D4AF37]/10 p-4 text-left transition hover:-translate-y-0.5 hover:bg-[#D4AF37] hover:text-black"
        >
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-white/50">
            Verification Center
          </p>
          <p className="mt-3 text-2xl font-black text-white">Open</p>
          <p className="mt-2 text-xs leading-5 text-white/45">
            Full workflow scanner and launch readiness report
          </p>
        </button>
      </div>

      <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
        {journey.map((item) => (
          <SnapshotTile key={item.label} {...item} />
        ))}
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.025] p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-white/35">
                System Coverage
              </p>
              <h4 className="mt-1 font-black text-white">Enterprise OS connection status</h4>
            </div>
            <button
              type="button"
              onClick={() => setActiveView?.("ai-command")}
              className="rounded-full border border-[#D4AF37]/25 bg-[#D4AF37]/10 px-4 py-2 text-xs font-black text-[#D4AF37] transition hover:bg-[#D4AF37] hover:text-black"
            >
              Open AI Command
            </button>
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {systems.map((item) => (
              <SnapshotTile key={item.label} compact {...item} />
            ))}
          </div>
        </div>

        <div className="rounded-[1.5rem] border border-red-400/20 bg-red-500/[0.035] p-4">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-red-300/80">
            Executive Risk Feed
          </p>
          <h4 className="mt-1 font-black text-white">What needs attention first</h4>

          <div className="mt-4 space-y-3">
            {riskFeed.map((item) => (
              <SnapshotRiskRow key={item.label} {...item} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function MiniSnapshotMetric({ label, value, tone = "default" }) {
  return (
    <div className={`rounded-2xl border p-3 ${getToneStyle(tone)}`}>
      <p className="text-[9px] font-black uppercase tracking-[0.16em] text-white/35">{label}</p>
      <p className="mt-1 text-xl font-black text-white">{value}</p>
    </div>
  );
}

function SnapshotTile({ label, value, detail, tone = "default", compact = false }) {
  return (
    <div className={`rounded-2xl border p-4 ${getToneStyle(tone)}`}>
      <p className="text-[10px] font-black uppercase tracking-[0.16em] text-white/35">{label}</p>
      <p className={`${compact ? "mt-2 text-2xl" : "mt-3 text-3xl"} font-black text-white`}>{value}</p>
      <p className="mt-2 text-xs leading-5 text-white/40">{detail}</p>
    </div>
  );
}

function SnapshotRiskRow({ label, value, detail, tone = "default" }) {
  return (
    <div className={`flex items-start justify-between gap-3 rounded-2xl border p-4 ${getToneStyle(tone)}`}>
      <div>
        <p className="font-black text-white">{label}</p>
        <p className="mt-1 text-xs leading-5 text-white/40">{detail}</p>
      </div>
      <span className="rounded-full border border-white/10 bg-black/25 px-3 py-1 text-sm font-black text-white">
        {value}
      </span>
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

function ExecutiveVerificationReadinessPanel({
  productionReadiness = {},
  workflowIntegrity = {},
  workflowScanner = {},
  verificationSnapshot = {},
  executiveRecoveryActions = {},
}) {
  const blockers = productionReadiness.launchBlockers || [];
  const criticalIssues = productionReadiness.criticalIssues || [];
  const topBrokenWorkflows = workflowScanner.brokenWorkflows?.slice(0, 8) || [];
  const recoveryActions = [
    ...(executiveRecoveryActions.immediateActions || []),
    ...(executiveRecoveryActions.executiveActions || []),
    ...(executiveRecoveryActions.counselorActions || []),
  ].slice(0, 10);

  return (
    <div className="space-y-6">
      <div className="rounded-[2rem] border border-[#D4AF37]/20 bg-[#D4AF37]/[0.045] p-6">
        <p className="text-xs font-black uppercase tracking-[0.25em] text-[#D4AF37]">
          Platform Verification V4
        </p>
        <h3 className="mt-2 text-2xl font-black text-white">
          Workflow Integrity & Production Readiness
        </h3>
        <p className="mt-2 max-w-4xl text-sm leading-6 text-white/55">
          Final launch-readiness layer across broken workflows, recovery actions,
          stage integrity, platform health, and executive blockers.
        </p>

        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <SummaryCard
            label="Readiness Score"
            value={`${productionReadiness.readinessScore || 0}%`}
            tone={(productionReadiness.readinessScore || 0) >= 75 ? "green" : "red"}
          />
          <SummaryCard
            label="Go Live Status"
            value={formatLabel(productionReadiness.goLiveStatus || "not_ready")}
            tone={getGoLiveTone(productionReadiness.goLiveStatus, productionReadiness.readinessScore)}
          />
          <SummaryCard
            label="Workflow Integrity"
            value={`${workflowIntegrity.overallIntegrity || 0}%`}
            tone={(workflowIntegrity.overallIntegrity || 0) >= 75 ? "green" : "orange"}
          />
          <SummaryCard
            label="Broken Workflows"
            value={workflowScanner.totalBrokenWorkflows || 0}
            tone={(workflowScanner.totalBrokenWorkflows || 0) > 0 ? "red" : "green"}
          />
          <SummaryCard
            label="Recovery Queue"
            value={verificationSnapshot.recoveryQueue?.length || 0}
            tone={(verificationSnapshot.recoveryQueue?.length || 0) > 0 ? "gold" : "green"}
          />
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="space-y-6">
          <div className="rounded-[1.75rem] border border-white/10 bg-white/[0.035] p-5">
            <SectionHeader
              eyebrow="Integrity Score"
              title="Workflow integrity breakdown"
              description="Weighted score across inquiry, application, visa, payment, portal, and enterprise systems."
            />

            <div className="mt-5 grid gap-3">
              <HealthProgress label="Inquiry" value={workflowIntegrity.inquiryIntegrity || 0} />
              <HealthProgress label="Application" value={workflowIntegrity.applicationIntegrity || 0} />
              <HealthProgress label="Visa" value={workflowIntegrity.visaIntegrity || 0} />
              <HealthProgress label="Payment" value={workflowIntegrity.paymentIntegrity || 0} />
              <HealthProgress label="Portal" value={workflowIntegrity.portalIntegrity || 0} />
              <HealthProgress label="Enterprise" value={workflowIntegrity.enterpriseIntegrity || 0} />
            </div>
          </div>

          <div className="rounded-[1.75rem] border border-red-400/20 bg-red-500/[0.04] p-5">
            <SectionHeader
              eyebrow="Launch Blockers"
              title="Issues blocking clean launch"
              description="Critical and high readiness blockers produced by the production readiness report."
            />

            <div className="mt-4 space-y-3">
              {blockers.length ? (
                blockers.map((blocker, index) => (
                  <ReadinessIssueRow
                    key={`${blocker.title}-${index}`}
                    title={blocker.title}
                    detail={blocker.description}
                    severity={blocker.severity}
                  />
                ))
              ) : (
                <EmptyState text="No launch blockers detected by the readiness report." />
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-[1.75rem] border border-orange-400/20 bg-orange-500/[0.04] p-5">
            <SectionHeader
              eyebrow="Broken Workflow Scanner"
              title="Detected workflow breaks"
              description="Missing transitions, orphan records, stalled students, portal/payment gaps, and counselor backlog."
            />

            <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-6">
              <WatchMetric label="Critical" value={workflowScanner.severityBreakdown?.critical || 0} tone="red" />
              <WatchMetric label="High" value={workflowScanner.severityBreakdown?.high || 0} tone="orange" />
              <WatchMetric label="Stalled" value={workflowScanner.stalledStudents?.length || 0} tone="yellow" />
              <WatchMetric label="Missing Transitions" value={workflowScanner.missingTransitions?.length || 0} tone="blue" />
              <WatchMetric label="Orphan Records" value={workflowScanner.orphanRecords?.length || 0} tone="orange" />
              <WatchMetric label="Critical Failures" value={workflowScanner.criticalFailures?.length || 0} tone="red" />
            </div>

            <div className="mt-5 space-y-3">
              {topBrokenWorkflows.length ? (
                topBrokenWorkflows.map((issue) => (
                  <ReadinessIssueRow
                    key={issue.id}
                    title={issue.title}
                    detail={`${issue.student_name} • ${issue.description}`}
                    severity={issue.severity}
                  />
                ))
              ) : (
                <EmptyState text="No broken workflows detected." />
              )}
            </div>
          </div>

          <div className="rounded-[1.75rem] border border-[#D4AF37]/20 bg-[#D4AF37]/[0.04] p-5">
            <SectionHeader
              eyebrow="Executive Recovery"
              title="Next recovery actions"
              description="Highest priority recovery queue items from the verification engine."
            />

            <div className="mt-4 space-y-3">
              {recoveryActions.length ? (
                recoveryActions.map((action, index) => (
                  <ReadinessIssueRow
                    key={`${action.id || action.title}-${index}`}
                    title={action.title}
                    detail={`${action.student_name || "Unknown Student"} • ${action.description}`}
                    severity={action.priority}
                  />
                ))
              ) : (
                <EmptyState text="No recovery actions required." />
              )}
            </div>
          </div>

          {criticalIssues.length ? (
            <div className="rounded-[1.75rem] border border-red-400/20 bg-red-500/[0.04] p-5">
              <SectionHeader
                eyebrow="Critical Issues"
                title="Executive intervention required"
                description="Critical failures that should be resolved before full launch."
              />

              <div className="mt-4 space-y-3">
                {criticalIssues.slice(0, 6).map((issue) => (
                  <ReadinessIssueRow
                    key={issue.id}
                    title={issue.title}
                    detail={`${issue.student_name} • ${issue.description}`}
                    severity="critical"
                  />
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function ReadinessIssueRow({ title, detail, severity = "medium" }) {
  const tone =
    severity === "critical" || severity === "urgent"
      ? "red"
      : severity === "high"
        ? "orange"
        : severity === "medium"
          ? "yellow"
          : "blue";

  return (
    <div className={`rounded-2xl border p-4 ${getToneStyle(tone)}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-black text-white">{title}</p>
          <p className="mt-1 text-xs leading-5 text-white/45">{detail}</p>
        </div>
        <span className="rounded-full border border-white/10 bg-black/25 px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-white/55">
          {formatLabel(severity)}
        </span>
      </div>
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
  { key: "notification-center", label: "Notification Center" },
  { key: "portfolio", label: "Portfolio" },
  { key: "actions", label: "Actions" },

  { key: "bulk-operations", label: "Bulk Operations" },
  { key: "verification", label: "Verification Readiness" },

  { key: "founder-growth", label: "Founder Growth" },

  { key: "analytics-os", label: "Analytics OS" },
  { key: "knowledge-os", label: "Knowledge OS" },
  { key: "communication-os", label: "Communication OS" },
  { key: "partner-os", label: "Partner OS" },
  { key: "ai-command", label: "AI Command OS" },

  { key: "automation-control", label: "Automation Control" },
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


function CommandLaunchCard({ title, value, detail, tone = "default", onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-[1.5rem] border p-4 text-left transition hover:-translate-y-0.5 hover:border-[#D4AF37]/40 ${getToneStyle(tone)}`}
    >
      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/35">
        {title}
      </p>
      <p className="mt-3 text-3xl font-black text-white">{value}</p>
      <p className="mt-2 text-xs leading-5 text-white/45">{detail}</p>
    </button>
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
