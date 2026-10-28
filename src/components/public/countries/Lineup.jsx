import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, ArrowUpRight, CalendarDays, GraduationCap, Heart } from "lucide-react";

import { countryList, euHub } from "../../../data/countries";
import { COUNTRY_TRAITS } from "../../../data/countries/destinationProfiles";
import { formatUsd } from "../../../data/countries/costs";
import { FlagMark } from "../destinations/DestinationUI";
import { MAX_COST, SNAPSHOTS, firstPart, priceTag, traitsOf } from "./countriesData";
import StepLabel from "./StepLabel";

const FILTERS = [
  { id: "all", label: "Everything" },
  { id: "lowTuition", label: "Low tuition" },
  { id: "scholarships", label: "Big scholarships" },
  { id: "postStudy", label: "Work after study" },
  { id: "eu", label: "EU & Schengen" },
  { id: "medicine", label: "Medicine" },
  { id: "english", label: "English-taught" },
];

const SORTS = [
  { id: "recommended", label: "Our picks" },
  { id: "firstYear", label: "Cheapest year" },
  { id: "tuitionPerYear", label: "Cheapest tuition" },
  { id: "livingPerMonth", label: "Cheapest living" },
];

const BARS = [
  { key: "firstYear", label: "First year" },
  { key: "tuitionPerYear", label: "Tuition/yr" },
  { key: "livingPerMonth", label: "Living/mo" },
];

