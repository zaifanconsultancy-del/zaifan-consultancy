// Payments: invoices we send, money we received, receipts the student uploaded.

import { useState } from "react";
import { Banknote, Eye, FileText, Plus, Printer, Receipt, Wallet } from "lucide-react";

import { openPrivateFile, RECEIPTS_BUCKET } from "../../../../lib/storageFiles";
import { useAdminData } from "../../data/AdminDataProvider";
import { dueLabel, fmtDate, fmtDateTime, fmtMoney, fmtMoneyList, humanize } from "../../lib/format";
import { Button, Card, CardHeader, EmptyState, Field, FormRow, Input, Modal, Select, Stat, Textarea, useConfirm, useForm, useToast } from "../../ui/kit";
import { InvoicePaper, paperAccount, paperInvoice, paperPayment, ReceiptPaper, receiptNumber, StatementPaper, usePaper } from "../../../shared/papers";
import { orNull, StatusChip, toInputDate } from "./shared";

const CATEGORIES = [
  ["service_fee", "Zaifan service fee"],
  ["application_fee", "University application fee"],
  ["visa_fee", "Visa fee"],
  ["translation", "Translation / attestation"],
  ["other", "Other"],
];

const METHODS = [
  ["bank_transfer", "Bank transfer"],
  ["easypaisa", "Easypaisa"],
  ["jazzcash", "JazzCash"],
  ["cash", "Cash in office"],
  ["card", "Card"],
  ["other", "Other"],
];

const invoiceNumber = () => `INV-${Date.now().toString(36).toUpperCase().slice(-6)}`;

