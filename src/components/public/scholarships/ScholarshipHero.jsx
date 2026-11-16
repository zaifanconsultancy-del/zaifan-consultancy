import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowDown, ArrowRight, Check, PlaneTakeoff } from "lucide-react";

import { FlagMark } from "../destinations/DestinationUI";
import { ALL_SCHOLARSHIPS, COVERAGE } from "../../../data/countries/scholarshipFinder";

function scrollToStep(id) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

// The board shows the scholarships that can pay for the most things.
const BOARD = [...ALL_SCHOLARSHIPS].sort((a, b) => b.coverage.length - a.coverage.length).slice(0, 5);

/** A departures board, but the column that matters is who pays. */
function PaidBoard() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40, rotate: 0 }}
      animate={{ opacity: 1, y: 0, rotate: -1.5 }}
      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      className="mx-auto w-full max-w-[560px] rounded-[26px] bg-[#071f50] p-4 text-white shadow-[0_30px_70px_rgba(7,31,80,0.3)] sm:p-5"
    >
      <div className="flex items-center justify-between gap-3 border-b border-white/10 pb-3">
        <p className="flex items-center gap-2 font-mono text-[11px] font-black uppercase tracking-[0.16em] text-[#ffb36d]">
          <PlaneTakeoff size={15} /> Departures · who pays
        </p>
        <span className="flex items-center gap-1.5 font-mono text-[10px] font-black uppercase tracking-[0.12em] text-emerald-300">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-300" /> For international students
        </span>
      </div>

      <ul className="divide-y divide-white/10">
        {BOARD.map((item, index) => (
          <motion.li
            key={item.key}
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.25 + index * 0.08 }}
            className="flex items-center gap-3 py-3"
          >
            <FlagMark country={item.country} className="h-6 w-9 shrink-0 rounded-[4px]" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-black tracking-[-0.01em]">{item.name}</p>
              <p className="mt-1 flex flex-wrap gap-x-2.5 gap-y-0.5">
                {COVERAGE.filter((cover) => item.coverage.includes(cover.id)).map((cover) => (
                  <span key={cover.id} className="inline-flex items-center gap-1 text-[11px] font-bold text-white/65">
                    <Check size={11} strokeWidth={4} className="text-emerald-300" /> {cover.short}
                  </span>
                ))}
              </p>
            </div>
            <span className="hidden shrink-0 rounded-md bg-white/10 px-2 py-1 font-mono text-[10px] font-black uppercase tracking-[0.1em] text-[#ffb36d] sm:block">
              {item.country.name}
            </span>
          </motion.li>
        ))}
      </ul>

      <p className="border-t border-white/10 pt-3 text-[11px] font-bold leading-5 text-white/50">
        What each one can pay for. Awards are competitive and never guaranteed.
      </p>
    </motion.div>
  );
}

function ScholarshipHero({ countryCount, appointmentPath }) {
  const tiles = [
    { label: "Scholarships listed", value: ALL_SCHOLARSHIPS.length },
    { label: "Countries", value: countryCount },
    { label: "Guaranteed awards", value: "0", note: "No honest adviser can promise one" },
  ];

  return (
    <section className="relative overflow-hidden bg-[#fff7ed] px-4 pb-16 pt-28 text-[#071f50] sm:px-5 md:pb-24 md:pt-36">
      <div className="relative mx-auto grid max-w-[1350px] items-center gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full bg-[#071f50] px-3.5 py-2 font-mono text-[11px] font-black uppercase tracking-[0.16em] text-white">
            Scholarships · all {countryCount} countries
          </span>

          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mt-6 text-[3.1rem] font-black leading-[0.88] tracking-[-0.07em] sm:text-7xl xl:text-[96px]"
          >
            Who pays for
            <span className="block text-[#ff4b12]">your studies?</span>
          </motion.h1>

          <p className="mt-6 max-w-xl text-base font-semibold leading-8 text-[#526178] sm:text-lg">
            Government, university and Europe-wide scholarships that Pakistani students can apply for. Tell us what you need paid and we show the ones
            that fit, with honest notes on each.
          </p>

          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() => scrollToStep("pick")}
              className="group inline-flex items-center justify-center gap-2 rounded-full bg-[#071f50] px-7 py-4 text-sm font-black text-white transition hover:bg-[#0b2a6b]"
            >
              Start step 1: what do you need?
              <ArrowDown size={17} strokeWidth={3} className="transition group-hover:translate-y-0.5" />
            </button>
            <Link
              to={appointmentPath}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-[#ff4b12] px-7 py-4 text-sm font-black text-white shadow-[0_16px_36px_rgba(255,75,18,0.3)] transition hover:bg-[#ff642f]"
            >
              Get a free scholarship plan
              <ArrowRight size={17} strokeWidth={3} />
            </Link>
          </div>

          <dl className="mt-9 grid max-w-xl grid-cols-3 gap-2.5">
            {tiles.map((tile) => (
              <div key={tile.label} className="rounded-2xl bg-white p-3.5 ring-1 ring-orange-100">
                <dt className="font-mono text-[10px] font-black uppercase tracking-[0.12em] text-[#ff4b12]">{tile.label}</dt>
                <dd className="mt-1 text-3xl font-black tracking-[-0.04em]">{tile.value}</dd>
                {tile.note && <p className="mt-1 text-[11px] font-bold leading-4 text-[#7a879c]">{tile.note}</p>}
              </div>
            ))}
          </dl>
        </div>

        <PaidBoard />
      </div>
    </section>
  );
}

export default ScholarshipHero;
