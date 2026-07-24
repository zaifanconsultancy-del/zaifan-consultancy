import { useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  Crown,
  Play,
  ShieldCheck,
  Sparkles,
  Target,
  X,
  Zap,
} from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { buildExecutiveRecommendations } from "../../lib/executiveRecommendations";
import { buildExecutiveActionTemplate } from "../../lib/executiveActionTemplates";
import { executeExecutiveActionTemplate } from "../../lib/executiveActionExecutor";

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

function getStudentName(score = {}) {
  return score.student_name || score.full_name || score.name || "Unknown Student";
}

function getStudentKey(score = {}) {
  return `${score.student_id || score.id || getStudentName(score)}-${
    score.student_type || score.__leadType || score.type || "student"
  }`;
}

function getJourneyStage(score = {}, template = {}) {
  const direct =
    normalize(score.journey_stage) ||
    normalize(score?.diagnostics?.journey_stage) ||
    normalize(template?.payload?.journey_stage);

  if (direct) return direct;

  const app = normalize(score.application_status);
  const visa = normalize(score.visa_status);
  const offer = normalize(score.offer_status);

  if (app === "enrolled") return "enrolled";
  if (["visa_approved", "approved"].includes(visa)) return "visa_approved";
  if (["visa_rejected", "rejected", "refused", "visa_refused"].includes(visa)) {
    return "visa_rejected";
  }
  if (["visa_pending", "pending", "submitted", "under_review", "review"].includes(visa)) {
    return "visa_pending";
  }
  if (app === "cas_issued") return "cas_issued";
  if (app === "cas_pending") return "cas_pending";
  if (["offer_accepted", "accepted"].includes(offer) || ["offer_accepted", "accepted"].includes(app)) {
    return "offer_accepted";
  }
  if (["offer_received", "received", "offer"].includes(offer) || ["offer_received", "offer"].includes(app)) {
    return "offer_received";
  }
  if (["under_review", "review"].includes(app)) return "application_under_review";
  if (["applied", "submitted"].includes(app)) return "application_submitted";

  return "not_started";
}

function approvalRequired(recommendation = {}, template = {}) {
  const priority = normalize(recommendation.priority);
  return (
    priority === "critical" ||
    priority === "executive" ||
    template?.payload?.approval_required === true
  );
}

