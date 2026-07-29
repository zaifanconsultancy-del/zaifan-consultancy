import { useEffect, useMemo, useState } from "react";
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

  return (
    <div className="space-y-5" aria-busy={executing || logsLoading}>
      <div className="rounded-[2rem] border-[3px] border-[#E9802D]/45 bg-[#FFFDF8] p-6 shadow-[0_20px_55px_rgba(23,36,61,0.08)]">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.25em] text-[#B84F0E]">Executive Operations Center V4</p>
            <h2 className="mt-2 text-3xl font-black text-[#17243D]">Verification + Recovery Automation Command Layer</h2>
            <p className="mt-2 max-w-5xl text-sm leading-6 text-[#667085]">
              Batch execution, broken workflow scanning, CAS/Visa/Payment/Portal recovery queues, approval pressure, duplicate protection, and production-hardening visibility for Student OS.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={loadLogs}
              disabled={executing || logsLoading}
              className="rounded-full border border-[#243A60]/18 bg-white px-5 py-2 text-sm font-bold text-[#596579] transition hover:border-[#E9802D]/40 hover:text-[#B84F0E] disabled:opacity-50"
            >
              {logsLoading ? "Refreshing..." : "Refresh Queue"}
            </button>
            <button
              type="button"
              onClick={() => executeBulk("recovery")}
              disabled={executing || !recoveryModel.recovery.totalActions}
              className="rounded-full border border-[#E9802D]/40 bg-[#FFF1E3] px-5 py-2 text-sm font-black text-[#B84F0E] transition hover:bg-[#D96C1F] hover:text-white disabled:opacity-50"
            >
              {activeExecution === "recovery" ? "Processing Recovery..." : "Execute Recovery"}
            </button>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Students" value={analytics.totalStudents} />
        <MetricCard label="Critical Queue" value={analytics.criticalStudents} tone="red" />
        <MetricCard label="Executive Queue" value={analytics.executiveStudents} tone="navy" />
        <MetricCard label="Conversion Ready" value={analytics.conversionReady} tone="green" />
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Broken Workflows" value={recoveryModel.scanner.totalIssues} tone={recoveryModel.scanner.critical ? "red" : "navy"} />
        <MetricCard label="Critical Recovery" value={recoveryModel.scanner.critical} tone="red" />
        <MetricCard label="Recovery Actions" value={recoveryModel.recovery.totalActions} tone="orange" />
        <MetricCard label="Broken Stages" value={recoveryModel.scanner.brokenStages} tone="navy" />
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Approval Pressure" value={analytics.approvalRequired} tone="orange" />
        <MetricCard label="Failed Actions" value={analytics.failedActions} tone="red" />
        <MetricCard label="Queue Pressure" value={queueHealth.queuePressure} tone="navy" />
        <MetricCard label="Success Rate" value={`${queueHealth.successRate || executionAnalytics.successRate || 0}%`} tone="green" />
      </div>

      {message ? (
        <div className="rounded-[1.5rem] border border-[#E9802D]/40 bg-[#FFF1E3] p-4 text-sm font-bold text-[#B84F0E]">
          {message}
        </div>
      ) : null}

      {logsError || recoveryModel.error ? (
        <div className="rounded-[1.5rem] border border-[#C2413B]/30 bg-[#FFF0EE] p-4 text-sm font-bold text-[#A8342F]">
          {logsError || recoveryModel.error}
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <ActionButton title="Execute Critical Queue" description="Create immediate action tasks for critical-risk students." onClick={() => executeBulk("critical")} busy={executing} active={activeExecution === "critical"} tone="red" />
        <ActionButton title="Execute Executive Queue" description="Run executive-priority student movement actions." onClick={() => executeBulk("executive")} busy={executing} active={activeExecution === "executive"} tone="navy" />
        <ActionButton title="Execute Conversion Queue" description="Execute conversion-ready calls, reminders, and tasks." onClick={() => executeBulk("conversion")} busy={executing} active={activeExecution === "conversion"} tone="green" />
        <ActionButton title="Retry Failed Actions" description="Rebuild and retry failed automation items from logs." onClick={() => executeBulk("retry")} busy={executing} active={activeExecution === "retry"} tone="orange" />
        <ActionButton title="Approve + Execute Batch" description="Run the approval-selected batch through the executor after reviewing the queue preview." onClick={() => executeBulk("approve")} busy={executing} active={activeExecution === "approve"} tone="navy" />
        <ActionButton title="Execute Recovery Workflows" description="Run generated workflow recovery actions from CAS, Visa, Payment and Portal queues." onClick={() => executeBulk("recovery")} busy={executing} active={activeExecution === "recovery"} unavailable={!recoveryModel.recovery.totalActions} tone="red" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <div className="rounded-[1.75rem] border-2 border-[#C2413B]/30 bg-[#FFF7F5] p-5">
          <SectionHeader eyebrow="Broken Workflow Scanner" title="Production-hardening scan" description="Detects broken journey records, missing CAS/Visa/Payment/Portal links, sync failures, timeline gaps, and stale execution risk." />
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <SmallMetric label="Health" value={formatLabel(recoveryModel.scanner.health_status)} />
            <SmallMetric label="Scanned" value={recoveryModel.scanner.scannedStudents} />
            <SmallMetric label="Critical" value={recoveryModel.scanner.critical} />
            <SmallMetric label="High" value={recoveryModel.scanner.high} />
            <SmallMetric label="Medium" value={recoveryModel.scanner.medium} />
            <SmallMetric label="Actions" value={recoveryModel.recovery.totalActions} />
          </div>
        </div>

        <div className="rounded-[1.75rem] border-2 border-[#17446F]/25 bg-[#F5F8FC] p-5">
          <SectionHeader eyebrow="Recovery Queues" title="CAS / Visa / Payment / Portal" description="Generated from the scanner and ready for executive approval/execution." />
          <div className="mt-4 flex flex-wrap gap-2">
            {["all", "cas", "visa", "payment", "portal"].map((queue) => (
              <button
                key={queue}
                type="button"
                onClick={() => setActiveRecoveryQueue(queue)}
                className={`rounded-full px-4 py-2 text-xs font-black uppercase tracking-[0.14em] transition ${activeRecoveryQueue === queue ? "bg-[#E9802D] text-white" : "border border-[#243A60]/18 bg-white text-[#7A8392] hover:border-[#E9802D]/40 hover:text-[#B84F0E]"}`}
              >
                {formatLabel(queue)}
              </button>
            ))}
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <SmallMetric label="CAS" value={recoveryModel.recovery.casQueue?.length || 0} />
            <SmallMetric label="Visa" value={recoveryModel.recovery.visaQueue?.length || 0} />
            <SmallMetric label="Payment" value={recoveryModel.recovery.paymentQueue?.length || 0} />
            <SmallMetric label="Portal" value={recoveryModel.recovery.portalQueue?.length || 0} />
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-[1.75rem] border border-[#243A60]/18 bg-white p-5">
          <SectionHeader eyebrow="Queue Health" title="Automation operating condition" description="Live pressure from pending, failed, duplicate-blocked, and completed execution logs." />
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <SmallMetric label="Pending" value={queueHealth.pendingCount} />
            <SmallMetric label="Failed" value={queueHealth.failedCount} />
            <SmallMetric label="Completed" value={queueHealth.completedCount} />
            <SmallMetric label="Duplicates" value={queueHealth.duplicateBlockedCount} />
            <SmallMetric label="Throughput" value={executionAnalytics.total} />
            <SmallMetric label="Approval SLA" value={queueHealth.approvalSlaLabel || "Healthy"} />
          </div>
        </div>

        <div className="rounded-[1.75rem] border-2 border-[#243A60]/20 bg-[#FFFDF8] p-5 shadow-[0_12px_32px_rgba(23,36,61,0.05)]">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <SectionHeader eyebrow="Batch Execution History" title="Recent automation execution feed" description="Latest completion, failure, and duplicate-protection events." />
            <button
              type="button"
              onClick={() => setShowExecutionHistory((value) => !value)}
              className="shrink-0 rounded-xl border-2 border-[#243A60]/20 bg-white px-3 py-2 text-xs font-black text-[#17243D] transition hover:border-[#E9802D]/55 hover:text-[#B84F0E]"
              aria-expanded={showExecutionHistory}
            >
              {showExecutionHistory ? "Hide history" : `Show history (${logs.length})`}
            </button>
          </div>
          {showExecutionHistory ? (
            <div className="mt-5 max-h-[34rem] space-y-3 overflow-y-auto pr-1">
              {logs.slice(0, 12).map((log, index) => (
                <LogRow key={log.id || `${log.template_key}-${index}`} log={log} />
              ))}
              {!logs.length ? <EmptyState text="No execution logs found yet." /> : null}
            </div>
          ) : (
            <div className="mt-4 rounded-xl border border-dashed border-[#243A60]/20 bg-white/70 px-4 py-3 text-xs font-bold text-[#667085]">
              History is collapsed to keep the command center compact. Open it when you need audit detail.
            </div>
          )}
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-[1.75rem] border-2 border-[#17446F]/25 bg-[#F5F8FC] p-5">
          <SectionHeader eyebrow="Selected Queue" title={`${activeMode === "recovery" ? formatLabel(activeRecoveryQueue) : formatLabel(activeMode)} queue preview`} description="Switch between queues before executing a batch command." />
          <div className="mt-4 flex flex-wrap gap-2">
            {["critical", "executive", "conversion", "approval", "failed", "recovery"].map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setActiveMode(mode)}
                className={`rounded-full px-4 py-2 text-xs font-black uppercase tracking-[0.14em] transition ${activeMode === mode ? "bg-[#E9802D] text-white" : "border border-[#243A60]/18 bg-white text-[#7A8392] hover:border-[#E9802D]/40 hover:text-[#B84F0E]"}`}
              >
                {formatLabel(mode)}
              </button>
            ))}
          </div>
          <div className="mt-5 space-y-3">
            {(activeMode === "recovery" ? selectedRecoveryQueue : selectedStudents).slice(0, 10).map((item, index) => (
              activeMode === "recovery" ? (
                <IssueRow key={item.id || index} issue={item} />
              ) : (
                <StudentRow key={`${item.student_id || item.id || item.template_key || index}-${index}`} item={item} mode={activeMode} />
              )
            ))}
            {!(activeMode === "recovery" ? selectedRecoveryQueue : selectedStudents).length ? <EmptyState text="No students/logs/issues in this queue right now." /> : null}
          </div>
        </div>

        <div className="rounded-[1.75rem] border-2 border-[#C2413B]/30 bg-[#FFF7F5] p-5">
          <SectionHeader eyebrow="Recovery Center" title="Failure prediction and recovery" description="Uses failed logs, duplicate blocks, scanner issues, risk pressure, and stale queue data to show where automation needs attention." />
          <div className="mt-5 space-y-3">
            <RecoveryRow title="Broken workflow issues" value={recoveryModel.scanner.totalIssues} detail="Scanner output from student journey data, verification snapshot, and operating records." tone="red" />
            <RecoveryRow title="Generated actions" value={recoveryModel.recovery.totalActions} detail="Automatic recovery workflows ready for approval/execution." tone="navy" />
            <RecoveryRow title="Failed action retry" value={analytics.failedActions} detail="Retry only uses logs with saved original templates. Older logs without templates are skipped safely." tone="red" />
            <RecoveryRow title="Duplicate protection" value={queueHealth.duplicateBlockedCount} detail="Blocks repeated task/reminder/draft creation for the same student action key." tone="navy" />
            <RecoveryRow title="Critical pressure" value={analytics.criticalStudents} detail="High-risk students that should be cleared before normal queue execution." tone="red" />
            <RecoveryRow title="Queue aging" value={queueHealth.oldestPendingAgeLabel || "Clear"} detail="Oldest pending/approval item based on available created/executed timestamps." tone="orange" />
          </div>
        </div>
      </div>

      <div className="rounded-[1.75rem] border border-[#243A60]/18 bg-white p-5">
        <SectionHeader eyebrow="Workflow Failure Heatmap" title="Stage-level recovery pressure" description="Broken stage counts from the generated workflow report." />
        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {Object.entries(recoveryModel.report.heatmap || {}).map(([stage, count]) => (
            <SmallMetric key={stage} label={formatLabel(stage)} value={count} />
          ))}
          {!Object.keys(recoveryModel.report.heatmap || {}).length ? <EmptyState text="No broken stages detected from available data." /> : null}
        </div>
      </div>

      {result ? (
        <div className="rounded-[1.75rem] border border-[#243A60]/18 bg-white p-5">
          <SectionHeader eyebrow="Last Batch Result" title="Execution summary" description="Compact result from the last bulk operation." />
          <div className="mt-4 grid gap-3 md:grid-cols-4">
            <SmallMetric label="Total" value={result.total || 0} />
            <SmallMetric label="Completed" value={result.successful || 0} />
            <SmallMetric label="Failed" value={result.failed || 0} />
            <SmallMetric label="Duplicate Blocked" value={result.duplicateBlocked || 0} />
          </div>
        </div>
      ) : null}
    </div>
  );
}

