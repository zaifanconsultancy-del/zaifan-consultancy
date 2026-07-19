import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  BookOpenCheck,
  Building2,
  ChevronLeft,
  ChevronRight,
  Filter,
  GraduationCap,
  MapPin,
  Search,
  Sparkles,
  Star,
  Wallet,
  X,
} from "lucide-react";

import Footer from "../../components/public/layout/Footer";

import {
  cityFilters,
  getScholarshipBadge,
  getTuitionBadge,
  italianUniversities,
  programFilters,
  scholarshipFilters,
  tuitionFilters,
  typeFilters,
} from "../../data/italianUniversities";

const PAGE_SIZE = 12;

const MOTION = {
  duration: 0.55,
  ease: [0.22, 1, 0.36, 1],
};

const INTERACTIVE_TRANSITION =
  "transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: MOTION.duration, ease: MOTION.ease },
  },
};

const preferredFeaturedSlugs = [
  "politecnico-di-milano",
  "sapienza-university-of-rome",
  "university-of-bologna",
  "politecnico-di-torino",
];

const smartChips = [
  { label: "Computer Science", type: "search", value: "Computer Science" },
  { label: "Medicine", type: "search", value: "Medicine" },
  { label: "Engineering", type: "search", value: "Engineering" },
  { label: "Business", type: "search", value: "Business" },
  { label: "Architecture", type: "search", value: "Architecture" },
  { label: "Design", type: "search", value: "Design" },
  { label: "Budget", type: "view", value: "budget" },
  { label: "Strong Scholarships", type: "view", value: "scholarships" },
  { label: "Milan", type: "city", value: "Milan" },
  { label: "Rome", type: "city", value: "Rome" },
  { label: "Turin", type: "city", value: "Turin" },
  { label: "DSU", type: "search", value: "Scholarship" },
];

const viewModes = [
  { id: "all", label: "All Universities" },
  { id: "budget", label: "Best Value" },
  { id: "scholarships", label: "Strong Scholarships" },
  { id: "technical", label: "Technical" },
];

const queryMap = {
  cs: "computer science",
  "computer sciences": "computer science",
  med: "medicine",
  medical: "medicine",
  doctor: "medicine",
  doctors: "medicine",
  scholarship: "scholarship",
  scholarships: "scholarship",
  dsu: "scholarship",
  cheap: "budget",
  affordable: "budget",
  "low cost": "budget",
  lowcost: "budget",
  engineering: "engineering",
  engineer: "engineering",
  business: "business",
  management: "management",
  design: "design",
  architecture: "architecture",
};

function normalizeSearch(value) {
  const clean = value.trim().toLowerCase();
  return queryMap[clean] || clean;
}

