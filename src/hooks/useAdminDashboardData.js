import { useEffect, useMemo, useRef, useState } from "react";

import useRealtimeCRM from "./useRealtimeCRM";
import { supabase } from "../lib/supabaseClient";

import { fetchInquiryRows } from "../services/crm/inquiryService";
import { fetchAppointmentRows } from "../services/crm/appointmentService";
import { fetchFollowUpReminderRows } from "../services/crm/reminderService";

import {
  fetchAssignmentsForLeadTypeRows,
  getUniqueAssignments,
} from "../services/crm/assignmentService";

import { withTimeout } from "../utils/crm/requestUtils";

const toLower = (value) => String(value || "").toLowerCase().trim();

const number = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

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

const percent = (value, total) => {
  if (!total) return 0;
  return Math.round((Number(value || 0) / Number(total || 1)) * 100);
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

  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth()
  );
};

const getMonthLabel = (value) => {
  const date = new Date(value || Date.now());

  if (Number.isNaN(date.getTime())) return "Unknown";

  return date.toLocaleString("en-GB", {
    month: "short",
    year: "2-digit",
  });
};

const getStudentName = (item = {}) =>
  item.student_name ||
  item.full_name ||
  item.name ||
  item.student_email ||
  item.email ||
  "Unknown Student";

const buildMonthlyTrend = (items = [], valueResolver = getAmount, limit = 6) => {
  const buckets = new Map();

  items.forEach((item) => {
    const label = getMonthLabel(getRecordDate(item));
    const current = buckets.get(label) || 0;

    buckets.set(label, current + Number(valueResolver(item) || 0));
  });

  return [...buckets.entries()]
    .map(([label, value]) => ({ label, value }))
    .slice(-limit);
};

const buildRevenueMetrics = ({
  studentInvoices = [],
  studentPayments = [],
  studentReceipts = [],
  counselorPaymentRequests = [],
}) => {
  const invoiceValue = studentInvoices.reduce(
    (sum, invoice) => sum + getAmount(invoice),
    0
  );

  const paidValue = studentPayments.reduce(
    (sum, payment) => sum + getAmount(payment),
    0
  );

  const unpaidInvoices = studentInvoices.filter((invoice) => {
    const status = toLower(invoice.status || invoice.payment_status);
    return !status.includes("paid") && !status.includes("complete");
  });

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
  });

  const approvedReceipts = studentReceipts.filter((receipt) => {
    const status = toLower(
      receipt.status || receipt.receipt_status || receipt.approval_status
    );

    return status.includes("approved");
  });

  const rejectedReceipts = studentReceipts.filter((receipt) => {
    const status = toLower(
      receipt.status || receipt.receipt_status || receipt.approval_status
    );

    return status.includes("rejected");
  });

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

  const staleInvoices = unpaidInvoices.filter((invoice) => {
    const dateValue =
      invoice.due_date ||
      invoice.invoice_due_date ||
      invoice.created_at ||
      invoice.updated_at;

    return dateValue && isOverdue(dateValue);
  });

  const highValueOutstanding = unpaidInvoices
    .filter((invoice) => getAmount(invoice) >= 1000)
    .sort((a, b) => getAmount(b) - getAmount(a))
    .slice(0, 10);

  return {
    invoicesCount: studentInvoices.length,
    paymentsCount: studentPayments.length,
    receiptsCount: studentReceipts.length,

    invoiceValue,
    paidValue,
    outstandingValue,

    unpaidInvoicesCount: unpaidInvoices.length,
    staleInvoicesCount: staleInvoices.length,
    pendingReceiptsCount: pendingReceipts.length,
    approvedReceiptsCount: approvedReceipts.length,
    rejectedReceiptsCount: rejectedReceipts.length,
    counselorPaymentRequestsCount: counselorPaymentRequests.length,

    collectionRate: percent(paidValue, invoiceValue),
    paymentRecordRate: percent(studentPayments.length, studentInvoices.length),
    receiptApprovalRate: percent(approvedReceipts.length, studentReceipts.length),
    receiptRejectionRate: percent(rejectedReceipts.length, studentReceipts.length),

    currentMonthInvoiceValue,
    currentMonthPaidValue,
    recentInvoiceValue,
    recentPaymentValue,

    outstandingRevenueForecast:
      outstandingValue + pendingReceipts.length * 250,

    revenueRiskScore:
      unpaidInvoices.length +
      staleInvoices.length +
      pendingReceipts.length +
      counselorPaymentRequests.length,

    invoiceTrend: buildMonthlyTrend(studentInvoices),
    paymentTrend: buildMonthlyTrend(studentPayments),

    highValueOutstanding,
    staleInvoices,
    pendingReceipts,
  };
};

