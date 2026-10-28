import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useInView } from "framer-motion";
import { Check, GitCompareArrows, X } from "lucide-react";

import { countryList } from "../../data/countries";
import { DripDivider, FlagMark, ZAIFAN_NAVY, ZAIFAN_ORANGE } from "../../components/public/destinations/DestinationUI";
import RadarHero from "../../components/public/countries/RadarHero";
import BaggageClaim from "../../components/public/countries/BaggageClaim";
import Lineup from "../../components/public/countries/Lineup";
import PriceLadder from "../../components/public/countries/PriceLadder";
import DocumentChecklist from "../../components/public/countries/DocumentChecklist";
import HeadToHead from "../../components/public/countries/HeadToHead";
import TalkToUs from "../../components/public/countries/TalkToUs";
import { STEPS } from "../../components/public/countries/countriesData";

/** Which step's section is crossing the middle of the screen. */
function useActiveStep() {
  const [active, setActive] = useState(STEPS[0].id);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((entry) => entry.isIntersecting && setActive(entry.target.id)),
      { rootMargin: "-45% 0px -50% 0px" },
    );
    STEPS.forEach((step) => {
      const element = document.getElementById(step.id);
      if (element) observer.observe(element);
    });
    return () => observer.disconnect();
  }, []);

  return active;
}

/** Floating dock: where you are in the four steps, plus your shortlist. */
function StepDock({ active, picks, onRemove, onCompare }) {
  const activeIndex = STEPS.findIndex((step) => step.id === active);

  return (
    <motion.nav
      aria-label="Page steps"
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 100, opacity: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="fixed inset-x-0 bottom-4 z-[9990] flex justify-center px-3"
    >
      <div className="flex max-w-full items-center gap-2 rounded-full bg-[#071f50] p-1.5 text-white shadow-[0_24px_60px_rgba(7,31,80,0.45)] ring-1 ring-white/10">
        <ol className="flex items-center">
          {STEPS.map((step, index) => {
            const current = step.id === active;
            const passed = index < activeIndex;
            return (
              <li key={step.id}>
                <a
                  href={`#${step.id}`}
                  aria-current={current ? "step" : undefined}
                  className={`relative flex items-center gap-1.5 rounded-full px-2.5 py-2 text-xs font-black transition sm:px-3 ${
                    current ? "text-white" : "text-white/55 hover:text-white"
                  }`}
                >
                  {current && <motion.span layoutId="dock-step" className="absolute inset-0 rounded-full bg-[#ff4b12]" />}
                  <span
                    className={`relative grid h-5 w-5 place-items-center rounded-full font-mono text-[10px] ${
                      current ? "bg-white text-[#ff4b12]" : passed ? "bg-emerald-400 text-[#071f50]" : "bg-white/10"
                    }`}
                  >
                    {passed ? <Check size={11} strokeWidth={4} /> : index + 1}
                  </span>
                  <span className={`relative ${current ? "" : "hidden md:inline"}`}>{step.label}</span>
                </a>
              </li>
            );
          })}
        </ol>

        {picks.length > 0 && (
          <>
            <span className="h-7 w-px bg-white/15" />
            <div className="hidden -space-x-2 sm:flex">
              {picks.slice(0, 4).map((country) => (
                <button
                  key={country.slug}
                  type="button"
                  onClick={() => onRemove(country.slug)}
                  title={`Remove ${country.name}`}
                  className="group relative shrink-0 transition hover:z-10 hover:-translate-y-1"
                >
                  <FlagMark country={country} className="h-6 w-9 ring-2 ring-[#071f50]" />
                  <span className="absolute -right-1.5 -top-1.5 hidden h-4 w-4 place-items-center rounded-full bg-white text-[#071f50] group-hover:grid">
                    <X size={10} strokeWidth={4} />
                  </span>
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={onCompare}
              disabled={picks.length < 2}
              title={picks.length < 2 ? "Shortlist one more country to compare" : undefined}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-white px-3 py-2 text-xs font-black text-[#071f50] transition hover:bg-[#ffb36d] disabled:bg-white/10 disabled:text-white/50"
            >
              <GitCompareArrows size={14} />
              <span className="hidden sm:inline">Compare</span> {picks.length}
            </button>
          </>
        )}
      </div>
    </motion.nav>
  );
}

// One journey in four steps (shortlist, compare, budget, documents), sharing
// one shortlist across every section.
function CountriesPage() {
  const [shortlist, setShortlist] = useState([]);
  const [sheetOpen, setSheetOpen] = useState(false);
  const activeStep = useActiveStep();
  // The hero has its own passport and step list, so the dock waits until it scrolls away.
  const heroRef = useRef(null);
  const heroInView = useInView(heroRef, { amount: 0.25 });

  useEffect(() => {
    document.title = "Compare Study Destinations | Zaifan Consultancy";
  }, []);

  const add = useCallback((slug) => setShortlist((current) => (current.includes(slug) ? current : [...current, slug])), []);
  const remove = useCallback(
    (slug) =>
      setShortlist((current) => {
        const next = current.filter((item) => item !== slug);
        // The side-by-side view needs at least two countries.
        if (next.length < 2) setSheetOpen(false);
        return next;
      }),
    [],
  );
  const toggle = (slug) => (shortlist.includes(slug) ? remove(slug) : add(slug));
  const closeSheet = useCallback(() => setSheetOpen(false), []);
  const openSheet = () => shortlist.length > 1 && setSheetOpen(true);

  const picks = shortlist.map((slug) => countryList.find((country) => country.slug === slug));

  return (
    <main className="overflow-hidden bg-[#fff7ed] text-[#071f50]">
      <div ref={heroRef}>
        <RadarHero picks={picks} onAdd={add} onRemove={remove} onCompare={openSheet} />
      </div>
      <BaggageClaim />
      <DripDivider background={ZAIFAN_NAVY} />
      <Lineup picks={picks} onToggle={toggle} />
      <DripDivider color={ZAIFAN_NAVY} background="#fff7ed" />
      <PriceLadder />
      <DripDivider background={ZAIFAN_ORANGE} />
      <DocumentChecklist picks={picks} />
      <DripDivider color={ZAIFAN_ORANGE} background="#fff7ed" />
      <TalkToUs picks={picks} />

      <AnimatePresence>
        {!heroInView && !sheetOpen && <StepDock active={activeStep} picks={picks} onRemove={remove} onCompare={openSheet} />}
      </AnimatePresence>

      <AnimatePresence>{sheetOpen && picks.length > 1 && <HeadToHead countries={picks} onRemove={remove} onClose={closeSheet} />}</AnimatePresence>
    </main>
  );
}

export default CountriesPage;
