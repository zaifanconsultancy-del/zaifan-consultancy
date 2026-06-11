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
  FileText,
  Plane,
  CreditCard,
  Receipt,
  LockKeyhole,
  Headphones,
  ShieldAlert,
  GraduationCap,
  Zap,
  BarChart3,
  Radio,
  WalletCards,
} from "lucide-react";

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
}) {
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
    return (offer.includes("accepted") || offer.includes("firm")) && !cas.includes("issued");
  }).length;

  const visaDelayed = studentApplications.filter((app) => {
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

  const criticalRiskStudents = studentRiskScores.filter((risk) => {
    const score = Number(risk.risk_score || risk.score || risk.overall_score || 0);
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
    const outstanding = Number(invoice.outstanding_amount || invoice.balance || 0);

    if (status.includes("paid") || status.includes("complete")) return sum;
    return sum + (outstanding || amount);
  }, 0);

  const pendingReceipts = studentReceipts.filter((receipt) => {
    const status = toLower(
      receipt.status || receipt.receipt_status || receipt.approval_status
    );
    return !status.includes("approved") && !status.includes("rejected");
  }).length;

  const approvedReceipts = studentReceipts.filter((receipt) => {
    const status = toLower(
      receipt.status || receipt.receipt_status || receipt.approval_status
    );
    return status.includes("approved");
  }).length;

  const passwordResetRequired = studentPortalAccounts.filter(
    (account) => account.must_change_password || account.force_password_change
  ).length;

  const inactivePortalAccounts = studentPortalAccounts.filter((account) => {
    const active = account.is_active ?? account.active ?? account.status;
    if (typeof active === "boolean") return !active;
    return ["inactive", "disabled", "blocked", "false"].includes(toLower(active));
  }).length;

  const recentlyActivePortalAccounts = studentPortalAccounts.filter((account) => {
    const lastLogin = account.last_login_at || account.last_login || account.last_seen_at;
    return isWithinDays(lastLogin, 7);
  }).length;

  const stalePortalAccounts = studentPortalAccounts.filter((account) => {
    const lastLogin = account.last_login_at || account.last_login || account.last_seen_at;
    return !lastLogin || !isWithinDays(lastLogin, 30);
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

  const resolvedSupportRequests = supportRequests.filter((request) => {
    const status = toLower(request.status || request.request_status);
    return status.includes("resolved") || status.includes("closed");
  }).length;

  const failedExecutions = executiveExecutionLogs.filter((log) => {
    const status = toLower(log.status || log.execution_status || log.approval_status);
    const error = log.error_message || log.error || log.failure_reason;
    return status.includes("failed") || status.includes("error") || Boolean(error);
  }).length;

  const pendingAutomationApprovals = executiveExecutionLogs.filter((log) => {
    const approval = toLower(log.approval_status || log.status);
    return (
      approval.includes("pending") ||
      approval.includes("queued") ||
      approval.includes("waiting")
    );
  }).length;

  const duplicateBlockedExecutions = executiveExecutionLogs.filter(
    (log) => log.duplicate_detected || log.duplicate_blocked
  ).length;

  const successfulExecutions = executiveExecutionLogs.filter((log) => {
    const status = toLower(log.status || log.execution_status || log.approval_status);
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
    revenueMetrics?.collectionRate ?? percent(paidValue, invoiceValue);

  const receiptApprovalRate =
    revenueMetrics?.receiptApprovalRate ??
    percent(approvedReceipts, studentReceipts.length);

  const portalActivationRate =
    portalUsageMetrics?.activationRate ??
    percent(
      studentPortalAccounts.length - inactivePortalAccounts,
      studentPortalAccounts.length
    );

  const portalActivityRate =
    portalUsageMetrics?.recentActivityRate ??
    percent(recentlyActivePortalAccounts, studentPortalAccounts.length);

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
      text: inquiryNewCount === 1 ? "Needs immediate follow-up" : "Need immediate follow-up",
      icon: Bell,
      color: "text-[#D4AF37]",
      tone: "gold",
      status: inquiryNewCount > 0 ? "Attention Required" : "Stable",
      active: inquiryNewCount > 0,
    },
    {
      title: "Pending Appointments",
      value: appointmentPendingCount,
      text: appointmentPendingCount === 1 ? "Needs confirmation" : "Need confirmation",
      icon: Clock3,
      color: "text-orange-300",
      tone: "orange",
      status: appointmentPendingCount > 0 ? "Pending Review" : "Stable",
      active: appointmentPendingCount > 0,
    },
    {
      title: "Confirmed Consultations",
      value: appointmentConfirmedCount,
      text: appointmentConfirmedCount === 1 ? "Consultation ready" : "Consultations ready",
      icon: CheckCircle2,
      color: "text-green-400",
      tone: "green",
      status: "Operational",
      active: false,
    },
    {
      title: "Urgent Priority Leads",
      value: urgentPriorityCount,
      text: urgentPriorityCount === 1 ? "VIP/high lead waiting" : "VIP/high leads waiting",
      icon: Crown,
      color: "text-purple-300",
      tone: "purple",
      status: urgentPriorityCount > 0 ? "High Value Opportunity" : "Stable",
      active: urgentPriorityCount > 0,
    },
    {
      title: "Assigned Leads",
      value: assignedLeadsCount,
      text: "Owned by team members",
      icon: Briefcase,
      color: "text-green-300",
      tone: "green",
      status: "Ownership",
      active: false,
    },
    {
      title: "Open Lead Pool",
      value: unassignedLeadsCount,
      text: unassignedLeadsCount === 1 ? "Lead still unassigned" : "Leads still unassigned",
      icon: Briefcase,
      color: "text-cyan-300",
      tone: "cyan",
      status: unassignedLeadsCount > 0 ? "Assignment Needed" : "Stable",
      active: unassignedLeadsCount > 0,
    },
    {
      title: "Today Activity",
      value: todayActivityCount,
      text: todayActivityCount === 1 ? "New CRM activity" : "New CRM activities",
      icon: Activity,
      color: "text-blue-300",
      tone: "blue",
      status: "Live Tracking",
      active: false,
    },
  ];

  const journeyAlerts = [
    {
      title: "Pending Applications",
      value: pendingApplications,
      text: "Applications needing movement",
      icon: GraduationCap,
      color: "text-cyan-300",
      tone: "cyan",
      status: pendingApplications > 0 ? "Application Pressure" : "Stable",
      active: pendingApplications > 0,
    },
    {
      title: "Offers Received",
      value: offerReceived,
      text: "Offer decisions to manage",
      icon: CheckCircle2,
      color: "text-green-300",
      tone: "green",
      status: offerReceived > 0 ? "Opportunity" : "Stable",
      active: false,
    },
    {
      title: "CAS Delays",
      value: casDelayed,
      text: "Offer accepted but CAS not issued",
      icon: FileText,
      color: "text-blue-300",
      tone: "blue",
      status: casDelayed > 0 ? "CAS Risk" : "Stable",
      active: casDelayed > 0,
    },
    {
      title: "Visa Delays",
      value: visaDelayed,
      text: "CAS issued but visa not approved",
      icon: Plane,
      color: "text-emerald-300",
      tone: "green",
      status: visaDelayed > 0 ? "Visa Risk" : "Stable",
      active: visaDelayed > 0,
    },
    {
      title: "Pending Documents",
      value: pendingDocuments,
      text: "Documents waiting review",
      icon: FileText,
      color: "text-purple-300",
      tone: "purple",
      status: pendingDocuments > 0 ? "Document Gap" : "Stable",
      active: pendingDocuments > 0,
    },
    {
      title: "Pending Tasks",
      value: pendingTasks,
      text: "Tasks still open",
      icon: Clock3,
      color: "text-orange-300",
      tone: "orange",
      status: pendingTasks > 0 ? "Task Pressure" : "Stable",
      active: pendingTasks > 0,
    },
  ];

  const revenueAlerts = [
    {
      title: "Unpaid Invoices",
      value: revenueMetrics?.unpaidInvoicesCount ?? unpaidInvoices,
      text: "Invoices still outstanding",
      icon: CreditCard,
      color: "text-[#D4AF37]",
      tone: "gold",
      status: unpaidInvoices > 0 ? "Revenue Risk" : "Stable",
      active: unpaidInvoices > 0,
    },
    {
      title: "Outstanding Revenue",
      value: formatMoney(revenueMetrics?.outstandingValue ?? outstandingValue),
      text: "Open balance",
      icon: WalletCards,
      color: "text-orange-300",
      tone: "orange",
      status: outstandingValue > 0 ? "Collection Needed" : "Stable",
      active: outstandingValue > 0,
    },
    {
      title: "Collection Rate",
      value: `${collectionRate}%`,
      text: "Paid against invoiced",
      icon: BarChart3,
      color: collectionRate >= 70 ? "text-green-300" : "text-orange-300",
      tone: collectionRate >= 70 ? "green" : "orange",
      status: collectionRate >= 70 ? "Healthy" : "Needs Focus",
      active: collectionRate < 70 && invoiceValue > 0,
    },
    {
      title: "Pending Receipts",
      value: revenueMetrics?.pendingReceiptsCount ?? pendingReceipts,
      text: "Receipts waiting approval",
      icon: Receipt,
      color: "text-blue-300",
      tone: "blue",
      status: pendingReceipts > 0 ? "Approval Needed" : "Stable",
      active: pendingReceipts > 0,
    },
    {
      title: "Receipt Approval",
      value: `${receiptApprovalRate}%`,
      text: "Receipt workflow health",
      icon: CheckCircle2,
      color: receiptApprovalRate >= 70 ? "text-green-300" : "text-purple-300",
      tone: receiptApprovalRate >= 70 ? "green" : "purple",
      status: receiptApprovalRate >= 70 ? "Healthy" : "Pending Review",
      active: receiptApprovalRate < 70 && studentReceipts.length > 0,
    },
    {
      title: "Payment Requests",
      value: counselorPaymentRequests.length,
      text: "Counselor payment requests",
      icon: CreditCard,
      color: "text-cyan-300",
      tone: "cyan",
      status: counselorPaymentRequests.length > 0 ? "Queue Active" : "Stable",
      active: counselorPaymentRequests.length > 0,
    },
  ];

  const portalSupportAlerts = [
    {
      title: "Portal Activation",
      value: `${portalActivationRate}%`,
      text: "Active student accounts",
      icon: Radio,
      color: portalActivationRate >= 70 ? "text-green-300" : "text-orange-300",
      tone: portalActivationRate >= 70 ? "green" : "orange",
      status: portalActivationRate >= 70 ? "Healthy" : "Access Gap",
      active: portalActivationRate < 70 && studentPortalAccounts.length > 0,
    },
    {
      title: "7-Day Portal Activity",
      value: `${portalActivityRate}%`,
      text: "Recently active users",
      icon: Activity,
      color: portalActivityRate >= 40 ? "text-cyan-300" : "text-orange-300",
      tone: portalActivityRate >= 40 ? "cyan" : "orange",
      status: portalActivityRate >= 40 ? "Engaged" : "Low Activity",
      active: portalActivityRate < 40 && studentPortalAccounts.length > 0,
    },
    {
      title: "Password Resets",
      value: passwordResetRequired,
      text: "Students must change password",
      icon: LockKeyhole,
      color: "text-orange-300",
      tone: "orange",
      status: passwordResetRequired > 0 ? "Portal Action" : "Stable",
      active: passwordResetRequired > 0,
    },
    {
      title: "Stale Portal Accounts",
      value: stalePortalAccounts,
      text: "No login in 30 days",
      icon: LockKeyhole,
      color: "text-red-300",
      tone: "red",
      status: stalePortalAccounts > 0 ? "Engagement Risk" : "Stable",
      active: stalePortalAccounts > 0,
    },
    {
      title: "Open Support Requests",
      value: openSupportRequests,
      text: "Student support queue",
      icon: Headphones,
      color: "text-cyan-300",
      tone: "cyan",
      status: openSupportRequests > 0 ? "Support Queue" : "Stable",
      active: openSupportRequests > 0,
    },
    {
      title: "Escalated Support",
      value: escalatedSupportRequests,
      text: "Urgent support cases",
      icon: ShieldAlert,
      color: "text-red-300",
      tone: "red",
      status: escalatedSupportRequests > 0 ? "Escalated" : "Stable",
      active: escalatedSupportRequests > 0,
    },
    {
      title: "Support Resolution",
      value: `${supportResolutionRate}%`,
      text: "Resolved support history",
      icon: CheckCircle2,
      color: supportResolutionRate >= 70 ? "text-green-300" : "text-orange-300",
      tone: supportResolutionRate >= 70 ? "green" : "orange",
      status: supportResolutionRate >= 70 ? "Healthy" : "Response Needed",
      active: supportResolutionRate < 70 && supportRequests.length > 0,
    },
  ];

  const automationAlerts = [
    {
      title: "Execution Logs",
      value: executiveExecutionLogs.length,
      text: "Automation history",
      icon: Zap,
      color: "text-cyan-300",
      tone: "cyan",
      status: "Live",
      active: false,
    },
    {
      title: "Automation Success",
      value: `${automationSuccessRate}%`,
      text: "Successful execution rate",
      icon: CheckCircle2,
      color: automationSuccessRate >= 70 ? "text-green-300" : "text-orange-300",
      tone: automationSuccessRate >= 70 ? "green" : "orange",
      status: automationSuccessRate >= 70 ? "Healthy" : "Needs Recovery",
      active: automationSuccessRate < 70 && executiveExecutionLogs.length > 0,
    },
    {
      title: "Failed Executions",
      value: failedExecutions,
      text: "Needs investigation",
      icon: AlertTriangle,
      color: "text-red-300",
      tone: "red",
      status: failedExecutions > 0 ? "Recovery Needed" : "Stable",
      active: failedExecutions > 0,
    },
    {
      title: "Pending Approvals",
      value: pendingAutomationApprovals,
      text: "Human approval queue",
      icon: Clock3,
      color: "text-orange-300",
      tone: "orange",
      status: pendingAutomationApprovals > 0 ? "Approval Queue" : "Stable",
      active: pendingAutomationApprovals > 0,
    },
    {
      title: "Duplicates Blocked",
      value: duplicateBlockedExecutions,
      text: "Protection monitor",
      icon: ShieldAlert,
      color: "text-blue-300",
      tone: "blue",
      status: duplicateBlockedExecutions > 0 ? "Protected" : "Stable",
      active: false,
    },
  ];

  const executiveAlerts = [
    {
      title: "High Risk Students",
      value: highRiskStudents,
      text: "Executive AI risk queue",
      icon: AlertTriangle,
      color: "text-red-300",
      tone: "red",
      status: highRiskStudents > 0 ? "Executive Risk" : "Stable",
      active: highRiskStudents > 0,
    },
    {
      title: "Critical Risk Students",
      value: criticalRiskStudents,
      text: "Immediate intervention needed",
      icon: ShieldAlert,
      color: "text-red-300",
      tone: "red",
      status: criticalRiskStudents > 0 ? "Critical" : "Stable",
      active: criticalRiskStudents > 0,
    },
    {
      title: "University Plans",
      value: studentUniversities.length,
      text: "Dream / target / safe planning",
      icon: GraduationCap,
      color: "text-pink-300",
      tone: "purple",
      status: studentUniversities.length > 0 ? "Operational" : "Waiting",
      active: false,
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
      color: "text-[#D4AF37]",
      tone: "gold",
      status: "Live System",
      active: false,
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

  const totalActiveAlerts =
    notificationMetrics?.totalAlerts ?? allAlerts.filter((item) => item.active).length;

  const activePaymentAlerts =
    notificationMetrics?.paymentAlerts ??
    revenueAlerts.filter((item) => item.active).length;

  const activeVisaAlerts =
    notificationMetrics?.visaAlerts ??
    journeyAlerts.filter((item) => item.title.includes("CAS") || item.title.includes("Visa")).filter((item) => item.active).length;

  const activePortalAlerts =
    notificationMetrics?.portalAlerts ??
    portalSupportAlerts
      .filter((item) => item.title.includes("Portal") || item.title.includes("Password") || item.title.includes("Stale"))
      .filter((item) => item.active).length;

  const activeSupportAlerts =
    notificationMetrics?.supportAlerts ??
    portalSupportAlerts
      .filter((item) => item.title.includes("Support"))
      .filter((item) => item.active).length;

  const activeAutomationAlerts =
    notificationMetrics?.automationAlerts ??
    automationAlerts.filter((item) => item.active).length;

  const commandSummary = [
    {
      title: "Payment Alerts",
      value: activePaymentAlerts,
      icon: CreditCard,
      tone: activePaymentAlerts > 0 ? "gold" : "green",
    },
    {
      title: "Visa Alerts",
      value: activeVisaAlerts,
      icon: Plane,
      tone: activeVisaAlerts > 0 ? "orange" : "green",
    },
    {
      title: "Portal Alerts",
      value: activePortalAlerts,
      icon: LockKeyhole,
      tone: activePortalAlerts > 0 ? "orange" : "green",
    },
    {
      title: "Support Alerts",
      value: activeSupportAlerts,
      icon: Headphones,
      tone: activeSupportAlerts > 0 ? "red" : "green",
    },
    {
      title: "Automation Alerts",
      value: activeAutomationAlerts,
      icon: Zap,
      tone: activeAutomationAlerts > 0 ? "red" : "green",
    },
  ];

  return (
    <div className="mb-5 space-y-5 xl:mb-6">
      <div className="relative overflow-hidden rounded-[1.7rem] border border-[#D4AF37]/15 bg-gradient-to-br from-[#D4AF37]/10 via-black/40 to-black/30 p-5 backdrop-blur-2xl">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(212,175,55,0.12),transparent_35%)]" />

        <div className="relative flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[#D4AF37]/20 bg-[#D4AF37]/10 px-3 py-1">
              <span className="h-2 w-2 rounded-full bg-[#D4AF37]" />

              <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-[#D4AF37]">
                Executive Notification Center V2
              </p>
            </div>

            <h2 className="mt-3 text-xl font-black tracking-tight text-white sm:text-2xl">
              CRM + Student OS Alert Command Center
            </h2>

            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-gray-400">
              Live alert intelligence across inquiries, appointments, applications, CAS,
              visa, payments, receipts, portal accounts, support requests, documents,
              tasks, Executive AI risk, and automation execution health.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Badge>{roleLabel}</Badge>

            {permissions?.canManageAdmins && <Badge tone="purple">Full Access</Badge>}

            <Badge tone={totalActiveAlerts > 0 ? "red" : "green"}>
              {totalActiveAlerts} Active Alerts
            </Badge>

            <Badge tone="green">Live System</Badge>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
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
        alerts={crmAlerts}
        cardClass={cardClass}
      />

      <AlertSection
        title="Student Journey Alerts"
        eyebrow="Applications • CAS • Visa"
        alerts={journeyAlerts}
        cardClass={cardClass}
      />

      <AlertSection
        title="Revenue Alerts"
        eyebrow="Payments • Receipts • Collection"
        alerts={revenueAlerts}
        cardClass={cardClass}
      />

      <div className="grid gap-5 2xl:grid-cols-2">
        <AlertSection
          title="Portal + Support Alerts"
          eyebrow="Student Portal • Support Center"
          alerts={portalSupportAlerts}
          cardClass={cardClass}
          compact
        />

        <AlertSection
          title="Automation Alerts"
          eyebrow="Executive Automation • Approvals • Recovery"
          alerts={automationAlerts}
          cardClass={cardClass}
          compact
        />
      </div>

      <AlertSection
        title="Executive Alerts"
        eyebrow="Risk • University Plans • System Health"
        alerts={executiveAlerts}
        cardClass={cardClass}
      />
    </div>
  );
}

function AlertSection({ title, eyebrow, alerts, cardClass, compact = false }) {
  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-[0.25em] text-[#D4AF37]">
            {eyebrow}
          </p>

          <h3 className="text-lg font-black text-white">{title}</h3>
        </div>

        <p className="text-xs text-gray-500">
          {alerts.filter((item) => item.active).length} requiring attention
        </p>
      </div>

      <div
        className={`grid gap-4 ${
          compact
            ? "sm:grid-cols-2"
            : "sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4"
        }`}
      >
        {alerts.map((item, index) => (
          <NotificationCard
            key={item.title}
            item={item}
            index={index}
            cardClass={cardClass}
          />
        ))}
      </div>
    </div>
  );
}

function CommandSummaryCard({ item, index, cardClass }) {
  const Icon = item.icon;
  const tone = getToneClass(item.tone, item.value > 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: index * 0.04 }}
      className={`${cardClass} rounded-[1.5rem] border ${tone.border} ${tone.bg} p-4`}
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-gray-500">
            {item.title}
          </p>

          <p className={`mt-2 text-3xl font-black ${tone.text}`}>
            {item.value}
          </p>
        </div>

        <div className={`rounded-2xl border ${tone.border} ${tone.bg} p-3`}>
          <Icon className={`h-5 w-5 ${tone.text}`} />
        </div>
      </div>
    </motion.div>
  );
}

function NotificationCard({ item, index, cardClass }) {
  const Icon = item.icon;
  const tone = getToneClass(item.tone, item.active);

  return (
    <motion.div
      initial={{ opacity: 0, y: 22 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.35,
        delay: index * 0.04,
      }}
      className={`${cardClass} ${tone.glow} group relative overflow-hidden rounded-[1.8rem] border ${tone.border} ${tone.bg} p-5 transition duration-500 hover:-translate-y-1 hover:border-[#D4AF37]/30`}
    >
      <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent opacity-0 transition duration-500 group-hover:opacity-100" />

      <div className="flex items-start justify-between gap-4">
        <div
          className={`relative flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border ${tone.border} ${tone.bg}`}
        >
          {item.active && (
            <>
              <span className="absolute inset-0 rounded-2xl bg-red-400/10 blur-xl" />

              <span className="absolute right-1.5 top-1.5 h-2.5 w-2.5 rounded-full bg-red-400 shadow-[0_0_20px_rgba(248,113,113,0.95)]" />
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

        <div className="mt-3 flex flex-wrap items-end gap-3">
          <h3 className={`text-4xl font-black leading-none ${item.color}`}>
            {item.value}
          </h3>

          <p className="pb-1 text-sm text-gray-400">{item.text}</p>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-xl border border-[#D4AF37]/20 bg-[#D4AF37]/10 px-3 py-2 text-[10px] font-bold uppercase tracking-[0.18em] text-[#D4AF37] transition duration-300 hover:border-[#D4AF37]/40 hover:bg-[#D4AF37]/15"
        >
          <ExternalLink className="h-3.5 w-3.5" />
          Open
        </button>

        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-[10px] font-bold uppercase tracking-[0.18em] text-gray-300 transition duration-300 hover:border-green-400/30 hover:bg-green-400/10 hover:text-green-300"
        >
          <Plus className="h-3.5 w-3.5" />
          Follow-up
        </button>

        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-[10px] font-bold uppercase tracking-[0.18em] text-gray-400 transition duration-300 hover:border-blue-400/30 hover:bg-blue-400/10 hover:text-blue-300"
        >
          <CheckCircle2 className="h-3.5 w-3.5" />
          Read
        </button>

        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-[10px] font-bold uppercase tracking-[0.18em] text-gray-500 transition duration-300 hover:border-red-400/30 hover:bg-red-400/10 hover:text-red-300"
        >
          <X className="h-3.5 w-3.5" />
          Dismiss
        </button>
      </div>

      {item.active && (
        <div className="mt-5 rounded-2xl border border-white/10 bg-black/20 p-3 backdrop-blur-xl">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-[#D4AF37]" />

            <p className="text-xs font-medium leading-relaxed text-gray-300">
              Executive system detected active operational attention required in
              this category.
            </p>
          </div>
        </div>
      )}
    </motion.div>
  );
}

function Badge({ children, tone = "default" }) {
  const toneClass =
    tone === "red"
      ? "border-red-400/20 bg-red-400/10 text-red-300"
      : tone === "green"
      ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-300"
      : tone === "purple"
      ? "border-purple-400/20 bg-purple-400/10 text-purple-300"
      : "border-white/10 bg-white/[0.04] text-gray-300";

  return (
    <div
      className={`rounded-full border px-4 py-2 text-[10px] font-bold uppercase tracking-[0.2em] backdrop-blur-xl ${toneClass}`}
    >
      {children}
    </div>
  );
}

function getToneClass(tone = "gold", active = false) {
  const toneMap = {
    gold: {
      border: active ? "border-[#D4AF37]/30" : "border-white/10",
      bg: active ? "bg-[#D4AF37]/10" : "bg-white/[0.04]",
      glow: active ? "shadow-[0_0_35px_rgba(212,175,55,0.12)]" : "",
      text: "text-[#D4AF37]",
    },
    orange: {
      border: active ? "border-orange-400/30" : "border-white/10",
      bg: active ? "bg-orange-400/10" : "bg-white/[0.04]",
      glow: active ? "shadow-[0_0_35px_rgba(251,146,60,0.12)]" : "",
      text: "text-orange-300",
    },
    green: {
      border: active ? "border-green-400/30" : "border-white/10",
      bg: active ? "bg-green-400/10" : "bg-white/[0.04]",
      glow: active ? "shadow-[0_0_35px_rgba(74,222,128,0.10)]" : "",
      text: "text-green-300",
    },
    red: {
      border: active ? "border-red-400/30" : "border-white/10",
      bg: active ? "bg-red-400/10" : "bg-white/[0.04]",
      glow: active ? "shadow-[0_0_35px_rgba(248,113,113,0.14)]" : "",
      text: "text-red-300",
    },
    purple: {
      border: active ? "border-purple-400/30" : "border-white/10",
      bg: active ? "bg-purple-400/10" : "bg-white/[0.04]",
      glow: active ? "shadow-[0_0_35px_rgba(192,132,252,0.12)]" : "",
      text: "text-purple-300",
    },
    cyan: {
      border: active ? "border-cyan-400/30" : "border-white/10",
      bg: active ? "bg-cyan-400/10" : "bg-white/[0.04]",
      glow: active ? "shadow-[0_0_35px_rgba(34,211,238,0.12)]" : "",
      text: "text-cyan-300",
    },
    blue: {
      border: active ? "border-blue-400/30" : "border-white/10",
      bg: active ? "bg-blue-400/10" : "bg-white/[0.04]",
      glow: active ? "shadow-[0_0_35px_rgba(96,165,250,0.12)]" : "",
      text: "text-blue-300",
    },
  };

  return toneMap[tone] || toneMap.gold;
}

export default NotificationCenter;