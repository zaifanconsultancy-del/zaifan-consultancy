import { useEffect } from "react";

import HomeHero from "../../components/public/home/HomeHero";
import DestinationCards from "../../components/public/home/DestinationCards";
import MatchQuiz from "../../components/public/home/MatchQuiz";
import ScholarshipFlip from "../../components/public/home/ScholarshipFlip";
import ReadyChecklist from "../../components/public/home/ReadyChecklist";
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

// Each section answers one question a student has: where can I go, which
// country suits me, can I get funding, what should I prepare, how does it work
// and how do I start.
// Light sections get liquid drips; dark sections rise in with a rounded top.
function Home() {
  useEffect(() => {
    document.title = "Zaifan Consultancy | Study Abroad Guidance in Pakistan";
  }, []);

  return (
    <>
      <HomeHero stats={STATS} />

      <main className="cv-sections relative">
        <DripDivider background={ZAIFAN_NAVY} />
        <DestinationCards universityNames={UNIVERSITY_NAMES} />
        <DripDivider color={ZAIFAN_NAVY} background="#fff7ed" />
        <MatchQuiz />
        <DripDivider background={ZAIFAN_NAVY} />
        <ScholarshipFlip scholarships={SCHOLARSHIPS} />
        <DripDivider color={ZAIFAN_NAVY} background="#fff7ed" />
        <ReadyChecklist />
        <DripDivider background={ZAIFAN_ORANGE} />
        <HowItWorks />
        <DripDivider color={ZAIFAN_ORANGE} background="#fff7ed" />
        <PassForm />
      </main>

      <Footer />
    </>
  );
}

export default Home;
