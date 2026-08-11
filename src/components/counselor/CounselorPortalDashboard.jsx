// CounselorPortalDashboard FINANCE + VISA OS INTEGRATION V3 — Premium Workspace Launcher
// Full replacement for: src/components/counselor/CounselorPortalDashboard.jsx

import React, { lazy, Suspense, useCallback, useEffect, useMemo, useState } from "react";
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  University,
  FolderOpen,
  Stamp,
  WalletCards,
  ListTodo,
  LifeBuoy,
  MessageSquareText,
  CalendarDays,
  Gauge,
  ChartColumn,
} from "lucide-react";
const AssignedStudentsWorkspace = lazy(() => import("./AssignedStudentsWorkspace"));
const CounselorApplicationsWorkspace = lazy(() => import("./CounselorApplicationsWorkspace"));
const CounselorDocumentsWorkspace = lazy(() => import("./CounselorDocumentsWorkspace"));
const CounselorVisaWorkspace = lazy(() => import("./CounselorVisaWorkspace"));
const CounselorFinanceWorkspace = lazy(() => import("./CounselorFinanceWorkspace"));
const CounselorTasksWorkspace = lazy(() => import("./CounselorTasksWorkspace"));
const CounselorUniversitiesWorkspace = lazy(() => import("./CounselorUniversitiesWorkspace"));
const CounselorWorkloadPanel = lazy(() => import("./CounselorWorkloadPanel"));
const CounselorSupportWorkspace = lazy(() => import("./CounselorSupportWorkspace"));
const CounselorCommunicationHub = lazy(() => import("./CounselorCommunicationHub"));
const CounselorAppointmentsWorkspace = lazy(() => import("./CounselorAppointmentsWorkspace"));
import { buildCounselorNavigation, buildPriorityStudentQueue, formatRelativeTime } from "../../lib/counselorPortal";

const COUNSELOR_VIEW_STORAGE_KEY = "zaifan_counselor_active_view";
const COUNSELOR_NAV_SCROLL_KEY = "zaifan_counselor_nav_scroll";

const VIEW_META = {
  overview: {
    eyebrow: "Counselor Command Center",
    title: "Operational Overview",
    description: "Priority students, workload pressure, support, communication and appointments in one working view.",
  },
  students: {
    eyebrow: "Student Portfolio",
    title: "Assigned Students",
    description: "Move assigned students forward using risk, opportunity, next-action and journey context.",
  },
  applications: {
    eyebrow: "Application OS",
    title: "Application Pipeline",
    description: "Track application pressure, submissions, decisions, Universitaly pre-enrolment and counselor follow-up.",
  },
  universities: {
    eyebrow: "University Workspace",
    title: "University Planning",
    description: "Review university choices and student-fit context across the assigned portfolio.",
  },
  documents: {
    eyebrow: "Document OS",
    title: "Document Readiness",
    description: "Prioritize missing, rejected, pending and visa-sensitive document work.",
  },
  visa: {
    eyebrow: "Visa OS",
    title: "Visa Operations",
    description: "Track assigned Visa readiness, appointments, embassy movement, requirements, risk, decisions and counselor follow-up.",
  },
  finance: {
    eyebrow: "Finance OS",
    title: "Finance Operations",
    description: "Review assigned-student invoices, payment pressure, receipts, verified destinations and finance follow-up without changing Admin financial authority.",
  },
  tasks: {
    eyebrow: "Task Operations",
    title: "Counselor Task Queue",
    description: "Control overdue, urgent and upcoming work without losing student context.",
  },
  support: {
    eyebrow: "Support Operations",
    title: "Student Support Queue",
    description: "Resolve assigned student support pressure and preserve a clear service trail.",
  },
  communications: {
    eyebrow: "Communication OS",
    title: "Communication History",
    description: "Log and review counselor-student communication across the assigned scope.",
  },
  appointments: {
    eyebrow: "Appointment OS",
    title: "Appointments & Outcomes",
    description: "Prepare sessions, record outcomes and convert meetings into clear next actions.",
  },
  workload: {
    eyebrow: "Workload Intelligence",
    title: "Counselor Workload",
    description: "Understand portfolio pressure, risk concentration and recommended operational focus.",
  },
  analytics: {
    eyebrow: "Performance Intelligence",
    title: "Counselor Analytics",
    description: "Measure activation, conversion, task completion, communication coverage and journey progress.",
  },
};

const WORKSPACE_NAV_META = {
  overview: {
    icon: LayoutDashboard,
    accent: "border-slate-300 bg-slate-50 text-[#123865]",
    iconBg: "border-slate-200 bg-slate-100 text-[#123865]",
  },
  students: {
    icon: Users,
    accent: "border-sky-300 bg-sky-50 text-sky-700",
    iconBg: "border-sky-200 bg-sky-100 text-sky-700",
  },
  applications: {
    icon: GraduationCap,
    accent: "border-emerald-300 bg-emerald-50 text-emerald-700",
    iconBg: "border-emerald-200 bg-emerald-100 text-emerald-700",
  },
  universities: {
    icon: University,
    accent: "border-violet-300 bg-violet-50 text-violet-700",
    iconBg: "border-violet-200 bg-violet-100 text-violet-700",
  },
  documents: {
    icon: FolderOpen,
    accent: "border-orange-300 bg-orange-50 text-orange-700",
    iconBg: "border-orange-200 bg-orange-100 text-orange-700",
  },
  visa: {
    icon: Stamp,
    accent: "border-indigo-300 bg-indigo-50 text-indigo-700",
    iconBg: "border-indigo-200 bg-indigo-100 text-indigo-700",
  },
  finance: {
    icon: WalletCards,
    accent: "border-emerald-300 bg-emerald-50 text-emerald-700",
    iconBg: "border-emerald-200 bg-emerald-100 text-emerald-700",
  },
  tasks: {
    icon: ListTodo,
    accent: "border-orange-300 bg-orange-50 text-orange-700",
    iconBg: "border-orange-200 bg-orange-100 text-orange-700",
  },
  support: {
    icon: LifeBuoy,
    accent: "border-rose-300 bg-rose-50 text-rose-700",
    iconBg: "border-rose-200 bg-rose-100 text-rose-700",
  },
  communications: {
    icon: MessageSquareText,
    accent: "border-pink-300 bg-pink-50 text-pink-700",
    iconBg: "border-pink-200 bg-pink-100 text-pink-700",
  },
  appointments: {
    icon: CalendarDays,
    accent: "border-sky-300 bg-sky-50 text-sky-700",
    iconBg: "border-sky-200 bg-sky-100 text-sky-700",
  },
  workload: {
    icon: Gauge,
    accent: "border-amber-300 bg-amber-50 text-amber-700",
    iconBg: "border-amber-200 bg-amber-100 text-amber-700",
  },
  analytics: {
    icon: ChartColumn,
    accent: "border-violet-300 bg-violet-50 text-violet-700",
    iconBg: "border-violet-200 bg-violet-100 text-violet-700",
  },
};

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

function safeNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function formatPercent(value) {
  return `${Math.max(0, Math.min(100, safeNumber(value)))}%`;
}

function safeString(value, fallback = "") {
  if (value === null || value === undefined) return fallback;
  return String(value);
}

function lower(value) {
  return safeString(value).toLowerCase();
}

function readSessionValue(key, fallback = "") {
  if (typeof window === "undefined") return fallback;

  try {
    return window.sessionStorage.getItem(key) || fallback;
  } catch {
    return fallback;
  }
}

function writeSessionValue(key, value) {
  if (typeof window === "undefined") return;

  try {
    window.sessionStorage.setItem(key, value);
  } catch {
    // Portal navigation persistence is optional and must never break the OS.
  }
}

function derivePortalHealth({ metrics = {}, performance = {}, workload = {}, snapshot = {} }) {
  const assigned = safeNumber(metrics.assignedStudents);
  const atRisk = safeNumber(metrics.atRiskStudents);
  const overdue = safeNumber(metrics.overdueTasks);
  const support = safeNumber(metrics.supportQueue);
  const documents = safeArray(snapshot.documents);

  const documentPressure = documents.filter((item) => {
    const status = lower(item.status || item.document_status);
    return (
      status.includes("missing") ||
      status.includes("reject") ||
      status.includes("expired") ||
      status.includes("invalid")
    );
  }).length;

  let score = 100;
  if (assigned > 0) score -= Math.min(30, Math.round((atRisk / assigned) * 30));
  score -= Math.min(20, overdue * 2);
  score -= Math.min(15, support);
  score -= Math.min(15, documentPressure * 2);

  const conversion = safeNumber(performance.conversionRate);
  if (conversion >= 50) score += 5;

  score = Math.max(0, Math.min(100, score));

  return {
    score,
    documentPressure,
    label:
      score >= 85
        ? "Healthy"
        : score >= 65
        ? "Watch"
        : score >= 45
        ? "Under Pressure"
        : "Recovery Required",
    focus: workload?.recommendedFocus || "Student movement",
  };
}

function MetricCard({ label, value, helper, tone = "slate", onClick, active = false }) {
  const tones = {
    slate: "border-[#c7d4df] bg-[#f5f8fb]",
    cyan: "border-sky-300 bg-sky-50",
    rose: "border-rose-300 bg-rose-50",
    emerald: "border-emerald-300 bg-emerald-50",
    amber: "border-amber-300 bg-amber-50",
    violet: "border-violet-300 bg-violet-50",
  };

  const Component = onClick ? "button" : "div";

  return (
    <Component
      type={onClick ? "button" : undefined}
      onClick={onClick}
      className={`rounded-[1.15rem] border-2 p-3 text-left shadow-sm transition duration-300 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-orange-100 ${
        tones[tone] || tones.slate
      } ${onClick ? "hover:-translate-y-0.5 hover:border-orange-400 hover:bg-orange-50/70 hover:shadow-md" : ""} ${
        active ? "ring-2 ring-orange-300" : ""
      }`}
    >
      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#5B6D80]">
        {label}
      </p>
      <div className="mt-2 flex items-end justify-between gap-3">
        <p className="text-2xl font-black tracking-tight text-[#10233F]">{value}</p>
        {helper ? (
          <p className="max-w-[120px] text-right text-xs font-semibold leading-5 text-[#5B6D80]">
            {helper}
          </p>
        ) : null}
      </div>
    </Component>
  );
}



function AnalyticsStat({
  label,
  value,
  helper,
  tone = "slate",
}) {
  const tones = {
    slate: "border-[#c7d4df] bg-[#f5f8fb]",
    cyan: "border-sky-300 bg-sky-50",
    rose: "border-rose-300 bg-rose-50",
    emerald: "border-emerald-300 bg-emerald-50",
    amber: "border-amber-300 bg-amber-50",
    violet: "border-violet-300 bg-violet-50",
  };

  return (
    <div
      className={`min-w-0 rounded-[1.2rem] border-2 p-4 shadow-sm ${
        tones[tone] || tones.slate
      }`}
    >
      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#5B6D80]">
        {label}
      </p>
      <p className="mt-2 break-words text-2xl font-black tracking-tight text-[#10233F]">
        {value}
      </p>
      {helper ? (
        <p className="mt-1 text-xs font-semibold leading-5 text-[#5B6D80]">
          {helper}
        </p>
      ) : null}
    </div>
  );
}

// Backward-safe alias in case an older local Dashboard render still references
// the plural component name.
const AnalyticsStats = AnalyticsStat;

