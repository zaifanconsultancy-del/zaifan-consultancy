// PaymentCenterPanel FINANCE REQUEST LIFECYCLE FINAL V7 — request resolution + closed history
// PaymentCenterPanel FINANCE OPERATIONS CLARITY V6 — action-first ledgers + latest/done separation
// PaymentCenterPanel FINANCE LEDGER RECONCILIATION FIX V5 — invoice-linked payments are authoritative
// PaymentCenterPanel PARTNER OS EXTREME V3 — Locked Admin header parity + Official Collection Setup
// Full replacement for: src/components/admin/PaymentCenterPanel.jsx
// Database-aligned with:
// - student_invoices
// - student_payments
// - student_receipts
// - payment_accounts
// Uses database reconciliation triggers as the source of truth.
// Official collection presets only prefill the Admin form; payment_accounts remains the live source shown to students/counselors.

import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../../../lib/supabaseClient";
import { addTimelineEvent } from "../../../../lib/crmTimeline";
import StudentNotificationPreviewModal from "../students/StudentNotificationPreviewModal";
import StudentNotificationComposer from "../students/StudentNotificationComposer";
import {
  buildStudentNotification,
  prepareStudentNotification,
  sendPreparedStudentNotification,
} from "../../../../services/studentNotificationService";
import ZaifanMetricCard from "../../ui/ZaifanMetricCard";


const OFFICIAL_PAYMENT_ACCOUNT_PRESETS = [
  {
    key: "meezan",
    label: "Meezan Bank",
    account_type: "bank",
    account_title: "MALIK MUHAMMAD HUZAIFA KHAN",
    bank_name: "Meezan Bank",
    account_number: "07060114777258",
    iban: "PK32MEZN0007060114777258",
    mobile_wallet_number: "",
    instructions:
      "Branch: Hayatabad BR-PESHAWAR. Use only against a Zaifan invoice or payment request. Add the transaction reference and upload payment proof in Student Portal.",
  },
  {
    key: "easypaisa",
    label: "Easypaisa",
    account_type: "easypaisa",
    account_title: "Zaifan Easypaisa Wallet",
    bank_name: "Easypaisa",
    account_number: "",
    iban: "",
    mobile_wallet_number: "03235718151",
    instructions:
      "Use only against a Zaifan invoice or payment request. Confirm the recipient shown in the wallet app, save the transaction ID and upload payment proof in Student Portal.",
  },
  {
    key: "jazzcash",
    label: "JazzCash",
    account_type: "jazzcash",
    account_title: "Zaifan JazzCash Wallet",
    bank_name: "JazzCash",
    account_number: "",
    iban: "",
    mobile_wallet_number: "03235718151",
    instructions:
      "Use only against a Zaifan invoice or payment request. Confirm the recipient shown in the wallet app, save the transaction ID and upload payment proof in Student Portal.",
  },
  {
    key: "upaisa",
    label: "UPaisa",
    account_type: "upaisa",
    account_title: "Zaifan UPaisa Wallet",
    bank_name: "UPaisa",
    account_number: "",
    iban: "",
    mobile_wallet_number: "03305718131",
    instructions:
      "Use only against a Zaifan invoice or payment request. Confirm the recipient shown in the wallet app, save the transaction ID and upload payment proof in Student Portal.",
  },
];

function normalize(value = "") {
  return String(value || "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "_")
    .replace(/-/g, "_");
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
    return String(value);
  }
}

