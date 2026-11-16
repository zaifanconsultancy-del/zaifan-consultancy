import { getDestinationGuide } from "./guides";
import { findItalianCityBySlug } from "../italianCities";

// A city page is one short journey in five steps; each section is one step.
export const CITY_STEPS = [
  { id: "fit", label: "Is it for me?" },
  { id: "budget", label: "Monthly money" },
  { id: "universities", label: "Universities" },
  { id: "life", label: "Daily life" },
  { id: "compare", label: "Compare cities" },
];

// Italy's cities were written before the other countries got "good fit /
// think twice" lists, so theirs live here.
const ITALY_CITY_FIT = {
  milan: {
    good: ["Business, design, fashion or engineering", "Internships and part-time work while you study", "A big, international city"],
    consider: ["Italy's highest rents", "Rooms must be found early", "Fast and busy, not a quiet student town"],
  },
  rome: {
    good: ["Medicine, law, humanities or architecture", "Big public universities like Sapienza", "Capital-city life with every embassy and office nearby"],
    consider: ["Long commutes across a very big city", "High rent near the centre", "Offices and paperwork can be slow"],
  },
  bologna: {
    good: ["Classic student-city life", "Humanities, law, economics and sciences", "A regional scholarship (ER.GO) with clear rules"],
    consider: ["Rooms are scarce and go very fast", "Rent has risen a lot", "Mostly one big university to choose from"],
  },
  padua: {
    good: ["Tight budgets", "Research, medicine, engineering and psychology", "A calm city with students everywhere"],
    consider: ["Small city with quieter evenings", "Fewer part-time jobs than Milan", "Foggy winters and humid summers"],
  },
  florence: {
    good: ["Arts, architecture, fashion and humanities", "Living inside a walkable historic city", "Tuscany's regional scholarship (DSU Toscana)"],
    consider: ["Tourist prices in the centre", "Limited student housing", "Fewer engineering and tech options"],
  },
  turin: {
    good: ["Engineering and automotive at Politecnico di Torino", "Lower rent than Milan", "A big city with industry around it"],
    consider: ["Cold, grey winters", "Less international than Milan", "Italian helps a lot for part-time work"],
  },
  pisa: {
    good: ["Computer science, physics and engineering", "A small, affordable, walkable city", "Tuscany's regional scholarship (DSU Toscana)"],
    consider: ["Very small city", "Few part-time jobs", "Quiet outside term time"],
  },
  venice: {
    good: ["Languages, economics, tourism and arts", "Ca' Foscari's international programmes", "A one-of-a-kind place to live"],
    consider: ["Rooms on the island are scarce and costly", "Many students live in Mestre and travel in", "Crowds of tourists most of the year"],
  },
};

function total(budget) {
  if (!budget) return null;
  return Object.values(budget).reduce((sum, [low, high]) => ({ low: sum.low + low, high: sum.high + high }), { low: 0, high: 0 });
}

// "Shared flats are common" and { title, text } both become { title, text }.
function lifeNotes(items = []) {
  return items.map((item) => (typeof item === "string" ? { title: null, text: item } : item));
}

function cityFaqs(city, country, universities, totals, cheaper) {
  const symbol = country.currencySymbol || "";
  const life = (icon) => country.studentLife?.find((item) => item.icon === icon)?.text;
  const range = totals ? `${symbol}${totals.low.toLocaleString("en-US")} – ${symbol}${totals.high.toLocaleString("en-US")}` : null;

  return [
    {
      q: `How much does it cost to live in ${city.name} as a student?`,
      a: range
        ? `Plan for roughly ${range} a month for rent, food, transport and everyday costs, depending on how you live. Tuition is separate.`
        : `${city.name} is rated "${city.livingCost}" for living costs. We build an exact budget with you.`,
    },
    {
      q: `Is ${city.name} cheaper than other cities in ${country.name}?`,
      a: cheaper.length
        ? `These cities cost less per month: ${cheaper.join(", ")}. Step 5 on this page puts every city side by side.`
        : `Yes. ${city.name} is the cheapest city we cover in ${country.name}.`,
    },
    {
      q: `Which universities can I study at in ${city.name}?`,
      a: universities.length
        ? `${universities.map((item) => item.name).join(", ")}. Each one has a full profile on this site.`
        : `Ask us for the current university options in ${city.name}.`,
    },
    {
      q: `Is it easy to find a room in ${city.name}?`,
      a: life("home") || "Start searching as soon as you are admitted; good rooms go quickly in student cities.",
    },
    {
      q: `Can I find halal food in ${city.name}?`,
      a: life("utensils") || `Most big student cities in ${country.name} have halal shops and restaurants. We share local tips before you travel.`,
    },
    {
      q: `Are there other Pakistani students in ${city.name}?`,
      a: life("users") || `${country.name} has a growing Pakistani student community. We connect you with students already there where we can.`,
    },
    {
      q: `Can I work part-time in ${city.name}?`,
      a: `${country.name}'s rules: ${country.quickFacts.work}. Bigger cities usually have more part-time jobs, but also higher rent.`,
    },
    {
      q: `Is ${city.name} a good choice for ${city.bestFor[0]}?`,
      a: `${city.name} is best known for ${city.bestFor.join(", ")}.${city.fit?.good?.length ? ` It suits students who want: ${city.fit.good.join("; ")}.` : ""}`,
    },
  ];
}

/** Everything one city page needs, in the same shape for every country. */
export function getCityGuide(countrySlug, citySlug) {
  const country = getDestinationGuide(countrySlug);
  const listed = country?.cities?.find((item) => item.slug === citySlug);
  if (!listed) return null;

  const italian = country.slug === "italy" ? findItalianCityBySlug(citySlug) : null;
  const raw = { ...italian, ...listed, fit: listed.fit || ITALY_CITY_FIT[citySlug] || null };
  const totals = total(raw.budget);
  const universities = country.universities.filter((university) => university.citySlug === citySlug);

  const city = {
    ...raw,
    path: `/countries/${country.slug}/${raw.slug}`,
    totals,
    highlights: raw.highlights || [],
    costCards: raw.costCards || [],
    studentLife: lifeNotes(raw.studentLife),
    // A campus in this city, used as the hero picture when we have one.
    photoUniversity: universities.find((university) => university.photo) || null,
  };

  // Every city in the country with a budget, cheapest first, for the comparison.
  const ladder = country.cities
    .map((item) => ({ slug: item.slug, name: item.name, emoji: item.emoji, livingCost: item.livingCost, bestFor: item.bestFor, path: `/countries/${country.slug}/${item.slug}`, totals: total(item.budget) }))
    .filter((item) => item.totals)
    .sort((a, b) => a.totals.low + a.totals.high - (b.totals.low + b.totals.high));

  const rank = ladder.findIndex((item) => item.slug === citySlug) + 1;

  return {
    country,
    city,
    universities,
    ladder,
    rank,
    faqs: cityFaqs(city, country, universities, totals, ladder.slice(0, Math.max(rank - 1, 0)).map((item) => item.name)),
  };
}
