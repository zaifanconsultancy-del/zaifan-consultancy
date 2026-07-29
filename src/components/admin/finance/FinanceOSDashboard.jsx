import React, { useMemo, useState } from "react";
import {
  AlertTriangle,
  BadgeCheck,
  Banknote,
  BarChart3,
  Calculator,
  CircleDollarSign,
  Clock3,
  Database,
  FileWarning,
  Landmark,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  TrendingDown,
  TrendingUp,
  WalletCards,
} from "lucide-react";

import CashflowCommandCenter from "./CashflowCommandCenter";
import RevenueForecastPanel from "./RevenueForecastPanel";
import ExpenseManagementPanel from "./ExpenseManagementPanel";
import CommissionAccountingPanel from "./CommissionAccountingPanel";
import ProfitLossPanel from "./ProfitLossPanel";
import FinancialHealthPanel from "./FinancialHealthPanel";

function safeArray(value) {
  return Array.isArray(value) ? value.filter(Boolean) : [];
}

function number(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function nullableNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function lower(value) {
  return String(value || "").trim().toLowerCase();
}

function cleanCurrency(value) {
  const code = String(value || "").trim().toUpperCase();
  return /^[A-Z]{3}$/.test(code) ? code : "";
}

function money(value, currency = "GBP") {
  if (value === null || value === undefined || !Number.isFinite(Number(value))) {
    return "Unavailable";
  }

  try {
    return new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency: cleanCurrency(currency) || "GBP",
      maximumFractionDigits: 0,
    }).format(Number(value));
  } catch {
    return `${cleanCurrency(currency) || "GBP"} ${Math.round(Number(value)).toLocaleString("en-GB")}`;
  }
}

function getAmount(record = {}) {
  return number(
    record.amount ??
      record.total_amount ??
      record.invoice_amount ??
      record.payment_amount ??
      record.paid_amount ??
      record.expense_amount ??
      record.cost ??
      record.spend ??
      record.commission_amount ??
      0
  );
}

function getCurrency(record = {}) {
  return cleanCurrency(
    record.currency ||
      record.currency_code ||
      record.payment_currency ||
      record.invoice_currency ||
      record.expense_currency
  );
}

function getStatus(record = {}) {
  return lower(
    record.status ||
      record.payment_status ||
      record.invoice_status ||
      record.state
  );
}

function isPaid(record = {}) {
  const status = getStatus(record);

  return (
    status.includes("paid") ||
    status.includes("confirmed") ||
    status.includes("completed") ||
    status.includes("cleared") ||
    status.includes("settled")
  );
}

function isOverdue(record = {}) {
  const status = getStatus(record);

  if (status.includes("overdue")) return true;
  if (isPaid(record)) return false;

  const dueDate =
    record.due_date ||
    record.dueAt ||
    record.payment_due_date ||
    record.due_on ||
    record.deadline;

  if (!dueDate) return false;

  const time = new Date(dueDate).getTime();
  return Number.isFinite(time) && time < Date.now();
}

function getExpenseCategory(record = {}) {
  return (
    record.category ||
    record.expense_category ||
    record.type ||
    record.department ||
    "General"
  );
}

function resolveCurrency(snapshot, groups) {
  const direct =
    cleanCurrency(snapshot?.currency) ||
    cleanCurrency(snapshot?.currencyCode) ||
    cleanCurrency(snapshot?.financeCurrency) ||
    cleanCurrency(snapshot?.baseCurrency);

  if (direct) {
    return {
      code: direct,
      source: "snapshot",
      mixed: false,
      detected: [direct],
    };
  }

  const detected = new Set();

  groups.forEach((rows) => {
    safeArray(rows).forEach((row) => {
      const currency = getCurrency(row);
      if (currency) detected.add(currency);
    });
  });

  const values = [...detected];

  if (values.length === 1) {
    return {
      code: values[0],
      source: "records",
      mixed: false,
      detected: values,
    };
  }

  if (values.length > 1) {
    return {
      code: values[0],
      source: "records",
      mixed: true,
      detected: values,
    };
  }

  return {
    code: "GBP",
    source: "display-default",
    mixed: false,
    detected: [],
  };
}

