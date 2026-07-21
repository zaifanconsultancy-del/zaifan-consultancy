import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Activity,
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  CalendarCheck2,
  CheckCircle2,
  ChevronDown,
  CircleDot,
  Clock3,
  FileCheck2,
  Filter,
  Flame,
  Goal,
  Info,
  Plane,
  RefreshCw,
  Sparkles,
  Target,
  TrendingUp,
  UserCheck2,
  Users,
  XCircle,
} from "lucide-react";

const INQUIRY_STAGE_CONFIG = [
  {
    key: "new",
    label: "New",
    shortLabel: "New",
    description: "Fresh student inquiries waiting for first contact.",
    icon: Sparkles,
  },
  {
    key: "contacted",
    label: "Contacted",
    shortLabel: "Contacted",
    description: "Students who received the first counseling response.",
    icon: UserCheck2,
  },
  {
    key: "documents_pending",
    label: "Documents Pending",
    shortLabel: "Documents",
    description: "Students preparing academic, financial, or visa documents.",
    icon: FileCheck2,
  },
  {
    key: "applied",
    label: "Applied",
    shortLabel: "Applied",
    description: "Applications submitted to universities or institutions.",
    icon: Target,
  },
  {
    key: "offer_letter",
    label: "Offer Letter",
    shortLabel: "Offer",
    description: "Students who reached an offer-letter decision stage.",
    icon: Goal,
  },
  {
    key: "visa_process",
    label: "Visa Process",
    shortLabel: "Visa",
    description: "Students progressing through visa guidance and filing.",
    icon: Plane,
  },
  {
    key: "approved",
    label: "Approved",
    shortLabel: "Approved",
    description: "Students successfully approved or completed.",
    icon: CheckCircle2,
  },
];

const APPOINTMENT_STAGE_CONFIG = [
  {
    key: "new_booking",
    label: "New Booking",
    shortLabel: "New",
    description: "Fresh consultation bookings waiting for confirmation.",
    icon: CalendarCheck2,
  },
  {
    key: "confirmed",
    label: "Confirmed",
    shortLabel: "Confirmed",
    description: "Appointments confirmed with the student.",
    icon: CheckCircle2,
  },
  {
    key: "consultation_done",
    label: "Consultation Done",
    shortLabel: "Completed",
    description: "Counseling consultation has been completed.",
    icon: UserCheck2,
  },
  {
    key: "follow_up_needed",
    label: "Follow-Up Needed",
    shortLabel: "Follow-Up",
    description: "Student requires another contact or decision touchpoint.",
    icon: Clock3,
  },
  {
    key: "converted_to_lead",
    label: "Converted to Lead",
    shortLabel: "Converted",
    description: "Appointment successfully moved into the inquiry pipeline.",
    icon: TrendingUp,
  },
  {
    key: "not_interested",
    label: "Not Interested",
    shortLabel: "Lost",
    description: "Student declined further counseling or services.",
    icon: XCircle,
  },
  {
    key: "cancelled",
    label: "Cancelled",
    shortLabel: "Cancelled",
    description: "Appointment was cancelled before completion.",
    icon: AlertTriangle,
  },
];

const RANGE_OPTIONS = [
  { value: "all", label: "All time" },
  { value: "7", label: "Last 7 days" },
  { value: "30", label: "Last 30 days" },
  { value: "90", label: "Last 90 days" },
];

