import React, { useMemo } from "react";

function safeNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function FunnelBar({ label, count, max, previousCount }) {
  const width = max ? Math.max(4, Math.round((safeNumber(count) / max) * 100)) : 4;
  const conversion = previousCount ? Math.round((safeNumber(count) / previousCount) * 100) : 100;

  const tone =
    conversion >= 75
      ? "border-emerald-400/25 bg-emerald-400/10 text-emerald-100"
      : conversion >= 45
      ? "border-amber-400/25 bg-amber-400/10 text-amber-100"
      : "border-rose-400/25 bg-rose-400/10 text-rose-100";

  return (
    <div className="rounded-3xl border border-white/10 bg-slate-950/50 p-4">
      <div className="mb-2 flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-black text-white">{label}</p>
          <p className="text-xs text-slate-500">{count} records</p>
        </div>
        <span className={`rounded-full border px-3 py-1 text-xs font-black ${tone}`}>{conversion}%</span>
      </div>
      <div className="h-3 overflow-hidden rounded-full bg-white/10">
        <div className="h-full rounded-full bg-white" style={{ width: `${width}%` }} />
      </div>
    </div>
  );
}

function FunnelInsight({ title, detail, tone = "cyan" }) {
  const tones = {
    cyan: "border-cyan-400/20 bg-cyan-500/10",
    amber: "border-amber-400/20 bg-amber-500/10",
    rose: "border-rose-400/20 bg-rose-500/10",
    emerald: "border-emerald-400/20 bg-emerald-500/10",
  };

  return (
    <div className={`rounded-2xl border p-4 ${tones[tone] || tones.cyan}`}>
      <p className="text-sm font-black text-white">{title}</p>
      <p className="mt-2 text-sm leading-6 text-slate-400">{detail}</p>
    </div>
  );
}

export default function GrowthFunnelPanel({ growth = {}, compact = false }) {
  const stages = growth.stages || [];
  const max = Math.max(...stages.map((stage) => safeNumber(stage.count)), 1);

  const weakestStage = useMemo(() => {
    if (stages.length < 2) return null;

    let weakest = null;

    stages.forEach((stage, index) => {
      if (index === 0) return;
      const previous = stages[index - 1];
      const rate = previous.count ? Math.round((stage.count / previous.count) * 100) : 0;

      if (!weakest || rate < weakest.rate) {
        weakest = { stage: stage.label, previous: previous.label, rate };
      }
    });

    return weakest;
  }, [stages]);

  return (
    <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
      <div className="mb-5 flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.25em] text-cyan-300">Growth Funnel</p>
          <h2 className="mt-2 text-2xl font-black text-white">Student Journey Conversion</h2>
          <p className="mt-1 text-sm text-slate-400">
            Founder-level view from inquiry to visa/enrollment with conversion pressure points.
          </p>
        </div>

        <span className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-black text-slate-300">
          {growth.conversionRate || 0}% overall
        </span>
      </div>

      <div className={compact ? "space-y-3" : "grid gap-3 lg:grid-cols-2"}>
        {stages.map((stage, index) => (
          <FunnelBar
            key={stage.key || stage.label}
            label={stage.label}
            count={stage.count}
            max={max}
            previousCount={index === 0 ? stage.count || 1 : stages[index - 1]?.count || 0}
          />
        ))}
      </div>

      {!compact ? (
        <div className="mt-5 grid gap-3 lg:grid-cols-3">
          <FunnelInsight
            title="Application quality"
            detail={`${growth.offerRate || 0}% of applications are converting into offers. Low rates mean weak university matching or document quality issues.`}
            tone={(growth.offerRate || 0) >= 50 ? "emerald" : "amber"}
          />
          <FunnelInsight
            title="CAS readiness"
            detail={`${growth.casRate || 0}% of offers are reaching CAS. This shows deposit, acceptance, and CAS document execution health.`}
            tone={(growth.casRate || 0) >= 50 ? "emerald" : "amber"}
          />
          <FunnelInsight
            title={weakestStage ? `Weakest: ${weakestStage.previous} → ${weakestStage.stage}` : "Waiting for data"}
            detail={weakestStage ? `Current conversion is ${weakestStage.rate}%. This is the first founder review point.` : "Add real records to expose funnel drop-off."}
            tone={weakestStage && weakestStage.rate < 35 ? "rose" : "cyan"}
          />
        </div>
      ) : null}
    </section>
  );
}
