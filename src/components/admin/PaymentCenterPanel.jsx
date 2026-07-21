// PaymentCenterPanel V2 — High Contrast Admin OS Edition
// Preserves Supabase invoice/payment/account/receipt logic, reconciliation,
// CRM timeline events, confirmation flows, deletion, and shared-data refresh.
// Visual layer aligned with Zaifan cream + white + navy + orange Admin OS.

import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import { addTimelineEvent } from "../../lib/crmTimeline";

function normalize(value = "") {
  return String(value || "").toLowerCase().trim().replace(/\s+/g, "_").replace(/-/g, "_");
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
  return `${currency} ${Number(amount || 0).toLocaleString()}`;
}

function statusClass(value = "") {
  const clean = normalize(value);
  if (["paid", "confirmed", "approved", "completed", "active"].includes(clean)) {
    return "border-emerald-300 bg-emerald-50 text-emerald-700";
  }
  if (["overdue", "rejected", "cancelled", "void", "inactive"].includes(clean)) {
    return "border-red-300 bg-red-50 text-red-700";
  }
  if (["pending", "pending_review", "partial", "unpaid"].includes(clean)) {
    return "border-amber-300 bg-amber-50 text-amber-700";
  }
  return "border-slate-300 bg-slate-50 text-slate-700";
}

function getStudentId(student = {}) {
  return String(student.id || student.student_id || "").trim();
}

