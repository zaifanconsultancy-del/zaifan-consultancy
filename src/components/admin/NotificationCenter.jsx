import { motion } from "framer-motion";

function NotificationCenter({
  cardClass,
  inquiryNewCount,
  appointmentPendingCount,
  appointmentConfirmedCount,
}) {
  const notifications = [
    {
      title: "New Inquiries",
      value: inquiryNewCount,
      text: "Need follow-up",
      icon: "📨",
      color: "text-[#D4AF37]",
    },
    {
      title: "Pending",
      value: appointmentPendingCount,
      text: "Need confirmation",
      icon: "⏳",
      color: "text-orange-300",
    },
    {
      title: "Confirmed",
      value: appointmentConfirmedCount,
      text: "Ready consultations",
      icon: "✅",
      color: "text-green-400",
    },
  ];

  return (
    <div className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:mb-6 xl:gap-4">
      {notifications.map((item, index) => (
        <motion.div
          key={item.title}
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: index * 0.06 }}
          className={`${cardClass} flex items-center gap-3 p-4 sm:gap-4 sm:p-5`}
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-lg sm:h-12 sm:w-12 sm:rounded-2xl sm:text-xl">
            {item.icon}
          </div>

          <div className="min-w-0">
            <p className="text-[9px] uppercase tracking-[0.2em] text-gray-500 sm:text-[10px] sm:tracking-[0.26em]">
              {item.title}
            </p>

            <div className="mt-1 flex flex-wrap items-end gap-x-2 gap-y-1 sm:gap-3">
              <h3
                className={`text-2xl font-black leading-none sm:text-3xl ${item.color}`}
              >
                {item.value}
              </h3>

              <p className="pb-0.5 text-[11px] text-gray-400 sm:pb-1 sm:text-xs">
                {item.text}
              </p>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

export default NotificationCenter;