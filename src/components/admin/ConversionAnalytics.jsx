// ConversionAnalytics V5 MAXIMUM — Framed Pipeline Intelligence OS
// src/components/admin/ConversionAnalytics.jsx
//
// Maximum pass:
// - preserves current inquiries / appointments / cardClass API
// - preserves date-range and pipeline visibility controls
// - fixes misleading adjacent-stage "drop-off" math by treating stage counts as
//   snapshot distribution, not cohort progression
// - adds honest stage concentration + progression-readiness insights
// - safer date filtering and status normalization
// - handles missing/unknown stages explicitly
// - separates conversion outcome from stage distribution
// - adds data-quality and pipeline-health signals
// - reduced-motion support
// - stronger mobile behavior and responsive tables/cards
// - explicit white text on navy surfaces
// - no fake AI/GPT claim; this remains deterministic analytics
//
// NOTE:
// True funnel drop-off requires event/cohort history (e.g. stage transitions over time).
// This component now avoids claiming snapshot counts are true sequential losses.

import {
  motion,
  useReducedMotion,
} from "framer-motion";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BarChart3,
  CalendarCheck2,
  CheckCircle2,
  ChevronDown,
  CircleDot,
  FileCheck2,
  Filter,
  Gauge,
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
import {
  useMemo,
  useState,
} from "react";

const INQUIRY_STAGE_CONFIG = [
  {
    key: "new",
    label: "New",
    shortLabel: "New",
    description:
      "Fresh student inquiries waiting for first contact.",
    icon: Sparkles,
  },
  {
    key: "contacted",
    label: "Contacted",
    shortLabel: "Contacted",
    description:
      "Students who received the first counseling response.",
    icon: UserCheck2,
  },
  {
    key: "documents_pending",
    label: "Documents Pending",
    shortLabel: "Documents",
    description:
      "Students preparing academic, financial, or visa documents.",
    icon: FileCheck2,
  },
  {
    key: "applied",
    label: "Applied",
    shortLabel: "Applied",
    description:
      "Applications submitted to universities or institutions.",
    icon: Target,
  },
  {
    key: "offer_letter",
    label: "Offer Letter",
    shortLabel: "Offer",
    description:
      "Students who reached an offer-letter decision stage.",
    icon: Goal,
  },
  {
    key: "visa_process",
    label: "Visa Process",
    shortLabel: "Visa",
    description:
      "Students progressing through visa guidance and filing.",
    icon: Plane,
  },
  {
    key: "approved",
    label: "Approved",
    shortLabel: "Approved",
    description:
      "Students successfully approved or completed.",
    icon: CheckCircle2,
  },
];

const APPOINTMENT_STAGE_CONFIG = [
  {
    key: "new_booking",
    label: "New Booking",
    shortLabel: "New",
    description:
      "Fresh consultation bookings waiting for confirmation.",
    icon: CalendarCheck2,
  },
  {
    key: "confirmed",
    label: "Confirmed",
    shortLabel: "Confirmed",
    description:
      "Appointments confirmed with the student.",
    icon: CheckCircle2,
  },
  {
    key: "consultation_done",
    label: "Consultation Done",
    shortLabel: "Completed",
    description:
      "Counseling consultation has been completed.",
    icon: UserCheck2,
  },
  {
    key: "follow_up_needed",
    label: "Follow-Up Needed",
    shortLabel: "Follow-Up",
    description:
      "Student requires another contact or decision touchpoint.",
    icon: RefreshCw,
  },
  {
    key: "converted_to_lead",
    label: "Converted to Lead",
    shortLabel: "Converted",
    description:
      "Appointment successfully moved into the inquiry pipeline.",
    icon: TrendingUp,
  },
  {
    key: "not_interested",
    label: "Not Interested",
    shortLabel: "Lost",
    description:
      "Student declined further counseling or services.",
    icon: XCircle,
  },
  {
    key: "cancelled",
    label: "Cancelled",
    shortLabel: "Cancelled",
    description:
      "Appointment was cancelled before completion.",
    icon: AlertTriangle,
  },
];

const RANGE_OPTIONS = [
  { value: "all", label: "All time" },
  { value: "7", label: "Last 7 days" },
  { value: "30", label: "Last 30 days" },
  { value: "90", label: "Last 90 days" },
];

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

function safeNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number)
    ? number
    : fallback;
}

