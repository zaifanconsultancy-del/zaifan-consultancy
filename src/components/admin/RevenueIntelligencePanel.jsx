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

function RevenueCard({ label, value, helper, tone = "cyan" }) {
  const tones = {
    cyan: "border-cyan-400/20 bg-cyan-500/10",
    emerald: "border-emerald-400/20 bg-emerald-500/10",
    amber: "border-amber-400/20 bg-amber-500/10",
    rose: "border-rose-400/20 bg-rose-500/10",
    violet: "border-violet-400/20 bg-violet-500/10",
  };

  return (
    <div className={`rounded-3xl border p-5 ${tones[tone] || tones.cyan}`}>
      <p className="text-xs font-black uppercase tracking-[0.24em] text-slate-400">{label}</p>
      <p className="mt-3 text-2xl font-black text-white">{value}</p>
      {helper ? <p className="mt-2 text-sm text-slate-400">{helper}</p> : null}
    </div>
  );
}

export default function RevenueIntelligencePanel({ growth = {}, compact = false }) {
  const invoices = growth.invoices || [];
  const payments = growth.payments || [];

  const revenue = useMemo(() => {
    const overdueInvoices = invoices.filter((invoice) => lower(invoice.status).includes("overdue")).length;
    const pendingInvoices = invoices.filter((invoice) => lower(invoice.status).includes("pending") || lower(invoice.status).includes("unpaid")).length;
    const confirmedPayments = payments.filter((payment) => lower(payment.status).includes("confirm") || lower(payment.status).includes("paid")).length;

    const averageInvoice = invoices.length ? Math.round(safeNumber(growth.invoicedRevenue) / invoices.length) : 0;
    const collectionRate = growth.invoicedRevenue
      ? Math.round((safeNumber(growth.collectedRevenue) / safeNumber(growth.invoicedRevenue)) * 100)
      : 0;

    const expectedFromPipeline = safeNumber(growth.offers?.length) * averageInvoice * 0.45 + safeNumber(growth.casRecords?.length) * averageInvoice * 0.75;

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
    <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
      <div className="mb-5 flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.25em] text-emerald-300">Revenue Intelligence</p>
          <h2 className="mt-2 text-2xl font-black text-white">Founder Money View</h2>
          <p className="mt-1 text-sm text-slate-400">
            Invoiced, collected, outstanding, pending, overdue, and forecast revenue signals.
          </p>
        </div>

        <span className="rounded-2xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-2 text-xs font-black text-emerald-100">
          {revenue.collectionRate}% collected
        </span>
      </div>

      <div className={compact ? "grid gap-3 md:grid-cols-3" : "grid gap-3 md:grid-cols-2 xl:grid-cols-4"}>
        <RevenueCard label="Invoiced" value={money(growth.invoicedRevenue)} helper={`${invoices.length} invoices`} tone="cyan" />
        <RevenueCard label="Collected" value={money(growth.collectedRevenue)} helper={`${revenue.confirmedPayments || payments.length} payments`} tone="emerald" />
        <RevenueCard label="Outstanding" value={money(growth.outstandingRevenue)} helper={`${revenue.pendingInvoices} pending invoices`} tone="amber" />
        {!compact ? (
          <>
            <RevenueCard label="Overdue" value={revenue.overdueInvoices} helper="payment risk" tone="rose" />
            <RevenueCard label="Average Invoice" value={money(revenue.averageInvoice)} helper="per invoice" tone="violet" />
            <RevenueCard label="Pipeline Forecast" value={money(revenue.expectedFromPipeline)} helper="offer/CAS weighted" tone="emerald" />
            <RevenueCard label="CAS Revenue Signal" value={growth.casRecords?.length || 0} helper="high probability cases" tone="cyan" />
            <RevenueCard label="Visa Revenue Signal" value={growth.visas?.length || 0} helper="late-stage success" tone="emerald" />
          </>
        ) : null}
      </div>

      {!compact ? (
        <div className="mt-5 rounded-3xl border border-white/10 bg-slate-950/50 p-4">
          <p className="text-sm font-black text-white">Founder action</p>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            Recover outstanding revenue first, then use CAS and offer-stage records as the short-term forecast pipeline. Once real payments are inserted,
            this view becomes the daily business cash-control panel.
          </p>
        </div>
      ) : null}
    </section>
  );
}
