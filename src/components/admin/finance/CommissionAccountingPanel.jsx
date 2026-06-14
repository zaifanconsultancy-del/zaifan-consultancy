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

function statusTone(status = "") {
  const value = lower(status);
  if (value.includes("paid")) return "border-emerald-400/25 bg-emerald-400/10 text-emerald-100";
  if (value.includes("pending")) return "border-amber-400/25 bg-amber-400/10 text-amber-100";
  if (value.includes("estimate")) return "border-cyan-400/25 bg-cyan-400/10 text-cyan-100";
  return "border-slate-400/20 bg-white/[0.04] text-slate-200";
}

export default function CommissionAccountingPanel({ finance = {} }) {
  const [filter, setFilter] = useState("all");
  const rows = finance.commissionRows || [];

  const filtered = useMemo(() => {
    if (filter === "all") return rows;
    return rows.filter((item) => lower(item.status).includes(filter) || lower(item.type).includes(filter));
  }, [rows, filter]);

  const totals = useMemo(() => {
    const pending = rows.filter((item) => lower(item.status).includes("pending") || lower(item.status).includes("estimate")).reduce((sum, item) => sum + Number(item.amount || 0), 0);
    const paid = rows.filter((item) => lower(item.status).includes("paid")).reduce((sum, item) => sum + Number(item.amount || 0), 0);
    const agent = rows.filter((item) => lower(item.type).includes("agent")).reduce((sum, item) => sum + Number(item.amount || 0), 0);
    return { pending, paid, agent };
  }, [rows]);

  return (
    <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
      <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.25em] text-violet-300">Commission Accounting</p>
          <h2 className="mt-2 text-2xl font-black text-white">Partner / Team Payouts</h2>
          <p className="mt-1 text-sm text-slate-400">Agent commissions, counselor bonuses, partner payouts, pending and paid amounts.</p>
        </div>

        <div className="flex flex-wrap gap-2">
          {["all", "pending", "paid", "agent"].map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setFilter(item)}
              className={`rounded-2xl px-4 py-2 text-xs font-black ${
                filter === item ? "bg-white text-slate-950" : "border border-white/10 bg-white/[0.04] text-slate-300"
              }`}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-5 grid gap-3 md:grid-cols-3">
        <div className="rounded-3xl border border-amber-400/20 bg-amber-500/10 p-5">
          <p className="text-xs font-black uppercase tracking-[0.24em] text-slate-400">Pending</p>
          <p className="mt-3 text-3xl font-black text-white">{money(totals.pending)}</p>
        </div>
        <div className="rounded-3xl border border-emerald-400/20 bg-emerald-500/10 p-5">
          <p className="text-xs font-black uppercase tracking-[0.24em] text-slate-400">Paid</p>
          <p className="mt-3 text-3xl font-black text-white">{money(totals.paid)}</p>
        </div>
        <div className="rounded-3xl border border-violet-400/20 bg-violet-500/10 p-5">
          <p className="text-xs font-black uppercase tracking-[0.24em] text-slate-400">Agent Pool</p>
          <p className="mt-3 text-3xl font-black text-white">{money(totals.agent)}</p>
        </div>
      </div>

      <div className="space-y-3">
        {filtered.length ? filtered.map((row) => (
          <article key={row.id} className="rounded-3xl border border-white/10 bg-slate-950/50 p-4">
            <div className="grid gap-3 lg:grid-cols-[1fr_0.4fr_0.5fr_0.4fr] lg:items-center">
              <div>
                <p className="font-black text-white">{row.partner}</p>
                <p className="mt-1 text-xs text-slate-500">{row.student}</p>
              </div>
              <p className="text-sm text-slate-300">{row.type}</p>
              <p className="text-sm font-black text-violet-100">{money(row.amount)}</p>
              <span className={`w-fit rounded-full border px-3 py-1 text-xs font-black ${statusTone(row.status)}`}>{row.status}</span>
            </div>
          </article>
        )) : (
          <div className="rounded-3xl border border-dashed border-white/15 p-6 text-center">
            <p className="text-sm font-black text-white">No commission records yet.</p>
            <p className="mt-2 text-sm text-slate-400">Commission records will populate from Agent OS and finance tables.</p>
          </div>
        )}
      </div>
    </section>
  );
}
