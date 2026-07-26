import React, { useEffect, useMemo, useState } from "react";
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
  { key: "updated", label: "Recently Updated" },
  { key: "student", label: "Student" },
  { key: "category", label: "Category" },
  { key: "status", label: "Status" },
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

const FILTER_STORAGE_KEY = "zaifan_counselor_tasks_filter";
const SORT_STORAGE_KEY = "zaifan_counselor_tasks_sort";
const INPUT_CLASS =
  "w-full rounded-2xl border-2 border-[#d8b892] bg-[#fffdf8] px-4 py-3 text-sm font-semibold text-[#102b4c] outline-none transition placeholder:text-slate-400 focus:border-orange-500 focus:ring-4 focus:ring-orange-100";

const VALID_FILTERS = new Set(FILTERS.map((item) => item.key));
const VALID_SORTS = new Set(SORTS.map((item) => item.key));

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

function safeString(value, fallback = "") {
  if (value === null || value === undefined) return fallback;
  return String(value);
}

function safeNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function lower(value) {
  return safeString(value).toLowerCase();
}

function safeDateMs(value) {
  if (!value) return 0;

  const parsed = new Date(value).getTime();
  return Number.isFinite(parsed) ? parsed : 0;
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
    // Task preferences are helpful but must never break the portal.
  }
}

function getStudentKey(student = {}) {
  return String(
    student.id ||
      student.student_id ||
      student.inquiry_id ||
      student.appointment_id ||
      student.email ||
      ""
  );
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

function getStudentEmail(student = {}) {
  return student.email || student.student_email || student.lead_email || "";
}

function priorityRank(priority = "") {
  const value = lower(priority);

  if (value.includes("urgent")) return 4;
  if (value.includes("high")) return 3;
  if (value.includes("medium") || value.includes("normal")) return 2;
  if (value.includes("low")) return 1;

  return 0;
}

function isCompletedTask(task = {}) {
  const status = lower(task.status);

  return status.includes("complete") || status.includes("done");
}

function isProgressTask(task = {}) {
  return lower(task.status).includes("progress");
}

function isConversionTask(task = {}) {
  const value = lower(
    `${task.category} ${task.title} ${task.nextAction}`
  );

  return (
    value.includes("application") ||
    value.includes("conversion") ||
    value.includes("cas") ||
    value.includes("visa") ||
    value.includes("offer")
  );
}

function isFollowUpTask(task = {}) {
  return lower(`${task.category} ${task.title}`).includes("follow");
}

function taskSearchText(task = {}) {
  return lower(
    [
      task.title,
      task.studentName,
      task.category,
      task.priority,
      task.status,
      task.nextAction,
      task.notes,
    ].join(" ")
  );
}

function taskPressureScore(task = {}) {
  let score = priorityRank(task.priority) * 18;

  if (task.isOverdue) score += 45;
  if (isConversionTask(task)) score += 10;
  if (isFollowUpTask(task)) score += 5;

  const dueAt = safeDateMs(task.dueAt);
  if (dueAt && !task.isOverdue && !isCompletedTask(task)) {
    const hoursUntilDue = (dueAt - Date.now()) / (1000 * 60 * 60);

    if (hoursUntilDue <= 6) score += 20;
    else if (hoursUntilDue <= 24) score += 12;
    else if (hoursUntilDue <= 72) score += 6;
  }

  return Math.max(0, Math.min(100, Math.round(score)));
}

function priorityTone(priority = "") {
  const rank = priorityRank(priority);

  if (rank >= 4) return "border-rose-300 bg-rose-50 text-rose-700";
  if (rank === 3) return "border-amber-300 bg-amber-50 text-amber-700";
  if (rank === 2) return "border-orange-300 bg-orange-50 text-orange-700";

  return "border-[#b7c5d1] bg-[#f3f7fb] text-[#173f69]";
}

function statusTone(status = "") {
  const value = lower(status);

  if (value.includes("progress")) {
    return "border-[#173f69] bg-[#173f69] text-white";
  }

  if (value.includes("complete") || value.includes("done")) {
    return "border-emerald-300 bg-emerald-50 text-emerald-700";
  }

  if (value.includes("blocked") || value.includes("overdue")) {
    return "border-rose-300 bg-rose-50 text-rose-700";
  }

  return "border-amber-300 bg-amber-50 text-amber-700";
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
      aria-live="polite"
      className={`mb-4 flex items-start justify-between gap-4 rounded-2xl border-2 px-4 py-3 text-sm font-semibold ${tone}`}
    >
      <span>{status.message}</span>

      <button
        type="button"
        onClick={onClear}
        className="rounded-lg px-2 py-1 text-xs font-black transition hover:bg-black/5"
      >
        Clear
      </button>
    </div>
  );
}