function clamp(value, min = 0, max = 100) {
  return Math.min(
    max,
    Math.max(min, safeNumber(value))
  );
}

function normalizeStatus(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replaceAll("-", "_")
    .replace(/\s+/g, "_");
}

function normalizeAppointmentStage(item = {}) {
  return normalizeStatus(
    item?.appointment_stage ||
      item?.stage ||
      item?.status ||
      "new_booking"
  );
}

function normalizeInquiryStage(item = {}) {
  return normalizeStatus(
    item?.status ||
      item?.pipeline_stage ||
      "new"
  );
}

function ConversionAnalytics({
  cardClass = "",
  inquiries = [],
  appointments = [],
}) {
  const shouldReduceMotion =
    useReducedMotion();

  const [range, setRange] =
    useState("all");

  const [activePipeline, setActivePipeline] =
    useState("both");

  const safeInquiries =
    safeArray(inquiries);

  const safeAppointments =
    safeArray(appointments);

  const filteredInquiries = useMemo(
    () =>
      filterByRange(
        safeInquiries,
        range
      ),
    [safeInquiries, range]
  );

  const filteredAppointments = useMemo(
    () =>
      filterByRange(
        safeAppointments,
        range
      ),
    [safeAppointments, range]
  );

  const inquiryData = useMemo(
    () =>
      buildStageData({
        records:
          filteredInquiries,
        config:
          INQUIRY_STAGE_CONFIG,
        getStatus:
          normalizeInquiryStage,
      }),
    [filteredInquiries]
  );

  const appointmentData = useMemo(
    () =>
      buildStageData({
        records:
          filteredAppointments,
        config:
          APPOINTMENT_STAGE_CONFIG,
        getStatus:
          normalizeAppointmentStage,
      }),
    [filteredAppointments]
  );

  const inquiryTotal =
    filteredInquiries.length;

  const appointmentTotal =
    filteredAppointments.length;

  const totalRecords =
    inquiryTotal +
    appointmentTotal;

  const approvedCount =
    inquiryData.find(
      (stage) =>
        stage.key ===
        "approved"
    )?.count || 0;

  const convertedAppointments =
    appointmentData.find(
      (stage) =>
        stage.key ===
        "converted_to_lead"
    )?.count || 0;

  const inquiryConversion =
    inquiryTotal
      ? Math.round(
          (approvedCount /
            inquiryTotal) *
            100
        )
      : 0;

  const appointmentConversion =
    appointmentTotal
      ? Math.round(
          (convertedAppointments /
            appointmentTotal) *
            100
        )
      : 0;

  const combinedOutcomeCount =
    approvedCount +
    convertedAppointments;

  const combinedConversion =
    totalRecords
      ? Math.round(
          (combinedOutcomeCount /
            totalRecords) *
            100
        )
      : 0;

  const inquiryUnknown =
    countUnknownStages({
      records:
        filteredInquiries,
      config:
        INQUIRY_STAGE_CONFIG,
      getStatus:
        normalizeInquiryStage,
    });

  const appointmentUnknown =
    countUnknownStages({
      records:
        filteredAppointments,
      config:
        APPOINTMENT_STAGE_CONFIG,
      getStatus:
        normalizeAppointmentStage,
    });

  const dataQuality = totalRecords
    ? clamp(
        Math.round(
          ((totalRecords -
            inquiryUnknown -
            appointmentUnknown) /
            totalRecords) *
            100
        )
      )
    : 0;

  const inquirySnapshot =
    getSnapshotInsight(
      inquiryData
    );

  const appointmentSnapshot =
    getSnapshotInsight(
      appointmentData
    );

  const strongestPipeline =
    inquiryConversion ===
    appointmentConversion
      ? "Balanced"
      : inquiryConversion >
        appointmentConversion
      ? "Inquiry pipeline"
      : "Appointment pipeline";

  const visibleColumns =
    activePipeline === "both"
      ? [
          {
            id: "inquiries",
            title:
              "Inquiry Pipeline",
            subtitle:
              "Current distribution from new inquiry to final approval",
            total:
              inquiryTotal,
            conversion:
              inquiryConversion,
            items:
              inquiryData,
            snapshot:
              inquirySnapshot,
            unknownCount:
              inquiryUnknown,
          },
          {
            id: "appointments",
            title:
              "Appointment Pipeline",
            subtitle:
              "Current distribution from booking to qualified lead",
            total:
              appointmentTotal,
            conversion:
              appointmentConversion,
            items:
              appointmentData,
            snapshot:
              appointmentSnapshot,
            unknownCount:
              appointmentUnknown,
          },
        ]
      : activePipeline ===
        "inquiries"
      ? [
          {
            id: "inquiries",
            title:
              "Inquiry Pipeline",
            subtitle:
              "Current distribution from new inquiry to final approval",
            total:
              inquiryTotal,
            conversion:
              inquiryConversion,
            items:
              inquiryData,
            snapshot:
              inquirySnapshot,
            unknownCount:
              inquiryUnknown,
          },
        ]
      : [
          {
            id: "appointments",
            title:
              "Appointment Pipeline",
            subtitle:
              "Current distribution from booking to qualified lead",
            total:
              appointmentTotal,
            conversion:
              appointmentConversion,
            items:
              appointmentData,
            snapshot:
              appointmentSnapshot,
            unknownCount:
              appointmentUnknown,
          },
        ];

  const metrics = [
    {
      label:
        "Tracked Records",
      value: totalRecords,
      helper: `${inquiryTotal} inquiries · ${appointmentTotal} appointments`,
      icon: Users,
      tone: "orange",
    },
    {
      label:
        "Inquiry Conversion",
      value: `${inquiryConversion}%`,
      helper: `${approvedCount} approved student${
        approvedCount === 1
          ? ""
          : "s"
      }`,
      icon: TrendingUp,
      tone:
        inquiryConversion >=
        25
          ? "green"
          : "blue",
    },
    {
      label:
        "Appointment Conversion",
      value: `${appointmentConversion}%`,
      helper: `${convertedAppointments} converted booking${
        convertedAppointments ===
        1
          ? ""
          : "s"
      }`,
      icon:
        CalendarCheck2,
      tone:
        appointmentConversion >=
        25
          ? "green"
          : "blue",
    },
    {
      label:
        "Data Quality",
      value: `${dataQuality}%`,
      helper:
        inquiryUnknown +
          appointmentUnknown >
        0
          ? `${
              inquiryUnknown +
              appointmentUnknown
            } record(s) have unknown stages`
          : "All tracked records map to a known stage",
      icon: Gauge,
      tone:
        dataQuality >= 90
          ? "green"
          : dataQuality >= 70
          ? "amber"
          : "red",
    },
  ];

  return (
    <motion.section
      key="conversion-analytics"
      initial={
        shouldReduceMotion
          ? false
          : {
              opacity: 0,
              y: 14,
            }
      }
      animate={{
        opacity: 1,
        y: 0,
      }}
      transition={{
        duration:
          shouldReduceMotion
            ? 0
            : 0.3,
        ease: [
          0.22,
          1,
          0.36,
          1,
        ],
      }}
      className="space-y-5"
    >
      <header
        className={`${cardClass} min-w-0 overflow-hidden rounded-[2rem] border-[3px] border-[#C9D7E6] bg-[#FFFDF8] p-3 shadow-[0_16px_42px_rgba(15,35,63,0.08)] sm:p-4`}
      >
        <div className="grid min-w-0 overflow-hidden rounded-[1.7rem] border-[3px] border-[#F97316] xl:grid-cols-[minmax(0,1.2fr)_minmax(19rem,0.8fr)]">
          <div className="min-w-0 bg-[#173F6B] p-5 text-white sm:p-6">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-2 rounded-full border-2 border-white/20 bg-white/10 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.14em] text-white">
                <Activity size={12} />
                Pipeline Intelligence
              </span>

              <span className="inline-flex items-center gap-2 rounded-full border-2 border-white/20 bg-white/10 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.14em] text-white">
                <BarChart3 size={12} />
                Snapshot Analytics
              </span>
            </div>

            <h2 className="mt-4 break-words text-2xl font-black leading-tight tracking-tight text-white sm:text-3xl">
              Conversion Analytics
            </h2>

            <p className="mt-2 max-w-3xl break-words text-sm font-semibold leading-6 text-white">
              Compare current inquiry and appointment stage distribution,
              successful outcomes and operational concentration without
              pretending snapshot counts are true cohort drop-off.
            </p>

            <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
              <DarkStat
                label="Inquiries"
                value={inquiryTotal}
              />
              <DarkStat
                label="Appointments"
                value={appointmentTotal}
              />
              <DarkStat
                label="Outcomes"
                value={combinedOutcomeCount}
              />
              <DarkStat
                label="Combined"
                value={`${combinedConversion}%`}
              />
            </div>
          </div>

          <div className="min-w-0 border-t-[3px] border-[#F97316] bg-[#E96512] p-5 text-white sm:p-6 xl:border-l-[3px] xl:border-t-0">
            <p className="text-[9px] font-black uppercase tracking-[0.15em] text-white">
              View Controls
            </p>

            <div className="mt-4">
              <PipelineToggle
                value={
                  activePipeline
                }
                onChange={
                  setActivePipeline
                }
              />
            </div>

            <label className="relative mt-3 block">
              <span className="sr-only">
                Select analytics
                date range
              </span>

              <Filter className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white" />

              <select
                value={range}
                onChange={(event) =>
                  setRange(
                    event.target
                      .value
                  )
                }
                className="h-11 w-full appearance-none rounded-xl border-2 border-white/30 bg-white/10 pl-9 pr-9 text-sm font-black text-white outline-none transition focus:border-white focus:ring-4 focus:ring-white/10"
              >
                {RANGE_OPTIONS.map(
                  (option) => (
                    <option
                      key={
                        option.value
                      }
                      value={
                        option.value
                      }
                      className="text-[#10233f]"
                    >
                      {
                        option.label
                      }
                    </option>
                  )
                )}
              </select>

              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white" />
            </label>

            <p className="mt-4 text-xs font-semibold leading-5 text-white">
              Conversion = successful outcome ÷ tracked records in the selected
              date window.
            </p>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,13rem),1fr))] gap-3">
        {metrics.map(
          (metric, index) => (
            <MetricCard
              key={
                metric.label
              }
              {...metric}
              index={index}
              shouldReduceMotion={
                shouldReduceMotion
              }
            />
          )
        )}
      </div>

      {totalRecords === 0 ? (
        <EmptyAnalyticsState
          cardClass={
            cardClass
          }
        />
      ) : (
        <>
          <div
            className={`grid gap-5 ${
              visibleColumns.length ===
              2
                ? "xl:grid-cols-2"
                : ""
            }`}
          >
            {visibleColumns.map(
              (column) => (
                <PipelineColumn
                  key={column.id}
                  {...column}
                  cardClass={
                    cardClass
                  }
                  shouldReduceMotion={
                    shouldReduceMotion
                  }
                />
              )
            )}
          </div>

          <div className="grid gap-4 xl:grid-cols-3">
            <InsightCard
              icon={
                TrendingUp
              }
              eyebrow="Primary Strength"
              title={
                strongestPipeline
              }
              description={
                strongestPipeline ===
                "Balanced"
                  ? "Both pipelines currently show the same successful-outcome rate."
                  : `${strongestPipeline} currently produces the stronger measured outcome rate.`
              }
              tone="green"
            />

            <InsightCard
              icon={
                CircleDot
              }
              eyebrow="Inquiry Concentration"
              title={
                inquirySnapshot.title
              }
              description={
                inquirySnapshot.description
              }
              tone={
                inquirySnapshot.tone
              }
            />

            <InsightCard
              icon={
                CalendarCheck2
              }
              eyebrow="Appointment Concentration"
              title={
                appointmentSnapshot.title
              }
              description={
                appointmentSnapshot.description
              }
              tone={
                appointmentSnapshot.tone
              }
            />
          </div>

          <AnalyticsTruthNote />
        </>
      )}
    </motion.section>
  );
}

