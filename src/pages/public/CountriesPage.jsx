import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  ArrowUpRight,
  BriefcaseBusiness,
  CalendarDays,
  Coins,
  Compass,
  GraduationCap,
  Sparkles,
  Wallet,
} from "lucide-react";

import { countryList, euHub } from "../../data/countries";
import {
  ConsultationBand,
  DripDivider,
  FlagMark,
  SectionHeader,
} from "../../components/public/destinations/DestinationUI";
import { fadeUp } from "../../components/public/destinations/destinationUtils";

// Traits power the quick filters. Kept here (not in the country data) because
// they are a judgement call for this page, not a fact about the country.
const COUNTRY_TRAITS = {
  italy: ["eu", "lowTuition", "scholarships", "english", "postStudy"],
  germany: ["eu", "lowTuition", "english", "postStudy"],
  france: ["eu", "english", "postStudy"],
  belgium: ["eu", "english", "postStudy"],
  romania: ["eu", "lowTuition", "medicine", "english"],
  lithuania: ["eu", "english", "postStudy", "medicine"],
  turkey: ["lowTuition", "scholarships", "english", "medicine"],
  china: ["scholarships", "english", "medicine"],
  vietnam: ["lowTuition", "english"],
};

const FILTERS = [
  { id: "all", label: "All destinations" },
  { id: "eu", label: "EU & Schengen" },
  { id: "lowTuition", label: "Lowest tuition" },
  { id: "scholarships", label: "Fully funded scholarships" },
  { id: "medicine", label: "Medicine routes" },
  { id: "postStudy", label: "Post-study work" },
];

const CHOOSING_TIPS = [
  {
    icon: Wallet,
    title: "Start with your real budget",
    text: "Tuition is only half the story. Germany is nearly tuition-free but needs a €11,904 blocked account; Romania and Turkey are cheaper to live in.",
  },
  {
    icon: GraduationCap,
    title: "Match the subject",
    text: "Engineering points to Germany, Italy or China; medicine to Romania, Lithuania, Turkey or China (with PMDC checks); business to France or Belgium.",
  },
  {
    icon: BriefcaseBusiness,
    title: "Think about after graduation",
    text: "Post-study job search permits range from 12 to 18 months in the EU. Outside the EU you usually need an employer to sponsor a work permit.",
  },
];

