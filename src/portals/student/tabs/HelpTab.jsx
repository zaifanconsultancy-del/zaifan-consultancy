// Help: ask Zaifan a question and read the answers, like a simple chat thread.

import { useState } from "react";
import { MessageCircle, MessagesSquare, Send } from "lucide-react";

import { studentSupabase } from "../../../lib/studentSupabase";
import { classNames, timeAgo, waLink } from "../../admin/lib/format";
import { Button, Card, CardHeader, Chip, EmptyState, Field, Input, Notice, PageHeader, Select, Textarea, useToast } from "../../admin/ui/kit";
import { OFFICE_WHATSAPP } from "../lib";

const TOPICS = [
  ["general", "General question"],
  ["documents", "Documents"],
  ["application", "University application"],
  ["visa", "Visa"],
  ["payment", "Payment"],
];

export default function HelpTab({ file, reload }) {
  const toast = useToast();
  const [topic, setTopic] = useState("general");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState("");

  const ask = async (event) => {
    event.preventDefault();
    if (!message.trim()) return setProblem("Please type your question.");
    setBusy(true);
    setProblem("");
    const { error } = await studentSupabase.rpc("student_ask", {
      p_subject: subject.trim() || TOPICS.find(([id]) => id === topic)?.[1] || "Question",
      p_message: message.trim(),
      p_type: topic,
    });
    setBusy(false);
    if (error) return setProblem(error.message);
    setSubject("");
    setMessage("");
    await reload();
    toast.push("Question sent. We usually answer within one working day.");
  };

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Help"
        title="Ask Zaifan"
        subtitle="Write your question here and your counselor will answer on this page. For something urgent, use WhatsApp."
        actions={
          <a
            href={waLink(OFFICE_WHATSAPP, `Assalam o Alaikum, this is ${file.person.name}. I have a question about my file.`)}
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-11 items-center gap-2 rounded-2xl bg-emerald-600 px-4 text-sm font-bold text-white transition hover:bg-emerald-700"
          >
            <MessageCircle size={17} />
            WhatsApp the office
          </a>
        }
      />

      <Card className="p-5">
        <form onSubmit={ask} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-[200px_1fr]">
            <Field label="About">
              <Select value={topic} onChange={(event) => setTopic(event.target.value)}>
                {TOPICS.map(([id, label]) => (
                  <option key={id} value={id}>
                    {label}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Short title" hint="optional">
              <Input value={subject} onChange={(event) => setSubject(event.target.value)} maxLength={120} placeholder="e.g. Which bank statement do I need?" />
            </Field>
          </div>
          <Field label="Your question" required>
            <Textarea value={message} onChange={(event) => setMessage(event.target.value)} rows={4} maxLength={3000} placeholder="Write as much detail as you can." />
          </Field>
          {problem ? <Notice tone="error">{problem}</Notice> : null}
          <Button type="submit" variant="primary" icon={Send} busy={busy} disabled={!message.trim()}>
            Send question
          </Button>
        </form>
      </Card>

      <Card className="pb-4">
        <CardHeader icon={MessagesSquare} title="Your questions" />
        {file.questions.length ? (
          <div className="mt-3 space-y-3 px-4">
            {file.questions.map((question) => (
              <Thread key={question.id} question={question} reload={reload} />
            ))}
          </div>
        ) : (
          <EmptyState compact icon={MessagesSquare} title="No questions yet" text="Anything you ask will stay here with the answer, so you can read it again later." />
        )}
      </Card>
    </div>
  );
}

function Thread({ question, reload }) {
  const toast = useToast();
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const closed = ["resolved", "closed"].includes(String(question.status || "").toLowerCase());
  const last = question.replies[question.replies.length - 1];
  const answered = last && last.from !== "student";

  const reply = async () => {
    if (!text.trim()) return;
    setBusy(true);
    const { error } = await studentSupabase.rpc("student_reply", { p_request_id: question.id, p_message: text.trim() });
    setBusy(false);
    if (error) return toast.push({ tone: "error", message: error.message });
    setText("");
    await reload();
  };

  return (
    <article className="rounded-2xl border border-[#071f50]/8 p-4" style={{ borderColor: answered && !closed ? "rgba(255,75,18,0.4)" : undefined }}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="text-[14.5px] font-black">{question.subject || "Question"}</h3>
          <p className="text-[12px] font-semibold text-[#071f50]/45">asked {timeAgo(question.created_at)}</p>
        </div>
        <Chip color={closed ? "#10b981" : answered ? "#ff4b12" : "#f59e0b"}>{closed ? "Answered" : answered ? "New reply" : "Waiting for Zaifan"}</Chip>
      </div>

      <div className="mt-3 space-y-2">
        <Bubble mine text={question.message} />
        {question.replies.map((item) => (
          <Bubble key={item.id} mine={item.from === "student"} name={item.from === "student" ? "" : item.name || "Zaifan"} text={item.message} when={item.created_at} />
        ))}
      </div>

      <div className="mt-3 flex items-end gap-2">
        <Textarea value={text} onChange={(event) => setText(event.target.value)} rows={1} maxLength={3000} placeholder={closed ? "Still not clear? Reply to open it again." : "Write a reply…"} className="flex-1" />
        <Button variant="navy" icon={Send} busy={busy} disabled={!text.trim()} onClick={reply}>
          Reply
        </Button>
      </div>
    </article>
  );
}

function Bubble({ mine, name, text, when }) {
  return (
    <div className={classNames("max-w-[88%] rounded-2xl px-3.5 py-2.5 text-[13.5px] leading-5", mine ? "ml-auto bg-[#071f50] text-white" : "bg-[#fff7ed] text-[#071f50]")}>
      {!mine && name ? <p className="mb-0.5 text-[11px] font-black uppercase tracking-[0.08em] text-[#ff4b12]">{name}</p> : null}
      <p className="whitespace-pre-wrap">{text}</p>
      {when ? <p className={classNames("mt-1 text-[10.5px] font-semibold", mine ? "text-white/50" : "text-[#071f50]/40")}>{timeAgo(when)}</p> : null}
    </div>
  );
}
