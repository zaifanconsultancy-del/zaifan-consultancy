import React, { useMemo, useState } from "react";
import {
  buildPriorityStudentQueue,
  createCounselorTask,
  formatRelativeTime,
  logCounselorCommunication,
  writeCounselorTimelineEvent,
} from "../../lib/counselorPortal";

const FILTERS = [
  { key: "all", label: "All" },
  { key: "risk", label: "Risk" },
  { key: "conversion", label: "Conversion" },
  { key: "stalled", label: "Stalled" },
  { key: "support", label: "Support" },
  { key: "documents", label: "Documents" },
];

const SORTS = [
  { key: "priority", label: "Priority" },
  { key: "risk", label: "Risk" },
  { key: "opportunity", label: "Opportunity" },
  { key: "velocity", label: "Velocity" },
  { key: "stalled", label: "Stalled Days" },
];

function safeString(value, fallback = "") {
  if (value === null || value === undefined) return fallback;
  return String(value);
}


function normalizeCounselor(counselor = {}) {
  return {
    ...counselor,
    name:
      counselor.displayName ||
      counselor.full_name ||
      counselor.name ||
      counselor.email ||
      "Counselor",
    email: counselor.email || counselor.user_email || null,
  };
}

function buildStudentActionContext(student = {}, counselor = {}) {
  return {
    student,
    counselor: normalizeCounselor(counselor),
    studentId: student.student_id || student.inquiry_id || student.appointment_id || student.id || null,
    studentType: student.student_type || student.record_type || student.source_type || "inquiry",
    source: "counselor_portal",
  };
}

function riskTone(score) {
  if (score >= 75) return "border-rose-400/30 bg-rose-500/10 text-rose-100";
  if (score >= 55) return "border-amber-400/30 bg-amber-500/10 text-amber-100";
  return "border-emerald-400/30 bg-emerald-500/10 text-emerald-100";
}

function stageTone(stage = "") {
  const value = safeString(stage).toLowerCase();

  if (value.includes("visa")) return "border-violet-400/25 bg-violet-400/10 text-violet-100";
  if (value.includes("cas")) return "border-indigo-400/25 bg-indigo-400/10 text-indigo-100";
  if (value.includes("offer")) return "border-emerald-400/25 bg-emerald-400/10 text-emerald-100";
  if (value.includes("application")) return "border-cyan-400/25 bg-cyan-400/10 text-cyan-100";
  if (value.includes("shortlist")) return "border-amber-400/25 bg-amber-400/10 text-amber-100";

  return "border-slate-400/20 bg-white/[0.04] text-slate-200";
}

function StatusToast({ status, onClear }) {
  if (!status?.message) return null;

  const tone =
    status.type === "error"
      ? "border-rose-400/25 bg-rose-500/10 text-rose-100"
      : "border-emerald-400/25 bg-emerald-500/10 text-emerald-100";

  return (
    <div className={`mb-4 flex items-start justify-between gap-4 rounded-2xl border px-4 py-3 text-sm font-semibold ${tone}`}>
      <span>{status.message}</span>
      <button type="button" onClick={onClear} className="text-xs opacity-70 hover:opacity-100">
        Clear
      </button>
    </div>
  );
}

function QueueStat({ label, value, helper, tone = "slate" }) {
  const tones = {
    slate: "border-white/10 bg-white/[0.04]",
    rose: "border-rose-400/20 bg-rose-500/10",
    amber: "border-amber-400/20 bg-amber-500/10",
    emerald: "border-emerald-400/20 bg-emerald-500/10",
    cyan: "border-cyan-400/20 bg-cyan-500/10",
    violet: "border-violet-400/20 bg-violet-500/10",
  };

  return (
    <div className={`rounded-2xl border p-4 ${tones[tone] || tones.slate}`}>
      <p className="text-xs font-bold uppercase tracking-[0.22em] text-slate-400">{label}</p>
      <p className="mt-2 text-2xl font-black text-white">{value}</p>
      {helper ? <p className="mt-1 text-xs text-slate-400">{helper}</p> : null}
    </div>
  );
}