function MetricCard({ label, value, tone = "default" }) {
  return (
    <div className={`min-w-0 rounded-[1.4rem] border-2 p-4 shadow-[0_8px_22px_rgba(23,36,61,0.05)] ${getToneStyle(tone)}`}>
      <p className="break-words text-[10px] font-black uppercase tracking-[0.14em] text-[#53657D]">{label}</p>
      <p className="mt-2 break-words text-3xl font-black leading-none text-[#10233F]">{value}</p>
    </div>
  );
}

function SmallMetric({ label, value }) {
  return (
    <div className="min-w-0 rounded-[1.2rem] border-2 border-[#C8D5E4] bg-[#F7FAFD] p-4">
      <p className="break-words text-[10px] font-black uppercase tracking-[0.14em] text-[#53657D]">{label}</p>
      <p className="mt-2 break-words text-2xl font-black leading-tight text-[#10233F]">{value}</p>
    </div>
  );
}

function ActionButton({ title, description, onClick, busy = false, active = false, unavailable = false, tone = "default" }) {
  const disabled = busy || unavailable;
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-busy={active}
      className={`group min-h-[142px] rounded-[1.45rem] border-2 p-5 text-left shadow-[0_10px_28px_rgba(23,36,61,0.055)] transition duration-200 ${
        disabled ? "cursor-not-allowed opacity-55" : "cursor-pointer hover:-translate-y-1 hover:shadow-[0_16px_34px_rgba(23,36,61,0.11)]"
      } ${getToneStyle(tone)}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[9px] font-black uppercase tracking-[0.18em] text-[#B84F0E]">Executable Command</p>
          <h3 className="mt-2 break-words text-base font-black leading-5 text-[#10233F]">
            {active ? "Processing this command..." : unavailable ? "No actions available" : title}
          </h3>
        </div>
        <span className={`shrink-0 rounded-full border px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.12em] ${
          active ? "border-[#E9802D] bg-[#E9802D] text-white" :
          unavailable ? "border-[#C8D5E4] bg-white text-[#667085]" :
          "border-[#17446F]/25 bg-white/80 text-[#17446F]"
        }`}>
          {active ? "Running" : unavailable ? "Empty" : "Run"}
        </span>
      </div>
      <p className="mt-3 break-words text-sm font-semibold leading-5 text-[#596A80]">{description}</p>
    </button>
  );
}

function SectionHeader({ eyebrow, title, description }) {
  return (
    <div>
      <p className="text-xs font-black uppercase tracking-[0.22em] text-[#B84F0E]/80">{eyebrow}</p>
      <h3 className="mt-1 text-xl font-black text-[#17243D]">{title}</h3>
      {description ? <p className="mt-1 text-sm leading-6 text-[#7A8392]">{description}</p> : null}
    </div>
  );
}

function LogRow({ log = {} }) {
  const status = normalize(log.status);
  return (
    <div className="rounded-2xl border border-[#243A60]/18 bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-black text-[#17243D]">{log.student_name || log.metadata?.title || "Executive Action"}</p>
          <p className="mt-1 text-xs text-[#7A8392]">{formatLabel(log.action_type)} • {formatLabel(log.priority)} • {log.executed_at ? new Date(log.executed_at).toLocaleString() : "No time"}</p>
        </div>
        <span className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] ${status === "failed" ? "border-[#C2413B]/30 bg-[#FFF0EE] text-[#A8342F]" : status === "duplicate_blocked" ? "border-[#E9802D]/40 bg-[#FFF1E3] text-[#B84F0E]" : "border-[#E9802D]/30 bg-[#FFF1E3] text-[#B84F0E]"}`}>
          {formatLabel(status)}
        </span>
      </div>
      {log.error_message ? <p className="mt-2 text-xs leading-5 text-[#A8342F]">{log.error_message}</p> : null}
    </div>
  );
}

