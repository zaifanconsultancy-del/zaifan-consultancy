// NotificationCenter V4 MAXIMUM — Functional Zaifan Admin OS Alert Command Center
// src/components/admin/NotificationCenter.jsx
//
// V4 upgrade:
// - preserves CRM / Student OS / finance / portal / support / automation alert aggregation
// - fixes "Open / Follow-up / Read / Dismiss" so they are not dead UI
// - Open routes to the most relevant Admin workspace when setActiveTab is supplied
// - Follow-up routes to Follow-ups workspace (or calls an optional parent handler)
// - Read + Dismiss work locally and persist for the browser session
// - keeps optional parent hooks for future Supabase-backed alert persistence
// - removes white-heavy visual treatment in favor of Zaifan navy + orange + cream
// - semantic green/red/blue/violet remain only where useful
// - rounded high-contrast cards, stronger section grouping, mobile-safe actions

import { motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Bell,
  Briefcase,
  CheckCircle2,
  Clock3,
  CreditCard,
  Crown,
  ExternalLink,
  FileText,
  GraduationCap,
  Headphones,
  LockKeyhole,
  Plane,
  Plus,
  Radio,
  Receipt,
  ShieldAlert,
  WalletCards,
  X,
  Zap,
} from "lucide-react";

const READ_STORAGE_KEY = "zaifan_notification_center_read_v4";
const DISMISSED_STORAGE_KEY = "zaifan_notification_center_dismissed_v4";

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
    value.includes("paid") ||
    value.includes("success") ||
    value.includes("executed")
  );
};

const percent = (value, total) => {
  if (!total) return 0;
  return Math.round((Number(value || 0) / Number(total || 1)) * 100);
};

const formatMoney = (value) => {
  const amount = Number(value || 0);

  try {
    return new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency: "GBP",
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `£${amount.toLocaleString()}`;
  }
};

const isWithinDays = (value, days = 30) => {
  if (!value) return false;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return false;

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);

  return date >= cutoff;
};

const getAmount = (item = {}) =>
  Number(
    item.amount ||
      item.total_amount ||
      item.invoice_amount ||
      item.paid_amount ||
      item.payment_amount ||
      item.receipt_amount ||
      item.value ||
      0
  );

const makeAlertId = (item) =>
  String(item?.id || item?.title || "alert")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

