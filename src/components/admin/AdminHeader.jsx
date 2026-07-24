// AdminHeader V3 MAXIMUM — Zaifan Student OS Executive Command Header
// src/components/admin/AdminHeader.jsx
//
// Maximum pass:
// - preserves the existing AdminHeader public prop API
// - preserves CRM / Student OS calculations and permission gates
// - preserves Supabase follow_up_reminders realtime integration
// - adds timeout-safe reminder reads and realtime refresh protection
// - fixes date handling so local "today" is not derived from UTC ISO date
// - removes window.alert dependency in favor of inline operation feedback
// - accessible notification popover, Escape close, outside-click close
// - notification buttons can route operators toward relevant workspaces
// - persistent-in-session read notification state
// - proper Lucide icons instead of emoji-heavy operational UI
// - reduced-motion support
// - stronger high-contrast Zaifan navy/orange/cream visual system
// - navy surfaces use explicit white text
// - responsive/mobile-safe action layout and notification panel
// - rounded Admin OS geometry; avoids sharp dashboard edges

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  AlertTriangle,
  Bell,
  BrainCircuit,
  CalendarCheck2,
  Check,
  CheckCircle2,
  ChevronRight,
  CircleDollarSign,
  Download,
  FileClock,
  FileText,
  Gauge,
  Headphones,
  Inbox,
  KeyRound,
  LogOut,
  RefreshCw,
  Rocket,
  ShieldCheck,
  Sparkles,
  Trash2,
  UserRound,
  UsersRound,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { supabase } from "../../lib/supabaseClient";

const REQUEST_TIMEOUT_MS = 12000;
const READ_STORAGE_KEY = "zaifan-admin-header-read-notifications";

const toLower = (value) => String(value ?? "").toLowerCase().trim();

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

const safeArray = (value) => (Array.isArray(value) ? value : []);

const safeNumber = (value) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
};

