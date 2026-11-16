// Tasks: things the team must do for this student, plus simple reminders.

import { useState } from "react";
import { CheckSquare, Plus, Trash2 } from "lucide-react";

import { useAdminData } from "../../data/AdminDataProvider";
import { dueLabel, fmtDate, humanize } from "../../lib/format";
import { isDone, PRIORITIES } from "../../lib/people";
import { Button, Card, CardHeader, Chip, EmptyState, Field, FormRow, Input, Modal, Select, Textarea, useConfirm, useForm, useToast } from "../../ui/kit";
import { orNull } from "./shared";

export default function TasksTab({ person }) {
  const { insert, update, remove, logEvent, staff, staffById, admin } = useAdminData();
  const toast = useToast();
  const confirm = useConfirm();
  const [addOpen, setAddOpen] = useState(false);

  const items = [
    ...person.tasks.map((task) => ({ ...task, kind: "task" })),
    ...person.reminders.map((item) => ({ ...item, kind: "reminder", priority: "normal" })),
  ];
  const open = items
    .filter((item) => !isDone(item.status))
    .sort((a, b) => (a.due_date ? new Date(a.due_date) : Infinity) - (b.due_date ? new Date(b.due_date) : Infinity));
  const done = items.filter((item) => isDone(item.status)).sort((a, b) => new Date(b.completed_at || b.updated_at || 0) - new Date(a.completed_at || a.updated_at || 0));

  const finish = async (item, isDoneNow) => {
    const patch = isDoneNow ? { status: "completed", completed_at: new Date().toISOString() } : { status: "pending", completed_at: null };
    await update(item.kind === "task" ? "tasks" : "reminders", item.id, patch);
    if (isDoneNow) await logEvent(person, { actionType: "task_completed", title: `Done: ${item.title}` });
  };

  const trash = async (item) => {
    const yes = await confirm({ title: `Delete “${item.title}”?`, confirmLabel: "Delete", danger: true });
    if (yes) await remove(item.kind === "task" ? "tasks" : "reminders", item.id);
  };

  const add = async (form) => {
    await insert("tasks", {
      student_id: person.primary.student_id,
      student_type: person.primary.student_type,
      title: form.title.trim(),
      description: orNull(form.description),
      status: "pending",
      priority: form.priority,
      due_date: form.due_date ? new Date(`${form.due_date}T09:00:00`).toISOString() : null,
      assigned_to: orNull(form.assigned_to),
      created_by: admin.id,
      task_type: "general",
      source: "manual",
      metadata: {},
    });
    await logEvent(person, { actionType: "task_created", title: `Task added: ${form.title.trim()}` });
    toast.push("Task added.");
    setAddOpen(false);
  };

  const Row = ({ item }) => {
    const finished = isDone(item.status);
    const overdue = !finished && item.due_date && new Date(item.due_date) < new Date();
    const priority = PRIORITIES.find((p) => p.id === item.priority);
    const assignee = item.assigned_to ? staffById.get(item.assigned_to) : null;
    return (
      <li className="flex items-start gap-3 rounded-2xl px-3 py-2.5 hover:bg-[#071f50]/[0.025]">
        <input type="checkbox" checked={finished} onChange={() => finish(item, !finished)} className="mt-1 h-4.5 w-4.5 accent-[#ff4b12]" aria-label={`Mark ${item.title} ${finished ? "not done" : "done"}`} />
        <div className="min-w-0 flex-1">
          <p className={`text-[14px] font-black ${finished ? "text-[#071f50]/40 line-through" : "text-[#071f50]"}`}>{item.title}</p>
          {item.description || item.notes ? <p className="text-[12.5px] text-[#071f50]/60">{item.description || item.notes}</p> : null}
          <p className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[12px] font-semibold text-[#071f50]/50">
            {item.kind === "reminder" ? <Chip color="#0ea5e9" dot={false}>Reminder</Chip> : null}
            {priority && priority.id !== "normal" ? (
              <Chip color={priority.color} dot={false}>
                {priority.label}
              </Chip>
            ) : null}
            {item.due_date ? (
              <Chip color={overdue ? "#ef4444" : "#64748b"} dot={false}>
                {finished ? `was due ${fmtDate(item.due_date)}` : dueLabel(item.due_date)}
              </Chip>
            ) : null}
            {assignee ? <span>· {assignee.name}</span> : null}
            {finished && item.completed_at ? <span>· done {fmtDate(item.completed_at)}</span> : null}
          </p>
        </div>
        <Button size="icon" aria-label="Delete" onClick={() => trash(item)}>
          <Trash2 size={15} className="text-[#071f50]/40" />
        </Button>
      </li>
    );
  };

  return (
    <div className="grid gap-4 xl:grid-cols-[1.2fr_1fr]">
      <Card className="pb-3">
        <CardHeader
          icon={CheckSquare}
          title="To do"
          subtitle={`${open.length} open`}
          action={
            <Button variant="primary" size="sm" icon={Plus} onClick={() => setAddOpen(true)} disabled={!person.primary}>
              Add task
            </Button>
          }
        />
        <ul className="mt-2 px-2">
          {open.map((item) => (
            <Row key={`${item.kind}-${item.id}`} item={item} />
          ))}
        </ul>
        {!open.length ? <EmptyState compact icon={CheckSquare} title="Nothing to do right now" /> : null}
      </Card>

      <Card className="pb-3">
        <CardHeader title="Done" subtitle={`${done.length} finished`} />
        <ul className="mt-2 px-2">
          {done.slice(0, 20).map((item) => (
            <Row key={`${item.kind}-${item.id}`} item={item} />
          ))}
        </ul>
        {!done.length ? <EmptyState compact title="Nothing finished yet" /> : null}
      </Card>

      <AddTaskModal open={addOpen} onClose={() => setAddOpen(false)} onSave={add} staff={staff} />
    </div>
  );
}

function AddTaskModal({ open, onClose, onSave, staff }) {
  const [form, set, reset] = useForm({ title: "", description: "", priority: "normal", due_date: "", assigned_to: "" });
  const [busy, setBusy] = useState(false);
  const toast = useToast();

  const submit = async () => {
    if (!form.title.trim()) return toast.push({ tone: "error", message: "What needs doing?" });
    setBusy(true);
    try {
      await onSave(form);
      reset();
    } catch {
      // toast shown
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Add a task"
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" busy={busy} onClick={submit}>
            Add task
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        <Field label="What needs doing" required>
          <Input value={form.title} onChange={set("title")} placeholder="Call about the bank statement" autoFocus />
        </Field>
        <FormRow cols={3}>
          <Field label="By when">
            <Input type="date" value={form.due_date} onChange={set("due_date")} />
          </Field>
          <Field label="Priority">
            <Select value={form.priority} onChange={set("priority")}>
              {PRIORITIES.map((priority) => (
                <option key={priority.id} value={priority.id}>
                  {priority.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Who">
            <Select value={form.assigned_to} onChange={set("assigned_to")}>
              <option value="">Anyone</option>
              {staff.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.name} ({humanize(member.role)})
                </option>
              ))}
            </Select>
          </Field>
        </FormRow>
        <Field label="Details" hint="optional">
          <Textarea value={form.description} onChange={set("description")} rows={2} />
        </Field>
      </div>
    </Modal>
  );
}
