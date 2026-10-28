import { useEffect } from "react";

import HomeHero from "../../components/public/home/HomeHero";
import DestinationStrip from "../../components/public/home/DestinationStrip";
import ServicesBento from "../../components/public/home/ServicesBento";
import ScholarshipFlip from "../../components/public/home/ScholarshipFlip";
import RealityCheck from "../../components/public/home/RealityCheck";
import HowItWorks from "../../components/public/home/HowItWorks";
import PassForm from "../../components/public/home/PassForm";
import Footer from "../../components/public/layout/Footer";
import { DripDivider, ZAIFAN_NAVY, ZAIFAN_ORANGE } from "../../components/public/destinations/DestinationUI";
import { countryList } from "../../data/countries";
import { italianUniversities } from "../../data/italianUniversities";

// Every university we profile, interleaved country by country so the ticker
// mixes destinations instead of showing 50 Italian names in a row.
const UNIVERSITY_LISTS = countryList.map((country) =>
  country.slug === "italy" ? italianUniversities.map((item) => item.name) : country.universities.map((item) => item.name)
);
const UNIVERSITY_NAMES = Array.from({ length: Math.max(...UNIVERSITY_LISTS.map((list) => list.length)) }, (_, index) =>
  UNIVERSITY_LISTS.map((list) => list[index]).filter(Boolean)
).flat();
const CITY_COUNT = countryList.reduce((sum, country) => sum + (country.cities?.length || 0), 0);

// Italy's DSU system lives in its own explorer rather than the country file.
const ITALY_DSU = {
  name: "DSU Regional Scholarships",
  provider: "Italian regional bodies (DSU Lombardia, LazioDisco, ER.GO and others)",
  covers: "Tuition waiver, a yearly grant, and sometimes housing and meals",
  level: "Bachelor's · Master's",
  note: "Income- and merit-based, with rules that differ by region.",
};

// The headline funding route in each destination.
const SCHOLARSHIPS = countryList
  .map((country) => {
    const scholarship = country.slug === "italy" ? ITALY_DSU : country.scholarships?.[0];
    return scholarship && { ...scholarship, country };
  })
  .filter(Boolean);

const STATS = [
  { label: "Destinations", value: countryList.length },
  { label: "University profiles", value: UNIVERSITY_NAMES.length },
  { label: "Student cities", value: `${CITY_COUNT}+` },
  { label: "First consultation", value: "Free" },
];

// Each section answers one question a student has: where can I go, what will
// you do for me, can I get funding, what is it really like, how does it work
// and how do I start.
// Backgrounds alternate cream with a dark colour, and the dark ones take turns
// (navy, orange, navy) so no colour repeats; a drip marks every change.
function Home() {
  useEffect(() => {
    document.title = "Zaifan Consultancy | Study Abroad Guidance in Pakistan";
  }, []);

  return (
    <>
      <HomeHero stats={STATS} />

      <main className="cv-sections relative">
        <DripDivider background={ZAIFAN_NAVY} />
        <DestinationStrip universityNames={UNIVERSITY_NAMES} />
        <DripDivider color={ZAIFAN_NAVY} background="#fff7ed" />
        <ServicesBento />
        <DripDivider background={ZAIFAN_ORANGE} />
        <ScholarshipFlip scholarships={SCHOLARSHIPS} />
        <DripDivider color={ZAIFAN_ORANGE} background="#fff7ed" />
        <RealityCheck />
        <DripDivider background={ZAIFAN_NAVY} />
        <HowItWorks />
        <DripDivider color={ZAIFAN_NAVY} background="#fff7ed" />
        <PassForm />
      </main>

      <Footer />
    </>
  );
}

export default Home;
