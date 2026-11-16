// Money: one month at a time. What students paid in, what the office spent,
// and what is left over. Euros are never added to rupees. Admin only.

import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowDownLeft, ArrowUpRight, ChevronLeft, ChevronRight, Download, Pencil, Plus, Trash2, Wallet } from "lucide-react";

import { useAdminData } from "../data/AdminDataProvider";
import { classNames, fmtDate, fmtMoney, fmtMoneyList, mergeMoney, sumByCurrency, toDate } from "../lib/format";
import { path } from "../lib/paths";
import { Button, Card, CardHeader, Chip, EmptyState, Field, FormRow, Input, Modal, Notice, Select, Spinner, Textarea, useConfirm, useForm, useToast } from "../ui/kit";
import { toInputDate } from "./person/shared";

const BAD_PAYMENT = ["cancelled", "void", "refunded", "failed", "pending"];

const EXPENSE_CATEGORIES = [
  { id: "rent", label: "Office rent", color: "#071f50" },
  { id: "salaries", label: "Salaries", color: "#8b5cf6" },
  { id: "bills", label: "Bills (electricity, internet, phone)", short: "Bills", color: "#0ea5e9" },
  { id: "marketing", label: "Marketing and ads", short: "Marketing", color: "#ff4b12" },
  { id: "student_fees", label: "Fees paid for a student (university, visa, courier)", short: "Paid for students", color: "#10b981" },
  { id: "printing", label: "Printing, translation, attestation", short: "Printing", color: "#f59e0b" },
  { id: "commission", label: "Commission / referral", short: "Commission", color: "#ec4899" },
  { id: "supplies", label: "Office supplies and tea", short: "Supplies", color: "#64748b" },
  { id: "travel", label: "Travel", color: "#14b8a6" },
  { id: "other", label: "Other", color: "#94a3b8" },
];
const CATEGORY = Object.fromEntries(EXPENSE_CATEGORIES.map((category) => [category.id, category]));
const categoryName = (id) => CATEGORY[id]?.short || CATEGORY[id]?.label || "Other";

const METHODS = [
  ["cash", "Cash"],
  ["bank_transfer", "Bank transfer"],
  ["easypaisa", "Easypaisa"],
  ["jazzcash", "JazzCash"],
  ["card", "Card"],
  ["other", "Other"],
];

function monthRange(month) {
  return { start: new Date(month.getFullYear(), month.getMonth(), 1), end: new Date(month.getFullYear(), month.getMonth() + 1, 1) };
}

// "2026-11-03" must mean the 3rd in Pakistan, not midnight UTC.
const dayDate = (value) => (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) ? new Date(`${value}T00:00:00`) : toDate(value));

const inRange = (value, { start, end }) => {
  const date = dayDate(value);
  return Boolean(date && date >= start && date < end);
};

/** What is left per currency: money in minus money out. */
function leftOver(moneyIn, moneyOut) {
  return mergeMoney([moneyIn, moneyOut.map(([currency, amount]) => [currency, -amount])]);
}

function csvCell(value) {
  let text = value === null || value === undefined ? "" : String(value);
  if (/^[=+\-@]/.test(text)) text = `\t${text}`;
  return `"${text.replace(/"/g, '""')}"`;
}

