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

      if (matchingDay) {
        matchingDay.inquiries += 1;
      }
    });

    appointments.forEach((appointment) => {
      if (!appointment.created_at) return;

      const appointmentDate = new Date(appointment.created_at);

      const matchingDay = last7Days.find(
        (item) => item.date.toDateString() === appointmentDate.toDateString()
      );

      if (matchingDay) {
        matchingDay.appointments += 1;
      }
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
      className={`${cardClass} mb-6 p-5`}
    >
      <div className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent opacity-60"></div>

      <div className="mb-6 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-[0.32em] text-gray-500">
            Weekly CRM Analytics
          </p>

          <h2 className="mt-2 text-2xl font-bold text-white">
            Inquiry & Appointment Growth
          </h2>

          <p className="mt-2 text-sm text-gray-400">
            Real activity trend based on the last 7 days of CRM records.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
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

      <div className="h-[310px] rounded-[1.5rem] border border-white/10 bg-black/20 p-4">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={weeklyData}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(255,255,255,0.08)"
            />

            <XAxis dataKey="day" stroke="#777" fontSize={12} />
            <YAxis stroke="#777" fontSize={12} allowDecimals={false} />

            <Tooltip
              cursor={{ fill: "rgba(212,175,55,0.08)" }}
              contentStyle={{
                background: "#111",
                border: "1px solid rgba(212,175,55,0.25)",
                borderRadius: "16px",
                color: "#fff",
              }}
              labelStyle={{ color: "#D4AF37" }}
            />

            <Legend wrapperStyle={{ fontSize: "12px" }} />

            <Bar
              dataKey="Inquiries"
              fill="#D4AF37"
              radius={[10, 10, 0, 0]}
              barSize={28}
            />

            <Bar
              dataKey="Appointments"
              fill="#22c55e"
              radius={[10, 10, 0, 0]}
              barSize={28}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}

function MiniMetric({ label, value, color }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3">
      <p className="text-[10px] uppercase tracking-[0.25em] text-gray-500">
        {label}
      </p>

      <p className={`mt-1 text-2xl font-black ${color}`}>
        {value}
      </p>
    </div>
  );
}

export default DashboardAnalytics;