function ExecutiveActionExecutorPanel({
  scores = [],
  adminProfile = null,
  onActionExecuted = () => {},
}) {
  const [executingKey, setExecutingKey] = useState("");
  const [executedKeys, setExecutedKeys] = useState({});
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [pendingApprovalItem, setPendingApprovalItem] = useState(null);

  const actionItems = useMemo(() => {
    const rawItems = (scores || []).flatMap((score) => {
      const recommendations = buildExecutiveRecommendations(score);

      return recommendations
        .filter((recommendation) => normalize(recommendation.action) !== "none")
        .map((recommendation) => {
          const template = buildExecutiveActionTemplate(score, recommendation);
          const studentStage = getJourneyStage(score, template);

          return {
            score,
            recommendation,
            template,
            studentStage,
            requiresApproval: approvalRequired(recommendation, template),
            priorityRank: getPriorityRank(recommendation.priority),
            impactScore:
              number(score.risk_score) +
              number(score.opportunity_score) +
              getPriorityRank(recommendation.priority) * 10,
            key: `${getStudentKey(score)}-${recommendation.type}-${template.actionType}`,
          };
        });
    });

    const deduped = new Map();

    rawItems.forEach((item) => {
      const dedupeKey = `${getStudentKey(item.score)}-${item.recommendation.type}`;
      const existing = deduped.get(dedupeKey);

      if (!existing) {
        deduped.set(dedupeKey, item);
        return;
      }

      const existingAppointment = normalize(existing.score.student_type) === "appointment";
      const currentAppointment = normalize(item.score.student_type) === "appointment";

      if (!existingAppointment && currentAppointment) {
        deduped.set(dedupeKey, item);
        return;
      }

      if (item.impactScore > existing.impactScore) {
        deduped.set(dedupeKey, item);
      }
    });

    return [...deduped.values()]
      .sort((a, b) => {
        if (b.priorityRank !== a.priorityRank) return b.priorityRank - a.priorityRank;
        return b.impactScore - a.impactScore;
      })
      .slice(0, 15);
  }, [scores]);

  const criticalReady = actionItems.filter(
    (item) => normalize(item.recommendation.priority) === "critical"
  ).length;

  const executiveReady = actionItems.filter(
    (item) => normalize(item.recommendation.priority) === "executive"
  ).length;

  const approvalCount = actionItems.filter((item) => item.requiresApproval).length;
  const alreadyExecutedCount = Object.keys(executedKeys).length;

  const executeAction = async (item, approved = false) => {
    if (!item?.template || executingKey || executedKeys[item.key]) return;

    if (item.requiresApproval && !approved) {
      setPendingApprovalItem(item);
      setMessage("");
      setError("");
      return;
    }

    setPendingApprovalItem(null);
    setExecutingKey(item.key);
    setMessage("");
    setError("");

    try {
      const result = await executeExecutiveActionTemplate({
        template: item.template,
        adminProfile,
      });

      if (result?.error) {
        setError(result.error.message || "Executive action failed.");
        return;
      }

      setExecutedKeys((prev) => ({ ...prev, [item.key]: true }));
      setMessage(`Executed successfully: ${item.template.title}`);

      if (typeof onActionExecuted === "function") {
        await onActionExecuted(item);
      }
    } catch (err) {
      console.error("Executive action execution failed:", err);
      setError(err?.message || "Executive action crashed.");
    } finally {
      setExecutingKey("");
    }
  };

  const reduceMotion = useReducedMotion();

  return (
    <motion.section
      initial={reduceMotion ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reduceMotion ? 0 : 0.28 }}
      className="overflow-hidden rounded-[2rem] border-[3px] border-orange-300 bg-[#fff8ee] shadow-[0_18px_50px_rgba(15,35,63,0.08)]"
    >
      <div className="grid xl:grid-cols-[1.25fr_0.75fr]">
        <div className="bg-[#123865] p-5 text-white sm:p-6">
          <div className="flex flex-wrap items-center gap-2">
            <HeaderPill icon={Crown}>Executive Action Executor</HeaderPill>
            <HeaderPill icon={ShieldCheck}>Human Approval Layer</HeaderPill>
          </div>

          <h2 className="mt-4 text-2xl font-black text-white sm:text-3xl">
            Student OS Execution Queue
          </h2>

          <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-white">
            Turn executive recommendations into controlled operational actions.
            Critical and executive actions stop for human approval before the
            executor is allowed to run them.
          </p>

          <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
            <DarkStat label="Ready" value={actionItems.length} />
            <DarkStat label="Critical" value={criticalReady} />
            <DarkStat label="Approval" value={approvalCount} />
            <DarkStat label="Executed" value={alreadyExecutedCount} />
          </div>
        </div>

        <div className="bg-orange-500 p-5 text-white sm:p-6">
          <p className="text-[9px] font-black uppercase tracking-[0.14em] text-white">
            Execution Control
          </p>

          <p className="mt-3 text-2xl font-black text-white">
            {executingKey ? "Action Running" : "Queue Ready"}
          </p>

          <p className="mt-2 text-sm font-semibold leading-6 text-white">
            {executingKey
              ? "One action is executing. Other execution controls stay locked until it finishes."
              : approvalCount
              ? `${approvalCount} action${approvalCount === 1 ? "" : "s"} require explicit approval.`
              : "No approval-gated actions are waiting."}
          </p>

          <div className="mt-4 rounded-xl border-2 border-white/25 bg-white/10 p-3">
            <p className="text-[8px] font-black uppercase tracking-[0.1em] text-white">
              Executive Priority
            </p>
            <p className="mt-1 text-base font-black text-white">
              {criticalReady
                ? `${criticalReady} critical`
                : executiveReady
                ? `${executiveReady} executive`
                : "Normal queue"}
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-4 p-4 sm:p-5">
        {message ? (
          <StatusBanner
            tone="success"
            message={message}
            onClose={() => setMessage("")}
          />
        ) : null}

        {error ? (
          <StatusBanner
            tone="error"
            message={error}
            onClose={() => setError("")}
          />
        ) : null}

        {pendingApprovalItem ? (
          <div className="rounded-[1.4rem] border-[3px] border-orange-400 bg-orange-50 p-4 shadow-[0_10px_24px_rgba(249,115,22,0.08)]">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-start gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border-2 border-orange-300 bg-white text-orange-700">
                  <ShieldCheck size={20} />
                </span>
                <div>
                  <p className="text-[9px] font-black uppercase tracking-[0.12em] text-orange-800">
                    Approval Required
                  </p>
                  <h3 className="mt-1 font-black text-[#10233f]">
                    {pendingApprovalItem.template.title}
                  </h3>
                  <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">
                    Review this action before allowing the executor to write the operational record.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setPendingApprovalItem(null)}
                  className="inline-flex min-h-10 items-center gap-2 rounded-xl border-2 border-slate-300 bg-white px-4 text-xs font-black text-slate-700 transition hover:border-slate-400"
                >
                  <X size={14} />
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={() => executeAction(pendingApprovalItem, true)}
                  disabled={Boolean(executingKey)}
                  className="inline-flex min-h-10 items-center gap-2 rounded-xl border-2 border-orange-600 bg-orange-500 px-4 text-xs font-black text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <ShieldCheck size={14} />
                  Approve & Execute
                </button>
              </div>
            </div>
          </div>
        ) : null}

        <div className="flex flex-col gap-3 rounded-[1.4rem] border-[3px] border-slate-300 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.12em] text-orange-700">
              Ranked Action Queue
            </p>
            <p className="mt-1 text-sm font-black text-[#10233f]">
              Highest-risk and highest-opportunity actions appear first.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <QueueBadge icon={Zap} label={`${criticalReady} Critical`} tone="danger" />
            <QueueBadge icon={Crown} label={`${executiveReady} Executive`} tone="orange" />
            <QueueBadge icon={ShieldCheck} label={`${approvalCount} Approval`} tone="navy" />
            <QueueBadge icon={CheckCircle2} label={`${alreadyExecutedCount} Done`} tone="success" />
          </div>
        </div>

        <div className="space-y-3">
          {actionItems.length ? (
            actionItems.map((item, index) => (
              <ExecutorCard
                key={item.key}
                item={item}
                index={index}
                executing={executingKey === item.key}
                executed={Boolean(executedKeys[item.key])}
                disabled={Boolean(executingKey)}
                onExecute={() => executeAction(item)}
              />
            ))
          ) : (
            <div className="rounded-[1.5rem] border-[3px] border-orange-300 bg-white p-7 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl border-2 border-orange-300 bg-orange-50 text-orange-700">
                <Sparkles size={23} />
              </div>
              <p className="mt-4 font-black text-[#10233f]">
                No executive actions ready
              </p>
              <p className="mx-auto mt-2 max-w-xl text-sm font-semibold leading-6 text-slate-600">
                Executive intelligence does not currently see an executable task,
                reminder, call task, email draft, or WhatsApp draft.
              </p>
            </div>
          )}
        </div>
      </div>
    </motion.section>
  );
}

