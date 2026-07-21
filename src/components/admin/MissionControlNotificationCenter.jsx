import { motion } from "framer-motion";

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
    pill: "border-red-400/25 bg-red-500/10 text-red-300",
    glow: "shadow-[0_0_35px_rgba(248,113,113,0.12)]",
  },
  warning: {
    border: "border-orange-300",
    bg: "bg-orange-50",
    text: "text-orange-700",
    pill: "border-orange-400/25 bg-orange-500/10 text-orange-300",
    glow: "shadow-[0_0_35px_rgba(251,146,60,0.10)]",
  },
  success: {
    border: "border-emerald-300",
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    pill: "border-emerald-400/25 bg-emerald-500/10 text-emerald-300",
    glow: "shadow-[0_0_35px_rgba(52,211,153,0.08)]",
  },
  stable: {
    border: "border-slate-300",
    bg: "bg-white",
    text: "text-[#10233f]",
    pill: "border-white/10 bg-white/[0.04] text-slate-600",
    glow: "",
  },
  gold: {
    border: "border-orange-300",
    bg: "bg-orange-50",
    text: "text-orange-700",
    pill: "border-[#D4AF37]/25 bg-[#D4AF37]/10 text-[#D4AF37]",
    glow: "shadow-[0_0_35px_rgba(212,175,55,0.10)]",
  },
  blue: {
    border: "border-blue-300",
    bg: "bg-blue-50",
    text: "text-blue-700",
    pill: "border-blue-400/25 bg-blue-500/10 text-blue-300",
    glow: "shadow-[0_0_35px_rgba(96,165,250,0.08)]",
  },
  purple: {
    border: "border-violet-300",
    bg: "bg-violet-50",
    text: "text-violet-700",
    pill: "border-purple-400/25 bg-purple-500/10 text-purple-300",
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
  const alertSystem = buildAlertSystem(props);
  const { alertGroups, totalAlerts, criticalGroups, warningGroups, resolvedHealth, resolutionQueue, executiveFeed, metrics } = alertSystem;

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28 }}
        className="relative overflow-hidden rounded-[2rem] border-2 border-orange-300 bg-[#102f5c] p-6 text-white shadow-[0_16px_40px_rgba(15,35,63,0.14)]"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-orange-500/15 via-transparent to-red-500/10" />

        <div className="relative flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.28em] text-[#D4AF37]">
              Notification Center V2
            </p>

            <h2 className="mt-2 text-3xl font-black text-white">
              Executive Alert Command Center
            </h2>

            <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-200">
              Centralized alert intelligence for executive risk, payments, visa,
              portal access, support requests, automation failures, approvals,
              duplicate protection, and operational recovery.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <HeroKpi label="Total Alerts" value={totalAlerts} tone={totalAlerts > 0 ? "warning" : "success"} />
            <HeroKpi label="Critical Groups" value={criticalGroups} tone={criticalGroups > 0 ? "critical" : "success"} />
            <HeroKpi label="Stable Health" value={`${resolvedHealth}%`} tone={resolvedHealth >= 60 ? "success" : "warning"} />
          </div>
        </div>
      </motion.div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
        {alertGroups.map((group, index) => (
          <AlertCommandCard key={group.key} group={group} index={index} />
        ))}
      </div>

      <div className="grid gap-6 2xl:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-[2rem] border border-white/10 bg-white/[0.035] p-5">
          <SectionHeader
            eyebrow="Resolution Queue"
            title="Highest priority alerts to clear first"
            subtitle="Critical and warning alerts across payment, visa, portal, support, and automation."
          />

          <div className="mt-5 space-y-3">
            {resolutionQueue.length ? (
              resolutionQueue.map((item, index) => (
                <ResolutionRow key={`${item.group}-${item.title}-${index}`} item={item} index={index} />
              ))
            ) : (
              <EmptyState text="No alert resolution items detected. Current systems look stable." />
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-[2rem] border border-[#D4AF37]/20 bg-[#D4AF37]/[0.04] p-5">
            <SectionHeader
              eyebrow="Alert Analytics"
              title="Operating alert health"
              subtitle="High-level health of cross-system alert pressure."
            />

            <div className="mt-5 grid gap-3">
              <HealthBar label="Collection Rate" value={metrics.collectionRate} />
              <HealthBar label="Receipt Approval" value={metrics.receiptApprovalRate} />
              <HealthBar label="Portal Activation" value={metrics.portalActivationRate} />
              <HealthBar label="Portal 7-Day Activity" value={metrics.portalRecentActivityRate} />
              <HealthBar label="Automation Success" value={metrics.automationSuccessRate} />
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-white/[0.035] p-5">
            <SectionHeader
              eyebrow="Executive Feed"
              title="Latest command signals"
              subtitle="Fast feed of urgent events for leadership review."
            />

            <div className="mt-5 space-y-3">
              {executiveFeed.length ? (
                executiveFeed.map((item, index) => (
                  <FeedRow key={`${item.title}-${index}`} item={item} index={index} />
                ))
              ) : (
                <EmptyState text="No urgent executive feed items loaded yet." />
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MiniKpi label="Outstanding Revenue" value={formatMoney(metrics.outstandingValue)} icon="💷" />
        <MiniKpi label="Overdue Tasks" value={metrics.overdueTasks} icon="⏳" />
        <MiniKpi label="Pending Documents" value={metrics.pendingDocuments} icon="📂" />
        <MiniKpi label="University Plans" value={metrics.universityPlans} icon="🏛️" />
      </div>
    </div>
  );
}

function HeroKpi({ label, value, tone = "stable" }) {
  const style = toneClasses[tone] || toneClasses.stable;

  return (
    <div className={`rounded-2xl border-2 ${style.border} ${style.bg} p-4 text-center ${style.glow}`}>
      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">
        {label}
      </p>
      <p className={`mt-2 text-3xl font-black ${style.text}`}>{value}</p>
    </div>
  );
}

function AlertCommandCard({ group, index }) {
  const style = toneClasses[group.tone] || toneClasses.stable;

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.24, delay: index * 0.035 }}
      className={`rounded-[1.75rem] border-2 ${style.border} ${style.bg} p-5 shadow-[0_7px_20px_rgba(15,35,63,0.04)] ${style.glow}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="text-3xl">{group.icon}</div>
        <span className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] ${style.pill}`}>
          {group.tone}
        </span>
      </div>

      <p className="mt-5 text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">
        {group.title}
      </p>

      <p className={`mt-2 text-4xl font-black ${style.text}`}>
        {group.count}
      </p>

      <p className="mt-2 text-xs leading-5 text-slate-600">{group.summary}</p>
      <p className="mt-3 text-xs leading-5 text-slate-500">{group.description}</p>
    </motion.div>
  );
}

