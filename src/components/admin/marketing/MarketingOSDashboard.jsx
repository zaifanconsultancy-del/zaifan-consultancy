import React, { useMemo, useState } from "react";
import CampaignPerformancePanel from "./CampaignPerformancePanel";
import LeadSourceIntelligencePanel from "./LeadSourceIntelligencePanel";
import MarketingFunnelPanel from "./MarketingFunnelPanel";
import ContentPlannerPanel from "./ContentPlannerPanel";
import MarketingROIPanel from "./MarketingROIPanel";

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

function safeString(value, fallback = "") {
  if (value === null || value === undefined) return fallback;
  return String(value);
}

function lower(value) {
  return safeString(value).toLowerCase();
}

function number(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
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
  const raw = lower(record.stage || record.status || record.application_status || record.journey_stage);
  if (raw.includes("visa")) return "Visa";
  if (raw.includes("cas")) return "CAS";
  if (raw.includes("offer")) return "Offer";
  if (raw.includes("application") || raw.includes("applied")) return "Application";
  if (raw.includes("planning") || raw.includes("university")) return "Planning";
  return "Lead";
}

function getAmount(record = {}) {
  return number(record.amount || record.cost || record.spend || record.budget || record.paid_amount || record.invoice_amount || 0);
}

function money(value) {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    maximumFractionDigits: 0,
  }).format(number(value));
}

export function buildMarketingOSData(snapshot = {}) {
  const students = safeArray(snapshot.students || snapshot.inquiries || snapshot.leads);
  const applications = safeArray(snapshot.applications || snapshot.studentApplications);
  const offers = safeArray(snapshot.offers || snapshot.studentOffers);
  const casRecords = safeArray(snapshot.casRecords || snapshot.cas);
  const visas = safeArray(snapshot.visas || snapshot.studentVisas);
  const payments = safeArray(snapshot.payments || snapshot.studentPayments);
  const campaigns = safeArray(snapshot.campaigns || snapshot.marketingCampaigns);
  const expenses = safeArray(snapshot.marketingExpenses || snapshot.expenses || snapshot.adSpend);

  const sourceMap = new Map();
  const campaignMap = new Map();

  const ensureSource = (name) => {
    const key = name || "Unknown";
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
        countries: new Map(),
      });
    }
    return sourceMap.get(key);
  };

  const ensureCampaign = (name) => {
    const key = name || "Untracked Campaign";
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
      });
    }
    return campaignMap.get(key);
  };

  students.forEach((item) => {
    const source = ensureSource(getSource(item));
    const campaign = ensureCampaign(getCampaign(item));
    const country = getCountry(item);

    source.leads += 1;
    source.countries.set(country, (source.countries.get(country) || 0) + 1);

    campaign.leads += 1;
    campaign.source = getSource(item);
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
    ensureSource(getSource(item)).revenue += getAmount(item);
    ensureCampaign(getCampaign(item)).revenue += getAmount(item);
  });

  campaigns.forEach((item) => {
    const campaign = ensureCampaign(getCampaign(item));
    campaign.source = getSource(item);
    campaign.spend += getAmount(item);
  });

  expenses.forEach((item) => {
    ensureSource(getSource(item)).spend += getAmount(item);
    ensureCampaign(getCampaign(item)).spend += getAmount(item);
  });

  const sources = Array.from(sourceMap.values())
    .map((source) => ({
      ...source,
      countries: Array.from(source.countries.entries()).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count),
      applicationRate: source.leads ? Math.round((source.applications / source.leads) * 100) : 0,
      offerRate: source.applications ? Math.round((source.offers / source.applications) * 100) : 0,
      visaRate: source.cas ? Math.round((source.visas / source.cas) * 100) : 0,
      roi: source.spend ? Math.round(((source.revenue - source.spend) / source.spend) * 100) : source.revenue > 0 ? 100 : 0,
      score: source.visas * 50 + source.cas * 30 + source.offers * 15 + source.applications * 8 + source.revenue / 1000 - source.spend / 1200,
    }))
    .sort((a, b) => b.score - a.score);

  const campaignRows = Array.from(campaignMap.values())
    .map((campaign) => ({
      ...campaign,
      applicationRate: campaign.leads ? Math.round((campaign.applications / campaign.leads) * 100) : 0,
      offerRate: campaign.applications ? Math.round((campaign.offers / campaign.applications) * 100) : 0,
      roi: campaign.spend ? Math.round(((campaign.revenue - campaign.spend) / campaign.spend) * 100) : campaign.revenue > 0 ? 100 : 0,
      score: campaign.visas * 50 + campaign.cas * 30 + campaign.offers * 15 + campaign.applications * 8 + campaign.revenue / 1000 - campaign.spend / 1200,
    }))
    .sort((a, b) => b.score - a.score);

  const stageCounts = [
    { key: "lead", label: "Leads", count: students.length },
    { key: "planning", label: "Planning", count: students.filter((item) => getStage(item) === "Planning").length },
    { key: "application", label: "Applications", count: applications.length },
    { key: "offer", label: "Offers", count: offers.length },
    { key: "cas", label: "CAS", count: casRecords.length },
    { key: "visa", label: "Visas", count: visas.length },
  ];

  const totalSpend = expenses.reduce((sum, item) => sum + getAmount(item), 0) + campaigns.reduce((sum, item) => sum + getAmount(item), 0);
  const totalRevenue = payments.reduce((sum, item) => sum + getAmount(item), 0);

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
    totals: {
      leads: students.length,
      applications: applications.length,
      offers: offers.length,
      cas: casRecords.length,
      visas: visas.length,
      spend: totalSpend,
      revenue: totalRevenue,
      roi: totalSpend ? Math.round(((totalRevenue - totalSpend) / totalSpend) * 100) : totalRevenue > 0 ? 100 : 0,
      costPerLead: students.length ? Math.round(totalSpend / students.length) : 0,
      costPerApplication: applications.length ? Math.round(totalSpend / applications.length) : 0,
    },
  };
}

