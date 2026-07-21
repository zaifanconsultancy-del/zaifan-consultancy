import { useEffect } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import {
  Activity,
  AlertTriangle,
  CalendarCheck2,
  CircleDollarSign,
  ClipboardCheck,
  FolderOpen,
  Gauge,
  GraduationCap,
  Headphones,
  Landmark,
  LayoutDashboard,
  LockKeyhole,
  ReceiptText,
  ShieldAlert,
  Sparkles,
  Target,
  UserCheck,
  UsersRound,
  WalletCards,
} from "lucide-react";

function AnimatedNumber({ value }) {
  const motionValue = useMotionValue(Number(value || 0));
  const springValue = useSpring(motionValue, {
    stiffness: 110,
    damping: 20,
    mass: 0.7,
  });

  const rounded = useTransform(springValue, (latest) => Math.round(latest));

  useEffect(() => {
    motionValue.set(Number(value || 0));
  }, [motionValue, value]);

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
          ((studentDocuments.length - pendingDocuments) / studentDocuments.length) *
            100
        );

  const taskHealthRate =
    studentTasks.length === 0
      ? 0
      : Math.round(
          ((studentTasks.length - pendingTasks.length) / studentTasks.length) * 100
        );

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
          ((supportRequests.length - openSupportRequests) / supportRequests.length) *
            100
        );

  const executiveHealth = Math.round(
    (
      contactRate +
      ownershipRate +
      documentReadyRate +
      taskHealthRate +
      revenueHealthRate +
      portalActivationRate +
      supportHealthRate
    ) / 7
  );

  const criticalActions =
    openPoolLeads +
    urgentLeads +
    overdueTasks +
    highRiskStudents +
    pendingReceipts +
    escalatedSupportRequests;

  const crmMetrics = [
    {
      label: "Total Inquiries",
      value: totalInquiries,
      icon: UsersRound,
      detail: `${inquiryNewCount} new · ${inquiryContactedCount} contacted`,
      progress: contactRate,
      progressLabel: "Contact rate",
      tone: "orange",
    },
    {
      label: "Appointments",
      value: totalAppointments,
      icon: CalendarCheck2,
      detail: `${appointmentPendingCount} pending · ${appointmentConfirmedCount} confirmed`,
      progress: confirmRate,
      progressLabel: "Confirmation rate",
      tone: "blue",
    },
    {
      label: "Lead Ownership",
      value: assignedLeads,
      icon: UserCheck,
      detail: `${openPoolLeads} leads remain in the open pool`,
      progress: ownershipRate,
      progressLabel: "Assigned rate",
      tone: "emerald",
    },
    {
      label: "Priority Pressure",
      value: urgentLeads,
      icon: ShieldAlert,
      detail: `${vipLeads} VIP · ${highLeads} high priority`,
      progress: urgentRate,
      progressLabel: "Urgent lead ratio",
      tone: urgentLeads ? "red" : "emerald",
    },
  ];

  const journeyMetrics = [
    {
      label: "Applications",
      value: applicationsCount,
      icon: GraduationCap,
      detail: `${offerCount} offers · ${casIssuedCount} CAS · ${visaApprovedCount} visa approved`,
      progress: studentJourneyRate,
      progressLabel: "Journey maturity",
      tone: "blue",
    },
    {
      label: "Document Readiness",
      value: studentDocuments.length,
      icon: FolderOpen,
      detail: `${pendingDocuments} documents pending review`,
      progress: documentReadyRate,
      progressLabel: "Readiness rate",
      tone: pendingDocuments ? "amber" : "emerald",
    },
    {
      label: "Task Operations",
      value: pendingTasks.length,
      icon: ClipboardCheck,
      detail: `${overdueTasks} overdue tasks`,
      progress: taskHealthRate,
      progressLabel: "Task health",
      tone: overdueTasks ? "red" : "emerald",
    },
    {
      label: "University Planning",
      value: studentUniversities.length,
      icon: Landmark,
      detail: "Dream / target / safe planning coverage",
      progress: studentUniversities.length ? 100 : 0,
      progressLabel: "Plan coverage",
      tone: "orange",
    },
  ];

  const operationsMetrics = [
    {
      label: "High-Risk Students",
      value: highRiskStudents,
      icon: AlertTriangle,
      detail: "Executive AI risk queue requiring attention",
      tone: highRiskStudents ? "red" : "emerald",
    },
    {
      label: "Outstanding Invoices",
      value: unpaidInvoices,
      icon: CircleDollarSign,
      detail: `£${Math.round(outstandingAmount).toLocaleString()} outstanding`,
      tone: unpaidInvoices ? "amber" : "emerald",
    },
    {
      label: "Receipt Approvals",
      value: pendingReceipts,
      icon: ReceiptText,
      detail: `${studentReceipts.length} total student receipts`,
      tone: pendingReceipts ? "amber" : "emerald",
    },
    {
      label: "Portal Access",
      value: activePortalAccounts,
      icon: LockKeyhole,
      detail: `${portalResetCount} password resets required`,
      tone: portalResetCount ? "amber" : "emerald",
    },
    {
      label: "Support Queue",
      value: openSupportRequests,
      icon: Headphones,
      detail: `${escalatedSupportRequests} escalated requests`,
      tone: escalatedSupportRequests ? "red" : "blue",
    },
    {
      label: "Payment Requests",
      value: counselorPaymentRequests.length,
      icon: WalletCards,
      detail: "Counselor payment request queue",
      tone: counselorPaymentRequests.length ? "blue" : "slate",
    },
  ];

  return (
    <section className="mb-6 space-y-4">
      <div className="relative overflow-hidden rounded-[2rem] border border-orange-100 bg-gradient-to-br from-white via-[#fffaf5] to-[#fff1e7] p-6 text-[#071f50] shadow-[0_24px_70px_rgba(121,72,40,0.10)] sm:p-7">
        <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-orange-300/24 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 left-1/3 h-56 w-56 rounded-full bg-[#ffcdb4]/30 blur-3xl" />

        <div className="relative grid gap-5 xl:grid-cols-[1fr_auto] xl:items-start">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-orange-400/20 bg-orange-500/10 px-3.5 py-2 text-[10px] font-extrabold uppercase tracking-[0.15em] text-orange-700">
              <LayoutDashboard size={12} />
              Executive Operating Snapshot
            </div>

            <h2 className="mt-3 text-3xl font-black tracking-[-0.03em] text-[#071f50] sm:text-4xl">
              CRM + Student OS Health
            </h2>

            <p className="mt-2 max-w-3xl text-[15px] font-medium leading-7 text-slate-600">
              One decision layer for lead conversion, appointments, student journey readiness,
              risk, finance, portal access and support operations.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            <ExecutiveMetric
              label="Operating health"
              value={`${executiveHealth}%`}
              icon={Gauge}
              tone={executiveHealth >= 75 ? "emerald" : executiveHealth >= 50 ? "amber" : "red"}
            />
            <ExecutiveMetric
              label="Critical actions"
              value={criticalActions}
              icon={AlertTriangle}
              tone={criticalActions ? "red" : "emerald"}
            />
            <ExecutiveMetric
              label="Active students"
              value={Math.max(studentPortalAccounts.length, studentApplications.length, studentUniversities.length)}
              icon={UsersRound}
              tone="blue"
            />
          </div>
        </div>
      </div>

      <div className="grid gap-4 2xl:grid-cols-[1.1fr_0.9fr]">
        <MetricSection
          eyebrow="CRM Command"
          title="Lead & Appointment Health"
          description="Conversion pressure, lead ownership and consultation readiness."
          icon={Target}
        >
          <div className="grid gap-3 sm:grid-cols-2">
            {crmMetrics.map((stat, index) => (
              <PerformanceCard
                key={stat.label}
                stat={stat}
                index={index}
                cardClass={cardClass}
              />
            ))}
          </div>

          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <CompactHealth
              label="Appointment completion"
              value={`${completionRate}%`}
              detail={`${appointmentCompletedCount} completed · ${appointmentCancelledCount} cancelled`}
              tone={completionRate >= 70 ? "emerald" : "blue"}
            />
            <CompactHealth
              label="Pending appointment pressure"
              value={`${pendingRatio}%`}
              detail={`${appointmentPendingCount} appointments still pending`}
              tone={pendingRatio > 40 ? "amber" : "emerald"}
            />
          </div>
        </MetricSection>

        <MetricSection
          eyebrow="Priority Center"
          title="Operational Attention"
          description="Queues that need staff action before they become student or revenue problems."
          icon={Activity}
        >
          <div className="grid gap-3 sm:grid-cols-2">
            {operationsMetrics.map((stat, index) => (
              <OperationalCard
                key={stat.label}
                stat={stat}
                index={index}
              />
            ))}
          </div>
        </MetricSection>
      </div>

      <MetricSection
        eyebrow="Student OS"
        title="Journey Readiness"
        description="Application, document, task and university-planning maturity across active students."
        icon={Sparkles}
      >
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {journeyMetrics.map((stat, index) => (
            <PerformanceCard
              key={stat.label}
              stat={stat}
              index={index}
              cardClass={cardClass}
            />
          ))}
        </div>
      </MetricSection>
    </section>
  );
}