function UniversitiesPage() {
  const prefersReducedMotion = useReducedMotion();
  const [search, setSearch] = useState("");
  const [city, setCity] = useState("All");
  const [program, setProgram] = useState("All");
  const [type, setType] = useState("All");
  const [tuition, setTuition] = useState("All");
  const [scholarship, setScholarship] = useState("All");
  const [viewMode, setViewMode] = useState("all");
  const [sortMode, setSortMode] = useState("recommended");
  const [page, setPage] = useState(1);

  const filteredUniversities = useMemo(() => {
    const query = normalizeSearch(search);

    return italianUniversities.filter((university) => {
      const searchableText = [
        university.name,
        university.city,
        university.region,
        university.type,
        university.tuition,
        university.tuitionLevel,
        university.scholarship,
        university.scholarshipStrength,
        university.popularFor,
        university.vibe,
        university.rankingNote,
        ...university.programs,
      ]
        .join(" ")
        .toLowerCase();

      const matchesSearch = !query || searchableText.includes(query);
      const matchesCity = city === "All" || university.city === city;
      const matchesProgram =
        program === "All" || university.programs.includes(program);
      const matchesType = type === "All" || university.type === type;
      const matchesTuition =
        tuition === "All" || university.tuitionLevel === tuition;
      const matchesScholarship =
        scholarship === "All" ||
        university.scholarshipStrength === scholarship;

      let matchesView = true;

      if (viewMode === "budget") {
        matchesView =
          university.tuitionLevel === "Budget" ||
          university.tuitionLevel === "Affordable";
      }

      if (viewMode === "scholarships") {
        matchesView =
          university.scholarshipStrength === "Excellent" ||
          university.scholarshipStrength === "Strong";
      }

      if (viewMode === "technical") {
        matchesView =
          university.type === "Technical" ||
          university.programs.includes("Engineering") ||
          university.programs.includes("Computer Science");
      }

      return (
        matchesSearch &&
        matchesCity &&
        matchesProgram &&
        matchesType &&
        matchesTuition &&
        matchesScholarship &&
        matchesView
      );
    });
  }, [
    search,
    city,
    program,
    type,
    tuition,
    scholarship,
    viewMode,
  ]);

  const hasFilters =
    search ||
    city !== "All" ||
    program !== "All" ||
    type !== "All" ||
    tuition !== "All" ||
    scholarship !== "All" ||
    viewMode !== "all";

  const featuredUniversities = useMemo(() => {
    if (hasFilters) {
      return filteredUniversities.slice(0, 4);
    }

    const preferred = preferredFeaturedSlugs
      .map((slug) =>
        italianUniversities.find((university) => university.slug === slug)
      )
      .filter(Boolean);

    return preferred.length === 4
      ? preferred
      : filteredUniversities.slice(0, 4);
  }, [filteredUniversities, hasFilters]);

  const sortedUniversities = useMemo(() => {
    const items = [...filteredUniversities];

    if (sortMode === "name") {
      return items.sort((a, b) => a.name.localeCompare(b.name));
    }

    if (sortMode === "city") {
      return items.sort(
        (a, b) =>
          a.city.localeCompare(b.city) || a.name.localeCompare(b.name)
      );
    }

    if (sortMode === "value") {
      const tuitionScore = {
        Budget: 0,
        Affordable: 1,
        Moderate: 2,
        Premium: 3,
      };

      return items.sort((a, b) => {
        const aScore = tuitionScore[a.tuitionLevel] ?? 99;
        const bScore = tuitionScore[b.tuitionLevel] ?? 99;

        return aScore - bScore || a.name.localeCompare(b.name);
      });
    }

    return items;
  }, [filteredUniversities, sortMode]);

  const totalPages = Math.max(
    1,
    Math.ceil(sortedUniversities.length / PAGE_SIZE)
  );

  const paginatedUniversities = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return sortedUniversities.slice(start, start + PAGE_SIZE);
  }, [sortedUniversities, page]);

  useEffect(() => {
    setPage(1);
  }, [search, city, program, type, tuition, scholarship, viewMode, sortMode]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const resetFilters = () => {
    setSearch("");
    setCity("All");
    setProgram("All");
    setType("All");
    setTuition("All");
    setScholarship("All");
    setViewMode("all");
    setSortMode("recommended");
    setPage(1);
  };

  const applySmartChip = (chip) => {
    if (chip.type === "city") {
      setCity(chip.value);
      return;
    }

    if (chip.type === "view") {
      setViewMode(chip.value);
      return;
    }

    setSearch(chip.value);
  };

  const activeFilters = [
    search && {
      key: "search",
      label: `Search: ${search}`,
      clear: () => setSearch(""),
    },
    city !== "All" && {
      key: "city",
      label: `City: ${city}`,
      clear: () => setCity("All"),
    },
    program !== "All" && {
      key: "program",
      label: `Program: ${program}`,
      clear: () => setProgram("All"),
    },
    type !== "All" && {
      key: "type",
      label: `Type: ${type}`,
      clear: () => setType("All"),
    },
    tuition !== "All" && {
      key: "tuition",
      label: `Tuition: ${tuition}`,
      clear: () => setTuition("All"),
    },
    scholarship !== "All" && {
      key: "scholarship",
      label: `Scholarship: ${scholarship}`,
      clear: () => setScholarship("All"),
    },
    viewMode !== "all" && {
      key: "view",
      label:
        viewModes.find((mode) => mode.id === viewMode)?.label || "Quick View",
      clear: () => setViewMode("all"),
    },
  ].filter(Boolean);

  const goToPage = (nextPage) => {
    setPage(nextPage);

    window.requestAnimationFrame(() => {
      const target = document.getElementById("university-directory");
      if (!target) return;

      const y = target.getBoundingClientRect().top + window.scrollY - 110;
      window.scrollTo({
        top: y,
        behavior: prefersReducedMotion ? "auto" : "smooth",
      });
    });
  };

  return (
    <>
      <main
        id="universities-page"
        className="relative overflow-hidden bg-[#fff7ed] pt-28 text-[#071b3a]"
      >
        <style>{`
          @media (prefers-reduced-motion: reduce) {
            #universities-page *,
            #universities-page *::before,
            #universities-page *::after {
              scroll-behavior: auto !important;
              transition-duration: 0.01ms !important;
              animation-duration: 0.01ms !important;
              animation-iteration-count: 1 !important;
            }
          }
        `}</style>
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_10%_8%,rgba(255,91,18,0.14),transparent_27%),radial-gradient(circle_at_90%_12%,rgba(255,184,96,0.16),transparent_24%)]" />

        <section className="relative mx-auto max-w-[1500px] px-4 pb-16 sm:px-6 lg:px-10">
          <motion.div
            initial={prefersReducedMotion ? false : "hidden"}
            animate="show"
            variants={fadeUp}
            className="text-center"
          >
            <div className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-xs font-black uppercase tracking-[0.18em] text-orange-600 shadow-sm ring-1 ring-orange-100">
              <Sparkles className="h-4 w-4 fill-orange-500" />
              Smart Italy University Finder
            </div>

            <h1 className="mx-auto mt-6 max-w-5xl text-5xl font-black leading-[0.95] tracking-[-0.06em] md:text-7xl">
              Find the right{" "}
              <span className="text-orange-600">Italian university</span>.
            </h1>

            <p className="mx-auto mt-6 max-w-3xl text-lg font-semibold leading-8 text-slate-600">
              Search naturally, filter intelligently, and explore universities in
              manageable pages instead of scrolling through fifty cards at once.
            </p>
          </motion.div>

          <div className="mt-10 rounded-[2.3rem] bg-white/94 p-5 shadow-[0_24px_70px_rgba(15,23,42,0.08)] ring-1 ring-orange-100">
            <div className="grid gap-4 lg:grid-cols-[1.6fr_repeat(5,1fr)_auto]">
              <div className="relative">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Try: CS, medicine, scholarship, cheap, Milan..."
                  className="h-14 w-full rounded-2xl border border-orange-100 bg-[#fff8f1] pl-12 pr-4 text-sm font-bold outline-none transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] focus:border-orange-300 focus:bg-white focus-visible:ring-4 focus-visible:ring-orange-100"
                />
              </div>

              <FilterSelect value={city} onChange={setCity} options={cityFilters} />
              <FilterSelect value={program} onChange={setProgram} options={programFilters} />
              <FilterSelect value={type} onChange={setType} options={typeFilters} />
              <FilterSelect value={tuition} onChange={setTuition} options={tuitionFilters} />
              <FilterSelect
                value={scholarship}
                onChange={setScholarship}
                options={scholarshipFilters}
              />

              <button
                type="button"
                onClick={resetFilters}
                disabled={!hasFilters}
                className={`inline-flex h-14 items-center justify-center gap-2 rounded-2xl bg-[#071b3a] px-5 text-sm font-black text-white hover:-translate-y-0.5 hover:bg-[#092b72] focus:outline-none focus-visible:ring-4 focus-visible:ring-orange-200 disabled:cursor-not-allowed disabled:opacity-45 ${INTERACTIVE_TRANSITION}`}
              >
                <X className="h-4 w-4" />
                Reset
              </button>
            </div>

            <div className="mt-4 flex flex-wrap justify-center gap-2">
              {smartChips.map((chip) => (
                <button
                  key={chip.label}
                  type="button"
                  onClick={() => applySmartChip(chip)}
                  className={`rounded-full bg-white px-4 py-2 text-xs font-black text-orange-700 ring-1 ring-orange-100 hover:-translate-y-0.5 hover:bg-orange-50 focus:outline-none focus-visible:ring-4 focus-visible:ring-orange-200 ${INTERACTIVE_TRANSITION}`}
                >
                  {chip.label}
                </button>
              ))}
            </div>

            {activeFilters.length > 0 && (
              <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-orange-100 pt-4">
                <span className="mr-1 text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">
                  Active filters
                </span>

                {activeFilters.map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={item.clear}
                    className={`inline-flex items-center gap-2 rounded-full bg-[#071b3a] px-3 py-2 text-[10px] font-black text-white hover:-translate-y-0.5 hover:bg-[#092b72] focus:outline-none focus-visible:ring-4 focus-visible:ring-orange-200 ${INTERACTIVE_TRANSITION}`}
                    aria-label={`Remove ${item.label}`}
                  >
                    {item.label}
                    <X className="h-3 w-3" />
                  </button>
                ))}

                <button
                  type="button"
                  onClick={resetFilters}
                  className="ml-auto rounded-full px-3 py-2 text-[10px] font-black text-orange-600 transition-colors duration-300 hover:bg-orange-50 focus:outline-none focus-visible:ring-4 focus-visible:ring-orange-200"
                >
                  Clear all
                </button>
              </div>
            )}
          </div>

          <div className="mt-6 flex flex-col gap-4 rounded-[1.7rem] bg-white/84 p-5 shadow-sm ring-1 ring-orange-100 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-3">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-orange-50 text-orange-600">
                <Filter className="h-6 w-6" />
              </div>

              <div>
                <p className="text-sm font-black text-[#071b3a]">
                  Showing {sortedUniversities.length} of{" "}
                  {italianUniversities.length} universities
                </p>
                <p className="text-xs font-bold text-slate-500">
                  Page {page} of {totalPages} · 12 universities per page for easier comparison.
                </p>
              </div>
            </div>

            <Link
              to="/appointment?country=Italy&service=University%20Shortlist"
              className={`inline-flex items-center justify-center gap-2 rounded-2xl bg-orange-600 px-6 py-4 text-sm font-black text-white shadow-lg shadow-orange-600/20 hover:-translate-y-1 hover:bg-orange-700 focus:outline-none focus-visible:ring-4 focus-visible:ring-orange-200 ${INTERACTIVE_TRANSITION}`}
            >
              Get Shortlist Help
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {/* FEATURED STRIP */}
          {featuredUniversities.length > 0 && (
            <section className="mt-8">
              <div className="mb-5 flex items-end justify-between gap-4">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-orange-600">
                    Quick Start
                  </p>
                  <h2 className="mt-2 text-3xl font-black tracking-[-0.045em]">
                    Four universities to start exploring.
                  </h2>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                {featuredUniversities.map((university) => (
                  <FeaturedUniversityCard
                    key={university.slug}
                    university={university}
                  />
                ))}
              </div>
            </section>
          )}

          {/* DIRECTORY CONTROLS */}
          <section id="university-directory" className="mt-12 scroll-mt-28">
            <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.16em] text-orange-600">
                  University Directory
                </p>
                <h2 className="mt-2 text-3xl font-black tracking-[-0.045em] md:text-4xl">
                  Browse in pages, not one endless wall.
                </h2>
                <p className="mt-2 max-w-2xl text-sm font-semibold leading-7 text-slate-600">
                  Use the quick views below or your filters above. Each page shows
                  only twelve universities, so students can actually compare what
                  they are seeing.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="flex flex-wrap gap-2">
                  {viewModes.map((mode) => (
                    <button
                      key={mode.id}
                      type="button"
                      onClick={() => setViewMode(mode.id)}
                      className={`rounded-full px-4 py-2 text-xs font-black transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] focus:outline-none focus-visible:ring-4 focus-visible:ring-orange-200 ${
                        viewMode === mode.id
                          ? "bg-[#071b3a] text-white shadow-md"
                          : "bg-white text-[#071b3a] ring-1 ring-orange-100 hover:bg-orange-50"
                      }`}
                    >
                      {mode.label}
                    </button>
                  ))}
                </div>

                <select
                  value={sortMode}
                  onChange={(event) => setSortMode(event.target.value)}
                  aria-label="Sort universities"
                  className="h-10 rounded-full border border-orange-100 bg-white px-4 text-xs font-black text-[#071b3a] outline-none transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] focus:border-orange-300 focus-visible:ring-4 focus-visible:ring-orange-100"
                >
                  <option value="recommended">Recommended order</option>
                  <option value="name">Name A–Z</option>
                  <option value="city">City A–Z</option>
                  <option value="value">Best tuition value</option>
                </select>
              </div>
            </div>

            {paginatedUniversities.length > 0 ? (
              <>
                <div className="mt-7 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {paginatedUniversities.map((university) => (
                    <UniversityListCard
                      key={university.slug}
                      university={university}
                    />
                  ))}
                </div>

                <Pagination
                  page={page}
                  totalPages={totalPages}
                  onChange={goToPage}
                />
              </>
            ) : (
              <div className="mt-8 rounded-[2rem] bg-white p-10 text-center shadow-sm ring-1 ring-orange-100">
                <h3 className="text-2xl font-black">No universities found.</h3>
                <p className="mt-3 font-semibold text-slate-600">
                  Try “CS”, “medicine”, “engineering”, “business”, “Milan”, or
                  clear the filters.
                </p>
                <button
                  type="button"
                  onClick={resetFilters}
                  className={`mt-5 rounded-full bg-orange-600 px-7 py-4 text-sm font-black text-white hover:-translate-y-1 hover:bg-orange-700 focus:outline-none focus-visible:ring-4 focus-visible:ring-orange-200 ${INTERACTIVE_TRANSITION}`}
                >
                  Clear Filters
                </button>
              </div>
            )}
          </section>
        </section>
      </main>

      <Footer />
    </>
  );
}

