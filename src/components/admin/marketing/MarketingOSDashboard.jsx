import React, { useMemo, useState } from "react";
import {
  BarChart3,
  BadgeCheck,
  CircleDollarSign,
  Compass,
  Funnel,
  Megaphone,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Target,
} from "lucide-react";

import CampaignPerformancePanel from "./CampaignPerformancePanel";
import LeadSourceIntelligencePanel from "./LeadSourceIntelligencePanel";
import MarketingFunnelPanel from "./MarketingFunnelPanel";
import ContentPlannerPanel from "./ContentPlannerPanel";
import MarketingROIPanel from "./MarketingROIPanel";

function safeArray(value) {
  return Array.isArray(value) ? value.filter(Boolean) : [];
}

function safeString(value, fallback = "") {
  if (value === null || value === undefined) return fallback;
  return String(value);
}

function lower(value) {
  return safeString(value).trim().toLowerCase();
}

function number(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function hasAmount(record = {}) {
  return [
    record.amount,
    record.cost,
    record.spend,
    record.budget,
    record.paid_amount,
    record.invoice_amount,
  ].some((value) => value !== null && value !== undefined && value !== "");
}

function getSource(record = {}) {
  return (
    record.lead_source ||
    record.source ||
    record.marketing_source ||
    record.channel ||
    record.campaign_source ||
    record.referral_source ||
    "Unknown"
  );
}

function getCampaign(record = {}) {
  return (
    record.campaign ||
    record.campaign_name ||
    record.utm_campaign ||
    record.ad_campaign ||
    record.marketing_campaign ||
    "Untracked Campaign"
  );
}

function getCountry(record = {}) {
  return (
    record.destination_country ||
    record.country ||
    record.study_country ||
    record.preferred_country ||
    "Unknown"
  );
}

function getStage(record = {}) {
  const raw = lower(
    record.stage ||
      record.status ||
      record.application_status ||
      record.journey_stage
  );

  if (raw.includes("visa")) return "Visa";
  if (raw.includes("cas")) return "CAS";
  if (raw.includes("offer")) return "Offer";
  if (raw.includes("application") || raw.includes("applied")) {
    return "Application";
  }
  if (raw.includes("planning") || raw.includes("university")) {
    return "Planning";
  }
  return "Lead";
}

function getAmount(record = {}) {
  const candidates = [
    record.amount,
    record.cost,
    record.spend,
    record.budget,
    record.paid_amount,
    record.invoice_amount,
  ];

  const raw = candidates.find(
    (value) => value !== null && value !== undefined && value !== ""
  );

  if (raw === undefined) return 0;

  return number(raw);
}

function money(value) {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    maximumFractionDigits: 0,
  }).format(number(value));
}

function percent(value) {
  return `${Math.round(number(value))}%`;
}

function isKnownSource(name) {
  const value = lower(name);
  return Boolean(
    value &&
      value !== "unknown" &&
      value !== "untracked" &&
      value !== "untracked source"
  );
}

function isKnownCampaign(name) {
  const value = lower(name);
  return Boolean(
    value &&
      value !== "untracked campaign" &&
      value !== "unknown campaign"
  );
}

