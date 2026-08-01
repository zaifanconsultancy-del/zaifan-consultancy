// StudentOSMissionControl PARTNER OS EXTREME — Executive Student OS Command
// Preserves the complete 1700+ line mission-control analytics architecture:
// journey, revenue, portal, support, notification, automation, risk, system health,
// execution logs and connected MissionControlNotificationCenter.
// Mature file retained; visual hierarchy aligned with Zaifan Admin OS.
// V6 MAXIMUM additionally hardens record identity, duplicate merging, date handling,
// money truthfulness, funnel status normalization, monthly trend ordering, system-health
// semantics, operating-score coverage, and white-surface contrast. No fake forecasts.

import { motion, useReducedMotion } from "framer-motion";
import MissionControlNotificationCenter from "../communications/MissionControlNotificationCenter";

const safeArray = (value) => (Array.isArray(value) ? value.filter(Boolean) : []);

const toLower = (value) => String(value || "").toLowerCase().trim();

const normalizeStatus = (value) =>
  toLower(value).replace(/\s+/g, "_").replace(/-/g, "_");

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
  ].includes(normalizeStatus(status));

const safeDate = (value) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const isOverdue = (dateValue) => {
  const date = safeDate(dateValue);
  if (!date) return false;

  // Date-only CRM deadlines stay valid through the end of that calendar day.
  if (/^\d{4}-\d{2}-\d{2}$/.test(String(dateValue))) {
    date.setHours(23, 59, 59, 999);
  }

  return date.getTime() < Date.now();
};

const getRecordIdentity = (item = {}, fallbackPrefix = "record") => {
  const type = normalizeStatus(
    item.student_type || item.__leadType || item.lead_type || item.type || fallbackPrefix
  );

  const rawId =
    item.student_id ??
    item.studentId ??
    item.inquiry_id ??
    item.appointment_id ??
    item.id ??
    item.email ??
    item.student_email ??
    item.phone ??
    item.student_phone ??
    null;

  return rawId === null || rawId === undefined || rawId === ""
    ? null
    : `${type || fallbackPrefix}:${String(rawId)}`;
};

const uniqueCount = (items = [], prefix = "record") =>
  new Set(
    safeArray(items)
      .map((item) => getRecordIdentity(item, prefix))
      .filter(Boolean)
  ).size;

const mergeUniqueRecords = (...collections) => {
  const map = new Map();

  collections.flatMap(safeArray).forEach((item, index) => {
    const key =
      getRecordIdentity(item, "merged") ||
      `anonymous:${index}:${JSON.stringify(item)}`;

    if (!map.has(key)) map.set(key, item);
  });

  return [...map.values()];
};

const duplicateCount = (...collections) => {
  const rows = collections.flatMap(safeArray);
  return Math.max(0, rows.length - mergeUniqueRecords(...collections).length);
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

const percent = (value, total) => {
  const cleanTotal = Number(total || 0);
  if (!Number.isFinite(cleanTotal) || cleanTotal <= 0) return 0;

  const cleanValue = Number(value || 0);
  if (!Number.isFinite(cleanValue)) return 0;

  return Math.max(0, Math.min(100, Math.round((cleanValue / cleanTotal) * 100)));
};

const formatDate = (value) => {
  const date = safeDate(value);
  if (!date) return value ? "Invalid date" : "No date";

  return date.toLocaleString("en-PK", {
    dateStyle: "medium",
    timeStyle: "short",
  });
};

const getAmount = (item = {}) => {
  const candidates = [
    item.amount,
    item.total_amount,
    item.invoice_amount,
    item.paid_amount,
    item.payment_amount,
    item.receipt_amount,
    item.value,
  ];

  const raw = candidates.find(
    (value) => value !== null && value !== undefined && value !== ""
  );

  const amount = Number(raw || 0);
  return Number.isFinite(amount) ? amount : 0;
};

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
  const date = safeDate(value);
  if (!date) return null;

  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
};

const getMonthLabel = (monthKey) => {
  if (!monthKey) return "Unknown";
  const [year, month] = monthKey.split("-").map(Number);
  const date = new Date(year, Math.max(0, month - 1), 1);

  return date.toLocaleString("en-GB", {
    month: "short",
    year: "2-digit",
  });
};

const buildMonthlyMoneyTrend = (items = [], valueResolver = getAmount, limit = 6) => {
  const buckets = new Map();

  safeArray(items).forEach((item) => {
    const key = getMonthKey(getRecordDate(item));
    if (!key) return;

    buckets.set(key, (buckets.get(key) || 0) + Number(valueResolver(item) || 0));
  });

  return [...buckets.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-limit)
    .map(([key, value]) => ({
      key,
      label: getMonthLabel(key),
      value,
    }));
};

const getTrendMax = (items = []) =>
  Math.max(...safeArray(items).map((item) => Number(item.value || 0)), 1);

