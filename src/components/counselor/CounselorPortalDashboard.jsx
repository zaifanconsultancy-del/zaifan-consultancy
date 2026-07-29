import React, { lazy, Suspense, useCallback, useEffect, useMemo, useState } from "react";
const AssignedStudentsWorkspace = lazy(() => import("./AssignedStudentsWorkspace"));
const CounselorApplicationsWorkspace = lazy(() => import("./CounselorApplicationsWorkspace"));
const CounselorDocumentsWorkspace = lazy(() => import("./CounselorDocumentsWorkspace"));
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
    description: "Track application pressure, submissions, offers, CAS movement and counselor follow-up.",
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
      className={`rounded-[1.25rem] border-2 p-4 text-left shadow-sm transition duration-300 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-orange-100 ${
        tones[tone] || tones.slate
      } ${onClick ? "hover:-translate-y-0.5 hover:border-orange-400 hover:bg-orange-50/70 hover:shadow-md" : ""} ${
        active ? "ring-2 ring-orange-300" : ""
      }`}
    >
      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#607487]">
        {label}
      </p>
      <div className="mt-3 flex items-end justify-between gap-3">
        <p className="text-3xl font-black tracking-tight text-[#17324d]">{value}</p>
        {helper ? (
          <p className="max-w-[120px] text-right text-xs font-semibold leading-5 text-[#607487]">
            {helper}
          </p>
        ) : null}
      </div>
    </Component>
  );
}