function ExecutorCard({
  item,
  index,
  executing,
  executed,
  disabled,
  onExecute,
}) {
  const {
    score,
    recommendation,
    template,
    studentStage,
    requiresApproval,
  } = item;

  const style = getPriorityStyle(recommendation.priority);

  return (
    <motion.article
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, delay: Math.min(index * 0.025, 0.18) }}
      className={`rounded-[1.45rem] border-[3px] p-4 shadow-[0_8px_22px_rgba(15,35,63,0.045)] ${style.wrapper}`}
    >
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg border-2 border-slate-300 bg-white text-xs font-black text-[#10233f]">
              {index + 1}
            </span>

            <p className="font-black text-[#10233f]">{template.title}</p>

            <Tag text={recommendation.priority} className={style.badge} />
            <Tag text={formatLabel(template.actionType)} />
            <Tag text={formatLabel(studentStage)} />

            {requiresApproval ? (
              <Tag
                text="Approval Required"
                className="border-orange-300 bg-orange-50 text-orange-800"
              />
            ) : (
              <Tag
                text="Ready"
                className="border-emerald-300 bg-emerald-50 text-emerald-800"
              />
            )}

            {executed ? (
              <Tag
                text="Executed"
                className="border-emerald-300 bg-emerald-50 text-emerald-800"
              />
            ) : null}
          </div>

          <p className="mt-3 text-sm font-semibold leading-6 text-slate-700">
            {template.description}
          </p>

          <div className="mt-3 rounded-xl border-2 border-slate-300 bg-white p-3">
            <p className="text-[9px] font-black uppercase tracking-[0.1em] text-slate-500">
              Why this action exists
            </p>
            <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">
              {template.payload?.summary ||
                recommendation.description ||
                "Executive action generated from student intelligence."}
            </p>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
            <MetricTile label="Risk" value={score.risk_score || 0} icon={AlertTriangle} />
            <MetricTile label="Opportunity" value={score.opportunity_score || 0} icon={Target} />
            <MetricTile label="Category" value={score.executive_category || "Standard"} icon={Crown} />
            <MetricTile label="Journey" value={formatLabel(studentStage)} icon={Clock3} />
          </div>

          <p className="mt-3 text-xs font-bold text-slate-500">
            {getStudentName(score)} • {score.student_type || "student"}
          </p>
        </div>

        <button
          type="button"
          onClick={onExecute}
          disabled={disabled || executed}
          className={`inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl border-2 px-5 text-xs font-black transition disabled:cursor-not-allowed disabled:opacity-50 ${
            requiresApproval
              ? "border-[#123865] bg-[#123865] text-white hover:bg-[#0d2d54]"
              : "border-orange-600 bg-orange-500 text-white shadow-[0_8px_18px_rgba(249,115,22,0.16)] hover:-translate-y-0.5 hover:bg-orange-600"
          }`}
        >
          {executed ? (
            <CheckCircle2 size={14} />
          ) : requiresApproval ? (
            <ShieldCheck size={14} />
          ) : (
            <Play size={14} />
          )}

          {executed
            ? "Executed"
            : executing
            ? "Executing..."
            : requiresApproval
            ? "Review & Approve"
            : getExecuteLabel(template.actionType)}
        </button>
      </div>
    </motion.article>
  );
}

