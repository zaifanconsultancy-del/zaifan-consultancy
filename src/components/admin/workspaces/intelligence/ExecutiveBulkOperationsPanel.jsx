import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  CircleGauge,
  Clock3,
  Crown,
  FileWarning,
  Gauge,
  History,
  Layers3,
  Play,
  RefreshCw,
  RotateCcw,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
  Users,
  Workflow,
  XCircle,
  Zap,
} from "lucide-react";
import {
  buildExecutionAnalytics,
  buildQueueHealthAnalytics,
  executeBulkExecutiveActions,
  executeCriticalExecutiveActions,
  executeExecutivePriorityActions,
  fetchExecutiveExecutionLogs,
  retryFailedExecutiveActions,
} from "../../../../lib/executiveActionExecutor";
import { buildExecutiveActionTemplate } from "../../../../lib/executiveActionTemplates";
import {
  buildBrokenWorkflowScannerSnapshot,
  buildExecutiveAutomationSnapshot,
  buildExecutiveRecoveryActions,
  generateBrokenWorkflowReport,
} from "../../../../lib/executiveAutomationEngine";

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

function asArray(value) {
  return Array.isArray(value) ? value : [];
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

function getStudentName(score = {}) {
  return score.student_name || score.full_name || score.name || score?.student?.name || "Unknown Student";
}

function getStudentId(score = {}) {
  return score.student_id || score.studentId || score.inquiry_id || score.appointment_id || score.id || null;
}

function getScoreValue(score = {}, key, fallback = 0) {
  return score?.[key] ?? score?.diagnostics?.[key] ?? fallback;
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

function mergeStudentOperatingData(scores = [], platformStudents = []) {
  const scoreRows = asArray(scores);
  const platformRows = asArray(platformStudents);
  const byId = new Map();

  [...platformRows, ...scoreRows].forEach((row) => {
    const id = getStudentId(row) || `${getStudentName(row)}-${row.student_type || row.record_type || "student"}`;
    const existing = byId.get(id) || {};
    byId.set(id, { ...existing, ...row });
  });

  return [...byId.values()];
}

function buildRecommendation(score = {}, mode = "executive") {
  const stage = getJourneyStage(score);
  const risk = number(score.risk_score);
  const opportunity = number(score.opportunity_score);
  const docs = number(getScoreValue(score, "document_readiness_percent"), 100);
  const overdue = number(getScoreValue(score, "overdue_tasks_count"));
  const staleDays = number(getScoreValue(score, "days_since_updated"));
  const studentName = getStudentName(score);

  if (mode === "critical") {
    return {
      type: risk >= 85 ? "critical_case_review" : "urgent_student_recovery",
      action: "create_task",
      priority: "critical",
      title: `Critical Review: ${studentName}`,
      description: `Executive AI flagged ${studentName} for immediate intervention. Risk ${risk}, stage ${formatLabel(stage)}.`,
      payload: { approval_required: false },
    };
  }

  if (mode === "conversion") {
    return {
      type: "conversion_opportunity",
      action: opportunity >= 85 ? "schedule_call" : "create_reminder",
      priority: opportunity >= 85 ? "executive" : "high",
      title: `Conversion Push: ${studentName}`,
      description: `Move ${studentName} forward from ${formatLabel(stage)}. Opportunity ${opportunity}.`,
      payload: { approval_required: false },
    };
  }

  if (mode === "recovery") {
    return {
      type: score.issue_type || "workflow_recovery",
      action: score.recovery_action || "create_task",
      priority: score.severity === "critical" ? "critical" : score.severity === "high" ? "high" : "medium",
      title: score.title || `Workflow Recovery: ${studentName}`,
      description: score.recommendation || score.description || "Recover broken student workflow.",
      payload: {
        approval_required: true,
        recovery_issue_id: score.id,
        recovery_stage: score.stage,
        recovery_type: score.recovery_type,
      },
    };
  }

  if (["cas_issued", "visa_pending", "visa_rejected"].includes(stage)) {
    return {
      type: stage === "visa_rejected" ? "visa_rejection_review" : "visa_monitoring",
      action: "create_task",
      priority: "executive",
      title: `Visa/CAS Executive Action: ${studentName}`,
      description: `Visa/CAS watch action required for ${studentName}. Current stage: ${formatLabel(stage)}.`,
      payload: { approval_required: false },
    };
  }

  if (docs < 65 || overdue > 0) {
    return {
      type: docs < 65 ? "document_readiness_gap" : "task_recovery",
      action: "create_task",
      priority: "high",
      title: `Recovery Action: ${studentName}`,
      description: `Operational recovery needed. Documents ${docs}%, overdue tasks ${overdue}.`,
      payload: { approval_required: false },
    };
  }

  if (staleDays >= 10) {
    return {
      type: "inactive_student",
      action: "create_reminder",
      priority: "medium",
      title: `Reconnect: ${studentName}`,
      description: `${studentName} has not moved recently. Create a follow-up reminder.`,
      payload: { approval_required: false },
    };
  }

  return {
    type: "executive_priority_follow_up",
    action: opportunity >= 80 ? "schedule_call" : "create_task",
    priority: "executive",
    title: `Executive Follow-Up: ${studentName}`,
    description: `Executive-priority student requires next-step action. Risk ${risk}, opportunity ${opportunity}.`,
    payload: { approval_required: false },
  };
}

function buildTemplatesFromScores(scores = [], mode = "executive") {
  return asArray(scores)
    .filter(Boolean)
    .map((score) => {
      try {
        return buildExecutiveActionTemplate(
          score,
          buildRecommendation(score, mode)
        );
      } catch (error) {
        console.warn("Executive template generation skipped:", error);
        return null;
      }
    })
    .filter(Boolean);
}

function buildTemplatesFromRecoveryActions(actions = []) {
  return asArray(actions)
    .filter(Boolean)
    .map((action) => {
      try {
        return buildExecutiveActionTemplate(
      {
        student_id: action.student_id,
        student_type: action.student_type,
        student_name: action.student_name,
        risk_score: action.severity === "critical" ? 95 : action.severity === "high" ? 80 : 55,
        priority_level: action.severity === "critical" ? "critical" : "executive",
        journey_stage: action.stage,
        metadata: action.payload,
      },
      {
        type: action.action_type,
        action: action.action_type?.includes("message") ? "create_message_draft" : "create_task",
        priority: action.severity === "critical" ? "critical" : action.severity === "high" ? "high" : "medium",
        title: action.title,
        description: action.description,
        payload: {
          approval_required: action.requires_approval,
          recovery_action_id: action.id,
          target_table: action.target_table,
          target_status: action.target_status,
          automation_template: action.automation_template,
          ...action.payload,
        },
      }
        );
      } catch (error) {
        console.warn("Recovery template generation skipped:", error);
        return null;
      }
    })
    .filter(Boolean);
}

function getRecoveryActionsForSelection(recovery = {}, selectedItems = []) {
  const selected = asArray(selectedItems);
  if (!selected.length) return asArray(recovery.actions);

  const workflows = asArray(recovery.workflows);
  const selectedIds = new Set(
    selected
      .map((item) => String(item?.id || item?.issue_id || item?.recovery_issue_id || ""))
      .filter(Boolean)
  );

  const fromWorkflows = workflows.flatMap((workflow) => {
    const issueId = String(workflow?.issue?.id || workflow?.issue_id || "");
    if (!issueId || !selectedIds.has(issueId)) return [];
    return asArray(workflow.actions);
  });

  if (fromWorkflows.length) return fromWorkflows;

  // Some engine versions expose queue entries as actions rather than scanner issues.
  return selected.filter(
    (item) =>
      item?.action_type ||
      item?.automation_template ||
      item?.target_table ||
      item?.recovery_action
  );
}

function getErrorMessage(error, fallback = "Operation failed.") {
  if (!error) return fallback;
  if (typeof error === "string") return error;
  return error.message || error.details || error.hint || fallback;
}

function buildBulkAnalytics(scores = [], logs = []) {
  const rows = asArray(scores);
  const logRows = asArray(logs);
  const critical = rows.filter((score) => number(score.risk_score) >= 85 || normalize(score.risk_level) === "critical");
  const executive = rows.filter((score) => normalize(score.priority_level) === "executive" || number(score.risk_score) >= 85 || number(score.opportunity_score) >= 85);
  const conversion = rows.filter((score) => number(score.opportunity_score) >= 80 || ["offer_accepted", "cas_pending", "cas_issued", "visa_pending"].includes(getJourneyStage(score)));
  const approval = rows.filter((score) => number(score.risk_score) >= 75 || normalize(score.priority_level) === "executive" || number(score.opportunity_score) >= 85);
  const failed = logRows.filter((log) => normalize(log.status) === "failed" || normalize(log.status).includes("error"));
  const pending = logRows.filter((log) => ["pending", "queued", "approval_required", "required"].includes(normalize(log.status)) || normalize(log.approval_status) === "required");
  const completed = logRows.filter((log) => ["completed", "success", "executed"].includes(normalize(log.status)));

  return {
    totalStudents: rows.length,
    criticalStudents: critical.length,
    executiveStudents: executive.length,
    conversionReady: conversion.length,
    approvalRequired: approval.length,
    failedActions: failed.length,
    pendingQueue: pending.length,
    completedActions: completed.length,
    critical,
    executive,
    conversion,
    approval,
    failed,
    pending,
    completed,
  };
}

function buildRecoveryOperatingModel({ scores = [], platformStudents = [], verificationSnapshot = null } = {}) {
  const students = mergeStudentOperatingData(scores, platformStudents);

  try {
    const scanner = buildBrokenWorkflowScannerSnapshot(students) || {};
    const recovery = buildExecutiveRecoveryActions(asArray(scanner.issues)) || {};
    const report = generateBrokenWorkflowReport(students) || {};
    const executiveSnapshot =
      buildExecutiveAutomationSnapshot({
        students,
        scores: asArray(scores),
        verificationSnapshot,
      }) || {};

    return {
      students,
      scanner: {
        ...scanner,
        issues: asArray(scanner.issues),
        totalIssues: number(scanner.totalIssues, asArray(scanner.issues).length),
      },
      recovery: {
        ...recovery,
        actions: asArray(recovery.actions),
        workflows: asArray(recovery.workflows),
        casQueue: asArray(recovery.casQueue),
        visaQueue: asArray(recovery.visaQueue),
        paymentQueue: asArray(recovery.paymentQueue),
        portalQueue: asArray(recovery.portalQueue),
        totalActions: number(recovery.totalActions, asArray(recovery.actions).length),
      },
      report: {
        ...report,
        heatmap: report.heatmap && typeof report.heatmap === "object" ? report.heatmap : {},
      },
      executiveSnapshot,
      error: "",
      generatedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error("Executive recovery model failed:", error);

    return {
      students,
      scanner: {
        issues: [],
        totalIssues: 0,
        critical: 0,
        high: 0,
        medium: 0,
        brokenStages: 0,
        scannedStudents: students.length,
        health_status: "scanner_error",
      },
      recovery: {
        actions: [],
        workflows: [],
        casQueue: [],
        visaQueue: [],
        paymentQueue: [],
        portalQueue: [],
        totalActions: 0,
      },
      report: { heatmap: {} },
      executiveSnapshot: {},
      error: getErrorMessage(error, "Recovery scanner could not build its operating model."),
      generatedAt: new Date().toISOString(),
    };
  }
}

// ExecutiveOperationsCenter V5 PARTNER OS EXTREME — Protected Bulk Operations

function ExecutiveOperationsCenter({ scores = [], adminProfile = null, onActionExecuted, platformStudents = [], verificationSnapshot = null }) {
  const [executing, setExecuting] = useState(false);
  const [activeExecution, setActiveExecution] = useState("");
  const [activeMode, setActiveMode] = useState("critical");
  const [activeRecoveryQueue, setActiveRecoveryQueue] = useState("all");
  const [logs, setLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [logsError, setLogsError] = useState("");
  const [message, setMessage] = useState("");
  const [result, setResult] = useState(null);
  const [showAllPreview, setShowAllPreview] = useState(false);
  const [showExecutionHistory, setShowExecutionHistory] = useState(false);

  const analytics = useMemo(() => buildBulkAnalytics(scores, logs), [scores, logs]);
  const executionAnalytics = useMemo(() => buildExecutionAnalytics(logs), [logs]);
  const queueHealth = useMemo(
    () => buildQueueHealthAnalytics({ queue: analytics.pending, logs, scores }),
    [analytics.pending, logs, scores]
  );

  const recoveryModel = useMemo(
    () => buildRecoveryOperatingModel({ scores, platformStudents, verificationSnapshot }),
    [scores, platformStudents, verificationSnapshot]
  );

  const selectedStudents = useMemo(() => {
    if (activeMode === "critical") return analytics.critical;
    if (activeMode === "executive") return analytics.executive;
    if (activeMode === "conversion") return analytics.conversion;
    if (activeMode === "approval") return analytics.approval;
    if (activeMode === "failed") return analytics.failed;
    if (activeMode === "recovery") return recoveryModel.scanner.issues || [];
    return scores;
  }, [activeMode, analytics, scores, recoveryModel.scanner.issues]);

  const selectedRecoveryQueue = useMemo(() => {
    const recovery = recoveryModel.recovery || {};
    if (activeRecoveryQueue === "cas") return recovery.casQueue || [];
    if (activeRecoveryQueue === "visa") return recovery.visaQueue || [];
    if (activeRecoveryQueue === "payment") return recovery.paymentQueue || [];
    if (activeRecoveryQueue === "portal") return recovery.portalQueue || [];
    return recoveryModel.scanner.issues || [];
  }, [activeRecoveryQueue, recoveryModel]);

  const loadLogs = async () => {
    setLogsLoading(true);
    setLogsError("");

    try {
      const response = await fetchExecutiveExecutionLogs({ limit: 160 });
      if (response?.error) throw response.error;
      setLogs(asArray(response?.data));
    } catch (error) {
      console.error("Executive execution logs failed:", error);
      setLogsError(getErrorMessage(error, "Execution logs could not be loaded."));
    } finally {
      setLogsLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, []);

  const afterExecution = async (response, label) => {
    const safeResponse = response || {};
    setResult(safeResponse);

    setMessage(
      `${label}: ${number(safeResponse.successful)} completed • ${number(
        safeResponse.failed
      )} failed • ${number(safeResponse.duplicateBlocked)} duplicate blocked`
    );

    await loadLogs();

    if (typeof onActionExecuted === "function") {
      try {
        await onActionExecuted(safeResponse);
      } catch (error) {
        console.warn("Post-execution refresh callback failed:", error);
      }
    }
  };

  const requireTemplates = (templates, label) => {
    const safeTemplates = asArray(templates).filter(Boolean);

    if (!safeTemplates.length) {
      setMessage(`No executable ${label} templates are available right now.`);
      setResult({
        total: 0,
        successful: 0,
        failed: 0,
        duplicateBlocked: 0,
        results: [],
      });
      return null;
    }

    return safeTemplates;
  };

  const executeBulk = async (type) => {
    if (executing) return;

    try {
      setExecuting(true);
      setActiveExecution(type);
      setMessage("");
      setResult(null);

      if (type === "critical") {
        const templates = requireTemplates(
          buildTemplatesFromScores(analytics.critical, "critical"),
          "critical"
        );
        if (!templates) return;
        return await afterExecution(
          await executeCriticalExecutiveActions({ templates, adminProfile }),
          "Critical queue executed"
        );
      }

      if (type === "executive") {
        const templates = requireTemplates(
          buildTemplatesFromScores(analytics.executive, "executive"),
          "executive"
        );
        if (!templates) return;
        return await afterExecution(
          await executeExecutivePriorityActions({ templates, adminProfile }),
          "Executive queue executed"
        );
      }

      if (type === "conversion") {
        const templates = requireTemplates(
          buildTemplatesFromScores(analytics.conversion, "conversion"),
          "conversion"
        );
        if (!templates) return;
        return await afterExecution(
          await executeBulkExecutiveActions({ templates, adminProfile }),
          "Conversion queue executed"
        );
      }

      if (type === "retry") {
        return await afterExecution(
          await retryFailedExecutiveActions({ failedLogs: analytics.failed, adminProfile }),
          "Failed queue retried"
        );
      }

      if (type === "approve") {
        const templates = requireTemplates(
          buildTemplatesFromScores(analytics.approval, "executive"),
          "approval"
        );
        if (!templates) return;
        return await afterExecution(
          await executeBulkExecutiveActions({
            templates,
            adminProfile,
            skipDuplicateCheck: false,
            batchMode: "bulk_approve_execute",
          }),
          "Bulk approval execution completed"
        );
      }

      if (type === "recovery") {
        const actions = getRecoveryActionsForSelection(
          recoveryModel.recovery,
          selectedRecoveryQueue
        );
        const templates = requireTemplates(
          buildTemplatesFromRecoveryActions(actions),
          "recovery"
        );
        if (!templates) return;
        return await afterExecution(
          await executeBulkExecutiveActions({
            templates,
            adminProfile,
            batchMode: "workflow_recovery_execution",
          }),
          "Workflow recovery queue executed"
        );
      }

      if (type === "reject") {
        setMessage("Bulk reject is recorded as a command action. No student records were changed.");
        return setResult({ total: analytics.approval.length, successful: 0, failed: 0, duplicateBlocked: 0, results: [] });
      }
    } catch (error) {
      console.error("Executive bulk operation failed:", error);
      setMessage(getErrorMessage(error, "Bulk operation failed."));
      setResult({ error, total: 0, successful: 0, failed: 1, duplicateBlocked: 0, results: [] });
    } finally {
      setExecuting(false);
      setActiveExecution("");
    }
  };


  const previewRows =
    activeMode === "recovery"
      ? selectedRecoveryQueue
      : selectedStudents;

  const visiblePreviewRows = showAllPreview
    ? previewRows
    : previewRows.slice(0, 8);

  const successRate =
    queueHealth.successRate ||
    executionAnalytics.successRate ||
    0;

  const commandStatus =
    recoveryModel.error || logsError
      ? "Attention"
      : executing
        ? "Executing"
        : successRate >= 85
          ? "Stable"
          : successRate >= 60
            ? "Watch"
            : "Intervention";

  return (
    <div
      className="min-w-0 space-y-5"
      aria-busy={executing || logsLoading}
    >
      <section className="min-w-0 overflow-hidden rounded-[1.75rem] border-[3px] border-[#FF5A0A] bg-white shadow-[0_18px_50px_rgba(18,56,101,0.11)]">
        <div className="grid min-w-0 lg:grid-cols-[minmax(0,1.28fr)_minmax(19rem,0.72fr)]">
          <div className="min-w-0 bg-[#123865] p-5 text-white sm:p-6 lg:p-7">
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <CommandChip icon={Workflow}>
                Executive Operations V5
              </CommandChip>
              <CommandChip icon={ShieldCheck}>
                Human Controlled
              </CommandChip>
              <CommandChip icon={Layers3}>
                Live Executor
              </CommandChip>
            </div>

            <h2 className="mt-4 max-w-5xl break-words text-3xl font-black leading-tight tracking-[-0.04em] text-white sm:text-4xl">
              Verification & Recovery Automation Command Layer
            </h2>

            <p className="mt-3 max-w-5xl break-words text-sm font-semibold leading-6 text-slate-100">
              Govern batch execution, broken-workflow scanning, CAS, visa,
              payment and portal recovery, approval pressure, duplicate
              protection and production-hardening visibility for Student OS.
            </p>

            <div className="mt-5 grid min-w-0 grid-cols-2 gap-2 sm:grid-cols-4">
              <DarkCommandMetric
                label="Students"
                value={analytics.totalStudents}
              />
              <DarkCommandMetric
                label="Broken Workflows"
                value={recoveryModel.scanner.totalIssues}
              />
              <DarkCommandMetric
                label="Queue Pressure"
                value={queueHealth.queuePressure}
              />
              <DarkCommandMetric
                label="Recovery Actions"
                value={recoveryModel.recovery.totalActions}
              />
            </div>
          </div>

          <div className="min-w-0 border-t-[3px] border-[#FF5A0A] bg-[#FF5A0A] p-5 text-white sm:p-6 lg:border-l-[3px] lg:border-t-0 lg:p-7">
            <div className="flex items-center gap-2">
              <CircleGauge size={18} />
              <p className="text-[9px] font-black uppercase tracking-[0.14em] text-white">
                Automation Command Health
              </p>
            </div>

            <p className="mt-3 text-5xl font-black text-white">
              {successRate}%
            </p>

            <p className="mt-1 text-sm font-black uppercase tracking-[0.08em] text-white">
              {commandStatus}
            </p>

            <div className="mt-5 grid grid-cols-2 gap-2">
              <OrangeCommandMetric
                label="Critical Queue"
                value={analytics.criticalStudents}
              />
              <OrangeCommandMetric
                label="Failed"
                value={analytics.failedActions}
              />
              <OrangeCommandMetric
                label="Pending"
                value={queueHealth.pendingCount}
              />
              <OrangeCommandMetric
                label="Duplicates"
                value={queueHealth.duplicateBlockedCount}
              />
            </div>

            <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
              <button
                type="button"
                onClick={loadLogs}
                disabled={executing || logsLoading}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border-2 border-white bg-white px-4 text-xs font-black text-[#123865] shadow-sm transition hover:-translate-y-0.5 hover:bg-[#FFF4E8] hover:shadow-md disabled:cursor-not-allowed disabled:opacity-55"
              >
                <RefreshCw
                  size={14}
                  className={logsLoading ? "animate-spin" : ""}
                />
                {logsLoading ? "Refreshing..." : "Refresh Queue"}
              </button>

              <button
                type="button"
                onClick={() => executeBulk("recovery")}
                disabled={
                  executing ||
                  !recoveryModel.recovery.totalActions
                }
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border-2 border-[#123865] bg-[#123865] px-4 text-xs font-black text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-[#0F3158] hover:shadow-md disabled:cursor-not-allowed disabled:opacity-55"
              >
                <Workflow size={14} />
                {activeExecution === "recovery"
                  ? "Processing..."
                  : "Execute Recovery"}
              </button>
            </div>
          </div>
        </div>

        <div className="grid min-w-0 gap-3 border-t-[3px] border-[#123865] bg-[#FFF8EF] p-4 sm:grid-cols-2 sm:p-5 xl:grid-cols-4">
          <CommandSummaryCard
            label="Executive Queue"
            value={analytics.executiveStudents}
            detail="High-risk or high-opportunity command records."
            tone="navy"
            icon={Crown}
          />
          <CommandSummaryCard
            label="Conversion Ready"
            value={analytics.conversionReady}
            detail="Students positioned for next-stage conversion."
            tone="green"
            icon={TrendingUp}
          />
          <CommandSummaryCard
            label="Approval Pressure"
            value={analytics.approvalRequired}
            detail="Records likely requiring protected approval."
            tone="orange"
            icon={ShieldAlert}
          />
          <CommandSummaryCard
            label="Broken Stages"
            value={recoveryModel.scanner.brokenStages}
            detail="Journey stages with detected workflow breaks."
            tone={
              recoveryModel.scanner.brokenStages
                ? "red"
                : "green"
            }
            icon={FileWarning}
          />
        </div>
      </section>

      {message ? (
        <StatusMessage
          tone={result?.failed ? "warning" : "info"}
          icon={result?.failed ? AlertTriangle : Sparkles}
        >
          {message}
        </StatusMessage>
      ) : null}

      {logsError || recoveryModel.error ? (
        <StatusMessage tone="danger" icon={XCircle}>
          {logsError || recoveryModel.error}
        </StatusMessage>
      ) : null}

      <PartnerSection
        eyebrow="Protected Execution"
        title="Bulk command actions"
        description="Every command uses the real executor, saved templates, duplicate protection and current Admin identity."
        icon={Zap}
        badge={`${analytics.totalStudents} portfolio records`}
      >
        <div className="grid min-w-0 gap-3 md:grid-cols-2 xl:grid-cols-3">
          <ActionButton
            title="Execute Critical Queue"
            description="Create immediate intervention tasks for critical-risk students."
            onClick={() => executeBulk("critical")}
            busy={executing}
            active={activeExecution === "critical"}
            tone="red"
            icon={ShieldAlert}
          />

          <ActionButton
            title="Execute Executive Queue"
            description="Run executive-priority movement actions for the leadership queue."
            onClick={() => executeBulk("executive")}
            busy={executing}
            active={activeExecution === "executive"}
            tone="navy"
            icon={Crown}
          />

          <ActionButton
            title="Execute Conversion Queue"
            description="Run conversion-ready calls, reminders and next-step tasks."
            onClick={() => executeBulk("conversion")}
            busy={executing}
            active={activeExecution === "conversion"}
            tone="green"
            icon={TrendingUp}
          />

          <ActionButton
            title="Retry Failed Actions"
            description="Rebuild and retry failed automation items from saved execution logs."
            onClick={() => executeBulk("retry")}
            busy={executing}
            active={activeExecution === "retry"}
            tone="orange"
            icon={RotateCcw}
          />

          <ActionButton
            title="Approve + Execute Batch"
            description="Run the reviewed approval queue through the protected executor."
            onClick={() => executeBulk("approve")}
            busy={executing}
            active={activeExecution === "approve"}
            tone="navy"
            icon={CheckCircle2}
          />

          <ActionButton
            title="Execute Recovery Workflows"
            description="Run generated CAS, visa, payment and portal recovery actions."
            onClick={() => executeBulk("recovery")}
            busy={executing}
            active={activeExecution === "recovery"}
            unavailable={!recoveryModel.recovery.totalActions}
            tone="red"
            icon={Workflow}
          />
        </div>
      </PartnerSection>

      <div className="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1.08fr)_minmax(20rem,0.92fr)]">
        <PartnerSection
          eyebrow="Broken Workflow Scanner"
          title="Production-hardening scan"
          description="Detect missing journey links, stale execution risk, broken stages and synchronization failures."
          icon={Gauge}
          badge={formatLabel(
            recoveryModel.scanner.health_status
          )}
        >
          <div className="grid min-w-0 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <SmallMetric
              label="Scanned Students"
              value={recoveryModel.scanner.scannedStudents}
            />
            <SmallMetric
              label="Critical"
              value={recoveryModel.scanner.critical}
              tone="red"
            />
            <SmallMetric
              label="High"
              value={recoveryModel.scanner.high}
              tone="orange"
            />
            <SmallMetric
              label="Medium"
              value={recoveryModel.scanner.medium}
              tone="yellow"
            />
            <SmallMetric
              label="Broken Stages"
              value={recoveryModel.scanner.brokenStages}
              tone="navy"
            />
            <SmallMetric
              label="Generated Actions"
              value={recoveryModel.recovery.totalActions}
              tone="green"
            />
          </div>
        </PartnerSection>

        <PartnerSection
          eyebrow="Recovery Queues"
          title="CAS, visa, payment and portal"
          description="Select the operating queue used by recovery preview and execution."
          icon={Workflow}
          badge={`${selectedRecoveryQueue.length} selected`}
          accent
        >
          <QueueTabs
            items={["all", "cas", "visa", "payment", "portal"]}
            active={activeRecoveryQueue}
            onChange={setActiveRecoveryQueue}
          />

          <div className="mt-4 grid min-w-0 grid-cols-2 gap-3">
            <SmallMetric
              label="CAS"
              value={
                recoveryModel.recovery.casQueue?.length || 0
              }
              tone="orange"
            />
            <SmallMetric
              label="Visa"
              value={
                recoveryModel.recovery.visaQueue?.length || 0
              }
              tone="red"
            />
            <SmallMetric
              label="Payment"
              value={
                recoveryModel.recovery.paymentQueue?.length || 0
              }
              tone="navy"
            />
            <SmallMetric
              label="Portal"
              value={
                recoveryModel.recovery.portalQueue?.length || 0
              }
              tone="green"
            />
          </div>
        </PartnerSection>
      </div>

      <div className="grid min-w-0 gap-5 xl:grid-cols-[minmax(19rem,0.82fr)_minmax(0,1.18fr)]">
        <PartnerSection
          eyebrow="Queue Health"
          title="Automation operating condition"
          description="Live pending, failure, completion, duplicate and approval pressure."
          icon={Activity}
          badge={`${successRate}% success`}
        >
          <div className="grid min-w-0 gap-3 sm:grid-cols-2">
            <SmallMetric
              label="Pending"
              value={queueHealth.pendingCount}
              tone="orange"
            />
            <SmallMetric
              label="Failed"
              value={queueHealth.failedCount}
              tone="red"
            />
            <SmallMetric
              label="Completed"
              value={queueHealth.completedCount}
              tone="green"
            />
            <SmallMetric
              label="Duplicates"
              value={queueHealth.duplicateBlockedCount}
              tone="navy"
            />
            <SmallMetric
              label="Throughput"
              value={executionAnalytics.total}
            />
            <SmallMetric
              label="Approval SLA"
              value={
                queueHealth.approvalSlaLabel || "Healthy"
              }
              tone="green"
            />
          </div>

          <div className="mt-4">
            <HealthProgress
              label="Execution Success"
              value={successRate}
            />
          </div>
        </PartnerSection>

        <PartnerSection
          eyebrow="Batch Execution History"
          title="Recent protected execution feed"
          description="Review completions, failures, duplicate blocks and saved audit evidence."
          icon={History}
          badge={`${logs.length} logs`}
        >
          <button
            type="button"
            onClick={() =>
              setShowExecutionHistory((value) => !value)
            }
            aria-expanded={showExecutionHistory}
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border-2 border-[#123865] bg-white px-4 text-xs font-black text-[#123865] transition hover:-translate-y-0.5 hover:border-[#FF5A0A] hover:bg-[#FFF4E8]"
          >
            {showExecutionHistory ? (
              <ChevronUp size={14} />
            ) : (
              <ChevronDown size={14} />
            )}
            {showExecutionHistory
              ? "Hide Execution History"
              : "Open Execution History"}
          </button>

          {showExecutionHistory ? (
            <div className="mt-4 max-h-[34rem] space-y-3 overflow-y-auto pr-1">
              {logs.slice(0, 12).map((log, index) => (
                <LogRow
                  key={
                    log.id ||
                    `${log.template_key}-${index}`
                  }
                  log={log}
                />
              ))}

              {!logs.length ? (
                <EmptyState text="No execution logs found yet." />
              ) : null}
            </div>
          ) : (
            <CompactNotice
              icon={Clock3}
              title="History collapsed"
              detail="Open the audit feed only when execution detail is required."
            />
          )}
        </PartnerSection>
      </div>

      <div className="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1.08fr)_minmax(20rem,0.92fr)]">
        <PartnerSection
          eyebrow="Selected Queue"
          title={`${
            activeMode === "recovery"
              ? formatLabel(activeRecoveryQueue)
              : formatLabel(activeMode)
          } queue preview`}
          description="Inspect the exact queue before running a protected batch command."
          icon={Target}
          badge={`${previewRows.length} records`}
        >
          <QueueTabs
            items={[
              "critical",
              "executive",
              "conversion",
              "approval",
              "failed",
              "recovery",
            ]}
            active={activeMode}
            onChange={setActiveMode}
          />

          <div className="mt-4 space-y-3">
            {visiblePreviewRows.map((item, index) =>
              activeMode === "recovery" ? (
                <IssueRow
                  key={item.id || index}
                  issue={item}
                />
              ) : (
                <StudentRow
                  key={`${
                    item.student_id ||
                    item.id ||
                    item.template_key ||
                    index
                  }-${index}`}
                  item={item}
                  mode={activeMode}
                />
              )
            )}

            {!previewRows.length ? (
              <EmptyState text="No students, logs or recovery issues are available in this queue." />
            ) : null}
          </div>

          {previewRows.length > 8 ? (
            <button
              type="button"
              onClick={() =>
                setShowAllPreview((value) => !value)
              }
              className="mt-4 inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border-2 border-[#FF5A0A] bg-[#FFF4E8] px-4 text-xs font-black text-orange-800 transition hover:-translate-y-0.5 hover:bg-white"
            >
              {showAllPreview ? (
                <ChevronUp size={14} />
              ) : (
                <ChevronDown size={14} />
              )}
              {showAllPreview
                ? "Show Compact Preview"
                : `Show All ${previewRows.length} Records`}
            </button>
          ) : null}
        </PartnerSection>

        <PartnerSection
          eyebrow="Recovery Center"
          title="Failure prediction and recovery"
          description="Understand the pressure behind workflow breaks, retries, duplicates and queue aging."
          icon={ShieldAlert}
          badge={commandStatus}
          accent
        >
          <div className="space-y-3">
            <RecoveryRow
              title="Broken workflow issues"
              value={recoveryModel.scanner.totalIssues}
              detail="Scanner output from student journey data, verification snapshots and operating records."
              tone="red"
            />
            <RecoveryRow
              title="Generated actions"
              value={recoveryModel.recovery.totalActions}
              detail="Recovery workflows prepared for protected review and execution."
              tone="navy"
            />
            <RecoveryRow
              title="Failed action retry"
              value={analytics.failedActions}
              detail="Only logs with saved original templates are retried; incomplete historical logs are skipped safely."
              tone="red"
            />
            <RecoveryRow
              title="Duplicate protection"
              value={queueHealth.duplicateBlockedCount}
              detail="Repeated tasks, reminders and drafts are blocked by student action key."
              tone="navy"
            />
            <RecoveryRow
              title="Critical pressure"
              value={analytics.criticalStudents}
              detail="Critical students should be reviewed before normal queue execution."
              tone="red"
            />
            <RecoveryRow
              title="Queue aging"
              value={
                queueHealth.oldestPendingAgeLabel || "Clear"
              }
              detail="Oldest pending or approval-controlled item based on available timestamps."
              tone="orange"
            />
          </div>
        </PartnerSection>
      </div>

      <PartnerSection
        eyebrow="Workflow Failure Heatmap"
        title="Stage-level recovery pressure"
        description="Broken-stage counts generated by the workflow report."
        icon={FileWarning}
        badge={`${
          Object.keys(recoveryModel.report.heatmap || {})
            .length
        } stages`}
      >
        <div className="grid min-w-0 gap-3 md:grid-cols-2 xl:grid-cols-4">
          {Object.entries(
            recoveryModel.report.heatmap || {}
          ).map(([stage, count]) => (
            <SmallMetric
              key={stage}
              label={formatLabel(stage)}
              value={count}
              tone={count ? "red" : "green"}
            />
          ))}

          {!Object.keys(
            recoveryModel.report.heatmap || {}
          ).length ? (
            <EmptyState text="No broken stages detected from the available operating data." />
          ) : null}
        </div>
      </PartnerSection>

      {result ? (
        <PartnerSection
          eyebrow="Last Batch Result"
          title="Protected execution summary"
          description="Compact outcome from the most recent bulk operation."
          icon={CheckCircle2}
          badge={result.error ? "Execution error" : "Latest result"}
        >
          <div className="grid min-w-0 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <SmallMetric
              label="Total"
              value={result.total || 0}
            />
            <SmallMetric
              label="Completed"
              value={result.successful || 0}
              tone="green"
            />
            <SmallMetric
              label="Failed"
              value={result.failed || 0}
              tone="red"
            />
            <SmallMetric
              label="Duplicate Blocked"
              value={result.duplicateBlocked || 0}
              tone="orange"
            />
          </div>
        </PartnerSection>
      ) : null}
    </div>
  );
}

function PartnerSection({
  eyebrow,
  title,
  description,
  icon: Icon = Sparkles,
  badge = "",
  accent = false,
  children,
}) {
  return (
    <section
      className={`min-w-0 overflow-hidden rounded-[1.6rem] border-[3px] bg-white shadow-[0_14px_38px_rgba(18,56,101,0.08)] ${
        accent
          ? "border-[#FF5A0A]"
          : "border-[#123865]"
      }`}
    >
      <div
        className={`flex min-w-0 flex-col gap-3 border-b-[3px] px-5 py-4 sm:flex-row sm:items-start sm:justify-between ${
          accent
            ? "border-[#FF5A0A] bg-[#FFF4E8]"
            : "border-[#FF5A0A] bg-[#123865] text-white"
        }`}
      >
        <div className="flex min-w-0 items-start gap-3">
          <span
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border-2 ${
              accent
                ? "border-[#FF5A0A] bg-white text-orange-700"
                : "border-white/25 bg-white/10 text-orange-200"
            }`}
          >
            <Icon size={17} />
          </span>

          <div className="min-w-0">
            <p
              className={`text-[9px] font-black uppercase tracking-[0.14em] ${
                accent
                  ? "text-orange-700"
                  : "text-orange-200"
              }`}
            >
              {eyebrow}
            </p>

            <h3
              className={`mt-1 break-words text-xl font-black ${
                accent
                  ? "text-[#10233F]"
                  : "text-white"
              }`}
            >
              {title}
            </h3>

            {description ? (
              <p
                className={`mt-1 max-w-4xl break-words text-xs font-semibold leading-5 ${
                  accent
                    ? "text-slate-600"
                    : "text-slate-200"
                }`}
              >
                {description}
              </p>
            ) : null}
          </div>
        </div>

        {badge ? (
          <span
            className={`w-fit shrink-0 rounded-full border-2 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.1em] ${
              accent
                ? "border-[#FF5A0A] bg-white text-orange-700"
                : "border-white/25 bg-white/10 text-white"
            }`}
          >
            {badge}
          </span>
        ) : null}
      </div>

      <div className="min-w-0 bg-[#FFF8EF] p-4 sm:p-5">
        {children}
      </div>
    </section>
  );
}

function CommandChip({ icon: Icon, children }) {
  return (
    <span className="inline-flex max-w-full items-center gap-2 rounded-full border-2 border-white/25 bg-white/10 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.12em] text-white">
      <Icon size={11} className="shrink-0 text-orange-200" />
      <span className="truncate">{children}</span>
    </span>
  );
}

function DarkCommandMetric({ label, value }) {
  return (
    <div className="min-w-0 rounded-xl border-2 border-white/25 bg-white/10 p-3 text-white shadow-inner">
      <p className="truncate text-[8px] font-black uppercase tracking-[0.1em] text-white">
        {label}
      </p>
      <p className="mt-1 truncate text-xl font-black text-white">
        {value}
      </p>
    </div>
  );
}

function OrangeCommandMetric({ label, value }) {
  return (
    <div className="min-w-0 rounded-xl border-2 border-white/25 bg-white/10 p-3 text-white">
      <p className="truncate text-[8px] font-black uppercase tracking-[0.1em] text-white">
        {label}
      </p>
      <p className="mt-1 truncate text-xl font-black text-white">
        {value}
      </p>
    </div>
  );
}

function CommandSummaryCard({
  label,
  value,
  detail,
  tone = "navy",
  icon: Icon,
}) {
  return (
    <article
      className={`min-w-0 rounded-[1.25rem] border-[3px] p-4 shadow-[0_7px_18px_rgba(18,56,101,0.05)] transition hover:-translate-y-0.5 hover:shadow-md ${getToneStyle(
        tone
      )}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="break-words text-[8px] font-black uppercase tracking-[0.1em] text-[#53657D]">
            {label}
          </p>
          <p className="mt-2 text-3xl font-black leading-none text-[#10233F]">
            {value}
          </p>
        </div>

        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border-2 border-white bg-white/80 text-[#123865] shadow-sm">
          <Icon size={16} />
        </span>
      </div>

      <p className="mt-3 break-words text-[10px] font-semibold leading-4 text-slate-600">
        {detail}
      </p>
    </article>
  );
}

function SmallMetric({
  label,
  value,
  tone = "default",
}) {
  return (
    <div
      className={`min-w-0 rounded-[1.15rem] border-[3px] p-4 shadow-[0_6px_16px_rgba(18,56,101,0.04)] ${getToneStyle(
        tone
      )}`}
    >
      <p className="break-words text-[8px] font-black uppercase tracking-[0.1em] text-[#53657D]">
        {label}
      </p>
      <p className="mt-2 break-words text-2xl font-black leading-tight text-[#10233F]">
        {value}
      </p>
    </div>
  );
}

function ActionButton({
  title,
  description,
  onClick,
  busy = false,
  active = false,
  unavailable = false,
  tone = "default",
  icon: Icon = Play,
}) {
  const disabled = busy || unavailable;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-busy={active}
      className={`group min-h-[10.5rem] min-w-0 rounded-[1.35rem] border-[3px] p-5 text-left shadow-[0_8px_22px_rgba(18,56,101,0.05)] transition duration-200 ${
        disabled
          ? "cursor-not-allowed opacity-55"
          : "cursor-pointer hover:-translate-y-1 hover:shadow-[0_16px_34px_rgba(18,56,101,0.12)]"
      } ${getToneStyle(tone)}`}
    >
      <div className="flex min-w-0 items-start justify-between gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border-2 border-white bg-white/85 text-[#123865] shadow-sm">
          <Icon
            size={17}
            className={active ? "animate-pulse" : ""}
          />
        </span>

        <span className="shrink-0 rounded-full border-2 border-white bg-white/85 px-2.5 py-1 text-[8px] font-black uppercase tracking-[0.1em] text-[#123865] shadow-sm">
          {active
            ? "Running"
            : unavailable
              ? "Empty"
              : "Protected"}
        </span>
      </div>

      <p className="mt-4 text-[8px] font-black uppercase tracking-[0.12em] text-orange-700">
        Executable Command
      </p>

      <h4 className="mt-1 break-words text-base font-black leading-5 text-[#10233F]">
        {active
          ? "Processing this command..."
          : unavailable
            ? "No actions available"
            : title}
      </h4>

      <p className="mt-2 break-words text-xs font-semibold leading-5 text-slate-600">
        {description}
      </p>
    </button>
  );
}

function QueueTabs({ items, active, onChange }) {
  return (
    <div className="flex min-w-0 flex-wrap gap-2">
      {items.map((item) => {
        const selected = active === item;

        return (
          <button
            key={item}
            type="button"
            onClick={() => onChange(item)}
            aria-pressed={selected}
            className={`rounded-xl border-2 px-3 py-2 text-[9px] font-black uppercase tracking-[0.1em] transition ${
              selected
                ? "border-[#FF5A0A] bg-[#FF5A0A] text-white shadow-sm"
                : "border-[#C9D7E6] bg-white text-[#123865] hover:border-[#123865] hover:bg-[#F2F7FF]"
            }`}
          >
            {formatLabel(item)}
          </button>
        );
      })}
    </div>
  );
}

function HealthProgress({ label, value }) {
  const clean = Math.max(
    0,
    Math.min(100, number(value))
  );

  return (
    <div className="min-w-0 rounded-[1.15rem] border-[3px] border-[#C9D7E6] bg-white p-4">
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs font-black text-[#10233F]">
          {label}
        </span>
        <span className="text-sm font-black text-orange-700">
          {clean}%
        </span>
      </div>

      <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-slate-200">
        <div
          className="h-full rounded-full bg-[#FF5A0A]"
          style={{ width: `${clean}%` }}
        />
      </div>
    </div>
  );
}

function StatusMessage({
  tone = "info",
  icon: Icon = Sparkles,
  children,
}) {
  const classes =
    tone === "danger"
      ? "border-red-400 bg-red-50 text-red-800"
      : tone === "warning"
        ? "border-amber-400 bg-amber-50 text-amber-900"
        : "border-blue-400 bg-blue-50 text-blue-800";

  return (
    <div
      className={`flex min-w-0 items-start gap-3 rounded-[1.35rem] border-[3px] p-4 text-sm font-bold shadow-[0_8px_22px_rgba(18,56,101,0.05)] ${classes}`}
    >
      <Icon size={17} className="mt-0.5 shrink-0" />
      <span className="min-w-0 break-words">{children}</span>
    </div>
  );
}

function CompactNotice({ icon: Icon, title, detail }) {
  return (
    <div className="mt-4 flex min-w-0 items-start gap-3 rounded-[1.15rem] border-[3px] border-[#C9D7E6] bg-white p-4">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border-2 border-[#C9D7E6] bg-[#FFF8EF] text-[#123865]">
        <Icon size={15} />
      </span>

      <div className="min-w-0">
        <p className="text-sm font-black text-[#10233F]">
          {title}
        </p>
        <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">
          {detail}
        </p>
      </div>
    </div>
  );
}

function LogRow({ log = {} }) {
  const status = normalize(log.status);

  return (
    <article className="min-w-0 rounded-[1.15rem] border-[3px] border-[#C9D7E6] bg-white p-4 shadow-[0_6px_16px_rgba(18,56,101,0.04)] transition hover:border-[#FF5A0A]">
      <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="break-words font-black text-[#10233F]">
            {log.student_name ||
              log.metadata?.title ||
              "Executive Action"}
          </p>
          <p className="mt-1 break-words text-xs font-semibold text-slate-500">
            {formatLabel(log.action_type)} •{" "}
            {formatLabel(log.priority)} •{" "}
            {log.executed_at
              ? new Date(
                  log.executed_at
                ).toLocaleString()
              : "No time"}
          </p>
        </div>

        <StatusBadge
          label={formatLabel(status)}
          tone={
            status === "failed"
              ? "red"
              : status === "duplicate_blocked"
                ? "orange"
                : "green"
          }
        />
      </div>

      {log.error_message ? (
        <p className="mt-2 break-words text-xs font-semibold leading-5 text-red-700">
          {log.error_message}
        </p>
      ) : null}
    </article>
  );
}

function StudentRow({
  item = {},
  mode = "critical",
}) {
  if (mode === "failed") {
    return <LogRow log={item} />;
  }

  return (
    <article className="min-w-0 rounded-[1.15rem] border-[3px] border-[#C9D7E6] bg-white p-4 shadow-[0_6px_16px_rgba(18,56,101,0.04)] transition hover:border-[#FF5A0A]">
      <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="break-words font-black text-[#10233F]">
            {getStudentName(item)}
          </p>
          <p className="mt-1 break-words text-xs font-semibold text-slate-500">
            {formatLabel(getJourneyStage(item))} •{" "}
            {item.executive_category || "Standard"}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <StatusBadge
            label={`Risk ${number(item.risk_score)}`}
            tone={
              number(item.risk_score) >= 85
                ? "red"
                : "navy"
            }
          />
          <StatusBadge
            label={`Opp ${number(
              item.opportunity_score
            )}`}
            tone={
              number(item.opportunity_score) >= 80
                ? "green"
                : "navy"
            }
          />
        </div>
      </div>
    </article>
  );
}

function IssueRow({ issue = {} }) {
  return (
    <article className="min-w-0 rounded-[1.15rem] border-[3px] border-red-300 bg-red-50 p-4 shadow-[0_6px_16px_rgba(18,56,101,0.04)]">
      <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="break-words font-black text-[#10233F]">
            {issue.title || "Workflow Issue"}
          </p>
          <p className="mt-1 break-words text-xs font-semibold text-slate-500">
            {issue.student_name || "Unknown Student"} •{" "}
            {formatLabel(issue.stage)} •{" "}
            {formatLabel(issue.issue_type)}
          </p>
          <p className="mt-2 break-words text-xs font-semibold leading-5 text-slate-600">
            {issue.recommendation || issue.description}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <StatusBadge
            label={formatLabel(issue.severity)}
            tone={
              issue.severity === "critical"
                ? "red"
                : "orange"
            }
          />
          {issue.blocking ? (
            <StatusBadge label="Blocking" tone="red" />
          ) : null}
        </div>
      </div>
    </article>
  );
}

function RecoveryRow({
  title,
  value,
  detail,
  tone = "default",
}) {
  return (
    <article
      className={`min-w-0 rounded-[1.15rem] border-[3px] p-4 shadow-[0_6px_16px_rgba(18,56,101,0.04)] ${getToneStyle(
        tone
      )}`}
    >
      <div className="flex min-w-0 items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="break-words font-black text-[#10233F]">
            {title}
          </p>
          <p className="mt-1 break-words text-xs font-semibold leading-5 text-slate-600">
            {detail}
          </p>
        </div>
        <p className="shrink-0 text-2xl font-black text-[#10233F]">
          {value}
        </p>
      </div>
    </article>
  );
}

function StatusBadge({ label, tone = "navy" }) {
  return (
    <span
      className={`w-fit shrink-0 rounded-full border-2 px-3 py-1 text-[9px] font-black uppercase tracking-[0.08em] ${getBadgeStyle(
        tone
      )}`}
    >
      {label}
    </span>
  );
}

function EmptyState({ text }) {
  return (
    <div className="rounded-[1.15rem] border-[3px] border-dashed border-[#FF5A0A] bg-white p-5 text-sm font-semibold text-slate-500">
      {text}
    </div>
  );
}

function getToneStyle(tone = "default") {
  if (tone === "red") {
    return "border-red-400 bg-red-50";
  }

  if (tone === "green") {
    return "border-emerald-400 bg-emerald-50";
  }

  if (tone === "navy") {
    return "border-[#123865] bg-[#F2F7FF]";
  }

  if (tone === "orange") {
    return "border-[#FF5A0A] bg-[#FFF4E8]";
  }

  if (tone === "yellow") {
    return "border-amber-400 bg-amber-50";
  }

  return "border-[#C9D7E6] bg-white";
}

function getBadgeStyle(tone = "navy") {
  if (tone === "red") {
    return "border-red-300 bg-red-50 text-red-700";
  }

  if (tone === "green") {
    return "border-emerald-300 bg-emerald-50 text-emerald-700";
  }

  if (tone === "orange") {
    return "border-[#FF5A0A] bg-[#FFF4E8] text-orange-800";
  }

  return "border-[#123865] bg-[#F2F7FF] text-[#123865]";
}

export default ExecutiveOperationsCenter;
