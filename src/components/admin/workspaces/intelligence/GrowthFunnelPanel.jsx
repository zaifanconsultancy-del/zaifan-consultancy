// GrowthFunnelPanel V4 MAXIMUM — Founder Conversion Funnel Intelligence
// src/components/admin/GrowthFunnelPanel.jsx
//
// Maximum pass:
// - preserves growth.stages / conversionRate / offerRate / casRate API
// - safer array/number handling
// - clamps impossible conversion rates to 0–100
// - detects weakest and strongest stage transitions
// - detects zero-volume / stalled stages
// - adds leakage counts between stages
// - adds founder pressure classification
// - supports compact and full modes
// - explicit navy/orange contrast to survive Admin OS global styling
// - stronger responsive structure and useful founder insights
// - no backend mutations or fake AI claims

import React, { useMemo } from "react";
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowRight,
  CheckCircle2,
  CircleGauge,
  Funnel,
  Target,
  TrendingDown,
  TrendingUp,
} from "lucide-react";

function safeArray(value) {
  return Array.isArray(value) ? value.filter(Boolean) : [];
}

function safeNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function clamp(value, min = 0, max = 100) {
  return Math.max(min, Math.min(max, safeNumber(value)));
}

function percent(current, previous) {
  const currentValue = safeNumber(current);
  const previousValue = safeNumber(previous);

  if (previousValue <= 0) return currentValue > 0 ? 100 : 0;

  return clamp(Math.round((currentValue / previousValue) * 100));
}

function getConversionTone(rate) {
  if (rate >= 75) {
    return {
      badge: "border-emerald-300 bg-emerald-50 text-emerald-700",
      bar: "bg-emerald-500",
      label: "Strong",
    };
  }

  if (rate >= 45) {
    return {
      badge: "border-amber-300 bg-amber-50 text-amber-800",
      bar: "bg-orange-500",
      label: "Watch",
    };
  }

  return {
    badge: "border-rose-300 bg-rose-50 text-rose-700",
    bar: "bg-rose-500",
    label: "Pressure",
  };
}

function FunnelBar({
  label,
  count,
  max,
  previousCount,
  previousLabel,
  isFirst = false,
}) {
  const safeCount = safeNumber(count);
  const safeMax = Math.max(safeNumber(max), 1);

  const width = Math.max(
    safeCount > 0 ? 6 : 0,
    Math.round((safeCount / safeMax) * 100)
  );

  const conversion = isFirst
    ? 100
    : percent(safeCount, previousCount);

  const leakage = isFirst
    ? 0
    : Math.max(0, safeNumber(previousCount) - safeCount);

  const tone = getConversionTone(conversion);

  return (
    <article className="min-w-0 overflow-hidden rounded-[1.45rem] border-[3px] border-slate-300 bg-white p-4 shadow-[0_7px_20px_rgba(15,35,63,0.04)] transition hover:-translate-y-0.5 hover:border-orange-300">
      <div className="flex min-w-0 flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0 flex-1">
          <p className="break-words text-sm font-black text-[#10233f]">{label}</p>

          <div className="mt-1 flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 break-words text-xs font-semibold text-slate-500">
            <span>{safeCount} records</span>

            {!isFirst ? (
              <>
                <span>•</span>
                <span>
                  {leakage} lost from {previousLabel || "previous stage"}
                </span>
              </>
            ) : null}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`rounded-full border px-3 py-1 text-xs font-black ${tone.badge}`}
          >
            {conversion}%
          </span>

          <span className="rounded-full border border-slate-300 bg-[#fffaf2] px-3 py-1 text-[10px] font-black uppercase tracking-[0.08em] text-slate-600">
            {tone.label}
          </span>
        </div>
      </div>

      <div className="mt-4">
        <div className="mb-2 flex items-center justify-between gap-3 text-[10px] font-black uppercase tracking-[0.08em] text-slate-500">
          <span>Stage volume</span>
          <span>{width}% of max</span>
        </div>

        <div className="h-3 overflow-hidden rounded-full border border-slate-300 bg-[#fffaf2]">
          <div
            className={`h-full rounded-full transition-all duration-500 ${tone.bar}`}
            style={{ width: `${width}%` }}
          />
        </div>
      </div>
    </article>
  );
}

