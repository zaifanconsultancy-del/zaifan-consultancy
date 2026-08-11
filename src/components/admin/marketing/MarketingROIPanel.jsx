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
import ZaifanMetricCard from "../ui/ZaifanMetricCard";

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
}) {
  return (
    <ZaifanMetricCard
      level="coBoss"
      label={label}
      value={value}
      detail={helper}
      icon={Icon}
      tone={toZaifanMetricTone(tone)}
      className="h-full"
    />
  );
}


function toZaifanMetricTone(tone = "") {
  const value = String(tone || "").trim().toLowerCase();

  if (
    value.includes("green") ||
    value.includes("emerald") ||
    value.includes("success") ||
    value.includes("healthy") ||
    value.includes("ready") ||
    value.includes("connected") ||
    value.includes("active") ||
    value.includes("live") ||
    value.includes("good")
  ) return "green";

  if (
    value.includes("red") ||
    value.includes("rose") ||
    value.includes("danger") ||
    value.includes("risk") ||
    value.includes("critical") ||
    value.includes("failed") ||
    value.includes("error") ||
    value.includes("blocked") ||
    value.includes("disconnected")
  ) return "red";

  if (
    value.includes("amber") ||
    value.includes("yellow") ||
    value.includes("warning") ||
    value.includes("warn") ||
    value.includes("attention") ||
    value.includes("paused")
  ) return "amber";

  if (value.includes("violet") || value.includes("purple")) return "violet";
  if (value.includes("orange") || value.includes("gold")) return "orange";
  if (value.includes("blue") || value.includes("cyan") || value.includes("teal") || value.includes("info")) return "blue";
  if (value.includes("slate") || value.includes("gray") || value.includes("grey") || value.includes("muted") || value.includes("neutral")) return "slate";

  return "navy";
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
            {measuredRoi === null ? "N/A" : percent(measuredRoi)}
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
              ? "grid auto-rows-fr gap-3 md:grid-cols-3"
              : "grid auto-rows-fr gap-3 md:grid-cols-2 xl:grid-cols-3"
          }
        >
          <ROICard
            label="Spend"
            value={spendMeasured ? money(totals.spend) : "N/A"}
            helper={
              spendMeasured
                ? "Recorded marketing cost."
                : "Not recorded · Connect real campaign/ad spend."
            }
            tone={spendMeasured ? "red" : "slate"}
            icon={PiggyBank}
          />

          <ROICard
            label="Revenue"
            value={revenueMeasured ? money(totals.revenue) : "N/A"}
            helper={
              revenueMeasured
                ? "Payments linked into the marketing snapshot."
                : "Not linked · No revenue attribution evidence yet."
            }
            tone={revenueMeasured ? "green" : "slate"}
            icon={Banknote}
          />

          <ROICard
            label="ROI"
            value={measuredRoi === null ? "N/A" : percent(measuredRoi)}
            helper={
              measuredRoi === null
                ? "Not measured until spend exists."
                : "Return calculated from recorded spend and linked revenue."
            }
            tone={
              measuredRoi === null
                ? "slate"
                : measuredRoi >= 0
                  ? "green"
                  : "red"
            }
            icon={TrendingUp}
          />

          {!compact ? (
            <>
              <ROICard
                label="CPL"
                value={measuredCpl === null ? "N/A" : money(measuredCpl)}
                helper={
                  measuredCpl === null
                    ? "Needs recorded spend and at least one lead."
                    : "Recorded spend divided by current lead count."
                }
                tone={measuredCpl === null ? "slate" : "amber"}
                icon={Calculator}
              />

              <ROICard
                label="CPA"
                value={measuredCpa === null ? "N/A" : money(measuredCpa)}
                helper={
                  measuredCpa === null
                    ? "Needs recorded spend and at least one application."
                    : "Recorded spend divided by current application count."
                }
                tone={measuredCpa === null ? "slate" : "violet"}
                icon={Calculator}
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
