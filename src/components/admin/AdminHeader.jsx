import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabaseClient";

function AdminHeader({
  inquiries = [],
  appointments = [],
  appointmentPendingCount = 0,
  fetchAllData = () => {},
  activeTab = "inquiries",
  exportInquiriesToCSV = () => {},
  exportAppointmentsToCSV = () => {},
  logout = () => {},
  clearInquiries = () => {},
  clearAppointments = () => {},
  role = "staff",
  adminProfile = null,
  permissions = {},
}) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [readNotifications, setReadNotifications] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [followUpAlerts, setFollowUpAlerts] = useState([]);

  const safePermissions = {
    canDelete: false,
    canClearAll: false,
    canExport: false,
    canManageAdmins: false,
    canUpdateStatus: true,
    canUpdatePriority: true,
    canConfirmAppointments: true,
    ...permissions,
  };

  const roleConfig = {
    staff: {
      label: "Staff",
      icon: "🧑‍💼",
      badge: "border-blue-400/20 bg-blue-500/10 text-blue-300",
      glow: "bg-blue-500/10",
      helper: "Lead follow-up workspace",
    },
    admin: {
      label: "Admin",
      icon: "🛡️",
      badge: "border-[#D4AF37]/25 bg-[#D4AF37]/10 text-[#D4AF37]",
      glow: "bg-[#D4AF37]/10",
      helper: "Operations and export access",
    },
    super_admin: {
      label: "Super Admin",
      icon: "👑",
      badge: "border-purple-400/25 bg-purple-500/10 text-purple-300",
      glow: "bg-purple-500/10",
      helper: "Full CRM control enabled",
    },
  };

  const currentRole = roleConfig[role] || roleConfig.staff;
  const allLeads = [...inquiries, ...appointments];

  const newInquiries = inquiries.filter(
    (inquiry) => (inquiry.status || "new") === "new"
  ).length;

  const confirmedAppointments = appointments.filter(
    (appointment) => appointment.status === "confirmed"
  ).length;

  const vipLeads = allLeads.filter((lead) => lead.priority === "vip").length;

  const highPriorityLeads = allLeads.filter(
    (lead) => lead.priority === "high"
  ).length;

  const assignedLeads = allLeads.filter((lead) => lead.assigned_admin_id).length;
  const unassignedLeads = Math.max(allLeads.length - assignedLeads, 0);

  const todayKey = new Date().toISOString().slice(0, 10);

  const fetchFollowUpAlerts = async () => {
    try {
      const { data, error } = await supabase
        .from("follow_up_reminders")
        .select("*")
        .neq("status", "completed")
        .order("due_date", { ascending: true })
        .limit(80);

      if (error) {
        console.error("Follow-up notification fetch failed:", error);
        setFollowUpAlerts([]);
        return;
      }

      setFollowUpAlerts(data || []);
    } catch (error) {
      console.error("Follow-up notification crash:", error);
      setFollowUpAlerts([]);
    }
  };

  useEffect(() => {
    fetchFollowUpAlerts();

    const channel = supabase
      .channel("admin-header-follow-up-alerts")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "follow_up_reminders" },
        fetchFollowUpAlerts
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const reminderStats = useMemo(() => {
    const activeReminders = followUpAlerts.filter(
      (reminder) => reminder.status !== "completed"
    );

    const overdue = activeReminders.filter((reminder) => {
      if (!reminder.due_date) return false;
      return String(reminder.due_date).slice(0, 10) < todayKey;
    });

    const today = activeReminders.filter((reminder) => {
      if (!reminder.due_date) return false;
      return String(reminder.due_date).slice(0, 10) === todayKey;
    });

    return {
      active: activeReminders.length,
      overdue: overdue.length,
      today: today.length,
    };
  }, [followUpAlerts, todayKey]);

  const notifications = useMemo(
    () => [
      {
        id: "overdue-followups",
        icon: "🚨",
        title: "Overdue Follow-ups",
        text: `${reminderStats.overdue} reminders are overdue and need action`,
        show: reminderStats.overdue > 0,
        color: "text-red-300",
        glow: "bg-red-500/10",
        time: "Overdue",
        priority: "urgent",
      },
      {
        id: "today-followups",
        icon: "⏰",
        title: "Follow-ups Today",
        text: `${reminderStats.today} reminders are due today`,
        show: reminderStats.today > 0,
        color: "text-orange-300",
        glow: "bg-orange-500/10",
        time: "Today",
        priority: "high",
      },
      {
        id: "new-inquiries",
        icon: "📨",
        title: "New Inquiries",
        text: `${newInquiries} students need follow-up`,
        show: newInquiries > 0,
        color: "text-[#D4AF37]",
        glow: "bg-[#D4AF37]/10",
        time: "Live",
        priority: "medium",
      },
      {
        id: "pending-appointments",
        icon: "⏳",
        title: "Pending Appointments",
        text: `${appointmentPendingCount} bookings need confirmation`,
        show: appointmentPendingCount > 0,
        color: "text-orange-300",
        glow: "bg-orange-500/10",
        time: "Active",
        priority: "high",
      },
      {
        id: "confirmed-consultations",
        icon: "✅",
        title: "Confirmed Consultations",
        text: `${confirmedAppointments} consultations are ready`,
        show: confirmedAppointments > 0,
        color: "text-green-400",
        glow: "bg-green-500/10",
        time: "Updated",
        priority: "medium",
      },
      {
        id: "vip-leads",
        icon: "👑",
        title: "VIP Leads Active",
        text: `${vipLeads} premium leads require priority attention`,
        show: vipLeads > 0,
        color: "text-purple-300",
        glow: "bg-purple-500/10",
        time: "Priority",
        priority: "vip",
      },
      {
        id: "high-priority",
        icon: "🔥",
        title: "High Priority Leads",
        text: `${highPriorityLeads} leads marked as high priority`,
        show: highPriorityLeads > 0,
        color: "text-red-300",
        glow: "bg-red-500/10",
        time: "Urgent",
        priority: "high",
      },
      {
        id: "open-leads",
        icon: "🧭",
        title: "Open Lead Pool",
        text: `${unassignedLeads} leads are not assigned yet`,
        show: unassignedLeads > 0,
        color: "text-cyan-300",
        glow: "bg-cyan-500/10",
        time: "Ownership",
        priority: "medium",
      },
    ],
    [
      reminderStats.overdue,
      reminderStats.today,
      newInquiries,
      appointmentPendingCount,
      confirmedAppointments,
      vipLeads,
      highPriorityLeads,
      unassignedLeads,
    ]
  );

  const visibleNotifications = notifications.filter((item) => item.show);

  const unreadNotifications = visibleNotifications.filter(
    (item) => !readNotifications.includes(item.id)
  );

  const notificationCount = unreadNotifications.length;

  const summaryItems = [
    {
      label: "Inquiries",
      value: inquiries.length,
      color: "text-[#D4AF37]",
    },
    {
      label: "Appointments",
      value: appointments.length,
      color: "text-green-400",
    },
    {
      label: "Follow-ups",
      value: reminderStats.active,
      color: "text-orange-300",
    },
    {
      label: "Open Pool",
      value: unassignedLeads,
      color: "text-cyan-300",
    },
  ];

  const markAllAsRead = () => {
    setReadNotifications(visibleNotifications.map((item) => item.id));
  };

  const markSingleAsRead = (id) => {
    if (readNotifications.includes(id)) return;
    setReadNotifications((current) => [...current, id]);
  };

  const handleRefresh = async () => {
    setRefreshing(true);

    try {
      await Promise.all([fetchAllData(), fetchFollowUpAlerts()]);
    } finally {
      setTimeout(() => setRefreshing(false), 350);
    }
  };

  const handleExport = () => {
    if (!safePermissions.canExport) {
      alert("Only Admin and Super Admin can export CRM data.");
      return;
    }

    if (activeTab === "inquiries") {
      exportInquiriesToCSV();
    } else {
      exportAppointmentsToCSV();
    }
  };

  const handleClear = () => {
    if (!safePermissions.canClearAll) {
      alert("Only Super Admin can clear all CRM records.");
      return;
    }

    if (activeTab === "inquiries") {
      clearInquiries();
    } else {
      clearAppointments();
    }
  };

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (!event.target.closest(".notification-wrapper")) {
        setShowNotifications(false);
      }
    };

    window.addEventListener("click", handleOutsideClick);

    return () => {
      window.removeEventListener("click", handleOutsideClick);
    };
  }, []);

  useEffect(() => {
    const visibleIds = visibleNotifications.map((item) => item.id);

    setReadNotifications((current) =>
      current.filter((id) => visibleIds.includes(id))
    );
  }, [visibleNotifications.length]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
      className="relative z-20 mb-5 overflow-visible rounded-[1.8rem] border border-white/10 bg-white/[0.04] p-4 backdrop-blur-2xl sm:mb-6 sm:rounded-[2.3rem] sm:p-6"
    >
      <div className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent opacity-80"></div>

      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex items-center gap-2 rounded-full border border-[#D4AF37]/20 bg-[#D4AF37]/10 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.24em] text-[#D4AF37]">
                <span className="h-2 w-2 rounded-full bg-[#D4AF37] shadow-[0_0_16px_rgba(212,175,55,0.75)]"></span>
                Enterprise CRM Dashboard
              </div>

              <div
                className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] ${currentRole.badge}`}
              >
                <span>{currentRole.icon}</span>
                {currentRole.label}
              </div>
            </div>

            <h1 className="mt-4 text-3xl font-black leading-tight text-white sm:text-5xl">
              Zaifan CRM
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-gray-400">
              Premium student management system with real-time analytics,
              consultation scheduling, lead ownership, role permissions, and
              enterprise CRM automation.
            </p>

            <div className="mt-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              {summaryItems.map((item) => (
                <div
                  key={item.label}
                  className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-xs text-gray-400"
                >
                  <p className="text-[9px] uppercase tracking-[0.2em] text-gray-500">
                    {item.label}
                  </p>
                  <p className={`mt-1 text-lg font-black ${item.color}`}>
                    {item.value}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="flex shrink-0 items-start justify-between gap-3 xl:justify-start">
            <div className="rounded-[1.5rem] border border-white/10 bg-black/25 p-4">
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 text-2xl ${currentRole.glow}`}
                >
                  {currentRole.icon}
                </div>

                <div className="min-w-0">
                  <p className="text-[10px] uppercase tracking-[0.24em] text-gray-500">
                    Logged In
                  </p>

                  <h3 className="mt-1 max-w-[170px] truncate text-sm font-black text-white">
                    {adminProfile?.full_name || "Admin User"}
                  </h3>

                  <p className="mt-1 text-xs text-[#D4AF37]">
                    {currentRole.helper}
                  </p>
                </div>
              </div>
            </div>

            <div className="notification-wrapper relative flex h-14 w-14 shrink-0 items-center justify-center overflow-visible">
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  setShowNotifications((current) => !current);
                }}
                className="group relative flex h-14 w-14 items-center justify-center rounded-[1.5rem] border border-white/10 bg-white/[0.04] text-2xl text-white transition duration-300 hover:border-[#D4AF37]/40 hover:bg-[#D4AF37]/10"
              >
                <span className="relative z-10 leading-none">🔔</span>

                {notificationCount > 0 && (
                  <span className="absolute right-1.5 top-1.5 z-20 flex h-5 min-w-5 items-center justify-center rounded-full border border-black/30 bg-[#D4AF37] px-1 text-[9px] font-black leading-none text-black shadow-[0_0_18px_rgba(212,175,55,0.6)]">
                    {notificationCount > 9 ? "9+" : notificationCount}
                  </span>
                )}

                {notificationCount > 0 && (
                  <span className="absolute inset-0 rounded-[1.5rem] border border-[#D4AF37]/20 shadow-[0_0_28px_rgba(212,175,55,0.14)]"></span>
                )}
              </button>

              <AnimatePresence>
                {showNotifications && (
                  <motion.div
                    initial={{ opacity: 0, y: 14, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 14, scale: 0.96 }}
                    transition={{ duration: 0.22 }}
                    className="absolute right-0 top-[72px] z-[999] w-[min(92vw,430px)] overflow-hidden rounded-[2rem] border border-white/10 bg-[#070707]/98 shadow-[0_40px_120px_rgba(0,0,0,0.75)] backdrop-blur-2xl"
                  >
                    <div className="relative overflow-hidden border-b border-white/10 p-5">
                      <div className="absolute right-0 top-0 h-32 w-32 rounded-full bg-[#D4AF37]/10 blur-3xl"></div>

                      <div className="relative flex items-start justify-between gap-4">
                        <div>
                          <p className="text-[10px] uppercase tracking-[0.32em] text-[#D4AF37]">
                            Notification Center
                          </p>

                          <h3 className="mt-2 text-2xl font-black text-white">
                            CRM Alerts
                          </h3>

                          <p className="mt-2 text-xs leading-relaxed text-gray-400">
                            Real-time signals from leads, appointments, and
                            follow-up reminders.
                          </p>
                        </div>

                        {notificationCount > 0 && (
                          <button
                            type="button"
                            onClick={markAllAsRead}
                            className="rounded-full border border-[#D4AF37]/20 bg-[#D4AF37]/10 px-3 py-2 text-[10px] font-bold uppercase tracking-[0.18em] text-[#D4AF37] transition duration-300 hover:bg-[#D4AF37]/20"
                          >
                            Mark Read
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="max-h-[460px] overflow-y-auto p-3 [scrollbar-color:#D4AF37_transparent] [scrollbar-width:thin]">
                      {visibleNotifications.length === 0 ? (
                        <div className="rounded-[1.5rem] border border-dashed border-white/10 bg-black/25 p-8 text-center">
                          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] text-3xl">
                            ✨
                          </div>

                          <h3 className="mt-4 text-lg font-bold text-white">
                            All Clear
                          </h3>

                          <p className="mt-2 text-sm leading-relaxed text-gray-400">
                            No active notifications right now.
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {visibleNotifications.map((item, index) => {
                            const isRead = readNotifications.includes(item.id);

                            return (
                              <motion.button
                                key={item.id}
                                type="button"
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{
                                  duration: 0.2,
                                  delay: index * 0.03,
                                }}
                                onClick={() => markSingleAsRead(item.id)}
                                className={`group relative w-full overflow-hidden rounded-[1.4rem] border p-4 text-left transition duration-300 ${
                                  isRead
                                    ? "border-white/10 bg-white/[0.025] opacity-70"
                                    : "border-[#D4AF37]/15 bg-white/[0.04] hover:border-[#D4AF37]/30 hover:bg-white/[0.055]"
                                }`}
                              >
                                {!isRead && (
                                  <div className="absolute right-3 top-3 h-2.5 w-2.5 rounded-full bg-[#D4AF37] shadow-[0_0_15px_rgba(212,175,55,0.8)]"></div>
                                )}

                                <div className="flex gap-4">
                                  <div
                                    className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/10 text-2xl ${item.glow}`}
                                  >
                                    {item.icon}
                                  </div>

                                  <div className="min-w-0 flex-1">
                                    <div className="flex items-start justify-between gap-3">
                                      <div>
                                        <p
                                          className={`text-sm font-black ${item.color}`}
                                        >
                                          {item.title}
                                        </p>

                                        <p className="mt-1 text-xs leading-relaxed text-gray-400">
                                          {item.text}
                                        </p>
                                      </div>

                                      <span className="rounded-full border border-white/10 bg-black/25 px-2 py-1 text-[9px] font-bold uppercase tracking-[0.16em] text-gray-500">
                                        {item.time}
                                      </span>
                                    </div>

                                    <div className="mt-3 flex items-center justify-between">
                                      <span
                                        className={`rounded-full px-2 py-1 text-[9px] font-bold uppercase tracking-[0.16em] ${
                                          item.priority === "urgent"
                                            ? "border border-red-400/30 bg-red-500/10 text-red-200"
                                            : item.priority === "vip"
                                            ? "border border-purple-400/20 bg-purple-500/10 text-purple-300"
                                            : item.priority === "high"
                                            ? "border border-red-400/20 bg-red-500/10 text-red-300"
                                            : "border border-[#D4AF37]/20 bg-[#D4AF37]/10 text-[#D4AF37]"
                                        }`}
                                      >
                                        {item.priority}
                                      </span>

                                      <span className="text-[10px] text-gray-500">
                                        {isRead ? "Read" : "Unread"}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </motion.button>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    <div className="border-t border-white/10 p-4">
                      <div className="grid grid-cols-3 gap-2">
                        <MiniStat
                          label="Unread"
                          value={notificationCount}
                          color="text-[#D4AF37]"
                        />
                        <MiniStat
                          label="Overdue"
                          value={reminderStats.overdue}
                          color="text-red-300"
                        />
                        <MiniStat
                          label="Today"
                          value={reminderStats.today}
                          color="text-orange-300"
                        />
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
          <ActionButton
            onClick={handleRefresh}
            label={refreshing ? "Refreshing..." : "Refresh"}
            icon="🔄"
            disabled={refreshing}
          />

          <ActionButton
            onClick={handleExport}
            label={safePermissions.canExport ? "Export CSV" : "Export Locked"}
            icon="📤"
            variant={safePermissions.canExport ? "gold" : "locked"}
            disabled={!safePermissions.canExport}
          />

          <ActionButton onClick={logout} label="Logout" icon="🚪" />

          <ActionButton
            onClick={handleClear}
            label={
              safePermissions.canClearAll
                ? `Clear ${
                    activeTab === "inquiries" ? "Inquiries" : "Appointments"
                  }`
                : "Clear Locked"
            }
            icon="🗑️"
            variant={safePermissions.canClearAll ? "danger" : "locked"}
            disabled={!safePermissions.canClearAll}
          />
        </div>
      </div>
    </motion.div>
  );
}

function ActionButton({
  onClick,
  label,
  icon,
  variant = "default",
  disabled = false,
}) {
  const variants = {
    default:
      "border border-white/10 bg-white/[0.04] text-gray-300 hover:border-[#D4AF37]/40 hover:text-[#D4AF37]",
    gold: "bg-[#D4AF37] text-black hover:bg-[#E7C768]",
    danger:
      "border border-red-400/20 bg-red-400/10 text-red-300 hover:border-red-400 hover:bg-red-400/15",
    locked:
      "cursor-not-allowed border border-white/10 bg-white/[0.03] text-gray-500",
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`rounded-2xl px-4 py-3 text-sm font-bold transition duration-300 disabled:cursor-not-allowed disabled:opacity-60 ${
        variants[variant] || variants.default
      }`}
    >
      <span className="mr-2">{icon}</span>
      {label}
    </button>
  );
}

function MiniStat({ label, value, color }) {
  return (
    <div className="rounded-[1rem] border border-white/10 bg-white/[0.03] p-3 text-center">
      <p className="text-[9px] uppercase tracking-[0.2em] text-gray-500">
        {label}
      </p>

      <h3 className={`mt-2 text-xl font-black ${color}`}>{value}</h3>
    </div>
  );
}

export default AdminHeader;