function FunnelInsight({
  title,
  detail,
  tone = "orange",
  icon: Icon = Target,
}) {
  const tones = {
    orange: "border-orange-300 bg-orange-50 text-orange-700",
    amber: "border-amber-300 bg-amber-50 text-amber-800",
    rose: "border-rose-300 bg-rose-50 text-rose-700",
    emerald: "border-emerald-300 bg-emerald-50 text-emerald-700",
    navy: "border-slate-300 bg-slate-100 text-[#123865]",
  };

  const style = tones[tone] || tones.orange;

  return (
    <div className={`min-w-0 rounded-[1.35rem] border-[3px] p-4 shadow-[0_5px_16px_rgba(15,35,63,0.03)] ${style}`}>
      <div className="flex min-w-0 items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border-2 border-current bg-white/70">
          <Icon size={17} />
        </div>

        <div className="min-w-0 flex-1">
          <p className="break-words font-black text-[#10233f]">{title}</p>
          <p className="mt-1 break-words text-sm font-semibold leading-6 text-slate-600">
            {detail}
          </p>
        </div>
      </div>
    </div>
  );
}

function SummaryMetric({
  label,
  value,
  helper,
  icon: Icon,
  tone = "orange",
}) {
  const isNavy = tone === "navy";

  const surface =
    tone === "orange"
      ? "border-orange-300 bg-orange-50"
      : tone === "rose"
      ? "border-rose-300 bg-rose-50"
      : tone === "emerald"
      ? "border-emerald-300 bg-emerald-50"
      : "border-[#123865] bg-[#123865]";

  return (
    <div
      className={`min-w-0 rounded-[1.3rem] border-[3px] p-4 ${surface}`}
      style={{ color: isNavy ? "#FFFFFF" : "#10233F" }}
    >
      <div className="flex min-w-0 items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p
            className="break-words text-[9px] font-black uppercase leading-4 tracking-[0.08em]"
            style={{ color: isNavy ? "#F8FAFC" : "#64748B" }}
          >
            {label}
          </p>

          <p
            className="mt-2 break-words text-2xl font-black leading-none"
            style={{ color: isNavy ? "#FFFFFF" : "#10233F" }}
          >
            {value}
          </p>
        </div>

        <div
          className={`flex h-10 w-10 items-center justify-center rounded-xl border-2 ${
            isNavy
              ? "border-white/30 bg-white/10"
              : "border-orange-300 bg-white"
          }`}
        >
          <Icon
            size={17}
            style={{ color: isNavy ? "#FDBA74" : "#C2410C" }}
          />
        </div>
      </div>

      <p
        className="mt-2 break-words text-xs font-semibold leading-5"
        style={{ color: isNavy ? "#F8FAFC" : "#64748B" }}
      >
        {helper}
      </p>
    </div>
  );
}

