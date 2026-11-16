import { countryList, euHub } from "./countryRegistry";
import { getDestinationGuide } from "./guides";

// The scholarships page is one short journey in four steps.
export const SCHOLARSHIP_STEPS = [
  { id: "pick", label: "What you need" },
  { id: "matches", label: "Your matches" },
  { id: "rules", label: "Honest rules" },
  { id: "countries", label: "By country" },
];

// What a scholarship can pay for. Worked out from each scholarship's own
// "covers" line, so the tags can never disagree with the text on the card.
export const COVERAGE = [
  { id: "tuition", label: "Tuition fees", short: "Tuition", test: /tuition|\bfees?\b|full scholarship|full cost/i },
  { id: "living", label: "Monthly money", short: "Monthly money", test: /stipend|allowance|grant|cash|living|per month|full scholarship|full cost/i },
  { id: "housing", label: "A room", short: "Room", test: /accommodation|housing|residence/i },
  { id: "travel", label: "Flights", short: "Flights", test: /travel|flight/i },
];

export const LEVELS = [
  { id: "Bachelor", label: "Bachelor's" },
  { id: "Master", label: "Master's" },
  { id: "PhD", label: "PhD" },
];

const EUROPE = { slug: "european-union", code: "EU", name: "Europe" };

function coverageOf(text) {
  return COVERAGE.filter((item) => item.test.test(text)).map((item) => item.id);
}

function build() {
  const list = [];
  const shared = new Map();

  for (const base of countryList) {
    const country = getDestinationGuide(base.slug);
    for (const scholarship of country.scholarships || []) {
      // Erasmus Mundus is one Europe-wide scholarship, listed under several countries.
      if (/^erasmus mundus/i.test(scholarship.name)) {
        const existing = shared.get(scholarship.name);
        if (existing) {
          existing.countrySlugs.push(country.slug);
          continue;
        }
      }
      const covers = coverageOf(scholarship.covers);
      const entry = {
        ...scholarship,
        key: `${country.slug}-${scholarship.name}`,
        country: { slug: country.slug, code: country.code, name: country.name, flagColors: country.flagColors },
        countrySlugs: [country.slug],
        coverage: covers,
        // "Enrolled students" exchanges are open whatever you study.
        anyLevel: /all levels|enrolled/i.test(scholarship.level),
      };
      if (/^erasmus mundus/i.test(scholarship.name)) shared.set(scholarship.name, entry);
      list.push(entry);
    }
  }

  for (const entry of shared.values()) {
    if (entry.countrySlugs.length > 1) {
      entry.key = `europe-${entry.name}`;
      entry.country = EUROPE;
      entry.shared = true;
      // Each country's copy had its own note; the shared one explains the whole scheme.
      entry.note = euHub.erasmusMundus.text;
    }
  }
  return list;
}

export const ALL_SCHOLARSHIPS = build();

/** Scholarships that match the country, the level and everything the student needs paid. */
export function findScholarships({ country = "all", level = "all", needs = [] }) {
  return ALL_SCHOLARSHIPS.filter(
    (item) =>
      (country === "all" || item.countrySlugs.includes(country)) &&
      (level === "all" || item.anyLevel || item.level.includes(level)) &&
      needs.every((need) => item.coverage.includes(need)),
  ).sort((a, b) => b.coverage.length - a.coverage.length);
}

/** One row per country: how many scholarships and the one students ask about most. */
export const SCHOLARSHIPS_BY_COUNTRY = countryList.map((base) => {
  const mine = ALL_SCHOLARSHIPS.filter((item) => item.countrySlugs.includes(base.slug));
  return {
    country: base,
    count: mine.length,
    headline: mine.find((item) => !item.shared) || mine[0] || null,
  };
});

// True for every scholarship, in every country.
export const HONEST_RULES = [
  {
    title: "No scholarship is guaranteed",
    text: "Every award has more applicants than places. Anyone who promises you a scholarship is selling something. We tell you your real chances.",
  },
  {
    title: "Deadlines come before admission",
    text: "Many scholarships close months before the university's own deadline, and some need a separate application. Late means no.",
  },
  {
    title: "Papers take longer than you think",
    text: "Transcripts, income papers, translations and attestations can take many weeks to collect. Start them before anything else.",
  },
  {
    title: "The money can arrive late",
    text: "Some scholarships pay the first instalment weeks or months after you land. You need your own money for the start.",
  },
];

export const COMMON_MISTAKES = [
  "Building the whole budget on scholarship money that has not been awarded yet",
  "Applying to one big scholarship only, with no second or third option",
  "Sending the same motivation letter to every scholarship",
  "Forgetting that the visa officer still asks how you will pay for whatever the scholarship does not cover",
  "Paying an agent for a \"guaranteed\" scholarship",
];
