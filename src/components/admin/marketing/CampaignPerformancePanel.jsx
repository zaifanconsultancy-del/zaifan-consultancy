import React, { useMemo, useState } from "react";

const GBP = new Intl.NumberFormat("en-GB", {
  style: "currency",
  currency: "GBP",
  maximumFractionDigits: 0,
});

const INTEGER = new Intl.NumberFormat("en-GB", {
  maximumFractionDigits: 0,
});

function safeNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function money(value) {
  return GBP.format(safeNumber(value));
}

function integer(value) {
  return INTEGER.format(Math.max(0, safeNumber(value)));
}

function lower(value) {
  return String(value ?? "").trim().toLowerCase();
}

function percent(value) {
  return `${Math.round(safeNumber(value))}%`;
}

function ratio(part, total) {
  const numerator = safeNumber(part);
  const denominator = safeNumber(total);
  return denominator > 0 ? Math.round((numerator / denominator) * 100) : null;
}

function campaignKey(campaign, index) {
  return (
    campaign?.id ||
    campaign?.campaign_id ||
    `${campaign?.name || "campaign"}-${campaign?.source || "unknown"}-${index}`
  );
}

function hasSpendEvidence(campaign) {
  return safeNumber(campaign?.spend) > 0;
}

function hasRevenueEvidence(campaign) {
  return safeNumber(campaign?.revenue) > 0;
}

function hasRoiEvidence(campaign) {
  return hasSpendEvidence(campaign);
}

function getRoiMeta(campaign) {
  if (!hasRoiEvidence(campaign)) {
    return {
      label: "ROI not measured",
      className: "border-slate-300 bg-slate-50 text-slate-700",
      helper: "Spend evidence required",
    };
  }

  const roi = safeNumber(campaign.roi);

  if (roi >= 100) {
    return {
      label: `ROI ${percent(roi)}`,
      className: "border-emerald-400 bg-emerald-50 text-emerald-800",
      helper: "Strong recorded return",
    };
  }

  if (roi >= 0) {
    return {
      label: `ROI ${percent(roi)}`,
      className: "border-amber-400 bg-amber-50 text-amber-900",
      helper: "Positive recorded return",
    };
  }

  return {
    label: `ROI ${percent(roi)}`,
    className: "border-rose-400 bg-rose-50 text-rose-800",
    helper: "Recorded spend exceeds linked revenue",
  };
}

function getCampaignState(campaign) {
  const leads = safeNumber(campaign?.leads);
  const applications = safeNumber(campaign?.applications);
  const offers = safeNumber(campaign?.offers);
  const cas = safeNumber(campaign?.cas);
  const visas = safeNumber(campaign?.visas);
  const spend = safeNumber(campaign?.spend);
  const revenue = safeNumber(campaign?.revenue);

  if (!leads && !applications && !offers && !cas && !visas && !spend && !revenue) {
    return {
      label: "No evidence",
      className: "border-slate-300 bg-slate-50 text-slate-700",
    };
  }

  if (visas > 0) {
    return {
      label: "Visa evidence",
      className: "border-emerald-400 bg-emerald-50 text-emerald-800",
    };
  }

  if (cas > 0 || offers > 0) {
    return {
      label: "Deep funnel",
      className: "border-violet-400 bg-violet-50 text-violet-800",
    };
  }

  if (applications > 0) {
    return {
      label: "Converting",
      className: "border-blue-400 bg-blue-50 text-blue-800",
    };
  }

  return {
    label: "Lead only",
    className: "border-orange-400 bg-[#FFF4EA] text-orange-800",
  };
}

function Stat({ label, value, helper, compact = false }) {
  return (
    <div
      className={`min-w-0 rounded-xl border-2 border-[#E1E8F0] bg-[#FFF8EF] ${
        compact ? "px-2.5 py-2.5" : "px-3 py-3"
      }`}
    >
      <p
        className={`font-black uppercase text-slate-500 ${
          compact
            ? "text-[8px] tracking-[0.12em]"
            : "text-[10px] tracking-[0.18em]"
        }`}
      >
        {label}
      </p>
      <p
        className={`mt-1 font-black text-[#10233F] ${
          compact ? "text-base" : "text-lg"
        }`}
      >
        {value}
      </p>
      {helper ? (
        <p
          className={`mt-1 leading-4 text-slate-500 ${
            compact ? "text-[10px]" : "text-[11px]"
          }`}
        >
          {helper}
        </p>
      ) : null}
    </div>
  );
}

