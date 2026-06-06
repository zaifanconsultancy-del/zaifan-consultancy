import { useEffect, useMemo, useState } from "react";
import ExecutiveScoreGeneratorPanel from "./ExecutiveScoreGeneratorPanel";
import ExecutiveAlertsPanel from "./ExecutiveAlertsPanel";
import ExecutiveActionQueue from "./ExecutiveActionQueue";
import ExecutiveAutomationEngine from "./ExecutiveAutomationEngine";
import ExecutiveActionExecutorPanel from "./ExecutiveActionExecutorPanel";
import ExecutivePortfolioSummary from "./ExecutivePortfolioSummary";
import { getExecutiveScoreSummary } from "../../lib/executivePortfolioGenerator";

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

function ExecutiveCommandSystem({ adminProfile = null }) {
  const [scores, setScores] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loadingScores, setLoadingScores] = useState(false);
  const [error, setError] = useState("");
  const [showDeveloperTools, setShowDeveloperTools] = useState(false);
  const [activeView, setActiveView] = useState("alerts");

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

  const commandMetrics = useMemo(() => {
    const total = scores.length;

    const critical = scores.filter(
      (score) =>
        normalize(score.executive_category) === "critical_risk" ||
        normalize(score.risk_level) === "critical" ||
        number(score.risk_score) >= 85
    ).length;

    const executivePriority = scores.filter(
      (score) =>
        normalize(score.priority_level) === "executive" ||
        number(score.risk_score) >= 85 ||
        number(score.opportunity_score) >= 85
    ).length;

    const conversionReady = scores.filter((score) => {
      const category = normalize(score.executive_category);
      const journeyStage = normalize(score.journey_stage);

      return (
        category === "conversion_ready" ||
        ["offer_accepted", "cas_pending", "cas_issued", "visa_pending"].includes(
          journeyStage
        )
      );
    }).length;

    const visaWatch = scores.filter((score) =>
      ["cas_pending", "cas_issued", "visa_pending", "visa_rejected"].includes(
        normalize(score.journey_stage)
      )
    ).length;

    const successStories = scores.filter(
      (score) =>
        normalize(score.executive_category) === "success_story" ||
        normalize(score.journey_stage) === "visa_approved"
    ).length;

    const averageRisk = total
      ? Math.round(scores.reduce((sum, score) => sum + number(score.risk_score), 0) / total)
      : 0;

    const averageOpportunity = total
      ? Math.round(
          scores.reduce((sum, score) => sum + number(score.opportunity_score), 0) / total
        )
      : 0;

    return {
      total,
      critical,
      executivePriority,
      conversionReady,
      visaWatch,
      successStories,
      averageRisk,
      averageOpportunity,
    };
  }, [scores]);

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
              Student OS Executive Layer
            </h2>

            <p className="mt-2 max-w-3xl text-sm leading-6 text-white/55">
              Command view for risks, opportunities, CAS/visa movement,
              human-approved execution, and real Student OS intelligence.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={loadExecutiveScores}
              disabled={loadingScores}
              className="rounded-full border border-[#D4AF37]/30 bg-[#D4AF37]/10 px-5 py-2 text-sm font-bold text-[#D4AF37] transition hover:bg-[#D4AF37] hover:text-black disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loadingScores ? "Loading..." : "Reload Scores"}
            </button>

            <button
              type="button"
              onClick={() => setShowDeveloperTools((prev) => !prev)}
              className="rounded-full border border-white/10 bg-white/[0.04] px-5 py-2 text-sm font-bold text-white/55 transition hover:border-[#D4AF37]/30 hover:text-[#D4AF37]"
            >
              {showDeveloperTools ? "Hide Tools" : "Developer Tools"}
            </button>
          </div>
        </div>

        {error ? (
          <div className="mt-5 rounded-2xl border border-red-400/20 bg-red-500/10 p-4 text-sm text-red-300">
            {error}
          </div>
        ) : null}

        <div className="mt-6 grid gap-4 md:grid-cols-3 xl:grid-cols-8">
          <SummaryCard label="Students Scored" value={summary?.total || commandMetrics.total} />
          <SummaryCard label="Critical Risk" value={summary?.criticalRisk || summary?.critical || commandMetrics.critical} tone="red" />
          <SummaryCard label="Executive Priority" value={commandMetrics.executivePriority} tone="gold" />
          <SummaryCard label="Conversion Ready" value={summary?.conversionReady || commandMetrics.conversionReady} tone="gold" />
          <SummaryCard label="Visa/CAS Watch" value={commandMetrics.visaWatch} tone="blue" />
          <SummaryCard label="Success Stories" value={summary?.successStories || commandMetrics.successStories} tone="green" />
          <SummaryCard label="Avg Risk" value={summary?.averageRisk || commandMetrics.averageRisk} tone="orange" />
          <SummaryCard label="Avg Opportunity" value={summary?.averageOpportunity || commandMetrics.averageOpportunity} tone="green" />
        </div>
      </div>

      <CommandTabs activeView={activeView} setActiveView={setActiveView} />

      {activeView === "alerts" ? (
        <ExecutiveAlertsPanel scores={scores} />
      ) : null}

      {activeView === "portfolio" ? (
        <ExecutivePortfolioSummary students={scores} />
      ) : null}

      {activeView === "actions" ? (
        <ExecutiveActionQueue scores={scores} adminProfile={adminProfile} />
      ) : null}

      {showDeveloperTools ? (
        <div className="space-y-6 rounded-[2rem] border border-white/10 bg-black/30 p-5">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.25em] text-white/35">
              Developer Tools
            </p>
            <h3 className="mt-2 text-xl font-black text-white">
              Hidden Executive AI Tools
            </h3>
            <p className="mt-2 text-sm text-white/45">
              Useful for generating scores, inspecting automation payloads, and
              executing approved actions. Keep hidden during normal CEO/dashboard use.
            </p>
          </div>

          <ExecutiveScoreGeneratorPanel onGenerated={handleGenerated} />

          <ExecutiveAutomationEngine scores={scores} />

          <ExecutiveActionExecutorPanel
            scores={scores}
            adminProfile={adminProfile}
            onActionExecuted={handleActionExecuted}
          />
        </div>
      ) : null}
    </div>
  );
}

