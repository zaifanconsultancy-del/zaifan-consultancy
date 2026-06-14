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

function CategoryBar({ item, max }) {
  const width = max ? Math.max(4, Math.round((Number(item.amount || 0) / max) * 100)) : 4;

  return (
    <div>
      <div className="mb-1 flex justify-between text-xs">
        <span className="font-bold text-slate-300">{item.name}</span>
        <span className="text-slate-500">{money(item.amount)}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-white/10">
        <div className="h-full rounded-full bg-white" style={{ width: `${width}%` }} />
      </div>
    </div>
  );
}

export default function ExpenseManagementPanel({ finance = {} }) {
  const [query, setQuery] = useState("");
  const rows = finance.expenseRows || [];
  const categories = finance.expenseCategories || [];

  const filtered = useMemo(() => {
    const search = query.trim().toLowerCase();
    if (!search) return rows;
    return rows.filter((item) => [item.title, item.category, item.status].map((value) => lower(value)).join(" ").includes(search));
  }, [rows, query]);

  const maxCategory = Math.max(...categories.map((item) => Number(item.amount || 0)), 1);

  return (
    <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
      <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.25em] text-rose-300">Expense Management</p>
          <h2 className="mt-2 text-2xl font-black text-white">Company Cost Control</h2>
          <p className="mt-1 text-sm text-slate-400">Track operating, marketing, technology, salary, and commission-related expense pressure.</p>
        </div>
        <span className="rounded-2xl border border-rose-400/20 bg-rose-500/10 px-4 py-2 text-xs font-black text-rose-100">
          {money(finance.totals?.totalExpenses)}
        </span>
      </div>

      <div className="mb-5 grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-3xl border border-white/10 bg-slate-950/50 p-4">
          <p className="mb-4 text-sm font-black text-white">Expense Categories</p>
          <div className="space-y-4">
            {categories.length ? categories.map((item) => <CategoryBar key={item.name} item={item} max={maxCategory} />) : (
              <p className="text-sm text-slate-500">No expense categories yet.</p>
            )}
          </div>
        </div>

        <div>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search expenses..."
            className="mb-3 w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500"
          />

          <div className="space-y-3">
            {filtered.length ? filtered.map((expense) => (
              <article key={expense.id} className="rounded-3xl border border-white/10 bg-slate-950/50 p-4">
                <div className="grid gap-3 lg:grid-cols-[1fr_0.5fr_0.4fr] lg:items-center">
                  <div>
                    <p className="font-black text-white">{expense.title}</p>
                    <p className="mt-1 text-xs text-slate-500">{expense.category}</p>
                  </div>
                  <p className="text-sm font-black text-rose-100">{money(expense.amount)}</p>
                  <span className="w-fit rounded-full border border-cyan-400/25 bg-cyan-400/10 px-3 py-1 text-xs font-black text-cyan-100">{expense.status}</span>
                </div>
              </article>
            )) : (
              <div className="rounded-3xl border border-dashed border-white/15 p-6 text-center">
                <p className="text-sm font-black text-white">No expense records yet.</p>
                <p className="mt-2 text-sm text-slate-400">Expense records will populate after finance tables are linked.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
