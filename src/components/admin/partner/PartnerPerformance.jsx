import React, { useMemo } from "react";
import {
  AlertTriangle,
  BadgeCheck,
  Gauge,
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

function lower(value) {
  return String(value ?? "").trim().toLowerCase();
}

function percent(value) {
  return `${Math.round(safeNumber(value))}%`;
}

function getName(item = {}) {
  return (
    item.name ||
    item.partner ||
    item.partner_name ||
    item.partnerName ||
    item.organization_name ||
    item.organizationName ||
    "Unnamed partner"
  );
}

function getExplicitScore(item = {}) {
  const raw =
    item.score ??
    item.performance_score ??
    item.performanceScore;

  if (raw === null || raw === undefined || raw === "") {
    return null;
  }

  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : null;
}

function getQuality(item = {}) {
  const raw =
    item.quality ??
    item.quality_score ??
    item.qualityScore ??
    item.lead_quality ??
    item.leadQuality;

  if (raw === null || raw === undefined || raw === "") return null;

  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : null;
}

function getCompliance(item = {}) {
  const raw =
    item.compliance ??
    item.compliance_score ??
    item.complianceScore;

  if (raw === null || raw === undefined || raw === "") return null;

  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : null;
}

function getSpeed(item = {}) {
  const raw =
    item.speed ??
    item.response_speed ??
    item.responseSpeed ??
    item.speed_score ??
    item.speedScore;

  if (raw === null || raw === undefined || raw === "") return null;

  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : null;
}

function getGrowth(item = {}) {
  const raw =
    item.growth ??
    item.growth_rate ??
    item.growthRate;

  if (raw === null || raw === undefined || raw === "") return null;

  const text = String(raw).trim();

  if (text.endsWith("%")) {
    const parsed = Number(text.replace("%", ""));
    return Number.isFinite(parsed) ? parsed : null;
  }

  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : null;
}

function metricTone(value) {
  if (value === null) {
    return "border-[#60A5FA] bg-[#F2F7FF] text-blue-700";
  }

  if (value >= 85) {
    return "border-[#34D399] bg-[#F0FFF8] text-emerald-700";
  }

  if (value >= 70) {
    return "border-[#F59E0B] bg-[#FFF8E8] text-amber-800";
  }

  return "border-[#FB7185] bg-[#FFF4F4] text-red-700";
}

function growthTone(value) {
  if (value === null) {
    return "border-[#60A5FA] bg-[#F2F7FF] text-blue-700";
  }

  if (value > 0) {
    return "border-[#34D399] bg-[#F0FFF8] text-emerald-700";
  }

  if (value < 0) {
    return "border-[#FB7185] bg-[#FFF4F4] text-red-700";
  }

  return "border-[#C9D7E6] bg-[#FFF8EF] text-slate-600";
}

function ProgressMetric({ label, value }) {
  const width =
    value === null
      ? 0
      : Math.max(0, Math.min(100, Math.round(safeNumber(value))));

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between gap-3">
        <span className="text-xs font-black text-[#10233F]">{label}</span>

        <span
          className={`rounded-full border-2 px-2.5 py-1 text-[8px] font-black uppercase tracking-[0.07em] ${metricTone(
            value
          )}`}
        >
          {value === null ? "Not measured" : percent(value)}
        </span>
      </div>

      <div className="h-2.5 overflow-hidden rounded-full bg-[#DDE7F0]">
        {value !== null ? (
          <div
            className="h-full rounded-full bg-[#123865] transition-[width] duration-500"
            style={{ width: `${width}%` }}
          />
        ) : null}
      </div>
    </div>
  );
}

