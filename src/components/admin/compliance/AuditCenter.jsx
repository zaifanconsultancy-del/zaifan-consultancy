import React, { useMemo, useState } from "react";

function lower(value) {
  return String(value || "").toLowerCase();
}

function severityTone(severity = "") {
  const value = lower(severity);
  if (value.includes("critical")) return "border-rose-400/25 bg-rose-500/10 text-rose-100";
  if (value.includes("high")) return "border-orange-400/25 bg-orange-500/10 text-orange-100";
  if (value.includes("medium")) return "border-amber-400/25 bg-amber-500/10 text-amber-100";
  return "border-cyan-400/25 bg-cyan-500/10 text-cyan-100";
}

function AuditRow({ item }) {
  return (
    <article className="rounded-3xl border border-white/10 bg-slate-950/50 p-4">
      <div className="grid gap-4 lg:grid-cols-[1fr_0.6fr_0.45fr] lg:items-center">
        <div>
          <p className="font-black text-white">{item.action}</p>
          <p className="mt-1 text-sm text-slate-400">{item.actor} · {item.category}</p>
          <p className="mt-1 text-xs text-slate-500">{item.description}</p>
        </div>

        <div>
          <p className="text-sm font-bold text-slate-300">{item.createdAt ? new Date(item.createdAt).toLocaleString() : "No date"}</p>
          <p className="mt-1 text-xs text-slate-500">{item.status}</p>
        </div>

        <span className={`w-fit rounded-full border px-3 py-1 text-xs font-black ${severityTone(item.severity)}`}>{item.severity}</span>
      </div>
    </article>
  );
}

export default function AuditCenter({ compliance = {} }) {
  const [query, setQuery] = useState("");
  const [severity, setSeverity] = useState("all");
  const rows = compliance.auditRows || [];

  const filtered = useMemo(() => {
    const search = query.trim().toLowerCase();
    let next = rows;

    if (severity !== "all") {
      next = next.filter((item) => lower(item.severity).includes(severity));
    }

    if (search) {
      next = next.filter((item) =>
        [item.actor, item.action, item.category, item.status, item.description, item.severity]
          .map((value) => lower(value))
          .join(" ")
          .includes(search)
      );
    }

    return next;
  }, [rows, query, severity]);

  return (
    <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
      <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.25em] text-cyan-300">Audit Center</p>
          <h2 className="mt-2 text-2xl font-black text-white">Activity & Audit Trail</h2>
          <p className="mt-1 text-sm text-slate-400">Track critical activity, system events, user actions, and compliance evidence.</p>
        </div>
        <span className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-black text-slate-300">{filtered.length}/{rows.length}</span>
      </div>

      <div className="mb-5 grid gap-3 lg:grid-cols-[1fr_220px]">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search audit logs..."
          className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500"
        />
        <select
          value={severity}
          onChange={(event) => setSeverity(event.target.value)}
          className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-sm font-bold text-white outline-none"
        >
          <option value="all">All Severity</option>
          <option value="critical">Critical</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
      </div>

      <div className="space-y-3">
        {filtered.length ? filtered.map((item) => <AuditRow key={item.id} item={item} />) : (
          <div className="rounded-3xl border border-dashed border-white/15 p-6 text-center">
            <p className="text-sm font-black text-white">No audit logs found.</p>
            <p className="mt-2 text-sm text-slate-400">Audit data will appear when activity logs are connected.</p>
          </div>
        )}
      </div>
    </section>
  );
}
