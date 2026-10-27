import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Calculator, ChevronDown, CircleCheck, GraduationCap, Target } from "lucide-react";

import { SectionHeader } from "./DestinationUI";
import { BUDGET_LABELS, LIFESTYLES, fadeUp, iconFor } from "./destinationUtils";
import { getCareerFamilies } from "../../../data/countries/careerPaths";

// Sections shared by the university profile and city pages of every country,
// so they reach the same depth as Italy's hand-built pages.

function formatMoney(symbol, value) {
  return `${symbol}${Math.round(value).toLocaleString("en-US")}`;
}

/** Sticky row of section shortcuts, like the one on the country guides. */
export function JumpNav({ title, items }) {
  const jump = (id) => {
    const target = document.getElementById(id);
    if (!target) return;
    window.scrollTo({ top: target.getBoundingClientRect().top + window.scrollY - 170, behavior: "smooth" });
  };

  return (
    <section className="relative z-30 px-4 pb-6 sm:px-5">
      <div className="mx-auto max-w-[1380px] overflow-hidden rounded-[24px] bg-white/94 shadow-[0_22px_65px_rgba(9,31,80,0.10)] ring-1 ring-orange-100 backdrop-blur-xl md:sticky md:top-[94px]">
        <div className="flex items-center gap-3 bg-[#071f50] px-4 py-3 text-white">
          <Target size={18} className="text-[#ffb36d]" strokeWidth={3} />
          <p className="truncate text-sm font-black">{title}</p>
        </div>
        <div className="flex gap-2 overflow-x-auto p-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {items.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => jump(item.id)}
              className="min-w-fit rounded-full bg-[#fffaf5] px-4 py-2.5 text-xs font-black text-[#071f50] ring-1 ring-orange-100 transition hover:bg-[#fff1ea] hover:text-[#ff4b12]"
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

/** Accordion of questions; the first one starts open. */
export function FaqList({ faqs }) {
  const [open, setOpen] = useState(0);

  return (
    <div className="mt-10 space-y-3">
      {faqs.map((faq, index) => {
        const isOpen = open === index;
        return (
          <div
            key={faq.q}
            className="overflow-hidden rounded-[24px] bg-white shadow-[0_14px_40px_rgba(9,31,80,0.06)] ring-1 ring-orange-100"
          >
            <button
              type="button"
              onClick={() => setOpen(isOpen ? -1 : index)}
              className="flex w-full items-center justify-between gap-4 px-5 py-5 text-left md:px-6"
              aria-expanded={isOpen}
            >
              <span className="text-base font-black tracking-[-0.02em]">{faq.q}</span>
              <ChevronDown size={20} className={`shrink-0 text-[#ff4b12] transition ${isOpen ? "rotate-180" : ""}`} />
            </button>
            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}>
                  <p className="px-5 pb-5 text-sm font-semibold leading-7 text-[#61708a] md:px-6">{faq.a}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}

function readChecked(key) {
  try {
    return JSON.parse(window.localStorage.getItem(key) || "[]");
  } catch {
    return [];
  }
}

/**
 * Tick-off list of the documents the country's universities and embassy
 * usually ask for, grouped by stage. Progress is remembered in this browser only.
 */
export function DocumentChecklist({ country, id = "documents" }) {
  const storageKey = `zaifan-docs-${country.slug}`;
  const groups = useMemo(
    () =>
      [
        { title: "For your application", items: country.requirements?.documents || [] },
        { title: `For your ${country.visa?.name || "visa"}`, items: country.visa?.documents || [] },
      ].filter((group) => group.items.length),
    [country],
  );
  // Keys are stage-prefixed so the same document can be ticked per stage.
  const documents = groups.flatMap((group) => group.items.map((item) => `${group.title}::${item}`));
  const [checked, setChecked] = useState(() => readChecked(storageKey));

  useEffect(() => {
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(checked));
    } catch {
      // Storage blocked: the checklist still works for this visit.
    }
  }, [checked, storageKey]);

  if (!documents.length) return null;

  const done = documents.filter((item) => checked.includes(item)).length;
  const percent = Math.round((done / documents.length) * 100);
  const toggle = (item) =>
    setChecked((current) => (current.includes(item) ? current.filter((value) => value !== item) : [...current, item]));

  return (
    <section id={id} className="px-4 py-10 sm:px-5 md:py-16">
      <div className="mx-auto grid max-w-[1350px] gap-6 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
        <div>
          <SectionHeader
            align="left"
            eyebrow="Document checklist"
            title="Tick off what you already have."
            text={`Admission and visa documents for ${country.name} in one list. Your ticks stay in this browser, so you can come back later.`}
          />
          <div className="mt-8 rounded-[28px] bg-[#071f50] p-6 text-white shadow-[0_24px_60px_rgba(7,31,80,0.2)]">
            <div className="flex items-end justify-between">
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#ffb36d]">Your progress</p>
              <p className="text-4xl font-black tracking-[-0.05em]">{percent}%</p>
            </div>
            <div className="mt-4 h-3 overflow-hidden rounded-full bg-white/10">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-[#ff7b1c] to-[#ff4b12]"
                animate={{ width: `${percent}%` }}
                transition={{ duration: 0.45 }}
              />
            </div>
            <p className="mt-3 text-xs font-semibold text-white/65">
              {done} of {documents.length} ready.{" "}
              {done === documents.length ? "You're ready for a document review." : "We help you prepare and attest the rest."}
            </p>
          </div>
        </div>

        <div className="space-y-6">
          {groups.map((group) => (
            <div key={group.title}>
              <p className="mb-3 text-[11px] font-black uppercase tracking-[0.16em] text-[#ff4b12]">{group.title}</p>
              <div className="grid gap-3 sm:grid-cols-2">
                {group.items.map((label) => {
                  const item = `${group.title}::${label}`;
                  const isChecked = checked.includes(item);
                  return (
                    <button
                      key={item}
                      type="button"
                      onClick={() => toggle(item)}
                      aria-pressed={isChecked}
                      className={`flex items-start gap-3 rounded-[22px] p-4 text-left ring-1 transition hover:-translate-y-0.5 ${
                        isChecked ? "bg-emerald-50 ring-emerald-200" : "bg-white shadow-[0_14px_36px_rgba(9,31,80,0.06)] ring-orange-100"
                      }`}
                    >
                      <span
                        className={`mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-lg ring-2 transition ${
                          isChecked ? "bg-emerald-500 text-white ring-emerald-500" : "bg-white text-transparent ring-orange-200"
                        }`}
                      >
                        <CircleCheck size={16} strokeWidth={3} />
                      </span>
                      <span className={`text-sm font-bold leading-6 ${isChecked ? "text-emerald-800" : "text-[#405672]"}`}>{label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/** Where the programmes on this page usually lead, plus the country's post-study rules. */
export function CareerPaths({ country, programs, id = "careers", title = "Where this can take you." }) {
  const families = getCareerFamilies(programs);
  if (!families.length) return null;

  return (
    <section id={id} className="px-4 py-10 sm:px-5 md:py-16">
      <div className="mx-auto max-w-[1350px]">
        <SectionHeader
          eyebrow="Careers"
          title={title}
          text="Typical directions for these subjects. Results depend on your degree, skills, language and the job market, so treat this as a map, not a promise."
        />
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.15 }}
          transition={{ staggerChildren: 0.07 }}
          className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-4"
        >
          {families.map((family) => {
            const Icon = iconFor(family.icon);
            return (
              <motion.div
                key={family.id}
                variants={fadeUp}
                className="rounded-[28px] bg-white p-6 shadow-[0_18px_50px_rgba(9,31,80,0.07)] ring-1 ring-orange-100"
              >
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[#fff1ea] text-[#ff4b12]">
                  <Icon size={22} strokeWidth={2.6} />
                </div>
                <h3 className="mt-4 text-lg font-black tracking-[-0.03em]">{family.title}</h3>
                <p className="mt-1 text-[11px] font-black uppercase tracking-[0.12em] text-[#7a879c]">{family.matches.join(" · ")}</p>
                <ul className="mt-4 space-y-2">
                  {family.roles.map((role) => (
                    <li key={role} className="flex gap-2 text-sm font-semibold leading-6 text-[#526178]">
                      <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#ff4b12]" />
                      {role}
                    </li>
                  ))}
                </ul>
              </motion.div>
            );
          })}
          <motion.div
            variants={fadeUp}
            className="flex flex-col rounded-[28px] bg-gradient-to-br from-[#ff7b1c] to-[#ff4b12] p-6 text-white shadow-[0_22px_55px_rgba(255,75,18,0.25)]"
          >
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-white/15">
              <GraduationCap size={22} strokeWidth={2.6} />
            </div>
            <h3 className="mt-4 text-lg font-black tracking-[-0.03em]">After you graduate</h3>
            <p className="mt-2 text-2xl font-black leading-7 tracking-[-0.03em]">{country.quickFacts.postStudy}</p>
            <p className="mt-3 text-sm font-semibold leading-6 text-white/85">
              While studying: {country.quickFacts.work}. Rules change, so we confirm the current position before you apply.
            </p>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

/**
 * Twelve months of living costs in one city, with a saver / balanced /
 * comfort switch. `tone="dark"` is for navy sections.
 */
export function YearlyLivingEstimate({ country, city, tone = "dark" }) {
  const [lifestyle, setLifestyle] = useState("balanced");
  if (!city?.budget) return null;

  const dark = tone === "dark";
  const symbol = country.currencySymbol || "";
  const factor = LIFESTYLES.find((item) => item.id === lifestyle)?.factor ?? 0.5;
  const lines = Object.entries(city.budget).map(([key, [low, high]]) => ({
    key,
    label: BUDGET_LABELS[key] || key,
    value: low + (high - low) * factor,
  }));
  const monthly = lines.reduce((sum, line) => sum + line.value, 0);
  const largest = Math.max(...lines.map((line) => line.value), 1);

  return (
    <div
      className={`rounded-[28px] p-6 ring-1 ${
        dark ? "bg-white/[0.06] ring-white/10" : "bg-white shadow-[0_18px_50px_rgba(9,31,80,0.07)] ring-orange-100"
      }`}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p
          className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.16em] ${dark ? "text-[#ffb36d]" : "text-[#ff4b12]"}`}
        >
          <Calculator size={14} /> Living in {city.name}
        </p>
        <div className={`flex rounded-full p-1 ${dark ? "bg-white/10" : "bg-[#fff7ed] ring-1 ring-orange-100"}`}>
          {LIFESTYLES.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setLifestyle(item.id)}
              className={`rounded-full px-3 py-1.5 text-[11px] font-black transition ${
                lifestyle === item.id
                  ? "bg-[#ff4b12] text-white"
                  : dark
                    ? "text-white/70 hover:text-white"
                    : "text-[#526178] hover:text-[#ff4b12]"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-5 space-y-3">
        {lines.map((line) => (
          <div key={line.key}>
            <div className="flex justify-between text-xs font-bold">
              <span className={dark ? "text-white/75" : "text-[#526178]"}>{line.label}</span>
              <span className="font-black">{formatMoney(symbol, line.value)}</span>
            </div>
            <div className={`mt-1.5 h-2 overflow-hidden rounded-full ${dark ? "bg-white/10" : "bg-[#fff1ea]"}`}>
              <motion.div
                className="h-full rounded-full bg-[#ff7b1c]"
                animate={{ width: `${(line.value / largest) * 100}%` }}
                transition={{ duration: 0.4 }}
              />
            </div>
          </div>
        ))}
      </div>

      <div className={`mt-6 grid grid-cols-2 gap-3 border-t pt-5 ${dark ? "border-white/10" : "border-orange-100"}`}>
        <div>
          <p className={`text-[10px] font-black uppercase tracking-[0.14em] ${dark ? "text-white/55" : "text-[#7a879c]"}`}>Per month</p>
          <p className="mt-1 text-2xl font-black tracking-[-0.04em]">{formatMoney(symbol, monthly)}</p>
        </div>
        <div>
          <p className={`text-[10px] font-black uppercase tracking-[0.14em] ${dark ? "text-white/55" : "text-[#7a879c]"}`}>12 months</p>
          <p className="mt-1 text-2xl font-black tracking-[-0.04em] text-[#ff7b1c]">{formatMoney(symbol, monthly * 12)}</p>
        </div>
      </div>
    </div>
  );
}