const getUrgencyTone = (value = 0, warning = 1, danger = 5) => {
  const clean = Number(value || 0);
  if (clean >= danger) return "text-red-700";
  if (clean >= warning) return "text-orange-700";
  return "text-emerald-700";
};

const averageAvailablePercent = (metrics = []) => {
  const available = metrics.filter((item) => item.available);
  if (!available.length) return 0;

  return Math.round(
    available.reduce((sum, item) => sum + percent(item.value, item.total), 0) /
      available.length
  );
};

const getStatusValue = (item = {}, ...keys) =>
  normalizeStatus(keys.map((key) => item?.[key]).find(Boolean));

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
  const reduceMotion = useReducedMotion();

  const safeInquiries = safeArray(inquiries);
  const safeAppointments = safeArray(appointments);
  const safeApplications = safeArray(studentApplications);
  const safeDocuments = safeArray(studentDocuments);
  const safeTasks = safeArray(studentTasks);
  const safeUniversities = safeArray(studentUniversities);
  const safeRiskScores = safeArray(studentRiskScores);
  const safeReminders = safeArray(followUpReminders);
  const safeInvoices = safeArray(studentInvoices);
  const safePayments = safeArray(studentPayments);
  const safeExecutionLogs = safeArray(executiveExecutionLogs);
  const safePaymentRequests = safeArray(counselorPaymentRequests);

  const allStudents = [
    ...safeInquiries.map((item) => ({ ...item, __leadType: "inquiry" })),
    ...safeAppointments.map((item) => ({ ...item, __leadType: "appointment" })),
  ];

  const allReceipts = mergeUniqueRecords(studentReceipts, paymentReceipts);
  const allPortalAccounts = mergeUniqueRecords(studentPortalAccounts, portalAccounts);
  const allSupportRequests = mergeUniqueRecords(supportRequests, studentSupportRequests);
  const allAutomationQueue = mergeUniqueRecords(automationQueue, executiveActionQueue);

  const dataIntegrity = {
    duplicateReceipts: duplicateCount(studentReceipts, paymentReceipts),
    duplicatePortalAccounts: duplicateCount(studentPortalAccounts, portalAccounts),
    duplicateSupportRequests: duplicateCount(supportRequests, studentSupportRequests),
    duplicateAutomationItems: duplicateCount(automationQueue, executiveActionQueue),
  };

  const duplicateRecordsPrevented = Object.values(dataIntegrity).reduce(
    (sum, value) => sum + Number(value || 0),
    0
  );

  const totalStudents = uniqueCount(allStudents, "student");
  const applicationsCount = safeApplications.length;

  const submittedApplications = safeApplications.filter((app) => {
    const status = getStatusValue(app, "application_status", "status");
    return status.includes("submit") || status.includes("applied") || status.includes("review");
  }).length;

  const offerCount = safeApplications.filter((app) => {
    const offerStatus = getStatusValue(app, "offer_status");
    const status = getStatusValue(app, "application_status", "status");
    return (
      offerStatus === "received" ||
      offerStatus.includes("offer") ||
      status.includes("offer")
    );
  }).length;

  const offerAcceptedCount = safeApplications.filter((app) => {
    const offerStatus = getStatusValue(app, "offer_status");
    return offerStatus.includes("accepted") || offerStatus.includes("firm");
  }).length;

  const casCount = studentApplications.filter((app) =>
    getStatusValue(app, "cas_status", "cas", "application_status").includes("issued")
  ).length;

  const visaSubmittedCount = safeApplications.filter((app) => {
    const status = getStatusValue(app, "visa_status", "visa");
    return (
      status.includes("submitted") ||
      status.includes("processing") ||
      status.includes("pending")
    );
  }).length;

  const visaCount = studentApplications.filter((app) =>
    getStatusValue(app, "visa_status", "visa").includes("approved")
  ).length;

  const documentsCount = safeDocuments.length;

  const pendingDocuments = safeDocuments.filter(
    (doc) => !isDone(doc.status || doc.document_status || doc.verification_status)
  ).length;

  const pendingTasksList = safeTasks.filter(
    (task) => !isDone(task.status || task.task_status)
  );

  const pendingTasks = pendingTasksList.length;

  const overdueTasks = pendingTasksList.filter((task) =>
    isOverdue(task.due_date || task.deadline || task.target_date)
  ).length;

  const universityPlans = safeUniversities.length;

  const dreamUniversities = safeUniversities.filter((uni) =>
    toLower(uni.preference_type || uni.category || uni.type).includes("dream")
  ).length;

  const targetUniversities = safeUniversities.filter((uni) =>
    toLower(uni.preference_type || uni.category || uni.type).includes("target")
  ).length;

  const safeUniversityCount = safeUniversities.filter((uni) =>
    toLower(uni.preference_type || uni.category || uni.type).includes("safe")
  ).length;

  const highRiskStudents = safeRiskScores.filter((risk) => {
    const riskLevel = toLower(risk.risk_level || risk.priority || risk.level);
    const score = Number(risk.risk_score || risk.score || risk.overall_score || 0);

    return riskLevel.includes("high") || riskLevel.includes("critical") || score >= 70;
  }).length;

  const criticalRiskStudents = safeRiskScores.filter((risk) => {
    const riskLevel = toLower(risk.risk_level || risk.priority || risk.level);
    const score = Number(risk.risk_score || risk.score || risk.overall_score || 0);

    return riskLevel.includes("critical") || score >= 85;
  }).length;

  const overdueReminders = safeReminders.filter((reminder) => {
    const dueDate = reminder.due_date || reminder.reminder_date || reminder.date;
    return isOverdue(dueDate) && !isDone(reminder.status);
  }).length;

  const casDelays = safeApplications.filter((app) => {
    const offerStatus = getStatusValue(app, "offer_status");
    const casStatus = getStatusValue(app, "cas_status", "cas", "application_status");
    const acceptedOffer =
      offerStatus.includes("accepted") || offerStatus.includes("firm");
    const casNotIssued = !casStatus.includes("issued");

    return acceptedOffer && casNotIssued;
  }).length;

  const visaDelays = safeApplications.filter((app) => {
    const casStatus = getStatusValue(app, "cas_status", "cas", "application_status");
    const visaStatus = getStatusValue(app, "visa_status", "visa");
    const casIssued = casStatus.includes("issued");
    const visaNotApproved = !visaStatus.includes("approved");

    return casIssued && visaNotApproved;
  }).length;

  const invoicesCount = safeInvoices.length;

  const invoiceValue = safeInvoices.reduce(
    (sum, invoice) =>
      sum + Number(invoice.amount || invoice.total_amount || invoice.invoice_amount || 0),
    0
  );

  const paymentsCount = safePayments.length;

  const paidValue = safePayments.reduce(
    (sum, payment) =>
      sum + Number(payment.amount || payment.paid_amount || payment.payment_amount || 0),
    0
  );

  const outstandingValue = safeInvoices.reduce((sum, invoice) => {
    const status = toLower(invoice.status || invoice.payment_status);
    const amount = getAmount(invoice);
    const hasExplicitOutstanding =
      invoice.outstanding_amount !== null &&
      invoice.outstanding_amount !== undefined &&
      invoice.outstanding_amount !== "";
    const hasExplicitBalance =
      invoice.balance !== null &&
      invoice.balance !== undefined &&
      invoice.balance !== "";

    const explicitOutstanding = hasExplicitOutstanding
      ? Number(invoice.outstanding_amount)
      : hasExplicitBalance
      ? Number(invoice.balance)
      : null;

    if (status.includes("paid") || status.includes("complete")) return sum;

    return (
      sum +
      (Number.isFinite(explicitOutstanding)
        ? Math.max(0, explicitOutstanding)
        : Math.max(0, amount))
    );
  }, 0);

  const unpaidInvoices = safeInvoices.filter((invoice) => {
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

  const paymentRisks = unpaidInvoices + pendingReceipts + safePaymentRequests.length;

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

  const successfulExecutions = safeExecutionLogs.filter((log) => {
    const status = normalizeStatus(log.status || log.execution_status || log.approval_status);
    return (
      status.includes("success") ||
      status.includes("executed") ||
      status.includes("completed") ||
      status.includes("approved")
    );
  }).length;

  const failedExecutions = safeExecutionLogs.filter((log) => {
    const status = normalizeStatus(log.status || log.execution_status || log.approval_status);
    const error = log.error_message || log.error || log.failure_reason;
    return status.includes("failed") || status.includes("error") || Boolean(error);
  }).length;

  const pendingApprovals = safeExecutionLogs.filter((log) => {
    const approval = toLower(log.approval_status || log.status);
    return approval.includes("pending") || approval.includes("queued") || approval.includes("waiting");
  }).length;

  const duplicateBlockedExecutions = safeExecutionLogs.filter(
    (log) => log.duplicate_detected || log.duplicate_blocked
  ).length;

  const humanApprovedExecutions = safeExecutionLogs.filter((log) => {
    const approval = toLower(log.approval_status || log.status);
    return approval.includes("approved");
  }).length;

  const recentExecutions = [...safeExecutionLogs]
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

  const currentMonthInvoiceValue = safeInvoices
    .filter((invoice) => isThisMonth(getRecordDate(invoice)))
    .reduce((sum, invoice) => sum + getAmount(invoice), 0);

  const currentMonthPaidValue = safePayments
    .filter((payment) => isThisMonth(getRecordDate(payment)))
    .reduce((sum, payment) => sum + getAmount(payment), 0);

  const recentInvoiceValue = safeInvoices
    .filter((invoice) => isWithinDays(getRecordDate(invoice), 30))
    .reduce((sum, invoice) => sum + getAmount(invoice), 0);

  const recentPaymentValue = safePayments
    .filter((payment) => isWithinDays(getRecordDate(payment), 30))
    .reduce((sum, payment) => sum + getAmount(payment), 0);

  const invoiceCollectionRate = percent(paidValue, invoiceValue);
  const invoicePaymentCoverage = percent(paymentsCount, invoicesCount);
  const receiptApprovalRate = percent(approvedReceipts, allReceipts.length);
  const outstandingRevenueExposure = outstandingValue;
  const revenueRiskScore = unpaidInvoices + pendingReceipts + safePaymentRequests.length;

  const invoiceTrend = buildMonthlyMoneyTrend(safeInvoices);
  const paymentTrend = buildMonthlyMoneyTrend(safePayments);
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
      color: "bg-[#FFF4E8]",
      border: "border-[#F59E0B]",
      text: "text-orange-700",
    },
    {
      title: "Application",
      value: applicationsCount,
      subtitle: `${submittedApplications} submitted / active`,
      icon: "📝",
      color: "bg-[#F1F7FD]",
      border: "border-[#60A5FA]",
      text: "text-sky-700",
    },
    {
      title: "Offer",
      value: offerCount,
      subtitle: `${offerAcceptedCount} accepted`,
      icon: "🎉",
      color: "bg-[#F0FBF6]",
      border: "border-[#34D399]",
      text: "text-emerald-700",
    },
    {
      title: "CAS",
      value: casCount,
      subtitle: `${casDelays} delayed`,
      icon: "📄",
      color: "bg-[#F1F6FC]",
      border: "border-[#60A5FA]",
      text: "text-blue-700",
    },
    {
      title: "Visa",
      value: visaCount,
      subtitle: `${visaSubmittedCount} submitted / pending`,
      icon: "✈️",
      color: "bg-[#F0FBF6]",
      border: "border-[#34D399]",
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
      value: safeExecutionLogs.length,
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
      note: `${invoicePaymentCoverage}% invoice/payment record coverage`,
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
      title: "Outstanding Exposure",
      value: formatMoney(outstandingRevenueExposure),
      note: "Verified outstanding invoice exposure",
      icon: "⚠️",
      color: "text-orange-700",
    },
    {
      title: "Payment Requests",
      value: safePaymentRequests.length,
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
      value: safeExecutionLogs.length,
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
      note: `${dreamUniversities}/${targetUniversities}/${safeUniversityCount} D/T/S`,
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
      value: `${percent(safeTasks.length - pendingTasks, safeTasks.length)}%`,
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
      active: safeTasks.length > 0,
      detail: `${pendingTasks} pending`,
    },
    {
      title: "Executive Risk",
      active: safeRiskScores.length > 0,
      detail: `${highRiskStudents} high risk scores`,
    },
    {
      title: "Executive Automation",
      active: safeExecutionLogs.length > 0 || allAutomationQueue.length > 0,
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
      detail: "Derived from loaded Admin OS data",
    },
  ];

  const operatingScore = averageAvailablePercent([
    { value: applicationsCount, total: totalStudents, available: totalStudents > 0 },
    { value: offerCount, total: applicationsCount, available: applicationsCount > 0 },
    {
      value: casCount,
      total: offerAcceptedCount || offerCount,
      available: (offerAcceptedCount || offerCount) > 0,
    },
    { value: visaCount, total: casCount, available: casCount > 0 },
    {
      value: documentsCount - pendingDocuments,
      total: documentsCount,
      available: documentsCount > 0,
    },
    {
      value: safeTasks.length - pendingTasks,
      total: safeTasks.length,
      available: safeTasks.length > 0,
    },
    {
      value: successfulExecutions,
      total: successfulExecutions + failedExecutions,
      available: successfulExecutions + failedExecutions > 0,
    },
  ]);

  const executivePressure =
    highRiskStudents +
    casDelays +
    visaDelays +
    paymentRisks +
    openSupportRequests +
    overdueReminders +
    automationPressure;

  return (
    <div className="min-w-0 space-y-5 rounded-[2.25rem] border-[4px] border-[#123865] bg-[#FFF8EF] p-3 text-[#10233F] shadow-[0_24px_65px_rgba(18,56,101,0.15)] sm:p-4">
      <motion.div
        initial={reduceMotion ? false : { opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: reduceMotion ? 0 : 0.35 }}
        className={`${cardClass} relative min-w-0 overflow-hidden rounded-[1.8rem] border-[3px] border-[#FF5A0A] p-5 text-white shadow-[0_22px_60px_rgba(18,56,101,0.18)] sm:p-6 lg:p-7`}
        style={{ backgroundColor: "#123865", color: "#FFFFFF" }}
      >

        <div className="relative grid min-w-0 gap-5 lg:grid-cols-[minmax(0,1.3fr)_minmax(18rem,0.7fr)] lg:items-center">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-orange-300">
              Executive Operations Center
            </p>

            <h2 className="mt-3 max-w-4xl break-words text-3xl font-black leading-tight tracking-[-0.035em] text-white sm:text-4xl">
              Student OS Mission Control V6
            </h2>

            <p className="mt-3 max-w-4xl break-words text-sm font-semibold leading-6 text-slate-100">
              Unified command layer across Student Journey, Applications, Offers,
              CAS, Visa, Payments, Portal, Support, Executive AI, Automation,
              Execution Logs, Risk, Tasks, Documents, University Planning, Revenue Intelligence, Portal Analytics, and Notification Alerts.
            </p>
          </div>

          <div className="grid min-w-0 gap-3 sm:grid-cols-2">
            <div className="min-w-0 rounded-[1.35rem] border-[3px] border-white/25 bg-white/10 p-5 text-center shadow-inner">
              <p className="text-[10px] uppercase tracking-[0.25em] text-white">
                Operating Score
              </p>

              <p className="mt-2 text-5xl font-black text-orange-300">
                {operatingScore}%
              </p>

              <p className="mt-1 text-xs text-white">
                Available-system health
              </p>
            </div>

            <div className="min-w-0 rounded-[1.35rem] border-[3px] border-[#FB7185] bg-[#FFF4F4] p-5 text-center shadow-[0_8px_22px_rgba(190,24,93,0.08)]">
              <p className="text-[10px] font-black uppercase tracking-[0.25em] text-red-700">
                Executive Pressure
              </p>

              <p className="mt-2 text-5xl font-black text-red-700">
                {executivePressure}
              </p>

              <p className="mt-1 text-xs font-semibold text-red-700">
                Risks needing leadership attention
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      <SectionShell
        cardClass={cardClass}
        eyebrow="Data Integrity"
        title="Mission Control Data Contract"
        subtitle="Checks merged sources before executive totals are calculated so duplicate connector rows do not inflate operations."
      >
        <div className="grid min-w-0 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          <IntegrityMetric
            label="Duplicates Prevented"
            value={duplicateRecordsPrevented}
            note="Across merged receipt, portal, support and automation sources"
            tone={duplicateRecordsPrevented ? "warning" : "good"}
          />
          <IntegrityMetric
            label="Student Identity"
            value={totalStudents}
            note="Inquiry and appointment IDs remain type-scoped"
            tone="navy"
          />
          <IntegrityMetric
            label="Revenue Basis"
            value={formatMoney(invoiceValue)}
            note="Actual loaded invoice values only"
            tone="orange"
          />
          <IntegrityMetric
            label="Outstanding Basis"
            value={formatMoney(outstandingValue)}
            note="Explicit balance/outstanding fields preferred"
            tone={outstandingValue > 0 ? "warning" : "good"}
          />
          <IntegrityMetric
            label="Operating Score"
            value={`${operatingScore}%`}
            note="Average of available systems only"
            tone="navy"
          />
        </div>
      </SectionShell>

      <div className="grid min-w-0 gap-4 md:grid-cols-2 xl:grid-cols-4">
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
        <div className="grid min-w-0 gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5">
          {pipelineStages.map((stage, index) => (
            <motion.div
              key={stage.title}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.28, delay: index * 0.04 }}
              className={`relative min-h-[180px] min-w-0 overflow-hidden rounded-[1.35rem] border-[3px] ${stage.border || "border-[#94A3B8]"} ${stage.color} p-5 shadow-[0_8px_22px_rgba(18,56,101,0.06)] transition hover:-translate-y-0.5 hover:shadow-[0_14px_30px_rgba(18,56,101,0.10)]`}
            >
              <div className="flex min-w-0 items-start justify-between gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border-2 border-white bg-white text-2xl shadow-[0_4px_12px_rgba(18,56,101,0.08)]">
                  {stage.icon}
                </div>

                {index < pipelineStages.length - 1 && (
                  <span className="hidden text-2xl font-black text-[#B8C6D6] 2xl:block">
                    →
                  </span>
                )}
              </div>

              <p className="mt-5 text-[9px] font-black uppercase tracking-[0.18em] text-[#617187]">
                {stage.title}
              </p>

              <p className={`mt-2 text-4xl font-black leading-none ${stage.text}`}>
                {stage.value}
              </p>

              <p className="mt-4 border-t-2 border-black/10 pt-3 text-xs font-bold leading-5 text-[#5B6E84]">
                {stage.subtitle}
              </p>
            </motion.div>
          ))}
        </div>
      </SectionShell>

      <div className="grid min-w-0 gap-6 2xl:grid-cols-2">
        <div className="min-w-0">
          <SectionShell
            cardClass={cardClass}
            eyebrow="Executive Intelligence"
            title="Executive Watchlist"
            subtitle="The pressure points leadership should act on first"
          >
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {watchlist.map((item, index) => (
                <CompactMetric key={item.title} item={item} index={index} />
              ))}
            </div>
          </SectionShell>
        </div>

        <div className="min-w-0">
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
        <div className="grid min-w-0 gap-4 md:grid-cols-2 xl:grid-cols-3">
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
        <div className="grid min-w-0 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {revenueMetrics.map((item, index) => (
            <CompactMetric key={item.title} item={item} index={index} />
          ))}
        </div>
      </SectionShell>

      <div className="grid min-w-0 gap-6 2xl:grid-cols-[minmax(0,1.35fr)_minmax(22rem,0.65fr)]">
        <div className="min-w-0">
          <SectionShell
            cardClass={cardClass}
            eyebrow="Revenue Intelligence"
            title="Revenue Collection & Exposure Analytics"
            subtitle="Month-to-date revenue, collection rate, receipt approval, and verified outstanding exposure"
          >
            <div className="grid min-w-0 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {revenueIntelligenceMetrics.map((item, index) => (
                <CompactMetric key={item.title} item={item} index={index} />
              ))}
            </div>
          </SectionShell>
        </div>

        <div className="min-w-0">
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
        <div className="grid min-w-0 gap-4 md:grid-cols-2 xl:grid-cols-3">
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

      <div className="grid min-w-0 gap-6 xl:grid-cols-2">
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

      <div className="grid min-w-0 gap-6 xl:grid-cols-2">
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
        eyebrow="Executive Pressure Summary"
        title="Mission Control Operating Pressure"
        subtitle="Read-only leadership pressure indicators. These cards do not execute actions by themselves."
      >
        <div className="grid min-w-0 gap-4 md:grid-cols-2 xl:grid-cols-5">
          <OperatingActionCard title="Alert Pressure" value={notificationAlerts.reduce((sum, item) => sum + Number(item.value || 0), 0)} note="Cross-system alert pressure" icon="🔔" />
          <OperatingActionCard title="Revenue Exposure" value={formatMoney(outstandingValue)} note={`${unpaidInvoices} unpaid invoices`} icon="💷" />
          <OperatingActionCard title="Portal Pressure" value={portalRiskScore} note={`${stalePortalAccounts} stale portal accounts`} icon="🔐" />
          <OperatingActionCard title="Support Pressure" value={supportPressureScore} note={`${escalatedSupportRequests} escalated support cases`} icon="📬" />
          <OperatingActionCard title="Automation Pressure" value={automationRiskScore} note={`${failedExecutions} failed executions`} icon="⚙️" />
        </div>
      </SectionShell>

      <SectionShell
        cardClass={cardClass}
        eyebrow="System Health"
        title="Student OS Operating Map"
        subtitle="CRM-compatible health layer showing connected operating systems"
      >
        <div className="grid min-w-0 gap-3 md:grid-cols-2 xl:grid-cols-5">
          {systemHealth.map((system, index) => (
            <motion.div
              key={system.title}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: index * 0.03 }}
              className={`flex min-w-0 items-center justify-between gap-3 rounded-[1.3rem] border-[3px] p-4 shadow-[0_7px_18px_rgba(18,56,101,0.05)] transition hover:-translate-y-0.5 hover:shadow-[0_12px_26px_rgba(18,56,101,0.09)] ${
                index % 5 === 0
                  ? "border-blue-400 bg-[#F2F7FF]"
                  : index % 5 === 1
                  ? "border-emerald-400 bg-[#F0FFF8]"
                  : index % 5 === 2
                  ? "border-violet-400 bg-[#F8F5FF]"
                  : index % 5 === 3
                  ? "border-orange-400 bg-[#FFF7ED]"
                  : "border-rose-400 bg-[#FFF4F4]"
              }`}
            >
              <div className="min-w-0">
                <p className="break-words text-sm font-black text-[#10233F]">
                  {system.title}
                </p>

                <p className="mt-1 break-words text-xs font-semibold leading-5 text-slate-600">
                  {system.detail}
                </p>
              </div>

              <span
                className={`rounded-full border-2 px-3 py-1 text-[9px] font-black uppercase tracking-[0.14em] ${
                  system.active
                    ? "border-emerald-300 bg-white text-emerald-700"
                    : "border-orange-300 bg-white text-orange-700"
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


function IntegrityMetric({ label, value, note, tone = "navy" }) {
  const styles = {
    good: "border-emerald-400 bg-emerald-50",
    warning: "border-orange-400 bg-orange-50",
    orange: "border-[#FF5A0A] bg-[#FF5A0A]",
    navy: "border-[#123865] bg-[#123865]",
  };

  const dark = tone === "navy" || tone === "orange";

  return (
    <div
      className={`min-w-0 rounded-[1.3rem] border-[3px] p-4 shadow-[0_7px_18px_rgba(18,56,101,0.06)] transition hover:-translate-y-0.5 hover:shadow-md ${styles[tone] || styles.navy}`}
      style={{ color: dark ? "#FFFFFF" : "#10233F" }}
    >
      <p
        className="text-[9px] font-black uppercase tracking-[0.1em]"
        style={{ color: tone === "orange" ? "#FFFFFF" : dark ? "#FDBA74" : "#64748B" }}
      >
        {label}
      </p>
      <p
        className="mt-2 break-words text-2xl font-black"
        style={{ color: dark ? "#FFFFFF" : "#10233F" }}
      >
        {value}
      </p>
      <p
        className="mt-2 text-xs font-semibold leading-5"
        style={{ color: dark ? "#F8FAFC" : "#64748B" }}
      >
        {note}
      </p>
    </div>
  );
}

function OperatingActionCard({ title, value, note, icon }) {
  const styles = {
    "Alert Pressure": {
      card: "border-orange-400 bg-[#FFF7ED]",
      value: "text-orange-700",
      icon: "border-orange-200 bg-white text-orange-700",
    },
    "Revenue Exposure": {
      card: "border-emerald-400 bg-[#F0FFF8]",
      value: "text-emerald-700",
      icon: "border-emerald-200 bg-white text-emerald-700",
    },
    "Portal Pressure": {
      card: "border-blue-400 bg-[#F2F7FF]",
      value: "text-blue-700",
      icon: "border-blue-200 bg-white text-blue-700",
    },
    "Support Pressure": {
      card: "border-amber-400 bg-[#FFF8EE]",
      value: "text-amber-800",
      icon: "border-amber-200 bg-white text-amber-700",
    },
    "Automation Pressure": {
      card: "border-violet-400 bg-[#F8F5FF]",
      value: "text-violet-700",
      icon: "border-violet-200 bg-white text-violet-700",
    },
  };

  const visual = styles[title] || styles["Portal Pressure"];

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.24 }}
      className={`group min-w-0 rounded-[1.35rem] border-[3px] p-4 shadow-[0_7px_18px_rgba(18,56,101,0.05)] transition hover:-translate-y-0.5 hover:shadow-[0_12px_26px_rgba(18,56,101,0.09)] ${visual.card}`}
    >
      <div className="flex min-w-0 items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="break-words text-[9px] font-black uppercase leading-4 tracking-[0.14em] text-slate-500">
            {title}
          </p>

          <p className={`mt-2 break-words text-3xl font-black leading-none ${visual.value}`}>
            {value}
          </p>
        </div>

        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border-2 text-lg shadow-[0_4px_10px_rgba(18,56,101,0.06)] transition group-hover:-translate-y-0.5 ${visual.icon}`}>
          {icon}
        </div>
      </div>

      <p className="mt-3 break-words text-xs font-semibold leading-5 text-slate-600">
        {note}
      </p>
    </motion.div>
  );
}

