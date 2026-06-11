import React, { useMemo, useState } from "react";
import { buildCounselorApplicationQueue, formatRelativeTime } from "../../lib/counselorPortal";

const FILTERS = [
  { key: "all", label: "All" },
  { key: "blocked", label: "Blocked" },
  { key: "offer", label: "Offer" },
  { key: "cas", label: "CAS" },
  { key: "submitted", label: "Submitted" },
  { key: "review", label: "Review" },
];

const SORTS = [
  { key: "priority", label: "Priority" },
  { key: "updated", label: "Updated" },
  { key: "student", label: "Student" },
  { key: "university", label: "University" },
];

function safeString(value, fallback = "") {
  if (value === null || value === undefined) return fallback;
  return String(value);
}

function lower(value) {
  return safeString(value).toLowerCase();
}

function isBlocked(item = {}) {
  return Number(item.priorityScore || 0) >= 70 || lower(`${item.status} ${item.offerStatus} ${item.casStatus} ${item.nextAction}`).includes("blocked");
}

function statusTone(status = "") {
  const value = lower(status);

  if (value.includes("reject") || value.includes("fail") || value.includes("block")) {
    return "border-rose-400/25 bg-rose-400/10 text-rose-100";
  }

  if (value.includes("offer")) return "border-emerald-400/25 bg-emerald-400/10 text-emerald-100";
  if (value.includes("submitted") || value.includes("applied")) return "border-cyan-400/25 bg-cyan-400/10 text-cyan-100";
  if (value.includes("review") || value.includes("pending")) return "border-amber-400/25 bg-amber-400/10 text-amber-100";

  return "border-slate-400/20 bg-white/[0.04] text-slate-200";
}

function casTone(casStatus = "") {
  const value = lower(casStatus);

  if (value.includes("issued")) return "border-emerald-400/25 bg-emerald-400/10 text-emerald-100";
  if (value.includes("pending") || value.includes("requested") || value.includes("processing")) {
    return "border-amber-400/25 bg-amber-400/10 text-amber-100";
  }

  return "border-violet-400/25 bg-violet-400/10 text-violet-100";
}

function ApplicationStat({ label, value, helper, tone = "slate" }) {
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

function PriorityMeter({ value }) {
  const score = Math.max(0, Math.min(100, Number(value) || 0));

  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs">
        <span className="font-bold text-slate-400">Priority pressure</span>
        <span className="text-slate-300">{score}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-white/10">
        <div className="h-full rounded-full bg-amber-300" style={{ width: `${score}%` }} />
      </div>
    </div>
  );
}

function ApplicationCard({ item }) {
  const blocked = isBlocked(item);

  return (
    <article
      className={`rounded-3xl border p-4 transition hover:border-cyan-400/25 ${
        blocked ? "border-rose-400/25 bg-rose-500/10" : "border-white/10 bg-slate-950/50 hover:bg-slate-900/70"
      }`}
    >
      <div className="grid gap-4 lg:grid-cols-[1.05fr_0.75fr_1fr] lg:items-center">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-lg font-black">{item.studentName}</h3>
            {blocked ? (
              <span className="rounded-full border border-rose-400/25 bg-rose-400/10 px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.18em] text-rose-100">
                Blocked
              </span>
            ) : null}
          </div>

          <p className="mt-1 text-sm text-slate-400">
            {item.universityName} · {item.courseName}
          </p>

          <div className="mt-3 flex flex-wrap gap-2">
            <span className={`rounded-full border px-3 py-1 text-xs font-bold ${statusTone(item.status)}`}>
              {item.status}
            </span>

            <span className="rounded-full border border-emerald-400/25 bg-emerald-400/10 px-3 py-1 text-xs font-bold text-emerald-100">
              Offer {item.offerStatus}
            </span>

            <span className={`rounded-full border px-3 py-1 text-xs font-bold ${casTone(item.casStatus)}`}>
              CAS {item.casStatus}
            </span>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
          <PriorityMeter value={item.priorityScore} />
          <p className="mt-3 text-xs text-slate-500">Updated {formatRelativeTime(item.updatedAt)}</p>
        </div>

        <div>
          <p className="text-sm font-semibold text-slate-100">{item.nextAction}</p>
          <p className="mt-2 text-xs text-slate-500">
            Application queue is counselor-scoped from the assigned student snapshot and sorted by conversion pressure.
          </p>
        </div>
      </div>
    </article>
  );
}

