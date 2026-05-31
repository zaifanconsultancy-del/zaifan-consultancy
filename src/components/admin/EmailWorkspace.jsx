import { useMemo, useState } from "react";

function EmailWorkspace({ student = {} }) {
  const fullName = student?.full_name || student?.name || "Student";
  const email = student?.email || "";

  const templates = useMemo(
    () => [
      {
        label: "Welcome Email",
        subject: "Welcome to Zaifan Consultancy",
        body: `Hi ${fullName},\n\nWelcome to Zaifan Consultancy. We are happy to guide you through your study abroad journey.\n\nOur team will help you with country selection, university shortlisting, applications, documents, and visa guidance.\n\nBest regards,\nZaifan Consultancy Team`,
      },
      {
        label: "Application Email",
        subject: "Your University Application Update",
        body: `Hi ${fullName},\n\nWe are reviewing your university application process. Please make sure your academic documents, passport, CV, personal statement, and English test documents are ready.\n\nBest regards,\nZaifan Consultancy Team`,
      },
      {
        label: "Visa Guidance Email",
        subject: "Visa Process Guidance",
        body: `Hi ${fullName},\n\nYour visa process requires careful preparation. Please keep your financial documents, academic documents, passport, offer letter, and supporting documents ready for review.\n\nBest regards,\nZaifan Consultancy Team`,
      },
      {
        label: "Document Reminder Email",
        subject: "Pending Documents Reminder",
        body: `Hi ${fullName},\n\nThis is a reminder to share your pending documents so we can continue your application process smoothly.\n\nBest regards,\nZaifan Consultancy Team`,
      },
    ],
    [fullName]
  );

  const [subject, setSubject] = useState(templates[0].subject);
  const [body, setBody] = useState(templates[0].body);

  const applyTemplate = (template) => {
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
    await navigator.clipboard.writeText(`Subject: ${subject}\n\n${body}`);
    alert("Email copied.");
  };

  return (
    <div className="rounded-[1.75rem] border border-white/10 bg-white/[0.03] p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="font-bold text-white">Email Workspace</h3>

          <p className="mt-2 text-sm text-white/45">
            Prepare reusable student emails and open your mail client.
          </p>
        </div>

        <span className="rounded-full border border-blue-400/25 bg-blue-500/10 px-4 py-2 text-xs font-bold text-blue-300">
          {email || "No email"}
        </span>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2">
        {templates.map((template) => (
          <button
            key={template.label}
            type="button"
            onClick={() => applyTemplate(template)}
            className="rounded-xl border border-blue-400/25 bg-blue-500/10 p-4 text-left text-blue-300 transition hover:border-blue-400/40"
          >
            {template.label}
          </button>
        ))}
      </div>

      <input
        value={subject}
        onChange={(event) => setSubject(event.target.value)}
        placeholder="Email subject"
        className="mt-5 w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none placeholder:text-white/25 focus:border-blue-400/40"
      />

      <textarea
        value={body}
        onChange={(event) => setBody(event.target.value)}
        placeholder="Email body"
        className="mt-3 min-h-[180px] w-full rounded-2xl border border-white/10 bg-black/30 p-4 text-sm leading-6 text-white outline-none placeholder:text-white/25 focus:border-blue-400/40"
      />

      <div className="mt-4 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={openEmail}
          className="rounded-full bg-blue-400 px-5 py-2 text-sm font-black text-black transition hover:-translate-y-0.5 hover:bg-blue-300"
        >
          Open Email
        </button>

        <button
          type="button"
          onClick={copyEmail}
          className="rounded-full border border-white/10 bg-white/[0.04] px-5 py-2 text-sm font-bold text-white/70 transition hover:border-blue-400/35 hover:text-blue-300"
        >
          Copy Email
        </button>
      </div>
    </div>
  );
}

export default EmailWorkspace;