import React, { useMemo, useState } from "react";
import {
  AlertTriangle,
  BadgeCheck,
  CircleDollarSign,
  FileCheck2,
  ReceiptText,
  Search,
  ShieldCheck,
  WalletCards,
  X,
} from "lucide-react";

function safeArray(value) {
  return Array.isArray(value) ? value.filter(Boolean) : [];
}

function safeNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function lower(value) {
  return String(value ?? "").trim().toLowerCase();
}

function money(value, currency = "PKR") {
  return new Intl.NumberFormat("en-PK", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(safeNumber(value));
}

function getCommissionId(item = {}, index = 0) {
  return (
    item.id ||
    item.commission_id ||
    item.commissionId ||
    `commission-${index + 1}`
  );
}

function getPartner(item = {}) {
  return (
    item.partner ||
    item.partner_name ||
    item.partnerName ||
    item.agent_name ||
    item.agentName ||
    item.university_name ||
    item.universityName ||
    "Unlinked partner"
  );
}

function getStudent(item = {}) {
  return (
    item.student ||
    item.student_name ||
    item.studentName ||
    "Unlinked student"
  );
}

function getStage(item = {}) {
  return (
    item.stage ||
    item.trigger_stage ||
    item.triggerStage ||
    item.eligibility_stage ||
    item.eligibilityStage ||
    "Not recorded"
  );
}

function getStatus(item = {}) {
  return (
    item.status ||
    item.commission_status ||
    item.commissionStatus ||
    "Unknown"
  );
}

function getInvoice(item = {}) {
  return (
    item.invoice ||
    item.invoice_id ||
    item.invoiceId ||
    item.invoice_number ||
    item.invoiceNumber ||
    ""
  );
}

function getCurrency(item = {}) {
  return (
    item.currency ||
    item.currency_code ||
    item.currencyCode ||
    "PKR"
  );
}

function getAmount(item = {}) {
  return safeNumber(
    item.amount ??
      item.commission_amount ??
      item.commissionAmount ??
      item.payable_amount ??
      item.payableAmount
  );
}

function statusTone(status = "") {
  const value = lower(status);

  if (
    value.includes("approved") ||
    value.includes("paid") ||
    value.includes("released")
  ) {
    return "border-[#34D399] bg-[#F0FFF8] text-emerald-700";
  }

  if (
    value.includes("pending") ||
    value.includes("queued") ||
    value.includes("await")
  ) {
    return "border-[#F59E0B] bg-[#FFF8E8] text-amber-800";
  }

  if (
    value.includes("review") ||
    value.includes("dispute") ||
    value.includes("hold")
  ) {
    return "border-[#9B6CFF] bg-[#F8F5FF] text-violet-700";
  }

  if (
    value.includes("reject") ||
    value.includes("declined") ||
    value.includes("cancel")
  ) {
    return "border-[#FB7185] bg-[#FFF4F4] text-red-700";
  }

  return "border-[#C9D7E6] bg-[#FFF8EF] text-slate-600";
}

function MetricCard({
  label,
  value,
  helper,
  tone = "blue",
  icon: Icon,
  badge = "",
}) {
  const tones = {
    navy: "border-[#123865] bg-[#123865]",
    blue: "border-[#60A5FA] bg-[#F2F7FF]",
    green: "border-[#34D399] bg-[#F0FFF8]",
    amber: "border-[#F59E0B] bg-[#FFF8E8]",
    violet: "border-[#9B6CFF] bg-[#F8F5FF]",
  };

  const dark = tone === "navy";

  return (
    <article className={`rounded-[1.35rem] border-[3px] p-4 shadow-[0_6px_18px_rgba(15,35,63,0.05)] ${tones[tone] || tones.blue}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className={`text-[9px] font-black uppercase tracking-[0.11em] ${dark ? "text-orange-300" : "text-slate-500"}`}>
            {label}
          </p>
          <p className={`mt-2 break-words text-2xl font-black ${dark ? "text-white" : "text-[#10233F]"}`}>
            {value}
          </p>
        </div>

        {Icon ? (
          <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border-2 ${
            dark
              ? "border-white/20 bg-white/10 text-orange-200"
              : "border-[#123865]/15 bg-white text-[#123865]"
          }`}>
            <Icon size={16} />
          </div>
        ) : null}
      </div>

      <p className={`mt-2 text-xs font-semibold leading-5 ${dark ? "text-slate-200" : "text-slate-600"}`}>
        {helper}
      </p>

      {badge ? (
        <span className={`mt-3 inline-flex rounded-full border-2 px-2.5 py-1 text-[8px] font-black uppercase tracking-[0.08em] ${
          dark
            ? "border-white/20 bg-white/10 text-white"
            : "border-[#C9D7E6] bg-white text-slate-600"
        }`}>
          {badge}
        </span>
      ) : null}
    </article>
  );
}

