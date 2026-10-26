import { useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  Award,
  BriefcaseBusiness,
  CalendarDays,
  Coins,
  GraduationCap,
  School,
  Wallet,
} from "lucide-react";

import { countryList } from "../../../data/countries";
import { FlagMark, SectionHeader } from "../destinations/DestinationUI";

// Italy keeps its larger hand-built dataset outside the registry, so the
// spotlight lists its flagship universities explicitly.
const ITALY_SPOTLIGHT_UNIVERSITIES = [
  "Politecnico di Milano",
  "Sapienza University of Rome",
  "University of Bologna",
];

function getSpotlight(country) {
  if (country.slug === "italy") {
    return {
      universities: ITALY_SPOTLIGHT_UNIVERSITIES,
      scholarship: "DSU regional scholarships",
    };
  }

  return {
    universities: (country.universities || []).slice(0, 3).map((university) => university.name),
    scholarship: country.scholarships?.[0]?.name,
  };
}

function DestinationsShowcase() {
  const [activeSlug, setActiveSlug] = useState(countryList[0].slug);
  const active = countryList.find((country) => country.slug === activeSlug) || countryList[0];
  const spotlight = getSpotlight(active);

  return (
    <section id="countries" className="relative scroll-mt-24 overflow-hidden bg-[#fff7ed] text-[#071f50]">
      <div className="pointer-events-none absolute -left-40 top-20 h-96 w-96 rounded-full bg-orange-300/20 blur-3xl" />
      <div className="pointer-events-none absolute -right-40 bottom-10 h-96 w-96 rounded-full bg-[#ff4b12]/10 blur-3xl" />

      <div className="relative mx-auto max-w-[1400px] px-4 py-16 sm:px-5 md:py-24">
        <SectionHeader
          eyebrow="Study destinations"
          title="Nine countries. One clear plan."
          text="Pick a destination to see what it costs, how long you can stay after graduating and where students actually go."
        />

        <div className="mt-12 grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
          {/* Country picker */}
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-1 lg:gap-2.5">
            {countryList.map((country) => {
              const selected = country.slug === active.slug;
              return (
                <button
                  key={country.slug}
                  type="button"
                  onClick={() => setActiveSlug(country.slug)}
                  onMouseEnter={() => setActiveSlug(country.slug)}
                  aria-pressed={selected}
                  className={`group relative flex items-center gap-3 overflow-hidden rounded-[20px] px-4 py-3 text-left ring-1 transition duration-300 ${
                    selected
                      ? "bg-[#071f50] text-white ring-[#071f50] shadow-[0_18px_40px_rgba(7,31,80,0.25)]"
                      : "bg-white text-[#071f50] ring-orange-100 hover:-translate-y-0.5 hover:ring-orange-200"
                  }`}
                >
                  {selected && (
                    <motion.span
                      layoutId="destination-active-bar"
                      className="absolute inset-y-2 left-0 w-1.5 rounded-r-full bg-[#ff4b12]"
                    />
                  )}
                  <FlagMark country={country} className="h-6 w-9" />
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-black">{country.name}</span>
                    <span className={`hidden truncate text-[11px] font-bold sm:block ${selected ? "text-white/60" : "text-[#7a879c]"}`}>
                      {country.quickFacts.tuition}
                    </span>
                  </span>
                  {country.inEU && (
                    <span className={`hidden rounded-full px-2 py-0.5 text-[9px] font-black lg:inline ${selected ? "bg-[#ffcc00] text-[#003399]" : "bg-[#003399]/10 text-[#003399]"}`}>
                      EU
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Spotlight */}
          <AnimatePresence mode="wait">
            <motion.article
              key={active.slug}
              initial={{ opacity: 0, y: 18, scale: 0.985 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -12, scale: 0.985 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="relative flex flex-col overflow-hidden rounded-[34px] bg-white p-6 shadow-[0_30px_80px_rgba(9,31,80,0.10)] ring-1 ring-orange-100 md:p-9"
            >
              <div className="pointer-events-none absolute -right-16 -top-16 h-60 w-60 rounded-full border-[36px] border-[#ff4b12]/[0.06]" />

              <div className="relative flex flex-wrap items-center gap-4">
                <FlagMark country={active} className="h-14 w-[84px]" />
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#ff4b12]">{active.region}</p>
                  <h3 className="text-4xl font-black tracking-[-0.055em] md:text-5xl">Study in {active.name}</h3>
                </div>
              </div>
              <p className="relative mt-4 max-w-2xl text-sm font-semibold leading-7 text-[#526178] md:text-base">{active.tagline}</p>

              <div className="relative mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
                {[
                  [Wallet, "Tuition", active.quickFacts.tuition],
                  [Coins, "Living", active.quickFacts.living],
                  [CalendarDays, "Intakes", active.quickFacts.intakes],
                  [BriefcaseBusiness, "After study", active.quickFacts.postStudy],
                ].map(([Icon, label, value]) => (
                  <div key={label} className="rounded-[20px] bg-[#fff7ed] p-3.5 ring-1 ring-orange-100">
                    <Icon size={17} className="text-[#ff4b12]" strokeWidth={2.6} />
                    <p className="mt-2 text-[10px] font-black uppercase tracking-[0.14em] text-[#7a879c]">{label}</p>
                    <p className="mt-0.5 text-sm font-black leading-5">{value}</p>
                  </div>
                ))}
              </div>

              <div className="relative mt-5 grid gap-3 md:grid-cols-2">
                <div className="rounded-[22px] bg-[#071f50] p-5 text-white">
                  <p className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.16em] text-[#ffb36d]">
                    <School size={14} /> Popular universities
                  </p>
                  <ul className="mt-3 space-y-2">
                    {spotlight.universities.map((name) => (
                      <li key={name} className="flex items-start gap-2 text-sm font-bold text-white/90">
                        <GraduationCap size={15} className="mt-0.5 shrink-0 text-[#ff7b1c]" />
                        {name}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="rounded-[22px] bg-gradient-to-br from-[#ff7b1c] to-[#ff4b12] p-5 text-white">
                  <p className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.16em] text-white/80">
                    <Award size={14} /> Headline scholarship
                  </p>
                  <p className="mt-3 text-xl font-black leading-6 tracking-[-0.03em]">{spotlight.scholarship}</p>
                  <p className="mt-2 text-xs font-semibold leading-5 text-white/80">{active.quickFacts.work} while studying.</p>
                </div>
              </div>

              <div className="relative mt-6 flex flex-col gap-3 sm:flex-row">
                <Link
                  to={`/countries/${active.slug}`}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-[#ff4b12] px-6 py-4 text-sm font-black text-white shadow-[0_18px_38px_rgba(255,75,18,0.28)] transition hover:-translate-y-0.5 hover:bg-[#ff642f]"
                >
                  Open the {active.name} guide
                  <ArrowRight size={18} strokeWidth={3} />
                </Link>
                <Link
                  to={`/appointment?country=${encodeURIComponent(active.name)}&service=${encodeURIComponent("Free Consultation")}`}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-6 py-4 text-sm font-black text-[#071f50] ring-1 ring-orange-200 transition hover:-translate-y-0.5 hover:text-[#ff4b12]"
                >
                  Book free {active.name} consultation
                </Link>
              </div>
            </motion.article>
          </AnimatePresence>
        </div>

        <div className="mt-8 flex justify-center">
          <Link
            to="/countries"
            className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3.5 text-sm font-black shadow-sm ring-1 ring-orange-100 transition hover:-translate-y-0.5 hover:text-[#ff4b12]"
          >
            Compare all destinations side by side
            <ArrowRight size={16} strokeWidth={3} />
          </Link>
        </div>
      </div>

    </section>
  );
}

export default DestinationsShowcase;
