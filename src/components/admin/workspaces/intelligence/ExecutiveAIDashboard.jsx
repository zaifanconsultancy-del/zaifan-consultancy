// ExecutiveAIDashboard V5 PARTNER OS EXTREME — Executive Intelligence Command
// Preserves all executive metrics, journey analysis, automation pressure,
// verification, workflow scanning, recovery engine, production hardening,
// and lazy-loaded risk/opportunity intelligence.
// Visual hierarchy aligned with the locked Partner OS navy + orange + cream system.

import { lazy, Suspense, useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  Bot,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  CircleGauge,
  Clock3,
  Crown,
  FileWarning,
  GraduationCap,
  HeartPulse,
  Radar,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
  UserRoundCheck,
  Workflow,
  MousePointerClick,
  Info,
  Zap,
} from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import ZaifanMetricCard from "../../ui/ZaifanMetricCard";
const RiskMonitoringPanel = lazy(() => import("./RiskMonitoringPanel"));
const OpportunityFeedPanel = lazy(() => import("../leads-crm/OpportunityFeedPanel"));
import {
  verifyEntireStudentJourney,
  generatePlatformHealthReport,
} from "../../../../lib/platformVerificationEngine";
import {
  buildExecutiveRecoveryActions,
  buildBrokenWorkflowScannerSnapshot,
} from "../../../../lib/executiveAutomationEngine";

