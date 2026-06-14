import React, { useMemo, useState } from "react";
import CashflowCommandCenter from "./CashflowCommandCenter";
import RevenueForecastPanel from "./RevenueForecastPanel";
import ExpenseManagementPanel from "./ExpenseManagementPanel";
import CommissionAccountingPanel from "./CommissionAccountingPanel";
import ProfitLossPanel from "./ProfitLossPanel";
import FinancialHealthPanel from "./FinancialHealthPanel";

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

function number(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function lower(value) {
  return String(value || "").toLowerCase();
}

function money(value) {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    maximumFractionDigits: 0,
  }).format(number(value));
}

function getAmount(record = {}) {
  return number(
    record.amount ||
      record.total_amount ||
      record.invoice_amount ||
      record.payment_amount ||
      record.paid_amount ||
      record.expense_amount ||
      record.cost ||
      record.spend ||
      record.commission_amount ||
      0
  );
}

function getStatus(record = {}) {
  return lower(record.status || record.payment_status || record.invoice_status || record.state);
}

function isPaid(record = {}) {
  const status = getStatus(record);
  return status.includes("paid") || status.includes("confirmed") || status.includes("completed") || status.includes("cleared");
}

function isOverdue(record = {}) {
  const status = getStatus(record);
  const dueDate = record.due_date || record.dueAt || record.payment_due_date;
  if (status.includes("overdue")) return true;
  if (!dueDate) return false;
  const time = new Date(dueDate).getTime();
  return Number.isFinite(time) && time < Date.now() && !isPaid(record);
}

function getExpenseCategory(record = {}) {
  return record.category || record.expense_category || record.type || record.department || "General";
}

function getStudentStage(record = {}) {
  const raw = lower(record.stage || record.status || record.application_status || record.journey_stage);
  if (raw.includes("visa")) return "visa";
  if (raw.includes("cas")) return "cas";
  if (raw.includes("offer")) return "offer";
  if (raw.includes("application") || raw.includes("applied")) return "application";
  return "lead";
}

