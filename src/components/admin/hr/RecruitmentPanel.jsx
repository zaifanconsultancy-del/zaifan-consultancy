import React, { useMemo, useState } from "react";

function lower(value) {
  return String(value || "").toLowerCase();
}

function stageTone(stage = "") {
  const value = lower(stage);
  if (value.includes("hired")) return "border-emerald-400/25 bg-emerald-400/10 text-emerald-100";
  if (value.includes("reject")) return "border-rose-400/25 bg-rose-400/10 text-rose-100";
  if (value.includes("interview")) return "border-violet-400/25 bg-violet-400/10 text-violet-100";
  if (value.includes("screen")) return "border-cyan-400/25 bg-cyan-400/10 text-cyan-100";
  return "border-amber-400/25 bg-amber-400/10 text-amber-100";
}

export default function RecruitmentPanel({ hr = {} }) {
  const [query, setQuery] = useState("");
  const candidates = hr.candidates || [];

  const filtered = useMemo(() => {
    const search = query.trim().toLowerCase();
    if (!search) return candidates;
    return candidates.filter((candidate) =>
      [candidate.name, candidate.role, candidate.stage, candidate.source].map((value) => lower(value)).join(" ").includes(search)
    );
  }, [candidates, query]);

  const open = candidates.filter((candidate) => !lower(candidate.stage).includes("hired") && !lower(candidate.stage).includes("reject")).length;
  const interviews = candidates.filter((candidate) => lower(candidate.stage).includes("interview")).length;
  const hired = candidates.filter((candidate) => lower(candidate.stage).includes("hired")).length;

  return (
    <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
      <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.25em] text-cyan-300">Recruitment</p>
          <h2 className="mt-2 text-2xl font-black text-white">Hiring Pipeline</h2>
          <p className="mt-1 text-sm text-slate-400">Candidates, open roles, interview stages, hiring quality, and recruitment sources.</p>
        </div>
        <span className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-black text-slate-300">
          {filtered.length}/{candidates.length}
        </span>
      </div>

      <div className="mb-5 grid gap-3 md:grid-cols-3">
        <div className="rounded-3xl border border-cyan-400/20 bg-cyan-500/10 p-5">
          <p className="text-xs font-black uppercase tracking-[0.24em] text-slate-400">Open</p>
          <p className="mt-3 text-3xl font-black text-white">{open}</p>
        </div>
        <div className="rounded-3xl border border-violet-400/20 bg-violet-500/10 p-5">
          <p className="text-xs font-black uppercase tracking-[0.24em] text-slate-400">Interviews</p>
          <p className="mt-3 text-3xl font-black text-white">{interviews}</p>
        </div>
        <div className="rounded-3xl border border-emerald-400/20 bg-emerald-500/10 p-5">
          <p className="text-xs font-black uppercase tracking-[0.24em] text-slate-400">Hired</p>
          <p className="mt-3 text-3xl font-black text-white">{hired}</p>
        </div>
      </div>

      <input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Search candidate, role, stage, source..."
        className="mb-5 w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500"
      />

      <div className="space-y-3">
        {filtered.length ? filtered.map((candidate) => (
          <article key={candidate.id} className="rounded-3xl border border-white/10 bg-slate-950/50 p-4">
            <div className="grid gap-3 lg:grid-cols-[1fr_0.7fr_0.4fr_0.4fr] lg:items-center">
              <div>
                <p className="font-black text-white">{candidate.name}</p>
                <p className="mt-1 text-xs text-slate-500">{candidate.source}</p>
              </div>
              <p className="text-sm font-bold text-slate-300">{candidate.role}</p>
              <span className={`w-fit rounded-full border px-3 py-1 text-xs font-black ${stageTone(candidate.stage)}`}>{candidate.stage}</span>
              <p className="text-sm font-black text-white">{candidate.score}%</p>
            </div>
          </article>
        )) : (
          <div className="rounded-3xl border border-dashed border-white/15 p-6 text-center">
            <p className="text-sm font-black text-white">No candidates found.</p>
            <p className="mt-2 text-sm text-slate-400">Recruitment data will populate when candidate records are connected.</p>
          </div>
        )}
      </div>
    </section>
  );
}