function buildAverageInvoice({ invoices, payments }) {
  const invoiceAmounts = safeArray(invoices)
    .map(getAmount)
    .filter((value) => value > 0);

  if (invoiceAmounts.length) {
    const total = invoiceAmounts.reduce((sum, value) => sum + value, 0);

    return {
      value: Math.round(total / invoiceAmounts.length),
      basis: "invoice-records",
      sampleSize: invoiceAmounts.length,
      estimated: false,
    };
  }

  const paymentAmounts = safeArray(payments)
    .map(getAmount)
    .filter((value) => value > 0);

  if (paymentAmounts.length) {
    const total = paymentAmounts.reduce((sum, value) => sum + value, 0);

    return {
      value: Math.round(total / paymentAmounts.length),
      basis: "payment-records",
      sampleSize: paymentAmounts.length,
      estimated: true,
    };
  }

  return {
    value: null,
    basis: "unavailable",
    sampleSize: 0,
    estimated: false,
  };
}

function buildForecast({ applications, offers, casRecords, visas, averageInvoice }) {
  if (!averageInvoice?.value || averageInvoice.value <= 0) {
    return {
      available: false,
      reason:
        "Revenue forecast needs real invoice or payment history before a monetary projection can be calculated.",
      basis: averageInvoice?.basis || "unavailable",
      day30: null,
      day60: null,
      day90: null,
      confidence: "unavailable",
      weights: null,
    };
  }

  // These are explicitly labelled operating assumptions rather than real revenue.
  // Keeping them centralized here prevents estimated values being mistaken for booked cash.
  const weights = {
    applications: { day30: 0.05, day60: 0.12, day90: 0.25 },
    offers: { day30: 0.2, day60: 0.38, day90: 0.55 },
    cas: { day30: 0.45, day60: 0.65, day90: 0.8 },
    visas: { day30: 0.15, day60: 0.25, day90: 0.35 },
  };

  const calculate = (period) =>
    Math.round(
      (
        applications.length * weights.applications[period] +
        offers.length * weights.offers[period] +
        casRecords.length * weights.cas[period] +
        visas.length * weights.visas[period]
      ) * averageInvoice.value
    );

  const stageRecords =
    applications.length + offers.length + casRecords.length + visas.length;

  return {
    available: stageRecords > 0,
    reason:
      stageRecords > 0
        ? "Weighted operating estimate based on current pipeline stage counts and real historical invoice/payment value."
        : "No application, offer, CAS, or visa pipeline records are available for forecasting.",
    basis: averageInvoice.basis,
    day30: stageRecords > 0 ? calculate("day30") : null,
    day60: stageRecords > 0 ? calculate("day60") : null,
    day90: stageRecords > 0 ? calculate("day90") : null,
    confidence:
      averageInvoice.sampleSize >= 10
        ? "medium"
        : averageInvoice.sampleSize >= 3
          ? "low-medium"
          : "low",
    weights,
  };
}

function buildHealthScore({
  collected,
  overdue,
  outstanding,
  totalExpenses,
  totalCommissions,
  margin,
  forecast,
  evidence,
}) {
  const evidenceCount = [
    evidence.hasInvoices,
    evidence.hasPayments,
    evidence.hasExpenses,
    evidence.hasCommissions,
  ].filter(Boolean).length;

  if (evidenceCount < 2) {
    return {
      value: null,
      available: false,
      reason:
        "Financial health needs at least two live finance data sources before Zaifan scores the business.",
      evidenceCount,
    };
  }

  let score = 70;

  if (collected > 0) score += 8;
  if (margin >= 25) score += 8;
  else if (margin < 0) score -= 20;
  else if (margin < 10) score -= 8;

  if (overdue > 0) score -= 12;
  if (outstanding > collected && outstanding > 0) score -= 8;

  const totalOutflow = totalExpenses + totalCommissions;

  if (collected > 0 && totalOutflow > collected) score -= 12;

  if (
    forecast.available &&
    Number.isFinite(forecast.day60) &&
    forecast.day60 > totalOutflow
  ) {
    score += 6;
  }

  return {
    value: Math.max(0, Math.min(100, Math.round(score))),
    available: true,
    reason:
      "Operational health signal based only on currently connected finance evidence. It is not an accounting audit or bank-balance score.",
    evidenceCount,
  };
}

