// Payments: what is left to pay, where to pay it, and "I have paid" (send the
// receipt). Zaifan confirms every receipt by hand.

import { useRef, useState } from "react";
import { Banknote, Check, Copy, CreditCard, FileText, FileUp, Landmark, Printer, Receipt, Send } from "lucide-react";

import { studentSupabase } from "../../../lib/studentSupabase";
import { daysUntil, fmtDate, fmtMoney, fmtMoneyList, humanize, sumByCurrency } from "../../admin/lib/format";
import { Button, Card, CardHeader, Chip, EmptyState, Field, FormRow, Input, Modal, Notice, PageHeader, Select, Textarea, useToast } from "../../admin/ui/kit";
import { InvoicePaper, paperAccount, paperInvoice, paperPayment, ReceiptPaper, receiptNumber, StatementPaper, usePaper } from "../../shared/papers";
import { checkFile, invoiceOutstanding, isReceiptPending, RECEIPTS_BUCKET, sizeLabel, uploadOwnFile } from "../lib";

const METHODS = [
  ["bank_transfer", "Bank transfer"],
  ["easypaisa", "Easypaisa"],
  ["jazzcash", "JazzCash"],
  ["cash", "Cash at the office"],
  ["other", "Other"],
];

export default function PaymentsTab({ file, reload }) {
  const [receiptFor, setReceiptFor] = useState(undefined); // undefined = closed, null = no invoice, object = invoice
  const open = file.invoices.filter((invoice) => invoiceOutstanding(invoice) > 0);
  const settled = file.invoices.filter((invoice) => invoiceOutstanding(invoice) <= 0);
  const leftList = sumByCurrency(open, invoiceOutstanding, (invoice) => invoice.currency);
  const total = leftList.length;

  // Papers on Zaifan letterhead (print or save as PDF).
  const [paper, print] = usePaper();
  const paperStudent = { name: file.person.name, phone: file.person.phone, email: file.person.email, destination: file.person.country };
  const paperInvoices = file.invoices.map(paperInvoice);
  const paperPayments = file.payments.map(paperPayment);
  const paperAccounts = file.pay_to.map(paperAccount);
  const printInvoice = (invoice) => print(<InvoicePaper student={paperStudent} invoice={paperInvoice(invoice)} payments={paperPayments} accounts={paperAccounts} />);
  const printReceipt = (payment) => print(<ReceiptPaper student={paperStudent} payment={paperPayment(payment)} invoice={paperInvoices.find((invoice) => invoice.id === payment.invoice_id) || null} />);
  const printStatement = () => print(<StatementPaper student={paperStudent} invoices={paperInvoices} payments={paperPayments} accounts={paperAccounts} />);

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Payments"
        title={total > 0 ? `${fmtMoneyList(leftList)} left to pay` : "You are all paid up"}
        subtitle="Pay to one of the Zaifan accounts below, then send us the receipt here. We confirm it and update your balance."
        actions={
          <>
            {file.invoices.length || file.payments.length ? (
              <Button icon={FileText} onClick={printStatement}>
                Statement (PDF)
              </Button>
            ) : null}
            <Button variant="primary" icon={Send} onClick={() => setReceiptFor(open[0] || null)}>
              I have paid
            </Button>
          </>
        }
      />

      <Card className="pb-3">
        <CardHeader icon={CreditCard} title="To pay" />
        {open.length ? (
          <ul className="mt-3 space-y-2 px-4">
            {open.map((invoice) => {
              const left = invoiceOutstanding(invoice);
              const waiting = file.receipts.some((receipt) => receipt.invoice_id === invoice.id && isReceiptPending(receipt));
              const late = invoice.due_date && daysUntil(invoice.due_date) < 0;
              return (
                <li key={invoice.id} className="flex flex-wrap items-center gap-3 rounded-2xl border border-[#071f50]/8 px-4 py-3.5">
                  <div className="min-w-0 flex-1 basis-full sm:basis-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-[14.5px] font-black">{invoice.title || humanize(invoice.category) || "Invoice"}</p>
                      {waiting ? <Chip color="#0ea5e9">Receipt being checked</Chip> : late ? <Chip color="#ef4444">Late</Chip> : null}
                    </div>
                    <p className="mt-0.5 text-[12.5px] font-semibold text-[#071f50]/55">
                      {[invoice.number, invoice.due_date ? `${late ? "was due" : "due"} ${fmtDate(invoice.due_date)}` : "", Number(invoice.paid) > 0 ? `${fmtMoney(invoice.paid, invoice.currency)} already paid` : ""].filter(Boolean).join(" · ")}
                    </p>
                    {invoice.description ? <p className="mt-1 text-[13px] leading-5 text-[#071f50]/65">{invoice.description}</p> : null}
                  </div>
                  <p className="mr-auto text-[1.15rem] font-black sm:mr-0">{fmtMoney(left, invoice.currency)}</p>
                  <Button size="sm" icon={Printer} onClick={() => printInvoice(invoice)} title="Print or save as PDF">
                    Invoice
                  </Button>
                  <Button size="sm" variant="navy" onClick={() => setReceiptFor(invoice)}>
                    I have paid this
                  </Button>
                </li>
              );
            })}
          </ul>
        ) : (
          <EmptyState compact icon={Check} title="Nothing to pay right now" text="When Zaifan sends you an invoice, it will appear here." />
        )}
      </Card>

      {file.pay_to.length ? (
        <Card className="pb-4">
          <CardHeader icon={Landmark} title="Where to pay" subtitle="Only pay to these accounts. Zaifan never asks you to pay into a personal account by message." />
          <div className="mt-3 grid gap-2.5 px-4 sm:grid-cols-2">
            {file.pay_to.map((account) => (
              <div key={account.id} className="rounded-2xl bg-[#fff7ed] p-4">
                <p className="text-[10.5px] font-black uppercase tracking-[0.14em] text-[#ff4b12]">{account.bank || humanize(account.type) || "Account"}</p>
                <p className="mt-1 text-[14.5px] font-black">{account.title}</p>
                <CopyLine label="Account number" value={account.number} />
                <CopyLine label="IBAN" value={account.iban} />
                <CopyLine label="Mobile wallet" value={account.wallet} />
                {account.instructions ? <p className="mt-2 text-[12.5px] leading-5 text-[#071f50]/60">{account.instructions}</p> : null}
              </div>
            ))}
          </div>
        </Card>
      ) : null}

      {file.receipts.length ? (
        <Card className="pb-3">
          <CardHeader icon={Receipt} title="Receipts you sent" />
          <ul className="mt-3 divide-y divide-[#071f50]/6 px-5">
            {file.receipts.map((receipt) => {
              const state = String(receipt.review_status || receipt.status || "").toLowerCase();
              const chip = state.includes("pending") ? ["Being checked", "#f59e0b"] : state.includes("reject") ? ["Not accepted", "#ef4444"] : ["Confirmed", "#10b981"];
              return (
                <li key={receipt.id} className="flex flex-wrap items-center gap-3 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-[14.5px] font-black">{fmtMoney(receipt.amount, receipt.currency)}</p>
                    <p className="text-[12.5px] font-semibold text-[#071f50]/55">
                      {[METHODS.find(([id]) => id === receipt.method)?.[1] || humanize(receipt.method), receipt.reference ? `ref ${receipt.reference}` : "", `sent ${fmtDate(receipt.submitted_at)}`].filter(Boolean).join(" · ")}
                    </p>
                    {chip[0] === "Not accepted" && receipt.notes ? <p className="mt-0.5 text-[13px] font-bold text-rose-700">Why: {receipt.notes}</p> : null}
                  </div>
                  <Chip color={chip[1]}>{chip[0]}</Chip>
                </li>
              );
            })}
          </ul>
        </Card>
      ) : null}

      {file.payments.length || settled.length ? (
        <Card className="pb-3">
          <CardHeader icon={Banknote} title="Payments we confirmed" />
          <ul className="mt-3 divide-y divide-[#071f50]/6 px-5">
            {file.payments.map((payment) => (
              <li key={payment.id} className="flex items-center gap-3 py-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                  <Check size={16} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[14px] font-black">{fmtMoney(payment.amount, payment.currency)}</p>
                  <p className="text-[12.5px] font-semibold text-[#071f50]/55">
                    {[file.invoices.find((invoice) => invoice.id === payment.invoice_id)?.title, humanize(payment.method), fmtDate(payment.paid_at), receiptNumber(payment)].filter(Boolean).join(" · ")}
                  </p>
                </div>
                <Button size="sm" icon={Printer} onClick={() => printReceipt(payment)} title="Receipt on Zaifan letterhead, to print or save as PDF">
                  Receipt
                </Button>
              </li>
            ))}
            {!file.payments.length
              ? settled.map((invoice) => (
                  <li key={invoice.id} className="flex items-center gap-3 py-3">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                      <Check size={16} />
                    </span>
                    <p className="text-[14px] font-black">
                      {invoice.title || "Invoice"} · {fmtMoney(invoice.total, invoice.currency)} paid
                    </p>
                  </li>
                ))
              : null}
          </ul>
        </Card>
      ) : null}

      {paper}
      {receiptFor !== undefined ? <ReceiptModal key={receiptFor?.id || "none"} invoice={receiptFor} invoices={open} file={file} onClose={() => setReceiptFor(undefined)} onDone={reload} /> : null}
    </div>
  );
}

