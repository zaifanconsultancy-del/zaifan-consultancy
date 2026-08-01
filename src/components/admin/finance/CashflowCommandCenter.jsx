import React, { useMemo } from "react";
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  BadgeCheck,
  Banknote,
  CircleDollarSign,
  Clock3,
  Database,
  Landmark,
  ReceiptText,
  ShieldCheck,
  TrendingUp,
  WalletCards,
} from "lucide-react";

function safeArray(value) {
  return Array.isArray(value) ? value.filter(Boolean) : [];
}

function safeNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function safeMoney(value, currency = "GBP") {
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

function toneClasses(tone = "orange") {
  const map = {
    navy: "border-[#123865] bg-[#123865]",
    orange: "border-[#C9D7E6] bg-[#FFFDF8]",
    green: "border-[#34D399] bg-[#F0FFF8]",
    amber: "border-[#F59E0B] bg-[#FFF8E8]",
    red: "border-[#FB7185] bg-[#FFF4F4]",
    blue: "border-[#60A5FA] bg-[#F2F7FF]",
    violet: "border-[#60A5FA] bg-[#F2F7FF]",
  };

  return map[tone] || map.orange;
}

function CashMetric({
  label,
  value,
  helper,
  tone = "orange",
  icon: Icon,
  badge = "",
}) {
  const dark = tone === "navy";

  return (
    <div
      className={`min-w-0 rounded-[1.45rem] border-[3px] p-4 shadow-[0_7px_20px_rgba(15,35,63,0.05)] ${toneClasses(
        tone
      )}`}
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
                : "border-[#123865]/15 bg-white/80 text-[#123865]"
            }`}
          >
            <Icon size={16} />
          </div>
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

      {badge ? (
        <span
          className={`mt-3 inline-flex rounded-lg border-2 px-2.5 py-1 text-[8px] font-black uppercase tracking-[0.08em] ${
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

function CashIntegrityCard({
  label,
  value,
  helper,
  tone = "blue",
  icon: Icon = Database,
}) {
  return (
    <div
      className={`rounded-[1.35rem] border-[3px] p-4 ${toneClasses(tone)}`}
    >
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

function EstimatedPipelineRow({ item, maxValue, currency }) {
  const valueAvailable =
    item?.value !== null &&
    item?.value !== undefined &&
    Number.isFinite(Number(item.value));

  const numericValue = valueAvailable ? safeNumber(item.value) : 0;

  const width =
    valueAvailable && maxValue > 0
      ? Math.max(4, Math.round((numericValue / maxValue) * 100))
      : 0;

  return (
    <article className="min-w-0 rounded-[1.4rem] border-[3px] border-[#C9D7E6] bg-white p-4 shadow-[0_6px_18px_rgba(15,35,63,0.04)]">
      <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h4 className="font-black text-[#10233F]">{item.label}</h4>

            <span className="rounded-full border-2 border-[#F59E0B] bg-[#FFF8E8] px-2.5 py-1 text-[8px] font-black uppercase tracking-[0.07em] text-amber-800">
              Estimated
            </span>
          </div>

          <p className="mt-1 text-xs font-semibold text-slate-500">
            {safeNumber(item.count)} live record
            {safeNumber(item.count) === 1 ? "" : "s"}
          </p>
        </div>

        <p className="shrink-0 text-lg font-black text-[#123865]">
          {valueAvailable
            ? safeMoney(item.value, currency)
            : "No monetary basis"}
        </p>
      </div>

      <div className="mt-4 h-3 overflow-hidden rounded-full border-2 border-[#E1E8F0] bg-[#FFF8EF]">
        <div
          className="h-full rounded-full bg-[#F97316] transition-[width] duration-300"
          style={{ width: `${width}%` }}
        />
      </div>

      {!valueAvailable ? (
        <p className="mt-2 text-xs font-semibold text-slate-500">
          Stage volume is visible, but Zaifan will not invent a financial value
          without a real invoice/payment basis.
        </p>
      ) : null}
    </article>
  );
}

function EmptyPipeline() {
  return (
    <div className="rounded-[1.5rem] border-[3px] border-dashed border-[#C9D7E6] bg-white p-8 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border-2 border-[#C9D7E6] bg-[#FFFDF8] text-[#B84F0E]">
        <TrendingUp size={24} />
      </div>

      <h3 className="mt-4 text-xl font-black text-[#10233F]">
        No pipeline cash evidence yet
      </h3>

      <p className="mx-auto mt-2 max-w-xl text-sm font-semibold leading-6 text-slate-600">
        Application, offer, CAS and visa stages will appear here once the
        connected Student OS provides real pipeline records.
      </p>
    </div>
  );
}

export default function CashflowCommandCenter({
  finance = {},
  compact = false,
}) {
  const totals = finance.totals || {};
  const pipeline = safeArray(finance.pipeline);
  const currency = finance.currency || "GBP";
  const evidence = finance.evidence || {};
  const metadata = finance.metadata || {};

  const totalOutflow =
    safeNumber(totals.totalExpenses) + safeNumber(totals.totalCommissions);

  const operationalNetCash =
    totals.operationalNetCash ??
    totals.cashOnHand ??
    safeNumber(totals.collected) - totalOutflow;

  const maxPipeline = useMemo(() => {
    const values = pipeline
      .map((item) => Number(item?.value))
      .filter((value) => Number.isFinite(value) && value > 0);

    return values.length ? Math.max(...values) : 0;
  }, [pipeline]);

  const pipelineRecordCount = pipeline.reduce(
    (sum, item) => sum + safeNumber(item?.count),
    0
  );

  const collectionCoverage =
    safeNumber(totals.invoiced) > 0
      ? Math.round(
          (safeNumber(totals.collected) / safeNumber(totals.invoiced)) * 100
        )
      : null;

  const overdueShare =
    safeNumber(totals.outstanding) > 0
      ? Math.round(
          (safeNumber(totals.overdue) /
            safeNumber(totals.outstanding)) *
            100
        )
      : 0;

  const netPositive = Number(operationalNetCash) >= 0;

  return (
    <section className="min-w-0 overflow-hidden rounded-[1.9rem] border-[3px] border-[#C9D7E6] bg-[#FFFDF8] shadow-[0_14px_38px_rgba(15,35,63,0.07)]">
      <div className="grid min-w-0 border-b-[3px] border-[#F97316] xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)]">
        <div className="min-w-0 bg-[#123865] p-5 text-white sm:p-6">
          <div className="inline-flex items-center gap-2 rounded-full border-2 border-[#F97316]/30 bg-orange-400/10 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.12em] text-orange-300">
            <WalletCards size={12} />
            Cashflow Command
          </div>

          <h2 className="mt-3 text-2xl font-black text-white sm:text-3xl">
            Money In / Money Out
          </h2>

          <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-200">
            Recorded collection, receivable and outflow intelligence with
            pipeline estimates clearly separated from realised cash.
          </p>
        </div>

        <div className="min-w-0 bg-[#FF5A0A] p-5 text-white sm:p-6">
          <p className="text-[9px] font-black uppercase tracking-[0.12em] text-white">
            Operational Net Cash
          </p>

          <p className="mt-2 break-words text-3xl font-black text-white">
            {safeMoney(operationalNetCash, currency)}
          </p>

          <p className="mt-2 text-xs font-semibold leading-5 text-orange-50">
            Collected revenue less recorded expenses and recorded commissions.
            This is not a connected bank balance.
          </p>

          <span className="mt-3 inline-flex rounded-full border-2 border-white/25 bg-white/10 px-3 py-1 text-[8px] font-black uppercase tracking-[0.08em] text-white">
            {netPositive ? "Positive operating position" : "Negative operating position"}
          </span>
        </div>
      </div>

      <div className="space-y-5 p-4 sm:p-5">
        <div
          className={
            compact
              ? "grid gap-3 md:grid-cols-3"
              : "grid gap-3 md:grid-cols-2 xl:grid-cols-5"
          }
        >
          <CashMetric
            label="Operational Net Cash"
            value={safeMoney(operationalNetCash, currency)}
            helper="Collected minus recorded outflows."
            tone={netPositive ? "green" : "red"}
            icon={Landmark}
            badge="Not bank balance"
          />

          <CashMetric
            label="Collected"
            value={safeMoney(totals.collected, currency)}
            helper="Confirmed payment / paid-invoice evidence."
            tone="green"
            icon={ArrowUpRight}
            badge="Recorded"
          />

          <CashMetric
            label="Outstanding"
            value={safeMoney(totals.outstanding, currency)}
            helper="Invoiced value not yet recognised as collected."
            tone="amber"
            icon={ReceiptText}
            badge="Receivable"
          />

          {!compact ? (
            <>
              <CashMetric
                label="Overdue"
                value={safeMoney(totals.overdue, currency)}
                helper={
                  safeNumber(totals.outstanding) > 0
                    ? `${overdueShare}% of outstanding receivables`
                    : "No outstanding receivable base."
                }
                tone={safeNumber(totals.overdue) > 0 ? "red" : "green"}
                icon={Clock3}
                badge={safeNumber(totals.overdue) > 0 ? "Recovery needed" : "Clear"}
              />

              <CashMetric
                label="Recorded Outflow"
                value={safeMoney(totalOutflow, currency)}
                helper={`${safeMoney(
                  totals.totalExpenses,
                  currency
                )} expenses + ${safeMoney(
                  totals.totalCommissions,
                  currency
                )} commissions`}
                tone="violet"
                icon={ArrowDownRight}
                badge="Recorded only"
              />
            </>
          ) : null}
        </div>

        {!compact ? (
          <>
            <div className="grid gap-3 lg:grid-cols-3">
              <CashIntegrityCard
                label="Collection Coverage"
                value={
                  collectionCoverage === null
                    ? "Unavailable"
                    : `${collectionCoverage}%`
                }
                helper={
                  collectionCoverage === null
                    ? "No invoiced amount is available for a collection-rate calculation."
                    : `${safeMoney(
                        totals.collected,
                        currency
                      )} collected against ${safeMoney(
                        totals.invoiced,
                        currency
                      )} invoiced.`
                }
                tone={
                  collectionCoverage === null
                    ? "blue"
                    : collectionCoverage >= 80
                      ? "green"
                      : collectionCoverage >= 50
                        ? "amber"
                        : "red"
                }
                icon={Banknote}
              />

              <CashIntegrityCard
                label="Cash Evidence"
                value={`${[
                  evidence.hasInvoices,
                  evidence.hasPayments,
                  evidence.hasExpenses,
                  evidence.hasCommissions,
                ].filter(Boolean).length}/4 sources`}
                helper="Invoices, payments, expenses and commissions feeding this workspace."
                tone={
                  [
                    evidence.hasInvoices,
                    evidence.hasPayments,
                    evidence.hasExpenses,
                    evidence.hasCommissions,
                  ].filter(Boolean).length >= 3
                    ? "green"
                    : "amber"
                }
                icon={Database}
              />

              <CashIntegrityCard
                label="Bank Reconciliation"
                value={
                  metadata.bankBalanceConnected
                    ? "Connected"
                    : "Not connected"
                }
                helper={
                  metadata.bankBalanceConnected
                    ? "Cash position can be compared against a bank source."
                    : "Operational net cash must not be read as bank cash until a bank/reconciliation layer exists."
                }
                tone={metadata.bankBalanceConnected ? "green" : "amber"}
                icon={metadata.bankBalanceConnected ? BadgeCheck : ShieldCheck}
              />
            </div>

            <section className="rounded-[1.65rem] border-[3px] border-[#F97316] bg-[#FFF8EF] p-4 sm:p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-[9px] font-black uppercase tracking-[0.12em] text-[#B84F0E]">
                    Pipeline Cash Potential
                  </p>

                  <h3 className="mt-1 text-xl font-black text-[#10233F]">
                    Estimated Stage Value
                  </h3>

                  <p className="mt-1 max-w-3xl text-xs font-semibold leading-5 text-slate-600">
                    These values are weighted operating estimates, not booked
                    revenue. Stage counts remain useful even when no monetary
                    basis exists.
                  </p>
                </div>

                <span className="w-fit rounded-full border-2 border-[#F59E0B] bg-white px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.08em] text-amber-800">
                  {pipelineRecordCount} pipeline record
                  {pipelineRecordCount === 1 ? "" : "s"}
                </span>
              </div>

              {pipeline.length ? (
                <div className="mt-4 grid gap-3 lg:grid-cols-2">
                  {pipeline.map((item) => (
                    <EstimatedPipelineRow
                      key={item.key || item.label}
                      item={item}
                      maxValue={maxPipeline}
                      currency={currency}
                    />
                  ))}
                </div>
              ) : (
                <div className="mt-4">
                  <EmptyPipeline />
                </div>
              )}
            </section>

            {safeNumber(totals.estimatedCommissions) > 0 ? (
              <div className="flex items-start gap-3 rounded-[1.35rem] border-[3px] border-[#F59E0B] bg-[#FFF8E8] p-4">
                <AlertTriangle
                  size={18}
                  className="mt-0.5 shrink-0 text-amber-700"
                />

                <div className="min-w-0">
                  <p className="font-black text-[#10233F]">
                    Estimated commission exposure is excluded from realised
                    cashflow
                  </p>

                  <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">
                    {safeMoney(
                      totals.estimatedCommissions,
                      currency
                    )} is derived from agent data and remains separate until it
                    becomes a recorded commission obligation.
                  </p>
                </div>
              </div>
            ) : null}
          </>
        ) : null}
      </div>
    </section>
  );
}
