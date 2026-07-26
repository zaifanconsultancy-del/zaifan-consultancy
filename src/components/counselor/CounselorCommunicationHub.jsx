import React, { useEffect, useMemo, useState } from "react";
import {
  buildCounselorCommunicationHub,
  formatRelativeTime,
  logCounselorCommunication,
} from "../../lib/counselorPortal";

const CHANNELS = ["Note", "Call", "WhatsApp", "Email", "Meeting"];

const FILTERS = [
  { key: "all", label: "All" },
  { key: "today", label: "Today" },
  { key: "call", label: "Calls" },
  { key: "whatsapp", label: "WhatsApp" },
  { key: "email", label: "Email" },
  { key: "meeting", label: "Meetings" },
  { key: "support", label: "Support" },
];

const SORTS = [
  { key: "latest", label: "Latest First" },
  { key: "oldest", label: "Oldest First" },
  { key: "student", label: "Student" },
  { key: "channel", label: "Channel" },
  { key: "source", label: "Source" },
];

const FILTER_STORAGE_KEY = "zaifan_counselor_communication_filter";
const SORT_STORAGE_KEY = "zaifan_counselor_communication_sort";

const VALID_FILTERS = new Set(FILTERS.map((item) => item.key));
const VALID_SORTS = new Set(SORTS.map((item) => item.key));

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

const INPUT_CLASS =
  "w-full rounded-2xl border-2 border-[#d8b892] bg-[#fffdf8] px-4 py-3 text-sm font-semibold text-[#102b4c] outline-none transition placeholder:text-slate-400 focus:border-orange-500 focus:ring-4 focus:ring-orange-100";

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

function safeDateMs(value) {
  if (!value) return 0;
  const parsed = new Date(value).getTime();
  return Number.isFinite(parsed) ? parsed : 0;
}

function isSameLocalDay(value, comparison = new Date()) {
  const time = safeDateMs(value);
  if (!time) return false;

  const date = new Date(time);
  return (
    date.getFullYear() === comparison.getFullYear() &&
    date.getMonth() === comparison.getMonth() &&
    date.getDate() === comparison.getDate()
  );
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
    // Workspace preferences/drafts are non-critical.
  }
}

function communicationSearchText(item = {}) {
  return lower(
    [
      item.title,
      item.studentName,
      item.channel,
      item.status,
      item.body,
      item.source,
      item.subject,
    ].join(" ")
  );
}

function communicationKey(item = {}, index = 0) {
  return (
    item.id ||
    item.communication_id ||
    `${item.studentName || "student"}-${item.createdAt || "time"}-${index}`
  );
}

function sourceLabel(value = "") {
  const normalized = safeString(value, "Communication").replace(/[_-]+/g, " ");
  return normalized.replace(/\b\w/g, (letter) => letter.toUpperCase());
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

function channelTone(channel = "") {
  const value = lower(channel);

  if (value.includes("call"))
    return "border-emerald-300 bg-emerald-50 text-emerald-700";
  if (value.includes("whatsapp"))
    return "border-emerald-300 bg-emerald-50 text-emerald-700";
  if (value.includes("email"))
    return "border-orange-300 bg-orange-50 text-orange-700";
  if (value.includes("meeting"))
    return "border-[#173f69] bg-[#173f69] text-white";
  if (value.includes("support"))
    return "border-rose-300 bg-rose-50 text-rose-700";
  if (value.includes("note"))
    return "border-amber-300 bg-amber-50 text-amber-700";

  return "border-[#b7c5d1] bg-[#f3f7fb] text-[#173f69]";
}

function StatusToast({ status, onClear }) {
  if (!status?.message) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className={`mb-4 flex items-start justify-between gap-4 rounded-2xl border-2 px-4 py-3 text-sm font-semibold ${
        status.type === "error"
          ? "border-rose-300 bg-rose-50 text-rose-800"
          : "border-emerald-300 bg-emerald-50 text-emerald-800"
      }`}
    >
      <span>{status.message}</span>
      <button type="button" onClick={onClear} className="text-xs font-black">
        Clear
      </button>
    </div>
  );
}

