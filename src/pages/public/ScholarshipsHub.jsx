import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, ArrowUpRight, Award, Sparkles } from "lucide-react";

import { countryList, euHub, getCountryBySlug } from "../../data/countries";
import { FlagMark } from "../../components/public/destinations/DestinationUI";
import ScholarshipExplorer from "../../components/public/scholarships/ScholarshipExplorer";

// Italy's DSU system lives in the dedicated explorer; this card represents it
// in the all-countries view.
const ITALY_DSU = {
  name: "DSU Regional Scholarships",
  provider: "Italian regional bodies (DSU Lombardia, LazioDisco, ER.GO and others)",
  covers: "Tuition waiver, yearly grant, sometimes housing and meals",
  level: "Bachelor's · Master's",
  note: "Income- and merit-based, with rules that differ by region. Open the Italy tab for the full DSU explorer.",
};

const ALL_SCHOLARSHIPS = countryList.flatMap((country) => {
  const list = country.slug === "italy" ? [ITALY_DSU] : country.scholarships || [];
  return list.map((scholarship) => ({ ...scholarship, countrySlug: country.slug }));
});

const LEVELS = [
  { id: "all", label: "All levels" },
  { id: "Bachelor", label: "Bachelor's" },
  { id: "Master", label: "Master's" },
  { id: "PhD", label: "PhD" },
];

function ScholarshipCard({ scholarship }) {
  const country = getCountryBySlug(scholarship.countrySlug);
  const planPath = `/appointment?country=${encodeURIComponent(country?.name || "")}&service=${encodeURIComponent(
    "Scholarship Guidance"
  )}&message=${encodeURIComponent(`I want help applying for: ${scholarship.name}.`)}`;

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ duration: 0.25 }}
      className="flex flex-col rounded-[28px] bg-white p-6 shadow-[0_16px_45px_rgba(9,31,80,0.07)] ring-1 ring-orange-100 transition hover:-translate-y-1 hover:shadow-[0_24px_60px_rgba(255,75,18,0.12)]"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <FlagMark country={country} className="h-5 w-[30px] rounded-[4px]" />
          <span className="text-[10px] font-black uppercase tracking-[0.14em] text-[#7a879c]">{country?.name}</span>
        </div>
        <span className="rounded-full bg-[#ff4b12] px-3 py-1 text-[9px] font-black uppercase tracking-[0.12em] text-white">
          {scholarship.level}
        </span>
      </div>
      <h3 className="mt-4 text-xl font-black leading-6 tracking-[-0.035em] text-[#071f50]">{scholarship.name}</h3>
      <p className="mt-1 text-xs font-bold text-[#7a879c]">{scholarship.provider}</p>
      <p className="mt-3 rounded-2xl bg-[#fff7ed] px-3 py-2 text-sm font-black leading-6 text-[#071f50] ring-1 ring-orange-100">
        {scholarship.covers}
      </p>
      <p className="mt-3 text-sm font-semibold leading-6 text-[#61708a]">{scholarship.note}</p>

      <div className="mt-auto flex items-center gap-2 pt-5">
        <Link
          to={planPath}
          className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-[#071f50] px-4 py-3 text-xs font-black text-white transition hover:bg-[#ff4b12]"
        >
          Plan this scholarship
          <ArrowRight size={14} strokeWidth={3} />
        </Link>
        {scholarship.link && (
          <a
            href={scholarship.link}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 rounded-full bg-[#fff1ea] px-4 py-3 text-xs font-black text-[#ff4b12] ring-1 ring-orange-100 transition hover:bg-[#ff4b12] hover:text-white"
          >
            Official
            <ArrowUpRight size={13} strokeWidth={3} />
          </a>
        )}
      </div>
    </motion.article>
  );
}

