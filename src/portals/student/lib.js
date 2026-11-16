// Helpers for the student portal: journey stage, the "what you need to do"
// list, and opening / uploading the student's own files.

import { studentSupabase } from "../../lib/studentSupabase";
import { parseStorageUrl, safeFileName } from "../../lib/storageFiles";
import { cleanNote, daysUntil, fmtDate, fmtMoney } from "../admin/lib/format";

export const OFFICE_WHATSAPP = "923305718131";

export const DOCUMENTS_BUCKET = "student-documents";
export const RECEIPTS_BUCKET = "student-receipts";

export const JOURNEY = [
  { id: "consulting", label: "Planning", short: "Plan", text: "Choosing your country, course and budget with your counselor." },
  { id: "applying", label: "Applying", short: "Apply", text: "Collecting your documents and sending university applications." },
  { id: "offer", label: "Offer", short: "Offer", text: "A university has said yes. Time to accept and prepare the visa file." },
  { id: "visa", label: "Visa", short: "Visa", text: "Visa file, appointment and decision." },
  { id: "departed", label: "Take-off", short: "Fly", text: "Visa in hand. Tickets, packing and arrival." },
];

const OFFER_WORDS = ["offer_received", "offer_accepted", "conditional_offer", "unconditional_offer", "accepted"];
const lower = (value) => String(value || "").toLowerCase();

export function journeyStage(file) {
  const manual = file.person?.stage;
  if (manual === "lead") return "consulting";
  if (manual && JOURNEY.some((step) => step.id === manual)) return manual;
  if (file.visas.length) return "visa";
  if (file.applications.some((app) => OFFER_WORDS.includes(lower(app.offer_status)))) return "offer";
  if (file.applications.length || file.documents.length) return "applying";
  return "consulting";
}

export function isDocOk(doc) {
  return ["verified", "approved"].includes(lower(doc.status));
}

export function isReceiptPending(receipt) {
  return lower(receipt.review_status || receipt.status).includes("pending");
}

export function invoiceOutstanding(invoice) {
  if (lower(invoice.status) === "paid") return 0;
  // Some old invoices store outstanding = 0 while nothing was paid: use total − paid then.
  const stored = Number(invoice.outstanding || 0);
  if (stored > 0) return stored;
  return Math.max(Number(invoice.total || 0) - Number(invoice.paid || 0), 0);
}

/** Papers Zaifan asked for that have no upload yet. */
export function missingRequirements(file) {
  const have = new Set(file.documents.map((doc) => lower(doc.name).trim()));
  return file.requirements.filter(
    (item) => item.required !== false && !have.has(lower(item.name).trim()) && !["verified", "approved", "waived", "not_required"].includes(lower(item.status))
  );
}

/** The short list on the home page. Each item says what to do and where. */
export function buildTodo(file) {
  const todo = [];

  for (const doc of file.documents) {
    if (lower(doc.status) === "rejected") {
      todo.push({
        id: `doc-${doc.id}`,
        tone: "urgent",
        tab: "documents",
        title: `Upload “${doc.name}” again`,
        text: doc.rejection_reason || "We could not accept this copy. Please send a clearer one.",
      });
    }
  }

  for (const item of missingRequirements(file).slice(0, 6)) {
    todo.push({
      id: `req-${item.id}`,
      tone: "normal",
      tab: "documents",
      title: `Upload your ${item.name}`,
      text: cleanNote(item.notes) || "Your counselor needs this for your file.",
    });
  }

  for (const invoice of file.invoices) {
    const left = invoiceOutstanding(invoice);
    if (left <= 0) continue;
    const waiting = file.receipts.some((receipt) => receipt.invoice_id === invoice.id && isReceiptPending(receipt));
    const late = invoice.due_date && daysUntil(invoice.due_date) < 0;
    todo.push({
      id: `inv-${invoice.id}`,
      tone: waiting ? "waiting" : late ? "urgent" : "normal",
      tab: "payments",
      title: waiting ? `We are checking your receipt for “${invoice.title || "invoice"}”` : `Pay ${fmtMoney(left, invoice.currency)} for “${invoice.title || "invoice"}”`,
      text: waiting
        ? "Nothing to do. We will confirm it soon."
        : invoice.due_date
          ? `${late ? "Was due" : "Due"} ${fmtDate(invoice.due_date)}. Pay, then send us the receipt here.`
          : "Pay, then send us the receipt here.",
    });
  }

  for (const app of file.applications) {
    if (app.offer_acceptance_deadline && !lower(app.offer_status).includes("accepted") && daysUntil(app.offer_acceptance_deadline) >= 0) {
      todo.push({
        id: `offer-${app.id}`,
        tone: "normal",
        tab: "applications",
        title: `Decide on your offer from ${app.university}`,
        text: `Tell your counselor before ${fmtDate(app.offer_acceptance_deadline)}.`,
      });
    }
  }

  for (const visa of file.visas) {
    if (visa.appointment_date && daysUntil(visa.appointment_date) >= 0) {
      todo.push({
        id: `visa-${visa.id}`,
        tone: "normal",
        tab: "applications",
        title: `Visa appointment on ${fmtDate(visa.appointment_date)}`,
        text: [visa.appointment_time ? `at ${String(visa.appointment_time).slice(0, 5)}` : "", visa.appointment_location || visa.visa_center || ""].filter(Boolean).join(" · ") || "Your counselor will share the details.",
      });
    }
  }

  for (const question of file.questions) {
    const last = question.replies[question.replies.length - 1];
    if (last && last.from !== "student" && !["resolved", "closed"].includes(lower(question.status))) {
      todo.push({
        id: `q-${question.id}`,
        tone: "normal",
        tab: "help",
        title: "Zaifan replied to your question",
        text: question.subject || "Open Help to read it.",
      });
    }
  }

  const order = { urgent: 0, normal: 1, waiting: 2 };
  return todo.sort((a, b) => order[a.tone] - order[b.tone]);
}

