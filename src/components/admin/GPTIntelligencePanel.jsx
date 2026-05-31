import { motion } from "framer-motion";

function GPTIntelligencePanel({ student = {}, onOpenWorkspace = () => {} }) {
  const summary = student?.gpt_summary || "No GPT analysis available.";
  const risk = student?.gpt_risk || "No risk assessment available.";
  const strategy = student?.gpt_strategy || "No counselor strategy generated.";
  const conversion = Number(student?.gpt_conversion || 0);
  const confidence = Number(student?.gpt_confidence || 0);
  const gptScore = Number(student?.gpt_score || 0);
  const intent = student?.gpt_intent || "Unknown";

  const analyzedAt = student?.gpt_analyzed_at
    ? new Date(student.gpt_analyzed_at).toLocaleString()
    : "Not analyzed yet";

  const hasGPT = Boolean(student?.gpt_analyzed_at || student?.gpt_summary);

  const riskColor = risk.toLowerCase().includes("high")
    ? "text-red-300 border-red-400/30 bg-red-500/10"
    : risk.toLowerCase().includes("medium")
    ? "text-yellow-300 border-yellow-400/30 bg-yellow-500/10"
    : "text-emerald-300 border-emerald-400/30 bg-emerald-500/10";

  return (
    <div className="space-y-5">
      <div className="rounded-[2rem] border border-[#D4AF37]/20 bg-[#D4AF37]/[0.05] p-6">
        <p className="text-xs uppercase tracking-[0.25em] text-[#D4AF37]">
          GPT Counselor Intelligence
        </p>

        <h2 className="mt-3 text-2xl font-black text-white">
          AI Executive Lead Analysis
        </h2>

        <p className="mt-2 text-white/60">
          Stored GPT counselor intelligence for this student.
        </p>
      </div>

      {!hasGPT ? (
        <div className="rounded-[1.75rem] border border-yellow-400/20 bg-yellow-500/10 p-5">
          <p className="font-bold text-yellow-300">No GPT analysis stored yet.</p>
          <p className="mt-2 text-sm text-white/55">
            Open GPT Workspace and run an analysis when you want premium AI
            counselor output saved to this student.
          </p>
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-4">
        <StatCard label="GPT Score" value={gptScore} />
        <StatCard label="Intent" value={intent} />
        <StatCard label="Conversion %" value={`${conversion}%`} />
        <StatCard label="Confidence %" value={`${confidence}%`} />
      </div>

      <InsightBlock title="Executive Summary" content={summary} />

      <div className="rounded-[1.75rem] border border-white/10 bg-white/[0.03] p-6">
        <div
          className={`inline-flex rounded-full border px-4 py-2 text-xs font-bold ${riskColor}`}
        >
          Risk Assessment
        </div>

        <p className="mt-4 whitespace-pre-wrap text-white/65 leading-7">
          {risk}
        </p>
      </div>

      <InsightBlock title="Counselor Strategy" content={strategy} />

      <div className="rounded-[1.75rem] border border-white/10 bg-white/[0.03] p-6">
        <h3 className="font-bold text-white">GPT Metadata</h3>

        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <MetaCard label="Last Analysis" value={analyzedAt} />
          <MetaCard label="Stored Intelligence" value={hasGPT ? "Yes" : "No"} />
        </div>
      </div>

      <button
        type="button"
        onClick={onOpenWorkspace}
        className="rounded-full bg-[#D4AF37] px-6 py-3 font-black text-black transition hover:-translate-y-0.5 hover:bg-[#E7C768]"
      >
        Open GPT Workspace
      </button>
    </div>
  );
}

function InsightBlock({ title, content }) {
  return (
    <div className="rounded-[1.75rem] border border-white/10 bg-white/[0.03] p-6">
      <h3 className="font-bold text-white">{title}</h3>

      <p className="mt-3 whitespace-pre-wrap text-white/65 leading-7">
        {content}
      </p>
    </div>
  );
}

function MetaCard({ label, value }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
      <p className="text-xs uppercase tracking-[0.18em] text-white/35">
        {label}
      </p>

      <p className="mt-2 break-words text-sm font-semibold text-white/70">
        {value}
      </p>
    </div>
  );
}

function StatCard({ label, value }) {
  return (
    <motion.div
      whileHover={{ y: -2 }}
      className="rounded-2xl border border-white/10 bg-white/[0.03] p-4"
    >
      <p className="text-xs uppercase tracking-[0.18em] text-white/40">
        {label}
      </p>

      <p className="mt-3 break-words text-2xl font-black text-white">
        {value}
      </p>
    </motion.div>
  );
}

export default GPTIntelligencePanel;