export default function CounselorApplicationsWorkspace({ snapshot }) {
  const queue = useMemo(() => buildCounselorApplicationQueue(snapshot || {}), [snapshot]);

  const [filter, setFilter] = useState("all");
  const [sort, setSort] = useState("priority");
  const [query, setQuery] = useState("");

  const stats = useMemo(() => {
    const blocked = queue.filter((item) => isBlocked(item)).length;
    const offer = queue.filter((item) => lower(`${item.offerStatus} ${item.status}`).includes("offer")).length;
    const cas = queue.filter((item) => lower(item.casStatus).includes("issued") || lower(item.casStatus).includes("pending")).length;
    const submitted = queue.filter((item) => lower(item.status).includes("submitted") || lower(item.status).includes("applied")).length;
    const review = queue.filter((item) => lower(item.status).includes("review") || lower(item.status).includes("pending")).length;

    return {
      total: queue.length,
      blocked,
      offer,
      cas,
      submitted,
      review,
    };
  }, [queue]);

  const filtered = useMemo(() => {
    const search = query.trim().toLowerCase();

    let next = queue;

    if (filter === "blocked") next = next.filter((item) => isBlocked(item));
    if (filter === "offer") next = next.filter((item) => lower(`${item.offerStatus} ${item.status}`).includes("offer"));
    if (filter === "cas") {
      next = next.filter((item) => lower(item.casStatus).includes("issued") || lower(item.casStatus).includes("pending"));
    }
    if (filter === "submitted") {
      next = next.filter((item) => lower(item.status).includes("submitted") || lower(item.status).includes("applied"));
    }
    if (filter === "review") {
      next = next.filter((item) => lower(item.status).includes("review") || lower(item.status).includes("pending"));
    }

    if (search) {
      next = next.filter((item) =>
        [item.studentName, item.universityName, item.courseName, item.status, item.offerStatus, item.casStatus, item.nextAction]
          .map((value) => lower(value))
          .join(" ")
          .includes(search)
      );
    }

    return [...next].sort((a, b) => {
      if (sort === "updated") {
        return new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime();
      }

      if (sort === "student") return safeString(a.studentName).localeCompare(safeString(b.studentName));
      if (sort === "university") return safeString(a.universityName).localeCompare(safeString(b.universityName));

      return Number(b.priorityScore || 0) - Number(a.priorityScore || 0);
    });
  }, [queue, filter, query, sort]);

  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
      <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-cyan-300">Application OS</p>
          <h2 className="mt-2 text-2xl font-black">Assigned Application Queue</h2>
          <p className="mt-1 text-sm text-slate-400">
            Application movement, stalled files, offer readiness, CAS pressure, and counselor priority actions.
          </p>
        </div>

        <span className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-bold text-slate-200">
          {filtered.length}/{queue.length} records
        </span>
      </div>

      <div className="mb-5 grid gap-3 md:grid-cols-3 xl:grid-cols-6">
        <ApplicationStat label="Total" value={stats.total} helper="applications" tone="cyan" />
        <ApplicationStat label="Blocked" value={stats.blocked} helper="needs recovery" tone="rose" />
        <ApplicationStat label="Offers" value={stats.offer} helper="conversion stage" tone="emerald" />
        <ApplicationStat label="CAS" value={stats.cas} helper="CAS pressure" tone="violet" />
        <ApplicationStat label="Submitted" value={stats.submitted} helper="file sent" />
        <ApplicationStat label="Review" value={stats.review} helper="pending review" tone="amber" />
      </div>

      <div className="mb-5 grid gap-3 lg:grid-cols-[1fr_220px_220px]">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search student, university, course, offer, CAS, status..."
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

        <select
          value={sort}
          onChange={(event) => setSort(event.target.value)}
          className="rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm font-bold text-white outline-none focus:border-cyan-400/40"
        >
          {SORTS.map((item) => (
            <option key={item.key} value={item.key} className="bg-slate-950">
              Sort: {item.label}
            </option>
          ))}
        </select>
      </div>

      <div className="grid gap-3">
        {filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/15 p-6 text-center">
            <p className="text-sm font-bold text-white">No application records found.</p>
            <p className="mx-auto mt-2 max-w-2xl text-sm text-slate-400">
              Assigned applications will appear here once the counselor-scoped student snapshot includes application records.
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
          filtered.map((item) => <ApplicationCard key={item.id} item={item} />)
        )}
      </div>
    </div>
  );
}