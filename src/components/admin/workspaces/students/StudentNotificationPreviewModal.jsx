// StudentNotificationPreviewModal PARTNER OS EXTREME — Protected Delivery Safety Command
import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  Mail,
  ShieldAlert,
  Sparkles,
  X,
} from "lucide-react";

function StudentNotificationPreviewModal({
  pending,
  busy = false,
  onCancel = () => {},
  onConfirm = () => {},
}) {
  const [confirmationText, setConfirmationText] = useState("");
  const bodyRef = useRef(null);

  const preview = pending?.preview || null;
  const requiredPhrase = preview?.confirmationPhrase || "";
  const highRisk = preview?.risk === "high";
  const preparing = Boolean(pending?.preparing);
  const preparationError = String(pending?.preparationError || "");
  const phraseMatches =
    !requiredPhrase || confirmationText.trim() === requiredPhrase;

  const expiresLabel = useMemo(() => {
    if (!pending?.expiresAt) return "";
    const date = new Date(pending.expiresAt);
    if (Number.isNaN(date.getTime())) return "";
    return date.toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }, [pending?.expiresAt]);

  useEffect(() => {
    setConfirmationText("");
    requestAnimationFrame(() => {
      if (bodyRef.current) bodyRef.current.scrollTop = 0;
    });
  }, [preview?.eventType, preview?.relatedId, preview?.recipientEmail]);

  useEffect(() => {
    if (!preview) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKey = (event) => {
      if (event.key === "Escape" && !busy) onCancel();
    };

    window.addEventListener("keydown", handleKey);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKey);
    };
  }, [preview, busy, onCancel]);

  if (!preview) return null;

  return (
    <div className="fixed inset-0 z-[1700] overflow-y-auto bg-[#10233F]/80 px-3 py-4 backdrop-blur-md sm:px-5 sm:py-6">
      <div className="mx-auto flex min-h-full w-full max-w-2xl items-center justify-center">
        <section
          role="dialog"
          aria-modal="true"
          aria-labelledby="student-notification-preview-title"
          className="grid max-h-[94vh] w-full min-w-0 grid-rows-[auto_minmax(0,1fr)] overflow-hidden rounded-[2rem] border-[4px] border-[#123865] bg-[#FFF8EF] shadow-[0_34px_110px_rgba(15,35,63,0.42)]"
        >
          <header className="relative border-b-[3px] border-[#FF5A0A] bg-[#123865] px-5 py-5 text-white sm:px-6 sm:py-6">
            <div className="absolute inset-x-8 top-0 h-1 rounded-b-full bg-[#FF5A0A]" />

            <div className="flex min-w-0 items-start justify-between gap-4">
              <div className="flex min-w-0 items-start gap-3">
                <span
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border-2 text-white shadow-inner ${
                    highRisk
                      ? "border-red-300/50 bg-red-500/20"
                      : "border-white/20 bg-white/10"
                  }`}
                >
                  {highRisk ? <ShieldAlert size={19} /> : <Mail size={19} />}
                </span>

                <div className="min-w-0">
                  <p className="text-[9px] font-black uppercase tracking-[0.18em] text-orange-200">
                    Student Notification Safety
                  </p>
                  <h3
                    id="student-notification-preview-title"
                    className="mt-1 break-words text-2xl font-black tracking-[-0.03em] text-white sm:text-3xl"
                  >
                    Review the change before sending
                  </h3>
                  <p className="mt-2 max-w-xl break-words text-sm font-semibold leading-6 text-slate-100">
                    Nothing student-facing is sent until you confirm this exact
                    recipient, trigger, subject, and message.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={onCancel}
                disabled={busy}
                aria-label="Close notification preview"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border-2 border-white/25 bg-white/10 text-white transition hover:bg-white/15 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/25 disabled:opacity-50"
              >
                <X size={16} />
              </button>
            </div>
          </header>

          <div
            ref={bodyRef}
            className="min-h-0 overflow-y-auto overscroll-contain bg-[#FFF8EF]"
          >
            <div className="min-w-0 space-y-4 p-5 sm:p-6">
              {highRisk ? (
                <div className="flex min-w-0 items-start gap-3 rounded-[1.35rem] border-[3px] border-[#FB7185] bg-[#FFF4F4] p-4 text-red-900 shadow-[0_8px_22px_rgba(18,56,101,0.05)]">
                  <AlertTriangle size={18} className="mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-black">
                      High-impact student message
                    </p>
                    <p className="mt-1 text-xs font-semibold leading-5">
                      This message may materially affect or worry the student.
                      Check the wording and recipient carefully before continuing.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex min-w-0 items-start gap-3 rounded-[1.35rem] border-[3px] border-[#123865] bg-[#F2F7FF] p-4 text-blue-900 shadow-[0_8px_22px_rgba(18,56,101,0.05)]">
                  <CheckCircle2 size={18} className="mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-black">
                      Meaningful student-facing milestone
                    </p>
                    <p className="mt-1 text-xs font-semibold leading-5">
                      This qualifies for communication. Internal notes, sorting,
                      priority changes, and minor metadata remain silent.
                    </p>
                  </div>
                </div>
              )}

              <div className="grid gap-3 sm:grid-cols-2">
                <InfoCard
                  label="Recipient"
                  value={preview.recipientName || "Student"}
                />
                <InfoCard
                  label="Email"
                  value={
                    preview.recipientEmail || "No student email available"
                  }
                  tone={preview.recipientEmail ? "default" : "danger"}
                />
              </div>

              <InfoCard
                label="Triggered by"
                value={
                  preview.trigger || preview.eventLabel || "Admin change"
                }
              />

              <div className="min-w-0 rounded-[1.35rem] border-[3px] border-[#C9D7E6] bg-white p-4 shadow-[0_7px_18px_rgba(18,56,101,0.04)]">
                <p className="text-[10px] font-black uppercase tracking-[0.13em] text-slate-500">
                  Subject
                </p>
                <p className="mt-2 text-sm font-black leading-6 text-[#10233F]">
                  {preview.subject}
                </p>
              </div>

              <div className="min-w-0 rounded-[1.35rem] border-[3px] border-[#C9D7E6] bg-white p-4 shadow-[0_7px_18px_rgba(18,56,101,0.04)]">
                <div className="flex min-w-0 items-center gap-2">
                  <Sparkles size={14} className="text-orange-600" />
                  <p className="text-[10px] font-black uppercase tracking-[0.13em] text-slate-500">
                    Exact message
                  </p>
                </div>
                <p className="mt-3 whitespace-pre-wrap text-sm font-semibold leading-7 text-slate-700">
                  {preview.message}
                </p>
              </div>

              {preparing ? (
                <div className="flex min-w-0 items-center gap-2 rounded-xl border-2 border-[#60A5FA] bg-[#F2F7FF] px-3 py-2.5 text-[11px] font-bold text-blue-900">
                  <Clock3 size={13} className="animate-pulse" />
                  Securing this preview in the background… You can review the
                  message now; the final button unlocks automatically when ready.
                </div>
              ) : preparationError ? (
                <div className="rounded-xl border-[3px] border-[#FB7185] bg-[#FFF4F4] px-3 py-3 text-xs font-bold leading-5 text-red-900 shadow-[0_6px_16px_rgba(18,56,101,0.04)]">
                  Security preparation failed: {preparationError}
                  <br />
                  Close this preview and try the action again. No student-facing
                  change has been made.
                </div>
              ) : expiresLabel ? (
                <div className="flex min-w-0 items-center gap-2 rounded-xl border-2 border-[#C9D7E6] bg-white px-3 py-2.5 text-[11px] font-bold text-slate-600">
                  <Clock3 size={13} />
                  Security preview valid until approximately {expiresLabel}.
                  Re-open the preview if it expires.
                </div>
              ) : null}

              {!preview.sendable ? (
                <div className="rounded-[1.35rem] border-[3px] border-[#FB7185] bg-[#FFF4F4] p-4 text-sm font-bold leading-6 text-red-900 shadow-[0_8px_22px_rgba(18,56,101,0.05)]">
                  This student has no usable email address. The Admin change may
                  still be confirmed, but no email will be delivered.
                </div>
              ) : null}

              {requiredPhrase ? (
                <label className="block min-w-0 rounded-[1.35rem] border-[3px] border-[#FB7185] bg-white p-4 shadow-[0_8px_22px_rgba(18,56,101,0.05)]">
                  <span className="text-[10px] font-black uppercase tracking-[0.13em] text-red-700">
                    Strong confirmation required
                  </span>
                  <p className="mt-2 text-xs font-semibold leading-5 text-slate-600">
                    Type{" "}
                    <strong className="select-all text-[#10233F]">
                      {requiredPhrase}
                    </strong>{" "}
                    exactly to unlock the final action.
                  </p>
                  <input
                    value={confirmationText}
                    onChange={(event) =>
                      setConfirmationText(event.target.value)
                    }
                    disabled={busy}
                    autoComplete="off"
                    spellCheck={false}
                    className="mt-3 h-11 min-w-0 w-full rounded-xl border-2 border-[#FB7185] bg-[#FFFDF8] px-3 text-sm font-black text-[#10233F] outline-none transition focus:border-red-500 focus:ring-4 focus:ring-red-100 disabled:opacity-50"
                  />
                </label>
              ) : null}

              <div className="sticky bottom-0 -mx-5 -mb-5 grid min-w-0 gap-2 border-t-[3px] border-[#FF5A0A] bg-[#FFF8EF]/96 p-5 backdrop-blur-md sm:-mx-6 sm:-mb-6 sm:grid-cols-2 sm:p-6">
                <button
                  type="button"
                  onClick={onCancel}
                  disabled={busy}
                  className="h-12 rounded-xl border-2 border-[#C9D7E6] bg-white text-sm font-black text-[#10233F] transition hover:border-[#FF5A0A] hover:bg-[#FFF4E8] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-orange-100 disabled:opacity-50"
                >
                  Cancel / Back
                </button>

                <button
                  type="button"
                  onClick={() => onConfirm(confirmationText)}
                  disabled={
                    busy ||
                    preparing ||
                    Boolean(preparationError) ||
                    !phraseMatches
                  }
                  className={`h-12 rounded-xl border-2 text-sm font-black text-white shadow-[0_10px_24px_rgba(18,56,101,0.10)] transition hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-orange-100 disabled:cursor-not-allowed disabled:opacity-45 ${
                    highRisk
                      ? "border-red-700 bg-red-700 hover:bg-red-800"
                      : "border-[#FF5A0A] bg-[#FF5A0A] hover:bg-orange-600"
                  }`}
                >
                  {busy
                    ? "Processing..."
                    : preparing
                    ? "Securing Preview..."
                    : preview.domain === "manual_email"
                    ? "Confirm & Send Email"
                    : preview.sendable
                    ? "Confirm Change & Send"
                    : "Confirm Change Only"}
                </button>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

function InfoCard({ label, value, tone = "default" }) {
  return (
    <div
      className={`min-w-0 rounded-[1.35rem] border-[3px] p-4 shadow-[0_7px_18px_rgba(18,56,101,0.04)] ${
        tone === "danger"
          ? "border-red-300 bg-red-50"
          : "border-[#C9D7E6] bg-white"
      }`}
    >
      <p className="text-[10px] font-black uppercase tracking-[0.13em] text-slate-500">
        {label}
      </p>
      <p
        className={`mt-2 break-words text-sm font-black leading-6 ${
          tone === "danger" ? "text-red-800" : "text-[#10233F]"
        }`}
      >
        {value || "—"}
      </p>
    </div>
  );
}

export default StudentNotificationPreviewModal;