import { useMemo, useState } from "react";
import { buildExecutiveRecommendations } from "../../lib/executiveRecommendations";
import { buildExecutiveActionTemplate } from "../../lib/executiveActionTemplates";
import {
  executeExecutiveActionTemplate,
  executeBulkExecutiveActions,
  executeCriticalExecutiveActions,
  executeExecutivePriorityActions,
  executeConversionExecutiveActions,
  retryFailedExecutiveActions,
  buildQueueHealthAnalytics,
  buildBulkExecutionSummary,
} from "../../lib/executiveActionExecutor";

const MAX_QUEUE_ITEMS = 75;
const QUEUE_EXECUTION_TIMEOUT_MS = 9000;

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

function getStudentName(score = {}) {
  return score.student_name || score.full_name || score.name || "Unknown Student";
}

function getStudentId(score = {}) {
  return String(score.student_id || score.id || "");
}

function getStudentType(score = {}) {
  return score.student_type || score.__leadType || score.type || "student";
}

function getStudentKey(score = {}) {
  return `${getStudentId(score) || getStudentName(score)}-${getStudentType(score)}`;
}

function getJourneyStage(score = {}, template = {}) {
  const directStage =
    normalize(score.journey_stage) ||
    normalize(score?.diagnostics?.journey_stage) ||
    normalize(template?.payload?.journey_stage);

  if (directStage) return directStage;

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
  if (["started", "draft", "in_progress"].includes(applicationStatus)) return "application_started";

  return "not_started";
}

function getPriorityRank(priority = "") {
  const clean = normalize(priority);
  if (clean === "critical") return 7;
  if (clean === "urgent") return 6;
  if (clean === "executive") return 5;
  if (clean === "high") return 4;
  if (clean === "medium") return 3;
  if (clean === "low") return 2;
  return 1;
}

function getActionRank(actionType = "") {
  const clean = normalize(actionType);
  if (clean === "create_task") return 5;
  if (clean === "schedule_call") return 4;
  if (clean === "create_reminder") return 3;
  if (clean === "send_email") return 2;
  if (clean === "send_whatsapp") return 2;
  return 1;
}

function approvalRequired(recommendation = {}, template = {}) {
  const priority = normalize(recommendation.priority);
  const actionType = normalize(template.actionType);

  return (
    priority === "critical" ||
    priority === "urgent" ||
    priority === "executive" ||
    actionType === "send_email" ||
    actionType === "send_whatsapp" ||
    template?.payload?.approval_required === true
  );
}

function getActionReason(score = {}, recommendation = {}, template = {}) {
  const category = score.executive_category || "Standard";
  const summary =
    score.summary ||
    recommendation.description ||
    template.description ||
    "Executive AI detected a student journey signal.";
  const action = template.actionType || recommendation.action || "review";

  return `${category}: ${summary} Recommended action: ${formatLabel(action)}.`;
}

function buildQueueKey(score = {}, recommendation = {}, template = {}) {
  return [
    getStudentKey(score),
    normalize(recommendation.type || "recommendation"),
    normalize(template.actionType || recommendation.action || "action"),
    normalize(template?.payload?.title || recommendation.title || ""),
  ].join("-");
}

function buildDuplicateKey(score = {}, recommendation = {}, template = {}) {
  return [
    getStudentKey(score),
    normalize(recommendation.type || "recommendation"),
    normalize(template.actionType || recommendation.action || "action"),
    normalize(template?.payload?.title || recommendation.title || ""),
  ].join("-");
}