export default function GrowthFunnelPanel({
  growth = {},
  compact = false,
}) {
  const stages = useMemo(
    () =>
      safeArray(growth.stages).map((stage, index) => ({
        key: stage?.key || `stage-${index}`,
        label: stage?.label || `Stage ${index + 1}`,
        count: safeNumber(stage?.count),
      })),
    [growth.stages]
  );

  const max = Math.max(
    ...stages.map((stage) => safeNumber(stage.count)),
    1
  );

  const transitions = useMemo(() => {
    return stages.slice(1).map((stage, index) => {
      const previous = stages[index];
      const rate = percent(stage.count, previous?.count);
      const leakage = Math.max(
        0,
        safeNumber(previous?.count) - safeNumber(stage.count)
      );

      return {
        key: `${previous?.key || index}-${stage.key}`,
        from: previous?.label || "Previous",
        to: stage.label,
        previousCount: safeNumber(previous?.count),
        count: safeNumber(stage.count),
        rate,
        leakage,
      };
    });
  }, [stages]);

  const weakestStage = useMemo(() => {
    if (!transitions.length) return null;
    return [...transitions].sort((a, b) => a.rate - b.rate)[0];
  }, [transitions]);

  const strongestStage = useMemo(() => {
    if (!transitions.length) return null;
    return [...transitions].sort((a, b) => b.rate - a.rate)[0];
  }, [transitions]);

  const largestLeak = useMemo(() => {
    if (!transitions.length) return null;
    return [...transitions].sort((a, b) => b.leakage - a.leakage)[0];
  }, [transitions]);

  const stalledStages = useMemo(
    () =>
      stages.filter(
        (stage, index) =>
          index > 0 &&
          safeNumber(stages[index - 1]?.count) > 0 &&
          safeNumber(stage.count) === 0
      ),
    [stages]
  );

  const totalRecords = safeNumber(stages[0]?.count);
  const finalRecords = safeNumber(stages[stages.length - 1]?.count);

  const overallConversion =
    growth.conversionRate !== null &&
    growth.conversionRate !== undefined
      ? clamp(growth.conversionRate)
      : percent(finalRecords, totalRecords);

  const totalLeakage = Math.max(0, totalRecords - finalRecords);

  const pressureLevel =
    overallConversion >= 50
      ? "Healthy"
      : overallConversion >= 25
      ? "Watch"
      : "High Pressure";

  const pressureTone =
    overallConversion >= 50
      ? "emerald"
      : overallConversion >= 25
      ? "orange"
      : "rose";

  return (
    <section className="min-w-0 overflow-hidden rounded-[1.8rem] border-[3px] border-orange-300 bg-white shadow-[0_14px_36px_rgba(15,35,63,0.06)]">
      <div
        className="border-b-[3px] border-orange-300 bg-[#123865] p-5 sm:p-6"
        style={{ color: "#FFFFFF" }}
      >
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-start">
          <div className="min-w-0">
            <div className="inline-flex max-w-full items-center gap-2 rounded-full border-2 border-white/25 bg-white/10 px-3 py-1.5">
              <Funnel size={13} style={{ color: "#FDBA74" }} />

              <p
                className="text-[9px] font-black uppercase tracking-[0.1em]"
                style={{ color: "#FFFFFF" }}
              >
                Growth Funnel
              </p>
            </div>

            <h2
              className="mt-3 break-words text-2xl font-black leading-tight sm:text-3xl"
              style={{ color: "#FFFFFF" }}
            >
              Student Journey Conversion
            </h2>

            <p
              className="mt-2 max-w-3xl break-words text-sm font-semibold leading-6"
              style={{ color: "#F8FAFC" }}
            >
              Founder-level view from inquiry to visa/enrollment with conversion,
              leakage, stalled-stage, and bottleneck intelligence.
            </p>
          </div>

          <div className="flex min-w-0 flex-wrap gap-2 xl:max-w-[15rem] xl:justify-end">
            <span
              className="rounded-xl border-2 border-white/30 bg-white/10 px-4 py-2 text-xs font-black"
              style={{ color: "#FFFFFF" }}
            >
              {overallConversion}% overall
            </span>

            <span
              className="rounded-xl border-2 border-orange-300 bg-orange-500 px-4 py-2 text-xs font-black"
              style={{ color: "#FFFFFF" }}
            >
              {pressureLevel}
            </span>
          </div>
        </div>
      </div>

      <div className="bg-[#fff8ee] p-5 sm:p-6">
        <div className="mb-5 grid grid-cols-[repeat(auto-fit,minmax(min(100%,12rem),1fr))] gap-3">
          <SummaryMetric
            label="Entry Volume"
            value={totalRecords}
            helper={stages[0]?.label || "First funnel stage"}
            icon={Target}
            tone="navy"
          />

          <SummaryMetric
            label="Final Volume"
            value={finalRecords}
            helper={stages[stages.length - 1]?.label || "Final funnel stage"}
            icon={CheckCircle2}
            tone="emerald"
          />

          <SummaryMetric
            label="Total Leakage"
            value={totalLeakage}
            helper="Records lost between first and final stage"
            icon={TrendingDown}
            tone={totalLeakage > 0 ? "rose" : "emerald"}
          />

          <SummaryMetric
            label="Conversion Health"
            value={`${overallConversion}%`}
            helper={pressureLevel}
            icon={CircleGauge}
            tone={pressureTone}
          />
        </div>

        {stages.length ? (
          <div
            className={
              compact
                ? "space-y-3"
                : "grid grid-cols-[repeat(auto-fit,minmax(min(100%,20rem),1fr))] gap-3"
            }
          >
            {stages.map((stage, index) => (
              <FunnelBar
                key={stage.key}
                label={stage.label}
                count={stage.count}
                max={max}
                isFirst={index === 0}
                previousCount={
                  index === 0
                    ? stage.count || 1
                    : stages[index - 1]?.count || 0
                }
                previousLabel={stages[index - 1]?.label}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-[1.4rem] border-[3px] border-dashed border-slate-300 bg-white p-8 text-center">
            <Funnel className="mx-auto h-10 w-10 text-orange-600" />

            <h3 className="mt-3 font-black text-[#10233f]">
              No funnel data yet
            </h3>

            <p className="mx-auto mt-2 max-w-xl text-sm font-semibold leading-6 text-slate-500">
              Add real student journey records to expose stage conversion,
              leakage, and founder bottlenecks.
            </p>
          </div>
        )}

        {!compact ? (
          <>
            <div className="mt-5 grid grid-cols-[repeat(auto-fit,minmax(min(100%,18rem),1fr))] gap-3">
              <FunnelInsight
                title="Application quality"
                detail={`${clamp(
                  growth.offerRate
                )}% of applications are converting into offers. Low rates usually indicate university-fit, document-quality, or application-execution pressure.`}
                tone={clamp(growth.offerRate) >= 50 ? "emerald" : "amber"}
                icon={TrendingUp}
              />

              <FunnelInsight
                title="CAS readiness"
                detail={`${clamp(
                  growth.casRate
                )}% of offers are reaching CAS. This reflects acceptance, deposit, and CAS-document execution health.`}
                tone={clamp(growth.casRate) >= 50 ? "emerald" : "amber"}
                icon={Target}
              />

              <FunnelInsight
                title={
                  weakestStage
                    ? `Weakest: ${weakestStage.from} → ${weakestStage.to}`
                    : "Waiting for transition data"
                }
                detail={
                  weakestStage
                    ? `${weakestStage.rate}% conversion with ${weakestStage.leakage} record(s) lost at this transition.`
                    : "More than one populated stage is needed to identify funnel pressure."
                }
                tone={
                  weakestStage && weakestStage.rate < 35
                    ? "rose"
                    : "orange"
                }
                icon={AlertTriangle}
              />
            </div>

            <div className="mt-3 grid grid-cols-[repeat(auto-fit,minmax(min(100%,18rem),1fr))] gap-3">
              <FunnelInsight
                title={
                  strongestStage
                    ? `Strongest: ${strongestStage.from} → ${strongestStage.to}`
                    : "No strong transition yet"
                }
                detail={
                  strongestStage
                    ? `${strongestStage.rate}% conversion. Preserve the process used at this transition.`
                    : "More real stage movement is required."
                }
                tone="emerald"
                icon={CheckCircle2}
              />

              <FunnelInsight
                title={
                  largestLeak
                    ? `Largest leakage: ${largestLeak.from} → ${largestLeak.to}`
                    : "No leakage detected"
                }
                detail={
                  largestLeak
                    ? `${largestLeak.leakage} record(s) are being lost between these two stages.`
                    : "Current stage counts do not expose a meaningful leakage point."
                }
                tone={largestLeak?.leakage ? "rose" : "emerald"}
                icon={ArrowDownRight}
              />

              <FunnelInsight
                title={
                  stalledStages.length
                    ? `${stalledStages.length} stalled stage${
                        stalledStages.length === 1 ? "" : "s"
                      }`
                    : "No completely stalled stage"
                }
                detail={
                  stalledStages.length
                    ? `${stalledStages
                        .map((stage) => stage.label)
                        .join(", ")} currently have zero records despite upstream volume.`
                    : "Every downstream stage with upstream volume currently has at least one record."
                }
                tone={stalledStages.length ? "rose" : "navy"}
                icon={stalledStages.length ? AlertTriangle : ArrowRight}
              />
            </div>
          </>
        ) : null}
      </div>
    </section>
  );
}
