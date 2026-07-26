import React, { useEffect, useMemo, useState } from "react";
import {
  buildPriorityStudentQueue,
  createCounselorTask,
  formatRelativeTime,
  logCounselorCommunication,
  writeCounselorTimelineEvent,
} from "../../lib/counselorPortal";

const FILTERS = [
  { key: "all", label: "All" },
  { key: "risk", label: "At Risk" },
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
  { key: "support", label: "Support Pressure" },
  { key: "tasks", label: "Open Tasks" },
  { key: "updated", label: "Recently Updated" },
  { key: "name", label: "Student Name" },
];

const STUDENT_VIEW_STORAGE_KEY = "zaifan_counselor_students_view";
const STUDENT_FILTER_STORAGE_KEY = "zaifan_counselor_students_filter";
const STUDENT_SORT_STORAGE_KEY = "zaifan_counselor_students_sort";

const VALID_FILTER_KEYS = new Set(FILTERS.map((item) => item.key));
const VALID_SORT_KEYS = new Set(SORTS.map((item) => item.key));

const INPUT_CLASS =
  "w-full rounded-2xl border-2 border-[#d8b892] bg-[#fffdf8] px-4 py-3 text-sm font-semibold text-[#102b4c] outline-none transition placeholder:text-slate-400 focus:border-orange-500 focus:ring-4 focus:ring-orange-100";

function safeString(value, fallback = "") {
  if (value === null || value === undefined) return fallback;
  return String(value);
}

function safeNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function safeDateMs(value) {
  if (!value) return 0;

  const parsed = new Date(value).getTime();
  return Number.isFinite(parsed) ? parsed : 0;
}

function readSessionValue(key, fallback) {
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
    // Storage is optional. Counselor workflow should continue without it.
  }
}

function normalizeFilterKey(value) {
  return VALID_FILTER_KEYS.has(value) ? value : "all";
}

function normalizeSortKey(value) {
  return VALID_SORT_KEYS.has(value) ? value : "priority";
}

function getStudentStableKey(student = {}, index = 0) {
  return (
    student.person_id ||
    student.id ||
    student.student_id ||
    student.inquiry_id ||
    student.appointment_id ||
    student.email ||
    `student-${index}`
  );
}

function getStudentUpdatedAt(student = {}) {
  return (
    student.lastActivityAt ||
    student.last_activity_at ||
    student.updated_at ||
    student.updatedAt ||
    student.created_at ||
    student.createdAt ||
    null
  );
}

function getPriorityScore(student = {}) {
  return (
    safeNumber(student.riskScore) * 1.4 +
    safeNumber(student.opportunityScore) +
    safeNumber(student.openSupport) * 8 +
    safeNumber(student.openTasks) * 4 +
    safeNumber(student.missingDocuments) * 5 +
    safeNumber(student.stalledDays) +
    (student.isAtRisk ? 18 : 0) +
    (student.isConversionReady ? 12 : 0) +
    (student.isStalled ? 8 : 0)
  );
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
  const normalizedCounselor = normalizeCounselor(counselor);

  return {
    student,
    counselor: normalizedCounselor,
    personId: student.person_id || null,
    studentId:
      student.person_id ||
      student.student_id ||
      student.inquiry_id ||
      student.appointment_id ||
      student.id ||
      null,
    studentType:
      student.student_type ||
      student.record_type ||
      student.source_type ||
      "inquiry",
    source: "counselor_portal",
    metadata: {
      personId: student.person_id || null,
      legacyStudentId: student.student_id || null,
      inquiryId: student.inquiry_id || null,
      appointmentId: student.appointment_id || null,
      counselorEmail: normalizedCounselor.email,
      stage: student.stage,
      riskScore: safeNumber(student.riskScore),
      opportunityScore: safeNumber(student.opportunityScore),
      velocityScore: safeNumber(student.velocityScore),
      stalledDays: safeNumber(student.stalledDays),
      openTasks: safeNumber(student.openTasks),
      openSupport: safeNumber(student.openSupport),
      missingDocuments: safeNumber(student.missingDocuments),
    },
  };
}

