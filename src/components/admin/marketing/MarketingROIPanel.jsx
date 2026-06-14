import React from "react";

function money(value) {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

function ROICard({ label, value, helper, tone = "cyan" }) {
  const tones = {
    cyan: "border-cyan-400/20 bg-cyan-500/10",
    emerald: "border-emerald-400/20 bg-emerald-500/10",
    amber: "border-amber-400/20 bg-amber-500/10",
    rose: "border-rose-400/20 bg-rose-500/10",
    violet: "border-violet-400/20 bg-violet-500/10",
  };

  return (
    <div className={`rounded-3xl border p-5 ${tones[tone] || tones.cyan}`}>
      <p className="text-xs font-black uppercase tracking-[0.24em] text-slate-400">{label}</p>
      <p className="mt-3 text-3xl font-black text-white">{value}</p>
      {helper ? <p className="mt-2 text-sm text-slate-400">{helper}</p> : null}
    </div>
  );
}

export default function MarketingROIPanel({ marketing = {}, compact = false }) {
  const totals = marketing.totals || {};
  const bestSource = (marketing.sources || [])[0];
  const bestCampaign = (marketing.campaigns || [])[0];

  return (
    <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
      <div className="mb-5">
        <p className="text-xs font-black uppercase tracking-[0.25em] text-emerald-300">Marketing ROI</p>
        <h2 className="mt-2 text-2xl font-black text-white">Acquisition Economics</h2>
        <p className="mt-1 text-sm text-slate-400">Spend, revenue, ROI, cost per lead, and cost per application.</p>
      </div>

      <div className={compact ? "grid gap-3 md:grid-cols-3" : "grid gap-3 md:grid-cols-2 xl:grid-cols-5"}>
        <ROICard label="Spend" value={money(totals.spend)} helper="marketing cost" tone="rose" />
        <ROICard label="Revenue" value={money(totals.revenue)} helper="linked payments" tone="emerald" />
        <ROICard label="ROI" value={`${totals.roi || 0}%`} helper="return rate" tone={(totals.roi || 0) >= 0 ? "emerald" : "rose"} />
        {!compact ? (
          <>
            <ROICard label="CPL" value={money(totals.costPerLead)} helper="cost per lead" tone="cyan" />
            <ROICard label="CPA" value={money(totals.costPerApplication)} helper="cost per application" tone="violet" />
          </>
        ) : null}
      </div>

      {!compact ? (
        <div className="mt-5 grid gap-3 lg:grid-cols-2">
          <div className="rounded-3xl border border-white/10 bg-slate-950/50 p-4">
            <p className="text-sm font-black text-white">Best source</p>
            <p className="mt-2 text-2xl font-black text-cyan-100">{bestSource?.name || "No source yet"}</p>
            <p className="mt-2 text-sm text-slate-400">{bestSource ? `${bestSource.leads} leads · ${bestSource.roi}% ROI` : "Add real source data to calculate source quality."}</p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-slate-950/50 p-4">
            <p className="text-sm font-black text-white">Best campaign</p>
            <p className="mt-2 text-2xl font-black text-emerald-100">{bestCampaign?.name || "No campaign yet"}</p>
            <p className="mt-2 text-sm text-slate-400">{bestCampaign ? `${bestCampaign.leads} leads · ${bestCampaign.roi}% ROI` : "Add campaign data to calculate campaign quality."}</p>
          </div>
        </div>
      ) : null}
    </section>
  );
}
