import { countryList } from "../../../data/countries";
import { citiesInUsd, costSnapshot } from "../../../data/countries/costs";
import { COST_LEVEL, COUNTRY_TRAITS, GATEWAYS, TRAIT_LABELS } from "../../../data/countries/destinationProfiles";

// Everything the Countries page draws from, worked out once at import.

export const SNAPSHOTS = Object.fromEntries(countryList.map((country) => [country.slug, costSnapshot(country)]));
export const CITIES = Object.fromEntries(countryList.map((country) => [country.slug, citiesInUsd(country)]));

export function firstPart(text) {
  return String(text).split("·")[0].trim();
}

export function traitsOf(country, count) {
  const traits = COUNTRY_TRAITS[country.slug] || [];
  return (count ? traits.slice(0, count) : traits).map((trait) => ({ id: trait, label: TRAIT_LABELS[trait] }));
}

export function priceTag(country) {
  return "$".repeat(COST_LEVEL[country.slug] || 2);
}

export function gatewayOf(country) {
  return GATEWAYS[country.slug] || { airport: country.code, city: country.name };
}

// The most expensive value of each cost, so bars can be drawn against it.
export const MAX_COST = ["firstYear", "tuitionPerYear", "livingPerMonth"].reduce(
  (max, key) => ({ ...max, [key]: Math.max(...Object.values(SNAPSHOTS).map((snapshot) => snapshot[key] ?? 0)) }),
  {},
);

// The page is one journey in four steps; each section is one step.
export const STEPS = [
  { id: "shortlist", label: "Shortlist", hint: "Tap the countries you like" },
  { id: "lineup", label: "Compare", hint: "See all nine side by side" },
  { id: "budget", label: "Budget", hint: "See which cities your money covers" },
  { id: "documents", label: "Documents", hint: "Tick off your document list" },
];