function FilterSelect({ value, onChange, options }) {
  return (
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="h-14 w-full rounded-2xl border border-orange-100 bg-[#fff8f1] px-4 text-sm font-black text-[#071b3a] outline-none transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] focus:border-orange-300 focus:bg-white focus-visible:ring-4 focus-visible:ring-orange-100"
    >
      {options.map((option) => (
        <option key={option} value={option}>
          {option}
        </option>
      ))}
    </select>
  );
}

function FeaturedUniversityCard({ university }) {
  return (
    <article className="group overflow-hidden rounded-[1.7rem] bg-white shadow-[0_18px_46px_rgba(15,23,42,0.07)] ring-1 ring-orange-100 transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-1 hover:shadow-[0_28px_65px_rgba(255,91,18,0.14)]">
      <Link
        to={`/universities/${university.slug}`}
        className="relative block h-48 overflow-hidden bg-orange-50"
      >
        <img
          src={university.image}
          alt={`${university.name} Italy university`}
          loading="lazy"
          decoding="async"
          className="h-full w-full object-cover transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#071b3a]/88 via-[#071b3a]/18 to-transparent" />

        <div className="absolute left-3 top-3 rounded-full bg-white/95 px-2.5 py-1 text-[10px] font-black text-orange-600 shadow-md">
          {university.rank}
        </div>

        <div className="absolute right-3 top-3 rounded-full bg-white/95 px-2.5 py-1 text-[10px] font-black text-[#071b3a] shadow-md">
          {university.type}
        </div>

        <div className="absolute bottom-4 left-4 right-4">
          <p className="mb-2 inline-flex items-center gap-1 rounded-full bg-orange-600 px-2.5 py-1 text-[10px] font-black text-white">
            <MapPin className="h-3 w-3" />
            {university.city}
          </p>

          <h3 className="line-clamp-2 text-xl font-black leading-tight text-white">
            {university.name}
          </h3>
        </div>
      </Link>

      <div className="p-4">
        <div className="flex flex-wrap gap-1.5">
          <span className="rounded-full bg-green-50 px-2.5 py-1 text-[10px] font-black text-green-700 ring-1 ring-green-100">
            {getTuitionBadge(university.tuitionLevel)}
          </span>
          <span className="rounded-full bg-orange-50 px-2.5 py-1 text-[10px] font-black text-orange-700 ring-1 ring-orange-100">
            {getScholarshipBadge(university.scholarshipStrength)}
          </span>
        </div>

        <p className="mt-3 line-clamp-2 text-sm font-semibold leading-6 text-slate-600">
          {university.popularFor}
        </p>

        <Link
          to={`/universities/${university.slug}`}
          className={`mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#071b3a] px-4 py-3 text-xs font-black text-white hover:-translate-y-0.5 hover:bg-[#092b72] focus:outline-none focus-visible:ring-4 focus-visible:ring-orange-200 ${INTERACTIVE_TRANSITION}`}
        >
          View Details
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </article>
  );
}

