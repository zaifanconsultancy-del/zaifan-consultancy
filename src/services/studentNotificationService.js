import { supabase } from "../lib/supabaseClient";

const EDGE_FUNCTION = "send-student-notification";
const PREVIEW_TIMEOUT_MS = 15000;
const SEND_TIMEOUT_MS = 20000;

const HIGH_RISK_TERMS = [
  "reject",
  "rejected",
  "refus",
  "refused",
  "cancel",
  "cancelled",
  "canceled",
  "complete",
  "completed",
  "closed",
  "visa decision",
  "visa refused",
];

const clean = (value = "") =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ");

const pretty = (value = "") =>
  String(value || "")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

const studentName = (student = {}) =>
  student.full_name || student.student_name || student.name || "Student";

const studentEmail = (student = {}) =>
  String(student.email || student.student_email || "").trim().toLowerCase();

const withTimeout = async (promise, message, timeoutMs) => {
  let timeoutId;

  const timeout = new Promise((_, reject) => {
    timeoutId = window.setTimeout(() => reject(new Error(message)), timeoutMs);
  });

  try {
    return await Promise.race([promise, timeout]);
  } finally {
    window.clearTimeout(timeoutId);
  }
};

const applicationEvent = ({ action, previous = {}, next = {} }) => {
  const nextStatus = clean(next.application_status);
  const nextOffer = clean(next.offer_status);
  const nextVisa = clean(next.visa_status);
  const nextStage = clean(next.application_stage);

  if (action === "rejected" || nextStatus === "rejected" || nextOffer === "rejected") {
    return {
      eventType: "application_rejected",
      eventLabel: "Application rejected",
      risk: "high",
      subject: `Important update about your ${next.university || "university"} application`,
      message: `Your application for ${next.program || "your selected programme"} at ${next.university || "the university"} has been marked as rejected. Please review your Student Portal and contact your Zaifan counselor for the next step.`,
      trigger: `Application status changed to Rejected`,
      confirmationPhrase: "SEND REJECTION",
    };
  }

  if (action === "offer_received" || nextStatus === "offer received" || nextOffer === "offer received") {
    return {
      eventType: "offer_received",
      eventLabel: "Offer received",
      risk: "normal",
      subject: `Offer update from ${next.university || "your university"}`,
      message: `Good news — Zaifan has recorded an offer for your ${next.program || "programme"} application at ${next.university || "your university"}. Open your Student Portal to review the latest details, deadlines, and next action.`,
      trigger: `Offer status changed to Offer Received`,
    };
  }

  if (action === "offer_accepted" || nextStatus === "offer accepted" || nextOffer === "offer accepted") {
    return {
      eventType: "offer_accepted",
      eventLabel: "Offer accepted",
      risk: "normal",
      subject: `Your offer has been marked accepted`,
      message: `Your offer for ${next.program || "your programme"} at ${next.university || "your university"} has been marked as accepted. Open your Student Portal to review the next application, payment, and visa steps.`,
      trigger: `Offer status changed to Offer Accepted`,
    };
  }

  if (action === "submitted" || nextStatus === "applied" || nextStage === "submitted") {
    return {
      eventType: "application_submitted",
      eventLabel: "Application submitted",
      risk: "normal",
      subject: `Your university application has been submitted`,
      message: `Your application for ${next.program || "your selected programme"} at ${next.university || "the university"} has been marked as submitted. Your Student Portal now reflects this milestone and will show the next action when it is available.`,
      trigger: `Application moved to Submitted / Applied`,
    };
  }

  if (nextStatus === "under review" && clean(previous.application_status) !== nextStatus) {
    return {
      eventType: "application_under_review",
      eventLabel: "Application under review",
      risk: "normal",
      subject: `Your application is under review`,
      message: `Your application at ${next.university || "the university"} is now marked as under review. No action is required right now unless your Zaifan counselor asks for additional information.`,
      trigger: `Application status changed to Under Review`,
    };
  }

  if (nextStatus === "enrolled" && clean(previous.application_status) !== nextStatus) {
    return {
      eventType: "application_enrolled",
      eventLabel: "Enrollment milestone",
      risk: "normal",
      subject: `Enrollment milestone recorded`,
      message: `Your ${next.university || "university"} application has reached the enrolled milestone in Zaifan OS. Please review your Student Portal for any remaining payment, visa, document, or travel actions.`,
      trigger: `Application status changed to Enrolled`,
    };
  }

  if (nextVisa && nextVisa !== clean(previous.visa_status)) {
    if (nextVisa === "rejected") {
      return {
        eventType: "visa_rejected",
        eventLabel: "Visa status rejected",
        risk: "high",
        subject: `Important update about your visa process`,
        message: `Your visa status has been marked as rejected in Zaifan OS. Please contact your Zaifan counselor before taking any further action so the decision and available next steps can be reviewed carefully.`,
        trigger: `Application visa status changed to Rejected`,
        confirmationPhrase: "SEND VISA REJECTION",
      };
    }

    if (["visa processing", "biometrics", "medical", "under review", "visa approved"].includes(nextVisa)) {
      return {
        eventType: nextVisa === "visa approved" ? "visa_approved" : "visa_progress",
        eventLabel: nextVisa === "visa approved" ? "Visa approved" : `Visa ${pretty(nextVisa)}`,
        risk: "normal",
        subject: nextVisa === "visa approved" ? "Visa milestone: approved" : `Visa update: ${pretty(nextVisa)}`,
        message: nextVisa === "visa approved"
          ? `Your visa status has been marked as approved in Zaifan OS. Please review your Student Portal and follow the latest travel and document instructions from your counselor.`
          : `Your visa process has moved to ${pretty(nextVisa)}. Please review your Student Portal for the latest guidance and any action required from you.`,
        trigger: `Visa status changed to ${pretty(nextVisa)}`,
      };
    }
  }

  if (Boolean(next.deposit_paid) && !Boolean(previous.deposit_paid)) {
    return {
      eventType: "deposit_paid",
      eventLabel: "Deposit payment recorded",
      risk: "normal",
      subject: `University deposit payment recorded`,
      message: `Your university deposit has been marked as paid in Zaifan OS. Please check your Student Portal for the next application and visa steps.`,
      trigger: `Application deposit changed to Paid`,
    };
  }

  if (Boolean(next.application_fee_paid) && !Boolean(previous.application_fee_paid)) {
    return {
      eventType: "application_fee_paid",
      eventLabel: "Application fee payment recorded",
      risk: "normal",
      subject: `Application fee payment recorded`,
      message: `Your application fee has been marked as paid in Zaifan OS. Please check your Student Portal for the latest application progress.`,
      trigger: `Application fee changed to Paid`,
    };
  }

  return null;
};