function CommunicationStat({ label, value, helper, tone = "navy" }) {
  const tones = {
    navy: "border-[#173f69] bg-[#f3f7fb]",
    orange: "border-orange-300 bg-orange-50",
    emerald: "border-emerald-300 bg-emerald-50",
    violet: "border-violet-300 bg-violet-50",
    amber: "border-amber-300 bg-amber-50",
    rose: "border-rose-300 bg-rose-50",
  };

  return (
    <div className={`rounded-2xl border-2 p-4 shadow-sm ${tones[tone] || tones.navy}`}>
      <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#607487]">
        {label}
      </p>
      <p className="mt-2 text-2xl font-black text-[#102b4c]">{value}</p>
      {helper ? <p className="mt-1 text-xs font-medium text-[#607487]">{helper}</p> : null}
    </div>
  );
}

function ManualLogBox({ snapshot, counselor, onRefresh, setStatus }) {
  const students = safeArray(snapshot?.students);

  const [studentKey, setStudentKey] = useState("");
  const [studentSearch, setStudentSearch] = useState("");
  const [channel, setChannel] = useState("Note");
  const [subject, setSubject] = useState(() =>
    readSessionValue("zaifan_counselor_communication_subject", "")
  );
  const [message, setMessage] = useState(() =>
    readSessionValue("zaifan_counselor_communication_draft", "")
  );
  const [saving, setSaving] = useState(false);
  const [activeTemplate, setActiveTemplate] = useState("");

  useEffect(() => {
    writeSessionValue("zaifan_counselor_communication_subject", subject);
  }, [subject]);

  useEffect(() => {
    writeSessionValue("zaifan_counselor_communication_draft", message);
  }, [message]);

  const applyTemplate = (template) => {
    setActiveTemplate(template.key);
    setMessage(template.text);
  };

  const clearDraft = () => {
    setSubject("");
    setMessage("");
    setActiveTemplate("");
  };

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

  const selectedStudent = useMemo(
    () => students.find((student) => getStudentKey(student) === studentKey),
    [students, studentKey]
  );

  async function saveLog() {
    const cleanMessage = message.trim();

    if (!selectedStudent) {
      setStatus({ type: "error", message: "Select an assigned student first." });
      return;
    }

    if (!cleanMessage) {
      setStatus({ type: "error", message: "Write the communication note first." });
      return;
    }

    setSaving(true);
    setStatus(null);

    try {
      await logCounselorCommunication({
        studentId:
          selectedStudent.id ||
          selectedStudent.student_id ||
          selectedStudent.inquiry_id ||
          selectedStudent.email,
        studentName: getStudentName(selectedStudent),
        channel,
        subject: subject.trim() || `Counselor ${channel}`,
        message: cleanMessage,
        counselor,
        metadata: {
          source: "CommunicationHubManualLog",
          studentEmail: getStudentEmail(selectedStudent),
          selectedChannel: channel,
          studentType:
            selectedStudent.student_type ||
            selectedStudent.record_type ||
            selectedStudent.source_type ||
            "inquiry",
          loggedFrom: "CounselorCommunicationHub",
        },
      });

      setMessage("");
      setSubject("");
      setActiveTemplate("");
      writeSessionValue("zaifan_counselor_communication_subject", "");
      writeSessionValue("zaifan_counselor_communication_draft", "");
      setStatus({
        type: "success",
        message: `${channel} communication logged for ${getStudentName(selectedStudent)}.`,
      });
      await Promise.resolve(onRefresh?.());
    } catch (error) {
      console.error("Manual communication log failed", error);
      setStatus({
        type: "error",
        message:
          error?.message ||
          "Communication could not be logged. Check student_communications and RLS.",
      });
    } finally {
      setSaving(false);
    }
  }

  if (!students.length) {
    return (
      <div className="mb-5 rounded-2xl border-2 border-dashed border-[#c9d5de] bg-[#fffdf8] p-5 text-sm text-[#607487]">
        Quick communication logging becomes available when this counselor has assigned students.
      </div>
    );
  }

  return (
    <div className="mb-5 rounded-[1.5rem] border-2 border-orange-200 bg-[#fff8ef] p-4 sm:p-5">
      <div className="flex flex-col gap-2 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-orange-700">
            Quick Communication Log
          </p>
          <p className="mt-1 max-w-3xl text-sm leading-6 text-[#607487]">
            Log calls, WhatsApp, email, meetings and internal notes against the assigned
            student. This becomes part of the counselor communication history.
          </p>
        </div>
        <span className="rounded-xl border-2 border-[#173f69] bg-[#173f69] px-3 py-2 text-xs font-black text-white">
          {students.length} assigned
        </span>
      </div>

      <div className="mt-4 grid gap-3 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_180px]">
        <input
          value={studentSearch}
          onChange={(event) => setStudentSearch(event.target.value)}
          placeholder="Search assigned student..."
          className={INPUT_CLASS}
        />

        <select
          value={studentKey}
          onChange={(event) => setStudentKey(event.target.value)}
          className={INPUT_CLASS}
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
          className={INPUT_CLASS}
        >
          {CHANNELS.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      </div>

      {selectedStudent ? (
        <div className="mt-3 grid gap-2 rounded-2xl border-2 border-[#173f69] bg-[#173f69] p-3 text-white sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-white/70">
              Logging Against
            </p>
            <p className="mt-1 truncate text-sm font-black text-white">
              {getStudentName(selectedStudent)}
            </p>
            {getStudentEmail(selectedStudent) ? (
              <p className="mt-0.5 truncate text-xs font-medium text-white/75">
                {getStudentEmail(selectedStudent)}
              </p>
            ) : null}
          </div>
          <span className="rounded-xl border border-white/25 bg-white/10 px-3 py-2 text-xs font-black text-white">
            {channel}
          </span>
        </div>
      ) : null}

      <input
        value={subject}
        onChange={(event) => setSubject(event.target.value)}
        placeholder={`Subject, for example: Counselor ${channel}`}
        maxLength={180}
        className={`mt-3 ${INPUT_CLASS}`}
      />

      <div className="mt-3 flex flex-wrap gap-2">
        {MESSAGE_TEMPLATES.map((template) => (
          <button
            key={template.key}
            type="button"
            onClick={() => applyTemplate(template)}
            disabled={saving}
            aria-pressed={activeTemplate === template.key}
            className={`rounded-xl border-2 px-3 py-2 text-xs font-black transition disabled:opacity-50 ${
              activeTemplate === template.key
                ? "border-orange-500 bg-orange-500 text-white"
                : "border-[#c9d5de] bg-[#fffdf8] text-[#173f69] hover:border-orange-300 hover:bg-orange-50"
            }`}
          >
            {template.label}
          </button>
        ))}
      </div>

      <textarea
        aria-label="Counselor communication note"
        value={message}
        onChange={(event) => setMessage(event.target.value)}
        rows={4}
        maxLength={2500}
        placeholder="Write counselor communication note..."
        className={`mt-3 ${INPUT_CLASS} resize-y`}
      />

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <p className="text-xs font-medium text-[#718292]">
            {message.trim().length}/2500 characters · draft saved in this tab
          </p>
          {(message || subject) ? (
            <button
              type="button"
              onClick={clearDraft}
              disabled={saving}
              className="rounded-lg border border-[#c9d5de] bg-white px-2.5 py-1.5 text-[10px] font-black uppercase tracking-[0.12em] text-[#607487] transition hover:border-rose-300 hover:text-rose-700 disabled:opacity-50"
            >
              Clear Draft
            </button>
          ) : null}
        </div>

        <button
          type="button"
          onClick={saveLog}
          disabled={saving || !selectedStudent || !message.trim()}
          className="rounded-xl border-2 border-orange-500 bg-orange-500 px-4 py-2.5 text-xs font-black text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving ? "Logging..." : `Log ${channel}`}
        </button>
      </div>
    </div>
  );
}

function CommunicationCard({ item, compact }) {
  return (
    <article className="rounded-[1.5rem] border-2 border-[#c9d5de] bg-[#fffdf8] p-4 shadow-[0_8px_24px_rgba(16,43,76,0.05)] transition duration-300 hover:-translate-y-0.5 hover:border-orange-300">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-base font-black text-[#102b4c]">{item.title}</h3>
            <span className={`rounded-full border px-3 py-1 text-xs font-black ${channelTone(item.channel)}`}>
              {item.channel}
            </span>
          </div>

          <p className="mt-1.5 text-sm font-semibold text-[#607487]">
            {item.studentName} · {sourceLabel(item.source || "communication")}
          </p>

          {!compact && item.body ? (
            <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-6 text-[#415674]">
              {item.body}
            </p>
          ) : null}
        </div>

        <div className="shrink-0 text-left lg:text-right">
          <span className="rounded-full border border-[#173f69] bg-[#173f69] px-3 py-1 text-xs font-black text-white">
            {item.status}
          </span>
          <p className="mt-2 text-xs font-medium text-[#718292]">
            {formatRelativeTime(item.createdAt)}
          </p>
          {!compact && item.createdAt ? (
            <p className="mt-1 text-[11px] font-medium text-[#8a98a6]">
              {new Date(item.createdAt).toLocaleString()}
            </p>
          ) : null}
        </div>
      </div>
    </article>
  );
}

export default function CounselorCommunicationHub({
  snapshot,
  counselor,
  onRefresh,
  compact = false,
}) {
  const queue = useMemo(
    () => buildCounselorCommunicationHub(snapshot || {}),
    [snapshot]
  );

  const [status, setStatus] = useState(null);
  const [filter, setFilter] = useState(() => {
    const saved = readSessionValue(FILTER_STORAGE_KEY, "all");
    return VALID_FILTERS.has(saved) ? saved : "all";
  });
  const [sort, setSort] = useState(() => {
    const saved = readSessionValue(SORT_STORAGE_KEY, "latest");
    return VALID_SORTS.has(saved) ? saved : "latest";
  });
  const [query, setQuery] = useState("");

  useEffect(() => {
    writeSessionValue(FILTER_STORAGE_KEY, filter);
  }, [filter]);

  useEffect(() => {
    writeSessionValue(SORT_STORAGE_KEY, sort);
  }, [sort]);

  const stats = useMemo(() => {
    const calls = queue.filter((item) =>
      lower(item.channel).includes("call")
    ).length;
    const whatsapp = queue.filter((item) =>
      lower(item.channel).includes("whatsapp")
    ).length;
    const emails = queue.filter((item) =>
      lower(item.channel).includes("email")
    ).length;
    const meetings = queue.filter((item) =>
      lower(item.channel).includes("meeting")
    ).length;
    const support = queue.filter(
      (item) =>
        lower(item.source).includes("support") ||
        lower(item.channel).includes("support")
    ).length;
    const today = queue.filter((item) => isSameLocalDay(item.createdAt)).length;
    const students = new Set(
      queue.map((item) => lower(item.studentName)).filter(Boolean)
    ).size;

    return {
      total: queue.length,
      calls,
      whatsapp,
      emails,
      meetings,
      support,
      today,
      students,
    };
  }, [queue]);

  const filtered = useMemo(() => {
    const search = query.trim().toLowerCase();
    let next = queue;

    if (filter === "today") {
      next = next.filter((item) => isSameLocalDay(item.createdAt));
    } else if (filter !== "all") {
      next = next.filter((item) => {
        const text = lower(
          `${item.channel} ${item.source} ${item.title} ${item.body} ${item.status}`
        );
        return text.includes(filter);
      });
    }

    if (search) {
      next = next.filter((item) => communicationSearchText(item).includes(search));
    }

    return [...next].sort((a, b) => {
      if (sort === "oldest") {
        return safeDateMs(a.createdAt) - safeDateMs(b.createdAt);
      }

      if (sort === "student") {
        return safeString(a.studentName).localeCompare(safeString(b.studentName));
      }

      if (sort === "channel") {
        return safeString(a.channel).localeCompare(safeString(b.channel));
      }

      if (sort === "source") {
        return safeString(a.source).localeCompare(safeString(b.source));
      }

      return safeDateMs(b.createdAt) - safeDateMs(a.createdAt);
    });
  }, [queue, filter, query, sort]);

  const visible = compact ? filtered.slice(0, 4) : filtered;

  const reset = () => {
    setFilter("all");
    setSort("latest");
    setQuery("");
    setStatus(null);
  };

  return (
    <section className="rounded-[1.8rem] border-2 border-[#173f69] bg-[#fffaf2] p-4 shadow-[0_18px_55px_rgba(16,43,76,0.08)] sm:p-5">
      <div className="mb-5 flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-orange-700">
            Communication Hub
          </p>
          <h2 className="mt-2 text-2xl font-black tracking-tight text-[#102b4c] sm:text-3xl">
            Student Conversation Feed
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-[#607487]">
            Counselor notes, calls, messages, support-linked communication,
            appointment outcomes and conversation history in one timeline.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <span className="rounded-xl border-2 border-orange-300 bg-orange-50 px-4 py-2 text-sm font-black text-orange-700">
            {filtered.length}/{queue.length} visible
          </span>
          <span className="rounded-xl border-2 border-[#173f69] bg-[#173f69] px-4 py-2 text-sm font-black text-white">
            {stats.students} students
          </span>
          <span className="rounded-xl border-2 border-amber-300 bg-amber-50 px-4 py-2 text-sm font-black text-amber-700">
            Today {stats.today}
          </span>
        </div>
      </div>

      {!compact ? (
        <div className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6">
          <CommunicationStat label="Total" value={stats.total} helper="feed items" tone="orange" />
          <CommunicationStat label="Calls" value={stats.calls} helper="call logs" tone="emerald" />
          <CommunicationStat label="WhatsApp" value={stats.whatsapp} helper="message logs" tone="emerald" />
          <CommunicationStat label="Email" value={stats.emails} helper="email notes" />
          <CommunicationStat label="Meetings" value={stats.meetings} helper="meeting logs" tone="violet" />
          <CommunicationStat label="Support" value={stats.support} helper="support-linked" tone="rose" />
        </div>
      ) : null}

      {!compact ? (
        <>
          <StatusToast status={status} onClear={() => setStatus(null)} />

          <ManualLogBox
            snapshot={snapshot}
            counselor={counselor}
            onRefresh={onRefresh}
            setStatus={setStatus}
          />

          <div className="mb-5 grid gap-3 xl:grid-cols-[minmax(0,1fr)_190px_210px_auto]">
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search communication, student, channel, status or notes..."
              className={INPUT_CLASS}
            />

            <select
              value={filter}
              onChange={(event) => setFilter(event.target.value)}
              className={INPUT_CLASS}
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
              aria-label="Sort communication history"
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
              className="rounded-2xl border-2 border-[#173f69] bg-[#173f69] px-4 py-3 text-sm font-black text-white hover:bg-[#102f52]"
            >
              Reset
            </button>
          </div>
        </>
      ) : (
        <div className="mb-4 flex flex-wrap gap-2">
          {FILTERS.slice(0, 4).map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => setFilter(item.key)}
              className={`rounded-xl border-2 px-3 py-2 text-xs font-black ${
                filter === item.key
                  ? "border-orange-500 bg-orange-500 text-white"
                  : "border-[#c9d5de] bg-[#fffdf8] text-[#173f69]"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}

      {!compact ? (
        <div className="mb-3 flex flex-col gap-2 rounded-2xl border border-[#d8b892] bg-[#fff8ef] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs font-black uppercase tracking-[0.14em] text-[#7d684f]">
            Conversation history · {visible.length} visible records
          </p>
          <p className="text-xs font-semibold text-[#607487]">
            Sort: {SORTS.find((item) => item.key === sort)?.label || "Latest First"}
          </p>
        </div>
      ) : null}

      <div className="space-y-3">
        {visible.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-[#c9d5de] bg-[#fffdf8] p-7 text-center">
            <p className="text-sm font-black text-[#102b4c]">
              No communication history found.
            </p>
            <p className="mx-auto mt-2 max-w-2xl text-sm leading-6 text-[#607487]">
              Communication logs, support replies and appointment outcomes will appear
              after the counselor starts working with assigned students.
            </p>
            {query || filter !== "all" ? (
              <button
                type="button"
                onClick={reset}
                className="mt-4 rounded-xl border-2 border-orange-300 bg-orange-50 px-4 py-2 text-xs font-black text-orange-700"
              >
                Clear Filters
              </button>
            ) : null}
          </div>
        ) : (
          visible.map((item, index) => (
            <CommunicationCard
              key={communicationKey(item, index)}
              item={item}
              compact={compact}
            />
          ))
        )}
      </div>

      {compact && filtered.length > visible.length ? (
        <p className="mt-4 text-center text-xs font-semibold text-[#718292]">
          Showing {visible.length} of {filtered.length} communication items.
        </p>
      ) : null}
    </section>
  );
}
