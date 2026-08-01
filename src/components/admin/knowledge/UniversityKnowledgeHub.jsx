import React, { useMemo, useState } from "react";
import {
  AlertTriangle,
  BadgeCheck,
  CalendarClock,
  Database,
  FileText,
  Globe2,
  Landmark,
  MapPin,
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
    value.includes("active") ||
    value.includes("approved") ||
    value.includes("live") ||
    value.includes("verified") ||
    value.includes("published")
  );
}

function reviewStatus(status = "") {
  const value = lower(status);
  return (
    value.includes("review") ||
    value.includes("draft") ||
    value.includes("stale") ||
    value.includes("expired") ||
    value.includes("unverified")
  );
}

function hasConfidence(rule = {}) {
  return (
    rule.confidence !== null &&
    rule.confidence !== undefined &&
    Number.isFinite(Number(rule.confidence))
  );
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

function confidenceTone(value) {
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

function RuleRow({ rule }) {
  const confidenceAvailable = hasConfidence(rule);
  const confidence = confidenceAvailable
    ? Math.max(0, Math.min(100, safeNumber(rule.confidence)))
    : null;

  const updated =
    rule.updated ||
    rule.updated_at ||
    rule.updatedAt ||
    rule.last_verified_at ||
    rule.lastVerifiedAt ||
    null;

  const source =
    rule.source ||
    rule.source_url ||
    rule.sourceUrl ||
    rule.official_source ||
    rule.officialSource ||
    null;

  return (
    <article className="rounded-[1.3rem] border-[3px] border-[#C9D7E6] bg-white p-4 shadow-[0_8px_22px_rgba(15,35,63,0.05)] transition hover:-translate-y-0.5 hover:border-[#F97316]">
      <div className="grid min-w-0 gap-4 lg:grid-cols-[minmax(19rem,1.5fr)_12rem_10rem_11rem] lg:items-center">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="min-w-0 [overflow-wrap:anywhere] font-black text-[#10233F]">
              {rule.university || rule.title || "Unnamed university rule"}
            </p>

            <span
              className={`rounded-full border-2 px-2.5 py-1 text-[8px] font-black uppercase tracking-[0.07em] ${statusTone(
                rule.status
              )}`}
            >
              {rule.status || "Unknown"}
            </span>

            {rule.ruleType || rule.rule_type ? (
              <span className="rounded-full border-2 border-[#9B6CFF] bg-[#F8F5FF] px-2.5 py-1 text-[8px] font-black uppercase tracking-[0.07em] text-violet-700">
                {rule.ruleType || rule.rule_type}
              </span>
            ) : null}
          </div>

          <p className="mt-1 text-[11px] font-semibold leading-4 text-slate-500">
            {[
              rule.id,
              rule.country,
              rule.intake,
              rule.owner ? `Owner: ${rule.owner}` : null,
            ]
              .filter(Boolean)
              .join(" · ")}
          </p>

          {rule.requirement || rule.summary || rule.description ? (
            <p className="mt-2 text-xs font-semibold leading-5 text-slate-600">
              {rule.requirement || rule.summary || rule.description}
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
            {rule.country || "Not recorded"}
          </p>
        </div>

        <div>
          <p className="text-[7px] font-black uppercase tracking-[0.09em] text-slate-500">
            Confidence
          </p>

          <span
            className={`mt-1 inline-flex rounded-full border-2 px-2.5 py-1 text-[8px] font-black uppercase tracking-[0.07em] ${confidenceTone(
              confidence
            )}`}
          >
            {confidence === null ? "Not measured" : `${confidence}%`}
          </span>
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

      {confidence !== null ? (
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#DDE7F0]">
          <div
            className="h-full rounded-full bg-[#123865] transition-[width] duration-500"
            style={{ width: `${confidence}%` }}
          />
        </div>
      ) : null}
    </article>
  );
}

export default function UniversityKnowledgeHub({
  compact = false,
  records = [],
}) {
  const [query, setQuery] = useState("");
  const [country, setCountry] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [ruleFilter, setRuleFilter] = useState("All");

  const rules = useMemo(() => safeArray(records), [records]);

  const countries = useMemo(
    () => [
      "All",
      ...new Set(
        rules
          .map((rule) => String(rule.country || "").trim())
          .filter(Boolean)
      ),
    ],
    [rules]
  );

  const statuses = useMemo(
    () => [
      "All",
      ...new Set(
        rules
          .map((rule) => String(rule.status || "").trim())
          .filter(Boolean)
      ),
    ],
    [rules]
  );

  const ruleTypes = useMemo(
    () => [
      "All",
      ...new Set(
        rules
          .map((rule) =>
            String(rule.ruleType || rule.rule_type || "").trim()
          )
          .filter(Boolean)
      ),
    ],
    [rules]
  );

  const filtered = useMemo(() => {
    const search = lower(query);

    return rules.filter((rule) => {
      if (
        country !== "All" &&
        String(rule.country || "") !== country
      ) {
        return false;
      }

      if (
        statusFilter !== "All" &&
        String(rule.status || "") !== statusFilter
      ) {
        return false;
      }

      if (
        ruleFilter !== "All" &&
        String(rule.ruleType || rule.rule_type || "") !== ruleFilter
      ) {
        return false;
      }

      if (!search) return true;

      return [
        rule.id,
        rule.university,
        rule.title,
        rule.country,
        rule.intake,
        rule.ruleType,
        rule.rule_type,
        rule.requirement,
        rule.summary,
        rule.description,
        rule.status,
        rule.owner,
      ]
        .map(lower)
        .join(" ")
        .includes(search);
    });
  }, [rules, query, country, statusFilter, ruleFilter]);

  const visible = compact ? filtered.slice(0, 5) : filtered;

  const active = rules.filter((rule) =>
    readyStatus(rule.status)
  ).length;

  const needsReview = rules.filter((rule) =>
    reviewStatus(rule.status)
  ).length;

  const confidenceRows = rules.filter(hasConfidence);

  const avgConfidence = confidenceRows.length
    ? Math.round(
        confidenceRows.reduce(
          (sum, rule) => sum + Number(rule.confidence),
          0
        ) / confidenceRows.length
      )
    : null;

  const sourceLinked = rules.filter(
    (rule) =>
      rule.source ||
      rule.source_url ||
      rule.sourceUrl ||
      rule.official_source ||
      rule.officialSource
  ).length;

  const filtersActive =
    Boolean(query.trim()) ||
    country !== "All" ||
    statusFilter !== "All" ||
    ruleFilter !== "All";

  function clearFilters() {
    setQuery("");
    setCountry("All");
    setStatusFilter("All");
    setRuleFilter("All");
  }

  return (
    <section className="min-w-0 overflow-hidden rounded-[1.9rem] border-[3px] border-[#C9D7E6] bg-[#FFFDF8] shadow-[0_14px_38px_rgba(15,35,63,0.07)]">
      <div className="grid border-b-[3px] border-[#F97316] xl:grid-cols-[minmax(0,1.2fr)_minmax(18rem,0.8fr)]">
        <div className="bg-[#123865] p-5 text-white sm:p-6">
          <div className="inline-flex items-center gap-2 rounded-full border-2 border-orange-300/30 bg-orange-400/10 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.12em] text-orange-300">
            <Landmark size={12} />
            University Knowledge
          </div>

          <h2 className="mt-3 text-2xl font-black text-white sm:text-3xl">
            University Rules & Planning Evidence
          </h2>

          <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-200">
            University-specific requirements, intake rules and planning evidence
            with explicit freshness and source visibility. Zaifan does not treat
            unsourced destination rules as operational truth.
          </p>
        </div>

        <div className="bg-[#FF5A0A] p-5 text-white sm:p-6">
          <p className="text-[9px] font-black uppercase tracking-[0.12em]">
            Connected Rules
          </p>

          <p className="mt-2 text-3xl font-black">
            {rules.length}
          </p>

          <p className="mt-2 text-xs font-semibold leading-5 text-orange-50">
            {countries.length - 1} destination
            {countries.length - 1 === 1 ? "" : "s"} · {sourceLinked} source-linked rule
            {sourceLinked === 1 ? "" : "s"}.
          </p>

          <span className="mt-3 inline-flex rounded-full border-2 border-white/25 bg-white/10 px-3 py-1 text-[8px] font-black uppercase tracking-[0.08em]">
            Source-aware
          </span>
        </div>
      </div>

      <div className="space-y-5 p-4 sm:p-5">
        {!compact ? (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              label="Rule Records"
              value={rules.length}
              helper="Connected university-specific knowledge records."
              tone="navy"
              icon={Landmark}
              badge="Rules"
            />

            <MetricCard
              label="Ready"
              value={active}
              helper="Active, approved, live, verified or published university rules."
              tone="green"
              icon={BadgeCheck}
            />

            <MetricCard
              label="Needs Review"
              value={needsReview}
              helper="Draft, review, stale, expired or unverified rule records."
              tone={needsReview > 0 ? "amber" : "green"}
              icon={AlertTriangle}
            />

            <MetricCard
              label="Confidence"
              value={avgConfidence === null ? "—" : `${avgConfidence}%`}
              helper={
                avgConfidence === null
                  ? "No measurable confidence evidence is connected."
                  : `Average across ${confidenceRows.length} measurable rule${
                      confidenceRows.length === 1 ? "" : "s"
                    }.`
              }
              tone={avgConfidence === null ? "blue" : "violet"}
              icon={Globe2}
              badge={avgConfidence === null ? "Not measured" : "Measured"}
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
                placeholder="Search university, rule, intake, owner..."
                className="min-h-11 w-full rounded-xl border-2 border-[#C9D7E6] bg-white pl-11 pr-4 text-sm font-semibold text-[#10233F] outline-none placeholder:text-slate-400 transition focus:border-[#F97316] focus:ring-4 focus:ring-orange-100"
              />
            </label>

            <select
              value={country}
              onChange={(event) => setCountry(event.target.value)}
              className="min-h-11 rounded-xl border-2 border-[#C9D7E6] bg-white px-3 text-sm font-black text-[#10233F] outline-none focus:border-[#F97316]"
            >
              {countries.map((item) => (
                <option key={item} value={item}>
                  {item === "All" ? "All Destinations" : item}
                </option>
              ))}
            </select>

            <select
              value={ruleFilter}
              onChange={(event) => setRuleFilter(event.target.value)}
              className="min-h-11 rounded-xl border-2 border-[#C9D7E6] bg-white px-3 text-sm font-black text-[#10233F] outline-none focus:border-[#F97316]"
            >
              {ruleTypes.map((item) => (
                <option key={item} value={item}>
                  {item === "All" ? "All Rule Types" : item}
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
            visible.map((rule) => (
              <RuleRow
                key={rule.id || `${rule.university}-${rule.ruleType}`}
                rule={rule}
              />
            ))
          ) : (
            <div className="rounded-[1.55rem] border-[3px] border-dashed border-[#C9D7E6] bg-white p-8 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border-2 border-[#F97316] bg-[#FFF4E8] text-orange-700">
                <Landmark size={24} />
              </div>

              <h3 className="mt-4 text-xl font-black text-[#10233F]">
                No university rules found
              </h3>

              <p className="mx-auto mt-2 max-w-xl text-sm font-semibold leading-6 text-slate-600">
                {filtersActive
                  ? "Clear or change the university knowledge filters."
                  : "Connect real university rules with source and verification evidence before Zaifan relies on them."}
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
                    Every important university rule should retain an official or
                    verifiable source rather than relying on memory.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-[1.35rem] border-[3px] border-[#60A5FA] bg-[#F2F7FF] p-4">
              <div className="flex items-start gap-3">
                <CalendarClock
                  size={17}
                  className="mt-0.5 shrink-0 text-blue-700"
                />

                <div>
                  <p className="text-[8px] font-black uppercase tracking-[0.11em] text-slate-500">
                    Freshness Boundary
                  </p>
                  <p className="mt-1 font-black text-[#10233F]">
                    Intake rules can change
                  </p>
                  <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">
                    Intake, deposit, English and offer conditions should show a
                    real verification date before counselors rely on them.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-[1.35rem] border-[3px] border-[#F59E0B] bg-[#FFF8E8] p-4">
              <div className="flex items-start gap-3">
                <FileText
                  size={17}
                  className="mt-0.5 shrink-0 text-amber-700"
                />

                <div>
                  <p className="text-[8px] font-black uppercase tracking-[0.11em] text-slate-500">
                    Planning Boundary
                  </p>
                  <p className="mt-1 font-black text-[#10233F]">
                    Rule record ≠ admission guarantee
                  </p>
                  <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">
                    University knowledge supports planning. It must never be
                    presented as a guaranteed offer, admission or visa outcome.
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
