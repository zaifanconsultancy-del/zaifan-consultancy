import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowDownWideNarrow,
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  Calculator,
  Check,
  Coins,
  GitCompareArrows,
  GraduationCap,
  Plus,
  Sparkles,
  Trophy,
  Wallet,
  X,
} from "lucide-react";

import { countryList, euHub } from "../../data/countries";
import { COUNTRY_TRAITS, TRAIT_LABELS } from "../../data/countries/destinationProfiles";
import { costSnapshot, formatUsd } from "../../data/countries/costs";
import {
  ConsultationBand,
  DripDivider,
  FlagMark,
  ZAIFAN_NAVY,
} from "../../components/public/destinations/DestinationUI";
import BudgetMatcher from "../../components/public/destinations/BudgetMatcher";
import MatchQuiz from "../../components/public/home/MatchQuiz";

const FILTERS = [
  { id: "all", label: "All countries" },
  { id: "lowTuition", label: "Low tuition" },
  { id: "scholarships", label: "Big scholarships" },
  { id: "postStudy", label: "Work after study" },
  { id: "eu", label: "EU & Schengen" },
  { id: "medicine", label: "Medicine" },
  { id: "english", label: "English-taught" },
];

const SORTS = [
  { id: "recommended", label: "Recommended" },
  { id: "firstYear", label: "Lowest first-year cost" },
  { id: "tuition", label: "Lowest tuition" },
  { id: "living", label: "Lowest living cost" },
];

const SORT_KEYS = { firstYear: "firstYear", tuition: "tuitionPerYear", living: "livingPerMonth" };
const MAX_COMPARE = 3;
const SNAPSHOTS = Object.fromEntries(countryList.map((country) => [country.slug, costSnapshot(country)]));

function firstPart(text) {
  return String(text).split("·")[0].trim();
}

function cheapest(key) {
  return countryList
    .filter((country) => SNAPSHOTS[country.slug][key] !== null)
    .reduce((best, country) => (SNAPSHOTS[country.slug][key] < SNAPSHOTS[best.slug][key] ? country : best));
}

// Data-driven highlights for the hero.
const INSIGHTS = [
  { icon: Trophy, label: "Cheapest first year", country: cheapest("firstYear"), value: (slug) => SNAPSHOTS[slug].firstYear },
  { icon: Wallet, label: "Lowest tuition", country: cheapest("tuitionPerYear"), value: (slug) => SNAPSHOTS[slug].tuitionPerYear, suffix: "/year" },
  { icon: Coins, label: "Cheapest living", country: cheapest("livingPerMonth"), value: (slug) => SNAPSHOTS[slug].livingPerMonth, suffix: "/month" },
];