const buildPortalUsageMetrics = ({ studentPortalAccounts = [] }) => {
  const activeAccounts = studentPortalAccounts.filter((account) => {
    const active = account.is_active ?? account.active ?? account.status;

    if (typeof active === "boolean") return active;

    return !["inactive", "disabled", "blocked", "false"].includes(
      toLower(active)
    );
  });

  const inactiveAccounts = studentPortalAccounts.filter((account) => {
    const active = account.is_active ?? account.active ?? account.status;

    if (typeof active === "boolean") return !active;

    return ["inactive", "disabled", "blocked", "false"].includes(toLower(active));
  });

  const passwordResetRequired = studentPortalAccounts.filter(
    (account) => account.must_change_password || account.force_password_change
  );

  const loginTrackedAccounts = studentPortalAccounts.filter(
    (account) => account.last_login_at || account.last_login || account.last_seen_at
  );

  const recentlyActiveAccounts = studentPortalAccounts.filter((account) => {
    const lastLogin =
      account.last_login_at || account.last_login || account.last_seen_at;

    return isWithinDays(lastLogin, 7);
  });

  const activeIn30Days = studentPortalAccounts.filter((account) => {
    const lastLogin =
      account.last_login_at || account.last_login || account.last_seen_at;

    return isWithinDays(lastLogin, 30);
  });

  const staleAccounts = studentPortalAccounts.filter((account) => {
    const lastLogin =
      account.last_login_at || account.last_login || account.last_seen_at;

    return !lastLogin || !isWithinDays(lastLogin, 30);
  });

  const neverLoggedIn = studentPortalAccounts.filter((account) => {
    const lastLogin =
      account.last_login_at || account.last_login || account.last_seen_at;

    return !lastLogin;
  });

  return {
    totalAccounts: studentPortalAccounts.length,

    activeAccountsCount: activeAccounts.length,
    inactiveAccountsCount: inactiveAccounts.length,
    passwordResetRequiredCount: passwordResetRequired.length,
    loginTrackedAccountsCount: loginTrackedAccounts.length,
    recentlyActiveAccountsCount: recentlyActiveAccounts.length,
    activeIn30DaysCount: activeIn30Days.length,
    staleAccountsCount: staleAccounts.length,
    neverLoggedInCount: neverLoggedIn.length,

    activationRate: percent(activeAccounts.length, studentPortalAccounts.length),
    loginCoverageRate: percent(
      loginTrackedAccounts.length,
      studentPortalAccounts.length
    ),
    recentActivityRate: percent(
      recentlyActiveAccounts.length,
      studentPortalAccounts.length
    ),
    monthlyActivityRate: percent(activeIn30Days.length, studentPortalAccounts.length),

    portalRiskScore:
      passwordResetRequired.length +
      staleAccounts.length +
      inactiveAccounts.length +
      neverLoggedIn.length,

    passwordResetRequired,
    staleAccounts,
    inactiveAccounts,
    neverLoggedIn,
  };
};

const buildSupportMetrics = ({ supportRequests = [] }) => {
  const openRequests = supportRequests.filter((request) => {
    const status = toLower(request.status || request.request_status);

    return !status.includes("resolved") && !status.includes("closed");
  });

  const pendingResponses = supportRequests.filter((request) => {
    const status = toLower(request.status || request.request_status);

    return (
      status.includes("pending") ||
      status.includes("waiting") ||
      status.includes("open")
    );
  });

  const escalatedRequests = supportRequests.filter((request) => {
    const status = toLower(request.status || request.request_status);
    const priority = toLower(request.priority || request.severity);

    return (
      status.includes("escalated") ||
      priority.includes("urgent") ||
      priority.includes("high") ||
      priority.includes("critical")
    );
  });

  const resolvedRequests = supportRequests.filter((request) => {
    const status = toLower(request.status || request.request_status);

    return status.includes("resolved") || status.includes("closed");
  });

  const recentRequests = supportRequests.filter((request) =>
    isWithinDays(request.created_at || request.updated_at || request.submitted_at, 7)
  );

  return {
    totalRequests: supportRequests.length,
    openRequestsCount: openRequests.length,
    pendingResponsesCount: pendingResponses.length,
    escalatedRequestsCount: escalatedRequests.length,
    resolvedRequestsCount: resolvedRequests.length,
    recentRequestsCount: recentRequests.length,

    resolutionRate: percent(resolvedRequests.length, supportRequests.length),

    supportPressureScore:
      openRequests.length + pendingResponses.length + escalatedRequests.length * 2,

    openRequests,
    pendingResponses,
    escalatedRequests,
    recentRequests,
  };
};

