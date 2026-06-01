import { useMemo, useState } from "react";
import { buildExecutiveRecommendations } from "../../lib/executiveRecommendations";
import { buildExecutiveActionTemplate } from "../../lib/executiveActionTemplates";
import { executeExecutiveActionTemplate } from "../../lib/executiveActionExecutor";

function ExecutiveActionExecutorPanel({
  scores = [],
  adminProfile = null,
  onActionExecuted = () => {},
}) {
  const [executingKey, setExecutingKey] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const actionItems = useMemo(() => {
    return (scores || [])
      .flatMap((score) => {
        const recommendations = buildExecutiveRecommendations(score);

        return recommendations
          .filter((recommendation) => recommendation.action !== "none")
          .map((recommendation) => {
            const template = buildExecutiveActionTemplate(
              score,
              recommendation
            );

            return {
              score,
              recommendation,
              template,
              key: `${score.student_id}-${score.student_type}-${recommendation.type}`,
            };
          });
      })
      .sort((a, b) => {
        return getPriorityRank(b.recommendation.priority) -
          getPriorityRank(a.recommendation.priority);
      })
      .slice(0, 12);
  }, [scores]);

  const executeAction = async (item) => {
    if (!item?.template || executingKey) return;

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

      setMessage("Executive action executed successfully.");
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
            Human-Approved CRM Execution
          </h2>

          <p className="mt-2 max-w-3xl text-sm leading-6 text-white/55">
            Convert executive recommendations into CRM records with one click.
            Every action is logged into the student timeline.
          </p>
        </div>

        <span className="rounded-full border border-emerald-400/25 bg-emerald-500/10 px-4 py-2 text-xs font-bold text-emerald-300">
          {actionItems.length} Ready
        </span>
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
              disabled={Boolean(executingKey)}
              onExecute={() => executeAction(item)}
            />
          ))
        ) : (
          <div className="rounded-2xl border border-white/10 bg-black/20 p-5 text-sm text-white/40">
            No executive actions ready.
          </div>
        )}
      </div>
    </div>
  );
}

function ExecutorCard({ item, executing, disabled, onExecute }) {
  const { score, recommendation, template } = item;
  const style = getPriorityStyle(recommendation.priority);

  return (
    <div className={`rounded-2xl border p-4 ${style}`}>
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-black text-white">{template.title}</p>

            <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-white/45">
              {recommendation.priority}
            </span>

            <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-white/45">
              {template.actionType}
            </span>
          </div>

          <p className="mt-2 text-sm leading-6 text-white/55">
            {template.description}
          </p>

          <p className="mt-3 text-xs text-white/35">
            {score.student_name || "Unknown Student"} • Risk{" "}
            {score.risk_score || 0} • Opportunity{" "}
            {score.opportunity_score || 0}
          </p>
        </div>

        <button
          type="button"
          onClick={onExecute}
          disabled={disabled}
          className="shrink-0 rounded-full bg-[#D4AF37] px-5 py-2 text-xs font-black text-black transition hover:-translate-y-0.5 hover:bg-[#E7C768] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {executing ? "Executing..." : "Execute"}
        </button>
      </div>
    </div>
  );
}

function getPriorityRank(priority = "") {
  const clean = String(priority).toLowerCase();

  if (clean === "critical") return 5;
  if (clean === "executive") return 4;
  if (clean === "high") return 3;
  if (clean === "medium") return 2;
  if (clean === "low") return 1;

  return 0;
}

function getPriorityStyle(priority = "") {
  const clean = String(priority).toLowerCase();

  if (clean === "critical") {
    return "border-red-400/25 bg-red-500/10";
  }

  if (clean === "executive") {
    return "border-[#D4AF37]/30 bg-[#D4AF37]/10";
  }

  if (clean === "high") {
    return "border-orange-400/25 bg-orange-500/10";
  }

  if (clean === "medium") {
    return "border-blue-400/25 bg-blue-500/10";
  }

  return "border-white/10 bg-white/[0.03]";
}

export default ExecutiveActionExecutorPanel;