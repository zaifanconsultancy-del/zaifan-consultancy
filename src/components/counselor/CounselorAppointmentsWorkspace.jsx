import React, { useEffect, useMemo, useState } from "react";
import {
  buildCounselorAppointmentsQueue,
  formatRelativeTime,
  recordCounselorAppointmentOutcome,
} from "../../lib/counselorPortal";

const FILTERS = [
  { key: "all", label: "All" },
  { key: "past", label: "Needs Outcome" },
  { key: "today", label: "Today" },
  { key: "upcoming", label: "Upcoming" },
  { key: "completed", label: "Completed" },
  { key: "call", label: "Calls" },
  { key: "meeting", label: "Meetings" },
];

const SORTS = [
  { key: "attention", label: "Needs Attention" },
  { key: "soonest", label: "Soonest First" },
  { key: "latest", label: "Latest First" },
  { key: "student", label: "Student" },
  { key: "channel", label: "Channel" },
];

const FILTER_STORAGE_KEY = "zaifan_counselor_appointments_filter";
const SORT_STORAGE_KEY = "zaifan_counselor_appointments_sort";

const VALID_FILTERS = new Set(FILTERS.map((item) => item.key));
const VALID_SORTS = new Set(SORTS.map((item) => item.key));

const OUTCOME_TEMPLATES = [
  {
    key: "counseling",
    label: "Counseling Done",
    text: "Counseling session completed. Student was guided on destination, course options, eligibility, documents, and next steps.",
  },
  {
    key: "documents",
    label: "Docs Needed",
    text: "Appointment completed. Student needs to submit or correct required documents before the next application movement.",
  },
  {
    key: "application",
    label: "Application Next",
    text: "Appointment completed. Next step is to move application preparation forward and confirm university/course selection.",
  },
  {
    key: "visa",
    label: "Visa Next",
    text: "Appointment completed. Student was guided on CAS/visa readiness, financial documents, and visa timeline requirements.",
  },
];

const INPUT_CLASS =
  "w-full rounded-2xl border-2 border-[#d8b892] bg-[#fffdf8] px-4 py-3 text-sm font-semibold text-[#102b4c] outline-none transition placeholder:text-slate-400 focus:border-orange-500 focus:ring-4 focus:ring-orange-100";

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

function readSessionValue(key, fallback) {
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
    // Workspace preferences are optional.
  }
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

function minutesFromNow(value) {
  const time = safeDateMs(value);
  if (!time) return null;
  return Math.round((time - Date.now()) / 60000);
}

function appointmentUrgency(item = {}) {
  if (isCompleted(item)) return 0;
  if (item.isPast) return 100;

  const minutes = minutesFromNow(item.startAt);
  if (minutes === null) return 20;
  if (minutes <= 60) return 90;
  if (minutes <= 180) return 75;
  if (minutes <= 1440) return 60;
  if (minutes <= 4320) return 40;
  return 20;
}

function appointmentSearchText(item = {}) {
  return lower(
    [
      item.title,
      item.studentName,
      item.channel,
      item.status,
      item.nextAction,
      item.location,
      item.notes,
    ].join(" ")
  );
}

function appointmentKey(item = {}, index = 0) {
  return (
    item.id ||
    item.appointment_id ||
    `${item.studentName || "student"}-${item.startAt || "time"}-${index}`
  );
}

function timingLabel(item = {}) {
  if (isCompleted(item)) return "Closed";
  if (item.isPast) return "Overdue outcome";
  if (isSameLocalDay(item.startAt)) return "Today";

  const minutes = minutesFromNow(item.startAt);
  if (minutes !== null && minutes <= 180) return "Starting soon";
  return "Scheduled";
}

function appointmentStudent(item = {}) {
  return {
    personId: item.person_id || item.personId || null,
    id:
      item.person_id ||
      item.personId ||
      item.studentId ||
      item.student_id ||
      item.inquiry_id ||
      item.inquiryId ||
      null,
    name: item.studentName || item.student_name || item.name || "Student",
    studentType:
      item.student_type || item.record_type || item.source_type || "inquiry",
  };
}

