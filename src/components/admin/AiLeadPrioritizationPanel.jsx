import { motion } from "framer-motion";
import {
  AlertTriangle,
  Brain,
  Crown,
  Flame,
  Sparkles,
  Target,
  TrendingUp,
  Zap,
} from "lucide-react";
import { buildAiLeadInsights } from "../../services/aiLeadEngine";

function AiLeadPrioritizationPanel({
  cardClass = "",
  inquiries = [],
  appointments = [],
}) {
  const insights = buildAiLeadInsights({ inquiries, appointments });

  const metricCards = [
    {
      label: "AI Score Avg",
      value: insights.averageScore,
      suffix: "/100",
      icon: Brain,
      color: "text-[#D4AF37]",
      bg: "bg-[#D4AF37]/10",
      border: "border-[#D4AF37]/20",
    },
    {
      label: "Hot Leads",
      value: insights.hotLeads.length,
      suffix: "",
      icon: Flame,
      color: "text-red-300",
      bg: "bg-red-400/10",
      border: "border-red-400/20",
    },
    {
      label: "Warm Leads",
      value: insights.warmLeads.length,
      suffix: "",
      icon: Zap,
      color: "text-orange-300",
      bg: "bg-orange-400/10",
      border: "border-orange-400/20",
    },
    {
      label: "Immediate Action",
      value: insights.immediateLeads.length,
      suffix: "",
      icon: AlertTriangle,
      color: "text-purple-300",
      bg: "bg-purple-400/10",
      border: "border-purple-400/20",
    },
  ];

  return (
    <section className="space-y-5">
      <div className="relative overflow-hidden rounded-[2rem] border border-[#D4AF37]/15 bg-gradient-to-br from-[#D4AF37]/10 via-white/[0.035] to-black/30 p-5 backdrop-blur-2xl sm:p-6">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(212,175,55,0.13),transparent_36%)]" />

        <div className="relative flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[#D4AF37]/20 bg-[#D4AF37]/10 px-3 py-1.5">
              <Sparkles className="h-3.5 w-3.5 text-[#D4AF37]" />
              <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-[#D4AF37]">
                AI Lead Prioritization
              </p>
            </div>

            <h2 className="mt-3 text-2xl font-black tracking-tight text-white sm:text-3xl">
              Smart Lead Ranking Engine
            </h2>

            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-gray-400">
              Automatically ranks every inquiry and appointment by intent,
              urgency, conversion probability, destination value, pipeline stage,
              and follow-up timing.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:min-w-[520px]">
            {metricCards.map((metric) => {
              const Icon = metric.icon;

              return (
                <div
                  key={metric.label}
                  className={`rounded-2xl border ${metric.border} ${metric.bg} p-4 backdrop-blur-xl`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-[9px] font-bold uppercase tracking-[0.24em] text-gray-400">
                      {metric.label}
                    </p>
                    <Icon className={`h-4 w-4 ${metric.color}`} />
                  </div>

                  <h3 className={`mt-2 text-2xl font-black ${metric.color}`}>
                    {metric.value}
                    <span className="text-sm text-gray-500">{metric.suffix}</span>
                  </h3>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {insights.totalAnalyzed === 0 ? (
        <div className={`${cardClass} rounded-[2rem] p-8 text-center`}>
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-[#D4AF37]/20 bg-[#D4AF37]/10">
            <Brain className="h-8 w-8 text-[#D4AF37]" />
          </div>

          <h3 className="mt-4 text-xl font-black text-white">
            AI ranking will activate with CRM data
          </h3>

          <p className="mx-auto mt-2 max-w-xl text-sm leading-relaxed text-gray-400">
            Once inquiries or appointments exist, this panel will show the best
            leads to contact first.
          </p>
        </div>
      ) : (
        <div className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
          <div className={`${cardClass} rounded-[2rem] p-5 sm:p-6`}>
            <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-[#D4AF37]">
                  Priority Queue
                </p>
                <h3 className="mt-2 text-xl font-black text-white">
                  Top AI-ranked leads
                </h3>
              </div>

              <div className="rounded-full border border-[#D4AF37]/20 bg-[#D4AF37]/10 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.2em] text-[#D4AF37]">
                {insights.totalAnalyzed} analyzed
              </div>
            </div>

            <div className="space-y-3">
              {insights.topLeads.slice(0, 8).map((lead, index) => (
                <motion.div
                  key={`${lead.lead_type}-${lead.id || index}`}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, delay: index * 0.04 }}
                  className={`group relative overflow-hidden rounded-[1.5rem] border ${lead.ai_tier.border} ${lead.ai_tier.bg} p-4 transition duration-500 hover:-translate-y-0.5 hover:border-[#D4AF37]/35`}
                >
                  <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent opacity-0 transition duration-500 group-hover:opacity-100" />

                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full border border-white/10 bg-black/25 px-3 py-1 text-[9px] font-bold uppercase tracking-[0.18em] text-gray-300">
                          #{index + 1}
                        </span>

                        <span
                          className={`rounded-full border ${lead.ai_tier.border} ${lead.ai_tier.bg} px-3 py-1 text-[9px] font-black uppercase tracking-[0.18em] ${lead.ai_tier.color}`}
                        >
                          {lead.ai_tier.badge}
                        </span>

                        <span className="rounded-full border border-blue-400/20 bg-blue-400/10 px-3 py-1 text-[9px] font-bold uppercase tracking-[0.18em] text-blue-300">
                          {lead.lead_type}
                        </span>
                      </div>

                      <h4 className="mt-3 truncate text-lg font-black text-white">
                        {lead.full_name || "Unnamed Lead"}
                      </h4>

                      <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-gray-400">
                        {lead.ai_recommended_action}
                      </p>

                      <div className="mt-3 flex flex-wrap gap-2 text-[10px] font-bold uppercase tracking-[0.16em] text-gray-400">
                        <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1">
                          Probability: {lead.ai_conversion_probability}
                        </span>
                        <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1">
                          Urgency: {lead.ai_urgency.label}
                        </span>
                        <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1">
                          Age: {lead.ai_age_days}d
                        </span>
                      </div>
                    </div>

                    <div className="flex shrink-0 flex-row items-center gap-3 lg:flex-col lg:items-end">
                      <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-[#D4AF37]/20 bg-black/30 text-xl font-black text-[#D4AF37]">
                        {lead.ai_score}
                      </div>

                      <p className="text-[9px] font-bold uppercase tracking-[0.22em] text-gray-500">
                        AI Score
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          <div className="space-y-5">
            <InsightBox
              cardClass={cardClass}
              icon={Crown}
              title="Best lead right now"
              value={insights.topLeads[0]?.full_name || "No lead found"}
              text={
                insights.topLeads[0]?.ai_recommended_action ||
                "AI needs more CRM data to recommend a lead."
              }
              accent="text-[#D4AF37]"
            />

            <InsightBox
              cardClass={cardClass}
              icon={Target}
              title="Highest urgency"
              value={
                insights.immediateLeads[0]?.full_name ||
                insights.highUrgencyLeads[0]?.full_name ||
                "No urgent lead"
              }
              text={
                insights.immediateLeads[0]?.ai_urgency.message ||
                insights.highUrgencyLeads[0]?.ai_urgency.message ||
                "No urgent lead pressure detected."
              }
              accent="text-red-300"
            />

            <InsightBox
              cardClass={cardClass}
              icon={TrendingUp}
              title="AI recommendation"
              value="Focus order"
              text="Call hot leads first, confirm pending appointments second, then recover aging new inquiries before they go cold."
              accent="text-green-300"
            />
          </div>
        </div>
      )}
    </section>
  );
}

function InsightBox({ cardClass, icon: Icon, title, value, text, accent }) {
  return (
    <div className={`${cardClass} rounded-[2rem] p-5 sm:p-6`}>
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-[#D4AF37]/20 bg-[#D4AF37]/10">
          <Icon className={`h-5 w-5 ${accent}`} />
        </div>

        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-gray-500">
            {title}
          </p>

          <h3 className={`mt-2 text-lg font-black ${accent}`}>{value}</h3>

          <p className="mt-2 text-sm leading-relaxed text-gray-400">{text}</p>
        </div>
      </div>
    </div>
  );
}

export default AiLeadPrioritizationPanel;
