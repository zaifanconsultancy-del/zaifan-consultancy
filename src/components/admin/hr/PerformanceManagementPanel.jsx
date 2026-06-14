import React from "react";

function tone(score = 0) {
  const value = Number(score) || 0;
  if (value >= 80) return "border-emerald-400/25 bg-emerald-400/10 text-emerald-100";
  if (value >= 60) return "border-amber-400/25 bg-amber-400/10 text-amber-100";
  return "border-rose-400/25 bg-rose-400/10 text-rose-100";
}

function PerformanceRow({ person, index, compact }) {
  const score = Number(person.performanceScore || 0);

  return (
    <article className="rounded-3xl border border-white/10 bg-slate-950/50 p-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl border border-violet-400/25 bg-violet-500/10 text-sm font-black text-violet-100">
            {index + 1}
          </span>
          <div>
            <p className="font-black text-white">{person.name}</p>
            <p className="mt-1 text-xs text-slate-500">{person.role} · {person.department}</p>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-2 text-center text-xs lg:min-w-[360px]">
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-2"><p className="font-black text-white">{person.completedTasks}</p><p className="text-slate-500">Done</p></div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-2"><p className="font-black text-white">{person.openTasks}</p><p className="text-slate-500">Open</p></div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-2"><p className="font-black text-white">{person.support}</p><p className="text-slate-500">Support</p></div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-2"><p className="font-black text-white">{person.applications}</p><p className="text-slate-500">Apps</p></div>
        </div>

        <span className={`w-fit rounded-full border px-3 py-1 text-xs font-black ${tone(score)}`}>{score}%</span>
      </div>

      {!compact ? (
        <div className="mt-4">
          <div className="mb-1 flex justify-between text-xs">
            <span className="font-bold text-slate-500">Performance index</span>
            <span className="text-slate-300">{score}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-white/10">
            <div className="h-full rounded-full bg-white" style={{ width: `${Math.max(4, score)}%` }} />
          </div>
        </div>
      ) : null}
    </article>
  );
}

export default function PerformanceManagementPanel({ hr = {}, compact = false }) {
  const rows = [...(hr.people || [])].sort((a, b) => Number(b.performanceScore || 0) - Number(a.performanceScore || 0));
  const visible = compact ? rows.slice(0, 5) : rows;

  return (
    <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
      <div className="mb-5">
        <p className="text-xs font-black uppercase tracking-[0.25em] text-emerald-300">Performance Management</p>
        <h2 className="mt-2 text-2xl font-black text-white">Team Performance Index</h2>
        <p className="mt-1 text-sm text-slate-400">Employee output based on tasks, applications, support workload, and operational delivery.</p>
      </div>

      <div className="space-y-3">
        {visible.length ? visible.map((person, index) => <PerformanceRow key={person.id} person={person} index={index} compact={compact} />) : (
          <div className="rounded-3xl border border-dashed border-white/15 p-6 text-center">
            <p className="text-sm font-black text-white">No performance data yet.</p>
            <p className="mt-2 text-sm text-slate-400">Performance data appears when employee and workload snapshots are connected.</p>
          </div>
        )}
      </div>
    </section>
  );
}
