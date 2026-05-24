import { motion } from "framer-motion";

function DashboardOverview({
  cardClass,
  todayInquiriesCount,
  todayAppointmentsCount,
  latestInquiry,
  latestAppointment,
}) {
  const totalToday = todayInquiriesCount + todayAppointmentsCount;

  const inquiryPercent =
    totalToday === 0 ? 0 : Math.round((todayInquiriesCount / totalToday) * 100);

  const appointmentPercent =
    totalToday === 0
      ? 0
      : Math.round((todayAppointmentsCount / totalToday) * 100);

  const chartBars = [
    { label: "Mon", value: 35 },
    { label: "Tue", value: 55 },
    { label: "Wed", value: 42 },
    { label: "Thu", value: 72 },
    { label: "Fri", value: 60 },
    { label: "Sat", value: 88 },
    { label: "Sun", value: 50 },
  ];

  const overviewCards = [
    {
      title: "Today Activity",
      value: totalToday,
      description: `${todayInquiriesCount} new inquiries · ${todayAppointmentsCount} appointments`,
      icon: "✦",
      gold: true,
      bars: [
        { label: "Inquiries", value: inquiryPercent },
        { label: "Appointments", value: appointmentPercent },
      ],
    },
    {
      title: "Latest Inquiry",
      value: latestInquiry?.full_name || "No inquiry yet",
      description: latestInquiry?.country || "Waiting for first inquiry",
      icon: "📨",
    },
    {
      title: "Latest Appointment",
      value: latestAppointment?.full_name || "No booking yet",
      description: latestAppointment
        ? `${latestAppointment.appointment_date || "No date"} · ${
            latestAppointment.appointment_time || "No time"
          }`
        : "Waiting for first appointment",
      icon: "📅",
    },
  ];

  return (
    <div className="mb-5 grid gap-3 xl:mb-6 xl:grid-cols-3 xl:gap-4">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className={`${cardClass} p-4 sm:p-5 xl:col-span-2`}
      >
        <div className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent opacity-60"></div>

        <div className="mb-4 flex items-start justify-between gap-3 sm:mb-6 sm:gap-5">
          <div className="min-w-0">
            <p className="text-[9px] uppercase tracking-[0.22em] text-gray-500 sm:text-[11px] sm:tracking-[0.35em]">
              Weekly Analytics
            </p>

            <h2 className="mt-2 text-2xl font-black text-white sm:mt-3 sm:text-3xl">
              CRM Activity Flow
            </h2>

            <p className="mt-1.5 text-xs leading-relaxed text-gray-400 sm:mt-2 sm:text-sm">
              Visual overview for recent inquiry and appointment activity.
            </p>
          </div>

          <div className="shrink-0 rounded-xl border border-[#D4AF37]/20 bg-[#D4AF37]/10 px-3 py-2 text-xs font-bold text-[#D4AF37] sm:rounded-2xl sm:px-4 sm:py-3 sm:text-sm">
            Live
          </div>
        </div>

        <div className="flex h-36 items-end gap-2 rounded-[1.2rem] border border-white/10 bg-black/20 p-4 sm:h-48 sm:gap-3 sm:rounded-[1.5rem] sm:p-5">
          {chartBars.map((bar, index) => (
            <div
              key={bar.label}
              className="flex flex-1 flex-col items-center gap-2 sm:gap-3"
            >
              <div className="flex h-24 w-full items-end rounded-full bg-white/[0.04] p-1 sm:h-32">
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${bar.value}%` }}
                  transition={{ duration: 0.7, delay: index * 0.06 }}
                  className="w-full rounded-full bg-gradient-to-t from-[#D4AF37] to-[#E7C768]"
                ></motion.div>
              </div>

              <span className="text-[10px] text-gray-500 sm:text-[11px]">
                {bar.label}
              </span>
            </div>
          ))}
        </div>
      </motion.div>

      <div className="grid gap-3 xl:gap-4">
        {overviewCards.map((card, index) => (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.45,
              delay: index * 0.08,
            }}
            className={`${cardClass} group relative p-4 sm:p-5 ${
              card.gold
                ? "border-[#D4AF37]/20 bg-gradient-to-br from-[#D4AF37]/10 to-transparent"
                : ""
            }`}
          >
            <div className="absolute inset-x-0 top-0 h-[3px] scale-x-0 bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent transition duration-500 group-hover:scale-x-100"></div>

            <div className="flex items-start justify-between gap-3 sm:gap-5">
              <div className="min-w-0">
                <p className="text-[9px] uppercase tracking-[0.22em] text-gray-500 sm:text-[10px] sm:tracking-[0.3em]">
                  {card.title}
                </p>

                <h2
                  className={`mt-2 break-words font-black leading-tight sm:mt-3 ${
                    card.gold
                      ? "text-3xl text-[#D4AF37] sm:text-4xl"
                      : "text-xl text-white sm:text-2xl"
                  }`}
                >
                  {card.value}
                </h2>

                <p className="mt-1.5 text-xs leading-relaxed text-gray-400 sm:mt-2 sm:text-sm">
                  {card.description}
                </p>
              </div>

              <div
                className={`shrink-0 rounded-xl border p-2.5 text-lg sm:rounded-2xl sm:p-3 sm:text-xl ${
                  card.gold
                    ? "border-[#D4AF37]/20 bg-[#D4AF37]/10"
                    : "border-white/10 bg-white/[0.04]"
                }`}
              >
                {card.icon}
              </div>
            </div>

            {card.bars && (
              <div className="mt-4 space-y-3 sm:mt-5 sm:space-y-4">
                {card.bars.map((bar) => (
                  <div key={bar.label}>
                    <div className="mb-1.5 flex items-center justify-between text-[11px] text-gray-500 sm:mb-2 sm:text-xs">
                      <span>{bar.label}</span>
                      <span>{bar.value}%</span>
                    </div>

                    <div className="h-1.5 overflow-hidden rounded-full bg-white/10 sm:h-2">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${bar.value}%` }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                        className="h-full rounded-full bg-[#D4AF37]"
                      ></motion.div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
}

export default DashboardOverview;