// ConversionFunnelChart V5.1 MAXIMUM — Framed Funnel + JSX Fix
// src/components/admin/ConversionFunnelChart.jsx
//
// Maximum pass:
// - preserves existing cardClass + inquiries API
// - fixes false sequential "drop-off" math from snapshot stage counts
// - normalizes aliases consistently
// - detects unknown/unmapped pipeline stages
// - distinguishes stage distribution from true cohort conversion
// - preserves approved / total outcome metric while labeling it accurately
// - adds stage concentration, pipeline depth, data quality and operational guidance
// - removes unsupported generic recommendations
// - responsive, reduced-motion aware and high contrast
// - approved Zaifan Admin OS orange/navy visual system
// - navy surfaces use white text only

import { motion, useReducedMotion } from "framer-motion";
import {
  AlertTriangle,
  Award,
  BarChart3,
  CheckCircle2,
  CircleDot,
  FileCheck,
  Gauge,
  Info,
  Plane,
  Sparkles,
  Target,
  TrendingUp,
  UserCheck,
} from "lucide-react";

const FUNNEL_STAGES = [
  {
    key: "new",
    label: "New Lead",
    shortLabel: "New",
    aliases: ["new", "new_lead", "new_inquiry"],
    description: "Fresh student inquiries waiting for first response.",
    icon: Sparkles,
  },
  {
    key: "contacted",
    label: "Contacted",
    shortLabel: "Contacted",
    aliases: ["contacted", "first_contact", "contact_made"],
    description: "Students who received first contact or counseling response.",
    icon: UserCheck,
  },
  {
    key: "documents_pending",
    label: "Documents Pending",
    shortLabel: "Documents",
    aliases: [
      "documents_pending",
      "documents pending",
      "docs_pending",
      "document_pending",
    ],
    description: "Students preparing academic, financial, or visa documents.",
    icon: FileCheck,
  },
  {
    key: "applied",
    label: "Applied",
    shortLabel: "Applied",
    aliases: ["applied", "application_submitted", "submitted"],
    description: "Applications submitted to universities or institutions.",
    icon: Target,
  },
  {
    key: "offer_letter",
    label: "Offer Letter",
    shortLabel: "Offer",
    aliases: ["offer_letter", "offer letter", "offer", "offer_received"],
    description: "Students who reached an offer-letter decision stage.",
    icon: Award,
  },
  {
    key: "visa_process",
    label: "Visa Process",
    shortLabel: "Visa",
    aliases: ["visa_process", "visa process", "visa", "visa_processing"],
    description: "Students progressing through visa guidance and filing.",
    icon: Plane,
  },
  {
    key: "approved",
    label: "Approved",
    shortLabel: "Approved",
    aliases: ["approved", "visa_approved", "completed", "success"],
    description: "Students successfully approved or completed in the journey.",
    icon: CheckCircle2,
  },
];

function normalize(value = "") {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replaceAll("-", "_")
    .replace(/\s+/g, "_");
}

function clamp(value, min = 0, max = 100) {
  return Math.min(max, Math.max(min, Number(value) || 0));
}

