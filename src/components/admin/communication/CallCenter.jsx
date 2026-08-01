// CallCenter V4 PARTNER-OS STANDARD
// Full replacement for: src/components/admin/communication/CallCenter.jsx

import React, { useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  Database,
  Phone,
  PhoneCall,
  Search,
  ShieldCheck,
  UserRound,
  Users,
  X,
} from "lucide-react";


function safeArray(value) {
  return Array.isArray(value) ? value.filter(Boolean) : [];
}

function normalize(value = "") {
  return String(value ?? "")
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
    "Unnamed record"
  );
}

function getEmail(record = {}) {
  return String(record.email || record.student_email || "").trim();
}

function getPhone(record = {}) {
  return String(
    record.phone ||
      record.phone_number ||
      record.mobile ||
      record.whatsapp ||
      record.whatsapp_number ||
      ""
  ).trim();
}

function getStatus(record = {}) {
  return String(
    record.status ||
      record.stage ||
      record.application_status ||
      record.appointment_status ||
      record.appointment_stage ||
      "Open"
  ).trim();
}

function getPriority(record = {}) {
  return String(record.priority || record.lead_priority || "Normal").trim();
}

function getOwner(record = {}) {
  return (
    record.owner ||
    record.assigned_to ||
    record.assigned_to_name ||
    record.counselor_name ||
    record.assigned_counselor ||
    "Unassigned"
  );
}

function getDate(record = {}) {
  return (
    record.appointment_date ||
    record.updated_at ||
    record.created_at ||
    record.follow_up_date ||
    record.due_date ||
    null
  );
}

function isClosed(record = {}) {
  return [
    "closed",
    "completed",
    "resolved",
    "cancelled",
    "canceled",
    "rejected",
    "archived",
    "done",
  ].includes(normalize(getStatus(record)));
}

function isPriority(record = {}) {
  return ["vip", "high", "urgent", "critical"].includes(
    normalize(getPriority(record))
  );
}

function isDueReminder(record = {}) {
  return !["done", "completed", "cancelled", "canceled"].includes(
    normalize(record.status)
  );
}

