import React, { useMemo, useState } from "react";
import {
  AlertTriangle,
  BadgeCheck,
  CircleDollarSign,
  Database,
  Filter,
  Landmark,
  Search,
  ShieldCheck,
  UsersRound,
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

function statusTone(status = "") {
  const value = normalize(status);

  if (
    value.includes("paid") ||
    value.includes("settled") ||
    value.includes("completed") ||
    value.includes("cleared")
  ) {
    return "border-[#34D399] bg-[#F0FFF8] text-emerald-700";
  }

  if (
    value.includes("pending") ||
    value.includes("due") ||
    value.includes("review")
  ) {
    return "border-[#F59E0B] bg-[#FFF8E8] text-amber-800";
  }

  if (
    value.includes("estimate") ||
    value.includes("projected") ||
    value.includes("expected")
  ) {
    return "border-[#60A5FA] bg-[#F2F7FF] text-blue-700";
  }

  if (
    value.includes("failed") ||
    value.includes("rejected") ||
    value.includes("overdue")
  ) {
    return "border-[#FB7185] bg-[#FFF4F4] text-red-700";
  }

  return "border-[#C9D7E6] bg-[#FFF8EF] text-slate-600";
}

function typeTone(type = "") {
  const value = normalize(type);

  if (value.includes("counselor")) {
    return "border-[#60A5FA] bg-[#F2F7FF] text-blue-700";
  }

  if (value.includes("agent")) {
    return "border-[#9B6CFF] bg-[#F8F5FF] text-violet-700";
  }

  if (value.includes("partner")) {
    return "border-[#F97316] bg-[#FFF4E8] text-orange-700";
  }

  return "border-[#C9D7E6] bg-[#FFF8EF] text-slate-600";
}

function LedgerMetric({
  label,
  value,
  helper,
  tone = "orange",
  icon: Icon,
  badge = "",
}) {
  const tones = {
    navy: "border-[#123865] bg-[#123865]",
    orange: "border-[#F97316] bg-[#FFF4E8]",
    green: "border-[#34D399] bg-[#F0FFF8]",
    amber: "border-[#F59E0B] bg-[#FFF8E8]",
    red: "border-[#FB7185] bg-[#FFF4F4]",
    blue: "border-[#60A5FA] bg-[#F2F7FF]",
    violet: "border-[#9B6CFF] bg-[#F8F5FF]",
  };

  const dark = tone === "navy";

  return (
    <div
      className={`rounded-[1.4rem] border-[3px] p-4 shadow-[0_7px_20px_rgba(15,35,63,0.05)] ${
        tones[tone] || tones.orange
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p
            className={`text-[9px] font-black uppercase tracking-[0.11em] ${
              dark ? "text-orange-300" : "text-slate-500"
            }`}
          >
            {label}
          </p>

          <p
            className={`mt-2 break-words text-2xl font-black ${
              dark ? "text-white" : "text-[#10233F]"
            }`}
          >
            {value}
          </p>
        </div>

        {Icon ? (
          <div
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border-2 ${
              dark
                ? "border-white/20 bg-white/10 text-orange-200"
                : "border-[#123865]/15 bg-white text-[#123865]"
            }`}
          >
            <Icon size={16} />
          </div>
        ) : null}
      </div>

      <p
        className={`mt-2 text-xs font-semibold leading-5 ${
          dark ? "text-slate-200" : "text-slate-600"
        }`}
      >
        {helper}
      </p>

      {badge ? (
        <span
          className={`mt-3 inline-flex rounded-full border-2 px-2.5 py-1 text-[8px] font-black uppercase tracking-[0.08em] ${
            dark
              ? "border-white/20 bg-white/10 text-white"
              : "border-[#C9D7E6] bg-white text-slate-600"
          }`}
        >
          {badge}
        </span>
      ) : null}
    </div>
  );
}

