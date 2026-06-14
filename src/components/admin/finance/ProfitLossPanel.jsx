import React from "react";

function money(value) {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

function PLRow({ label, value, helper, type = "neutral" }) {
  const color = type === "income" ? "text-emerald-100" : type === "expense" ? "text-rose-100" : value >= 0 ? "text-emerald-100" : "text-rose-100";

  return (
    <div className="grid gap-3 rounded-3xl border border-white/10 bg-slate-950/50 p-4 md:grid-cols-[1fr_180px] md:items-center">
      <div>
        <p className="font-black text-white">{label}</p>
        {helper ? <p className="mt-1 text-xs text-slate-500">{helper}</p> : null}
      </div>
      <p className={`text-right text-xl font-black ${color}`}>{money(value)}</p>
    </div>
  );
}

export default function ProfitLossPanel({ finance = {}, compact = false }) {
  const totals = finance.totals || {};
  const outflow = (totals.totalExpenses || 0) + (totals.totalCommissions || 0);

  return (
    <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
      <div className="mb-5">
        <p className="text-xs font-black uppercase tracking-[0.25em] text-emerald-300">Profit & Loss</p>
        <h2 className="mt-2 text-2xl font-black text-white">Founder P&L Snapshot</h2>
        <p className="mt-1 text-sm text-slate-400">Simple operating P&L from collected revenue, commissions, expenses, profit, and margin.</p>
      </div>

      <div className="space-y-3">
        <PLRow label="Revenue Collected" value={totals.collected || 0} helper="Confirmed student payments" type="income" />
        {!compact ? <PLRow label="Outstanding Revenue" value={totals.outstanding || 0} helper="Potential but not collected yet" type="income" /> : null}
        <PLRow label="Operating Expenses" value={-(totals.totalExpenses || 0)} helper="Marketing, salaries, tools, operations" type="expense" />
        <PLRow label="Commissions" value={-(totals.totalCommissions || 0)} helper="Agent and partner payouts" type="expense" />
        {!compact ? <PLRow label="Total Outflow" value={-outflow} helper="Expenses + commissions" type="expense" /> : null}
        <PLRow label="Gross Profit" value={totals.grossProfit || 0} helper="Collected revenue minus commissions" />
        <PLRow label="Net Profit" value={totals.netProfit || 0} helper={`${totals.margin || 0}% net margin`} />
      </div>
    </section>
  );
}
