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
  Search,
  X,
  ReceiptText,
  ArrowUpRight,
  ArrowDownRight,
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


function financeRecordStatusTone(status = "") {
  const value = lower(status);

  if (
    value.includes("paid") ||
    value.includes("confirmed") ||
    value.includes("completed") ||
    value.includes("cleared") ||
    value.includes("settled")
  ) {
    return "border-[#34D399] bg-[#F0FFF8] text-emerald-700";
  }

  if (
    value.includes("overdue") ||
    value.includes("failed") ||
    value.includes("rejected") ||
    value.includes("cancel")
  ) {
    return "border-[#FB7185] bg-[#FFF4F4] text-red-700";
  }

  if (
    value.includes("pending") ||
    value.includes("due") ||
    value.includes("review") ||
    value.includes("estimated")
  ) {
    return "border-[#F59E0B] bg-[#FFF8E8] text-amber-800";
  }

  return "border-[#60A5FA] bg-[#F2F7FF] text-blue-700";
}

function getFinanceRecordDate(record = {}) {
  return (
    record.date ||
    record.due_date ||
    record.paid_at ||
    record.payment_date ||
    record.invoice_date ||
    record.created_at ||
    record.createdAt ||
    null
  );
}

function formatDate(value) {
  if (!value) return "Date unavailable";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Date unavailable";
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function buildFinancePortfolio(finance) {
  const currency = finance.currency;

  const invoices = safeArray(finance.raw?.invoices).map((record, index) => ({
    id: record.id || `invoice-${index}`,
    type: "Invoice",
    title:
      record.invoice_number ||
      record.reference ||
      record.title ||
      record.student_name ||
      record.customer_name ||
      "Invoice record",
    party:
      record.student_name ||
      record.customer_name ||
      record.client_name ||
      record.email ||
      "Linked student/client",
    amount: getAmount(record),
    currency: getCurrency(record) || currency,
    status: record.status || record.invoice_status || "Recorded",
    date: getFinanceRecordDate(record),
    direction: "in",
    source: record,
  }));

  const payments = safeArray(finance.raw?.payments).map((record, index) => ({
    id: record.id || `payment-${index}`,
    type: "Payment",
    title:
      record.reference ||
      record.payment_reference ||
      record.student_name ||
      record.customer_name ||
      "Payment record",
    party:
      record.student_name ||
      record.customer_name ||
      record.client_name ||
      record.email ||
      "Linked student/client",
    amount: getAmount(record),
    currency: getCurrency(record) || currency,
    status: record.status || record.payment_status || "Recorded",
    date: getFinanceRecordDate(record),
    direction: "in",
    source: record,
  }));

  const expenses = safeArray(finance.expenseRows).map((record, index) => ({
    id: record.id || `expense-row-${index}`,
    type: "Expense",
    title: record.title || record.category || "Expense record",
    party: record.category || "Operating expense",
    amount: number(record.amount),
    currency: cleanCurrency(record.currency) || currency,
    status: record.status || "Recorded",
    date: record.date || null,
    direction: "out",
    source: record,
  }));

  const commissions = safeArray(finance.commissionRows).map((record, index) => ({
    id: record.id || `commission-row-${index}`,
    type: "Commission",
    title: record.partner || "Commission record",
    party: record.student || record.type || "Linked partner",
    amount: number(record.amount),
    currency: cleanCurrency(record.currency) || currency,
    status: record.status || "Pending",
    date: record.date || null,
    direction: "out",
    estimated: Boolean(record.estimated),
    source: record,
  }));

  return [...invoices, ...payments, ...expenses, ...commissions].sort((a, b) => {
    const aTime = a.date ? new Date(a.date).getTime() : 0;
    const bTime = b.date ? new Date(b.date).getTime() : 0;
    return bTime - aTime;
  });
}

function FinancePortfolioRow({ record }) {
  const incoming = record.direction === "in";

  return (
    <article className="rounded-[1.3rem] border-2 border-[#C9D7E6] bg-white p-4 shadow-[0_6px_18px_rgba(15,35,63,0.04)] transition hover:border-[#F97316]">
      <div className="grid min-w-0 gap-4 xl:grid-cols-[minmax(18rem,1.5fr)_10rem_11rem_10rem_11rem] xl:items-center">
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            <div
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border-2 ${
                incoming
                  ? "border-[#34D399] bg-[#F0FFF8] text-emerald-700"
                  : "border-[#FB7185] bg-[#FFF4F4] text-red-700"
              }`}
            >
              {incoming ? (
                <ArrowDownRight size={17} />
              ) : (
                <ArrowUpRight size={17} />
              )}
            </div>

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="break-words font-black text-[#10233F]">
                  {record.title}
                </p>

                <span
                  className={`rounded-lg border-2 px-2.5 py-1 text-[8px] font-black uppercase tracking-[0.07em] ${financeRecordStatusTone(
                    record.status
                  )}`}
                >
                  {record.status || "Unknown"}
                </span>
              </div>

              <p className="mt-1 break-words text-xs font-semibold text-slate-500">
                {record.party}
              </p>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-lg border-2 border-[#C9D7E6] bg-[#FFF8EF] px-2.5 py-1 text-[8px] font-black text-slate-600">
              <ReceiptText size={11} />
              {record.type}
            </span>

            {record.estimated ? (
              <span className="rounded-lg border-2 border-[#F59E0B] bg-[#FFF8E8] px-2.5 py-1 text-[8px] font-black text-amber-800">
                Estimate only
              </span>
            ) : null}
          </div>
        </div>

        <div className="rounded-xl border border-[#E1E8F0] bg-[#FFF8EF] px-3 py-2.5">
          <p className="text-[7px] font-black uppercase tracking-[0.09em] text-slate-500">
            Type
          </p>
          <p className="mt-1 text-xs font-black text-[#10233F]">
            {record.type}
          </p>
        </div>

        <div className="rounded-xl border border-[#E1E8F0] bg-[#FFF8EF] px-3 py-2.5">
          <p className="text-[7px] font-black uppercase tracking-[0.09em] text-slate-500">
            Amount
          </p>
          <p
            className={`mt-1 truncate text-xs font-black ${
              incoming ? "text-emerald-700" : "text-red-700"
            }`}
          >
            {money(record.amount, record.currency)}
          </p>
        </div>

        <div className="rounded-xl border border-[#E1E8F0] bg-[#FFF8EF] px-3 py-2.5">
          <p className="text-[7px] font-black uppercase tracking-[0.09em] text-slate-500">
            Currency
          </p>
          <p className="mt-1 text-xs font-black text-[#10233F]">
            {record.currency || "Unknown"}
          </p>
        </div>

        <div className="rounded-xl border border-[#E1E8F0] bg-[#FFF8EF] px-3 py-2.5">
          <p className="text-[7px] font-black uppercase tracking-[0.09em] text-slate-500">
            Date
          </p>
          <p className="mt-1 text-xs font-black text-[#10233F]">
            {formatDate(record.date)}
          </p>
        </div>
      </div>
    </article>
  );
}

function Overview({ finance }) {
  const [search, setSearch] = useState("");
  const [recordType, setRecordType] = useState("All");

  const totals = finance.totals;
  const currency = finance.currency;

  const portfolio = useMemo(
    () => buildFinancePortfolio(finance),
    [finance]
  );

  const filteredPortfolio = useMemo(() => {
    const needle = lower(search);

    return portfolio.filter((record) => {
      if (recordType !== "All" && record.type !== recordType) {
        return false;
      }

      if (!needle) return true;

      return [
        record.title,
        record.party,
        record.type,
        record.status,
        record.currency,
      ]
        .map(lower)
        .join(" ")
        .includes(needle);
    });
  }, [portfolio, search, recordType]);

  const filtersActive = Boolean(search.trim()) || recordType !== "All";

  function clearFilters() {
    setSearch("");
    setRecordType("All");
  }

  return (
    <>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Collected"
          value={money(totals.collected, currency)}
          helper="Confirmed payments and paid-invoice evidence."
          tone="navy"
          icon={Banknote}
          badge="Recorded"
        />

        <MetricCard
          label="Outstanding"
          value={money(totals.outstanding, currency)}
          helper={`${money(totals.overdue, currency)} currently overdue.`}
          tone={totals.overdue > 0 ? "amber" : "blue"}
          icon={Clock3}
          badge="Receivable"
        />

        <MetricCard
          label="Operating Outflow"
          value={money(
            totals.totalExpenses + totals.totalCommissions,
            currency
          )}
          helper={`${money(
            totals.totalExpenses,
            currency
          )} expenses · ${money(
            totals.totalCommissions,
            currency
          )} recorded commissions.`}
          tone="red"
          icon={TrendingDown}
          badge="Recorded only"
        />

        <MetricCard
          label="Net Profit"
          value={money(totals.netProfit, currency)}
          helper={
            totals.margin === null
              ? "Margin unavailable without collected revenue."
              : `${totals.margin}% recorded operating margin.`
          }
          tone={totals.netProfit >= 0 ? "green" : "red"}
          icon={totals.netProfit >= 0 ? TrendingUp : TrendingDown}
          badge="Operational"
        />
      </div>

      <section className="rounded-[1.5rem] border-[3px] border-[#C9D7E6] bg-white p-4 sm:p-5">
        <div className="mb-4 flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.11em] text-[#B84F0E]">
              Financial Command
            </p>
            <h2 className="mt-1 text-xl font-black text-[#10233F]">
              Transaction portfolio
            </h2>
            <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">
              Search and review the real invoices, payments, expenses and
              commission records currently supplied to Finance OS.
            </p>
          </div>

          <div className="grid gap-2 sm:grid-cols-[minmax(14rem,1fr)_10rem_auto]">
            <label className="relative block">
              <Search
                size={15}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search finance record..."
                className="min-h-10 w-full rounded-xl border-2 border-[#C9D7E6] bg-[#FFF8EF] pl-9 pr-3 text-xs font-semibold text-[#10233F] outline-none placeholder:text-slate-400 focus:border-[#F97316]"
              />
            </label>

            <select
              value={recordType}
              onChange={(event) => setRecordType(event.target.value)}
              className="min-h-10 rounded-xl border-2 border-[#C9D7E6] bg-[#FFF8EF] px-3 text-xs font-black text-[#10233F] outline-none focus:border-[#F97316]"
            >
              <option>All</option>
              <option>Invoice</option>
              <option>Payment</option>
              <option>Expense</option>
              <option>Commission</option>
            </select>

            <button
              type="button"
              onClick={clearFilters}
              disabled={!filtersActive}
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border-2 border-[#C9D7E6] bg-white px-3 text-xs font-black text-slate-700 disabled:opacity-40"
            >
              <X size={13} />
              Clear
            </button>
          </div>
        </div>

        <div className="space-y-2.5">
          {filteredPortfolio.length ? (
            filteredPortfolio.map((record) => (
              <FinancePortfolioRow
                key={`${record.type}-${record.id}`}
                record={record}
              />
            ))
          ) : (
            <div className="rounded-[1.4rem] border-[3px] border-dashed border-[#C9D7E6] bg-[#FFF8EF] p-8 text-center">
              <WalletCards size={24} className="mx-auto text-[#B84F0E]" />
              <p className="mt-3 font-black text-[#10233F]">
                {portfolio.length
                  ? "No finance records match these filters."
                  : "No real finance records yet."}
              </p>
              <p className="mx-auto mt-2 max-w-xl text-sm font-semibold leading-6 text-slate-600">
                {portfolio.length
                  ? "Clear or change the finance filters."
                  : "Connect genuine invoices, payments, expenses or commissions before Finance OS reports transaction activity."}
              </p>
            </div>
          )}
        </div>
      </section>

      <div className="grid gap-3 lg:grid-cols-3">
        <QualityCard
          icon={Database}
          eyebrow="Finance Evidence"
          value={`${finance.completeness.financeSourceCount}/4 sources`}
          helper="Invoices, payments, expenses and commissions remain independently measurable."
          tone={
            finance.completeness.financeSourceCount >= 3
              ? "green"
              : finance.completeness.financeSourceCount >= 1
                ? "amber"
                : "red"
          }
        />

        <QualityCard
          icon={Sparkles}
          eyebrow="Forecast Boundary"
          value={`${finance.completeness.pipelineSourceCount}/4 stages`}
          helper="Applications, offers, CAS and visas support estimates only; they are not booked revenue."
          tone={
            finance.completeness.pipelineSourceCount >= 3
              ? "green"
              : finance.completeness.pipelineSourceCount >= 1
                ? "amber"
                : "red"
          }
        />

        <QualityCard
          icon={finance.warnings.length ? AlertTriangle : BadgeCheck}
          eyebrow="Integrity Status"
          value={
            finance.warnings.length
              ? `${finance.warnings.length} warning${
                  finance.warnings.length === 1 ? "" : "s"
                }`
              : "Clean"
          }
          helper={
            finance.warnings.length
              ? "Uncertainty stays visible instead of being converted into fake money."
              : "No major finance-data integrity warnings detected."
          }
          tone={finance.warnings.length ? "amber" : "green"}
        />
      </div>
    </>
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
    <div className="min-w-0 space-y-5 rounded-[2.2rem] border-[4px] border-[#123865] bg-[#FFF8EF] p-3 text-[#10233F] shadow-[0_24px_65px_rgba(18,56,101,0.15)] sm:p-4 lg:p-5">
      <header className="overflow-hidden rounded-[1.75rem] border-[3px] border-[#F97316]">
        <div className="grid xl:grid-cols-[minmax(0,1.25fr)_minmax(18rem,0.75fr)]">
          <div className="bg-[#123865] p-5 text-white sm:p-6">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-2 rounded-full border-2 border-orange-300/30 bg-orange-400/10 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.12em] text-orange-300">
                <Landmark size={12} />
                Finance OS
              </span>

              <span className="rounded-full border-2 border-white/15 bg-white/5 px-3 py-1 text-[8px] font-black uppercase tracking-[0.08em] text-white">
                {finance.currency}
              </span>

              <span className="rounded-full border-2 border-white/15 bg-white/5 px-3 py-1 text-[8px] font-black uppercase tracking-[0.08em] text-white">
                Evidence first
              </span>
            </div>

            <h1 className="mt-3 text-3xl font-black text-white">
              Financial Command Center
            </h1>

            <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-200">
              Collections, receivables, expenses, commissions, operating
              profit, forecast evidence and financial health. Missing data
              remains missing instead of being replaced by fake money.
            </p>
          </div>

          <div className="bg-[#FF5A0A] p-5 text-white sm:p-6">
            <p className="text-[9px] font-black uppercase tracking-[0.12em]">
              Current Workspace
            </p>

            <p className="mt-2 text-2xl font-black">
              {VIEW_CONFIG.find((view) => view.key === activeView)?.label}
            </p>

            <p className="mt-2 text-xs font-semibold leading-5 text-orange-50">
              {adminProfile?.email
                ? `Admin finance view for ${adminProfile.email}`
                : "Admin financial operations workspace"}
            </p>

            <div className="mt-4 flex flex-wrap gap-2">
              <span className="rounded-full border-2 border-white/25 bg-white/10 px-3 py-1 text-[8px] font-black uppercase tracking-[0.08em]">
                {finance.completeness.financeSourceCount}/4 sources
              </span>

              <span className="rounded-full border-2 border-white/25 bg-white/10 px-3 py-1 text-[8px] font-black uppercase tracking-[0.08em]">
                {finance.warnings.length
                  ? `${finance.warnings.length} warning${
                      finance.warnings.length === 1 ? "" : "s"
                    }`
                  : "Integrity clear"}
              </span>
            </div>
          </div>
        </div>
      </header>

      <nav className="flex flex-col gap-3 rounded-[1.45rem] border-[3px] border-[#C9D7E6] bg-white p-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 flex-wrap gap-2">
          {VIEW_CONFIG.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              type="button"
              onClick={() => setActiveView(key)}
              aria-pressed={activeView === key}
              className={`inline-flex items-center gap-2 rounded-xl border-2 px-3 py-2.5 text-xs font-black transition ${
                activeView === key
                  ? "border-[#F97316] bg-[#FF5A0A] text-white"
                  : "border-[#C9D7E6] bg-[#FFF8EF] text-[#10233F] hover:border-[#F97316]"
              }`}
            >
              <Icon size={14} />
              {label}
            </button>
          ))}
        </div>

        {onRefresh ? (
          <button
            type="button"
            onClick={onRefresh}
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border-2 border-[#123865] bg-[#123865] px-4 text-xs font-black text-white transition hover:bg-[#245886]"
          >
            <RefreshCw size={13} />
            Refresh Finance
          </button>
        ) : null}
      </nav>

      {finance.currencyMeta.mixed ? (
        <div className="flex items-start gap-3 rounded-[1.35rem] border-[3px] border-[#FB7185] bg-[#FFF4F4] p-4">
          <AlertTriangle size={18} className="mt-0.5 shrink-0 text-red-700" />
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
