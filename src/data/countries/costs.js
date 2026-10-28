// Rough conversions so countries with different currencies can be compared on
// one scale. Always labelled as approximate in the UI; exact local-currency
// figures live on each country guide.
export const USD_PER_UNIT = { "€": 1.1, $: 1, "¥": 0.14 };

// Italy's city budgets live in its own hand-built guide, so these monthly
// ranges (EUR, saver → comfort) are kept consistent with that guide.
export const ITALY_CITY_BUDGETS = [
  { slug: "milan", name: "Milan", low: 1000, high: 1600 },
  { slug: "rome", name: "Rome", low: 950, high: 1500 },
  { slug: "florence", name: "Florence", low: 900, high: 1400 },
  { slug: "venice", name: "Venice", low: 900, high: 1400 },
  { slug: "bologna", name: "Bologna", low: 850, high: 1300 },
  { slug: "padua", name: "Padua", low: 750, high: 1150 },
  { slug: "turin", name: "Turin", low: 750, high: 1150 },
  { slug: "pisa", name: "Pisa", low: 750, high: 1150 },
];

// Italy's public tuition range per year (EUR), matching its guide.
const ITALY_TUITION = { min: 900, max: 4000 };

/** Every city with budget data, as monthly US$ ranges. */
export function citiesInUsd(country) {
  if (country.slug === "italy") {
    return ITALY_CITY_BUDGETS.map((city) => ({
      ...city,
      path: `/countries/italy/${city.slug}`,
      low: city.low * USD_PER_UNIT["€"],
      high: city.high * USD_PER_UNIT["€"],
    }));
  }

  const rate = USD_PER_UNIT[country.currencySymbol] || 1;
  return (country.cities || [])
    .filter((city) => city.budget)
    .map((city) => {
      const values = Object.values(city.budget);
      return {
        slug: city.slug,
        name: city.name,
        path: `/countries/${country.slug}/${city.slug}`,
        low: values.reduce((sum, [low]) => sum + low, 0) * rate,
        high: values.reduce((sum, [, high]) => sum + high, 0) * rate,
      };
    });
}

function roundTo(value, step) {
  return Math.round(value / step) * step;
}

/**
 * The cheapest realistic starting point in each country, in US$: lowest paid
 * tuition option per year, cheapest city per month, and the two combined for
 * a first year. Scholarship rows (tuition 0) are ignored.
 */
export function costSnapshot(country) {
  const rate = country.slug === "italy" ? USD_PER_UNIT["€"] : USD_PER_UNIT[country.currencySymbol] || 1;
  const paidOptions = (country.tuitionOptions || []).filter((option) => option.min > 0);
  const tuitionLocal = country.slug === "italy" ? ITALY_TUITION.min : Math.min(...paidOptions.map((option) => option.min));
  const tuition = Number.isFinite(tuitionLocal) ? tuitionLocal * rate : null;

  const cities = citiesInUsd(country);
  const living = cities.length ? Math.min(...cities.map((city) => city.low)) : null;

  return {
    tuitionPerYear: tuition === null ? null : roundTo(tuition, 50),
    livingPerMonth: living === null ? null : roundTo(living, 10),
    firstYear: tuition === null || living === null ? null : roundTo(tuition + living * 12, 100),
  };
}

export function formatUsd(value) {
  if (value === null || value === undefined) return "Ask us";
  return `≈ $${value.toLocaleString("en-US")}`;
}