function PerformanceCard({ item }) {
  const score = getExplicitScore(item);
  const quality = getQuality(item);
  const compliance = getCompliance(item);
  const speed = getSpeed(item);
  const growth = getGrowth(item);

  const measuredMetrics = [quality, compliance, speed].filter(
    (value) => value !== null
  ).length;

  return (
    <article className="rounded-[1.4rem] border-[3px] border-[#C9D7E6] bg-white p-4 shadow-[0_6px_18px_rgba(15,35,63,0.04)] transition hover:border-[#F97316]">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="min-w-0 [overflow-wrap:anywhere] text-lg font-black text-[#10233F]">
            {getName(item)}
          </p>

          <div className="mt-2 flex flex-wrap gap-2">
            <span
              className={`rounded-full border-2 px-2.5 py-1 text-[8px] font-black uppercase tracking-[0.07em] ${growthTone(
                growth
              )}`}
            >
              {growth === null
                ? "Growth not measured"
                : `Growth ${growth > 0 ? "+" : ""}${Math.round(growth)}%`}
            </span>

            <span className="rounded-full border-2 border-[#C9D7E6] bg-[#FFF8EF] px-2.5 py-1 text-[8px] font-black uppercase tracking-[0.07em] text-slate-600">
              {measuredMetrics}/3 core metrics measured
            </span>
          </div>
        </div>

        <div className="shrink-0 text-left sm:text-right">
          <p className="text-[8px] font-black uppercase tracking-[0.09em] text-slate-500">
            Overall Score
          </p>

          <span
            className={`mt-1 inline-flex rounded-full border-2 px-3 py-1.5 text-sm font-black ${metricTone(
              score
            )}`}
          >
            {score === null ? "Not measured" : percent(score)}
          </span>
        </div>
      </div>

      <div className="mt-4 space-y-4">
        <ProgressMetric label="Lead Quality" value={quality} />
        <ProgressMetric label="Compliance" value={compliance} />
        <ProgressMetric label="Response Speed" value={speed} />
      </div>
    </article>
  );
}

