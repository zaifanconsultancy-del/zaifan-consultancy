import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";

function AnimatedNumber({ value }) {
  const motionValue = useMotionValue(0);
  const springValue = useSpring(motionValue, {
    duration: 1200,
    bounce: 0,
  });

  const rounded = useTransform(springValue, (latest) => Math.round(latest));

  motionValue.set(Number(value || 0));

  return <motion.span>{rounded}</motion.span>;
}

function toLower(value) {
  return String(value || "").toLowerCase().trim();
}

function isDone(status) {
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
}

function isOverdue(dateValue) {
  if (!dateValue) return false;

  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return false;

  return date < new Date();
}

function AdminStats({
  cardClass = "",
  inquiries = [],
  inquiryNewCount = 0,
  inquiryContactedCount = 0,
  appointments = [],
  appointmentPendingCount = 0,
  appointmentConfirmedCount = 0,
  appointmentCompletedCount = 0,
  appointmentCancelledCount = 0,

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
}) {
  const allLeads = [...inquiries, ...appointments];
  const totalLeads = allLeads.length;
  const totalAppointments = appointments.length;
  const totalInquiries = inquiries.length;

  const assignedLeads = allLeads.filter((lead) => lead.assigned_admin_id).length;
  const openPoolLeads = Math.max(totalLeads - assignedLeads, 0);

  const vipLeads = allLeads.filter((lead) => lead.priority === "vip").length;
  const highLeads = allLeads.filter((lead) => lead.priority === "high").length;
  const urgentLeads = vipLeads + highLeads;

  const contactRate =
    totalInquiries === 0
      ? 0
      : Math.round((inquiryContactedCount / totalInquiries) * 100);

  const pendingRatio =
    totalAppointments === 0
      ? 0
      : Math.round((appointmentPendingCount / totalAppointments) * 100);

  const confirmRate =
    totalAppointments === 0
      ? 0
      : Math.round((appointmentConfirmedCount / totalAppointments) * 100);

  const completionRate =
    totalAppointments === 0
      ? 0
      : Math.round((appointmentCompletedCount / totalAppointments) * 100);

  const ownershipRate =
    totalLeads === 0 ? 0 : Math.round((assignedLeads / totalLeads) * 100);

  const urgentRate =
    totalLeads === 0 ? 0 : Math.round((urgentLeads / totalLeads) * 100);

  const applicationsCount = studentApplications.length;

  const offerCount = studentApplications.filter((app) => {
    const status = toLower(app.status);
    const offerStatus = toLower(app.offer_status);

    return status.includes("offer") || offerStatus.includes("received");
  }).length;

  const casIssuedCount = studentApplications.filter((app) => {
    const casStatus = toLower(app.cas_status || app.cas);

    return casStatus.includes("issued");
  }).length;

  const visaApprovedCount = studentApplications.filter((app) => {
    const visaStatus = toLower(app.visa_status || app.visa);

    return visaStatus.includes("approved");
  }).length;

  const pendingDocuments = studentDocuments.filter(
    (doc) => !isDone(doc.status || doc.document_status || doc.verification_status)
  ).length;

  const pendingTasks = studentTasks.filter(
    (task) => !isDone(task.status || task.task_status)
  );

  const overdueTasks = pendingTasks.filter((task) =>
    isOverdue(task.due_date || task.deadline || task.target_date)
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

  const activePortalAccounts = studentPortalAccounts.filter((account) => {
    const active = account.is_active ?? account.active ?? account.status;

    if (typeof active === "boolean") return active;

    return !["inactive", "disabled", "blocked", "false"].includes(toLower(active));
  }).length;

  const portalResetCount = studentPortalAccounts.filter(
    (account) => account.must_change_password || account.force_password_change
  ).length;

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

  const studentJourneyRate =
    applicationsCount === 0
      ? 0
      : Math.round(
          ((offerCount + casIssuedCount + visaApprovedCount) /
            Math.max(applicationsCount * 3, 1)) *
            100
        );

  const documentReadyRate =
    studentDocuments.length === 0
      ? 0
      : Math.round(
          ((studentDocuments.length - pendingDocuments) / studentDocuments.length) * 100
        );

  const taskHealthRate =
    studentTasks.length === 0
      ? 0
      : Math.round(((studentTasks.length - pendingTasks.length) / studentTasks.length) * 100);

  const revenueHealthRate =
    studentInvoices.length === 0
      ? 0
      : Math.round(
          ((studentInvoices.length - unpaidInvoices) / studentInvoices.length) * 100
        );

  const portalActivationRate =
    studentPortalAccounts.length === 0
      ? 0
      : Math.round((activePortalAccounts / studentPortalAccounts.length) * 100);

  const supportHealthRate =
    supportRequests.length === 0
      ? 100
      : Math.round(
          ((supportRequests.length - openSupportRequests) / supportRequests.length) * 100
        );

  const crmStats = [
    {
      label: "Total Inquiries",
      value: totalInquiries,
      icon: "📨",
      color: "text-[#D4AF37]",
      description: `${inquiryNewCount} new · ${inquiryContactedCount} contacted`,
      progress: contactRate,
      progressLabel: "Contact rate",
      tone: "gold",
    },
    {
      label: "Appointments",
      value: totalAppointments,
      icon: "📅",
      color: "text-green-400",
      description: `${appointmentPendingCount} pending · ${appointmentConfirmedCount} confirmed`,
      progress: pendingRatio,
      progressLabel: "Pending ratio",
      tone: "green",
    },
    {
      label: "Lead Ownership",
      value: assignedLeads,
      icon: "📌",
      color: "text-cyan-300",
      description: `${openPoolLeads} leads still in open pool`,
      progress: ownershipRate,
      progressLabel: "Assigned rate",
      tone: "cyan",
    },
    {
      label: "Urgent Leads",
      value: urgentLeads,
      icon: "🔥",
      color: "text-red-300",
      description: `${vipLeads} VIP · ${highLeads} high priority`,
      progress: urgentRate,
      progressLabel: "Urgency ratio",
      tone: "red",
    },
    {
      label: "Confirmed",
      value: appointmentConfirmedCount,
      icon: "✅",
      color: "text-green-400",
      description: "Ready for consultation",
      progress: confirmRate,
      progressLabel: "Confirm rate",
      tone: "green",
    },
    {
      label: "Completed",
      value: appointmentCompletedCount,
      icon: "🎯",
      color: "text-blue-300",
      description: `${appointmentCancelledCount} cancelled appointments`,
      progress: completionRate,
      progressLabel: "Completion rate",
      tone: "blue",
    },
  ];

  const studentOsStats = [
    {
      label: "Applications",
      value: applicationsCount,
      icon: "📝",
      color: "text-cyan-300",
      description: `${offerCount} offers · ${casIssuedCount} CAS · ${visaApprovedCount} visa approved`,
      progress: studentJourneyRate,
      progressLabel: "Journey progress",
      tone: "cyan",
    },
    {
      label: "Documents",
      value: studentDocuments.length,
      icon: "📂",
      color: "text-purple-300",
      description: `${pendingDocuments} pending review`,
      progress: documentReadyRate,
      progressLabel: "Readiness rate",
      tone: "purple",
    },
    {
      label: "Tasks",
      value: pendingTasks.length,
      icon: "⏳",
      color: "text-orange-300",
      description: `${overdueTasks} overdue tasks`,
      progress: taskHealthRate,
      progressLabel: "Task health",
      tone: "orange",
    },
    {
      label: "Universities",
      value: studentUniversities.length,
      icon: "🏛️",
      color: "text-pink-300",
      description: "Dream / target / safe planning",
      progress: studentUniversities.length ? 100 : 0,
      progressLabel: "Plan coverage",
      tone: "pink",
    },
    {
      label: "Risk Students",
      value: highRiskStudents,
      icon: "🚨",
      color: "text-red-300",
      description: "Executive AI high-risk queue",
      progress: studentRiskScores.length
        ? Math.round((highRiskStudents / studentRiskScores.length) * 100)
        : 0,
      progressLabel: "Risk pressure",
      tone: "red",
    },
    {
      label: "Revenue",
      value: studentInvoices.length,
      icon: "💷",
      color: "text-[#D4AF37]",
      description: `${unpaidInvoices} unpaid · £${Math.round(outstandingAmount).toLocaleString()} outstanding`,
      progress: revenueHealthRate,
      progressLabel: "Revenue health",
      tone: "gold",
    },
    {
      label: "Receipts",
      value: studentReceipts.length,
      icon: "📎",
      color: "text-blue-300",
      description: `${pendingReceipts} pending approval`,
      progress: studentReceipts.length
        ? Math.round(
            ((studentReceipts.length - pendingReceipts) / studentReceipts.length) * 100
          )
        : 0,
      progressLabel: "Receipt processing",
      tone: "blue",
    },
    {
      label: "Portal Accounts",
      value: studentPortalAccounts.length,
      icon: "🔐",
      color: "text-green-300",
      description: `${activePortalAccounts} active · ${portalResetCount} password resets`,
      progress: portalActivationRate,
      progressLabel: "Portal activation",
      tone: "green",
    },
    {
      label: "Support",
      value: openSupportRequests,
      icon: "🎧",
      color: "text-orange-300",
      description: `${escalatedSupportRequests} escalated requests`,
      progress: supportHealthRate,
      progressLabel: "Support health",
      tone: "orange",
    },
    {
      label: "Payment Requests",
      value: counselorPaymentRequests.length,
      icon: "🧾",
      color: "text-cyan-300",
      description: "Counselor payment request queue",
      progress: counselorPaymentRequests.length ? 50 : 100,
      progressLabel: "Queue pressure",
      tone: "cyan",
    },
  ];

  const stats = [...crmStats, ...studentOsStats];

  return (
    <div className="mb-5 space-y-4 xl:mb-6">
      <div className="flex flex-col gap-2">
        <p className="text-[10px] uppercase tracking-[0.28em] text-[#D4AF37]">
          Executive Dashboard KPIs
        </p>

        <h2 className="text-xl font-black text-white">
          CRM + Student OS Operating Snapshot
        </h2>

        <p className="max-w-4xl text-sm text-gray-500">
          Classic CRM performance remains active while Student OS, Revenue,
          Portal, Support, Risk, Documents, Tasks, Universities, CAS, and Visa
          intelligence are now visible from the main admin dashboard.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:gap-4 2xl:grid-cols-4">
        {stats.map((stat, index) => (
          <StatCard
            key={stat.label}
            stat={stat}
            index={index}
            cardClass={cardClass}
          />
        ))}
      </div>
    </div>
  );
}

function StatCard({ stat, index, cardClass }) {
  const toneClasses = {
    gold: "from-[#D4AF37]/20 via-[#D4AF37]/5 to-transparent",
    green: "from-green-400/15 via-green-400/5 to-transparent",
    cyan: "from-cyan-400/15 via-cyan-400/5 to-transparent",
    red: "from-red-400/15 via-red-400/5 to-transparent",
    blue: "from-blue-400/15 via-blue-400/5 to-transparent",
    purple: "from-purple-400/15 via-purple-400/5 to-transparent",
    orange: "from-orange-400/15 via-orange-400/5 to-transparent",
    pink: "from-pink-400/15 via-pink-400/5 to-transparent",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.035 }}
      className={`${cardClass} p-4 sm:p-5`}
    >
      <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent opacity-60"></div>

      <div
        className={`pointer-events-none absolute -right-16 -top-16 h-36 w-36 rounded-full bg-gradient-to-br ${
          toneClasses[stat.tone] || toneClasses.gold
        } blur-3xl transition duration-500 group-hover:opacity-100`}
      ></div>

      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[9px] uppercase tracking-[0.2em] text-gray-500 sm:text-[10px] sm:tracking-[0.28em]">
            {stat.label}
          </p>

          <h2
            className={`mt-2 text-3xl font-black leading-none sm:mt-3 sm:text-4xl ${stat.color}`}
          >
            <AnimatedNumber value={stat.value} />
          </h2>
        </div>

        <div className="flex shrink-0 flex-col items-end gap-2">
          <div className="rounded-xl border border-white/10 bg-white/[0.04] p-3 text-xl sm:rounded-2xl sm:text-2xl">
            {stat.icon}
          </div>

          <div className="rounded-xl border border-white/10 bg-black/25 px-2.5 py-1.5 text-[11px] text-gray-400 sm:rounded-2xl sm:px-3 sm:py-2 sm:text-xs">
            {stat.progress}%
          </div>
        </div>
      </div>

      <p className="relative mt-2 text-xs leading-relaxed text-gray-400 sm:mt-3 sm:text-sm">
        {stat.description}
      </p>

      <div className="relative mt-3 sm:mt-4">
        <div className="mb-1.5 flex items-center justify-between text-[10px] text-gray-500 sm:mb-2 sm:text-[11px]">
          <span>{stat.progressLabel}</span>
          <span>{stat.progress}%</span>
        </div>

        <div className="h-1.5 overflow-hidden rounded-full bg-white/10 sm:h-2">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(Math.max(stat.progress, 0), 100)}%` }}
            transition={{ duration: 0.8, delay: 0.15 }}
            className="h-full rounded-full bg-[#D4AF37]"
          ></motion.div>
        </div>
      </div>
    </motion.div>
  );
}

export default AdminStats;