const visaEvent = ({ previous = {}, next = {} }) => {
  const oldStatus = clean(previous.visa_status);
  const nextStatus = clean(next.visa_status);
  const oldStage = clean(previous.visa_stage);
  const nextStage = clean(next.visa_stage);

  if (nextStatus && nextStatus !== oldStatus) {
    if (nextStatus === "rejected") {
      return {
        eventType: "visa_rejected",
        eventLabel: "Visa rejected",
        risk: "high",
        subject: "Important update about your visa process",
        message: "Your visa case has been marked as rejected in Zaifan OS. Please contact your Zaifan counselor before taking further action so the decision and next options can be reviewed carefully.",
        trigger: "Visa status changed to Rejected",
        confirmationPhrase: "SEND VISA REJECTION",
      };
    }

    if (nextStatus === "visa approved") {
      return {
        eventType: "visa_approved",
        eventLabel: "Visa approved",
        risk: "normal",
        subject: "Visa milestone: approved",
        message: "Your visa case has been marked as approved in Zaifan OS. Please review your Student Portal and follow the latest travel and document instructions from your counselor.",
        trigger: "Visa status changed to Visa Approved",
      };
    }

    if (["visa processing", "biometrics", "medical", "under review"].includes(nextStatus)) {
      return {
        eventType: "visa_progress",
        eventLabel: `Visa ${pretty(nextStatus)}`,
        risk: "normal",
        subject: `Visa update: ${pretty(nextStatus)}`,
        message: `Your visa process has moved to ${pretty(nextStatus)}. Please check your Student Portal for the latest guidance and any action required from you.`,
        trigger: `Visa status changed to ${pretty(nextStatus)}`,
      };
    }
  }

  if (nextStage && nextStage !== oldStage && ["appointment booked", "submitted", "embassy review", "decision"].includes(nextStage)) {
    return {
      eventType: "visa_stage_changed",
      eventLabel: `Visa stage: ${pretty(nextStage)}`,
      risk: nextStage === "decision" ? "high" : "normal",
      subject: `Visa stage update: ${pretty(nextStage)}`,
      message: `Your visa case has moved to ${pretty(nextStage)}. Please review your Student Portal for the latest case information and counselor guidance.`,
      trigger: `Visa stage changed to ${pretty(nextStage)}`,
      confirmationPhrase: nextStage === "decision" ? "SEND VISA DECISION" : undefined,
    };
  }

  return null;
};

