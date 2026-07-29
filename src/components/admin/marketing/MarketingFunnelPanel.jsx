import React, { useMemo } from "react";
import {
  AlertTriangle,
  BadgeCheck,
  CircleGauge,
  Funnel,
  Route,
  ShieldCheck,
  Target,
  TrendingDown,
  TrendingUp,
} from "lucide-react";

function safeArray(value) {
  return Array.isArray(value) ? value.filter(Boolean) : [];
}

function safeNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function percent(value) {
  return `${Math.round(safeNumber(value))}%`;
}

function conversion(current, previous) {
  const currentCount = safeNumber(current);
  const previousCount = safeNumber(previous);

  if (previousCount <= 0) return null;
  return Math.max(0, Math.round((currentCount / previousCount) * 100));
}

function dropoff(current, previous) {
  const rate = conversion(current, previous);
  if (rate === null) return null;
  return Math.max(0, 100 - rate);
}

function stageTone(rate) {
  if (rate === null) {
    return "border-[#60A5FA] bg-[#F2F7FF] text-blue-700";
  }

  if (rate >= 60) {
    return "border-[#34D399] bg-[#F0FFF8] text-emerald-700";
  }

  if (rate >= 30) {
    return "border-[#F59E0B] bg-[#FFF8E8] text-amber-800";
  }

  return "border-[#FB7185] bg-[#FFF4F4] text-red-700";
}

function StageRow({
  stage,
  previous,
  max,
  index,
  compact = false,
}) {
  const count = safeNumber(stage.count);
  const previousCount = safeNumber(previous);
  const rate = index === 0 ? null : conversion(count, previousCount);
  const loss = index === 0 ? null : dropoff(count, previousCount);

  const barWidth =
    max > 0 ? Math.max(count > 0 ? 4 : 0, Math.round((count / max) * 100)) : 0;

  const hasBaseline = index > 0 && previousCount > 0;

  return (
    <article className="rounded-[1.3rem] border-2 border-[#C9D7E6] bg-white p-4 shadow-[0_6px_18px_rgba(15,35,63,0.04)] transition hover:border-[#F97316]">
      <div
        className={
          compact
            ? "grid min-w-0 gap-3 md:grid-cols-[minmax(12rem,1.3fr)_8rem_9rem] md:items-center"
            : "grid min-w-0 gap-4 lg:grid-cols-[minmax(16rem,1.35fr)_10rem_10rem] lg:items-center"
        }
      >
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border-2 border-[#F97316] bg-[#FFF4E8] text-sm font-black text-orange-700">
              {index + 1}
            </div>

            <div className="min-w-0">
              <p className="font-black text-[#10233F]">
                {stage.label || stage.key || "Unnamed stage"}
              </p>
              <p className="mt-1 text-xs font-semibold text-slate-500">
                {count} recorded record{count === 1 ? "" : "s"}
              </p>
            </div>
          </div>

          {!compact ? (
            <div className="mt-3">
              <div className="h-2.5 overflow-hidden rounded-full bg-[#DDE7F0]">
                {barWidth > 0 ? (
                  <div
                    className="h-full rounded-full bg-[#123865] transition-[width] duration-500"
                    style={{ width: `${barWidth}%` }}
                  />
                ) : null}
              </div>
              <p className="mt-1.5 text-[10px] font-semibold text-slate-500">
                Relative funnel volume · largest stage = 100%
              </p>
            </div>
          ) : null}
        </div>

        <div className="rounded-xl border border-[#E1E8F0] bg-[#FFF8EF] px-3 py-2.5">
          <p className="text-[7px] font-black uppercase tracking-[0.09em] text-slate-500">
            Conversion
          </p>
          <p className="mt-1 text-sm font-black text-[#10233F]">
            {index === 0
              ? "Entry"
              : hasBaseline
                ? percent(rate)
                : "Not measured"}
          </p>
        </div>

        <div>
          <p className="text-[7px] font-black uppercase tracking-[0.09em] text-slate-500">
            Stage State
          </p>
          <span
            className={`mt-1 inline-flex rounded-full border-2 px-2.5 py-1 text-[8px] font-black uppercase tracking-[0.07em] ${stageTone(
              rate
            )}`}
          >
            {index === 0
              ? "Baseline"
              : !hasBaseline
                ? "No baseline"
                : rate >= 60
                  ? "Strong retention"
                  : rate >= 30
                    ? "Watch drop-off"
                    : "High drop-off"}
          </span>

          {!compact && loss !== null ? (
            <p className="mt-1.5 text-[10px] font-semibold text-slate-500">
              {loss}% drop-off from previous stage
            </p>
          ) : null}
        </div>
      </div>
    </article>
  );
}

function MetricCard({
  label,
  value,
  helper,
  tone = "blue",
  icon: Icon,
}) {
  const tones = {
    navy: "border-[#123865] bg-[#123865]",
    blue: "border-[#60A5FA] bg-[#F2F7FF]",
    green: "border-[#34D399] bg-[#F0FFF8]",
    amber: "border-[#F59E0B] bg-[#FFF8E8]",
    red: "border-[#FB7185] bg-[#FFF4F4]",
    violet: "border-[#9B6CFF] bg-[#F8F5FF]",
  };

  const dark = tone === "navy";

  return (
    <article
      className={`rounded-[1.35rem] border-[3px] p-4 shadow-[0_6px_18px_rgba(15,35,63,0.05)] ${
        tones[tone] || tones.blue
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p
            className={`text-[9px] font-black uppercase tracking-[0.11em] ${
              dark ? "text-orange-300" : "text-slate-500"
            }`}
          >
            {label}
          </p>

          <p
            className={`mt-2 text-2xl font-black ${
              dark ? "text-white" : "text-[#10233F]"
            }`}
          >
            {value}
          </p>
        </div>

        {Icon ? (
          <div
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border-2 ${
              dark
                ? "border-white/20 bg-white/10 text-orange-200"
                : "border-[#123865]/15 bg-white text-[#123865]"
            }`}
          >
            <Icon size={16} />
          </div>
        ) : null}
      </div>

      <p
        className={`mt-2 text-xs font-semibold leading-5 ${
          dark ? "text-slate-200" : "text-slate-600"
        }`}
      >
        {helper}
      </p>
    </article>
  );
}

