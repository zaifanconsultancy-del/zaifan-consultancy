import { useEffect, useMemo, useRef } from "react";
import { useLocation, useParams } from "react-router-dom";
import { AnimatePresence, useInView } from "framer-motion";

import { getCountryAppointmentPath } from "../../data/countries";
import { CITY_STEPS, getCityGuide } from "../../data/countries/cityGuides";
import { DripDivider, ZAIFAN_NAVY, ZAIFAN_ORANGE } from "../../components/public/destinations/DestinationUI";
import CityHero from "../../components/public/city/CityHero";
import CityFit from "../../components/public/city/CityFit";
import CityBudget from "../../components/public/city/CityBudget";
import CityUniversities from "../../components/public/city/CityUniversities";
import CityLife from "../../components/public/city/CityLife";
import CityCompare from "../../components/public/city/CityCompare";
import GuideFaq from "../../components/public/guide/GuideFaq";
import StepDock from "../../components/public/guide/StepDock";
import { useActiveStep } from "../../components/public/guide/useActiveStep";
import NotFoundPage from "./NotFoundPage";

const CREAM = "#fff7ed";

// One city page for every city in all nine countries: a hero, then five
// labelled steps (fit, monthly money, universities, daily life, compare) and
// FAQs. Sections alternate cream with orange and navy, with a drip at every change.
function CityPage() {
  const { countrySlug = "italy", citySlug } = useParams();
  const location = useLocation();
  const guide = useMemo(() => getCityGuide(countrySlug, citySlug), [countrySlug, citySlug]);
  const pageKey = `${countrySlug}/${citySlug}`;
  const activeStep = useActiveStep(CITY_STEPS, pageKey);
  const heroRef = useRef(null);
  const heroInView = useInView(heroRef, { amount: 0.2 });

  useEffect(() => {
    if (guide) document.title = `Study in ${guide.city.name}, ${guide.country.name} | Zaifan Consultancy`;
  }, [guide]);

  // Deep links like /countries/germany/berlin#budget land on that step.
  useEffect(() => {
    if (!location.hash) return undefined;
    const timer = window.setTimeout(() => document.getElementById(location.hash.slice(1))?.scrollIntoView({ block: "start" }), 300);
    return () => window.clearTimeout(timer);
  }, [location.hash, pageKey]);

  if (!guide) return <NotFoundPage />;
  const { country, city, universities, ladder, rank, faqs } = guide;
  const appointmentPath = `${getCountryAppointmentPath(country)}&city=${encodeURIComponent(city.name)}`;

  return (
    // Keyed by city so every section's choices reset when you open another city.
    <main key={pageKey} className="overflow-hidden bg-[#fff7ed] text-[#071f50]">
      <div ref={heroRef}>
        <CityHero city={city} country={country} universities={universities} appointmentPath={appointmentPath} />
      </div>
      <DripDivider background={ZAIFAN_ORANGE} />
      <CityFit city={city} />
      <DripDivider color={ZAIFAN_ORANGE} background={CREAM} />
      <CityBudget city={city} country={country} />
      <DripDivider background={ZAIFAN_NAVY} />
      <CityUniversities city={city} country={country} universities={universities} />
      <DripDivider color={ZAIFAN_NAVY} background={CREAM} />
      <CityLife city={city} country={country} />
      <DripDivider background={ZAIFAN_ORANGE} />
      <CityCompare city={city} country={country} ladder={ladder} rank={rank} />
      <DripDivider color={ZAIFAN_ORANGE} background={CREAM} />
      <GuideFaq country={{ name: city.name, faqs, lastReviewed: country.lastReviewed, sources: country.sources }} appointmentPath={appointmentPath} />

      <AnimatePresence>
        {!heroInView && <StepDock steps={CITY_STEPS} active={activeStep} appointmentPath={appointmentPath} label="City guide steps" />}
      </AnimatePresence>
    </main>
  );
}

export default CityPage;
