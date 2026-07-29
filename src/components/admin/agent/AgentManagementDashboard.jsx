import React, { useMemo, useState } from "react";
import {
  AlertTriangle,
  BadgeCheck,
  Globe2,
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
  return String(value || "").trim().toLowerCase();
}

function rateLabel(value) {
  if (value === null || value === undefined || !Number.isFinite(Number(value))) {
    return "Not measured";
  }
  return `${Math.round(Number(value))}%`;
}

function identityTone(agent = {}) {
  if (agent.name === "Direct / Unassigned") {
    return "border-[#F59E0B] bg-[#FFF8E8] text-amber-800";
  }

  if (agent.identityConfirmed) {
    return "border-[#34D399] bg-[#F0FFF8] text-emerald-700";
  }

  return "border-[#60A5FA] bg-[#F2F7FF] text-blue-700";
}

function accountTone(status = "") {
  const value = lower(status);

  if (
    value.includes("active") ||
    value.includes("verified") ||
    value.includes("approved")
  ) {
    return "border-[#34D399] bg-[#F0FFF8] text-emerald-700";
  }

  if (
    value.includes("pending") ||
    value.includes("review") ||
    value.includes("invited")
  ) {
    return "border-[#F59E0B] bg-[#FFF8E8] text-amber-800";
  }

  if (
    value.includes("blocked") ||
    value.includes("suspended") ||
    value.includes("disabled")
  ) {
    return "border-[#FB7185] bg-[#FFF4F4] text-red-700";
  }

  return "border-[#C9D7E6] bg-[#FFF8EF] text-slate-600";
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

function MiniMetric({ label, value }) {
  return (
    <div className="rounded-xl border-2 border-[#E1E8F0] bg-[#FFF8EF] p-3 text-center">
      <p className="text-base font-black text-[#10233F]">{value}</p>
      <p className="mt-1 text-[8px] font-black uppercase tracking-[0.07em] text-slate-500">
        {label}
      </p>
    </div>
  );
}

function AgentCard({ agent }) {
  const countries = safeArray(agent.countries);
  const unassigned = agent.name === "Direct / Unassigned";
  const confirmed = Boolean(agent.identityConfirmed);

  return (
    <article className="rounded-[1.4rem] border-[3px] border-[#C9D7E6] bg-white p-4 shadow-[0_7px_20px_rgba(15,35,63,0.045)] transition hover:border-[#F97316]">
      <div className="grid min-w-0 gap-4 xl:grid-cols-[minmax(19rem,1.35fr)_minmax(18rem,0.95fr)_minmax(12rem,0.55fr)] xl:items-center">
        <div className="min-w-0">
          <div className="flex min-w-0 items-center gap-3">
            <div
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border-2 ${
                unassigned
                  ? "border-[#F59E0B] bg-[#FFF8E8] text-amber-800"
                  : confirmed
                    ? "border-[#34D399] bg-[#F0FFF8] text-emerald-700"
                    : "border-[#60A5FA] bg-[#F2F7FF] text-blue-700"
              }`}
            >
              {unassigned ? (
                <AlertTriangle size={18} />
              ) : (
                <UserRoundCheck size={18} />
              )}
            </div>

            <div className="min-w-0">
              <p className="min-w-0 [overflow-wrap:anywhere] text-lg font-black leading-snug text-[#10233F]">
                {agent.name}
              </p>

              <p className="mt-1 text-xs font-semibold text-slate-500">
                {agent.organization || "No organization recorded"}
              </p>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            <span
              className={`rounded-full border-2 px-2.5 py-1 text-[8px] font-black uppercase tracking-[0.07em] ${identityTone(
                agent
              )}`}
            >
              {unassigned
                ? "Unassigned source"
                : confirmed
                  ? "Confirmed agent"
                  : "Observed source"}
            </span>

            {agent.accountStatus ? (
              <span
                className={`rounded-full border-2 px-2.5 py-1 text-[8px] font-black uppercase tracking-[0.07em] ${accountTone(
                  agent.accountStatus
                )}`}
              >
                {agent.accountStatus}
              </span>
            ) : null}

            <span className="rounded-full border-2 border-[#C9D7E6] bg-[#FFF8EF] px-2.5 py-1 text-[8px] font-black uppercase tracking-[0.07em] text-slate-600">
              {countries.length} countr{countries.length === 1 ? "y" : "ies"}
            </span>
          </div>

          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <div className="rounded-xl border border-[#E1E8F0] bg-[#F7FAFC] px-3 py-2.5">
              <p className="text-[7px] font-black uppercase tracking-[0.09em] text-slate-500">
                Email
              </p>
              <p className="mt-1 truncate text-xs font-black text-[#10233F]">
                {agent.email || "Not recorded"}
              </p>
            </div>

            <div className="rounded-xl border border-[#E1E8F0] bg-[#F7FAFC] px-3 py-2.5">
              <p className="text-[7px] font-black uppercase tracking-[0.09em] text-slate-500">
                Phone
              </p>
              <p className="mt-1 truncate text-xs font-black text-[#10233F]">
                {agent.phone || "Not recorded"}
              </p>
            </div>
          </div>

          {countries.length ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {countries.slice(0, 5).map((country) => (
                <span
                  key={country.name}
                  className="rounded-full border-2 border-[#60A5FA] bg-[#F2F7FF] px-2.5 py-1 text-[8px] font-black uppercase tracking-[0.06em] text-blue-700"
                >
                  {country.name} · {safeNumber(country.count)}
                </span>
              ))}
            </div>
          ) : null}
        </div>

        <div className="grid grid-cols-3 gap-2">
          <MiniMetric
            label="Lead → App"
            value={rateLabel(agent.conversionRate)}
          />
          <MiniMetric
            label="App → Offer"
            value={rateLabel(agent.offerRate)}
          />
          <MiniMetric
            label="CAS → Visa"
            value={rateLabel(agent.visaRate)}
          />
        </div>

        <div className="grid gap-2">
          <MiniMetric
            label="Leads"
            value={safeNumber(agent.leads)}
          />
          <MiniMetric
            label="Applications"
            value={safeNumber(agent.applications)}
          />
          <MiniMetric
            label="Visas"
            value={safeNumber(agent.visas)}
          />
        </div>
      </div>

      <div className="mt-4 rounded-xl border-2 border-[#E1E8F0] bg-[#FFF8EF] p-3">
        <p className="text-[8px] font-black uppercase tracking-[0.1em] text-slate-500">
          Management interpretation
        </p>

        <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">
          {unassigned
            ? "This is attribution debt, not an agent account. Reassign the student source before using it for agent performance or commission decisions."
            : !confirmed
              ? "This source name appears in operational records but is not backed by a confirmed agent account/profile yet."
              : safeNumber(agent.leads) === 0
                ? "The agent identity is confirmed but has no recorded lead activity yet."
                : safeNumber(agent.applications) === 0
                  ? "Lead activity exists without recorded application movement. Review follow-up ownership and lead quality."
                  : safeNumber(agent.offers) === 0
                    ? "Applications exist without recorded offers. Review case quality and destination fit."
                    : safeNumber(agent.visas) > 0
                      ? "The agent has recorded late-stage outcomes. Continue monitoring funnel quality rather than volume alone."
                      : "The agent has active funnel evidence but no recorded visa-stage outcome yet."}
        </p>
      </div>
    </article>
  );
}

export default function AgentManagementDashboard({
  agentOS = {},
  compact = false,
}) {
  const [query, setQuery] = useState("");
  const [identityFilter, setIdentityFilter] = useState("all");

  const agents = safeArray(agentOS.agents);

  const confirmedAgents = agents.filter(
    (agent) =>
      agent.name !== "Direct / Unassigned" &&
      agent.identityConfirmed
  );

  const observedSources = agents.filter(
    (agent) =>
      agent.name !== "Direct / Unassigned" &&
      !agent.identityConfirmed
  );

  const unassignedLeads = agents
    .filter((agent) => agent.name === "Direct / Unassigned")
    .reduce((sum, agent) => sum + safeNumber(agent.leads), 0);

  const activeConfirmedAgents = confirmedAgents.filter(
    (agent) =>
      safeNumber(agent.leads) > 0 ||
      safeNumber(agent.applications) > 0 ||
      safeNumber(agent.offers) > 0 ||
      safeNumber(agent.cas) > 0 ||
      safeNumber(agent.visas) > 0
  ).length;

  const filtered = useMemo(() => {
    const search = lower(query);

    return agents.filter((agent) => {
      const unassigned = agent.name === "Direct / Unassigned";
      const confirmed = Boolean(agent.identityConfirmed);

      if (identityFilter === "confirmed" && !confirmed) return false;

      if (
        identityFilter === "observed" &&
        (confirmed || unassigned)
      ) {
        return false;
      }

      if (identityFilter === "unassigned" && !unassigned) {
        return false;
      }

      if (!search) return true;

      return [
        agent.name,
        agent.organization,
        agent.email,
        agent.phone,
        agent.accountStatus,
        ...safeArray(agent.countries).map((country) => country.name),
      ]
        .map(lower)
        .join(" ")
        .includes(search);
    });
  }, [agents, query, identityFilter]);

  const visible = compact ? filtered.slice(0, 4) : filtered;

  const filtersActive =
    Boolean(query.trim()) || identityFilter !== "all";

  function clearFilters() {
    setQuery("");
    setIdentityFilter("all");
  }

  return (
    <section className="min-w-0 overflow-hidden rounded-[1.9rem] border-[3px] border-[#C9D7E6] bg-[#FFFDF8] shadow-[0_14px_38px_rgba(15,35,63,0.07)]">
      <div className="grid border-b-[3px] border-[#F97316] xl:grid-cols-[minmax(0,1.2fr)_minmax(18rem,0.8fr)]">
        <div className="bg-[#123865] p-5 text-white sm:p-6">
          <div className="inline-flex items-center gap-2 rounded-full border-2 border-orange-300/30 bg-orange-400/10 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.12em] text-orange-300">
            <UserRoundCheck size={12} />
            Agent Management
          </div>

          <h2 className="mt-3 text-2xl font-black text-white sm:text-3xl">
            Agent Identity & Account Control
          </h2>

          <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-200">
            Manage confirmed agent identities, observed source names, attribution
            gaps and agent-level funnel activity. This workspace no longer
            pretends every named referral source is a verified agent account.
          </p>
        </div>

        <div className="bg-[#FF5A0A] p-5 text-white sm:p-6">
          <p className="text-[9px] font-black uppercase tracking-[0.12em]">
            Confirmed Agents
          </p>

          <p className="mt-2 text-3xl font-black">
            {confirmedAgents.length}
          </p>

          <p className="mt-2 text-xs font-semibold leading-5 text-orange-50">
            {activeConfirmedAgents} with recorded operational activity ·{" "}
            {observedSources.length} observed source name
            {observedSources.length === 1 ? "" : "s"} awaiting identity confirmation.
          </p>

          <span className="mt-3 inline-flex rounded-full border-2 border-white/25 bg-white/10 px-3 py-1 text-[8px] font-black uppercase tracking-[0.08em]">
            Identity before performance
          </span>
        </div>
      </div>

      <div className="space-y-5 p-4 sm:p-5">
        {!compact ? (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              label="Confirmed Agents"
              value={confirmedAgents.length}
              helper="Agent identities backed by a real account/profile record."
              tone="navy"
              icon={BadgeCheck}
              badge="Verified identity"
            />

            <MetricCard
              label="Active Confirmed"
              value={activeConfirmedAgents}
              helper="Confirmed agents with recorded funnel activity."
              tone="green"
              icon={UserRoundCheck}
            />

            <MetricCard
              label="Observed Sources"
              value={observedSources.length}
              helper="Named agent/referrer sources seen in operational records without a confirmed agent account."
              tone={observedSources.length ? "blue" : "green"}
              icon={Globe2}
            />

            <MetricCard
              label="Unassigned Leads"
              value={unassignedLeads}
              helper="Student records with direct or missing agent attribution."
              tone={unassignedLeads > 0 ? "amber" : "green"}
              icon={unassignedLeads > 0 ? AlertTriangle : ShieldCheck}
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
                placeholder="Search agent, organization, email, country..."
                className="min-h-11 w-full rounded-xl border-2 border-[#C9D7E6] bg-white pl-11 pr-4 text-sm font-semibold text-[#10233F] outline-none placeholder:text-slate-400 transition focus:border-[#F97316] focus:ring-4 focus:ring-orange-100"
              />
            </label>

            <select
              value={identityFilter}
              onChange={(event) =>
                setIdentityFilter(event.target.value)
              }
              className="min-h-11 rounded-xl border-2 border-[#C9D7E6] bg-white px-3 text-sm font-black text-[#10233F] outline-none focus:border-[#F97316]"
            >
              <option value="all">All Identity States</option>
              <option value="confirmed">Confirmed Agents</option>
              <option value="observed">Observed Sources</option>
              <option value="unassigned">Unassigned Source</option>
            </select>

            <button
              type="button"
              onClick={clearFilters}
              disabled={!filtersActive}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border-2 border-[#C9D7E6] bg-[#FFF8EF] px-3 text-xs font-black text-slate-700 transition hover:border-[#F97316] hover:text-orange-700 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <X size={13} />
              Clear
            </button>
          </div>
        ) : null}

        <div className="space-y-3">
          {visible.length ? (
            visible.map((agent, index) => (
              <AgentCard
                key={agent.id || `${agent.name}-${index}`}
                agent={agent}
              />
            ))
          ) : (
            <div className="rounded-[1.55rem] border-[3px] border-dashed border-[#C9D7E6] bg-white p-8 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border-2 border-[#F97316] bg-[#FFF4E8] text-orange-700">
                <UsersRound size={24} />
              </div>

              <h3 className="mt-4 text-xl font-black text-[#10233F]">
                {agents.length
                  ? "No agent identities match these filters."
                  : "No agent identities yet."}
              </h3>

              <p className="mx-auto mt-2 max-w-xl text-sm font-semibold leading-6 text-slate-600">
                {agents.length
                  ? "Clear or change the identity filters."
                  : "Confirmed agent accounts and observed source identities will appear here when real agent/account evidence is connected."}
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
                    Identity Integrity
                  </p>
                  <p className="mt-1 font-black text-[#10233F]">
                    Source name ≠ agent account
                  </p>
                  <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">
                    A referral source is only treated as a confirmed agent after a
                    real agent account/profile record supports that identity.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-[1.35rem] border-[3px] border-[#60A5FA] bg-[#F2F7FF] p-4">
              <div className="flex items-start gap-3">
                <Globe2
                  size={17}
                  className="mt-0.5 shrink-0 text-blue-700"
                />

                <div>
                  <p className="text-[8px] font-black uppercase tracking-[0.11em] text-slate-500">
                    Attribution Integrity
                  </p>
                  <p className="mt-1 font-black text-[#10233F]">
                    Observed sources stay visible
                  </p>
                  <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">
                    Zaifan keeps unconfirmed referral names visible so they can be
                    reconciled instead of silently merging them into the agent directory.
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
                    Performance Boundary
                  </p>
                  <p className="mt-1 font-black text-[#10233F]">
                    Management view does not score agents
                  </p>
                  <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">
                    This page manages identity and operational evidence. Explicit
                    performance scoring belongs in Agent Performance, keeping the
                    Admin system less repetitive.
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
