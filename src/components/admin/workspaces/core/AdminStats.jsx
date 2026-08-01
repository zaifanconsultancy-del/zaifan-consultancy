// AdminStats V4 PARTNER OS — Executive Operating Intelligence
// src/components/admin/core/AdminStats.jsx
//
// Full maximum pass:
// - preserves the existing prop API: no parent rewiring required
// - corrects status normalization across applications/documents/tasks/finance
// - removes duplicate tone definition and inconsistent navy text behavior
// - prevents percentages from escaping 0–100
// - handles missing/invalid arrays and numeric values defensively
// - avoids misleading "100% healthy" when a data domain has no records
// - adds real operational signal classification instead of decorative KPIs
// - separates CRM, Student Journey, Risk/Work, Finance/Access/Support
// - adds attention queue and executive summary derived from current data
// - preserves animated counters/progress with reduced-motion support
// - follows Zaifan rule: ALL navy surfaces use white text
// - denser, stronger, more responsive Partner OS presentation
// - locked #123865 navy / #10233F text / #FF5A0A orange / #FFF8EF cream

import { useEffect, useMemo } from "react";
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from "framer-motion";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BadgeCheck,
  CalendarCheck2,
  CheckCircle2,
  CircleDollarSign,
  ClipboardCheck,
  Clock3,
  FileWarning,
  FolderOpen,
  Gauge,
  GraduationCap,
  Headphones,
  Landmark,
  LayoutDashboard,
  LockKeyhole,
  ReceiptText,
  RefreshCcw,
  ShieldAlert,
  Sparkles,
  Target,
  UserCheck,
  UsersRound,
  WalletCards,
  XCircle,
} from "lucide-react";

const NAVY = "#123865";

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

function clamp(value, min = 0, max = 100) {
  const number = Number(value);
  if (!Number.isFinite(number)) return min;
  return Math.min(Math.max(number, min), max);
}

function safeNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function normalize(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[_-]+/g, " ");
}

function includesAny(value, terms) {
  const normalized = normalize(value);
  return terms.some((term) => normalized.includes(term));
}

function isCompletedStatus(value) {
  return includesAny(value, [
    "completed",
    "complete",
    "done",
    "approved",
    "verified",
    "resolved",
    "closed",
    "paid",
    "received",
    "issued",
    "accepted",
  ]);
}

function isNegativeStatus(value) {
  return includesAny(value, [
    "cancelled",
    "canceled",
    "rejected",
    "failed",
    "declined",
    "blocked",
    "refused",
  ]);
}

function isOpenStatus(value) {
  const normalized = normalize(value);
  if (!normalized) return true;
  return !isCompletedStatus(normalized) && !isNegativeStatus(normalized);
}

