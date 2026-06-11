import React, { useMemo, useState } from "react";
import AssignedStudentsWorkspace from "./AssignedStudentsWorkspace";
import CounselorApplicationsWorkspace from "./CounselorApplicationsWorkspace";
import CounselorDocumentsWorkspace from "./CounselorDocumentsWorkspace";
import CounselorTasksWorkspace from "./CounselorTasksWorkspace";
import CounselorUniversitiesWorkspace from "./CounselorUniversitiesWorkspace";
import CounselorWorkloadPanel from "./CounselorWorkloadPanel";
import CounselorSupportWorkspace from "./CounselorSupportWorkspace";
import CounselorCommunicationHub from "./CounselorCommunicationHub";
import CounselorAppointmentsWorkspace from "./CounselorAppointmentsWorkspace";
import { buildCounselorNavigation, buildPriorityStudentQueue, formatRelativeTime } from "../../lib/counselorPortal";

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

function MetricCard({ label, value, helper, tone = "slate", onClick, active = false }) {
  const tones = {
    slate: "border-white/10 bg-white/[0.04]",
    cyan: "border-cyan-400/20 bg-cyan-400/10",
    rose: "border-rose-400/20 bg-rose-400/10",
    emerald: "border-emerald-400/20 bg-emerald-400/10",
    amber: "border-amber-400/20 bg-amber-400/10",
    violet: "border-violet-400/20 bg-violet-400/10",
  };

  const Component = onClick ? "button" : "div";

  return (
    <Component
      type={onClick ? "button" : undefined}
      onClick={onClick}
      className={`rounded-3xl border p-5 text-left shadow-xl shadow-slate-950/20 transition ${
        tones[tone] || tones.slate
      } ${onClick ? "hover:-translate-y-0.5 hover:bg-white/[0.08]" : ""} ${
        active ? "ring-2 ring-white/40" : ""
      }`}
    >
      <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">{label}</p>
      <p className="mt-3 text-3xl font-black text-white">{value}</p>
      {helper ? <p className="mt-2 text-sm text-slate-400">{helper}</p> : null}
    </Component>
  );
}