function riskTone(score) {
  if (score >= 75) return "border-rose-300 bg-rose-50 text-rose-700";
  if (score >= 55) return "border-amber-300 bg-amber-50 text-amber-700";
  return "border-emerald-300 bg-emerald-50 text-emerald-700";
}

function stageTone(stage = "") {
  const value = safeString(stage).toLowerCase();

  if (value.includes("visa")) return "border-[#173f69] bg-[#173f69] text-white";
  if (value.includes("cas")) return "border-[#234e78] bg-[#234e78] text-white";
  if (value.includes("offer")) return "border-emerald-300 bg-emerald-50 text-emerald-700";
  if (value.includes("application")) return "border-orange-300 bg-orange-50 text-orange-700";
  if (value.includes("shortlist")) return "border-amber-300 bg-amber-50 text-amber-700";

  return "border-[#b7c5d1] bg-[#f1f6fa] text-[#173f69]";
}

function StatusToast({ status, onClear }) {
  if (!status?.message) return null;

  const tone =
    status.type === "error"
      ? "border-rose-300 bg-rose-50 text-rose-800"
      : "border-emerald-300 bg-emerald-50 text-emerald-800";

  return (
    <div
      role="status"
      className={`mb-4 flex items-start justify-between gap-4 rounded-2xl border-2 px-4 py-3 text-sm font-semibold ${tone}`}
    >
      <span>{status.message}</span>
      <button
        type="button"
        onClick={onClear}
        className="rounded-lg px-2 py-1 text-xs font-black hover:bg-black/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-current"
      >
        Clear
      </button>
    </div>
  );
}

function QueueStat({ label, value, helper, tone = "navy" }) {
  const tones = {
    navy: "border-[#173f69] bg-[#f3f7fb]",
    orange: "border-orange-300 bg-orange-50",
    rose: "border-rose-300 bg-rose-50",
    amber: "border-amber-300 bg-amber-50",
    emerald: "border-emerald-300 bg-emerald-50",
    violet: "border-violet-300 bg-violet-50",
  };

  return (
    <div className={`rounded-2xl border-2 p-4 shadow-sm ${tones[tone] || tones.navy}`}>
      <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#607487]">
        {label}
      </p>
      <p className="mt-2 text-2xl font-black text-[#102b4c]">{value}</p>
      {helper ? <p className="mt-1 text-xs font-medium text-[#607487]">{helper}</p> : null}
    </div>
  );
}

