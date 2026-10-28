import { useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Search, X } from "lucide-react";

import { SUBJECTS, TUITION_BANDS, allUniversities } from "../../../data/universities";
import { countryList } from "../../../data/countries/countryRegistry";
import { FlagMark } from "../destinations/DestinationUI";
import HubStepLabel from "./HubStepLabel";
import { EMPTY_FILTERS } from "./hubSteps";
import UniCard from "./UniCard";

const PAGE_SIZE = 12;
const TYPES = ["Public", "Private", "Technical"];
const SORTS = [
  { id: "mix", label: "Mixed countries" },
  { id: "az", label: "A to Z" },
  { id: "oldest", label: "Oldest first" },
  { id: "cheapest", label: "Lowest fees first" },
];
const BAND_ORDER = { Low: 0, Moderate: 1, High: 2 };


function matches(university, filters) {
  if (filters.country !== "all" && university.countrySlug !== filters.country) return false;
  if (filters.subject !== "all" && !university.subjects.includes(filters.subject)) return false;
  if (filters.band !== "all" && university.tuitionBand !== filters.band) return false;
  if (filters.type !== "all" && university.type !== filters.type) return false;
  if (filters.english && university.englishLevel !== "most") return false;
  const term = filters.query.trim().toLowerCase();
  if (!term) return true;
  const country = countryList.find((item) => item.slug === university.countrySlug);
  return [university.name, university.city, university.popularFor, country?.name, ...university.programs]
    .join(" ")
    .toLowerCase()
    .includes(term);
}

function sortList(list, sort) {
  if (sort === "az") return [...list].sort((a, b) => a.name.localeCompare(b.name));
  if (sort === "oldest") return [...list].sort((a, b) => (a.founded ?? 9999) - (b.founded ?? 9999));
  if (sort === "cheapest") return [...list].sort((a, b) => BAND_ORDER[a.tuitionBand] - BAND_ORDER[b.tuitionBand]);
  return list;
}

function Select({ label, value, onChange, children }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="px-1 text-[10px] font-black uppercase tracking-[0.14em] text-[#7a879c]">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="rounded-xl bg-[#fff7ed] px-3 py-2.5 text-sm font-black text-[#071f50] outline-none ring-1 ring-orange-100 focus:ring-2 focus:ring-[#ff4b12]"
      >
        {children}
      </select>
    </label>
  );
}

