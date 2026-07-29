import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Mail,
  Send,
  ShieldCheck,
  X,
} from "lucide-react";

import StudentNotificationPreviewModal from "./StudentNotificationPreviewModal";
import {
  buildStudentNotification,
  prepareStudentNotification,
  sendPreparedStudentNotification,
} from "../../../../services/studentNotificationService";

const CATEGORY_OPTIONS = [
  ["general", "General Update"],
  ["application", "Application"],
  ["document", "Document"],
  ["visa", "Visa"],
  ["payment", "Payment"],
  ["appointment", "Appointment"],
  ["support", "Support"],
];

const PANEL_CATEGORY_MAP = {
  applications: "application",
  application: "application",
  documents: "document",
  "master-file": "document",
  visa: "visa",
  payments: "payment",
  finance: "payment",
  appointment: "appointment",
  appointments: "appointment",
  support: "support",
  communications: "general",
};

function normalize(value = "") {
  return String(value || "").trim().toLowerCase();
}

function getStudentName(student = {}) {
  return (
    student.full_name ||
    student.student_name ||
    student.name ||
    "Student"
  );
}

function getStudentEmail(student = {}) {
  return student.email || student.student_email || "";
}

function categoryFromContext(context = "") {
  return PANEL_CATEGORY_MAP[normalize(context)] || "general";
}

function templateFor(category, student = {}) {
  const name = getStudentName(student);

  const templates = {
    general: {
      subject: "Update from Zaifan Consultancy",
      message: `Dear ${name},\n\nWe have an update regarding your study journey with Zaifan Consultancy. Please review your Student Portal for the latest information and next action.\n\nIf anything is unclear, please contact your Zaifan counselor.`,
    },
    application: {
      subject: "Update about your university application",
      message: `Dear ${name},\n\nWe have an update regarding your university application. Please review your Student Portal for the latest application status, deadlines, and next action.\n\nPlease contact your Zaifan counselor if you need clarification.`,
    },
    document: {
      subject: "Update about your documents",
      message: `Dear ${name},\n\nWe have an update regarding your student documents. Please review the Documents area in your Student Portal and complete any action shown there.\n\nContact your Zaifan counselor if you need help with a document.`,
    },
    visa: {
      subject: "Update about your visa process",
      message: `Dear ${name},\n\nWe have an update regarding your visa process. Please review your Student Portal for the latest visa stage and any action required from you.\n\nContact your Zaifan counselor if anything is unclear or unexpected.`,
    },
    payment: {
      subject: "Update about your Zaifan payment record",
      message: `Dear ${name},\n\nWe have an update regarding your payment record. Please review the Finance area in your Student Portal for the latest invoice, receipt, or payment information.\n\nContact the Zaifan team if you have any questions about the amount or status shown.`,
    },
    appointment: {
      subject: "Update about your Zaifan appointment",
      message: `Dear ${name},\n\nWe have an update regarding your Zaifan appointment or consultation. Please review the latest details and contact us if the current date, time, or status is not suitable.`,
    },
    support: {
      subject: "Update from Zaifan Student Support",
      message: `Dear ${name},\n\nWe have an update regarding your support request or current task. Please review your Student Portal for the latest note or action.\n\nReply through your normal Zaifan contact channel if you still need assistance.`,
    },
  };

  return templates[category] || templates.general;
}

