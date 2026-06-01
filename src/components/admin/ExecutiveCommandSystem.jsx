import { useEffect, useState } from "react";
import ExecutiveScoreGeneratorPanel from "./ExecutiveScoreGeneratorPanel";
import ExecutiveAlertsPanel from "./ExecutiveAlertsPanel";
import ExecutiveActionQueue from "./ExecutiveActionQueue";
import ExecutiveAutomationEngine from "./ExecutiveAutomationEngine";
import ExecutiveActionExecutorPanel from "./ExecutiveActionExecutorPanel";
import { getExecutiveScoreSummary } from "../../lib/executivePortfolioGenerator";

function ExecutiveCommandSystem({ adminProfile = null }) {
  const [scores, setScores] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loadingScores, setLoadingScores] = useState(false);
  const [error, setError] = useState("");

  const loadExecutiveScores = async () => {
    setLoadingScores(true);
    setError("");

    try {
      const result = await getExecutiveScoreSummary();

      if (result.error) {
        setError(result.error.message || "Executive scores failed to load.");
        setScores([]);
        setSummary(null);
        return;
      }

      setScores(result.scores || []);
      setSummary(result);
    } catch (err) {
      setError(err.message || "Executive scores crashed while loading.");
      setScores([]);
      setSummary(null);
    } finally {
      setLoadingScores(false);
    }
  };

  useEffect(() => {
    loadExecutiveScores();
  }, []);

  const handleGenerated = async () => {
    await loadExecutiveScores();
  };

  const handleActionExecuted = async () => {
    await loadExecutiveScores();
  };

  return (
    <div className="space-y-6">
      <div className="rounded-[2rem] border border-[#D4AF37]/20 bg-[#D4AF37]/[0.045] p-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.25em] text-[#D4AF37]">
              Executive Command System
            </p>

            <h2 className="mt-2 text-3xl font-black text-white">
              AI Operating Layer
            </h2>

            <p className="mt-2 max-w-3xl text-sm leading-6 text-white/55">
              Generate scores, detect executive risks, prepare CRM actions, and
              execute human-approved tasks, reminders, and communication drafts.
            </p>
          </div>

          <button
            type="button"
            onClick={loadExecutiveScores}
            disabled={loadingScores}
            className="rounded-full border border-[#D4AF37]/30 bg-[#D4AF37]/10 px-5 py-2 text-sm font-bold text-[#D4AF37] transition hover:bg-[#D4AF37] hover:text-black disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loadingScores ? "Loading..." : "Reload Scores"}
          </button>
        </div>

        {error ? (
          <div className="mt-5 rounded-2xl border border-red-400/20 bg-red-500/10 p-4 text-sm text-red-300">
            {error}
          </div>
        ) : null}

        {summary ? (
          <div className="mt-6 grid gap-4 md:grid-cols-3 xl:grid-cols-6">
            <SummaryCard label="Scores" value={summary.total} />
            <SummaryCard label="Critical" value={summary.critical} tone="red" />
            <SummaryCard label="High" value={summary.high} tone="orange" />
            <SummaryCard
              label="Opportunities"
              value={summary.opportunities}
              tone="green"
            />
            <SummaryCard
              label="Avg Risk"
              value={summary.averageRisk}
              tone="gold"
            />
            <SummaryCard
              label="Avg Opp."
              value={summary.averageOpportunity}
              tone="blue"
            />
          </div>
        ) : null}
      </div>

      <ExecutiveScoreGeneratorPanel onGenerated={handleGenerated} />

      <ExecutiveAlertsPanel />

      <ExecutiveActionQueue scores={scores} />

      <ExecutiveAutomationEngine scores={scores} />

      <ExecutiveActionExecutorPanel
        scores={scores}
        adminProfile={adminProfile}
        onActionExecuted={handleActionExecuted}
      />
    </div>
  );
}

function SummaryCard({ label, value, tone = "default" }) {
  const style = getToneStyle(tone);

  return (
    <div className={`rounded-2xl border p-4 ${style}`}>
      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/35">
        {label}
      </p>

      <p className="mt-3 text-3xl font-black text-white">{value}</p>
    </div>
  );
}

function getToneStyle(tone = "") {
  if (tone === "red") {
    return "border-red-400/25 bg-red-500/10";
  }

  if (tone === "orange") {
    return "border-orange-400/25 bg-orange-500/10";
  }

  if (tone === "green") {
    return "border-emerald-400/25 bg-emerald-500/10";
  }

  if (tone === "gold") {
    return "border-[#D4AF37]/25 bg-[#D4AF37]/10";
  }

  if (tone === "blue") {
    return "border-blue-400/25 bg-blue-500/10";
  }

  return "border-white/10 bg-white/[0.03]";
}

export default ExecutiveCommandSystem;