function formatMoney(amount, currency = "PKR") {
  const number = Number(amount || 0);
  return `${currency || "PKR"} ${number.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
}

function getStudentId(student = {}) {
  return String(student.id || student.student_id || "").trim();
}

function getStudentType(student = {}, fallback = "inquiry") {
  return (
    student.student_type ||
    student.__leadType ||
    student.type ||
    fallback ||
    "inquiry"
  );
}

function getLinkedConfirmedPaymentAmount(invoice = {}, confirmedPayments = []) {
  const invoiceId = String(invoice?.id || "").trim();
  if (!invoiceId) return 0;

  return confirmedPayments.reduce((sum, payment) => {
    if (String(payment?.invoice_id || "").trim() !== invoiceId) return sum;
    if (normalize(payment?.status) !== "confirmed") return sum;

    const invoiceCurrency = String(invoice?.currency || "PKR").toUpperCase();
    const paymentCurrency = String(payment?.currency || invoiceCurrency).toUpperCase();
    if (invoiceCurrency !== paymentCurrency) return sum;

    return sum + Number(payment?.amount || 0);
  }, 0);
}

function getInvoiceOutstanding(invoice = {}, confirmedPayments = []) {
  const total = Math.max(0, Number(invoice.total_amount ?? invoice.amount ?? 0));
  const linkedPaid = Math.max(
    0,
    getLinkedConfirmedPaymentAmount(invoice, confirmedPayments)
  );
  const storedPaid = Math.max(0, Number(invoice.paid_amount ?? 0));
  const storedOutstanding = Number(invoice.outstanding_amount);

  if (linkedPaid > 0) return Math.max(0, total - linkedPaid);
  if (storedPaid > 0) return Math.max(0, total - storedPaid);

  if (Number.isFinite(storedOutstanding) && storedOutstanding > 0) {
    return Math.min(total || storedOutstanding, storedOutstanding);
  }

  return total;
}

function getEffectiveInvoiceStatus(invoice = {}, confirmedPayments = []) {
  const stored = normalize(invoice.status || "unpaid");
  if (["cancelled", "void", "refunded"].includes(stored)) return stored;

  const total = Math.max(0, Number(invoice.total_amount ?? invoice.amount ?? 0));
  const linkedPaid = Math.max(
    0,
    getLinkedConfirmedPaymentAmount(invoice, confirmedPayments)
  );
  const storedPaid = Math.max(0, Number(invoice.paid_amount ?? 0));
  const effectivePaid = linkedPaid > 0 ? linkedPaid : storedPaid;
  const outstanding = getInvoiceOutstanding(invoice, confirmedPayments);

  if (total > 0 && outstanding <= 0) return "paid";
  if (effectivePaid > 0 && outstanding > 0) return "partial";
  if (stored === "overdue") return "overdue";
  if (stored === "paid" && outstanding > 0) return "unpaid";
  return stored || "unpaid";
}

function isCollectibleInvoice(invoice = {}, confirmedPayments = []) {
  const status = getEffectiveInvoiceStatus(invoice, confirmedPayments);
  return !["cancelled", "void", "refunded"].includes(status) &&
    getInvoiceOutstanding(invoice, confirmedPayments) > 0;
}

function isInvoiceOverdue(invoice = {}, confirmedPayments = []) {
  const status = getEffectiveInvoiceStatus(invoice, confirmedPayments);
  if (!invoice.due_date || !isCollectibleInvoice(invoice, confirmedPayments)) return false;
  if (status === "overdue") return true;

  const due = new Date(invoice.due_date);
  if (Number.isNaN(due.getTime())) return false;
  due.setHours(23, 59, 59, 999);

  return due < new Date();
}

function getFinanceRecordTime(record = {}) {
  const candidates = [
    record.updated_at,
    record.reviewed_at,
    record.paid_at,
    record.submitted_at,
    record.requested_at,
    record.issued_at,
    record.created_at,
    record.due_date,
  ];

  for (const value of candidates) {
    if (!value) continue;
    const time = new Date(value).getTime();
    if (Number.isFinite(time)) return time;
  }

  return 0;
}

function formatFinanceMoment(value) {
  if (!value) return "No timestamp";
  try {
    return new Date(value).toLocaleString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return String(value);
  }
}

function statusClass(value = "") {
  const clean = normalize(value);

  if (
    [
      "paid",
      "confirmed",
      "approved",
      "converted_to_payment",
      "completed",
      "active",
    ].includes(clean)
  ) {
    return "border-emerald-300 bg-emerald-50 text-emerald-800";
  }

  if (
    ["overdue", "rejected", "failed", "cancelled", "canceled", "void", "inactive"].includes(
      clean
    )
  ) {
    return "border-red-300 bg-red-50 text-red-800";
  }

  if (["partial", "pending", "sent", "pending_review", "unpaid", "draft"].includes(clean)) {
    return "border-amber-300 bg-amber-50 text-amber-800";
  }

  if (["refunded"].includes(clean)) {
    return "border-blue-300 bg-blue-50 text-blue-800";
  }

  return "border-slate-300 bg-slate-50 text-slate-700";
}

function PaymentCenterPanel({
  student = {},
  studentType = "inquiry",
  adminProfile = null,
  invoices = [],
  payments = [],
  receipts = [],
  paymentRequests = [],
  onSharedDataChange = () => {},
}) {
  const [invoiceForm, setInvoiceForm] = useState({
    title: "Zaifan Service Invoice",
    amount: "",
    currency: "PKR",
    due_date: "",
    category: "service_fee",
    description: "",
  });

  const [paymentForm, setPaymentForm] = useState({
    invoice_id: "",
    amount: "",
    currency: "PKR",
    payment_method: "cash",
    reference: "",
    notes: "",
  });

  const [accountForm, setAccountForm] = useState({
    account_type: "bank",
    account_title: "",
    bank_name: "",
    account_number: "",
    iban: "",
    mobile_wallet_number: "",
    instructions: "",
    is_active: true,
  });

  const [paymentAccounts, setPaymentAccounts] = useState([]);
  const [accountLoading, setAccountLoading] = useState(false);
  const [accountSaving, setAccountSaving] = useState(false);
  const [invoiceSaving, setInvoiceSaving] = useState(false);
  const [paymentSaving, setPaymentSaving] = useState(false);
  const [receiptSavingId, setReceiptSavingId] = useState(null);
  const [actionSavingId, setActionSavingId] = useState(null);
  const [message, setMessage] = useState("");
  const [messageTone, setMessageTone] = useState("info");
  const [pendingNotification, setPendingNotification] = useState(null);
  const [notificationBusy, setNotificationBusy] = useState(false);

  const studentId = getStudentId(student);
  const safeStudentType = getStudentType(student, studentType);
  const studentName =
    student.full_name || student.name || student.student_name || "Student";

  const activeInvoices = useMemo(
    () =>
      invoices.filter(
        (invoice) => !["cancelled", "void"].includes(normalize(invoice.status))
      ),
    [invoices]
  );

  const confirmedPayments = useMemo(
    () => payments.filter((payment) => normalize(payment.status) === "confirmed"),
    [payments]
  );

  const collectibleInvoices = useMemo(
    () =>
      activeInvoices.filter((invoice) =>
        isCollectibleInvoice(invoice, confirmedPayments)
      ),
    [activeInvoices, confirmedPayments]
  );

  const totalsByCurrency = useMemo(() => {
    const map = new Map();

    function ensure(currency) {
      const key = String(currency || "PKR").toUpperCase();
      if (!map.has(key)) {
        map.set(key, {
          currency: key,
          invoiced: 0,
          paid: 0,
          outstanding: 0,
          overdue: 0,
        });
      }
      return map.get(key);
    }

    activeInvoices.forEach((invoice) => {
      const bucket = ensure(invoice.currency);
      const total = Number(invoice.total_amount ?? invoice.amount ?? 0);
      const outstanding = getInvoiceOutstanding(invoice, confirmedPayments);

      bucket.invoiced += total;
      bucket.outstanding += outstanding;

      if (isInvoiceOverdue(invoice, confirmedPayments)) {
        bucket.overdue += outstanding;
      }
    });

    confirmedPayments.forEach((payment) => {
      ensure(payment.currency).paid += Number(payment.amount || 0);
    });

    return [...map.values()].sort((a, b) =>
      a.currency.localeCompare(b.currency)
    );
  }, [activeInvoices, confirmedPayments]);

  const financeStats = useMemo(() => {
    const overdueInvoices = activeInvoices.filter((invoice) =>
      isInvoiceOverdue(invoice, confirmedPayments)
    );
    const openInvoices = activeInvoices.filter((invoice) =>
      isCollectibleInvoice(invoice, confirmedPayments)
    );
    const pendingReceipts = receipts.filter(
      (receipt) => normalize(receipt.status) === "pending_review"
    );

    return {
      activeInvoices: activeInvoices.length,
      openInvoices: openInvoices.length,
      overdueInvoices: overdueInvoices.length,
      confirmedPayments: confirmedPayments.length,
      pendingReceipts: pendingReceipts.length,
      activePaymentAccounts: paymentAccounts.filter((account) => account.is_active).length,
    };
  }, [activeInvoices, confirmedPayments, receipts, paymentAccounts]);

  const openInvoiceRecords = useMemo(
    () =>
      activeInvoices
        .filter((invoice) => isCollectibleInvoice(invoice, confirmedPayments))
        .sort((a, b) => {
          const aOverdue = isInvoiceOverdue(a, confirmedPayments) ? 1 : 0;
          const bOverdue = isInvoiceOverdue(b, confirmedPayments) ? 1 : 0;
          if (aOverdue !== bOverdue) return bOverdue - aOverdue;

          const aDue = a?.due_date ? new Date(a.due_date).getTime() : Number.MAX_SAFE_INTEGER;
          const bDue = b?.due_date ? new Date(b.due_date).getTime() : Number.MAX_SAFE_INTEGER;
          return aDue - bDue;
        }),
    [activeInvoices, confirmedPayments]
  );

  const closedInvoiceRecords = useMemo(
    () =>
      invoices
        .filter((invoice) => !isCollectibleInvoice(invoice, confirmedPayments))
        .sort((a, b) => getFinanceRecordTime(b) - getFinanceRecordTime(a)),
    [invoices, confirmedPayments]
  );

  const sortedPayments = useMemo(
    () =>
      [...payments].sort(
        (a, b) => getFinanceRecordTime(b) - getFinanceRecordTime(a)
      ),
    [payments]
  );

  const pendingReceiptRecords = useMemo(
    () =>
      receipts
        .filter((receipt) => normalize(receipt.status) === "pending_review")
        .sort((a, b) => getFinanceRecordTime(b) - getFinanceRecordTime(a)),
    [receipts]
  );

  const reviewedReceiptRecords = useMemo(
    () =>
      receipts
        .filter((receipt) => normalize(receipt.status) !== "pending_review")
        .sort((a, b) => getFinanceRecordTime(b) - getFinanceRecordTime(a)),
    [receipts]
  );

  const openPaymentRequestRecords = useMemo(
    () =>
      paymentRequests
        .filter((request) =>
          ["pending", "sent", "open", "requested", "active"].includes(
            normalize(request.status || "pending")
          )
        )
        .sort((a, b) => getFinanceRecordTime(b) - getFinanceRecordTime(a)),
    [paymentRequests]
  );

  const closedPaymentRequestRecords = useMemo(
    () =>
      paymentRequests
        .filter((request) =>
          ["completed", "cancelled", "canceled"].includes(
            normalize(request.status || "")
          )
        )
        .sort((a, b) => getFinanceRecordTime(b) - getFinanceRecordTime(a)),
    [paymentRequests]
  );

  const latestFinanceActivity = useMemo(() => {
    const activity = [];

    invoices.forEach((invoice) => {
      activity.push({
        id: `invoice-${invoice.id}`,
        type: "Invoice",
        title: invoice.title || invoice.invoice_number || "Student invoice",
        status: getEffectiveInvoiceStatus(invoice, confirmedPayments),
        amount: Number(invoice.total_amount ?? invoice.amount ?? 0),
        currency: invoice.currency || "PKR",
        time:
          invoice.updated_at ||
          invoice.issued_at ||
          invoice.created_at ||
          invoice.due_date ||
          null,
      });
    });

    payments.forEach((payment) => {
      activity.push({
        id: `payment-${payment.id}`,
        type: "Payment",
        title: payment.reference || payment.payment_method || "Payment record",
        status: payment.status || "confirmed",
        amount: Number(payment.amount || 0),
        currency: payment.currency || "PKR",
        time: payment.updated_at || payment.paid_at || payment.created_at || null,
      });
    });

    receipts.forEach((receipt) => {
      activity.push({
        id: `receipt-${receipt.id}`,
        type: "Receipt",
        title: receipt.file_name || "Student receipt",
        status: receipt.status || "pending_review",
        amount: Number(receipt.amount || 0),
        currency: receipt.currency || "PKR",
        time:
          receipt.reviewed_at ||
          receipt.updated_at ||
          receipt.submitted_at ||
          receipt.created_at ||
          null,
      });
    });

    paymentRequests.forEach((request) => {
      activity.push({
        id: `request-${request.id}`,
        type: "Payment Request",
        title: request.title || request.category || "Payment request",
        status: request.status || "pending",
        amount: Number(request.amount || 0),
        currency: request.currency || "PKR",
        time: request.updated_at || request.requested_at || request.created_at || null,
      });
    });

    return activity
      .sort((a, b) => {
        const aTime = a.time ? new Date(a.time).getTime() : 0;
        const bTime = b.time ? new Date(b.time).getTime() : 0;
        return bTime - aTime;
      })
      .slice(0, 4);
  }, [invoices, payments, receipts, paymentRequests, confirmedPayments]);

  const latestPaymentId = sortedPayments[0]?.id || null;

  const completedFinanceCount = useMemo(() => {
    const settledInvoices = invoices.filter(
      (invoice) =>
        ["paid", "cancelled", "void"].includes(
          getEffectiveInvoiceStatus(invoice, confirmedPayments)
        )
    ).length;

    const reviewedReceipts = receipts.filter(
      (receipt) => normalize(receipt.status) !== "pending_review"
    ).length;

    return (
      settledInvoices +
      confirmedPayments.length +
      reviewedReceipts +
      closedPaymentRequestRecords.length
    );
  }, [
    invoices,
    receipts,
    confirmedPayments,
    closedPaymentRequestRecords,
  ]);

  const financePriority = useMemo(() => {
    if (pendingReceiptRecords.length) {
      return {
        tone: "warning",
        eyebrow: "Review now",
        title: `${pendingReceiptRecords.length} receipt${
          pendingReceiptRecords.length === 1 ? "" : "s"
        } waiting`,
        detail:
          "Verify the newest student proof first. Approve only when the amount, currency and invoice match.",
      };
    }

    const overdue = openInvoiceRecords.filter((invoice) =>
      isInvoiceOverdue(invoice, confirmedPayments)
    );

    if (overdue.length) {
      return {
        tone: "danger",
        eyebrow: "Recovery",
        title: `${overdue.length} overdue invoice${overdue.length === 1 ? "" : "s"}`,
        detail:
          "Outstanding money is already past due. Confirm the payment plan or contact the student.",
      };
    }

    if (openInvoiceRecords.length) {
      return {
        tone: "warning",
        eyebrow: "Collection",
        title: `${openInvoiceRecords.length} open invoice${
          openInvoiceRecords.length === 1 ? "" : "s"
        }`,
        detail:
          "No receipt is waiting right now. Keep the invoice open until linked money is confirmed.",
      };
    }

    if (openPaymentRequestRecords.length) {
      return {
        tone: "warning",
        eyebrow: "Student request",
        title: `${openPaymentRequestRecords.length} payment request${
          openPaymentRequestRecords.length === 1 ? "" : "s"
        } open`,
        detail:
          "The student still has an active payment request. Confirm the next action before closing Finance.",
      };
    }

    return {
      tone: "success",
      eyebrow: "Reconciled",
      title: "No finance blocker",
      detail:
        "Invoices are settled and no receipt is waiting for review. The ledger is currently clear.",
    };
  }, [
    pendingReceiptRecords,
    openInvoiceRecords,
    openPaymentRequestRecords,
    confirmedPayments,
  ]);

  function showMessage(text, tone = "info") {
    setMessage(text);
    setMessageTone(tone);
  }

  async function reconcileInvoiceFromLedger(invoiceId) {
    if (!invoiceId) return null;

    const [
      { data: invoiceRow, error: invoiceError },
      { data: paymentRows, error: paymentError },
    ] = await Promise.all([
      supabase
        .from("student_invoices")
        .select("*")
        .eq("id", invoiceId)
        .maybeSingle(),
      supabase
        .from("student_payments")
        .select("id, invoice_id, amount, currency, status")
        .eq("invoice_id", invoiceId)
        .eq("status", "confirmed"),
    ]);

    if (invoiceError) throw invoiceError;
    if (paymentError) throw paymentError;
    if (!invoiceRow) return null;

    const total = Math.max(
      0,
      Number(invoiceRow.total_amount ?? invoiceRow.amount ?? 0)
    );
    const currency = String(invoiceRow.currency || "PKR").toUpperCase();
    const paid = (Array.isArray(paymentRows) ? paymentRows : []).reduce(
      (sum, payment) => {
        const paymentCurrency = String(
          payment?.currency || currency
        ).toUpperCase();
        if (paymentCurrency !== currency) return sum;
        return sum + Math.max(0, Number(payment?.amount || 0));
      },
      0
    );
    const outstanding = Math.max(0, total - paid);
    const storedStatus = normalize(invoiceRow.status || "unpaid");

    let status = storedStatus;
    if (!["cancelled", "void", "refunded"].includes(storedStatus)) {
      if (total > 0 && outstanding <= 0) {
        status = "paid";
      } else if (paid > 0) {
        status = "partial";
      } else if (invoiceRow.due_date) {
        const due = new Date(invoiceRow.due_date);
        due.setHours(23, 59, 59, 999);
        status =
          !Number.isNaN(due.getTime()) && due < new Date()
            ? "overdue"
            : "unpaid";
      } else {
        status = "unpaid";
      }
    }

    const currentPaid = Math.max(0, Number(invoiceRow.paid_amount ?? 0));
    const currentOutstanding = Number(invoiceRow.outstanding_amount);
    const needsRepair =
      currentPaid !== paid ||
      !Number.isFinite(currentOutstanding) ||
      Math.max(0, currentOutstanding) !== outstanding ||
      normalize(invoiceRow.status || "") !== status;

    if (!needsRepair) return invoiceRow;

    const { data: repaired, error: repairError } = await supabase
      .from("student_invoices")
      .update({
        paid_amount: paid,
        outstanding_amount: outstanding,
        status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", invoiceId)
      .select("*")
      .maybeSingle();

    if (repairError) throw repairError;
    return repaired || invoiceRow;
  }

  async function reconcileVisibleInvoices() {
    const ids = Array.from(
      new Set(invoices.map((invoice) => invoice?.id).filter(Boolean))
    );

    if (!ids.length) return;

    const results = await Promise.allSettled(
      ids.map((invoiceId) => reconcileInvoiceFromLedger(invoiceId))
    );

    results.forEach((result) => {
      if (result.status === "rejected") {
        console.warn(
          "Finance invoice reconciliation skipped:",
          result.reason?.message || result.reason
        );
      }
    });
  }

  async function refreshAll({ reconcile = true } = {}) {
    if (reconcile) {
      await reconcileVisibleInvoices();
    }
    await onSharedDataChange();
  }

  async function createTimeline(title, description, metadata = {}) {
    try {
      await addTimelineEvent({
        studentId,
        studentType: safeStudentType,
        actionType: "payment_event",
        title,
        description,
        adminProfile,
        metadata,
      });
    } catch (error) {
      console.warn("Finance timeline event skipped:", error?.message || error);
    }
  }

  async function loadPaymentAccounts() {
    setAccountLoading(true);

    try {
      const { data, error } = await supabase
        .from("payment_accounts")
        .select("*")
        .order("is_active", { ascending: false })
        .order("created_at", { ascending: false });

      if (error) throw error;
      setPaymentAccounts(Array.isArray(data) ? data : []);
    } catch (error) {
      console.warn("Payment accounts could not load:", error?.message || error);
      setPaymentAccounts([]);
    } finally {
      setAccountLoading(false);
    }
  }


  function applyPaymentAccountPreset(preset) {
    if (!preset) return;

    setAccountForm({
      account_type: preset.account_type || "bank",
      account_title: preset.account_title || "",
      bank_name: preset.bank_name || "",
      account_number: preset.account_number || "",
      iban: preset.iban || "",
      mobile_wallet_number: preset.mobile_wallet_number || "",
      instructions: preset.instructions || "",
      is_active: true,
    });

    showMessage(`${preset.label} details loaded into the payment-account form. Review them, then save the account.`, "info");
  }

  useEffect(() => {
    loadPaymentAccounts();
  }, []);

  useEffect(() => {
    if (paymentForm.invoice_id || collectibleInvoices.length !== 1) return;

    setPaymentForm((previous) => ({
      ...previous,
      invoice_id: String(collectibleInvoices[0].id),
      amount: "",
    }));
  }, [paymentForm.invoice_id, collectibleInvoices]);

  useEffect(() => {
    if (!paymentForm.invoice_id) return;

    const invoice = invoices.find(
      (item) => String(item.id) === String(paymentForm.invoice_id)
    );

    if (!invoice) return;

    setPaymentForm((previous) => ({
      ...previous,
      currency: invoice.currency || "PKR",
      amount: String(getInvoiceOutstanding(invoice, confirmedPayments) || ""),
    }));
  }, [paymentForm.invoice_id, invoices, confirmedPayments]);

  async function queueProtectedChange(preview, execute) {
    if (!preview) {
      return execute();
    }

    setPendingNotification({
      preview,
      previewToken: null,
      expiresAt: null,
      execute,
      preparing: Boolean(preview.sendable),
      preparationError: "",
    });

    if (!preview.sendable) return true;

    void prepareStudentNotification(preview)
      .then((prepared) => {
        setPendingNotification((current) =>
          current?.preview === preview
            ? {
                ...current,
                ...prepared,
                preparing: false,
                preparationError: "",
              }
            : current
        );
      })
      .catch((error) => {
        setPendingNotification((current) =>
          current?.preview === preview
            ? {
                ...current,
                preparing: false,
                preparationError:
                  error?.message ||
                  "Student notification security preparation failed.",
              }
            : current
        );
      });

    return true;
  }

  async function confirmProtectedChange(confirmationText = "") {
    const pending = pendingNotification;
    if (
      !pending ||
      notificationBusy ||
      pending.preparing ||
      pending.preparationError
    ) return;

    setNotificationBusy(true);
    setMessage("");

    try {
      const mutationResult = await pending.execute();

      if (mutationResult === false) {
        return;
      }

      let deliveryNote = "";

      if (pending.preview?.sendable) {
        const delivery = await sendPreparedStudentNotification({
          preview: pending.preview,
          previewToken: pending.previewToken,
          confirmationText,
        });

        if (delivery?.communicationWarning) {
          deliveryNote = ` ${delivery.communicationWarning}`;
        }
      }

      setPendingNotification(null);

      showMessage(
        pending.preview?.sendable
          ? `Change saved and student email sent.${deliveryNote}`
          : "Change saved. No usable student email was available, so no email was sent.",
        pending.preview?.sendable ? "success" : "warning"
      );
    } catch (error) {
      showMessage(
        error?.message ||
          "The finance change or student notification could not be completed.",
        "error"
      );
    } finally {
      setNotificationBusy(false);
    }
  }

  async function handleCreateInvoice(event) {
    event.preventDefault();
    if (!studentId) return;

    setInvoiceSaving(true);
    setMessage("");

    try {
      const amount = Number(invoiceForm.amount || 0);
      if (amount <= 0) throw new Error("Enter a valid invoice amount.");

      const confirmed = window.confirm(
        `Create this invoice?\n\nStudent: ${studentName}\nTitle: ${
          invoiceForm.title || "Student Invoice"
        }\nAmount: ${formatMoney(amount, invoiceForm.currency)}\nDue: ${
          invoiceForm.due_date || "No due date"
        }`
      );

      if (!confirmed) return;

      const payload = {
        student_id: studentId,
        student_type: safeStudentType,
        title: invoiceForm.title.trim() || "Student Invoice",
        description: invoiceForm.description.trim() || null,
        category: invoiceForm.category || "general",
        amount,
        discount_amount: 0,
        tax_amount: 0,
        currency: String(invoiceForm.currency || "PKR").toUpperCase(),
        status: "unpaid",
        due_date: invoiceForm.due_date || null,
        created_by: adminProfile?.id || null,
        metadata: {
          created_from: "admin_payment_center",
        },
      };

      const { data, error } = await supabase
        .from("student_invoices")
        .insert(payload)
        .select("*")
        .single();

      if (error) throw error;

      if (data?.id) {
        try {
          await reconcileInvoiceFromLedger(data.id);
        } catch (reconcileError) {
          console.warn(
            "New invoice reconciliation skipped:",
            reconcileError?.message || reconcileError
          );
        }
      }

      await createTimeline(
        "Invoice Created",
        `${payload.title} created for ${formatMoney(
          data?.total_amount ?? amount,
          payload.currency
        )}.`,
        {
          invoice_id: data?.id || null,
          invoice_number: data?.invoice_number || null,
          amount,
          currency: payload.currency,
        }
      );

      setInvoiceForm((previous) => ({
        ...previous,
        amount: "",
        due_date: "",
        description: "",
      }));

      showMessage("Invoice created successfully.", "success");
      await refreshAll();
    } catch (error) {
      showMessage(error?.message || "Invoice could not be created.", "error");
    } finally {
      setInvoiceSaving(false);
    }
  }

  async function handleAddPayment(event) {
    event.preventDefault();
    if (!studentId || paymentSaving || notificationBusy) return;

    setMessage("");

    try {
      const amount = Number(paymentForm.amount || 0);
      if (amount <= 0) throw new Error("Enter a valid payment amount.");

      const invoice = invoices.find(
        (item) => String(item.id) === String(paymentForm.invoice_id)
      );

      if (invoice) {
        const invoiceCurrency = String(invoice.currency || "PKR").toUpperCase();
        const paymentCurrency = String(paymentForm.currency || "PKR").toUpperCase();
        const outstanding = getInvoiceOutstanding(invoice, confirmedPayments);

        if (!isCollectibleInvoice(invoice, confirmedPayments)) {
          throw new Error("This invoice is already settled, cancelled, or void.");
        }

        if (invoiceCurrency !== paymentCurrency) {
          throw new Error(
            `This invoice is in ${invoiceCurrency}. Linked payments must use ${invoiceCurrency}.`
          );
        }

        if (amount > outstanding) {
          throw new Error(
            `Payment exceeds the invoice outstanding balance of ${formatMoney(
              outstanding,
              invoiceCurrency
            )}. Record any extra money as a separate general payment instead.`
          );
        }
      }

      const payload = {
        student_id: studentId,
        student_type: safeStudentType,
        invoice_id: paymentForm.invoice_id || null,
        amount,
        currency: String(paymentForm.currency || "PKR").toUpperCase(),
        payment_method: paymentForm.payment_method || "cash",
        reference: paymentForm.reference.trim() || null,
        notes: paymentForm.notes.trim() || null,
        status: "confirmed",
        paid_at: new Date().toISOString(),
        received_by: adminProfile?.id || null,
        metadata: {
          created_from: "admin_payment_center",
        },
      };

      const preview = buildStudentNotification({
        domain: "finance",
        action: "payment_confirmed",
        student,
        entity: payload,
        next: payload,
        context: {
          amount,
          currency: payload.currency,
          invoiceLinked: Boolean(invoice),
          invoiceNumber: invoice?.invoice_number || "",
          invoiceTitle: invoice?.title || "",
        },
        relatedType: "payment",
      });

      await queueProtectedChange(preview, async () => {
        setPaymentSaving(true);

        try {
          const { data, error } = await supabase
            .from("student_payments")
            .insert(payload)
            .select("*")
            .single();

          if (error) throw error;

          if (payload.invoice_id) {
            await reconcileInvoiceFromLedger(payload.invoice_id);
          }

          await createTimeline(
            "Payment Confirmed",
            `${formatMoney(amount, payload.currency)} payment recorded.`,
            {
              payment_id: data?.id || null,
              invoice_id: payload.invoice_id,
              amount,
              currency: payload.currency,
              method: payload.payment_method,
            }
          );

          setPaymentForm({
            invoice_id: "",
            amount: "",
            currency: "PKR",
            payment_method: "cash",
            reference: "",
            notes: "",
          });

          await refreshAll();
          return true;
        } finally {
          setPaymentSaving(false);
        }
      });
    } catch (error) {
      showMessage(error?.message || "Payment could not be recorded.", "error");
    }
  }

  async function changePaymentStatus(payment, nextStatus) {
    const current = normalize(payment.status);
    const cleanNext = normalize(nextStatus);

    if (current === cleanNext || actionSavingId || notificationBusy) return;

    const previewActionMap = {
      refunded: "payment_refunded",
      cancelled: "payment_cancelled",
      failed: "payment_failed",
      confirmed: "payment_confirmed",
    };

    const previewAction = previewActionMap[cleanNext] || "";

    const preview = previewAction
      ? buildStudentNotification({
          domain: "finance",
          action: previewAction,
          student,
          entity: payment,
          previous: payment,
          next: { ...payment, status: cleanNext },
          context: {
            amount: payment.amount,
            currency: payment.currency,
            invoiceLinked: Boolean(payment.invoice_id),
          },
          relatedType: "payment",
          relatedId: payment.id,
        })
      : null;

    const execute = async () => {
      setActionSavingId(payment.id);

      try {
        const { error } = await supabase
          .from("student_payments")
          .update({
            status: cleanNext,
            updated_at: new Date().toISOString(),
          })
          .eq("id", payment.id);

        if (error) throw error;

        if (payment.invoice_id) {
          await reconcileInvoiceFromLedger(payment.invoice_id);
        }

        await createTimeline(
          `Payment ${cleanNext.replaceAll("_", " ")}`,
          `${formatMoney(
            payment.amount,
            payment.currency
          )} payment changed from ${payment.status || "unknown"} to ${cleanNext}.`,
          {
            payment_id: payment.id,
            invoice_id: payment.invoice_id || null,
            previous_status: payment.status || null,
            status: cleanNext,
          }
        );

        await refreshAll();
        return true;
      } finally {
        setActionSavingId(null);
      }
    };

    if (preview) {
      await queueProtectedChange(preview, execute);
      return;
    }

    const labels = {
      refunded:
        "Mark this payment as refunded? It will stop counting toward the invoice balance.",
      cancelled:
        "Cancel this payment? It will stop counting toward the invoice balance.",
      confirmed:
        "Restore this payment to confirmed? It will count toward the invoice again.",
      failed:
        "Mark this payment as failed? It will stop counting toward the invoice balance.",
    };

    if (!window.confirm(labels[cleanNext] || `Change payment to ${cleanNext}?`)) {
      return;
    }

    try {
      await execute();
      showMessage(
        `Payment marked ${cleanNext.replaceAll("_", " ")}. Invoice totals were recalculated automatically.`,
        "success"
      );
    } catch (error) {
      showMessage(error?.message || "Payment status could not be changed.", "error");
    }
  }

  async function changePaymentRequestStatus(request, nextStatus) {
    const current = normalize(request?.status || "pending");
    const cleanNext = normalize(nextStatus);

    if (
      !request?.id ||
      current === cleanNext ||
      actionSavingId ||
      notificationBusy
    ) {
      return;
    }

    if (!["pending", "sent", "completed", "cancelled"].includes(cleanNext)) {
      showMessage("Unsupported payment-request status.", "error");
      return;
    }

    const wording =
      cleanNext === "completed"
        ? "Resolve this payment request? This closes the request only. It does NOT create a payment, change Paid, or reduce any invoice balance."
        : cleanNext === "cancelled"
          ? "Cancel this payment request? It will move to request history and will not affect money totals."
          : cleanNext === "pending"
            ? "Reopen this payment request? It will return to the active coordination queue."
            : "Mark this payment request as sent? It remains open until completed or cancelled.";

    if (!window.confirm(wording)) return;

    const now = new Date().toISOString();
    const actorId =
      adminProfile?.id ||
      adminProfile?.user_id ||
      adminProfile?.profile_id ||
      null;
    const previousMetadata =
      request?.metadata && typeof request.metadata === "object" && !Array.isArray(request.metadata)
        ? request.metadata
        : {};

    setActionSavingId(request.id);
    setMessage("");

    try {
      const { error } = await supabase
        .from("counselor_payment_requests")
        .update({
          status: cleanNext,
          metadata: {
            ...previousMetadata,
            lifecycle_status: cleanNext,
            lifecycle_updated_at: now,
            lifecycle_updated_by: actorId,
            resolved_at:
              cleanNext === "completed" || cleanNext === "cancelled"
                ? now
                : null,
            resolved_by:
              cleanNext === "completed" || cleanNext === "cancelled"
                ? actorId
                : null,
          },
          updated_at: now,
        })
        .eq("id", request.id);

      if (error) throw error;

      await createTimeline(
        `Payment Request ${cleanNext.replaceAll("_", " ")}`,
        `${request.title || "Payment Request"} changed from ${
          request.status || "pending"
        } to ${cleanNext}. This request status change did not create or modify a payment.`,
        {
          payment_request_id: request.id,
          invoice_id: request.invoice_id || null,
          previous_status: request.status || "pending",
          status: cleanNext,
          amount: Number(request.amount || 0),
          currency: request.currency || "PKR",
          money_effect: "none",
        }
      );

      showMessage(
        cleanNext === "completed"
          ? "Payment request resolved. No payment or invoice balance was changed."
          : cleanNext === "cancelled"
            ? "Payment request cancelled and moved to history."
            : cleanNext === "pending"
              ? "Payment request reopened."
              : "Payment request marked sent.",
        "success"
      );

      await refreshAll();
    } catch (error) {
      showMessage(
        error?.message || "Payment request status could not be changed.",
        "error"
      );
    } finally {
      setActionSavingId(null);
    }
  }

  async function deletePayment(payment) {
    const currentStatus = normalize(payment.status);

    if (!["pending", "failed", "cancelled"].includes(currentStatus)) {
      showMessage(
        "Confirmed/refunded finance records should not normally be deleted. Change their status instead so the audit trail remains intact.",
        "warning"
      );
      return;
    }

    const confirmed = window.confirm(
      `Permanently delete this payment record?\n\n${formatMoney(
        payment.amount,
        payment.currency
      )}\nStatus: ${payment.status}\n\nUse permanent deletion only for an accidental/test record.`
    );

    if (!confirmed) return;

    setActionSavingId(payment.id);
    setMessage("");

    try {
      const { error } = await supabase
        .from("student_payments")
        .delete()
        .eq("id", payment.id);

      if (error) throw error;

      await createTimeline(
        "Payment Record Deleted",
        "An accidental/test payment record was permanently deleted.",
        {
          payment_id: payment.id,
          invoice_id: payment.invoice_id || null,
          amount: payment.amount,
          currency: payment.currency,
        }
      );

      showMessage("Accidental payment record deleted.", "success");
      await refreshAll();
    } catch (error) {
      showMessage(error?.message || "Payment could not be deleted.", "error");
    } finally {
      setActionSavingId(null);
    }
  }

  async function changeInvoiceStatus(invoice, nextStatus) {
    const current = normalize(invoice.status);
    const cleanNext = normalize(nextStatus);

    if (current === cleanNext || actionSavingId || notificationBusy) return;

    const execute = async () => {
      setActionSavingId(invoice.id);

      try {
        const { error } = await supabase
          .from("student_invoices")
          .update({
            status: cleanNext,
            updated_at: new Date().toISOString(),
          })
          .eq("id", invoice.id);

        if (error) throw error;

        await createTimeline(
          `Invoice ${cleanNext.replaceAll("_", " ")}`,
          `${invoice.invoice_number || invoice.title || "Invoice"} changed from ${
            invoice.status || "unknown"
          } to ${cleanNext}.`,
          {
            invoice_id: invoice.id,
            previous_status: invoice.status || null,
            status: cleanNext,
          }
        );

        await refreshAll();
        return true;
      } finally {
        setActionSavingId(null);
      }
    };

    if (cleanNext === "cancelled") {
      const preview = buildStudentNotification({
        domain: "finance",
        action: "invoice_cancelled",
        student,
        entity: invoice,
        previous: invoice,
        next: { ...invoice, status: cleanNext },
        context: {
          amount: invoice.total_amount ?? invoice.amount,
          currency: invoice.currency,
          invoiceNumber: invoice.invoice_number || "",
          invoiceTitle: invoice.title || "",
        },
        relatedType: "invoice",
        relatedId: invoice.id,
      });

      await queueProtectedChange(preview, execute);
      return;
    }

    const wording =
      cleanNext === "void"
        ? "Void this invoice? Use this only when the invoice should never have been collectible. No student email will be sent for this internal correction."
        : "Restore this invoice to unpaid? Database reconciliation will determine the correct status after future payment activity.";

    if (!window.confirm(wording)) return;

    try {
      await execute();
      showMessage(`Invoice marked ${cleanNext}.`, "success");
    } catch (error) {
      showMessage(error?.message || "Invoice status could not be changed.", "error");
    }
  }

  async function deleteInvoice(invoice) {
    const status = normalize(invoice.status);
    const paid = Number(invoice.paid_amount || 0);

    if (paid > 0 || ["paid", "partial"].includes(status)) {
      showMessage(
        "This invoice has payment history, so permanent deletion is blocked here. Cancel or void it instead.",
        "warning"
      );
      return;
    }

    const confirmed = window.confirm(
      `Permanently delete this invoice?\n\n${
        invoice.invoice_number || invoice.title || "Invoice"
      }\n${formatMoney(
        invoice.total_amount ?? invoice.amount,
        invoice.currency
      )}\n\nOnly use this for an accidental/test invoice with no payment history.`
    );

    if (!confirmed) return;

    setActionSavingId(invoice.id);
    setMessage("");

    try {
      const { error } = await supabase
        .from("student_invoices")
        .delete()
        .eq("id", invoice.id);

      if (error) throw error;

      await createTimeline(
        "Invoice Record Deleted",
        "An accidental/test invoice with no payment history was permanently deleted.",
        {
          invoice_id: invoice.id,
          invoice_number: invoice.invoice_number || null,
        }
      );

      showMessage("Accidental invoice deleted.", "success");
      await refreshAll();
    } catch (error) {
      showMessage(error?.message || "Invoice could not be deleted.", "error");
    } finally {
      setActionSavingId(null);
    }
  }

  async function updateReceiptStatus(receipt, nextStatus) {
    const current = normalize(receipt.status);
    const cleanNext = normalize(nextStatus);

    if (current === "converted_to_payment") {
      showMessage(
        "This receipt has already been converted into a payment and cannot be reviewed again.",
        "warning"
      );
      return;
    }

    if (!["pending_review", "approved", "rejected"].includes(current)) {
      showMessage("This receipt is not in a reviewable state.", "warning");
      return;
    }

    if (cleanNext === "approved" && Number(receipt.amount || 0) <= 0) {
      showMessage("Receipt amount must be greater than zero before approval.", "error");
      return;
    }

    const invoice = invoices.find(
      (item) => String(item.id) === String(receipt.invoice_id)
    );

    if (
      cleanNext === "approved" &&
      invoice &&
      String(invoice.currency || "PKR").toUpperCase() !==
        String(receipt.currency || "PKR").toUpperCase()
    ) {
      showMessage(
        `Receipt currency (${receipt.currency}) does not match invoice currency (${invoice.currency}).`,
        "error"
      );
      return;
    }

    if (cleanNext === "approved" && invoice && !isCollectibleInvoice(invoice, confirmedPayments)) {
      showMessage(
        "The linked invoice is already settled, cancelled, or void. Review the receipt before creating a payment.",
        "error"
      );
      return;
    }

    if (
      cleanNext === "approved" &&
      invoice &&
      Number(receipt.amount || 0) > getInvoiceOutstanding(invoice, confirmedPayments)
    ) {
      showMessage(
        `Receipt amount exceeds the linked invoice balance of ${formatMoney(
          getInvoiceOutstanding(invoice, confirmedPayments),
          invoice.currency
        )}.`,
        "error"
      );
      return;
    }

    const preview = buildStudentNotification({
      domain: "finance",
      action: cleanNext === "approved" ? "receipt_approved" : "receipt_rejected",
      student,
      entity: receipt,
      previous: receipt,
      next: { ...receipt, status: cleanNext },
      context: {
        amount: receipt.amount,
        currency: receipt.currency,
        invoiceLinked: Boolean(receipt.invoice_id),
        invoiceNumber: invoice?.invoice_number || "",
        invoiceTitle: invoice?.title || "",
      },
      relatedType: "receipt",
      relatedId: receipt.id,
    });

    await queueProtectedChange(preview, async () => {
      setReceiptSavingId(receipt.id);

      try {
        const reviewedAt = new Date().toISOString();

        if (cleanNext === "rejected") {
          const { error } = await supabase
            .from("student_receipts")
            .update({
              status: "rejected",
              reviewed_by: adminProfile?.id || null,
              reviewed_at: reviewedAt,
              updated_at: reviewedAt,
            })
            .eq("id", receipt.id);

          if (error) throw error;

          await createTimeline("Receipt Rejected", "Student receipt was rejected.", {
            receipt_id: receipt.id,
          });

          await refreshAll();
          return true;
        }

        const existing = await supabase
          .from("student_payments")
          .select("id")
          .eq("payment_method", "receipt_upload")
          .eq("metadata->>receipt_id", String(receipt.id))
          .maybeSingle();

        if (existing.error) throw existing.error;

        let paymentId = existing.data?.id || null;

        if (!paymentId) {
          const { data: paymentData, error: paymentError } = await supabase
            .from("student_payments")
            .insert({
              student_id: receipt.student_id || studentId,
              student_type: receipt.student_type || safeStudentType,
              invoice_id: receipt.invoice_id || null,
              amount: Number(receipt.amount || 0),
              currency: String(receipt.currency || "PKR").toUpperCase(),
              payment_method: "receipt_upload",
              reference: receipt.file_name || null,
              notes: receipt.notes || null,
              status: "confirmed",
              paid_at: reviewedAt,
              received_by: adminProfile?.id || null,
              metadata: {
                receipt_id: String(receipt.id),
                auto_created_from_receipt: true,
              },
            })
            .select("id")
            .single();

          if (paymentError) throw paymentError;
          paymentId = paymentData?.id || null;
        }

        const { error: receiptError } = await supabase
          .from("student_receipts")
          .update({
            status: "converted_to_payment",
            reviewed_by: adminProfile?.id || null,
            reviewed_at: reviewedAt,
            updated_at: reviewedAt,
          })
          .eq("id", receipt.id);

        if (receiptError) throw receiptError;

        await createTimeline(
          "Receipt Converted to Payment",
          `${formatMoney(
            receipt.amount,
            receipt.currency
          )} receipt approved and converted into a confirmed payment.`,
          {
            receipt_id: receipt.id,
            payment_id: paymentId,
            invoice_id: receipt.invoice_id || null,
            amount: receipt.amount,
            currency: receipt.currency,
          }
        );

        await refreshAll();
        return true;
      } finally {
        setReceiptSavingId(null);
      }
    });
  }

  async function handleSavePaymentAccount(event) {
    event.preventDefault();

    setAccountSaving(true);
    setMessage("");

    try {
      if (!accountForm.account_title.trim()) {
        throw new Error("Account title is required.");
      }

      const duplicateDestination = paymentAccounts.some((account) => {
        if (normalize(account.account_type) !== normalize(accountForm.account_type)) {
          return false;
        }

        const sameAccountNumber =
          accountForm.account_number.trim() &&
          String(account.account_number || "").trim() === accountForm.account_number.trim();
        const sameIban =
          accountForm.iban.trim() &&
          String(account.iban || "").trim().toUpperCase() ===
            accountForm.iban.trim().toUpperCase();
        const sameWallet =
          accountForm.mobile_wallet_number.trim() &&
          String(account.mobile_wallet_number || "").trim() ===
            accountForm.mobile_wallet_number.trim();

        return Boolean(sameAccountNumber || sameIban || sameWallet);
      });

      if (duplicateDestination) {
        throw new Error(
          "This payment destination is already configured. Activate the existing record instead of creating a duplicate."
        );
      }

      const confirmed = window.confirm(
        `Save payment account?\n\n${accountForm.account_title}\nType: ${accountForm.account_type}`
      );
      if (!confirmed) return;

      const { error } = await supabase.from("payment_accounts").insert({
        account_type: accountForm.account_type || "bank",
        account_title: accountForm.account_title.trim(),
        bank_name: accountForm.bank_name.trim() || null,
        account_number: accountForm.account_number.trim() || null,
        iban: accountForm.iban.trim() || null,
        mobile_wallet_number:
          accountForm.mobile_wallet_number.trim() || null,
        instructions: accountForm.instructions.trim() || null,
        is_active: Boolean(accountForm.is_active),
        created_by: adminProfile?.id || null,
      });

      if (error) throw error;

      setAccountForm({
        account_type: "bank",
        account_title: "",
        bank_name: "",
        account_number: "",
        iban: "",
        mobile_wallet_number: "",
        instructions: "",
        is_active: true,
      });

      showMessage("Payment account saved.", "success");
      await loadPaymentAccounts();
    } catch (error) {
      showMessage(error?.message || "Payment account could not be saved.", "error");
    } finally {
      setAccountSaving(false);
    }
  }

  async function togglePaymentAccount(account) {
    setAccountSaving(true);
    setMessage("");

    try {
      const nextActive = !account.is_active;

      const { error } = await supabase
        .from("payment_accounts")
        .update({
          is_active: nextActive,
          updated_at: new Date().toISOString(),
        })
        .eq("id", account.id);

      if (error) throw error;

      showMessage(
        nextActive ? "Payment account activated." : "Payment account deactivated.",
        "success"
      );
      await loadPaymentAccounts();
    } catch (error) {
      showMessage(
        error?.message || "Payment account status could not be changed.",
        "error"
      );
    } finally {
      setAccountSaving(false);
    }
  }

  async function deletePaymentAccount(account) {
    if (account.is_active) {
      showMessage(
        "Deactivate this payment account before permanent deletion. This prevents an active collection destination from disappearing by mistake.",
        "warning"
      );
      return;
    }

    if (
      !window.confirm(
        `Delete "${account.account_title}" permanently?\n\nOnly delete an account created by mistake. Otherwise keep it deactivated.`
      )
    ) {
      return;
    }

    setAccountSaving(true);
    setMessage("");

    try {
      const { error } = await supabase
        .from("payment_accounts")
        .delete()
        .eq("id", account.id);

      if (error) throw error;

      showMessage("Payment account deleted.", "success");
      await loadPaymentAccounts();
    } catch (error) {
      showMessage(error?.message || "Payment account could not be deleted.", "error");
    } finally {
      setAccountSaving(false);
    }
  }

  const messageStyles = {
    success: "border-emerald-300 bg-emerald-50 text-emerald-900",
    error: "border-red-300 bg-red-50 text-red-900",
    warning: "border-amber-300 bg-amber-50 text-amber-900",
    info: "border-blue-300 bg-blue-50 text-blue-900",
  };

  return (
    <div className="min-w-0 space-y-5 rounded-[2.25rem] border-[4px] border-[#123865] bg-[#FFF8EF] p-3 pb-8 text-[#10233F] shadow-[0_24px_65px_rgba(18,56,101,0.15)] sm:p-4 sm:pb-8 lg:p-5 lg:pb-8">
      <section className="min-w-0 overflow-hidden rounded-[1.8rem] border-[3px] border-[#FF5A0A] bg-white shadow-[0_18px_50px_rgba(18,56,101,0.11)]">
        <div className="grid min-w-0 gap-0 lg:grid-cols-[minmax(0,1.32fr)_minmax(20rem,0.68fr)]">
          <div className="min-w-0 bg-[#123865] p-5 text-white sm:p-6 lg:p-7">
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <Badge text="FINANCE OS" tone="orange" />
              <Badge text={safeStudentType.toUpperCase()} tone="navy" />
              <span className="rounded-xl border border-white/25 bg-white/10 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.14em] text-white">
                Reconciled Ledger
              </span>
            </div>

            <h2 className="mt-4 max-w-4xl break-words text-3xl font-black leading-tight tracking-[-0.035em] text-white sm:text-4xl">
              Student Finance Command Center
            </h2>
            <p className="mt-3 max-w-3xl break-words text-sm font-semibold leading-6 text-slate-100">
              One authoritative financial record for {studentName}: invoices, confirmed
              money, outstanding balances, receipt verification and approved collection
              destinations.
            </p>
          </div>

          <div className="min-w-0 border-t-[3px] border-[#FF5A0A] bg-[#FF5A0A] p-5 text-white sm:p-6 lg:border-l-[3px] lg:border-t-0 lg:p-7">
            <p className="text-[9px] font-black uppercase tracking-[0.16em] text-white">
              Finance Command Actions
            </p>
            <p className="mt-2 text-sm font-semibold leading-6 text-orange-50">
              Notify the student or refresh the reconciled invoice, payment and receipt ledger.
            </p>

            <div className="mt-4 grid min-w-0 gap-2">
              <StudentNotificationComposer
                student={student}
                context="payment"
                buttonLabel="Send Payment Update"
                compact
              />

              <button
                type="button"
                onClick={refreshAll}
                className="inline-flex min-h-11 w-full items-center justify-center rounded-xl border-2 border-white bg-white px-4 py-2.5 text-sm font-black text-[#123865] shadow-sm transition hover:-translate-y-0.5 hover:bg-orange-50 hover:shadow-md focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/30 active:translate-y-0"
              >
                Refresh Finance Data
              </button>
            </div>
          </div>
        </div>

        <div className="grid min-w-0 gap-3 border-t-[3px] border-[#123865] bg-[#FFF8EF] p-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 sm:p-5">
          <Metric label="Active invoices" value={financeStats.activeInvoices} />
          <Metric label="Open invoices" value={financeStats.openInvoices} />
          <Metric
            label="Overdue"
            value={financeStats.overdueInvoices}
            tone={financeStats.overdueInvoices ? "danger" : "default"}
          />
          <Metric
            label="Confirmed payments"
            value={financeStats.confirmedPayments}
            tone="success"
          />
          <Metric
            label="Receipts to review"
            value={financeStats.pendingReceipts}
            tone={financeStats.pendingReceipts ? "warning" : "default"}
          />
          <Metric
            label="Active destinations"
            value={financeStats.activePaymentAccounts}
            tone={financeStats.activePaymentAccounts ? "success" : "warning"}
          />
        </div>
      </section>

      {message ? (
        <div
          className={`flex min-w-0 items-start gap-3 rounded-[1.35rem] border-[3px] p-4 text-sm font-bold shadow-[0_8px_22px_rgba(18,56,101,0.05)] ${
            messageStyles[messageTone] || messageStyles.info
          }`}
          role={messageTone === "error" ? "alert" : "status"}
        >
          <span className="min-w-0 flex-1">{message}</span>
          <button
            type="button"
            onClick={() => setMessage("")}
            className="shrink-0 rounded-lg px-2 py-1 font-black transition hover:bg-black/5 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-current/15"
            aria-label="Dismiss finance message"
          >
            ×
          </button>
        </div>
      ) : null}

      <section className="min-w-0 overflow-hidden rounded-[1.65rem] border-[3px] border-[#123865] bg-white shadow-[0_14px_38px_rgba(18,56,101,0.09)]">
        <div className="flex min-w-0 flex-col gap-3 border-b-[3px] border-[#123865] bg-[#123865] px-5 py-4 text-white lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-orange-300">
              Finance Now
            </p>
            <h3 className="mt-1 text-xl font-black text-white">
              What needs action, what just moved and what is already done
            </h3>
            <p className="mt-1 max-w-4xl text-sm font-semibold leading-6 text-slate-200">
              This is the operational layer. Use the detailed ledgers below only when you need the full history.
            </p>
          </div>

          <div className="flex shrink-0 flex-wrap gap-2">
            <span className="rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-[10px] font-black uppercase tracking-[0.1em] text-white">
              {openInvoiceRecords.length} open invoice{openInvoiceRecords.length === 1 ? "" : "s"}
            </span>
            <span className="rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-[10px] font-black uppercase tracking-[0.1em] text-white">
              {pendingReceiptRecords.length} receipt{pendingReceiptRecords.length === 1 ? "" : "s"} to review
            </span>
          </div>
        </div>

        <div className="grid min-w-0 gap-3 bg-[#FFF8EF] p-4 lg:grid-cols-[1.05fr_1.25fr_0.9fr] sm:p-5">
          <OperationalCard
            eyebrow={financePriority.eyebrow}
            title={financePriority.title}
            detail={financePriority.detail}
            tone={financePriority.tone}
          />

          <div className="min-w-0 rounded-[1.35rem] border-[3px] border-[#C9D7E6] bg-white p-4 shadow-[0_7px_18px_rgba(18,56,101,0.04)]">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[9px] font-black uppercase tracking-[0.16em] text-violet-700">
                  Latest Movement
                </p>
                <h4 className="mt-1 font-black text-[#10233F]">
                  Newest finance activity
                </h4>
              </div>
              <Badge text={latestFinanceActivity.length ? "live" : "clear"} tone="navy" />
            </div>

            <div className="mt-3 space-y-2">
              {latestFinanceActivity.length ? (
                latestFinanceActivity.map((item, index) => (
                  <div
                    key={item.id}
                    className={`rounded-xl border-2 p-3 ${
                      index === 0
                        ? "border-violet-300 bg-violet-50"
                        : "border-[#D9E3EC] bg-[#F8FBFD]"
                    }`}
                  >
                    <div className="flex min-w-0 items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[9px] font-black uppercase tracking-[0.12em] text-slate-500">
                            {index === 0 ? "Latest" : item.type}
                          </span>
                          <Badge text={item.status} />
                        </div>
                        <p className="mt-1 break-words text-sm font-black text-[#10233F]">
                          {item.title}
                        </p>
                        <p className="mt-1 text-[10px] font-semibold text-slate-500">
                          {item.type} · {formatFinanceMoment(item.time)}
                        </p>
                      </div>
                      {item.amount > 0 ? (
                        <span className="shrink-0 text-sm font-black text-[#123865]">
                          {formatMoney(item.amount, item.currency)}
                        </span>
                      ) : null}
                    </div>
                  </div>
                ))
              ) : (
                <p className="rounded-xl border-2 border-dashed border-[#C9D7E6] bg-[#F8FBFD] p-4 text-sm font-bold text-slate-500">
                  No finance movement recorded yet.
                </p>
              )}
            </div>
          </div>

          <div className="min-w-0 rounded-[1.35rem] border-[3px] border-emerald-300 bg-emerald-50 p-4 shadow-[0_7px_18px_rgba(18,56,101,0.04)]">
            <p className="text-[9px] font-black uppercase tracking-[0.16em] text-emerald-700">
              Done / History
            </p>
            <h4 className="mt-1 font-black text-[#10233F]">
              Completed finance records
            </h4>
            <p className="mt-2 text-3xl font-black text-emerald-800">
              {completedFinanceCount}
            </p>

            <div className="mt-3 space-y-2 text-xs font-bold text-emerald-900/80">
              <div className="flex items-center justify-between gap-3 rounded-xl border border-emerald-200 bg-white/70 px-3 py-2">
                <span>Confirmed payments</span>
                <strong>{confirmedPayments.length}</strong>
              </div>
              <div className="flex items-center justify-between gap-3 rounded-xl border border-emerald-200 bg-white/70 px-3 py-2">
                <span>Reviewed receipts</span>
                <strong>{reviewedReceiptRecords.length}</strong>
              </div>
              <div className="flex items-center justify-between gap-3 rounded-xl border border-emerald-200 bg-white/70 px-3 py-2">
                <span>Closed invoice history</span>
                <strong>{closedInvoiceRecords.length}</strong>
              </div>
              <div className="flex items-center justify-between gap-3 rounded-xl border border-emerald-200 bg-white/70 px-3 py-2">
                <span>Closed payment requests</span>
                <strong>{closedPaymentRequestRecords.length}</strong>
              </div>
            </div>

            <p className="mt-3 text-[11px] font-semibold leading-5 text-emerald-900/70">
              Finished records stay available below for audit, but they no longer compete visually with today&apos;s work.
            </p>
          </div>
        </div>
      </section>

      <section className="min-w-0 rounded-[1.65rem] border-[3px] border-[#123865] bg-white p-5 shadow-[0_12px_34px_rgba(18,56,101,0.07)]">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-700">
            Money Position
          </p>
          <h3 className="mt-1 text-lg font-black">Balances by Currency</h3>
          <p className="mt-1 text-sm text-slate-600">
            Currencies stay separate so PKR, EUR and other amounts are never
            incorrectly added together.
          </p>
        </div>

        {totalsByCurrency.length ? (
          <div className="mt-4 grid min-w-0 gap-3 lg:grid-cols-2">
            {totalsByCurrency.map((row) => (
              <div
                key={row.currency}
                className="min-w-0 rounded-[1.35rem] border-[3px] border-[#C9D7E6] bg-[#FFF8EF] p-4 shadow-[0_7px_18px_rgba(18,56,101,0.04)] transition hover:border-[#FF5A0A] hover:bg-white"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="font-black">{row.currency}</p>
                  <Badge text={row.currency} tone="navy" />
                </div>

                <div className="mt-3 grid min-w-0 gap-2 sm:grid-cols-2">
                  <Info label="Invoiced" value={formatMoney(row.invoiced, row.currency)} />
                  <Info label="Confirmed" value={formatMoney(row.paid, row.currency)} />
                  <Info
                    label="Outstanding"
                    value={formatMoney(row.outstanding, row.currency)}
                  />
                  <Info label="Overdue" value={formatMoney(row.overdue, row.currency)} />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState text="No finance activity yet." />
        )}
      </section>

      <div className="grid min-w-0 gap-5 xl:grid-cols-2">
        <form
          onSubmit={handleCreateInvoice}
          className="min-w-0 rounded-[1.65rem] border-[3px] border-[#123865] bg-white p-5 shadow-[0_12px_34px_rgba(18,56,101,0.07)]"
        >
          <SectionHeading
            eyebrow="Receivable"
            title="Create Invoice"
            description="Use an invoice when Zaifan expects the student to pay a specific amount."
          />

          <div className="mt-5 grid min-w-0 gap-3 sm:grid-cols-2">
            <Input
              label="Invoice title"
              required
              value={invoiceForm.title}
              onChange={(value) =>
                setInvoiceForm((previous) => ({ ...previous, title: value }))
              }
            />
            <Input
              label="Amount"
              required
              type="number"
              min="0"
              step="0.01"
              value={invoiceForm.amount}
              onChange={(value) =>
                setInvoiceForm((previous) => ({ ...previous, amount: value }))
              }
            />
            <Select
              label="Currency"
              value={invoiceForm.currency}
              onChange={(value) =>
                setInvoiceForm((previous) => ({ ...previous, currency: value }))
              }
              options={[
                ["PKR", "PKR"],
                ["EUR", "EUR"],
                ["USD", "USD"],
                ["GBP", "GBP"],
              ]}
            />
            <Input
              label="Due date"
              type="date"
              value={invoiceForm.due_date}
              onChange={(value) =>
                setInvoiceForm((previous) => ({ ...previous, due_date: value }))
              }
            />
            <Select
              label="Category"
              value={invoiceForm.category}
              onChange={(value) =>
                setInvoiceForm((previous) => ({ ...previous, category: value }))
              }
              options={[
                ["service_fee", "Zaifan service fee"],
                ["application_fee", "Application fee"],
                ["visa_fee", "Visa / processing fee"],
                ["document_fee", "Document service"],
                ["other", "Other"],
              ]}
            />
            <Input
              label="Description"
              value={invoiceForm.description}
              onChange={(value) =>
                setInvoiceForm((previous) => ({
                  ...previous,
                  description: value,
                }))
              }
            />
          </div>

          <button
            type="submit"
            disabled={invoiceSaving}
            className="mt-4 inline-flex min-h-11 items-center justify-center rounded-xl border-2 border-[#FF5A0A] bg-[#FF5A0A] px-5 py-3 text-sm font-black text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-orange-600 hover:shadow-md focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-orange-100 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {invoiceSaving ? "Creating Invoice..." : "Create Invoice"}
          </button>
        </form>

        <form
          onSubmit={handleAddPayment}
          className="min-w-0 rounded-[1.65rem] border-[3px] border-[#123865] bg-white p-5 shadow-[0_12px_34px_rgba(18,56,101,0.07)]"
        >
          <SectionHeading
            eyebrow="Money Received"
            title="Record Payment"
            description="Use this only after money has actually been received. Linked invoices reconcile automatically."
          />

          <div className="mt-5 grid min-w-0 gap-3 sm:grid-cols-2">
            <Select
              label="Invoice"
              value={paymentForm.invoice_id}
              onChange={(value) =>
                setPaymentForm((previous) => ({
                  ...previous,
                  invoice_id: value,
                  amount: "",
                }))
              }
              options={[
                ["", "General payment — no invoice"],
                ...collectibleInvoices.map((invoice) => [
                  invoice.id,
                  `${
                    invoice.invoice_number || invoice.title || "Invoice"
                  } · ${formatMoney(
                    getInvoiceOutstanding(invoice, confirmedPayments),
                    invoice.currency
                  )}`,
                ]),
              ]}
            />

            <Input
              label="Amount received"
              required
              type="number"
              min="0"
              step="0.01"
              value={paymentForm.amount}
              onChange={(value) =>
                setPaymentForm((previous) => ({ ...previous, amount: value }))
              }
            />

            <Select
              label="Currency"
              value={paymentForm.currency}
              onChange={(value) =>
                setPaymentForm((previous) => ({ ...previous, currency: value }))
              }
              disabled={Boolean(paymentForm.invoice_id)}
              options={[
                ["PKR", "PKR"],
                ["EUR", "EUR"],
                ["USD", "USD"],
                ["GBP", "GBP"],
              ]}
            />

            <Select
              label="Payment method"
              value={paymentForm.payment_method}
              onChange={(value) =>
                setPaymentForm((previous) => ({
                  ...previous,
                  payment_method: value,
                }))
              }
              options={[
                ["cash", "Cash"],
                ["bank_transfer", "Bank transfer"],
                ["jazzcash", "JazzCash"],
                ["easypaisa", "Easypaisa"],
                ["card", "Card"],
                ["other", "Other"],
              ]}
            />

            <Input
              label="Reference"
              value={paymentForm.reference}
              onChange={(value) =>
                setPaymentForm((previous) => ({ ...previous, reference: value }))
              }
            />

            <Input
              label="Notes"
              value={paymentForm.notes}
              onChange={(value) =>
                setPaymentForm((previous) => ({ ...previous, notes: value }))
              }
            />
          </div>

          {paymentForm.invoice_id ? (
            <p className="mt-3 rounded-xl border-[3px] border-[#60A5FA] bg-[#F2F7FF] px-4 py-3 text-xs font-bold text-blue-900">
              Currency is locked to the selected invoice. This prevents
              cross-currency balance corruption.
            </p>
          ) : null}

          <button
            type="submit"
            disabled={paymentSaving}
            className="mt-4 inline-flex min-h-11 items-center justify-center rounded-xl border-2 border-[#123865] bg-[#123865] px-5 py-3 text-sm font-black text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-[#0d2b50] hover:shadow-md focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-100 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {paymentSaving ? "Recording Payment..." : "Record Confirmed Payment"}
          </button>
        </form>
      </div>

      <section className="min-w-0 overflow-hidden rounded-[1.65rem] border-[3px] border-[#123865] bg-white shadow-[0_12px_34px_rgba(18,56,101,0.07)]">
        <div className="flex min-w-0 flex-col gap-3 border-b-2 border-[#E3B98B] bg-[#FFF8EF] p-5 sm:flex-row sm:items-center sm:justify-between">
          <SectionHeading
            eyebrow="Receivables Command"
            title="Invoices — open work first"
            description="Open balances stay visible. Paid, cancelled and void invoices move into collapsible history."
          />
          <div className="flex shrink-0 flex-wrap gap-2">
            <Badge text={`${openInvoiceRecords.length} open`} tone={openInvoiceRecords.length ? "orange" : "navy"} />
            <Badge text={`${closedInvoiceRecords.length} history`} tone="navy" />
          </div>
        </div>

        <div className="p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.16em] text-orange-700">
                Needs Action
              </p>
              <h4 className="mt-1 font-black text-[#10233F]">
                Collectible invoices
              </h4>
            </div>
            <span className="rounded-xl border-2 border-orange-300 bg-orange-50 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.1em] text-orange-800">
              {openInvoiceRecords.length} active
            </span>
          </div>

          <div className="mt-3 space-y-3">
            {openInvoiceRecords.length ? (
              openInvoiceRecords.map((invoice, index) => {
                const status = getEffectiveInvoiceStatus(invoice, confirmedPayments);
                const total = Number(invoice.total_amount ?? invoice.amount ?? 0);
                const paid = getLinkedConfirmedPaymentAmount(invoice, confirmedPayments);
                const outstanding = getInvoiceOutstanding(invoice, confirmedPayments);
                const overdue = isInvoiceOverdue(invoice, confirmedPayments);

                return (
                  <article
                    key={invoice.id}
                    className={`min-w-0 rounded-[1.35rem] border-[3px] p-4 shadow-[0_8px_22px_rgba(18,56,101,0.05)] ${
                      overdue
                        ? "border-red-300 bg-red-50"
                        : "border-orange-300 bg-[#FFF8EF]"
                    }`}
                  >
                    <div className="flex min-w-0 flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          {index === 0 ? <Badge text="next collection" tone="orange" /> : null}
                          {overdue ? <Badge text="overdue" /> : <Badge text="open" />}
                          <Badge text={status || "unpaid"} />
                        </div>
                        <h4 className="mt-2 break-words text-lg font-black text-[#10233F]">
                          {invoice.title || "Student Invoice"}
                        </h4>
                        <p className="mt-1 text-xs font-bold text-slate-500">
                          {invoice.invoice_number || "No invoice number"} · {invoice.category || "general"}
                        </p>
                      </div>

                      <div className="shrink-0 rounded-xl border-2 border-[#123865] bg-[#123865] px-4 py-3 text-white">
                        <p className="text-[9px] font-black uppercase tracking-[0.12em] text-slate-200">
                          Outstanding
                        </p>
                        <p className="mt-1 text-xl font-black text-white">
                          {formatMoney(outstanding, invoice.currency)}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 grid min-w-0 gap-2 sm:grid-cols-2 lg:grid-cols-4">
                      <Info label="Invoice total" value={formatMoney(total, invoice.currency)} />
                      <Info label="Applied payment" value={formatMoney(paid, invoice.currency)} />
                      <Info label="Due date" value={formatDate(invoice.due_date)} />
                      <Info label="Issued" value={formatDate(invoice.issued_at || invoice.created_at)} />
                    </div>

                    <div className="mt-3 rounded-xl border-2 border-[#C9D7E6] bg-white p-3">
                      <div className="flex items-center justify-between gap-3 text-[10px] font-black uppercase tracking-[0.1em] text-slate-500">
                        <span>Payment progress</span>
                        <span>
                          {total > 0
                            ? Math.min(100, Math.max(0, Math.round((paid / total) * 100)))
                            : 0}
                          %
                        </span>
                      </div>
                      <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200">
                        <div
                          className="h-full rounded-full bg-[#FF5A0A] transition-[width] duration-300"
                          style={{
                            width: `${
                              total > 0
                                ? Math.min(100, Math.max(0, (paid / total) * 100))
                                : 0
                            }%`,
                          }}
                        />
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2 border-t border-[#D9E3EC] pt-3">
                      <ActionButton
                        onClick={() => changeInvoiceStatus(invoice, "cancelled")}
                        disabled={Boolean(actionSavingId)}
                      >
                        Cancel
                      </ActionButton>
                      <ActionButton
                        danger
                        onClick={() => changeInvoiceStatus(invoice, "void")}
                        disabled={Boolean(actionSavingId)}
                      >
                        Void
                      </ActionButton>
                      <ActionButton
                        danger
                        onClick={() => deleteInvoice(invoice)}
                        disabled={Boolean(actionSavingId)}
                      >
                        Delete Test/Mistake
                      </ActionButton>
                    </div>
                  </article>
                );
              })
            ) : (
              <div className="rounded-[1.35rem] border-[3px] border-emerald-300 bg-emerald-50 p-5">
                <p className="text-sm font-black text-emerald-900">
                  No collectible invoice is left.
                </p>
                <p className="mt-1 text-xs font-semibold leading-5 text-emerald-800/75">
                  Paid, cancelled and void records remain below in audit history.
                </p>
              </div>
            )}
          </div>

          <details className="mt-4 overflow-hidden rounded-[1.35rem] border-[3px] border-[#C9D7E6] bg-[#F8FBFD]">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 font-black text-[#10233F]">
              <span>Completed / invoice history</span>
              <span className="rounded-full border border-[#AFC0D0] bg-white px-3 py-1 text-[10px] font-black text-[#123865]">
                {closedInvoiceRecords.length} records
              </span>
            </summary>

            <div className="space-y-3 border-t-2 border-[#D9E3EC] p-4">
              {closedInvoiceRecords.length ? (
                closedInvoiceRecords.map((invoice) => {
                  const status = getEffectiveInvoiceStatus(invoice, confirmedPayments);
                  const total = Number(invoice.total_amount ?? invoice.amount ?? 0);
                  const paid = getLinkedConfirmedPaymentAmount(invoice, confirmedPayments);
                  const outstanding = getInvoiceOutstanding(invoice, confirmedPayments);

                  return (
                    <article
                      key={invoice.id}
                      className="min-w-0 rounded-[1.2rem] border-2 border-[#C9D7E6] bg-white p-4"
                    >
                      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge text="history" tone="navy" />
                            <Badge text={status || invoice.status || "closed"} />
                          </div>
                          <p className="mt-2 break-words font-black text-[#10233F]">
                            {invoice.title || "Student Invoice"}
                          </p>
                          <p className="mt-1 text-xs font-semibold text-slate-500">
                            {invoice.invoice_number || "No invoice number"} · last movement{" "}
                            {formatFinanceMoment(
                              invoice.updated_at ||
                                invoice.issued_at ||
                                invoice.created_at
                            )}
                          </p>
                        </div>
                        <div className="grid min-w-[17rem] gap-2 sm:grid-cols-3">
                          <Info label="Total" value={formatMoney(total, invoice.currency)} />
                          <Info label="Paid" value={formatMoney(paid, invoice.currency)} />
                          <Info label="Left" value={formatMoney(outstanding, invoice.currency)} />
                        </div>
                      </div>

                      <div className="mt-3 flex flex-wrap gap-2">
                        {["cancelled", "void"].includes(status) ? (
                          <ActionButton
                            onClick={() => changeInvoiceStatus(invoice, "unpaid")}
                            disabled={Boolean(actionSavingId)}
                          >
                            Restore
                          </ActionButton>
                        ) : null}

                        <ActionButton
                          danger
                          onClick={() => deleteInvoice(invoice)}
                          disabled={Boolean(actionSavingId)}
                        >
                          Delete Test/Mistake
                        </ActionButton>
                      </div>
                    </article>
                  );
                })
              ) : (
                <EmptyState text="No completed invoice history yet." />
              )}
            </div>
          </details>
        </div>
      </section>

      <section className="min-w-0 overflow-hidden rounded-[1.65rem] border-[3px] border-[#123865] bg-white shadow-[0_12px_34px_rgba(18,56,101,0.07)]">
        <div className="flex min-w-0 flex-col gap-3 border-b-2 border-[#D9E3EC] bg-[#F8FBFD] p-5 sm:flex-row sm:items-center sm:justify-between">
          <SectionHeading
            eyebrow="Money Movement"
            title="Payments — newest first"
            description="The latest payment is pinned visually. Older confirmed, cancelled and refunded records remain as audit history."
          />
          <div className="flex shrink-0 flex-wrap gap-2">
            <Badge text={`${confirmedPayments.length} confirmed`} tone="navy" />
            <Badge text={`${payments.length} total records`} tone="orange" />
          </div>
        </div>

        <div className="space-y-3 p-5">
          {sortedPayments.length ? (
            sortedPayments.map((payment) => {
              const status = normalize(payment.status);
              const isLatest = String(payment.id) === String(latestPaymentId);

              return (
                <article
                  key={payment.id}
                  className={`min-w-0 rounded-[1.35rem] border-[3px] p-4 shadow-[0_7px_18px_rgba(18,56,101,0.04)] ${
                    isLatest
                      ? "border-violet-300 bg-violet-50"
                      : status === "confirmed"
                        ? "border-emerald-300 bg-emerald-50"
                        : ["cancelled", "failed"].includes(status)
                          ? "border-red-300 bg-red-50"
                          : "border-[#C9D7E6] bg-[#F8FBFD]"
                  }`}
                >
                  <div className="flex min-w-0 flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        {isLatest ? <Badge text="latest payment" tone="navy" /> : null}
                        <Badge text={payment.status || "confirmed"} />
                        <span className="text-[10px] font-black uppercase tracking-[0.1em] text-slate-500">
                          {payment.invoice_id ? "invoice linked" : "general payment"}
                        </span>
                      </div>

                      <h4 className="mt-2 text-xl font-black text-[#10233F]">
                        {formatMoney(payment.amount, payment.currency)}
                      </h4>
                      <p className="mt-1 text-xs font-bold text-slate-500">
                        {payment.payment_method || "payment"} ·{" "}
                        {payment.reference || "No reference"}
                      </p>
                      <p className="mt-1 text-[10px] font-semibold text-slate-500">
                        {formatFinanceMoment(
                          payment.updated_at || payment.paid_at || payment.created_at
                        )}
                      </p>
                    </div>

                    <div className="grid min-w-0 gap-2 sm:grid-cols-2 lg:min-w-[24rem]">
                      <Info label="Invoice link" value={payment.invoice_id ? "Linked" : "General payment"} />
                      <Info label="Received by" value={payment.received_by ? "Admin recorded" : "Not recorded"} />
                      <Info label="Status" value={String(payment.status || "confirmed").replaceAll("_", " ")} />
                      <Info label="Notes" value={payment.notes || "None"} />
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2 border-t border-black/10 pt-3">
                    {status === "confirmed" ? (
                      <>
                        <ActionButton
                          onClick={() => changePaymentStatus(payment, "refunded")}
                          disabled={Boolean(actionSavingId)}
                        >
                          Refund
                        </ActionButton>
                        <ActionButton
                          onClick={() => changePaymentStatus(payment, "cancelled")}
                          disabled={Boolean(actionSavingId)}
                        >
                          Cancel
                        </ActionButton>
                      </>
                    ) : (
                      <ActionButton
                        onClick={() => changePaymentStatus(payment, "confirmed")}
                        disabled={Boolean(actionSavingId)}
                      >
                        Restore Confirmed
                      </ActionButton>
                    )}

                    <ActionButton
                      danger
                      onClick={() => deletePayment(payment)}
                      disabled={Boolean(actionSavingId)}
                    >
                      Delete Test/Mistake
                    </ActionButton>
                  </div>
                </article>
              );
            })
          ) : (
            <EmptyState text="No payments recorded yet." />
          )}
        </div>
      </section>

      <section className="min-w-0 overflow-hidden rounded-[1.65rem] border-[3px] border-[#123865] bg-white shadow-[0_12px_34px_rgba(18,56,101,0.07)]">
        <div className="flex min-w-0 flex-col gap-3 border-b-2 border-[#E3B98B] bg-[#FFF8EF] p-5 sm:flex-row sm:items-center sm:justify-between">
          <SectionHeading
            eyebrow="Evidence Command"
            title="Student Receipts — review queue"
            description="Pending proof stays on top. Reviewed, rejected and converted receipts move into history automatically."
          />
          <div className="flex shrink-0 flex-wrap gap-2">
            <Badge text={`${pendingReceiptRecords.length} review now`} tone={pendingReceiptRecords.length ? "orange" : "navy"} />
            <Badge text={`${reviewedReceiptRecords.length} completed`} tone="navy" />
          </div>
        </div>

        <div className="p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.16em] text-orange-700">
                Needs Admin Decision
              </p>
              <h4 className="mt-1 font-black text-[#10233F]">
                Pending receipt review
              </h4>
            </div>
            <span className={`rounded-xl border-2 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.1em] ${
              pendingReceiptRecords.length
                ? "border-orange-300 bg-orange-50 text-orange-800"
                : "border-emerald-300 bg-emerald-50 text-emerald-800"
            }`}>
              {pendingReceiptRecords.length ? `${pendingReceiptRecords.length} waiting` : "queue clear"}
            </span>
          </div>

          <div className="mt-3 space-y-3">
            {pendingReceiptRecords.length ? (
              pendingReceiptRecords.map((receipt, index) => {
                const busy = receiptSavingId === receipt.id;

                return (
                  <article
                    key={receipt.id}
                    className="min-w-0 rounded-[1.35rem] border-[3px] border-orange-300 bg-orange-50 p-4 shadow-[0_8px_22px_rgba(18,56,101,0.05)]"
                  >
                    <div className="flex min-w-0 flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge text={index === 0 ? "review first" : "pending review"} tone="orange" />
                          <Badge text={receipt.status || "pending_review"} />
                        </div>
                        <h4 className="mt-2 break-words text-lg font-black text-[#10233F]">
                          {receipt.file_name || "Payment Receipt"}
                        </h4>
                        <p className="mt-1 text-sm font-bold text-slate-600">
                          {formatMoney(receipt.amount, receipt.currency)}
                        </p>
                        <p className="mt-1 text-[10px] font-semibold text-slate-500">
                          Submitted{" "}
                          {formatFinanceMoment(
                            receipt.submitted_at || receipt.created_at
                          )}
                        </p>
                        {receipt.reference ? (
                          <p className="mt-2 text-xs font-semibold text-slate-600">
                            Reference: {receipt.reference}
                          </p>
                        ) : null}
                        {receipt.notes ? (
                          <p className="mt-2 text-sm text-slate-600">{receipt.notes}</p>
                        ) : null}
                      </div>

                      <div className="flex shrink-0 flex-wrap gap-2">
                        {receipt.receipt_url ? (
                          <a
                            href={receipt.receipt_url}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex min-h-10 items-center rounded-lg border-2 border-[#123865] bg-[#123865] px-3 py-2 text-xs font-black text-white transition hover:bg-[#0d2b50]"
                          >
                            Open Proof
                          </a>
                        ) : null}
                        <ActionButton
                          success
                          disabled={busy}
                          onClick={() => updateReceiptStatus(receipt, "approved")}
                        >
                          {busy ? "Processing..." : "Approve + Create Payment"}
                        </ActionButton>
                        <ActionButton
                          danger
                          disabled={busy}
                          onClick={() => updateReceiptStatus(receipt, "rejected")}
                        >
                          Reject
                        </ActionButton>
                      </div>
                    </div>
                  </article>
                );
              })
            ) : (
              <div className="rounded-[1.35rem] border-[3px] border-emerald-300 bg-emerald-50 p-5">
                <p className="text-sm font-black text-emerald-900">
                  Receipt review queue is clear.
                </p>
                <p className="mt-1 text-xs font-semibold leading-5 text-emerald-800/75">
                  Reviewed proof stays below in history so completed work does not compete with new decisions.
                </p>
              </div>
            )}
          </div>

          <details className="mt-4 overflow-hidden rounded-[1.35rem] border-[3px] border-[#C9D7E6] bg-[#F8FBFD]">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 font-black text-[#10233F]">
              <span>Reviewed receipt history</span>
              <span className="rounded-full border border-[#AFC0D0] bg-white px-3 py-1 text-[10px] font-black text-[#123865]">
                {reviewedReceiptRecords.length} records
              </span>
            </summary>

            <div className="space-y-3 border-t-2 border-[#D9E3EC] p-4">
              {reviewedReceiptRecords.length ? (
                reviewedReceiptRecords.map((receipt) => {
                  const status = normalize(receipt.status);

                  return (
                    <article
                      key={receipt.id}
                      className={`min-w-0 rounded-[1.2rem] border-2 p-4 ${
                        status === "rejected"
                          ? "border-red-300 bg-red-50"
                          : "border-emerald-300 bg-emerald-50"
                      }`}
                    >
                      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge text={receipt.status || "reviewed"} />
                            <Badge text="history" tone="navy" />
                          </div>
                          <p className="mt-2 break-words font-black text-[#10233F]">
                            {receipt.file_name || "Payment Receipt"}
                          </p>
                          <p className="mt-1 text-xs font-semibold text-slate-500">
                            {formatMoney(receipt.amount, receipt.currency)} ·{" "}
                            {formatFinanceMoment(
                              receipt.reviewed_at ||
                                receipt.updated_at ||
                                receipt.submitted_at ||
                                receipt.created_at
                            )}
                          </p>
                        </div>

                        {receipt.receipt_url ? (
                          <a
                            href={receipt.receipt_url}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex min-h-10 shrink-0 items-center rounded-lg border-2 border-[#123865] bg-white px-3 py-2 text-xs font-black text-[#123865]"
                          >
                            Open Proof
                          </a>
                        ) : null}
                      </div>

                      <p className="mt-3 rounded-xl border border-black/10 bg-white/70 px-3 py-2 text-xs font-bold text-slate-600">
                        {status === "converted_to_payment"
                          ? "Done — receipt was approved and converted into one confirmed payment."
                          : status === "rejected"
                            ? "Done — receipt was rejected and created no payment."
                            : "Review completed."}
                      </p>
                    </article>
                  );
                })
              ) : (
                <EmptyState text="No reviewed receipt history yet." />
              )}
            </div>
          </details>
        </div>
      </section>

      <details className="overflow-hidden rounded-[1.65rem] border-[3px] border-[#123865] bg-white shadow-[0_12px_34px_rgba(18,56,101,0.07)]">
        <summary className="flex cursor-pointer list-none flex-col gap-2 bg-[#123865] px-5 py-4 text-white sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.18em] text-orange-300">
              Finance Setup
            </p>
            <p className="mt-1 text-lg font-black text-white">
              Collection destinations & payment accounts
            </p>
            <p className="mt-1 text-xs font-semibold text-slate-200">
              Setup is collapsed by default because it is not part of the daily payment/review queue.
            </p>
          </div>
          <span className="shrink-0 rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-[10px] font-black uppercase tracking-[0.1em] text-white">
            {financeStats.activePaymentAccounts} active · open setup
          </span>
        </summary>

        <div className="bg-[#FFF8EF] p-4 sm:p-5">
          <div className="grid min-w-0 gap-5 xl:grid-cols-2">
        <form
          onSubmit={handleSavePaymentAccount}
          className="min-w-0 rounded-[1.65rem] border-[3px] border-[#123865] bg-white p-5 shadow-[0_12px_34px_rgba(18,56,101,0.07)]"
        >
          <SectionHeading
            eyebrow="Collection Setup"
            title="Add Payment Account"
            description="Bank or wallet details students can use when paying Zaifan."
          />

          <div className="mt-4 rounded-[1.35rem] border-2 border-orange-300 bg-orange-50 p-3">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-[9px] font-black uppercase tracking-[0.16em] text-orange-700">
                  Official Zaifan Destinations
                </p>
                <p className="mt-1 text-xs font-semibold leading-5 text-orange-900/75">
                  Load the verified collection details supplied for Zaifan, review them, then save each destination to payment_accounts.
                </p>
              </div>
              <span className="shrink-0 rounded-xl border border-orange-300 bg-white px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.12em] text-orange-700">
                Save once · Student OS reads live
              </span>
            </div>

            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {OFFICIAL_PAYMENT_ACCOUNT_PRESETS.map((preset) => (
                <button
                  key={preset.key}
                  type="button"
                  onClick={() => applyPaymentAccountPreset(preset)}
                  className="rounded-xl border-2 border-[#C9D7E6] bg-white px-3 py-3 text-left transition hover:-translate-y-0.5 hover:border-[#FF5A0A] hover:shadow-sm"
                >
                  <p className="text-xs font-black text-[#10233F]">{preset.label}</p>
                  <p className="mt-1 text-[10px] font-semibold text-slate-500">
                    {preset.account_type === "bank" ? "Bank transfer" : "Mobile wallet"} · load preset
                  </p>
                </button>
              ))}
            </div>
          </div>

          <div className="mt-5 grid min-w-0 gap-3 sm:grid-cols-2">
            <Select
              label="Account type"
              value={accountForm.account_type}
              onChange={(value) =>
                setAccountForm((previous) => ({
                  ...previous,
                  account_type: value,
                }))
              }
              options={[
                ["bank", "Bank"],
                ["jazzcash", "JazzCash"],
                ["easypaisa", "Easypaisa"],
                ["upaisa", "UPaisa"],
                ["manual", "Manual / Other"],
              ]}
            />
            <Input
              label="Account title"
              required
              value={accountForm.account_title}
              onChange={(value) =>
                setAccountForm((previous) => ({
                  ...previous,
                  account_title: value,
                }))
              }
            />
            <Input
              label="Bank name"
              value={accountForm.bank_name}
              onChange={(value) =>
                setAccountForm((previous) => ({ ...previous, bank_name: value }))
              }
            />
            <Input
              label="Account number"
              value={accountForm.account_number}
              onChange={(value) =>
                setAccountForm((previous) => ({
                  ...previous,
                  account_number: value,
                }))
              }
            />
            <Input
              label="IBAN"
              value={accountForm.iban}
              onChange={(value) =>
                setAccountForm((previous) => ({ ...previous, iban: value }))
              }
            />
            <Input
              label="Wallet number"
              value={accountForm.mobile_wallet_number}
              onChange={(value) =>
                setAccountForm((previous) => ({
                  ...previous,
                  mobile_wallet_number: value,
                }))
              }
            />
          </div>

          <label className="mt-3 block">
            <span className="text-[11px] font-black uppercase tracking-[0.12em] text-[#10233F]">
              Student instructions
            </span>
            <textarea
              value={accountForm.instructions}
              onChange={(event) =>
                setAccountForm((previous) => ({
                  ...previous,
                  instructions: event.target.value,
                }))
              }
              className="mt-2 min-h-[96px] min-w-0 w-full rounded-xl border-2 border-[#C9D7E6] bg-[#FFFDF8] px-3 py-2.5 text-sm font-semibold text-[#10233F] outline-none transition focus:border-[#FF5A0A] focus:ring-4 focus:ring-orange-100"
            />
          </label>

          <button
            type="submit"
            disabled={accountSaving}
            className="mt-4 inline-flex min-h-11 items-center justify-center rounded-xl border-2 border-[#FF5A0A] bg-[#FF5A0A] px-5 py-3 text-sm font-black text-white transition hover:-translate-y-0.5 hover:bg-orange-600 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-orange-100 active:translate-y-0 disabled:opacity-50"
          >
            {accountSaving ? "Saving..." : "Save Payment Account"}
          </button>
        </form>

        <section className="min-w-0 rounded-[1.65rem] border-[3px] border-[#123865] bg-white p-5 shadow-[0_12px_34px_rgba(18,56,101,0.07)]">
          <SectionHeading
            eyebrow="Collection Channels"
            title="Payment Accounts"
            description="Deactivate accounts you no longer use; delete only accidental entries."
          />

          <div className="mt-4 space-y-3">
            {accountLoading ? (
              <EmptyState text="Loading payment accounts..." />
            ) : paymentAccounts.length ? (
              paymentAccounts.map((account) => (
                <article
                  key={account.id}
                  className="min-w-0 rounded-[1.35rem] border-[3px] border-[#C9D7E6] bg-[#FFF8EF] p-4 shadow-[0_7px_18px_rgba(18,56,101,0.04)]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-black">{account.account_title}</p>
                      <p className="mt-1 text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
                        {account.account_type}
                      </p>
                    </div>
                    <Badge text={account.is_active ? "active" : "inactive"} />
                  </div>

                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    {account.bank_name ? (
                      <Info label="Bank" value={account.bank_name} />
                    ) : null}
                    {account.account_number ? (
                      <Info label="Account" value={account.account_number} />
                    ) : null}
                    {account.iban ? <Info label="IBAN" value={account.iban} /> : null}
                    {account.mobile_wallet_number ? (
                      <Info label="Wallet" value={account.mobile_wallet_number} />
                    ) : null}
                  </div>

                  {account.instructions ? (
                    <p className="mt-3 rounded-xl border-2 border-[#C9D7E6] bg-white p-3 text-sm font-semibold text-slate-600">
                      {account.instructions}
                    </p>
                  ) : null}

                  <div className="mt-3 flex flex-wrap gap-2">
                    <ActionButton
                      onClick={() => togglePaymentAccount(account)}
                      disabled={accountSaving}
                    >
                      {account.is_active ? "Deactivate" : "Activate"}
                    </ActionButton>
                    <ActionButton
                      danger
                      onClick={() => deletePaymentAccount(account)}
                      disabled={accountSaving}
                    >
                      Delete Mistake
                    </ActionButton>
                  </div>
                </article>
              ))
            ) : (
              <EmptyState text="No payment accounts configured yet." />
            )}
          </div>
        </section>
      </div>
        </div>
      </details>

      {paymentRequests.length ? (
        <section className="min-w-0 overflow-hidden rounded-[1.65rem] border-[3px] border-[#123865] bg-white shadow-[0_12px_34px_rgba(18,56,101,0.07)]">
          <div className="flex min-w-0 flex-col gap-3 border-b-2 border-[#E3B98B] bg-[#FFF8EF] p-5 sm:flex-row sm:items-center sm:justify-between">
            <SectionHeading
              eyebrow="Student Portal"
              title="Payment Requests — coordination lifecycle"
              description="Open requests stay in the action queue. Resolve or cancel them without touching the real payment ledger."
            />
            <div className="flex shrink-0 flex-wrap gap-2">
              <Badge
                text={`${openPaymentRequestRecords.length} open`}
                tone={openPaymentRequestRecords.length ? "orange" : "navy"}
              />
              <Badge
                text={`${closedPaymentRequestRecords.length} history`}
                tone="navy"
              />
            </div>
          </div>

          <div className="p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[9px] font-black uppercase tracking-[0.16em] text-orange-700">
                  Needs Coordination
                </p>
                <h4 className="mt-1 font-black text-[#10233F]">
                  Open counselor payment requests
                </h4>
              </div>
              <span
                className={`rounded-xl border-2 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.1em] ${
                  openPaymentRequestRecords.length
                    ? "border-orange-300 bg-orange-50 text-orange-800"
                    : "border-emerald-300 bg-emerald-50 text-emerald-800"
                }`}
              >
                {openPaymentRequestRecords.length
                  ? `${openPaymentRequestRecords.length} action`
                  : "queue clear"}
              </span>
            </div>

            <div className="mt-3 grid min-w-0 gap-3 lg:grid-cols-2">
              {openPaymentRequestRecords.length ? (
                openPaymentRequestRecords.map((request, index) => (
                  <article
                    key={request.id}
                    className="min-w-0 rounded-[1.35rem] border-[3px] border-orange-300 bg-orange-50 p-4 shadow-[0_7px_18px_rgba(18,56,101,0.04)]"
                  >
                    <div className="flex min-w-0 items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          {index === 0 ? (
                            <Badge text="next action" tone="orange" />
                          ) : null}
                          <Badge text={request.status || "pending"} />
                          {request.priority ? (
                            <Badge text={request.priority} tone="navy" />
                          ) : null}
                        </div>
                        <p className="mt-2 break-words font-black text-[#10233F]">
                          {request.title || request.category || "Payment Request"}
                        </p>
                        {request.message ? (
                          <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">
                            {request.message}
                          </p>
                        ) : null}
                      </div>

                      <span className="shrink-0 text-lg font-black text-orange-900">
                        {formatMoney(request.amount, request.currency || "PKR")}
                      </span>
                    </div>

                    <div className="mt-3 grid gap-2 sm:grid-cols-2">
                      <Info
                        label="Created"
                        value={formatDate(request.created_at || request.requested_at)}
                      />
                      <Info
                        label="Invoice link"
                        value={request.invoice_id ? "Linked request" : "General request"}
                      />
                    </div>

                    <div className="mt-3 rounded-xl border-2 border-violet-200 bg-violet-50 px-3 py-2 text-[11px] font-bold leading-5 text-violet-900">
                      Money effect: none. Completing this request closes coordination only;
                      actual money still requires a confirmed payment or approved receipt.
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2 border-t border-orange-200 pt-3">
                      <ActionButton
                        success
                        onClick={() =>
                          changePaymentRequestStatus(request, "completed")
                        }
                        disabled={Boolean(actionSavingId)}
                      >
                        {actionSavingId === request.id
                          ? "Updating..."
                          : "Resolve Request"}
                      </ActionButton>
                      <ActionButton
                        danger
                        onClick={() =>
                          changePaymentRequestStatus(request, "cancelled")
                        }
                        disabled={Boolean(actionSavingId)}
                      >
                        Cancel Request
                      </ActionButton>
                    </div>
                  </article>
                ))
              ) : (
                <div className="lg:col-span-2 rounded-[1.35rem] border-[3px] border-emerald-300 bg-emerald-50 p-5">
                  <p className="text-sm font-black text-emerald-900">
                    No payment request is waiting for Admin coordination.
                  </p>
                  <p className="mt-1 text-xs font-semibold leading-5 text-emerald-800/75">
                    Completed and cancelled requests remain available in history below.
                  </p>
                </div>
              )}
            </div>

            <details className="mt-4 overflow-hidden rounded-[1.35rem] border-[3px] border-[#C9D7E6] bg-[#F8FBFD]">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 font-black text-[#10233F]">
                <span>Completed / cancelled request history</span>
                <span className="rounded-full border border-[#AFC0D0] bg-white px-3 py-1 text-[10px] font-black text-[#123865]">
                  {closedPaymentRequestRecords.length} records
                </span>
              </summary>

              <div className="space-y-3 border-t-2 border-[#D9E3EC] p-4">
                {closedPaymentRequestRecords.length ? (
                  closedPaymentRequestRecords.map((request) => {
                    const status = normalize(request.status);
                    return (
                      <article
                        key={request.id}
                        className={`min-w-0 rounded-[1.2rem] border-2 p-4 ${
                          status === "completed"
                            ? "border-emerald-300 bg-emerald-50"
                            : "border-red-300 bg-red-50"
                        }`}
                      >
                        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <Badge text={request.status || "completed"} />
                              <Badge text="history" tone="navy" />
                            </div>
                            <p className="mt-2 break-words font-black text-[#10233F]">
                              {request.title || "Payment Request"}
                            </p>
                            <p className="mt-1 text-xs font-semibold text-slate-500">
                              {formatMoney(
                                request.amount,
                                request.currency || "PKR"
                              )}{" "}
                              · last movement{" "}
                              {formatFinanceMoment(
                                request.updated_at ||
                                  request.created_at ||
                                  request.requested_at
                              )}
                            </p>
                          </div>

                          <ActionButton
                            onClick={() =>
                              changePaymentRequestStatus(request, "pending")
                            }
                            disabled={Boolean(actionSavingId)}
                          >
                            Reopen Request
                          </ActionButton>
                        </div>
                      </article>
                    );
                  })
                ) : (
                  <EmptyState text="No closed payment-request history yet." />
                )}
              </div>
            </details>
          </div>
        </section>
      ) : null}

      <StudentNotificationPreviewModal
        pending={pendingNotification}
        busy={notificationBusy}
        onCancel={() => {
          if (!notificationBusy) setPendingNotification(null);
        }}
        onConfirm={confirmProtectedChange}
      />
    </div>
  );
}

function OperationalCard({
  eyebrow,
  title,
  detail,
  tone = "default",
}) {
  const tones = {
    default: "border-[#C9D7E6] bg-white text-[#10233F]",
    success: "border-emerald-300 bg-emerald-50 text-emerald-900",
    warning: "border-orange-300 bg-orange-50 text-orange-950",
    danger: "border-red-300 bg-red-50 text-red-950",
  };

  const eyebrowTones = {
    default: "text-[#123865]",
    success: "text-emerald-700",
    warning: "text-orange-700",
    danger: "text-red-700",
  };

  return (
    <div
      className={`min-w-0 rounded-[1.35rem] border-[3px] p-4 shadow-[0_7px_18px_rgba(18,56,101,0.04)] ${
        tones[tone] || tones.default
      }`}
    >
      <p
        className={`text-[9px] font-black uppercase tracking-[0.16em] ${
          eyebrowTones[tone] || eyebrowTones.default
        }`}
      >
        {eyebrow}
      </p>
      <h4 className="mt-1 break-words text-xl font-black">{title}</h4>
      <p className="mt-2 text-sm font-semibold leading-6 opacity-80">{detail}</p>
    </div>
  );
}

function SectionHeading({ eyebrow, title, description }) {
  return (
    <div>
      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-700">
        {eyebrow}
      </p>
      <h3 className="mt-1 break-words text-xl font-black text-[#10233F]">{title}</h3>
      <p className="mt-1 max-w-3xl text-sm font-semibold leading-6 text-slate-600">{description}</p>
    </div>
  );
}

function Metric({ label, value, tone = "default" }) {
  return <ZaifanMetricCard level="coBoss" label={label} value={value} tone={toZaifanMetricTone(tone)} />;
}

function Badge({ text, tone = "" }) {
  const custom =
    tone === "orange"
      ? "border-[#FF5A0A] bg-[#FFF4E8] text-orange-800"
      : tone === "navy"
        ? "border-[#123865] bg-[#123865] text-white"
        : statusClass(text);

  return (
    <span
      className={`inline-flex max-w-full rounded-full border-2 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.08em] ${custom}`}
    >
      {String(text || "unknown").replaceAll("_", " ")}
    </span>
  );
}

function Info({ label, value }) {
  return (
    <div className="min-w-0 rounded-xl border-2 border-[#C9D7E6] bg-white px-3 py-2.5">
      <p className="text-[9px] font-black uppercase tracking-[0.12em] text-slate-500">
        {label}
      </p>
      <p className="mt-1 break-words text-sm font-black text-[#10233F]">
        {value ?? "Not set"}
      </p>
    </div>
  );
}

function EmptyState({ text }) {
  return (
    <div className="rounded-[1.35rem] border-[3px] border-dashed border-[#FF5A0A] bg-[#FFF8EF] p-6 text-center text-sm font-bold text-slate-500">
      {text}
    </div>
  );
}

function ActionButton({
  children,
  onClick,
  disabled = false,
  danger = false,
  success = false,
}) {
  const style = danger
    ? "border-red-300 bg-red-50 text-red-800 hover:border-red-500 hover:bg-red-100"
    : success
      ? "border-emerald-300 bg-emerald-50 text-emerald-800 hover:border-emerald-500 hover:bg-emerald-100"
      : "border-[#C9D7E6] bg-white text-[#10233F] hover:border-[#FF5A0A] hover:bg-[#FFF4E8]";

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex min-h-10 items-center justify-center rounded-lg border-2 px-3 py-2 text-xs font-black shadow-sm transition hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-orange-100 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-45 ${style}`}
    >
      {children}
    </button>
  );
}