function getStudentType(student = {}, fallback = "inquiry") {
  return student.student_type || student.__leadType || student.type || fallback || "inquiry";
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
  const [receiptSaving, setReceiptSaving] = useState(false);
  const [deleteSavingId, setDeleteSavingId] = useState(null);
  const [message, setMessage] = useState("");

  const studentId = getStudentId(student);
  const safeStudentType = getStudentType(student, studentType);

  const totals = useMemo(() => {
    const invoiceTotal = invoices.reduce(
      (sum, row) => sum + Number(row.total_amount || row.amount || 0),
      0
    );
    const paidTotal = payments.reduce((sum, row) => sum + Number(row.amount || 0), 0);
    const pendingTotal = Math.max(0, invoiceTotal - paidTotal);
    const overdue = invoices.filter((invoice) => {
      if (!invoice.due_date) return false;
      const status = normalize(invoice.status);
      if (["paid", "cancelled", "void"].includes(status)) return false;
      return new Date(invoice.due_date).getTime() < new Date().setHours(0, 0, 0, 0);
    });

    return { invoiceTotal, paidTotal, pendingTotal, overdue };
  }, [invoices, payments]);

  async function loadPaymentAccounts() {
    setAccountLoading(true);

    try {
      const baseSelect = () => supabase.from("payment_accounts").select("*");

      let result = await baseSelect()
        .order("is_active", { ascending: false })
        .order("created_at", { ascending: false });

      if (result.error) {
        result = await baseSelect().order("id", { ascending: false });
      }

      if (result.error) throw result.error;

      const rows = Array.isArray(result.data) ? result.data : [];
      setPaymentAccounts(
        rows.sort((a, b) => Number(Boolean(b.is_active)) - Number(Boolean(a.is_active)))
      );
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
      console.warn("Payment timeline event skipped:", error?.message || error);
    }
  }

  async function handleSavePaymentAccount(event) {
    event.preventDefault();

    setAccountSaving(true);
    setMessage("");

    try {
      if (!accountForm.account_title.trim()) {
        throw new Error("Account title is required.");
      }

      const payload = {
        account_type: accountForm.account_type || "bank",
        account_title: accountForm.account_title.trim(),
        bank_name: accountForm.bank_name || null,
        account_number: accountForm.account_number || null,
        iban: accountForm.iban || null,
        mobile_wallet_number: accountForm.mobile_wallet_number || null,
        instructions: accountForm.instructions || null,
        is_active: Boolean(accountForm.is_active),
        created_by: adminProfile?.id || null,
        updated_at: new Date().toISOString(),
      };

      const confirmed = window.confirm(
        `Save payment account?\n\n${payload.account_title}\nType: ${payload.account_type}\n\nStudents may use this account for manual payments.`
      );

      if (!confirmed) return;

      let { error } = await supabase.from("payment_accounts").insert(payload);

      if (error) {
        const minimalPayload = {
          account_type: payload.account_type,
          account_title: payload.account_title,
          bank_name: payload.bank_name,
          account_number: payload.account_number,
          iban: payload.iban,
          mobile_wallet_number: payload.mobile_wallet_number,
          instructions: payload.instructions,
          is_active: payload.is_active,
        };

        const retry = await supabase.from("payment_accounts").insert(minimalPayload);
        error = retry.error;
      }

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

      setMessage("Payment account saved.");
      await loadPaymentAccounts();
    } catch (error) {
      setMessage(error?.message || "Payment account could not be saved.");
    } finally {
      setAccountSaving(false);
    }
  }

  async function togglePaymentAccount(account) {
    setAccountSaving(true);
    setMessage("");

    try {
      const nextActive = !account.is_active;

      let { error } = await supabase
        .from("payment_accounts")
        .update({
          is_active: nextActive,
          updated_at: new Date().toISOString(),
        })
        .eq("id", account.id);

      if (error) {
        const retry = await supabase
          .from("payment_accounts")
          .update({ is_active: nextActive })
          .eq("id", account.id);

        error = retry.error;
      }

      if (error) throw error;

      setMessage(nextActive ? "Payment account activated." : "Payment account deactivated.");
      await loadPaymentAccounts();
    } catch (error) {
      setMessage(error?.message || "Payment account status could not be updated.");
    } finally {
      setAccountSaving(false);
    }
  }

  async function deletePaymentAccount(account) {
    const confirmed = window.confirm(
      `Delete payment account?\n\n${account.account_title}\n\nOnly delete if this was created by mistake.`
    );

    if (!confirmed) return;

    setAccountSaving(true);
    setMessage("");

    try {
      const { error } = await supabase.from("payment_accounts").delete().eq("id", account.id);

      if (error) throw error;

      setMessage("Payment account deleted.");
      await loadPaymentAccounts();
    } catch (error) {
      setMessage(error?.message || "Payment account could not be deleted.");
    } finally {
      setAccountSaving(false);
    }
  }

  async function handleCreateInvoice(event) {
    event.preventDefault();
    if (!studentId) return;

    setInvoiceSaving(true);
    setMessage("");

    try {
      const amount = Number(invoiceForm.amount || 0);
      if (!amount || amount <= 0) throw new Error("Enter a valid invoice amount.");

      const confirmed = window.confirm(
        `Create invoice for ${formatMoney(amount, invoiceForm.currency || "PKR")}?\n\nStudent: ${
          student.full_name || student.name || "Student"
        }\nTitle: ${invoiceForm.title || "Student Invoice"}\n\nConfirm only if the amount is correct.`
      );

      if (!confirmed) return;

      const payload = {
        student_id: studentId,
        student_type: safeStudentType,
        title: invoiceForm.title || "Student Invoice",
        description: invoiceForm.description || "",
        amount,
        currency: invoiceForm.currency || "PKR",
        due_date: invoiceForm.due_date || null,
        category: invoiceForm.category || "general",
        status: "unpaid",
        created_by: adminProfile?.id || null,
        metadata: { created_from: "admin_payment_center" },
      };

      const { data, error } = await supabase
        .from("student_invoices")
        .insert(payload)
        .select("*")
        .single();

      if (error) throw error;

      await createTimeline("Invoice Created", `${payload.title} was created.`, {
        invoice_id: data?.id || null,
        amount,
        currency: payload.currency,
      });

      setInvoiceForm((prev) => ({
        ...prev,
        amount: "",
        due_date: "",
        description: "",
      }));

      setMessage("Invoice created successfully.");
      await onSharedDataChange();
    } catch (error) {
      setMessage(error?.message || "Invoice could not be created.");
    } finally {
      setInvoiceSaving(false);
    }
  }

  async function reconcileInvoice(invoiceId) {
    if (!invoiceId) return;

    let invoice = invoices.find((item) => String(item.id) === String(invoiceId));

    if (!invoice) {
      const { data, error } = await supabase
        .from("student_invoices")
        .select("*")
        .eq("id", invoiceId)
        .maybeSingle();

      if (error) throw error;
      invoice = data || null;
    }

    const invoiceAmount = Number(invoice?.total_amount || invoice?.amount || 0);

    if (!invoiceAmount || invoiceAmount <= 0) return;

    const { data: invoicePayments, error: paymentsError } = await supabase
      .from("student_payments")
      .select("amount, status")
      .eq("invoice_id", invoiceId)
      .in("status", ["confirmed", "paid", "approved", "completed"]);

    if (paymentsError) throw paymentsError;

    const paidTotal = (invoicePayments || []).reduce(
      (sum, payment) => sum + Number(payment.amount || 0),
      0
    );

    const nextStatus =
      paidTotal >= invoiceAmount ? "paid" : paidTotal > 0 ? "partial" : "unpaid";

    const { error: invoiceError } = await supabase
      .from("student_invoices")
      .update({
        status: nextStatus,
        paid_amount: paidTotal,
        outstanding_amount: Math.max(0, invoiceAmount - paidTotal),
        paid_at: nextStatus === "paid" ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", invoiceId);

    if (invoiceError) throw invoiceError;

    await createTimeline(
      nextStatus === "paid" ? "Invoice Paid" : "Invoice Partially Paid",
      `Invoice was reconciled. Paid ${formatMoney(
        paidTotal,
        invoice?.currency || "PKR"
      )} of ${formatMoney(invoiceAmount, invoice?.currency || "PKR")}.`,
      {
        invoice_id: invoiceId,
        invoice_amount: invoiceAmount,
        paid_total: paidTotal,
        outstanding_amount: Math.max(0, invoiceAmount - paidTotal),
        status: nextStatus,
      }
    );
  }

  async function handleAddPayment(event) {
    event.preventDefault();
    if (!studentId) return;

    setPaymentSaving(true);
    setMessage("");

    try {
      const amount = Number(paymentForm.amount || 0);
      if (!amount || amount <= 0) throw new Error("Enter a valid payment amount.");

      const selectedInvoice = invoices.find(
        (item) => String(item.id) === String(paymentForm.invoice_id)
      );

      const confirmed = window.confirm(
        `Add payment of ${formatMoney(amount, paymentForm.currency || "PKR")}?\n\nStudent: ${
          student.full_name || student.name || "Student"
        }\nInvoice: ${
          selectedInvoice?.title || selectedInvoice?.invoice_number || "General payment"
        }\n\nConfirm only if the amount is correct.`
      );

      if (!confirmed) return;

      const payload = {
        student_id: studentId,
        student_type: safeStudentType,
        invoice_id: paymentForm.invoice_id || null,
        amount,
        currency: paymentForm.currency || "PKR",
        payment_method: paymentForm.payment_method || "cash",
        reference: paymentForm.reference || "",
        notes: paymentForm.notes || "",
        status: "confirmed",
        received_by: adminProfile?.id || null,
        paid_at: new Date().toISOString(),
        metadata: { created_from: "admin_payment_center" },
      };

      const { data, error } = await supabase
        .from("student_payments")
        .insert(payload)
        .select("*")
        .single();

      if (error) throw error;

      await createTimeline(
        "Payment Added",
        `Payment of ${formatMoney(amount, payload.currency)} was added.`,
        {
          payment_id: data?.id || null,
          invoice_id: payload.invoice_id,
          amount,
          currency: payload.currency,
        }
      );

      if (payload.invoice_id) {
        await reconcileInvoice(payload.invoice_id);
      }

      setPaymentForm((prev) => ({
        ...prev,
        invoice_id: "",
        amount: "",
        reference: "",
        notes: "",
      }));

      setMessage(
        payload.invoice_id
          ? "Payment added and invoice reconciled successfully."
          : "Payment added successfully."
      );

      await onSharedDataChange();
    } catch (error) {
      setMessage(error?.message || "Payment could not be added.");
    } finally {
      setPaymentSaving(false);
    }
  }

  async function deleteInvoice(invoice) {
    const amount = Number(invoice.total_amount || invoice.amount || 0);

    const confirmed = window.confirm(
      `Delete this invoice?\n\n${invoice.title || "Student Invoice"}\nAmount: ${formatMoney(
        amount,
        invoice.currency || "PKR"
      )}\n\nThis should only be used for mistakes.`
    );

    if (!confirmed) return;

    setDeleteSavingId(invoice.id);
    setMessage("");

    try {
      const { error } = await supabase
        .from("student_invoices")
        .delete()
        .eq("id", invoice.id);

      if (error) throw error;

      await createTimeline("Invoice Deleted", "An incorrect invoice was deleted.", {
        invoice_id: invoice.id,
        amount,
        currency: invoice.currency || "PKR",
      });

      setMessage("Invoice deleted.");
      await onSharedDataChange();
    } catch (error) {
      setMessage(error?.message || "Invoice could not be deleted.");
    } finally {
      setDeleteSavingId(null);
    }
  }
async function deletePayment(payment) {
  const amount = Number(payment.amount || 0);

  const confirmed = window.confirm(
    `Delete this payment?\n\nAmount: ${formatMoney(
      amount,
      payment.currency || "PKR"
    )}\nMethod: ${
      payment.payment_method || "Payment"
    }\n\nOnly delete if this payment was entered by mistake.`
  );

  if (!confirmed) return;

  setDeleteSavingId(payment.id);
  setPaymentSaving(true);
  setMessage("");

  try {
    const invoiceId = payment.invoice_id || null;

    const { error } = await supabase
      .from("student_payments")
      .delete()
      .eq("id", payment.id);

    if (error) throw error;

    await createTimeline("Payment Deleted", "An incorrect payment was deleted.", {
      payment_id: payment.id,
      invoice_id: invoiceId,
      amount,
      currency: payment.currency || "PKR",
    });

    if (invoiceId) {
      await reconcileInvoice(invoiceId);
    }

    setMessage("Payment deleted.");
    await onSharedDataChange();
  } catch (error) {
    setMessage(error?.message || "Payment could not be deleted.");
  } finally {
    setPaymentSaving(false);
    setDeleteSavingId(null);
  }
}
  async function updateReceiptStatus(receipt, status) {
  setReceiptSaving(true);
  setMessage("");

  try {
    const confirmed = window.confirm(`Mark this receipt as ${status}?`);
    if (!confirmed) return;

    const alreadyProcessed = ["approved", "rejected"].includes(
      normalize(receipt.status)
    );

    if (alreadyProcessed) {
      throw new Error("Receipt has already been reviewed.");
    }

    if (status === "approved" && Number(receipt.amount || 0) <= 0) {
      throw new Error("Receipt amount is missing. Add an amount before approving.");
    }

    const reviewedAt = new Date().toISOString();

    const { error } = await supabase
      .from("student_receipts")
      .update({
        status,
        review_status: status,
        reviewed_by: adminProfile?.id || null,
        reviewed_at: reviewedAt,
        updated_at: reviewedAt,
      })
      .eq("id", receipt.id);

    if (error) throw error;

    if (status === "approved") {
      const paymentPayload = {
        student_id: receipt.student_id || studentId,
        student_type: receipt.student_type || safeStudentType,
        invoice_id: receipt.invoice_id || null,
        amount: Number(receipt.amount || 0),
        currency: receipt.currency || "PKR",
        payment_method: "receipt_upload",
        reference: receipt.reference || "",
        notes: receipt.notes || "",
        status: "confirmed",
        paid_at: new Date().toISOString(),
        received_by: adminProfile?.id || null,
        metadata: {
          receipt_id: receipt.id,
          auto_created_from_receipt: true,
        },
      };

      const existingPayment = await supabase
        .from("student_payments")
        .select("id")
        .eq("student_id", receipt.student_id || studentId)
        .eq("payment_method", "receipt_upload")
        .eq("metadata->>receipt_id", String(receipt.id))
        .maybeSingle();

      if (existingPayment.error) {
        console.warn("Receipt duplicate-payment check skipped:", existingPayment.error?.message || existingPayment.error);
      }

      if (!existingPayment.data?.id) {
        const { error: paymentError } = await supabase
          .from("student_payments")
          .insert(paymentPayload);

        if (paymentError) throw paymentError;
      }

      if (receipt.invoice_id) {
        await reconcileInvoice(receipt.invoice_id);
      }

      await createTimeline(
        "Receipt Approved",
        "Receipt approved and payment created automatically.",
        {
          receipt_id: receipt.id,
          invoice_id: receipt.invoice_id,
          amount: receipt.amount,
        }
      );
    }

    if (status === "rejected") {
      await createTimeline(
        "Receipt Rejected",
        "Uploaded receipt was rejected.",
        {
          receipt_id: receipt.id,
        }
      );
    }

    setMessage(`Receipt ${status}.`);
    await onSharedDataChange();
  } catch (error) {
    setMessage(error?.message || "Receipt status could not be updated.");
  } finally {
    setReceiptSaving(false);
  }
}

  return (
    <div className="space-y-5">
      <div className="rounded-[1.75rem] border border-orange-200 bg-[#fff8ee] p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-orange-700">
          Payment OS Foundation
        </p>
        <h3 className="mt-2 text-xl font-black text-[#10233f]">
          Payment Center + Invoices
        </h3>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Create invoices, add confirmed payments, review student receipt uploads, manage payment accounts, and keep payment history connected to the student timeline.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <SummaryCard label="Invoice Total" value={formatMoney(totals.invoiceTotal, invoices[0]?.currency || "PKR")} />
        <SummaryCard label="Paid" value={formatMoney(totals.paidTotal, payments[0]?.currency || "PKR")} />
        <SummaryCard label="Pending" value={formatMoney(totals.pendingTotal, invoices[0]?.currency || "PKR")} />
        <SummaryCard label="Overdue" value={totals.overdue.length} />
      </div>

      {message ? (
        <div className="rounded-2xl border border-slate-300 bg-white p-4 text-sm text-slate-700">
          {message}
        </div>
      ) : null}

      <div className="grid gap-5 xl:grid-cols-2">
        <form onSubmit={handleSavePaymentAccount} className="rounded-[1.5rem] border border-orange-200 bg-[#fff8ee] p-5">
          <p className="text-sm font-black text-[#10233f]">Payment Accounts</p>
          <p className="mt-2 text-xs leading-5 text-slate-600">
            Add bank, JazzCash, Easypaisa, or manual payment details students will use.
          </p>

          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <Select
              label="Type"
              value={accountForm.account_type}
              onChange={(value) => setAccountForm((prev) => ({ ...prev, account_type: value }))}
              options={[
                ["bank", "Bank"],
                ["jazzcash", "JazzCash"],
                ["easypaisa", "Easypaisa"],
                ["manual", "Manual"],
              ]}
            />

            <Input label="Account Title" value={accountForm.account_title} onChange={(value) => setAccountForm((prev) => ({ ...prev, account_title: value }))} />
            <Input label="Bank Name" value={accountForm.bank_name} onChange={(value) => setAccountForm((prev) => ({ ...prev, bank_name: value }))} />
            <Input label="Account Number" value={accountForm.account_number} onChange={(value) => setAccountForm((prev) => ({ ...prev, account_number: value }))} />
            <Input label="IBAN" value={accountForm.iban} onChange={(value) => setAccountForm((prev) => ({ ...prev, iban: value }))} />
            <Input label="Wallet Number" value={accountForm.mobile_wallet_number} onChange={(value) => setAccountForm((prev) => ({ ...prev, mobile_wallet_number: value }))} />
            <label className="space-y-2 md:col-span-2">
              <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                Instructions
              </span>
              <textarea
                value={accountForm.instructions}
                onChange={(event) => setAccountForm((prev) => ({ ...prev, instructions: event.target.value }))}
                className="min-h-[90px] w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-[#10233f] outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
              />
            </label>
          </div>

          <button
            type="submit"
            disabled={accountSaving}
            className="mt-4 rounded-full bg-orange-500 px-5 py-3 text-sm font-black text-white shadow-[0_8px_18px_rgba(249,115,22,0.18)] transition hover:bg-orange-600 disabled:opacity-50"
          >
            {accountSaving ? "Saving..." : "Save Payment Account"}
          </button>
        </form>

        <Section
          title={accountLoading ? "Payment Accounts Loading..." : "Active Payment Accounts"}
          empty="No payment accounts added yet."
          rows={paymentAccounts}
          render={(account) => (
            <div key={account.id} className="rounded-2xl border border-slate-300 bg-white p-4 shadow-[0_5px_16px_rgba(15,35,63,0.035)]">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-black text-[#10233f]">{account.account_title}</p>
                  <p className="mt-1 text-xs uppercase tracking-[0.16em] text-slate-500">
                    {account.account_type}
                  </p>
                </div>

                <span className={`rounded-full border px-3 py-1 text-xs font-bold ${statusClass(account.is_active ? "active" : "inactive")}`}>
                  {account.is_active ? "active" : "inactive"}
                </span>
              </div>

              <div className="mt-3 grid gap-2 text-sm text-slate-600 md:grid-cols-2">
                {account.bank_name ? <Info label="Bank" value={account.bank_name} /> : null}
                {account.account_number ? <Info label="Account No" value={account.account_number} /> : null}
                {account.iban ? <Info label="IBAN" value={account.iban} /> : null}
                {account.mobile_wallet_number ? <Info label="Wallet" value={account.mobile_wallet_number} /> : null}
              </div>

              {account.instructions ? (
                <p className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm leading-6 text-slate-600">
                  {account.instructions}
                </p>
              ) : null}

              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => togglePaymentAccount(account)}
                  disabled={accountSaving}
                  className="rounded-full border border-orange-300 bg-orange-50 px-4 py-2 text-xs font-black text-orange-700 disabled:opacity-50"
                >
                  {account.is_active ? "Deactivate" : "Activate"}
                </button>

                <button
                  type="button"
                  onClick={() => deletePaymentAccount(account)}
                  disabled={accountSaving}
                  className="rounded-full border border-red-300 bg-red-50 px-4 py-2 text-xs font-black text-red-700 disabled:opacity-50"
                >
                  Delete
                </button>
              </div>
            </div>
          )}
        />
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <form onSubmit={handleCreateInvoice} className="rounded-[1.5rem] border border-slate-300 bg-white p-5 shadow-[0_8px_22px_rgba(15,35,63,0.04)]">
          <p className="text-sm font-black text-[#10233f]">Create Invoice</p>

          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <Input label="Title" value={invoiceForm.title} onChange={(value) => setInvoiceForm((prev) => ({ ...prev, title: value }))} />
            <Input label="Amount" type="number" value={invoiceForm.amount} onChange={(value) => setInvoiceForm((prev) => ({ ...prev, amount: value }))} />
            <Input label="Currency" value={invoiceForm.currency} onChange={(value) => setInvoiceForm((prev) => ({ ...prev, currency: value }))} />
            <Input label="Due Date" type="date" value={invoiceForm.due_date} onChange={(value) => setInvoiceForm((prev) => ({ ...prev, due_date: value }))} />
            <Input label="Category" value={invoiceForm.category} onChange={(value) => setInvoiceForm((prev) => ({ ...prev, category: value }))} />
            <Input label="Description" value={invoiceForm.description} onChange={(value) => setInvoiceForm((prev) => ({ ...prev, description: value }))} />
          </div>

          <button type="submit" disabled={invoiceSaving} className="mt-4 rounded-full bg-orange-500 px-5 py-3 text-sm font-black text-white shadow-[0_8px_18px_rgba(249,115,22,0.18)] transition hover:bg-orange-600 disabled:opacity-50">
            {invoiceSaving ? "Saving..." : "Create Invoice"}
          </button>
        </form>

        <form onSubmit={handleAddPayment} className="rounded-[1.5rem] border border-slate-300 bg-white p-5 shadow-[0_8px_22px_rgba(15,35,63,0.04)]">
          <p className="text-sm font-black text-[#10233f]">Add Payment</p>

          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <label className="space-y-2">
              <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Invoice</span>
              <select
                value={paymentForm.invoice_id}
                onChange={(event) => setPaymentForm((prev) => ({ ...prev, invoice_id: event.target.value }))}
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-[#10233f] outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
              >
                <option value="">No invoice / general payment</option>
                {invoices.map((invoice) => (
                  <option key={invoice.id} value={invoice.id}>
                    {invoice.title || invoice.invoice_number || "Invoice"} — {formatMoney(invoice.total_amount || invoice.amount, invoice.currency || "PKR")}
                  </option>
                ))}
              </select>
            </label>

            <Input label="Amount" type="number" value={paymentForm.amount} onChange={(value) => setPaymentForm((prev) => ({ ...prev, amount: value }))} />
            <Input label="Currency" value={paymentForm.currency} onChange={(value) => setPaymentForm((prev) => ({ ...prev, currency: value }))} />
            <Input label="Method" value={paymentForm.payment_method} onChange={(value) => setPaymentForm((prev) => ({ ...prev, payment_method: value }))} />
            <Input label="Reference" value={paymentForm.reference} onChange={(value) => setPaymentForm((prev) => ({ ...prev, reference: value }))} />
            <Input label="Notes" value={paymentForm.notes} onChange={(value) => setPaymentForm((prev) => ({ ...prev, notes: value }))} />
          </div>

          <button type="submit" disabled={paymentSaving} className="mt-4 rounded-full bg-[#10233f] px-5 py-3 text-sm font-black text-white shadow-[0_8px_18px_rgba(15,35,63,0.16)] transition hover:bg-[#18385f] disabled:opacity-50">
            {paymentSaving ? "Saving..." : "Add Payment"}
          </button>
        </form>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <Section
          title="Invoices"
          empty="No invoices created yet."
          rows={invoices}
          render={(invoice) => (
            <div key={invoice.id} className="space-y-3">
              <PaymentCard
                title={invoice.title || invoice.invoice_number || "Student Invoice"}
                status={invoice.status || "unpaid"}
                lines={[
                  ["Amount", formatMoney(invoice.total_amount || invoice.amount, invoice.currency || "PKR")],
                  ["Due", formatDate(invoice.due_date)],
                  ["Category", invoice.category || "General"],
                ]}
              />

              <button
                type="button"
                onClick={() => deleteInvoice(invoice)}
                disabled={Boolean(deleteSavingId)}
                className="rounded-full border border-red-300 bg-red-50 px-4 py-2 text-xs font-black text-red-700 disabled:opacity-50"
              >
                {deleteSavingId === invoice.id ? "Deleting..." : "Delete Wrong Invoice"}
              </button>
            </div>
          )}
        />

        <Section
  title="Payments"
  empty="No payments added yet."
  rows={payments}
  render={(payment) => (
    <div key={payment.id} className="space-y-3">
      <PaymentCard
        title={payment.reference || payment.payment_method || "Payment"}
        status={payment.status || "confirmed"}
        lines={[
          ["Amount", formatMoney(payment.amount, payment.currency || "PKR")],
          ["Paid", formatDate(payment.paid_at || payment.created_at)],
          ["Method", payment.payment_method || "Not set"],
        ]}
      />

      <button
        type="button"
        onClick={() => deletePayment(payment)}
        disabled={Boolean(deleteSavingId) || paymentSaving}
        className="rounded-full border border-red-300 bg-red-50 px-4 py-2 text-xs font-black text-red-700 disabled:opacity-50"
      >
        {deleteSavingId === payment.id ? "Deleting..." : "Delete Wrong Payment"}
      </button>
    </div>
  )}
/>
      </div>

      <Section
        title="Receipt Review"
        empty="No receipt uploads waiting."
        rows={receipts}
        render={(receipt) => (
          <div key={receipt.id} className="rounded-2xl border border-slate-300 bg-white p-4 shadow-[0_5px_16px_rgba(15,35,63,0.035)]">
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div>
                <p className="font-black text-[#10233f]">{receipt.receipt_url ? "Receipt Uploaded" : "Receipt Submitted"}</p>
                <p className="mt-1 text-sm text-slate-600">{receipt.notes || "No receipt notes."}</p>
                <div className="mt-3 grid gap-2 text-sm text-slate-600 md:grid-cols-3">
                  <span>{formatMoney(receipt.amount, receipt.currency || "PKR")}</span>
                  <span>{formatDate(receipt.submitted_at || receipt.created_at)}</span>
                  <span className={`w-fit rounded-full border px-3 py-1 text-xs font-bold ${statusClass(receipt.status)}`}>
                    {receipt.status || "pending_review"}
                  </span>
                </div>
                {receipt.receipt_url ? (
                  <a href={receipt.receipt_url} target="_blank" rel="noreferrer" className="mt-3 inline-block text-sm font-bold text-orange-700">
                    Open Receipt
                  </a>
                ) : null}
              </div>

              <div className="flex gap-2">
                <button type="button" onClick={() => updateReceiptStatus(receipt, "approved")} disabled={
  receiptSaving ||
  ["approved", "rejected"].includes(normalize(receipt.status))
} className="rounded-full border border-emerald-300 bg-emerald-50 px-4 py-2 text-xs font-black text-emerald-700 disabled:opacity-50">
                  Approve
                </button>
                <button type="button" onClick={() => updateReceiptStatus(receipt, "rejected")} disabled={
  receiptSaving ||
  ["approved", "rejected"].includes(normalize(receipt.status))
} className="rounded-full border border-red-300 bg-red-50 px-4 py-2 text-xs font-black text-red-700 disabled:opacity-50">
                  Reject
                </button>
              </div>
            </div>
          </div>
        )}
      />

      <Section
        title="Counselor Payment Requests"
        empty="No counselor payment requests yet."
        rows={paymentRequests}
        render={(request) => (
          <PaymentCard
            key={request.id}
            title={request.title || "Payment Request"}
            status={request.status || "pending"}
            lines={[
              ["Amount", formatMoney(request.amount, request.currency || "PKR")],
              ["Requested", formatDate(request.created_at)],
              ["Note", request.message || request.notes || "No note"],
            ]}
          />
        )}
      />
    </div>
  );
}

function SummaryCard({ label, value }) {
  return (
    <div className="rounded-2xl border border-slate-300 bg-white p-4 shadow-[0_5px_16px_rgba(15,35,63,0.035)]">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-black text-[#10233f]">{value}</p>
    </div>
  );
}

function Info({ label, value }) {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">{label}</p>
      <p className="mt-1 break-words">{value}</p>
    </div>
  );
}

function Input({ label, value, onChange, type = "text" }) {
  return (
    <label className="space-y-2">
      <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-[#10233f] outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
      />
    </label>
  );
}

function Select({ label, value, onChange, options = [] }) {
  return (
    <label className="space-y-2">
      <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-[#10233f] outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
      >
        {options.map(([optionValue, labelText]) => (
          <option key={optionValue} value={optionValue}>
            {labelText}
          </option>
        ))}
      </select>
    </label>
  );
}

function Section({ title, rows = [], empty = "No records.", render }) {
  return (
    <div className="rounded-[1.5rem] border border-slate-300 bg-white p-5 shadow-[0_8px_22px_rgba(15,35,63,0.04)]">
      <p className="text-sm font-black text-[#10233f]">{title}</p>
      <div className="mt-4 space-y-3">
        {rows.length ? rows.map(render) : <p className="rounded-2xl border border-dashed border-slate-300 bg-[#fffaf2] p-5 text-sm text-slate-500">{empty}</p>}
      </div>
    </div>
  );
}

function PaymentCard({ title, status, lines = [] }) {
  return (
    <div className="rounded-2xl border border-slate-300 bg-white p-4 shadow-[0_5px_16px_rgba(15,35,63,0.035)]">
      <div className="flex items-start justify-between gap-3">
        <p className="font-black text-[#10233f]">{title}</p>
        <span className={`rounded-full border px-3 py-1 text-xs font-bold ${statusClass(status)}`}>{status}</span>
      </div>
      <div className="mt-3 grid gap-2 text-sm text-slate-600 md:grid-cols-3">
        {lines.map(([label, value]) => (
          <Info key={label} label={label} value={value} />
        ))}
      </div>
    </div>
  );
}

export default PaymentCenterPanel;