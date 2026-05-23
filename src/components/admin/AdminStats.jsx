import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";

function AnimatedNumber({ value }) {
  const motionValue = useMotionValue(0);
  const springValue = useSpring(motionValue, {
    duration: 1200,
    bounce: 0,
  });

  const rounded = useTransform(springValue, (latest) => Math.round(latest));

  motionValue.set(value);

  return <motion.span>{rounded}</motion.span>;
}

function AdminStats({
  cardClass,
  inquiries,
  inquiryNewCount,
  inquiryContactedCount,
  appointments,
  appointmentPendingCount,
  appointmentConfirmedCount,
  appointmentCompletedCount,
  appointmentCancelledCount,
}) {
  const totalAppointments = appointments.length || 1;

  const stats = [
    {
      label: "Total Inquiries",
      value: inquiries.length,
      color: "text-[#D4AF37]",
      description: `${inquiryNewCount} new · ${inquiryContactedCount} contacted`,
      progress:
        inquiries.length === 0
          ? 0
          : Math.round((inquiryContactedCount / inquiries.length) * 100),
      progressLabel: "Contact rate",
    },
    {
      label: "Appointments",
      value: appointments.length,
      color: "text-[#D4AF37]",
      description: `${appointmentPendingCount} pending bookings`,
      progress: Math.round((appointmentPendingCount / totalAppointments) * 100),
      progressLabel: "Pending ratio",
    },
    {
      label: "Confirmed",
      value: appointmentConfirmedCount,
      color: "text-green-400",
      description: "Ready for consultation",
      progress: Math.round(
        (appointmentConfirmedCount / totalAppointments) * 100
      ),
      progressLabel: "Confirm rate",
    },
    {
      label: "Completed",
      value: appointmentCompletedCount,
      color: "text-white",
      description: `${appointmentCancelledCount} cancelled`,
      progress: Math.round(
        (appointmentCompletedCount / totalAppointments) * 100
      ),
      progressLabel: "Completion rate",
    },
  ];

  return (
    <div className="mb-6 grid gap-4 md:grid-cols-2 2xl:grid-cols-4">
      {stats.map((stat, index) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.4,
            delay: index * 0.06,
          }}
          className={`${cardClass} p-5`}
        >
          <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent opacity-60"></div>

          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[10px] uppercase tracking-[0.28em] text-gray-500">
                {stat.label}
              </p>

              <h2 className={`mt-3 text-4xl font-black leading-none ${stat.color}`}>
                <AnimatedNumber value={stat.value} />
              </h2>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs text-gray-400">
              {stat.progress}%
            </div>
          </div>

          <p className="mt-3 text-sm text-gray-400">{stat.description}</p>

          <div className="mt-4">
            <div className="mb-2 flex items-center justify-between text-[11px] text-gray-500">
              <span>{stat.progressLabel}</span>
              <span>{stat.progress}%</span>
            </div>

            <div className="h-2 overflow-hidden rounded-full bg-white/10">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${stat.progress}%` }}
                transition={{ duration: 0.8, delay: 0.15 }}
                className="h-full rounded-full bg-[#D4AF37]"
              ></motion.div>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

export default AdminStats;