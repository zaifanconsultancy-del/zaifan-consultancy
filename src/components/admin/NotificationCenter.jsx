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
    <div className="mb-6 grid gap-4 lg:grid-cols-3">
      {notifications.map((item, index) => (
        <motion.div
          key={item.title}
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: index * 0.06 }}
          className={`${cardClass} flex items-center gap-4 p-5`}
        >
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-xl">
            {item.icon}
          </div>

          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-[0.26em] text-gray-500">
              {item.title}
            </p>

            <div className="mt-1 flex items-end gap-3">
              <h3 className={`text-3xl font-black leading-none ${item.color}`}>
                {item.value}
              </h3>

              <p className="pb-1 text-xs text-gray-400">{item.text}</p>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

export default NotificationCenter;