const buildAutomationMetrics = ({
  executiveExecutionLogs = [],
  automationQueue = [],
  executiveActionQueue = [],
}) => {
  const allQueue = [...automationQueue, ...executiveActionQueue];

  const successfulExecutions = executiveExecutionLogs.filter((log) => {
    const status = toLower(log.status || log.execution_status || log.approval_status);

    return (
      status.includes("success") ||
      status.includes("executed") ||
      status.includes("completed") ||
      status.includes("approved")
    );
  });

  const failedExecutions = executiveExecutionLogs.filter((log) => {
    const status = toLower(log.status || log.execution_status || log.approval_status);
    const error = log.error_message || log.error || log.failure_reason;

    return status.includes("failed") || status.includes("error") || Boolean(error);
  });

  const pendingApprovals = executiveExecutionLogs.filter((log) => {
    const approval = toLower(log.approval_status || log.status);

    return (
      approval.includes("pending") ||
      approval.includes("queued") ||
      approval.includes("waiting")
    );
  });

  const duplicateBlockedExecutions = executiveExecutionLogs.filter(
    (log) => log.duplicate_detected || log.duplicate_blocked
  );

  const queuedActions = allQueue.filter((item) => {
    const status = toLower(item.status || item.approval_status);

    return (
      status.includes("pending") ||
      status.includes("queued") ||
      status.includes("waiting")
    );
  });

  const recentExecutions = [...executiveExecutionLogs]
    .sort((a, b) => {
      const aDate = new Date(
        a.executed_at || a.created_at || a.generated_at || 0
      ).getTime();

      const bDate = new Date(
        b.executed_at || b.created_at || b.generated_at || 0
      ).getTime();

      return bDate - aDate;
    })
    .slice(0, 12);

  return {
    executionLogsCount: executiveExecutionLogs.length,
    successfulExecutionsCount: successfulExecutions.length,
    failedExecutionsCount: failedExecutions.length,
    pendingApprovalsCount: pendingApprovals.length,
    duplicateBlockedExecutionsCount: duplicateBlockedExecutions.length,
    queuedActionsCount: queuedActions.length,

    successRate: percent(
      successfulExecutions.length,
      successfulExecutions.length + failedExecutions.length
    ),

    automationRiskScore:
      failedExecutions.length * 2 +
      pendingApprovals.length +
      duplicateBlockedExecutions.length +
      queuedActions.length,

    successfulExecutions,
    failedExecutions,
    pendingApprovals,
    duplicateBlockedExecutions,
    queuedActions,
    recentExecutions,
  };
};

const buildJourneyMetrics = ({
  studentApplications = [],
  studentDocuments = [],
  studentTasks = [],
  studentUniversities = [],
  studentRiskScores = [],
  followUpReminders = [],
}) => {
  const submittedApplications = studentApplications.filter((app) => {
    const status = toLower(app.application_status || app.status);

    return (
      status.includes("submit") ||
      status.includes("applied") ||
      status.includes("review")
    );
  });

  const offerReceived = studentApplications.filter((app) => {
    const offer = toLower(app.offer_status || app.status);

    return offer.includes("received") || offer.includes("offer");
  });

  const offerAccepted = studentApplications.filter((app) => {
    const offer = toLower(app.offer_status || app.status);

    return offer.includes("accepted") || offer.includes("firm");
  });

  const casIssued = studentApplications.filter((app) =>
    toLower(app.cas_status || app.cas).includes("issued")
  );

  const casDelays = studentApplications.filter((app) => {
    const offer = toLower(app.offer_status || app.status);
    const cas = toLower(app.cas_status || app.cas);

    return (offer.includes("accepted") || offer.includes("firm")) && !cas.includes("issued");
  });

  const visaSubmitted = studentApplications.filter((app) => {
    const visa = toLower(app.visa_status || app.visa);

    return (
      visa.includes("submitted") ||
      visa.includes("processing") ||
      visa.includes("pending")
    );
  });

  const visaApproved = studentApplications.filter((app) =>
    toLower(app.visa_status || app.visa).includes("approved")
  );

  const visaDelays = studentApplications.filter((app) => {
    const cas = toLower(app.cas_status || app.cas);
    const visa = toLower(app.visa_status || app.visa);

    return cas.includes("issued") && !visa.includes("approved");
  });

  const pendingDocuments = studentDocuments.filter(
    (doc) => !isDone(doc.status || doc.document_status || doc.verification_status)
  );

  const pendingTasks = studentTasks.filter(
    (task) => !isDone(task.status || task.task_status)
  );

  const overdueTasks = pendingTasks.filter((task) =>
    isOverdue(task.due_date || task.deadline || task.target_date)
  );

  const highRiskStudents = studentRiskScores.filter((risk) => {
    const level = toLower(risk.risk_level || risk.priority || risk.level);
    const score = Number(risk.risk_score || risk.score || risk.overall_score || 0);

    return level.includes("high") || level.includes("critical") || score >= 70;
  });

  const criticalRiskStudents = studentRiskScores.filter((risk) => {
    const level = toLower(risk.risk_level || risk.priority || risk.level);
    const score = Number(risk.risk_score || risk.score || risk.overall_score || 0);

    return level.includes("critical") || score >= 85;
  });

  const overdueReminders = followUpReminders.filter((reminder) => {
    const dueDate = reminder.due_date || reminder.reminder_date || reminder.date;
    return isOverdue(dueDate) && !isDone(reminder.status);
  });

  const dreamUniversities = studentUniversities.filter((uni) =>
    toLower(uni.preference_type || uni.category || uni.type).includes("dream")
  );

  const targetUniversities = studentUniversities.filter((uni) =>
    toLower(uni.preference_type || uni.category || uni.type).includes("target")
  );

  const safeUniversities = studentUniversities.filter((uni) =>
    toLower(uni.preference_type || uni.category || uni.type).includes("safe")
  );

  return {
    applicationsCount: studentApplications.length,
    submittedApplicationsCount: submittedApplications.length,
    offerReceivedCount: offerReceived.length,
    offerAcceptedCount: offerAccepted.length,
    casIssuedCount: casIssued.length,
    casDelaysCount: casDelays.length,
    visaSubmittedCount: visaSubmitted.length,
    visaApprovedCount: visaApproved.length,
    visaDelaysCount: visaDelays.length,

    documentsCount: studentDocuments.length,
    pendingDocumentsCount: pendingDocuments.length,
    documentReadinessRate: percent(
      studentDocuments.length - pendingDocuments.length,
      studentDocuments.length
    ),

    tasksCount: studentTasks.length,
    pendingTasksCount: pendingTasks.length,
    overdueTasksCount: overdueTasks.length,
    taskCompletionRate: percent(
      studentTasks.length - pendingTasks.length,
      studentTasks.length
    ),

    universityPlansCount: studentUniversities.length,
    dreamUniversitiesCount: dreamUniversities.length,
    targetUniversitiesCount: targetUniversities.length,
    safeUniversitiesCount: safeUniversities.length,

    highRiskStudentsCount: highRiskStudents.length,
    criticalRiskStudentsCount: criticalRiskStudents.length,
    overdueRemindersCount: overdueReminders.length,

    casDelays,
    visaDelays,
    highRiskStudents,
    criticalRiskStudents,
    pendingDocuments,
    overdueTasks,
  };
};

