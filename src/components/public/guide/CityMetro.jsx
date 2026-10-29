import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, School, Target } from "lucide-react";

import { iconFor } from "../destinations/destinationUtils";
import StepIntro from "./StepIntro";
import { moneyRange } from "./guideSteps";

const total = (budget, end) => Object.values(budget).reduce((sum, range) => sum + range[end], 0);

/** Step 5: the country's cities as stops on one metro line, cheapest to priciest. */
function CityMetro({ country }) {
  const symbol = country.currencySymbol || "€";

  const stops = useMemo(() => {
    const priced = country.cities.filter((city) => city.budget).sort((a, b) => total(a.budget, 0) - total(b.budget, 0));
    const unpriced = country.cities.filter((city) => !city.budget);
    return [...priced, ...unpriced];
  }, [country.cities]);

  const goals = useMemo(
    () => (country.cityGoals || []).filter((goal) => stops.some((city) => city.slug === goal.citySlug)),
    [country.cityGoals, stops],
  );

  const [selected, setSelected] = useState(stops[0]?.slug);
  const [goalName, setGoalName] = useState(null);
  const city = stops.find((item) => item.slug === selected) || stops[0];
  const goal = goals.find((item) => item.goal === goalName && item.citySlug === city?.slug);
  const universities = country.universities.filter((university) => university.citySlug === city?.slug);

  const pickGoal = (item) => {
    setGoalName(item.goal);
    setSelected(item.citySlug);
  };
  const pickStop = (slug) => {
    setGoalName(null);
    setSelected(slug);
  };

  if (!city) return null;

  return (
    <section id="cities" className="scroll-mt-20 bg-[#ff4b12] px-4 pb-20 pt-10 text-white sm:px-5 md:pb-28 md:pt-14">
      <div className="mx-auto max-w-[1350px]">
        <StepIntro
          step={5}
          tone="orange"
          title="Which city"
          accent="fits you best?"
          howTo="The cities sit on one line from cheapest to most expensive. Tap a stop, or tell us what you want to study and we'll take you there."
        />

        {goals.length > 0 && (
          <div className="mt-10">
            <p className="flex items-center gap-2 font-mono text-[11px] font-black uppercase tracking-[0.14em] text-white/80">
              <Target size={14} /> I want to study or find…
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {goals.map((item) => {
                const active = item.goal === goalName;
                return (
                  <button
                    key={item.goal}
                    type="button"
                    onClick={() => pickGoal(item)}
                    aria-pressed={active}
                    className={`rounded-full px-4 py-2 text-sm font-black transition ${
                      active ? "bg-[#071f50] text-white" : "bg-white/15 text-white ring-1 ring-white/25 hover:bg-white/25"
                    }`}
                  >
                    {item.goal}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className="mt-8 rounded-[28px] bg-white p-5 text-[#071f50] shadow-[0_30px_70px_rgba(7,31,80,0.25)] sm:p-7">
          <div className="flex items-center justify-between font-mono text-[10px] font-black uppercase tracking-[0.16em] text-[#7a879c]">
            <span>← Cheaper</span>
            <span>
              {country.name} line · {stops.length} stops
            </span>
            <span>Pricier →</span>
          </div>

          {/* The line */}
          <div className="-mx-5 mt-4 overflow-x-auto px-5 pb-2 [scrollbar-width:thin] sm:-mx-7 sm:px-7">
            <ol className="relative flex min-w-max">
              {/* Runs from the first stop's centre to the last one's */}
              <span
                aria-hidden="true"
                className="absolute top-[19px] h-2 rounded-full bg-[#071f50]"
                style={{ left: `${50 / stops.length}%`, right: `${50 / stops.length}%` }}
              />
              {stops.map((stop) => {
                const active = stop.slug === city.slug;
                return (
                  <li key={stop.slug} className="relative flex min-w-[112px] flex-1 flex-col items-center sm:min-w-[124px]">
                    <button
                      type="button"
                      onClick={() => pickStop(stop.slug)}
                      aria-pressed={active}
                      aria-label={`${stop.name}${stop.budget ? `, from ${moneyRange(symbol, total(stop.budget, 0), total(stop.budget, 0))} a month` : ""}`}
                      className="group flex flex-col items-center"
                    >
                      <span
                        className={`relative z-10 grid place-items-center rounded-full border-[5px] transition-all ${
                          active ? "h-12 w-12 -translate-y-1 border-[#ff4b12] bg-white" : "h-10 w-10 border-[#071f50] bg-white group-hover:border-[#ff4b12]"
                        }`}
                      >
                        {active && <span className="h-3 w-3 animate-ping rounded-full bg-[#ff4b12]" />}
                      </span>
                      <span className={`mt-2 text-center text-sm font-black leading-tight ${active ? "text-[#ff4b12]" : ""}`}>{stop.name}</span>
                      {stop.budget && (
                        <span className="mt-0.5 font-mono text-[10px] font-black text-[#9aa5b8]">
                          {symbol}
                          {Math.round(total(stop.budget, 0)).toLocaleString("en-US")}+
                        </span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ol>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={city.slug}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
              className="mt-6 grid gap-6 rounded-[22px] bg-[#fff7ed] p-5 ring-1 ring-orange-100 md:grid-cols-[1.2fr_1fr] md:p-6"
            >
              <div>
                <p className="font-mono text-[10px] font-black uppercase tracking-[0.16em] text-[#ff4b12]">
                  Now arriving · {city.region}
                </p>
                <h3 className="mt-2 flex items-center gap-3 text-4xl font-black tracking-[-0.05em]">
                  <span aria-hidden="true">{city.emoji}</span> {city.name}
                </h3>
                <p className="mt-2 text-base font-bold leading-7 text-[#526178]">{city.headline}</p>
                {goal && (
                  <p className="mt-3 rounded-2xl bg-[#071f50] px-4 py-3 text-sm font-semibold leading-6 text-white">
                    <span className="font-black text-[#ffb36d]">Why {city.name} for {goal.goal.toLowerCase()}: </span>
                    {goal.reason}
                  </p>
                )}
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {city.bestFor.slice(0, 5).map((item) => (
                    <span key={item} className="rounded-full bg-white px-3 py-1 text-xs font-black ring-1 ring-orange-100">
                      {item}
                    </span>
                  ))}
                </div>
              </div>

              <div className="grid content-start gap-3">
                {city.budget && (
                  <div className="rounded-2xl bg-white p-4 ring-1 ring-orange-100">
                    <p className="font-mono text-[10px] font-black uppercase tracking-[0.14em] text-[#7a879c]">Monthly budget</p>
                    <p className="mt-1 text-2xl font-black tracking-[-0.03em] text-[#ff4b12]">
                      {moneyRange(symbol, total(city.budget, 0), total(city.budget, 1))}
                    </p>
                    <p className="text-xs font-semibold text-[#7a879c]">Saver to comfortable, rent included</p>
                  </div>
                )}
                {universities.length > 0 && (
                  <div className="rounded-2xl bg-white p-4 ring-1 ring-orange-100">
                    <p className="flex items-center gap-1.5 font-mono text-[10px] font-black uppercase tracking-[0.14em] text-[#7a879c]">
                      <School size={13} /> {universities.length} {universities.length === 1 ? "university" : "universities"} here
                    </p>
                    <ul className="mt-2 grid gap-1">
                      {universities.slice(0, 3).map((university) => (
                        <li key={university.key}>
                          <Link to={university.path} className="text-sm font-black hover:text-[#ff4b12]">
                            {university.name}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                <Link
                  to={`/countries/${country.slug}/${city.slug}`}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-[#071f50] px-5 py-3.5 text-sm font-black text-white transition hover:bg-[#ff4b12]"
                >
                  Open the full {city.name} guide <ArrowRight size={16} strokeWidth={3} />
                </Link>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {country.studentLife?.length > 0 && (
          <div className="mt-16">
            <h3 className="text-3xl font-black tracking-[-0.045em] md:text-4xl">Daily life in {country.name}.</h3>
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {country.studentLife.map((item) => {
                const Icon = iconFor(item.icon);
                return (
                  <div key={item.title} className="rounded-[22px] bg-[#071f50]/15 p-5 ring-1 ring-white/15">
                    <h4 className="flex items-center gap-2.5 text-lg font-black">
                      <span className="grid h-9 w-9 place-items-center rounded-xl bg-white text-[#ff4b12]">
                        <Icon size={18} />
                      </span>
                      {item.title}
                    </h4>
                    <p className="mt-2.5 text-sm font-semibold leading-6 text-white/90">{item.text}</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

export default CityMetro;
