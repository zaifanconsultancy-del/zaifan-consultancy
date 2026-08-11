// CounselorCommunicationHub COMMUNICATION DRAFT AUDIENCE FIX V3
// - unsent/failed records are Operations-only, not Student-facing
// - internal records remain Internal; sent/completed records remain Student-facing
// CounselorCommunicationHub COMMUNICATION AUDIENCE CLASSIFICATION FIX V2
// - classifies Admin/Counselor internal records from direction + visibility + metadata, not channel alone
// - Internal Notes filter and metrics now include Admin manual/internal records correctly
// CounselorCommunicationHub COMMUNICATION COMMAND MAX V1 — audience-safe Counselor OS
// Full replacement for: src/components/counselor/CounselorCommunicationHub.jsx
// - makes Internal Note vs Student Contact semantics explicit before saving
// - writes visibility/direction/studentVisible metadata for forward-compatible cross-portal privacy
// - preserves logCounselorCommunication contract, assignment rules, session draft persistence and refresh
// - adds Notes filtering, student-facing/internal metrics and stronger Partner OS command hierarchy
// - keeps existing search, sorting, support-linked history and compact mode
// - no schema changes and no fake sent/delivered state

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
  { key: "note", label: "Internal Notes" },
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
    text: "Discussed Universitaly pre-enrolment and visa readiness with the student. The student was advised to prepare the required visa documents and confirm the deadline.",
  },
];

const INPUT_CLASS =
  "w-full min-w-0 rounded-xl border-2 border-[#AFC0D0] bg-white px-4 py-3 text-sm font-bold text-[#10233F] outline-none transition placeholder:text-slate-400 focus:border-[#FF5A0A] focus:ring-4 focus:ring-orange-100";

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

