import React, { useMemo, useState } from "react";
import {
  AlertTriangle,
  BadgeCheck,
  BarChart3,
  Search,
  ShieldCheck,
  Target,
  TrendingUp,
  Trophy,
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

function money(value) {
  if (value === null || value === undefined || !Number.isFinite(Number(value))) {
    return "Not recorded";
  }

  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    maximumFractionDigits: 0,
  }).format(Number(value));
}

function conversionRate(numerator, denominator) {
  const top = safeNumber(numerator);
  const bottom = safeNumber(denominator);

  if (!bottom) return null;
  return Math.max(0, Math.round((top / bottom) * 100));
}

function rateLabel(value) {
  return value === null ? "Not measured" : `${value}%`;
}

function hasActivity(agent = {}) {
  return (
    safeNumber(agent.leads) > 0 ||
    safeNumber(agent.applications) > 0 ||
    safeNumber(agent.offers) > 0 ||
    safeNumber(agent.cas) > 0 ||
    safeNumber(agent.visas) > 0 ||
    safeNumber(agent.revenue) > 0
  );
}

function getExplicitPerformance(agent = {}) {
  const candidates = [
    agent.performanceScore,
    agent.performance_score,
    agent.score,
  ];

  for (const value of candidates) {
    if (value === null || value === undefined || value === "") continue;
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return Math.max(0, Math.min(100, Math.round(parsed)));
    }
  }

  return null;
}

function scoreTone(score) {
  if (score === null) {
    return "border-[#60A5FA] bg-[#F2F7FF] text-blue-700";
  }

  if (score >= 80) {
    return "border-[#34D399] bg-[#F0FFF8] text-emerald-700";
  }

  if (score >= 60) {
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
    <div
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
    </div>
  );
}

function FunnelMetric({ label, value, helper }) {
  return (
    <div className="rounded-xl border-2 border-[#E1E8F0] bg-[#FFF8EF] p-3">
      <p className="text-[8px] font-black uppercase tracking-[0.08em] text-slate-500">
        {label}
      </p>
      <p className="mt-1 text-base font-black text-[#10233F]">
        {rateLabel(value)}
      </p>
      <p className="mt-1 text-[10px] font-semibold leading-4 text-slate-500">
        {helper}
      </p>
    </div>
  );
}

