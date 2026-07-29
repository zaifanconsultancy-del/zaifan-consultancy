// WhatsAppWorkspace V3 MAXIMUM — Student Communication Command Center
// src/components/admin/WhatsAppWorkspace.jsx
//
// Maximum Zaifan Admin OS pass:
// - preserves template generation, personalization, WhatsApp deep-link, copy and draft saving
// - adds safer phone normalization for Pakistan/international numbers
// - prevents malformed wa.me links such as local "03..." numbers without country code
// - deterministic context-aware template intelligence from live student data
// - template categories, quick reset, character count and send-readiness state
// - robust clipboard fallback and error feedback
// - robust draft-save feedback without relying on alert()
// - prevents accidental duplicate save clicks
// - supports optional communication history callback payloads with richer metadata
// - preserves backward compatibility with onSaveDraft(message)
// - mobile-friendly action hierarchy and approved Zaifan Admin OS styling
// - no GPT calls and no fake sent/delivered state

import { useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Clipboard,
  Clock3,
  FileText,
  MailCheck,
  MessageCircle,
  Phone,
  RefreshCcw,
  Save,
  Send,
  ShieldCheck,
  Sparkles,
  UserRound,
  X,
} from "lucide-react";

const TEMPLATE_GROUPS = {
  followup: {
    label: "Follow-up",
    icon: MessageCircle,
  },
  reminder: {
    label: "Reminder",
    icon: Clock3,
  },
  documents: {
    label: "Documents",
    icon: FileText,
  },
  consultation: {
    label: "Consultation",
    icon: UserRound,
  },
  visa: {
    label: "Visa",
    icon: ShieldCheck,
  },
};

const sanitizePhone = (value = "") =>
  String(value || "").replace(/[^\d+]/g, "").trim();

function normalizeWhatsAppNumber(value = "") {
  const raw = sanitizePhone(value);

  if (!raw) return "";

  const digits = raw.replace(/\D/g, "");

  // Pakistan local mobile: 03XXXXXXXXX -> 923XXXXXXXXX
  if (/^03\d{9}$/.test(digits)) {
    return `92${digits.slice(1)}`;
  }

  // Pakistan national without leading zero: 3XXXXXXXXX -> 923XXXXXXXXX
  if (/^3\d{9}$/.test(digits)) {
    return `92${digits}`;
  }

  // Pakistan international already present.
  if (/^92\d{10}$/.test(digits)) {
    return digits;
  }

  // Generic international number. Keep digits as-is.
  if (digits.length >= 8 && digits.length <= 15) {
    return digits;
  }

  return "";
}

