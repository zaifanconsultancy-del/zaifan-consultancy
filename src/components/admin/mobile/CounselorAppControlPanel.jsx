import React from "react";

function ModuleCard({ label, value, helper, tone = "cyan" }) {
  const tones = {
    cyan: "border-cyan-400/20 bg-cyan-500/10",
    emerald: "border-emerald-400/20 bg-emerald-500/10",
    amber: "border-amber-400/20 bg-amber-500/10",
    violet: "border-violet-400/20 bg-violet-500/10",
    rose: "border-rose-400/20 bg-rose-500/10",
  };

  return (
    <div className={`rounded-3xl border p-5 ${tones[tone] || tones.cyan}`}>
      <p className="text-xs font-black uppercase tracking-[0.24em] text-slate-400">{label}</p>
      <p className="mt-3 text-3xl font-black text-white">{value}</p>
      <p className="mt-2 text-sm text-slate-400">{helper}</p>
    </div>
  );
}

export default function CounselorAppControlPanel({ mobile = {}, compact = false }) {
  const totals = mobile.totals || {};
  const cards = [
    ["Assigned Students", totals.students, "student portfolio access", "cyan"],
    ["Open Tasks", mobile.tasks?.length || 0, "task queue and status updates", "amber"],
    ["Support Items", mobile.support?.length || 0, "student issues requiring replies", "rose"],
    ["Counselor Sessions", totals.counselorActive, "active counselor mobile sessions", "emerald"],
    ["App Readiness", `${mobile.readiness?.counselorApp || 0}%`, "mobile execution readiness", "violet"],
    ["Push Health", `${mobile.readiness?.push || 0}%`, "notification reliability", "emerald"],
  ];

  return (
    <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
      <div className="mb-5">
        <p className="text-xs font-black uppercase tracking-[0.25em] text-violet-300">Counselor App</p>
        <h2 className="mt-2 text-2xl font-black text-white">Counselor Mobile Execution</h2>
        <p className="mt-1 text-sm text-slate-400">Future counselor app control surface for tasks, support, appointments, students, and mobile execution.</p>
      </div>

      <div className={compact ? "grid gap-3 md:grid-cols-3" : "grid gap-3 md:grid-cols-2 xl:grid-cols-3"}>
        {(compact ? cards.slice(0, 3) : cards).map(([label, value, helper, tone]) => (
          <ModuleCard key={label} label={label} value={value} helper={helper} tone={tone} />
        ))}
      </div>
    </section>
  );
}