function normalize(value = "") {
  return String(value || "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "_")
    .replace(/-/g, "_");
}

function asNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function isTruthy(value) {
  return value === true || value === "true" || value === 1 || value === "1";
}

function percent(value, total) {
  if (!total) return 0;
  return Math.max(0, Math.min(100, Math.round((asNumber(value) / total) * 100)));
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

function getStudentName(student = {}, fallback = "Unknown Student") {
  return student?.student_name || student?.full_name || student?.name || fallback;
}

function getJourneyStage(student = {}) {
  const directStage =
    normalize(student?.journey_stage) || normalize(student?.diagnostics?.journey_stage);

  if (directStage) return directStage;

  const applicationStatus = normalize(student?.application_status);
  const offerStatus = normalize(student?.offer_status);
  const visaStatus = normalize(student?.visa_status);

  if (applicationStatus === "enrolled") return "enrolled";
  if (["visa_approved", "approved"].includes(visaStatus)) return "visa_approved";
  if (["visa_rejected", "rejected", "refused", "visa_refused"].includes(visaStatus)) {
    return "visa_rejected";
  }

  if (
    ["visa_pending", "pending", "submitted", "under_review", "review", "processing"].includes(
      visaStatus
    )
  ) {
    return "visa_pending";
  }

  if (applicationStatus === "cas_issued") return "cas_issued";
  if (applicationStatus === "cas_pending") return "cas_pending";

  if (
    ["offer_accepted", "accepted", "confirmed"].includes(applicationStatus) ||
    ["offer_accepted", "accepted", "confirmed"].includes(offerStatus)
  ) {
    return "offer_accepted";
  }

  if (
    ["offer_received", "offer", "received", "conditional_offer", "unconditional_offer"].includes(
      applicationStatus
    ) ||
    ["offer_received", "offer", "received", "conditional_offer", "unconditional_offer"].includes(
      offerStatus
    )
  ) {
    return "offer_received";
  }

  if (["under_review", "review", "processing"].includes(applicationStatus)) {
    return "application_under_review";
  }

  if (["applied", "submitted"].includes(applicationStatus)) {
    return "application_submitted";
  }

  if (["started", "in_progress", "draft"].includes(applicationStatus)) {
    return "application_started";
  }

  return "not_started";
}

function getHealthValue(student = {}, key, fallback = "") {
  return normalize(student?.[key] || student?.diagnostics?.[key] || fallback);
}

function getScoreValue(student = {}, key, fallback = 0) {
  return student?.[key] ?? student?.diagnostics?.[key] ?? fallback;
}

function buildMetrics(students = []) {
  const total = students.length;

  let analyzed = 0;
  let criticalRisk = 0;
  let highRisk = 0;
  let mediumRisk = 0;
  let executivePriority = 0;
  let highOpportunity = 0;
  let conversionReady = 0;

  let offerHolders = 0;
  let casPending = 0;
  let casIssued = 0;
  let visaStage = 0;
  let visaPending = 0;
  let visaApproved = 0;
  let visaRejected = 0;
  let enrolledStudents = 0;

  let noApplication = 0;
  let applicationStarted = 0;
  let applicationSubmitted = 0;
  let noUniversityPlan = 0;
  let missingSafeUniversity = 0;
  let documentWeak = 0;
  let taskProblems = 0;
  let staleStudents = 0;

  let riskTotal = 0;
  let opportunityTotal = 0;

  const startedStages = new Set([
    "application_started",
    "application_submitted",
    "application_under_review",
    "offer_received",
    "offer_accepted",
    "cas_pending",
    "cas_issued",
    "visa_pending",
    "visa_approved",
    "enrolled",
  ]);

  const submittedStages = new Set([
    "application_submitted",
    "application_under_review",
    "offer_received",
    "offer_accepted",
    "cas_pending",
    "cas_issued",
    "visa_pending",
    "visa_approved",
    "enrolled",
  ]);

  const offerStages = new Set([
    "offer_received",
    "offer_accepted",
    "cas_pending",
    "cas_issued",
    "visa_pending",
    "visa_approved",
  ]);

  const conversionStages = new Set([
    "offer_accepted",
    "cas_pending",
    "cas_issued",
    "visa_pending",
  ]);

  const visaStages = new Set([
    "visa_pending",
    "visa_approved",
    "visa_rejected",
  ]);

  for (const student of students) {
    const category = normalize(student?.executive_category);
    const riskLevel = normalize(student?.risk_level);
    const priority = normalize(student?.priority_level);
    const applicationStatus = normalize(student?.application_status);
    const stage = getJourneyStage(student);

    const riskScore = asNumber(student?.risk_score);
    const opportunityScore = asNumber(student?.opportunity_score);

    riskTotal += riskScore;
    opportunityTotal += opportunityScore;

    if (
      student?.gpt_analyzed_at ||
      student?.gpt_summary ||
      student?.risk_score ||
      student?.opportunity_score ||
      student?.executive_category ||
      student?.journey_stage
    ) {
      analyzed += 1;
    }

    if (
      category === "critical_risk" ||
      riskLevel === "critical" ||
      riskScore >= 85
    ) {
      criticalRisk += 1;
    }

    if (
      riskLevel === "high" ||
      (riskScore >= 65 && riskScore < 85)
    ) {
      highRisk += 1;
    }

    if (
      riskLevel === "medium" ||
      (riskScore >= 35 && riskScore < 65)
    ) {
      mediumRisk += 1;
    }

    if (
      priority === "executive" ||
      riskScore >= 85 ||
      opportunityScore >= 85
    ) {
      executivePriority += 1;
    }

    if (
      category === "high_opportunity" ||
      opportunityScore >= 80
    ) {
      highOpportunity += 1;
    }

    if (
      category === "conversion_ready" ||
      conversionStages.has(stage)
    ) {
      conversionReady += 1;
    }

    if (offerStages.has(stage)) offerHolders += 1;

    if (stage === "cas_pending") casPending += 1;
    if (stage === "cas_issued") casIssued += 1;

    if (visaStages.has(stage)) visaStage += 1;
    if (stage === "visa_pending") visaPending += 1;
    if (stage === "visa_approved") visaApproved += 1;
    if (stage === "visa_rejected") visaRejected += 1;

    if (
      category === "success_story" ||
      applicationStatus === "enrolled" ||
      stage === "enrolled"
    ) {
      enrolledStudents += 1;
    }

    if (
      stage === "not_started" ||
      asNumber(student?.application_count) === 0
    ) {
      noApplication += 1;
    }

    if (startedStages.has(stage)) applicationStarted += 1;
    if (submittedStages.has(stage)) applicationSubmitted += 1;

    const universityPlanCount = asNumber(
      getScoreValue(student, "university_plan_count")
    );

    if (
      !isTruthy(student?.has_university_plan) &&
      universityPlanCount === 0
    ) {
      noUniversityPlan += 1;
    }

    const safeUniversityCount = asNumber(
      getScoreValue(
        student,
        "safe_university_count",
        student?.safe_universities_count
      )
    );

    if (universityPlanCount > 0 && safeUniversityCount === 0) {
      missingSafeUniversity += 1;
    }

    const documentHealth = getHealthValue(student, "document_health");
    const documentReadiness = asNumber(
      getScoreValue(student, "document_readiness_percent")
    );

    if (
      ["critical", "weak", "missing"].includes(documentHealth) ||
      documentReadiness < 60
    ) {
      documentWeak += 1;
    }

    const overdueTasks = asNumber(
      getScoreValue(student, "overdue_tasks_count")
    );
    const pendingTasks = asNumber(
      getScoreValue(student, "pending_tasks_count")
    );
    const taskHealth = getHealthValue(student, "task_health");

    if (
      overdueTasks > 0 ||
      pendingTasks > 5 ||
      ["critical", "weak"].includes(taskHealth)
    ) {
      taskProblems += 1;
    }

    const daysSinceUpdated = asNumber(
      getScoreValue(student, "days_since_updated"),
      -1
    );

    if (daysSinceUpdated >= 10) {
      staleStudents += 1;
    }
  }

  const averageRisk = total
    ? Math.round(riskTotal / total)
    : 0;

  const averageOpportunity = total
    ? Math.round(opportunityTotal / total)
    : 0;

  const journey = {
    notStarted: noApplication,
    started: applicationStarted,
    submitted: applicationSubmitted,
    offerHolders,
    conversionReady,
    casPending,
    casIssued,
    visaPending,
    visaApproved,
    visaRejected,
    enrolled: enrolledStudents,
  };

  const journeyPercent = {
    started: percent(applicationStarted, total),
    submitted: percent(applicationSubmitted, total),
    offers: percent(offerHolders, total),
    cas: percent(casPending + casIssued, total),
    visa: percent(visaStage, total),
    success: percent(visaApproved + enrolledStudents, total),
  };

  return {
    total,
    analyzed,
    coverage: percent(analyzed, total),

    criticalRisk,
    highRisk,
    mediumRisk,
    executivePriority,
    highOpportunity,
    conversionReady,

    offerHolders,
    casPending,
    casIssued,
    visaStage,
    visaPending,
    visaApproved,
    visaRejected,
    enrolledStudents,

    noApplication,
    applicationStarted,
    applicationSubmitted,
    noUniversityPlan,
    missingSafeUniversity,
    documentWeak,
    taskProblems,
    staleStudents,

    averageRisk,
    averageOpportunity,
    journey,
    journeyPercent,
  };
}

function buildExecutiveIntelligence(students = []) {
  const rankedRisk = [...students]
    .sort((a, b) => asNumber(b?.risk_score) - asNumber(a?.risk_score))
    .slice(0, 6);

  const rankedOpportunity = [...students]
    .sort((a, b) => asNumber(b?.opportunity_score) - asNumber(a?.opportunity_score))
    .slice(0, 6);

  const stalled = students
    .filter((student) => {
      const days = asNumber(getScoreValue(student, "days_since_updated"), -1);
      const stage = getJourneyStage(student);
      return days >= 10 || ["not_started", "application_started", "cas_pending"].includes(stage);
    })
    .sort(
      (a, b) =>
        asNumber(getScoreValue(b, "days_since_updated"), -1) -
        asNumber(getScoreValue(a, "days_since_updated"), -1)
    )
    .slice(0, 6);

  const readyForVisa = students.filter((student) =>
    ["offer_accepted", "cas_pending", "cas_issued"].includes(getJourneyStage(student))
  ).length;

  const likelyWins = students.filter(
    (student) => asNumber(student?.opportunity_score) >= 70 && asNumber(student?.risk_score) < 65
  ).length;

  const rescueCases = students.filter(
    (student) => asNumber(student?.risk_score) >= 70 && asNumber(student?.opportunity_score) >= 60
  ).length;

  const lostOrRejected = students.filter((student) =>
    ["visa_rejected", "offer_rejected"].includes(getJourneyStage(student))
  ).length;

  const leadershipPriority =
    students.length === 0
      ? "No Executive score evidence yet."
      : rescueCases > 0
      ? "Rescue high-value risky students first."
      : readyForVisa > 0
      ? "Move CAS/offer students into visa workflow."
      : likelyWins > 0
      ? "Fast-track likely wins."
      : stalled.length > 0
      ? "Revive stalled students."
      : "Scored portfolio looks stable.";

  return {
    rankedRisk,
    rankedOpportunity,
    stalled,
    readyForVisa,
    likelyWins,
    rescueCases,
    lostOrRejected,
    leadershipPriority,
  };
}

function buildAutomationPressure(students = []) {
  const summary = {
    hasEvidence: students.length > 0,
    totalStudents: students.length,
    automationCandidates: 0,
    approvalLikely: 0,
    conversionActions: 0,
    rescueActions: 0,
    documentActions: 0,
    taskActions: 0,
    visaActions: 0,
    universityActions: 0,
    stalledActions: 0,
    communicationActions: 0,
    estimatedWorkload: students.length ? "Light" : "N/A",
    pressureScore: students.length ? 0 : null,
  };

  if (!students.length) return summary;

  students.forEach((student) => {
    const risk = asNumber(student?.risk_score);
    const opportunity = asNumber(student?.opportunity_score);
    const stage = getJourneyStage(student);
    const docs = asNumber(getScoreValue(student, "document_readiness_percent"));
    const overdue = asNumber(getScoreValue(student, "overdue_tasks_count"));
    const pending = asNumber(getScoreValue(student, "pending_tasks_count"));
    const days = asNumber(getScoreValue(student, "days_since_updated"), -1);
    const universityPlanCount = asNumber(getScoreValue(student, "university_plan_count"));
    const safeCount = asNumber(getScoreValue(student, "safe_university_count"));

    const isCandidate =
      risk >= 35 ||
      opportunity >= 55 ||
      docs < 60 ||
      overdue > 0 ||
      pending > 5 ||
      days >= 10 ||
      universityPlanCount === 0 ||
      (universityPlanCount > 0 && safeCount === 0) ||
      [
        "offer_received",
        "offer_accepted",
        "cas_pending",
        "cas_issued",
        "visa_pending",
        "visa_rejected",
      ].includes(stage);

    if (!isCandidate) return;

    summary.automationCandidates += 1;

    if (risk >= 65 || opportunity >= 80) summary.approvalLikely += 1;
    if (["offer_received", "offer_accepted", "cas_pending", "cas_issued"].includes(stage)) {
      summary.conversionActions += 1;
    }
    if (risk >= 70) summary.rescueActions += 1;
    if (docs < 60) summary.documentActions += 1;
    if (overdue > 0 || pending > 5) summary.taskActions += 1;
    if (["cas_issued", "visa_pending", "visa_rejected"].includes(stage)) summary.visaActions += 1;
    if (universityPlanCount === 0 || (universityPlanCount > 0 && safeCount === 0)) {
      summary.universityActions += 1;
    }
    if (days >= 10) summary.stalledActions += 1;
    if (days >= 10 || opportunity >= 70 || ["offer_received", "visa_approved"].includes(stage)) {
      summary.communicationActions += 1;
    }
  });

  summary.pressureScore = Math.min(
    100,
    summary.automationCandidates * 5 +
      summary.approvalLikely * 6 +
      summary.rescueActions * 7 +
      summary.visaActions * 5
  );

  if (summary.automationCandidates >= 20 || summary.pressureScore >= 75) {
    summary.estimatedWorkload = "Heavy";
  } else if (summary.automationCandidates >= 10 || summary.pressureScore >= 40) {
    summary.estimatedWorkload = "Medium";
  }

  return summary;
}

function buildCommandHealth(metrics = {}, workflowScanner = {}, automationPressure = {}, platformHealth = {}) {
  const evidenceTotal = asNumber(metrics.total);

  if (evidenceTotal <= 0) {
    return {
      readiness: null,
      riskPressure: null,
      operationalPressure: null,
      workflowPenalty: null,
      status: "No Evidence",
    };
  }

  const total = evidenceTotal;
  const riskPressure = percent(
    asNumber(metrics.criticalRisk) + asNumber(metrics.highRisk),
    total
  );
  const operationalPressure = Math.min(
    100,
    Math.round(
      (percent(asNumber(metrics.documentWeak), total) +
        percent(asNumber(metrics.taskProblems), total) +
        percent(asNumber(metrics.staleStudents), total) +
        asNumber(automationPressure.pressureScore)) /
        4
    )
  );
  const workflowPenalty = Math.min(100, asNumber(workflowScanner.totalIssues) * 7);
  const platformScore = asNumber(platformHealth.averageScore, asNumber(metrics.coverage));

  const readiness = Math.max(
    0,
    Math.min(
      100,
      Math.round(
        platformScore * 0.3 +
          asNumber(metrics.coverage) * 0.2 +
          asNumber(metrics.journeyPercent?.submitted) * 0.15 +
          asNumber(metrics.journeyPercent?.offers) * 0.15 +
          (100 - riskPressure) * 0.1 +
          (100 - workflowPenalty) * 0.1
      )
    )
  );

  return {
    readiness,
    riskPressure,
    operationalPressure,
    workflowPenalty,
    status:
      readiness >= 80
        ? "Strong"
        : readiness >= 60
        ? "Watch"
        : readiness >= 40
        ? "Intervention"
        : "Critical",
  };
}

function ExecutiveAIDashboard({ students = [] }) {
  const reduceMotion = useReducedMotion();

  const metrics = useMemo(
    () => buildMetrics(students),
    [students]
  );

  const executiveIntelligence = useMemo(
    () => buildExecutiveIntelligence(students),
    [students]
  );

  const automationPressure = useMemo(
    () => buildAutomationPressure(students),
    [students]
  );

  const platformHealth = useMemo(
    () => generatePlatformHealthReport(students),
    [students]
  );

  const verificationResults = useMemo(
    () =>
      students.map((student) =>
        verifyEntireStudentJourney(
          student,
          student.portalData || {}
        )
      ),
    [students]
  );

  const brokenWorkflows = useMemo(
    () =>
      verificationResults.filter(
        (item) => item.failures?.length
      ),
    [verificationResults]
  );

  const workflowScanner = useMemo(
    () => buildBrokenWorkflowScannerSnapshot(students),
    [students]
  );

  const recoveryEngine = useMemo(
    () =>
      buildExecutiveRecoveryActions(
        workflowScanner.issues || []
      ),
    [workflowScanner]
  );

  const commandHealth = useMemo(
    () =>
      buildCommandHealth(
        metrics,
        workflowScanner,
        automationPressure,
        platformHealth
      ),
    [
      metrics,
      workflowScanner,
      automationPressure,
      platformHealth,
    ]
  );

  const hasEvidence = metrics.total > 0;

  return (
    <motion.section
      initial={reduceMotion ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reduceMotion ? 0 : 0.28 }}
      className="min-w-0 space-y-5 text-[#10233F]"
    >
      <section className="min-w-0 overflow-hidden rounded-[1.8rem] border-[3px] border-[#FF5A0A] bg-white shadow-[0_18px_50px_rgba(18,56,101,0.11)]">
        <div className="grid min-w-0 lg:grid-cols-[minmax(0,1.28fr)_minmax(19rem,0.72fr)]">
          <div className="min-w-0 bg-[#123865] p-5 text-white sm:p-6 lg:p-7">
            <div className="flex min-w-0 flex-wrap gap-2">
              <CommandChip icon={Crown}>Executive Intelligence</CommandChip>
              <CommandChip icon={ShieldCheck}>Student OS</CommandChip>
              <CommandChip icon={Workflow}>Workflow Verification</CommandChip>
            </div>

            <h2 className="mt-4 break-words text-3xl font-black leading-tight tracking-[-0.04em] text-white sm:text-4xl">
              Zaifan Command Intelligence
            </h2>

            <p className="mt-3 max-w-4xl break-words text-sm font-semibold leading-6 text-slate-100">
              One leadership surface for portfolio risk, opportunity,
              applications, offers, CAS, visa, documents, tasks, workflow
              failures, recovery and automation pressure.
            </p>

            <div className="mt-5 grid min-w-0 grid-cols-2 gap-2 sm:grid-cols-4">
              <NavyMetric label="Students" value={metrics.total} />
              <NavyMetric label="AI Coverage" value={hasEvidence ? `${metrics.coverage}%` : "N/A"} />
              <NavyMetric label="Critical Risk" value={hasEvidence ? metrics.criticalRisk : "N/A"} />
              <NavyMetric label="Conversion Ready" value={hasEvidence ? metrics.conversionReady : "N/A"} />
            </div>
          </div>

          <div className="min-w-0 border-t-[3px] border-[#FF5A0A] bg-[#FF5A0A] p-5 text-white sm:p-6 lg:border-l-[3px] lg:border-t-0 lg:p-7">
            <div className="flex items-center gap-2">
              <CircleGauge size={18} />
              <p className="text-[9px] font-black uppercase tracking-[0.14em] text-white">
                Intelligence Operating Position
              </p>
            </div>

            <p className="mt-3 text-5xl font-black text-white">
              {commandHealth.readiness === null ? "N/A" : commandHealth.readiness}
            </p>

            <p className="mt-1 text-sm font-black uppercase tracking-[0.08em] text-white">
              {commandHealth.status}
            </p>

            <div className="mt-5 grid grid-cols-2 gap-2">
              <OrangeCommandMetric
                label="Avg Risk"
                value={metrics.total ? `${metrics.averageRisk}/100` : "N/A"}
              />
              <OrangeCommandMetric
                label="Opportunity"
                value={metrics.total ? `${metrics.averageOpportunity}/100` : "N/A"}
              />
              <OrangeCommandMetric
                label="Workflow Breaks"
                value={metrics.total ? workflowScanner.totalIssues || 0 : "N/A"}
              />
              <OrangeCommandMetric
                label="Pressure"
                value={metrics.total ? `${automationPressure.pressureScore}/100` : "N/A"}
              />
            </div>

            <div className="mt-4 rounded-xl border-2 border-white/25 bg-white/10 p-3">
              <p className="text-[8px] font-black uppercase tracking-[0.1em] text-white">
                Command Rule
              </p>
              <p className="mt-1 text-xs font-black leading-5 text-white">
                Clear critical risk and broken workflows first, then move
                high-opportunity students through the next verified stage.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="min-w-0 overflow-hidden rounded-[1.6rem] border-[3px] border-[#123865] bg-white shadow-[0_14px_38px_rgba(18,56,101,0.08)]">
        <div className="flex min-w-0 flex-col gap-3 border-b-[3px] border-[#FF5A0A] bg-[#123865] px-5 py-4 text-white sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.14em] text-orange-200">
              Executive Operations Board
            </p>
            <h3 className="mt-1 text-xl font-black text-white">
              Portfolio pressure and leadership opportunity
            </h3>
            <p className="mt-1 max-w-4xl text-xs font-semibold leading-5 text-slate-200">
              Grouped executive intelligence replaces the separate metric strip
              and instructional card row.
            </p>
          </div>

          <span className="w-fit rounded-full border-2 border-white/25 bg-white/10 px-3 py-1.5 text-[9px] font-black uppercase text-white">
            {metrics.total} scored students
          </span>
        </div>

        <div className="grid min-w-0 gap-3 bg-[#FFF8EF] p-4 sm:grid-cols-2 sm:p-5 xl:grid-cols-4">
          <ExecutiveBoardMetric
            label="Portfolio Risk"
            value={metrics.total ? `${metrics.averageRisk}/100` : "N/A"}
            detail={metrics.total ? `${metrics.criticalRisk} critical · ${metrics.highRisk} high risk` : "No scored evidence yet"}
            tone={metrics.total ? (metrics.averageRisk >= 65 ? "red" : metrics.averageRisk >= 35 ? "orange" : "green") : "slate"}
            icon={AlertTriangle}
          />
          <ExecutiveBoardMetric
            label="Opportunity Index"
            value={metrics.total ? `${metrics.averageOpportunity}/100` : "N/A"}
            detail={metrics.total ? `${metrics.highOpportunity} high-opportunity students` : "No scored evidence yet"}
            tone={metrics.total ? (metrics.averageOpportunity >= 65 ? "green" : "navy") : "slate"}
            icon={TrendingUp}
          />
          <ExecutiveBoardMetric
            label="Workflow Integrity"
            value={metrics.total ? workflowScanner.totalIssues || 0 : "N/A"}
            detail={metrics.total ? `${brokenWorkflows.length} student journeys with failures` : "No scored workflow evidence yet"}
            tone={metrics.total ? (workflowScanner.totalIssues ? "red" : "green") : "slate"}
            icon={Workflow}
          />
          <ExecutiveBoardMetric
            label="Automation Pressure"
            value={metrics.total ? `${automationPressure.pressureScore}/100` : "N/A"}
            detail={metrics.total ? `${automationPressure.automationCandidates} prepared-action candidates` : "No scored automation evidence yet"}
            tone={metrics.total ? (automationPressure.pressureScore >= 70 ? "red" : "orange") : "slate"}
            icon={Zap}
          />
          <ExecutiveBoardMetric
            label="AI Coverage"
            value={metrics.total ? `${metrics.coverage}%` : "N/A"}
            detail={metrics.total ? `${metrics.analyzed}/${metrics.total} students analyzed` : "Generate Executive scores to establish coverage"}
            tone={metrics.total ? (metrics.coverage >= 80 ? "green" : "orange") : "slate"}
            icon={Bot}
          />
          <ExecutiveBoardMetric
            label="Conversion Ready"
            value={hasEvidence ? metrics.conversionReady : "N/A"}
            detail={hasEvidence ? `${executiveIntelligence.likelyWins} likely wins` : "No scored evidence yet"}
            tone={hasEvidence ? "green" : "slate"}
            icon={UserRoundCheck}
          />
          <ExecutiveBoardMetric
            label="Rescue Cases"
            value={hasEvidence ? executiveIntelligence.rescueCases : "N/A"}
            detail={hasEvidence ? "High-value students needing intervention" : "No scored evidence yet"}
            tone={hasEvidence ? (executiveIntelligence.rescueCases ? "red" : "green") : "slate"}
            icon={HeartPulse}
          />
          <ExecutiveBoardMetric
            label="Leadership Load"
            value={hasEvidence ? automationPressure.estimatedWorkload : "N/A"}
            detail={hasEvidence ? `${automationPressure.approvalLikely} likely approval-controlled actions` : "No scored automation evidence yet"}
            tone={hasEvidence ? "navy" : "slate"}
            icon={Crown}
          />
        </div>
      </section>

      <section className="min-w-0 overflow-hidden rounded-[1.65rem] border-[3px] border-[#FF5A0A] bg-white shadow-[0_14px_38px_rgba(18,56,101,0.08)]">
        <div className="grid min-w-0 lg:grid-cols-[minmax(0,1.25fr)_minmax(18rem,0.75fr)]">
          <div className="min-w-0 bg-[#123865] p-5 text-white sm:p-6">
            <div className="flex items-start gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border-2 border-white/25 bg-white/10 text-orange-200">
                <Target size={19} />
              </span>

              <div className="min-w-0">
                <p className="text-[9px] font-black uppercase tracking-[0.14em] text-orange-200">
                  Leadership Priority
                </p>

                <p className="mt-2 break-words text-xl font-black leading-7 text-white">
                  {executiveIntelligence.leadershipPriority}
                </p>

                <p className="mt-2 break-words text-xs font-semibold leading-5 text-slate-200">
                  {hasEvidence
                    ? `${automationPressure.automationCandidates} automation candidate(s), ${automationPressure.approvalLikely} likely approval-controlled and ${workflowScanner.totalIssues || 0} workflow break(s) currently detected.`
                    : "Generate Executive scores before prioritization, workflow pressure or automation load can be assessed."}
                </p>
              </div>
            </div>
          </div>

          <div className="min-w-0 border-t-[3px] border-[#FF5A0A] bg-[#FFF4E8] p-5 lg:border-l-[3px] lg:border-t-0">
            <p className="text-[9px] font-black uppercase tracking-[0.12em] text-orange-700">
              Leadership Load
            </p>

            <p className="mt-2 text-3xl font-black text-[#10233F]">
              {hasEvidence ? automationPressure.estimatedWorkload : "N/A"}
            </p>

            <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">
              Current prepared-action workload under the human-controlled
              Executive AI model.
            </p>

            <div className="mt-4 grid grid-cols-2 gap-2">
              <LeadershipMiniMetric
                label="Candidates"
                value={hasEvidence ? automationPressure.automationCandidates : "N/A"}
              />
              <LeadershipMiniMetric
                label="Approvals"
                value={hasEvidence ? automationPressure.approvalLikely : "N/A"}
              />
            </div>
          </div>
        </div>

        <div className="grid min-w-0 gap-3 border-t-[3px] border-[#123865] bg-[#FFF8EF] p-4 sm:grid-cols-2 sm:p-5 xl:grid-cols-4">
          <ExecutiveSignal
            label="Students in command"
            value={metrics.total}
            detail="Current executive portfolio"
          />
          <ExecutiveSignal
            label="Immediate rescue"
            value={hasEvidence ? executiveIntelligence.rescueCases : "N/A"}
            detail={hasEvidence ? "High-value cases under pressure" : "No scored evidence yet"}
            tone={hasEvidence ? "risk" : "slate"}
          />
          <ExecutiveSignal
            label="Likely wins"
            value={hasEvidence ? executiveIntelligence.likelyWins : "N/A"}
            detail={hasEvidence ? "Strong conversion potential" : "No scored evidence yet"}
            tone={hasEvidence ? "good" : "slate"}
          />
          <ExecutiveSignal
            label="Workflow breaks"
            value={hasEvidence ? workflowScanner.totalIssues || 0 : "N/A"}
            detail={hasEvidence ? "Cross-system failures detected" : "No scored workflow evidence yet"}
            tone={hasEvidence ? (workflowScanner.totalIssues ? "warning" : "good") : "slate"}
          />
        </div>
      </section>

      <ExecutiveSection
        eyebrow="Command Metrics"
        title="Executive Overview"
        description="Highest-value portfolio signals before drilling into individual workflows."
        icon={Activity}
      >
        <div className="grid min-w-0 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            label="Students Loaded"
            value={metrics.total}
            icon={GraduationCap}
          />
          <MetricCard
            label="AI Coverage"
            value={hasEvidence ? `${metrics.coverage}%` : "N/A"}
            icon={Bot}
          />
          <MetricCard
            label="Executive Priority"
            value={hasEvidence ? metrics.executivePriority : "N/A"}
            tone="gold"
            icon={Crown}
          />
          <MetricCard
            label="Critical Risk"
            value={hasEvidence ? metrics.criticalRisk : "N/A"}
            tone="risk"
            icon={AlertTriangle}
          />
          <MetricCard
            label="High Risk"
            value={hasEvidence ? metrics.highRisk : "N/A"}
            tone="warning"
            icon={HeartPulse}
          />
          <MetricCard
            label="Medium Risk"
            value={hasEvidence ? metrics.mediumRisk : "N/A"}
            icon={Radar}
          />
          <MetricCard
            label="High Opportunity"
            value={hasEvidence ? metrics.highOpportunity : "N/A"}
            tone="good"
            icon={TrendingUp}
          />
          <MetricCard
            label="Conversion Ready"
            value={hasEvidence ? metrics.conversionReady : "N/A"}
            tone="good"
            icon={UserRoundCheck}
          />
        </div>
      </ExecutiveSection>

      <ExecutiveSection
        eyebrow="Student Journey"
        title="Application → Offer → CAS → Visa"
        description="Real Student OS movement rather than generic CRM lead scoring."
        icon={Workflow}
      >
        <div className="grid min-w-0 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            label="No Application"
            value={hasEvidence ? metrics.journey.notStarted : "N/A"}
            tone="warning"
          />
          <MetricCard
            label="Application Started"
            value={hasEvidence ? metrics.journey.started : "N/A"}
          />
          <MetricCard
            label="Application Submitted"
            value={hasEvidence ? metrics.journey.submitted : "N/A"}
          />
          <MetricCard
            label="Offer Holders"
            value={hasEvidence ? metrics.journey.offerHolders : "N/A"}
            tone="good"
          />
          <MetricCard
            label="Conversion Ready"
            value={hasEvidence ? metrics.journey.conversionReady : "N/A"}
            tone="gold"
          />
          <MetricCard
            label="CAS Pending"
            value={hasEvidence ? metrics.journey.casPending : "N/A"}
            tone="warning"
          />
          <MetricCard
            label="CAS Issued"
            value={hasEvidence ? metrics.journey.casIssued : "N/A"}
            tone="good"
          />
          <MetricCard
            label="Visa Pending"
            value={hasEvidence ? metrics.journey.visaPending : "N/A"}
            tone="warning"
          />
          <MetricCard
            label="Visa Approved"
            value={hasEvidence ? metrics.journey.visaApproved : "N/A"}
            tone="good"
          />
          <MetricCard
            label="Visa Rejected"
            value={hasEvidence ? metrics.journey.visaRejected : "N/A"}
            tone="risk"
          />
        </div>

        <div className="mt-4">
          <JourneyProgressPanel metrics={metrics} hasEvidence={hasEvidence} />
        </div>
      </ExecutiveSection>

      <ExecutiveSection
        eyebrow="Foundation Health"
        title="Operational Gaps"
        description="Counselor-facing weaknesses most likely to block movement."
        icon={FileWarning}
      >
        <div className="grid min-w-0 gap-3 md:grid-cols-2 xl:grid-cols-4">
          <HealthCard
            label="No University Plan"
            value={hasEvidence ? metrics.noUniversityPlan : "N/A"}
            detail="Students without dream, target or safe planning."
            tone="warning"
          />
          <HealthCard
            label="Missing Safe University"
            value={hasEvidence ? metrics.missingSafeUniversity : "N/A"}
            detail="Students with plans but no safe option."
            tone="risk"
          />
          <HealthCard
            label="Weak Documents"
            value={hasEvidence ? metrics.documentWeak : "N/A"}
            detail="Low readiness or missing document signals."
            tone="warning"
          />
          <HealthCard
            label="Task Problems"
            value={hasEvidence ? metrics.taskProblems : "N/A"}
            detail="Overdue or overloaded student task queues."
            tone="risk"
          />
        </div>
      </ExecutiveSection>

      <ExecutiveSection
        eyebrow="Executive Automation Pressure"
        title="Automation Engine Readiness"
        description="Counselor work Executive AI can prepare while preserving human control."
        icon={Zap}
      >
        <AutomationPressurePanel
          automationPressure={automationPressure}
          hasEvidence={hasEvidence}
        />
      </ExecutiveSection>

      <ExecutiveSection
        eyebrow="Executive Business Intelligence"
        title="Portfolio Forecast & Leadership View"
        description="Expected wins, risky value, stalled students and next-stage movement."
        icon={TrendingUp}
      >
        <div className="grid min-w-0 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3">
          <ForecastCard
            label="Likely Wins"
            value={hasEvidence ? executiveIntelligence.likelyWins : "N/A"}
            detail="High opportunity with controlled risk."
            tone="good"
          />
          <ForecastCard
            label="Rescue Cases"
            value={hasEvidence ? executiveIntelligence.rescueCases : "N/A"}
            detail="High value but needs intervention."
            tone="warning"
          />
          <ForecastCard
            label="Visa Ready Soon"
            value={hasEvidence ? executiveIntelligence.readyForVisa : "N/A"}
            detail="Offer/CAS students close to visa."
            tone="gold"
          />
          <ForecastCard
            label="Stalled Watch"
            value={hasEvidence ? executiveIntelligence.stalled.length : "N/A"}
            detail="Needs fresh movement or follow-up."
            tone="risk"
          />
          <ForecastCard
            label="Rejected / Lost"
            value={hasEvidence ? executiveIntelligence.lostOrRejected : "N/A"}
            detail="Cases needing recovery or closure."
            tone="risk"
          />
          <ForecastCard
            label="Opportunity Power"
            value={hasEvidence ? `${metrics.averageOpportunity}/100` : "N/A"}
            detail="Portfolio-wide opportunity average."
            tone="good"
          />
        </div>

        <div className="mt-4">
          <ExecutiveRadar metrics={metrics} hasEvidence={hasEvidence} />
        </div>

        <div className="mt-4 grid min-w-0 gap-4 xl:grid-cols-3">
          <ExecutiveStudentList
            title="Highest Risk Students"
            hasEvidence={hasEvidence}
            items={executiveIntelligence.rankedRisk}
            scoreKey="risk_score"
            tone="risk"
          />
          <ExecutiveStudentList
            title="Highest Opportunity Students"
            hasEvidence={hasEvidence}
            items={executiveIntelligence.rankedOpportunity}
            scoreKey="opportunity_score"
            tone="gold"
          />
          <ExecutiveStudentList
            title="Stalled / Low Movement"
            hasEvidence={hasEvidence}
            items={executiveIntelligence.stalled}
            scoreKey="days_since_updated"
            tone="warning"
          />
        </div>
      </ExecutiveSection>

      <ExecutiveDisclosure
        eyebrow="Operations"
        title="Admin Operations & Command Readiness"
        description="Daily operating score, executive priority and counselor workload signals."
        defaultOpen
      >
        <ExecutiveOperationsExpansion
          metrics={metrics}
          executiveIntelligence={executiveIntelligence}
          automationPressure={automationPressure}
        />
      </ExecutiveDisclosure>

      <ExecutiveDisclosure
        eyebrow="Verification"
        title="Platform Verification & Production Readiness"
        description="Technical workflow validation, broken-stage scanning and production hardening."
      >
        <div className="space-y-4">
          <PlatformVerificationCenter
            platformHealth={platformHealth}
            brokenWorkflows={brokenWorkflows}
            hasEvidence={hasEvidence}
          />
          <ProductionHardeningMonitor
            metrics={metrics}
            platformHealth={platformHealth}
            workflowScanner={workflowScanner}
            recoveryEngine={recoveryEngine}
            automationPressure={automationPressure}
          />
        </div>
      </ExecutiveDisclosure>

      <ExecutiveDisclosure
        eyebrow="Recovery"
        title="Workflow Recovery Center"
        description="Broken workflows, generated recovery actions and stage-level failure diagnostics."
      >
        <div className="space-y-4">
          <RecoveryIntelligenceCenter
            workflowScanner={workflowScanner}
            recoveryEngine={recoveryEngine}
            hasEvidence={hasEvidence}
          />
          <WorkflowFailureHeatmap
            workflowScanner={workflowScanner}
            hasEvidence={hasEvidence}
          />
          <ExecutiveRecoveryQueue
            issues={workflowScanner.issues || []}
            recoveryEngine={recoveryEngine}
            hasEvidence={hasEvidence}
          />
        </div>
      </ExecutiveDisclosure>

      <ExecutiveDisclosure
        eyebrow="Student Intelligence"
        title="Risk Command Center"
        description="Open when student-level risk diagnosis and rescue priorities are required."
      >
        <Suspense
          fallback={
            <IntelligenceFeedLoader label="Loading risk intelligence..." />
          }
        >
          <RiskMonitoringPanel students={students} />
        </Suspense>
      </ExecutiveDisclosure>

      <ExecutiveDisclosure
        eyebrow="Student Intelligence"
        title="Opportunity Command Center"
        description="Open when student-level opportunity, conversion, CAS and visa signals are required."
      >
        <Suspense
          fallback={
            <IntelligenceFeedLoader label="Loading opportunity intelligence..." />
          }
        >
          <OpportunityFeedPanel students={students} />
        </Suspense>
      </ExecutiveDisclosure>
    </motion.section>
  );
}


function ExecutiveBoardMetric({
  label,
  value,
  detail,
  tone = "navy",
  icon: Icon,
}) {
  return (
    <ZaifanMetricCard
      level="coBoss"
      label={label}
      value={value}
      detail={detail}
      icon={Icon}
      tone={toZaifanMetricTone(tone)}
    />
  );
}


function ExecutiveSection({
  eyebrow,
  title,
  description,
  icon: Icon = Sparkles,
  children,
}) {
  return (
    <section className="min-w-0 overflow-hidden rounded-[1.6rem] border-[3px] border-[#123865] bg-white shadow-[0_14px_38px_rgba(18,56,101,0.08)]">
      <div className="flex min-w-0 items-start gap-3 border-b-[3px] border-[#FF5A0A] bg-[#123865] px-5 py-4 text-white">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border-2 border-white/25 bg-white/10 text-orange-200">
          <Icon size={17} />
        </span>

        <div className="min-w-0">
          <p className="text-[9px] font-black uppercase tracking-[0.14em] text-orange-200">
            {eyebrow}
          </p>

          <h3 className="mt-1 break-words text-xl font-black text-white">
            {title}
          </h3>

          {description ? (
            <p className="mt-1 max-w-4xl break-words text-xs font-semibold leading-5 text-slate-200">
              {description}
            </p>
          ) : null}
        </div>
      </div>

      <div className="min-w-0 bg-[#FFF8EF] p-4 sm:p-5">
        {children}
      </div>
    </section>
  );
}

function LeadershipMiniMetric({
  label,
  value,
}) {
  return (
    <ZaifanMetricCard
      level="baby"
      label={label}
      value={value}
      tone="orange"
    />
  );
}

function ExecutiveGuideCard({ icon: Icon, label, detail, tone = "navy" }) {
  const style =
    tone === "warning"
      ? "border-amber-300 bg-amber-50"
      : tone === "orange"
      ? "border-[#FFB38A] bg-[#FFF4E8]"
      : "border-[#123865] bg-[#F2F7FF]";

  const iconStyle =
    tone === "warning"
      ? "border-amber-300 bg-white text-amber-700"
      : tone === "orange"
      ? "border-[#FFB38A] bg-white text-[#C2410C]"
      : "border-[#123865] bg-[#123865] text-white";

  return (
    <div className={`min-w-0 rounded-[1.2rem] border-[3px] p-4 shadow-[0_6px_16px_rgba(18,56,101,0.04)] ${style}`}>
      <div className="flex items-start gap-3">
        <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border-2 ${iconStyle}`}>
          <Icon size={16} />
        </span>
        <div>
          <p className="text-xs font-black text-[#10233F]">{label}</p>
          <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">{detail}</p>
        </div>
      </div>
    </div>
  );
}

function ExecutiveDisclosure({
  eyebrow,
  title,
  description,
  children,
  defaultOpen = false,
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <section className="min-w-0 overflow-hidden rounded-[1.6rem] border-[3px] border-[#123865] bg-white shadow-[0_14px_38px_rgba(18,56,101,0.08)]">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-4 border-b-[3px] border-[#FF5A0A] bg-[#123865] px-5 py-4 text-left text-white transition hover:bg-[#0f3158] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-orange-200"
      >
        <div>
          <p className="text-[9px] font-black uppercase tracking-[0.15em] text-[#FFB38A]">
            {eyebrow}
          </p>
          <h3 className="mt-1 text-lg font-black text-white sm:text-xl">{title}</h3>
          <p className="mt-1 max-w-4xl text-xs font-semibold leading-5 text-white/80">
            {description}
          </p>
        </div>

        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border-2 border-white/25 bg-white/10 text-white">
          {open ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </span>
      </button>

      {open ? <div className="min-w-0 bg-[#FFF8EF] p-4 sm:p-5">{children}</div> : null}
    </section>
  );
}

function CommandChip({ icon: Icon, children }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border-2 border-white/20 bg-white/10 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.1em] text-white">
      <Icon size={11} />
      {children}
    </span>
  );
}

function NavyMetric({ label, value }) {
  return (
    <ZaifanMetricCard
      level="baby"
      surface="navy"
      label={label}
      value={value ?? 0}
      tone="navy"
    />
  );
}

function OrangeCommandMetric({ label, value }) {
  return (
    <ZaifanMetricCard
      level="baby"
      surface="navy"
      label={label}
      value={value}
      tone="orange"
    />
  );
}

function SectionTitle({ eyebrow, title, description, icon: Icon = Sparkles }) {
  return (
    <div className="flex items-start gap-3 border-l-[5px] border-[#FF5A0A] pl-4">
      <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border-[3px] border-[#FFB38A] bg-[#FFF4E8] text-[#C2410C]">
        <Icon size={17} />
      </div>
      <div>
        <p className="text-[10px] font-black uppercase tracking-[0.12em] text-[#C2410C]">{eyebrow}</p>
        <h3 className="mt-0.5 text-xl font-black text-[#10233F]">{title}</h3>
        {description ? <p className="mt-1 text-sm font-semibold text-slate-600">{description}</p> : null}
      </div>
    </div>
  );
}

function CommandPill({ label, value, tone = "neutral" }) {
  const toneClass =
    tone === "risk"
      ? "border-red-400 bg-[#fff0f0] text-red-800"
      : tone === "warning"
      ? "border-amber-400 bg-[#fff4d8] text-amber-900"
      : tone === "good"
      ? "border-emerald-400 bg-[#e8fbf3] text-emerald-800"
      : "border-[#123865] bg-[#F2F7FF] text-[#123865]";

  return (
    <div className={`min-w-0 cursor-default rounded-[1.2rem] border-[3px] px-4 py-3 shadow-[0_7px_18px_rgba(18,56,101,0.05)] transition hover:-translate-y-0.5 hover:shadow-md ${toneClass}`}>
      <p className="text-[9px] font-black uppercase tracking-[0.14em]">{label}</p>
      <p className="mt-1 text-2xl font-black leading-none">{value}</p>
      <p className="mt-2 text-[10px] font-bold opacity-75">Read-only portfolio metric</p>
    </div>
  );
}

function MetricCard({ label, value, tone = "default", icon: Icon = Activity }) {
  return (
    <ZaifanMetricCard
      level="coBoss"
      label={label}
      value={value}
      icon={Icon}
      tone={toZaifanMetricTone(tone)}
    />
  );
}

function HealthCard({
  label,
  value,
  detail,
  tone = "default",
}) {
  const semanticTone =
    tone === "risk"
      ? "red"
      : tone === "warning"
      ? "amber"
      : tone === "good"
      ? "green"
      : "blue";

  return (
    <ZaifanMetricCard
      level="coBoss"
      label={label}
      value={value}
      detail={detail}
      icon={FileWarning}
      tone={semanticTone}
      className="h-full"
    />
  );
}

function ForecastCard({
  label,
  value,
  detail,
  tone = "default",
}) {
  const semanticTone =
    tone === "risk"
      ? "red"
      : tone === "warning"
      ? "amber"
      : tone === "good"
      ? "green"
      : tone === "gold"
      ? "orange"
      : "blue";

  return (
    <ZaifanMetricCard
      level="coBoss"
      label={label}
      value={value}
      detail={detail}
      icon={TrendingUp}
      tone={semanticTone}
      className="h-full"
    />
  );
}

function JourneyProgressPanel({
  metrics,
  hasEvidence = false,
}) {
  const rows = [
    ["Application Started", metrics.journeyPercent.started],
    ["Application Submitted", metrics.journeyPercent.submitted],
    ["Offer Holders", metrics.journeyPercent.offers],
    ["CAS Movement", metrics.journeyPercent.cas],
    ["Visa Movement", metrics.journeyPercent.visa],
    ["Success Movement", metrics.journeyPercent.success],
  ];

  return (
    <div className="min-w-0 rounded-[1.35rem] border-[3px] border-[#123865] bg-white p-5 shadow-[0_10px_28px_rgba(18,56,101,0.06)]">
      <p className="text-xs font-black uppercase tracking-[0.18em] text-[#C2410C]">
        Journey Conversion Map
      </p>
      <h3 className="mt-1 text-xl font-black text-[#10233F]">
        Student OS Movement Funnel
      </h3>

      <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {rows.map(([label, value]) => (
          <ProgressBar
            key={label}
            label={label}
            value={value}
            hasEvidence={hasEvidence}
          />
        ))}
      </div>
    </div>
  );
}

function AutomationPressurePanel({
  automationPressure,
  hasEvidence = false,
}) {
  const rows = [
    ["Conversion Actions", automationPressure.conversionActions, "green"],
    ["Rescue Actions", automationPressure.rescueActions, "red"],
    ["Document Actions", automationPressure.documentActions, "amber"],
    ["Task Actions", automationPressure.taskActions, "red"],
    ["Visa Actions", automationPressure.visaActions, "blue"],
    ["University Actions", automationPressure.universityActions, "violet"],
    ["Stalled Actions", automationPressure.stalledActions, "amber"],
    ["Communication Actions", automationPressure.communicationActions, "blue"],
  ];

  return (
    <div className="min-w-0 rounded-[1.35rem] border-[3px] border-[#FF5A0A] bg-[#FFF4E8] p-5 shadow-[0_10px_28px_rgba(18,56,101,0.06)]">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-[#C2410C]">
            Automation Pressure
          </p>
          <h3 className="mt-1 text-xl font-black text-[#10233F]">
            {hasEvidence ? `${automationPressure.estimatedWorkload} Workload` : "Not Assessed"}
          </h3>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-[#4d6380]">
            {hasEvidence
              ? `Executive AI sees ${automationPressure.automationCandidates} student(s) that can generate prepared counselor actions. ${automationPressure.approvalLikely} likely need approval before execution.`
              : "Generate Executive scores before automation pressure, workload or prepared-action demand can be assessed."}
          </p>
        </div>

        <ZaifanMetricCard
          level="baby"
          label="Pressure Score"
          value={hasEvidence ? `${automationPressure.pressureScore}/100` : "N/A"}
          detail={hasEvidence ? "Prepared-action pressure" : "No scored evidence yet"}
          icon={Zap}
          tone={hasEvidence ? "orange" : "slate"}
        />
      </div>

      <div className="mt-5 grid auto-rows-fr gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {rows.map(([label, value, tone]) => (
          <SmallInfo
            key={label}
            label={label}
            value={hasEvidence ? value : "N/A"}
            tone={hasEvidence ? tone : "slate"}
          />
        ))}
      </div>
    </div>
  );
}

function ExecutiveRadar({
  metrics,
  hasEvidence = false,
}) {
  const rows = [
    ["Applications", metrics.applicationSubmitted, metrics.total],
    ["Offers", metrics.offerHolders, metrics.total],
    ["CAS", metrics.casPending + metrics.casIssued, metrics.total],
    ["Visa", metrics.visaStage, metrics.total],
    ["Documents Weak", metrics.documentWeak, metrics.total],
    ["Task Problems", metrics.taskProblems, metrics.total],
  ];

  return (
    <div className="min-w-0 rounded-[1.35rem] border-[3px] border-[#123865] bg-white p-5 shadow-[0_10px_28px_rgba(18,56,101,0.06)]">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-[#C2410C]">
            Executive Health Radar
          </p>
          <h3 className="mt-1 text-xl font-black text-[#10233F]">
            Operating System Coverage
          </h3>
        </div>
        <p className="text-sm text-[#61738d]">
          {hasEvidence
            ? "Positive bars show progress; weak bars reveal operational pressure."
            : "No scored evidence yet — coverage is not assessed."}
        </p>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {rows.map(([label, value, total]) => (
          <ProgressBar
            key={label}
            label={hasEvidence ? `${label} ${value}/${total}` : label}
            value={hasEvidence ? percent(value, total) : 0}
            hasEvidence={hasEvidence}
          />
        ))}
      </div>
    </div>
  );
}

function ExecutiveStudentList({
  title,
  items = [],
  scoreKey,
  tone = "gold",
  hasEvidence = true,
}) {
  const scoreClass =
    tone === "risk"
      ? "border-red-200 bg-red-50 text-red-600"
      : tone === "warning"
      ? "border-[#FDBA74] bg-[#FFF4E8] text-[#C2410C]"
      : "border-[#FDBA74] bg-[#FFF4E8] text-[#C2410C]";

  return (
    <div className="min-w-0 rounded-[1.35rem] border-[3px] border-[#C9D7E6] bg-white p-4 shadow-[0_8px_22px_rgba(18,56,101,0.05)]">
      <h3 className="font-black text-[#10233F]">{title}</h3>

      <div className="mt-4 space-y-3">
        {items.length ? (
          items.map((student, index) => {
            const name = getStudentName(student, `Student ${index + 1}`);
            return (
              <div
                key={`${title}-${student?.id || student?.student_id || index}`}
                className="min-w-0 rounded-xl border-2 border-[#C9D7E6] bg-white p-4 shadow-[0_5px_14px_rgba(18,56,101,0.04)] transition hover:border-[#FF5A0A]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-[#10233F]">{name}</p>
                    <p className="mt-1 text-xs text-[#61738d]">
                      {formatLabel(getJourneyStage(student))} •{" "}
                      {student?.executive_category || "Standard"}
                    </p>
                  </div>

                  <span className={`shrink-0 rounded-full border px-3 py-1 text-xs font-black ${scoreClass}`}>
                    {asNumber(getScoreValue(student, scoreKey, student?.[scoreKey]))}
                  </span>
                </div>

                <p className="mt-2 line-clamp-2 text-xs leading-5 text-[#4d6380]">
                  {student?.summary || student?.gpt_summary || "No executive summary available."}
                </p>
              </div>
            );
          })
        ) : (
          <p className="rounded-xl border-2 border-dashed border-[#C9D7E6] bg-[#FFF8EF] p-4 text-sm font-semibold text-[#61738d]">
            {hasEvidence ? "No records match this view." : "No scored Executive evidence yet."}
          </p>
        )}
      </div>
    </div>
  );
}

function ProgressBar({
  label,
  value,
  hasEvidence = true,
}) {
  const clean = hasEvidence
    ? Math.max(0, Math.min(100, Number(value || 0)))
    : 0;

  return (
    <div className="min-w-0 rounded-xl border-[3px] border-[#C9D7E6] bg-white p-4 shadow-[0_5px_14px_rgba(18,56,101,0.04)]">
      <div className="flex items-center justify-between gap-3 text-xs font-bold text-[#4d6380]">
        <span>{label}</span>
        <span>{hasEvidence ? `${clean}%` : "N/A"}</span>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#dce4ed]">
        <div
          className="h-full rounded-full bg-[#FF5A0A] transition-[width] duration-500"
          style={{ width: hasEvidence ? `${clean}%` : "0%" }}
        />
      </div>
    </div>
  );
}

function SmallInfo({
  label,
  value,
  tone = "blue",
}) {
  return (
    <ZaifanMetricCard
      level="baby"
      label={label}
      value={value}
      tone={tone}
      className="h-full"
    />
  );
}


function ExecutiveOperationsExpansion({ metrics, executiveIntelligence, automationPressure }) {
  const operatingScore = metrics.total
    ? Math.round(
        (metrics.coverage +
          metrics.journeyPercent.started +
          metrics.journeyPercent.submitted +
          metrics.journeyPercent.offers +
          metrics.journeyPercent.cas +
          metrics.journeyPercent.visa +
          Math.max(0, 100 - automationPressure.pressureScore)) /
          7
      )
    : null;

  const hasEvidence = metrics.total > 0;
  const commandRows = [
    ["Executive Priority", hasEvidence ? metrics.executivePriority : "N/A", "Students needing owner/counselor attention."],
    ["Critical Risk", hasEvidence ? metrics.criticalRisk : "N/A", "Cases that should not wait."],
    ["Visa/CAS Watch", hasEvidence ? metrics.casPending + metrics.casIssued + metrics.visaPending + metrics.visaRejected : "N/A", "Students in late-stage movement."],
    ["Stalled Watch", hasEvidence ? executiveIntelligence.stalled.length : "N/A", "Students with low movement or stale activity."],
    ["Automation Candidates", hasEvidence ? automationPressure.automationCandidates : "N/A", "Actions Executive AI can prepare."],
    ["Approval Likely", hasEvidence ? automationPressure.approvalLikely : "N/A", "Actions that should stay human-approved."],
  ];

  return (
    <div className="min-w-0 rounded-[1.35rem] border-[3px] border-[#123865] bg-white p-5 shadow-[0_10px_28px_rgba(18,56,101,0.06)]">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-[#C2410C]">
            Admin Operations Extension
          </p>
          <h3 className="mt-1 text-xl font-black text-[#10233F]">
            Command Readiness Snapshot
          </h3>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-[#4d6380]">
            This connects Executive AI intelligence to daily admin operations. Use it
            with the new Operations Center tab for one-screen CEO/Counselor visibility.
          </p>
        </div>

        <div className="rounded-2xl border-2 border-[#C9D7E6] bg-[#FFF8EF] px-5 py-4 text-center">
          <p className="text-[11px] font-black uppercase tracking-[0.14em] text-[#4d6380]">
            Operating Score
          </p>
          <p className="mt-2 text-3xl font-black text-[#C2410C]">
            {operatingScore === null ? "N/A" : `${operatingScore}/100`}
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {commandRows.map(([label, value, detail]) => {
          const tone =
            !hasEvidence
              ? "slate"
              : label === "Critical Risk"
              ? "red"
              : label.includes("Visa") || label.includes("Stalled")
              ? "amber"
              : label.includes("Automation")
              ? "violet"
              : label.includes("Approval")
              ? "orange"
              : "blue";

          return (
            <ZaifanMetricCard
              key={label}
              level="coBoss"
              label={label}
              value={value}
              detail={hasEvidence ? detail : "No scored evidence yet"}
              tone={tone}
              className="h-full"
            />
          );
        })}
      </div>
    </div>
  );
}


function buildExecutiveDashboardAutomationSummary(students = []) {
  return buildAutomationPressure(Array.isArray(students) ? students : []);
}

function buildExecutiveLeadershipSnapshot(students = []) {
  const rows = Array.isArray(students) ? students : [];
  const automation = buildExecutiveDashboardAutomationSummary(rows);

  return {
    ...automation,
    leadershipMessage:
      rows.length === 0
        ? "No Executive score evidence yet. Generate scores before judging portfolio stability or automation pressure."
        : automation.automationCandidates === 0
        ? "Scored portfolio is stable. No urgent automation pressure detected."
        : `${automation.automationCandidates} student action(s) are ready for counselor review. ${automation.approvalLikely} may need human approval first.`,
  };
}

function PlatformVerificationCenter({
  platformHealth,
  brokenWorkflows,
  hasEvidence = false,
}) {
  return (
    <div className="min-w-0 rounded-[1.6rem] border-[3px] border-[#C9D7E6] bg-white p-5">
      <p className="text-xs uppercase tracking-[0.22em] text-[#10233F]">
        Platform Verification
      </p>
      <h3 className="mt-1 text-xl font-black text-[#10233F]">
        End-to-End Workflow Validation
      </h3>
      <p className="mt-2 text-sm text-[#4d6380]">
        Verifies Inquiry → University → Application → Offer → CAS → Visa →
        Payment → Portal → Counselor → Executive → Automation.
      </p>

      <div className="mt-5 grid auto-rows-fr gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <ZaifanMetricCard level="coBoss" label="Students" value={platformHealth.totalStudents ?? 0} detail="Scored records available for verification" icon={GraduationCap} tone="blue" className="h-full" />
        <ZaifanMetricCard level="coBoss" label="Healthy" value={hasEvidence ? platformHealth.healthyStudents : "N/A"} detail={hasEvidence ? "Verified healthy journeys" : "No scored evidence yet"} icon={ShieldCheck} tone={hasEvidence ? "green" : "slate"} className="h-full" />
        <ZaifanMetricCard level="coBoss" label="At Risk" value={hasEvidence ? platformHealth.atRiskStudents : "N/A"} detail={hasEvidence ? "Journeys with verification risk" : "No scored evidence yet"} icon={AlertTriangle} tone={hasEvidence ? "red" : "slate"} className="h-full" />
        <ZaifanMetricCard level="coBoss" label="Platform Score" value={hasEvidence ? `${platformHealth.averageScore}%` : "N/A"} detail={hasEvidence ? "End-to-end verification score" : "Not assessed"} icon={CircleGauge} tone={hasEvidence ? "orange" : "slate"} className="h-full" />
      </div>

      <div className="mt-4">
        <ZaifanMetricCard
          level="coBoss"
          label="Broken Workflow Records"
          value={hasEvidence ? brokenWorkflows.length : "N/A"}
          detail={hasEvidence ? "Students with one or more workflow failures detected." : "No scored workflow evidence yet"}
          icon={Workflow}
          tone={hasEvidence ? (brokenWorkflows.length ? "red" : "green") : "slate"}
        />
      </div>
    </div>
  );
}


function RecoveryIntelligenceCenter({
  workflowScanner = {},
  recoveryEngine = {},
  hasEvidence = false,
}) {
  const totalActions = asNumber(recoveryEngine.totalActions);
  const totalIssues = asNumber(workflowScanner.totalIssues);
  const critical = asNumber(workflowScanner.critical);
  const high = asNumber(workflowScanner.high);
  const casQueue = recoveryEngine.casQueue || [];
  const visaQueue = recoveryEngine.visaQueue || [];
  const paymentQueue = recoveryEngine.paymentQueue || [];
  const portalQueue = recoveryEngine.portalQueue || [];

  const healthLabel = !hasEvidence
    ? "Not Assessed"
    : workflowScanner.health_status === "critical"
    ? "Critical Recovery"
    : workflowScanner.health_status === "needs_recovery"
    ? "Recovery Required"
    : workflowScanner.health_status === "monitor"
    ? "Monitor"
    : "Healthy";

  return (
    <div className="min-w-0 rounded-[1.35rem] border-[3px] border-[#123865] bg-white p-5 shadow-[0_10px_28px_rgba(18,56,101,0.06)]">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-[#C2410C]">
            Recovery Intelligence
          </p>
          <h3 className="mt-1 text-xl font-black text-[#10233F]">
            Automatic Recovery Workflow Center
          </h3>
          <p className="mt-2 max-w-4xl text-sm leading-6 text-[#4d6380]">
            Converts broken verification signals into executive recovery queues for CAS, visa, payment, portal, timeline, documents, and task execution.
          </p>
        </div>
        <ZaifanMetricCard
          level="baby"
          label="Recovery Status"
          value={healthLabel}
          detail={hasEvidence ? "Current recovery engine state" : "Generate Executive scores first"}
          icon={HeartPulse}
          tone={hasEvidence ? (totalIssues ? "amber" : "green") : "slate"}
        />
      </div>

      {hasEvidence ? (
        <>
          <div className="mt-5 grid auto-rows-fr gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <RecoveryMetric label="Recovery Actions" value={totalActions} tone="gold" />
            <RecoveryMetric label="Broken Issues" value={totalIssues} tone={totalIssues ? "warning" : "good"} />
            <RecoveryMetric label="Critical" value={critical} tone={critical ? "risk" : "good"} />
            <RecoveryMetric label="High" value={high} tone={high ? "warning" : "good"} />
            <RecoveryMetric label="CAS Queue" value={casQueue.length} tone={casQueue.length ? "warning" : "good"} />
            <RecoveryMetric label="Visa Queue" value={visaQueue.length} tone={visaQueue.length ? "risk" : "good"} />
            <RecoveryMetric label="Payment Queue" value={paymentQueue.length} tone={paymentQueue.length ? "warning" : "good"} />
            <RecoveryMetric label="Portal Queue" value={portalQueue.length} tone={portalQueue.length ? "warning" : "good"} />
            <RecoveryMetric label="Broken Stages" value={asNumber(workflowScanner.brokenStages)} tone={workflowScanner.brokenStages ? "warning" : "good"} />
            <RecoveryMetric label="Auto Actions" value={asNumber(recoveryEngine.totalActions)} tone="gold" />
            <RecoveryMetric label="Critical Issues" value={asNumber(recoveryEngine.criticalIssues)} tone={recoveryEngine.criticalIssues ? "risk" : "good"} />
            <RecoveryMetric label="High Issues" value={asNumber(recoveryEngine.highIssues)} tone={recoveryEngine.highIssues ? "warning" : "good"} />
          </div>
          <div className="mt-5 grid gap-4 xl:grid-cols-4">
            <RecoveryQueuePreview title="CAS Recovery" items={casQueue} tone="warning" />
            <RecoveryQueuePreview title="Visa Recovery" items={visaQueue} tone="risk" />
            <RecoveryQueuePreview title="Payment Recovery" items={paymentQueue} tone="gold" />
            <RecoveryQueuePreview title="Portal Recovery" items={portalQueue} tone="good" />
          </div>
        </>
      ) : (
        <div className="mt-5 rounded-[1.3rem] border-[3px] border-dashed border-[#C9D7E6] bg-[#FFF8EF] p-6 text-center">
          <p className="text-lg font-black text-[#10233F]">Recovery intelligence is not assessed yet</p>
          <p className="mx-auto mt-2 max-w-3xl text-sm font-semibold leading-6 text-[#61738D]">
            No Executive score evidence exists, so recovery queues, issue severity and workflow repair demand cannot be interpreted truthfully.
          </p>
        </div>
      )}
    </div>
  );
}

function WorkflowFailureHeatmap({
  workflowScanner = {},
  hasEvidence = false,
}) {
  const byStage = workflowScanner.byStage || {};
  const stages = [
    "inquiry", "university_planning", "application", "offer", "cas", "visa",
    "payment", "student_portal", "timeline", "documents", "tasks", "executive", "automation",
  ];
  const maxValue = Math.max(1, ...stages.map((stage) => asNumber(byStage[stage])));

  return (
    <div className="min-w-0 rounded-[1.6rem] border-[3px] border-red-300 bg-red-50 p-5">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-red-600">Workflow Failure Heatmap</p>
          <h3 className="mt-1 text-xl font-black text-[#10233F]">Stage-Level Break Detection</h3>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-[#4d6380]">
            Shows where student journeys are breaking across Inquiry → University → Application → Offer → CAS → Visa → Payment → Portal → Executive → Automation.
          </p>
        </div>
        <ZaifanMetricCard
          level="baby"
          label="Total Breaks"
          value={hasEvidence ? asNumber(workflowScanner.totalIssues) : "N/A"}
          detail={hasEvidence ? "Detected workflow breaks" : "No scored evidence yet"}
          icon={Workflow}
          tone={hasEvidence ? (asNumber(workflowScanner.totalIssues) ? "red" : "green") : "slate"}
        />
      </div>

      {hasEvidence ? (
        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {stages.map((stage) => {
            const value = asNumber(byStage[stage]);
            const width = Math.round((value / maxValue) * 100);
            return (
              <div key={stage} className="min-w-0 rounded-xl border-[3px] border-[#C9D7E6] bg-white p-4 shadow-[0_5px_14px_rgba(18,56,101,0.04)]">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-[#4d6380]">{formatLabel(stage)}</p>
                  <p className={`text-xl font-black ${value ? "text-red-700" : "text-emerald-600"}`}>{value}</p>
                </div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#dce4ed]">
                  <div className={`h-full rounded-full ${value ? "bg-red-300" : "bg-emerald-300"}`} style={{ width: `${value ? width : 8}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="mt-5 rounded-[1.3rem] border-[3px] border-dashed border-red-200 bg-white/70 p-6 text-center">
          <p className="font-black text-[#10233F]">Stage integrity is not assessed</p>
          <p className="mt-2 text-sm font-semibold text-[#61738D]">Generate Executive scores before interpreting stage-level break detection.</p>
        </div>
      )}
    </div>
  );
}

