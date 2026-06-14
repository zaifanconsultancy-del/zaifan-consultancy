import React from "react";

function FeatureRow({ label, status, detail }) {
  const ready = status >= 80;
  const watch = status >= 50 && status < 80;
  const tone = ready
    ? "border-emerald-400/25 bg-emerald-400/10 text-emerald-100"
    : watch
    ? "border-amber-400/25 bg-amber-400/10 text-amber-100"
    : "border-rose-400/25 bg-rose-400/10 text-rose-100";

  return (
    <div className="rounded-3xl border border-white/10 bg-slate-950/50 p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="font-black text-white">{label}</p>
          <p className="mt-1 text-sm text-slate-400">{detail}</p>
        </div>
        <span className={`rounded-full border px-3 py-1 text-xs font-black ${tone}`}>{status}%</span>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
        <div className="h-full rounded-full bg-white" style={{ width: `${Math.max(4, status)}%` }} />
      </div>
    </div>
  );
}

export default function StudentAppControlPanel({ mobile = {}, compact = false }) {
  const readiness = mobile.readiness || {};
  const features = [
    ["Login & Session", readiness.studentApp || 70, "Student account login, session restore, and app access."],
    ["Dashboard", 92, "Student journey overview, application stage, timeline, and next actions."],
    ["Support Center", mobile.support?.length ? 90 : 75, "Mobile support tickets, counselor replies, and resolution status."],
    ["Documents", mobile.documents?.length ? 90 : 72, "Document upload, review status, rejection correction, and CAS/visa readiness."],
    ["Payments", 78, "Invoices, receipts, payment status, and upload flow."],
    ["Push Notices", readiness.push || 70, "Support replies, task reminders, document alerts, payment reminders."],
  ];

  return (
    <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
      <div className="mb-5">
        <p className="text-xs font-black uppercase tracking-[0.25em] text-cyan-300">Student App</p>
        <h2 className="mt-2 text-2xl font-black text-white">Student Mobile Readiness</h2>
        <p className="mt-1 text-sm text-slate-400">Control panel for the future student mobile application features and readiness state.</p>
      </div>

      <div className={compact ? "space-y-3" : "grid gap-3 lg:grid-cols-2"}>
        {(compact ? features.slice(0, 4) : features).map(([label, status, detail]) => (
          <FeatureRow key={label} label={label} status={status} detail={detail} />
        ))}
      </div>
    </section>
  );
}
