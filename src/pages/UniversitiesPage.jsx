import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  BadgePercent,
  BookOpenCheck,
  Building2,
  Filter,
  GraduationCap,
  Landmark,
  MapPin,
  Search,
  Sparkles,
  Star,
  Wallet,
  X,
} from "lucide-react";

import Footer from "../components/Footer";

import {
  cityFilters,
  getScholarshipBadge,
  getTuitionBadge,
  italianUniversities,
  programFilters,
  scholarshipFilters,
  tuitionFilters,
  typeFilters,
} from "../data/italianUniversities";

const smartChips = [
  "Computer Science",
  "Medicine",
  "Engineering",
  "Business",
  "Architecture",
  "Design",
  "Budget",
  "Strong Scholarships",
  "Milan",
  "Rome",
  "Turin",
  "DSU",
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
  const [search, setSearch] = useState("");
  const [city, setCity] = useState("All");
  const [program, setProgram] = useState("All");
  const [type, setType] = useState("All");
  const [tuition, setTuition] = useState("All");
  const [scholarship, setScholarship] = useState("All");

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

      return (
        matchesSearch &&
        matchesCity &&
        matchesProgram &&
        matchesType &&
        matchesTuition &&
        matchesScholarship
      );
    });
  }, [search, city, program, type, tuition, scholarship]);

  const resetFilters = () => {
    setSearch("");
    setCity("All");
    setProgram("All");
    setType("All");
    setTuition("All");
    setScholarship("All");
  };

  const hasFilters =
    search ||
    city !== "All" ||
    program !== "All" ||
    type !== "All" ||
    tuition !== "All" ||
    scholarship !== "All";

  return (
    <>
      <main className="relative overflow-hidden bg-[#fff7ed] pt-32 text-[#071b3a]">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_12%,rgba(255,91,18,0.15),transparent_30%),radial-gradient(circle_at_88%_10%,rgba(255,184,96,0.18),transparent_26%)]" />
        <div className="pointer-events-none absolute left-[-160px] top-32 h-96 w-96 rounded-full bg-orange-300/20 blur-3xl" />
        <div className="pointer-events-none absolute right-[-160px] bottom-24 h-96 w-96 rounded-full bg-orange-500/10 blur-3xl" />

        <section className="relative mx-auto max-w-[1500px] px-4 pb-16 sm:px-6 lg:px-10">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-xs font-black uppercase tracking-[0.18em] text-orange-600 shadow-sm ring-1 ring-orange-100">
              <Sparkles className="h-4 w-4 fill-orange-500" />
              Smart Italy University Finder
            </div>

            <h1 className="mx-auto mt-6 max-w-5xl text-5xl font-black leading-[0.95] tracking-[-0.06em] md:text-7xl">
              Find the right <span className="text-orange-600">Italian university</span>.
            </h1>

            <p className="mx-auto mt-6 max-w-3xl text-lg font-semibold leading-8 text-slate-600">
              Search naturally: try “CS”, “medicine”, “cheap”, “scholarship”,
              “Milan”, “engineering”, or “business”. Each result opens a proper
              university profile.
            </p>
          </div>

          <div className="mt-10 rounded-[2.3rem] bg-white/92 p-5 shadow-[0_24px_70px_rgba(15,23,42,0.08)] ring-1 ring-orange-100">
            <div className="grid gap-4 lg:grid-cols-[1.6fr_repeat(5,1fr)_auto]">
              <div className="relative">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Try: CS, medicine, scholarship, cheap, Milan..."
                  className="h-14 w-full rounded-2xl border border-orange-100 bg-[#fff8f1] pl-12 pr-4 text-sm font-bold outline-none transition focus:border-orange-300 focus:bg-white focus:ring-4 focus:ring-orange-100"
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
                className="inline-flex h-14 items-center justify-center gap-2 rounded-2xl bg-[#071b3a] px-5 text-sm font-black text-white transition hover:-translate-y-0.5 hover:bg-[#092b72] disabled:cursor-not-allowed disabled:opacity-45"
              >
                <X className="h-4 w-4" />
                Reset
              </button>
            </div>

            <div className="mt-4 flex flex-wrap justify-center gap-2">
              {smartChips.map((chip) => (
                <button
                  key={chip}
                  type="button"
                  onClick={() => setSearch(chip)}
                  className="rounded-full bg-white px-4 py-2 text-xs font-black text-orange-700 ring-1 ring-orange-100 transition hover:-translate-y-0.5 hover:bg-orange-50"
                >
                  {chip}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-3 rounded-[1.7rem] bg-white/80 p-5 shadow-sm ring-1 ring-orange-100 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-orange-50 text-orange-600">
                <Filter className="h-6 w-6" />
              </div>

              <div>
                <p className="text-sm font-black text-[#071b3a]">
                  Showing {filteredUniversities.length} of{" "}
                  {italianUniversities.length} universities
                </p>
                <p className="text-xs font-bold text-slate-500">
                  Use smart search or filters to shortlist faster.
                </p>
              </div>
            </div>

            <a
              href="/appointment?country=Italy&service=University Shortlist"
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-orange-600 px-6 py-4 text-sm font-black text-white shadow-lg shadow-orange-600/20 transition hover:-translate-y-1 hover:bg-orange-700"
            >
              Get Shortlist Help
              <ArrowRight className="h-4 w-4" />
            </a>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredUniversities.map((university) => (
              <UniversityCard key={university.slug} university={university} />
            ))}
          </div>

          {filteredUniversities.length === 0 && (
            <div className="mt-8 rounded-[2rem] bg-white p-10 text-center shadow-sm ring-1 ring-orange-100">
              <h3 className="text-2xl font-black">No universities found.</h3>
              <p className="mt-3 font-semibold text-slate-600">
                Try “CS”, “medicine”, “engineering”, “business”, “Milan”, or clear the filters.
              </p>
              <button
                type="button"
                onClick={resetFilters}
                className="mt-5 rounded-full bg-orange-600 px-7 py-4 text-sm font-black text-white"
              >
                Clear Filters
              </button>
            </div>
          )}
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
      className="h-14 w-full rounded-2xl border border-orange-100 bg-[#fff8f1] px-4 text-sm font-black text-[#071b3a] outline-none transition focus:border-orange-300 focus:bg-white focus:ring-4 focus:ring-orange-100"
    >
      {options.map((option) => (
        <option key={option} value={option}>
          {option}
        </option>
      ))}
    </select>
  );
}

