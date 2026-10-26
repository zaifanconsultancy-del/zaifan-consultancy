import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  ExternalLink,
  MapPin,
  School,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";

import { countryList, getCountryBySlug } from "../../data/countries";
import { italianUniversities } from "../../data/italianUniversities";
import { FlagMark } from "../../components/public/destinations/DestinationUI";
import UniversitiesPage from "./UniversitiesPage";

const ITALY_BANDS = { Budget: "Low", Moderate: "Moderate", Premium: "High" };

const BAND_STYLES = {
  Low: "bg-emerald-50 text-emerald-700 ring-emerald-100",
  Moderate: "bg-amber-50 text-amber-700 ring-amber-100",
  High: "bg-rose-50 text-rose-700 ring-rose-100",
};

const PAGE_SIZE = 18;

// Round-robin across countries so "All countries" doesn't open with 50 Italian
// entries in a row. Each country's own order is preserved.
function interleaveByCountry(universities) {
  const groups = countryList.map((country) =>
    universities.filter((university) => university.countrySlug === country.slug)
  );
  const longest = Math.max(...groups.map((group) => group.length));
  return Array.from({ length: longest }, (_, index) =>
    groups.map((group) => group[index]).filter(Boolean)
  ).flat();
}

// One flat list across every destination. Italian entries keep their detail
// pages; everyone else links to the official site and a consultation.
const ALL_UNIVERSITIES = interleaveByCountry([
  ...italianUniversities.map((university) => ({
    key: `italy-${university.slug}`,
    countrySlug: "italy",
    name: university.name,
    city: university.city,
    type: university.type,
    tuitionBand: ITALY_BANDS[university.tuitionLevel] || "Moderate",
    tuitionNote: university.tuition,
    programs: university.programs || [],
    popularFor: university.popularFor,
    detailPath: `/universities/${university.slug}`,
  })),
  ...countryList
    .filter((country) => country.slug !== "italy")
    .flatMap((country) =>
      (country.universities || []).map((university) => ({
        key: `${country.slug}-${university.slug}`,
        countrySlug: country.slug,
        name: university.name,
        city: university.city,
        type: university.type,
        tuitionBand: university.tuitionBand,
        tuitionNote: university.tuitionNote,
        programs: university.programs || [],
        popularFor: university.popularFor,
        website: university.website,
        detailPath: `/countries/${country.slug}/universities/${university.slug}`,
      }))
    ),
]);

const TYPES = ["All types", ...new Set(ALL_UNIVERSITIES.map((university) => university.type))];
const BANDS = ["All costs", "Low", "Moderate", "High"];

function CountryTabs({ active, onSelect }) {
  const counts = useMemo(() => {
    const map = { all: ALL_UNIVERSITIES.length };
    for (const university of ALL_UNIVERSITIES) {
      map[university.countrySlug] = (map[university.countrySlug] || 0) + 1;
    }
    return map;
  }, []);

  return (
    <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <button
        type="button"
        onClick={() => onSelect("all")}
        className={`shrink-0 rounded-full px-4 py-2.5 text-xs font-black ring-1 transition ${
          active === "all" ? "bg-[#071f50] text-white ring-[#071f50]" : "bg-white text-[#071f50] ring-orange-100 hover:text-[#ff4b12]"
        }`}
      >
        All countries ({counts.all})
      </button>
      {countryList.map((country) => (
        <button
          key={country.slug}
          type="button"
          onClick={() => onSelect(country.slug)}
          className={`inline-flex shrink-0 items-center gap-2 rounded-full px-3.5 py-2 text-xs font-black ring-1 transition ${
            active === country.slug
              ? "bg-[#ff4b12] text-white ring-[#ff4b12] shadow-[0_12px_30px_rgba(255,75,18,0.25)]"
              : "bg-white text-[#071f50] ring-orange-100 hover:text-[#ff4b12]"
          }`}
        >
          <FlagMark country={country} className="h-4 w-6 rounded-[3px]" />
          {country.name}
          <span className={active === country.slug ? "text-white/75" : "text-[#7a879c]"}>{counts[country.slug] || 0}</span>
        </button>
      ))}
    </div>
  );
}

