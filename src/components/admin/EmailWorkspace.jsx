import { useMemo, useState } from "react";

function EmailWorkspace({ student = {}, saving = false, onSaveDraft = null }) {
  const fullName = student?.full_name || student?.name || "Student";
  const email = student?.email || "";

  const templates = useMemo(
    () => [
      {
        label: "Welcome Email",
        subject: "Welcome to Zaifan Consultancy",
        body: `Hi ${fullName},

Welcome to Zaifan Consultancy. We are happy to guide you through your study abroad journey.

Our team will help you with country selection, university shortlisting, applications, documents, and visa guidance.

Best regards,
Zaifan Consultancy Team`,
      },
      {
        label: "Application Email",
        subject: "Your University Application Update",
        body: `Hi ${fullName},

We are reviewing your university application process. Please make sure your academic documents, passport, CV, personal statement, and English test documents are ready.

Best regards,
Zaifan Consultancy Team`,
      },
      {
        label: "Visa Guidance Email",
        subject: "Visa Process Guidance",
        body: `Hi ${fullName},

Your visa process requires careful preparation. Please keep your financial documents, academic documents, passport, offer letter, and supporting documents ready for review.

Best regards,
Zaifan Consultancy Team`,
      },
      {
        label: "Document Reminder Email",
        subject: "Pending Documents Reminder",
        body: `Hi ${fullName},

This is a reminder to share your pending documents so we can continue your application process smoothly.

Best regards,
Zaifan Consultancy Team`,
      },
    ],
    [fullName]
  );

  const [subject, setSubject] = useState(templates[0].subject);
  const [body, setBody] = useState(templates[0].body);
  const [activeTemplate, setActiveTemplate] = useState(templates[0].label);
  const [copying, setCopying] = useState(false);

  const applyTemplate = (template) => {
    setActiveTemplate(template.label);
    setSubject(template.subject);
    setBody(template.body);
  };

  const openEmail = () => {
    if (!email) {
      alert("No email found for this student.");
      return;
    }

    window.location.href = `mailto:${email}?subject=${encodeURIComponent(
      subject
    )}&body=${encodeURIComponent(body)}`;
  };

  const copyEmail = async () => {
    try {
      setCopying(true);
      await navigator.clipboard.writeText(`Subject: ${subject}\n\n${body}`);
      alert("Email copied.");
    } catch (error) {
      console.error("Email copy failed:", error);
      alert("Email could not be copied.");
    } finally {
      setCopying(false);
    }
  };

  const saveDraft = async () => {
    if (typeof onSaveDraft !== "function") {
      alert("Save draft is not connected yet.");
      return;
    }

    const saved = await onSaveDraft({ subject, body });

    if (saved) {
      alert("Email draft saved to communication history.");
    }
  };

  const subjectLength = subject.trim().length;
  const bodyLength = body.trim().length;
  const canSend = Boolean(email && subjectLength && bodyLength);

  return (
    <section className="rounded-[1.75rem] border-2 border-[#E9802D]/35 bg-[#FFFDF8] p-5 shadow-[0_18px_45px_rgba(23,36,61,0.07)] sm:p-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.22em] text-[#B84F0E]">
            Student Communication
          </p>
          <h3 className="mt-2 text-xl font-black tracking-[-0.02em] text-[#17243D]">
            Email Workspace
          </h3>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#667085]">
            Prepare reusable student emails, save communication drafts, copy the
            final message, or open it directly in your mail client.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <span className="rounded-full border border-[#243A60]/18 bg-white px-4 py-2 text-xs font-bold text-[#344054]">
            {email || "No email available"}
          </span>
          <span className="rounded-full border border-[#E9802D]/35 bg-[#FFF1E3] px-4 py-2 text-xs font-black text-[#B84F0E]">
            {bodyLength} characters
          </span>
        </div>
      </div>

      <div className="mt-5 rounded-[1.5rem] border border-[#243A60]/18 bg-white p-4 shadow-[0_10px_24px_rgba(23,36,61,0.045)]">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#8992A1]">
              Quick Templates
            </p>
            <p className="mt-1 text-sm font-bold text-[#17243D]">
              Choose a starting point and customize it.
            </p>
          </div>
          <span className="text-xs font-bold text-[#667085]">
            Active: {activeTemplate}
          </span>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {templates.map((template) => {
            const active = activeTemplate === template.label;

            return (
              <button
                key={template.label}
                type="button"
                onClick={() => applyTemplate(template)}
                aria-pressed={active}
                className={`rounded-2xl border p-4 text-left transition ${
                  active
                    ? "border-[#E9802D]/55 bg-[#FFF1E3] text-[#B84F0E] shadow-[0_8px_20px_rgba(233,128,45,0.10)]"
                    : "border-[#243A60]/18 bg-white text-[#344054] hover:-translate-y-0.5 hover:border-[#E9802D]/40 hover:text-[#B84F0E]"
                }`}
              >
                <p className="text-sm font-black">{template.label}</p>
                <p className="mt-2 line-clamp-2 text-xs leading-5 text-[#7A8392]">
                  {template.subject}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-5 grid gap-4">
        <label className="grid gap-2">
          <span className="text-[11px] font-black uppercase tracking-[0.16em] text-[#667085]">
            Subject
          </span>
          <input
            value={subject}
            onChange={(event) => setSubject(event.target.value)}
            placeholder="Email subject"
            className="w-full rounded-2xl border border-[#243A60]/20 bg-white px-4 py-3 text-sm font-semibold text-[#17243D] outline-none placeholder:text-[#A3AAB6] focus:border-[#E9802D] focus:ring-4 focus:ring-[#E9802D]/10"
          />
        </label>

        <label className="grid gap-2">
          <div className="flex items-center justify-between gap-3">
            <span className="text-[11px] font-black uppercase tracking-[0.16em] text-[#667085]">
              Message
            </span>
            <span className="text-xs font-bold text-[#8992A1]">
              {bodyLength} characters
            </span>
          </div>
          <textarea
            value={body}
            onChange={(event) => setBody(event.target.value)}
            placeholder="Email body"
            className="min-h-[220px] w-full resize-y rounded-[1.5rem] border border-[#243A60]/20 bg-white p-4 text-sm leading-7 text-[#17243D] outline-none placeholder:text-[#A3AAB6] focus:border-[#E9802D] focus:ring-4 focus:ring-[#E9802D]/10"
          />
        </label>
      </div>

      <div className="mt-5 flex flex-col gap-3 border-t border-[#243A60]/12 pt-5 sm:flex-row sm:flex-wrap sm:items-center">
        <button
          type="button"
          onClick={openEmail}
          disabled={!canSend}
          className="rounded-full border border-[#E9802D] bg-[#E9802D] px-5 py-2.5 text-sm font-black text-white shadow-[0_10px_22px_rgba(233,128,45,0.18)] transition hover:-translate-y-0.5 hover:bg-[#D96C1F] disabled:cursor-not-allowed disabled:opacity-45"
        >
          Open Email
        </button>

        <button
          type="button"
          onClick={saveDraft}
          disabled={saving || !subjectLength || !bodyLength}
          className="rounded-full border border-[#E9802D]/40 bg-[#FFF1E3] px-5 py-2.5 text-sm font-black text-[#B84F0E] transition hover:-translate-y-0.5 hover:border-[#E9802D]/60 disabled:cursor-not-allowed disabled:opacity-45"
        >
          {saving ? "Saving Draft..." : "Save Draft"}
        </button>

        <button
          type="button"
          onClick={copyEmail}
          disabled={copying || !subjectLength || !bodyLength}
          className="rounded-full border border-[#243A60]/20 bg-white px-5 py-2.5 text-sm font-bold text-[#344054] transition hover:-translate-y-0.5 hover:border-[#E9802D]/40 hover:text-[#B84F0E] disabled:cursor-not-allowed disabled:opacity-45"
        >
          {copying ? "Copying..." : "Copy Email"}
        </button>

        {!email ? (
          <p className="text-xs font-bold text-[#A8342F]">
            Add a student email before opening the mail client.
          </p>
        ) : null}
      </div>
    </section>
  );
}

export default EmailWorkspace;