function StudentActionPanel({ student, counselor, onRefresh, setStatus }) {
  const [saving, setSaving] = useState("");

  async function quickTask() {
    setSaving("task");
    setStatus(null);

    try {
      await createCounselorTask({
        ...buildStudentActionContext(student, counselor),
        title: student.nextBestAction || "Counselor follow-up",
        description: `Priority action for ${student.name}: ${student.nextBestAction || "Counselor follow-up"}`,
        priority: student.riskScore >= 70 ? "Urgent" : "Normal",
        category: student.isAtRisk
          ? "Risk Recovery"
          : student.isConversionReady
          ? "Conversion Movement"
          : "Counselor Follow-up",
      });

      await writeCounselorTimelineEvent({
        ...buildStudentActionContext(student, counselor),
        eventType: "counselor_task_created",
        title: "Counselor task created",
        description: student.nextBestAction || "Counselor follow-up task created.",
      });

      setStatus({ type: "success", message: `Task created for ${student.name}.` });
      onRefresh?.();
    } catch (error) {
      console.error("Create counselor task failed", error);
      setStatus({
        type: "error",
        message: `Task could not be created: ${error.message}`,
      });
    } finally {
      setSaving("");
    }
  }

  async function logCall() {
    setSaving("call");
    setStatus(null);

    try {
      await logCounselorCommunication({
        ...buildStudentActionContext(student, counselor),
        channel: "Call",
        subject: "Counselor follow-up call",
        message: student.nextBestAction || "Counselor follow-up call logged.",
      });

      await writeCounselorTimelineEvent({
        ...buildStudentActionContext(student, counselor),
        eventType: "counselor_call_logged",
        title: "Counselor follow-up logged",
        description: student.nextBestAction || "Counselor call logged.",
      });

      setStatus({ type: "success", message: `Call logged for ${student.name}.` });
      onRefresh?.();
    } catch (error) {
      console.error("Log counselor call failed", error);
      setStatus({
        type: "error",
        message: `Communication could not be logged: ${error.message}`,
      });
    } finally {
      setSaving("");
    }
  }

  async function logReview() {
    setSaving("review");
    setStatus(null);

    try {
      await writeCounselorTimelineEvent({
        ...buildStudentActionContext(student, counselor),
        eventType: "counselor_review",
        title: "Counselor reviewed student priority",
        description: student.nextBestAction || "Student reviewed from Assigned Students Workspace.",
      });

      setStatus({ type: "success", message: `Review logged for ${student.name}.` });
      onRefresh?.();
    } catch (error) {
      console.error("Log counselor review failed", error);
      setStatus({
        type: "error",
        message: `Review could not be logged: ${error.message}`,
      });
    } finally {
      setSaving("");
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        onClick={quickTask}
        disabled={Boolean(saving)}
        className="rounded-xl border border-cyan-400/30 bg-cyan-400/10 px-3 py-2 text-xs font-bold text-cyan-100 hover:bg-cyan-400/20 disabled:opacity-50"
      >
        {saving === "task" ? "Creating..." : "Create Task"}
      </button>

      <button
        type="button"
        onClick={logCall}
        disabled={Boolean(saving)}
        className="rounded-xl border border-emerald-400/30 bg-emerald-400/10 px-3 py-2 text-xs font-bold text-emerald-100 hover:bg-emerald-400/20 disabled:opacity-50"
      >
        {saving === "call" ? "Logging..." : "Log Call"}
      </button>

      <button
        type="button"
        onClick={logReview}
        disabled={Boolean(saving)}
        className="rounded-xl border border-violet-400/30 bg-violet-400/10 px-3 py-2 text-xs font-bold text-violet-100 hover:bg-violet-400/20 disabled:opacity-50"
      >
        {saving === "review" ? "Saving..." : "Log Review"}
      </button>
    </div>
  );
}

function StudentScoreBar({ label, value, tone = "cyan" }) {
  const width = Math.max(0, Math.min(100, Number(value) || 0));

  const tones = {
    cyan: "bg-cyan-300",
    rose: "bg-rose-300",
    emerald: "bg-emerald-300",
    amber: "bg-amber-300",
    violet: "bg-violet-300",
  };

  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs">
        <span className="font-bold text-slate-400">{label}</span>
        <span className="text-slate-300">{width}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-white/10">
        <div className={`h-full rounded-full ${tones[tone] || tones.cyan}`} style={{ width: `${width}%` }} />
      </div>
    </div>
  );
}