function CounselorModuleLoader() {
  return (
    <div role="status" aria-live="polite" className="flex min-h-[360px] items-center justify-center rounded-[2rem] border-2 border-[#d8b892] bg-[#fffdf8] shadow-sm">
      <div className="text-center">
        <div className="mx-auto h-10 w-10 animate-spin rounded-full border-[3px] border-orange-100 border-t-orange-500" />
        <p className="mt-4 text-sm font-black text-[#17324d]">
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
    <div className="rounded-3xl border-2 border-dashed border-[#d8b892] bg-[#fffdf8] p-8 text-center shadow-sm">
      <h3 className="text-lg font-black text-[#17324d]">{title}</h3>
      <p className="mx-auto mt-2 max-w-2xl text-sm text-[#607487]">{message}</p>
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

  return (
    <div className="mb-6 grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
      <div className="rounded-3xl border border-[#d8b892] bg-[#fffdf8] shadow-sm p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-orange-600">Executive Counselor Brief</p>
        <h2 className="mt-2 text-2xl font-black">{executiveBrief?.headline || "Healthy workload"}</h2>
        <p className="mt-2 text-sm leading-6 text-[#4b6072]">
          {workload?.executiveSummary || "No counselor workload summary available yet."}
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          {(actions.length ? actions : ["Review assigned students.", "Update counselor task queue."]).slice(0, 5).map((item) => (
            <span key={item} className="rounded-full border border-[#d8b892] bg-[#fff8ec] px-3 py-1 text-xs font-bold text-[#4b6072]">
              {item}
            </span>
          ))}
        </div>
      </div>

      <div className="rounded-3xl border border-[#d8b892] bg-[#fffdf8] shadow-sm p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-violet-600">Performance Engine</p>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <button type="button" onClick={() => onJump("analytics")} className="rounded-2xl border border-[#d8b892] bg-[#fff8ec] p-4 text-left hover:bg-orange-50">
            <p className="text-xs text-[#607487]">Grade</p>
            <p className="mt-1 text-xl font-black">{performance?.performanceGrade || "Pending"}</p>
          </button>
          <button type="button" onClick={() => onJump("applications")} className="rounded-2xl border border-[#d8b892] bg-[#fff8ec] p-4 text-left hover:bg-orange-50">
            <p className="text-xs text-[#607487]">Conversion</p>
            <p className="mt-1 text-xl font-black">{performance?.conversionRate || 0}%</p>
          </button>
          <button type="button" onClick={() => onJump("students")} className="rounded-2xl border border-[#d8b892] bg-[#fff8ec] p-4 text-left hover:bg-orange-50">
            <p className="text-xs text-[#607487]">Activation</p>
            <p className="mt-1 text-xl font-black">{performance?.activationRate || 0}%</p>
          </button>
          <button type="button" onClick={() => onJump("appointments")} className="rounded-2xl border border-[#d8b892] bg-[#fff8ec] p-4 text-left hover:bg-orange-50">
            <p className="text-xs text-[#607487]">Visa Progress</p>
            <p className="mt-1 text-xl font-black">{performance?.visaProgressRate || 0}%</p>
          </button>
        </div>
      </div>
    </div>
  );
}

function AnalyticsStat({ label, value, helper, tone = "slate" }) {
  const tones = {
    slate: "border-[#17324d] bg-[#17324d] text-white",
    cyan: "border-sky-300 bg-sky-50 text-sky-900",
    emerald: "border-emerald-300 bg-emerald-50 text-emerald-900",
    amber: "border-orange-300 bg-orange-50 text-orange-900",
    rose: "border-rose-300 bg-rose-50 text-rose-900",
    violet: "border-violet-300 bg-violet-50 text-violet-900",
  };

  const dark = tone === "slate";

  return (
    <div className={`rounded-3xl border-2 p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${tones[tone] || tones.slate}`}>
      <p className={`text-xs font-black uppercase tracking-[0.22em] ${dark ? "text-white/70" : "text-current opacity-70"}`}>{label}</p>
      <p className={`mt-3 text-3xl font-black ${dark ? "text-white" : "text-[#17324d]"}`}>{value}</p>
      {helper ? <p className={`mt-2 text-sm font-semibold leading-5 ${dark ? "text-white/75" : "text-[#607487]"}`}>{helper}</p> : null}
    </div>
  );
}

function AnalyticsProgress({ label, value, detail, tone = "cyan" }) {
  const clean = Math.max(0, Math.min(100, safeNumber(value)));
  const barTone =
    tone === "emerald"
      ? "bg-emerald-500"
      : tone === "amber"
      ? "bg-amber-500"
      : tone === "rose"
      ? "bg-rose-500"
      : tone === "violet"
      ? "bg-violet-500"
      : "bg-orange-500";

  return (
    <div className="rounded-3xl border-2 border-[#d6e0e7] bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-black uppercase tracking-[0.22em] text-[#607487]">{label}</p>
        <p className="text-sm font-black text-[#17324d]">{clean}%</p>
      </div>
      <div className="mt-4 h-3 overflow-hidden rounded-full bg-slate-200">
        <div className={`h-full rounded-full ${barTone}`} style={{ width: `${clean}%` }} />
      </div>
      {detail ? <p className="mt-3 text-xs leading-5 text-[#607487]">{detail}</p> : null}
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
    <section className="rounded-[1.8rem] border-2 border-[#173f69] bg-[#fffaf2] p-4 shadow-[0_18px_55px_rgba(16,43,76,0.08)] sm:p-5">
      <div className="mb-5 flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-orange-700">
            Performance Intelligence
          </p>
          <h2 className="mt-2 text-2xl font-black tracking-tight text-[#102b4c] sm:text-3xl">
            Counselor Analytics
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-[#607487]">
            Activation, conversion, visa movement, task completion, communication coverage and operating pressure in one counselor view.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <span className="rounded-xl border-2 border-[#173f69] bg-[#173f69] px-4 py-2 text-sm font-black text-white">
            {derived.students} students
          </span>
          <span className="rounded-xl border-2 border-orange-300 bg-orange-50 px-4 py-2 text-sm font-black text-orange-700">
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
        <AnalyticsStat label="CAS Issued" value={performance?.casIssued || 0} helper="late-stage progress" tone="amber" />
        <AnalyticsStat label="Risk Load" value={workload?.atRiskStudents || 0} helper="students needing recovery" tone="rose" />
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-3xl border-2 border-orange-300 bg-orange-50/70 p-5 shadow-sm">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-orange-700">Performance Movement</p>
          <h3 className="mt-1 text-xl font-black text-[#17324d]">Counselor conversion funnel</h3>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <AnalyticsProgress label="Activation Rate" value={performance?.activationRate || 0} detail="Assigned students with meaningful stage movement." tone="cyan" />
            <AnalyticsProgress label="Conversion Rate" value={performance?.conversionRate || 0} detail="Students moved to offer-stage or later." tone="emerald" />
            <AnalyticsProgress label="Visa Progress" value={performance?.visaProgressRate || 0} detail="Students progressed into visa-stage or beyond." tone="violet" />
            <AnalyticsProgress label="Task Completion" value={taskCompletion} detail={`${derived.completedTasks} completed from ${derived.tasks} tracked tasks.`} tone="amber" />
          </div>
        </div>

        <div className="rounded-3xl border-2 border-violet-300 bg-violet-50/70 p-5 shadow-sm">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-violet-700">Operational Analytics</p>
          <h3 className="mt-1 text-xl font-black text-[#17324d]">Pressure and quality signals</h3>
          <div className="mt-5 grid gap-3">
            <AnalyticsProgress label="Support Load" value={supportLoad} detail={`${derived.support} support item(s) across ${derived.students} assigned student(s).`} tone="rose" />
            <AnalyticsProgress label="Communication Coverage" value={communicationCoverage} detail={`${derived.communications} communication record(s) across assigned scope.`} tone="cyan" />
            <AnalyticsStat label="Critical Documents" value={derived.criticalDocuments} helper="missing/rejected/expired documents" tone={derived.criticalDocuments ? "rose" : "emerald"} />
            <AnalyticsStat label="Open Tasks" value={derived.openTasks} helper="remaining task pressure" tone={derived.openTasks > 10 ? "rose" : "amber"} />
          </div>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <div className="rounded-3xl border-2 border-[#17324d] bg-[#f3f7fb] p-5 shadow-sm">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-[#17324d]">Executive Analytics Summary</p>
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
      <aside className="absolute right-0 top-0 h-full w-full max-w-xl overflow-y-auto border-l-4 border-[#17324d] bg-[#fff8ec] p-5 text-[#17324d] shadow-2xl sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.25em] text-orange-600">Student Command Drawer</p>
            <h2 className="mt-2 text-3xl font-black">{student.name}</h2>
            <p className="mt-1 text-sm text-[#607487]">{student.email || "No email"} · {student.phone || "No phone"}</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-2xl border-2 border-[#17324d] bg-[#17324d] px-4 py-2 text-sm font-black text-white hover:bg-[#244966] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f28c28]">
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

        <div className="mt-6 rounded-3xl border-2 border-[#17324d] bg-[#17324d] p-5 text-white shadow-sm">
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

        <div className="mt-4 rounded-3xl border border-[#d8b892] bg-[#fffdf8] shadow-sm p-5">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#607487]">Next Best Action</p>
          <p className="mt-2 text-sm font-semibold text-[#17324d]">{student.nextBestAction}</p>
          <p className="mt-2 text-xs text-[#607487]">Last activity {formatRelativeTime(student.lastActivityAt || student.updated_at || student.created_at)}</p>
        </div>

        <div className="mt-6 grid gap-3">
          {[
            ["applications", `${student.applicationsCount || 0} applications`],
            ["universities", `${student.universitiesCount || 0} universities`],
            ["documents", `${student.documentsCount || 0} documents`],
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
              className="flex items-center justify-between rounded-2xl border border-[#d8b892] bg-[#fffdf8] px-4 py-3 shadow-sm text-left text-sm font-bold text-[#355068] hover:border-orange-300 hover:bg-orange-50/70"
            >
              <span className="capitalize">{key}</span>
              <span className="text-[#607487]">{label}</span>
            </button>
          ))}
        </div>
      </aside>
    </div>
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

  const navItems = useMemo(() => buildCounselorNavigation(metrics), [metrics]);
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
          message="Securely loading assigned students, applications, documents, tasks, support, appointments and communication history for this counselor."
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
      return <CounselorApplicationsWorkspace snapshot={snapshot} counselor={counselor} onRefresh={onRefresh} />;
    }

    if (activeView === "universities") {
      return <CounselorUniversitiesWorkspace snapshot={snapshot} counselor={counselor} onRefresh={onRefresh} />;
    }

    if (activeView === "documents") {
      return <CounselorDocumentsWorkspace snapshot={snapshot} counselor={counselor} onRefresh={onRefresh} />;
    }

    if (activeView === "tasks") {
      return <CounselorTasksWorkspace snapshot={snapshot} counselor={counselor} onRefresh={onRefresh} />;
    }

    if (activeView === "support") {
      return <CounselorSupportWorkspace snapshot={snapshot} counselor={counselor} onRefresh={onRefresh} />;
    }

    if (activeView === "communications") {
      return <CounselorCommunicationHub snapshot={snapshot} counselor={counselor} onRefresh={onRefresh} />;
    }

    if (activeView === "appointments") {
      return <CounselorAppointmentsWorkspace snapshot={snapshot} counselor={counselor} onRefresh={onRefresh} />;
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
      <section className="rounded-[1.8rem] border-2 border-[#173f69] bg-[#fffaf2] p-4 shadow-[0_18px_55px_rgba(16,43,76,0.08)] sm:p-5">
        <div className="mb-5 flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-orange-700">
              Counselor Command Center
            </p>
            <h2 className="mt-2 text-2xl font-black tracking-tight text-[#102b4c] sm:text-3xl">
              Operational Overview
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-[#607487]">
              Priority students, workload pressure, support, communication and appointments in one working view.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <span className="rounded-xl border-2 border-[#173f69] bg-[#173f69] px-4 py-2 text-sm font-black text-white">
              {safeNumber(metrics?.assignedStudents)} students
            </span>
            <span className="rounded-xl border-2 border-orange-300 bg-orange-50 px-4 py-2 text-sm font-black text-orange-700">
              {portalHealth.label}
            </span>
          </div>
        </div>

        <CommandStrip workload={workload} performance={performance} executiveBrief={executiveBrief} onJump={jumpTo} />

        <div className="grid gap-5 xl:grid-cols-[1.4fr_0.9fr]">
          <AssignedStudentsWorkspace
            snapshot={snapshot}
            counselor={counselor}
            onRefresh={onRefresh}
            onSelectStudent={setSelectedStudent}
            compact
          />
          <CounselorWorkloadPanel
            workload={workload}
            performance={performance}
            executiveBrief={executiveBrief}
            snapshot={snapshot}
            compact
          />
          <div className="grid gap-5 xl:col-span-2 xl:grid-cols-3">
            <CounselorSupportWorkspace snapshot={snapshot} counselor={counselor} onRefresh={onRefresh} compact />
            <CounselorCommunicationHub snapshot={snapshot} counselor={counselor} compact />
            <CounselorAppointmentsWorkspace snapshot={snapshot} counselor={counselor} compact />
          </div>
        </div>
      </section>
    );
  };

  return (
    <section aria-label="Counselor Portal Dashboard" className="relative mx-auto w-full max-w-[1800px] min-w-0 px-1 py-1">
      <div className="mb-5 overflow-hidden rounded-[1.6rem] border-2 border-[#d8b892] bg-[#fffdf8] shadow-[0_12px_35px_rgba(23,50,77,0.06)]">
        <div className="flex flex-col gap-4 p-4 sm:p-5 xl:flex-row xl:items-center xl:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-orange-300 bg-orange-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-orange-700">
                {currentViewMeta.eyebrow}
              </span>

              <span
                className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] ${
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

            <div className="mt-2 flex flex-col gap-1 lg:flex-row lg:items-end lg:gap-4">
              <h1 className="text-2xl font-black tracking-tight text-[#17324d] sm:text-3xl">
                {currentViewMeta.title}
              </h1>

              <p className="max-w-3xl pb-0.5 text-sm leading-6 text-[#607487]">
                {currentViewMeta.description}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-xl border border-[#d8b892] bg-[#fff8ef] px-3 py-2 text-xs font-bold text-[#607487]">
              Focus: <strong className="text-orange-700">{portalHealth.focus}</strong>
            </span>

            <span className="rounded-xl border border-[#d8b892] bg-white px-3 py-2 text-xs font-bold text-[#607487]">
              Sync: {refreshing ? "refreshing..." : lastLoaded}
            </span>

            <button
              type="button"
              onClick={onRefresh}
              disabled={loading || refreshing}
              className="rounded-xl border-2 border-orange-500 bg-orange-500 px-4 py-2.5 text-xs font-black text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-55"
            >
              {refreshing ? "Refreshing..." : "Refresh"}
            </button>
          </div>
        </div>

        <div className="grid border-t border-[#ead9c5] sm:grid-cols-3">
          <div className="bg-orange-50 px-4 py-3">
            <p className="text-[9px] font-black uppercase tracking-[0.14em] text-[#8292a0]">
              Assigned Scope
            </p>
            <p className="mt-1 text-sm font-black text-[#17324d]">
              {safeNumber(metrics.assignedStudents)} students
            </p>
          </div>

          <div className="border-t border-[#ead9c5] bg-rose-50 px-4 py-3 sm:border-l sm:border-t-0">
            <p className="text-[9px] font-black uppercase tracking-[0.14em] text-[#8292a0]">
              Recovery
            </p>
            <p className="mt-1 text-sm font-black text-[#17324d]">
              {safeNumber(metrics.atRiskStudents)} at risk · {safeNumber(metrics.overdueTasks)} overdue
            </p>
          </div>

          <div className="border-t border-[#ead9c5] bg-violet-50 px-4 py-3 sm:border-l sm:border-t-0">
            <p className="text-[9px] font-black uppercase tracking-[0.14em] text-[#8292a0]">
              Documents
            </p>
            <p className="mt-1 text-sm font-black text-[#17324d]">
              {portalHealth.documentPressure} critical files
            </p>
          </div>
        </div>
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6">
        <MetricCard label="Assigned" value={metrics.assignedStudents || 0} helper="active students" tone="cyan" onClick={() => jumpTo("students")} active={activeView === "students"} />
        <MetricCard label="At Risk" value={metrics.atRiskStudents || 0} helper="need recovery" tone="rose" onClick={() => jumpTo("students")} active={activeView === "students" && safeNumber(metrics.atRiskStudents) > 0} />
        <MetricCard label="Conversion" value={metrics.conversionReady || 0} helper="ready to move" tone="emerald" onClick={() => jumpTo("applications")} active={activeView === "applications"} />
        <MetricCard label="Tasks" value={metrics.openTasks || 0} helper={`${metrics.overdueTasks || 0} overdue`} tone="amber" onClick={() => jumpTo("tasks")} active={activeView === "tasks"} />
        <MetricCard label="Support" value={metrics.supportQueue || 0} helper="queue items" tone="violet" onClick={() => jumpTo("support")} active={activeView === "support"} />
        <MetricCard label="Performance" value={performance?.performanceGrade || "—"} helper={`${performance?.conversionRate || 0}% conversion`} onClick={() => jumpTo("analytics")} active={activeView === "analytics"} />
      </div>

      <div className="sticky top-3 z-30 mb-5 overflow-hidden rounded-[1.35rem] border-2 border-[#d8b892] bg-[#fffdf8]/95 shadow-[0_10px_30px_rgba(15,23,42,0.07)] backdrop-blur-xl">
        <div
          className="flex flex-wrap items-center gap-2 px-2.5 py-2.5"
          role="tablist"
          aria-label="Counselor workspaces"
        >
          {navItems.map((item) => {
            const palettes = {
              overview: {
                idle: "border-[#c5d3df] bg-[#f3f7fb] text-[#17324d]",
                active: "border-[#17324d] bg-[#17324d] text-white",
              },
              students: {
                idle: "border-sky-200 bg-sky-50 text-sky-800",
                active: "border-sky-600 bg-sky-600 text-white",
              },
              applications: {
                idle: "border-emerald-200 bg-emerald-50 text-emerald-800",
                active: "border-emerald-600 bg-emerald-600 text-white",
              },
              universities: {
                idle: "border-teal-200 bg-teal-50 text-teal-800",
                active: "border-teal-600 bg-teal-600 text-white",
              },
              documents: {
                idle: "border-amber-200 bg-amber-50 text-amber-800",
                active: "border-amber-500 bg-amber-500 text-white",
              },
              tasks: {
                idle: "border-orange-200 bg-orange-50 text-orange-800",
                active: "border-orange-500 bg-orange-500 text-white",
              },
              support: {
                idle: "border-rose-200 bg-rose-50 text-rose-800",
                active: "border-rose-500 bg-rose-500 text-white",
              },
              communications: {
                idle: "border-pink-200 bg-pink-50 text-pink-800",
                active: "border-pink-500 bg-pink-500 text-white",
              },
              appointments: {
                idle: "border-fuchsia-200 bg-fuchsia-50 text-fuchsia-800",
                active: "border-fuchsia-500 bg-fuchsia-500 text-white",
              },
              workload: {
                idle: "border-orange-200 bg-[#fff4e8] text-orange-800",
                active: "border-orange-600 bg-orange-600 text-white",
              },
              analytics: {
                idle: "border-violet-200 bg-violet-50 text-violet-800",
                active: "border-violet-600 bg-violet-600 text-white",
              },
            };

            const palette = palettes[item.key] || palettes.overview;
            const isActive = activeView === item.key;

            return (
              <button
                key={item.key}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => jumpTo(item.key)}
                className={`shrink-0 whitespace-nowrap rounded-xl border-2 px-3.5 py-2.5 text-xs font-black shadow-sm transition hover:-translate-y-0.5 hover:shadow-md sm:text-sm ${
                  isActive ? palette.active : palette.idle
                }`}
              >
                {item.label}

                {typeof item.badge === "number" ? (
                  <span
                    className={`ml-1.5 rounded-full px-1.5 py-0.5 text-[10px] ${
                      isActive
                        ? "bg-white/20 text-white"
                        : "bg-white/75 text-[#607487]"
                    }`}
                  >
                    {item.badge}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      </div>

      {studentQueue.length === 0 && !loading && !error ? (
        <div
          role="status"
          className="mb-5 flex flex-col gap-1 rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
        >
          <p className="text-xs font-black text-amber-800">
            No assigned students in the current counselor scope.
          </p>
          <p className="text-[11px] leading-5 text-amber-700">
            Data remains safely scoped until assignment records are available.
          </p>
        </div>
      ) : null}

      <Suspense fallback={<CounselorModuleLoader />}>
        {renderView()}
      </Suspense>

      <StudentCommandDrawer student={selectedStudent} onClose={() => setSelectedStudent(null)} onJump={jumpTo} />
    </section>
  );
}
