// WhatsAppWorkspace V2 — Student Communication Workspace
// Preserves template generation, student personalization, WhatsApp deep-link opening,
// clipboard copy and communication-history draft saving.
// Visual layer aligned with the approved Zaifan Admin OS.

import { useMemo, useState } from "react";

function WhatsAppWorkspace({ student = {}, saving = false, onSaveDraft = null }) {
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

  const getMessage = () =>
    selectedMessage ||
    `Hi ${fullName}, this is Zaifan Consultancy. I wanted to follow up with you.`;

  const openWhatsApp = () => {
    const cleanPhone = String(phone || "").replace(/[^\d]/g, "");

    if (!cleanPhone) {
      alert("No phone number found for this student.");
      return;
    }

    window.open(
      `https://wa.me/${cleanPhone}?text=${encodeURIComponent(getMessage())}`,
      "_blank",
      "noopener,noreferrer"
    );
  };

  const copyMessage = async () => {
    await navigator.clipboard.writeText(getMessage());
    alert("WhatsApp message copied.");
  };

  const saveDraft = async () => {
    if (typeof onSaveDraft !== "function") {
      alert("Save draft is not connected yet.");
      return;
    }

    const saved = await onSaveDraft(getMessage());

    if (saved) {
      alert("WhatsApp draft saved to communication history.");
    }
  };

  return (
    <div className="rounded-[1.75rem] border border-slate-300 bg-white p-6 shadow-[0_8px_24px_rgba(15,35,63,0.05)]">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-700">
            Student Communication
          </p>

          <h3 className="mt-1 font-black text-[#10233f]">WhatsApp Workspace</h3>

          <p className="mt-2 text-sm text-slate-600">
            Create quick counselor messages, save drafts, and open WhatsApp directly.
          </p>
        </div>

        <span className="rounded-full border border-emerald-300 bg-emerald-50 px-4 py-2 text-xs font-black text-emerald-700">
          {phone || "No phone"}
        </span>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {templates.map((template) => (
          <button
            key={template.label}
            type="button"
            onClick={() => setSelectedMessage(template.message)}
            className={`w-full rounded-xl border p-4 text-left font-black transition ${
              selectedMessage === template.message
                ? "border-orange-500 bg-orange-500 text-white shadow-[0_8px_18px_rgba(249,115,22,0.16)]"
                : "border-slate-300 bg-[#fffaf2] text-[#10233f] hover:border-orange-300 hover:bg-orange-50 hover:text-orange-700"
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
        className="mt-5 min-h-[140px] w-full rounded-2xl border border-slate-300 bg-white p-4 text-sm leading-6 text-[#10233f] outline-none placeholder:text-slate-400 focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
      />

      <div className="mt-4 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={openWhatsApp}
          className="rounded-full bg-[#102f5c] px-5 py-2 text-sm font-black text-white shadow-[0_8px_18px_rgba(15,35,63,0.16)] transition hover:-translate-y-0.5 hover:bg-[#183f72]"
        >
          Open WhatsApp
        </button>

        <button
          type="button"
          onClick={saveDraft}
          disabled={saving}
          className="rounded-full border border-orange-300 bg-orange-50 px-5 py-2 text-sm font-black text-orange-700 transition hover:border-orange-400 hover:bg-orange-100 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving ? "Saving Draft..." : "Save Draft"}
        </button>

        <button
          type="button"
          onClick={copyMessage}
          className="rounded-full border border-slate-300 bg-white px-5 py-2 text-sm font-black text-[#10233f] transition hover:border-orange-300 hover:bg-[#fffaf2] hover:text-orange-700"
        >
          Copy Message
        </button>
      </div>
    </div>
  );
}

export default WhatsAppWorkspace;