export function buildMarketingOSData(snapshot = {}) {
  const students = safeArray(
    snapshot.students || snapshot.inquiries || snapshot.leads
  );
  const applications = safeArray(
    snapshot.applications || snapshot.studentApplications
  );
  const offers = safeArray(
    snapshot.offers || snapshot.studentOffers
  );
  const casRecords = safeArray(
    snapshot.casRecords || snapshot.cas
  );
  const visas = safeArray(
    snapshot.visas || snapshot.studentVisas
  );
  const payments = safeArray(
    snapshot.payments || snapshot.studentPayments
  );
  const campaigns = safeArray(
    snapshot.campaigns || snapshot.marketingCampaigns
  );
  const expenses = safeArray(
    snapshot.marketingExpenses ||
      snapshot.expenses ||
      snapshot.adSpend
  );
  const content = safeArray(
    snapshot.content ||
      snapshot.contentItems ||
      snapshot.contentPlan ||
      snapshot.contentRecords
  );

  const sourceMap = new Map();
  const campaignMap = new Map();

  function ensureSource(name) {
    const key = safeString(name || "Unknown");

    if (!sourceMap.has(key)) {
      sourceMap.set(key, {
        name: key,
        leads: 0,
        applications: 0,
        offers: 0,
        cas: 0,
        visas: 0,
        revenue: 0,
        spend: 0,
        hasSpendEvidence: false,
        hasRevenueEvidence: false,
        countries: new Map(),
      });
    }

    return sourceMap.get(key);
  }

  function ensureCampaign(name) {
    const key = safeString(name || "Untracked Campaign");

    if (!campaignMap.has(key)) {
      campaignMap.set(key, {
        name: key,
        source: "Unknown",
        leads: 0,
        applications: 0,
        offers: 0,
        cas: 0,
        visas: 0,
        revenue: 0,
        spend: 0,
        hasSpendEvidence: false,
        hasRevenueEvidence: false,
      });
    }

    return campaignMap.get(key);
  }

  students.forEach((item) => {
    const sourceName = getSource(item);
    const campaignName = getCampaign(item);
    const source = ensureSource(sourceName);
    const campaign = ensureCampaign(campaignName);
    const country = getCountry(item);

    source.leads += 1;
    source.countries.set(
      country,
      (source.countries.get(country) || 0) + 1
    );

    campaign.leads += 1;

    if (
      lower(campaign.source) === "unknown" &&
      isKnownSource(sourceName)
    ) {
      campaign.source = sourceName;
    }
  });

  applications.forEach((item) => {
    ensureSource(getSource(item)).applications += 1;
    ensureCampaign(getCampaign(item)).applications += 1;
  });

  offers.forEach((item) => {
    ensureSource(getSource(item)).offers += 1;
    ensureCampaign(getCampaign(item)).offers += 1;
  });

  casRecords.forEach((item) => {
    ensureSource(getSource(item)).cas += 1;
    ensureCampaign(getCampaign(item)).cas += 1;
  });

  visas.forEach((item) => {
    ensureSource(getSource(item)).visas += 1;
    ensureCampaign(getCampaign(item)).visas += 1;
  });

  payments.forEach((item) => {
    const source = ensureSource(getSource(item));
    const campaign = ensureCampaign(getCampaign(item));

    if (hasAmount(item)) {
      const amount = getAmount(item);
      source.revenue += amount;
      campaign.revenue += amount;
      source.hasRevenueEvidence = true;
      campaign.hasRevenueEvidence = true;
    }
  });

  campaigns.forEach((item) => {
    const campaign = ensureCampaign(getCampaign(item));
    const sourceName = getSource(item);

    if (isKnownSource(sourceName)) {
      campaign.source = sourceName;
    }

    if (hasAmount(item)) {
      campaign.spend += getAmount(item);
      campaign.hasSpendEvidence = true;
    }
  });

  expenses.forEach((item) => {
    const source = ensureSource(getSource(item));
    const campaign = ensureCampaign(getCampaign(item));

    if (hasAmount(item)) {
      const amount = getAmount(item);
      source.spend += amount;
      campaign.spend += amount;
      source.hasSpendEvidence = true;
      campaign.hasSpendEvidence = true;
    }
  });

  const sources = Array.from(sourceMap.values()).map((source) => {
    const applicationRate = source.leads
      ? Math.round((source.applications / source.leads) * 100)
      : null;

    const offerRate = source.applications
      ? Math.round((source.offers / source.applications) * 100)
      : null;

    const visaRate = source.cas
      ? Math.round((source.visas / source.cas) * 100)
      : null;

    const roi = source.hasSpendEvidence
      ? Math.round(
          ((source.revenue - source.spend) / source.spend) * 100
        )
      : null;

    return {
      ...source,
      countries: Array.from(source.countries.entries())
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count),
      applicationRate,
      offerRate,
      visaRate,
      roi,
      // Kept only for backward compatibility with anything else still reading
      // source.score. New panels do not present this as a measured quality KPI.
      score:
        source.visas * 50 +
        source.cas * 30 +
        source.offers * 15 +
        source.applications * 8 +
        source.revenue / 1000 -
        source.spend / 1200,
    };
  });

  sources.sort((a, b) => {
    const depth = (source) =>
      number(source.visas) * 5 +
      number(source.cas) * 4 +
      number(source.offers) * 3 +
      number(source.applications) * 2 +
      number(source.leads);

    return depth(b) - depth(a);
  });

  const campaignRows = Array.from(campaignMap.values()).map(
    (campaign) => {
      const applicationRate = campaign.leads
        ? Math.round(
            (campaign.applications / campaign.leads) * 100
          )
        : null;

      const offerRate = campaign.applications
        ? Math.round(
            (campaign.offers / campaign.applications) * 100
          )
        : null;

      const roi = campaign.hasSpendEvidence
        ? Math.round(
            ((campaign.revenue - campaign.spend) /
              campaign.spend) *
              100
          )
        : null;

      return {
        ...campaign,
        applicationRate,
        offerRate,
        roi,
        score:
          campaign.visas * 50 +
          campaign.cas * 30 +
          campaign.offers * 15 +
          campaign.applications * 8 +
          campaign.revenue / 1000 -
          campaign.spend / 1200,
      };
    }
  );

  campaignRows.sort((a, b) => {
    const depth = (campaign) =>
      number(campaign.visas) * 5 +
      number(campaign.cas) * 4 +
      number(campaign.offers) * 3 +
      number(campaign.applications) * 2 +
      number(campaign.leads);

    return depth(b) - depth(a);
  });

  const stageCounts = [
    {
      key: "lead",
      label: "Leads",
      count: students.length,
    },
    {
      key: "planning",
      label: "Planning",
      count: students.filter(
        (item) => getStage(item) === "Planning"
      ).length,
    },
    {
      key: "application",
      label: "Applications",
      count: applications.length,
    },
    {
      key: "offer",
      label: "Offers",
      count: offers.length,
    },
    {
      key: "cas",
      label: "CAS",
      count: casRecords.length,
    },
    {
      key: "visa",
      label: "Visas",
      count: visas.length,
    },
  ];

  const spendRows = [
    ...campaigns.filter(hasAmount),
    ...expenses.filter(hasAmount),
  ];

  const revenueRows = payments.filter(hasAmount);

  const totalSpend = spendRows.reduce(
    (sum, item) => sum + getAmount(item),
    0
  );

  const totalRevenue = revenueRows.reduce(
    (sum, item) => sum + getAmount(item),
    0
  );

  const spendMeasured = spendRows.length > 0;

  const totalRoi = spendMeasured
    ? Math.round(
        ((totalRevenue - totalSpend) / totalSpend) * 100
      )
    : null;

  const costPerLead =
    spendMeasured && students.length
      ? Math.round(totalSpend / students.length)
      : null;

  const costPerApplication =
    spendMeasured && applications.length
      ? Math.round(totalSpend / applications.length)
      : null;

  const knownSourceLeads = students.filter((item) =>
    isKnownSource(getSource(item))
  ).length;

  const knownCampaignLeads = students.filter((item) =>
    isKnownCampaign(getCampaign(item))
  ).length;

  return {
    students,
    applications,
    offers,
    casRecords,
    visas,
    payments,
    campaigns: campaignRows,
    sources,
    stageCounts,
    content,
    evidence: {
      spend: spendMeasured,
      revenue: revenueRows.length > 0,
      sourceAttribution: knownSourceLeads > 0,
      campaignAttribution: knownCampaignLeads > 0,
    },
    attribution: {
      knownSourceLeads,
      unknownSourceLeads: Math.max(
        0,
        students.length - knownSourceLeads
      ),
      knownCampaignLeads,
      unknownCampaignLeads: Math.max(
        0,
        students.length - knownCampaignLeads
      ),
    },
    totals: {
      leads: students.length,
      applications: applications.length,
      offers: offers.length,
      cas: casRecords.length,
      visas: visas.length,
      spend: totalSpend,
      revenue: totalRevenue,
      roi: totalRoi,
      costPerLead,
      costPerApplication,
    },
  };
}

