// ExecutiveCommandSystem V3 — Architecture Hardening Pass
// Parent orchestrator only: loads executive scores, computes command snapshots,
// routes into specialized Executive/Enterprise OS modules, and keeps developer
// execution tools hidden from normal operations.
//
// V3 changes:
// - grouped command navigation instead of a 16-pill wall
// - truthful module labels ("Open" instead of hardcoded "Live")
// - stronger navy/orange Admin OS hierarchy and text contrast
// - removes "Success Stories" wording from executive KPI UI
// - preserves all existing engines, lazy modules, verification logic and handlers
// - does NOT merge/remove child engines yet; child audits happen separately
// - Communication OS now receives real Admin CRM inquiries, appointments and follow-up reminders
// - optional communication integrations remain explicit; missing telemetry is never fabricated

import { lazy, Suspense, useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity,
  ArrowUpRight,
  BarChart3,
  BellRing,
  BookOpenCheck,
  Boxes,
  BrainCircuit,
  BriefcaseBusiness,
  CheckCircle2,
  ChevronDown,
  Scale,
  ChevronUp,
  ClipboardList,
  Gauge,
  Handshake,
  MessageSquareText,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Target,
  Wrench,
  Workflow,
  UsersRound,
  Zap,
} from "lucide-react";
const ExecutiveScoreGeneratorPanel = lazy(() => import("./ExecutiveScoreGeneratorPanel"));
const ExecutiveAlertsPanel = lazy(() => import("./ExecutiveAlertsPanel"));
const ExecutiveActionQueue = lazy(() => import("./ExecutiveActionQueue"));
const ExecutiveAutomationEngine = lazy(() => import("./ExecutiveAutomationEngine"));
const ExecutiveActionExecutorPanel = lazy(() => import("./ExecutiveActionExecutorPanel"));
const ExecutivePortfolioSummary = lazy(() => import("./ExecutivePortfolioSummary"));
const ExecutiveAutomationAnalytics = lazy(() => import("./ExecutiveAutomationAnalytics"));
const ExecutiveAutomationControlCenter = lazy(() => import("./ExecutiveAutomationControlCenter"));
const ExecutiveAIDashboard = lazy(() => import("./ExecutiveAIDashboard"));
const MissionControlNotificationCenter = lazy(() => import("../communications/MissionControlNotificationCenter"));
import { getExecutiveScoreSummary } from "../../../../lib/executivePortfolioGenerator";
const ExecutiveBulkOperationsPanel = lazy(() => import("./ExecutiveBulkOperationsPanel"));
const FounderGrowthDashboard = lazy(() => import("./FounderGrowthDashboard"));
const AnalyticsOSDashboard = lazy(() => import("../../analytics/AnalyticsOSDashboard"));
const KnowledgeOSDashboard = lazy(() => import("../../knowledge/KnowledgeOSDashboard"));
const MarketingOSDashboard = lazy(() => import("../../marketing/MarketingOSDashboard"));
const MobileControlCenter = lazy(() => import("../../mobile/MobileControlCenter"));
const CommunicationOSDashboard = lazy(() => import("../../communication/CommunicationOSDashboard"));
const ComplianceOSDashboard = lazy(() => import("../../compliance/ComplianceOSDashboard"));
const PartnerOSDashboard = lazy(() => import("../../partner/PartnerOSDashboard"));
const AgentOSDashboard = lazy(() => import("../../agent/AgentOSDashboard"));
const FinanceOSDashboard = lazy(() => import("../../finance/FinanceOSDashboard"));
const HROSDashboard = lazy(() => import("../../hr/HROSDashboard"));
const AICommandCenter = lazy(() => import("../../ai-command/AICommandCenter"));
const ExecutiveCopilot = lazy(() => import("../../ai-command/ExecutiveCopilot"));
const PredictiveInsights = lazy(() => import("../../ai-command/PredictiveInsights"));
const WorkflowIntelligence = lazy(() => import("../../ai-command/WorkflowIntelligence"));
const CrossSystemIntelligence = lazy(() => import("../../ai-command/CrossSystemIntelligence"));
const AIAnalytics = lazy(() => import("../../ai-command/AIAnalytics"));
import {
  buildExecutiveVerificationSnapshot,
  buildBrokenWorkflowScannerSnapshot,
  buildWorkflowIntegrityScore,
  generateProductionReadinessReport,
  buildExecutiveRecoveryActions,
} from "../../../../lib/platformVerificationEngine";

const EXECUTIVE_VIEW_STORAGE_KEY = "zaifan-executive-command-active-view";

const VALID_EXECUTIVE_VIEWS = new Set([
  "operations",
  "intelligence",
  "notification-center",
  "verification",
  "actions",
  "bulk-operations",
  "automation-control",
  "automation",
  "alerts",
  "portfolio",
  "founder-growth",
  "ai-command",
  "ai-command-copilot",
  "ai-command-predictive",
  "ai-command-workflow",
  "ai-command-cross-system",
  "ai-command-analytics",
  "analytics-os",
  "knowledge-os",
  "marketing-os",
  "mobile-os",
  "communication-os",
  "compliance-os",
  "partner-os",
  "agent-os",
  "finance-os",
  "hr-os",
]);

function getStoredExecutiveView() {
  if (typeof window === "undefined") return "operations";

  try {
    const saved = window.localStorage.getItem(EXECUTIVE_VIEW_STORAGE_KEY);
    return VALID_EXECUTIVE_VIEWS.has(saved) ? saved : "operations";
  } catch {
    return "operations";
  }
}

