import React from "react";

function AnalyticsCard({ label, value, helper, tone = "cyan" }) {
  const tones = {
    cyan: "border-cyan-400/20 bg-cyan-500/10",
    emerald: "border-emerald-400/20 bg-emerald-500/10",
    amber: "border-amber-400/20 bg-amber-500/10",
    rose: "border-rose-400/20 bg-rose-500/10",
    violet: "border-violet-400/20 bg-violet-500/10",
  };

  return (
    <div className={`rounded-3xl border p-5 ${tones[tone] || tones.cyan}`}>
      <p className="text-xs font-black uppercase tracking-[0.24em] text-slate-400">{label}</p>
      <p className="mt-3 text-3xl font-black text-white">{value}</p>
      <p className="mt-2 text-sm text-slate-400">{helper}</p>
    </div>
  );
}

export default function MobileAnalyticsPanel({ mobile = {} }) {
  const totals = mobile.totals || {};

  const adoptionRate = totals.students ? Math.round((totals.studentActive / totals.students) * 100) : 0;
  const counselorAdoption = totals.counselors ? Math.round((totals.counselorActive / totals.counselors) * 100) : 0;
  const deviceActivation = totals.devices ? Math.round((totals.activeDevices / totals.devices) * 100) : 0;
  const notificationSuccess = totals.notifications ? Math.round((totals.sentNotifications / totals.notifications) * 100) : mobile.readiness?.push || 0;

  return (
    <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
      <div className="mb-5">
        <p className="text-xs font-black uppercase tracking-[0.25em] text-cyan-300">Mobile Analytics</p>
        <h2 className="mt-2 text-2xl font-black text-white">Adoption & Engagement</h2>
        <p className="mt-1 text-sm text-slate-400">Mobile app usage, sessions, adoption, device activation, and notification performance.</p>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <AnalyticsCard label="Student Adoption" value={`${adoptionRate}%`} helper={`${totals.studentActive} active student sessions`} tone="cyan" />
        <AnalyticsCard label="Counselor Adoption" value={`${counselorAdoption}%`} helper={`${totals.counselorActive} active counselor sessions`} tone="violet" />
        <AnalyticsCard label="Device Activation" value={`${deviceActivation}%`} helper={`${totals.activeDevices}/${totals.devices} active devices`} tone="amber" />
        <AnalyticsCard label="Push Success" value={`${notificationSuccess}%`} helper={`${totals.sentNotifications}/${totals.notifications} sent`} tone="emerald" />
      </div>

      <div className="mt-5 rounded-3xl border border-white/10 bg-slate-950/50 p-4">
        <p className="text-sm font-black text-white">Mobile interpretation</p>
        <p className="mt-2 text-sm leading-6 text-slate-400">
          This panel is mobile-backend ready. Once app sessions, push tokens, and notification logs exist, it becomes the live usage dashboard for Zaifan mobile apps.
        </p>
      </div>
    </section>
  );
}
