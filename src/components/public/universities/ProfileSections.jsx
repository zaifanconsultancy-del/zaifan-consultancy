import { useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, ArrowRight, Check, FileCheck2, Globe2, Languages, Minus, Plus } from "lucide-react";

import { SUBJECTS, formatStudents } from "../../../data/universities";
import UniCard from "./UniCard";
import { money } from "./profileData";

// tone: "cream" (default), "navy" or "orange".
function Heading({ eyebrow, title, accent, text, tone = "cream" }) {
  const eyebrowTone = { cream: "text-[#ff4b12]", navy: "text-[#ffb36d]", orange: "text-[#071f50]" }[tone];
  const accentTone = { cream: "text-[#ff4b12]", navy: "text-[#ffb36d]", orange: "text-[#071f50]" }[tone];
  const textTone = { cream: "text-[#5f6f89]", navy: "text-white/65", orange: "text-white/90" }[tone];
  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
      <div>
        <p className={`font-mono text-[11px] font-black uppercase tracking-[0.18em] ${eyebrowTone}`}>{eyebrow}</p>
        <h2 className="mt-3 text-4xl font-black leading-[0.95] tracking-[-0.055em] md:text-6xl">
          {title}
          {accent && <span className={`block ${accentTone}`}>{accent}</span>}
        </h2>
      </div>
      {text && <p className={`max-w-md text-sm font-semibold leading-6 md:text-base md:leading-7 ${textTone}`}>{text}</p>}
    </div>
  );
}

/* 1 · Overview (navy) */
export function OverviewSection({ university }) {
  const age = university.founded ? new Date().getFullYear() - university.founded : null;
  const stats = [
    university.founded && { value: university.founded, label: `Founded, ${age} years ago` },
    university.students && { value: formatStudents(university.students), label: "Students (rounded)" },
    { value: university.type, label: "Type of university" },
  ].filter(Boolean);

  return (
    <section id="overview" className="scroll-mt-20 bg-[#071f50] px-4 py-20 text-white sm:px-5 md:py-28">
      <div className="mx-auto max-w-[1350px]">
        <Heading tone="navy" eyebrow="The short version" title="What it's like," accent="in 30 seconds." />

        <div className="mt-10 grid gap-8 lg:grid-cols-[1.3fr_1fr]">
          <p className="text-xl font-bold leading-9 text-white/90 md:text-2xl md:leading-10">{university.about}</p>
          <dl className="grid grid-cols-3 gap-3 self-start">
            {stats.map((stat) => (
              <div key={stat.label} className="rounded-2xl bg-white/[0.06] p-4 ring-1 ring-white/10">
                <dd className="text-xl font-black tracking-[-0.03em] text-[#ffb36d] md:text-2xl">{stat.value}</dd>
                <dt className="mt-1 text-[11px] font-bold leading-4 text-white/60">{stat.label}</dt>
              </div>
            ))}
          </dl>
        </div>

        {university.highlights.length > 0 && (
          <ol className="mt-10 grid gap-4 md:grid-cols-3">
            {university.highlights.map((highlight, index) => (
              <motion.li
                key={highlight}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.4 }}
                transition={{ duration: 0.4, delay: index * 0.08 }}
                className="rounded-[22px] bg-[#fff7ed] p-6 text-[#071f50]"
              >
                <span className="font-mono text-4xl font-black text-[#ff4b12]">{String(index + 1).padStart(2, "0")}</span>
                <p className="mt-3 text-lg font-black leading-6 tracking-[-0.02em]">{highlight}</p>
              </motion.li>
            ))}
          </ol>
        )}
      </div>
    </section>
  );
}

