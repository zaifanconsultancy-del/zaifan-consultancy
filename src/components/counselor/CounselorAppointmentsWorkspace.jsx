import React, { useMemo, useState } from "react";
import {
  buildCounselorAppointmentsQueue,
  formatRelativeTime,
  recordCounselorAppointmentOutcome,
} from "../../lib/counselorPortal";

const FILTERS = [
  { key: "all", label: "All" },
  { key: "past", label: "Needs Outcome" },
  { key: "upcoming", label: "Upcoming" },
  { key: "completed", label: "Completed" },
  { key: "call", label: "Calls" },
  { key: "meeting", label: "Meetings" },
];

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

function safeString(value, fallback = "") {
  if (value === null || value === undefined) return fallback;
  return String(value);
}

function lower(value) {
  return safeString(value).toLowerCase();
}


function appointmentStudent(item = {}) {
  return {
    id:
      item.studentId ||
      item.student_id ||
      item.inquiry_id ||
      item.appointment_id ||
      item.inquiryId ||
      null,
    name: item.studentName || item.student_name || item.name || "Student",
    studentType: item.student_type || item.record_type || item.source_type || "inquiry",
  };
}

async function recordAppointmentThroughPortal({ item, counselor, outcome, followUpRequired = true }) {
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
      appointmentId: item.id,
      studentType: student.studentType,
      channel: item.channel,
      title: item.title,
    },
  });
}


function statusTone(status = "") {
  const value = lower(status);

  if (value.includes("completed") || value.includes("done")) {
    return "border-emerald-400/25 bg-emerald-400/10 text-emerald-100";
  }

  if (value.includes("cancel")) {
    return "border-rose-400/25 bg-rose-400/10 text-rose-100";
  }

  if (value.includes("scheduled") || value.includes("pending")) {
    return "border-cyan-400/25 bg-cyan-400/10 text-cyan-100";
  }

  return "border-slate-400/20 bg-white/[0.04] text-slate-200";
}

function channelTone(channel = "") {
  const value = lower(channel);

  if (value.includes("call")) return "border-emerald-400/25 bg-emerald-400/10 text-emerald-100";
  if (value.includes("zoom") || value.includes("meet") || value.includes("meeting")) {
    return "border-violet-400/25 bg-violet-400/10 text-violet-100";
  }
  if (value.includes("office") || value.includes("in person")) {
    return "border-amber-400/25 bg-amber-400/10 text-amber-100";
  }

  return "border-cyan-400/25 bg-cyan-400/10 text-cyan-100";
}

