// Overview: what they told us, portal login, next steps, notes, history.

import { useState } from "react";
import {
  CalendarDays,
  History,
  KeyRound,
  MessageSquareText,
  Send,
  ShieldOff,
  StickyNote,
} from "lucide-react";

import { useAdminData } from "../../data/AdminDataProvider";
import { fmtDate, fmtDateTime, humanize, timeAgo } from "../../lib/format";
import { isDone } from "../../lib/people";
import {
  Button,
  Card,
  CardHeader,
  Chip,
  EmptyState,
  Field,
  Input,
  KeyValue,
  Modal,
  Notice,
  Textarea,
  useConfirm,
  useToast,
} from "../../ui/kit";
import { supabase } from "../../../../lib/supabaseClient";
import { StatusChip } from "./shared";
import Snapshot from "./Snapshot";

export default function OverviewTab({ person, onChangeTab }) {
  const { addNote, logEvent, update, isCounselor } = useAdminData();
  const toast = useToast();
  const [note, setNote] = useState("");
  const [savingNote, setSavingNote] = useState(false);
  const [allHistory, setAllHistory] = useState(false);

  const openTasks = [
    ...person.tasks
      .filter((task) => !isDone(task.status))
      .map((task) => ({ ...task, kind: "task" })),
    ...person.reminders
      .filter((item) => !isDone(item.status))
      .map((item) => ({ ...item, kind: "reminder" })),
  ]
    .sort(
      (a, b) =>
        (a.due_date ? new Date(a.due_date) : Infinity) -
        (b.due_date ? new Date(b.due_date) : Infinity),
    )
    .slice(0, 6);

  const finish = async (item) => {
    if (item.kind === "task")
      await update("tasks", item.id, {
        status: "completed",
        completed_at: new Date().toISOString(),
      });
    else
      await update("reminders", item.id, {
        status: "completed",
        completed_at: new Date().toISOString(),
      });
    await logEvent(person, {
      actionType: "task_completed",
      title: `Done: ${item.title}`,
    });
  };

  const saveNote = async () => {
    if (!note.trim()) return;
    setSavingNote(true);
    try {
      await addNote(person, note);
      await logEvent(person, {
        actionType: "note_added",
        title: "Note added",
        description: note.slice(0, 140),
      });
      setNote("");
      toast.push("Note saved.");
    } finally {
      setSavingNote(false);
    }
  };

  return (
    <div className="space-y-4">
      <Snapshot person={person} onChangeTab={onChangeTab} />
      <div className="grid gap-4 xl:grid-cols-[1.2fr_1fr]">
        <div className="space-y-4">
          <Card className="pb-4">
            <CardHeader
              icon={MessageSquareText}
              title="What they told us"
              subtitle="Every form they sent and call they booked."
            />
            <div className="mt-3 space-y-3 px-5">
              {person.sources.map((source) => (
                <div
                  key={source.key}
                  className="rounded-2xl border border-[#071f50]/8 p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="flex items-center gap-2 text-[12px] font-black uppercase tracking-[0.14em] text-[#071f50]/50">
                      {source.type === "appointment" ? (
                        <CalendarDays size={13} />
                      ) : (
                        <MessageSquareText size={13} />
                      )}
                      {source.type === "appointment"
                        ? "Booked a call"
                        : "Sent a message"}{" "}
                      · {fmtDateTime(source.createdAt)}
                    </p>
                    <Chip color="#64748b" dot={false}>
                      {source.label}
                    </Chip>
                  </div>
                  {source.row.message &&
                  !/^Added by/.test(source.row.message) ? (
                    <p className="mt-2 text-[14px] leading-6 text-[#071f50]">
                      “{source.row.message}”
                    </p>
                  ) : null}
                  <KeyValue
                    className="mt-3"
                    items={
                      source.type === "appointment"
                        ? [
                            {
                              label: "When",
                              value: `${fmtDate(source.row.appointment_date)} · ${source.row.appointment_time || ""}`,
                            },
                            {
                              label: "Type",
                              value: source.row.consultation_type,
                            },
                            {
                              label: "Country",
                              value: source.row.country_interest,
                            },
                            {
                              label: "Booking status",
                              value: <AppointmentStatus row={source.row} />,
                            },
                          ]
                        : [
                            { label: "Country", value: source.row.country },
                            { label: "Level", value: source.row.study_level },
                            {
                              label: "Subject",
                              value: source.row.field_of_interest,
                            },
                            {
                              label: "Prefers",
                              value: source.row.counseling_mode,
                            },
                            { label: "City", value: source.row.city },
                          ]
                    }
                  />
                </div>
              ))}
            </div>
          </Card>

          {isCounselor ? null : <PortalAccessCard person={person} />}
        </div>

        <div className="space-y-4">
          <Card className="pb-3">
            <CardHeader
              icon={Send}
              title="Next steps"
              subtitle={openTasks.length ? "Tick when done." : "Nothing open."}
              action={
                <Button size="sm" onClick={() => onChangeTab("tasks")}>
                  All tasks
                </Button>
              }
            />
            <ul className="mt-2 px-3">
              {openTasks.map((item) => (
                <li
                  key={`${item.kind}-${item.id}`}
                  className="flex items-start gap-3 rounded-2xl px-2 py-2 hover:bg-[#071f50]/[0.025]"
                >
                  <input
                    type="checkbox"
                    onChange={() => finish(item)}
                    className="mt-1 h-4.5 w-4.5 accent-[#ff4b12]"
                    aria-label={`Mark ${item.title} done`}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-[14px] font-bold text-[#071f50]">
                      {item.title}
                    </p>
                    <p className="text-[12px] font-semibold text-[#071f50]/50">
                      {item.kind === "reminder"
                        ? "Reminder"
                        : humanize(item.priority || "normal") + " priority"}
                      {item.due_date ? ` · due ${fmtDate(item.due_date)}` : ""}
                    </p>
                  </div>
                </li>
              ))}
              {!openTasks.length ? (
                <EmptyState compact icon={Send} title="No open tasks" />
              ) : null}
            </ul>
          </Card>

          <Card className="pb-4">
            <CardHeader
              icon={StickyNote}
              title="Notes"
              subtitle="Private to the team."
            />
            <div className="mt-3 space-y-2 px-5">
              <Textarea
                value={note}
                onChange={(event) => setNote(event.target.value)}
                rows={2}
                placeholder="Write a note…"
              />
              <Button
                size="sm"
                variant="navy"
                busy={savingNote}
                disabled={!note.trim()}
                onClick={saveNote}
              >
                Save note
              </Button>
              {person.notes.slice(0, 6).map((item) => (
                <div
                  key={item.id}
                  className="rounded-xl bg-[#fff7ed] px-3 py-2 text-[13.5px] leading-5 text-[#071f50]"
                >
                  {item.note}
                  <span className="mt-0.5 block text-[11px] font-bold text-[#071f50]/40">
                    {timeAgo(item.created_at)}
                  </span>
                </div>
              ))}
            </div>
          </Card>

          <Card className="pb-3">
            <CardHeader
              icon={History}
              title="History"
              subtitle="Everything that happened on this file."
            />
            <ol className="mt-3 px-5">
              {person.timeline.slice(0, allHistory ? 200 : 6).map((event) => (
                <li
                  key={event.id}
                  className="border-l-2 border-[#071f50]/8 py-1.5 pl-4"
                >
                  <p className="text-[13px] font-bold text-[#071f50]">
                    {event.title}
                  </p>
                  <p className="text-[11.5px] font-semibold text-[#071f50]/45">
                    {timeAgo(event.created_at)} ·{" "}
                    {event.created_by_name || "system"}
                    {event.description ? ` · ${event.description}` : ""}
                  </p>
                </li>
              ))}
              {!person.timeline.length ? (
                <EmptyState compact icon={History} title="Nothing yet" />
              ) : null}
            </ol>
            {person.timeline.length > 6 ? (
              <button
                type="button"
                onClick={() => setAllHistory(!allHistory)}
                className="mx-5 mt-2 text-[12.5px] font-extrabold text-[#ff4b12] hover:underline"
              >
                {allHistory ? "Show less" : `Show all ${person.timeline.length} events`}
              </button>
            ) : null}
          </Card>
        </div>
      </div>
    </div>
  );
}

function AppointmentStatus({ row }) {
  const { update, logEvent, peopleById, invoke } = useAdminData();
  const confirm = useConfirm();
  const toast = useToast();
  const statuses = ["pending", "confirmed", "completed", "cancelled"];
  const LABEL = { confirmed: "confirmed", completed: "done (thank-you email)", cancelled: "cancelled", pending: "waiting" };

  const change = async (status) => {
    await update("appointments", row.id, { status });
    const person = Array.from(peopleById.values()).find((p) => p.sources.some((s) => s.type === "appointment" && s.id === row.id));
    if (person) await logEvent(person, { actionType: "appointment_status", title: `Call marked ${status}` });
    if (!row.email || status === "pending") return;
    const yes = await confirm({
      title: `Email ${String(row.full_name || "the student").split(" ")[0]} that the call is ${LABEL[status]}?`,
      text: `We send a short Zaifan email to ${row.email}.`,
      confirmLabel: "Send email",
      cancelLabel: "No, don't email",
    });
    if (!yes) return;
    try {
      await invoke("send-appointment-status-email", { appointmentId: row.id });
      toast.push(`Email sent to ${row.email}.`);
      if (person) await logEvent(person, { actionType: "email_sent", title: `Emailed: call ${status}` });
    } catch {
      // toast shown by the provider
    }
  };

  return (
    <select
      value={row.status || "pending"}
      onChange={(event) => change(event.target.value)}
      className="rounded-lg border border-[#071f50]/15 bg-white px-2 py-1 text-[13px] font-bold text-[#071f50]"
    >
      {statuses.map((status) => (
        <option key={status} value={status}>
          {humanize(status)}
        </option>
      ))}
    </select>
  );
}

function PortalAccessCard({ person }) {
  const { invoke, ensureIdentity, reload, logEvent } = useAdminData();
  const toast = useToast();
  const confirm = useConfirm();
  // The login is a real Supabase Auth account linked to the person record.
  const identity = person.identity;
  const account = identity?.auth_user_id
    ? {
        email: identity.portal_email || person.email,
        is_active: identity.portal_active !== false,
        created_at: identity.portal_created_at,
      }
    : null;
  const [modal, setModal] = useState(null); // 'create' | 'reset'
  const [email, setEmail] = useState(
    identity?.portal_email || person.email || "",
  );
  const [busy, setBusy] = useState(false);

  // Asks the server to create / reset / switch the login. Returns the reply or null (toast shown).
  const callLogin = async (action, extra = {}) => {
    const personId = await ensureIdentity(person);
    const { data, error } = await supabase.functions.invoke("student-login", {
      body: { action, personId, ...extra },
    });
    let reply = data;
    if (error) {
      try {
        reply = await error.context.json();
      } catch {
        reply = { success: false, message: error.message };
      }
    }
    if (!reply?.success) {
      toast.push({
        tone: "error",
        message:
          reply?.message || "The login service did not answer. Try again.",
      });
      return null;
    }
    return reply;
  };

  const sendCredentials = async (action) => {
    const recipient = email.trim().toLowerCase();
    if (!recipient)
      return toast.push({
        tone: "error",
        message: "An email address is needed to send the login.",
      });
    setBusy(true);
    try {
      const reply = await callLogin(action, { email: recipient });
      if (!reply) return;
      const temporaryPassword = reply.temporaryPassword;
      await reload(["identities", "inquiries", "appointments"]);
      let emailed = true;
      try {
        await invoke("send-portal-credentials", {
          studentName: person.name,
          recipientEmail: reply.email || recipient,
          temporaryPassword,
          mustChangePassword: true,
          studentId: String(person.primary.student_id),
          studentType: person.primary.student_type,
          accountId: null,
          action,
        });
      } catch {
        emailed = false;
      }
      await logEvent(person, {
        actionType: "portal_access",
        title:
          action === "create"
            ? "Portal login created"
            : "Portal password reset",
        description: emailed
          ? `Login emailed to ${recipient}`
          : "Email failed; password shown to admin",
      });
      await reload(["communications"]);
      setModal(null);
      if (emailed) toast.push(`Login details emailed to ${recipient}.`);
      else
        await confirm({
          title: "The email could not be sent",
          text: "Share this temporary password with the student yourself. They must change it after logging in.",
          body: (
            <p className="rounded-xl bg-[#fff7ed] px-4 py-3 text-center font-mono text-xl font-black tracking-wider text-[#071f50]">
              {temporaryPassword}
            </p>
          ),
          confirmLabel: "I've noted it",
          cancelLabel: "Close",
        });
    } catch {
      // toast shown
    } finally {
      setBusy(false);
    }
  };

  const toggleActive = async () => {
    const yes = await confirm({
      title: account.is_active
        ? "Turn off portal access?"
        : "Turn portal access back on?",
      text: account.is_active
        ? "They won't be able to log in until you turn it back on."
        : "They can log in again with their existing password.",
      confirmLabel: account.is_active ? "Turn off" : "Turn on",
      danger: account.is_active,
    });
    if (!yes) return;
    const reply = await callLogin(account.is_active ? "disable" : "enable");
    if (!reply) return;
    await reload(["identities"]);
    await logEvent(person, {
      actionType: "portal_access",
      title: account.is_active
        ? "Portal access turned off"
        : "Portal access turned on",
    });
  };

  return (
    <Card className="pb-4">
      <CardHeader
        icon={KeyRound}
        title="Student portal login"
        subtitle="Students log in on the website (Student portal) to see their file, upload documents and send payment receipts."
        action={
          account ? (
            <>
              <Button size="sm" onClick={() => setModal("reset")}>
                Send new password
              </Button>
              <Button
                size="sm"
                variant={account.is_active ? "danger" : "success"}
                icon={ShieldOff}
                onClick={toggleActive}
              >
                {account.is_active ? "Turn off" : "Turn on"}
              </Button>
            </>
          ) : (
            <Button
              size="sm"
              variant="primary"
              onClick={() => setModal("create")}
              disabled={!person.primary}
            >
              Create login
            </Button>
          )
        }
      />
      <div className="mt-3 px-5">
        {account ? (
          <KeyValue
            items={[
              { label: "Login email", value: account.email },
              {
                label: "Access",
                value: (
                  <StatusChip
                    status={account.is_active ? "confirmed" : "cancelled"}
                    label={account.is_active ? "On" : "Off"}
                  />
                ),
              },
              {
                label: "Login created",
                value: account.created_at ? timeAgo(account.created_at) : "—",
              },
            ]}
          />
        ) : (
          <Notice tone="info">
            No portal login yet. Create one and the student gets an email with a
            temporary password.
          </Notice>
        )}
      </div>

      <Modal
        open={Boolean(modal)}
        onClose={() => setModal(null)}
        title={
          modal === "create" ? "Create portal login" : "Send a new password"
        }
        subtitle="We create a temporary password and email it. The student must change it on first login."
        footer={
          <>
            <Button onClick={() => setModal(null)}>Cancel</Button>
            <Button
              variant="primary"
              busy={busy}
              onClick={() => sendCredentials(modal)}
            >
              {modal === "create" ? "Create and email" : "Reset and email"}
            </Button>
          </>
        }
      >
        <Field label="Send to">
          <Input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </Field>
      </Modal>
    </Card>
  );
}
