import React, { useMemo, useState } from "react";
import {
  buildCounselorCommunicationHub,
  formatRelativeTime,
  logCounselorCommunication,
} from "../../lib/counselorPortal";

const CHANNELS = ["Note", "Call", "WhatsApp", "Email", "Meeting"];

const FILTERS = [
  { key: "all", label: "All" },
  { key: "call", label: "Calls" },
  { key: "whatsapp", label: "WhatsApp" },
  { key: "email", label: "Email" },
  { key: "meeting", label: "Meetings" },
  { key: "support", label: "Support" },
];

const MESSAGE_TEMPLATES = [
  {
    key: "follow_up",
    label: "Follow-up",
    text: "Followed up with student regarding the next required step. Student has been guided and timeline needs monitoring.",
  },
  {
    key: "document",
    label: "Document",
    text: "Discussed document requirement with student. Student was advised to upload a clear and updated copy for review.",
  },
  {
    key: "application",
    label: "Application",
    text: "Discussed application progress with student. Next action is to confirm university/course status and move application forward.",
  },
  {
    key: "visa",
    label: "Visa",
    text: "Discussed visa/CAS readiness with student. Student was advised to prepare required visa documents and confirm deadline.",
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

function getStudentEmail(student = {}) {
  return student.email || student.student_email || student.lead_email || "";
}

function channelTone(channel = "") {
  const value = lower(channel);

  if (value.includes("call")) return "border-emerald-400/25 bg-emerald-400/10 text-emerald-100";
  if (value.includes("whatsapp")) return "border-lime-400/25 bg-lime-400/10 text-lime-100";
  if (value.includes("email")) return "border-cyan-400/25 bg-cyan-400/10 text-cyan-100";
  if (value.includes("meeting")) return "border-violet-400/25 bg-violet-400/10 text-violet-100";
  if (value.includes("support")) return "border-rose-400/25 bg-rose-400/10 text-rose-100";
  if (value.includes("note")) return "border-amber-400/25 bg-amber-400/10 text-amber-100";

  return "border-slate-400/20 bg-white/[0.04] text-slate-200";
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

function CommunicationStat({ label, value, helper, tone = "slate" }) {
  const tones = {
    slate: "border-white/10 bg-white/[0.04]",
    cyan: "border-cyan-400/20 bg-cyan-500/10",
    emerald: "border-emerald-400/20 bg-emerald-500/10",
    lime: "border-lime-400/20 bg-lime-500/10",
    violet: "border-violet-400/20 bg-violet-500/10",
    amber: "border-amber-400/20 bg-amber-500/10",
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

function ManualLogBox({ snapshot, counselor, onRefresh, setStatus }) {
  const students = safeArray(snapshot?.students);

  const [studentKey, setStudentKey] = useState("");
  const [studentSearch, setStudentSearch] = useState("");
  const [channel, setChannel] = useState("Note");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  const filteredStudents = useMemo(() => {
    const search = studentSearch.trim().toLowerCase();

    if (!search) return students.slice(0, 80);

    return students
      .filter((student) =>
        [
          getStudentName(student),
          getStudentEmail(student),
          student.phone,
          student.mobile,
          student.whatsapp,
          student.student_id,
          student.id,
        ]
          .map((value) => lower(value))
          .join(" ")
          .includes(search)
      )
      .slice(0, 80);
  }, [students, studentSearch]);

  const selectedStudent = students.find((student) => getStudentKey(student) === studentKey);

  async function saveLog() {
    if (!selectedStudent) {
      setStatus({ type: "error", message: "Select a student first." });
      return;
    }

    if (!message.trim()) {
      setStatus({ type: "error", message: "Write communication note first." });
      return;
    }

    setSaving(true);
    setStatus(null);

    try {
      await logCounselorCommunication({
        studentId: selectedStudent.id || selectedStudent.student_id || selectedStudent.inquiry_id || selectedStudent.email,
        studentName: getStudentName(selectedStudent),
        channel,
        subject: subject.trim() || `Counselor ${channel}`,
        message: message.trim(),
        counselor,
        metadata: {
          source: "CommunicationHubManualLog",
          studentEmail: getStudentEmail(selectedStudent),
          selectedChannel: channel,
        },
      });

      setMessage("");
      setSubject("");
      setStatus({ type: "success", message: "Communication note logged." });
      onRefresh?.();
    } catch (error) {
      console.error("Manual communication log failed", error);
      setStatus({
        type: "error",
        message: "Communication could not be logged. Check student_communications columns/RLS.",
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
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Quick Communication Log</p>
          <p className="mt-1 text-sm text-slate-400">
            Log calls, WhatsApp messages, emails, meetings, and internal notes against the assigned student record.
          </p>
        </div>
        <span className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-bold text-slate-300">
          {students.length} students
        </span>
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-[1fr_1fr_0.45fr]">
        <input
          value={studentSearch}
          onChange={(event) => setStudentSearch(event.target.value)}
          placeholder="Search student before selecting..."
          className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-cyan-400/40"
        />

        <select
          value={studentKey}
          onChange={(event) => setStudentKey(event.target.value)}
          className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-cyan-400/40"
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
          value={channel}
          onChange={(event) => setChannel(event.target.value)}
          className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-cyan-400/40"
        >
          {CHANNELS.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      </div>

      <input
        value={subject}
        onChange={(event) => setSubject(event.target.value)}
        placeholder={`Subject, for example: Counselor ${channel}`}
        className="mt-3 w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-cyan-400/40"
      />

      <div className="mt-3 flex flex-wrap gap-2">
        {MESSAGE_TEMPLATES.map((template) => (
          <button
            key={template.key}
            type="button"
            onClick={() => setMessage(template.text)}
            className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-bold text-slate-300 hover:bg-white/[0.08]"
          >
            {template.label}
          </button>
        ))}
      </div>

      <textarea
        value={message}
        onChange={(event) => setMessage(event.target.value)}
        rows={3}
        placeholder="Write counselor communication note..."
        className="mt-3 w-full resize-none rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-cyan-400/40"
      />

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-slate-500">{message.trim().length} characters</p>

        <button
          type="button"
          onClick={saveLog}
          disabled={saving}
          className="rounded-xl border border-emerald-400/30 bg-emerald-400/10 px-4 py-2 text-xs font-bold text-emerald-100 hover:bg-emerald-400/20 disabled:opacity-50"
        >
          {saving ? "Logging..." : "Log Communication"}
        </button>
      </div>
    </div>
  );
}

function CommunicationCard({ item, compact }) {
  return (
    <article className="rounded-3xl border border-white/10 bg-slate-950/50 p-4 transition hover:border-cyan-400/25 hover:bg-slate-900/70">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-base font-black">{item.title}</h3>
            <span className={`rounded-full border px-3 py-1 text-xs font-bold ${channelTone(item.channel)}`}>
              {item.channel}
            </span>
          </div>

          <p className="mt-1 text-sm text-slate-400">
            {item.studentName} · {item.source || "communication"}
          </p>

          {!compact && item.body ? (
            <p className="mt-3 line-clamp-4 text-sm leading-6 text-slate-300">{item.body}</p>
          ) : null}
        </div>

        <div className="text-left lg:text-right">
          <span className="rounded-full border border-cyan-400/25 bg-cyan-400/10 px-3 py-1 text-xs font-bold text-cyan-100">
            {item.status}
          </span>
          <p className="mt-2 text-xs text-slate-500">{formatRelativeTime(item.createdAt)}</p>
        </div>
      </div>
    </article>
  );
}

export default function CounselorCommunicationHub({ snapshot, counselor, onRefresh, compact = false }) {
  const queue = useMemo(() => buildCounselorCommunicationHub(snapshot || {}), [snapshot]);

  const [status, setStatus] = useState(null);
  const [filter, setFilter] = useState("all");
  const [query, setQuery] = useState("");

  const stats = useMemo(() => {
    const calls = queue.filter((item) => lower(item.channel).includes("call")).length;
    const whatsapp = queue.filter((item) => lower(item.channel).includes("whatsapp")).length;
    const emails = queue.filter((item) => lower(item.channel).includes("email")).length;
    const meetings = queue.filter((item) => lower(item.channel).includes("meeting")).length;
    const support = queue.filter((item) => lower(item.source).includes("support") || lower(item.channel).includes("support")).length;

    return {
      total: queue.length,
      calls,
      whatsapp,
      emails,
      meetings,
      support,
    };
  }, [queue]);

  const filtered = useMemo(() => {
    const search = query.trim().toLowerCase();

    let next = queue;

    if (filter !== "all") {
      next = next.filter((item) => {
        const text = lower(`${item.channel} ${item.source} ${item.title} ${item.body} ${item.status}`);
        return text.includes(filter);
      });
    }

    if (search) {
      next = next.filter((item) =>
        [item.title, item.studentName, item.channel, item.status, item.body, item.source]
          .map((value) => lower(value))
          .join(" ")
          .includes(search)
      );
    }

    return next;
  }, [queue, filter, query]);

  const visible = compact ? filtered.slice(0, 4) : filtered;

  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
      <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-cyan-300">Communication Hub</p>
          <h2 className="mt-2 text-2xl font-black">Student Conversation Feed</h2>
          <p className="mt-1 text-sm text-slate-400">
            Counselor notes, calls, messages, support replies, appointment outcomes, and communication history.
          </p>
        </div>

        <span className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-bold text-slate-200">
          {filtered.length}/{queue.length}
        </span>
      </div>

      {!compact ? (
        <div className="mb-5 grid gap-3 md:grid-cols-3 xl:grid-cols-6">
          <CommunicationStat label="Total" value={stats.total} helper="feed items" tone="cyan" />
          <CommunicationStat label="Calls" value={stats.calls} helper="call logs" tone="emerald" />
          <CommunicationStat label="WhatsApp" value={stats.whatsapp} helper="message logs" tone="lime" />
          <CommunicationStat label="Email" value={stats.emails} helper="email notes" />
          <CommunicationStat label="Meetings" value={stats.meetings} helper="meeting logs" tone="violet" />
          <CommunicationStat label="Support" value={stats.support} helper="support-linked" tone="rose" />
        </div>
      ) : null}

      {!compact ? (
        <>
          <StatusToast status={status} onClear={() => setStatus(null)} />

          <ManualLogBox snapshot={snapshot} counselor={counselor} onRefresh={onRefresh} setStatus={setStatus} />

          <div className="mb-5 grid gap-3 lg:grid-cols-[1fr_220px]">
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search communication feed, student, channel, status, notes..."
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
          </div>
        </>
      ) : (
        <div className="mb-4 flex flex-wrap gap-2">
          {FILTERS.slice(0, 4).map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => setFilter(item.key)}
              className={`rounded-xl px-3 py-2 text-xs font-bold ${
                filter === item.key ? "bg-white text-slate-950" : "border border-white/10 bg-white/5 text-slate-300"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}

      <div className="space-y-3">
        {visible.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/15 p-6 text-center">
            <p className="text-sm font-bold text-white">No communication history found.</p>
            <p className="mx-auto mt-2 max-w-2xl text-sm text-slate-400">
              Communication logs, support replies, appointment outcomes, and manual counselor notes will appear here after refresh.
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
          visible.map((item) => <CommunicationCard key={item.id} item={item} compact={compact} />)
        )}
      </div>

      {compact && filtered.length > visible.length ? (
        <p className="mt-4 text-center text-xs text-slate-500">
          Showing {visible.length} of {filtered.length} communication items. Open Communication Hub for full history.
        </p>
      ) : null}
    </div>
  );
}