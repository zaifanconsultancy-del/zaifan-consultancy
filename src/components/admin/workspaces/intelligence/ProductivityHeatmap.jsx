// ProductivityHeatmap V5 MAXIMUM — Readable Workload Grid + Insight Fix
// src/components/admin/ProductivityHeatmap.jsx
//
// Maximum pass:
// - preserves inquiries / appointments / followUpReminders props
// - fixes activity-mix totals so they reflect the selected heatmap window
// - replaces repeated 35 x N filtering with indexed date maps
// - adds 14 / 35 / 60 day window selector
// - adds All / Leads / Appointments / Follow-ups activity focus
// - safer malformed-date handling
// - adds active streak, busiest weekday, pressure ratio and peak-day intelligence
// - adds weekday workload profile
// - adds accessible cell labels and reduced-motion support
// - stronger Admin OS cream/orange/navy contrast
// - no backend writes, no fake AI, no schema assumptions

import { motion, useReducedMotion } from "framer-motion";
import {
  Activity,
  BellRing,
  CalendarCheck2,
  CalendarDays,
  CheckCircle2,
  CircleGauge,
  Flame,
  Grid3X3,
  HeartPulse,
  Sparkles,
  Target,
  TrendingUp,
  UserRound,
  Zap,
} from "lucide-react";
import { useMemo, useState } from "react";

function safeArray(value) {
  return Array.isArray(value) ? value.filter(Boolean) : [];
}

