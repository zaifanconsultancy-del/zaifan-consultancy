import { useState } from "react";
import { generateExecutiveScoresFromDatabase } from "../../lib/executivePortfolioGenerator";

function number(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function ExecutiveScoreGeneratorPanel({ onGenerated = () => {} }) {
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [lastRunAt, setLastRunAt] = useState(null);

  const runGenerator = async () => {
    if (running) return;

    setRunning(true);
    setError("");
    setResult(null);

    try {
      const output = await generateExecutiveScoresFromDatabase();

      if (output?.error) {
        setError(output.error.message || "Executive score generation failed.");
        setResult(output);
      } else {
        setResult(output);
        setLastRunAt(new Date());
        onGenerated(output);
      }
    } catch (err) {
      setError(err.message || "Executive score generation crashed.");
    } finally {
      setRunning(false);
    }
  };

  const portfolio = result?.portfolio || {};
  const failedCount = number(result?.failedCount);
  const savedCount = number(result?.savedCount);
  const total = number(result?.total);
  const warningCount = result?.warnings?.length || 0;
  const successRate = total ? Math.round((savedCount / total) * 100) : 0;

  return (
    <div className="rounded-[2rem] border border-[#D4AF37]/20 bg-[#D4AF37]/[0.045] p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.25em] text-[#D4AF37]">
            Executive Score Generator
          </p>

          <h2 className="mt-2 text-2xl font-black text-white">
            Generate Student OS Intelligence
          </h2>

          <p className="mt-2 max-w-3xl text-sm leading-6 text-white/55">
            Scan inquiries, appointments, applications, documents, tasks,
            universities, visa signals, and previous risk records, then save
            executive AI scores into the Student OS intelligence database.
          </p>

          {lastRunAt ? (
            <p className="mt-3 text-xs font-bold text-white/35">
              Last successful run: {lastRunAt.toLocaleString()}
            </p>
          ) : null}
        </div>

        <button
          type="button"
          onClick={runGenerator}
          disabled={running}
          className="rounded-full bg-[#D4AF37] px-6 py-3 text-sm font-black text-black transition hover:-translate-y-0.5 hover:bg-[#E7C768] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {running ? "Generating..." : "Generate Executive Scores"}
        </button>
      </div>

      {running ? (
        <StatusBox
          tone="gold"
          title="Executive AI is scanning Student OS data..."
          description="This may update risk, opportunity, application, offer, visa, document, task, university, and portfolio intelligence."
        />
      ) : null}

      {error ? (
        <StatusBox tone="red" title="Generation issue" description={error} />
      ) : null}

      {result ? (
        <div className="mt-5 space-y-5">
          <div className="grid gap-4 md:grid-cols-4 xl:grid-cols-6">
            <ResultCard label="Students Scanned" value={total} />
            <ResultCard label="Scores Saved" value={savedCount} success={failedCount === 0 && total > 0} />
            <ResultCard label="Failed" value={failedCount} danger={failedCount > 0} />
            <ResultCard label="Warnings" value={warningCount} warning={warningCount > 0} />
            <ResultCard label="Success Rate" value={`${successRate}%`} success={successRate >= 95 && total > 0} />
            <ResultCard label="Avg Risk" value={portfolio.averageRisk || 0} warning={number(portfolio.averageRisk) >= 50} />
          </div>

          <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-6">
            <ResultCard label="Critical Risk" value={portfolio.critical || 0} danger />
            <ResultCard label="High Risk" value={portfolio.high || 0} warning />
            <ResultCard label="Executive Priority" value={portfolio.executivePriority || 0} />
            <ResultCard label="High Opportunity" value={portfolio.highOpportunity || 0} success />
            <ResultCard label="Application Ready" value={portfolio.applicationReady || 0} success />
            <ResultCard label="Conversion Ready" value={portfolio.conversionReady || 0} />
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            <ResultCard label="Success Stories" value={portfolio.successStories || 0} success />
            <ResultCard label="Avg Opportunity" value={portfolio.averageOpportunity || 0} />
            <ResultCard label="Application Submitted" value={portfolio.applicationHealth?.submitted || 0} />
            <ResultCard label="Visa Pending" value={portfolio.visaHealth?.pending || 0} warning />
            <ResultCard label="Visa Approved" value={portfolio.visaHealth?.approved || 0} success />
          </div>

          {warningCount > 0 ? (
            <StatusBox
              tone="orange"
              title="Generated with warnings"
              description="Some non-blocking tables may not have loaded, but Executive AI still generated available scores."
            />
          ) : null}

          {failedCount > 0 ? (
            <StatusBox
              tone="red"
              title="Some scores failed to save"
              description="Usually this means the Supabase table is missing a column, the unique conflict rule is not ready, or the saved payload has a field not present in the table."
            />
          ) : total === 0 ? (
            <StatusBox
              tone="orange"
              title="No students found"
              description="Executive AI ran, but no inquiry or appointment students were loaded."
            />
          ) : (
            <StatusBox
              tone="green"
              title="Executive Student OS intelligence generated successfully"
              description={`${savedCount} score${savedCount === 1 ? "" : "s"} saved into the executive intelligence database.`}
            />
          )}
        </div>
      ) : null}
    </div>
  );
}

function StatusBox({ tone = "gold", title, description }) {
  const style =
    tone === "red"
      ? "border-red-400/20 bg-red-500/10 text-red-200"
      : tone === "orange"
      ? "border-orange-400/20 bg-orange-500/10 text-orange-200"
      : tone === "green"
      ? "border-emerald-400/20 bg-emerald-500/10 text-emerald-200"
      : "border-[#D4AF37]/20 bg-[#D4AF37]/10 text-[#D4AF37]";

  return (
    <div className={`mt-5 rounded-2xl border p-4 ${style}`}>
      <p className="font-bold">{title}</p>
      {description ? <p className="mt-2 text-sm text-white/50">{description}</p> : null}
    </div>
  );
}

function ResultCard({
  label,
  value,
  danger = false,
  warning = false,
  success = false,
}) {
  const style = danger
    ? "border-red-400/25 bg-red-500/10 text-red-300"
    : warning
    ? "border-orange-400/25 bg-orange-500/10 text-orange-300"
    : success
    ? "border-emerald-400/25 bg-emerald-500/10 text-emerald-300"
    : "border-white/10 bg-black/20 text-[#D4AF37]";

  return (
    <div className={`rounded-2xl border p-4 ${style}`}>
      <p className="text-xs font-black uppercase tracking-[0.18em] text-white/35">
        {label}
      </p>

      <p className="mt-3 text-3xl font-black text-white">{value}</p>
    </div>
  );
}

export default ExecutiveScoreGeneratorPanel;