function isCompleted(item = {}) {
  const status = lower(item.status);
  return status.includes("completed") || status.includes("done") || status.includes("closed");
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

function AppointmentStat({ label, value, helper, tone = "slate" }) {
  const tones = {
    slate: "border-white/10 bg-white/[0.04]",
    cyan: "border-cyan-400/20 bg-cyan-500/10",
    amber: "border-amber-400/20 bg-amber-500/10",
    emerald: "border-emerald-400/20 bg-emerald-500/10",
    violet: "border-violet-400/20 bg-violet-500/10",
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

function OutcomeBox({ item, counselor, onRefresh, setStatus }) {
  const [outcome, setOutcome] = useState("");
  const [followUpRequired, setFollowUpRequired] = useState(true);
  const [saving, setSaving] = useState(false);

  async function saveOutcome() {
    if (!outcome.trim()) {
      setStatus({ type: "error", message: "Write appointment outcome first." });
      return;
    }

    setSaving(true);
    setStatus(null);

    try {
      const cleanOutcome = outcome.trim();

      await recordAppointmentThroughPortal({
        item,
        counselor,
        outcome: cleanOutcome,
        followUpRequired,
      });

      setOutcome("");
      setStatus({
        type: "success",
        message: followUpRequired
          ? "Appointment outcome saved and follow-up task created."
          : "Appointment outcome saved.",
      });
      onRefresh?.();
    } catch (error) {
      console.error("Appointment outcome failed", error);
      setStatus({
        type: "error",
        message: `Appointment outcome could not be saved: ${error.message}`,
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.03] p-3">
      <div className="mb-3 flex flex-wrap gap-2">
        {OUTCOME_TEMPLATES.map((template) => (
          <button
            key={template.key}
            type="button"
            onClick={() => setOutcome(template.text)}
            className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-bold text-slate-300 hover:bg-white/[0.08]"
          >
            {template.label}
          </button>
        ))}
      </div>

      <textarea
        value={outcome}
        onChange={(event) => setOutcome(event.target.value)}
        rows={3}
        placeholder="Write appointment outcome, student decision, blockers, or next step..."
        className="w-full resize-none rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-cyan-400/40"
      />

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <label className="flex items-center gap-2 text-xs font-bold text-slate-300">
            <input
              type="checkbox"
              checked={followUpRequired}
              onChange={(event) => setFollowUpRequired(event.target.checked)}
              className="h-4 w-4 rounded border-white/20 bg-slate-950"
            />
            Create follow-up task
          </label>
          <p className="mt-1 text-xs text-slate-500">{outcome.trim().length} characters</p>
        </div>

        <button
          type="button"
          onClick={saveOutcome}
          disabled={saving}
          className="rounded-xl border border-emerald-400/30 bg-emerald-400/10 px-3 py-2 text-xs font-bold text-emerald-100 hover:bg-emerald-400/20 disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save Outcome"}
        </button>
      </div>
    </div>
  );
}

function AppointmentCard({ item, counselor, onRefresh, setStatus, compact }) {
  const completed = isCompleted(item);
  const needsOutcome = item.isPast && !completed;

  return (
    <article
      className={`rounded-3xl border p-4 transition hover:border-cyan-400/25 ${
        needsOutcome ? "border-amber-400/25 bg-amber-400/10" : "border-white/10 bg-slate-950/50 hover:bg-slate-900/70"
      }`}
    >
      <div className="grid gap-4 lg:grid-cols-[1fr_0.55fr_0.8fr] lg:items-center">
        <div>
          <h3 className="text-lg font-black">{item.title}</h3>
          <p className="text-sm text-slate-400">
            {item.studentName} · {item.channel}
          </p>

          <div className="mt-3 flex flex-wrap gap-2">
            <span className={`rounded-full border px-3 py-1 text-xs font-bold ${statusTone(item.status)}`}>
              {item.status}
            </span>
            <span className={`rounded-full border px-3 py-1 text-xs font-bold ${channelTone(item.channel)}`}>
              {item.channel}
            </span>
            {needsOutcome ? (
              <span className="rounded-full border border-amber-400/25 bg-amber-400/10 px-3 py-1 text-xs font-bold text-amber-100">
                Needs outcome
              </span>
            ) : null}
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Timing</p>
          <p className="mt-2 text-sm font-bold text-white">{formatRelativeTime(item.startAt)}</p>
          <p className="mt-1 text-xs text-slate-500">{item.startAt ? new Date(item.startAt).toLocaleString() : "No date"}</p>
        </div>

        <div className="text-sm text-slate-300">
          <p className="font-semibold">{item.nextAction}</p>
          <p className="mt-1 text-xs text-slate-500">
            {needsOutcome
              ? "Record the result so counselor performance, communication, and task follow-up stay synced."
              : "Review appointment state and prepare student follow-up."}
          </p>
        </div>
      </div>

      {!compact && !completed ? (
        <OutcomeBox item={item} counselor={counselor} onRefresh={onRefresh} setStatus={setStatus} />
      ) : null}
    </article>
  );
}

export default function CounselorAppointmentsWorkspace({ snapshot, counselor, onRefresh, compact = false }) {
  const queue = useMemo(() => buildCounselorAppointmentsQueue(snapshot || {}), [snapshot]);

  const [status, setStatus] = useState(null);
  const [filter, setFilter] = useState("all");
  const [query, setQuery] = useState("");

  const stats = useMemo(() => {
    const completed = queue.filter((item) => isCompleted(item)).length;
    const needsOutcome = queue.filter((item) => item.isPast && !isCompleted(item)).length;
    const upcoming = queue.filter((item) => !item.isPast && !isCompleted(item)).length;
    const calls = queue.filter((item) => lower(item.channel).includes("call")).length;
    const meetings = queue.filter((item) => lower(item.channel).includes("meeting") || lower(item.channel).includes("meet")).length;

    return {
      total: queue.length,
      completed,
      needsOutcome,
      upcoming,
      calls,
      meetings,
    };
  }, [queue]);

  const filtered = useMemo(() => {
    const search = query.trim().toLowerCase();

    let next = queue;

    if (filter === "past") next = next.filter((item) => item.isPast && !isCompleted(item));
    if (filter === "upcoming") next = next.filter((item) => !item.isPast && !isCompleted(item));
    if (filter === "completed") next = next.filter((item) => isCompleted(item));
    if (filter === "call") next = next.filter((item) => lower(item.channel).includes("call"));
    if (filter === "meeting") {
      next = next.filter((item) => lower(item.channel).includes("meeting") || lower(item.channel).includes("meet"));
    }

    if (search) {
      next = next.filter((item) =>
        [item.title, item.studentName, item.channel, item.status, item.nextAction]
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
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-cyan-300">Appointments</p>
          <h2 className="mt-2 text-2xl font-black">Counselor Appointment Queue</h2>
          <p className="mt-1 text-sm text-slate-400">
            Upcoming sessions, overdue outcomes, follow-ups, student notes, and appointment execution.
          </p>
        </div>

        <span className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-bold text-slate-200">
          {filtered.length}/{queue.length}
        </span>
      </div>

      {!compact ? (
        <div className="mb-5 grid gap-3 md:grid-cols-3 xl:grid-cols-6">
          <AppointmentStat label="Total" value={stats.total} helper="appointments" tone="cyan" />
          <AppointmentStat label="Outcome" value={stats.needsOutcome} helper="needs update" tone="amber" />
          <AppointmentStat label="Upcoming" value={stats.upcoming} helper="future sessions" tone="violet" />
          <AppointmentStat label="Completed" value={stats.completed} helper="closed sessions" tone="emerald" />
          <AppointmentStat label="Calls" value={stats.calls} helper="call sessions" />
          <AppointmentStat label="Meetings" value={stats.meetings} helper="meetings" />
        </div>
      ) : null}

      {!compact ? (
        <>
          <StatusToast status={status} onClear={() => setStatus(null)} />

          <div className="mb-5 grid gap-3 lg:grid-cols-[1fr_220px]">
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search appointment, student, channel, status, next action..."
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

      <div className="grid gap-3">
        {visible.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/15 p-6 text-center">
            <p className="text-sm font-bold text-white">No appointment records found.</p>
            <p className="mx-auto mt-2 max-w-2xl text-sm text-slate-400">
              Appointment records, overdue outcomes, and follow-up sessions will appear here once assigned to this counselor.
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
          visible.map((item) => (
            <AppointmentCard
              key={item.id}
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
        <p className="mt-4 text-center text-xs text-slate-500">
          Showing {visible.length} of {filtered.length} appointments. Open Appointments for full queue.
        </p>
      ) : null}
    </div>
  );
}