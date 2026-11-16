import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { AnimatePresence, useInView } from "framer-motion";

import { countryList, getCountryBySlug } from "../../data/countries";
import { findScholarships, SCHOLARSHIP_STEPS } from "../../data/countries/scholarshipFinder";
import { DripDivider, ZAIFAN_NAVY, ZAIFAN_ORANGE } from "../../components/public/destinations/DestinationUI";
import ScholarshipHero from "../../components/public/scholarships/ScholarshipHero";
import ScholarshipPicker from "../../components/public/scholarships/ScholarshipPicker";
import ScholarshipMatches from "../../components/public/scholarships/ScholarshipMatches";
import ScholarshipRules from "../../components/public/scholarships/ScholarshipRules";
import ScholarshipCountries from "../../components/public/scholarships/ScholarshipCountries";
import StepDock from "../../components/public/guide/StepDock";
import { useActiveStep } from "../../components/public/guide/useActiveStep";

const CREAM = "#fff7ed";
const LAST_REVIEWED = countryList.find((item) => item.lastReviewed)?.lastReviewed;
const APPOINTMENT_PATH = `/appointment?service=${encodeURIComponent("Scholarship Guidance")}`;

// Scholarships for all nine countries on one page: a hero, then four labelled
// steps (three questions, the matches, the honest rules, country by country).
// Sections alternate cream with orange and navy, with a drip at every change.
function ScholarshipsHub() {
  const [searchParams, setSearchParams] = useSearchParams();
  const countryParam = searchParams.get("country");
  const country = getCountryBySlug(countryParam) ? countryParam : "all";
  const [picks, setPicks] = useState({ needs: [], level: "all" });
  const filters = useMemo(() => ({ ...picks, country }), [picks, country]);
  const results = useMemo(() => findScholarships(filters), [filters]);

  const activeStep = useActiveStep(SCHOLARSHIP_STEPS, "scholarships");
  const heroRef = useRef(null);
  const heroInView = useInView(heroRef, { amount: 0.2 });

  useEffect(() => {
    document.title = "Scholarships | Zaifan Consultancy";
  }, []);

  // The country lives in the address (so /scholarships?country=germany can be
  // shared); the other two answers are kept on the page.
  const setFilters = (next) => {
    setPicks({ needs: next.needs, level: next.level });
    if (next.country !== country) setSearchParams(next.country === "all" ? {} : { country: next.country }, { replace: true });
  };
  const reset = () => setFilters({ needs: [], level: "all", country: "all" });
  const pickCountry = (slug) => {
    setFilters({ needs: [], level: "all", country: slug });
    document.getElementById("matches")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  // A shared link with a country lands on its matches.
  useEffect(() => {
    if (!getCountryBySlug(new URLSearchParams(window.location.search).get("country"))) return undefined;
    const timer = window.setTimeout(() => document.getElementById("matches")?.scrollIntoView({ block: "start" }), 300);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <main className="overflow-hidden bg-[#fff7ed] text-[#071f50]">
      <div ref={heroRef}>
        <ScholarshipHero countryCount={countryList.length} appointmentPath={APPOINTMENT_PATH} />
      </div>
      <DripDivider background={ZAIFAN_ORANGE} />
      <ScholarshipPicker filters={filters} setFilters={setFilters} countries={countryList} count={results.length} />
      <DripDivider color={ZAIFAN_ORANGE} background={CREAM} />
      <ScholarshipMatches results={results} filters={filters} countries={countryList} onReset={reset} />
      <DripDivider background={ZAIFAN_NAVY} />
      <ScholarshipRules appointmentPath={APPOINTMENT_PATH} />
      <DripDivider color={ZAIFAN_NAVY} background={CREAM} />
      <ScholarshipCountries onPick={pickCountry} lastReviewed={LAST_REVIEWED} />

      <AnimatePresence>
        {!heroInView && <StepDock steps={SCHOLARSHIP_STEPS} active={activeStep} appointmentPath={APPOINTMENT_PATH} label="Scholarship steps" />}
      </AnimatePresence>
    </main>
  );
}

export default ScholarshipsHub;