function ConversionFunnelChart({ cardClass = "", inquiries = [] }) {
  const reduceMotion = useReducedMotion();
  const safeInquiries = Array.isArray(inquiries) ? inquiries : [];

  const analytics = buildFunnelAnalytics(safeInquiries);
  const {
    funnel,
    totalLeads,
    approvedCount,
    approvedShare,
    activeStages,
    unknownCount,
    dataQuality,
    averageDepth,
    concentration,
    deepestActiveStage,
  } = analytics;

  const metricCards = [
    {
      label: "Tracked Leads",
      value: totalLeads,
      helper: "Inquiry records in this snapshot",
      icon: Target,
      tone: "orange",
    },
    {
      label: "Approved",
      value: approvedCount,
      helper: `${approvedShare}% of tracked inquiries`,
      icon: CheckCircle2,
      tone: approvedCount ? "green" : "blue",
    },
    {
      label: "Pipeline Depth",
      value: `${averageDepth}%`,
      helper: "Average current stage position",
      icon: TrendingUp,
      tone: averageDepth >= 60 ? "green" : averageDepth >= 35 ? "orange" : "blue",
    },
    {
      label: "Data Quality",
      value: `${dataQuality}%`,
      helper: unknownCount ? `${unknownCount} unmapped record(s)` : "All stages recognized",
      icon: Gauge,
      tone: dataQuality >= 90 ? "green" : dataQuality >= 70 ? "amber" : "red",
    },
  ];

  return (
    <section className="space-y-5">
      <motion.header
        initial={reduceMotion ? false : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: reduceMotion ? 0 : 0.28 }}
        className={`${cardClass} min-w-0 overflow-hidden rounded-[2rem] border-[3px] border-[#C9D7E6] bg-[#FFFDF8] p-3 shadow-[0_16px_42px_rgba(15,35,63,0.08)] sm:p-4`}
      >
        <div className="grid min-w-0 overflow-hidden rounded-[1.7rem] border-[3px] border-[#F97316] xl:grid-cols-[minmax(0,1.2fr)_minmax(20rem,0.8fr)]">
          <div className="min-w-0 bg-[#173F6B] p-5 text-white sm:p-6">
            <div className="flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-2 rounded-full border-2 border-white/20 bg-white/10 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.14em] text-white">
                <BarChart3 size={13} />
                Funnel Intelligence
              </span>

              <span className="inline-flex items-center gap-2 rounded-full border-2 border-white/20 bg-white/10 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.14em] text-white">
                <CircleDot size={13} />
                Live Snapshot
              </span>
            </div>

            <h2 className="mt-4 break-words text-2xl font-black leading-tight tracking-tight text-white sm:text-3xl">
              Student Journey Funnel
            </h2>

            <p className="mt-2 max-w-3xl break-words text-sm font-semibold leading-6 text-white">
              See where inquiry records currently sit across the Zaifan student
              journey, how deep the active pipeline has progressed, and where
              workload is concentrated.
            </p>

            <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
              <DarkMetric label="Leads" value={totalLeads} />
              <DarkMetric label="Active Stages" value={activeStages} />
              <DarkMetric label="Approved" value={approvedCount} />
              <DarkMetric label="Unmapped" value={unknownCount} />
            </div>
          </div>

          <div className="min-w-0 border-t-[3px] border-[#F97316] bg-[#E96512] p-5 text-white sm:p-6 xl:border-l-[3px] xl:border-t-0">
            <p className="text-[9px] font-black uppercase tracking-[0.15em] text-white">
              Pipeline Snapshot
            </p>

            <p className="mt-3 text-4xl font-black text-white">
              {approvedShare}%
            </p>

            <p className="mt-1 text-sm font-black text-white">
              currently approved
            </p>

            <div className="mt-4 rounded-xl border-2 border-white/25 bg-white/10 p-4 text-white">
              <p className="text-[9px] font-black uppercase tracking-[0.12em] text-white">
                Deepest Active Stage
              </p>
              <p className="mt-1 text-lg font-black text-white">
                {deepestActiveStage?.label || "No active stage"}
              </p>
            </div>

            <p className="mt-4 text-xs font-semibold leading-5 text-white">
              This is a current-state funnel. True historical conversion and
              drop-off require student stage-transition history.
            </p>
          </div>
        </div>
      </motion.header>

      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,13rem),1fr))] gap-3">
        {metricCards.map((metric, index) => (
          <MetricCard
            key={metric.label}
            {...metric}
            index={index}
            reduceMotion={reduceMotion}
          />
        ))}
      </div>

      {totalLeads === 0 ? (
        <div
          className={`${cardClass} rounded-[2rem] border-[3px] border-dashed border-[#F97316] bg-[#FFFDF8] p-9 text-center shadow-[0_8px_22px_rgba(15,35,63,0.04)]`}
        >
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border-2 border-[#F97316] bg-[#FFF4E8] text-orange-700">
            <BarChart3 size={28} />
          </div>

          <h3 className="mt-4 text-xl font-black text-[#10233f]">
            Funnel will activate with inquiry data
          </h3>

          <p className="mx-auto mt-2 max-w-xl text-sm font-semibold leading-6 text-slate-600">
            Add inquiry records and update their pipeline stages to see student
            distribution, pipeline depth and stage concentration.
          </p>
        </div>
      ) : (
        <div className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
          <div
            className={`${cardClass} min-w-0 overflow-hidden rounded-[2rem] border-[3px] border-[#C9D7E6] bg-[#FFFDF8] p-3 shadow-[0_14px_36px_rgba(15,35,63,0.07)]`}
          >
            <div className="overflow-hidden rounded-[1.6rem] border-[3px] border-[#F97316]">
              <div className="min-w-0 bg-[#173F6B] p-5 text-white sm:p-6">
                <p className="text-[9px] font-black uppercase tracking-[0.15em] text-white">
                  Stage Distribution
                </p>

                <h3 className="mt-1 break-words text-xl font-black leading-6 text-white">
                  Current inquiry pipeline
                </h3>

                <p className="mt-1 break-words text-sm font-semibold leading-5 text-white">
                  Each bar represents the share of all tracked inquiry records
                  currently sitting in that stage.
                </p>
              </div>

              <div className="space-y-3 bg-[#FFF8EE] p-4 sm:p-5">
                {funnel.map((stage, index) => {
                  const Icon = stage.icon;

                  return (
                    <motion.article
                      key={stage.key}
                      initial={reduceMotion ? false : { opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{
                        duration: reduceMotion ? 0 : 0.22,
                        delay: reduceMotion ? 0 : index * 0.025,
                      }}
                      className="min-w-0 rounded-[1.3rem] border-[3px] border-[#D1DCE7] bg-[#FFFDF8] p-4 transition hover:border-[#F97316] hover:shadow-[0_8px_20px_rgba(15,35,63,0.055)]"
                    >
                      <div className="flex min-w-0 items-start gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border-2 border-[#F97316] bg-[#FFF4E8] text-orange-700">
                          <Icon size={18} />
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex min-w-0 flex-wrap items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="flex min-w-0 flex-wrap items-center gap-2">
                                <h4 className="break-words font-black text-[#10233f]">
                                  {stage.label}
                                </h4>

                                <span className="rounded-full border-2 border-[#C9D7E6] bg-white px-2.5 py-1 text-[9px] font-black uppercase text-slate-600">
                                  Stage {index + 1}/{funnel.length}
                                </span>
                              </div>

                              <p className="mt-1 break-words text-xs font-semibold leading-5 text-slate-600">
                                {stage.description}
                              </p>
                            </div>

                            <div className="shrink-0 text-right">
                              <p className="text-xl font-black text-[#10233f]">
                                {stage.count}
                              </p>
                              <p className="text-[9px] font-black uppercase tracking-[0.1em] text-orange-700">
                                {stage.percent}% share
                              </p>
                            </div>
                          </div>

                          <div className="mt-3 h-2.5 overflow-hidden rounded-full border border-slate-200 bg-slate-100">
                            <motion.div
                              initial={reduceMotion ? false : { width: 0 }}
                              animate={{ width: `${stage.percent}%` }}
                              transition={{
                                duration: reduceMotion ? 0 : 0.55,
                                delay: reduceMotion ? 0 : 0.04 + index * 0.025,
                              }}
                              className="h-full rounded-full bg-[#E96512]"
                            />
                          </div>
                        </div>
                      </div>
                    </motion.article>
                  );
                })}
              </div>
            </div>
          </div>

          <aside className="space-y-4">
            <InsightCard
              icon={CircleDot}
              eyebrow="Largest Workload"
              title={concentration.title}
              description={concentration.description}
              tone={concentration.tone}
            />

            <InsightCard
              icon={TrendingUp}
              eyebrow="Pipeline Depth"
              title={`${averageDepth}% average depth`}
              description={getDepthMessage(averageDepth, deepestActiveStage)}
              tone={averageDepth >= 60 ? "green" : averageDepth >= 35 ? "orange" : "blue"}
            />

            <InsightCard
              icon={Gauge}
              eyebrow="Data Quality"
              title={`${dataQuality}% mapped correctly`}
              description={
                unknownCount
                  ? `${unknownCount} inquiry record(s) use a status that does not match this funnel. Review those statuses before trusting pipeline reporting.`
                  : "Every inquiry in this snapshot maps to a recognized Zaifan funnel stage."
              }
              tone={unknownCount ? "amber" : "green"}
            />

            <OperationalRecommendation analytics={analytics} />

            <MethodologyNote />
          </aside>
        </div>
      )}
    </section>
  );
}

