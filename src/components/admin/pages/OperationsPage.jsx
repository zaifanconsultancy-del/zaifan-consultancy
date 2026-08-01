import { lazy, Suspense, useMemo } from "react";
import {
  Bot,
  CheckCircle2,
  CircleAlert,
  ListChecks,
  ShieldCheck,
} from "lucide-react";

const AutomationPage = lazy(() => import("./AutomationPage"));
const WORKSPACES = Object.freeze({
  "operations-tasks": {
    title: "Task Center",
    eyebrow: "Operations",
    description:
      "One cross-student view of real Student OS tasks that still require work.",
    icon: ListChecks,
  },
  "operations-automation": {
    title: "Automation",
    eyebrow: "Operations",
    description:
      "Rules, reminders and automation intelligence stay in one operational home.",
    icon: Bot,
  },
});

// OperationsPage PARTNER OS EXTREME V2 — Cross-Student Operations Command Center

function OperationsPage({
  workspaceMode = "operations-tasks",
  inquiries = [],
  appointments = [],
  studentTasks = [],
  setActiveTab,
}) {
  const workspace =
    WORKSPACES[workspaceMode] || WORKSPACES["operations-tasks"];
  const WorkspaceIcon = workspace.icon;

  const taskMetrics = useMemo(() => {
    const rows = Array.isArray(studentTasks) ? studentTasks : [];

    const open = rows.filter(
      (task) =>
        !["completed", "done", "closed", "cancelled", "canceled"].includes(
          String(task?.status || "").toLowerCase()
        )
    );

    const overdue = open.filter((task) => {
      const due = task?.due_date || task?.due_at || task?.deadline;
      if (!due) return false;
      const date = new Date(due);
      return !Number.isNaN(date.getTime()) && date.getTime() < Date.now();
    });

    return {
      total: rows.length,
      open: open.length,
      overdue: overdue.length,
      rows: open,
    };
  }, [studentTasks]);

  return (
    <section className="min-w-0 space-y-5 rounded-[2.2rem] border-[4px] border-[#123865] bg-[#FFF8EF] p-3 shadow-[0_24px_65px_rgba(18,56,101,0.15)] sm:p-4 lg:p-5">
      {workspaceMode === "operations-tasks" ? (
        <header className="min-w-0 overflow-hidden rounded-[1.75rem] border-[3px] border-[#FF5A0A] bg-white shadow-[0_18px_50px_rgba(18,56,101,0.11)]">
          <div className="grid min-w-0 lg:grid-cols-[minmax(0,1.28fr)_minmax(18rem,0.72fr)]">
            <div className="min-w-0 bg-[#123865] p-5 text-white sm:p-6 lg:p-7">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full border-2 border-white/20 bg-white/10 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.12em] text-white">
                      Operations
                    </span>
                    <span className="rounded-full border-2 border-white/20 bg-white/10 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.12em] text-white">
                      Student OS Queue
                    </span>
                  </div>

                  <h1 className="mt-4 break-words text-3xl font-black leading-tight tracking-[-0.035em] text-white sm:text-4xl">
                    Task Command Center
                  </h1>

                  <p className="mt-3 max-w-3xl break-words text-sm font-semibold leading-6 text-slate-100">
                    Prioritize overdue student work, clear operational blockers,
                    and keep every open task moving without losing case context.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setActiveTab?.("students")}
                  className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl border-2 border-white bg-white px-4 py-2.5 text-xs font-black text-[#123865] shadow-sm transition hover:-translate-y-0.5 hover:bg-[#FFF4E8] hover:shadow-md focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/25"
                >
                  <ListChecks size={14} />
                  Open Students
                </button>
              </div>

              <div className="mt-5 grid min-w-0 grid-cols-2 gap-2 sm:grid-cols-3">
                <CommandMetric label="Open Queue" value={taskMetrics.open} />
                <CommandMetric label="Due / Overdue" value={taskMetrics.overdue} />
                <CommandMetric label="All Tasks" value={taskMetrics.total} />
              </div>
            </div>

            <div className="min-w-0 border-t-[3px] border-[#FF5A0A] bg-[#FF5A0A] p-5 text-white sm:p-6 lg:border-l-[3px] lg:border-t-0 lg:p-7">
              <p className="text-[9px] font-black uppercase tracking-[0.18em] text-white">
                Queue Health
              </p>

              <p className="mt-3 text-3xl font-black text-white">
                {taskMetrics.overdue > 0 ? "Needs action" : "Healthy"}
              </p>

              <p className="mt-1 text-xs font-black uppercase tracking-[0.08em] text-white">
                {taskMetrics.overdue > 0
                  ? `${taskMetrics.overdue} overdue task${
                      taskMetrics.overdue === 1 ? "" : "s"
                    }`
                  : "No overdue student tasks"}
              </p>

              <div className="mt-5 rounded-[1.2rem] border-2 border-white/25 bg-white/10 p-4">
                <p className="text-[8px] font-black uppercase tracking-[0.14em] text-white/80">
                  Operational Load
                </p>
                <p className="mt-1 text-2xl font-black text-white">
                  {taskMetrics.open}
                </p>
                <p className="mt-1 text-xs font-semibold text-white/90">
                  open Student OS tasks
                </p>
              </div>
            </div>
          </div>

          <div className="grid min-w-0 gap-3 border-t-[3px] border-[#123865] bg-[#FFF8EF] p-4 sm:grid-cols-3 sm:p-5">
            <TaskSummaryCard
              label="Total"
              value={taskMetrics.total}
              tone="navy"
            />
            <TaskSummaryCard
              label="Open"
              value={taskMetrics.open}
              tone="blue"
            />
            <TaskSummaryCard
              label="Overdue"
              value={taskMetrics.overdue}
              tone="red"
            />
          </div>
        </header>
      ) : null}

      <Suspense fallback={<WorkspaceLoader />}>
        {workspaceMode === "operations-tasks" ? (
          <TaskInbox metrics={taskMetrics} setActiveTab={setActiveTab} />
        ) : null}

        {workspaceMode === "operations-automation" ? (
          <AutomationPage
            inquiries={inquiries}
            appointments={appointments}
          />
        ) : null}

      </Suspense>
    </section>
  );
}

