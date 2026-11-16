// Messages: a log of every contact, plus questions the student asked in the portal.

import { useMemo, useState } from "react";
import { ArrowDownLeft, ArrowUpRight, Mail, MessageCircle, MessageSquareText, MessagesSquare, Phone, Plus, Users } from "lucide-react";

import { useAdminData } from "../../data/AdminDataProvider";
import { fmtDateTime, humanize, timeAgo } from "../../lib/format";
import { Button, Card, CardHeader, EmptyState, Field, FormRow, Input, Modal, Select, Textarea, useForm, useToast } from "../../ui/kit";
import { StatusChip } from "./shared";

const CHANNELS = [
  ["whatsapp", "WhatsApp", MessageCircle, "#25D366"],
  ["call", "Phone call", Phone, "#0ea5e9"],
  ["email", "Email", Mail, "#8b5cf6"],
  ["meeting", "In person", Users, "#f59e0b"],
  ["portal", "Portal", MessageSquareText, "#071f50"],
  ["manual", "Note", MessageSquareText, "#64748b"],
];

const channelMeta = (channel) => CHANNELS.find(([id]) => id === String(channel || "").toLowerCase()) || CHANNELS[CHANNELS.length - 1];

export default function MessagesTab({ person }) {
  const { insert, update, logEvent, admin, data } = useAdminData();
  const toast = useToast();
  const [logOpen, setLogOpen] = useState(false);
  const [replyFor, setReplyFor] = useState(null);
  const [reply, setReply] = useState("");
  const [busy, setBusy] = useState(false);

  const threads = useMemo(() => {
    const byRequest = new Map();
    for (const message of data.supportMessages) {
      if (!byRequest.has(message.support_request_id)) byRequest.set(message.support_request_id, []);
      byRequest.get(message.support_request_id).push(message);
    }
    return person.supportRequests.map((request) => ({
      request,
      messages: (byRequest.get(request.id) || []).sort((a, b) => new Date(a.created_at) - new Date(b.created_at)),
    }));
  }, [data.supportMessages, person.supportRequests]);

  const logMessage = async (form) => {
    await insert("communications", {
      student_id: person.primary.student_id,
      student_type: person.primary.student_type,
      channel: form.channel,
      direction: form.direction,
      subject: form.subject.trim() || null,
      message: form.message.trim(),
      status: "logged",
      source: "admin_manual",
      sender_id: admin.id,
      sent_at: new Date().toISOString(),
      is_internal: false,
      metadata: { logged_by: admin.name },
    });
    await logEvent(person, {
      actionType: "contact_logged",
      title: `${channelMeta(form.channel)[1]} ${form.direction === "outbound" ? "to" : "from"} ${person.name.split(" ")[0]}`,
      description: form.message.slice(0, 120),
    });
    toast.push("Logged.");
    setLogOpen(false);
  };

  const sendReply = async () => {
    if (!reply.trim() || !replyFor) return;
    setBusy(true);
    try {
      await insert("supportMessages", {
        support_request_id: replyFor.id,
        student_id: String(person.primary.student_id),
        student_type: person.primary.student_type,
        sender_type: "admin",
        sender_id: admin.id,
        sender_name: admin.name,
        message: reply.trim(),
        is_internal: false,
      });
      await update("supportRequests", replyFor.id, {
        status: replyFor.status === "open" ? "in_progress" : replyFor.status,
        counselor_response: reply.trim(),
        responded_at: new Date().toISOString(),
      });
      await logEvent(person, { actionType: "support_reply", title: `Replied: ${replyFor.subject || "question"}` });
      setReply("");
      setReplyFor(null);
      toast.push("Reply sent to the student's portal.");
    } finally {
      setBusy(false);
    }
  };

  const setRequestStatus = async (request, status) => {
    await update("supportRequests", request.id, { status, resolved_at: status === "resolved" ? new Date().toISOString() : null });
    await logEvent(person, { actionType: "support_status", title: `Question marked ${humanize(status)}: ${request.subject || ""}` });
  };

  return (
    <div className="grid gap-4 xl:grid-cols-[1.1fr_1fr]">
      <Card className="pb-4">
        <CardHeader
          icon={MessagesSquare}
          title="Contact log"
          subtitle="Every call, WhatsApp and email, newest first. Write it down so the team knows."
          action={
            <Button variant="primary" size="sm" icon={Plus} onClick={() => setLogOpen(true)} disabled={!person.primary}>
              Log a contact
            </Button>
          }
        />
        <ol className="mt-3 space-y-2 px-5">
          {person.communications.map((item) => {
            const [, label, Icon, color] = channelMeta(item.channel);
            const outbound = String(item.direction || "outbound") === "outbound";
            return (
              <li key={item.id} className="flex gap-3 rounded-2xl border border-[#071f50]/8 p-3.5">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl" style={{ background: `${color}1a`, color }}>
                  <Icon size={16} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[12px] font-extrabold text-[#071f50]/55">
                    <span className="inline-flex items-center gap-1 text-[#071f50]">
                      {outbound ? <ArrowUpRight size={13} /> : <ArrowDownLeft size={13} />}
                      {label} · {outbound ? "we contacted them" : "they contacted us"}
                    </span>
                    <span>{fmtDateTime(item.sent_at || item.created_at)}</span>
                    {item.status && !["logged", "sent"].includes(item.status) ? <StatusChip status={item.status} /> : null}
                  </p>
                  {item.subject ? <p className="mt-1 text-[14px] font-black text-[#071f50]">{item.subject}</p> : null}
                  <p className="mt-0.5 whitespace-pre-wrap text-[13.5px] leading-5 text-[#071f50]/80">{item.message}</p>
                </div>
              </li>
            );
          })}
        </ol>
        {!person.communications.length ? <EmptyState compact icon={MessagesSquare} title="Nothing logged yet" text="After you call or message them, log it here." /> : null}
      </Card>

      <Card className="pb-4">
        <CardHeader icon={MessageSquareText} title="Questions from the portal" subtitle="Students ask here; your reply shows in their portal." />
        <div className="mt-3 space-y-3 px-5">
          {threads.map(({ request, messages }) => {
            const open = !["resolved", "closed"].includes(String(request.status || ""));
            return (
              <div key={request.id} className="rounded-2xl border border-[#071f50]/8 p-4" style={{ borderColor: open ? "rgba(255,75,18,0.35)" : undefined }}>
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-[14.5px] font-black text-[#071f50]">{request.subject || humanize(request.request_type) || "Question"}</p>
                    <p className="text-[12px] font-semibold text-[#071f50]/50">
                      {timeAgo(request.created_at)}
                      {request.priority && request.priority !== "normal" ? ` · ${humanize(request.priority)} priority` : ""}
                    </p>
                  </div>
                  <StatusChip status={request.status} />
                </div>
                <p className="mt-2 whitespace-pre-wrap rounded-xl bg-[#fff7ed] px-3 py-2 text-[13.5px] leading-5 text-[#071f50]">{request.message}</p>
                {messages.length ? (
                  <ul className="mt-2 space-y-1.5">
                    {messages.map((message) => (
                      <li
                        key={message.id}
                        className={`max-w-[92%] rounded-xl px-3 py-2 text-[13px] leading-5 ${message.sender_type === "student" ? "bg-[#071f50]/[0.05] text-[#071f50]" : "ml-auto bg-[#071f50] text-white"}`}
                      >
                        <span className="block text-[10.5px] font-black uppercase tracking-[0.1em] opacity-60">
                          {message.sender_name || humanize(message.sender_type)} · {timeAgo(message.created_at)}
                        </span>
                        {message.message}
                      </li>
                    ))}
                  </ul>
                ) : null}
                <div className="mt-3 flex flex-wrap gap-1.5">
                  <Button size="sm" variant="navy" onClick={() => setReplyFor(request)}>
                    Reply
                  </Button>
                  {open ? (
                    <Button size="sm" variant="success" onClick={() => setRequestStatus(request, "resolved")}>
                      Mark solved
                    </Button>
                  ) : (
                    <Button size="sm" onClick={() => setRequestStatus(request, "open")}>
                      Reopen
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
          {!threads.length ? <EmptyState compact icon={MessageSquareText} title="No questions yet" /> : null}
        </div>
      </Card>

      <LogContactModal open={logOpen} onClose={() => setLogOpen(false)} onSave={logMessage} />

      <Modal
        open={Boolean(replyFor)}
        onClose={() => setReplyFor(null)}
        title="Reply to the student"
        subtitle={replyFor?.subject}
        footer={
          <>
            <Button onClick={() => setReplyFor(null)}>Cancel</Button>
            <Button variant="primary" busy={busy} disabled={!reply.trim()} onClick={sendReply}>
              Send reply
            </Button>
          </>
        }
      >
        <Textarea value={reply} onChange={(event) => setReply(event.target.value)} rows={5} placeholder="Write in plain, friendly words…" autoFocus />
      </Modal>
    </div>
  );
}

function LogContactModal({ open, onClose, onSave }) {
  const [form, set, reset] = useForm({ channel: "whatsapp", direction: "outbound", subject: "", message: "" });
  const [busy, setBusy] = useState(false);
  const toast = useToast();

  const submit = async () => {
    if (!form.message.trim()) return toast.push({ tone: "error", message: "Write what was said." });
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
      title="Log a contact"
      subtitle="A quick record so anyone on the team can pick up where you left off."
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" busy={busy} onClick={submit}>
            Save
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        <div className="flex flex-wrap gap-1.5">
          {CHANNELS.filter(([id]) => !["portal", "manual"].includes(id)).map(([id, label, Icon, color]) => (
            <button
              key={id}
              type="button"
              onClick={() => set("channel")(id)}
              className={`inline-flex items-center gap-1.5 rounded-xl border-2 px-3 py-2 text-[13px] font-extrabold transition ${form.channel === id ? "border-[#071f50] bg-[#071f50] text-white" : "border-[#071f50]/10 text-[#071f50]"}`}
            >
              <Icon size={15} style={{ color: form.channel === id ? "white" : color }} />
              {label}
            </button>
          ))}
        </div>
        <FormRow>
          <Field label="Who started it">
            <Select value={form.direction} onChange={set("direction")}>
              <option value="outbound">We contacted them</option>
              <option value="inbound">They contacted us</option>
            </Select>
          </Field>
          <Field label="Topic" hint="optional">
            <Input value={form.subject} onChange={set("subject")} placeholder="Budget, documents, visa date…" />
          </Field>
        </FormRow>
        <Field label="What was said" required>
          <Textarea value={form.message} onChange={set("message")} rows={4} placeholder="Short summary and what happens next." />
        </Field>
      </div>
    </Modal>
  );
}