function WhatsAppWorkspace({
  student = {},
  saving = false,
  onSaveDraft = null,
}) {
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [selectedMessage, setSelectedMessage] = useState("");
  const [feedback, setFeedback] = useState(null);
  const [localSaving, setLocalSaving] = useState(false);

  const fullName =
    student?.full_name ||
    student?.name ||
    student?.student_name ||
    "Student";

  const phone =
    student?.phone ||
    student?.phone_number ||
    student?.whatsapp ||
    "";

  const normalizedPhone = useMemo(
    () => normalizeWhatsAppNumber(phone),
    [phone]
  );

  const country =
    student?.country ||
    student?.country_interest ||
    student?.preferred_country ||
    "";

  const program =
    student?.program ||
    student?.field_of_interest ||
    student?.course ||
    student?.study_field ||
    student?.consultation_type ||
    "";

  const status =
    student?.status ||
    student?.application_status ||
    student?.appointment_stage ||
    student?.pipeline_stage ||
    "";

  const priority = String(student?.priority || "").toLowerCase();

  const templates = useMemo(() => {
    const pendingDocuments = Array.isArray(student?.documents)
      ? student.documents
          .filter((doc) =>
            ["missing", "rejected", "expired"].includes(
              String(doc?.status || "").toLowerCase()
            )
          )
          .map((doc) => doc.document_name)
          .filter(Boolean)
          .slice(0, 6)
      : [];

    const documentText = pendingDocuments.length
      ? pendingDocuments.join(", ")
      : "Passport, Transcript, Degree, IELTS/PTE, CV, Personal Statement, and Financial Documents if available";

    const contextLine = [
      country ? `country: ${country}` : "",
      program ? `program: ${program}` : "",
    ]
      .filter(Boolean)
      .join(" · ");

    const items = [
      {
        id: "followup",
        category: "followup",
        label: "Follow-up Message",
        helper: "General counselor check-in",
        message: `Hi ${fullName}, this is Zaifan Consultancy. I wanted to follow up regarding your study abroad process. Please let us know when you are available so we can move your case forward.`,
      },
      {
        id: "reminder",
        category: "reminder",
        label: "Reminder Message",
        helper: "Pending information reminder",
        message: `Hi ${fullName}, gentle reminder from Zaifan Consultancy. Please share the pending information so we can continue your process without delay.`,
      },
      {
        id: "documents",
        category: "documents",
        label: "Document Request",
        helper: pendingDocuments.length
          ? `${pendingDocuments.length} live document gap(s)`
          : "Standard document request",
        message: `Hi ${fullName}, please share the pending document${
          pendingDocuments.length === 1 ? "" : "s"
        }: ${documentText}. Once received, we can continue the next step of your application.`,
      },
      {
        id: "consultation",
        category: "consultation",
        label: "Consultation Invite",
        helper: "Invite student to counselor discussion",
        message: `Hi ${fullName}, we would like to schedule a consultation to discuss your ${
          contextLine || "country, university, program, scholarship, and visa options"
        }. Please share a suitable time for you.`,
      },
    ];

    const application = student?.application || null;
    const visaStatus = String(
      application?.visa_status || student?.visa_status || ""
    ).toLowerCase();

    const offerStatus = String(
      application?.offer_status || student?.offer_status || ""
    ).toLowerCase();

    if (
      ["offer_received", "offer accepted", "offer_accepted"].includes(
        offerStatus.replace(/\s+/g, "_")
      ) ||
      ["offer_received", "offer_accepted"].includes(offerStatus)
    ) {
      items.push({
        id: "visa-start",
        category: "visa",
        label: "Start Visa Preparation",
        helper: "Offer-stage next step",
        message: `Hi ${fullName}, congratulations on reaching the offer stage. The next step is to prepare your visa file. Please keep your financial, academic, accommodation, insurance, and identity documents ready so we can guide you through the process.`,
      });
    }

    if (
      visaStatus &&
      !["not_started", "approved", "visa_approved", "completed"].includes(
        visaStatus
      )
    ) {
      items.push({
        id: "visa-progress",
        category: "visa",
        label: "Visa Progress Update",
        helper: "Active visa case follow-up",
        message: `Hi ${fullName}, this is Zaifan Consultancy with a quick follow-up on your visa process. Please let us know if you have received any new embassy/VFS update or if any document, appointment, or financial requirement is still pending.`,
      });
    }

    if (priority === "vip" || priority === "high") {
      items.unshift({
        id: "priority",
        category: "followup",
        label: "Priority Follow-up",
        helper: "High-priority student",
        message: `Hi ${fullName}, this is Zaifan Consultancy following up personally on your study abroad process. Your case is being treated as a priority. Please share your latest update so we can move the next step quickly.`,
      });
    }

    return items;
  }, [
    fullName,
    country,
    program,
    priority,
    student?.documents,
    student?.application,
    student?.visa_status,
    student?.offer_status,
  ]);

  const defaultMessage = `Hi ${fullName}, this is Zaifan Consultancy. I wanted to follow up with you regarding your study abroad process.`;

  const message = selectedMessage || defaultMessage;
  const trimmedMessage = message.trim();

  const whatsappReady =
    Boolean(normalizedPhone) && Boolean(trimmedMessage);

  const isSaving = saving || localSaving;

  const activeTemplate =
    templates.find((item) => item.id === selectedTemplateId) || null;

  const selectTemplate = (template) => {
    setSelectedTemplateId(template.id);
    setSelectedMessage(template.message);
    setFeedback(null);
  };

  const resetMessage = () => {
    setSelectedTemplateId("");
    setSelectedMessage("");
    setFeedback(null);
  };

  const openWhatsApp = () => {
    if (!normalizedPhone) {
      setFeedback({
        tone: "red",
        text:
          phone
            ? "This phone number could not be converted into a valid WhatsApp international number."
            : "No phone number is saved for this student.",
      });
      return;
    }

    if (!trimmedMessage) {
      setFeedback({
        tone: "red",
        text: "Write or select a message before opening WhatsApp.",
      });
      return;
    }

    const url = `https://wa.me/${normalizedPhone}?text=${encodeURIComponent(
      trimmedMessage
    )}`;

    const opened = window.open(
      url,
      "_blank",
      "noopener,noreferrer"
    );

    if (!opened) {
      setFeedback({
        tone: "orange",
        text:
          "WhatsApp could not be opened. Your browser may be blocking pop-ups.",
      });
      return;
    }

    setFeedback({
      tone: "green",
      text:
        "WhatsApp opened with the message pre-filled. The message is not marked as sent until you send it in WhatsApp.",
    });
  };

  const copyMessage = async () => {
    if (!trimmedMessage) {
      setFeedback({
        tone: "red",
        text: "There is no message to copy.",
      });
      return;
    }

    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(trimmedMessage);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = trimmedMessage;
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();

        const copied = document.execCommand("copy");
        document.body.removeChild(textarea);

        if (!copied) {
          throw new Error("Clipboard copy was not available.");
        }
      }

      setFeedback({
        tone: "green",
        text: "WhatsApp message copied.",
      });
    } catch (error) {
      console.error("WhatsApp copy failed:", error);

      setFeedback({
        tone: "red",
        text:
          error?.message ||
          "Message could not be copied.",
      });
    }
  };

  const saveDraft = async () => {
    if (isSaving) return;

    if (!trimmedMessage) {
      setFeedback({
        tone: "red",
        text: "Write or select a message before saving a draft.",
      });
      return;
    }

    if (typeof onSaveDraft !== "function") {
      setFeedback({
        tone: "orange",
        text:
          "Draft saving is not connected to communication history yet.",
      });
      return;
    }

    setLocalSaving(true);
    setFeedback(null);

    try {
      let saved;

      // Backward-compatible first argument remains the raw message string.
      // Rich metadata is passed as the second argument for upgraded parents.
      saved = await Promise.resolve(
        onSaveDraft(trimmedMessage, {
          channel: "whatsapp",
          studentId: student?.id || null,
          studentType:
            student?.student_type ||
            student?.__leadType ||
            student?.type ||
            "inquiry",
          phone: normalizedPhone || phone || null,
          templateId: activeTemplate?.id || null,
          templateLabel: activeTemplate?.label || null,
          status: "draft",
          createdAt: new Date().toISOString(),
        })
      );

      if (saved === false) {
        throw new Error("Communication history did not confirm the draft save.");
      }

      setFeedback({
        tone: "green",
        text: "WhatsApp draft saved to communication history.",
      });
    } catch (error) {
      console.error("WhatsApp draft save failed:", error);

      setFeedback({
        tone: "red",
        text:
          error?.message ||
          "WhatsApp draft could not be saved.",
      });
    } finally {
      setLocalSaving(false);
    }
  };

  return (
    <section className="overflow-hidden rounded-[1.8rem] border-[3px] border-orange-300 bg-white shadow-[0_12px_30px_rgba(15,35,63,0.06)]">
      <div
        className="bg-[#0b2a57] p-5 sm:p-6"
        style={{ color: "#ffffff" }}
      >
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-3 py-1.5">
              <MessageCircle
                className="h-4 w-4"
                style={{ color: "#FDBA74" }}
              />

              <p
                className="text-[9px] font-black uppercase tracking-[0.15em]"
                style={{ color: "#ffffff" }}
              >
                Student Communication
              </p>
            </div>

            <h3
              className="mt-3 text-2xl font-black"
              style={{ color: "#ffffff" }}
            >
              WhatsApp Workspace
            </h3>

            <p
              className="mt-2 max-w-2xl text-sm font-semibold leading-6"
              style={{ color: "#ffffff" }}
            >
              Build counselor messages from live student context, save drafts
              to communication history, copy safely, and open WhatsApp with a
              correctly formatted international number.
            </p>
          </div>

          <div className="grid gap-2 sm:grid-cols-2 lg:min-w-[340px]">
            <HeaderMetric
              icon={Phone}
              label="Student Phone"
              value={phone || "No phone"}
            />

            <HeaderMetric
              icon={ShieldCheck}
              label="WhatsApp Ready"
              value={normalizedPhone ? `+${normalizedPhone}` : "Needs phone fix"}
              alert={!normalizedPhone}
            />
          </div>
        </div>
      </div>

      <div className="space-y-5 bg-[#fffaf4] p-4 sm:p-5">
        {feedback ? (
          <Feedback
            tone={feedback.tone}
            onClose={() => setFeedback(null)}
          >
            {feedback.text}
          </Feedback>
        ) : null}

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <ContextCard
            label="Student"
            value={fullName}
            icon={UserRound}
          />
          <ContextCard
            label="Destination"
            value={country || "Not selected"}
            icon={Sparkles}
          />
          <ContextCard
            label="Program"
            value={program || "Not selected"}
            icon={FileText}
          />
          <ContextCard
            label="CRM Status"
            value={status || "Not selected"}
            icon={MailCheck}
          />
        </div>

        <section className="rounded-[1.5rem] border-2 border-slate-300 bg-white p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.12em] text-orange-700">
                Message Templates
              </p>

              <h4 className="mt-1 text-lg font-black text-[#10233f]">
                Counselor Quick Actions
              </h4>

              <p className="mt-1 text-xs font-semibold text-slate-500">
                Templates are deterministic and personalized from the current
                student record.
              </p>
            </div>

            <span className="w-fit rounded-full border-2 border-orange-300 bg-orange-50 px-3 py-1 text-[10px] font-black text-orange-800">
              {templates.length} templates
            </span>
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {templates.map((template) => {
              const Icon =
                TEMPLATE_GROUPS[template.category]?.icon ||
                MessageCircle;

              const active = selectedTemplateId === template.id;

              return (
                <button
                  key={template.id}
                  type="button"
                  onClick={() => selectTemplate(template)}
                  aria-pressed={active}
                  className={`rounded-2xl border-2 p-4 text-left transition ${
                    active
                      ? "border-orange-500 bg-orange-500 text-white shadow-[0_8px_18px_rgba(249,115,22,0.16)]"
                      : "border-slate-300 bg-[#fffaf4] text-[#10233f] hover:-translate-y-0.5 hover:border-orange-400 hover:bg-orange-50"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-xl border-2 ${
                        active
                          ? "border-white/40 bg-white/10"
                          : "border-orange-300 bg-white text-orange-700"
                      }`}
                    >
                      <Icon size={16} />
                    </div>

                    <span
                      className={`rounded-full border px-2 py-0.5 text-[9px] font-black uppercase ${
                        active
                          ? "border-white/30 bg-white/10 text-white"
                          : "border-slate-300 bg-white text-slate-600"
                      }`}
                    >
                      {TEMPLATE_GROUPS[template.category]?.label ||
                        template.category}
                    </span>
                  </div>

                  <p className="mt-3 font-black">
                    {template.label}
                  </p>

                  <p
                    className={`mt-1 text-xs font-semibold leading-5 ${
                      active ? "text-white" : "text-slate-600"
                    }`}
                  >
                    {template.helper}
                  </p>
                </button>
              );
            })}
          </div>
        </section>

        <section className="rounded-[1.5rem] border-[3px] border-orange-300 bg-white p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.12em] text-orange-700">
                Message Composer
              </p>

              <h4 className="mt-1 text-lg font-black text-[#10233f]">
                {activeTemplate?.label || "Custom WhatsApp Message"}
              </h4>
            </div>

            <button
              type="button"
              onClick={resetMessage}
              className="inline-flex w-fit items-center gap-2 rounded-xl border-2 border-slate-300 bg-white px-3 py-2 text-xs font-black text-slate-700 transition hover:border-orange-400 hover:bg-orange-50 hover:text-orange-800"
            >
              <RefreshCcw size={13} />
              Reset
            </button>
          </div>

          <textarea
            value={selectedMessage}
            onChange={(event) => {
              setSelectedTemplateId("");
              setSelectedMessage(event.target.value);
              setFeedback(null);
            }}
            placeholder="Choose a template or write a custom WhatsApp message..."
            className="mt-4 min-h-[170px] w-full resize-y rounded-2xl border-2 border-slate-300 bg-[#fffaf4] p-4 text-sm font-semibold leading-7 text-[#10233f] outline-none placeholder:text-slate-400 focus:border-orange-400 focus:bg-white focus:ring-4 focus:ring-orange-100"
          />

          {!selectedMessage ? (
            <div className="mt-2 rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-800">
              Preview uses the default follow-up until you select a template or
              type a custom message.
            </div>
          ) : null}

          <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap gap-2">
              <ComposerBadge
                label={`${trimmedMessage.length} characters`}
              />

              <ComposerBadge
                label={
                  normalizedPhone
                    ? "Phone normalized"
                    : "Phone needs attention"
                }
                tone={normalizedPhone ? "green" : "red"}
              />

              <ComposerBadge
                label={activeTemplate ? activeTemplate.label : "Custom"}
                tone="orange"
              />
            </div>

            <p className="text-[10px] font-semibold text-slate-500">
              Opening WhatsApp does not automatically mark the message as sent.
            </p>
          </div>
        </section>

        <div className="grid gap-3 md:grid-cols-3">
          <button
            type="button"
            onClick={openWhatsApp}
            disabled={!whatsappReady}
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border-2 border-[#0b2a57] bg-[#0b2a57] px-5 py-3 text-sm font-black text-white shadow-[0_8px_18px_rgba(15,35,63,0.16)] transition hover:-translate-y-0.5 hover:bg-[#183f72] disabled:cursor-not-allowed disabled:border-slate-300 disabled:bg-slate-200 disabled:text-slate-500 disabled:shadow-none"
          >
            <Send size={16} />
            Open WhatsApp
          </button>

          <button
            type="button"
            onClick={saveDraft}
            disabled={isSaving || !trimmedMessage}
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border-2 border-orange-400 bg-orange-50 px-5 py-3 text-sm font-black text-orange-800 transition hover:-translate-y-0.5 hover:bg-orange-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Save size={16} />
            {isSaving ? "Saving Draft..." : "Save Draft"}
          </button>

          <button
            type="button"
            onClick={copyMessage}
            disabled={!trimmedMessage}
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border-2 border-slate-300 bg-white px-5 py-3 text-sm font-black text-[#10233f] transition hover:-translate-y-0.5 hover:border-orange-400 hover:bg-orange-50 hover:text-orange-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Clipboard size={16} />
            Copy Message
          </button>
        </div>

        {!normalizedPhone ? (
          <div className="rounded-2xl border-2 border-red-300 bg-red-50 p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle
                size={18}
                className="mt-0.5 shrink-0 text-red-700"
              />

              <div>
                <p className="text-sm font-black text-red-900">
                  WhatsApp number needs attention
                </p>

                <p className="mt-1 text-xs font-semibold leading-5 text-red-800">
                  Save the student's phone in a valid local Pakistan format
                  such as 03305718131 or international format such as
                  +923305718131. The workspace converts valid Pakistani local
                  numbers to the international wa.me format automatically.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border-2 border-emerald-300 bg-emerald-50 p-4">
            <div className="flex items-start gap-3">
              <CheckCircle2
                size={18}
                className="mt-0.5 shrink-0 text-emerald-700"
              />

              <div>
                <p className="text-sm font-black text-emerald-900">
                  WhatsApp launch ready
                </p>

                <p className="mt-1 text-xs font-semibold leading-5 text-emerald-800">
                  The workspace will open WhatsApp using +{normalizedPhone}.
                  You still review and send the message manually inside
                  WhatsApp.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function HeaderMetric({
  icon: Icon,
  label,
  value,
  alert = false,
}) {
  return (
    <div className="rounded-xl border border-white/25 bg-white/10 p-3">
      <div className="flex items-center gap-2">
        <Icon
          size={14}
          style={{
            color: alert ? "#FCA5A5" : "#FDBA74",
          }}
        />

        <p
          className="text-[9px] font-black uppercase tracking-[0.1em]"
          style={{ color: "#ffffff" }}
        >
          {label}
        </p>
      </div>

      <p
        className="mt-1 truncate text-xs font-black"
        style={{ color: "#ffffff" }}
        title={String(value || "")}
      >
        {value}
      </p>
    </div>
  );
}

function ContextCard({
  label,
  value,
  icon: Icon,
}) {
  return (
    <div className="rounded-2xl border-2 border-slate-300 bg-white p-4">
      <div className="flex items-center gap-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl border-2 border-orange-300 bg-orange-50">
          <Icon
            size={15}
            className="text-orange-700"
          />
        </div>

        <div className="min-w-0">
          <p className="text-[9px] font-black uppercase tracking-[0.1em] text-slate-500">
            {label}
          </p>

          <p
            className="mt-0.5 truncate text-sm font-black text-[#10233f]"
            title={String(value || "")}
          >
            {value}
          </p>
        </div>
      </div>
    </div>
  );
}

function ComposerBadge({
  label,
  tone = "slate",
}) {
  const styles = {
    slate:
      "border-slate-300 bg-slate-50 text-slate-700",
    orange:
      "border-orange-300 bg-orange-50 text-orange-800",
    green:
      "border-emerald-300 bg-emerald-50 text-emerald-800",
    red:
      "border-red-300 bg-red-50 text-red-800",
  };

  return (
    <span
      className={`rounded-full border px-2.5 py-1 text-[9px] font-black uppercase ${
        styles[tone] || styles.slate
      }`}
    >
      {label}
    </span>
  );
}

function Feedback({
  tone = "green",
  children,
  onClose,
}) {
  const style =
    tone === "red"
      ? "border-red-300 bg-red-50 text-red-900"
      : tone === "orange"
      ? "border-amber-300 bg-amber-50 text-amber-900"
      : "border-emerald-300 bg-emerald-50 text-emerald-900";

  return (
    <div
      className={`flex items-start justify-between gap-3 rounded-2xl border-2 p-3 ${style}`}
    >
      <p className="text-sm font-bold leading-6">
        {children}
      </p>

      <button
        type="button"
        onClick={onClose}
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-current/20 bg-white/50"
        aria-label="Close message"
      >
        <X size={14} />
      </button>
    </div>
  );
}

export default WhatsAppWorkspace;