function MetricTile({ label, value, icon: Icon }) {
  return (
    <div className="rounded-xl border-2 border-slate-300 bg-white p-3">
      <div className="flex items-center gap-1.5">
        <Icon size={12} className="text-orange-700" />
        <p className="text-[8px] font-black uppercase tracking-[0.08em] text-slate-500">
          {label}
        </p>
      </div>
      <p className="mt-1 truncate text-xs font-black text-[#10233f]" title={String(value)}>
        {value}
      </p>
    </div>
  );
}

function HeaderPill({ icon: Icon, children }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border-2 border-white/20 bg-white/10 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.1em] text-white">
      <Icon size={11} />
      {children}
    </span>
  );
}

function DarkStat({ label, value }) {
  return (
    <div className="rounded-xl border-2 border-white/20 bg-white/10 p-3 text-white">
      <p className="text-[8px] font-black uppercase tracking-[0.1em] text-white">
        {label}
      </p>
      <p className="mt-1 text-xl font-black text-white">{value}</p>
    </div>
  );
}

function QueueBadge({ icon: Icon, label, tone = "orange" }) {
  const style =
    tone === "danger"
      ? "border-red-300 bg-red-50 text-red-800"
      : tone === "success"
      ? "border-emerald-300 bg-emerald-50 text-emerald-800"
      : tone === "navy"
      ? "border-[#123865] bg-[#123865] text-white"
      : "border-orange-300 bg-orange-50 text-orange-800";

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border-2 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.08em] ${style}`}>
      <Icon size={11} />
      {label}
    </span>
  );
}

function StatusBanner({ tone, message, onClose }) {
  const success = tone === "success";

  return (
    <div
      role={success ? "status" : "alert"}
      className={`flex items-start gap-3 rounded-xl border-[3px] p-4 ${
        success
          ? "border-emerald-300 bg-emerald-50 text-emerald-900"
          : "border-red-300 bg-red-50 text-red-900"
      }`}
    >
      {success ? (
        <CheckCircle2 size={17} className="mt-0.5 shrink-0" />
      ) : (
        <AlertTriangle size={17} className="mt-0.5 shrink-0" />
      )}

      <p className="min-w-0 flex-1 text-sm font-bold">{message}</p>

      <button type="button" onClick={onClose} aria-label="Dismiss message">
        <X size={15} />
      </button>
    </div>
  );
}

function getExecuteLabel(actionType = "") {
  const clean = normalize(actionType);

  if (clean === "create_task") return "Create Task";
  if (clean === "schedule_call") return "Create Call Task";
  if (clean === "create_reminder") return "Create Reminder";
  if (clean === "send_email") return "Save Email Draft";
  if (clean === "send_whatsapp") return "Save WhatsApp Draft";

  return "Execute";
}

function Tag({ text, className = "" }) {
  return (
    <span
      className={`rounded-full border border-[#243A60]/18 bg-white px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-[#7A8392] ${className}`}
    >
      {text}
    </span>
  );
}

