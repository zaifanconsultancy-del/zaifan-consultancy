// LeadScoringAnalytics V2 — Smart Lead Intelligence
// Preserves lead scoring engine integration, lead ranking, score labels, score tones,
// inquiry/appointment merging and top-20 ranking.
// Rebuilt to match the approved Zaifan Admin OS visual language.

import { motion } from "framer-motion";
import {
  calculateLeadScore,
  getLeadScoreLabel,
  getLeadScoreTone,
} from "../../services/leadScoringEngine";

function LeadScoringAnalytics({
  cardClass = "",
  inquiries = [],
  appointments = [],
}) {
  const scoredLeads = [
    ...inquiries.map((lead) => ({
      ...lead,
      type: "inquiry",
      score: calculateLeadScore(lead, "inquiry"),
    })),
    ...appointments.map((lead) => ({
      ...lead,
      type: "appointment",
      score: calculateLeadScore(lead, "appointment"),
    })),
  ].sort((a, b) => b.score - a.score);

  const hotLeads = scoredLeads.filter((lead) => lead.score >= 80).length;
  const warmLeads = scoredLeads.filter(
    (lead) => lead.score >= 60 && lead.score < 80
  ).length;
  const activeLeads = scoredLeads.filter(
    (lead) => lead.score >= 35 && lead.score < 60
  ).length;
  const coldLeads = scoredLeads.filter((lead) => lead.score < 35).length;

  return (
    <motion.section
      key="lead-scoring"
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className={`${cardClass} overflow-hidden rounded-[1.9rem] border-2 border-orange-300 bg-white shadow-[0_14px_36px_rgba(15,35,63,0.06)]`}
    >
      <div className="bg-[#102f5c] p-6 text-white sm:p-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.35em] text-orange-300">
              Smart Lead Intelligence
            </p>

            <h2 className="mt-3 text-3xl font-black text-white sm:text-4xl">
              Lead Scoring System
            </h2>

            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-200">
              Automatically ranks leads from cold to hot using priority,
              assignment, contact completeness, appointment progress, and CRM
              pipeline stage.
            </p>
          </div>

          <div className="rounded-full border border-orange-400/50 bg-orange-500/15 px-4 py-2 text-xs font-black text-orange-200">
            0–100 Score
          </div>
        </div>
      </div>

      <div className="bg-[#fff8ee] p-6 sm:p-8">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <ScoreStat label="Hot" value={hotLeads} tone="red" />
          <ScoreStat label="Warm" value={warmLeads} tone="orange" />
          <ScoreStat label="Active" value={activeLeads} tone="gold" />
          <ScoreStat label="Cold" value={coldLeads} tone="blue" />
        </div>

        <div className="mt-7 overflow-hidden rounded-[1.5rem] border border-slate-300 bg-white shadow-[0_8px_24px_rgba(15,35,63,0.04)]">
          <div className="hidden grid-cols-6 gap-3 border-b border-slate-300 bg-[#fffaf2] px-5 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 lg:grid">
            <span>Lead</span>
            <span>Type</span>
            <span>Score</span>
            <span>Label</span>
            <span>Priority</span>
            <span>Owner</span>
          </div>

          {scoredLeads.length ? (
            scoredLeads.slice(0, 20).map((lead, index) => {
              const label = getLeadScoreLabel(lead.score);
              const tone = getLeadScoreTone(lead.score);

              return (
                <motion.div
                  key={`${lead.type}-${lead.id}`}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: index * 0.025 }}
                  className="grid gap-4 border-b border-slate-200 bg-white px-5 py-5 last:border-b-0 lg:grid-cols-6 lg:items-center"
                >
                  <div>
                    <p className="text-sm font-black text-[#10233f]">
                      {lead.full_name || lead.name || lead.email || "Unknown Lead"}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {lead.email || lead.phone || "No contact"}
                    </p>
                  </div>

                  <MiniMetric label="Type" value={lead.type} tone="text-slate-700" />
                  <MiniMetric label="Score" value={lead.score} tone={normalizeTone(tone)} />
                  <MiniMetric label="Label" value={label} tone={normalizeTone(tone)} />
                  <MiniMetric
                    label="Priority"
                    value={lead.priority || "low"}
                    tone="text-orange-700"
                  />
                  <MiniMetric
                    label="Owner"
                    value={lead.assigned_admin_name || "Unassigned"}
                    tone="text-blue-700"
                  />
                </motion.div>
              );
            })
          ) : (
            <div className="p-8 text-center text-sm text-slate-500">
              No leads available for scoring yet.
            </div>
          )}
        </div>
      </div>
    </motion.section>
  );
}

function ScoreStat({ label, value, tone }) {
  const styles = {
    red: "border-red-300 bg-red-50 text-red-700",
    orange: "border-orange-300 bg-orange-50 text-orange-700",
    gold: "border-orange-300 bg-[#fff8ee] text-orange-700",
    blue: "border-blue-300 bg-blue-50 text-blue-700",
  };

  return (
    <div className={`rounded-[1.4rem] border p-5 shadow-[0_5px_16px_rgba(15,35,63,0.035)] ${styles[tone]}`}>
      <p className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-500">
        {label}
      </p>
      <h3 className="mt-3 text-3xl font-black text-[#10233f]">{value}</h3>
    </div>
  );
}

function MiniMetric({ label, value, tone }) {
  return (
    <div>
      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500 lg:hidden">
        {label}
      </p>
      <p className={`mt-1 truncate text-sm font-black lg:mt-0 ${tone}`}>
        {value}
      </p>
    </div>
  );
}

function normalizeTone(tone = "") {
  if (tone.includes("red")) return "text-red-700";
  if (tone.includes("orange") || tone.includes("yellow") || tone.includes("gold")) return "text-orange-700";
  if (tone.includes("green") || tone.includes("emerald")) return "text-emerald-700";
  if (tone.includes("blue") || tone.includes("cyan")) return "text-blue-700";
  return "text-[#10233f]";
}

export default LeadScoringAnalytics;