function CommissionRow({ item, index }) {
  const amount = getAmount(item);
  const currency = getCurrency(item);
  const status = getStatus(item);

  return (
    <article className="rounded-[1.3rem] border-2 border-[#C9D7E6] bg-white p-4 shadow-[0_6px_18px_rgba(15,35,63,0.04)] transition hover:border-[#F97316]">
      <div className="grid min-w-0 gap-4 xl:grid-cols-[8rem_minmax(15rem,1.2fr)_minmax(12rem,1fr)_12rem_11rem_10rem_10rem] xl:items-center">
        <div className="min-w-0">
          <p className="text-[7px] font-black uppercase tracking-[0.09em] text-slate-500">
            Commission ID
          </p>
          <p className="mt-1 [overflow-wrap:anywhere] text-xs font-black text-[#10233F]">
            {getCommissionId(item, index)}
          </p>
        </div>

        <div className="min-w-0">
          <p className="[overflow-wrap:anywhere] font-black text-[#10233F]">
            {getPartner(item)}
          </p>
          <p className="mt-1 text-[11px] font-semibold text-slate-500">
            {getStudent(item)}
          </p>
        </div>

        <div className="rounded-xl border border-[#E1E8F0] bg-[#FFF8EF] px-3 py-2.5">
          <p className="text-[7px] font-black uppercase tracking-[0.09em] text-slate-500">
            Trigger Stage
          </p>
          <p className="mt-1 text-xs font-black text-[#10233F]">
            {getStage(item)}
          </p>
        </div>

        <div className="rounded-xl border border-[#E1E8F0] bg-[#FFF8EF] px-3 py-2.5">
          <p className="text-[7px] font-black uppercase tracking-[0.09em] text-slate-500">
            Amount
          </p>
          <p className="mt-1 text-xs font-black text-[#10233F]">
            {amount > 0 ? money(amount, currency) : "Not recorded"}
          </p>
        </div>

        <div>
          <p className="text-[7px] font-black uppercase tracking-[0.09em] text-slate-500">
            Status
          </p>
          <span className={`mt-1 inline-flex rounded-full border-2 px-2.5 py-1 text-[8px] font-black uppercase tracking-[0.07em] ${statusTone(status)}`}>
            {status}
          </span>
        </div>

        <div className="rounded-xl border border-[#E1E8F0] bg-[#FFF8EF] px-3 py-2.5">
          <p className="text-[7px] font-black uppercase tracking-[0.09em] text-slate-500">
            Invoice
          </p>
          <p className="mt-1 truncate text-xs font-black text-[#10233F]">
            {getInvoice(item) || "Not linked"}
          </p>
        </div>

        <div className="rounded-xl border border-[#E1E8F0] bg-[#F7FAFC] px-3 py-2.5">
          <p className="text-[7px] font-black uppercase tracking-[0.09em] text-slate-500">
            Evidence
          </p>
          <p className="mt-1 text-xs font-black text-[#10233F]">
            {amount > 0 && getInvoice(item)
              ? "Amount + invoice"
              : amount > 0
                ? "Amount only"
                : "Incomplete"}
          </p>
        </div>
      </div>
    </article>
  );
}