function StudentActionPanel({ student, counselor, onRefresh, setStatus }) {
  const [saving, setSaving] = useState("");

  const runAction = async (key, action) => {
    if (saving) return;

    setSaving(key);
    setStatus(null);

    try {
      await action();
      await Promise.resolve(onRefresh?.());
    } catch (error) {
      console.error(`Counselor student action "${key}" failed`, error);

      setStatus({
        type: "error",
        message:
          error?.message ||
          "The counselor action could not be completed. Check Supabase access and try again.",
      });
    } finally {
      setSaving("");
    }
  };

  const quickTask = () =>
    runAction("task", async () => {
      const actionContext = buildStudentActionContext(student, counselor);

      await createCounselorTask({
        ...actionContext,
        title: student.nextBestAction || "Counselor follow-up",
        description: `Priority action for ${student.name}: ${
          student.nextBestAction || "Counselor follow-up"
        }`,
        priority: student.riskScore >= 70 ? "Urgent" : "Normal",
        category: student.isAtRisk
          ? "Risk Recovery"
          : student.isConversionReady
            ? "Conversion Movement"
            : "Counselor Follow-up",
        metadata: {
          ...actionContext.metadata,
          nextMilestone: student.nextMilestone,
          actionSource: "AssignedStudentsWorkspace",
        },
      });

      await writeCounselorTimelineEvent({
        ...actionContext,
        eventType: "counselor_task_created",
        title: "Counselor task created",
        description: student.nextBestAction || "Counselor follow-up task created.",
      });

      setStatus({ type: "success", message: `Task created for ${student.name}.` });
    });

  const logCall = () =>
    runAction("call", async () => {
      const actionContext = buildStudentActionContext(student, counselor);

      await logCounselorCommunication({
        ...actionContext,
        channel: "Call",
        subject: "Counselor follow-up call",
        message: student.nextBestAction || "Counselor follow-up call logged.",
        metadata: {
          ...actionContext.metadata,
          actionSource: "AssignedStudentsWorkspace",
        },
      });

      await writeCounselorTimelineEvent({
        ...actionContext,
        eventType: "counselor_call_logged",
        title: "Counselor follow-up logged",
        description: student.nextBestAction || "Counselor call logged.",
      });

      setStatus({ type: "success", message: `Call logged for ${student.name}.` });
    });

  const logReview = () =>
    runAction("review", async () => {
      const actionContext = buildStudentActionContext(student, counselor);

      await writeCounselorTimelineEvent({
        ...actionContext,
        eventType: "counselor_review",
        title: "Counselor reviewed student priority",
        description:
          student.nextBestAction ||
          "Student reviewed from Assigned Students Workspace.",
        metadata: {
          ...actionContext.metadata,
          actionSource: "AssignedStudentsWorkspace",
        },
      });

      setStatus({ type: "success", message: `Review logged for ${student.name}.` });
    });

  return (
    <div className="grid gap-2 sm:grid-cols-3 xl:grid-cols-1">
      <button
        type="button"
        onClick={quickTask}
        disabled={Boolean(saving)}
        className="rounded-xl border-2 border-orange-500 bg-orange-500 px-3 py-2.5 text-xs font-black text-white transition hover:bg-orange-600 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-orange-100 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {saving === "task" ? "Creating..." : "Create Task"}
      </button>

      <button
        type="button"
        onClick={logCall}
        disabled={Boolean(saving)}
        className="rounded-xl border-2 border-[#173f69] bg-[#173f69] px-3 py-2.5 text-xs font-black text-white transition hover:bg-[#102f52] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {saving === "call" ? "Logging..." : "Log Call"}
      </button>

      <button
        type="button"
        onClick={logReview}
        disabled={Boolean(saving)}
        className="rounded-xl border-2 border-[#b7c5d1] bg-[#f3f7fb] px-3 py-2.5 text-xs font-black text-[#173f69] transition hover:border-[#173f69] hover:bg-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {saving === "review" ? "Saving..." : "Log Review"}
      </button>
    </div>
  );
}

function StudentScoreBar({ label, value, tone = "orange" }) {
  const width = Math.max(0, Math.min(100, Number(value) || 0));

  const tones = {
    orange: "bg-orange-500",
    rose: "bg-rose-500",
    emerald: "bg-emerald-500",
    navy: "bg-[#173f69]",
    amber: "bg-amber-500",
  };

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between text-xs">
        <span className="font-bold text-[#607487]">{label}</span>
        <span className="font-black text-[#102b4c]">{width}</span>
      </div>
      <div className="h-2.5 overflow-hidden rounded-full bg-[#e5edf3]">
        <div
          className={`h-full rounded-full transition-[width] duration-500 ${
            tones[tone] || tones.orange
          }`}
          style={{ width: `${width}%` }}
        />
      </div>
    </div>
  );
}

