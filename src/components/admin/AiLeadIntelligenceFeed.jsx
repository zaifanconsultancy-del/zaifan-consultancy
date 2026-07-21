// AiLeadIntelligenceFeed V3 — Advanced Live CRM Signals
// Preserves VIP, unassigned, stale and conversion signal generation.
// Rebuilt as a higher-contrast AI intelligence surface.

import { motion } from "framer-motion";
import {
  Brain,
  Crown,
  Flame,
  Radar,
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
    gold: "border-orange-300 bg-orange-50 text-orange-700",
    blue: "border-blue-300 bg-blue-50 text-blue-700",
    orange: "border-orange-300 bg-[#fff7ed] text-orange-700",
    green: "border-emerald-300 bg-emerald-50 text-emerald-700",
    purple: "border-violet-300 bg-violet-50 text-violet-700",
  };

  return (
    <motion.section
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="overflow-hidden rounded-[1.85rem] border-2 border-orange-300 bg-white shadow-[0_12px_30px_rgba(15,35,63,0.05)]"
    >
      <div className="flex items-center gap-3 bg-[#102f5c] p-6 text-white">
        <div className="rounded-2xl border border-orange-400/40 bg-orange-500/15 p-3">
          <Radar className="h-5 w-5 text-orange-300" />
        </div>

        <div>
          <p className="text-xs font-black uppercase tracking-[0.3em] text-orange-300">
            AI Intelligence Feed
          </p>

          <h3 className="text-xl font-black text-white">
            Live CRM Signals
          </h3>
        </div>
      </div>

      <div className="space-y-4 bg-[#fff8ee] p-6">
        {insights.map((item, index) => {
          const Icon = item.icon;

          return (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`rounded-[1.5rem] border p-4 shadow-[0_5px_16px_rgba(15,35,63,0.03)] ${toneMap[item.tone]}`}
            >
              <div className="flex gap-3">
                <Icon className="mt-1 h-5 w-5 shrink-0" />

                <div>
                  <h4 className="font-black text-[#10233f]">
                    {item.title}
                  </h4>

                  <p className="mt-1 text-sm leading-6 text-slate-700">
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