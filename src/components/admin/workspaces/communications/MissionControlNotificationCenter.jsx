// MissionControlNotificationCenter V7 PARTNER OS EXTREME — Alert Intelligence Command
// Partner OS visual alignment built on the current production logic.
// Preserves alert aggregation and data contracts while strengthening hierarchy,
// contrast, filtering, drill-down visibility, and operational usability.
//
// UI location: /admin -> Notification Center / Executive Alert Command Center
//
import { motion, useReducedMotion } from "framer-motion";
import { useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  BellRing,
  CheckCircle2,
  CircleGauge,
  Filter,
  Search,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-react";

const toLower = (value) => String(value || "").toLowerCase().trim();

const number = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
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

const isWithinDays = (value, days = 30) => {
  if (!value) return false;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return false;

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  return date >= cutoff;
};

const isOverdue = (dateValue) => {
  if (!dateValue) return false;
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return false;
  return date < new Date();
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

const getStudentName = (item = {}) =>
  item.student_name ||
  item.full_name ||
  item.name ||
  item.student_email ||
  item.email ||
  "Unknown Student";

const getJourneyStage = (score = {}) => {
  const direct = toLower(score.journey_stage || score?.diagnostics?.journey_stage);
  if (direct) return direct;

  const applicationStatus = toLower(score.application_status);
  const offerStatus = toLower(score.offer_status);
  const visaStatus = toLower(score.visa_status);

  if (applicationStatus.includes("enrolled")) return "enrolled";
  if (visaStatus.includes("approved")) return "visa_approved";
  if (visaStatus.includes("reject") || visaStatus.includes("refus")) return "visa_rejected";
  if (visaStatus.includes("pending") || visaStatus.includes("submitted") || visaStatus.includes("processing")) return "visa_pending";
  if (applicationStatus.includes("cas_issued")) return "cas_issued";
  if (applicationStatus.includes("cas_pending")) return "cas_pending";
  if (applicationStatus.includes("accepted") || offerStatus.includes("accepted") || offerStatus.includes("firm")) return "offer_accepted";
  if (applicationStatus.includes("offer") || offerStatus.includes("offer") || offerStatus.includes("received")) return "offer_received";
  if (applicationStatus.includes("review") || applicationStatus.includes("processing")) return "application_under_review";
  if (applicationStatus.includes("applied") || applicationStatus.includes("submitted")) return "application_submitted";
  if (applicationStatus.includes("started") || applicationStatus.includes("draft")) return "application_started";
  return "not_started";
};

const classifyPriority = (value, warning = 1, danger = 5) => {
  const clean = Number(value || 0);
  if (clean >= danger) return "critical";
  if (clean >= warning) return "warning";
  return "stable";
};

const toneClasses = {
  critical: {
    border: "border-red-300",
    bg: "bg-red-50",
    text: "text-red-700",
    pill: "border-red-300 bg-red-50 text-red-700",
    glow: "shadow-[0_0_35px_rgba(248,113,113,0.12)]",
  },
  warning: {
    border: "border-orange-300",
    bg: "bg-orange-50",
    text: "text-[#C2410C]",
    pill: "border-[#FF5A0A]/55 bg-[#FFF4E8] text-[#C2410C]",
    glow: "shadow-[0_0_35px_rgba(251,146,60,0.10)]",
  },
  success: {
    border: "border-emerald-300",
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    pill: "border-emerald-300 bg-emerald-50 text-emerald-700",
    glow: "shadow-[0_0_35px_rgba(52,211,153,0.08)]",
  },
  stable: {
    border: "border-[#123865]/35",
    bg: "bg-[#FFF8EF]",
    text: "text-[#10233F]",
    pill: "border-[#C9D7E6] bg-[#FFF8EF] text-[#10233F]",
    glow: "",
  },
  gold: {
    border: "border-orange-300",
    bg: "bg-orange-50",
    text: "text-[#C2410C]",
    pill: "border-[#FF5A0A]/55 bg-[#FFF4E8] text-[#C2410C]",
    glow: "shadow-[0_0_35px_rgba(212,175,55,0.10)]",
  },
  blue: {
    border: "border-[#C9D7E6]",
    bg: "bg-[#EEF3F8]",
    text: "text-[#123865]",
    pill: "border-[#123865]/35 bg-[#EEF3F8] text-[#123865]",
    glow: "shadow-[0_0_35px_rgba(96,165,250,0.08)]",
  },
  purple: {
    border: "border-[#FF5A0A]/45",
    bg: "bg-[#FFF4E8]",
    text: "text-[#C2410C]",
    pill: "border-[#FF5A0A]/40 bg-[#FFF4E8] text-[#C2410C]",
    glow: "shadow-[0_0_35px_rgba(192,132,252,0.08)]",
  },
};

function buildAlertSystem({
  inquiries = [],
  appointments = [],
  followUpReminders = [],
  studentApplications = [],
  studentDocuments = [],
  studentTasks = [],
  studentUniversities = [],
  studentRiskScores = [],
  scores = [],
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
  revenueMetrics = null,
  portalUsageMetrics = null,
  notificationMetrics = null,
}) {
  const riskSource = studentRiskScores.length ? studentRiskScores : scores;
  const receipts = [...studentReceipts, ...paymentReceipts];
  
  const mergedPortalAccounts = [
  ...(Array.isArray(studentPortalAccounts) ? studentPortalAccounts : []),
  ...(Array.isArray(portalAccounts) ? portalAccounts : []),
];
  const supportItems = [...supportRequests, ...studentSupportRequests];
  const automationItems = [...automationQueue, ...executiveActionQueue];

  const newInquiries = inquiries.filter((item) => {
    const status = toLower(item.status || item.lead_status);
    return status.includes("new") || status.includes("pending");
  }).length;

  const pendingAppointments = appointments.filter((item) => {
    const status = toLower(item.status || item.appointment_status);
    return status.includes("pending") || status.includes("requested");
  }).length;

  const overdueFollowups = followUpReminders.filter((item) => {
    const dueDate = item.due_date || item.reminder_date || item.date;
    return isOverdue(dueDate) && !isDone(item.status);
  }).length;

  const highRiskStudents = riskSource.filter((score) => {
    const riskLevel = toLower(score.risk_level || score.priority || score.level || score.executive_category);
    const riskScore = number(score.risk_score || score.score || score.overall_score);
    return riskLevel.includes("high") || riskLevel.includes("critical") || riskScore >= 70;
  });

  const criticalRiskStudents = riskSource.filter((score) => {
    const riskLevel = toLower(score.risk_level || score.priority || score.level || score.executive_category);
    const riskScore = number(score.risk_score || score.score || score.overall_score);
    return riskLevel.includes("critical") || riskScore >= 85;
  });

  const casDelays = studentApplications.filter((app) => {
    const offer = toLower(app.offer_status || app.status);
    const cas = toLower(app.cas_status || app.cas);
    return (offer.includes("accepted") || offer.includes("firm")) && !cas.includes("issued");
  });

  const visaDelays = studentApplications.filter((app) => {
    const cas = toLower(app.cas_status || app.cas);
    const visa = toLower(app.visa_status || app.visa);
    return cas.includes("issued") && !visa.includes("approved");
  });

  const pendingDocuments = studentDocuments.filter(
    (doc) => !isDone(doc.status || doc.document_status || doc.verification_status)
  );

  const pendingTasks = studentTasks.filter((task) => !isDone(task.status || task.task_status));

  const overdueTasks = pendingTasks.filter((task) =>
    isOverdue(task.due_date || task.deadline || task.target_date)
  );

  const unpaidInvoices = studentInvoices.filter((invoice) => {
    const status = toLower(invoice.status || invoice.payment_status);
    return !status.includes("paid") && !status.includes("complete");
  });

  const invoiceValue =
    revenueMetrics?.invoiceValue ??
    studentInvoices.reduce((sum, invoice) => sum + getAmount(invoice), 0);

  const paidValue =
    revenueMetrics?.paidValue ??
    studentPayments.reduce((sum, payment) => sum + getAmount(payment), 0);

  const outstandingValue =
    revenueMetrics?.outstandingValue ??
    studentInvoices.reduce((sum, invoice) => {
      const status = toLower(invoice.status || invoice.payment_status);
      const amount = getAmount(invoice);
      const outstanding = Number(invoice.outstanding_amount || invoice.balance || 0);

      if (status.includes("paid") || status.includes("complete")) return sum;
      return sum + (outstanding || amount);
    }, 0);

  const pendingReceipts = receipts.filter((receipt) => {
    const status = toLower(receipt.status || receipt.receipt_status || receipt.approval_status);
    return !status.includes("approved") && !status.includes("rejected");
  });

  const approvedReceipts = receipts.filter((receipt) => {
    const status = toLower(receipt.status || receipt.receipt_status || receipt.approval_status);
    return status.includes("approved");
  });

  const activePortalAccounts = mergedPortalAccounts.filter((account) => {
    const active = account.is_active ?? account.active ?? account.status;
    if (typeof active === "boolean") return active;
    return !["inactive", "disabled", "blocked", "false"].includes(toLower(active));
  });

  const passwordResetAccounts = mergedPortalAccounts.filter(
    (account) => account.must_change_password || account.force_password_change
  );

  const stalePortalAccounts = mergedPortalAccounts.filter((account) => {
    const lastLogin = account.last_login_at || account.last_login || account.last_seen_at;
    return !lastLogin || !isWithinDays(lastLogin, 30);
  });

  const recentlyActivePortalAccounts = mergedPortalAccounts.filter((account) => {
    const lastLogin = account.last_login_at || account.last_login || account.last_seen_at;
    return isWithinDays(lastLogin, 7);
  });

  const openSupportRequests = supportItems.filter((request) => {
    const status = toLower(request.status || request.request_status);
    return !status.includes("resolved") && !status.includes("closed");
  });

  const escalatedSupportRequests = supportItems.filter((request) => {
    const status = toLower(request.status || request.request_status);
    const priority = toLower(request.priority || request.severity);
    return (
      status.includes("escalated") ||
      priority.includes("urgent") ||
      priority.includes("high") ||
      priority.includes("critical")
    );
  });

  const waitingSupportRequests = supportItems.filter((request) => {
    const status = toLower(request.status || request.request_status);
    return status.includes("pending") || status.includes("waiting") || status.includes("open");
  });

  const failedExecutions = executiveExecutionLogs.filter((log) => {
    const status = toLower(log.status || log.execution_status || log.approval_status);
    const error = log.error_message || log.error || log.failure_reason;
    return status.includes("failed") || status.includes("error") || Boolean(error);
  });

  const pendingApprovals = executiveExecutionLogs.filter((log) => {
    const approval = toLower(log.approval_status || log.status);
    return approval.includes("pending") || approval.includes("queued") || approval.includes("waiting");
  });

  const duplicateBlocked = executiveExecutionLogs.filter(
    (log) => log.duplicate_detected || log.duplicate_blocked
  );

  const queuedAutomation = automationItems.filter((item) => {
    const status = toLower(item.status || item.approval_status);
    return status.includes("pending") || status.includes("queued") || status.includes("waiting");
  });

  const successfulExecutions = executiveExecutionLogs.filter((log) => {
    const status = toLower(log.status || log.execution_status || log.approval_status);
    return status.includes("success") || status.includes("executed") || status.includes("completed");
  });

  const collectionRate = revenueMetrics?.collectionRate ?? percent(paidValue, invoiceValue);
  const receiptApprovalRate =
    revenueMetrics?.receiptApprovalRate ?? percent(approvedReceipts.length, receipts.length);
  const portalActivationRate =
    portalUsageMetrics?.activationRate ?? percent(activePortalAccounts.length, mergedPortalAccounts.length);
  const portalRecentActivityRate =
    portalUsageMetrics?.recentActivityRate ?? percent(recentlyActivePortalAccounts.length, mergedPortalAccounts.length);
  const automationSuccessRate = percent(successfulExecutions.length, successfulExecutions.length + failedExecutions.length);

  const alertGroups = [
    {
      key: "executive",
      title: "Executive Alerts",
      icon: "🚨",
      tone: classifyPriority(highRiskStudents.length + criticalRiskStudents.length, 1, 5),
      count: notificationMetrics?.executiveAlerts ?? highRiskStudents.length + criticalRiskStudents.length,
      summary: `${criticalRiskStudents.length} critical / ${highRiskStudents.length} high risk`,
      description: "Leadership-level student risk and intervention queue.",
      items: [
        ...criticalRiskStudents.slice(0, 4).map((score) => ({
          title: getStudentName(score),
          meta: `Critical risk • ${number(score.risk_score || score.score)} score`,
          body: score.summary || score.gpt_summary || "Immediate executive attention recommended.",
          tone: "critical",
        })),
        ...highRiskStudents.slice(0, 4).map((score) => ({
          title: getStudentName(score),
          meta: `High risk • ${number(score.risk_score || score.score)} score`,
          body: score.summary || score.gpt_summary || "Counselor follow-up recommended.",
          tone: "warning",
        })),
      ],
    },
    {
      key: "payment",
      title: "Payment Alerts",
      icon: "💷",
      tone: classifyPriority(unpaidInvoices.length + pendingReceipts.length + counselorPaymentRequests.length, 1, 6),
      count: notificationMetrics?.paymentAlerts ?? unpaidInvoices.length + pendingReceipts.length + counselorPaymentRequests.length,
      summary: `${formatMoney(outstandingValue)} outstanding • ${collectionRate}% collected`,
      description: "Invoices, receipts, outstanding balances, and counselor payment requests.",
      items: [
        ...unpaidInvoices.slice(0, 5).map((invoice) => ({
          title: invoice.invoice_number || invoice.title || "Unpaid invoice",
          meta: `${formatMoney(getAmount(invoice))} • ${getStudentName(invoice)}`,
          body: "Outstanding invoice should be followed up by finance or counselor.",
          tone: "warning",
        })),
        ...pendingReceipts.slice(0, 5).map((receipt) => ({
          title: receipt.file_name || receipt.title || "Receipt awaiting approval",
          meta: `${formatMoney(getAmount(receipt))} • ${getStudentName(receipt)}`,
          body: "Student-uploaded receipt needs verification.",
          tone: "warning",
        })),
      ],
    },
    {
      key: "visa",
      title: "Visa Alerts",
      icon: "🛂",
      tone: classifyPriority(casDelays.length + visaDelays.length, 1, 4),
      count: notificationMetrics?.visaAlerts ?? casDelays.length + visaDelays.length,
      summary: `${casDelays.length} CAS delays • ${visaDelays.length} visa delays`,
      description: "CAS/visa blockers that can stall conversion and enrollment.",
      items: [
        ...casDelays.slice(0, 5).map((app) => ({
          title: getStudentName(app),
          meta: app.university_name || app.course_name || "CAS pending",
          body: "Offer accepted but CAS is not issued yet.",
          tone: "warning",
        })),
        ...visaDelays.slice(0, 5).map((app) => ({
          title: getStudentName(app),
          meta: app.university_name || app.course_name || "Visa pending",
          body: "CAS issued but visa is not approved yet.",
          tone: "critical",
        })),
      ],
    },
    {
      key: "portal",
      title: "Portal Alerts",
      icon: "🔐",
      tone: classifyPriority(passwordResetAccounts.length + stalePortalAccounts.length, 1, 8),
      count: notificationMetrics?.portalAlerts ?? passwordResetAccounts.length + stalePortalAccounts.length,
      summary: `${portalActivationRate}% activation • ${portalRecentActivityRate}% 7-day activity`,
      description: "Student Portal access, activation, login freshness, and password actions.",
      items: [
        ...passwordResetAccounts.slice(0, 5).map((account) => ({
          title: getStudentName(account),
          meta: account.email || account.student_email || "Password reset required",
          body: "Student must change password before normal portal use.",
          tone: "warning",
        })),
        ...stalePortalAccounts.slice(0, 5).map((account) => ({
          title: getStudentName(account),
          meta: account.email || account.student_email || "Stale portal account",
          body: "No recent login in 30 days or login tracking missing.",
          tone: "warning",
        })),
      ],
    },
    {
      key: "support",
      title: "Support Alerts",
      icon: "📬",
      tone: classifyPriority(openSupportRequests.length + escalatedSupportRequests.length, 1, 8),
      count: notificationMetrics?.supportAlerts ?? openSupportRequests.length + escalatedSupportRequests.length,
      summary: `${openSupportRequests.length} open • ${escalatedSupportRequests.length} escalated`,
      description: "Support queue, response pressure, escalations, and waiting students.",
      items: [
        ...escalatedSupportRequests.slice(0, 5).map((request) => ({
          title: request.subject || request.category || "Escalated support request",
          meta: `${getStudentName(request)} • ${request.priority || "High priority"}`,
          body: request.message || request.description || "Support case requires leadership attention.",
          tone: "critical",
        })),
        ...waitingSupportRequests.slice(0, 5).map((request) => ({
          title: request.subject || request.category || "Waiting support request",
          meta: `${getStudentName(request)} • ${request.status || "Waiting"}`,
          body: request.message || request.description || "Student is waiting for a team response.",
          tone: "warning",
        })),
      ],
    },
    {
      key: "automation",
      title: "Automation Alerts",
      icon: "⚙️",
      tone: classifyPriority(failedExecutions.length * 2 + pendingApprovals.length + queuedAutomation.length, 1, 8),
      count: notificationMetrics?.automationAlerts ?? failedExecutions.length + pendingApprovals.length + duplicateBlocked.length + queuedAutomation.length,
      summary: `${automationSuccessRate}% success • ${pendingApprovals.length + queuedAutomation.length} approvals`,
      description: "Failed automations, approval queues, duplicate protection, and recovery candidates.",
      items: [
        ...failedExecutions.slice(0, 5).map((log) => ({
          title: log.action_type || log.template_key || "Failed automation",
          meta: `${getStudentName(log)} • ${log.status || "failed"}`,
          body: log.error_message || log.error || log.failure_reason || "Automation execution needs investigation.",
          tone: "critical",
        })),
        ...pendingApprovals.slice(0, 5).map((log) => ({
          title: log.action_type || log.template_key || "Approval pending",
          meta: `${getStudentName(log)} • ${log.priority || "approval"}`,
          body: "Human approval is required before execution.",
          tone: "warning",
        })),
      ],
    },
  ];

  const totalAlerts =
    notificationMetrics?.totalAlerts ??
    alertGroups.reduce((sum, group) => sum + Number(group.count || 0), 0);

  const criticalGroups = alertGroups.filter((group) => group.tone === "critical").length;
  const warningGroups = alertGroups.filter((group) => group.tone === "warning").length;
  const resolvedHealth =
    alertGroups.length > 0
      ? percent(alertGroups.filter((group) => group.tone === "stable").length, alertGroups.length)
      : 100;

  const resolutionQueue = alertGroups
    .flatMap((group) =>
      group.items.map((item) => ({
        ...item,
        group: group.title,
        groupIcon: group.icon,
      }))
    )
    .sort((a, b) => {
      const weight = { critical: 3, warning: 2, stable: 1 };
      return (weight[b.tone] || 0) - (weight[a.tone] || 0);
    })
    .slice(0, 12);

  const executiveFeed = [
    ...failedExecutions.slice(0, 4).map((item) => ({
      icon: "⚙️",
      title: item.action_type || item.template_key || "Automation failure",
      meta: `${getStudentName(item)} • ${item.status || "failed"}`,
      tone: "critical",
    })),
    ...criticalRiskStudents.slice(0, 4).map((item) => ({
      icon: "🚨",
      title: getStudentName(item),
      meta: `Critical risk • ${number(item.risk_score || item.score)} score`,
      tone: "critical",
    })),
    ...pendingReceipts.slice(0, 4).map((item) => ({
      icon: "📎",
      title: item.file_name || "Receipt pending",
      meta: `${getStudentName(item)} • awaiting approval`,
      tone: "warning",
    })),
    ...visaDelays.slice(0, 4).map((item) => ({
      icon: "🛂",
      title: getStudentName(item),
      meta: "CAS issued, visa not approved",
      tone: "warning",
    })),
  ].slice(0, 10);

  return {
    alertGroups,
    totalAlerts,
    criticalGroups,
    warningGroups,
    resolvedHealth,
    resolutionQueue,
    executiveFeed,
    metrics: {
      newInquiries,
      pendingAppointments,
      overdueFollowups,
      pendingDocuments: pendingDocuments.length,
      pendingTasks: pendingTasks.length,
      overdueTasks: overdueTasks.length,
      invoiceValue,
      paidValue,
      outstandingValue,
      collectionRate,
      receiptApprovalRate,
      portalActivationRate,
      portalRecentActivityRate,
      automationSuccessRate,
      universityPlans: studentUniversities.length,
    },
  };
}

function MissionControlNotificationCenter(props) {
  const reduceMotion = useReducedMotion();
  const [toneFilter, setToneFilter] = useState("all");
  const [groupFilter, setGroupFilter] = useState("all");
  const [query, setQuery] = useState("");

  const alertSystem = buildAlertSystem(props);
  const {
    alertGroups,
    totalAlerts,
    criticalGroups,
    warningGroups,
    resolvedHealth,
    resolutionQueue,
    executiveFeed,
    metrics,
  } = alertSystem;

  const visibleGroups = useMemo(() => {
    return alertGroups.filter((group) => {
      if (toneFilter !== "all" && group.tone !== toneFilter) return false;
      if (groupFilter !== "all" && group.key !== groupFilter) return false;
      return true;
    });
  }, [alertGroups, toneFilter, groupFilter]);

  const visibleResolutionQueue = useMemo(() => {
    const cleanQuery = toLower(query);

    return resolutionQueue.filter((item) => {
      if (toneFilter !== "all" && item.tone !== toneFilter) return false;

      if (
        groupFilter !== "all" &&
        toLower(item.group).includes(groupFilter) === false
      ) {
        const matchingGroup = alertGroups.find(
          (group) => group.key === groupFilter
        );

        if (matchingGroup?.title !== item.group) return false;
      }

      if (!cleanQuery) return true;

      return [item.title, item.meta, item.body, item.group]
        .map(toLower)
        .some((value) => value.includes(cleanQuery));
    });
  }, [
    resolutionQueue,
    toneFilter,
    groupFilter,
    query,
    alertGroups,
  ]);

  const filtersActive =
    toneFilter !== "all" ||
    groupFilter !== "all" ||
    Boolean(query.trim());

  const clearFilters = () => {
    setToneFilter("all");
    setGroupFilter("all");
    setQuery("");
  };

  const commandState =
    criticalGroups > 0
      ? "Immediate Intervention"
      : warningGroups > 0
        ? "Controlled Attention"
        : "Stable Operations";

  const activePressure =
    criticalGroups * 3 +
    warningGroups * 2 +
    visibleResolutionQueue.length;

  return (
    <motion.section
      initial={reduceMotion ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reduceMotion ? 0 : 0.28 }}
      className="min-w-0 space-y-5"
    >
      <section className="min-w-0 overflow-hidden rounded-[1.75rem] border-[3px] border-[#FF5A0A] bg-white shadow-[0_18px_50px_rgba(18,56,101,0.11)]">
        <div className="grid min-w-0 lg:grid-cols-[minmax(0,1.28fr)_minmax(19rem,0.72fr)]">
          <div className="min-w-0 bg-[#123865] p-5 text-white sm:p-6 lg:p-7">
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <CommandChip icon={BellRing}>Notification Center V3</CommandChip>
              <CommandChip icon={ShieldCheck}>Cross-System Intelligence</CommandChip>
              <CommandChip icon={CircleGauge}>Live Alert Evidence</CommandChip>
            </div>

            <h2 className="mt-4 max-w-5xl break-words text-3xl font-black leading-tight tracking-[-0.04em] text-white sm:text-4xl">
              Executive Alert Command Center
            </h2>

            <p className="mt-3 max-w-5xl break-words text-sm font-semibold leading-6 text-slate-100">
              Centralized command intelligence for executive risk, payments,
              visa, portal access, support requests, automation failures,
              approvals, duplicate protection and operational recovery.
            </p>

            <div className="mt-5 grid min-w-0 grid-cols-2 gap-2 sm:grid-cols-4">
              <DarkMetric label="Alert Groups" value={visibleGroups.length} />
              <DarkMetric label="Total Alerts" value={totalAlerts} />
              <DarkMetric label="Warnings" value={warningGroups} />
              <DarkMetric label="Queue Items" value={visibleResolutionQueue.length} />
            </div>
          </div>

          <div className="min-w-0 border-t-[3px] border-[#FF5A0A] bg-[#FF5A0A] p-5 text-white sm:p-6 lg:border-l-[3px] lg:border-t-0 lg:p-7">
            <div className="flex items-center gap-2">
              <Activity size={18} />
              <p className="text-[9px] font-black uppercase tracking-[0.14em] text-white">
                Alert Operating Position
              </p>
            </div>

            <p className="mt-3 text-5xl font-black text-white">
              {activePressure}
            </p>

            <p className="mt-1 text-sm font-black uppercase tracking-[0.08em] text-white">
              {commandState}
            </p>

            <div className="mt-5 grid grid-cols-2 gap-2">
              <OrangeMetric label="Critical" value={criticalGroups} />
              <OrangeMetric label="Warnings" value={warningGroups} />
              <OrangeMetric label="Stable Health" value={`${resolvedHealth}%`} />
              <OrangeMetric label="Resolution" value={visibleResolutionQueue.length} />
            </div>

            <div className="mt-4 rounded-xl border-2 border-white/25 bg-white/10 p-3">
              <p className="text-[8px] font-black uppercase tracking-[0.1em] text-white">
                Command Rule
              </p>
              <p className="mt-1 text-xs font-black leading-5 text-white">
                Clear critical groups first, then warning queues, while stable
                categories remain visible for operating assurance.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="min-w-0 overflow-hidden rounded-[1.6rem] border-[3px] border-[#123865] bg-white shadow-[0_14px_38px_rgba(18,56,101,0.08)]">
        <div className="flex min-w-0 flex-col gap-3 border-b-[3px] border-[#FF5A0A] bg-[#123865] px-5 py-4 text-white sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.14em] text-orange-200">
              Alert Operations Board
            </p>
            <h3 className="mt-1 text-xl font-black text-white">
              Cross-system command pressure
            </h3>
            <p className="mt-1 max-w-4xl text-xs font-semibold leading-5 text-slate-200">
              Grouped alert intelligence replaces the old isolated KPI strip.
            </p>
          </div>

          <span className="w-fit rounded-full border-2 border-white/25 bg-white/10 px-3 py-1.5 text-[9px] font-black uppercase text-white">
            {totalAlerts} active alerts
          </span>
        </div>

        <div className="grid min-w-0 gap-3 bg-[#FFF8EF] p-4 sm:grid-cols-2 sm:p-5 xl:grid-cols-4">
          <BoardMetric
            label="Outstanding Revenue"
            value={formatMoney(metrics.outstandingValue)}
            detail={`${metrics.collectionRate}% collection rate`}
            tone="orange"
            icon={CircleGauge}
          />
          <BoardMetric
            label="Overdue Tasks"
            value={metrics.overdueTasks}
            detail={`${metrics.pendingTasks} pending tasks`}
            tone={metrics.overdueTasks ? "red" : "green"}
            icon={AlertTriangle}
          />
          <BoardMetric
            label="Pending Documents"
            value={metrics.pendingDocuments}
            detail="Documents awaiting completion or review"
            tone={metrics.pendingDocuments ? "navy" : "green"}
            icon={Filter}
          />
          <BoardMetric
            label="University Plans"
            value={metrics.universityPlans}
            detail="Connected university planning records"
            tone="navy"
            icon={Sparkles}
          />
          <BoardMetric
            label="Portal Activation"
            value={`${metrics.portalActivationRate}%`}
            detail={`${metrics.portalRecentActivityRate}% active in 7 days`}
            tone={metrics.portalActivationRate >= 70 ? "green" : "orange"}
            icon={ShieldCheck}
          />
          <BoardMetric
            label="Receipt Approval"
            value={`${metrics.receiptApprovalRate}%`}
            detail="Connected receipt approval health"
            tone={metrics.receiptApprovalRate >= 70 ? "green" : "orange"}
            icon={CheckCircle2}
          />
          <BoardMetric
            label="Automation Success"
            value={`${metrics.automationSuccessRate}%`}
            detail="Connected executive automation health"
            tone={metrics.automationSuccessRate >= 70 ? "green" : "red"}
            icon={Activity}
          />
          <BoardMetric
            label="Resolution Queue"
            value={visibleResolutionQueue.length}
            detail="Highest-priority records to clear"
            tone={visibleResolutionQueue.length ? "red" : "green"}
            icon={BellRing}
          />
        </div>
      </section>

      <section className="min-w-0 overflow-hidden rounded-[1.55rem] border-[3px] border-[#123865] bg-white shadow-[0_12px_32px_rgba(18,56,101,0.07)]">
        <div className="flex min-w-0 flex-col gap-3 border-b-[3px] border-[#FF5A0A] bg-[#123865] px-5 py-4 text-white sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.14em] text-orange-200">
              Alert Filters
            </p>
            <h3 className="mt-1 text-xl font-black text-white">
              Focus the command center
            </h3>
          </div>

          <span className="w-fit rounded-full border-2 border-white/25 bg-white/10 px-3 py-1.5 text-[9px] font-black uppercase text-white">
            {visibleResolutionQueue.length} queue item
            {visibleResolutionQueue.length === 1 ? "" : "s"}
          </span>
        </div>

        <div className="grid min-w-0 gap-3 bg-[#FFF8EF] p-4 sm:p-5 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,0.8fr)_minmax(0,1.25fr)_auto]">
          <select
            value={toneFilter}
            onChange={(event) => setToneFilter(event.target.value)}
            className="min-h-11 min-w-0 rounded-xl border-2 border-[#C9D7E6] bg-white px-4 text-sm font-black text-[#10233F] outline-none transition focus:border-[#FF5A0A] focus:ring-4 focus:ring-orange-100"
          >
            <option value="all">All Severity</option>
            <option value="critical">Critical</option>
            <option value="warning">Warning</option>
            <option value="stable">Stable</option>
          </select>

          <select
            value={groupFilter}
            onChange={(event) => setGroupFilter(event.target.value)}
            className="min-h-11 min-w-0 rounded-xl border-2 border-[#C9D7E6] bg-white px-4 text-sm font-black text-[#10233F] outline-none transition focus:border-[#FF5A0A] focus:ring-4 focus:ring-orange-100"
          >
            <option value="all">All Categories</option>
            {alertGroups.map((group) => (
              <option key={group.key} value={group.key}>
                {group.title.replace(" Alerts", "")}
              </option>
            ))}
          </select>

          <label className="relative block min-w-0">
            <Search
              size={15}
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search alerts, students, groups..."
              className="min-h-11 w-full rounded-xl border-2 border-[#C9D7E6] bg-white pl-10 pr-4 text-sm font-semibold text-[#10233F] outline-none placeholder:text-slate-400 transition focus:border-[#FF5A0A] focus:ring-4 focus:ring-orange-100"
            />
          </label>

          <button
            type="button"
            onClick={clearFilters}
            disabled={!filtersActive}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border-2 border-[#123865] bg-white px-4 text-xs font-black text-[#123865] transition hover:-translate-y-0.5 hover:border-[#FF5A0A] hover:bg-[#FFF4E8] disabled:cursor-not-allowed disabled:opacity-45"
          >
            <X size={14} />
            Reset
          </button>
        </div>
      </section>

      <section className="min-w-0 overflow-hidden rounded-[1.6rem] border-[3px] border-[#123865] bg-white shadow-[0_14px_38px_rgba(18,56,101,0.08)]">
        <div className="flex min-w-0 flex-col gap-2 border-b-[3px] border-[#FF5A0A] bg-[#123865] px-5 py-4 text-white sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.14em] text-orange-200">
              Command Categories
            </p>
            <h3 className="mt-1 text-xl font-black text-white">
              Alert intelligence by operating system
            </h3>
          </div>

          <span className="w-fit rounded-full border-2 border-white/25 bg-white/10 px-3 py-1.5 text-[9px] font-black uppercase text-white">
            {visibleGroups.length} visible group
            {visibleGroups.length === 1 ? "" : "s"}
          </span>
        </div>

        <div className="grid min-w-0 gap-3 bg-[#FFF8EF] p-4 sm:p-5 md:grid-cols-2 xl:grid-cols-3">
          {visibleGroups.map((group, index) => (
            <AlertCommandCard
              key={group.key}
              group={group}
              index={index}
              reduceMotion={reduceMotion}
            />
          ))}
        </div>
      </section>

      <div className="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1.15fr)_minmax(21rem,0.85fr)]">
        <section className="min-w-0 overflow-hidden rounded-[1.6rem] border-[3px] border-[#123865] bg-white shadow-[0_14px_38px_rgba(18,56,101,0.08)]">
          <div className="border-b-[3px] border-[#FF5A0A] bg-[#123865] px-5 py-4 text-white">
            <SectionHeader
              inverse
              eyebrow="Resolution Command"
              title="Highest-priority alerts to clear first"
              subtitle="Critical and warning records across payment, visa, portal, support and automation."
            />
          </div>

          <div className="space-y-3 bg-[#FFF8EF] p-4 sm:p-5">
            {visibleResolutionQueue.length ? (
              visibleResolutionQueue.map((item, index) => (
                <ResolutionRow
                  key={`${item.group}-${item.title}-${index}`}
                  item={item}
                  index={index}
                  reduceMotion={reduceMotion}
                />
              ))
            ) : (
              <EmptyState text="No alert resolution items detected. Current systems look stable." />
            )}
          </div>
        </section>

        <div className="min-w-0 space-y-5">
          <section className="min-w-0 overflow-hidden rounded-[1.6rem] border-[3px] border-[#FF5A0A] bg-white shadow-[0_12px_34px_rgba(18,56,101,0.07)]">
            <div className="border-b-[3px] border-[#FF5A0A] bg-[#FFF4E8] px-5 py-4">
              <SectionHeader
                eyebrow="Alert Analytics"
                title="Operating alert health"
                subtitle="Cross-system collection, portal and automation health."
              />
            </div>

            <div className="grid gap-3 bg-[#FFF8EF] p-4 sm:p-5">
              <HealthBar label="Collection Rate" value={metrics.collectionRate} />
              <HealthBar label="Receipt Approval" value={metrics.receiptApprovalRate} />
              <HealthBar label="Portal Activation" value={metrics.portalActivationRate} />
              <HealthBar label="Portal 7-Day Activity" value={metrics.portalRecentActivityRate} />
              <HealthBar label="Automation Success" value={metrics.automationSuccessRate} />
            </div>
          </section>

          <section className="min-w-0 overflow-hidden rounded-[1.6rem] border-[3px] border-[#123865] bg-white shadow-[0_12px_34px_rgba(18,56,101,0.07)]">
            <div className="border-b-[3px] border-[#FF5A0A] bg-[#123865] px-5 py-4 text-white">
              <SectionHeader
                inverse
                eyebrow="Executive Feed"
                title="Latest command signals"
                subtitle="Fast leadership feed of urgent cross-system events."
              />
            </div>

            <div className="space-y-3 bg-[#FFF8EF] p-4 sm:p-5">
              {executiveFeed.length ? (
                executiveFeed.map((item, index) => (
                  <FeedRow
                    key={`${item.title}-${index}`}
                    item={item}
                    index={index}
                    reduceMotion={reduceMotion}
                  />
                ))
              ) : (
                <EmptyState text="No urgent executive feed items loaded yet." />
              )}
            </div>
          </section>
        </div>
      </div>

      <section className="min-w-0 overflow-hidden rounded-[1.55rem] border-[3px] border-[#FF5A0A] bg-white shadow-[0_12px_34px_rgba(18,56,101,0.07)]">
        <div className="grid min-w-0 lg:grid-cols-[minmax(0,1.2fr)_minmax(18rem,0.8fr)]">
          <div className="min-w-0 bg-[#123865] p-5 text-white">
            <div className="flex items-start gap-3">
              <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-orange-200" />
              <div className="min-w-0">
                <p className="text-[9px] font-black uppercase tracking-[0.14em] text-orange-200">
                  Founder Interpretation
                </p>
                <p className="mt-2 text-sm font-black leading-6 text-white">
                  {criticalGroups > 0
                    ? `${criticalGroups} critical alert group${
                        criticalGroups === 1 ? "" : "s"
                      } require immediate leadership attention before normal queue work.`
                    : warningGroups > 0
                      ? `${warningGroups} warning group${
                          warningGroups === 1 ? "" : "s"
                        } remain. Clear the resolution queue in severity order to improve operating health.`
                      : "No critical or warning alert groups are currently detected. Maintain follow-up, finance, portal and automation discipline."}
                </p>
              </div>
            </div>
          </div>

          <div className="min-w-0 border-t-[3px] border-[#FF5A0A] bg-[#FFF4E8] p-5 lg:border-l-[3px] lg:border-t-0">
            <p className="text-[9px] font-black uppercase tracking-[0.12em] text-orange-700">
              Current Command State
            </p>
            <p className="mt-2 text-2xl font-black text-[#10233F]">
              {commandState}
            </p>
            <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">
              Evidence remains read-only here. Resolution belongs inside the
              owning operational workspace.
            </p>
          </div>
        </div>
      </section>
    </motion.section>
  );
}



function CommandChip({ icon: Icon, children }) {
  return (
    <span className="inline-flex max-w-full items-center gap-2 rounded-full border-2 border-white/25 bg-white/10 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.12em] text-white">
      <Icon size={11} className="shrink-0 text-orange-200" />
      <span className="truncate">{children}</span>
    </span>
  );
}

function DarkMetric({ label, value }) {
  return (
    <div className="min-w-0 rounded-xl border-2 border-white/25 bg-white/10 p-3 text-white shadow-inner">
      <p className="truncate text-[8px] font-black uppercase tracking-[0.1em] text-white">
        {label}
      </p>
      <p className="mt-1 truncate text-xl font-black text-white">
        {value ?? 0}
      </p>
    </div>
  );
}

function OrangeMetric({ label, value }) {
  return (
    <div className="min-w-0 rounded-xl border-2 border-white/25 bg-white/10 p-3 text-white">
      <p className="truncate text-[8px] font-black uppercase tracking-[0.1em] text-white">
        {label}
      </p>
      <p className="mt-1 truncate text-xl font-black text-white">
        {value ?? 0}
      </p>
    </div>
  );
}

function BoardMetric({
  label,
  value,
  detail,
  tone = "navy",
  icon: Icon,
}) {
  const classes =
    tone === "green"
      ? "border-emerald-400 bg-emerald-50"
      : tone === "red"
        ? "border-red-400 bg-red-50"
        : tone === "orange"
          ? "border-[#FF5A0A] bg-[#FFF4E8]"
          : "border-[#123865] bg-[#F2F7FF]";

  return (
    <article className={`min-w-0 rounded-[1.25rem] border-[3px] p-4 shadow-[0_7px_18px_rgba(18,56,101,0.05)] transition hover:-translate-y-0.5 hover:shadow-md ${classes}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[8px] font-black uppercase tracking-[0.1em] text-[#53657D]">
            {label}
          </p>
          <p className="mt-2 break-words text-3xl font-black text-[#10233F]">
            {value ?? 0}
          </p>
        </div>
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border-2 border-white bg-white/80 text-[#123865]">
          <Icon size={16} />
        </span>
      </div>
      <p className="mt-3 text-[10px] font-semibold leading-4 text-slate-600">
        {detail}
      </p>
    </article>
  );
}


function HeroKpi({ label, value, tone = "stable" }) {
  const style = toneClasses[tone] || toneClasses.stable;

  return (
    <div
      className={`min-w-0 rounded-xl border-[3px] ${style.border} ${style.bg} p-3.5 text-center shadow-[0_6px_16px_rgba(18,56,101,0.04)] ${style.glow}`}
    >
      <p className="break-words text-[8px] font-black uppercase tracking-[0.1em] text-slate-600">
        {label}
      </p>
      <p className={`mt-2 text-2xl font-black ${style.text}`}>
        {value}
      </p>
    </div>
  );
}

function DarkAlertMetric({ label, value }) {
  return (
    <div className="min-w-0 rounded-xl border-2 border-white/25 bg-white/10 p-3 text-white shadow-inner">
      <p className="truncate text-[8px] font-black uppercase tracking-[0.1em] text-white">
        {label}
      </p>
      <p className="mt-1 truncate text-xl font-black text-white">
        {value}
      </p>
    </div>
  );
}

function OrangeAlertMetric({ label, value }) {
  return (
    <div className="min-w-0 rounded-xl border-2 border-white/25 bg-white/10 p-3 text-white">
      <p className="truncate text-[8px] font-black uppercase tracking-[0.1em] text-white">
        {label}
      </p>
      <p className="mt-1 truncate text-xl font-black text-white">
        {value}
      </p>
    </div>
  );
}

function AlertCommandCard({
  group,
  index,
  reduceMotion,
}) {
  const style = toneClasses[group.tone] || toneClasses.stable;

  return (
    <motion.article
      initial={reduceMotion ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: reduceMotion ? 0 : 0.22,
        delay: reduceMotion ? 0 : Math.min(index * 0.03, 0.15),
      }}
      className={`relative min-w-0 overflow-hidden rounded-[1.35rem] border-[3px] ${style.border} ${style.bg} p-4 shadow-[0_7px_18px_rgba(18,56,101,0.05)] transition hover:-translate-y-0.5 hover:shadow-md ${style.glow}`}
    >
      <div className="absolute inset-x-0 top-0 h-1.5 bg-current opacity-65" />

      <div className="flex items-start justify-between gap-3">
        <span className="text-2xl" aria-hidden="true">
          {group.icon}
        </span>

        <span
          className={`rounded-full border-2 px-2.5 py-1 text-[8px] font-black uppercase tracking-[0.1em] ${style.pill}`}
        >
          {group.tone}
        </span>
      </div>

      <p className="mt-4 break-words text-[8px] font-black uppercase tracking-[0.1em] text-slate-500">
        {group.title}
      </p>

      <p className={`mt-2 text-3xl font-black ${style.text}`}>
        {group.count}
      </p>

      <p className="mt-2 break-words text-[10px] font-semibold leading-4 text-slate-600">
        {group.summary}
      </p>

      <p className="mt-3 break-words text-[10px] leading-4 text-slate-500">
        {group.description}
      </p>
    </motion.article>
  );
}

function ResolutionRow({
  item,
  index,
  reduceMotion,
}) {
  const style = toneClasses[item.tone] || toneClasses.stable;

  return (
    <motion.article
      initial={reduceMotion ? false : { opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{
        duration: reduceMotion ? 0 : 0.2,
        delay: reduceMotion ? 0 : Math.min(index * 0.02, 0.12),
      }}
      className="min-w-0 rounded-[1.15rem] border-[3px] border-[#C9D7E6] bg-white p-4 shadow-[0_6px_16px_rgba(18,56,101,0.04)] transition hover:border-[#FF5A0A] hover:shadow-md"
    >
      <div className="flex min-w-0 flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <p className="break-words font-black text-[#10233F]">
            {item.groupIcon} {item.title}
          </p>

          <p className="mt-1 break-words text-xs font-semibold text-slate-500">
            {item.group} • {item.meta}
          </p>

          <p className="mt-2 line-clamp-2 break-words text-xs leading-5 text-slate-600">
            {item.body}
          </p>
        </div>

        <span
          className={`w-fit shrink-0 rounded-full border-2 px-3 py-1 text-[9px] font-black uppercase tracking-[0.1em] ${style.pill}`}
        >
          {item.tone}
        </span>
      </div>
    </motion.article>
  );
}

function FeedRow({
  item,
  index,
  reduceMotion,
}) {
  const style = toneClasses[item.tone] || toneClasses.stable;

  return (
    <motion.article
      initial={reduceMotion ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: reduceMotion ? 0 : 0.18,
        delay: reduceMotion ? 0 : Math.min(index * 0.02, 0.12),
      }}
      className="flex min-w-0 items-center justify-between gap-3 rounded-[1.1rem] border-[3px] border-[#C9D7E6] bg-white p-4 shadow-[0_6px_16px_rgba(18,56,101,0.04)] transition hover:border-[#FF5A0A]"
    >
      <div className="flex min-w-0 items-center gap-3">
        <span className="text-xl" aria-hidden="true">
          {item.icon}
        </span>

        <div className="min-w-0">
          <p className="truncate text-sm font-black text-[#10233F]">
            {item.title}
          </p>
          <p className="truncate text-xs font-semibold text-slate-500">
            {item.meta}
          </p>
        </div>
      </div>

      <span
        className={`shrink-0 rounded-full border-2 px-2.5 py-1 text-[8px] font-black uppercase tracking-[0.1em] ${style.pill}`}
      >
        {item.tone}
      </span>
    </motion.article>
  );
}

function HealthBar({ label, value }) {
  const clean = Math.max(
    0,
    Math.min(100, Number(value || 0))
  );

  const tone =
    clean >= 70
      ? "success"
      : clean >= 40
        ? "warning"
        : "critical";

  const style = toneClasses[tone];

  return (
    <div className="min-w-0 rounded-[1.1rem] border-[3px] border-[#C9D7E6] bg-white p-4 shadow-[0_6px_16px_rgba(18,56,101,0.04)]">
      <div className="flex items-center justify-between gap-3 text-sm">
        <span className="break-words font-black text-[#10233F]">
          {label}
        </span>
        <span className={`shrink-0 font-black ${style.text}`}>
          {clean}%
        </span>
      </div>

      <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-slate-200">
        <div
          className={`h-full rounded-full ${
            tone === "success"
              ? "bg-emerald-500"
              : tone === "warning"
                ? "bg-[#FF5A0A]"
                : "bg-red-500"
          }`}
          style={{ width: `${clean}%` }}
        />
      </div>
    </div>
  );
}

function MiniKpi({ label, value, icon }) {
  return (
    <div className="min-w-0 rounded-[1.25rem] border-[3px] border-[#C9D7E6] bg-white p-4 shadow-[0_7px_18px_rgba(18,56,101,0.05)] transition hover:-translate-y-0.5 hover:border-[#FF5A0A] hover:shadow-md">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="break-words text-[8px] font-black uppercase tracking-[0.1em] text-slate-500">
            {label}
          </p>
          <p className="mt-2 break-words text-xl font-black text-[#10233F]">
            {value}
          </p>
        </div>

        <span className="text-2xl" aria-hidden="true">
          {icon}
        </span>
      </div>
    </div>
  );
}

function SectionHeader({
  eyebrow,
  title,
  subtitle,
  inverse = false,
}) {
  return (
    <div className="min-w-0">
      <p
        className={`text-[9px] font-black uppercase tracking-[0.14em] ${
          inverse ? "text-orange-200" : "text-orange-700"
        }`}
      >
        {eyebrow}
      </p>

      <h3
        className={`mt-1 break-words text-xl font-black ${
          inverse ? "text-white" : "text-[#10233F]"
        }`}
      >
        {title}
      </h3>

      {subtitle ? (
        <p
          className={`mt-1 break-words text-xs font-semibold leading-5 ${
            inverse ? "text-slate-200" : "text-slate-600"
          }`}
        >
          {subtitle}
        </p>
      ) : null}
    </div>
  );
}

function EmptyState({ text }) {
  return (
    <div className="rounded-[1.2rem] border-[3px] border-dashed border-[#FF5A0A] bg-white p-5 text-sm font-semibold text-slate-500">
      {text}
    </div>
  );
}

export default MissionControlNotificationCenter;
