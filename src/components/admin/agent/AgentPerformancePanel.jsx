import React from "react";

function money(value) {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

function AgentRow({ agent, index, compact }) {
  const width = Math.max(4, Math.min(100, Math.round((agent.score || 0) / 150 * 100)));

  return (
    <article className="rounded-3xl border border-white/10 bg-slate-950/50 p-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl border border-cyan-400/25 bg-cyan-500/10 text-sm font-black text-cyan-100">
            {index + 1}
          </span>
          <div>
            <p className="font-black text-white">{agent.name}</p>
            <p className="mt-1 text-xs text-slate-500">{agent.leads} leads · {money(agent.revenue)} revenue</p>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-2 text-center text-xs lg:min-w-[360px]">
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-2"><p className="font-black text-white">{agent.applications}</p><p className="text-slate-500">Apps</p></div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-2"><p className="font-black text-white">{agent.offers}</p><p className="text-slate-500">Offers</p></div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-2"><p className="font-black text-white">{agent.cas}</p><p className="text-slate-500">CAS</p></div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-2"><p className="font-black text-white">{agent.visas}</p><p className="text-slate-500">Visas</p></div>
        </div>
      </div>

      {!compact ? (
        <div className="mt-4">
          <div className="mb-1 flex justify-between text-xs">
            <span className="font-bold text-slate-500">Partner performance score</span>
            <span className="text-slate-300">{Math.round(agent.score || 0)}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-white/10">
            <div className="h-full rounded-full bg-white" style={{ width: `${width}%` }} />
          </div>
        </div>
      ) : null}
    </article>
  );
}

export default function AgentPerformancePanel({ agentOS = {}, compact = false }) {
  const rows = compact ? (agentOS.agents || []).slice(0, 4) : agentOS.agents || [];

  return (
    <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
      <div className="mb-5">
        <p className="text-xs font-black uppercase tracking-[0.25em] text-violet-300">Agent Performance</p>
        <h2 className="mt-2 text-2xl font-black text-white">Partner Leaderboard</h2>
        <p className="mt-1 text-sm text-slate-400">Rank agents by conversion, late-stage success, revenue, and student volume.</p>
      </div>

      <div className="space-y-3">
        {rows.length ? rows.map((agent, index) => <AgentRow key={agent.name} agent={agent} index={index} compact={compact} />) : (
          <div className="rounded-3xl border border-dashed border-white/15 p-6 text-center">
            <p className="text-sm font-black text-white">No agent performance yet.</p>
            <p className="mt-2 text-sm text-slate-400">Agent performance will populate after partner leads are linked.</p>
          </div>
        )}
      </div>
    </section>
  );
}