function StudentNotificationComposer({
  student = {},
  context = "",
  buttonLabel = "Notify Student",
  compact = false,
}) {
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState("general");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");

  const [pending, setPending] = useState(null);
  const [sending, setSending] = useState(false);

  const [feedback, setFeedback] = useState("");
  const [feedbackTone, setFeedbackTone] = useState("success");

  const studentName = getStudentName(student);
  const studentEmail = getStudentEmail(student);

  const relatedType = useMemo(() => {
    if (category === "payment") return "finance";
    return category || "general";
  }, [category]);

  const resetTemplate = (nextCategory) => {
    const nextTemplate = templateFor(nextCategory, student);
    setCategory(nextCategory);
    setSubject(nextTemplate.subject);
    setMessage(nextTemplate.message);
  };

  const openComposer = () => {
    const nextCategory = categoryFromContext(context);
    resetTemplate(nextCategory);
    setFeedback("");
    setFeedbackTone("success");
    setPending(null);
    setOpen(true);
  };

  useEffect(() => {
    if (!feedback) return undefined;
    const timer = window.setTimeout(() => setFeedback(""), 5000);
    return () => window.clearTimeout(timer);
  }, [feedback]);

  const handleReview = () => {
    const cleanSubject = subject.trim();
    const cleanMessage = message.trim();

    if (!studentEmail) {
      setFeedbackTone("error");
      setFeedback(
        "This student does not have an email address. Add an email before sending a notification."
      );
      return;
    }

    if (!cleanSubject || !cleanMessage) {
      setFeedbackTone("error");
      setFeedback("Subject and message are required.");
      return;
    }

    const preview = buildStudentNotification({
      domain: "manual_email",
      student,
      subject: cleanSubject,
      message: cleanMessage,
      relatedType,
      relatedId: student?.id || student?.student_id || null,
      context: {
        category,
        source: "student_360_notification_composer",
      },
    });

    if (!preview) {
      setFeedbackTone("error");
      setFeedback("Notification preview could not be created.");
      return;
    }

    // Instant UI: show preview now, prepare signed security token in background.
    setPending({
      preview,
      previewToken: null,
      expiresAt: null,
      preparing: true,
      preparationError: "",
    });

    void prepareStudentNotification(preview)
      .then((prepared) => {
        setPending((current) =>
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
        setPending((current) =>
          current?.preview === preview
            ? {
                ...current,
                preparing: false,
                preparationError:
                  error?.message ||
                  "Notification security preparation failed.",
              }
            : current
        );
      });
  };

  const handleConfirm = async (confirmationText = "") => {
    if (
      !pending?.preview ||
      pending.preparing ||
      pending.preparationError ||
      sending
    ) {
      return;
    }

    setSending(true);

    try {
      const result = await sendPreparedStudentNotification({
        preview: pending.preview,
        previewToken: pending.previewToken,
        confirmationText,
      });

      setPending(null);
      setOpen(false);
      setFeedbackTone("success");

      if (result?.duplicateSuppressed) {
        setFeedback(
          "A matching email had already been sent moments ago, so the duplicate was safely suppressed."
        );
      } else if (result?.communicationWarning) {
        setFeedback(
          `Email sent successfully. ${result.communicationWarning}`
        );
      } else {
        setFeedback(
          "Student email sent successfully and recorded in Communication history."
        );
      }
    } catch (error) {
      setFeedbackTone("error");
      setFeedback(
        error?.message ||
          "Student email could not be sent. No duplicate retry was attempted."
      );
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <div className={compact ? "" : "relative"}>
        <button
          type="button"
          onClick={openComposer}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border-[3px] border-[#123865] bg-[#123865] px-4 text-sm font-black text-white shadow-[0_8px_18px_rgba(18,56,101,0.16)] transition duration-300 hover:-translate-y-0.5 hover:bg-[#0d2b50]"
        >
          <Mail size={16} />
          {buttonLabel}
        </button>

        {feedback ? (
          <div
            className={`absolute right-0 top-[calc(100%+8px)] z-[1500] w-[min(360px,90vw)] rounded-xl border-2 px-3 py-2.5 text-xs font-bold leading-5 shadow-xl ${
              feedbackTone === "error"
                ? "border-red-300 bg-red-50 text-red-900"
                : "border-emerald-300 bg-emerald-50 text-emerald-900"
            }`}
          >
            {feedback}
          </div>
        ) : null}
      </div>

      {open ? (
        <div className="fixed inset-0 z-[1600] overflow-y-auto bg-[#10233f]/70 px-3 py-4 backdrop-blur-sm sm:px-5 sm:py-6">
          <div className="mx-auto flex min-h-full w-full max-w-2xl items-center justify-center">
            <section
              role="dialog"
              aria-modal="true"
              className="w-full overflow-hidden rounded-[1.9rem] border-[3px] border-orange-300 bg-[#fff8ef] shadow-[0_30px_100px_rgba(15,35,63,0.34)]"
            >
              <header className="relative bg-[#123865] p-5 text-white sm:p-6">
                <div className="absolute inset-x-0 top-0 h-1.5 bg-orange-500" />

                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border-2 border-white/20 bg-white/10">
                      <Send size={18} />
                    </span>

                    <div>
                      <p className="text-[9px] font-black uppercase tracking-[0.18em] text-orange-200">
                        Student 360 Communication
                      </p>
                      <h3 className="mt-1 text-xl font-black text-white sm:text-2xl">
                        Notify Student
                      </h3>
                      <p className="mt-2 max-w-xl text-sm font-semibold leading-6 text-white/90">
                        Compose a deliberate student-facing update. Nothing is
                        sent until the protected preview is reviewed and confirmed.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => !sending && setOpen(false)}
                    disabled={sending}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/20 bg-white/10 text-white hover:bg-white/15 disabled:opacity-50"
                    aria-label="Close composer"
                  >
                    <X size={16} />
                  </button>
                </div>
              </header>

              <div className="space-y-4 p-5 sm:p-6">
                <div className="grid gap-3 sm:grid-cols-2">
                  <Info
                    label="Student"
                    value={studentName}
                  />
                  <Info
                    label="Recipient email"
                    value={studentEmail || "No email available"}
                    danger={!studentEmail}
                  />
                </div>

                <label className="block">
                  <span className="text-[10px] font-black uppercase tracking-[0.13em] text-slate-500">
                    Update category
                  </span>
                  <select
                    value={category}
                    onChange={(event) => resetTemplate(event.target.value)}
                    className="mt-2 h-11 w-full rounded-xl border-2 border-slate-300 bg-white px-3 text-sm font-black text-[#10233f] outline-none focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
                  >
                    {CATEGORY_OPTIONS.map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block">
                  <span className="text-[10px] font-black uppercase tracking-[0.13em] text-slate-500">
                    Subject
                  </span>
                  <input
                    value={subject}
                    onChange={(event) => setSubject(event.target.value)}
                    maxLength={180}
                    className="mt-2 h-11 w-full rounded-xl border-2 border-slate-300 bg-white px-3 text-sm font-bold text-[#10233f] outline-none focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
                  />
                </label>

                <label className="block">
                  <span className="text-[10px] font-black uppercase tracking-[0.13em] text-slate-500">
                    Message
                  </span>
                  <textarea
                    value={message}
                    onChange={(event) => setMessage(event.target.value)}
                    rows={8}
                    maxLength={5000}
                    className="mt-2 w-full resize-y rounded-xl border-2 border-slate-300 bg-white px-3 py-3 text-sm font-semibold leading-6 text-[#10233f] outline-none focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
                  />
                  <div className="mt-1 text-right text-[10px] font-bold text-slate-400">
                    {message.length}/5000
                  </div>
                </label>

                <div className="flex items-start gap-3 rounded-2xl border-2 border-blue-300 bg-blue-50 p-4 text-blue-900">
                  <ShieldCheck size={18} className="mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-black">
                      Protected delivery
                    </p>
                    <p className="mt-1 text-xs font-semibold leading-5">
                      Review shows the exact recipient, subject, message and
                      security confirmation before Resend delivery. High-impact
                      wording automatically receives stronger confirmation.
                    </p>
                  </div>
                </div>

                {feedback ? (
                  <div
                    className={`flex items-start gap-2 rounded-xl border-2 p-3 text-xs font-bold leading-5 ${
                      feedbackTone === "error"
                        ? "border-red-300 bg-red-50 text-red-900"
                        : "border-emerald-300 bg-emerald-50 text-emerald-900"
                    }`}
                  >
                    {feedbackTone === "error" ? (
                      <AlertTriangle size={15} className="mt-0.5 shrink-0" />
                    ) : (
                      <CheckCircle2 size={15} className="mt-0.5 shrink-0" />
                    )}
                    {feedback}
                  </div>
                ) : null}

                <div className="grid gap-2 border-t border-orange-200 pt-4 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    disabled={sending}
                    className="h-12 rounded-xl border-2 border-slate-300 bg-white text-sm font-black text-[#10233f] hover:border-orange-300 hover:bg-orange-50 disabled:opacity-50"
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    onClick={handleReview}
                    disabled={
                      sending ||
                      !studentEmail ||
                      !subject.trim() ||
                      !message.trim()
                    }
                    className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border-2 border-orange-500 bg-orange-500 text-sm font-black text-white hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-45"
                  >
                    <ShieldCheck size={16} />
                    Review Email
                  </button>
                </div>
              </div>
            </section>
          </div>
        </div>
      ) : null}

      <StudentNotificationPreviewModal
        pending={pending}
        busy={sending}
        onCancel={() => !sending && setPending(null)}
        onConfirm={handleConfirm}
      />
    </>
  );
}

function Info({ label, value, danger = false }) {
  return (
    <div
      className={`rounded-2xl border-2 p-4 ${
        danger
          ? "border-red-300 bg-red-50"
          : "border-slate-300 bg-white"
      }`}
    >
      <p className="text-[10px] font-black uppercase tracking-[0.13em] text-slate-500">
        {label}
      </p>
      <p
        className={`mt-2 break-words text-sm font-black leading-6 ${
          danger ? "text-red-800" : "text-[#10233f]"
        }`}
      >
        {value || "—"}
      </p>
    </div>
  );
}

export default StudentNotificationComposer;