function persistExecutiveView(view) {
  if (typeof window === "undefined" || !VALID_EXECUTIVE_VIEWS.has(view)) return;

  try {
    window.localStorage.setItem(EXECUTIVE_VIEW_STORAGE_KEY, view);
  } catch {
    // Navigation persistence is optional and must never break Executive OS.
  }
}

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

  const verifiedOutcomes = scores.filter(
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
    verifiedOutcomes,
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
      { label: "Analytics OS", value: "Available", detail: "Executive reporting module available", tone: "gold" },
      { label: "Knowledge OS", value: "Available", detail: "SOP, training, policy module available", tone: "gold" },
      { label: "Communication OS", value: staleStudents, detail: "Students needing follow-up", tone: staleStudents > 0 ? "orange" : "green" },
      { label: "Compliance OS", value: "Available", detail: "Audit, policy, risk, privacy and reporting module available", tone: "blue" },
      { label: "Partner OS", value: "Available", detail: "Agent attribution, partner students, commissions and conversion evidence", tone: "gold" },
      { label: "Finance OS", value: "Available", detail: "Collections, receivables, expenses, commissions, P&L and finance health", tone: "green" },
      { label: "HR OS", value: "Available", detail: "People identity, leave, operational performance, recruitment, training and organization structure", tone: "blue" },
      { label: "Mobile OS", value: "Available", detail: "Evidence-first student/counselor sessions, device activation, push delivery and mobile operations", tone: "gold" },
      { label: "AI Command", value: "Available", detail: "Prediction and intelligence module available", tone: "gold" },
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

const AI_COMMAND_MODULE_VIEW_MAP = {
  "command-center": "ai-command",
  "executive-copilot": "ai-command-copilot",
  "predictive-insights": "ai-command-predictive",
  "workflow-intelligence": "ai-command-workflow",
  "cross-system-intelligence": "ai-command-cross-system",
  "ai-analytics": "ai-command-analytics",
};

function ExecutiveCommandSystem({
  adminProfile = null,

  // Real Admin CRM inputs forwarded from AnalyticsPage.
  inquiries = [],
  appointments = [],
  followUpReminders = [],

  // Real evidence already available in AnalyticsPage.
  executiveExecutionLogs = [],
  studentDocuments = [],

  // Optional Finance OS evidence forwarded from AnalyticsPage / Admin CRM.
  // Finance OS remains truthful when any of these sources are not connected.
  financeData = {},
  financeInvoices = [],
  financePayments = [],
  financeExpenses = [],
  financeCommissions = [],
  financeAgents = [],

  // Optional Partner OS evidence.
  // Partner OS stays broader than Agent OS: universities, recruitment partners,
  // commissions, relationship performance and analytics are separate domains.
  partnerData = {},
  partnerRecords = [],
  partnerAgents = [],
  partnerUniversities = [],
  partnerCommissions = [],
  partnerPerformance = [],
  partnerAnalytics = {},

  // Optional Agent Operations evidence.
  // Agent Operations is intentionally separate from Partner OS.
  // Only agent-attributed student/journey records should enter this workspace.
  agentData = {},
  agentAccounts = [],
  agentStudents = [],
  agentCommissions = [],
  onSubmitAgentLead,
  onCheckAgentDuplicate,

  // Optional Knowledge OS evidence.
  // These arrays must contain real controlled records. Missing knowledge
  // domains stay empty instead of falling back to template content.
  knowledgeData = {},
  knowledgeItems = [],
  knowledgeSops = [],
  knowledgeTraining = [],
  knowledgeUniversityRules = [],
  knowledgeVisaGuides = [],
  knowledgePolicies = [],

  // Optional Marketing OS evidence.
  // Missing campaign/spend/content data stays missing; no synthetic marketing
  // records are created from unrelated modules.
  marketingData = {},
  marketingCampaigns = [],
  marketingExpenses = [],
  marketingContent = [],
  onCreateMarketingContent,
  onDeleteMarketingContent,

  // Optional Mobile OS evidence.
  // Sessions, devices and notification telemetry must be real mobile records.
  // Desktop CRM/HR data may provide identity/workload context, but never
  // manufactures mobile adoption or delivery evidence.
  mobileData = {},
  mobileStudents = [],
  mobileCounselors = [],
  mobileSessions = [],
  mobileDevices = [],
  mobileNotifications = [],
  mobileSupportRequests = [],
  mobileTasks = [],
  mobileDocuments = [],
  mobilePayments = [],
  onPrepareMobilePush,

  // Optional HR OS evidence forwarded from AnalyticsPage / Admin CRM.
  // Missing HR domains remain unavailable; no people, leave, recruitment,
  // training or performance records are fabricated.
  hrData = {},
  hrEmployees = [],
  hrStaff = [],
  hrCounselors = [],
  hrAdminProfiles = [],
  hrUsers = [],
  hrTasks = [],
  hrSupportRequests = [],
  hrApplications = [],
  hrLeaves = [],
  hrCandidates = [],
  hrTraining = [],

  // Optional Communication OS integrations / telemetry.
  communicationData = {},
  onCreateCommunicationCampaign,
  onOpenCommunicationRecord,
  onOpenWhatsApp,
  onOpenEmail,
  onOpenCall,
  onOpenMeeting,

  // Optional Compliance OS evidence integrations.
  complianceData = {},
  complianceAuditLogs = [],
  compliancePolicies = [],
  complianceRisks = [],
  complianceIncidents = [],
  complianceDataRecords = [],
  complianceAccessLogs = [],
  onCreateComplianceRisk,
  onUpdateComplianceRisk,
  onDeleteComplianceRisk,
  onCreateCompliancePolicy,
  onUpdateCompliancePolicy,
  onDeleteCompliancePolicy,
  onGenerateComplianceReport,
  onExportComplianceReport,
}) {
  const [scores, setScores] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loadingScores, setLoadingScores] = useState(false);
  const [error, setError] = useState("");
  const [showDeveloperTools, setShowDeveloperTools] = useState(false);
  const [activeView, setActiveView] = useState(() => getStoredExecutiveView());
  const [lastLoadedAt, setLastLoadedAt] = useState(null);
  const [showExecutiveSnapshot, setShowExecutiveSnapshot] = useState(true);

  const loadExecutiveScores = useCallback(async () => {
    setLoadingScores(true);
    setError("");

    try {
      const result = await getExecutiveScoreSummary();

      if (result?.error) {
        throw result.error;
      }

      const nextScores = safeArray(result?.scores).filter(Boolean);

      setScores(nextScores);
      setSummary(result && typeof result === "object" ? result : null);
      setLastLoadedAt(new Date());
    } catch (err) {
      console.error("Executive score loading failed:", err);
      setError(err?.message || "Executive scores crashed while loading.");
      setScores([]);
      setSummary(null);
    } finally {
      setLoadingScores(false);
    }
  }, []);

  useEffect(() => {
    void loadExecutiveScores();
  }, [loadExecutiveScores]);

  useEffect(() => {
    persistExecutiveView(activeView);
  }, [activeView]);

  const commandMetrics = useMemo(() => buildCommandMetrics(scores), [scores]);
  const operations = useMemo(() => buildOperationsCenter(scores), [scores]);
  const alertSnapshot = useMemo(() => buildExecutiveAlertSnapshot(scores), [scores]);
  const executiveSnapshotV2 = useMemo(
    () => buildExecutiveSnapshotV2(scores, operations, commandMetrics, alertSnapshot),
    [scores, operations, commandMetrics, alertSnapshot]
  );

  const mobileSnapshot = useMemo(
    () => {
      const data =
        mobileData && typeof mobileData === "object"
          ? mobileData
          : {};

      const contextualStudents =
        mobileStudents.length > 0
          ? mobileStudents
          : safeArray(data.students || data.studentProfiles).length > 0
            ? safeArray(data.students || data.studentProfiles)
            : scores.length > 0
              ? scores
              : safeArray(inquiries);

      const contextualCounselors =
        mobileCounselors.length > 0
          ? mobileCounselors
          : safeArray(data.counselors || data.counselorProfiles).length > 0
            ? safeArray(data.counselors || data.counselorProfiles)
            : hrCounselors.length > 0
              ? hrCounselors
              : safeArray(hrEmployees).filter((person) =>
                  normalize(
                    person?.role ||
                      person?.user_role ||
                      person?.userRole ||
                      person?.job_title ||
                      person?.jobTitle
                  ).includes("counselor")
                );

      return {
        // Identity/workload context may reuse real Admin CRM/HR records.
        students: contextualStudents,
        counselors: contextualCounselors,

        // Mobile telemetry remains explicit. We do not infer sessions, devices
        // or delivery outcomes from portal activity.
        mobileSessions:
          mobileSessions.length > 0
            ? mobileSessions
            : safeArray(
                data.mobileSessions ||
                  data.sessions ||
                  data.studentSessions
              ),

        mobileDevices:
          mobileDevices.length > 0
            ? mobileDevices
            : safeArray(
                data.mobileDevices ||
                  data.devices ||
                  data.pushDevices
              ),

        pushNotifications:
          mobileNotifications.length > 0
            ? mobileNotifications
            : safeArray(
                data.pushNotifications ||
                  data.mobileNotifications ||
                  data.notifications
              ),

        supportRequests:
          mobileSupportRequests.length > 0
            ? mobileSupportRequests
            : safeArray(
                data.supportRequests ||
                  data.studentSupportRequests
              ).length > 0
              ? safeArray(
                  data.supportRequests ||
                    data.studentSupportRequests
                )
              : safeArray(hrSupportRequests),

        tasks:
          mobileTasks.length > 0
            ? mobileTasks
            : safeArray(
                data.tasks ||
                  data.studentTasks ||
                  data.counselorTasks
              ).length > 0
              ? safeArray(
                  data.tasks ||
                    data.studentTasks ||
                    data.counselorTasks
                )
              : safeArray(hrTasks),

        documents:
          mobileDocuments.length > 0
            ? mobileDocuments
            : safeArray(
                data.documents ||
                  data.studentDocuments
              ).length > 0
              ? safeArray(
                  data.documents ||
                    data.studentDocuments
                )
              : safeArray(studentDocuments),

        payments:
          mobilePayments.length > 0
            ? mobilePayments
            : safeArray(
                data.payments ||
                  data.studentPayments
              ).length > 0
              ? safeArray(
                  data.payments ||
                    data.studentPayments
                )
              : safeArray(financePayments),
      };
    },
    [
      mobileData,
      mobileStudents,
      mobileCounselors,
      mobileSessions,
      mobileDevices,
      mobileNotifications,
      mobileSupportRequests,
      mobileTasks,
      mobileDocuments,
      mobilePayments,
      scores,
      inquiries,
      hrCounselors,
      hrEmployees,
      hrSupportRequests,
      hrTasks,
      studentDocuments,
      financePayments,
    ]
  );

  const marketingSnapshot = useMemo(
    () => {
      const data =
        marketingData && typeof marketingData === "object"
          ? marketingData
          : {};

      return {
        // Real CRM intake is the top-of-funnel evidence. Unknown source,
        // campaign and UTM fields remain unknown inside Marketing OS.
        students: safeArray(inquiries),
        inquiries: safeArray(inquiries),

        // Existing Executive journey evidence supplies downstream stages.
        applications: scores.filter((score) =>
          ["application_started", "application_submitted", "application_under_review"].includes(
            getJourneyStage(score)
          )
        ),
        offers: scores.filter((score) =>
          ["offer_received", "offer_accepted"].includes(getJourneyStage(score))
        ),
        casRecords: scores.filter((score) =>
          ["cas_pending", "cas_issued"].includes(getJourneyStage(score))
        ),
        visas: scores.filter((score) =>
          ["visa_pending", "visa_rejected", "visa_approved", "enrolled"].includes(
            getJourneyStage(score)
          )
        ),

        // Real linked payment evidence is available for revenue attribution.
        // Marketing OS itself decides whether spend-backed ROI is measurable.
        payments: safeArray(financePayments),

        campaigns:
          marketingCampaigns.length > 0
            ? marketingCampaigns
            : safeArray(
                data.campaigns ||
                  data.marketingCampaigns
              ),

        marketingExpenses:
          marketingExpenses.length > 0
            ? marketingExpenses
            : safeArray(
                data.marketingExpenses ||
                  data.expenses ||
                  data.adSpend
              ),

        content:
          marketingContent.length > 0
            ? marketingContent
            : safeArray(
                data.content ||
                  data.contentItems ||
                  data.contentPlan ||
                  data.contentRecords
              ),
      };
    },
    [
      marketingData,
      marketingCampaigns,
      marketingExpenses,
      marketingContent,
      inquiries,
      scores,
      financePayments,
    ]
  );

  const knowledgeSnapshot = useMemo(
    () => {
      const data =
        knowledgeData && typeof knowledgeData === "object"
          ? knowledgeData
          : {};

      const explicitPolicies =
        knowledgePolicies.length > 0
          ? knowledgePolicies
          : safeArray(data.policies || data.policyRecords);

      const governedPolicies =
        explicitPolicies.length > 0
          ? explicitPolicies
          : safeArray(compliancePolicies);

      return {
        items:
          knowledgeItems.length > 0
            ? knowledgeItems
            : safeArray(
                data.items ||
                  data.knowledgeItems ||
                  data.assets
              ),

        sops:
          knowledgeSops.length > 0
            ? knowledgeSops
            : safeArray(data.sops || data.sopRecords),

        training:
          knowledgeTraining.length > 0
            ? knowledgeTraining
            : safeArray(
                data.training ||
                  data.trainingRecords ||
                  data.courses
              ),

        universityRules:
          knowledgeUniversityRules.length > 0
            ? knowledgeUniversityRules
            : safeArray(
                data.universityRules ||
                  data.universityKnowledge
              ),

        visaGuides:
          knowledgeVisaGuides.length > 0
            ? knowledgeVisaGuides
            : safeArray(
                data.visaGuides ||
                  data.visaKnowledge
              ),

        // Compliance policies are reused only because they are real governed
        // policy records already present in the same Admin OS. We do not
        // manufacture SOP, training, university or visa knowledge from other
        // datasets.
        policies: governedPolicies,
      };
    },
    [
      knowledgeData,
      knowledgeItems,
      knowledgeSops,
      knowledgeTraining,
      knowledgeUniversityRules,
      knowledgeVisaGuides,
      knowledgePolicies,
      compliancePolicies,
    ]
  );

  const partnerSnapshot = useMemo(
    () => {
      const data =
        partnerData && typeof partnerData === "object"
          ? partnerData
          : {};

      const records =
        partnerRecords.length > 0
          ? partnerRecords
          : safeArray(
              data.partners ||
                data.partnerRecords ||
                data.organizations
            );

      const agents =
        partnerAgents.length > 0
          ? partnerAgents
          : safeArray(
              data.agents ||
                data.agentPartners ||
                data.recruitmentPartners
            );

      const universities =
        partnerUniversities.length > 0
          ? partnerUniversities
          : safeArray(
              data.universityPartners ||
                data.universities ||
                data.institutionPartners
            );

      const commissions =
        partnerCommissions.length > 0
          ? partnerCommissions
          : safeArray(
              data.commissions ||
                data.partnerCommissions
            ).length > 0
            ? safeArray(
                data.commissions ||
                  data.partnerCommissions
              )
            : safeArray(financeCommissions);

      const performance =
        partnerPerformance.length > 0
          ? partnerPerformance
          : safeArray(
              data.performance ||
                data.partnerPerformance
            );

      const analytics =
        partnerAnalytics &&
        typeof partnerAnalytics === "object" &&
        Object.keys(partnerAnalytics).length > 0
          ? partnerAnalytics
          : data.analytics || data.partnerAnalytics || {};

      return {
        partners: records,
        partnerRecords: records,
        agents,
        agentPartners: agents,
        universityPartners: universities,
        universities,
        commissions,
        partnerCommissions: commissions,
        performance,
        partnerPerformance: performance,
        analytics,
        partnerAnalytics: analytics,

        // Real CRM/journey/finance context is forwarded separately. The
        // Partner OS child panels decide whether any record is explicitly
        // attributable to a partner; unlinked records stay unlinked.
        inquiries: safeArray(inquiries),
        students: safeArray(inquiries),

        applications: scores.filter((score) =>
          [
            "application_started",
            "application_submitted",
            "application_under_review",
          ].includes(getJourneyStage(score))
        ),

        offers: scores.filter((score) =>
          ["offer_received", "offer_accepted"].includes(
            getJourneyStage(score)
          )
        ),

        casRecords: scores.filter((score) =>
          ["cas_pending", "cas_issued"].includes(
            getJourneyStage(score)
          )
        ),

        visas: scores.filter((score) =>
          [
            "visa_pending",
            "visa_rejected",
            "visa_approved",
            "enrolled",
          ].includes(getJourneyStage(score))
        ),

        payments: safeArray(financePayments),
      };
    },
    [
      partnerData,
      partnerRecords,
      partnerAgents,
      partnerUniversities,
      partnerCommissions,
      partnerPerformance,
      partnerAnalytics,
      financeCommissions,
      financePayments,
      inquiries,
      scores,
    ]
  );

  const agentSnapshot = useMemo(
    () => {
      const data =
        agentData && typeof agentData === "object"
          ? agentData
          : {};

      const hasAgentAttribution = (record = {}) => {
        const explicitAgent =
          record.agent_name ||
          record.agentName ||
          record.agent_id ||
          record.agentId ||
          record.referrer_name ||
          record.referrerName ||
          record.referrer_id ||
          record.referrerId ||
          record.source_agent ||
          record.sourceAgent ||
          record.created_by_agent ||
          record.createdByAgent ||
          record.agent;

        if (explicitAgent) return true;

        const source = normalize(
          record.source ||
            record.source_channel ||
            record.sourceChannel ||
            record.channel ||
            record.lead_source ||
            record.leadSource
        );

        return source.includes("agent");
      };

      const explicitStudents =
        agentStudents.length > 0
          ? agentStudents
          : safeArray(
              data.students ||
                data.agentStudents ||
                data.leads ||
                data.inquiries
            );

      const attributedStudents =
        explicitStudents.length > 0
          ? explicitStudents
          : safeArray(inquiries).filter(hasAgentAttribution);

      const attributedScores = scores.filter(hasAgentAttribution);

      return {
        // Confirmed individual agent identities/accounts.
        agentAccounts:
          agentAccounts.length > 0
            ? agentAccounts
            : safeArray(
                data.agentAccounts ||
                  data.agents ||
                  data.agentDirectory ||
                  data.agentProfiles
              ),

        // Student records are restricted to agent-attributed evidence.
        students: attributedStudents,
        agentStudents: attributedStudents,

        applications: attributedScores.filter((score) =>
          [
            "application_started",
            "application_submitted",
            "application_under_review",
          ].includes(getJourneyStage(score))
        ),

        offers: attributedScores.filter((score) =>
          ["offer_received", "offer_accepted"].includes(
            getJourneyStage(score)
          )
        ),

        casRecords: attributedScores.filter((score) =>
          ["cas_pending", "cas_issued"].includes(
            getJourneyStage(score)
          )
        ),

        visas: attributedScores.filter((score) =>
          [
            "visa_pending",
            "visa_rejected",
            "visa_approved",
            "enrolled",
          ].includes(getJourneyStage(score))
        ),

        // Revenue/commission evidence remains explicit and agent-attributed.
        payments: safeArray(
          data.payments ||
            data.agentPayments
        ).filter(hasAgentAttribution),

        commissions:
          agentCommissions.length > 0
            ? agentCommissions
            : safeArray(
                data.commissions ||
                  data.agentCommissions
              ).filter(hasAgentAttribution),
      };
    },
    [
      agentData,
      agentAccounts,
      agentStudents,
      agentCommissions,
      inquiries,
      scores,
    ]
  );


  const financeSnapshot = useMemo(
    () => ({
      ...(financeData && typeof financeData === "object" ? financeData : {}),

      // Executive scores provide real journey-stage evidence for forecasting.
      students: scores,
      applications: scores.filter((score) =>
        ["application_started", "application_submitted", "application_under_review"].includes(
          getJourneyStage(score)
        )
      ),
      offers: scores.filter((score) =>
        ["offer_received", "offer_accepted"].includes(getJourneyStage(score))
      ),
      casRecords: scores.filter((score) =>
        ["cas_pending", "cas_issued"].includes(getJourneyStage(score))
      ),
      visas: scores.filter((score) =>
        ["visa_pending", "visa_rejected", "visa_approved", "enrolled"].includes(
          getJourneyStage(score)
        )
      ),

      // Monetary sources must be real records. Empty arrays stay empty rather
      // than being synthesized from executive scores.
      invoices:
        financeInvoices.length > 0
          ? financeInvoices
          : safeArray(financeData?.invoices || financeData?.studentInvoices),
      payments:
        financePayments.length > 0
          ? financePayments
          : safeArray(financeData?.payments || financeData?.studentPayments),
      expenses:
        financeExpenses.length > 0
          ? financeExpenses
          : safeArray(
              financeData?.expenses ||
                financeData?.companyExpenses ||
                financeData?.marketingExpenses ||
                financeData?.adSpend
            ),
      commissions:
        financeCommissions.length > 0
          ? financeCommissions
          : safeArray(
              financeData?.commissions ||
                financeData?.agentCommissions ||
                financeData?.counselorCommissions
            ),
      agents:
        financeAgents.length > 0
          ? financeAgents
          : safeArray(
              financeData?.agents ||
                financeData?.agentPerformance ||
                financeData?.agentStudents
            ),
    }),
    [
      scores,
      financeData,
      financeInvoices,
      financePayments,
      financeExpenses,
      financeCommissions,
      financeAgents,
    ]
  );

  const hrSnapshot = useMemo(
    () => ({
      ...(hrData && typeof hrData === "object" ? hrData : {}),

      // People identity sources must be real records.
      employees:
        hrEmployees.length > 0
          ? hrEmployees
          : safeArray(hrData?.employees),
      staff:
        hrStaff.length > 0
          ? hrStaff
          : safeArray(hrData?.staff),
      counselors:
        hrCounselors.length > 0
          ? hrCounselors
          : safeArray(hrData?.counselors || hrData?.counselorProfiles),
      adminProfiles:
        hrAdminProfiles.length > 0
          ? hrAdminProfiles
          : safeArray(hrData?.adminProfiles),
      users:
        hrUsers.length > 0
          ? hrUsers
          : safeArray(hrData?.users),

      // Operational evidence can be supplied directly. We deliberately do not
      // synthesize employees or HR decisions from Executive score rows.
      tasks:
        hrTasks.length > 0
          ? hrTasks
          : safeArray(hrData?.tasks || hrData?.studentTasks || hrData?.counselorTasks),
      supportRequests:
        hrSupportRequests.length > 0
          ? hrSupportRequests
          : safeArray(
              hrData?.supportRequests ||
                hrData?.support ||
                hrData?.studentSupportRequests
            ),
      applications:
        hrApplications.length > 0
          ? hrApplications
          : safeArray(hrData?.applications || hrData?.studentApplications),
      leaves:
        hrLeaves.length > 0
          ? hrLeaves
          : safeArray(hrData?.leaves || hrData?.leaveRequests || hrData?.timeOff),
      candidates:
        hrCandidates.length > 0
          ? hrCandidates
          : safeArray(hrData?.candidates || hrData?.recruitment || hrData?.applicants),
      training:
        hrTraining.length > 0
          ? hrTraining
          : safeArray(hrData?.training || hrData?.trainingRecords || hrData?.courses),
    }),
    [
      hrData,
      hrEmployees,
      hrStaff,
      hrCounselors,
      hrAdminProfiles,
      hrUsers,
      hrTasks,
      hrSupportRequests,
      hrApplications,
      hrLeaves,
      hrCandidates,
      hrTraining,
    ]
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

  const executiveRecoveryActions = useMemo(() => {
    const recoverySource = brokenWorkflowScanner.brokenWorkflows || [];

    return normalizeExecutiveRecoveryActions(
      runVerificationBuilder(
        buildExecutiveRecoveryActions,
        recoverySource,
        {
          immediateActions: [],
          executiveActions: [],
          counselorActions: [],
        }
      )
    );
  }, [brokenWorkflowScanner]);

  const handleGenerated = async () => {
    await loadExecutiveScores();
  };

  const handleActionExecuted = async () => {
    await loadExecutiveScores();
  };

  const changeActiveView = (view) => {
    setActiveView(VALID_EXECUTIVE_VIEWS.has(view) ? view : "operations");
  };

  const handleOpenAICommandModule = useCallback((moduleId) => {
    const nextView = AI_COMMAND_MODULE_VIEW_MAP[moduleId];

    if (!nextView) {
      console.warn(`Unknown AI Command module: ${moduleId}`);
      return;
    }

    setActiveView(nextView);
  }, []);

  return (
    <div className="space-y-6 rounded-[2rem] bg-[#fff8ee] p-1 text-[#10233f] sm:p-2">
      <div className="relative rounded-[2rem] border-[3px] border-orange-400 bg-[#FFF8EE] p-3 shadow-[0_20px_70px_rgba(15,35,63,0.08)] sm:p-4">
        <div className="grid overflow-hidden rounded-[1.65rem] border-2 border-[#123865] xl:grid-cols-[1.25fr_0.75fr]">
          <div className="flex min-h-[310px] flex-col bg-[#123865] p-6 text-white sm:p-7">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.25em] text-orange-300">
                Executive Operations Center
              </p>

              <h2 className="mt-2 max-w-3xl text-3xl font-black text-white">
                Zaifan Executive Command System
              </h2>

              <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-white/90">
                One command layer for student movement, executive watchlists,
                counselor workload, workflow integrity, automation and recovery.
              </p>
            </div>

            <div className="mt-auto flex flex-wrap justify-start gap-2 pt-8 lg:justify-end">
              <button
                type="button"
                onClick={() => void loadExecutiveScores()}
                disabled={loadingScores}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border-2 border-white/30 bg-white px-4 py-2.5 text-xs font-black text-[#123865] shadow-[0_8px_18px_rgba(0,0,0,0.08)] transition hover:-translate-y-0.5 hover:bg-orange-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <RefreshCw size={14} className={loadingScores ? "animate-spin" : ""} />
                {loadingScores ? "Reloading..." : "Reload Scores"}
              </button>

              <button
                type="button"
                onClick={() => setShowDeveloperTools((prev) => !prev)}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border-2 border-orange-300/70 bg-white/10 px-4 py-2.5 text-xs font-black text-white transition hover:-translate-y-0.5 hover:bg-white/20"
              >
                <Wrench size={14} />
                {showDeveloperTools ? "Hide Developer Tools" : "Developer Tools"}
              </button>
            </div>
          </div>

          <div className="border-t-2 border-orange-300 bg-orange-500 p-6 text-white xl:border-l-2 xl:border-t-0 sm:p-7">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white">
              Command State
            </p>
            <p className="mt-3 text-4xl font-black text-white">
              {commandMetrics.total}
            </p>
            <p className="mt-1 text-sm font-black text-white">
              students in executive portfolio
            </p>
            <div className="mt-5 grid grid-cols-2 gap-2">
              <div className="rounded-2xl border border-white/25 bg-white/10 p-3">
                <p className="text-[8px] font-black uppercase tracking-[0.13em] text-white">Critical</p>
                <p className="mt-1 text-xl font-black text-white">{commandMetrics.critical}</p>
              </div>
              <div className="rounded-2xl border border-white/25 bg-white/10 p-3">
                <p className="text-[8px] font-black uppercase tracking-[0.13em] text-white">Ready</p>
                <p className="mt-1 text-xl font-black text-white">{commandMetrics.conversionReady}</p>
              </div>
            </div>

            <div className="mt-3 rounded-xl border-2 border-white/25 bg-white/10 p-3 text-white">
              <p className="text-[8px] font-black uppercase tracking-[0.1em] text-white">
                Data Freshness
              </p>
              <p className="mt-1 text-xs font-black text-white">
                {lastLoadedAt
                  ? `Updated ${lastLoadedAt.toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}`
                  : loadingScores
                  ? "Loading executive portfolio..."
                  : "Not loaded yet"}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-3 rounded-[1.5rem] border-2 border-orange-200 bg-[#FFFDF8] p-5 sm:p-6">

        {error ? (
          <div className="mt-5 rounded-[1.25rem] border-[3px] border-red-400 bg-red-50 p-4 text-sm font-semibold text-red-700">
            {error}
          </div>
        ) : null}

        {!loadingScores && !error && scores.length === 0 ? (
          <div className="mt-5 rounded-[1.4rem] border-[3px] border-dashed border-slate-300 bg-white p-6 text-center">
            <p className="font-black text-[#10233f]">No executive score records yet</p>
            <p className="mx-auto mt-2 max-w-2xl text-sm font-semibold leading-6 text-slate-600">
              Generate or load Student OS executive scores before using portfolio,
              verification, automation, and recovery intelligence.
            </p>
          </div>
        ) : null}

        <section className="mt-6 overflow-hidden rounded-[1.75rem] border-[3px] border-[#123865] bg-[#FFFDF8] shadow-[0_12px_32px_rgba(15,35,63,0.06)]">
          <div className="flex flex-col gap-2 border-b-[3px] border-orange-400 bg-[#123865] px-5 py-4 text-white sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.15em] text-orange-300">
                Executive Signal Wall
              </p>
              <h3 className="mt-1 text-lg font-black text-white">
                Portfolio pressure & readiness
              </h3>
              <p className="mt-1 text-xs font-semibold text-white/80">
                Read-only executive metrics derived from the currently loaded score portfolio.
              </p>
            </div>
            <span className="w-fit rounded-xl border-2 border-white/25 bg-white/10 px-3 py-2 text-[9px] font-black uppercase tracking-[0.1em] text-white">
              {commandMetrics.total} scored records
            </span>
          </div>

          <div className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 sm:p-5">
            <SummaryCard label="Students Scored" value={summary?.total ?? commandMetrics.total} tone="navy" />
            <SummaryCard label="Critical Risk" value={summary?.criticalRisk ?? summary?.critical ?? commandMetrics.critical} tone="red" />
            <SummaryCard label="Executive Priority" value={commandMetrics.executivePriority} tone="orange" />
            <SummaryCard label="Conversion Ready" value={summary?.conversionReady ?? commandMetrics.conversionReady} tone="green" />
            <SummaryCard label="Visa/CAS Watch" value={commandMetrics.visaWatch} tone="blue" />
            <SummaryCard label="Verified Outcomes" value={summary?.verifiedOutcomes ?? summary?.successStories ?? commandMetrics.verifiedOutcomes} tone="green" />
            <SummaryCard label="Avg Risk" value={summary?.averageRisk ?? commandMetrics.averageRisk} tone="red" />
            <SummaryCard label="Avg Opportunity" value={summary?.averageOpportunity ?? commandMetrics.averageOpportunity} tone="green" />
            <SummaryCard label="Workflow Integrity" value={`${workflowIntegrity.overallIntegrity || 0}%`} tone={(workflowIntegrity.overallIntegrity || 0) >= 75 ? "green" : "orange"} />
            <SummaryCard label="Production Ready" value={`${productionReadiness.readinessScore || 0}%`} tone={getGoLiveTone(productionReadiness.goLiveStatus, productionReadiness.readinessScore)} />
          </div>
        </section>

        <CommandDisclosure
          eyebrow="Executive Intelligence"
          title="Unified Enterprise Health Wall"
          description="Portfolio, workflow, system coverage and executive risk intelligence."
          open={showExecutiveSnapshot}
          onToggle={() => setShowExecutiveSnapshot((current) => !current)}
          icon={Gauge}
        >
          <ExecutiveSnapshotV2
            snapshot={executiveSnapshotV2}
            setActiveView={changeActiveView}
            verificationSnapshot={platformVerificationSnapshot}
            workflowScanner={brokenWorkflowScanner}
            workflowIntegrity={workflowIntegrity}
            productionReadiness={productionReadiness}
            executiveRecoveryActions={executiveRecoveryActions}
          />
        </CommandDisclosure>

        </div>
      </div>

      <CommandTabs activeView={activeView} setActiveView={changeActiveView} />

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

      <Suspense fallback={<CommandModuleLoader label="Opening executive command module..." />}>
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
        <KnowledgeOSDashboard
          snapshot={knowledgeSnapshot}
          adminProfile={adminProfile}
          onRefresh={loadExecutiveScores}
        />
      ) : null}

      {activeView === "marketing-os" ? (
        <MarketingOSDashboard
          snapshot={marketingSnapshot}
          adminProfile={adminProfile}
          onRefresh={loadExecutiveScores}
          onCreateContent={onCreateMarketingContent}
          onDeleteContent={onDeleteMarketingContent}
        />
      ) : null}

      {activeView === "mobile-os" ? (
        <MobileControlCenter
          snapshot={mobileSnapshot}
          adminProfile={adminProfile}
          onRefresh={loadExecutiveScores}
          onPreparePush={onPrepareMobilePush}
        />
      ) : null}

      {activeView === "communication-os" ? (
        <CommunicationOSDashboard
          adminProfile={adminProfile}
          inquiries={inquiries}
          appointments={appointments}
          followUpReminders={followUpReminders}
          communicationData={communicationData}
          onCreateCampaign={onCreateCommunicationCampaign}
          onOpenRecord={onOpenCommunicationRecord}
          onOpenWhatsApp={onOpenWhatsApp}
          onOpenEmail={onOpenEmail}
          onOpenCall={onOpenCall}
          onOpenMeeting={onOpenMeeting}
        />
      ) : null}

      {activeView === "compliance-os" ? (
        <ComplianceOSDashboard
          adminProfile={adminProfile}
          snapshot={{
            ...(complianceData && typeof complianceData === "object"
              ? complianceData
              : {}),

            // Prefer dedicated compliance sources when connected.
            // Fall back only to genuine existing Admin evidence.
            auditLogs:
              complianceAuditLogs.length > 0
                ? complianceAuditLogs
                : executiveExecutionLogs,

            policies: compliancePolicies,
            risks: complianceRisks,
            incidents: complianceIncidents,

            studentDocuments:
              complianceDataRecords.length > 0
                ? complianceDataRecords
                : studentDocuments,

            accessLogs: complianceAccessLogs,
          }}
          onRefresh={loadExecutiveScores}
        />
      ) : null}

      {activeView === "partner-os" ? (
        <PartnerOSDashboard
          snapshot={partnerSnapshot}
          adminProfile={adminProfile}
          onRefresh={loadExecutiveScores}
        />
      ) : null}

      {activeView === "agent-os" ? (
        <AgentOSDashboard
          snapshot={agentSnapshot}
          adminProfile={adminProfile}
          onRefresh={loadExecutiveScores}
          onSubmitLead={onSubmitAgentLead}
          onCheckDuplicate={onCheckAgentDuplicate}
        />
      ) : null}

      {activeView === "finance-os" ? (
        <FinanceOSDashboard
          snapshot={financeSnapshot}
          adminProfile={adminProfile}
          onRefresh={loadExecutiveScores}
        />
      ) : null}

      {activeView === "hr-os" ? (
        <HROSDashboard
          snapshot={hrSnapshot}
          adminProfile={adminProfile}
          onRefresh={loadExecutiveScores}
        />
      ) : null}

      {activeView === "ai-command" ? (
        <AICommandCenter
          adminProfile={adminProfile}
          snapshot={{
            students: scores,
            scores,
            summary,
            operations,
            commandMetrics,
            alertSnapshot,
            executiveSnapshot: executiveSnapshotV2,
            verificationSnapshot: platformVerificationSnapshot,
            workflowScanner: brokenWorkflowScanner,
            workflowIntegrity,
            productionReadiness,
            recoveryActions: executiveRecoveryActions,
          }}
          onRefresh={loadExecutiveScores}
          onOpenSystem={changeActiveView}
          onOpenModule={handleOpenAICommandModule}
        />
      ) : null}

      {activeView === "ai-command-copilot" ? (
        <ExecutiveCopilot
          adminProfile={adminProfile}
          snapshot={{
            students: scores,
            scores,
            summary,
            operations,
            commandMetrics,
            alertSnapshot,
            executiveSnapshot: executiveSnapshotV2,
            verificationSnapshot: platformVerificationSnapshot,
            workflowScanner: brokenWorkflowScanner,
            workflowIntegrity,
            productionReadiness,
            recoveryActions: executiveRecoveryActions,
          }}
          onRefresh={loadExecutiveScores}
          onOpenSystem={changeActiveView}
          onOpenModule={handleOpenAICommandModule}
        />
      ) : null}

      {activeView === "ai-command-predictive" ? (
        <PredictiveInsights
          adminProfile={adminProfile}
          snapshot={{
            students: scores,
            scores,
            summary,
            operations,
            commandMetrics,
            alertSnapshot,
            executiveSnapshot: executiveSnapshotV2,
            verificationSnapshot: platformVerificationSnapshot,
            workflowScanner: brokenWorkflowScanner,
            workflowIntegrity,
            productionReadiness,
            recoveryActions: executiveRecoveryActions,
          }}
          onRefresh={loadExecutiveScores}
          onOpenSystem={changeActiveView}
          onOpenModule={handleOpenAICommandModule}
        />
      ) : null}

      {activeView === "ai-command-workflow" ? (
        <WorkflowIntelligence
          adminProfile={adminProfile}
          snapshot={{
            students: scores,
            scores,
            summary,
            operations,
            commandMetrics,
            alertSnapshot,
            executiveSnapshot: executiveSnapshotV2,
            verificationSnapshot: platformVerificationSnapshot,
            workflowScanner: brokenWorkflowScanner,
            workflowIntegrity,
            productionReadiness,
            recoveryActions: executiveRecoveryActions,
          }}
          onRefresh={loadExecutiveScores}
          onOpenSystem={changeActiveView}
          onOpenModule={handleOpenAICommandModule}
        />
      ) : null}

      {activeView === "ai-command-cross-system" ? (
        <CrossSystemIntelligence
          adminProfile={adminProfile}
          snapshot={{
            students: scores,
            scores,
            summary,
            operations,
            commandMetrics,
            alertSnapshot,
            executiveSnapshot: executiveSnapshotV2,
            verificationSnapshot: platformVerificationSnapshot,
            workflowScanner: brokenWorkflowScanner,
            workflowIntegrity,
            productionReadiness,
            recoveryActions: executiveRecoveryActions,
          }}
          onRefresh={loadExecutiveScores}
          onOpenSystem={changeActiveView}
          onOpenModule={handleOpenAICommandModule}
        />
      ) : null}

      {activeView === "ai-command-analytics" ? (
        <AIAnalytics
          adminProfile={adminProfile}
          snapshot={{
            students: scores,
            scores,
            summary,
            operations,
            commandMetrics,
            alertSnapshot,
            executiveSnapshot: executiveSnapshotV2,
            verificationSnapshot: platformVerificationSnapshot,
            workflowScanner: brokenWorkflowScanner,
            workflowIntegrity,
            productionReadiness,
            recoveryActions: executiveRecoveryActions,
          }}
          onRefresh={loadExecutiveScores}
          onOpenSystem={changeActiveView}
          onOpenModule={handleOpenAICommandModule}
        />
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
      </Suspense>

      {showDeveloperTools ? (
        <Suspense fallback={<CommandModuleLoader label="Loading developer tools..." />}>
        <div className="space-y-6 rounded-[2rem] border-[3px] border-slate-300 bg-white p-5 shadow-sm">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.25em] text-slate-500">
              Advanced Developer Tools
            </p>
            <h3 className="mt-2 text-xl font-black text-[#10233f]">
              Controlled Executive AI Tools
            </h3>
            <p className="mt-2 text-sm text-slate-500">
              Use for score generation, automation-template inspection, and approved execution testing. Keep this area closed during normal counselor and executive operations.
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
        </Suspense>
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

  const highestRisk = riskFeed.reduce(
    (total, item) => total + number(item?.value, 0),
    0
  );

  return (
    <div className="space-y-5">
      <section className="overflow-hidden rounded-[1.9rem] border-[3px] border-orange-400 bg-[#FFF8EF] shadow-[0_16px_42px_rgba(15,35,63,0.08)]">
        <div className="grid xl:grid-cols-[1.35fr_0.65fr]">
          <div className="bg-[#123865] p-5 text-white sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[9px] font-black uppercase tracking-[0.14em] text-white">
                    Executive Intelligence
                  </span>
                  <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[9px] font-black uppercase tracking-[0.14em] text-white">
                    Enterprise Health
                  </span>
                </div>

                <h3 className="mt-4 text-2xl font-black tracking-tight text-white sm:text-3xl">
                  Unified Enterprise Health Wall
                </h3>

                <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-white/90">
                  One executive view of launch readiness, workflow integrity, student movement,
                  system coverage and the risks that need leadership attention first.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setActiveView?.("verification")}
                className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl border-2 border-white/35 bg-white/10 px-4 py-2.5 text-xs font-black text-white transition hover:-translate-y-0.5 hover:bg-white/20"
              >
                <ShieldCheck size={14} />
                Verification Center
              </button>
            </div>

            <div className="mt-5 grid gap-2 sm:grid-cols-4">
              <ExecutiveHeroMetric
                label="Platform Health"
                value={`${headline.platformHealth || 0}%`}
              />
              <ExecutiveHeroMetric
                label="Workflow Integrity"
                value={`${integrityScore}%`}
              />
              <ExecutiveHeroMetric
                label="Broken Workflows"
                value={brokenWorkflows}
              />
              <ExecutiveHeroMetric
                label="Recovery Queue"
                value={recoveryTotal}
              />
            </div>
          </div>

          <div className="bg-orange-500 p-5 text-white sm:p-6">
            <p className="text-[9px] font-black uppercase tracking-[0.18em] text-white">
              Executive Readiness
            </p>

            <p className="mt-3 text-4xl font-black text-white">
              {readinessScore}%
            </p>

            <p className="mt-1 text-sm font-black uppercase tracking-[0.08em] text-white">
              {formatLabel(productionReadiness.goLiveStatus || "not_ready")}
            </p>

            <p className="mt-3 text-sm font-semibold leading-6 text-white/95">
              {criticalFailures > 0
                ? `${criticalFailures} critical workflow failure${criticalFailures === 1 ? "" : "s"} require executive review.`
                : brokenWorkflows > 0
                  ? `${brokenWorkflows} workflow issue${brokenWorkflows === 1 ? "" : "s"} remain before clean launch readiness.`
                  : "No critical workflow failures are currently reported."}
            </p>

            <div className="mt-5 rounded-2xl border border-white/30 bg-white/10 p-4">
              <p className="text-[8px] font-black uppercase tracking-[0.14em] text-white/80">
                Risk Signals
              </p>
              <p className="mt-1 text-2xl font-black text-white">
                {highestRisk}
              </p>
              <p className="mt-1 text-xs font-semibold text-white/90">
                active executive attention signals
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-3 border-t-[3px] border-[#123865] bg-[#FFF8EF] p-4 sm:grid-cols-2 lg:grid-cols-4 sm:p-5">
          <ExecutiveSummaryMetric
            label="Production Readiness"
            value={`${readinessScore}%`}
            detail={formatLabel(productionReadiness.goLiveStatus || "not_ready")}
            tone={readinessScore >= 75 ? "success" : "risk"}
          />
          <ExecutiveSummaryMetric
            label="Workflow Integrity"
            value={`${integrityScore}%`}
            detail="Cross-system workflow health"
            tone={integrityScore >= 75 ? "success" : "action"}
          />
          <ExecutiveSummaryMetric
            label="Executive Risk"
            value={headline.executiveRisk || 0}
            detail="Leadership attention pressure"
            tone={(headline.executiveRisk || 0) > 0 ? "risk" : "neutral"}
          />
          <ExecutiveSummaryMetric
            label="Conversion Ready"
            value={headline.conversionReady || 0}
            detail="Students ready for forward movement"
            tone="info"
          />
        </div>
      </section>

      <section className="rounded-[1.7rem] border-[3px] border-[#123865] bg-white p-4 sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.17em] text-orange-700">
              Student Journey Pulse
            </p>
            <h4 className="mt-1 text-xl font-black text-[#10233F]">
              Movement across the admissions journey
            </h4>
          </div>
          <span className="rounded-full border-2 border-[#123865] bg-[#123865] px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.1em] text-white">
            {journey.length} journey signals
          </span>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {journey.map((item) => (
            <ExecutiveJourneyCard key={item.label} {...item} />
          ))}
        </div>
      </section>

      <section className="overflow-hidden rounded-[1.8rem] border-[3px] border-[#123865] bg-[#FFF8EF]">
        <div className="flex flex-col gap-3 border-b-[3px] border-[#123865] bg-[#123865] p-4 text-white sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.17em] text-orange-300">
              System Coverage
            </p>
            <h4 className="mt-1 text-xl font-black text-white">
              Enterprise OS connection status
            </h4>
            <p className="mt-1 text-xs font-semibold text-white/80">
              Compact connection view only — detailed work stays inside each owned Admin OS destination.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setActiveView?.("ai-command")}
            className="inline-flex min-h-10 shrink-0 items-center justify-center rounded-xl border-2 border-white/30 bg-white/10 px-4 py-2 text-xs font-black text-white transition hover:bg-white/20"
          >
            Open AI Command
          </button>
        </div>

        <div className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 sm:p-5">
          {systems.map((item) => (
            <ExecutiveSystemCard key={item.label} {...item} />
          ))}
        </div>
      </section>

      <section className="overflow-hidden rounded-[1.8rem] border-[3px] border-red-300 bg-white">
        <div className="flex flex-col gap-3 border-b-[3px] border-red-300 bg-red-50 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.17em] text-red-700">
              Executive Risk Feed
            </p>
            <h4 className="mt-1 text-xl font-black text-[#10233F]">
              What needs attention first
            </h4>
          </div>

          <span className="rounded-full border-2 border-red-300 bg-white px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.1em] text-red-700">
            {riskFeed.length} risk categories
          </span>
        </div>

        {riskFeed.length ? (
          <div className="grid gap-3 p-4 sm:grid-cols-2 xl:grid-cols-4 sm:p-5">
            {riskFeed.map((item) => (
              <ExecutiveRiskCard key={item.label} {...item} />
            ))}
          </div>
        ) : (
          <div className="p-6 text-center">
            <CheckCircle2 size={22} className="mx-auto text-emerald-600" />
            <p className="mt-2 text-sm font-black text-[#10233F]">
              No executive risk signals are currently reported.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}

function ExecutiveHeroMetric({ label, value }) {
  return (
    <div className="rounded-2xl border border-white/15 bg-white/10 p-3">
      <p className="text-[8px] font-black uppercase tracking-[0.13em] text-white/80">
        {label}
      </p>
      <p className="mt-1 truncate text-lg font-black text-white">
        {value}
      </p>
    </div>
  );
}

function ExecutiveSummaryMetric({ label, value, detail, tone = "neutral" }) {
  const toneClass =
    tone === "risk"
      ? "border-red-400 bg-red-50"
      : tone === "action"
        ? "border-orange-400 bg-orange-50"
        : tone === "success"
          ? "border-emerald-400 bg-emerald-50"
          : tone === "info"
            ? "border-blue-400 bg-blue-50"
            : "border-[#123865] bg-slate-50";

  return (
    <div className={`rounded-[1.35rem] border-[3px] p-4 ${toneClass}`}>
      <p className="text-[8px] font-black uppercase tracking-[0.13em] text-slate-600">
        {label}
      </p>
      <p className="mt-1 text-2xl font-black text-[#10233F]">{value}</p>
      <p className="mt-1 text-[10px] font-semibold leading-4 text-slate-500">
        {detail}
      </p>
    </div>
  );
}

function ExecutiveJourneyCard({ label, value, detail, tone = "default" }) {
  const risk = tone === "red";
  const action = tone === "orange" || tone === "gold" || tone === "yellow";
  const info = tone === "blue";
  const success = tone === "green";

  const toneClass = risk
    ? "border-red-300 bg-red-50"
    : action
      ? "border-orange-300 bg-orange-50"
      : info
        ? "border-blue-300 bg-blue-50"
        : success
          ? "border-emerald-300 bg-emerald-50"
          : "border-[#C9D7E6] bg-[#FFF8EF]";

  return (
    <div className={`min-w-0 rounded-[1.25rem] border-[3px] p-4 ${toneClass}`}>
      <p className="break-words text-[8px] font-black uppercase tracking-[0.12em] text-slate-600">
        {label}
      </p>
      <p className="mt-2 text-2xl font-black text-[#10233F]">{value}</p>
      <p className="mt-1 line-clamp-2 text-[10px] font-semibold leading-4 text-slate-500">
        {detail}
      </p>
    </div>
  );
}

function ExecutiveSystemCard({ label, value, detail, tone = "default" }) {
  const needsAttention = tone === "red" || tone === "orange" || tone === "gold" || tone === "yellow";
  const toneClass = needsAttention
    ? "border-orange-300 bg-orange-50"
    : tone === "blue"
      ? "border-blue-300 bg-blue-50"
      : "border-[#C9D7E6] bg-white";

  return (
    <div className={`min-w-0 rounded-[1.25rem] border-2 p-4 ${toneClass}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="break-words text-[8px] font-black uppercase tracking-[0.12em] text-slate-500">
            {label}
          </p>
          <p className="mt-2 break-words text-xl font-black leading-tight text-[#10233F]">
            {value}
          </p>
        </div>
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border-2 border-[#C9D7E6] bg-[#FFF8EF] text-[#123865]">
          <Boxes size={13} />
        </span>
      </div>
      <p className="mt-2 line-clamp-3 text-[10px] font-semibold leading-4 text-slate-500">
        {detail}
      </p>
    </div>
  );
}

function ExecutiveRiskCard({ label, value, detail, tone = "default" }) {
  const critical = tone === "red";
  const toneClass = critical
    ? "border-red-300 bg-red-50"
    : "border-orange-300 bg-orange-50";

  return (
    <div className={`rounded-[1.25rem] border-[3px] p-4 ${toneClass}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-black text-[#10233F]">{label}</p>
          <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">
            {detail}
          </p>
        </div>
        <span className="shrink-0 rounded-xl border-2 border-white bg-white px-3 py-1.5 text-lg font-black text-[#10233F] shadow-sm">
          {value}
        </span>
      </div>
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
      <div className="rounded-[2rem] border border-orange-200 bg-gradient-to-br from-orange-50 via-white to-amber-50 p-6">
        <p className="text-xs font-black uppercase tracking-[0.25em] text-orange-600">
          CEO / Counselor Command Screen
        </p>
        <h3 className="mt-2 text-2xl font-black text-[#10233f]">
          Executive Operations Center
        </h3>
        <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-500">
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
        <div className="rounded-[1.75rem] border border-red-200 bg-red-50 p-5">
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
      <div className="rounded-[2rem] border border-orange-200 bg-gradient-to-br from-orange-50 via-white to-amber-50 p-6">
        <p className="text-xs font-black uppercase tracking-[0.25em] text-orange-600">
          Platform Verification V4
        </p>
        <h3 className="mt-2 text-2xl font-black text-[#10233f]">
          Workflow Integrity & Production Readiness
        </h3>
        <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-500">
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
          <div className="rounded-[1.75rem] border-[3px] border-slate-300 bg-white p-5">
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

          <div className="rounded-[1.75rem] border border-red-200 bg-red-50 p-5">
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
          <div className="rounded-[1.75rem] border border-orange-200 bg-orange-50 p-5">
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

          <div className="rounded-[1.75rem] border border-orange-200 bg-orange-50/70 p-5">
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
            <div className="rounded-[1.75rem] border border-red-200 bg-red-50 p-5">
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
          <p className="font-black text-[#10233f]">{title}</p>
          <p className="mt-1 text-xs leading-5 text-slate-500">{detail}</p>
        </div>
        <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">
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
    <div className="rounded-[1.75rem] border border-orange-200 bg-orange-50/70 p-5">
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
    <div className="rounded-[1.75rem] border border-emerald-200 bg-emerald-50 p-5">
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
    <div className="rounded-[1.75rem] border-[3px] border-slate-300 bg-white p-5">
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

function CommandDisclosure({
  eyebrow,
  title,
  description,
  open,
  onToggle,
  icon: Icon = Gauge,
  children,
}) {
  return (
    <section className="mt-6 overflow-hidden rounded-[1.9rem] border-[3px] border-[#123865] bg-[#FFF8EF] shadow-[0_12px_34px_rgba(15,35,63,0.06)]">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-4 border-b-[3px] border-orange-400 bg-[#123865] px-5 py-4 text-left text-white transition hover:bg-[#0F3158]"
      >
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border-2 border-orange-300/60 bg-white/10 text-white">
            <Icon size={18} />
          </span>

          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.15em] text-orange-300">
              {eyebrow}
            </p>
            <h3 className="mt-1 text-lg font-black text-white">{title}</h3>
            <p className="mt-1 max-w-4xl text-xs font-semibold leading-5 text-white/80">
              {description}
            </p>
          </div>
        </div>

        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border-2 border-white/25 bg-white/10 text-white">
          {open ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </span>
      </button>

      {open ? <div className="p-4 sm:p-5">{children}</div> : null}
    </section>
  );
}

function CommandTabs({ activeView, setActiveView }) {
  const groups = [
    {
      label: "Core Command",
      eyebrow: "Live Operations",
      icon: Gauge,
      tone: "navy",
      tabs: [
        { key: "operations", label: "Operations", icon: Activity },
        { key: "intelligence", label: "Intelligence", icon: BrainCircuit },
        { key: "notification-center", label: "Notifications", icon: BellRing },
        { key: "verification", label: "Verification", icon: ShieldCheck },
      ],
    },
    {
      label: "Execution",
      eyebrow: "Controlled Actions",
      icon: Zap,
      tone: "orange",
      tabs: [
        { key: "actions", label: "Actions", icon: Target },
        { key: "bulk-operations", label: "Bulk Ops", icon: Boxes },
        { key: "automation-control", label: "Automation Control", icon: Workflow },
        { key: "automation", label: "Automation Analytics", icon: BarChart3 },
      ],
    },
    {
      label: "Executive",
      eyebrow: "Leadership Intelligence",
      icon: BriefcaseBusiness,
      tone: "navy",
      tabs: [
        { key: "alerts", label: "Alerts", icon: BellRing },
        { key: "portfolio", label: "Portfolio", icon: ClipboardList },
        { key: "founder-growth", label: "Founder Growth", icon: Sparkles },
        { key: "ai-command", label: "AI Command", icon: BrainCircuit },
      ],
    },
  ];

  const allTabs = groups.flatMap((group) => group.tabs);
  const activeTab =
    allTabs.find((tab) => tab.key === activeView) || allTabs[0];
  const activeGroup =
    groups.find((group) => group.tabs.some((tab) => tab.key === activeView)) || groups[0];

  return (
    <section className="sticky top-3 z-20 overflow-hidden rounded-[1.8rem] border-[3px] border-[#123865] bg-[#FFF8EE] shadow-[0_14px_38px_rgba(15,35,63,0.12)]">
      <div className="flex items-center justify-between gap-3 border-b-[3px] border-orange-400 bg-[#123865] px-4 py-3 text-white lg:hidden">
        <div className="min-w-0">
          <p className="text-[8px] font-black uppercase tracking-[0.15em] text-orange-300">
            {activeGroup.label}
          </p>
          <p className="mt-0.5 truncate text-sm font-black text-white">
            {activeTab.label}
          </p>
        </div>

        <select
          value={activeView}
          onChange={(event) => setActiveView(event.target.value)}
          className="max-w-[205px] rounded-xl border-2 border-white/25 bg-white px-3 py-2 text-xs font-black text-[#10233F] outline-none focus:border-orange-400"
        >
          {groups.map((group) => (
            <optgroup key={group.label} label={group.label}>
              {group.tabs.map((tab) => (
                <option key={tab.key} value={tab.key}>
                  {tab.label}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
      </div>

      <div className="hidden gap-3 p-3 lg:grid xl:grid-cols-3">
        {groups.map((group) => {
          const GroupIcon = group.icon;
          const groupActive = group.tabs.some((tab) => tab.key === activeView);
          const isTemplate = group.tone === "template";

          return (
            <div
              key={group.label}
              className={`min-w-0 rounded-[1.35rem] border-[3px] p-3 transition ${
                groupActive
                  ? "border-orange-400 bg-orange-50 shadow-[0_8px_22px_rgba(249,115,22,0.08)]"
                  : isTemplate
                  ? "border-slate-300 bg-[#F7F4EF]"
                  : "border-[#C8D5E4] bg-white"
              }`}
            >
              <div className="flex items-start gap-2.5">
                <span
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border-2 ${
                    groupActive
                      ? "border-orange-400 bg-orange-500 text-white"
                      : isTemplate
                      ? "border-slate-300 bg-white text-slate-500"
                      : "border-[#AFC7E4] bg-[#EEF4FA] text-[#123865]"
                  }`}
                >
                  <GroupIcon size={15} />
                </span>

                <div className="min-w-0">
                  <p className="text-[8px] font-black uppercase tracking-[0.13em] text-slate-500">
                    {group.eyebrow}
                  </p>
                  <p className="mt-0.5 text-sm font-black text-[#10233F]">
                    {group.label}
                  </p>
                </div>
              </div>

              <div className="mt-3 grid gap-2">
                {group.tabs.map((tab) => {
                  const active = activeView === tab.key;
                  const Icon = tab.icon;

                  return (
                    <button
                      key={tab.key}
                      type="button"
                      aria-pressed={active}
                      onClick={() => setActiveView(tab.key)}
                      className={`flex min-h-11 w-full items-center justify-between gap-2 rounded-xl border-2 px-3 py-2.5 text-left text-[11px] font-black transition ${
                        active
                          ? "border-orange-600 bg-orange-500 text-white shadow-[0_6px_14px_rgba(249,115,22,0.16)]"
                          : isTemplate
                          ? "border-slate-300 bg-white text-[#53657D] hover:border-orange-300 hover:bg-orange-50"
                          : "border-slate-300 bg-white text-[#10233F] hover:border-orange-300 hover:bg-orange-50"
                      }`}
                    >
                      <span className="flex min-w-0 items-center gap-2">
                        <Icon size={14} className="shrink-0" />
                        <span className="break-words">{tab.label}</span>
                      </span>

                      <ArrowUpRight
                        size={13}
                        className={`shrink-0 ${active ? "text-white" : "text-slate-400"}`}
                      />
                    </button>
                  );
                })}
              </div>

              {isTemplate ? (
                <p className="mt-3 rounded-xl border-2 border-dashed border-slate-300 bg-white px-3 py-2 text-[9px] font-bold leading-4 text-slate-500">
                  Template ecosystem retained for the later dedicated Enterprise OS rebuild.
                </p>
              ) : null}
            </div>
          );
        })}
      </div>
    </section>
  );
}

function CommandLaunchCard({ title, value, detail, tone = "navy", onClick }) {
  const isLauncherWord = String(value || "").trim().toLowerCase() === "open";
  const style = getToneStyle(tone);

  return (
    <button
      type="button"
      onClick={onClick}
      className={`group relative min-w-0 overflow-hidden rounded-[1.55rem] border-[3px] text-left shadow-[0_8px_22px_rgba(15,35,63,0.055)] transition duration-200 hover:-translate-y-1 hover:shadow-[0_14px_30px_rgba(15,35,63,0.11)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-orange-200 ${style}`}
    >
      <div className="absolute inset-x-0 top-0 h-1.5 bg-current opacity-70" />

      <div className="flex items-start justify-between gap-3 px-4 pt-5">
        <div className="min-w-0">
          <p className="break-words text-[9px] font-black uppercase leading-4 tracking-[0.12em] text-[#10233F]">
            {title}
          </p>

          <p className="mt-2 break-words text-2xl font-black leading-tight text-[#10233F]">
            {isLauncherWord ? "Workspace" : value}
          </p>
        </div>

        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border-2 border-[#123865]/20 bg-white/80 text-[#123865] transition group-hover:border-orange-500 group-hover:bg-orange-500 group-hover:text-white">
          <ArrowUpRight size={17} />
        </span>
      </div>

      <div className="px-4 pb-4 pt-3">
        <p className="min-h-[40px] break-words text-xs font-semibold leading-5 text-slate-600">
          {detail}
        </p>

        <div className="mt-4 flex items-center justify-between gap-3 rounded-xl border-2 border-[#123865] bg-[#123865] px-3 py-2.5 text-white transition group-hover:bg-[#0E2F55]">
          <span className="text-[9px] font-black uppercase tracking-[0.1em] text-white">
            Open workspace
          </span>
          <ArrowUpRight
            size={14}
            className="transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
          />
        </div>
      </div>
    </button>
  );
}

function SummaryCard({ label, value, tone = "navy" }) {
  const style = getToneStyle(tone);

  return (
    <div className={`relative min-w-0 overflow-hidden rounded-[1.35rem] border-[3px] p-4 shadow-[0_8px_20px_rgba(15,35,63,0.045)] ${style}`}>
      <div className="absolute inset-x-0 top-0 h-1.5 bg-current opacity-65" />

      <p className="break-words text-[9px] font-black uppercase leading-4 tracking-[0.12em] text-[#53657D]">
        {label}
      </p>

      <p className="mt-3 break-words text-3xl font-black leading-none text-[#10233F]">
        {value ?? 0}
      </p>

      <p className="mt-3 text-[8px] font-black uppercase tracking-[0.1em] opacity-65">
        Read-only command signal
      </p>
    </div>
  );
}

function JourneyStageCard({ label, value, total, detail }) {
  const percentage = total ? Math.round((Number(value || 0) / total) * 100) : 0;

  return (
    <div className="rounded-[1.5rem] border-[3px] border-[#B8CBE0] bg-[#F8FAFD] p-4 shadow-[0_8px_20px_rgba(15,35,63,0.04)]">
      <p className="break-words text-[10px] font-black uppercase leading-4 tracking-[0.12em] text-slate-500">{label}</p>
      <p className="mt-3 text-3xl font-black text-[#10233F]">{value}</p>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200">
        <div className="h-full rounded-full bg-orange-500" style={{ width: `${percentage}%` }} />
      </div>
      <p className="mt-3 text-xs leading-5 text-slate-500">{detail}</p>
    </div>
  );
}

function SectionHeader({ eyebrow, title, description }) {
  return (
    <div>
      <p className="text-xs font-black uppercase tracking-[0.22em] text-orange-600">{eyebrow}</p>
      <h3 className="mt-1 text-xl font-black text-[#10233f]">{title}</h3>
      {description ? <p className="mt-1 text-sm leading-6 text-slate-500">{description}</p> : null}
    </div>
  );
}

function WatchMetric({ label, value, tone = "navy" }) {
  return (
    <div className={`relative overflow-hidden rounded-[1.2rem] border-[3px] p-4 ${getToneStyle(tone)}`}>
      <div className="absolute inset-x-0 top-0 h-1 bg-current opacity-65" />
      <p className="text-[9px] font-black uppercase tracking-[0.13em] text-[#53657D]">
        {label}
      </p>
      <p className="mt-2 text-3xl font-black text-[#10233F]">{value}</p>
    </div>
  );
}

function WatchStudentRow({ score = {} }) {
  return (
    <div className="rounded-[1.2rem] border-[3px] border-[#C8D5E4] bg-white p-4 shadow-[0_6px_18px_rgba(15,35,63,0.04)]">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="break-words font-black leading-5 text-[#10233f]">{getStudentName(score)}</p>
          <p className="mt-1 text-xs text-slate-500">
            {formatLabel(getJourneyStage(score))} • {score.executive_category || "Standard"}
          </p>
        </div>

        <div className="flex gap-2">
          <span className="rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-black text-red-700">
            Risk {number(score.risk_score)}
          </span>
          <span className="rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-xs font-black text-orange-600">
            Opp {number(score.opportunity_score)}
          </span>
        </div>
      </div>

      <p className="mt-2 line-clamp-2 text-xs leading-5 text-slate-500">
        {score.summary || score.gpt_summary || "No summary available."}
      </p>
    </div>
  );
}

function ActionRow({ label, value, detail }) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-[1.2rem] border-[3px] border-[#C8D5E4] bg-white p-4">
      <div>
        <p className="font-semibold text-[#10233f]">{label}</p>
        <p className="mt-1 text-xs leading-5 text-slate-500">{detail}</p>
      </div>
      <span className="rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-sm font-black text-orange-600">
        {value}
      </span>
    </div>
  );
}

function SmallMetric({ label, value }) {
  return (
    <div className="rounded-[1.2rem] border-[3px] border-emerald-300 bg-emerald-50 p-4">
      <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-black text-[#10233f]">{value}</p>
    </div>
  );
}

function HealthProgress({ label, value }) {
  const clean = Math.max(0, Math.min(100, Number(value || 0)));

  return (
    <div className="rounded-[1.2rem] border-[3px] border-[#B8CBE0] bg-[#F8FAFD] p-4">
      <div className="flex items-center justify-between text-sm">
        <span className="font-semibold text-[#10233f]">{label}</span>
        <span className="font-black text-orange-600">{clean}%</span>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200">
        <div className="h-full rounded-full bg-orange-500" style={{ width: `${clean}%` }} />
      </div>
    </div>
  );
}

function EmptyState({ text }) {
  return (
    <p className="rounded-[1.2rem] border-[3px] border-dashed border-[#B8CBE0] bg-[#F8FAFD] p-5 text-sm font-semibold text-slate-500">
      {text}
    </p>
  );
}


function CommandModuleLoader({ label = "Loading command module..." }) {
  return (
    <div className="flex min-h-[260px] items-center justify-center rounded-[2rem] border-[3px] border-orange-300 bg-white shadow-[0_12px_32px_rgba(15,35,63,0.05)]">
      <div className="text-center">
        <div className="mx-auto h-10 w-10 animate-spin rounded-full border-[3px] border-orange-100 border-t-orange-500" />
        <p className="mt-4 text-sm font-black text-[#10233f]">{label}</p>
        <p className="mt-1 text-xs font-semibold text-slate-500">
          Zaifan OS is lazy-loading only the selected command module.
        </p>
      </div>
    </div>
  );
}

function getToneStyle(tone = "") {
  if (tone === "red") return "border-red-400 bg-red-50 text-red-800";
  if (tone === "orange") return "border-orange-400 bg-orange-50 text-orange-800";
  if (tone === "yellow") return "border-amber-400 bg-amber-50 text-amber-800";
  if (tone === "green") return "border-emerald-400 bg-emerald-50 text-emerald-800";
  if (tone === "gold") return "border-orange-400 bg-orange-50 text-orange-800";
  if (tone === "blue") return "border-blue-400 bg-blue-50 text-blue-800";
  if (tone === "navy") return "border-[#234E78] bg-[#EEF4FA] text-[#123865]";
  return "border-[#C8D5E4] bg-[#F8FAFD] text-[#123865]";
}


export default ExecutiveCommandSystem;
