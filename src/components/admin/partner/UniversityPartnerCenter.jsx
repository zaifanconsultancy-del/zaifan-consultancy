import React, { useMemo, useState } from "react";
import {
  AlertTriangle,
  BadgeCheck,
  Building2,
  CalendarDays,
  GraduationCap,
  Search,
  ShieldCheck,
  Target,
  University,
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

function getUniversityName(item = {}) {
  return (
    item.name ||
    item.university_name ||
    item.universityName ||
    item.institution_name ||
    item.institutionName ||
    "Unnamed university partner"
  );
}

function getCountry(item = {}) {
  return (
    item.country ||
    item.destination_country ||
    item.destinationCountry ||
    item.study_country ||
    item.studyCountry ||
    "Not recorded"
  );
}

function getRank(item = {}) {
  return (
    item.rank ||
    item.partner_rank ||
    item.partnerRank ||
    item.tier ||
    "Not assigned"
  );
}

function getOwner(item = {}) {
  return (
    item.owner ||
    item.owner_name ||
    item.ownerName ||
    item.account_manager ||
    item.accountManager ||
    "Not assigned"
  );
}

function getApplications(item = {}) {
  return safeNumber(
    item.apps ??
      item.applications ??
      item.application_count ??
      item.applicationCount
  );
}

function getOffers(item = {}) {
  return safeNumber(
    item.offers ??
      item.offer_count ??
      item.offerCount
  );
}

function getCas(item = {}) {
  return safeNumber(
    item.cas ??
      item.cas_count ??
      item.casCount
  );
}

function getIntakes(item = {}) {
  const value =
    item.intakes ||
    item.intake ||
    item.available_intakes ||
    item.availableIntakes;

  if (Array.isArray(value)) {
    return value.filter(Boolean).join(" / ");
  }

  return String(value || "").trim();
}

function getScholarship(item = {}) {
  return (
    item.scholarship ||
    item.scholarship_note ||
    item.scholarshipNote ||
    item.scholarship_rule ||
    item.scholarshipRule ||
    ""
  );
}

function getSla(item = {}) {
  const raw =
    item.sla ||
    item.response_sla ||
    item.responseSla ||
    item.response_time ||
    item.responseTime;

  if (raw === null || raw === undefined || raw === "") {
    return null;
  }

  return String(raw);
}

function getOfferRate(item = {}) {
  const applications = getApplications(item);
  const offers = getOffers(item);

  if (applications <= 0) return null;
  return Math.round((offers / applications) * 100);
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

function MiniMetric({ label, value }) {
  return (
    <div className="rounded-xl border border-[#E1E8F0] bg-[#FFF8EF] px-3 py-2.5">
      <p className="text-[7px] font-black uppercase tracking-[0.09em] text-slate-500">
        {label}
      </p>
      <p className="mt-1 text-xs font-black text-[#10233F]">
        {value}
      </p>
    </div>
  );
}

function UniversityCard({ item }) {
  const offerRate = getOfferRate(item);
  const intakes = getIntakes(item);
  const scholarship = getScholarship(item);
  const sla = getSla(item);

  return (
    <article className="rounded-[1.35rem] border-2 border-[#C9D7E6] bg-white p-4 shadow-[0_6px_18px_rgba(15,35,63,0.04)] transition hover:border-[#F97316]">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="min-w-0 [overflow-wrap:anywhere] text-lg font-black text-[#10233F]">
              {getUniversityName(item)}
            </p>

            <span className="rounded-full border-2 border-[#60A5FA] bg-[#F2F7FF] px-2.5 py-1 text-[8px] font-black uppercase tracking-[0.07em] text-blue-700">
              {getRank(item)}
            </span>
          </div>

          <p className="mt-1 text-xs font-semibold text-slate-500">
            {getCountry(item)}
          </p>
        </div>

        <span className="w-fit rounded-full border-2 border-[#C9D7E6] bg-[#FFF8EF] px-3 py-1 text-[8px] font-black uppercase tracking-[0.07em] text-slate-600">
          Owner: {getOwner(item)}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <MiniMetric
          label="Applications"
          value={getApplications(item)}
        />
        <MiniMetric
          label="Offers"
          value={getOffers(item)}
        />
        <MiniMetric
          label="CAS"
          value={getCas(item)}
        />
        <MiniMetric
          label="Offer Rate"
          value={
            offerRate === null
              ? "Not measured"
              : percent(offerRate)
          }
        />
      </div>

      <div className="mt-4 grid gap-2 md:grid-cols-3">
        <div className="rounded-xl border border-[#E1E8F0] bg-[#F7FAFC] px-3 py-3">
          <p className="text-[7px] font-black uppercase tracking-[0.09em] text-slate-500">
            Intakes
          </p>
          <p className="mt-1 text-xs font-semibold leading-5 text-[#10233F]">
            {intakes || "Not recorded"}
          </p>
        </div>

        <div className="rounded-xl border border-[#E1E8F0] bg-[#F7FAFC] px-3 py-3">
          <p className="text-[7px] font-black uppercase tracking-[0.09em] text-slate-500">
            Scholarship
          </p>
          <p className="mt-1 text-xs font-semibold leading-5 text-[#10233F]">
            {scholarship || "Not recorded"}
          </p>
        </div>

        <div className="rounded-xl border border-[#E1E8F0] bg-[#F7FAFC] px-3 py-3">
          <p className="text-[7px] font-black uppercase tracking-[0.09em] text-slate-500">
            Response SLA
          </p>
          <p className="mt-1 text-xs font-semibold leading-5 text-[#10233F]">
            {sla || "Not measured"}
          </p>
        </div>
      </div>
    </article>
  );
}

export default function UniversityPartnerCenter({
  compact = false,
  records = [],
  partners = [],
}) {
  const [country, setCountry] = useState("All");
  const [query, setQuery] = useState("");

  const universities = useMemo(() => {
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
        type.includes("university") ||
        type.includes("college") ||
        type.includes("institution")
      );
    });
  }, [records, partners]);

  const countries = useMemo(
    () => [
      "All",
      ...new Set(
        universities
          .map((item) => getCountry(item))
          .filter(
            (value) =>
              value &&
              lower(value) !== "not recorded"
          )
      ),
    ],
    [universities]
  );

  const filtered = useMemo(() => {
    const search = lower(query);

    return universities.filter((item) => {
      if (country !== "All" && getCountry(item) !== country) {
        return false;
      }

      if (!search) return true;

      return [
        getUniversityName(item),
        getCountry(item),
        getRank(item),
        getOwner(item),
        getIntakes(item),
        getScholarship(item),
      ]
        .map(lower)
        .join(" ")
        .includes(search);
    });
  }, [universities, country, query]);

  const summary = useMemo(() => {
    const applications = universities.reduce(
      (sum, item) => sum + getApplications(item),
      0
    );

    const offers = universities.reduce(
      (sum, item) => sum + getOffers(item),
      0
    );

    const measurable = universities
      .map(getOfferRate)
      .filter((value) => value !== null);

    return {
      applications,
      offers,
      offerRate: applications > 0
        ? Math.round((offers / applications) * 100)
        : null,
      measurable: measurable.length,
    };
  }, [universities]);

  const displayed = compact
    ? filtered.slice(0, 4)
    : filtered;

  const filtersActive =
    Boolean(query.trim()) || country !== "All";

  function clearFilters() {
    setQuery("");
    setCountry("All");
  }

  return (
    <section className="min-w-0 overflow-hidden rounded-[1.9rem] border-[3px] border-[#C9D7E6] bg-[#FFFDF8] shadow-[0_14px_38px_rgba(15,35,63,0.07)]">
      <div className="grid border-b-[3px] border-[#F97316] xl:grid-cols-[minmax(0,1.2fr)_minmax(16rem,0.8fr)]">
        <div className="bg-[#123865] p-5 text-white sm:p-6">
          <div className="inline-flex items-center gap-2 rounded-full border-2 border-orange-300/30 bg-orange-400/10 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.12em] text-orange-300">
            <University size={12} />
            University Partners
          </div>

          <h2 className="mt-3 text-2xl font-black text-white sm:text-3xl">
            University Relationship Center
          </h2>

          <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-200">
            University partnership evidence, intakes, scholarship notes, offer
            movement and relationship ownership. No fictional universities or
            destination partnerships are pre-filled.
          </p>
        </div>

        <div className="bg-[#FF5A0A] p-5 text-white sm:p-6">
          <p className="text-[9px] font-black uppercase tracking-[0.12em]">
            University Partners
          </p>

          <p className="mt-2 text-3xl font-black">
            {universities.length}
          </p>

          <p className="mt-2 text-xs font-semibold leading-5 text-orange-50">
            {summary.applications} applications · {summary.offers} offers.
          </p>

          <span className="mt-3 inline-flex rounded-full border-2 border-white/25 bg-white/10 px-3 py-1 text-[8px] font-black uppercase tracking-[0.08em]">
            Real relationship evidence
          </span>
        </div>
      </div>

      <div className="space-y-5 p-4 sm:p-5">
        {!compact ? (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              label="University Partners"
              value={universities.length}
              helper="Real institution partnership records in the current snapshot."
              tone="navy"
              icon={Building2}
            />

            <MetricCard
              label="Applications Sent"
              value={summary.applications}
              helper="Applications explicitly attributed to university partner records."
              tone="blue"
              icon={GraduationCap}
            />

            <MetricCard
              label="Offers Received"
              value={summary.offers}
              helper="Offer evidence explicitly linked to university partners."
              tone="green"
              icon={BadgeCheck}
            />

            <MetricCard
              label="Avg Offer Rate"
              value={
                summary.offerRate === null
                  ? "—"
                  : percent(summary.offerRate)
              }
              helper={
                summary.offerRate === null
                  ? "Not measured until application and offer evidence exists."
                  : "Offers divided by partner-attributed applications."
              }
              tone={
                summary.offerRate === null
                  ? "blue"
                  : "violet"
              }
              icon={Target}
              badge={
                summary.offerRate === null
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
                placeholder="Search university, country, owner..."
                className="min-h-11 w-full rounded-xl border-2 border-[#C9D7E6] bg-white pl-11 pr-4 text-sm font-semibold text-[#10233F] outline-none placeholder:text-slate-400 focus:border-[#F97316]"
              />
            </label>

            <select
              value={country}
              onChange={(event) => setCountry(event.target.value)}
              className="min-h-11 rounded-xl border-2 border-[#C9D7E6] bg-white px-3 text-sm font-black text-[#10233F] outline-none focus:border-[#F97316]"
            >
              {countries.map((item) => (
                <option key={item} value={item}>
                  {item === "All" ? "All Countries" : item}
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

        <div className="grid gap-3 xl:grid-cols-2">
          {displayed.length ? (
            displayed.map((item, index) => (
              <UniversityCard
                key={
                  item.id ||
                  `${getUniversityName(item)}-${index}`
                }
                item={item}
              />
            ))
          ) : (
            <div className="xl:col-span-2 rounded-[1.5rem] border-[3px] border-dashed border-[#C9D7E6] bg-white p-8 text-center">
              <University
                size={24}
                className="mx-auto text-orange-700"
              />

              <p className="mt-3 font-black text-[#10233F]">
                {universities.length
                  ? "No university partners match these filters."
                  : "No real university partners yet."}
              </p>

              <p className="mx-auto mt-2 max-w-xl text-sm font-semibold leading-6 text-slate-600">
                {universities.length
                  ? "Clear or change the university-partner filters."
                  : "Connect genuine institution partnership records before Zaifan reports offer rates, scholarship rules, SLA performance or intake coverage."}
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
                    Partnership Integrity
                  </p>
                  <p className="mt-1 font-black text-[#10233F]">
                    Public university ≠ partner university
                  </p>
                  <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">
                    A university appearing on Zaifan's public university explorer
                    is not treated as a commercial partner unless a real
                    partnership record exists.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-[1.35rem] border-[3px] border-[#60A5FA] bg-[#F2F7FF] p-4">
              <div className="flex items-start gap-3">
                <CalendarDays
                  size={17}
                  className="mt-0.5 shrink-0 text-blue-700"
                />
                <div>
                  <p className="text-[8px] font-black uppercase tracking-[0.11em] text-slate-500">
                    Intake Integrity
                  </p>
                  <p className="mt-1 font-black text-[#10233F]">
                    Missing intake data stays missing
                  </p>
                  <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">
                    Intake availability is displayed only when recorded on the
                    partnership record.
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
                    Scholarship Boundary
                  </p>
                  <p className="mt-1 font-black text-[#10233F]">
                    Scholarship note ≠ guaranteed award
                  </p>
                  <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">
                    Scholarship information is treated as a recorded partner note
                    only, never as a guaranteed student outcome.
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