function MetricCard({
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
      className={`rounded-[1.4rem] border-[3px] p-4 shadow-[0_7px_20px_rgba(15,35,63,0.05)] ${
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
            className={`mt-2 break-words text-2xl font-black ${
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

export default function MarketingOSDashboard({
  snapshot,
  adminProfile,
  onRefresh,
  onCreateContent,
  onDeleteContent,
}) {
  const [activeView, setActiveView] = useState("overview");

  const marketing = useMemo(
    () => buildMarketingOSData(snapshot || {}),
    [snapshot]
  );

  const views = [
    { key: "overview", label: "Overview", icon: BarChart3 },
    { key: "campaigns", label: "Campaigns", icon: Megaphone },
    { key: "sources", label: "Lead Sources", icon: Compass },
    { key: "funnel", label: "Funnel", icon: Funnel },
    { key: "content", label: "Content Plan", icon: Sparkles },
    { key: "roi", label: "ROI", icon: CircleDollarSign },
  ];

  const currentView =
    views.find((view) => view.key === activeView) || views[0];

  const spendMeasured = Boolean(marketing.evidence.spend);
  const revenueMeasured = Boolean(marketing.evidence.revenue);

  const applicationRate = marketing.totals.leads
    ? Math.round(
        (marketing.totals.applications /
          marketing.totals.leads) *
          100
      )
    : null;

  return (
    <div className="min-w-0 space-y-5 rounded-[2.2rem] border-[4px] border-[#123865] bg-[#FFF8EF] p-3 shadow-[0_24px_65px_rgba(18,56,101,0.15)] sm:p-4 lg:p-5">
      <header className="overflow-hidden rounded-[1.75rem] border-[3px] border-[#F97316]">
        <div className="grid xl:grid-cols-[minmax(0,1.25fr)_minmax(18rem,0.75fr)]">
          <div className="bg-[#123865] p-5 text-white sm:p-6">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-2 rounded-full border-2 border-orange-300/30 bg-orange-400/10 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.12em] text-orange-300">
                <Target size={12} />
                Marketing OS
              </span>

              <span className="rounded-full border-2 border-white/15 bg-white/5 px-3 py-1 text-[8px] font-black uppercase tracking-[0.08em] text-white">
                {marketing.attribution.knownSourceLeads}/{marketing.totals.leads} attributed leads
              </span>

              <span className="rounded-full border-2 border-white/15 bg-white/5 px-3 py-1 text-[8px] font-black uppercase tracking-[0.08em] text-white">
                Evidence first
              </span>
            </div>

            <h1 className="mt-3 text-3xl font-black text-white">
              Growth Acquisition Command
            </h1>

            <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-200">
              Lead attribution, campaign movement, funnel conversion, content
              planning and acquisition economics using recorded evidence only.
              Missing spend, source or campaign data stays visibly unmeasured.
            </p>
          </div>

          <div className="bg-[#FF5A0A] p-5 text-white sm:p-6">
            <p className="text-[9px] font-black uppercase tracking-[0.12em]">
              Current Workspace
            </p>

            <p className="mt-2 text-2xl font-black">
              {currentView.label}
            </p>

            <p className="mt-2 text-xs font-semibold leading-5 text-orange-50">
              {adminProfile?.email
                ? `Admin view for ${adminProfile.email}`
                : "Admin marketing workspace"}
            </p>

            <div className="mt-4 flex flex-wrap gap-2">
              <span className="rounded-full border-2 border-white/25 bg-white/10 px-3 py-1 text-[8px] font-black uppercase tracking-[0.08em]">
                {marketing.totals.leads} leads
              </span>

              <span className="rounded-full border-2 border-white/25 bg-white/10 px-3 py-1 text-[8px] font-black uppercase tracking-[0.08em]">
                {marketing.campaigns.length} campaigns
              </span>
            </div>
          </div>
        </div>
      </header>

      <nav className="flex flex-col gap-3 rounded-[1.45rem] border-[3px] border-[#C9D7E6] bg-white p-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 flex-wrap gap-2">
          {views.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              type="button"
              onClick={() => setActiveView(key)}
              aria-pressed={activeView === key}
              className={`inline-flex items-center gap-2 rounded-xl border-2 px-3 py-2.5 text-xs font-black transition ${
                activeView === key
                  ? "border-[#F97316] bg-[#FF5A0A] text-white"
                  : "border-[#C9D7E6] bg-[#FFF8EF] text-[#10233F] hover:border-[#F97316]"
              }`}
            >
              <Icon size={14} />
              {label}
            </button>
          ))}
        </div>

        {onRefresh ? (
          <button
            type="button"
            onClick={onRefresh}
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border-2 border-[#123865] bg-[#123865] px-4 text-xs font-black text-white transition hover:bg-[#102F56]"
          >
            <RefreshCw size={13} />
            Refresh Marketing
          </button>
        ) : null}
      </nav>

      {activeView === "overview" ? (
        <>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              label="Leads"
              value={marketing.totals.leads}
              helper={`${marketing.attribution.knownSourceLeads} with confirmed source attribution.`}
              tone="navy"
              icon={Compass}
              badge="Acquisition"
            />

            <MetricCard
              label="Applications"
              value={marketing.totals.applications}
              helper={
                applicationRate === null
                  ? "No lead baseline yet."
                  : `${percent(applicationRate)} lead → application movement.`
              }
              tone="blue"
              icon={Funnel}
            />

            <MetricCard
              label="Visas"
              value={marketing.totals.visas}
              helper="Recorded downstream visa-stage outcomes."
              tone="green"
              icon={BadgeCheck}
            />

            <MetricCard
              label="ROI"
              value={
                spendMeasured && marketing.totals.roi !== null
                  ? percent(marketing.totals.roi)
                  : "—"
              }
              helper={
                spendMeasured
                  ? `${money(marketing.totals.spend)} spend · ${
                      revenueMeasured
                        ? money(marketing.totals.revenue)
                        : "no linked revenue"
                    }.`
                  : "Not measured until marketing spend is recorded."
              }
              tone={
                !spendMeasured
                  ? "amber"
                  : number(marketing.totals.roi) >= 0
                    ? "green"
                    : "red"
              }
              icon={CircleDollarSign}
              badge={spendMeasured ? "Measured" : "Not measured"}
            />
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            <LeadSourceIntelligencePanel
              marketing={marketing}
              compact
            />
            <CampaignPerformancePanel
              marketing={marketing}
              compact
            />
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            <MarketingFunnelPanel
              marketing={marketing}
              compact
            />
            <MarketingROIPanel
              marketing={marketing}
              compact
            />
          </div>

          <div className="grid gap-3 lg:grid-cols-3">
            <div className="rounded-[1.35rem] border-[3px] border-[#34D399] bg-[#F0FFF8] p-4">
              <div className="flex items-start gap-3">
                <ShieldCheck
                  size={17}
                  className="mt-0.5 shrink-0 text-emerald-700"
                />
                <div>
                  <p className="text-[8px] font-black uppercase tracking-[0.11em] text-slate-500">
                    Attribution Integrity
                  </p>
                  <p className="mt-1 font-black text-[#10233F]">
                    Unknown stays unknown
                  </p>
                  <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">
                    Source and campaign gaps remain visible instead of being
                    silently assigned to a channel.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-[1.35rem] border-[3px] border-[#60A5FA] bg-[#F2F7FF] p-4">
              <div className="flex items-start gap-3">
                <Funnel
                  size={17}
                  className="mt-0.5 shrink-0 text-blue-700"
                />
                <div>
                  <p className="text-[8px] font-black uppercase tracking-[0.11em] text-slate-500">
                    Funnel Evidence
                  </p>
                  <p className="mt-1 font-black text-[#10233F]">
                    Movement is shown directly
                  </p>
                  <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">
                    Panels expose real stage conversion instead of hiding it
                    behind synthetic quality scores.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-[1.35rem] border-[3px] border-[#F59E0B] bg-[#FFF8E8] p-4">
              <div className="flex items-start gap-3">
                <CircleDollarSign
                  size={17}
                  className="mt-0.5 shrink-0 text-amber-700"
                />
                <div>
                  <p className="text-[8px] font-black uppercase tracking-[0.11em] text-slate-500">
                    Economics Boundary
                  </p>
                  <p className="mt-1 font-black text-[#10233F]">
                    Spend is required for ROI
                  </p>
                  <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">
                    Revenue without recorded marketing spend does not create a
                    fake return percentage.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </>
      ) : null}

      {activeView === "campaigns" ? (
        <CampaignPerformancePanel marketing={marketing} />
      ) : null}

      {activeView === "sources" ? (
        <LeadSourceIntelligencePanel marketing={marketing} />
      ) : null}

      {activeView === "funnel" ? (
        <MarketingFunnelPanel marketing={marketing} />
      ) : null}

      {activeView === "content" ? (
        <ContentPlannerPanel
          marketing={marketing}
          records={marketing.content}
          onCreateContent={onCreateContent}
          onDeleteContent={onDeleteContent}
        />
      ) : null}

      {activeView === "roi" ? (
        <MarketingROIPanel marketing={marketing} />
      ) : null}
    </div>
  );
}