function CountryCard({ country, selected, onToggle, compareFull, index }) {
  const snapshot = SNAPSHOTS[country.slug];
  const [first, middle, last] = country.flagColors;
  const traits = (COUNTRY_TRAITS[country.slug] || []).slice(0, 3);
  const disabled = !selected && compareFull;

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 22 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.35, delay: index * 0.03 }}
      className={`relative flex flex-col overflow-hidden rounded-[28px] bg-white shadow-[0_20px_55px_rgba(9,31,80,0.08)] ring-2 transition ${
        selected ? "ring-[#ff4b12]" : "ring-transparent hover:-translate-y-1 hover:shadow-[0_30px_70px_rgba(255,75,18,0.14)]"
      }`}
    >
      <span className="flex h-1.5">
        {[first, middle, last].map((color, stripe) => (
          <span key={stripe} className="flex-1" style={{ background: color === "#ffffff" ? "#e9edf3" : color }} />
        ))}
      </span>

      <div className="flex flex-1 flex-col p-6">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <FlagMark country={country} className="h-10 w-[60px]" />
            <div>
              <h3 className="text-2xl font-black leading-6 tracking-[-0.04em]">{country.name}</h3>
              <p className="mt-1 text-[11px] font-bold uppercase tracking-[0.1em] text-[#7a879c]">{country.region}</p>
            </div>
          </div>
          {country.inEU && <span className="rounded-full bg-[#003399] px-2.5 py-1 text-[10px] font-black text-[#ffcc00]">EU</span>}
        </div>

        <p className="mt-3 text-sm font-semibold leading-6 text-[#61708a]">{country.tagline}</p>

        <div className="mt-5 rounded-[22px] bg-[#071f50] p-4 text-white">
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-white/55">First year from</p>
          <p className="mt-0.5 text-3xl font-black tracking-[-0.04em] text-[#ff7b1c]">{formatUsd(snapshot.firstYear)}</p>
          <div className="mt-3 grid grid-cols-2 gap-2 border-t border-white/10 pt-3 text-xs">
            <div>
              <p className="font-black uppercase tracking-[0.12em] text-white/45">Tuition</p>
              <p className="mt-0.5 font-black">
                {formatUsd(snapshot.tuitionPerYear)}
                <span className="font-bold text-white/50"> /yr</span>
              </p>
            </div>
            <div>
              <p className="font-black uppercase tracking-[0.12em] text-white/45">Living</p>
              <p className="mt-0.5 font-black">
                {formatUsd(snapshot.livingPerMonth)}
                <span className="font-bold text-white/50"> /mo</span>
              </p>
            </div>
          </div>
        </div>

        <dl className="mt-4 grid grid-cols-2 gap-3 text-xs">
          <div>
            <dt className="flex items-center gap-1 font-black uppercase tracking-[0.12em] text-[#7a879c]">
              <CalendarDays size={12} className="text-[#ff4b12]" /> Starts
            </dt>
            <dd className="mt-0.5 font-black">{firstPart(country.quickFacts.intakes)}</dd>
          </div>
          <div>
            <dt className="flex items-center gap-1 font-black uppercase tracking-[0.12em] text-[#7a879c]">
              <GraduationCap size={12} className="text-[#ff4b12]" /> After study
            </dt>
            <dd className="mt-0.5 font-black">{country.quickFacts.postStudy}</dd>
          </div>
        </dl>

        <div className="mt-4 flex flex-wrap gap-1.5">
          {traits.map((trait) => (
            <span key={trait} className="rounded-full bg-[#fff1ea] px-2.5 py-1 text-[10px] font-black text-[#ff4b12]">
              {TRAIT_LABELS[trait]}
            </span>
          ))}
        </div>

        <div className="mt-auto flex gap-2 pt-6">
          <Link
            to={`/countries/${country.slug}`}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-[#ff4b12] px-4 py-3 text-sm font-black text-white shadow-[0_14px_30px_rgba(255,75,18,0.25)] transition hover:bg-[#ff642f]"
          >
            Open guide <ArrowRight size={16} strokeWidth={3} />
          </Link>
          <button
            type="button"
            onClick={() => onToggle(country.slug)}
            disabled={disabled}
            aria-pressed={selected}
            title={disabled ? `You can compare up to ${MAX_COMPARE} countries` : undefined}
            className={`inline-flex items-center justify-center gap-1.5 rounded-full px-4 py-3 text-sm font-black ring-2 transition disabled:cursor-not-allowed disabled:opacity-40 ${
              selected ? "bg-[#071f50] text-white ring-[#071f50]" : "bg-white text-[#071f50] ring-orange-100 hover:ring-[#ff4b12]"
            }`}
          >
            {selected ? <Check size={16} strokeWidth={3} /> : <Plus size={16} strokeWidth={3} />}
            {selected ? "Added" : "Compare"}
          </button>
        </div>
      </div>
    </motion.article>
  );
}

