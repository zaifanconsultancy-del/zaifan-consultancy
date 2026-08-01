// RevenueIntelligencePanel V3 MAXIMUM — Founder Revenue Control
// src/components/admin/RevenueIntelligencePanel.jsx
//
// Maximum pass:
// - preserves growth prop and compact/full modes
// - removes hard-coded GBP-only formatting by supporting growth revenue currency
// - safer invoice/payment normalization
// - overdue detection can derive from due_date even when stored status is stale
// - excludes cancelled / void invoices from collectible counts
// - collection rate is clamped and guarded against invalid totals
// - adds outstanding ratio, payment coverage, overdue share and invoice health
// - keeps pipeline estimate transparent as a scenario model, not guaranteed revenue
// - exposes the exact offer/CAS weighting assumptions used
// - adds founder action logic based on real visible finance pressure
// - stronger Admin OS cream/orange/navy hierarchy
// - no backend writes, no fake collections, no currency mixing

import { useMemo } from "react";
import {
  AlertTriangle,
  Banknote,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  FileText,
  Landmark,
  ReceiptText,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  WalletCards,
} from "lucide-react";

function safeArray(value) {
  return Array.isArray(value) ? value.filter(Boolean) : [];
}

function safeNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function normalize(value = "") {
  return String(value || "").toLowerCase().trim();
}

function clamp(value, min = 0, max = 100) {
  return Math.max(min, Math.min(max, safeNumber(value)));
}