function Input({
  label,
  value,
  onChange,
  type = "text",
  min,
  step,
  disabled = false,
  required = false,
}) {
  return (
    <label className="block">
      <span className="text-[11px] font-black uppercase tracking-[0.12em] text-[#10233F]">
        {label}
      </span>
      <input
        type={type}
        min={min}
        step={step}
        value={value}
        disabled={disabled}
        required={required}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 min-h-11 min-w-0 w-full rounded-xl border-2 border-[#C9D7E6] bg-[#FFFDF8] px-3 py-2.5 text-sm font-semibold text-[#10233F] outline-none transition placeholder:text-slate-400 focus:border-[#FF5A0A] focus:ring-4 focus:ring-orange-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500"
      />
    </label>
  );
}

function Select({
  label,
  value,
  onChange,
  options = [],
  disabled = false,
}) {
  return (
    <label className="block">
      <span className="text-[11px] font-black uppercase tracking-[0.12em] text-[#10233F]">
        {label}
      </span>
      <select
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 min-h-11 min-w-0 w-full rounded-xl border-2 border-[#C9D7E6] bg-[#FFFDF8] px-3 py-2.5 text-sm font-bold text-[#10233F] outline-none transition focus:border-[#FF5A0A] focus:ring-4 focus:ring-orange-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500"
      >
        {options.map(([optionValue, optionLabel]) => (
          <option key={String(optionValue)} value={optionValue}>
            {optionLabel}
          </option>
        ))}
      </select>
    </label>
  );
}


function toZaifanMetricTone(tone = "") {
  const value = String(tone || "").trim().toLowerCase();

  if (
    value.includes("green") ||
    value.includes("emerald") ||
    value.includes("success") ||
    value.includes("healthy") ||
    value.includes("ready") ||
    value.includes("connected") ||
    value.includes("active") ||
    value.includes("live") ||
    value.includes("good")
  ) return "green";

  if (
    value.includes("red") ||
    value.includes("rose") ||
    value.includes("danger") ||
    value.includes("risk") ||
    value.includes("critical") ||
    value.includes("failed") ||
    value.includes("error") ||
    value.includes("blocked") ||
    value.includes("disconnected")
  ) return "red";

  if (
    value.includes("amber") ||
    value.includes("yellow") ||
    value.includes("warning") ||
    value.includes("warn") ||
    value.includes("attention") ||
    value.includes("paused")
  ) return "amber";

  if (value.includes("violet") || value.includes("purple")) return "violet";
  if (value.includes("orange") || value.includes("gold")) return "orange";
  if (value.includes("blue") || value.includes("cyan") || value.includes("teal") || value.includes("info")) return "blue";
  if (value.includes("slate") || value.includes("gray") || value.includes("grey") || value.includes("muted") || value.includes("neutral")) return "slate";

  return "navy";
}

export default PaymentCenterPanel;
