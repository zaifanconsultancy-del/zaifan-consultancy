// PaymentCenterPanel V4 MAXIMUM — Zaifan Student Finance OS
// Full replacement for: src/components/admin/PaymentCenterPanel.jsx
// Database-aligned with:
// - student_invoices
// - student_payments
// - student_receipts
// - payment_accounts
// Uses database reconciliation triggers as the source of truth.

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

function getInvoiceOutstanding(invoice = {}) {
  const total = Number(invoice.total_amount ?? invoice.amount ?? 0);
  const paid = Number(invoice.paid_amount ?? 0);
  return Number(invoice.outstanding_amount ?? Math.max(0, total - paid));
}

function isCollectibleInvoice(invoice = {}) {
  const status = normalize(invoice.status);
  return !["paid", "cancelled", "void"].includes(status) && getInvoiceOutstanding(invoice) > 0;
}

function isInvoiceOverdue(invoice = {}) {
  const status = normalize(invoice.status);
  if (status === "overdue") return true;
  if (!invoice.due_date || !isCollectibleInvoice(invoice)) return false;

  const due = new Date(invoice.due_date);
  if (Number.isNaN(due.getTime())) return false;
  due.setHours(23, 59, 59, 999);

  return due < new Date();
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
    ["overdue", "rejected", "failed", "cancelled", "void", "inactive"].includes(
      clean
    )
  ) {
    return "border-red-300 bg-red-50 text-red-800";
  }

  if (["partial", "pending", "pending_review", "unpaid", "draft"].includes(clean)) {
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
    () => activeInvoices.filter(isCollectibleInvoice),
    [activeInvoices]
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
      const paid = Number(invoice.paid_amount ?? 0);
      const outstanding = Number(
        invoice.outstanding_amount ?? Math.max(0, total - paid)
      );

      bucket.invoiced += total;
      bucket.outstanding += outstanding;

      if (isInvoiceOverdue(invoice)) {
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
    const overdueInvoices = activeInvoices.filter(isInvoiceOverdue);
    const openInvoices = activeInvoices.filter(isCollectibleInvoice);
    const pendingReceipts = receipts.filter(
      (receipt) => normalize(receipt.status) === "pending_review"
    );

    return {
      activeInvoices: activeInvoices.length,
      openInvoices: openInvoices.length,
      overdueInvoices: overdueInvoices.length,
      confirmedPayments: confirmedPayments.length,
      pendingReceipts: pendingReceipts.length,
    };
  }, [activeInvoices, confirmedPayments, receipts]);

  function showMessage(text, tone = "info") {
    setMessage(text);
    setMessageTone(tone);
  }

  async function refreshAll() {
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

  useEffect(() => {
    loadPaymentAccounts();
  }, []);

  useEffect(() => {
    if (!paymentForm.invoice_id) return;

    const invoice = invoices.find(
      (item) => String(item.id) === String(paymentForm.invoice_id)
    );

    if (!invoice) return;

    setPaymentForm((previous) => ({
      ...previous,
      currency: invoice.currency || "PKR",
      amount: String(getInvoiceOutstanding(invoice) || ""),
    }));
  }, [paymentForm.invoice_id, invoices]);

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
        const outstanding = getInvoiceOutstanding(invoice);

        if (!isCollectibleInvoice(invoice)) {
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

    if (cleanNext === "approved" && invoice && !isCollectibleInvoice(invoice)) {
      showMessage(
        "The linked invoice is already settled, cancelled, or void. Review the receipt before creating a payment.",
        "error"
      );
      return;
    }

    if (
      cleanNext === "approved" &&
      invoice &&
      Number(receipt.amount || 0) > getInvoiceOutstanding(invoice)
    ) {
      showMessage(
        `Receipt amount exceeds the linked invoice balance of ${formatMoney(
          getInvoiceOutstanding(invoice),
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
    <div className="space-y-5 pb-8 text-[#10233f]">
      <section className="rounded-[1.8rem] border-2 border-orange-400 bg-white p-5 shadow-[0_12px_30px_rgba(15,35,63,0.06)]">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge text="FINANCE OS" tone="orange" />
              <Badge text={safeStudentType.toUpperCase()} tone="navy" />
            </div>

            <h2 className="mt-3 text-2xl font-black text-[#10233f]">
              Student Finance Center
            </h2>
            <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-600">
              One financial record for {studentName}: invoices, confirmed money,
              outstanding balances, receipt verification and payment destinations.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <StudentNotificationComposer
              student={student}
              context="payment"
              buttonLabel="Send Payment Update"
              compact
            />

            <button
              type="button"
              onClick={refreshAll}
              className="rounded-xl border-2 border-slate-300 bg-white px-4 py-2.5 text-sm font-black text-[#10233f] transition hover:-translate-y-0.5 hover:border-orange-400 hover:bg-orange-50 active:translate-y-0"
            >
              Refresh Finance Data
            </button>
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
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
        </div>
      </section>

      {message ? (
        <div
          className={`flex items-start gap-3 rounded-2xl border-2 p-4 text-sm font-bold ${
            messageStyles[messageTone] || messageStyles.info
          }`}
          role={messageTone === "error" ? "alert" : "status"}
        >
          <span className="min-w-0 flex-1">{message}</span>
          <button
            type="button"
            onClick={() => setMessage("")}
            className="shrink-0 rounded-lg px-2 py-1 font-black transition hover:bg-black/5"
            aria-label="Dismiss finance message"
          >
            ×
          </button>
        </div>
      ) : null}

      <section className="rounded-[1.6rem] border-2 border-orange-300 bg-[#fffaf3] p-5">
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
          <div className="mt-4 grid gap-3 xl:grid-cols-2">
            {totalsByCurrency.map((row) => (
              <div
                key={row.currency}
                className="rounded-2xl border border-slate-300 bg-white p-4"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="font-black">{row.currency}</p>
                  <Badge text={row.currency} tone="navy" />
                </div>

                <div className="mt-3 grid gap-2 sm:grid-cols-4">
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

      <div className="grid gap-5 2xl:grid-cols-2">
        <form
          onSubmit={handleCreateInvoice}
          className="rounded-[1.6rem] border-2 border-orange-300 bg-white p-5"
        >
          <SectionHeading
            eyebrow="Receivable"
            title="Create Invoice"
            description="Use an invoice when Zaifan expects the student to pay a specific amount."
          />

          <div className="mt-5 grid gap-3 md:grid-cols-2">
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
            className="mt-4 rounded-xl bg-orange-500 px-5 py-3 text-sm font-black text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-orange-600 hover:shadow-md active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {invoiceSaving ? "Creating Invoice..." : "Create Invoice"}
          </button>
        </form>

        <form
          onSubmit={handleAddPayment}
          className="rounded-[1.6rem] border-2 border-orange-300 bg-white p-5"
        >
          <SectionHeading
            eyebrow="Money Received"
            title="Record Payment"
            description="Use this only after money has actually been received. Linked invoices reconcile automatically."
          />

          <div className="mt-5 grid gap-3 md:grid-cols-2">
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
                    invoice.outstanding_amount ??
                      invoice.total_amount ??
                      invoice.amount,
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
            <p className="mt-3 rounded-xl border border-blue-300 bg-blue-50 px-4 py-3 text-xs font-bold text-blue-900">
              Currency is locked to the selected invoice. This prevents
              cross-currency balance corruption.
            </p>
          ) : null}

          <button
            type="submit"
            disabled={paymentSaving}
            className="mt-4 rounded-xl bg-[#123865] px-5 py-3 text-sm font-black text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-[#0d2b50] hover:shadow-md active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {paymentSaving ? "Recording Payment..." : "Record Confirmed Payment"}
          </button>
        </form>
      </div>

      <section className="rounded-[1.6rem] border-2 border-orange-300 bg-white p-5">
        <SectionHeading
          eyebrow="Receivables Ledger"
          title="Invoices"
          description="Invoices remain in history. Cancel or void real records instead of deleting them."
        />

        <div className="mt-4 space-y-3">
          {invoices.length ? (
            invoices.map((invoice) => {
              const status = normalize(invoice.status);
              const total = Number(invoice.total_amount ?? invoice.amount ?? 0);
              const paid = Number(invoice.paid_amount ?? 0);
              const outstanding = Number(
                invoice.outstanding_amount ?? Math.max(0, total - paid)
              );

              return (
                <article
                  key={invoice.id}
                  className="rounded-2xl border border-slate-300 bg-[#fffaf3] p-4 transition hover:border-orange-400 hover:shadow-sm"
                >
                  <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="font-black text-[#10233f]">
                          {invoice.title || "Student Invoice"}
                        </h4>
                        <Badge text={invoice.status || "unpaid"} />
                        {isInvoiceOverdue(invoice) &&
                        normalize(invoice.status) !== "overdue" ? (
                          <Badge text="overdue by due date" />
                        ) : null}
                      </div>
                      <p className="mt-1 text-xs font-bold text-slate-500">
                        {invoice.invoice_number || "No invoice number"} ·{" "}
                        {invoice.category || "general"}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {!["cancelled", "void"].includes(status) ? (
                        <>
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
                        </>
                      ) : (
                        <ActionButton
                          onClick={() => changeInvoiceStatus(invoice, "unpaid")}
                          disabled={Boolean(actionSavingId)}
                        >
                          Restore
                        </ActionButton>
                      )}

                      <ActionButton
                        danger
                        onClick={() => deleteInvoice(invoice)}
                        disabled={Boolean(actionSavingId)}
                      >
                        Delete Test/Mistake
                      </ActionButton>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-5">
                    <Info label="Total" value={formatMoney(total, invoice.currency)} />
                    <Info label="Paid" value={formatMoney(paid, invoice.currency)} />
                    <Info
                      label="Outstanding"
                      value={formatMoney(outstanding, invoice.currency)}
                    />
                    <Info label="Due" value={formatDate(invoice.due_date)} />
                    <Info label="Issued" value={formatDate(invoice.issued_at)} />
                  </div>

                  <div className="mt-3 rounded-xl border border-slate-300 bg-white p-3">
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
                        className="h-full rounded-full bg-orange-500 transition-[width] duration-300"
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
                </article>
              );
            })
          ) : (
            <EmptyState text="No invoices created yet." />
          )}
        </div>
      </section>

      <section className="rounded-[1.6rem] border-2 border-orange-300 bg-white p-5">
        <SectionHeading
          eyebrow="Cash Ledger"
          title="Payments"
          description="Confirmed payments count toward invoices. Refund, cancel or fail a payment to remove it from the balance without destroying history."
        />

        <div className="mt-4 space-y-3">
          {payments.length ? (
            payments.map((payment) => {
              const status = normalize(payment.status);

              return (
                <article
                  key={payment.id}
                  className="rounded-2xl border border-slate-300 bg-[#fffaf3] p-4 transition hover:border-orange-400 hover:shadow-sm"
                >
                  <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="font-black">
                          {formatMoney(payment.amount, payment.currency)}
                        </h4>
                        <Badge text={payment.status || "confirmed"} />
                      </div>
                      <p className="mt-1 text-xs font-bold text-slate-500">
                        {payment.payment_method || "payment"} ·{" "}
                        {payment.reference || "No reference"}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
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
                  </div>

                  <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
                    <Info label="Paid at" value={formatDate(payment.paid_at)} />
                    <Info
                      label="Invoice link"
                      value={payment.invoice_id ? "Linked" : "General payment"}
                    />
                    <Info
                      label="Received by"
                      value={payment.received_by ? "Admin recorded" : "Not recorded"}
                    />
                    <Info label="Notes" value={payment.notes || "None"} />
                  </div>
                </article>
              );
            })
          ) : (
            <EmptyState text="No payments recorded yet." />
          )}
        </div>
      </section>

      <section className="rounded-[1.6rem] border-2 border-orange-300 bg-white p-5">
        <SectionHeading
          eyebrow="Evidence Review"
          title="Student Receipts"
          description="Approving a receipt creates one confirmed payment and then locks the receipt as converted."
        />

        <div className="mt-4 space-y-3">
          {receipts.length ? (
            receipts.map((receipt) => {
              const status = normalize(receipt.status);
              const busy = receiptSavingId === receipt.id;

              return (
                <article
                  key={receipt.id}
                  className="rounded-2xl border border-slate-300 bg-[#fffaf3] p-4"
                >
                  <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="font-black">
                          {receipt.file_name || "Payment Receipt"}
                        </h4>
                        <Badge text={receipt.status || "pending_review"} />
                      </div>

                      <p className="mt-2 text-sm text-slate-600">
                        {formatMoney(receipt.amount, receipt.currency)} · submitted{" "}
                        {formatDate(receipt.submitted_at || receipt.created_at)}
                      </p>

                      {receipt.notes ? (
                        <p className="mt-2 text-sm text-slate-600">{receipt.notes}</p>
                      ) : null}

                      {receipt.receipt_url ? (
                        <a
                          href={receipt.receipt_url}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-3 inline-flex rounded-lg border border-orange-300 bg-white px-3 py-2 text-xs font-black text-orange-800 transition hover:bg-orange-50"
                        >
                          Open Receipt
                        </a>
                      ) : null}
                    </div>

                    {status === "pending_review" ? (
                      <div className="flex flex-wrap gap-2">
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
                    ) : (
                      <p className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-600">
                        {status === "converted_to_payment"
                          ? "Converted — no duplicate payment can be created"
                          : "Review completed"}
                      </p>
                    )}
                  </div>
                </article>
              );
            })
          ) : (
            <EmptyState text="No student receipts submitted yet." />
          )}
        </div>
      </section>

      <div className="grid gap-5 2xl:grid-cols-2">
        <form
          onSubmit={handleSavePaymentAccount}
          className="rounded-[1.6rem] border-2 border-orange-300 bg-white p-5"
        >
          <SectionHeading
            eyebrow="Collection Setup"
            title="Add Payment Account"
            description="Bank or wallet details students can use when paying Zaifan."
          />

          <div className="mt-5 grid gap-3 md:grid-cols-2">
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
            <span className="text-[11px] font-black uppercase tracking-[0.12em] text-[#10233f]">
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
              className="mt-2 min-h-[88px] w-full rounded-xl border-2 border-slate-300 bg-[#fffdf9] px-3 py-2.5 text-sm font-semibold text-[#10233f] outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
            />
          </label>

          <button
            type="submit"
            disabled={accountSaving}
            className="mt-4 rounded-xl bg-orange-500 px-5 py-3 text-sm font-black text-white transition hover:-translate-y-0.5 hover:bg-orange-600 active:translate-y-0 disabled:opacity-50"
          >
            {accountSaving ? "Saving..." : "Save Payment Account"}
          </button>
        </form>

        <section className="rounded-[1.6rem] border-2 border-orange-300 bg-white p-5">
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
                  className="rounded-2xl border border-slate-300 bg-[#fffaf3] p-4"
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
                    <p className="mt-3 rounded-xl border border-slate-300 bg-white p-3 text-sm font-semibold text-slate-600">
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

      {paymentRequests.length ? (
        <section className="rounded-[1.6rem] border-2 border-orange-300 bg-white p-5">
          <SectionHeading
            eyebrow="Student Portal"
            title="Payment Requests"
            description="Requests already supplied to this panel by the Student OS."
          />
          <div className="mt-4 grid gap-3 lg:grid-cols-2">
            {paymentRequests.map((request) => (
              <article
                key={request.id}
                className="rounded-2xl border border-slate-300 bg-[#fffaf3] p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="font-black">
                    {request.title || request.category || "Payment Request"}
                  </p>
                  <Badge text={request.status || "pending"} />
                </div>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  <Info
                    label="Amount"
                    value={formatMoney(request.amount, request.currency || "PKR")}
                  />
                  <Info
                    label="Created"
                    value={formatDate(request.created_at || request.requested_at)}
                  />
                </div>
              </article>
            ))}
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

function SectionHeading({ eyebrow, title, description }) {
  return (
    <div>
      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-700">
        {eyebrow}
      </p>
      <h3 className="mt-1 text-lg font-black text-[#10233f]">{title}</h3>
      <p className="mt-1 text-sm leading-5 text-slate-600">{description}</p>
    </div>
  );
}

function Metric({ label, value, tone = "default" }) {
  const tones = {
    default: "border-slate-300 bg-[#fffaf3]",
    success: "border-emerald-300 bg-emerald-50",
    warning: "border-amber-300 bg-amber-50",
    danger: "border-red-300 bg-red-50",
  };

  return (
    <div className={`rounded-xl border-2 p-3 ${tones[tone] || tones.default}`}>
      <p className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-600">
        {label}
      </p>
      <p className="mt-1 text-xl font-black text-[#10233f]">{value}</p>
    </div>
  );
}

function Badge({ text, tone = "" }) {
  const custom =
    tone === "orange"
      ? "border-orange-300 bg-orange-50 text-orange-800"
      : tone === "navy"
        ? "border-[#123865] bg-[#123865] text-white"
        : statusClass(text);

  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.08em] ${custom}`}
    >
      {String(text || "unknown").replaceAll("_", " ")}
    </span>
  );
}

function Info({ label, value }) {
  return (
    <div className="rounded-xl border border-slate-300 bg-white px-3 py-2.5">
      <p className="text-[9px] font-black uppercase tracking-[0.12em] text-slate-500">
        {label}
      </p>
      <p className="mt-1 break-words text-sm font-black text-[#10233f]">
        {value ?? "Not set"}
      </p>
    </div>
  );
}

function EmptyState({ text }) {
  return (
    <div className="rounded-2xl border-2 border-dashed border-slate-300 bg-[#fffaf3] p-6 text-center text-sm font-bold text-slate-500">
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
      : "border-slate-300 bg-white text-[#10233f] hover:border-orange-400 hover:bg-orange-50";

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`rounded-lg border-2 px-3 py-2 text-xs font-black shadow-sm transition hover:-translate-y-0.5 hover:shadow-md active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-45 ${style}`}
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
      <span className="text-[11px] font-black uppercase tracking-[0.12em] text-[#10233f]">
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
        className="mt-2 w-full rounded-xl border-2 border-slate-300 bg-[#fffdf9] px-3 py-2.5 text-sm font-semibold text-[#10233f] outline-none transition placeholder:text-slate-400 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500"
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
      <span className="text-[11px] font-black uppercase tracking-[0.12em] text-[#10233f]">
        {label}
      </span>
      <select
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 w-full rounded-xl border-2 border-slate-300 bg-[#fffdf9] px-3 py-2.5 text-sm font-bold text-[#10233f] outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500"
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

export default PaymentCenterPanel;