function DestinationCard({ country }) {
  const isItaly = country.slug === "italy";
  const [first, second, third] = country.flagColors || [];

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 22 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.35 }}
      className="group flex flex-col overflow-hidden rounded-[30px] bg-white shadow-[0_20px_55px_rgba(9,31,80,0.08)] ring-1 ring-orange-100 transition hover:-translate-y-1.5 hover:shadow-[0_30px_75px_rgba(255,75,18,0.14)]"
    >
      <div
        className="relative z-10 h-28"
        style={{
          background: `linear-gradient(120deg, ${first}22 0%, ${second === "#ffffff" ? "#fff7ed" : `${second}22`} 50%, ${third}22 100%)`,
        }}
      >
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -right-6 -top-10 h-36 w-36 rounded-full border-[22px] border-white/50" />
        </div>
        <div className="absolute bottom-[-24px] left-6">
          <FlagMark country={country} className="h-14 w-[84px] ring-4 ring-white" />
        </div>
        <div className="absolute right-4 top-4 flex gap-1.5">
          {isItaly && (
            <span className="rounded-full bg-[#ff4b12] px-3 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-white">
              Flagship
            </span>
          )}
          {country.inEU && (
            <span className="rounded-full bg-[#003399] px-3 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-[#ffcc00]">
              EU
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-1 flex-col p-6 pt-8">
        <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#ff4b12]">{country.region}</p>
        <h3 className="mt-1 text-3xl font-black tracking-[-0.05em] text-[#071f50]">{country.name}</h3>
        <p className="mt-2 text-sm font-semibold leading-6 text-[#61708a]">{country.tagline}</p>

        <div className="mt-5 grid gap-2">
          {[
            [Wallet, "Tuition", country.quickFacts.tuition],
            [Coins, "Living", country.quickFacts.living],
            [CalendarDays, "Intakes", country.quickFacts.intakes],
          ].map(([Icon, label, value]) => (
            <div key={label} className="flex items-center gap-3 rounded-2xl bg-[#fff7ed] px-3 py-2.5 ring-1 ring-orange-100">
              <Icon size={16} className="shrink-0 text-[#ff4b12]" strokeWidth={2.6} />
              <span className="w-16 shrink-0 text-[10px] font-black uppercase tracking-[0.12em] text-[#7a879c]">{label}</span>
              <span className="text-xs font-black text-[#071f50]">{value}</span>
            </div>
          ))}
        </div>

        <div className="mt-auto flex gap-2 pt-6">
          <Link
            to={`/countries/${country.slug}`}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-[#ff4b12] px-5 py-3.5 text-sm font-black text-white shadow-[0_14px_30px_rgba(255,75,18,0.25)] transition hover:bg-[#ff642f]"
          >
            Open {country.name} guide
            <ArrowRight size={16} strokeWidth={3} className="transition group-hover:translate-x-0.5" />
          </Link>
          {isItaly && (
            <Link
              to="/universities"
              className="inline-flex items-center justify-center rounded-full bg-[#071f50] px-4 py-3.5 text-xs font-black text-white transition hover:bg-[#0b2a6b]"
            >
              Uni finder
            </Link>
          )}
        </div>
      </div>
    </motion.article>
  );
}

function CountriesPage() {
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    document.title = "Study Destinations | Zaifan Consultancy";
  }, []);

  const visibleCountries = useMemo(() => {
    if (filter === "all") return countryList;
    return countryList.filter((country) => COUNTRY_TRAITS[country.slug]?.includes(filter));
  }, [filter]);

  return (
    <main className="overflow-hidden bg-[#fff7ed] text-[#071f50]">
      {/* Hero */}
      <section className="relative isolate overflow-hidden px-4 pb-10 pt-28 sm:px-5 md:pb-14 md:pt-36">
        <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_15%_12%,rgba(255,75,18,0.13),transparent_30%),radial-gradient(circle_at_88%_18%,rgba(255,190,92,0.18),transparent_28%)]" />

        <motion.div initial="hidden" animate="show" variants={fadeUp} className="mx-auto max-w-[1350px] text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-xs font-black uppercase tracking-[0.2em] text-[#ff4b12] shadow-sm ring-1 ring-orange-100">
            <Sparkles size={16} fill="currentColor" />
            {countryList.length} destinations · 1 EU guide
          </span>
          <h1 className="mx-auto mt-6 max-w-5xl text-[2.7rem] font-black leading-[0.94] tracking-[-0.06em] sm:text-6xl md:text-7xl xl:text-[88px]">
            Find the country that fits <span className="text-[#ff4b12]">your future.</span>
          </h1>
          <p className="mx-auto mt-5 max-w-3xl text-[15px] font-semibold leading-7 text-[#526178] sm:text-lg sm:leading-9">
            Compare tuition, living costs, scholarships, work rights and visas across Europe and Asia, then open a full guide with cities and universities.
          </p>

          <div className="mx-auto mt-8 flex max-w-4xl flex-wrap justify-center gap-2">
            {countryList.map((country) => (
              <Link
                key={country.slug}
                to={`/countries/${country.slug}`}
                className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-2 text-xs font-black shadow-sm ring-1 ring-orange-100 transition hover:-translate-y-0.5 hover:text-[#ff4b12]"
              >
                <FlagMark country={country} className="h-4 w-6" />
                {country.name}
              </Link>
            ))}
          </div>
        </motion.div>
      </section>

      {/* Destinations grid */}
      <section className="px-4 pb-14 sm:px-5 md:pb-20">
        <div className="mx-auto max-w-[1400px]">
          <div className="flex flex-wrap justify-center gap-2">
            {FILTERS.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setFilter(item.id)}
                className={`rounded-full px-4 py-2.5 text-xs font-black ring-1 transition ${
                  filter === item.id
                    ? "bg-[#071f50] text-white ring-[#071f50] shadow-[0_12px_30px_rgba(7,31,80,0.2)]"
                    : "bg-white text-[#071f50] ring-orange-100 hover:text-[#ff4b12]"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          <motion.div layout className="mt-10 grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            <AnimatePresence mode="popLayout">
              {visibleCountries.map((country) => (
                <DestinationCard key={country.slug} country={country} />
              ))}
            </AnimatePresence>
          </motion.div>

          {/* EU hub banner */}
          <Link
            to="/countries/european-union"
            className="group relative mt-8 flex flex-col gap-5 overflow-hidden rounded-[30px] bg-[#003399] p-7 text-white shadow-[0_26px_70px_rgba(0,51,153,0.25)] transition hover:-translate-y-1 md:flex-row md:items-center md:justify-between md:p-9"
          >
            <div className="pointer-events-none absolute -right-14 -top-14 h-56 w-56 rounded-full border-[34px] border-[#ffcc00]/12" />
            <div className="relative flex items-center gap-5">
              <FlagMark country={{ slug: "european-union", code: "EU", name: "European Union" }} className="h-14 w-[84px]" />
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#ffcc00]">EU hub</p>
                <h2 className="text-2xl font-black tracking-[-0.04em] md:text-4xl">{euHub.headline}</h2>
                <p className="mt-1 text-sm font-semibold text-white/75">{euHub.tagline} Schengen travel, Erasmus+ and post-study permits compared.</p>
              </div>
            </div>
            <span className="relative inline-flex shrink-0 items-center gap-2 rounded-full bg-[#ffcc00] px-6 py-3.5 text-sm font-black text-[#003399]">
              Open EU guide
              <ArrowUpRight size={16} strokeWidth={3} className="transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </span>
          </Link>
        </div>
      </section>

      {/* Comparison table */}
      <DripDivider color="#fff7ed" background="#071f50" />
      <section className="bg-[#071f50] px-4 py-12 text-white sm:px-5 md:py-20">
        <div className="mx-auto max-w-[1400px]">
          <SectionHeader
            tone="dark"
            eyebrow="Side by side"
            title="Every destination, one table."
            text="Approximate figures to help you shortlist. Every guide explains the details, and we confirm current numbers during your consultation."
          />
          <div className="mt-12 overflow-x-auto rounded-[28px] ring-1 ring-white/10">
            <table className="w-full min-w-[1050px] text-left text-sm">
              <thead className="bg-white/[0.07] text-[10px] font-black uppercase tracking-[0.14em] text-[#ffb36d]">
                <tr>
                  {["Country", "Tuition", "Living", "Language", "Work while studying", "After graduation", ""].map((heading) => (
                    <th key={heading} className="px-5 py-4">{heading}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {countryList.map((country) => (
                  <tr key={country.slug} className="transition hover:bg-white/[0.04]">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <FlagMark country={country} className="h-6 w-9" />
                        <span className="font-black">{country.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 font-semibold text-white/85">{country.quickFacts.tuition}</td>
                    <td className="px-5 py-4 font-semibold text-white/85">{country.quickFacts.living}</td>
                    <td className="px-5 py-4 font-semibold text-white/85">{country.quickFacts.language}</td>
                    <td className="px-5 py-4 font-semibold text-white/85">{country.quickFacts.work}</td>
                    <td className="px-5 py-4 font-semibold text-white/85">{country.quickFacts.postStudy}</td>
                    <td className="px-5 py-4 text-right">
                      <Link
                        to={`/countries/${country.slug}`}
                        className="inline-flex items-center gap-1.5 rounded-full bg-[#ff4b12] px-4 py-2 text-xs font-black text-white transition hover:bg-[#ff642f]"
                      >
                        Guide
                        <ArrowUpRight size={14} strokeWidth={3} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
      <DripDivider color="#071f50" background="#fff7ed" />

      {/* How to choose */}
      <section className="px-4 py-10 sm:px-5 md:py-16">
        <div className="mx-auto max-w-[1350px]">
          <SectionHeader eyebrow="How to choose" title="Three questions decide most of it." />
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.2 }}
            transition={{ staggerChildren: 0.08 }}
            className="mt-10 grid gap-5 md:grid-cols-3"
          >
            {CHOOSING_TIPS.map((tip, index) => (
              <motion.div
                key={tip.title}
                variants={fadeUp}
                className={`rounded-[30px] p-6 shadow-[0_20px_55px_rgba(9,31,80,0.07)] ring-1 ${
                  index === 1 ? "bg-[#ff4b12] text-white ring-[#ff4b12]" : "bg-white ring-orange-100"
                }`}
              >
                <div className={`mb-5 grid h-14 w-14 place-items-center rounded-2xl ${index === 1 ? "bg-white/15 text-white" : "bg-[#fff1ea] text-[#ff4b12]"}`}>
                  <tip.icon size={26} strokeWidth={2.6} />
                </div>
                <h3 className="text-xl font-black tracking-[-0.035em]">{tip.title}</h3>
                <p className={`mt-3 text-sm font-semibold leading-7 ${index === 1 ? "text-white/85" : "text-[#61708a]"}`}>{tip.text}</p>
              </motion.div>
            ))}
          </motion.div>
          <div className="mt-8 flex justify-center">
            <Link
              to="/appointment?service=Country%20Comparison"
              className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3.5 text-sm font-black shadow-sm ring-1 ring-orange-100 transition hover:-translate-y-0.5 hover:text-[#ff4b12]"
            >
              <Compass size={17} />
              Still unsure? Let us compare for you
            </Link>
          </div>
        </div>
      </section>

      <ConsultationBand
        title="Not sure where to start?"
        text="Share your grades, budget and dream subject. We'll recommend two or three destinations that actually fit, with honest pros and cons."
        to="/appointment?service=Free%20Consultation"
      />
    </main>
  );
}

export default CountriesPage;
