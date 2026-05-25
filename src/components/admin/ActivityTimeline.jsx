import { motion } from "framer-motion";

function ActivityTimeline({ cardClass, inquiries = [], appointments = [] }) {
  const priorityStyles = {
    vip: "border-purple-400/30 bg-purple-500/10 text-purple-300",
    high: "border-red-400/30 bg-red-500/10 text-red-300",
    medium: "border-[#D4AF37]/30 bg-[#D4AF37]/10 text-[#D4AF37]",
    low: "border-white/10 bg-white/[0.04] text-gray-400",
  };

  const statusStyles = {
    new: "border-[#D4AF37]/25 bg-[#D4AF37]/10 text-[#D4AF37]",
    contacted: "border-green-400/25 bg-green-400/10 text-green-300",
    pending: "border-orange-400/25 bg-orange-400/10 text-orange-300",
    confirmed: "border-green-400/25 bg-green-400/10 text-green-300",
    completed: "border-blue-400/25 bg-blue-400/10 text-blue-300",
    cancelled: "border-red-400/25 bg-red-400/10 text-red-300",
  };

  const inquiryActivities = inquiries.slice(0, 8).map((inquiry) => {
    const priority = inquiry.priority || "low";
    const status = inquiry.status || "new";
    const isAssigned = Boolean(inquiry.assigned_admin_name);

    return {
      id: `inquiry-${inquiry.id}`,
      type: "Inquiry",
      status,
      priority,
      name: inquiry.full_name || "Unknown Student",
      detail:
        inquiry.country || inquiry.field_of_interest || "New inquiry received",
      owner: inquiry.assigned_admin_name || "Open lead pool",
      date: inquiry.created_at,
      icon: priority === "vip" ? "👑" : priority === "high" ? "🔥" : "📨",
      style: "border-[#D4AF37]/20 bg-[#D4AF37]/10 text-[#D4AF37]",
      priorityStyle: priorityStyles[priority] || priorityStyles.low,
      statusStyle: statusStyles[status] || statusStyles.new,
      ownerStyle: isAssigned
        ? "border-cyan-400/20 bg-cyan-400/10 text-cyan-300"
        : "border-orange-400/20 bg-orange-400/10 text-orange-300",
    };
  });

  const appointmentActivities = appointments.slice(0, 8).map((appointment) => {
    const priority = appointment.priority || "low";
    const status = appointment.status || "pending";
    const isAssigned = Boolean(appointment.assigned_admin_name);

    return {
      id: `appointment-${appointment.id}`,
      type: "Appointment",
      status,
      priority,
      name: appointment.full_name || "Unknown Student",
      detail:
        appointment.appointment_date && appointment.appointment_time
          ? `${appointment.appointment_date} · ${appointment.appointment_time}`
          : appointment.consultation_type || "New appointment booked",
      owner: appointment.assigned_admin_name || "Open lead pool",
      date: appointment.created_at,
      icon:
        status === "confirmed"
          ? "✅"
          : status === "completed"
          ? "🎓"
          : status === "cancelled"
          ? "🚫"
          : "📅",
      style: "border-green-500/20 bg-green-500/10 text-green-400",
      priorityStyle: priorityStyles[priority] || priorityStyles.low,
      statusStyle: statusStyles[status] || statusStyles.pending,
      ownerStyle: isAssigned
        ? "border-cyan-400/20 bg-cyan-400/10 text-cyan-300"
        : "border-orange-400/20 bg-orange-400/10 text-orange-300",
    };
  });

  const activities = [...inquiryActivities, ...appointmentActivities]
    .sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0))
    .slice(0, 8);

  const hotLeadsCount = activities.filter(
    (activity) => activity.priority === "vip" || activity.priority === "high"
  ).length;

  const openPoolCount = activities.filter(
    (activity) => activity.owner === "Open lead pool"
  ).length;

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

      <div className="mb-4 flex flex-col gap-3 sm:mb-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <p className="text-[9px] uppercase tracking-[0.22em] text-gray-500 sm:text-[10px] sm:tracking-[0.32em]">
            Live CRM Feed
          </p>

          <h2 className="mt-2 text-xl font-bold text-white sm:text-2xl">
            Recent Activity Timeline
          </h2>

          <p className="mt-2 max-w-2xl text-xs leading-relaxed text-gray-400 sm:text-sm">
            Latest student inquiries, booked consultations, ownership movement,
            and priority signals from your CRM.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <TimelineBadge label="Updates" value={activities.length} tone="gold" />
          <TimelineBadge label="Hot" value={hotLeadsCount} tone="red" />
          <TimelineBadge label="Open" value={openPoolCount} tone="cyan" />
        </div>
      </div>

      {activities.length === 0 ? (
        <div className="rounded-[1.4rem] border border-dashed border-white/10 bg-white/[0.03] p-6 text-center sm:p-8">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-[#D4AF37]/20 bg-[#D4AF37]/10 text-2xl">
            🕒
          </div>

          <h3 className="mt-4 text-lg font-black text-white">
            No CRM activity yet
          </h3>

          <p className="mx-auto mt-2 max-w-md text-xs leading-relaxed text-gray-400 sm:text-sm">
            New inquiries and appointments will appear here once students start
            interacting with your website.
          </p>
        </div>
      ) : (
        <div className="relative">
          <div className="absolute left-5 top-3 hidden h-[calc(100%-1.5rem)] w-px bg-gradient-to-b from-[#D4AF37]/50 via-white/10 to-transparent lg:block"></div>

          <div className="grid gap-3 xl:grid-cols-2">
            {activities.map((activity, index) => (
              <motion.div
                key={activity.id}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: index * 0.05 }}
                className="group relative rounded-[1.2rem] border border-white/10 bg-white/[0.03] p-3 transition duration-500 hover:-translate-y-0.5 hover:border-[#D4AF37]/30 hover:bg-white/[0.05] sm:rounded-[1.4rem] sm:p-4"
              >
                <div className="flex gap-3 sm:gap-4">
                  <div className="relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-[#050505] text-base shadow-xl transition duration-500 group-hover:border-[#D4AF37]/30 sm:h-11 sm:w-11 sm:rounded-2xl sm:text-lg">
                    {activity.icon}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="mb-2 flex flex-wrap items-center gap-1.5 sm:gap-2">
                      <span
                        className={`rounded-full border px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.12em] sm:px-3 sm:text-[10px] sm:tracking-[0.18em] ${activity.style}`}
                      >
                        {activity.type}
                      </span>

                      <span
                        className={`rounded-full border px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.12em] sm:px-3 sm:text-[10px] sm:tracking-[0.18em] ${activity.statusStyle}`}
                      >
                        {activity.status}
                      </span>

                      <span
                        className={`rounded-full border px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.12em] sm:px-3 sm:text-[10px] sm:tracking-[0.18em] ${activity.priorityStyle}`}
                      >
                        {activity.priority}
                      </span>
                    </div>

                    <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
                      <div className="min-w-0">
                        <h3 className="truncate text-sm font-bold text-white sm:text-base">
                          {activity.name}
                        </h3>

                        <p className="mt-1 truncate text-xs text-gray-400">
                          {activity.detail}
                        </p>
                      </div>

                      <p className="shrink-0 text-[10px] text-gray-500 sm:text-right sm:text-[11px]">
                        {formatDate(activity.date)}
                      </p>
                    </div>

                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <span
                        className={`rounded-full border px-3 py-1 text-[10px] font-bold ${activity.ownerStyle}`}
                      >
                        {activity.owner}
                      </span>

                      {(activity.priority === "vip" || activity.priority === "high") && (
                        <span className="rounded-full border border-red-400/20 bg-red-400/10 px-3 py-1 text-[10px] font-bold text-red-300">
                          Needs fast follow-up
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function TimelineBadge({ label, value, tone = "gold" }) {
  const tones = {
    gold: "border-[#D4AF37]/20 bg-[#D4AF37]/10 text-[#D4AF37]",
    red: "border-red-400/20 bg-red-400/10 text-red-300",
    cyan: "border-cyan-400/20 bg-cyan-400/10 text-cyan-300",
  };

  return (
    <div
      className={`rounded-xl border px-3 py-2 text-[11px] font-semibold sm:rounded-2xl sm:px-4 sm:text-xs ${
        tones[tone] || tones.gold
      }`}
    >
      {value} {label}
    </div>
  );
}

export default ActivityTimeline;
