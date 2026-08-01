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
    rescueCases > 0
      ? "Rescue high-value risky students first."
      : readyForVisa > 0
      ? "Move CAS/offer students into visa workflow."
      : likelyWins > 0
      ? "Fast-track likely wins."
      : stalled.length > 0
      ? "Revive stalled students."
      : "Portfolio looks stable.";

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
    estimatedWorkload: "Light",
    pressureScore: 0,
  };

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
  const total = Math.max(1, asNumber(metrics.total));
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

  return (
    <motion.section
      initial={reduceMotion ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reduceMotion ? 0 : 0.28 }}
      className="min-w-0 space-y-5 rounded-[2.25rem] border-[4px] border-[#123865] bg-[#FFF8EF] p-3 text-[#10233F] shadow-[0_24px_65px_rgba(18,56,101,0.15)] sm:p-4 lg:p-5"
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
              <NavyMetric label="AI Coverage" value={`${metrics.coverage}%`} />
              <NavyMetric label="Critical Risk" value={metrics.criticalRisk} />
              <NavyMetric label="Conversion Ready" value={metrics.conversionReady} />
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
              {commandHealth.readiness}
            </p>

            <p className="mt-1 text-sm font-black uppercase tracking-[0.08em] text-white">
              {commandHealth.status}
            </p>

            <div className="mt-5 grid grid-cols-2 gap-2">
              <OrangeCommandMetric label="Avg Risk" value={`${metrics.averageRisk}/100`} />
              <OrangeCommandMetric label="Opportunity" value={`${metrics.averageOpportunity}/100`} />
              <OrangeCommandMetric label="Workflow Breaks" value={workflowScanner.totalIssues || 0} />
              <OrangeCommandMetric label="Pressure" value={`${automationPressure.pressureScore}/100`} />
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
            value={`${metrics.averageRisk}/100`}
            detail={`${metrics.criticalRisk} critical · ${metrics.highRisk} high risk`}
            tone={metrics.averageRisk >= 65 ? "red" : metrics.averageRisk >= 35 ? "orange" : "green"}
            icon={AlertTriangle}
          />
          <ExecutiveBoardMetric
            label="Opportunity Index"
            value={`${metrics.averageOpportunity}/100`}
            detail={`${metrics.highOpportunity} high-opportunity students`}
            tone={metrics.averageOpportunity >= 65 ? "green" : "navy"}
            icon={TrendingUp}
          />
          <ExecutiveBoardMetric
            label="Workflow Integrity"
            value={workflowScanner.totalIssues || 0}
            detail={`${brokenWorkflows.length} student journeys with failures`}
            tone={workflowScanner.totalIssues ? "red" : "green"}
            icon={Workflow}
          />
          <ExecutiveBoardMetric
            label="Automation Pressure"
            value={`${automationPressure.pressureScore}/100`}
            detail={`${automationPressure.automationCandidates} prepared-action candidates`}
            tone={automationPressure.pressureScore >= 70 ? "red" : "orange"}
            icon={Zap}
          />
          <ExecutiveBoardMetric
            label="AI Coverage"
            value={`${metrics.coverage}%`}
            detail={`${metrics.analyzed}/${metrics.total} students analyzed`}
            tone={metrics.coverage >= 80 ? "green" : "orange"}
            icon={Bot}
          />
          <ExecutiveBoardMetric
            label="Conversion Ready"
            value={metrics.conversionReady}
            detail={`${executiveIntelligence.likelyWins} likely wins`}
            tone="green"
            icon={UserRoundCheck}
          />
          <ExecutiveBoardMetric
            label="Rescue Cases"
            value={executiveIntelligence.rescueCases}
            detail="High-value students needing intervention"
            tone={executiveIntelligence.rescueCases ? "red" : "green"}
            icon={HeartPulse}
          />
          <ExecutiveBoardMetric
            label="Leadership Load"
            value={automationPressure.estimatedWorkload}
            detail={`${automationPressure.approvalLikely} likely approval-controlled actions`}
            tone="navy"
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
                  {automationPressure.automationCandidates} automation
                  candidate(s), {automationPressure.approvalLikely} likely
                  approval-controlled and {workflowScanner.totalIssues || 0}
                  workflow break(s) currently detected.
                </p>
              </div>
            </div>
          </div>

          <div className="min-w-0 border-t-[3px] border-[#FF5A0A] bg-[#FFF4E8] p-5 lg:border-l-[3px] lg:border-t-0">
            <p className="text-[9px] font-black uppercase tracking-[0.12em] text-orange-700">
              Leadership Load
            </p>

            <p className="mt-2 text-3xl font-black text-[#10233F]">
              {automationPressure.estimatedWorkload}
            </p>

            <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">
              Current prepared-action workload under the human-controlled
              Executive AI model.
            </p>

            <div className="mt-4 grid grid-cols-2 gap-2">
              <LeadershipMiniMetric
                label="Candidates"
                value={automationPressure.automationCandidates}
              />
              <LeadershipMiniMetric
                label="Approvals"
                value={automationPressure.approvalLikely}
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
            value={executiveIntelligence.rescueCases}
            detail="High-value cases under pressure"
            tone="risk"
          />
          <ExecutiveSignal
            label="Likely wins"
            value={executiveIntelligence.likelyWins}
            detail="Strong conversion potential"
            tone="good"
          />
          <ExecutiveSignal
            label="Workflow breaks"
            value={workflowScanner.totalIssues || 0}
            detail="Cross-system failures detected"
            tone={workflowScanner.totalIssues ? "warning" : "good"}
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
            value={`${metrics.coverage}%`}
            icon={Bot}
          />
          <MetricCard
            label="Executive Priority"
            value={metrics.executivePriority}
            tone="gold"
            icon={Crown}
          />
          <MetricCard
            label="Critical Risk"
            value={metrics.criticalRisk}
            tone="risk"
            icon={AlertTriangle}
          />
          <MetricCard
            label="High Risk"
            value={metrics.highRisk}
            tone="warning"
            icon={HeartPulse}
          />
          <MetricCard
            label="Medium Risk"
            value={metrics.mediumRisk}
            icon={Radar}
          />
          <MetricCard
            label="High Opportunity"
            value={metrics.highOpportunity}
            tone="good"
            icon={TrendingUp}
          />
          <MetricCard
            label="Conversion Ready"
            value={metrics.conversionReady}
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
        <div className="grid min-w-0 gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <MetricCard
            label="No Application"
            value={metrics.journey.notStarted}
            tone="warning"
          />
          <MetricCard
            label="Application Started"
            value={metrics.journey.started}
          />
          <MetricCard
            label="Application Submitted"
            value={metrics.journey.submitted}
          />
          <MetricCard
            label="Offer Holders"
            value={metrics.journey.offerHolders}
            tone="good"
          />
          <MetricCard
            label="Conversion Ready"
            value={metrics.journey.conversionReady}
            tone="gold"
          />
          <MetricCard
            label="CAS Pending"
            value={metrics.journey.casPending}
            tone="warning"
          />
          <MetricCard
            label="CAS Issued"
            value={metrics.journey.casIssued}
            tone="good"
          />
          <MetricCard
            label="Visa Pending"
            value={metrics.journey.visaPending}
            tone="warning"
          />
          <MetricCard
            label="Visa Approved"
            value={metrics.journey.visaApproved}
            tone="good"
          />
          <MetricCard
            label="Visa Rejected"
            value={metrics.journey.visaRejected}
            tone="risk"
          />
        </div>

        <div className="mt-4">
          <JourneyProgressPanel metrics={metrics} />
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
            value={metrics.noUniversityPlan}
            detail="Students without dream, target or safe planning."
            tone="warning"
          />
          <HealthCard
            label="Missing Safe University"
            value={metrics.missingSafeUniversity}
            detail="Students with plans but no safe option."
            tone="risk"
          />
          <HealthCard
            label="Weak Documents"
            value={metrics.documentWeak}
            detail="Low readiness or missing document signals."
            tone="warning"
          />
          <HealthCard
            label="Task Problems"
            value={metrics.taskProblems}
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
        />
      </ExecutiveSection>

      <ExecutiveSection
        eyebrow="Executive Business Intelligence"
        title="Portfolio Forecast & Leadership View"
        description="Expected wins, risky value, stalled students and next-stage movement."
        icon={TrendingUp}
      >
        <div className="grid min-w-0 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <ForecastCard
            label="Likely Wins"
            value={executiveIntelligence.likelyWins}
            detail="High opportunity with controlled risk."
            tone="good"
          />
          <ForecastCard
            label="Rescue Cases"
            value={executiveIntelligence.rescueCases}
            detail="High value but needs intervention."
            tone="warning"
          />
          <ForecastCard
            label="Visa Ready Soon"
            value={executiveIntelligence.readyForVisa}
            detail="Offer/CAS students close to visa."
            tone="gold"
          />
          <ForecastCard
            label="Stalled Watch"
            value={executiveIntelligence.stalled.length}
            detail="Needs fresh movement or follow-up."
            tone="risk"
          />
          <ForecastCard
            label="Rejected / Lost"
            value={executiveIntelligence.lostOrRejected}
            detail="Cases needing recovery or closure."
            tone="risk"
          />
          <ForecastCard
            label="Opportunity Power"
            value={`${metrics.averageOpportunity}/100`}
            detail="Portfolio-wide opportunity average."
            tone="good"
          />
        </div>

        <div className="mt-4">
          <ExecutiveRadar metrics={metrics} />
        </div>

        <div className="mt-4 grid min-w-0 gap-4 xl:grid-cols-3">
          <ExecutiveStudentList
            title="Highest Risk Students"
            items={executiveIntelligence.rankedRisk}
            scoreKey="risk_score"
            tone="risk"
          />
          <ExecutiveStudentList
            title="Highest Opportunity Students"
            items={executiveIntelligence.rankedOpportunity}
            scoreKey="opportunity_score"
            tone="gold"
          />
          <ExecutiveStudentList
            title="Stalled / Low Movement"
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
          />
          <WorkflowFailureHeatmap
            workflowScanner={workflowScanner}
          />
          <ExecutiveRecoveryQueue
            issues={workflowScanner.issues || []}
            recoveryEngine={recoveryEngine}
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
  const classes =
    tone === "green"
      ? "border-emerald-400 bg-emerald-50"
      : tone === "red"
        ? "border-red-400 bg-red-50"
        : tone === "orange"
          ? "border-[#FF5A0A] bg-[#FFF4E8]"
          : "border-[#123865] bg-[#F2F7FF]";

  return (
    <article
      className={`min-w-0 rounded-[1.25rem] border-[3px] p-4 shadow-[0_7px_18px_rgba(18,56,101,0.05)] transition hover:-translate-y-0.5 hover:shadow-md ${classes}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[8px] font-black uppercase tracking-[0.1em] text-[#53657D]">
            {label}
          </p>
          <p className="mt-2 break-words text-3xl font-black leading-tight text-[#10233F]">
            {value}
          </p>
        </div>

        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border-2 border-white bg-white/80 text-[#123865]">
          <Icon size={16} />
        </span>
      </div>

      <p className="mt-3 text-[10px] font-semibold leading-4 text-slate-600">
        {detail}
      </p>
    </article>
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

function LeadershipMiniMetric({ label, value }) {
  return (
    <div className="min-w-0 rounded-xl border-2 border-[#FF5A0A] bg-white p-3">
      <p className="truncate text-[8px] font-black uppercase tracking-[0.1em] text-orange-700">
        {label}
      </p>
      <p className="mt-1 truncate text-xl font-black text-[#10233F]">
        {value}
      </p>
    </div>
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
    <div className="min-w-0 rounded-xl border-2 border-white/25 bg-white/10 p-3 text-white shadow-inner">
      <p className="text-[8px] font-black uppercase tracking-[0.09em] text-white">{label}</p>
      <p className="mt-1 text-xl font-black text-white">{value}</p>
    </div>
  );
}

function OrangeCommandMetric({ label, value }) {
  return (
    <div className="min-w-0 rounded-xl border-2 border-white/25 bg-white/10 p-3 text-white">
      <p className="text-[8px] font-black uppercase tracking-[0.08em] text-white">{label}</p>
      <p className="mt-1 text-lg font-black text-white">{value}</p>
    </div>
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
  const boxClass =
    tone === "risk"
      ? "border-red-300 bg-red-50"
      : tone === "warning"
      ? "border-amber-300 bg-amber-50"
      : tone === "good"
      ? "border-emerald-300 bg-emerald-50"
      : tone === "gold"
      ? "border-[#FFB38A] bg-[#FFF4E8]"
      : "border-[#C9D7E6] bg-white";

  return (
    <div className={`min-w-0 cursor-default select-none rounded-[1.2rem] border-[3px] p-4 shadow-[0_7px_18px_rgba(18,56,101,0.05)] transition hover:-translate-y-0.5 hover:shadow-md ${boxClass}`}>
      <div className="flex items-center justify-between gap-3">
        <p className="text-[9px] font-black uppercase tracking-[0.1em] text-slate-600">{label}</p>
        <Icon size={15} className="text-[#C2410C]" />
      </div>
      <p className="mt-2 text-3xl font-black text-[#10233F]">{value}</p>
    </div>
  );
}

function HealthCard({ label, value, detail, tone = "default" }) {
  const badgeClass =
    tone === "risk"
      ? "border-red-200 bg-red-50 text-red-700"
      : tone === "warning"
      ? "border-amber-200 bg-amber-50 text-amber-700"
      : "border-[#cbd6e2] bg-[#FFF8EF] text-[#36506f]";

  return (
    <div className="min-w-0 cursor-default rounded-[1.25rem] border-[3px] border-[#C9D7E6] bg-white p-4 shadow-[0_7px_18px_rgba(18,56,101,0.05)] transition hover:-translate-y-0.5 hover:border-[#FF5A0A] hover:shadow-md">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.14em] text-[#4d6380]">{label}</p>
          <p className="mt-3 text-3xl font-black text-[#10233F]">{value}</p>
        </div>

        <span
          className={`rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] ${badgeClass}`}
        >
          Watch
        </span>
      </div>

      <p className="mt-3 text-sm leading-relaxed text-[#4d6380]">{detail}</p>
    </div>
  );
}

function ForecastCard({ label, value, detail, tone = "default" }) {
  const style =
    tone === "risk"
      ? "border-red-200 bg-red-50 text-red-700"
      : tone === "warning"
      ? "border-[#FDBA74] bg-[#FFF4E8] text-[#C2410C]"
      : tone === "good"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : tone === "gold"
      ? "border-[#FDBA74] bg-[#FFF4E8] text-[#C2410C]"
      : "border-[#cbd6e2] bg-white shadow-sm text-[#36506f]";

  return (
    <div className={`min-w-0 cursor-default rounded-[1.25rem] border-[3px] p-4 shadow-[0_7px_18px_rgba(18,56,101,0.05)] transition hover:-translate-y-0.5 hover:shadow-md ${style}`}>
      <p className="text-[10px] font-black uppercase tracking-[0.18em] opacity-70">
        {label}
      </p>
      <p className="mt-3 text-3xl font-black text-[#10233F]">{value}</p>
      <p className="mt-2 text-xs leading-5 text-[#4d6380]">{detail}</p>
    </div>
  );
}

function JourneyProgressPanel({ metrics }) {
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
          <ProgressBar key={label} label={label} value={value} />
        ))}
      </div>
    </div>
  );
}

function AutomationPressurePanel({ automationPressure }) {
  return (
    <div className="min-w-0 rounded-[1.35rem] border-[3px] border-[#FF5A0A] bg-[#FFF4E8] p-5 shadow-[0_10px_28px_rgba(18,56,101,0.06)]">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-[#C2410C]">
            Automation Pressure
          </p>
          <h3 className="mt-1 text-xl font-black text-[#10233F]">
            {automationPressure.estimatedWorkload} Workload
          </h3>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-[#4d6380]">
            Executive AI sees {automationPressure.automationCandidates} student(s) that can
            generate prepared counselor actions. {automationPressure.approvalLikely} likely need
            approval before execution.
          </p>
        </div>

        <div className="rounded-2xl border-2 border-[#C9D7E6] bg-[#FFF8EF] px-5 py-4 text-center">
          <p className="text-[11px] font-black uppercase tracking-[0.14em] text-[#4d6380]">
            Pressure Score
          </p>
          <p className="mt-2 text-3xl font-black text-[#C2410C]">
            {automationPressure.pressureScore}/100
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <SmallInfo label="Conversion Actions" value={automationPressure.conversionActions} />
        <SmallInfo label="Rescue Actions" value={automationPressure.rescueActions} />
        <SmallInfo label="Document Actions" value={automationPressure.documentActions} />
        <SmallInfo label="Task Actions" value={automationPressure.taskActions} />
        <SmallInfo label="Visa Actions" value={automationPressure.visaActions} />
        <SmallInfo label="University Actions" value={automationPressure.universityActions} />
        <SmallInfo label="Stalled Actions" value={automationPressure.stalledActions} />
        <SmallInfo label="Communication Actions" value={automationPressure.communicationActions} />
      </div>
    </div>
  );
}

function ExecutiveRadar({ metrics }) {
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
          Positive bars show progress; weak bars reveal operational pressure.
        </p>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {rows.map(([label, value, total]) => (
          <ProgressBar key={label} label={`${label} ${value}/${total}`} value={percent(value, total)} />
        ))}
      </div>
    </div>
  );
}

function ExecutiveStudentList({ title, items = [], scoreKey, tone = "gold" }) {
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

                  <span
                    className={`shrink-0 rounded-full border px-3 py-1 text-xs font-black ${scoreClass}`}
                  >
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
          <p className="rounded-xl border-2 border-[#C9D7E6] bg-[#FFF8EF] p-4 text-sm text-[#61738d]">
            No records yet.
          </p>
        )}
      </div>
    </div>
  );
}

function ProgressBar({ label, value }) {
  return (
    <div className="min-w-0 rounded-xl border-[3px] border-[#C9D7E6] bg-white p-4 shadow-[0_5px_14px_rgba(18,56,101,0.04)]">
      <div className="flex items-center justify-between text-xs font-bold text-[#4d6380]">
        <span>{label}</span>
        <span>{value}%</span>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#dce4ed]">
        <div className="h-full rounded-full bg-[#FF5A0A] transition-[width] duration-500" style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

function SmallInfo({ label, value }) {
  return (
    <div className="min-w-0 rounded-xl border-[3px] border-[#C9D7E6] bg-white p-4 shadow-[0_5px_14px_rgba(18,56,101,0.04)]">
      <p className="text-[11px] font-black uppercase tracking-[0.14em] text-[#4d6380]">{label}</p>
      <p className="mt-2 text-2xl font-black text-[#10233F]">{value}</p>
    </div>
  );
}


function ExecutiveOperationsExpansion({ metrics, executiveIntelligence, automationPressure }) {
  const operatingScore = Math.round(
    (metrics.coverage +
      metrics.journeyPercent.started +
      metrics.journeyPercent.submitted +
      metrics.journeyPercent.offers +
      metrics.journeyPercent.cas +
      metrics.journeyPercent.visa +
      Math.max(0, 100 - automationPressure.pressureScore)) /
      7
  );

  const commandRows = [
    ["Executive Priority", metrics.executivePriority, "Students needing owner/counselor attention."],
    ["Critical Risk", metrics.criticalRisk, "Cases that should not wait."],
    ["Visa/CAS Watch", metrics.casPending + metrics.casIssued + metrics.visaPending + metrics.visaRejected, "Students in late-stage movement."],
    ["Stalled Watch", executiveIntelligence.stalled.length, "Students with low movement or stale activity."],
    ["Automation Candidates", automationPressure.automationCandidates, "Actions Executive AI can prepare."],
    ["Approval Likely", automationPressure.approvalLikely, "Actions that should stay human-approved."],
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
            {operatingScore}/100
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {commandRows.map(([label, value, detail]) => (
          <div key={label} className="min-w-0 rounded-xl border-[3px] border-[#C9D7E6] bg-white p-4 shadow-[0_5px_14px_rgba(18,56,101,0.04)]">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#61738d]">
              {label}
            </p>
            <p className="mt-2 text-3xl font-black text-[#10233F]">{value}</p>
            <p className="mt-2 text-xs leading-5 text-[#61738d]">{detail}</p>
          </div>
        ))}
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
      automation.automationCandidates === 0
        ? "Portfolio is stable. No urgent automation pressure detected."
        : `${automation.automationCandidates} student action(s) are ready for counselor review. ${automation.approvalLikely} may need human approval first.`,
  };
}

function PlatformVerificationCenter({
  platformHealth,
  brokenWorkflows,
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
        Verifies Inquiry → University →
        Application → Offer → CAS →
        Visa → Payment → Portal →
        Counselor → Executive →
        Automation.
      </p>

      <div className="mt-5 grid gap-3 md:grid-cols-4">
        <MetricCard
          label="Students"
          value={
            platformHealth.totalStudents
          }
        />

        <MetricCard
          label="Healthy"
          value={
            platformHealth.healthyStudents
          }
          tone="good"
        />

        <MetricCard
          label="At Risk"
          value={
            platformHealth.atRiskStudents
          }
          tone="risk"
        />

        <MetricCard
          label="Platform Score"
          value={`${platformHealth.averageScore}%`}
          tone="gold"
        />
      </div>

      <div className="mt-5 rounded-2xl border-2 border-[#C9D7E6] bg-[#FFF8EF] p-4">
        <p className="text-sm font-black text-[#10233F]">
          Broken Workflow Records
        </p>

        <p className="mt-2 text-3xl font-black text-[#10233F]">
          {brokenWorkflows.length}
        </p>

        <p className="mt-2 text-xs text-[#4d6380]">
          Students with one or more
          workflow failures detected.
        </p>
      </div>
    </div>
  );
}


function RecoveryIntelligenceCenter({ workflowScanner = {}, recoveryEngine = {} }) {
  const totalActions = asNumber(recoveryEngine.totalActions);
  const totalIssues = asNumber(workflowScanner.totalIssues);
  const critical = asNumber(workflowScanner.critical);
  const high = asNumber(workflowScanner.high);
  const casQueue = recoveryEngine.casQueue || [];
  const visaQueue = recoveryEngine.visaQueue || [];
  const paymentQueue = recoveryEngine.paymentQueue || [];
  const portalQueue = recoveryEngine.portalQueue || [];

  const healthLabel =
    workflowScanner.health_status === "critical"
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

        <div className="rounded-2xl border-2 border-[#C9D7E6] bg-[#FFF8EF] px-5 py-4 text-center">
          <p className="text-[11px] font-black uppercase tracking-[0.14em] text-[#4d6380]">
            Recovery Status
          </p>
          <p className="mt-2 text-2xl font-black text-[#C2410C]">
            {healthLabel}
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-6">
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
    </div>
  );
}

function WorkflowFailureHeatmap({ workflowScanner = {} }) {
  const byStage = workflowScanner.byStage || {};
  const stages = [
    "inquiry",
    "university_planning",
    "application",
    "offer",
    "cas",
    "visa",
    "payment",
    "student_portal",
    "timeline",
    "documents",
    "tasks",
    "executive",
    "automation",
  ];

  const maxValue = Math.max(1, ...stages.map((stage) => asNumber(byStage[stage])));

  return (
    <div className="min-w-0 rounded-[1.6rem] border-[3px] border-red-300 bg-red-50 p-5">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-red-600">
            Workflow Failure Heatmap
          </p>
          <h3 className="mt-1 text-xl font-black text-[#10233F]">
            Stage-Level Break Detection
          </h3>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-[#4d6380]">
            Shows where student journeys are breaking across Inquiry → University → Application → Offer → CAS → Visa → Payment → Portal → Executive → Automation.
          </p>
        </div>
        <div className="rounded-2xl border-2 border-[#C9D7E6] bg-[#FFF8EF] px-5 py-4 text-center">
          <p className="text-[11px] font-black uppercase tracking-[0.14em] text-[#4d6380]">Total Breaks</p>
          <p className="mt-2 text-3xl font-black text-red-700">{asNumber(workflowScanner.totalIssues)}</p>
        </div>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {stages.map((stage) => {
          const value = asNumber(byStage[stage]);
          const width = Math.round((value / maxValue) * 100);
          return (
            <div key={stage} className="min-w-0 rounded-xl border-[3px] border-[#C9D7E6] bg-white p-4 shadow-[0_5px_14px_rgba(18,56,101,0.04)]">
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-black uppercase tracking-[0.16em] text-[#4d6380]">
                  {formatLabel(stage)}
                </p>
                <p className={`text-xl font-black ${value ? "text-red-700" : "text-emerald-600"}`}>
                  {value}
                </p>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#dce4ed]">
                <div
                  className={`h-full rounded-full ${value ? "bg-red-300" : "bg-emerald-300"}`}
                  style={{ width: `${value ? width : 8}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ExecutiveRecoveryQueue({ issues = [], recoveryEngine = {} }) {
  const rows = [...(issues || [])]
    .sort((a, b) => asNumber(b.priority_score) - asNumber(a.priority_score))
    .slice(0, 10);

  return (
    <div className="min-w-0 rounded-[1.35rem] border-[3px] border-[#FF5A0A] bg-[#FFF4E8] p-5 shadow-[0_10px_28px_rgba(18,56,101,0.06)]">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-[#C2410C]">
            Executive Recovery Queue
          </p>
          <h3 className="mt-1 text-xl font-black text-[#10233F]">
            Highest Priority Workflow Repairs
          </h3>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-[#4d6380]">
            Prioritized list of broken workflows and recommended recovery actions generated by the recovery engine.
          </p>
        </div>
        <div className="rounded-2xl border-2 border-[#C9D7E6] bg-[#FFF8EF] px-5 py-4 text-center">
          <p className="text-[11px] font-black uppercase tracking-[0.14em] text-[#4d6380]">Generated Actions</p>
          <p className="mt-2 text-3xl font-black text-[#C2410C]">{asNumber(recoveryEngine.totalActions)}</p>
        </div>
      </div>

      <div className="mt-5 space-y-3">
        {rows.length ? (
          rows.map((issue, index) => (
            <div
              key={issue.id || `${issue.student_id}-${issue.issue_type}-${index}`}
              className="rounded-2xl border-2 border-[#C9D7E6] bg-white p-4"
            >
              <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] ${getSeverityBadgeClass(issue.severity)}`}>
                      {formatLabel(issue.severity)}
                    </span>
                    <span className="rounded-full border-2 border-[#C9D7E6] bg-[#FFF8EF] px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-[#4d6380]">
                      {formatLabel(issue.stage)}
                    </span>
                  </div>
                  <p className="mt-3 truncate text-lg font-black text-[#10233F]">
                    {issue.student_name || "Unknown Student"}
                  </p>
                  <p className="mt-1 text-sm font-bold text-[#C2410C]">
                    {issue.title || formatLabel(issue.issue_type)}
                  </p>
                  <p className="mt-1 max-w-4xl text-xs leading-5 text-[#4d6380]">
                    {issue.recommendation || issue.description || "Review and recover this workflow."}
                  </p>
                </div>

                <div className="min-w-[220px] rounded-2xl border-2 border-[#C9D7E6] bg-[#FFF8EF] p-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#61738d]">
                    Recovery Action
                  </p>
                  <p className="mt-2 text-sm font-black text-[#10233F]">
                    {formatLabel(issue.recovery_action || issue.recovery_type)}
                  </p>
                  <p className="mt-2 text-xs text-[#61738d]">
                    Priority {asNumber(issue.priority_score)}
                  </p>
                </div>
              </div>
            </div>
          ))
        ) : (
          <p className="rounded-2xl border border-dashed border-[#cbd6e2] bg-[#FFF8EF] p-5 text-sm text-[#61738d]">
            No recovery issues detected from the current student dataset.
          </p>
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
  const platformScore = asNumber(platformHealth.averageScore);
  const recoveryReadiness = Math.max(0, 100 - Math.min(100, asNumber(workflowScanner.totalIssues) * 8));
  const timelineRisk = asNumber((workflowScanner.byStage || {}).timeline);
  const portalRisk = asNumber((workflowScanner.byStage || {}).student_portal);
  const paymentRisk = asNumber((workflowScanner.byStage || {}).payment);
  const automationRisk = Math.min(100, asNumber(automationPressure.pressureScore));
  const verificationCoverage = total ? Math.max(0, Math.min(100, platformScore || metrics.coverage || 0)) : 0;

  const rows = [
    ["Workflow Health", `${Math.max(0, 100 - asNumber(workflowScanner.totalIssues) * 5)}%`, workflowScanner.totalIssues ? "Active breaks detected" : "Stable", workflowScanner.totalIssues ? "warning" : "good"],
    ["Verification Coverage", `${verificationCoverage}%`, "Platform verification score", verificationCoverage >= 80 ? "good" : "warning"],
    ["Recovery Readiness", `${recoveryReadiness}%`, `${asNumber(recoveryEngine.totalActions)} actions generated`, recoveryReadiness >= 80 ? "good" : "warning"],
    ["Timeline Integrity", timelineRisk, "Timeline-specific workflow breaks", timelineRisk ? "risk" : "good"],
    ["Automation Integrity", `${Math.max(0, 100 - automationRisk)}%`, "Automation pressure inverse score", automationRisk >= 75 ? "risk" : automationRisk >= 40 ? "warning" : "good"],
    ["Portal Integrity", portalRisk, "Portal account/access breaks", portalRisk ? "warning" : "good"],
    ["Payment Integrity", paymentRisk, "Payment reconciliation breaks", paymentRisk ? "warning" : "good"],
    ["Production Gate", workflowScanner.totalIssues ? "Hold" : "Pass", "Move only after full test pass", workflowScanner.totalIssues ? "risk" : "good"],
  ];

  return (
    <div className="min-w-0 rounded-[1.6rem] border-[3px] border-emerald-300 bg-emerald-50 p-5">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-emerald-600">
            Production Hardening
          </p>
          <h3 className="mt-1 text-xl font-black text-[#10233F]">
            Final Readiness Monitor
          </h3>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-[#4d6380]">
            Final operating layer for deciding whether Zaifan Student OS is ready for full workflow testing, production hardening, and main website handoff.
          </p>
        </div>
        <div className="rounded-2xl border-2 border-[#C9D7E6] bg-[#FFF8EF] px-5 py-4 text-center">
          <p className="text-[11px] font-black uppercase tracking-[0.14em] text-[#4d6380]">Platform Gate</p>
          <p className={`mt-2 text-3xl font-black ${workflowScanner.totalIssues ? "text-[#C2410C]" : "text-emerald-600"}`}>
            {workflowScanner.totalIssues ? "Harden" : "Ready"}
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {rows.map(([label, value, detail, tone]) => (
          <div key={label} className={`rounded-2xl border p-4 ${getHardeningCardClass(tone)}`}>
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#61738d]">
              {label}
            </p>
            <p className="mt-2 text-3xl font-black text-[#10233F]">{value}</p>
            <p className="mt-2 text-xs leading-5 text-[#4d6380]">{detail}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function RecoveryMetric({ label, value, tone = "default" }) {
  return (
    <div className={`rounded-2xl border p-4 ${getHardeningCardClass(tone)}`}>
      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#61738d]">
        {label}
      </p>
      <p className="mt-2 text-3xl font-black text-[#10233F]">{value}</p>
    </div>
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


function ExecutiveSignal({ label, value, detail, tone = "default" }) {
  const toneClass =
    tone === "risk"
      ? "border-red-200 bg-red-50"
      : tone === "warning"
      ? "border-[#FDBA74] bg-[#FFF4E8]"
      : tone === "good"
      ? "border-emerald-200 bg-emerald-50"
      : "border-[#cbd6e2] bg-white/90";

  const valueClass =
    tone === "risk"
      ? "text-red-700"
      : tone === "warning"
      ? "text-[#C2410C]"
      : tone === "good"
      ? "text-emerald-700"
      : "text-[#10233F]";

  return (
    <div className={`cursor-default rounded-2xl border-2 p-4 ${toneClass}`}>
      <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#61738d]">
        {label}
      </p>
      <p className={`mt-2 text-2xl font-black ${valueClass}`}>{value}</p>
      <p className="mt-1 text-xs leading-5 text-[#4d6380]">{detail}</p>
    </div>
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

export default ExecutiveAIDashboard;