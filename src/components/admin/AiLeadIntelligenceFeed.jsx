import { motion } from "framer-motion";
import {
  AlertTriangle,
  Brain,
  Clock3,
  Crown,
  Flame,
  Lightbulb,
  Radar,
  ShieldAlert,
  Sparkles,
  Target,
  TrendingDown,
  TrendingUp,
  Zap,
} from "lucide-react";
import { enrichLeadWithAi } from "../../services/aiLeadEngine";

function AiLeadIntelligenceFeed({
  cardClass = "",
  inquiries = [],
  appointments = [],
}) {
  const insights = buildIntelligenceFeed({ inquiries, appointments });
  const topInsights = insights.slice(0, 12);

  const urgentCount = insights.filter((item) => item.level === "urgent").length;
  const opportunityCount = insights.filter(
    (item) => item.category === "Opportunity"
  ).length;
  const riskCount = insights.filter((item) => item.category === "Risk").length;
  const automationCount = insights.filter(
    (item) => item.category === "Automation"
  ).length;

  const metricCards = [
    {
      label: "AI Insights",
      value: insights.length,
      icon: Brain,
      color: "text-[#D4AF37]",
      border: "border-[#D4AF37]/20",
      bg: "bg-[#D4AF37]/10",
    },
    {
      label: "Urgent",
      value: urgentCount,
      icon: Flame,
      color: "text-red-300",
      border: "border-red-400/20",
      bg: "bg-red-400/10",
    },
    {
      label: "Opportunities",
      value: opportunityCount,
      icon: TrendingUp,
      color: "text-green-300",
      border: "border-green-400/20",
      bg: "bg-green-400/10",
    },
    {
      label: "Risks",
      value: riskCount,
      icon: ShieldAlert,
      color: "text-orange-300",
      border: "border-orange-400/20",
      bg: "bg-orange-400/10",
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
                AI Lead Intelligence Feed
              </p>
            </div>

            <h2 className="mt-3 text-2xl font-black tracking-tight text-white sm:text-3xl">
              Live CRM Insight Stream
            </h2>

            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-gray-400">
              Detects hot opportunities, cold lead risk, VIP inactivity,
              automation signals, and next-best actions across inquiries and
              appointments.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:min-w-[560px] xl:grid-cols-4">
            {metricCards.map((metric) => {
              const Icon = metric.icon;

              return (
                <div
                  key={metric.label}
                  className={`rounded-2xl border ${metric.border} ${metric.bg} p-4 backdrop-blur-xl`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-gray-400">
                      {metric.label}
                    </p>

                    <Icon className={`h-4 w-4 ${metric.color}`} />
                  </div>

                  <h3 className={`mt-2 text-2xl font-black ${metric.color}`}>
                    {metric.value}
                  </h3>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {topInsights.length === 0 ? (
        <div className={`${cardClass} rounded-[2rem] p-8 text-center`}>
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-green-400/20 bg-green-500/10">
            <Radar className="h-8 w-8 text-green-300" />
          </div>

          <h3 className="mt-4 text-xl font-black text-white">
            No major AI signals right now
          </h3>

          <p className="mx-auto mt-2 max-w-xl text-sm leading-relaxed text-gray-400">
            As new leads, appointments, and statuses change, AI insights will
            appear here automatically.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          {topInsights.map((insight, index) => {
            const Icon = insight.icon;

            return (
              <motion.div
                key={insight.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: index * 0.04 }}
                className={`${cardClass} group relative overflow-hidden rounded-[2rem] p-5 transition duration-500 hover:-translate-y-0.5 hover:border-[#D4AF37]/30 sm:p-6`}
              >
                <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent opacity-0 transition duration-500 group-hover:opacity-100" />

                <div className="flex items-start gap-4">
                  <div
                    className={`flex h-13 w-13 shrink-0 items-center justify-center rounded-2xl border p-3 ${getInsightBoxStyle(
                      insight.level
                    )}`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`rounded-full border px-3 py-1 text-[9px] font-black uppercase tracking-[0.18em] ${getInsightBadgeStyle(
                          insight.level
                        )}`}
                      >
                        {insight.level}
                      </span>

                      <span className="rounded-full border border-blue-400/20 bg-blue-400/10 px-3 py-1 text-[9px] font-bold uppercase tracking-[0.18em] text-blue-300">
                        {insight.leadType}
                      </span>

                      <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-[9px] font-bold uppercase tracking-[0.18em] text-gray-400">
                        {insight.category}
                      </span>
                    </div>

                    <h3 className="mt-3 text-lg font-black text-white sm:text-xl">
                      {insight.title}
                    </h3>

                    <p className="mt-1 text-sm font-semibold text-[#D4AF37]">
                      {insight.leadName}
                    </p>

                    <p className="mt-3 text-sm leading-relaxed text-gray-400">
                      {insight.message}
                    </p>

                    <div className="mt-4 rounded-[1.4rem] border border-white/10 bg-black/20 p-4">
                      <div className="flex items-start gap-3">
                        <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-[#D4AF37]" />

                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-gray-500">
                            Next Best Action
                          </p>

                          <p className="mt-1 text-sm leading-relaxed text-gray-300">
                            {insight.action}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2 text-[10px] font-bold uppercase tracking-[0.16em] text-gray-400">
                      <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1">
                        AI Score: {insight.score}
                      </span>

                      <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1">
                        Probability: {insight.probability}
                      </span>

                      <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1">
                        Age: {insight.ageDays}d
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </section>
  );
}

function buildIntelligenceFeed({ inquiries = [], appointments = [] }) {
  const inquiryInsights = inquiries.flatMap((inquiry) => {
    const lead = enrichLeadWithAi(inquiry, "inquiry");
    return buildLeadInsights(lead, "inquiry");
  });

  const appointmentInsights = appointments.flatMap((appointment) => {
    const lead = enrichLeadWithAi(appointment, "appointment");
    return buildLeadInsights(lead, "appointment");
  });

  return [...inquiryInsights, ...appointmentInsights].sort((a, b) => {
    const levelWeight = {
      urgent: 4,
      high: 3,
      medium: 2,
      low: 1,
    };

    const levelDiff =
      (levelWeight[b.level] || 0) - (levelWeight[a.level] || 0);

    if (levelDiff !== 0) return levelDiff;

    return b.score - a.score;
  });
}

function buildLeadInsights(lead, leadType) {
  const insights = [];
  const status = String(lead.status || "new").toLowerCase();
  const priority = String(lead.priority || "low").toLowerCase();
  const stage = String(lead.appointment_stage || "").toLowerCase();
  const leadName = lead.full_name || "Unnamed Lead";

  if (lead.ai_score >= 85) {
    insights.push({
      id: `${leadType}-${lead.id}-hot`,
      leadType,
      leadName,
      level: "urgent",
      category: "Opportunity",
      icon: Flame,
      title: "Hot lead likely to convert",
      message:
        "This lead has a very strong AI score and should be handled before normal leads.",
      action: lead.ai_recommended_action,
      score: lead.ai_score,
      probability: lead.ai_conversion_probability,
      ageDays: lead.ai_age_days,
    });
  }

  if (priority === "vip" || priority === "high") {
    insights.push({
      id: `${leadType}-${lead.id}-priority`,
      leadType,
      leadName,
      level: "urgent",
      category: "VIP",
      icon: Crown,
      title: "High-priority student needs attention",
      message:
        "This lead is marked VIP or High priority. Senior handling is recommended.",
      action: "Contact personally and move this lead through the fastest possible counseling path.",
      score: lead.ai_score,
      probability: lead.ai_conversion_probability,
      ageDays: lead.ai_age_days,
    });
  }

  if ((status === "new" || !status) && lead.ai_age_days >= 3) {
    insights.push({
      id: `${leadType}-${lead.id}-cold-risk`,
      leadType,
      leadName,
      level: "high",
      category: "Risk",
      icon: TrendingDown,
      title: "Lead is going cold",
      message:
        "This lead has stayed new for too long. Conversion chance may drop if no follow-up happens soon.",
      action: "Send recovery WhatsApp or call, then mark the lead as contacted.",
      score: lead.ai_score,
      probability: lead.ai_conversion_probability,
      ageDays: lead.ai_age_days,
    });
  }

  if (
    ["contacted", "documents_pending"].includes(status) &&
    lead.ai_score >= 65
  ) {
    insights.push({
      id: `${leadType}-${lead.id}-next-stage`,
      leadType,
      leadName,
      level: "medium",
      category: "Automation",
      icon: Zap,
      title: "Lead may be ready for next stage",
      message:
        "This lead has enough quality signals to push toward documents, application, or offer tracking.",
      action: lead.ai_recommended_action,
      score: lead.ai_score,
      probability: lead.ai_conversion_probability,
      ageDays: lead.ai_age_days,
    });
  }

  if (leadType === "appointment" && status === "pending") {
    insights.push({
      id: `${leadType}-${lead.id}-pending-appointment`,
      leadType,
      leadName,
      level: priority === "vip" || priority === "high" ? "urgent" : "medium",
      category: "Appointment",
      icon: Clock3,
      title: "Appointment needs confirmation",
      message:
        "This appointment is still pending. Confirming it quickly improves attendance and trust.",
      action: "Confirm the appointment after checking date and time with the student.",
      score: lead.ai_score,
      probability: lead.ai_conversion_probability,
      ageDays: lead.ai_age_days,
    });
  }

  if (
    leadType === "appointment" &&
    ["consultation_done", "follow_up_needed"].includes(stage)
  ) {
    insights.push({
      id: `${leadType}-${lead.id}-post-consultation`,
      leadType,
      leadName,
      level: "high",
      category: "Follow-up",
      icon: Target,
      title: "Post-consultation follow-up opportunity",
      message:
        "This student has already interacted with the consultancy. Follow-up can convert interest into application.",
      action: "Send next-step checklist and ask for documents or application decision.",
      score: lead.ai_score,
      probability: lead.ai_conversion_probability,
      ageDays: lead.ai_age_days,
    });
  }

  if (lead.ai_score < 40 && lead.ai_age_days >= 7) {
    insights.push({
      id: `${leadType}-${lead.id}-low-value-aging`,
      leadType,
      leadName,
      level: "low",
      category: "Cleanup",
      icon: AlertTriangle,
      title: "Low-value aging lead",
      message:
        "This lead appears low-intent and old. It may need a final recovery attempt or cleanup.",
      action: "Send one final recovery message, then deprioritize if there is no response.",
      score: lead.ai_score,
      probability: lead.ai_conversion_probability,
      ageDays: lead.ai_age_days,
    });
  }

  return insights;
}

function getInsightBoxStyle(level) {
  if (level === "urgent") {
    return "border-red-400/25 bg-red-500/10 text-red-300";
  }

  if (level === "high") {
    return "border-orange-400/25 bg-orange-500/10 text-orange-300";
  }

  if (level === "medium") {
    return "border-[#D4AF37]/25 bg-[#D4AF37]/10 text-[#D4AF37]";
  }

  return "border-blue-400/25 bg-blue-500/10 text-blue-300";
}

function getInsightBadgeStyle(level) {
  if (level === "urgent") {
    return "border-red-400/25 bg-red-500/10 text-red-300";
  }

  if (level === "high") {
    return "border-orange-400/25 bg-orange-500/10 text-orange-300";
  }

  if (level === "medium") {
    return "border-[#D4AF37]/25 bg-[#D4AF37]/10 text-[#D4AF37]";
  }

  return "border-blue-400/25 bg-blue-500/10 text-blue-300";
}

export default AiLeadIntelligenceFeed;
