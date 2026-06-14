import React, { useState } from "react";

const COUNTRIES = ["United Kingdom", "Canada", "Australia", "USA", "Germany", "Ireland", "Other"];

export default function AgentLeadSubmissionForm({ adminProfile }) {
  const [form, setForm] = useState({
    agentName: "",
    agentEmail: "",
    studentName: "",
    studentEmail: "",
    studentPhone: "",
    country: "United Kingdom",
    course: "",
    intake: "",
    notes: "",
  });
  const [status, setStatus] = useState(null);

  function updateField(key, value) {
    setForm((previous) => ({ ...previous, [key]: value }));
  }

  function submitLead(event) {
    event.preventDefault();

    if (!form.agentName.trim() || !form.studentName.trim() || !form.studentPhone.trim()) {
      setStatus({ type: "error", message: "Agent name, student name, and phone are required." });
      return;
    }

    const payload = {
      ...form,
      source: "agent_portal",
      submittedBy: adminProfile?.email || "admin",
      submittedAt: new Date().toISOString(),
    };

    console.info("Agent lead ready for backend insert:", payload);
    setStatus({
      type: "success",
      message: "Agent lead captured in UI. Connect this form to Supabase insert when agent tables are finalized.",
    });

    setForm((previous) => ({
      ...previous,
      studentName: "",
      studentEmail: "",
      studentPhone: "",
      course: "",
      intake: "",
      notes: "",
    }));
  }

  return (
    <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
      <div className="mb-5">
        <p className="text-xs font-black uppercase tracking-[0.25em] text-cyan-300">Agent Lead Submission</p>
        <h2 className="mt-2 text-2xl font-black text-white">Submit Partner Student</h2>
        <p className="mt-1 text-sm text-slate-400">
          Frontend-ready lead capture for agent-submitted students. Backend table wiring can be added after schema finalization.
        </p>
      </div>

      {status ? (
        <div
          className={`mb-4 rounded-2xl border px-4 py-3 text-sm font-bold ${
            status.type === "error"
              ? "border-rose-400/25 bg-rose-500/10 text-rose-100"
              : "border-emerald-400/25 bg-emerald-500/10 text-emerald-100"
          }`}
        >
          {status.message}
        </div>
      ) : null}

      <form onSubmit={submitLead} className="grid gap-4">
        <div className="grid gap-4 lg:grid-cols-2">
          <input value={form.agentName} onChange={(event) => updateField("agentName", event.target.value)} placeholder="Agent / Partner name" className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500" />
          <input value={form.agentEmail} onChange={(event) => updateField("agentEmail", event.target.value)} placeholder="Agent email" className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500" />
          <input value={form.studentName} onChange={(event) => updateField("studentName", event.target.value)} placeholder="Student full name" className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500" />
          <input value={form.studentEmail} onChange={(event) => updateField("studentEmail", event.target.value)} placeholder="Student email" className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500" />
          <input value={form.studentPhone} onChange={(event) => updateField("studentPhone", event.target.value)} placeholder="Student phone / WhatsApp" className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500" />
          <select value={form.country} onChange={(event) => updateField("country", event.target.value)} className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-white outline-none">
            {COUNTRIES.map((country) => <option key={country}>{country}</option>)}
          </select>
          <input value={form.course} onChange={(event) => updateField("course", event.target.value)} placeholder="Preferred course" className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500" />
          <input value={form.intake} onChange={(event) => updateField("intake", event.target.value)} placeholder="Preferred intake" className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500" />
        </div>

        <textarea value={form.notes} onChange={(event) => updateField("notes", event.target.value)} rows={4} placeholder="Agent notes, qualification, budget, documents, urgency..." className="resize-none rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500" />

        <button type="submit" className="rounded-2xl border border-cyan-400/30 bg-cyan-400/10 px-5 py-3 text-sm font-black text-cyan-100 hover:bg-cyan-400/20">
          Capture Agent Lead
        </button>
      </form>
    </section>
  );
}
