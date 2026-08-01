import { useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock3,
  Crown,
  Filter,
  Mail,
  MessageCircle,
  PhoneCall,
  Play,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Target,
  XCircle,
  Zap,
} from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { buildExecutiveRecommendations } from "../../../../lib/executiveRecommendations";
import { buildExecutiveActionTemplate } from "../../../../lib/executiveActionTemplates";
import {
  executeExecutiveActionTemplate,
  executeBulkExecutiveActions,
  executeCriticalExecutiveActions,
  executeExecutivePriorityActions,
  executeConversionExecutiveActions,
  retryFailedExecutiveActions,
  buildQueueHealthAnalytics,
  buildBulkExecutionSummary,
} from "../../../../lib/executiveActionExecutor";

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
  const [bulkError, setBulkError] = useState("");
  const [visibleLimit, setVisibleLimit] = useState(12);

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

  const commandAvailability = useMemo(() => {
    const baseEligible = (item) => !executedKeys[item.key] && !rejectedKeys[item.key];

    const matchesScope = (item, scope) => {
      const priority = normalize(item.recommendation.priority);
      const category = normalize(
        item.score.executive_category || item.template?.payload?.executive_category
      );
      const opportunity = number(
        item.score.opportunity_score || item.template?.payload?.opportunity_score
      );
      const stage = normalize(item.studentStage);

      if (!baseEligible(item)) return false;
      if (scope === "critical")
        return (
          priority === "critical" ||
          priority === "urgent" ||
          number(item.score.risk_score) >= 80
        );
      if (scope === "executive")
        return (
          priority === "executive" ||
          category === "executive_priority" ||
          number(item.score.risk_score) >= 85 ||
          opportunity >= 85
        );
      if (scope === "conversion")
        return (
          opportunity >= 80 ||
          category === "conversion_ready" ||
          ["offer_accepted", "cas_pending", "cas_issued", "visa_pending"].includes(stage)
        );
      if (scope === "approval")
        return item.requiresApproval && !approvedKeys[item.key];
      if (scope === "failed") return Boolean(failedKeys[item.key]);
      return true;
    };

    const scoped = (scope) => actionItems.filter((item) => matchesScope(item, scope));
    const executable = (scope) =>
      scoped(scope).filter(
        (item) => !item.requiresApproval || Boolean(approvedKeys[item.key])
      );

    return {
      approveCritical: scoped("critical").filter(
        (item) => item.requiresApproval && !approvedKeys[item.key]
      ).length,
      approveExecutive: scoped("executive").filter(
        (item) => item.requiresApproval && !approvedKeys[item.key]
      ).length,
      approveAll: actionItems.filter(
        (item) =>
          baseEligible(item) &&
          item.requiresApproval &&
          !approvedKeys[item.key]
      ).length,
      executeCritical: executable("critical").length,
      executeExecutive: executable("executive").length,
      executeConversion: executable("conversion").length,
      retryFailed: scoped("failed").length,
      rejectWaiting: scoped("approval").length,
    };
  }, [
    actionItems,
    approvedKeys,
    executedKeys,
    rejectedKeys,
    failedKeys,
  ]);

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

  const visibleItems = useMemo(
    () => filteredItems.slice(0, visibleLimit),
    [filteredItems, visibleLimit]
  );

  function changeFilter(nextFilter) {
    setFilter(nextFilter);
    setVisibleLimit(12);
  }

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

      if (scope === "failed") return Boolean(failedKeys[item.key]);
      if (executedKeys[item.key] || rejectedKeys[item.key]) return false;
      if (scope === "critical") return priority === "critical" || priority === "urgent" || number(item.score.risk_score) >= 80;
      if (scope === "executive") return priority === "executive" || category === "executive_priority" || number(item.score.risk_score) >= 85 || opportunity >= 85;
      if (scope === "conversion") return opportunity >= 80 || category === "conversion_ready" || ["offer_accepted", "cas_pending", "cas_issued", "visa_pending"].includes(stage);
      if (scope === "approval") return item.requiresApproval && !approvedKeys[item.key];
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
    setBulkError("");

    try {
      let result;

      const executionPromise =
        scope === "critical"
          ? executeCriticalExecutiveActions({ templates, adminProfile })
          : scope === "executive"
          ? executeExecutivePriorityActions({ templates, adminProfile })
          : scope === "conversion"
          ? executeConversionExecutiveActions({ templates, adminProfile })
          : scope === "failed"
          ? retryFailedExecutiveActions({ templates, adminProfile })
          : executeBulkExecutiveActions({ templates, adminProfile });

      result = await withQueueTimeout(executionPromise, QUEUE_EXECUTION_TIMEOUT_MS);

      if (result?.timedOut) {
        throw result.error;
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
      if (typeof onActionExecuted === "function") {
        await onActionExecuted({ scope, result, summary });
      }
    } catch (err) {
      console.error("Bulk executive execution failed:", err);
      setBulkError(err?.message || "Bulk executive execution failed.");
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
        if (typeof onActionExecuted === "function") {
          await onActionExecuted(item);
        }
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
      if (typeof onActionExecuted === "function") {
        await onActionExecuted(item);
      }
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

  const reduceMotion = useReducedMotion();

  return (
    <motion.section
      initial={reduceMotion ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reduceMotion ? 0 : 0.28 }}
      className="min-w-0 space-y-5"
      aria-busy={Boolean(bulkExecuting)}
    >
      <section className="min-w-0 overflow-hidden rounded-[1.75rem] border-[3px] border-[#FF5A0A] bg-white shadow-[0_18px_50px_rgba(18,56,101,0.11)]">
        <div className="grid min-w-0 lg:grid-cols-[minmax(0,1.28fr)_minmax(19rem,0.72fr)]">
          <div className="min-w-0 bg-[#123865] p-5 text-white sm:p-6 lg:p-7">
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <DarkPill icon={Crown}>Executive Action Queue V5</DarkPill>
              <DarkPill icon={ShieldCheck}>Human Controlled</DarkPill>
              <DarkPill icon={Activity}>Live Queue Health</DarkPill>
            </div>

            <h2 className="mt-4 max-w-5xl break-words text-3xl font-black leading-tight tracking-[-0.04em] text-white sm:text-4xl">
              Student OS Decision & Execution Command
            </h2>

            <p className="mt-3 max-w-5xl break-words text-sm font-semibold leading-6 text-slate-100">
              Review, approve, reject, execute, recover and audit AI-generated
              student actions without bypassing the human control layer.
            </p>

            <div className="mt-5 grid min-w-0 grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-6">
              <DarkMetric label="Actions" value={analytics.total} />
              <DarkMetric label="Critical" value={analytics.critical + analytics.urgent} />
              <DarkMetric label="Approval" value={analytics.approvalRequired} />
              <DarkMetric label="Ready" value={analytics.ready} />
              <DarkMetric label="Done" value={analytics.executed} />
              <DarkMetric label="Failed" value={analytics.failed} />
            </div>
          </div>

          <div className="min-w-0 border-t-[3px] border-[#FF5A0A] bg-[#FF5A0A] p-5 text-white sm:p-6 lg:border-l-[3px] lg:border-t-0 lg:p-7">
            <p className="text-[9px] font-black uppercase tracking-[0.14em] text-white">
              Queue Operating Position
            </p>

            <p className="mt-3 text-5xl font-black text-white">
              {queueHealth.queuePressure || 0}
            </p>

            <p className="mt-1 text-sm font-black uppercase tracking-[0.08em] text-white">
              Queue Pressure
            </p>

            <div className="mt-5 grid grid-cols-2 gap-2">
              <OrangeMetric label="Approval SLA" value={`${approvalSla.approvalRate}%`} />
              <OrangeMetric label="Oldest" value={`${aging.oldestAgeHours}h`} />
              <OrangeMetric label="Throughput" value={throughput.totalExecuted} />
              <OrangeMetric label="Success" value={`${throughput.successRate}%`} />
            </div>

            <div className="mt-4 rounded-xl border-2 border-white/25 bg-white/10 p-3">
              <p className="text-[8px] font-black uppercase tracking-[0.1em] text-white">
                Human Control Rule
              </p>
              <p className="mt-1 text-xs font-black leading-5 text-white">
                Approval-gated actions stay locked until a human explicitly approves them.
              </p>
            </div>
          </div>
        </div>
      </section>

      {bulkError ? (
        <div
          role="alert"
          className="flex min-w-0 items-start gap-3 rounded-[1.3rem] border-[3px] border-red-400 bg-red-50 p-4 text-red-900 shadow-[0_8px_22px_rgba(18,56,101,0.05)]"
        >
          <AlertTriangle size={17} className="mt-0.5 shrink-0" />
          <p className="min-w-0 flex-1 text-sm font-bold">{bulkError}</p>
          <button
            type="button"
            onClick={() => setBulkError("")}
            aria-label="Dismiss bulk error"
          >
            <XCircle size={16} />
          </button>
        </div>
      ) : null}

      <QueueOperationsBoard
        analytics={analytics}
        queueHealth={queueHealth}
        approvalSla={approvalSla}
        throughput={throughput}
      />

      <section className="min-w-0 overflow-hidden rounded-[1.65rem] border-[3px] border-[#123865] bg-white shadow-[0_14px_38px_rgba(18,56,101,0.08)]">
        <div className="flex min-w-0 flex-col gap-3 border-b-[3px] border-[#FF5A0A] bg-[#123865] px-5 py-4 text-white sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <p className="text-[9px] font-black uppercase tracking-[0.14em] text-orange-200">
              Command Center
            </p>
            <h3 className="mt-1 text-xl font-black text-white">
              Human approval first. Execution only activates when work is eligible.
            </h3>
            <p className="mt-1 max-w-4xl text-xs font-semibold leading-5 text-slate-200">
              Muted commands are intentionally unavailable because no eligible work
              exists. They are not broken buttons.
            </p>
          </div>

          {bulkExecuting ? (
            <span className="inline-flex items-center gap-2 self-start rounded-xl border-2 border-white/25 bg-white/10 px-3 py-2 text-[10px] font-black uppercase text-white">
              <RefreshCw size={12} className="animate-spin" />
              Running {formatLabel(bulkExecuting)}
            </span>
          ) : (
            <span className="inline-flex items-center gap-2 self-start rounded-xl border-2 border-emerald-300 bg-emerald-50 px-3 py-2 text-[10px] font-black uppercase text-emerald-800">
              <ShieldCheck size={13} />
              Human control active
            </span>
          )}
        </div>

        <div className="grid min-w-0 gap-5 bg-[#FFF8EF] p-4 sm:p-5 xl:grid-cols-2">
          <PartnerCommandGroup
            eyebrow="Step 01"
            title="Approve or reject"
            description="These commands change only the local human-review state."
            tone="orange"
          >
            <BulkButton
              label="Approve Critical"
              count={commandAvailability.approveCritical}
              hint="Critical or urgent actions waiting for approval"
              onClick={() => handleBulkApprove("critical")}
              disabled={Boolean(bulkExecuting) || commandAvailability.approveCritical === 0}
              tone="approve"
            />
            <BulkButton
              label="Approve Executive"
              count={commandAvailability.approveExecutive}
              hint="Executive-priority actions waiting for approval"
              onClick={() => handleBulkApprove("executive")}
              disabled={Boolean(bulkExecuting) || commandAvailability.approveExecutive === 0}
              tone="approve"
            />
            <BulkButton
              label="Approve All"
              count={commandAvailability.approveAll}
              hint="All remaining approval-gated actions"
              onClick={() => handleBulkApprove("all")}
              disabled={Boolean(bulkExecuting) || commandAvailability.approveAll === 0}
              tone="approve"
            />
            <BulkButton
              label="Reject Waiting"
              count={commandAvailability.rejectWaiting}
              hint="Reject every action still waiting for approval"
              onClick={() => handleBulkReject("approval")}
              disabled={Boolean(bulkExecuting) || commandAvailability.rejectWaiting === 0}
              tone="reject"
            />
          </PartnerCommandGroup>

          <PartnerCommandGroup
            eyebrow="Step 02"
            title="Execute eligible work"
            description="These commands call the real executor after approval rules are satisfied."
            tone="navy"
          >
            <BulkButton
              label="Execute Critical"
              count={commandAvailability.executeCritical}
              hint="Approved critical or urgent actions ready to run"
              onClick={() => runBulkExecution("critical")}
              loading={bulkExecuting === "critical"}
              disabled={Boolean(bulkExecuting) || commandAvailability.executeCritical === 0}
              tone="critical"
            />
            <BulkButton
              label="Execute Executive"
              count={commandAvailability.executeExecutive}
              hint="Approved executive-priority actions ready to run"
              onClick={() => runBulkExecution("executive")}
              loading={bulkExecuting === "executive"}
              disabled={Boolean(bulkExecuting) || commandAvailability.executeExecutive === 0}
              tone="execute"
            />
            <BulkButton
              label="Execute Conversion"
              count={commandAvailability.executeConversion}
              hint="Conversion-ready actions eligible to run"
              onClick={() => runBulkExecution("conversion")}
              loading={bulkExecuting === "conversion"}
              disabled={Boolean(bulkExecuting) || commandAvailability.executeConversion === 0}
              tone="conversion"
            />
            <BulkButton
              label="Retry Failed"
              count={commandAvailability.retryFailed}
              hint="Previously failed actions eligible for retry"
              onClick={() => runBulkExecution("failed")}
              loading={bulkExecuting === "failed"}
              disabled={Boolean(bulkExecuting) || commandAvailability.retryFailed === 0}
              tone="retry"
            />
          </PartnerCommandGroup>
        </div>
      </section>

      <section className="min-w-0 overflow-hidden rounded-[1.5rem] border-[3px] border-[#123865] bg-white shadow-[0_10px_28px_rgba(18,56,101,0.06)]">
        <div className="flex min-w-0 flex-col gap-3 border-b-[3px] border-[#FF5A0A] bg-[#FFF4E8] px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <Filter size={15} className="text-orange-700" />
            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.12em] text-orange-700">
                Queue Filters
              </p>
              <p className="mt-0.5 text-sm font-black text-[#10233F]">
                Focus the execution queue
              </p>
            </div>
          </div>

          <span className="w-fit rounded-full border-2 border-[#123865] bg-white px-3 py-1.5 text-[9px] font-black uppercase text-[#123865]">
            {filteredItems.length} visible
          </span>
        </div>

        <div className="flex min-w-0 flex-wrap gap-2 bg-[#FFF8EF] p-4">
          <FilterButton active={filter === "all"} onClick={() => changeFilter("all")}>All</FilterButton>
          <FilterButton active={filter === "approval"} onClick={() => changeFilter("approval")}>Approval</FilterButton>
          <FilterButton active={filter === "ready"} onClick={() => changeFilter("ready")}>Ready</FilterButton>
          <FilterButton active={filter === "critical"} onClick={() => changeFilter("critical")}>Critical</FilterButton>
          <FilterButton active={filter === "executive"} onClick={() => changeFilter("executive")}>Executive</FilterButton>
          <FilterButton active={filter === "high-impact"} onClick={() => changeFilter("high-impact")}>High Impact</FilterButton>
          <FilterButton active={filter === "tasks"} onClick={() => changeFilter("tasks")}>Tasks</FilterButton>
          <FilterButton active={filter === "communication"} onClick={() => changeFilter("communication")}>Communication</FilterButton>
          <FilterButton active={filter === "failed"} onClick={() => changeFilter("failed")}>Failed</FilterButton>
          <FilterButton active={filter === "executed"} onClick={() => changeFilter("executed")}>Executed</FilterButton>
        </div>
      </section>

      {batchHistory.length ? <BatchHistoryPanel batchHistory={batchHistory} /> : null}

      <div className="space-y-3">
        {filteredItems.length ? (
          visibleItems.map((item, index) => (
            <ActionQueueCard
              key={item.key}
              item={item}
              index={index}
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
          <div className="rounded-[1.5rem] border-[3px] border-dashed border-[#FF5A0A] bg-white p-7 text-center shadow-inner">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl border-[3px] border-[#FF5A0A] bg-[#FFF4E8] text-orange-700">
              <Sparkles size={23} />
            </div>
            <p className="mt-4 font-black text-[#10233F]">No actions in this view</p>
            <p className="mx-auto mt-2 max-w-xl text-sm font-semibold leading-6 text-slate-600">
              The current filter has no matching executive tasks, reminders,
              calls, email drafts or WhatsApp drafts.
            </p>
          </div>
        )}

        {filteredItems.length > visibleItems.length ? (
          <button
            type="button"
            onClick={() => setVisibleLimit((value) => Math.min(value + 12, filteredItems.length))}
            className="w-full rounded-[1.25rem] border-[3px] border-[#123865] bg-[#FFF8EF] px-4 py-3 text-sm font-black text-[#10233F] transition hover:border-[#FF5A0A] hover:bg-white"
          >
            Show 12 more · {filteredItems.length - visibleItems.length} remaining
          </button>
        ) : null}

        {visibleLimit > 12 && filteredItems.length ? (
          <button
            type="button"
            onClick={() => setVisibleLimit(12)}
            className="w-full rounded-xl border-2 border-[#C9D7E6] bg-white px-4 py-2.5 text-xs font-black text-slate-700 transition hover:border-[#FF5A0A] hover:text-orange-700"
          >
            Collapse queue
          </button>
        ) : null}
      </div>
    </motion.section>
  );
}

function QueueOperationsBoard({
  analytics,
  queueHealth,
  approvalSla,
  throughput,
}) {
  return (
    <section className="min-w-0 overflow-hidden rounded-[1.6rem] border-[3px] border-[#123865] bg-white shadow-[0_14px_38px_rgba(18,56,101,0.08)]">
      <div className="flex min-w-0 flex-col gap-3 border-b-[3px] border-[#FF5A0A] bg-[#123865] px-5 py-4 text-white sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[9px] font-black uppercase tracking-[0.14em] text-orange-200">
            Queue Operations Board
          </p>
          <h3 className="mt-1 text-xl font-black text-white">
            Action mix and execution health
          </h3>
          <p className="mt-1 text-xs font-semibold leading-5 text-slate-200">
            One grouped operational board replaces the loose six-card metric row.
          </p>
        </div>

        <span className="w-fit rounded-full border-2 border-white/25 bg-white/10 px-3 py-1.5 text-[9px] font-black uppercase text-white">
          {analytics.total} actions
        </span>
      </div>

      <div className="grid min-w-0 gap-3 bg-[#FFF8EF] p-4 sm:grid-cols-2 sm:p-5 xl:grid-cols-3">
        <QueueBoardCard
          label="Task Operations"
          value={analytics.tasks}
          detail={`${analytics.reminders} reminders · ${analytics.calls} calls`}
          icon={Target}
          tone="navy"
        />
        <QueueBoardCard
          label="Communication"
          value={analytics.emailDrafts + analytics.whatsappDrafts}
          detail={`${analytics.emailDrafts} email · ${analytics.whatsappDrafts} WhatsApp`}
          icon={Mail}
          tone="orange"
        />
        <QueueBoardCard
          label="High Impact"
          value={analytics.highImpact}
          detail="Actions with impact score 120 or higher"
          icon={Zap}
          tone="red"
        />
        <QueueBoardCard
          label="Approval Health"
          value={`${approvalSla.approvalRate}%`}
          detail={`${approvalSla.waiting} waiting · ${approvalSla.rejected} rejected`}
          icon={ShieldCheck}
          tone="green"
        />
        <QueueBoardCard
          label="Execution Throughput"
          value={throughput.totalExecuted}
          detail={`${throughput.batches} batches · ${throughput.totalFailed} failed`}
          icon={Activity}
          tone="navy"
        />
        <QueueBoardCard
          label="Duplicate Protection"
          value={queueHealth.duplicateBlockedCount || throughput.totalDuplicate}
          detail="Repeated work blocked by action-key protection"
          icon={ShieldCheck}
          tone="orange"
        />
      </div>
    </section>
  );
}

function QueueBoardCard({
  label,
  value,
  detail,
  icon: Icon,
  tone = "navy",
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
    <article className={`min-w-0 rounded-[1.25rem] border-[3px] p-4 shadow-[0_7px_18px_rgba(18,56,101,0.05)] transition hover:-translate-y-0.5 hover:shadow-md ${classes}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[8px] font-black uppercase tracking-[0.1em] text-[#53657D]">
            {label}
          </p>
          <p className="mt-2 text-3xl font-black text-[#10233F]">{value}</p>
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

function PartnerCommandGroup({
  eyebrow,
  title,
  description,
  tone = "navy",
  children,
}) {
  const accent =
    tone === "orange"
      ? "border-[#FF5A0A]"
      : "border-[#123865]";

  return (
    <section className={`min-w-0 overflow-hidden rounded-[1.35rem] border-[3px] bg-white shadow-[0_8px_22px_rgba(18,56,101,0.05)] ${accent}`}>
      <div className={`border-b-[3px] px-4 py-3.5 ${tone === "orange" ? "border-[#FF5A0A] bg-[#FFF4E8]" : "border-[#FF5A0A] bg-[#123865] text-white"}`}>
        <p className={`text-[8px] font-black uppercase tracking-[0.12em] ${tone === "orange" ? "text-orange-700" : "text-orange-200"}`}>
          {eyebrow}
        </p>
        <h4 className={`mt-1 text-base font-black ${tone === "orange" ? "text-[#10233F]" : "text-white"}`}>
          {title}
        </h4>
        <p className={`mt-1 text-xs font-semibold leading-5 ${tone === "orange" ? "text-slate-600" : "text-slate-200"}`}>
          {description}
        </p>
      </div>

      <div className="grid min-w-0 gap-3 bg-white p-4 sm:grid-cols-2">
        {children}
      </div>
    </section>
  );
}


function ActionQueueCard({
  item,
  index = 0,
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
  const waitingApproval = requiresApproval && !approved && !executed && !rejected;
  const canExecute = !executing && !executed && !rejected && (!requiresApproval || approved);

  const stateLabel = executed
    ? "Executed"
    : failed
    ? "Failed"
    : rejected
    ? "Rejected"
    : waitingApproval
    ? "Waiting approval"
    : approved
    ? "Approved · ready"
    : "Ready to execute";

  const stateStyle = executed
    ? "border-emerald-400 bg-emerald-50 text-emerald-800"
    : failed || rejected
    ? "border-red-300 bg-red-50 text-red-800"
    : waitingApproval
    ? "border-amber-300 bg-amber-50 text-amber-900"
    : "border-[#FF5A0A] bg-[#FFF4E8] text-[#9B3E08]";

  return (
    <motion.article
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay: Math.min(index * 0.02, 0.16) }}
      className={`min-w-0 overflow-hidden rounded-[1.6rem] border-[3px] shadow-[0_14px_34px_rgba(18,56,101,0.08)] ${style.wrapper}`}
    >
      <div className="grid xl:grid-cols-[minmax(0,1fr)_230px]">
        <div className="min-w-0 p-4 sm:p-5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border-2 border-[#123865] bg-white text-sm font-black text-[#10233F]">
              {index + 1}
            </span>

            <div className="min-w-0 flex-1">
              <p className="break-words text-base font-black text-[#10233F] sm:text-lg">
                {recommendation.title || template.title}
              </p>
              <p className="mt-0.5 text-[10px] font-black uppercase tracking-[0.1em] text-slate-500">
                {getStudentName(score)} · {formatLabel(getStudentType(score))}
              </p>
            </div>

            <span className={`rounded-xl border-2 px-3 py-2 text-[9px] font-black uppercase tracking-[0.08em] ${stateStyle}`}>
              {stateLabel}
            </span>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <Tag text={recommendation.priority || "medium"} className={style.badge} />
            <Tag text={formatLabel(studentStage)} />
            <Tag text={formatLabel(template.actionType)} />
            <Tag text={`Impact ${item.impactScore}`} />
          </div>

          <div className="mt-4 rounded-xl border-2 border-[#C9D7E6] bg-[#FFF8EF] p-4">
            <p className="text-[9px] font-black uppercase tracking-[0.12em] text-[#B84F0E]">
              Recommended move
            </p>
            <p className="mt-2 text-sm font-bold leading-6 text-[#10233F]">
              {recommendation.description || template.description}
            </p>
            <p className="mt-2 text-xs font-semibold leading-5 text-slate-600">{reason}</p>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
            <ReadOnlyMetric label="Risk" value={score.risk_score || 0} tone="risk" />
            <ReadOnlyMetric label="Opportunity" value={score.opportunity_score || 0} tone="opportunity" />
            <ReadOnlyMetric label="Category" value={formatLabel(score.executive_category || "Standard")} />
            <ReadOnlyMetric label="Action" value={formatLabel(actionType)} tone="action" />
          </div>

          <div className="mt-3 grid gap-3 xl:grid-cols-2">
            <PayloadSummary payload={template.payload || {}} />

            <div className="rounded-xl border-2 border-[#C9D7E6] bg-[#F8FAFC] p-4">
              <p className="text-[9px] font-black uppercase tracking-[0.12em] text-slate-600">
                Student context
              </p>
              <p className="mt-2 text-base font-black text-[#10233F]">{getStudentName(score)}</p>
              <div className="mt-3 grid gap-1.5 text-xs font-semibold leading-5 text-slate-600">
                <p><span className="font-black text-[#10233F]">Type:</span> {formatLabel(getStudentType(score))}</p>
                <p><span className="font-black text-[#10233F]">Stage:</span> {formatLabel(studentStage)}</p>
                <p><span className="font-black text-[#10233F]">Priority:</span> {formatLabel(recommendation.priority || "medium")}</p>
              </div>
            </div>
          </div>

          {error ? (
            <p className="mt-3 rounded-xl border-2 border-red-300 bg-red-50 px-3 py-2 text-xs font-bold text-red-800">
              {error}
            </p>
          ) : null}

          {executed ? (
            <p className="mt-3 rounded-xl border-2 border-emerald-300 bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-800">
              Execution completed. This card is now read-only; refresh connected analytics/tasks when needed.
            </p>
          ) : null}
        </div>

        <aside className="border-t-[3px] border-[#123865] bg-[#FFF8EF] p-4 xl:border-l-[3px] xl:border-t-0">
          <p className="text-[9px] font-black uppercase tracking-[0.12em] text-slate-500">
            Human control
          </p>

          <div className={`mt-2 rounded-xl border-2 px-3 py-3 ${stateStyle}`}>
            <p className="text-[9px] font-black uppercase tracking-[0.08em]">Current state</p>
            <p className="mt-1 text-sm font-black">{stateLabel}</p>
          </div>

          {requiresApproval && !executed ? (
            <div className="mt-3 grid gap-2">
              <button
                type="button"
                onClick={onApprove}
                disabled={executing || approved}
                className="min-h-11 rounded-xl border-2 border-emerald-500 bg-emerald-500 px-3 py-2 text-xs font-black uppercase tracking-[0.08em] text-white transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:border-[#C9D7E6] disabled:bg-slate-100 disabled:text-slate-400"
              >
                {approved ? "Approved" : "Approve action"}
              </button>

              <button
                type="button"
                onClick={onReject}
                disabled={executing || rejected}
                className="min-h-11 rounded-xl border-2 border-red-300 bg-red-50 px-3 py-2 text-xs font-black uppercase tracking-[0.08em] text-red-800 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-45"
              >
                Reject action
              </button>
            </div>
          ) : null}

          <button
            type="button"
            onClick={onExecute}
            disabled={!canExecute}
            className={`mt-3 min-h-12 w-full rounded-xl border-2 px-4 py-2 text-xs font-black uppercase tracking-[0.08em] transition ${
              canExecute
                ? "border-orange-600 bg-[#FF5A0A] text-white shadow-[0_7px_16px_rgba(249,115,22,0.18)] hover:bg-orange-600"
                : "border-[#C9D7E6] bg-slate-100 text-slate-400"
            } disabled:cursor-not-allowed`}
          >
            {executed
              ? "Already executed"
              : executing
              ? "Executing..."
              : waitingApproval
              ? "Approval required"
              : rejected
              ? "Rejected"
              : "Execute action"}
          </button>

          <p className="mt-3 text-[10px] font-semibold leading-4 text-slate-500">
            {executed
              ? "No further execution is available for this queue item."
              : waitingApproval
              ? "Execution stays locked until a human approves this action."
              : rejected
              ? "Rejected actions cannot execute unless the queue is regenerated."
              : "This will call the configured executive action executor."}
          </p>
        </aside>
      </div>
    </motion.article>
  );
}

function ReadOnlyMetric({ label, value, tone = "default" }) {
  const style =
    tone === "risk"
      ? "border-red-300 bg-red-50"
      : tone === "opportunity"
      ? "border-emerald-300 bg-emerald-50"
      : tone === "action"
      ? "border-[#FF5A0A] bg-[#FFF4E8]"
      : "border-[#C9D7E6] bg-[#F8FAFC]";

  return (
    <div className={`min-w-0 rounded-xl border-2 p-3 ${style}`}>
      <p className="text-[8px] font-black uppercase tracking-[0.08em] text-slate-600">
        {label}
      </p>
      <p className="mt-1 break-words text-sm font-black text-[#10233F]">{value}</p>
    </div>
  );
}

function BatchHistoryPanel({ batchHistory = [] }) {
  const visibleBatches = batchHistory.slice(0, 4);

  return (
    <div className="overflow-hidden rounded-[1.75rem] border-[3px] border-[#123865] bg-[#FFF8EF] shadow-[0_14px_34px_rgba(18,56,101,0.08)]">
      <div className="flex flex-col gap-2 border-b-2 border-[#FFD0B5] bg-[#123865] px-5 py-4 text-white sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[9px] font-black uppercase tracking-[0.16em] text-white">
            Execution Audit
          </p>
          <h3 className="mt-1 text-lg font-black text-white">Batch Execution History</h3>
          <p className="mt-1 text-xs font-semibold text-white">
            Recent bulk runs with success, failure, duplicate protection, and completion rate.
          </p>
        </div>
        <span className="rounded-xl border-2 border-white/25 bg-white/10 px-3 py-2 text-[10px] font-black uppercase text-white">
          {visibleBatches.length} recent batch{visibleBatches.length === 1 ? "" : "es"}
        </span>
      </div>

      <div className="grid min-w-0 gap-3 p-4 sm:p-5">
        {visibleBatches.map((batch, index) => {
          const successful = number(batch.summary?.successful);
          const failed = number(batch.summary?.failed);
          const duplicates = number(batch.summary?.duplicateBlocked);
          const rate = number(batch.summary?.successRate);
          const hasFailure = failed > 0;

          return (
            <div
              key={batch.id}
              className={`rounded-[1.3rem] border-[3px] p-4 transition ${
                hasFailure
                  ? "border-red-300 bg-red-50"
                  : "border-[#C9D7E6] bg-white hover:border-[#FF5A0A]"
              }`}
            >
              <div className="grid min-w-0 gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg border-2 border-[#FF5A0A] bg-[#FFF4E8] text-xs font-black text-[#9B3E08]">
                      {index + 1}
                    </span>
                    <p className="text-base font-black text-[#10233F]">
                      {formatLabel(batch.scope)} Batch
                    </p>
                    <span
                      className={`rounded-full border-2 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.08em] ${
                        hasFailure
                          ? "border-red-300 bg-red-100 text-red-800"
                          : "border-emerald-300 bg-emerald-50 text-emerald-800"
                      }`}
                    >
                      {hasFailure ? "Needs review" : "Completed"}
                    </span>
                  </div>

                  <p className="mt-2 text-xs font-semibold text-slate-600">
                    {new Date(batch.executedAt).toLocaleString()}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  <HistoryMetric label="Success" value={successful} tone="green" />
                  <HistoryMetric label="Failed" value={failed} tone={failed ? "red" : "neutral"} />
                  <HistoryMetric label="Duplicate" value={duplicates} tone="orange" />
                  <HistoryMetric label="Rate" value={`${rate}%`} tone={rate >= 90 ? "green" : "orange"} />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function HistoryMetric({ label, value, tone = "neutral" }) {
  const style =
    tone === "green"
      ? "border-emerald-300 bg-emerald-50 text-emerald-800"
      : tone === "red"
      ? "border-red-300 bg-red-50 text-red-800"
      : tone === "orange"
      ? "border-[#FF5A0A] bg-[#FFF4E8] text-[#9B3E08]"
      : "border-[#C9D7E6] bg-slate-50 text-[#10233F]";

  return (
    <div className={`min-w-[92px] rounded-xl border-2 px-3 py-2 ${style}`}>
      <p className="text-[8px] font-black uppercase tracking-[0.08em]">{label}</p>
      <p className="mt-1 text-base font-black">{value}</p>
    </div>
  );
}

function PayloadSummary({ payload = {} }) {
  return (
    <div className="rounded-xl border-2 border-[#FF5A0A] bg-[#FFF4E8]/50 p-4">
      <p className="text-[9px] font-black uppercase tracking-[0.12em] text-[#9B3E08]">
        Prepared execution payload
      </p>

      <div className="mt-3 grid gap-1.5 text-xs font-semibold leading-5 text-slate-600">
        <p><span className="font-black text-[#10233F]">Student:</span> {payload.student_name || "Unknown"}</p>
        <p><span className="font-black text-[#10233F]">Journey:</span> {formatLabel(payload.journey_stage || "not_started")}</p>
        <p><span className="font-black text-[#10233F]">Recommendation:</span> {formatLabel(payload.recommendation_type || "unknown")}</p>
        <p><span className="font-black text-[#10233F]">Priority:</span> {formatLabel(payload.recommendation_priority || payload.priority || "medium")}</p>
        <p><span className="font-black text-[#10233F]">Due date:</span> {payload.due_date || "Not set"}</p>
      </div>
    </div>
  );
}

function DarkPill({ icon: Icon, children }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border-2 border-white/20 bg-white/10 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.1em] text-white">
      <Icon size={11} />
      {children}
    </span>
  );
}

function DarkMetric({ label, value }) {
  return (
    <div className="rounded-xl border-2 border-white/20 bg-white/10 p-3 text-white">
      <p className="text-[8px] font-black uppercase tracking-[0.09em] text-white">{label}</p>
      <p className="mt-1 text-xl font-black text-white">{value}</p>
    </div>
  );
}

function OrangeMetric({ label, value }) {
  return (
    <div className="rounded-xl border-2 border-white/25 bg-white/10 p-3 text-white">
      <p className="text-[8px] font-black uppercase tracking-[0.08em] text-white">{label}</p>
      <p className="mt-1 text-lg font-black text-white">{value}</p>
    </div>
  );
}

function QueueMetric({ label, value, tone = "default", icon: Icon = Activity }) {
  const toneClass =
    tone === "red"
      ? "border-red-300 bg-red-50"
      : tone === "gold"
      ? "border-[#FF5A0A] bg-[#FFF4E8]"
      : tone === "green"
      ? "border-emerald-300 bg-emerald-50"
      : "border-[#C9D7E6] bg-white";

  return (
    <div className={`rounded-xl border-[3px] p-4 ${toneClass}`}>
      <div className="flex items-center justify-between gap-2">
        <p className="text-[9px] font-black uppercase tracking-[0.1em] text-slate-500">
          {label}
        </p>
        <Icon size={14} className="text-[#B84F0E]" />
      </div>
      <p className="mt-2 text-2xl font-black text-[#10233F]">{value}</p>
    </div>
  );
}

function CommandGroup({ eyebrow, title, description, children }) {
  return (
    <div className="rounded-[1.3rem] border-2 border-[#C9D7E6] bg-white p-4">
      <p className="text-[8px] font-black uppercase tracking-[0.12em] text-[#B84F0E]">{eyebrow}</p>
      <p className="mt-1 text-sm font-black text-[#10233F]">{title}</p>
      <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">{description}</p>
      <div className="mt-4 grid gap-2 sm:grid-cols-2">{children}</div>
    </div>
  );
}

function BulkButton({
  label,
  count = 0,
  hint = "",
  onClick,
  loading = false,
  disabled = false,
  tone = "default",
}) {
  const enabledStyle =
    tone === "critical"
      ? "border-red-500 bg-red-500 text-white hover:bg-red-600"
      : tone === "reject"
      ? "border-red-300 bg-red-50 text-red-800 hover:bg-red-100"
      : tone === "approve"
      ? "border-emerald-400 bg-emerald-50 text-emerald-900 hover:bg-emerald-100"
      : tone === "conversion"
      ? "border-emerald-500 bg-emerald-500 text-white hover:bg-emerald-600"
      : tone === "execute"
      ? "border-[#FF5A0A] bg-[#FF5A0A] text-white hover:bg-orange-600"
      : tone === "retry"
      ? "border-[#123865] bg-[#123865] text-white hover:bg-[#0d2d53]"
      : "border-[#C9D7E6] bg-white text-[#10233F] hover:border-[#FF5A0A]";

  const isDisabled = loading || disabled;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isDisabled}
      title={isDisabled && count === 0 ? `Unavailable: ${hint || "no eligible actions"}` : hint}
      className={`group min-h-[78px] rounded-xl border-2 p-3 text-left transition ${
        isDisabled
          ? "cursor-not-allowed border-[#C9D7E6] bg-slate-100 text-slate-400 opacity-75"
          : `${enabledStyle} shadow-[0_6px_14px_rgba(15,35,63,0.08)] hover:-translate-y-0.5`
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="text-[10px] font-black uppercase tracking-[0.08em]">
          {loading ? "Running..." : label}
        </span>
        <span
          className={`flex min-w-7 items-center justify-center rounded-lg border px-2 py-1 text-[10px] font-black ${
            isDisabled
              ? "border-[#C9D7E6] bg-white text-slate-400"
              : "border-current/20 bg-white/15"
          }`}
        >
          {count}
        </span>
      </div>
      <p className={`mt-2 text-[10px] font-semibold leading-4 ${isDisabled ? "text-slate-400" : "opacity-90"}`}>
        {count === 0 ? "No eligible actions right now" : hint}
      </p>
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
          ? "border-orange-600 bg-[#FF5A0A] text-white shadow-[0_4px_10px_rgba(249,115,22,0.16)]"
          : "border-[#C9D7E6] bg-white text-[#10233F] hover:border-[#FF5A0A] hover:bg-[#FFF4E8]"
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
      wrapper: "border-red-300 bg-red-50",
      badge: "border-[#C2413B]/32 bg-[#FFF0EE] text-[#A8342F]",
    };
  }

  if (clean === "executive") {
    return {
      wrapper: "border-[#FF5A0A] bg-[#FFF4E8]",
      badge: "border-[#E9802D]/40 bg-[#FFF1E3] text-[#B84F0E]",
    };
  }

  if (clean === "high") {
    return {
      wrapper: "border-amber-300 bg-amber-50",
      badge: "border-[#A36A18]/30 bg-[#FFF7E8] text-[#8A5611]",
    };
  }

  if (clean === "medium") {
    return {
      wrapper: "border-[#C9D7E6] bg-slate-50",
      badge: "border-[#243A60]/25 bg-[#F3F5F8] text-[#243A60]",
    };
  }

  return {
    wrapper: "border-[#C9D7E6] bg-white",
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