function ConversionAnalytics({
  cardClass = "",
  inquiries = [],
  appointments = [],
}) {
  const [range, setRange] = useState("all");
  const [activePipeline, setActivePipeline] = useState("both");

  const safeInquiries = Array.isArray(inquiries) ? inquiries : [];
  const safeAppointments = Array.isArray(appointments) ? appointments : [];

  const filteredInquiries = useMemo(
    () => filterByRange(safeInquiries, range),
    [safeInquiries, range]
  );

  const filteredAppointments = useMemo(
    () => filterByRange(safeAppointments, range),
    [safeAppointments, range]
  );

  const inquiryData = useMemo(
    () =>
      buildStageData({
        records: filteredInquiries,
        config: INQUIRY_STAGE_CONFIG,
        getStatus: (item) => item?.status || "new",
      }),
    [filteredInquiries]
  );

  const appointmentData = useMemo(
    () =>
      buildStageData({
        records: filteredAppointments,
        config: APPOINTMENT_STAGE_CONFIG,
        getStatus: (item) => item?.appointment_stage || "new_booking",
      }),
    [filteredAppointments]
  );

  const inquiryTotal = filteredInquiries.length;
  const appointmentTotal = filteredAppointments.length;
  const totalRecords = inquiryTotal + appointmentTotal;

  const approvedCount =
    inquiryData.find((stage) => stage.key === "approved")?.count || 0;

  const convertedAppointments =
    appointmentData.find((stage) => stage.key === "converted_to_lead")?.count || 0;

  const inquiryConversion = inquiryTotal
    ? Math.round((approvedCount / inquiryTotal) * 100)
    : 0;

  const appointmentConversion = appointmentTotal
    ? Math.round((convertedAppointments / appointmentTotal) * 100)
    : 0;

  const combinedConversionBase = inquiryTotal + appointmentTotal;
  const combinedConversion = combinedConversionBase
    ? Math.round(
        ((approvedCount + convertedAppointments) / combinedConversionBase) * 100
      )
    : 0;

  const inquiryDrop = getLargestDrop(inquiryData);
  const appointmentDrop = getLargestDrop(appointmentData);

  const strongestPipeline =
    inquiryConversion === appointmentConversion
      ? "Balanced"
      : inquiryConversion > appointmentConversion
      ? "Inquiry pipeline"
      : "Appointment pipeline";

  const visibleColumns =
    activePipeline === "both"
      ? [
          {
            id: "inquiries",
            title: "Inquiry Pipeline",
            subtitle: "From new inquiry to final approval",
            total: inquiryTotal,
            conversion: inquiryConversion,
            items: inquiryData,
          },
          {
            id: "appointments",
            title: "Appointment Pipeline",
            subtitle: "From booking to qualified lead",
            total: appointmentTotal,
            conversion: appointmentConversion,
            items: appointmentData,
          },
        ]
      : activePipeline === "inquiries"
      ? [
          {
            id: "inquiries",
            title: "Inquiry Pipeline",
            subtitle: "From new inquiry to final approval",
            total: inquiryTotal,
            conversion: inquiryConversion,
            items: inquiryData,
          },
        ]
      : [
          {
            id: "appointments",
            title: "Appointment Pipeline",
            subtitle: "From booking to qualified lead",
            total: appointmentTotal,
            conversion: appointmentConversion,
            items: appointmentData,
          },
        ];

  const metrics = [
    {
      label: "Tracked Records",
      value: totalRecords,
      helper: `${inquiryTotal} inquiries · ${appointmentTotal} appointments`,
      icon: Users,
    },
    {
      label: "Inquiry Conversion",
      value: `${inquiryConversion}%`,
      helper: `${approvedCount} approved student${approvedCount === 1 ? "" : "s"}`,
      icon: TrendingUp,
    },
    {
      label: "Appointment Conversion",
      value: `${appointmentConversion}%`,
      helper: `${convertedAppointments} converted booking${
        convertedAppointments === 1 ? "" : "s"
      }`,
      icon: CalendarCheck2,
    },
    {
      label: "Combined Outcome",
      value: `${combinedConversion}%`,
      helper: `${approvedCount + convertedAppointments} successful outcomes`,
      icon: Goal,
    },
  ];

  return (
    <motion.section
      key="conversion-analytics"
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.34, ease: [0.22, 1, 0.36, 1] }}
      className="space-y-5"
    >
      <header
        className={`${cardClass} relative overflow-hidden rounded-[2rem] border-2 border-[#E9802D]/45 bg-[#FFFDF8] p-5 shadow-[0_18px_50px_rgba(26,43,72,0.08)] sm:p-7`}
      >
        <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#E9802D] via-[#F4A261] to-[#E9802D]" />
        <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-[#E9802D]/8 blur-3xl" />

        <div className="relative flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#E9802D]/35 bg-[#FFF3E7] px-3 py-1.5">
              <Activity className="h-4 w-4 text-[#D96C1F]" />
              <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[#B84F0E]">
                Pipeline Intelligence
              </p>
            </div>

            <h2 className="mt-4 text-2xl font-black tracking-tight text-[#17243D] sm:text-3xl">
              Conversion Analytics
            </h2>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#5D6678]">
              Compare inquiry and appointment movement, identify drop-off
              points, and see where counselors should focus next.
            </p>
          </div>

          <div className="flex w-full flex-col gap-3 sm:flex-row xl:w-auto">
            <PipelineToggle
              value={activePipeline}
              onChange={setActivePipeline}
            />

            <label className="relative min-w-[170px]">
              <span className="sr-only">Select analytics date range</span>
              <Filter className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#667085]" />
              <select
                value={range}
                onChange={(event) => setRange(event.target.value)}
                className="h-11 w-full appearance-none rounded-xl border border-[#243A60]/25 bg-white pl-9 pr-9 text-sm font-bold text-[#17243D] outline-none transition focus:border-[#E9802D] focus:ring-4 focus:ring-[#E9802D]/10"
              >
                {RANGE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#667085]" />
            </label>
          </div>
        </div>
      </header>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric, index) => {
          const Icon = metric.icon;

          return (
            <motion.article
              key={metric.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.3,
                delay: index * 0.05,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="rounded-[1.4rem] border border-[#243A60]/25 bg-[#FFFDF8] p-4 shadow-[0_12px_28px_rgba(23,36,61,0.06)]"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#667085]">
                    {metric.label}
                  </p>
                  <p className="mt-2 text-3xl font-black tracking-tight text-[#17243D]">
                    {metric.value}
                  </p>
                </div>

                <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-[#E9802D]/35 bg-[#FFF3E7]">
                  <Icon className="h-5 w-5 text-[#D96C1F]" />
                </div>
              </div>

              <p className="mt-3 text-xs font-semibold leading-5 text-[#70798A]">
                {metric.helper}
              </p>
            </motion.article>
          );
        })}
      </div>

      {totalRecords === 0 ? (
        <EmptyAnalyticsState cardClass={cardClass} />
      ) : (
        <>
          <div
            className={`grid gap-5 ${
              visibleColumns.length === 2 ? "xl:grid-cols-2" : ""
            }`}
          >
            {visibleColumns.map((column) => (
              <PipelineColumn
                key={column.id}
                title={column.title}
                subtitle={column.subtitle}
                total={column.total}
                conversion={column.conversion}
                items={column.items}
                cardClass={cardClass}
              />
            ))}
          </div>

          <div className="grid gap-4 xl:grid-cols-3">
            <InsightCard
              icon={Flame}
              eyebrow="Primary Strength"
              title={strongestPipeline}
              description={
                strongestPipeline === "Balanced"
                  ? "Both pipelines currently have the same measured conversion rate."
                  : `${strongestPipeline} currently produces the stronger successful-outcome rate.`
              }
            />

            <InsightCard
              icon={ArrowDownRight}
              eyebrow="Largest Inquiry Drop"
              title={formatDropTitle(inquiryDrop)}
              description={formatDropDescription(inquiryDrop)}
              danger={Boolean(inquiryDrop?.dropRate >= 40)}
            />

            <InsightCard
              icon={RefreshCw}
              eyebrow="Largest Appointment Drop"
              title={formatDropTitle(appointmentDrop)}
              description={formatDropDescription(appointmentDrop)}
              danger={Boolean(appointmentDrop?.dropRate >= 40)}
            />
          </div>
        </>
      )}
    </motion.section>
  );
}

