// EmailWorkspace V6 PARTNER OS — Student Communication Composer
// src/components/admin/workspaces/communications/EmailWorkspace.jsx
//
// Maximum pass:
// - preserves student / saving / onSaveDraft API
// - keeps mailto workflow for opening the local mail client
// - preserves existing template behavior
// - safer student-name/email normalization
// - adds stronger template set + purpose categories
// - adds subject/body limits and validation
// - adds copy success/error state without blocking alerts
// - adds save-draft success/error state around parent callback
// - adds unsaved-change awareness
// - adds quick reset to active template
// - adds recipient / subject / body readiness indicators
// - better fallback when Clipboard API is unavailable
// - Ctrl/Cmd + Enter opens the email client when ready
// - reduced-motion support
// - stronger accessible controls
// - explicit white text on navy surfaces
// - stronger Zaifan Admin OS orange/navy structure
// - no fake Supabase write added; draft persistence remains parent-controlled
// - complete Partner OS workspace alignment with stronger hierarchy and action clarity
// - neutral structural borders, cream workspace canvas, orange reserved for action emphasis
// - preserves all existing composer behavior and parent contracts

import {
  CheckCircle2,
  Clipboard,
  Copy,
  FileText,
  Mail,
  MessageSquareText,
  RefreshCw,
  Save,
  Send,
  ShieldCheck,
  Sparkles,
  UserRound,
  X,
} from "lucide-react";
import {
  motion,
  useReducedMotion,
} from "framer-motion";
import {
  useEffect,
  useMemo,
  useState,
} from "react";

const MAX_SUBJECT_LENGTH = 180;
const MAX_BODY_LENGTH = 12000;

function cleanText(value = "") {
  return String(value || "").trim();
}