export function buildExecutiveActionItems(scores = [], options = {}) {
  const maxItems = options.maxItems || MAX_QUEUE_ITEMS;

  const rawItems = (scores || []).flatMap((score) => {
    const recommendations = buildExecutiveRecommendations(score);

    return recommendations
      .filter((recommendation) => normalize(recommendation.action) !== "none")
      .map((recommendation) => {
        const template = buildExecutiveActionTemplate(score, recommendation);
        const studentStage = getJourneyStage(score, template);
        const priorityRank = getPriorityRank(recommendation.priority);
        const actionRank = getActionRank(template.actionType);
        const riskScore = number(score.risk_score);
        const opportunityScore = number(score.opportunity_score);
        const overdueTasks = number(score?.diagnostics?.overdue_tasks_count ?? score.overdue_tasks_count);
        const documentGap = 100 - number(score?.diagnostics?.document_readiness_percent ?? score.document_readiness_percent, 100);
        const staleDays = number(score?.diagnostics?.days_since_updated ?? score.days_since_updated);
        const impactScore =
          riskScore +
          opportunityScore +
          priorityRank * 12 +
          actionRank * 5 +
          Math.min(30, overdueTasks * 4) +
          Math.min(25, Math.max(0, documentGap) / 2) +
          Math.min(25, staleDays);

        return {
          key: buildQueueKey(score, recommendation, template),
          duplicateKey: buildDuplicateKey(score, recommendation, template),
          score,
          recommendation,
          template,
          studentStage,
          reason: getActionReason(score, recommendation, template),
          requiresApproval: approvalRequired(recommendation, template),
          priorityRank,
          actionRank,
          impactScore: Math.round(impactScore),
          createdAt: template?.payload?.generated_at || new Date().toISOString(),
          queueStatus: approvalRequired(recommendation, template) ? "approval_required" : "ready",
        };
      });
  });

  const deduped = new Map();

  rawItems.forEach((item) => {
    const existing = deduped.get(item.duplicateKey);

    if (!existing) {
      deduped.set(item.duplicateKey, item);
      return;
    }

    const existingIsAppointment = normalize(getStudentType(existing.score)) === "appointment";
    const currentIsAppointment = normalize(getStudentType(item.score)) === "appointment";

    if (!existingIsAppointment && currentIsAppointment) {
      deduped.set(item.duplicateKey, item);
      return;
    }

    if (item.impactScore > existing.impactScore) {
      deduped.set(item.duplicateKey, item);
    }
  });

  return [...deduped.values()]
    .sort((a, b) => {
      if (b.priorityRank !== a.priorityRank) return b.priorityRank - a.priorityRank;
      if (b.impactScore !== a.impactScore) return b.impactScore - a.impactScore;
      return b.actionRank - a.actionRank;
    })
    .slice(0, maxItems);
}

function buildQueueAnalytics(actionItems = [], executedKeys = {}, approvedKeys = {}, rejectedKeys = {}, failedKeys = {}) {
  const analytics = {
    total: actionItems.length,
    critical: 0,
    urgent: 0,
    executive: 0,
    high: 0,
    medium: 0,
    low: 0,
    approvalRequired: 0,
    approved: 0,
    rejected: 0,
    ready: 0,
    executed: 0,
    pending: 0,
    failed: 0,
    tasks: 0,
    reminders: 0,
    calls: 0,
    emailDrafts: 0,
    whatsappDrafts: 0,
    highImpact: 0,
  };

  actionItems.forEach((item) => {
    const priority = normalize(item.recommendation.priority);
    const actionType = normalize(item.template.actionType);

    if (analytics[priority] !== undefined) analytics[priority] += 1;
    if (item.impactScore >= 120) analytics.highImpact += 1;

    if (item.requiresApproval) analytics.approvalRequired += 1;
    else analytics.ready += 1;

    if (approvedKeys[item.key]) analytics.approved += 1;
    if (rejectedKeys[item.key]) analytics.rejected += 1;
    if (executedKeys[item.key]) analytics.executed += 1;
    if (failedKeys[item.key]) analytics.failed += 1;

    if (!approvedKeys[item.key] && !rejectedKeys[item.key] && !executedKeys[item.key] && !failedKeys[item.key]) {
      analytics.pending += 1;
    }

    if (actionType === "create_task") analytics.tasks += 1;
    if (actionType === "create_reminder") analytics.reminders += 1;
    if (actionType === "schedule_call") analytics.calls += 1;
    if (actionType === "send_email") analytics.emailDrafts += 1;
    if (actionType === "send_whatsapp") analytics.whatsappDrafts += 1;
  });

  analytics.approvalSla = analytics.approvalRequired
    ? Math.round((analytics.approved / analytics.approvalRequired) * 100)
    : 100;

  analytics.executionRate = analytics.total
    ? Math.round((analytics.executed / analytics.total) * 100)
    : 0;

  analytics.failureRate = analytics.executed + analytics.failed
    ? Math.round((analytics.failed / (analytics.executed + analytics.failed)) * 100)
    : 0;

  return analytics;
}

function buildQueueAgingAnalytics(actionItems = []) {
  const now = Date.now();
  const rows = (actionItems || []).map((item) => {
    const created = new Date(item.createdAt || item.template?.payload?.generated_at || Date.now()).getTime();
    const ageHours = Math.max(0, Math.round((now - created) / (1000 * 60 * 60)));
    return { ...item, ageHours };
  });

  return {
    fresh: rows.filter((item) => item.ageHours <= 12).length,
    aging: rows.filter((item) => item.ageHours > 12 && item.ageHours <= 48).length,
    stale: rows.filter((item) => item.ageHours > 48).length,
    oldestAgeHours: rows.length ? Math.max(...rows.map((item) => item.ageHours)) : 0,
    oldestItem: rows.sort((a, b) => b.ageHours - a.ageHours)[0] || null,
  };
}