async function recordAppointmentThroughPortal({
  item,
  counselor,
  outcome,
  followUpRequired = true,
}) {
  const student = appointmentStudent(item);

  return recordCounselorAppointmentOutcome({
    appointmentId: item.id,
    studentId: student.id,
    studentName: student.name,
    outcome,
    followUpRequired,
    counselor,
    metadata: {
      source: "CounselorAppointmentsWorkspace",
      personId: student.personId,
      legacyStudentId: item.student_id || item.studentId || null,
      inquiryId: item.inquiry_id || item.inquiryId || null,
      appointmentId: item.id,
      studentType: student.studentType,
      channel: item.channel,
      title: item.title,
      status: item.status,
      startAt: item.startAt,
      nextAction: item.nextAction,
      urgencyScore: appointmentUrgency(item),
    },
  });
}

function statusTone(status = "") {
  const value = lower(status);

  if (value.includes("completed") || value.includes("done")) {
    return "border-emerald-300 bg-emerald-50 text-emerald-700";
  }
  if (value.includes("cancel")) {
    return "border-rose-300 bg-rose-50 text-rose-700";
  }
  if (value.includes("scheduled") || value.includes("pending")) {
    return "border-orange-300 bg-orange-50 text-orange-700";
  }

  return "border-[#b7c5d1] bg-[#f3f7fb] text-[#173f69]";
}

function channelTone(channel = "") {
  const value = lower(channel);

  if (value.includes("call"))
    return "border-emerald-300 bg-emerald-50 text-emerald-700";
  if (value.includes("zoom") || value.includes("meet") || value.includes("meeting")) {
    return "border-[#173f69] bg-[#173f69] text-white";
  }
  if (value.includes("office") || value.includes("in person")) {
    return "border-amber-300 bg-amber-50 text-amber-700";
  }

  return "border-orange-300 bg-orange-50 text-orange-700";
}

