import React, { useMemo, useState } from "react";
import {
  ArrowRight,
  BadgePercent,
  Building2,
  CalendarDays,
  ChevronRight,
  GraduationCap,
  Heart,
  MapPin,
  Search,
  Sparkles,
  Trophy,
  UsersRound,
  Wallet,
} from "lucide-react";

import australiaUniversity from "../assets/images/universities/australia-university.png";
import canadaUniversity from "../assets/images/universities/canada-university.png";
import germanyUniversity from "../assets/images/universities/germany-university.png";
import italyUniversity from "../assets/images/universities/italy-university.png";
import turkeyUniversity from "../assets/images/universities/turkey-university.png";
import ukUniversity from "../assets/images/universities/uk-university.png";
import mascotExplorer from "../assets/images/universities/mascot-explorer.png";
import mascotThumbsup from "../assets/images/universities/mascot-thumbsup.png";

const universities = [
  {
    rank: "#1",
    name: "University of Bologna",
    country: "Italy",
    flag: "🇮🇹",
    city: "Bologna",
    tuition: "€6k - €15k",
    intake: "Sep / Feb",
    programs: ["Design", "Engineering", "Business"],
    scholarships: "Available",
    image: italyUniversity,
    accent: "from-emerald-500/20 via-black/5 to-orange-500/10",
  },
  {
    rank: "#2",
    name: "LMU Munich",
    country: "Germany",
    flag: "🇩🇪",
    city: "Munich",
    tuition: "€0 - €3k",
    intake: "Apr / Oct",
    programs: ["Engineering", "CS", "Business"],
    scholarships: "Limited",
    image: germanyUniversity,
    accent: "from-slate-500/15 via-black/5 to-orange-500/10",
  },
  {
    rank: "#3",
    name: "University of Oxford",
    country: "United Kingdom",
    flag: "🇬🇧",
    city: "Oxford",
    tuition: "£10k - £24k",
    intake: "Sep / Jan",
    programs: ["Law", "Medicine", "Humanities"],
    scholarships: "Available",
    image: ukUniversity,
    accent: "from-blue-500/15 via-black/5 to-orange-500/10",
  },
  {
    rank: "#4",
    name: "Boğaziçi University",
    country: "Turkey",
    flag: "🇹🇷",
    city: "Istanbul",
    tuition: "$3k - $8k",
    intake: "Sep / Feb",
    programs: ["Medicine", "Engineering", "Business"],
    scholarships: "Available",
    image: turkeyUniversity,
    accent: "from-red-500/15 via-black/5 to-orange-500/10",
  },
  {
    rank: "#5",
    name: "University of Sydney",
    country: "Australia",
    flag: "🇦🇺",
    city: "Sydney",
    tuition: "AUD 14k - 28k",
    intake: "Feb / Jul",
    programs: ["IT", "Engineering", "Health Sciences"],
    scholarships: "Available",
    image: australiaUniversity,
    accent: "from-sky-500/15 via-black/5 to-orange-500/10",
  },
  {
    rank: "#6",
    name: "University of Toronto",
    country: "Canada",
    flag: "🇨🇦",
    city: "Toronto",
    tuition: "CAD 12k - 20k",
    intake: "Jan / Sep",
    programs: ["Engineering", "CS", "Business"],
    scholarships: "Available",
    image: canadaUniversity,
    accent: "from-red-500/15 via-black/5 to-orange-500/10",
  },
];

const countryFilters = [
  "All",
  "Italy",
  "Germany",
  "United Kingdom",
  "Turkey",
  "Australia",
  "Canada",
];

const highlights = [
  {
    icon: Trophy,
    title: "Compare Easily",
    copy: "Compare fees, rankings, intakes and course options.",
  },
  {
    icon: BadgePercent,
    title: "Scholarships Available",
    copy: "Find scholarship routes that match your profile.",
  },
  {
    icon: Heart,
    title: "Shortlist & Save",
    copy: "Save your favorite universities before applying.",
  },
  {
    icon: UsersRound,
    title: "Expert Guidance",
    copy: "Get expert advice for the right university choice.",
  },
];