function StudentRow({ item = {}, mode = "critical" }) {
  if (mode === "failed") return <LogRow log={item} />;

  return (
    <div className="rounded-2xl border border-[#243A60]/18 bg-white p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="truncate font-black text-[#17243D]">{getStudentName(item)}</p>
          <p className="mt-1 text-xs text-[#7A8392]">{formatLabel(getJourneyStage(item))} • {item.executive_category || "Standard"}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge label={`Risk ${number(item.risk_score)}`} tone={number(item.risk_score) >= 85 ? "red" : "default"} />
          <Badge label={`Opp ${number(item.opportunity_score)}`} tone={number(item.opportunity_score) >= 80 ? "green" : "default"} />
        </div>
      </div>
    </div>
  );
}

function IssueRow({ issue = {} }) {
  return (
    <div className="rounded-2xl border-2 border-[#C2413B]/30 bg-[#FFF7F5] p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="truncate font-black text-[#17243D]">{issue.title || "Workflow Issue"}</p>
          <p className="mt-1 text-xs text-[#7A8392]">{issue.student_name || "Unknown Student"} • {formatLabel(issue.stage)} • {formatLabel(issue.issue_type)}</p>
          <p className="mt-2 text-xs leading-5 text-[#7A8392]">{issue.recommendation || issue.description}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge label={formatLabel(issue.severity)} tone={issue.severity === "critical" ? "red" : "default"} />
          {issue.blocking ? <Badge label="Blocking" tone="red" /> : null}
        </div>
      </div>
    </div>
  );
}

function RecoveryRow({ title, value, detail, tone = "default" }) {
  return (
    <div className={`rounded-2xl border p-4 ${getToneStyle(tone)}`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-black text-[#17243D]">{title}</p>
          <p className="mt-1 text-xs leading-5 text-[#7A8392]">{detail}</p>
        </div>
        <p className="text-2xl font-black text-[#17243D]">{value}</p>
      </div>
    </div>
  );
}

function Badge({ label, tone = "default" }) {
  return <span className={`rounded-full border px-3 py-1 text-xs font-black ${getBadgeStyle(tone)}`}>{label}</span>;
}

function EmptyState({ text }) {
  return <div className="rounded-2xl border border-dashed border-[#243A60]/18 bg-white p-5 text-sm text-[#8992A1]">{text}</div>;
}

function getToneStyle(tone = "default") {
  if (tone === "red") return "border-[#FF8F94] bg-[#FFF4F3]";
  if (tone === "green") return "border-[#55D9AA] bg-[#EEFBF5]";
  if (tone === "navy") return "border-[#17446F] bg-[#EEF4FA]";
  if (tone === "orange") return "border-[#FF9A4A] bg-[#FFF5EC]";
  return "border-[#C8D5E4] bg-[#F8FAFD]";
}

function getBadgeStyle(tone = "default") {
  if (tone === "red") return "border-[#C2413B]/30 bg-[#FFF0EE] text-[#A8342F]";
  if (tone === "green") return "border-[#E9802D]/30 bg-[#FFF1E3] text-[#B84F0E]";
  return "border-[#243A60]/18 bg-white text-[#667085]";
}

export default ExecutiveOperationsCenter;