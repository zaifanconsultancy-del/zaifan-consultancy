/* eslint-disable react-refresh/only-export-components */
// Papers on Zaifan letterhead that can be printed or saved as PDF: an invoice,
// a payment receipt and a full statement of account. Used by the admin file
// and by the student portal, so both print exactly the same paper.
//
// Printing reuses the site-wide `#zaifan-print-root` rule in index.css: while
// the print dialog is open, only that root is visible.

import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";

import logo from "../../assets/images/brand/logo-tight.webp";
import { fmtDate, fmtMoney, fmtMoneyList, humanize, sumByCurrency } from "../admin/lib/format";

const CONTACT_LINES = ["+92 330 5718131", "zaifanconsultancy@gmail.com", "Peshawar, Pakistan"];

const METHOD_LABELS = {
  bank_transfer: "Bank transfer",
  easypaisa: "Easypaisa",
  jazzcash: "JazzCash",
  cash: "Cash at the office",
  card: "Card",
  other: "Other",
};

export const methodLabel = (method) => METHOD_LABELS[String(method || "").toLowerCase()] || humanize(method) || "—";

/** Stable short number for a payment, e.g. RCP-4F2A9C1B. */
export function receiptNumber(payment) {
  const raw = String(payment?.id ?? "").replace(/[^a-zA-Z0-9]/g, "");
  return `RCP-${(raw.slice(0, 8) || "00000000").toUpperCase()}`;
}

/* ------------------------- one shape for both portals ------------------------- */

const isCancelled = (status) => ["void", "cancelled", "canceled", "draft"].includes(String(status || "").toLowerCase());
const isPaymentCounted = (status) => !["cancelled", "canceled", "failed", "rejected", "refunded"].includes(String(status || "").toLowerCase());

function leftOn({ status, total, paid, outstanding }) {
  if (String(status || "").toLowerCase() === "paid") return 0;
  if (Number(outstanding) > 0) return Number(outstanding);
  return Math.max(Number(total || 0) - Number(paid || 0), 0);
}

/** Admin table row or student-portal row → the same invoice shape. */
export function paperInvoice(row) {
  const invoice = {
    id: row.id,
    number: row.invoice_number || row.number || "",
    title: row.title || humanize(row.category) || "Invoice",
    description: row.description || "",
    total: Number(row.total_amount ?? row.total ?? row.amount ?? 0),
    paid: Number(row.paid_amount ?? row.paid ?? 0),
    outstanding: Number(row.outstanding_amount ?? row.outstanding ?? 0),
    currency: String(row.currency || "PKR").toUpperCase(),
    status: String(row.status || "").toLowerCase(),
    issuedAt: row.issued_at || row.created_at || null,
    dueDate: row.due_date || null,
  };
  invoice.left = isCancelled(invoice.status) ? 0 : leftOn(invoice);
  return invoice;
}

export function paperPayment(row) {
  return {
    id: row.id,
    invoiceId: row.invoice_id || null,
    amount: Number(row.amount || 0),
    currency: String(row.currency || "PKR").toUpperCase(),
    method: row.payment_method || row.method || "",
    reference: row.reference || "",
    status: String(row.status || "confirmed").toLowerCase(),
    paidAt: row.paid_at || row.created_at || null,
  };
}

export function paperAccount(row) {
  return {
    id: row.id,
    bank: row.bank_name || row.bank || humanize(row.account_type || row.type) || "Account",
    title: row.account_title || row.title || "",
    number: row.account_number || row.number || "",
    iban: row.iban || "",
    wallet: row.mobile_wallet_number || row.wallet || "",
  };
}

/* --------------------------------- words --------------------------------- */