function AgentRow({ agent, rank, compact }) {
  const score = getExplicitPerformance(agent);
  const measurable = hasActivity(agent);

  const leadToApplication = conversionRate(agent.applications, agent.leads);
  const applicationToOffer = conversionRate(agent.offers, agent.applications);
  const casToVisa = conversionRate(agent.visas, agent.cas);

  const unassigned = agent.name === "Direct / Unassigned";
  const confirmed = Boolean(agent.identityConfirmed);

  return (
    <article className="rounded-[1.5rem] border-[3px] border-[#C9D7E6] bg-white p-4 shadow-[0_7px_20px_rgba(15,35,63,0.045)] transition hover:-translate-y-0.5 hover:border-[#F97316]">
      <div
        className={
          compact
            ? "grid min-w-0 gap-4"
            : "grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1fr)_19rem_10rem] xl:items-center"
        }
      >
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            <span
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border-2 text-sm font-black ${
                unassigned
                  ? "border-[#F59E0B] bg-[#FFF8E8] text-amber-800"
                  : confirmed
                    ? "border-[#34D399] bg-[#F0FFF8] text-emerald-700"
                    : "border-[#F97316] bg-[#FFF4E8] text-orange-700"
              }`}
            >
              {rank}
            </span>

            <div className="min-w-0">
              <p className="min-w-0 [overflow-wrap:anywhere] text-lg font-black leading-snug text-[#10233F]">
                {agent.name}
              </p>

              <p className="mt-1 text-xs font-semibold text-slate-500">
                {safeNumber(agent.leads)} lead{safeNumber(agent.leads) === 1 ? "" : "s"} ·{" "}
                {money(agent.revenue)} recorded revenue
              </p>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            <span
              className={`rounded-full border-2 px-2.5 py-1 text-[8px] font-black uppercase tracking-[0.07em] ${
                unassigned
                  ? "border-[#F59E0B] bg-[#FFF8E8] text-amber-800"
                  : confirmed
                    ? "border-[#34D399] bg-[#F0FFF8] text-emerald-700"
                    : "border-[#60A5FA] bg-[#F2F7FF] text-blue-700"
              }`}
            >
              {unassigned
                ? "Unassigned source"
                : confirmed
                  ? "Confirmed agent"
                  : "Observed source"}
            </span>

            <span
              className={`rounded-full border-2 px-2.5 py-1 text-[8px] font-black uppercase tracking-[0.07em] ${
                measurable
                  ? "border-[#60A5FA] bg-[#F2F7FF] text-blue-700"
                  : "border-[#C9D7E6] bg-[#FFF8EF] text-slate-600"
              }`}
            >
              {measurable ? "Activity evidence" : "Awaiting activity"}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <FunnelMetric
            label="Lead → App"
            value={leadToApplication}
            helper={`${safeNumber(agent.applications)}/${safeNumber(agent.leads)}`}
          />
          <FunnelMetric
            label="App → Offer"
            value={applicationToOffer}
            helper={`${safeNumber(agent.offers)}/${safeNumber(agent.applications)}`}
          />
          <FunnelMetric
            label="CAS → Visa"
            value={casToVisa}
            helper={`${safeNumber(agent.visas)}/${safeNumber(agent.cas)}`}
          />
        </div>

        <div className="min-w-0">
          <p className="text-[8px] font-black uppercase tracking-[0.1em] text-slate-500">
            Performance Score
          </p>

          <span
            className={`mt-2 inline-flex rounded-full border-2 px-3 py-1.5 text-sm font-black ${scoreTone(
              score
            )}`}
          >
            {score === null ? "—" : `${score}%`}
          </span>

          <p className="mt-2 text-[10px] font-semibold leading-4 text-slate-500">
            {score === null
              ? "Not measured"
              : "Explicit recorded score only"}
          </p>
        </div>
      </div>

      {!compact ? (
        <>
          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
            <div className="rounded-xl border-2 border-[#E1E8F0] bg-[#FFF8EF] p-3 text-center">
              <p className="text-base font-black text-[#10233F]">
                {safeNumber(agent.applications)}
              </p>
              <p className="mt-1 text-[8px] font-black uppercase tracking-[0.07em] text-slate-500">
                Applications
              </p>
            </div>

            <div className="rounded-xl border-2 border-[#E1E8F0] bg-[#FFF8EF] p-3 text-center">
              <p className="text-base font-black text-[#10233F]">
                {safeNumber(agent.offers)}
              </p>
              <p className="mt-1 text-[8px] font-black uppercase tracking-[0.07em] text-slate-500">
                Offers
              </p>
            </div>

            <div className="rounded-xl border-2 border-[#E1E8F0] bg-[#FFF8EF] p-3 text-center">
              <p className="text-base font-black text-[#10233F]">
                {safeNumber(agent.cas)}
              </p>
              <p className="mt-1 text-[8px] font-black uppercase tracking-[0.07em] text-slate-500">
                CAS
              </p>
            </div>

            <div className="rounded-xl border-2 border-[#E1E8F0] bg-[#FFF8EF] p-3 text-center">
              <p className="text-base font-black text-[#10233F]">
                {safeNumber(agent.visas)}
              </p>
              <p className="mt-1 text-[8px] font-black uppercase tracking-[0.07em] text-slate-500">
                Visas
              </p>
            </div>
          </div>

          <div className="mt-4 rounded-xl border-2 border-[#E1E8F0] bg-[#FFF8EF] p-3">
            <p className="text-[8px] font-black uppercase tracking-[0.1em] text-slate-500">
              Performance interpretation
            </p>
            <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">
              {score !== null
                ? "A stored performance score exists for this agent. Funnel ratios remain shown separately so the underlying operational evidence stays visible."
                : measurable
                  ? "Activity evidence exists, but Zaifan will not manufacture an overall performance score from funnel counts."
                  : "No measurable operational activity exists yet."}
            </p>
          </div>

          {unassigned ? (
            <div className="mt-3 flex items-start gap-3 rounded-xl border-2 border-[#F59E0B] bg-[#FFF8E8] p-3">
              <AlertTriangle
                size={15}
                className="mt-0.5 shrink-0 text-amber-700"
              />
              <p className="text-xs font-semibold leading-5 text-slate-600">
                Direct / Unassigned is displayed for attribution integrity only.
                It is not ranked as a real agent.
              </p>
            </div>
          ) : null}
        </>
      ) : null}
    </article>
  );
}

export default function AgentPerformancePanel({
  agentOS = {},
  compact = false,
}) {
  const [query, setQuery] = useState("");
  const [identityFilter, setIdentityFilter] = useState("all");

  const agents = safeArray(agentOS.agents);

  const eligibleAgents = useMemo(
    () =>
      agents.filter(
        (agent) => agent.name !== "Direct / Unassigned"
      ),
    [agents]
  );

  const filtered = useMemo(() => {
    const search = lower(query);

    return eligibleAgents.filter((agent) => {
      if (
        identityFilter === "confirmed" &&
        !agent.identityConfirmed
      ) {
        return false;
      }

      if (
        identityFilter === "observed" &&
        agent.identityConfirmed
      ) {
        return false;
      }

      if (!search) return true;

      return [
        agent.name,
        agent.organization,
        agent.email,
        ...safeArray(agent.countries).map((country) => country.name),
      ]
        .map(lower)
        .join(" ")
        .includes(search);
    });
  }, [eligibleAgents, query, identityFilter]);

  const ranked = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const aScore = getExplicitPerformance(a);
      const bScore = getExplicitPerformance(b);

      if (aScore === null && bScore === null) {
        const aActivity =
          safeNumber(a.visas) * 5 +
          safeNumber(a.cas) * 4 +
          safeNumber(a.offers) * 3 +
          safeNumber(a.applications) * 2 +
          safeNumber(a.leads);

        const bActivity =
          safeNumber(b.visas) * 5 +
          safeNumber(b.cas) * 4 +
          safeNumber(b.offers) * 3 +
          safeNumber(b.applications) * 2 +
          safeNumber(b.leads);

        return bActivity - aActivity;
      }

      if (aScore === null) return 1;
      if (bScore === null) return -1;

      return bScore - aScore;
    });
  }, [filtered]);

  const visible = compact ? ranked.slice(0, 4) : ranked;

  const measured = eligibleAgents.filter(
    (agent) => getExplicitPerformance(agent) !== null
  );

  const confirmed = eligibleAgents.filter(
    (agent) => agent.identityConfirmed
  );

  const active = eligibleAgents.filter(hasActivity);

  const topMeasured =
    [...measured].sort(
      (a, b) =>
        getExplicitPerformance(b) -
        getExplicitPerformance(a)
    )[0] || null;

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
            <BarChart3 size={12} />
            Agent Performance
          </div>

          <h2 className="mt-3 text-2xl font-black text-white sm:text-3xl">
            Individual Agent Performance
          </h2>

          <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-200">
            Agent-level funnel quality and explicitly recorded performance scores.
            Zaifan no longer normalizes a synthetic formula into a fake operating
            index.
          </p>
        </div>

        <div className="bg-[#FF5A0A] p-5 text-white sm:p-6">
          <p className="text-[9px] font-black uppercase tracking-[0.12em]">
            Measured Scores
          </p>

          <p className="mt-2 text-3xl font-black">
            {measured.length}/{eligibleAgents.length}
          </p>

          <p className="mt-2 text-xs font-semibold leading-5 text-orange-50">
            Real agent identities with explicit performance evidence.
          </p>

          <span className="mt-3 inline-flex rounded-full border-2 border-white/25 bg-white/10 px-3 py-1 text-[8px] font-black uppercase tracking-[0.08em]">
            No synthetic score
          </span>
        </div>
      </div>

      <div className="space-y-5 p-4 sm:p-5">
        {!compact ? (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              label="Confirmed Agents"
              value={confirmed.length}
              helper="Agent identities backed by a recorded agent account/profile."
              tone="navy"
              icon={BadgeCheck}
            />

            <MetricCard
              label="Active Agents"
              value={active.length}
              helper="Agent identities with recorded funnel or revenue activity."
              tone="blue"
              icon={UsersRound}
            />

            <MetricCard
              label="Measured Scores"
              value={measured.length}
              helper="Agents with an explicit stored performance score."
              tone={measured.length ? "green" : "blue"}
              icon={Target}
            />

            <MetricCard
              label="Top Measured"
              value={
                topMeasured
                  ? `${getExplicitPerformance(topMeasured)}%`
                  : "—"
              }
              helper={
                topMeasured
                  ? topMeasured.name
                  : "No explicit performance scores exist yet."
              }
              tone={topMeasured ? "violet" : "blue"}
              icon={Trophy}
              badge={
                topMeasured ? "Recorded score" : "Not measured"
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
                placeholder="Search agent, organization, country..."
                className="min-h-11 w-full rounded-xl border-2 border-[#C9D7E6] bg-white pl-11 pr-4 text-sm font-semibold text-[#10233F] outline-none placeholder:text-slate-400 focus:border-[#F97316]"
              />
            </label>

            <select
              value={identityFilter}
              onChange={(event) => setIdentityFilter(event.target.value)}
              className="min-h-11 rounded-xl border-2 border-[#C9D7E6] bg-white px-3 text-sm font-black text-[#10233F] outline-none focus:border-[#F97316]"
            >
              <option value="all">All agent sources</option>
              <option value="confirmed">Confirmed agents</option>
              <option value="observed">Observed only</option>
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

        <div className="space-y-3">
          {visible.length ? (
            visible.map((agent, index) => (
              <AgentRow
                key={agent.id || `${agent.name}-${index}`}
                agent={agent}
                rank={index + 1}
                compact={compact}
              />
            ))
          ) : (
            <div className="rounded-[1.5rem] border-[3px] border-dashed border-[#C9D7E6] bg-white p-8 text-center">
              <BarChart3 size={24} className="mx-auto text-orange-700" />

              <p className="mt-3 font-black text-[#10233F]">
                {eligibleAgents.length
                  ? "No agents match these filters."
                  : "No agent performance evidence yet."}
              </p>

              <p className="mx-auto mt-2 max-w-xl text-sm font-semibold leading-6 text-slate-600">
                {eligibleAgents.length
                  ? "Clear or change the filters."
                  : "Confirm agent identities and connect genuine agent activity before performance is assessed."}
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
                    Score Integrity
                  </p>
                  <p className="mt-1 font-black text-[#10233F]">
                    Explicit score only
                  </p>
                  <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">
                    An overall performance percentage appears only when a real
                    stored score exists for that agent.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-[1.35rem] border-[3px] border-[#60A5FA] bg-[#F2F7FF] p-4">
              <div className="flex items-start gap-3">
                <TrendingUp
                  size={17}
                  className="mt-0.5 shrink-0 text-blue-700"
                />
                <div>
                  <p className="text-[8px] font-black uppercase tracking-[0.11em] text-slate-500">
                    Funnel Integrity
                  </p>
                  <p className="mt-1 font-black text-[#10233F]">
                    Ratios stay separate
                  </p>
                  <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">
                    Lead→Application, Application→Offer and CAS→Visa are shown
                    directly instead of being hidden inside a synthetic score.
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
                    Unmeasured agents are not scored
                  </p>
                  <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">
                    Activity can still be sorted for visibility, but Zaifan does
                    not label an unmeasured agent as high or low performing.
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
