import React, { useMemo } from "react";
import {
  AlertTriangle,
  Banknote,
  BadgeCheck,
  Calculator,
  CircleDollarSign,
  Database,
  PiggyBank,
  ShieldCheck,
  TrendingUp,
} from "lucide-react";

function safeArray(value) {
  return Array.isArray(value) ? value.filter(Boolean) : [];
}

function safeNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function money(value) {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    maximumFractionDigits: 0,
  }).format(safeNumber(value));
}

function percent(value) {
  return `${Math.round(safeNumber(value))}%`;
}

function hasSpendEvidence(totals = {}) {
  return safeNumber(totals.spend) > 0;
}

function hasRevenueEvidence(totals = {}) {
  return safeNumber(totals.revenue) > 0;
}

function hasLeadEvidence(totals = {}) {
  return safeNumber(totals.leads) > 0;
}

function hasApplicationEvidence(totals = {}) {
  return safeNumber(totals.applications) > 0;
}

function sourceHasMeasuredRoi(source = {}) {
  return safeNumber(source.spend) > 0;
}

function campaignHasMeasuredRoi(campaign = {}) {
  return safeNumber(campaign.spend) > 0;
}

function getBestMeasuredSource(sources = []) {
  const measurable = safeArray(sources).filter(sourceHasMeasuredRoi);
  if (!measurable.length) return null;

  return [...measurable].sort(
    (a, b) => safeNumber(b.roi, -999999) - safeNumber(a.roi, -999999)
  )[0];
}

function getBestMeasuredCampaign(campaigns = []) {
  const measurable = safeArray(campaigns).filter(campaignHasMeasuredRoi);
  if (!measurable.length) return null;

  return [...measurable].sort(
    (a, b) => safeNumber(b.roi, -999999) - safeNumber(a.roi, -999999)
  )[0];
}

function ROICard({
  label,
  value,
  helper,
  tone = "blue",
  icon: Icon,
  badge = "",
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
        <p
          className={`min-w-0 text-[9px] font-black uppercase tracking-[0.11em] ${
            dark ? "text-orange-300" : "text-slate-500"
          }`}
        >
          {label}
        </p>

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
        className={`mt-3 whitespace-nowrap text-[1.35rem] font-black leading-tight ${
          dark ? "text-white" : "text-[#10233F]"
        }`}
      >
        {value}
      </p>

      <p
        className={`mt-3 text-xs font-semibold leading-5 ${
          dark ? "text-slate-200" : "text-slate-600"
        }`}
      >
        {helper}
      </p>

      {badge ? (
        <span
          className={`mt-3 inline-flex rounded-full border-2 px-2.5 py-1 text-[8px] font-black uppercase tracking-[0.08em] ${
            dark
              ? "border-white/20 bg-white/10 text-white"
              : "border-[#C9D7E6] bg-white text-slate-600"
          }`}
        >
          {badge}
        </span>
      ) : null}
    </article>
  );
}

