import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { AnimatePresence, motion, useInView } from "framer-motion";
import { CalendarCheck, Check } from "lucide-react";

import { getCountryAppointmentPath } from "../../data/countries";
import { getDestinationGuide } from "../../data/countries/guides";
import { DripDivider, ZAIFAN_NAVY, ZAIFAN_ORANGE } from "../../components/public/destinations/DestinationUI";
import GuideHero from "../../components/public/guide/GuideHero";
import FitCheck from "../../components/public/guide/FitCheck";
import MoneyReceipt from "../../components/public/guide/MoneyReceipt";
import UniversityShelf from "../../components/public/guide/UniversityShelf";
import ScholarshipCoupons from "../../components/public/guide/ScholarshipCoupons";
import CityMetro from "../../components/public/guide/CityMetro";
import ApplyRoute from "../../components/public/guide/ApplyRoute";
import GuideFaq from "../../components/public/guide/GuideFaq";
import { GUIDE_STEPS } from "../../components/public/guide/guideSteps";
import NotFoundPage from "./NotFoundPage";

const CREAM = "#fff7ed";

/** Which step's section is crossing the middle of the screen. */
function useActiveStep(key) {
  const [active, setActive] = useState(GUIDE_STEPS[0].id);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((entry) => entry.isIntersecting && setActive(entry.target.id)),
      { rootMargin: "-45% 0px -50% 0px" },
    );
    GUIDE_STEPS.forEach((step) => {
      const element = document.getElementById(step.id);
      if (element) observer.observe(element);
    });
    return () => observer.disconnect();
  }, [key]);

  return active;
}

/** Floating dock: the six steps, where you are, and a way to book. */
function GuideDock({ active, appointmentPath }) {
  const activeIndex = GUIDE_STEPS.findIndex((step) => step.id === active);

  return (
    <motion.nav
      aria-label="Guide steps"
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 100, opacity: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="fixed inset-x-0 bottom-4 z-[9990] flex justify-center px-3"
    >
      <div className="flex max-w-full items-center gap-1.5 rounded-full bg-[#071f50] p-1.5 text-white shadow-[0_24px_60px_rgba(7,31,80,0.45)] ring-1 ring-white/10">
        <ol className="flex items-center overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {GUIDE_STEPS.map((step, index) => {
            const current = step.id === active;
            const passed = index < activeIndex;
            return (
              <li key={step.id} className="shrink-0">
                <a
                  href={`#${step.id}`}
                  aria-current={current ? "step" : undefined}
                  className={`relative flex items-center gap-1.5 rounded-full px-2 py-2 text-xs font-black transition sm:px-3 ${
                    current ? "text-white" : "text-white/55 hover:text-white"
                  }`}
                >
                  {current && <motion.span layoutId="guide-dock-step" className="absolute inset-0 rounded-full bg-[#ff4b12]" />}
                  <span
                    className={`relative grid h-5 w-5 place-items-center rounded-full font-mono text-[10px] ${
                      current ? "bg-white text-[#ff4b12]" : passed ? "bg-emerald-400 text-[#071f50]" : "bg-white/10"
                    }`}
                  >
                    {passed ? <Check size={11} strokeWidth={4} /> : index + 1}
                  </span>
                  <span className={`relative whitespace-nowrap ${current ? "" : "hidden lg:inline"}`}>{step.label}</span>
                </a>
              </li>
            );
          })}
        </ol>
        <span className="h-7 w-px shrink-0 bg-white/15" />
        <Link
          to={appointmentPath}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-white px-3 py-2 text-xs font-black text-[#071f50] transition hover:bg-[#ffb36d]"
        >
          <CalendarCheck size={14} />
          <span className="hidden sm:inline">Book free call</span>
        </Link>
      </div>
    </motion.nav>
  );
}

// One country guide for all nine destinations: a hero, then six labelled steps
// (fit, money, universities, scholarships, cities, apply & visa) and FAQs.
// Sections alternate cream with orange and navy, with a drip at every change.
function DestinationPage() {
  const { countrySlug } = useParams();
  const location = useLocation();
  const country = useMemo(() => getDestinationGuide(countrySlug), [countrySlug]);
  const activeStep = useActiveStep(countrySlug);
  const heroRef = useRef(null);
  const heroInView = useInView(heroRef, { amount: 0.2 });

  useEffect(() => {
    if (country) document.title = `Study in ${country.name} | Zaifan Consultancy`;
  }, [country]);

  // Deep links like /countries/germany#scholarships land on that step.
  useEffect(() => {
    if (!location.hash) return undefined;
    const timer = window.setTimeout(() => document.getElementById(location.hash.slice(1))?.scrollIntoView({ block: "start" }), 300);
    return () => window.clearTimeout(timer);
  }, [location.hash, countrySlug]);

  if (!country) return <NotFoundPage />;
  const appointmentPath = getCountryAppointmentPath(country);

  return (
    // Keyed by country so every section's choices reset when you switch guides.
    <main key={country.slug} className="overflow-hidden bg-[#fff7ed] text-[#071f50]">
      <div ref={heroRef}>
        <GuideHero country={country} appointmentPath={appointmentPath} />
      </div>
      <DripDivider background={ZAIFAN_ORANGE} />
      <FitCheck country={country} />
      <DripDivider color={ZAIFAN_ORANGE} background={CREAM} />
      <MoneyReceipt country={country} />
      <DripDivider background={ZAIFAN_NAVY} />
      <UniversityShelf country={country} />
      <DripDivider color={ZAIFAN_NAVY} background={CREAM} />
      <ScholarshipCoupons country={country} />
      <DripDivider background={ZAIFAN_ORANGE} />
      <CityMetro country={country} />
      <DripDivider color={ZAIFAN_ORANGE} background={CREAM} />
      <ApplyRoute country={country} appointmentPath={appointmentPath} />
      <GuideFaq country={country} appointmentPath={appointmentPath} />

      <AnimatePresence>{!heroInView && <GuideDock active={activeStep} appointmentPath={appointmentPath} />}</AnimatePresence>
    </main>
  );
}

export default DestinationPage;
