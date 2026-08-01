import React, { useMemo, useState } from "react";
import {
  AlertTriangle,
  BadgeCheck,
  ClipboardList,
  Database,
  Eye,
  FileText,
  History,
  Lock,
  Scale,
  Search,
  ShieldCheck,
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

function readyStatus(status = "") {
  const value = lower(status);
  return (
    value.includes("approved") ||
    value.includes("live") ||
    value.includes("active") ||
    value.includes("published") ||
    value.includes("verified")
  );
}

function reviewStatus(status = "") {
  const value = lower(status);
  return (
    value.includes("review") ||
    value.includes("draft") ||
    value.includes("expired") ||
    value.includes("stale") ||
    value.includes("unverified")
  );
}

function hasCoverage(policy = {}) {
  return (
    policy.coverage !== null &&
    policy.coverage !== undefined &&
    Number.isFinite(Number(policy.coverage))
  );
}

function clampPercent(value) {
  return Math.max(0, Math.min(100, safeNumber(value)));
}

function statusTone(status = "") {
  if (readyStatus(status)) {
    return "border-[#34D399] bg-[#F0FFF8] text-emerald-700";
  }

  if (reviewStatus(status)) {
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
            className={`mt-2 whitespace-normal break-normal text-2xl font-black [overflow-wrap:normal] [word-break:normal] ${
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

function PolicyRow({ policy }) {
  const coverageAvailable = hasCoverage(policy);
  const coverage = coverageAvailable
    ? clampPercent(policy.coverage)
    : null;

  const updated =
    policy.updated ||
    policy.updated_at ||
    policy.updatedAt ||
    policy.last_reviewed_at ||
    policy.lastReviewedAt ||
    null;

  const source =
    policy.source ||
    policy.source_url ||
    policy.sourceUrl ||
    policy.document_url ||
    policy.documentUrl ||
    null;

  return (
    <article className="rounded-[1.3rem] border-[3px] border-[#C9D7E6] bg-white p-4 shadow-[0_8px_22px_rgba(15,35,63,0.05)] transition hover:-translate-y-0.5 hover:border-[#F97316]">
      <div className="grid min-w-0 gap-4 lg:grid-cols-[minmax(19rem,1.5fr)_11rem_10rem_12rem] lg:items-center">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="min-w-0 [overflow-wrap:anywhere] font-black text-[#10233F]">
              {policy.title || "Untitled policy"}
            </p>

            <span
              className={`rounded-full border-2 px-2.5 py-1 text-[8px] font-black uppercase tracking-[0.07em] ${statusTone(
                policy.status
              )}`}
            >
              {policy.status || "Unknown"}
            </span>

            {policy.risk ? (
              <span
                className={`rounded-full border-2 px-2.5 py-1 text-[8px] font-black uppercase tracking-[0.07em] ${riskTone(
                  policy.risk
                )}`}
              >
                {policy.risk}
              </span>
            ) : null}
          </div>

          <p className="mt-1 text-[11px] font-semibold leading-4 text-slate-500">
            {[
              policy.id,
              policy.domain,
              policy.owner ? `Owner: ${policy.owner}` : null,
            ]
              .filter(Boolean)
              .join(" · ")}
          </p>

          {policy.summary || policy.description ? (
            <p className="mt-2 text-xs font-semibold leading-5 text-slate-600">
              {policy.summary || policy.description}
            </p>
          ) : null}

          <div className="mt-3 flex flex-wrap gap-2">
            <span
              className={`rounded-full border-2 px-2.5 py-1 text-[8px] font-black uppercase tracking-[0.06em] ${
                source
                  ? "border-[#34D399] bg-[#F0FFF8] text-emerald-700"
                  : "border-[#F59E0B] bg-[#FFF8E8] text-amber-800"
              }`}
            >
              {source ? "Policy source linked" : "Source not recorded"}
            </span>

            {policy.appliesTo || policy.applies_to ? (
              <span className="rounded-full border-2 border-[#60A5FA] bg-[#F2F7FF] px-2.5 py-1 text-[8px] font-black uppercase tracking-[0.06em] text-blue-700">
                Applies to: {policy.appliesTo || policy.applies_to}
              </span>
            ) : null}
          </div>
        </div>

        <div className="rounded-xl border border-[#E1E8F0] bg-[#FFF8EF] px-3 py-2.5">
          <p className="text-[7px] font-black uppercase tracking-[0.09em] text-slate-500">
            Domain
          </p>
          <p className="mt-1 truncate text-xs font-black text-[#10233F]">
            {policy.domain || "Not recorded"}
          </p>
        </div>

        <div className="rounded-xl border border-[#E1E8F0] bg-[#FFF8EF] px-3 py-2.5">
          <p className="text-[7px] font-black uppercase tracking-[0.09em] text-slate-500">
            Coverage
          </p>
          <p className="mt-1 text-xs font-black text-[#10233F]">
            {coverage === null ? "Not measured" : `${coverage}%`}
          </p>
        </div>

        <div className="rounded-xl border border-[#E1E8F0] bg-[#FFF8EF] px-3 py-2.5">
          <p className="text-[7px] font-black uppercase tracking-[0.09em] text-slate-500">
            Last Reviewed
          </p>
          <p className="mt-1 truncate text-xs font-black text-[#10233F]">
            {updated || "Not recorded"}
          </p>
        </div>
      </div>

      {coverage !== null ? (
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#DDE7F0]">
          <div
            className="h-full rounded-full bg-[#123865] transition-[width] duration-500"
            style={{ width: `${coverage}%` }}
          />
        </div>
      ) : null}
    </article>
  );
}

export default function PolicyKnowledgeHub({
  compact = false,
  records = [],
}) {
  const [query, setQuery] = useState("");
  const [domainFilter, setDomainFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [riskFilter, setRiskFilter] = useState("All");

  const policies = useMemo(() => safeArray(records), [records]);

  const domains = useMemo(
    () => [
      "All",
      ...new Set(
        policies
          .map((policy) => String(policy.domain || "").trim())
          .filter(Boolean)
      ),
    ],
    [policies]
  );

  const statuses = useMemo(
    () => [
      "All",
      ...new Set(
        policies
          .map((policy) => String(policy.status || "").trim())
          .filter(Boolean)
      ),
    ],
    [policies]
  );

  const risks = useMemo(
    () => [
      "All",
      ...new Set(
        policies
          .map((policy) => String(policy.risk || "").trim())
          .filter(Boolean)
      ),
    ],
    [policies]
  );

  const filtered = useMemo(() => {
    const search = lower(query);

    return policies.filter((policy) => {
      if (
        domainFilter !== "All" &&
        String(policy.domain || "") !== domainFilter
      ) {
        return false;
      }

      if (
        statusFilter !== "All" &&
        String(policy.status || "") !== statusFilter
      ) {
        return false;
      }

      if (
        riskFilter !== "All" &&
        String(policy.risk || "") !== riskFilter
      ) {
        return false;
      }

      if (!search) return true;

      return [
        policy.id,
        policy.title,
        policy.domain,
        policy.owner,
        policy.status,
        policy.risk,
        policy.appliesTo,
        policy.applies_to,
        policy.summary,
        policy.description,
      ]
        .map(lower)
        .join(" ")
        .includes(search);
    });
  }, [
    policies,
    query,
    domainFilter,
    statusFilter,
    riskFilter,
  ]);

  const visible = compact ? filtered.slice(0, 5) : filtered;

  const ready = policies.filter((policy) =>
    readyStatus(policy.status)
  ).length;

  const needsReview = policies.filter((policy) =>
    reviewStatus(policy.status)
  ).length;

  const highRisk = policies.filter((policy) =>
    ["high", "critical"].some((value) =>
      lower(policy.risk).includes(value)
    )
  ).length;

  const measurable = policies.filter(hasCoverage);

  const avgCoverage = measurable.length
    ? Math.round(
        measurable.reduce(
          (sum, policy) => sum + Number(policy.coverage),
          0
        ) / measurable.length
      )
    : null;

  const sourceLinked = policies.filter(
    (policy) =>
      policy.source ||
      policy.source_url ||
      policy.sourceUrl ||
      policy.document_url ||
      policy.documentUrl
  ).length;

  const filtersActive =
    Boolean(query.trim()) ||
    domainFilter !== "All" ||
    statusFilter !== "All" ||
    riskFilter !== "All";

  function clearFilters() {
    setQuery("");
    setDomainFilter("All");
    setStatusFilter("All");
    setRiskFilter("All");
  }

  return (
    <section className="min-w-0 overflow-hidden rounded-[1.9rem] border-[3px] border-[#C9D7E6] bg-[#FFFDF8] shadow-[0_14px_38px_rgba(15,35,63,0.07)]">
      <div className="grid border-b-[3px] border-[#F97316] xl:grid-cols-[minmax(0,1.2fr)_minmax(18rem,0.8fr)]">
        <div className="bg-[#123865] p-5 text-white sm:p-6">
          <div className="inline-flex items-center gap-2 rounded-full border-2 border-orange-300/30 bg-orange-400/10 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.12em] text-orange-300">
            <FileText size={12} />
            Policy Governance
          </div>

          <h2 className="mt-3 text-2xl font-black text-white sm:text-3xl">
            Policy Knowledge Hub
          </h2>

          <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-200">
            Controlled internal policy records with ownership, scope, risk,
            source and review evidence. Zaifan does not treat placeholder policy
            examples as approved governance.
          </p>
        </div>

        <div className="bg-[#FF5A0A] p-5 text-white sm:p-6">
          <p className="text-[9px] font-black uppercase tracking-[0.12em]">
            Connected Policies
          </p>

          <p className="mt-2 text-3xl font-black">
            {policies.length}
          </p>

          <p className="mt-2 text-xs font-semibold leading-5 text-orange-50">
            {ready} ready · {needsReview} requiring review · {sourceLinked} source-linked.
          </p>

          <span className="mt-3 inline-flex rounded-full border-2 border-white/25 bg-white/10 px-3 py-1 text-[8px] font-black uppercase tracking-[0.08em]">
            Governance evidence only
          </span>
        </div>
      </div>

      <div className="space-y-5 p-4 sm:p-5">
        {!compact ? (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              label="Policy Records"
              value={policies.length}
              helper="Connected controlled policy records."
              tone="navy"
              icon={FileText}
              badge="Policies"
            />

            <MetricCard
              label="Ready"
              value={ready}
              helper="Approved, live, active, published or verified policies."
              tone="green"
              icon={BadgeCheck}
            />

            <MetricCard
              label="High Risk"
              value={highRisk}
              helper="Policies explicitly marked high or critical risk."
              tone={highRisk > 0 ? "red" : "green"}
              icon={AlertTriangle}
            />

            <MetricCard
              label="Coverage"
              value={avgCoverage === null ? "—" : `${avgCoverage}%`}
              helper={
                avgCoverage === null
                  ? "No measurable policy-coverage evidence is connected."
                  : `Average across ${measurable.length} measurable polic${
                      measurable.length === 1 ? "y" : "ies"
                    }.`
              }
              tone={avgCoverage === null ? "blue" : "violet"}
              icon={Scale}
              badge={avgCoverage === null ? "Not measured" : "Measured"}
            />
          </div>
        ) : null}

        {!compact ? (
          <div className="grid gap-3 xl:grid-cols-[1fr_auto_auto_auto_auto]">
            <label className="relative block">
              <Search
                size={16}
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search policy, owner, domain, scope..."
                className="min-h-11 w-full rounded-xl border-2 border-[#C9D7E6] bg-white pl-11 pr-4 text-sm font-semibold text-[#10233F] outline-none placeholder:text-slate-400 transition focus:border-[#F97316] focus:ring-4 focus:ring-orange-100"
              />
            </label>

            <select
              value={domainFilter}
              onChange={(event) => setDomainFilter(event.target.value)}
              className="min-h-11 rounded-xl border-2 border-[#C9D7E6] bg-white px-3 text-sm font-black text-[#10233F] outline-none focus:border-[#F97316]"
            >
              {domains.map((item) => (
                <option key={item} value={item}>
                  {item === "All" ? "All Domains" : item}
                </option>
              ))}
            </select>

            <select
              value={riskFilter}
              onChange={(event) => setRiskFilter(event.target.value)}
              className="min-h-11 rounded-xl border-2 border-[#C9D7E6] bg-white px-3 text-sm font-black text-[#10233F] outline-none focus:border-[#F97316]"
            >
              {risks.map((item) => (
                <option key={item} value={item}>
                  {item === "All" ? "All Risk Levels" : item}
                </option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(event.target.value)
              }
              className="min-h-11 rounded-xl border-2 border-[#C9D7E6] bg-white px-3 text-sm font-black text-[#10233F] outline-none focus:border-[#F97316]"
            >
              {statuses.map((item) => (
                <option key={item} value={item}>
                  {item === "All" ? "All Statuses" : item}
                </option>
              ))}
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

        <div className="space-y-2.5">
          {visible.length ? (
            visible.map((policy) => (
              <PolicyRow
                key={policy.id || policy.title}
                policy={policy}
              />
            ))
          ) : (
            <div className="rounded-[1.55rem] border-[3px] border-dashed border-[#C9D7E6] bg-white p-8 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border-2 border-[#F97316] bg-[#FFF4E8] text-orange-700">
                <FileText size={24} />
              </div>

              <h3 className="mt-4 text-xl font-black text-[#10233F]">
                No policy records found
              </h3>

              <p className="mx-auto mt-2 max-w-xl text-sm font-semibold leading-6 text-slate-600">
                {filtersActive
                  ? "Clear or change the policy filters."
                  : "Connect real controlled policies before Zaifan reports governance coverage or approval readiness."}
              </p>
            </div>
          )}
        </div>

        {!compact ? (
          <div className="grid gap-3 lg:grid-cols-3">
            <div className="rounded-[1.35rem] border-[3px] border-[#34D399] bg-[#F0FFF8] p-4">
              <div className="flex items-start gap-3">
                <Lock
                  size={17}
                  className="mt-0.5 shrink-0 text-emerald-700"
                />

                <div>
                  <p className="text-[8px] font-black uppercase tracking-[0.11em] text-slate-500">
                    Access Integrity
                  </p>
                  <p className="mt-1 font-black text-[#10233F]">
                    Scope should be explicit
                  </p>
                  <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">
                    Policy applicability and visibility should be defined through
                    real role and access controls.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-[1.35rem] border-[3px] border-[#60A5FA] bg-[#F2F7FF] p-4">
              <div className="flex items-start gap-3">
                <History
                  size={17}
                  className="mt-0.5 shrink-0 text-blue-700"
                />

                <div>
                  <p className="text-[8px] font-black uppercase tracking-[0.11em] text-slate-500">
                    Review History
                  </p>
                  <p className="mt-1 font-black text-[#10233F]">
                    Dates must be recorded
                  </p>
                  <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">
                    Missing review dates remain unknown instead of being replaced
                    with invented compliance schedules.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-[1.35rem] border-[3px] border-[#F59E0B] bg-[#FFF8E8] p-4">
              <div className="flex items-start gap-3">
                <Eye
                  size={17}
                  className="mt-0.5 shrink-0 text-amber-700"
                />

                <div>
                  <p className="text-[8px] font-black uppercase tracking-[0.11em] text-slate-500">
                    Governance Boundary
                  </p>
                  <p className="mt-1 font-black text-[#10233F]">
                    Policy record ≠ compliance proof
                  </p>
                  <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">
                    A published policy does not prove staff followed it. Real
                    compliance evidence belongs in audit and verification logs.
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