function TaskStat({
  label,
  value,
  helper,
  tone = "navy",
  active = false,
  onClick,
}) {
  const tones = {
    navy: "border-[#173f69] bg-[#f3f7fb]",
    orange: "border-orange-300 bg-orange-50",
    amber: "border-amber-300 bg-amber-50",
    emerald: "border-emerald-300 bg-emerald-50",
    violet: "border-violet-300 bg-violet-50",
    rose: "border-rose-300 bg-rose-50",
  };

  const className = `rounded-2xl border-2 p-4 text-left shadow-sm transition ${
    tones[tone] || tones.navy
  } ${
    onClick
      ? "hover:-translate-y-0.5 hover:border-orange-400 hover:shadow-md"
      : ""
  } ${active ? "ring-2 ring-orange-200" : ""}`;

  const content = (
    <>
      <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#607487]">
        {label}
      </p>

      <p className="mt-2 text-2xl font-black text-[#102b4c]">{value}</p>

      {helper ? (
        <p className="mt-1 text-xs font-medium text-[#607487]">{helper}</p>
      ) : null}
    </>
  );

  return onClick ? (
    <button type="button" onClick={onClick} className={className}>
      {content}
    </button>
  ) : (
    <div className={className}>{content}</div>
  );
}

function TaskPressureMeter({ task }) {
  const score = taskPressureScore(task);

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between gap-3 text-xs">
        <span className="font-bold text-[#607487]">Task pressure</span>
        <span className="font-black text-[#102b4c]">{score}</span>
      </div>

      <div className="h-2.5 overflow-hidden rounded-full bg-[#e5edf3]">
        <div
          className={`h-full rounded-full transition-[width] duration-500 ${
            score >= 75
              ? "bg-rose-500"
              : score >= 50
                ? "bg-orange-500"
                : "bg-[#173f69]"
          }`}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  );
}

