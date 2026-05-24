import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { motion } from "framer-motion";

function DashboardAnalytics({ cardClass, inquiries, appointments }) {
  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const getWeeklyData = () => {
    const today = new Date();

    const last7Days = [...Array(7)].map((_, index) => {
      const date = new Date(today);
      date.setDate(today.getDate() - (6 - index));

      return {
        date,
        day: weekDays[date.getDay()],
        Inquiries: 0,
        Appointments: 0,
      };
    });

    inquiries.forEach((inquiry) => {
      if (!inquiry.created_at) return;

      const inquiryDate = new Date(inquiry.created_at);

      const matchingDay = last7Days.find(
        (item) => item.date.toDateString() === inquiryDate.toDateString()
      );

      if (matchingDay) matchingDay.Inquiries += 1;
    });

    appointments.forEach((appointment) => {
      if (!appointment.created_at) return;

      const appointmentDate = new Date(appointment.created_at);

      const matchingDay = last7Days.find(
        (item) => item.date.toDateString() === appointmentDate.toDateString()
      );

      if (matchingDay) matchingDay.Appointments += 1;
    });

    return last7Days.map(({ date, ...item }) => item);
  };

  const totalInquiries = inquiries.length;
  const totalAppointments = appointments.length;
  const totalLeads = totalInquiries + totalAppointments;

  const todayDate = new Date().toDateString();

  const todayInquiries = inquiries.filter((inquiry) =>
    inquiry.created_at
      ? new Date(inquiry.created_at).toDateString() === todayDate
      : false
  ).length;

  const todayAppointments = appointments.filter((appointment) =>
    appointment.created_at
      ? new Date(appointment.created_at).toDateString() === todayDate
      : false
  ).length;

  const conversionRate =
    totalInquiries === 0
      ? 0
      : Math.round((totalAppointments / totalInquiries) * 100);

  const pendingAppointments = appointments.filter(
    (appointment) => (appointment.status || "pending") === "pending"
  ).length;

  const confirmedAppointments = appointments.filter(
    (appointment) => appointment.status === "confirmed"
  ).length;

  const completedAppointments = appointments.filter(
    (appointment) => appointment.status === "completed"
  ).length;

  const cancelledAppointments = appointments.filter(
    (appointment) => appointment.status === "cancelled"
  ).length;

  const allLeads = [...inquiries, ...appointments];

  const priorityData = [
    {
      name: "VIP",
      value: allLeads.filter((lead) => lead.priority === "vip").length,
      color: "#a855f7",
    },
    {
      name: "High",
      value: allLeads.filter((lead) => lead.priority === "high").length,
      color: "#ef4444",
    },
    {
      name: "Medium",
      value: allLeads.filter((lead) => lead.priority === "medium").length,
      color: "#D4AF37",
    },
    {
      name: "Low",
      value: allLeads.filter((lead) => (lead.priority || "low") === "low")
        .length,
      color: "#9ca3af",
    },
  ];

  const appointmentStatusData = [
    { name: "Pending", value: pendingAppointments, color: "#fb923c" },
    { name: "Confirmed", value: confirmedAppointments, color: "#22c55e" },
    { name: "Completed", value: completedAppointments, color: "#60a5fa" },
    { name: "Cancelled", value: cancelledAppointments, color: "#ef4444" },
  ];

  const weeklyData = getWeeklyData();

  const topCountries = getTopCountries(inquiries, appointments);

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
      className="space-y-5 xl:space-y-6"
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <AnalyticsCard
          label="Total Leads"
          value={totalLeads}
          icon="🚀"
          helper={`${totalInquiries} inquiries · ${totalAppointments} appointments`}
          color="text-[#D4AF37]"
          cardClass={cardClass}
        />

        <AnalyticsCard
          label="Today Activity"
          value={todayInquiries + todayAppointments}
          icon="⚡"
          helper={`${todayInquiries} inquiries · ${todayAppointments} appointments`}
          color="text-green-400"
          cardClass={cardClass}
        />

        <AnalyticsCard
          label="Conversion Rate"
          value={`${conversionRate}%`}
          icon="📈"
          helper="Appointments compared with inquiries"
          color="text-blue-400"
          cardClass={cardClass}
        />

        <AnalyticsCard
          label="VIP Leads"
          value={priorityData[0].value}
          icon="👑"
          helper="Highest priority CRM leads"
          color="text-purple-300"
          cardClass={cardClass}
        />
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.45fr_0.9fr]">
        <ChartPanel
          cardClass={cardClass}
          eyebrow="Weekly CRM Analytics"
          title="Inquiry & Appointment Growth"
          description="Real activity trend based on the last 7 days of CRM records."
        >
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={weeklyData}
              margin={{ top: 8, right: 8, left: -24, bottom: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(255,255,255,0.08)"
                vertical={false}
              />

              <XAxis
                dataKey="day"
                stroke="#777"
                fontSize={11}
                tickLine={false}
                axisLine={false}
              />

              <YAxis
                stroke="#777"
                fontSize={11}
                allowDecimals={false}
                tickLine={false}
                axisLine={false}
              />

              <Tooltip content={<CustomTooltip />} />

              <Area
                type="monotone"
                dataKey="Inquiries"
                stroke="#D4AF37"
                fill="#D4AF37"
                fillOpacity={0.18}
                strokeWidth={2}
              />

              <Area
                type="monotone"
                dataKey="Appointments"
                stroke="#22c55e"
                fill="#22c55e"
                fillOpacity={0.14}
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartPanel>

        <ChartPanel
          cardClass={cardClass}
          eyebrow="Lead Priority"
          title="Priority Distribution"
          description="Combined priority split across inquiries and appointments."
        >
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={priorityData}
                dataKey="value"
                nameKey="name"
                innerRadius={55}
                outerRadius={90}
                paddingAngle={4}
              >
                {priorityData.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Pie>

              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>

          <LegendList data={priorityData} />
        </ChartPanel>
      </div>

      <div className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
        <ChartPanel
          cardClass={cardClass}
          eyebrow="Appointments"
          title="Status Breakdown"
          description="Pipeline health for consultation bookings."
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={appointmentStatusData}
              margin={{ top: 8, right: 8, left: -24, bottom: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(255,255,255,0.08)"
                vertical={false}
              />

              <XAxis
                dataKey="name"
                stroke="#777"
                fontSize={11}
                tickLine={false}
                axisLine={false}
              />

              <YAxis
                stroke="#777"
                fontSize={11}
                allowDecimals={false}
                tickLine={false}
                axisLine={false}
              />

              <Tooltip content={<CustomTooltip />} />

              <Bar dataKey="value" radius={[10, 10, 0, 0]} barSize={36}>
                {appointmentStatusData.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartPanel>

        <div className={`${cardClass} p-5`}>
          <div className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent opacity-60"></div>

          <p className="text-[10px] uppercase tracking-[0.32em] text-gray-500">
            Country Interest
          </p>

          <h2 className="mt-2 text-2xl font-bold text-white">
            Top Student Destinations
          </h2>

          <p className="mt-2 text-sm leading-relaxed text-gray-400">
            Most requested study destinations from your CRM leads.
          </p>

          <div className="mt-5 space-y-3">
            {topCountries.length === 0 ? (
              <div className="rounded-[1.2rem] border border-dashed border-white/10 bg-black/20 p-5 text-center">
                <p className="text-sm text-gray-500">
                  No country data available yet.
                </p>
              </div>
            ) : (
              topCountries.map((country, index) => (
                <div
                  key={country.name}
                  className="rounded-[1.2rem] border border-white/10 bg-white/[0.035] p-4"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-white">
                        #{index + 1} {country.name}
                      </p>

                      <p className="mt-1 text-xs text-gray-500">
                        {country.value} interested lead
                        {country.value === 1 ? "" : "s"}
                      </p>
                    </div>

                    <span className="rounded-full border border-[#D4AF37]/25 bg-[#D4AF37]/10 px-3 py-1 text-xs font-bold text-[#D4AF37]">
                      {country.percent}%
                    </span>
                  </div>

                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
                    <div
                      className="h-full rounded-full bg-[#D4AF37]"
                      style={{ width: `${country.percent}%` }}
                    ></div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function AnalyticsCard({ label, value, icon, helper, color, cardClass }) {
  return (
    <div className={`${cardClass} p-5`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] uppercase tracking-[0.24em] text-gray-500">
            {label}
          </p>

          <h3 className={`mt-3 text-3xl font-black ${color}`}>{value}</h3>

          <p className="mt-2 text-xs leading-relaxed text-gray-400">{helper}</p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-2xl">
          {icon}
        </div>
      </div>
    </div>
  );
}

function ChartPanel({ cardClass, eyebrow, title, description, children }) {
  return (
    <div className={`${cardClass} p-5`}>
      <div className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent opacity-60"></div>

      <div className="mb-5">
        <p className="text-[10px] uppercase tracking-[0.32em] text-gray-500">
          {eyebrow}
        </p>

        <h2 className="mt-2 text-2xl font-bold text-white">{title}</h2>

        <p className="mt-2 text-sm leading-relaxed text-gray-400">
          {description}
        </p>
      </div>

      <div className="h-[280px] overflow-hidden rounded-[1.5rem] border border-white/10 bg-black/20 p-3">
        {children}
      </div>
    </div>
  );
}

function LegendList({ data }) {
  return (
    <div className="mt-4 grid grid-cols-2 gap-2">
      {data.map((item) => (
        <div
          key={item.name}
          className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.035] px-3 py-2"
        >
          <div className="flex items-center gap-2">
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: item.color }}
            ></span>

            <span className="text-xs font-medium text-gray-300">
              {item.name}
            </span>
          </div>

          <span className="text-xs font-bold text-white">{item.value}</span>
        </div>
      ))}
    </div>
  );
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload || payload.length === 0) return null;

  return (
    <div className="rounded-2xl border border-[#D4AF37]/25 bg-[#111111] px-4 py-3 text-xs shadow-2xl">
      {label && (
        <p className="mb-2 font-semibold text-[#D4AF37]">{label}</p>
      )}

      <div className="space-y-1">
        {payload.map((item) => (
          <p key={item.name} className="text-gray-300">
            {item.name}:{" "}
            <span className="font-bold text-white">{item.value}</span>
          </p>
        ))}
      </div>
    </div>
  );
}

function getTopCountries(inquiries, appointments) {
  const countryMap = {};

  inquiries.forEach((inquiry) => {
    const country = inquiry.country || "Unknown";
    countryMap[country] = (countryMap[country] || 0) + 1;
  });

  appointments.forEach((appointment) => {
    const country = appointment.country_interest || "Unknown";
    countryMap[country] = (countryMap[country] || 0) + 1;
  });

  const total = Object.values(countryMap).reduce((sum, value) => sum + value, 0);

  return Object.entries(countryMap)
    .map(([name, value]) => ({
      name,
      value,
      percent: total === 0 ? 0 : Math.round((value / total) * 100),
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);
}

export default DashboardAnalytics;