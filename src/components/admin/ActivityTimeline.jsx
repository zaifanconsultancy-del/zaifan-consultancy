import { motion } from "framer-motion";

function ActivityTimeline({ cardClass, inquiries, appointments }) {
  const priorityStyles = {
    vip: "border-purple-400/30 bg-purple-500/10 text-purple-300",
    high: "border-red-400/30 bg-red-500/10 text-red-300",
    medium: "border-[#D4AF37]/30 bg-[#D4AF37]/10 text-[#D4AF37]",
    low: "border-white/10 bg-white/[0.04] text-gray-400",
  };

  const activities = [
    ...inquiries.slice(0, 4).map((inquiry) => {
      const priority = inquiry.priority || "low";

      return {
        id: `inquiry-${inquiry.id}`,
        type: "Inquiry",
        priority,
        name: inquiry.full_name || "Unknown Student",
        detail:
          inquiry.country || inquiry.field_of_interest || "New inquiry received",
        date: inquiry.created_at,
        icon: priority === "vip" ? "👑" : priority === "high" ? "🔥" : "📨",
        style: "border-[#D4AF37]/20 bg-[#D4AF37]/10 text-[#D4AF37]",
        priorityStyle: priorityStyles[priority] || priorityStyles.low,
      };
    }),

    ...appointments.slice(0, 4).map((appointment) => ({
      id: `appointment-${appointment.id}`,
      type: "Appointment",
      name: appointment.full_name || "Unknown Student",
      detail:
        appointment.appointment_date && appointment.appointment_time
          ? `${appointment.appointment_date} · ${appointment.appointment_time}`
          : appointment.consultation_type || "New appointment booked",
      date: appointment.created_at,
      icon: "📅",
      style: "border-green-500/20 bg-green-500/10 text-green-400",
    })),
  ]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 6);

  const formatDate = (date) => {
    if (!date) return "No date";

    return new Date(date).toLocaleString("en-PK", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  return (
    <div className={`${cardClass} mb-5 p-4 sm:p-5 xl:mb-6`}>
      <div className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent opacity-60"></div>

      <div className="mb-4 flex items-center justify-between gap-3 sm:mb-5 sm:gap-4">
        <div className="min-w-0">
          <p className="text-[9px] uppercase tracking-[0.22em] text-gray-500 sm:text-[10px] sm:tracking-[0.32em]">
            Live CRM Feed
          </p>

          <h2 className="mt-2 text-xl font-bold text-white sm:text-2xl">
            Recent Activity
          </h2>
        </div>

        <div className="shrink-0 rounded-xl border border-[#D4AF37]/20 bg-[#D4AF37]/10 px-3 py-2 text-[11px] font-semibold text-[#D4AF37] sm:rounded-2xl sm:px-4 sm:text-xs">
          {activities.length} Updates
        </div>
      </div>

      {activities.length === 0 ? (
        <div className="rounded-[1.2rem] border border-white/10 bg-white/[0.03] p-5 text-center sm:rounded-[1.3rem] sm:p-6">
          <p className="text-xs leading-relaxed text-gray-400 sm:text-sm">
            No recent activity yet. New inquiries and appointments will appear here.
          </p>
        </div>
      ) : (
        <div className="grid gap-2.5 sm:gap-3 xl:grid-cols-2">
          {activities.map((activity, index) => (
            <motion.div
              key={activity.id}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.35,
                delay: index * 0.05,
              }}
              className="flex items-center gap-3 rounded-[1.1rem] border border-white/10 bg-white/[0.03] p-3 transition duration-500 hover:border-[#D4AF37]/30 hover:bg-white/[0.05] sm:gap-4 sm:rounded-[1.3rem] sm:p-4"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-[#050505] text-base sm:h-11 sm:w-11 sm:rounded-2xl sm:text-lg">
                {activity.icon}
              </div>

              <div className="min-w-0 flex-1">
                <div className="mb-1.5 flex flex-wrap items-center gap-1.5 sm:mb-2 sm:gap-2">
                  <span
                    className={`rounded-full border px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.12em] sm:px-3 sm:text-[10px] sm:tracking-[0.18em] ${activity.style}`}
                  >
                    {activity.type}
                  </span>

                  {activity.priority && (
                    <span
                      className={`rounded-full border px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.12em] sm:px-3 sm:text-[10px] sm:tracking-[0.18em] ${activity.priorityStyle}`}
                    >
                      {activity.priority}
                    </span>
                  )}

                  <span className="text-[10px] text-gray-500 sm:text-[11px]">
                    {formatDate(activity.date)}
                  </span>
                </div>

                <h3 className="truncate text-sm font-bold text-white">
                  {activity.name}
                </h3>

                <p className="mt-0.5 truncate text-xs text-gray-400 sm:mt-1">
                  {activity.detail}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

export default ActivityTimeline;