function formatDate(value) {
  if (!value) return "Not recorded";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not recorded";

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function statusTone(status = "") {
  const value = normalize(status);

  if (
    ["completed", "resolved", "closed", "sent", "delivered", "confirmed"].some(
      (token) => value.includes(token)
    )
  ) {
    return "border-[#34D399] bg-[#F0FFF8] text-emerald-700";
  }

  if (
    ["cancelled", "canceled", "rejected", "failed", "blocked", "overdue"].some(
      (token) => value.includes(token)
    )
  ) {
    return "border-[#FB7185] bg-[#FFF4F4] text-red-700";
  }

  if (
    ["pending", "open", "scheduled", "queued", "review"].some((token) =>
      value.includes(token)
    )
  ) {
    return "border-[#F59E0B] bg-[#FFF8E8] text-amber-800";
  }

  return "border-[#60A5FA] bg-[#F2F7FF] text-blue-700";
}

function priorityTone(priority = "") {
  return ["vip", "high", "urgent", "critical"].includes(normalize(priority))
    ? "border-[#FB7185] bg-[#FFF4F4] text-red-700"
    : "border-[#C9D7E6] bg-[#FFF8EF] text-slate-600";
}

function MetricCard({
  label,
  value,
  helper,
  tone = "blue",
  icon: Icon,
  badge = "",
}) {
  const tones = {
    navy: "border-[#123865] bg-[#123865]",
    blue: "border-[#60A5FA] bg-[#F2F7FF]",
    green: "border-[#34D399] bg-[#F0FFF8]",
    amber: "border-[#F59E0B] bg-[#FFF8E8]",
    red: "border-[#FB7185] bg-[#FFF4F4]",
    orange: "border-[#F97316] bg-[#FFF4EA]",
  };

  const dark = tone === "navy";

  return (
    <article
      className={`rounded-[1.4rem] border-[3px] p-4 shadow-[0_7px_20px_rgba(15,35,63,0.05)] ${
        tones[tone] || tones.blue
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p
            className={`text-[9px] font-black uppercase tracking-[0.11em] ${
              dark ? "text-orange-300" : "text-slate-500"
            }`}
          >
            {label}
          </p>

          <p
            className={`mt-2 break-words text-2xl font-black ${
              dark ? "text-white" : "text-[#10233F]"
            }`}
          >
            {value}
          </p>
        </div>

        <div
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border-2 ${
            dark
              ? "border-white/20 bg-white/10 text-orange-200"
              : "border-[#123865]/15 bg-white text-[#123865]"
          }`}
        >
          <Icon size={16} />
        </div>
      </div>

      <p
        className={`mt-2 text-xs font-semibold leading-5 ${
          dark ? "text-slate-200" : "text-slate-600"
        }`}
      >
        {helper}
      </p>

      {badge ? (
        <span
          className={`mt-3 inline-flex rounded-full border-2 px-2.5 py-1 text-[8px] font-black uppercase tracking-[0.08em] ${
            dark
              ? "border-white/20 bg-white/10 text-white"
              : "border-[#C9D7E6] bg-white text-slate-600"
          }`}
        >
          {badge}
        </span>
      ) : null}
    </article>
  );
}

function IntegrityCard({ icon: Icon, eyebrow, title, helper, tone = "blue" }) {
  const tones = {
    green: "border-[#34D399] bg-[#F0FFF8]",
    blue: "border-[#60A5FA] bg-[#F2F7FF]",
    amber: "border-[#F59E0B] bg-[#FFF8E8]",
  };

  return (
    <div className={`rounded-[1.35rem] border-[3px] p-4 ${tones[tone]}`}>
      <div className="flex items-start gap-3">
        <Icon size={17} className="mt-0.5 shrink-0 text-[#123865]" />
        <div>
          <p className="text-[8px] font-black uppercase tracking-[0.11em] text-slate-500">
            {eyebrow}
          </p>
          <p className="mt-1 font-black text-[#10233F]">{title}</p>
          <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">
            {helper}
          </p>
        </div>
      </div>
    </div>
  );
}

function Shell({
  icon: Icon,
  osLabel,
  title,
  description,
  workspace,
  adminProfile,
  recordsCount,
  secondaryCount,
  children,
}) {
  return (
    <div className="min-w-0 space-y-5 rounded-[2.2rem] border-[4px] border-[#123865] bg-[#FFF8EF] p-3 text-[#10233F] shadow-[0_24px_65px_rgba(18,56,101,0.15)] sm:p-4 lg:p-5">
      <header className="overflow-hidden rounded-[1.75rem] border-[3px] border-[#F97316]">
        <div className="grid xl:grid-cols-[minmax(0,1.25fr)_minmax(18rem,0.75fr)]">
          <div className="bg-[#123865] p-5 text-white sm:p-6">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-2 rounded-full border-2 border-orange-300/30 bg-orange-400/10 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.12em] text-orange-300">
                <Icon size={12} />
                {osLabel}
              </span>

              <span className="rounded-full border-2 border-white/15 bg-white/5 px-3 py-1 text-[8px] font-black uppercase tracking-[0.08em] text-white">
                Communication operations
              </span>

              <span className="rounded-full border-2 border-white/15 bg-white/5 px-3 py-1 text-[8px] font-black uppercase tracking-[0.08em] text-white">
                Evidence first
              </span>
            </div>

            <h1 className="mt-3 text-3xl font-black text-white">{title}</h1>

            <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-200">
              {description}
            </p>
          </div>

          <div className="bg-[#FF5A0A] p-5 text-white sm:p-6">
            <p className="text-[9px] font-black uppercase tracking-[0.12em]">
              Current Workspace
            </p>

            <p className="mt-2 text-2xl font-black">{workspace}</p>

            <p className="mt-2 text-xs font-semibold leading-5 text-orange-50">
              {adminProfile?.email
                ? `Admin communication view for ${adminProfile.email}`
                : "Admin communication operations workspace"}
            </p>

            <div className="mt-4 flex flex-wrap gap-2">
              <span className="rounded-full border-2 border-white/25 bg-white/10 px-3 py-1 text-[8px] font-black uppercase tracking-[0.08em]">
                {recordsCount} records
              </span>
              <span className="rounded-full border-2 border-white/25 bg-white/10 px-3 py-1 text-[8px] font-black uppercase tracking-[0.08em]">
                {secondaryCount}
              </span>
            </div>
          </div>
        </div>
      </header>

      {children}
    </div>
  );
}


