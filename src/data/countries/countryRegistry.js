import { italyData } from "./italy";

const germanyData = {
  slug: "germany",
  name: "Germany",
  flag: "🇩🇪",
  status: "coming-soon",
  badge: "Coming Soon",
  headline: "Study in Germany",
  shortDescription:
    "Public universities, engineering routes and low-tuition study pathways planned for a future rollout.",
  routes: {
    countryGuide: "/countries",
    universities: "/universities",
    scholarships: "/scholarships",
    appointment: "/appointment?country=Germany&service=Study Planning",
  },
};

const ukData = {
  slug: "united-kingdom",
  name: "United Kingdom",
  flag: "🇬🇧",
  status: "coming-soon",
  badge: "Coming Soon",
  headline: "Study in the UK",
  shortDescription:
    "UK universities, scholarships and fast-track degree routes planned after Italy is complete.",
  routes: {
    countryGuide: "/countries",
    universities: "/universities",
    scholarships: "/scholarships",
    appointment: "/appointment?country=United Kingdom&service=Study Planning",
  },
};

const canadaData = {
  slug: "canada",
  name: "Canada",
  flag: "🇨🇦",
  status: "coming-soon",
  badge: "Coming Soon",
  headline: "Study in Canada",
  shortDescription:
    "Canada colleges, universities and post-study pathways will be added when real data is ready.",
  routes: {
    countryGuide: "/countries",
    universities: "/universities",
    scholarships: "/scholarships",
    appointment: "/appointment?country=Canada&service=Study Planning",
  },
};

const australiaData = {
  slug: "australia",
  name: "Australia",
  flag: "🇦🇺",
  status: "coming-soon",
  badge: "Coming Soon",
  headline: "Study in Australia",
  shortDescription:
    "Australian universities and lifestyle-focused study routes are planned for a future expansion.",
  routes: {
    countryGuide: "/countries",
    universities: "/universities",
    scholarships: "/scholarships",
    appointment: "/appointment?country=Australia&service=Study Planning",
  },
};

const turkeyData = {
  slug: "turkey",
  name: "Turkey",
  flag: "🇹🇷",
  status: "coming-soon",
  badge: "Coming Soon",
  headline: "Study in Turkey",
  shortDescription:
    "Affordable education routes and future partner pathways are planned for a later rollout.",
  routes: {
    countryGuide: "/countries",
    universities: "/universities",
    scholarships: "/scholarships",
    appointment: "/appointment?country=Turkey&service=Study Planning",
  },
};

export const countryRegistry = {
  italy: italyData,
  germany: germanyData,
  "united-kingdom": ukData,
  canada: canadaData,
  australia: australiaData,
  turkey: turkeyData,
};

export const countryList = Object.values(countryRegistry);

export function getCountryBySlug(slug) {
  if (!slug) return null;
  return countryRegistry[String(slug).toLowerCase()] || null;
}

export function getLiveCountries() {
  return countryList.filter((country) => country.status === "live");
}

export function getComingSoonCountries() {
  return countryList.filter((country) => country.status !== "live");
}

export function isCountryLive(slug) {
  return getCountryBySlug(slug)?.status === "live";
}