function UniversityCard({ university }) {
  return (
    <article className="group overflow-hidden rounded-[1.6rem] bg-white shadow-[0_18px_46px_rgba(15,23,42,0.07)] ring-1 ring-orange-100 transition duration-500 hover:-translate-y-1 hover:shadow-[0_28px_65px_rgba(255,91,18,0.14)]">
      <Link
        to={`/universities/${university.slug}`}
        className="relative block h-44 overflow-hidden bg-orange-50"
      >
        <img
          src={university.image}
          alt={`${university.name} Italy university`}
          className="h-full w-full object-cover transition duration-700 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#071b3a]/82 via-[#071b3a]/22 to-transparent" />

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

          <h3 className="line-clamp-2 text-lg font-black leading-tight text-white">
            {university.name}
          </h3>
        </div>
      </Link>

      <div className="p-4">
        <div className="mb-3 flex flex-wrap gap-1.5">
          <span className="rounded-full bg-green-50 px-2.5 py-1 text-[10px] font-black text-green-700 ring-1 ring-green-100">
            {getTuitionBadge(university.tuitionLevel)}
          </span>
          <span className="rounded-full bg-orange-50 px-2.5 py-1 text-[10px] font-black text-orange-700 ring-1 ring-orange-100">
            {getScholarshipBadge(university.scholarshipStrength)}
          </span>
        </div>

        <div className="grid gap-1.5 text-xs font-bold leading-5 text-slate-600">
          <p>💰 {university.tuition}</p>
          <p>🎓 {university.scholarship}</p>
          <p>
            📍 {university.city}, {university.region}
          </p>
        </div>

        <div className="mt-3 rounded-[1.2rem] bg-[#fff8f1] p-3 ring-1 ring-orange-100">
          <p className="text-[9px] font-black uppercase tracking-[0.14em] text-orange-600">
            Best For
          </p>
          <p className="mt-1 line-clamp-2 text-xs font-black leading-5 text-[#071b3a]">
            {university.popularFor}
          </p>
        </div>

        <div className="mt-3 flex flex-wrap gap-1.5">
          {university.programs.slice(0, 3).map((program) => (
            <span
              key={program}
              className="rounded-full bg-orange-50 px-2.5 py-1 text-[10px] font-black text-orange-700 ring-1 ring-orange-100"
            >
              {program}
            </span>
          ))}
        </div>

        <div className="mt-4 grid gap-2">
          <Link
            to={`/universities/${university.slug}`}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#071b3a] px-4 py-3 text-xs font-black text-white transition hover:-translate-y-0.5 hover:bg-[#092b72]"
          >
            View University Details
            <BookOpenCheck className="h-4 w-4" />
          </Link>

          <a
            href={`/appointment?country=Italy&university=${encodeURIComponent(
              university.name
            )}&service=University Guidance`}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-orange-600 px-4 py-3 text-xs font-black text-white shadow-lg shadow-orange-600/20 transition hover:-translate-y-0.5 hover:bg-orange-700"
          >
            Get Guidance
            <Star className="h-4 w-4" />
          </a>
        </div>
      </div>
    </article>
  );
}

export default UniversitiesPage;