const documentEvent = ({ action, entity = {}, reason = "", items = [] }) => {
  if (action === "verified") {
    return {
      eventType: items.length > 1 ? "documents_verified" : "document_verified",
      eventLabel: items.length > 1 ? "Documents verified" : "Document verified",
      risk: "normal",
      subject: items.length > 1 ? "Your documents have been cleared" : `${entity.document_name || "Your document"} has been cleared`,
      message: items.length > 1
        ? `${items.length} documents in your Student Master File have been verified and cleared by Zaifan Consultancy. Please check your Student Portal for the latest document status.`
        : `${entity.document_name || "Your document"} has been verified and cleared by Zaifan Consultancy. Please check your Student Portal for the latest document status.`,
      trigger: items.length > 1 ? `${items.length} documents marked Verified` : `${entity.document_name || "Document"} marked Verified`,
    };
  }

  if (action === "rejected") {
    const reasonText = String(reason || entity.rejection_reason || "").trim();
    return {
      eventType: "document_rejected",
      eventLabel: "Document needs replacement",
      risk: "high",
      subject: `${entity.document_name || "A document"} needs your attention`,
      message: `${entity.document_name || "A document"} has been rejected and needs to be replaced or corrected.${reasonText ? ` Reason: ${reasonText}` : ""} Please review your Student Portal, correct the issue, and upload the replacement when ready.`,
      trigger: `${entity.document_name || "Document"} marked Rejected`,
      confirmationPhrase: "SEND DOCUMENT REJECTION",
    };
  }

  return null;
};


