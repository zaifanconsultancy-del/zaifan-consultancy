import { useMemo, useState } from "react";

function WhatsAppWorkspace({ student = {} }) {
  const [selectedMessage, setSelectedMessage] = useState("");

  const fullName = student?.full_name || student?.name || "Student";
  const phone = student?.phone || student?.phone_number || "";

  const templates = useMemo(
    () => [
      {
        label: "Follow-up Message",
        message: `Hi ${fullName}, this is Zaifan Consultancy. I wanted to follow up regarding your study abroad process. Please let us know when you are available.`,
      },
      {
        label: "Reminder Message",
        message: `Hi ${fullName}, gentle reminder from Zaifan Consultancy. Please share the pending information so we can continue your process.`,
      },
      {
        label: "Document Request",
        message: `Hi ${fullName}, please send your pending documents: Passport, Transcript, Degree, IELTS/PTE, CV, Personal Statement, and Financial Documents if available.`,
      },
      {
        label: "Consultation Invite",
        message: `Hi ${fullName}, we would like to schedule a consultation to discuss your country, university, program, and visa options.`,
      },
    ],
    [fullName]
  );

  const openWhatsApp = () => {
    const cleanPhone = phone.replace(/[^\d]/g, "");

    if (!cleanPhone) {
      alert("No phone number found for this student.");
      return;
    }

    const message =
      selectedMessage ||
      `Hi ${fullName}, this is Zaifan Consultancy. I wanted to follow up with you.`;

    window.open(
      `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`,
      "_blank"
    );
  };

  const copyMessage = async () => {
    const message =
      selectedMessage ||
      `Hi ${fullName}, this is Zaifan Consultancy. I wanted to follow up with you.`;

    await navigator.clipboard.writeText(message);
    alert("WhatsApp message copied.");
  };

  return (
    <div className="rounded-[1.75rem] border border-white/10 bg-white/[0.03] p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="font-bold text-white">WhatsApp Workspace</h3>

          <p className="mt-2 text-sm text-white/45">
            Create quick counselor messages and open WhatsApp directly.
          </p>
        </div>

        <span className="rounded-full border border-emerald-400/25 bg-emerald-500/10 px-4 py-2 text-xs font-bold text-emerald-300">
          {phone || "No phone"}
        </span>
      </div>

      <div className="mt-5 space-y-3">
        {templates.map((template) => (
          <button
            key={template.label}
            type="button"
            onClick={() => setSelectedMessage(template.message)}
            className={`w-full rounded-xl border p-4 text-left transition ${
              selectedMessage === template.message
                ? "border-emerald-400/40 bg-emerald-500/15 text-emerald-300"
                : "border-emerald-400/25 bg-emerald-500/10 text-emerald-300 hover:border-emerald-400/40"
            }`}
          >
            {template.label}
          </button>
        ))}
      </div>

      <textarea
        value={selectedMessage}
        onChange={(event) => setSelectedMessage(event.target.value)}
        placeholder="Choose a template or write custom WhatsApp message..."
        className="mt-5 min-h-[140px] w-full rounded-2xl border border-white/10 bg-black/30 p-4 text-sm leading-6 text-white outline-none placeholder:text-white/25 focus:border-emerald-400/40"
      />

      <div className="mt-4 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={openWhatsApp}
          className="rounded-full bg-emerald-400 px-5 py-2 text-sm font-black text-black transition hover:-translate-y-0.5 hover:bg-emerald-300"
        >
          Open WhatsApp
        </button>

        <button
          type="button"
          onClick={copyMessage}
          className="rounded-full border border-white/10 bg-white/[0.04] px-5 py-2 text-sm font-bold text-white/70 transition hover:border-emerald-400/35 hover:text-emerald-300"
        >
          Copy Message
        </button>
      </div>
    </div>
  );
}

export default WhatsAppWorkspace;