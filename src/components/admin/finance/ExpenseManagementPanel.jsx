import React, { useMemo, useState } from "react";
import {
  AlertTriangle,
  BadgeCheck,
  CalendarDays,
  Database,
  Filter,
  Layers3,
  Receipt,
  Search,
  ShieldCheck,
  TrendingDown,
  WalletCards,
  X,
} from "lucide-react";

function safeArray(value) {
  return Array.isArray(value) ? value.filter(Boolean) : [];
}

function safeNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function normalize(value = "") {
  return String(value || "").trim().toLowerCase();
}

function formatMoney(value, currency = "GBP") {
  if (
    value === null ||
    value === undefined ||
    !Number.isFinite(Number(value))
  ) {
    return "Unavailable";
  }

  const code = String(currency || "GBP").trim().toUpperCase() || "GBP";

  try {
    return new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency: code,
      maximumFractionDigits: 0,
    }).format(Number(value));
  } catch {
    return `${code} ${Math.round(Number(value)).toLocaleString("en-GB")}`;
  }
}

function formatDate(value) {
  if (!value) return "No date";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function statusTone(status = "") {
  const value = normalize(status);

  if (
    value.includes("approved") ||
    value.includes("paid") ||
    value.includes("completed") ||
    value.includes("recorded") ||
    value.includes("cleared")
  ) {
    return "border-[#34D399] bg-[#F0FFF8] text-emerald-700";
  }

  if (
    value.includes("pending") ||
    value.includes("review") ||
    value.includes("await")
  ) {
    return "border-[#F59E0B] bg-[#FFF8E8] text-amber-800";
  }

  if (
    value.includes("rejected") ||
    value.includes("failed") ||
    value.includes("overdue")
  ) {
    return "border-[#FB7185] bg-[#FFF4F4] text-red-700";
  }

  return "border-[#C9D7E6] bg-[#FFF8EF] text-slate-600";
}

function categoryTone(index) {
  const tones = [
    "border-[#C9D7E6] bg-[#FFFDF8]",
    "border-[#60A5FA] bg-[#F2F7FF]",
    "border-[#34D399] bg-[#F0FFF8]",
    "border-[#F59E0B] bg-[#FFF8E8]",
    "border-[#60A5FA] bg-[#F2F7FF]",
  ];

  return tones[index % tones.length];
}

function CategoryCard({ item, max, currency, index }) {
  const amount = safeNumber(item.amount);
  const width =
    max > 0 ? Math.max(4, Math.round((amount / max) * 100)) : 0;

  return (
    <div
      className={`rounded-[1.35rem] border-[3px] p-4 ${categoryTone(index)}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="break-words text-sm font-black text-[#10233F]">
            {item.name || "Uncategorised"}
          </p>
          <p className="mt-1 text-xs font-semibold text-slate-500">
            Recorded expense category
          </p>
        </div>

        <p className="shrink-0 text-sm font-black text-[#123865]">
          {formatMoney(amount, currency)}
        </p>
      </div>

      <div className="mt-4 h-3 overflow-hidden rounded-full border-2 border-[#E1E8F0] bg-white">
        <div
          className="h-full rounded-full bg-[#F97316] transition-[width] duration-300"
          style={{ width: `${width}%` }}
        />
      </div>
    </div>
  );
}

function ExpenseRow({ expense, currency }) {
  return (
    <article className="rounded-[1.45rem] border-[3px] border-[#C9D7E6] bg-[#FFFDF8] p-4 shadow-[0_6px_18px_rgba(15,35,63,0.04)]">
      <div className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1fr)_11rem_10rem_9rem] xl:items-center">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h4 className="break-words font-black text-[#10233F]">
              {expense.title || "Untitled expense"}
            </h4>

            <span className="rounded-full border-2 border-[#C9D7E6] bg-[#FFF8EF] px-2.5 py-1 text-[8px] font-black uppercase tracking-[0.07em] text-slate-600">
              {expense.category || "General"}
            </span>
          </div>

          <p className="mt-2 text-xs font-semibold text-slate-500">
            {formatDate(expense.date)}
          </p>
        </div>

        <div>
          <p className="text-[8px] font-black uppercase tracking-[0.1em] text-slate-500">
            Amount
          </p>
          <p className="mt-1 text-base font-black text-[#123865]">
            {formatMoney(expense.amount, expense.currency || currency)}
          </p>
        </div>

        <div>
          <p className="text-[8px] font-black uppercase tracking-[0.1em] text-slate-500">
            Evidence
          </p>
          <span className="mt-1 inline-flex rounded-full border-2 border-[#60A5FA] bg-[#F2F7FF] px-2.5 py-1 text-[8px] font-black uppercase tracking-[0.07em] text-blue-700">
            {expense.estimated ? "Estimated" : "Recorded"}
          </span>
        </div>

        <div>
          <p className="text-[8px] font-black uppercase tracking-[0.1em] text-slate-500">
            Status
          </p>
          <span
            className={`mt-1 inline-flex w-fit rounded-lg border-2 px-2.5 py-1 text-[8px] font-black uppercase tracking-[0.07em] ${statusTone(
              expense.status
            )}`}
          >
            {expense.status || "Recorded"}
          </span>
        </div>
      </div>
    </article>
  );
}

function EmptyExpenses({ queryActive }) {
  return (
    <div className="rounded-[1.55rem] border-[3px] border-dashed border-[#C9D7E6] bg-white p-8 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border-2 border-[#C9D7E6] bg-[#FFFDF8] text-[#B84F0E]">
        <Receipt size={24} />
      </div>

      <h3 className="mt-4 text-xl font-black text-[#10233F]">
        {queryActive ? "No expenses match this filter" : "No expense records yet"}
      </h3>

      <p className="mx-auto mt-2 max-w-xl text-sm font-semibold leading-6 text-slate-600">
        {queryActive
          ? "Clear or change the search to inspect the rest of the recorded expense ledger."
          : "Zaifan will not invent operating expenses. Real expense records will appear here once the finance source is connected or populated."}
      </p>
    </div>
  );
}

export default function ExpenseManagementPanel({ finance = {} }) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const rows = safeArray(finance.expenseRows);
  const categories = safeArray(finance.expenseCategories);
  const totals = finance.totals || {};
  const currency = finance.currency || "GBP";
  const evidence = finance.evidence || {};

  const availableStatuses = useMemo(() => {
    const values = new Set();

    rows.forEach((row) => {
      const value = normalize(row.status);
      if (value) values.add(value);
    });

    return [...values].sort();
  }, [rows]);

  const availableCategories = useMemo(() => {
    const values = new Set();

    rows.forEach((row) => {
      const value = String(row.category || "").trim();
      if (value) values.add(value);
    });

    return [...values].sort((a, b) => a.localeCompare(b));
  }, [rows]);

  const filtered = useMemo(() => {
    const search = normalize(query);

    return rows.filter((item) => {
      if (
        statusFilter !== "all" &&
        normalize(item.status) !== statusFilter
      ) {
        return false;
      }

      if (
        categoryFilter !== "all" &&
        String(item.category || "") !== categoryFilter
      ) {
        return false;
      }

      if (!search) return true;

      return [
        item.title,
        item.category,
        item.status,
        item.date,
        item.amount,
      ]
        .map(normalize)
        .some((value) => value.includes(search));
    });
  }, [rows, query, statusFilter, categoryFilter]);

  const metrics = useMemo(() => {
    const total = rows.reduce(
      (sum, item) => sum + safeNumber(item.amount),
      0
    );

    const recorded = rows
      .filter((item) => !item.estimated)
      .reduce((sum, item) => sum + safeNumber(item.amount), 0);

    const estimated = rows
      .filter((item) => item.estimated)
      .reduce((sum, item) => sum + safeNumber(item.amount), 0);

    const average = rows.length ? Math.round(total / rows.length) : 0;

    const largest = rows.length
      ? [...rows].sort(
          (a, b) => safeNumber(b.amount) - safeNumber(a.amount)
        )[0]
      : null;

    return {
      total,
      recorded,
      estimated,
      average,
      largest,
    };
  }, [rows]);

  const maxCategory = useMemo(() => {
    const amounts = categories
      .map((item) => safeNumber(item.amount))
      .filter((value) => value > 0);

    return amounts.length ? Math.max(...amounts) : 0;
  }, [categories]);

  const queryActive =
    Boolean(query.trim()) ||
    statusFilter !== "all" ||
    categoryFilter !== "all";

  const clearFilters = () => {
    setQuery("");
    setStatusFilter("all");
    setCategoryFilter("all");
  };

  return (
    <section className="min-w-0 overflow-hidden rounded-[1.9rem] border-[3px] border-[#C9D7E6] bg-[#FFFDF8] shadow-[0_14px_38px_rgba(15,35,63,0.07)]">
      <div className="grid border-b-[3px] border-[#F97316] xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)]">
        <div className="bg-[#123865] p-5 text-white sm:p-6">
          <div className="inline-flex items-center gap-2 rounded-full border-2 border-[#F97316]/30 bg-orange-400/10 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.12em] text-orange-300">
            <TrendingDown size={12} />
            Expense Management
          </div>

          <h2 className="mt-3 text-2xl font-black text-white sm:text-3xl">
            Company Cost Control
          </h2>

          <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-200">
            Real recorded operating expenses grouped by category, status and
            date. Missing costs remain missing instead of being replaced with
            assumed spend.
          </p>
        </div>

        <div className="bg-[#FF5A0A] p-5 text-white sm:p-6">
          <p className="text-[9px] font-black uppercase tracking-[0.12em] text-white">
            Recorded Expense Base
          </p>

          <p className="mt-2 break-words text-3xl font-black text-white">
            {formatMoney(totals.totalExpenses, currency)}
          </p>

          <p className="mt-2 text-xs font-semibold leading-5 text-orange-50">
            {rows.length} expense record{rows.length === 1 ? "" : "s"} currently
            feeding Finance OS.
          </p>

          <span className="mt-3 inline-flex rounded-full border-2 border-white/25 bg-white/10 px-3 py-1 text-[8px] font-black uppercase tracking-[0.08em] text-white">
            {evidence.hasExpenses ? "Live expense source" : "No expense source"}
          </span>
        </div>
      </div>

      <div className="space-y-5 p-4 sm:p-5">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-[1.4rem] border-[3px] border-[#FB7185] bg-[#FFF4F4] p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[9px] font-black uppercase tracking-[0.11em] text-slate-500">
                  Total Recorded
                </p>
                <p className="mt-2 text-2xl font-black text-[#10233F]">
                  {formatMoney(metrics.recorded, currency)}
                </p>
              </div>
              <WalletCards size={18} className="text-red-700" />
            </div>
            <p className="mt-2 text-xs font-semibold leading-5 text-slate-600">
              Real expense rows included in operating P&L.
            </p>
          </div>

          <div className="rounded-[1.4rem] border-[3px] border-[#60A5FA] bg-[#F2F7FF] p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[9px] font-black uppercase tracking-[0.11em] text-slate-500">
                  Average Expense
                </p>
                <p className="mt-2 text-2xl font-black text-[#10233F]">
                  {rows.length
                    ? formatMoney(metrics.average, currency)
                    : "Unavailable"}
                </p>
              </div>
              <Layers3 size={18} className="text-blue-700" />
            </div>
            <p className="mt-2 text-xs font-semibold leading-5 text-slate-600">
              Simple average across current expense records.
            </p>
          </div>

          <div className="rounded-[1.4rem] border-[3px] border-[#F59E0B] bg-[#FFF8E8] p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[9px] font-black uppercase tracking-[0.11em] text-slate-500">
                  Largest Expense
                </p>
                <p className="mt-2 break-words text-lg font-black text-[#10233F]">
                  {metrics.largest
                    ? formatMoney(metrics.largest.amount, currency)
                    : "Unavailable"}
                </p>
              </div>
              <AlertTriangle size={18} className="text-amber-700" />
            </div>
            <p className="mt-2 break-words text-xs font-semibold leading-5 text-slate-600">
              {metrics.largest?.title || "No expense record available."}
            </p>
          </div>

          <div className="rounded-[1.4rem] border-[3px] border-[#34D399] bg-[#F0FFF8] p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[9px] font-black uppercase tracking-[0.11em] text-slate-500">
                  Ledger Integrity
                </p>
                <p className="mt-2 text-lg font-black text-[#10233F]">
                  {metrics.estimated > 0 ? "Mixed evidence" : "Recorded only"}
                </p>
              </div>
              {metrics.estimated > 0 ? (
                <AlertTriangle size={18} className="text-amber-700" />
              ) : (
                <BadgeCheck size={18} className="text-emerald-700" />
              )}
            </div>
            <p className="mt-2 text-xs font-semibold leading-5 text-slate-600">
              {metrics.estimated > 0
                ? `${formatMoney(
                    metrics.estimated,
                    currency
                  )} of estimated rows are kept separate.`
                : "No estimated expense rows are mixed into this ledger."}
            </p>
          </div>
        </div>

        <div className="grid gap-4 xl:grid-cols-[0.8fr_1.2fr]">
          <section className="rounded-[1.65rem] border-[3px] border-[#F97316] bg-[#FFF8EF] p-4 sm:p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[9px] font-black uppercase tracking-[0.12em] text-[#B84F0E]">
                  Cost Distribution
                </p>
                <h3 className="mt-1 text-xl font-black text-[#10233F]">
                  Expense Categories
                </h3>
                <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">
                  Category totals are derived from the current recorded expense
                  ledger only.
                </p>
              </div>

              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border-2 border-[#F97316] bg-white text-[#B84F0E]">
                <Layers3 size={17} />
              </div>
            </div>

            {categories.length ? (
              <div className="mt-4 space-y-3">
                {categories.map((item, index) => (
                  <CategoryCard
                    key={`${item.name}-${index}`}
                    item={item}
                    max={maxCategory}
                    currency={currency}
                    index={index}
                  />
                ))}
              </div>
            ) : (
              <div className="mt-4 rounded-[1.4rem] border-[3px] border-dashed border-[#C9D7E6] bg-white p-6 text-center">
                <Database className="mx-auto h-8 w-8 text-slate-400" />
                <p className="mt-3 font-black text-[#10233F]">
                  No expense categories yet
                </p>
                <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">
                  Categories will appear automatically from real expense rows.
                </p>
              </div>
            )}
          </section>

          <section className="rounded-[1.65rem] border-[3px] border-[#C9D7E6] bg-white p-4 sm:p-5">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-[9px] font-black uppercase tracking-[0.12em] text-slate-500">
                  Expense Ledger
                </p>
                <h3 className="mt-1 text-xl font-black text-[#10233F]">
                  Recorded Expense Records
                </h3>
              </div>

              <span className="w-fit rounded-full border-2 border-[#C9D7E6] bg-[#FFF8EF] px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.08em] text-slate-600">
                {filtered.length}/{rows.length} visible
              </span>
            </div>

            <div className="mt-4 grid gap-3 lg:grid-cols-[1fr_auto_auto_auto]">
              <label className="relative block">
                <Search
                  size={16}
                  className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search title, category, status, date..."
                  className="min-h-11 w-full rounded-xl border-2 border-[#C9D7E6] bg-white pl-11 pr-4 text-sm font-semibold text-[#10233F] outline-none placeholder:text-slate-400 transition focus:border-[#F97316] focus:ring-4 focus:ring-orange-100"
                />
              </label>

              <select
                value={categoryFilter}
                onChange={(event) =>
                  setCategoryFilter(event.target.value)
                }
                className="min-h-11 rounded-xl border-2 border-[#C9D7E6] bg-white px-3 text-sm font-black text-[#10233F] outline-none focus:border-[#F97316]"
              >
                <option value="all">All Categories</option>
                {availableCategories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>

              <select
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(event.target.value)
                }
                className="min-h-11 rounded-xl border-2 border-[#C9D7E6] bg-white px-3 text-sm font-black text-[#10233F] outline-none focus:border-[#F97316]"
              >
                <option value="all">All Statuses</option>
                {availableStatuses.map((status) => (
                  <option key={status} value={status}>
                    {status.replaceAll("_", " ")}
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={clearFilters}
                disabled={!queryActive}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border-2 border-[#C9D7E6] bg-[#FFF8EF] px-3 text-xs font-black text-slate-700 transition hover:border-[#F97316] hover:text-[#B84F0E] disabled:cursor-not-allowed disabled:opacity-40"
              >
                <X size={13} />
                Clear
              </button>
            </div>

            <div className="mt-4 space-y-3">
              {filtered.length ? (
                filtered.map((expense) => (
                  <ExpenseRow
                    key={expense.id}
                    expense={expense}
                    currency={currency}
                  />
                ))
              ) : (
                <EmptyExpenses queryActive={queryActive} />
              )}
            </div>
          </section>
        </div>

        <div className="grid gap-3 lg:grid-cols-3">
          <div className="rounded-[1.35rem] border-[3px] border-[#60A5FA] bg-[#F2F7FF] p-4">
            <div className="flex items-start gap-3">
              <Database size={17} className="mt-0.5 shrink-0 text-blue-700" />
              <div>
                <p className="text-[8px] font-black uppercase tracking-[0.11em] text-slate-500">
                  Data Source
                </p>
                <p className="mt-1 font-black text-[#10233F]">
                  {evidence.hasExpenses ? "Connected" : "Not connected"}
                </p>
                <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">
                  This panel reads only Finance OS expense evidence.
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-[1.35rem] border-[3px] border-[#34D399] bg-[#F0FFF8] p-4">
            <div className="flex items-start gap-3">
              <ShieldCheck
                size={17}
                className="mt-0.5 shrink-0 text-emerald-700"
              />
              <div>
                <p className="text-[8px] font-black uppercase tracking-[0.11em] text-slate-500">
                  P&L Treatment
                </p>
                <p className="mt-1 font-black text-[#10233F]">
                  Recorded expenses only
                </p>
                <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">
                  Estimated costs are not silently blended into realised profit.
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-[1.35rem] border-[3px] border-[#F59E0B] bg-[#FFF8E8] p-4">
            <div className="flex items-start gap-3">
              <CalendarDays
                size={17}
                className="mt-0.5 shrink-0 text-amber-700"
              />
              <div>
                <p className="text-[8px] font-black uppercase tracking-[0.11em] text-slate-500">
                  Period Caveat
                </p>
                <p className="mt-1 font-black text-[#10233F]">
                  Lifetime/current snapshot
                </p>
                <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">
                  Monthly accounting periods require explicit period/date filters
                  or a dedicated accounting ledger later.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
