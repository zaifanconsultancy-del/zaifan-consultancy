// AuditCenter V4 PARTNER-OS ALIGNED — Zaifan Compliance OS
// Full replacement for:
// src/components/admin/compliance/AuditCenter.jsx
//
// Production principles:
// - no invented actor/action/status meaning
// - unknown fields stay unknown
// - real audit evidence is searchable/filterable
// - severity is evidence, not decoration
// - missing timestamps are shown honestly
// - unified Zaifan Compliance OS visual language

import React, { useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  Clock3,
  FileSearch,
  Info,
  Search,
  ShieldCheck,
  UserRound,
  X,
} from "lucide-react";

function normalize(value = "") {
  return String(value ?? "")
    .toLowerCase()
    .trim()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ");
}

function hasValue(value) {
  return value !== undefined && value !== null && String(value).trim() !== "";
}

function safeArray(value) {
  return Array.isArray(value) ? value.filter(Boolean) : [];
}

function formatDate(value) {
  if (!value) return "Timestamp unavailable";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Timestamp unavailable";

  try {
    return new Intl.DateTimeFormat("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  } catch {
    return "Timestamp unavailable";
  }
}

function severityTone(value = "") {
  const clean = normalize(value);

  if (clean.includes("critical")) {
    return "border-red-300 bg-red-50 text-red-800";
  }

  if (clean.includes("high")) {
    return "border-[#F97316] bg-[#FFF4EA] text-[#B84F0E]";
  }

  if (clean.includes("medium")) {
    return "border-amber-300 bg-amber-50 text-amber-800";
  }

  if (clean.includes("low")) {
    return "border-[#60A5FA] bg-[#F2F7FF] text-blue-700";
  }

  return "border-[#C9D7E6] bg-[#F7FAFC] text-slate-700";
}

function statusTone(value = "") {
  const clean = normalize(value);

  if (
    clean.includes("completed") ||
    clean.includes("resolved") ||
    clean.includes("closed") ||
    clean.includes("approved")
  ) {
    return "border-[#34D399] bg-[#F0FFF8] text-emerald-700";
  }

  if (
    clean.includes("failed") ||
    clean.includes("blocked") ||
    clean.includes("denied")
  ) {
    return "border-red-300 bg-red-50 text-red-800";
  }

  if (
    clean.includes("pending") ||
    clean.includes("review") ||
    clean.includes("open")
  ) {
    return "border-[#F97316] bg-[#FFF4EA] text-[#B84F0E]";
  }

  return "border-[#C9D7E6] bg-[#F7FAFC] text-slate-700";
}

export default function AuditCenter({ compliance = {} }) {
  const [query, setQuery] = useState("");
  const [severity, setSeverity] = useState("all");

  const rows = useMemo(
    () => safeArray(compliance.auditRows),
    [compliance.auditRows]
  );

  const filtered = useMemo(() => {
    const search = normalize(query);

    return rows.filter((item) => {
      const severityMatches =
        severity === "all" ||
        normalize(item.severity).includes(severity);

      if (!severityMatches) return false;

      const haystack = normalize(
        [
          item.actor,
          item.action,
          item.category,
          item.status,
          item.description,
          item.severity,
          item.source,
          item.createdAt,
        ]
          .filter(hasValue)
          .join(" ")
      );

      return !search || haystack.includes(search);
    });
  }, [rows, query, severity]);

  const counts = useMemo(() => {
    const critical = rows.filter((item) =>
      normalize(item.severity).includes("critical")
    ).length;

    const high = rows.filter((item) =>
      normalize(item.severity).includes("high")
    ).length;

    const unknownActor = rows.filter((item) =>
      normalize(item.actor).includes("unknown")
    ).length;

    const missingTimestamp = rows.filter((item) => !item.createdAt).length;

    return {
      total: rows.length,
      critical,
      high,
      unknownActor,
      missingTimestamp,
    };
  }, [rows]);

  return (
    <section className="space-y-4">
      <header className="overflow-hidden rounded-[1.9rem] border-[3px] border-[#F97316] bg-[#FFFDF8] shadow-[0_14px_38px_rgba(15,35,63,0.07)]">
        <div className="grid xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)]">
          <div className="bg-[#123865] p-5 text-white sm:p-6">
            <div className="flex flex-wrap items-center gap-2">
              <HeaderChip icon={Activity} label="Audit Center" />
              <HeaderChip icon={ShieldCheck} label="Evidence Trail" />
            </div>

            <h1 className="mt-4 text-2xl font-black tracking-[-0.025em] text-white sm:text-3xl">
              Activity & Audit Trail
            </h1>

            <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-white/90">
              Review real system and user events as compliance evidence.
              Unknown actors, missing timestamps and unclassified events remain
              visible instead of being silently converted into trusted records.
            </p>

            <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
              <DarkMetric label="Events" value={counts.total} />
              <DarkMetric label="Critical" value={counts.critical} />
              <DarkMetric label="High" value={counts.high} />
              <DarkMetric label="Unknown Actor" value={counts.unknownActor} />
            </div>
          </div>

          <div className="border-t-[3px] border-[#F97316] bg-[#FF5A0A] p-5 text-white xl:border-l-[3px] xl:border-t-0 sm:p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[9px] font-black uppercase tracking-[0.12em] text-white">
                  Evidence quality
                </p>

                <p className="mt-2 text-4xl font-black text-white">
                  {counts.missingTimestamp}
                </p>

                <p className="mt-1 text-xs font-black uppercase tracking-[0.08em] text-white">
                  events missing timestamp
                </p>
              </div>

              <span className="flex h-12 w-12 items-center justify-center rounded-2xl border-2 border-white/30 bg-white/10">
                <FileSearch size={22} />
              </span>
            </div>

            <div className="mt-5 rounded-2xl border-2 border-white/25 bg-white/10 p-3">
              <p className="text-xs font-black text-white">
                Audit evidence is only as strong as its source fields.
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className="rounded-[1.45rem] border-[3px] border-[#C9D7E6] bg-[#FFFDF8] p-3 shadow-[0_8px_22px_rgba(15,35,63,0.045)]">
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_220px]">
          <div className="relative">
            <Search
              size={17}
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
            />

            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search actor, action, category, status, source..."
              aria-label="Search audit logs"
              className="min-h-12 w-full rounded-xl border-2 border-[#C9D7E6] bg-[#FFFDF8] py-2.5 pl-11 pr-11 text-sm font-semibold text-[#10233F] outline-none transition placeholder:text-slate-400 focus:border-[#F97316] focus:ring-4 focus:ring-orange-100"
            />

            {query ? (
              <button
                type="button"
                onClick={() => setQuery("")}
                aria-label="Clear audit search"
                className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-[#123865]"
              >
                <X size={16} />
              </button>
            ) : null}
          </div>

          <select
            value={severity}
            onChange={(event) => setSeverity(event.target.value)}
            aria-label="Filter audit logs by severity"
            className="min-h-12 rounded-xl border-2 border-[#C9D7E6] bg-white px-4 text-sm font-black text-[#10233F] outline-none transition focus:border-[#F97316] focus:ring-4 focus:ring-orange-100"
          >
            <option value="all">All severity</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
            <option value="unknown">Unknown</option>
          </select>
        </div>
      </div>

      <section className="overflow-hidden rounded-[1.65rem] border-[3px] border-[#C9D7E6] bg-[#FFFDF8]">
        <SectionHeader
          eyebrow="Audit Evidence"
          title="Recorded Events"
          description="Searchable compliance evidence from the connected activity/audit source."
          icon={Activity}
          count={`${filtered.length}/${rows.length}`}
        />

        <div className="p-4 sm:p-5">
          {!rows.length ? (
            <EmptyState
              title="No audit evidence connected"
              text="Audit Center will populate when real activity or audit logs are supplied to Compliance OS."
            />
          ) : filtered.length ? (
            <div className="space-y-3">
              {filtered.map((item) => (
                <AuditRow key={item.id} item={item} />
              ))}
            </div>
          ) : (
            <EmptyState
              title="No audit events match these filters"
              text="Clear the search or choose another severity."
              onClear={() => {
                setQuery("");
                setSeverity("all");
              }}
            />
          )}
        </div>
      </section>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <EvidenceMetric
          icon={Activity}
          label="Total Evidence"
          value={counts.total}
          detail="Events currently present in the audit source."
          tone="blue"
        />
        <EvidenceMetric
          icon={AlertTriangle}
          label="Critical + High"
          value={counts.critical + counts.high}
          detail="Events carrying explicit high or critical severity."
          tone="red"
        />
        <EvidenceMetric
          icon={UserRound}
          label="Unknown Actor"
          value={counts.unknownActor}
          detail="Events where actor identity was not supplied."
          tone="orange"
        />
        <EvidenceMetric
          icon={Clock3}
          label="Missing Timestamp"
          value={counts.missingTimestamp}
          detail="Events without usable date/time evidence."
          tone="navy"
        />
      </div>
    </section>
  );
}

function AuditRow({ item }) {
  return (
    <article className="rounded-[1.25rem] border-2 border-[#C9D7E6] bg-white p-4">
      <div className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1fr)_220px_140px] xl:items-center">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-black text-[#10233F]">
              {item.action || "Unclassified event"}
            </p>

            <span className={`rounded-lg border-2 px-2.5 py-1 text-[8px] font-black uppercase ${severityTone(item.severity)}`}>
              {item.severity || "Unknown"}
            </span>
          </div>

          <p className="mt-1 text-xs font-semibold text-slate-600">
            {item.actor || "Unknown actor"} · {item.category || "Unclassified"}
          </p>

          <p className="mt-2 text-xs font-semibold leading-5 text-slate-600">
            {item.description || "No event detail supplied."}
          </p>

          {item.source ? (
            <span className="mt-3 inline-flex rounded-md border border-[#C9D7E6] bg-[#F7FAFC] px-2 py-0.5 text-[8px] font-black uppercase tracking-[0.06em] text-slate-600">
              Source: {item.source}
            </span>
          ) : null}
        </div>

        <div className="min-w-0 xl:w-[220px]">
          <p className="whitespace-nowrap text-xs font-black tabular-nums text-[#10233F]">
            {formatDate(item.createdAt)}
          </p>
          <p className="mt-1 text-[10px] font-semibold text-slate-500">
            Recorded timestamp
          </p>
        </div>

        <div className="flex xl:w-[140px] xl:justify-end">
          <span className={`w-fit max-w-full rounded-lg border-2 px-2.5 py-1 text-[8px] font-black uppercase ${statusTone(item.status)}`}>
            {item.status || "Unknown"}
          </span>
        </div>
      </div>
    </article>
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

function SectionHeader({
  eyebrow,
  title,
  description,
  icon: Icon,
  count,
}) {
  return (
    <div className="flex items-start justify-between gap-3 border-b-[3px] border-[#F97316] bg-[#123865] px-4 py-4 text-white">
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

function EvidenceMetric({ icon: Icon, label, value, detail, tone }) {
  return (
    <article className={`rounded-[1.3rem] border-[3px] p-4 ${toneClass(tone)}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[9px] font-black uppercase tracking-[0.08em] text-slate-500">
            {label}
          </p>
          <p className="mt-2 text-2xl font-black text-[#10233F]">
            {Number(value || 0).toLocaleString("en-GB")}
          </p>
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

function EmptyState({ title, text, onClear }) {
  return (
    <div className="rounded-[1.25rem] border-2 border-dashed border-[#C9D7E6] bg-[#F7FAFC] p-6 text-center">
      <Info size={20} className="mx-auto text-orange-600" />
      <p className="mt-2 text-sm font-black text-[#10233F]">{title}</p>
      <p className="mx-auto mt-1 max-w-2xl text-xs font-semibold leading-5 text-slate-600">
        {text}
      </p>

      {onClear ? (
        <button
          type="button"
          onClick={onClear}
          className="mt-3 rounded-lg border-2 border-[#F97316] bg-white px-3 py-2 text-[9px] font-black uppercase tracking-[0.07em] text-[#B84F0E] transition hover:bg-[#FFF4EA]"
        >
          Clear filters
        </button>
      ) : null}
    </div>
  );
}

function toneClass(tone) {
  if (tone === "red") return "border-red-400 bg-red-50";
  if (tone === "orange") return "border-[#F97316] bg-[#FFF4EA]";
  if (tone === "blue") return "border-blue-400 bg-blue-50";
  return "border-[#234E78] bg-[#F2F7FF]";
}