function UniversityListCard({ university }) {
  return (
    <article className="group rounded-[1.55rem] bg-white p-5 shadow-[0_16px_42px_rgba(15,23,42,0.055)] ring-1 ring-orange-100 transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-0.5 hover:shadow-[0_22px_55px_rgba(255,91,18,0.10)]">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-orange-50 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.1em] text-orange-700 ring-1 ring-orange-100">
              {university.type}
            </span>
            <span className="text-[10px] font-black text-slate-400">
              {university.rank}
            </span>
          </div>

          <h3 className="mt-3 line-clamp-2 text-xl font-black leading-tight text-[#071b3a]">
            {university.name}
          </h3>

          <p className="mt-2 flex items-center gap-1 text-xs font-black text-orange-600">
            <MapPin className="h-3.5 w-3.5" />
            {university.city}, {university.region}
          </p>
        </div>

        <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[#fff1e8] text-orange-600 ring-1 ring-orange-100">
          <Building2 className="h-5 w-5" />
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 text-xs font-bold text-slate-600">
        <div className="rounded-xl bg-[#fffaf5] px-3 py-2 ring-1 ring-orange-100">
          💰 {university.tuition}
        </div>
        <div className="rounded-xl bg-[#fffaf5] px-3 py-2 ring-1 ring-orange-100">
          🎓 {university.scholarship}
        </div>
      </div>

      <div className="mt-4 rounded-xl bg-[#fff8f1] p-3 ring-1 ring-orange-100">
        <p className="text-[9px] font-black uppercase tracking-[0.13em] text-orange-600">
          Best For
        </p>
        <p className="mt-1 line-clamp-2 text-sm font-black leading-6 text-[#071b3a]">
          {university.popularFor}
        </p>
      </div>

      <div className="mt-4 flex flex-wrap gap-1.5">
        {university.programs.slice(0, 3).map((program) => (
          <span
            key={program}
            className="rounded-full bg-orange-50 px-2.5 py-1 text-[10px] font-black text-orange-700 ring-1 ring-orange-100"
          >
            {program}
          </span>
        ))}
      </div>

      <div className="mt-4 flex gap-2">
        <Link
          to={`/universities/${university.slug}`}
          className={`inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#071b3a] px-4 py-3 text-xs font-black text-white hover:-translate-y-0.5 hover:bg-[#092b72] focus:outline-none focus-visible:ring-4 focus-visible:ring-orange-200 ${INTERACTIVE_TRANSITION}`}
        >
          View University
          <BookOpenCheck className="h-4 w-4" />
        </Link>

        <Link
          to={`/appointment?country=Italy&university=${encodeURIComponent(
            university.name
          )}&service=University%20Guidance`}
          className={`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-orange-600 text-white hover:-translate-y-0.5 hover:bg-orange-700 focus:outline-none focus-visible:ring-4 focus-visible:ring-orange-200 ${INTERACTIVE_TRANSITION}`}
          aria-label={`Get guidance for ${university.name}`}
        >
          <Star className="h-4 w-4" />
        </Link>
      </div>
    </article>
  );
}