export default function PartnerPerformance({
  compact = false,
  records = [],
  partners = [],
}) {
  const performanceRows = useMemo(() => {
    const direct = safeArray(records);
    if (direct.length) return direct;

    return safeArray(partners).filter((partner) => {
      return [
        getExplicitScore(partner),
        getQuality(partner),
        getCompliance(partner),
        getSpeed(partner),
        getGrowth(partner),
      ].some((value) => value !== null);
    });
  }, [records, partners]);

  const ranked = useMemo(() => {
    return [...performanceRows].sort((a, b) => {
      const aScore = getExplicitScore(a);
      const bScore = getExplicitScore(b);

      if (aScore === null && bScore === null) return 0;
      if (aScore === null) return 1;
      if (bScore === null) return -1;
      return bScore - aScore;
    });
  }, [performanceRows]);

  const measurableScores = ranked.filter(
    (item) => getExplicitScore(item) !== null
  );

  const top = measurableScores[0] || null;

  const fastest = [...ranked]
    .filter((item) => getSpeed(item) !== null)
    .sort((a, b) => getSpeed(b) - getSpeed(a))[0] || null;

  const recovery = [...ranked]
    .filter((item) => {
      const score = getExplicitScore(item);
      const compliance = getCompliance(item);
      const speed = getSpeed(item);

      return (
        (score !== null && score < 70) ||
        (compliance !== null && compliance < 70) ||
        (speed !== null && speed < 70)
      );
    })
    .sort((a, b) => {
      const aScore = getExplicitScore(a) ?? 101;
      const bScore = getExplicitScore(b) ?? 101;
      return aScore - bScore;
    })[0] || null;

  const visible = compact ? ranked.slice(0, 4) : ranked;

  return (
    <section className="min-w-0 overflow-hidden rounded-[1.9rem] border-[3px] border-[#C9D7E6] bg-[#FFFDF8] shadow-[0_14px_38px_rgba(15,35,63,0.07)]">
      <div className="grid border-b-[3px] border-[#F97316] xl:grid-cols-[minmax(0,1.2fr)_minmax(16rem,0.8fr)]">
        <div className="bg-[#123865] p-5 text-white sm:p-6">
          <div className="inline-flex items-center gap-2 rounded-full border-2 border-orange-300/30 bg-orange-400/10 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.12em] text-orange-300">
            <Gauge size={12} />
            Partner Performance
          </div>

          <h2 className="mt-3 text-2xl font-black text-white sm:text-3xl">
            Relationship Performance Evidence
          </h2>

          <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-200">
            Performance scorecards now display only explicitly recorded quality,
            compliance, response-speed, growth and overall-score evidence. No
            fabricated 92/89/76/54 rankings are preloaded.
          </p>
        </div>

        <div className="bg-[#FF5A0A] p-5 text-white sm:p-6">
          <p className="text-[9px] font-black uppercase tracking-[0.12em]">
            Measured Partners
          </p>

          <p className="mt-2 text-3xl font-black">
            {measurableScores.length}/{performanceRows.length}
          </p>

          <p className="mt-2 text-xs font-semibold leading-5 text-orange-50">
            Partners with an explicit overall performance score.
          </p>

          <span className="mt-3 inline-flex rounded-full border-2 border-white/25 bg-white/10 px-3 py-1 text-[8px] font-black uppercase tracking-[0.08em]">
            No synthetic ranking
          </span>
        </div>
      </div>

      <div className="space-y-5 p-4 sm:p-5">
        <div className="grid gap-3 xl:grid-cols-2">
          {visible.length ? (
            visible.map((item, index) => (
              <PerformanceCard
                key={
                  item.id ||
                  `${getName(item)}-${index}`
                }
                item={item}
              />
            ))
          ) : (
            <div className="xl:col-span-2 rounded-[1.5rem] border-[3px] border-dashed border-[#C9D7E6] bg-white p-8 text-center">
              <Gauge size={24} className="mx-auto text-orange-700" />

              <p className="mt-3 font-black text-[#10233F]">
                No real partner-performance evidence yet.
              </p>

              <p className="mx-auto mt-2 max-w-xl text-sm font-semibold leading-6 text-slate-600">
                Connect genuine performance measurements before Zaifan ranks
                partners or labels anyone a top performer, fastest partner or
                recovery case.
              </p>
            </div>
          )}
        </div>

        {!compact ? (
          <div className="grid gap-3 lg:grid-cols-3">
            <div className="rounded-[1.35rem] border-[3px] border-[#34D399] bg-[#F0FFF8] p-4">
              <div className="flex items-start gap-3">
                <TrendingUp
                  size={17}
                  className="mt-0.5 shrink-0 text-emerald-700"
                />

                <div>
                  <p className="text-[8px] font-black uppercase tracking-[0.11em] text-slate-500">
                    Top Performer
                  </p>
                  <p className="mt-1 font-black text-[#10233F]">
                    {top ? getName(top) : "Not measured"}
                  </p>
                  <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">
                    {top
                      ? `${percent(getExplicitScore(top))} explicit overall score.`
                      : "No partner has an explicit overall score yet."}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-[1.35rem] border-[3px] border-[#60A5FA] bg-[#F2F7FF] p-4">
              <div className="flex items-start gap-3">
                <BadgeCheck
                  size={17}
                  className="mt-0.5 shrink-0 text-blue-700"
                />

                <div>
                  <p className="text-[8px] font-black uppercase tracking-[0.11em] text-slate-500">
                    Fastest Measured
                  </p>
                  <p className="mt-1 font-black text-[#10233F]">
                    {fastest ? getName(fastest) : "Not measured"}
                  </p>
                  <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">
                    {fastest
                      ? `${percent(getSpeed(fastest))} recorded response-speed score.`
                      : "No response-speed measurement exists yet."}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-[1.35rem] border-[3px] border-[#F59E0B] bg-[#FFF8E8] p-4">
              <div className="flex items-start gap-3">
                <TrendingDown
                  size={17}
                  className="mt-0.5 shrink-0 text-amber-700"
                />

                <div>
                  <p className="text-[8px] font-black uppercase tracking-[0.11em] text-slate-500">
                    Recovery Attention
                  </p>
                  <p className="mt-1 font-black text-[#10233F]">
                    {recovery ? getName(recovery) : "No measured recovery case"}
                  </p>
                  <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">
                    {recovery
                      ? "At least one measured score is below the current 70% review threshold."
                      : "No measured partner currently falls below the review threshold."}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {!compact ? (
          <div className="grid gap-3 lg:grid-cols-3">
            <div className="rounded-[1.35rem] border-[3px] border-[#34D399] bg-[#F0FFF8] p-4">
              <div className="flex items-start gap-3">
                <ShieldCheck
                  size={17}
                  className="mt-0.5 shrink-0 text-emerald-700"
                />
                <div>
                  <p className="text-[8px] font-black uppercase tracking-[0.11em] text-slate-500">
                    Scoring Integrity
                  </p>
                  <p className="mt-1 font-black text-[#10233F]">
                    No hidden composite formula
                  </p>
                  <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">
                    Partner OS no longer manufactures an overall score from
                    unrelated fields unless that scoring model is explicitly
                    designed and documented.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-[1.35rem] border-[3px] border-[#60A5FA] bg-[#F2F7FF] p-4">
              <div className="flex items-start gap-3">
                <Target
                  size={17}
                  className="mt-0.5 shrink-0 text-blue-700"
                />
                <div>
                  <p className="text-[8px] font-black uppercase tracking-[0.11em] text-slate-500">
                    Metric Boundary
                  </p>
                  <p className="mt-1 font-black text-[#10233F]">
                    Missing metrics stay missing
                  </p>
                  <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">
                    Quality, compliance and response speed are displayed only
                    when genuine measurements exist.
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
                    Ranking Boundary
                  </p>
                  <p className="mt-1 font-black text-[#10233F]">
                    Unmeasured partners are not ranked
                  </p>
                  <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">
                    A partner with missing performance evidence cannot become
                    “top”, “fastest” or “worst” through default values.
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
