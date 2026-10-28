import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, CalendarDays, CheckCircle2, Coins, Plane, Wallet } from "lucide-react";

import { countryIndex as countryList } from "../../../data/countries/countryIndex";
import { GATEWAYS } from "../../../data/countries/destinationProfiles";
import { FlagMark } from "../destinations/DestinationUI";
import { SplitFlapRow } from "./SplitFlap";

const CYCLE_MS = 4000;
// After a visitor picks a country, leave it on screen for a while.
const PAUSE_AFTER_PICK_MS = 14000;

const PROMISES = ["Free first consultation", "Honest advice, no fake guarantees", "Visa and scholarship help included"];

function firstPart(text) {
  return String(text).split("·")[0].trim();
}

function HomeHero({ stats }) {
  const [index, setIndex] = useState(0);
  const [picks, setPicks] = useState(0);
  const country = countryList[index];
  const gateway = GATEWAYS[country.slug];

  // Auto-advance the board; after a manual pick, hold that country first.
  useEffect(() => {
    let cycle;
    const start = () => {
      cycle = window.setInterval(() => setIndex((current) => (current + 1) % countryList.length), CYCLE_MS);
    };
    const hold = picks ? window.setTimeout(start, PAUSE_AFTER_PICK_MS) : null;
    if (!picks) start();
    return () => {
      window.clearInterval(cycle);
      window.clearTimeout(hold);
    };
  }, [picks]);

  const pick = (nextIndex) => {
    setIndex(nextIndex);
    setPicks((count) => count + 1);
  };

  const facts = [
    { icon: Wallet, label: "Tuition", value: country.quickFacts.tuition },
    { icon: Coins, label: "Living", value: country.quickFacts.living },
    { icon: CalendarDays, label: "Starts", value: firstPart(country.quickFacts.intakes) },
  ];

  return (
    <section className="relative isolate overflow-hidden bg-[#fff7ed] px-4 pb-14 pt-28 text-[#071f50] sm:px-5 md:pt-32 lg:pb-16">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_8%_20%,rgba(255,75,18,0.12),transparent_30%),radial-gradient(circle_at_92%_70%,rgba(7,31,80,0.08),transparent_35%)]" />

      <div className="mx-auto grid max-w-[1350px] items-center gap-10 lg:grid-cols-[1fr_1.05fr] lg:gap-12">
        {/* Words */}
        <div className="text-center lg:text-left">
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-[11px] font-black uppercase tracking-[0.16em] text-[#ff4b12] shadow-sm ring-1 ring-orange-100"
          >
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#ff4b12] opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-[#ff4b12]" />
            </span>
            For students in Pakistan
          </motion.p>

          <motion.h1
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.05 }}
            className="mt-5 text-[2.7rem] font-black leading-[0.92] tracking-[-0.06em] sm:text-6xl xl:text-[80px]"
          >
            Study abroad,
            <span className="block text-[#ff4b12]">made simple.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="mx-auto mt-5 max-w-xl text-base font-semibold leading-7 text-[#526178] sm:text-lg sm:leading-8 lg:mx-0"
          >
            We help you pick the right country and university, find scholarships and get your visa, step by step, from Pakistan to
            your first lecture.
          </motion.p>

          <ul className="mx-auto mt-6 grid w-fit gap-2 text-left lg:mx-0">
            {PROMISES.map((item) => (
              <li key={item} className="flex items-center gap-2.5 text-sm font-black">
                <CheckCircle2 size={18} className="shrink-0 text-emerald-500" />
                {item}
              </li>
            ))}
          </ul>

          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row lg:justify-start">
            <Link
              to="/appointment?service=Free%20Consultation"
              className="inline-flex items-center justify-center gap-3 rounded-full bg-[#ff4b12] px-8 py-4 text-sm font-black text-white shadow-[0_20px_44px_rgba(255,75,18,0.32)] transition hover:-translate-y-1 hover:bg-[#ff642f] sm:text-base"
            >
              Book a free consultation
              <ArrowRight size={19} strokeWidth={3} />
            </Link>
            <Link
              to="/countries"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-8 py-4 text-sm font-black ring-1 ring-orange-100 transition hover:-translate-y-1 hover:text-[#ff4b12] sm:text-base"
            >
              Find my country
            </Link>
          </div>

          <dl className="mx-auto mt-10 grid max-w-xl grid-cols-4 gap-2 lg:mx-0">
            {stats.map((stat) => (
              <div key={stat.label} className="flex flex-col-reverse">
                <dt className="mt-0.5 text-[10px] font-black uppercase leading-4 tracking-[0.1em] text-[#7a879c]">{stat.label}</dt>
                <dd className="text-2xl font-black tracking-[-0.04em] sm:text-3xl">{stat.value}</dd>
              </div>
            ))}
          </dl>
        </div>

        {/* The board */}
        <motion.div
          initial={{ opacity: 0, y: 26, rotate: 1.5 }}
          animate={{ opacity: 1, y: 0, rotate: 0 }}
          transition={{ duration: 0.8, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
          className="relative mx-auto w-full max-w-[640px] rounded-[30px] bg-[#071f50] p-5 text-white shadow-[0_40px_90px_rgba(7,31,80,0.32)] sm:p-7"
        >
          <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full border-[26px] border-white/[0.04]" />

          <div className="relative flex items-center justify-between text-[10px] font-black uppercase tracking-[0.2em] text-white/50 sm:text-[11px]">
            <span className="flex items-center gap-2">
              <Plane size={14} className="text-[#ff7b1c]" /> Next departure
            </span>
            <span className="rounded-full bg-emerald-400/15 px-2.5 py-1 tracking-[0.12em] text-emerald-300">Free consultation</span>
          </div>

          {/* Remount on a new word length so the board resizes cleanly. */}
          <div className="relative mt-5 flex justify-center">
            <SplitFlapRow key={country.name.length} text={country.name} size="lg" />
          </div>

          <div className="relative mt-5 flex items-center gap-3">
            <div>
              <p className="font-mono text-lg font-black sm:text-2xl">PAK</p>
              <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-white/50">Pakistan</p>
            </div>
            <span className="relative h-px flex-1 bg-[repeating-linear-gradient(90deg,rgba(255,255,255,0.35)_0_6px,transparent_6px_12px)]">
              <motion.span
                key={country.slug}
                initial={{ left: "0%" }}
                animate={{ left: "100%" }}
                transition={{ duration: CYCLE_MS / 1000, ease: "linear" }}
                className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 text-[#ff7b1c]"
              >
                <Plane size={18} fill="currentColor" />
              </motion.span>
            </span>
            <div className="text-right">
              <p className="font-mono text-lg font-black text-[#ff7b1c] sm:text-2xl">{gateway.airport}</p>
              <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-white/50">{gateway.city}</p>
            </div>
          </div>

          <div className="relative mt-6 grid gap-2.5 sm:grid-cols-3">
            {facts.map((fact) => (
              <div key={fact.label} className="rounded-2xl bg-white/[0.07] px-4 py-3 ring-1 ring-white/10">
                <p className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.14em] text-white/50">
                  <fact.icon size={13} className="text-[#ff7b1c]" /> {fact.label}
                </p>
                <AnimatePresence mode="wait">
                  <motion.p
                    key={`${country.slug}-${fact.label}`}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.2 }}
                    className="mt-1 text-sm font-black leading-5"
                  >
                    {fact.value}
                  </motion.p>
                </AnimatePresence>
              </div>
            ))}
          </div>

          <div className="relative mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-5">
            <div className="flex flex-wrap gap-1.5" role="group" aria-label="Choose a destination">
              {countryList.map((item, itemIndex) => (
                <button
                  key={item.slug}
                  type="button"
                  onClick={() => pick(itemIndex)}
                  aria-pressed={itemIndex === index}
                  title={item.name}
                  className={`rounded-lg p-1 transition ${itemIndex === index ? "bg-[#ff4b12]" : "bg-white/[0.06] hover:bg-white/15"}`}
                >
                  <FlagMark country={item} className="h-4 w-6 rounded-[3px] shadow-none" />
                  <span className="sr-only">{item.name}</span>
                </button>
              ))}
            </div>
            <Link to={`/countries/${country.slug}`} className="inline-flex items-center gap-1.5 text-xs font-black text-[#ffb36d] hover:text-white">
              {country.name} guide <ArrowRight size={14} strokeWidth={3} />
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

export default HomeHero;