export default function PublicUniversityExplorer() {
  const [country, setCountry] = useState("All");
  const [query, setQuery] = useState("");
  const [savedUniversities, setSavedUniversities] = useState([]);

  const filteredUniversities = useMemo(() => {
    return universities.filter((university) => {
      const searchable = `${university.name} ${university.country} ${
        university.city
      } ${university.programs.join(" ")}`.toLowerCase();

      const matchesQuery = searchable.includes(query.trim().toLowerCase());
      const matchesCountry = country === "All" || university.country === country;

      return matchesQuery && matchesCountry;
    });
  }, [country, query]);

  const toggleSavedUniversity = (universityName) => {
    setSavedUniversities((current) =>
      current.includes(universityName)
        ? current.filter((item) => item !== universityName)
        : [...current, universityName]
    );
  };

  const clearFilters = () => {
    setCountry("All");
    setQuery("");
  };

  return (
    <section
      id="universities"
      className="relative overflow-hidden bg-[#fff8f1] py-12 text-[#071b3a] sm:py-16"
    >
      <style>{`
        @media (prefers-reduced-motion: reduce) {
          .university-motion-safe {
            transition: none !important;
            transform: none !important;
          }
        }
      `}</style>

      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_70%_5%,rgba(255,110,28,0.16),transparent_32%),radial-gradient(circle_at_10%_80%,rgba(255,172,92,0.18),transparent_28%)]" />
      <div className="pointer-events-none absolute left-10 top-20 hidden h-24 w-24 rounded-full bg-white/70 blur-2xl lg:block" />
      <div className="pointer-events-none absolute right-16 top-12 hidden h-28 w-28 rounded-full bg-white/80 blur-2xl lg:block" />

      <div className="relative mx-auto max-w-[1500px] px-4 sm:px-6 lg:px-10">
        <div className="grid gap-8 lg:grid-cols-[1.05fr_1fr] lg:items-center">
          <div className="pt-2 text-center lg:pt-4 lg:text-left">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-orange-100 bg-white/85 px-5 py-2 text-[10px] font-black uppercase tracking-[0.16em] text-orange-600 shadow-sm sm:text-xs sm:tracking-[0.18em]">
              <Sparkles className="h-4 w-4 fill-orange-500" />
              Explore. Compare. Choose your future.
            </div>

            <h2 className="mx-auto max-w-3xl text-4xl font-black leading-[1.02] tracking-tight text-[#071b3a] sm:text-6xl lg:mx-0 lg:text-7xl lg:leading-[0.98]">
              Find <span className="text-orange-600">Universities</span>
              <br />
              That Fit Your Dreams
            </h2>

            <p className="mx-auto mt-5 max-w-2xl text-base font-medium leading-7 text-slate-700 sm:text-lg sm:leading-8 lg:mx-0">
              Explore universities from Italy, Germany, UK, Turkey, Australia
              and Canada with real campus-style cards, tuition ranges, intakes
              and course options.
            </p>

            <div className="mx-auto mt-7 grid max-w-3xl grid-cols-2 overflow-hidden rounded-3xl border border-orange-100 bg-white/90 shadow-[0_18px_55px_rgba(15,23,42,0.08)] sm:grid-cols-4 lg:mx-0">
              {[
                [GraduationCap, "2000+", "Universities"],
                [Building2, "60+", "Countries"],
                [BadgePercent, "500+", "Scholarships"],
                [UsersRound, "25K+", "Students Guided"],
              ].map(([Icon, value, label]) => (
                <div
                  key={label}
                  className="flex items-center justify-center gap-3 border-orange-100 px-4 py-5 transition hover:bg-orange-50/50 sm:border-r sm:last:border-r-0 lg:justify-start lg:px-5"
                >
                  <div className="rounded-2xl bg-orange-50 p-2 text-orange-600">
                    <Icon className="h-6 w-6 sm:h-7 sm:w-7" />
                  </div>
                  <div className="text-left">
                    <div className="text-xl font-black leading-none text-[#071b3a] sm:text-2xl">
                      {value}
                    </div>
                    <div className="mt-1 text-[11px] font-bold text-slate-600 sm:text-xs">
                      {label}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="relative hidden min-h-[500px] lg:block">
            <div className="absolute left-4 top-6 h-[390px] w-[390px] rounded-full bg-orange-400/20 blur-3xl" />
            <div className="absolute right-4 top-10 h-72 w-72 rounded-full bg-white/80 blur-2xl" />

            <div className="relative mx-auto flex max-w-[620px] justify-center">
              <div className="absolute right-8 top-10 h-[370px] w-[370px] rounded-full bg-gradient-to-br from-orange-200 via-orange-100 to-white shadow-inner" />

              <img
                src={mascotExplorer}
                alt="Zaifan student exploring universities with a map"
                className="relative z-10 max-h-[520px] w-full object-contain drop-shadow-[0_28px_35px_rgba(15,23,42,0.16)]"
              />

              <div className="absolute right-0 top-20 z-20 rounded-3xl border border-orange-100 bg-white/95 px-5 py-4 shadow-xl">
                <div className="text-sm font-black text-[#071b3a]">
                  Your Future
                </div>
                <div className="mt-1 flex items-center gap-2 text-lg font-black text-orange-600">
                  Starts Here <Heart className="h-4 w-4" />
                </div>
              </div>

              <div className="absolute -right-1 bottom-8 z-20 w-[320px] rounded-3xl border border-orange-100 bg-white/95 p-5 shadow-[0_22px_50px_rgba(15,23,42,0.12)]">
                <h3 className="text-sm font-black text-[#071b3a]">
                  Search Your Dream University
                </h3>

                <div className="relative mt-4">
                  <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Search by university name"
                    className="h-11 w-full rounded-xl border border-orange-100 bg-white pl-11 pr-4 text-xs font-bold text-slate-700 outline-none transition focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
                  />
                </div>

                <div className="mt-3">
                  <select
                    value={country}
                    onChange={(event) => setCountry(event.target.value)}
                    className="h-10 w-full rounded-xl border border-orange-100 bg-white px-3 text-xs font-bold text-slate-700 outline-none transition focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
                  >
                    {countryFilters.map((item) => (
                      <option key={item}>{item}</option>
                    ))}
                  </select>
                </div>

                <a
                  href="/appointment"
                  className="mt-3 inline-flex h-11 w-full items-center justify-center rounded-xl bg-orange-600 text-sm font-black text-white shadow-lg shadow-orange-600/20 transition hover:-translate-y-0.5 hover:bg-orange-700 focus:outline-none focus:ring-4 focus:ring-orange-200"
                >
                  Search Universities
                </a>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 rounded-[2rem] border border-orange-100 bg-white/80 p-4 shadow-[0_25px_80px_rgba(15,23,42,0.08)] backdrop-blur-xl lg:p-5">
          <div className="space-y-5">
            <div className="flex flex-col gap-5 rounded-[1.6rem] bg-gradient-to-r from-orange-50 via-white to-orange-50 p-6 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="inline-flex rounded-full border border-orange-100 bg-white px-4 py-2 text-xs font-black uppercase tracking-wide text-orange-600">
                  Handpicked for you
                </div>

                <h3 className="mt-4 text-3xl font-black leading-tight text-[#071b3a] sm:text-4xl">
                  Featured <span className="text-orange-600">Universities</span>
                </h3>

                <p className="mt-3 max-w-2xl text-sm font-semibold leading-6 text-slate-600">
                  Showing {filteredUniversities.length} of {universities.length}
                  {" "}universities.{" "}
                  {savedUniversities.length > 0
                    ? `${savedUniversities.length} saved to your shortlist.`
                    : "Tap the heart to save your favorites."}
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                {countryFilters.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setCountry(item)}
                    className={`rounded-full px-4 py-2 text-xs font-black transition hover:-translate-y-0.5 focus:outline-none focus:ring-4 focus:ring-orange-100 ${
                      country === item
                        ? "bg-orange-600 text-white shadow-lg shadow-orange-600/20"
                        : "border border-orange-100 bg-white text-slate-600 hover:border-orange-300 hover:text-orange-600"
                    }`}
                  >
                    {item}
                  </button>
                ))}

                {(query || country !== "All") && (
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-black text-slate-500 transition hover:-translate-y-0.5 hover:border-orange-300 hover:text-orange-600 focus:outline-none focus:ring-4 focus:ring-orange-100"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>

            <div className="relative lg:hidden">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search universities, city or program"
                className="h-12 w-full rounded-2xl border border-orange-100 bg-white pl-11 pr-4 text-sm font-bold text-slate-700 outline-none transition focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
              />
            </div>

            {filteredUniversities.length > 0 ? (
              <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                {filteredUniversities.map((university) => {
                  const isSaved = savedUniversities.includes(university.name);

                  return (
                    <article
                      key={university.name}
                      className="group overflow-hidden rounded-[1.8rem] border border-orange-100 bg-white shadow-sm transition duration-500 hover:-translate-y-3 hover:shadow-[0_30px_70px_rgba(15,23,42,0.14)]"
                    >
                      <div className="relative h-56 overflow-hidden">
                        <img
                          src={university.image}
                          alt={`${university.name} campus`}
                          className="h-full w-full object-cover transition duration-700 group-hover:scale-110"
                        />

                        <div className={`absolute inset-0 bg-gradient-to-t ${university.accent}`} />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#071b3a]/35 via-transparent to-transparent" />

                        <div className="absolute bottom-3 left-3 rounded-full bg-[#071b3a] px-3 py-1 text-sm font-black text-white shadow-lg transition duration-300 group-hover:bg-orange-600">
                          {university.rank}
                        </div>

                        <div className="absolute left-3 top-3 rounded-full bg-white/95 px-3 py-1 text-xs font-black text-orange-600 shadow-md">
                          {university.scholarships} scholarships
                        </div>

                        <button
                          type="button"
                          onClick={() => toggleSavedUniversity(university.name)}
                          className={`absolute right-3 top-3 inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/95 shadow-md transition hover:scale-110 focus:outline-none focus:ring-4 focus:ring-orange-100 ${
                            isSaved ? "text-orange-600" : "text-slate-600 hover:text-orange-600"
                          }`}
                          aria-label={`${isSaved ? "Remove" : "Save"} ${university.name}`}
                        >
                          <Heart
                            className="h-5 w-5"
                            fill={isSaved ? "currentColor" : "none"}
                          />
                        </button>
                      </div>

                      <div className="p-5">
                        <h4 className="min-h-[58px] text-xl font-black leading-tight text-[#071b3a]">
                          {university.name}
                        </h4>

                        <div className="mt-2 flex items-center gap-2 text-sm font-black text-slate-700">
                          <span className="text-xl">{university.flag}</span>
                          {university.country}
                        </div>

                        <div className="mt-3 flex items-center gap-2 text-xs font-bold text-slate-500">
                          <MapPin className="h-4 w-4 text-orange-600" />
                          {university.city}
                        </div>

                        <div className="mt-5 space-y-3 border-t border-orange-100 pt-4 text-xs">
                          <InfoRow
                            icon={GraduationCap}
                            label="QS Ranking"
                            value={university.rank}
                          />
                          <InfoRow
                            icon={Wallet}
                            label="Avg. Tuition"
                            value={university.tuition}
                          />
                          <InfoRow
                            icon={CalendarDays}
                            label="Intake"
                            value={university.intake}
                          />
                        </div>

                        <div className="mt-4 flex flex-wrap gap-1.5">
                          {university.programs.slice(0, 3).map((program) => (
                            <span
                              key={program}
                              className="rounded-full bg-orange-50 px-2.5 py-1 text-[10px] font-black text-orange-700 transition group-hover:bg-orange-100"
                            >
                              {program}
                            </span>
                          ))}
                        </div>

                        <a
                          href={`/appointment?university=${encodeURIComponent(university.name)}`}
                          className="mt-5 inline-flex h-11 w-full items-center justify-center gap-2 rounded-2xl border border-orange-200 bg-white text-sm font-black text-orange-600 transition hover:border-orange-600 hover:bg-orange-600 hover:text-white focus:outline-none focus:ring-4 focus:ring-orange-100"
                        >
                          View Details
                          <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                        </a>
                      </div>
                    </article>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-[1.8rem] border border-orange-100 bg-white p-10 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-orange-50 text-orange-600">
                  <Search className="h-8 w-8" />
                </div>
                <h4 className="mt-5 text-2xl font-black text-[#071b3a]">
                  No universities found
                </h4>
                <p className="mx-auto mt-2 max-w-md text-sm font-semibold leading-6 text-slate-600">
                  Try another country, program, city, or clear your filters.
                </p>
                <button
                  type="button"
                  onClick={clearFilters}
                  className="mt-5 rounded-2xl bg-orange-600 px-6 py-3 text-sm font-black text-white transition hover:-translate-y-1 hover:bg-orange-700"
                >
                  Clear Filters
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="mt-5 grid gap-5 lg:grid-cols-[1.25fr_0.9fr]">
          <div className="grid rounded-[2rem] border border-orange-100 bg-white/85 p-5 shadow-[0_20px_60px_rgba(15,23,42,0.07)] sm:grid-cols-2 lg:grid-cols-4">
            {highlights.map((item) => (
              <div
                key={item.title}
                className="flex gap-4 border-orange-100 p-4 transition hover:-translate-y-1 lg:border-r last:lg:border-r-0"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-orange-50 text-orange-600 transition duration-300 hover:-translate-y-1 hover:scale-105">
                  <item.icon className="h-6 w-6" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-[#071b3a]">
                    {item.title}
                  </h4>
                  <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">
                    {item.copy}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="group relative overflow-hidden rounded-[2rem] border border-orange-100 bg-gradient-to-br from-white via-orange-50 to-purple-50 p-6 shadow-[0_20px_60px_rgba(15,23,42,0.07)] transition duration-500 hover:-translate-y-2 hover:border-orange-200 hover:shadow-[0_30px_80px_rgba(255,91,18,0.18)]">
            <div className="pointer-events-none absolute inset-0 opacity-0 transition duration-500 group-hover:opacity-100">
              <div className="absolute right-10 top-8 h-28 w-28 rounded-full bg-orange-300/25 blur-2xl" />
              <div className="absolute bottom-0 right-12 h-40 w-40 rounded-full bg-white/70 blur-2xl" />
            </div>

            <div className="relative z-10 max-w-full pr-0 sm:max-w-[50%] lg:max-w-[46%] xl:max-w-[48%]">
              <h3 className="text-xl font-black leading-tight text-[#071b3a] transition duration-300 group-hover:text-orange-600">
                Not sure which university is right for you?
              </h3>
              <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
                Our experts will help you shortlist the best universities based
                on your marks, budget and goals.
              </p>
              <a
                href="/appointment"
                className="mt-5 inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-orange-600 px-6 text-sm font-black text-white shadow-lg shadow-orange-600/20 transition duration-300 hover:-translate-y-1 hover:bg-orange-700 group-hover:shadow-xl group-hover:shadow-orange-600/25 focus:outline-none focus:ring-4 focus:ring-orange-100"
              >
                Get Free Consultation
                <ArrowRight className="h-4 w-4 transition duration-300 group-hover:translate-x-1" />
              </a>
            </div>

            <img
              src={mascotThumbsup}
              alt="Zaifan student guide"
              className="pointer-events-none absolute -bottom-10 -right-12 hidden h-64 object-contain drop-shadow-xl transition duration-500 group-hover:-translate-y-2 group-hover:scale-105 sm:block md:-right-10 lg:-right-16 xl:-right-10"
            />

            <a
               href="/appointment"
  aria-label="Book appointment"
              className="absolute right-8 top-8 hidden h-14 w-14 items-center justify-center rounded-full bg-orange-500 text-white shadow-xl shadow-orange-500/25 transition duration-300 hover:scale-110 hover:bg-orange-600 group-hover:scale-110 group-hover:shadow-2xl group-hover:shadow-orange-500/30 focus:outline-none focus:ring-4 focus:ring-orange-100 lg:inline-flex"
            >
              <ChevronRight className="h-7 w-7 transition duration-300 group-hover:translate-x-1" />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

function InfoRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-2 font-bold text-slate-500">
        <Icon className="h-4 w-4 text-orange-600" />
        {label}
      </div>
      <div className="text-right font-black text-[#071b3a]">{value}</div>
    </div>
  );
}
