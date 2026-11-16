// Tasks: every to-do across all students, for the whole team.
// "Mine" is each worker's day (overdue → today → this week → later);
// "Everyone" adds a team strip so the admin sees who is behind.
// Tasks always belong to a student (student_tasks), so they also show on that
// student's file.

import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { CalendarClock, CheckCircle2, ClipboardList, Plus, Search, Trash2 } from "lucide-react";

import { useAdminData } from "../data/AdminDataProvider";
import { classNames, daysUntil, dueLabel, firstName, fmtDate, timeAgo } from "../lib/format";
import { path } from "../lib/paths";
import { isDone, PRIORITIES, personMatches, STAGE_BY_ID } from "../lib/people";
import { Avatar, Button, Card, Chip, EmptyState, Field, FormRow, Input, Modal, Segmented, Select, Spinner, Textarea, useConfirm, useForm, useToast } from "../ui/kit";

const GROUPS = [
  { id: "overdue", label: "Overdue", color: "#ef4444", hint: "Past their date. Do these first." },
  { id: "today", label: "Today", color: "#ff4b12", hint: "Due today." },
  { id: "week", label: "This week", color: "#0ea5e9", hint: "Due in the next 7 days." },
  { id: "later", label: "Later", color: "#64748b", hint: "More than a week away." },
  { id: "nodate", label: "No date", color: "#94a3b8", hint: "Give these a date so they don't get forgotten." },
];

function groupOf(task) {
  if (!task.due_date) return "nodate";
  const days = daysUntil(task.due_date);
  if (days < 0) return "overdue";
  if (days === 0) return "today";
  if (days <= 7) return "week";
  return "later";
}

const PRIORITY_RANK = { urgent: 0, high: 1, normal: 2, medium: 2, low: 3 };

