import React, { useMemo, useState } from "react";
import {
  buildCounselorTaskQueue,
  createCounselorTask,
  formatRelativeTime,
  updateCounselorTaskStatus,
} from "../../lib/counselorPortal";

const FILTERS = [
  { key: "all", label: "All" },
  { key: "overdue", label: "Overdue" },
  { key: "urgent", label: "Urgent" },
  { key: "progress", label: "In Progress" },
  { key: "followup", label: "Follow-up" },
  { key: "conversion", label: "Conversion" },
];

const SORTS = [
  { key: "priority", label: "Priority" },
  { key: "due", label: "Due Date" },
  { key: "student", label: "Student" },
  { key: "category", label: "Category" },
];

const QUICK_TASK_TEMPLATES = [
  {
    key: "followup",
    label: "Student Follow-up",
    title: "Student follow-up required",
    category: "Counselor Follow-up",
    priority: "Normal",
  },
  {
    key: "documents",
    label: "Document Review",
    title: "Review pending student documents",
    category: "Document Review",
    priority: "High",
  },
  {
    key: "application",
    label: "Application Movement",
    title: "Move application to next stage",
    category: "Application Movement",
    priority: "High",
  },
  {
    key: "visa",
    label: "Visa Readiness",
    title: "Check CAS and visa readiness",
    category: "Visa Readiness",
    priority: "Urgent",
  },
];

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

function safeString(value, fallback = "") {
  if (value === null || value === undefined) return fallback;
  return String(value);
}

function lower(value) {
  return safeString(value).toLowerCase();
}

function getStudentKey(student = {}) {
  return String(student.id || student.student_id || student.inquiry_id || student.appointment_id || student.email || "");
}

function getStudentName(student = {}) {
  return (
    student.student_name ||
    student.full_name ||
    student.name ||
    student.lead_name ||
    student.email ||
    student.student_email ||
    "Assigned Student"
  );
}

function priorityRank(priority = "") {
  const value = lower(priority);
  if (value.includes("urgent")) return 4;
  if (value.includes("high")) return 3;
  if (value.includes("medium") || value.includes("normal")) return 2;
  if (value.includes("low")) return 1;
  return 0;
}

function priorityTone(priority = "") {
  const rank = priorityRank(priority);

  if (rank >= 4) return "border-rose-400/30 bg-rose-500/10 text-rose-100";
  if (rank === 3) return "border-amber-400/30 bg-amber-500/10 text-amber-100";
  if (rank === 2) return "border-cyan-400/25 bg-cyan-400/10 text-cyan-100";

  return "border-slate-400/20 bg-white/[0.04] text-slate-200";
}

