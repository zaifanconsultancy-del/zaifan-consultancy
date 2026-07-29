// MeetingCenter V3 EXTREME — Zaifan Communication OS
// Full replacement for:
// src/components/admin/communication/MeetingCenter.jsx
//
// Production principles:
// - no fake students, workflows, SLA values or success percentages
// - appointments are the primary real meeting source
// - filters derive from real appointment fields
// - no-show / completion / confirmation only appear when the data says so
// - actions are enabled only when handlers are supplied
// - optional communicationData.meetings can enrich analytics without breaking CRM-only mode
// - unified Zaifan navy/orange/cream Communication OS visual language
//
// Supported props:
// compact?: boolean
// appointments?: []
// inquiries?: []
// followUpReminders?: []
// communicationData?: {
//   meetings?: {
//     metrics?: object,
//     history?: [],
//     workflows?: [],
//     updatedAt?: string
//   }
// }
// onOpenRecord?: (record) => void
// onOpenMeeting?: (record) => void

import React, { useMemo, useState } from "react";
import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  Clock3,
  FileText,
  Info,
  Search,
  ShieldCheck,
  Sparkles,
  UserCheck,
  Users,
  Video,
  X,
} from "lucide-react";

function safeArray(value) {
  return Array.isArray(value) ? value.filter(Boolean) : [];
}

function hasValue(value) {
  return value !== undefined && value !== null && value !== "";
}

function normalize(value = "") {
  return String(value)
    .toLowerCase()
    .trim()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ");
}

function getName(record = {}) {
  return (
    record.full_name ||
    record.fullName ||
    record.name ||
    record.student_name ||
    record.studentName ||
    record.email ||
    record.phone ||
    "Unnamed appointment"
  );
}

function getStatus(record = {}) {
  return normalize(
    record.status ||
      record.appointment_status ||
      record.appointment_stage ||
      ""
  );
}

function getPriority(record = {}) {
  return normalize(record.priority || record.lead_priority || "");
}

function getDateValue(record = {}) {
  return (
    record.appointment_date ||
    record.date ||
    record.scheduled_for ||
    record.start_time ||
    record.created_at ||
    null
  );
}

function getTimeValue(record = {}) {
  return (
    record.appointment_time ||
    record.time ||
    record.start_time ||
    record.scheduled_time ||
    ""
  );
}

function isToday(value) {
  if (!value) return false;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return false;

  const now = new Date();

  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
}

function isThisWeek(value) {
  if (!value) return false;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return false;

  const now = new Date();
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  start.setDate(now.getDate() - now.getDay());

  const end = new Date(start);
  end.setDate(start.getDate() + 7);

  return date >= start && date < end;
}

function isPast(value) {
  if (!value) return false;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return false;
  return date.getTime() < Date.now();
}

function isCompleted(record = {}) {
  const status = getStatus(record);
  return ["completed", "done", "resolved", "finished"].includes(status);
}

function isCancelled(record = {}) {
  const status = getStatus(record);
  return ["cancelled", "canceled", "rejected"].includes(status);
}

function isNoShow(record = {}) {
  const status = getStatus(record);
  return ["no show", "no-show", "noshow", "missed"].includes(status);
}

function isOpen(record = {}) {
  return !isCompleted(record) && !isCancelled(record);
}