export default function TasksPage() {
  const { people, staff, staffById, admin, isCounselor, loading, update, logEvent } = useAdminData();
  const [params, setParams] = useSearchParams();
  const view = params.get("view") || "mine";
  const [who, setWho] = useState("");
  const [query, setQuery] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [showDone, setShowDone] = useState(false);
  const toast = useToast();

  // Every task, with its student attached.
  const all = useMemo(
    () =>
      people.flatMap((person) =>
        person.tasks.map((task) => ({ ...task, person, group: groupOf(task) }))
      ),
    [people]
  );

  const open = all.filter((task) => !isDone(task.status));
  const mineOpen = open.filter((task) => task.assigned_to === admin.id);

  const visible = useMemo(() => {
    let list = all.filter((task) => (showDone ? isDone(task.status) : !isDone(task.status)));
    if (view === "mine") list = list.filter((task) => task.assigned_to === admin.id);
    else if (view === "unassigned") list = list.filter((task) => !task.assigned_to);
    if (who) list = list.filter((task) => task.assigned_to === who);
    if (query.trim()) list = list.filter((task) => `${task.title} ${task.description || ""}`.toLowerCase().includes(query.trim().toLowerCase()) || personMatches(task.person, query));
    return list.sort(
      (a, b) =>
        (a.due_date ? new Date(a.due_date) : Infinity) - (b.due_date ? new Date(b.due_date) : Infinity) ||
        (PRIORITY_RANK[a.priority] ?? 2) - (PRIORITY_RANK[b.priority] ?? 2)
    );
  }, [all, view, who, query, showDone, admin.id]);

  const finish = async (task) => {
    await update("tasks", task.id, { status: "completed", completed_at: new Date().toISOString() });
    await logEvent(task.person, { actionType: "task_completed", title: `Done: ${task.title}` });
    toast.push(`Done: ${task.title}`);
  };

  if (loading) return <Spinner label="Loading tasks…" />;

  const myOverdue = mineOpen.filter((task) => task.group === "overdue").length;
  const myToday = mineOpen.filter((task) => task.group === "today").length;

  return (
    <div className="space-y-5">
      {/* Navy "my day" board */}
      <section className="relative overflow-hidden rounded-[28px] bg-[#071f50] text-white shadow-[0_24px_60px_rgba(7,31,80,0.2)]">
        <div aria-hidden="true" className="pointer-events-none absolute -right-24 -top-40 h-[440px] w-[440px] rounded-full border border-white/[0.06]" />
        <div className="relative flex flex-col gap-6 p-6 sm:p-8 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#ff8a5c]">Tasks · my day</p>
            <h1 className="mt-2 text-[1.9rem] font-black leading-tight tracking-[-0.02em] sm:text-[2.3rem]">
              {myOverdue + myToday ? `${myOverdue + myToday} thing${myOverdue + myToday === 1 ? "" : "s"} for you today, ${firstName(admin.name)}` : `You're on top of it, ${firstName(admin.name)}`}
            </h1>
            <p className="mt-2 max-w-xl text-[15px] leading-6 text-white/65">
              Tick a task when it's done. Give tasks to {isCounselor ? "yourself" : "anyone on the team"} with a date, so nothing about a student is forgotten.
            </p>
          </div>
          <div className="flex flex-wrap gap-2.5">
            <BoardNumber label="Overdue" value={myOverdue} accent={myOverdue > 0} />
            <BoardNumber label="Today" value={myToday} />
            <BoardNumber label="This week" value={mineOpen.filter((task) => task.group === "week").length} />
            <Button variant="primary" icon={Plus} onClick={() => setAddOpen(true)} className="self-center">
              New task
            </Button>
          </div>
        </div>
      </section>

      {!isCounselor ? <TeamLoad staff={staff} open={open} onPick={(id) => { setParams({ view: "everyone" }); setWho(id); }} /> : null}

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <Segmented
            value={view}
            onChange={(value) => {
              setWho("");
              setParams(value === "mine" ? {} : { view: value });
            }}
            options={[
              { id: "mine", label: "My tasks", count: mineOpen.length },
              ...(!isCounselor ? [{ id: "everyone", label: "Everyone", count: open.length }] : [{ id: "everyone", label: "All my students", count: open.length }]),
              { id: "unassigned", label: "Nobody's", color: "#94a3b8", count: open.filter((task) => !task.assigned_to).length },
            ]}
          />
          <button type="button" onClick={() => setShowDone(!showDone)} className="text-[13px] font-extrabold text-[#071f50]/50 hover:text-[#071f50]">
            {showDone ? "← Back to open tasks" : "Show finished"}
          </button>
        </div>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
          {view === "everyone" && !isCounselor ? (
            <Select value={who} onChange={(event) => setWho(event.target.value)} className="sm:w-48" aria-label="Who">
              <option value="">Anyone</option>
              {staff.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.name}
                </option>
              ))}
            </Select>
          ) : null}
          <label className="relative block">
            <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#071f50]/35" />
            <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search task or student" className="pl-10 sm:w-64" />
          </label>
        </div>
      </div>

      {visible.length ? (
        showDone ? (
          <Card className="divide-y divide-[#071f50]/[0.06]">
            {[...visible]
              .sort((a, b) => new Date(b.completed_at || b.updated_at || 0) - new Date(a.completed_at || a.updated_at || 0))
              .slice(0, 60)
              .map((task) => (
                <TaskRow key={task.id} task={task} staffById={staffById} done />
              ))}
          </Card>
        ) : (
          <div className="space-y-4">
            {GROUPS.map((group) => {
              const items = visible.filter((task) => task.group === group.id);
              if (!items.length) return null;
              return (
                <Card key={group.id} className="overflow-hidden">
                  <header className="flex items-center justify-between gap-3 border-b border-[#071f50]/8 px-5 py-3">
                    <h2 className="flex items-center gap-2 text-[14px] font-black text-[#071f50]">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ background: group.color }} />
                      {group.label}
                      <span className="rounded-full bg-[#071f50]/[0.06] px-2 py-0.5 text-[11px]">{items.length}</span>
                    </h2>
                    <p className="hidden text-[12px] font-semibold text-[#071f50]/45 sm:block">{group.hint}</p>
                  </header>
                  <ul className="divide-y divide-[#071f50]/[0.06]">
                    {items.map((task) => (
                      <TaskRow key={task.id} task={task} staffById={staffById} onFinish={() => finish(task)} />
                    ))}
                  </ul>
                </Card>
              );
            })}
          </div>
        )
      ) : (
        <Card>
          <EmptyState
            icon={view === "mine" ? CheckCircle2 : ClipboardList}
            title={showDone ? "Nothing finished yet" : view === "mine" ? "No open tasks for you" : "No open tasks here"}
            text={showDone ? "Ticked tasks show up here." : "Press “New task” to give someone something to do, with a date."}
            action={
              !showDone ? (
                <Button variant="primary" icon={Plus} onClick={() => setAddOpen(true)}>
                  New task
                </Button>
              ) : null
            }
          />
        </Card>
      )}

      <NewTaskModal open={addOpen} onClose={() => setAddOpen(false)} />
    </div>
  );
}

