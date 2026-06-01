import { useState } from "react";
import { generateExecutiveScoresFromDatabase } from "../../lib/executivePortfolioGenerator";

function ExecutiveScoreGeneratorPanel({ onGenerated = () => {} }) {
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const runGenerator = async () => {
    if (running) return;

    setRunning(true);
    setError("");
    setResult(null);

    try {
      const output = await generateExecutiveScoresFromDatabase();

      if (output.error) {
        setError(output.error.message || "Executive score generation failed.");
      } else {
        setResult(output);
        onGenerated(output);
      }
    } catch (err) {
      setError(err.message || "Executive score generation crashed.");
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="rounded-[2rem] border border-[#D4AF37]/20 bg-[#D4AF37]/[0.045] p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.25em] text-[#D4AF37]">
            Executive Score Generator
          </p>

          <h2 className="mt-2 text-2xl font-black text-white">
            Generate Portfolio Intelligence
          </h2>

          <p className="mt-2 max-w-3xl text-sm leading-6 text-white/55">
            Scan inquiries and appointments, calculate executive risk and
            opportunity scores, then save them into the executive AI database.
          </p>
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

      {error ? (
        <div className="mt-5 rounded-2xl border border-red-400/20 bg-red-500/10 p-4 text-sm text-red-300">
          {error}
        </div>
      ) : null}

      {result ? (
        <div className="mt-5 grid gap-4 md:grid-cols-4">
          <ResultCard label="Students Scanned" value={result.total} />
          <ResultCard label="Scores Saved" value={result.savedCount} />
          <ResultCard label="Failed" value={result.failedCount} danger />
          <ResultCard
            label="Avg Risk"
            value={result.portfolio?.averageRisk || 0}
          />
        </div>
      ) : null}
    </div>
  );
}

function ResultCard({ label, value, danger = false }) {
  return (
    <div
      className={`rounded-2xl border p-4 ${
        danger
          ? "border-red-400/25 bg-red-500/10 text-red-300"
          : "border-white/10 bg-black/20 text-[#D4AF37]"
      }`}
    >
      <p className="text-xs font-black uppercase tracking-[0.18em] text-white/35">
        {label}
      </p>

      <p className="mt-3 text-3xl font-black text-white">{value}</p>
    </div>
  );
}

export default ExecutiveScoreGeneratorPanel;