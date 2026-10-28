import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

import { countryList } from "../../../data/countries";
import { FlagMark } from "../destinations/DestinationUI";
import { CITIES } from "./countriesData";
import StepLabel from "./StepLabel";

const AXIS_MIN = 200;
const AXIS_MAX = 1800;
const TICKS = [200, 600, 1000, 1400, 1800];

// Cheapest country at the top, so the lanes read like a staircase.
const LANES = countryList
  .map((country) => ({ country, cities: [...CITIES[country.slug]].sort((a, b) => a.low - b.low) }))
  .filter((lane) => lane.cities.length)
  .sort((a, b) => a.cities[0].low - b.cities[0].low);

function position(value) {
  const clamped = Math.min(Math.max(value, AXIS_MIN), AXIS_MAX);
  return ((clamped - AXIS_MIN) / (AXIS_MAX - AXIS_MIN)) * 100;
}

function usd(value) {
  return `$${Math.round(value).toLocaleString("en-US")}`;
}

function Lane({ country, cities, budget }) {
  const fitting = cities.filter((city) => city.low <= budget).length;

  return (
    <div className="grid h-14 grid-cols-[34px_1fr_34px] items-center gap-3 sm:grid-cols-[150px_1fr_64px]">
      <Link to={`/countries/${country.slug}`} className="flex min-w-0 items-center gap-2 hover:text-[#ff4b12]">
        <FlagMark country={country} className="h-5 w-[30px] rounded-[4px]" />
        <span className="hidden truncate text-sm font-black sm:inline">{country.name}</span>
      </Link>

      <div className="relative h-full">
        <span className="absolute inset-x-0 top-1/2 h-px bg-[#071f50]/10" />
        {/* Saver → comfortable ranges sit under the dots */}
        {cities.map((city) => (
          <span
            key={`range-${city.slug}`}
            className={`absolute top-1/2 h-1 -translate-y-1/2 rounded-full transition-colors ${city.low <= budget ? "bg-[#ff4b12]/20" : "bg-[#071f50]/[0.05]"}`}
            style={{ left: `${position(city.low)}%`, width: `${position(city.high) - position(city.low)}%` }}
          />
        ))}
        {cities.map((city) => {
          const fits = city.low <= budget;
          const comfy = city.high <= budget;
          return (
            <span key={city.slug} className="group absolute top-1/2 -translate-y-1/2 hover:z-10" style={{ left: `${position(city.low)}%` }}>
              <span
                className={`zaifan-ladder-dot relative block h-3.5 w-3.5 -translate-x-1/2 rounded-full border-2 border-white sm:h-4 sm:w-4 ${
                  comfy
                    ? "bg-emerald-500 shadow-[0_0_0_4px_rgba(16,185,129,0.18)]"
                    : fits
                    ? "scale-110 bg-[#ff4b12] shadow-[0_0_0_4px_rgba(255,75,18,0.18)]"
                    : "bg-[#c9d0dc]"
                }`}
              />
              <span className="pointer-events-none absolute bottom-full left-0 z-20 mb-2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-[#071f50] px-2.5 py-1.5 text-[11px] font-black text-white opacity-0 shadow-lg transition group-hover:opacity-100">
                {city.name} · {usd(city.low)}–{usd(city.high)}
              </span>
            </span>
          );
        })}
      </div>

      <span className={`text-right font-mono text-xs font-black ${fitting ? "text-[#ff4b12]" : "text-[#9aa5b8]"}`}>
        {fitting}/{cities.length}
      </span>
    </div>
  );
}

