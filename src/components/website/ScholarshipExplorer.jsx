import React, { useMemo, useState } from "react";
import {
  Search,
  GraduationCap,
  Globe2,
  BadgePercent,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  CalendarDays,
  Wallet,
  MapPin,
} from "lucide-react";

const scholarships = [
  {
    id: 1,
    title: "UK Merit Scholarship Pathway",
    country: "United Kingdom",
    level: "Undergraduate",
    funding: "Partial Funding",
    amount: "Up to £5,000",
    intake: "Sep / Jan",
    tags: ["Merit Based", "Popular", "Fast Apply"],
    description:
      "For students with strong academic records applying to UK partner universities.",
  },
  {
    id: 2,
    title: "Postgraduate Excellence Award",
    country: "United Kingdom",
    level: "Postgraduate",
    funding: "Partial Funding",
    amount: "Up to £8,000",
    intake: "Sep / Jan",
    tags: ["Masters", "High Value"],
    description:
      "Designed for master’s applicants with strong grades and a clear study plan.",
  },
  {
    id: 3,
    title: "Australia International Student Grant",
    country: "Australia",
    level: "Undergraduate",
    funding: "Partial Funding",
    amount: "10% - 25%",
    intake: "Feb / Jul",
    tags: ["Australia", "Tuition Discount"],
    description:
      "Tuition support for eligible international students applying to Australian universities.",
  },
  {
    id: 4,
    title: "Canada Academic Entry Scholarship",
    country: "Canada",
    level: "Undergraduate",
    funding: "Partial Funding",
    amount: "CAD 2,000+",
    intake: "Jan / May / Sep",
    tags: ["Canada", "Academic"],
    description:
      "Scholarship route for students applying to Canadian institutions with strong academics.",
  },
  {
    id: 5,
    title: "Europe Affordable Study Scholarship",
    country: "Europe",
    level: "Postgraduate",
    funding: "Low Tuition",
    amount: "Low fee route",
    intake: "Sep / Feb",
    tags: ["Affordable", "Europe"],
    description:
      "For students looking for lower tuition study routes across selected European destinations.",
  },
  {
    id: 6,
    title: "Foundation Year Progression Grant",
    country: "United Kingdom",
    level: "Foundation",
    funding: "Partial Funding",
    amount: "Up to £3,000",
    intake: "Sep / Jan / May",
    tags: ["Foundation", "Progression"],
    description:
      "Support for students starting through foundation or pathway programs before degree entry.",
  },
];

const countries = ["All", "United Kingdom", "Australia", "Canada", "Europe"];
const levels = ["All", "Foundation", "Undergraduate", "Postgraduate"];
const fundingTypes = ["All", "Partial Funding", "Low Tuition"];