/** Step 2: search and filter every university, twelve per page. */
function UniFinder({ filters, setFilters, shortlist }) {
  const [sort, setSort] = useState("mix");
  // The page number belongs to one set of filters; any change starts again at page 1.
  const filterKey = JSON.stringify([filters, sort]);
  const [paging, setPaging] = useState({ key: filterKey, page: 0 });
  const page = paging.key === filterKey ? paging.page : 0;
  const topRef = useRef(null);

  const results = useMemo(() => sortList(allUniversities.filter((university) => matches(university, filters)), sort), [filters, sort]);
  const pages = Math.max(1, Math.ceil(results.length / PAGE_SIZE));
  const shown = results.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);

  const set = (key, value) => setFilters((current) => ({ ...current, [key]: value }));
  const active = Object.entries(filters).some(([key, value]) => value !== EMPTY_FILTERS[key]);

  const goTo = (next) => {
    setPaging({ key: filterKey, page: next });
    topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <section id="finder" className="scroll-mt-20 bg-[#fff7ed] px-4 py-20 text-[#071f50] sm:px-5 md:py-28">
      <div ref={topRef} className="mx-auto max-w-[1350px] scroll-mt-24">
        <HubStepLabel step={2} />
        <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
          <h2 className="text-4xl font-black leading-[0.95] tracking-[-0.055em] md:text-6xl">
            Find and save
            <span className="block text-[#ff4b12]">your favourites.</span>
          </h2>
          <p className="max-w-md text-sm font-semibold leading-6 text-[#5f6f89] md:text-base md:leading-7">
            Narrow the list with the filters, then tap the <span className="font-black text-[#ff4b12]">♥</span> on any university to save it. Saved ones appear in Step 3 to compare side by side.
          </p>
        </div>

        {/* Country pills */}
        <div className="mt-8 flex gap-2 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <button
            type="button"
            onClick={() => set("country", "all")}
            className={`shrink-0 rounded-full px-4 py-2.5 text-xs font-black ring-1 transition ${
              filters.country === "all" ? "bg-[#071f50] text-white ring-[#071f50]" : "bg-white ring-orange-100 hover:text-[#ff4b12]"
            }`}
          >
            All countries
          </button>
          {countryList.map((country) => (
            <button
              key={country.slug}
              type="button"
              onClick={() => set("country", country.slug)}
              className={`inline-flex shrink-0 items-center gap-2 rounded-full px-3.5 py-2 text-xs font-black ring-1 transition ${
                filters.country === country.slug ? "bg-[#071f50] text-white ring-[#071f50]" : "bg-white ring-orange-100 hover:text-[#ff4b12]"
              }`}
            >
              <FlagMark country={country} className="h-4 w-6 rounded-[3px] shadow-none" />
              {country.name}
            </button>
          ))}
        </div>

        {/* Filters */}
        <div className="mt-3 grid gap-3 rounded-[22px] bg-white p-4 shadow-[0_16px_40px_rgba(7,31,80,0.06)] ring-1 ring-orange-100 sm:grid-cols-2 lg:grid-cols-[1.6fr_1fr_1fr_1fr_1fr]">
          <label className="flex flex-col gap-1 sm:col-span-2 lg:col-span-1">
            <span className="px-1 text-[10px] font-black uppercase tracking-[0.14em] text-[#7a879c]">Search</span>
            <span className="flex items-center gap-2 rounded-xl bg-[#fff7ed] px-3 ring-1 ring-orange-100 focus-within:ring-2 focus-within:ring-[#ff4b12]">
              <Search size={16} className="text-[#ff4b12]" />
              <input
                type="search"
                value={filters.query}
                onChange={(event) => set("query", event.target.value)}
                placeholder="Name, city or course"
                className="w-full bg-transparent py-2.5 text-sm font-bold outline-none placeholder:text-[#9aa5b5]"
              />
            </span>
          </label>
          <Select label="Subject" value={filters.subject} onChange={(value) => set("subject", value)}>
            <option value="all">All subjects</option>
            {SUBJECTS.map((subject) => (
              <option key={subject.id} value={subject.id}>
                {subject.label}
              </option>
            ))}
          </Select>
          <Select label="Fees" value={filters.band} onChange={(value) => set("band", value)}>
            <option value="all">Any fees</option>
            {Object.entries(TUITION_BANDS).map(([id, band]) => (
              <option key={id} value={id}>
                {band.label}
              </option>
            ))}
          </Select>
          <Select label="Type" value={filters.type} onChange={(value) => set("type", value)}>
            <option value="all">Any type</option>
            {TYPES.map((type) => (
              <option key={type}>{type}</option>
            ))}
          </Select>
          <Select label="Sort" value={sort} onChange={setSort}>
            {SORTS.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label}
              </option>
            ))}
          </Select>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <label className="inline-flex cursor-pointer items-center gap-2 text-sm font-black">
              <input type="checkbox" checked={filters.english} onChange={(event) => set("english", event.target.checked)} className="peer sr-only" />
              <span className="relative h-6 w-11 rounded-full bg-[#d7dce5] transition peer-checked:bg-[#ff4b12] peer-focus-visible:ring-2 peer-focus-visible:ring-[#071f50] after:absolute after:left-1 after:top-1 after:h-4 after:w-4 after:rounded-full after:bg-white after:transition peer-checked:after:translate-x-5" />
              Mostly taught in English
            </label>
            {active && (
              <button
                type="button"
                onClick={() => setFilters(EMPTY_FILTERS)}
                className="inline-flex items-center gap-1 rounded-full bg-[#071f50] px-3 py-1.5 text-xs font-black text-white"
              >
                <X size={13} /> Clear filters
              </button>
            )}
          </div>
          <p className="text-sm font-bold text-[#5f6f89]" aria-live="polite">
            {results.length} {results.length === 1 ? "university" : "universities"} found
          </p>
        </div>

        <motion.div layout className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          <AnimatePresence mode="popLayout">
            {shown.map((university) => (
              <UniCard key={university.key} university={university} saved={shortlist.has(university.key)} onToggle={shortlist.toggle} />
            ))}
          </AnimatePresence>
        </motion.div>

        {results.length === 0 && (
          <div className="mt-6 rounded-[22px] bg-white p-10 text-center ring-1 ring-orange-100">
            <p className="text-xl font-black">No universities match all of those filters.</p>
            <p className="mt-2 text-sm font-semibold text-[#5f6f89]">Try removing one filter. Our list is a shortlist, not every option, so ask us if you can&apos;t find a university.</p>
          </div>
        )}

        {pages > 1 && (
          <nav aria-label="Result pages" className="mt-10 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => goTo(page - 1)}
              disabled={page === 0}
              className="inline-flex items-center gap-1 rounded-full bg-white px-4 py-2.5 text-sm font-black ring-1 ring-orange-100 transition hover:text-[#ff4b12] disabled:opacity-40"
            >
              <ChevronLeft size={16} strokeWidth={3} /> Previous
            </button>
            <span className="rounded-full bg-[#071f50] px-4 py-2.5 font-mono text-xs font-black uppercase tracking-[0.12em] text-white">
              Page {page + 1} of {pages}
            </span>
            <button
              type="button"
              onClick={() => goTo(page + 1)}
              disabled={page === pages - 1}
              className="inline-flex items-center gap-1 rounded-full bg-[#ff4b12] px-4 py-2.5 text-sm font-black text-white transition hover:bg-[#071f50] disabled:opacity-40"
            >
              Next page <ChevronRight size={16} strokeWidth={3} />
            </button>
          </nav>
        )}
      </div>
    </section>
  );
}

export default UniFinder;
