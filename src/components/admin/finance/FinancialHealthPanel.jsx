import React, { useMemo } from "react";
import {
  AlertTriangle,
  BadgeCheck,
  Banknote,
  CircleGauge,
  Database,
  Landmark,
  ReceiptText,
  ShieldCheck,
  TrendingDown,
  TrendingUp,
  WalletCards,
} from "lucide-react";
import ZaifanMetricCard from "../ui/ZaifanMetricCard";

function safeNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function hasNumber(value) {
  return value !== null && value !== undefined && Number.isFinite(Number(value));
}

function money(value, currency = "GBP") {
  if (!hasNumber(value)) return "Unavailable";

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

function toneClass(status = "watch") {
  const tones = {
    healthy: "border-[#34D399] bg-[#F0FFF8]",
    watch: "border-[#F59E0B] bg-[#FFF8E8]",
    risk: "border-[#FB7185] bg-[#FFF4F4]",
    info: "border-[#60A5FA] bg-[#F2F7FF]",
    navy: "border-[#123865] bg-[#123865]",
  };

  return tones[status] || tones.watch;
}

function HealthSignal({
  label,
  value,
  helper,
  status = "watch",
  icon: Icon,
  badge = "",
}) {
  return (
    <ZaifanMetricCard
      level="coBoss"
      surface={status === "navy" ? "navy" : "light"}
      label={label}
      value={value}
      detail={[helper, badge].filter(Boolean).join(" · ")}
      icon={Icon}
      tone={toZaifanMetricTone(status)}
    />
  );
}

function RiskSummaryCard({ label, value, helper, tone = "info", icon: Icon = ShieldCheck }) {
  return <ZaifanMetricCard level="coBoss" label={label} value={value} detail={helper} icon={Icon} tone={toZaifanMetricTone(tone)} />;
}


function toZaifanMetricTone(tone = "") {
  const value = String(tone || "").trim().toLowerCase();

  if (
    value.includes("green") ||
    value.includes("emerald") ||
    value.includes("success") ||
    value.includes("healthy") ||
    value.includes("ready") ||
    value.includes("connected") ||
    value.includes("active") ||
    value.includes("live") ||
    value.includes("good")
  ) return "green";

  if (
    value.includes("red") ||
    value.includes("rose") ||
    value.includes("danger") ||
    value.includes("risk") ||
    value.includes("critical") ||
    value.includes("failed") ||
    value.includes("error") ||
    value.includes("blocked") ||
    value.includes("disconnected")
  ) return "red";

  if (
    value.includes("amber") ||
    value.includes("yellow") ||
    value.includes("warning") ||
    value.includes("warn") ||
    value.includes("attention") ||
    value.includes("paused")
  ) return "amber";

  if (value.includes("violet") || value.includes("purple")) return "violet";
  if (value.includes("orange") || value.includes("gold")) return "orange";
  if (value.includes("blue") || value.includes("cyan") || value.includes("teal") || value.includes("info")) return "blue";
  if (value.includes("slate") || value.includes("gray") || value.includes("grey") || value.includes("muted") || value.includes("neutral")) return "slate";

  return "navy";
}

export default function FinancialHealthPanel({
  finance = {},
  compact = false,
}) {
  const totals = finance.totals || {};
  const forecast = finance.forecast || {};
  const evidence = finance.evidence || {};
  const completeness = finance.completeness || {};
  const metadata = finance.metadata || {};
  const currency = finance.currency || "GBP";

  const signals = useMemo(() => {
    const healthAvailable =
      Boolean(totals.healthAvailable) &&
      hasNumber(totals.healthScore);

    const operationalNetCash =
      totals.operationalNetCash ??
      totals.cashOnHand ??
      safeNumber(totals.collected) -
        safeNumber(totals.totalExpenses) -
        safeNumber(totals.totalCommissions);

    const cashStatus =
      operationalNetCash > 0
        ? "healthy"
        : operationalNetCash < 0
          ? "risk"
          : "watch";

    const marginStatus =
      totals.margin === null ||
      totals.margin === undefined ||
      !Number.isFinite(Number(totals.margin))
        ? "info"
        : Number(totals.margin) >= 25
          ? "healthy"
          : Number(totals.margin) >= 0
            ? "watch"
            : "risk";

    const overdueStatus =
      safeNumber(totals.overdue) > 0 ? "risk" : "healthy";

    const outstandingStatus =
      safeNumber(totals.outstanding) >
        safeNumber(totals.collected) &&
      safeNumber(totals.outstanding) > 0
        ? "watch"
        : "info";

    const totalOutflow =
      safeNumber(totals.totalExpenses) +
      safeNumber(totals.totalCommissions);

    const expenseStatus =
      safeNumber(totals.totalExpenses) >
        safeNumber(totals.collected) &&
      safeNumber(totals.totalExpenses) > 0
        ? "risk"
        : "info";

    const commissionStatus =
      safeNumber(totals.totalCommissions) >
        safeNumber(totals.collected) * 0.25 &&
      safeNumber(totals.collected) > 0
        ? "watch"
        : "info";

    const forecastStatus =
      forecast.available &&
      hasNumber(forecast.day60)
        ? Number(forecast.day60) > totalOutflow
          ? "healthy"
          : "watch"
        : "info";

    const financeSourceCount =
      completeness.financeSourceCount ??
      [
        evidence.hasInvoices,
        evidence.hasPayments,
        evidence.hasExpenses,
        evidence.hasCommissions,
      ].filter(Boolean).length;

    const criticalSignals = [
      operationalNetCash < 0,
      safeNumber(totals.overdue) > 0,
      totals.margin !== null &&
        totals.margin !== undefined &&
        Number(totals.margin) < 0,
      safeNumber(totals.totalExpenses) >
        safeNumber(totals.collected) &&
        safeNumber(totals.totalExpenses) > 0,
    ].filter(Boolean).length;

    const watchSignals = [
      safeNumber(totals.outstanding) >
        safeNumber(totals.collected) &&
        safeNumber(totals.outstanding) > 0,
      safeNumber(totals.totalCommissions) >
        safeNumber(totals.collected) * 0.25 &&
        safeNumber(totals.collected) > 0,
      forecast.available &&
        hasNumber(forecast.day60) &&
        Number(forecast.day60) <= totalOutflow,
    ].filter(Boolean).length;

    return {
      healthAvailable,
      operationalNetCash,
      cashStatus,
      marginStatus,
      overdueStatus,
      outstandingStatus,
      expenseStatus,
      commissionStatus,
      forecastStatus,
      financeSourceCount,
      criticalSignals,
      watchSignals,
      totalOutflow,
    };
  }, [totals, forecast, evidence, completeness]);

  return (
    <section className="min-w-0 overflow-hidden rounded-[1.9rem] border-[3px] border-[#C9D7E6] bg-[#FFFDF8] shadow-[0_14px_38px_rgba(15,35,63,0.07)]">
      <div className="grid border-b-[3px] border-[#F97316] xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)]">
        <div className="bg-[#123865] p-5 text-white sm:p-6">
          <div className="inline-flex items-center gap-2 rounded-full border-2 border-[#F97316]/30 bg-orange-400/10 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.12em] text-orange-300">
            <ShieldCheck size={12} />
            Financial Health
          </div>

          <h2 className="mt-3 text-2xl font-black text-white sm:text-3xl">
            Finance Risk Signals
          </h2>

          <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-200">
            Evidence-aware financial health for operational cash, margin,
            overdue receivables, outflow pressure, commission exposure and
            forecast strength. Missing evidence is shown as unavailable rather
            than fake zeroes.
          </p>
        </div>

        <div className="bg-[#FF5A0A] p-5 text-white sm:p-6">
          <p className="text-[9px] font-black uppercase tracking-[0.12em] text-white">
            Current Health Signal
          </p>

          <p className="mt-2 text-3xl font-black text-white">
            {signals.healthAvailable
              ? `${totals.healthScore}%`
              : "Unavailable"}
          </p>

          <p className="mt-2 text-xs font-semibold leading-5 text-orange-50">
            {totals.healthReason ||
              "Finance health requires connected evidence before Zaifan scores it."}
          </p>

          <span className="mt-3 inline-flex rounded-full border-2 border-white/25 bg-white/10 px-3 py-1 text-[8px] font-black uppercase tracking-[0.08em] text-white">
            Operational signal · not audit grade
          </span>
        </div>
      </div>

      <div className="space-y-5 p-4 sm:p-5">
        <div
          className={
            compact
              ? "grid gap-3 md:grid-cols-2"
              : "grid gap-3 md:grid-cols-2 xl:grid-cols-4"
          }
        >
          <HealthSignal
            label="Health Score"
            value={
              signals.healthAvailable
                ? `${totals.healthScore}%`
                : "Unavailable"
            }
            helper={
              signals.healthAvailable
                ? "Combined operational signal from currently connected finance evidence."
                : totals.healthReason ||
                  "Not enough connected finance evidence to calculate health."
            }
            status={
              !signals.healthAvailable
                ? "info"
                : totals.healthScore >= 70
                  ? "healthy"
                  : totals.healthScore >= 45
                    ? "watch"
                    : "risk"
            }
            icon={CircleGauge}
            badge="Evidence-based"
          />

          <HealthSignal
            label="Operational Net Cash"
            value={money(signals.operationalNetCash, currency)}
            helper="Collected revenue less recorded expenses and recorded commissions. Not a bank balance."
            status={signals.cashStatus}
            icon={Landmark}
            badge="Operational"
          />

          <HealthSignal
            label="Net Margin"
            value={
              totals.margin === null ||
              totals.margin === undefined ||
              !Number.isFinite(Number(totals.margin))
                ? "Unavailable"
                : `${totals.margin}%`
            }
            helper="Operating profitability after recorded costs and commission obligations."
            status={signals.marginStatus}
            icon={TrendingUp}
            badge="Recorded basis"
          />

          <HealthSignal
            label="Overdue Risk"
            value={money(totals.overdue, currency)}
            helper="Overdue receivable value that may need active recovery."
            status={signals.overdueStatus}
            icon={ReceiptText}
            badge={safeNumber(totals.overdue) > 0 ? "Recovery queue" : "Clear"}
          />

          {!compact ? (
            <>
              <HealthSignal
                label="60 Day Forecast"
                value={
                  forecast.available && hasNumber(forecast.day60)
                    ? money(forecast.day60, currency)
                    : "Unavailable"
                }
                helper={
                  forecast.available
                    ? "Weighted operating estimate from pipeline + historical invoice/payment value."
                    : forecast.reason ||
                      "Forecast evidence is not sufficient yet."
                }
                status={signals.forecastStatus}
                icon={TrendingUp}
                badge={forecast.available ? "Estimated" : "No forecast"}
              />

              <HealthSignal
                label="Outstanding"
                value={money(totals.outstanding, currency)}
                helper="Receivable value not yet recognised as collected cash."
                status={signals.outstandingStatus}
                icon={WalletCards}
                badge="Receivable"
              />

              <HealthSignal
                label="Expense Pressure"
                value={money(totals.totalExpenses, currency)}
                helper="Recorded operating expenses relative to current collected revenue."
                status={signals.expenseStatus}
                icon={TrendingDown}
                badge="Recorded"
              />

              <HealthSignal
                label="Commission Exposure"
                value={money(totals.totalCommissions, currency)}
                helper={
                  safeNumber(totals.estimatedCommissions) > 0
                    ? `${money(
                        totals.estimatedCommissions,
                        currency
                      )} additional estimated exposure kept outside realised P&L.`
                    : "Recorded partner, agent or team commission obligations."
                }
                status={signals.commissionStatus}
                icon={Banknote}
                badge="Recorded only"
              />
            </>
          ) : null}
        </div>

        {!compact ? (
          <>
            <div className="grid gap-3 lg:grid-cols-3">
              <RiskSummaryCard
                label="Finance Evidence"
                value={`${signals.financeSourceCount}/4 sources`}
                helper="Invoices, payments, expenses and commissions currently connected."
                tone={
                  signals.financeSourceCount >= 3
                    ? "healthy"
                    : signals.financeSourceCount >= 1
                      ? "watch"
                      : "risk"
                }
                icon={Database}
              />

              <RiskSummaryCard
                label="Critical Signals"
                value={signals.criticalSignals}
                helper="Negative cash, overdue receivables, negative margin or expense-over-collection conditions."
                tone={signals.criticalSignals > 0 ? "risk" : "healthy"}
                icon={AlertTriangle}
              />

              <RiskSummaryCard
                label="Watch Signals"
                value={signals.watchSignals}
                helper="Outstanding pressure, commission concentration or weak forecast coverage."
                tone={signals.watchSignals > 0 ? "watch" : "healthy"}
                icon={ShieldCheck}
              />
            </div>

            <div
              className={`flex items-start gap-3 rounded-[1.35rem] border-[3px] p-4 ${
                signals.healthAvailable
                  ? "border-[#34D399] bg-[#F0FFF8]"
                  : "border-[#F59E0B] bg-[#FFF8E8]"
              }`}
            >
              {signals.healthAvailable ? (
                <BadgeCheck
                  size={18}
                  className="mt-0.5 shrink-0 text-emerald-700"
                />
              ) : (
                <AlertTriangle
                  size={18}
                  className="mt-0.5 shrink-0 text-amber-700"
                />
              )}

              <div className="min-w-0">
                <p className="font-black text-[#10233F]">
                  {signals.healthAvailable
                    ? "Finance health is backed by connected evidence"
                    : "Finance health is intentionally unavailable"}
                </p>

                <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">
                  {signals.healthAvailable
                    ? "Zaifan is scoring the current operating finance snapshot only. The score is not a substitute for statutory accounts, audit work, tax reporting, or bank reconciliation."
                    : "Zaifan will not turn missing finance sources into a fake 0% score. Connect more real evidence first."}
                </p>
              </div>
            </div>

            <div className="grid gap-3 lg:grid-cols-2">
              <div className="rounded-[1.35rem] border-[3px] border-[#60A5FA] bg-[#F2F7FF] p-4">
                <div className="flex items-start gap-3">
                  <Landmark
                    size={17}
                    className="mt-0.5 shrink-0 text-blue-700"
                  />

                  <div>
                    <p className="text-[8px] font-black uppercase tracking-[0.11em] text-slate-500">
                      Cash Interpretation
                    </p>
                    <p className="mt-1 font-black text-[#10233F]">
                      Operational, not bank-reconciled
                    </p>
                    <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">
                      {metadata.bankBalanceConnected
                        ? "A bank/reconciliation source is connected."
                        : "Operational net cash is derived from recorded Finance OS flows and must not be read as literal bank cash."}
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
                      Scope Boundary
                    </p>
                    <p className="mt-1 font-black text-[#10233F]">
                      Management signal only
                    </p>
                    <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">
                      {metadata.accountingBasis ||
                        "This is an operating CRM-finance snapshot, not audited accounting."}
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
