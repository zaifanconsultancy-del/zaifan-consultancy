import React, { useMemo } from "react";

function safeNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function money(value) {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    maximumFractionDigits: 0,
  }).format(safeNumber(value));
}

function lower(value) {
  return String(value || "").toLowerCase();
}

function RevenueCard({ label, value, helper, tone = "orange" }) {
  const tones = {
    orange: "border-orange-300 bg-orange-50 text-orange-700",
    emerald: "border-emerald-300 bg-emerald-50 text-emerald-700",
    amber: "border-amber-300 bg-amber-50 text-amber-700",
    rose: "border-rose-300 bg-rose-50 text-rose-700",
    violet: "border-violet-300 bg-violet-50 text-violet-700",
  };

  return (
    <div
      className={`rounded-3xl border-2 p-5 shadow-[0_6px_18px_rgba(15,35,63,0.035)] ${
        tones[tone] || tones.orange
      }`}
    >
      <p className="text-xs font-black uppercase tracking-[0.24em]">
        {label}
      </p>
      <p className="mt-3 text-2xl font-black text-[#10233f]">{value}</p>
      {helper ? (
        <p className="mt-2 text-sm font-medium text-slate-600">{helper}</p>
      ) : null}
    </div>
  );
}

export default function RevenueIntelligencePanel({
  growth = {},
  compact = false,
}) {
  const invoices = growth.invoices || [];
  const payments = growth.payments || [];

  const revenue = useMemo(() => {
    const overdueInvoices = invoices.filter((invoice) =>
      lower(invoice.status).includes("overdue")
    ).length;

    const pendingInvoices = invoices.filter(
      (invoice) =>
        lower(invoice.status).includes("pending") ||
        lower(invoice.status).includes("unpaid")
    ).length;

    const confirmedPayments = payments.filter(
      (payment) =>
        lower(payment.status).includes("confirm") ||
        lower(payment.status).includes("paid")
    ).length;

    const averageInvoice = invoices.length
      ? Math.round(safeNumber(growth.invoicedRevenue) / invoices.length)
      : 0;

    const collectionRate = growth.invoicedRevenue
      ? Math.round(
          (safeNumber(growth.collectedRevenue) /
            safeNumber(growth.invoicedRevenue)) *
            100
        )
      : 0;

    const expectedFromPipeline =
      safeNumber(growth.offers?.length) * averageInvoice * 0.45 +
      safeNumber(growth.casRecords?.length) * averageInvoice * 0.75;

    return {
      overdueInvoices,
      pendingInvoices,
      confirmedPayments,
      averageInvoice,
      collectionRate,
      expectedFromPipeline,
    };
  }, [growth, invoices, payments]);

  return (
    <section className="overflow-hidden rounded-3xl border-2 border-orange-300 bg-white shadow-[0_14px_36px_rgba(15,35,63,0.06)]">
      <div className="flex flex-col gap-2 border-b border-orange-200 bg-[#102f5c] p-5 text-white lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.25em] text-orange-300">
            Revenue Intelligence
          </p>
          <h2 className="mt-2 text-2xl font-black text-white">
            Founder Money View
          </h2>
          <p className="mt-1 text-sm text-slate-200">
            Invoiced, collected, outstanding, pending, overdue, and forecast
            revenue signals.
          </p>
        </div>

        <span className="rounded-2xl border-2 border-emerald-300 bg-emerald-50 px-4 py-2 text-xs font-black text-emerald-700">
          {revenue.collectionRate}% collected
        </span>
      </div>

      <div className="bg-[#fff8ee] p-5">
        <div
          className={
            compact
              ? "grid gap-3 md:grid-cols-3"
              : "grid gap-3 md:grid-cols-2 xl:grid-cols-4"
          }
        >
          <RevenueCard
            label="Invoiced"
            value={money(growth.invoicedRevenue)}
            helper={`${invoices.length} invoices`}
            tone="orange"
          />
          <RevenueCard
            label="Collected"
            value={money(growth.collectedRevenue)}
            helper={`${revenue.confirmedPayments || payments.length} payments`}
            tone="emerald"
          />
          <RevenueCard
            label="Outstanding"
            value={money(growth.outstandingRevenue)}
            helper={`${revenue.pendingInvoices} pending invoices`}
            tone="amber"
          />

          {!compact ? (
            <>
              <RevenueCard
                label="Overdue"
                value={revenue.overdueInvoices}
                helper="Payment risk"
                tone="rose"
              />
              <RevenueCard
                label="Average Invoice"
                value={money(revenue.averageInvoice)}
                helper="Per invoice"
                tone="violet"
              />
              <RevenueCard
                label="Pipeline Forecast"
                value={money(revenue.expectedFromPipeline)}
                helper="Offer/CAS weighted"
                tone="emerald"
              />
              <RevenueCard
                label="CAS Revenue Signal"
                value={growth.casRecords?.length || 0}
                helper="High probability cases"
                tone="orange"
              />
              <RevenueCard
                label="Visa Revenue Signal"
                value={growth.visas?.length || 0}
                helper="Late-stage success"
                tone="emerald"
              />
            </>
          ) : null}
        </div>

        {!compact ? (
          <div className="mt-5 rounded-3xl border border-slate-300 bg-white p-4 shadow-[0_4px_14px_rgba(15,35,63,0.03)]">
            <p className="text-sm font-black text-[#10233f]">Founder action</p>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Recover outstanding revenue first, then use CAS and offer-stage
              records as the short-term forecast pipeline. Once real payments
              are inserted, this view becomes the daily business cash-control
              panel.
            </p>
          </div>
        ) : null}
      </div>
    </section>
  );
}