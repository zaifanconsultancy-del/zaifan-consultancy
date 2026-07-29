import React, { useMemo, useState } from "react";
import {
  AlertTriangle,
  BadgeCheck,
  Building2,
  ClipboardCheck,
  Network,
  Search,
  ShieldCheck,
  UserRoundCheck,
  UsersRound,
  X,
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

function money(value) {
  return new Intl.NumberFormat("en-PK", {
    style: "currency",
    currency: "PKR",
    maximumFractionDigits: 0,
  }).format(safeNumber(value));
}

function getAgentName(agent = {}) {
  return (
    agent.name ||
    agent.agent_name ||
    agent.agentName ||
    agent.organization_name ||
    agent.organizationName ||
    "Unnamed agent partner"
  );
}

function getAgentCity(agent = {}) {
  return (
    agent.city ||
    agent.base_city ||
    agent.baseCity ||
    agent.location ||
    "Not recorded"
  );
}

function getTier(agent = {}) {
  return (
    agent.tier ||
    agent.partner_tier ||
    agent.partnerTier ||
    "Not assigned"
  );
}

function getStatus(agent = {}) {
  return (
    agent.status ||
    agent.partner_status ||
    agent.partnerStatus ||
    "Unknown"
  );
}

function getCompliance(agent = {}) {
  const explicit =
    agent.compliance ??
    agent.compliance_score ??
    agent.complianceScore;

  if (explicit === null || explicit === undefined || explicit === "") {
    return null;
  }

  const parsed = Number(explicit);
  return Number.isFinite(parsed) ? parsed : null;
}

function getApplications(agent = {}) {
  return safeNumber(
    agent.applications ??
      agent.application_count ??
      agent.applicationCount
  );
}

function getOffers(agent = {}) {
  return safeNumber(
    agent.offers ??
      agent.offer_count ??
      agent.offerCount
  );
}

function getLeads(agent = {}) {
  return safeNumber(
    agent.leads ??
      agent.lead_count ??
      agent.leadCount ??
      agent.referred_leads ??
      agent.referredLeads
  );
}

function getCounselors(agent = {}) {
  return safeNumber(
    agent.counselors ??
      agent.counselor_count ??
      agent.counselorCount
  );
}

function getPayout(agent = {}) {
  return safeNumber(
    agent.payout ??
      agent.commission ??
      agent.commission_paid ??
      agent.commissionPaid ??
      agent.total_commission ??
      agent.totalCommission
  );
}

function statusTone(status = "") {
  const value = lower(status);

  if (
    value.includes("active") ||
    value.includes("approved") ||
    value.includes("verified")
  ) {
    return "border-[#34D399] bg-[#F0FFF8] text-emerald-700";
  }

  if (
    value.includes("review") ||
    value.includes("pending") ||
    value.includes("paused") ||
    value.includes("hold")
  ) {
    return "border-[#F59E0B] bg-[#FFF8E8] text-amber-800";
  }

  if (
    value.includes("blocked") ||
    value.includes("rejected") ||
    value.includes("suspended")
  ) {
    return "border-[#FB7185] bg-[#FFF4F4] text-red-700";
  }

  return "border-[#C9D7E6] bg-[#FFF8EF] text-slate-600";
}

function complianceTone(value) {
  if (value === null) {
    return "border-[#60A5FA] bg-[#F2F7FF] text-blue-700";
  }

  if (value >= 90) {
    return "border-[#34D399] bg-[#F0FFF8] text-emerald-700";
  }

  if (value >= 75) {
    return "border-[#F59E0B] bg-[#FFF8E8] text-amber-800";
  }

  return "border-[#FB7185] bg-[#FFF4F4] text-red-700";
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

function AgentRow({ agent }) {
  const compliance = getCompliance(agent);
  const leads = getLeads(agent);
  const applications = getApplications(agent);
  const offers = getOffers(agent);

  const applicationRate =
    leads > 0 ? Math.round((applications / leads) * 100) : null;

  const offerRate =
    applications > 0
      ? Math.round((offers / applications) * 100)
      : null;

  return (
    <article className="rounded-[1.3rem] border-2 border-[#C9D7E6] bg-white p-4 shadow-[0_6px_18px_rgba(15,35,63,0.04)] transition hover:border-[#F97316]">
      <div className="grid min-w-0 gap-4 xl:grid-cols-[minmax(18rem,1.45fr)_8rem_8rem_10rem_10rem_10rem] xl:items-center">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="min-w-0 [overflow-wrap:anywhere] font-black text-[#10233F]">
              {getAgentName(agent)}
            </p>

            <span
              className={`rounded-full border-2 px-2.5 py-1 text-[8px] font-black uppercase tracking-[0.07em] ${statusTone(
                getStatus(agent)
              )}`}
            >
              {getStatus(agent)}
            </span>
          </div>

          <p className="mt-1 text-[11px] font-semibold leading-4 text-slate-500">
            {[getAgentCity(agent), `Tier: ${getTier(agent)}`]
              .filter(Boolean)
              .join(" · ")}
          </p>
        </div>

        <div className="rounded-xl border border-[#E1E8F0] bg-[#FFF8EF] px-3 py-2.5">
          <p className="text-[7px] font-black uppercase tracking-[0.09em] text-slate-500">
            Counselors
          </p>
          <p className="mt-1 text-xs font-black text-[#10233F]">
            {getCounselors(agent)}
          </p>
        </div>

        <div className="rounded-xl border border-[#E1E8F0] bg-[#FFF8EF] px-3 py-2.5">
          <p className="text-[7px] font-black uppercase tracking-[0.09em] text-slate-500">
            Leads
          </p>
          <p className="mt-1 text-xs font-black text-[#10233F]">
            {leads}
          </p>
        </div>

        <div className="rounded-xl border border-[#E1E8F0] bg-[#FFF8EF] px-3 py-2.5">
          <p className="text-[7px] font-black uppercase tracking-[0.09em] text-slate-500">
            Lead → App
          </p>
          <p className="mt-1 text-xs font-black text-[#10233F]">
            {applicationRate === null
              ? "Not measured"
              : percent(applicationRate)}
          </p>
        </div>

        <div className="rounded-xl border border-[#E1E8F0] bg-[#FFF8EF] px-3 py-2.5">
          <p className="text-[7px] font-black uppercase tracking-[0.09em] text-slate-500">
            App → Offer
          </p>
          <p className="mt-1 text-xs font-black text-[#10233F]">
            {offerRate === null ? "Not measured" : percent(offerRate)}
          </p>
        </div>

        <div>
          <p className="text-[7px] font-black uppercase tracking-[0.09em] text-slate-500">
            Compliance
          </p>
          <span
            className={`mt-1 inline-flex rounded-full border-2 px-2.5 py-1 text-[8px] font-black uppercase tracking-[0.07em] ${complianceTone(
              compliance
            )}`}
          >
            {compliance === null
              ? "Not measured"
              : percent(compliance)}
          </span>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <span className="rounded-full border-2 border-[#C9D7E6] bg-[#F7FAFC] px-2.5 py-1 text-[8px] font-black uppercase tracking-[0.06em] text-slate-600">
          {applications} applications
        </span>

        <span className="rounded-full border-2 border-[#C9D7E6] bg-[#F7FAFC] px-2.5 py-1 text-[8px] font-black uppercase tracking-[0.06em] text-slate-600">
          {offers} offers
        </span>

        <span className="rounded-full border-2 border-[#C9D7E6] bg-[#F7FAFC] px-2.5 py-1 text-[8px] font-black uppercase tracking-[0.06em] text-slate-600">
          Payout {getPayout(agent) > 0 ? money(getPayout(agent)) : "not linked"}
        </span>
      </div>
    </article>
  );
}

export default function AgentNetworkCenter({
  compact = false,
  records = [],
  partners = [],
}) {
  const [tier, setTier] = useState("All");
  const [query, setQuery] = useState("");

  const agents = useMemo(() => {
    const direct = safeArray(records);

    if (direct.length) return direct;

    return safeArray(partners).filter((partner) => {
      const type = lower(
        partner.type ||
          partner.partner_type ||
          partner.partnerType ||
          partner.category
      );

      return (
        type.includes("agent") ||
        type.includes("agency") ||
        type.includes("recruit")
      );
    });
  }, [records, partners]);

  const tiers = useMemo(
    () => [
      "All",
      ...new Set(
        agents
          .map((agent) => String(getTier(agent)).trim())
          .filter(
            (value) =>
              value && lower(value) !== "not assigned"
          )
      ),
    ],
    [agents]
  );

  const visibleAgents = useMemo(() => {
    const search = lower(query);

    return agents.filter((agent) => {
      if (tier !== "All" && getTier(agent) !== tier) {
        return false;
      }

      if (!search) return true;

      return [
        getAgentName(agent),
        getAgentCity(agent),
        getTier(agent),
        getStatus(agent),
      ]
        .map(lower)
        .join(" ")
        .includes(search);
    });
  }, [agents, tier, query]);

  const totals = useMemo(() => {
    const leads = agents.reduce(
      (sum, agent) => sum + getLeads(agent),
      0
    );

    const applications = agents.reduce(
      (sum, agent) => sum + getApplications(agent),
      0
    );

    const offers = agents.reduce(
      (sum, agent) => sum + getOffers(agent),
      0
    );

    const complianceValues = agents
      .map(getCompliance)
      .filter((value) => value !== null);

    return {
      leads,
      applications,
      offers,
      compliance: complianceValues.length
        ? Math.round(
            complianceValues.reduce(
              (sum, value) => sum + value,
              0
            ) / complianceValues.length
          )
        : null,
    };
  }, [agents]);

  const displayed = compact
    ? visibleAgents.slice(0, 4)
    : visibleAgents;

  const filtersActive =
    Boolean(query.trim()) || tier !== "All";

  function clearFilters() {
    setQuery("");
    setTier("All");
  }

  return (
    <section className="min-w-0 overflow-hidden rounded-[1.9rem] border-[3px] border-[#C9D7E6] bg-[#FFFDF8] shadow-[0_14px_38px_rgba(15,35,63,0.07)]">
      <div className="grid border-b-[3px] border-[#F97316] xl:grid-cols-[minmax(0,1.2fr)_minmax(16rem,0.8fr)]">
        <div className="bg-[#123865] p-5 text-white sm:p-6">
          <div className="inline-flex items-center gap-2 rounded-full border-2 border-orange-300/30 bg-orange-400/10 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.12em] text-orange-300">
            <Network size={12} />
            Agent Network
          </div>

          <h2 className="mt-3 text-2xl font-black text-white sm:text-3xl">
            Recruitment Partner Network
          </h2>

          <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-200">
            High-level relationship view of recruitment agencies and agent
            partners. This is the Partner OS network layer—not the separate
            future Agent Operations system.
          </p>
        </div>

        <div className="bg-[#FF5A0A] p-5 text-white sm:p-6">
          <p className="text-[9px] font-black uppercase tracking-[0.12em]">
            Agent Partners
          </p>

          <p className="mt-2 text-3xl font-black">
            {agents.length}
          </p>

          <p className="mt-2 text-xs font-semibold leading-5 text-orange-50">
            {totals.leads} leads · {totals.applications} applications ·{" "}
            {totals.offers} offers.
          </p>

          <span className="mt-3 inline-flex rounded-full border-2 border-white/25 bg-white/10 px-3 py-1 text-[8px] font-black uppercase tracking-[0.08em]">
            Relationship evidence
          </span>
        </div>
      </div>

      <div className="space-y-5 p-4 sm:p-5">
        {!compact ? (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              label="Agent Leads"
              value={totals.leads}
              helper="Leads explicitly attributed to agent partner records."
              tone="navy"
              icon={UsersRound}
            />

            <MetricCard
              label="Applications"
              value={totals.applications}
              helper="Applications explicitly attributed to the agent network."
              tone="blue"
              icon={ClipboardCheck}
            />

            <MetricCard
              label="Offers"
              value={totals.offers}
              helper="Offer evidence linked to agent partner records."
              tone="green"
              icon={BadgeCheck}
            />

            <MetricCard
              label="Compliance Avg"
              value={
                totals.compliance === null
                  ? "—"
                  : percent(totals.compliance)
              }
              helper={
                totals.compliance === null
                  ? "Not measured until real compliance evidence exists."
                  : "Average across agent records with explicit compliance scores."
              }
              tone={
                totals.compliance === null
                  ? "blue"
                  : totals.compliance >= 90
                    ? "green"
                    : totals.compliance >= 75
                      ? "amber"
                      : "red"
              }
              icon={ShieldCheck}
              badge={
                totals.compliance === null
                  ? "Not measured"
                  : "Measured"
              }
            />
          </div>
        ) : null}

        {!compact ? (
          <div className="grid gap-3 lg:grid-cols-[1fr_auto_auto]">
            <label className="relative block">
              <Search
                size={16}
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search agent partner, city, tier..."
                className="min-h-11 w-full rounded-xl border-2 border-[#C9D7E6] bg-white pl-11 pr-4 text-sm font-semibold text-[#10233F] outline-none placeholder:text-slate-400 focus:border-[#F97316]"
              />
            </label>

            <select
              value={tier}
              onChange={(event) => setTier(event.target.value)}
              className="min-h-11 rounded-xl border-2 border-[#C9D7E6] bg-white px-3 text-sm font-black text-[#10233F] outline-none focus:border-[#F97316]"
            >
              {tiers.map((item) => (
                <option key={item} value={item}>
                  {item === "All" ? "All Tiers" : item}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={clearFilters}
              disabled={!filtersActive}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border-2 border-[#C9D7E6] bg-[#FFF8EF] px-3 text-xs font-black text-slate-700 disabled:opacity-40"
            >
              <X size={13} />
              Clear
            </button>
          </div>
        ) : null}

        <div className="space-y-2.5">
          {displayed.length ? (
            displayed.map((agent, index) => (
              <AgentRow
                key={
                  agent.id ||
                  `${getAgentName(agent)}-${index}`
                }
                agent={agent}
              />
            ))
          ) : (
            <div className="rounded-[1.5rem] border-[3px] border-dashed border-[#C9D7E6] bg-white p-8 text-center">
              <Building2
                size={24}
                className="mx-auto text-orange-700"
              />

              <p className="mt-3 font-black text-[#10233F]">
                {agents.length
                  ? "No agent partners match these filters."
                  : "No real agent partners yet."}
              </p>

              <p className="mx-auto mt-2 max-w-xl text-sm font-semibold leading-6 text-slate-600">
                {agents.length
                  ? "Clear or change the agent-network filters."
                  : "Add genuine recruitment partner records before Zaifan reports agent leads, compliance, payouts or performance."}
              </p>
            </div>
          )}
        </div>

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
                    Relationship Boundary
                  </p>
                  <p className="mt-1 font-black text-[#10233F]">
                    Network management, not agent portal
                  </p>
                  <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">
                    This view manages partner organizations at relationship level.
                    Individual agent operations belong in the separate Agent OS.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-[1.35rem] border-[3px] border-[#60A5FA] bg-[#F2F7FF] p-4">
              <div className="flex items-start gap-3">
                <UserRoundCheck
                  size={17}
                  className="mt-0.5 shrink-0 text-blue-700"
                />
                <div>
                  <p className="text-[8px] font-black uppercase tracking-[0.11em] text-slate-500">
                    Compliance Integrity
                  </p>
                  <p className="mt-1 font-black text-[#10233F]">
                    Missing score stays unmeasured
                  </p>
                  <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">
                    Zaifan does not assign placeholder compliance percentages to
                    agents that have not been audited.
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
                    Payout Boundary
                  </p>
                  <p className="mt-1 font-black text-[#10233F]">
                    Agent exists ≠ commission payable
                  </p>
                  <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">
                    Payout amounts appear only when real commission evidence is
                    linked to that partner record.
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
