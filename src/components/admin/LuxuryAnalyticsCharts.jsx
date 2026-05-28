import { motion } from "framer-motion";
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
  BarChart3,
  Crown,
  LineChart as LineChartIcon,
  PieChart as PieChartIcon,
  TrendingUp,
} from "lucide-react";

function LuxuryAnalyticsCharts({
  cardClass = "",
  inquiries = [],
  appointments = [],
  followUpReminders = [],
}) {
  const safeInquiries = Array.isArray(inquiries) ? inquiries : [];
  const safeAppointments = Array.isArray(appointments) ? appointments : [];
  const safeReminders = Array.isArray(followUpReminders)
    ? followUpReminders
    : [];

  const getDateKey = (value) => {
    if (!value) return "Unknown";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return "Unknown";

    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  const lastSevenDays = Array.from({ length: 7 }).map((_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - index));

    return {
      raw: date,
      label: date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
    };
  });

  const dailyLeadTrend = lastSevenDays.map((day) => {
    const inquiriesCount = safeInquiries.filter(
      (item) => getDateKey(item.created_at) === day.label
    ).length;

    const appointmentsCount = safeAppointments.filter(
      (item) => getDateKey(item.created_at) === day.label
    ).length;

    return {
      day: day.label,
      inquiries: inquiriesCount,
      appointments: appointmentsCount,
      total: inquiriesCount + appointmentsCount,
    };
  });

  const priorityData = [
    {
      name: "VIP",
      value:
        safeInquiries.filter((item) => item.priority === "vip").length +
        safeAppointments.filter((item) => item.priority === "vip").length,
    },
    {
      name: "High",
      value:
        safeInquiries.filter((item) => item.priority === "high").length +
        safeAppointments.filter((item) => item.priority === "high").length,
    },
    {
      name: "Normal",
      value:
        safeInquiries.filter(
          (item) => !item.priority || item.priority === "normal"
        ).length +
        safeAppointments.filter(
          (item) => !item.priority || item.priority === "normal"
        ).length,
    },
    {
      name: "Low",
      value:
        safeInquiries.filter((item) => item.priority === "low").length +
        safeAppointments.filter((item) => item.priority === "low").length,
    },
  ].filter((item) => item.value > 0);

  const pipelineData = [
    {
      name: "New",
      value: safeInquiries.filter(
        (item) => !item.status || item.status === "new"
      ).length,
    },
    {
      name: "Contacted",
      value: safeInquiries.filter((item) => item.status === "contacted")
        .length,
    },
    {
      name: "Interested",
      value: safeInquiries.filter((item) => item.status === "interested")
        .length,
    },
    {
      name: "Converted",
      value: safeInquiries.filter((item) => item.status === "converted")
        .length,
    },
    {
      name: "Lost",
      value: safeInquiries.filter((item) => item.status === "lost").length,
    },
  ];

  const appointmentData = [
    {
      name: "Pending",
      value: safeAppointments.filter(
        (item) => !item.status || item.status === "pending"
      ).length,
    },
    {
      name: "Confirmed",
      value: safeAppointments.filter((item) => item.status === "confirmed")
        .length,
    },
    {
      name: "Completed",
      value: safeAppointments.filter((item) => item.status === "completed")
        .length,
    },
    {
      name: "Cancelled",
      value: safeAppointments.filter((item) => item.status === "cancelled")
        .length,
    },
  ];

  const reminderData = [
    {
      name: "Pending",
      value: safeReminders.filter(
        (item) => !item.status || item.status === "pending"
      ).length,
    },
    {
      name: "Completed",
      value: safeReminders.filter((item) => item.status === "completed")
        .length,
    },
    {
      name: "Overdue",
      value: safeReminders.filter((item) => {
        if (item.status === "completed") return false;
        if (!item.due_date) return false;

        const dueDate = new Date(item.due_date);
        const now = new Date();

        return dueDate < now;
      }).length,
    },
  ];

  const totalLeads = safeInquiries.length + safeAppointments.length;
  const totalHighValue = priorityData
    .filter((item) => item.name === "VIP" || item.name === "High")
    .reduce((sum, item) => sum + item.value, 0);
  const convertedLeads = safeInquiries.filter(
    (item) => item.status === "converted"
  ).length;
  const conversionRate = safeInquiries.length
    ? Math.round((convertedLeads / safeInquiries.length) * 100)
    : 0;

  const hasChartData = totalLeads > 0 || safeReminders.length > 0;

  const chartCards = [
    {
      title: "Lead Growth Trend",
      subtitle: "Last 7 days inquiry and appointment movement",
      icon: LineChartIcon,
      content: (
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={dailyLeadTrend}>
            <defs>
              <linearGradient id="leadTrendGold" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#D4AF37" stopOpacity={0.02} />
              </linearGradient>
              <linearGradient id="leadTrendBlue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#60A5FA" stopOpacity={0.28} />
                <stop offset="95%" stopColor="#60A5FA" stopOpacity={0.02} />
              </linearGradient>
            </defs>

            <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
            <XAxis
              dataKey="day"
              stroke="rgba(255,255,255,0.35)"
              tick={{ fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              stroke="rgba(255,255,255,0.35)"
              tick={{ fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              allowDecimals={false}
            />
            <Tooltip content={<LuxuryTooltip />} />
            <Area
              type="monotone"
              dataKey="inquiries"
              stroke="#D4AF37"
              strokeWidth={3}
              fill="url(#leadTrendGold)"
              dot={{ r: 3 }}
            />
            <Area
              type="monotone"
              dataKey="appointments"
              stroke="#60A5FA"
              strokeWidth={3}
              fill="url(#leadTrendBlue)"
              dot={{ r: 3 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      ),
    },
    {
      title: "Inquiry Pipeline",
      subtitle: "Status movement across student inquiry journey",
      icon: BarChart3,
      content: (
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={pipelineData}>
            <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
            <XAxis
              dataKey="name"
              stroke="rgba(255,255,255,0.35)"
              tick={{ fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              stroke="rgba(255,255,255,0.35)"
              tick={{ fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              allowDecimals={false}
            />
            <Tooltip content={<LuxuryTooltip />} />
            <Bar dataKey="value" radius={[12, 12, 0, 0]}>
              {pipelineData.map((entry, index) => (
                <Cell
                  key={`pipeline-${entry.name}`}
                  fill={
                    ["#D4AF37", "#60A5FA", "#A78BFA", "#4ADE80", "#FB7185"][index]
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
      subtitle: "VIP, high, normal, and low-value lead spread",
      icon: PieChartIcon,
      content: priorityData.length ? (
        <ResponsiveContainer width="100%" height={260}>
          <PieChart>
            <Pie
              data={priorityData}
              dataKey="value"
              nameKey="name"
              innerRadius={62}
              outerRadius={94}
              paddingAngle={5}
            >
              {priorityData.map((entry, index) => (
                <Cell
                  key={`priority-${entry.name}`}
                  fill={
                    ["#C084FC", "#FB923C", "#D4AF37", "#94A3B8"][index]
                  }
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
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={appointmentData}>
            <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
            <XAxis
              dataKey="name"
              stroke="rgba(255,255,255,0.35)"
              tick={{ fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              stroke="rgba(255,255,255,0.35)"
              tick={{ fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              allowDecimals={false}
            />
            <Tooltip content={<LuxuryTooltip />} />
            <Line
              type="monotone"
              dataKey="value"
              stroke="#4ADE80"
              strokeWidth={3}
              dot={{ r: 5 }}
              activeDot={{ r: 7 }}
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
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={reminderData}>
            <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
            <XAxis
              dataKey="name"
              stroke="rgba(255,255,255,0.35)"
              tick={{ fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              stroke="rgba(255,255,255,0.35)"
              tick={{ fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              allowDecimals={false}
            />
            <Tooltip content={<LuxuryTooltip />} />
            <Bar dataKey="value" radius={[12, 12, 0, 0]}>
              {reminderData.map((entry, index) => (
                <Cell
                  key={`reminder-${entry.name}`}
                  fill={["#D4AF37", "#4ADE80", "#FB7185"][index]}
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
      <div className="relative overflow-hidden rounded-[2rem] border border-[#D4AF37]/15 bg-gradient-to-br from-[#D4AF37]/10 via-white/[0.035] to-black/30 p-5 backdrop-blur-2xl sm:p-6">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(212,175,55,0.12),transparent_35%)]" />

        <div className="relative flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[#D4AF37]/20 bg-[#D4AF37]/10 px-3 py-1.5">
              <Crown className="h-3.5 w-3.5 text-[#D4AF37]" />
              <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-[#D4AF37]">
                Luxury Analytics Graphs
              </p>
            </div>

            <h2 className="mt-3 text-2xl font-black tracking-tight text-white sm:text-3xl">
              Executive CRM Intelligence
            </h2>

            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-gray-400">
              Premium visual dashboard for lead growth, conversion movement,
              appointment flow, priority spread, and follow-up performance.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 xl:min-w-[520px]">
            <MetricPill label="Total Leads" value={totalLeads} />
            <MetricPill label="High Value" value={totalHighValue} />
            <MetricPill label="Conversion" value={`${conversionRate}%`} />
          </div>
        </div>
      </div>

      {!hasChartData ? (
        <div className={`${cardClass} rounded-[2rem] p-8 text-center`}>
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-[#D4AF37]/20 bg-[#D4AF37]/10">
            <BarChart3 className="h-7 w-7 text-[#D4AF37]" />
          </div>

          <h3 className="mt-4 text-lg font-black text-white">
            Charts will appear when CRM data grows
          </h3>

          <p className="mx-auto mt-2 max-w-xl text-sm leading-relaxed text-gray-400">
            Add inquiries, appointments, and reminders to activate the full
            analytics visualization layer.
          </p>
        </div>
      ) : (
        <div className="grid gap-5 xl:grid-cols-2">
          {chartCards.map((chart, index) => {
            const Icon = chart.icon;

            return (
              <motion.div
                key={chart.title}
                initial={{ opacity: 0, y: 22 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.06 }}
                className={`${cardClass} group relative overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.04] p-5 backdrop-blur-xl transition duration-500 hover:-translate-y-1 hover:border-[#D4AF37]/30 sm:p-6`}
              >
                <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent opacity-0 transition duration-500 group-hover:opacity-100" />

                <div className="mb-5 flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.26em] text-[#D4AF37]">
                      CRM Chart
                    </p>
                    <h3 className="mt-2 text-lg font-black text-white">
                      {chart.title}
                    </h3>
                    <p className="mt-1 text-sm text-gray-400">
                      {chart.subtitle}
                    </p>
                  </div>

                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-[#D4AF37]/20 bg-[#D4AF37]/10">
                    <Icon className="h-5 w-5 text-[#D4AF37]" />
                  </div>
                </div>

                <div className="rounded-[1.5rem] border border-white/10 bg-black/20 p-3">
                  {chart.content}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </section>
  );
}

function MetricPill({ label, value }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/25 p-4 backdrop-blur-xl">
      <p className="text-[9px] font-bold uppercase tracking-[0.24em] text-gray-500">
        {label}
      </p>
      <h3 className="mt-2 text-2xl font-black text-[#D4AF37]">{value}</h3>
    </div>
  );
}

function EmptyChartState({ text }) {
  return (
    <div className="flex h-[260px] flex-col items-center justify-center rounded-[1.5rem] border border-white/10 bg-black/20 text-center">
      <BarChart3 className="h-8 w-8 text-gray-500" />
      <p className="mt-3 text-sm text-gray-400">{text}</p>
    </div>
  );
}

function LuxuryTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-2xl border border-[#D4AF37]/20 bg-[#050505]/95 px-4 py-3 shadow-2xl backdrop-blur-xl">
      <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#D4AF37]">
        {label}
      </p>

      <div className="mt-2 space-y-1">
        {payload.map((item) => (
          <p key={item.name} className="text-xs font-semibold text-gray-300">
            {item.name}: <span className="text-white">{item.value}</span>
          </p>
        ))}
      </div>
    </div>
  );
}

export default LuxuryAnalyticsCharts;