export function buildFinanceOSData(snapshot = {}) {
  const students = safeArray(
    snapshot.students || snapshot.inquiries || snapshot.leads
  );

  const applications = safeArray(
    snapshot.applications || snapshot.studentApplications
  );

  const offers = safeArray(snapshot.offers || snapshot.studentOffers);
  const casRecords = safeArray(snapshot.casRecords || snapshot.cas);
  const visas = safeArray(snapshot.visas || snapshot.studentVisas);
  const invoices = safeArray(snapshot.invoices || snapshot.studentInvoices);
  const payments = safeArray(snapshot.payments || snapshot.studentPayments);

  const expenses = safeArray(
    snapshot.expenses ||
      snapshot.companyExpenses ||
      snapshot.marketingExpenses ||
      snapshot.adSpend
  );

  const commissions = safeArray(
    snapshot.commissions ||
      snapshot.agentCommissions ||
      snapshot.counselorCommissions
  );

  const agentRows = safeArray(
    snapshot.agents ||
      snapshot.agentPerformance ||
      snapshot.agentStudents
  );

  const currencyMeta = resolveCurrency(snapshot, [
    invoices,
    payments,
    expenses,
    commissions,
  ]);

  const evidence = {
    hasStudents: students.length > 0,
    hasApplications: applications.length > 0,
    hasOffers: offers.length > 0,
    hasCas: casRecords.length > 0,
    hasVisas: visas.length > 0,
    hasInvoices: invoices.length > 0,
    hasPayments: payments.length > 0,
    hasExpenses: expenses.length > 0,
    hasCommissions: commissions.length > 0 || agentRows.length > 0,
  };

  const invoiced = invoices.reduce((sum, item) => sum + getAmount(item), 0);
  const collected = payments.reduce((sum, item) => sum + getAmount(item), 0);

  const paidInvoices = invoices
    .filter(isPaid)
    .reduce((sum, item) => sum + getAmount(item), 0);

  const recognisedCollected = Math.max(collected, paidInvoices);

  const outstanding = Math.max(0, invoiced - recognisedCollected);

  const overdue = invoices
    .filter(isOverdue)
    .reduce((sum, item) => sum + getAmount(item), 0);

  const expenseRows = expenses.map((expense, index) => ({
    id: expense.id || `expense-${index}`,
    title:
      expense.title ||
      expense.name ||
      expense.description ||
      getExpenseCategory(expense),
    category: getExpenseCategory(expense),
    amount: getAmount(expense),
    status: expense.status || "Recorded",
    date:
      expense.date ||
      expense.created_at ||
      expense.createdAt ||
      expense.updated_at ||
      null,
    currency: getCurrency(expense) || currencyMeta.code,
    sourceType: "recorded-expense",
    estimated: false,
  }));

  const recordedCommissionRows = commissions.map((item, index) => ({
    id: item.id || `commission-${index}`,
    partner:
      item.agent_name ||
      item.partner_name ||
      item.counselor_name ||
      item.name ||
      "Partner",
    type: item.type || item.commission_type || "Partner",
    amount: getAmount(item),
    status: item.status || "Pending",
    student: item.student_name || item.student || "Linked student",
    currency: getCurrency(item) || currencyMeta.code,
    sourceType: "recorded-commission",
    estimated: false,
  }));

  const estimatedAgentCommissionRows = agentRows
    .filter(
      (item) =>
        number(
          item.commissionDue ||
            item.commission_due ||
            item.commission_amount
        ) > 0
    )
    .map((item, index) => ({
      id: item.id || `agent-commission-${index}`,
      partner: item.agent || item.name || item.agent_name || "Agent",
      type: "Agent",
      amount: number(
        item.commissionDue ||
          item.commission_due ||
          item.commission_amount
      ),
      status: item.status || "Estimated",
      student: item.student_name || item.student || "Portfolio commission",
      currency: getCurrency(item) || currencyMeta.code,
      sourceType: "agent-derived-estimate",
      estimated: true,
    }));

  const commissionRows = [
    ...recordedCommissionRows,
    ...estimatedAgentCommissionRows,
  ];

  const totalExpenses = expenseRows.reduce(
    (sum, item) => sum + item.amount,
    0
  );

  const recordedCommissions = recordedCommissionRows.reduce(
    (sum, item) => sum + item.amount,
    0
  );

  const estimatedCommissions = estimatedAgentCommissionRows.reduce(
    (sum, item) => sum + item.amount,
    0
  );

  // P&L uses recorded commissions only. Estimated commissions remain visible
  // separately so projections never silently reduce realised profit.
  const totalCommissions = recordedCommissions;

  const grossProfit = recognisedCollected - totalCommissions;
  const netProfit = recognisedCollected - totalExpenses - totalCommissions;

  const margin =
    recognisedCollected > 0
      ? Math.round((netProfit / recognisedCollected) * 100)
      : null;

  const operationalNetCash =
    recognisedCollected - totalExpenses - totalCommissions;

  const averageInvoiceMeta = buildAverageInvoice({
    invoices,
    payments,
  });

  const forecast = buildForecast({
    applications,
    offers,
    casRecords,
    visas,
    averageInvoice: averageInvoiceMeta,
  });

  const categoryMap = new Map();

  expenseRows.forEach((expense) => {
    categoryMap.set(
      expense.category,
      (categoryMap.get(expense.category) || 0) + expense.amount
    );
  });

  if (recordedCommissions > 0) {
    categoryMap.set(
      "Recorded Commissions",
      (categoryMap.get("Recorded Commissions") || 0) +
        recordedCommissions
    );
  }

  const expenseCategories = Array.from(categoryMap.entries())
    .map(([name, amount]) => ({ name, amount }))
    .sort((a, b) => b.amount - a.amount);

  const pipeline = [
    {
      key: "applications",
      label: "Applications",
      count: applications.length,
      value:
        forecast.available && averageInvoiceMeta.value
          ? Math.round(
              applications.length *
                averageInvoiceMeta.value *
                forecast.weights.applications.day90
            )
          : null,
      estimated: true,
    },
    {
      key: "offers",
      label: "Offers",
      count: offers.length,
      value:
        forecast.available && averageInvoiceMeta.value
          ? Math.round(
              offers.length *
                averageInvoiceMeta.value *
                forecast.weights.offers.day90
            )
          : null,
      estimated: true,
    },
    {
      key: "cas",
      label: "CAS",
      count: casRecords.length,
      value:
        forecast.available && averageInvoiceMeta.value
          ? Math.round(
              casRecords.length *
                averageInvoiceMeta.value *
                forecast.weights.cas.day90
            )
          : null,
      estimated: true,
    },
    {
      key: "visas",
      label: "Visas",
      count: visas.length,
      value:
        forecast.available && averageInvoiceMeta.value
          ? Math.round(
              visas.length *
                averageInvoiceMeta.value *
                forecast.weights.visas.day90
            )
          : null,
      estimated: true,
    },
  ];

  const health = buildHealthScore({
    collected: recognisedCollected,
    overdue,
    outstanding,
    totalExpenses,
    totalCommissions,
    margin,
    forecast,
    evidence,
  });

  const sourceCount = Object.values(evidence).filter(Boolean).length;

  const completeness = {
    sourceCount,
    financeSourceCount: [
      evidence.hasInvoices,
      evidence.hasPayments,
      evidence.hasExpenses,
      evidence.hasCommissions,
    ].filter(Boolean).length,
    pipelineSourceCount: [
      evidence.hasApplications,
      evidence.hasOffers,
      evidence.hasCas,
      evidence.hasVisas,
    ].filter(Boolean).length,
  };

  const warnings = [];

  if (currencyMeta.mixed) {
    warnings.push(
      `Mixed currencies detected (${currencyMeta.detected.join(
        ", "
      )}). Finance OS does not convert currencies automatically.`
    );
  }

  if (!evidence.hasInvoices) {
    warnings.push("No invoice records are connected.");
  }

  if (!evidence.hasPayments) {
    warnings.push("No payment records are connected.");
  }

  if (estimatedAgentCommissionRows.length) {
    warnings.push(
      `${estimatedAgentCommissionRows.length} commission row${
        estimatedAgentCommissionRows.length === 1 ? "" : "s"
      } are estimates derived from agent data and are excluded from realised P&L.`
    );
  }

  if (!forecast.available) {
    warnings.push(forecast.reason);
  }

  return {
    raw: {
      students,
      applications,
      offers,
      casRecords,
      visas,
      invoices,
      payments,
      expenses,
      commissions,
      agentRows,
    },

    currency: currencyMeta.code,

    currencyMeta,

    evidence,

    completeness,

    warnings,

    totals: {
      invoiced,
      collected: recognisedCollected,
      collectedFromPayments: collected,
      paidInvoiceValue: paidInvoices,
      outstanding,
      overdue,
      totalExpenses,
      totalCommissions,
      recordedCommissions,
      estimatedCommissions,
      grossProfit,
      netProfit,
      margin,
      averageInvoice: averageInvoiceMeta.value,
      averageInvoiceMeta,
      cashOnHand: operationalNetCash,
      operationalNetCash,
      healthScore: health.value,
      healthAvailable: health.available,
      healthReason: health.reason,
    },

    forecast,

    expenseRows,

    commissionRows,

    expenseCategories,

    pipeline,

    metadata: {
      sourceCount,
      financeSourceCount: completeness.financeSourceCount,
      pipelineSourceCount: completeness.pipelineSourceCount,
      generatedAt: new Date().toISOString(),
      forecastIsEstimate: true,
      bankBalanceConnected: false,
      accountingBasis:
        "Operational CRM finance snapshot; not a replacement for bank reconciliation or statutory accounts.",
    },
  };
}

