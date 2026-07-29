// RiskMonitoringPanel V3 MAXIMUM — Executive Risk Command Center
// src/components/admin/RiskMonitoringPanel.jsx
//
// Maximum pass:
// - preserves the complete risk-signal engine and student field fallbacks
// - preserves rescue / document / task / planning command boards
// - removes misleading "Executive AI" language where the logic is deterministic/rules-based
// - memoizes signal analysis so each student is scored once per render
// - adds search, severity, risk-domain and journey-stage filters
// - adds critical / high / medium portfolio pressure metrics
// - adds rescue value, inactivity, visa, CAS and planning pressure summaries
// - fixes redundant offer-accepted visa condition
// - distinguishes unknown document readiness from a genuine numeric 0 when possible
// - clamps percentage-like diagnostics to safe ranges
// - safer duplicate-resistant keys and malformed values
// - reduced-motion support
// - stronger Admin OS cream/orange/navy contrast
// - no backend writes, no fake AI, no invented student outcomes

import { motion, useReducedMotion } from "framer-motion";
import {
  AlertTriangle,
  CheckCircle2,
  CircleGauge,
  FileWarning,
  Flame,
  GraduationCap,
  Plane,
  Search,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Target,
  TimerReset,
  TrendingUp,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";

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

function clamp(value, min = 0, max = 100) {
  return Math.max(min, Math.min(max, number(value)));
}

function safeArray(value) {
  return Array.isArray(value) ? value.filter(Boolean) : [];
}

function isTruthy(value) {
  return (
    value === true ||
    value === "true" ||
    value === 1 ||
    value === "1"
  );
}

function getStudentName(student = {}) {
  return (
    student?.full_name ||
    student?.name ||
    student?.student_name ||
    student?.studentName ||
    "Unknown Student"
  );
}

function getRiskScore(student = {}) {
  return clamp(
    student?.risk_score ||
      student?.previous_risk_score ||
      0
  );
}

function getOpportunityScore(student = {}) {
  return clamp(student?.opportunity_score || 0);
}

function isBlankStatus(value) {
  const clean = normalize(value);

  return (
    !clean ||
    clean === "none" ||
    clean === "null" ||
    clean === "undefined" ||
    clean === "not_started" ||
    clean === "no_application"
  );
}

function getJourneyStage(student = {}) {
  const directStage = normalize(
    student?.journey_stage ||
      student?.diagnostics?.journey_stage
  );

  if (directStage) return directStage;

  const applicationStatus = normalize(
    student?.application_status
  );

  const offerStatus = normalize(
    student?.offer_status
  );

  const visaStatus = normalize(
    student?.visa_status
  );

  if (["visa_approved", "approved"].includes(visaStatus)) {
    return "visa_approved";
  }

  if (
    [
      "visa_rejected",
      "rejected",
      "refused",
      "visa_refused",
    ].includes(visaStatus)
  ) {
    return "visa_rejected";
  }

  if (
    [
      "visa_pending",
      "pending",
      "submitted",
      "under_review",
      "review",
    ].includes(visaStatus)
  ) {
    return "visa_pending";
  }

  if (applicationStatus === "cas_issued") {
    return "cas_issued";
  }

  if (applicationStatus === "cas_pending") {
    return "cas_pending";
  }

  if (
    ["offer_accepted", "accepted"].includes(
      applicationStatus
    ) ||
    ["offer_accepted", "accepted"].includes(
      offerStatus
    )
  ) {
    return "offer_accepted";
  }

  if (
    [
      "offer_received",
      "offer",
      "received",
      "conditional_offer",
      "unconditional_offer",
    ].includes(applicationStatus) ||
    [
      "offer_received",
      "offer",
      "received",
      "conditional_offer",
      "unconditional_offer",
    ].includes(offerStatus)
  ) {
    return "offer_received";
  }

  if (
    ["under_review", "review"].includes(
      applicationStatus
    )
  ) {
    return "application_under_review";
  }

  if (
    ["applied", "submitted"].includes(
      applicationStatus
    )
  ) {
    return "application_submitted";
  }

  if (
    ["started", "in_progress", "draft"].includes(
      applicationStatus
    )
  ) {
    return "application_started";
  }

  return "not_started";
}

function getDiagnostic(
  student = {},
  key,
  fallback = ""
) {
  return (
    student?.[key] ??
    student?.diagnostics?.[key] ??
    fallback
  );
}

function hasDiagnosticValue(student = {}, key) {
  return (
    student?.[key] !== undefined ||
    student?.diagnostics?.[key] !== undefined
  );
}

function isVisaRejected(student = {}) {
  return getJourneyStage(student) === "visa_rejected";
}

function getRiskSignals(student = {}) {
  const riskScore = getRiskScore(student);
  const opportunityScore = getOpportunityScore(student);

  const category = normalize(
    student?.executive_category
  );

  const riskLevel = normalize(
    student?.risk_level ||
      student?.previous_risk_level
  );

  const priorityLevel = normalize(
    student?.priority_level
  );

  const journeyStage = getJourneyStage(student);

  const overdueTasks = Math.max(
    0,
    number(
      getDiagnostic(
        student,
        "overdue_tasks_count"
      )
    )
  );

  const pendingTasks = Math.max(
    0,
    number(
      getDiagnostic(
        student,
        "pending_tasks_count"
      )
    )
  );

  const documentReadiness = clamp(
    getDiagnostic(
      student,
      "document_readiness_percent"
    )
  );

  const hasDocumentReadiness =
    hasDiagnosticValue(
      student,
      "document_readiness_percent"
    );

  const taskCompletion = clamp(
    getDiagnostic(
      student,
      "task_completion_percent"
    )
  );

  const hasTaskCompletion =
    hasDiagnosticValue(
      student,
      "task_completion_percent"
    );

  const universityPlanCount = Math.max(
    0,
    number(
      getDiagnostic(
        student,
        "university_plan_count"
      )
    )
  );

  const safeUniversityCount = Math.max(
    0,
    number(
      getDiagnostic(
        student,
        "safe_university_count",
        student?.safe_universities_count || 0
      )
    )
  );

  const daysSinceUpdated = number(
    getDiagnostic(
      student,
      "days_since_updated"
    ),
    -1
  );

  const hasUniversityPlan =
    isTruthy(student?.has_university_plan) ||
    universityPlanCount > 0;

  const applicationStatus = normalize(
    student?.application_status
  );

  const signals = [];

  if (isVisaRejected(student)) {
    signals.push({
      type: "visa_rejected",
      domain: "visa",
      severity: 100,
      label: "Visa Rejected",
      reason:
        "Visa refusal or rejection is recorded and requires structured counselor recovery review.",
      action:
        "Review the refusal reason, supporting evidence, and whether a safe reapplication route exists.",
    });
  }

  if (
    category === "critical_risk" ||
    riskLevel === "critical" ||
    riskScore >= 85
  ) {
    signals.push({
      type: "critical_risk",
      domain: "general",
      severity: 95,
      label: "Critical Risk",
      reason:
        "The current risk profile is severe enough to require senior review.",
      action:
        "Escalate to a senior counselor and confirm ownership today.",
    });
  }

  if (
    riskLevel === "high" ||
    riskScore >= 65
  ) {
    signals.push({
      type: "high_risk",
      domain: "general",
      severity: 85,
      label: "High Risk",
      reason:
        "Risk score is high enough to require counselor attention.",
      action:
        "Review the active blockers and create a concrete recovery follow-up.",
    });
  }

  if (overdueTasks >= 3) {
    signals.push({
      type: "task_emergency",
      domain: "tasks",
      severity: 90,
      label: "Task Emergency",
      reason: `${overdueTasks} overdue tasks detected. Execution recovery is required.`,
      action:
        "Clear overdue tasks, reassign ownership, or reset unrealistic deadlines.",
    });
  } else if (overdueTasks > 0) {
    signals.push({
      type: "overdue_tasks",
      domain: "tasks",
      severity: 75,
      label: "Overdue Tasks",
      reason: `${overdueTasks} overdue task${
        overdueTasks > 1 ? "s" : ""
      } detected.`,
      action:
        "Complete, reschedule, or reassign overdue tasks.",
    });
  }

  if (pendingTasks >= 8) {
    signals.push({
      type: "task_overload",
      domain: "tasks",
      severity: 70,
      label: "Task Overload",
      reason: `${pendingTasks} pending tasks are open for this student.`,
      action:
        "Prioritize tasks, remove duplicates, and focus on milestone-critical work.",
    });
  }

  if (
    hasDocumentReadiness &&
    documentReadiness > 0 &&
    documentReadiness < 50
  ) {
    signals.push({
      type: "document_risk",
      domain: "documents",
      severity: 72,
      label: "Document Risk",
      reason:
        "Document readiness is below 50%, so the student may not be application-ready.",
      action:
        "Review the document checklist and request the highest-priority missing evidence.",
    });
  }

  if (
    hasDocumentReadiness &&
    documentReadiness === 0
  ) {
    signals.push({
      type: "missing_documents",
      domain: "documents",
      severity: 68,
      label: "No Documents Ready",
      reason:
        "Document readiness is explicitly recorded as 0%.",
      action:
        "Open the document workspace and build the student document checklist.",
    });
  }

  if (!hasDocumentReadiness) {
    signals.push({
      type: "unknown_document_readiness",
      domain: "documents",
      severity: 48,
      label: "Document Readiness Unknown",
      reason:
        "No document-readiness diagnostic is available for this student.",
      action:
        "Check the document workspace before making application-readiness assumptions.",
    });
  }

  if (
    hasTaskCompletion &&
    taskCompletion > 0 &&
    taskCompletion < 50
  ) {
    signals.push({
      type: "weak_tasks",
      domain: "tasks",
      severity: 60,
      label: "Weak Task Health",
      reason:
        "Task completion is below 50%, suggesting execution may be falling behind.",
      action:
        "Review pending work and confirm the next counselor-owned action.",
    });
  }

  if (!hasUniversityPlan) {
    signals.push({
      type: "no_university_plan",
      domain: "planning",
      severity: 68,
      label: "Planning Risk",
      reason:
        "No university plan is detected, so the student does not yet have a balanced application strategy.",
      action:
        "Build a university shortlist with realistic reach, target, and safer options.",
    });
  }

  if (
    hasUniversityPlan &&
    safeUniversityCount === 0
  ) {
    signals.push({
      type: "no_safe_university",
      domain: "planning",
      severity: 64,
      label: "No Safe Option",
      reason:
        "A university plan exists but no safer option is currently recorded.",
      action:
        "Add at least one realistic lower-risk university option.",
    });
  }

  if (daysSinceUpdated >= 21) {
    signals.push({
      type: "inactive_student",
      domain: "activity",
      severity: 70,
      label: "Inactive Student",
      reason: `No recent student activity has been recorded for ${daysSinceUpdated} days.`,
      action:
        "Reactivate the case with a call, WhatsApp message, or counselor review.",
    });
  } else if (daysSinceUpdated >= 10) {
    signals.push({
      type: "low_activity",
      domain: "activity",
      severity: 55,
      label: "Low Activity",
      reason: `Recent activity has been low for ${daysSinceUpdated} days.`,
      action:
        "Send a check-in and confirm whether the student is still progressing.",
    });
  }

  if (journeyStage === "cas_pending") {
    signals.push({
      type: "cas_pending",
      domain: "cas",
      severity: 66,
      label: "CAS Pending",
      reason:
        "CAS is pending and delay here can block visa progression.",
      action:
        "Check CAS requirements, deposit status, and university response.",
    });
  }

  if (journeyStage === "visa_pending") {
    signals.push({
      type: "visa_pending",
      domain: "visa",
      severity: 58,
      label: "Visa Pending",
      reason:
        "Visa is in progress and should remain under active monitoring.",
      action:
        "Track the decision timeline and keep supporting documents ready.",
    });
  }

  if (journeyStage === "offer_accepted") {
    signals.push({
      type: "visa_not_started",
      domain: "visa",
      severity: 58,
      label: "Visa Not Started",
      reason:
        "The offer is accepted but the journey has not yet moved into CAS or visa progression.",
      action:
        "Confirm deposit/CAS requirements and begin visa preparation.",
    });
  }

  if (
    isBlankStatus(applicationStatus) ||
    journeyStage === "not_started"
  ) {
    signals.push({
      type: "no_application",
      domain: "application",
      severity: 52,
      label: "No Application",
      reason:
        "No active application status is detected.",
      action:
        "Start an application or update the application record to the correct stage.",
    });
  }

  if (
    priorityLevel === "executive" &&
    opportunityScore >= 80 &&
    riskScore >= 45
  ) {
    signals.push({
      type: "hot_but_risky",
      domain: "general",
      severity: 78,
      label: "Hot But Risky",
      reason:
        "The student combines high opportunity with meaningful execution or profile risk.",
      action:
        "Fast-track the opportunity with senior counselor supervision.",
    });
  }

  return signals.sort(
    (a, b) => b.severity - a.severity
  );
}

function getRiskReason(
  student = {},
  signals = null
) {
  const list =
    signals || getRiskSignals(student);

  if (list.length) return list[0].reason;

  if (student?.summary) return student.summary;
  if (student?.gpt_summary) return student.gpt_summary;
  if (student?.gpt_risk) return student.gpt_risk;

  return "Student needs counselor review.";
}

function getRiskBadge(
  student = {},
  signals = null
) {
  const list =
    signals || getRiskSignals(student);

  if (list.length) return list[0].label;

  return (
    student?.executive_category ||
    student?.risk_level ||
    "Needs Attention"
  );
}

function getRecommendedAction(
  student = {},
  signals = null
) {
  const list =
    signals || getRiskSignals(student);

  if (list.length) return list[0].action;

  return "Review the student profile and decide the next action.";
}

function getRiskSeverity(
  student = {},
  signals = null
) {
  const list =
    signals || getRiskSignals(student);

  if (list.length) return list[0].severity;

  return getRiskScore(student);
}

function formatStage(stage = "") {
  const clean = normalize(stage);

  if (!clean) return "Unknown";

  return clean
    .split("_")
    .map(
      (part) =>
        part.charAt(0).toUpperCase() +
        part.slice(1)
    )
    .join(" ");
}

function getSeverityBand(severity) {
  if (severity >= 90) return "critical";
  if (severity >= 70) return "high";
  if (severity >= 55) return "medium";
  return "low";
}

function RiskMonitoringPanel({
  students = [],
}) {
  const reduceMotion = useReducedMotion();

  const [query, setQuery] = useState("");
  const [severityFilter, setSeverityFilter] =
    useState("all");
  const [domainFilter, setDomainFilter] =
    useState("all");
  const [stageFilter, setStageFilter] =
    useState("all");

  const analyzedStudents = useMemo(
    () =>
      safeArray(students).map(
        (student, index) => {
          const signals =
            getRiskSignals(student);

          const severity =
            getRiskSeverity(
              student,
              signals
            );

          const riskScore =
            getRiskScore(student);

          const opportunityScore =
            getOpportunityScore(student);

          const journeyStage =
            getJourneyStage(student);

          const name =
            getStudentName(student);

          return {
            student,
            signals,
            severity,
            riskScore,
            opportunityScore,
            journeyStage,
            severityBand:
              getSeverityBand(severity),
            name,
            key:
              student?.id ||
              student?.student_id ||
              student?.email ||
              `${name}-${index}`,
          };
        }
      ),
    [students]
  );

  const riskyStudents = useMemo(
    () =>
      analyzedStudents
        .filter(
          ({
            student,
            signals,
            riskScore,
          }) => {
            const category = normalize(
              student?.executive_category
            );

            const riskLevel = normalize(
              student?.risk_level ||
                student?.previous_risk_level
            );

            return (
              signals.length > 0 ||
              category === "critical_risk" ||
              category === "needs_attention" ||
              riskLevel === "critical" ||
              riskLevel === "high" ||
              riskScore >= 55
            );
          }
        )
        .sort((a, b) => {
          if (
            b.severity !== a.severity
          ) {
            return b.severity - a.severity;
          }

          return b.riskScore - a.riskScore;
        }),
    [analyzedStudents]
  );

  const riskCommand = useMemo(() => {
    const rescue = riskyStudents.filter(
      ({ riskScore, opportunityScore }) =>
        riskScore >= 70 &&
        opportunityScore >= 60
    );

    const documentCases =
      riskyStudents.filter(({ signals }) =>
        signals.some(
          (signal) =>
            signal.domain === "documents"
        )
      );

    const taskCases =
      riskyStudents.filter(({ signals }) =>
        signals.some(
          (signal) =>
            signal.domain === "tasks"
        )
      );

    const planningCases =
      riskyStudents.filter(({ signals }) =>
        signals.some(
          (signal) =>
            signal.domain === "planning"
        )
      );

    const visaCases =
      riskyStudents.filter(({ signals }) =>
        signals.some(
          (signal) =>
            signal.domain === "visa"
        )
      );

    const inactiveCases =
      riskyStudents.filter(({ signals }) =>
        signals.some(
          (signal) =>
            signal.domain === "activity"
        )
      );

    return {
      rescue,
      documentCases,
      taskCases,
      planningCases,
      visaCases,
      inactiveCases,
    };
  }, [riskyStudents]);

  const metrics = useMemo(() => {
    let critical = 0;
    let high = 0;
    let medium = 0;
    let riskTotal = 0;
    let opportunityTotal = 0;

    for (const item of riskyStudents) {
      if (item.severityBand === "critical") {
        critical += 1;
      } else if (item.severityBand === "high") {
        high += 1;
      } else if (item.severityBand === "medium") {
        medium += 1;
      }

      riskTotal += item.riskScore;
      opportunityTotal += item.opportunityScore;
    }

    const total = riskyStudents.length;

    return {
      critical,
      high,
      medium,
      averageRisk: total
        ? Math.round(riskTotal / total)
        : 0,
      averageOpportunity: total
        ? Math.round(opportunityTotal / total)
        : 0,
    };
  }, [riskyStudents]);

  const availableDomains = useMemo(() => {
    const set = new Set();

    riskyStudents.forEach((item) => {
      item.signals.forEach((signal) => {
        if (signal.domain) {
          set.add(signal.domain);
        }
      });
    });

    return [...set].sort();
  }, [riskyStudents]);

  const availableStages = useMemo(
    () =>
      [
        ...new Set(
          riskyStudents.map(
            (item) => item.journeyStage
          )
        ),
      ].sort(),
    [riskyStudents]
  );

  const filteredStudents = useMemo(() => {
    const cleanQuery = normalize(query);

    return riskyStudents.filter((item) => {
      if (
        severityFilter !== "all" &&
        item.severityBand !==
          severityFilter
      ) {
        return false;
      }

      if (
        domainFilter !== "all" &&
        !item.signals.some(
          (signal) =>
            signal.domain ===
            domainFilter
        )
      ) {
        return false;
      }

      if (
        stageFilter !== "all" &&
        item.journeyStage !==
          stageFilter
      ) {
        return false;
      }

      if (!cleanQuery) return true;

      return [
        item.name,
        item.journeyStage,
        item.student?.executive_category,
        item.student?.risk_level,
        ...item.signals.map(
          (signal) => signal.label
        ),
        ...item.signals.map(
          (signal) => signal.reason
        ),
      ]
        .map(normalize)
        .some((value) =>
          value.includes(cleanQuery)
        );
    });
  }, [
    riskyStudents,
    query,
    severityFilter,
    domainFilter,
    stageFilter,
  ]);

  const visibleStudents =
    filteredStudents.slice(0, 12);

  const clearFilters = () => {
    setQuery("");
    setSeverityFilter("all");
    setDomainFilter("all");
    setStageFilter("all");
  };

  return (
    <motion.section
      initial={
        reduceMotion
          ? false
          : { opacity: 0, y: 12 }
      }
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: reduceMotion ? 0 : 0.28,
      }}
      className="rounded-[1.9rem] border-[3px] border-orange-400 bg-[#fff8ee] p-3 shadow-[0_14px_36px_rgba(15,35,63,0.07)] sm:p-4"
    >
      <div className="grid overflow-hidden rounded-[1.55rem] border-2 border-[#234e78] xl:grid-cols-[1.25fr_0.75fr]">
        <div
          className="bg-[#123865] p-5 sm:p-6"
          style={{ color: "#FFFFFF" }}
        >
          <div className="inline-flex items-center gap-2 rounded-full border-2 border-white/25 bg-white/10 px-3 py-1.5">
            <ShieldAlert
              size={13}
              style={{ color: "#FDBA74" }}
            />

            <p
              className="text-[9px] font-black uppercase tracking-[0.1em]"
              style={{ color: "#FFFFFF" }}
            >
              Executive Risk
            </p>
          </div>

          <h3
            className="mt-3 text-2xl font-black sm:text-3xl"
            style={{ color: "#FFFFFF" }}
          >
            Student Risk Monitoring
          </h3>

          <p
            className="mt-2 max-w-3xl text-sm font-semibold leading-6"
            style={{ color: "#F8FAFC" }}
          >
            Rule-based risk monitoring across applications, CAS, visa,
            documents, tasks, inactivity, and university planning.
          </p>
        </div>

        <div
          className="border-t-2 border-orange-300 bg-orange-500 p-5 xl:border-l-2 xl:border-t-0 sm:p-6"
          style={{ color: "#FFFFFF" }}
        >
          <div className="flex items-center gap-2">
            <CircleGauge size={18} />

            <p className="text-[9px] font-black uppercase tracking-[0.1em] text-white">
              Risk Portfolio
            </p>
          </div>

          <p className="mt-3 text-4xl font-black text-white">
            {riskyStudents.length}
          </p>

          <p className="mt-1 text-xs font-black uppercase tracking-[0.08em] text-white">
            Cases Needing Review
          </p>

          <p className="mt-4 text-xs font-semibold leading-5 text-white">
            Avg risk {metrics.averageRisk}/100 · avg opportunity{" "}
            {metrics.averageOpportunity}/100.
          </p>
        </div>
      </div>

      <div className="mt-3 rounded-[1.55rem] border-2 border-orange-200 bg-[#fff8ee] p-5 sm:p-6">
        <div className="mb-4 flex flex-col gap-2 rounded-[1.2rem] border-2 border-[#c8d8e8] bg-[#edf4fb] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.12em] text-[#234e78]">
              How to use this panel
            </p>
            <p className="mt-1 text-xs font-semibold text-slate-600">
              Summary and student cards are read-only intelligence. Use the search and dropdown controls below to interact with the view.
            </p>
          </div>
          <span className="shrink-0 rounded-full border-2 border-[#234e78] bg-[#123865] px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.1em] text-white">
            Read-only cards
          </span>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <RiskCommandCard
            label="Critical Cases"
            value={metrics.critical}
            detail="Severity 90+ requiring immediate attention."
            tone="red"
            icon={Flame}
          />

          <RiskCommandCard
            label="Rescue Cases"
            value={riskCommand.rescue.length}
            detail="High risk + high opportunity; protect the upside."
            tone="orange"
            icon={TrendingUp}
          />

          <RiskCommandCard
            label="Task Pressure"
            value={riskCommand.taskCases.length}
            detail="Overdue, overloaded, or weak task execution."
            tone="warning"
            icon={TimerReset}
          />

          <RiskCommandCard
            label="Visa Risk"
            value={riskCommand.visaCases.length}
            detail="Pending, rejected, or not-started visa pressure."
            tone="navy"
            icon={Plane}
          />
        </div>

        <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <PortfolioMetric
            label="High Severity"
            value={metrics.high}
            helper="Severity 70–89 cases."
            icon={AlertTriangle}
            tone="warning"
          />

          <PortfolioMetric
            label="Medium Severity"
            value={metrics.medium}
            helper="Severity 55–69 cases."
            icon={ShieldCheck}
            tone="orange"
          />

          <PortfolioMetric
            label="Document Pressure"
            value={riskCommand.documentCases.length}
            helper="Missing, weak, or unknown readiness."
            icon={FileWarning}
            tone="danger"
          />

          <PortfolioMetric
            label="Planning Gaps"
            value={riskCommand.planningCases.length}
            helper="No plan or no safer university option."
            icon={GraduationCap}
            tone="navy"
          />
        </div>

        <div className="mt-5 grid gap-5 xl:grid-cols-4">
          <RiskMiniBoard
            title="Rescue Board"
            items={riskCommand.rescue.slice(0, 4)}
            tone="orange"
          />

          <RiskMiniBoard
            title="Document Board"
            items={riskCommand.documentCases.slice(0, 4)}
            tone="warning"
          />

          <RiskMiniBoard
            title="Task Board"
            items={riskCommand.taskCases.slice(0, 4)}
            tone="red"
          />

          <RiskMiniBoard
            title="Planning Board"
            items={riskCommand.planningCases.slice(0, 4)}
            tone="navy"
          />
        </div>

        <section className="mt-5 rounded-[1.5rem] border-[3px] border-slate-300 bg-white p-4 shadow-[0_7px_20px_rgba(15,35,63,0.04)]">
          <div className="grid gap-3 xl:grid-cols-[1fr_auto_auto_auto_auto]">
            <label className="relative block">
              <Search
                size={16}
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                value={query}
                onChange={(event) =>
                  setQuery(event.target.value)
                }
                placeholder="Search student, risk, stage, blocker..."
                className="min-h-11 w-full rounded-xl border-2 border-slate-300 bg-white pl-11 pr-4 text-sm font-semibold text-[#10233f] outline-none placeholder:text-slate-400 focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
              />
            </label>

            <select
              value={severityFilter}
              onChange={(event) =>
                setSeverityFilter(
                  event.target.value
                )
              }
              className="min-h-11 rounded-xl border-2 border-slate-300 bg-white px-4 text-sm font-black text-[#10233f] outline-none focus:border-orange-400"
            >
              <option value="all">
                All Severity
              </option>
              <option value="critical">
                Critical
              </option>
              <option value="high">High</option>
              <option value="medium">
                Medium
              </option>
              <option value="low">Low</option>
            </select>

            <select
              value={domainFilter}
              onChange={(event) =>
                setDomainFilter(
                  event.target.value
                )
              }
              className="min-h-11 rounded-xl border-2 border-slate-300 bg-white px-4 text-sm font-black text-[#10233f] outline-none focus:border-orange-400"
            >
              <option value="all">
                All Risk Domains
              </option>

              {availableDomains.map((domain) => (
                <option
                  key={domain}
                  value={domain}
                >
                  {formatStage(domain)}
                </option>
              ))}
            </select>

            <select
              value={stageFilter}
              onChange={(event) =>
                setStageFilter(
                  event.target.value
                )
              }
              className="min-h-11 rounded-xl border-2 border-slate-300 bg-white px-4 text-sm font-black text-[#10233f] outline-none focus:border-orange-400"
            >
              <option value="all">
                All Journey Stages
              </option>

              {availableStages.map((stage) => (
                <option
                  key={stage}
                  value={stage}
                >
                  {formatStage(stage)}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={clearFilters}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border-2 border-slate-300 bg-white px-4 text-xs font-black text-slate-700 transition hover:border-orange-300 hover:bg-orange-50 hover:text-orange-700"
            >
              <X size={13} />
              Clear
            </button>
          </div>

          <p className="mt-3 text-xs font-semibold text-slate-500">
            Showing {visibleStudents.length} of{" "}
            {filteredStudents.length} matching risk cases.
          </p>
        </section>

        <div className="mt-5 space-y-3">
          {visibleStudents.length ? (
            visibleStudents.map(
              (
                {
                  student,
                  signals,
                  severity,
                  riskScore,
                  opportunityScore,
                  journeyStage,
                  name,
                  key,
                },
                index
              ) => {
                const documentReadiness =
                  hasDiagnosticValue(
                    student,
                    "document_readiness_percent"
                  )
                    ? `${clamp(
                        getDiagnostic(
                          student,
                          "document_readiness_percent"
                        )
                      )}%`
                    : "Unknown";

                const taskCompletion =
                  hasDiagnosticValue(
                    student,
                    "task_completion_percent"
                  )
                    ? `${clamp(
                        getDiagnostic(
                          student,
                          "task_completion_percent"
                        )
                      )}%`
                    : "Unknown";

                const overdueTasks =
                  Math.max(
                    0,
                    number(
                      getDiagnostic(
                        student,
                        "overdue_tasks_count"
                      )
                    )
                  );

                const pendingTasks =
                  Math.max(
                    0,
                    number(
                      getDiagnostic(
                        student,
                        "pending_tasks_count"
                      )
                    )
                  );

                const universityPlanCount =
                  Math.max(
                    0,
                    number(
                      getDiagnostic(
                        student,
                        "university_plan_count"
                      )
                    )
                  );

                const topSignals =
                  signals.slice(0, 3);

                return (
                  <motion.article
                    key={key}
                    initial={
                      reduceMotion
                        ? false
                        : {
                            opacity: 0,
                            y: 8,
                          }
                    }
                    animate={{
                      opacity: 1,
                      y: 0,
                    }}
                    transition={{
                      duration: reduceMotion
                        ? 0
                        : 0.22,
                      delay: reduceMotion
                        ? 0
                        : index * 0.025,
                    }}
                    className="cursor-default rounded-[1.4rem] border-[3px] border-slate-300 bg-white p-4 shadow-[0_6px_18px_rgba(15,35,63,0.04)]"
                  >
                    <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="min-w-0 break-words text-base font-black leading-5 text-[#10233f]">
                            {name}
                          </p>

                          <span className="rounded-full border-2 border-slate-300 bg-slate-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.08em] text-slate-600">
                            {formatStage(
                              journeyStage
                            )}
                          </span>

                          <SeverityBadge
                            severity={severity}
                          />
                        </div>

                        <p className="mt-2 text-sm font-black text-red-700">
                          {getRiskBadge(
                            student,
                            signals
                          )}
                        </p>

                        <p className="mt-2 text-xs font-semibold leading-5 text-slate-600">
                          {getRiskReason(
                            student,
                            signals
                          )}
                        </p>

                        <div className="mt-3 rounded-xl border-2 border-orange-200 bg-orange-50 px-3 py-3">
                          <p className="text-[9px] font-black uppercase tracking-[0.08em] text-orange-700">
                            Next Action
                          </p>

                          <p className="mt-1 text-xs font-black leading-5 text-[#10233f]">
                            {getRecommendedAction(
                              student,
                              signals
                            )}
                          </p>
                        </div>

                        {topSignals.length > 1 ? (
                          <div className="mt-3 flex flex-wrap gap-2">
                            {topSignals.map(
                              (signal) => (
                                <span
                                  key={`${key}-${signal.type}`}
                                  className="rounded-full border border-red-300 bg-red-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.08em] text-red-700"
                                >
                                  {
                                    signal.label
                                  }
                                </span>
                              )
                            )}
                          </div>
                        ) : null}

                        <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-5">
                          <MiniMetric
                            label="Documents"
                            value={
                              documentReadiness
                            }
                          />

                          <MiniMetric
                            label="Tasks"
                            value={
                              taskCompletion
                            }
                          />

                          <MiniMetric
                            label="Pending"
                            value={pendingTasks}
                          />

                          <MiniMetric
                            label="Overdue"
                            value={overdueTasks}
                          />

                          <MiniMetric
                            label="Universities"
                            value={
                              universityPlanCount
                            }
                          />
                        </div>
                      </div>

                      <div className="shrink-0 rounded-[1.35rem] border-[3px] border-[#234e78] bg-[#edf4fb] p-3 xl:w-[330px]">
                        <p className="text-[8px] font-black uppercase tracking-[0.12em] text-[#234e78]">
                          Student scoring
                        </p>
                        <p className="mt-1 text-[10px] font-semibold leading-4 text-slate-600">
                          Risk and opportunity are student scores. Rule severity comes from the strongest active risk signal and can repeat across students.
                        </p>

                        <div className="mt-3 grid grid-cols-3 gap-2">
                          <ScoreCard
                            label="Risk Score"
                            value={riskScore}
                            tone="danger"
                          />

                          <ScoreCard
                            label="Rule Severity"
                            value={severity}
                            tone="navy"
                          />

                          <ScoreCard
                            label="Opportunity"
                            value={opportunityScore}
                            tone="orange"
                          />
                        </div>

                        <div className="mt-2 rounded-xl border-2 border-orange-300 bg-white px-3 py-2">
                          <p className="text-[8px] font-black uppercase tracking-[0.1em] text-orange-700">
                            Strongest signal
                          </p>
                          <p className="mt-1 break-words text-xs font-black text-[#10233f]">
                            {signals[0]?.label || "No active risk rule"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </motion.article>
                );
              }
            )
          ) : (
            <div className="rounded-[1.4rem] border-[3px] border-emerald-300 bg-emerald-50 p-8 text-center">
              <CheckCircle2 className="mx-auto h-9 w-9 text-emerald-700" />

              <p className="mt-3 font-black text-emerald-900">
                No matching student risks detected
              </p>

              <p className="mx-auto mt-2 max-w-xl text-sm font-semibold leading-6 text-emerald-800">
                Adjust the filters or continue monitoring applications,
                CAS, visa, documents, tasks, activity, and university
                planning.
              </p>
            </div>
          )}
        </div>
      </div>
    </motion.section>
  );
}

function RiskCommandCard({
  label,
  value,
  detail,
  tone = "red",
  icon: Icon,
}) {
  const dark = tone === "navy";

  const style =
    tone === "orange"
      ? "border-orange-300 bg-orange-50"
      : tone === "warning"
      ? "border-amber-300 bg-amber-50"
      : tone === "navy"
      ? "border-[#123865] bg-[#123865]"
      : "border-red-300 bg-red-50";

  return (
    <div
      className={`rounded-[1.35rem] border-[3px] p-4 ${style}`}
      style={{
        color: dark ? "#FFFFFF" : "#10233F",
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p
            className="text-[9px] font-black uppercase tracking-[0.1em]"
            style={{
              color: dark
                ? "#FDBA74"
                : "#64748B",
            }}
          >
            {label}
          </p>

          <p
            className="mt-2 text-3xl font-black"
            style={{
              color: dark
                ? "#FFFFFF"
                : "#10233F",
            }}
          >
            {value || 0}
          </p>
        </div>

        {Icon ? (
          <Icon
            size={18}
            style={{
              color: dark
                ? "#FDBA74"
                : "#C2410C",
            }}
          />
        ) : null}
      </div>

      <p
        className="mt-2 text-xs font-semibold leading-5"
        style={{
          color: dark
            ? "#F8FAFC"
            : "#64748B",
        }}
      >
        {detail}
      </p>
    </div>
  );
}

function PortfolioMetric({
  label,
  value,
  helper,
  icon: Icon,
  tone = "orange",
}) {
  const dark = tone === "navy";

  const style =
    tone === "danger"
      ? "border-red-300 bg-red-50"
      : tone === "warning"
      ? "border-amber-300 bg-amber-50"
      : tone === "navy"
      ? "border-[#123865] bg-[#123865]"
      : "border-orange-300 bg-orange-50";

  return (
    <div
      className={`rounded-[1.3rem] border-[3px] p-4 ${style}`}
      style={{
        color: dark ? "#FFFFFF" : "#10233F",
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p
            className="text-[9px] font-black uppercase tracking-[0.1em]"
            style={{
              color: dark
                ? "#FDBA74"
                : "#64748B",
            }}
          >
            {label}
          </p>

          <p
            className="mt-2 text-2xl font-black"
            style={{
              color: dark
                ? "#FFFFFF"
                : "#10233F",
            }}
          >
            {value}
          </p>
        </div>

        <Icon
          size={18}
          style={{
            color: dark
              ? "#FDBA74"
              : "#C2410C",
          }}
        />
      </div>

      <p
        className="mt-2 text-xs font-semibold leading-5"
        style={{
          color: dark
            ? "#F8FAFC"
            : "#64748B",
        }}
      >
        {helper}
      </p>
    </div>
  );
}

function RiskMiniBoard({
  title,
  items = [],
  tone = "red",
}) {
  const dark = tone === "navy";

  const scoreClass =
    tone === "orange"
      ? "border-orange-300 bg-orange-50 text-orange-700"
      : tone === "warning"
      ? "border-amber-300 bg-amber-50 text-amber-800"
      : tone === "navy"
      ? "border-[#123865] bg-[#123865] text-white"
      : "border-red-300 bg-red-50 text-red-700";

  return (
    <div className="rounded-[1.4rem] border-[3px] border-slate-300 bg-white p-5 shadow-[0_8px_22px_rgba(15,35,63,0.04)]">
      <h3 className="font-black text-[#10233f]">
        {title}
      </h3>

      <div className="mt-4 space-y-3">
        {items.length ? (
          items.map(
            (
              {
                student,
                severity,
                riskScore,
                opportunityScore,
                journeyStage,
                name,
                key,
              },
              index
            ) => (
              <div
                key={`${title}-${key}-${index}`}
                className="rounded-xl border-2 border-slate-300 bg-[#fffaf2] p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-black text-[#10233f]">
                      {name}
                    </p>

                    <p className="mt-1 text-xs font-semibold text-slate-500">
                      {formatStage(
                        journeyStage
                      )}{" "}
                      · Opp {opportunityScore}
                    </p>
                  </div>

                  <span
                    className={`rounded-full border px-3 py-1 text-xs font-black ${scoreClass}`}
                  >
                    {Math.max(
                      severity,
                      riskScore
                    )}
                  </span>
                </div>

                <p className="mt-2 line-clamp-2 text-xs font-semibold leading-5 text-slate-600">
                  {getRiskReason(
                    student,
                    getRiskSignals(student)
                  )}
                </p>
              </div>
            )
          )
        ) : (
          <p className="rounded-xl border-2 border-dashed border-slate-300 bg-[#fffaf2] p-4 text-sm font-semibold text-slate-500">
            No records.
          </p>
        )}
      </div>
    </div>
  );
}

function MiniMetric({
  label,
  value,
}) {
  return (
    <div className="rounded-xl border-2 border-slate-300 bg-[#fffaf2] px-3 py-2">
      <p className="text-[9px] font-black uppercase tracking-[0.08em] text-slate-500">
        {label}
      </p>

      <p className="mt-1 text-sm font-black text-[#10233f]">
        {value}
      </p>
    </div>
  );
}

function ScoreCard({
  label,
  value,
  tone = "orange",
}) {
  const dark = tone === "navy";

  const style =
    tone === "danger"
      ? "border-red-400 bg-[#fff0f0]"
      : tone === "navy"
      ? "border-[#123865] bg-[#123865]"
      : "border-orange-400 bg-[#fff3e5]";

  return (
    <div
      className={`rounded-xl border-2 p-3 text-center ${style}`}
      style={{
        color: dark ? "#FFFFFF" : "#10233F",
      }}
    >
      <p
        className="text-[8px] font-black uppercase tracking-[0.08em]"
        style={{
          color: dark
            ? "#FDBA74"
            : "#64748B",
        }}
      >
        {label}
      </p>

      <p
        className="mt-1 text-xl font-black"
        style={{
          color: dark
            ? "#FFFFFF"
            : "#10233F",
        }}
      >
        {value}
      </p>
    </div>
  );
}

function SeverityBadge({ severity }) {
  const band = getSeverityBand(severity);

  const style =
    band === "critical"
      ? "border-red-300 bg-red-50 text-red-700"
      : band === "high"
      ? "border-amber-300 bg-amber-50 text-amber-800"
      : band === "medium"
      ? "border-orange-300 bg-orange-50 text-orange-700"
      : "border-slate-300 bg-slate-50 text-slate-700";

  return (
    <span
      className={`rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.08em] ${style}`}
    >
      Severity {severity}
    </span>
  );
}

export default RiskMonitoringPanel;
