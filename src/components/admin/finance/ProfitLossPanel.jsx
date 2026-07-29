import React, { useMemo } from "react";
import {
  AlertTriangle,
  BadgeCheck,
  Calculator,
  CircleDollarSign,
  Database,
  Landmark,
  ReceiptText,
  ShieldCheck,
  TrendingDown,
  TrendingUp,
  WalletCards,
} from "lucide-react";

function safeNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function hasMoney(value) {
  return value !== null && value !== undefined && Number.isFinite(Number(value));
}

function money(value, currency = "GBP") {
  if (!hasMoney(value)) return "Unavailable";

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

function toneClass(tone = "neutral") {
  const map = {
    income: "border-[#34D399] bg-[#F0FFF8]",
    expense: "border-[#FB7185] bg-[#FFF4F4]",
    neutral: "border-[#C9D7E6] bg-white",
    navy: "border-[#123865] bg-[#123865]",
    amber: "border-[#F59E0B] bg-[#FFF8E8]",
    blue: "border-[#60A5FA] bg-[#F2F7FF]",
    violet: "border-[#9B6CFF] bg-[#F8F5FF]",
  };

  return map[tone] || map.neutral;
}

function PnLRow({
  label,
  value,
  helper,
  tone = "neutral",
  currency,
  badge = "",
  icon: Icon,
}) {
  const dark = tone === "navy";

  return (
    <div
      className={`grid min-w-0 gap-4 rounded-[1.4rem] border-[3px] p-4 shadow-[0_6px_18px_rgba(15,35,63,0.04)] md:grid-cols-[minmax(0,1fr)_12rem] md:items-center ${toneClass(
        tone
      )}`}
    >
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          {Icon ? (
            <div
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border-2 ${
                dark
                  ? "border-white/20 bg-white/10 text-orange-200"
                  : "border-[#123865]/15 bg-white text-[#123865]"
              }`}
            >
              <Icon size={14} />
            </div>
          ) : null}

          <p
            className={`font-black ${
              dark ? "text-white" : "text-[#10233F]"
            }`}
          >
            {label}
          </p>

          {badge ? (
            <span
              className={`rounded-full border-2 px-2.5 py-1 text-[8px] font-black uppercase tracking-[0.07em] ${
                dark
                  ? "border-white/20 bg-white/10 text-white"
                  : "border-[#C9D7E6] bg-white text-slate-600"
              }`}
            >
              {badge}
            </span>
          ) : null}
        </div>

        {helper ? (
          <p
            className={`mt-2 text-xs font-semibold leading-5 ${
              dark ? "text-slate-200" : "text-slate-600"
            }`}
          >
            {helper}
          </p>
        ) : null}
      </div>

      <p
        className={`text-left text-xl font-black md:text-right ${
          dark
            ? "text-white"
            : tone === "income"
              ? "text-emerald-700"
              : tone === "expense"
                ? "text-red-700"
                : "text-[#123865]"
        }`}
      >
        {money(value, currency)}
      </p>
    </div>
  );
}

function EvidenceCard({
  label,
  value,
  helper,
  tone = "blue",
  icon: Icon = Database,
}) {
  return (
    <div className={`rounded-[1.35rem] border-[3px] p-4 ${toneClass(tone)}`}>
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border-2 border-[#123865]/15 bg-white text-[#123865]">
          <Icon size={16} />
        </div>

        <div className="min-w-0">
          <p className="text-[8px] font-black uppercase tracking-[0.11em] text-slate-500">
            {label}
          </p>
          <p className="mt-1 break-words text-lg font-black text-[#10233F]">
            {value}
          </p>
          <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">
            {helper}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function ProfitLossPanel({
  finance = {},
  compact = false,
}) {
  const totals = finance.totals || {};
  const currency = finance.currency || "GBP";
  const evidence = finance.evidence || {};
  const metadata = finance.metadata || {};

  const metrics = useMemo(() => {
    const collected = safeNumber(totals.collected);
    const outstanding = safeNumber(totals.outstanding);
    const expenses = safeNumber(totals.totalExpenses);
    const commissions = safeNumber(totals.totalCommissions);
    const estimatedCommissions = safeNumber(totals.estimatedCommissions);

    const outflow = expenses + commissions;
    const grossProfit =
      hasMoney(totals.grossProfit)
        ? Number(totals.grossProfit)
        : collected - commissions;

    const netProfit =
      hasMoney(totals.netProfit)
        ? Number(totals.netProfit)
        : collected - outflow;

    const margin =
      totals.margin === null ||
      totals.margin === undefined ||
      !Number.isFinite(Number(totals.margin))
        ? null
        : Number(totals.margin);

    return {
      collected,
      outstanding,
      expenses,
      commissions,
      estimatedCommissions,
      outflow,
      grossProfit,
      netProfit,
      margin,
    };
  }, [totals]);

  const financeSourceCount = [
    evidence.hasInvoices,
    evidence.hasPayments,
    evidence.hasExpenses,
    evidence.hasCommissions,
  ].filter(Boolean).length;

  const profitTone =
    metrics.netProfit > 0
      ? "income"
      : metrics.netProfit < 0
        ? "expense"
        : "neutral";

  const marginLabel =
    metrics.margin === null ? "Unavailable" : `${metrics.margin}%`;

  const marginTone =
    metrics.margin === null
      ? "blue"
      : metrics.margin >= 25
        ? "income"
        : metrics.margin >= 0
          ? "amber"
          : "expense";

  return (
    <section className="min-w-0 overflow-hidden rounded-[1.9rem] border-[3px] border-[#C9D7E6] bg-[#FFFDF8] shadow-[0_14px_38px_rgba(15,35,63,0.07)]">
      <div className="grid border-b-[3px] border-[#F97316] xl:grid-cols-[minmax(0,1.2fr)_minmax(18rem,0.8fr)]">
        <div className="bg-[#123865] p-5 text-white sm:p-6">
          <div className="inline-flex items-center gap-2 rounded-full border-2 border-orange-300/30 bg-orange-400/10 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.12em] text-orange-300">
            <Calculator size={12} />
            Profit & Loss
          </div>

          <h2 className="mt-3 text-2xl font-black text-white sm:text-3xl">
            Founder P&L Snapshot
          </h2>

          <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-200">
            Operational profit-and-loss view from connected Finance OS evidence.
            Recorded revenue, expenses and commissions stay separate from
            receivables and estimates.
          </p>
        </div>

        <div className="bg-[#FF5A0A] p-5 text-white sm:p-6">
          <p className="text-[9px] font-black uppercase tracking-[0.12em] text-white">
            Net Operating Profit
          </p>

          <p className="mt-2 break-words text-3xl font-black text-white">
            {money(metrics.netProfit, currency)}
          </p>

          <p className="mt-2 text-xs font-semibold leading-5 text-orange-50">
            {metrics.margin === null
              ? "Margin is unavailable until collected revenue exists."
              : `${metrics.margin}% operating margin from currently connected evidence.`}
          </p>

          <span className="mt-3 inline-flex rounded-full border-2 border-white/25 bg-white/10 px-3 py-1 text-[8px] font-black uppercase tracking-[0.08em] text-white">
            Operational snapshot · not statutory accounts
          </span>
        </div>
      </div>

      <div className="space-y-5 p-4 sm:p-5">
        <div className="space-y-3">
          <PnLRow
            label="Revenue Collected"
            value={metrics.collected}
            helper="Confirmed student payments / paid-invoice evidence recognised as collected."
            tone="income"
            currency={currency}
            badge="Recorded"
            icon={TrendingUp}
          />

          {!compact ? (
            <PnLRow
              label="Outstanding Revenue"
              value={metrics.outstanding}
              helper="Receivable value not yet collected. Visible for context but excluded from realised profit."
              tone="blue"
              currency={currency}
              badge="Receivable"
              icon={ReceiptText}
            />
          ) : null}

          <PnLRow
            label="Operating Expenses"
            value={-metrics.expenses}
            helper="Recorded operating expenses currently feeding Finance OS."
            tone="expense"
            currency={currency}
            badge="Recorded"
            icon={TrendingDown}
          />

          <PnLRow
            label="Recorded Commissions"
            value={-metrics.commissions}
            helper="Recorded partner, agent or team commission obligations only."
            tone="expense"
            currency={currency}
            badge="Recorded"
            icon={CircleDollarSign}
          />

          {!compact ? (
            <PnLRow
              label="Total Recorded Outflow"
              value={-metrics.outflow}
              helper="Operating expenses plus recorded commissions."
              tone="expense"
              currency={currency}
              badge="Recorded"
              icon={WalletCards}
            />
          ) : null}

          <PnLRow
            label="Gross Profit"
            value={metrics.grossProfit}
            helper="Collected revenue less recorded commissions."
            tone={metrics.grossProfit >= 0 ? "income" : "expense"}
            currency={currency}
            badge="Operational"
            icon={Landmark}
          />

          <PnLRow
            label="Net Profit"
            value={metrics.netProfit}
            helper={
              metrics.margin === null
                ? "Collected revenue minus recorded expenses and commissions."
                : `${metrics.margin}% net operating margin from current connected records.`
            }
            tone={profitTone}
            currency={currency}
            badge="Operational"
            icon={metrics.netProfit >= 0 ? TrendingUp : TrendingDown}
          />
        </div>

        {!compact ? (
          <>
            <div className="grid gap-3 lg:grid-cols-3">
              <EvidenceCard
                label="Finance Evidence"
                value={`${financeSourceCount}/4 sources`}
                helper="Invoices, payments, expenses and commissions currently connected."
                tone={financeSourceCount >= 3 ? "income" : financeSourceCount >= 1 ? "amber" : "expense"}
                icon={Database}
              />

              <EvidenceCard
                label="Net Margin"
                value={marginLabel}
                helper={
                  metrics.margin === null
                    ? "Margin requires collected revenue."
                    : "Operating margin after recorded expenses and recorded commissions."
                }
                tone={marginTone}
                icon={ShieldCheck}
              />

              <EvidenceCard
                label="Accounting Basis"
                value="Operational"
                helper={
                  metadata.accountingBasis ||
                  "CRM finance snapshot; not bank reconciliation or statutory accounting."
                }
                tone="blue"
                icon={Calculator}
              />
            </div>

            {metrics.estimatedCommissions > 0 ? (
              <div className="flex items-start gap-3 rounded-[1.35rem] border-[3px] border-[#F59E0B] bg-[#FFF8E8] p-4">
                <AlertTriangle
                  size={18}
                  className="mt-0.5 shrink-0 text-amber-700"
                />

                <div className="min-w-0">
                  <p className="font-black text-[#10233F]">
                    Estimated commissions are excluded from realised P&L
                  </p>

                  <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">
                    {money(
                      metrics.estimatedCommissions,
                      currency
                    )} of estimated commission exposure is visible elsewhere in
                    Finance OS but does not reduce this recorded net-profit
                    figure.
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
                    No estimated commissions are mixed into realised profit
                  </p>

                  <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">
                    The current P&L is using recorded commission obligations only.
                  </p>
                </div>
              </div>
            )}

            <div className="grid gap-3 lg:grid-cols-2">
              <div className="rounded-[1.35rem] border-[3px] border-[#60A5FA] bg-[#F2F7FF] p-4">
                <div className="flex items-start gap-3">
                  <ReceiptText
                    size={17}
                    className="mt-0.5 shrink-0 text-blue-700"
                  />

                  <div>
                    <p className="text-[8px] font-black uppercase tracking-[0.11em] text-slate-500">
                      Receivables Treatment
                    </p>
                    <p className="mt-1 font-black text-[#10233F]">
                      Outstanding revenue excluded
                    </p>
                    <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">
                      {money(metrics.outstanding, currency)} of outstanding
                      receivables is displayed for context but is not counted as
                      realised revenue in net profit.
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-[1.35rem] border-[3px] border-[#F59E0B] bg-[#FFF8E8] p-4">
                <div className="flex items-start gap-3">
                  <ShieldCheck
                    size={17}
                    className="mt-0.5 shrink-0 text-amber-700"
                  />

                  <div>
                    <p className="text-[8px] font-black uppercase tracking-[0.11em] text-slate-500">
                      Scope Warning
                    </p>
                    <p className="mt-1 font-black text-[#10233F]">
                      Current connected snapshot
                    </p>
                    <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">
                      This is not yet a monthly accrual P&L, audited statement, tax
                      report, or bank-reconciled ledger. Period accounting should
                      be added only when those real sources exist.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : null}
      </div>
    </section>
  );
}