function MiniStat({ label, value }) {
  return (
    <span className="rounded-full border border-[#243A60]/18 bg-white px-3 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-[#7A8392]">
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

function getPriorityRank(priority = "") {
  const clean = normalize(priority);

  if (clean === "critical") return 5;
  if (clean === "executive") return 4;
  if (clean === "high") return 3;
  if (clean === "medium") return 2;
  if (clean === "low") return 1;

  return 0;
}

function getPriorityStyle(priority = "") {
  const clean = normalize(priority);

  if (clean === "critical") {
    return {
      wrapper: "border-red-300 bg-red-50",
      badge: "border-[#C2413B]/32 bg-[#FFF0EE] text-[#A8342F]",
    };
  }

  if (clean === "executive") {
    return {
      wrapper: "border-orange-400 bg-orange-50",
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
      wrapper: "border-slate-300 bg-slate-50",
      badge: "border-[#243A60]/25 bg-[#F3F5F8] text-[#243A60]",
    };
  }

  return {
    wrapper: "border-slate-300 bg-white",
    badge: "border-[#243A60]/18 bg-white text-[#7A8392]",
  };
}

function formatLabel(value = "") {
  const clean = normalize(value);
  if (!clean) return "Unknown";

  return clean
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export default ExecutiveActionExecutorPanel;

/* ========================================================================
   EXECUTIVE AUTOMATION ENGINE V2 - SAFE ADDITIVE HELPERS
   Added cleanly by ChatGPT. No escaped \n tokens, no raw-string corruption, and
   no removal of the original file above.
   ======================================================================== */
export function buildExecutorPanelSummary(scores = [], executedKeys = {}) {
  const rows = Array.isArray(scores) ? scores : [];
  const executedCount = Object.keys(executedKeys || {}).length;
  let availableActions = 0;
  let approvalActions = 0;
  let immediateActions = 0;

  rows.forEach((score) => {
    buildExecutiveRecommendations(score)
      .filter((recommendation) => normalize(recommendation.action) !== "none")
      .forEach((recommendation) => {
        const template = buildExecutiveActionTemplate(score, recommendation);
        availableActions += 1;
        if (approvalRequired(recommendation, template)) approvalActions += 1;
        else immediateActions += 1;
      });
  });

  return {
    availableActions,
    approvalActions,
    immediateActions,
    executedCount,
    remainingActions: Math.max(0, availableActions - executedCount),
  };
}