import React from "react";

function SourceCard({ source }) {
  const width = Math.max(4, Math.min(100, Math.round((source.score || 0) / 150 * 100)));

  return (
    <article className="rounded-3xl border border-white/10 bg-slate-950/50 p-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-lg font-black text-white">{source.name}</p>
          <p className="mt-1 text-sm text-slate-400">{source.leads} leads · {source.applicationRate}% lead → app</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {(source.countries || []).slice(0, 4).map((country) => (
              <span key={country.name} className="rounded-full border border-cyan-400/25 bg-cyan-400/10 px-3 py-1 text-xs font-black text-cyan-100">
                {country.name} {country.count}
              </span>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 text-center text-xs lg:min-w-[260px]">
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-2"><p className="font-black text-white">{source.offerRate}%</p><p className="text-slate-500">Offer</p></div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-2"><p className="font-black text-white">{source.visaRate}%</p><p className="text-slate-500">Visa</p></div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-2"><p className="font-black text-white">{source.roi}%</p><p className="text-slate-500">ROI</p></div>
        </div>
      </div>

      <div className="mt-4">
        <div className="mb-1 flex justify-between text-xs">
          <span className="font-bold text-slate-500">Source quality score</span>
          <span className="text-slate-300">{Math.round(source.score || 0)}</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-white/10">
          <div className="h-full rounded-full bg-white" style={{ width: `${width}%` }} />
        </div>
      </div>
    </article>
  );
}

export default function LeadSourceIntelligencePanel({ marketing = {}, compact = false }) {
  const rows = compact ? (marketing.sources || []).slice(0, 4) : marketing.sources || [];

  return (
    <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
      <div className="mb-5">
        <p className="text-xs font-black uppercase tracking-[0.25em] text-cyan-300">Lead Source Intelligence</p>
        <h2 className="mt-2 text-2xl font-black text-white">Source Quality</h2>
        <p className="mt-1 text-sm text-slate-400">Understand which lead sources produce applications, offers, visas, and revenue.</p>
      </div>

      <div className="space-y-3">
        {rows.length ? rows.map((source) => <SourceCard key={source.name} source={source} />) : (
          <div className="rounded-3xl border border-dashed border-white/15 p-6 text-center">
            <p className="text-sm font-black text-white">No lead source data yet.</p>
            <p className="mt-2 text-sm text-slate-400">Add lead source values to inquiries/students to activate this panel.</p>
          </div>
        )}
      </div>
    </section>
  );
}