function ExecutiveRecoveryQueue({
  issues = [],
  recoveryEngine = {},
  hasEvidence = false,
}) {
  const rows = [...(issues || [])]
    .sort((a, b) => asNumber(b.priority_score) - asNumber(a.priority_score))
    .slice(0, 10);

  return (
    <div className="min-w-0 rounded-[1.35rem] border-[3px] border-[#FF5A0A] bg-[#FFF4E8] p-5 shadow-[0_10px_28px_rgba(18,56,101,0.06)]">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-[#C2410C]">Executive Recovery Queue</p>
          <h3 className="mt-1 text-xl font-black text-[#10233F]">Highest Priority Workflow Repairs</h3>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-[#4d6380]">Prioritized list of broken workflows and recommended recovery actions generated by the recovery engine.</p>
        </div>
        <ZaifanMetricCard level="baby" label="Generated Actions" value={hasEvidence ? asNumber(recoveryEngine.totalActions) : "N/A"} detail={hasEvidence ? "Current recovery actions" : "Not assessed"} icon={Zap} tone={hasEvidence ? "orange" : "slate"} />
      </div>

      <div className="mt-5 space-y-3">
        {hasEvidence && rows.length ? (
          rows.map((issue, index) => (
            <div key={issue.id || `${issue.student_id}-${issue.issue_type}-${index}`} className="rounded-2xl border-2 border-[#C9D7E6] bg-white p-4">
              <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] ${getSeverityBadgeClass(issue.severity)}`}>{formatLabel(issue.severity)}</span>
                    <span className="rounded-full border-2 border-[#C9D7E6] bg-[#FFF8EF] px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-[#4d6380]">{formatLabel(issue.stage)}</span>
                  </div>
                  <p className="mt-3 truncate text-lg font-black text-[#10233F]">{issue.student_name || "Unknown Student"}</p>
                  <p className="mt-1 text-sm font-bold text-[#C2410C]">{issue.title || formatLabel(issue.issue_type)}</p>
                  <p className="mt-1 max-w-4xl text-xs leading-5 text-[#4d6380]">{issue.recommendation || issue.description || "Review and recover this workflow."}</p>
                </div>
                <div className="min-w-[220px] rounded-2xl border-2 border-[#C9D7E6] bg-[#FFF8EF] p-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#61738d]">Recovery Action</p>
                  <p className="mt-2 text-sm font-black text-[#10233F]">{formatLabel(issue.recovery_action || issue.recovery_type)}</p>
                  <p className="mt-2 text-xs text-[#61738d]">Priority {asNumber(issue.priority_score)}</p>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="rounded-2xl border-[3px] border-dashed border-[#C9D7E6] bg-[#FFF8EF] p-5 text-center">
            <p className="font-black text-[#10233F]">{hasEvidence ? "No recovery issues detected." : "Recovery queue is not assessed yet."}</p>
            <p className="mt-2 text-sm font-semibold text-[#61738D]">{hasEvidence ? "The scored portfolio currently has no generated recovery issues." : "Generate Executive scores before interpreting workflow repair demand."}</p>
          </div>
        )}
      </div>
    </div>
  );
}

function ProductionHardeningMonitor({
  metrics = {},
  platformHealth = {},
  workflowScanner = {},
  recoveryEngine = {},
  automationPressure = {},
}) {
  const total = asNumber(metrics.total);
  const hasEvidence = total > 0;
  const platformScore = asNumber(platformHealth.averageScore);
  const recoveryReadiness = hasEvidence ? Math.max(0, 100 - Math.min(100, asNumber(workflowScanner.totalIssues) * 8)) : null;
  const timelineRisk = asNumber((workflowScanner.byStage || {}).timeline);
  const portalRisk = asNumber((workflowScanner.byStage || {}).student_portal);
  const paymentRisk = asNumber((workflowScanner.byStage || {}).payment);
  const automationRisk = Math.min(100, asNumber(automationPressure.pressureScore));
  const verificationCoverage = hasEvidence ? Math.max(0, Math.min(100, platformScore || metrics.coverage || 0)) : null;
  const workflowHealth = hasEvidence ? Math.max(0, 100 - asNumber(workflowScanner.totalIssues) * 5) : null;
  const automationIntegrity = hasEvidence ? Math.max(0, 100 - automationRisk) : null;

  const rows = [
    ["Workflow Health", hasEvidence ? `${workflowHealth}%` : "N/A", hasEvidence ? (workflowScanner.totalIssues ? "Active breaks detected" : "No scored workflow breaks detected") : "No scored Executive evidence yet", hasEvidence ? (workflowScanner.totalIssues ? "amber" : "green") : "slate"],
    ["Verification Coverage", hasEvidence ? `${verificationCoverage}%` : "N/A", hasEvidence ? "Platform verification score" : "No scored Executive evidence yet", hasEvidence ? (verificationCoverage >= 80 ? "green" : "amber") : "slate"],
    ["Recovery Readiness", hasEvidence ? `${recoveryReadiness}%` : "N/A", hasEvidence ? `${asNumber(recoveryEngine.totalActions)} actions generated` : "No scored Executive evidence yet", hasEvidence ? (recoveryReadiness >= 80 ? "green" : "amber") : "slate"],
    ["Timeline Integrity", hasEvidence ? timelineRisk : "N/A", hasEvidence ? "Timeline-specific workflow breaks" : "No scored Executive evidence yet", hasEvidence ? (timelineRisk ? "red" : "green") : "slate"],
    ["Automation Integrity", hasEvidence ? `${automationIntegrity}%` : "N/A", hasEvidence ? "Automation pressure inverse score" : "No scored Executive evidence yet", hasEvidence ? (automationRisk >= 75 ? "red" : automationRisk >= 40 ? "amber" : "green") : "slate"],
    ["Portal Integrity", hasEvidence ? portalRisk : "N/A", hasEvidence ? "Portal account/access breaks" : "No scored Executive evidence yet", hasEvidence ? (portalRisk ? "amber" : "green") : "slate"],
    ["Payment Integrity", hasEvidence ? paymentRisk : "N/A", hasEvidence ? "Payment reconciliation breaks" : "No scored Executive evidence yet", hasEvidence ? (paymentRisk ? "amber" : "green") : "slate"],
    ["Production Gate", hasEvidence ? (workflowScanner.totalIssues ? "Hold" : "Pass") : "Not Assessed", hasEvidence ? "Move only after full test pass" : "Generate Executive scores before evaluating the gate", hasEvidence ? (workflowScanner.totalIssues ? "red" : "green") : "slate"],
  ];

  return (
    <div className="min-w-0 rounded-[1.6rem] border-[3px] border-emerald-300 bg-emerald-50 p-5">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-emerald-600">Production Hardening</p>
          <h3 className="mt-1 text-xl font-black text-[#10233F]">Final Readiness Monitor</h3>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-[#4d6380]">Final operating layer for deciding whether Zaifan Student OS is ready for full workflow testing, production hardening, and main website handoff.</p>
        </div>
        <ZaifanMetricCard level="baby" label="Platform Gate" value={!hasEvidence ? "Not Assessed" : workflowScanner.totalIssues ? "Harden" : "Ready"} detail={hasEvidence ? "Current production gate" : "No Executive evidence yet"} icon={ShieldCheck} tone={!hasEvidence ? "slate" : workflowScanner.totalIssues ? "red" : "green"} />
      </div>

      <div className="mt-5 grid auto-rows-fr gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {rows.map(([label, value, detail, tone]) => (
          <ZaifanMetricCard key={label} level="coBoss" label={label} value={value} detail={detail} tone={tone} className="h-full" />
        ))}
      </div>
    </div>
  );
}

function RecoveryMetric({ label, value, tone = "default" }) {
  return (
    <ZaifanMetricCard
      level="baby"
      label={label}
      value={value ?? 0}
      tone={toZaifanMetricTone(tone)}
    />
  );
}

function RecoveryQueuePreview({ title, items = [], tone = "default" }) {
  return (
    <div className={`rounded-2xl border p-4 ${getHardeningCardClass(tone)}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#61738d]">
            {title}
          </p>
          <p className="mt-2 text-3xl font-black text-[#10233F]">{items.length}</p>
        </div>
        <span className="rounded-full border-2 border-[#C9D7E6] bg-[#FFF8EF] px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-[#4d6380]">
          Queue
        </span>
      </div>
      <div className="mt-4 space-y-2">
        {items.slice(0, 3).map((item, index) => (
          <div key={item.id || `${title}-${index}`} className="rounded-xl border-2 border-[#C9D7E6] bg-[#FFF8EF] p-3">
            <p className="truncate text-xs font-black text-[#10233F]">
              {item.student_name || "Unknown Student"}
            </p>
            <p className="mt-1 truncate text-[11px] text-[#61738d]">
              {item.title || formatLabel(item.issue_type)}
            </p>
          </div>
        ))}
        {!items.length ? (
          <p className="rounded-xl border border-dashed border-[#cbd6e2] bg-[#FFF8EF] p-3 text-xs text-[#61738d]">
            Clear
          </p>
        ) : null}
      </div>
    </div>
  );
}

function getSeverityBadgeClass(severity = "") {
  const key = normalize(severity);
  if (key === "critical") return "border-red-200 bg-red-50 text-red-600";
  if (key === "high") return "border-[#FDBA74] bg-[#FFF4E8] text-[#C2410C]";
  if (key === "executive") return "border-[#FDBA74] bg-[#FFF4E8] text-[#C2410C]";
  if (key === "medium") return "border-yellow-400/25 bg-amber-50 text-amber-700";
  return "border-[#cbd6e2] bg-[#FFF8EF] text-[#36506f]";
}

function getHardeningCardClass(tone = "default") {
  if (tone === "risk") return "border-red-200 bg-red-50";
  if (tone === "warning") return "border-[#FDBA74] bg-[#FFF4E8]";
  if (tone === "good") return "border-emerald-200 bg-emerald-50";
  if (tone === "gold") return "border-[#FDBA74] bg-[#FFF4E8]";
  return "border-[#cbd6e2] bg-white shadow-sm";
}


function ExecutiveSignal({
  label,
  value,
  detail,
  tone = "default",
}) {
  return (
    <ZaifanMetricCard
      level="coBoss"
      label={label}
      value={value}
      detail={detail}
      tone={toZaifanMetricTone(tone)}
    />
  );
}

function IntelligenceFeedLoader({ label }) {
  return (
    <div className="flex min-h-[180px] min-w-0 items-center justify-center rounded-[1.6rem] border-[3px] border-[#123865] bg-[#FFF8EF] shadow-[0_10px_28px_rgba(15,35,63,0.07)]">
      <div className="text-center">
        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-[#cbd6e2] border-t-[#FF5A0A]" />
        <p className="mt-3 text-sm font-black text-[#10233F]">{label}</p>
        <p className="mt-1 text-xs text-[#61738d]">Loading this intelligence layer only when required.</p>
      </div>
    </div>
  );
}


function toZaifanMetricTone(tone = "") {
  const value = String(tone || "").trim().toLowerCase();

  if (
    value.includes("green") ||
    value.includes("emerald") ||
    value.includes("good") ||
    value.includes("success") ||
    value.includes("healthy") ||
    value.includes("ready")
  ) return "green";

  if (
    value.includes("red") ||
    value.includes("rose") ||
    value.includes("danger") ||
    value.includes("risk") ||
    value.includes("critical") ||
    value.includes("failed") ||
    value.includes("error")
  ) return "red";

  if (
    value.includes("amber") ||
    value.includes("yellow") ||
    value.includes("warning") ||
    value.includes("warn")
  ) return "amber";

  if (value.includes("violet") || value.includes("purple")) return "violet";
  if (value.includes("orange") || value.includes("gold")) return "orange";
  if (value.includes("blue") || value.includes("cyan") || value.includes("teal")) return "blue";
  if (value.includes("slate") || value.includes("gray") || value.includes("grey") || value.includes("muted") || value.includes("neutral")) return "slate";

  return "navy";
}

export default ExecutiveAIDashboard;