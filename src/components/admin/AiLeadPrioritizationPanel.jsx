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
      className="rounded-[2rem] border border-white/10 bg-white/[0.03] p-6"
    >
      <div className="flex items-center gap-3">
        <div className="rounded-2xl border border-[#D4AF37]/20 bg-[#D4AF37]/10 p-3">
          <TrendingUp className="h-5 w-5 text-[#D4AF37]" />
        </div>

        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-[#D4AF37]">
            AI Prioritization
          </p>

          <h3 className="text-xl font-black text-white">
            Lead Ranking Engine
          </h3>
        </div>
      </div>

      <div className="mt-6 space-y-3">
        {ranked.map((lead) => (
          <div
            key={lead.id}
            className="rounded-[1.5rem] border border-white/10 bg-black/20 p-4"
          >
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h4 className="font-bold text-white">
                  {lead.name}
                </h4>

                <p className="mt-1 text-xs text-white/45">
                  Priority: {lead.priority || "medium"}
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                {lead.priority === "vip" && (
                  <Badge
                    icon={Crown}
                    text="VIP"
                    color="gold"
                  />
                )}

                {lead.temperature === "Hot" && (
                  <Badge
                    icon={Flame}
                    text="Hot"
                    color="red"
                  />
                )}

                {lead.temperature === "Warm" && (
                  <Badge
                    icon={Target}
                    text="Warm"
                    color="gold"
                  />
                )}

                {lead.temperature === "Cold" && (
                  <Badge
                    icon={Snowflake}
                    text="Cold"
                    color="blue"
                  />
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
    red: "border-red-400/20 bg-red-500/10 text-red-300",
    gold: "border-[#D4AF37]/20 bg-[#D4AF37]/10 text-[#D4AF37]",
    blue: "border-blue-400/20 bg-blue-500/10 text-blue-300",
    green: "border-emerald-400/20 bg-emerald-500/10 text-emerald-300",
  };

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-bold ${colors[color]}`}
    >
      <Icon size={12} />
      {text}
    </span>
  );
}

export default AiLeadPrioritizationPanel;