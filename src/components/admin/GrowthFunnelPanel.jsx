import React, { useMemo } from "react";

function safeNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function FunnelBar({ label, count, max, previousCount }) {
  const width = max
    ? Math.max(4, Math.round((safeNumber(count) / max) * 100))
    : 4;

  const conversion = previousCount
    ? Math.round((safeNumber(count) / previousCount) * 100)
    : 100;

  const tone =
    conversion >= 75
      ? "border-emerald-300 bg-emerald-50 text-emerald-700"
      : conversion >= 45
      ? "border-amber-300 bg-amber-50 text-amber-800"
      : "border-rose-300 bg-rose-50 text-rose-700";

  return (
    <div className="rounded-3xl border-2 border-slate-300 bg-white p-4 shadow-[0_5px_16px_rgba(15,35,63,0.035)]">
      <div className="mb-2 flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-black text-[#10233f]">{label}</p>
          <p className="text-xs text-slate-500">{count} records</p>
        </div>

        <span
          className={`rounded-full border px-3 py-1 text-xs font-black ${tone}`}
        >
          {conversion}%
        </span>
      </div>

      <div className="h-3 overflow-hidden rounded-full border border-slate-300 bg-[#fffaf2]">
        <div
          className="h-full rounded-full bg-orange-500 transition-all duration-500"
          style={{ width: `${width}%` }}
        />
      </div>
    </div>
  );
}

function FunnelInsight({ title, detail, tone = "orange" }) {
  const tones = {
    orange: "border-orange-300 bg-orange-50",
    amber: "border-amber-300 bg-amber-50",
    rose: "border-rose-300 bg-rose-50",
    emerald: "border-emerald-300 bg-emerald-50",
  };

  return (
    <div
      className={`rounded-2xl border-2 p-4 shadow-[0_5px_16px_rgba(15,35,63,0.03)] ${
        tones[tone] || tones.orange
      }`}
    >
      <p className="text-sm font-black text-[#10233f]">{title}</p>
      <p className="mt-2 text-sm leading-6 text-slate-600">{detail}</p>
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

      const rate = previous.count
        ? Math.round((stage.count / previous.count) * 100)
        : 0;

      if (!weakest || rate < weakest.rate) {
        weakest = {
          stage: stage.label,
          previous: previous.label,
          rate,
        };
      }
    });

    return weakest;
  }, [stages]);

  return (
    <section className="overflow-hidden rounded-3xl border-2 border-orange-300 bg-white shadow-[0_14px_36px_rgba(15,35,63,0.06)]">
      <div className="flex flex-col gap-2 border-b border-orange-200 bg-[#102f5c] p-5 text-white lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.25em] text-orange-300">
            Growth Funnel
          </p>

          <h2 className="mt-2 text-2xl font-black text-white">
            Student Journey Conversion
          </h2>

          <p className="mt-1 text-sm text-slate-200">
            Founder-level view from inquiry to visa/enrollment with conversion
            pressure points.
          </p>
        </div>

        <span className="rounded-2xl border-2 border-orange-300 bg-orange-500 px-4 py-2 text-xs font-black text-white">
          {growth.conversionRate || 0}% overall
        </span>
      </div>

      <div className="bg-[#fff8ee] p-5">
        <div className={compact ? "space-y-3" : "grid gap-3 lg:grid-cols-2"}>
          {stages.map((stage, index) => (
            <FunnelBar
              key={stage.key || stage.label}
              label={stage.label}
              count={stage.count}
              max={max}
              previousCount={
                index === 0
                  ? stage.count || 1
                  : stages[index - 1]?.count || 0
              }
            />
          ))}
        </div>

        {!compact ? (
          <div className="mt-5 grid gap-3 lg:grid-cols-3">
            <FunnelInsight
              title="Application quality"
              detail={`${
                growth.offerRate || 0
              }% of applications are converting into offers. Low rates mean weak university matching or document quality issues.`}
              tone={(growth.offerRate || 0) >= 50 ? "emerald" : "amber"}
            />

            <FunnelInsight
              title="CAS readiness"
              detail={`${
                growth.casRate || 0
              }% of offers are reaching CAS. This shows deposit, acceptance, and CAS document execution health.`}
              tone={(growth.casRate || 0) >= 50 ? "emerald" : "amber"}
            />

            <FunnelInsight
              title={
                weakestStage
                  ? `Weakest: ${weakestStage.previous} → ${weakestStage.stage}`
                  : "Waiting for data"
              }
              detail={
                weakestStage
                  ? `Current conversion is ${weakestStage.rate}%. This is the first founder review point.`
                  : "Add real records to expose funnel drop-off."
              }
              tone={
                weakestStage && weakestStage.rate < 35 ? "rose" : "orange"
              }
            />
          </div>
        ) : null}
      </div>
    </section>
  );
}