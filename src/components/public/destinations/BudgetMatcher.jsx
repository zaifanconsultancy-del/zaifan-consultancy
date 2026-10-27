import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Wallet } from "lucide-react";

import { countryList } from "../../../data/countries";
import { citiesInUsd } from "../../../data/countries/costs";
import { FlagMark, SectionHeader } from "./DestinationUI";

const ALL = countryList.map((country) => ({ country, cities: citiesInUsd(country) }));

function BudgetMatcher() {
  const [budget, setBudget] = useState(800);

  const results = useMemo(
    () =>
      ALL.map(({ country, cities }) => {
        const fitting = cities.filter((city) => city.low <= budget).sort((a, b) => a.low - b.low);
        return { country, fitting, comfortable: fitting.filter((city) => city.high <= budget) };
      })
        // Countries that fit first; otherwise keep the usual order so cards don't jump around.
        .sort((a, b) => Number(b.fitting.length > 0) - Number(a.fitting.length > 0)),
    [budget],
  );

  const matchingCountries = results.filter((result) => result.fitting.length);
  const cityCount = matchingCountries.reduce((sum, result) => sum + result.fitting.length, 0);

  return (
    <section className="relative overflow-hidden bg-[#071f50] px-4 py-16 text-white sm:px-5 md:py-24">
      <div className="pointer-events-none absolute -left-32 top-10 h-96 w-96 rounded-full bg-[#ff4b12]/20 blur-[110px]" />
      <div className="pointer-events-none absolute -right-32 bottom-0 h-96 w-96 rounded-full bg-amber-400/10 blur-[110px]" />

      <div className="relative mx-auto max-w-[1350px]">
        <SectionHeader
          tone="dark"
          eyebrow="Budget matcher"
          title="What can your budget afford?"
          text="Drag to your monthly living budget (rent, food, transport and essentials, not tuition) and see which student cities fit."
        />

        <div className="relative mx-auto mt-10 max-w-3xl">
          <div className="relative rounded-[30px] bg-white/[0.06] p-6 ring-1 ring-white/10 md:p-8">
            <div className="flex items-end justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[#ff4b12]">
                  <Wallet size={22} />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#ffb36d]">Monthly budget</p>
                  <motion.p
                    key={budget}
                    initial={{ opacity: 0.5, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-4xl font-black tracking-[-0.05em]"
                  >
                    ≈ ${budget.toLocaleString("en-US")}
                  </motion.p>
                </div>
              </div>
              <p className="text-right text-sm font-black text-white/80">
                <span className="text-3xl text-[#ff7b1c]">{cityCount}</span> cities in{" "}
                <span className="text-3xl text-[#ff7b1c]">{matchingCountries.length}</span> countries
              </p>
            </div>

            <input
              type="range"
              min={300}
              max={1700}
              step={50}
              value={budget}
              onChange={(event) => setBudget(Number(event.target.value))}
              aria-label="Monthly living budget in US dollars"
              className="mt-6 w-full cursor-pointer accent-[#ff4b12]"
            />
            <div className="mt-1 flex justify-between text-[11px] font-bold text-white/50">
              <span>$300</span>
              <span>$1,000</span>
              <span>$1,700</span>
            </div>
          </div>
        </div>

        <motion.div layout className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <AnimatePresence>
            {results.map(({ country, fitting, comfortable }) => {
              const fits = fitting.length > 0;
              return (
                <motion.div
                  layout
                  key={country.slug}
                  animate={{ opacity: fits ? 1 : 0.35 }}
                  className={`rounded-[24px] p-5 ring-1 transition ${fits ? "bg-white text-[#071f50] ring-white" : "bg-white/[0.04] ring-white/10"}`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <Link to={`/countries/${country.slug}`} className="flex items-center gap-3">
                      <FlagMark country={country} className="h-7 w-[42px]" />
                      <span className="text-lg font-black tracking-[-0.03em]">{country.name}</span>
                    </Link>
                    <span
                      className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em] ${fits ? "bg-[#fff1ea] text-[#ff4b12]" : "bg-white/10 text-white/60"}`}
                    >
                      {fits ? `${fitting.length} fit` : "Over budget"}
                    </span>
                  </div>
                  {fits ? (
                    <div className="mt-4 flex flex-wrap gap-1.5">
                      {fitting.map((city) => (
                        <Link
                          key={city.slug}
                          to={city.path}
                          className={`rounded-full px-3 py-1.5 text-xs font-black ring-1 transition hover:bg-[#ff4b12] hover:text-white hover:ring-[#ff4b12] ${
                            comfortable.includes(city) ? "bg-emerald-50 text-emerald-700 ring-emerald-100" : "bg-[#fff7ed] ring-orange-100"
                          }`}
                        >
                          {city.name}
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-4 text-xs font-semibold text-white/55">
                      Cheapest city ≈ $
                      {Math.round(Math.min(...ALL.find((item) => item.country === country).cities.map((city) => city.low))).toLocaleString(
                        "en-US",
                      )}
                      /month
                    </p>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>

        <div className="mt-8 flex flex-col items-center justify-between gap-4 rounded-[24px] bg-white/[0.05] p-5 text-sm font-semibold text-white/70 ring-1 ring-white/10 md:flex-row">
          <p>
            <span className="mr-2 inline-block h-3 w-3 rounded-full bg-emerald-400 align-middle" />
            Green = comfortable at this budget. Orange = possible on a saver lifestyle. Rough US-dollar conversions; tuition not included.
          </p>
          <Link
            to="/appointment?service=Country%20Comparison"
            className="inline-flex shrink-0 items-center gap-2 rounded-full bg-[#ff4b12] px-5 py-3 text-xs font-black text-white transition hover:bg-[#ff642f]"
          >
            Plan my real budget
            <ArrowRight size={14} strokeWidth={3} />
          </Link>
        </div>
      </div>
    </section>
  );
}

export default BudgetMatcher;