function parseDate(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function isOverdue(dateValue) {
  const date = parseDate(dateValue);
  if (!date) return false;

  const now = new Date();
  return date.getTime() < now.getTime();
}

function percent(numerator, denominator, emptyValue = 0) {
  const top = safeNumber(numerator);
  const bottom = safeNumber(denominator);

  if (bottom <= 0) return emptyValue;
  return clamp(Math.round((top / bottom) * 100));
}

function currencyAmount(value) {
  return safeNumber(value, 0);
}

function formatMoney(value) {
  return Math.round(safeNumber(value)).toLocaleString();
}

function getHealthTone(value) {
  const score = clamp(value);
  if (score >= 80) return "emerald";
  if (score >= 60) return "blue";
  if (score >= 40) return "amber";
  return "red";
}

function AnimatedNumber({ value, suffix = "" }) {
  const reduceMotion = useReducedMotion();
  const numericValue = safeNumber(value);
  const motionValue = useMotionValue(numericValue);
  const springValue = useSpring(motionValue, {
    stiffness: 110,
    damping: 20,
    mass: 0.7,
  });

  const rounded = useTransform(
    reduceMotion ? motionValue : springValue,
    (latest) => `${Math.round(latest)}${suffix}`
  );

  useEffect(() => {
    motionValue.set(numericValue);
  }, [motionValue, numericValue]);

  return <motion.span>{rounded}</motion.span>;
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
  const reduceMotion = useReducedMotion();

  const data = useMemo(
    () => ({
      inquiries: safeArray(inquiries),
      appointments: safeArray(appointments),
      applications: safeArray(studentApplications),
      documents: safeArray(studentDocuments),
      tasks: safeArray(studentTasks),
      universities: safeArray(studentUniversities),
      risks: safeArray(studentRiskScores),
      invoices: safeArray(studentInvoices),
      payments: safeArray(studentPayments),
      receipts: safeArray(studentReceipts),
      portalAccounts: safeArray(studentPortalAccounts),
      support: safeArray(supportRequests),
      counselorPayments: safeArray(counselorPaymentRequests),
    }),
    [
      inquiries,
      appointments,
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
    ]
  );

  const intelligence = useMemo(() => {
    const allLeads = [...data.inquiries, ...data.appointments];

    const totalInquiries = data.inquiries.length;
    const totalAppointments = data.appointments.length;
    const totalLeads = allLeads.length;

    const assignedLeads = allLeads.filter((lead) =>
      Boolean(
        lead?.assigned_admin_id ||
          lead?.assigned_to ||
          lead?.counselor_id ||
          lead?.owner_id
      )
    ).length;

    const openPoolLeads = Math.max(totalLeads - assignedLeads, 0);

    const vipLeads = allLeads.filter(
      (lead) => normalize(lead?.priority) === "vip"
    ).length;

    const highLeads = allLeads.filter((lead) =>
      ["high", "urgent", "critical"].includes(normalize(lead?.priority))
    ).length;

    const urgentLeads = vipLeads + highLeads;

    const contactRate = percent(inquiryContactedCount, totalInquiries);
    const ownershipRate = percent(assignedLeads, totalLeads);
    const urgentRate = percent(urgentLeads, totalLeads);
    const pendingAppointmentRate = percent(
      appointmentPendingCount,
      totalAppointments
    );
    const confirmationRate = percent(
      appointmentConfirmedCount,
      totalAppointments
    );
    const completionRate = percent(
      appointmentCompletedCount,
      totalAppointments
    );

    const applicationsCount = data.applications.length;

    const offerCount = data.applications.filter((app) =>
      includesAny(
        [
          app?.offer_status,
          app?.application_status,
          app?.status,
        ].join(" "),
        ["offer received", "offer accepted", "conditional offer", "unconditional offer"]
      )
    ).length;

    const casIssuedCount = data.applications.filter((app) =>
      includesAny([app?.cas_status, app?.cas].join(" "), ["issued"])
    ).length;

    const visaApprovedCount = data.applications.filter((app) =>
      includesAny(
        [app?.visa_status, app?.visa].join(" "),
        ["approved", "granted"]
      )
    ).length;

    const activeApplications = data.applications.filter((app) => {
      const status = [
        app?.application_status,
        app?.status,
        app?.offer_status,
        app?.visa_status,
      ].join(" ");

      return !includesAny(status, [
        "withdrawn",
        "cancelled",
        "canceled",
        "rejected",
        "refused",
        "closed",
      ]);
    }).length;

    const readyDocuments = data.documents.filter((doc) =>
      isCompletedStatus(
        doc?.verification_status ||
          doc?.document_status ||
          doc?.status
      )
    ).length;

    const rejectedDocuments = data.documents.filter((doc) =>
      includesAny(
        doc?.verification_status ||
          doc?.document_status ||
          doc?.status,
        ["rejected", "failed"]
      )
    ).length;

    const pendingDocuments = Math.max(
      data.documents.length - readyDocuments - rejectedDocuments,
      0
    );

    const pendingTasks = data.tasks.filter(
      (task) =>
        !isCompletedStatus(task?.status || task?.task_status) &&
        !isNegativeStatus(task?.status || task?.task_status)
    );

    const overdueTasks = pendingTasks.filter((task) =>
      isOverdue(task?.due_date || task?.deadline || task?.target_date)
    ).length;

    const completedTasks = data.tasks.filter((task) =>
      isCompletedStatus(task?.status || task?.task_status)
    ).length;

    const highRiskStudents = data.risks.filter((risk) => {
      const score = safeNumber(
        risk?.risk_score ?? risk?.score ?? risk?.overall_score
      );
      const level = normalize(
        risk?.risk_level || risk?.priority || risk?.level
      );

      return (
        score >= 70 ||
        ["high", "critical", "severe"].some((term) =>
          level.includes(term)
        )
      );
    }).length;

    const criticalRiskStudents = data.risks.filter((risk) => {
      const score = safeNumber(
        risk?.risk_score ?? risk?.score ?? risk?.overall_score
      );
      const level = normalize(
        risk?.risk_level || risk?.priority || risk?.level
      );

      return score >= 85 || level.includes("critical");
    }).length;

    const unpaidInvoices = data.invoices.filter((invoice) => {
      const status = invoice?.payment_status || invoice?.status;
      return !includesAny(status, ["paid", "complete", "completed", "settled"]);
    });

    const outstandingAmount = unpaidInvoices.reduce((sum, invoice) => {
      const explicitBalance =
        invoice?.outstanding_amount ??
        invoice?.balance ??
        invoice?.amount_due;

      if (explicitBalance !== undefined && explicitBalance !== null) {
        return sum + currencyAmount(explicitBalance);
      }

      const total = currencyAmount(
        invoice?.total_amount ??
          invoice?.invoice_amount ??
          invoice?.amount
      );

      const paid = currencyAmount(
        invoice?.paid_amount ?? invoice?.amount_paid
      );

      return sum + Math.max(total - paid, 0);
    }, 0);

    const completedPayments = data.payments.filter((payment) =>
      includesAny(payment?.status || payment?.payment_status, [
        "paid",
        "completed",
        "successful",
        "success",
        "settled",
      ])
    ).length;

    const pendingReceipts = data.receipts.filter((receipt) => {
      const status =
        receipt?.approval_status ||
        receipt?.receipt_status ||
        receipt?.status;

      return !includesAny(status, ["approved", "rejected"]);
    }).length;

    const activePortalAccounts = data.portalAccounts.filter((account) => {
      const active =
        account?.is_active ?? account?.active ?? account?.status;

      if (typeof active === "boolean") return active;

      const normalized = normalize(active);
      if (!normalized) return true;

      return !["inactive", "disabled", "blocked", "false"].includes(
        normalized
      );
    }).length;

    const portalResetCount = data.portalAccounts.filter(
      (account) =>
        account?.must_change_password ||
        account?.force_password_change
    ).length;

    const openSupportRequests = data.support.filter((request) => {
      const status = request?.request_status || request?.status;
      return isOpenStatus(status);
    }).length;

    const escalatedSupportRequests = data.support.filter((request) => {
      const status = normalize(
        request?.request_status || request?.status
      );
      const priority = normalize(
        request?.priority || request?.severity
      );

      return (
        status.includes("escalated") ||
        ["urgent", "high", "critical"].some((term) =>
          priority.includes(term)
        )
      );
    }).length;

    const journeyMilestones =
      offerCount + casIssuedCount + visaApprovedCount;

    const studentJourneyRate =
      applicationsCount === 0
        ? 0
        : clamp(
            Math.round(
              (journeyMilestones /
                Math.max(applicationsCount * 3, 1)) *
                100
            )
          );

    const documentReadyRate = percent(
      readyDocuments,
      data.documents.length
    );

    const taskHealthRate = percent(
      completedTasks,
      data.tasks.length
    );

    const revenueHealthRate =
      data.invoices.length === 0
        ? 0
        : percent(
            data.invoices.length - unpaidInvoices.length,
            data.invoices.length
          );

    const portalActivationRate = percent(
      activePortalAccounts,
      data.portalAccounts.length
    );

    const supportHealthRate =
      data.support.length === 0
        ? 0
        : percent(
            data.support.length - openSupportRequests,
            data.support.length
          );

    const availableHealthSignals = [
      totalInquiries > 0 ? contactRate : null,
      totalLeads > 0 ? ownershipRate : null,
      data.documents.length > 0 ? documentReadyRate : null,
      data.tasks.length > 0 ? taskHealthRate : null,
      data.invoices.length > 0 ? revenueHealthRate : null,
      data.portalAccounts.length > 0 ? portalActivationRate : null,
      data.support.length > 0 ? supportHealthRate : null,
    ].filter((value) => value !== null);

    const executiveHealth = availableHealthSignals.length
      ? clamp(
          Math.round(
            availableHealthSignals.reduce(
              (sum, value) => sum + value,
              0
            ) / availableHealthSignals.length
          )
        )
      : 0;

    const criticalActions =
      openPoolLeads +
      urgentLeads +
      overdueTasks +
      highRiskStudents +
      rejectedDocuments +
      pendingReceipts +
      escalatedSupportRequests +
      portalResetCount;

    const activeStudentEstimate = Math.max(
      data.portalAccounts.length,
      data.applications.length,
      data.universities.length
    );

    const attention = [
      openPoolLeads
        ? {
            id: "open-pool",
            label: "Unassigned leads",
            value: openPoolLeads,
            detail: "Leads still waiting for ownership.",
            tone: "amber",
            Icon: UserCheck,
          }
        : null,
      urgentLeads
        ? {
            id: "priority",
            label: "VIP / urgent leads",
            value: urgentLeads,
            detail: "Priority cases need fast counselor attention.",
            tone: "red",
            Icon: ShieldAlert,
          }
        : null,
      overdueTasks
        ? {
            id: "tasks",
            label: "Overdue tasks",
            value: overdueTasks,
            detail: "Open tasks have passed their due date.",
            tone: "red",
            Icon: Clock3,
          }
        : null,
      rejectedDocuments
        ? {
            id: "documents",
            label: "Rejected documents",
            value: rejectedDocuments,
            detail: "Student files require replacement or correction.",
            tone: "red",
            Icon: FileWarning,
          }
        : null,
      highRiskStudents
        ? {
            id: "risk",
            label: "High-risk students",
            value: highRiskStudents,
            detail: `${criticalRiskStudents} currently classified critical.`,
            tone: "red",
            Icon: AlertTriangle,
          }
        : null,
      pendingReceipts
        ? {
            id: "receipts",
            label: "Receipt approvals",
            value: pendingReceipts,
            detail: "Student receipts are waiting for review.",
            tone: "amber",
            Icon: ReceiptText,
          }
        : null,
      escalatedSupportRequests
        ? {
            id: "support",
            label: "Escalated support",
            value: escalatedSupportRequests,
            detail: "High-priority support requests are open.",
            tone: "red",
            Icon: Headphones,
          }
        : null,
      portalResetCount
        ? {
            id: "portal",
            label: "Portal resets",
            value: portalResetCount,
            detail: "Student accounts require password change.",
            tone: "amber",
            Icon: LockKeyhole,
          }
        : null,
    ].filter(Boolean);

    return {
      totalInquiries,
      totalAppointments,
      totalLeads,
      assignedLeads,
      openPoolLeads,
      vipLeads,
      highLeads,
      urgentLeads,
      contactRate,
      ownershipRate,
      urgentRate,
      pendingAppointmentRate,
      confirmationRate,
      completionRate,

      applicationsCount,
      activeApplications,
      offerCount,
      casIssuedCount,
      visaApprovedCount,
      studentJourneyRate,

      readyDocuments,
      rejectedDocuments,
      pendingDocuments,
      documentReadyRate,

      pendingTasksCount: pendingTasks.length,
      overdueTasks,
      completedTasks,
      taskHealthRate,

      highRiskStudents,
      criticalRiskStudents,

      unpaidInvoicesCount: unpaidInvoices.length,
      outstandingAmount,
      completedPayments,
      revenueHealthRate,

      pendingReceipts,
      activePortalAccounts,
      portalResetCount,
      portalActivationRate,

      openSupportRequests,
      escalatedSupportRequests,
      supportHealthRate,

      executiveHealth,
      criticalActions,
      activeStudentEstimate,
      attention,
    };
  }, [
    data,
    inquiryContactedCount,
    appointmentPendingCount,
    appointmentConfirmedCount,
    appointmentCompletedCount,
  ]);

  const crmMetrics = [
    {
      label: "Total Inquiries",
      value: intelligence.totalInquiries,
      icon: UsersRound,
      detail: `${safeNumber(inquiryNewCount)} new · ${safeNumber(
        inquiryContactedCount
      )} contacted`,
      progress: intelligence.contactRate,
      progressLabel: "Contact rate",
      tone:
        intelligence.contactRate >= 70
          ? "emerald"
          : intelligence.contactRate >= 40
          ? "amber"
          : "orange",
    },
    {
      label: "Appointments",
      value: intelligence.totalAppointments,
      icon: CalendarCheck2,
      detail: `${safeNumber(
        appointmentPendingCount
      )} pending · ${safeNumber(
        appointmentConfirmedCount
      )} confirmed`,
      progress: intelligence.confirmationRate,
      progressLabel: "Confirmation rate",
      tone:
        intelligence.confirmationRate >= 70
          ? "emerald"
          : "blue",
    },
    {
      label: "Lead Ownership",
      value: intelligence.assignedLeads,
      icon: UserCheck,
      detail: `${intelligence.openPoolLeads} leads remain in the open pool`,
      progress: intelligence.ownershipRate,
      progressLabel: "Assigned rate",
      tone:
        intelligence.openPoolLeads > 0 ? "amber" : "emerald",
    },
    {
      label: "Priority Pressure",
      value: intelligence.urgentLeads,
      icon: ShieldAlert,
      detail: `${intelligence.vipLeads} VIP · ${intelligence.highLeads} high / urgent`,
      progress: intelligence.urgentRate,
      progressLabel: "Urgent lead ratio",
      tone: intelligence.urgentLeads ? "red" : "emerald",
      inverseProgress: true,
    },
  ];

  const journeyMetrics = [
    {
      label: "Applications",
      value: intelligence.applicationsCount,
      icon: GraduationCap,
      detail: `${intelligence.offerCount} offers · ${intelligence.casIssuedCount} CAS · ${intelligence.visaApprovedCount} visa approved`,
      progress: intelligence.studentJourneyRate,
      progressLabel: "Journey maturity",
      tone: "blue",
    },
    {
      label: "Document Readiness",
      value: data.documents.length,
      icon: FolderOpen,
      detail: `${intelligence.pendingDocuments} pending · ${intelligence.rejectedDocuments} rejected`,
      progress: intelligence.documentReadyRate,
      progressLabel: "Verified / ready",
      tone:
        intelligence.rejectedDocuments > 0
          ? "red"
          : intelligence.pendingDocuments > 0
          ? "amber"
          : "emerald",
    },
    {
      label: "Task Operations",
      value: intelligence.pendingTasksCount,
      icon: ClipboardCheck,
      detail: `${intelligence.overdueTasks} overdue · ${intelligence.completedTasks} completed`,
      progress: intelligence.taskHealthRate,
      progressLabel: "Completion rate",
      tone: intelligence.overdueTasks ? "red" : "emerald",
    },
    {
      label: "University Planning",
      value: data.universities.length,
      icon: Landmark,
      detail: "Dream / target / safe planning records across students",
      progress: data.universities.length ? 100 : 0,
      progressLabel: "Planning data present",
      tone: data.universities.length ? "orange" : "slate",
    },
  ];

  const operationsMetrics = [
    {
      label: "High-Risk Students",
      value: intelligence.highRiskStudents,
      icon: AlertTriangle,
      detail: `${intelligence.criticalRiskStudents} critical risk cases`,
      tone: intelligence.highRiskStudents ? "red" : "emerald",
    },
    {
      label: "Outstanding Invoices",
      value: intelligence.unpaidInvoicesCount,
      icon: CircleDollarSign,
      detail: `£${formatMoney(
        intelligence.outstandingAmount
      )} estimated outstanding`,
      tone: intelligence.unpaidInvoicesCount ? "amber" : "emerald",
    },
    {
      label: "Receipt Approvals",
      value: intelligence.pendingReceipts,
      icon: ReceiptText,
      detail: `${data.receipts.length} total student receipts`,
      tone: intelligence.pendingReceipts ? "amber" : "emerald",
    },
    {
      label: "Portal Access",
      value: intelligence.activePortalAccounts,
      icon: LockKeyhole,
      detail: `${intelligence.portalResetCount} password changes required`,
      tone: intelligence.portalResetCount ? "amber" : "emerald",
    },
    {
      label: "Support Queue",
      value: intelligence.openSupportRequests,
      icon: Headphones,
      detail: `${intelligence.escalatedSupportRequests} escalated requests`,
      tone: intelligence.escalatedSupportRequests ? "red" : "blue",
    },
    {
      label: "Counselor Payments",
      value: data.counselorPayments.length,
      icon: WalletCards,
      detail: `${intelligence.completedPayments} student payments marked completed`,
      tone: data.counselorPayments.length ? "blue" : "slate",
    },
  ];

  const summarySignals = [
    {
      label: "CRM",
      value: Math.round(
        (intelligence.contactRate +
          intelligence.ownershipRate +
          intelligence.confirmationRate) /
          3
      ),
      tone: getHealthTone(
        Math.round(
          (intelligence.contactRate +
            intelligence.ownershipRate +
            intelligence.confirmationRate) /
            3
        )
      ),
    },
    {
      label: "Student Journey",
      value: Math.round(
        (intelligence.studentJourneyRate +
          intelligence.documentReadyRate +
          intelligence.taskHealthRate) /
          3
      ),
      tone: getHealthTone(
        Math.round(
          (intelligence.studentJourneyRate +
            intelligence.documentReadyRate +
            intelligence.taskHealthRate) /
            3
        )
      ),
    },
    {
      label: "Finance",
      value: intelligence.revenueHealthRate,
      tone: getHealthTone(intelligence.revenueHealthRate),
    },
    {
      label: "Portal",
      value: intelligence.portalActivationRate,
      tone: getHealthTone(intelligence.portalActivationRate),
    },
  ];

  return (
    <section className="mb-6 min-w-0 space-y-4 rounded-[2.2rem] border-[3px] border-[#123865] bg-[#FFF8EF] p-5 shadow-[0_20px_55px_rgba(18,56,101,0.10)]">
      <motion.section
        initial={reduceMotion ? false : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: reduceMotion ? 0 : 0.28 }}
        className="min-w-0 bg-transparent"
      >
        <div className="grid min-w-0 overflow-hidden rounded-[1.75rem] border-[3px] border-[#FF5A0A] xl:grid-cols-[minmax(0,1.25fr)_minmax(18rem,0.75fr)]">
          <div
            className="relative overflow-hidden p-5 text-white sm:p-7"
            style={{ backgroundColor: NAVY }}
          >
            <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full border-[34px] border-white/[0.05]" />

            <div className="relative">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-2 rounded-full border-2 border-white/20 bg-white/10 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.14em] text-white">
                  <LayoutDashboard size={12} />
                  Executive Snapshot
                </span>

                <span className="inline-flex items-center gap-2 rounded-full border-2 border-white/20 bg-white/10 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.14em] text-white">
                  <Activity size={12} />
                  Live Operating Signals
                </span>
              </div>

              <h2 className="mt-4 text-3xl font-black tracking-[-0.03em] text-white sm:text-4xl">
                CRM + Student OS Health
              </h2>

              <p className="mt-3 max-w-3xl text-sm font-semibold leading-6 text-white">
                One operating view across lead conversion, appointments,
                student readiness, risk, finance, portal access and support.
              </p>

              <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
                {summarySignals.map((signal) => (
                  <HealthStrip key={signal.label} {...signal} />
                ))}
              </div>
            </div>
          </div>

          <div className="border-t-[3px] border-white/25 bg-[#FF5A0A] p-5 text-white xl:border-l-[3px] xl:border-t-0 sm:p-7">
            <p className="text-[9px] font-black uppercase tracking-[0.16em] text-white">
              Operating Health
            </p>

            <div className="mt-3 flex items-end gap-2">
              <p className="text-6xl font-black leading-none text-white">
                <AnimatedNumber
                  value={intelligence.executiveHealth}
                  suffix="%"
                />
              </p>
              <span className="pb-1 text-xs font-black uppercase tracking-[0.12em] text-white">
                composite
              </span>
            </div>

            <p className="mt-3 text-xs font-semibold leading-5 text-white">
              Calculated only from operating domains that currently contain
              data, so empty modules do not falsely improve the score.
            </p>

            <div className="mt-5 grid grid-cols-2 gap-2">
              <OrangeHeroMetric
                label="Critical actions"
                value={intelligence.criticalActions}
                Icon={AlertTriangle}
              />
              <OrangeHeroMetric
                label="Active students"
                value={intelligence.activeStudentEstimate}
                Icon={UsersRound}
              />
            </div>
          </div>
        </div>
      </motion.section>

      <div className="grid gap-4 2xl:grid-cols-[1.12fr_0.88fr]">
        <MetricSection
          eyebrow="CRM Command"
          title="Lead & Appointment Health"
          description="Conversion pressure, ownership and consultation readiness."
          icon={Target}
        >
          <div className="grid gap-3 sm:grid-cols-2">
            {crmMetrics.map((stat, index) => (
              <PerformanceCard
                key={stat.label}
                stat={stat}
                index={index}
                reduceMotion={reduceMotion}
              />
            ))}
          </div>

          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <CompactHealth
              label="Appointment completion"
              value={`${intelligence.completionRate}%`}
              detail={`${safeNumber(
                appointmentCompletedCount
              )} completed · ${safeNumber(
                appointmentCancelledCount
              )} cancelled`}
              tone={
                intelligence.completionRate >= 70
                  ? "emerald"
                  : "blue"
              }
            />

            <CompactHealth
              label="Pending appointment pressure"
              value={`${intelligence.pendingAppointmentRate}%`}
              detail={`${safeNumber(
                appointmentPendingCount
              )} appointments still pending`}
              tone={
                intelligence.pendingAppointmentRate > 40
                  ? "amber"
                  : "emerald"
              }
            />
          </div>
        </MetricSection>

        <AttentionCenter
          items={intelligence.attention}
          criticalActions={intelligence.criticalActions}
          reduceMotion={reduceMotion}
        />
      </div>

      <MetricSection
        eyebrow="Student OS"
        title="Journey Readiness"
        description="Applications, documents, tasks and university-planning maturity."
        icon={Sparkles}
      >
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {journeyMetrics.map((stat, index) => (
            <PerformanceCard
              key={stat.label}
              stat={stat}
              index={index}
              reduceMotion={reduceMotion}
            />
          ))}
        </div>
      </MetricSection>

      <MetricSection
        eyebrow="Operations"
        title="Risk, Finance, Access & Support"
        description="Operational queues that can become student, compliance or revenue problems."
        icon={Gauge}
      >
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {operationsMetrics.map((stat, index) => (
            <OperationalCard
              key={stat.label}
              stat={stat}
              index={index}
              reduceMotion={reduceMotion}
            />
          ))}
        </div>
      </MetricSection>
    </section>
  );
}

