// LuxuryAnalyticsCharts V3 MAXIMUM — Executive CRM Analytics
// src/components/admin/LuxuryAnalyticsCharts.jsx
//
// Maximum pass:
// - preserves inquiries / appointments / followUpReminders props
// - preserves Recharts-based visual analytics
// - safer status / priority / date normalization
// - memoizes all heavier derived datasets
// - adds 7 / 14 / 30 day trend windows
// - adds assignment, reminder, conversion, and high-value intelligence
// - adds strongest-day and overdue-pressure summaries
// - handles malformed dates safely
// - avoids double-counting overdue reminders in "pending" interpretation
// - filters empty pie slices and keeps charts readable with low data
// - reduced-motion support
// - stronger mobile layout and chart overflow handling
// - explicit Zaifan Admin OS cream/orange/navy contrast
// - no backend writes, no fake AI, no invented schema fields

import { motion, useReducedMotion } from "framer-motion";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  CircleGauge,
  Crown,
  LineChart as LineChartIcon,
  PieChart as PieChartIcon,
  ShieldCheck,
  Target,
  TrendingUp,
  UserRoundCheck,
} from "lucide-react";
import { useMemo, useState } from "react";

const TREND_WINDOWS = [7, 14, 30];

function safeArray(value) {
  return Array.isArray(value) ? value.filter(Boolean) : [];
}

function safeNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function normalize(value = "") {
  return String(value || "").toLowerCase().trim();
}

function safeDate(value) {
  if (!value) return null;

  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? null : date;
}

function startOfDay(value = new Date()) {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date;
}

