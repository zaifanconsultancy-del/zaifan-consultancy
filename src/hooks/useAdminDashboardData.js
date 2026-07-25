import { useCallback, useEffect, useMemo, useRef, useState } from "react";

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

const REALTIME_REFRESH_DELAY_MS = 800;

const toLower = (value) => String(value ?? "").toLowerCase().trim();

const getErrorCode = (error) => String(error?.code || "").trim();

const isMissingTableError = (error) => {
  const code = getErrorCode(error);
  const message = toLower(error?.message);

  return (
    code === "PGRST205" ||
    message.includes("could not find the table") ||
    message.includes("schema cache")
  );
};

const isMissingColumnError = (error) => {
  const code = getErrorCode(error);
  const message = toLower(error?.message);

  return (
    code === "42703" ||
    (message.includes("column") && message.includes("does not exist"))
  );
};

const formatFetchError = (label, error) => {
  const code = getErrorCode(error);
  const message = error?.message || "Unknown Supabase error.";

  return code ? `${label}: ${code} — ${message}` : `${label}: ${message}`;
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

const isOverdue = (dateValue, nowMs = Date.now()) => {
  if (!dateValue) return false;
  const dateMs = new Date(dateValue).getTime();
  return Number.isFinite(dateMs) && dateMs < nowMs;
};

const percent = (value, total) => {
  const safeTotal = Number(total || 0);
  if (!safeTotal) return 0;
  return Math.round((Number(value || 0) / safeTotal) * 100);
};

const getAmount = (item = {}) =>
  Number(
    item.amount ??
      item.total_amount ??
      item.invoice_amount ??
      item.paid_amount ??
      item.payment_amount ??
      item.receipt_amount ??
      item.value ??
      0
  ) || 0;

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

const isWithinDays = (value, days = 30, nowMs = Date.now()) => {
  if (!value) return false;

  const dateMs = new Date(value).getTime();
  if (!Number.isFinite(dateMs)) return false;

  return dateMs >= nowMs - days * 86_400_000;
};

const isThisMonth = (value, now = new Date()) => {
  if (!value) return false;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return false;

  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth()
  );
};

const getMonthKey = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
};

const formatMonthKey = (key) => {
  if (!key) return "Unknown";

  const [year, month] = key.split("-").map(Number);
  const date = new Date(year, month - 1, 1);

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

  for (const item of items) {
    const key = getMonthKey(getRecordDate(item));
    if (!key) continue;

    buckets.set(key, (buckets.get(key) || 0) + Number(valueResolver(item) || 0));
  }

  return [...buckets.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-limit)
    .map(([key, value]) => ({
      label: formatMonthKey(key),
      value,
    }));
};

