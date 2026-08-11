// CounselorFinanceWorkspace PARTNER OS EXTREME V2 — Assigned Finance + Counselor Payment Requests
// New file: src/components/counselor/CounselorFinanceWorkspace.jsx
//
// Counselor Finance rules:
// - consumes the same student_invoices / student_payments / student_receipts / counselor_payment_requests / payment_accounts used by Admin + Student OS
// - assigned-student scope is enforced centrally in counselorPortal.js
// - Admin Finance remains authoritative for invoices, payment confirmation, receipt approval and payment-account configuration
// - counselors receive operational finance visibility plus scoped payment-request / follow-up / timeline actions
// - multi-currency balances remain separated; PKR/EUR/USD are never incorrectly summed together
// - Partner OS visual parity with Counselor Applications / Documents / Universities / Visa

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Banknote,
  BadgeCheck,
  CalendarClock,
  CheckCircle2,
  CircleDollarSign,
  ClipboardCheck,
  Clock3,
  CreditCard,
  FileCheck2,
  History,
  Landmark,
  LoaderCircle,
  ReceiptText,
  RefreshCw,
  ShieldCheck,
  UserRound,
  WalletCards,
} from "lucide-react";
import {
  buildCounselorFinanceQueue,
  createCounselorTask,
  formatRelativeTime,
  writeCounselorTimelineEvent,
} from "../../lib/counselorPortal";
import { supabase } from "../../lib/supabaseClient";

const FILTERS = [
  { key: "all", label: "All Finance Cases" },
  { key: "attention", label: "Needs Attention" },
  { key: "overdue", label: "Overdue Invoice" },
  { key: "receipts", label: "Receipt Review" },
  { key: "requests", label: "Payment Request" },
  { key: "clear", label: "Financially Clear" },
];

const SORTS = [
  { key: "priority", label: "Operational Priority" },
  { key: "overdue", label: "Overdue First" },
  { key: "outstanding", label: "Outstanding First" },
  { key: "recent", label: "Recently Updated" },
  { key: "student", label: "Student" },
];

const FILTER_STORAGE_KEY = "zaifan_counselor_finance_filter";
const SORT_STORAGE_KEY = "zaifan_counselor_finance_sort";
const VIEW_STORAGE_KEY = "zaifan_counselor_finance_view";

const INPUT_CLASS =
  "w-full min-w-0 rounded-xl border-2 border-[#AFC0D0] bg-white px-4 py-3 text-sm font-bold text-[#10233F] outline-none transition placeholder:text-slate-400 focus:border-[#FF5A0A] focus:ring-4 focus:ring-orange-100";

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

function safeString(value, fallback = "") {
  if (value === null || value === undefined) return fallback;
  return String(value);
}

function safeNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function normalize(value) {
  return safeString(value)
    .trim()
    .toLowerCase()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ");
}


function isUuid(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    safeString(value).trim()
  );
}

function makePaymentRequestForm(record = null) {
  const suggestedCurrency =
    record?.nearestInvoice?.currency ||
    record?.openInvoices?.[0]?.currency ||
    "PKR";

  return {
    title: "Payment Request",
    amount: "",
    currency: safeString(suggestedCurrency || "PKR").toUpperCase(),
    priority: "normal",
    invoiceId: "",
    dueDate: "",
    message: "",
  };
}

