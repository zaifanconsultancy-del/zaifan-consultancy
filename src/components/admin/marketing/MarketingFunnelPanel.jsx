import React from "react";

function FunnelRow({ stage, max, previous }) {
  const width = max ? Math.max(4, Math.round((Number(stage.count || 0) / max) * 100)) : 4;
  const conversion = previous ? Math.round((Number(stage.count || 0) / previous) * 100) : 100;
  const tone = conversion >= 60 ? "border-emerald-400/25 bg-emerald-400/10 text-emerald-100" : conversion >= 30 ? "border-amber-400/25 bg-amber-400/10 text-amber-100" : "border-rose-400/25 bg-rose-400/10 text-rose-100";

  return (
    <div className="rounded-3xl border border-white/10 bg-slate-950/50 p-4">
      <div className="mb-2 flex items-center justify-between">
        <div>
          <p className="font-black text-white">{stage.label}</p>
          <p className="text-xs text-slate-500">{stage.count} records</p>
        </div>
        <span className={`rounded-full border px-3 py-1 text-xs font-black ${tone}`}>{conversion}%</span>
      </div>
      <div className="h-3 overflow-hidden rounded-full bg-white/10">
        <div className="h-full rounded-full bg-white" style={{ width: `${width}%` }} />
      </div>
    </div>
  );
}

export default function MarketingFunnelPanel({ marketing = {}, compact = false }) {
  const stages = marketing.stageCounts || [];
  const max = Math.max(...stages.map((stage) => Number(stage.count || 0)), 1);

  return (
    <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
      <div className="mb-5">
        <p className="text-xs font-black uppercase tracking-[0.25em] text-amber-300">Marketing Funnel</p>
        <h2 className="mt-2 text-2xl font-black text-white">Acquisition to Enrollment Movement</h2>
        <p className="mt-1 text-sm text-slate-400">Track marketing funnel drop-off from lead to application, offer, CAS, and visa.</p>
      </div>

      <div className={compact ? "space-y-3" : "grid gap-3 lg:grid-cols-2"}>
        {stages.map((stage, index) => (
          <FunnelRow key={stage.key} stage={stage} max={max} previous={index === 0 ? stage.count || 1 : stages[index - 1]?.count || 0} />
        ))}
      </div>
    </section>
  );
}