function buildApprovalSLAAnalytics(actionItems = [], approvedKeys = {}, rejectedKeys = {}) {
  const approvalRows = actionItems.filter((item) => item.requiresApproval);
  const approved = approvalRows.filter((item) => approvedKeys[item.key]);
  const rejected = approvalRows.filter((item) => rejectedKeys[item.key]);
  const waiting = approvalRows.filter((item) => !approvedKeys[item.key] && !rejectedKeys[item.key]);

  return {
    total: approvalRows.length,
    approved: approved.length,
    rejected: rejected.length,
    waiting: waiting.length,
    approvalRate: approvalRows.length ? Math.round((approved.length / approvalRows.length) * 100) : 100,
    rejectionRate: approvalRows.length ? Math.round((rejected.length / approvalRows.length) * 100) : 0,
    waitingRate: approvalRows.length ? Math.round((waiting.length / approvalRows.length) * 100) : 0,
  };
}

function buildThroughputAnalytics(batchHistory = []) {
  const rows = Array.isArray(batchHistory) ? batchHistory : [];
  const totalExecuted = rows.reduce((sum, batch) => sum + number(batch.summary?.successful), 0);
  const totalFailed = rows.reduce((sum, batch) => sum + number(batch.summary?.failed), 0);
  const totalDuplicate = rows.reduce((sum, batch) => sum + number(batch.summary?.duplicateBlocked), 0);

  return {
    batches: rows.length,
    totalExecuted,
    totalFailed,
    totalDuplicate,
    successRate: totalExecuted + totalFailed
      ? Math.round((totalExecuted / (totalExecuted + totalFailed)) * 100)
      : 0,
    lastBatch: rows[0] || null,
  };
}

async function withQueueTimeout(promise, ms = QUEUE_EXECUTION_TIMEOUT_MS) {
  let timeoutId;

  const timeout = new Promise((resolve) => {
    timeoutId = setTimeout(() => {
      resolve({
        data: null,
        error: new Error("Action is taking too long. It may still finish in Supabase. Refresh and check logs/tasks."),
        timedOut: true,
      });
    }, ms);
  });

  try {
    return await Promise.race([promise, timeout]);
  } finally {
    clearTimeout(timeoutId);
  }
}

function isDuplicateResult(result = {}) {
  const message = result?.error?.message || "";
  return result?.duplicate === true || message.toLowerCase().includes("duplicate protection");
}

function mapItemsToTemplates(items = []) {
  return items.map((item) => item.template).filter(Boolean);
}

