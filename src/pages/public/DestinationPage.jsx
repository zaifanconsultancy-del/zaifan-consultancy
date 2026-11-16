import { useEffect, useMemo, useRef } from "react";
import { useLocation, useParams } from "react-router-dom";
import { AnimatePresence, useInView } from "framer-motion";

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
import StepDock from "../../components/public/guide/StepDock";
import { useActiveStep } from "../../components/public/guide/useActiveStep";
import { GUIDE_STEPS } from "../../components/public/guide/guideSteps";
import NotFoundPage from "./NotFoundPage";

const CREAM = "#fff7ed";

// One country guide for all nine destinations: a hero, then six labelled steps
// (fit, money, universities, scholarships, cities, apply & visa) and FAQs.
// Sections alternate cream with orange and navy, with a drip at every change.
function DestinationPage() {
  const { countrySlug } = useParams();
  const location = useLocation();
  const country = useMemo(() => getDestinationGuide(countrySlug), [countrySlug]);
  const activeStep = useActiveStep(GUIDE_STEPS, countrySlug);
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

      <AnimatePresence>
        {!heroInView && <StepDock steps={GUIDE_STEPS} active={activeStep} appointmentPath={appointmentPath} label="Guide steps" />}
      </AnimatePresence>
    </main>
  );
}

export default DestinationPage;