function TaskInbox({ metrics, setActiveTab }) {
  const immediate = metrics.rows.filter((task) => {
    const dueValue = task?.due_date || task?.due_at || task?.deadline;
    if (!dueValue) return false;

    const dueDate = new Date(dueValue);
    return !Number.isNaN(dueDate.getTime()) && dueDate.getTime() < Date.now();
  });

  const highPriority = metrics.rows.filter((task) =>
    ["critical", "urgent", "high"].includes(
      String(task?.priority || "").trim().toLowerCase()
    )
  );

  return (
    <section className="min-w-0 overflow-hidden rounded-[1.65rem] border-[3px] border-[#123865] bg-white shadow-[0_14px_38px_rgba(18,56,101,0.08)]">
      <div className="flex min-w-0 flex-col gap-4 border-b-[3px] border-[#FF5A0A] bg-[#123865] p-4 text-white sm:p-5 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-[9px] font-black uppercase tracking-[0.14em] text-orange-200">
            Cross-student Task Inbox
          </p>
          <h2 className="mt-1 text-xl font-black text-white">
            Work that still needs attention
          </h2>
        </div>

        <div className="flex flex-wrap gap-2">
          <QueuePill label="Overdue" value={immediate.length} tone="red" />
          <QueuePill label="High Priority" value={highPriority.length} tone="orange" />
          <QueuePill label="Open" value={metrics.open} tone="blue" />
        </div>
      </div>

      {metrics.rows.length ? (
        <div className="grid min-w-0 gap-3 bg-[#FFF8EF] p-4 sm:p-5 xl:grid-cols-2">
          {metrics.rows.slice(0, 100).map((task, index) => (
            <TaskRow
              key={task?.id || `${task?.student_id || "student"}-${index}`}
              task={task}
              setActiveTab={setActiveTab}
            />
          ))}
        </div>
      ) : (
        <div className="m-4 rounded-[1.5rem] border-[3px] border-dashed border-emerald-300 bg-emerald-50 p-8 text-center sm:m-5 sm:p-12">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border-[3px] border-emerald-300 bg-emerald-50 text-emerald-700">
            <CheckCircle2 size={24} />
          </span>
          <p className="mt-4 text-lg font-black text-[#10233F]">
            Student operations queue is clear
          </p>
          <p className="mx-auto mt-2 max-w-xl text-sm font-semibold leading-6 text-slate-500">
            No open Student OS tasks are loaded.
          </p>
        </div>
      )}
    </section>
  );
}