function QuickTaskCreator({
  snapshot,
  counselor,
  onRefresh,
  setStatus,
}) {
  const students = safeArray(snapshot?.students);

  const [studentKey, setStudentKey] = useState("");
  const [studentSearch, setStudentSearch] = useState("");
  const [templateKey, setTemplateKey] = useState("followup");
  const [title, setTitle] = useState("");
  const [saving, setSaving] = useState(false);

  const selectedTemplate =
    QUICK_TASK_TEMPLATES.find(
      (template) => template.key === templateKey
    ) || QUICK_TASK_TEMPLATES[0];

  const filteredStudents = useMemo(() => {
    const search = studentSearch.trim().toLowerCase();

    if (!search) return students.slice(0, 100);

    return students
      .filter((student) =>
        lower(
          [
            getStudentName(student),
            getStudentEmail(student),
            student.phone,
            student.mobile,
            student.whatsapp,
            student.student_id,
            student.id,
          ].join(" ")
        ).includes(search)
      )
      .slice(0, 100);
  }, [students, studentSearch]);

  const selectedStudent = useMemo(
    () =>
      students.find(
        (student) => getStudentKey(student) === studentKey
      ) || null,
    [students, studentKey]
  );

  const resolvedTitle =
    title.trim() || selectedTemplate.title;

  async function createTask() {
    if (!selectedStudent) {
      setStatus({
        type: "error",
        message: "Select a student before creating a task.",
      });
      return;
    }

    if (!resolvedTitle) {
      setStatus({
        type: "error",
        message: "Task title is required.",
      });
      return;
    }

    setSaving(true);
    setStatus(null);

    try {
      await createCounselorTask({
        studentId:
          selectedStudent.id ||
          selectedStudent.student_id ||
          selectedStudent.inquiry_id ||
          selectedStudent.email,
        studentName: getStudentName(selectedStudent),
        title: resolvedTitle,
        category: selectedTemplate.category,
        priority: selectedTemplate.priority,
        counselor,
        metadata: {
          source: "CounselorTasksWorkspace",
          template: selectedTemplate.key,
          studentEmail: getStudentEmail(selectedStudent),
          studentType:
            selectedStudent.student_type ||
            selectedStudent.record_type ||
            selectedStudent.source_type ||
            "inquiry",
        },
      });

      setTitle("");
      setStatus({
        type: "success",
        message: `Counselor task created for ${getStudentName(
          selectedStudent
        )}.`,
      });

      await Promise.resolve(onRefresh?.());
    } catch (error) {
      console.error("Quick task create failed", error);

      setStatus({
        type: "error",
        message:
          error?.message ||
          "Task could not be created. Check student_tasks columns and RLS.",
      });
    } finally {
      setSaving(false);
    }
  }

  if (!students.length) {
    return (
      <div className="mb-5 rounded-2xl border-2 border-dashed border-[#c9d5de] bg-[#fffdf8] p-5 text-sm text-[#607487]">
        Quick Task Creator becomes available when this counselor has assigned students.
      </div>
    );
  }

  return (
    <div className="mb-5 rounded-[1.5rem] border-2 border-orange-200 bg-[#fff8ef] p-4 sm:p-5">
      <div className="flex flex-col gap-2 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-orange-700">
            Quick Task Creator
          </p>

          <p className="mt-1 max-w-3xl text-sm leading-6 text-[#607487]">
            Create counselor execution work directly from the assigned student scope.
            Templates keep task category and priority consistent.
          </p>
        </div>

        <span className="rounded-xl border-2 border-[#173f69] bg-[#173f69] px-3 py-2 text-xs font-black text-white">
          {students.length} assigned
        </span>
      </div>

      <div className="mt-4 grid gap-3 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_220px]">
        <input
          type="search"
          value={studentSearch}
          onChange={(event) => setStudentSearch(event.target.value)}
          placeholder="Search assigned student..."
          className={INPUT_CLASS}
        />

        <select
          value={studentKey}
          onChange={(event) => setStudentKey(event.target.value)}
          className={INPUT_CLASS}
          aria-label="Select assigned student"
        >
          <option value="">Select student</option>

          {filteredStudents.map((student) => {
            const key = getStudentKey(student);
            const name = getStudentName(student);
            const email = getStudentEmail(student);

            return (
              <option key={key} value={key}>
                {name}
                {email ? ` · ${email}` : ""}
              </option>
            );
          })}
        </select>

        <select
          value={templateKey}
          onChange={(event) => setTemplateKey(event.target.value)}
          className={INPUT_CLASS}
          aria-label="Select task template"
        >
          {QUICK_TASK_TEMPLATES.map((template) => (
            <option key={template.key} value={template.key}>
              {template.label} · {template.priority}
            </option>
          ))}
        </select>
      </div>

      {selectedStudent ? (
        <div className="mt-3 rounded-2xl border-2 border-[#173f69] bg-[#173f69] p-3 text-white">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="text-[9px] font-black uppercase tracking-[0.16em] text-white/65">
                Creating For
              </p>

              <p className="mt-1 truncate text-sm font-black text-white">
                {getStudentName(selectedStudent)}
              </p>

              {getStudentEmail(selectedStudent) ? (
                <p className="mt-0.5 truncate text-xs text-white/70">
                  {getStudentEmail(selectedStudent)}
                </p>
              ) : null}
            </div>

            <div className="flex flex-wrap gap-2">
              <span className="rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-xs font-black text-white">
                {selectedTemplate.category}
              </span>

              <span className="rounded-xl border border-orange-300/40 bg-orange-400/15 px-3 py-2 text-xs font-black text-orange-100">
                {selectedTemplate.priority}
              </span>
            </div>
          </div>
        </div>
      ) : null}

      <div className="mt-3 grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto]">
        <input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          maxLength={180}
          placeholder={selectedTemplate.title}
          className={INPUT_CLASS}
        />

        <button
          type="button"
          onClick={createTask}
          disabled={saving || !selectedStudent}
          className="rounded-2xl border-2 border-orange-500 bg-orange-500 px-5 py-3 text-sm font-black text-white shadow-[0_10px_24px_rgba(249,115,22,0.14)] transition hover:-translate-y-0.5 hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving ? "Creating..." : "Create Task"}
        </button>
      </div>

      <p className="mt-2 text-xs font-medium text-[#718292]">
        {resolvedTitle.length}/180 characters · Template: {selectedTemplate.label}
      </p>
    </div>
  );
}

