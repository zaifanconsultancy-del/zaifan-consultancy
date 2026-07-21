// AiLeadPrioritizationPanel V3 — Advanced Lead Ranking Engine
// Preserves lead scoring, contact completeness weighting, stage weighting,
// temperature classification and top-10 ranking.
// Rebuilt as a mature Admin OS prioritization surface.

import { motion } from "framer-motion";
import {
  Crown,
  Flame,
  Snowflake,
  Target,
  TrendingUp,
} from "lucide-react";

function AiLeadPrioritizationPanel({
  inquiries = [],
  appointments = [],
}) {
  const allLeads = [...inquiries, ...appointments];

  const ranked = allLeads
    .map((lead) => {
      let score = 40;

      const priority = String(
        lead.priority || "medium"
      ).toLowerCase();

      if (priority === "vip") score += 40;
      else if (priority === "high") score += 25;

      if (lead.phone) score += 10;
      if (lead.email) score += 10;

      const status = String(
        lead.status ||
          lead.pipeline_stage ||
          lead.appointment_stage ||
          ""
      ).toLowerCase();

      if (
        status.includes("contacted") ||
        status.includes("confirmed")
      ) {
        score += 15;
      }

      score = Math.min(100, score);

      let temperature = "Cold";

      if (score >= 80) temperature = "Hot";
      else if (score >= 60) temperature = "Warm";

      return {
        ...lead,
        score,
        temperature,
        name:
          lead.full_name ||
          lead.student_name ||
          lead.name ||
          "Unnamed Lead",
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);

  return (
    <motion.section
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="overflow-hidden rounded-[1.85rem] border-2 border-orange-300 bg-white shadow-[0_12px_30px_rgba(15,35,63,0.05)]"
    >
      <div className="flex items-center gap-3 bg-[#102f5c] p-6 text-white">
        <div className="rounded-2xl border border-orange-400/40 bg-orange-500/15 p-3">
          <TrendingUp className="h-5 w-5 text-orange-300" />
        </div>

        <div>
          <p className="text-xs font-black uppercase tracking-[0.3em] text-orange-300">
            AI Prioritization
          </p>

          <h3 className="text-xl font-black text-white">
            Lead Ranking Engine
          </h3>
        </div>
      </div>

      <div className="space-y-3 bg-[#fff8ee] p-6">
        {ranked.map((lead, index) => (
          <div
            key={lead.id}
            className="rounded-[1.5rem] border border-slate-300 bg-white p-4 shadow-[0_5px_16px_rgba(15,35,63,0.035)]"
          >
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-orange-200 bg-orange-50 text-xs font-black text-orange-700">
                  #{index + 1}
                </div>

                <div className="min-w-0">
                  <h4 className="truncate font-black text-[#10233f]">
                    {lead.name}
                  </h4>

                  <p className="mt-1 text-xs font-semibold text-slate-500">
                    Priority: {lead.priority || "medium"}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {lead.priority === "vip" && (
                  <Badge icon={Crown} text="VIP" color="gold" />
                )}

                {lead.temperature === "Hot" && (
                  <Badge icon={Flame} text="Hot" color="red" />
                )}

                {lead.temperature === "Warm" && (
                  <Badge icon={Target} text="Warm" color="gold" />
                )}

                {lead.temperature === "Cold" && (
                  <Badge icon={Snowflake} text="Cold" color="blue" />
                )}

                <Badge
                  icon={TrendingUp}
                  text={`${lead.score}/100`}
                  color="green"
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </motion.section>
  );
}

function Badge({
  icon: Icon,
  text,
  color,
}) {
  const colors = {
    red: "border-red-300 bg-red-50 text-red-700",
    gold: "border-orange-300 bg-orange-50 text-orange-700",
    blue: "border-blue-300 bg-blue-50 text-blue-700",
    green: "border-emerald-300 bg-emerald-50 text-emerald-700",
  };

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-black ${colors[color]}`}
    >
      <Icon size={12} />
      {text}
    </span>
  );
}

export default AiLeadPrioritizationPanel;