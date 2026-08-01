import React, { useMemo, useState } from "react";
import {
  AlertTriangle,
  BadgeCheck,
  ClipboardCheck,
  Database,
  FileWarning,
  Globe2,
  Plane,
  Search,
  ShieldCheck,
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
    value.includes("verified") ||
    value.includes("published")
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

function hasCompleteness(guide = {}) {
  return (
    guide.completeness !== null &&
    guide.completeness !== undefined &&
    Number.isFinite(Number(guide.completeness))
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

function GuideRow({ guide }) {
  const completenessAvailable = hasCompleteness(guide);
  const completeness = completenessAvailable
    ? clampPercent(guide.completeness)
    : null;

  const source =
    guide.source ||
    guide.source_url ||
    guide.sourceUrl ||
    guide.official_source ||
    guide.officialSource ||
    null;

  const updated =
    guide.updated ||
    guide.updated_at ||
    guide.updatedAt ||
    guide.last_verified_at ||
    guide.lastVerifiedAt ||
    null;

  return (
    <article className="rounded-[1.3rem] border-[3px] border-[#C9D7E6] bg-white p-4 shadow-[0_8px_22px_rgba(15,35,63,0.05)] transition hover:-translate-y-0.5 hover:border-[#F97316]">
      <div className="grid min-w-0 gap-4 lg:grid-cols-[minmax(19rem,1.5fr)_12rem_10rem_11rem] lg:items-center">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="min-w-0 [overflow-wrap:anywhere] font-black text-[#10233F]">
              {guide.title || "Untitled visa guide"}
            </p>

            <span
              className={`rounded-full border-2 px-2.5 py-1 text-[8px] font-black uppercase tracking-[0.07em] ${statusTone(
                guide.status
              )}`}
            >
              {guide.status || "Unknown"}
            </span>

            {guide.risk ? (
              <span
                className={`rounded-full border-2 px-2.5 py-1 text-[8px] font-black uppercase tracking-[0.07em] ${riskTone(
                  guide.risk
                )}`}
              >
                {guide.risk}
              </span>
            ) : null}
          </div>

          <p className="mt-1 text-[11px] font-semibold leading-4 text-slate-500">
            {[
              guide.id,
              guide.country && guide.destination
                ? `${guide.country} → ${guide.destination}`
                : guide.destination || guide.country,
              guide.category,
              guide.owner ? `Owner: ${guide.owner}` : null,
            ]
              .filter(Boolean)
              .join(" · ")}
          </p>

          {guide.summary || guide.description || guide.requirement ? (
            <p className="mt-2 text-xs font-semibold leading-5 text-slate-600">
              {guide.summary || guide.description || guide.requirement}
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
              {source ? "Official source linked" : "Source not recorded"}
            </span>
          </div>
        </div>

        <div className="rounded-xl border border-[#E1E8F0] bg-[#FFF8EF] px-3 py-2.5">
          <p className="text-[7px] font-black uppercase tracking-[0.09em] text-slate-500">
            Destination
          </p>
          <p className="mt-1 truncate text-xs font-black text-[#10233F]">
            {guide.destination || "Not recorded"}
          </p>
        </div>

        <div className="rounded-xl border border-[#E1E8F0] bg-[#FFF8EF] px-3 py-2.5">
          <p className="text-[7px] font-black uppercase tracking-[0.09em] text-slate-500">
            Completeness
          </p>
          <p className="mt-1 text-xs font-black text-[#10233F]">
            {completeness === null ? "Not measured" : `${completeness}%`}
          </p>
        </div>

        <div className="rounded-xl border border-[#E1E8F0] bg-[#FFF8EF] px-3 py-2.5">
          <p className="text-[7px] font-black uppercase tracking-[0.09em] text-slate-500">
            Last Verified
          </p>
          <p className="mt-1 truncate text-xs font-black text-[#10233F]">
            {updated || "Not recorded"}
          </p>
        </div>
      </div>

      {completeness !== null ? (
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#DDE7F0]">
          <div
            className="h-full rounded-full bg-[#123865] transition-[width] duration-500"
            style={{ width: `${completeness}%` }}
          />
        </div>
      ) : null}
    </article>
  );
}

export default function VisaKnowledgeHub({
  compact = false,
  records = [],
}) {
  const [query, setQuery] = useState("");
  const [destinationFilter, setDestinationFilter] = useState("All");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");

  const guides = useMemo(() => safeArray(records), [records]);

  const destinations = useMemo(
    () => [
      "All",
      ...new Set(
        guides
          .map((guide) => String(guide.destination || "").trim())
          .filter(Boolean)
      ),
    ],
    [guides]
  );

  const categories = useMemo(
    () => [
      "All",
      ...new Set(
        guides
          .map((guide) => String(guide.category || "").trim())
          .filter(Boolean)
      ),
    ],
    [guides]
  );

  const statuses = useMemo(
    () => [
      "All",
      ...new Set(
        guides
          .map((guide) => String(guide.status || "").trim())
          .filter(Boolean)
      ),
    ],
    [guides]
  );

  const filtered = useMemo(() => {
    const search = lower(query);

    return guides.filter((guide) => {
      if (
        destinationFilter !== "All" &&
        String(guide.destination || "") !== destinationFilter
      ) {
        return false;
      }

      if (
        categoryFilter !== "All" &&
        String(guide.category || "") !== categoryFilter
      ) {
        return false;
      }

      if (
        statusFilter !== "All" &&
        String(guide.status || "") !== statusFilter
      ) {
        return false;
      }

      if (!search) return true;

      return [
        guide.id,
        guide.title,
        guide.country,
        guide.destination,
        guide.category,
        guide.status,
        guide.risk,
        guide.owner,
        guide.summary,
        guide.description,
        guide.requirement,
      ]
        .map(lower)
        .join(" ")
        .includes(search);
    });
  }, [
    guides,
    query,
    destinationFilter,
    categoryFilter,
    statusFilter,
  ]);

  const visible = compact ? filtered.slice(0, 5) : filtered;

  const ready = guides.filter((guide) =>
    readyStatus(guide.status)
  ).length;

  const needsReview = guides.filter((guide) =>
    reviewStatus(guide.status)
  ).length;

  const highRisk = guides.filter((guide) =>
    ["high", "critical"].some((value) =>
      lower(guide.risk).includes(value)
    )
  ).length;

  const measurable = guides.filter(hasCompleteness);

  const avgCompleteness = measurable.length
    ? Math.round(
        measurable.reduce(
          (sum, guide) => sum + Number(guide.completeness),
          0
        ) / measurable.length
      )
    : null;

  const sourceLinked = guides.filter(
    (guide) =>
      guide.source ||
      guide.source_url ||
      guide.sourceUrl ||
      guide.official_source ||
      guide.officialSource
  ).length;

  const filtersActive =
    Boolean(query.trim()) ||
    destinationFilter !== "All" ||
    categoryFilter !== "All" ||
    statusFilter !== "All";

  function clearFilters() {
    setQuery("");
    setDestinationFilter("All");
    setCategoryFilter("All");
    setStatusFilter("All");
  }

  return (
    <section className="min-w-0 overflow-hidden rounded-[1.9rem] border-[3px] border-[#C9D7E6] bg-[#FFFDF8] shadow-[0_14px_38px_rgba(15,35,63,0.07)]">
      <div className="grid border-b-[3px] border-[#F97316] xl:grid-cols-[minmax(0,1.2fr)_minmax(18rem,0.8fr)]">
        <div className="bg-[#123865] p-5 text-white sm:p-6">
          <div className="inline-flex items-center gap-2 rounded-full border-2 border-orange-300/30 bg-orange-400/10 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.12em] text-orange-300">
            <ShieldCheck size={12} />
            Visa Knowledge
          </div>

          <h2 className="mt-3 text-2xl font-black text-white sm:text-3xl">
            Visa Evidence & Guidance
          </h2>

          <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-200">
            Destination-specific visa guidance with explicit source, freshness,
            risk and completeness evidence. Zaifan does not treat unsourced or
            stale immigration guidance as operational truth.
          </p>
        </div>

        <div className="bg-[#FF5A0A] p-5 text-white sm:p-6">
          <p className="text-[9px] font-black uppercase tracking-[0.12em]">
            Connected Visa Guides
          </p>

          <p className="mt-2 text-3xl font-black">
            {guides.length}
          </p>

          <p className="mt-2 text-xs font-semibold leading-5 text-orange-50">
            {ready} ready · {needsReview} requiring review · {sourceLinked} source-linked.
          </p>

          <span className="mt-3 inline-flex rounded-full border-2 border-white/25 bg-white/10 px-3 py-1 text-[8px] font-black uppercase tracking-[0.08em]">
            Official-source aware
          </span>
        </div>
      </div>

      <div className="space-y-5 p-4 sm:p-5">
        {!compact ? (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              label="Visa Guides"
              value={guides.length}
              helper="Connected destination visa and evidence records."
              tone="navy"
              icon={ShieldCheck}
              badge="Guides"
            />

            <MetricCard
              label="Ready"
              value={ready}
              helper="Approved, live, active, verified or published guides."
              tone="green"
              icon={BadgeCheck}
            />

            <MetricCard
              label="High Risk"
              value={highRisk}
              helper="Guides explicitly marked high or critical risk."
              tone={highRisk > 0 ? "red" : "green"}
              icon={AlertTriangle}
            />

            <MetricCard
              label="Completeness"
              value={avgCompleteness === null ? "—" : `${avgCompleteness}%`}
              helper={
                avgCompleteness === null
                  ? "No measurable visa-guide completeness evidence is connected."
                  : `Average across ${measurable.length} measurable guide${
                      measurable.length === 1 ? "" : "s"
                    }.`
              }
              tone={avgCompleteness === null ? "blue" : "violet"}
              icon={ClipboardCheck}
              badge={avgCompleteness === null ? "Not measured" : "Measured"}
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
                placeholder="Search visa guide, category, risk, owner..."
                className="min-h-11 w-full rounded-xl border-2 border-[#C9D7E6] bg-white pl-11 pr-4 text-sm font-semibold text-[#10233F] outline-none placeholder:text-slate-400 transition focus:border-[#F97316] focus:ring-4 focus:ring-orange-100"
              />
            </label>

            <select
              value={destinationFilter}
              onChange={(event) =>
                setDestinationFilter(event.target.value)
              }
              className="min-h-11 rounded-xl border-2 border-[#C9D7E6] bg-white px-3 text-sm font-black text-[#10233F] outline-none focus:border-[#F97316]"
            >
              {destinations.map((item) => (
                <option key={item} value={item}>
                  {item === "All" ? "All Destinations" : item}
                </option>
              ))}
            </select>

            <select
              value={categoryFilter}
              onChange={(event) =>
                setCategoryFilter(event.target.value)
              }
              className="min-h-11 rounded-xl border-2 border-[#C9D7E6] bg-white px-3 text-sm font-black text-[#10233F] outline-none focus:border-[#F97316]"
            >
              {categories.map((item) => (
                <option key={item} value={item}>
                  {item === "All" ? "All Categories" : item}
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
            visible.map((guide) => (
              <GuideRow
                key={guide.id || guide.title}
                guide={guide}
              />
            ))
          ) : (
            <div className="rounded-[1.55rem] border-[3px] border-dashed border-[#C9D7E6] bg-white p-8 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border-2 border-[#F97316] bg-[#FFF4E8] text-orange-700">
                <ShieldCheck size={24} />
              </div>

              <h3 className="mt-4 text-xl font-black text-[#10233F]">
                No visa knowledge found
              </h3>

              <p className="mx-auto mt-2 max-w-xl text-sm font-semibold leading-6 text-slate-600">
                {filtersActive
                  ? "Clear or change the visa knowledge filters."
                  : "Connect real visa guidance with source and verification evidence before Zaifan relies on it."}
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
                    Source Integrity
                  </p>
                  <p className="mt-1 font-black text-[#10233F]">
                    Official source preferred
                  </p>
                  <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">
                    Visa guidance should retain a current official source,
                    verification date and responsible owner.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-[1.35rem] border-[3px] border-[#60A5FA] bg-[#F2F7FF] p-4">
              <div className="flex items-start gap-3">
                <Plane
                  size={17}
                  className="mt-0.5 shrink-0 text-blue-700"
                />

                <div>
                  <p className="text-[8px] font-black uppercase tracking-[0.11em] text-slate-500">
                    Destination Boundary
                  </p>
                  <p className="mt-1 font-black text-[#10233F]">
                    Rules are destination-specific
                  </p>
                  <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">
                    Evidence requirements must not be reused across destinations
                    unless the underlying official rules genuinely match.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-[1.35rem] border-[3px] border-[#F59E0B] bg-[#FFF8E8] p-4">
              <div className="flex items-start gap-3">
                <FileWarning
                  size={17}
                  className="mt-0.5 shrink-0 text-amber-700"
                />

                <div>
                  <p className="text-[8px] font-black uppercase tracking-[0.11em] text-slate-500">
                    Decision Boundary
                  </p>
                  <p className="mt-1 font-black text-[#10233F]">
                    Guidance ≠ visa guarantee
                  </p>
                  <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">
                    Knowledge helps staff prepare evidence. It must never be
                    presented as a guaranteed visa result or substitute for
                    current official immigration requirements.
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