export default function MoneyPage() {
  const { people, data, loading, admin, insert, update, remove } = useAdminData();
  const toast = useToast();
  const confirm = useConfirm();
  const [month, setMonth] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [editing, setEditing] = useState(null);

  const allPayments = useMemo(
    () =>
      people.flatMap((person) =>
        person.payments.filter((payment) => !BAD_PAYMENT.includes(String(payment.status || "").toLowerCase())).map((payment) => ({ payment, person, when: payment.paid_at || payment.created_at }))
      ),
    [people]
  );

  const stats = useMemo(() => {
    const forMonth = (m) => {
      const range = monthRange(m);
      const payments = allPayments.filter((item) => inRange(item.when, range));
      const expenses = data.expenses.filter((expense) => inRange(expense.spent_on, range));
      const moneyIn = sumByCurrency(payments, (item) => item.payment.amount, (item) => item.payment.currency);
      const moneyOut = sumByCurrency(expenses, (expense) => expense.amount, (expense) => expense.currency);
      return { payments, expenses, moneyIn, moneyOut, left: leftOver(moneyIn, moneyOut) };
    };
    const now = forMonth(month);
    const trend = Array.from({ length: 6 }, (_, index) => {
      const m = new Date(month.getFullYear(), month.getMonth() - 5 + index, 1);
      const s = forMonth(m);
      const pkr = (list) => list.find(([currency]) => currency === "PKR")?.[1] || 0;
      return { month: m, in: pkr(s.moneyIn), out: pkr(s.moneyOut) };
    });
    return { ...now, trend };
  }, [allPayments, data.expenses, month]);

  const owed = useMemo(() => mergeMoney(people.map((person) => person.money.due)), [people]);

  const byCategory = useMemo(() => {
    const map = new Map();
    for (const expense of stats.expenses) {
      if (String(expense.currency || "PKR").toUpperCase() !== "PKR") continue;
      map.set(expense.category, (map.get(expense.category) || 0) + Number(expense.amount || 0));
    }
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  }, [stats.expenses]);

  if (loading) return <Spinner label="Adding up the money…" />;

  const isThisMonth = month.getFullYear() === new Date().getFullYear() && month.getMonth() === new Date().getMonth();
  const monthLabel = month.toLocaleDateString("en-GB", { month: "long", year: "numeric" });
  const off = Boolean(data.missing.expenses);
  const trendMax = Math.max(1, ...stats.trend.flatMap((item) => [item.in, item.out]));
  const categoryMax = Math.max(1, ...byCategory.map(([, amount]) => amount));
  const sortedExpenses = [...stats.expenses].sort((a, b) => String(b.spent_on).localeCompare(String(a.spent_on)));
  const sortedPayments = [...stats.payments].sort((a, b) => (toDate(b.when)?.getTime() || 0) - (toDate(a.when)?.getTime() || 0));

  const saveExpense = async (form) => {
    const row = {
      spent_on: form.spent_on,
      category: form.category,
      title: form.title.trim(),
      amount: Number(form.amount),
      currency: form.currency,
      paid_to: form.paid_to.trim() || null,
      payment_method: form.payment_method,
      notes: form.notes.trim() || null,
    };
    if (editing?.id) await update("expenses", editing.id, { ...row, updated_at: new Date().toISOString() });
    else await insert("expenses", { ...row, created_by: admin.id, created_by_name: admin.name });
    setEditing(null);
    toast.push("Expense saved.");
  };

  const removeExpense = async (expense) => {
    const yes = await confirm({ title: `Delete “${expense.title}”?`, text: `${fmtMoney(expense.amount, expense.currency)} on ${fmtDate(expense.spent_on)}. Use this only if it was entered by mistake.`, confirmLabel: "Delete", danger: true });
    if (yes) await remove("expenses", expense.id);
  };

  const download = () => {
    const rows = [["Date", "In or out", "What", "Who", "Type", "Amount", "Currency", "How", "Note"].map(csvCell).join(",")];
    for (const { payment, person, when } of sortedPayments) {
      rows.push(["" + fmtDate(when, { withYear: true }), "In", "Payment from student", person.name, "", payment.amount, payment.currency, payment.payment_method, payment.reference || ""].map(csvCell).join(","));
    }
    for (const expense of sortedExpenses) {
      rows.push([fmtDate(expense.spent_on, { withYear: true }), "Out", expense.title, expense.paid_to || "", categoryName(expense.category), expense.amount, expense.currency, expense.payment_method || "", expense.notes || ""].map(csvCell).join(","));
    }
    const blob = new Blob(["﻿", rows.join("\r\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `zaifan-money-${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, "0")}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    toast.push("Saved to your Downloads folder. Open the file with Excel.");
  };

  const leftIsBad = stats.left.some(([, amount]) => amount < 0);

  return (
    <div className="space-y-5">
      <section className="relative overflow-hidden rounded-[28px] bg-[#071f50] text-white shadow-[0_24px_60px_rgba(7,31,80,0.2)]">
        <div aria-hidden="true" className="pointer-events-none absolute -right-24 -top-40 h-[420px] w-[420px] rounded-full border border-white/[0.06]" />
        <div aria-hidden="true" className="pointer-events-none absolute -right-6 -top-20 h-[250px] w-[250px] rounded-full border border-white/[0.07]" />

        <div className="relative grid gap-6 p-6 sm:p-8 xl:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
          <div>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#ff8a5c]">Money · in and out</p>
              <div className="flex items-center gap-1 rounded-full bg-white/[0.08] p-1">
                <button type="button" aria-label="Previous month" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))} className="rounded-full p-1.5 text-white/70 transition hover:bg-white/10 hover:text-white">
                  <ChevronLeft size={16} />
                </button>
                <span className="min-w-[128px] text-center text-[13px] font-black">{monthLabel}</span>
                <button
                  type="button"
                  aria-label="Next month"
                  disabled={isThisMonth}
                  onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}
                  className="rounded-full p-1.5 text-white/70 transition hover:bg-white/10 hover:text-white disabled:opacity-30"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
            <h1 className="mt-3 text-[1.9rem] font-black leading-tight tracking-[-0.02em] sm:text-[2.3rem]">
              {stats.left.length ? (leftIsBad ? "You spent more than came in" : `${fmtMoneyList(stats.left)} left over`) : "Nothing in or out yet"}
            </h1>
            <p className="mt-2 max-w-lg text-[15px] leading-6 text-white/65">
              {isThisMonth ? "So far this month" : `In ${monthLabel}`}: {fmtMoneyList(stats.moneyIn)} came in from students and {fmtMoneyList(stats.moneyOut)} went out on office costs.
            </p>

            <dl className="mt-6 grid grid-cols-2 gap-2.5 lg:grid-cols-4">
              <Tile label="Came in" value={fmtMoneyList(stats.moneyIn)} hint={`${stats.payments.length} payment${stats.payments.length === 1 ? "" : "s"}`} />
              <Tile label="Went out" value={fmtMoneyList(stats.moneyOut)} hint={`${stats.expenses.length} expense${stats.expenses.length === 1 ? "" : "s"}`} />
              <Tile label="Left over" value={fmtMoneyList(stats.left)} hint="in minus out" accent={leftIsBad} />
              <Tile label="Students still owe" value={fmtMoneyList(owed)} hint="all unpaid invoices" />
            </dl>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-4">
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-white/50">Last 6 months · rupees</p>
            <div className="mt-4 flex h-[150px] items-end gap-3">
              {stats.trend.map((item) => (
                <div key={item.month.toISOString()} className="flex h-full min-w-0 flex-1 flex-col justify-end">
                  <div className="flex flex-1 items-end justify-center gap-1">
                    <span className="w-1/2 max-w-[18px] rounded-t-md bg-[#34d399]" style={{ height: `${Math.max(item.in ? 4 : 0, (item.in / trendMax) * 100)}%` }} title={`In: ${fmtMoney(item.in)}`} />
                    <span className="w-1/2 max-w-[18px] rounded-t-md bg-[#ff8a5c]" style={{ height: `${Math.max(item.out ? 4 : 0, (item.out / trendMax) * 100)}%` }} title={`Out: ${fmtMoney(item.out)}`} />
                  </div>
                  <span className="mt-2 text-center text-[11px] font-bold text-white/50">{item.month.toLocaleDateString("en-GB", { month: "short" })}</span>
                </div>
              ))}
            </div>
            <p className="mt-3 flex items-center gap-4 text-[11.5px] font-bold text-white/55">
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-[#34d399]" /> Came in
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-[#ff8a5c]" /> Went out
              </span>
            </p>
          </div>
        </div>
      </section>

      {off ? (
        <Notice tone="info">The expenses book is built but not switched on in the database yet. It turns on with the next database update. Money that came in already shows below.</Notice>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-2">
        <Card className="pb-3">
          <CardHeader
            icon={ArrowUpRight}
            title="Went out"
            subtitle="Everything the office paid for this month."
            action={
              !off ? (
                <Button variant="primary" size="sm" icon={Plus} onClick={() => setEditing({})}>
                  Add an expense
                </Button>
              ) : null
            }
          />
          {byCategory.length > 1 ? (
            <ul className="mt-3 space-y-1.5 px-5">
              {byCategory.map(([id, amount]) => (
                <li key={id} className="flex items-center gap-3 text-[12.5px] font-bold text-[#071f50]/70">
                  <span className="w-[120px] shrink-0 truncate">{categoryName(id)}</span>
                  <span className="h-2 flex-1 overflow-hidden rounded-full bg-[#071f50]/[0.06]">
                    <span className="block h-full rounded-full" style={{ width: `${(amount / categoryMax) * 100}%`, background: CATEGORY[id]?.color || "#94a3b8" }} />
                  </span>
                  <span className="w-[92px] shrink-0 text-right tabular-nums text-[#071f50]">{fmtMoney(amount)}</span>
                </li>
              ))}
            </ul>
          ) : null}
          {sortedExpenses.length ? (
            <ul className="mt-3 divide-y divide-[#071f50]/8 px-5">
              {sortedExpenses.map((expense) => (
                <li key={expense.id} className="flex flex-wrap items-center gap-x-3 gap-y-1.5 py-2.5">
                  <div className="min-w-0 flex-1 basis-full sm:basis-0">
                    <p className="flex flex-wrap items-center gap-2 text-[14px] font-black text-[#071f50]">
                      {expense.title}
                      <Chip color={CATEGORY[expense.category]?.color || "#94a3b8"}>{categoryName(expense.category)}</Chip>
                    </p>
                    <p className="truncate text-[12.5px] font-semibold text-[#071f50]/55">
                      {[fmtDate(expense.spent_on), expense.paid_to ? `to ${expense.paid_to}` : "", METHODS.find(([id]) => id === expense.payment_method)?.[1], expense.notes].filter(Boolean).join(" · ")}
                    </p>
                  </div>
                  <p className="mr-auto text-[14.5px] font-black tabular-nums text-[#071f50] sm:mr-0">{fmtMoney(expense.amount, expense.currency)}</p>
                  <div className="flex gap-1.5">
                    <Button size="icon" icon={Pencil} onClick={() => setEditing(expense)} aria-label="Edit" />
                    <Button size="icon" variant="danger" icon={Trash2} onClick={() => removeExpense(expense)} aria-label="Delete" />
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState compact icon={Wallet} title={`No expenses in ${monthLabel}`} text={off ? "" : "Add rent, salaries, bills, ads and anything you paid on behalf of a student."} />
          )}
        </Card>

        <Card className="pb-3">
          <CardHeader
            icon={ArrowDownLeft}
            title="Came in"
            subtitle="Payments from students. Record them on the student's Payments tab."
            action={
              stats.payments.length || stats.expenses.length ? (
                <Button size="sm" icon={Download} onClick={download} title="Save this month's money in and out as a file that opens in Excel">
                  Download month
                </Button>
              ) : null
            }
          />
          {sortedPayments.length ? (
            <ul className="mt-3 divide-y divide-[#071f50]/8 px-5">
              {sortedPayments.map(({ payment, person, when }) => (
                <li key={payment.id} className="flex flex-wrap items-center gap-3 py-2.5">
                  <div className="min-w-0 flex-1">
                    <Link to={`${path(`/people/${person.id}`)}?tab=payments`} className="block truncate text-[14px] font-black text-[#071f50] hover:underline">
                      {person.name}
                    </Link>
                    <p className="truncate text-[12.5px] font-semibold text-[#071f50]/55">
                      {[fmtDate(when), METHODS.find(([id]) => id === payment.payment_method)?.[1], payment.reference ? `ref ${payment.reference}` : ""].filter(Boolean).join(" · ")}
                    </p>
                  </div>
                  <p className={classNames("text-[14.5px] font-black tabular-nums text-emerald-700")}>{fmtMoney(payment.amount, payment.currency)}</p>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState compact icon={Wallet} title={`No payments in ${monthLabel}`} />
          )}
        </Card>
      </div>

      <ExpenseModal key={editing?.id || (editing ? "new" : "closed")} expense={editing} onClose={() => setEditing(null)} onSave={saveExpense} />
    </div>
  );
}

function Tile({ label, value, hint, accent = false }) {
  return (
    <div className="min-w-0 rounded-2xl border border-white/10 bg-white/[0.06] p-3.5">
      <dt className="text-[10px] font-black uppercase tracking-[0.14em] text-white/45">{label}</dt>
      <dd className={classNames("mt-1.5 break-words text-[1.25rem] font-black leading-tight tracking-[-0.02em] tabular-nums", accent ? "text-[#ff8a5c]" : "text-white")}>{value}</dd>
      <dd className="mt-1.5 truncate text-[11.5px] font-semibold text-white/50">{hint}</dd>
    </div>
  );
}

function ExpenseModal({ expense, onClose, onSave }) {
  const [form, set] = useForm({
    title: expense?.title || "",
    category: expense?.category || "rent",
    amount: expense?.amount != null ? String(Number(expense.amount)) : "",
    currency: expense?.currency || "PKR",
    spent_on: expense?.spent_on || toInputDate(new Date()),
    paid_to: expense?.paid_to || "",
    payment_method: expense?.payment_method || "cash",
    notes: expense?.notes || "",
  });
  const [busy, setBusy] = useState(false);
  const toast = useToast();

  const submit = async () => {
    if (!form.title.trim()) return toast.push({ tone: "error", message: "Say what the money was for." });
    if (!(Number(form.amount) > 0)) return toast.push({ tone: "error", message: "Enter the amount." });
    if (!form.spent_on) return toast.push({ tone: "error", message: "Pick the date." });
    setBusy(true);
    try {
      await onSave(form);
    } catch {
      // toast shown
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open={Boolean(expense)}
      onClose={onClose}
      title={expense?.id ? "Edit expense" : "Add an expense"}
      subtitle="Money the office paid out."
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" busy={busy} onClick={submit}>
            Save expense
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        <Field label="What was it for" required>
          <Input value={form.title} onChange={set("title")} placeholder="November office rent" />
        </Field>
        <FormRow>
          <Field label="Type">
            <Select value={form.category} onChange={set("category")}>
              {EXPENSE_CATEGORIES.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Date" required>
            <Input type="date" value={form.spent_on} onChange={set("spent_on")} />
          </Field>
        </FormRow>
        <FormRow>
          <Field label="Amount" required>
            <Input type="number" min="0" value={form.amount} onChange={set("amount")} placeholder="45000" />
          </Field>
          <Field label="Currency">
            <Select value={form.currency} onChange={set("currency")}>
              {["PKR", "EUR", "USD", "GBP"].map((code) => (
                <option key={code}>{code}</option>
              ))}
            </Select>
          </Field>
        </FormRow>
        <FormRow>
          <Field label="Paid to" hint="optional">
            <Input value={form.paid_to} onChange={set("paid_to")} placeholder="Landlord, TCS, Meta ads…" />
          </Field>
          <Field label="How">
            <Select value={form.payment_method} onChange={set("payment_method")}>
              {METHODS.map(([id, label]) => (
                <option key={id} value={id}>
                  {label}
                </option>
              ))}
            </Select>
          </Field>
        </FormRow>
        <Field label="Note" hint="optional">
          <Textarea value={form.notes} onChange={set("notes")} rows={2} />
        </Field>
      </div>
    </Modal>
  );
}
