import { countryList, getCountryBySlug } from "../countries/countryRegistry";
import { italianUniversities } from "../italianUniversities";
import { italianCities } from "../italianCities";
import { ITALY_UNIVERSITY_EXTRAS } from "./italyExtras";
import { APPLY_VIA, ITALY_CONTEXT, ITALY_WEBSITES } from "./italyContext";
import { UNIVERSITY_FACTS } from "./universityFacts";
import { UNIVERSITY_PHOTOS } from "./universityPhotos";

// One list of every university Zaifan covers, in one shape, so the finder and
// the profile page treat all nine countries the same way.

const ITALY_BANDS = { Budget: "Low", Moderate: "Moderate", Premium: "High" };
const ITALY_CITY_SLUGS = new Set(italianCities.map((city) => city.slug));

// Broad subject groups for the finder, matched against each university's
// programmes and "popular for" line.
export const SUBJECTS = [
  { id: "engineering", label: "Engineering", match: /engineer|mechanic|electric|civil|aerospace|automotive|robot|polytechn|technolog|energy|materials|optoelectronic|geodesy|maritime|marine/i },
  { id: "computing", label: "Computer Science & IT", match: /computer|comput|software|data|informatic|\bit\b|ai\b|artificial|cyber|electronics|information/i },
  { id: "medicine", label: "Medicine & Health", match: /medic|mbbs|health|pharma|dentist|nurs|biomed|veterinar|life science|public health|tropical/i },
  { id: "business", label: "Business & Economics", match: /business|econom|management|financ|commerce|trade|marketing|account|mba|banking|tourism/i },
  { id: "design", label: "Design, Art & Architecture", match: /design|architect|fashion|art|urban|interior|creative|media|communication|film/i },
  { id: "science", label: "Natural Sciences", match: /physic|chemi|biolog|science|mathemat|environment|agricult|food|geolog|remote sensing|climate/i },
  { id: "law", label: "Law, Politics & Society", match: /law|politic|international relations|social|sociolog|public|psycholog|government|security/i },
  { id: "humanities", label: "Humanities & Languages", match: /humanit|language|literat|history|philosoph|classic|education|linguist|asian studies|archae/i },
];

function subjectsOf(programs, popularFor) {
  const text = [...programs, popularFor].join(" · ");
  return SUBJECTS.filter((subject) => subject.match.test(text)).map((subject) => subject.id);
}

function englishLevel(english = "") {
  // Only notes that say (nearly) everything is in English count as "most";
  // "Mostly Turkish-taught" and "Large range of… in English" do not.
  return /^(all|most\b(?!ly)|programmes (taught )?in english|master's and phd programmes in english|medicine taught fully)/i.test(english)
    ? "most"
    : "some";
}

function withShared(university) {
  const facts = UNIVERSITY_FACTS[university.slug] || {};
  const photo = UNIVERSITY_PHOTOS[university.slug] || null;
  return {
    ...university,
    founded: facts.founded ?? null,
    students: facts.students ?? null,
    fact: facts.fact || null,
    photo,
    subjects: subjectsOf(university.programs, university.popularFor),
    englishLevel: englishLevel(university.english),
    applyVia: APPLY_VIA[university.countrySlug],
  };
}

const italyUniversities = italianUniversities.map((university) => {
  const extras = ITALY_UNIVERSITY_EXTRAS[university.slug] || {};
  const citySlug = university.city.toLowerCase().replace(/['’]/g, "").replace(/\s+/g, "-");
  return withShared({
    key: `italy-${university.slug}`,
    countrySlug: "italy",
    slug: university.slug,
    name: university.name,
    city: university.city,
    region: university.region,
    citySlug: ITALY_CITY_SLUGS.has(citySlug) ? citySlug : null,
    type: university.type,
    tuitionBand: ITALY_BANDS[university.tuitionLevel] || "Moderate",
    tuitionNote: `${university.tuition} per year, depending on family income`,
    programs: university.programs || [],
    popularFor: university.popularFor,
    website: ITALY_WEBSITES[university.slug],
    about: extras.about,
    highlights: extras.highlights || [],
    english: extras.english,
    intake: university.intake,
    scholarshipNote: `${university.scholarship}. ${university.scholarshipStrength} scholarship chances.`,
    rankingNote: university.rankingNote,
    path: `/universities/${university.slug}`,
  });
});

const otherUniversities = countryList
  .filter((country) => country.slug !== "italy")
  .flatMap((country) =>
    (country.universities || []).map((university) =>
      withShared({
        ...university,
        key: `${country.slug}-${university.slug}`,
        countrySlug: country.slug,
        highlights: university.highlights || [],
        intake: country.quickFacts?.intakes,
        path: `/countries/${country.slug}/universities/${university.slug}`,
      })
    )
  );

// Round-robin across countries so the full list doesn't open with 50 Italian
// entries in a row. Each country's own order is preserved.
function interleaveByCountry(universities) {
  const groups = countryList.map((country) => universities.filter((university) => university.countrySlug === country.slug));
  const longest = Math.max(...groups.map((group) => group.length));
  return Array.from({ length: longest }, (_, index) => groups.map((group) => group[index]).filter(Boolean)).flat();
}

export const allUniversities = interleaveByCountry([...italyUniversities, ...otherUniversities]);

export function findUniversity(countrySlug, slug) {
  return allUniversities.find((university) => university.countrySlug === countrySlug && university.slug === slug) || null;
}

/** The country-level facts a profile needs (Italy's live in ITALY_CONTEXT). */
export function countryContextFor(countrySlug) {
  const country = getCountryBySlug(countrySlug);
  if (!country) return null;
  if (countrySlug !== "italy") return country;
  return { ...country, ...ITALY_CONTEXT, quickFacts: { ...country.quickFacts, ...ITALY_CONTEXT.quickFacts } };
}

/** Universities most like this one: same city first, then shared subjects and type. */
export function similarUniversities(university, limit = 4) {
  const score = (other) =>
    (other.countrySlug === university.countrySlug ? 3 : 0) +
    (other.city === university.city ? 4 : 0) +
    (other.type === university.type ? 1 : 0) +
    other.subjects.filter((subject) => university.subjects.includes(subject)).length * 2 +
    (other.photo ? 0.5 : 0);

  return allUniversities
    .filter((other) => other.key !== university.key)
    .map((other) => ({ other, value: score(other) }))
    .sort((a, b) => b.value - a.value)
    .slice(0, limit)
    .map(({ other }) => other);
}

export function formatStudents(students) {
  if (!students) return null;
  return `≈ ${students.toLocaleString("en-US")}`;
}

export const TUITION_BANDS = {
  Low: { label: "Low fees", tone: "bg-emerald-100 text-emerald-800" },
  Moderate: { label: "Mid fees", tone: "bg-amber-100 text-amber-800" },
  High: { label: "Higher fees", tone: "bg-rose-100 text-rose-800" },
};