function formatDate(value) {
  if (!value) return "—";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  try {
    return new Intl.DateTimeFormat("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(date);
  } catch {
    return "—";
  }
}

function formatTime(record = {}) {
  const raw = getTimeValue(record);

  if (!raw) return "—";

  if (String(raw).includes("T")) {
    const date = new Date(raw);
    if (!Number.isNaN(date.getTime())) {
      try {
        return new Intl.DateTimeFormat("en-GB", {
          hour: "2-digit",
          minute: "2-digit",
        }).format(date);
      } catch {
        return String(raw);
      }
    }
  }

  return String(raw);
}

function statusTone(record = {}) {
  if (isCompleted(record)) return "green";
  if (isCancelled(record) || isNoShow(record)) return "red";

  const status = getStatus(record);

  if (
    status.includes("confirmed") ||
    status.includes("accepted") ||
    status.includes("booked")
  ) {
    return "blue";
  }

  if (
    status.includes("pending") ||
    status.includes("waiting") ||
    status.includes("reschedule")
  ) {
    return "orange";
  }

  return "navy";
}

export default function MeetingCenter({
  compact = false,
  appointments = [],
  inquiries = [],
  followUpReminders = [],
  communicationData = {},
  onOpenRecord,
  onOpenMeeting,
}) {
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");

  const safeAppointments = useMemo(
    () => safeArray(appointments),
    [appointments]
  );

  const meetingData = communicationData?.meetings || {};

  const stats = useMemo(() => {
    const total = safeAppointments.length;
    const today = safeAppointments.filter((item) =>
      isToday(getDateValue(item))
    ).length;

    const thisWeek = safeAppointments.filter((item) =>
      isThisWeek(getDateValue(item))
    ).length;

    const completed = safeAppointments.filter(isCompleted).length;
    const noShow = safeAppointments.filter(isNoShow).length;
    const open = safeAppointments.filter(isOpen).length;

    const overdueOpen = safeAppointments.filter((item) => {
      return isOpen(item) && isPast(getDateValue(item));
    }).length;

    return {
      total,
      today,
      thisWeek,
      completed,
      noShow,
      open,
      overdueOpen,
    };
  }, [safeAppointments]);

  const filters = [
    "All",
    "Today",
    "This Week",
    "Open",
    "Completed",
    "No Show",
    "Overdue",
  ];

  const visibleAppointments = useMemo(() => {
    const query = normalize(search);

    return safeAppointments.filter((item) => {
      const dateValue = getDateValue(item);

      const matchesFilter =
        filter === "All" ||
        (filter === "Today" && isToday(dateValue)) ||
        (filter === "This Week" && isThisWeek(dateValue)) ||
        (filter === "Open" && isOpen(item)) ||
        (filter === "Completed" && isCompleted(item)) ||
        (filter === "No Show" && isNoShow(item)) ||
        (filter === "Overdue" && isOpen(item) && isPast(dateValue));

      if (!matchesFilter) return false;

      const haystack = normalize(
        [
          getName(item),
          item.email,
          item.phone,
          item.country_interest,
          item.consultation_type,
          item.message,
          item.status,
          item.appointment_stage,
          item.priority,
          item.counselor_name,
          item.assigned_to_name,
        ]
          .filter(Boolean)
          .join(" ")
      );

      return !query || haystack.includes(query);
    });
  }, [safeAppointments, filter, search]);

  const connectedWorkflows = useMemo(
    () => safeArray(meetingData.workflows),
    [meetingData.workflows]
  );

  const canOpen = typeof onOpenMeeting === "function" || typeof onOpenRecord === "function";

  if (compact) {
    return (
      <section className="overflow-hidden rounded-[1.5rem] border-[3px] border-[#234E78] bg-[#FFFDF8]">
        <div className="flex items-center justify-between gap-3 border-b-[3px] border-orange-400 bg-[#123865] px-4 py-3 text-white">
          <div>
            <p className="text-[8px] font-black uppercase tracking-[0.13em] text-orange-300">
              Communication OS
            </p>
            <h2 className="mt-0.5 text-base font-black text-white">
              Meeting Center
            </h2>
          </div>

          <Video size={18} />
        </div>

        <div className="grid gap-3 p-4 sm:grid-cols-2">
          <CompactMetric label="Appointments" value={stats.total} />
          <CompactMetric label="Today" value={stats.today} />
          <CompactMetric label="Open" value={stats.open} />
          <CompactMetric label="Completed" value={stats.completed} />
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-4 sm:space-y-5">
      <header className="overflow-hidden rounded-[1.8rem] border-[3px] border-orange-400 bg-[#FFF8EE] shadow-[0_16px_42px_rgba(23,36,61,0.07)]">
        <div className="grid xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)]">
          <div className="bg-[#123865] p-5 text-white sm:p-6">
            <div className="flex flex-wrap items-center gap-2">
              <HeaderChip icon={Video} label="Meeting Center" />
              <HeaderChip icon={ShieldCheck} label="Appointments Table" />
            </div>

            <h1 className="mt-4 text-2xl font-black tracking-[-0.025em] text-white sm:text-3xl">
              Meeting & Counseling Center
            </h1>

            <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-white/90">
              Manage real appointment records for counseling sessions,
              application reviews, visa preparation and follow-up meetings.
              Nothing in this workspace is generated from fake students or
              placeholder meeting queues.
            </p>

            <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
              <DarkMetric label="Appointments" value={stats.total} />
              <DarkMetric label="Today" value={stats.today} />
              <DarkMetric label="Open" value={stats.open} />
              <DarkMetric label="Completed" value={stats.completed} />
            </div>
          </div>

          <div className="border-t-[3px] border-orange-300 bg-orange-500 p-5 text-white xl:border-l-[3px] xl:border-t-0 sm:p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[9px] font-black uppercase tracking-[0.12em] text-white">
                  Schedule pressure
                </p>

                <p className="mt-2 text-4xl font-black text-white">
                  {stats.overdueOpen}
                </p>

                <p className="mt-1 text-xs font-black uppercase tracking-[0.08em] text-white">
                  open meetings past date
                </p>
              </div>

              <span className="flex h-12 w-12 items-center justify-center rounded-2xl border-2 border-white/30 bg-white/10">
                <Clock3 size={22} />
              </span>
            </div>

            <div className="mt-5 rounded-2xl border-2 border-white/25 bg-white/10 p-3">
              <p className="text-xs font-black text-white">
                No fake meeting success score
              </p>
              <p className="mt-1 text-[10px] font-semibold leading-4 text-white/85">
                Completion, no-show and schedule status come only from actual
                appointment fields.
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className="rounded-[1.45rem] border-[3px] border-[#234E78] bg-[#FFF8EE] p-3">
        <div className="grid gap-3 xl:grid-cols-[auto_minmax(260px,1fr)]">
          <div className="flex max-w-full gap-2 overflow-x-auto pb-1 xl:pb-0">
            {filters.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setFilter(item)}
                className={`min-h-12 shrink-0 rounded-xl border-2 px-4 text-[10px] font-black uppercase tracking-[0.06em] transition ${
                  filter === item
                    ? "border-[#123865] bg-[#123865] text-white"
                    : "border-slate-300 bg-white text-[#10233F] hover:border-orange-400 hover:bg-orange-50"
                }`}
              >
                {item}
              </button>
            ))}
          </div>

          <div className="relative">
            <Search
              size={17}
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
            />

            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search student, country, consultation type, status..."
              aria-label="Search Meeting Center"
              className="min-h-12 w-full rounded-xl border-2 border-slate-300 bg-white py-2.5 pl-11 pr-11 text-sm font-semibold text-[#10233F] outline-none transition placeholder:text-slate-400 focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
            />

            {search ? (
              <button
                type="button"
                onClick={() => setSearch("")}
                aria-label="Clear meeting search"
                className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-[#123865]"
              >
                <X size={16} />
              </button>
            ) : null}
          </div>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          icon={CalendarDays}
          label="This Week"
          value={stats.thisWeek}
          detail="Appointments scheduled within the current calendar week."
          tone="blue"
        />
        <MetricCard
          icon={CheckCircle2}
          label="Completed"
          value={stats.completed}
          detail="Appointments whose real status is completed/done/resolved."
          tone="green"
        />
        <MetricCard
          icon={AlertTriangle}
          label="No Show"
          value={stats.noShow}
          detail="Only appointments explicitly marked missed/no-show."
          tone="red"
        />
        <MetricCard
          icon={Clock3}
          label="Overdue Open"
          value={stats.overdueOpen}
          detail="Open appointments whose scheduled date is already past."
          tone="orange"
        />
      </div>

      <section className="overflow-hidden rounded-[1.65rem] border-[3px] border-[#234E78] bg-[#FFFDF8]">
        <SectionHeader
          eyebrow="Live Schedule"
          title="Appointment Queue"
          description="Real appointment records currently available to Communication OS."
          icon={CalendarDays}
          count={visibleAppointments.length}
        />

        <div className="p-4 sm:p-5">
          {!safeAppointments.length ? (
            <EmptyState
              title="No appointments are available"
              text="Meeting Center will populate automatically from the appointments table."
            />
          ) : visibleAppointments.length ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[980px] border-separate border-spacing-0 text-left text-sm">
                <thead>
                  <tr>
                    {[
                      "Student",
                      "Date",
                      "Time",
                      "Consultation",
                      "Country",
                      "Status",
                      "Priority",
                      "Action",
                    ].map((heading) => (
                      <th
                        key={heading}
                        className="border-b-2 border-slate-300 bg-[#F7F1E8] px-3 py-3 text-[9px] font-black uppercase tracking-[0.08em] text-slate-600"
                      >
                        {heading}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {visibleAppointments.map((appointment, index) => (
                    <AppointmentRow
                      key={appointment.id || `${getName(appointment)}-${index}`}
                      appointment={appointment}
                      canOpen={canOpen}
                      onOpen={() => {
                        if (typeof onOpenMeeting === "function") {
                          onOpenMeeting(appointment);
                        } else {
                          onOpenRecord?.(appointment);
                        }
                      }}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState
              title="No appointments match these filters"
              text="Clear the search or choose another meeting filter."
              onClear={() => {
                setSearch("");
                setFilter("All");
              }}
            />
          )}
        </div>
      </section>

      <div className="grid gap-4 xl:grid-cols-[1fr_1fr]">
        <section className="overflow-hidden rounded-[1.65rem] border-[3px] border-orange-400 bg-[#FFF8EE]">
          <SectionHeader
            eyebrow="Workflow Layer"
            title="Connected Meeting Workflows"
            description="Reusable workflows only appear when a real meeting workflow source supplies them."
            icon={FileText}
            count={connectedWorkflows.length}
          />

          <div className="p-4">
            {connectedWorkflows.length ? (
              <div className="space-y-3">
                {connectedWorkflows.map((item, index) => (
                  <WorkflowCard
                    key={item.id || item.name || index}
                    item={item}
                  />
                ))}
              </div>
            ) : (
              <EmptyState
                title="No meeting workflows connected"
                text="The old fake Initial Counseling, Application Review and Visa Mock Interview workflow cards are removed."
              />
            )}
          </div>
        </section>

        <section className="overflow-hidden rounded-[1.65rem] border-[3px] border-[#234E78] bg-[#FFFDF8]">
          <SectionHeader
            eyebrow="Meeting Governance"
            title="What This Center Can Verify"
            description="Clear separation between observed appointment data and unavailable communication telemetry."
            icon={ShieldCheck}
            count={4}
          />

          <div className="grid gap-3 p-4">
            <GovernanceRow
              icon={CheckCircle2}
              title="Appointment volume"
              text="Verified from actual appointment records."
              tone="green"
            />
            <GovernanceRow
              icon={CalendarDays}
              title="Today / this week"
              text="Calculated from scheduled appointment dates."
              tone="blue"
            />
            <GovernanceRow
              icon={AlertTriangle}
              title="No-show"
              text="Only counted when the appointment status explicitly says missed/no-show."
              tone="orange"
            />
            <GovernanceRow
              icon={Info}
              title="Meeting success rate"
              text="Unavailable until real outcome telemetry exists."
              tone="navy"
            />
          </div>
        </section>
      </div>
    </section>
  );
}

function AppointmentRow({ appointment, canOpen, onOpen }) {
  const tone = statusTone(appointment);

  return (
    <tr>
      <td className="border-b border-slate-200 px-3 py-3">
        <div>
          <p className="font-black text-[#10233F]">
            {getName(appointment)}
          </p>
          <p className="mt-0.5 text-[10px] font-semibold text-slate-500">
            {appointment.email || appointment.phone || "No contact shown"}
          </p>
        </div>
      </td>

      <td className="border-b border-slate-200 px-3 py-3 font-semibold text-[#10233F]">
        {formatDate(getDateValue(appointment))}
      </td>

      <td className="border-b border-slate-200 px-3 py-3 font-semibold text-[#10233F]">
        {formatTime(appointment)}
      </td>

      <td className="border-b border-slate-200 px-3 py-3 font-semibold text-[#10233F]">
        {appointment.consultation_type || "—"}
      </td>

      <td className="border-b border-slate-200 px-3 py-3 font-semibold text-[#10233F]">
        {appointment.country_interest || "—"}
      </td>

      <td className="border-b border-slate-200 px-3 py-3">
        <StatusBadge
          tone={tone}
          label={
            appointment.status ||
            appointment.appointment_stage ||
            "Status unavailable"
          }
        />
      </td>

      <td className="border-b border-slate-200 px-3 py-3">
        {appointment.priority ? (
          <StatusBadge
            tone={
              ["critical", "urgent"].includes(getPriority(appointment))
                ? "red"
                : getPriority(appointment) === "high"
                  ? "orange"
                  : "navy"
            }
            label={appointment.priority}
          />
        ) : (
          <span className="text-xs font-semibold text-slate-400">—</span>
        )}
      </td>

      <td className="border-b border-slate-200 px-3 py-3">
        {canOpen ? (
          <button
            type="button"
            onClick={onOpen}
            className="rounded-lg border-2 border-[#234E78] bg-white px-3 py-2 text-[9px] font-black uppercase tracking-[0.07em] text-[#123865] transition hover:bg-[#123865] hover:text-white"
          >
            Open
          </button>
        ) : (
          <span className="text-[9px] font-black uppercase tracking-[0.07em] text-slate-400">
            Read only
          </span>
        )}
      </td>
    </tr>
  );
}

function WorkflowCard({ item }) {
  return (
    <article className="rounded-xl border-2 border-orange-300 bg-white p-4">
      <p className="font-black text-[#10233F]">
        {item.name || item.title || "Meeting workflow"}
      </p>

      <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">
        {item.description || item.detail || "No workflow detail supplied."}
      </p>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {item.owner ? <MetaChip label={`Owner: ${item.owner}`} /> : null}
        {item.status ? <MetaChip label={`Status: ${item.status}`} /> : null}
        {item.sla ? <MetaChip label={`SLA: ${item.sla}`} /> : null}
        {item.source ? <MetaChip label={`Source: ${item.source}`} /> : null}
      </div>
    </article>
  );
}

function MetricCard({ icon: Icon, label, value, detail, tone }) {
  return (
    <article className={`rounded-[1.3rem] border-[3px] p-4 ${toneClass(tone)}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[9px] font-black uppercase tracking-[0.08em] text-slate-500">
            {label}
          </p>
          <p className="mt-2 text-2xl font-black text-[#10233F]">{value}</p>
        </div>

        <span className="flex h-10 w-10 items-center justify-center rounded-xl border-2 border-current/20 bg-white/70 text-[#123865]">
          <Icon size={17} />
        </span>
      </div>

      <p className="mt-2 text-[10px] font-semibold leading-4 text-slate-600">
        {detail}
      </p>
    </article>
  );
}

function GovernanceRow({ icon: Icon, title, text, tone }) {
  return (
    <div className={`rounded-xl border-2 p-3 ${toneClass(tone)}`}>
      <div className="flex items-start gap-3">
        <Icon size={16} className="mt-0.5 shrink-0 text-[#123865]" />
        <div>
          <p className="text-xs font-black text-[#10233F]">{title}</p>
          <p className="mt-1 text-[10px] font-semibold leading-4 text-slate-600">
            {text}
          </p>
        </div>
      </div>
    </div>
  );
}

function SectionHeader({
  eyebrow,
  title,
  description,
  icon: Icon,
  count,
}) {
  return (
    <div className="flex items-start justify-between gap-3 border-b-[3px] border-orange-400 bg-[#123865] px-4 py-4 text-white">
      <div>
        <p className="text-[9px] font-black uppercase tracking-[0.13em] text-orange-300">
          {eyebrow}
        </p>
        <h2 className="mt-1 text-lg font-black text-white">{title}</h2>
        <p className="mt-1 text-xs font-semibold leading-5 text-white/80">
          {description}
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <span className="rounded-lg border-2 border-white/20 bg-white/10 px-2.5 py-1 text-xs font-black text-white">
          {count}
        </span>
        <span className="flex h-10 w-10 items-center justify-center rounded-xl border-2 border-white/20 bg-white/10">
          <Icon size={17} />
        </span>
      </div>
    </div>
  );
}

function HeaderChip({ icon: Icon, label }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border-2 border-white/20 bg-white/10 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.09em] text-white">
      <Icon size={11} />
      {label}
    </span>
  );
}

function DarkMetric({ label, value }) {
  return (
    <div className="rounded-xl border-2 border-white/20 bg-white/10 p-3">
      <p className="text-[8px] font-black uppercase tracking-[0.08em] text-white/85">
        {label}
      </p>
      <p className="mt-1 text-xl font-black text-white">
        {Number(value || 0).toLocaleString("en-GB")}
      </p>
    </div>
  );
}

function CompactMetric({ label, value }) {
  return (
    <div className="rounded-xl border-2 border-slate-300 bg-white p-3">
      <p className="text-[9px] font-black uppercase tracking-[0.07em] text-slate-500">
        {label}
      </p>
      <p className="mt-1 text-xl font-black text-[#10233F]">
        {Number(value || 0).toLocaleString("en-GB")}
      </p>
    </div>
  );
}

function StatusBadge({ label, tone }) {
  const classes =
    tone === "red"
      ? "border-red-300 bg-red-50 text-red-800"
      : tone === "orange"
        ? "border-orange-300 bg-orange-50 text-orange-800"
        : tone === "green"
          ? "border-emerald-300 bg-emerald-50 text-emerald-800"
          : tone === "blue"
            ? "border-blue-300 bg-blue-50 text-blue-800"
            : "border-slate-300 bg-slate-50 text-slate-700";

  return (
    <span className={`inline-flex rounded-lg border-2 px-2.5 py-1 text-[8px] font-black uppercase ${classes}`}>
      {label}
    </span>
  );
}

function MetaChip({ label }) {
  return (
    <span className="rounded-md border border-slate-300 bg-slate-50 px-2 py-0.5 text-[8px] font-black text-slate-600">
      {label}
    </span>
  );
}

function EmptyState({ title, text, onClear }) {
  return (
    <div className="rounded-[1.25rem] border-2 border-dashed border-slate-300 bg-slate-50 p-6 text-center">
      <Info size={20} className="mx-auto text-orange-600" />
      <p className="mt-2 text-sm font-black text-[#10233F]">{title}</p>
      <p className="mx-auto mt-1 max-w-2xl text-xs font-semibold leading-5 text-slate-600">
        {text}
      </p>

      {onClear ? (
        <button
          type="button"
          onClick={onClear}
          className="mt-3 rounded-lg border-2 border-orange-400 bg-white px-3 py-2 text-[9px] font-black uppercase tracking-[0.07em] text-orange-800 transition hover:bg-orange-50"
        >
          Clear filters
        </button>
      ) : null}
    </div>
  );
}

function toneClass(tone) {
  if (tone === "red") return "border-red-400 bg-red-50";
  if (tone === "orange") return "border-orange-400 bg-orange-50";
  if (tone === "green") return "border-emerald-400 bg-emerald-50";
  if (tone === "blue") return "border-blue-400 bg-blue-50";
  return "border-[#234E78] bg-[#EEF4FA]";
}