const ONES = ["", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen"];
const TENS = ["", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"];
const CURRENCY_WORDS = { PKR: "rupees", EUR: "euros", USD: "US dollars", GBP: "pounds" };

function below1000(n) {
  const parts = [];
  if (n >= 100) {
    parts.push(`${ONES[Math.floor(n / 100)]} hundred`);
    n %= 100;
  }
  if (n >= 20) {
    parts.push(TENS[Math.floor(n / 10)] + (n % 10 ? `-${ONES[n % 10]}` : ""));
  } else if (n > 0) {
    parts.push(ONES[n]);
  }
  return parts.join(" ");
}

/** 150000 → "One hundred fifty thousand rupees only". Whole amounts only. */
export function amountInWords(amount, currency = "PKR") {
  const whole = Math.round(Number(amount || 0));
  if (!Number.isFinite(whole) || whole <= 0 || whole >= 1e12) return "";
  const groups = [
    [1e9, "billion"],
    [1e6, "million"],
    [1e3, "thousand"],
    [1, ""],
  ];
  let rest = whole;
  const words = [];
  for (const [size, name] of groups) {
    const count = Math.floor(rest / size);
    if (count) words.push(`${below1000(count)}${name ? ` ${name}` : ""}`);
    rest %= size;
  }
  const text = `${words.join(" ")} ${CURRENCY_WORDS[currency] || currency} only`;
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/* ---------------------------------- hook ---------------------------------- */

/**
 * const [paper, print] = usePaper();  …  print(<InvoicePaper … />);  …  {paper}
 * Renders the paper into the print-only root and opens the print dialog.
 */
export function usePaper() {
  const [sheet, setSheet] = useState(null);

  useEffect(() => {
    if (!sheet) return undefined;
    const done = () => setSheet(null);
    window.addEventListener("afterprint", done);
    let cancelled = false;
    // Wait for the logo so it is never missing from the PDF.
    const image = new Image();
    const go = () => {
      if (!cancelled) window.requestAnimationFrame(() => window.print());
    };
    image.onload = go;
    image.onerror = go;
    image.src = logo;
    return () => {
      cancelled = true;
      window.removeEventListener("afterprint", done);
    };
  }, [sheet]);

  const print = useCallback((node) => setSheet(node), []);
  const portal = sheet ? createPortal(<div id="zaifan-print-root">{sheet}</div>, document.body) : null;
  return [portal, print];
}

/* --------------------------------- pieces --------------------------------- */

function Sheet({ kind, title, number, date, children }) {
  return (
    <article className="zaifan-sheet bg-white font-sans text-[#071f50]">
      <header className="flex items-start justify-between gap-4 border-b-[3px] border-[#ff4b12] pb-4">
        <img src={logo} alt="Zaifan Consultancy" width="356" height="100" className="h-14 w-auto" />
        <div className="text-right text-[11px] font-bold leading-4 text-[#5f6f89]">
          {CONTACT_LINES.map((line) => (
            <p key={line}>{line}</p>
          ))}
        </div>
      </header>

      <div className="mt-6 flex items-end justify-between gap-4">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#ff4b12]">{kind}</p>
          <h1 className="mt-1 text-[28px] font-black leading-tight tracking-[-0.03em]">{title}</h1>
        </div>
        <div className="text-right text-[12px] font-bold leading-5">
          {number ? (
            <p>
              <span className="text-[#7a879c]">No. </span>
              <span className="font-mono font-black">{number}</span>
            </p>
          ) : null}
          <p>
            <span className="text-[#7a879c]">Date </span>
            <span className="font-black">{fmtDate(date || new Date(), { withYear: true })}</span>
          </p>
        </div>
      </div>

      {children}

      <footer className="mt-10 border-t border-[#071f50]/15 pt-3 text-[10.5px] font-semibold leading-4 text-[#7a879c]">
        <p>This paper was made by the Zaifan Consultancy system on {fmtDate(new Date(), { withYear: true })}. If anything looks wrong, call or WhatsApp {CONTACT_LINES[0]}.</p>
        <p className="mt-1">Zaifan Consultancy only accepts payments into its official accounts. We never ask you to pay into a personal account by message.</p>
      </footer>
    </article>
  );
}

function Party({ label, lines }) {
  return (
    <div>
      <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#7a879c]">{label}</p>
      {lines.filter(Boolean).map((line, index) => (
        <p key={line} className={index === 0 ? "mt-1 text-[15px] font-black" : "text-[12px] font-semibold text-[#405672]"}>
          {line}
        </p>
      ))}
    </div>
  );
}

function Parties({ student }) {
  return (
    <div className="mt-6 grid grid-cols-2 gap-6 rounded-xl bg-[#fff7ed] p-4">
      <Party label="Student" lines={[student?.name || "Student", student?.phone, student?.email, student?.destination ? `Going to ${student.destination}` : ""]} />
      <Party label="From" lines={["Zaifan Consultancy", "Study abroad consultants", CONTACT_LINES[2]]} />
    </div>
  );
}

function Row({ label, value, strong = false, tone = "" }) {
  return (
    <div className={`flex items-baseline justify-between gap-6 py-1.5 ${strong ? "border-t-2 border-[#071f50] text-[16px] font-black" : "text-[13px] font-bold"}`}>
      <span className={strong ? "" : "text-[#405672]"}>{label}</span>
      <span className={tone}>{value}</span>
    </div>
  );
}

function Signatures({ left = "Received by (Zaifan Consultancy)", right = "Student / guardian" }) {
  return (
    <div className="mt-14 grid grid-cols-2 gap-10 text-[11px] font-bold text-[#7a879c]">
      <p className="border-t border-[#071f50]/40 pt-1.5">{left}</p>
      <p className="border-t border-[#071f50]/40 pt-1.5">{right}</p>
    </div>
  );
}

function PayTo({ accounts }) {
  if (!accounts?.length) return null;
  return (
    <section className="mt-6" style={{ breakInside: "avoid" }}>
      <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#7a879c]">Where to pay</p>
      <div className="mt-2 grid grid-cols-2 gap-3">
        {accounts.map((account) => (
          <div key={account.id} className="rounded-xl border border-[#071f50]/15 p-3 text-[12px] font-semibold leading-5">
            <p className="text-[10px] font-black uppercase tracking-[0.12em] text-[#ff4b12]">{account.bank}</p>
            <p className="font-black">{account.title}</p>
            {account.number ? <p className="font-mono">Account {account.number}</p> : null}
            {account.iban ? <p className="break-all font-mono">IBAN {account.iban}</p> : null}
            {account.wallet ? <p className="font-mono">Wallet {account.wallet}</p> : null}
          </div>
        ))}
      </div>
      <p className="mt-2 text-[11.5px] font-semibold text-[#405672]">After paying, send the receipt in your Zaifan student portal (Payments → “I have paid”) or on WhatsApp.</p>
    </section>
  );
}

/** A drawn tick box (font tick boxes print as coloured emoji on some computers). */
const TickBox = ({ on = false }) => (
  <span className={`mr-2 inline-flex h-[13px] w-[13px] translate-y-[2px] items-center justify-center rounded-[3px] border-[1.5px] text-[9px] font-black leading-none ${on ? "border-emerald-700 bg-emerald-700 text-white" : "border-[#071f50]"}`}>{on ? "✓" : ""}</span>
);

const Th = ({ children, right }) => <th className={`border-b-2 border-[#071f50] py-2 text-[10px] font-black uppercase tracking-[0.12em] text-[#7a879c] ${right ? "text-right" : "text-left"}`}>{children}</th>;
const Td = ({ children, right, strong }) => <td className={`border-b border-[#071f50]/10 py-2 align-top text-[12.5px] ${strong ? "font-black" : "font-semibold"} ${right ? "text-right" : ""}`}>{children}</td>;

/* --------------------------------- papers --------------------------------- */

export function InvoicePaper({ student, invoice, payments = [], accounts = [] }) {
  const own = payments.filter((payment) => payment.invoiceId === invoice.id && isPaymentCounted(payment.status));
  const paid = isCancelled(invoice.status) ? invoice.paid : Math.max(invoice.total - invoice.left, 0);
  const settled = invoice.left <= 0 && !isCancelled(invoice.status);
  return (
    <Sheet kind={settled ? "Invoice · paid" : "Invoice"} title={invoice.title} number={invoice.number} date={invoice.issuedAt}>
      <Parties student={student} />

      <table className="mt-6 w-full border-collapse">
        <thead>
          <tr>
            <Th>What it is for</Th>
            <Th right>Amount</Th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <Td>
              <span className="font-black">{invoice.title}</span>
              {invoice.description ? <span className="mt-0.5 block text-[#405672]">{invoice.description}</span> : null}
            </Td>
            <Td right strong>
              {fmtMoney(invoice.total, invoice.currency)}
            </Td>
          </tr>
        </tbody>
      </table>

      <div className="ml-auto mt-4 w-[55%]">
        <Row label="Invoice total" value={fmtMoney(invoice.total, invoice.currency)} />
        <Row label="Already paid" value={fmtMoney(paid, invoice.currency)} />
        <Row strong label={settled ? "Left to pay" : "Left to pay now"} value={fmtMoney(invoice.left, invoice.currency)} tone={settled ? "text-emerald-700" : "text-[#ff4b12]"} />
        {!settled && invoice.dueDate ? <p className="mt-1 text-right text-[12px] font-black">Please pay by {fmtDate(invoice.dueDate, { withYear: true })}</p> : null}
        {!settled ? <p className="mt-1 text-right text-[11px] font-semibold italic text-[#405672]">{amountInWords(invoice.left, invoice.currency)}</p> : null}
      </div>

      {own.length ? (
        <section className="mt-6" style={{ breakInside: "avoid" }}>
          <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#7a879c]">Payments received for this invoice</p>
          <table className="mt-1 w-full border-collapse">
            <tbody>
              {own.map((payment) => (
                <tr key={payment.id}>
                  <Td>{fmtDate(payment.paidAt, { withYear: true })}</Td>
                  <Td>{[methodLabel(payment.method), payment.reference ? `ref ${payment.reference}` : ""].filter(Boolean).join(" · ")}</Td>
                  <Td right strong>
                    {fmtMoney(payment.amount, payment.currency)}
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      ) : null}

      {settled ? (
        <p className="mt-6 inline-block rounded-lg border-2 border-emerald-600 px-3 py-1 text-[13px] font-black uppercase tracking-[0.12em] text-emerald-700">Paid in full · thank you</p>
      ) : (
        <PayTo accounts={accounts} />
      )}
    </Sheet>
  );
}

export function ReceiptPaper({ student, payment, invoice }) {
  return (
    <Sheet kind="Payment receipt" title="Received with thanks" number={receiptNumber(payment)} date={payment.paidAt}>
      <Parties student={student} />

      <div className="mt-6 rounded-xl border-2 border-[#071f50] p-5 text-center">
        <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#7a879c]">Amount received</p>
        <p className="mt-1 text-[40px] font-black leading-none tracking-[-0.03em]">{fmtMoney(payment.amount, payment.currency)}</p>
        <p className="mt-2 text-[12.5px] font-bold italic text-[#405672]">{amountInWords(payment.amount, payment.currency)}</p>
      </div>

      <div className="mt-5">
        <Row label="Received from" value={student?.name || "Student"} />
        <Row label="Date received" value={fmtDate(payment.paidAt, { withYear: true })} />
        {payment.method ? <Row label="How it was paid" value={methodLabel(payment.method)} /> : null}
        {payment.reference ? <Row label="Transaction reference" value={<span className="font-mono">{payment.reference}</span>} /> : null}
        <Row label="Paid for" value={invoice ? `${invoice.title}${invoice.number ? ` (${invoice.number})` : ""}` : "Zaifan Consultancy services"} />
        {invoice ? <Row label="Still left on this invoice" value={fmtMoney(invoice.left, invoice.currency)} /> : null}
      </div>

      <Signatures />
    </Sheet>
  );
}

export function StatementPaper({ student, invoices = [], payments = [], accounts = [] }) {
  const live = invoices.filter((invoice) => !isCancelled(invoice.status));
  const counted = payments.filter((payment) => isPaymentCounted(payment.status));
  const invoiced = sumByCurrency(live, (invoice) => invoice.total, (invoice) => invoice.currency);
  const received = sumByCurrency(counted, (payment) => payment.amount, (payment) => payment.currency);
  const due = sumByCurrency(live, (invoice) => invoice.left, (invoice) => invoice.currency);
  const titleOf = (id) => live.find((invoice) => invoice.id === id)?.title || "—";

  return (
    <Sheet kind="Statement of account" title="Everything billed and paid" date={new Date()}>
      <Parties student={student} />

      <div className="mt-5 grid grid-cols-3 gap-3 text-center">
        {[
          ["Billed", fmtMoneyList(invoiced), ""],
          ["Received", fmtMoneyList(received), "text-emerald-700"],
          ["Left to pay", fmtMoneyList(due), due.length ? "text-[#ff4b12]" : "text-emerald-700"],
        ].map(([label, value, tone]) => (
          <div key={label} className="rounded-xl border border-[#071f50]/15 p-3">
            <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#7a879c]">{label}</p>
            <p className={`mt-1 text-[17px] font-black ${tone}`}>{value}</p>
          </div>
        ))}
      </div>

      <section className="mt-6">
        <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#7a879c]">Invoices</p>
        {live.length ? (
          <table className="mt-1 w-full border-collapse">
            <thead>
              <tr>
                <Th>Date</Th>
                <Th>Invoice</Th>
                <Th right>Total</Th>
                <Th right>Paid</Th>
                <Th right>Left</Th>
              </tr>
            </thead>
            <tbody>
              {live.map((invoice) => (
                <tr key={invoice.id} style={{ breakInside: "avoid" }}>
                  <Td>{fmtDate(invoice.issuedAt, { withYear: true })}</Td>
                  <Td>
                    <span className="font-black">{invoice.title}</span>
                    <span className="block font-mono text-[11px] text-[#7a879c]">
                      {invoice.number}
                      {invoice.left > 0 && invoice.dueDate ? ` · pay by ${fmtDate(invoice.dueDate, { withYear: true })}` : ""}
                    </span>
                  </Td>
                  <Td right>{fmtMoney(invoice.total, invoice.currency)}</Td>
                  <Td right>{fmtMoney(invoice.total - invoice.left, invoice.currency)}</Td>
                  <Td right strong>
                    {fmtMoney(invoice.left, invoice.currency)}
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="mt-1 text-[12.5px] font-semibold text-[#405672]">No invoices yet.</p>
        )}
      </section>

      <section className="mt-6">
        <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#7a879c]">Payments received</p>
        {counted.length ? (
          <table className="mt-1 w-full border-collapse">
            <thead>
              <tr>
                <Th>Date</Th>
                <Th>Receipt</Th>
                <Th>For</Th>
                <Th>How</Th>
                <Th right>Amount</Th>
              </tr>
            </thead>
            <tbody>
              {counted.map((payment) => (
                <tr key={payment.id} style={{ breakInside: "avoid" }}>
                  <Td>{fmtDate(payment.paidAt, { withYear: true })}</Td>
                  <Td>
                    <span className="font-mono text-[11.5px]">{receiptNumber(payment)}</span>
                  </Td>
                  <Td>{titleOf(payment.invoiceId)}</Td>
                  <Td>{methodLabel(payment.method)}</Td>
                  <Td right strong>
                    {fmtMoney(payment.amount, payment.currency)}
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="mt-1 text-[12.5px] font-semibold text-[#405672]">No payments received yet.</p>
        )}
      </section>

      {due.length ? <PayTo accounts={accounts} /> : null}
    </Sheet>
  );
}

/**
 * One-page summary of a whole student file: for the office folder, for a
 * handover to another counselor, or to give to the parents.
 * Every list takes plain rows so the paper does not depend on table shapes.
 */
export function FilePaper({ student, stage, counselor, fileNumber, applications = [], documents = [], missing = [], visa = null, money = null, tasks = [] }) {
  const isChecked = (doc) => ["verified", "approved"].includes(String(doc.status || "").toLowerCase());
  const checked = documents.filter(isChecked).length;
  return (
    <Sheet kind="Student file summary" title={student?.name || "Student"} number={fileNumber} date={new Date()}>
      <div className="mt-6 grid grid-cols-3 gap-4 rounded-xl bg-[#fff7ed] p-4">
        <Party label="Contact" lines={[student?.phone || "No phone", student?.email, student?.city ? `From ${student.city}` : ""]} />
        <Party label="Going to" lines={[student?.destination || "Not chosen yet", stage ? `Stage: ${stage}` : ""]} />
        <Party label="Zaifan counselor" lines={[counselor || "Not assigned yet", CONTACT_LINES[0]]} />
      </div>

      <section className="mt-6" style={{ breakInside: "avoid" }}>
        <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#7a879c]">Applications</p>
        {applications.length ? (
          <table className="mt-1 w-full border-collapse">
            <thead>
              <tr>
                <Th>University</Th>
                <Th>Course</Th>
                <Th>Intake</Th>
                <Th right>Status</Th>
              </tr>
            </thead>
            <tbody>
              {applications.map((app, index) => (
                <tr key={app.id || index}>
                  <Td strong>{app.university || "—"}</Td>
                  <Td>{app.program || "—"}</Td>
                  <Td>{app.intake || "—"}</Td>
                  <Td right>{app.status || "—"}</Td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="mt-1 text-[12.5px] font-semibold text-[#405672]">No application yet.</p>
        )}
      </section>

      <section className="mt-6" style={{ breakInside: "avoid" }}>
        <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#7a879c]">
          Documents · {checked} of {documents.length} checked
        </p>
        {documents.length ? (
          <ul className="mt-2 grid grid-cols-2 gap-x-8 text-[12.5px] font-semibold">
            {documents.map((doc, index) => (
              <li key={doc.id || index} className="flex items-baseline justify-between gap-3 border-b border-[#071f50]/10 py-1.5">
                <span>
                  <TickBox on={isChecked(doc)} />
                  {doc.name}
                </span>
                <span className={isChecked(doc) ? "font-black text-emerald-700" : "text-[#7a879c]"}>{humanize(doc.status) || "—"}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-1 text-[12.5px] font-semibold text-[#405672]">Nothing uploaded yet.</p>
        )}
        {missing.length ? (
          <p className="mt-2 text-[12.5px] font-bold leading-5">
            <span className="text-[#ff4b12]">Still to bring: </span>
            {missing.join(" · ")}
          </p>
        ) : null}
      </section>

      <div className="mt-6 grid grid-cols-2 gap-8" style={{ breakInside: "avoid" }}>
        <section>
          <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#7a879c]">Visa</p>
          {visa ? (
            <div className="mt-1">
              <Row label="Status" value={visa.status || "—"} />
              {visa.appointment ? <Row label="Appointment" value={visa.appointment} /> : null}
              {visa.where ? <Row label="Where" value={visa.where} /> : null}
            </div>
          ) : (
            <p className="mt-1 text-[12.5px] font-semibold text-[#405672]">Not started. It begins after an offer letter.</p>
          )}
        </section>
        <section>
          <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#7a879c]">Money</p>
          <div className="mt-1">
            <Row label="Billed" value={fmtMoneyList(money?.invoiced)} />
            <Row label="Received" value={fmtMoneyList(money?.paid)} />
            <Row strong label="Left to pay" value={fmtMoneyList(money?.due)} tone={money?.due?.length ? "text-[#ff4b12]" : "text-emerald-700"} />
          </div>
        </section>
      </div>

      {tasks.length ? (
        <section className="mt-6" style={{ breakInside: "avoid" }}>
          <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#7a879c]">Next steps</p>
          <ul className="mt-1 text-[12.5px] font-semibold">
            {tasks.slice(0, 8).map((task, index) => (
              <li key={task.id || index} className="flex items-baseline justify-between gap-4 border-b border-[#071f50]/10 py-1.5">
                <span>
                  <TickBox />
                  {task.title}
                </span>
                <span className="shrink-0 text-[#405672]">{task.due ? `by ${fmtDate(task.due, { withYear: true })}` : ""}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </Sheet>
  );
}
