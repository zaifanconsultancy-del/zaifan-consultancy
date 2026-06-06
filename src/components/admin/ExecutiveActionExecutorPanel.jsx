import { useMemo, useState } from "react";
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

  const executeAction = async (item) => {
    if (!item?.template || executingKey || executedKeys[item.key]) return;

    const confirmed = window.confirm(
      `Execute this executive action?\n\n${item.template.title}`
    );

    if (!confirmed) return;

    setExecutingKey(item.key);
    setMessage("");
    setError("");

    try {
      const { error } = await executeExecutiveActionTemplate({
        template: item.template,
        adminProfile,
      });

      if (error) {
        setError(error.message || "Executive action failed.");
        return;
      }

      setExecutedKeys((prev) => ({ ...prev, [item.key]: true }));
      setMessage(`Executed: ${item.template.title}`);
      onActionExecuted(item);
    } catch (err) {
      setError(err.message || "Executive action crashed.");
    } finally {
      setExecutingKey("");
    }
  };

  return (
    <div className="rounded-[2rem] border border-emerald-400/20 bg-emerald-500/[0.04] p-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.25em] text-emerald-300">
            Executive Action Executor
          </p>

          <h2 className="mt-2 text-2xl font-black text-white">
            Human-Approved Student OS Execution
          </h2>

          <p className="mt-2 max-w-3xl text-sm leading-6 text-white/55">
            Convert executive recommendations into tasks, reminders, call tasks,
            email drafts, WhatsApp drafts, and timeline records.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Badge label={`${actionItems.length} Ready`} success />
          <Badge label={`${criticalReady} Critical`} danger />
          <Badge label={`${executiveReady} Executive`} gold />
          <Badge label={`${approvalCount} Approval`} gold />
          <Badge label={`${alreadyExecutedCount} Done`} />
        </div>
      </div>

      {message ? (
        <div className="mt-5 rounded-2xl border border-emerald-400/20 bg-emerald-500/10 p-4 text-sm text-emerald-300">
          {message}
        </div>
      ) : null}

      {error ? (
        <div className="mt-5 rounded-2xl border border-red-400/20 bg-red-500/10 p-4 text-sm text-red-300">
          {error}
        </div>
      ) : null}

      <div className="mt-6 space-y-3">
        {actionItems.length ? (
          actionItems.map((item) => (
            <ExecutorCard
              key={item.key}
              item={item}
              executing={executingKey === item.key}
              executed={executedKeys[item.key]}
              disabled={Boolean(executingKey)}
              onExecute={() => executeAction(item)}
            />
          ))
        ) : (
          <div className="rounded-2xl border border-emerald-400/15 bg-emerald-500/[0.04] p-5">
            <p className="font-semibold text-emerald-200">
              No executive actions ready.
            </p>
            <p className="mt-2 text-sm text-white/45">
              Executive AI does not currently see executable tasks, reminders,
              calls, email drafts, or WhatsApp drafts.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function ExecutorCard({ item, executing, executed, disabled, onExecute }) {
  const { score, recommendation, template, studentStage, requiresApproval } = item;
  const style = getPriorityStyle(recommendation.priority);

  return (
    <div className={`rounded-2xl border p-4 ${style.wrapper}`}>
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-black text-white">{template.title}</p>

            <Tag text={recommendation.priority} className={style.badge} />
            <Tag text={formatLabel(template.actionType)} />
            <Tag text={formatLabel(studentStage)} />

            {requiresApproval ? (
              <Tag
                text="Approval Required"
                className="border-[#D4AF37]/25 bg-[#D4AF37]/10 text-[#D4AF37]"
              />
            ) : (
              <Tag
                text="Ready"
                className="border-emerald-400/20 bg-emerald-500/10 text-emerald-300"
              />
            )}

            {executed ? (
              <Tag
                text="Executed"
                className="border-emerald-400/20 bg-emerald-500/10 text-emerald-300"
              />
            ) : null}
          </div>

          <p className="mt-2 text-sm leading-6 text-white/55">
            {template.description}
          </p>

          <p className="mt-3 text-xs leading-5 text-white/40">
            {template.payload?.summary ||
              recommendation.description ||
              "Executive action generated from student intelligence."}
          </p>

          <div className="mt-3 flex flex-wrap gap-2">
            <MiniStat label="Risk" value={score.risk_score || 0} />
            <MiniStat label="Opportunity" value={score.opportunity_score || 0} />
            <MiniStat label="Category" value={score.executive_category || "Standard"} />
            <MiniStat label="Journey" value={formatLabel(studentStage)} />
          </div>

          <p className="mt-3 text-xs text-white/35">
            {getStudentName(score)} • {score.student_type || "student"}
          </p>
        </div>

        <button
          type="button"
          onClick={onExecute}
          disabled={disabled || executed}
          className="shrink-0 rounded-full bg-[#D4AF37] px-5 py-2 text-xs font-black text-black transition hover:-translate-y-0.5 hover:bg-[#E7C768] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {executed ? "Executed" : executing ? "Executing..." : getExecuteLabel(template.actionType)}
        </button>
      </div>
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
      className={`rounded-full border border-white/10 bg-black/20 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-white/45 ${className}`}
    >
      {text}
    </span>
  );
}

function MiniStat({ label, value }) {
  return (
    <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-white/45">
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