function PriceLadder() {
  const [budget, setBudget] = useState(700);

  const fittingCities = useMemo(
    () =>
      LANES.flatMap(({ country, cities }) => cities.filter((city) => city.low <= budget).map((city) => ({ ...city, country }))).sort(
        (a, b) => a.low - b.low,
      ),
    [budget],
  );
  const countryCount = new Set(fittingCities.map((city) => city.country.slug)).size;
  const vibe =
    budget < 400 ? "Saver mode activated." : budget < 700 ? "Budget king behaviour." : budget < 1100 ? "Comfortable era." : "Living lavish.";

  return (
    <section id="budget" className="relative scroll-mt-20 overflow-hidden bg-[#fff7ed] px-4 pb-20 pt-10 text-[#071f50] sm:px-5 md:pb-24 md:pt-14">
      <div className="mx-auto max-w-[1350px]">
        <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <StepLabel step={3} />
            <h2 className="mt-4 text-5xl font-black leading-[0.9] tracking-[-0.06em] md:text-7xl">
              How far does
              <span className="block text-[#ff4b12]">your money go?</span>
            </h2>
            <p className="mt-4 max-w-2xl text-sm font-semibold leading-7 text-[#5f6f89] md:text-base">
              <span className="font-black text-[#071f50]">How to use:</span> drag the orange slider to what your family can send each month
              for rent, food, transport and essentials (not tuition). Each dot is one of{" "}
              {LANES.reduce((sum, lane) => sum + lane.cities.length, 0)} student cities: green = comfortable, orange = doable if you live
              carefully, grey = too expensive for now.
            </p>
          </div>

          <div className="rounded-[26px] border-2 border-[#071f50] bg-white p-5 shadow-[6px_6px_0_#071f50] lg:w-[340px]">
            <p className="font-mono text-[10px] font-black uppercase tracking-[0.18em] text-[#7a879c]">Your monthly budget</p>
            <p className="mt-1 text-5xl font-black tracking-[-0.06em]">
              <motion.span key={budget} initial={{ opacity: 0.4 }} animate={{ opacity: 1 }}>
                ≈ {usd(budget)}
              </motion.span>
            </p>
            <AnimatePresence mode="wait">
              <motion.p
                key={vibe}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                className="mt-1 text-sm font-black text-[#ff4b12]"
              >
                {vibe}
              </motion.p>
            </AnimatePresence>
            <p className="mt-3 text-sm font-semibold text-[#5f6f89]">
              <span className="text-2xl font-black text-[#071f50]">{fittingCities.length}</span> cities in{" "}
              <span className="text-2xl font-black text-[#071f50]">{countryCount}</span> countries
            </p>
          </div>
        </div>

        <div className="mt-10 rounded-[32px] bg-white p-4 shadow-[0_24px_60px_rgba(9,31,80,0.08)] ring-1 ring-orange-100 sm:p-7">
          {/* Axis + slider share the lane column so the line lines up with the dots. */}
          <div className="grid grid-cols-[34px_1fr_34px] gap-3 sm:grid-cols-[150px_1fr_64px]">
            <span />
            <div>
              <input
                type="range"
                min={AXIS_MIN}
                max={AXIS_MAX}
                step={25}
                value={budget}
                onChange={(event) => setBudget(Number(event.target.value))}
                aria-label="Monthly living budget in US dollars"
                className="w-full cursor-pointer accent-[#ff4b12]"
              />
              <div className="relative mt-1 h-4 font-mono text-[10px] font-bold text-[#7a879c]">
                {TICKS.map((tick) => (
                  <span key={tick} className={`absolute -translate-x-1/2 ${tick % 800 === 200 ? "" : "hidden sm:inline"}`} style={{ left: `${position(tick)}%` }}>
                    {usd(tick)}
                  </span>
                ))}
              </div>
            </div>
            <span />
          </div>

          <div className="relative mt-3">
            {/* Budget line across every lane */}
            <div className="pointer-events-none absolute inset-y-0 left-[46px] right-[46px] sm:left-[162px] sm:right-[76px]">
              <motion.div
                className="absolute inset-y-0 w-0.5 -translate-x-1/2 bg-[#ff4b12]"
                animate={{ left: `${position(budget)}%` }}
                transition={{ type: "spring", stiffness: 400, damping: 40 }}
              >
                <span className="absolute inset-y-0 left-1/2 w-24 -translate-x-full bg-gradient-to-l from-[#ff4b12]/10 to-transparent" />
              </motion.div>
            </div>

            <div className="divide-y divide-orange-100/70">
              {LANES.map((lane) => (
                <Lane key={lane.country.slug} {...lane} budget={budget} />
              ))}
            </div>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-orange-100 pt-4 text-[11px] font-black text-[#5f6f89]">
            <span className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-full bg-emerald-500" /> Comfortable
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-full bg-[#ff4b12]" /> Doable on a saver lifestyle
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-full bg-[#c9d0dc]" /> Over budget
            </span>
            <span className="font-semibold">Hover a dot for the city. Rough US$ conversions.</span>
          </div>
        </div>

        {/* The same answer as a list you can tap */}
        <div className="mt-6 flex flex-wrap gap-1.5">
          <AnimatePresence>
            {fittingCities.map((city) => (
              <motion.span key={`${city.country.slug}-${city.slug}`} layout initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}>
                <Link
                  to={city.path}
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-black ring-1 transition hover:bg-[#071f50] hover:text-white hover:ring-[#071f50] ${
                    city.high <= budget ? "bg-emerald-50 text-emerald-700 ring-emerald-100" : "bg-white ring-orange-100"
                  }`}
                >
                  <FlagMark country={city.country} className="h-2.5 w-4 rounded-[2px] shadow-none" />
                  {city.name}
                  <span className="opacity-55">{usd(city.low)}</span>
                </Link>
              </motion.span>
            ))}
          </AnimatePresence>
          {!fittingCities.length && <p className="text-sm font-semibold text-[#7a879c]">Nothing fits yet. Slide right a little.</p>}
        </div>

        <div className="mt-8">
          <Link
            to="/appointment?service=Country%20Comparison"
            className="inline-flex items-center gap-2 rounded-full bg-[#071f50] px-6 py-3.5 text-sm font-black text-white transition hover:-translate-y-0.5 hover:bg-[#0b2a6b]"
          >
            Plan my real budget with an advisor <ArrowRight size={16} strokeWidth={3} />
          </Link>
        </div>
      </div>
    </section>
  );
}

export default PriceLadder;
