import React from "react";

function money(value) {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

function ForecastCard({ label, value, helper, tone = "cyan" }) {
  const tones = {
    cyan: "border-cyan-400/20 bg-cyan-500/10",
    emerald: "border-emerald-400/20 bg-emerald-500/10",
    amber: "border-amber-400/20 bg-amber-500/10",
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

function ForecastRow({ label, count, value, probability }) {
  return (
    <div className="grid gap-3 rounded-3xl border border-white/10 bg-slate-950/50 p-4 md:grid-cols-[1fr_120px_160px_120px] md:items-center">
      <p className="font-black text-white">{label}</p>
      <p className="text-sm font-bold text-slate-300">{count} records</p>
      <p className="text-sm font-black text-emerald-100">{value}</p>
      <span className="w-fit rounded-full border border-cyan-400/25 bg-cyan-400/10 px-3 py-1 text-xs font-black text-cyan-100">
        {probability}
      </span>
    </div>
  );
}

export default function RevenueForecastPanel({ finance = {}, compact = false }) {
  const forecast = finance.forecast || {};
  const pipeline = finance.pipeline || [];

  return (
    <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
      <div className="mb-5">
        <p className="text-xs font-black uppercase tracking-[0.25em] text-cyan-300">Revenue Forecast</p>
        <h2 className="mt-2 text-2xl font-black text-white">30 / 60 / 90 Day Revenue</h2>
        <p className="mt-1 text-sm text-slate-400">
          Weighted forecast from application, offer, CAS, visa, and average invoice signals.
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <ForecastCard label="30 Days" value={money(forecast.day30)} helper="near-term expected" tone="cyan" />
        <ForecastCard label="60 Days" value={money(forecast.day60)} helper="mid-term expected" tone="violet" />
        <ForecastCard label="90 Days" value={money(forecast.day90)} helper="quarter expected" tone="emerald" />
      </div>

      {!compact ? (
        <div className="mt-5 space-y-3">
          {pipeline.map((item) => {
            const probability = item.key === "applications" ? "18%" : item.key === "offers" ? "42%" : item.key === "cas" ? "72%" : "90%";
            return <ForecastRow key={item.key} label={item.label} count={item.count} value={money(item.value)} probability={probability} />;
          })}
        </div>
      ) : null}
    </section>
  );
}