function statusTone(status = "") {
  const value = lower(status);

  if (value.includes("progress")) return "border-cyan-400/25 bg-cyan-400/10 text-cyan-100";
  if (value.includes("complete") || value.includes("done")) {
    return "border-emerald-400/25 bg-emerald-400/10 text-emerald-100";
  }
  if (value.includes("blocked") || value.includes("overdue")) {
    return "border-rose-400/25 bg-rose-400/10 text-rose-100";
  }

  return "border-amber-400/25 bg-amber-400/10 text-amber-100";
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

function TaskStat({ label, value, helper, tone = "slate" }) {
  const tones = {
    slate: "border-white/10 bg-white/[0.04]",
    cyan: "border-cyan-400/20 bg-cyan-500/10",
    amber: "border-amber-400/20 bg-amber-500/10",
    emerald: "border-emerald-400/20 bg-emerald-500/10",
    violet: "border-violet-400/20 bg-violet-500/10",
    rose: "border-rose-400/20 bg-rose-500/10",
  };

  return (
    <div className={`rounded-2xl border p-4 ${tones[tone] || tones.slate}`}>
      <p className="text-xs font-bold uppercase tracking-[0.22em] text-slate-400">{label}</p>
      <p className="mt-2 text-2xl font-black text-white">{value}</p>
      {helper ? <p className="mt-1 text-xs text-slate-400">{helper}</p> : null}
    </div>
  );
}

function QuickTaskCreator({ snapshot, counselor, onRefresh, setStatus }) {
  const students = safeArray(snapshot?.students);

  const [studentKey, setStudentKey] = useState("");
  const [templateKey, setTemplateKey] = useState("followup");
  const [title, setTitle] = useState("");
  const [saving, setSaving] = useState(false);

  const selectedStudent = students.find((student) => getStudentKey(student) === studentKey);
  const selectedTemplate = QUICK_TASK_TEMPLATES.find((template) => template.key === templateKey) || QUICK_TASK_TEMPLATES[0];

  async function createTask() {
    if (!selectedStudent) {
      setStatus({ type: "error", message: "Select a student before creating a task." });
      return;
    }

    setSaving(true);
    setStatus(null);

    try {
      await createCounselorTask({
        studentId: selectedStudent.id || selectedStudent.student_id || selectedStudent.inquiry_id || selectedStudent.email,
        studentName: getStudentName(selectedStudent),
        title: title.trim() || selectedTemplate.title,
        category: selectedTemplate.category,
        priority: selectedTemplate.priority,
        counselor,
        metadata: {
          source: "CounselorTasksWorkspace",
          template: selectedTemplate.key,
        },
      });

      setTitle("");
      setStatus({ type: "success", message: "Counselor task created." });
      onRefresh?.();
    } catch (error) {
      console.error("Quick task create failed", error);
      setStatus({
        type: "error",
        message: "Task could not be created. Check student_tasks columns/RLS.",
      });
    } finally {
      setSaving(false);
    }
  }

  if (!students.length) return null;

  return (
    <div className="mb-5 rounded-3xl border border-white/10 bg-slate-950/50 p-4">
      <div className="flex flex-col gap-2 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Quick Task Creator</p>
          <p className="mt-1 text-sm text-slate-400">
            Create counselor execution tasks directly from the assigned student scope.
          </p>
        </div>
        <span className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-bold text-slate-300">
          {students.length} students
        </span>
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-[1fr_0.55fr]">
        <select
          value={studentKey}
          onChange={(event) => setStudentKey(event.target.value)}
          className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-cyan-400/40"
        >
          <option value="">Select student</option>
          {students.map((student) => {
            const key = getStudentKey(student);
            return (
              <option key={key} value={key}>
                {getStudentName(student)}
              </option>
            );
          })}
        </select>

        <select
          value={templateKey}
          onChange={(event) => setTemplateKey(event.target.value)}
          className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-cyan-400/40"
        >
          {QUICK_TASK_TEMPLATES.map((template) => (
            <option key={template.key} value={template.key}>
              {template.label}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-3 grid gap-3 lg:grid-cols-[1fr_auto]">
        <input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder={selectedTemplate.title}
          className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-cyan-400/40"
        />

        <button
          type="button"
          onClick={createTask}
          disabled={saving}
          className="rounded-2xl border border-cyan-400/30 bg-cyan-400/10 px-5 py-3 text-sm font-bold text-cyan-100 hover:bg-cyan-400/20 disabled:opacity-50"
        >
          {saving ? "Creating..." : "Create Task"}
        </button>
      </div>
    </div>
  );
}

function TaskCard({ task, counselor, savingId, completeTask, markInProgress }) {
  return (
    <article
      className={`rounded-3xl border p-4 transition hover:border-cyan-400/25 ${
        task.isOverdue ? "border-rose-400/30 bg-rose-500/10" : "border-white/10 bg-slate-950/50 hover:bg-slate-900/70"
      }`}
    >
      <div className="grid gap-4 lg:grid-cols-[1fr_0.55fr_0.8fr_0.5fr] lg:items-center">
        <div>
          <h3 className="text-lg font-black">{task.title}</h3>
          <p className="text-sm text-slate-400">
            {task.studentName} · {task.category}
          </p>

          <div className="mt-3 flex flex-wrap gap-2">
            <span className={`rounded-full border px-3 py-1 text-xs font-bold ${priorityTone(task.priority)}`}>
              {task.priority}
            </span>
            <span className={`rounded-full border px-3 py-1 text-xs font-bold ${statusTone(task.status)}`}>
              {task.status}
            </span>
            {task.isOverdue ? (
              <span className="rounded-full border border-rose-400/25 bg-rose-400/10 px-3 py-1 text-xs font-bold text-rose-100">
                Overdue
              </span>
            ) : null}
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Due</p>
          <p className="mt-2 text-sm font-bold text-white">{formatRelativeTime(task.dueAt || task.updatedAt)}</p>
          <p className="mt-1 text-xs text-slate-500">
            {task.dueAt ? new Date(task.dueAt).toLocaleDateString() : "No due date"}
          </p>
        </div>

        <div className="text-sm text-slate-300">
          <p className="font-semibold">{task.nextAction}</p>
          <p className="mt-1 text-xs text-slate-500">
            Keep task status synced so workload analytics and executive brief stay accurate.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => markInProgress(task)}
            disabled={savingId === `${task.id}-progress` || savingId === task.id}
            className="rounded-xl border border-cyan-400/30 bg-cyan-400/10 px-3 py-2 text-xs font-bold text-cyan-100 hover:bg-cyan-400/20 disabled:opacity-50"
          >
            {savingId === `${task.id}-progress` ? "Saving..." : "Progress"}
          </button>

          <button
            type="button"
            onClick={() => completeTask(task)}
            disabled={savingId === task.id || savingId === `${task.id}-progress`}
            className="rounded-xl border border-emerald-400/30 bg-emerald-400/10 px-3 py-2 text-xs font-bold text-emerald-100 hover:bg-emerald-400/20 disabled:opacity-50"
          >
            {savingId === task.id ? "Saving..." : "Complete"}
          </button>
        </div>
      </div>
    </article>
  );
}

export default function CounselorTasksWorkspace({ snapshot, counselor, onRefresh }) {
  const queue = useMemo(() => buildCounselorTaskQueue(snapshot || {}), [snapshot]);

  const [savingId, setSavingId] = useState("");
  const [status, setStatus] = useState(null);
  const [filter, setFilter] = useState("all");
  const [sort, setSort] = useState("priority");
  const [query, setQuery] = useState("");

  const stats = useMemo(() => {
    const overdue = queue.filter((task) => task.isOverdue).length;
    const urgent = queue.filter((task) => priorityRank(task.priority) >= 3).length;
    const progress = queue.filter((task) => lower(task.status).includes("progress")).length;
    const followup = queue.filter((task) => lower(`${task.category} ${task.title}`).includes("follow")).length;
    const conversion = queue.filter((task) =>
      lower(`${task.category} ${task.title} ${task.nextAction}`).includes("application") ||
      lower(`${task.category} ${task.title} ${task.nextAction}`).includes("conversion") ||
      lower(`${task.category} ${task.title} ${task.nextAction}`).includes("cas") ||
      lower(`${task.category} ${task.title} ${task.nextAction}`).includes("visa")
    ).length;

    return {
      total: queue.length,
      overdue,
      urgent,
      progress,
      followup,
      conversion,
    };
  }, [queue]);

  const filtered = useMemo(() => {
    const search = query.trim().toLowerCase();

    let next = queue;

    if (filter === "overdue") next = next.filter((task) => task.isOverdue);
    if (filter === "urgent") next = next.filter((task) => priorityRank(task.priority) >= 3);
    if (filter === "progress") next = next.filter((task) => lower(task.status).includes("progress"));
    if (filter === "followup") next = next.filter((task) => lower(`${task.category} ${task.title}`).includes("follow"));
    if (filter === "conversion") {
      next = next.filter((task) => {
        const text = lower(`${task.category} ${task.title} ${task.nextAction}`);
        return text.includes("application") || text.includes("conversion") || text.includes("cas") || text.includes("visa");
      });
    }

    if (search) {
      next = next.filter((task) =>
        [task.title, task.studentName, task.category, task.priority, task.status, task.nextAction]
          .map((value) => lower(value))
          .join(" ")
          .includes(search)
      );
    }

    return [...next].sort((a, b) => {
      if (sort === "due") {
        const aTime = a.dueAt ? new Date(a.dueAt).getTime() : Number.MAX_SAFE_INTEGER;
        const bTime = b.dueAt ? new Date(b.dueAt).getTime() : Number.MAX_SAFE_INTEGER;
        return aTime - bTime;
      }

      if (sort === "student") return safeString(a.studentName).localeCompare(safeString(b.studentName));
      if (sort === "category") return safeString(a.category).localeCompare(safeString(b.category));

      const aPriority = priorityRank(a.priority) * 20 + (a.isOverdue ? 50 : 0);
      const bPriority = priorityRank(b.priority) * 20 + (b.isOverdue ? 50 : 0);
      return bPriority - aPriority;
    });
  }, [queue, filter, query, sort]);

  async function completeTask(task) {
    setSavingId(task.id);
    setStatus(null);

    try {
      await updateCounselorTaskStatus({
        taskId: task.id,
        status: "Completed",
        notes: "Completed from Counselor Portal OS",
        counselor,
      });

      setStatus({ type: "success", message: `Task completed: ${task.title}` });
      onRefresh?.();
    } catch (error) {
      console.error("Complete task failed", error);
      setStatus({
        type: "error",
        message: "Task could not be completed. Check student_tasks columns/RLS.",
      });
    } finally {
      setSavingId("");
    }
  }

  async function markInProgress(task) {
    setSavingId(`${task.id}-progress`);
    setStatus(null);

    try {
      await updateCounselorTaskStatus({
        taskId: task.id,
        status: "In Progress",
        notes: "Marked in progress from Counselor Portal OS",
        counselor,
      });

      setStatus({ type: "success", message: `Task marked in progress: ${task.title}` });
      onRefresh?.();
    } catch (error) {
      console.error("Task progress update failed", error);
      setStatus({
        type: "error",
        message: "Task could not be updated. Check student_tasks columns/RLS.",
      });
    } finally {
      setSavingId("");
    }
  }

  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
      <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-cyan-300">Task OS</p>
          <h2 className="mt-2 text-2xl font-black">Counselor Execution Queue</h2>
          <p className="mt-1 text-sm text-slate-400">
            Open, overdue, student-facing, conversion-critical, and follow-up counselor tasks.
          </p>
        </div>

        <span className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-bold text-slate-200">
          {filtered.length}/{queue.length}
        </span>
      </div>

      <div className="mb-5 grid gap-3 md:grid-cols-3 xl:grid-cols-6">
        <TaskStat label="Open" value={stats.total} helper="tasks" tone="cyan" />
        <TaskStat label="Overdue" value={stats.overdue} helper="needs action" tone="rose" />
        <TaskStat label="Urgent" value={stats.urgent} helper="high priority" tone="amber" />
        <TaskStat label="Progress" value={stats.progress} helper="active tasks" tone="violet" />
        <TaskStat label="Follow-up" value={stats.followup} helper="student contact" tone="emerald" />
        <TaskStat label="Convert" value={stats.conversion} helper="CAS/visa/app" />
      </div>

      <StatusToast status={status} onClear={() => setStatus(null)} />

      <QuickTaskCreator snapshot={snapshot} counselor={counselor} onRefresh={onRefresh} setStatus={setStatus} />

      <div className="mb-5 grid gap-3 lg:grid-cols-[1fr_220px_220px]">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search task, student, category, status, priority..."
          className="rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-cyan-400/40"
        />

        <select
          value={filter}
          onChange={(event) => setFilter(event.target.value)}
          className="rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm font-bold text-white outline-none focus:border-cyan-400/40"
        >
          {FILTERS.map((item) => (
            <option key={item.key} value={item.key} className="bg-slate-950">
              {item.label}
            </option>
          ))}
        </select>

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

      <div className="grid gap-3">
        {filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/15 p-6 text-center">
            <p className="text-sm font-bold text-white">No open counselor tasks found.</p>
            <p className="mx-auto mt-2 max-w-2xl text-sm text-slate-400">
              Tasks created from Assigned Students, Appointments, Support, or the Quick Task Creator will appear here.
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
          filtered.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              counselor={counselor}
              savingId={savingId}
              completeTask={completeTask}
              markInProgress={markInProgress}
            />
          ))
        )}
      </div>
    </div>
  );
}