function PipelineToggle({ value, onChange }) {
  const options = [
    { value: "both", label: "Both" },
    { value: "inquiries", label: "Inquiries" },
    { value: "appointments", label: "Appointments" },
  ];

  return (
    <div
      className="grid grid-cols-3 rounded-xl border border-[#243A60]/20 bg-[#F5F1E8] p-1"
      role="group"
      aria-label="Select pipeline view"
    >
      {options.map((option) => {
        const active = value === option.value;

        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            aria-pressed={active}
            className={`rounded-lg px-3 py-2 text-xs font-black transition ${
              active
                ? "bg-[#E9802D] text-white shadow-[0_6px_16px_rgba(233,128,45,0.25)]"
                : "text-[#596579] hover:bg-white hover:text-[#17243D]"
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

function PipelineColumn({
  title,
  subtitle,
  total,
  conversion,
  items = [],
  cardClass = "",
}) {
  const max = Math.max(...items.map((item) => item.count), 1);

  return (
    <article
      className={`${cardClass} overflow-hidden rounded-[2rem] border-2 border-[#243A60]/30 bg-[#FFFDF8] shadow-[0_16px_42px_rgba(23,36,61,0.07)]`}
    >
      <div className="border-b border-[#243A60]/15 bg-[#17243D] p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#FFB46F]">
              Conversion Path
            </p>
            <h3 className="mt-2 text-xl font-black text-white">{title}</h3>
            <p className="mt-1 text-sm text-white/65">{subtitle}</p>
          </div>

          <div className="flex gap-2">
            <HeaderMetric label="Records" value={total} />
            <HeaderMetric label="Outcome" value={`${conversion}%`} />
          </div>
        </div>
      </div>

      <div className="space-y-3 p-4 sm:p-5">
        {items.map((item, index) => {
          const width =
            item.count === 0 ? 0 : Math.max((item.count / max) * 100, 7);
          const Icon = item.icon;

          return (
            <motion.div
              key={item.key}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.28,
                delay: index * 0.04,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="group rounded-[1.25rem] border border-[#243A60]/22 bg-white p-4 transition duration-300 hover:-translate-y-0.5 hover:border-[#E9802D]/55 hover:shadow-[0_12px_24px_rgba(23,36,61,0.07)]"
            >
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#E9802D]/30 bg-[#FFF3E7]">
                  <Icon className="h-4.5 w-4.5 text-[#D96C1F]" />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-black text-[#17243D]">
                        {item.label}
                      </p>
                      <p className="mt-0.5 text-xs leading-5 text-[#747D8D]">
                        {item.description}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="text-xl font-black text-[#17243D]">
                        {item.count}
                      </p>
                      <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#B84F0E]">
                        {item.share}% share
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 h-2.5 overflow-hidden rounded-full border border-[#243A60]/10 bg-[#EEF0F3]">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${width}%` }}
                      transition={{
                        duration: 0.65,
                        delay: 0.08 + index * 0.04,
                        ease: [0.22, 1, 0.36, 1],
                      }}
                      className="h-full rounded-full bg-[#E9802D]"
                    />
                  </div>

                  <div className="mt-2 flex items-center justify-between gap-3 text-[10px] font-bold">
                    <span className="text-[#7B8494]">
                      {item.count === 0 ? "No records in this stage" : "Active stage"}
                    </span>

                    {index > 0 && (
                      <span
                        className={
                          item.dropRate >= 40
                            ? "text-[#C2413B]"
                            : "text-[#596579]"
                        }
                      >
                        {item.dropRate}% drop from previous
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </article>
  );
}

function HeaderMetric({ label, value }) {
  return (
    <div className="min-w-[84px] rounded-xl border border-white/15 bg-white/[0.08] px-3 py-2 text-right">
      <p className="text-[9px] font-black uppercase tracking-[0.16em] text-white/50">
        {label}
      </p>
      <p className="mt-1 text-lg font-black text-white">{value}</p>
    </div>
  );
}

function InsightCard({
  icon: Icon,
  eyebrow,
  title,
  description,
  danger = false,
}) {
  return (
    <article className="rounded-[1.5rem] border border-[#243A60]/25 bg-[#FFFDF8] p-5 shadow-[0_12px_28px_rgba(23,36,61,0.06)]">
      <div className="flex items-start gap-3">
        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border ${
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
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#747D8D]">
            {eyebrow}
          </p>
          <h3
            className={`mt-1.5 text-base font-black ${
              danger ? "text-[#A8342F]" : "text-[#17243D]"
            }`}
          >
            {title}
          </h3>
          <p className="mt-2 text-sm leading-6 text-[#667085]">{description}</p>
        </div>
      </div>
    </article>
  );
}

function EmptyAnalyticsState({ cardClass = "" }) {
  return (
    <div
      className={`${cardClass} rounded-[2rem] border-2 border-dashed border-[#E9802D]/35 bg-[#FFFDF8] px-6 py-12 text-center`}
    >
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-[#E9802D]/35 bg-[#FFF3E7]">
        <BarChart3 className="h-8 w-8 text-[#D96C1F]" />
      </div>

      <h3 className="mt-4 text-xl font-black text-[#17243D]">
        Analytics will activate with pipeline data
      </h3>

      <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-[#687284]">
        Add inquiry or appointment records and update their stages to begin
        measuring conversion movement and drop-off.
      </p>

      <div className="mx-auto mt-5 inline-flex items-center gap-2 rounded-full border border-[#243A60]/20 bg-white px-4 py-2 text-xs font-bold text-[#596579]">
        <Info className="h-4 w-4 text-[#D96C1F]" />
        Zero-state shown safely
      </div>
    </div>
  );
}

function buildStageData({ records = [], config = [], getStatus }) {
  const total = records.length || 1;

  return config.map((stage, index) => {
    const count = records.filter((record) => {
      const status = normalizeStatus(getStatus(record));
      return status === stage.key;
    }).length;

    const previousStage = config[index - 1];
    const previousCount = previousStage
      ? records.filter(
          (record) => normalizeStatus(getStatus(record)) === previousStage.key
        ).length
      : count;

    const dropRate =
      index === 0 || previousCount === 0
        ? 0
        : Math.max(
            0,
            Math.round(((previousCount - count) / previousCount) * 100)
          );

    return {
      ...stage,
      count,
      share: Math.round((count / total) * 100),
      dropRate,
    };
  });
}

function getLargestDrop(items = []) {
  if (!items.length) return null;

  return items
    .slice(1)
    .map((item, index) => ({
      from: items[index],
      to: item,
      dropRate: item.dropRate,
      lost: Math.max(0, items[index].count - item.count),
    }))
    .sort((a, b) => b.dropRate - a.dropRate)[0];
}

function formatDropTitle(drop) {
  if (!drop || drop.dropRate === 0) return "No measurable drop";

  return `${drop.from.shortLabel} → ${drop.to.shortLabel}`;
}

function formatDropDescription(drop) {
  if (!drop || drop.dropRate === 0) {
    return "There is not enough sequential stage data to identify a meaningful drop-off yet.";
  }

  return `${drop.dropRate}% drop-off, representing ${drop.lost} record${
    drop.lost === 1 ? "" : "s"
  } between these stages.`;
}

function filterByRange(records = [], range = "all") {
  if (range === "all") return records;

  const days = Number(range);
  const cutoff = new Date();
  cutoff.setHours(0, 0, 0, 0);
  cutoff.setDate(cutoff.getDate() - days + 1);

  return records.filter((record) => {
    const rawDate =
      record?.created_at ||
      record?.submitted_at ||
      record?.appointment_date ||
      record?.date;

    if (!rawDate) return false;

    const date = new Date(rawDate);
    if (Number.isNaN(date.getTime())) return false;

    return date >= cutoff;
  });
}

function normalizeStatus(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replaceAll("-", "_")
    .replace(/\s+/g, "_");
}

export default ConversionAnalytics;