function AnalyticsProgress({
  label,
  value = 0,
  detail,
  tone = "cyan",
}) {
  const numericValue = Math.max(0, Math.min(100, safeNumber(value)));
  const bars = {
    cyan: "bg-sky-500",
    rose: "bg-rose-500",
    emerald: "bg-emerald-500",
    amber: "bg-amber-500",
    violet: "bg-violet-500",
  };

  return (
    <div className="rounded-[1.15rem] border-2 border-[#c7d4df] bg-[#FFFCF7] p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-black text-[#10233F]">{label}</p>
        <span className="rounded-full border border-[#D8B07B] bg-white px-2 py-1 text-[10px] font-black text-[#10233F]">
          {numericValue}%
        </span>
      </div>

      <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-[#e7edf2]">
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            bars[tone] || bars.cyan
          }`}
          style={{ width: `${numericValue}%` }}
        />
      </div>

      {detail ? (
        <p className="mt-2 text-xs font-semibold leading-5 text-[#5B6D80]">
          {detail}
        </p>
      ) : null}
    </div>
  );
}


function CounselorModuleLoader() {
  return (
    <div role="status" aria-live="polite" className="flex min-h-[360px] items-center justify-center rounded-[2rem] border-2 border-[#D8B07B] bg-[#FFFCF7] shadow-sm">
      <div className="text-center">
        <div className="mx-auto h-10 w-10 animate-spin rounded-full border-[3px] border-orange-100 border-t-orange-500" />
        <p className="mt-4 text-sm font-black text-[#10233F]">
          Opening Counselor Workspace
        </p>
        <p className="mt-1 text-xs text-[#7d8d9a]">
          Loading only the operational module you selected.
        </p>
      </div>
    </div>
  );
}

function EmptyState({ title, message, action, onAction, detail }) {
  return (
    <div className="rounded-3xl border-2 border-dashed border-[#D8B07B] bg-[#FFFCF7] p-8 text-center shadow-sm">
      <h3 className="text-lg font-black text-[#10233F]">{title}</h3>
      <p className="mx-auto mt-2 max-w-2xl text-sm text-[#5B6D80]">{message}</p>
      {detail ? (
        <p className="mx-auto mt-3 max-w-2xl rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-700">
          {detail}
        </p>
      ) : null}
      {action ? (
        <button
          type="button"
          onClick={onAction}
          className="mt-5 rounded-2xl border border-[#ef9b45] bg-[#fff1dc] px-5 py-3 text-sm font-bold text-orange-700 hover:bg-orange-100"
        >
          {action}
        </button>
      ) : null}
    </div>
  );
}

function CommandStrip({ workload, performance, executiveBrief, onJump }) {
  const actions = executiveBrief?.recommendedActions || [];
  const actionList = (actions.length
    ? actions
    : ["Review assigned students.", "Clear support pressure.", "Protect the next application movement."]
  ).slice(0, 3);

  return (
    <div className="mb-4 grid gap-3 xl:grid-cols-[minmax(0,1.25fr)_minmax(360px,0.75fr)]">
      <div className="overflow-hidden rounded-[1.55rem] border-2 border-[#123865] bg-[#123865] shadow-[0_12px_30px_rgba(16,43,76,0.14)]">
        <div className="border-b-2 border-orange-500 px-5 py-4">
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-orange-300">
            Today’s Counselor Focus
          </p>
          <h3 className="mt-2 text-xl font-black tracking-tight text-white sm:text-2xl">
            {executiveBrief?.headline || "Keep the assigned portfolio moving"}
          </h3>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-white/75">
            {workload?.executiveSummary || "Use assigned-student pressure, support and application movement to choose the next action."}
          </p>
        </div>

        <div className="grid gap-2 p-3 sm:grid-cols-3">
          {actionList.map((item, index) => (
            <div
              key={`${item}-${index}`}
              className="rounded-xl border border-white/15 bg-white/10 px-3 py-3 text-xs font-bold leading-5 text-white"
            >
              <span className="mr-2 text-orange-300">0{index + 1}</span>
              {item}
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <button type="button" onClick={() => onJump("analytics")} className="rounded-[1.35rem] border-2 border-violet-300 bg-violet-50 p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-violet-700">Performance</p>
          <p className="mt-2 text-2xl font-black text-[#10233F]">{performance?.performanceGrade || "—"}</p>
          <p className="mt-1 text-xs font-semibold text-[#5B6D80]">{performance?.conversionRate || 0}% conversion</p>
        </button>
        <button type="button" onClick={() => onJump("workload")} className="rounded-[1.35rem] border-2 border-orange-300 bg-orange-50 p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-orange-700">Workload</p>
          <p className="mt-2 text-2xl font-black text-[#10233F]">{workload?.pressureLabel || "Healthy"}</p>
          <p className="mt-1 text-xs font-semibold text-[#5B6D80]">Open workload intelligence</p>
        </button>
      </div>
    </div>
  );
}

function CounselorAnalyticsPanel({ performance, workload, executiveBrief, snapshot }) {
  const derived = useMemo(() => {
    const students = safeArray(snapshot?.students);
    const applications = safeArray(snapshot?.applications);
    const tasks = safeArray(snapshot?.tasks);
    const documents = safeArray(snapshot?.documents);
    const support = safeArray(snapshot?.support);
    const appointments = safeArray(snapshot?.appointments);
    const communications = safeArray(snapshot?.communications);

    const completedTasks = tasks.filter((task) => String(task.status || "").toLowerCase().includes("complete")).length;
    const openTasks = tasks.length - completedTasks;
    const criticalDocuments = documents.filter((doc) => {
      const status = String(doc.status || doc.document_status || "").toLowerCase();
      return status.includes("missing") || status.includes("rejected") || status.includes("expired");
    }).length;

    return {
      students: students.length,
      applications: applications.length,
      tasks: tasks.length,
      completedTasks,
      openTasks,
      documents: documents.length,
      criticalDocuments,
      support: support.length,
      appointments: appointments.length,
      communications: communications.length,
    };
  }, [snapshot]);

  const taskCompletion = derived.tasks ? Math.round((derived.completedTasks / derived.tasks) * 100) : 0;
  const supportLoad = derived.students ? Math.round((derived.support / derived.students) * 100) : 0;
  const communicationCoverage = derived.students ? Math.min(100, Math.round((derived.communications / derived.students) * 100)) : 0;

  return (
    <section className="overflow-hidden rounded-[2.25rem] border-[4px] border-[#123865] bg-[#FFF8EF] p-2.5 shadow-[0_28px_80px_rgba(16,35,63,0.16)] sm:p-4">
      <div className="relative mb-5 overflow-hidden rounded-[1.8rem] border-[3px] border-[#FF5A0A] bg-[#123865] p-4 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08),0_16px_36px_rgba(16,35,63,0.20)] xl:flex xl:items-start xl:justify-between xl:gap-5 sm:p-5">
        <div aria-hidden="true" className="pointer-events-none absolute -right-14 -top-20 h-52 w-52 rounded-full border-[26px] border-white/5" />
        <div aria-hidden="true" className="pointer-events-none absolute -bottom-24 right-20 h-44 w-44 rounded-full border-[22px] border-orange-400/10" />

        <div className="relative z-[1]">
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-orange-300">
            Performance Intelligence
          </p>
          <h2 className="mt-2 text-2xl font-black tracking-tight text-white sm:text-3xl">
            Counselor Analytics
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-blue-100">
            Activation, conversion, visa movement, task completion, communication coverage and operating pressure in one counselor view.
          </p>
        </div>

        <div className="relative z-[1] flex flex-wrap gap-2">
          <span className="rounded-xl border-2 border-white/20 bg-white/10 px-4 py-2 text-sm font-black text-white">
            {derived.students} students
          </span>
          <span className="rounded-xl border-2 border-orange-300/70 bg-orange-400/15 px-4 py-2 text-sm font-black text-orange-300">
            Grade {performance?.performanceGrade || "Pending"}
          </span>
        </div>
      </div>

      <div className="space-y-6">

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <AnalyticsStat label="Activation" value={formatPercent(performance?.activationRate)} helper="students beyond not-started stage" tone="cyan" />
        <AnalyticsStat label="Conversion" value={formatPercent(performance?.conversionRate)} helper="offer-stage or beyond" tone="emerald" />
        <AnalyticsStat label="Visa Progress" value={formatPercent(performance?.visaProgressRate)} helper="visa-stage movement" tone="violet" />
        <AnalyticsStat label="Avg Velocity" value={performance?.avgVelocity || 0} helper="average journey movement" tone="amber" />
        <AnalyticsStat label="Offers Received" value={performance?.offersReceived || 0} helper="offer wins generated" tone="emerald" />
        <AnalyticsStat label="Offers Accepted" value={performance?.offersAccepted || 0} helper="accepted/confirmed offers" tone="violet" />
        <AnalyticsStat label="Pre-enrolment Validated" value={performance?.casIssued || 0} helper="late-stage Italy progress" tone="amber" />
        <AnalyticsStat label="Risk Load" value={workload?.atRiskStudents || 0} helper="students needing recovery" tone="rose" />
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-3xl border-2 border-orange-300 bg-orange-50/70 p-5 shadow-sm">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-orange-700">Performance Movement</p>
          <h3 className="mt-1 text-xl font-black text-[#10233F]">Counselor conversion funnel</h3>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <AnalyticsProgress label="Activation Rate" value={performance?.activationRate || 0} detail="Assigned students with meaningful stage movement." tone="cyan" />
            <AnalyticsProgress label="Conversion Rate" value={performance?.conversionRate || 0} detail="Students moved to offer-stage or later." tone="emerald" />
            <AnalyticsProgress label="Visa Progress" value={performance?.visaProgressRate || 0} detail="Students progressed into visa-stage or beyond." tone="violet" />
            <AnalyticsProgress label="Task Completion" value={taskCompletion} detail={`${derived.completedTasks} completed from ${derived.tasks} tracked tasks.`} tone="amber" />
          </div>
        </div>

        <div className="rounded-3xl border-2 border-violet-300 bg-violet-50/70 p-5 shadow-sm">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-violet-700">Operational Analytics</p>
          <h3 className="mt-1 text-xl font-black text-[#10233F]">Pressure and quality signals</h3>
          <div className="mt-5 grid gap-3">
            <AnalyticsProgress label="Support Load" value={supportLoad} detail={`${derived.support} support item(s) across ${derived.students} assigned student(s).`} tone="rose" />
            <AnalyticsProgress label="Communication Coverage" value={communicationCoverage} detail={`${derived.communications} communication record(s) across assigned scope.`} tone="cyan" />
            <AnalyticsStat label="Critical Documents" value={derived.criticalDocuments} helper="missing/rejected/expired documents" tone={derived.criticalDocuments ? "rose" : "emerald"} />
            <AnalyticsStat label="Open Tasks" value={derived.openTasks} helper="remaining task pressure" tone={derived.openTasks > 10 ? "rose" : "amber"} />
          </div>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <div className="rounded-3xl border-2 border-[#10233F] bg-[#F1F6FA] p-5 shadow-sm">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-[#10233F]">Executive Analytics Summary</p>
          <p className="mt-3 text-sm leading-6 text-[#4b6072]">
            {executiveBrief?.headline || "Counselor analytics are ready."}
          </p>
          <p className="mt-3 text-xs font-black uppercase tracking-[0.18em] text-orange-600">
            Focus: {executiveBrief?.focus || workload?.recommendedFocus || "Pipeline nurturing"}
          </p>
        </div>

        <div className="rounded-3xl border-2 border-emerald-300 bg-emerald-50 p-5 shadow-sm">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-700">Analytics Recommendation</p>
          <p className="mt-3 text-sm leading-6 text-[#4b6072]">
            {(executiveBrief?.recommendedActions || [])[0] ||
              "Use analytics to improve activation, reduce open task pressure, and push conversion-ready students forward."}
          </p>
        </div>
      </div>
      </div>
    </section>
  );
}

function StudentCommandDrawer({ student, onClose, onJump }) {
  useEffect(() => {
    if (!student || typeof document === "undefined") return undefined;

    const previousOverflow = document.body.style.overflow;
    const handleKeyDown = (event) => {
      if (event.key === "Escape") onClose();
    };

    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [student, onClose]);

  if (!student) return null;

  const riskScore = Math.max(0, Math.min(100, safeNumber(student.riskScore)));
  const opportunityScore = Math.max(0, Math.min(100, safeNumber(student.opportunityScore)));
  const pressureLabel =
    riskScore >= 70 ? "High recovery pressure" : riskScore >= 40 ? "Monitor closely" : "Stable";

  return (
    <div className="fixed inset-0 z-[80] bg-[#0f2438]/45 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="Student command drawer">
      <button type="button" aria-label="Close drawer" className="absolute inset-0 cursor-default" onClick={onClose} />
      <aside className="absolute right-0 top-0 h-full w-full max-w-xl overflow-y-auto border-l-4 border-[#10233F] bg-[#fff8ec] p-5 text-[#10233F] shadow-2xl sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.25em] text-orange-600">Student Command Drawer</p>
            <h2 className="mt-2 text-3xl font-black">{student.name}</h2>
            <p className="mt-1 text-sm text-[#5B6D80]">{student.email || "No email"} · {student.phone || "No phone"}</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-2xl border-2 border-[#10233F] bg-[#10233F] px-4 py-2 text-sm font-black text-white hover:bg-[#244966] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f28c28]">
            Close
          </button>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-[#ef9b45] bg-[#fff1dc] p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-orange-700">Stage</p>
            <p className="mt-1 font-black">{student.stage}</p>
          </div>
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-rose-700">Risk</p>
            <p className="mt-1 font-black">{student.riskScore}</p>
          </div>
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-emerald-700">Opportunity</p>
            <p className="mt-1 font-black">{student.opportunityScore}</p>
          </div>
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-amber-700">Open Work</p>
            <p className="mt-1 font-black">{student.openTasks || 0} tasks</p>
          </div>
        </div>

        <div className="mt-6 rounded-3xl border-2 border-[#10233F] bg-[#10233F] p-5 text-white shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-white/70">Student Pressure</p>
            <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-black text-white">
              {pressureLabel}
            </span>
          </div>
          <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-white/15">
            <div
              className="h-full rounded-full bg-orange-400 transition-[width] duration-500"
              style={{ width: `${riskScore}%` }}
            />
          </div>
          <p className="mt-2 text-xs text-white/70">
            Risk {riskScore}% · Opportunity {opportunityScore}%
          </p>
        </div>

        <div className="mt-4 rounded-3xl border border-[#D8B07B] bg-[#FFFCF7] shadow-sm p-5">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#5B6D80]">Next Best Action</p>
          <p className="mt-2 text-sm font-semibold text-[#10233F]">{student.nextBestAction}</p>
          <p className="mt-2 text-xs text-[#5B6D80]">Last activity {formatRelativeTime(student.lastActivityAt || student.updated_at || student.created_at)}</p>
        </div>

        <div className="mt-6 grid gap-3">
          {[
            ["applications", `${student.applicationsCount || 0} applications`],
            ["universities", `${student.universitiesCount || 0} universities`],
            ["documents", `${student.documentsCount || 0} documents`],
            ["visa", "Open Visa command"],
            ["tasks", `${student.openTasks || 0} open tasks`],
            ["support", `${student.openSupport || 0} support items`],
            ["communications", `${student.communicationsCount || 0} communications`],
          ].map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => {
                onJump(key);
                onClose();
              }}
              className="flex items-center justify-between rounded-2xl border border-[#D8B07B] bg-[#FFFCF7] px-4 py-3 shadow-sm text-left text-sm font-bold text-[#355068] hover:border-orange-300 hover:bg-orange-50/70"
            >
              <span className="capitalize">{key}</span>
              <span className="text-[#5B6D80]">{label}</span>
            </button>
          ))}
        </div>
      </aside>
    </div>
  );
}


function CounselorOverviewCommandCenter({
  studentQueue,
  metrics,
  portalHealth,
  performance,
  workload,
  executiveBrief,
  onJump,
  onSelectStudent,
  lastLoaded,
}) {
  const priorityStudent = safeArray(studentQueue)[0] || null;
  const recommendedActions = safeArray(executiveBrief?.recommendedActions)
    .map((action) =>
      typeof action === "string"
        ? action
        : action?.text || action?.title || action?.message || action?.action
    )
    .filter(Boolean)
    .slice(0, 3);

  const operatingPlan = recommendedActions.length
    ? recommendedActions
    : [
        "Clear the highest-pressure student support request.",
        "Protect the next application movement and deadline.",
        "Log every meaningful counselor action into the student timeline.",
      ];

  const queueCards = [
    {
      key: "support",
      label: "Support Queue",
      count: safeNumber(metrics?.supportQueue),
      helper: "Student questions and permanent replies",
      accent: "bg-rose-500",
    },
    {
      key: "applications",
      label: "Applications",
      count: safeNumber(metrics?.activeApplications),
      helper: "Italy stages, decisions and pre-enrolment",
      accent: "bg-emerald-500",
    },
    {
      key: "documents",
      label: "Documents",
      count: safeNumber(metrics?.documentQueue),
      helper: "Missing, rejected and review-sensitive files",
      accent: "bg-amber-500",
    },
    {
      key: "tasks",
      label: "Tasks",
      count: safeNumber(metrics?.openTasks),
      helper: `${safeNumber(metrics?.overdueTasks)} overdue follow-ups`,
      accent: "bg-orange-500",
    },
    {
      key: "appointments",
      label: "Appointments",
      count: safeNumber(metrics?.upcomingAppointments),
      helper: "Sessions requiring preparation or outcomes",
      accent: "bg-violet-500",
    },
    {
      key: "communications",
      label: "Communication",
      count: safeNumber(metrics?.communicationCount),
      helper: "Calls, notes, email and WhatsApp history",
      accent: "bg-sky-500",
    },
  ];

  return (
    <section className="overflow-hidden rounded-[2.25rem] border-[4px] border-[#123865] bg-[#FFF8EF] p-2.5 shadow-[0_28px_80px_rgba(16,35,63,0.16)] sm:p-4">
      <div className="relative overflow-hidden rounded-[1.85rem] border-[3px] border-[#FF5A0A] bg-[#123865] p-5 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08),0_18px_42px_rgba(16,35,63,0.24)] sm:p-6">
        <div aria-hidden="true" className="pointer-events-none absolute -right-14 -top-20 h-52 w-52 rounded-full border-[26px] border-white/5" />
        <div aria-hidden="true" className="pointer-events-none absolute -bottom-24 right-20 h-44 w-44 rounded-full border-[22px] border-orange-400/10" />

        <div className="relative z-[1] grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px] xl:items-center">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-orange-300">
              Counselor Daily Command
            </p>
            <h2 className="mt-2 max-w-4xl text-3xl font-black tracking-tight text-white sm:text-4xl">
              Start with pressure. Finish with a recorded next move.
            </h2>
            <p className="mt-3 max-w-3xl text-sm font-semibold leading-6 text-blue-100">
              This overview reduces the full portal into one priority student, one operating plan and the queues that need action today.
            </p>
          </div>

          <div className="rounded-[1.45rem] border-2 border-white/20 bg-white/10 p-4 backdrop-blur-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[9px] font-black uppercase tracking-[0.18em] text-blue-200">
                  Portal Health
                </p>
                <p className="mt-1 text-2xl font-black text-white">
                  {portalHealth.label}
                </p>
              </div>
              <span className="rounded-xl border border-orange-300/70 bg-orange-400/15 px-3 py-2 text-lg font-black text-orange-200">
                {portalHealth.score}%
              </span>
            </div>

            <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-white/15">
              <div
                className={`h-full rounded-full ${
                  portalHealth.score >= 85
                    ? "bg-emerald-400"
                    : portalHealth.score >= 65
                      ? "bg-amber-400"
                      : "bg-rose-400"
                }`}
                style={{ width: `${portalHealth.score}%` }}
              />
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
              <div className="rounded-xl border border-white/15 bg-white/10 p-3">
                <p className="font-black uppercase tracking-[0.12em] text-blue-200">
                  Focus
                </p>
                <p className="mt-1 font-black text-white">
                  {portalHealth.focus || "Student movement"}
                </p>
              </div>
              <div className="rounded-xl border border-white/15 bg-white/10 p-3">
                <p className="font-black uppercase tracking-[0.12em] text-blue-200">
                  Last Sync
                </p>
                <p className="mt-1 font-black text-white">{lastLoaded}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="relative mt-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ["Assigned", metrics?.assignedStudents, "active students"],
            ["Recovery", metrics?.atRiskStudents, "students at risk"],
            ["Overdue", metrics?.overdueTasks, "tasks requiring action"],
            ["Conversion", performance?.conversionRate, "portfolio conversion %"],
          ].map(([label, value, helper]) => (
            <div
              key={label}
              className="rounded-[1.15rem] border border-white/15 bg-white/10 px-4 py-3"
            >
              <p className="text-[9px] font-black uppercase tracking-[0.16em] text-blue-200">
                {label}
              </p>
              <div className="mt-1 flex items-end justify-between gap-2">
                <p className="text-2xl font-black text-white">
                  {safeNumber(value)}
                  {label === "Conversion" ? "%" : ""}
                </p>
                <p className="text-[10px] font-bold text-blue-200">{helper}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1.25fr)_minmax(340px,0.75fr)]">
        <div className="rounded-[1.75rem] border-[3px] border-[#123865] bg-[#FFFCF7] p-4 shadow-[0_14px_34px_rgba(16,35,63,0.10)] sm:p-5">
          <div className="flex flex-col gap-3 border-b-2 border-orange-500 pb-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-700">
                Priority Student
              </p>
              <h3 className="mt-1 text-2xl font-black text-[#10233F]">
                {priorityStudent?.name || "No assigned student"}
              </h3>
              <p className="mt-1 text-sm font-semibold text-[#5B6D80]">
                {priorityStudent
                  ? `${priorityStudent.stage || "Not Started"} · ${
                      priorityStudent.nextMilestone || "Counselor review"
                    } next`
                  : "Assigned students will appear here after counselor ownership is available."}
              </p>
            </div>

            {priorityStudent ? (
              <span
                className={`self-start rounded-full border px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.13em] ${
                  priorityStudent.isAtRisk
                    ? "border-rose-300 bg-rose-50 text-rose-700"
                    : priorityStudent.isConversionReady
                      ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                      : "border-[#AFC0D0] bg-[#F1F6FA] text-[#123865]"
                }`}
              >
                {priorityStudent.isAtRisk
                  ? "Recovery Priority"
                  : priorityStudent.isConversionReady
                    ? "Conversion Ready"
                    : "Active Journey"}
              </span>
            ) : null}
          </div>

          {priorityStudent ? (
            <>
              <div className="mt-4 rounded-[1.35rem] border-2 border-orange-300 bg-[#FFF4E8] p-4">
                <p className="text-[9px] font-black uppercase tracking-[0.18em] text-orange-700">
                  Best Next Counselor Action
                </p>
                <p className="mt-2 text-base font-black leading-7 text-[#10233F]">
                  {priorityStudent.nextBestAction ||
                    "Review the student journey and record the next counselor task."}
                </p>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                {[
                  ["Risk", priorityStudent.riskScore, "bg-rose-500"],
                  ["Opportunity", priorityStudent.opportunityScore, "bg-emerald-500"],
                  ["Velocity", priorityStudent.velocityScore, "bg-[#123865]"],
                ].map(([label, value, bar]) => (
                  <div
                    key={label}
                    className="rounded-[1.2rem] border-2 border-[#AFC0D0] bg-[#F7FAFC] p-3"
                  >
                    <div className="flex items-center justify-between gap-2 text-xs">
                      <span className="font-black text-[#5B6D80]">{label}</span>
                      <span className="font-black text-[#10233F]">
                        {safeNumber(value)}
                      </span>
                    </div>
                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#E4EBF2]">
                      <div
                        className={`h-full rounded-full ${bar}`}
                        style={{ width: `${Math.max(0, Math.min(100, safeNumber(value)))}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 grid gap-2 sm:grid-cols-3">
                <button
                  type="button"
                  onClick={() => onSelectStudent?.(priorityStudent)}
                  className="rounded-xl border-2 border-[#123865] bg-[#123865] px-4 py-3 text-xs font-black text-white transition hover:-translate-y-0.5 hover:bg-[#0B2A4B]"
                >
                  Open Student Command
                </button>
                <button
                  type="button"
                  onClick={() => onJump("support")}
                  className="rounded-xl border-2 border-orange-500 bg-orange-500 px-4 py-3 text-xs font-black text-white transition hover:-translate-y-0.5 hover:bg-orange-600"
                >
                  Open Support
                </button>
                <button
                  type="button"
                  onClick={() => onJump("applications")}
                  className="rounded-xl border-2 border-[#AFC0D0] bg-white px-4 py-3 text-xs font-black text-[#123865] transition hover:-translate-y-0.5 hover:border-[#123865]"
                >
                  Open Applications
                </button>
              </div>
            </>
          ) : (
            <div className="mt-4 rounded-[1.35rem] border-[3px] border-dashed border-[#AFC0D0] bg-[#F7FAFC] p-8 text-center">
              <p className="text-sm font-black text-[#10233F]">
                No assigned student in scope.
              </p>
              <p className="mt-2 text-sm leading-6 text-[#5B6D80]">
                The Counselor Portal remains safely empty until Admin assigns a student.
              </p>
            </div>
          )}
        </div>

        <aside className="rounded-[1.75rem] border-[3px] border-[#123865] bg-[#FFFCF7] p-4 shadow-[0_14px_34px_rgba(16,35,63,0.10)] sm:p-5">
          <div className="border-b-2 border-orange-500 pb-4">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-700">
              Work Queue
            </p>
            <h3 className="mt-1 text-xl font-black text-[#10233F]">
              Move directly into the next job
            </h3>
          </div>

          <div className="mt-4 grid gap-2">
            {queueCards.map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => onJump(item.key)}
                className="group grid grid-cols-[6px_minmax(0,1fr)_auto] items-center gap-3 overflow-hidden rounded-[1.15rem] border-2 border-[#C9D6E2] bg-white p-3 text-left transition hover:-translate-y-0.5 hover:border-[#123865] hover:shadow-md"
              >
                <span className={`h-full min-h-11 rounded-full ${item.accent}`} />
                <span className="min-w-0">
                  <span className="block text-sm font-black text-[#10233F]">
                    {item.label}
                  </span>
                  <span className="mt-0.5 block text-[11px] font-semibold leading-4 text-[#5B6D80]">
                    {item.helper}
                  </span>
                </span>
                <span className="rounded-xl border-2 border-[#AFC0D0] bg-[#F1F6FA] px-2.5 py-1.5 text-sm font-black text-[#123865]">
                  {item.count}
                </span>
              </button>
            ))}
          </div>
        </aside>
      </div>

      <div className="mt-4 rounded-[1.75rem] border-[3px] border-[#123865] bg-[#FFFCF7] p-4 shadow-[0_14px_34px_rgba(16,35,63,0.10)] sm:p-5">
        <div className="flex flex-col gap-2 border-b-2 border-orange-500 pb-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-700">
              Operating Plan
            </p>
            <h3 className="mt-1 text-xl font-black text-[#10233F]">
              Three moves before the counselor session ends
            </h3>
          </div>
          <p className="text-xs font-semibold text-[#5B6D80]">
            Workload focus: {workload?.recommendedFocus || "Student movement"}
          </p>
        </div>

        <div className="mt-4 grid gap-3 lg:grid-cols-3">
          {operatingPlan.map((action, index) => (
            <div
              key={`${action}-${index}`}
              className="grid grid-cols-[44px_minmax(0,1fr)] gap-3 rounded-[1.25rem] border-2 border-[#C9D6E2] bg-white p-4"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-xl border-2 border-orange-500 bg-orange-500 text-lg font-black text-white">
                {index + 1}
              </span>
              <div>
                <p className="text-[9px] font-black uppercase tracking-[0.14em] text-[#73869A]">
                  Execution Step
                </p>
                <p className="mt-1 text-sm font-black leading-6 text-[#10233F]">
                  {action}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function CounselorPortalDashboard({
  counselor,
  snapshot,
  metrics,
  workload,
  performance,
  executiveBrief,
  loading,
  refreshing,
  error,
  errorDetail,
  onRefresh,
}) {
  const [activeView, setActiveView] = useState(() => {
    if (typeof window === "undefined") return "overview";

    try {
      return window.sessionStorage.getItem(COUNSELOR_VIEW_STORAGE_KEY) || "overview";
    } catch {
      return "overview";
    }
  });
  const [selectedStudent, setSelectedStudent] = useState(null);

  const navItems = useMemo(() => {
    const items = [...buildCounselorNavigation(metrics)];

    if (!items.some((item) => item.key === "visa")) {
      const visaItem = { key: "visa", label: "Visa" };
      const documentsIndex = items.findIndex((item) => item.key === "documents");
      const insertAt = documentsIndex >= 0 ? documentsIndex + 1 : Math.min(4, items.length);
      items.splice(insertAt, 0, visaItem);
    }

    if (!items.some((item) => item.key === "finance")) {
      const financeItem = { key: "finance", label: "Finance" };
      const visaIndex = items.findIndex((item) => item.key === "visa");
      const insertAt = visaIndex >= 0 ? visaIndex + 1 : Math.min(6, items.length);
      items.splice(insertAt, 0, financeItem);
    }

    return items;
  }, [metrics]);
  const validViews = useMemo(() => new Set(navItems.map((item) => item.key)), [navItems]);
  const studentQueue = useMemo(
    () =>
      safeArray(snapshot?.priorityStudents).length
        ? safeArray(snapshot.priorityStudents)
        : buildPriorityStudentQueue(snapshot || {}),
    [snapshot]
  );
  const lastLoaded = snapshot?.loadedAt ? formatRelativeTime(snapshot.loadedAt) : "not loaded yet";
  const portalHealth = useMemo(
    () => derivePortalHealth({ metrics, performance, workload, snapshot }),
    [metrics, performance, workload, snapshot]
  );
  const currentViewMeta = VIEW_META[activeView] || VIEW_META.overview;

  useEffect(() => {
    if (validViews.has(activeView)) return;
    setActiveView("overview");
    writeSessionValue(COUNSELOR_VIEW_STORAGE_KEY, "overview");
  }, [activeView, validViews]);


  const jumpTo = useCallback(
    (view) => {
      const nextView = validViews.has(view) ? view : "overview";
      setActiveView(nextView);
      setSelectedStudent(null);
      writeSessionValue(COUNSELOR_VIEW_STORAGE_KEY, nextView);
    },
    [validViews]
  );

  const renderView = () => {
    if (loading) {
      return (
        <EmptyState
          title="Loading Counselor OS"
          message="Securely loading assigned students, applications, documents, Visa operations, finance, tasks, support, appointments and communication history for this counselor."
        />
      );
    }

    if (error) {
      return (
        <EmptyState
          title="Counselor OS could not load"
          message={error}
          detail={errorDetail}
          action="Refresh Counselor OS"
          onAction={onRefresh}
        />
      );
    }

    if (activeView === "students") {
      return (
        <AssignedStudentsWorkspace
          snapshot={snapshot}
          counselor={counselor}
          onRefresh={onRefresh}
          onSelectStudent={setSelectedStudent}
        />
      );
    }

    if (activeView === "applications") {
      return (
        <CounselorApplicationsWorkspace
          snapshot={snapshot}
          counselor={counselor}
          onRefresh={onRefresh}
        />
      );
    }

    if (activeView === "universities") {
      return (
        <CounselorUniversitiesWorkspace
          snapshot={snapshot}
          counselor={counselor}
          onRefresh={onRefresh}
        />
      );
    }

    if (activeView === "documents") {
      return (
        <CounselorDocumentsWorkspace
          snapshot={snapshot}
          counselor={counselor}
          onRefresh={onRefresh}
        />
      );
    }

    if (activeView === "visa") {
      return (
        <CounselorVisaWorkspace
          snapshot={snapshot}
          counselor={counselor}
          onRefresh={onRefresh}
        />
      );
    }

    if (activeView === "finance") {
      return (
        <CounselorFinanceWorkspace
          snapshot={snapshot}
          counselor={counselor}
          onRefresh={onRefresh}
        />
      );
    }

    if (activeView === "tasks") {
      return (
        <CounselorTasksWorkspace
          snapshot={snapshot}
          counselor={counselor}
          onRefresh={onRefresh}
        />
      );
    }

    if (activeView === "support") {
      return (
        <CounselorSupportWorkspace
          snapshot={snapshot}
          counselor={counselor}
          onRefresh={onRefresh}
        />
      );
    }

    if (activeView === "communications") {
      return (
        <CounselorCommunicationHub
          snapshot={snapshot}
          counselor={counselor}
          onRefresh={onRefresh}
        />
      );
    }

    if (activeView === "appointments") {
      return (
        <CounselorAppointmentsWorkspace
          snapshot={snapshot}
          counselor={counselor}
          onRefresh={onRefresh}
        />
      );
    }

    if (activeView === "workload") {
      return (
        <CounselorWorkloadPanel
          workload={workload}
          performance={performance}
          executiveBrief={executiveBrief}
          snapshot={snapshot}
        />
      );
    }

    if (activeView === "analytics") {
      return (
        <CounselorAnalyticsPanel
          workload={workload}
          performance={performance}
          executiveBrief={executiveBrief}
          snapshot={snapshot}
        />
      );
    }

    return (
      <CounselorOverviewCommandCenter
        studentQueue={studentQueue}
        metrics={metrics}
        portalHealth={portalHealth}
        performance={performance}
        workload={workload}
        executiveBrief={executiveBrief}
        onJump={jumpTo}
        onSelectStudent={setSelectedStudent}
        lastLoaded={lastLoaded}
      />
    );
  };

  return (
    <section
      aria-label="Counselor Portal Dashboard"
      className="relative mx-auto w-full max-w-[1780px] min-w-0 px-2 py-2"
    >
      <div className="mb-3 grid gap-3 rounded-[1.5rem] border-[3px] border-[#123865] bg-[#FFFCF7] p-3 shadow-[0_12px_30px_rgba(16,35,63,0.10)] lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-orange-300 bg-orange-50 px-3 py-1 text-[9px] font-black uppercase tracking-[0.16em] text-orange-700">
              {currentViewMeta.eyebrow}
            </span>
            <span
              className={`rounded-full border px-3 py-1 text-[9px] font-black uppercase tracking-[0.13em] ${
                portalHealth.score >= 85
                  ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                  : portalHealth.score >= 65
                    ? "border-amber-300 bg-amber-50 text-amber-700"
                    : "border-rose-300 bg-rose-50 text-rose-700"
              }`}
            >
              {portalHealth.label} · {portalHealth.score}%
            </span>
          </div>

          <div className="mt-2 flex flex-col gap-1 xl:flex-row xl:items-end xl:gap-4">
            <h1 className="text-xl font-black tracking-tight text-[#10233F] sm:text-2xl">
              {currentViewMeta.title}
            </h1>
            <p className="max-w-4xl text-xs font-semibold leading-5 text-[#5B6D80]">
              {currentViewMeta.description}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 lg:justify-end">
          <span className="rounded-xl border-2 border-[#D8B07B] bg-[#FFF8EF] px-3 py-2 text-[10px] font-bold text-[#5B6D80]">
            Focus: <strong className="text-orange-700">{portalHealth.focus}</strong>
          </span>
          <span className="rounded-xl border-2 border-[#AFC0D0] bg-white px-3 py-2 text-[10px] font-bold text-[#5B6D80]">
            Sync: {refreshing ? "refreshing..." : lastLoaded}
          </span>
          <button
            type="button"
            onClick={onRefresh}
            disabled={loading || refreshing}
            className="rounded-xl border-2 border-orange-500 bg-orange-500 px-4 py-2.5 text-xs font-black text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-55"
          >
            {refreshing ? "Refreshing..." : "Refresh"}
          </button>
        </div>
      </div>

      <div className="sticky top-2 z-30 mb-5 overflow-hidden rounded-[2rem] border-[4px] border-[#123865] bg-[#FFF8EF]/95 shadow-[0_20px_52px_rgba(16,35,63,0.16)] backdrop-blur-xl">
        <div className="grid min-w-0 border-b-2 border-orange-200 bg-[#FFFCF7] lg:grid-cols-[minmax(320px,0.42fr)_minmax(0,1fr)]">
          <div className="relative overflow-hidden bg-[#123865] px-4 py-4 sm:px-5">
            <div aria-hidden="true" className="pointer-events-none absolute -right-10 -top-16 h-40 w-40 rounded-full border-[20px] border-white/5" />
            <div aria-hidden="true" className="pointer-events-none absolute -bottom-20 right-16 h-32 w-32 rounded-full border-[16px] border-orange-400/10" />

            <div className="relative z-[1] flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border-2 border-orange-400 bg-orange-500/10 text-orange-300 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)]">
                <LayoutDashboard size={21} strokeWidth={2.4} />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-orange-300">
                  Counselor Workspaces
                </p>
                <h2 className="mt-1 text-lg font-black tracking-tight text-white sm:text-xl">
                  One command strip. Every counselor operation.
                </h2>
                <p className="mt-1 text-xs font-semibold leading-5 text-blue-100">
                  Open a workspace without losing your assigned-student context.
                </p>
              </div>
            </div>
          </div>

          <div className="flex min-w-0 flex-col justify-center gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
            <div className="min-w-0">
              <p className="text-[9px] font-black uppercase tracking-[0.18em] text-[#73869A]">
                Current Workspace
              </p>
              <div className="mt-1 flex min-w-0 items-center gap-2">
                <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-orange-500 shadow-[0_0_0_4px_rgba(255,90,10,0.10)]" />
                <p className="truncate text-sm font-black text-[#10233F]">
                  {currentViewMeta.title}
                </p>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <span className="rounded-xl border-2 border-[#AFC0D0] bg-white px-3 py-2 text-[10px] font-black text-[#5B6D80]">
                {navItems.length} modules
              </span>
              <span className="rounded-xl border-2 border-orange-200 bg-orange-50 px-3 py-2 text-[10px] font-black text-orange-700">
                Live counselor scope
              </span>
            </div>
          </div>
        </div>

        <div
          className="grid grid-cols-2 gap-2.5 p-3 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-7 sm:p-4"
          role="tablist"
          aria-label="Counselor workspaces"
        >
          {navItems.map((item) => {
            const visual = WORKSPACE_NAV_META[item.key] || WORKSPACE_NAV_META.overview;
            const Icon = visual.icon;
            const isActive = activeView === item.key;

            return (
              <button
                key={item.key}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => jumpTo(item.key)}
                className={`group relative min-w-0 overflow-hidden rounded-[1.35rem] border-2 p-3 text-left transition duration-300 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-orange-100 ${
                  isActive
                    ? "border-[#123865] bg-[#123865] text-white shadow-[inset_0_-4px_0_#FF5A0A,0_12px_28px_rgba(16,35,63,0.22)]"
                    : "border-[#D8B07B] bg-[#FFFCF7] text-[#10233F] shadow-[0_7px_18px_rgba(16,35,63,0.08)] hover:-translate-y-0.5 hover:border-[#123865] hover:bg-white hover:shadow-[0_12px_26px_rgba(16,35,63,0.12)]"
                }`}
              >
                {isActive ? (
                  <span aria-hidden="true" className="absolute right-0 top-0 h-14 w-14 rounded-bl-[2rem] bg-white/[0.04]" />
                ) : null}

                <div className="relative z-[1] flex items-start justify-between gap-2">
                  <span
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border-2 transition ${
                      isActive
                        ? "border-white/20 bg-white/10 text-orange-300"
                        : visual.iconBg
                    }`}
                  >
                    <Icon size={17} strokeWidth={2.35} />
                  </span>

                  {typeof item.badge === "number" ? (
                    <span
                      className={`inline-flex min-w-6 items-center justify-center rounded-full border px-1.5 py-1 text-[9px] font-black leading-none ${
                        isActive
                          ? "border-orange-300/60 bg-orange-400/15 text-orange-200"
                          : visual.accent
                      }`}
                    >
                      {item.badge}
                    </span>
                  ) : (
                    <span
                      aria-hidden="true"
                      className={`mt-1 h-2.5 w-2.5 rounded-full ${
                        isActive ? "bg-orange-400" : "bg-[#AFC0D0]"
                      }`}
                    />
                  )}
                </div>

                <div className="relative z-[1] mt-3 min-w-0">
                  <p
                    className={`min-h-[32px] text-[12px] font-black leading-4 sm:text-[13px] ${
                      isActive ? "text-white" : "text-[#10233F]"
                    }`}
                  >
                    {item.label}
                  </p>
                  <p
                    className={`mt-1 text-[9px] font-black uppercase tracking-[0.12em] ${
                      isActive ? "text-blue-100" : "text-[#7B8B9B]"
                    }`}
                  >
                    {isActive ? "Open now" : "Open workspace"}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {studentQueue.length === 0 && !loading && !error ? (
        <div
          role="status"
          className="mb-5 flex flex-col gap-1 rounded-[1.35rem] border-2 border-amber-300 bg-amber-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
        >
          <p className="text-xs font-black text-amber-800">
            No assigned students in the current counselor scope.
          </p>
          <p className="text-[11px] leading-5 text-amber-700">
            Data remains safely scoped until assignment records are available.
          </p>
        </div>
      ) : null}

      <Suspense fallback={<CounselorModuleLoader />}>{renderView()}</Suspense>

      <StudentCommandDrawer
        student={selectedStudent}
        onClose={() => setSelectedStudent(null)}
        onJump={jumpTo}
      />
    </section>
  );
}
