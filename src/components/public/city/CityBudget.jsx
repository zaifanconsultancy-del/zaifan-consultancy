import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Bus, Home, Lightbulb, ShoppingBasket, Wallet } from "lucide-react";

import StepIntro from "../guide/StepIntro";
import { money, moneyRange } from "../guide/guideSteps";
import { BUDGET_LABELS } from "../destinations/destinationUtils";
import { CITY_STEPS } from "../../../data/countries/cityGuides";

// How you plan to live: 0 = the low end of every range, 1 = the high end.
const STYLES = [
  { id: "careful", label: "Careful", hint: "Shared room, cooking at home", factor: 0 },
  { id: "typical", label: "Typical", hint: "What most students spend", factor: 0.5 },
  { id: "comfortable", label: "Comfortable", hint: "Own room, eating out more", factor: 1 },
];

const LINE_ICONS = { rent: Home, food: ShoppingBasket, transport: Bus, other: Wallet };
const ORDER = ["rent", "food", "transport", "other"];

/** Step 2: a till receipt for one month, that changes with how you plan to live. */
function CityBudget({ city, country }) {
  const [styleId, setStyleId] = useState("typical");
  const style = STYLES.find((item) => item.id === styleId);
  const symbol = country.currencySymbol || "";
  const budget = city.budget;

  const lines = budget
    ? ORDER.filter((key) => budget[key]).map((key) => {
        const [low, high] = budget[key];
        return { key, label: BUDGET_LABELS[key] || key, low, high, value: low + (high - low) * style.factor };
      })
    : [];
  const month = lines.reduce((sum, line) => sum + line.value, 0);
  const today = new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });

  return (
    <section id="budget" className="scroll-mt-20 bg-[#fff7ed] px-4 pb-20 pt-10 text-[#071f50] sm:px-5 md:pb-28 md:pt-14">
      <div className="mx-auto max-w-[1350px]">
        <StepIntro
          step={2}
          steps={CITY_STEPS}
          title="What one month"
          accent={`costs in ${city.name}.`}
          text="Rent, food, transport and everyday costs. Tuition fees are separate and depend on your university."
          howTo={budget ? "Pick how you plan to live. The receipt adds up your month and your year." : undefined}
        />

        <div className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,440px)_1fr] lg:gap-14">
          {budget ? (
            <div>
              <div className="grid grid-cols-3 gap-1.5 rounded-[22px] bg-white p-1.5 ring-1 ring-orange-100" role="group" aria-label="How you plan to live">
                {STYLES.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setStyleId(item.id)}
                    aria-pressed={item.id === styleId}
                    className={`rounded-2xl px-2 py-3 text-sm font-black transition ${
                      item.id === styleId ? "bg-[#071f50] text-white" : "text-[#071f50] hover:bg-[#fff1ea]"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
              <p className="mt-2 px-1 text-xs font-bold text-[#7a879c]">{style.hint}</p>

              {/* The receipt */}
              <div className="relative mt-4 bg-white px-5 pb-8 pt-6 font-mono shadow-[0_24px_60px_rgba(7,31,80,0.12)] sm:px-7">
                <p className="text-center text-[11px] font-black uppercase tracking-[0.2em] text-[#7a879c]">Zaifan budget desk</p>
                <p className="mt-1 text-center text-lg font-black uppercase tracking-[0.06em]">One month in {city.name}</p>
                <p className="mt-1 text-center text-[11px] font-bold text-[#9aa5b8]">{today} · {style.label} student</p>

                <div className="my-4 border-t-2 border-dashed border-[#071f50]/15" />

                <ul className="grid gap-3.5">
                  {lines.map((line) => {
                    const Icon = LINE_ICONS[line.key] || Wallet;
                    return (
                      <li key={line.key} className="flex items-start justify-between gap-3">
                        <span className="flex min-w-0 items-start gap-2.5">
                          <Icon size={16} className="mt-0.5 shrink-0 text-[#ff4b12]" />
                          <span className="min-w-0">
                            <span className="block text-sm font-black">{line.label}</span>
                            <span className="block text-[11px] font-bold text-[#9aa5b8]">usually {moneyRange(symbol, line.low, line.high)}</span>
                          </span>
                        </span>
                        <span className="shrink-0 text-base font-black tabular-nums">{money(symbol, line.value)}</span>
                      </li>
                    );
                  })}
                </ul>

                <div className="my-4 border-t-2 border-dashed border-[#071f50]/15" />

                <p className="flex items-end justify-between gap-3">
                  <span className="text-sm font-black uppercase tracking-[0.08em]">Each month</span>
                  <span className="text-3xl font-black tabular-nums tracking-[-0.03em] text-[#ff4b12]">{money(symbol, month)}</span>
                </p>
                <p className="mt-2 flex items-end justify-between gap-3 text-[#5f6f89]">
                  <span className="text-xs font-black uppercase tracking-[0.08em]">A full year (12 months)</span>
                  <span className="text-base font-black tabular-nums">{money(symbol, month * 12)}</span>
                </p>
                <p className="mt-4 text-center text-[11px] font-bold leading-5 text-[#9aa5b8]">
                  Estimates for planning, not a quote.
                  <br />
                  Tuition fees are not included.
                </p>

                {/* Torn bottom edge */}
                <div
                  aria-hidden="true"
                  className="absolute inset-x-0 -bottom-[9px] h-[10px] bg-[linear-gradient(135deg,#fff_5px,transparent_0),linear-gradient(-135deg,#fff_5px,transparent_0)] bg-[length:14px_10px] bg-repeat-x"
                />
              </div>
            </div>
          ) : (
            <div className="rounded-[26px] bg-white p-6 ring-1 ring-orange-100">
              <p className="font-mono text-[11px] font-black uppercase tracking-[0.14em] text-[#ff4b12]">Cost level</p>
              <p className="mt-2 text-3xl font-black tracking-[-0.04em]">{city.livingCost}</p>
              <p className="mt-2 text-sm font-semibold leading-6 text-[#5f6f89]">We build an exact monthly budget for {city.name} with you on a free call.</p>
            </div>
          )}

          <div>
            {city.costCards.length > 0 && (
              <>
                <p className="flex items-center gap-2 font-mono text-[11px] font-black uppercase tracking-[0.16em] text-[#ff4b12]">
                  <Lightbulb size={14} /> Good to know about prices in {city.name}
                </p>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {city.costCards.map((card) => (
                    <div key={card.label} className="rounded-[22px] bg-white p-5 ring-1 ring-orange-100">
                      <p className="font-mono text-[10px] font-black uppercase tracking-[0.14em] text-[#7a879c]">{card.label}</p>
                      <p className="mt-1.5 text-xl font-black tracking-[-0.03em]">{card.value}</p>
                      <p className="mt-2 text-sm font-semibold leading-6 text-[#5f6f89]">{card.text}</p>
                    </div>
                  ))}
                </div>
              </>
            )}

            <div className="mt-5 flex flex-col items-start justify-between gap-4 rounded-[22px] bg-[#071f50] p-5 text-white sm:flex-row sm:items-center">
              <p className="text-sm font-bold leading-6 text-white/85">
                Tuition, the bank balance the embassy asks for and one-time costs are on the {country.name} guide.
              </p>
              <Link
                to={`/countries/${country.slug}#budget`}
                className="inline-flex shrink-0 items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-black text-[#071f50] transition hover:bg-[#ffb36d]"
              >
                See the full money picture <ArrowRight size={16} strokeWidth={3} />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default CityBudget;