const buildNotificationMetrics = ({
  inquiries = [],
  appointments = [],
  followUpReminders = [],
  studentApplications = [],
  studentDocuments = [],
  studentTasks = [],
  studentRiskScores = [],
  studentInvoices = [],
  studentReceipts = [],
  studentPortalAccounts = [],
  supportRequests = [],
  counselorPaymentRequests = [],
  executiveExecutionLogs = [],
  automationQueue = [],
  executiveActionQueue = [],
}) => {
  const journey = buildJourneyMetrics({
    studentApplications,
    studentDocuments,
    studentTasks,
    studentRiskScores,
    followUpReminders,
  });

  const revenue = buildRevenueMetrics({
    studentInvoices,
    studentPayments: [],
    studentReceipts,
    counselorPaymentRequests,
  });

  const portal = buildPortalUsageMetrics({
    studentPortalAccounts,
  });

  const support = buildSupportMetrics({
    supportRequests,
  });

  const automation = buildAutomationMetrics({
    executiveExecutionLogs,
    automationQueue,
    executiveActionQueue,
  });

  const newInquiries = inquiries.filter((inquiry) => {
    const status = toLower(inquiry.status || inquiry.lead_status);
    return status.includes("new") || status.includes("pending");
  }).length;

  const pendingAppointments = appointments.filter((appointment) => {
    const status = toLower(appointment.status || appointment.appointment_status);
    return status.includes("pending") || status.includes("requested");
  }).length;

  const crmAlerts = newInquiries + pendingAppointments;

  const executiveAlerts =
    journey.highRiskStudentsCount + journey.criticalRiskStudentsCount;

  const paymentAlerts =
    revenue.unpaidInvoicesCount +
    revenue.pendingReceiptsCount +
    counselorPaymentRequests.length;

  const visaAlerts = journey.casDelaysCount + journey.visaDelaysCount;

  const portalAlerts =
    portal.passwordResetRequiredCount +
    portal.staleAccountsCount +
    portal.inactiveAccountsCount;

  const supportAlerts =
    support.openRequestsCount + support.escalatedRequestsCount;

  const automationAlerts =
    automation.failedExecutionsCount +
    automation.pendingApprovalsCount +
    automation.duplicateBlockedExecutionsCount +
    automation.queuedActionsCount;

  return {
    crmAlerts,
    executiveAlerts,
    paymentAlerts,
    visaAlerts,
    portalAlerts,
    supportAlerts,
    automationAlerts,

    totalAlerts:
      crmAlerts +
      executiveAlerts +
      paymentAlerts +
      visaAlerts +
      portalAlerts +
      supportAlerts +
      automationAlerts,

    details: {
      newInquiries,
      pendingAppointments,

      highRiskStudents: journey.highRiskStudentsCount,
      criticalRiskStudents: journey.criticalRiskStudentsCount,

      casDelays: journey.casDelaysCount,
      visaDelays: journey.visaDelaysCount,

      pendingDocuments: journey.pendingDocumentsCount,
      pendingTasks: journey.pendingTasksCount,
      overdueTasks: journey.overdueTasksCount,
      overdueReminders: journey.overdueRemindersCount,

      unpaidInvoices: revenue.unpaidInvoicesCount,
      staleInvoices: revenue.staleInvoicesCount,
      pendingReceipts: revenue.pendingReceiptsCount,
      counselorPaymentRequests: counselorPaymentRequests.length,

      portalPasswordResets: portal.passwordResetRequiredCount,
      stalePortalAccounts: portal.staleAccountsCount,
      inactivePortalAccounts: portal.inactiveAccountsCount,
      neverLoggedInPortalAccounts: portal.neverLoggedInCount,

      openSupportRequests: support.openRequestsCount,
      escalatedSupportRequests: support.escalatedRequestsCount,
      pendingSupportResponses: support.pendingResponsesCount,

      failedExecutions: automation.failedExecutionsCount,
      pendingAutomationApprovals: automation.pendingApprovalsCount,
      duplicateBlockedExecutions: automation.duplicateBlockedExecutionsCount,
      queuedAutomationActions: automation.queuedActionsCount,
    },
  };
};

