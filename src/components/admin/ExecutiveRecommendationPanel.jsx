import { buildExecutiveRecommendations } from "../../lib/executiveRecommendations";

function ExecutiveRecommendationPanel({ score = {} }) {
  const recommendations = buildExecutiveRecommendations(score);

  const studentName =
    score?.student_name ||
    score?.full_name ||
    score?.name ||
    "Student";

  return (
    <div className="rounded-[1.75rem] border border-[#D4AF37]/20 bg-[#D4AF37]/[0.04] p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.24em] text-[#D4AF37]">
            Executive Recommendations
          </p>

          <h3 className="mt-2 text-xl font-black text-white">
            Recommended Actions for {studentName}
          </h3>

          <p className="mt-2 text-sm leading-6 text-white/50">
            These recommendations are generated from executive risk and
            opportunity scoring.
          </p>
        </div>

        <div className="rounded-full border border-white/10 bg-black/20 px-4 py-2 text-xs font-bold text-white/45">
          {score?.priority_level || "Standard"}
        </div>
      </div>

      <div className="mt-5 space-y-3">
        {recommendations.map((item, index) => (
          <RecommendationCard
            key={`${item.type}-${index}`}
            item={item}
          />
        ))}
      </div>
    </div>
  );
}

function RecommendationCard({ item }) {
  const style = getPriorityStyle(item.priority);

  return (
    <div className={`rounded-2xl border p-4 ${style}`}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="font-bold text-white">{item.title}</p>

          <p className="mt-2 text-sm leading-6 text-white/55">
            {item.description}
          </p>
        </div>

        <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-white/45">
          {item.action}
        </span>
      </div>
    </div>
  );
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

export default ExecutiveRecommendationPanel;