function CommissionRow({ row, currency }) {
  const rowCurrency = row.currency || currency;
  const estimated = Boolean(row.estimated);

  return (
    <article className="rounded-[1.45rem] border-[3px] border-[#C9D7E6] bg-white p-4 shadow-[0_6px_18px_rgba(15,35,63,0.04)]">
      <div className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1fr)_11rem_10rem_9rem] xl:items-center">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h4 className="break-words font-black text-[#10233F]">
              {row.partner || "Unknown partner"}
            </h4>

            <span
              className={`rounded-full border-2 px-2.5 py-1 text-[8px] font-black uppercase tracking-[0.07em] ${typeTone(
                row.type
              )}`}
            >
              {row.type || "Commission"}
            </span>
          </div>

          <p className="mt-2 break-words text-xs font-semibold text-slate-500">
            {row.student || "No linked student"}
          </p>
        </div>

        <div>
          <p className="text-[8px] font-black uppercase tracking-[0.1em] text-slate-500">
            Amount
          </p>
          <p className="mt-1 text-base font-black text-[#123865]">
            {formatMoney(row.amount, rowCurrency)}
          </p>
        </div>

        <div>
          <p className="text-[8px] font-black uppercase tracking-[0.1em] text-slate-500">
            Evidence
          </p>
          <span
            className={`mt-1 inline-flex rounded-full border-2 px-2.5 py-1 text-[8px] font-black uppercase tracking-[0.07em] ${
              estimated
                ? "border-[#F59E0B] bg-[#FFF8E8] text-amber-800"
                : "border-[#34D399] bg-[#F0FFF8] text-emerald-700"
            }`}
          >
            {estimated ? "Estimated" : "Recorded"}
          </span>
        </div>

        <div>
          <p className="text-[8px] font-black uppercase tracking-[0.1em] text-slate-500">
            Status
          </p>
          <span
            className={`mt-1 inline-flex w-fit rounded-full border-2 px-2.5 py-1 text-[8px] font-black uppercase tracking-[0.07em] ${statusTone(
              row.status
            )}`}
          >
            {row.status || (estimated ? "Estimated" : "Pending")}
          </span>
        </div>
      </div>
    </article>
  );
}

function EmptyCommissionState({ filtered }) {
  return (
    <div className="rounded-[1.55rem] border-[3px] border-dashed border-[#C9D7E6] bg-white p-8 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border-2 border-[#F97316] bg-[#FFF4E8] text-orange-700">
        <CircleDollarSign size={24} />
      </div>

      <h3 className="mt-4 text-xl font-black text-[#10233F]">
        {filtered ? "No commission records match" : "No commission records yet"}
      </h3>

      <p className="mx-auto mt-2 max-w-xl text-sm font-semibold leading-6 text-slate-600">
        {filtered
          ? "Change the search or filters to inspect the remaining commission ledger."
          : "Real partner, agent or counselor commission records will appear here when Finance OS receives them."}
      </p>
    </div>
  );
}

