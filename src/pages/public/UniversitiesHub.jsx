import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { AnimatePresence, motion, useInView } from "framer-motion";
import { Check, Heart } from "lucide-react";

import { getCountryBySlug } from "../../data/countries/countryRegistry";
import { DripDivider, ZAIFAN_NAVY, ZAIFAN_ORANGE } from "../../components/public/destinations/DestinationUI";
import PinboardHero from "../../components/public/universities/PinboardHero";
import SubjectLockers from "../../components/public/universities/SubjectLockers";
import UniFinder from "../../components/public/universities/UniFinder";
import UniCompare from "../../components/public/universities/UniCompare";
import UniTalk from "../../components/public/universities/UniTalk";
import { EMPTY_FILTERS, HUB_STEPS } from "../../components/public/universities/hubSteps";
import { useShortlist } from "../../components/public/universities/useShortlist";

/** Which step's section is crossing the middle of the screen. */
function useActiveStep() {
  const [active, setActive] = useState(HUB_STEPS[0].id);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((entry) => entry.isIntersecting && setActive(entry.target.id)),
      { rootMargin: "-45% 0px -50% 0px" }
    );
    HUB_STEPS.forEach((step) => {
      const element = document.getElementById(step.id);
      if (element) observer.observe(element);
    });
    return () => observer.disconnect();
  }, []);

  return active;
}

/** Floating dock: the three steps plus how many universities are saved. */
function StepDock({ active, saved }) {
  const activeIndex = HUB_STEPS.findIndex((step) => step.id === active);

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
          {HUB_STEPS.map((step, index) => {
            const current = step.id === active;
            const passed = index < activeIndex;
            return (
              <li key={step.id}>
                <a
                  href={`#${step.id}`}
                  aria-current={current ? "step" : undefined}
                  className={`relative flex items-center gap-1.5 rounded-full px-2.5 py-2 text-xs font-black transition sm:px-3 ${current ? "text-white" : "text-white/55 hover:text-white"}`}
                >
                  {current && <motion.span layoutId="uni-dock-step" className="absolute inset-0 rounded-full bg-[#ff4b12]" />}
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
        <span className="h-7 w-px bg-white/15" />
        <a
          href="#compare"
          className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-white px-3 py-2 text-xs font-black text-[#071f50] transition hover:bg-[#ffb36d]"
          aria-label={`${saved} saved universities`}
        >
          <Heart size={14} fill={saved ? "#ff4b12" : "none"} className={saved ? "text-[#ff4b12]" : ""} /> {saved}
        </a>
      </div>
    </motion.nav>
  );
}

// /universities: pick a subject, find and save universities, compare them.
function UniversitiesHub() {
  const [searchParams] = useSearchParams();
  const shortlist = useShortlist();
  const activeStep = useActiveStep();
  const heroRef = useRef(null);
  const heroInView = useInView(heroRef, { amount: 0.25 });

  // Old links like /universities?country=germany still open on that country.
  const [filters, setFilters] = useState(() => ({
    ...EMPTY_FILTERS,
    country: getCountryBySlug(searchParams.get("country")) ? searchParams.get("country") : "all",
  }));

  useEffect(() => {
    document.title = "Find Universities | Zaifan Consultancy";
  }, []);

  const showFinder = useCallback((changes) => {
    setFilters({ ...EMPTY_FILTERS, ...changes });
    requestAnimationFrame(() => document.getElementById("finder")?.scrollIntoView({ behavior: "smooth" }));
  }, []);

  return (
    <main className="overflow-hidden bg-[#fff7ed] text-[#071f50]">
      <div ref={heroRef}>
        <PinboardHero onSearch={(query) => showFinder({ query })} />
      </div>
      <DripDivider background={ZAIFAN_NAVY} />
      <SubjectLockers onPickSubject={(subject) => showFinder({ subject })} />
      <DripDivider color={ZAIFAN_NAVY} background="#fff7ed" />
      <UniFinder filters={filters} setFilters={setFilters} shortlist={shortlist} />
      <DripDivider background={ZAIFAN_ORANGE} />
      <UniCompare shortlist={shortlist} />
      <DripDivider color={ZAIFAN_ORANGE} background="#fff7ed" />
      <UniTalk universities={shortlist.picks} eyebrow="Still deciding?" title="Talk to a real person." />

      <AnimatePresence>{!heroInView && <StepDock active={activeStep} saved={shortlist.picks.length} />}</AnimatePresence>
    </main>
  );
}

export default UniversitiesHub;
