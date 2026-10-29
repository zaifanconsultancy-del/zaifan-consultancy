import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Coins, Wallet } from "lucide-react";

import { BUDGET_LABELS, LIFESTYLES } from "../destinations/destinationUtils";
import StepIntro from "./StepIntro";
import { money, moneyRange } from "./guideSteps";

const LIFESTYLE_NOTES = {
  saver: "Shared room, cook at home",
  balanced: "Shared flat, eat out now and then",
  comfort: "Own room, more travel and eating out",
};

const monthlyTotal = (budget, factor) =>
  Object.values(budget).reduce((sum, [low, high]) => sum + low + (high - low) * factor, 0);

function Choice({ number, title, children }) {
  return (
    <fieldset>
      <legend className="flex items-center gap-2 text-sm font-black">
        <span className="grid h-6 w-6 place-items-center rounded-full bg-[#071f50] font-mono text-[11px] text-white">{number}</span>
        {title}
      </legend>
      <div className="mt-3">{children}</div>
    </fieldset>
  );
}

/** A till receipt that adds up the choices, with a torn paper edge. */
function Receipt({ country, city, option, lifestyle }) {
  const symbol = country.currencySymbol || "€";
  const lines = Object.entries(city.budget).map(([key, [low, high]]) => ({
    key,
    label: BUDGET_LABELS[key] || key,
    value: low + (high - low) * lifestyle.factor,
  }));
  const perMonth = monthlyTotal(city.budget, lifestyle.factor);
  const today = new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });

  return (
    <div className="lg:sticky lg:top-28">
      <motion.div
        initial={{ rotate: 0 }}
        whileInView={{ rotate: 1.2 }}
        viewport={{ once: true }}
        className="relative mx-auto max-w-[420px] drop-shadow-[0_24px_40px_rgba(7,31,80,0.16)]"
      >
        <div className="rounded-t-[6px] bg-white px-6 pb-4 pt-6 font-mono text-[#071f50]">
          <div className="text-center">
            <p className="text-xs font-black uppercase tracking-[0.3em]">Zaifan · Cost check</p>
            <p className="mt-1 text-[11px] font-bold text-[#7a879c]">
              {city.name}, {country.name} · {today}
            </p>
          </div>

          <div className="my-4 border-t-2 border-dashed border-[#071f50]/15" />
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#7a879c]">Every month · {lifestyle.label.toLowerCase()}</p>
          <ul className="mt-2 grid gap-1.5 text-sm">
            {lines.map((line) => (
              <li key={line.key} className="flex justify-between gap-3">
                <span className="font-bold">{line.label}</span>
                <AnimatePresence mode="popLayout" initial={false}>
                  <motion.span key={Math.round(line.value)} initial={{ y: -8, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="font-black">
                    {money(symbol, line.value)}
                  </motion.span>
                </AnimatePresence>
              </li>
            ))}
          </ul>
          <div className="mt-3 flex justify-between border-t border-[#071f50]/15 pt-3 text-base font-black">
            <span>Per month</span>
            <span className="text-[#ff4b12]">{money(symbol, perMonth)}</span>
          </div>

          <div className="my-4 border-t-2 border-dashed border-[#071f50]/15" />
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#7a879c]">First year</p>
          <ul className="mt-2 grid gap-1.5 text-sm">
            <li className="flex justify-between gap-3">
              <span className="font-bold">Living × 12 months</span>
              <span className="font-black">{money(symbol, perMonth * 12)}</span>
            </li>
            <li className="flex justify-between gap-3">
              <span className="font-bold">Tuition ({option.label.toLowerCase()})</span>
              <span className="text-right font-black">{moneyRange(symbol, option.min, option.max)}</span>
            </li>
          </ul>

          <div className="mt-4 rounded-xl bg-[#071f50] px-4 py-3 text-white">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/60">Total for year one</p>
            <p className="mt-1 text-2xl font-black tracking-[-0.03em]">{moneyRange(symbol, perMonth * 12 + option.min, perMonth * 12 + option.max)}</p>
          </div>
          <p className="mt-3 text-[11px] font-semibold leading-5 text-[#7a879c]">
            Flights, visa fees and your first rent deposit come on top. Estimates only; we confirm real figures with you.
          </p>

          {/* Barcode */}
          <div aria-hidden="true" className="mx-auto mt-4 h-10 w-48 bg-[repeating-linear-gradient(90deg,#071f50_0_2px,transparent_2px_4px,#071f50_4px_5px,transparent_5px_8px,#071f50_8px_11px,transparent_11px_13px)]" />
        </div>
        <div
          aria-hidden="true"
          className="h-4"
          style={{
            background: "linear-gradient(135deg, #fff 50%, transparent 50%) 0 0 / 16px 16px, linear-gradient(225deg, #fff 50%, transparent 50%) 0 0 / 16px 16px",
          }}
        />
      </motion.div>
    </div>
  );
}

function FactTable({ icon: Icon, title, rows }) {
  return (
    <div className="rounded-[24px] bg-white p-5 ring-1 ring-orange-100 md:p-6">
      <h3 className="flex items-center gap-2 text-lg font-black tracking-[-0.02em]">
        <Icon size={18} className="text-[#ff4b12]" /> {title}
      </h3>
      <dl className="mt-3 divide-y divide-orange-100">
        {rows.map((row) => (
          <div key={row.label} className="flex flex-col gap-1 py-3 sm:flex-row sm:items-start sm:justify-between sm:gap-5">
            <dt>
              <span className="block text-sm font-black">{row.label}</span>
              <span className="mt-0.5 block text-xs font-semibold leading-5 text-[#7a879c]">{row.note}</span>
            </dt>
            <dd className="shrink-0 text-sm font-black text-[#ff4b12] sm:text-right">{row.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

/** Step 2: pick a university type, city and lifestyle; the receipt adds it up. */
function MoneyReceipt({ country }) {
  const cities = useMemo(() => country.cities.filter((city) => city.budget), [country.cities]);
  const byPrice = useMemo(() => [...cities].sort((a, b) => monthlyTotal(a.budget, 0) - monthlyTotal(b.budget, 0)), [cities]);
  const options = country.tuitionOptions || [];
  const symbol = country.currencySymbol || "€";

  const [optionId, setOptionId] = useState(options[0]?.id);
  const [citySlug, setCitySlug] = useState(cities[0]?.slug);
  const [lifestyleId, setLifestyleId] = useState("balanced");

  const option = options.find((item) => item.id === optionId) || options[0];
  const city = cities.find((item) => item.slug === citySlug) || cities[0];
  const lifestyle = LIFESTYLES.find((item) => item.id === lifestyleId) || LIFESTYLES[1];

  return (
    <section id="budget" className="scroll-mt-20 bg-[#fff7ed] px-4 pb-20 pt-10 text-[#071f50] sm:px-5 md:pb-28 md:pt-14">
      <div className="mx-auto max-w-[1350px]">
        <StepIntro
          step={2}
          title={`What will ${country.name}`}
          accent="cost you?"
          howTo="Make three choices on the left. The receipt on the right adds up your month and your first year."
        />

        {option && city ? (
          <div className="mt-12 grid gap-8 lg:grid-cols-[1fr_420px] lg:gap-12">
            <div className="grid content-start gap-7 rounded-[28px] bg-white p-5 shadow-[0_20px_50px_rgba(7,31,80,0.07)] ring-1 ring-orange-100 sm:p-7">
              <Choice number={1} title="Where will you study?">
                <div className="grid gap-2 sm:grid-cols-2">
                  {options.map((item) => {
                    const active = item.id === option.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setOptionId(item.id)}
                        aria-pressed={active}
                        className={`rounded-2xl p-3.5 text-left ring-2 transition ${active ? "bg-[#fff1ea] ring-[#ff4b12]" : "bg-[#fffaf5] ring-transparent hover:ring-orange-200"}`}
                      >
                        <span className="block text-sm font-black">{item.label}</span>
                        <span className="mt-0.5 block font-mono text-xs font-black text-[#ff4b12]">{moneyRange(symbol, item.min, item.max)} / year</span>
                        <span className="mt-1 block text-xs font-semibold text-[#7a879c]">{item.note}</span>
                      </button>
                    );
                  })}
                </div>
              </Choice>

              <Choice number={2} title="Which city? (cheapest first)">
                <div className="flex flex-wrap gap-2">
                  {byPrice.map((item) => {
                    const active = item.slug === city.slug;
                    return (
                      <button
                        key={item.slug}
                        type="button"
                        onClick={() => setCitySlug(item.slug)}
                        aria-pressed={active}
                        className={`rounded-full px-3.5 py-2 text-xs font-black ring-1 transition ${
                          active ? "bg-[#071f50] text-white ring-[#071f50]" : "bg-white text-[#071f50] ring-orange-100 hover:ring-[#ff4b12]"
                        }`}
                      >
                        {item.name}
                        <span className={`ml-1.5 font-mono ${active ? "text-[#ffb36d]" : "text-[#9aa5b8]"}`}>from {money(symbol, monthlyTotal(item.budget, 0))}</span>
                      </button>
                    );
                  })}
                </div>
              </Choice>

              <Choice number={3} title="How do you like to live?">
                <div className="grid grid-cols-3 gap-2">
                  {LIFESTYLES.map((item) => {
                    const active = item.id === lifestyle.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setLifestyleId(item.id)}
                        aria-pressed={active}
                        className={`rounded-2xl p-3 text-left ring-2 transition ${active ? "bg-[#fff1ea] ring-[#ff4b12]" : "bg-[#fffaf5] ring-transparent hover:ring-orange-200"}`}
                      >
                        <span className="block text-sm font-black">{item.label}</span>
                        <span className="mt-0.5 block text-[11px] font-semibold leading-4 text-[#7a879c]">{LIFESTYLE_NOTES[item.id]}</span>
                      </button>
                    );
                  })}
                </div>
              </Choice>

              {country.quickFacts.livingNote && (
                <p className="rounded-2xl bg-[#071f50] px-4 py-3 text-sm font-semibold leading-6 text-white/85">
                  <span className="font-black text-[#ffb36d]">Good to know: </span>
                  {country.quickFacts.livingNote}
                </p>
              )}
            </div>

            <Receipt country={country} city={city} option={option} lifestyle={lifestyle} />
          </div>
        ) : null}

        <h3 className="mt-16 text-2xl font-black tracking-[-0.04em] md:text-3xl">The official numbers behind it</h3>
        <p className="mt-1 text-sm font-semibold text-[#5f6f89]">{country.quickFacts.tuitionNote}</p>
        <div className="mt-5 grid gap-5 lg:grid-cols-2">
          <FactTable icon={Wallet} title="Tuition" rows={country.costs.tuition} />
          <FactTable icon={Coins} title="Living & visa money" rows={country.costs.living} />
        </div>
      </div>
    </section>
  );
}

export default MoneyReceipt;