const buildAlertCommandCenter = ({
  inquiries = [],
  appointments = [],
  followUpReminders = [],
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
  automationQueue = [],
  executiveActionQueue = [],
}) => {
  const revenue = buildRevenueMetrics({
    studentInvoices,
    studentPayments,
    studentReceipts,
    counselorPaymentRequests,
  });

  const portal = buildPortalUsageMetrics({
    studentPortalAccounts,
  });

  const support = buildSupportMetrics({
    supportRequests,
  });

  const automation = buildAutomationMetrics({
    executiveExecutionLogs,
    automationQueue,
    executiveActionQueue,
  });

  const journey = buildJourneyMetrics({
    studentApplications,
    studentDocuments,
    studentTasks,
    studentUniversities,
    studentRiskScores,
    followUpReminders,
  });

  const notification = buildNotificationMetrics({
    inquiries,
    appointments,
    followUpReminders,
    studentApplications,
    studentDocuments,
    studentTasks,
    studentRiskScores,
    studentInvoices,
    studentReceipts,
    studentPortalAccounts,
    supportRequests,
    counselorPaymentRequests,
    executiveExecutionLogs,
    automationQueue,
    executiveActionQueue,
  });

  const alertCards = [
    {
      key: "executive",
      title: "Executive Alerts",
      value: notification.executiveAlerts,
      tone: notification.executiveAlerts > 0 ? "red" : "green",
      note: `${journey.criticalRiskStudentsCount} critical / ${journey.highRiskStudentsCount} high risk`,
    },
    {
      key: "payment",
      title: "Payment Alerts",
      value: notification.paymentAlerts,
      tone: notification.paymentAlerts > 0 ? "orange" : "green",
      note: `${revenue.unpaidInvoicesCount} unpaid / ${revenue.pendingReceiptsCount} receipts`,
    },
    {
      key: "visa",
      title: "Visa Alerts",
      value: notification.visaAlerts,
      tone: notification.visaAlerts > 0 ? "orange" : "green",
      note: `${journey.casDelaysCount} CAS / ${journey.visaDelaysCount} visa delays`,
    },
    {
      key: "portal",
      title: "Portal Alerts",
      value: notification.portalAlerts,
      tone: notification.portalAlerts > 0 ? "orange" : "green",
      note: `${portal.staleAccountsCount} stale / ${portal.passwordResetRequiredCount} reset`,
    },
    {
      key: "support",
      title: "Support Alerts",
      value: notification.supportAlerts,
      tone: notification.supportAlerts > 0 ? "red" : "green",
      note: `${support.openRequestsCount} open / ${support.escalatedRequestsCount} escalated`,
    },
    {
      key: "automation",
      title: "Automation Alerts",
      value: notification.automationAlerts,
      tone: notification.automationAlerts > 0 ? "red" : "green",
      note: `${automation.failedExecutionsCount} failed / ${automation.pendingApprovalsCount} approvals`,
    },
  ];

  const resolutionQueue = [
    ...journey.criticalRiskStudents.slice(0, 8).map((item) => ({
      type: "Executive Risk",
      title: getStudentName(item),
      note: `Risk score ${item.risk_score || item.score || 0}`,
      priority: "critical",
    })),
    ...revenue.pendingReceipts.slice(0, 8).map((item) => ({
      type: "Receipt Approval",
      title: item.file_name || item.title || "Receipt pending",
      note: `${getStudentName(item)} • ${getAmount(item) || "review required"}`,
      priority: "warning",
    })),
    ...revenue.staleInvoices.slice(0, 8).map((item) => ({
      type: "Invoice Follow-up",
      title: item.invoice_number || item.title || "Unpaid invoice",
      note: `${getStudentName(item)} • ${getAmount(item)}`,
      priority: "warning",
    })),
    ...journey.visaDelays.slice(0, 8).map((item) => ({
      type: "Visa Delay",
      title: getStudentName(item),
      note: item.university_name || item.course_name || "CAS issued, visa pending",
      priority: "critical",
    })),
    ...support.escalatedRequests.slice(0, 8).map((item) => ({
      type: "Support Escalation",
      title: item.subject || item.category || "Escalated support request",
      note: `${getStudentName(item)} • ${item.priority || "urgent"}`,
      priority: "critical",
    })),
    ...automation.failedExecutions.slice(0, 8).map((item) => ({
      type: "Automation Recovery",
      title: item.action_type || item.template_key || "Failed automation",
      note: item.error_message || item.failure_reason || "Needs investigation",
      priority: "critical",
    })),
  ].slice(0, 20);

  return {
    totalAlerts: notification.totalAlerts,
    alertCards,
    resolutionQueue,
    health: {
      collectionRate: revenue.collectionRate,
      receiptApprovalRate: revenue.receiptApprovalRate,
      portalActivationRate: portal.activationRate,
      portalActivityRate: portal.recentActivityRate,
      supportResolutionRate: support.resolutionRate,
      automationSuccessRate: automation.successRate,
      documentReadinessRate: journey.documentReadinessRate,
      taskCompletionRate: journey.taskCompletionRate,
    },
  };
};