function isCompleted(item = {}) {
  const status = lower(item.status);
  return (
    status.includes("completed") ||
    status.includes("done") ||
    status.includes("closed")
  );
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

function AppointmentStat({ label, value, helper, tone = "navy" }) {
  const tones = {
    navy: "border-[#173f69] bg-[#f3f7fb]",
    orange: "border-orange-300 bg-orange-50",
    amber: "border-amber-300 bg-amber-50",
    emerald: "border-emerald-300 bg-emerald-50",
    violet: "border-violet-300 bg-violet-50",
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

function OutcomeBox({ item, counselor, onRefresh, setStatus }) {
  const draftKey = `zaifan_appointment_outcome_${item.id || item.appointment_id || "draft"}`;
  const [outcome, setOutcome] = useState(() =>
    readSessionValue(draftKey, "")
  );
  const [followUpRequired, setFollowUpRequired] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTemplate, setActiveTemplate] = useState("");

  useEffect(() => {
    writeSessionValue(draftKey, outcome);
  }, [draftKey, outcome]);

  const applyTemplate = (template) => {
    setActiveTemplate(template.key);
    setOutcome(template.text);
  };

  const clearDraft = () => {
    setOutcome("");
    setActiveTemplate("");
  };

  async function saveOutcome() {
    const cleanOutcome = outcome.trim();

    if (!cleanOutcome) {
      setStatus({ type: "error", message: "Write the appointment outcome first." });
      return;
    }

    setSaving(true);
    setStatus(null);

    try {
      await recordAppointmentThroughPortal({
        item,
        counselor,
        outcome: cleanOutcome,
        followUpRequired,
      });

      setOutcome("");
      setActiveTemplate("");
      writeSessionValue(draftKey, "");
      setStatus({
        type: "success",
        message: followUpRequired
          ? "Appointment outcome saved and follow-up task created."
          : "Appointment outcome saved.",
      });
      await Promise.resolve(onRefresh?.());
    } catch (error) {
      console.error("Appointment outcome failed", error);
      setStatus({
        type: "error",
        message:
          error?.message ||
          "Appointment outcome could not be saved. Check Supabase/RLS.",
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mt-4 rounded-2xl border-2 border-orange-200 bg-[#fff8ef] p-4">
      <div className="mb-3">
        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-orange-700">
          Record Outcome
        </p>
        <p className="mt-1 text-xs leading-5 text-[#607487]">
          Save the result once. The service also logs communication/timeline history
          and can create the follow-up task.
        </p>
      </div>

      <div className="mb-3 flex flex-wrap gap-2">
        {OUTCOME_TEMPLATES.map((template) => (
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
        aria-label={`Appointment outcome for ${item.studentName || "student"}`}
        value={outcome}
        onChange={(event) => setOutcome(event.target.value)}
        rows={4}
        maxLength={2500}
        placeholder="Write appointment outcome, student decision, blockers and next step..."
        className={`${INPUT_CLASS} resize-y`}
      />

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <div>
          <label className="flex items-center gap-2 text-xs font-black text-[#173f69]">
            <input
              type="checkbox"
              checked={followUpRequired}
              onChange={(event) => setFollowUpRequired(event.target.checked)}
              disabled={saving}
              className="h-4 w-4 accent-orange-600"
            />
            Create follow-up task
          </label>
          <p className="mt-1 text-xs text-[#718292]">
            {outcome.trim().length}/2500 characters · draft saved in this tab
          </p>
          </div>

          {outcome ? (
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
          onClick={saveOutcome}
          disabled={saving || !outcome.trim()}
          className="rounded-xl border-2 border-orange-500 bg-orange-500 px-4 py-2.5 text-xs font-black text-white transition hover:-translate-y-0.5 hover:bg-orange-600 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-orange-100 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save Outcome"}
        </button>
      </div>
    </div>
  );
}

function AppointmentAttention({ item }) {
  const urgency = appointmentUrgency(item);
  const label = timingLabel(item);

  return (
    <div className="mt-3">
      <div className="mb-1.5 flex items-center justify-between gap-3 text-xs">
        <span className="font-bold text-[#607487]">Session attention</span>
        <span
          className={`rounded-full border px-2 py-1 font-black ${
            urgency >= 90
              ? "border-rose-300 bg-rose-50 text-rose-700"
              : urgency >= 60
                ? "border-amber-300 bg-amber-50 text-amber-700"
                : "border-[#b7c5d1] bg-white text-[#173f69]"
          }`}
        >
          {label}
        </span>
      </div>

      <div className="h-2.5 overflow-hidden rounded-full bg-[#e5edf3]">
        <div
          className={`h-full rounded-full transition-[width] duration-500 ${
            urgency >= 90
              ? "bg-rose-500"
              : urgency >= 60
                ? "bg-orange-500"
                : "bg-[#173f69]"
          }`}
          style={{ width: `${urgency}%` }}
        />
      </div>
    </div>
  );
}

function AppointmentCard({ item, counselor, onRefresh, setStatus, compact }) {
  const completed = isCompleted(item);
  const needsOutcome = item.isPast && !completed;

  return (
    <article
      className={`rounded-[1.6rem] border-2 p-4 shadow-[0_10px_30px_rgba(16,43,76,0.06)] transition duration-300 hover:-translate-y-0.5 sm:p-5 ${
        needsOutcome
          ? "border-amber-300 bg-amber-50/80"
          : "border-[#c9d5de] bg-[#fffdf8] hover:border-orange-300"
      }`}
    >
      <div className="grid gap-4 xl:grid-cols-[1fr_0.52fr_0.8fr] xl:items-center">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-lg font-black text-[#102b4c]">{item.title}</h3>
            {needsOutcome ? (
              <span className="rounded-full border border-amber-300 bg-white px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.15em] text-amber-700">
                Needs Outcome
              </span>
            ) : null}

            {isSameLocalDay(item.startAt) && !completed ? (
              <span className="rounded-full border border-orange-300 bg-orange-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.15em] text-orange-700">
                Today
              </span>
            ) : null}
          </div>

          <p className="mt-1.5 text-sm font-semibold text-[#607487]">
            {item.studentName} · {item.channel}
          </p>

          <div className="mt-3 flex flex-wrap gap-2">
            <span className={`rounded-full border px-3 py-1 text-xs font-black ${statusTone(item.status)}`}>
              {item.status}
            </span>
            <span className={`rounded-full border px-3 py-1 text-xs font-black ${channelTone(item.channel)}`}>
              {item.channel}
            </span>
          </div>
        </div>

        <div className="rounded-2xl border-2 border-[#d6e0e7] bg-[#f8fbfd] p-3.5">
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#718292]">
            Timing
          </p>
          <p className="mt-2 text-sm font-black text-[#102b4c]">
            {formatRelativeTime(item.startAt)}
          </p>
          <p className="mt-1 text-xs leading-5 text-[#718292]">
            {item.startAt ? new Date(item.startAt).toLocaleString() : "No date"}
          </p>

          {!compact ? <AppointmentAttention item={item} /> : null}
        </div>

        <div className="rounded-2xl border-2 border-orange-200 bg-[#fff8ef] p-3.5">
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-orange-700">
            Next Action
          </p>
          <p className="mt-2 text-sm font-bold leading-6 text-[#102b4c]">
            {item.nextAction || "Prepare the student session and confirm the next milestone."}
          </p>
          <p className="mt-1 text-xs leading-5 text-[#718292]">
            {needsOutcome
              ? "Record the result so timeline, communication and follow-up work stay in sync."
              : completed
                ? "Appointment is closed. Keep the next student milestone moving."
                : "Prepare notes and confirm attendance before the session."}
          </p>
        </div>
      </div>

      {!compact && !completed ? (
        <OutcomeBox
          item={item}
          counselor={counselor}
          onRefresh={onRefresh}
          setStatus={setStatus}
        />
      ) : null}
    </article>
  );
}

export default function CounselorAppointmentsWorkspace({
  snapshot,
  counselor,
  onRefresh,
  compact = false,
}) {
  const queue = useMemo(
    () => buildCounselorAppointmentsQueue(snapshot || {}),
    [snapshot]
  );

  const [status, setStatus] = useState(null);
  const [filter, setFilter] = useState(() => {
    const saved = readSessionValue(FILTER_STORAGE_KEY, "all");
    return VALID_FILTERS.has(saved) ? saved : "all";
  });
  const [sort, setSort] = useState(() => {
    const saved = readSessionValue(SORT_STORAGE_KEY, "attention");
    return VALID_SORTS.has(saved) ? saved : "attention";
  });
  const [query, setQuery] = useState("");

  useEffect(() => {
    writeSessionValue(FILTER_STORAGE_KEY, filter);
  }, [filter]);

  useEffect(() => {
    writeSessionValue(SORT_STORAGE_KEY, sort);
  }, [sort]);

  const stats = useMemo(() => {
    const completed = queue.filter((item) => isCompleted(item)).length;
    const needsOutcome = queue.filter(
      (item) => item.isPast && !isCompleted(item)
    ).length;
    const upcoming = queue.filter(
      (item) => !item.isPast && !isCompleted(item)
    ).length;
    const calls = queue.filter((item) =>
      lower(item.channel).includes("call")
    ).length;
    const meetings = queue.filter(
      (item) =>
        lower(item.channel).includes("meeting") ||
        lower(item.channel).includes("meet")
    ).length;
    const today = queue.filter(
      (item) => isSameLocalDay(item.startAt) && !isCompleted(item)
    ).length;
    const urgent = queue.filter(
      (item) => appointmentUrgency(item) >= 90 && !isCompleted(item)
    ).length;

    return {
      total: queue.length,
      completed,
      needsOutcome,
      upcoming,
      calls,
      meetings,
      today,
      urgent,
    };
  }, [queue]);

  const filtered = useMemo(() => {
    const search = query.trim().toLowerCase();
    let next = queue;

    if (filter === "past")
      next = next.filter((item) => item.isPast && !isCompleted(item));
    if (filter === "today")
      next = next.filter(
        (item) => isSameLocalDay(item.startAt) && !isCompleted(item)
      );
    if (filter === "upcoming")
      next = next.filter((item) => !item.isPast && !isCompleted(item));
    if (filter === "completed")
      next = next.filter((item) => isCompleted(item));
    if (filter === "call")
      next = next.filter((item) => lower(item.channel).includes("call"));
    if (filter === "meeting") {
      next = next.filter(
        (item) =>
          lower(item.channel).includes("meeting") ||
          lower(item.channel).includes("meet")
      );
    }

    if (search) {
      next = next.filter((item) => appointmentSearchText(item).includes(search));
    }

    return [...next].sort((a, b) => {
      if (sort === "soonest") {
        const aTime = safeDateMs(a.startAt) || Number.MAX_SAFE_INTEGER;
        const bTime = safeDateMs(b.startAt) || Number.MAX_SAFE_INTEGER;
        return aTime - bTime;
      }

      if (sort === "latest") {
        return safeDateMs(b.startAt) - safeDateMs(a.startAt);
      }

      if (sort === "student") {
        return safeString(a.studentName).localeCompare(safeString(b.studentName));
      }

      if (sort === "channel") {
        return safeString(a.channel).localeCompare(safeString(b.channel));
      }

      const urgencyDifference = appointmentUrgency(b) - appointmentUrgency(a);
      if (urgencyDifference !== 0) return urgencyDifference;

      return safeDateMs(a.startAt) - safeDateMs(b.startAt);
    });
  }, [queue, filter, query, sort]);

  const visible = compact ? filtered.slice(0, 4) : filtered;

  const reset = () => {
    setFilter("all");
    setSort("attention");
    setQuery("");
    setStatus(null);
  };

  return (
    <section className="rounded-[1.8rem] border-2 border-[#173f69] bg-[#fffaf2] p-4 shadow-[0_18px_55px_rgba(16,43,76,0.08)] sm:p-5">
      <div className="mb-5 flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-orange-700">
            Appointments
          </p>
          <h2 className="mt-2 text-2xl font-black tracking-tight text-[#102b4c] sm:text-3xl">
            Counselor Appointment Queue
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-[#607487]">
            Upcoming sessions, overdue outcomes, follow-up creation and student
            appointment execution in one counselor-scoped workspace.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <span className="rounded-xl border-2 border-orange-300 bg-orange-50 px-4 py-2 text-sm font-black text-orange-700">
            {filtered.length}/{queue.length} visible
          </span>
          <span className="rounded-xl border-2 border-amber-300 bg-amber-50 px-4 py-2 text-sm font-black text-amber-700">
            Today {stats.today}
          </span>
          <span className="rounded-xl border-2 border-rose-300 bg-rose-50 px-4 py-2 text-sm font-black text-rose-700">
            Attention {stats.urgent}
          </span>
        </div>
      </div>

      {!compact ? (
        <div className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6">
          <AppointmentStat label="Total" value={stats.total} helper="appointments" tone="orange" />
          <AppointmentStat label="Outcome" value={stats.needsOutcome} helper="needs update" tone="amber" />
          <AppointmentStat label="Upcoming" value={stats.upcoming} helper="future sessions" tone="violet" />
          <AppointmentStat label="Completed" value={stats.completed} helper="closed sessions" tone="emerald" />
          <AppointmentStat label="Calls" value={stats.calls} helper="call sessions" />
          <AppointmentStat
            label="Meetings"
            value={stats.meetings}
            helper={`${stats.today} today`}
          />
        </div>
      ) : null}

      {!compact ? (
        <>
          <StatusToast status={status} onClear={() => setStatus(null)} />

          <div className="mb-5 grid gap-3 xl:grid-cols-[minmax(0,1fr)_190px_210px_auto]">
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search appointment, student, channel, status or next action..."
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
              aria-label="Sort appointments"
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
              className="rounded-2xl border-2 border-[#173f69] bg-[#173f69] px-4 py-3 text-sm font-black text-white transition hover:bg-[#102f52] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-100"
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
            Showing {visible.length} of {queue.length} appointment records
          </p>
          <p className="text-xs font-semibold text-[#607487]">
            Sort: {SORTS.find((item) => item.key === sort)?.label || "Needs Attention"}
          </p>
        </div>
      ) : null}

      <div className="grid gap-3">
        {visible.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-[#c9d5de] bg-[#fffdf8] p-7 text-center">
            <p className="text-sm font-black text-[#102b4c]">
              No appointment records found.
            </p>
            <p className="mx-auto mt-2 max-w-2xl text-sm leading-6 text-[#607487]">
              Counselor-scoped appointment records will appear after an assigned student
              has a linked appointment.
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
            <AppointmentCard
              key={appointmentKey(item, index)}
              item={item}
              counselor={counselor}
              onRefresh={onRefresh}
              setStatus={setStatus}
              compact={compact}
            />
          ))
        )}
      </div>

      {compact && filtered.length > visible.length ? (
        <p className="mt-4 text-center text-xs font-semibold text-[#718292]">
          Showing {visible.length} of {filtered.length} appointments.
        </p>
      ) : null}
    </section>
  );
}
