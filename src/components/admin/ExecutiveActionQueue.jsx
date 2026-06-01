import { useMemo } from "react";
import { buildExecutiveRecommendations } from "../../lib/executiveRecommendations";

function ExecutiveActionQueue({ scores = [] }) {
  const actionItems = useMemo(() => {
    return (scores || [])
      .flatMap((score) => {
        const recommendations = buildExecutiveRecommendations(score);

        return recommendations.map((recommendation) => ({
          score,
          recommendation,
        }));
      })
      .filter((item) => item.recommendation.action !== "none")
      .sort((a, b) => {
        const priorityA = getPriorityRank(a.recommendation.priority);
        const priorityB = getPriorityRank(b.recommendation.priority);

        return priorityB - priorityA;
      })
      .slice(0, 12);
  }, [scores]);

  return (
    <div className="rounded-[2rem] border border-[#D4AF37]/20 bg-[#D4AF37]/[0.04] p-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.25em] text-[#D4AF37]">
            Executive Action Queue
          </p>

          <h2 className="mt-2 text-2xl font-black text-white">
            Recommended CRM Actions
          </h2>

          <p className="mt-2 max-w-3xl text-sm leading-6 text-white/55">
            A prioritized action queue generated from executive risk and
            opportunity signals.
          </p>
        </div>

        <span className="rounded-full border border-white/10 bg-black/20 px-4 py-2 text-xs font-bold text-white/45">
          {actionItems.length} Actions
        </span>
      </div>

      <div className="mt-6 space-y-3">
        {actionItems.length ? (
          actionItems.map((item, index) => (
            <ActionQueueCard
              key={`${item.score.student_id}-${item.recommendation.type}-${index}`}
              item={item}
            />
          ))
        ) : (
          <div className="rounded-2xl border border-white/10 bg-black/20 p-5 text-sm text-white/40">
            No executive actions required right now.
          </div>
        )}
      </div>
    </div>
  );
}

function ActionQueueCard({ item }) {
  const { score, recommendation } = item;
  const style = getPriorityStyle(recommendation.priority);

  return (
    <div className={`rounded-2xl border p-4 ${style}`}>
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-black text-white">{recommendation.title}</p>

            <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-white/45">
              {recommendation.priority}
            </span>
          </div>

          <p className="mt-2 text-sm leading-6 text-white/55">
            {recommendation.description}
          </p>

          <p className="mt-3 text-xs text-white/35">
            {score.student_name || "Unknown Student"} • Risk{" "}
            {score.risk_score || 0} • Opportunity{" "}
            {score.opportunity_score || 0}
          </p>
        </div>

        <span className="shrink-0 rounded-full border border-white/10 bg-black/20 px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-white/50">
          {recommendation.action}
        </span>
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

export default ExecutiveActionQueue;