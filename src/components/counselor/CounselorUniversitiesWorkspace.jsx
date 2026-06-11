import React, { useMemo, useState } from "react";
import { buildCounselorUniversityQueue } from "../../lib/counselorPortal";

const FILTERS = [
  { key: "all", label: "All" },
  { key: "dream", label: "Dream" },
  { key: "target", label: "Target" },
  { key: "safe", label: "Safe" },
  { key: "ready", label: "Ready" },
  { key: "incomplete", label: "Incomplete" },
];

const SORTS = [
  { key: "readiness", label: "Readiness" },
  { key: "student", label: "Student" },
  { key: "university", label: "University" },
  { key: "country", label: "Country" },
  { key: "category", label: "Category" },
];

function safeString(value, fallback = "") {
  if (value === null || value === undefined) return fallback;
  return String(value);
}

function lower(value) {
  return safeString(value).toLowerCase();
}

function categoryTone(category = "") {
  const value = lower(category);

  if (value.includes("dream")) return "border-violet-400/25 bg-violet-400/10 text-violet-100";
  if (value.includes("safe")) return "border-emerald-400/25 bg-emerald-400/10 text-emerald-100";
  if (value.includes("target")) return "border-cyan-400/25 bg-cyan-400/10 text-cyan-100";

  return "border-slate-400/20 bg-white/[0.04] text-slate-200";
}

function readinessTone(score = 0) {
  const value = Number(score) || 0;

  if (value >= 75) return "border-emerald-400/25 bg-emerald-400/10 text-emerald-100";
  if (value >= 50) return "border-amber-400/25 bg-amber-400/10 text-amber-100";
  return "border-rose-400/25 bg-rose-400/10 text-rose-100";
}

function UniversityStat({ label, value, helper, tone = "slate" }) {
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

function ReadinessBar({ value }) {
  const score = Math.max(0, Math.min(100, Number(value) || 0));

  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs">
        <span className="font-bold text-slate-400">Shortlist readiness</span>
        <span className="text-slate-300">{score}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-white/10">
        <div className="h-full rounded-full bg-white" style={{ width: `${score}%` }} />
      </div>
    </div>
  );
}

function UniversityCard({ item }) {
  const ready = Number(item.readinessScore || 0) >= 75;

  return (
    <article className="rounded-3xl border border-white/10 bg-slate-950/50 p-4 transition hover:border-cyan-400/25 hover:bg-slate-900/70">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-black">{item.universityName}</h3>
          <p className="text-sm text-slate-400">{item.studentName}</p>
        </div>

        <span className={`rounded-full border px-3 py-1 text-xs font-bold ${categoryTone(item.category)}`}>
          {item.category}
        </span>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <span className="rounded-full border border-cyan-400/25 bg-cyan-400/10 px-3 py-1 text-xs font-bold text-cyan-100">
          {item.country}
        </span>

        <span className={`rounded-full border px-3 py-1 text-xs font-bold ${readinessTone(item.readinessScore)}`}>
          {ready ? "Application Ready" : "Needs Planning"}
        </span>
      </div>

      <p className="mt-3 text-xs font-bold uppercase tracking-[0.18em] text-slate-500">{item.courseName}</p>

      <p className="mt-4 text-sm leading-6 text-slate-300">{item.nextAction}</p>

      <div className="mt-4">
        <ReadinessBar value={item.readinessScore} />
      </div>
    </article>
  );
}

export default function CounselorUniversitiesWorkspace({ snapshot }) {
  const queue = useMemo(() => buildCounselorUniversityQueue(snapshot || {}), [snapshot]);

  const [filter, setFilter] = useState("all");
  const [sort, setSort] = useState("readiness");
  const [query, setQuery] = useState("");

  const stats = useMemo(() => {
    const dream = queue.filter((item) => lower(item.category).includes("dream")).length;
    const target = queue.filter((item) => lower(item.category).includes("target")).length;
    const safe = queue.filter((item) => lower(item.category).includes("safe")).length;
    const ready = queue.filter((item) => Number(item.readinessScore || 0) >= 75).length;
    const incomplete = queue.filter((item) => Number(item.readinessScore || 0) < 75).length;

    const avgReadiness = queue.length
      ? Math.round(queue.reduce((sum, item) => sum + Number(item.readinessScore || 0), 0) / queue.length)
      : 0;

    return {
      total: queue.length,
      dream,
      target,
      safe,
      ready,
      incomplete,
      avgReadiness,
    };
  }, [queue]);

  const filtered = useMemo(() => {
    const search = query.trim().toLowerCase();

    let next = queue;

    if (filter === "dream") next = next.filter((item) => lower(item.category).includes("dream"));
    if (filter === "target") next = next.filter((item) => lower(item.category).includes("target"));
    if (filter === "safe") next = next.filter((item) => lower(item.category).includes("safe"));
    if (filter === "ready") next = next.filter((item) => Number(item.readinessScore || 0) >= 75);
    if (filter === "incomplete") next = next.filter((item) => Number(item.readinessScore || 0) < 75);

    if (search) {
      next = next.filter((item) =>
        [item.studentName, item.universityName, item.country, item.courseName, item.category, item.status, item.nextAction]
          .map((value) => lower(value))
          .join(" ")
          .includes(search)
      );
    }

    return [...next].sort((a, b) => {
      if (sort === "student") return safeString(a.studentName).localeCompare(safeString(b.studentName));
      if (sort === "university") return safeString(a.universityName).localeCompare(safeString(b.universityName));
      if (sort === "country") return safeString(a.country).localeCompare(safeString(b.country));
      if (sort === "category") return safeString(a.category).localeCompare(safeString(b.category));

      return Number(b.readinessScore || 0) - Number(a.readinessScore || 0);
    });
  }, [queue, filter, query, sort]);

  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
      <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-cyan-300">University OS</p>
          <h2 className="mt-2 text-2xl font-black">University Planning Queue</h2>
          <p className="mt-1 text-sm text-slate-400">
            Dream, target, safe strategy and university shortlist readiness for assigned students.
          </p>
        </div>

        <span className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-bold text-slate-200">
          {filtered.length}/{queue.length} records
        </span>
      </div>

      <div className="mb-5 grid gap-3 md:grid-cols-3 xl:grid-cols-6">
        <UniversityStat label="Total" value={stats.total} helper="shortlist items" tone="cyan" />
        <UniversityStat label="Dream" value={stats.dream} helper="ambitious" tone="violet" />
        <UniversityStat label="Target" value={stats.target} helper="best-fit" />
        <UniversityStat label="Safe" value={stats.safe} helper="backup plan" tone="emerald" />
        <UniversityStat label="Ready" value={stats.ready} helper="application ready" tone="emerald" />
        <UniversityStat label="Avg" value={`${stats.avgReadiness}%`} helper="readiness" tone="amber" />
      </div>

      <div className="mb-5 grid gap-3 lg:grid-cols-[1fr_220px_220px]">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search student, university, country, course, category..."
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

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/15 p-6 text-center md:col-span-2 xl:col-span-3">
            <p className="text-sm font-bold text-white">No university planning records found.</p>
            <p className="mx-auto mt-2 max-w-2xl text-sm text-slate-400">
              Assigned university shortlist records will appear here once linked to the counselor-scoped student snapshot.
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
          filtered.map((item) => <UniversityCard key={item.id} item={item} />)
        )}
      </div>
    </div>
  );
}