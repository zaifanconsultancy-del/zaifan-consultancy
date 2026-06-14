import React, { useMemo, useState } from "react";

function money(value) {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

function lower(value) {
  return String(value || "").toLowerCase();
}

function CampaignRow({ campaign, compact }) {
  const roiTone =
    campaign.roi >= 100
      ? "border-emerald-400/25 bg-emerald-400/10 text-emerald-100"
      : campaign.roi >= 0
      ? "border-amber-400/25 bg-amber-400/10 text-amber-100"
      : "border-rose-400/25 bg-rose-400/10 text-rose-100";

  return (
    <article className="rounded-3xl border border-white/10 bg-slate-950/50 p-4">
      <div className="grid gap-4 lg:grid-cols-[1fr_0.8fr_0.6fr] lg:items-center">
        <div>
          <p className="text-lg font-black text-white">{campaign.name}</p>
          <p className="mt-1 text-sm text-slate-400">{campaign.source} · {campaign.leads} leads</p>
        </div>

        <div className="grid grid-cols-4 gap-2 text-center text-xs">
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-2"><p className="font-black text-white">{campaign.applications}</p><p className="text-slate-500">Apps</p></div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-2"><p className="font-black text-white">{campaign.offers}</p><p className="text-slate-500">Offers</p></div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-2"><p className="font-black text-white">{campaign.cas}</p><p className="text-slate-500">CAS</p></div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-2"><p className="font-black text-white">{campaign.visas}</p><p className="text-slate-500">Visas</p></div>
        </div>

        <div className="flex flex-wrap gap-2 lg:justify-end">
          <span className={`rounded-full border px-3 py-1 text-xs font-black ${roiTone}`}>ROI {campaign.roi}%</span>
          {!compact ? <span className="rounded-full border border-cyan-400/25 bg-cyan-400/10 px-3 py-1 text-xs font-black text-cyan-100">{money(campaign.spend)} spend</span> : null}
        </div>
      </div>
    </article>
  );
}

export default function CampaignPerformancePanel({ marketing = {}, compact = false }) {
  const [query, setQuery] = useState("");
  const campaigns = marketing.campaigns || [];

  const filtered = useMemo(() => {
    const search = query.trim().toLowerCase();
    if (!search) return campaigns;
    return campaigns.filter((item) => [item.name, item.source].map((value) => lower(value)).join(" ").includes(search));
  }, [campaigns, query]);

  const visible = compact ? filtered.slice(0, 5) : filtered;

  return (
    <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
      <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.25em] text-violet-300">Campaign Performance</p>
          <h2 className="mt-2 text-2xl font-black text-white">Campaign Intelligence</h2>
          <p className="mt-1 text-sm text-slate-400">Compare campaigns by leads, applications, offers, CAS, visas, spend, and ROI.</p>
        </div>
        <span className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-black text-slate-300">{filtered.length}/{campaigns.length}</span>
      </div>

      {!compact ? (
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search campaign or source..." className="mb-5 w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500" />
      ) : null}

      <div className="space-y-3">
        {visible.length ? visible.map((campaign) => <CampaignRow key={campaign.name} campaign={campaign} compact={compact} />) : (
          <div className="rounded-3xl border border-dashed border-white/15 p-6 text-center">
            <p className="text-sm font-black text-white">No campaign data yet.</p>
            <p className="mt-2 text-sm text-slate-400">Campaign rows will populate after UTM/campaign/source data is linked.</p>
          </div>
        )}
      </div>
    </section>
  );
}