export default function ScholarshipExplorer() {
  const [query, setQuery] = useState("");
  const [country, setCountry] = useState("All");
  const [level, setLevel] = useState("All");
  const [funding, setFunding] = useState("All");

  const filteredScholarships = useMemo(() => {
    return scholarships.filter((item) => {
      const matchesQuery =
        item.title.toLowerCase().includes(query.toLowerCase()) ||
        item.country.toLowerCase().includes(query.toLowerCase()) ||
        item.description.toLowerCase().includes(query.toLowerCase());

      const matchesCountry = country === "All" || item.country === country;
      const matchesLevel = level === "All" || item.level === level;
      const matchesFunding = funding === "All" || item.funding === funding;

      return matchesQuery && matchesCountry && matchesLevel && matchesFunding;
    });
  }, [query, country, level, funding]);

  return (
    <section className="relative overflow-hidden bg-white py-20">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-200 to-transparent" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
          <div>
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700">
              <Sparkles className="h-4 w-4" />
              Scholarship Explorer
            </div>

            <h2 className="text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl lg:text-5xl">
              Find scholarships before you apply.
            </h2>

            <p className="mt-5 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
              Explore scholarship pathways by country, study level, intake, and
              funding type. Zaifan helps students identify realistic scholarship
              options and prepare stronger applications.
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                <Globe2 className="mb-3 h-6 w-6 text-emerald-600" />
                <p className="text-sm font-bold text-slate-950">
                  Multiple Destinations
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  UK, Australia, Canada, Europe
                </p>
              </div>

              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                <BadgePercent className="mb-3 h-6 w-6 text-emerald-600" />
                <p className="text-sm font-bold text-slate-950">
                  Funding Routes
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  Merit, discounts, low tuition
                </p>
              </div>

              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                <GraduationCap className="mb-3 h-6 w-6 text-emerald-600" />
                <p className="text-sm font-bold text-slate-950">
                  All Study Levels
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  Foundation to masters
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-100 bg-slate-50 p-5 shadow-sm">
            <div className="relative">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search scholarships, countries, or programs..."
                className="h-14 w-full rounded-2xl border border-slate-200 bg-white pl-12 pr-4 text-sm font-medium text-slate-800 outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
              />
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <select
                value={country}
                onChange={(event) => setCountry(event.target.value)}
                className="h-12 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none focus:border-emerald-400"
              >
                {countries.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>

              <select
                value={level}
                onChange={(event) => setLevel(event.target.value)}
                className="h-12 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none focus:border-emerald-400"
              >
                {levels.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>

              <select
                value={funding}
                onChange={(event) => setFunding(event.target.value)}
                className="h-12 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none focus:border-emerald-400"
              >
                {fundingTypes.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {filteredScholarships.map((item) => (
            <article
              key={item.id}
              className="group rounded-3xl border border-slate-100 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-emerald-200 hover:shadow-xl"
            >
              <div className="mb-5 flex items-start justify-between gap-4">
                <div className="rounded-2xl bg-emerald-50 p-3 text-emerald-700">
                  <Wallet className="h-6 w-6" />
                </div>

                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
                  {item.funding}
                </span>
              </div>

              <h3 className="text-xl font-bold text-slate-950">
                {item.title}
              </h3>

              <p className="mt-3 text-sm leading-6 text-slate-600">
                {item.description}
              </p>

              <div className="mt-5 space-y-3 text-sm text-slate-600">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-emerald-600" />
                  <span>{item.country}</span>
                </div>

                <div className="flex items-center gap-2">
                  <GraduationCap className="h-4 w-4 text-emerald-600" />
                  <span>{item.level}</span>
                </div>

                <div className="flex items-center gap-2">
                  <CalendarDays className="h-4 w-4 text-emerald-600" />
                  <span>{item.intake}</span>
                </div>

                <div className="flex items-center gap-2">
                  <BadgePercent className="h-4 w-4 text-emerald-600" />
                  <span>{item.amount}</span>
                </div>
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                {item.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              <a
                href="#contact"
                className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-emerald-700 transition group-hover:gap-3"
              >
                Check eligibility
                <ArrowRight className="h-4 w-4" />
              </a>
            </article>
          ))}
        </div>

        {filteredScholarships.length === 0 && (
          <div className="mt-10 rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-10 text-center">
            <p className="text-lg font-bold text-slate-950">
              No scholarship matched your filters.
            </p>
            <p className="mt-2 text-sm text-slate-500">
              Try changing destination, level, or funding type.
            </p>
          </div>
        )}

        <div className="mt-12 overflow-hidden rounded-3xl bg-slate-950 p-8 text-white lg:p-10">
          <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <h3 className="text-2xl font-bold sm:text-3xl">
                Not sure which scholarship fits you?
              </h3>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">
                Book a free consultation and Zaifan will help you shortlist
                countries, universities, programs, and scholarship routes based
                on your academic profile.
              </p>

              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                {[
                  "Profile review",
                  "Scholarship matching",
                  "Application guidance",
                ].map((item) => (
                  <div key={item} className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
              <a
                href="#contact"
                className="inline-flex h-12 items-center justify-center rounded-full bg-emerald-500 px-6 text-sm font-bold text-white transition hover:bg-emerald-400"
              >
                Free Consultation
              </a>

              <a
                href="/student"
                className="inline-flex h-12 items-center justify-center rounded-full border border-white/15 px-6 text-sm font-bold text-white transition hover:bg-white/10"
              >
                Student Login
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}