function CopyLine({ label, value }) {
  const [copied, setCopied] = useState(false);
  if (!value) return null;
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(String(value));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard is optional; the number is on screen.
    }
  };
  return (
    <div className="mt-2 flex items-center gap-2">
      <div className="min-w-0 flex-1">
        <p className="text-[10.5px] font-bold uppercase tracking-[0.1em] text-[#071f50]/45">{label}</p>
        <p className="break-all font-mono text-[13.5px] font-bold">{value}</p>
      </div>
      <button type="button" onClick={copy} className="inline-flex h-8 shrink-0 items-center gap-1 rounded-lg border border-[#071f50]/12 bg-white px-2 text-[11.5px] font-extrabold transition hover:border-[#071f50]/30">
        {copied ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
        {copied ? "Copied" : "Copy"}
      </button>
    </div>
  );
}

function ReceiptModal({ invoice, invoices, file, onClose, onDone }) {
  const toast = useToast();
  const [invoiceId, setInvoiceId] = useState(invoice?.id || "");
  const chosen = invoices.find((item) => item.id === invoiceId) || null;
  const [amount, setAmount] = useState(invoice ? String(invoiceOutstanding(invoice)) : "");
  const [method, setMethod] = useState("bank_transfer");
  const [reference, setReference] = useState("");
  const [notes, setNotes] = useState("");
  const [picked, setPicked] = useState(null);
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState("");
  const input = useRef(null);

  const submit = async () => {
    const value = Number(amount);
    if (!Number.isFinite(value) || value <= 0) return setProblem("Please type the amount you paid.");
    if (method !== "cash" && !picked) return setProblem("Please attach a photo or screenshot of the receipt.");
    if (picked) {
      const issue = checkFile(picked);
      if (issue) return setProblem(issue);
    }
    setBusy(true);
    try {
      const path = picked ? await uploadOwnFile({ bucket: RECEIPTS_BUCKET, personId: file.person.id, file: picked }) : null;
      const { error } = await studentSupabase.rpc("student_add_receipt", {
        p_invoice_id: chosen?.id || null,
        p_amount: value,
        p_currency: chosen?.currency || file.invoices[0]?.currency || "PKR",
        p_method: method,
        p_reference: reference.trim() || null,
        p_notes: notes.trim() || null,
        p_file_path: path,
        p_file_name: picked?.name || null,
      });
      if (error) throw new Error(error.message);
      await onDone();
      toast.push("Receipt sent. We will confirm it soon.");
      onClose();
    } catch (error) {
      setProblem(error.message || "That did not work. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open
      onClose={busy ? undefined : onClose}
      title="Tell us you have paid"
      subtitle="Send the receipt and we will confirm the payment on your file."
      footer={
        <>
          <Button onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button variant="primary" icon={Send} busy={busy} onClick={submit}>
            Send receipt
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {invoices.length ? (
          <Field label="What did you pay for?">
            <Select value={invoiceId} onChange={(event) => setInvoiceId(event.target.value)}>
              {invoices.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.title || "Invoice"} · {fmtMoney(invoiceOutstanding(item), item.currency)} left
                </option>
              ))}
              <option value="">Something else</option>
            </Select>
          </Field>
        ) : null}
        <FormRow>
          <Field label={`Amount you paid (${chosen?.currency || file.invoices[0]?.currency || "PKR"})`} required>
            <Input value={amount} onChange={(event) => setAmount(event.target.value.replace(/[^\d.]/g, ""))} inputMode="decimal" placeholder="e.g. 50000" />
          </Field>
          <Field label="How did you pay?">
            <Select value={method} onChange={(event) => setMethod(event.target.value)}>
              {METHODS.map(([id, label]) => (
                <option key={id} value={id}>
                  {label}
                </option>
              ))}
            </Select>
          </Field>
        </FormRow>
        <Field label="Transaction / reference number" hint="if you have one">
          <Input value={reference} onChange={(event) => setReference(event.target.value)} maxLength={100} placeholder="Printed on the receipt" />
        </Field>

        <input
          ref={input}
          type="file"
          accept=".pdf,.jpg,.jpeg,.png,.webp,.heic,application/pdf,image/*"
          className="hidden"
          onChange={(event) => {
            const next = event.target.files?.[0] || null;
            setPicked(next);
            setProblem(next ? checkFile(next) : "");
          }}
        />
        <button
          type="button"
          onClick={() => input.current?.click()}
          className="flex w-full items-center gap-3 rounded-2xl border-2 border-dashed border-[#071f50]/20 bg-[#fff7ed] px-4 py-4 text-left transition hover:border-[#ff4b12]"
        >
          <FileUp size={22} className="shrink-0 text-[#ff4b12]" />
          <span className="min-w-0">
            <span className="block truncate text-[14px] font-black">{picked ? picked.name : "Attach the receipt"}</span>
            <span className="block text-[12.5px] font-semibold text-[#071f50]/55">{picked ? `${sizeLabel(picked.size)} · tap to change` : "Photo, screenshot or PDF"}</span>
          </span>
        </button>

        <Field label="Anything we should know?" hint="optional">
          <Textarea value={notes} onChange={(event) => setNotes(event.target.value)} rows={2} maxLength={800} placeholder="e.g. paid from my father's account" />
        </Field>

        {problem ? <Notice tone="error">{problem}</Notice> : null}
      </div>
    </Modal>
  );
}