const appointmentEvent = ({ previous = {}, next = {} }) => {
  const oldStatus = clean(previous.status || previous.appointment_status);
  const nextStatus = clean(next.status || next.appointment_status);
  const oldStage = clean(previous.appointment_stage);
  const nextStage = clean(next.appointment_stage);

  if (nextStatus && nextStatus !== oldStatus) {
    if (nextStatus.includes("cancel")) {
      return {
        eventType: "appointment_cancelled",
        eventLabel: "Consultation cancelled",
        risk: "high",
        subject: "Update about your Zaifan consultation",
        message: `Your Zaifan consultation${next.appointment_date ? ` for ${next.appointment_date}` : ""}${next.appointment_time ? ` at ${next.appointment_time}` : ""} has been marked as cancelled. If this was unexpected or you need another slot, please contact the Zaifan team.`,
        trigger: `Consultation status changed from ${pretty(oldStatus || "pending")} to Cancelled`,
        confirmationPhrase: "SEND CANCELLATION",
      };
    }

    if (["completed", "complete", "done", "closed"].includes(nextStatus)) {
      return {
        eventType: "appointment_completed",
        eventLabel: "Consultation completed",
        risk: "high",
        subject: "Your Zaifan consultation is complete",
        message: "Your Zaifan consultation has been marked as completed. Please check your Student Portal and follow any next steps shared by your counselor.",
        trigger: `Consultation status changed from ${pretty(oldStatus || "pending")} to Completed`,
        confirmationPhrase: "SEND COMPLETION",
      };
    }

    if (nextStatus === "confirmed") {
      return {
        eventType: "appointment_confirmed",
        eventLabel: "Consultation confirmed",
        risk: "normal",
        subject: "Your Zaifan consultation is confirmed",
        message: `Your Zaifan consultation has been confirmed${next.appointment_date ? ` for ${next.appointment_date}` : ""}${next.appointment_time ? ` at ${next.appointment_time}` : ""}. Please be available at the confirmed time and contact us if you need help.`,
        trigger: "Consultation status changed to Confirmed",
      };
    }

    if (["rescheduled", "updated", "changed"].includes(nextStatus)) {
      return {
        eventType: "appointment_updated",
        eventLabel: "Consultation updated",
        risk: "normal",
        subject: "Your Zaifan consultation has been updated",
        message: `Your Zaifan consultation details have been updated${next.appointment_date ? ` to ${next.appointment_date}` : ""}${next.appointment_time ? ` at ${next.appointment_time}` : ""}. Please use the latest details shown in your Student Portal.`,
        trigger: `Consultation status changed to ${pretty(nextStatus)}`,
      };
    }
  }

  if (nextStage && nextStage !== oldStage) {
    const meaningfulStage = ["confirmed", "rescheduled", "completed", "cancelled", "canceled"];
    if (meaningfulStage.some((value) => nextStage.includes(value))) {
      return appointmentEvent({
        previous,
        next: { ...next, status: nextStage },
      });
    }
  }

  return null;
};