function MetricSection({ eyebrow, title, description, icon: Icon, children }) {
  return (
    <section className="rounded-[1.9rem] border border-white/10 bg-[#071f50] p-5 text-white shadow-[0_18px_48px_rgba(7,31,80,0.18)] sm:p-6">
      <div className="mb-4 flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-orange-400 shadow-sm">
          <Icon size={18} />
        </div>

        <div>
          <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-orange-600">
            {eyebrow}
          </p>
          <h3 className="mt-1 text-xl font-black tracking-tight text-white sm:text-2xl">{title}</h3>
          <p className="mt-1 text-sm font-medium leading-6 text-blue-100/80">{description}</p>
        </div>
      </div>

      {children}
    </section>
  );
}

function ExecutiveMetric({ label, value, icon: Icon, tone = "slate" }) {
  const tones = {
    slate: "border-orange-100 bg-white text-[#071f50]",
    blue: "border-white/10 bg-white/10 text-white",
    emerald: "border-white/10 bg-white/10 text-white",
    amber: "border-white/10 bg-white/10 text-white",
    red: "border-white/10 bg-white/10 text-white",
  };

  return (
    <div className={`min-w-[130px] rounded-2xl border border-orange-100 bg-white p-3 shadow-sm ${tones[tone] || tones.slate}`}>
      <Icon size={15} />
      <p className="mt-2 text-[8px] font-black uppercase tracking-[0.12em] opacity-65">{label}</p>
      <p className="mt-1 text-2xl font-black text-[#071f50]">{value}</p>
    </div>
  );
}