function StudentCard({
  student,
  counselor,
  onRefresh,
  onSelectStudent,
  setStatus,
  compact,
}) {
  const hasContact = Boolean(student.email || student.phone);
  const blockers =
    safeNumber(student.openSupport) +
    safeNumber(student.missingDocuments) +
    safeNumber(student.openTasks) +
    (student.isStalled ? 1 : 0);

  const operationalTone = student.isAtRisk
    ? "border-rose-300"
    : student.isConversionReady
      ? "border-emerald-300"
      : "border-[#c9d5de]";

  return (
    <article
      className={`rounded-[1.6rem] border-2 ${operationalTone} bg-[#fffdf8] p-4 shadow-[0_10px_30px_rgba(16,43,76,0.06)] transition duration-300 hover:-translate-y-0.5 hover:border-orange-300 hover:shadow-[0_16px_40px_rgba(16,43,76,0.09)] sm:p-5`}
    >
      <div className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr_0.58fr] xl:items-start">
        <button
          type="button"
          onClick={() => onSelectStudent?.(student)}
          className="rounded-2xl text-left focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-orange-100"
        >
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-lg font-black text-[#102b4c] transition hover:text-orange-700">
              {student.name}
            </h3>
            {student.isAtRisk ? (
              <span className="rounded-full border border-rose-300 bg-rose-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.15em] text-rose-700">
                At Risk
              </span>
            ) : null}
            {student.isConversionReady ? (
              <span className="rounded-full border border-emerald-300 bg-emerald-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.15em] text-emerald-700">
                Conversion Ready
              </span>
            ) : null}
          </div>

          <p className="mt-1.5 break-words text-sm font-medium text-[#607487]">
            {student.email || "No email"} · {student.phone || "No phone"}
          </p>

          <div className="mt-2 flex flex-wrap gap-2">
            <span
              className={`rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em] ${
                hasContact
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                  : "border-rose-200 bg-rose-50 text-rose-700"
              }`}
            >
              {hasContact ? "Contact ready" : "Contact missing"}
            </span>

            <span
              className={`rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em] ${
                blockers > 0
                  ? "border-amber-200 bg-amber-50 text-amber-700"
                  : "border-[#b7c5d1] bg-[#f3f7fb] text-[#173f69]"
              }`}
            >
              {blockers > 0 ? `${blockers} blocker signal${blockers === 1 ? "" : "s"}` : "No active blockers"}
            </span>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            <span className={`rounded-full border px-3 py-1 text-xs font-black ${stageTone(student.stage)}`}>
              {student.stage}
            </span>
            <span className={`rounded-full border px-3 py-1 text-xs font-black ${riskTone(student.riskScore)}`}>
              Risk {student.riskScore}
            </span>
            <span className="rounded-full border border-orange-300 bg-orange-50 px-3 py-1 text-xs font-black text-orange-700">
              Opportunity {student.opportunityScore}
            </span>
            <span className="rounded-full border border-[#b7c5d1] bg-[#f3f7fb] px-3 py-1 text-xs font-black text-[#173f69]">
              Velocity {student.velocityScore || 0}
            </span>
            {student.stalledDays >= 14 ? (
              <span className="rounded-full border border-amber-300 bg-amber-50 px-3 py-1 text-xs font-black text-amber-700">
                Stalled {student.stalledDays}d
              </span>
            ) : null}
            {student.openSupport ? (
              <span className="rounded-full border border-rose-300 bg-rose-50 px-3 py-1 text-xs font-black text-rose-700">
                Support {student.openSupport}
              </span>
            ) : null}
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2 text-center">
            {[
              ["Apps", student.applicationsCount || 0],
              ["Docs", student.documentsCount || 0],
              ["Tasks", student.openTasks || 0],
            ].map(([label, value]) => (
              <div
                key={label}
                className="rounded-2xl border border-[#d6e0e7] bg-[#f8fbfd] p-2.5"
              >
                <p className="text-sm font-black text-[#102b4c]">{value}</p>
                <p className="text-[9px] font-black uppercase tracking-[0.14em] text-[#7b8d9d]">
                  {label}
                </p>
              </div>
            ))}
          </div>
        </button>

        <div className="rounded-2xl border-2 border-orange-200 bg-[#fff8ef] p-4">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-orange-700">
            Next Best Action
          </p>
          <p className="mt-2 text-sm font-bold leading-6 text-[#102b4c]">
            {student.nextBestAction}
          </p>
          <div className="mt-3 rounded-xl border border-[#d8b892] bg-[#fffdf8] px-3 py-2">
            <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#7d684f]">
              Next milestone
            </p>
            <p className="mt-1 text-xs font-bold text-[#102b4c]">
              {student.nextMilestone || "Counselor Review"}
            </p>
          </div>
          <p className="mt-2 text-xs text-[#718292]">
            Updated{" "}
            {formatRelativeTime(getStudentUpdatedAt(student))}
          </p>

          {!compact ? (
            <div className="mt-4 space-y-3">
              <StudentScoreBar label="Risk pressure" value={student.riskScore} tone="rose" />
              <StudentScoreBar
                label="Opportunity strength"
                value={student.opportunityScore}
                tone="emerald"
              />
              <StudentScoreBar
                label="Journey velocity"
                value={student.velocityScore || 0}
                tone="navy"
              />
            </div>
          ) : null}
        </div>

        {!compact ? (
          <div className="space-y-3">
            <StudentActionPanel
              student={student}
              counselor={counselor}
              onRefresh={onRefresh}
              setStatus={setStatus}
            />

            <button
              type="button"
              onClick={() => onSelectStudent?.(student)}
              className="w-full rounded-xl border-2 border-orange-300 bg-orange-50 px-3 py-2.5 text-xs font-black text-orange-700 transition hover:border-orange-500 hover:bg-orange-100 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-orange-100"
            >
              Open Student Command
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
  const [filter, setFilter] = useState(() =>
    normalizeFilterKey(readSessionValue(STUDENT_FILTER_STORAGE_KEY, "all"))
  );
  const [sort, setSort] = useState(() =>
    normalizeSortKey(readSessionValue(STUDENT_SORT_STORAGE_KEY, "priority"))
  );
  const [view, setView] = useState(() =>
    readSessionValue(STUDENT_VIEW_STORAGE_KEY, "detailed") === "compact"
      ? "compact"
      : "detailed"
  );
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState(null);

  useEffect(() => {
    writeSessionValue(STUDENT_FILTER_STORAGE_KEY, filter);
  }, [filter]);

  useEffect(() => {
    writeSessionValue(STUDENT_SORT_STORAGE_KEY, sort);
  }, [sort]);

  useEffect(() => {
    writeSessionValue(STUDENT_VIEW_STORAGE_KEY, view);
  }, [view]);

  const queue = useMemo(() => {
    if (Array.isArray(snapshot?.priorityStudents)) return snapshot.priorityStudents;
    return buildPriorityStudentQueue(snapshot || {});
  }, [snapshot]);

  const queueStats = useMemo(() => {
    const total = queue.length;
    const risk = queue.filter((student) => student.isAtRisk).length;
    const conversion = queue.filter((student) => student.isConversionReady).length;
    const stalled = queue.filter((student) => student.isStalled).length;
    const support = queue.filter((student) => Number(student.openSupport || 0) > 0).length;
    const documents = queue.filter(
      (student) => safeNumber(student.missingDocuments) > 0
    ).length;
    const tasks = queue.filter(
      (student) => safeNumber(student.openTasks) > 0
    ).length;
    const contactMissing = queue.filter(
      (student) => !student.email && !student.phone
    ).length;
    const highPriority = queue.filter(
      (student) => getPriorityScore(student) >= 120
    ).length;

    return {
      total,
      risk,
      conversion,
      stalled,
      support,
      documents,
      tasks,
      contactMissing,
      highPriority,
    };
  }, [queue]);

  const filteredQueue = useMemo(() => {
    const search = query.trim().toLowerCase();

    let next = queue;

    if (filter === "risk") next = next.filter((student) => student.isAtRisk);
    if (filter === "conversion")
      next = next.filter((student) => student.isConversionReady);
    if (filter === "stalled") next = next.filter((student) => student.isStalled);
    if (filter === "support")
      next = next.filter((student) => Number(student.openSupport || 0) > 0);
    if (filter === "documents")
      next = next.filter((student) => Number(student.missingDocuments || 0) > 0);

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

    return [...next].sort((a, b) => {
      if (sort === "risk") return Number(b.riskScore || 0) - Number(a.riskScore || 0);
      if (sort === "opportunity")
        return Number(b.opportunityScore || 0) - Number(a.opportunityScore || 0);
      if (sort === "velocity")
        return Number(b.velocityScore || 0) - Number(a.velocityScore || 0);
      if (sort === "stalled")
        return safeNumber(b.stalledDays) - safeNumber(a.stalledDays);
      if (sort === "support")
        return safeNumber(b.openSupport) - safeNumber(a.openSupport);
      if (sort === "tasks")
        return safeNumber(b.openTasks) - safeNumber(a.openTasks);
      if (sort === "updated")
        return safeDateMs(getStudentUpdatedAt(b)) - safeDateMs(getStudentUpdatedAt(a));
      if (sort === "name")
        return safeString(a.name).localeCompare(safeString(b.name));

      return getPriorityScore(b) - getPriorityScore(a);
    });
  }, [queue, filter, query, sort]);

  const effectiveCompact = compact || view === "compact";
  const visibleQueue = compact ? filteredQueue.slice(0, 6) : filteredQueue;

  const resetControls = () => {
    setFilter("all");
    setSort("priority");
    setView("detailed");
    setQuery("");
    setStatus(null);
  };

  return (
    <section className="rounded-[1.8rem] border-2 border-[#173f69] bg-[#fffaf2] p-4 shadow-[0_18px_55px_rgba(16,43,76,0.08)] sm:p-5">
      <div className="mb-5 flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="max-w-3xl">
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-orange-700">
            Assigned Students
          </p>
          <h2 className="mt-2 text-2xl font-black tracking-tight text-[#102b4c] sm:text-3xl">
            Priority Student Queue
          </h2>
          <p className="mt-2 text-sm leading-6 text-[#607487]">
            Counselor-scoped students ranked by risk, opportunity, stalled time,
            support pressure, document blockers and the next operational action.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <span className="rounded-xl border-2 border-[#173f69] bg-[#173f69] px-3 py-2 text-xs font-black text-white">
            High Priority {queueStats.highPriority}
          </span>
          <span className="rounded-xl border-2 border-amber-300 bg-amber-50 px-3 py-2 text-xs font-black text-amber-700">
            Open Tasks {queueStats.tasks}
          </span>
          <span className="rounded-xl border-2 border-rose-300 bg-rose-50 px-3 py-2 text-xs font-black text-rose-700">
            Missing Contact {queueStats.contactMissing}
          </span>
        </div>
      </div>

      <div className="mb-5 flex flex-wrap gap-2">
          {FILTERS.map((item) => {
            const count =
              item.key === "all"
                ? queueStats.total
                : item.key === "risk"
                  ? queueStats.risk
                  : item.key === "conversion"
                    ? queueStats.conversion
                    : item.key === "stalled"
                      ? queueStats.stalled
                      : item.key === "support"
                        ? queueStats.support
                        : queueStats.documents;

            return (
              <button
                key={item.key}
                type="button"
                onClick={() => setFilter(item.key)}
                aria-pressed={filter === item.key}
                className={`rounded-xl border-2 px-3 py-2 text-xs font-black transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-orange-100 ${
                  filter === item.key
                    ? "border-orange-500 bg-orange-500 text-white"
                    : "border-[#c9d5de] bg-[#fffdf8] text-[#173f69] hover:border-orange-300 hover:bg-orange-50"
                }`}
              >
                {item.label}
                <span className="ml-2 opacity-75">{count}</span>
              </button>
            );
          })}
      </div>

      {!compact ? (
        <div className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6">
          <QueueStat label="Assigned" value={queueStats.total} helper="active students" tone="orange" />
          <QueueStat label="At Risk" value={queueStats.risk} helper="recovery queue" tone="rose" />
          <QueueStat label="Convert" value={queueStats.conversion} helper="ready to move" tone="emerald" />
          <QueueStat label="Stalled" value={queueStats.stalled} helper="needs contact" tone="amber" />
          <QueueStat label="Support" value={queueStats.support} helper="open pressure" tone="violet" />
          <QueueStat label="Documents" value={queueStats.documents} helper="student blockers" />
        </div>
      ) : null}

      {!compact ? (
        <div className="mb-5 grid gap-3 xl:grid-cols-[minmax(0,1fr)_220px_auto_auto]">
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search student, email, phone, stage, milestone or next action..."
            className={INPUT_CLASS}
            aria-label="Search assigned students"
          />

          <select
            value={sort}
            onChange={(event) => setSort(event.target.value)}
            className={INPUT_CLASS}
            aria-label="Sort assigned students"
          >
            {SORTS.map((item) => (
              <option key={item.key} value={item.key}>
                Sort: {item.label}
              </option>
            ))}
          </select>

          <div className="flex rounded-2xl border-2 border-[#d8b892] bg-[#fffdf8] p-1">
            {[
              ["detailed", "Detailed"],
              ["compact", "Compact"],
            ].map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setView(value)}
                aria-pressed={view === value}
                className={`flex-1 rounded-xl px-3 py-2 text-xs font-black transition ${
                  view === value
                    ? "bg-orange-500 text-white"
                    : "text-[#173f69] hover:bg-orange-50"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={resetControls}
            className="rounded-2xl border-2 border-[#173f69] bg-[#173f69] px-4 py-3 text-sm font-black text-white transition hover:bg-[#102f52] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-100"
          >
            Reset
          </button>
        </div>
      ) : null}

      <StatusToast status={status} onClear={() => setStatus(null)} />

      {!compact ? (
        <div className="mb-3 flex flex-col gap-2 rounded-2xl border border-[#d8b892] bg-[#fff8ef] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs font-black uppercase tracking-[0.14em] text-[#7d684f]">
            Showing {filteredQueue.length} of {queue.length} assigned students
          </p>
          <p className="text-xs font-semibold text-[#607487]">
            Sort: {SORTS.find((item) => item.key === sort)?.label || "Priority"} · View:{" "}
            {view === "compact" ? "Compact" : "Detailed"}
          </p>
        </div>
      ) : null}

      <div className="space-y-3">
        {visibleQueue.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-[#c9d5de] bg-[#fffdf8] p-7 text-center">
            <p className="text-sm font-black text-[#102b4c]">No assigned students found.</p>
            <p className="mx-auto mt-2 max-w-2xl text-sm leading-6 text-[#607487]">
              This portal now uses strict counselor assignment scope. Assign students to
              this counselor in Supabase, then refresh the Counselor OS.
            </p>
            {query || filter !== "all" ? (
              <button
                type="button"
                onClick={resetControls}
                className="mt-4 rounded-xl border-2 border-orange-300 bg-orange-50 px-4 py-2 text-xs font-black text-orange-700 hover:bg-orange-100"
              >
                Clear Filters
              </button>
            ) : null}
          </div>
        ) : (
          visibleQueue.map((student, index) => (
            <StudentCard
              key={getStudentStableKey(student, index)}
              student={student}
              counselor={counselor}
              onRefresh={onRefresh}
              onSelectStudent={onSelectStudent}
              setStatus={setStatus}
              compact={effectiveCompact}
            />
          ))
        )}
      </div>

      {compact && filteredQueue.length > visibleQueue.length ? (
        <p className="mt-4 text-center text-xs font-semibold text-[#718292]">
          Showing {visibleQueue.length} of {filteredQueue.length} priority students.
          Open Assigned Students for the complete queue.
        </p>
      ) : null}
    </section>
  );
}
