import { motion } from "framer-motion";
import {
  Bell,
  CheckCircle2,
  AlertTriangle,
  Clock3,
  Crown,
  Briefcase,
  Activity,
  ExternalLink,
  X,
  Plus,
} from "lucide-react";

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
    inquiryVipCount +
    inquiryHighCount +
    appointmentVipCount +
    appointmentHighCount;

  const hasAdvancedData =
    urgentPriorityCount > 0 ||
    assignedLeadsCount > 0 ||
    unassignedLeadsCount > 0 ||
    todayActivityCount > 0;

  const notifications = [
    {
      title: "New Inquiries",
      value: inquiryNewCount,
      text:
        inquiryNewCount === 1
          ? "Needs immediate follow-up"
          : "Need immediate follow-up",
      icon: Bell,
      color: "text-[#D4AF37]",
      border:
        inquiryNewCount > 0
          ? "border-[#D4AF37]/25"
          : "border-white/10",
      bg:
        inquiryNewCount > 0
          ? "bg-[#D4AF37]/10"
          : "bg-white/[0.04]",
      pulse: inquiryNewCount > 0,
      glow:
        inquiryNewCount > 0
          ? "shadow-[0_0_35px_rgba(212,175,55,0.12)]"
          : "",
      status: inquiryNewCount > 0 ? "Attention Required" : "Stable",
    },
    {
      title: "Pending Appointments",
      value: appointmentPendingCount,
      text:
        appointmentPendingCount === 1
          ? "Needs confirmation"
          : "Need confirmation",
      icon: Clock3,
      color: "text-orange-300",
      border:
        appointmentPendingCount > 0
          ? "border-orange-400/25"
          : "border-white/10",
      bg:
        appointmentPendingCount > 0
          ? "bg-orange-400/10"
          : "bg-white/[0.04]",
      pulse: appointmentPendingCount > 0,
      glow:
        appointmentPendingCount > 0
          ? "shadow-[0_0_35px_rgba(251,146,60,0.12)]"
          : "",
      status:
        appointmentPendingCount > 0 ? "Pending Review" : "Stable",
    },
    {
      title: "Confirmed Consultations",
      value: appointmentConfirmedCount,
      text:
        appointmentConfirmedCount === 1
          ? "Consultation ready"
          : "Consultations ready",
      icon: CheckCircle2,
      color: "text-green-400",
      border:
        appointmentConfirmedCount > 0
          ? "border-green-400/25"
          : "border-white/10",
      bg:
        appointmentConfirmedCount > 0
          ? "bg-green-400/10"
          : "bg-white/[0.04]",
      pulse: false,
      glow:
        appointmentConfirmedCount > 0
          ? "shadow-[0_0_35px_rgba(74,222,128,0.10)]"
          : "",
      status: "Operational",
    },
    {
      title: "Urgent Priority Leads",
      value: urgentPriorityCount,
      text:
        urgentPriorityCount === 1
          ? "VIP/high lead waiting"
          : "VIP/high leads waiting",
      icon: Crown,
      color: "text-purple-300",
      border:
        urgentPriorityCount > 0
          ? "border-purple-400/25"
          : "border-white/10",
      bg:
        urgentPriorityCount > 0
          ? "bg-purple-400/10"
          : "bg-white/[0.04]",
      pulse: urgentPriorityCount > 0,
      glow:
        urgentPriorityCount > 0
          ? "shadow-[0_0_35px_rgba(192,132,252,0.12)]"
          : "",
      advancedOnly: true,
      status:
        urgentPriorityCount > 0
          ? "High Value Opportunity"
          : "Stable",
    },
    {
      title: "Open Lead Pool",
      value: unassignedLeadsCount,
      text:
        unassignedLeadsCount === 1
          ? "Lead still unassigned"
          : "Leads still unassigned",
      icon: Briefcase,
      color: "text-cyan-300",
      border:
        unassignedLeadsCount > 0
          ? "border-cyan-400/25"
          : "border-white/10",
      bg:
        unassignedLeadsCount > 0
          ? "bg-cyan-400/10"
          : "bg-white/[0.04]",
      pulse: unassignedLeadsCount > 0,
      glow:
        unassignedLeadsCount > 0
          ? "shadow-[0_0_35px_rgba(34,211,238,0.12)]"
          : "",
      advancedOnly: true,
      status:
        unassignedLeadsCount > 0
          ? "Assignment Needed"
          : "Stable",
    },
    {
      title: "Today Activity",
      value: todayActivityCount,
      text:
        todayActivityCount === 1
          ? "New CRM activity"
          : "New CRM activities",
      icon: Activity,
      color: "text-blue-300",
      border:
        todayActivityCount > 0
          ? "border-blue-400/25"
          : "border-white/10",
      bg:
        todayActivityCount > 0
          ? "bg-blue-400/10"
          : "bg-white/[0.04]",
      pulse: false,
      glow:
        todayActivityCount > 0
          ? "shadow-[0_0_35px_rgba(96,165,250,0.12)]"
          : "",
      advancedOnly: true,
      status: "Live Tracking",
    },
  ].filter((item) => !item.advancedOnly || hasAdvancedData);

  const visibleNotifications = notifications.slice(
    0,
    hasAdvancedData ? 6 : 3
  );

  const roleLabel = {
    staff: "Staff View",
    admin: "Admin View",
    super_admin: "Super Admin View",
  }[role] || "CRM View";

  return (
    <div className="mb-5 space-y-4 xl:mb-6 xl:space-y-5">
      <div className="relative overflow-hidden rounded-[1.7rem] border border-[#D4AF37]/15 bg-gradient-to-br from-[#D4AF37]/10 via-black/40 to-black/30 p-5 backdrop-blur-2xl">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(212,175,55,0.12),transparent_35%)]"></div>

        <div className="relative flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[#D4AF37]/20 bg-[#D4AF37]/10 px-3 py-1">
              <span className="h-2 w-2 rounded-full bg-[#D4AF37]"></span>

              <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-[#D4AF37]">
                Enterprise CRM Notifications
              </p>
            </div>

            <h2 className="mt-3 text-xl font-black tracking-tight text-white sm:text-2xl">
              Operational Intelligence Center
            </h2>

            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-gray-400">
              Live SaaS monitoring for inquiries, appointments,
              high-priority leads, staff activity, and operational flow.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <div className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-[10px] font-bold uppercase tracking-[0.2em] text-gray-300 backdrop-blur-xl">
              {roleLabel}
            </div>

            {permissions?.canManageAdmins && (
              <div className="rounded-full border border-purple-400/20 bg-purple-400/10 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.2em] text-purple-300 backdrop-blur-xl">
                Full Access
              </div>
            )}

            <div className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-300 backdrop-blur-xl">
              Live System
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {visibleNotifications.map((item, index) => {
          const Icon = item.icon;

          return (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 22 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.4,
                delay: index * 0.06,
              }}
              className={`${cardClass} ${item.glow} group relative overflow-hidden rounded-[1.8rem] border ${item.border} ${item.bg} p-5 transition duration-500 hover:-translate-y-1 hover:border-[#D4AF37]/30`}
            >
              <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent opacity-0 transition duration-500 group-hover:opacity-100"></div>

              <div className="flex items-start justify-between gap-4">
                <div
                  className={`relative flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border ${item.border} ${item.bg}`}
                >
                  {item.pulse && (
                    <>
                      <span className="absolute inset-0 rounded-2xl bg-red-400/10 blur-xl"></span>

                      <span className="absolute right-1.5 top-1.5 h-2.5 w-2.5 rounded-full bg-red-400 shadow-[0_0_20px_rgba(248,113,113,0.95)]"></span>
                    </>
                  )}

                  <Icon className={`h-6 w-6 ${item.color}`} />
                </div>

                <div className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-[9px] font-bold uppercase tracking-[0.22em] text-gray-400">
                  {item.status}
                </div>
              </div>

              <div className="mt-5">
                <p className="text-[10px] uppercase tracking-[0.26em] text-gray-500">
                  {item.title}
                </p>

                <div className="mt-3 flex items-end gap-3">
                  <h3
                    className={`text-4xl font-black leading-none ${item.color}`}
                  >
                    {item.value}
                  </h3>

                  <p className="pb-1 text-sm text-gray-400">
                    {item.text}
                  </p>
                </div>
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                <button className="inline-flex items-center gap-2 rounded-xl border border-[#D4AF37]/20 bg-[#D4AF37]/10 px-3 py-2 text-[10px] font-bold uppercase tracking-[0.18em] text-[#D4AF37] transition duration-300 hover:border-[#D4AF37]/40 hover:bg-[#D4AF37]/15">
                  <ExternalLink className="h-3.5 w-3.5" />
                  Open
                </button>

                <button className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-[10px] font-bold uppercase tracking-[0.18em] text-gray-300 transition duration-300 hover:border-green-400/30 hover:bg-green-400/10 hover:text-green-300">
                  <Plus className="h-3.5 w-3.5" />
                  Follow-up
                </button>

                <button className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-[10px] font-bold uppercase tracking-[0.18em] text-gray-400 transition duration-300 hover:border-blue-400/30 hover:bg-blue-400/10 hover:text-blue-300">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Read
                </button>

                <button className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-[10px] font-bold uppercase tracking-[0.18em] text-gray-500 transition duration-300 hover:border-red-400/30 hover:bg-red-400/10 hover:text-red-300">
                  <X className="h-3.5 w-3.5" />
                  Dismiss
                </button>
              </div>

              {item.value > 0 && (
                <div className="mt-5 rounded-2xl border border-white/10 bg-black/20 p-3 backdrop-blur-xl">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-[#D4AF37]" />

                    <p className="text-xs font-medium leading-relaxed text-gray-300">
                      CRM detected active operational attention required
                      in this category.
                    </p>
                  </div>
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

export default NotificationCenter;