export function buildFinanceOSData(snapshot = {}) {
  const students = safeArray(snapshot.students || snapshot.inquiries || snapshot.leads);
  const applications = safeArray(snapshot.applications || snapshot.studentApplications);
  const offers = safeArray(snapshot.offers || snapshot.studentOffers);
  const casRecords = safeArray(snapshot.casRecords || snapshot.cas);
  const visas = safeArray(snapshot.visas || snapshot.studentVisas);
  const invoices = safeArray(snapshot.invoices || snapshot.studentInvoices);
  const payments = safeArray(snapshot.payments || snapshot.studentPayments);
  const expenses = safeArray(snapshot.expenses || snapshot.companyExpenses || snapshot.marketingExpenses || snapshot.adSpend);
  const commissions = safeArray(snapshot.commissions || snapshot.agentCommissions || snapshot.counselorCommissions);
  const agentRows = safeArray(snapshot.agents || snapshot.agentPerformance || snapshot.agentStudents);

  const invoiced = invoices.reduce((sum, item) => sum + getAmount(item), 0);
  const collected = payments.reduce((sum, item) => sum + getAmount(item), 0);
  const paidInvoices = invoices.filter(isPaid).reduce((sum, item) => sum + getAmount(item), 0);
  const outstanding = Math.max(0, invoiced - Math.max(collected, paidInvoices));
  const overdue = invoices.filter(isOverdue).reduce((sum, item) => sum + getAmount(item), 0);

  const expenseRows = expenses.map((expense, index) => ({
    id: expense.id || `expense-${index}`,
    title: expense.title || expense.name || expense.description || getExpenseCategory(expense),
    category: getExpenseCategory(expense),
    amount: getAmount(expense),
    status: expense.status || "Recorded",
    date: expense.date || expense.created_at || expense.createdAt || expense.updated_at,
  }));

  const commissionRows = [
    ...commissions.map((item, index) => ({
      id: item.id || `commission-${index}`,
      partner: item.agent_name || item.partner_name || item.counselor_name || item.name || "Partner",
      type: item.type || item.commission_type || "Agent",
      amount: getAmount(item),
      status: item.status || "Pending",
      student: item.student_name || item.student || "Linked student",
    })),
    ...agentRows
      .filter((item) => number(item.commissionDue || item.commission_due || item.commission_amount) > 0)
      .map((item, index) => ({
        id: item.id || `agent-commission-${index}`,
        partner: item.agent || item.name || item.agent_name || "Agent",
        type: "Agent",
        amount: number(item.commissionDue || item.commission_due || item.commission_amount),
        status: item.status || "Estimated",
        student: "Portfolio commission",
      })),
  ];

  const totalExpenses = expenseRows.reduce((sum, item) => sum + item.amount, 0);
  const totalCommissions = commissionRows.reduce((sum, item) => sum + item.amount, 0);
  const netProfit = collected - totalExpenses - totalCommissions;
  const grossProfit = collected - totalCommissions;
  const margin = collected ? Math.round((netProfit / collected) * 100) : 0;

  const averageInvoice = invoices.length ? Math.round(invoiced / invoices.length) : 1500;

  const forecast = {
    day30: Math.round((offers.length * 0.2 + casRecords.length * 0.45 + visas.length * 0.15) * averageInvoice),
    day60: Math.round((applications.length * 0.12 + offers.length * 0.38 + casRecords.length * 0.65 + visas.length * 0.25) * averageInvoice),
    day90: Math.round((applications.length * 0.25 + offers.length * 0.55 + casRecords.length * 0.8 + visas.length * 0.35) * averageInvoice),
  };

  const categoryMap = new Map();

  expenseRows.forEach((expense) => {
    categoryMap.set(expense.category, (categoryMap.get(expense.category) || 0) + expense.amount);
  });

  if (totalCommissions > 0) {
    categoryMap.set("Commissions", (categoryMap.get("Commissions") || 0) + totalCommissions);
  }

  const expenseCategories = Array.from(categoryMap.entries())
    .map(([name, amount]) => ({ name, amount }))
    .sort((a, b) => b.amount - a.amount);

  const pipeline = [
    { key: "applications", label: "Applications", count: applications.length, value: Math.round(applications.length * averageInvoice * 0.18) },
    { key: "offers", label: "Offers", count: offers.length, value: Math.round(offers.length * averageInvoice * 0.42) },
    { key: "cas", label: "CAS", count: casRecords.length, value: Math.round(casRecords.length * averageInvoice * 0.72) },
    { key: "visas", label: "Visas", count: visas.length, value: Math.round(visas.length * averageInvoice * 0.9) },
  ];

  const stageCounts = {
    lead: students.filter((item) => getStudentStage(item) === "lead").length,
    application: Math.max(applications.length, students.filter((item) => getStudentStage(item) === "application").length),
    offer: Math.max(offers.length, students.filter((item) => getStudentStage(item) === "offer").length),
    cas: Math.max(casRecords.length, students.filter((item) => getStudentStage(item) === "cas").length),
    visa: Math.max(visas.length, students.filter((item) => getStudentStage(item) === "visa").length),
  };

  const healthScore = Math.max(
    0,
    Math.min(
      100,
      65 +
        (collected > 0 ? 12 : 0) +
        (forecast.day60 > totalExpenses ? 8 : -8) +
        (margin > 20 ? 8 : margin < 0 ? -18 : 0) -
        (overdue > 0 ? 10 : 0) -
        (outstanding > collected && outstanding > 0 ? 8 : 0)
    )
  );

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
    },
    totals: {
      invoiced,
      collected,
      outstanding,
      overdue,
      totalExpenses,
      totalCommissions,
      grossProfit,
      netProfit,
      margin,
      averageInvoice,
      cashOnHand: Math.max(0, collected - totalExpenses - totalCommissions),
      healthScore,
    },
    forecast,
    expenseRows,
    commissionRows,
    expenseCategories,
    pipeline,
    stageCounts,
  };
}

function MetricCard({ label, value, helper, tone = "cyan" }) {
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
      <p className="mt-3 text-3xl font-black text-white">{value}</p>
      {helper ? <p className="mt-2 text-sm text-slate-400">{helper}</p> : null}
    </div>
  );
}