export default function CommissionCenter({
  compact = false,
  records = [],
  partners = [],
}) {
  const [status, setStatus] = useState("All");
  const [query, setQuery] = useState("");

  const commissions = useMemo(() => safeArray(records), [records]);

  const statuses = useMemo(
    () => [
      "All",
      ...new Set(
        commissions
          .map((item) => String(getStatus(item)).trim())
          .filter(Boolean)
      ),
    ],
    [commissions]
  );

  const filtered = useMemo(() => {
    const search = lower(query);

    return commissions.filter((item) => {
      if (status !== "All" && getStatus(item) !== status) {
        return false;
      }

      if (!search) return true;

      return [
        getCommissionId(item),
        getPartner(item),
        getStudent(item),
        getStage(item),
        getStatus(item),
        getInvoice(item),
      ]
        .map(lower)
        .join(" ")
        .includes(search);
    });
  }, [commissions, status, query]);

  const summary = useMemo(() => {
    const withAmount = commissions.filter((item) => getAmount(item) > 0);
    const approved = commissions.filter((item) => {
      const value = lower(getStatus(item));
      return value.includes("approved") || value.includes("paid") || value.includes("released");
    });
    const pending = commissions.filter((item) => lower(getStatus(item)).includes("pending"));
    const review = commissions.filter((item) => {
      const value = lower(getStatus(item));
      return value.includes("review") || value.includes("dispute") || value.includes("hold");
    });

    const currencies = new Set(withAmount.map(getCurrency));

    return {
      withAmount,
      approved,
      pending,
      review,
      currencies,
    };
  }, [commissions]);

  const displayed = compact ? filtered.slice(0, 4) : filtered;

  const filtersActive = Boolean(query.trim()) || status !== "All";

  function clearFilters() {
    setQuery("");
    setStatus("All");
  }

  const canAggregateCurrency = summary.currencies.size === 1;
  const aggregateCurrency = canAggregateCurrency
    ? [...summary.currencies][0]
    : null;

  const totalAmount = canAggregateCurrency
    ? summary.withAmount.reduce((sum, item) => sum + getAmount(item), 0)
    : null;

  const approvedAmount = canAggregateCurrency
    ? summary.approved.reduce((sum, item) => sum + getAmount(item), 0)
    : null;

  return (
    <section className="min-w-0 overflow-hidden rounded-[1.9rem] border-[3px] border-[#C9D7E6] bg-[#FFFDF8] shadow-[0_14px_38px_rgba(15,35,63,0.07)]">
      <div className="grid border-b-[3px] border-[#F97316] xl:grid-cols-[minmax(0,1.2fr)_minmax(16rem,0.8fr)]">
        <div className="bg-[#123865] p-5 text-white sm:p-6">
          <div className="inline-flex items-center gap-2 rounded-full border-2 border-orange-300/30 bg-orange-400/10 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.12em] text-orange-300">
            <CircleDollarSign size={12} />
            Commission Center
          </div>

          <h2 className="mt-3 text-2xl font-black text-white sm:text-3xl">
            Partner Commission Control
          </h2>

          <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-200">
            Commission eligibility, invoice evidence, review queues and payout
            states using real commission records only. Fake students, fake invoices
            and placeholder payouts have been removed.
          </p>
        </div>

        <div className="bg-[#FF5A0A] p-5 text-white sm:p-6">
          <p className="text-[9px] font-black uppercase tracking-[0.12em]">
            Commission Records
          </p>

          <p className="mt-2 text-3xl font-black">
            {commissions.length}
          </p>

          <p className="mt-2 text-xs font-semibold leading-5 text-orange-50">
            {summary.approved.length} approved/released · {summary.pending.length} pending · {summary.review.length} review/hold.
          </p>

          <span className="mt-3 inline-flex rounded-full border-2 border-white/25 bg-white/10 px-3 py-1 text-[8px] font-black uppercase tracking-[0.08em]">
            Finance evidence first
          </span>
        </div>
      </div>

      <div className="space-y-5 p-4 sm:p-5">
        {!compact ? (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              label="Total Commission"
              value={
                totalAmount === null
                  ? summary.withAmount.length
                    ? "Mixed currencies"
                    : "—"
                  : money(totalAmount, aggregateCurrency)
              }
              helper={
                totalAmount === null
                  ? summary.withAmount.length
                    ? "Amounts are recorded in multiple currencies and are not combined."
                    : "No commission amount evidence yet."
                  : "Total across commission records with explicit amounts."
              }
              tone="navy"
              icon={WalletCards}
              badge={summary.withAmount.length ? "Recorded amounts" : "No amounts"}
            />

            <MetricCard
              label="Approved"
              value={
                approvedAmount === null
                  ? summary.approved.length
                  : money(approvedAmount, aggregateCurrency)
              }
              helper={
                approvedAmount === null
                  ? "Approved/released record count."
                  : "Approved/released amount in the single recorded currency."
              }
              tone="green"
              icon={BadgeCheck}
            />

            <MetricCard
              label="Pending Items"
              value={summary.pending.length}
              helper="Commission records explicitly marked pending."
              tone="amber"
              icon={ReceiptText}
            />

            <MetricCard
              label="Review / Hold"
              value={summary.review.length}
              helper="Records requiring review, dispute resolution or hold clearance."
              tone="violet"
              icon={FileCheck2}
            />
          </div>
        ) : null}

        {!compact ? (
          <div className="grid gap-3 lg:grid-cols-[1fr_auto_auto]">
            <label className="relative block">
              <Search
                size={16}
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search commission, partner, student, invoice..."
                className="min-h-11 w-full rounded-xl border-2 border-[#C9D7E6] bg-white pl-11 pr-4 text-sm font-semibold text-[#10233F] outline-none placeholder:text-slate-400 focus:border-[#F97316]"
              />
            </label>

            <select
              value={status}
              onChange={(event) => setStatus(event.target.value)}
              className="min-h-11 rounded-xl border-2 border-[#C9D7E6] bg-white px-3 text-sm font-black text-[#10233F] outline-none focus:border-[#F97316]"
            >
              {statuses.map((item) => (
                <option key={item} value={item}>
                  {item === "All" ? "All Statuses" : item}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={clearFilters}
              disabled={!filtersActive}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border-2 border-[#C9D7E6] bg-[#FFF8EF] px-3 text-xs font-black text-slate-700 disabled:opacity-40"
            >
              <X size={13} />
              Clear
            </button>
          </div>
        ) : null}

        <div className="space-y-2.5">
          {displayed.length ? (
            displayed.map((item, index) => (
              <CommissionRow
                key={getCommissionId(item, index)}
                item={item}
                index={index}
              />
            ))
          ) : (
            <div className="rounded-[1.5rem] border-[3px] border-dashed border-[#C9D7E6] bg-white p-8 text-center">
              <CircleDollarSign size={24} className="mx-auto text-orange-700" />
              <p className="mt-3 font-black text-[#10233F]">
                {commissions.length
                  ? "No commission records match these filters."
                  : "No real commission records yet."}
              </p>
              <p className="mx-auto mt-2 max-w-xl text-sm font-semibold leading-6 text-slate-600">
                {commissions.length
                  ? "Clear or change the commission filters."
                  : "Connect genuine partner commission records before Zaifan reports payout totals, approvals or dispute queues."}
              </p>
            </div>
          )}
        </div>

        {!compact ? (
          <div className="grid gap-3 lg:grid-cols-3">
            <div className="rounded-[1.35rem] border-[3px] border-[#34D399] bg-[#F0FFF8] p-4">
              <div className="flex items-start gap-3">
                <ShieldCheck size={17} className="mt-0.5 shrink-0 text-emerald-700" />
                <div>
                  <p className="text-[8px] font-black uppercase tracking-[0.11em] text-slate-500">
                    Payout Integrity
                  </p>
                  <p className="mt-1 font-black text-[#10233F]">
                    Record exists ≠ payable
                  </p>
                  <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">
                    A commission record is not treated as payout-ready unless its
                    status and finance evidence support that conclusion.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-[1.35rem] border-[3px] border-[#60A5FA] bg-[#F2F7FF] p-4">
              <div className="flex items-start gap-3">
                <FileCheck2 size={17} className="mt-0.5 shrink-0 text-blue-700" />
                <div>
                  <p className="text-[8px] font-black uppercase tracking-[0.11em] text-slate-500">
                    Invoice Integrity
                  </p>
                  <p className="mt-1 font-black text-[#10233F]">
                    Missing invoice stays missing
                  </p>
                  <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">
                    The system no longer invents invoice numbers to make commission
                    records appear reconciled.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-[1.35rem] border-[3px] border-[#F59E0B] bg-[#FFF8E8] p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle size={17} className="mt-0.5 shrink-0 text-amber-700" />
                <div>
                  <p className="text-[8px] font-black uppercase tracking-[0.11em] text-slate-500">
                    Currency Boundary
                  </p>
                  <p className="mt-1 font-black text-[#10233F]">
                    Mixed currencies are not summed
                  </p>
                  <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">
                    If commission records use multiple currencies, Partner OS
                    reports that honestly instead of combining them into a fake total.
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