const financeEvent = ({
  action = "",
  entity = {},
  previous = {},
  next = {},
  context = {},
  reason = "",
}) => {
  const normalizedAction = clean(action);
  const amount = Number(
    next.amount ??
      entity.amount ??
      context.amount ??
      previous.amount ??
      0
  );
  const currency = String(
    next.currency ||
      entity.currency ||
      context.currency ||
      previous.currency ||
      "PKR"
  ).toUpperCase();
  const money = `${currency} ${Number.isFinite(amount) ? amount.toLocaleString("en-GB", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }) : "0"}`;
  const invoiceLabel =
    context.invoiceNumber ||
    context.invoiceTitle ||
    entity.invoice_number ||
    entity.title ||
    "student invoice";

  if (["payment confirmed", "payment_confirmed", "confirmed"].includes(normalizedAction)) {
    return {
      eventType: "payment_confirmed",
      eventLabel: "Payment confirmed",
      risk: "normal",
      subject: `Payment received: ${money}`,
      message: `Zaifan Consultancy has recorded your payment of ${money}${context.invoiceLinked ? ` against ${invoiceLabel}` : ""}. Please check your Student Portal for the updated finance position and keep your payment reference for your records.`,
      trigger: `${money} payment recorded as Confirmed`,
    };
  }

  if (["payment refunded", "payment_refunded", "refunded"].includes(normalizedAction)) {
    return {
      eventType: "payment_refunded",
      eventLabel: "Payment refunded",
      risk: "high",
      subject: `Important payment update: ${money} refunded`,
      message: `A payment of ${money} has been marked as refunded in Zaifan OS. This amount will no longer count toward the related outstanding balance. Please review your Student Portal and contact the Zaifan team if this was unexpected.`,
      trigger: `${money} payment changed to Refunded`,
      confirmationPhrase: "SEND REFUND UPDATE",
    };
  }

  if (["payment cancelled", "payment_cancelled", "cancelled", "canceled"].includes(normalizedAction)) {
    return {
      eventType: "payment_cancelled",
      eventLabel: "Payment cancelled",
      risk: "high",
      subject: `Important payment update: ${money} cancelled`,
      message: `A payment of ${money} has been marked as cancelled in Zaifan OS. It will no longer count toward the related balance. Please contact the Zaifan team if this does not match your records.`,
      trigger: `${money} payment changed to Cancelled`,
      confirmationPhrase: "SEND PAYMENT CANCELLATION",
    };
  }

  if (["payment failed", "payment_failed", "failed"].includes(normalizedAction)) {
    return {
      eventType: "payment_failed",
      eventLabel: "Payment marked failed",
      risk: "high",
      subject: `Payment issue: ${money} marked failed`,
      message: `A payment record of ${money} has been marked as failed in Zaifan OS and will not count toward your paid balance. Please review your Student Portal or contact the Zaifan team if you believe this is incorrect.`,
      trigger: `${money} payment changed to Failed`,
      confirmationPhrase: "SEND PAYMENT FAILURE",
    };
  }

  if (["receipt approved", "receipt_approved"].includes(normalizedAction)) {
    return {
      eventType: "receipt_approved",
      eventLabel: "Payment receipt approved",
      risk: "normal",
      subject: "Your payment receipt has been approved",
      message: `Your payment receipt for ${money} has been approved and recorded as a confirmed payment in Zaifan OS. Please check your Student Portal for the updated finance position.`,
      trigger: `${money} receipt approved and converted to payment`,
    };
  }

  if (["receipt rejected", "receipt_rejected"].includes(normalizedAction)) {
    const reasonText = String(reason || context.reason || "").trim();
    return {
      eventType: "receipt_rejected",
      eventLabel: "Payment receipt rejected",
      risk: "high",
      subject: "Your payment receipt needs attention",
      message: `Your payment receipt for ${money} has been rejected and no confirmed payment was created.${reasonText ? ` Reason: ${reasonText}` : ""} Please review the receipt and contact the Zaifan team before submitting replacement evidence.`,
      trigger: `${money} receipt marked Rejected`,
      confirmationPhrase: "SEND RECEIPT REJECTION",
    };
  }

  if (["invoice cancelled", "invoice_cancelled"].includes(normalizedAction)) {
    const total = Number(entity.total_amount ?? entity.amount ?? context.amount ?? 0);
    const invoiceCurrency = String(entity.currency || context.currency || "PKR").toUpperCase();
    const invoiceMoney = `${invoiceCurrency} ${Number.isFinite(total) ? total.toLocaleString("en-GB", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }) : "0"}`;

    return {
      eventType: "invoice_cancelled",
      eventLabel: "Invoice cancelled",
      risk: "high",
      subject: "Important update about your Zaifan invoice",
      message: `${invoiceLabel} for ${invoiceMoney} has been marked as cancelled in Zaifan OS and is no longer collectible. Please contact the Zaifan team if this was unexpected.`,
      trigger: `${invoiceLabel} changed to Cancelled`,
      confirmationPhrase: "SEND INVOICE CANCELLATION",
    };
  }

  return null;
};