/* 2 · Courses and fit check (cream) */
export function CoursesSection({ university, fit }) {
  const subjects = SUBJECTS.filter((subject) => university.subjects.includes(subject.id));

  return (
    <section id="courses" className="scroll-mt-20 bg-[#fff7ed] px-4 py-20 text-[#071f50] sm:px-5 md:py-28">
      <div className="mx-auto max-w-[1350px]">
        <Heading eyebrow="Courses & fit" title="What you can study," accent="and is it for you?" text="These are the subjects it's strongest in. Each programme has its own entry rules, so we check the exact one you want." />

        <div className="mt-10 grid gap-5 lg:grid-cols-[1.3fr_1fr]">
          <div className="rounded-[26px] bg-white p-6 shadow-[0_16px_40px_rgba(7,31,80,0.06)] ring-1 ring-orange-100 md:p-8">
            <p className="text-xs font-black uppercase tracking-[0.14em] text-[#7a879c]">Strongest subjects</p>
            <div className="mt-4 flex flex-wrap gap-2.5">
              {university.programs.map((program, index) => (
                <motion.span
                  key={program}
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.05 }}
                  className={`rounded-full px-4 py-2.5 text-base font-black ${index % 3 === 0 ? "bg-[#ff4b12] text-white" : index % 3 === 1 ? "bg-[#071f50] text-white" : "bg-[#fff1ea]"}`}
                >
                  {program}
                </motion.span>
              ))}
            </div>
            {subjects.length > 0 && (
              <p className="mt-6 text-sm font-semibold leading-6 text-[#5f6f89]">
                In our finder it shows up under: <span className="font-black text-[#071f50]">{subjects.map((subject) => subject.label).join(" · ")}</span>
              </p>
            )}
          </div>

          <div className="flex flex-col rounded-[26px] bg-[#071f50] p-6 text-white md:p-8">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#ff4b12]">
              <Languages size={22} />
            </span>
            <p className="mt-5 text-xs font-black uppercase tracking-[0.14em] text-[#ffb36d]">Taught in English?</p>
            <p className="mt-2 text-2xl font-black leading-8 tracking-[-0.03em]">{university.english || "Some programmes"}</p>
            <div className="mt-auto pt-6">
              <div className="flex gap-1.5" aria-hidden="true">
                {[0, 1, 2, 3].map((bar) => (
                  <span key={bar} className={`h-2 flex-1 rounded-full ${bar < (university.englishLevel === "most" ? 4 : 2) ? "bg-[#ffb36d]" : "bg-white/15"}`} />
                ))}
              </div>
              <p className="mt-2 text-xs font-bold text-white/60">{university.englishLevel === "most" ? "Most programmes are in English" : "Some programmes are in English; others need the local language"}</p>
            </div>
          </div>
        </div>

        <div className="mt-5 grid gap-5 md:grid-cols-2">
          <div className="rounded-[26px] bg-white p-6 ring-1 ring-orange-100 md:p-8">
            <h3 className="text-2xl font-black tracking-[-0.04em]">A good fit if…</h3>
            <ul className="mt-5 space-y-3">
              {fit.good.map((item) => (
                <li key={item} className="flex gap-3 text-[15px] font-bold leading-6">
                  <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-emerald-500 text-white">
                    <Check size={14} strokeWidth={3.5} />
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-[26px] bg-white p-6 ring-1 ring-orange-100 md:p-8">
            <h3 className="text-2xl font-black tracking-[-0.04em]">Think twice if…</h3>
            <ul className="mt-5 space-y-3">
              {fit.caution.map((item) => (
                <li key={item} className="flex gap-3 text-[15px] font-bold leading-6">
                  <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-amber-400 text-[#071f50]">
                    <AlertTriangle size={13} strokeWidth={3} />
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

/* 3 · Money: a receipt for the first year, plus scholarships (orange) */
export function MoneySection({ university, context, city }) {
  const symbol = context.currencySymbol || "€";
  const lines = [
    { label: "Tuition", value: university.tuitionNote },
    city?.monthly && { label: `Living in ${city.name}`, value: `${money(city.monthly[0], symbol)} – ${money(city.monthly[1], symbol)} / month` },
    city?.monthly && { label: "Living for 12 months", value: `${money(city.monthly[0] * 12, symbol)} – ${money(city.monthly[1] * 12, symbol)}` },
    !city?.monthly && context.quickFacts?.living && { label: `Living in ${context.name}`, value: context.quickFacts.living },
    context.quickFacts?.livingNote && { label: "Good to know", value: context.quickFacts.livingNote },
  ].filter(Boolean);
  const scholarships = (context.scholarships || []).slice(0, 4);

  return (
    <section id="money" className="scroll-mt-20 bg-[#ff4b12] px-4 py-20 text-white sm:px-5 md:py-28">
      <div className="mx-auto max-w-[1350px]">
        <Heading eyebrow="Money" title="What it really costs," accent="and who can help pay." tone="orange" text="A first-year receipt for this university, then the scholarships Pakistani students here actually go for." />

        <div className="mt-10 grid items-start gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <motion.div
            initial={{ opacity: 0, y: 40, rotate: 0 }}
            whileInView={{ opacity: 1, y: 0, rotate: -1.5 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ type: "spring", stiffness: 90, damping: 15 }}
            className="bg-white px-6 pb-10 pt-7 font-mono text-[#071f50] shadow-[0_30px_70px_rgba(7,31,80,0.3)] [clip-path:polygon(0_0,100%_0,100%_calc(100%-12px),95%_100%,90%_calc(100%-12px),85%_100%,80%_calc(100%-12px),75%_100%,70%_calc(100%-12px),65%_100%,60%_calc(100%-12px),55%_100%,50%_calc(100%-12px),45%_100%,40%_calc(100%-12px),35%_100%,30%_calc(100%-12px),25%_100%,20%_calc(100%-12px),15%_100%,10%_calc(100%-12px),5%_100%,0_calc(100%-12px))]"
          >
            <p className="text-center text-xs font-black uppercase tracking-[0.3em]">First-year receipt</p>
            <p className="mt-1 text-center text-[11px] font-bold text-[#7a879c]">{university.name}</p>
            <div className="my-5 border-t-2 border-dashed border-[#071f50]/25" />
            <dl className="space-y-4">
              {lines.map((line) => (
                <div key={line.label}>
                  <dt className="text-[11px] font-black uppercase tracking-[0.12em] text-[#7a879c]">{line.label}</dt>
                  <dd className="mt-1 text-sm font-bold leading-6">{line.value}</dd>
                </div>
              ))}
            </dl>
            <div className="my-5 border-t-2 border-dashed border-[#071f50]/25" />
            <p className="text-[11px] font-bold leading-5 text-[#5f6f89]">
              Before scholarships. Rough figures, last checked {context.lastReviewed || "October 2026"}. Fees change every year, so we confirm the exact amount before you apply.
            </p>
          </motion.div>

          <div className="grid gap-4 sm:grid-cols-2">
            {scholarships.map((scholarship, index) => (
              <motion.article
                key={scholarship.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.4, delay: index * 0.07 }}
                className="flex flex-col rounded-[22px] bg-[#071f50] p-5"
              >
                <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#ffb36d]">{scholarship.level}</p>
                <h3 className="mt-2 text-lg font-black leading-6 tracking-[-0.02em]">{scholarship.name}</h3>
                <p className="mt-1 text-xs font-bold text-white/55">{scholarship.provider}</p>
                <p className="mt-3 text-sm font-semibold leading-6 text-white/80">
                  <span className="font-black text-white">Covers: </span>
                  {scholarship.covers}
                </p>
                {scholarship.note && <p className="mt-2 text-xs font-semibold leading-5 text-white/55">{scholarship.note}</p>}
              </motion.article>
            ))}
            {university.scholarshipNote && (
              <p className="rounded-[22px] bg-white/15 p-5 text-sm font-bold leading-6 sm:col-span-2">
                <span className="font-black">At {university.name}: </span>
                {university.scholarshipNote}
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

/* 4 · How to apply (cream) */
export function ApplySection({ university, context }) {
  const [level, setLevel] = useState("bachelor");
  const requirements = context.requirements || {};
  const intakeStart = (university.intake || context.quickFacts?.intakes || "").split(/[·/]/)[0].replace(/\s*\(main\)/i, "").trim();

  return (
    <section id="apply" className="scroll-mt-20 bg-[#fff7ed] px-4 py-20 text-[#071f50] sm:px-5 md:py-28">
      <div className="mx-auto max-w-[1350px]">
        <Heading eyebrow="How to apply" title="From Pakistan to" accent="your first lecture." text="The same steps every Pakistani student follows for this university. Zaifan does the forms and checks with you." />

        <div className="mt-10 grid gap-5 lg:grid-cols-[1fr_1.15fr]">
          <div className="rounded-[26px] bg-[#071f50] p-6 text-white md:p-8">
            <p className="text-xs font-black uppercase tracking-[0.14em] text-[#ffb36d]">You apply through</p>
            <p className="mt-2 text-3xl font-black leading-9 tracking-[-0.04em]">{university.applyVia}</p>
            <ol className="mt-7 space-y-4">
              {(context.admissionSteps || []).map((step, index) => (
                <li key={step.title} className="flex gap-4">
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#ff4b12] font-mono text-sm font-black">{index + 1}</span>
                  <span>
                    <span className="block font-black">{step.title}</span>
                    <span className="mt-0.5 block text-sm font-semibold leading-6 text-white/70">{step.text}</span>
                  </span>
                </li>
              ))}
            </ol>
          </div>

          <div className="rounded-[26px] bg-white p-6 ring-1 ring-orange-100 md:p-8">
            <p className="text-xs font-black uppercase tracking-[0.14em] text-[#7a879c]">When to do what</p>
            <p className="mt-1 text-sm font-semibold text-[#5f6f89]">
              Counted back from your course start{intakeStart ? <> in <span className="font-black text-[#071f50]">{intakeStart}</span></> : null}.
            </p>
            <ol className="relative mt-6 space-y-5 border-l-2 border-dashed border-orange-200 pl-6">
              {(context.timeline || []).map((item) => (
                <li key={item.phase} className="relative">
                  <span className="absolute -left-[33px] top-1 h-4 w-4 rounded-full border-4 border-white bg-[#ff4b12] shadow" aria-hidden="true" />
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-black">{item.phase}</span>
                    <span className="rounded-full bg-[#fff1ea] px-2.5 py-0.5 text-[11px] font-black text-[#ff4b12]">{item.timing}</span>
                  </div>
                  <p className="mt-1 text-sm font-semibold leading-6 text-[#5f6f89]">{item.text}</p>
                </li>
              ))}
            </ol>
          </div>
        </div>

        <div className="mt-5 grid gap-5 lg:grid-cols-[1.15fr_1fr]">
          <div className="rounded-[26px] bg-white p-6 ring-1 ring-orange-100 md:p-8">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="text-2xl font-black tracking-[-0.04em]">What you need to get in</h3>
              <div role="tablist" className="flex rounded-full bg-[#fff7ed] p-1 ring-1 ring-orange-100">
                {[
                  ["bachelor", "Bachelor's"],
                  ["master", "Master's"],
                ].map(([id, label]) => (
                  <button
                    key={id}
                    type="button"
                    role="tab"
                    aria-selected={level === id}
                    onClick={() => setLevel(id)}
                    className={`rounded-full px-4 py-2 text-xs font-black transition ${level === id ? "bg-[#071f50] text-white" : "hover:text-[#ff4b12]"}`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <ul className="mt-5 space-y-3">
              {(requirements[level] || []).map((item) => (
                <li key={item} className="flex gap-3 text-[15px] font-semibold leading-6">
                  <Check size={18} strokeWidth={3} className="mt-0.5 shrink-0 text-emerald-500" />
                  {item}
                </li>
              ))}
            </ul>
            {requirements.language?.length > 0 && (
              <div className="mt-6 grid gap-2 sm:grid-cols-3">
                {requirements.language.map((test) => (
                  <div key={test.test} className="rounded-2xl bg-[#fff7ed] p-3.5">
                    <p className="text-sm font-black">{test.test}</p>
                    <p className="mt-1 text-xs font-semibold leading-5 text-[#5f6f89]">{test.note}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-col rounded-[26px] border-2 border-dashed border-orange-200 p-6 md:p-8">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#ff4b12] text-white">
              <FileCheck2 size={22} />
            </span>
            <h3 className="mt-5 text-2xl font-black tracking-[-0.04em]">Your document list</h3>
            <ul className="mt-4 space-y-2">
              {(requirements.documents || []).slice(0, 6).map((item) => (
                <li key={item} className="flex gap-2 text-sm font-semibold leading-6 text-[#5f6f89]">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#ff4b12]" />
                  {item}
                </li>
              ))}
            </ul>
            <Link to="/countries#documents" className="mt-6 inline-flex items-center gap-2 self-start rounded-full bg-[#071f50] px-5 py-3 text-sm font-black text-white transition hover:bg-[#ff4b12]">
              Open the printable checklist <ArrowRight size={15} strokeWidth={3} />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

const BUDGET_LABELS = { rent: "Rent", food: "Food", transport: "Transport", other: "Phone, books & fun" };

/* 5 · The city (navy) */
export function CitySection({ university, context, city }) {
  const symbol = context.currencySymbol || "€";
  const maxHigh = city?.breakdown ? Math.max(...city.breakdown.map((row) => row.high)) : 0;

  return (
    <section id="city" className="scroll-mt-20 bg-[#071f50] px-4 py-20 text-white sm:px-5 md:py-28">
      <div className="mx-auto max-w-[1350px]">
        <Heading tone="navy" eyebrow="The city" title={`Life in ${university.city}.`} accent={city?.headline} text={city ? null : `We don't have a full ${university.city} guide yet, so here is the ${context.name} picture. Ask us about this city.`} />

        <div className="mt-10 grid gap-6 lg:grid-cols-[1.1fr_1fr]">
          <div>
            <p className="text-lg font-semibold leading-8 text-white/80">{city?.intro || context.intro || context.shortDescription}</p>
            {city?.life?.length > 0 && (
              <div className="mt-6 flex flex-wrap gap-2">
                {city.life.map((item) => (
                  <span key={item} className="rounded-full bg-white/[0.08] px-3.5 py-2 text-sm font-bold ring-1 ring-white/10">
                    {item}
                  </span>
                ))}
              </div>
            )}
            <Link
              to={city?.path || `/countries/${context.slug}`}
              className="mt-8 inline-flex items-center gap-2 rounded-full bg-[#ff4b12] px-6 py-3.5 text-sm font-black text-white transition hover:bg-white hover:text-[#071f50]"
            >
              {city ? `Read the full ${city.name} guide` : `Read the ${context.name} guide`} <ArrowRight size={16} strokeWidth={3} />
            </Link>
          </div>

          <div className="rounded-[26px] bg-[#fff7ed] p-6 text-[#071f50] md:p-8">
            <p className="text-xs font-black uppercase tracking-[0.14em] text-[#7a879c]">A student month, roughly</p>
            {city?.monthly ? (
              <p className="mt-2 text-4xl font-black tracking-[-0.05em]">
                {money(city.monthly[0], symbol)} – {money(city.monthly[1], symbol)}
              </p>
            ) : (
              <p className="mt-2 text-3xl font-black tracking-[-0.04em]">{context.quickFacts?.living}</p>
            )}
            {city?.breakdown ? (
              <ul className="mt-6 space-y-4">
                {city.breakdown.map((row) => (
                  <li key={row.key}>
                    <div className="flex justify-between text-sm font-black">
                      <span>{BUDGET_LABELS[row.key] || row.key}</span>
                      <span>
                        {money(row.low, symbol)} – {money(row.high, symbol)}
                      </span>
                    </div>
                    <div className="relative mt-2 h-2.5 overflow-hidden rounded-full bg-[#071f50]/10">
                      <motion.span
                        initial={{ width: 0 }}
                        whileInView={{ width: `${(row.high / maxHigh) * 100}%` }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
                        className="absolute inset-y-0 left-0 rounded-full bg-[#ffb36d]"
                      />
                      <motion.span
                        initial={{ width: 0 }}
                        whileInView={{ width: `${(row.low / maxHigh) * 100}%` }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
                        className="absolute inset-y-0 left-0 rounded-full bg-[#ff4b12]"
                      />
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              city?.costCards?.length > 0 && (
                <dl className="mt-6 grid grid-cols-2 gap-3">
                  {city.costCards.map((card) => (
                    <div key={card.label} className="rounded-2xl bg-white p-3.5">
                      <dt className="text-[11px] font-black uppercase tracking-[0.12em] text-[#7a879c]">{card.label}</dt>
                      <dd className="mt-1 font-black">{card.value}</dd>
                    </div>
                  ))}
                </dl>
              )
            )}
            <p className="mt-5 text-xs font-semibold leading-5 text-[#5f6f89]">
              {city?.breakdown ? "Dark bar: saving hard. Light bar: comfortable. " : ""}
              {city?.scholarshipNote || context.quickFacts?.livingNote}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

/* 6 · Similar universities (cream) */
export function SimilarSection({ university, similar, shortlist }) {
  return (
    <section id="similar" className="scroll-mt-20 bg-[#fff7ed] px-4 py-20 text-[#071f50] sm:px-5 md:py-28">
      <div className="mx-auto max-w-[1350px]">
        <Heading eyebrow="Compare" title="Also worth a look." text={`Universities like ${university.name}: same city, same subjects or the same type. Save a few and compare them on the universities page.`} />
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {similar.map((other) => (
            <UniCard key={other.key} university={other} saved={shortlist.has(other.key)} onToggle={shortlist.toggle} />
          ))}
        </div>
        <Link to="/universities#compare" className="mt-8 inline-flex items-center gap-2 text-sm font-black text-[#ff4b12] transition-all hover:gap-3">
          <Globe2 size={16} /> Compare your saved universities <ArrowRight size={15} strokeWidth={3} />
        </Link>
      </div>
    </section>
  );
}

/* 7 · FAQs (orange) */
export function FaqSection({ university, faqs }) {
  const [open, setOpen] = useState(0);

  return (
    <section id="faqs" className="scroll-mt-20 bg-[#ff4b12] px-4 py-20 text-white sm:px-5 md:py-28">
      <div className="mx-auto max-w-[1000px]">
        <Heading eyebrow="Questions" title="What students ask us" accent={`about ${university.name.replace(/\s*\(.*\)/, "")}.`} tone="orange" />
        <div className="mt-10 space-y-3">
          {faqs.map((faq, index) => {
            const isOpen = open === index;
            return (
              <div key={faq.q} className="overflow-hidden rounded-[22px] bg-white text-[#071f50]">
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? -1 : index)}
                  aria-expanded={isOpen}
                  className="flex w-full items-center justify-between gap-4 p-5 text-left md:p-6"
                >
                  <span className="text-base font-black leading-6 md:text-lg">{faq.q}</span>
                  <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-full transition ${isOpen ? "bg-[#ff4b12] text-white" : "bg-[#fff1ea] text-[#ff4b12]"}`}>
                    {isOpen ? <Minus size={16} strokeWidth={3} /> : <Plus size={16} strokeWidth={3} />}
                  </span>
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} transition={{ duration: 0.25 }}>
                      <p className="px-5 pb-6 text-[15px] font-semibold leading-7 text-[#5f6f89] md:px-6">{faq.a}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