function ScholarshipsHub() {
  const [searchParams, setSearchParams] = useSearchParams();
  const countryParam = searchParams.get("country");
  const activeCountry = getCountryBySlug(countryParam) ? countryParam : "all";
  const [level, setLevel] = useState("all");

  useEffect(() => {
    document.title = "Scholarships | Zaifan Consultancy";
  }, []);

  const results = useMemo(
    () =>
      ALL_SCHOLARSHIPS.filter(
        (scholarship) =>
          (activeCountry === "all" || scholarship.countrySlug === activeCountry) &&
          (level === "all" || scholarship.level.includes(level))
      ),
    [activeCountry, level]
  );

  const selectCountry = (slug) => {
    setSearchParams(slug === "all" ? {} : { country: slug }, { replace: true });
  };

  const tabs = (
    <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <button
        type="button"
        onClick={() => selectCountry("all")}
        className={`shrink-0 rounded-full px-4 py-2.5 text-xs font-black ring-1 transition ${
          activeCountry === "all" ? "bg-[#071f50] text-white ring-[#071f50]" : "bg-white ring-orange-100 hover:text-[#ff4b12]"
        }`}
      >
        All countries
      </button>
      {countryList.map((country) => (
        <button
          key={country.slug}
          type="button"
          onClick={() => selectCountry(country.slug)}
          className={`inline-flex shrink-0 items-center gap-2 rounded-full px-3.5 py-2 text-xs font-black ring-1 transition ${
            activeCountry === country.slug
              ? "bg-[#ff4b12] text-white ring-[#ff4b12] shadow-[0_12px_30px_rgba(255,75,18,0.25)]"
              : "bg-white ring-orange-100 hover:text-[#ff4b12]"
          }`}
        >
          <FlagMark country={country} className="h-4 w-6 rounded-[3px]" />
          {country.name}
          {country.slug === "italy" && <span className="opacity-75">DSU</span>}
        </button>
      ))}
    </div>
  );

  const header = (
    <section className="px-4 pt-28 sm:px-5 md:pt-32">
      <div className="mx-auto max-w-[1400px]">
        {activeCountry === "all" && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8 text-center">
            <span className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-[#ff4b12] shadow-sm ring-1 ring-orange-100">
              <Award size={15} />
              {ALL_SCHOLARSHIPS.length} funding routes · {countryList.length} countries
            </span>
            <h1 className="mx-auto mt-5 max-w-4xl text-[2.6rem] font-black leading-[0.94] tracking-[-0.06em] text-[#071f50] sm:text-6xl md:text-7xl">
              Find the money that gets you <span className="text-[#ff4b12]">there.</span>
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-[15px] font-semibold leading-7 text-[#526178] sm:text-lg">
              Government, university and EU scholarships, with honest notes on who can apply. No fake guarantees.
            </p>
          </motion.div>
        )}
        {tabs}
      </div>
    </section>
  );

  if (activeCountry === "italy") {
    return (
      <div className="bg-[#fff7ed]">
        {header}
        <ScholarshipExplorer />
      </div>
    );
  }

  const country = getCountryBySlug(activeCountry);

  return (
    <main className="min-h-screen bg-[#fff7ed] pb-20 text-[#071f50]">
      {header}

      <section className="px-4 pt-6 sm:px-5">
        <div className="mx-auto max-w-[1400px]">
          {country ? (
            <div className="mb-6 flex flex-col gap-4 rounded-[28px] bg-white p-5 ring-1 ring-orange-100 sm:flex-row sm:items-center sm:justify-between md:p-6">
              <div className="flex items-center gap-4">
                <FlagMark country={country} className="h-12 w-[72px]" />
                <h1 className="text-3xl font-black tracking-[-0.05em] md:text-4xl">Scholarships for {country.name}</h1>
              </div>
              <Link
                to={`/countries/${country.slug}#scholarships`}
                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-[#ff4b12] px-5 py-3 text-xs font-black text-white transition hover:bg-[#ff642f]"
              >
                Full {country.name} guide
                <ArrowRight size={14} strokeWidth={3} />
              </Link>
            </div>
          ) : (
            <a
              href={euHub.erasmusMundus.link}
              target="_blank"
              rel="noreferrer"
              className="group relative mb-6 flex flex-col gap-4 overflow-hidden rounded-[28px] bg-[#003399] p-6 text-white shadow-[0_24px_65px_rgba(0,51,153,0.22)] transition hover:-translate-y-0.5 md:flex-row md:items-center md:justify-between md:p-8"
            >
              <div className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full border-[30px] border-[#ffcc00]/15" />
              <div className="relative flex items-start gap-4">
                <FlagMark country={{ slug: "european-union", code: "EU", name: "European Union" }} className="h-12 w-[72px]" />
                <div>
                  <p className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-[#ffcc00]">
                    <Sparkles size={12} /> Fully funded · multi-country
                  </p>
                  <h2 className="mt-1 text-2xl font-black tracking-[-0.04em] md:text-3xl">{euHub.erasmusMundus.title}</h2>
                  <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-white/80">{euHub.erasmusMundus.text}</p>
                </div>
              </div>
              <span className="relative inline-flex shrink-0 items-center gap-2 rounded-full bg-[#ffcc00] px-5 py-3 text-xs font-black text-[#003399]">
                Official catalogue
                <ArrowUpRight size={14} strokeWidth={3} />
              </span>
            </a>
          )}

          <div className="flex flex-wrap gap-2">
            {LEVELS.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setLevel(item.id)}
                className={`rounded-full px-4 py-2 text-xs font-black ring-1 transition ${
                  level === item.id ? "bg-[#071f50] text-white ring-[#071f50]" : "bg-white ring-orange-100 hover:text-[#ff4b12]"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          <motion.div layout className="mt-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            <AnimatePresence mode="popLayout">
              {results.map((scholarship) => (
                <ScholarshipCard key={`${scholarship.countrySlug}-${scholarship.name}`} scholarship={scholarship} />
              ))}
            </AnimatePresence>
          </motion.div>

          {results.length === 0 && (
            <p className="mt-6 rounded-[24px] bg-white p-6 text-center text-sm font-bold text-[#61708a] ring-1 ring-orange-100">
              No scholarships listed for that level here yet. Ask us, as many universities have their own awards.
            </p>
          )}
        </div>
      </section>
    </main>
  );
}

export default ScholarshipsHub;