const VIEW_CONFIG = [
  { key: "overview", label: "Overview", icon: BarChart3 },
  { key: "cashflow", label: "Cashflow", icon: WalletCards },
  { key: "forecast", label: "Forecast", icon: TrendingUp },
  { key: "expenses", label: "Expenses", icon: TrendingDown },
  { key: "commissions", label: "Commissions", icon: CircleDollarSign },
  { key: "profit-loss", label: "P&L", icon: Calculator },
  { key: "health", label: "Health", icon: ShieldCheck },
];

function getMetricTone(type) {
  const map = {
    navy: "border-[#123865] bg-[#123865] text-white",
    orange: "border-[#F97316] bg-[#FFF4E8] text-[#10233F]",
    green: "border-[#34D399] bg-[#F0FFF8] text-[#10233F]",
    amber: "border-[#F59E0B] bg-[#FFF8E8] text-[#10233F]",
    red: "border-[#FB7185] bg-[#FFF4F4] text-[#10233F]",
    blue: "border-[#60A5FA] bg-[#F2F7FF] text-[#10233F]",
    violet: "border-[#9B6CFF] bg-[#F8F5FF] text-[#10233F]",
  };

  return map[type] || map.orange;
}

function MetricCard({
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
      className={`min-w-0 rounded-[1.45rem] border-[3px] p-4 shadow-[0_7px_20px_rgba(15,35,63,0.05)] ${getMetricTone(
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
                : "border-current/20 bg-white/70"
            }`}
          >
            <Icon size={16} />
          </div>
        ) : null}
      </div>

      {helper ? (
        <p
          className={`mt-2 break-words text-xs font-semibold leading-5 ${
            dark ? "text-slate-200" : "text-slate-600"
          }`}
        >
          {helper}
        </p>
      ) : null}

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