function QueuePill({ label, value, tone }) {
  const toneClass =
    tone === "red"
      ? "border-red-300 bg-red-50 text-red-700"
      : tone === "orange"
        ? "border-[#FF5A0A] bg-[#FFF4E8] text-[#C2410C]"
        : "border-blue-300 bg-blue-50 text-blue-700";

  return (
    <span
      className={`rounded-xl border-[3px] px-3 py-2 text-[10px] font-black uppercase tracking-[0.08em] shadow-sm ${toneClass}`}
    >
      {label} · {value}
    </span>
  );
}

function TaskRow({ task, setActiveTab }) {
  const dueValue = task?.due_date || task?.due_at || task?.deadline || "";
  const dueDate = dueValue ? new Date(dueValue) : null;

  const overdue =
    dueDate &&
    !Number.isNaN(dueDate.getTime()) &&
    dueDate.getTime() < Date.now();

  const studentLabel =
    task?.student_name ||
    task?.full_name ||
    (task?.student_id ? `Student #${task.student_id}` : "Student");

  const priority = String(task?.priority || "normal").trim().toLowerCase();
  const status = String(task?.status || "open").trim().toLowerCase();

  const owner =
    task?.assigned_to_name ||
    task?.assigned_admin_name ||
    task?.owner_name ||
    task?.counselor_name ||
    "Unassigned";

  const description =
    task?.description ||
    task?.notes ||
    task?.task_description ||
    "";

  const priorityClass =
    priority === "critical" || priority === "urgent"
      ? "border-red-300 bg-red-50 text-red-700"
      : priority === "high"
        ? "border-[#FF5A0A] bg-[#FFF4E8] text-[#C2410C]"
        : priority === "medium"
          ? "border-blue-300 bg-blue-50 text-blue-700"
          : "border-[#C9D7E6] bg-[#FFF8EF] text-slate-600";

  return (
    <article
      className="group relative min-w-0 overflow-hidden rounded-[1.45rem] border-[3px] border-[#C9D7E6] bg-white p-4 shadow-[0_7px_18px_rgba(18,56,101,0.05)] transition hover:-translate-y-0.5 hover:border-[#FF5A0A] hover:shadow-[0_12px_30px_rgba(18,56,101,0.10)] sm:p-5"
    >
      <div
        className={`absolute inset-y-0 left-0 w-1.5 ${
          overdue
            ? "bg-red-500"
            : priority === "critical" || priority === "urgent" || priority === "high"
              ? "bg-[#FF5A0A]"
              : "bg-[#123865]"
        }`}
      />

      <div className="pl-2">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`rounded-lg border-2 px-2.5 py-1 text-[8px] font-black uppercase tracking-[0.08em] ${
                  overdue
                    ? "border-red-300 bg-red-50 text-red-700"
                    : "border-blue-300 bg-blue-50 text-blue-700"
                }`}
              >
                {overdue ? "Overdue" : status.replace(/_/g, " ")}
              </span>

              <span
                className={`rounded-lg border-2 px-2.5 py-1 text-[8px] font-black uppercase tracking-[0.08em] ${priorityClass}`}
              >
                {priority} priority
              </span>
            </div>

            <h3 className="mt-3 line-clamp-2 text-base font-black leading-5 text-[#10233F]">
              {task?.title || task?.task_title || task?.name || "Student task"}
            </h3>

            {description ? (
              <p className="mt-1.5 line-clamp-2 text-xs font-semibold leading-5 text-slate-500">
                {description}
              </p>
            ) : null}
          </div>

          <button
            type="button"
            onClick={() => setActiveTab?.("students")}
            className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-xl border-2 border-[#123865] bg-white px-3 text-xs font-black text-[#123865] shadow-sm transition hover:-translate-y-0.5 hover:border-[#FF5A0A] hover:bg-[#FFF4E8] hover:shadow-md"
          >
            <CircleAlert size={13} />
            Open Student
          </button>
        </div>

        <div className="mt-4 grid gap-2 sm:grid-cols-3">
          <TaskInfo label="Student" value={studentLabel} />
          <TaskInfo
            label="Due"
            value={
              dueValue
                ? new Date(dueValue).toLocaleDateString("en-GB", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })
                : "No deadline"
            }
            danger={overdue}
          />
          <TaskInfo label="Owner" value={owner} />
        </div>
      </div>
    </article>
  );
}

