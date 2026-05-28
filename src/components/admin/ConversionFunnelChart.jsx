import { motion } from "framer-motion";
import {
  ArrowDown,
  Award,
  BarChart3,
  CheckCircle2,
  Crown,
  FileCheck,
  Flame,
  Plane,
  Sparkles,
  Target,
  TrendingUp,
  UserCheck,
} from "lucide-react";

function ConversionFunnelChart({ cardClass = "", inquiries = [] }) {
  const safeInquiries = Array.isArray(inquiries) ? inquiries : [];

  const funnel = buildFunnelData(safeInquiries);
  const totalLeads = safeInquiries.length;
  const finalStage = funnel[funnel.length - 1];
  const conversionRate = totalLeads
    ? Math.round((finalStage.count / totalLeads) * 100)
    : 0;

  const strongestStage = [...funnel].sort((a, b) => b.count - a.count)[0];
  const weakestStage = [...funnel]
    .filter((stage) => stage.count > 0)
    .sort((a, b) => a.count - b.count)[0];

  const metricCards = [
    {
      label: "Total Leads",
      value: totalLeads,
      icon: Target,
      color: "text-[#D4AF37]",
      border: "border-[#D4AF37]/20",
      bg: "bg-[#D4AF37]/10",
    },
    {
      label: "Approved",
      value: finalStage.count,
      icon: CheckCircle2,
      color: "text-green-300",
      border: "border-green-400/20",
      bg: "bg-green-400/10",
    },
    {
      label: "Conversion",
      value: `${conversionRate}%`,
      icon: TrendingUp,
      color: "text-blue-300",
      border: "border-blue-400/20",
      bg: "bg-blue-400/10",
    },
    {
      label: "Active Stages",
      value: funnel.filter((stage) => stage.count > 0).length,
      icon: BarChart3,
      color: "text-purple-300",
      border: "border-purple-400/20",
      bg: "bg-purple-400/10",
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
                Conversion Funnel Analytics
              </p>
            </div>

            <h2 className="mt-3 text-2xl font-black tracking-tight text-white sm:text-3xl">
              Student Journey Funnel
            </h2>

            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-gray-400">
              Tracks how inquiry leads move from new student interest to
              contacted, documents, application, offer letter, visa process, and
              final approval.
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

      {totalLeads === 0 ? (
        <div className={`${cardClass} rounded-[2rem] p-8 text-center`}>
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-[#D4AF37]/20 bg-[#D4AF37]/10">
            <BarChart3 className="h-8 w-8 text-[#D4AF37]" />
          </div>

          <h3 className="mt-4 text-xl font-black text-white">
            Funnel will activate with inquiry data
          </h3>

          <p className="mx-auto mt-2 max-w-xl text-sm leading-relaxed text-gray-400">
            Add inquiry records and update pipeline stages to see the full
            student conversion journey.
          </p>
        </div>
      ) : (
        <div className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
          <div className={`${cardClass} rounded-[2rem] p-5 sm:p-6`}>
            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-[#D4AF37]">
                  Funnel Flow
                </p>

                <h3 className="mt-2 text-xl font-black text-white">
                  Lead stage conversion path
                </h3>
              </div>

              <div className="rounded-full border border-[#D4AF37]/20 bg-[#D4AF37]/10 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.2em] text-[#D4AF37]">
                {conversionRate}% final conversion
              </div>
            </div>

            <div className="space-y-4">
              {funnel.map((stage, index) => {
                const Icon = stage.icon;
                const previous = funnel[index - 1];
                const dropRate = previous?.count
                  ? Math.max(
                      0,
                      Math.round(((previous.count - stage.count) / previous.count) * 100)
                    )
                  : 0;

                return (
                  <div key={stage.key}>
                    <motion.div
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.35, delay: index * 0.05 }}
                      className="group relative overflow-hidden rounded-[1.5rem] border border-white/10 bg-white/[0.035] p-4 transition duration-500 hover:-translate-y-0.5 hover:border-[#D4AF37]/30"
                    >
                      <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent opacity-0 transition duration-500 group-hover:opacity-100" />

                      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div className="flex min-w-0 flex-1 items-center gap-4">
                          <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border ${stage.border} ${stage.bg}`}>
                            <Icon className={`h-6 w-6 ${stage.color}`} />
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <h4 className="text-lg font-black text-white">
                                {stage.label}
                              </h4>

                              <span className={`rounded-full border px-3 py-1 text-[9px] font-black uppercase tracking-[0.18em] ${stage.border} ${stage.bg} ${stage.color}`}>
                                {stage.percent}% of leads
                              </span>
                            </div>

                            <p className="mt-1 text-sm leading-relaxed text-gray-400">
                              {stage.description}
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 lg:min-w-[260px]">
                          <MiniMetric
                            label="Leads"
                            value={stage.count}
                            accent={stage.color}
                          />

                          <MiniMetric
                            label="Drop"
                            value={index === 0 ? "—" : `${dropRate}%`}
                            accent={dropRate >= 50 ? "text-red-300" : "text-gray-300"}
                          />
                        </div>
                      </div>

                      <div className="mt-4 h-3 overflow-hidden rounded-full bg-white/[0.06]">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-[#D4AF37] via-cyan-300 to-emerald-300 transition-all duration-700"
                          style={{ width: `${stage.percent}%` }}
                        />
                      </div>
                    </motion.div>

                    {index < funnel.length - 1 && (
                      <div className="flex justify-center py-1">
                        <ArrowDown className="h-5 w-5 text-[#D4AF37]/70" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="space-y-5">
            <InsightCard
              cardClass={cardClass}
              icon={Crown}
              title="Strongest Stage"
              value={strongestStage?.label || "No stage"}
              text={
                strongestStage
                  ? `${strongestStage.count} lead(s) currently sit in this stage.`
                  : "No funnel stage data available yet."
              }
              accent="text-[#D4AF37]"
            />

            <InsightCard
              cardClass={cardClass}
              icon={Flame}
              title="Weakest Active Stage"
              value={weakestStage?.label || "No active stage"}
              text={
                weakestStage
                  ? `Only ${weakestStage.count} lead(s) are currently here. Improve movement into this stage.`
                  : "No active weak stage detected."
              }
              accent="text-red-300"
            />

            <InsightCard
              cardClass={cardClass}
              icon={Award}
              title="CRM Recommendation"
              value="Improve funnel movement"
              text="Focus on moving contacted leads into documents pending, then push documents pending into applied status."
              accent="text-green-300"
            />

            <div className={`${cardClass} rounded-[2rem] p-5 sm:p-6`}>
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[#D4AF37]/20 bg-[#D4AF37]/10">
                  <TrendingUp className="h-5 w-5 text-[#D4AF37]" />
                </div>

                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-gray-500">
                    Funnel Health
                  </p>

                  <h3 className="mt-1 text-lg font-black text-white">
                    {getFunnelHealth(conversionRate)}
                  </h3>
                </div>
              </div>

              <p className="mt-4 text-sm leading-relaxed text-gray-400">
                {getFunnelHealthText(conversionRate)}
              </p>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

function buildFunnelData(inquiries = []) {
  const stages = [
    {
      key: "new",
      label: "New Lead",
      aliases: ["new"],
      description: "Fresh student inquiries waiting for first response.",
      icon: Sparkles,
      color: "text-[#D4AF37]",
      border: "border-[#D4AF37]/20",
      bg: "bg-[#D4AF37]/10",
    },
    {
      key: "contacted",
      label: "Contacted",
      aliases: ["contacted"],
      description: "Students who received first contact or counseling response.",
      icon: UserCheck,
      color: "text-blue-300",
      border: "border-blue-400/20",
      bg: "bg-blue-400/10",
    },
    {
      key: "documents_pending",
      label: "Documents Pending",
      aliases: ["documents_pending", "documents pending", "docs_pending"],
      description: "Students preparing academic, financial, or visa documents.",
      icon: FileCheck,
      color: "text-orange-300",
      border: "border-orange-400/20",
      bg: "bg-orange-400/10",
    },
    {
      key: "applied",
      label: "Applied",
      aliases: ["applied", "application_submitted"],
      description: "Applications submitted to universities or institutions.",
      icon: Target,
      color: "text-purple-300",
      border: "border-purple-400/20",
      bg: "bg-purple-400/10",
    },
    {
      key: "offer_letter",
      label: "Offer Letter",
      aliases: ["offer_letter", "offer letter", "offer"],
      description: "Students who reached offer letter stage.",
      icon: Award,
      color: "text-pink-300",
      border: "border-pink-400/20",
      bg: "bg-pink-400/10",
    },
    {
      key: "visa_process",
      label: "Visa Process",
      aliases: ["visa_process", "visa process", "visa"],
      description: "Students progressing through visa guidance and filing.",
      icon: Plane,
      color: "text-cyan-300",
      border: "border-cyan-400/20",
      bg: "bg-cyan-400/10",
    },
    {
      key: "approved",
      label: "Approved",
      aliases: ["approved"],
      description: "Successful students approved or completed in the journey.",
      icon: CheckCircle2,
      color: "text-green-300",
      border: "border-green-400/20",
      bg: "bg-green-400/10",
    },
  ];

  const total = inquiries.length || 1;

  return stages.map((stage) => {
    const count = inquiries.filter((inquiry) => {
      const status = String(inquiry.status || "new").trim().toLowerCase();
      return stage.aliases.includes(status);
    }).length;

    return {
      ...stage,
      count,
      percent: Math.round((count / total) * 100),
    };
  });
}

function MiniMetric({ label, value, accent }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
      <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-gray-500">
        {label}
      </p>

      <p className={`mt-2 text-lg font-black ${accent}`}>{value}</p>
    </div>
  );
}

function InsightCard({ cardClass, icon: Icon, title, value, text, accent }) {
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

function getFunnelHealth(rate) {
  if (rate >= 35) return "Excellent";
  if (rate >= 20) return "Strong";
  if (rate >= 10) return "Improving";
  return "Needs Work";
}

function getFunnelHealthText(rate) {
  if (rate >= 35) {
    return "Your inquiry-to-approval funnel is performing strongly. Keep improving speed and follow-up consistency.";
  }

  if (rate >= 20) {
    return "Your funnel is healthy, but you can improve by reducing drop-off between contacted and documents pending.";
  }

  if (rate >= 10) {
    return "Your funnel has movement, but needs tighter follow-up and document collection systems.";
  }

  return "Your funnel needs more stage movement. Focus on contacting new leads and pushing them toward documents pending.";
}

export default ConversionFunnelChart;
