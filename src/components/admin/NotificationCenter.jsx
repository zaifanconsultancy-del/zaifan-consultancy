import { motion } from "framer-motion";

function NotificationCenter({
  cardClass,
  inquiryNewCount = 0,
  appointmentPendingCount = 0,
  appointmentConfirmedCount = 0,
  inquiryHighCount = 0,
  inquiryVipCount = 0,
  appointmentHighCount = 0,
  appointmentVipCount = 0,
  assignedLeadsCount = 0,
  unassignedLeadsCount = 0,
  todayActivityCount = 0,
  role = "staff",
  permissions = {},
}) {
  const urgentPriorityCount =
    inquiryVipCount + inquiryHighCount + appointmentVipCount + appointmentHighCount;

  const hasAdvancedData =
    urgentPriorityCount > 0 || assignedLeadsCount > 0 || unassignedLeadsCount > 0 || todayActivityCount > 0;

  const notifications = [
    {
      title: "New Inquiries",
      value: inquiryNewCount,
      text: inquiryNewCount === 1 ? "Needs follow-up" : "Need follow-up",
      icon: "📨",
      color: "text-[#D4AF37]",
      border: inquiryNewCount > 0 ? "border-[#D4AF37]/25" : "border-white/10",
      bg: inquiryNewCount > 0 ? "bg-[#D4AF37]/10" : "bg-white/[0.04]",
      pulse: inquiryNewCount > 0,
    },
    {
      title: "Pending Appointments",
      value: appointmentPendingCount,
      text: appointmentPendingCount === 1 ? "Needs confirmation" : "Need confirmation",
      icon: "⏳",
      color: "text-orange-300",
      border: appointmentPendingCount > 0 ? "border-orange-400/25" : "border-white/10",
      bg: appointmentPendingCount > 0 ? "bg-orange-400/10" : "bg-white/[0.04]",
      pulse: appointmentPendingCount > 0,
    },
    {
      title: "Confirmed",
      value: appointmentConfirmedCount,
      text: appointmentConfirmedCount === 1 ? "Ready consultation" : "Ready consultations",
      icon: "✅",
      color: "text-green-400",
      border: appointmentConfirmedCount > 0 ? "border-green-400/25" : "border-white/10",
      bg: appointmentConfirmedCount > 0 ? "bg-green-400/10" : "bg-white/[0.04]",
      pulse: false,
    },
    {
      title: "Urgent Priority",
      value: urgentPriorityCount,
      text:
        urgentPriorityCount === 1
          ? "VIP/high lead waiting"
          : "VIP/high leads waiting",
      icon: "👑",
      color: "text-purple-300",
      border: urgentPriorityCount > 0 ? "border-purple-400/25" : "border-white/10",
      bg: urgentPriorityCount > 0 ? "bg-purple-400/10" : "bg-white/[0.04]",
      pulse: urgentPriorityCount > 0,
      advancedOnly: true,
    },
    {
      title: "Open Lead Pool",
      value: unassignedLeadsCount,
      text:
        unassignedLeadsCount === 1
          ? "Lead still unassigned"
          : "Leads still unassigned",
      icon: "🧭",
      color: "text-cyan-300",
      border: unassignedLeadsCount > 0 ? "border-cyan-400/25" : "border-white/10",
      bg: unassignedLeadsCount > 0 ? "bg-cyan-400/10" : "bg-white/[0.04]",
      pulse: unassignedLeadsCount > 0,
      advancedOnly: true,
    },
    {
      title: "Today Activity",
      value: todayActivityCount,
      text: todayActivityCount === 1 ? "New CRM action" : "New CRM actions",
      icon: "⚡",
      color: "text-blue-300",
      border: todayActivityCount > 0 ? "border-blue-400/25" : "border-white/10",
      bg: todayActivityCount > 0 ? "bg-blue-400/10" : "bg-white/[0.04]",
      pulse: false,
      advancedOnly: true,
    },
  ].filter((item) => !item.advancedOnly || hasAdvancedData);

  const visibleNotifications = notifications.slice(0, hasAdvancedData ? 6 : 3);

  const roleLabel = {
    staff: "Staff View",
    admin: "Admin View",
    super_admin: "Super Admin View",
  }[role] || "CRM View";

  return (
    <div className="mb-5 space-y-3 xl:mb-6 xl:space-y-4">
      <div className="flex flex-col gap-3 rounded-[1.4rem] border border-[#D4AF37]/15 bg-[#D4AF37]/5 px-4 py-3 backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[9px] uppercase tracking-[0.3em] text-[#D4AF37]">
            CRM Notifications
          </p>

          <h3 className="mt-1 text-sm font-black text-white sm:text-base">
            Live operational alerts
          </h3>
        </div>

        <div className="flex flex-wrap gap-2">
          <span className="rounded-full border border-white/10 bg-black/25 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-gray-300">
            {roleLabel}
          </span>

          {permissions?.canManageAdmins && (
            <span className="rounded-full border border-purple-400/20 bg-purple-400/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-purple-300">
              Full Control
            </span>
          )}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:gap-4">
        {visibleNotifications.map((item, index) => (
          <motion.div
            key={item.title}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: index * 0.06 }}
            className={`${cardClass} flex items-center gap-3 p-4 sm:gap-4 sm:p-5`}
          >
            <div
              className={`relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${item.border} ${item.bg} text-lg sm:h-12 sm:w-12 sm:rounded-2xl sm:text-xl`}
            >
              {item.pulse && (
                <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-400 shadow-[0_0_16px_rgba(248,113,113,0.9)]"></span>
              )}

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
    </div>
  );
}

export default NotificationCenter;