export default function CallCenter({
  compact = false,
  adminProfile = null,
  inquiries = [],
  appointments = [],
  followUpReminders = [],
  communicationData = {},
  onOpenRecord,
  onOpenCall,
}) {
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");

  const records = useMemo(
    () => safeArray(inquiries).filter((record) => Boolean(getPhone(record))),
    [inquiries]
  );

  const reminders = useMemo(
    () => safeArray(followUpReminders),
    [followUpReminders]
  );

  const channelData = communicationData?.calls || {};
  const telemetryConnected = Boolean(
    channelData.metrics && Object.keys(channelData.metrics).length
  );

  const stats = useMemo(
    () => ({
      total: records.length,
      open: records.filter((record) => !isClosed(record)).length,
      priority: records.filter(isPriority).length,
      followUps: reminders.filter(isDueReminder).length,
    }),
    [records, reminders]
  );

  const visibleRecords = useMemo(() => {
    const needle = normalize(search);

    return records.filter((record) => {
      const matches =
        filter === "All" ||
        (filter === "Open" && !isClosed(record)) ||
        (filter === "Priority" && isPriority(record)) ||
        (filter === "Closed" && isClosed(record));

      if (!matches) return false;
      if (!needle) return true;

      return normalize(
        [
          getName(record),
          getPhone(record),
          getStatus(record),
          getPriority(record),
          getOwner(record),
          record.country_interest,
        ]
          .filter(Boolean)
          .join(" ")
      ).includes(needle);
    });
  }, [records, filter, search]);

  function handlePrimary(record) {
    if (typeof onOpenCall === "function") {
      onOpenCall(record);
      return;
    }

    
  }

  const primaryEnabled =
    typeof onOpenCall === "function" || false;

  if (compact) {
    return (
      <MetricCard
        label="Phone Ready"
        value={stats.total}
        helper="Real contact-ready CRM records."
        tone="navy"
        icon={Phone}
      />
    );
  }

  return (
    <Shell
      icon={Phone}
      osLabel="Call OS"
      title="Call & Callback Command"
      description="Operate a real callback queue from phone-ready CRM records. Duration, answer-rate and recovery analytics remain unavailable until genuine call telemetry exists."
      workspace="Call Operations"
      adminProfile={adminProfile}
      recordsCount={stats.total}
      secondaryCount={telemetryConnected ? "Telemetry connected" : "CRM-only mode"}
    >
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Phone Ready" value={stats.total} helper="Real CRM records with a usable contact value." tone="navy" icon={Phone} badge="Contactability" />
        <MetricCard label="Open Records" value={stats.open} helper="Contact-ready records not in a terminal state." tone="blue" icon={Users} badge="Queue" />
        <MetricCard label="Priority" value={stats.priority} helper="Explicit VIP, high, urgent or critical records." tone={stats.priority ? "red" : "green"} icon={AlertTriangle} badge="Pressure" />
        <MetricCard label="Follow-Ups" value={stats.followUps} helper="Reminders not completed or cancelled." tone={stats.followUps ? "amber" : "green"} icon={Clock3} badge="Actions" />
      </div>

      <section className="rounded-[1.5rem] border-[3px] border-[#C9D7E6] bg-white p-4 sm:p-5">
        <div className="mb-4 flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.11em] text-orange-700">Call Operations</p>
            <h2 className="mt-1 text-xl font-black text-[#10233F]">Contact action portfolio</h2>
            <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">One dominant operating workspace for real contact-ready CRM records.</p>
          </div>

          <div className="grid gap-2 sm:grid-cols-[auto_minmax(14rem,1fr)_auto]">
            <select value={filter} onChange={(event) => setFilter(event.target.value)} className="min-h-10 rounded-xl border-2 border-[#C9D7E6] bg-[#FFF8EF] px-3 text-xs font-black text-[#10233F]">
              <option>All</option>
              <option>Open</option>
              <option>Priority</option>
              <option>Closed</option>
            </select>

            <label className="relative block">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search records..." className="min-h-10 w-full rounded-xl border-2 border-[#C9D7E6] bg-[#FFF8EF] pl-9 pr-3 text-xs font-semibold text-[#10233F]" />
            </label>

            <button type="button" onClick={() => { setFilter("All"); setSearch(""); }} disabled={filter === "All" && !search} className="inline-flex min-h-10 items-center gap-2 rounded-xl border-2 border-[#C9D7E6] bg-white px-3 text-xs font-black disabled:opacity-40">
              <X size={13} />
              Clear
            </button>
          </div>
        </div>

        <div className="space-y-2.5">
          {visibleRecords.length ? (
            visibleRecords.map((record, index) => (
              <article key={record.id || `${getName(record)}-${index}`} className="rounded-[1.3rem] border-2 border-[#C9D7E6] bg-white p-4 shadow-[0_6px_18px_rgba(15,35,63,0.04)] transition hover:border-[#F97316]">
                <div className="grid gap-4 xl:grid-cols-[minmax(18rem,1.4fr)_minmax(10rem,0.8fr)_minmax(8rem,0.6fr)_minmax(10rem,0.75fr)_minmax(10rem,0.8fr)] xl:items-center">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-black text-[#10233F]">{getName(record)}</p>
                      <span className={`rounded-full border-2 px-2.5 py-1 text-[8px] font-black uppercase ${statusTone(getStatus(record))}`}>{getStatus(record)}</span>
                    </div>
                    <p className="mt-1 truncate text-[11px] font-semibold text-slate-500">Phone: {getPhone(record)}</p>
                  </div>

                  <div className="rounded-xl border border-[#E1E8F0] bg-[#FFF8EF] px-3 py-2.5"><p className="text-[7px] font-black uppercase text-slate-500">Destination</p><p className="mt-1 truncate text-xs font-black text-[#10233F]">{record.country_interest || "Not recorded"}</p></div>
                  <div><p className="text-[7px] font-black uppercase text-slate-500">Priority</p><span className={`mt-1 inline-flex rounded-full border-2 px-2.5 py-1 text-[8px] font-black uppercase ${priorityTone(getPriority(record))}`}>{getPriority(record)}</span></div>
                  <div className="rounded-xl border border-[#E1E8F0] bg-[#FFF8EF] px-3 py-2.5"><p className="text-[7px] font-black uppercase text-slate-500">Updated</p><p className="mt-1 text-xs font-black text-[#10233F]">{formatDate(getDate(record))}</p></div>
                  <div className="rounded-xl border border-[#E1E8F0] bg-[#FFF8EF] px-3 py-2.5"><p className="text-[7px] font-black uppercase text-slate-500">Owner</p><p className="mt-1 truncate text-xs font-black text-[#10233F]">{getOwner(record)}</p></div>

                  <div className="col-span-full flex flex-wrap items-center justify-end gap-2 border-t-2 border-[#E7EDF4] pt-3">
                    {typeof onOpenRecord === "function" ? (
                      <button type="button" onClick={() => onOpenRecord(record)} className="inline-flex min-h-9 items-center gap-2 rounded-xl border-2 border-[#C9D7E6] bg-white px-3 text-[10px] font-black text-[#10233F]"><UserRound size={13} /> Record</button>
                    ) : null}

                    <button type="button" onClick={() => handlePrimary(record)} disabled={!primaryEnabled} className="inline-flex min-h-9 items-center gap-2 rounded-xl border-2 border-[#123865] bg-[#123865] px-3 text-[10px] font-black text-white disabled:opacity-40"><PhoneCall size={13} /> Start Call</button>
                  </div>
                </div>
              </article>
            ))
          ) : (
            <div className="rounded-[1.4rem] border-[3px] border-dashed border-[#C9D7E6] bg-[#FFF8EF] p-8 text-center">
              <Phone size={24} className="mx-auto text-orange-700" />
              <p className="mt-3 font-black text-[#10233F]">{records.length ? "No records match these filters." : "No real contact-ready records yet."}</p>
            </div>
          )}
        </div>
      </section>

      <div className="grid gap-3 lg:grid-cols-3">
        <IntegrityCard icon={ShieldCheck} eyebrow="Workspace Integrity" title="No fabricated channel activity" helper="Only real CRM records and explicitly supplied telemetry appear." tone="green" />
        <IntegrityCard icon={Database} eyebrow="Telemetry Boundary" title={telemetryConnected ? "Telemetry connected" : "CRM-only mode"} helper="Performance metrics remain absent until a genuine integration supplies them." tone="blue" />
        <IntegrityCard icon={CheckCircle2} eyebrow="Action Boundary" title={primaryEnabled ? "Primary action available" : "Handler not connected"} helper="Actions remain disabled when no genuine parent handler exists." tone={primaryEnabled ? "green" : "amber"} />
      </div>
    </Shell>
  );
}
