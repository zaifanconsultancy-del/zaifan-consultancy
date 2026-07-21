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
    },
    {
      label: "Approved",
      value: finalStage.count,
      icon: CheckCircle2,
    },
    {
      label: "Conversion",
      value: `${conversionRate}%`,
      icon: TrendingUp,
    },
    {
      label: "Active Stages",
      value: funnel.filter((stage) => stage.count > 0).length,
      icon: BarChart3,
    },
  ];

  return (
    <section className="space-y-5">
      <div className="relative overflow-hidden rounded-[2rem] border-2 border-[#E9802D]/45 bg-[#FFFDF8] p-5 shadow-[0_18px_50px_rgba(23,36,61,0.08)] sm:p-6">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#E9802D] via-[#F2A766] to-[#E9802D]" />
        <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-[#E9802D]/10 blur-3xl" />

        <div className="relative flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[#E9802D]/35 bg-[#FFF3E7] px-3 py-1.5">
              <Sparkles className="h-3.5 w-3.5 text-[#D96C1F]" />

              <p className="text-[10px] font-black uppercase tracking-[0.28em] text-[#B84F0E]">
                Conversion Funnel Analytics
              </p>
            </div>

            <h2 className="mt-3 text-2xl font-black tracking-tight text-[#17243D] sm:text-3xl">
              Student Journey Funnel
            </h2>

            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-[#667085]">
              Tracks how inquiry leads move from new student interest to
              contacted, documents, application, offer letter, visa process,
              and final approval.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:min-w-[560px] xl:grid-cols-4">
            {metricCards.map((metric) => {
              const Icon = metric.icon;

              return (
                <div
                  key={metric.label}
                  className="rounded-2xl border border-[#243A60]/25 bg-white p-4 shadow-[0_10px_24px_rgba(23,36,61,0.05)]"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-[#667085]">
                      {metric.label}
                    </p>

                    <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#E9802D]/30 bg-[#FFF3E7]">
                      <Icon className="h-4 w-4 text-[#D96C1F]" />
                    </div>
                  </div>

                  <h3 className="mt-2 text-2xl font-black text-[#17243D]">
                    {metric.value}
                  </h3>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {totalLeads === 0 ? (
        <div
          className={`${cardClass} rounded-[2rem] border-2 border-dashed border-[#E9802D]/35 bg-[#FFFDF8] p-8 text-center`}
        >
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-[#E9802D]/35 bg-[#FFF3E7]">
            <BarChart3 className="h-8 w-8 text-[#D96C1F]" />
          </div>

          <h3 className="mt-4 text-xl font-black text-[#17243D]">
            Funnel will activate with inquiry data
          </h3>

          <p className="mx-auto mt-2 max-w-xl text-sm leading-relaxed text-[#667085]">
            Add inquiry records and update pipeline stages to see the full
            student conversion journey.
          </p>
        </div>
      ) : (
        <div className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
          <div
            className={`${cardClass} rounded-[2rem] border-2 border-[#243A60]/30 bg-[#FFFDF8] p-5 shadow-[0_16px_42px_rgba(23,36,61,0.07)] sm:p-6`}
          >
            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.28em] text-[#B84F0E]">
                  Funnel Flow
                </p>

                <h3 className="mt-2 text-xl font-black text-[#17243D]">
                  Lead stage conversion path
                </h3>
              </div>

              <div className="rounded-full border border-[#E9802D]/35 bg-[#FFF3E7] px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-[#B84F0E]">
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
                      Math.round(
                        ((previous.count - stage.count) / previous.count) * 100
                      )
                    )
                  : 0;

                return (
                  <div key={stage.key}>
                    <motion.div
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.35, delay: index * 0.05 }}
                      className="group relative overflow-hidden rounded-[1.5rem] border border-[#243A60]/25 bg-white p-4 transition duration-300 hover:-translate-y-0.5 hover:border-[#E9802D]/55 hover:shadow-[0_12px_24px_rgba(23,36,61,0.07)]"
                    >
                      <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-[#E9802D] to-transparent opacity-0 transition duration-300 group-hover:opacity-100" />

                      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div className="flex min-w-0 flex-1 items-center gap-4">
                          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-[#E9802D]/30 bg-[#FFF3E7]">
                            <Icon className="h-6 w-6 text-[#D96C1F]" />
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <h4 className="text-lg font-black text-[#17243D]">
                                {stage.label}
                              </h4>

                              <span className="rounded-full border border-[#243A60]/20 bg-[#F5F1E8] px-3 py-1 text-[9px] font-black uppercase tracking-[0.18em] text-[#596579]">
                                {stage.percent}% of leads
                              </span>
                            </div>

                            <p className="mt-1 text-sm leading-relaxed text-[#667085]">
                              {stage.description}
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 lg:min-w-[260px]">
                          <MiniMetric label="Leads" value={stage.count} />
                          <MiniMetric
                            label="Drop"
                            value={index === 0 ? "—" : `${dropRate}%`}
                            danger={dropRate >= 50}
                          />
                        </div>
                      </div>

                      <div className="mt-4 h-3 overflow-hidden rounded-full border border-[#243A60]/10 bg-[#EEF0F3]">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${stage.percent}%` }}
                          transition={{
                            duration: 0.7,
                            delay: index * 0.04,
                          }}
                          className="h-full rounded-full bg-[#E9802D]"
                        />
                      </div>
                    </motion.div>

                    {index < funnel.length - 1 && (
                      <div className="flex justify-center py-1">
                        <ArrowDown className="h-5 w-5 text-[#D96C1F]/70" />
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
              danger
            />

            <InsightCard
              cardClass={cardClass}
              icon={Award}
              title="CRM Recommendation"
              value="Improve funnel movement"
              text="Focus on moving contacted leads into documents pending, then push documents pending into applied status."
            />

            <div
              className={`${cardClass} rounded-[2rem] border-2 border-[#243A60]/30 bg-[#FFFDF8] p-5 shadow-[0_14px_34px_rgba(23,36,61,0.06)] sm:p-6`}
            >
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[#E9802D]/30 bg-[#FFF3E7]">
                  <TrendingUp className="h-5 w-5 text-[#D96C1F]" />
                </div>

                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[#667085]">
                    Funnel Health
                  </p>

                  <h3 className="mt-1 text-lg font-black text-[#17243D]">
                    {getFunnelHealth(conversionRate)}
                  </h3>
                </div>
              </div>

              <p className="mt-4 text-sm leading-relaxed text-[#667085]">
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
    },
    {
      key: "contacted",
      label: "Contacted",
      aliases: ["contacted"],
      description: "Students who received first contact or counseling response.",
      icon: UserCheck,
    },
    {
      key: "documents_pending",
      label: "Documents Pending",
      aliases: ["documents_pending", "documents pending", "docs_pending"],
      description: "Students preparing academic, financial, or visa documents.",
      icon: FileCheck,
    },
    {
      key: "applied",
      label: "Applied",
      aliases: ["applied", "application_submitted"],
      description: "Applications submitted to universities or institutions.",
      icon: Target,
    },
    {
      key: "offer_letter",
      label: "Offer Letter",
      aliases: ["offer_letter", "offer letter", "offer"],
      description: "Students who reached offer letter stage.",
      icon: Award,
    },
    {
      key: "visa_process",
      label: "Visa Process",
      aliases: ["visa_process", "visa process", "visa"],
      description: "Students progressing through visa guidance and filing.",
      icon: Plane,
    },
    {
      key: "approved",
      label: "Approved",
      aliases: ["approved"],
      description: "Successful students approved or completed in the journey.",
      icon: CheckCircle2,
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

function MiniMetric({ label, value, danger = false }) {
  return (
    <div className="rounded-2xl border border-[#243A60]/20 bg-[#F7F3EB] p-3">
      <p className="text-[9px] font-black uppercase tracking-[0.18em] text-[#747D8D]">
        {label}
      </p>

      <p
        className={`mt-2 text-lg font-black ${
          danger ? "text-[#B83A34]" : "text-[#17243D]"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function InsightCard({
  cardClass,
  icon: Icon,
  title,
  value,
  text,
  danger = false,
}) {
  return (
    <div
      className={`${cardClass} rounded-[2rem] border-2 border-[#243A60]/30 bg-[#FFFDF8] p-5 shadow-[0_14px_34px_rgba(23,36,61,0.06)] sm:p-6`}
    >
      <div className="flex items-start gap-4">
        <div
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border ${
            danger
              ? "border-[#C2413B]/30 bg-[#FFF0EE]"
              : "border-[#E9802D]/30 bg-[#FFF3E7]"
          }`}
        >
          <Icon
            className={`h-5 w-5 ${
              danger ? "text-[#C2413B]" : "text-[#D96C1F]"
            }`}
          />
        </div>

        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[#667085]">
            {title}
          </p>

          <h3
            className={`mt-2 text-lg font-black ${
              danger ? "text-[#A8342F]" : "text-[#17243D]"
            }`}
          >
            {value}
          </h3>

          <p className="mt-2 text-sm leading-relaxed text-[#667085]">{text}</p>
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