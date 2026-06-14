import React, { useMemo } from "react";

function safeNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function money(value) {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    maximumFractionDigits: 0,
  }).format(safeNumber(value));
}

function ForecastCard({ label, value, helper, tone = "cyan" }) {
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

function ForecastRow({ label, month30, month60, month90 }) {
  return (
    <div className="grid grid-cols-4 gap-3 rounded-3xl border border-white/10 bg-slate-950/50 p-4 text-sm">
      <p className="font-black text-white">{label}</p>
      <p className="text-center font-bold text-cyan-100">{month30}</p>
      <p className="text-center font-bold text-violet-100">{month60}</p>
      <p className="text-center font-bold text-emerald-100">{month90}</p>
    </div>
  );
}

export default function BusinessForecastPanel({ growth = {} }) {
  const forecast = useMemo(() => {
    const applications = safeNumber(growth.applications?.length);
    const offers = safeNumber(growth.offers?.length);
    const cas = safeNumber(growth.casRecords?.length);
    const visas = safeNumber(growth.visas?.length);
    const averageInvoice = growth.invoices?.length ? safeNumber(growth.invoicedRevenue) / growth.invoices.length : 1500;

    const expectedOffers30 = Math.round(applications * 0.25 + offers * 0.1);
    const expectedCAS30 = Math.round(offers * 0.3 + cas * 0.1);
    const expectedVisas30 = Math.round(cas * 0.25 + visas * 0.05);

    const expectedOffers60 = Math.round(applications * 0.45 + offers * 0.18);
    const expectedCAS60 = Math.round(offers * 0.5 + cas * 0.2);
    const expectedVisas60 = Math.round(cas * 0.45 + visas * 0.1);

    const expectedOffers90 = Math.round(applications * 0.65 + offers * 0.25);
    const expectedCAS90 = Math.round(offers * 0.7 + cas * 0.35);
    const expectedVisas90 = Math.round(cas * 0.65 + visas * 0.18);

    return {
      expectedOffers30,
      expectedCAS30,
      expectedVisas30,
      expectedOffers60,
      expectedCAS60,
      expectedVisas60,
      expectedOffers90,
      expectedCAS90,
      expectedVisas90,
      revenue30: expectedCAS30 * averageInvoice * 0.55 + expectedVisas30 * averageInvoice * 0.35,
      revenue60: expectedCAS60 * averageInvoice * 0.55 + expectedVisas60 * averageInvoice * 0.35,
      revenue90: expectedCAS90 * averageInvoice * 0.55 + expectedVisas90 * averageInvoice * 0.35,
    };
  }, [growth]);

  return (
    <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
      <div className="mb-5 flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.25em] text-emerald-300">Business Forecast</p>
          <h2 className="mt-2 text-2xl font-black text-white">30 / 60 / 90 Day Pipeline</h2>
          <p className="mt-1 text-sm text-slate-400">
            Lightweight founder forecast from applications, offers, CAS, visas, and invoice averages.
          </p>
        </div>
      </div>

      <div className="mb-5 grid gap-3 md:grid-cols-3">
        <ForecastCard label="30 Day Revenue" value={money(forecast.revenue30)} helper="near-term weighted pipeline" tone="cyan" />
        <ForecastCard label="60 Day Revenue" value={money(forecast.revenue60)} helper="mid-term weighted pipeline" tone="violet" />
        <ForecastCard label="90 Day Revenue" value={money(forecast.revenue90)} helper="quarter weighted pipeline" tone="emerald" />
      </div>

      <div className="mb-3 grid grid-cols-4 gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-3 text-xs font-black uppercase tracking-[0.2em] text-slate-500">
        <p>Metric</p>
        <p className="text-center">30D</p>
        <p className="text-center">60D</p>
        <p className="text-center">90D</p>
      </div>

      <div className="space-y-3">
        <ForecastRow label="Expected Offers" month30={forecast.expectedOffers30} month60={forecast.expectedOffers60} month90={forecast.expectedOffers90} />
        <ForecastRow label="Expected CAS" month30={forecast.expectedCAS30} month60={forecast.expectedCAS60} month90={forecast.expectedCAS90} />
        <ForecastRow label="Expected Visas" month30={forecast.expectedVisas30} month60={forecast.expectedVisas60} month90={forecast.expectedVisas90} />
      </div>

      <div className="mt-5 rounded-3xl border border-white/10 bg-slate-950/50 p-4">
        <p className="text-sm font-black text-white">Forecast note</p>
        <p className="mt-2 text-sm leading-6 text-slate-400">
          This is intentionally conservative and template-safe. Once real conversion history exists, we can replace these weighted assumptions
          with actual Zaifan conversion rates by country, counselor, course, university, and campaign source.
        </p>
      </div>
    </section>
  );
}