function TaskCard({
  task,
  savingId,
  completeTask,
  markInProgress,
}) {
  const completed = isCompletedTask(task);
  const inProgress = isProgressTask(task);
  const pressure = taskPressureScore(task);

  const cardTone = completed
    ? "border-emerald-300 bg-emerald-50/50"
    : task.isOverdue
      ? "border-rose-300 bg-rose-50/70"
      : pressure >= 70
        ? "border-orange-300 bg-[#fffaf2]"
        : "border-[#c9d5de] bg-[#fffdf8]";

  return (
    <article
      className={`rounded-[1.6rem] border-2 p-4 shadow-[0_10px_30px_rgba(16,43,76,0.06)] transition duration-300 hover:-translate-y-0.5 hover:border-orange-300 sm:p-5 ${cardTone}`}
    >
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.1fr)_0.6fr_0.85fr_0.5fr] xl:items-center">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="break-words text-lg font-black text-[#102b4c]">
              {task.title || "Counselor task"}
            </h3>

            {task.isOverdue && !completed ? (
              <span className="rounded-full border border-rose-300 bg-white px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.13em] text-rose-700">
                Overdue
              </span>
            ) : null}

            {completed ? (
              <span className="rounded-full border border-emerald-300 bg-white px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.13em] text-emerald-700">
                Closed
              </span>
            ) : null}
          </div>

          <p className="mt-1.5 text-sm font-semibold text-[#607487]">
            {task.studentName || "Student"} · {task.category || "General Task"}
          </p>

          <div className="mt-3 flex flex-wrap gap-2">
            <span
              className={`rounded-full border px-3 py-1 text-xs font-black ${priorityTone(
                task.priority
              )}`}
            >
              {task.priority || "Normal"}
            </span>

            <span
              className={`rounded-full border px-3 py-1 text-xs font-black ${statusTone(
                task.status
              )}`}
            >
              {task.status || "Pending"}
            </span>

            {isConversionTask(task) ? (
              <span className="rounded-full border border-violet-300 bg-violet-50 px-3 py-1 text-xs font-black text-violet-700">
                Conversion
              </span>
            ) : null}
          </div>
        </div>

        <div className="rounded-2xl border-2 border-[#d6e0e7] bg-[#f8fbfd] p-3.5">
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#718292]">
            Due
          </p>

          <p className="mt-2 text-sm font-black text-[#102b4c]">
            {formatRelativeTime(task.dueAt || task.updatedAt)}
          </p>

          <p className="mt-1 text-xs leading-5 text-[#718292]">
            {task.dueAt
              ? new Date(task.dueAt).toLocaleString()
              : "No due date"}
          </p>

          <div className="mt-3">
            <TaskPressureMeter task={task} />
          </div>
        </div>

        <div className="rounded-2xl border-2 border-orange-200 bg-[#fff8ef] p-3.5">
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-orange-700">
            Next Action
          </p>

          <p className="mt-2 text-sm font-bold leading-6 text-[#102b4c]">
            {task.nextAction ||
              (completed
                ? "Task is complete."
                : "Review task context and move the student workflow forward.")}
          </p>

          <p className="mt-2 text-xs leading-5 text-[#718292]">
            Keep task status synchronized so workload analytics and the executive brief
            stay accurate.
          </p>
        </div>

        <div className="grid gap-2">
          {!completed ? (
            <>
              <button
                type="button"
                onClick={() => markInProgress(task)}
                disabled={
                  Boolean(savingId) ||
                  inProgress
                }
                className="rounded-xl border-2 border-[#173f69] bg-[#173f69] px-3 py-2.5 text-xs font-black text-white transition hover:bg-[#102f52] disabled:cursor-not-allowed disabled:opacity-45"
              >
                {savingId === `${task.id}-progress`
                  ? "Saving..."
                  : inProgress
                    ? "In Progress"
                    : "Mark In Progress"}
              </button>

              <button
                type="button"
                onClick={() => completeTask(task)}
                disabled={Boolean(savingId)}
                className="rounded-xl border-2 border-orange-500 bg-orange-500 px-3 py-2.5 text-xs font-black text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {savingId === task.id ? "Saving..." : "Complete Task"}
              </button>
            </>
          ) : (
            <div className="rounded-xl border-2 border-emerald-300 bg-emerald-50 px-3 py-3 text-center text-xs font-black text-emerald-700">
              Completed
            </div>
          )}
        </div>
      </div>
    </article>
  );
}