function StudentCard({ student, counselor, onRefresh, onSelectStudent, setStatus, compact }) {
  return (
    <article className="rounded-3xl border border-white/10 bg-slate-950/50 p-4 transition hover:border-cyan-400/25 hover:bg-slate-900/70">
      <div className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr_0.7fr] xl:items-center">
        <button type="button" onClick={() => onSelectStudent?.(student)} className="text-left">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-lg font-black text-white hover:text-cyan-200">{student.name}</h3>
            {student.isAtRisk ? (
              <span className="rounded-full border border-rose-400/25 bg-rose-400/10 px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.18em] text-rose-100">
                Risk
              </span>
            ) : null}
            {student.isConversionReady ? (
              <span className="rounded-full border border-emerald-400/25 bg-emerald-400/10 px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.18em] text-emerald-100">
                Convert
              </span>
            ) : null}
          </div>

          <p className="mt-1 text-sm text-slate-400">
            {student.email || "No email"} · {student.phone || "No phone"}
          </p>

          <div className="mt-3 flex flex-wrap gap-2">
            <span className={`rounded-full border px-3 py-1 text-xs font-bold ${stageTone(student.stage)}`}>
              {student.stage}
            </span>

            <span className={`rounded-full border px-3 py-1 text-xs font-bold ${riskTone(student.riskScore)}`}>
              Risk {student.riskScore}
            </span>

            <span className="rounded-full border border-violet-400/25 bg-violet-400/10 px-3 py-1 text-xs font-bold text-violet-100">
              Opportunity {student.opportunityScore}
            </span>

            <span className="rounded-full border border-emerald-400/25 bg-emerald-400/10 px-3 py-1 text-xs font-bold text-emerald-100">
              Velocity {student.velocityScore || 0}
            </span>

            {student.stalledDays >= 14 ? (
              <span className="rounded-full border border-amber-400/25 bg-amber-400/10 px-3 py-1 text-xs font-bold text-amber-100">
                Stalled {student.stalledDays}d
              </span>
            ) : null}

            {student.openSupport ? (
              <span className="rounded-full border border-rose-400/25 bg-rose-400/10 px-3 py-1 text-xs font-bold text-rose-100">
                Support {student.openSupport}
              </span>
            ) : null}
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2 text-center">
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-2">
              <p className="text-xs font-black text-white">{student.applicationsCount || 0}</p>
              <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">Apps</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-2">
              <p className="text-xs font-black text-white">{student.documentsCount || 0}</p>
              <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">Docs</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-2">
              <p className="text-xs font-black text-white">{student.openTasks || 0}</p>
              <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">Tasks</p>
            </div>
          </div>
        </button>

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Next Best Action</p>
          <p className="mt-2 text-sm font-semibold text-slate-100">{student.nextBestAction}</p>
          <p className="mt-2 text-xs text-slate-500">Next milestone: {student.nextMilestone || "Counselor Review"}</p>
          <p className="mt-1 text-xs text-slate-500">
            Updated {formatRelativeTime(student.lastActivityAt || student.updated_at || student.created_at)}
          </p>

          {!compact ? (
            <div className="mt-4 space-y-3">
              <StudentScoreBar label="Risk pressure" value={student.riskScore} tone="rose" />
              <StudentScoreBar label="Opportunity strength" value={student.opportunityScore} tone="emerald" />
              <StudentScoreBar label="Journey velocity" value={student.velocityScore || 0} tone="cyan" />
            </div>
          ) : null}
        </div>

        {!compact ? (
          <div className="space-y-3">
            <StudentActionPanel student={student} counselor={counselor} onRefresh={onRefresh} setStatus={setStatus} />

            <button
              type="button"
              onClick={() => onSelectStudent?.(student)}
              className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-bold text-slate-200 hover:bg-white/[0.08]"
            >
              Open Command Drawer
            </button>
          </div>
        ) : null}
      </div>
    </article>
  );
}