export default function FinanceOSDashboard({ snapshot, adminProfile, onRefresh }) {
  const [activeView, setActiveView] = useState("overview");
  const finance = useMemo(() => buildFinanceOSData(snapshot || {}), [snapshot]);

  const views = [
    { key: "overview", label: "Overview" },
    { key: "cashflow", label: "Cashflow" },
    { key: "forecast", label: "Forecast" },
    { key: "expenses", label: "Expenses" },
    { key: "commissions", label: "Commissions" },
    { key: "profit-loss", label: "P&L" },
    { key: "health", label: "Health" },
  ];

  return (
    <div className="space-y-6 rounded-[2rem] border border-white/10 bg-slate-950/60 p-5 text-white shadow-2xl shadow-slate-950/30">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.3em] text-emerald-300">Finance OS</p>
          <h1 className="mt-3 text-3xl font-black tracking-tight">Financial Command Center</h1>
          <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-400">
            Founder-grade finance layer for cashflow, revenue, expenses, commissions, profit, margin, and financial health.
          </p>
          {adminProfile?.email ? <p className="mt-2 text-xs text-slate-500">Finance view for {adminProfile.email}</p> : null}
        </div>

        <div className="flex flex-wrap gap-2">
          {views.map((view) => (
            <button
              key={view.key}
              type="button"
              onClick={() => setActiveView(view.key)}
              className={`rounded-2xl px-4 py-2 text-xs font-black ${
                activeView === view.key
                  ? "bg-white text-slate-950"
                  : "border border-white/10 bg-white/[0.04] text-slate-300 hover:bg-white/[0.08]"
              }`}
            >
              {view.label}
            </button>
          ))}
          {onRefresh ? (
            <button type="button" onClick={onRefresh} className="rounded-2xl border border-emerald-400/25 bg-emerald-400/10 px-4 py-2 text-xs font-black text-emerald-100 hover:bg-emerald-400/20">
              Refresh
            </button>
          ) : null}
        </div>
      </div>

      {activeView === "overview" ? (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
            <MetricCard label="Collected" value={money(finance.totals.collected)} helper="confirmed payments" tone="emerald" />
            <MetricCard label="Outstanding" value={money(finance.totals.outstanding)} helper={`${money(finance.totals.overdue)} overdue`} tone="amber" />
            <MetricCard label="Expenses" value={money(finance.totals.totalExpenses)} helper="operating cost" tone="rose" />
            <MetricCard label="Commissions" value={money(finance.totals.totalCommissions)} helper="agent/team payouts" tone="violet" />
            <MetricCard label="Net Profit" value={money(finance.totals.netProfit)} helper={`${finance.totals.margin}% margin`} tone={finance.totals.netProfit >= 0 ? "emerald" : "rose"} />
            <MetricCard label="Health" value={`${finance.totals.healthScore}%`} helper="financial signal" tone={finance.totals.healthScore >= 70 ? "emerald" : finance.totals.healthScore >= 45 ? "amber" : "rose"} />
          </div>

          <div className="grid gap-4 xl:grid-cols-[1fr_1fr]">
            <CashflowCommandCenter finance={finance} compact />
            <RevenueForecastPanel finance={finance} compact />
          </div>

          <div className="grid gap-4 xl:grid-cols-[1fr_1fr]">
            <ProfitLossPanel finance={finance} compact />
            <FinancialHealthPanel finance={finance} compact />
          </div>
        </>
      ) : null}

      {activeView === "cashflow" ? <CashflowCommandCenter finance={finance} /> : null}
      {activeView === "forecast" ? <RevenueForecastPanel finance={finance} /> : null}
      {activeView === "expenses" ? <ExpenseManagementPanel finance={finance} /> : null}
      {activeView === "commissions" ? <CommissionAccountingPanel finance={finance} /> : null}
      {activeView === "profit-loss" ? <ProfitLossPanel finance={finance} /> : null}
      {activeView === "health" ? <FinancialHealthPanel finance={finance} /> : null}
    </div>
  );
}
