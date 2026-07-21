// StudentOSMissionControl V5 — High Contrast Mission Control
// Preserves the complete 1700+ line mission-control analytics architecture:
// journey, revenue, portal, support, notification, automation, risk, system health,
// execution logs and connected MissionControlNotificationCenter.
// Mature file retained; visual hierarchy aligned with Zaifan Admin OS.

import { motion } from "framer-motion";
import MissionControlNotificationCenter from "./MissionControlNotificationCenter";

const toLower = (value) => String(value || "").toLowerCase().trim();

const isDone = (status) =>
  [
    "completed",
    "complete",
    "done",
    "closed",
    "resolved",
    "approved",
    "verified",
    "paid",
    "success",
    "successful",
    "executed",
  ].includes(toLower(status));

const isOverdue = (dateValue) => {
  if (!dateValue) return false;
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return false;
  return date < new Date();
};

const getStudentKey = (item) =>
  item?.student_id ||
  item?.studentId ||
  item?.inquiry_id ||
  item?.appointment_id ||
  item?.id ||
  item?.email ||
  item?.student_email ||
  item?.phone ||
  item?.student_phone ||
  null;

const uniqueCount = (items = []) =>
  new Set(items.map((item) => getStudentKey(item)).filter(Boolean)).size;

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

const percent = (value, total) => {
  if (!total) return 0;
  return Math.round((Number(value || 0) / Number(total || 1)) * 100);
};