function CompactCampaignRow({ campaign }) {
  const roiMeta = getRoiMeta(campaign);
  const state = getCampaignState(campaign);

  const leads = safeNumber(campaign.leads);
  const applications = safeNumber(campaign.applications);
  const offers = safeNumber(campaign.offers);
  const cas = safeNumber(campaign.cas);
  const visas = safeNumber(campaign.visas);

  const leadToApp = ratio(applications, leads);
  const appToOffer = ratio(offers, applications);
  const casToVisa = ratio(visas, cas);

  return (
    <article className="rounded-[1.25rem] border-2 border-[#C9D7E6] bg-white p-3.5 shadow-[0_8px_22px_rgba(15,35,63,0.05)] transition hover:border-[#F97316]">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full border-2 border-[#F97316] bg-[#FFF4EA] px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.14em] text-[#B84F0E]">
            Campaign
          </span>
          <span
            className={`rounded-full border px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.1em] ${state.className}`}
          >
            {state.label}
          </span>
        </div>

        <h3 className="mt-3 min-w-0 whitespace-normal break-normal [overflow-wrap:anywhere] text-lg font-black leading-snug text-[#10233F]">
          {campaign.name || "Unnamed campaign"}
        </h3>

        <p className="mt-1 min-w-0 whitespace-normal break-normal [overflow-wrap:anywhere] text-xs font-semibold leading-5 text-slate-600">
          {campaign.source && lower(campaign.source) !== "unknown"
            ? campaign.source
            : "Source attribution missing"}
        </p>

        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-slate-500">
          <span>
            <strong className="text-[#10233F]">{integer(leads)}</strong> leads
          </span>
          <span>
            Lead → app{" "}
            <strong className="text-[#10233F]">
              {leadToApp === null ? "—" : percent(leadToApp)}
            </strong>
          </span>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <Stat
          compact
          label="Applications"
          value={integer(applications)}
          helper={leadToApp === null ? "No lead baseline" : `${percent(leadToApp)} of leads`}
        />
        <Stat
          compact
          label="Offers"
          value={integer(offers)}
          helper={appToOffer === null ? "No app baseline" : `${percent(appToOffer)} of apps`}
        />
        <Stat
          compact
          label="CAS"
          value={integer(cas)}
          helper={offers > 0 ? `${percent(ratio(cas, offers) ?? 0)} of offers` : "No offer baseline"}
        />
        <Stat
          compact
          label="Visas"
          value={integer(visas)}
          helper={casToVisa === null ? "No CAS baseline" : `${percent(casToVisa)} of CAS`}
        />
      </div>

      <div className="mt-3 flex flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <span
            className={`inline-flex w-fit rounded-full border px-3 py-1.5 text-[10px] font-black ${roiMeta.className}`}
          >
            {roiMeta.label}
          </span>
          <p className="mt-1 text-[10px] text-slate-500">{roiMeta.helper}</p>
        </div>

        <div className="text-[10px] font-semibold text-slate-500 sm:text-right">
          <p>Spend {hasSpendEvidence(campaign) ? money(campaign.spend) : "not recorded"}</p>
          <p>Revenue {hasRevenueEvidence(campaign) ? money(campaign.revenue) : "not linked"}</p>
        </div>
      </div>
    </article>
  );
}

function CampaignRow({ campaign, compact }) {
  if (compact) {
    return <CompactCampaignRow campaign={campaign} />;
  }

  const roiMeta = getRoiMeta(campaign);
  const state = getCampaignState(campaign);

  const leads = safeNumber(campaign.leads);
  const applications = safeNumber(campaign.applications);
  const offers = safeNumber(campaign.offers);
  const cas = safeNumber(campaign.cas);
  const visas = safeNumber(campaign.visas);

  const leadToApp = ratio(applications, leads);
  const appToOffer = ratio(offers, applications);
  const casToVisa = ratio(visas, cas);

  return (
    <article className="overflow-hidden rounded-[1.3rem] border-2 border-[#C9D7E6] bg-white shadow-[0_8px_22px_rgba(15,35,63,0.05)] transition hover:border-[#F97316]">
      <div className="grid gap-4 p-4 xl:grid-cols-[minmax(18rem,1.15fr)_minmax(22rem,1fr)_minmax(12rem,0.55fr)] xl:items-center">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border-2 border-[#F97316] bg-[#FFF4EA] px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-[#B84F0E]">
              Campaign
            </span>
            <span
              className={`rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em] ${state.className}`}
            >
              {state.label}
            </span>
          </div>

          <h3 className="mt-3 min-w-0 whitespace-normal break-normal [overflow-wrap:anywhere] text-lg font-black leading-snug text-[#10233F]">
            {campaign.name || "Unnamed campaign"}
          </h3>

          <p className="mt-1 min-w-0 whitespace-normal break-normal [overflow-wrap:anywhere] text-sm font-semibold leading-5 text-slate-600">
            {campaign.source && lower(campaign.source) !== "unknown"
              ? campaign.source
              : "Source attribution missing"}
          </p>

          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
            <span>
              <strong className="text-[#10233F]">{integer(leads)}</strong> leads
            </span>
            <span>
              Lead → app{" "}
              <strong className="text-[#10233F]">
                {leadToApp === null ? "—" : percent(leadToApp)}
              </strong>
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <Stat
            label="Applications"
            value={integer(applications)}
            helper={leadToApp === null ? "No lead baseline" : `${percent(leadToApp)} of leads`}
          />
          <Stat
            label="Offers"
            value={integer(offers)}
            helper={appToOffer === null ? "No app baseline" : `${percent(appToOffer)} of apps`}
          />
          <Stat
            label="CAS"
            value={integer(cas)}
            helper={offers > 0 ? `${percent(ratio(cas, offers) ?? 0)} of offers` : "No offer baseline"}
          />
          <Stat
            label="Visas"
            value={integer(visas)}
            helper={casToVisa === null ? "No CAS baseline" : `${percent(casToVisa)} of CAS`}
          />
        </div>

        <div className="flex min-w-0 flex-col gap-2 xl:items-end">
          <span
            className={`w-fit max-w-full rounded-full border px-3 py-1.5 text-xs font-black ${roiMeta.className}`}
          >
            {roiMeta.label}
          </span>
          <p className="text-xs text-slate-500 xl:text-right">{roiMeta.helper}</p>

          <div className="mt-1 flex min-w-0 flex-wrap gap-2 xl:justify-end">
            <span className="rounded-full border-2 border-[#C9D7E6] bg-[#F2F7FF] px-3 py-1.5 text-xs font-black text-[#123865]">
              Spend {hasSpendEvidence(campaign) ? money(campaign.spend) : "not recorded"}
            </span>
            <span className="rounded-full border-2 border-[#C9D7E6] bg-[#F2F7FF] px-3 py-1.5 text-xs font-black text-[#123865]">
              Revenue {hasRevenueEvidence(campaign) ? money(campaign.revenue) : "not linked"}
            </span>
          </div>
        </div>
      </div>
    </article>
  );
}

export default function CampaignPerformancePanel({ marketing = {}, compact = false }) {
  const [query, setQuery] = useState("");
  const [sortBy, setSortBy] = useState("evidence");

  const campaigns = Array.isArray(marketing.campaigns) ? marketing.campaigns : [];

  const filtered = useMemo(() => {
    const search = lower(query);

    const rows = !search
      ? [...campaigns]
      : campaigns.filter((item) =>
          [item?.name, item?.source]
            .map(lower)
            .join(" ")
            .includes(search)
        );

    return rows.sort((a, b) => {
      if (sortBy === "leads") return safeNumber(b.leads) - safeNumber(a.leads);

      if (sortBy === "roi") {
        const aMeasured = hasRoiEvidence(a);
        const bMeasured = hasRoiEvidence(b);

        if (aMeasured !== bMeasured) return bMeasured ? 1 : -1;

        return safeNumber(b.roi, -Infinity) - safeNumber(a.roi, -Infinity);
      }

      if (sortBy === "spend") return safeNumber(b.spend) - safeNumber(a.spend);

      const aEvidence =
        safeNumber(a.visas) * 6 +
        safeNumber(a.cas) * 5 +
        safeNumber(a.offers) * 4 +
        safeNumber(a.applications) * 3 +
        safeNumber(a.leads);

      const bEvidence =
        safeNumber(b.visas) * 6 +
        safeNumber(b.cas) * 5 +
        safeNumber(b.offers) * 4 +
        safeNumber(b.applications) * 3 +
        safeNumber(b.leads);

      return bEvidence - aEvidence;
    });
  }, [campaigns, query, sortBy]);

  const visible = compact ? filtered.slice(0, 3) : filtered;

  const summary = useMemo(() => {
    const measuredRoi = campaigns.filter(hasRoiEvidence);
    const trackedSources = campaigns.filter(
      (campaign) =>
        campaign?.source && lower(campaign.source) !== "unknown"
    ).length;
    const converting = campaigns.filter(
      (campaign) => safeNumber(campaign?.applications) > 0
    ).length;

    return {
      total: campaigns.length,
      measuredRoi: measuredRoi.length,
      trackedSources,
      converting,
    };
  }, [campaigns]);

  return (
    <section className="min-w-0 overflow-hidden rounded-[1.75rem] border-[3px] border-[#C9D7E6] bg-[#FFFDF8] shadow-[0_8px_22px_rgba(15,35,63,0.05)]">
      <div
        className={`border-b-[3px] border-[#F97316] bg-[#123865] text-white ${
          compact ? "px-4 py-4" : "px-5 py-5 sm:px-6"
        }`}
      >
        <div
          className={
            compact
              ? "flex flex-col gap-3"
              : "flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between"
          }
        >
          <div className="min-w-0">
            <p
              className={`font-black uppercase text-orange-300 ${
                compact
                  ? "text-[9px] tracking-[0.18em]"
                  : "text-[11px] tracking-[0.24em]"
              }`}
            >
              Campaign Performance
            </p>

            <h2
              className={`mt-1 font-black text-white ${
                compact ? "text-xl" : "text-xl sm:text-2xl"
              }`}
            >
              Campaign Intelligence
            </h2>

            <p
              className={`mt-1 max-w-3xl font-semibold leading-5 text-white/80 ${
                compact ? "text-xs" : "text-xs sm:text-sm sm:leading-6"
              }`}
            >
              Compare recorded campaign acquisition and downstream student outcomes without turning missing spend or attribution into fake performance.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <span className="rounded-full border-2 border-white/20 bg-white/10 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.06em] text-white">
              {summary.total} campaigns
            </span>
            <span className="rounded-full border-2 border-white/20 bg-white/10 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.06em] text-white">
              {summary.converting} converting
            </span>
            <span className="rounded-full border-2 border-white/20 bg-white/10 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.06em] text-white">
              {summary.measuredRoi} ROI measured
            </span>
          </div>
        </div>
      </div>

      {!compact ? (
        <div className="grid gap-3 border-b-2 border-[#E1E8F0] bg-white p-4 lg:grid-cols-[minmax(0,1fr)_220px_auto]">
          <label className="relative block">
            <span className="sr-only">Search campaigns</span>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search campaign or source..."
              className="min-h-12 w-full rounded-xl border-2 border-[#C9D7E6] bg-[#FFF8EF] px-4 py-3 text-sm font-semibold text-[#10233F] outline-none transition placeholder:text-slate-400 focus:border-[#F97316] focus:ring-4 focus:ring-orange-100"
            />
          </label>

          <label>
            <span className="sr-only">Sort campaigns</span>
            <select
              value={sortBy}
              onChange={(event) => setSortBy(event.target.value)}
              className="min-h-12 w-full rounded-xl border-2 border-[#C9D7E6] bg-[#FFF8EF] px-4 py-3 text-sm font-black text-[#10233F] outline-none transition focus:border-[#F97316] focus:ring-4 focus:ring-orange-100"
            >
              <option value="evidence">Strongest evidence</option>
              <option value="leads">Most leads</option>
              <option value="roi">Highest measured ROI</option>
              <option value="spend">Highest spend</option>
            </select>
          </label>

          <div className="flex items-center justify-end">
            <span className="inline-flex min-h-12 items-center rounded-xl border-2 border-[#234E78] bg-[#F2F7FF] px-4 py-3 text-xs font-black text-[#123865]">
              {filtered.length}/{campaigns.length} visible
            </span>
          </div>
        </div>
      ) : null}

      <div className={compact ? "space-y-2.5 p-3" : "space-y-3 p-4 sm:p-5"}>
        {visible.length ? (
          visible.map((campaign, index) => (
            <CampaignRow
              key={campaignKey(campaign, index)}
              campaign={campaign}
              compact={compact}
            />
          ))
        ) : (
          <div className="rounded-[1.3rem] border border-dashed border-[#b9cbe0] bg-white px-6 py-10 text-center">
            <p className="text-sm font-black text-[#10233F]">
              {campaigns.length
                ? "No campaigns match this search."
                : "No campaign evidence yet."}
            </p>
            <p className="mx-auto mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              {campaigns.length
                ? "Try a different campaign name or source."
                : "Campaign intelligence will activate when real campaign or UTM attribution is connected. ROI stays unmeasured until spend evidence exists."}
            </p>
          </div>
        )}

        {!compact &&
        campaigns.length > 0 &&
        summary.trackedSources < campaigns.length ? (
          <div className="rounded-xl border-2 border-[#F97316] bg-[#FFF4EA] px-4 py-3">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-orange-800">
              Attribution warning
            </p>
            <p className="mt-1 text-sm leading-6 text-orange-900">
              {campaigns.length - summary.trackedSources} campaign
              {campaigns.length - summary.trackedSources === 1 ? "" : "s"} currently lack a confirmed source. Their funnel evidence remains visible, but source-level judgement should wait for attribution.
            </p>
          </div>
        ) : null}
      </div>
    </section>
  );
}