function TaskInfo({ label, value, danger = false }) {
  return (
    <div
      className={`rounded-xl border-2 px-3 py-2.5 ${
        danger
          ? "border-red-200 bg-red-50"
          : "border-[#C9D7E6] bg-[#FFF8EF]"
      }`}
    >
      <p
        className={`text-[8px] font-black uppercase tracking-[0.12em] ${
          danger ? "text-red-600" : "text-slate-500"
        }`}
      >
        {label}
      </p>
      <p
        className={`mt-1 truncate text-xs font-black ${
          danger ? "text-red-700" : "text-[#10233F]"
        }`}
      >
        {value || "—"}
      </p>
    </div>
  );
}

function QueueSignal({ label, value, tone }) {
  const toneClass =
    tone === "danger"
      ? "border-red-200 bg-red-50 text-red-700"
      : "border-orange-200 bg-[#FFF4E8] text-[#C2410C]";

  return (
    <div className={`flex min-h-[104px] flex-col justify-center border-r last:border-r-0 p-4 ${toneClass}`}>
      <p className="text-[8px] font-black uppercase tracking-[0.12em]">
        {label}
      </p>
      <p className="mt-1 text-2xl font-black">{value}</p>
    </div>
  );
}

function TaskSummaryCard({ label, value, tone }) {
  const toneClass =
    tone === "red"
      ? "border-red-300 bg-red-50 text-red-700"
      : tone === "blue"
        ? "border-[#60A5FA] bg-[#F2F7FF] text-blue-700"
        : "border-[#234E78] bg-[#F7FAFC] text-[#123865]";

  return (
    <div className={`min-w-0 rounded-[1.35rem] border-[3px] p-4 shadow-[0_7px_18px_rgba(18,56,101,0.05)] transition hover:-translate-y-0.5 hover:shadow-md ${toneClass}`}>
      <p className="text-[8px] font-black uppercase tracking-[0.13em]">
        {label}
      </p>
      <p className="mt-1 text-2xl font-black">{value}</p>
    </div>
  );
}

function CommandMetric({ label, value }) {
  return (
    <div className="min-w-0 rounded-xl border-2 border-white/25 bg-white/10 p-3 text-white shadow-inner">
      <p className="text-[8px] font-black uppercase tracking-[0.13em] text-white">
        {label}
      </p>
      <p className="mt-1 text-lg font-black text-white">{value}</p>
    </div>
  );
}

function WorkspaceLoader() {
  return (
    <div className="flex min-h-[260px] items-center justify-center rounded-[1.55rem] border-[3px] border-[#123865] bg-white p-6 shadow-[0_12px_34px_rgba(18,56,101,0.06)]">
      <div className="text-center">
        <div className="mx-auto h-9 w-9 animate-spin rounded-full border-[3px] border-orange-100 border-t-[#FF5A0A]" />
        <p className="mt-3 text-sm font-black text-[#10233F]">
          Opening operations workspace
        </p>
      </div>
    </div>
  );
}

export default OperationsPage;