function Pagination({ page, totalPages, onChange }) {
  if (totalPages <= 1) return null;

  const pages = Array.from({ length: totalPages }, (_, index) => index + 1);

  return (
    <div className="mt-8 flex flex-col items-center justify-between gap-4 rounded-[1.5rem] bg-white p-4 shadow-sm ring-1 ring-orange-100 sm:flex-row">
      <button
        type="button"
        onClick={() => onChange(Math.max(1, page - 1))}
        disabled={page === 1}
        className="inline-flex items-center gap-2 rounded-xl bg-[#fff7ed] px-4 py-3 text-xs font-black text-[#071b3a] ring-1 ring-orange-100 transition-colors duration-300 hover:bg-orange-50 focus:outline-none focus-visible:ring-4 focus-visible:ring-orange-200 disabled:cursor-not-allowed disabled:opacity-40"
      >
        <ChevronLeft className="h-4 w-4" />
        Previous
      </button>

      <div className="flex flex-wrap justify-center gap-2">
        {pages.map((pageNumber) => (
          <button
            key={pageNumber}
            type="button"
            onClick={() => onChange(pageNumber)}
            className={`grid h-10 min-w-10 place-items-center rounded-xl px-3 text-xs font-black transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] focus:outline-none focus-visible:ring-4 focus-visible:ring-orange-200 ${
              page === pageNumber
                ? "bg-orange-600 text-white shadow-lg shadow-orange-600/20"
                : "bg-[#fff7ed] text-[#071b3a] ring-1 ring-orange-100 hover:bg-orange-50"
            }`}
          >
            {pageNumber}
          </button>
        ))}
      </div>

      <button
        type="button"
        onClick={() => onChange(Math.min(totalPages, page + 1))}
        disabled={page === totalPages}
        className="inline-flex items-center gap-2 rounded-xl bg-[#fff7ed] px-4 py-3 text-xs font-black text-[#071b3a] ring-1 ring-orange-100 transition-colors duration-300 hover:bg-orange-50 focus:outline-none focus-visible:ring-4 focus-visible:ring-orange-200 disabled:cursor-not-allowed disabled:opacity-40"
      >
        Next
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}

export default UniversitiesPage;