const formatDate = (value) => {
  if (!value) return "No date";

  try {
    return new Date(value).toLocaleString("en-PK", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return "Invalid date";
  }
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

const getRecordDate = (item = {}) =>
  item.created_at ||
  item.updated_at ||
  item.invoice_date ||
  item.payment_date ||
  item.paid_at ||
  item.receipt_date ||
  item.submitted_at ||
  item.executed_at ||
  item.generated_at ||
  null;

const isWithinDays = (value, days = 30) => {
  if (!value) return false;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return false;

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);

  return date >= cutoff;
};

const isThisMonth = (value) => {
  if (!value) return false;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return false;

  const now = new Date();

  return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth();
};

const getMonthKey = (value) => {
  const date = new Date(value || Date.now());
  if (Number.isNaN(date.getTime())) return "Unknown";

  return date.toLocaleString("en-GB", {
    month: "short",
    year: "2-digit",
  });
};

const buildMonthlyMoneyTrend = (items = [], valueResolver = getAmount, limit = 6) => {
  const buckets = new Map();

  items.forEach((item) => {
    const dateValue = getRecordDate(item);
    const key = getMonthKey(dateValue);
    const current = buckets.get(key) || 0;

    buckets.set(key, current + Number(valueResolver(item) || 0));
  });

  return [...buckets.entries()]
    .map(([label, value]) => ({ label, value }))
    .slice(-limit);
};

const getTrendMax = (items = []) =>
  Math.max(...items.map((item) => Number(item.value || 0)), 1);

const getUrgencyTone = (value = 0, warning = 1, danger = 5) => {
  const clean = Number(value || 0);
  if (clean >= danger) return "text-red-700";
  if (clean >= warning) return "text-orange-700";
  return "text-emerald-700";
};

function StudentOSMissionControl({
  cardClass = "",

  studentApplications = [],
  studentDocuments = [],
  studentTasks = [],
  studentUniversities = [],
  studentRiskScores = [],

  inquiries = [],
  appointments = [],
  followUpReminders = [],

  studentInvoices = [],
  studentPayments = [],
  studentReceipts = [],
  paymentReceipts = [],
  studentPortalAccounts = [],
  portalAccounts = [],
  supportRequests = [],
  studentSupportRequests = [],
  counselorPaymentRequests = [],

  executiveExecutionLogs = [],
  automationQueue = [],
  executiveActionQueue = [],
}) {
  const allStudents = [...inquiries, ...appointments];
  const allReceipts = [...studentReceipts, ...paymentReceipts];
  const allPortalAccounts = [...studentPortalAccounts, ...portalAccounts];
  const allSupportRequests = [...supportRequests, ...studentSupportRequests];
  const allAutomationQueue = [...automationQueue, ...executiveActionQueue];

  const totalStudents = uniqueCount(allStudents);
  const applicationsCount = studentApplications.length;

  const submittedApplications = studentApplications.filter((app) => {
    const status = toLower(app.application_status || app.status);
    return status.includes("submit") || status.includes("applied") || status.includes("review");
  }).length;

  const offerCount = studentApplications.filter((app) => {
    const offerStatus = toLower(app.offer_status);
    const status = toLower(app.status);
    return (
      offerStatus === "received" ||
      offerStatus.includes("offer") ||
      status.includes("offer")
    );
  }).length;

  const offerAcceptedCount = studentApplications.filter((app) => {
    const offerStatus = toLower(app.offer_status);
    return offerStatus.includes("accepted") || offerStatus.includes("firm");
  }).length;

  const casCount = studentApplications.filter((app) =>
    toLower(app.cas_status || app.cas).includes("issued")
  ).length;

  const visaSubmittedCount = studentApplications.filter((app) => {
    const status = toLower(app.visa_status || app.visa);
    return (
      status.includes("submitted") ||
      status.includes("processing") ||
      status.includes("pending")
    );
  }).length;

  const visaCount = studentApplications.filter((app) =>
    toLower(app.visa_status || app.visa).includes("approved")
  ).length;

  const documentsCount = studentDocuments.length;

  const pendingDocuments = studentDocuments.filter(
    (doc) => !isDone(doc.status || doc.document_status || doc.verification_status)
  ).length;

  const pendingTasksList = studentTasks.filter(
    (task) => !isDone(task.status || task.task_status)
  );

  const pendingTasks = pendingTasksList.length;

  const overdueTasks = pendingTasksList.filter((task) =>
    isOverdue(task.due_date || task.deadline || task.target_date)
  ).length;

  const universityPlans = studentUniversities.length;

  const dreamUniversities = studentUniversities.filter((uni) =>
    toLower(uni.preference_type || uni.category || uni.type).includes("dream")
  ).length;

  const targetUniversities = studentUniversities.filter((uni) =>
    toLower(uni.preference_type || uni.category || uni.type).includes("target")
  ).length;

  const safeUniversities = studentUniversities.filter((uni) =>
    toLower(uni.preference_type || uni.category || uni.type).includes("safe")
  ).length;

  const highRiskStudents = studentRiskScores.filter((risk) => {
    const riskLevel = toLower(risk.risk_level || risk.priority || risk.level);
    const score = Number(risk.risk_score || risk.score || risk.overall_score || 0);

    return riskLevel.includes("high") || riskLevel.includes("critical") || score >= 70;
  }).length;

  const criticalRiskStudents = studentRiskScores.filter((risk) => {
    const riskLevel = toLower(risk.risk_level || risk.priority || risk.level);
    const score = Number(risk.risk_score || risk.score || risk.overall_score || 0);

    return riskLevel.includes("critical") || score >= 85;
  }).length;

  const overdueReminders = followUpReminders.filter((reminder) => {
    const dueDate = reminder.due_date || reminder.reminder_date || reminder.date;
    return isOverdue(dueDate) && !isDone(reminder.status);
  }).length;

  const casDelays = studentApplications.filter((app) => {
    const offerStatus = toLower(app.offer_status);
    const casStatus = toLower(app.cas_status || app.cas);
    const acceptedOffer =
      offerStatus.includes("accepted") || offerStatus.includes("firm");
    const casNotIssued = !casStatus.includes("issued");

    return acceptedOffer && casNotIssued;
  }).length;

  const visaDelays = studentApplications.filter((app) => {
    const casStatus = toLower(app.cas_status || app.cas);
    const visaStatus = toLower(app.visa_status || app.visa);
    const casIssued = casStatus.includes("issued");
    const visaNotApproved = !visaStatus.includes("approved");

    return casIssued && visaNotApproved;
  }).length;

  const invoicesCount = studentInvoices.length;

  const invoiceValue = studentInvoices.reduce(
    (sum, invoice) =>
      sum + Number(invoice.amount || invoice.total_amount || invoice.invoice_amount || 0),
    0
  );

  const paymentsCount = studentPayments.length;

  const paidValue = studentPayments.reduce(
    (sum, payment) =>
      sum + Number(payment.amount || payment.paid_amount || payment.payment_amount || 0),
    0
  );

  const outstandingValue = studentInvoices.reduce((sum, invoice) => {
    const status = toLower(invoice.status || invoice.payment_status);
    const amount = Number(invoice.amount || invoice.total_amount || invoice.invoice_amount || 0);
    const outstanding = Number(invoice.outstanding_amount || invoice.balance || 0);

    if (status.includes("paid") || status.includes("complete")) return sum;
    return sum + (outstanding || amount);
  }, 0);

  const unpaidInvoices = studentInvoices.filter((invoice) => {
    const status = toLower(invoice.status || invoice.payment_status);
    return !status.includes("paid") && !status.includes("complete");
  }).length;

  const pendingReceipts = allReceipts.filter((receipt) => {
    const status = toLower(receipt.status || receipt.receipt_status || receipt.approval_status);
    return !status.includes("approved") && !status.includes("rejected");
  }).length;

  const approvedReceipts = allReceipts.filter((receipt) => {
    const status = toLower(receipt.status || receipt.receipt_status || receipt.approval_status);
    return status.includes("approved");
  }).length;

  const paymentRisks = unpaidInvoices + pendingReceipts + counselorPaymentRequests.length;

  const activePortalUsers = allPortalAccounts.filter((account) => {
    const active = account.is_active ?? account.active ?? account.status;
    if (typeof active === "boolean") return active;
    return !["inactive", "disabled", "blocked", "false"].includes(toLower(active));
  }).length;

  const portalPasswordResets = allPortalAccounts.filter(
    (account) => account.must_change_password || account.force_password_change
  ).length;

  const portalLastLoginCoverage = allPortalAccounts.filter(
    (account) => account.last_login_at || account.last_login || account.last_seen_at
  ).length;

  const recentlyActivePortalUsers = allPortalAccounts.filter((account) => {
    const lastLogin = account.last_login_at || account.last_login || account.last_seen_at;
    if (!lastLogin) return false;

    const date = new Date(lastLogin);
    if (Number.isNaN(date.getTime())) return false;

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    return date >= sevenDaysAgo;
  }).length;

  const openSupportRequests = allSupportRequests.filter((request) => {
    const status = toLower(request.status || request.request_status);
    return !status.includes("resolved") && !status.includes("closed");
  }).length;

  const pendingSupportResponses = allSupportRequests.filter((request) => {
    const status = toLower(request.status || request.request_status);
    return status.includes("pending") || status.includes("waiting") || status.includes("open");
  }).length;

  const escalatedSupportRequests = allSupportRequests.filter((request) => {
    const status = toLower(request.status || request.request_status);
    const priority = toLower(request.priority || request.severity);
    return (
      status.includes("escalated") ||
      priority.includes("urgent") ||
      priority.includes("high") ||
      priority.includes("critical")
    );
  }).length;

  const resolvedSupportRequests = allSupportRequests.filter((request) => {
    const status = toLower(request.status || request.request_status);
    return status.includes("resolved") || status.includes("closed");
  }).length;

  const successfulExecutions = executiveExecutionLogs.filter((log) => {
    const status = toLower(log.status || log.execution_status || log.approval_status);
    return (
      status.includes("success") ||
      status.includes("executed") ||
      status.includes("completed") ||
      status.includes("approved")
    );
  }).length;

  const failedExecutions = executiveExecutionLogs.filter((log) => {
    const status = toLower(log.status || log.execution_status || log.approval_status);
    const error = log.error_message || log.error || log.failure_reason;
    return status.includes("failed") || status.includes("error") || Boolean(error);
  }).length;

  const pendingApprovals = executiveExecutionLogs.filter((log) => {
    const approval = toLower(log.approval_status || log.status);
    return approval.includes("pending") || approval.includes("queued") || approval.includes("waiting");
  }).length;

  const duplicateBlockedExecutions = executiveExecutionLogs.filter(
    (log) => log.duplicate_detected || log.duplicate_blocked
  ).length;

  const humanApprovedExecutions = executiveExecutionLogs.filter((log) => {
    const approval = toLower(log.approval_status || log.status);
    return approval.includes("approved");
  }).length;

  const recentExecutions = [...executiveExecutionLogs]
    .sort((a, b) => {
      const aDate = new Date(a.executed_at || a.created_at || a.generated_at || 0).getTime();
      const bDate = new Date(b.executed_at || b.created_at || b.generated_at || 0).getTime();
      return bDate - aDate;
    })
    .slice(0, 8);

  const queuedAutomation = allAutomationQueue.filter((item) => {
    const status = toLower(item.status || item.approval_status);
    return status.includes("pending") || status.includes("queued") || status.includes("waiting");
  }).length;

  const automationSuccessRate = percent(
    successfulExecutions,
    successfulExecutions + failedExecutions
  );

  const automationPressure =
    failedExecutions + pendingApprovals + queuedAutomation + duplicateBlockedExecutions;

  const currentMonthInvoiceValue = studentInvoices
    .filter((invoice) => isThisMonth(getRecordDate(invoice)))
    .reduce((sum, invoice) => sum + getAmount(invoice), 0);

  const currentMonthPaidValue = studentPayments
    .filter((payment) => isThisMonth(getRecordDate(payment)))
    .reduce((sum, payment) => sum + getAmount(payment), 0);

  const recentInvoiceValue = studentInvoices
    .filter((invoice) => isWithinDays(getRecordDate(invoice), 30))
    .reduce((sum, invoice) => sum + getAmount(invoice), 0);

  const recentPaymentValue = studentPayments
    .filter((payment) => isWithinDays(getRecordDate(payment), 30))
    .reduce((sum, payment) => sum + getAmount(payment), 0);

  const invoiceCollectionRate = percent(paidValue, invoiceValue);
  const paymentCollectionRate = percent(paymentsCount, invoicesCount);
  const receiptApprovalRate = percent(approvedReceipts, allReceipts.length);
  const outstandingRevenueForecast = outstandingValue + pendingReceipts * 250;
  const revenueRiskScore = unpaidInvoices + pendingReceipts + counselorPaymentRequests.length;

  const invoiceTrend = buildMonthlyMoneyTrend(studentInvoices);
  const paymentTrend = buildMonthlyMoneyTrend(studentPayments);
  const maxInvoiceTrend = getTrendMax(invoiceTrend);
  const maxPaymentTrend = getTrendMax(paymentTrend);

  const stalePortalAccounts = allPortalAccounts.filter((account) => {
    const lastLogin = account.last_login_at || account.last_login || account.last_seen_at;
    return !lastLogin || !isWithinDays(lastLogin, 30);
  }).length;

  const portalActivationRate = percent(activePortalUsers, allPortalAccounts.length);
  const portalRecentActivityRate = percent(recentlyActivePortalUsers, allPortalAccounts.length);
  const portalRiskScore = portalPasswordResets + stalePortalAccounts;

  const supportResolutionRate = percent(resolvedSupportRequests, allSupportRequests.length);
  const supportPressureScore =
    openSupportRequests + pendingSupportResponses + escalatedSupportRequests * 2;

  const approvalBacklog = pendingApprovals + queuedAutomation;
  const automationRecoveryRate = percent(successfulExecutions, successfulExecutions + failedExecutions);
  const automationRiskScore = failedExecutions * 2 + approvalBacklog + duplicateBlockedExecutions;

  const notificationAlerts = [
    {
      title: "Executive Risk",
      value: highRiskStudents,
      note: `${criticalRiskStudents} critical students`,
      icon: "🚨",
      color: getUrgencyTone(highRiskStudents, 1, 5),
      type: "executive",
    },
    {
      title: "Payment Alerts",
      value: revenueRiskScore,
      note: `${formatMoney(outstandingValue)} outstanding`,
      icon: "💷",
      color: getUrgencyTone(revenueRiskScore, 1, 6),
      type: "payment",
    },
    {
      title: "Visa Alerts",
      value: visaDelays,
      note: "CAS issued but visa not approved",
      icon: "🛂",
      color: getUrgencyTone(visaDelays, 1, 4),
      type: "visa",
    },
    {
      title: "Portal Alerts",
      value: portalRiskScore,
      note: `${stalePortalAccounts} stale / ${portalPasswordResets} reset`,
      icon: "🔐",
      color: getUrgencyTone(portalRiskScore, 1, 8),
      type: "portal",
    },
    {
      title: "Support Alerts",
      value: supportPressureScore,
      note: `${escalatedSupportRequests} escalated`,
      icon: "📬",
      color: getUrgencyTone(supportPressureScore, 1, 8),
      type: "support",
    },
    {
      title: "Automation Alerts",
      value: automationRiskScore,
      note: `${failedExecutions} failed / ${approvalBacklog} approval`,
      icon: "⚙️",
      color: getUrgencyTone(automationRiskScore, 1, 8),
      type: "automation",
    },
  ];

  const pipelineStages = [
    {
      title: "Lead",
      value: totalStudents,
      subtitle: "Inquiry + appointment base",
      icon: "🎓",
      color: "from-orange-100 to-orange-50",
      text: "text-orange-700",
    },
    {
      title: "Application",
      value: applicationsCount,
      subtitle: `${submittedApplications} submitted / active`,
      icon: "📝",
      color: "from-sky-100 to-sky-50",
      text: "text-sky-700",
    },
    {
      title: "Offer",
      value: offerCount,
      subtitle: `${offerAcceptedCount} accepted`,
      icon: "🎉",
      color: "from-emerald-100 to-emerald-50",
      text: "text-emerald-700",
    },
    {
      title: "CAS",
      value: casCount,
      subtitle: `${casDelays} delayed`,
      icon: "📄",
      color: "from-blue-100 to-blue-50",
      text: "text-blue-700",
    },
    {
      title: "Visa",
      value: visaCount,
      subtitle: `${visaSubmittedCount} submitted / pending`,
      icon: "✈️",
      color: "from-emerald-100 to-emerald-50",
      text: "text-emerald-700",
    },
  ];

  const stats = [
    {
      title: "Students",
      value: totalStudents,
      icon: "🎓",
      color: "text-orange-700",
      note: "Unified records",
    },
    {
      title: "Applications",
      value: applicationsCount,
      icon: "📝",
      color: "text-sky-700",
      note: `${submittedApplications} active`,
    },
    {
      title: "Offers",
      value: offerCount,
      icon: "🎉",
      color: "text-emerald-700",
      note: `${offerAcceptedCount} accepted`,
    },
    {
      title: "CAS Issued",
      value: casCount,
      icon: "📄",
      color: "text-blue-700",
      note: `${casDelays} CAS delays`,
    },
    {
      title: "Visa Approved",
      value: visaCount,
      icon: "✈️",
      color: "text-emerald-700",
      note: `${visaDelays} visa delays`,
    },
    {
      title: "Documents",
      value: documentsCount,
      icon: "📂",
      color: "text-violet-700",
      note: `${pendingDocuments} pending`,
    },
    {
      title: "Pending Tasks",
      value: pendingTasks,
      icon: "⏳",
      color: "text-orange-700",
      note: `${overdueTasks} overdue`,
    },
    {
      title: "Automation",
      value: executiveExecutionLogs.length,
      icon: "⚙️",
      color: "text-sky-700",
      note: `${automationSuccessRate}% success`,
    },
  ];

  const watchlist = [
    {
      title: "High Risk Students",
      value: highRiskStudents,
      note: `${criticalRiskStudents} critical`,
      icon: "🚨",
      color: "text-red-700",
    },
    {
      title: "CAS Delays",
      value: casDelays,
      note: "Offer accepted, CAS not issued",
      icon: "📄",
      color: "text-blue-700",
    },
    {
      title: "Visa Delays",
      value: visaDelays,
      note: "CAS issued, visa not approved",
      icon: "🛂",
      color: "text-emerald-700",
    },
    {
      title: "Payment Risks",
      value: paymentRisks,
      note: `${unpaidInvoices} unpaid invoices`,
      icon: "💷",
      color: "text-amber-700",
    },
    {
      title: "Automation Pressure",
      value: automationPressure,
      note: `${failedExecutions} failed / ${pendingApprovals} pending`,
      icon: "⚙️",
      color: "text-orange-700",
    },
  ];

  const revenueMetrics = [
    {
      title: "Invoices",
      value: invoicesCount,
      note: formatMoney(invoiceValue),
      icon: "🧾",
      color: "text-sky-700",
    },
    {
      title: "Payments",
      value: paymentsCount,
      note: formatMoney(paidValue),
      icon: "💳",
      color: "text-emerald-700",
    },
    {
      title: "Outstanding",
      value: formatMoney(outstandingValue),
      note: `${unpaidInvoices} unpaid`,
      icon: "⚠️",
      color: "text-orange-700",
    },
    {
      title: "Receipts",
      value: allReceipts.length,
      note: `${pendingReceipts} pending / ${approvedReceipts} approved`,
      icon: "📎",
      color: "text-violet-700",
    },
  ];

  const revenueIntelligenceMetrics = [
    {
      title: "This Month Invoiced",
      value: formatMoney(currentMonthInvoiceValue),
      note: `${formatMoney(recentInvoiceValue)} in last 30 days`,
      icon: "📈",
      color: "text-sky-700",
    },
    {
      title: "This Month Collected",
      value: formatMoney(currentMonthPaidValue),
      note: `${formatMoney(recentPaymentValue)} in last 30 days`,
      icon: "💰",
      color: "text-emerald-700",
    },
    {
      title: "Collection Rate",
      value: `${invoiceCollectionRate}%`,
      note: "Paid value against invoiced value",
      icon: "🎯",
      color: "text-orange-700",
    },
    {
      title: "Receipt Approval",
      value: `${receiptApprovalRate}%`,
      note: `${pendingReceipts} receipts awaiting review`,
      icon: "✅",
      color: "text-violet-700",
    },
    {
      title: "Forecast Risk",
      value: formatMoney(outstandingRevenueForecast),
      note: "Outstanding plus receipt pressure",
      icon: "⚠️",
      color: "text-orange-700",
    },
    {
      title: "Payment Requests",
      value: counselorPaymentRequests.length,
      note: "Counselor payment pressure",
      icon: "🙋",
      color: "text-blue-700",
    },
  ];

  const portalAnalyticsMetrics = [
    {
      title: "Activation Rate",
      value: `${portalActivationRate}%`,
      note: `${activePortalUsers}/${allPortalAccounts.length} active accounts`,
      icon: "🟢",
      color: "text-emerald-700",
    },
    {
      title: "7-Day Activity",
      value: `${portalRecentActivityRate}%`,
      note: `${recentlyActivePortalUsers} recently active users`,
      icon: "📡",
      color: "text-sky-700",
    },
    {
      title: "30-Day Stale",
      value: stalePortalAccounts,
      note: "Accounts needing engagement",
      icon: "🕒",
      color: "text-orange-700",
    },
    {
      title: "Password Pressure",
      value: portalPasswordResets,
      note: "Must change password accounts",
      icon: "🔁",
      color: "text-violet-700",
    },
  ];

  const supportAnalyticsMetrics = [
    {
      title: "Resolution Rate",
      value: `${supportResolutionRate}%`,
      note: `${resolvedSupportRequests} resolved requests`,
      icon: "✅",
      color: "text-emerald-700",
    },
    {
      title: "Support Pressure",
      value: supportPressureScore,
      note: "Open + pending + escalated weight",
      icon: "🔥",
      color: "text-orange-700",
    },
    {
      title: "Response Queue",
      value: pendingSupportResponses,
      note: "Waiting for team response",
      icon: "⏳",
      color: "text-sky-700",
    },
    {
      title: "Escalations",
      value: escalatedSupportRequests,
      note: "Leadership support watch",
      icon: "🚨",
      color: "text-red-700",
    },
  ];

  const portalMetrics = [
    {
      title: "Portal Accounts",
      value: allPortalAccounts.length,
      note: "Student login access",
      icon: "🔐",
      color: "text-sky-700",
    },
    {
      title: "Active Users",
      value: activePortalUsers,
      note: `${recentlyActivePortalUsers} active in 7 days`,
      icon: "🟢",
      color: "text-emerald-700",
    },
    {
      title: "Last Login",
      value: `${percent(portalLastLoginCoverage, allPortalAccounts.length)}%`,
      note: `${portalLastLoginCoverage} accounts tracked`,
      icon: "🕒",
      color: "text-blue-700",
    },
    {
      title: "Password Resets",
      value: portalPasswordResets,
      note: "Must change password",
      icon: "🔁",
      color: "text-orange-700",
    },
  ];

  const supportMetrics = [
    {
      title: "Open Requests",
      value: openSupportRequests,
      note: "Student support queue",
      icon: "📬",
      color: "text-sky-700",
    },
    {
      title: "Pending Responses",
      value: pendingSupportResponses,
      note: "Waiting for counselor/admin",
      icon: "⏳",
      color: "text-orange-700",
    },
    {
      title: "Escalated Requests",
      value: escalatedSupportRequests,
      note: "High priority support",
      icon: "🚨",
      color: "text-red-700",
    },
    {
      title: "Resolved Requests",
      value: resolvedSupportRequests,
      note: "Closed support history",
      icon: "✅",
      color: "text-emerald-700",
    },
  ];

  const automationMetrics = [
    {
      title: "Execution Logs",
      value: executiveExecutionLogs.length,
      note: "Executive automation history",
      icon: "📜",
      color: "text-sky-700",
    },
    {
      title: "Success Rate",
      value: `${automationSuccessRate}%`,
      note: `${successfulExecutions} successful`,
      icon: "✅",
      color: "text-emerald-700",
    },
    {
      title: "Failed Actions",
      value: failedExecutions,
      note: "Needs review",
      icon: "🚨",
      color: "text-red-700",
    },
    {
      title: "Pending Approval",
      value: pendingApprovals + queuedAutomation,
      note: "Human approval queue",
      icon: "⏳",
      color: "text-orange-700",
    },
    {
      title: "Human Approved",
      value: humanApprovedExecutions,
      note: "Approved execution flow",
      icon: "🧑‍⚖️",
      color: "text-violet-700",
    },
    {
      title: "Duplicates Blocked",
      value: duplicateBlockedExecutions,
      note: "Protection monitor",
      icon: "🛡️",
      color: "text-blue-700",
    },
  ];

  const journeyHealthMetrics = [
    {
      title: "University Plans",
      value: universityPlans,
      note: `${dreamUniversities}/${targetUniversities}/${safeUniversities} D/T/S`,
      icon: "🏛️",
      color: "text-pink-700",
    },
    {
      title: "Document Readiness",
      value: `${percent(documentsCount - pendingDocuments, documentsCount)}%`,
      note: `${pendingDocuments} pending documents`,
      icon: "📂",
      color: "text-violet-700",
    },
    {
      title: "Task Health",
      value: `${percent(studentTasks.length - pendingTasks, studentTasks.length)}%`,
      note: `${overdueTasks} overdue tasks`,
      icon: "✅",
      color: "text-emerald-700",
    },
    {
      title: "Follow-Up Pressure",
      value: overdueReminders,
      note: "Overdue reminders",
      icon: "📞",
      color: "text-orange-700",
    },
  ];

  const systemHealth = [
    {
      title: "Application OS",
      active: applicationsCount > 0,
      detail: `${applicationsCount} records`,
    },
    {
      title: "University OS",
      active: universityPlans > 0,
      detail: `${universityPlans} plans`,
    },
    {
      title: "Document OS",
      active: documentsCount > 0,
      detail: `${pendingDocuments} pending`,
    },
    {
      title: "Task OS",
      active: studentTasks.length > 0,
      detail: `${pendingTasks} pending`,
    },
    {
      title: "Executive AI",
      active: studentRiskScores.length > 0,
      detail: `${highRiskStudents} high risk`,
    },
    {
      title: "Executive Automation",
      active: executiveExecutionLogs.length > 0 || allAutomationQueue.length > 0,
      detail: `${automationPressure} pressure`,
    },
    {
      title: "Payment Center",
      active: invoicesCount > 0 || paymentsCount > 0 || allReceipts.length > 0,
      detail: `${paymentRisks} risks`,
    },
    {
      title: "Student Portal",
      active: allPortalAccounts.length > 0,
      detail: `${activePortalUsers} active`,
    },
    {
      title: "Support Center",
      active: allSupportRequests.length > 0,
      detail: `${openSupportRequests} open`,
    },
    {
      title: "Mission Control",
      active: true,
      detail: "Executive layer online",
    },
  ];

  const operatingScore = Math.round(
    (
      percent(applicationsCount, Math.max(totalStudents, 1)) +
      percent(offerCount, Math.max(applicationsCount, 1)) +
      percent(casCount, Math.max(offerAcceptedCount || offerCount, 1)) +
      percent(visaCount, Math.max(casCount, 1)) +
      percent(documentsCount - pendingDocuments, Math.max(documentsCount, 1)) +
      percent(studentTasks.length - pendingTasks, Math.max(studentTasks.length, 1)) +
      automationSuccessRate
    ) / 7
  );

  const executivePressure =
    highRiskStudents +
    casDelays +
    visaDelays +
    paymentRisks +
    openSupportRequests +
    overdueReminders +
    automationPressure;

  return (
    <div className="space-y-6 text-[#10233f]">
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className={`${cardClass} relative overflow-hidden rounded-[1.9rem] border-2 border-orange-300 bg-[#102f5c] p-6 text-[#10233f] shadow-[0_18px_50px_rgba(15,35,63,0.14)]`}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-orange-500/15 via-transparent to-white/5" />

        <div className="relative flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-[0.3em] text-orange-700">
              Executive Operations Center
            </p>

            <h2 className="mt-3 text-3xl font-black text-white">
              Student OS Mission Control V4
            </h2>

            <p className="mt-3 max-w-4xl text-sm leading-6 text-slate-300">
              Unified command layer across Student Journey, Applications, Offers,
              CAS, Visa, Payments, Portal, Support, Executive AI, Automation,
              Execution Logs, Risk, Tasks, Documents, University Planning, Revenue Intelligence, Portal Analytics, and Notification Alerts.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-white/15 bg-white/10 p-5 text-center backdrop-blur-sm">
              <p className="text-[10px] uppercase tracking-[0.25em] text-slate-500">
                Operating Score
              </p>

              <p className="mt-2 text-5xl font-black text-orange-700">
                {operatingScore}%
              </p>

              <p className="mt-1 text-xs text-slate-500">
                Journey + automation health
              </p>
            </div>

            <div className="rounded-2xl border border-red-300/30 bg-red-500/15 p-5 text-center">
              <p className="text-[10px] uppercase tracking-[0.25em] text-slate-500">
                Executive Pressure
              </p>

              <p className="mt-2 text-5xl font-black text-red-700">
                {executivePressure}
              </p>

              <p className="mt-1 text-xs text-slate-500">
                Risks needing leadership attention
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat, index) => (
          <MissionMetricCard
            key={stat.title}
            stat={stat}
            index={index}
            cardClass={cardClass}
          />
        ))}
      </div>

      <SectionShell
        cardClass={cardClass}
        eyebrow="Student Journey"
        title="Journey Pipeline"
        subtitle="Lead → Application → Offer → CAS → Visa progression"
      >
        <div className="grid gap-4 xl:grid-cols-5">
          {pipelineStages.map((stage, index) => (
            <motion.div
              key={stage.title}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              className={`relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br ${stage.color} p-5`}
            >
              {index < pipelineStages.length - 1 && (
                <div className="absolute right-3 top-1/2 hidden -translate-y-1/2 text-2xl text-slate-300 xl:block">
                  →
                </div>
              )}

              <div className="text-3xl">{stage.icon}</div>

              <p className="mt-4 text-xs uppercase tracking-[0.2em] text-slate-500">
                {stage.title}
              </p>

              <p className={`mt-2 text-4xl font-black ${stage.text}`}>
                {stage.value}
              </p>

              <p className="mt-2 text-xs text-slate-500">
                {stage.subtitle}
              </p>
            </motion.div>
          ))}
        </div>
      </SectionShell>

      <div className="grid gap-6 2xl:grid-cols-5">
        <div className="2xl:col-span-3">
          <SectionShell
            cardClass={cardClass}
            eyebrow="Executive Intelligence"
            title="Executive Watchlist"
            subtitle="The pressure points leadership should act on first"
          >
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
              {watchlist.map((item, index) => (
                <CompactMetric key={item.title} item={item} index={index} />
              ))}
            </div>
          </SectionShell>
        </div>

        <div className="2xl:col-span-2">
          <SectionShell
            cardClass={cardClass}
            eyebrow="Journey Readiness"
            title="Readiness Health"
            subtitle="Universities, documents, tasks, and follow-up pressure"
          >
            <div className="grid gap-4 sm:grid-cols-2">
              {journeyHealthMetrics.map((item, index) => (
                <CompactMetric key={item.title} item={item} index={index} />
              ))}
            </div>
          </SectionShell>
        </div>
      </div>

      <SectionShell
        cardClass={cardClass}
        eyebrow="Executive Automation"
        title="Automation Health Center"
        subtitle="Execution logs, success rate, failures, approvals, duplicate protection, and queue pressure"
      >
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {automationMetrics.map((item, index) => (
            <CompactMetric key={item.title} item={item} index={index} />
          ))}
        </div>
      </SectionShell>

      <SectionShell
        cardClass={cardClass}
        eyebrow="Automation Feed"
        title="Recent Executive Execution Logs"
        subtitle="Latest automation actions from Executive AI and human-approved workflows"
      >
        {recentExecutions.length ? (
          <div className="space-y-3">
            {recentExecutions.map((log, index) => (
              <ExecutionLogRow
                key={log.id || `${log.action_type || "execution"}-${index}`}
                log={log}
                index={index}
              />
            ))}
          </div>
        ) : (
          <EmptyState text="No executive execution logs loaded yet. Wire executiveExecutionLogs from useAdminDashboardData to activate this feed." />
        )}
      </SectionShell>

      <SectionShell
        cardClass={cardClass}
        eyebrow="Revenue Operations"
        title="Revenue Center"
        subtitle="Payment Center intelligence for invoices, payments, receipts, and outstanding balances"
      >
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {revenueMetrics.map((item, index) => (
            <CompactMetric key={item.title} item={item} index={index} />
          ))}
        </div>
      </SectionShell>

      <div className="grid gap-6 2xl:grid-cols-5">
        <div className="2xl:col-span-3">
          <SectionShell
            cardClass={cardClass}
            eyebrow="Revenue Intelligence"
            title="Revenue Forecast and Collection Analytics"
            subtitle="Month-to-date revenue, collection rate, receipt approval, and outstanding forecast risk"
          >
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {revenueIntelligenceMetrics.map((item, index) => (
                <CompactMetric key={item.title} item={item} index={index} />
              ))}
            </div>
          </SectionShell>
        </div>

        <div className="2xl:col-span-2">
          <SectionShell
            cardClass={cardClass}
            eyebrow="Revenue Trend"
            title="Invoice vs Payment Movement"
            subtitle="Monthly movement from loaded Payment Center records"
          >
            <RevenueTrendPanel
              invoiceTrend={invoiceTrend}
              paymentTrend={paymentTrend}
              maxInvoiceTrend={maxInvoiceTrend}
              maxPaymentTrend={maxPaymentTrend}
            />
          </SectionShell>
        </div>
      </div>

      <SectionShell
        cardClass={cardClass}
        eyebrow="Notification Center V2"
        title="Executive Alert Command"
        subtitle="Payment, visa, portal, support, automation, and executive risk alerts in one command layer"
      >
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {notificationAlerts.map((item, index) => (
            <AlertMetric key={item.title} item={item} index={index} />
          ))}
        </div>
      </SectionShell>

      <SectionShell
        cardClass={cardClass}
        eyebrow="Alert Command Center"
        title="Mission Control Notification Center"
        subtitle="Full alert prioritization, resolution queue, escalation feed, and cross-system recovery map"
      >
        <MissionControlNotificationCenter
          inquiries={inquiries}
          appointments={appointments}
          followUpReminders={followUpReminders}
          studentApplications={studentApplications}
          studentDocuments={studentDocuments}
          studentTasks={studentTasks}
          studentUniversities={studentUniversities}
          studentRiskScores={studentRiskScores}
          studentInvoices={studentInvoices}
          studentPayments={studentPayments}
          studentReceipts={studentReceipts}
          paymentReceipts={paymentReceipts}
          studentPortalAccounts={studentPortalAccounts}
          portalAccounts={portalAccounts}
          supportRequests={supportRequests}
          studentSupportRequests={studentSupportRequests}
          counselorPaymentRequests={counselorPaymentRequests}
          executiveExecutionLogs={executiveExecutionLogs}
          automationQueue={automationQueue}
          executiveActionQueue={executiveActionQueue}
        />
      </SectionShell>

      <div className="grid gap-6 xl:grid-cols-2">
        <SectionShell
          cardClass={cardClass}
          eyebrow="Student Portal"
          title="Portal Intelligence"
          subtitle="Portal account activity, login coverage, and password reset pressure"
        >
          <div className="grid gap-4 md:grid-cols-2">
            {portalMetrics.map((item, index) => (
              <CompactMetric key={item.title} item={item} index={index} />
            ))}
          </div>
        </SectionShell>

        <SectionShell
          cardClass={cardClass}
          eyebrow="Support Center"
          title="Support Intelligence"
          subtitle="Open requests, response pressure, escalations, and resolved support history"
        >
          <div className="grid gap-4 md:grid-cols-2">
            {supportMetrics.map((item, index) => (
              <CompactMetric key={item.title} item={item} index={index} />
            ))}
          </div>
        </SectionShell>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <SectionShell
          cardClass={cardClass}
          eyebrow="Portal Analytics"
          title="Portal Usage Analytics"
          subtitle="Activation, recent activity, stale accounts, and password pressure"
        >
          <div className="grid gap-4 md:grid-cols-2">
            {portalAnalyticsMetrics.map((item, index) => (
              <CompactMetric key={item.title} item={item} index={index} />
            ))}
          </div>
        </SectionShell>

        <SectionShell
          cardClass={cardClass}
          eyebrow="Support Analytics"
          title="Support Response Analytics"
          subtitle="Resolution rate, response queue, escalations, and support pressure"
        >
          <div className="grid gap-4 md:grid-cols-2">
            {supportAnalyticsMetrics.map((item, index) => (
              <CompactMetric key={item.title} item={item} index={index} />
            ))}
          </div>
        </SectionShell>
      </div>

      <SectionShell
        cardClass={cardClass}
        eyebrow="Executive Command Shortcuts"
        title="Mission Control Operating Actions"
        subtitle="Leadership shortcuts for the next operating layer: notifications, revenue, portal, support, and automation control"
      >
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <OperatingActionCard title="Open Alerts" value={notificationAlerts.reduce((sum, item) => sum + Number(item.value || 0), 0)} note="Cross-system alert pressure" icon="🔔" />
          <OperatingActionCard title="Revenue Follow-up" value={formatMoney(outstandingValue)} note={`${unpaidInvoices} unpaid invoices`} icon="💷" />
          <OperatingActionCard title="Portal Recovery" value={portalRiskScore} note={`${stalePortalAccounts} stale portal accounts`} icon="🔐" />
          <OperatingActionCard title="Support Recovery" value={supportPressureScore} note={`${escalatedSupportRequests} escalated support cases`} icon="📬" />
          <OperatingActionCard title="Automation Recovery" value={automationRiskScore} note={`${failedExecutions} failed executions`} icon="⚙️" />
        </div>
      </SectionShell>

      <SectionShell
        cardClass={cardClass}
        eyebrow="System Health"
        title="Student OS Operating Map"
        subtitle="CRM-compatible health layer showing connected operating systems"
      >
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          {systemHealth.map((system, index) => (
            <motion.div
              key={system.title}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: index * 0.03 }}
              className="flex items-center justify-between rounded-2xl border border-slate-300 bg-white p-4"
            >
              <div>
                <p className="text-sm font-bold text-[#10233f]">
                  {system.title}
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  {system.detail}
                </p>
              </div>

              <span
                className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] ${
                  system.active
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                    : "bg-orange-50 text-orange-700 border border-orange-200"
                }`}
              >
                {system.active ? "Live" : "Waiting"}
              </span>
            </motion.div>
          ))}
        </div>
      </SectionShell>
    </div>
  );
}


function OperatingActionCard({ title, value, note, icon }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.24 }}
      className="rounded-2xl border border-slate-300 bg-white p-5"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500">
            {title}
          </p>
          <p className="mt-3 text-2xl font-black text-[#10233f]">
            {value}
          </p>
          <p className="mt-2 text-xs leading-5 text-slate-500">
            {note}
          </p>
        </div>
        <div className="text-3xl">{icon}</div>
      </div>
    </motion.div>
  );
}

function SectionShell({ cardClass, eyebrow, title, subtitle, children }) {
  return (
    <div className={`${cardClass} rounded-[1.75rem] border border-slate-300 bg-white p-6 shadow-[0_8px_24px_rgba(15,35,63,0.045)]`}>
      <div className="mb-5">
        <p className="text-[10px] uppercase tracking-[0.25em] text-orange-700">
          {eyebrow}
        </p>

        <h3 className="mt-2 text-xl font-black text-[#10233f]">
          {title}
        </h3>

        {subtitle && (
          <p className="mt-2 text-sm text-slate-500">
            {subtitle}
          </p>
        )}
      </div>

      {children}
    </div>
  );
}

function MissionMetricCard({ stat, index, cardClass }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.3,
        delay: index * 0.05,
      }}
      className={`${cardClass} rounded-[1.5rem] border border-slate-300 bg-white p-5 shadow-[0_6px_18px_rgba(15,35,63,0.04)]`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
            {stat.title}
          </p>

          <h3 className={`mt-3 text-4xl font-black ${stat.color}`}>
            {stat.value}
          </h3>

          <p className="mt-2 text-xs text-slate-500">
            {stat.note}
          </p>
        </div>

        <div className="text-3xl">
          {stat.icon}
        </div>
      </div>
    </motion.div>
  );
}

function CompactMetric({ item, index }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: index * 0.04 }}
      className="rounded-2xl border border-slate-300 bg-white p-5"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
            {item.title}
          </p>

          <p className={`mt-3 text-3xl font-black ${item.color}`}>
            {item.value}
          </p>
        </div>

        <div className="text-2xl">
          {item.icon}
        </div>
      </div>

      <p className="mt-3 text-xs text-slate-500">
        {item.note}
      </p>
    </motion.div>
  );
}

function ExecutionLogRow({ log, index }) {
  const status = toLower(log.status || log.execution_status || log.approval_status);
  const failed =
    status.includes("failed") ||
    status.includes("error") ||
    Boolean(log.error_message || log.error || log.failure_reason);

  const pending =
    status.includes("pending") ||
    status.includes("queued") ||
    status.includes("waiting");

  const statusClass = failed
    ? "border-red-400/20 bg-red-400/10 text-red-700"
    : pending
    ? "border-orange-400/20 bg-orange-50 text-orange-700 border border-orange-200"
    : "border-green-400/20 bg-emerald-50 text-emerald-700 border border-emerald-200";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, delay: index * 0.03 }}
      className="rounded-2xl border border-slate-300 bg-white p-4"
    >
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-black text-[#10233f]">
            {log.action_type ||
              log.template_key ||
              log.recommendation_type ||
              "Executive Automation Action"}
          </p>

          <p className="mt-1 text-xs text-slate-500">
            {log.student_name || "Unknown student"} •{" "}
            {log.student_type || "student"} •{" "}
            {formatDate(log.executed_at || log.created_at || log.generated_at)}
          </p>

          {(log.error_message || log.error || log.failure_reason) && (
            <p className="mt-2 line-clamp-2 text-xs text-red-700">
              {log.error_message || log.error || log.failure_reason}
            </p>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          <span className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] ${statusClass}`}>
            {log.status || log.execution_status || log.approval_status || "executed"}
          </span>

          {log.duplicate_detected && (
            <span className="rounded-full border border-blue-400/20 bg-blue-400/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-blue-700">
              Duplicate Protected
            </span>
          )}

          {log.priority && (
            <span className="rounded-full border border-[#F97316]/20 bg-[#F97316]/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-orange-700">
              {log.priority}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function RevenueTrendPanel({
  invoiceTrend = [],
  paymentTrend = [],
  maxInvoiceTrend = 1,
  maxPaymentTrend = 1,
}) {
  const hasTrend = invoiceTrend.length || paymentTrend.length;

  if (!hasTrend) {
    return <EmptyState text="No invoice or payment trend data loaded yet." />;
  }

  return (
    <div className="space-y-5">
      <TrendGroup
        title="Invoice Trend"
        items={invoiceTrend}
        maxValue={maxInvoiceTrend}
        tone="bg-cyan-300"
      />

      <TrendGroup
        title="Payment Trend"
        items={paymentTrend}
        maxValue={maxPaymentTrend}
        tone="bg-green-300"
      />
    </div>
  );
}

function TrendGroup({ title, items = [], maxValue = 1, tone = "bg-[#F97316]" }) {
  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">
          {title}
        </p>

        <p className="text-xs text-slate-500">
          {formatMoney(items.reduce((sum, item) => sum + Number(item.value || 0), 0))}
        </p>
      </div>

      <div className="space-y-3">
        {items.map((item) => {
          const width = Math.max(5, Math.min(100, percent(item.value, maxValue)));

          return (
            <div key={`${title}-${item.label}`} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-white/70">{item.label}</span>
                <span className="text-slate-500">{formatMoney(item.value)}</span>
              </div>

              <div className="h-2 overflow-hidden rounded-full bg-white/10">
                <div className={`h-full rounded-full ${tone}`} style={{ width: `${width}%` }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function AlertMetric({ item, index }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: index * 0.04 }}
      className="relative overflow-hidden rounded-2xl border border-slate-300 bg-white p-5"
    >
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-orange-500 via-orange-300 to-red-400" />

      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
            {item.title}
          </p>

          <p className={`mt-3 text-4xl font-black ${item.color}`}>
            {item.value}
          </p>
        </div>

        <div className="text-3xl">
          {item.icon}
        </div>
      </div>

      <p className="mt-3 text-xs text-slate-500">
        {item.note}
      </p>

      <p className="mt-4 rounded-full border border-slate-300 bg-[#fffaf2] px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">
        {item.type} alert
      </p>
    </motion.div>
  );
}

function EmptyState({ text }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-[#fffaf2] p-6 text-sm text-slate-500">
      {text}
    </div>
  );
}

export default StudentOSMissionControl;