function SectionShell({ cardClass, eyebrow, title, subtitle, children }) {
  return (
    <section
      className={`${cardClass} min-w-0 overflow-hidden rounded-[1.7rem] border-[3px] border-[#C9D7E6] bg-white p-3 shadow-[0_12px_32px_rgba(18,56,101,0.07)] sm:p-4`}
    >
      <div
        className="relative overflow-hidden rounded-[1.35rem] border-[3px] border-[#FF5A0A] px-5 py-4 shadow-[0_8px_20px_rgba(18,56,101,0.14)] sm:px-6"
        style={{ backgroundColor: "#123865", color: "#FFFFFF" }}
      >

        <div className="relative">
          <div className="mb-2 flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-orange-400 shadow-[0_0_0_4px_rgba(251,146,60,0.14)]" />
            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-orange-300">
              {eyebrow}
            </p>
          </div>

          <h3 className="text-xl font-black text-white">
            {title}
          </h3>

          {subtitle && (
            <p className="mt-1.5 max-w-5xl text-sm font-semibold leading-6 text-white/85">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      <div className="min-w-0 px-1 pb-1 pt-4 sm:px-2 sm:pb-2 sm:pt-5">
        {children}
      </div>
    </section>
  );
}

function MissionMetricCard({ stat, index, cardClass }) {
  const visual =
    stat.color.includes("red")
      ? {
          borderColor: "#FB7185",
          backgroundColor: "#FFF4F4",
        }
      : stat.color.includes("emerald")
      ? {
          borderColor: "#34D399",
          backgroundColor: "#F0FFF8",
        }
      : stat.color.includes("violet")
      ? {
          borderColor: "#9B6CFF",
          backgroundColor: "#F8F5FF",
        }
      : stat.color.includes("blue") || stat.color.includes("sky")
      ? {
          borderColor: "#60A5FA",
          backgroundColor: "#F2F7FF",
        }
      : {
          borderColor: "#F59E0B",
          backgroundColor: "#FFF7ED",
        };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.3,
        delay: index * 0.05,
      }}
      className={`${cardClass} min-w-0 rounded-[1.4rem] border-[3px] p-5 shadow-[0_8px_22px_rgba(18,56,101,0.06)] transition hover:-translate-y-0.5 hover:shadow-md`}
      style={{
        borderColor: visual.borderColor,
        backgroundColor: visual.backgroundColor,
      }}
    >
      <div className="flex min-w-0 items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="break-words text-[10px] font-black uppercase leading-4 tracking-[0.18em] text-[#5f7088]">
            {stat.title}
          </p>

          <h3 className={`mt-2 break-words text-4xl font-black ${stat.color}`}>
            {stat.value}
          </h3>

          <p className="mt-2 break-words text-xs font-semibold leading-5 text-[#52667f]">
            {stat.note}
          </p>
        </div>

        <div
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border-2 bg-white text-2xl shadow-sm"
          style={{ borderColor: `${visual.borderColor}55` }}
        >
          {stat.icon}
        </div>
      </div>
    </motion.div>
  );
}