function toDayKey(value) {
  const date = safeDate(value);
  if (!date) return "";

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatDayLabel(value) {
  const date = safeDate(value);
  if (!date) return "Unknown";

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function percentage(numerator, denominator) {
  const top = safeNumber(numerator);
  const bottom = safeNumber(denominator);

  if (bottom <= 0) return 0;

  return Math.max(0, Math.min(100, Math.round((top / bottom) * 100)));
}

function buildDays(windowDays) {
  return Array.from({ length: windowDays }).map((_, index) => {
    const date = startOfDay(new Date());
    date.setDate(date.getDate() - (windowDays - 1 - index));

    return {
      raw: date,
      key: toDayKey(date),
      label: formatDayLabel(date),
    };
  });
}

function LuxuryAnalyticsCharts({
  cardClass = "",
  inquiries = [],
  appointments = [],
  followUpReminders = [],
}) {
  const reduceMotion = useReducedMotion();
  const [trendWindow, setTrendWindow] = useState(7);

  const safeInquiries = useMemo(() => safeArray(inquiries), [inquiries]);
  const safeAppointments = useMemo(
    () => safeArray(appointments),
    [appointments]
  );
  const safeReminders = useMemo(
    () => safeArray(followUpReminders),
    [followUpReminders]
  );

  const allLeads = useMemo(
    () => [...safeInquiries, ...safeAppointments],
    [safeInquiries, safeAppointments]
  );

  const dailyLeadTrend = useMemo(() => {
    const days = buildDays(trendWindow);

    const inquiryMap = new Map();
    const appointmentMap = new Map();

    safeInquiries.forEach((item) => {
      const key = toDayKey(item.created_at);
      if (!key) return;
      inquiryMap.set(key, (inquiryMap.get(key) || 0) + 1);
    });

    safeAppointments.forEach((item) => {
      const key = toDayKey(item.created_at);
      if (!key) return;
      appointmentMap.set(key, (appointmentMap.get(key) || 0) + 1);
    });

    return days.map((day) => {
      const inquiriesCount = inquiryMap.get(day.key) || 0;
      const appointmentsCount = appointmentMap.get(day.key) || 0;

      return {
        day: day.label,
        inquiries: inquiriesCount,
        appointments: appointmentsCount,
        total: inquiriesCount + appointmentsCount,
      };
    });
  }, [safeInquiries, safeAppointments, trendWindow]);

  const priorityData = useMemo(() => {
    const count = (priorityName) =>
      allLeads.filter((item) => normalize(item.priority) === priorityName).length;

    const vip = count("vip");
    const high = count("high");
    const medium =
      count("medium") +
      allLeads.filter((item) =>
        ["", "normal"].includes(normalize(item.priority))
      ).length;
    const low = count("low");

    return [
      { name: "VIP", value: vip },
      { name: "High", value: high },
      { name: "Medium", value: medium },
      { name: "Low", value: low },
    ].filter((item) => item.value > 0);
  }, [allLeads]);

  const pipelineData = useMemo(() => {
    const getCount = (...statuses) =>
      safeInquiries.filter((item) =>
        statuses.includes(normalize(item.status || "new"))
      ).length;

    return [
      { name: "New", value: getCount("new", "") },
      { name: "Contacted", value: getCount("contacted") },
      { name: "Interested", value: getCount("interested") },
      {
        name: "Converted",
        value: getCount(
          "converted",
          "approved",
          "applied",
          "offer_letter",
          "visa_process"
        ),
      },
      { name: "Lost", value: getCount("lost", "rejected", "not_interested") },
    ];
  }, [safeInquiries]);

  const appointmentData = useMemo(() => {
    const getCount = (...statuses) =>
      safeAppointments.filter((item) =>
        statuses.includes(normalize(item.status || "pending"))
      ).length;

    return [
      { name: "Pending", value: getCount("pending", "") },
      { name: "Confirmed", value: getCount("confirmed") },
      { name: "Completed", value: getCount("completed") },
      { name: "Cancelled", value: getCount("cancelled") },
    ];
  }, [safeAppointments]);

  const reminderData = useMemo(() => {
    const today = new Date();

    const overdue = safeReminders.filter((item) => {
      const status = normalize(item.status || "pending");
      if (["completed", "done", "closed"].includes(status)) return false;

      const dueDate = safeDate(item.due_date || item.dueDate);
      return dueDate ? dueDate < today : false;
    }).length;

    const completed = safeReminders.filter((item) =>
      ["completed", "done", "closed"].includes(
        normalize(item.status)
      )
    ).length;

    const pending = safeReminders.filter((item) => {
      const status = normalize(item.status || "pending");

      if (["completed", "done", "closed"].includes(status)) return false;

      const dueDate = safeDate(item.due_date || item.dueDate);

      return !dueDate || dueDate >= today;
    }).length;

    return [
      { name: "Pending", value: pending },
      { name: "Completed", value: completed },
      { name: "Overdue", value: overdue },
    ];
  }, [safeReminders]);

  const metrics = useMemo(() => {
    const totalLeads = allLeads.length;

    const totalHighValue = priorityData
      .filter((item) => ["VIP", "High"].includes(item.name))
      .reduce((sum, item) => sum + item.value, 0);

    const convertedLeads = pipelineData.find(
      (item) => item.name === "Converted"
    )?.value || 0;

    const conversionRate = percentage(
      convertedLeads,
      safeInquiries.length
    );

    const assigned = allLeads.filter(
      (item) => item.assigned_admin_id || item.assigned_admin_name
    ).length;

    const assignmentRate = percentage(assigned, totalLeads);

    const completedAppointments =
      appointmentData.find((item) => item.name === "Completed")?.value || 0;

    const appointmentCompletionRate = percentage(
      completedAppointments,
      safeAppointments.length
    );

    const completedReminders =
      reminderData.find((item) => item.name === "Completed")?.value || 0;

    const reminderCompletionRate = percentage(
      completedReminders,
      safeReminders.length
    );

    const overdueReminders =
      reminderData.find((item) => item.name === "Overdue")?.value || 0;

    const strongestDay = [...dailyLeadTrend].sort(
      (a, b) => b.total - a.total
    )[0] || null;

    return {
      totalLeads,
      totalHighValue,
      convertedLeads,
      conversionRate,
      assigned,
      assignmentRate,
      appointmentCompletionRate,
      reminderCompletionRate,
      overdueReminders,
      strongestDay,
    };
  }, [
    allLeads,
    priorityData,
    pipelineData,
    safeInquiries.length,
    appointmentData,
    safeAppointments.length,
    reminderData,
    safeReminders.length,
    dailyLeadTrend,
  ]);

  const hasChartData =
    metrics.totalLeads > 0 || safeReminders.length > 0;

  const chartCards = [
    {
      title: "Lead Growth Trend",
      subtitle: `Inquiry and appointment movement across the last ${trendWindow} days`,
      icon: LineChartIcon,
      content: (
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={dailyLeadTrend}>
            <defs>
              <linearGradient id="leadTrendOrange" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#F97316" stopOpacity={0.32} />
                <stop offset="95%" stopColor="#F97316" stopOpacity={0.02} />
              </linearGradient>
              <linearGradient id="leadTrendBlue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#2563EB" stopOpacity={0.22} />
                <stop offset="95%" stopColor="#2563EB" stopOpacity={0.02} />
              </linearGradient>
            </defs>

            <CartesianGrid
              stroke="rgba(15,35,63,0.10)"
              vertical={false}
            />

            <XAxis
              dataKey="day"
              stroke="rgba(15,35,63,0.45)"
              tick={{ fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              minTickGap={22}
            />

            <YAxis
              stroke="rgba(15,35,63,0.45)"
              tick={{ fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              allowDecimals={false}
            />

            <Tooltip content={<LuxuryTooltip />} />

            <Area
              type="monotone"
              dataKey="inquiries"
              stroke="#F97316"
              strokeWidth={3}
              fill="url(#leadTrendOrange)"
              dot={{ r: 3 }}
              isAnimationActive={!reduceMotion}
            />

            <Area
              type="monotone"
              dataKey="appointments"
              stroke="#2563EB"
              strokeWidth={3}
              fill="url(#leadTrendBlue)"
              dot={{ r: 3 }}
              isAnimationActive={!reduceMotion}
            />
          </AreaChart>
        </ResponsiveContainer>
      ),
    },
    {
      title: "Inquiry Pipeline",
      subtitle: "Status movement across the student inquiry journey",
      icon: BarChart3,
      content: (
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={pipelineData}>
            <CartesianGrid
              stroke="rgba(15,35,63,0.10)"
              vertical={false}
            />

            <XAxis
              dataKey="name"
              stroke="rgba(15,35,63,0.45)"
              tick={{ fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />

            <YAxis
              stroke="rgba(15,35,63,0.45)"
              tick={{ fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              allowDecimals={false}
            />

            <Tooltip content={<LuxuryTooltip />} />

            <Bar
              dataKey="value"
              radius={[12, 12, 0, 0]}
              isAnimationActive={!reduceMotion}
            >
              {pipelineData.map((entry, index) => (
                <Cell
                  key={`pipeline-${entry.name}`}
                  fill={
                    ["#F97316", "#2563EB", "#7C3AED", "#16A34A", "#DC2626"][
                      index
                    ]
                  }
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      ),
    },
    {
      title: "Priority Mix",
      subtitle: "VIP, high, medium, and low-value lead spread",
      icon: PieChartIcon,
      content: priorityData.length ? (
        <ResponsiveContainer width="100%" height={280}>
          <PieChart>
            <Pie
              data={priorityData}
              dataKey="value"
              nameKey="name"
              innerRadius={64}
              outerRadius={98}
              paddingAngle={5}
              isAnimationActive={!reduceMotion}
            >
              {priorityData.map((entry, index) => (
                <Cell
                  key={`priority-${entry.name}`}
                  fill={["#7C3AED", "#DC2626", "#F97316", "#64748B"][index]}
                />
              ))}
            </Pie>

            <Tooltip content={<LuxuryTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      ) : (
        <EmptyChartState text="No priority data available yet." />
      ),
    },
    {
      title: "Appointment Flow",
      subtitle: "Pending, confirmed, completed, and cancelled bookings",
      icon: Activity,
      content: (
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={appointmentData}>
            <CartesianGrid
              stroke="rgba(15,35,63,0.10)"
              vertical={false}
            />

            <XAxis
              dataKey="name"
              stroke="rgba(15,35,63,0.45)"
              tick={{ fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />

            <YAxis
              stroke="rgba(15,35,63,0.45)"
              tick={{ fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              allowDecimals={false}
            />

            <Tooltip content={<LuxuryTooltip />} />

            <Line
              type="monotone"
              dataKey="value"
              stroke="#F97316"
              strokeWidth={3}
              dot={{ r: 5 }}
              activeDot={{ r: 7 }}
              isAnimationActive={!reduceMotion}
            />
          </LineChart>
        </ResponsiveContainer>
      ),
    },
    {
      title: "Reminder Health",
      subtitle: "Follow-up completion and overdue workload",
      icon: TrendingUp,
      content: (
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={reminderData}>
            <CartesianGrid
              stroke="rgba(15,35,63,0.10)"
              vertical={false}
            />

            <XAxis
              dataKey="name"
              stroke="rgba(15,35,63,0.45)"
              tick={{ fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />

            <YAxis
              stroke="rgba(15,35,63,0.45)"
              tick={{ fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              allowDecimals={false}
            />

            <Tooltip content={<LuxuryTooltip />} />

            <Bar
              dataKey="value"
              radius={[12, 12, 0, 0]}
              isAnimationActive={!reduceMotion}
            >
              {reminderData.map((entry, index) => (
                <Cell
                  key={`reminder-${entry.name}`}
                  fill={["#F97316", "#16A34A", "#DC2626"][index]}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      ),
    },
  ];

  return (
    <motion.section
      key="luxury-analytics-charts"
      initial={reduceMotion ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: reduceMotion ? 0 : 0.26,
        ease: [0.22, 1, 0.36, 1],
      }}
      className={`${cardClass} min-w-0 space-y-5 rounded-[2rem] border-[3px] border-[#123865] bg-[#FFF8EF] p-4 text-[#10233F] shadow-[0_18px_50px_rgba(23,63,107,0.12)] sm:p-5`}
    >
      <header className="overflow-hidden rounded-[1.75rem] border-[3px] border-[#F97316]">
        <div className="grid xl:grid-cols-[minmax(0,1.25fr)_minmax(18rem,0.75fr)]">
          <div className="bg-[#123865] p-5 text-white sm:p-6">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-2 rounded-full border-2 border-orange-300/30 bg-orange-400/10 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.12em] text-orange-300">
                <BarChart3 size={12} />
                CRM Charts OS
              </span>

              <span className="inline-flex items-center gap-2 rounded-full border-2 border-white/15 bg-white/5 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.12em] text-white">
                <ShieldCheck size={12} />
                Live Visual Evidence
              </span>
            </div>

            <h2 className="mt-3 text-3xl font-black text-white">
              CRM Visual Intelligence Command
            </h2>

            <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-200">
              One visual operating workspace for lead growth, pipeline
              distribution, priority mix, appointment performance and follow-up
              pressure.
            </p>
          </div>

          <div className="bg-[#FF5A0A] p-5 text-white sm:p-6">
            <p className="text-[9px] font-black uppercase tracking-[0.12em]">
              Trend Window
            </p>

            <div className="mt-3 flex flex-wrap gap-2">
              {TREND_WINDOWS.map((days) => (
                <button
                  key={days}
                  type="button"
                  onClick={() => setTrendWindow(days)}
                  className={`rounded-xl border-2 px-4 py-2 text-xs font-black transition ${
                    trendWindow === days
                      ? "border-white bg-white text-[#123865]"
                      : "border-white/30 bg-white/10 text-white hover:bg-white/15"
                  }`}
                >
                  {days} Days
                </button>
              ))}
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2">
              <ChartHeroMetric label="Leads" value={metrics.totalLeads} />
              <ChartHeroMetric
                label="Conversion"
                value={`${metrics.conversionRate}%`}
              />
              <ChartHeroMetric
                label="Assigned"
                value={`${metrics.assignmentRate}%`}
              />
              <ChartHeroMetric
                label="Overdue"
                value={metrics.overdueReminders}
              />
            </div>
          </div>
        </div>
      </header>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <PartnerChartMetric
          label="Total Leads"
          value={metrics.totalLeads}
          helper={`${safeInquiries.length} inquiries · ${safeAppointments.length} appointments`}
          icon={Target}
          tone="navy"
          badge="CRM Scope"
        />

        <PartnerChartMetric
          label="High Value"
          value={metrics.totalHighValue}
          helper="VIP and high-priority CRM records."
          icon={Crown}
          tone={metrics.totalHighValue ? "amber" : "green"}
          badge="Priority"
        />

        <PartnerChartMetric
          label="Assignment"
          value={`${metrics.assignmentRate}%`}
          helper={`${metrics.assigned}/${metrics.totalLeads} leads have ownership.`}
          icon={UserRoundCheck}
          tone={metrics.assignmentRate >= 80 ? "green" : "blue"}
          badge="Ownership"
        />

        <PartnerChartMetric
          label="Overdue Follow-Ups"
          value={metrics.overdueReminders}
          helper="Reminder records currently past their due date."
          icon={AlertTriangle}
          tone={metrics.overdueReminders ? "red" : "green"}
          badge="Pressure"
        />
      </div>

      {!hasChartData ? (
        <div className="rounded-[1.5rem] border-[3px] border-dashed border-[#F97316] bg-white p-9 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border-2 border-[#F97316] bg-[#FFF4EA]">
            <BarChart3 className="h-7 w-7 text-orange-700" />
          </div>

          <h3 className="mt-4 text-lg font-black text-[#10233F]">
            CRM charts are waiting for evidence
          </h3>

          <p className="mx-auto mt-2 max-w-xl text-sm font-semibold leading-6 text-slate-600">
            Inquiries, appointments and follow-up reminders will activate this
            visual intelligence workspace.
          </p>
        </div>
      ) : (
        <section className="rounded-[1.5rem] border-[3px] border-[#C9D7E6] bg-white p-4 sm:p-5">
          <div className="mb-4 flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.11em] text-orange-700">
                Chart Command
              </p>

              <h3 className="mt-1 text-xl font-black text-[#10233F]">
                CRM visual evidence portfolio
              </h3>

              <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">
                All existing Recharts visualizations now sit inside one
                consistent operating workspace.
              </p>
            </div>

            <span className="inline-flex w-fit rounded-full border-2 border-[#C9D7E6] bg-[#FFF8EF] px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.09em] text-slate-600">
              {trendWindow}-day active window
            </span>
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            {chartCards.map((chart, index) => {
              const Icon = chart.icon;

              return (
                <motion.article
                  key={chart.title}
                  initial={reduceMotion ? false : { opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: reduceMotion ? 0 : 0.24,
                    delay: reduceMotion ? 0 : index * 0.035,
                  }}
                  className="min-w-0 overflow-hidden rounded-[1.4rem] border-[3px] border-[#C9D7E6] bg-[#FFFDF8]"
                >
                  <div className="flex min-w-0 items-start justify-between gap-3 border-b-[3px] border-[#F97316] bg-[#123865] p-4 text-white">
                    <div className="min-w-0">
                      <p className="text-[8px] font-black uppercase tracking-[0.1em] text-orange-300">
                        CRM Chart
                      </p>

                      <h4 className="mt-1 break-words text-base font-black text-white">
                        {chart.title}
                      </h4>

                      <p className="mt-1 break-words text-xs font-semibold leading-5 text-slate-200">
                        {chart.subtitle}
                      </p>
                    </div>

                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border-2 border-white/20 bg-white/10 text-orange-200">
                      <Icon size={17} />
                    </div>
                  </div>

                  <div className="min-w-0 overflow-hidden bg-[#FFF8EF] p-2 sm:p-3">
                    {chart.content}
                  </div>
                </motion.article>
              );
            })}
          </div>
        </section>
      )}

      <div className="grid gap-3 lg:grid-cols-3">
        <ChartIntegrityCard
          icon={CheckCircle2}
          eyebrow="Appointment Evidence"
          title={`${metrics.appointmentCompletionRate}% completion`}
          helper="Completed consultations divided by tracked appointments."
          tone="green"
        />

        <ChartIntegrityCard
          icon={ShieldCheck}
          eyebrow="Reminder Evidence"
          title={`${metrics.reminderCompletionRate}% completion`}
          helper={`${metrics.overdueReminders} overdue reminder record${metrics.overdueReminders === 1 ? "" : "s"} remain visible.`}
          tone={metrics.overdueReminders ? "amber" : "green"}
        />

        <ChartIntegrityCard
          icon={CalendarDays}
          eyebrow="Strongest Activity Day"
          title={metrics.strongestDay?.day || "No activity yet"}
          helper={
            metrics.strongestDay
              ? `${metrics.strongestDay.total} CRM records in the active window.`
              : "Activity evidence will appear after dated CRM records exist."
          }
          tone="blue"
        />
      </div>
    </motion.section>
  );
}


function ChartHeroMetric({ label, value }) {
  return (
    <div className="rounded-xl border-2 border-white/25 bg-white/10 p-3">
      <p className="text-[8px] font-black uppercase tracking-[0.1em] text-orange-50">
        {label}
      </p>
      <p className="mt-1 text-lg font-black text-white">{value}</p>
    </div>
  );
}

function PartnerChartMetric({
  label,
  value,
  helper,
  icon: Icon,
  tone = "blue",
  badge = "",
}) {
  const tones = {
    navy: "border-[#123865] bg-[#123865]",
    blue: "border-[#60A5FA] bg-[#F2F7FF]",
    green: "border-[#34D399] bg-[#F0FFF8]",
    amber: "border-[#F59E0B] bg-[#FFF8E8]",
    red: "border-[#FB7185] bg-[#FFF4F4]",
  };

  const dark = tone === "navy";

  return (
    <article
      className={`flex min-h-[176px] h-full flex-col justify-between rounded-[1.4rem] border-[3px] p-4 shadow-[0_7px_20px_rgba(15,35,63,0.05)] ${
        tones[tone] || tones.blue
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p
            className={`text-[9px] font-black uppercase tracking-[0.11em] ${
              dark ? "text-orange-300" : "text-slate-500"
            }`}
          >
            {label}
          </p>

          <p
            className={`mt-2 break-words text-2xl font-black ${
              dark ? "text-white" : "text-[#10233F]"
            }`}
          >
            {value}
          </p>
        </div>

        <div
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border-2 ${
            dark
              ? "border-white/20 bg-white/10 text-orange-200"
              : "border-[#123865]/15 bg-white text-[#123865]"
          }`}
        >
          <Icon size={16} />
        </div>
      </div>

      <div>
        <p
          className={`mt-4 text-xs font-semibold leading-5 ${
            dark ? "text-slate-200" : "text-slate-600"
          }`}
        >
          {helper}
        </p>

        {badge ? (
          <span
            className={`mt-3 inline-flex rounded-full border-2 px-2.5 py-1 text-[8px] font-black uppercase tracking-[0.08em] ${
              dark
                ? "border-white/20 bg-white/10 text-white"
                : "border-[#C9D7E6] bg-white text-slate-600"
            }`}
          >
            {badge}
          </span>
        ) : null}
      </div>
    </article>
  );
}

function ChartIntegrityCard({
  icon: Icon,
  eyebrow,
  title,
  helper,
  tone = "blue",
}) {
  const tones = {
    green: "border-[#34D399] bg-[#F0FFF8]",
    blue: "border-[#60A5FA] bg-[#F2F7FF]",
    amber: "border-[#F59E0B] bg-[#FFF8E8]",
  };

  return (
    <div className={`rounded-[1.35rem] border-[3px] p-4 ${tones[tone]}`}>
      <div className="flex items-start gap-3">
        <Icon size={17} className="mt-0.5 shrink-0 text-[#123865]" />
        <div>
          <p className="text-[8px] font-black uppercase tracking-[0.11em] text-slate-500">
            {eyebrow}
          </p>
          <p className="mt-1 font-black text-[#10233F]">{title}</p>
          <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">
            {helper}
          </p>
        </div>
      </div>
    </div>
  );
}

function MetricPill({
  label,
  value,
  helper,
  icon: Icon,
  tone = "orange",
}) {
  const dark = tone === "navy";

  const style =
    tone === "good"
      ? "border-emerald-300 bg-emerald-50"
      : tone === "warning"
      ? "border-amber-300 bg-amber-50"
      : tone === "risk"
      ? "border-red-300 bg-red-50"
      : tone === "navy"
      ? "border-[#123865] bg-[#123865]"
      : "border-orange-300 bg-orange-50";

  return (
    <div
      className={`rounded-[1.35rem] border-[3px] p-4 shadow-[0_6px_18px_rgba(15,35,63,0.035)] ${style}`}
      style={{ color: dark ? "#FFFFFF" : "#10233F" }}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p
            className="text-[9px] font-black uppercase tracking-[0.1em]"
            style={{ color: dark ? "#FDBA74" : "#64748B" }}
          >
            {label}
          </p>

          <h3
            className="mt-2 text-2xl font-black"
            style={{ color: dark ? "#FFFFFF" : "#10233F" }}
          >
            {value}
          </h3>
        </div>

        <Icon
          size={18}
          style={{ color: dark ? "#FDBA74" : "#C2410C" }}
        />
      </div>

      <p
        className="mt-2 text-xs font-semibold leading-5"
        style={{ color: dark ? "#F8FAFC" : "#64748B" }}
      >
        {helper}
      </p>
    </div>
  );
}

function EmptyChartState({ text }) {
  return (
    <div className="flex h-[280px] flex-col items-center justify-center rounded-[1.3rem] border-2 border-dashed border-slate-300 bg-white text-center">
      <BarChart3 className="h-8 w-8 text-orange-600" />

      <p className="mt-3 text-sm font-semibold text-slate-600">
        {text}
      </p>
    </div>
  );
}

function LuxuryTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-xl border-2 border-orange-300 bg-white px-4 py-3 shadow-[0_14px_36px_rgba(15,35,63,0.15)]">
      {label ? (
        <p className="text-[9px] font-black uppercase tracking-[0.1em] text-orange-700">
          {label}
        </p>
      ) : null}

      <div className="mt-2 space-y-1">
        {payload.map((item, index) => (
          <p
            key={`${item.name || item.dataKey || "metric"}-${index}`}
            className="text-xs font-semibold text-slate-700"
          >
            {item.name || item.dataKey}:{" "}
            <span className="font-black text-[#10233f]">
              {safeNumber(item.value)}
            </span>
          </p>
        ))}
      </div>
    </div>
  );
}

export default LuxuryAnalyticsCharts;