export default function MarketingROIPanel({
  marketing = {},
  compact = false,
}) {
  const totals = marketing.totals || {};
  const sources = safeArray(marketing.sources);
  const campaigns = safeArray(marketing.campaigns);

  const spendMeasured = hasSpendEvidence(totals);
  const revenueMeasured = hasRevenueEvidence(totals);
  const leadsMeasured = hasLeadEvidence(totals);
  const applicationsMeasured = hasApplicationEvidence(totals);

  const measuredRoi =
    spendMeasured && Number.isFinite(Number(totals.roi))
      ? safeNumber(totals.roi)
      : null;

  const measuredCpl =
    spendMeasured && leadsMeasured
      ? safeNumber(totals.costPerLead)
      : null;

  const measuredCpa =
    spendMeasured && applicationsMeasured
      ? safeNumber(totals.costPerApplication)
      : null;

  const bestSource = useMemo(
    () => getBestMeasuredSource(sources),
    [sources]
  );

  const bestCampaign = useMemo(
    () => getBestMeasuredCampaign(campaigns),
    [campaigns]
  );

  const measuredSourceCount = useMemo(
    () => sources.filter(sourceHasMeasuredRoi).length,
    [sources]
  );

  const measuredCampaignCount = useMemo(
    () => campaigns.filter(campaignHasMeasuredRoi).length,
    [campaigns]
  );

  return (
    <section className="min-w-0 overflow-hidden rounded-[1.9rem] border-[3px] border-[#C9D7E6] bg-[#FFFDF8] shadow-[0_14px_38px_rgba(15,35,63,0.07)]">
      <div className="grid border-b-[3px] border-[#F97316] xl:grid-cols-[minmax(0,1.2fr)_minmax(18rem,0.8fr)]">
        <div className="bg-[#123865] p-5 text-white sm:p-6">
          <div className="inline-flex items-center gap-2 rounded-full border-2 border-orange-300/30 bg-orange-400/10 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.12em] text-orange-300">
            <CircleDollarSign size={12} />
            Marketing ROI
          </div>

          <h2 className="mt-3 text-2xl font-black text-white sm:text-3xl">
            Acquisition Economics
          </h2>

          <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-200">
            Spend, linked revenue and unit economics using recorded marketing
            evidence only. Missing spend no longer appears as a real 0% ROI,
            £0 CPL or £0 CPA.
          </p>
        </div>

        <div className="bg-[#FF5A0A] p-5 text-white sm:p-6">
          <p className="text-[9px] font-black uppercase tracking-[0.12em]">
            ROI Evidence State
          </p>

          <p className="mt-2 text-3xl font-black">
            {measuredRoi === null ? "Not measured" : percent(measuredRoi)}
          </p>

          <p className="mt-2 text-xs font-semibold leading-5 text-orange-50">
            {spendMeasured
              ? `${money(totals.spend)} recorded spend · ${money(
                  totals.revenue
                )} linked revenue.`
              : "Recorded marketing spend is required before return can be measured."}
          </p>

          <span className="mt-3 inline-flex rounded-full border-2 border-white/25 bg-white/10 px-3 py-1 text-[8px] font-black uppercase tracking-[0.08em]">
            Spend-backed economics
          </span>
        </div>
      </div>

      <div className="space-y-5 p-4 sm:p-5">
        <div
          className={
            compact
              ? "grid gap-3 md:grid-cols-3"
              : "grid gap-3 md:grid-cols-2 xl:grid-cols-5"
          }
        >
          <ROICard
            label="Spend"
            value={spendMeasured ? money(totals.spend) : "Not recorded"}
            helper={
              spendMeasured
                ? "Recorded marketing cost."
                : "Connect real campaign/ad spend."
            }
            tone={spendMeasured ? "red" : "amber"}
            icon={PiggyBank}
            badge={spendMeasured ? "Recorded" : "Missing evidence"}
          />

          <ROICard
            label="Revenue"
            value={revenueMeasured ? money(totals.revenue) : "Not linked"}
            helper={
              revenueMeasured
                ? "Payments linked into the marketing snapshot."
                : "No linked revenue evidence yet."
            }
            tone={revenueMeasured ? "green" : "blue"}
            icon={Banknote}
            badge={revenueMeasured ? "Linked" : "No evidence"}
          />

          <ROICard
            label="ROI"
            value={measuredRoi === null ? "—" : percent(measuredRoi)}
            helper={
              measuredRoi === null
                ? "Not measured until spend exists."
                : "Return calculated from recorded spend and linked revenue."
            }
            tone={
              measuredRoi === null
                ? "blue"
                : measuredRoi >= 0
                  ? "green"
                  : "red"
            }
            icon={TrendingUp}
            badge={measuredRoi === null ? "Not measured" : "Measured"}
          />

          {!compact ? (
            <>
              <ROICard
                label="CPL"
                value={measuredCpl === null ? "—" : money(measuredCpl)}
                helper={
                  measuredCpl === null
                    ? "Needs recorded spend and at least one lead."
                    : "Recorded spend divided by current lead count."
                }
                tone={measuredCpl === null ? "blue" : "amber"}
                icon={Calculator}
                badge={measuredCpl === null ? "Not measured" : "Measured"}
              />

              <ROICard
                label="CPA"
                value={measuredCpa === null ? "—" : money(measuredCpa)}
                helper={
                  measuredCpa === null
                    ? "Needs recorded spend and at least one application."
                    : "Recorded spend divided by current application count."
                }
                tone={measuredCpa === null ? "blue" : "violet"}
                icon={Calculator}
                badge={measuredCpa === null ? "Not measured" : "Measured"}
              />
            </>
          ) : null}
        </div>

        {!compact ? (
          <div className="grid gap-4 xl:grid-cols-2">
            <article className="rounded-[1.45rem] border-[3px] border-[#C9D7E6] bg-white p-4">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border-2 border-[#60A5FA] bg-[#F2F7FF] text-blue-700">
                  <BadgeCheck size={17} />
                </div>

                <div className="min-w-0">
                  <p className="text-[8px] font-black uppercase tracking-[0.11em] text-slate-500">
                    Best Measured Source
                  </p>

                  <p className="mt-1 [overflow-wrap:anywhere] text-xl font-black text-[#10233F]">
                    {bestSource?.name || "Not measured"}
                  </p>

                  <p className="mt-2 text-xs font-semibold leading-5 text-slate-600">
                    {bestSource
                      ? `${safeNumber(bestSource.leads)} leads · ${percent(
                          bestSource.roi
                        )} ROI with recorded spend evidence.`
                      : "No source has enough spend evidence for a trustworthy ROI ranking yet."}
                  </p>
                </div>
              </div>
            </article>

            <article className="rounded-[1.45rem] border-[3px] border-[#C9D7E6] bg-white p-4">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border-2 border-[#F97316] bg-[#FFF4E8] text-orange-700">
                  <TrendingUp size={17} />
                </div>

                <div className="min-w-0">
                  <p className="text-[8px] font-black uppercase tracking-[0.11em] text-slate-500">
                    Best Measured Campaign
                  </p>

                  <p className="mt-1 [overflow-wrap:anywhere] text-xl font-black text-[#10233F]">
                    {bestCampaign?.name || "Not measured"}
                  </p>

                  <p className="mt-2 text-xs font-semibold leading-5 text-slate-600">
                    {bestCampaign
                      ? `${safeNumber(bestCampaign.leads)} leads · ${percent(
                          bestCampaign.roi
                        )} ROI with recorded spend evidence.`
                      : "No campaign has enough spend evidence for a trustworthy ROI ranking yet."}
                  </p>
                </div>
              </div>
            </article>
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
                    ROI Integrity
                  </p>
                  <p className="mt-1 font-black text-[#10233F]">
                    Missing spend ≠ 0% return
                  </p>
                  <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">
                    ROI is only displayed when recorded spend exists. Revenue
                    without spend does not create a synthetic return percentage.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-[1.35rem] border-[3px] border-[#60A5FA] bg-[#F2F7FF] p-4">
              <div className="flex items-start gap-3">
                <Database
                  size={17}
                  className="mt-0.5 shrink-0 text-blue-700"
                />

                <div>
                  <p className="text-[8px] font-black uppercase tracking-[0.11em] text-slate-500">
                    Ranking Coverage
                  </p>
                  <p className="mt-1 font-black text-[#10233F]">
                    {measuredSourceCount} sources · {measuredCampaignCount} campaigns measured
                  </p>
                  <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">
                    “Best” rankings exclude rows without real spend evidence.
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
                    Linked revenue ≠ causal proof
                  </p>
                  <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">
                    Marketing economics are most reliable when campaign/source
                    attribution is recorded through the student journey, not
                    inferred later.
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