function pretty(value, fallback = "—") {
  const clean = safeString(value).replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim();
  if (!clean) return fallback;
  return clean.replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatMoney(value, currency = "PKR") {
  const amount = safeNumber(value);
  return `${safeString(currency || "PKR").toUpperCase()} ${amount.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
}

function formatDate(value) {
  if (!value) return "Not set";
  try {
    return new Date(value).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return safeString(value);
  }
}

function dateMs(value) {
  if (!value) return 0;
  const parsed = new Date(value).getTime();
  return Number.isFinite(parsed) ? parsed : 0;
}

function readSessionValue(key, fallback = "") {
  if (typeof window === "undefined") return fallback;
  try {
    return window.sessionStorage.getItem(key) || fallback;
  } catch {
    return fallback;
  }
}

function writeSessionValue(key, value) {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(key, value);
  } catch {
    // Preferences are non-critical.
  }
}

function isSettled(record = {}) {
  return (
    record.openInvoices.length === 0 &&
    record.overdueInvoices.length === 0 &&
    record.pendingReceipts.length === 0 &&
    record.openRequests.length === 0 &&
    record.currencyBuckets.every((bucket) => safeNumber(bucket.outstanding) <= 0)
  );
}

function primaryOutstanding(record = {}) {
  return safeArray(record.currencyBuckets).reduce(
    (sum, bucket) => sum + (safeNumber(bucket.outstanding) > 0 ? 1 : 0),
    0
  );
}

function pressureTone(score = 0) {
  if (score >= 70) return "rose";
  if (score >= 45) return "orange";
  if (score >= 20) return "amber";
  return "emerald";
}

function toneClass(tone = "navy") {
  const tones = {
    navy: "border-[#AFC0D0] bg-[#F1F6FA]",
    orange: "border-orange-300 bg-orange-50",
    amber: "border-amber-300 bg-amber-50",
    emerald: "border-emerald-300 bg-emerald-50",
    rose: "border-rose-300 bg-rose-50",
    violet: "border-violet-300 bg-violet-50",
  };
  return tones[tone] || tones.navy;
}

function StatusToast({ status, onDismiss }) {
  if (!status?.message) return null;

  return (
    <div
      role={status.type === "error" ? "alert" : "status"}
      className={`mb-5 flex items-start justify-between gap-3 rounded-[1.35rem] border-2 px-4 py-3 text-sm font-bold ${
        status.type === "error"
          ? "border-rose-300 bg-rose-50 text-rose-800"
          : "border-emerald-300 bg-emerald-50 text-emerald-800"
      }`}
    >
      <span>{status.message}</span>
      <button
        type="button"
        onClick={onDismiss}
        className="shrink-0 rounded-lg border border-current/20 px-2 py-1 text-[10px] font-black uppercase"
      >
        Dismiss
      </button>
    </div>
  );
}

function FinanceStat({ label, value, helper, tone = "navy", icon: Icon = CircleDollarSign }) {
  return (
    <div className={`rounded-[1.35rem] border-2 p-4 shadow-[0_9px_22px_rgba(16,35,63,0.07)] ${toneClass(tone)}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[9px] font-black uppercase tracking-[0.16em] text-[#5B6D80]">
            {label}
          </p>
          <p className="mt-2 text-2xl font-black text-[#10233F]">{value}</p>
          <p className="mt-1 text-[10px] font-semibold leading-4 text-[#5B6D80]">
            {helper}
          </p>
        </div>
        <Icon className="h-5 w-5 text-[#123865]" aria-hidden="true" />
      </div>
    </div>
  );
}

function LifecycleCell({ number, label, helper, value, tone = "navy" }) {
  return (
    <div className={`rounded-[1.2rem] border-2 p-3 ${toneClass(tone)}`}>
      <div className="flex items-start justify-between gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#123865] text-xs font-black text-white">
          {number}
        </span>
        <span className="rounded-lg border border-[#D8B07B] bg-white px-2 py-1 text-[10px] font-black text-[#10233F]">
          {value}
        </span>
      </div>
      <p className="mt-3 text-xs font-black text-[#10233F]">{label}</p>
      <p className="mt-1 text-[10px] font-semibold leading-4 text-[#5B6D80]">{helper}</p>
    </div>
  );
}

function MoneyBucket({ bucket }) {
  const outstanding = safeNumber(bucket.outstanding);
  const overdue = safeNumber(bucket.overdue);

  return (
    <div className={`rounded-xl border-2 p-3 ${overdue > 0 ? "border-rose-300 bg-rose-50" : outstanding > 0 ? "border-orange-300 bg-orange-50" : "border-emerald-300 bg-emerald-50"}`}>
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-black text-[#10233F]">{bucket.currency}</p>
        <span className="rounded-lg border border-white/80 bg-white/75 px-2 py-1 text-[9px] font-black uppercase text-[#123865]">
          {outstanding > 0 ? "Open" : "Clear"}
        </span>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <MiniValue label="Invoiced" value={formatMoney(bucket.invoiced, bucket.currency)} />
        <MiniValue label="Paid" value={formatMoney(bucket.paid, bucket.currency)} />
        <MiniValue label="Outstanding" value={formatMoney(bucket.outstanding, bucket.currency)} />
        <MiniValue label="Overdue" value={formatMoney(bucket.overdue, bucket.currency)} />
      </div>
    </div>
  );
}

function MiniValue({ label, value }) {
  return (
    <div className="rounded-lg border border-white/80 bg-white/70 px-2.5 py-2">
      <p className="text-[8px] font-black uppercase tracking-[0.11em] text-[#73869A]">{label}</p>
      <p className="mt-1 break-words text-[10px] font-black text-[#10233F]">{value}</p>
    </div>
  );
}

function InfoCell({ icon: Icon, eyebrow, value, helper, tone = "navy" }) {
  return (
    <div className={`rounded-[1.2rem] border-2 p-3 ${toneClass(tone)}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[8px] font-black uppercase tracking-[0.13em] text-[#73869A]">{eyebrow}</p>
          <p className="mt-1 break-words text-sm font-black text-[#10233F]">{value}</p>
          <p className="mt-1 text-[10px] font-semibold leading-4 text-[#5B6D80]">{helper}</p>
        </div>
        <Icon className="h-5 w-5 shrink-0 text-[#123865]" aria-hidden="true" />
      </div>
    </div>
  );
}

function PaymentDestination({ account }) {
  const isWallet = Boolean(account.mobile_wallet_number) && !account.account_number;
  const destination = account.account_number || account.mobile_wallet_number || "Not recorded";

  return (
    <div className="rounded-xl border-2 border-emerald-300 bg-emerald-50 p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs font-black text-[#10233F]">
            {account.account_title || account.bank_name || "Payment Destination"}
          </p>
          <p className="mt-1 text-[10px] font-semibold text-[#5B6D80]">
            {account.bank_name || pretty(account.account_type)}
          </p>
        </div>
        <span className="rounded-lg border border-emerald-300 bg-white px-2 py-1 text-[8px] font-black uppercase text-emerald-700">
          Active
        </span>
      </div>
      <div className="mt-2 rounded-lg border border-white/80 bg-white/75 p-2.5">
        <p className="text-[8px] font-black uppercase tracking-[0.11em] text-[#73869A]">
          {isWallet ? "Wallet Number" : "Account Number"}
        </p>
        <p className="mt-1 break-all text-[10px] font-black text-[#10233F]">{destination}</p>
        {account.iban ? (
          <p className="mt-1 break-all text-[9px] font-semibold text-[#5B6D80]">
            IBAN {account.iban}
          </p>
        ) : null}
      </div>
    </div>
  );
}

function PaymentRequestComposer({
  target,
  form,
  onChange,
  onClose,
  onSubmit,
  saving,
}) {
  if (!target) return null;

  const openInvoices = safeArray(target.openInvoices);

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center bg-[#07192B]/70 p-3 backdrop-blur-sm sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label="Create counselor payment request"
    >
      <div className="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-[2rem] border-[4px] border-[#123865] bg-[#FFF8EF] shadow-[0_32px_100px_rgba(0,0,0,0.35)]">
        <div className="relative overflow-hidden border-b-[3px] border-[#FF5A0A] bg-[#123865] p-5 text-white sm:p-6">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-10 -top-16 h-44 w-44 rounded-full border-[22px] border-white/5"
          />
          <div className="relative z-[1] flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-300">
                Counselor Payment Request
              </p>
              <h3 className="mt-2 text-2xl font-black text-white">
                Ask {target.studentName} to take a payment action
              </h3>
              <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-blue-100">
                This creates a request only. It does not confirm money, reduce an
                invoice balance or approve a receipt. Admin Finance remains the
                authority for actual money movement.
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="shrink-0 rounded-xl border-2 border-white/25 bg-white/10 px-4 py-2 text-xs font-black text-white transition hover:bg-white/20 disabled:opacity-50"
            >
              Close
            </button>
          </div>
        </div>

        <form onSubmit={onSubmit} className="p-5 sm:p-6">
          <div className="mb-5 grid gap-3 sm:grid-cols-3">
            <div className="rounded-[1.2rem] border-2 border-[#AFC0D0] bg-white p-3">
              <p className="text-[8px] font-black uppercase tracking-[0.13em] text-[#73869A]">
                Assigned student
              </p>
              <p className="mt-1 text-sm font-black text-[#10233F]">
                {target.studentName}
              </p>
            </div>

            <div className="rounded-[1.2rem] border-2 border-orange-300 bg-orange-50 p-3">
              <p className="text-[8px] font-black uppercase tracking-[0.13em] text-orange-700">
                Current open invoices
              </p>
              <p className="mt-1 text-sm font-black text-[#10233F]">
                {openInvoices.length}
              </p>
            </div>

            <div className="rounded-[1.2rem] border-2 border-emerald-300 bg-emerald-50 p-3">
              <p className="text-[8px] font-black uppercase tracking-[0.13em] text-emerald-700">
                Money authority
              </p>
              <p className="mt-1 text-sm font-black text-[#10233F]">
                Admin Finance
              </p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="block">
              <span className="text-[10px] font-black uppercase tracking-[0.13em] text-[#10233F]">
                Request title
              </span>
              <input
                value={form.title}
                onChange={(event) => onChange("title", event.target.value)}
                placeholder="e.g. Counselor Payment Request QA"
                className={INPUT_CLASS}
                required
              />
            </label>

            <label className="block">
              <span className="text-[10px] font-black uppercase tracking-[0.13em] text-[#10233F]">
                Amount
              </span>
              <input
                type="number"
                min="0.01"
                step="0.01"
                value={form.amount}
                onChange={(event) => onChange("amount", event.target.value)}
                placeholder="1500"
                className={INPUT_CLASS}
                required
              />
            </label>

            <label className="block">
              <span className="text-[10px] font-black uppercase tracking-[0.13em] text-[#10233F]">
                Currency
              </span>
              <select
                value={form.currency}
                onChange={(event) => onChange("currency", event.target.value)}
                className={INPUT_CLASS}
              >
                <option value="PKR">PKR</option>
                <option value="EUR">EUR</option>
                <option value="USD">USD</option>
                <option value="GBP">GBP</option>
              </select>
            </label>

            <label className="block">
              <span className="text-[10px] font-black uppercase tracking-[0.13em] text-[#10233F]">
                Priority
              </span>
              <select
                value={form.priority}
                onChange={(event) => onChange("priority", event.target.value)}
                className={INPUT_CLASS}
              >
                <option value="low">Low</option>
                <option value="normal">Normal</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </label>

            <label className="block">
              <span className="text-[10px] font-black uppercase tracking-[0.13em] text-[#10233F]">
                Link to invoice
              </span>
              <select
                value={form.invoiceId}
                onChange={(event) => {
                  const invoiceId = event.target.value;
                  const invoice = openInvoices.find(
                    (item) => String(item.id) === String(invoiceId)
                  );

                  onChange("invoiceId", invoiceId);
                  if (invoice?.currency) {
                    onChange("currency", safeString(invoice.currency).toUpperCase());
                  }
                }}
                className={INPUT_CLASS}
              >
                <option value="">No invoice link — general request</option>
                {openInvoices.map((invoice) => (
                  <option key={invoice.id} value={invoice.id}>
                    {invoice.invoice_number ||
                      invoice.title ||
                      "Open invoice"}{" "}
                    · {formatMoney(
                      invoice.outstanding_amount ??
                        invoice.total_amount ??
                        invoice.amount,
                      invoice.currency || "PKR"
                    )}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="text-[10px] font-black uppercase tracking-[0.13em] text-[#10233F]">
                Target date
              </span>
              <input
                type="date"
                value={form.dueDate}
                onChange={(event) => onChange("dueDate", event.target.value)}
                className={INPUT_CLASS}
              />
              <span className="mt-1 block text-[9px] font-semibold text-[#73869A]">
                Stored in request metadata for counselor/student context.
              </span>
            </label>
          </div>

          <label className="mt-4 block">
            <span className="text-[10px] font-black uppercase tracking-[0.13em] text-[#10233F]">
              Message / reason
            </span>
            <textarea
              value={form.message}
              onChange={(event) => onChange("message", event.target.value)}
              placeholder="Explain what the student needs to pay or confirm."
              className={`${INPUT_CLASS} min-h-[110px] resize-y`}
            />
          </label>

          <div className="mt-5 rounded-[1.2rem] border-2 border-violet-300 bg-violet-50 p-4">
            <p className="text-[9px] font-black uppercase tracking-[0.14em] text-violet-700">
              Finance integrity rule
            </p>
            <p className="mt-1 text-xs font-semibold leading-5 text-violet-900/80">
              Creating this request must not change Paid, Outstanding, invoice
              status or confirmed-payment counts. Those change only when Admin
              records/approves real money.
            </p>
          </div>

          <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="rounded-xl border-2 border-[#AFC0D0] bg-white px-5 py-3 text-xs font-black text-[#123865] transition hover:border-[#123865] disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-[#FF5A0A] bg-[#FF5A0A] px-5 py-3 text-xs font-black text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-55"
            >
              {saving ? (
                <LoaderCircle className="h-4 w-4 animate-spin" />
              ) : (
                <WalletCards className="h-4 w-4" />
              )}
              {saving ? "Creating Request..." : "Create Payment Request"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function FinanceCard({ record, compact, actionKey, onAction, onCreatePaymentRequest }) {
  const busyFollowUp = actionKey === `followup-${record.id}`;
  const busyReview = actionKey === `review-${record.id}`;
  const settled = isSettled(record);
  const tone = pressureTone(record.pressureScore);
  const nextDue = record.nearestInvoice?.due_date;
  const payment = record.latestPayment;

  return (
    <article className="overflow-hidden rounded-[1.7rem] border-[3px] border-[#123865] bg-[#FFFCF7] shadow-[0_14px_34px_rgba(16,35,63,0.10)]">
      <div className="border-b-2 border-[#D8B07B] bg-[#FFF8EF] p-4 sm:p-5">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-xl border-2 border-[#123865] bg-[#123865] px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.13em] text-white">
                Assigned Student Finance
              </span>
              <span className={`rounded-xl border-2 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.13em] ${settled ? "border-emerald-300 bg-emerald-50 text-emerald-700" : record.pressureScore >= 45 ? "border-rose-300 bg-rose-50 text-rose-700" : "border-orange-300 bg-orange-50 text-orange-700"}`}>
                {settled ? "Clear" : record.pressureScore >= 45 ? "Needs Attention" : "Monitor"}
              </span>
            </div>
            <h3 className="mt-3 text-xl font-black text-[#10233F]">{record.studentName}</h3>
            <p className="mt-1 text-xs font-semibold text-[#5B6D80]">
              {record.studentEmail || "No email"} · {record.invoices.length} invoice(s) · {record.confirmedPayments.length} confirmed payment(s)
            </p>
          </div>

          <div className={`rounded-[1.2rem] border-2 px-4 py-3 ${toneClass(tone)}`}>
            <p className="text-[8px] font-black uppercase tracking-[0.12em] text-[#73869A]">Finance Pressure</p>
            <p className="mt-1 text-2xl font-black text-[#10233F]">{record.pressureScore}</p>
            <p className="mt-1 text-[10px] font-semibold text-[#5B6D80]">{record.nextAction}</p>
          </div>
        </div>
      </div>

      <div className="p-4 sm:p-5">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <InfoCell
            icon={ReceiptText}
            eyebrow="Open Invoices"
            value={record.openInvoices.length}
            helper={record.overdueInvoices.length ? `${record.overdueInvoices.length} overdue` : "No overdue invoice"}
            tone={record.overdueInvoices.length ? "rose" : record.openInvoices.length ? "orange" : "emerald"}
          />
          <InfoCell
            icon={FileCheck2}
            eyebrow="Pending Receipts"
            value={record.pendingReceipts.length}
            helper={record.latestReceipt ? `Latest ${formatRelativeTime(record.latestReceipt.created_at || record.latestReceipt.updated_at)}` : "No receipt submitted"}
            tone={record.pendingReceipts.length ? "amber" : "emerald"}
          />
          <InfoCell
            icon={CalendarClock}
            eyebrow="Nearest Due"
            value={formatDate(nextDue)}
            helper={record.nearestInvoice ? record.nearestInvoice.title || record.nearestInvoice.invoice_number || "Open invoice" : "No open invoice"}
            tone={record.overdueInvoices.length ? "rose" : "navy"}
          />
          <InfoCell
            icon={CheckCircle2}
            eyebrow="Latest Payment"
            value={payment ? formatMoney(payment.amount, payment.currency) : "None"}
            helper={payment ? formatDate(payment.paid_at || payment.created_at) : "No confirmed payment"}
            tone={payment ? "emerald" : "navy"}
          />
        </div>

        {!compact ? (
          <div className="mt-3 grid gap-3 xl:grid-cols-[1.15fr_0.85fr]">
            <section className="rounded-[1.35rem] border-2 border-[#C9D6E2] bg-white p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[9px] font-black uppercase tracking-[0.15em] text-orange-700">Money Position</p>
                  <p className="mt-1 text-base font-black text-[#10233F]">Balances stay separated by currency</p>
                </div>
                <Banknote className="h-6 w-6 text-[#123865]" aria-hidden="true" />
              </div>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {record.currencyBuckets.length ? (
                  record.currencyBuckets.map((bucket) => (
                    <MoneyBucket key={bucket.currency} bucket={bucket} />
                  ))
                ) : (
                  <div className="sm:col-span-2 rounded-xl border-2 border-dashed border-[#C9D6E2] bg-[#F8FBFD] p-5 text-center text-xs font-semibold text-[#5B6D80]">
                    No invoice/payment money record yet.
                  </div>
                )}
              </div>
            </section>

            <section className="rounded-[1.35rem] border-2 border-[#C9D6E2] bg-white p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[9px] font-black uppercase tracking-[0.15em] text-emerald-700">Verified Destinations</p>
                  <p className="mt-1 text-base font-black text-[#10233F]">What the student can be directed to use</p>
                </div>
                <Landmark className="h-6 w-6 text-emerald-600" aria-hidden="true" />
              </div>
              <div className="mt-3 space-y-2">
                {record.paymentAccounts.length ? (
                  record.paymentAccounts.slice(0, 4).map((account) => (
                    <PaymentDestination key={account.id || `${account.account_type}-${account.account_number || account.mobile_wallet_number}`} account={account} />
                  ))
                ) : (
                  <div className="rounded-xl border-2 border-dashed border-[#C9D6E2] bg-[#F8FBFD] p-5 text-center text-xs font-semibold text-[#5B6D80]">
                    No active payment destination is configured in Admin Finance.
                  </div>
                )}
              </div>
            </section>
          </div>
        ) : null}

        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <InfoCell
            icon={WalletCards}
            eyebrow="Payment Requests"
            value={record.openRequests.length}
            helper="Open counselor/operations request"
            tone={record.openRequests.length ? "orange" : "emerald"}
          />
          <InfoCell
            icon={CreditCard}
            eyebrow="Outstanding Currencies"
            value={primaryOutstanding(record)}
            helper="Currencies with money still due"
            tone={primaryOutstanding(record) ? "orange" : "emerald"}
          />
          <InfoCell
            icon={ShieldCheck}
            eyebrow="Finance Position"
            value={settled ? "Clear" : "In Progress"}
            helper={settled ? "No active financial blocker" : record.nextAction}
            tone={settled ? "emerald" : "violet"}
          />
        </div>

        {!compact && record.openRequests.length ? (
          <section className="mt-4 overflow-hidden rounded-[1.35rem] border-2 border-orange-300 bg-orange-50">
            <div className="flex items-center justify-between gap-3 border-b border-orange-200 px-4 py-3">
              <div>
                <p className="text-[9px] font-black uppercase tracking-[0.15em] text-orange-700">
                  Open Payment Requests
                </p>
                <p className="mt-1 text-sm font-black text-[#10233F]">
                  Student payment coordination already in progress
                </p>
              </div>
              <span className="rounded-lg border border-orange-300 bg-white px-2.5 py-1 text-[9px] font-black text-orange-800">
                {record.openRequests.length} OPEN
              </span>
            </div>

            <div className="grid gap-2 p-3 lg:grid-cols-2">
              {record.openRequests.slice(0, 4).map((request) => (
                <div
                  key={request.id}
                  className="rounded-xl border-2 border-white/90 bg-white p-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="break-words text-xs font-black text-[#10233F]">
                        {request.title || "Payment Request"}
                      </p>
                      <p className="mt-1 text-[10px] font-semibold leading-4 text-[#5B6D80]">
                        {request.message || "Student payment action requested."}
                      </p>
                    </div>
                    <span className="shrink-0 text-xs font-black text-orange-800">
                      {formatMoney(request.amount, request.currency || "PKR")}
                    </span>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-[9px] font-black uppercase tracking-[0.08em]">
                    <span className="rounded-lg border border-orange-200 bg-orange-50 px-2 py-1 text-orange-800">
                      {pretty(request.status || "pending")}
                    </span>
                    <span className="rounded-lg border border-[#D9E3EC] bg-[#F8FBFD] px-2 py-1 text-[#5B6D80]">
                      {pretty(request.priority || "normal")}
                    </span>
                    <span className="text-[#73869A]">
                      {formatDate(request.created_at)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        <div className="mt-4 flex flex-col gap-2 border-t-2 border-[#D8B07B] pt-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => onCreatePaymentRequest(record)}
              disabled={Boolean(actionKey)}
              className="inline-flex items-center gap-2 rounded-xl border-2 border-violet-600 bg-violet-600 px-4 py-2.5 text-xs font-black text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-55"
            >
              <WalletCards className="h-4 w-4" />
              Create Payment Request
            </button>

            <button
              type="button"
              onClick={() => onAction("followup", record)}
              disabled={Boolean(actionKey)}
              className="inline-flex items-center gap-2 rounded-xl border-2 border-orange-500 bg-orange-500 px-4 py-2.5 text-xs font-black text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-55"
            >
              {busyFollowUp ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <ClipboardCheck className="h-4 w-4" />}
              {busyFollowUp ? "Creating..." : "Create Finance Follow-up"}
            </button>
            <button
              type="button"
              onClick={() => onAction("review", record)}
              disabled={Boolean(actionKey)}
              className="inline-flex items-center gap-2 rounded-xl border-2 border-[#123865] bg-[#123865] px-4 py-2.5 text-xs font-black text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-[#0B2A4B] disabled:cursor-not-allowed disabled:opacity-55"
            >
              {busyReview ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <History className="h-4 w-4" />}
              {busyReview ? "Logging..." : "Log Finance Review"}
            </button>
          </div>

          <p className="text-[10px] font-bold text-[#73869A]">
            Counselors may create payment requests. Invoice, confirmed-payment and receipt authority remains with Admin Finance OS.
          </p>
        </div>
      </div>
    </article>
  );
}

export default function CounselorFinanceWorkspace({ snapshot, counselor, onRefresh }) {
  const [refreshing, setRefreshing] = useState(false);
  const [status, setStatus] = useState(null);
  const [actionKey, setActionKey] = useState("");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState(() => readSessionValue(FILTER_STORAGE_KEY, "all"));
  const [sort, setSort] = useState(() => readSessionValue(SORT_STORAGE_KEY, "priority"));
  const [view, setView] = useState(() => readSessionValue(VIEW_STORAGE_KEY, "detailed"));
  const [paymentRequestTarget, setPaymentRequestTarget] = useState(null);
  const [paymentRequestForm, setPaymentRequestForm] = useState(() =>
    makePaymentRequestForm()
  );
  const [paymentRequestSaving, setPaymentRequestSaving] = useState(false);

  useEffect(() => {
    if (!FILTERS.some((item) => item.key === filter)) setFilter("all");
  }, [filter]);

  useEffect(() => {
    if (!SORTS.some((item) => item.key === sort)) setSort("priority");
  }, [sort]);

  useEffect(() => {
    if (!["detailed", "compact"].includes(view)) setView("detailed");
  }, [view]);

  useEffect(() => writeSessionValue(FILTER_STORAGE_KEY, filter), [filter]);
  useEffect(() => writeSessionValue(SORT_STORAGE_KEY, sort), [sort]);
  useEffect(() => writeSessionValue(VIEW_STORAGE_KEY, view), [view]);

  const queue = useMemo(() => buildCounselorFinanceQueue(snapshot || {}), [snapshot]);

  const stats = useMemo(() => {
    const activeDestinations = safeArray(snapshot?.paymentAccounts).filter(
      (account) => account.is_active !== false
    ).length;

    return {
      students: queue.length,
      attention: queue.filter((record) => record.pressureScore >= 45).length,
      openInvoices: queue.reduce((sum, record) => sum + record.openInvoices.length, 0),
      overdueInvoices: queue.reduce((sum, record) => sum + record.overdueInvoices.length, 0),
      payments: queue.reduce((sum, record) => sum + record.confirmedPayments.length, 0),
      pendingReceipts: queue.reduce((sum, record) => sum + record.pendingReceipts.length, 0),
      requests: queue.reduce((sum, record) => sum + record.openRequests.length, 0),
      destinations: activeDestinations,
      clear: queue.filter(isSettled).length,
    };
  }, [queue, snapshot?.paymentAccounts]);

  const filtered = useMemo(() => {
    const search = normalize(query);
    let next = queue;

    if (filter === "attention") next = next.filter((record) => record.pressureScore >= 45);
    if (filter === "overdue") next = next.filter((record) => record.overdueInvoices.length > 0);
    if (filter === "receipts") next = next.filter((record) => record.pendingReceipts.length > 0);
    if (filter === "requests") next = next.filter((record) => record.openRequests.length > 0);
    if (filter === "clear") next = next.filter(isSettled);

    if (search) {
      next = next.filter((record) =>
        normalize(
          [
            record.studentName,
            record.studentEmail,
            record.nextAction,
            ...record.invoices.map((invoice) => `${invoice.title || ""} ${invoice.invoice_number || ""} ${invoice.status || ""}`),
            ...record.payments.map((payment) => `${payment.reference || ""} ${payment.payment_method || ""} ${payment.status || ""}`),
            ...record.receipts.map((receipt) => `${receipt.reference || ""} ${receipt.status || receipt.review_status || ""}`),
          ].join(" ")
        ).includes(search)
      );
    }

    return [...next].sort((a, b) => {
      if (sort === "student") return safeString(a.studentName).localeCompare(safeString(b.studentName));
      if (sort === "recent") return dateMs(b.updatedAt) - dateMs(a.updatedAt);
      if (sort === "overdue") return b.overdueInvoices.length - a.overdueInvoices.length;
      if (sort === "outstanding") return primaryOutstanding(b) - primaryOutstanding(a);
      return b.pressureScore - a.pressureScore;
    });
  }, [queue, query, filter, sort]);

  const openPaymentRequestComposer = useCallback((record) => {
    if (!record) return;
    setPaymentRequestTarget(record);
    setPaymentRequestForm(makePaymentRequestForm(record));
    setStatus(null);
  }, []);

  const closePaymentRequestComposer = useCallback(() => {
    if (paymentRequestSaving) return;
    setPaymentRequestTarget(null);
    setPaymentRequestForm(makePaymentRequestForm());
  }, [paymentRequestSaving]);

  const updatePaymentRequestForm = useCallback((field, value) => {
    setPaymentRequestForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  }, []);

  const submitPaymentRequest = useCallback(
    async (event) => {
      event.preventDefault();

      const record = paymentRequestTarget;
      if (!record || paymentRequestSaving) return;

      const amount = safeNumber(paymentRequestForm.amount);
      if (amount <= 0) {
        setStatus({
          type: "error",
          message: "Enter a valid payment-request amount.",
        });
        return;
      }

      const title = safeString(paymentRequestForm.title).trim();
      if (!title) {
        setStatus({
          type: "error",
          message: "Enter a payment-request title.",
        });
        return;
      }

      setPaymentRequestSaving(true);
      setStatus(null);

      try {
        const counselorId =
          counselor?.id ||
          counselor?.profile_id ||
          counselor?.user_id ||
          null;

        const payload = {
          student_id: safeString(record.studentId),
          student_type: safeString(record.studentType || "inquiry"),
          invoice_id: paymentRequestForm.invoiceId || null,
          title,
          message: safeString(paymentRequestForm.message).trim() || null,
          amount,
          currency: safeString(paymentRequestForm.currency || "PKR").toUpperCase(),
          priority: safeString(paymentRequestForm.priority || "normal").toLowerCase(),
          status: "pending",
          metadata: {
            created_from: "counselor_finance_workspace",
            target_date: paymentRequestForm.dueDate || null,
            counselor_name:
              counselor?.full_name ||
              counselor?.name ||
              counselor?.display_name ||
              null,
            counselor_email: counselor?.email || null,
          },
        };

        if (isUuid(counselorId)) {
          payload.requested_by = counselorId;
        }

        const { data, error } = await supabase
          .from("counselor_payment_requests")
          .insert(payload)
          .select("*")
          .single();

        if (error) throw error;

        await writeCounselorTimelineEvent({
          studentId: record.studentId,
          studentName: record.studentName,
          eventType: "finance_payment_request_created",
          title: "Payment request created by counselor",
          description: `${title} · ${formatMoney(amount, payload.currency)}`,
          counselor,
          metadata: {
            paymentRequestId: data?.id || null,
            amount,
            currency: payload.currency,
            priority: payload.priority,
            invoiceId: payload.invoice_id,
            targetDate: paymentRequestForm.dueDate || null,
            studentType: record.studentType,
            actionSource: "CounselorFinanceWorkspace",
          },
        });

        setStatus({
          type: "success",
          message: `${formatMoney(
            amount,
            payload.currency
          )} payment request created for ${record.studentName}.`,
        });

        setPaymentRequestTarget(null);
        setPaymentRequestForm(makePaymentRequestForm());
        await Promise.resolve(onRefresh?.());
      } catch (error) {
        console.error("Counselor payment request failed", error);
        setStatus({
          type: "error",
          message:
            error?.message ||
            "Payment request could not be created. Check counselor payment-request permissions and try again.",
        });
      } finally {
        setPaymentRequestSaving(false);
      }
    },
    [
      counselor,
      onRefresh,
      paymentRequestForm,
      paymentRequestSaving,
      paymentRequestTarget,
    ]
  );

  const runAction = useCallback(
    async (kind, record) => {
      if (!record || actionKey) return;
      const key = `${kind}-${record.id}`;
      setActionKey(key);
      setStatus(null);

      try {
        if (kind === "followup") {
          const title = record.nextAction || "Finance follow-up";

          await createCounselorTask({
            studentId: record.studentId,
            studentType: record.studentType,
            studentName: record.studentName,
            title,
            description: `Finance follow-up: ${title}`,
            category: record.pressureScore >= 60 ? "Finance Recovery" : "Finance Readiness",
            priority: record.pressureScore >= 70 ? "Urgent" : record.pressureScore >= 45 ? "High" : "Normal",
            counselor,
            metadata: {
              financePressureScore: record.pressureScore,
              openInvoices: record.openInvoices.length,
              overdueInvoices: record.overdueInvoices.length,
              pendingReceipts: record.pendingReceipts.length,
              openPaymentRequests: record.openRequests.length,
              studentType: record.studentType,
              actionSource: "CounselorFinanceWorkspace",
            },
          });

          await writeCounselorTimelineEvent({
            studentId: record.studentId,
            studentName: record.studentName,
            eventType: "finance_followup_created",
            title: "Finance follow-up created by counselor",
            description: title,
            counselor,
            metadata: {
              financePressureScore: record.pressureScore,
              openInvoices: record.openInvoices.length,
              overdueInvoices: record.overdueInvoices.length,
              pendingReceipts: record.pendingReceipts.length,
              studentType: record.studentType,
              actionSource: "CounselorFinanceWorkspace",
            },
          });

          setStatus({
            type: "success",
            message: `Finance follow-up created for ${record.studentName}.`,
          });
        } else {
          const description = `${record.openInvoices.length} open invoice(s) · ${record.overdueInvoices.length} overdue · ${record.pendingReceipts.length} receipt(s) pending · ${record.openRequests.length} payment request(s)`;

          await writeCounselorTimelineEvent({
            studentId: record.studentId,
            studentName: record.studentName,
            eventType: "finance_review",
            title: "Finance position reviewed by counselor",
            description,
            counselor,
            metadata: {
              financePressureScore: record.pressureScore,
              openInvoices: record.openInvoices.length,
              overdueInvoices: record.overdueInvoices.length,
              confirmedPayments: record.confirmedPayments.length,
              pendingReceipts: record.pendingReceipts.length,
              openPaymentRequests: record.openRequests.length,
              studentType: record.studentType,
              actionSource: "CounselorFinanceWorkspace",
            },
          });

          setStatus({
            type: "success",
            message: `Finance review logged for ${record.studentName}.`,
          });
        }

        await Promise.resolve(onRefresh?.());
      } catch (error) {
        console.error("Counselor Finance action failed", error);
        setStatus({
          type: "error",
          message:
            error?.message ||
            "Finance counselor action could not be completed. Check task/timeline permissions and try again.",
        });
      } finally {
        setActionKey("");
      }
    },
    [actionKey, counselor, onRefresh]
  );

  const refreshWorkspace = async () => {
    if (refreshing) return;
    setRefreshing(true);
    setStatus(null);
    try {
      await Promise.resolve(onRefresh?.());
    } catch (error) {
      setStatus({
        type: "error",
        message: error?.message || "Finance workspace refresh failed.",
      });
    } finally {
      setRefreshing(false);
    }
  };

  const reset = () => {
    setQuery("");
    setFilter("all");
    setSort("priority");
  };

  return (
    <section className="overflow-hidden rounded-[2.25rem] border-[4px] border-[#123865] bg-[#FFF8EF] p-2.5 shadow-[0_28px_80px_rgba(16,35,63,0.16)] sm:p-4">
      <div className="relative mb-5 overflow-hidden rounded-[1.8rem] border-[3px] border-[#FF5A0A] bg-[#123865] p-4 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08),0_16px_36px_rgba(16,35,63,0.20)] sm:p-5">
        <div aria-hidden="true" className="pointer-events-none absolute -right-14 -top-20 h-52 w-52 rounded-full border-[26px] border-white/5" />
        <div aria-hidden="true" className="pointer-events-none absolute -bottom-24 right-20 h-44 w-44 rounded-full border-[22px] border-orange-400/10" />

        <div className="relative z-[1] flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-orange-300">
              Counselor Finance OS
            </p>
            <h2 className="mt-2 text-2xl font-black tracking-tight text-white">
              Assigned Student Finance Operations
            </h2>
            <p className="mt-2 max-w-4xl text-sm leading-6 text-blue-100">
              Financial intelligence across invoices, confirmed payments, receipt review,
              payment requests and verified destinations — with counselor-created payment requests,
              follow-ups and reviews kept inside the assigned student scope.
            </p>
          </div>

          <div className="relative z-[1] flex flex-wrap gap-2">
            <span className="rounded-xl border-2 border-orange-300/70 bg-orange-400/15 px-3 py-2 text-xs font-black text-orange-300">
              {filtered.length}/{queue.length} visible
            </span>
            <span className="rounded-xl border-2 border-white/20 bg-white/10 px-3 py-2 text-xs font-black text-white">
              {stats.destinations} destinations
            </span>
            <button
              type="button"
              onClick={refreshWorkspace}
              disabled={refreshing}
              className="inline-flex items-center gap-2 rounded-xl border-2 border-white bg-white px-3 py-2 text-xs font-black text-[#123865] transition hover:-translate-y-0.5 hover:bg-orange-50 disabled:opacity-55"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
              {refreshing ? "Refreshing..." : "Refresh Finance"}
            </button>
          </div>
        </div>
      </div>

      <div className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4 2xl:grid-cols-8">
        <FinanceStat label="Assigned Students" value={stats.students} helper="visible in finance scope" icon={UserRound} />
        <FinanceStat label="Needs Attention" value={stats.attention} helper="pressure score 45+" tone={stats.attention ? "rose" : "emerald"} icon={AlertTriangle} />
        <FinanceStat label="Open Invoices" value={stats.openInvoices} helper="collectible invoices" tone={stats.openInvoices ? "orange" : "emerald"} icon={ReceiptText} />
        <FinanceStat label="Overdue" value={stats.overdueInvoices} helper="past due and unpaid" tone={stats.overdueInvoices ? "rose" : "emerald"} icon={Clock3} />
        <FinanceStat label="Confirmed Payments" value={stats.payments} helper="reconciled payment rows" tone="emerald" icon={BadgeCheck} />
        <FinanceStat label="Receipt Review" value={stats.pendingReceipts} helper="waiting on Admin Finance" tone={stats.pendingReceipts ? "amber" : "emerald"} icon={FileCheck2} />
        <FinanceStat label="Payment Requests" value={stats.requests} helper="open operational requests" tone={stats.requests ? "orange" : "emerald"} icon={WalletCards} />
        <FinanceStat label="Clear Cases" value={stats.clear} helper="no active finance blocker" tone="emerald" icon={ShieldCheck} />
      </div>

      <section className="mb-5 overflow-hidden rounded-[1.6rem] border-[3px] border-[#123865] bg-[#FFFCF7]">
        <div className="flex items-center justify-between gap-3 border-b-2 border-[#D8B07B] bg-[#FFF8EF] px-4 py-3">
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.17em] text-orange-700">Finance Lifecycle</p>
            <p className="mt-1 text-sm font-black text-[#10233F]">Counselor visibility across the real money flow</p>
          </div>
          <span className="rounded-xl border-2 border-[#123865] bg-[#123865] px-3 py-1.5 text-[9px] font-black uppercase text-white">
            Admin authoritative
          </span>
        </div>
        <div className="grid gap-2 p-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6">
          <LifecycleCell number="1" label="Invoice" helper="Amount becomes collectible" value={stats.openInvoices} tone="orange" />
          <LifecycleCell number="2" label="Request" helper="Student is asked to act" value={stats.requests} tone="amber" />
          <LifecycleCell number="3" label="Payment" helper="Confirmed money recorded" value={stats.payments} tone="emerald" />
          <LifecycleCell number="4" label="Receipt" helper="Proof awaits review" value={stats.pendingReceipts} tone="violet" />
          <LifecycleCell number="5" label="Reconcile" helper="Invoice balance updates" value={stats.overdueInvoices} tone={stats.overdueInvoices ? "rose" : "navy"} />
          <LifecycleCell number="6" label="Clear" helper="No active finance blocker" value={stats.clear} tone="emerald" />
        </div>
      </section>

      <StatusToast status={status} onDismiss={() => setStatus(null)} />

      <PaymentRequestComposer
        target={paymentRequestTarget}
        form={paymentRequestForm}
        onChange={updatePaymentRequestForm}
        onClose={closePaymentRequestComposer}
        onSubmit={submitPaymentRequest}
        saving={paymentRequestSaving}
      />

      <div className="mb-5 grid gap-3 rounded-[1.55rem] border-[3px] border-[#123865] bg-[#FFF8EF] p-3 shadow-[inset_0_0_0_1px_rgba(255,90,10,0.10)] xl:grid-cols-[minmax(0,1fr)_220px_220px_auto_auto]">
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search student, invoice, payment reference, receipt or finance action..."
          className={INPUT_CLASS}
        />

        <select value={filter} onChange={(event) => setFilter(event.target.value)} className={INPUT_CLASS}>
          {FILTERS.map((item) => (
            <option key={item.key} value={item.key}>
              {item.label}
            </option>
          ))}
        </select>

        <select value={sort} onChange={(event) => setSort(event.target.value)} className={INPUT_CLASS}>
          {SORTS.map((item) => (
            <option key={item.key} value={item.key}>
              Sort: {item.label}
            </option>
          ))}
        </select>

        <div className="flex rounded-xl border-2 border-[#D8B07B] bg-white p-1">
          {[
            ["detailed", "Command"],
            ["compact", "Compact"],
          ].map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setView(key)}
              className={`rounded-lg px-3 py-2 text-[10px] font-black ${
                view === key ? "bg-orange-500 text-white" : "text-[#123865]"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={reset}
          className="rounded-xl border-2 border-[#123865] bg-[#123865] px-4 py-3 text-xs font-black text-white hover:bg-[#0B2A4B]"
        >
          Reset
        </button>
      </div>

      <div className="mb-3 flex flex-col gap-2 rounded-xl border-2 border-[#123865] bg-[#123865] px-4 py-3 text-white sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs font-black uppercase tracking-[0.14em] text-white">
          Finance Command · {filtered.length} visible case{filtered.length === 1 ? "" : "s"}
        </p>
        <p className="text-xs font-semibold text-blue-100">
          Sort: {SORTS.find((item) => item.key === sort)?.label || "Operational Priority"} · View: {view === "compact" ? "Compact" : "Command"}
        </p>
      </div>

      <div className="space-y-4">
        {filtered.length ? (
          filtered.map((record) => (
            <FinanceCard
              key={record.id}
              record={record}
              compact={view === "compact"}
              actionKey={actionKey}
              onAction={runAction}
              onCreatePaymentRequest={openPaymentRequestComposer}
            />
          ))
        ) : (
          <div className="rounded-[1.6rem] border-[3px] border-dashed border-[#AFC0D0] bg-[#FFFCF7] p-9 text-center">
            <CircleDollarSign className="mx-auto h-8 w-8 text-[#123865]" />
            <p className="mt-3 text-base font-black text-[#10233F]">No finance case matches this view.</p>
            <p className="mx-auto mt-2 max-w-2xl text-sm leading-6 text-[#5B6D80]">
              No assigned student matches the current Finance filters. Reset the filters or refresh
              the Counselor OS. Assigned students remain visible here even before their first invoice.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