function CommandTabs({ activeView, setActiveView }) {
  const tabs = [
    { key: "alerts", label: "Alerts" },
    { key: "portfolio", label: "Portfolio" },
    { key: "actions", label: "Actions" },
  ];

  return (
    <div className="flex flex-wrap gap-2 rounded-[1.5rem] border border-white/10 bg-black/20 p-2">
      {tabs.map((tab) => {
        const active = activeView === tab.key;

        return (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveView(tab.key)}
            className={`rounded-full px-5 py-2 text-sm font-bold transition ${
              active
                ? "bg-[#D4AF37] text-black"
                : "border border-white/10 bg-white/[0.03] text-white/45 hover:border-[#D4AF37]/25 hover:text-[#D4AF37]"
            }`}
          >
            {tab.label}
          </button>
        );
      })}
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

      <p className="mt-3 text-3xl font-black text-white">{value || 0}</p>
    </div>
  );
}

function getToneStyle(tone = "") {
  if (tone === "red") return "border-red-400/25 bg-red-500/10";
  if (tone === "orange") return "border-orange-400/25 bg-orange-500/10";
  if (tone === "green") return "border-emerald-400/25 bg-emerald-500/10";
  if (tone === "gold") return "border-[#D4AF37]/25 bg-[#D4AF37]/10";
  if (tone === "blue") return "border-blue-400/25 bg-blue-500/10";
  return "border-white/10 bg-white/[0.03]";
}

export default ExecutiveCommandSystem;