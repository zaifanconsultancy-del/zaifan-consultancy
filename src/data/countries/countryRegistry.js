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
    faqs: [...base.faqs, ...moreFaqs],
  };
}

// Every destination Zaifan covers, in display order.
export const countryRegistry = {
  italy: italyData,
  germany: withDeep(germanyData, germanyDeep),
  france: franceData,
  belgium: belgiumData,
  romania: romaniaData,
  lithuania: lithuaniaData,
  turkey: turkeyData,
  china: chinaData,
  vietnam: vietnamData,
};

export const countryList = Object.values(countryRegistry);
export const euHub = euHubData;

// Italy has its own hand-built guide and city pages; every other country uses
// the shared CountryGuidePage / CountryCityPage templates.
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