function MetricCard({
  label,
  value,
  helper,
  icon: Icon,
  tone = "orange",
  index,
  shouldReduceMotion,
}) {
  const tones = {
    orange:
      "border-[#F97316] bg-[#FFF4E8] text-orange-800",
    blue:
      "border-[#60A5FA] bg-[#F2F7FF] text-blue-800",
    green:
      "border-[#34D399] bg-[#F0FFF8] text-emerald-800",
    amber:
      "border-[#F59E0B] bg-[#FFF7ED] text-amber-900",
    red:
      "border-[#FB7185] bg-[#FFF4F4] text-red-800",
  };

  return (
    <motion.article
      initial={
        shouldReduceMotion
          ? false
          : {
              opacity: 0,
              y: 8,
            }
      }
      animate={{
        opacity: 1,
        y: 0,
      }}
      transition={{
        duration:
          shouldReduceMotion
            ? 0
            : 0.22,
        delay:
          shouldReduceMotion
            ? 0
            : index * 0.035,
      }}
      className={`min-w-0 rounded-[1.4rem] border-[3px] p-4 shadow-[0_8px_22px_rgba(15,35,63,0.055)] ${
        tones[tone] ||
        tones.orange
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[9px] font-black uppercase tracking-[0.14em]">
            {label}
          </p>

          <p className="mt-2 text-3xl font-black text-[#10233f]">
            {value}
          </p>
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

function PipelineToggle({
  value,
  onChange,
}) {
  const options = [
    {
      value: "both",
      label: "Both",
    },
    {
      value: "inquiries",
      label: "Inquiries",
    },
    {
      value: "appointments",
      label: "Appointments",
    },
  ];

  return (
    <div
      className="grid grid-cols-3 rounded-xl border-2 border-white/25 bg-white/10 p-1"
      role="group"
      aria-label="Select pipeline view"
    >
      {options.map(
        (option) => {
          const active =
            value ===
            option.value;

          return (
            <button
              key={
                option.value
              }
              type="button"
              onClick={() =>
                onChange(
                  option.value
                )
              }
              aria-pressed={
                active
              }
              className={`rounded-lg px-3 py-2 text-xs font-black transition ${
                active
                  ? "bg-white text-orange-700 shadow-sm"
                  : "text-white hover:bg-white/10"
              }`}
            >
              {option.label}
            </button>
          );
        }
      )}
    </div>
  );
}

function PipelineColumn({
  title,
  subtitle,
  total,
  conversion,
  items = [],
  snapshot,
  unknownCount = 0,
  cardClass = "",
  shouldReduceMotion,
}) {
  const max = Math.max(
    ...items.map(
      (item) =>
        item.count
    ),
    1
  );

  return (
    <article
      className={`${cardClass} min-w-0 overflow-hidden rounded-[2rem] border-[3px] border-[#C9D7E6] bg-[#FFFDF8] p-3 shadow-[0_14px_36px_rgba(15,35,63,0.07)]`}
    >
      <div className="overflow-hidden rounded-[1.55rem] border-[3px] border-[#F97316]">
      <div className="min-w-0 bg-[#173F6B] p-5 text-white sm:p-6">
        <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 flex-1">
            <p className="text-[9px] font-black uppercase tracking-[0.15em] text-white">
              Conversion Path
            </p>

            <h3 className="mt-1 break-words text-xl font-black leading-6 text-white">
              {title}
            </h3>

            <p className="mt-1 break-words text-sm font-semibold leading-5 text-white">
              {subtitle}
            </p>
          </div>

          <div className="flex gap-2">
            <HeaderMetric
              label="Records"
              value={total}
            />
            <HeaderMetric
              label="Outcome"
              value={`${conversion}%`}
            />
          </div>
        </div>
      </div>

      <div className="space-y-3 bg-[#FFF8EE] p-4 sm:p-5">
        <div className="grid gap-2 sm:grid-cols-2">
          <SnapshotCard
            label="Largest Stage"
            value={
              snapshot?.title ||
              "No stage"
            }
            helper={
              snapshot?.description ||
              "No measurable stage concentration."
            }
          />

          <SnapshotCard
            label="Unknown Stages"
            value={unknownCount}
            helper={
              unknownCount
                ? "These records do not map to the configured pipeline."
                : "All records map to known stages."
            }
            warning={
              unknownCount >
              0
            }
          />
        </div>

        {items.map(
          (item, index) => {
            const width =
              item.count === 0
                ? 0
                : Math.max(
                    (item.count /
                      max) *
                      100,
                    7
                  );

            const Icon =
              item.icon;

            return (
              <motion.div
                key={item.key}
                initial={
                  shouldReduceMotion
                    ? false
                    : {
                        opacity: 0,
                        y: 8,
                      }
                }
                animate={{
                  opacity: 1,
                  y: 0,
                }}
                transition={{
                  duration:
                    shouldReduceMotion
                      ? 0
                      : 0.22,
                  delay:
                    shouldReduceMotion
                      ? 0
                      : index *
                        0.025,
                }}
                className="min-w-0 rounded-[1.3rem] border-[3px] border-[#D1DCE7] bg-[#FFFDF8] p-4 transition hover:border-[#F97316] hover:shadow-[0_8px_20px_rgba(15,35,63,0.055)]"
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border-2 border-[#F97316] bg-[#FFF4E8] text-orange-700">
                    <Icon
                      size={16}
                    />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-black text-[#10233f]">
                          {item.label}
                        </p>

                        <p className="mt-0.5 text-xs font-semibold leading-5 text-slate-600">
                          {
                            item.description
                          }
                        </p>
                      </div>

                      <div className="text-right">
                        <p className="text-xl font-black text-[#10233f]">
                          {item.count}
                        </p>

                        <p className="text-[9px] font-black uppercase tracking-[0.1em] text-orange-700">
                          {
                            item.share
                          }
                          % share
                        </p>
                      </div>
                    </div>

                    <div className="mt-3 h-2.5 overflow-hidden rounded-full border border-slate-200 bg-slate-100">
                      <motion.div
                        initial={
                          shouldReduceMotion
                            ? false
                            : {
                                width: 0,
                              }
                        }
                        animate={{
                          width: `${width}%`,
                        }}
                        transition={{
                          duration:
                            shouldReduceMotion
                              ? 0
                              : 0.55,
                          delay:
                            shouldReduceMotion
                              ? 0
                              : 0.05 +
                                index *
                                  0.025,
                        }}
                        className="h-full rounded-full bg-[#E96512]"
                      />
                    </div>

                    <div className="mt-2 flex items-center justify-between gap-3 text-[10px] font-bold">
                      <span className="text-slate-500">
                        {item.count ===
                        0
                          ? "No records in this stage"
                          : "Current snapshot"}
                      </span>

                      <span className="text-slate-500">
                        Stage position{" "}
                        {index +
                          1}{" "}
                        /{" "}
                        {
                          items.length
                        }
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          }
        )}
      </div>
      </div>
    </article>
  );
}

function SnapshotCard({
  label,
  value,
  helper,
  warning = false,
}) {
  return (
    <div
      className={`rounded-xl border-2 p-3 ${
        warning
          ? "border-[#F59E0B] bg-[#FFF7ED]"
          : "border-[#C9D7E6] bg-[#FFFDF8]"
      }`}
    >
      <p className="text-[8px] font-black uppercase tracking-[0.1em] text-slate-500">
        {label}
      </p>

      <p className="mt-1 text-sm font-black text-[#10233f]">
        {value}
      </p>

      <p className="mt-1 text-[10px] font-semibold leading-4 text-slate-600">
        {helper}
      </p>
    </div>
  );
}

function HeaderMetric({
  label,
  value,
}) {
  return (
    <div className="min-w-[84px] rounded-xl border-2 border-white/30 bg-white/10 px-3 py-2 text-right text-white">
      <p className="text-[8px] font-black uppercase tracking-[0.1em] text-white">
        {label}
      </p>

      <p className="mt-1 text-lg font-black text-white">
        {value}
      </p>
    </div>
  );
}

function InsightCard({
  icon: Icon,
  eyebrow,
  title,
  description,
  tone = "orange",
}) {
  const tones = {
    orange:
      "border-[#F97316] bg-[#FFF4E8] text-orange-800",
    green:
      "border-[#34D399] bg-[#F0FFF8] text-emerald-800",
    amber:
      "border-[#F59E0B] bg-[#FFF7ED] text-amber-900",
    red:
      "border-[#FB7185] bg-[#FFF4F4] text-red-800",
    blue:
      "border-[#60A5FA] bg-[#F2F7FF] text-blue-800",
  };

  return (
    <article
      className={`min-w-0 rounded-[1.5rem] border-[3px] p-5 shadow-[0_8px_22px_rgba(15,35,63,0.055)] ${
        tones[tone] ||
        tones.orange
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

          <p className="mt-2 text-sm font-semibold leading-6 text-slate-700">
            {description}
          </p>
        </div>
      </div>
    </article>
  );
}

function AnalyticsTruthNote() {
  return (
    <div className="rounded-[1.55rem] border-[3px] border-[#60A5FA] bg-[#F2F7FF] p-5 shadow-[0_8px_22px_rgba(15,35,63,0.045)]">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border-2 border-blue-300 bg-white text-blue-700">
          <Info size={17} />
        </div>

        <div>
          <p className="text-sm font-black text-[#10233f]">
            Analytics methodology
          </p>

          <p className="mt-1 text-xs font-semibold leading-5 text-slate-700">
            These stage cards show the current distribution of records. They do
            not claim that the difference between adjacent stage counts is true
            funnel loss. Accurate drop-off needs stage-transition or cohort
            history, such as CRM timeline events for each student.
          </p>
        </div>
      </div>
    </div>
  );
}

function EmptyAnalyticsState({
  cardClass = "",
}) {
  return (
    <div
      className={`${cardClass} rounded-[2rem] border-[3px] border-dashed border-orange-300 bg-white px-6 py-12 text-center`}
    >
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border-2 border-orange-300 bg-orange-50 text-orange-700">
        <BarChart3 size={28} />
      </div>

      <h3 className="mt-4 text-xl font-black text-[#10233f]">
        Analytics will activate with pipeline data
      </h3>

      <p className="mx-auto mt-2 max-w-xl text-sm font-semibold leading-6 text-slate-600">
        Add inquiry or appointment records and update their stages to begin
        measuring current pipeline distribution and successful outcomes.
      </p>

      <div className="mx-auto mt-5 inline-flex items-center gap-2 rounded-full border-2 border-slate-300 bg-[#fffaf4] px-4 py-2 text-xs font-black text-slate-600">
        <Info size={14} className="text-orange-700" />
        Safe zero-state
      </div>
    </div>
  );
}

function buildStageData({
  records = [],
  config = [],
  getStatus,
}) {
  const total =
    records.length || 1;

  return config.map(
    (stage) => {
      const count =
        records.filter(
          (record) =>
            normalizeStatus(
              getStatus(record)
            ) ===
            stage.key
        ).length;

      return {
        ...stage,
        count,
        share:
          records.length > 0
            ? Math.round(
                (count /
                  total) *
                  100
              )
            : 0,
      };
    }
  );
}

function countUnknownStages({
  records = [],
  config = [],
  getStatus,
}) {
  const known = new Set(
    config.map(
      (stage) =>
        stage.key
    )
  );

  return records.filter(
    (record) =>
      !known.has(
        normalizeStatus(
          getStatus(record)
        )
      )
  ).length;
}

function getSnapshotInsight(
  items = []
) {
  if (!items.length) {
    return {
      title:
        "No stage data",
      description:
        "No stage distribution is available yet.",
      tone: "blue",
    };
  }

  const sorted = [
    ...items,
  ].sort(
    (a, b) =>
      b.count - a.count
  );

  const top = sorted[0];
  const total =
    items.reduce(
      (sum, item) =>
        sum +
        item.count,
      0
    );

  if (
    !top ||
    total === 0
  ) {
    return {
      title:
        "No active stage",
      description:
        "No records currently occupy a configured stage.",
      tone: "blue",
    };
  }

  const share = Math.round(
    (top.count /
      total) *
      100
  );

  let tone = "green";

  if (share >= 50) {
    tone = "amber";
  }

  if (share >= 70) {
    tone = "red";
  }

  return {
    title: `${top.shortLabel} · ${share}%`,
    description:
      share >= 50
        ? `${top.count} record(s) are concentrated in ${top.label}. This may indicate a workload or progression bottleneck worth reviewing.`
        : `${top.count} record(s) currently sit in ${top.label}; stage distribution is relatively spread out.`,
    tone,
  };
}

function filterByRange(
  records = [],
  range = "all"
) {
  if (range === "all") {
    return records;
  }

  const days =
    Number(range);

  if (
    !Number.isFinite(days) ||
    days <= 0
  ) {
    return records;
  }

  const cutoff =
    new Date();

  cutoff.setHours(
    0,
    0,
    0,
    0
  );

  cutoff.setDate(
    cutoff.getDate() -
      days +
      1
  );

  return records.filter(
    (record) => {
      const rawDate =
        record?.created_at ||
        record?.submitted_at ||
        record?.appointment_date ||
        record?.date;

      if (!rawDate) {
        return false;
      }

      const date =
        new Date(rawDate);

      if (
        Number.isNaN(
          date.getTime()
        )
      ) {
        return false;
      }

      return date >= cutoff;
    }
  );
}

function DarkStat({
  label,
  value,
}) {
  return (
    <div className="min-w-0 rounded-xl border-2 border-white/30 bg-white/10 p-3 text-white">
      <p className="text-[8px] font-black uppercase tracking-[0.1em] text-white">
        {label}
      </p>

      <p className="mt-1 text-xl font-black text-white">
        {value}
      </p>
    </div>
  );
}

export default ConversionAnalytics;