function ExecutiveActionQueue({ scores = [], adminProfile = null, onActionExecuted = () => {} }) {
  const [executingKeys, setExecutingKeys] = useState({});
  const [executedKeys, setExecutedKeys] = useState({});
  const [approvedKeys, setApprovedKeys] = useState({});
  const [rejectedKeys, setRejectedKeys] = useState({});
  const [failedKeys, setFailedKeys] = useState({});
  const [errors, setErrors] = useState({});
  const [filter, setFilter] = useState("all");
  const [bulkExecuting, setBulkExecuting] = useState("");
  const [batchHistory, setBatchHistory] = useState([]);

  const actionItems = useMemo(() => buildExecutiveActionItems(scores), [scores]);

  const analytics = useMemo(
    () => buildQueueAnalytics(actionItems, executedKeys, approvedKeys, rejectedKeys, failedKeys),
    [actionItems, executedKeys, approvedKeys, rejectedKeys, failedKeys]
  );

  const aging = useMemo(() => buildQueueAgingAnalytics(actionItems), [actionItems]);
  const approvalSla = useMemo(
    () => buildApprovalSLAAnalytics(actionItems, approvedKeys, rejectedKeys),
    [actionItems, approvedKeys, rejectedKeys]
  );
  const throughput = useMemo(() => buildThroughputAnalytics(batchHistory), [batchHistory]);
  const queueHealth = useMemo(
    () =>
      buildQueueHealthAnalytics({
        queue: actionItems.map((item) => ({
          ...item,
          status: executedKeys[item.key]
            ? "executed"
            : failedKeys[item.key]
            ? "failed"
            : rejectedKeys[item.key]
            ? "rejected"
            : approvedKeys[item.key]
            ? "approved"
            : item.queueStatus,
          approval_status: item.requiresApproval ? "required" : "not_required",
          created_at: item.createdAt,
        })),
        logs: batchHistory.flatMap((batch) => batch.results || []),
      }),
    [actionItems, approvedKeys, rejectedKeys, executedKeys, failedKeys, batchHistory]
  );

  const filteredItems = useMemo(() => {
    if (filter === "all") return actionItems;

    return actionItems.filter((item) => {
      const priority = normalize(item.recommendation.priority);
      const actionType = normalize(item.template.actionType);

      if (filter === "approval") return item.requiresApproval && !approvedKeys[item.key];
      if (filter === "ready") return !item.requiresApproval || approvedKeys[item.key];
      if (filter === "executed") return executedKeys[item.key];
      if (filter === "failed") return failedKeys[item.key];
      if (filter === "critical") return priority === "critical" || priority === "urgent";
      if (filter === "executive") return priority === "executive";
      if (filter === "communication") return ["send_email", "send_whatsapp"].includes(actionType);
      if (filter === "tasks") return ["create_task", "create_reminder", "schedule_call"].includes(actionType);
      if (filter === "high-impact") return item.impactScore >= 120;

      return true;
    });
  }, [actionItems, filter, approvedKeys, executedKeys, failedKeys]);

  function approveAction(item) {
    if (executedKeys[item.key]) return;

    setApprovedKeys((prev) => ({ ...prev, [item.key]: true }));
    setRejectedKeys((prev) => {
      const next = { ...prev };
      delete next[item.key];
      return next;
    });
    setErrors((prev) => ({ ...prev, [item.key]: "" }));
  }

  function rejectAction(item) {
    if (executedKeys[item.key]) return;

    setRejectedKeys((prev) => ({ ...prev, [item.key]: true }));
    setApprovedKeys((prev) => {
      const next = { ...prev };
      delete next[item.key];
      return next;
    });
    setErrors((prev) => ({ ...prev, [item.key]: "" }));
  }

  function handleBulkApprove(scope = "all") {
    const targetItems = getScopedItems(scope);

    setApprovedKeys((prev) => {
      const next = { ...prev };
      targetItems.forEach((item) => {
        if (item.requiresApproval && !executedKeys[item.key] && !rejectedKeys[item.key]) {
          next[item.key] = true;
        }
      });
      return next;
    });

    setRejectedKeys((prev) => {
      const next = { ...prev };
      targetItems.forEach((item) => delete next[item.key]);
      return next;
    });
  }

  function handleBulkReject(scope = "approval") {
    const targetItems = getScopedItems(scope);

    setRejectedKeys((prev) => {
      const next = { ...prev };
      targetItems.forEach((item) => {
        if (!executedKeys[item.key]) next[item.key] = true;
      });
      return next;
    });

    setApprovedKeys((prev) => {
      const next = { ...prev };
      targetItems.forEach((item) => delete next[item.key]);
      return next;
    });
  }

  function getScopedItems(scope = "all") {
    return actionItems.filter((item) => {
      const priority = normalize(item.recommendation.priority);
      const category = normalize(item.score.executive_category || item.template?.payload?.executive_category);
      const opportunity = number(item.score.opportunity_score || item.template?.payload?.opportunity_score);
      const stage = normalize(item.studentStage);

      if (executedKeys[item.key] || rejectedKeys[item.key]) return false;
      if (scope === "critical") return priority === "critical" || priority === "urgent" || number(item.score.risk_score) >= 80;
      if (scope === "executive") return priority === "executive" || category === "executive_priority" || number(item.score.risk_score) >= 85 || opportunity >= 85;
      if (scope === "conversion") return opportunity >= 80 || category === "conversion_ready" || ["offer_accepted", "cas_pending", "cas_issued", "visa_pending"].includes(stage);
      if (scope === "approval") return item.requiresApproval && !approvedKeys[item.key];
      if (scope === "failed") return failedKeys[item.key];
      return true;
    });
  }

  function markBatchResults(items = [], results = {}) {
    const resultRows = Array.isArray(results?.results) ? results.results : [];

    setExecutedKeys((prev) => {
      const next = { ...prev };
      items.forEach((item, index) => {
        const result = resultRows[index];
        if (!result?.error || isDuplicateResult(result)) next[item.key] = true;
      });
      return next;
    });

    setFailedKeys((prev) => {
      const next = { ...prev };
      items.forEach((item, index) => {
        const result = resultRows[index];
        if (result?.error && !isDuplicateResult(result)) next[item.key] = true;
      });
      return next;
    });

    setErrors((prev) => {
      const next = { ...prev };
      items.forEach((item, index) => {
        const result = resultRows[index];
        if (isDuplicateResult(result)) next[item.key] = "Already executed before. Marked as done by duplicate protection.";
        else if (result?.error) next[item.key] = result.error.message || "Bulk execution failed.";
        else next[item.key] = "";
      });
      return next;
    });
  }

  async function runBulkExecution(scope = "all") {
    const targetItems = getScopedItems(scope).filter((item) => !item.requiresApproval || approvedKeys[item.key]);
    const templates = mapItemsToTemplates(targetItems);

    if (!templates.length) return;

    setBulkExecuting(scope);

    try {
      let result;

      if (scope === "critical") {
        result = await executeCriticalExecutiveActions({ templates, adminProfile });
      } else if (scope === "executive") {
        result = await executeExecutivePriorityActions({ templates, adminProfile });
      } else if (scope === "conversion") {
        result = await executeConversionExecutiveActions({ templates, adminProfile });
      } else if (scope === "failed") {
        result = await retryFailedExecutiveActions({ templates, adminProfile });
      } else {
        result = await executeBulkExecutiveActions({ templates, adminProfile });
      }

      const summary = buildBulkExecutionSummary(result);
      markBatchResults(targetItems, result);
      setBatchHistory((prev) => [
        {
          id: `${scope}-${Date.now()}`,
          scope,
          summary,
          results: result?.results || [],
          executedAt: new Date().toISOString(),
        },
        ...prev,
      ].slice(0, 12));
      onActionExecuted({ scope, result, summary });
    } finally {
      setBulkExecuting("");
    }
  }

  async function handleExecute(item) {
    if (!item?.template || executingKeys[item.key] || executedKeys[item.key] || rejectedKeys[item.key]) return;

    if (item.requiresApproval && !approvedKeys[item.key]) {
      setErrors((prev) => ({
        ...prev,
        [item.key]: "Human approval is required before this action can execute.",
      }));
      return;
    }

    setExecutingKeys((prev) => ({ ...prev, [item.key]: true }));
    setErrors((prev) => ({ ...prev, [item.key]: "" }));

    try {
      const result = await withQueueTimeout(
        executeExecutiveActionTemplate({
          template: item.template,
          adminProfile,
        }),
        QUEUE_EXECUTION_TIMEOUT_MS
      );

      if (isDuplicateResult(result)) {
        setExecutedKeys((prev) => ({ ...prev, [item.key]: true }));
        setErrors((prev) => ({
          ...prev,
          [item.key]: "Already executed before. Marked as done by duplicate protection.",
        }));
        onActionExecuted(item);
        return;
      }

      if (result?.error) {
        setFailedKeys((prev) => ({ ...prev, [item.key]: true }));
        setErrors((prev) => ({
          ...prev,
          [item.key]: result.error.message || "Execution failed.",
        }));
        return;
      }

      setExecutedKeys((prev) => ({ ...prev, [item.key]: true }));
      setFailedKeys((prev) => {
        const next = { ...prev };
        delete next[item.key];
        return next;
      });
      setErrors((prev) => ({ ...prev, [item.key]: "" }));
      onActionExecuted(item);
    } catch (err) {
      setFailedKeys((prev) => ({ ...prev, [item.key]: true }));
      setErrors((prev) => ({
        ...prev,
        [item.key]: err.message || "Executive action failed.",
      }));
    } finally {
      setExecutingKeys((prev) => {
        const next = { ...prev };
        delete next[item.key];
        return next;
      });
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-[2rem] border-2 border-[#E9802D]/40 bg-[#FFFDF8] p-5 shadow-[0_20px_55px_rgba(23,36,61,0.08)] sm:p-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.25em] text-[#B84F0E]">
              Executive Action Queue V4
            </p>

            <h2 className="mt-2 text-2xl font-black text-[#17243D]">
              Human-Approved Student OS Decision Queue
            </h2>

            <p className="mt-2 max-w-3xl text-sm leading-6 text-[#667085]">
              Converts Executive AI recommendations into controlled actions with approval,
              duplicate protection, bulk execution, queue health, SLA tracking, recovery,
              and batch history.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Badge label={`${analytics.total} Actions`} />
            <Badge label={`${analytics.critical} Critical`} danger />
            <Badge label={`${analytics.executive} Executive`} gold />
            <Badge label={`${analytics.approvalRequired} Approval`} gold />
            <Badge label={`${analytics.ready} Ready`} success />
            <Badge label={`${analytics.executed} Done`} success />
          </div>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-6">
          <QueueMetric label="Tasks" value={analytics.tasks} />
          <QueueMetric label="Reminders" value={analytics.reminders} />
          <QueueMetric label="Calls" value={analytics.calls} />
          <QueueMetric label="Emails" value={analytics.emailDrafts} />
          <QueueMetric label="WhatsApp" value={analytics.whatsappDrafts} />
          <QueueMetric label="Pending" value={analytics.pending} />
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          <QueueMetric label="Queue Pressure" value={queueHealth.queuePressure || 0} tone="gold" />
          <QueueMetric label="Approval SLA" value={`${approvalSla.approvalRate}%`} tone="green" />
          <QueueMetric label="Oldest Queue" value={`${aging.oldestAgeHours}h`} tone={aging.oldestAgeHours > 48 ? "red" : "default"} />
          <QueueMetric label="Throughput" value={throughput.totalExecuted} tone="green" />
          <QueueMetric label="Failed" value={analytics.failed} tone="red" />
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          <BulkButton label="Approve Critical" onClick={() => handleBulkApprove("critical")} />
          <BulkButton label="Approve Executive" onClick={() => handleBulkApprove("executive")} />
          <BulkButton label="Approve All" onClick={() => handleBulkApprove("all")} />
          <BulkButton label="Execute Critical" onClick={() => runBulkExecution("critical")} loading={bulkExecuting === "critical"} danger />
          <BulkButton label="Execute Executive" onClick={() => runBulkExecution("executive")} loading={bulkExecuting === "executive"} gold />
          <BulkButton label="Execute Conversion" onClick={() => runBulkExecution("conversion")} loading={bulkExecuting === "conversion"} success />
          <BulkButton label="Retry Failed" onClick={() => runBulkExecution("failed")} loading={bulkExecuting === "failed"} />
          <BulkButton label="Reject Waiting" onClick={() => handleBulkReject("approval")} danger />
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          <FilterButton active={filter === "all"} onClick={() => setFilter("all")}>All</FilterButton>
          <FilterButton active={filter === "approval"} onClick={() => setFilter("approval")}>Approval</FilterButton>
          <FilterButton active={filter === "ready"} onClick={() => setFilter("ready")}>Ready</FilterButton>
          <FilterButton active={filter === "critical"} onClick={() => setFilter("critical")}>Critical</FilterButton>
          <FilterButton active={filter === "executive"} onClick={() => setFilter("executive")}>Executive</FilterButton>
          <FilterButton active={filter === "high-impact"} onClick={() => setFilter("high-impact")}>High Impact</FilterButton>
          <FilterButton active={filter === "tasks"} onClick={() => setFilter("tasks")}>Tasks</FilterButton>
          <FilterButton active={filter === "communication"} onClick={() => setFilter("communication")}>Communication</FilterButton>
          <FilterButton active={filter === "failed"} onClick={() => setFilter("failed")}>Failed</FilterButton>
          <FilterButton active={filter === "executed"} onClick={() => setFilter("executed")}>Executed</FilterButton>
        </div>
      </div>

      {batchHistory.length ? (
        <BatchHistoryPanel batchHistory={batchHistory} />
      ) : null}

      <div className="space-y-3">
        {filteredItems.length ? (
          filteredItems.map((item) => (
            <ActionQueueCard
              key={item.key}
              item={item}
              executing={Boolean(executingKeys[item.key])}
              executed={Boolean(executedKeys[item.key])}
              approved={Boolean(approvedKeys[item.key])}
              rejected={Boolean(rejectedKeys[item.key])}
              failed={Boolean(failedKeys[item.key])}
              error={errors[item.key]}
              onApprove={() => approveAction(item)}
              onReject={() => rejectAction(item)}
              onExecute={() => handleExecute(item)}
            />
          ))
        ) : (
          <div className="rounded-2xl border border-[#E9802D]/28 bg-[#FFF1E3] p-5">
            <p className="font-semibold text-[#B84F0E]">
              No executive actions found for this filter.
            </p>
            <p className="mt-2 text-sm text-[#7A8392]">
              Executive AI does not currently see matching tasks, reminders, calls, emails,
              or WhatsApp drafts.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function ActionQueueCard({
  item,
  executing = false,
  executed = false,
  approved = false,
  rejected = false,
  failed = false,
  error = "",
  onApprove,
  onReject,
  onExecute,
}) {
  const { score, recommendation, template, studentStage, reason, requiresApproval } = item;
  const style = getPriorityStyle(recommendation.priority);
  const actionType = normalize(template.actionType);
  const canExecute = !executing && !executed && !rejected && (!requiresApproval || approved);

  return (
    <div className={`rounded-2xl border p-4 shadow-[0_8px_20px_rgba(23,36,61,0.045)] ${style.wrapper}`}>
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-black text-[#17243D]">{recommendation.title || template.title}</p>

            <Tag text={recommendation.priority || "medium"} className={style.badge} />
            <Tag text={formatLabel(studentStage)} />
            <Tag text={formatLabel(template.actionType)} />
            <Tag text={`Impact ${item.impactScore}`} />

            {requiresApproval ? (
              approved ? (
                <Tag text="Approved" className="border-[#E9802D]/35 bg-[#FFF1E3] text-[#B84F0E]" />
              ) : (
                <Tag text="Approval Required" className="border-[#E9802D]/40 bg-[#FFF1E3] text-[#B84F0E]" />
              )
            ) : (
              <Tag text="Auto Ready" className="border-[#E9802D]/32 bg-[#FFF1E3] text-[#B84F0E]" />
            )}

            {rejected ? <Tag text="Rejected" className="border-[#C2413B]/32 bg-[#FFF0EE] text-[#A8342F]" /> : null}
            {failed ? <Tag text="Failed" className="border-[#C2413B]/32 bg-[#FFF0EE] text-[#A8342F]" /> : null}
            {executed ? <Tag text="Executed" className="border-[#E9802D]/35 bg-[#FFF1E3] text-[#B84F0E]" /> : null}
          </div>

          <p className="mt-2 text-sm leading-6 text-[#667085]">
            {recommendation.description || template.description}
          </p>

          <p className="mt-3 text-xs leading-5 text-[#7A8392]">{reason}</p>

          <div className="mt-3 flex flex-wrap gap-2 text-[10px] font-black uppercase tracking-[0.14em]">
            <MiniStat label="Risk" value={score.risk_score || 0} />
            <MiniStat label="Opp" value={score.opportunity_score || 0} />
            <MiniStat label="Category" value={score.executive_category || "Standard"} />
            <MiniStat label="Type" value={getStudentType(score)} />
          </div>

          <div className="mt-4 grid gap-3 xl:grid-cols-2">
            <PayloadSummary payload={template.payload || {}} />

            <div className="rounded-xl border border-[#243A60]/18 bg-white p-4">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#8992A1]">
                Student
              </p>

              <p className="mt-2 font-bold text-[#17243D]">{getStudentName(score)}</p>

              <div className="mt-3 grid gap-1 text-xs leading-5 text-[#7A8392]">
                <p>Type: {formatLabel(getStudentType(score))}</p>
                <p>Stage: {formatLabel(studentStage)}</p>
                <p>Action: {formatLabel(actionType)}</p>
                <p>Priority: {recommendation.priority || "medium"}</p>
              </div>
            </div>
          </div>

          {error ? (
            <p className="mt-3 rounded-xl border border-[#C2413B]/30 bg-[#FFF0EE] px-3 py-2 text-xs text-[#A8342F]">
              {error}
            </p>
          ) : null}

          {executed ? (
            <p className="mt-3 rounded-xl border border-[#E9802D]/32 bg-[#FFF1E3] px-3 py-2 text-xs text-[#B84F0E]">
              Action marked as executed. Refresh analytics/tasks if needed.
            </p>
          ) : null}
        </div>

        <div className="flex shrink-0 flex-col gap-2 xl:w-48">
          {requiresApproval && !executed ? (
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={onApprove}
                disabled={executed || executing}
                className="rounded-full border border-[#E9802D]/35 bg-[#FFF1E3] px-3 py-2 text-[10px] font-black uppercase tracking-[0.14em] text-[#B84F0E] transition hover:bg-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Approve
              </button>

              <button
                type="button"
                onClick={onReject}
                disabled={executed || executing}
                className="rounded-full border border-[#C2413B]/32 bg-[#FFF0EE] px-3 py-2 text-[10px] font-black uppercase tracking-[0.14em] text-[#A8342F] transition hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Reject
              </button>
            </div>
          ) : null}

          <button
            type="button"
            onClick={onExecute}
            disabled={!canExecute}
            className="rounded-full border border-[#E9802D]/45 bg-[#FFF1E3] px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-[#B84F0E] transition hover:bg-[#E9802D]/20 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {executed ? "Executed" : executing ? "Executing..." : "Execute"}
          </button>
        </div>
      </div>
    </div>
  );
}

function BatchHistoryPanel({ batchHistory = [] }) {
  return (
    <div className="rounded-[1.75rem] border shadow-[0_12px_28px_rgba(23,36,61,0.05)] border-[#243A60]/18 bg-white p-5">
      <p className="text-xs font-black uppercase tracking-[0.22em] text-[#B84F0E]">
        Batch Execution History
      </p>
      <div className="mt-4 grid gap-3">
        {batchHistory.slice(0, 4).map((batch) => (
          <div key={batch.id} className="rounded-2xl border border-[#243A60]/18 bg-white p-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-black text-[#17243D]">{formatLabel(batch.scope)} Batch</p>
                <p className="mt-1 text-xs text-[#7A8392]">{new Date(batch.executedAt).toLocaleString()}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge label={`${batch.summary?.successful || 0} Success`} success />
                <Badge label={`${batch.summary?.failed || 0} Failed`} danger />
                <Badge label={`${batch.summary?.duplicateBlocked || 0} Duplicate`} gold />
                <Badge label={`${batch.summary?.successRate || 0}% Rate`} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function PayloadSummary({ payload = {} }) {
  return (
    <div className="rounded-xl border border-[#243A60]/18 bg-white p-4">
      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#8992A1]">
        Prepared Payload
      </p>

      <div className="mt-3 grid gap-1 text-xs leading-5 text-[#7A8392]">
        <p>Student: {payload.student_name || "Unknown"}</p>
        <p>Journey: {formatLabel(payload.journey_stage || "not_started")}</p>
        <p>Recommendation: {formatLabel(payload.recommendation_type || "unknown")}</p>
        <p>Priority: {payload.recommendation_priority || payload.priority || "medium"}</p>
        <p>Due Date: {payload.due_date || "Not set"}</p>
      </div>
    </div>
  );
}

function QueueMetric({ label, value, tone = "default" }) {
  const toneClass =
    tone === "red"
      ? "border-[#C2413B]/30 bg-[#FFF0EE] text-[#A8342F]"
      : tone === "gold"
      ? "border-[#E9802D]/40 bg-[#FFF1E3] text-[#B84F0E]"
      : tone === "green"
      ? "border-[#E9802D]/32 bg-[#FFF1E3] text-[#B84F0E]"
      : "border-[#243A60]/18 bg-white text-[#17243D]";

  return (
    <div className={`rounded-2xl border p-4 shadow-[0_8px_20px_rgba(23,36,61,0.045)] ${toneClass}`}>
      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#8992A1]">
        {label}
      </p>
      <p className="mt-2 text-2xl font-black">{value}</p>
    </div>
  );
}

function BulkButton({ label, onClick, loading = false, danger = false, gold = false, success = false }) {
  const style = danger
    ? "border-[#C2413B]/32 bg-[#FFF0EE] text-[#A8342F] hover:bg-red-500/20"
    : gold
    ? "border-[#E9802D]/40 bg-[#FFF1E3] text-[#B84F0E] hover:bg-[#E9802D]/20"
    : success
    ? "border-[#E9802D]/35 bg-[#FFF1E3] text-[#B84F0E] hover:bg-emerald-500/20"
    : "border-[#243A60]/18 bg-white text-[#667085] hover:border-white/25 hover:text-[#17243D]";

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      className={`rounded-full border px-4 py-2 text-xs font-black uppercase tracking-[0.14em] transition disabled:cursor-not-allowed disabled:opacity-50 ${style}`}
    >
      {loading ? "Running..." : label}
    </button>
  );
}

function FilterButton({ active = false, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-4 py-2 text-xs font-black uppercase tracking-[0.14em] transition ${
        active
          ? "border-[#E9802D]/45 bg-[#FFF1E3] text-[#B84F0E]"
          : "border-[#243A60]/18 bg-white text-[#7A8392] hover:border-white/20 hover:text-[#344054]"
      }`}
    >
      {children}
    </button>
  );
}

function MiniStat({ label, value }) {
  return (
    <span className="rounded-full border border-[#243A60]/18 bg-white px-3 py-1 text-[#8992A1]">
      {label}: {value}
    </span>
  );
}

function Badge({ label, danger = false, gold = false, success = false }) {
  const style = danger
    ? "border-[#C2413B]/32 bg-[#FFF0EE] text-[#A8342F]"
    : gold
    ? "border-[#E9802D]/40 bg-[#FFF1E3] text-[#B84F0E]"
    : success
    ? "border-[#E9802D]/35 bg-[#FFF1E3] text-[#B84F0E]"
    : "border-[#243A60]/18 bg-white text-[#7A8392]";

  return (
    <span className={`rounded-full border px-4 py-2 text-xs font-bold ${style}`}>
      {label}
    </span>
  );
}

function Tag({ text, className = "" }) {
  return (
    <span
      className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] ${
        className || "border-[#243A60]/18 bg-white text-[#7A8392]"
      }`}
    >
      {text}
    </span>
  );
}

function getPriorityStyle(priority = "") {
  const clean = normalize(priority);

  if (clean === "critical" || clean === "urgent") {
    return {
      wrapper: "border-[#C2413B]/32 bg-[#FFF0EE]",
      badge: "border-[#C2413B]/32 bg-[#FFF0EE] text-[#A8342F]",
    };
  }

  if (clean === "executive") {
    return {
      wrapper: "border-[#E9802D]/45 bg-[#FFF1E3]",
      badge: "border-[#E9802D]/40 bg-[#FFF1E3] text-[#B84F0E]",
    };
  }

  if (clean === "high") {
    return {
      wrapper: "border-[#A36A18]/30 bg-[#FFF7E8]",
      badge: "border-[#A36A18]/30 bg-[#FFF7E8] text-[#8A5611]",
    };
  }

  if (clean === "medium") {
    return {
      wrapper: "border-[#243A60]/25 bg-[#F3F5F8]",
      badge: "border-[#243A60]/25 bg-[#F3F5F8] text-[#243A60]",
    };
  }

  return {
    wrapper: "border-[#243A60]/18 bg-white",
    badge: "border-[#243A60]/18 bg-white text-[#7A8392]",
  };
}

export function buildExecutiveQueueAnalytics(scores = []) {
  const rows = Array.isArray(scores) ? scores : [];
  const items = buildExecutiveActionItems(rows);

  return {
    ...buildQueueAnalytics(items),
    totalStudents: rows.length,
    highImpactActions: items.filter((item) => item.impactScore >= 120).length,
    approvalRate: items.length
      ? Math.round((items.filter((item) => item.requiresApproval).length / items.length) * 100)
      : 0,
    aging: buildQueueAgingAnalytics(items),
  };
}

export default ExecutiveActionQueue;