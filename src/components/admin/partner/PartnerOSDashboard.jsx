import React, { useMemo, useState } from "react";
import {
  Activity,
  BadgeCheck,
  Building2,
  CircleDollarSign,
  Handshake,
  Network,
  RefreshCw,
  Search,
  ShieldCheck,
  Target,
  University,
  UsersRound,
  X,
} from "lucide-react";

import AgentNetworkCenter from "./AgentNetworkCenter";
import UniversityPartnerCenter from "./UniversityPartnerCenter";
import CommissionCenter from "./CommissionCenter";
import PartnerPerformance from "./PartnerPerformance";
import PartnerAnalytics from "./PartnerAnalytics";

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

function money(value) {
  return new Intl.NumberFormat("en-PK", {
    style: "currency",
    currency: "PKR",
    maximumFractionDigits: 0,
  }).format(safeNumber(value));
}

function percent(value) {
  return `${Math.round(safeNumber(value))}%`;
}

function isReadyStatus(status = "") {
  const value = lower(status);

  return (
    value.includes("active") ||
    value.includes("approved") ||
    value.includes("live") ||
    value.includes("verified")
  );
}

function isReviewStatus(status = "") {
  const value = lower(status);

  return (
    value.includes("review") ||
    value.includes("pending") ||
    value.includes("paused") ||
    value.includes("hold") ||
    value.includes("inactive")
  );
}

function partnerType(partner = {}) {
  const value = lower(
    partner.type ||
      partner.partner_type ||
      partner.partnerType ||
      partner.category
  );

  if (
    value.includes("university") ||
    value.includes("college") ||
    value.includes("institution")
  ) {
    return "University";
  }

  if (
    value.includes("agent") ||
    value.includes("agency") ||
    value.includes("recruit")
  ) {
    return "Agent";
  }

  return partner.type || partner.partner_type || "Other";
}

function getPartnerName(partner = {}) {
  return (
    partner.name ||
    partner.partner_name ||
    partner.partnerName ||
    partner.organization_name ||
    partner.organizationName ||
    "Unnamed partner"
  );
}

function getPartnerCountry(partner = {}) {
  return (
    partner.country ||
    partner.destination_country ||
    partner.destinationCountry ||
    partner.base_country ||
    partner.baseCountry ||
    "Not recorded"
  );
}

function getPartnerOwner(partner = {}) {
  return (
    partner.owner ||
    partner.owner_name ||
    partner.ownerName ||
    partner.account_manager ||
    partner.accountManager ||
    "Not assigned"
  );
}

function getPartnerStudents(partner = {}) {
  return safeNumber(
    partner.students ??
      partner.student_count ??
      partner.studentCount ??
      partner.referred_students ??
      partner.referredStudents
  );
}

function getPartnerRevenue(partner = {}) {
  return safeNumber(
    partner.revenue ??
      partner.partner_revenue ??
      partner.partnerRevenue ??
      partner.collected_revenue ??
      partner.collectedRevenue
  );
}

function getPartnerConversion(partner = {}) {
  const explicit =
    partner.conversion ??
    partner.conversion_rate ??
    partner.conversionRate;

  if (explicit !== null && explicit !== undefined && explicit !== "") {
    const value = Number(explicit);
    return Number.isFinite(value) ? value : null;
  }

  const leads = safeNumber(
    partner.leads ??
      partner.referred_leads ??
      partner.referredLeads
  );

  const applications = safeNumber(
    partner.applications ??
      partner.application_count ??
      partner.applicationCount
  );

  if (leads <= 0) return null;
  return Math.round((applications / leads) * 100);
}

function statusTone(status = "") {
  if (isReadyStatus(status)) {
    return "border-[#34D399] bg-[#F0FFF8] text-emerald-700";
  }

  if (isReviewStatus(status)) {
    return "border-[#F59E0B] bg-[#FFF8E8] text-amber-800";
  }

  return "border-[#C9D7E6] bg-[#FFF8EF] text-slate-600";
}