export default function MarketingFunnelPanel({
  marketing = {},
  compact = false,
}) {
  const stages = useMemo(
    () => safeArray(marketing.stageCounts),
    [marketing.stageCounts]
  );

  const max = useMemo(
    () =>
      Math.max(
        ...stages.map((stage) => safeNumber(stage.count)),
        0
      ),
    [stages]
  );

  const transitions = useMemo(() => {
    return stages.slice(1).map((stage, index) => {
      const previous = stages[index];
      const rate = conversion(stage.count, previous?.count);

      return {
        key: `${previous?.key || index}-${stage.key || index + 1}`,
        from: previous?.label || previous?.key || "Previous",
        to: stage.label || stage.key || "Next",
        rate,
        dropoff: rate === null ? null : Math.max(0, 100 - rate),
      };
    });
  }, [stages]);

  const measurableTransitions = transitions.filter(
    (item) => item.rate !== null
  );

  const weakest = measurableTransitions.length
    ? [...measurableTransitions].sort(
        (a, b) => safeNumber(a.rate) - safeNumber(b.rate)
      )[0]
    : null;

  const strongest = measurableTransitions.length
    ? [...measurableTransitions].sort(
        (a, b) => safeNumber(b.rate) - safeNumber(a.rate)
      )[0]
    : null;

  const entryCount = safeNumber(stages[0]?.count);
  const finalCount = safeNumber(stages[stages.length - 1]?.count);

  const endToEnd =
    stages.length > 1 && entryCount > 0
      ? conversion(finalCount, entryCount)
      : null;

  return (
    <section className="min-w-0 overflow-hidden rounded-[1.9rem] border-[3px] border-[#C9D7E6] bg-[#FFFDF8] shadow-[0_14px_38px_rgba(15,35,63,0.07)]">
      <div className="grid border-b-[3px] border-[#F97316] xl:grid-cols-[minmax(0,1.2fr)_minmax(18rem,0.8fr)]">
        <div className="bg-[#123865] p-5 text-white sm:p-6">
          <div className="inline-flex items-center gap-2 rounded-full border-2 border-orange-300/30 bg-orange-400/10 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.12em] text-orange-300">
            <Funnel size={12} />
            Marketing Funnel
          </div>

          <h2 className="mt-3 text-2xl font-black text-white sm:text-3xl">
            Acquisition → Visa Movement
          </h2>

          <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-200">
            Track recorded movement from lead through application, offer, CAS
            and visa. Zaifan now distinguishes real conversion from stages that
            simply do not have a valid baseline yet.
          </p>
        </div>

        <div className="bg-[#FF5A0A] p-5 text-white sm:p-6">
          <p className="text-[9px] font-black uppercase tracking-[0.12em]">
            End-to-End Movement
          </p>

          <p className="mt-2 text-3xl font-black">
            {endToEnd === null ? "—" : percent(endToEnd)}
          </p>

          <p className="mt-2 text-xs font-semibold leading-5 text-orange-50">
            {endToEnd === null
              ? "A lead baseline and final-stage evidence are required."
              : `${finalCount} final-stage record${
                  finalCount === 1 ? "" : "s"
                } from ${entryCount} entry record${
                  entryCount === 1 ? "" : "s"
                }.`}
          </p>

          <span className="mt-3 inline-flex rounded-full border-2 border-white/25 bg-white/10 px-3 py-1 text-[8px] font-black uppercase tracking-[0.08em]">
            Recorded funnel only
          </span>
        </div>
      </div>

      <div className="space-y-5 p-4 sm:p-5">
        {!compact ? (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              label="Funnel Stages"
              value={stages.length}
              helper="Recorded stage buckets supplied by the Marketing OS snapshot."
              tone="navy"
              icon={Route}
            />

            <MetricCard
              label="Entry Records"
              value={entryCount}
              helper="Records visible in the first acquisition stage."
              tone="blue"
              icon={Target}
            />

            <MetricCard
              label="Best Transition"
              value={
                strongest?.rate === null || !strongest
                  ? "—"
                  : percent(strongest.rate)
              }
              helper={
                strongest
                  ? `${strongest.from} → ${strongest.to}`
                  : "No measurable stage transition yet."
              }
              tone="green"
              icon={TrendingUp}
            />

            <MetricCard
              label="Biggest Drop-Off"
              value={
                weakest?.dropoff === null || !weakest
                  ? "—"
                  : percent(weakest.dropoff)
              }
              helper={
                weakest
                  ? `${weakest.from} → ${weakest.to}`
                  : "No measurable stage transition yet."
              }
              tone={weakest?.dropoff >= 70 ? "red" : "amber"}
              icon={TrendingDown}
            />
          </div>
        ) : null}

        <div className={compact ? "space-y-2.5" : "space-y-2.5"}>
          {stages.length ? (
            stages.map((stage, index) => (
              <StageRow
                key={stage.key || `${stage.label}-${index}`}
                stage={stage}
                max={max}
                previous={
                  index === 0 ? null : stages[index - 1]?.count
                }
                index={index}
                compact={compact}
              />
            ))
          ) : (
            <div className="rounded-[1.55rem] border-[3px] border-dashed border-[#C9D7E6] bg-white p-8 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border-2 border-[#F97316] bg-[#FFF4E8] text-orange-700">
                <Funnel size={24} />
              </div>

              <h3 className="mt-4 text-xl font-black text-[#10233F]">
                No marketing funnel evidence yet
              </h3>

              <p className="mx-auto mt-2 max-w-xl text-sm font-semibold leading-6 text-slate-600">
                Funnel conversion will appear when real lead, application,
                offer, CAS and visa stage counts are available.
              </p>
            </div>
          )}
        </div>

        {!compact && stages.length ? (
          <div className="grid gap-3 lg:grid-cols-3">
            <div className="rounded-[1.35rem] border-[3px] border-[#34D399] bg-[#F0FFF8] p-4">
              <div className="flex items-start gap-3">
                <ShieldCheck
                  size={17}
                  className="mt-0.5 shrink-0 text-emerald-700"
                />
                <div>
                  <p className="text-[8px] font-black uppercase tracking-[0.11em] text-slate-500">
                    Conversion Integrity
                  </p>
                  <p className="mt-1 font-black text-[#10233F]">
                    No fake 100% baselines
                  </p>
                  <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">
                    A stage without a valid previous-stage baseline is now
                    labelled not measured instead of automatically showing
                    100%.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-[1.35rem] border-[3px] border-[#60A5FA] bg-[#F2F7FF] p-4">
              <div className="flex items-start gap-3">
                <CircleGauge
                  size={17}
                  className="mt-0.5 shrink-0 text-blue-700"
                />
                <div>
                  <p className="text-[8px] font-black uppercase tracking-[0.11em] text-slate-500">
                    Relative Volume
                  </p>
                  <p className="mt-1 font-black text-[#10233F]">
                    Bars show stage size
                  </p>
                  <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">
                    The horizontal bar compares each stage with the largest
                    funnel bucket; it is not itself a conversion percentage.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-[1.35rem] border-[3px] border-[#F59E0B] bg-[#FFF8E8] p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle
                  size={17}
                  className="mt-0.5 shrink-0 text-amber-700"
                />
                <div>
                  <p className="text-[8px] font-black uppercase tracking-[0.11em] text-slate-500">
                    Attribution Boundary
                  </p>
                  <p className="mt-1 font-black text-[#10233F]">
                    Marketing funnel ≠ causal proof
                  </p>
                  <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">
                    This shows recorded movement. It does not prove that a
                    campaign or source caused the downstream outcome unless
                    attribution is connected.
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
