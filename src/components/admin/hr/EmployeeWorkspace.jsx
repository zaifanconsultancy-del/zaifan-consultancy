import React, { useMemo, useState } from "react";

function lower(value) {
  return String(value || "").toLowerCase();
}

function statusTone(status = "") {
  const value = lower(status);
  if (value.includes("active")) return "border-emerald-400/25 bg-emerald-400/10 text-emerald-100";
  if (value.includes("leave")) return "border-amber-400/25 bg-amber-400/10 text-amber-100";
  if (value.includes("inactive") || value.includes("left")) return "border-rose-400/25 bg-rose-400/10 text-rose-100";
  return "border-cyan-400/25 bg-cyan-400/10 text-cyan-100";
}

function performanceTone(score = 0) {
  const value = Number(score) || 0;
  if (value >= 80) return "border-emerald-400/25 bg-emerald-400/10 text-emerald-100";
  if (value >= 60) return "border-amber-400/25 bg-amber-400/10 text-amber-100";
  return "border-rose-400/25 bg-rose-400/10 text-rose-100";
}

function EmployeeCard({ person, compact }) {
  return (
    <article className="rounded-3xl border border-white/10 bg-slate-950/50 p-4 transition hover:border-violet-400/25 hover:bg-slate-900/70">
      <div className="grid gap-4 lg:grid-cols-[1fr_0.7fr_0.5fr] lg:items-center">
        <div>
          <p className="text-lg font-black text-white">{person.name}</p>
          <p className="mt-1 text-sm text-slate-400">{person.role} · {person.department}</p>
          <p className="mt-1 text-xs text-slate-500">{person.email || "No email"} · Manager: {person.manager}</p>
        </div>

        <div className="grid grid-cols-3 gap-2 text-center text-xs">
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-2">
            <p className="font-black text-white">{person.tasks}</p>
            <p className="text-slate-500">Tasks</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-2">
            <p className="font-black text-white">{person.support}</p>
            <p className="text-slate-500">Support</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-2">
            <p className="font-black text-white">{person.applications}</p>
            <p className="text-slate-500">Apps</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 lg:justify-end">
          <span className={`rounded-full border px-3 py-1 text-xs font-black ${statusTone(person.status)}`}>{person.status}</span>
          <span className={`rounded-full border px-3 py-1 text-xs font-black ${performanceTone(person.performanceScore)}`}>
            {person.performanceScore}%
          </span>
        </div>
      </div>

      {!compact ? (
        <div className="mt-4">
          <div className="mb-1 flex justify-between text-xs">
            <span className="font-bold text-slate-500">Performance score</span>
            <span className="text-slate-300">{person.performanceScore}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-white/10">
            <div className="h-full rounded-full bg-white" style={{ width: `${Math.max(4, person.performanceScore)}%` }} />
          </div>
        </div>
      ) : null}
    </article>
  );
}

export default function EmployeeWorkspace({ hr = {}, compact = false }) {
  const [query, setQuery] = useState("");
  const [department, setDepartment] = useState("all");

  const people = hr.people || [];
  const departments = ["all", ...new Set(people.map((person) => person.department).filter(Boolean))];

  const filtered = useMemo(() => {
    const search = query.trim().toLowerCase();

    let next = people;

    if (department !== "all") {
      next = next.filter((person) => person.department === department);
    }

    if (search) {
      next = next.filter((person) =>
        [person.name, person.email, person.role, person.department, person.status, person.manager]
          .map((value) => lower(value))
          .join(" ")
          .includes(search)
      );
    }

    return next;
  }, [people, query, department]);

  const visible = compact ? filtered.slice(0, 5) : filtered;

  return (
    <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
      <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.25em] text-cyan-300">Employee Workspace</p>
          <h2 className="mt-2 text-2xl font-black text-white">Team Directory</h2>
          <p className="mt-1 text-sm text-slate-400">Staff, counselors, departments, workload, status, and performance snapshot.</p>
        </div>
        <span className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-black text-slate-300">
          {filtered.length}/{people.length}
        </span>
      </div>

      {!compact ? (
        <div className="mb-5 grid gap-3 lg:grid-cols-[1fr_240px]">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search employee, role, department, manager..."
            className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500"
          />

          <select
            value={department}
            onChange={(event) => setDepartment(event.target.value)}
            className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-sm font-bold text-white outline-none"
          >
            {departments.map((item) => (
              <option key={item} value={item}>
                {item === "all" ? "All Departments" : item}
              </option>
            ))}
          </select>
        </div>
      ) : null}

      <div className="space-y-3">
        {visible.length ? visible.map((person) => <EmployeeCard key={person.id} person={person} compact={compact} />) : (
          <div className="rounded-3xl border border-dashed border-white/15 p-6 text-center">
            <p className="text-sm font-black text-white">No employees found.</p>
            <p className="mt-2 text-sm text-slate-400">Team data will populate from staff, counselor, or users snapshots.</p>
          </div>
        )}
      </div>
    </section>
  );
}
