import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabaseClient";

const toLower = (value) => String(value || "").toLowerCase().trim();

const isDone = (status) => {
  const value = toLower(status);

  return (
    value.includes("completed") ||
    value.includes("complete") ||
    value.includes("done") ||
    value.includes("approved") ||
    value.includes("verified") ||
    value.includes("resolved") ||
    value.includes("closed") ||
    value.includes("paid")
  );
};

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

  studentApplications = [],
  studentDocuments = [],
  studentTasks = [],
  studentUniversities = [],
  studentRiskScores = [],

  studentInvoices = [],
  studentPayments = [],
  studentReceipts = [],
  studentPortalAccounts = [],
  supportRequests = [],
  counselorPaymentRequests = [],
  setActiveTab = null,
  setActiveAnalyticsSection = null,
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
      badge: "border-blue-200 bg-blue-50 text-blue-700",
      glow: "bg-blue-50",
      helper: "Student follow-up workspace",
    },
    admin: {
      label: "Admin",
      icon: "🛡️",
      badge: "border-orange-200 bg-[#fff1ea] text-[#ff4b12]",
      glow: "bg-[#fff1ea]",
      helper: "Student operations and export access",
    },
    super_admin: {
      label: "Super Admin",
      icon: "👑",
      badge: "border-violet-200 bg-violet-50 text-violet-700",
      glow: "bg-violet-50",
      helper: "Full Student OS control enabled",
    },
  };

  const currentRole = roleConfig[role] || roleConfig.staff;
  const allLeads = [...inquiries, ...appointments];

  const newInquiries = inquiries.filter(
    (inquiry) => toLower(inquiry.status || "new") === "new"
  ).length;

  const confirmedAppointments = appointments.filter(
    (appointment) => toLower(appointment.status) === "confirmed"
  ).length;

  const vipLeads = allLeads.filter((lead) => toLower(lead.priority) === "vip").length;

  const highPriorityLeads = allLeads.filter(
    (lead) => toLower(lead.priority) === "high"
  ).length;

  const assignedLeads = allLeads.filter((lead) => lead.assigned_admin_id).length;
  const unassignedLeads = Math.max(allLeads.length - assignedLeads, 0);

  const pendingApplications = studentApplications.filter((app) => {
    const status = toLower(app.application_status || app.status);
    return (
      status.includes("pending") ||
      status.includes("draft") ||
      status.includes("review") ||
      status.includes("submitted")
    );
  }).length;

  const offers = studentApplications.filter((app) => {
    const status = toLower(app.status);
    const offerStatus = toLower(app.offer_status);
    return status.includes("offer") || offerStatus.includes("received");
  }).length;

  const casDelays = studentApplications.filter((app) => {
    const offer = toLower(app.offer_status);
    const cas = toLower(app.cas_status || app.cas);
    return (offer.includes("accepted") || offer.includes("firm")) && !cas.includes("issued");
  }).length;

  const visaDelays = studentApplications.filter((app) => {
    const cas = toLower(app.cas_status || app.cas);
    const visa = toLower(app.visa_status || app.visa);
    return cas.includes("issued") && !visa.includes("approved");
  }).length;

  const pendingDocuments = studentDocuments.filter(
    (doc) => !isDone(doc.status || doc.document_status || doc.verification_status)
  ).length;

  const pendingTasks = studentTasks.filter(
    (task) => !isDone(task.status || task.task_status)
  ).length;

  const highRiskStudents = studentRiskScores.filter((risk) => {
    const score = Number(risk.risk_score || risk.score || risk.overall_score || 0);
    const level = toLower(risk.risk_level || risk.priority || risk.level);
    return score >= 70 || level.includes("high") || level.includes("critical");
  }).length;

  const unpaidInvoices = studentInvoices.filter((invoice) => {
    const status = toLower(invoice.status || invoice.payment_status);
    return !status.includes("paid") && !status.includes("complete");
  }).length;

  const outstandingAmount = studentInvoices.reduce((sum, invoice) => {
    const status = toLower(invoice.status || invoice.payment_status);
    if (status.includes("paid") || status.includes("complete")) return sum;

    return (
      sum +
      Number(
        invoice.outstanding_amount ||
          invoice.balance ||
          invoice.amount ||
          invoice.total_amount ||
          invoice.invoice_amount ||
          0
      )
    );
  }, 0);

  const pendingReceipts = studentReceipts.filter((receipt) => {
    const status = toLower(
      receipt.status || receipt.receipt_status || receipt.approval_status
    );
    return !status.includes("approved") && !status.includes("rejected");
  }).length;

  const portalResetRequired = studentPortalAccounts.filter(
    (account) => account.must_change_password || account.force_password_change
  ).length;

  const activePortalAccounts = studentPortalAccounts.filter((account) => {
    const active = account.is_active ?? account.active ?? account.status;
    if (typeof active === "boolean") return active;
    return !["inactive", "disabled", "blocked", "false"].includes(toLower(active));
  }).length;

  const openSupportRequests = supportRequests.filter((request) => {
    const status = toLower(request.status || request.request_status);
    return !status.includes("resolved") && !status.includes("closed");
  }).length;

  const escalatedSupportRequests = supportRequests.filter((request) => {
    const status = toLower(request.status || request.request_status);
    const priority = toLower(request.priority || request.severity);

    return (
      status.includes("escalated") ||
      priority.includes("urgent") ||
      priority.includes("high") ||
      priority.includes("critical")
    );
  }).length;

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

  const executivePressure =
    reminderStats.overdue +
    appointmentPendingCount +
    newInquiries +
    casDelays +
    visaDelays +
    unpaidInvoices +
    pendingReceipts +
    portalResetRequired +
    escalatedSupportRequests +
    highRiskStudents;

  const studentOsHealthItems = [
    {
      label: "Apps",
      value: studentApplications.length,
      color: "text-cyan-700",
      helper: `${pendingApplications} pending`,
    },
    {
      label: "Offers",
      value: offers,
      color: "text-emerald-700",
      helper: "opportunities",
    },
    {
      label: "CAS Risk",
      value: casDelays,
      color: casDelays > 0 ? "text-orange-700" : "text-emerald-700",
      helper: "delays",
    },
    {
      label: "Visa Risk",
      value: visaDelays,
      color: visaDelays > 0 ? "text-red-700" : "text-emerald-700",
      helper: "delays",
    },
    {
      label: "Revenue",
      value: unpaidInvoices,
      color: unpaidInvoices > 0 ? "text-orange-700" : "text-emerald-700",
      helper: "unpaid",
    },
    {
      label: "Portal",
      value: activePortalAccounts,
      color: "text-blue-700",
      helper: `${portalResetRequired} resets`,
    },
    {
      label: "Support",
      value: openSupportRequests,
      color: openSupportRequests > 0 ? "text-orange-700" : "text-emerald-700",
      helper: `${escalatedSupportRequests} escalated`,
    },
    {
      label: "Risk",
      value: highRiskStudents,
      color: highRiskStudents > 0 ? "text-red-700" : "text-emerald-700",
      helper: "AI watch",
    },
  ];

  const notifications = useMemo(
    () => [
      {
        id: "overdue-followups",
        icon: "🚨",
        title: "Overdue Follow-ups",
        text: `${reminderStats.overdue} reminders are overdue and need action`,
        show: reminderStats.overdue > 0,
        color: "text-red-700",
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
        color: "text-orange-700",
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
        color: "text-[#ff4b12]",
        glow: "bg-[#fff1ea]",
        time: "Live",
        priority: "medium",
      },
      {
        id: "pending-appointments",
        icon: "⏳",
        title: "Pending Appointments",
        text: `${appointmentPendingCount} bookings need confirmation`,
        show: appointmentPendingCount > 0,
        color: "text-orange-700",
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
        color: "text-emerald-700",
        glow: "bg-green-500/10",
        time: "Updated",
        priority: "medium",
      },
      {
        id: "vip-leads",
        icon: "👑",
        title: "VIP Students Active",
        text: `${vipLeads} premium leads require priority attention`,
        show: vipLeads > 0,
        color: "text-violet-700",
        glow: "bg-violet-50",
        time: "Priority",
        priority: "vip",
      },
      {
        id: "high-priority",
        icon: "🔥",
        title: "High Priority Students",
        text: `${highPriorityLeads} leads marked as high priority`,
        show: highPriorityLeads > 0,
        color: "text-red-700",
        glow: "bg-red-500/10",
        time: "Urgent",
        priority: "high",
      },
      {
        id: "open-leads",
        icon: "🧭",
        title: "Open Student Pool",
        text: `${unassignedLeads} students are not assigned yet`,
        show: unassignedLeads > 0,
        color: "text-cyan-700",
        glow: "bg-cyan-500/10",
        time: "Ownership",
        priority: "medium",
      },
      {
        id: "cas-delays",
        icon: "📄",
        title: "CAS Delays",
        text: `${casDelays} students have accepted offers but no CAS issued`,
        show: casDelays > 0,
        color: "text-orange-700",
        glow: "bg-orange-500/10",
        time: "CAS",
        priority: "high",
      },
      {
        id: "visa-delays",
        icon: "✈️",
        title: "Visa Delays",
        text: `${visaDelays} students have CAS issued but visa not approved`,
        show: visaDelays > 0,
        color: "text-red-700",
        glow: "bg-red-500/10",
        time: "Visa",
        priority: "high",
      },
      {
        id: "payment-risks",
        icon: "💷",
        title: "Payment Risks",
        text: `${unpaidInvoices} unpaid invoices and ${pendingReceipts} pending receipts`,
        show: unpaidInvoices > 0 || pendingReceipts > 0,
        color: "text-[#ff4b12]",
        glow: "bg-[#fff1ea]",
        time: "Revenue",
        priority: "high",
      },
      {
        id: "portal-resets",
        icon: "🔐",
        title: "Portal Password Resets",
        text: `${portalResetRequired} students must change their portal password`,
        show: portalResetRequired > 0,
        color: "text-orange-700",
        glow: "bg-orange-500/10",
        time: "Portal",
        priority: "medium",
      },
      {
        id: "support-escalations",
        icon: "🎧",
        title: "Support Escalations",
        text: `${escalatedSupportRequests} support requests need urgent attention`,
        show: escalatedSupportRequests > 0,
        color: "text-red-700",
        glow: "bg-red-500/10",
        time: "Support",
        priority: "urgent",
      },
      {
        id: "executive-risk",
        icon: "🧠",
        title: "Executive AI Risk",
        text: `${highRiskStudents} students are flagged by Executive AI`,
        show: highRiskStudents > 0,
        color: "text-red-700",
        glow: "bg-red-500/10",
        time: "AI Risk",
        priority: "urgent",
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
      casDelays,
      visaDelays,
      unpaidInvoices,
      pendingReceipts,
      portalResetRequired,
      escalatedSupportRequests,
      highRiskStudents,
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
      color: "text-[#ff4b12]",
    },
    {
      label: "Appointments",
      value: appointments.length,
      color: "text-emerald-700",
    },
    {
      label: "Follow-ups",
      value: reminderStats.active,
      color: "text-orange-700",
    },
    {
      label: "Executive Pressure",
      value: executivePressure,
      color: executivePressure > 0 ? "text-red-700" : "text-emerald-700",
    },
  ];

  const markAllAsRead = () => {
    setReadNotifications(visibleNotifications.map((item) => item.id));
  };

  const markSingleAsRead = (id) => {
    if (readNotifications.includes(id)) return;
    setReadNotifications((current) => [...current, id]);
  };

  const handleMissionControl = () => {
    if (typeof setActiveTab === "function") {
      setActiveTab("analytics");
    }

    if (typeof setActiveAnalyticsSection === "function") {
      setActiveAnalyticsSection("mission-control");
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);

    try {
      await Promise.all([
        fetchAllData({ force: true, source: "admin_header_manual_refresh" }),
        fetchFollowUpAlerts(),
      ]);
    } catch (error) {
      console.error("Admin header refresh failed:", error);
      alert(error.message || "Refresh failed. Please try again.");
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
      className="relative z-20 mb-5 overflow-visible rounded-[1.8rem] border border-orange-100 bg-gradient-to-br from-white via-[#fffaf5] to-[#fff1ea] p-4 shadow-[0_24px_70px_rgba(7,31,80,0.08)] backdrop-blur-2xl sm:mb-6 sm:rounded-[2.3rem] sm:p-6"
    >
      <div className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-transparent via-[#ff4b12] to-transparent opacity-70"></div>

      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex items-center gap-2 rounded-full border border-[#ff4b12]/20 bg-[#fff1ea] px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.24em] text-[#ff4b12]">
                <span className="h-2 w-2 rounded-full bg-[#ff4b12] shadow-[0_0_16px_rgba(255,75,18,0.28)]"></span>
                Student OS Executive Command
              </div>

              <div
                className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] ${currentRole.badge}`}
              >
                <span>{currentRole.icon}</span>
                {currentRole.label}
              </div>

              <div
                className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] ${
                  executivePressure > 0
                    ? "border-red-400/25 bg-red-500/10 text-red-700"
                    : "border-green-400/25 bg-green-500/10 text-emerald-700"
                }`}
              >
                <span>{executivePressure > 0 ? "⚠️" : "✅"}</span>
                {executivePressure > 0
                  ? `${executivePressure} Pressure Points`
                  : "Systems Stable"}
              </div>
            </div>

            <h1 className="mt-4 text-3xl font-black leading-tight text-[#071f50] sm:text-5xl">
              Zaifan Student OS
            </h1>

            <p className="mt-3 max-w-3xl text-sm leading-relaxed text-[#526178]">
              Executive top bar for CRM, Student Journey, Mission Control,
              payments, portal accounts, support, documents, tasks, visa,
              CAS, and real-time operational intelligence.
            </p>

            <div className="mt-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              {summaryItems.map((item) => (
                <div
                  key={item.label}
                  className="rounded-2xl border border-orange-100 bg-[#fffaf5] px-4 py-3 text-xs text-[#526178]"
                >
                  <p className="text-[9px] uppercase tracking-[0.2em] text-[#71809a]">
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
            <div className="rounded-[1.5rem] border border-orange-100 bg-[#fff5e9] p-4">
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-2xl border border-orange-100 text-2xl ${currentRole.glow}`}
                >
                  {currentRole.icon}
                </div>

                <div className="min-w-0">
                  <p className="text-[10px] uppercase tracking-[0.24em] text-[#71809a]">
                    Logged In
                  </p>

                  <h3 className="mt-1 max-w-[170px] truncate text-sm font-black text-[#071f50]">
                    {adminProfile?.full_name || "Admin User"}
                  </h3>

                  <p className="mt-1 text-xs text-[#ff4b12]">
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
                className="group relative flex h-14 w-14 items-center justify-center rounded-[1.5rem] border border-orange-100 bg-white/90 text-2xl text-[#071f50] transition duration-300 hover:border-[#ff4b12]/40 hover:bg-[#fff1ea]"
              >
                <span className="relative z-10 leading-none">🔔</span>

                {notificationCount > 0 && (
                  <span className="absolute right-1.5 top-1.5 z-20 flex h-5 min-w-5 items-center justify-center rounded-full border border-white bg-[#ff4b12] px-1 text-[9px] font-black leading-none text-white shadow-[0_0_18px_rgba(255,75,18,0.30)]">
                    {notificationCount > 9 ? "9+" : notificationCount}
                  </span>
                )}

                {notificationCount > 0 && (
                  <span className="absolute inset-0 rounded-[1.5rem] border border-[#ff4b12]/20 shadow-[0_0_28px_rgba(255,75,18,0.14)]"></span>
                )}
              </button>

              <AnimatePresence>
                {showNotifications && (
                  <motion.div
                    initial={{ opacity: 0, y: 14, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 14, scale: 0.96 }}
                    transition={{ duration: 0.22 }}
                    className="absolute right-0 top-[72px] z-[999] w-[min(92vw,460px)] overflow-hidden rounded-[2rem] border border-orange-100 bg-[#fffaf5]/[0.99] shadow-[0_40px_120px_rgba(7,31,80,0.18)] backdrop-blur-2xl"
                  >
                    <div className="relative overflow-hidden border-b border-orange-100 p-5">
                      <div className="absolute right-0 top-0 h-32 w-32 rounded-full bg-[#fff1ea] blur-3xl"></div>

                      <div className="relative flex items-start justify-between gap-4">
                        <div>
                          <p className="text-[10px] uppercase tracking-[0.32em] text-[#ff4b12]">
                            Executive Alerts
                          </p>

                          <h3 className="mt-2 text-2xl font-black text-[#071f50]">
                            CRM + Student OS Signals
                          </h3>

                          <p className="mt-2 text-xs leading-relaxed text-[#526178]">
                            Real-time signals from CRM, reminders, CAS, visa,
                            payments, portal, support, and Executive AI.
                          </p>
                        </div>

                        {notificationCount > 0 && (
                          <button
                            type="button"
                            onClick={markAllAsRead}
                            className="rounded-full border border-[#ff4b12]/20 bg-[#fff1ea] px-3 py-2 text-[10px] font-bold uppercase tracking-[0.18em] text-[#ff4b12] transition duration-300 hover:bg-[#ff4b12]/20"
                          >
                            Mark Read
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="max-h-[460px] overflow-y-auto p-3 [scrollbar-color:#ff4b12_transparent] [scrollbar-width:thin]">
                      {visibleNotifications.length === 0 ? (
                        <div className="rounded-[1.5rem] border border-dashed border-orange-100 bg-[#fff5e9] p-8 text-center">
                          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-orange-100 bg-[#fffaf5] text-3xl">
                            ✨
                          </div>

                          <h3 className="mt-4 text-lg font-bold text-[#071f50]">
                            All Clear
                          </h3>

                          <p className="mt-2 text-sm leading-relaxed text-[#526178]">
                            No active executive notifications right now.
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
                                    ? "border-orange-100 bg-[#fffaf5] opacity-70"
                                    : "border-[#ff4b12]/15 bg-white/90 hover:border-[#ff4b12]/30 hover:bg-[#fff1ea]"
                                }`}
                              >
                                {!isRead && (
                                  <div className="absolute right-3 top-3 h-2.5 w-2.5 rounded-full bg-[#ff4b12] shadow-[0_0_15px_rgba(255,75,18,0.32)]"></div>
                                )}

                                <div className="flex gap-4">
                                  <div
                                    className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-orange-100 text-2xl ${item.glow}`}
                                  >
                                    {item.icon}
                                  </div>

                                  <div className="min-w-0 flex-1">
                                    <div className="flex items-start justify-between gap-3">
                                      <div>
                                        <p className={`text-sm font-black ${item.color}`}>
                                          {item.title}
                                        </p>

                                        <p className="mt-1 text-xs leading-relaxed text-[#526178]">
                                          {item.text}
                                        </p>
                                      </div>

                                      <span className="rounded-full border border-orange-100 bg-[#fff5e9] px-2 py-1 text-[9px] font-bold uppercase tracking-[0.16em] text-[#71809a]">
                                        {item.time}
                                      </span>
                                    </div>

                                    <div className="mt-3 flex items-center justify-between">
                                      <span
                                        className={`rounded-full px-2 py-1 text-[9px] font-bold uppercase tracking-[0.16em] ${
                                          item.priority === "urgent"
                                            ? "border border-red-400/30 bg-red-500/10 text-red-700"
                                            : item.priority === "vip"
                                            ? "border border-purple-400/20 bg-violet-50 text-violet-700"
                                            : item.priority === "high"
                                            ? "border border-red-400/20 bg-red-500/10 text-red-700"
                                            : "border border-[#ff4b12]/20 bg-[#fff1ea] text-[#ff4b12]"
                                        }`}
                                      >
                                        {item.priority}
                                      </span>

                                      <span className="text-[10px] text-[#71809a]">
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

                    <div className="border-t border-orange-100 p-4">
                      <div className="grid grid-cols-3 gap-2">
                        <MiniStat label="Unread" value={notificationCount} color="text-[#ff4b12]" />
                        <MiniStat label="Overdue" value={reminderStats.overdue} color="text-red-700" />
                        <MiniStat label="Pressure" value={executivePressure} color="text-orange-700" />
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
          {studentOsHealthItems.map((item) => (
            <div
              key={item.label}
              className="rounded-2xl border border-orange-100 bg-[#fffaf5] px-4 py-3"
            >
              <div className="flex items-center justify-between gap-3">
                <p className="text-[9px] uppercase tracking-[0.2em] text-[#71809a]">
                  {item.label}
                </p>

                <p className={`text-lg font-black ${item.color}`}>
                  {item.value}
                </p>
              </div>

              <p className="mt-1 text-xs text-[#71809a]">
                {item.helper}
              </p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-2 lg:grid-cols-5">
          <ActionButton
            onClick={handleRefresh}
            label={refreshing ? "Refreshing..." : "Refresh"}
            icon="🔄"
            disabled={refreshing}
          />

          <ActionButton
            onClick={handleMissionControl}
            label="Mission Control"
            icon="🚀"
            variant="gold"
          />

          <ActionButton
            onClick={handleExport}
            label={safePermissions.canExport ? "Export CSV" : "Export Locked"}
            icon="📤"
            variant={safePermissions.canExport ? "default" : "locked"}
            disabled={!safePermissions.canExport}
          />

          <ActionButton onClick={logout} label="Logout" icon="🚪" />

          <ActionButton
            onClick={handleClear}
            label={
              safePermissions.canClearAll
                ? `Clear ${activeTab === "inquiries" ? "Inquiries" : "Appointments"}`
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
      "border border-orange-100 bg-white/90 text-[#526178] hover:border-[#ff4b12]/40 hover:text-[#ff4b12]",
    gold: "bg-[#ff4b12] text-white hover:bg-[#ff6a35]",
    danger:
      "border border-red-400/20 bg-red-400/10 text-red-700 hover:border-red-400 hover:bg-red-400/15",
    locked:
      "cursor-not-allowed border border-orange-100 bg-[#fffaf5] text-[#71809a]",
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
    <div className="rounded-[1rem] border border-orange-100 bg-[#fffaf5] p-3 text-center">
      <p className="text-[9px] uppercase tracking-[0.2em] text-[#71809a]">
        {label}
      </p>

      <h3 className={`mt-2 text-xl font-black ${color}`}>{value}</h3>
    </div>
  );
}

export default AdminHeader;