function DataQualityStrip({ finance }) {
  const financeSources = finance.completeness?.financeSourceCount || 0;
  const pipelineSources = finance.completeness?.pipelineSourceCount || 0;
  const warningCount = finance.warnings?.length || 0;

  return (
    <div className="grid gap-3 lg:grid-cols-3">
      <QualityCard
        icon={Database}
        eyebrow="Finance Evidence"
        value={`${financeSources}/4 sources`}
        helper="Invoices, payments, expenses and commissions connected."
        tone={financeSources >= 3 ? "green" : financeSources >= 1 ? "amber" : "red"}
      />

      <QualityCard
        icon={Sparkles}
        eyebrow="Forecast Evidence"
        value={`${pipelineSources}/4 stages`}
        helper="Applications, offers, CAS and visa pipeline currently available."
        tone={pipelineSources >= 3 ? "green" : pipelineSources >= 1 ? "amber" : "red"}
      />

      <QualityCard
        icon={warningCount ? AlertTriangle : BadgeCheck}
        eyebrow="Integrity Status"
        value={warningCount ? `${warningCount} warning${warningCount === 1 ? "" : "s"}` : "Clean"}
        helper={
          warningCount
            ? "Finance OS is preserving uncertainty instead of inventing values."
            : "No major finance-data integrity warnings detected."
        }
        tone={warningCount ? "amber" : "green"}
      />
    </div>
  );
}

