import { useEffect, useMemo, useState } from "react";
import { fetchExecutiveRiskScores } from "../../lib/executiveAI";

function ExecutiveAlertsPanel() {
  const [scores, setScores] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loadScores = async () => {
    setLoading(true);
    setError("");

    try {
      const { data, error } = await fetchExecutiveRiskScores();

      if (error) throw error;

      setScores(data || []);
    } catch (err) {
      setError(err.message || "Executive alerts failed to load.");
      setScores([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadScores();
  }, []);

  const criticalRisks = useMemo(() => {
    return scores
      .filter((item) => Number(item.risk_score || 0) >= 80)
      .slice(0, 5);
  }, [scores]);

  const highRisks = useMemo(() => {
    return scores
      .filter((item) => {
        const score = Number(item.risk_score || 0);
        return score >= 60 && score < 80;
      })
      .slice(0, 5);
  }, [scores]);

  const topOpportunities = useMemo(() => {
    return [...scores]
      .filter((item) => Number(item.opportunity_score || 0) >= 50)
      .sort(
        (a, b) =>
          Number(b.opportunity_score || 0) -
          Number(a.opportunity_score || 0)
      )
      .slice(0, 5);
  }, [scores]);

  return (
    <div className="space-y-6">
      <div className="rounded-[2rem] border border-red-400/20 bg-red-500/[0.04] p-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.25em] text-red-300">
              Executive Alerts
            </p>

            <h2 className="mt-2 text-2xl font-black text-white">
              Decision Queue
            </h2>

            <p className="mt-2 max-w-3xl text-sm leading-6 text-white/55">
              Critical risks, executive priority students, and high-value
              opportunities from the Executive AI scoring layer.
            </p>
          </div>

          <button
            type="button"
            onClick={loadScores}
            disabled={loading}
            className="rounded-full border border-red-400/25 bg-red-500/10 px-5 py-2 text-sm font-bold text-red-300 transition hover:border-red-400/45 disabled:opacity-50"
          >
            {loading ? "Loading..." : "Refresh Alerts"}
          </button>
        </div>

        {error ? (
          <div className="mt-4 rounded-2xl border border-red-400/20 bg-red-500/10 p-4 text-sm text-red-200">
            {error}
          </div>
        ) : null}
      </div>

      <div className="grid gap-5 xl:grid-cols-3">
        <AlertList
          title="Critical Risks"
          eyebrow="Immediate Action"
          icon="🚨"
          items={criticalRisks}
          emptyText="No critical risks detected."
          scoreKey="risk_score"
          tone="red"
        />

        <AlertList
          title="High Risks"
          eyebrow="Counselor Priority"
          icon="⚠️"
          items={highRisks}
          emptyText="No high-risk students detected."
          scoreKey="risk_score"
          tone="orange"
        />

        <AlertList
          title="Top Opportunities"
          eyebrow="Conversion Priority"
          icon="🏆"
          items={topOpportunities}
          emptyText="No high opportunities detected."
          scoreKey="opportunity_score"
          tone="gold"
        />
      </div>
    </div>
  );
}

function AlertList({
  title,
  eyebrow,
  icon,
  items = [],
  emptyText,
  scoreKey,
  tone = "gold",
}) {
  const toneClass =
    tone === "red"
      ? "border-red-400/25 bg-red-500/10 text-red-300"
      : tone === "orange"
      ? "border-orange-400/25 bg-orange-500/10 text-orange-300"
      : "border-[#D4AF37]/25 bg-[#D4AF37]/10 text-[#D4AF37]";

  return (
    <div className="rounded-[1.75rem] border border-white/10 bg-white/[0.035] p-5">
      <div className="mb-5 flex items-center justify-between gap-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-white/35">
            {eyebrow}
          </p>

          <h3 className="mt-2 text-xl font-black text-white">{title}</h3>
        </div>

        <span className={`rounded-2xl border p-3 text-xl ${toneClass}`}>
          {icon}
        </span>
      </div>

      {items.length ? (
        <div className="space-y-3">
          {items.map((item) => (
            <div
              key={`${item.student_id}-${item.student_type}-${item.generated_at}`}
              className="rounded-2xl border border-white/10 bg-black/25 p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-semibold text-white">
                    {item.student_name || "Unknown Student"}
                  </p>

                  <p className="mt-1 text-xs capitalize text-white/40">
                    {item.student_type || "student"} •{" "}
                    {item.priority_level || "Standard"}
                  </p>
                </div>

                <span
                  className={`shrink-0 rounded-full border px-3 py-1 text-xs font-black ${toneClass}`}
                >
                  {Number(item[scoreKey] || 0)}
                </span>
              </div>

              <p className="mt-3 line-clamp-3 text-sm leading-6 text-white/50">
                {item.summary || "No executive summary available."}
              </p>

              <div className="mt-3 flex flex-wrap gap-2">
                <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-white/35">
                  {item.risk_level || "Low"} Risk
                </span>

                {item.generated_at ? (
                  <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-white/35">
                    {new Date(item.generated_at).toLocaleDateString()}
                  </span>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-white/10 bg-black/20 p-5 text-sm text-white/40">
          {emptyText}
        </div>
      )}
    </div>
  );
}

export default ExecutiveAlertsPanel;