function MetricCard({ label, value, helper, tone = "cyan" }) {
  const tones = {
    cyan: "border-cyan-400/20 bg-cyan-500/10",
    emerald: "border-emerald-400/20 bg-emerald-500/10",
    amber: "border-amber-400/20 bg-amber-500/10",
    violet: "border-violet-400/20 bg-violet-500/10",
    rose: "border-rose-400/20 bg-rose-500/10",
  };

  return (
    <div className={`rounded-3xl border p-5 ${tones[tone] || tones.cyan}`}>
      <p className="text-xs font-black uppercase tracking-[0.24em] text-slate-400">{label}</p>
      <p className="mt-3 text-3xl font-black text-white">{value}</p>
      {helper ? <p className="mt-2 text-sm text-slate-400">{helper}</p> : null}
    </div>
  );
}

export default function MarketingOSDashboard({ snapshot, adminProfile, onRefresh }) {
  const [activeView, setActiveView] = useState("overview");
  const marketing = useMemo(() => buildMarketingOSData(snapshot || {}), [snapshot]);

  const views = [
    { key: "overview", label: "Overview" },
    { key: "campaigns", label: "Campaigns" },
    { key: "sources", label: "Lead Sources" },
    { key: "funnel", label: "Funnel" },
    { key: "content", label: "Content Plan" },
    { key: "roi", label: "ROI" },
  ];

  return (
    <div className="space-y-6 rounded-[2rem] border border-white/10 bg-slate-950/60 p-5 text-white shadow-2xl shadow-slate-950/30">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.3em] text-cyan-300">Marketing OS</p>
          <h1 className="mt-3 text-3xl font-black tracking-tight">Growth Acquisition Command</h1>
          <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-400">
            Lead sources, campaign quality, marketing funnel conversion, ROI, content planning, and acquisition intelligence for Zaifan growth.
          </p>
          {adminProfile?.email ? <p className="mt-2 text-xs text-slate-500">Admin view for {adminProfile.email}</p> : null}
        </div>

        <div className="flex flex-wrap gap-2">
          {views.map((view) => (
            <button
              key={view.key}
              type="button"
              onClick={() => setActiveView(view.key)}
              className={`rounded-2xl px-4 py-2 text-xs font-black ${
                activeView === view.key
                  ? "bg-white text-slate-950"
                  : "border border-white/10 bg-white/[0.04] text-slate-300 hover:bg-white/[0.08]"
              }`}
            >
              {view.label}
            </button>
          ))}
          {onRefresh ? (
            <button type="button" onClick={onRefresh} className="rounded-2xl border border-cyan-400/25 bg-cyan-400/10 px-4 py-2 text-xs font-black text-cyan-100 hover:bg-cyan-400/20">
              Refresh
            </button>
          ) : null}
        </div>
      </div>

      {activeView === "overview" ? (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
            <MetricCard label="Leads" value={marketing.totals.leads} helper="total inquiries" tone="cyan" />
            <MetricCard label="Applications" value={marketing.totals.applications} helper={`${marketing.totals.costPerApplication ? money(marketing.totals.costPerApplication) : "—"} CPA`} tone="violet" />
            <MetricCard label="Offers" value={marketing.totals.offers} helper="generated" tone="amber" />
            <MetricCard label="Visas" value={marketing.totals.visas} helper="successful" tone="emerald" />
            <MetricCard label="Spend" value={money(marketing.totals.spend)} helper={`${money(marketing.totals.costPerLead)} CPL`} tone="rose" />
            <MetricCard label="ROI" value={`${marketing.totals.roi}%`} helper={money(marketing.totals.revenue)} tone="emerald" />
          </div>

          <div className="grid gap-4 xl:grid-cols-[1fr_1fr]">
            <LeadSourceIntelligencePanel marketing={marketing} compact />
            <CampaignPerformancePanel marketing={marketing} compact />
          </div>

          <div className="grid gap-4 xl:grid-cols-[1fr_1fr]">
            <MarketingFunnelPanel marketing={marketing} compact />
            <MarketingROIPanel marketing={marketing} compact />
          </div>
        </>
      ) : null}

      {activeView === "campaigns" ? <CampaignPerformancePanel marketing={marketing} /> : null}
      {activeView === "sources" ? <LeadSourceIntelligencePanel marketing={marketing} /> : null}
      {activeView === "funnel" ? <MarketingFunnelPanel marketing={marketing} /> : null}
      {activeView === "content" ? <ContentPlannerPanel marketing={marketing} /> : null}
      {activeView === "roi" ? <MarketingROIPanel marketing={marketing} /> : null}
    </div>
  );
}
