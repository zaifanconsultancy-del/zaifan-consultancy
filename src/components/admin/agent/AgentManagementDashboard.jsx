import React, { useMemo, useState } from "react";

function lower(value) {
  return String(value || "").toLowerCase();
}

export default function AgentManagementDashboard({ agentOS = {} }) {
  const [query, setQuery] = useState("");

  const agents = agentOS.agents || [];

  const filtered = useMemo(() => {
    const search = query.trim().toLowerCase();
    if (!search) return agents;

    return agents.filter((agent) =>
      [agent.name, ...(agent.countries || []).map((country) => country.name)]
        .map((value) => lower(value))
        .join(" ")
        .includes(search)
    );
  }, [agents, query]);

  return (
    <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
      <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.25em] text-amber-300">Agent Management</p>
          <h2 className="mt-2 text-2xl font-black text-white">Partner Control Room</h2>
          <p className="mt-1 text-sm text-slate-400">Operational management layer for active agents, source quality, countries, and partner output.</p>
        </div>
        <span className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-black text-slate-300">
          {filtered.length}/{agents.length}
        </span>
      </div>

      <input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Search agent or country..."
        className="mb-5 w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500"
      />

      <div className="grid gap-4 xl:grid-cols-2">
        {filtered.length ? (
          filtered.map((agent) => (
            <article key={agent.name} className="rounded-3xl border border-white/10 bg-slate-950/50 p-4">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <p className="text-lg font-black text-white">{agent.name}</p>
                  <p className="mt-1 text-sm text-slate-400">{agent.leads} leads · {agent.conversionRate}% lead → app</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {(agent.countries || []).slice(0, 4).map((country) => (
                      <span key={country.name} className="rounded-full border border-cyan-400/25 bg-cyan-400/10 px-3 py-1 text-xs font-black text-cyan-100">
                        {country.name} {country.count}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-2"><p className="font-black text-white">{agent.offerRate}%</p><p className="text-slate-500">Offer</p></div>
                  <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-2"><p className="font-black text-white">{agent.visaRate}%</p><p className="text-slate-500">Visa</p></div>
                  <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-2"><p className="font-black text-white">{Math.round(agent.score || 0)}</p><p className="text-slate-500">Score</p></div>
                </div>
              </div>

              <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.03] p-3">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">Management note</p>
                <p className="mt-2 text-sm leading-6 text-slate-400">
                  Use this partner for countries/courses where conversion is strong. Pause or review source quality if lead volume is high but applications and offers stay low.
                </p>
              </div>
            </article>
          ))
        ) : (
          <div className="rounded-3xl border border-dashed border-white/15 p-6 text-center xl:col-span-2">
            <p className="text-sm font-black text-white">No agents found.</p>
            <p className="mt-2 text-sm text-slate-400">Create or import partner records to activate this management room.</p>
          </div>
        )}
      </div>
    </section>
  );
}