function UniversityTile({ university }) {
  const country = getCountryBySlug(university.countrySlug);
  const askPath = `/appointment?country=${encodeURIComponent(country?.name || "")}&service=${encodeURIComponent(
    "University Selection"
  )}&university=${encodeURIComponent(university.name)}`;

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ duration: 0.25 }}
      className="group flex flex-col rounded-[26px] bg-white p-5 shadow-[0_16px_45px_rgba(9,31,80,0.07)] ring-1 ring-orange-100 transition hover:-translate-y-1 hover:shadow-[0_24px_60px_rgba(255,75,18,0.12)]"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <FlagMark country={country} className="h-5 w-[30px] rounded-[4px]" />
          <span className="text-[10px] font-black uppercase tracking-[0.14em] text-[#7a879c]">{country?.name}</span>
        </div>
        <div className="flex flex-wrap justify-end gap-1.5">
          <span className="rounded-full bg-[#071f50] px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.1em] text-white">{university.type}</span>
          <span className={`rounded-full px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.1em] ring-1 ${BAND_STYLES[university.tuitionBand] || BAND_STYLES.Moderate}`}>
            {university.tuitionBand}
          </span>
        </div>
      </div>

      <h3 className="mt-4 text-[17px] font-black leading-6 tracking-[-0.03em] text-[#071f50]">{university.name}</h3>
      <p className="mt-1 flex items-center gap-1.5 text-xs font-bold text-[#7a879c]">
        <MapPin size={13} className="text-[#ff4b12]" />
        {university.city}
      </p>
      <p className="mt-3 text-sm font-semibold leading-6 text-[#61708a]">{university.popularFor}</p>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {university.programs.slice(0, 4).map((program) => (
          <span key={program} className="rounded-full bg-[#fff7ed] px-2.5 py-1 text-[11px] font-black text-[#071f50] ring-1 ring-orange-100">
            {program}
          </span>
        ))}
      </div>

      <p className="mt-3 text-xs font-bold leading-5 text-[#526178]">
        <span className="font-black text-[#ff4b12]">Fees: </span>
        {university.tuitionNote}
      </p>

      <div className="mt-auto flex gap-2 pt-5">
        {university.detailPath ? (
          <Link
            to={university.detailPath}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-[#071f50] px-4 py-3 text-xs font-black text-white transition hover:bg-[#ff4b12]"
          >
            View details
            <ArrowRight size={14} strokeWidth={3} />
          </Link>
        ) : (
          <Link
            to={askPath}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-[#071f50] px-4 py-3 text-xs font-black text-white transition hover:bg-[#ff4b12]"
          >
            Ask about this
            <ArrowRight size={14} strokeWidth={3} />
          </Link>
        )}
        {university.website && (
          <a
            href={university.website}
            target="_blank"
            rel="noreferrer"
            aria-label={`${university.name} official website`}
            className="grid h-11 w-11 place-items-center rounded-full bg-[#fff1ea] text-[#ff4b12] ring-1 ring-orange-100 transition hover:bg-[#ff4b12] hover:text-white"
          >
            <ExternalLink size={16} strokeWidth={2.8} />
          </a>
        )}
      </div>
    </motion.article>
  );
}