function getStudentCommunicationIdentity(student = {}) {
  const declaredType = lower(
    student.student_type ||
      student.record_type ||
      student.source_type ||
      student.source_table ||
      ""
  );

  const inquiryId =
    student.inquiry_id ||
    student.inquiry_record_id ||
    (declaredType.includes("inquir") ? student.id : null);

  const appointmentId =
    student.appointment_id ||
    (declaredType.includes("appointment") ? student.id : null);

  if (declaredType.includes("appointment") && appointmentId) {
    return {
      studentId: String(appointmentId),
      studentType: "appointment",
    };
  }

  if (inquiryId) {
    return {
      studentId: String(inquiryId),
      studentType: "inquiry",
    };
  }

  if (appointmentId) {
    return {
      studentId: String(appointmentId),
      studentType: "appointment",
    };
  }

  return {
    studentId: String(student.student_id || student.id || ""),
    studentType: declaredType.includes("appointment") ? "appointment" : "inquiry",
  };
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

function getChannelAudience(channel = "Note") {
  const internal = lower(channel).includes("note");

  return internal
    ? {
        internal: true,
        label: "Internal staff note",
        shortLabel: "Internal",
        helper: "Private operational context. Student OS should not display this record.",
        tone: "border-amber-300 bg-amber-50 text-amber-800",
      }
    : {
        internal: false,
        label: "Student-contact record",
        shortLabel: "Student-facing",
        helper: "A real contact log intended for the student communication history.",
        tone: "border-emerald-300 bg-emerald-50 text-emerald-800",
      };
}

function getCommunicationMetadata(item = {}) {
  const metadata = item?.metadata;

  if (metadata && typeof metadata === "object" && !Array.isArray(metadata)) {
    return metadata;
  }

  if (typeof metadata === "string" && metadata.trim()) {
    try {
      const parsed = JSON.parse(metadata);
      return parsed && typeof parsed === "object" && !Array.isArray(parsed)
        ? parsed
        : {};
    } catch {
      return {};
    }
  }

  return {};
}

function getRecordAudience(item = {}) {
  const metadata = getCommunicationMetadata(item);

  const channel = lower(item.channel || item.type || "");
  const direction = lower(
    item.direction ||
      metadata.direction ||
      metadata.message_direction ||
      ""
  );
  const visibility = lower(
    item.visibility ||
      metadata.visibility ||
      metadata.audience ||
      metadata.scope ||
      ""
  );
  const status = lower(item.status || "");

  const explicitStudentVisible =
    item.student_visible ??
    metadata.student_visible ??
    metadata.studentVisible;

  const explicitlyPrivate =
    explicitStudentVisible === false ||
    String(explicitStudentVisible ?? "").toLowerCase() === "false" ||
    metadata.is_internal === true ||
    metadata.internal === true ||
    ["internal", "private", "staff", "staff_only", "admin_only", "counselor_only"].includes(
      visibility
    );

  const internal =
    explicitlyPrivate ||
    ["internal", "staff", "private"].includes(direction) ||
    channel === "note" ||
    channel === "notes" ||
    channel.includes("internal_note") ||
    channel.includes("staff_note") ||
    channel.includes("admin_note") ||
    channel.includes("counselor_note");

  if (internal) {
    return {
      internal: true,
      operationsOnly: true,
      label: "Internal staff record",
      shortLabel: "Internal",
      helper: "Private operational context. Student OS must not display this record.",
      tone: "border-amber-300 bg-amber-50 text-amber-800",
    };
  }

  const unsentOrFailed = [
    "draft",
    "queued",
    "scheduled",
    "pending",
    "failed",
    "cancelled",
    "canceled",
  ].some(
    (blockedStatus) =>
      status === blockedStatus ||
      status.startsWith(`${blockedStatus}_`)
  );

  if (unsentOrFailed) {
    return {
      internal: false,
      operationsOnly: true,
      label: "Operational-only record",
      shortLabel: "Operations-only",
      helper: "This record is not yet eligible for Student OS because it has not been sent or completed.",
      tone: "border-orange-300 bg-orange-50 text-orange-800",
    };
  }

  return {
    internal: false,
    operationsOnly: false,
    label: "Student-contact record",
    shortLabel: "Student-facing",
    helper: "A sent or completed contact record eligible for the student communication history.",
    tone: "border-emerald-300 bg-emerald-50 text-emerald-800",
  };
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
    return "border-[#123865] bg-[#123865] text-white";
  if (value.includes("support"))
    return "border-rose-300 bg-rose-50 text-rose-700";
  if (value.includes("note"))
    return "border-amber-300 bg-amber-50 text-amber-700";

  return "border-[#AFC0D0] bg-[#F1F6FA] text-[#123865]";
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
    navy: "border-[#123865] bg-[#F1F6FA]",
    orange: "border-orange-300 bg-orange-50",
    emerald: "border-emerald-300 bg-emerald-50",
    violet: "border-violet-300 bg-violet-50",
    amber: "border-amber-300 bg-amber-50",
    rose: "border-rose-300 bg-rose-50",
  };

  return (
    <div className={`relative overflow-hidden rounded-[1.3rem] border-2 p-4 shadow-[0_9px_22px_rgba(16,35,63,0.08)] ${tones[tone] || tones.navy}`}>
      <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#5B6D80]">
        {label}
      </p>
      <p className="mt-2 text-2xl font-black text-[#10233F]">{value}</p>
      {helper ? <p className="mt-1 text-xs font-medium text-[#5B6D80]">{helper}</p> : null}
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
  const audience = getChannelAudience(channel);

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
      const identity = getStudentCommunicationIdentity(selectedStudent);

      if (!identity.studentId) {
        throw new Error("Could not resolve this student's inquiry/appointment identity.");
      }

      await logCounselorCommunication({
        studentId: identity.studentId,
        studentType: identity.studentType,
        studentName: getStudentName(selectedStudent),
        channel,
        subject: subject.trim() || `Counselor ${channel}`,
        message: cleanMessage,
        counselor,
        metadata: {
          source: "CommunicationHubManualLog",
          studentEmail: getStudentEmail(selectedStudent),
          selectedChannel: channel,
          studentType: identity.studentType,
          student_type: identity.studentType,
          portalReferenceId: identity.studentId,
          inquiryId:
            selectedStudent.inquiry_id ||
            selectedStudent.inquiry_record_id ||
            null,
          appointmentId: selectedStudent.appointment_id || null,
          personId: selectedStudent.person_id || null,
          loggedFrom: "CounselorCommunicationHub",
          direction: audience.internal ? "internal" : "outbound",
          visibility: audience.internal ? "staff_only" : "student_safe",
          studentVisible: !audience.internal,
        },
      });

      setMessage("");
      setSubject("");
      setActiveTemplate("");
      writeSessionValue("zaifan_counselor_communication_subject", "");
      writeSessionValue("zaifan_counselor_communication_draft", "");
      setStatus({
        type: "success",
        message: audience.internal
          ? `Internal note saved for ${getStudentName(selectedStudent)}.`
          : `${channel} student-contact record logged for ${getStudentName(selectedStudent)}.`,
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
      <div className="mb-5 rounded-2xl border-2 border-dashed border-[#B9C8D8] bg-[#FFFCF7] p-5 text-sm text-[#5B6D80]">
        Quick communication logging becomes available when this counselor has assigned students.
      </div>
    );
  }

  return (
    <div className="mb-5 overflow-hidden rounded-[1.7rem] border-[3px] border-[#123865] bg-[#FFFCF7] shadow-[0_14px_34px_rgba(16,35,63,0.09)]">
      <div className="border-b-[3px] border-orange-400 bg-[#123865] p-4 text-white sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-300">
              Communication Composer
            </p>
            <h3 className="mt-1 text-xl font-black text-white">Log the right record to the right audience</h3>
            <p className="mt-2 text-sm leading-6 text-blue-100">
              Calls, WhatsApp, email and meetings are student-contact records. Note is an internal staff record and is marked private for Student OS.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="rounded-xl border-2 border-white/20 bg-white/10 px-3 py-2 text-xs font-black text-white">
              {students.length} assigned
            </span>
            <span className={`rounded-xl border-2 px-3 py-2 text-xs font-black ${audience.tone}`}>
              {audience.shortLabel}
            </span>
          </div>
        </div>
      </div>

      <div className="space-y-4 bg-[#FFF8EF] p-4 sm:p-5">
        <div className={`rounded-2xl border-2 p-4 ${audience.tone}`}>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.16em] opacity-70">Audience Guard</p>
              <p className="mt-1 text-sm font-black">{audience.label}</p>
              <p className="mt-1 text-xs font-semibold leading-5 opacity-80">{audience.helper}</p>
            </div>
            <span className="w-fit rounded-lg border border-current/20 bg-white/60 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.12em]">
              {channel}
            </span>
          </div>
        </div>

        <div className="grid gap-3 xl:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)_190px]">
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
            aria-label="Communication channel and audience"
          >
            {CHANNELS.map((item) => (
              <option key={item} value={item}>
                {item}{item === "Note" ? " · Internal" : " · Student contact"}
              </option>
            ))}
          </select>
        </div>

        {selectedStudent ? (
          <div className="grid gap-3 rounded-2xl border-[3px] border-[#123865] bg-[#123865] p-4 text-white sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
            <div className="min-w-0">
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-white/65">Recording Against</p>
              <p className="mt-1 truncate text-base font-black text-white">{getStudentName(selectedStudent)}</p>
              {getStudentEmail(selectedStudent) ? (
                <p className="mt-0.5 truncate text-xs font-semibold text-blue-100">{getStudentEmail(selectedStudent)}</p>
              ) : null}
            </div>
            <div className="flex flex-wrap items-center gap-2 sm:justify-end">
              <span className="rounded-xl border border-white/25 bg-white/10 px-3 py-2 text-xs font-black text-white">{channel}</span>
              <span className={`rounded-xl border-2 px-3 py-2 text-xs font-black ${audience.tone}`}>{audience.shortLabel}</span>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border-2 border-dashed border-[#AFC0D0] bg-[#FFFCF7] p-4 text-xs font-semibold text-[#5B6D80]">
            Select the assigned student before saving a communication record.
          </div>
        )}

        <input
          value={subject}
          onChange={(event) => setSubject(event.target.value)}
          placeholder={audience.internal ? "Internal note subject" : `Subject, for example: Counselor ${channel}`}
          maxLength={180}
          className={INPUT_CLASS}
        />

        <div className="rounded-2xl border-2 border-[#C9D7E6] bg-[#FFFCF7] p-3">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <p className="text-[10px] font-black uppercase tracking-[0.15em] text-[#5B6D80]">Quick Context Templates</p>
            <p className="text-[10px] font-bold text-[#6B7D8F]">Optional · edit before saving</p>
          </div>
          <div className="flex flex-wrap gap-2">
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
                    : "border-[#B9C8D8] bg-white text-[#123865] hover:border-orange-300 hover:bg-orange-50"
                }`}
              >
                {template.label}
              </button>
            ))}
          </div>
        </div>

        <textarea
          aria-label={audience.internal ? "Internal counselor note" : "Counselor student-contact record"}
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          rows={5}
          maxLength={2500}
          placeholder={
            audience.internal
              ? "Write private operational context for the Zaifan team..."
              : `Record what was communicated through ${channel}...`
          }
          className={`${INPUT_CLASS} resize-y`}
        />

        <div className="flex flex-col gap-3 rounded-2xl border-2 border-[#C9D7E6] bg-[#FFFCF7] p-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-xs font-semibold text-[#6B7D8F]">{message.trim().length}/2500 · draft preserved in this tab</p>
            {(message || subject) ? (
              <button
                type="button"
                onClick={clearDraft}
                disabled={saving}
                className="rounded-lg border border-[#B9C8D8] bg-white px-2.5 py-1.5 text-[10px] font-black uppercase tracking-[0.12em] text-[#5B6D80] transition hover:border-rose-300 hover:text-rose-700 disabled:opacity-50"
              >
                Clear Draft
              </button>
            ) : null}
          </div>

          <button
            type="button"
            onClick={saveLog}
            disabled={saving || !selectedStudent || !message.trim()}
            className={`rounded-xl border-2 px-4 py-3 text-xs font-black transition disabled:cursor-not-allowed disabled:opacity-50 ${
              audience.internal
                ? "border-amber-500 bg-amber-500 text-white hover:bg-amber-600"
                : "border-orange-500 bg-orange-500 text-white hover:bg-orange-600"
            }`}
          >
            {saving ? "Saving..." : audience.internal ? "Save Internal Note" : `Log ${channel} Contact`}
          </button>
        </div>
      </div>
    </div>
  );
}

function CommunicationCard({ item, compact }) {
  const audience = getRecordAudience(item);

  return (
    <article className="overflow-hidden rounded-[1.6rem] border-[3px] border-[#B9C8D8] bg-[#FFFCF7] p-4 shadow-[0_14px_34px_rgba(16,35,63,0.10)] transition duration-300 hover:-translate-y-0.5 hover:border-[#123865] hover:shadow-[0_20px_44px_rgba(16,35,63,0.14)]">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-base font-black text-[#10233F]">{item.title}</h3>
            <span className={`rounded-full border px-3 py-1 text-xs font-black ${channelTone(item.channel)}`}>
              {item.channel}
            </span>
            <span className={`rounded-full border px-3 py-1 text-[10px] font-black ${audience.tone}`}>
              {audience.shortLabel}
            </span>
          </div>

          <p className="mt-1.5 text-sm font-semibold text-[#5B6D80]">
            {item.studentName} · {sourceLabel(item.source || "communication")}
          </p>

          {!compact && item.body ? (
            <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-6 text-[#415674]">
              {item.body}
            </p>
          ) : null}
        </div>

        <div className="shrink-0 text-left lg:text-right">
          <span className="rounded-full border border-[#123865] bg-[#123865] px-3 py-1 text-xs font-black text-white">
            {item.status}
          </span>
          <p className="mt-2 text-xs font-medium text-[#6B7D8F]">
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
    const internalNotes = queue.filter((item) => getRecordAudience(item).internal).length;
    const studentFacing = queue.length - internalNotes;
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
      internalNotes,
      studentFacing,
      today,
      students,
    };
  }, [queue]);

  const filtered = useMemo(() => {
    const search = query.trim().toLowerCase();
    let next = queue;

    if (filter === "today") {
      next = next.filter((item) => isSameLocalDay(item.createdAt));
    } else if (filter === "note") {
      next = next.filter((item) => getRecordAudience(item).internal);
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
    <section className="overflow-hidden rounded-[2.25rem] border-[4px] border-[#123865] bg-[#FFF8EF] p-2.5 shadow-[0_28px_80px_rgba(16,35,63,0.16)] sm:p-4">
      <div className="relative mb-5 overflow-hidden rounded-[1.8rem] border-[3px] border-[#FF5A0A] bg-[#123865] p-4 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08),0_16px_36px_rgba(16,35,63,0.20)] xl:flex xl:items-start xl:justify-between xl:gap-5 sm:p-5">
        <div aria-hidden="true" className="pointer-events-none absolute -right-14 -top-20 h-52 w-52 rounded-full border-[26px] border-white/5" />
        <div aria-hidden="true" className="pointer-events-none absolute -bottom-24 right-20 h-44 w-44 rounded-full border-[22px] border-orange-400/10" />

        <div className="relative z-[1]">
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-orange-300">
            Counselor Communication OS
          </p>
          <h2 className="mt-2 text-2xl font-black tracking-tight text-white">
            Communication Command Center
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-blue-100">
            Log real student contact, protect internal notes, and keep calls, WhatsApp, email,
            meetings, support and case communication in one operational history.
          </p>
        </div>

        <div className="relative z-[1] flex flex-wrap gap-2">
          <span className="rounded-xl border-2 border-orange-300/70 bg-orange-400/15 px-3 py-2 text-xs font-black text-orange-300">
            {filtered.length}/{queue.length} visible
          </span>
          <span className="rounded-xl border-2 border-white/20 bg-white/10 px-3 py-2 text-xs font-black text-white">
            {stats.students} students
          </span>
          <span className="rounded-xl border-2 border-emerald-300/60 bg-emerald-400/10 px-3 py-2 text-xs font-black text-emerald-200">
            {stats.studentFacing} student-facing
          </span>
          <span className="rounded-xl border-2 border-amber-300 bg-amber-50 px-3 py-2 text-xs font-black text-amber-700">
            Today {stats.today}
          </span>
        </div>
      </div>

      {!compact ? (
        <div className="mb-5 grid gap-3 rounded-[1.55rem] border-[3px] border-[#123865] bg-[#FFFCF7] p-3 shadow-[0_12px_28px_rgba(16,35,63,0.08)] sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6">
          <CommunicationStat label="Total History" value={stats.total} helper="all communication records" tone="orange" />
          <CommunicationStat label="Student-Facing" value={stats.studentFacing} helper="contact records" tone="emerald" />
          <CommunicationStat label="Internal Notes" value={stats.internalNotes} helper="staff-only context" tone="amber" />
          <CommunicationStat label="WhatsApp" value={stats.whatsapp} helper="message logs" tone="emerald" />
          <CommunicationStat label="Email + Calls" value={stats.emails + stats.calls} helper="direct contact logs" />
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

          <div className="mb-5 grid gap-3 rounded-[1.55rem] border-[3px] border-[#123865] bg-[#FFF8EF] p-3 shadow-[inset_0_0_0_1px_rgba(255,90,10,0.12)] xl:grid-cols-[minmax(0,1fr)_190px_210px_auto]">
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
              className="rounded-2xl border-2 border-[#123865] bg-[#123865] px-4 py-3 text-sm font-black text-white hover:bg-[#0B2A4B]"
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
                  : "border-[#B9C8D8] bg-[#FFFCF7] text-[#123865]"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}

      {!compact ? (
        <div className="mb-3 flex flex-col gap-2 rounded-xl border-2 border-[#123865] bg-[#123865] px-4 py-3 text-white shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs font-black uppercase tracking-[0.14em] text-white">
            Operational history · {visible.length} visible records · audience-labelled
          </p>
          <p className="text-xs font-semibold text-blue-100">
            Sort: {SORTS.find((item) => item.key === sort)?.label || "Latest First"}
          </p>
        </div>
      ) : null}

      <div className="space-y-3">
        {visible.length === 0 ? (
          <div className="rounded-[1.5rem] border-[3px] border-dashed border-[#AFC0D0] bg-[#FFFCF7] p-8 text-center shadow-inner">
            <p className="text-sm font-black text-[#10233F]">
              No communication history found.
            </p>
            <p className="mx-auto mt-2 max-w-2xl text-sm leading-6 text-[#5B6D80]">
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
        <p className="mt-4 text-center text-xs font-semibold text-[#6B7D8F]">
          Showing {visible.length} of {filtered.length} communication items.
        </p>
      ) : null}
    </section>
  );
}
