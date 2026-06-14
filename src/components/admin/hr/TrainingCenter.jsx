import React, { useMemo, useState } from "react";

function lower(value) {
  return String(value || "").toLowerCase();
}

function progressTone(progress = 0) {
  const value = Number(progress) || 0;
  if (value >= 100) return "border-emerald-400/25 bg-emerald-400/10 text-emerald-100";
  if (value >= 50) return "border-amber-400/25 bg-amber-400/10 text-amber-100";
  return "border-rose-400/25 bg-rose-400/10 text-rose-100";
}

export default function TrainingCenter({ hr = {} }) {
  const [filter, setFilter] = useState("all");
  const rows = hr.training || [];

  const filtered = useMemo(() => {
    if (filter === "all") return rows;
    if (filter === "complete") return rows.filter((item) => Number(item.progress || 0) >= 100);
    if (filter === "due") return rows.filter((item) => Number(item.progress || 0) < 100);
    return rows.filter((item) => lower(item.category).includes(filter) || lower(item.status).includes(filter));
  }, [rows, filter]);

  const completed = rows.filter((item) => Number(item.progress || 0) >= 100).length;
  const due = rows.filter((item) => Number(item.progress || 0) < 100).length;
  const average = rows.length ? Math.round(rows.reduce((sum, item) => sum + Number(item.progress || 0), 0) / rows.length) : 0;

  return (
    <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
      <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.25em] text-emerald-300">Training Center</p>
          <h2 className="mt-2 text-2xl font-black text-white">Team Learning & Enablement</h2>
          <p className="mt-1 text-sm text-slate-400">Training modules, onboarding, compliance learning, and skill development progress.</p>
        </div>

        <div className="flex flex-wrap gap-2">
          {["all", "due", "complete"].map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setFilter(item)}
              className={`rounded-2xl px-4 py-2 text-xs font-black ${
                filter === item ? "bg-white text-slate-950" : "border border-white/10 bg-white/[0.04] text-slate-300"
              }`}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-5 grid gap-3 md:grid-cols-3">
        <div className="rounded-3xl border border-cyan-400/20 bg-cyan-500/10 p-5">
          <p className="text-xs font-black uppercase tracking-[0.24em] text-slate-400">Average</p>
          <p className="mt-3 text-3xl font-black text-white">{average}%</p>
        </div>
        <div className="rounded-3xl border border-emerald-400/20 bg-emerald-500/10 p-5">
          <p className="text-xs font-black uppercase tracking-[0.24em] text-slate-400">Complete</p>
          <p className="mt-3 text-3xl font-black text-white">{completed}</p>
        </div>
        <div className="rounded-3xl border border-amber-400/20 bg-amber-500/10 p-5">
          <p className="text-xs font-black uppercase tracking-[0.24em] text-slate-400">Due</p>
          <p className="mt-3 text-3xl font-black text-white">{due}</p>
        </div>
      </div>

      <div className="space-y-3">
        {filtered.length ? filtered.map((item) => (
          <article key={item.id} className="rounded-3xl border border-white/10 bg-slate-950/50 p-4">
            <div className="grid gap-4 lg:grid-cols-[1fr_0.7fr_0.4fr] lg:items-center">
              <div>
                <p className="font-black text-white">{item.title}</p>
                <p className="mt-1 text-xs text-slate-500">{item.employee} · {item.category}</p>
              </div>
              <div>
                <div className="mb-1 flex justify-between text-xs">
                  <span className="font-bold text-slate-500">Progress</span>
                  <span className="text-slate-300">{item.progress}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-white/10">
                  <div className="h-full rounded-full bg-white" style={{ width: `${Math.max(4, item.progress)}%` }} />
                </div>
              </div>
              <span className={`w-fit rounded-full border px-3 py-1 text-xs font-black ${progressTone(item.progress)}`}>{item.status}</span>
            </div>
          </article>
        )) : (
          <div className="rounded-3xl border border-dashed border-white/15 p-6 text-center">
            <p className="text-sm font-black text-white">No training records found.</p>
            <p className="mt-2 text-sm text-slate-400">Training records will appear when learning data is connected.</p>
          </div>
        )}
      </div>
    </section>
  );
}