const localDateKey = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const withTimeout = (promise, message = "Request timed out.") =>
  Promise.race([
    promise,
    new Promise((_, reject) => {
      const timer = window.setTimeout(() => reject(new Error(message)), REQUEST_TIMEOUT_MS);
      Promise.resolve(promise).finally(() => window.clearTimeout(timer));
    }),
  ]);

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
  const shouldReduceMotion = useReducedMotion();
  const mountedRef = useRef(true);

  const [showNotifications, setShowNotifications] = useState(false);
  const [readNotifications, setReadNotifications] = useState(() => {
    try {
      const stored = window.sessionStorage.getItem(READ_STORAGE_KEY);
      const parsed = stored ? JSON.parse(stored) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });
  const [refreshing, setRefreshing] = useState(false);
  const [followUpAlerts, setFollowUpAlerts] = useState([]);
  const [reminderLoading, setReminderLoading] = useState(true);
  const [reminderError, setReminderError] = useState("");
  const [operationMessage, setOperationMessage] = useState(null);
  const [lastSyncedAt, setLastSyncedAt] = useState(null);

  const safeInquiries = safeArray(inquiries);
  const safeAppointments = safeArray(appointments);
  const safeApplications = safeArray(studentApplications);
  const safeDocuments = safeArray(studentDocuments);
  const safeTasks = safeArray(studentTasks);
  const safeUniversities = safeArray(studentUniversities);
  const safeRiskScores = safeArray(studentRiskScores);
  const safeInvoices = safeArray(studentInvoices);
  const safePayments = safeArray(studentPayments);
  const safeReceipts = safeArray(studentReceipts);
  const safePortalAccounts = safeArray(studentPortalAccounts);
  const safeSupportRequests = safeArray(supportRequests);
  const safeCounselorPayments = safeArray(counselorPaymentRequests);

  const safePermissions = useMemo(
    () => ({
      canDelete: false,
      canClearAll: false,
      canExport: false,
      canManageAdmins: false,
      canUpdateStatus: true,
      canUpdatePriority: true,
      canConfirmAppointments: true,
      ...permissions,
    }),
    [permissions]
  );

  const roleConfig = {
    staff: {
      label: "Staff",
      helper: "Student follow-up workspace",
      Icon: UserRound,
    },
    admin: {
      label: "Admin",
      helper: "Student operations and export access",
      Icon: ShieldCheck,
    },
    super_admin: {
      label: "Super Admin",
      helper: "Full Student OS control enabled",
      Icon: Sparkles,
    },
  };

  const currentRole = roleConfig[role] || roleConfig.staff;
  const RoleIcon = currentRole.Icon;
  const allLeads = useMemo(
    () => [...safeInquiries, ...safeAppointments],
    [safeInquiries, safeAppointments]
  );

  const todayKey = localDateKey();

  const fetchFollowUpAlerts = useCallback(async ({ quiet = false } = {}) => {
    if (!quiet && mountedRef.current) setReminderLoading(true);
    if (mountedRef.current) setReminderError("");

    try {
      const result = await withTimeout(
        supabase
          .from("follow_up_reminders")
          .select("*")
          .neq("status", "completed")
          .order("due_date", { ascending: true })
          .limit(100),
        "Follow-up reminders took too long to load."
      );

      if (result?.error) throw result.error;

      if (mountedRef.current) {
        setFollowUpAlerts(safeArray(result?.data));
        setLastSyncedAt(new Date());
      }
    } catch (error) {
      console.error("AdminHeader follow-up reminder load failed:", error);
      if (mountedRef.current) {
        setReminderError(error?.message || "Follow-up alerts could not load.");
      }
    } finally {
      if (mountedRef.current) setReminderLoading(false);
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    fetchFollowUpAlerts();

    let realtimeTimer = null;

    const channel = supabase
      .channel("admin-header-follow-up-alerts-v3")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "follow_up_reminders" },
        () => {
          window.clearTimeout(realtimeTimer);
          realtimeTimer = window.setTimeout(() => {
            fetchFollowUpAlerts({ quiet: true });
          }, 250);
        }
      )
      .subscribe();

    return () => {
      mountedRef.current = false;
      window.clearTimeout(realtimeTimer);
      supabase.removeChannel(channel);
    };
  }, [fetchFollowUpAlerts]);

  useEffect(() => {
    try {
      window.sessionStorage.setItem(
        READ_STORAGE_KEY,
        JSON.stringify(readNotifications)
      );
    } catch {
      // Session persistence is optional.
    }
  }, [readNotifications]);

  useEffect(() => {
    if (!operationMessage) return undefined;
    const timer = window.setTimeout(() => setOperationMessage(null), 4500);
    return () => window.clearTimeout(timer);
  }, [operationMessage]);

  useEffect(() => {
    if (!showNotifications || typeof document === "undefined") return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [showNotifications]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape") setShowNotifications(false);
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const metrics = useMemo(() => {
    const newInquiries = safeInquiries.filter(
      (item) => toLower(item.status || "new") === "new"
    ).length;

    const confirmedAppointments = safeAppointments.filter(
      (item) => toLower(item.status) === "confirmed"
    ).length;

    const vipLeads = allLeads.filter(
      (lead) => toLower(lead.priority) === "vip"
    ).length;

    const highPriorityLeads = allLeads.filter(
      (lead) => toLower(lead.priority) === "high"
    ).length;

    const assignedLeads = allLeads.filter((lead) => lead.assigned_admin_id).length;
    const unassignedLeads = Math.max(allLeads.length - assignedLeads, 0);

    const pendingApplications = safeApplications.filter((app) => {
      const status = toLower(app.application_status || app.status);
      return (
        status.includes("pending") ||
        status.includes("draft") ||
        status.includes("review") ||
        status.includes("submitted")
      );
    }).length;

    const offers = safeApplications.filter((app) => {
      const status = toLower(app.status);
      const offerStatus = toLower(app.offer_status);
      return (
        status.includes("offer") ||
        offerStatus.includes("received") ||
        offerStatus.includes("accepted")
      );
    }).length;

    const casDelays = safeApplications.filter((app) => {
      const offer = toLower(app.offer_status);
      const cas = toLower(app.cas_status || app.cas);
      return (
        (offer.includes("accepted") || offer.includes("firm")) &&
        !cas.includes("issued")
      );
    }).length;

    const visaDelays = safeApplications.filter((app) => {
      const cas = toLower(app.cas_status || app.cas);
      const visa = toLower(app.visa_status || app.visa);
      return cas.includes("issued") && !visa.includes("approved");
    }).length;

    const pendingDocuments = safeDocuments.filter(
      (doc) =>
        !isDone(doc.status || doc.document_status || doc.verification_status)
    ).length;

    const pendingTasks = safeTasks.filter(
      (task) => !isDone(task.status || task.task_status)
    ).length;

    const highRiskStudents = safeRiskScores.filter((risk) => {
      const score = safeNumber(
        risk.risk_score || risk.score || risk.overall_score
      );
      const level = toLower(risk.risk_level || risk.priority || risk.level);
      return (
        score >= 70 ||
        level.includes("high") ||
        level.includes("critical")
      );
    }).length;

    const unpaidInvoices = safeInvoices.filter((invoice) => {
      const status = toLower(invoice.status || invoice.payment_status);
      return !status.includes("paid") && !status.includes("complete");
    }).length;

    const outstandingAmount = safeInvoices.reduce((sum, invoice) => {
      const status = toLower(invoice.status || invoice.payment_status);
      if (status.includes("paid") || status.includes("complete")) return sum;

      return (
        sum +
        safeNumber(
          invoice.outstanding_amount ||
            invoice.balance ||
            invoice.amount ||
            invoice.total_amount ||
            invoice.invoice_amount
        )
      );
    }, 0);

    const pendingReceipts = safeReceipts.filter((receipt) => {
      const status = toLower(
        receipt.status || receipt.receipt_status || receipt.approval_status
      );
      return !status.includes("approved") && !status.includes("rejected");
    }).length;

    const portalResetRequired = safePortalAccounts.filter(
      (account) =>
        account.must_change_password || account.force_password_change
    ).length;

    const activePortalAccounts = safePortalAccounts.filter((account) => {
      const active = account.is_active ?? account.active ?? account.status;
      if (typeof active === "boolean") return active;
      return !["inactive", "disabled", "blocked", "false"].includes(toLower(active));
    }).length;

    const openSupportRequests = safeSupportRequests.filter((request) => {
      const status = toLower(request.status || request.request_status);
      return !status.includes("resolved") && !status.includes("closed");
    }).length;

    const escalatedSupportRequests = safeSupportRequests.filter((request) => {
      const status = toLower(request.status || request.request_status);
      const priority = toLower(request.priority || request.severity);
      return (
        status.includes("escalated") ||
        priority.includes("urgent") ||
        priority.includes("high") ||
        priority.includes("critical")
      );
    }).length;

    return {
      newInquiries,
      confirmedAppointments,
      vipLeads,
      highPriorityLeads,
      assignedLeads,
      unassignedLeads,
      pendingApplications,
      offers,
      casDelays,
      visaDelays,
      pendingDocuments,
      pendingTasks,
      highRiskStudents,
      unpaidInvoices,
      outstandingAmount,
      pendingReceipts,
      portalResetRequired,
      activePortalAccounts,
      openSupportRequests,
      escalatedSupportRequests,
    };
  }, [
    safeInquiries,
    safeAppointments,
    allLeads,
    safeApplications,
    safeDocuments,
    safeTasks,
    safeRiskScores,
    safeInvoices,
    safeReceipts,
    safePortalAccounts,
    safeSupportRequests,
  ]);

  const reminderStats = useMemo(() => {
    const activeReminders = followUpAlerts.filter(
      (reminder) => toLower(reminder.status) !== "completed"
    );

    const overdue = activeReminders.filter(
      (reminder) =>
        reminder.due_date &&
        String(reminder.due_date).slice(0, 10) < todayKey
    );

    const today = activeReminders.filter(
      (reminder) =>
        reminder.due_date &&
        String(reminder.due_date).slice(0, 10) === todayKey
    );

    return {
      active: activeReminders.length,
      overdue: overdue.length,
      today: today.length,
    };
  }, [followUpAlerts, todayKey]);

  const executivePressure =
    reminderStats.overdue +
    safeNumber(appointmentPendingCount) +
    metrics.newInquiries +
    metrics.casDelays +
    metrics.visaDelays +
    metrics.unpaidInvoices +
    metrics.pendingReceipts +
    metrics.portalResetRequired +
    metrics.escalatedSupportRequests +
    metrics.highRiskStudents;

  const notifications = useMemo(
    () => [
      {
        id: "overdue-followups",
        Icon: AlertTriangle,
        title: "Overdue Follow-ups",
        text: `${reminderStats.overdue} reminders are overdue and need action.`,
        show: reminderStats.overdue > 0,
        time: "Overdue",
        priority: "urgent",
        destination: "followups",
      },
      {
        id: "today-followups",
        Icon: FileClock,
        title: "Follow-ups Today",
        text: `${reminderStats.today} reminders are due today.`,
        show: reminderStats.today > 0,
        time: "Today",
        priority: "high",
        destination: "followups",
      },
      {
        id: "new-inquiries",
        Icon: Inbox,
        title: "New Inquiries",
        text: `${metrics.newInquiries} students need follow-up.`,
        show: metrics.newInquiries > 0,
        time: "Live",
        priority: "medium",
        destination: "inquiries",
      },
      {
        id: "pending-appointments",
        Icon: CalendarCheck2,
        title: "Pending Appointments",
        text: `${safeNumber(appointmentPendingCount)} bookings need confirmation.`,
        show: safeNumber(appointmentPendingCount) > 0,
        time: "Active",
        priority: "high",
        destination: "appointments",
      },
      {
        id: "vip-leads",
        Icon: Sparkles,
        title: "VIP Students Active",
        text: `${metrics.vipLeads} VIP leads require priority attention.`,
        show: metrics.vipLeads > 0,
        time: "Priority",
        priority: "vip",
        destination: "inquiries",
      },
      {
        id: "high-priority",
        Icon: AlertTriangle,
        title: "High Priority Students",
        text: `${metrics.highPriorityLeads} leads are marked high priority.`,
        show: metrics.highPriorityLeads > 0,
        time: "Urgent",
        priority: "high",
        destination: "inquiries",
      },
      {
        id: "open-leads",
        Icon: UsersRound,
        title: "Unassigned Student Pool",
        text: `${metrics.unassignedLeads} students do not have an owner yet.`,
        show: metrics.unassignedLeads > 0,
        time: "Ownership",
        priority: "medium",
        destination: "inquiries",
      },
      {
        id: "cas-delays",
        Icon: FileText,
        title: "CAS Delays",
        text: `${metrics.casDelays} accepted/firm applications do not show CAS issued.`,
        show: metrics.casDelays > 0,
        time: "CAS",
        priority: "high",
        destination: "analytics",
      },
      {
        id: "visa-delays",
        Icon: Gauge,
        title: "Visa Delays",
        text: `${metrics.visaDelays} CAS-issued cases do not show visa approval.`,
        show: metrics.visaDelays > 0,
        time: "Visa",
        priority: "high",
        destination: "analytics",
      },
      {
        id: "payment-risks",
        Icon: CircleDollarSign,
        title: "Payment Risks",
        text: `${metrics.unpaidInvoices} unpaid invoices · ${metrics.pendingReceipts} receipts pending.`,
        show: metrics.unpaidInvoices > 0 || metrics.pendingReceipts > 0,
        time: "Revenue",
        priority: "high",
        destination: "analytics",
      },
      {
        id: "portal-resets",
        Icon: KeyRound,
        title: "Portal Password Changes",
        text: `${metrics.portalResetRequired} portal accounts require a password change.`,
        show: metrics.portalResetRequired > 0,
        time: "Portal",
        priority: "medium",
        destination: "analytics",
      },
      {
        id: "support-escalations",
        Icon: Headphones,
        title: "Support Escalations",
        text: `${metrics.escalatedSupportRequests} support requests need urgent review.`,
        show: metrics.escalatedSupportRequests > 0,
        time: "Support",
        priority: "urgent",
        destination: "analytics",
      },
      {
        id: "executive-risk",
        Icon: BrainCircuit,
        title: "Executive AI Risk",
        text: `${metrics.highRiskStudents} students are flagged high/critical risk.`,
        show: metrics.highRiskStudents > 0,
        time: "AI Risk",
        priority: "urgent",
        destination: "analytics",
      },
    ],
    [reminderStats, appointmentPendingCount, metrics]
  );

  const visibleNotifications = notifications.filter((item) => item.show);
  const visibleNotificationIds = visibleNotifications.map((item) => item.id);

  useEffect(() => {
    setReadNotifications((current) =>
      current.filter((id) => visibleNotificationIds.includes(id))
    );
    // The joined key prevents effect churn from a new array reference.
  }, [visibleNotificationIds.join("|")]);

  const unreadNotifications = visibleNotifications.filter(
    (item) => !readNotifications.includes(item.id)
  );
  const notificationCount = unreadNotifications.length;

  const healthItems = [
    {
      label: "Applications",
      value: safeApplications.length,
      helper: `${metrics.pendingApplications} pending`,
      tone: metrics.pendingApplications ? "warning" : "good",
    },
    {
      label: "Documents",
      value: safeDocuments.length,
      helper: `${metrics.pendingDocuments} need attention`,
      tone: metrics.pendingDocuments ? "warning" : "good",
    },
    {
      label: "Tasks",
      value: safeTasks.length,
      helper: `${metrics.pendingTasks} open`,
      tone: metrics.pendingTasks ? "warning" : "good",
    },
    {
      label: "Universities",
      value: safeUniversities.length,
      helper: "student shortlist records",
      tone: "info",
    },
    {
      label: "CAS Risk",
      value: metrics.casDelays,
      helper: "accepted without CAS",
      tone: metrics.casDelays ? "danger" : "good",
    },
    {
      label: "Visa Risk",
      value: metrics.visaDelays,
      helper: "CAS issued, visa pending",
      tone: metrics.visaDelays ? "danger" : "good",
    },
    {
      label: "Portal",
      value: metrics.activePortalAccounts,
      helper: `${metrics.portalResetRequired} password changes`,
      tone: metrics.portalResetRequired ? "warning" : "good",
    },
    {
      label: "Support",
      value: metrics.openSupportRequests,
      helper: `${metrics.escalatedSupportRequests} escalated`,
      tone: metrics.escalatedSupportRequests ? "danger" : "good",
    },
  ];

  const markAllAsRead = () => {
    setReadNotifications(visibleNotificationIds);
  };

  const markSingleAsRead = (id) => {
    setReadNotifications((current) =>
      current.includes(id) ? current : [...current, id]
    );
  };

  const navigateFromNotification = (item) => {
    markSingleAsRead(item.id);

    if (typeof setActiveTab === "function") {
      if (item.destination === "inquiries") setActiveTab("inquiries");
      if (item.destination === "appointments") setActiveTab("appointments");
      if (item.destination === "analytics" || item.destination === "followups") {
        setActiveTab("analytics");
      }
    }

    if (typeof setActiveAnalyticsSection === "function") {
      if (item.destination === "followups") {
        setActiveAnalyticsSection("followups");
      } else if (item.destination === "analytics") {
        setActiveAnalyticsSection("mission-control");
      }
    }

    setShowNotifications(false);
  };

  const handleMissionControl = () => {
    if (typeof setActiveTab === "function") setActiveTab("analytics");
    if (typeof setActiveAnalyticsSection === "function") {
      setActiveAnalyticsSection("mission-control");
    }
  };

  const handleRefresh = async () => {
    if (refreshing) return;
    setRefreshing(true);
    setOperationMessage(null);

    try {
      await Promise.all([
        withTimeout(
          Promise.resolve(
            fetchAllData({ force: true, source: "admin_header_manual_refresh" })
          ),
          "Admin data refresh timed out."
        ),
        fetchFollowUpAlerts({ quiet: true }),
      ]);

      setOperationMessage({
        type: "success",
        text: "Admin OS data refreshed successfully.",
      });
    } catch (error) {
      console.error("AdminHeader refresh failed:", error);
      setOperationMessage({
        type: "error",
        text: error?.message || "Refresh failed. Please try again.",
      });
    } finally {
      if (mountedRef.current) setRefreshing(false);
    }
  };

  const handleExport = () => {
    if (!safePermissions.canExport) {
      setOperationMessage({
        type: "warning",
        text: "Your current role does not have CRM export permission.",
      });
      return;
    }

    try {
      if (activeTab === "appointments") {
        exportAppointmentsToCSV();
      } else {
        exportInquiriesToCSV();
      }

      setOperationMessage({
        type: "success",
        text: `${
          activeTab === "appointments" ? "Appointments" : "Inquiries"
        } export started.`,
      });
    } catch (error) {
      setOperationMessage({
        type: "error",
        text: error?.message || "Export failed.",
      });
    }
  };

  const handleClear = () => {
    if (!safePermissions.canClearAll) {
      setOperationMessage({
        type: "warning",
        text: "Only an authorized role can clear all CRM records.",
      });
      return;
    }

    const target =
      activeTab === "appointments" ? "appointments" : "inquiries";

    const confirmed = window.confirm(
      `Clear all ${target}? This is a destructive CRM action and may not be reversible.`
    );

    if (!confirmed) return;

    try {
      if (target === "appointments") clearAppointments();
      else clearInquiries();

      setOperationMessage({
        type: "success",
        text: `Clear ${target} action was submitted.`,
      });
    } catch (error) {
      setOperationMessage({
        type: "error",
        text: error?.message || `Could not clear ${target}.`,
      });
    }
  };

  const summaryItems = [
    {
      label: "Inquiries",
      value: safeInquiries.length,
      helper: `${metrics.newInquiries} new`,
      tone: "orange",
    },
    {
      label: "Appointments",
      value: safeAppointments.length,
      helper: `${safeNumber(appointmentPendingCount)} pending`,
      tone: "blue",
    },
    {
      label: "Follow-ups",
      value: reminderStats.active,
      helper: `${reminderStats.overdue} overdue`,
      tone: reminderStats.overdue ? "red" : "green",
    },
    {
      label: "Pressure",
      value: executivePressure,
      helper: executivePressure ? "needs review" : "systems stable",
      tone: executivePressure ? "red" : "green",
    },
  ];

  const financeContext =
    safePayments.length +
    safeInvoices.length +
    safeReceipts.length +
    safeCounselorPayments.length;

  return (
    <motion.header
      initial={shouldReduceMotion ? false : { opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: shouldReduceMotion ? 0 : 0.28 }}
      className="relative z-30 overflow-visible rounded-[2rem] border-[3px] border-orange-300 bg-white shadow-[0_16px_42px_rgba(15,35,63,0.07)]"
    >
      <div className="overflow-hidden rounded-[1.78rem]">
        <div
          className="grid lg:grid-cols-[minmax(0,1fr)_340px]"
          style={{ color: "#ffffff" }}
        >
          <div className="bg-[#123865] p-5 sm:p-6" style={{ color: "#ffffff" }}>
            <div className="flex flex-wrap items-center gap-2">
              <HeaderBadge Icon={Rocket}>Student OS Command</HeaderBadge>
              <HeaderBadge Icon={RoleIcon}>{currentRole.label}</HeaderBadge>
              <HeaderBadge
                Icon={executivePressure ? AlertTriangle : CheckCircle2}
                emphasis={executivePressure ? "warning" : "success"}
              >
                {executivePressure
                  ? `${executivePressure} pressure points`
                  : "Systems stable"}
              </HeaderBadge>
            </div>

            <h1 className="mt-4 text-3xl font-black leading-tight text-white sm:text-4xl">
              Zaifan Student OS
            </h1>

            <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-white">
              Live operational command for leads, appointments, student journey,
              finance, portal access, support and counselor workload.
            </p>

            <div className="mt-5 grid grid-cols-2 gap-2 xl:grid-cols-4">
              {summaryItems.map((item) => (
                <SummaryCard key={item.label} {...item} />
              ))}
            </div>
          </div>

          <div className="bg-orange-500 p-5 text-white sm:p-6" style={{ color: "#ffffff" }}>
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-white">
              Operator Session
            </p>

            <div className="mt-3 flex items-center gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border-2 border-white/30 bg-white/10 text-white">
                <RoleIcon size={21} />
              </div>

              <div className="min-w-0">
                <p className="truncate text-lg font-black text-white">
                  {adminProfile?.full_name || "Admin User"}
                </p>
                <p className="mt-0.5 text-xs font-bold text-white">
                  {currentRole.helper}
                </p>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2">
              <OrangeMetric label="Unread alerts" value={notificationCount} />
              <OrangeMetric label="Finance records" value={financeContext} />
            </div>

            <p className="mt-3 whitespace-nowrap text-[10px] font-black text-white">
              {lastSyncedAt
                ? `PORTAL · Alerts synced ${lastSyncedAt.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}`
                : reminderLoading
                ? "PORTAL · Loading live alerts…"
                : "PORTAL · Alert sync pending"}
            </p>
          </div>
        </div>

        <div className="bg-[#fff8ee] p-4 sm:p-5">
          {operationMessage ? (
            <StatusMessage
              type={operationMessage.type}
              text={operationMessage.text}
              onClose={() => setOperationMessage(null)}
            />
          ) : null}

          {reminderError ? (
            <div className="mb-4 flex flex-col gap-3 rounded-[1.25rem] border-2 border-red-300 bg-red-50 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-black text-red-800">
                  Follow-up alert sync needs attention
                </p>
                <p className="mt-1 text-xs font-semibold text-red-700">
                  {reminderError}
                </p>
              </div>
              <button
                type="button"
                onClick={() => fetchFollowUpAlerts()}
                className="rounded-xl border-2 border-red-300 bg-white px-4 py-2 text-xs font-black text-red-700 transition hover:bg-red-100"
              >
                Retry alerts
              </button>
            </div>
          ) : null}

          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
            {healthItems.map((item) => (
              <HealthCard key={item.label} {...item} />
            ))}
          </div>

          <div className="mt-4 flex flex-col gap-3 rounded-[1.5rem] border-2 border-slate-300 bg-white p-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex min-w-0 items-center gap-3 px-1">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border-2 border-orange-300 bg-orange-50 text-orange-700">
                <Gauge size={18} />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-black text-[#10233f]">
                  Admin Operations
                </p>
                <p className="text-xs font-semibold text-slate-600">
                  Refresh, inspect alerts, open Mission Control, export or run authorized destructive actions.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:justify-end">
              <ActionButton
                onClick={handleRefresh}
                label={refreshing ? "Refreshing" : "Refresh"}
                Icon={RefreshCw}
                loading={refreshing}
                disabled={refreshing}
              />

              <ActionButton
                onClick={() => setShowNotifications((current) => !current)}
                label={`Alerts${notificationCount ? ` ${notificationCount}` : ""}`}
                Icon={Bell}
                active={showNotifications}
                ariaExpanded={showNotifications}
              />

              <ActionButton
                onClick={handleMissionControl}
                label="Mission Control"
                Icon={Rocket}
                variant="primary"
              />

              <ActionButton
                onClick={handleExport}
                label={safePermissions.canExport ? "Export CSV" : "Export Locked"}
                Icon={Download}
                disabled={!safePermissions.canExport}
              />

              <ActionButton
                onClick={logout}
                label="Logout"
                Icon={LogOut}
              />

              <ActionButton
                onClick={handleClear}
                label={safePermissions.canClearAll ? "Clear Records" : "Clear Locked"}
                Icon={Trash2}
                variant={safePermissions.canClearAll ? "danger" : "locked"}
                disabled={!safePermissions.canClearAll}
              />
            </div>
          </div>
        </div>
      </div>

      {typeof document !== "undefined"
        ? createPortal(
            <AnimatePresence>
              {showNotifications ? (
                <NotificationPanel
                  notifications={visibleNotifications}
                  readNotifications={readNotifications}
                  notificationCount={notificationCount}
                  reminderStats={reminderStats}
                  executivePressure={executivePressure}
                  onMarkAll={markAllAsRead}
                  onOpen={navigateFromNotification}
                  onClose={() => setShowNotifications(false)}
                  shouldReduceMotion={shouldReduceMotion}
                />
              ) : null}
            </AnimatePresence>,
            document.body
          )
        : null}
    </motion.header>
  );
}

function HeaderBadge({ Icon, children, emphasis = "default" }) {
  const style =
    emphasis === "warning"
      ? "border-white/35 bg-white/15"
      : emphasis === "success"
      ? "border-white/35 bg-white/10"
      : "border-white/25 bg-white/10";

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.14em] text-white ${style}`}
      style={{ color: "#ffffff" }}
    >
      <Icon size={12} />
      {children}
    </span>
  );
}

function SummaryCard({ label, value, helper, tone }) {
  const styles = {
    orange: "border-orange-300 bg-orange-50",
    blue: "border-blue-300 bg-blue-50",
    red: "border-red-300 bg-red-50",
    green: "border-emerald-300 bg-emerald-50",
  };

  return (
    <div className={`rounded-[1.15rem] border-2 p-3 ${styles[tone] || styles.blue}`}>
      <p className="text-[9px] font-black uppercase tracking-[0.14em] text-slate-600">
        {label}
      </p>
      <div className="mt-1 flex items-end justify-between gap-2">
        <p className="text-xl font-black text-[#10233f]">{value}</p>
        <p className="text-[10px] font-bold text-slate-600">{helper}</p>
      </div>
    </div>
  );
}

function OrangeMetric({ label, value }) {
  return (
    <div className="rounded-[1.1rem] border-2 border-white/30 bg-white/10 p-3">
      <p className="text-[9px] font-black uppercase tracking-[0.12em] text-white">
        {label}
      </p>
      <p className="mt-1 text-xl font-black text-white">{value}</p>
    </div>
  );
}

function HealthCard({ label, value, helper, tone = "info" }) {
  const styles = {
    good: "border-emerald-300 bg-emerald-50",
    warning: "border-orange-300 bg-orange-50",
    danger: "border-red-300 bg-red-50",
    info: "border-blue-300 bg-blue-50",
  };

  return (
    <div className={`rounded-[1.25rem] border-2 p-4 ${styles[tone] || styles.info}`}>
      <div className="flex items-center justify-between gap-3">
        <p className="text-[9px] font-black uppercase tracking-[0.15em] text-slate-600">
          {label}
        </p>
        <p className="text-xl font-black text-[#10233f]">{value}</p>
      </div>
      <p className="mt-1 text-[11px] font-semibold text-slate-600">{helper}</p>
    </div>
  );
}

function ActionButton({
  onClick,
  label,
  Icon,
  variant = "default",
  disabled = false,
  loading = false,
  active = false,
  ariaExpanded,
}) {
  const variants = {
    default:
      "border-slate-300 bg-white text-[#10233f] hover:border-orange-400 hover:bg-orange-50",
    primary:
      "border-orange-500 bg-orange-500 text-white hover:bg-orange-600",
    danger:
      "border-red-300 bg-red-50 text-red-700 hover:bg-red-100",
    locked:
      "border-slate-300 bg-slate-100 text-slate-500",
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-expanded={ariaExpanded}
      className={`inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border-2 px-3 py-2.5 text-xs font-black transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-orange-200 disabled:cursor-not-allowed disabled:opacity-55 sm:w-auto ${
        active
          ? "border-orange-500 bg-orange-50 text-orange-700"
          : variants[variant] || variants.default
      }`}
    >
      <Icon size={15} className={loading ? "animate-spin" : ""} />
      <span>{label}</span>
    </button>
  );
}

function StatusMessage({ type, text, onClose }) {
  const styles = {
    success: "border-emerald-300 bg-emerald-50 text-emerald-800",
    warning: "border-orange-300 bg-orange-50 text-orange-800",
    error: "border-red-300 bg-red-50 text-red-800",
  };

  return (
    <div
      role="status"
      className={`mb-4 flex items-center justify-between gap-3 rounded-[1.25rem] border-2 p-4 ${
        styles[type] || styles.warning
      }`}
    >
      <div className="flex items-center gap-2">
        {type === "success" ? <Check size={17} /> : <AlertTriangle size={17} />}
        <p className="text-sm font-black">{text}</p>
      </div>
      <button
        type="button"
        onClick={onClose}
        className="rounded-lg p-1 transition hover:bg-black/5"
        aria-label="Dismiss message"
      >
        <X size={16} />
      </button>
    </div>
  );
}

function NotificationPanel({
  notifications,
  readNotifications,
  notificationCount,
  reminderStats,
  executivePressure,
  onMarkAll,
  onOpen,
  onClose,
  shouldReduceMotion,
}) {
  return (
    <motion.div
      initial={shouldReduceMotion ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: shouldReduceMotion ? 0 : 0.16 }}
      className="fixed inset-0 z-[9999] flex items-start justify-center overflow-y-auto bg-[#07182b]/55 p-3 backdrop-blur-[2px] sm:p-6 lg:items-center"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <motion.div
        initial={shouldReduceMotion ? false : { opacity: 0, y: 18, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 12, scale: 0.985 }}
        transition={{ duration: shouldReduceMotion ? 0 : 0.2 }}
        className="my-4 w-full max-w-[760px] overflow-hidden rounded-[1.9rem] border-[3px] border-orange-300 bg-white shadow-[0_32px_100px_rgba(7,24,43,0.38)]"
        role="dialog"
        aria-modal="true"
        aria-label="Admin notifications"
        onMouseDown={(event) => event.stopPropagation()}
      >
      <div className="bg-[#123865] p-5 text-white" style={{ color: "#ffffff" }}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.16em] text-white">
              Executive Alerts
            </p>
            <h3 className="mt-1 text-xl font-black text-white">
              Student OS Signals
            </h3>
            <p className="mt-1 text-xs font-semibold text-white">
              Live operational exceptions that may require counselor action.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border-2 border-white/25 bg-white/10 text-white transition hover:bg-white/20"
            aria-label="Close notifications"
          >
            <X size={16} />
          </button>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2">
          <DarkMiniStat label="Unread" value={notificationCount} />
          <DarkMiniStat label="Overdue" value={reminderStats.overdue} />
          <DarkMiniStat label="Pressure" value={executivePressure} />
        </div>
      </div>

      <div className="bg-[#fff8ee] p-3">
        <div className="mb-3 flex items-center justify-between gap-3 px-1">
          <p className="text-xs font-black text-[#10233f]">
            {notifications.length
              ? `${notifications.length} active signals`
              : "No active signals"}
          </p>

          {notificationCount > 0 ? (
            <button
              type="button"
              onClick={onMarkAll}
              className="rounded-lg border-2 border-orange-300 bg-white px-3 py-1.5 text-[10px] font-black text-orange-700 transition hover:bg-orange-50"
            >
              Mark all read
            </button>
          ) : null}
        </div>

        <div className="max-h-[min(58vh,470px)] space-y-2 overflow-y-auto pr-1 [scrollbar-color:#f97316_transparent] [scrollbar-width:thin]">
          {notifications.length ? (
            notifications.map((item) => {
              const isRead = readNotifications.includes(item.id);
              const Icon = item.Icon;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onOpen(item)}
                  className={`group w-full rounded-[1.2rem] border-2 p-3 text-left transition ${
                    isRead
                      ? "border-slate-300 bg-white opacity-75"
                      : item.priority === "urgent"
                      ? "border-red-300 bg-red-50"
                      : item.priority === "high"
                      ? "border-orange-300 bg-orange-50"
                      : "border-blue-300 bg-blue-50"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border-2 border-slate-300 bg-white text-[#10233f]">
                      <Icon size={17} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-sm font-black text-[#10233f]">
                            {item.title}
                          </p>
                          <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">
                            {item.text}
                          </p>
                        </div>
                        <ChevronRight
                          size={16}
                          className="mt-1 shrink-0 text-slate-500 transition group-hover:translate-x-0.5"
                        />
                      </div>

                      <div className="mt-2 flex items-center gap-2">
                        <span className="rounded-full border border-slate-300 bg-white px-2 py-1 text-[9px] font-black uppercase tracking-[0.1em] text-slate-600">
                          {item.time}
                        </span>
                        <span className="text-[9px] font-black uppercase tracking-[0.1em] text-slate-500">
                          {isRead ? "Read" : "Unread"}
                        </span>
                      </div>
                    </div>
                  </div>
                </button>
              );
            })
          ) : (
            <div className="rounded-[1.3rem] border-2 border-emerald-300 bg-emerald-50 p-7 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border-2 border-emerald-300 bg-white text-emerald-700">
                <CheckCircle2 size={21} />
              </div>
              <p className="mt-3 text-base font-black text-[#10233f]">
                Operations clear
              </p>
              <p className="mt-1 text-xs font-semibold text-slate-600">
                No active executive alert conditions were detected.
              </p>
            </div>
          )}
        </div>
      </div>
      </motion.div>
    </motion.div>
  );
}

function DarkMiniStat({ label, value }) {
  return (
    <div className="rounded-xl border-2 border-white/25 bg-white/10 p-2.5 text-white">
      <p className="text-[8px] font-black uppercase tracking-[0.12em] text-white">
        {label}
      </p>
      <p className="mt-1 text-lg font-black text-white">{value}</p>
    </div>
  );
}

export default AdminHeader;