export function buildStudentNotification({
  domain,
  action = "",
  student = {},
  entity = {},
  previous = {},
  next = {},
  reason = "",
  items = [],
  context = {},
  subject = "",
  message = "",
  relatedType = "",
  relatedId = "",
}) {
  let event = null;

  if (domain === "application") {
    event = applicationEvent({ action, previous, next: next || entity });
  } else if (domain === "document") {
    event = documentEvent({ action, entity, reason, items });
  } else if (domain === "visa") {
    event = visaEvent({ previous, next: next || entity });
  } else if (domain === "appointment") {
    event = appointmentEvent({ previous, next: next || entity });
  } else if (domain === "finance") {
    event = financeEvent({
      action,
      entity,
      previous,
      next: next || entity,
      context,
      reason,
    });
  } else if (domain === "manual_email") {
    const combined = `${subject} ${message}`.toLowerCase();
    const highRisk = HIGH_RISK_TERMS.some((term) => combined.includes(term));
    event = {
      eventType: "manual_email",
      eventLabel: "Manual student email",
      risk: highRisk ? "high" : "normal",
      subject: String(subject || "").trim(),
      message: String(message || "").trim(),
      trigger: "Admin manually composed an email",
      confirmationPhrase: highRisk ? "SEND MANUAL EMAIL" : undefined,
    };
  }

  if (!event) return null;

  const recipientName = studentName(student);
  const recipientEmail = studentEmail(student);

  return {
    ...event,
    domain,
    notificationKey: [
      domain,
      event.eventType,
      String(relatedId || entity.id || next?.id || "general"),
      recipientEmail,
    ]
      .filter(Boolean)
      .join(":"),
    recipientName,
    recipientEmail,
    studentId: student.id ?? student.student_id ?? null,
    studentType: student.student_type || student.__leadType || student.type || "inquiry",
    relatedType: relatedType || domain,
    relatedId: relatedId || entity.id || next?.id || null,
    sendable: Boolean(recipientEmail && event.subject && event.message),
  };
}

export function confirmStudentNotificationPreview(preview) {
  if (!preview) return { confirmed: true, confirmationText: "" };

  const summary = [
    "STUDENT NOTIFICATION PREVIEW",
    "",
    `Recipient: ${preview.recipientName || "Student"}`,
    `Email: ${preview.recipientEmail || "No student email"}`,
    "",
    `Triggered by: ${preview.trigger || preview.eventLabel || "Admin change"}`,
    "",
    `Subject: ${preview.subject || "—"}`,
    "",
    preview.message || "",
    "",
    preview.sendable
      ? "The Admin change will be saved first. The email will only be sent after the save succeeds."
      : "No usable student email is available. The Admin change can still be saved without email.",
  ].join("\n");

  if (!window.confirm(summary)) {
    return { confirmed: false, confirmationText: "" };
  }

  if (preview.confirmationPhrase) {
    const confirmationText = window.prompt(
      `High-impact message. Type exactly:\n${preview.confirmationPhrase}`
    );

    if (confirmationText !== preview.confirmationPhrase) {
      return { confirmed: false, confirmationText: confirmationText || "" };
    }

    return { confirmed: true, confirmationText };
  }

  return { confirmed: true, confirmationText: "" };
}

export async function prepareStudentNotification(preview) {
  if (!preview?.sendable) {
    return { previewToken: null, expiresAt: null, sendable: false };
  }

  const { data, error } = await withTimeout(
    supabase.functions.invoke(EDGE_FUNCTION, {
      body: {
        mode: "preview",
        notification: preview,
      },
    }),
    "Notification preview request timed out.",
    PREVIEW_TIMEOUT_MS
  );

  if (error) throw error;
  if (!data?.success || !data?.previewToken) {
    throw new Error(data?.error || "Notification preview could not be prepared.");
  }

  return {
    previewToken: data.previewToken,
    expiresAt: data.expiresAt || null,
    sendable: true,
  };
}

export async function sendPreparedStudentNotification({
  preview,
  previewToken,
  confirmationText = "",
}) {
  if (!preview?.sendable) {
    return {
      sent: false,
      skipped: true,
      communicationLogged: false,
      duplicateSuppressed: false,
    };
  }

  const { data, error } = await withTimeout(
    supabase.functions.invoke(EDGE_FUNCTION, {
      body: {
        mode: "send",
        notification: preview,
        previewToken,
        confirmationText,
      },
    }),
    "Student notification send timed out.",
    SEND_TIMEOUT_MS
  );

  if (error) throw error;
  if (!data?.success) {
    throw new Error(data?.error || "Student notification could not be sent.");
  }

  return {
    sent: true,
    messageId: data.messageId || null,
    communicationLogged: Boolean(data.communicationLogged),
    duplicateSuppressed: Boolean(data.duplicateSuppressed),
    communicationWarning: String(data.communicationWarning || ""),
  };
}