function buildFunnelAnalytics(inquiries = []) {
  const aliasMap = new Map();

  FUNNEL_STAGES.forEach((stage) => {
    [stage.key, ...stage.aliases].forEach((alias) => {
      aliasMap.set(normalize(alias), stage.key);
    });
  });

  const counts = Object.fromEntries(FUNNEL_STAGES.map((stage) => [stage.key, 0]));
  let unknownCount = 0;
  let depthTotal = 0;
  let mappedCount = 0;

  inquiries.forEach((inquiry) => {
    const rawStatus =
      inquiry?.status ||
      inquiry?.pipeline_stage ||
      inquiry?.lead_status ||
      "new";

    const mappedKey = aliasMap.get(normalize(rawStatus));

    if (!mappedKey) {
      unknownCount += 1;
      return;
    }

    counts[mappedKey] += 1;
    mappedCount += 1;

    const index = FUNNEL_STAGES.findIndex((stage) => stage.key === mappedKey);
    if (index >= 0) {
      depthTotal += index;
    }
  });

  const totalLeads = inquiries.length;
  const denominator = totalLeads || 1;

  const funnel = FUNNEL_STAGES.map((stage) => ({
    ...stage,
    count: counts[stage.key],
    percent: totalLeads
      ? Math.round((counts[stage.key] / denominator) * 100)
      : 0,
  }));

  const approvedCount = counts.approved || 0;
  const approvedShare = totalLeads
    ? Math.round((approvedCount / totalLeads) * 100)
    : 0;

  const activeStages = funnel.filter((stage) => stage.count > 0).length;

  const dataQuality = totalLeads
    ? clamp(Math.round((mappedCount / totalLeads) * 100))
    : 0;

  const maxStageIndex = FUNNEL_STAGES.length - 1;
  const averageDepth =
    mappedCount && maxStageIndex
      ? clamp(Math.round((depthTotal / mappedCount / maxStageIndex) * 100))
      : 0;

  const active = funnel.filter((stage) => stage.count > 0);
  const deepestActiveStage = active.length
    ? active.reduce((deepest, stage) => {
        const currentIndex = FUNNEL_STAGES.findIndex((item) => item.key === stage.key);
        const deepestIndex = FUNNEL_STAGES.findIndex((item) => item.key === deepest.key);
        return currentIndex > deepestIndex ? stage : deepest;
      }, active[0])
    : null;

  const largest = [...funnel].sort((a, b) => b.count - a.count)[0];
  const largestShare = largest && totalLeads
    ? Math.round((largest.count / totalLeads) * 100)
    : 0;

  let concentrationTone = "green";
  if (largestShare >= 50) concentrationTone = "amber";
  if (largestShare >= 70) concentrationTone = "red";

  const concentration = largest?.count
    ? {
        title: `${largest.label} · ${largestShare}%`,
        description:
          largestShare >= 50
            ? `${largest.count} lead(s) are concentrated in ${largest.label}. Review whether this reflects normal workload or a progression bottleneck.`
            : `${largest.count} lead(s) sit in ${largest.label}. The pipeline is relatively distributed across stages.`,
        tone: concentrationTone,
      }
    : {
        title: "No concentration",
        description: "No mapped inquiry stages currently contain records.",
        tone: "blue",
      };

  return {
    funnel,
    totalLeads,
    approvedCount,
    approvedShare,
    activeStages,
    unknownCount,
    dataQuality,
    averageDepth,
    concentration,
    deepestActiveStage,
  };
}

