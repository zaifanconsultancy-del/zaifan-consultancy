import React from "react";

function DeviceTypeRow({ item, max }) {
  const width = max ? Math.max(4, Math.round((Number(item.count || 0) / max) * 100)) : 4;

  return (
    <div>
      <div className="mb-1 flex justify-between text-xs">
        <span className="font-bold text-slate-300">{item.name}</span>
        <span className="text-slate-500">{item.count}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-white/10">
        <div className="h-full rounded-full bg-white" style={{ width: `${width}%` }} />
      </div>
    </div>
  );
}

function HealthCard({ label, value, helper, tone = "cyan" }) {
  const tones = {
    cyan: "border-cyan-400/20 bg-cyan-500/10",
    emerald: "border-emerald-400/20 bg-emerald-500/10",
    amber: "border-amber-400/20 bg-amber-500/10",
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

export default function DeviceHealthPanel({ mobile = {}, compact = false }) {
  const totals = mobile.totals || {};
  const types = mobile.deviceTypes || [];
  const max = Math.max(...types.map((item) => Number(item.count || 0)), 1);
  const deviceHealth = mobile.readiness?.devices || 0;

  return (
    <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
      <div className="mb-5">
        <p className="text-xs font-black uppercase tracking-[0.25em] text-amber-300">Device Health</p>
        <h2 className="mt-2 text-2xl font-black text-white">Device & Token Readiness</h2>
        <p className="mt-1 text-sm text-slate-400">Monitor device registrations, active tokens, platform mix, and mobile health readiness.</p>
      </div>

      <div className={compact ? "grid gap-3 md:grid-cols-2" : "grid gap-3 md:grid-cols-3"}>
        <HealthCard label="Registered" value={totals.devices} helper="total devices/tokens" tone="cyan" />
        <HealthCard label="Active" value={totals.activeDevices} helper="recent or active devices" tone="emerald" />
        {!compact ? <HealthCard label="Health" value={`${deviceHealth}%`} helper="activation ratio" tone={deviceHealth >= 80 ? "emerald" : "amber"} /> : null}
      </div>

      {!compact ? (
        <div className="mt-5 rounded-3xl border border-white/10 bg-slate-950/50 p-4">
          <p className="mb-4 text-sm font-black text-white">Platform Mix</p>
          <div className="space-y-4">
            {types.length ? types.map((item) => <DeviceTypeRow key={item.name} item={item} max={max} />) : (
              <p className="text-sm text-slate-500">No device platform data yet.</p>
            )}
          </div>
        </div>
      ) : null}
    </section>
  );
}
