import { motion } from "framer-motion";

function ActivityTimeline({ cardClass, inquiries, appointments }) {
  const activities = [
    ...inquiries.slice(0, 4).map((inquiry) => ({
      id: `inquiry-${inquiry.id}`,
      type: "Inquiry",
      name: inquiry.full_name || "Unknown Student",
      detail: inquiry.country || inquiry.field_of_interest || "New inquiry received",
      date: inquiry.created_at,
      icon: "📨",
      style: "border-[#D4AF37]/20 bg-[#D4AF37]/10 text-[#D4AF37]",
    })),
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
    <div className={`${cardClass} mb-6 p-5`}>
      <div className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent opacity-60"></div>

      <div className="mb-5 flex items-center justify-between gap-4">
        <div>
          <p className="text-[10px] uppercase tracking-[0.32em] text-gray-500">
            Live CRM Feed
          </p>

          <h2 className="mt-2 text-2xl font-bold text-white">
            Recent Activity
          </h2>
        </div>

        <div className="rounded-2xl border border-[#D4AF37]/20 bg-[#D4AF37]/10 px-4 py-2 text-xs font-semibold text-[#D4AF37]">
          {activities.length} Updates
        </div>
      </div>

      {activities.length === 0 ? (
        <div className="rounded-[1.3rem] border border-white/10 bg-white/[0.03] p-6 text-center">
          <p className="text-sm text-gray-400">
            No recent activity yet. New inquiries and appointments will appear here.
          </p>
        </div>
      ) : (
        <div className="grid gap-3 xl:grid-cols-2">
          {activities.map((activity, index) => (
            <motion.div
              key={activity.id}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.35,
                delay: index * 0.05,
              }}
              className="flex items-center gap-4 rounded-[1.3rem] border border-white/10 bg-white/[0.03] p-4 transition duration-500 hover:border-[#D4AF37]/30 hover:bg-white/[0.05]"
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-[#050505] text-lg">
                {activity.icon}
              </div>

              <div className="min-w-0 flex-1">
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <span
                    className={`rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] ${activity.style}`}
                  >
                    {activity.type}
                  </span>

                  <span className="text-[11px] text-gray-500">
                    {formatDate(activity.date)}
                  </span>
                </div>

                <h3 className="truncate text-sm font-bold text-white">
                  {activity.name}
                </h3>

                <p className="mt-1 truncate text-xs text-gray-400">
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