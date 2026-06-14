import React from "react";

function money(value) {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

function statusTone(status = "") {
  const value = String(status || "").toLowerCase();
  if (value.includes("pending")) return "border-amber-400/25 bg-amber-400/10 text-amber-100";
  if (value.includes("paid")) return "border-emerald-400/25 bg-emerald-400/10 text-emerald-100";
  if (value.includes("estimate")) return "border-cyan-400/25 bg-cyan-400/10 text-cyan-100";
  return "border-slate-400/20 bg-white/[0.04] text-slate-200";
}

export default function AgentCommissionPanel({ agentOS = {}, compact = false }) {
  const rows = compact ? (agentOS.commissions || []).slice(0, 5) : agentOS.commissions || [];

  return (
    <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
      <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.25em] text-emerald-300">Agent Commissions</p>
          <h2 className="mt-2 text-2xl font-black text-white">Partner Payout Control</h2>
          <p className="mt-1 text-sm text-slate-400">Estimated and pending commission by partner source.</p>
        </div>
        <span className="rounded-2xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-2 text-xs font-black text-emerald-100">
          {money(agentOS.totals?.commissionDue)}
        </span>
      </div>

      <div className="space-y-3">
        {rows.length ? (
          rows.map((row) => (
            <article key={row.id} className="rounded-3xl border border-white/10 bg-slate-950/50 p-4">
              <div className="grid gap-4 lg:grid-cols-[1fr_0.5fr_0.5fr_0.5fr] lg:items-center">
                <div>
                  <p className="font-black text-white">{row.agent}</p>
                  <p className="mt-1 text-xs text-slate-500">{row.leads} leads · {row.visas} visas</p>
                </div>
                <p className="text-sm font-bold text-slate-200">{money(row.revenue)} revenue</p>
                <p className="text-sm font-black text-white">{money(row.commissionDue)}</p>
                <span className={`w-fit rounded-full border px-3 py-1 text-xs font-black ${statusTone(row.status)}`}>{row.status}</span>
              </div>
            </article>
          ))
        ) : (
          <div className="rounded-3xl border border-dashed border-white/15 p-6 text-center">
            <p className="text-sm font-black text-white">No commission rows yet.</p>
            <p className="mt-2 text-sm text-slate-400">Commissions will populate from agent revenue and commission tables.</p>
          </div>
        )}
      </div>
    </section>
  );
}
