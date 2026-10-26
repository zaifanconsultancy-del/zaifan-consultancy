import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  ArrowUpRight,
  Calculator,
  CircleCheck,
  CircleX,
  Clock3,
  FileCheck2,
  GraduationCap,
  Languages,
  MapPin,
  Target,
} from "lucide-react";

import { SectionHeader } from "./DestinationUI";
import { fadeUp, getUniversityPath, iconFor } from "./destinationUtils";

// Italy-depth sections for the shared country guide. Each renders nothing if
// the country has no data for it, so countries can be deepened one by one.

function formatMoney(symbol, value) {
  return `${symbol}${Math.round(value).toLocaleString("en-US")}`;
}

/* -------------------------------------------------------------------------- */
/* Is it right for you?                                                       */
/* -------------------------------------------------------------------------- */

export function FitCheck({ country }) {
  if (!country.decision) return null;

  return (
    <section id="fit" className="px-4 py-10 sm:px-5 md:py-16">
      <div className="mx-auto max-w-[1350px]">
        <SectionHeader
          eyebrow="Fit check"
          title={`Is ${country.name} right for you?`}
          text="Be honest with this list. The right country is the one that matches your profile, budget and patience for paperwork, not the most popular one."
        />
        <div className="mt-10 grid gap-5 lg:grid-cols-2">
          {[
            { title: `Choose ${country.name} if…`, items: country.decision.choose, good: true },
            { title: "Think twice if…", items: country.decision.avoid, good: false },
          ].map((column) => (
            <div
              key={column.title}
              className={`rounded-[30px] p-6 shadow-[0_20px_55px_rgba(9,31,80,0.07)] ring-1 md:p-8 ${
                column.good ? "bg-white ring-emerald-100" : "bg-[#071f50] text-white ring-[#071f50]"
              }`}
            >
              <h3 className="text-2xl font-black tracking-[-0.04em]">{column.title}</h3>
              <ul className="mt-5 space-y-3">
                {column.items.map((item) => (
                  <li key={item} className={`flex gap-3 text-sm font-semibold leading-6 ${column.good ? "text-[#526178]" : "text-white/80"}`}>
                    {column.good ? (
                      <CircleCheck size={19} className="mt-0.5 shrink-0 text-emerald-500" />
                    ) : (
                      <CircleX size={19} className="mt-0.5 shrink-0 text-[#ff7b1c]" />
                    )}
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* Budget planner                                                             */
/* -------------------------------------------------------------------------- */

const LIFESTYLES = [
  { id: "saver", label: "Saver", factor: 0 },
  { id: "balanced", label: "Balanced", factor: 0.5 },
  { id: "comfort", label: "Comfort", factor: 1 },
];

const BUDGET_LABELS = {
  rent: "Rent",
  food: "Food & groceries",
  transport: "Transport",
  other: "Insurance, phone & personal",
};

export function BudgetPlanner({ country }) {
  const cities = useMemo(() => country.cities.filter((city) => city.budget), [country]);
  const options = country.tuitionOptions || [];
  const [citySlug, setCitySlug] = useState(cities[0]?.slug);
  const [tuitionId, setTuitionId] = useState(options[0]?.id);
  const [lifestyle, setLifestyle] = useState("balanced");

  if (!cities.length || !options.length) return null;

  const symbol = country.currencySymbol || "";
  const city = cities.find((item) => item.slug === citySlug) || cities[0];
  const tuition = options.find((item) => item.id === tuitionId) || options[0];
  const factor = LIFESTYLES.find((item) => item.id === lifestyle)?.factor ?? 0.5;

  const lines = Object.entries(city.budget).map(([key, [low, high]]) => ({
    key,
    label: BUDGET_LABELS[key] || key,
    value: low + (high - low) * factor,
  }));
  const monthly = lines.reduce((sum, line) => sum + line.value, 0);
  const tuitionYear = tuition.min + (tuition.max - tuition.min) * factor;
  const firstYear = monthly * 12 + tuitionYear;
  const largest = Math.max(...lines.map((line) => line.value), 1);

  return (
    <section id="budget" className="px-4 py-10 sm:px-5 md:py-16">
      <div className="mx-auto max-w-[1350px]">
        <SectionHeader
          eyebrow="Budget planner"
          title="What will your first year cost?"
          text="Pick a city, a fee type and a lifestyle. Numbers are realistic estimates, not quotes. We refine them with you in a consultation."
        />

        <div className="mt-10 grid gap-6 lg:grid-cols-[1fr_1.05fr]">
          <div className="rounded-[30px] bg-white p-6 shadow-[0_20px_55px_rgba(9,31,80,0.07)] ring-1 ring-orange-100 md:p-8">
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#ff4b12]">1. City</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {cities.map((item) => (
                <button
                  key={item.slug}
                  type="button"
                  onClick={() => setCitySlug(item.slug)}
                  className={`rounded-full px-4 py-2 text-xs font-black ring-1 transition ${
                    item.slug === city.slug ? "bg-[#071f50] text-white ring-[#071f50]" : "bg-[#fff7ed] ring-orange-100 hover:text-[#ff4b12]"
                  }`}
                >
                  {item.name}
                </button>
              ))}
            </div>

            <p className="mt-7 text-[10px] font-black uppercase tracking-[0.16em] text-[#ff4b12]">2. Tuition type</p>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {options.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setTuitionId(item.id)}
                  className={`rounded-2xl px-4 py-3 text-left ring-1 transition ${
                    item.id === tuition.id ? "bg-[#ff4b12] text-white ring-[#ff4b12]" : "bg-[#fff7ed] ring-orange-100 hover:ring-orange-300"
                  }`}
                >
                  <span className="block text-sm font-black">{item.label}</span>
                  <span className={`block text-[11px] font-bold ${item.id === tuition.id ? "text-white/80" : "text-[#7a879c]"}`}>{item.note}</span>
                </button>
              ))}
            </div>

            <p className="mt-7 text-[10px] font-black uppercase tracking-[0.16em] text-[#ff4b12]">3. Lifestyle</p>
            <div className="mt-3 grid grid-cols-3 gap-1 rounded-full bg-[#fff7ed] p-1 ring-1 ring-orange-100">
              {LIFESTYLES.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setLifestyle(item.id)}
                  className={`relative rounded-full py-2.5 text-xs font-black transition ${lifestyle === item.id ? "text-white" : "text-[#071f50]"}`}
                >
                  {lifestyle === item.id && (
                    <motion.span layoutId={`lifestyle-${country.slug}`} className="absolute inset-0 rounded-full bg-[#071f50]" />
                  )}
                  <span className="relative">{item.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="relative overflow-hidden rounded-[30px] bg-[#071f50] p-6 text-white shadow-[0_26px_70px_rgba(7,31,80,0.22)] md:p-8">
            <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full border-[34px] border-[#ff4b12]/15" />
            <div className="relative flex items-center gap-3">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-white/10 text-[#ffb36d]">
                <Calculator size={22} />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#ffb36d]">Estimate for {city.name}</p>
                <p className="text-sm font-semibold text-white/70">{tuition.label} · {LIFESTYLES.find((item) => item.id === lifestyle)?.label}</p>
              </div>
            </div>

            <div className="relative mt-6 grid grid-cols-3 gap-3">
              {[
                ["Per month", monthly],
                ["Living / year", monthly * 12],
                ["Tuition / year", tuitionYear],
              ].map(([label, value]) => (
                <div key={label} className="rounded-[20px] bg-white/[0.07] p-3 ring-1 ring-white/10">
                  <p className="text-[9px] font-black uppercase tracking-[0.14em] text-white/55">{label}</p>
                  <motion.p key={value} initial={{ opacity: 0.4, y: 6 }} animate={{ opacity: 1, y: 0 }} className="mt-1 text-lg font-black tracking-[-0.03em] sm:text-2xl">
                    {formatMoney(symbol, value)}
                  </motion.p>
                </div>
              ))}
            </div>

            <div className="relative mt-5 space-y-3">
              {lines.map((line) => (
                <div key={line.key}>
                  <div className="flex justify-between text-xs font-bold text-white/75">
                    <span>{line.label}</span>
                    <span>{formatMoney(symbol, line.value)}</span>
                  </div>
                  <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-white/10">
                    <motion.div
                      className="h-full rounded-full bg-gradient-to-r from-[#ff7b1c] to-[#ff4b12]"
                      animate={{ width: `${(line.value / largest) * 100}%` }}
                      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="relative mt-6 flex items-end justify-between gap-4 rounded-[22px] bg-gradient-to-r from-[#ff7b1c] to-[#ff4b12] p-5">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-white/80">First-year total</p>
                <motion.p key={firstYear} initial={{ scale: 0.96 }} animate={{ scale: 1 }} className="text-3xl font-black tracking-[-0.04em] md:text-4xl">
                  {formatMoney(symbol, firstYear)}
                </motion.p>
              </div>
              <p className="max-w-[150px] text-right text-[10px] font-bold leading-4 text-white/80">Excludes flights, visa fees and deposits</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* Application timeline + requirements                                        */
/* -------------------------------------------------------------------------- */

export function ApplicationTimeline({ country }) {
  if (!country.timeline) return null;

  return (
    <section id="timeline" className="bg-[#fff1ea] px-4 py-10 sm:px-5 md:py-20">
      <div className="mx-auto max-w-[1350px]">
        <SectionHeader eyebrow="Timeline" title="When to do what." text="Most students who miss an intake started too late. Work backwards from your intake date." />
        <div className="relative mt-12 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {country.timeline.map((step, index) => (
            <motion.div
              key={step.phase}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, amount: 0.3 }}
              variants={fadeUp}
              className="relative overflow-hidden rounded-[28px] bg-white p-6 shadow-[0_18px_50px_rgba(9,31,80,0.07)] ring-1 ring-orange-100"
            >
              <span className="absolute right-5 top-4 text-5xl font-black tracking-[-0.08em] text-orange-50">0{index + 1}</span>
              <p className="relative inline-flex items-center gap-1.5 rounded-full bg-[#fff1ea] px-3 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-[#ff4b12]">
                <Clock3 size={12} /> {step.timing}
              </p>
              <h3 className="relative mt-4 text-xl font-black tracking-[-0.035em]">{step.phase}</h3>
              <p className="relative mt-2 text-sm font-semibold leading-6 text-[#61708a]">{step.text}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function RequirementsBlock({ country }) {
  const requirements = country.requirements;
  if (!requirements) return null;

  return (
    <section id="requirements" className="px-4 py-10 sm:px-5 md:py-16">
      <div className="mx-auto max-w-[1350px]">
        <SectionHeader eyebrow="Requirements" title="What you need to apply." text="General rules for Pakistani applicants. Every programme page has the final word." />
        <div className="mt-10 grid gap-5 lg:grid-cols-3">
          {[
            { title: "Bachelor's applicants", icon: GraduationCap, items: requirements.bachelor },
            { title: "Master's applicants", icon: Target, items: requirements.master },
          ].map((block) => (
            <div key={block.title} className="rounded-[30px] bg-white p-6 shadow-[0_20px_55px_rgba(9,31,80,0.07)] ring-1 ring-orange-100">
              <div className="flex items-center gap-3">
                <div className="grid h-11 w-11 place-items-center rounded-2xl bg-[#fff1ea] text-[#ff4b12]">
                  <block.icon size={21} strokeWidth={2.6} />
                </div>
                <h3 className="text-xl font-black tracking-[-0.035em]">{block.title}</h3>
              </div>
              <ul className="mt-5 space-y-3">
                {block.items.map((item) => (
                  <li key={item} className="flex gap-2.5 text-sm font-semibold leading-6 text-[#526178]">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#ff4b12]" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div className="rounded-[30px] bg-[#071f50] p-6 text-white shadow-[0_20px_55px_rgba(7,31,80,0.18)]">
            <div className="flex items-center gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-2xl bg-white/10 text-[#ffb36d]">
                <Languages size={21} strokeWidth={2.6} />
              </div>
              <h3 className="text-xl font-black tracking-[-0.035em]">Language tests</h3>
            </div>
            <div className="mt-5 space-y-3">
              {requirements.language.map((item) => (
                <div key={item.test} className="rounded-2xl bg-white/[0.07] p-3 ring-1 ring-white/10">
                  <p className="text-sm font-black text-[#ffb36d]">{item.test}</p>
                  <p className="mt-0.5 text-xs font-semibold leading-5 text-white/75">{item.note}</p>
                </div>
              ))}
            </div>
            <p className="mt-5 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.14em] text-[#ffb36d]">
              <FileCheck2 size={14} /> Documents to prepare
            </p>
            <ul className="mt-2 space-y-1.5">
              {requirements.documents.map((doc) => (
                <li key={doc} className="text-xs font-semibold leading-5 text-white/80">• {doc}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* Pathways by goal                                                           */
/* -------------------------------------------------------------------------- */

export function PathwaysBlock({ country }) {
  if (!country.pathways) return null;

  const bySlug = Object.fromEntries(country.universities.map((university) => [university.slug, university]));

  return (
    <div className="mt-14">
      <h3 className="text-center text-2xl font-black tracking-[-0.04em] md:text-3xl">Routes by goal</h3>
      <p className="mx-auto mt-2 max-w-2xl text-center text-sm font-semibold text-[#61708a]">Not sure where to start? These are the universities students with each goal usually compare first.</p>
      <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {country.pathways.map((pathway) => {
          const Icon = iconFor(pathway.icon);
          return (
            <div key={pathway.title} className="rounded-[26px] bg-white p-5 shadow-[0_16px_45px_rgba(9,31,80,0.06)] ring-1 ring-orange-100">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-2xl bg-[#071f50] text-[#ffb36d]">
                  <Icon size={18} />
                </div>
                <p className="text-base font-black tracking-[-0.02em]">{pathway.title}</p>
              </div>
              <div className="mt-4 space-y-2">
                {pathway.slugs.map((slug) => bySlug[slug]).filter(Boolean).map((university) => (
                  <Link
                    key={university.slug}
                    to={getUniversityPath(country, university)}
                    className="group flex items-center justify-between gap-3 rounded-2xl bg-[#fff7ed] px-3 py-2.5 text-sm font-black ring-1 ring-orange-100 transition hover:bg-[#ff4b12] hover:text-white"
                  >
                    <span className="truncate">{university.name}</span>
                    <ArrowUpRight size={15} className="shrink-0 text-[#ff4b12] group-hover:text-white" />
                  </Link>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* City comparison + best city by goal                                        */
/* -------------------------------------------------------------------------- */

export function CityComparison({ country }) {
  const symbol = country.currencySymbol || "";
  const citiesWithBudget = country.cities.filter((city) => city.budget);
  if (!citiesWithBudget.length && !country.cityGoals) return null;

  const monthlyRange = (city) => {
    const values = Object.values(city.budget);
    const low = values.reduce((sum, [lowValue]) => sum + lowValue, 0);
    const high = values.reduce((sum, [, highValue]) => sum + highValue, 0);
    return `${formatMoney(symbol, low)} – ${formatMoney(symbol, high)}`;
  };

  const universityCount = (citySlug) => country.universities.filter((university) => university.citySlug === citySlug).length;

  return (
    <div className="mt-14 grid gap-6 xl:grid-cols-[1.25fr_1fr]">
      {citiesWithBudget.length > 0 && (
        <div className="overflow-hidden rounded-[30px] bg-white shadow-[0_20px_55px_rgba(9,31,80,0.07)] ring-1 ring-orange-100">
          <div className="bg-[#071f50] px-6 py-4 text-white">
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#ffb36d]">City comparison</p>
            <p className="text-lg font-black">Monthly cost, focus and universities</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead className="text-[10px] font-black uppercase tracking-[0.12em] text-[#7a879c]">
                <tr>
                  <th className="px-5 py-3">City</th>
                  <th className="px-5 py-3">Monthly living</th>
                  <th className="px-5 py-3">Best for</th>
                  <th className="px-5 py-3">Unis</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-orange-100">
                {citiesWithBudget.map((city) => (
                  <tr key={city.slug} className="transition hover:bg-[#fff7ed]">
                    <td className="px-5 py-3">
                      <Link to={`/countries/${country.slug}/${city.slug}`} className="font-black hover:text-[#ff4b12]">
                        {city.name}
                      </Link>
                    </td>
                    <td className="px-5 py-3 font-bold text-[#526178]">{monthlyRange(city)}</td>
                    <td className="px-5 py-3 font-semibold text-[#526178]">{city.bestFor.slice(0, 2).join(", ")}</td>
                    <td className="px-5 py-3 font-black text-[#ff4b12]">{universityCount(city.slug) || "–"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {country.cityGoals && (
        <div className="rounded-[30px] bg-[#fff1ea] p-6 ring-1 ring-orange-100 md:p-7">
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#ff4b12]">Best city for…</p>
          <div className="mt-4 space-y-2.5">
            {country.cityGoals.map((item) => {
              const city = country.cities.find((entry) => entry.slug === item.citySlug);
              if (!city) return null;
              return (
                <Link
                  key={item.goal}
                  to={`/countries/${country.slug}/${city.slug}`}
                  className="group flex items-start gap-3 rounded-2xl bg-white p-3.5 ring-1 ring-orange-100 transition hover:-translate-y-0.5 hover:shadow-md"
                >
                  <MapPin size={17} className="mt-0.5 shrink-0 text-[#ff4b12]" />
                  <span className="min-w-0">
                    <span className="block text-sm font-black">
                      {item.goal} <span className="text-[#ff4b12]">→ {city.name}</span>
                    </span>
                    <span className="block text-xs font-semibold leading-5 text-[#61708a]">{item.reason}</span>
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Student life + reality checks                                              */
/* -------------------------------------------------------------------------- */

export function StudentLifeBlock({ country }) {
  if (!country.studentLife) return null;

  return (
    <section id="life" className="px-4 py-10 sm:px-5 md:py-16">
      <div className="mx-auto max-w-[1350px]">
        <SectionHeader eyebrow="Student life" title={`Daily life in ${country.name}.`} text="Housing, food, work, weather and community: what your first months will really look like." />
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.15 }}
          transition={{ staggerChildren: 0.06 }}
          className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-3"
        >
          {country.studentLife.map((item) => {
            const Icon = iconFor(item.icon);
            return (
              <motion.div key={item.title} variants={fadeUp} className="rounded-[28px] bg-white p-6 shadow-[0_18px_50px_rgba(9,31,80,0.07)] ring-1 ring-orange-100">
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[#fff1ea] text-[#ff4b12]">
                  <Icon size={22} strokeWidth={2.6} />
                </div>
                <h3 className="mt-4 text-lg font-black tracking-[-0.03em]">{item.title}</h3>
                <p className="mt-2 text-sm font-semibold leading-6 text-[#61708a]">{item.text}</p>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}

export function RealityCheck({ country }) {
  if (!country.realityChecks) return null;

  return (
    <section id="reality" className="bg-[#071f50] px-4 py-12 text-white sm:px-5 md:py-20">
      <div className="mx-auto max-w-[1350px]">
        <SectionHeader tone="dark" eyebrow="Reality check" title="Expectation vs reality." text="The honest version, so nothing surprises you after you land." />
        <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {country.realityChecks.map((item) => (
            <div key={item.expectation} className="rounded-[26px] bg-white/[0.06] p-5 ring-1 ring-white/10">
              <p className="flex items-start gap-2 text-sm font-black text-white/60 line-through decoration-[#ff4b12]/70">
                <AlertTriangle size={16} className="mt-0.5 shrink-0 text-[#ff7b1c] no-underline" />
                “{item.expectation}”
              </p>
              <p className="mt-3 text-sm font-semibold leading-6 text-white/85">{item.reality}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