function EmailWorkspace({
  student = {},
  saving = false,
  onSaveDraft = null,
}) {
  const reduceMotion = useReducedMotion();

  const fullName =
    cleanText(
      student?.full_name ||
        student?.name ||
        student?.student_name
    ) || "Student";

  const email =
    cleanText(student?.email);

  const templates = useMemo(
    () => [
      {
        label: "Welcome Email",
        category: "Onboarding",
        subject: "Welcome to Zaifan Consultancy",
        body: `Hi ${fullName},

Welcome to Zaifan Consultancy. We are happy to guide you through your study abroad journey.

Our team can support you with destination planning, university shortlisting, applications, documents, and visa guidance.

Best regards,
Zaifan Consultancy Team`,
      },
      {
        label: "Application Email",
        category: "Application",
        subject: "Your University Application Update",
        body: `Hi ${fullName},

We are reviewing your university application process.

Please make sure your academic documents, passport, CV, personal statement, and English-language evidence are ready where required.

Best regards,
Zaifan Consultancy Team`,
      },
      {
        label: "Visa Guidance Email",
        category: "Visa",
        subject: "Visa Process Guidance",
        body: `Hi ${fullName},

Your visa process requires careful preparation.

Please keep your financial documents, academic documents, passport, offer letter, and other supporting documents ready for review.

Best regards,
Zaifan Consultancy Team`,
      },
      {
        label: "Document Reminder",
        category: "Documents",
        subject: "Pending Documents Reminder",
        body: `Hi ${fullName},

This is a reminder to share your pending documents so we can continue your application process smoothly.

Please let us know if you need help understanding any document requirement.

Best regards,
Zaifan Consultancy Team`,
      },
      {
        label: "Follow-Up Email",
        category: "Follow-Up",
        subject: "Quick Follow-Up from Zaifan Consultancy",
        body: `Hi ${fullName},

We are following up regarding your study abroad plan.

Please reply with any updates, questions, or pending information so we can guide you on the next step.

Best regards,
Zaifan Consultancy Team`,
      },
      {
        label: "Appointment Follow-Up",
        category: "Consultation",
        subject: "Follow-Up After Your Zaifan Consultation",
        body: `Hi ${fullName},

Thank you for speaking with Zaifan Consultancy.

We are following up on the points discussed during your consultation. Please send any pending information or documents so we can continue with the next step.

Best regards,
Zaifan Consultancy Team`,
      },
    ],
    [fullName]
  );

  const [activeTemplate, setActiveTemplate] = useState(
    templates[0].label
  );

  const [subject, setSubject] = useState(
    templates[0].subject
  );

  const [body, setBody] = useState(
    templates[0].body
  );

  const [copying, setCopying] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const activeTemplateData =
    templates.find(
      (template) =>
        template.label === activeTemplate
    ) || templates[0];

  useEffect(() => {
    const active =
      templates.find(
        (template) =>
          template.label === activeTemplate
      );

    if (!active) {
      setActiveTemplate(
        templates[0].label
      );
    }
  }, [templates, activeTemplate]);

  const subjectLength =
    subject.trim().length;

  const bodyLength =
    body.trim().length;

  const hasRecipient =
    Boolean(email);

  const hasSubject =
    subjectLength > 0;

  const hasBody =
    bodyLength > 0;

  const withinLimits =
    subject.length <=
      MAX_SUBJECT_LENGTH &&
    body.length <=
      MAX_BODY_LENGTH;

  const canSend =
    hasRecipient &&
    hasSubject &&
    hasBody &&
    withinLimits;

  const isDirty =
    subject !==
      activeTemplateData.subject ||
    body !==
      activeTemplateData.body;

  const applyTemplate = (
    template
  ) => {
    setActiveTemplate(
      template.label
    );
    setSubject(
      template.subject
    );
    setBody(template.body);
    setFeedback(null);
  };

  const resetTemplate = () => {
    setSubject(
      activeTemplateData.subject
    );
    setBody(
      activeTemplateData.body
    );
    setFeedback({
      tone: "info",
      message:
        "Template restored to its original content.",
    });
  };

  const openEmail = () => {
    if (!hasRecipient) {
      setFeedback({
        tone: "error",
        message:
          "No email address is available for this student.",
      });
      return;
    }

    if (!hasSubject || !hasBody) {
      setFeedback({
        tone: "error",
        message:
          "Add both a subject and message before opening the email client.",
      });
      return;
    }

    if (!withinLimits) {
      setFeedback({
        tone: "error",
        message:
          "The subject or message exceeds the safe composer limit.",
      });
      return;
    }

    window.location.href = `mailto:${encodeURIComponent(
      email
    )}?subject=${encodeURIComponent(
      subject.trim()
    )}&body=${encodeURIComponent(
      body.trim()
    )}`;
  };

  const copyEmail = async () => {
    if (!hasSubject || !hasBody) {
      setFeedback({
        tone: "error",
        message:
          "Add a subject and message before copying the email.",
      });
      return;
    }

    setCopying(true);
    setFeedback(null);

    const content = `Subject: ${subject.trim()}\n\n${body.trim()}`;

    try {
      if (
        navigator.clipboard &&
        typeof navigator.clipboard.writeText ===
          "function"
      ) {
        await navigator.clipboard.writeText(
          content
        );
      } else {
        const textarea =
          document.createElement(
            "textarea"
          );

        textarea.value =
          content;
        textarea.style.position =
          "fixed";
        textarea.style.opacity =
          "0";

        document.body.appendChild(
          textarea
        );

        textarea.focus();
        textarea.select();

        const copied =
          document.execCommand(
            "copy"
          );

        document.body.removeChild(
          textarea
        );

        if (!copied) {
          throw new Error(
            "Clipboard API is unavailable."
          );
        }
      }

      setFeedback({
        tone: "success",
        message:
          "Email copied to clipboard.",
      });
    } catch (error) {
      console.error(
        "Email copy failed:",
        error
      );

      setFeedback({
        tone: "error",
        message:
          error?.message ||
          "Email could not be copied.",
      });
    } finally {
      setCopying(false);
    }
  };

  const saveDraft = async () => {
    if (
      typeof onSaveDraft !==
      "function"
    ) {
      setFeedback({
        tone: "error",
        message:
          "Save Draft is not connected to a parent persistence handler yet.",
      });
      return;
    }

    if (!hasSubject || !hasBody) {
      setFeedback({
        tone: "error",
        message:
          "Add a subject and message before saving a draft.",
      });
      return;
    }

    if (!withinLimits) {
      setFeedback({
        tone: "error",
        message:
          "The draft exceeds the safe composer length.",
      });
      return;
    }

    setFeedback(null);

    try {
      const saved =
        await onSaveDraft({
          subject:
            subject.trim(),
          body:
            body.trim(),
          recipient: email || null,
          template:
            activeTemplate,
        });

      if (saved) {
        setFeedback({
          tone: "success",
          message:
            "Email draft saved to communication history.",
        });
      } else {
        setFeedback({
          tone: "error",
          message:
            "The draft handler did not confirm that the draft was saved.",
        });
      }
    } catch (error) {
      console.error(
        "Email draft save failed:",
        error
      );

      setFeedback({
        tone: "error",
        message:
          error?.message ||
          "Email draft could not be saved.",
      });
    }
  };

  const handleKeyDown = (
    event
  ) => {
    if (
      (event.ctrlKey ||
        event.metaKey) &&
      event.key === "Enter"
    ) {
      event.preventDefault();

      if (canSend) {
        openEmail();
      }
    }
  };

  return (
    <motion.section
      initial={
        reduceMotion
          ? false
          : {
              opacity: 0,
              y: 10,
            }
      }
      animate={{
        opacity: 1,
        y: 0,
      }}
      transition={{
        duration:
          reduceMotion
            ? 0
            : 0.26,
      }}
      className="min-w-0 overflow-hidden rounded-[1.9rem] border-[3px] border-[#123865] bg-[#FFF8EF] shadow-[0_18px_46px_rgba(15,35,63,0.10)]"
      onKeyDown={
        handleKeyDown
      }
    >
      <div className="grid xl:grid-cols-[1.18fr_0.82fr]">
        <div className="bg-[#123865] p-5 text-white sm:p-6">
          <div className="flex flex-wrap items-center gap-2">
            <HeaderBadge>
              <Mail size={11} />
              Student Communication
            </HeaderBadge>

            <HeaderBadge>
              <ShieldCheck size={11} />
              Review Before Sending
            </HeaderBadge>
          </div>

          <h2 className="mt-4 text-2xl font-black text-white sm:text-3xl">
            Email Workspace
          </h2>

          <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-white">
            Prepare reusable student emails, customize the message, save a draft
            through the connected parent workflow, copy the final text, or open it
            directly in your mail client.
          </p>

          <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
            <DarkMetric
              label="Recipient"
              value={
                hasRecipient
                  ? "Ready"
                  : "Missing"
              }
            />

            <DarkMetric
              label="Subject"
              value={
                hasSubject
                  ? "Ready"
                  : "Missing"
              }
            />

            <DarkMetric
              label="Message"
              value={
                hasBody
                  ? "Ready"
                  : "Missing"
              }
            />

            <DarkMetric
              label="Template"
              value={
                activeTemplateData.category
              }
            />
          </div>
        </div>

        <div className="border-t-[3px] border-[#FF5A0A] bg-[#FFF8EF] p-5 text-[#10233F] xl:border-l-[3px] xl:border-t-0 sm:p-6">
          <p className="text-[9px] font-black uppercase tracking-[0.14em] text-[#B84F0E]">
            Composer Status
          </p>

          <p className="mt-3 break-words text-lg font-black text-[#10233F]">
            {email ||
              "No student email"}
          </p>

          <div className="mt-4 grid grid-cols-2 gap-2">
            <OrangeMetric
              label="Subject"
              value={`${subject.length}/${MAX_SUBJECT_LENGTH}`}
            />

            <OrangeMetric
              label="Message"
              value={`${body.length}/${MAX_BODY_LENGTH}`}
            />
          </div>

          <div className="mt-4 rounded-xl border-2 border-[#C9D7E6] bg-white p-3 text-[#10233F]">
            <p className="text-[8px] font-black uppercase tracking-[0.1em] text-slate-500">
              Draft State
            </p>

            <p className="mt-1 text-sm font-black text-[#10233F]">
              {isDirty
                ? "Customized"
                : "Template unchanged"}
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-5 border-t-[3px] border-[#FF5A0A] bg-[#FFF8EF] p-4 sm:p-5 lg:p-6">
        {feedback ? (
          <FeedbackBanner
            feedback={
              feedback
            }
            onClose={() =>
              setFeedback(null)
            }
          />
        ) : null}

        <section className="rounded-[1.5rem] border-[3px] border-[#C9D7E6] bg-white p-4 shadow-[0_8px_22px_rgba(15,35,63,0.06)]">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Sparkles
                  size={14}
                  className="text-[#FF5A0A]"
                />

                <p className="text-[9px] font-black uppercase tracking-[0.13em] text-[#B84F0E]">
                  Quick Templates
                </p>
              </div>

              <h3 className="mt-1 text-lg font-black text-[#10233F]">
                Choose a communication starting point
              </h3>

              <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">
                Templates are staff starting points, not automatically sent messages.
              </p>
            </div>

            <span className="rounded-full border-2 border-[#FF5A0A] bg-[#FFF8EF] px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.1em] text-[#B84F0E]">
              Active: {activeTemplate}
            </span>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {templates.map(
              (template) => {
                const active =
                  activeTemplate ===
                  template.label;

                return (
                  <button
                    key={
                      template.label
                    }
                    type="button"
                    onClick={() =>
                      applyTemplate(
                        template
                      )
                    }
                    aria-pressed={
                      active
                    }
                    className={`rounded-[1.25rem] border-[3px] p-4 text-left transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#FFE1CF] ${
                      active
                        ? "border-[#FF5A0A] bg-[#FFF8EF] shadow-[0_8px_22px_rgba(15,35,63,0.06)]"
                        : "border-[#C9D7E6] bg-white hover:-translate-y-0.5 hover:border-[#FF5A0A]"
                    }`}
                  >
                    <p className="text-[8px] font-black uppercase tracking-[0.1em] text-slate-500">
                      {
                        template.category
                      }
                    </p>

                    <p className="mt-2 text-sm font-black text-[#10233F]">
                      {
                        template.label
                      }
                    </p>

                    <p className="mt-2 line-clamp-2 text-xs font-semibold leading-5 text-slate-600">
                      {
                        template.subject
                      }
                    </p>
                  </button>
                );
              }
            )}
          </div>
        </section>

        <section className="rounded-[1.5rem] border-[3px] border-[#C9D7E6] bg-white p-4 shadow-[0_8px_22px_rgba(15,35,63,0.06)]">
          <div className="grid gap-4">
            <ComposerField
              label="Recipient"
              icon={UserRound}
              helper={
                hasRecipient
                  ? "Student email is available."
                  : "Add an email to the student profile before opening the mail client."
              }
            >
              <div
                className={`rounded-xl border-2 px-4 py-3 text-sm font-bold ${
                  hasRecipient
                    ? "border-[#34D399] bg-[#F0FFF8] text-emerald-800"
                    : "border-[#FB7185] bg-[#FFF4F4] text-red-800"
                }`}
              >
                {email ||
                  "No email available"}
              </div>
            </ComposerField>

            <ComposerField
              label="Subject"
              icon={FileText}
              helper={`${subject.length}/${MAX_SUBJECT_LENGTH} characters`}
            >
              <input
                value={subject}
                maxLength={
                  MAX_SUBJECT_LENGTH
                }
                onChange={(
                  event
                ) =>
                  setSubject(
                    event.target
                      .value
                  )
                }
                placeholder="Email subject"
                className="w-full rounded-xl border-2 border-[#C9D7E6] bg-[#FFFDFC] px-4 py-3 text-sm font-semibold text-[#10233F] outline-none placeholder:text-slate-400 focus:border-[#FF5A0A] focus:ring-4 focus:ring-[#FFE1CF]"
              />
            </ComposerField>

            <ComposerField
              label="Message"
              icon={
                MessageSquareText
              }
              helper={`${body.length}/${MAX_BODY_LENGTH} characters`}
            >
              <textarea
                value={body}
                maxLength={
                  MAX_BODY_LENGTH
                }
                onChange={(
                  event
                ) =>
                  setBody(
                    event.target
                      .value
                  )
                }
                placeholder="Email body"
                className="min-h-[260px] w-full resize-y rounded-[1.35rem] border-2 border-[#C9D7E6] bg-[#FFFDFC] p-4 text-sm font-semibold leading-7 text-[#10233F] outline-none placeholder:text-slate-400 focus:border-[#FF5A0A] focus:ring-4 focus:ring-[#FFE1CF]"
              />
            </ComposerField>
          </div>

          <div className="mt-4 rounded-xl border-2 border-[#60A5FA] bg-[#F2F7FF] p-4">
            <p className="text-xs font-black text-[#10233F]">
              Composer shortcut
            </p>

            <p className="mt-1 text-xs font-semibold leading-5 text-slate-700">
              Ctrl/Cmd + Enter opens the message in your local mail client when the
              recipient, subject and message are ready.
            </p>
          </div>
        </section>

        <section className="flex flex-col gap-3 rounded-[1.5rem] border-[3px] border-[#C9D7E6] bg-white p-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={
                openEmail
              }
              disabled={
                !canSend
              }
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border-2 border-[#D94D08] bg-[#FF5A0A] px-5 text-sm font-black text-white shadow-[0_10px_24px_rgba(255,90,10,0.24)] transition hover:-translate-y-0.5 hover:bg-[#D94D08] disabled:cursor-not-allowed disabled:opacity-45"
            >
              <Send size={15} />
              Open Email
            </button>

            <button
              type="button"
              onClick={() =>
                void saveDraft()
              }
              disabled={
                saving ||
                !hasSubject ||
                !hasBody ||
                !withinLimits
              }
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border-2 border-[#FF5A0A] bg-[#FFF8EF] px-5 text-sm font-black text-[#B84F0E] transition hover:-translate-y-0.5 hover:border-[#FF5A0A] disabled:cursor-not-allowed disabled:opacity-45"
            >
              <Save size={15} />
              {saving
                ? "Saving Draft..."
                : "Save Draft"}
            </button>

            <button
              type="button"
              onClick={() =>
                void copyEmail()
              }
              disabled={
                copying ||
                !hasSubject ||
                !hasBody
              }
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border-2 border-[#C9D7E6] bg-white px-5 text-sm font-black text-[#10233F] transition hover:-translate-y-0.5 hover:border-[#FF5A0A] hover:bg-[#FFF3E8] disabled:cursor-not-allowed disabled:opacity-45"
            >
              {copying ? (
                <Clipboard
                  size={15}
                />
              ) : (
                <Copy size={15} />
              )}

              {copying
                ? "Copying..."
                : "Copy Email"}
            </button>

            <button
              type="button"
              onClick={
                resetTemplate
              }
              disabled={
                !isDirty
              }
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border-2 border-[#C9D7E6] bg-white px-5 text-sm font-black text-[#10233F] transition hover:-translate-y-0.5 hover:border-[#FF5A0A] hover:bg-[#FFF3E8] disabled:cursor-not-allowed disabled:opacity-40"
            >
              <RefreshCw size={15} />
              Reset Template
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            <ReadinessBadge
              ready={
                hasRecipient
              }
              label="Recipient"
            />

            <ReadinessBadge
              ready={
                hasSubject
              }
              label="Subject"
            />

            <ReadinessBadge
              ready={hasBody}
              label="Message"
            />
          </div>
        </section>
      </div>
    </motion.section>
  );
}

function ComposerField({
  label,
  icon: Icon,
  helper,
  children,
}) {
  return (
    <label className="grid gap-2">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.12em] text-slate-600">
          <Icon
            size={13}
            className="text-[#FF5A0A]"
          />
          {label}
        </span>

        <span className="text-[10px] font-bold text-slate-400">
          {helper}
        </span>
      </div>

      {children}
    </label>
  );
}

function ReadinessBadge({
  ready,
  label,
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border-2 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.08em] ${
        ready
          ? "border-[#34D399] bg-[#F0FFF8] text-emerald-800"
          : "border-[#FB7185] bg-[#FFF4F4] text-red-800"
      }`}
    >
      {ready ? (
        <CheckCircle2
          size={11}
        />
      ) : (
        <X size={11} />
      )}

      {label}
    </span>
  );
}

function FeedbackBanner({
  feedback,
  onClose,
}) {
  const style =
    feedback.tone ===
    "success"
      ? "border-[#34D399] bg-[#F0FFF8] text-emerald-900"
      : feedback.tone ===
        "info"
      ? "border-[#60A5FA] bg-[#F2F7FF] text-blue-900"
      : "border-[#FB7185] bg-[#FFF4F4] text-red-900";

  const Icon =
    feedback.tone ===
    "success"
      ? CheckCircle2
      : feedback.tone ===
        "info"
      ? Sparkles
      : X;

  return (
    <div
      role={
        feedback.tone ===
        "error"
          ? "alert"
          : "status"
      }
      className={`flex items-start gap-3 rounded-xl border-[3px] p-4 ${style}`}
    >
      <Icon
        size={17}
        className="mt-0.5 shrink-0"
      />

      <p className="min-w-0 flex-1 text-sm font-bold">
        {
          feedback.message
        }
      </p>

      <button
        type="button"
        onClick={
          onClose
        }
        aria-label="Dismiss message"
      >
        <X size={15} />
      </button>
    </div>
  );
}

function HeaderBadge({
  children,
}) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border-2 border-white/20 bg-white/10 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.1em] text-white">
      {children}
    </span>
  );
}

function DarkMetric({
  label,
  value,
}) {
  return (
    <div className="rounded-xl border-2 border-white/20 bg-white/10 p-3 text-white">
      <p className="text-[8px] font-black uppercase tracking-[0.1em] text-white">
        {label}
      </p>

      <p className="mt-1 break-words text-base font-black text-white">
        {value}
      </p>
    </div>
  );
}

function OrangeMetric({
  label,
  value,
}) {
  return (
    <div className="rounded-xl border-2 border-white/25 bg-white/10 p-3 text-white">
      <p className="text-[8px] font-black uppercase tracking-[0.1em] text-white">
        {label}
      </p>

      <p className="mt-1 text-sm font-black text-white">
        {value}
      </p>
    </div>
  );
}

export default EmailWorkspace;