export default function CommissionAccountingPanel({ finance = {} }) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [evidenceFilter, setEvidenceFilter] = useState("all");

  const rows = safeArray(finance.commissionRows);
  const totals = finance.totals || {};
  const currency = finance.currency || "GBP";
  const evidence = finance.evidence || {};

  const filtered = useMemo(() => {
    const search = normalize(query);

    return rows.filter((item) => {
      if (
        statusFilter !== "all" &&
        normalize(item.status) !== statusFilter
      ) {
        return false;
      }

      if (typeFilter !== "all" && normalize(item.type) !== typeFilter) {
        return false;
      }

      if (
        evidenceFilter === "recorded" &&
        Boolean(item.estimated)
      ) {
        return false;
      }

      if (
        evidenceFilter === "estimated" &&
        !Boolean(item.estimated)
      ) {
        return false;
      }

      if (!search) return true;

      return [
        item.partner,
        item.student,
        item.type,
        item.status,
        item.amount,
      ]
        .map(normalize)
        .some((value) => value.includes(search));
    });
  }, [rows, query, statusFilter, typeFilter, evidenceFilter]);

  const availableStatuses = useMemo(() => {
    const values = new Set();

    rows.forEach((row) => {
      const value = normalize(row.status);
      if (value) values.add(value);
    });

    return [...values].sort();
  }, [rows]);

  const availableTypes = useMemo(() => {
    const values = new Set();

    rows.forEach((row) => {
      const value = normalize(row.type);
      if (value) values.add(value);
    });

    return [...values].sort();
  }, [rows]);

  const metrics = useMemo(() => {
    let recorded = 0;
    let estimated = 0;
    let paid = 0;
    let pending = 0;

    rows.forEach((row) => {
      const amount = safeNumber(row.amount);
      const status = normalize(row.status);

      if (row.estimated) estimated += amount;
      else recorded += amount;

      if (
        status.includes("paid") ||
        status.includes("settled") ||
        status.includes("completed") ||
        status.includes("cleared")
      ) {
        paid += amount;
      }

      if (
        status.includes("pending") ||
        status.includes("due") ||
        status.includes("review")
      ) {
        pending += amount;
      }
    });

    const recordedRows = rows.filter((row) => !row.estimated);

    const largestRecorded = recordedRows.length
      ? [...recordedRows].sort(
          (a, b) => safeNumber(b.amount) - safeNumber(a.amount)
        )[0]
      : null;

    return {
      recorded,
      estimated,
      paid,
      pending,
      largestRecorded,
      recordedCount: recordedRows.length,
      estimatedCount: rows.filter((row) => row.estimated).length,
    };
  }, [rows]);

  const filtersActive =
    Boolean(query.trim()) ||
    statusFilter !== "all" ||
    typeFilter !== "all" ||
    evidenceFilter !== "all";

  const clearFilters = () => {
    setQuery("");
    setStatusFilter("all");
    setTypeFilter("all");
    setEvidenceFilter("all");
  };

  return (
    <section className="min-w-0 overflow-hidden rounded-[1.9rem] border-[3px] border-[#C9D7E6] bg-[#FFFDF8] shadow-[0_14px_38px_rgba(15,35,63,0.07)]">
      <div className="grid border-b-[3px] border-[#F97316] xl:grid-cols-[minmax(0,1.2fr)_minmax(18rem,0.8fr)]">
        <div className="bg-[#123865] p-5 text-white sm:p-6">
          <div className="inline-flex items-center gap-2 rounded-full border-2 border-orange-300/30 bg-orange-400/10 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.12em] text-orange-300">
            <CircleDollarSign size={12} />
            Commission Accounting
          </div>

          <h2 className="mt-3 text-2xl font-black text-white sm:text-3xl">
            Partner / Team Payouts
          </h2>

          <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-200">
            Recorded commissions and estimated payout exposure kept visibly
            separate so Finance OS never treats an estimate like a realised
            obligation.
          </p>
        </div>

        <div className="bg-[#FF5A0A] p-5 text-white sm:p-6">
          <p className="text-[9px] font-black uppercase tracking-[0.12em] text-white">
            Recorded Commission Base
          </p>

          <p className="mt-2 break-words text-3xl font-black text-white">
            {formatMoney(totals.totalCommissions, currency)}
          </p>

          <p className="mt-2 text-xs font-semibold leading-5 text-orange-50">
            {metrics.recordedCount} recorded row
            {metrics.recordedCount === 1 ? "" : "s"} currently included in
            realised Finance OS totals.
          </p>

          <span className="mt-3 inline-flex rounded-full border-2 border-white/25 bg-white/10 px-3 py-1 text-[8px] font-black uppercase tracking-[0.08em] text-white">
            {evidence.hasCommissions ? "Commission evidence connected" : "No commission evidence"}
          </span>
        </div>
      </div>

      <div className="space-y-5 p-4 sm:p-5">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <LedgerMetric
            label="Recorded Commissions"
            value={formatMoney(metrics.recorded, currency)}
            helper="Included in realised P&L and operational cashflow."
            tone="violet"
            icon={WalletCards}
            badge="Recorded"
          />

          <LedgerMetric
            label="Estimated Exposure"
            value={formatMoney(metrics.estimated, currency)}
            helper="Derived or provisional payouts kept outside realised P&L."
            tone={metrics.estimated > 0 ? "amber" : "blue"}
            icon={AlertTriangle}
            badge="Estimate only"
          />

          <LedgerMetric
            label="Paid / Settled"
            value={formatMoney(metrics.paid, currency)}
            helper="Rows marked paid, settled, completed or cleared."
            tone="green"
            icon={BadgeCheck}
            badge="Status-derived"
          />

          <LedgerMetric
            label="Pending / Due"
            value={formatMoney(metrics.pending, currency)}
            helper="Recorded or estimated rows still waiting for settlement."
            tone={metrics.pending > 0 ? "amber" : "green"}
            icon={Landmark}
            badge="Review queue"
          />
        </div>

        {metrics.estimated > 0 ? (
          <div className="flex items-start gap-3 rounded-[1.35rem] border-[3px] border-[#F59E0B] bg-[#FFF8E8] p-4">
            <AlertTriangle
              size={18}
              className="mt-0.5 shrink-0 text-amber-700"
            />

            <div className="min-w-0">
              <p className="font-black text-[#10233F]">
                Estimated commissions are not realised expenses
              </p>

              <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">
                {formatMoney(metrics.estimated, currency)} across{" "}
                {metrics.estimatedCount} estimated row
                {metrics.estimatedCount === 1 ? "" : "s"} is visible for
                planning but excluded from recorded commission totals until a
                real obligation exists.
              </p>
            </div>
          </div>
        ) : (
          <div className="flex items-start gap-3 rounded-[1.35rem] border-[3px] border-[#34D399] bg-[#F0FFF8] p-4">
            <BadgeCheck
              size={18}
              className="mt-0.5 shrink-0 text-emerald-700"
            />

            <div>
              <p className="font-black text-[#10233F]">
                Commission ledger contains recorded evidence only
              </p>
              <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">
                No agent-derived estimate is currently mixed into the commission
                ledger.
              </p>
            </div>
          </div>
        )}

        <section className="rounded-[1.65rem] border-[3px] border-[#C9D7E6] bg-white p-4 sm:p-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.12em] text-slate-500">
                Commission Ledger
              </p>

              <h3 className="mt-1 text-xl font-black text-[#10233F]">
                Partner, Agent & Team Records
              </h3>

              <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">
                Search and separate recorded obligations from estimates before
                using commission totals for financial decisions.
              </p>
            </div>

            <span className="w-fit rounded-full border-2 border-[#C9D7E6] bg-[#FFF8EF] px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.08em] text-slate-600">
              {filtered.length}/{rows.length} visible
            </span>
          </div>

          <div className="mt-4 grid gap-3 xl:grid-cols-[1fr_auto_auto_auto_auto]">
            <label className="relative block">
              <Search
                size={16}
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search partner, student, type, status..."
                className="min-h-11 w-full rounded-xl border-2 border-[#C9D7E6] bg-white pl-11 pr-4 text-sm font-semibold text-[#10233F] outline-none placeholder:text-slate-400 transition focus:border-[#F97316] focus:ring-4 focus:ring-orange-100"
              />
            </label>

            <select
              value={typeFilter}
              onChange={(event) => setTypeFilter(event.target.value)}
              className="min-h-11 rounded-xl border-2 border-[#C9D7E6] bg-white px-3 text-sm font-black text-[#10233F] outline-none focus:border-[#F97316]"
            >
              <option value="all">All Types</option>
              {availableTypes.map((type) => (
                <option key={type} value={type}>
                  {type.replaceAll("_", " ")}
                </option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="min-h-11 rounded-xl border-2 border-[#C9D7E6] bg-white px-3 text-sm font-black text-[#10233F] outline-none focus:border-[#F97316]"
            >
              <option value="all">All Statuses</option>
              {availableStatuses.map((status) => (
                <option key={status} value={status}>
                  {status.replaceAll("_", " ")}
                </option>
              ))}
            </select>

            <select
              value={evidenceFilter}
              onChange={(event) => setEvidenceFilter(event.target.value)}
              className="min-h-11 rounded-xl border-2 border-[#C9D7E6] bg-white px-3 text-sm font-black text-[#10233F] outline-none focus:border-[#F97316]"
            >
              <option value="all">All Evidence</option>
              <option value="recorded">Recorded Only</option>
              <option value="estimated">Estimated Only</option>
            </select>

            <button
              type="button"
              onClick={clearFilters}
              disabled={!filtersActive}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border-2 border-[#C9D7E6] bg-[#FFF8EF] px-3 text-xs font-black text-slate-700 transition hover:border-[#F97316] hover:text-orange-700 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <X size={13} />
              Clear
            </button>
          </div>

          <div className="mt-4 space-y-3">
            {filtered.length ? (
              filtered.map((row) => (
                <CommissionRow
                  key={row.id}
                  row={row}
                  currency={currency}
                />
              ))
            ) : (
              <EmptyCommissionState filtered={filtersActive} />
            )}
          </div>
        </section>

        <div className="grid gap-3 lg:grid-cols-3">
          <div className="rounded-[1.35rem] border-[3px] border-[#60A5FA] bg-[#F2F7FF] p-4">
            <div className="flex items-start gap-3">
              <Database size={17} className="mt-0.5 shrink-0 text-blue-700" />
              <div>
                <p className="text-[8px] font-black uppercase tracking-[0.11em] text-slate-500">
                  Source State
                </p>
                <p className="mt-1 font-black text-[#10233F]">
                  {evidence.hasCommissions ? "Connected" : "Not connected"}
                </p>
                <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">
                  Finance OS reads recorded commission rows plus clearly marked
                  agent-derived estimates.
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
                  P&L Integrity
                </p>
                <p className="mt-1 font-black text-[#10233F]">
                  Recorded obligations only
                </p>
                <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">
                  Estimated commissions do not silently reduce realised profit
                  or operational net cash.
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-[1.35rem] border-[3px] border-[#F59E0B] bg-[#FFF8E8] p-4">
            <div className="flex items-start gap-3">
              <UsersRound
                size={17}
                className="mt-0.5 shrink-0 text-amber-700"
              />
              <div>
                <p className="text-[8px] font-black uppercase tracking-[0.11em] text-slate-500">
                  Largest Recorded Obligation
                </p>
                <p className="mt-1 break-words font-black text-[#10233F]">
                  {metrics.largestRecorded
                    ? `${metrics.largestRecorded.partner} · ${formatMoney(
                        metrics.largestRecorded.amount,
                        currency
                      )}`
                    : "Unavailable"}
                </p>
                <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">
                  Useful as a review signal, not an approval or payment action.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