function OperationalRecommendation({ analytics }) {
  const {
    funnel,
    unknownCount,
    averageDepth,
    concentration,
  } = analytics;

  let title = "Keep pipeline records current";
  let description =
    "Continue updating inquiry stages after meaningful counselor actions so this funnel remains useful.";

  if (unknownCount > 0) {
    title = "Clean unmapped statuses first";
    description =
      "Some inquiries do not match a configured funnel stage. Standardize those records before using the chart for operational decisions.";
  } else if (concentration?.tone === "red") {
    title = `Review ${concentration.title.split(" · ")[0]}`;
    description =
      "A very large share of the current pipeline is sitting in one stage. Check overdue follow-ups, missing documents, counselor ownership and blocked next actions for those students.";
  } else if (averageDepth < 35) {
    title = "Strengthen early-stage progression";
    description =
      "Most mapped records are still near the beginning of the journey. Review response speed, follow-up coverage and whether students have clear next actions.";
  } else {
    const docs = funnel.find((stage) => stage.key === "documents_pending");
    if (docs?.count > 0) {
      title = "Protect document-stage momentum";
      description =
        `${docs.count} lead(s) are currently in document preparation. Make sure each has a clear missing-document list, owner and follow-up date.`;
    }
  }

  return (
    <InsightCard
      icon={Target}
      eyebrow="Operational Recommendation"
      title={title}
      description={description}
      tone="orange"
    />
  );
}