function BoardNumber({ label, value, accent = false }) {
  return (
    <div className="min-w-[92px] rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3">
      <p className="text-[10px] font-black uppercase tracking-[0.14em] text-white/45">{label}</p>
      <p className={classNames("mt-1 text-[1.9rem] font-black leading-none tabular-nums", accent ? "text-[#ff8a5c]" : "text-white")}>{value}</p>
    </div>
  );
}

function TeamLoad({ staff, open, onPick }) {
  const rows = staff
    .map((member) => {
      const mine = open.filter((task) => task.assigned_to === member.id);
      return { member, total: mine.length, overdue: mine.filter((task) => task.group === "overdue").length, today: mine.filter((task) => task.group === "today").length };
    })
    .sort((a, b) => b.overdue - a.overdue || b.total - a.total);
  if (staff.length < 2) return null;
  return (
    <Card className="p-4">
      <p className="px-1 text-[11px] font-black uppercase tracking-[0.16em] text-[#071f50]/45">Team load · click a person to see their list</p>
      <ul className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
        {rows.map(({ member, total, overdue, today }) => (
          <li key={member.id}>
            <button type="button" onClick={() => onPick(member.id)} className="flex w-full items-center gap-3 rounded-2xl border border-[#071f50]/8 px-3 py-2.5 text-left transition hover:border-[#071f50]/25">
              <Avatar name={member.name} size={36} />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[14px] font-black text-[#071f50]">{member.name}</span>
                <span className="block text-[12px] font-semibold text-[#071f50]/50">
                  {total} open{today ? ` · ${today} today` : ""}
                </span>
              </span>
              {overdue ? <Chip color="#ef4444" dot={false}>{overdue} late</Chip> : <Chip color="#10b981" dot={false}>on track</Chip>}
            </button>
          </li>
        ))}
      </ul>
    </Card>
  );
}

function TaskRow({ task, staffById, onFinish, done = false }) {
  const { remove } = useAdminData();
  const confirm = useConfirm();
  const assignee = task.assigned_to ? staffById.get(task.assigned_to) : null;
  const priority = PRIORITIES.find((item) => item.id === task.priority);
  const days = task.due_date ? daysUntil(task.due_date) : null;
  const stage = STAGE_BY_ID[task.person.stage];

  const trash = async () => {
    const yes = await confirm({ title: `Delete “${task.title}”?`, text: "Use this for tasks added by mistake. For finished work, tick it instead.", confirmLabel: "Delete", danger: true });
    if (yes) await remove("tasks", task.id);
  };

  return (
    <li className="group flex items-start gap-3 px-5 py-3.5 transition hover:bg-[#071f50]/[0.02]">
      {done ? (
        <CheckCircle2 size={20} className="mt-0.5 shrink-0 text-emerald-500" />
      ) : (
        <input type="checkbox" onChange={onFinish} className="mt-1 h-5 w-5 shrink-0 cursor-pointer accent-[#ff4b12]" aria-label={`Mark “${task.title}” done`} />
      )}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className={classNames("text-[14.5px] font-extrabold", done ? "text-[#071f50]/50 line-through" : "text-[#071f50]")}>{task.title}</span>
          {priority && !["normal", "medium"].includes(priority.id) ? (
            <Chip color={priority.color} dot={false}>
              {priority.label}
            </Chip>
          ) : null}
        </div>
        {task.description ? <p className="mt-0.5 line-clamp-1 text-[12.5px] text-[#071f50]/55">{task.description}</p> : null}
        <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[12px] font-semibold text-[#071f50]/50">
          <Link to={path(`/people/${task.person.id}?tab=tasks`)} className="inline-flex items-center gap-1.5 font-extrabold text-[#071f50]/75 hover:text-[#ff4b12] hover:underline">
            <span className="h-2 w-2 rounded-full" style={{ background: stage?.color }} />
            {task.person.name}
          </Link>
          {task.person.country ? <span>· {task.person.country}</span> : null}
          {done && task.completed_at ? <span>· finished {timeAgo(task.completed_at)}</span> : null}
        </p>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1.5">
        {task.due_date && !done ? (
          <span className={classNames("inline-flex items-center gap-1 text-[12px] font-black", days < 0 ? "text-rose-600" : days === 0 ? "text-[#ff4b12]" : "text-[#071f50]/60")}>
            <CalendarClock size={13} />
            {dueLabel(task.due_date)}
          </span>
        ) : null}
        {assignee ? (
          <span className="inline-flex items-center gap-1.5 text-[12px] font-bold text-[#071f50]/60" title={`Given to ${assignee.name}`}>
            <Avatar name={assignee.name} size={20} />
            {firstName(assignee.name)}
          </span>
        ) : (
          <span className="text-[11.5px] font-bold text-[#071f50]/35">nobody</span>
        )}
        {!done ? (
          <button type="button" onClick={trash} className="rounded-lg p-1 text-[#071f50]/25 opacity-0 transition hover:bg-rose-50 hover:text-rose-600 group-hover:opacity-100" aria-label="Delete task">
            <Trash2 size={14} />
          </button>
        ) : null}
      </div>
    </li>
  );
}

const QUICK = [
  { label: "Today", days: 0 },
  { label: "Tomorrow", days: 1 },
  { label: "In 3 days", days: 3 },
  { label: "Next week", days: 7 },
];

function dateIn(days) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

/** Give a task about a student to someone, with a date. */
export function NewTaskModal({ open, onClose, person: fixedPerson = null }) {
  const { people, staff, admin, isCounselor, insert, logEvent } = useAdminData();
  const toast = useToast();
  const [form, set, reset, setForm] = useForm({ personId: fixedPerson?.id || "", title: "", description: "", due_date: dateIn(1), assigned_to: admin.id, priority: "normal" });
  const [search, setSearch] = useState("");
  const [busy, setBusy] = useState(false);

  const choices = useMemo(
    () => people.filter((person) => person.stage !== "closed" && person.primary && personMatches(person, search)).slice(0, 40),
    [people, search]
  );
  const person = fixedPerson || people.find((item) => item.id === form.personId);
  const assignee = staff.find((member) => member.id === form.assigned_to);
  const notTheirStudent = assignee?.kind === "counselor" && person && person.assignedTo && person.assignedTo !== assignee.id;

  const save = async () => {
    if (!person) return toast.push({ tone: "error", message: "Pick the student this task is about." });
    if (!form.title.trim()) return toast.push({ tone: "error", message: "Write what needs doing." });
    setBusy(true);
    try {
      await insert("tasks", {
        student_id: person.primary.student_id,
        student_type: person.primary.student_type,
        title: form.title.trim(),
        description: form.description.trim() || null,
        status: "pending",
        priority: form.priority,
        due_date: form.due_date ? new Date(`${form.due_date}T09:00:00`).toISOString() : null,
        assigned_to: form.assigned_to || null,
        created_by: admin.id,
        task_type: "general",
        source: "manual",
        metadata: {},
      });
      await logEvent(person, { actionType: "task_created", title: `Task: ${form.title.trim()}${assignee ? ` → ${assignee.name}` : ""}` });
      toast.push(assignee && assignee.id !== admin.id ? `Task given to ${assignee.name}.` : "Task added.");
      reset();
      setSearch("");
      onClose();
    } catch {
      // toast shown by provider
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="New task"
      subtitle="What needs doing, for which student, by whom and by when."
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" busy={busy} onClick={save}>
            Add task
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        {fixedPerson ? null : (
          <Field label="Student" required>
            {person ? (
              <div className="flex items-center justify-between gap-2 rounded-xl border-2 border-[#071f50]/10 px-3 py-2">
                <span className="flex min-w-0 items-center gap-2">
                  <Avatar name={person.name} size={28} />
                  <span className="truncate text-[14px] font-extrabold text-[#071f50]">{person.name}</span>
                  <span className="truncate text-[12px] font-semibold text-[#071f50]/50">{person.country}</span>
                </span>
                <button type="button" onClick={() => setForm((current) => ({ ...current, personId: "" }))} className="text-[12px] font-extrabold text-[#ff4b12] hover:underline">
                  Change
                </button>
              </div>
            ) : (
              <div>
                <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Type a name, phone or country" autoFocus />
                <ul className="mt-1.5 max-h-44 overflow-y-auto rounded-xl border border-[#071f50]/8">
                  {choices.map((item) => (
                    <li key={item.id}>
                      <button type="button" onClick={() => setForm((current) => ({ ...current, personId: item.id }))} className="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-[#071f50]/[0.04]">
                        <Avatar name={item.name} size={24} />
                        <span className="truncate text-[13.5px] font-bold text-[#071f50]">{item.name}</span>
                        <span className="ml-auto shrink-0 text-[11.5px] font-semibold text-[#071f50]/45">{STAGE_BY_ID[item.stage]?.short}</span>
                      </button>
                    </li>
                  ))}
                  {!choices.length ? <li className="px-3 py-3 text-[13px] text-[#071f50]/50">No one matches.</li> : null}
                </ul>
              </div>
            )}
          </Field>
        )}
        <Field label="What needs doing" required>
          <Input value={form.title} onChange={set("title")} placeholder="Call about bank statement" />
        </Field>
        <Field label="Details" hint="optional">
          <Textarea value={form.description} onChange={set("description")} rows={2} placeholder="Anything they need to know" />
        </Field>
        <FormRow>
          <Field label="Who does it">
            <Select value={form.assigned_to} onChange={set("assigned_to")} disabled={isCounselor}>
              <option value="">Nobody yet</option>
              {staff.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.id === admin.id ? `Me (${member.name})` : member.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Priority">
            <Select value={form.priority} onChange={set("priority")}>
              {PRIORITIES.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ))}
            </Select>
          </Field>
        </FormRow>
        <Field label="Due">
          <div className="flex flex-wrap items-center gap-1.5">
            {QUICK.map((item) => {
              const value = dateIn(item.days);
              return (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => setForm((current) => ({ ...current, due_date: value }))}
                  className={classNames(
                    "rounded-full px-3 py-1.5 text-[12.5px] font-extrabold transition",
                    form.due_date === value ? "bg-[#071f50] text-white" : "bg-[#071f50]/[0.06] text-[#071f50] hover:bg-[#071f50]/[0.1]"
                  )}
                >
                  {item.label}
                </button>
              );
            })}
            <Input type="date" value={form.due_date} onChange={set("due_date")} className="h-9 w-auto" />
          </div>
          {form.due_date ? <p className="mt-1 text-[11.5px] font-semibold text-[#071f50]/45">{fmtDate(form.due_date)}</p> : null}
        </Field>
        {notTheirStudent ? (
          <p className="rounded-xl bg-amber-50 px-3 py-2 text-[12.5px] font-semibold leading-5 text-amber-900">
            {assignee.name} is not {person.name}'s counselor, so they won't be able to open this student. Make them the counselor on the student's file, or give the task to someone else.
          </p>
        ) : null}
      </div>
    </Modal>
  );
}
