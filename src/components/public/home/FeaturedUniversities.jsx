import { useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, ArrowUpRight, MapPin, School, Search } from "lucide-react";

import { countryList } from "../../../data/countries";
import { italianUniversities } from "../../../data/italianUniversities";
import { FlagMark, SectionHeader } from "../destinations/DestinationUI";
import { getUniversityPath } from "../destinations/destinationUtils";

// Three well-known universities per country. Italy links to its existing
// detail pages; others link to their profile pages.
function featuredFor(country) {
  if (country.slug === "italy") {
    return italianUniversities.slice(0, 3).map((university) => ({
      key: university.slug,
      name: university.name,
      city: university.city,
      type: university.type,
      popularFor: university.popularFor,
      fees: university.tuition,
      path: `/universities/${university.slug}`,
    }));
  }

  return country.universities.slice(0, 3).map((university) => ({
    key: university.slug,
    name: university.name,
    city: university.city,
    type: university.type,
    popularFor: university.popularFor,
    fees: university.tuitionNote,
    path: getUniversityPath(country, university),
  }));
}

function universityCount(country) {
  return country.slug === "italy" ? italianUniversities.length : country.universities.length;
}

function FeaturedUniversities() {
  const [activeSlug, setActiveSlug] = useState(countryList[0].slug);
  const active = countryList.find((country) => country.slug === activeSlug) || countryList[0];
  const featured = featuredFor(active);
  const total = countryList.reduce((sum, country) => sum + universityCount(country), 0);

  return (
    <section className="bg-[#fff7ed] px-4 py-16 text-[#071f50] sm:px-5 md:py-24">
      <div className="mx-auto max-w-[1350px]">
        <SectionHeader
          eyebrow={`${total} university profiles`}
          title="Universities students actually choose."
          text="Pick a country to see where students usually start, then open a full profile with fees, programmes, requirements and city life."
        />

        <div className="mt-10 flex gap-2 overflow-x-auto pb-2 [scrollbar-width:none] md:justify-center [&::-webkit-scrollbar]:hidden">
          {countryList.map((country) => (
            <button
              key={country.slug}
              type="button"
              onClick={() => setActiveSlug(country.slug)}
              className={`inline-flex shrink-0 items-center gap-2 rounded-full px-3.5 py-2 text-xs font-black ring-1 transition ${
                country.slug === active.slug
                  ? "bg-[#071f50] text-white ring-[#071f50] shadow-[0_12px_30px_rgba(7,31,80,0.25)]"
                  : "bg-white ring-orange-100 hover:text-[#ff4b12]"
              }`}
            >
              <FlagMark country={country} className="h-4 w-6 rounded-[3px]" />
              {country.name}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={active.slug}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="mt-8 grid gap-5 md:grid-cols-3"
          >
            {featured.map((university, index) => (
              <Link
                key={university.key}
                to={university.path}
                className={`group relative flex flex-col overflow-hidden rounded-[30px] p-6 shadow-[0_20px_55px_rgba(9,31,80,0.08)] ring-1 transition hover:-translate-y-1.5 ${
                  index === 0 ? "bg-[#071f50] text-white ring-[#071f50]" : "bg-white ring-orange-100 hover:shadow-[0_28px_70px_rgba(255,75,18,0.14)]"
                }`}
              >
                <div className="pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full border-[24px] border-[#ff4b12]/10" />
                <div className="relative flex items-center justify-between">
                  <div className={`grid h-12 w-12 place-items-center rounded-2xl ${index === 0 ? "bg-white/10 text-[#ffb36d]" : "bg-[#fff1ea] text-[#ff4b12]"}`}>
                    <School size={22} />
                  </div>
                  <span className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.12em] ${index === 0 ? "bg-[#ff4b12] text-white" : "bg-[#071f50] text-white"}`}>
                    {university.type}
                  </span>
                </div>
                <h3 className="relative mt-5 text-2xl font-black leading-7 tracking-[-0.04em]">{university.name}</h3>
                <p className={`relative mt-2 flex items-center gap-1.5 text-xs font-bold ${index === 0 ? "text-white/60" : "text-[#7a879c]"}`}>
                  <MapPin size={13} className="text-[#ff4b12]" />
                  {university.city}, {active.name}
                </p>
                <p className={`relative mt-3 text-sm font-semibold leading-6 ${index === 0 ? "text-white/80" : "text-[#61708a]"}`}>{university.popularFor}</p>
                <p className={`relative mt-auto pt-5 text-xs font-bold ${index === 0 ? "text-[#ffb36d]" : "text-[#526178]"}`}>Fees: {university.fees}</p>
                <span className="relative mt-4 inline-flex items-center gap-2 text-sm font-black text-[#ff4b12]">
                  Open profile
                  <ArrowUpRight size={16} strokeWidth={3} className="transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </span>
              </Link>
            ))}
          </motion.div>
        </AnimatePresence>

        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link
            to={`/universities?country=${active.slug}`}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-[#ff4b12] px-6 py-3.5 text-sm font-black text-white shadow-[0_16px_34px_rgba(255,75,18,0.25)] transition hover:-translate-y-0.5 hover:bg-[#ff642f]"
          >
            All {universityCount(active)} universities in {active.name}
            <ArrowRight size={16} strokeWidth={3} />
          </Link>
          <Link
            to="/universities"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-6 py-3.5 text-sm font-black ring-1 ring-orange-100 transition hover:-translate-y-0.5 hover:text-[#ff4b12]"
          >
            <Search size={16} />
            Search all {total}
          </Link>
        </div>
      </div>
    </section>
  );
}

export default FeaturedUniversities;