function MetricCard({
  label,
  value,
  helper,
  icon: Icon,
  tone = "orange",
  index = 0,
  reduceMotion,
}) {
  const styles = {
    orange: "border-[#F97316] bg-[#FFF4E8] text-orange-800",
    green: "border-[#34D399] bg-[#F0FFF8] text-emerald-800",
    blue: "border-[#60A5FA] bg-[#F2F7FF] text-blue-800",
    amber: "border-[#F59E0B] bg-[#FFF7ED] text-amber-900",
    red: "border-[#FB7185] bg-[#FFF4F4] text-red-800",
  };

  return (
    <motion.article
      initial={reduceMotion ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: reduceMotion ? 0 : 0.22,
        delay: reduceMotion ? 0 : index * 0.035,
      }}
      className={`min-w-0 rounded-[1.4rem] border-[3px] p-4 shadow-[0_8px_22px_rgba(15,35,63,0.055)] ${
        styles[tone] || styles.orange
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[9px] font-black uppercase tracking-[0.14em]">
            {label}
          </p>
          <p className="mt-2 text-3xl font-black text-[#10233f]">{value}</p>
        </div>

        <div className="flex h-10 w-10 items-center justify-center rounded-xl border-2 border-current/20 bg-white">
          <Icon size={17} />
        </div>
      </div>

      <p className="mt-2 text-xs font-semibold leading-5 text-slate-600">
        {helper}
      </p>
    </motion.article>
  );
}

function InsightCard({
  icon: Icon,
  eyebrow,
  title,
  description,
  tone = "orange",
}) {
  const styles = {
    orange: "border-[#F97316] bg-[#FFF4E8] text-orange-800",
    green: "border-[#34D399] bg-[#F0FFF8] text-emerald-800",
    blue: "border-[#60A5FA] bg-[#F2F7FF] text-blue-800",
    amber: "border-[#F59E0B] bg-[#FFF7ED] text-amber-900",
    red: "border-[#FB7185] bg-[#FFF4F4] text-red-800",
  };

  return (
    <article
      className={`min-w-0 rounded-[1.5rem] border-[3px] p-5 shadow-[0_8px_22px_rgba(15,35,63,0.055)] ${
        styles[tone] || styles.orange
      }`}
    >
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border-2 border-current/20 bg-white">
          <Icon size={18} />
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-[9px] font-black uppercase tracking-[0.14em] opacity-80">
            {eyebrow}
          </p>
          <h3 className="mt-1.5 break-words text-base font-black leading-5 text-[#10233f]">
            {title}
          </h3>
          <p className="mt-2 break-words text-sm font-semibold leading-6 text-slate-700">
            {description}
          </p>
        </div>
      </div>
    </article>
  );
}

function MethodologyNote() {
  return (
    <div className="rounded-[1.5rem] border-[3px] border-[#60A5FA] bg-[#F2F7FF] p-5 shadow-[0_8px_22px_rgba(15,35,63,0.045)]">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border-2 border-[#60A5FA] bg-white text-blue-700">
          <Info size={17} />
        </div>

        <div>
          <p className="text-sm font-black text-[#10233f]">
            Why there is no fake “drop-off” number
          </p>
          <p className="mt-1 text-xs font-semibold leading-5 text-slate-700">
            These records show where students are now. A smaller count in a
            later stage does not prove the difference was lost between those
            stages. True conversion and drop-off should later be calculated
            from stage-transition history or cohorts.
          </p>
        </div>
      </div>
    </div>
  );
}

function DarkMetric({ label, value }) {
  return (
    <div className="min-w-0 rounded-xl border-2 border-white/30 bg-white/10 p-3 text-white">
      <p className="text-[8px] font-black uppercase tracking-[0.1em] text-white">
        {label}
      </p>
      <p className="mt-1 text-xl font-black text-white">{value}</p>
    </div>
  );
}

function getDepthMessage(depth, deepestStage) {
  if (!deepestStage) {
    return "No mapped stage currently contains an inquiry.";
  }

  if (depth >= 70) {
    return `The active pipeline is relatively mature, with records reaching ${deepestStage.label}. Protect late-stage follow-up and completion quality.`;
  }

  if (depth >= 40) {
    return `The pipeline has meaningful mid-stage movement and currently reaches ${deepestStage.label}. Review blocked records before they become stale.`;
  }

  return `Most records remain early in the journey even though the pipeline reaches ${deepestStage.label}. Prioritize first response, qualification and clear next actions.`;
}

export default ConversionFunnelChart;