const loadStoredIds = (key) => {
  if (typeof window === "undefined") return [];

  try {
    const parsed = JSON.parse(window.sessionStorage.getItem(key) || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const resolveDestination = (item = {}) => {
  if (item.destination) return item.destination;

  const title = toLower(item.title);

  if (
    title.includes("inquir") ||
    title.includes("priority lead") ||
    title.includes("assigned lead") ||
    title.includes("lead pool") ||
    title.includes("today activity")
  ) {
    return "inquiries";
  }

  if (
    title.includes("appointment") ||
    title.includes("consultation")
  ) {
    return "appointments";
  }

  if (
    title.includes("task") ||
    title.includes("follow-up") ||
    title.includes("follow up")
  ) {
    return "followups";
  }

  if (
    title.includes("automation") ||
    title.includes("execution") ||
    title.includes("approval") ||
    title.includes("duplicate")
  ) {
    return "automation";
  }

  return "analytics";
};

function NotificationCenter({
  cardClass = "",
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
  executiveExecutionLogs = [],

  revenueMetrics = null,
  portalUsageMetrics = null,
  notificationMetrics = null,

  // Navigation connection supplied by AdminPage.
  setActiveTab = null,
  setActiveAnalyticsSection = null,

  // Optional future parent-owned actions.
  onOpenAlert = null,
  onCreateFollowUp = null,
  onMarkRead = null,
  onDismissAlert = null,
}) {
  const [readIds, setReadIds] = useState(() => loadStoredIds(READ_STORAGE_KEY));
  const [dismissedIds, setDismissedIds] = useState(() =>
    loadStoredIds(DISMISSED_STORAGE_KEY)
  );
  const [actionNotice, setActionNotice] = useState("");

  useEffect(() => {
    try {
      window.sessionStorage.setItem(READ_STORAGE_KEY, JSON.stringify(readIds));
    } catch {
      // Session persistence is optional.
    }
  }, [readIds]);

  useEffect(() => {
    try {
      window.sessionStorage.setItem(
        DISMISSED_STORAGE_KEY,
        JSON.stringify(dismissedIds)
      );
    } catch {
      // Session persistence is optional.
    }
  }, [dismissedIds]);

  useEffect(() => {
    if (!actionNotice) return undefined;
    const timer = window.setTimeout(() => setActionNotice(""), 3200);
    return () => window.clearTimeout(timer);
  }, [actionNotice]);

  const urgentPriorityCount =
    inquiryVipCount +
    inquiryHighCount +
    appointmentVipCount +
    appointmentHighCount;

  const pendingApplications = studentApplications.filter((app) => {
    const status = toLower(app.application_status || app.status);
    return (
      status.includes("pending") ||
      status.includes("draft") ||
      status.includes("review")
    );
  }).length;

  const offerReceived = studentApplications.filter((app) => {
    const status = toLower(app.offer_status || app.status);
    return status.includes("received") || status.includes("offer");
  }).length;

  const casDelayed = studentApplications.filter((app) => {
    const offer = toLower(app.offer_status);
    const cas = toLower(app.cas_status || app.cas);

    return (
      (offer.includes("accepted") || offer.includes("firm")) &&
      !cas.includes("issued")
    );
  }).length;

  const visaDelayed = studentApplications.filter((app) => {
    const cas = toLower(app.cas_status || app.cas);
    const visa = toLower(app.visa_status || app.visa);

    return cas.includes("issued") && !visa.includes("approved");
  }).length;

  const pendingDocuments = studentDocuments.filter(
    (doc) =>
      !isDone(doc.status || doc.document_status || doc.verification_status)
  ).length;

  const pendingTasks = studentTasks.filter(
    (task) => !isDone(task.status || task.task_status)
  ).length;

  const highRiskStudents = studentRiskScores.filter((risk) => {
    const score = Number(
      risk.risk_score || risk.score || risk.overall_score || 0
    );
    const level = toLower(risk.risk_level || risk.priority || risk.level);

    return (
      score >= 70 ||
      level.includes("high") ||
      level.includes("critical")
    );
  }).length;

  const criticalRiskStudents = studentRiskScores.filter((risk) => {
    const score = Number(
      risk.risk_score || risk.score || risk.overall_score || 0
    );
    const level = toLower(risk.risk_level || risk.priority || risk.level);

    return score >= 85 || level.includes("critical");
  }).length;

  const unpaidInvoices = studentInvoices.filter((invoice) => {
    const status = toLower(invoice.status || invoice.payment_status);

    return !status.includes("paid") && !status.includes("complete");
  }).length;

  const invoiceValue = studentInvoices.reduce(
    (sum, invoice) => sum + getAmount(invoice),
    0
  );

  const paidValue = studentPayments.reduce(
    (sum, payment) => sum + getAmount(payment),
    0
  );

  const outstandingValue = studentInvoices.reduce((sum, invoice) => {
    const status = toLower(invoice.status || invoice.payment_status);
    const amount = getAmount(invoice);
    const outstanding = Number(
      invoice.outstanding_amount || invoice.balance || 0
    );

    if (status.includes("paid") || status.includes("complete")) return sum;

    return sum + (outstanding || amount);
  }, 0);

  const pendingReceipts = studentReceipts.filter((receipt) => {
    const status = toLower(
      receipt.status ||
        receipt.receipt_status ||
        receipt.approval_status
    );

    return (
      !status.includes("approved") &&
      !status.includes("rejected")
    );
  }).length;

  const approvedReceipts = studentReceipts.filter((receipt) => {
    const status = toLower(
      receipt.status ||
        receipt.receipt_status ||
        receipt.approval_status
    );

    return status.includes("approved");
  }).length;

  const passwordResetRequired = studentPortalAccounts.filter(
    (account) =>
      account.must_change_password ||
      account.force_password_change
  ).length;

  const inactivePortalAccounts = studentPortalAccounts.filter((account) => {
    const active =
      account.is_active ??
      account.active ??
      account.status;

    if (typeof active === "boolean") return !active;

    return ["inactive", "disabled", "blocked", "false"].includes(
      toLower(active)
    );
  }).length;

  const recentlyActivePortalAccounts = studentPortalAccounts.filter(
    (account) => {
      const lastLogin =
        account.last_login_at ||
        account.last_login ||
        account.last_seen_at;

      return isWithinDays(lastLogin, 7);
    }
  ).length;

  const stalePortalAccounts = studentPortalAccounts.filter((account) => {
    const lastLogin =
      account.last_login_at ||
      account.last_login ||
      account.last_seen_at;

    return !lastLogin || !isWithinDays(lastLogin, 30);
  }).length;

  const openSupportRequests = supportRequests.filter((request) => {
    const status = toLower(
      request.status ||
      request.request_status
    );

    return (
      !status.includes("resolved") &&
      !status.includes("closed")
    );
  }).length;

  const escalatedSupportRequests = supportRequests.filter((request) => {
    const status = toLower(
      request.status ||
      request.request_status
    );
    const priority = toLower(
      request.priority ||
      request.severity
    );

    return (
      status.includes("escalated") ||
      priority.includes("urgent") ||
      priority.includes("high") ||
      priority.includes("critical")
    );
  }).length;

  const resolvedSupportRequests = supportRequests.filter((request) => {
    const status = toLower(
      request.status ||
      request.request_status
    );

    return (
      status.includes("resolved") ||
      status.includes("closed")
    );
  }).length;

  const failedExecutions = executiveExecutionLogs.filter((log) => {
    const status = toLower(
      log.status ||
      log.execution_status ||
      log.approval_status
    );
    const error =
      log.error_message ||
      log.error ||
      log.failure_reason;

    return (
      status.includes("failed") ||
      status.includes("error") ||
      Boolean(error)
    );
  }).length;

  const pendingAutomationApprovals = executiveExecutionLogs.filter(
    (log) => {
      const approval = toLower(
        log.approval_status ||
        log.status
      );

      return (
        approval.includes("pending") ||
        approval.includes("queued") ||
        approval.includes("waiting")
      );
    }
  ).length;

  const duplicateBlockedExecutions = executiveExecutionLogs.filter(
    (log) =>
      log.duplicate_detected ||
      log.duplicate_blocked
  ).length;

  const successfulExecutions = executiveExecutionLogs.filter((log) => {
    const status = toLower(
      log.status ||
      log.execution_status ||
      log.approval_status
    );

    return (
      status.includes("success") ||
      status.includes("executed") ||
      status.includes("completed") ||
      status.includes("approved")
    );
  }).length;

  const automationSuccessRate = percent(
    successfulExecutions,
    successfulExecutions + failedExecutions
  );

  const collectionRate =
    revenueMetrics?.collectionRate ??
    percent(paidValue, invoiceValue);

  const receiptApprovalRate =
    revenueMetrics?.receiptApprovalRate ??
    percent(
      approvedReceipts,
      studentReceipts.length
    );

  const portalActivationRate =
    portalUsageMetrics?.activationRate ??
    percent(
      studentPortalAccounts.length -
        inactivePortalAccounts,
      studentPortalAccounts.length
    );

  const portalActivityRate =
    portalUsageMetrics?.recentActivityRate ??
    percent(
      recentlyActivePortalAccounts,
      studentPortalAccounts.length
    );

  const supportResolutionRate = percent(
    resolvedSupportRequests,
    supportRequests.length
  );

  const roleLabel =
    {
      staff: "Staff View",
      admin: "Admin View",
      super_admin: "Super Admin View",
    }[role] || "Executive View";

  const crmAlerts = [
    {
      title: "New Inquiries",
      value: inquiryNewCount,
      text:
        inquiryNewCount === 1
          ? "Needs immediate follow-up"
          : "Need immediate follow-up",
      icon: Bell,
      color: "text-orange-700",
      tone: "gold",
      status:
        inquiryNewCount > 0
          ? "Attention Required"
          : "Stable",
      active: inquiryNewCount > 0,
      destination: "inquiries",
    },
    {
      title: "Pending Appointments",
      value: appointmentPendingCount,
      text:
        appointmentPendingCount === 1
          ? "Needs confirmation"
          : "Need confirmation",
      icon: Clock3,
      color: "text-orange-700",
      tone: "orange",
      status:
        appointmentPendingCount > 0
          ? "Pending Review"
          : "Stable",
      active: appointmentPendingCount > 0,
      destination: "appointments",
    },
    {
      title: "Confirmed Consultations",
      value: appointmentConfirmedCount,
      text:
        appointmentConfirmedCount === 1
          ? "Consultation ready"
          : "Consultations ready",
      icon: CheckCircle2,
      color: "text-emerald-700",
      tone: "green",
      status: "Operational",
      active: false,
      destination: "appointments",
    },
    {
      title: "Urgent Priority Leads",
      value: urgentPriorityCount,
      text:
        urgentPriorityCount === 1
          ? "VIP/high lead waiting"
          : "VIP/high leads waiting",
      icon: Crown,
      color: "text-violet-700",
      tone: "purple",
      status:
        urgentPriorityCount > 0
          ? "High Value Opportunity"
          : "Stable",
      active: urgentPriorityCount > 0,
      destination: "inquiries",
    },
    {
      title: "Assigned Leads",
      value: assignedLeadsCount,
      text: "Owned by team members",
      icon: Briefcase,
      color: "text-emerald-700",
      tone: "green",
      status: "Ownership",
      active: false,
      destination: "my-leads",
    },
    {
      title: "Open Lead Pool",
      value: unassignedLeadsCount,
      text:
        unassignedLeadsCount === 1
          ? "Lead still unassigned"
          : "Leads still unassigned",
      icon: Briefcase,
      color: "text-blue-700",
      tone: "cyan",
      status:
        unassignedLeadsCount > 0
          ? "Assignment Needed"
          : "Stable",
      active: unassignedLeadsCount > 0,
      destination: "inquiries",
    },
    {
      title: "Today Activity",
      value: todayActivityCount,
      text:
        todayActivityCount === 1
          ? "New CRM activity"
          : "New CRM activities",
      icon: Activity,
      color: "text-blue-700",
      tone: "blue",
      status: "Live Tracking",
      active: false,
      destination: "activity-logs",
    },
  ];

  const journeyAlerts = [
    {
      title: "Pending Applications",
      value: pendingApplications,
      text: "Applications needing movement",
      icon: GraduationCap,
      color: "text-blue-700",
      tone: "cyan",
      status:
        pendingApplications > 0
          ? "Application Pressure"
          : "Stable",
      active: pendingApplications > 0,
      destination: "analytics",
      analyticsSection: "mission-control",
    },
    {
      title: "Offers Received",
      value: offerReceived,
      text: "Offer decisions to manage",
      icon: CheckCircle2,
      color: "text-emerald-700",
      tone: "green",
      status:
        offerReceived > 0
          ? "Opportunity"
          : "Stable",
      active: false,
      destination: "analytics",
      analyticsSection: "mission-control",
    },
    {
      title: "CAS Delays",
      value: casDelayed,
      text: "Offer accepted but CAS not issued",
      icon: FileText,
      color: "text-blue-700",
      tone: "blue",
      status:
        casDelayed > 0
          ? "CAS Risk"
          : "Stable",
      active: casDelayed > 0,
      destination: "analytics",
      analyticsSection: "mission-control",
    },
    {
      title: "Visa Delays",
      value: visaDelayed,
      text: "CAS issued but visa not approved",
      icon: Plane,
      color: "text-emerald-700",
      tone: "green",
      status:
        visaDelayed > 0
          ? "Visa Risk"
          : "Stable",
      active: visaDelayed > 0,
      destination: "analytics",
      analyticsSection: "mission-control",
    },
    {
      title: "Pending Documents",
      value: pendingDocuments,
      text: "Documents waiting review",
      icon: FileText,
      color: "text-violet-700",
      tone: "purple",
      status:
        pendingDocuments > 0
          ? "Document Gap"
          : "Stable",
      active: pendingDocuments > 0,
      destination: "analytics",
      analyticsSection: "mission-control",
    },
    {
      title: "Pending Tasks",
      value: pendingTasks,
      text: "Tasks still open",
      icon: Clock3,
      color: "text-orange-700",
      tone: "orange",
      status:
        pendingTasks > 0
          ? "Task Pressure"
          : "Stable",
      active: pendingTasks > 0,
      destination: "followups",
    },
  ];

  const revenueAlerts = [
    {
      title: "Unpaid Invoices",
      value:
        revenueMetrics?.unpaidInvoicesCount ??
        unpaidInvoices,
      text: "Invoices still outstanding",
      icon: CreditCard,
      color: "text-orange-700",
      tone: "gold",
      status:
        unpaidInvoices > 0
          ? "Revenue Risk"
          : "Stable",
      active: unpaidInvoices > 0,
      destination: "analytics",
      analyticsSection: "mission-control",
    },
    {
      title: "Outstanding Revenue",
      value: formatMoney(
        revenueMetrics?.outstandingValue ??
          outstandingValue
      ),
      text: "Open balance",
      icon: WalletCards,
      color: "text-orange-700",
      tone: "orange",
      status:
        outstandingValue > 0
          ? "Collection Needed"
          : "Stable",
      active: outstandingValue > 0,
      destination: "analytics",
      analyticsSection: "mission-control",
    },
    {
      title: "Collection Rate",
      value: `${collectionRate}%`,
      text: "Paid against invoiced",
      icon: BarChart3,
      color:
        collectionRate >= 70
          ? "text-emerald-700"
          : "text-orange-700",
      tone:
        collectionRate >= 70
          ? "green"
          : "orange",
      status:
        collectionRate >= 70
          ? "Healthy"
          : "Needs Focus",
      active:
        collectionRate < 70 &&
        invoiceValue > 0,
      destination: "analytics",
      analyticsSection: "mission-control",
    },
    {
      title: "Pending Receipts",
      value:
        revenueMetrics?.pendingReceiptsCount ??
        pendingReceipts,
      text: "Receipts waiting approval",
      icon: Receipt,
      color: "text-blue-700",
      tone: "blue",
      status:
        pendingReceipts > 0
          ? "Approval Needed"
          : "Stable",
      active: pendingReceipts > 0,
      destination: "analytics",
      analyticsSection: "mission-control",
    },
    {
      title: "Receipt Approval",
      value: `${receiptApprovalRate}%`,
      text: "Receipt workflow health",
      icon: CheckCircle2,
      color:
        receiptApprovalRate >= 70
          ? "text-emerald-700"
          : "text-violet-700",
      tone:
        receiptApprovalRate >= 70
          ? "green"
          : "purple",
      status:
        receiptApprovalRate >= 70
          ? "Healthy"
          : "Pending Review",
      active:
        receiptApprovalRate < 70 &&
        studentReceipts.length > 0,
      destination: "analytics",
      analyticsSection: "mission-control",
    },
    {
      title: "Payment Requests",
      value: counselorPaymentRequests.length,
      text: "Counselor payment requests",
      icon: CreditCard,
      color: "text-blue-700",
      tone: "cyan",
      status:
        counselorPaymentRequests.length > 0
          ? "Queue Active"
          : "Stable",
      active:
        counselorPaymentRequests.length > 0,
      destination: "analytics",
      analyticsSection: "mission-control",
    },
  ];

  const portalSupportAlerts = [
    {
      title: "Portal Activation",
      value: `${portalActivationRate}%`,
      text: "Active student accounts",
      icon: Radio,
      color:
        portalActivationRate >= 70
          ? "text-emerald-700"
          : "text-orange-700",
      tone:
        portalActivationRate >= 70
          ? "green"
          : "orange",
      status:
        portalActivationRate >= 70
          ? "Healthy"
          : "Access Gap",
      active:
        portalActivationRate < 70 &&
        studentPortalAccounts.length > 0,
      destination: "analytics",
      analyticsSection: "mission-control",
    },
    {
      title: "7-Day Portal Activity",
      value: `${portalActivityRate}%`,
      text: "Recently active users",
      icon: Activity,
      color:
        portalActivityRate >= 40
          ? "text-blue-700"
          : "text-orange-700",
      tone:
        portalActivityRate >= 40
          ? "cyan"
          : "orange",
      status:
        portalActivityRate >= 40
          ? "Engaged"
          : "Low Activity",
      active:
        portalActivityRate < 40 &&
        studentPortalAccounts.length > 0,
      destination: "analytics",
      analyticsSection: "mission-control",
    },
    {
      title: "Password Resets",
      value: passwordResetRequired,
      text: "Students must change password",
      icon: LockKeyhole,
      color: "text-orange-700",
      tone: "orange",
      status:
        passwordResetRequired > 0
          ? "Portal Action"
          : "Stable",
      active: passwordResetRequired > 0,
      destination: "analytics",
      analyticsSection: "mission-control",
    },
    {
      title: "Stale Portal Accounts",
      value: stalePortalAccounts,
      text: "No login in 30 days",
      icon: LockKeyhole,
      color: "text-red-700",
      tone: "red",
      status:
        stalePortalAccounts > 0
          ? "Engagement Risk"
          : "Stable",
      active: stalePortalAccounts > 0,
      destination: "analytics",
      analyticsSection: "mission-control",
    },
    {
      title: "Open Support Requests",
      value: openSupportRequests,
      text: "Student support queue",
      icon: Headphones,
      color: "text-blue-700",
      tone: "cyan",
      status:
        openSupportRequests > 0
          ? "Support Queue"
          : "Stable",
      active: openSupportRequests > 0,
      destination: "analytics",
      analyticsSection: "mission-control",
    },
    {
      title: "Escalated Support",
      value: escalatedSupportRequests,
      text: "Urgent support cases",
      icon: ShieldAlert,
      color: "text-red-700",
      tone: "red",
      status:
        escalatedSupportRequests > 0
          ? "Escalated"
          : "Stable",
      active:
        escalatedSupportRequests > 0,
      destination: "analytics",
      analyticsSection: "mission-control",
    },
    {
      title: "Support Resolution",
      value: `${supportResolutionRate}%`,
      text: "Resolved support history",
      icon: CheckCircle2,
      color:
        supportResolutionRate >= 70
          ? "text-emerald-700"
          : "text-orange-700",
      tone:
        supportResolutionRate >= 70
          ? "green"
          : "orange",
      status:
        supportResolutionRate >= 70
          ? "Healthy"
          : "Response Needed",
      active:
        supportResolutionRate < 70 &&
        supportRequests.length > 0,
      destination: "analytics",
      analyticsSection: "mission-control",
    },
  ];

  const automationAlerts = [
    {
      title: "Execution Logs",
      value: executiveExecutionLogs.length,
      text: "Automation history",
      icon: Zap,
      color: "text-blue-700",
      tone: "cyan",
      status: "Live",
      active: false,
      destination: "automation",
    },
    {
      title: "Automation Success",
      value: `${automationSuccessRate}%`,
      text: "Successful execution rate",
      icon: CheckCircle2,
      color:
        automationSuccessRate >= 70
          ? "text-emerald-700"
          : "text-orange-700",
      tone:
        automationSuccessRate >= 70
          ? "green"
          : "orange",
      status:
        automationSuccessRate >= 70
          ? "Healthy"
          : "Needs Recovery",
      active:
        automationSuccessRate < 70 &&
        executiveExecutionLogs.length > 0,
      destination: "automation",
    },
    {
      title: "Failed Executions",
      value: failedExecutions,
      text: "Needs investigation",
      icon: AlertTriangle,
      color: "text-red-700",
      tone: "red",
      status:
        failedExecutions > 0
          ? "Recovery Needed"
          : "Stable",
      active: failedExecutions > 0,
      destination: "automation",
    },
    {
      title: "Pending Approvals",
      value: pendingAutomationApprovals,
      text: "Human approval queue",
      icon: Clock3,
      color: "text-orange-700",
      tone: "orange",
      status:
        pendingAutomationApprovals > 0
          ? "Approval Queue"
          : "Stable",
      active: pendingAutomationApprovals > 0,
      destination: "automation",
    },
    {
      title: "Duplicates Blocked",
      value: duplicateBlockedExecutions,
      text: "Protection monitor",
      icon: ShieldAlert,
      color: "text-blue-700",
      tone: "blue",
      status:
        duplicateBlockedExecutions > 0
          ? "Protected"
          : "Stable",
      active: false,
      destination: "automation",
    },
  ];

  const executiveAlerts = [
    {
      title: "High Risk Students",
      value: highRiskStudents,
      text: "Executive AI risk queue",
      icon: AlertTriangle,
      color: "text-red-700",
      tone: "red",
      status:
        highRiskStudents > 0
          ? "Executive Risk"
          : "Stable",
      active: highRiskStudents > 0,
      destination: "analytics",
      analyticsSection: "ai-executive",
    },
    {
      title: "Critical Risk Students",
      value: criticalRiskStudents,
      text: "Immediate intervention needed",
      icon: ShieldAlert,
      color: "text-red-700",
      tone: "red",
      status:
        criticalRiskStudents > 0
          ? "Critical"
          : "Stable",
      active: criticalRiskStudents > 0,
      destination: "analytics",
      analyticsSection: "ai-executive",
    },
    {
      title: "University Plans",
      value: studentUniversities.length,
      text: "Dream / target / safe planning",
      icon: GraduationCap,
      color: "text-violet-700",
      tone: "purple",
      status:
        studentUniversities.length > 0
          ? "Operational"
          : "Waiting",
      active: false,
      destination: "analytics",
      analyticsSection: "mission-control",
    },
    {
      title: "Student OS Systems",
      value:
        studentApplications.length +
        studentDocuments.length +
        studentTasks.length +
        studentUniversities.length,
      text: "Connected operating records",
      icon: Activity,
      color: "text-orange-700",
      tone: "gold",
      status: "Live System",
      active: false,
      destination: "analytics",
      analyticsSection: "mission-control",
    },
  ];

  const allAlerts = [
    ...crmAlerts,
    ...journeyAlerts,
    ...revenueAlerts,
    ...portalSupportAlerts,
    ...automationAlerts,
    ...executiveAlerts,
  ];

  const visibleAlerts = (alerts) =>
    alerts.filter(
      (item) =>
        !dismissedIds.includes(makeAlertId(item))
    );

  const activeVisibleAlerts = allAlerts.filter(
    (item) =>
      item.active &&
      !dismissedIds.includes(makeAlertId(item))
  );

  const totalActiveAlerts =
    notificationMetrics?.totalAlerts ??
    activeVisibleAlerts.length;

  const activePaymentAlerts =
    notificationMetrics?.paymentAlerts ??
    visibleAlerts(revenueAlerts).filter(
      (item) => item.active
    ).length;

  const activeVisaAlerts =
    notificationMetrics?.visaAlerts ??
    visibleAlerts(journeyAlerts)
      .filter(
        (item) =>
          item.title.includes("CAS") ||
          item.title.includes("Visa")
      )
      .filter((item) => item.active).length;

  const activePortalAlerts =
    notificationMetrics?.portalAlerts ??
    visibleAlerts(portalSupportAlerts)
      .filter(
        (item) =>
          item.title.includes("Portal") ||
          item.title.includes("Password") ||
          item.title.includes("Stale")
      )
      .filter((item) => item.active).length;

  const activeSupportAlerts =
    notificationMetrics?.supportAlerts ??
    visibleAlerts(portalSupportAlerts)
      .filter((item) =>
        item.title.includes("Support")
      )
      .filter((item) => item.active).length;

  const activeAutomationAlerts =
    notificationMetrics?.automationAlerts ??
    visibleAlerts(automationAlerts).filter(
      (item) => item.active
    ).length;

  const commandSummary = [
    {
      title: "Payment Alerts",
      value: activePaymentAlerts,
      icon: CreditCard,
      tone:
        activePaymentAlerts > 0
          ? "gold"
          : "green",
    },
    {
      title: "Visa Alerts",
      value: activeVisaAlerts,
      icon: Plane,
      tone:
        activeVisaAlerts > 0
          ? "orange"
          : "green",
    },
    {
      title: "Portal Alerts",
      value: activePortalAlerts,
      icon: LockKeyhole,
      tone:
        activePortalAlerts > 0
          ? "orange"
          : "green",
    },
    {
      title: "Support Alerts",
      value: activeSupportAlerts,
      icon: Headphones,
      tone:
        activeSupportAlerts > 0
          ? "red"
          : "green",
    },
    {
      title: "Automation Alerts",
      value: activeAutomationAlerts,
      icon: Zap,
      tone:
        activeAutomationAlerts > 0
          ? "red"
          : "green",
    },
  ];

  const markRead = (item) => {
    const id = makeAlertId(item);

    setReadIds((current) =>
      current.includes(id)
        ? current
        : [...current, id]
    );

    if (typeof onMarkRead === "function") {
      onMarkRead(item);
    }

    setActionNotice(`${item.title} marked as read.`);
  };

  const dismissAlert = (item) => {
    const id = makeAlertId(item);

    setDismissedIds((current) =>
      current.includes(id)
        ? current
        : [...current, id]
    );

    if (typeof onDismissAlert === "function") {
      onDismissAlert(item);
    }

    setActionNotice(`${item.title} dismissed for this session.`);
  };

  const openAlert = (item) => {
    if (typeof onOpenAlert === "function") {
      onOpenAlert(item);
      return;
    }

    const destination = resolveDestination(item);

    if (typeof setActiveTab === "function") {
      setActiveTab(destination);

      if (
        destination === "analytics" &&
        typeof setActiveAnalyticsSection === "function"
      ) {
        setActiveAnalyticsSection(
          item.analyticsSection ||
            "mission-control"
        );
      }

      setActionNotice(`Opening ${item.title}.`);
      return;
    }

    setActionNotice(
      "This alert is ready, but AdminPage must pass setActiveTab to enable workspace navigation."
    );
  };

  const createFollowUp = (item) => {
    if (typeof onCreateFollowUp === "function") {
      onCreateFollowUp(item);
      return;
    }

    if (typeof setActiveTab === "function") {
      setActiveTab("followups");
      setActionNotice(
        `Opening Follow-ups for ${item.title}.`
      );
      return;
    }

    setActionNotice(
      "Follow-up workspace is not connected to this component yet."
    );
  };

  return (
    <div className="mb-5 space-y-5 rounded-[2rem] border-[3px] border-orange-300 bg-[#fff3e5] p-3 shadow-[0_18px_45px_rgba(16,43,76,0.08)] sm:p-4 xl:mb-6">
      <div className="relative overflow-hidden rounded-[1.8rem] border-[3px] border-orange-400 bg-[#123865] p-5 text-white shadow-[0_14px_34px_rgba(15,35,63,0.18)]">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-orange-500/20 via-transparent to-[#0b2a57]/45" />
        <div className="pointer-events-none absolute -right-24 -top-28 h-72 w-72 rounded-full bg-orange-400/20 blur-3xl" />

        <div className="relative flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-orange-300/80 bg-orange-500/15 px-3 py-1.5">
              <span className="h-2 w-2 rounded-full bg-orange-400" />

              <p className="text-[10px] font-black uppercase tracking-[0.25em] text-orange-200">
                Executive Notification Center
              </p>
            </div>

            <h2 className="mt-3 text-2xl font-black tracking-tight text-white sm:text-3xl">
              CRM + Student OS Alert Command Center
            </h2>

            <p className="mt-2 max-w-4xl text-sm font-semibold leading-6 text-white/85">
              Live alert intelligence across CRM, student journey, finance,
              portal access, support, documents, tasks, executive risk, and
              automation health.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Badge dark>{roleLabel}</Badge>

            {permissions?.canManageAdmins && (
              <Badge dark tone="orange">
                Full Access
              </Badge>
            )}

            <Badge
              dark
              tone={
                totalActiveAlerts > 0
                  ? "red"
                  : "green"
              }
            >
              {totalActiveAlerts} Active Alerts
            </Badge>

            <Badge dark tone="green">
              Live System
            </Badge>
          </div>
        </div>
      </div>

      {actionNotice ? (
        <div className="rounded-[1.25rem] border-2 border-orange-300 bg-orange-50 px-4 py-3 text-sm font-bold text-[#10233f] shadow-sm">
          {actionNotice}
        </div>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {commandSummary.map((item, index) => (
          <CommandSummaryCard
            key={item.title}
            item={item}
            index={index}
            cardClass={cardClass}
          />
        ))}
      </div>

      <AlertSection
        title="CRM Alerts"
        eyebrow="Lead Operations"
        alerts={visibleAlerts(crmAlerts)}
        cardClass={cardClass}
        readIds={readIds}
        onOpenAlert={openAlert}
        onCreateFollowUp={createFollowUp}
        onMarkRead={markRead}
        onDismissAlert={dismissAlert}
      />

      <AlertSection
        title="Student Journey Alerts"
        eyebrow="Applications • CAS • Visa"
        alerts={visibleAlerts(journeyAlerts)}
        cardClass={cardClass}
        readIds={readIds}
        onOpenAlert={openAlert}
        onCreateFollowUp={createFollowUp}
        onMarkRead={markRead}
        onDismissAlert={dismissAlert}
      />

      <AlertSection
        title="Revenue Alerts"
        eyebrow="Payments • Receipts • Collection"
        alerts={visibleAlerts(revenueAlerts)}
        cardClass={cardClass}
        readIds={readIds}
        onOpenAlert={openAlert}
        onCreateFollowUp={createFollowUp}
        onMarkRead={markRead}
        onDismissAlert={dismissAlert}
      />

      <div className="grid gap-5 2xl:grid-cols-2">
        <AlertSection
          title="Portal + Support Alerts"
          eyebrow="Student Portal • Support Center"
          alerts={visibleAlerts(portalSupportAlerts)}
          cardClass={cardClass}
          compact
          readIds={readIds}
          onOpenAlert={openAlert}
          onCreateFollowUp={createFollowUp}
          onMarkRead={markRead}
          onDismissAlert={dismissAlert}
        />

        <AlertSection
          title="Automation Alerts"
          eyebrow="Executive Automation • Approvals • Recovery"
          alerts={visibleAlerts(automationAlerts)}
          cardClass={cardClass}
          compact
          readIds={readIds}
          onOpenAlert={openAlert}
          onCreateFollowUp={createFollowUp}
          onMarkRead={markRead}
          onDismissAlert={dismissAlert}
        />
      </div>

      <AlertSection
        title="Executive Alerts"
        eyebrow="Risk • University Plans • System Health"
        alerts={visibleAlerts(executiveAlerts)}
        cardClass={cardClass}
        readIds={readIds}
        onOpenAlert={openAlert}
        onCreateFollowUp={createFollowUp}
        onMarkRead={markRead}
        onDismissAlert={dismissAlert}
      />
    </div>
  );
}

function AlertSection({
  title,
  eyebrow,
  alerts,
  cardClass,
  compact = false,
  readIds,
  onOpenAlert,
  onCreateFollowUp,
  onMarkRead,
  onDismissAlert,
}) {
  const activeCount = alerts.filter(
    (item) => item.active
  ).length;

  return (
    <section className="overflow-hidden rounded-[1.75rem] border-[3px] border-[#234e78] bg-[#fff9f2] shadow-[0_10px_24px_rgba(15,35,63,0.07)]">
      <div className="flex flex-col gap-2 border-b-[3px] border-orange-400 bg-[#123865] px-5 py-4 text-white sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-orange-300">
            {eyebrow}
          </p>

          <h3 className="mt-1 text-xl font-black text-white">
            {title}
          </h3>
        </div>

        <p className="text-xs font-bold text-white/75">
          {activeCount} requiring attention
        </p>
      </div>

      <div className="p-4 sm:p-5">
        {alerts.length ? (
          <div
            className={`grid gap-4 ${
              compact
                ? "grid-cols-1"
                : "md:grid-cols-2 2xl:grid-cols-3"
            }`}
          >
            {alerts.map((item, index) => (
              <NotificationCard
                key={item.title}
                item={item}
                index={index}
                cardClass={cardClass}
                isRead={readIds.includes(
                  makeAlertId(item)
                )}
                onOpenAlert={onOpenAlert}
                onCreateFollowUp={onCreateFollowUp}
                onMarkRead={onMarkRead}
                onDismissAlert={onDismissAlert}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-[1.4rem] border-2 border-dashed border-emerald-300 bg-emerald-50 p-5 text-center">
            <p className="font-black text-emerald-800">
              No visible alerts in this section
            </p>
            <p className="mt-1 text-xs font-semibold text-emerald-700">
              Dismissed alerts stay hidden for this browser session.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}

function CommandSummaryCard({
  item,
  index,
  cardClass,
}) {
  const Icon = item.icon;
  const tone = getToneClass(
    item.tone,
    item.value > 0
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.25,
        delay: index * 0.04,
      }}
      className={`${cardClass} rounded-[1.5rem] border-2 ${tone.border} ${tone.bg} p-4 shadow-[0_7px_18px_rgba(15,35,63,0.06)]`}
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#5e7087]">
            {item.title}
          </p>

          <p
            className={`mt-2 text-3xl font-black ${tone.text}`}
          >
            {item.value}
          </p>
        </div>

        <div
          className={`flex h-12 w-12 items-center justify-center rounded-2xl border-2 ${tone.border} bg-white/75`}
        >
          <Icon
            className={`h-5 w-5 ${tone.text}`}
          />
        </div>
      </div>
    </motion.div>
  );
}

function NotificationCard({
  item,
  index,
  cardClass,
  isRead,
  onOpenAlert,
  onCreateFollowUp,
  onMarkRead,
  onDismissAlert,
}) {
  const Icon = item.icon;
  const tone = getToneClass(
    item.tone,
    item.active
  );

  return (
    <motion.article
      initial={{ opacity: 0, y: 22 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.32,
        delay: index * 0.035,
      }}
      className={`${cardClass} ${tone.glow} group relative min-h-[300px] overflow-hidden rounded-[1.65rem] border-[3px] ${tone.bg} p-5 shadow-[0_8px_22px_rgba(15,35,63,0.06)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_12px_30px_rgba(15,35,63,0.10)]`}
      style={{ borderColor: tone.borderColor }}
    >
      <div
        className={`absolute inset-x-0 top-0 h-1.5 ${tone.bar}`}
      />

      <div className="flex items-start justify-between gap-4">
        <div
          className={`relative flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border-2 ${tone.border} bg-white/80`}
        >
          {item.active && !isRead ? (
            <span className="absolute right-1 top-1 h-2.5 w-2.5 rounded-full bg-red-500 shadow-[0_0_0_4px_rgba(239,68,68,0.12)]" />
          ) : null}

          <Icon
            className={`h-5 w-5 ${item.color}`}
          />
        </div>

        <div
          className={`rounded-full border-2 px-3 py-1 text-[9px] font-black uppercase tracking-[0.15em] ${
            isRead
              ? "border-slate-300 bg-slate-100 text-slate-500"
              : item.active
              ? "border-orange-300 bg-orange-50 text-orange-800"
              : "border-[#b9c9da] bg-[#edf4fb] text-[#34516f]"
          }`}
        >
          {isRead ? "Read" : item.status}
        </div>
      </div>

      <div className="mt-4">
        <p className="text-[10px] font-black uppercase tracking-[0.20em] text-[#60728a]">
          {item.title}
        </p>

        <div className="mt-2 flex flex-wrap items-end gap-3">
          <h3
            className={`text-4xl font-black leading-none ${item.color}`}
          >
            {item.value}
          </h3>

          <p className="pb-1 text-sm font-semibold text-[#425b76]">
            {item.text}
          </p>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-2 xl:grid-cols-4 2xl:grid-cols-2">
        <ActionButton
          label="Open"
          Icon={ExternalLink}
          onClick={() => onOpenAlert(item)}
          tone="navy"
        />

        <ActionButton
          label="Follow-up"
          Icon={Plus}
          onClick={() =>
            onCreateFollowUp(item)
          }
          tone="orange"
        />

        <ActionButton
          label={isRead ? "Read" : "Mark read"}
          Icon={CheckCircle2}
          onClick={() => onMarkRead(item)}
          tone="green"
          disabled={isRead}
        />

        <ActionButton
          label="Dismiss"
          Icon={X}
          onClick={() => onDismissAlert(item)}
          tone="red"
        />
      </div>

      {item.active ? (
        <div className="mt-4 rounded-[1.1rem] border-2 border-orange-300 bg-[#fff3e5] p-3">
          <div className="flex items-start gap-2">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-orange-700" />

            <p className="text-xs font-semibold leading-5 text-[#334d6a]">
              Active operational attention is required in this category.
            </p>
          </div>
        </div>
      ) : null}
    </motion.article>
  );
}

function ActionButton({
  label,
  Icon,
  onClick,
  tone = "navy",
  disabled = false,
}) {
  const tones = {
    navy:
      "border-[#234e78] bg-[#123865] text-white hover:bg-[#0d2d50]",
    orange:
      "border-orange-500 bg-orange-500 text-white hover:bg-orange-600",
    green:
      "border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100",
    red:
      "border-red-300 bg-red-50 text-red-800 hover:bg-red-100",
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex min-h-10 items-center justify-center gap-2 whitespace-nowrap rounded-xl border-2 px-3.5 py-2.5 text-[10px] font-black uppercase tracking-[0.10em] transition duration-200 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-orange-200 disabled:cursor-not-allowed disabled:opacity-45 ${
        tones[tone] || tones.navy
      }`}
    >
      <Icon className="h-3.5 w-3.5" />
      <span>{label}</span>
    </button>
  );
}

function Badge({
  children,
  tone = "default",
  dark = false,
}) {
  const darkTone =
    tone === "red"
      ? "border-red-300/70 bg-red-500/15 text-white"
      : tone === "green"
      ? "border-emerald-300/70 bg-emerald-500/15 text-white"
      : tone === "orange"
      ? "border-orange-300/80 bg-orange-500/20 text-white"
      : "border-white/30 bg-white/10 text-white";

  const lightTone =
    tone === "red"
      ? "border-red-300 bg-red-50 text-red-700"
      : tone === "green"
      ? "border-emerald-300 bg-emerald-50 text-emerald-700"
      : tone === "orange"
      ? "border-orange-300 bg-orange-50 text-orange-700"
      : "border-[#b9c9da] bg-[#edf4fb] text-[#34516f]";

  return (
    <div
      className={`rounded-full border-2 px-4 py-2 text-[10px] font-black uppercase tracking-[0.16em] ${
        dark ? darkTone : lightTone
      }`}
    >
      {children}
    </div>
  );
}

function getToneClass(
  tone = "gold",
  active = false
) {
  const toneMap = {
    gold: {
      borderColor: "#fb923c",
      bg: active ? "bg-orange-50" : "bg-[#fff8ef]",
      glow: active
        ? "shadow-[0_0_32px_rgba(249,115,22,0.10)]"
        : "",
      text: "text-orange-700",
      bar: "bg-orange-500",
    },

    orange: {
      borderColor: "#fb923c",
      bg: active ? "bg-[#fff3e5]" : "bg-[#fff8ef]",
      glow: active
        ? "shadow-[0_0_32px_rgba(251,146,60,0.10)]"
        : "",
      text: "text-orange-700",
      bar: "bg-orange-500",
    },

    green: {
      borderColor: "#34d399",
      bg: active ? "bg-emerald-50" : "bg-[#f1fcf7]",
      glow: active
        ? "shadow-[0_0_32px_rgba(16,185,129,0.08)]"
        : "",
      text: "text-emerald-700",
      bar: "bg-emerald-500",
    },

    red: {
      borderColor: "#f87171",
      bg: active ? "bg-red-50" : "bg-[#fff5f5]",
      glow: active
        ? "shadow-[0_0_32px_rgba(239,68,68,0.10)]"
        : "",
      text: "text-red-700",
      bar: "bg-red-500",
    },

    purple: {
      borderColor: "#a78bfa",
      bg: active ? "bg-violet-50" : "bg-[#faf7ff]",
      glow: active
        ? "shadow-[0_0_32px_rgba(139,92,246,0.08)]"
        : "",
      text: "text-violet-700",
      bar: "bg-violet-500",
    },

    cyan: {
      borderColor: "#60a5fa",
      bg: active ? "bg-blue-50" : "bg-[#f3f8ff]",
      glow: active
        ? "shadow-[0_0_32px_rgba(59,130,246,0.08)]"
        : "",
      text: "text-blue-700",
      bar: "bg-blue-500",
    },

    blue: {
      borderColor: "#60a5fa",
      bg: active ? "bg-blue-50" : "bg-[#f3f8ff]",
      glow: active
        ? "shadow-[0_0_32px_rgba(59,130,246,0.08)]"
        : "",
      text: "text-blue-700",
      bar: "bg-blue-500",
    },
  };

  return toneMap[tone] || toneMap.gold;
}

export default NotificationCenter;
