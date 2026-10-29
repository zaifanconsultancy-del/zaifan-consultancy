import { italyData } from "./italy";
import { germanyData } from "./germany";
import { franceData } from "./france";
import { belgiumData } from "./belgium";
import { romaniaData } from "./romania";
import { lithuaniaData } from "./lithuania";
import { turkeyData } from "./turkey";
import { chinaData } from "./china";
import { vietnamData } from "./vietnam";
import { euHubData } from "./eu";
import { germanyDeep } from "./deep/germany";
import { franceDeep } from "./deep/france";
import { belgiumDeep } from "./deep/belgium";
import { romaniaDeep } from "./deep/romania";
import { lithuaniaDeep } from "./deep/lithuania";
import { turkeyDeep } from "./deep/turkey";
import { chinaDeep } from "./deep/china";
import { vietnamDeep } from "./deep/vietnam";

// Practical questions every student asks, phrased for each country.
function sharedFaqs(country) {
  return [
    {
      q: `When should I start planning for ${country.name}?`,
      a: `Ideally 9–12 months before your intake. Documents, tests, applications and visa appointments all take longer than students expect.`,
    },
    {
      q: `Do I need to show a bank statement for ${country.name}?`,
      a: `Yes. Every student visa needs proof that you can cover tuition and living costs. The amount and format differ by country; for ${country.name} we prepare it with you step by step.`,
    },
    {
      q: `Can I change university after arriving in ${country.name}?`,
      a: `Sometimes, but it's never guaranteed and can affect your visa. Choose carefully before applying.`,
    },
    {
      q: `Can my family visit me in ${country.name}?`,
      a: `Family can usually apply for visitor visas, but bringing dependants to live with you needs much more money and paperwork. Ask us about your case.`,
    },
    {
      q: `How can Zaifan help with ${country.name}?`,
      a: `We connect the whole plan: country fit, city, university shortlist, scholarships, documents and visa timeline, with honest advice and no fake guarantees.`,
    },
  ];
}

// Combine a country's base data with its "deep" file: extra cities and
// universities are appended, and per-city / per-university extras are merged
// onto matching slugs.
function withDeep(base, deep) {
  if (!deep) return base;

  const { extraCities = [], cityExtras = {}, extraUniversities = [], universityExtras = {}, moreFaqs = [], ...rest } = deep;

  return {
    ...base,
    ...rest,
    cities: [...base.cities, ...extraCities].map((city) => ({ ...city, ...cityExtras[city.slug] })),
    universities: [...base.universities, ...extraUniversities].map((university) => ({
      ...university,
      ...universityExtras[university.slug],
    })),
    faqs: [...base.faqs, ...moreFaqs, ...sharedFaqs(base)],
  };
}

// Every destination Zaifan covers, in display order.
export const countryRegistry = {
  italy: italyData,
  germany: withDeep(germanyData, germanyDeep),
  france: withDeep(franceData, franceDeep),
  belgium: withDeep(belgiumData, belgiumDeep),
  romania: withDeep(romaniaData, romaniaDeep),
  lithuania: withDeep(lithuaniaData, lithuaniaDeep),
  turkey: withDeep(turkeyData, turkeyDeep),
  china: withDeep(chinaData, chinaDeep),
  vietnam: withDeep(vietnamData, vietnamDeep),
};

export const countryList = Object.values(countryRegistry);
export const euHub = euHubData;

// Every country, Italy included, uses the shared DestinationPage guide (see
// guides.js). Italy keeps its own hand-built city pages.
export function getCountryGuidePath(slug) {
  return `/countries/${slug}`;
}

export function getCountryAppointmentPath(country) {
  const name = typeof country === "string" ? country : country?.name;
  return `/appointment?country=${encodeURIComponent(name || "")}&service=${encodeURIComponent("Study Planning")}`;
}

export function getCountryBySlug(slug) {
  if (!slug) return null;
  return countryRegistry[String(slug).toLowerCase()] || null;
}

export function getCountryByName(name) {
  if (!name) return null;
  const normalized = String(name).trim().toLowerCase();
  return countryList.find((country) => country.name.toLowerCase() === normalized) || null;
}

export function getCityBySlug(country, citySlug) {
  if (!country?.cities || !citySlug) return null;
  return country.cities.find((city) => city.slug === citySlug) || null;
}

export function getUniversitiesForCity(country, citySlug) {
  if (!country?.universities) return [];
  return country.universities.filter((university) => university.citySlug === citySlug);
}

export function getEuCountries() {
  return euHubData.memberSlugs.map((slug) => countryRegistry[slug]).filter(Boolean);
}

export function getLiveCountries() {
  return countryList.filter((country) => country.status === "live");
}