const buildRevenueMetrics = ({
  studentInvoices = [],
  studentPayments = [],
  studentReceipts = [],
  counselorPaymentRequests = [],
}) => {
  const nowMs = Date.now();
  const now = new Date(nowMs);

  let invoiceValue = 0;
  let paidValue = 0;
  let outstandingValue = 0;
  let currentMonthInvoiceValue = 0;
  let currentMonthPaidValue = 0;
  let recentInvoiceValue = 0;
  let recentPaymentValue = 0;

  const unpaidInvoices = [];
  const staleInvoices = [];
  const pendingReceipts = [];
  const approvedReceipts = [];
  const rejectedReceipts = [];

  for (const invoice of studentInvoices) {
    const amount = getAmount(invoice);
    const status = toLower(invoice.status || invoice.payment_status);
    const date = getRecordDate(invoice);

    invoiceValue += amount;

    if (isThisMonth(date, now)) currentMonthInvoiceValue += amount;
    if (isWithinDays(date, 30, nowMs)) recentInvoiceValue += amount;

    if (!status.includes("paid") && !status.includes("complete")) {
      unpaidInvoices.push(invoice);

      const explicitOutstanding = Number(
        invoice.outstanding_amount ?? invoice.balance ?? 0
      );

      outstandingValue += explicitOutstanding || amount;

      const dueDate =
        invoice.due_date ||
        invoice.invoice_due_date ||
        invoice.created_at ||
        invoice.updated_at;

      if (isOverdue(dueDate, nowMs)) {
        staleInvoices.push(invoice);
      }
    }
  }

  for (const payment of studentPayments) {
    const amount = getAmount(payment);
    const date = getRecordDate(payment);

    paidValue += amount;
    if (isThisMonth(date, now)) currentMonthPaidValue += amount;
    if (isWithinDays(date, 30, nowMs)) recentPaymentValue += amount;
  }

  for (const receipt of studentReceipts) {
    const status = toLower(
      receipt.status || receipt.receipt_status || receipt.approval_status
    );

    if (status.includes("approved")) {
      approvedReceipts.push(receipt);
    } else if (status.includes("rejected")) {
      rejectedReceipts.push(receipt);
    } else {
      pendingReceipts.push(receipt);
    }
  }

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
  const nowMs = Date.now();

  const passwordResetRequired = [];
  const staleAccounts = [];
  const inactiveAccounts = [];
  const neverLoggedIn = [];

  let activeAccountsCount = 0;
  let loginTrackedAccountsCount = 0;
  let recentlyActiveAccountsCount = 0;
  let activeIn30DaysCount = 0;

  for (const account of studentPortalAccounts) {
    const active = account.is_active ?? account.active ?? account.status;
    const normalizedActive = toLower(active);
    const isActive =
      typeof active === "boolean"
        ? active
        : !["inactive", "disabled", "blocked", "false"].includes(
            normalizedActive
          );

    if (isActive) {
      activeAccountsCount += 1;
    } else {
      inactiveAccounts.push(account);
    }

    if (account.must_change_password || account.force_password_change) {
      passwordResetRequired.push(account);
    }

    const lastLogin =
      account.last_login_at || account.last_login || account.last_seen_at;

    if (lastLogin) {
      loginTrackedAccountsCount += 1;

      if (isWithinDays(lastLogin, 7, nowMs)) {
        recentlyActiveAccountsCount += 1;
      }

      if (isWithinDays(lastLogin, 30, nowMs)) {
        activeIn30DaysCount += 1;
      } else {
        staleAccounts.push(account);
      }
    } else {
      neverLoggedIn.push(account);
      staleAccounts.push(account);
    }
  }

  return {
    totalAccounts: studentPortalAccounts.length,

    activeAccountsCount,
    inactiveAccountsCount: inactiveAccounts.length,
    passwordResetRequiredCount: passwordResetRequired.length,
    loginTrackedAccountsCount,
    recentlyActiveAccountsCount,
    activeIn30DaysCount,
    staleAccountsCount: staleAccounts.length,
    neverLoggedInCount: neverLoggedIn.length,

    activationRate: percent(activeAccountsCount, studentPortalAccounts.length),
    loginCoverageRate: percent(
      loginTrackedAccountsCount,
      studentPortalAccounts.length
    ),
    recentActivityRate: percent(
      recentlyActiveAccountsCount,
      studentPortalAccounts.length
    ),
    monthlyActivityRate: percent(
      activeIn30DaysCount,
      studentPortalAccounts.length
    ),

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
  const nowMs = Date.now();

  const openRequests = [];
  const pendingResponses = [];
  const escalatedRequests = [];
  const recentRequests = [];

  let resolvedRequestsCount = 0;

  for (const request of supportRequests) {
    const status = toLower(request.status || request.request_status);
    const priority = toLower(request.priority || request.severity);
    const resolved =
      status.includes("resolved") || status.includes("closed");

    if (resolved) {
      resolvedRequestsCount += 1;
    } else {
      openRequests.push(request);
    }

    if (
      status.includes("pending") ||
      status.includes("waiting") ||
      status.includes("open")
    ) {
      pendingResponses.push(request);
    }

    if (
      status.includes("escalated") ||
      priority.includes("urgent") ||
      priority.includes("high") ||
      priority.includes("critical")
    ) {
      escalatedRequests.push(request);
    }

    if (
      isWithinDays(
        request.created_at || request.updated_at || request.submitted_at,
        7,
        nowMs
      )
    ) {
      recentRequests.push(request);
    }
  }

  return {
    totalRequests: supportRequests.length,
    openRequestsCount: openRequests.length,
    pendingResponsesCount: pendingResponses.length,
    escalatedRequestsCount: escalatedRequests.length,
    resolvedRequestsCount,
    recentRequestsCount: recentRequests.length,

    resolutionRate: percent(resolvedRequestsCount, supportRequests.length),

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
  const successfulExecutions = [];
  const failedExecutions = [];
  const pendingApprovals = [];
  const duplicateBlockedExecutions = [];
  const queuedActions = [];

  for (const log of executiveExecutionLogs) {
    const status = toLower(
      log.status || log.execution_status || log.approval_status
    );
    const error = log.error_message || log.error || log.failure_reason;

    if (
      status.includes("success") ||
      status.includes("executed") ||
      status.includes("completed") ||
      status.includes("approved")
    ) {
      successfulExecutions.push(log);
    }

    if (status.includes("failed") || status.includes("error") || Boolean(error)) {
      failedExecutions.push(log);
    }

    if (
      status.includes("pending") ||
      status.includes("queued") ||
      status.includes("waiting")
    ) {
      pendingApprovals.push(log);
    }

    if (log.duplicate_detected || log.duplicate_blocked) {
      duplicateBlockedExecutions.push(log);
    }
  }

  for (const item of [...automationQueue, ...executiveActionQueue]) {
    const status = toLower(item.status || item.approval_status);

    if (
      status.includes("pending") ||
      status.includes("queued") ||
      status.includes("waiting")
    ) {
      queuedActions.push(item);
    }
  }

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
  const nowMs = Date.now();

  let submittedApplicationsCount = 0;
  let offerReceivedCount = 0;
  let offerAcceptedCount = 0;
  let casIssuedCount = 0;
  let visaSubmittedCount = 0;
  let visaApprovedCount = 0;
  let dreamUniversitiesCount = 0;
  let targetUniversitiesCount = 0;
  let safeUniversitiesCount = 0;

  const casDelays = [];
  const visaDelays = [];
  const pendingDocuments = [];
  const pendingTasks = [];
  const overdueTasks = [];
  const highRiskStudents = [];
  const criticalRiskStudents = [];
  const overdueReminders = [];

  for (const app of studentApplications) {
    const status = toLower(app.application_status || app.status);
    const offer = toLower(app.offer_status || app.status);
    const cas = toLower(app.cas_status || app.cas);
    const visa = toLower(app.visa_status || app.visa);

    if (
      status.includes("submit") ||
      status.includes("applied") ||
      status.includes("review")
    ) {
      submittedApplicationsCount += 1;
    }

    if (offer.includes("received") || offer.includes("offer")) {
      offerReceivedCount += 1;
    }

    if (offer.includes("accepted") || offer.includes("firm")) {
      offerAcceptedCount += 1;

      if (!cas.includes("issued")) {
        casDelays.push(app);
      }
    }

    if (cas.includes("issued")) {
      casIssuedCount += 1;

      if (!visa.includes("approved")) {
        visaDelays.push(app);
      }
    }

    if (
      visa.includes("submitted") ||
      visa.includes("processing") ||
      visa.includes("pending")
    ) {
      visaSubmittedCount += 1;
    }

    if (visa.includes("approved")) {
      visaApprovedCount += 1;
    }
  }

  for (const doc of studentDocuments) {
    if (!isDone(doc.status || doc.document_status || doc.verification_status)) {
      pendingDocuments.push(doc);
    }
  }

  for (const task of studentTasks) {
    if (!isDone(task.status || task.task_status)) {
      pendingTasks.push(task);

      if (
        isOverdue(task.due_date || task.deadline || task.target_date, nowMs)
      ) {
        overdueTasks.push(task);
      }
    }
  }

  for (const risk of studentRiskScores) {
    const level = toLower(risk.risk_level || risk.priority || risk.level);
    const score = Number(
      risk.risk_score ?? risk.score ?? risk.overall_score ?? 0
    );

    if (level.includes("critical") || score >= 85) {
      criticalRiskStudents.push(risk);
      highRiskStudents.push(risk);
    } else if (level.includes("high") || score >= 70) {
      highRiskStudents.push(risk);
    }
  }

  for (const reminder of followUpReminders) {
    const dueDate = reminder.due_date || reminder.reminder_date || reminder.date;

    if (isOverdue(dueDate, nowMs) && !isDone(reminder.status)) {
      overdueReminders.push(reminder);
    }
  }

  for (const uni of studentUniversities) {
    const preference = toLower(
      uni.preference_type || uni.category || uni.type
    );

    if (preference.includes("dream")) {
      dreamUniversitiesCount += 1;
    } else if (preference.includes("target")) {
      targetUniversitiesCount += 1;
    } else if (preference.includes("safe")) {
      safeUniversitiesCount += 1;
    }
  }

  return {
    applicationsCount: studentApplications.length,
    submittedApplicationsCount,
    offerReceivedCount,
    offerAcceptedCount,
    casIssuedCount,
    casDelaysCount: casDelays.length,
    visaSubmittedCount,
    visaApprovedCount,
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
    dreamUniversitiesCount,
    targetUniversitiesCount,
    safeUniversitiesCount,

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

  const portal = buildPortalUsageMetrics({ studentPortalAccounts });
  const support = buildSupportMetrics({ supportRequests });
  const automation = buildAutomationMetrics({
    executiveExecutionLogs,
    automationQueue,
    executiveActionQueue,
  });

  let newInquiries = 0;
  let pendingAppointments = 0;

  for (const inquiry of inquiries) {
    const status = toLower(inquiry.status || inquiry.lead_status);
    if (status.includes("new") || status.includes("pending")) {
      newInquiries += 1;
    }
  }

  for (const appointment of appointments) {
    const status = toLower(
      appointment.status || appointment.appointment_status
    );
    if (status.includes("pending") || status.includes("requested")) {
      pendingAppointments += 1;
    }
  }

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

  const portal = buildPortalUsageMetrics({ studentPortalAccounts });
  const support = buildSupportMetrics({ supportRequests });
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

  const mountedRef = useRef(false);
  const fetchGenerationRef = useRef(0);
  const inFlightFetchRef = useRef(null);
  const queuedRefreshRef = useRef(false);
  const realtimeTimeoutRef = useRef(null);

  const safeSetState = useCallback((callback) => {
    if (mountedRef.current) callback();
  }, []);

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
      fetchGenerationRef.current += 1;

      if (realtimeTimeoutRef.current !== null) {
        window.clearTimeout(realtimeTimeoutRef.current);
        realtimeTimeoutRef.current = null;
      }
    };
  }, []);

  const safeFetchTable = useCallback(
    async ({
      table,
      label,
      setter,
      orderBy = "created_at",
      ascending = false,
      optional = false,
      generation,
    }) => {
      const commitRows = (rows = []) => {
        const safeRows = Array.isArray(rows) ? rows : [];

        if (
          mountedRef.current &&
          generation === fetchGenerationRef.current
        ) {
          setter(safeRows);
        }

        return safeRows;
      };

      const runQuery = async (column = orderBy) => {
        let query = supabase.from(table).select("*");

        if (column) {
          query = query.order(column, { ascending });
        }

        return withTimeout(query, `${label} fetch`);
      };

      try {
        let response = await runQuery(orderBy);

        if (response?.error && orderBy && isMissingColumnError(response.error)) {
          console.warn(
            `${label}: column "${orderBy}" is unavailable; retrying without ordering.`,
            response.error
          );

          response = await runQuery(null);
        }

        if (response?.error) {
          if (optional && isMissingTableError(response.error)) {
            console.warn(
              `${label}: optional table "${table}" is not present in this Supabase schema. Feature disabled safely.`
            );
            return commitRows([]);
          }

          console.error(formatFetchError(label, response.error), response.error);
          commitRows([]);
          throw response.error;
        }

        return commitRows(response?.data || []);
      } catch (error) {
        if (optional && isMissingTableError(error)) {
          console.warn(
            `${label}: optional table "${table}" is not present in this Supabase schema. Feature disabled safely.`
          );
          return commitRows([]);
        }

        if (!error?.message || !String(error.message).includes(label)) {
          console.error(`${label} fetch timeout/error:`, error);
        }

        commitRows([]);
        throw error;
      }
    },
    []
  );

  const fetchAssignmentsForLeadType = useCallback(async (leadType, ids = []) => {
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
  }, []);

  const fetchInquiries = useCallback(
    async (generation) => {
      const { data, error } = await withTimeout(
        fetchInquiryRows(),
        "Inquiries fetch"
      );

      if (error) throw new Error("Failed to load inquiries.");

      const inquiryRows = Array.isArray(data) ? data : [];
      const inquiryIds = inquiryRows.map((item) => String(item.id));
      const assignments = await fetchAssignmentsForLeadType(
        "inquiry",
        inquiryIds
      );

      const assignmentByLeadId = new Map(
        assignments.map((item) => [String(item.lead_id), item])
      );

      const mergedInquiries = inquiryRows.map((inquiry) => {
        const assignment = assignmentByLeadId.get(String(inquiry.id));

        return {
          ...inquiry,
          assigned_admin_id: assignment?.assigned_admin_id || null,
          assigned_admin_name: assignment?.assigned_admin_name || null,
        };
      });

      if (
        mountedRef.current &&
        generation === fetchGenerationRef.current
      ) {
        setInquiries(mergedInquiries);
      }

      return mergedInquiries;
    },
    [fetchAssignmentsForLeadType]
  );

  const fetchAppointments = useCallback(
    async (generation) => {
      const { data, error } = await withTimeout(
        fetchAppointmentRows(),
        "Appointments fetch"
      );

      if (error) throw new Error("Failed to load appointments.");

      const appointmentRows = Array.isArray(data) ? data : [];
      const appointmentIds = appointmentRows.map((item) => String(item.id));
      const assignments = await fetchAssignmentsForLeadType(
        "appointment",
        appointmentIds
      );

      const assignmentByLeadId = new Map(
        assignments.map((item) => [String(item.lead_id), item])
      );

      const mergedAppointments = appointmentRows.map((appointment) => {
        const assignment = assignmentByLeadId.get(String(appointment.id));

        return {
          ...appointment,
          assigned_admin_id: assignment?.assigned_admin_id || null,
          assigned_admin_name: assignment?.assigned_admin_name || null,
        };
      });

      if (
        mountedRef.current &&
        generation === fetchGenerationRef.current
      ) {
        setAppointments(mergedAppointments);
      }

      return mergedAppointments;
    },
    [fetchAssignmentsForLeadType]
  );

  const fetchFollowUpReminders = useCallback(async (generation) => {
    try {
      const { data, error } = await withTimeout(
        fetchFollowUpReminderRows(),
        "Follow-up reminders fetch"
      );

      if (error) {
        console.error(error);
        return [];
      }

      const rows = Array.isArray(data) ? data : [];

      if (
        mountedRef.current &&
        generation === fetchGenerationRef.current
      ) {
        setFollowUpReminders(rows);
      }

      return rows;
    } catch (error) {
      console.error("Follow-up reminders fetch timeout/error:", error);

      if (
        mountedRef.current &&
        generation === fetchGenerationRef.current
      ) {
        setFollowUpReminders([]);
      }

      return [];
    }
  }, []);

  const fetchAllData = useCallback(
    async ({ silent = false } = {}) => {
      if (inFlightFetchRef.current) {
        queuedRefreshRef.current = true;
        return inFlightFetchRef.current;
      }

      const generation = fetchGenerationRef.current + 1;
      fetchGenerationRef.current = generation;

      safeSetState(() => {
        setLoadError("");
        if (!silent) setLoading(true);
      });

      const runFetch = async () => {
        try {
          const results = await Promise.allSettled([
            fetchInquiries(generation),
            fetchAppointments(generation),
            fetchFollowUpReminders(generation),

            safeFetchTable({
              table: "student_applications",
              label: "Student applications",
              setter: setStudentApplications,
              orderBy: "created_at",
              generation,
            }),
            safeFetchTable({
              table: "student_documents",
              label: "Student documents",
              setter: setStudentDocuments,
              orderBy: "created_at",
              generation,
            }),
            safeFetchTable({
              table: "student_tasks",
              label: "Student tasks",
              setter: setStudentTasks,
              orderBy: "created_at",
              generation,
            }),
            safeFetchTable({
              table: "student_universities",
              label: "Student universities",
              setter: setStudentUniversities,
              orderBy: "created_at",
              generation,
            }),
            safeFetchTable({
              table: "ai_student_risk_scores",
              label: "Student risk scores",
              setter: setStudentRiskScores,
              orderBy: "generated_at",
              generation,
            }),
            safeFetchTable({
              table: "student_invoices",
              label: "Student invoices",
              setter: setStudentInvoices,
              orderBy: "created_at",
              generation,
            }),
            safeFetchTable({
              table: "student_payments",
              label: "Student payments",
              setter: setStudentPayments,
              orderBy: "created_at",
              generation,
            }),
            safeFetchTable({
              table: "student_receipts",
              label: "Student receipts",
              setter: setStudentReceipts,
              orderBy: "created_at",
              generation,
            }),
            safeFetchTable({
              table: "student_portal_accounts",
              label: "Student portal accounts",
              setter: setStudentPortalAccounts,
              orderBy: "created_at",
              generation,
            }),
            safeFetchTable({
              table: "student_support_requests",
              label: "Student support requests",
              setter: setSupportRequests,
              orderBy: "created_at",
              generation,
            }),
            safeFetchTable({
              table: "counselor_payment_requests",
              label: "Counselor payment requests",
              setter: setCounselorPaymentRequests,
              orderBy: "created_at",
              generation,
            }),
            safeFetchTable({
              table: "executive_execution_logs",
              label: "Executive execution logs",
              setter: setExecutiveExecutionLogs,
              orderBy: "executed_at",
              generation,
            }),
            Promise.resolve().then(() => {
              if (
                mountedRef.current &&
                generation === fetchGenerationRef.current
              ) {
                setExecutiveActionQueue([]);
                setAutomationQueue([]);
              }
              return [];
            }),
          ]);

          const failed = results.filter(
            (result) => result.status === "rejected"
          );

          if (
            !mountedRef.current ||
            generation !== fetchGenerationRef.current
          ) {
            return;
          }

          if (failed.length > 0) {
            console.error("Admin fetch failures:", failed);

            setLoadError(
              "Some core admin data could not load. The Admin OS is still running with the data that succeeded."
            );
          } else {
            setLoadError("");
          }
        } catch (error) {
          console.error("Fetch all data crash:", error);

          if (
            mountedRef.current &&
            generation === fetchGenerationRef.current
          ) {
            setLoadError(
              "Admin refresh timed out. Check your internet and retry."
            );
          }
        } finally {
          if (
            mountedRef.current &&
            generation === fetchGenerationRef.current
          ) {
            setLoading(false);
          }
        }
      };

      const promise = runFetch();
      inFlightFetchRef.current = promise;

      try {
        await promise;
      } finally {
        if (inFlightFetchRef.current === promise) {
          inFlightFetchRef.current = null;
        }

        if (
          queuedRefreshRef.current &&
          mountedRef.current &&
          isLoggedIn &&
          adminProfile
        ) {
          queuedRefreshRef.current = false;
          void fetchAllData({ silent: true });
        }
      }
    },
    [
      adminProfile,
      fetchAppointments,
      fetchFollowUpReminders,
      fetchInquiries,
      isLoggedIn,
      safeFetchTable,
      safeSetState,
    ]
  );

  const queueRealtimeRefresh = useCallback(() => {
    if (realtimeTimeoutRef.current !== null) {
      window.clearTimeout(realtimeTimeoutRef.current);
    }

    realtimeTimeoutRef.current = window.setTimeout(() => {
      realtimeTimeoutRef.current = null;
      void fetchAllData({ silent: true });
    }, REALTIME_REFRESH_DELAY_MS);
  }, [fetchAllData]);

  useRealtimeCRM({
    enabled: isLoggedIn && !!adminProfile,
    onAnyChange: queueRealtimeRefresh,
  });

  useEffect(() => {
    if (isLoggedIn && adminProfile) {
      void fetchAllData();
    } else {
      fetchGenerationRef.current += 1;
      queuedRefreshRef.current = false;
    }
  }, [isLoggedIn, adminProfile?.id, fetchAllData]);

  const clearLocalData = useCallback(() => {
    fetchGenerationRef.current += 1;
    queuedRefreshRef.current = false;

    if (realtimeTimeoutRef.current !== null) {
      window.clearTimeout(realtimeTimeoutRef.current);
      realtimeTimeoutRef.current = null;
    }

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
  }, [safeSetState]);

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
    () => buildPortalUsageMetrics({ studentPortalAccounts }),
    [studentPortalAccounts]
  );

  const supportMetrics = useMemo(
    () => buildSupportMetrics({ supportRequests }),
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

  const schemaCapabilities = useMemo(
    () => ({
      studentApplications: true,
      automationQueue: false,
      executiveActionQueue: false,
      automationSource: "executive_execution_logs",
    }),
    []
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

    schemaCapabilities,

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
