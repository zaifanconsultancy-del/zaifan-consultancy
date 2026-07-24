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
    <section className="space-y-5">
      <div className="overflow-hidden rounded-[2rem] border-[3px] border-orange-300 bg-white shadow-[0_16px_42px_rgba(15,35,63,0.06)]">
        <div className="grid xl:grid-cols-[1.25fr_0.75fr]">
          <div
            className="bg-[#123865] p-5 sm:p-6"
            style={{ color: "#FFFFFF" }}
          >
            <div className="inline-flex items-center gap-2 rounded-full border-2 border-white/25 bg-white/10 px-3 py-1.5">
              <Crown size={13} style={{ color: "#FDBA74" }} />

              <p
                className="text-[9px] font-black uppercase tracking-[0.1em]"
                style={{ color: "#FFFFFF" }}
              >
                Executive Analytics
              </p>
            </div>

            <h2
              className="mt-3 text-2xl font-black tracking-tight sm:text-3xl"
              style={{ color: "#FFFFFF" }}
            >
              CRM Intelligence Charts
            </h2>

            <p
              className="mt-2 max-w-3xl text-sm font-semibold leading-6"
              style={{ color: "#F8FAFC" }}
            >
              Visual operating view for lead growth, conversion movement,
              appointment flow, priority distribution, ownership, and follow-up
              performance.
            </p>

            <div className="mt-5 flex flex-wrap gap-2">
              {TREND_WINDOWS.map((days) => (
                <button
                  key={days}
                  type="button"
                  onClick={() => setTrendWindow(days)}
                  className={`rounded-xl border-2 px-4 py-2 text-xs font-black transition ${
                    trendWindow === days
                      ? "border-orange-300 bg-orange-500 text-white"
                      : "border-white/25 bg-white/10 text-white hover:bg-white/15"
                  }`}
                >
                  {days} Days
                </button>
              ))}
            </div>
          </div>

          <div className="bg-orange-500 p-5 sm:p-6" style={{ color: "#FFFFFF" }}>
            <div className="flex items-center gap-2">
              <CircleGauge size={18} />

              <p className="text-[9px] font-black uppercase tracking-[0.1em] text-white">
                CRM Snapshot
              </p>
            </div>

            <p className="mt-3 text-4xl font-black text-white">
              {metrics.conversionRate}%
            </p>

            <p className="mt-1 text-xs font-black uppercase tracking-[0.08em] text-white">
              Inquiry Conversion
            </p>

            <p className="mt-4 text-xs font-semibold leading-5 text-white">
              {metrics.convertedLeads} converted inquiry record
              {metrics.convertedLeads === 1 ? "" : "s"} from{" "}
              {safeInquiries.length} total inquiries.
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricPill
          label="Total Leads"
          value={metrics.totalLeads}
          helper={`${safeInquiries.length} inquiries · ${safeAppointments.length} appointments`}
          icon={Target}
          tone="orange"
        />

        <MetricPill
          label="High Value"
          value={metrics.totalHighValue}
          helper="VIP + high-priority leads"
          icon={Crown}
          tone="navy"
        />

        <MetricPill
          label="Assignment"
          value={`${metrics.assignmentRate}%`}
          helper={`${metrics.assigned}/${metrics.totalLeads} leads owned`}
          icon={UserRoundCheck}
          tone={metrics.assignmentRate >= 80 ? "good" : "warning"}
        />

        <MetricPill
          label="Overdue"
          value={metrics.overdueReminders}
          helper="Follow-ups requiring attention"
          icon={AlertTriangle}
          tone={metrics.overdueReminders ? "risk" : "good"}
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricPill
          label="Appointment Completion"
          value={`${metrics.appointmentCompletionRate}%`}
          helper="Completed consultations"
          icon={CheckCircle2}
          tone="good"
        />

        <MetricPill
          label="Reminder Completion"
          value={`${metrics.reminderCompletionRate}%`}
          helper="Completed follow-up reminders"
          icon={ShieldCheck}
          tone="orange"
        />

        <MetricPill
          label="Strongest Day"
          value={metrics.strongestDay?.day || "—"}
          helper={
            metrics.strongestDay
              ? `${metrics.strongestDay.total} total CRM records`
              : "No activity yet"
          }
          icon={CalendarDays}
          tone="navy"
        />

        <MetricPill
          label="Trend Window"
          value={`${trendWindow}D`}
          helper="Current chart analysis period"
          icon={TrendingUp}
          tone="orange"
        />
      </div>

      {!hasChartData ? (
        <div
          className={`${cardClass} rounded-[2rem] border-[3px] border-orange-300 bg-white p-8 text-center shadow-[0_10px_28px_rgba(15,35,63,0.05)]`}
        >
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border-2 border-orange-300 bg-orange-50">
            <BarChart3 className="h-7 w-7 text-orange-700" />
          </div>

          <h3 className="mt-4 text-lg font-black text-[#10233f]">
            Charts will appear when CRM data grows
          </h3>

          <p className="mx-auto mt-2 max-w-xl text-sm font-semibold leading-6 text-slate-600">
            Add inquiries, appointments, and reminders to activate the full
            analytics visualization layer.
          </p>
        </div>
      ) : (
        <div className="grid gap-5 xl:grid-cols-2">
          {chartCards.map((chart, index) => {
            const Icon = chart.icon;

            return (
              <motion.article
                key={chart.title}
                initial={reduceMotion ? false : { opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: reduceMotion ? 0 : 0.3,
                  delay: reduceMotion ? 0 : index * 0.04,
                }}
                className={`${cardClass} group relative overflow-hidden rounded-[1.8rem] border-[3px] border-slate-300 bg-white p-5 shadow-[0_8px_24px_rgba(15,35,63,0.04)] transition duration-300 hover:-translate-y-0.5 hover:border-orange-400 sm:p-6`}
              >
                <div className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-transparent via-orange-500 to-transparent opacity-0 transition duration-300 group-hover:opacity-100" />

                <div className="mb-5 flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-[0.1em] text-orange-700">
                      CRM Chart
                    </p>

                    <h3 className="mt-2 text-lg font-black text-[#10233f]">
                      {chart.title}
                    </h3>

                    <p className="mt-1 text-sm font-semibold leading-6 text-slate-600">
                      {chart.subtitle}
                    </p>
                  </div>

                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border-2 border-orange-300 bg-orange-50">
                    <Icon className="h-5 w-5 text-orange-700" />
                  </div>
                </div>

                <div className="overflow-hidden rounded-[1.4rem] border-2 border-slate-300 bg-[#fffaf2] p-2 sm:p-3">
                  {chart.content}
                </div>
              </motion.article>
            );
          })}
        </div>
      )}
    </section>
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
