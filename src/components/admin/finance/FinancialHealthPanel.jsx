import React from "react";

function money(value) {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

function HealthSignal({ label, value, helper, status = "watch" }) {
  const tones = {
    healthy: "border-emerald-400/25 bg-emerald-500/10 text-emerald-100",
    watch: "border-amber-400/25 bg-amber-500/10 text-amber-100",
    risk: "border-rose-400/25 bg-rose-500/10 text-rose-100",
    info: "border-cyan-400/25 bg-cyan-500/10 text-cyan-100",
  };

  return (
    <div className={`rounded-3xl border p-4 ${tones[status] || tones.watch}`}>
      <p className="text-xs font-black uppercase tracking-[0.22em] opacity-70">{label}</p>
      <p className="mt-3 text-2xl font-black text-white">{value}</p>
      <p className="mt-2 text-sm leading-6 opacity-75">{helper}</p>
    </div>
  );
}

export default function FinancialHealthPanel({ finance = {}, compact = false }) {
  const totals = finance.totals || {};
  const forecast = finance.forecast || {};

  const cashStatus = totals.cashOnHand >= 0 ? "healthy" : "risk";
  const marginStatus = totals.margin >= 25 ? "healthy" : totals.margin >= 0 ? "watch" : "risk";
  const overdueStatus = totals.overdue > 0 ? "risk" : "healthy";
  const forecastStatus = forecast.day60 > ((totals.totalExpenses || 0) + (totals.totalCommissions || 0)) ? "healthy" : "watch";

  return (
    <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
      <div className="mb-5">
        <p className="text-xs font-black uppercase tracking-[0.25em] text-cyan-300">Financial Health</p>
        <h2 className="mt-2 text-2xl font-black text-white">Finance Risk Signals</h2>
        <p className="mt-1 text-sm text-slate-400">Founder-friendly signals for cash, margin, overdue revenue, forecast strength, and operational safety.</p>
      </div>

      <div className={compact ? "grid gap-3 md:grid-cols-2" : "grid gap-3 md:grid-cols-2 xl:grid-cols-4"}>
        <HealthSignal
          label="Health Score"
          value={`${totals.healthScore || 0}%`}
          helper="Combined cashflow, margin, forecast, overdue, and outstanding pressure."
          status={(totals.healthScore || 0) >= 70 ? "healthy" : (totals.healthScore || 0) >= 45 ? "watch" : "risk"}
        />
        <HealthSignal
          label="Cash Safety"
          value={money(totals.cashOnHand)}
          helper="Cash left after current expenses and commissions."
          status={cashStatus}
        />
        <HealthSignal
          label="Net Margin"
          value={`${totals.margin || 0}%`}
          helper="Profitability after operating costs and commission payouts."
          status={marginStatus}
        />
        <HealthSignal
          label="Overdue Risk"
          value={money(totals.overdue)}
          helper="Revenue that may need immediate recovery action."
          status={overdueStatus}
        />
        {!compact ? (
          <>
            <HealthSignal
              label="60 Day Forecast"
              value={money(forecast.day60)}
              helper="Expected cash from current application, offer, CAS and visa pipeline."
              status={forecastStatus}
            />
            <HealthSignal
              label="Outstanding"
              value={money(totals.outstanding)}
              helper="Potential revenue not yet collected."
              status={totals.outstanding > totals.collected && totals.outstanding > 0 ? "watch" : "info"}
            />
            <HealthSignal
              label="Expense Pressure"
              value={money(totals.totalExpenses)}
              helper="Operating cost requiring monthly control."
              status={totals.totalExpenses > totals.collected && totals.totalExpenses > 0 ? "risk" : "info"}
            />
            <HealthSignal
              label="Commission Pool"
              value={money(totals.totalCommissions)}
              helper="Agent, partner, or team payout exposure."
              status={totals.totalCommissions > totals.collected * 0.25 && totals.collected > 0 ? "watch" : "info"}
            />
          </>
        ) : null}
      </div>
    </section>
  );
}