function EmptyState({ title, message, action, onAction, detail }) {
  return (
    <div className="rounded-3xl border border-dashed border-white/15 bg-white/[0.03] p-8 text-center">
      <h3 className="text-lg font-bold text-white">{title}</h3>
      <p className="mx-auto mt-2 max-w-2xl text-sm text-slate-400">{message}</p>
      {detail ? (
        <p className="mx-auto mt-3 max-w-2xl rounded-2xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-xs text-rose-100">
          {detail}
        </p>
      ) : null}
      {action ? (
        <button
          type="button"
          onClick={onAction}
          className="mt-5 rounded-2xl border border-cyan-400/30 bg-cyan-400/10 px-5 py-3 text-sm font-bold text-cyan-100 hover:bg-cyan-400/20"
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
      <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-cyan-300">Executive Counselor Brief</p>
        <h2 className="mt-2 text-2xl font-black">{executiveBrief?.headline || "Healthy workload"}</h2>
        <p className="mt-2 text-sm leading-6 text-slate-300">
          {workload?.executiveSummary || "No counselor workload summary available yet."}
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          {(actions.length ? actions : ["Review assigned students.", "Update counselor task queue."]).slice(0, 5).map((item) => (
            <span key={item} className="rounded-full border border-white/10 bg-slate-950/50 px-3 py-1 text-xs font-bold text-slate-300">
              {item}
            </span>
          ))}
        </div>
      </div>

      <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-violet-300">Performance Engine</p>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <button type="button" onClick={() => onJump("analytics")} className="rounded-2xl border border-white/10 bg-slate-950/50 p-4 text-left hover:bg-white/[0.06]">
            <p className="text-xs text-slate-400">Grade</p>
            <p className="mt-1 text-xl font-black">{performance?.performanceGrade || "Pending"}</p>
          </button>
          <button type="button" onClick={() => onJump("applications")} className="rounded-2xl border border-white/10 bg-slate-950/50 p-4 text-left hover:bg-white/[0.06]">
            <p className="text-xs text-slate-400">Conversion</p>
            <p className="mt-1 text-xl font-black">{performance?.conversionRate || 0}%</p>
          </button>
          <button type="button" onClick={() => onJump("students")} className="rounded-2xl border border-white/10 bg-slate-950/50 p-4 text-left hover:bg-white/[0.06]">
            <p className="text-xs text-slate-400">Activation</p>
            <p className="mt-1 text-xl font-black">{performance?.activationRate || 0}%</p>
          </button>
          <button type="button" onClick={() => onJump("appointments")} className="rounded-2xl border border-white/10 bg-slate-950/50 p-4 text-left hover:bg-white/[0.06]">
            <p className="text-xs text-slate-400">Visa Progress</p>
            <p className="mt-1 text-xl font-black">{performance?.visaProgressRate || 0}%</p>
          </button>
        </div>
      </div>
    </div>
  );
}

function AnalyticsStat({ label, value, helper, tone = "slate" }) {
  const tones = {
    slate: "border-white/10 bg-white/[0.035]",
    cyan: "border-cyan-400/20 bg-cyan-500/10",
    emerald: "border-emerald-400/20 bg-emerald-500/10",
    amber: "border-amber-400/20 bg-amber-500/10",
    rose: "border-rose-400/20 bg-rose-500/10",
    violet: "border-violet-400/20 bg-violet-500/10",
  };

  return (
    <div className={`rounded-3xl border p-5 ${tones[tone] || tones.slate}`}>
      <p className="text-xs font-black uppercase tracking-[0.22em] text-slate-500">{label}</p>
      <p className="mt-3 text-3xl font-black text-white">{value}</p>
      {helper ? <p className="mt-2 text-sm leading-5 text-slate-400">{helper}</p> : null}
    </div>
  );
}

function AnalyticsProgress({ label, value, detail, tone = "cyan" }) {
  const clean = Math.max(0, Math.min(100, safeNumber(value)));
  const barTone =
    tone === "emerald"
      ? "bg-emerald-300"
      : tone === "amber"
      ? "bg-amber-300"
      : tone === "rose"
      ? "bg-rose-300"
      : tone === "violet"
      ? "bg-violet-300"
      : "bg-cyan-300";

  return (
    <div className="rounded-3xl border border-white/10 bg-slate-950/50 p-5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-black uppercase tracking-[0.22em] text-slate-500">{label}</p>
        <p className="text-sm font-black text-white">{clean}%</p>
      </div>
      <div className="mt-4 h-3 overflow-hidden rounded-full bg-white/10">
        <div className={`h-full rounded-full ${barTone}`} style={{ width: `${clean}%` }} />
      </div>
      {detail ? <p className="mt-3 text-xs leading-5 text-slate-400">{detail}</p> : null}
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
    <div className="space-y-6">
      <div className="rounded-3xl border border-violet-400/20 bg-violet-500/[0.05] p-6 shadow-2xl shadow-slate-950/20">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-violet-300">Performance Analytics</p>
            <h2 className="mt-2 text-3xl font-black text-white">Counselor Analytics Dashboard</h2>
            <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-300">
              Separate analytics view for activation, conversion, visa progress, task completion, communication coverage, support pressure, and counselor performance health.
            </p>
          </div>
          <div className="rounded-3xl border border-white/10 bg-slate-950/50 px-5 py-4 text-center">
            <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Grade</p>
            <p className="mt-2 text-2xl font-black text-white">{performance?.performanceGrade || "Pending"}</p>
          </div>
        </div>
      </div>

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
        <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-5">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-cyan-300">Performance Movement</p>
          <h3 className="mt-1 text-xl font-black text-white">Counselor conversion funnel</h3>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <AnalyticsProgress label="Activation Rate" value={performance?.activationRate || 0} detail="Assigned students with meaningful stage movement." tone="cyan" />
            <AnalyticsProgress label="Conversion Rate" value={performance?.conversionRate || 0} detail="Students moved to offer-stage or later." tone="emerald" />
            <AnalyticsProgress label="Visa Progress" value={performance?.visaProgressRate || 0} detail="Students progressed into visa-stage or beyond." tone="violet" />
            <AnalyticsProgress label="Task Completion" value={taskCompletion} detail={`${derived.completedTasks} completed from ${derived.tasks} tracked tasks.`} tone="amber" />
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-5">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-rose-300">Operational Analytics</p>
          <h3 className="mt-1 text-xl font-black text-white">Pressure and quality signals</h3>
          <div className="mt-5 grid gap-3">
            <AnalyticsProgress label="Support Load" value={supportLoad} detail={`${derived.support} support item(s) across ${derived.students} assigned student(s).`} tone="rose" />
            <AnalyticsProgress label="Communication Coverage" value={communicationCoverage} detail={`${derived.communications} communication record(s) across assigned scope.`} tone="cyan" />
            <AnalyticsStat label="Critical Documents" value={derived.criticalDocuments} helper="missing/rejected/expired documents" tone={derived.criticalDocuments ? "rose" : "emerald"} />
            <AnalyticsStat label="Open Tasks" value={derived.openTasks} helper="remaining task pressure" tone={derived.openTasks > 10 ? "rose" : "amber"} />
          </div>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-5">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-slate-500">Executive Analytics Summary</p>
          <p className="mt-3 text-sm leading-6 text-slate-300">
            {executiveBrief?.headline || "Counselor analytics are ready."}
          </p>
          <p className="mt-3 text-xs font-black uppercase tracking-[0.18em] text-cyan-300">
            Focus: {executiveBrief?.focus || workload?.recommendedFocus || "Pipeline nurturing"}
          </p>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-5">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-slate-500">Analytics Recommendation</p>
          <p className="mt-3 text-sm leading-6 text-slate-300">
            {(executiveBrief?.recommendedActions || [])[0] ||
              "Use analytics to improve activation, reduce open task pressure, and push conversion-ready students forward."}
          </p>
        </div>
      </div>
    </div>
  );
}

function StudentCommandDrawer({ student, onClose, onJump }) {
  if (!student) return null;

  return (
    <div className="fixed inset-0 z-[80] bg-slate-950/70 backdrop-blur-sm">
      <button type="button" aria-label="Close drawer" className="absolute inset-0 cursor-default" onClick={onClose} />
      <aside className="absolute right-0 top-0 h-full w-full max-w-xl overflow-y-auto border-l border-white/10 bg-slate-950 p-6 shadow-2xl shadow-black">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-cyan-300">Student Command Drawer</p>
            <h2 className="mt-2 text-3xl font-black">{student.name}</h2>
            <p className="mt-1 text-sm text-slate-400">{student.email || "No email"} · {student.phone || "No phone"}</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-bold hover:bg-white/10">
            Close
          </button>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-cyan-400/20 bg-cyan-400/10 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-cyan-200">Stage</p>
            <p className="mt-1 font-black">{student.stage}</p>
          </div>
          <div className="rounded-2xl border border-rose-400/20 bg-rose-400/10 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-rose-200">Risk</p>
            <p className="mt-1 font-black">{student.riskScore}</p>
          </div>
          <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-emerald-200">Opportunity</p>
            <p className="mt-1 font-black">{student.opportunityScore}</p>
          </div>
          <div className="rounded-2xl border border-amber-400/20 bg-amber-400/10 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-amber-200">Open Work</p>
            <p className="mt-1 font-black">{student.openTasks || 0} tasks</p>
          </div>
        </div>

        <div className="mt-6 rounded-3xl border border-white/10 bg-white/[0.04] p-5">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Next Best Action</p>
          <p className="mt-2 text-sm font-semibold text-slate-100">{student.nextBestAction}</p>
          <p className="mt-2 text-xs text-slate-500">Last activity {formatRelativeTime(student.lastActivityAt || student.updated_at || student.created_at)}</p>
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
              className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-left text-sm font-bold text-slate-200 hover:bg-white/[0.08]"
            >
              <span className="capitalize">{key}</span>
              <span className="text-slate-400">{label}</span>
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
  const [activeView, setActiveView] = useState("overview");
  const [selectedStudent, setSelectedStudent] = useState(null);

  const navItems = useMemo(() => buildCounselorNavigation(metrics), [metrics]);
  const studentQueue = useMemo(() => buildPriorityStudentQueue(snapshot || {}), [snapshot]);
  const lastLoaded = snapshot?.loadedAt ? formatRelativeTime(snapshot.loadedAt) : "not loaded yet";

  const jumpTo = (view) => setActiveView(view);

  const renderView = () => {
    if (loading) {
      return (
        <EmptyState
          title="Loading counselor workspace"
          message="Fetching assigned students, support queues, applications, documents, tasks, appointments, and communication history."
        />
      );
    }

    if (error) {
      return (
        <EmptyState
          title="Portal load issue"
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
      <div>
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
      </div>
    );
  };

  return (
    <section className="relative mx-auto max-w-7xl px-6 py-6">
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm text-slate-400">Last sync: {refreshing ? "refreshing now..." : lastLoaded}</p>
          <p className="mt-1 text-sm text-slate-300">
            Welcome back, <span className="font-bold text-white">{counselor.displayName}</span>. Your next priority is{" "}
            {workload?.recommendedFocus || "student movement"}.
          </p>
        </div>
        <button
          type="button"
          onClick={onRefresh}
          disabled={loading || refreshing}
          className="rounded-2xl border border-cyan-400/30 bg-cyan-400/10 px-5 py-3 text-sm font-bold text-cyan-100 transition hover:bg-cyan-400/20 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {refreshing ? "Refreshing..." : "Refresh Counselor OS"}
        </button>
      </div>

      <div className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-6">
        <MetricCard label="Assigned" value={metrics.assignedStudents || 0} helper="active students" tone="cyan" onClick={() => jumpTo("students")} active={activeView === "students"} />
        <MetricCard label="At Risk" value={metrics.atRiskStudents || 0} helper="need recovery" tone="rose" onClick={() => jumpTo("students")} />
        <MetricCard label="Conversion" value={metrics.conversionReady || 0} helper="ready to move" tone="emerald" onClick={() => jumpTo("applications")} />
        <MetricCard label="Tasks" value={metrics.openTasks || 0} helper={`${metrics.overdueTasks || 0} overdue`} tone="amber" onClick={() => jumpTo("tasks")} />
        <MetricCard label="Support" value={metrics.supportQueue || 0} helper="queue items" tone="violet" onClick={() => jumpTo("support")} />
        <MetricCard label="Performance" value={performance?.performanceGrade || "—"} helper={`${performance?.conversionRate || 0}% conversion`} onClick={() => jumpTo("analytics")} active={activeView === "analytics"} />
      </div>

      <div className="mb-6 flex flex-wrap gap-2 rounded-3xl border border-white/10 bg-white/[0.03] p-2">
        {navItems.map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => setActiveView(item.key)}
            className={`rounded-2xl px-4 py-2 text-sm font-bold transition ${
              activeView === item.key ? "bg-white text-slate-950" : "text-slate-300 hover:bg-white/10 hover:text-white"
            }`}
          >
            {item.label}
            {typeof item.badge === "number" ? (
              <span className="ml-2 rounded-full bg-slate-900/15 px-2 py-0.5 text-xs">{item.badge}</span>
            ) : null}
          </button>
        ))}
      </div>

      {studentQueue.length === 0 && !loading && !error ? (
        <div className="mb-6 rounded-3xl border border-amber-400/20 bg-amber-400/10 p-5 text-sm text-amber-100">
          No assigned-student scope is enforced yet. If this portal is showing too much or too little data,
          the next JS pass should connect the counselor assignment engine to your real Supabase columns.
        </div>
      ) : null}

      {renderView()}

      <StudentCommandDrawer student={selectedStudent} onClose={() => setSelectedStudent(null)} onJump={jumpTo} />
    </section>
  );
}