export default function useAdminDashboardData({ isLoggedIn, adminProfile }) {
  const [inquiries, setInquiries] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [followUpReminders, setFollowUpReminders] = useState([]);

  const [studentApplications, setStudentApplications] = useState([]);
  const [studentDocuments, setStudentDocuments] = useState([]);
  const [studentTasks, setStudentTasks] = useState([]);
  const [studentUniversities, setStudentUniversities] = useState([]);
  const [studentRiskScores, setStudentRiskScores] = useState([]);

  const [studentInvoices, setStudentInvoices] = useState([]);
  const [studentPayments, setStudentPayments] = useState([]);
  const [studentReceipts, setStudentReceipts] = useState([]);
  const [studentPortalAccounts, setStudentPortalAccounts] = useState([]);
  const [supportRequests, setSupportRequests] = useState([]);
  const [counselorPaymentRequests, setCounselorPaymentRequests] = useState([]);
  const [executiveExecutionLogs, setExecutiveExecutionLogs] = useState([]);

  const [automationQueue, setAutomationQueue] = useState([]);
  const [executiveActionQueue, setExecutiveActionQueue] = useState([]);

  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState("");

  const mountedRef = useRef(true);
  const loadingRef = useRef(false);
  const realtimeTimeoutRef = useRef(null);

  const safeSetState = (callback) => {
    if (mountedRef.current) callback();
  };

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
    };
  }, []);

  const safeFetchTable = async ({
    table,
    label,
    setter,
    orderBy = "created_at",
    ascending = false,
  }) => {
    try {
      let query = supabase.from(table).select("*");

      if (orderBy) {
        query = query.order(orderBy, { ascending });
      }

      const { data, error } = await withTimeout(query, `${label} fetch`);

      if (error) {
        console.error(`${label} fetch error:`, error);
        safeSetState(() => setter([]));
        return [];
      }

      const rows = data || [];
      safeSetState(() => setter(rows));
      return rows;
    } catch (error) {
      console.error(`${label} fetch timeout/error:`, error);
      safeSetState(() => setter([]));
      return [];
    }
  };

  const fetchAssignmentsForLeadType = async (leadType, ids = []) => {
    if (!ids.length) return [];

    try {
      const { data, error } = await withTimeout(
        fetchAssignmentsForLeadTypeRows(leadType, ids),
        `${leadType} assignments fetch`
      );

      if (error) {
        console.error("Assignment fetch error:", error);
        return [];
      }

      return getUniqueAssignments(data || []);
    } catch (error) {
      console.error("Assignment timeout/error:", error);
      return [];
    }
  };

  const fetchInquiries = async () => {
    const { data, error } = await withTimeout(
      fetchInquiryRows(),
      "Inquiries fetch"
    );

    if (error) throw new Error("Failed to load inquiries.");

    const inquiryRows = data || [];
    const inquiryIds = inquiryRows.map((item) => String(item.id));

    const assignments = await fetchAssignmentsForLeadType("inquiry", inquiryIds);

    const mergedInquiries = inquiryRows.map((inquiry) => {
      const assignment = assignments.find(
        (item) => String(item.lead_id) === String(inquiry.id)
      );

      return {
        ...inquiry,
        assigned_admin_id: assignment?.assigned_admin_id || null,
        assigned_admin_name: assignment?.assigned_admin_name || null,
      };
    });

    safeSetState(() => setInquiries(mergedInquiries));
    return mergedInquiries;
  };

  const fetchAppointments = async () => {
    const { data, error } = await withTimeout(
      fetchAppointmentRows(),
      "Appointments fetch"
    );

    if (error) throw new Error("Failed to load appointments.");

    const appointmentRows = data || [];
    const appointmentIds = appointmentRows.map((item) => String(item.id));

    const assignments = await fetchAssignmentsForLeadType(
      "appointment",
      appointmentIds
    );

    const mergedAppointments = appointmentRows.map((appointment) => {
      const assignment = assignments.find(
        (item) => String(item.lead_id) === String(appointment.id)
      );

      return {
        ...appointment,
        assigned_admin_id: assignment?.assigned_admin_id || null,
        assigned_admin_name: assignment?.assigned_admin_name || null,
      };
    });

    safeSetState(() => setAppointments(mergedAppointments));
    return mergedAppointments;
  };

  const fetchFollowUpReminders = async () => {
    try {
      const { data, error } = await withTimeout(
        fetchFollowUpReminderRows(),
        "Follow-up reminders fetch"
      );

      if (error) {
        console.error(error);
        return [];
      }

      const rows = data || [];
      safeSetState(() => setFollowUpReminders(rows));
      return rows;
    } catch (error) {
      console.error("Follow-up reminders fetch timeout/error:", error);
      safeSetState(() => setFollowUpReminders([]));
      return [];
    }
  };

  const fetchStudentApplications = async () =>
    safeFetchTable({
      table: "student_applications",
      label: "Student applications",
      setter: setStudentApplications,
      orderBy: "generated_at",
    });

  const fetchStudentDocuments = async () =>
    safeFetchTable({
      table: "student_documents",
      label: "Student documents",
      setter: setStudentDocuments,
      orderBy: "created_at",
    });

  const fetchStudentTasks = async () =>
    safeFetchTable({
      table: "student_tasks",
      label: "Student tasks",
      setter: setStudentTasks,
      orderBy: "created_at",
    });

  const fetchStudentUniversities = async () =>
    safeFetchTable({
      table: "student_universities",
      label: "Student universities",
      setter: setStudentUniversities,
      orderBy: "created_at",
    });

  const fetchStudentRiskScores = async () =>
    safeFetchTable({
      table: "ai_student_risk_scores",
      label: "Student risk scores",
      setter: setStudentRiskScores,
      orderBy: "generated_at",
    });

  const fetchStudentInvoices = async () =>
    safeFetchTable({
      table: "student_invoices",
      label: "Student invoices",
      setter: setStudentInvoices,
      orderBy: "created_at",
    });

  const fetchStudentPayments = async () =>
    safeFetchTable({
      table: "student_payments",
      label: "Student payments",
      setter: setStudentPayments,
      orderBy: "created_at",
    });

  const fetchStudentReceipts = async () =>
    safeFetchTable({
      table: "student_receipts",
      label: "Student receipts",
      setter: setStudentReceipts,
      orderBy: "created_at",
    });

  const fetchStudentPortalAccounts = async () =>
    safeFetchTable({
      table: "student_portal_accounts",
      label: "Student portal accounts",
      setter: setStudentPortalAccounts,
      orderBy: "created_at",
    });

  const fetchSupportRequests = async () =>
    safeFetchTable({
      table: "student_support_requests",
      label: "Student support requests",
      setter: setSupportRequests,
      orderBy: "created_at",
    });

  const fetchCounselorPaymentRequests = async () =>
    safeFetchTable({
      table: "counselor_payment_requests",
      label: "Counselor payment requests",
      setter: setCounselorPaymentRequests,
      orderBy: "created_at",
    });

  const fetchExecutiveExecutionLogs = async () =>
    safeFetchTable({
      table: "executive_execution_logs",
      label: "Executive execution logs",
      setter: setExecutiveExecutionLogs,
      orderBy: "executed_at",
    });

  const fetchAutomationQueue = async () =>
    safeFetchTable({
      table: "executive_action_queue",
      label: "Executive action queue",
      setter: setExecutiveActionQueue,
      orderBy: "created_at",
    });

  const fetchLegacyAutomationQueue = async () =>
    safeFetchTable({
      table: "automation_queue",
      label: "Automation queue",
      setter: setAutomationQueue,
      orderBy: "created_at",
    });

  const fetchAllData = async ({ silent = false } = {}) => {
    if (loadingRef.current && !silent) return;

    loadingRef.current = true;

    safeSetState(() => {
      setLoadError("");
      if (!silent) setLoading(true);
    });

    try {
      const results = await Promise.allSettled([
        fetchInquiries(),
        fetchAppointments(),
        fetchFollowUpReminders(),

        fetchStudentApplications(),
        fetchStudentDocuments(),
        fetchStudentTasks(),
        fetchStudentUniversities(),
        fetchStudentRiskScores(),

        fetchStudentInvoices(),
        fetchStudentPayments(),
        fetchStudentReceipts(),
        fetchStudentPortalAccounts(),
        fetchSupportRequests(),
        fetchCounselorPaymentRequests(),
        fetchExecutiveExecutionLogs(),

        fetchAutomationQueue(),
        fetchLegacyAutomationQueue(),
      ]);

      const failed = results.filter((result) => result.status === "rejected");

      if (failed.length > 0) {
        console.error("Admin fetch failures:", failed);

        safeSetState(() => {
          setLoadError(
            "Some admin data could not load. Check your internet and refresh."
          );
        });
      } else {
        safeSetState(() => setLoadError(""));
      }
    } catch (error) {
      console.error("Fetch all data crash:", error);

      safeSetState(() => {
        setLoadError("Admin refresh timed out. Check your internet and retry.");
      });
    } finally {
      loadingRef.current = false;
      safeSetState(() => setLoading(false));
    }
  };

  const queueRealtimeRefresh = () => {
    clearTimeout(realtimeTimeoutRef.current);

    realtimeTimeoutRef.current = setTimeout(() => {
      fetchAllData({ silent: true });
    }, 800);
  };

  useRealtimeCRM({
    enabled: isLoggedIn && !!adminProfile,

    onInquiryChange: queueRealtimeRefresh,
    onAppointmentChange: queueRealtimeRefresh,
    onReminderChange: queueRealtimeRefresh,
    onAnyChange: queueRealtimeRefresh,
  });

  useEffect(() => {
    if (isLoggedIn && adminProfile) {
      fetchAllData();
    }
  }, [isLoggedIn, adminProfile?.id]);

  useEffect(() => {
    return () => {
      clearTimeout(realtimeTimeoutRef.current);
    };
  }, []);

  const clearLocalData = () => {
    safeSetState(() => {
      setInquiries([]);
      setAppointments([]);
      setFollowUpReminders([]);

      setStudentApplications([]);
      setStudentDocuments([]);
      setStudentTasks([]);
      setStudentUniversities([]);
      setStudentRiskScores([]);

      setStudentInvoices([]);
      setStudentPayments([]);
      setStudentReceipts([]);
      setStudentPortalAccounts([]);
      setSupportRequests([]);
      setCounselorPaymentRequests([]);
      setExecutiveExecutionLogs([]);

      setAutomationQueue([]);
      setExecutiveActionQueue([]);

      setLoading(false);
      setLoadError("");
    });
  };

  const revenueMetrics = useMemo(
    () =>
      buildRevenueMetrics({
        studentInvoices,
        studentPayments,
        studentReceipts,
        counselorPaymentRequests,
      }),
    [
      studentInvoices,
      studentPayments,
      studentReceipts,
      counselorPaymentRequests,
    ]
  );

  const portalUsageMetrics = useMemo(
    () =>
      buildPortalUsageMetrics({
        studentPortalAccounts,
      }),
    [studentPortalAccounts]
  );

  const supportMetrics = useMemo(
    () =>
      buildSupportMetrics({
        supportRequests,
      }),
    [supportRequests]
  );

  const automationMetrics = useMemo(
    () =>
      buildAutomationMetrics({
        executiveExecutionLogs,
        automationQueue,
        executiveActionQueue,
      }),
    [executiveExecutionLogs, automationQueue, executiveActionQueue]
  );

  const journeyMetrics = useMemo(
    () =>
      buildJourneyMetrics({
        studentApplications,
        studentDocuments,
        studentTasks,
        studentUniversities,
        studentRiskScores,
        followUpReminders,
      }),
    [
      studentApplications,
      studentDocuments,
      studentTasks,
      studentUniversities,
      studentRiskScores,
      followUpReminders,
    ]
  );

  const notificationMetrics = useMemo(
    () =>
      buildNotificationMetrics({
        inquiries,
        appointments,
        followUpReminders,
        studentApplications,
        studentDocuments,
        studentTasks,
        studentRiskScores,
        studentInvoices,
        studentReceipts,
        studentPortalAccounts,
        supportRequests,
        counselorPaymentRequests,
        executiveExecutionLogs,
        automationQueue,
        executiveActionQueue,
      }),
    [
      inquiries,
      appointments,
      followUpReminders,
      studentApplications,
      studentDocuments,
      studentTasks,
      studentRiskScores,
      studentInvoices,
      studentReceipts,
      studentPortalAccounts,
      supportRequests,
      counselorPaymentRequests,
      executiveExecutionLogs,
      automationQueue,
      executiveActionQueue,
    ]
  );

  const alertCommandCenter = useMemo(
    () =>
      buildAlertCommandCenter({
        inquiries,
        appointments,
        followUpReminders,
        studentApplications,
        studentDocuments,
        studentTasks,
        studentUniversities,
        studentRiskScores,
        studentInvoices,
        studentPayments,
        studentReceipts,
        studentPortalAccounts,
        supportRequests,
        counselorPaymentRequests,
        executiveExecutionLogs,
        automationQueue,
        executiveActionQueue,
      }),
    [
      inquiries,
      appointments,
      followUpReminders,
      studentApplications,
      studentDocuments,
      studentTasks,
      studentUniversities,
      studentRiskScores,
      studentInvoices,
      studentPayments,
      studentReceipts,
      studentPortalAccounts,
      supportRequests,
      counselorPaymentRequests,
      executiveExecutionLogs,
      automationQueue,
      executiveActionQueue,
    ]
  );

  return {
    inquiries,
    setInquiries,

    appointments,
    setAppointments,

    followUpReminders,
    setFollowUpReminders,

    studentApplications,
    studentDocuments,
    studentTasks,
    studentUniversities,
    studentRiskScores,

    studentInvoices,
    studentPayments,
    studentReceipts,
    studentPortalAccounts,
    supportRequests,
    counselorPaymentRequests,
    executiveExecutionLogs,

    automationQueue,
    executiveActionQueue,

    revenueMetrics,
    portalUsageMetrics,
    supportMetrics,
    automationMetrics,
    journeyMetrics,
    notificationMetrics,
    alertCommandCenter,

    loading,
    loadError,

    fetchAllData,
    clearLocalData,
  };
}