function MetricSection({
  eyebrow,
  title,
  description,
  icon: Icon,
  children,
}) {
  return (
    <section className="min-w-0 overflow-hidden rounded-[1.9rem] border-[3px] border-[#C9D7E6] bg-[#FFF8EF] shadow-[0_16px_40px_rgba(15,35,63,0.09)]">
      <div
        className="flex min-w-0 items-start gap-3 border-b-[3px] border-[#FF5A0A] px-5 py-4 text-white sm:px-6"
        style={{ backgroundColor: NAVY }}
      >
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border-2 border-orange-300 bg-white/10 text-white">
          <Icon size={18} />
        </div>

        <div>
          <p className="text-[9px] font-black uppercase tracking-[0.16em] text-orange-200">
            {eyebrow}
          </p>
          <h3 className="mt-1 text-xl font-black tracking-tight text-white sm:text-2xl">
            {title}
          </h3>
          <p className="mt-1 text-sm font-semibold leading-6 text-white">
            {description}
          </p>
        </div>
      </div>

      <div className="p-4 sm:p-5">{children}</div>
    </section>
  );
}

function PerformanceCard({
  stat,
  index,
  reduceMotion,
}) {
  const Icon = stat.icon;
  const tone = getTone(stat.tone);
  const progress = clamp(stat.progress);

  return (
    <motion.article
      initial={reduceMotion ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: reduceMotion ? 0 : 0.24,
        delay: reduceMotion ? 0 : Math.min(index * 0.025, 0.1),
      }}
      className="min-w-0 rounded-[1.4rem] border-2 border-[#C9D7E6] bg-white p-4 text-[#10233F] shadow-[0_8px_20px_rgba(15,35,63,0.05)] transition hover:-translate-y-0.5 hover:border-[#FF5A0A] hover:shadow-[0_12px_26px_rgba(15,35,63,0.09)]"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[9px] font-black uppercase tracking-[0.12em] text-slate-500">
            {stat.label}
          </p>

          <p className="mt-2 text-4xl font-black leading-none text-[#10233F]">
            <AnimatedNumber value={stat.value} />
          </p>
        </div>

        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border-2 ${tone.icon}`}
        >
          <Icon size={18} />
        </div>
      </div>

      <p className="mt-3 min-h-[40px] text-xs font-semibold leading-5 text-slate-600">
        {stat.detail}
      </p>

      <div className="mt-4">
        <div className="mb-1.5 flex items-center justify-between text-[9px] font-black text-slate-500">
          <span>{stat.progressLabel}</span>
          <span>{progress}%</span>
        </div>

        <div className="h-2 overflow-hidden rounded-full border border-slate-200 bg-slate-100">
          <motion.div
            initial={reduceMotion ? false : { width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{
              duration: reduceMotion ? 0 : 0.6,
              delay: reduceMotion ? 0 : 0.06,
            }}
            className={`h-full rounded-full ${tone.bar}`}
          />
        </div>
      </div>
    </motion.article>
  );
}

function OperationalCard({
  stat,
  index,
  reduceMotion,
}) {
  const Icon = stat.icon;
  const tone = getTone(stat.tone);

  return (
    <motion.article
      initial={reduceMotion ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: reduceMotion ? 0 : 0.22,
        delay: reduceMotion ? 0 : Math.min(index * 0.02, 0.08),
      }}
      className={`min-w-0 rounded-[1.35rem] border-2 border-[#C9D7E6] bg-white p-4 text-[#10233F] shadow-[0_7px_18px_rgba(15,35,63,0.045)] transition hover:-translate-y-0.5 hover:border-[#FF5A0A] ${tone.card}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[9px] font-black uppercase tracking-[0.12em] text-slate-500">
            {stat.label}
          </p>
          <p className="mt-1.5 text-3xl font-black text-[#10233F]">
            <AnimatedNumber value={stat.value} />
          </p>
        </div>

        <div
          className={`flex h-9 w-9 items-center justify-center rounded-xl border-2 ${tone.icon}`}
        >
          <Icon size={16} />
        </div>
      </div>

      <p className="mt-3 text-xs font-semibold leading-5 text-slate-600">
        {stat.detail}
      </p>
    </motion.article>
  );
}

