import { motion } from "framer-motion";
import {
  AlertTriangle,
  Brain,
  Crown,
  Flame,
  Lightbulb,
  Radar,
  ShieldAlert,
  Sparkles,
  Target,
  Users,
} from "lucide-react";

function AiLeadIntelligenceFeed({
  inquiries = [],
  appointments = [],
}) {
  const allLeads = [...inquiries, ...appointments];

  const insights = [];

  const unassigned = allLeads.filter(
    (lead) => !lead.assigned_admin_id
  );

  const vipLeads = allLeads.filter((lead) =>
    ["vip", "high"].includes(
      String(lead.priority || "").toLowerCase()
    )
  );

  const staleLeads = allLeads.filter((lead) => {
    if (!lead.created_at) return false;

    const age =
      (Date.now() - new Date(lead.created_at).getTime()) /
      86400000;

    return age >= 7;
  });

  const hotLeads = allLeads.filter((lead) =>
    ["vip", "high"].includes(
      String(lead.priority || "").toLowerCase()
    )
  );

  if (vipLeads.length > 0) {
    insights.push({
      icon: Crown,
      title: "VIP Opportunity Detected",
      description: `${vipLeads.length} high-value lead(s) require priority handling.`,
      tone: "gold",
    });
  }

  if (unassigned.length > 0) {
    insights.push({
      icon: Users,
      title: "Ownership Gap",
      description: `${unassigned.length} lead(s) are currently unassigned.`,
      tone: "blue",
    });
  }

  if (staleLeads.length > 0) {
    insights.push({
      icon: Flame,
      title: "Stale Leads Found",
      description: `${staleLeads.length} lead(s) have been inactive for more than 7 days.`,
      tone: "orange",
    });
  }

  if (hotLeads.length > 0) {
    insights.push({
      icon: Target,
      title: "Conversion Opportunity",
      description: `${hotLeads.length} lead(s) have high conversion potential.`,
      tone: "green",
    });
  }

  insights.push({
    icon: Brain,
    title: "Counselor Recommendation",
    description:
      "Prioritize VIP and stale leads before handling new inquiries.",
    tone: "purple",
  });

  const toneMap = {
    gold: "border-[#D4AF37]/20 bg-[#D4AF37]/10 text-[#D4AF37]",
    blue: "border-blue-400/20 bg-blue-500/10 text-blue-300",
    orange: "border-orange-400/20 bg-orange-500/10 text-orange-300",
    green: "border-emerald-400/20 bg-emerald-500/10 text-emerald-300",
    purple: "border-purple-400/20 bg-purple-500/10 text-purple-300",
  };

  return (
    <motion.section
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="rounded-[2rem] border border-white/10 bg-white/[0.03] p-6"
    >
      <div className="flex items-center gap-3">
        <div className="rounded-2xl border border-[#D4AF37]/20 bg-[#D4AF37]/10 p-3">
          <Radar className="h-5 w-5 text-[#D4AF37]" />
        </div>

        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-[#D4AF37]">
            AI Intelligence Feed
          </p>

          <h3 className="text-xl font-black text-white">
            Live CRM Signals
          </h3>
        </div>
      </div>

      <div className="mt-6 space-y-4">
        {insights.map((item, index) => {
          const Icon = item.icon;

          return (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`rounded-[1.5rem] border p-4 ${toneMap[item.tone]}`}
            >
              <div className="flex gap-3">
                <Icon className="mt-1 h-5 w-5" />

                <div>
                  <h4 className="font-bold">
                    {item.title}
                  </h4>

                  <p className="mt-1 text-sm opacity-80">
                    {item.description}
                  </p>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.section>
  );
}

export default AiLeadIntelligenceFeed;