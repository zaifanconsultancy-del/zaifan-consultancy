import { lazy, Suspense, useMemo } from "react";
import {
  Bot,
  CheckCircle2,
  CircleAlert,
  ListChecks,
  ShieldCheck,
  Zap,
} from "lucide-react";

const AutomationPage = lazy(() => import("./AutomationPage"));
const NotificationActionCenter = lazy(() =>
  import("../workspaces/communications/NotificationActionCenter")
);

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
  "operations-actions": {
    title: "Action Queue",
    eyebrow: "Operations",
    description:
      "Human-reviewed CRM actions requiring attention before execution.",
    icon: Zap,
  },
});

function OperationsPage({
  workspaceMode = "operations-tasks",
  inquiries = [],
  appointments = [],
  followUpReminders = [],
  studentTasks = [],
  setActiveTab,
  toggleInquiryStatus,
  updateAppointmentStatus,
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
    <section className="space-y-5">
      {workspaceMode === "operations-tasks" ? (
        <header className="overflow-hidden rounded-[1.8rem] border-[3px] border-orange-400 bg-[#FFF8EF] shadow-[0_16px_42px_rgba(15,35,63,0.08)]">
          <div className="grid xl:grid-cols-[1.35fr_0.65fr]">
            <div className="bg-[#123865] p-5 text-white sm:p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[9px] font-black uppercase tracking-[0.14em] text-white">
                      Operations
                    </span>
                    <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[9px] font-black uppercase tracking-[0.14em] text-white">
                      Student OS Queue
                    </span>
                  </div>

                  <h1 className="mt-4 text-2xl font-black tracking-tight text-white sm:text-3xl">
                    Task Command Center
                  </h1>

                  <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-white">
                    Prioritize overdue student work, clear operational blockers,
                    and keep every open task moving without losing case context.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setActiveTab?.("students")}
                  className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl border-2 border-white/35 bg-white/10 px-4 py-2.5 text-xs font-black text-white transition hover:-translate-y-0.5 hover:bg-white/20"
                >
                  <ListChecks size={14} />
                  Open Students
                </button>
              </div>

              <div className="mt-5 grid gap-2 sm:grid-cols-3">
                <CommandMetric label="Open Queue" value={taskMetrics.open} />
                <CommandMetric label="Due / Overdue" value={taskMetrics.overdue} />
                <CommandMetric label="All Tasks" value={taskMetrics.total} />
              </div>
            </div>

            <div className="bg-orange-500 p-5 text-white sm:p-6">
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

              <div className="mt-5 rounded-2xl border border-white/30 bg-white/10 p-4">
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

          <div className="grid gap-3 border-t-[3px] border-[#123865] bg-[#FFF8EF] p-4 sm:grid-cols-3 sm:p-5">
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

        {workspaceMode === "operations-actions" ? (
          <NotificationActionCenter
            inquiries={inquiries}
            appointments={appointments}
            followUpReminders={followUpReminders}
            updateInquiryStatus={toggleInquiryStatus}
            updateAppointmentStatus={updateAppointmentStatus}
            setActiveTab={setActiveTab}
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
    <section className="overflow-hidden rounded-[1.8rem] border-[3px] border-[#123865] bg-[#FFF8EF] shadow-[0_16px_40px_rgba(15,35,63,0.07)]">
      <div className="flex flex-col gap-4 border-b-[3px] border-[#123865] bg-white p-4 sm:p-5 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-[9px] font-black uppercase tracking-[0.17em] text-orange-700">
            Cross-student Task Inbox
          </p>
          <h2 className="mt-1 text-xl font-black text-[#10233F]">
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
        <div className="grid gap-3 p-4 sm:p-5 xl:grid-cols-2">
          {metrics.rows.slice(0, 100).map((task, index) => (
            <TaskRow
              key={task?.id || `${task?.student_id || "student"}-${index}`}
              task={task}
              setActiveTab={setActiveTab}
            />
          ))}
        </div>
      ) : (
        <div className="p-8 text-center sm:p-12">
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
        ? "border-orange-300 bg-orange-50 text-orange-800"
        : "border-blue-300 bg-blue-50 text-blue-700";

  return (
    <span
      className={`rounded-xl border-2 px-3 py-2 text-[10px] font-black uppercase tracking-[0.08em] ${toneClass}`}
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
        ? "border-orange-300 bg-orange-50 text-orange-800"
        : priority === "medium"
          ? "border-blue-300 bg-blue-50 text-blue-700"
          : "border-slate-300 bg-slate-50 text-slate-600";

  return (
    <article
      className={`group relative overflow-hidden rounded-[1.45rem] border-[3px] bg-white p-4 transition hover:-translate-y-0.5 hover:shadow-[0_14px_30px_rgba(15,35,63,0.10)] sm:p-5 ${
        overdue
          ? "border-red-300"
          : priority === "critical" || priority === "urgent" || priority === "high"
            ? "border-orange-300"
            : "border-[#C7D6E5]"
      }`}
    >
      <div
        className={`absolute inset-y-0 left-0 w-1.5 ${
          overdue
            ? "bg-red-500"
            : priority === "critical" || priority === "urgent" || priority === "high"
              ? "bg-orange-500"
              : "bg-[#123865]"
        }`}
      />

      <div className="pl-2">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`rounded-full border-2 px-2.5 py-1 text-[8px] font-black uppercase tracking-[0.08em] ${
                  overdue
                    ? "border-red-300 bg-red-50 text-red-700"
                    : "border-blue-300 bg-blue-50 text-blue-700"
                }`}
              >
                {overdue ? "Overdue" : status.replace(/_/g, " ")}
              </span>

              <span
                className={`rounded-full border-2 px-2.5 py-1 text-[8px] font-black uppercase tracking-[0.08em] ${priorityClass}`}
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
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border-2 border-orange-400 bg-orange-50 px-3 py-2 text-xs font-black text-orange-700 transition group-hover:bg-orange-500 group-hover:text-white"
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
          : "border-[#D7E1EB] bg-[#FFF8EF]"
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
      : "border-orange-200 bg-orange-50 text-orange-800";

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
      ? "border-red-400 bg-red-50 text-red-700"
      : tone === "blue"
        ? "border-blue-400 bg-blue-50 text-blue-700"
        : "border-[#123865] bg-slate-50 text-[#123865]";

  return (
    <div className={`rounded-[1.35rem] border-[3px] p-4 ${toneClass}`}>
      <p className="text-[8px] font-black uppercase tracking-[0.13em]">
        {label}
      </p>
      <p className="mt-1 text-2xl font-black">{value}</p>
    </div>
  );
}

function CommandMetric({ label, value }) {
  return (
    <div className="rounded-2xl border border-white/15 bg-white/10 p-3">
      <p className="text-[8px] font-black uppercase tracking-[0.13em] text-white">
        {label}
      </p>
      <p className="mt-1 text-lg font-black text-white">{value}</p>
    </div>
  );
}

function WorkspaceLoader() {
  return (
    <div className="flex min-h-[260px] items-center justify-center rounded-[1.5rem] border-[3px] border-orange-300 bg-[#FFF8EF]">
      <div className="text-center">
        <div className="mx-auto h-9 w-9 animate-spin rounded-full border-[3px] border-orange-100 border-t-orange-500" />
        <p className="mt-3 text-sm font-black text-[#10233F]">
          Opening operations workspace
        </p>
      </div>
    </div>
  );
}

export default OperationsPage;