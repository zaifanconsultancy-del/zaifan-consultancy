import { italianCities } from "../../../data/italianCities";
import { ITALY_CITY_BUDGETS } from "../../../data/countries/costs";

// Builds the parts of a university profile that combine the university's own
// data with its country and city: the fit check, city money and the FAQs.

const BIG_CITY_RENT = 600; // monthly rent in € above which we warn about housing

/** The city a university sits in, with a monthly budget where we have one. */
export function cityFor(university, country) {
  if (university.countrySlug === "italy") {
    const city = italianCities.find((item) => item.slug === university.citySlug);
    const budget = ITALY_CITY_BUDGETS.find((item) => item.slug === university.citySlug);
    if (!city) return null;
    return {
      name: city.name,
      headline: city.headline,
      intro: city.intro,
      life: city.studentLife.map((item) => item.title),
      costCards: city.costCards,
      monthly: budget ? [budget.low, budget.high] : null,
      breakdown: null,
      scholarshipNote: city.scholarshipNote,
      path: `/countries/italy/${city.slug}`,
    };
  }

  const city = country.cities?.find((item) => item.slug === university.citySlug);
  if (!city) return null;
  const breakdown = city.budget
    ? Object.entries(city.budget).map(([key, [low, high]]) => ({ key, low, high }))
    : null;
  return {
    name: city.name,
    headline: city.headline,
    intro: city.intro,
    life: city.studentLife || [],
    costCards: city.costCards || [],
    monthly: breakdown ? [breakdown.reduce((sum, row) => sum + row.low, 0), breakdown.reduce((sum, row) => sum + row.high, 0)] : null,
    breakdown,
    scholarshipNote: city.scholarshipNote,
    path: `/countries/${country.slug}/${city.slug}`,
  };
}

export function money(value, symbol) {
  if (symbol === "$") return `$${value.toLocaleString("en-US")}`;
  return `${symbol}${value.toLocaleString("en-US")}`;
}

/** "Good fit if" and "Think twice if" lists, built from the real data. */
export function fitFor(university, country, city) {
  const good = [];
  const caution = [];
  const programs = university.programs.slice(0, 3).join(", ");

  good.push(`You want to study ${programs.toLowerCase().replace(/\b(ai|it|mbbs)\b/g, (word) => word.toUpperCase())}`);
  if (university.englishLevel === "most") good.push("You want your whole degree taught in English");
  if (university.tuitionBand === "Low") good.push("You need to keep tuition fees low");
  if (university.type === "Technical") good.push("You're aiming for an engineering or tech career");
  if (university.type === "Private") good.push("You want smaller classes and close links with companies");
  if (university.founded && university.founded < 1600) good.push("You'd like a famous, centuries-old name on your degree");
  if (university.students && university.students < 8000) good.push("You prefer a smaller university where staff know you");
  if (city) good.push(`You like the sound of student life in ${city.name}`);

  if (university.englishLevel !== "most") caution.push("Only some programmes are taught in English, so check yours before applying");
  if (university.tuitionBand === "High") caution.push("Fees are higher than at public universities, so plan the full budget first");
  if (country.slug === "france" && university.englishLevel !== "most") caution.push("Many bachelor's programmes are taught in French");
  const euroRent = country.slug === "italy" || country.currencySymbol === "€";
  if (euroRent && (city?.breakdown?.find((row) => row.key === "rent")?.high > BIG_CITY_RENT || city?.monthly?.[1] >= 1400))
    caution.push(`Rent in ${city.name} is among the highest in ${country.name}, so start your housing search early`);
  if (university.students && university.students > 50000) caution.push("It's a very large university, so you'll need to be independent and organised");
  // The country's own biggest "don't choose this if…" point.
  if (country.decision?.avoid?.[0]) caution.unshift(country.decision.avoid[0]);

  return { good: good.slice(0, 5), caution: [...new Set(caution)].slice(0, 4) };
}

/** Questions students really ask about this university, answered from the data. */
export function faqsFor(university, country, context, city) {
  const name = university.name;
  const scholarships = (context.scholarships || []).slice(0, 2).map((item) => item.name);
  const faqs = [
    {
      q: `Can I study at ${name} in English?`,
      a: `${university.english || "Some programmes are taught in English."} Each programme lists its own language and English test score, so we check yours before you apply.`,
    },
    {
      q: `How much does ${name} cost?`,
      a: `Tuition: ${university.tuitionNote}. On top of that, budget for living costs${city?.monthly ? ` of about ${money(city.monthly[0], country.currencySymbol || "€")}–${money(city.monthly[1], country.currencySymbol || "€")} a month in ${city.name}` : ` (${context.quickFacts?.living || "ask us for current figures"})`}.`,
    },
    {
      q: `How do I apply to ${name} from Pakistan?`,
      a: `You apply through ${university.applyVia.charAt(0).toLowerCase()}${university.applyVia.slice(1)}. ${context.admissionSteps?.[0]?.text || ""} We handle the application, document attestation and visa file with you.`,
    },
    {
      q: `When does ${name} start?`,
      a: `Courses start in ${(university.intake || context.quickFacts?.intakes || "September").replace(/·/g, "or")}. Applications usually close several months earlier, and popular programmes fill up first.`,
    },
    {
      q: `Can I get a scholarship at ${name}?`,
      a: `${university.scholarshipNote ? `${university.scholarshipNote} ` : ""}Pakistani students at ${name} can also look at ${scholarships.join(" and ") || "university and government scholarships"}. No scholarship is guaranteed, so always plan a backup budget.`,
    },
    {
      q: `Can I work while studying in ${country.name}?`,
      a: `${context.quickFacts?.work ? `Yes: ${context.quickFacts.work}.` : "Usually part-time, with limits."} After graduating: ${context.quickFacts?.postStudy || "ask us about your options"}. Don't build your budget around part-time income.`,
    },
  ];
  return faqs;
}