/* --------------------------------- files --------------------------------- */

const MAX_FILE_MB = 15;
const ALLOWED = /\.(pdf|jpe?g|png|webp|heic|docx?)$/i;

export function checkFile(file) {
  if (!file) return "Please choose a file.";
  if (!ALLOWED.test(file.name)) return "Please upload a PDF, a photo (JPG / PNG) or a Word file.";
  if (file.size > MAX_FILE_MB * 1024 * 1024) return `This file is bigger than ${MAX_FILE_MB} MB. Please send a smaller copy.`;
  return "";
}

/** Puts the file in the student's own private folder and returns its path. */
export async function uploadOwnFile({ bucket, personId, file }) {
  const path = `p/${personId}/${Date.now()}-${safeFileName(file.name)}`;
  const { error } = await studentSupabase.storage.from(bucket).upload(path, file, {
    cacheControl: "3600",
    upsert: false,
    contentType: file.type || undefined,
  });
  if (error) throw new Error("The file could not be uploaded. Check your internet and try again.");
  return path;
}

/** Opens one of the student's own files in a new tab (link works for 5 minutes). */
export async function openOwnFile({ bucket, path, url }) {
  let target = path ? { bucket, path } : null;
  if (!target && url) target = parseStorageUrl(url);
  if (!target) throw new Error("This file has no copy saved.");

  const tab = window.open("", "_blank");
  const { data, error } = await studentSupabase.storage.from(target.bucket).createSignedUrl(target.path, 300);
  if (error || !data?.signedUrl) {
    if (tab) tab.close();
    throw new Error("This file could not be opened. Please ask your counselor.");
  }
  if (tab) {
    tab.opener = null;
    tab.location.href = data.signedUrl;
  } else {
    window.location.assign(data.signedUrl);
  }
}

export function sizeLabel(bytes) {
  const size = Number(bytes || 0);
  if (!size) return "";
  if (size < 1024 * 1024) return `${Math.max(1, Math.round(size / 1024))} KB`;
  return `${(size / 1024 / 1024).toFixed(1)} MB`;
}

/** Upcoming dates in the student's file, soonest first: offer and deposit
 *  deadlines, payments due, visa appointment, biometrics, passport pick-up. */
export function keyDates(file) {
  const dates = [];
  const add = (date, title, sub, tab, allowLate = false) => {
    const days = daysUntil(date);
    if (days === null || (days < 0 && !allowLate)) return;
    dates.push({ id: `${title}-${date}`, date, days, title, sub, tab });
  };
  for (const app of file.applications) {
    const uni = app.university || "your university";
    if (!lower(app.offer_status).includes("accepted")) add(app.offer_acceptance_deadline, "Accept or decline your offer", uni, "applications");
    if (app.deposit_required && !app.deposit_paid) add(app.deposit_deadline, "University deposit due", uni, "applications");
    if (!app.submitted_at) add(app.submission_deadline, "Application deadline", uni, "applications");
  }
  for (const invoice of file.invoices) {
    const receiptWaiting = file.receipts.some((receipt) => receipt.invoice_id === invoice.id && isReceiptPending(receipt));
    if (invoiceOutstanding(invoice) > 0 && !receiptWaiting) add(invoice.due_date, `Pay ${fmtMoney(invoiceOutstanding(invoice), invoice.currency)}`, invoice.title || "Invoice", "payments", true);
  }
  for (const visa of file.visas) {
    add(visa.appointment_date, "Visa appointment", [visa.appointment_time ? String(visa.appointment_time).slice(0, 5) : "", visa.visa_center || visa.embassy_or_consulate || ""].filter(Boolean).join(" · ") || "Embassy / visa centre", "applications");
    add(visa.biometrics_date, "Biometrics", visa.visa_center || "Visa centre", "applications");
    add(visa.passport_collection_date, "Collect your passport", visa.visa_center || "Visa centre", "applications");
  }
  return dates.sort((a, b) => a.days - b.days);
}
