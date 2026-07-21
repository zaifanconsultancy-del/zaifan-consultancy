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

function ForecastCard({ label, value, helper, tone = "orange" }) {
  const tones = {
    orange: "border-orange-300 bg-orange-50 text-orange-700",
    emerald: "border-emerald-300 bg-emerald-50 text-emerald-700",
    amber: "border-amber-300 bg-amber-50 text-amber-700",
    rose: "border-rose-300 bg-rose-50 text-rose-700",
    violet: "border-violet-300 bg-violet-50 text-violet-700",
  };

  return (
    <div className={`rounded-3xl border-2 p-5 shadow-[0_6px_18px_rgba(15,35,63,0.035)] ${tones[tone] || tones.orange}`}>
      <p className="text-xs font-black uppercase tracking-[0.24em]">{label}</p>
      <p className="mt-3 text-3xl font-black text-[#10233f]">{value}</p>
      {helper ? <p className="mt-2 text-sm font-medium text-slate-600">{helper}</p> : null}
    </div>
  );
}

function ForecastRow({ label, month30, month60, month90 }) {
  return (
    <div className="grid grid-cols-4 gap-3 rounded-3xl border border-slate-300 bg-white p-4 text-sm shadow-[0_4px_14px_rgba(15,35,63,0.03)]">
      <p className="font-black text-[#10233f]">{label}</p>
      <p className="text-center font-black text-orange-700">{month30}</p>
      <p className="text-center font-black text-violet-700">{month60}</p>
      <p className="text-center font-black text-emerald-700">{month90}</p>
    </div>
  );
}

export default function BusinessForecastPanel({ growth = {} }) {
  const forecast = useMemo(() => {
    const applications = safeNumber(growth.applications?.length);
    const offers = safeNumber(growth.offers?.length);
    const cas = safeNumber(growth.casRecords?.length);
    const visas = safeNumber(growth.visas?.length);
    const averageInvoice = growth.invoices?.length
      ? safeNumber(growth.invoicedRevenue) / growth.invoices.length
      : 1500;

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
      expectedOffers30, expectedCAS30, expectedVisas30,
      expectedOffers60, expectedCAS60, expectedVisas60,
      expectedOffers90, expectedCAS90, expectedVisas90,
      revenue30: expectedCAS30 * averageInvoice * 0.55 + expectedVisas30 * averageInvoice * 0.35,
      revenue60: expectedCAS60 * averageInvoice * 0.55 + expectedVisas60 * averageInvoice * 0.35,
      revenue90: expectedCAS90 * averageInvoice * 0.55 + expectedVisas90 * averageInvoice * 0.35,
    };
  }, [growth]);

  return (
    <section className="overflow-hidden rounded-3xl border-2 border-orange-300 bg-white shadow-[0_14px_36px_rgba(15,35,63,0.06)]">
      <div className="border-b border-orange-200 bg-[#102f5c] p-5 text-white">
        <p className="text-xs font-black uppercase tracking-[0.25em] text-orange-300">Business Forecast</p>
        <h2 className="mt-2 text-2xl font-black text-white">30 / 60 / 90 Day Pipeline</h2>
        <p className="mt-1 text-sm text-slate-200">
          Lightweight founder forecast from applications, offers, CAS, visas, and invoice averages.
        </p>
      </div>

      <div className="bg-[#fff8ee] p-5">
        <div className="mb-5 grid gap-3 md:grid-cols-3">
          <ForecastCard label="30 Day Revenue" value={money(forecast.revenue30)} helper="Near-term weighted pipeline" tone="orange" />
          <ForecastCard label="60 Day Revenue" value={money(forecast.revenue60)} helper="Mid-term weighted pipeline" tone="violet" />
          <ForecastCard label="90 Day Revenue" value={money(forecast.revenue90)} helper="Quarter weighted pipeline" tone="emerald" />
        </div>

        <div className="mb-3 grid grid-cols-4 gap-3 rounded-2xl border-2 border-slate-300 bg-white p-3 text-xs font-black uppercase tracking-[0.2em] text-slate-600">
          <p>Metric</p><p className="text-center">30D</p><p className="text-center">60D</p><p className="text-center">90D</p>
        </div>

        <div className="space-y-3">
          <ForecastRow label="Expected Offers" month30={forecast.expectedOffers30} month60={forecast.expectedOffers60} month90={forecast.expectedOffers90} />
          <ForecastRow label="Expected CAS" month30={forecast.expectedCAS30} month60={forecast.expectedCAS60} month90={forecast.expectedCAS90} />
          <ForecastRow label="Expected Visas" month30={forecast.expectedVisas30} month60={forecast.expectedVisas60} month90={forecast.expectedVisas90} />
        </div>

        <div className="mt-5 rounded-3xl border border-slate-300 bg-white p-4">
          <p className="text-sm font-black text-[#10233f]">Forecast note</p>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            This is intentionally conservative and template-safe. Once real conversion history exists, we can replace these weighted assumptions
            with actual Zaifan conversion rates by country, counselor, course, university, and campaign source.
          </p>
        </div>
      </div>
    </section>
  );
}