function CompareSheet({ countries, onRemove, onClose }) {
  useEffect(() => {
    const onKey = (event) => event.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const numberRows = [
    { label: "First year from", key: "firstYear" },
    { label: "Tuition from", key: "tuitionPerYear", suffix: "/year" },
    { label: "Living from", key: "livingPerMonth", suffix: "/month" },
  ];
  const textRows = [
    { label: "Tuition (local)", get: (country) => country.quickFacts.tuition },
    { label: "Living (local)", get: (country) => country.quickFacts.living },
    { label: "Intakes", get: (country) => country.quickFacts.intakes },
    { label: "Language", get: (country) => country.quickFacts.language },
    { label: "Work while studying", get: (country) => country.quickFacts.work },
    { label: "After graduation", get: (country) => country.quickFacts.postStudy },
    { label: "Visa", get: (country) => country.quickFacts.visa },
    {
      label: "Good for",
      get: (country) => (COUNTRY_TRAITS[country.slug] || []).map((trait) => TRAIT_LABELS[trait]).join(" · "),
    },
  ];
  const columns = `minmax(96px,0.75fr) repeat(${countries.length}, minmax(156px,1fr))`;
  // Row labels stay pinned on the left while the columns scroll sideways on phones.
  const labelClass = "sticky left-0 z-[1] bg-white pr-2 text-[10px] font-black uppercase tracking-[0.12em] text-[#7a879c] sm:text-xs";
  const best = (key) => Math.min(...countries.map((country) => SNAPSHOTS[country.slug][key] ?? Infinity));
  const advisorPath = `/appointment?country=${encodeURIComponent(countries[0]?.name || "")}&service=${encodeURIComponent("Country Comparison")}`;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[10003] flex items-end justify-center bg-[#071f50]/60 backdrop-blur-sm sm:items-center sm:p-6"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Compare countries"
    >
      <motion.div
        initial={{ y: 60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 60, opacity: 0 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        onClick={(event) => event.stopPropagation()}
        className="flex max-h-[88vh] w-full max-w-5xl flex-col overflow-hidden rounded-t-[32px] bg-white text-[#071f50] shadow-[0_40px_100px_rgba(0,0,0,0.35)] sm:rounded-[32px]"
      >
        <div className="flex items-center justify-between border-b border-orange-100 px-6 py-4">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[#ff4b12]">Side by side</p>
            <h2 className="text-2xl font-black tracking-[-0.04em]">Compare countries</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close comparison"
            className="grid h-11 w-11 place-items-center rounded-full bg-[#fff1ea] text-[#ff4b12] transition hover:bg-[#ff4b12] hover:text-white"
          >
            <X size={20} strokeWidth={2.6} />
          </button>
        </div>

        <div className="overflow-auto px-4 pb-4 sm:px-6">
          <div className="min-w-fit">
            {/* Column headers */}
            <div className="sticky top-0 z-10 grid gap-3 bg-white py-4" style={{ gridTemplateColumns: columns }}>
              <span className="sticky left-0 z-[1] bg-white" />
              {countries.map((country) => (
                <div key={country.slug} className="flex items-center justify-between gap-2 rounded-2xl bg-[#fff7ed] p-3 ring-1 ring-orange-100">
                  <div className="flex items-center gap-2">
                    <FlagMark country={country} className="h-6 w-9" />
                    <span className="font-black">{country.name}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => onRemove(country.slug)}
                    aria-label={`Remove ${country.name}`}
                    className="grid h-7 w-7 place-items-center rounded-full text-[#7a879c] transition hover:bg-white hover:text-[#ff4b12]"
                  >
                    <X size={14} strokeWidth={3} />
                  </button>
                </div>
              ))}
            </div>

            {numberRows.map((row) => (
              <div key={row.key} className="grid items-center gap-3 border-t border-orange-100 py-3" style={{ gridTemplateColumns: columns }}>
                <p className={labelClass}>{row.label}</p>
                {countries.map((country) => {
                  const value = SNAPSHOTS[country.slug][row.key];
                  const isBest = countries.length > 1 && value !== null && value === best(row.key);
                  return (
                    <p key={country.slug} className={`rounded-xl px-3 py-2 text-base font-black sm:text-lg ${isBest ? "bg-emerald-50 text-emerald-700" : ""}`}>
                      {formatUsd(value)}
                      {row.suffix && <span className="text-xs font-bold opacity-60"> {row.suffix}</span>}
                      {isBest && <span className="ml-1.5 text-[10px] font-black uppercase tracking-[0.1em]">Lowest</span>}
                    </p>
                  );
                })}
              </div>
            ))}

            {textRows.map((row) => (
              <div key={row.label} className="grid items-start gap-3 border-t border-orange-100 py-3" style={{ gridTemplateColumns: columns }}>
                <p className={`${labelClass} pt-0.5`}>{row.label}</p>
                {countries.map((country) => (
                  <p key={country.slug} className="px-3 text-sm font-bold leading-6 text-[#405672]">
                    {row.get(country)}
                  </p>
                ))}
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-3 border-t border-orange-100 bg-[#fff7ed] px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs font-semibold leading-5 text-[#7a879c]">
            US$ figures are approximate, using the cheapest public option and city. Some visas ask you to show more money (for example
            Germany&apos;s blocked account).
          </p>
          <Link
            to={advisorPath}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-[#ff4b12] px-6 py-3 text-sm font-black text-white transition hover:bg-[#ff642f]"
          >
            Help me decide <ArrowRight size={16} strokeWidth={3} />
          </Link>
        </div>
      </motion.div>
    </motion.div>
  );
}

function CountriesPage() {
  const [filter, setFilter] = useState("all");
  const [sort, setSort] = useState("recommended");
  const [compare, setCompare] = useState([]);
  const [sheetOpen, setSheetOpen] = useState(false);

  useEffect(() => {
    document.title = "Compare Study Destinations | Zaifan Consultancy";
  }, []);

  const visible = useMemo(() => {
    const list = filter === "all" ? countryList : countryList.filter((country) => COUNTRY_TRAITS[country.slug]?.includes(filter));
    if (sort === "recommended") return list;
    const key = SORT_KEYS[sort];
    return [...list].sort((a, b) => (SNAPSHOTS[a.slug][key] ?? Infinity) - (SNAPSHOTS[b.slug][key] ?? Infinity));
  }, [filter, sort]);

  const toggleCompare = (slug) =>
    setCompare((current) => {
      const next = current.includes(slug)
        ? current.filter((item) => item !== slug)
        : current.length < MAX_COMPARE
        ? [...current, slug]
        : current;
      // The side-by-side view needs at least two countries.
      if (next.length < 2) setSheetOpen(false);
      return next;
    });
  const compared = compare.map((slug) => countryList.find((country) => country.slug === slug));
  const closeSheet = useCallback(() => setSheetOpen(false), []);

  return (
    <main className="overflow-hidden bg-[#fff7ed] text-[#071f50]">
      {/* Hero */}
      <section className="relative isolate px-4 pb-10 pt-32 sm:px-5 md:pb-14 md:pt-40">
        <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_12%_12%,rgba(255,75,18,0.12),transparent_32%),radial-gradient(circle_at_88%_20%,rgba(255,190,92,0.18),transparent_30%)]" />

        <div className="mx-auto max-w-[1350px] text-center">
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-[11px] font-black uppercase tracking-[0.16em] text-[#ff4b12] shadow-sm ring-1 ring-orange-100"
          >
            <Sparkles size={14} /> {countryList.length} destinations · 1 EU guide
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="mx-auto mt-5 max-w-4xl text-[2.7rem] font-black leading-[0.92] tracking-[-0.06em] sm:text-6xl md:text-7xl"
          >
            Compare countries. <span className="text-[#ff4b12]">Choose with confidence.</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mx-auto mt-5 max-w-2xl text-base font-semibold leading-7 text-[#526178] sm:text-lg sm:leading-8"
          >
            Real costs converted to one currency, what each country is good for, and side-by-side comparison of up to three.
          </motion.p>

          <div className="mt-8 flex flex-wrap justify-center gap-2.5">
            {[
              { href: "#explore", icon: GitCompareArrows, label: "Compare countries" },
              { href: "#budget", icon: Calculator, label: "Check my budget" },
              { href: "#match", icon: Sparkles, label: "Take the 30-second quiz" },
            ].map((action, index) => (
              <a
                key={action.href}
                href={action.href}
                className={`inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-black transition hover:-translate-y-0.5 ${
                  index === 0
                    ? "bg-[#ff4b12] text-white shadow-[0_14px_30px_rgba(255,75,18,0.28)] hover:bg-[#ff642f]"
                    : "bg-white ring-1 ring-orange-100 hover:text-[#ff4b12]"
                }`}
              >
                <action.icon size={16} /> {action.label}
              </a>
            ))}
          </div>

          <div className="mx-auto mt-10 grid max-w-4xl gap-3 sm:grid-cols-3">
            {INSIGHTS.map((insight) => (
              <Link
                key={insight.label}
                to={`/countries/${insight.country.slug}`}
                className="group flex items-center gap-3 rounded-[22px] bg-white p-4 text-left shadow-[0_14px_36px_rgba(9,31,80,0.06)] ring-1 ring-orange-100 transition hover:-translate-y-0.5"
              >
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[#fff1ea] text-[#ff4b12]">
                  <insight.icon size={20} />
                </span>
                <span className="min-w-0">
                  <span className="block text-[10px] font-black uppercase tracking-[0.14em] text-[#7a879c]">{insight.label}</span>
                  <span className="flex items-center gap-1.5 text-sm font-black">
                    <FlagMark country={insight.country} className="h-3.5 w-5 rounded-[2px] shadow-none" />
                    {insight.country.name}
                    <span className="text-[#ff4b12]">
                      {formatUsd(insight.value(insight.country.slug))}
                      {insight.suffix && <span className="text-[11px] text-[#7a879c]">{insight.suffix}</span>}
                    </span>
                  </span>
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Explorer */}
      <section id="explore" className="scroll-mt-24 px-4 pb-16 sm:px-5 md:pb-20">
        <div className="mx-auto max-w-[1350px]">
          <div className="flex flex-col gap-4 rounded-[26px] bg-white p-4 shadow-[0_16px_45px_rgba(9,31,80,0.06)] ring-1 ring-orange-100 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap gap-2" role="group" aria-label="Filter countries">
              {FILTERS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setFilter(item.id)}
                  aria-pressed={filter === item.id}
                  className={`rounded-full px-4 py-2 text-xs font-black ring-1 transition ${
                    filter === item.id ? "bg-[#071f50] text-white ring-[#071f50]" : "bg-[#fff7ed] ring-orange-100 hover:text-[#ff4b12]"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
            <label className="flex shrink-0 items-center gap-2 text-xs font-black text-[#7a879c]">
              <ArrowDownWideNarrow size={16} className="text-[#ff4b12]" />
              Sort by
              <select
                value={sort}
                onChange={(event) => setSort(event.target.value)}
                className="cursor-pointer rounded-full bg-[#fff7ed] px-3 py-2 text-xs font-black text-[#071f50] outline-none ring-1 ring-orange-100 focus:ring-[#ff4b12]"
              >
                {SORTS.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <p className="mt-3 text-center text-xs font-semibold text-[#7a879c]">
            Prices are approximate US$ for the cheapest public option and city, so you can compare fairly. Each guide has the exact local
            figures. Tap <span className="font-black text-[#071f50]">Compare</span> on up to {MAX_COMPARE} countries.
          </p>

          <motion.div layout className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            <AnimatePresence mode="popLayout">
              {visible.map((country, index) => (
                <CountryCard
                  key={country.slug}
                  country={country}
                  index={index}
                  selected={compare.includes(country.slug)}
                  compareFull={compare.length >= MAX_COMPARE}
                  onToggle={toggleCompare}
                />
              ))}
            </AnimatePresence>
          </motion.div>

          {/* EU hub */}
          <Link
            to="/countries/european-union"
            className="group relative mt-8 flex flex-col gap-5 overflow-hidden rounded-[28px] bg-[#003399] p-7 text-white shadow-[0_26px_70px_rgba(0,51,153,0.25)] transition hover:-translate-y-1 md:flex-row md:items-center md:justify-between md:p-9"
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
              <ArrowUpRight size={16} strokeWidth={3} className="transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            </span>
          </Link>
        </div>
      </section>

      <DripDivider background={ZAIFAN_NAVY} />
      <div id="budget" className="scroll-mt-20">
        <BudgetMatcher />
      </div>
      <DripDivider color={ZAIFAN_NAVY} background="#fff7ed" />

      <MatchQuiz advisorHref="/appointment?service=Free%20Consultation" />

      <ConsultationBand
        title="Still deciding?"
        text="Share your grades, budget and dream subject. We'll recommend two or three destinations that actually fit, with honest pros and cons."
        to="/appointment?service=Free%20Consultation"
      />

      {/* Compare tray */}
      <AnimatePresence>
        {compare.length > 0 && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed inset-x-0 bottom-4 z-[9990] flex justify-center px-4"
          >
            <div className="flex w-full max-w-xl items-center gap-3 rounded-full bg-[#071f50] p-2 pl-4 text-white shadow-[0_24px_60px_rgba(7,31,80,0.4)]">
              <div className="flex flex-1 items-center gap-2 overflow-hidden">
                {compared.map((country) => (
                  <button
                    key={country.slug}
                    type="button"
                    onClick={() => toggleCompare(country.slug)}
                    title={`Remove ${country.name}`}
                    className="group relative shrink-0"
                  >
                    <FlagMark country={country} className="h-7 w-[42px]" />
                    <span className="absolute -right-1.5 -top-1.5 hidden h-4 w-4 place-items-center rounded-full bg-white text-[#071f50] group-hover:grid">
                      <X size={10} strokeWidth={4} />
                    </span>
                  </button>
                ))}
                <span className="truncate text-xs font-black text-white/70">
                  {compare.length < 2 ? "Add one more to compare" : `${compare.length} of ${MAX_COMPARE} selected`}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSheetOpen(true)}
                disabled={compare.length < 2}
                className="inline-flex shrink-0 items-center gap-2 rounded-full bg-[#ff4b12] px-5 py-3 text-sm font-black transition hover:bg-[#ff642f] disabled:opacity-50"
              >
                <GitCompareArrows size={16} /> Compare now
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {sheetOpen && compared.length > 1 && <CompareSheet countries={compared} onRemove={toggleCompare} onClose={closeSheet} />}
      </AnimatePresence>
    </main>
  );
}

export default CountriesPage;