function ResolutionRow({ item, index }) {
  const style = toneClasses[item.tone] || toneClasses.stable;

  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.22, delay: index * 0.025 }}
      className="rounded-2xl border border-white/10 bg-black/25 p-4"
    >
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <p className="font-black text-white">
            {item.groupIcon} {item.title}
          </p>
          <p className="mt-1 text-xs text-slate-500">{item.group} • {item.meta}</p>
          <p className="mt-2 line-clamp-2 text-xs leading-5 text-slate-600">{item.body}</p>
        </div>

        <span className={`shrink-0 rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] ${style.pill}`}>
          {item.tone}
        </span>
      </div>
    </motion.div>
  );
}

function FeedRow({ item, index }) {
  const style = toneClasses[item.tone] || toneClasses.stable;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay: index * 0.025 }}
      className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-black/20 p-4"
    >
      <div className="flex min-w-0 items-center gap-3">
        <span className="text-2xl">{item.icon}</span>
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-white">{item.title}</p>
          <p className="truncate text-xs text-slate-500">{item.meta}</p>
        </div>
      </div>

      <span className={`rounded-full border px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.14em] ${style.pill}`}>
        {item.tone}
      </span>
    </motion.div>
  );
}

function HealthBar({ label, value }) {
  const clean = Math.max(0, Math.min(100, Number(value || 0)));
  const tone = clean >= 70 ? "success" : clean >= 40 ? "warning" : "critical";
  const style = toneClasses[tone];

  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
      <div className="flex items-center justify-between text-sm">
        <span className="font-semibold text-white">{label}</span>
        <span className={`font-black ${style.text}`}>{clean}%</span>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200">
        <div className={`h-full rounded-full ${tone === "success" ? "bg-emerald-500" : tone === "warning" ? "bg-orange-500" : "bg-red-500"}`} style={{ width: `${clean}%` }} />
      </div>
    </div>
  );
}

function MiniKpi({ label, value, icon }) {
  return (
    <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.035] p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">{label}</p>
          <p className="mt-2 text-2xl font-black text-white">{value}</p>
        </div>
        <span className="text-3xl">{icon}</span>
      </div>
    </div>
  );
}

function SectionHeader({ eyebrow, title, subtitle }) {
  return (
    <div>
      <p className="text-xs font-black uppercase tracking-[0.22em] text-orange-700">{eyebrow}</p>
      <h3 className="mt-1 text-xl font-black text-white">{title}</h3>
      {subtitle ? <p className="mt-1 text-sm leading-6 text-slate-600">{subtitle}</p> : null}
    </div>
  );
}

function EmptyState({ text }) {
  return (
    <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.025] p-5 text-sm text-slate-500">
      {text}
    </div>
  );
}

export default MissionControlNotificationCenter;