import React, { useMemo, useState } from "react";

function lower(value) {
  return String(value || "").toLowerCase();
}

function sensitivityTone(value = "") {
  const text = lower(value);
  if (text.includes("high")) return "border-rose-400/25 bg-rose-500/10 text-rose-100";
  if (text.includes("medium")) return "border-amber-400/25 bg-amber-500/10 text-amber-100";
  return "border-cyan-400/25 bg-cyan-500/10 text-cyan-100";
}

function statusTone(status = "") {
  const value = lower(status);
  if (value.includes("approved") || value.includes("captured") || value.includes("stored")) return "border-emerald-400/25 bg-emerald-400/10 text-emerald-100";
  if (value.includes("missing") || value.includes("expired")) return "border-rose-400/25 bg-rose-400/10 text-rose-100";
  if (value.includes("review")) return "border-amber-400/25 bg-amber-400/10 text-amber-100";
  return "border-cyan-400/25 bg-cyan-400/10 text-cyan-100";
}

function DataRow({ item }) {
  return (
    <article className="rounded-3xl border border-white/10 bg-slate-950/50 p-4">
      <div className="grid gap-4 lg:grid-cols-[1fr_0.55fr_0.45fr] lg:items-center">
        <div>
          <p className="font-black text-white">{item.title}</p>
          <p className="mt-1 text-sm text-slate-400">{item.type} · {item.category}</p>
          <p className="mt-1 text-xs text-slate-500">Owner: {item.owner}</p>
        </div>

        <span className={`w-fit rounded-full border px-3 py-1 text-xs font-black ${sensitivityTone(item.sensitivity)}`}>{item.sensitivity}</span>
        <span className={`w-fit rounded-full border px-3 py-1 text-xs font-black ${statusTone(item.status)}`}>{item.status}</span>
      </div>
    </article>
  );
}

export default function DataProtectionPanel({ compliance = {}, compact = false }) {
  const [filter, setFilter] = useState("all");
  const rows = compliance.dataRows || [];

  const filtered = useMemo(() => {
    if (filter === "all") return rows;
    return rows.filter((item) => lower(item.type).includes(filter) || lower(item.sensitivity).includes(filter) || lower(item.status).includes(filter));
  }, [rows, filter]);

  const visible = compact ? filtered.slice(0, 5) : filtered;

  const high = rows.filter((item) => lower(item.sensitivity).includes("high")).length;
  const consents = rows.filter((item) => lower(item.type).includes("consent")).length;
  const documents = rows.filter((item) => lower(item.type).includes("document")).length;

  return (
    <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
      <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.25em] text-amber-300">Data Protection</p>
          <h2 className="mt-2 text-2xl font-black text-white">Privacy & Sensitive Data Control</h2>
          <p className="mt-1 text-sm text-slate-400">Student documents, consent records, sensitive data, retention signals, and privacy readiness.</p>
        </div>
        <span className="rounded-2xl border border-amber-400/20 bg-amber-500/10 px-4 py-2 text-xs font-black text-amber-100">
          {high} high sensitivity
        </span>
      </div>

      {!compact ? (
        <div className="mb-5 grid gap-3 md:grid-cols-3">
          <div className="rounded-3xl border border-cyan-400/20 bg-cyan-500/10 p-5">
            <p className="text-xs font-black uppercase tracking-[0.24em] text-slate-400">Data Records</p>
            <p className="mt-3 text-3xl font-black text-white">{rows.length}</p>
          </div>
          <div className="rounded-3xl border border-violet-400/20 bg-violet-500/10 p-5">
            <p className="text-xs font-black uppercase tracking-[0.24em] text-slate-400">Consents</p>
            <p className="mt-3 text-3xl font-black text-white">{consents}</p>
          </div>
          <div className="rounded-3xl border border-amber-400/20 bg-amber-500/10 p-5">
            <p className="text-xs font-black uppercase tracking-[0.24em] text-slate-400">Documents</p>
            <p className="mt-3 text-3xl font-black text-white">{documents}</p>
          </div>
        </div>
      ) : null}

      {!compact ? (
        <div className="mb-5 flex flex-wrap gap-2">
          {["all", "document", "consent", "high", "missing"].map((item) => (
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
      ) : null}

      <div className="space-y-3">
        {visible.length ? visible.map((item) => <DataRow key={item.id} item={item} />) : (
          <div className="rounded-3xl border border-dashed border-white/15 p-6 text-center">
            <p className="text-sm font-black text-white">No data protection records found.</p>
            <p className="mt-2 text-sm text-slate-400">Data inventory will populate from student documents, consents, and privacy logs.</p>
          </div>
        )}
      </div>
    </section>
  );
}