export default function CounselorTasksWorkspace({
  snapshot,
  counselor,
  onRefresh,
}) {
  const queue = useMemo(
    () => buildCounselorTaskQueue(snapshot || {}),
    [snapshot]
  );

  const [savingId, setSavingId] = useState("");
  const [status, setStatus] = useState(null);

  const [filter, setFilter] = useState(() => {
    const saved = readSessionValue(FILTER_STORAGE_KEY, "all");
    return VALID_FILTERS.has(saved) ? saved : "all";
  });

  const [sort, setSort] = useState(() => {
    const saved = readSessionValue(SORT_STORAGE_KEY, "priority");
    return VALID_SORTS.has(saved) ? saved : "priority";
  });

  const [query, setQuery] = useState("");

  useEffect(() => {
    writeSessionValue(FILTER_STORAGE_KEY, filter);
  }, [filter]);

  useEffect(() => {
    writeSessionValue(SORT_STORAGE_KEY, sort);
  }, [sort]);

  const stats = useMemo(() => {
    const overdue = queue.filter(
      (task) => task.isOverdue && !isCompletedTask(task)
    ).length;

    const urgent = queue.filter(
      (task) =>
        priorityRank(task.priority) >= 3 &&
        !isCompletedTask(task)
    ).length;

    const progress = queue.filter(
      (task) => isProgressTask(task) && !isCompletedTask(task)
    ).length;

    const followup = queue.filter(
      (task) => isFollowUpTask(task) && !isCompletedTask(task)
    ).length;

    const conversion = queue.filter(
      (task) => isConversionTask(task) && !isCompletedTask(task)
    ).length;

    const completed = queue.filter((task) =>
      isCompletedTask(task)
    ).length;

    const students = new Set(
      queue.map((task) => lower(task.studentName)).filter(Boolean)
    ).size;

    const averagePressure = queue.length
      ? Math.round(
          queue.reduce(
            (sum, task) => sum + taskPressureScore(task),
            0
          ) / queue.length
        )
      : 0;

    return {
      total: queue.length,
      overdue,
      urgent,
      progress,
      followup,
      conversion,
      completed,
      students,
      averagePressure,
    };
  }, [queue]);

  const filtered = useMemo(() => {
    const search = query.trim().toLowerCase();
    let next = queue;

    if (filter === "overdue") {
      next = next.filter(
        (task) => task.isOverdue && !isCompletedTask(task)
      );
    }

    if (filter === "urgent") {
      next = next.filter(
        (task) =>
          priorityRank(task.priority) >= 3 &&
          !isCompletedTask(task)
      );
    }

    if (filter === "progress") {
      next = next.filter(
        (task) => isProgressTask(task) && !isCompletedTask(task)
      );
    }

    if (filter === "followup") {
      next = next.filter((task) =>
        isFollowUpTask(task)
      );
    }

    if (filter === "conversion") {
      next = next.filter((task) =>
        isConversionTask(task)
      );
    }

    if (search) {
      next = next.filter((task) =>
        taskSearchText(task).includes(search)
      );
    }

    return [...next].sort((a, b) => {
      if (sort === "due") {
        const aTime = safeDateMs(a.dueAt) || Number.MAX_SAFE_INTEGER;
        const bTime = safeDateMs(b.dueAt) || Number.MAX_SAFE_INTEGER;
        return aTime - bTime;
      }

      if (sort === "updated") {
        return (
          safeDateMs(b.updatedAt || b.updated_at) -
          safeDateMs(a.updatedAt || a.updated_at)
        );
      }

      if (sort === "student") {
        return safeString(a.studentName).localeCompare(
          safeString(b.studentName)
        );
      }

      if (sort === "category") {
        return safeString(a.category).localeCompare(
          safeString(b.category)
        );
      }

      if (sort === "status") {
        return safeString(a.status).localeCompare(
          safeString(b.status)
        );
      }

      const pressureDifference =
        taskPressureScore(b) - taskPressureScore(a);

      if (pressureDifference !== 0) {
        return pressureDifference;
      }

      return safeDateMs(a.dueAt) - safeDateMs(b.dueAt);
    });
  }, [queue, filter, query, sort]);

  async function completeTask(task) {
    if (!task?.id || savingId) return;

    setSavingId(task.id);
    setStatus(null);

    try {
      await updateCounselorTaskStatus({
        taskId: task.id,
        status: "Completed",
        notes: "Completed from Counselor Portal OS",
        counselor,
        metadata: {
          source: "CounselorTasksWorkspace",
          studentName: task.studentName,
          category: task.category,
          priority: task.priority,
          previousStatus: task.status,
          pressureScore: taskPressureScore(task),
        },
      });

      setStatus({
        type: "success",
        message: `Task completed: ${task.title}`,
      });

      await Promise.resolve(onRefresh?.());
    } catch (error) {
      console.error("Complete task failed", error);

      setStatus({
        type: "error",
        message:
          error?.message ||
          "Task could not be completed. Check student_tasks columns and RLS.",
      });
    } finally {
      setSavingId("");
    }
  }

  async function markInProgress(task) {
    if (!task?.id || savingId || isProgressTask(task)) return;

    setSavingId(`${task.id}-progress`);
    setStatus(null);

    try {
      await updateCounselorTaskStatus({
        taskId: task.id,
        status: "In Progress",
        notes: "Marked in progress from Counselor Portal OS",
        counselor,
        metadata: {
          source: "CounselorTasksWorkspace",
          studentName: task.studentName,
          category: task.category,
          priority: task.priority,
          previousStatus: task.status,
          pressureScore: taskPressureScore(task),
        },
      });

      setStatus({
        type: "success",
        message: `Task marked in progress: ${task.title}`,
      });

      await Promise.resolve(onRefresh?.());
    } catch (error) {
      console.error("Task progress update failed", error);

      setStatus({
        type: "error",
        message:
          error?.message ||
          "Task could not be updated. Check student_tasks columns and RLS.",
      });
    } finally {
      setSavingId("");
    }
  }

  const reset = () => {
    setFilter("all");
    setSort("priority");
    setQuery("");
    setStatus(null);
  };

  const hasActiveControls =
    Boolean(query.trim()) ||
    filter !== "all" ||
    sort !== "priority";

  return (
    <section className="rounded-[1.8rem] border-2 border-[#173f69] bg-[#fffaf2] p-4 shadow-[0_18px_55px_rgba(16,43,76,0.08)] sm:p-5">
      <div className="mb-5 flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-orange-700">
            Task OS
          </p>

          <h2 className="mt-2 text-2xl font-black tracking-tight text-[#102b4c] sm:text-3xl">
            Counselor Execution Queue
          </h2>

          <p className="mt-2 max-w-3xl text-sm leading-6 text-[#607487]">
            Create, prioritize and close counselor work while keeping task pressure,
            student movement and workload intelligence synchronized.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <span className="rounded-xl border-2 border-orange-300 bg-orange-50 px-4 py-2 text-sm font-black text-orange-700">
            {filtered.length}/{queue.length} visible
          </span>

          <span className="rounded-xl border-2 border-[#173f69] bg-[#173f69] px-4 py-2 text-sm font-black text-white">
            {stats.students} students
          </span>

          <span
            className={`rounded-xl border-2 px-4 py-2 text-sm font-black ${
              stats.averagePressure >= 70
                ? "border-rose-300 bg-rose-50 text-rose-700"
                : stats.averagePressure >= 45
                  ? "border-amber-300 bg-amber-50 text-amber-700"
                  : "border-emerald-300 bg-emerald-50 text-emerald-700"
            }`}
          >
            Pressure {stats.averagePressure}
          </span>
        </div>
      </div>

      <div className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6">
        <TaskStat
          label="Open"
          value={stats.total}
          helper={`${stats.completed} completed`}
          tone="orange"
          active={filter === "all"}
          onClick={() => setFilter("all")}
        />

        <TaskStat
          label="Overdue"
          value={stats.overdue}
          helper="needs action"
          tone="rose"
          active={filter === "overdue"}
          onClick={() => setFilter("overdue")}
        />

        <TaskStat
          label="Urgent"
          value={stats.urgent}
          helper="high priority"
          tone="amber"
          active={filter === "urgent"}
          onClick={() => setFilter("urgent")}
        />

        <TaskStat
          label="Progress"
          value={stats.progress}
          helper="active tasks"
          tone="violet"
          active={filter === "progress"}
          onClick={() => setFilter("progress")}
        />

        <TaskStat
          label="Follow-up"
          value={stats.followup}
          helper="student contact"
          tone="emerald"
          active={filter === "followup"}
          onClick={() => setFilter("followup")}
        />

        <TaskStat
          label="Convert"
          value={stats.conversion}
          helper="CAS / visa / app"
          active={filter === "conversion"}
          onClick={() => setFilter("conversion")}
        />
      </div>

      <StatusToast
        status={status}
        onClear={() => setStatus(null)}
      />

      <QuickTaskCreator
        snapshot={snapshot}
        counselor={counselor}
        onRefresh={onRefresh}
        setStatus={setStatus}
      />

      <div className="mb-5 rounded-[1.4rem] border-2 border-[#d8b892] bg-[#fff8ef] p-3.5">
        <div className="grid gap-3 2xl:grid-cols-[minmax(0,1fr)_190px_210px_auto]">
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search task, student, category, status, priority or next action..."
            className={INPUT_CLASS}
          />

          <select
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
            className={INPUT_CLASS}
            aria-label="Filter counselor tasks"
          >
            {FILTERS.map((item) => (
              <option key={item.key} value={item.key}>
                {item.label}
              </option>
            ))}
          </select>

          <select
            value={sort}
            onChange={(event) => setSort(event.target.value)}
            className={INPUT_CLASS}
            aria-label="Sort counselor tasks"
          >
            {SORTS.map((item) => (
              <option key={item.key} value={item.key}>
                Sort: {item.label}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={reset}
            disabled={!hasActiveControls}
            className="rounded-2xl border-2 border-[#173f69] bg-[#173f69] px-4 py-3 text-sm font-black text-white transition hover:bg-[#102f52] disabled:cursor-default disabled:opacity-45"
          >
            Reset
          </button>
        </div>
      </div>

      <div className="mb-3 flex flex-col gap-2 rounded-2xl border border-[#d8b892] bg-[#fff8ef] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs font-black uppercase tracking-[0.14em] text-[#7d684f]">
          Execution queue · {filtered.length} visible tasks
        </p>

        <p className="text-xs font-semibold text-[#607487]">
          Sort: {SORTS.find((item) => item.key === sort)?.label || "Priority"}
        </p>
      </div>

      <div className="grid gap-3">
        {filtered.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-[#c9d5de] bg-[#fffdf8] p-7 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border-2 border-orange-200 bg-orange-50 text-lg font-black text-orange-700">
              T
            </div>

            <p className="mt-3 text-sm font-black text-[#102b4c]">
              No counselor tasks found.
            </p>

            <p className="mx-auto mt-2 max-w-2xl text-sm leading-6 text-[#607487]">
              Tasks created from Assigned Students, Appointments, Support or the
              Quick Task Creator will appear here. Clear the current filters if tasks
              already exist.
            </p>

            {hasActiveControls ? (
              <button
                type="button"
                onClick={reset}
                className="mt-4 rounded-xl border-2 border-orange-300 bg-orange-50 px-4 py-2 text-xs font-black text-orange-700 transition hover:border-orange-400"
              >
                Clear Search & Filters
              </button>
            ) : null}
          </div>
        ) : (
          filtered.map((task, index) => (
            <TaskCard
              key={
                task.id ||
                `${task.studentName || "student"}-${
                  task.title || "task"
                }-${index}`
              }
              task={task}
              savingId={savingId}
              completeTask={completeTask}
              markInProgress={markInProgress}
            />
          ))
        )}
      </div>
    </section>
  );
}
