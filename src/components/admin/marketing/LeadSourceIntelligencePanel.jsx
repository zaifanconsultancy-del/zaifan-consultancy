import React, { useMemo, useState } from "react";
import {
  AlertTriangle,
  BadgeCheck,
  Compass,
  Database,
  Globe2,
  Search,
  ShieldCheck,
  Target,
  TrendingUp,
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

function percent(value) {
  return `${Math.round(safeNumber(value))}%`;
}

function hasAttribution(source = {}) {
  return Boolean(
    source?.name &&
      lower(source.name) !== "unknown" &&
      lower(source.name) !== "untracked" &&
      lower(source.name) !== "untracked source"
  );
}

function hasRoiEvidence(source = {}) {
  return safeNumber(source?.spend) > 0;
}

function hasConversionEvidence(source = {}) {
  return (
    safeNumber(source?.leads) > 0 ||
    safeNumber(source?.applications) > 0 ||
    safeNumber(source?.offers) > 0 ||
    safeNumber(source?.cas) > 0 ||
    safeNumber(source?.visas) > 0
  );
}

function qualityLabel(source = {}) {
  if (!hasAttribution(source)) {
    return {
      label: "Attribution missing",
      className: "border-[#F59E0B] bg-[#FFF8E8] text-amber-800",
    };
  }

  if (!hasConversionEvidence(source)) {
    return {
      label: "Not measured",
      className: "border-[#60A5FA] bg-[#F2F7FF] text-blue-700",
    };
  }

  if (safeNumber(source.visas) > 0) {
    return {
      label: "Late-stage evidence",
      className: "border-[#34D399] bg-[#F0FFF8] text-emerald-700",
    };
  }

  if (safeNumber(source.offers) > 0 || safeNumber(source.cas) > 0) {
    return {
      label: "Deep funnel",
      className: "border-[#9B6CFF] bg-[#F8F5FF] text-violet-700",
    };
  }

  if (safeNumber(source.applications) > 0) {
    return {
      label: "Converting",
      className: "border-[#60A5FA] bg-[#F2F7FF] text-blue-700",
    };
  }

  return {
    label: "Lead only",
    className: "border-[#F97316] bg-[#FFF4E8] text-orange-700",
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
            className={`mt-2 text-2xl font-black ${
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

function SourceRow({ source, compact = false }) {
  const state = qualityLabel(source);
  const attributionKnown = hasAttribution(source);
  const roiMeasured = hasRoiEvidence(source);

  const countries = safeArray(source.countries).slice(0, compact ? 3 : 5);

  return (
    <article className="rounded-[1.3rem] border-2 border-[#C9D7E6] bg-white p-4 shadow-[0_6px_18px_rgba(15,35,63,0.04)] transition hover:border-[#F97316]">
      <div
        className={
          compact
            ? "grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(250px,0.95fr)] xl:items-center"
            : "grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(300px,0.95fr)_minmax(150px,0.42fr)] xl:items-center"
        }
      >
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="min-w-0 [overflow-wrap:anywhere] text-lg font-black text-[#10233F]">
              {source.name || "Unknown source"}
            </p>

            <span
              className={`rounded-full border-2 px-2.5 py-1 text-[8px] font-black uppercase tracking-[0.07em] ${state.className}`}
            >
              {state.label}
            </span>
          </div>

          <p className="mt-1 text-xs font-semibold text-slate-500">
            {safeNumber(source.leads)} lead
            {safeNumber(source.leads) === 1 ? "" : "s"} ·{" "}
            {safeNumber(source.applications)} application
            {safeNumber(source.applications) === 1 ? "" : "s"}
          </p>

          {countries.length ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {countries.map((country) => (
                <span
                  key={`${country.name}-${country.count}`}
                  className="rounded-full border-2 border-[#60A5FA] bg-[#F2F7FF] px-2.5 py-1 text-[8px] font-black uppercase tracking-[0.06em] text-blue-700"
                >
                  {country.name || "Unknown"} · {safeNumber(country.count)}
                </span>
              ))}
            </div>
          ) : null}
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-xl border border-[#E1E8F0] bg-[#FFF8EF] px-3 py-2.5 text-center">
            <p className="text-[7px] font-black uppercase tracking-[0.09em] text-slate-500">
              Lead → App
            </p>
            <p className="mt-1 text-sm font-black text-[#10233F]">
              {safeNumber(source.leads) > 0
                ? percent(source.applicationRate)
                : "—"}
            </p>
          </div>

          <div className="rounded-xl border border-[#E1E8F0] bg-[#FFF8EF] px-3 py-2.5 text-center">
            <p className="text-[7px] font-black uppercase tracking-[0.09em] text-slate-500">
              App → Offer
            </p>
            <p className="mt-1 text-sm font-black text-[#10233F]">
              {safeNumber(source.applications) > 0
                ? percent(source.offerRate)
                : "—"}
            </p>
          </div>

          <div className="rounded-xl border border-[#E1E8F0] bg-[#FFF8EF] px-3 py-2.5 text-center">
            <p className="text-[7px] font-black uppercase tracking-[0.09em] text-slate-500">
              CAS → Visa
            </p>
            <p className="mt-1 text-sm font-black text-[#10233F]">
              {safeNumber(source.cas) > 0 ? percent(source.visaRate) : "—"}
            </p>
          </div>
        </div>

        <div
          className={
            compact
              ? "min-w-0 xl:col-span-2 xl:flex xl:items-center xl:justify-between xl:gap-4 xl:border-t xl:border-[#E1E8F0] xl:pt-3"
              : "min-w-0"
          }
        >
          <div className={compact ? "flex flex-wrap items-center gap-2" : ""}>
            <p className="text-[7px] font-black uppercase tracking-[0.09em] text-slate-500">
              ROI
            </p>

            <span
              className={`inline-flex max-w-full whitespace-nowrap rounded-full border-2 px-2.5 py-1 text-[8px] font-black uppercase tracking-[0.07em] ${
                compact ? "" : "mt-1"
              } ${
                roiMeasured
                  ? safeNumber(source.roi) >= 0
                    ? "border-[#34D399] bg-[#F0FFF8] text-emerald-700"
                    : "border-[#FB7185] bg-[#FFF4F4] text-red-700"
                  : "border-[#60A5FA] bg-[#F2F7FF] text-blue-700"
              }`}
            >
              {roiMeasured ? percent(source.roi) : "Not measured"}
            </span>
          </div>

          {!compact ? (
            <p className="mt-2 text-[10px] font-semibold leading-4 text-slate-500">
              {roiMeasured
                ? "Calculated only because spend evidence exists."
                : "Spend evidence required before ROI is meaningful."}
            </p>
          ) : (
            <p className="mt-2 text-[10px] font-semibold leading-4 text-slate-500 xl:mt-0 xl:text-right">
              {roiMeasured ? "Spend-linked ROI" : "Spend not recorded"}
            </p>
          )}
        </div>
      </div>

      {!compact && !attributionKnown ? (
        <div className="mt-3 flex items-start gap-3 rounded-xl border-2 border-[#F59E0B] bg-[#FFF8E8] p-3">
          <AlertTriangle
            size={15}
            className="mt-0.5 shrink-0 text-amber-700"
          />
          <p className="text-xs font-semibold leading-5 text-slate-600">
            This row contains funnel activity but no confirmed source attribution.
            Keep the evidence visible, but do not treat it as a real source-quality
            judgement until attribution is fixed.
          </p>
        </div>
      ) : null}
    </article>
  );
}

export default function LeadSourceIntelligencePanel({
  marketing = {},
  compact = false,
}) {
  const [query, setQuery] = useState("");
  const [sourceState, setSourceState] = useState("all");
  const [sortBy, setSortBy] = useState("funnel");

  const sources = useMemo(
    () => safeArray(marketing.sources),
    [marketing.sources]
  );

  const filtered = useMemo(() => {
    const search = lower(query);

    const rows = sources.filter((source) => {
      const attributed = hasAttribution(source);

      if (sourceState === "attributed" && !attributed) {
        return false;
      }

      if (sourceState === "missing" && attributed) {
        return false;
      }

      if (!search) return true;

      return [
        source.name,
        ...safeArray(source.countries).map((country) => country.name),
      ]
        .map(lower)
        .join(" ")
        .includes(search);
    });

    return rows.sort((a, b) => {
      if (sortBy === "leads") {
        return safeNumber(b.leads) - safeNumber(a.leads);
      }

      if (sortBy === "visas") {
        return safeNumber(b.visas) - safeNumber(a.visas);
      }

      if (sortBy === "roi") {
        const aMeasured = hasRoiEvidence(a);
        const bMeasured = hasRoiEvidence(b);

        if (aMeasured !== bMeasured) {
          return bMeasured ? 1 : -1;
        }

        return safeNumber(b.roi, -999999) - safeNumber(a.roi, -999999);
      }

      // Funnel depth first. This intentionally avoids the synthetic score field
      // created by buildMarketingOSData.
      const depth = (source) =>
        safeNumber(source.visas) * 5 +
        safeNumber(source.cas) * 4 +
        safeNumber(source.offers) * 3 +
        safeNumber(source.applications) * 2 +
        safeNumber(source.leads);

      return depth(b) - depth(a);
    });
  }, [sources, query, sourceState, sortBy]);

  const visible = compact ? filtered.slice(0, 4) : filtered;

  const attributedSources = sources.filter(hasAttribution);
  const missingAttribution = sources.filter(
    (source) => !hasAttribution(source)
  );
  const convertingSources = attributedSources.filter(
    (source) => safeNumber(source.applications) > 0
  );
  const visaSources = attributedSources.filter(
    (source) => safeNumber(source.visas) > 0
  );

  const filtersActive =
    Boolean(query.trim()) ||
    sourceState !== "all" ||
    sortBy !== "funnel";

  function clearFilters() {
    setQuery("");
    setSourceState("all");
    setSortBy("funnel");
  }

  return (
    <section className="min-w-0 overflow-hidden rounded-[1.9rem] border-[3px] border-[#C9D7E6] bg-[#FFFDF8] shadow-[0_14px_38px_rgba(15,35,63,0.07)]">
      <div className="grid border-b-[3px] border-[#F97316] xl:grid-cols-[minmax(0,1.2fr)_minmax(18rem,0.8fr)]">
        <div className="bg-[#123865] p-5 text-white sm:p-6">
          <div className="inline-flex items-center gap-2 rounded-full border-2 border-orange-300/30 bg-orange-400/10 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.12em] text-orange-300">
            <Compass size={12} />
            Lead Source Intelligence
          </div>

          <h2 className="mt-3 text-2xl font-black text-white sm:text-3xl">
            Source Attribution & Funnel Quality
          </h2>

          <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-200">
            Compare where students came from and how far each attributed source
            moves through the real funnel. Zaifan no longer presents the old
            synthetic weighted score as if it were a measured quality percentage.
          </p>
        </div>

        <div className="bg-[#FF5A0A] p-5 text-white sm:p-6">
          <p className="text-[9px] font-black uppercase tracking-[0.12em]">
            Source Coverage
          </p>

          <p className="mt-2 text-3xl font-black">
            {attributedSources.length}/{sources.length}
          </p>

          <p className="mt-2 text-xs font-semibold leading-5 text-orange-50">
            Confirmed source identities in the current marketing snapshot.
          </p>

          <span className="mt-3 inline-flex rounded-full border-2 border-white/25 bg-white/10 px-3 py-1 text-[8px] font-black uppercase tracking-[0.08em]">
            Attribution-aware
          </span>
        </div>
      </div>

      <div className="space-y-5 p-4 sm:p-5">
        {!compact ? (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              label="Attributed Sources"
              value={attributedSources.length}
              helper="Named lead-source identities in the current snapshot."
              tone="navy"
              icon={Compass}
              badge="Sources"
            />

            <MetricCard
              label="Converting"
              value={convertingSources.length}
              helper="Attributed sources with at least one recorded application."
              tone="green"
              icon={TrendingUp}
            />

            <MetricCard
              label="Visa Evidence"
              value={visaSources.length}
              helper="Attributed sources with at least one recorded visa outcome."
              tone="violet"
              icon={BadgeCheck}
            />

            <MetricCard
              label="Missing Attribution"
              value={missingAttribution.length}
              helper="Source buckets that remain unknown or untracked."
              tone={missingAttribution.length > 0 ? "amber" : "green"}
              icon={AlertTriangle}
            />
          </div>
        ) : null}

        {!compact ? (
          <div className="grid gap-3 xl:grid-cols-[1fr_auto_auto_auto]">
            <label className="relative block">
              <Search
                size={16}
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search source or destination..."
                className="min-h-11 w-full rounded-xl border-2 border-[#C9D7E6] bg-white pl-11 pr-4 text-sm font-semibold text-[#10233F] outline-none placeholder:text-slate-400 transition focus:border-[#F97316] focus:ring-4 focus:ring-orange-100"
              />
            </label>

            <select
              value={sourceState}
              onChange={(event) => setSourceState(event.target.value)}
              className="min-h-11 rounded-xl border-2 border-[#C9D7E6] bg-white px-3 text-sm font-black text-[#10233F] outline-none focus:border-[#F97316]"
            >
              <option value="all">All Source States</option>
              <option value="attributed">Attributed Only</option>
              <option value="missing">Missing Attribution</option>
            </select>

            <select
              value={sortBy}
              onChange={(event) => setSortBy(event.target.value)}
              className="min-h-11 rounded-xl border-2 border-[#C9D7E6] bg-white px-3 text-sm font-black text-[#10233F] outline-none focus:border-[#F97316]"
            >
              <option value="funnel">Deepest Funnel</option>
              <option value="leads">Most Leads</option>
              <option value="visas">Most Visas</option>
              <option value="roi">Highest Measured ROI</option>
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
            visible.map((source, index) => (
              <SourceRow
                key={`${source.name || "source"}-${index}`}
                source={source}
                compact={compact}
              />
            ))
          ) : (
            <div className="rounded-[1.55rem] border-[3px] border-dashed border-[#C9D7E6] bg-white p-8 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border-2 border-[#F97316] bg-[#FFF4E8] text-orange-700">
                <UsersRound size={24} />
              </div>

              <h3 className="mt-4 text-xl font-black text-[#10233F]">
                No lead-source evidence found
              </h3>

              <p className="mx-auto mt-2 max-w-xl text-sm font-semibold leading-6 text-slate-600">
                {sources.length
                  ? "Clear or change the source filters."
                  : "Add real source attribution to inquiries or student records to activate source intelligence."}
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
                    Attribution before judgement
                  </p>
                  <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">
                    Unknown and untracked records remain visible, but are not
                    presented as trustworthy source-performance evidence.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-[1.35rem] border-[3px] border-[#60A5FA] bg-[#F2F7FF] p-4">
              <div className="flex items-start gap-3">
                <Target
                  size={17}
                  className="mt-0.5 shrink-0 text-blue-700"
                />
                <div>
                  <p className="text-[8px] font-black uppercase tracking-[0.11em] text-slate-500">
                    Funnel Evidence
                  </p>
                  <p className="mt-1 font-black text-[#10233F]">
                    Real movement beats synthetic scoring
                  </p>
                  <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">
                    Lead-to-application, application-to-offer and CAS-to-visa
                    conversion are shown directly instead of hiding them behind a
                    weighted score.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-[1.35rem] border-[3px] border-[#F59E0B] bg-[#FFF8E8] p-4">
              <div className="flex items-start gap-3">
                <Database
                  size={17}
                  className="mt-0.5 shrink-0 text-amber-700"
                />
                <div>
                  <p className="text-[8px] font-black uppercase tracking-[0.11em] text-slate-500">
                    ROI Boundary
                  </p>
                  <p className="mt-1 font-black text-[#10233F]">
                    Spend required for ROI
                  </p>
                  <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">
                    A source with revenue but no recorded marketing spend is not
                    shown as having a measured return percentage.
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