function CompactMetric({ item, index }) {
  const tone =
    item.color.includes("red")
      ? "border-[#FB7185] bg-[#FFF4F4]"
      : item.color.includes("emerald") || item.color.includes("green")
      ? "border-[#34D399] bg-[#F0FFF8]"
      : item.color.includes("violet") || item.color.includes("pink")
      ? "border-[#9B6CFF] bg-[#F8F5FF]"
      : item.color.includes("blue") || item.color.includes("sky")
      ? "border-[#60A5FA] bg-[#F2F7FF]"
      : "border-[#F59E0B] bg-[#FFF7ED]";

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: index * 0.04 }}
      className={`min-w-0 rounded-[1.3rem] border-[3px] p-4 shadow-[0_7px_18px_rgba(18,56,101,0.06)] transition hover:-translate-y-0.5 hover:shadow-md ${tone}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="break-words text-[10px] font-black uppercase leading-4 tracking-[0.13em] text-[#65758b]">
            {item.title}
          </p>

          <p className={`mt-2 text-3xl font-black ${item.color}`}>
            {item.value}
          </p>
        </div>

        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border-2 border-[#D6E0EA] bg-white text-lg shadow-[0_3px_8px_rgba(15,35,63,0.06)]">
          {item.icon}
        </div>
      </div>

      <p className="mt-2 break-words text-xs font-semibold leading-5 text-[#566980]">
        {item.note}
      </p>
    </motion.div>
  );
}

function ExecutionLogRow({ log, index }) {
  const status = normalizeStatus(log.status || log.execution_status || log.approval_status);
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
      className="min-w-0 rounded-[1.3rem] border-[3px] border-[#C9D7E6] bg-[#FFF8EF] p-4 shadow-[0_6px_16px_rgba(18,56,101,0.04)] transition hover:border-[#FF5A0A] hover:bg-white"
    >
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-black text-[#10233F]">
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
            <span className="rounded-full border border-[#FF5A0A]/20 bg-[#FF5A0A]/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-orange-700">
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
    <div className="min-w-0 space-y-5 rounded-[1.35rem] border-[3px] border-[#123865] bg-[#FFF8EF] p-4 shadow-[0_8px_22px_rgba(18,56,101,0.05)]">
      <TrendGroup
        title="Invoice Trend"
        items={invoiceTrend}
        maxValue={maxInvoiceTrend}
        tone="bg-[#FF5A0A]"
      />

      <TrendGroup
        title="Payment Trend"
        items={paymentTrend}
        maxValue={maxPaymentTrend}
        tone="bg-[#315B88]"
      />
    </div>
  );
}

function TrendGroup({ title, items = [], maxValue = 1, tone = "bg-[#FF5A0A]" }) {
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
            <div key={`${title}-${item.key || item.label}`} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-600">{item.label}</span>
                <span className="text-slate-500">{formatMoney(item.value)}</span>
              </div>

              <div className="h-2.5 overflow-hidden rounded-full bg-[#e5edf5]">
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
  const active = Number(item.value || 0) > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: index * 0.04 }}
      className={`relative min-w-0 overflow-hidden rounded-[1.35rem] border-[3px] p-5 shadow-[0_7px_18px_rgba(18,56,101,0.06)] transition hover:-translate-y-0.5 hover:shadow-md ${
        active
          ? "border-[#F59E0B] bg-[#FFF7ED]"
          : "border-emerald-400 bg-[#F0FFF8]"
      }`}
    >
      <div
        className={`absolute inset-x-0 top-0 h-1 ${
          active ? "bg-[#FF5A0A]" : "bg-emerald-500"
        }`}
      />

      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.17em] text-[#64748b]">
            {item.title}
          </p>

          <p className={`mt-2 text-4xl font-black ${item.color}`}>
            {item.value}
          </p>
        </div>

        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white bg-white/80 text-2xl shadow-sm">
          {item.icon}
        </div>
      </div>

      <p className="mt-2 text-xs font-semibold text-[#586b82]">
        {item.note}
      </p>

      <p className="mt-4 rounded-full border border-[#c9d5e2] bg-white/70 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-[#52667f]">
        {item.type} alert
      </p>
    </motion.div>
  );
}

function EmptyState({ text }) {
  return (
    <div className="rounded-[1.3rem] border-[3px] border-dashed border-[#FF5A0A] bg-[#FFF8EF] p-6 text-sm font-semibold text-[#5a6c82]">
      {text}
    </div>
  );
}

export default StudentOSMissionControl;
