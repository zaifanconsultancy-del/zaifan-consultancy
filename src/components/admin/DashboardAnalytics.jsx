import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
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
        inquiries: 0,
        appointments: 0,
      };
    });

    inquiries.forEach((inquiry) => {
      if (!inquiry.created_at) return;

      const inquiryDate = new Date(inquiry.created_at);

      const matchingDay = last7Days.find(
        (item) => item.date.toDateString() === inquiryDate.toDateString()
      );

      if (matchingDay) matchingDay.inquiries += 1;
    });

    appointments.forEach((appointment) => {
      if (!appointment.created_at) return;

      const appointmentDate = new Date(appointment.created_at);

      const matchingDay = last7Days.find(
        (item) => item.date.toDateString() === appointmentDate.toDateString()
      );

      if (matchingDay) matchingDay.appointments += 1;
    });

    return last7Days.map((item) => ({
      day: item.day,
      Inquiries: item.inquiries,
      Appointments: item.appointments,
    }));
  };

  const weeklyData = getWeeklyData();

  const totalInquiries = inquiries.length;
  const totalAppointments = appointments.length;

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

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
      className={`${cardClass} mb-5 p-4 sm:p-5 xl:mb-6`}
    >
      <div className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent opacity-60"></div>

      <div className="mb-4 flex flex-col gap-4 xl:mb-6 xl:flex-row xl:items-center xl:justify-between">
        <div className="min-w-0">
          <p className="text-[9px] uppercase tracking-[0.22em] text-gray-500 sm:text-[10px] sm:tracking-[0.32em]">
            Weekly CRM Analytics
          </p>

          <h2 className="mt-2 text-xl font-bold text-white sm:text-2xl">
            Inquiry & Appointment Growth
          </h2>

          <p className="mt-1.5 text-xs leading-relaxed text-gray-400 sm:mt-2 sm:text-sm">
            Real activity trend based on the last 7 days of CRM records.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          <MiniMetric
            label="Conversion"
            value={`${conversionRate}%`}
            color="text-[#D4AF37]"
          />

          <MiniMetric
            label="Pending"
            value={pendingAppointments}
            color="text-orange-300"
          />

          <MiniMetric
            label="Confirmed"
            value={confirmedAppointments}
            color="text-green-400"
          />
        </div>
      </div>

      <div className="h-[240px] overflow-hidden rounded-[1.2rem] border border-white/10 bg-black/20 p-2 sm:h-[310px] sm:rounded-[1.5rem] sm:p-4">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={weeklyData}
            margin={{
              top: 8,
              right: 4,
              left: -24,
              bottom: 0,
            }}
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

            <Tooltip
              cursor={{ fill: "rgba(212,175,55,0.08)" }}
              contentStyle={{
                background: "#111",
                border: "1px solid rgba(212,175,55,0.25)",
                borderRadius: "16px",
                color: "#fff",
                fontSize: "12px",
              }}
              labelStyle={{ color: "#D4AF37" }}
            />

            <Legend wrapperStyle={{ fontSize: "11px" }} />

            <Bar
              dataKey="Inquiries"
              fill="#D4AF37"
              radius={[8, 8, 0, 0]}
              barSize={18}
            />

            <Bar
              dataKey="Appointments"
              fill="#22c55e"
              radius={[8, 8, 0, 0]}
              barSize={18}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}

function MiniMetric({ label, value, color }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.04] px-2.5 py-2 sm:rounded-2xl sm:px-4 sm:py-3">
      <p className="text-[8px] uppercase tracking-[0.14em] text-gray-500 sm:text-[10px] sm:tracking-[0.25em]">
        {label}
      </p>

      <p className={`mt-1 text-lg font-black sm:text-2xl ${color}`}>
        {value}
      </p>
    </div>
  );
}

export default DashboardAnalytics;