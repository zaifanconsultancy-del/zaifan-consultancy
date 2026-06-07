import { useMemo, useState } from "react";
import { buildExecutiveRecommendations } from "../../lib/executiveRecommendations";
import { buildExecutiveActionTemplate } from "../../lib/executiveActionTemplates";
import { executeExecutiveActionTemplate } from "../../lib/executiveActionExecutor";

const MAX_QUEUE_ITEMS = 30;
const QUEUE_EXECUTION_TIMEOUT_MS = 4500;

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

  if (["visa_rejected", "rejected", "refused", "visa_refused"].includes(visaStatus)) {
    return "visa_rejected";
  }

  if (["visa_pending", "pending", "submitted", "under_review", "review"].includes(visaStatus)) {
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

  if (["started", "draft", "in_progress"].includes(applicationStatus)) {
    return "application_started";
  }

  return "not_started";
}

function getPriorityRank(priority = "") {
  const clean = normalize(priority);

  if (clean === "critical") return 6;
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

function buildActionItems(scores = []) {
  const rawItems = (scores || []).flatMap((score) => {
    const recommendations = buildExecutiveRecommendations(score);

    return recommendations
      .filter((recommendation) => normalize(recommendation.action) !== "none")
      .map((recommendation) => {
        const template = buildExecutiveActionTemplate(score, recommendation);
        const studentStage = getJourneyStage(score, template);
        const priorityRank = getPriorityRank(recommendation.priority);
        const actionRank = getActionRank(template.actionType);
        const impactScore =
          number(score.risk_score) +
          number(score.opportunity_score) +
          priorityRank * 12 +
          actionRank * 5;

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
          impactScore,
          createdAt: new Date().toISOString(),
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
    .slice(0, MAX_QUEUE_ITEMS);
}

function buildQueueAnalytics(actionItems = [], executedKeys = {}, approvedKeys = {}, rejectedKeys = {}) {
  const analytics = {
    total: actionItems.length,
    critical: 0,
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
  };

  actionItems.forEach((item) => {
    const priority = normalize(item.recommendation.priority);
    const actionType = normalize(item.template.actionType);

    if (analytics[priority] !== undefined) analytics[priority] += 1;

    if (item.requiresApproval) analytics.approvalRequired += 1;
    else analytics.ready += 1;

    if (approvedKeys[item.key]) analytics.approved += 1;
    if (rejectedKeys[item.key]) analytics.rejected += 1;
    if (executedKeys[item.key]) analytics.executed += 1;

    if (!approvedKeys[item.key] && !rejectedKeys[item.key] && !executedKeys[item.key]) {
      analytics.pending += 1;
    }

    if (actionType === "create_task") analytics.tasks += 1;
    if (actionType === "create_reminder") analytics.reminders += 1;
    if (actionType === "schedule_call") analytics.calls += 1;
    if (actionType === "send_email") analytics.emailDrafts += 1;
    if (actionType === "send_whatsapp") analytics.whatsappDrafts += 1;
  });

  return analytics;
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

function ExecutiveActionQueue({ scores = [], adminProfile = null, onActionExecuted = () => {} }) {
  const [executingKeys, setExecutingKeys] = useState({});
  const [executedKeys, setExecutedKeys] = useState({});
  const [approvedKeys, setApprovedKeys] = useState({});
  const [rejectedKeys, setRejectedKeys] = useState({});
  const [errors, setErrors] = useState({});
  const [filter, setFilter] = useState("all");

  const actionItems = useMemo(() => buildActionItems(scores), [scores]);

  const analytics = useMemo(
    () => buildQueueAnalytics(actionItems, executedKeys, approvedKeys, rejectedKeys),
    [actionItems, executedKeys, approvedKeys, rejectedKeys]
  );

  const filteredItems = useMemo(() => {
    if (filter === "all") return actionItems;

    return actionItems.filter((item) => {
      const priority = normalize(item.recommendation.priority);
      const actionType = normalize(item.template.actionType);

      if (filter === "approval") return item.requiresApproval && !approvedKeys[item.key];
      if (filter === "ready") return !item.requiresApproval || approvedKeys[item.key];
      if (filter === "executed") return executedKeys[item.key];
      if (filter === "critical") return priority === "critical";
      if (filter === "executive") return priority === "executive";
      if (filter === "communication") return ["send_email", "send_whatsapp"].includes(actionType);
      if (filter === "tasks") return ["create_task", "create_reminder", "schedule_call"].includes(actionType);

      return true;
    });
  }, [actionItems, filter, approvedKeys, executedKeys]);

  function approveAction(item) {
    if (executedKeys[item.key]) return;

    setApprovedKeys((prev) => {
      const next = { ...prev };
      if (next[item.key]) delete next[item.key];
      else next[item.key] = true;
      return next;
    });

    setRejectedKeys((prev) => {
      const next = { ...prev };
      delete next[item.key];
      return next;
    });

    setErrors((prev) => ({ ...prev, [item.key]: "" }));
  }

  function rejectAction(item) {
    if (executedKeys[item.key]) return;

    setRejectedKeys((prev) => {
      const next = { ...prev };
      if (next[item.key]) delete next[item.key];
      else next[item.key] = true;
      return next;
    });

    setApprovedKeys((prev) => {
      const next = { ...prev };
      delete next[item.key];
      return next;
    });

    setErrors((prev) => ({ ...prev, [item.key]: "" }));
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
        setErrors((prev) => ({
          ...prev,
          [item.key]: result.error.message || "Execution failed.",
        }));
        return;
      }

      setExecutedKeys((prev) => ({ ...prev, [item.key]: true }));
      setErrors((prev) => ({ ...prev, [item.key]: "" }));
      onActionExecuted(item);
    } catch (err) {
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
    <div className="rounded-[2rem] border border-[#D4AF37]/20 bg-[#D4AF37]/[0.04] p-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.25em] text-[#D4AF37]">
            Executive Action Queue V3
          </p>

          <h2 className="mt-2 text-2xl font-black text-white">
            Human-Approved Student OS Decision Queue
          </h2>

          <p className="mt-2 max-w-3xl text-sm leading-6 text-white/55">
            Converts Executive AI recommendations into controlled actions with approval,
            duplicate protection, execution state, and queue analytics.
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

      <div className="mt-5 flex flex-wrap gap-2">
        <FilterButton active={filter === "all"} onClick={() => setFilter("all")}>All</FilterButton>
        <FilterButton active={filter === "approval"} onClick={() => setFilter("approval")}>Approval</FilterButton>
        <FilterButton active={filter === "ready"} onClick={() => setFilter("ready")}>Ready</FilterButton>
        <FilterButton active={filter === "critical"} onClick={() => setFilter("critical")}>Critical</FilterButton>
        <FilterButton active={filter === "executive"} onClick={() => setFilter("executive")}>Executive</FilterButton>
        <FilterButton active={filter === "tasks"} onClick={() => setFilter("tasks")}>Tasks</FilterButton>
        <FilterButton active={filter === "communication"} onClick={() => setFilter("communication")}>Communication</FilterButton>
        <FilterButton active={filter === "executed"} onClick={() => setFilter("executed")}>Executed</FilterButton>
      </div>

      <div className="mt-6 space-y-3">
        {filteredItems.length ? (
          filteredItems.map((item) => (
            <ActionQueueCard
              key={item.key}
              item={item}
              executing={Boolean(executingKeys[item.key])}
              executed={Boolean(executedKeys[item.key])}
              approved={Boolean(approvedKeys[item.key])}
              rejected={Boolean(rejectedKeys[item.key])}
              error={errors[item.key]}
              onApprove={() => approveAction(item)}
              onReject={() => rejectAction(item)}
              onExecute={() => handleExecute(item)}
            />
          ))
        ) : (
          <div className="rounded-2xl border border-emerald-400/15 bg-emerald-500/[0.04] p-5">
            <p className="font-semibold text-emerald-200">
              No executive actions found for this filter.
            </p>
            <p className="mt-2 text-sm text-white/45">
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
    <div className={`rounded-2xl border p-4 ${style.wrapper}`}>
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-black text-white">{recommendation.title || template.title}</p>

            <Tag text={recommendation.priority || "medium"} className={style.badge} />
            <Tag text={formatLabel(studentStage)} />
            <Tag text={formatLabel(template.actionType)} />

            {requiresApproval ? (
              approved ? (
                <Tag text="Approved" className="border-emerald-400/25 bg-emerald-500/10 text-emerald-300" />
              ) : (
                <Tag text="Approval Required" className="border-[#D4AF37]/25 bg-[#D4AF37]/10 text-[#D4AF37]" />
              )
            ) : (
              <Tag text="Auto Ready" className="border-emerald-400/20 bg-emerald-500/10 text-emerald-300" />
            )}

            {rejected ? <Tag text="Rejected" className="border-red-400/25 bg-red-500/10 text-red-300" /> : null}
            {executed ? <Tag text="Executed" className="border-emerald-400/25 bg-emerald-500/10 text-emerald-300" /> : null}
          </div>

          <p className="mt-2 text-sm leading-6 text-white/55">
            {recommendation.description || template.description}
          </p>

          <p className="mt-3 text-xs leading-5 text-white/40">{reason}</p>

          <div className="mt-3 flex flex-wrap gap-2 text-[10px] font-black uppercase tracking-[0.14em]">
            <MiniStat label="Risk" value={score.risk_score || 0} />
            <MiniStat label="Opp" value={score.opportunity_score || 0} />
            <MiniStat label="Category" value={score.executive_category || "Standard"} />
            <MiniStat label="Impact" value={item.impactScore} />
          </div>

          <div className="mt-4 grid gap-3 xl:grid-cols-2">
            <PayloadSummary payload={template.payload || {}} />

            <div className="rounded-xl border border-white/10 bg-black/20 p-4">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/35">
                Student
              </p>

              <p className="mt-2 font-bold text-white">{getStudentName(score)}</p>

              <div className="mt-3 grid gap-1 text-xs leading-5 text-white/45">
                <p>Type: {formatLabel(getStudentType(score))}</p>
                <p>Stage: {formatLabel(studentStage)}</p>
                <p>Action: {formatLabel(actionType)}</p>
                <p>Priority: {recommendation.priority || "medium"}</p>
              </div>
            </div>
          </div>

          {error ? (
            <p className="mt-3 rounded-xl border border-red-400/20 bg-red-500/10 px-3 py-2 text-xs text-red-200">
              {error}
            </p>
          ) : null}

          {executed ? (
            <p className="mt-3 rounded-xl border border-emerald-400/20 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-200">
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
                className="rounded-full border border-emerald-400/25 bg-emerald-500/10 px-3 py-2 text-[10px] font-black uppercase tracking-[0.14em] text-emerald-300 transition hover:bg-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Approve
              </button>

              <button
                type="button"
                onClick={onReject}
                disabled={executed || executing}
                className="rounded-full border border-red-400/25 bg-red-500/10 px-3 py-2 text-[10px] font-black uppercase tracking-[0.14em] text-red-300 transition hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Reject
              </button>
            </div>
          ) : null}

          <button
            type="button"
            onClick={onExecute}
            disabled={!canExecute}
            className="rounded-full border border-[#D4AF37]/30 bg-[#D4AF37]/10 px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-[#D4AF37] transition hover:bg-[#D4AF37]/20 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {executed ? "Executed" : executing ? "Executing..." : "Execute"}
          </button>
        </div>
      </div>
    </div>
  );
}

function PayloadSummary({ payload = {} }) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/20 p-4">
      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/35">
        Prepared Payload
      </p>

      <div className="mt-3 grid gap-1 text-xs leading-5 text-white/45">
        <p>Student: {payload.student_name || "Unknown"}</p>
        <p>Journey: {formatLabel(payload.journey_stage || "not_started")}</p>
        <p>Recommendation: {formatLabel(payload.recommendation_type || "unknown")}</p>
        <p>Priority: {payload.recommendation_priority || payload.priority || "medium"}</p>
        <p>Due Date: {payload.due_date || "Not set"}</p>
      </div>
    </div>
  );
}

function QueueMetric({ label, value }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/35">
        {label}
      </p>
      <p className="mt-2 text-2xl font-black text-white">{value}</p>
    </div>
  );
}

function FilterButton({ active = false, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-4 py-2 text-xs font-black uppercase tracking-[0.14em] transition ${
        active
          ? "border-[#D4AF37]/30 bg-[#D4AF37]/10 text-[#D4AF37]"
          : "border-white/10 bg-black/20 text-white/45 hover:border-white/20 hover:text-white/70"
      }`}
    >
      {children}
    </button>
  );
}

function MiniStat({ label, value }) {
  return (
    <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-white/35">
      {label}: {value}
    </span>
  );
}

function Badge({ label, danger = false, gold = false, success = false }) {
  const style = danger
    ? "border-red-400/25 bg-red-500/10 text-red-300"
    : gold
    ? "border-[#D4AF37]/25 bg-[#D4AF37]/10 text-[#D4AF37]"
    : success
    ? "border-emerald-400/25 bg-emerald-500/10 text-emerald-300"
    : "border-white/10 bg-black/20 text-white/45";

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
        className || "border-white/10 bg-black/20 text-white/45"
      }`}
    >
      {text}
    </span>
  );
}

function getPriorityStyle(priority = "") {
  const clean = normalize(priority);

  if (clean === "critical") {
    return {
      wrapper: "border-red-400/25 bg-red-500/10",
      badge: "border-red-400/25 bg-red-500/10 text-red-200",
    };
  }

  if (clean === "executive") {
    return {
      wrapper: "border-[#D4AF37]/30 bg-[#D4AF37]/10",
      badge: "border-[#D4AF37]/25 bg-[#D4AF37]/10 text-[#D4AF37]",
    };
  }

  if (clean === "high") {
    return {
      wrapper: "border-orange-400/25 bg-orange-500/10",
      badge: "border-orange-400/25 bg-orange-500/10 text-orange-200",
    };
  }

  if (clean === "medium") {
    return {
      wrapper: "border-blue-400/25 bg-blue-500/10",
      badge: "border-blue-400/25 bg-blue-500/10 text-blue-200",
    };
  }

  return {
    wrapper: "border-white/10 bg-white/[0.03]",
    badge: "border-white/10 bg-black/20 text-white/45",
  };
}

export function buildExecutiveQueueAnalytics(scores = []) {
  const rows = Array.isArray(scores) ? scores : [];
  const items = buildActionItems(rows);

  return {
    ...buildQueueAnalytics(items),
    totalStudents: rows.length,
    highImpactActions: items.filter((item) => item.impactScore >= 120).length,
    approvalRate: items.length
      ? Math.round((items.filter((item) => item.requiresApproval).length / items.length) * 100)
      : 0,
  };
}

export default ExecutiveActionQueue;