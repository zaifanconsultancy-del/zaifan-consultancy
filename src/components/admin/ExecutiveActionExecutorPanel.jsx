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
    <div className="rounded-[2rem] border-2 border-[#E9802D]/40 bg-[#FFFDF8] p-5 shadow-[0_20px_55px_rgba(23,36,61,0.08)] sm:p-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.25em] text-[#B84F0E]">
            Executive Action Executor
          </p>

          <h2 className="mt-2 text-2xl font-black text-[#17243D]">
            Human-Approved Student OS Execution
          </h2>

          <p className="mt-2 max-w-3xl text-sm leading-6 text-[#667085]">
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
        <div className="mt-5 rounded-2xl border border-[#E9802D]/32 bg-[#FFF1E3] p-4 text-sm text-[#B84F0E]">
          {message}
        </div>
      ) : null}

      {error ? (
        <div className="mt-5 rounded-2xl border border-[#C2413B]/30 bg-[#FFF0EE] p-4 text-sm text-[#A8342F]">
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
          <div className="rounded-2xl border border-[#E9802D]/28 bg-[#FFF1E3] p-5">
            <p className="font-semibold text-[#B84F0E]">
              No executive actions ready.
            </p>
            <p className="mt-2 text-sm text-[#7A8392]">
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
    <div className={`rounded-2xl border p-4 shadow-[0_8px_20px_rgba(23,36,61,0.045)] ${style.wrapper}`}>
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-black text-[#17243D]">{template.title}</p>

            <Tag text={recommendation.priority} className={style.badge} />
            <Tag text={formatLabel(template.actionType)} />
            <Tag text={formatLabel(studentStage)} />

            {requiresApproval ? (
              <Tag
                text="Approval Required"
                className="border-[#E9802D]/40 bg-[#FFF1E3] text-[#B84F0E]"
              />
            ) : (
              <Tag
                text="Ready"
                className="border-[#E9802D]/32 bg-[#FFF1E3] text-[#B84F0E]"
              />
            )}

            {executed ? (
              <Tag
                text="Executed"
                className="border-[#E9802D]/32 bg-[#FFF1E3] text-[#B84F0E]"
              />
            ) : null}
          </div>

          <p className="mt-2 text-sm leading-6 text-[#667085]">
            {template.description}
          </p>

          <p className="mt-3 text-xs leading-5 text-[#7A8392]">
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

          <p className="mt-3 text-xs text-[#8992A1]">
            {getStudentName(score)} • {score.student_type || "student"}
          </p>
        </div>

        <button
          type="button"
          onClick={onExecute}
          disabled={disabled || executed}
          className="shrink-0 rounded-full border border-[#E9802D] bg-[#E9802D] px-5 py-2 text-xs font-black text-white shadow-[0_8px_18px_rgba(233,128,45,0.18)] transition hover:-translate-y-0.5 hover:bg-[#D96C1F] disabled:cursor-not-allowed disabled:opacity-50"
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