export default function AssignedStudentsWorkspace({
  snapshot,
  counselor,
  onRefresh,
  onSelectStudent,
  compact = false,
}) {
  const [filter, setFilter] = useState("all");
  const [sort, setSort] = useState("priority");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState(null);

  const queue = useMemo(() => buildPriorityStudentQueue(snapshot || {}), [snapshot]);

  const queueStats = useMemo(() => {
    const total = queue.length;
    const risk = queue.filter((student) => student.isAtRisk).length;
    const conversion = queue.filter((student) => student.isConversionReady).length;
    const stalled = queue.filter((student) => student.isStalled).length;
    const support = queue.filter((student) => Number(student.openSupport || 0) > 0).length;
    const documents = queue.filter((student) => Number(student.missingDocuments || 0) > 0).length;

    return { total, risk, conversion, stalled, support, documents };
  }, [queue]);

  const filteredQueue = useMemo(() => {
    const search = query.trim().toLowerCase();

    let next = queue;

    if (filter === "risk") next = next.filter((student) => student.isAtRisk);
    if (filter === "conversion") next = next.filter((student) => student.isConversionReady);
    if (filter === "stalled") next = next.filter((student) => student.isStalled);
    if (filter === "support") next = next.filter((student) => Number(student.openSupport || 0) > 0);
    if (filter === "documents") next = next.filter((student) => Number(student.missingDocuments || 0) > 0);

    if (search) {
      next = next.filter((student) =>
        [
          student.name,
          student.email,
          student.phone,
          student.stage,
          student.nextMilestone,
          student.nextBestAction,
        ]
          .map((value) => safeString(value).toLowerCase())
          .join(" ")
          .includes(search)
      );
    }

    const sorted = [...next].sort((a, b) => {
      if (sort === "risk") return Number(b.riskScore || 0) - Number(a.riskScore || 0);
      if (sort === "opportunity") return Number(b.opportunityScore || 0) - Number(a.opportunityScore || 0);
      if (sort === "velocity") return Number(b.velocityScore || 0) - Number(a.velocityScore || 0);
      if (sort === "stalled") return Number(b.stalledDays || 0) - Number(a.stalledDays || 0);

      const aPriority =
        Number(a.riskScore || 0) * 1.4 +
        Number(a.opportunityScore || 0) +
        Number(a.openSupport || 0) * 8 +
        Number(a.openTasks || 0) * 4 +
        Number(a.stalledDays || 0);

      const bPriority =
        Number(b.riskScore || 0) * 1.4 +
        Number(b.opportunityScore || 0) +
        Number(b.openSupport || 0) * 8 +
        Number(b.openTasks || 0) * 4 +
        Number(b.stalledDays || 0);

      return bPriority - aPriority;
    });

    return sorted;
  }, [queue, filter, query, sort]);

  const visibleQueue = compact ? filteredQueue.slice(0, 6) : filteredQueue;

  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 shadow-2xl shadow-slate-950/20">
      <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-cyan-300">Assigned Students</p>
          <h2 className="mt-2 text-2xl font-black">Priority Student Queue</h2>
          <p className="mt-1 text-sm text-slate-400">
            Sorted by risk, opportunity, velocity, stalled days, support pressure, document blockers, and next counselor action.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {FILTERS.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => setFilter(item.key)}
              className={`rounded-2xl px-3 py-2 text-xs font-bold ${
                filter === item.key ? "bg-white text-slate-950" : "border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"
              }`}
            >
              {item.label}
              <span className="ml-2 opacity-70">
                {item.key === "all" && queueStats.total}
                {item.key === "risk" && queueStats.risk}
                {item.key === "conversion" && queueStats.conversion}
                {item.key === "stalled" && queueStats.stalled}
                {item.key === "support" && queueStats.support}
                {item.key === "documents" && queueStats.documents}
              </span>
            </button>
          ))}
        </div>
      </div>

      {!compact ? (
        <div className="mb-5 grid gap-3 md:grid-cols-3 xl:grid-cols-6">
          <QueueStat label="Assigned" value={queueStats.total} helper="students" tone="cyan" />
          <QueueStat label="Risk" value={queueStats.risk} helper="recovery queue" tone="rose" />
          <QueueStat label="Convert" value={queueStats.conversion} helper="ready to move" tone="emerald" />
          <QueueStat label="Stalled" value={queueStats.stalled} helper="needs contact" tone="amber" />
          <QueueStat label="Support" value={queueStats.support} helper="open pressure" tone="violet" />
          <QueueStat label="Docs" value={queueStats.documents} helper="blockers" />
        </div>
      ) : null}

      {!compact ? (
        <div className="mb-5 grid gap-3 lg:grid-cols-[1fr_220px]">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search student, email, phone, stage, milestone, or next action..."
            className="rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-cyan-400/40"
          />

          <select
            value={sort}
            onChange={(event) => setSort(event.target.value)}
            className="rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm font-bold text-white outline-none focus:border-cyan-400/40"
          >
            {SORTS.map((item) => (
              <option key={item.key} value={item.key} className="bg-slate-950">
                Sort: {item.label}
              </option>
            ))}
          </select>
        </div>
      ) : null}

      <StatusToast status={status} onClear={() => setStatus(null)} />

      <div className="space-y-3">
        {visibleQueue.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/15 p-6 text-center">
            <p className="text-sm font-bold text-white">No assigned students found.</p>
            <p className="mx-auto mt-2 max-w-2xl text-sm text-slate-400">
              Confirm counselor assignment fields or fallback student scope. This workspace expects records connected through
              student id, inquiry id, appointment id, email, phone, or counselor assignment fields.
            </p>
            {query ? (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="mt-4 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-bold text-slate-200 hover:bg-white/[0.08]"
              >
                Clear Search
              </button>
            ) : null}
          </div>
        ) : (
          visibleQueue.map((student) => (
            <StudentCard
              key={student.id}
              student={student}
              counselor={counselor}
              onRefresh={onRefresh}
              onSelectStudent={onSelectStudent}
              setStatus={setStatus}
              compact={compact}
            />
          ))
        )}
      </div>

      {compact && filteredQueue.length > visibleQueue.length ? (
        <p className="mt-4 text-center text-xs text-slate-500">
          Showing {visibleQueue.length} of {filteredQueue.length} priority students. Open Assigned Students for the full queue.
        </p>
      ) : null}
    </div>
  );
}