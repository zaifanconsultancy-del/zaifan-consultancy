import {
  belgiumMeta,
  chinaMeta,
  franceMeta,
  germanyMeta,
  italyMeta,
  lithuaniaMeta,
  romaniaMeta,
  turkeyMeta,
  vietnamMeta,
} from "./meta";

// Lightweight list of destinations (same order as the full registry) for
// components that appear on every page. Import the full registry from
// "./countryRegistry" only where cities, universities or guides are needed.
export const countryIndex = [
  italyMeta,
  germanyMeta,
  franceMeta,
  belgiumMeta,
  romaniaMeta,
  lithuaniaMeta,
  turkeyMeta,
  chinaMeta,
  vietnamMeta,
];

export function getCountryMetaBySlug(slug) {
  if (!slug) return null;
  const normalized = String(slug).toLowerCase();
  return countryIndex.find((country) => country.slug === normalized) || null;
}

export function getCountryMetaByName(name) {
  if (!name) return null;
  const normalized = String(name).trim().toLowerCase();
  return countryIndex.find((country) => country.name.toLowerCase() === normalized) || null;
}