function safeDate(value) {
  if (!value) return null;

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function localDateKey(value) {
  const date = value instanceof Date ? value : safeDate(value);
  if (!date) return "";

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatLongDate(date) {
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function percentage(part, total) {
  if (!total) return 0;
  return Math.max(0, Math.min(100, Math.round((part / total) * 100)));
}

function buildCountMap(items, getDateValue) {
  const map = new Map();

  safeArray(items).forEach((item) => {
    const key = localDateKey(getDateValue(item));
    if (!key) return;

    map.set(key, (map.get(key) || 0) + 1);
  });

  return map;
}

function buildHeatmapDays({
  inquiries = [],
  appointments = [],
  followUpReminders = [],
  windowDays = 35,
}) {
  const inquiryMap = buildCountMap(
    inquiries,
    (item) => item.created_at || item.submitted_at
  );

  const appointmentMap = buildCountMap(
    appointments,
    (item) => item.appointment_date || item.created_at
  );

  const reminderMap = buildCountMap(
    followUpReminders,
    (item) => item.due_date || item.created_at
  );

  const today = new Date();

  return Array.from({ length: windowDays }, (_, index) => {
    const date = new Date(today);
    date.setHours(12, 0, 0, 0);
    date.setDate(today.getDate() - (windowDays - 1 - index));

    const key = localDateKey(date);

    const inquiriesCount = inquiryMap.get(key) || 0;
    const appointmentsCount = appointmentMap.get(key) || 0;
    const reminderCount = reminderMap.get(key) || 0;
    const total =
      inquiriesCount + appointmentsCount + reminderCount;

    return {
      key,
      date,
      label: formatLongDate(date),
      shortDay: date.toLocaleDateString("en-GB", {
        weekday: "short",
      }),
      weekday: date.toLocaleDateString("en-GB", {
        weekday: "long",
      }),
      dayNumber: date.getDate(),
      inquiries: inquiriesCount,
      appointments: appointmentsCount,
      reminders: reminderCount,
      total,
    };
  });
}

function getIntensityThresholds(days) {
  const values = days
    .map((day) => day.total)
    .filter((value) => value > 0)
    .sort((a, b) => a - b);

  if (!values.length) {
    return {
      lowMax: 1,
      mediumMax: 3,
    };
  }

  const median =
    values[Math.floor((values.length - 1) * 0.5)] || 1;

  const upper =
    values[Math.floor((values.length - 1) * 0.8)] ||
    median;

  return {
    lowMax: Math.max(1, median),
    mediumMax: Math.max(median + 1, upper),
  };
}

function applyIntensity(days) {
  const thresholds = getIntensityThresholds(days);

  return days.map((day) => {
    let level = "none";

    if (day.total > thresholds.mediumMax) {
      level = "high";
    } else if (day.total > thresholds.lowMax) {
      level = "medium";
    } else if (day.total > 0) {
      level = "low";
    }

    return {
      ...day,
      level,
    };
  });
}

function getActiveStreak(days) {
  let streak = 0;

  for (let index = days.length - 1; index >= 0; index -= 1) {
    if (days[index].total <= 0) break;
    streak += 1;
  }

  return streak;
}

function getBusiestWeekday(days) {
  const map = new Map();

  days.forEach((day) => {
    if (!map.has(day.weekday)) {
      map.set(day.weekday, {
        name: day.weekday,
        total: 0,
        days: 0,
      });
    }

    const bucket = map.get(day.weekday);
    bucket.total += day.total;
    bucket.days += 1;
  });

  return [...map.values()]
    .map((item) => ({
      ...item,
      average: item.days
        ? Math.round((item.total / item.days) * 10) / 10
        : 0,
    }))
    .sort((a, b) => b.average - a.average)[0] || null;
}

function ProductivityHeatmap({
  cardClass = "",
  inquiries = [],
  appointments = [],
  followUpReminders = [],
}) {
  const reduceMotion = useReducedMotion();

  const [windowDays, setWindowDays] = useState(35);
  const [focus, setFocus] = useState("all");

  const safeInquiries = safeArray(inquiries);
  const safeAppointments = safeArray(appointments);
  const safeReminders = safeArray(followUpReminders);

  const heatmapDays = useMemo(
    () =>
      applyIntensity(
        buildHeatmapDays({
          inquiries: safeInquiries,
          appointments: safeAppointments,
          followUpReminders: safeReminders,
          windowDays,
        })
      ),
    [
      safeInquiries,
      safeAppointments,
      safeReminders,
      windowDays,
    ]
  );

  const metrics = useMemo(() => {
    const totalActivity = heatmapDays.reduce(
      (sum, day) => sum + day.total,
      0
    );

    const totalInquiries = heatmapDays.reduce(
      (sum, day) => sum + day.inquiries,
      0
    );

    const totalAppointments = heatmapDays.reduce(
      (sum, day) => sum + day.appointments,
      0
    );

    const totalReminders = heatmapDays.reduce(
      (sum, day) => sum + day.reminders,
      0
    );

    const activeDays = heatmapDays.filter(
      (day) => day.total > 0
    ).length;

    const pressureDays = heatmapDays.filter(
      (day) => day.level === "high"
    ).length;

    const busiestDay = [...heatmapDays].sort(
      (a, b) => b.total - a.total
    )[0];

    const busiestWeekday = getBusiestWeekday(heatmapDays);

    return {
      totalActivity,
      totalInquiries,
      totalAppointments,
      totalReminders,
      activeDays,
      pressureDays,
      averageDailyActivity: heatmapDays.length
        ? Math.round((totalActivity / heatmapDays.length) * 10) /
          10
        : 0,
      activeRate: percentage(
        activeDays,
        heatmapDays.length
      ),
      pressureRate: percentage(
        pressureDays,
        heatmapDays.length
      ),
      activeStreak: getActiveStreak(heatmapDays),
      busiestDay,
      busiestWeekday,
    };
  }, [heatmapDays]);

  const weekdayProfile = useMemo(() => {
    const order = [
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
      "Sunday",
    ];

    const map = new Map(
      order.map((name) => [
        name,
        {
          name,
          short: name.slice(0, 3),
          total: 0,
          days: 0,
        },
      ])
    );

    heatmapDays.forEach((day) => {
      const bucket = map.get(day.weekday);
      if (!bucket) return;

      bucket.total += day.total;
      bucket.days += 1;
    });

    return order.map((name) => {
      const item = map.get(name);

      return {
        ...item,
        average: item.days
          ? Math.round((item.total / item.days) * 10) / 10
          : 0,
      };
    });
  }, [heatmapDays]);

  const maximumWeekdayAverage = Math.max(
    ...weekdayProfile.map((item) => item.average),
    1
  );

  const visibleDays = useMemo(
    () =>
      heatmapDays.map((day) => ({
        ...day,
        focusTotal:
          focus === "inquiries"
            ? day.inquiries
            : focus === "appointments"
            ? day.appointments
            : focus === "reminders"
            ? day.reminders
            : day.total,
      })),
    [heatmapDays, focus]
  );

  const maxVisibleActivity = Math.max(
    ...visibleDays.map((day) => day.focusTotal),
    1
  );

  const metricCards = [
    {
      label: "Window Activity",
      value: metrics.totalActivity,
      icon: Activity,
      tone: "orange",
      helper: `${windowDays}-day activity count`,
    },
    {
      label: "Active Days",
      value: metrics.activeDays,
      icon: CalendarDays,
      tone: "navy",
      helper: `${metrics.activeRate}% of selected window`,
    },
    {
      label: "Daily Avg",
      value: metrics.averageDailyActivity,
      icon: TrendingUp,
      tone: "good",
      helper: "Average operational activity",
    },
    {
      label: "Pressure Days",
      value: metrics.pressureDays,
      icon: Flame,
      tone:
        metrics.pressureDays > 0
          ? "danger"
          : "good",
      helper: `${metrics.pressureRate}% of selected window`,
    },
  ];

  const workloadRecommendation =
    metrics.pressureDays >= Math.max(3, windowDays * 0.15)
      ? {
          value: "Capacity pressure",
          text: `${metrics.pressureDays} high-intensity days were detected. Review counselor coverage, follow-up batching, and appointment distribution.`,
          tone: "danger",
        }
      : metrics.activeRate < 30 && metrics.totalActivity > 0
      ? {
          value: "Activity is clustered",
          text:
            "CRM work is concentrated into relatively few days. Spreading follow-up and appointment work may create a steadier operating rhythm.",
          tone: "warning",
        }
      : {
          value: "Workload stable",
          text:
            "Recent CRM activity is reasonably distributed. Continue watching peak weekdays before adding more counselor workload.",
          tone: "good",
        };

  return (
    <motion.section
      initial={
        reduceMotion
          ? false
          : { opacity: 0, y: 12 }
      }
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: reduceMotion ? 0 : 0.28,
      }}
      className="space-y-5 text-[#10233F]"
    >
      <section className="min-w-0 overflow-hidden rounded-[2rem] border-[3px] border-[#C9D7E6] bg-[#FFFDF8] p-3 shadow-[0_16px_40px_rgba(15,35,63,0.08)] sm:p-4">
        <div className="grid min-w-0 overflow-hidden rounded-[1.7rem] border-[3px] border-[#F97316] xl:grid-cols-[minmax(0,1.3fr)_minmax(20rem,0.7fr)]">
          <div
            className="min-w-0 bg-[#173F6B] p-5 sm:p-6"
            style={{ color: "#FFFFFF" }}
          >
            <div className="inline-flex items-center gap-2 rounded-full border-2 border-white/25 bg-white/10 px-3 py-1.5">
              <Grid3X3
                size={13}
                style={{ color: "#FDBA74" }}
              />

              <p
                className="text-[9px] font-black uppercase tracking-[0.1em]"
                style={{ color: "#FFFFFF" }}
              >
                Productivity Heatmap
              </p>
            </div>

            <h2
              className="mt-3 break-words text-2xl font-black leading-tight tracking-tight sm:text-3xl"
              style={{ color: "#FFFFFF" }}
            >
              CRM Activity Intensity Map
            </h2>

            <p
              className="mt-2 max-w-3xl break-words text-sm font-semibold leading-6"
              style={{ color: "#F8FAFC" }}
            >
              Maps inquiry activity, scheduled appointments, and
              follow-up workload to expose operating pressure and staff
              coverage patterns.
            </p>
          </div>

          <div
            className="min-w-0 border-t-[3px] border-[#F97316] bg-[#E96512] p-5 sm:p-6 xl:border-l-[3px] xl:border-t-0"
            style={{ color: "#FFFFFF" }}
          >
            <div className="flex items-center gap-2">
              <CircleGauge size={18} />

              <p className="text-[9px] font-black uppercase tracking-[0.1em] text-white">
                Activity Coverage
              </p>
            </div>

            <p className="mt-3 text-4xl font-black text-white">
              {metrics.activeRate}%
            </p>

            <p className="mt-1 text-xs font-black uppercase tracking-[0.08em] text-white">
              Active-Day Rate
            </p>

            <p className="mt-4 text-xs font-semibold leading-5 text-white">
              {metrics.activeStreak} day active streak · peak{" "}
              {metrics.busiestWeekday?.name || "not available"}.
            </p>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,13rem),1fr))] gap-3">
        {metricCards.map((metric) => (
          <MetricCard
            key={metric.label}
            {...metric}
          />
        ))}
      </div>

      <section
        className={`${cardClass} min-w-0 rounded-[1.6rem] border-[3px] border-[#C9D7E6] bg-[#FFFDF8] p-4 shadow-[0_7px_20px_rgba(15,35,63,0.05)]`}
      >
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.1em] text-[#B84F0E]">
              Heatmap Controls
            </p>

            <h3 className="mt-1 text-lg font-black text-[#10233F]">
              Adjust the operating window
            </h3>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="flex rounded-xl border-2 border-[#C9D7E6] bg-[#FFF8EE] p-1">
              {[14, 35, 60].map((days) => (
                <button
                  key={days}
                  type="button"
                  onClick={() => setWindowDays(days)}
                  className={`rounded-lg px-3 py-2 text-xs font-black transition ${
                    windowDays === days
                      ? "bg-[#FF5A0A] text-white shadow-sm"
                      : "text-[#51627A] hover:bg-white hover:text-[#B84F0E]"
                  }`}
                >
                  {days} Days
                </button>
              ))}
            </div>

            <select
              value={focus}
              onChange={(event) =>
                setFocus(event.target.value)
              }
              className="min-h-11 rounded-xl border-2 border-[#C9D7E6] bg-white px-4 text-sm font-black text-[#10233F] outline-none focus:border-[#FF5A0A]"
            >
              <option value="all">All Activity</option>
              <option value="inquiries">Leads Only</option>
              <option value="appointments">Appointments Only</option>
              <option value="reminders">Follow-Ups Only</option>
            </select>
          </div>
        </div>
      </section>

      <div className="grid gap-5 xl:grid-cols-[1.25fr_0.75fr]">
        <div
          className={`${cardClass} min-w-0 rounded-[2rem] border-[3px] border-[#F97316] bg-[#FFFDF8] p-5 shadow-[0_10px_28px_rgba(15,35,63,0.06)] sm:p-6`}
        >
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.1em] text-[#B84F0E]">
                Last {windowDays} Days
              </p>

              <h3 className="mt-1 text-xl font-black text-[#10233F]">
                Operational Workload Grid
              </h3>

              <p className="mt-1 max-w-2xl text-xs font-semibold leading-5 text-[#51627A]">
                Each day shows Leads, Appointments and Follow-ups directly. The bottom bar reflects the currently selected activity focus.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-[9px] font-black uppercase tracking-[0.08em] text-[#65748B]">
              <span>Low</span>
              <span className="h-3 w-3 rounded border border-[#C9D7E6] bg-white" />
              <span className="h-3 w-3 rounded border border-[#F97316] bg-[#FFF4E8]" />
              <span className="h-3 w-3 rounded border border-amber-300 bg-amber-100" />
              <span className="h-3 w-3 rounded border border-red-300 bg-red-100" />
              <span>High</span>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-1.5 sm:gap-2.5">
            {visibleDays.map((day, index) => {
              const barPercent = percentage(
                day.focusTotal,
                maxVisibleActivity
              );

              return (
                <motion.div
                  key={day.key}
                  initial={
                    reduceMotion
                      ? false
                      : {
                          opacity: 0,
                          scale: 0.94,
                        }
                  }
                  animate={{
                    opacity: 1,
                    scale: 1,
                  }}
                  transition={{
                    duration: reduceMotion ? 0 : 0.18,
                    delay: reduceMotion
                      ? 0
                      : Math.min(index * 0.008, 0.2),
                  }}
                  title={`${day.label}: ${day.total} total activity — ${day.inquiries} leads, ${day.appointments} appointments, ${day.reminders} follow-ups`}
                  aria-label={`${day.label}. ${day.total} total CRM activities. ${day.inquiries} inquiries, ${day.appointments} appointments, ${day.reminders} follow-ups.`}
                  className={`group relative min-h-[118px] overflow-hidden rounded-xl border-2 p-2.5 transition duration-200 hover:-translate-y-0.5 hover:border-[#F97316] hover:shadow-[0_7px_18px_rgba(15,35,63,0.06)] sm:min-h-[132px] sm:p-3 ${getHeatCellStyle(
                    day.level
                  )}`}
                >
                  <div className="flex items-center justify-between gap-1">
                    <p className="text-[8px] font-black uppercase tracking-[0.06em] text-[#51627A] sm:text-[9px]">
                      {day.shortDay}
                    </p>

                    {day.level === "high" ? (
                      <Zap className="h-3.5 w-3.5 text-red-700" />
                    ) : null}
                  </div>

                  <p className="mt-1.5 text-sm font-black text-[#10233F] sm:text-base">
                    {day.dayNumber}
                  </p>

                  <div className="mt-2 space-y-1 text-[8px] font-bold leading-4 text-[#51627A] sm:text-[9px]">
                    <div className="flex min-w-0 items-center justify-between gap-1.5">
                      <span className="flex min-w-0 items-center gap-1">
                        <UserRound className="h-3 w-3 shrink-0 text-emerald-600" />
                        <span className="truncate">Leads</span>
                      </span>
                      <span className="shrink-0 font-black text-[#10233F]">
                        {day.inquiries}
                      </span>
                    </div>

                    <div className="flex min-w-0 items-center justify-between gap-1.5">
                      <span className="flex min-w-0 items-center gap-1">
                        <CalendarCheck2 className="h-3 w-3 shrink-0 text-blue-600" />
                        <span className="truncate">Appts</span>
                      </span>
                      <span className="shrink-0 font-black text-[#10233F]">
                        {day.appointments}
                      </span>
                    </div>

                    <div className="flex min-w-0 items-center justify-between gap-1.5">
                      <span className="flex min-w-0 items-center gap-1">
                        <BellRing className="h-3 w-3 shrink-0 text-violet-600" />
                        <span className="truncate">Follow-ups</span>
                      </span>
                      <span className="shrink-0 font-black text-[#10233F]">
                        {day.reminders}
                      </span>
                    </div>
                  </div>

                  <div className="absolute inset-x-2 bottom-2 h-1.5 overflow-hidden rounded-full bg-slate-200">
                    <div
                      className="h-full rounded-full bg-[#FF5A0A] transition-[width] duration-300"
                      style={{
                        width: `${barPercent}%`,
                      }}
                    />
                  </div>
                </motion.div>
              );
            })}
          </div>

          <div className="mt-4 flex flex-wrap gap-2 text-[10px] font-bold text-[#51627A]">
            <span className="inline-flex items-center gap-1.5 rounded-full border-2 border-emerald-200 bg-emerald-50 px-2.5 py-1">
              <UserRound className="h-3 w-3 text-emerald-600" />
              Leads / Inquiries
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border-2 border-blue-200 bg-blue-50 px-2.5 py-1">
              <CalendarCheck2 className="h-3 w-3 text-blue-600" />
              Appointments
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border-2 border-violet-200 bg-violet-50 px-2.5 py-1">
              <BellRing className="h-3 w-3 text-violet-600" />
              Follow-ups / Reminders
            </span>
            <span className="inline-flex items-center rounded-full border-2 border-[#C9D7E6] bg-white px-2.5 py-1">
              Bottom bar = selected activity focus
            </span>
          </div>
        </div>

        <div className="space-y-5">
          <InsightCard
            cardClass={cardClass}
            icon={Flame}
            title="Busiest Day"
            value={
              metrics.busiestDay?.total
                ? metrics.busiestDay.label
                : "No activity"
            }
            text={
              metrics.busiestDay?.total
                ? `${metrics.busiestDay.total} CRM activities were mapped to this day.`
                : "No CRM activity was detected in the selected window."
            }
            tone="danger"
          />

          <InsightCard
            cardClass={cardClass}
            icon={Target}
            title="Peak Weekday"
            value={
              metrics.busiestWeekday?.name ||
              "Not available"
            }
            text={
              metrics.busiestWeekday
                ? `${metrics.busiestWeekday.average} average activities per ${metrics.busiestWeekday.name}.`
                : "More activity is needed before a weekday pattern can be identified."
            }
            tone="blue"
          />

          <InsightCard
            cardClass={cardClass}
            icon={Sparkles}
            title="Workload Recommendation"
            value={workloadRecommendation.value}
            text={workloadRecommendation.text}
            tone={workloadRecommendation.tone}
          />

          <div
            className={`${cardClass} min-w-0 rounded-[2rem] border-[3px] border-[#F97316] bg-[#FFFDF8] p-5 shadow-[0_10px_28px_rgba(15,35,63,0.06)] sm:p-6`}
          >
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl border-2 border-blue-300 bg-blue-50">
                <HeartPulse className="h-5 w-5 text-blue-700" />
              </div>

              <div>
                <p className="text-[9px] font-black uppercase tracking-[0.1em] text-[#65748B]">
                  Activity Mix
                </p>

                <h3 className="mt-1 text-lg font-black text-[#10233F]">
                  Selected {windowDays}-day window
                </h3>
              </div>
            </div>

            <div className="mt-5 space-y-3">
              <ProgressRow
                label="Inquiries / Leads"
                value={metrics.totalInquiries}
                total={metrics.totalActivity}
                tone="orange"
              />

              <ProgressRow
                label="Appointments"
                value={metrics.totalAppointments}
                total={metrics.totalActivity}
                tone="navy"
              />

              <ProgressRow
                label="Follow-ups / Reminders"
                value={metrics.totalReminders}
                total={metrics.totalActivity}
                tone="good"
              />
            </div>
          </div>
        </div>
      </div>

      <section
        className={`${cardClass} rounded-[1.7rem] border-[3px] border-[#C9D7E6] bg-[#FFFDF8] p-5 shadow-[0_8px_24px_rgba(15,35,63,0.05)]`}
      >
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.1em] text-[#B84F0E]">
              Weekday Profile
            </p>

            <h3 className="mt-1 text-lg font-black text-[#10233F]">
              Average workload by weekday
            </h3>
          </div>

          <span className="rounded-full border-2 border-[#C9D7E6] bg-[#FFF8EE] px-3 py-1.5 text-[10px] font-black text-[#51627A]">
            {metrics.activeStreak} day active streak
          </span>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
          {weekdayProfile.map((item) => (
            <div
              key={item.name}
              className="rounded-xl border-2 border-[#C9D7E6] bg-[#FFF8EE] p-3"
            >
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-black text-[#10233F]">
                  {item.short}
                </p>

                <span className="text-xs font-black text-[#B84F0E]">
                  {item.average}
                </span>
              </div>

              <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200">
                <div
                  className="h-full rounded-full bg-[#FF5A0A]"
                  style={{
                    width: `${percentage(
                      item.average,
                      maximumWeekdayAverage
                    )}%`,
                  }}
                />
              </div>

              <p className="mt-2 text-[9px] font-semibold text-[#65748B]">
                {item.total} total activity
              </p>
            </div>
          ))}
        </div>
      </section>
    </motion.section>
  );
}

function MetricCard({
  label,
  value,
  icon: Icon,
  helper,
  tone = "orange",
}) {
  const style =
    tone === "danger"
      ? "border-[#FB7185] bg-[#FFF4F4]"
      : tone === "good"
      ? "border-[#34D399] bg-[#F0FFF8]"
      : tone === "navy"
      ? "border-[#315B88] bg-[#EEF5FC]"
      : "border-[#F97316] bg-[#FFF4E8]";

  return (
    <div
      className={`rounded-[1.25rem] border-[3px] p-4 shadow-[0_6px_18px_rgba(15,35,63,0.035)] ${style}`}
      style={{ color: "#10233F" }}
    >
      <div className="flex min-w-0 items-start justify-between gap-3">
        <div>
          <p
            className="text-[9px] font-black uppercase tracking-[0.1em]"
            style={{ color: "#64748B" }}
          >
            {label}
          </p>

          <p
            className="mt-2 text-3xl font-black"
            style={{ color: "#10233F" }}
          >
            {value}
          </p>
        </div>

        <Icon
          size={18}
          style={{ color: tone === "navy" ? "#315B88" : "#C2410C" }}
        />
      </div>

      <p
        className="mt-2 text-xs font-semibold leading-5"
        style={{ color: "#64748B" }}
      >
        {helper}
      </p>
    </div>
  );
}

function getHeatCellStyle(level) {
  if (level === "high") {
    return "border-[#FB7185] bg-[#FFF4F4] shadow-[0_0_20px_rgba(248,113,113,0.08)]";
  }

  if (level === "medium") {
    return "border-[#F59E0B] bg-[#FFF7ED]";
  }

  if (level === "low") {
    return "border-[#F97316] bg-[#FFF4E8]";
  }

  return "border-[#C9D7E6] bg-white";
}

function InsightCard({
  cardClass,
  icon: Icon,
  title,
  value,
  text,
  tone = "orange",
}) {
  const themes = {
    danger: {
      border: "border-[#FB7185]",
      bg: "bg-[#FFF4F4]",
      accent: "bg-[#FB7185]",
      iconBorder: "border-[#FDA4AF]",
      iconBg: "bg-white",
      iconText: "text-red-700",
      eyebrow: "text-red-700",
    },
    warning: {
      border: "border-[#F59E0B]",
      bg: "bg-[#FFF7ED]",
      accent: "bg-[#F59E0B]",
      iconBorder: "border-[#FCD34D]",
      iconBg: "bg-white",
      iconText: "text-amber-700",
      eyebrow: "text-amber-700",
    },
    good: {
      border: "border-[#34D399]",
      bg: "bg-[#F0FFF8]",
      accent: "bg-[#34D399]",
      iconBorder: "border-[#86EFAC]",
      iconBg: "bg-white",
      iconText: "text-emerald-700",
      eyebrow: "text-emerald-700",
    },
    blue: {
      border: "border-[#60A5FA]",
      bg: "bg-[#F2F7FF]",
      accent: "bg-[#60A5FA]",
      iconBorder: "border-[#93C5FD]",
      iconBg: "bg-white",
      iconText: "text-blue-700",
      eyebrow: "text-blue-700",
    },
    orange: {
      border: "border-[#F97316]",
      bg: "bg-[#FFF4E8]",
      accent: "bg-[#F97316]",
      iconBorder: "border-[#FDBA74]",
      iconBg: "bg-white",
      iconText: "text-[#B84F0E]",
      eyebrow: "text-[#B84F0E]",
    },
  };

  const theme = themes[tone] || themes.orange;

  return (
    <div
      className={`${cardClass} relative min-w-0 overflow-hidden rounded-[1.6rem] border-[3px] p-5 shadow-[0_8px_22px_rgba(15,35,63,0.055)] ${theme.border} ${theme.bg}`}
    >
      <div className={`absolute inset-x-0 top-0 h-1.5 ${theme.accent}`} />

      <div className="flex min-w-0 items-start gap-4 pt-1">
        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border-2 ${theme.iconBorder} ${theme.iconBg} ${theme.iconText}`}
        >
          <Icon className="h-5 w-5" />
        </div>

        <div className="min-w-0 flex-1">
          <p
            className={`text-[9px] font-black uppercase tracking-[0.1em] ${theme.eyebrow}`}
          >
            {title}
          </p>

          <h3 className="mt-2 break-words text-lg font-black leading-6 text-[#10233F]">
            {value}
          </h3>

          <p className="mt-2 break-words text-sm font-semibold leading-6 text-[#51627A]">
            {text}
          </p>
        </div>
      </div>
    </div>
  );
}

function ProgressRow({
  label,
  value,
  total,
  tone = "orange",
}) {
  const percent = percentage(value, total);

  const bar =
    tone === "navy"
      ? "bg-[#123865]"
      : tone === "good"
      ? "bg-emerald-500"
      : "bg-[#FF5A0A]";

  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-3">
        <p className="text-xs font-black uppercase tracking-[0.08em] text-[#51627A]">
          {label}
        </p>

        <p className="text-xs font-black text-[#10233F]">
          {value} · {percent}%
        </p>
      </div>

      <div className="h-2.5 overflow-hidden rounded-full bg-slate-200">
        <div
          className={`h-full rounded-full transition-[width] duration-300 ${bar}`}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}

export default ProductivityHeatmap;