export default function PaymentsTab({ person }) {
  const { insert, update, logEvent, admin, reload, data } = useAdminData();
  const [paper, print] = usePaper();
  const toast = useToast();
  const confirm = useConfirm();
  const [invoiceModal, setInvoiceModal] = useState(false);
  const [paymentFor, setPaymentFor] = useState(null); // invoice row or {} for unlinked
  const [busyId, setBusyId] = useState("");

  // Per currency (from lib/people.js), so EUR and PKR are never added together.
  const totals = { ...person.money, currency: person.money.invoiced[0]?.[0] || person.payments[0]?.currency || "PKR" };

  const createInvoice = async (form) => {
    const amount = Number(form.amount);
    const created = await insert("invoices", {
      student_id: String(person.primary.student_id),
      student_type: person.primary.student_type,
      invoice_number: invoiceNumber(),
      title: form.title.trim(),
      description: orNull(form.description),
      category: form.category,
      amount,
      discount_amount: 0,
      tax_amount: 0,
      total_amount: amount,
      outstanding_amount: amount,
      paid_amount: 0,
      currency: form.currency,
      status: "unpaid",
      due_date: orNull(form.due_date),
      issued_at: new Date().toISOString(),
      created_by: admin.id,
      metadata: { created_from: "admin_v2" },
    });
    await logEvent(person, { actionType: "invoice_created", title: `Invoice ${created.invoice_number}: ${fmtMoney(amount, form.currency)}`, description: form.title });
    toast.push("Invoice created. The student can see it in their portal.");
    setInvoiceModal(false);
  };

  const recordPayment = async (form) => {
    const amount = Number(form.amount);
    await insert("payments", {
      student_id: String(person.primary.student_id),
      student_type: person.primary.student_type,
      invoice_id: paymentFor?.id || null,
      amount,
      currency: form.currency,
      payment_method: form.payment_method,
      reference: orNull(form.reference),
      notes: orNull(form.notes),
      status: "confirmed",
      paid_at: form.paid_at ? new Date(form.paid_at).toISOString() : new Date().toISOString(),
      received_by: admin.id,
      metadata: { created_from: "admin_v2" },
    });
    await reload(["invoices"]);
    await logEvent(person, { actionType: "payment_recorded", title: `Payment received: ${fmtMoney(amount, form.currency)}`, description: paymentFor?.title || "" });
    toast.push("Payment recorded.");
    setPaymentFor(null);
  };

  const voidInvoice = async (invoice) => {
    const yes = await confirm({ title: `Cancel invoice ${invoice.invoice_number}?`, text: "The student will no longer be asked to pay it.", confirmLabel: "Cancel invoice", danger: true });
    if (!yes) return;
    await update("invoices", invoice.id, { status: "void", outstanding_amount: 0 });
    await logEvent(person, { actionType: "invoice_void", title: `Invoice ${invoice.invoice_number} cancelled` });
  };

  const reviewReceipt = async (receipt, approve) => {
    setBusyId(receipt.id);
    try {
      if (approve) {
        await insert("payments", {
          student_id: String(person.primary.student_id),
          student_type: person.primary.student_type,
          invoice_id: receipt.invoice_id || null,
          amount: Number(receipt.amount || 0),
          currency: receipt.currency || "PKR",
          payment_method: receipt.payment_method || "bank_transfer",
          reference: receipt.reference || null,
          notes: "From a receipt uploaded by the student",
          status: "confirmed",
          paid_at: receipt.submitted_at || new Date().toISOString(),
          received_by: admin.id,
          metadata: { receipt_id: receipt.id },
        });
        await update("receipts", receipt.id, { status: "converted_to_payment", review_status: "approved", reviewed_by: admin.id, reviewed_at: new Date().toISOString() });
        await reload(["invoices"]);
        await logEvent(person, { actionType: "receipt_approved", title: `Receipt approved: ${fmtMoney(receipt.amount, receipt.currency)}` });
        toast.push("Receipt approved and payment recorded.");
      } else {
        const answer = await confirm({
          title: "Send this receipt back?",
          text: "Tell the student what is wrong. They see this in their portal and can upload again.",
          noteLabel: "What is wrong with it",
          quickNotes: ["The picture is not clear, please upload it again.", "This amount has not reached our account yet.", "The amount on the receipt is different.", "This receipt was already used."],
          confirmLabel: "Send back",
          danger: true,
        });
        if (!answer) return;
        const reason = answer.note;
        await update("receipts", receipt.id, { status: "rejected", review_status: "rejected", notes: reason.trim() || "Please upload a clearer receipt.", reviewed_by: admin.id, reviewed_at: new Date().toISOString() });
        await logEvent(person, { actionType: "receipt_rejected", title: "Receipt sent back", description: reason });
        toast.push("Receipt sent back to the student.");
      }
    } catch {
      // toast shown
    } finally {
      setBusyId("");
    }
  };

  // Papers on letterhead (print or save as PDF).
  const paperStudent = { name: person.name, phone: person.phone, email: person.email, destination: person.country };
  const paperInvoices = person.invoices.map(paperInvoice);
  const paperPayments = person.payments.map(paperPayment);
  const paperAccounts = data.paymentAccounts.filter((account) => account.is_active !== false).map(paperAccount);
  const printInvoice = (invoice) => print(<InvoicePaper student={paperStudent} invoice={paperInvoice(invoice)} payments={paperPayments} accounts={paperAccounts} />);
  const printReceipt = (payment) => print(<ReceiptPaper student={paperStudent} payment={paperPayment(payment)} invoice={paperInvoices.find((invoice) => invoice.id === payment.invoice_id) || null} />);
  const printStatement = () => print(<StatementPaper student={paperStudent} invoices={paperInvoices} payments={paperPayments} accounts={paperAccounts} />);

  const receiptTarget = (receipt) => (receipt.file_path ? { bucket: RECEIPTS_BUCKET, path: receipt.file_path } : receipt.receipt_url);
  const pendingReceipts = person.receipts.filter((receipt) => String(receipt.review_status || receipt.status || "").includes("pending"));

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <Stat label="Invoiced" value={fmtMoneyList(totals.invoiced)} icon={Receipt} />
        <Stat label="Received" value={fmtMoneyList(totals.paid)} tone="green" icon={Banknote} />
        <Stat label="Still due" value={fmtMoneyList(totals.due)} tone={totals.due.length ? "orange" : "navy"} icon={Wallet} />
      </div>

      {pendingReceipts.length ? (
        <Card className="border-amber-200 pb-4">
          <CardHeader icon={Receipt} title="Receipts to check" subtitle="The student says they paid. Open the picture, compare with your bank, then decide." />
          <ul className="mt-3 space-y-2 px-5">
            {pendingReceipts.map((receipt) => (
              <li key={receipt.id} className="flex flex-wrap items-center gap-3 rounded-2xl bg-amber-50 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="text-[15px] font-black text-[#071f50]">{fmtMoney(receipt.amount, receipt.currency)}</p>
                  <p className="text-[12.5px] font-semibold text-[#071f50]/60">
                    {[METHODS.find(([id]) => id === receipt.payment_method)?.[1], receipt.reference ? `ref ${receipt.reference}` : "", `sent ${fmtDateTime(receipt.submitted_at || receipt.created_at)}`].filter(Boolean).join(" · ")}
                  </p>
                  {receipt.notes ? <p className="text-[12.5px] text-[#071f50]/60">“{receipt.notes}”</p> : null}
                </div>
                <Button size="sm" icon={Eye} onClick={() => openPrivateFile(receiptTarget(receipt)).catch((error) => toast.push({ tone: "error", message: error.message }))}>
                  Open receipt
                </Button>
                <Button size="sm" variant="success" busy={busyId === receipt.id} onClick={() => reviewReceipt(receipt, true)}>
                  Money arrived
                </Button>
                <Button size="sm" variant="danger" busy={busyId === receipt.id} onClick={() => reviewReceipt(receipt, false)}>
                  Send back
                </Button>
              </li>
            ))}
          </ul>
        </Card>
      ) : null}

      <Card className="pb-4">
        <CardHeader
          icon={Receipt}
          title="Invoices"
          subtitle="What we asked the student to pay."
          action={
            <>
              {person.invoices.length || person.payments.length ? (
                <Button size="sm" icon={FileText} onClick={printStatement} title="One page with every invoice and payment, to print or save as PDF">
                  Statement
                </Button>
              ) : null}
              <Button size="sm" onClick={() => setPaymentFor({})} disabled={!person.primary}>
                Record a payment
              </Button>
              <Button variant="primary" size="sm" icon={Plus} onClick={() => setInvoiceModal(true)} disabled={!person.primary}>
                New invoice
              </Button>
            </>
          }
        />
        <ul className="mt-3 divide-y divide-[#071f50]/8 px-5">
          {person.invoices.map((invoice) => {
            const open = !["paid", "void", "cancelled"].includes(String(invoice.status || ""));
            const overdue = open && invoice.due_date && new Date(invoice.due_date) < new Date();
            return (
              <li key={invoice.id} className="flex flex-wrap items-center gap-3 py-3">
                <div className="min-w-0 flex-1 basis-full sm:basis-0">
                  <p className="flex flex-wrap items-center gap-2 text-[14.5px] font-black text-[#071f50]">
                    {invoice.title || CATEGORIES.find(([id]) => id === invoice.category)?.[1] || "Invoice"}
                    <StatusChip status={overdue ? "overdue" : invoice.status} />
                  </p>
                  <p className="text-[12.5px] font-semibold text-[#071f50]/55">
                    {invoice.invoice_number ? `${invoice.invoice_number} · ` : ""}issued {fmtDate(invoice.issued_at || invoice.created_at)}
                    {invoice.due_date ? ` · due ${fmtDate(invoice.due_date)} (${dueLabel(invoice.due_date)})` : ""}
                  </p>
                </div>
                <div className="mr-auto sm:mr-0 sm:text-right">
                  <p className="text-[15px] font-black text-[#071f50]">{fmtMoney(invoice.total_amount, invoice.currency)}</p>
                  {open && Number(invoice.paid_amount) > 0 ? <p className="text-[11.5px] font-bold text-[#071f50]/50">{fmtMoney(invoice.outstanding_amount, invoice.currency)} left</p> : null}
                </div>
                <div className="flex gap-1.5">
                  {open ? (
                    <>
                      <Button size="sm" variant="navy" onClick={() => setPaymentFor(invoice)}>
                        Mark paid
                      </Button>
                      <Button size="sm" onClick={() => voidInvoice(invoice)}>
                        Cancel
                      </Button>
                    </>
                  ) : null}
                  {!["void", "cancelled"].includes(String(invoice.status || "")) ? (
                    <Button size="sm" icon={Printer} onClick={() => printInvoice(invoice)} title="Invoice on Zaifan letterhead, to print or save as PDF">
                      Print
                    </Button>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
        {!person.invoices.length ? <EmptyState compact icon={Receipt} title="No invoices yet" text="Create one when the student needs to pay something." /> : null}
      </Card>

      <Card className="pb-4">
        <CardHeader icon={Banknote} title="Payments received" />
        <ul className="mt-3 divide-y divide-[#071f50]/8 px-5">
          {person.payments.map((payment) => (
            <li key={payment.id} className="flex flex-wrap items-center gap-x-3 gap-y-1.5 py-2.5">
              <div className="min-w-0 flex-1 basis-full sm:basis-0">
                <p className="flex items-center gap-2 text-[14px] font-black text-[#071f50]">
                  {fmtMoney(payment.amount, payment.currency)}
                  <StatusChip status={payment.status} />
                </p>
                <p className="text-[12.5px] font-semibold text-[#071f50]/55">
                  {[receiptNumber(payment), METHODS.find(([id]) => id === payment.payment_method)?.[1] || humanize(payment.payment_method), payment.reference ? `ref ${payment.reference}` : "", fmtDateTime(payment.paid_at || payment.created_at)].filter(Boolean).join(" · ")}
                </p>
              </div>
              {payment.status === "confirmed" ? (
                <Button size="sm" icon={Printer} onClick={() => printReceipt(payment)} title="Receipt on Zaifan letterhead, to print or save as PDF">
                  Receipt
                </Button>
              ) : null}
              {payment.status === "confirmed" ? (
                <Button
                  size="sm"
                  onClick={async () => {
                    const yes = await confirm({ title: "Cancel this payment?", text: "Use this only if it was recorded by mistake.", confirmLabel: "Cancel payment", danger: true });
                    if (!yes) return;
                    await update("payments", payment.id, { status: "cancelled" });
                    await reload(["invoices"]);
                  }}
                >
                  Undo
                </Button>
              ) : null}
            </li>
          ))}
        </ul>
        {!person.payments.length ? <EmptyState compact icon={Banknote} title="Nothing received yet" /> : null}
      </Card>

      {paper}
      <InvoiceModal open={invoiceModal} onClose={() => setInvoiceModal(false)} onSave={createInvoice} currency={totals.currency} prices={data.prices.filter((price) => price.is_active !== false)} />
      <PaymentModal key={paymentFor?.id || (paymentFor ? "new" : "closed")} invoice={paymentFor} onClose={() => setPaymentFor(null)} onSave={recordPayment} currency={totals.currency} />
    </div>
  );
}

function InvoiceModal({ open, onClose, onSave, currency, prices = [] }) {
  const [picked, setPicked] = useState("");
  const [form, set, reset, setForm] = useForm({ title: "Zaifan Consultancy service fee", category: "service_fee", amount: "", currency: currency || "PKR", due_date: "", description: "" });
  const [busy, setBusy] = useState(false);
  const toast = useToast();

  const submit = async () => {
    if (!form.title.trim()) return toast.push({ tone: "error", message: "Give the invoice a title." });
    if (!(Number(form.amount) > 0)) return toast.push({ tone: "error", message: "Enter an amount." });
    setBusy(true);
    try {
      await onSave(form);
      reset();
      setPicked("");
    } catch {
      // toast shown
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="New invoice"
      subtitle="The student sees it in their portal with your bank details."
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" busy={busy} onClick={submit}>
            Create invoice
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        {prices.length ? (
          <Field label="Pick from your price list" hint="fills in the rest; you can still change it">
            <Select
              value={picked}
              onChange={(event) => {
                setPicked(event.target.value);
                const price = prices.find((item) => item.id === event.target.value);
                if (price) setForm((current) => ({ ...current, title: price.name, category: price.category || "other", amount: String(Number(price.amount)), currency: price.currency || "PKR", description: price.description || "" }));
              }}
            >
              <option value="">Type it myself</option>
              {prices.map((price) => (
                <option key={price.id} value={price.id}>
                  {price.name} · {fmtMoney(price.amount, price.currency)}
                </option>
              ))}
            </Select>
          </Field>
        ) : null}
        <Field label="What is it for" required>
          <Input value={form.title} onChange={set("title")} />
        </Field>
        <FormRow>
          <Field label="Category">
            <Select value={form.category} onChange={set("category")}>
              {CATEGORIES.map(([id, label]) => (
                <option key={id} value={id}>
                  {label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Pay by">
            <Input type="date" value={form.due_date} onChange={set("due_date")} />
          </Field>
        </FormRow>
        <FormRow>
          <Field label="Amount" required>
            <Input type="number" min="0" value={form.amount} onChange={set("amount")} placeholder="25000" />
          </Field>
          <Field label="Currency">
            <Select value={form.currency} onChange={set("currency")}>
              {["PKR", "EUR", "USD", "GBP"].map((code) => (
                <option key={code}>{code}</option>
              ))}
            </Select>
          </Field>
        </FormRow>
        <Field label="Details" hint="optional">
          <Textarea value={form.description} onChange={set("description")} rows={2} />
        </Field>
      </div>
    </Modal>
  );
}

function PaymentModal({ invoice, onClose, onSave, currency }) {
  const open = Boolean(invoice);
  const [form, set] = useForm({
    amount: invoice?.outstanding_amount || invoice?.total_amount || "",
    currency: invoice?.currency || currency || "PKR",
    payment_method: "bank_transfer",
    reference: "",
    paid_at: toInputDate(new Date()),
    notes: "",
  });
  const [busy, setBusy] = useState(false);
  const toast = useToast();

  const submit = async () => {
    if (!(Number(form.amount) > 0)) return toast.push({ tone: "error", message: "Enter the amount received." });
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
      open={open}
      onClose={onClose}
      title="Record a payment"
      subtitle={invoice?.id ? `For ${invoice.title || invoice.invoice_number}` : "Money received that is not tied to an invoice."}
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" busy={busy} onClick={submit}>
            Save payment
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        <FormRow>
          <Field label="Amount received" required>
            <Input type="number" min="0" value={form.amount} onChange={set("amount")} />
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
          <Field label="How">
            <Select value={form.payment_method} onChange={set("payment_method")}>
              {METHODS.map(([id, label]) => (
                <option key={id} value={id}>
                  {label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Date">
            <Input type="date" value={form.paid_at} onChange={set("paid_at")} />
          </Field>
        </FormRow>
        <Field label="Transaction reference" hint="optional">
          <Input value={form.reference} onChange={set("reference")} />
        </Field>
        <Field label="Note" hint="optional">
          <Textarea value={form.notes} onChange={set("notes")} rows={2} />
        </Field>
      </div>
    </Modal>
  );
}