function UniversitiesHub() {
  const [searchParams, setSearchParams] = useSearchParams();
  const countryParam = searchParams.get("country");
  const activeCountry = getCountryBySlug(countryParam) ? countryParam : "all";

  const [query, setQuery] = useState("");
  const [type, setType] = useState(TYPES[0]);
  const [band, setBand] = useState(BANDS[0]);
  const [visible, setVisible] = useState(PAGE_SIZE);

  useEffect(() => {
    document.title = "Find Universities | Zaifan Consultancy";
  }, []);

  const selectCountry = (slug) => {
    setVisible(PAGE_SIZE);
    setSearchParams(slug === "all" ? {} : { country: slug }, { replace: true });
  };

  const results = useMemo(() => {
    const term = query.trim().toLowerCase();
    return ALL_UNIVERSITIES.filter((university) => {
      if (activeCountry !== "all" && university.countrySlug !== activeCountry) return false;
      if (type !== TYPES[0] && university.type !== type) return false;
      if (band !== BANDS[0] && university.tuitionBand !== band) return false;
      if (!term) return true;
      return [university.name, university.city, university.popularFor, ...university.programs]
        .join(" ")
        .toLowerCase()
        .includes(term);
    });
  }, [activeCountry, query, type, band]);

  const filtersActive = query || type !== TYPES[0] || band !== BANDS[0];

  const header = (
    <section className="relative px-4 pt-28 sm:px-5 md:pt-32">
      <div className="mx-auto max-w-[1400px]">
        {activeCountry === "all" && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8 text-center">
            <span className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-[#ff4b12] shadow-sm ring-1 ring-orange-100">
              <School size={15} />
              {ALL_UNIVERSITIES.length} universities · {countryList.length} countries
            </span>
            <h1 className="mx-auto mt-5 max-w-4xl text-[2.6rem] font-black leading-[0.94] tracking-[-0.06em] text-[#071f50] sm:text-6xl md:text-7xl">
              Find the right <span className="text-[#ff4b12]">university.</span>
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-[15px] font-semibold leading-7 text-[#526178] sm:text-lg">
              Search by subject, city or name across every destination we cover. Pick a country for its full finder.
            </p>
          </motion.div>
        )}
        <CountryTabs active={activeCountry} onSelect={selectCountry} />
      </div>
    </section>
  );

  // Italy keeps its dedicated, deeper finder.
  if (activeCountry === "italy") {
    return (
      <div className="bg-[#fff7ed]">
        {header}
        <UniversitiesPage embedded />
      </div>
    );
  }

  const country = getCountryBySlug(activeCountry);

  return (
    <main className="min-h-screen bg-[#fff7ed] pb-20 text-[#071f50]">
      {header}

      <section className="px-4 pt-6 sm:px-5">
        <div className="mx-auto max-w-[1400px]">
          {country && (
            <div className="mb-6 flex flex-col gap-4 rounded-[28px] bg-white p-5 shadow-[0_16px_45px_rgba(9,31,80,0.06)] ring-1 ring-orange-100 sm:flex-row sm:items-center sm:justify-between md:p-6">
              <div className="flex items-center gap-4">
                <FlagMark country={country} className="h-12 w-[72px]" />
                <div>
                  <h1 className="text-3xl font-black tracking-[-0.05em] md:text-4xl">Universities in {country.name}</h1>
                  <p className="text-sm font-semibold text-[#61708a]">{country.quickFacts.tuitionNote}</p>
                </div>
              </div>
              <Link
                to={`/countries/${country.slug}`}
                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-[#ff4b12] px-5 py-3 text-xs font-black text-white transition hover:bg-[#ff642f]"
              >
                Full {country.name} guide
                <ArrowRight size={14} strokeWidth={3} />
              </Link>
            </div>
          )}

          <div className="grid gap-3 rounded-[26px] bg-white p-3 shadow-[0_16px_45px_rgba(9,31,80,0.06)] ring-1 ring-orange-100 md:grid-cols-[1fr_auto_auto_auto] md:items-center">
            <label className="flex items-center gap-3 rounded-2xl bg-[#fff7ed] px-4 py-3 ring-1 ring-orange-100">
              <Search size={18} className="text-[#ff4b12]" />
              <input
                type="search"
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value);
                  setVisible(PAGE_SIZE);
                }}
                placeholder="Search computer science, medicine, Berlin, Fudan..."
                className="w-full bg-transparent text-sm font-bold text-[#071f50] outline-none placeholder:text-[#9aa5b5]"
              />
            </label>
            <div className="flex items-center gap-2 rounded-2xl bg-[#fff7ed] px-3 ring-1 ring-orange-100">
              <SlidersHorizontal size={16} className="text-[#ff4b12]" />
              <select value={type} onChange={(event) => setType(event.target.value)} className="bg-transparent py-3 text-sm font-black outline-none">
                {TYPES.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </div>
            <select
              value={band}
              onChange={(event) => setBand(event.target.value)}
              className="rounded-2xl bg-[#fff7ed] px-4 py-3 text-sm font-black outline-none ring-1 ring-orange-100"
            >
              {BANDS.map((item) => (
                <option key={item}>{item === "All costs" ? item : `${item} cost`}</option>
              ))}
            </select>
            {filtersActive ? (
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  setType(TYPES[0]);
                  setBand(BANDS[0]);
                }}
                className="inline-flex items-center justify-center gap-1.5 rounded-2xl bg-[#071f50] px-4 py-3 text-xs font-black text-white"
              >
                <X size={14} /> Reset
              </button>
            ) : (
              <span className="hidden md:block" />
            )}
          </div>

          <p className="mt-5 text-sm font-bold text-[#61708a]">
            Showing {Math.min(visible, results.length)} of {results.length} universities
          </p>

          <motion.div layout className="mt-5 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            <AnimatePresence mode="popLayout">
              {results.slice(0, visible).map((university) => (
                <UniversityTile key={university.key} university={university} />
              ))}
            </AnimatePresence>
          </motion.div>

          {results.length === 0 && (
            <div className="mt-6 rounded-[26px] bg-white p-8 text-center ring-1 ring-orange-100">
              <p className="text-lg font-black">No universities match those filters.</p>
              <p className="mt-2 text-sm font-semibold text-[#61708a]">Try a broader search, or ask us. Our list is a shortlist, not every option.</p>
            </div>
          )}

          {visible < results.length && (
            <div className="mt-8 flex justify-center">
              <button
                type="button"
                onClick={() => setVisible((count) => count + PAGE_SIZE)}
                className="rounded-full bg-white px-7 py-3.5 text-sm font-black shadow-sm ring-1 ring-orange-100 transition hover:-translate-y-0.5 hover:text-[#ff4b12]"
              >
                Show more universities
              </button>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

export default UniversitiesHub;
