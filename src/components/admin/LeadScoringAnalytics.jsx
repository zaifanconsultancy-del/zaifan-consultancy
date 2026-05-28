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
      className={`${cardClass} p-6 sm:p-8`}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[11px] uppercase tracking-[0.35em] text-[#D4AF37]">
            Smart Lead Intelligence
          </p>

          <h2 className="mt-3 text-3xl font-black text-white sm:text-4xl">
            Lead Scoring System
          </h2>

          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-gray-400">
            Automatically ranks leads from cold to hot using priority,
            assignment, contact completeness, appointment progress, and CRM
            pipeline stage.
          </p>
        </div>

        <div className="rounded-full border border-[#D4AF37]/20 bg-[#D4AF37]/10 px-4 py-2 text-xs font-bold text-[#D4AF37]">
          0–100 Score
        </div>
      </div>

      <div className="mt-7 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <ScoreStat label="Hot" value={hotLeads} tone="text-red-300" />
        <ScoreStat label="Warm" value={warmLeads} tone="text-orange-300" />
        <ScoreStat label="Active" value={activeLeads} tone="text-[#D4AF37]" />
        <ScoreStat label="Cold" value={coldLeads} tone="text-blue-300" />
      </div>

      <div className="mt-7 overflow-hidden rounded-[1.5rem] border border-white/10">
        <div className="hidden grid-cols-6 gap-3 border-b border-white/10 bg-white/[0.03] px-5 py-4 text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500 lg:grid">
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
                className="grid gap-4 border-b border-white/10 bg-black/20 px-5 py-5 last:border-b-0 lg:grid-cols-6 lg:items-center"
              >
                <div>
                  <p className="text-sm font-black text-white">
                    {lead.full_name || lead.name || lead.email || "Unknown Lead"}
                  </p>
                  <p className="mt-1 text-xs text-gray-500">
                    {lead.email || lead.phone || "No contact"}
                  </p>
                </div>

                <MiniMetric label="Type" value={lead.type} tone="text-gray-300" />
                <MiniMetric label="Score" value={lead.score} tone={tone} />
                <MiniMetric label="Label" value={label} tone={tone} />
                <MiniMetric
                  label="Priority"
                  value={lead.priority || "low"}
                  tone="text-[#D4AF37]"
                />
                <MiniMetric
                  label="Owner"
                  value={lead.assigned_admin_name || "Unassigned"}
                  tone="text-cyan-300"
                />
              </motion.div>
            );
          })
        ) : (
          <div className="p-8 text-center text-sm text-gray-400">
            No leads available for scoring yet.
          </div>
        )}
      </div>
    </motion.section>
  );
}

function ScoreStat({ label, value, tone }) {
  return (
    <div className="rounded-[1.4rem] border border-white/10 bg-black/25 p-5">
      <p className="text-[10px] uppercase tracking-[0.24em] text-gray-500">
        {label}
      </p>
      <h3 className={`mt-3 text-3xl font-black ${tone}`}>{value}</h3>
    </div>
  );
}

function MiniMetric({ label, value, tone }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-[0.18em] text-gray-500 lg:hidden">
        {label}
      </p>
      <p className={`mt-1 truncate text-sm font-black lg:mt-0 ${tone}`}>
        {value}
      </p>
    </div>
  );
}

export default LeadScoringAnalytics;