function PerformanceCard({ stat, index, cardClass = "" }) {
  const Icon = stat.icon;
  const tone = getTone(stat.tone);

  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, delay: Math.min(index * 0.025, 0.12) }}
      className={`relative overflow-hidden rounded-[1.45rem] border border-white/10 bg-white/10 p-5 text-white shadow-[0_10px_28px_rgba(7,31,80,0.18)] transition duration-300 hover:-translate-y-0.5 hover:border-orange-400/40 hover:bg-white/14 hover:shadow-[0_16px_38px_rgba(7,31,80,0.24)]`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-blue-100/70">
            {stat.label}
          </p>

          <p className="mt-2 text-4xl font-black leading-none tracking-[-0.04em] text-white">
            <AnimatedNumber value={stat.value} />
          </p>
        </div>

        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${tone.icon}`}>
          <Icon size={18} />
        </div>
      </div>

      <p className="mt-3 text-sm font-medium leading-6 text-blue-100/80">{stat.detail}</p>

      <div className="mt-4">
        <div className="mb-1.5 flex items-center justify-between text-[10px] font-bold text-blue-100/70">
          <span>{stat.progressLabel}</span>
          <span>{stat.progress}%</span>
        </div>

        <div className="h-2 overflow-hidden rounded-full bg-white/10">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(Math.max(stat.progress, 0), 100)}%` }}
            transition={{ duration: 0.65, delay: 0.08 }}
            className={`h-full rounded-full ${tone.bar}`}
          />
        </div>
      </div>
    </motion.article>
  );
}

