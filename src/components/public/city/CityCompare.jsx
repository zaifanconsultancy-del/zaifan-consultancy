import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

import StepIntro from "../guide/StepIntro";
import { moneyRange } from "../guide/guideSteps";
import { CITY_STEPS } from "../../../data/countries/cityGuides";

function ordinal(n) {
  const suffixes = ["th", "st", "nd", "rd"];
  const value = n % 100;
  return n + (suffixes[(value - 20) % 10] || suffixes[value] || suffixes[0]);
}

function rankLine(rank, total, cityName, countryName) {
  if (rank === 1) return `${cityName} is the cheapest of the ${total} cities we cover in ${countryName}.`;
  if (rank === total) return `${cityName} is the most expensive of the ${total} cities we cover in ${countryName}.`;
  return `${cityName} is the ${ordinal(rank)} cheapest of the ${total} cities we cover in ${countryName}.`;
}

/** Step 5: every city in the country on one price ladder, this one marked. */
function CityCompare({ city, country, ladder, rank }) {
  const symbol = country.currencySymbol || "";
  // The bars share one scale that starts a little below the cheapest city, so
  // the differences between cities are easy to see.
  const max = Math.max(...ladder.map((item) => item.totals.high), 1);
  const min = Math.min(...ladder.map((item) => item.totals.low)) * 0.85;
  const span = Math.max(max - min, 1);

  return (
    <section id="compare" className="scroll-mt-20 bg-[#ff4b12] px-4 pb-20 pt-10 text-white sm:px-5 md:pb-28 md:pt-14">
      <div className="mx-auto max-w-[1350px]">
        <StepIntro
          step={5}
          steps={CITY_STEPS}
          tone="orange"
          title={`${city.name} next to`}
          accent={`the rest of ${country.name}.`}
          text={rank ? rankLine(rank, ladder.length, city.name, country.name) : `See how the other cities in ${country.name} compare.`}
          howTo="Cheapest city first. Each bar shows a month of living costs, from careful to comfortable. Tap a city to open its guide."
        />

        <ol className="mt-10 grid gap-2.5 rounded-[30px] bg-white p-3 text-[#071f50] shadow-[0_30px_70px_rgba(7,31,80,0.25)] sm:p-5">
          {ladder.map((item, index) => {
            const current = item.slug === city.slug;
            const start = ((item.totals.low - min) / span) * 100;
            const width = Math.max(((item.totals.high - item.totals.low) / span) * 100, 3);
            const body = (
              <>
                <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-full font-mono text-xs font-black ${current ? "bg-white text-[#071f50]" : "bg-[#071f50] text-white"}`}>
                  {index + 1}
                </span>
                <span className="min-w-0 sm:w-[210px] sm:shrink-0">
                  <span className="flex items-center gap-2 text-base font-black tracking-[-0.02em]">
                    <span aria-hidden="true">{item.emoji}</span>
                    <span className="truncate">{item.name}</span>
                    {current && <span className="hidden shrink-0 rounded-full sm:inline bg-[#ff4b12] px-2 py-0.5 font-mono text-[9.5px] font-black uppercase tracking-[0.1em] text-white">You are here</span>}
                  </span>
                  {current && <span className="block font-mono text-[10px] font-black uppercase tracking-[0.1em] text-[#ffb36d] sm:hidden">You are here</span>}
                  <span className={`truncate text-xs font-bold ${current ? "hidden text-white/65 sm:block" : "block text-[#7a879c]"}`}>{item.bestFor.slice(0, 2).join(" · ")}</span>
                </span>
                <span className={`relative hidden h-3 flex-1 rounded-full sm:block ${current ? "bg-white/15" : "bg-[#071f50]/[0.07]"}`} aria-hidden="true">
                  <span className={`absolute inset-y-0 rounded-full ${current ? "bg-[#ff7b1c]" : "bg-[#071f50]"}`} style={{ left: `${start}%`, width: `${width}%` }} />
                </span>
                <span className="ml-auto shrink-0 text-right font-mono text-sm font-black tabular-nums sm:ml-0 sm:w-[150px]">
                  {moneyRange(symbol, item.totals.low, item.totals.high)}
                </span>
                {!current && <ArrowRight size={16} strokeWidth={3} className="hidden shrink-0 text-[#ff4b12] transition group-hover:translate-x-1 sm:block" />}
                {current && <span className="hidden w-4 shrink-0 sm:block" />}
              </>
            );

            return (
              <li key={item.slug}>
                {current ? (
                  <div className="flex items-center gap-3 rounded-[20px] bg-[#071f50] px-3.5 py-3.5 text-white sm:gap-5 sm:px-5" aria-current="true">
                    {body}
                  </div>
                ) : (
                  <Link to={item.path} className="group flex items-center gap-3 rounded-[20px] bg-[#fff7ed] px-3.5 py-3.5 transition hover:bg-[#ffe9d6] sm:gap-5 sm:px-5">
                    {body}
                  </Link>
                )}
              </li>
            );
          })}
        </ol>

        <p className="mt-5 text-sm font-bold text-white/85">
          Per month, for rent, food, transport and everyday costs. Tuition is separate.{" "}
          <Link to={`/countries/${country.slug}#cities`} className="font-black text-white underline underline-offset-4 hover:text-[#071f50]">
            Not sure which city? Pick by what you want to study
          </Link>
        </p>
      </div>
    </section>
  );
}

export default CityCompare;
