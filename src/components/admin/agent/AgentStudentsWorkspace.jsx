import React, { useMemo, useState } from "react";

function lower(value) {
  return String(value || "").toLowerCase();
}

function stageTone(stage = "") {
  const value = lower(stage);
  if (value.includes("visa")) return "border-emerald-400/25 bg-emerald-400/10 text-emerald-100";
  if (value.includes("cas")) return "border-violet-400/25 bg-violet-400/10 text-violet-100";
  if (value.includes("offer")) return "border-amber-400/25 bg-amber-400/10 text-amber-100";
  if (value.includes("application")) return "border-cyan-400/25 bg-cyan-400/10 text-cyan-100";
  return "border-slate-400/20 bg-white/[0.04] text-slate-200";
}

export default function AgentStudentsWorkspace({ agentOS = {}, compact = false }) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");

  const students = agentOS.students || [];

  const filtered = useMemo(() => {
    const search = query.trim().toLowerCase();

    let next = students;

    if (filter !== "all") {
      next = next.filter((student) => lower(student.stage).includes(filter) || lower(student.status).includes(filter));
    }

    if (search) {
      next = next.filter((student) =>
        [student.name, student.email, student.phone, student.agent, student.country, student.stage, student.status]
          .map((value) => lower(value))
          .join(" ")
          .includes(search)
      );
    }

    return next;
  }, [students, query, filter]);

  const visible = compact ? filtered.slice(0, 5) : filtered;

  return (
    <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
      <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.25em] text-cyan-300">Agent Students</p>
          <h2 className="mt-2 text-2xl font-black text-white">Partner Student Pipeline</h2>
          <p className="mt-1 text-sm text-slate-400">Students submitted by agents and their current Zaifan journey stage.</p>
        </div>
        <span className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-black text-slate-300">
          {filtered.length}/{students.length}
        </span>
      </div>

      {!compact ? (
        <div className="mb-5 grid gap-3 lg:grid-cols-[1fr_220px]">
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search student, agent, country, stage..." className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500" />
          <select value={filter} onChange={(event) => setFilter(event.target.value)} className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-sm font-bold text-white outline-none">
            <option value="all">All</option>
            <option value="lead">Lead</option>
            <option value="application">Application</option>
            <option value="offer">Offer</option>
            <option value="cas">CAS</option>
            <option value="visa">Visa</option>
          </select>
        </div>
      ) : null}

      <div className="grid gap-3">
        {visible.length ? (
          visible.map((student) => (
            <article key={student.id} className="rounded-3xl border border-white/10 bg-slate-950/50 p-4">
              <div className="grid gap-4 lg:grid-cols-[1fr_0.7fr_0.5fr] lg:items-center">
                <div>
                  <p className="text-lg font-black text-white">{student.name}</p>
                  <p className="mt-1 text-sm text-slate-400">{student.email || "No email"} · {student.phone || "No phone"}</p>
                  <p className="mt-1 text-xs text-slate-500">Agent: {student.agent}</p>
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-200">{student.country}</p>
                  <p className="mt-1 text-xs text-slate-500">{student.status}</p>
                </div>
                <div>
                  <span className={`rounded-full border px-3 py-1 text-xs font-black ${stageTone(student.stage)}`}>{student.stage}</span>
                </div>
              </div>
            </article>
          ))
        ) : (
          <div className="rounded-3xl border border-dashed border-white/15 p-6 text-center">
            <p className="text-sm font-black text-white">No agent students found.</p>
            <p className="mt-2 text-sm text-slate-400">Agent-submitted students will appear here after lead capture or real data import.</p>
          </div>
        )}
      </div>
    </section>
  );
}