function OperationalCard({ stat, index }) {
  const Icon = stat.icon;
  const tone = getTone(stat.tone);

  return (
    <motion.article
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: Math.min(index * 0.02, 0.1) }}
      className={`rounded-[1.35rem] border border-white/10 bg-white/10 p-4 text-blue-50 shadow-[0_8px_22px_rgba(7,31,80,0.16)] transition duration-300 hover:-translate-y-0.5 hover:border-orange-400/35 hover:bg-white/14 ${tone.card}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[9px] font-black uppercase tracking-[0.13em] opacity-65">
            {stat.label}
          </p>
          <p className="mt-1.5 text-2xl font-black text-white">
            <AnimatedNumber value={stat.value} />
          </p>
        </div>

        <Icon size={18} />
      </div>

      <p className="mt-2 text-xs leading-5 opacity-75">{stat.detail}</p>
    </motion.article>
  );
}

function CompactHealth({ label, value, detail, tone = "blue" }) {
  const toneMap = {
    blue: "border-white/10 bg-white/10 text-white",
    emerald: "border-white/10 bg-white/10 text-white",
    amber: "border-white/10 bg-white/10 text-white",
    red: "border-white/10 bg-white/10 text-white",
  };

  return (
    <div className={`rounded-[1.2rem] border p-3.5 ${toneMap[tone] || toneMap.blue}`}>
      <p className="text-[9px] font-black uppercase tracking-[0.13em] opacity-65">{label}</p>
      <p className="mt-1 text-xl font-black text-white">{value}</p>
      <p className="mt-1 text-[11px] leading-4 opacity-75">{detail}</p>
    </div>
  );
}

function getTone(tone = "slate") {
  const tones = {
    orange: {
      icon: "border-orange-200 bg-orange-50 text-orange-700",
      bar: "bg-orange-500",
      card: "border-l-4 border-l-orange-500",
    },
    blue: {
      icon: "border-blue-300/20 bg-blue-400/10 text-blue-200",
      bar: "bg-blue-500",
      card: "border-l-4 border-l-blue-500",
    },
    emerald: {
      icon: "border-emerald-300/20 bg-emerald-400/10 text-emerald-200",
      bar: "bg-emerald-500",
      card: "border-l-4 border-l-emerald-500",
    },
    amber: {
      icon: "border-amber-300/20 bg-amber-400/10 text-amber-200",
      bar: "bg-amber-500",
      card: "border-l-4 border-l-amber-500",
    },
    red: {
      icon: "border-red-300/20 bg-red-400/10 text-red-200",
      bar: "bg-red-500",
      card: "border-l-4 border-l-red-500",
    },
    orange: {
      icon: "border-orange-200 bg-orange-50 text-orange-700",
      bar: "bg-orange-500",
      card: "border-l-4 border-l-orange-500",
    },
    slate: {
      icon: "border-white/10 bg-white/[0.06] text-blue-100",
      bar: "bg-slate-500",
      card: "border-l-4 border-l-slate-400",
    },
  };

  return tones[tone] || tones.slate;
}

export default AdminStats;
