import React from "react";

function money(value) {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

function CashCard({ label, value, helper, tone = "cyan" }) {
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

function PipelineRow({ item, max }) {
  const width = max ? Math.max(4, Math.round((Number(item.value || 0) / max) * 100)) : 4;

  return (
    <div className="rounded-3xl border border-white/10 bg-slate-950/50 p-4">
      <div className="mb-2 flex items-center justify-between">
        <div>
          <p className="font-black text-white">{item.label}</p>
          <p className="text-xs text-slate-500">{item.count} records</p>
        </div>
        <p className="font-black text-emerald-100">{money(item.value)}</p>
      </div>
      <div className="h-3 overflow-hidden rounded-full bg-white/10">
        <div className="h-full rounded-full bg-white" style={{ width: `${width}%` }} />
      </div>
    </div>
  );
}

export default function CashflowCommandCenter({ finance = {}, compact = false }) {
  const totals = finance.totals || {};
  const pipeline = finance.pipeline || [];
  const maxPipeline = Math.max(...pipeline.map((item) => Number(item.value || 0)), 1);

  return (
    <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
      <div className="mb-5">
        <p className="text-xs font-black uppercase tracking-[0.25em] text-emerald-300">Cashflow Command</p>
        <h2 className="mt-2 text-2xl font-black text-white">Money In / Money Out</h2>
        <p className="mt-1 text-sm text-slate-400">
          Operational cashflow snapshot combining collected revenue, outstanding invoices, overdue risk, expenses, and commissions.
        </p>
      </div>

      <div className={compact ? "grid gap-3 md:grid-cols-3" : "grid gap-3 md:grid-cols-2 xl:grid-cols-5"}>
        <CashCard label="Cash On Hand" value={money(totals.cashOnHand)} helper="after expenses/commissions" tone={totals.cashOnHand >= 0 ? "emerald" : "rose"} />
        <CashCard label="Collected" value={money(totals.collected)} helper="payment inflow" tone="emerald" />
        <CashCard label="Outstanding" value={money(totals.outstanding)} helper="not collected yet" tone="amber" />
        {!compact ? (
          <>
            <CashCard label="Overdue" value={money(totals.overdue)} helper="cash risk" tone={totals.overdue > 0 ? "rose" : "emerald"} />
            <CashCard label="Outflow" value={money((totals.totalExpenses || 0) + (totals.totalCommissions || 0))} helper="expenses + commissions" tone="violet" />
          </>
        ) : null}
      </div>

      {!compact ? (
        <div className="mt-5 grid gap-3 lg:grid-cols-2">
          {pipeline.map((item) => <PipelineRow key={item.key} item={item} max={maxPipeline} />)}
        </div>
      ) : null}
    </section>
  );
}