function riskTone(risk = "") {
  const value = lower(risk);

  if (value.includes("high") || value.includes("critical")) {
    return "border-[#FB7185] bg-[#FFF4F4] text-red-700";
  }

  if (value.includes("medium")) {
    return "border-[#F59E0B] bg-[#FFF8E8] text-amber-800";
  }

  if (value.includes("low")) {
    return "border-[#34D399] bg-[#F0FFF8] text-emerald-700";
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

function PartnerRow({ partner }) {
  const conversion = getPartnerConversion(partner);
  const status = partner.status || "Unknown";
  const risk = partner.risk || "Not measured";

  return (
    <article className="rounded-[1.3rem] border-2 border-[#C9D7E6] bg-white p-4 shadow-[0_6px_18px_rgba(15,35,63,0.04)] transition hover:border-[#F97316]">
      <div className="grid min-w-0 gap-4 xl:grid-cols-[minmax(18rem,1.4fr)_10rem_9rem_10rem_10rem_11rem] xl:items-center">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="min-w-0 [overflow-wrap:anywhere] font-black text-[#10233F]">
              {getPartnerName(partner)}
            </p>

            <span
              className={`rounded-full border-2 px-2.5 py-1 text-[8px] font-black uppercase tracking-[0.07em] ${statusTone(
                status
              )}`}
            >
              {status}
            </span>
          </div>

          <p className="mt-1 text-[11px] font-semibold leading-4 text-slate-500">
            {[
              partner.id,
              partnerType(partner),
              getPartnerCountry(partner),
            ]
              .filter(Boolean)
              .join(" · ")}
          </p>
        </div>

        <div className="rounded-xl border border-[#E1E8F0] bg-[#FFF8EF] px-3 py-2.5">
          <p className="text-[7px] font-black uppercase tracking-[0.09em] text-slate-500">
            Students
          </p>
          <p className="mt-1 text-xs font-black text-[#10233F]">
            {getPartnerStudents(partner)}
          </p>
        </div>

        <div className="rounded-xl border border-[#E1E8F0] bg-[#FFF8EF] px-3 py-2.5">
          <p className="text-[7px] font-black uppercase tracking-[0.09em] text-slate-500">
            Conversion
          </p>
          <p className="mt-1 text-xs font-black text-[#10233F]">
            {conversion === null ? "Not measured" : percent(conversion)}
          </p>
        </div>

        <div className="rounded-xl border border-[#E1E8F0] bg-[#FFF8EF] px-3 py-2.5">
          <p className="text-[7px] font-black uppercase tracking-[0.09em] text-slate-500">
            Revenue
          </p>
          <p className="mt-1 truncate text-xs font-black text-[#10233F]">
            {getPartnerRevenue(partner) > 0
              ? money(getPartnerRevenue(partner))
              : "Not linked"}
          </p>
        </div>

        <div>
          <p className="text-[7px] font-black uppercase tracking-[0.09em] text-slate-500">
            Risk
          </p>
          <span
            className={`mt-1 inline-flex rounded-full border-2 px-2.5 py-1 text-[8px] font-black uppercase tracking-[0.07em] ${riskTone(
              risk
            )}`}
          >
            {risk}
          </span>
        </div>

        <div className="rounded-xl border border-[#E1E8F0] bg-[#FFF8EF] px-3 py-2.5">
          <p className="text-[7px] font-black uppercase tracking-[0.09em] text-slate-500">
            Owner
          </p>
          <p className="mt-1 truncate text-xs font-black text-[#10233F]">
            {getPartnerOwner(partner)}
          </p>
        </div>
      </div>
    </article>
  );
}

export default function PartnerOSDashboard({
  compact = false,
  snapshot = {},
  adminProfile,
  onRefresh,
}) {
  const [activeView, setActiveView] = useState("overview");
  const [search, setSearch] = useState("");
  const [type, setType] = useState("All");

  const partners = useMemo(
    () =>
      safeArray(
        snapshot.partners ||
          snapshot.partnerRecords ||
          snapshot.organizations
      ),
    [snapshot]
  );

  const agents = useMemo(
    () =>
      safeArray(
        snapshot.agents ||
          snapshot.agentPartners ||
          partners.filter((partner) => partnerType(partner) === "Agent")
      ),
    [snapshot, partners]
  );

  const universities = useMemo(
    () =>
      safeArray(
        snapshot.universityPartners ||
          snapshot.universities ||
          partners.filter(
            (partner) => partnerType(partner) === "University"
          )
      ),
    [snapshot, partners]
  );

  const commissions = useMemo(
    () =>
      safeArray(
        snapshot.commissions ||
          snapshot.partnerCommissions
      ),
    [snapshot]
  );

  const performance = useMemo(
    () =>
      safeArray(
        snapshot.performance ||
          snapshot.partnerPerformance
      ),
    [snapshot]
  );

  const analytics = useMemo(
    () => snapshot.analytics || snapshot.partnerAnalytics || {},
    [snapshot]
  );

  const filteredPartners = useMemo(() => {
    const needle = lower(search);

    return partners.filter((partner) => {
      if (type !== "All" && partnerType(partner) !== type) {
        return false;
      }

      if (!needle) return true;

      return [
        getPartnerName(partner),
        getPartnerCountry(partner),
        getPartnerOwner(partner),
        partner.status,
        partner.risk,
        partnerType(partner),
      ]
        .map(lower)
        .join(" ")
        .includes(needle);
    });
  }, [partners, search, type]);

  const metrics = useMemo(() => {
    const active = partners.filter((partner) =>
      isReadyStatus(partner.status)
    ).length;

    const review = partners.filter((partner) =>
      isReviewStatus(partner.status)
    ).length;

    const totalStudents = partners.reduce(
      (sum, partner) => sum + getPartnerStudents(partner),
      0
    );

    const totalRevenue = partners.reduce(
      (sum, partner) => sum + getPartnerRevenue(partner),
      0
    );

    const measurableConversions = partners
      .map(getPartnerConversion)
      .filter((value) => value !== null);

    const avgConversion = measurableConversions.length
      ? Math.round(
          measurableConversions.reduce((sum, value) => sum + value, 0) /
            measurableConversions.length
        )
      : null;

    return {
      active,
      review,
      totalStudents,
      totalRevenue,
      avgConversion,
      measuredConversionCount: measurableConversions.length,
    };
  }, [partners]);

  const views = [
    { key: "overview", label: "Overview", icon: Activity },
    { key: "agents", label: "Agent Network", icon: Network },
    { key: "universities", label: "University Partners", icon: University },
    { key: "commissions", label: "Commissions", icon: CircleDollarSign },
    { key: "performance", label: "Performance", icon: Target },
    { key: "analytics", label: "Analytics", icon: BarChart3Fallback },
  ];

  const currentView =
    views.find((view) => view.key === activeView) || views[0];

  const filtersActive = Boolean(search.trim()) || type !== "All";

  function clearFilters() {
    setSearch("");
    setType("All");
  }

  return (
    <div className="min-w-0 space-y-5 rounded-[2.2rem] border-[4px] border-[#123865] bg-[#FFF8EF] p-3 shadow-[0_24px_65px_rgba(18,56,101,0.15)] sm:p-4 lg:p-5">
      <header className="overflow-hidden rounded-[1.75rem] border-[3px] border-[#F97316]">
        <div className="grid xl:grid-cols-[minmax(0,1.25fr)_minmax(18rem,0.75fr)]">
          <div className="bg-[#123865] p-5 text-white sm:p-6">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-2 rounded-full border-2 border-orange-300/30 bg-orange-400/10 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.12em] text-orange-300">
                <Handshake size={12} />
                Partner OS
              </span>

              <span className="rounded-full border-2 border-white/15 bg-white/5 px-3 py-1 text-[8px] font-black uppercase tracking-[0.08em] text-white">
                Relationship management
              </span>

              <span className="rounded-full border-2 border-white/15 bg-white/5 px-3 py-1 text-[8px] font-black uppercase tracking-[0.08em] text-white">
                Evidence first
              </span>
            </div>

            <h1 className="mt-3 text-3xl font-black text-white">
              Partner Relationship Command
            </h1>

            <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-200">
              University relationships, recruitment partners, commissions,
              performance and partner analytics. Zaifan no longer pre-populates
              fake agents, universities, students, revenue or partner-health
              percentages just to make this workspace look active.
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
                ? `Admin partner view for ${adminProfile.email}`
                : "Admin partner relationship workspace"}
            </p>

            <div className="mt-4 flex flex-wrap gap-2">
              <span className="rounded-full border-2 border-white/25 bg-white/10 px-3 py-1 text-[8px] font-black uppercase tracking-[0.08em]">
                {partners.length} partners
              </span>

              <span className="rounded-full border-2 border-white/25 bg-white/10 px-3 py-1 text-[8px] font-black uppercase tracking-[0.08em]">
                {metrics.active} active
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
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border-2 border-[#123865] bg-[#123865] px-4 text-xs font-black text-white transition hover:bg-[#245886]"
          >
            <RefreshCw size={13} />
            Refresh Partners
          </button>
        ) : null}
      </nav>

      {activeView === "overview" ? (
        <>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              label="Partner Records"
              value={partners.length}
              helper={`${agents.length} agent/recruitment partner${
                agents.length === 1 ? "" : "s"
              } · ${universities.length} university partner${
                universities.length === 1 ? "" : "s"
              }.`}
              tone="navy"
              icon={Handshake}
              badge="Network"
            />

            <MetricCard
              label="Active Partners"
              value={metrics.active}
              helper={`${metrics.review} currently require review, hold or follow-up.`}
              tone={metrics.review > 0 ? "amber" : "green"}
              icon={BadgeCheck}
            />

            <MetricCard
              label="Partner Students"
              value={metrics.totalStudents}
              helper="Students explicitly attributed to partner records."
              tone="blue"
              icon={UsersRound}
            />

            <MetricCard
              label="Avg Conversion"
              value={
                metrics.avgConversion === null
                  ? "—"
                  : percent(metrics.avgConversion)
              }
              helper={
                metrics.avgConversion === null
                  ? "Not measured until real conversion evidence exists."
                  : `Average across ${metrics.measuredConversionCount} measurable partner record${
                      metrics.measuredConversionCount === 1 ? "" : "s"
                    }.`
              }
              tone={
                metrics.avgConversion === null ? "blue" : "violet"
              }
              icon={Target}
              badge={
                metrics.avgConversion === null
                  ? "Not measured"
                  : "Measured"
              }
            />
          </div>

          <section className="rounded-[1.5rem] border-[3px] border-[#C9D7E6] bg-white p-4 sm:p-5">
            <div className="mb-4 flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
              <div>
                <p className="text-[9px] font-black uppercase tracking-[0.11em] text-orange-700">
                  Partner Command
                </p>
                <h2 className="mt-1 text-xl font-black text-[#10233F]">
                  Relationship portfolio
                </h2>
                <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">
                  Search and review the real partner records currently supplied
                  to Partner OS.
                </p>
              </div>

              {!compact ? (
                <div className="grid gap-2 sm:grid-cols-[minmax(14rem,1fr)_10rem_auto]">
                  <label className="relative block">
                    <Search
                      size={15}
                      className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                    <input
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                      placeholder="Search partner..."
                      className="min-h-10 w-full rounded-xl border-2 border-[#C9D7E6] bg-[#FFF8EF] pl-9 pr-3 text-xs font-semibold text-[#10233F] outline-none placeholder:text-slate-400 focus:border-[#F97316]"
                    />
                  </label>

                  <select
                    value={type}
                    onChange={(event) => setType(event.target.value)}
                    className="min-h-10 rounded-xl border-2 border-[#C9D7E6] bg-[#FFF8EF] px-3 text-xs font-black text-[#10233F] outline-none focus:border-[#F97316]"
                  >
                    <option>All</option>
                    <option>Agent</option>
                    <option>University</option>
                    <option>Other</option>
                  </select>

                  <button
                    type="button"
                    onClick={clearFilters}
                    disabled={!filtersActive}
                    className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border-2 border-[#C9D7E6] bg-white px-3 text-xs font-black text-slate-700 disabled:opacity-40"
                  >
                    <X size={13} />
                    Clear
                  </button>
                </div>
              ) : null}
            </div>

            <div className="space-y-2.5">
              {(compact
                ? filteredPartners.slice(0, 4)
                : filteredPartners
              ).length ? (
                (compact
                  ? filteredPartners.slice(0, 4)
                  : filteredPartners
                ).map((partner, index) => (
                  <PartnerRow
                    key={
                      partner.id ||
                      `${getPartnerName(partner)}-${index}`
                    }
                    partner={partner}
                  />
                ))
              ) : (
                <div className="rounded-[1.4rem] border-[3px] border-dashed border-[#C9D7E6] bg-[#FFF8EF] p-8 text-center">
                  <Handshake
                    size={24}
                    className="mx-auto text-orange-700"
                  />
                  <p className="mt-3 font-black text-[#10233F]">
                    {partners.length
                      ? "No partners match these filters."
                      : "No real partner records yet."}
                  </p>
                  <p className="mx-auto mt-2 max-w-xl text-sm font-semibold leading-6 text-slate-600">
                    {partners.length
                      ? "Clear or change the partner filters."
                      : "Connect genuine university/recruitment partner records before Zaifan reports partner revenue, conversion, health or performance."}
                  </p>
                </div>
              )}
            </div>
          </section>

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
                      Relationship Integrity
                    </p>
                    <p className="mt-1 font-black text-[#10233F]">
                      Agent ≠ entire Partner OS
                    </p>
                    <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">
                      Agents are one partner channel. Universities, commissions
                      and relationship performance remain first-class Partner OS
                      domains.
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-[1.35rem] border-[3px] border-[#60A5FA] bg-[#F2F7FF] p-4">
                <div className="flex items-start gap-3">
                  <Building2
                    size={17}
                    className="mt-0.5 shrink-0 text-blue-700"
                  />
                  <div>
                    <p className="text-[8px] font-black uppercase tracking-[0.11em] text-slate-500">
                      Portfolio Boundary
                    </p>
                    <p className="mt-1 font-black text-[#10233F]">
                      No fake partner network
                    </p>
                    <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">
                      Missing universities or agents stay absent rather than
                      being replaced with template organisations.
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
                      Revenue Boundary
                    </p>
                    <p className="mt-1 font-black text-[#10233F]">
                      Relationship ≠ attributed revenue
                    </p>
                    <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">
                      Partner revenue is shown only when it is explicitly linked
                      to partner records or a real commission/revenue workflow.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : null}

          {!compact ? (
            <PartnerAnalytics
              compact
              partners={partners}
              records={analytics.records}
              analytics={analytics}
            />
          ) : null}
        </>
      ) : null}

      {activeView === "agents" ? (
        <AgentNetworkCenter
          compact={compact}
          records={agents}
          partners={partners}
        />
      ) : null}

      {activeView === "universities" ? (
        <UniversityPartnerCenter
          compact={compact}
          records={universities}
          partners={partners}
        />
      ) : null}

      {activeView === "commissions" ? (
        <CommissionCenter
          compact={compact}
          records={commissions}
          partners={partners}
        />
      ) : null}

      {activeView === "performance" ? (
        <PartnerPerformance
          compact={compact}
          records={performance}
          partners={partners}
        />
      ) : null}

      {activeView === "analytics" ? (
        <PartnerAnalytics
          compact={compact}
          partners={partners}
          records={analytics.records}
          analytics={analytics}
        />
      ) : null}
    </div>
  );
}

// Local icon alias keeps the nav readable without importing a heavy chart library.
function BarChart3Fallback(props) {
  return <Activity {...props} />;
}