function QualityCard({ icon: Icon, eyebrow, value, helper, tone }) {
  const toneClass =
    tone === "green"
      ? "border-[#34D399] bg-[#F0FFF8]"
      : tone === "red"
        ? "border-[#FB7185] bg-[#FFF4F4]"
        : "border-[#F59E0B] bg-[#FFF8E8]";

  return (
    <div className={`rounded-[1.35rem] border-[3px] p-4 ${toneClass}`}>
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border-2 border-[#123865]/15 bg-white text-[#123865]">
          <Icon size={16} />
        </div>

        <div className="min-w-0">
          <p className="text-[8px] font-black uppercase tracking-[0.11em] text-slate-500">
            {eyebrow}
          </p>
          <p className="mt-1 text-lg font-black text-[#10233F]">{value}</p>
          <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">
            {helper}
          </p>
        </div>
      </div>
    </div>
  );
}

function IntegrityBanner({ finance }) {
  const warnings = finance.warnings || [];

  if (!warnings.length) {
    return (
      <div className="flex items-start gap-3 rounded-[1.35rem] border-[3px] border-[#34D399] bg-[#F0FFF8] p-4">
        <BadgeCheck size={18} className="mt-0.5 shrink-0 text-emerald-700" />
        <div>
          <p className="font-black text-[#10233F]">
            Finance evidence looks internally consistent
          </p>
          <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">
            Zaifan is using connected records only. Forecasts remain explicitly
            marked as estimates.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-[1.35rem] border-[3px] border-[#F59E0B] bg-[#FFF8E8] p-4">
      <div className="flex items-start gap-3">
        <FileWarning size={18} className="mt-0.5 shrink-0 text-amber-700" />

        <div className="min-w-0">
          <p className="font-black text-[#10233F]">
            Finance OS is running with incomplete evidence
          </p>

          <div className="mt-2 space-y-1.5">
            {warnings.slice(0, 4).map((warning) => (
              <p
                key={warning}
                className="text-xs font-semibold leading-5 text-amber-900"
              >
                • {warning}
              </p>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function ModuleUnavailable({ title, message, icon: Icon = Database }) {
  return (
    <div className="rounded-[1.7rem] border-[3px] border-dashed border-[#C9D7E6] bg-white p-8 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border-2 border-[#F97316] bg-[#FFF4E8] text-orange-700">
        <Icon size={24} />
      </div>

      <h3 className="mt-4 text-xl font-black text-[#10233F]">{title}</h3>

      <p className="mx-auto mt-2 max-w-xl text-sm font-semibold leading-6 text-slate-600">
        {message}
      </p>
    </div>
  );
}

function Overview({ finance }) {
  const totals = finance.totals;
  const currency = finance.currency;

  return (
    <div className="space-y-5">
      <DataQualityStrip finance={finance} />

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        <MetricCard
          label="Collected"
          value={money(totals.collected, currency)}
          helper="Confirmed payments / paid invoice evidence."
          tone="green"
          icon={Banknote}
          badge="Recorded"
        />

        <MetricCard
          label="Outstanding"
          value={money(totals.outstanding, currency)}
          helper={`${money(totals.overdue, currency)} overdue`}
          tone="amber"
          icon={Clock3}
          badge="Receivable"
        />

        <MetricCard
          label="Expenses"
          value={money(totals.totalExpenses, currency)}
          helper="Recorded operating expenses."
          tone="red"
          icon={TrendingDown}
          badge="Recorded"
        />

        <MetricCard
          label="Commissions"
          value={money(totals.totalCommissions, currency)}
          helper={
            totals.estimatedCommissions > 0
              ? `${money(
                  totals.estimatedCommissions,
                  currency
                )} additional estimated exposure`
              : "Recorded commission payouts/exposure."
          }
          tone="violet"
          icon={CircleDollarSign}
          badge={totals.estimatedCommissions > 0 ? "Recorded + estimate separated" : "Recorded"}
        />

        <MetricCard
          label="Net Profit"
          value={money(totals.netProfit, currency)}
          helper={
            totals.margin === null
              ? "Margin unavailable without collected revenue."
              : `${totals.margin}% recorded operating margin`
          }
          tone={totals.netProfit >= 0 ? "green" : "red"}
          icon={totals.netProfit >= 0 ? TrendingUp : TrendingDown}
          badge="Operational"
        />

        <MetricCard
          label="Health"
          value={
            totals.healthAvailable && Number.isFinite(totals.healthScore)
              ? `${totals.healthScore}%`
              : "Unavailable"
          }
          helper={totals.healthReason}
          tone={
            !totals.healthAvailable
              ? "blue"
              : totals.healthScore >= 70
                ? "green"
                : totals.healthScore >= 45
                  ? "amber"
                  : "red"
          }
          icon={ShieldCheck}
          badge="Evidence-based"
        />
      </div>

      <IntegrityBanner finance={finance} />

      <div className="grid gap-4 xl:grid-cols-2">
        <CashflowCommandCenter finance={finance} compact />

        {finance.forecast.available ? (
          <RevenueForecastPanel finance={finance} compact />
        ) : (
          <ModuleUnavailable
            title="Revenue forecast unavailable"
            message={finance.forecast.reason}
            icon={TrendingUp}
          />
        )}
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <ProfitLossPanel finance={finance} compact />

        <FinancialHealthPanel finance={finance} compact />
      </div>
    </div>
  );
}

export default function FinanceOSDashboard({
  snapshot,
  adminProfile,
  onRefresh,
}) {
  const [activeView, setActiveView] = useState("overview");

  const finance = useMemo(
    () => buildFinanceOSData(snapshot || {}),
    [snapshot]
  );

  const ActiveViewIcon =
    VIEW_CONFIG.find((view) => view.key === activeView)?.icon || BarChart3;

  const renderActiveView = () => {
    if (activeView === "overview") {
      return <Overview finance={finance} />;
    }

    if (activeView === "cashflow") {
      return <CashflowCommandCenter finance={finance} />;
    }

    if (activeView === "forecast") {
      return finance.forecast.available ? (
        <RevenueForecastPanel finance={finance} />
      ) : (
        <ModuleUnavailable
          title="Forecast needs more real finance evidence"
          message={finance.forecast.reason}
          icon={TrendingUp}
        />
      );
    }

    if (activeView === "expenses") {
      return finance.evidence.hasExpenses ? (
        <ExpenseManagementPanel finance={finance} />
      ) : (
        <ModuleUnavailable
          title="No expense ledger connected"
          message="Zaifan will not invent company expenses. Connect or populate the real expense source before this workspace calculates cost pressure."
          icon={TrendingDown}
        />
      );
    }

    if (activeView === "commissions") {
      return finance.evidence.hasCommissions ? (
        <CommissionAccountingPanel finance={finance} />
      ) : (
        <ModuleUnavailable
          title="No commission evidence connected"
          message="Agent, partner and counselor commission records will appear here when real commission or agent-payout data exists."
          icon={CircleDollarSign}
        />
      );
    }

    if (activeView === "profit-loss") {
      return finance.completeness.financeSourceCount >= 1 ? (
        <ProfitLossPanel finance={finance} />
      ) : (
        <ModuleUnavailable
          title="P&L unavailable"
          message="At least one real finance source is required before Zaifan presents an operating profit-and-loss view."
          icon={Calculator}
        />
      );
    }

    if (activeView === "health") {
      return finance.totals.healthAvailable ? (
        <FinancialHealthPanel finance={finance} />
      ) : (
        <ModuleUnavailable
          title="Financial health not yet scorable"
          message={finance.totals.healthReason}
          icon={ShieldCheck}
        />
      );
    }

    return null;
  };

  return (
    <div className="space-y-5 text-[#10233F]">
      <section className="overflow-hidden rounded-[2rem] border-[3px] border-[#123865] bg-[#FFFDF8] shadow-[0_18px_50px_rgba(15,35,63,0.10)]">
        <div className="grid xl:grid-cols-[minmax(0,1.2fr)_minmax(20rem,0.8fr)]">
          <div className="bg-[#123865] p-5 text-white sm:p-6">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-2 rounded-full border-2 border-orange-300/30 bg-orange-400/10 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.12em] text-orange-300">
                <Landmark size={12} />
                Finance OS
              </span>

              <span className="rounded-full border-2 border-white/20 bg-white/10 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.1em] text-white">
                {finance.currency}
              </span>

              <span className="rounded-full border-2 border-white/20 bg-white/10 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.1em] text-white">
                {finance.completeness.financeSourceCount}/4 finance sources
              </span>
            </div>

            <h1 className="mt-4 text-3xl font-black tracking-tight text-white sm:text-4xl">
              Financial Command Center
            </h1>

            <p className="mt-3 max-w-4xl text-sm font-semibold leading-6 text-slate-200">
              Real-data-first operating finance for collections, receivables,
              expenses, commissions, profit, forecast evidence and business
              health. Missing data stays missing instead of being replaced by
              fake money.
            </p>

            {adminProfile?.email ? (
              <p className="mt-4 text-xs font-bold text-orange-200">
                Finance workspace for {adminProfile.email}
              </p>
            ) : null}
          </div>

          <div className="border-t-[3px] border-[#F97316] bg-[#FF5A0A] p-5 text-white sm:p-6 xl:border-l-[3px] xl:border-t-0">
            <div className="flex items-center gap-2">
              <ActiveViewIcon size={17} />
              <p className="text-[9px] font-black uppercase tracking-[0.12em] text-white">
                Current Workspace
              </p>
            </div>

            <p className="mt-3 text-2xl font-black text-white">
              {VIEW_CONFIG.find((view) => view.key === activeView)?.label}
            </p>

            <p className="mt-2 text-xs font-semibold leading-5 text-orange-50">
              {finance.metadata.accountingBasis}
            </p>

            <div className="mt-4 flex flex-wrap gap-2">
              <span className="rounded-full border-2 border-white/25 bg-white/10 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.08em] text-white">
                {finance.warnings.length
                  ? `${finance.warnings.length} integrity warning${
                      finance.warnings.length === 1 ? "" : "s"
                    }`
                  : "Integrity clear"}
              </span>

              <span className="rounded-full border-2 border-white/25 bg-white/10 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.08em] text-white">
                Forecast = estimate
              </span>
            </div>
          </div>
        </div>
      </section>

      <nav
        aria-label="Finance OS modules"
        className="sticky top-3 z-20 rounded-[1.7rem] border-[3px] border-[#C9D7E6] bg-[#FFFDF8] p-3 shadow-[0_12px_34px_rgba(15,35,63,0.08)]"
      >
        <div className="flex gap-2 overflow-x-auto pb-1">
          {VIEW_CONFIG.map((view) => {
            const Icon = view.icon;
            const active = activeView === view.key;

            return (
              <button
                key={view.key}
                type="button"
                onClick={() => setActiveView(view.key)}
                aria-current={active ? "page" : undefined}
                className={`inline-flex min-h-11 shrink-0 items-center gap-2 rounded-xl border-2 px-3.5 py-2 text-xs font-black transition ${
                  active
                    ? "border-[#F97316] bg-[#FF5A0A] text-white shadow-[0_6px_16px_rgba(249,115,22,0.18)]"
                    : "border-[#C9D7E6] bg-white text-[#10233F] hover:border-[#F97316] hover:bg-[#FFF4E8]"
                }`}
              >
                <Icon size={14} />
                {view.label}
              </button>
            );
          })}

          {onRefresh ? (
            <button
              type="button"
              onClick={onRefresh}
              className="ml-auto inline-flex min-h-11 shrink-0 items-center gap-2 rounded-xl border-2 border-[#123865] bg-[#123865] px-4 py-2 text-xs font-black text-white transition hover:-translate-y-0.5 hover:border-[#F97316]"
            >
              <RefreshCw size={14} />
              Refresh Finance
            </button>
          ) : null}
        </div>
      </nav>

      {finance.currencyMeta.mixed ? (
        <div className="flex items-start gap-3 rounded-[1.35rem] border-[3px] border-[#FB7185] bg-[#FFF4F4] p-4">
          <AlertTriangle
            size={18}
            className="mt-0.5 shrink-0 text-red-700"
          />

          <div>
            <p className="font-black text-[#10233F]">
              Mixed-currency finance evidence detected
            </p>
            <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">
              Records contain {finance.currencyMeta.detected.join(", ")}.
              Zaifan does not silently convert money. Totals should only be
              relied on after a single reporting currency or explicit FX layer
              is connected.
            </p>
          </div>
        </div>
      ) : null}

      {renderActiveView()}
    </div>
  );
}
