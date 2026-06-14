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

function statusTone(status = "") {
  const value = lower(status);
  if (value.includes("closed") || value.includes("resolved")) return "border-emerald-400/25 bg-emerald-400/10 text-emerald-100";
  if (value.includes("progress") || value.includes("mitigat")) return "border-cyan-400/25 bg-cyan-400/10 text-cyan-100";
  if (value.includes("open")) return "border-amber-400/25 bg-amber-400/10 text-amber-100";
  return "border-slate-400/20 bg-white/[0.04] text-slate-200";
}

function isOverdue(risk = {}) {
  if (!risk.dueDate) return false;
  const time = new Date(risk.dueDate).getTime();
  return Number.isFinite(time) && time < Date.now() && !lower(risk.status).includes("closed") && !lower(risk.status).includes("resolved");
}

function RiskCard({ risk, compact }) {
  const overdue = isOverdue(risk);

  return (
    <article className={`rounded-3xl border p-4 ${overdue ? "border-rose-400/25 bg-rose-500/10" : "border-white/10 bg-slate-950/50"}`}>
      <div className="grid gap-4 lg:grid-cols-[1fr_0.6fr_0.5fr] lg:items-center">
        <div>
          <p className="font-black text-white">{risk.title}</p>
          <p className="mt-1 text-sm text-slate-400">{risk.category} · Owner: {risk.owner}</p>
          {!compact ? <p className="mt-2 text-xs leading-5 text-slate-500">{risk.mitigation}</p> : null}
        </div>

        <div>
          <p className="text-sm font-bold text-slate-300">
            Due: {risk.dueDate ? new Date(risk.dueDate).toLocaleDateString() : "No due date"}
          </p>
          {overdue ? <p className="mt-1 text-xs font-bold text-rose-200">Overdue mitigation</p> : null}
        </div>

        <div className="flex flex-wrap gap-2 lg:justify-end">
          <span className={`rounded-full border px-3 py-1 text-xs font-black ${severityTone(risk.severity)}`}>{risk.severity}</span>
          <span className={`rounded-full border px-3 py-1 text-xs font-black ${statusTone(risk.status)}`}>{risk.status}</span>
        </div>
      </div>
    </article>
  );
}

export default function RiskRegisterPanel({ compliance = {}, compact = false }) {
  const [filter, setFilter] = useState("all");
  const rows = compliance.riskRows || [];

  const filtered = useMemo(() => {
    if (filter === "all") return rows;
    if (filter === "overdue") return rows.filter(isOverdue);
    return rows.filter((risk) => lower(risk.severity).includes(filter) || lower(risk.status).includes(filter));
  }, [rows, filter]);

  const visible = compact ? filtered.slice(0, 5) : filtered;
  const critical = rows.filter((risk) => risk.severity === "Critical" || risk.severity === "High").length;
  const overdue = rows.filter(isOverdue).length;

  return (
    <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
      <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.25em] text-rose-300">Risk Register</p>
          <h2 className="mt-2 text-2xl font-black text-white">Compliance Risk Control</h2>
          <p className="mt-1 text-sm text-slate-400">Open risks, severity, mitigation ownership, overdue actions, and operational exposure.</p>
        </div>

        {!compact ? (
          <div className="flex flex-wrap gap-2">
            {["all", "critical", "high", "open", "overdue"].map((item) => (
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
        ) : (
          <span className="rounded-2xl border border-rose-400/20 bg-rose-500/10 px-4 py-2 text-xs font-black text-rose-100">
            {critical} high · {overdue} overdue
          </span>
        )}
      </div>

      <div className="space-y-3">
        {visible.length ? visible.map((risk) => <RiskCard key={risk.id} risk={risk} compact={compact} />) : (
          <div className="rounded-3xl border border-dashed border-white/15 p-6 text-center">
            <p className="text-sm font-black text-white">No risk records found.</p>
            <p className="mt-2 text-sm text-slate-400">Risk register entries will appear when compliance risk data is connected.</p>
          </div>
        )}
      </div>
    </section>
  );
}