function safeDate(value) {
  if (!value) return null;

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatMoney(value, currency = "GBP") {
  const amount = safeNumber(value);

  try {
    return new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency: String(currency || "GBP").toUpperCase(),
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${String(currency || "GBP").toUpperCase()} ${Math.round(
      amount
    ).toLocaleString("en-GB")}`;
  }
}

function percentage(part, total) {
  const denominator = safeNumber(total);

  if (denominator <= 0) return 0;

  return clamp(
    Math.round((safeNumber(part) / denominator) * 100)
  );
}

function getInvoiceTotal(invoice = {}) {
  return Math.max(
    0,
    safeNumber(
      invoice.total_amount ??
        invoice.amount ??
        invoice.invoice_amount ??
        0
    )
  );
}

function getInvoicePaid(invoice = {}) {
  return Math.max(
    0,
    safeNumber(invoice.paid_amount ?? invoice.amount_paid ?? 0)
  );
}

function getInvoiceOutstanding(invoice = {}) {
  const explicit = invoice.outstanding_amount;

  if (explicit !== null && explicit !== undefined) {
    return Math.max(0, safeNumber(explicit));
  }

  return Math.max(
    0,
    getInvoiceTotal(invoice) - getInvoicePaid(invoice)
  );
}

function isInactiveInvoice(invoice = {}) {
  return ["cancelled", "canceled", "void"].includes(
    normalize(invoice.status)
  );
}

function isPaidInvoice(invoice = {}) {
  const status = normalize(invoice.status);

  return (
    ["paid", "settled", "completed"].includes(status) ||
    (getInvoiceTotal(invoice) > 0 &&
      getInvoiceOutstanding(invoice) <= 0)
  );
}

function isCollectibleInvoice(invoice = {}) {
  return (
    !isInactiveInvoice(invoice) &&
    !isPaidInvoice(invoice) &&
    getInvoiceOutstanding(invoice) > 0
  );
}

function isOverdueInvoice(invoice = {}) {
  if (!isCollectibleInvoice(invoice)) return false;

  if (normalize(invoice.status).includes("overdue")) {
    return true;
  }

  const due = safeDate(invoice.due_date);
  if (!due) return false;

  due.setHours(23, 59, 59, 999);

  return due < new Date();
}

function isConfirmedPayment(payment = {}) {
  const status = normalize(payment.status);

  return [
    "confirmed",
    "paid",
    "completed",
    "successful",
    "success",
    "received",
  ].some((token) => status.includes(token));
}

function getFinanceCurrency(growth = {}, invoices = [], payments = []) {
  const configured =
    growth.revenueCurrency ||
    growth.currency ||
    growth.financeCurrency;

  if (configured) {
    return String(configured).toUpperCase();
  }

  const invoiceCurrencies = new Set(
    invoices
      .map((invoice) => invoice.currency)
      .filter(Boolean)
      .map((value) => String(value).toUpperCase())
  );

  const paymentCurrencies = new Set(
    payments
      .map((payment) => payment.currency)
      .filter(Boolean)
      .map((value) => String(value).toUpperCase())
  );

  const combined = new Set([
    ...invoiceCurrencies,
    ...paymentCurrencies,
  ]);

  if (combined.size === 1) {
    return [...combined][0];
  }

  // Preserve previous behavior safely when no reliable single currency exists.
  return "GBP";
}

function RevenueIntelligencePanel({
  growth = {},
  compact = false,
}) {
  const invoices = safeArray(growth.invoices);
  const payments = safeArray(growth.payments);

  const offers = safeArray(growth.offers);
  const casRecords = safeArray(growth.casRecords);
  const visas = safeArray(growth.visas);

  const currency = getFinanceCurrency(
    growth,
    invoices,
    payments
  );

  const finance = useMemo(() => {
    const activeInvoices = [];
    const collectibleInvoices = [];
    const overdueInvoices = [];
    const paidInvoices = [];
    const confirmedPayments = [];

    let derivedInvoicedRevenue = 0;
    let derivedOutstandingRevenue = 0;
    let overdueValue = 0;

    for (const invoice of invoices) {
      if (isInactiveInvoice(invoice)) {
        continue;
      }

      activeInvoices.push(invoice);

      const invoiceTotal = getInvoiceTotal(invoice);
      const outstanding = getInvoiceOutstanding(invoice);

      derivedInvoicedRevenue += invoiceTotal;

      if (isPaidInvoice(invoice)) {
        paidInvoices.push(invoice);
      }

      if (isCollectibleInvoice(invoice)) {
        collectibleInvoices.push(invoice);
        derivedOutstandingRevenue += outstanding;

        if (isOverdueInvoice(invoice)) {
          overdueInvoices.push(invoice);
          overdueValue += outstanding;
        }
      }
    }

    let derivedCollectedRevenue = 0;

    for (const payment of payments) {
      if (!isConfirmedPayment(payment)) {
        continue;
      }

      confirmedPayments.push(payment);
      derivedCollectedRevenue += Math.max(
        0,
        safeNumber(
          payment.amount ??
            payment.paid_amount ??
            payment.total_amount
        )
      );
    }

    const invoicedRevenue = Math.max(
      0,
      safeNumber(
        growth.invoicedRevenue,
        derivedInvoicedRevenue
      )
    );

    const collectedRevenue = Math.max(
      0,
      safeNumber(
        growth.collectedRevenue,
        derivedCollectedRevenue
      )
    );

    const outstandingRevenue = Math.max(
      0,
      safeNumber(
        growth.outstandingRevenue,
        derivedOutstandingRevenue
      )
    );

    const averageInvoice = activeInvoices.length
      ? Math.round(
          derivedInvoicedRevenue / activeInvoices.length
        )
      : 0;

    const collectionRate = percentage(
      collectedRevenue,
      invoicedRevenue
    );

    const outstandingRate = percentage(
      outstandingRevenue,
      invoicedRevenue
    );

    const overdueShare = percentage(
      overdueValue,
      outstandingRevenue
    );

    const paymentCoverage = percentage(
      paidInvoices.length,
      activeInvoices.length
    );

    const offerWeight = clamp(
      growth.pipelineWeights?.offer ?? 45
    ) / 100;

    const casWeight = clamp(
      growth.pipelineWeights?.cas ?? 75
    ) / 100;

    const scenarioEstimate =
      averageInvoice > 0
        ? offers.length * averageInvoice * offerWeight +
          casRecords.length * averageInvoice * casWeight
        : 0;

    return {
      activeInvoices,
      collectibleInvoices,
      overdueInvoices,
      paidInvoices,
      confirmedPayments,
      invoicedRevenue,
      collectedRevenue,
      outstandingRevenue,
      overdueValue,
      averageInvoice,
      collectionRate,
      outstandingRate,
      overdueShare,
      paymentCoverage,
      offerWeight,
      casWeight,
      scenarioEstimate,
    };
  }, [
    growth,
    invoices,
    payments,
    offers.length,
    casRecords.length,
  ]);

  const health = useMemo(() => {
    if (finance.overdueShare >= 50) {
      return {
        label: "Collection Risk",
        tone: "danger",
        text:
          "A large share of outstanding revenue is overdue. Recovery should take priority over new finance activity.",
      };
    }

    if (finance.collectionRate < 50 && finance.invoicedRevenue > 0) {
      return {
        label: "Cash Conversion Weak",
        tone: "warning",
        text:
          "Less than half of invoiced revenue has been collected. Review unpaid invoices and payment follow-up.",
      };
    }

    if (
      finance.collectionRate >= 80 &&
      finance.overdueInvoices.length === 0
    ) {
      return {
        label: "Healthy Collections",
        tone: "good",
        text:
          "Collection performance is strong and no collectible invoice is currently overdue.",
      };
    }

    return {
      label: "Collections Active",
      tone: "orange",
      text:
        "Revenue is moving, but outstanding balances should remain part of daily founder review.",
    };
  }, [finance]);

  const founderAction = useMemo(() => {
    if (finance.overdueInvoices.length > 0) {
      return {
        title: "Recover overdue balances first",
        text: `${finance.overdueInvoices.length} collectible invoice${
          finance.overdueInvoices.length === 1 ? "" : "s"
        } currently represent ${formatMoney(
          finance.overdueValue,
          currency
        )} in overdue value. Clear these before relying on pipeline estimates.`,
      };
    }

    if (finance.collectibleInvoices.length > 0) {
      return {
        title: "Convert outstanding invoices into cash",
        text: `${finance.collectibleInvoices.length} open invoice${
          finance.collectibleInvoices.length === 1 ? "" : "s"
        } remain collectible. Continue payment follow-up before treating invoiced value as realized revenue.`,
      };
    }

    if (offers.length > 0 || casRecords.length > 0) {
      return {
        title: "Watch the short-term conversion pipeline",
        text:
          "Current invoices are under control. Use offer and CAS records as planning signals, but keep modeled pipeline revenue separate from collected cash.",
      };
    }

    return {
      title: "Build real revenue history",
      text:
        "Add real invoices and confirmed payments before using this panel for meaningful founder cash-control decisions.",
    };
  }, [
    finance,
    offers.length,
    casRecords.length,
    currency,
  ]);

  return (
    <section className="overflow-hidden rounded-[1.9rem] border-[3px] border-[#FFB38A] bg-white shadow-[0_14px_36px_rgba(15,35,63,0.06)]">
      <div className="grid xl:grid-cols-[1.25fr_0.75fr]">
        <div
          className="bg-[#123865] p-5 sm:p-6"
          style={{ color: "#FFFFFF" }}
        >
          <div className="inline-flex items-center gap-2 rounded-full border-2 border-white/25 bg-white/10 px-3 py-1.5">
            <Landmark
              size={13}
              style={{ color: "#FDBA74" }}
            />

            <p
              className="text-[9px] font-black uppercase tracking-[0.1em]"
              style={{ color: "#FFFFFF" }}
            >
              Revenue Intelligence
            </p>
          </div>

          <h2
            className="mt-3 text-2xl font-black sm:text-3xl"
            style={{ color: "#FFFFFF" }}
          >
            Founder Money View
          </h2>

          <p
            className="mt-2 max-w-3xl text-sm font-semibold leading-6"
            style={{ color: "#F8FAFC" }}
          >
            Separates invoiced value, confirmed collections, collectible
            balances, overdue exposure, and modeled pipeline potential.
          </p>
        </div>

        <div
          className="bg-[#FF5A0A] p-5 sm:p-6"
          style={{ color: "#FFFFFF" }}
        >
          <div className="flex items-center gap-2">
            <CircleDollarSign size={18} />

            <p className="text-[9px] font-black uppercase tracking-[0.1em] text-white">
              Cash Conversion
            </p>
          </div>

          <p className="mt-3 text-4xl font-black text-white">
            {finance.collectionRate}%
          </p>

          <p className="mt-1 text-xs font-black uppercase tracking-[0.08em] text-white">
            Collected
          </p>

          <p className="mt-4 text-xs font-semibold leading-5 text-white">
            {formatMoney(
              finance.collectedRevenue,
              currency
            )} confirmed from{" "}
            {formatMoney(
              finance.invoicedRevenue,
              currency
            )} invoiced.
          </p>
        </div>
      </div>

      <div className="min-w-0 bg-[#FFF8EF] p-4 sm:p-5">
        <div
          className={
            compact
              ? "grid gap-3 md:grid-cols-3"
              : "grid gap-3 md:grid-cols-2 xl:grid-cols-4"
          }
        >
          <RevenueCard
            label="Invoiced"
            value={formatMoney(
              finance.invoicedRevenue,
              currency
            )}
            helper={`${finance.activeInvoices.length} active invoice${
              finance.activeInvoices.length === 1 ? "" : "s"
            }`}
            tone="orange"
            icon={FileText}
          />

          <RevenueCard
            label="Collected"
            value={formatMoney(
              finance.collectedRevenue,
              currency
            )}
            helper={`${finance.confirmedPayments.length} confirmed payment${
              finance.confirmedPayments.length === 1 ? "" : "s"
            }`}
            tone="good"
            icon={Banknote}
          />

          <RevenueCard
            label="Outstanding"
            value={formatMoney(
              finance.outstandingRevenue,
              currency
            )}
            helper={`${finance.collectibleInvoices.length} collectible invoice${
              finance.collectibleInvoices.length === 1 ? "" : "s"
            }`}
            tone="warning"
            icon={WalletCards}
          />

          {!compact ? (
            <>
              <RevenueCard
                label="Overdue Value"
                value={formatMoney(
                  finance.overdueValue,
                  currency
                )}
                helper={`${finance.overdueInvoices.length} overdue invoice${
                  finance.overdueInvoices.length === 1 ? "" : "s"
                }`}
                tone={
                  finance.overdueInvoices.length
                    ? "danger"
                    : "good"
                }
                icon={AlertTriangle}
              />

              <RevenueCard
                label="Average Invoice"
                value={formatMoney(
                  finance.averageInvoice,
                  currency
                )}
                helper="Average across active invoices"
                tone="navy"
                icon={ReceiptText}
              />

              <RevenueCard
                label="Outstanding Ratio"
                value={`${finance.outstandingRate}%`}
                helper="Share of invoiced value still uncollected"
                tone={
                  finance.outstandingRate > 50
                    ? "warning"
                    : "orange"
                }
                icon={Clock3}
              />

              <RevenueCard
                label="Invoice Settlement"
                value={`${finance.paymentCoverage}%`}
                helper={`${finance.paidInvoices.length} fully settled invoice${
                  finance.paidInvoices.length === 1 ? "" : "s"
                }`}
                tone="good"
                icon={CheckCircle2}
              />

              <RevenueCard
                label="Overdue Share"
                value={`${finance.overdueShare}%`}
                helper="Share of outstanding value already overdue"
                tone={
                  finance.overdueShare >= 30
                    ? "danger"
                    : finance.overdueShare > 0
                    ? "warning"
                    : "good"
                }
                icon={ShieldCheck}
              />
            </>
          ) : null}
        </div>

        {!compact ? (
          <>
            <div className="mt-5 grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
              <ScenarioCard
                currency={currency}
                estimate={finance.scenarioEstimate}
                averageInvoice={finance.averageInvoice}
                offers={offers.length}
                casRecords={casRecords.length}
                offerWeight={finance.offerWeight}
                casWeight={finance.casWeight}
              />

              <FinanceHealthCard
                health={health}
                collectionRate={finance.collectionRate}
                overdueShare={finance.overdueShare}
                outstandingRate={finance.outstandingRate}
              />
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <SignalCard
                label="Offer Pipeline"
                value={offers.length}
                helper="Earlier-stage revenue opportunity"
                icon={TrendingUp}
              />

              <SignalCard
                label="CAS Pipeline"
                value={casRecords.length}
                helper="Higher-probability late-stage cases"
                icon={Sparkles}
              />

              <SignalCard
                label="Visa Records"
                value={visas.length}
                helper="Late student-journey records, not guaranteed revenue"
                icon={ShieldCheck}
              />

              <SignalCard
                label="Finance Currency"
                value={currency}
                helper="Single display currency for this panel"
                icon={CircleDollarSign}
              />
            </div>

            <div className="mt-5 rounded-[1.4rem] border-[3px] border-[#FFB38A] bg-[#FFF4EA] p-5">
              <div className="flex min-w-0 items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border-2 border-[#FFB38A] bg-white text-[#B84F0E]">
                  <Sparkles size={17} />
                </div>

                <div>
                  <p className="text-[9px] font-black uppercase tracking-[0.1em] text-[#B84F0E]">
                    Founder Action
                  </p>

                  <h3 className="mt-1 text-base font-black text-[#10233F]">
                    {founderAction.title}
                  </h3>

                  <p className="mt-2 text-sm font-semibold leading-6 text-[#51627A]">
                    {founderAction.text}
                  </p>
                </div>
              </div>
            </div>
          </>
        ) : null}
      </div>
    </section>
  );
}

function RevenueCard({
  label,
  value,
  helper,
  tone = "orange",
  icon: Icon,
}) {
  const dark = tone === "navy";

  const styles = {
    orange: "border-[#FFB38A] bg-[#FFF4EA]",
    good: "border-emerald-300 bg-emerald-50",
    warning: "border-amber-300 bg-amber-50",
    danger: "border-red-300 bg-red-50",
    navy: "border-[#123865] bg-[#123865]",
  };

  return (
    <div
      className={`rounded-[1.35rem] border-[3px] p-4 shadow-[0_6px_18px_rgba(15,35,63,0.035)] ${
        styles[tone] || styles.orange
      }`}
      style={{
        color: dark ? "#FFFFFF" : "#10233F",
      }}
    >
      <div className="flex min-w-0 items-start justify-between gap-3">
        <div className="min-w-0">
          <p
            className="text-[9px] font-black uppercase tracking-[0.1em]"
            style={{
              color: dark ? "#FDBA74" : "#64748B",
            }}
          >
            {label}
          </p>

          <p
            className="mt-2 break-words text-2xl font-black"
            style={{
              color: dark ? "#FFFFFF" : "#10233F",
            }}
          >
            {value}
          </p>
        </div>

        {Icon ? (
          <Icon
            size={18}
            className="shrink-0"
            style={{
              color: dark ? "#FDBA74" : "#C2410C",
            }}
          />
        ) : null}
      </div>

      {helper ? (
        <p
          className="mt-2 text-xs font-semibold leading-5"
          style={{
            color: dark ? "#F8FAFC" : "#64748B",
          }}
        >
          {helper}
        </p>
      ) : null}
    </div>
  );
}

function ScenarioCard({
  currency,
  estimate,
  averageInvoice,
  offers,
  casRecords,
  offerWeight,
  casWeight,
}) {
  return (
    <div className="rounded-[1.45rem] border-[3px] border-[#C9D7E6] bg-white p-5 shadow-[0_7px_20px_rgba(15,35,63,0.04)]">
      <div className="flex min-w-0 items-start justify-between gap-3">
        <div>
          <p className="text-[9px] font-black uppercase tracking-[0.1em] text-[#B84F0E]">
            Pipeline Scenario
          </p>

          <h3 className="mt-1 text-lg font-black text-[#10233F]">
            Modeled short-term potential
          </h3>
        </div>

        <TrendingUp className="h-5 w-5 text-[#B84F0E]" />
      </div>

      <p className="mt-4 text-3xl font-black text-[#10233F]">
        {formatMoney(estimate, currency)}
      </p>

      <p className="mt-2 text-sm font-semibold leading-6 text-[#51627A]">
        This is a planning estimate, <strong>not collected or guaranteed revenue</strong>.
        It uses the current average invoice as a rough value proxy.
      </p>

      <div className="mt-4 grid gap-2 sm:grid-cols-3">
        <MiniStat
          label="Avg Invoice"
          value={formatMoney(averageInvoice, currency)}
        />

        <MiniStat
          label="Offer Weight"
          value={`${Math.round(offerWeight * 100)}% · ${offers} cases`}
        />

        <MiniStat
          label="CAS Weight"
          value={`${Math.round(casWeight * 100)}% · ${casRecords} cases`}
        />
      </div>
    </div>
  );
}

function FinanceHealthCard({
  health,
  collectionRate,
  overdueShare,
  outstandingRate,
}) {
  const styles = {
    good: "border-emerald-300 bg-emerald-50",
    warning: "border-amber-300 bg-amber-50",
    danger: "border-red-300 bg-red-50",
    orange: "border-[#FFB38A] bg-[#FFF4EA]",
  };

  return (
    <div
      className={`rounded-[1.45rem] border-[3px] p-5 ${
        styles[health.tone] || styles.orange
      }`}
    >
      <div className="flex min-w-0 items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border-2 border-white bg-white text-[#B84F0E]">
          <ShieldCheck size={17} />
        </div>

        <div>
          <p className="text-[9px] font-black uppercase tracking-[0.1em] text-[#51627A]">
            Revenue Health
          </p>

          <h3 className="mt-1 text-lg font-black text-[#10233F]">
            {health.label}
          </h3>
        </div>
      </div>

      <p className="mt-3 text-sm font-semibold leading-6 text-[#51627A]">
        {health.text}
      </p>

      <div className="mt-4 space-y-3">
        <HealthRow
          label="Collected"
          value={collectionRate}
          tone="good"
        />

        <HealthRow
          label="Outstanding"
          value={outstandingRate}
          tone="orange"
        />

        <HealthRow
          label="Overdue Share"
          value={overdueShare}
          tone="danger"
        />
      </div>
    </div>
  );
}

function HealthRow({
  label,
  value,
  tone = "orange",
}) {
  const bar =
    tone === "good"
      ? "bg-emerald-500"
      : tone === "danger"
      ? "bg-red-500"
      : "bg-[#FF5A0A]";

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between gap-3">
        <span className="text-[10px] font-black uppercase tracking-[0.08em] text-[#65748B]">
          {label}
        </span>

        <span className="text-xs font-black text-[#10233F]">
          {value}%
        </span>
      </div>

      <div className="h-2 overflow-hidden rounded-full bg-white">
        <div
          className={`h-full rounded-full ${bar}`}
          style={{ width: `${clamp(value)}%` }}
        />
      </div>
    </div>
  );
}

function SignalCard({
  label,
  value,
  helper,
  icon: Icon,
}) {
  return (
    <div className="rounded-xl border-2 border-[#C9D7E6] bg-white p-4">
      <div className="flex min-w-0 items-start justify-between gap-3">
        <div>
          <p className="text-[9px] font-black uppercase tracking-[0.1em] text-[#65748B]">
            {label}
          </p>

          <p className="mt-2 text-xl font-black text-[#10233F]">
            {value}
          </p>
        </div>

        <Icon className="h-4 w-4 text-[#B84F0E]" />
      </div>

      <p className="mt-2 text-xs font-semibold leading-5 text-[#51627A]">
        {helper}
      </p>
    </div>
  );
}

function MiniStat({ label, value }) {
  return (
    <div className="rounded-xl border-2 border-[#C9D7E6] bg-[#FFF8EF] p-3">
      <p className="text-[8px] font-black uppercase tracking-[0.08em] text-[#65748B]">
        {label}
      </p>

      <p className="mt-1 text-xs font-black leading-5 text-[#10233F]">
        {value}
      </p>
    </div>
  );
}

export default RevenueIntelligencePanel;