function CompactHealth({
  label,
  value,
  detail,
  tone = "blue",
}) {
  const toneConfig = getTone(tone);

  return (
    <div className="min-w-0 rounded-[1.2rem] border-2 border-[#C9D7E6] bg-white p-4 text-[#10233F] shadow-[0_7px_18px_rgba(15,35,63,0.045)]">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[9px] font-black uppercase tracking-[0.12em] text-slate-500">
          {label}
        </p>
        <span
          className={`h-2.5 w-2.5 rounded-full ${toneConfig.dot}`}
        />
      </div>

      <p className="mt-2 text-2xl font-black text-[#10233F]">{value}</p>
      <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">
        {detail}
      </p>
    </div>
  );
}

function AttentionCenter({
  items,
  criticalActions,
  reduceMotion,
}) {
  return (
    <section className="min-w-0 rounded-[1.9rem] border-[3px] border-[#FF5A0A] bg-[#FFF8EF] p-5 shadow-[0_12px_30px_rgba(15,35,63,0.07)] sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-[9px] font-black uppercase tracking-[0.16em] text-[#B84F0E]">
            Priority Center
          </p>
          <h3 className="mt-1 text-2xl font-black text-[#10233F]">
            Operational Attention
          </h3>
          <p className="mt-1 text-sm font-semibold leading-6 text-slate-600">
            Real queues requiring staff action before they become larger
            student or revenue problems.
          </p>
        </div>

        <div
          className={`flex min-w-[92px] items-center justify-center rounded-[1.15rem] border-[3px] px-4 py-3 ${
            criticalActions
              ? "border-red-300 bg-red-50 text-red-700"
              : "border-emerald-300 bg-emerald-50 text-emerald-700"
          }`}
        >
          <div className="text-center">
            <p className="text-2xl font-black">
              <AnimatedNumber value={criticalActions} />
            </p>
            <p className="text-[8px] font-black uppercase tracking-[0.1em]">
              Actions
            </p>
          </div>
        </div>
      </div>

      <div className="mt-5">
        {items.length ? (
          <div className="grid gap-2">
            <AnimatePresence initial={false}>
              {items.slice(0, 8).map((item, index) => (
                <AttentionRow
                  key={item.id}
                  item={item}
                  index={index}
                  reduceMotion={reduceMotion}
                />
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <div className="rounded-[1.3rem] border-[3px] border-emerald-300 bg-emerald-50 p-5">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border-2 border-emerald-300 bg-white text-emerald-700">
                <CheckCircle2 size={18} />
              </div>
              <div>
                <p className="font-black text-emerald-900">
                  No critical queue detected
                </p>
                <p className="mt-1 text-xs font-semibold leading-5 text-emerald-800">
                  Current loaded data has no urgent ownership, risk, overdue,
                  rejected-document, receipt, support or portal-reset signals.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function AttentionRow({
  item,
  index,
  reduceMotion,
}) {
  const Icon = item.Icon;
  const tone = getLightTone(item.tone);

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, x: 8 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0 }}
      transition={{
        duration: reduceMotion ? 0 : 0.2,
        delay: reduceMotion ? 0 : Math.min(index * 0.02, 0.08),
      }}
      className={`flex items-center gap-3 rounded-[1.15rem] border-2 p-3 ${tone.card}`}
    >
      <div
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border-2 ${tone.icon}`}
      >
        <Icon size={15} />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-xs font-black text-[#10233F]">
            {item.label}
          </p>
          <span className={`rounded-full px-2 py-0.5 text-[9px] font-black ${tone.badge}`}>
            {item.value}
          </span>
        </div>
        <p className="mt-1 text-[11px] font-semibold leading-4 text-slate-600">
          {item.detail}
        </p>
      </div>

      <ArrowRight size={15} className="shrink-0 text-slate-400" />
    </motion.div>
  );
}

function HealthStrip({
  label,
  value,
  tone,
}) {
  const toneConfig = getTone(tone);

  return (
    <div className="rounded-[1.25rem] border-2 border-white/25 bg-white/[0.12] p-3 text-white shadow-inner">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[8px] font-black uppercase tracking-[0.1em] text-white">
          {label}
        </p>
        <span className={`h-2 w-2 rounded-full ${toneConfig.dot}`} />
      </div>
      <p className="mt-1 text-xl font-black text-white">
        {clamp(value)}%
      </p>
    </div>
  );
}

function OrangeHeroMetric({
  label,
  value,
  Icon,
}) {
  return (
    <div className="rounded-[1.25rem] border-2 border-white/30 bg-white/[0.12] p-3 text-white shadow-inner">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[8px] font-black uppercase tracking-[0.1em] text-white">
          {label}
        </p>
        <Icon size={14} />
      </div>
      <p className="mt-1 text-2xl font-black text-white">
        <AnimatedNumber value={value} />
      </p>
    </div>
  );
}

function getTone(tone = "slate") {
  const tones = {
    orange: {
      icon: "border-orange-300 bg-orange-50 text-[#B84F0E]",
      bar: "bg-orange-500",
      dot: "bg-orange-400",
      card: "border-l-[5px] border-l-orange-400",
    },
    blue: {
      icon: "border-blue-300 bg-blue-50 text-blue-700",
      bar: "bg-blue-400",
      dot: "bg-blue-300",
      card: "border-l-[5px] border-l-blue-300",
    },
    emerald: {
      icon: "border-emerald-300 bg-emerald-50 text-emerald-700",
      bar: "bg-emerald-400",
      dot: "bg-emerald-300",
      card: "border-l-[5px] border-l-emerald-300",
    },
    amber: {
      icon: "border-amber-300 bg-amber-50 text-amber-800",
      bar: "bg-amber-400",
      dot: "bg-amber-300",
      card: "border-l-[5px] border-l-amber-300",
    },
    red: {
      icon: "border-red-300 bg-red-50 text-red-700",
      bar: "bg-red-400",
      dot: "bg-red-300",
      card: "border-l-[5px] border-l-red-300",
    },
    slate: {
      icon: "border-slate-300 bg-slate-50 text-slate-700",
      bar: "bg-slate-400",
      dot: "bg-slate-300",
      card: "border-l-[5px] border-l-slate-300",
    },
  };

  return tones[tone] || tones.slate;
}

function getLightTone(tone = "slate") {
  const tones = {
    red: {
      card: "border-red-300 bg-red-50",
      icon: "border-red-300 bg-white text-red-700",
      badge: "bg-red-600 text-white",
    },
    amber: {
      card: "border-amber-300 bg-amber-50",
      icon: "border-amber-300 bg-white text-amber-800",
      badge: "bg-amber-500 text-[#10233F]",
    },
    emerald: {
      card: "border-emerald-300 bg-emerald-50",
      icon: "border-emerald-300 bg-white text-emerald-700",
      badge: "bg-emerald-600 text-white",
    },
    blue: {
      card: "border-blue-300 bg-blue-50",
      icon: "border-blue-300 bg-white text-blue-700",
      badge: "bg-blue-600 text-white",
    },
    slate: {
      card: "border-slate-300 bg-white",
      icon: "border-slate-300 bg-slate-50 text-slate-700",
      badge: "bg-slate-700 text-white",
    },
  };

  return tones[tone] || tones.slate;
}

export default AdminStats;
