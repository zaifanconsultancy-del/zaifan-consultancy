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

function getJourneyStage(score = {}) {
  const directStage = normalize(score.journey_stage || score?.diagnostics?.journey_stage);
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
    ["offer_accepted", "accepted"].includes(applicationStatus) ||
    ["offer_accepted", "accepted"].includes(offerStatus)
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

function getActionReason(score = {}, recommendation = {}, template = {}) {
  const category = score.executive_category || "Standard";
  const summary = score.summary || recommendation.description || "No executive summary available.";
  const action = template.actionType || recommendation.action || "review";

  return `${category}: ${summary} Recommended action: ${formatLabel(action)}.`;
}

function approvalRequired(recommendation = {}, template = {}) {
  const priority = normalize(recommendation.priority);
  return (
    priority === "critical" ||
    priority === "executive" ||
    template?.payload?.approval_required === true
  );
}

function ExecutiveActionQueue({ scores = [], adminProfile = null }) {
  const [executingKey, setExecutingKey] = useState("");
  const [executedKeys, setExecutedKeys] = useState({});
  const [errors, setErrors] = useState({});

  const actionItems = useMemo(() => {
    return (scores || [])
      .flatMap((score) => {
        const recommendations = buildExecutiveRecommendations(score);

        return recommendations
          .filter((recommendation) => normalize(recommendation.action) !== "none")
          .map((recommendation) => {
            const template = buildExecutiveActionTemplate(score, recommendation);
            const key = `${score.student_id || score.id}-${score.student_type || "student"}-${
              recommendation.type
            }-${template.actionType}`;

            return {
              key,
              score,
              recommendation,
              template,
              studentStage: getJourneyStage(score),
              reason: getActionReason(score, recommendation, template),
              requiresApproval: approvalRequired(recommendation, template),
              priorityRank: getPriorityRank(recommendation.priority),
              impactScore:
                number(score.risk_score) +
                number(score.opportunity_score) +
                getPriorityRank(recommendation.priority) * 10,
            };
          });
      })
      .sort((a, b) => {
        if (b.priorityRank !== a.priorityRank) return b.priorityRank - a.priorityRank;
        return b.impactScore - a.impactScore;
      })
      .slice(0, 15);
  }, [scores]);

  const criticalCount = actionItems.filter(
    (item) => normalize(item.recommendation.priority) === "critical"
  ).length;

  const executiveCount = actionItems.filter(
    (item) => normalize(item.recommendation.priority) === "executive"
  ).length;

  const approvalCount = actionItems.filter((item) => item.requiresApproval).length;
  const readyCount = actionItems.filter((item) => !item.requiresApproval).length;

  async function handleExecute(item) {
    setExecutingKey(item.key);
    setErrors((prev) => ({ ...prev, [item.key]: "" }));

    const { error } = await executeExecutiveActionTemplate({
      template: item.template,
      adminProfile,
    });

    if (error) {
      setErrors((prev) => ({
        ...prev,
        [item.key]: error.message || "Execution failed.",
      }));
    } else {
      setExecutedKeys((prev) => ({
        ...prev,
        [item.key]: true,
      }));
    }

    setExecutingKey("");
  }

  return (
    <div className="rounded-[2rem] border border-[#D4AF37]/20 bg-[#D4AF37]/[0.04] p-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.25em] text-[#D4AF37]">
            Executive Action Queue
          </p>

          <h2 className="mt-2 text-2xl font-black text-white">
            Student OS Decision Queue
          </h2>

          <p className="mt-2 max-w-3xl text-sm leading-6 text-white/55">
            Human-approved execution queue for tasks, reminders, calls, email
            drafts, and WhatsApp drafts generated from Executive AI.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Badge label={`${actionItems.length} Actions`} />
          <Badge label={`${criticalCount} Critical`} danger />
          <Badge label={`${executiveCount} Executive`} gold />
          <Badge label={`${approvalCount} Approval`} gold />
          <Badge label={`${readyCount} Ready`} success />
        </div>
      </div>

      <div className="mt-6 space-y-3">
        {actionItems.length ? (
          actionItems.map((item) => (
            <ActionQueueCard
              key={item.key}
              item={item}
              executing={executingKey === item.key}
              executed={executedKeys[item.key]}
              error={errors[item.key]}
              onExecute={() => handleExecute(item)}
            />
          ))
        ) : (
          <div className="rounded-2xl border border-emerald-400/15 bg-emerald-500/[0.04] p-5">
            <p className="font-semibold text-emerald-200">
              No executive actions required right now.
            </p>
            <p className="mt-2 text-sm text-white/45">
              Executive AI does not currently see tasks, reminders, calls, or
              communication drafts that need action.
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
  error = "",
  onExecute,
}) {
  const { score, recommendation, template, studentStage, reason, requiresApproval } = item;
  const style = getPriorityStyle(recommendation.priority);

  return (
    <div className={`rounded-2xl border p-4 ${style.wrapper}`}>
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-black text-white">{recommendation.title}</p>

            <span className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] ${style.badge}`}>
              {recommendation.priority}
            </span>

            <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-white/45">
              {formatLabel(studentStage)}
            </span>

            {requiresApproval ? (
              <span className="rounded-full border border-[#D4AF37]/25 bg-[#D4AF37]/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-[#D4AF37]">
                Approval Required
              </span>
            ) : (
              <span className="rounded-full border border-emerald-400/20 bg-emerald-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-emerald-300">
                Ready
              </span>
            )}
          </div>

          <p className="mt-2 text-sm leading-6 text-white/55">
            {recommendation.description}
          </p>

          <p className="mt-3 text-xs leading-5 text-white/40">{reason}</p>

          <div className="mt-3 flex flex-wrap gap-2 text-[10px] font-black uppercase tracking-[0.14em]">
            <MiniStat label="Risk" value={score.risk_score || 0} />
            <MiniStat label="Opp" value={score.opportunity_score || 0} />
            <MiniStat label="Action" value={formatLabel(template.actionType)} />
            <MiniStat label="Category" value={score.executive_category || "Standard"} />
          </div>

          <p className="mt-3 text-xs text-white/35">
            {getStudentName(score)} • {score.student_type || "student"}
          </p>

          {error ? (
            <p className="mt-3 rounded-xl border border-red-400/20 bg-red-500/10 px-3 py-2 text-xs text-red-200">
              {error}
            </p>
          ) : null}

          {executed ? (
            <p className="mt-3 rounded-xl border border-emerald-400/20 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-200">
              Action executed successfully.
            </p>
          ) : null}
        </div>

        <div className="flex shrink-0 flex-col gap-2">
          <span className="rounded-full border border-white/10 bg-black/20 px-4 py-2 text-center text-xs font-black uppercase tracking-[0.16em] text-white/50">
            {formatLabel(template.actionType)}
          </span>

          <button
            type="button"
            onClick={onExecute}
            disabled={executing || executed}
            className="rounded-full border border-[#D4AF37]/30 bg-[#D4AF37]/10 px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-[#D4AF37] transition hover:bg-[#D4AF37]/20 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {executed ? "Executed" : executing ? "Executing..." : "Execute"}
          </button>
        </div>
      </div>
    </div>
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

export default ExecutiveActionQueue;