function StatRow({ label, value, max, best }) {
  const share = value === null ? 0 : Math.max(0.05, value / max);
  return (
    <div className="grid grid-cols-[72px_1fr_auto] items-center gap-3">
      <span className="text-[11px] font-bold text-[#7a879c]">{label}</span>
      <span className="h-1.5 overflow-hidden rounded-full bg-[#eef1f5]">
        <motion.span
          initial={{ width: 0 }}
          whileInView={{ width: `${share * 100}%` }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className={`block h-full rounded-full ${best ? "bg-emerald-500" : "bg-[#071f50]/60"}`}
        />
      </span>
      <span className={`text-right text-sm font-black ${best ? "text-emerald-600" : ""}`}>{formatUsd(value)}</span>
    </div>
  );
}

/** A clean country card: costs as quiet bars, one accent colour. */
function CountryCard({ country, picked, onToggle, cheapestSlugs }) {
  const snapshot = SNAPSHOTS[country.slug];

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.35 }}
      className={`flex h-full flex-col rounded-[24px] bg-white p-5 text-[#071f50] shadow-[0_18px_40px_rgba(0,0,0,0.18)] ring-2 transition-shadow ${
        picked ? "ring-[#ff4b12]" : "ring-transparent"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <Link to={`/countries/${country.slug}`} className="flex min-w-0 items-center gap-3">
          <FlagMark country={country} className="h-9 w-[54px] rounded-[6px]" />
          <span className="min-w-0">
            <span className="block text-xl font-black leading-6 tracking-[-0.03em]">{country.name}</span>
            <span className="block text-[11px] font-bold text-[#7a879c]">
              {country.region}
              {country.inEU && " · EU"} · {priceTag(country)}
            </span>
          </span>
        </Link>
        <motion.button
          type="button"
          whileTap={{ scale: 0.85 }}
          onClick={() => onToggle(country.slug)}
          aria-pressed={picked}
          aria-label={picked ? `Remove ${country.name} from shortlist` : `Shortlist ${country.name}`}
          className={`grid h-10 w-10 shrink-0 place-items-center rounded-full transition ${
            picked ? "bg-[#ff4b12] text-white" : "bg-[#f3f5f8] text-[#7a879c] hover:bg-[#fff1ea] hover:text-[#ff4b12]"
          }`}
        >
          <Heart size={18} strokeWidth={2.4} fill={picked ? "currentColor" : "none"} />
        </motion.button>
      </div>

      <p className="mt-3 line-clamp-2 text-sm font-semibold leading-6 text-[#5f6f89]">{country.tagline}</p>

      <div className="mt-4 space-y-2.5 border-y border-[#eef1f5] py-4">
        {BARS.map((bar) => (
          <StatRow key={bar.key} label={bar.label} value={snapshot[bar.key]} max={MAX_COST[bar.key]} best={cheapestSlugs[bar.key] === country.slug} />
        ))}
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-3 text-xs">
        <div>
          <dt className="flex items-center gap-1 font-bold text-[#7a879c]">
            <CalendarDays size={12} /> Starts
          </dt>
          <dd className="mt-0.5 font-black">{firstPart(country.quickFacts.intakes)}</dd>
        </div>
        <div>
          <dt className="flex items-center gap-1 font-bold text-[#7a879c]">
            <GraduationCap size={12} /> After study
          </dt>
          <dd className="mt-0.5 font-black">{country.quickFacts.postStudy}</dd>
        </div>
      </dl>

      <p className="mt-4 text-[11px] font-bold leading-5 text-[#7a879c]">{traitsOf(country).map((trait) => trait.label).join(" · ")}</p>

      <Link to={`/countries/${country.slug}`} className="mt-auto inline-flex items-center gap-1.5 pt-4 text-sm font-black text-[#ff4b12] transition-all hover:gap-2.5">
        Read the {country.name} guide <ArrowRight size={15} strokeWidth={3} />
      </Link>
    </motion.article>
  );
}

function EuTile() {
  return (
    <Link
      to="/countries/european-union"
      className="group relative mt-8 flex flex-col gap-6 overflow-hidden rounded-[28px] bg-[#003399] p-7 text-white ring-1 ring-white/10 transition hover:-translate-y-1 md:flex-row md:items-center md:justify-between md:p-9"
    >
      {/* A slowly turning ring of twelve stars */}
      <svg viewBox="0 0 200 200" aria-hidden="true" className="zaifan-spin-slow pointer-events-none absolute -right-16 -top-16 h-72 w-72 opacity-20">
        {Array.from({ length: 12 }, (_, index) => {
          const angle = (index / 12) * Math.PI * 2;
          return (
            <text key={index} x={100 + Math.cos(angle) * 78} y={100 + Math.sin(angle) * 78} textAnchor="middle" dominantBaseline="central" fill="#ffcc00" fontSize="26">
              ★
            </text>
          );
        })}
      </svg>
      <div className="relative flex items-center gap-5">
        <FlagMark country={{ slug: "european-union", code: "EU", name: "European Union" }} className="h-12 w-[72px]" />
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#ffcc00]">EU hub</p>
          <h3 className="mt-1 text-2xl font-black leading-none tracking-[-0.04em] md:text-4xl">{euHub.headline}</h3>
          <p className="mt-2 max-w-xl text-sm font-semibold text-white/75">{euHub.tagline} Schengen travel, Erasmus+ and post-study permits compared.</p>
        </div>
      </div>
      <span className="relative inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-[#ffcc00] px-6 py-3 text-sm font-black text-[#003399]">
        Open EU guide
        <ArrowUpRight size={16} strokeWidth={3} className="transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
      </span>
    </Link>
  );
}

function Lineup({ picks, onToggle }) {
  const [filter, setFilter] = useState("all");
  const [sort, setSort] = useState("recommended");

  const visible = useMemo(() => {
    const list = filter === "all" ? countryList : countryList.filter((country) => COUNTRY_TRAITS[country.slug]?.includes(filter));
    if (sort === "recommended") return list;
    return [...list].sort((a, b) => (SNAPSHOTS[a.slug][sort] ?? Infinity) - (SNAPSHOTS[b.slug][sort] ?? Infinity));
  }, [filter, sort]);

  // Green marks the cheapest of the countries on screen, per cost.
  const cheapestSlugs = Object.fromEntries(
    BARS.map((bar) => {
      const priced = visible.filter((country) => SNAPSHOTS[country.slug][bar.key] !== null);
      const best = priced.reduce((winner, country) => (!winner || SNAPSHOTS[country.slug][bar.key] < SNAPSHOTS[winner.slug][bar.key] ? country : winner), null);
      return [bar.key, best?.slug];
    }),
  );

  return (
    <section id="lineup" className="relative scroll-mt-20 bg-[#071f50] px-4 pb-20 pt-8 text-white sm:px-5 md:pb-28 md:pt-12">
      <div className="mx-auto max-w-[1350px]">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <StepLabel step={2} tone="dark" />
            <h2 className="mt-4 text-5xl font-black leading-[0.9] tracking-[-0.06em] md:text-7xl">
              All nine,
              <span className="block text-[#ff7b1c]">side by side.</span>
            </h2>
          </div>
          <p className="max-w-md text-sm font-semibold leading-7 text-white/70 md:text-base">
            <span className="font-black text-white">How to use:</span> filter by what matters to you, tap{" "}
            <Heart size={13} className="inline -translate-y-px text-[#ff7b1c]" fill="currentColor" /> to shortlist, then press{" "}
            <span className="font-black text-white">Compare</span> at the bottom. Shorter bar = cheaper;{" "}
            <span className="font-black text-emerald-300">green</span> = cheapest on screen (rough US$, cheapest public option and city).
          </p>
        </div>

        <div className="mt-10 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-2" role="group" aria-label="Filter countries">
            {FILTERS.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setFilter(item.id)}
                aria-pressed={filter === item.id}
                className={`rounded-full px-4 py-2 text-xs font-black transition ${
                  filter === item.id ? "bg-white text-[#071f50]" : "bg-white/[0.06] text-white/75 ring-1 ring-white/10 hover:bg-white/10 hover:text-white"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
          <div
            className="flex max-w-full shrink-0 self-start overflow-x-auto rounded-full bg-white/[0.06] p-1 ring-1 ring-white/10 lg:self-auto"
            role="group"
            aria-label="Sort countries"
          >
            {SORTS.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setSort(item.id)}
                aria-pressed={sort === item.id}
                className={`relative shrink-0 whitespace-nowrap rounded-full px-3 py-2 text-[11px] font-black transition sm:px-4 ${
                  sort === item.id ? "text-white" : "text-white/65 hover:text-white"
                }`}
              >
                {sort === item.id && <motion.span layoutId="lineup-sort" className="absolute inset-0 rounded-full bg-[#ff4b12]" />}
                <span className="relative">{item.label}</span>
              </button>
            ))}
          </div>
        </div>

        <p className="mt-4 text-xs font-bold text-white/50">
          Showing {visible.length} of {countryList.length} · {picks.length} shortlisted
        </p>

        <motion.div layout className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <AnimatePresence mode="popLayout">
            {visible.map((country) => (
              <CountryCard
                key={country.slug}
                country={country}
                picked={picks.some((pick) => pick.slug === country.slug)}
                onToggle={onToggle}
                cheapestSlugs={cheapestSlugs}
              />
            ))}
          </AnimatePresence>
        </motion.div>

        <EuTile />
      </div>
    </section>
  );
}

export default Lineup;
