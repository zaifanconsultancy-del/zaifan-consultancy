// Lightweight identity data for every destination: names, flags, regions and
// quick facts. Used by the navbar, footer, hero and forms so they don't pull in
// the full country guides (cities, universities, deep content).
// The full data files spread these objects, so this is the single source.

export const italyMeta = {
  slug: "italy",
  name: "Italy",
  code: "IT",
  flag: "🇮🇹",
  flagColors: ["#009246", "#ffffff", "#ce2b37"],
  status: "live",
  badge: "Live Now",
  region: "Southern Europe",
  inEU: true,
  schengen: true,
  currency: "EUR (€)",
  headline: "Study in Italy",
  tagline: "Income-based tuition, DSU regional scholarships and historic student cities.",
  shortDescription:
    "Affordable public universities, DSU scholarship routes, rich student cities and strong Europe exposure.",

  // Shared shape used by the Countries comparison and Destinations menu.
  quickFacts: {
    tuition: "≈ €900 – €4k / year",
    tuitionNote: "Public universities set fees by family income (ISEE); many students pay near the minimum.",
    living: "≈ €700 – €1,100 / month",
    livingNote: "Milan is the most expensive; southern cities are cheaper.",
    intakes: "September (main) · February (some)",
    language: "Italian · many English-taught programmes",
    work: "20 h/week (1,040 h/year)",
    postStudy: "Up to 12-month job search permit",
    visa: "Type D study visa via Universitaly",
  },
};

export const germanyMeta = {
  slug: "germany",
  name: "Germany",
  code: "DE",
  flag: "🇩🇪",
  flagColors: ["#111111", "#dd0000", "#ffce00"],
  status: "live",
  region: "Western Europe",
  inEU: true,
  schengen: true,
  currency: "EUR (€)",
  headline: "Study in Germany",
  tagline: "World-class engineering, near-zero tuition at most public universities.",
  intro:
    "Germany is one of the strongest value destinations in the world. Most public universities charge little or no tuition, the post-study job search window is generous, and engineering, IT and research routes are globally respected. The trade-off is planning: a blocked account, long embassy queues and strict academic eligibility checks.",
  shortDescription:
    "Low or no tuition at most public universities, top engineering and research, and an 18-month post-study job search permit.",

  quickFacts: {
    tuition: "€0 – €3k / semester",
    tuitionNote:
      "Most public universities charge only a semester contribution (≈ €150–€400). Baden-Württemberg charges non-EU students €1,500 per semester; TUM charges new non-EU students €2,000–€6,000 per semester.",
    living: "≈ €992 / month",
    livingNote: "This is the official blocked-account amount for the student visa (€11,904 per year). Munich and Frankfurt usually cost more.",
    intakes: "Winter (Oct) · Summer (Apr)",
    language: "German · many English-taught master's",
    work: "140 full / 280 half days per year",
    postStudy: "18-month job search permit",
    visa: "National (D) student visa",
  },
};

export const franceMeta = {
  slug: "france",
  name: "France",
  code: "FR",
  flag: "🇫🇷",
  flagColors: ["#0055a4", "#ffffff", "#ef4135"],
  status: "live",
  region: "Western Europe",
  inEU: true,
  schengen: true,
  currency: "EUR (€)",
  headline: "Study in France",
  tagline: "State-set tuition, prestigious grandes écoles and a post-study job search year.",
  intro:
    "France combines affordable public universities with famous grandes écoles, business schools and research centres. Tuition at public universities is set by the state, many master's programmes are taught in English, and students can work part-time and get housing aid. Pakistani students apply through the Campus France 'Études en France' procedure.",
  shortDescription:
    "State-set public tuition, top grandes écoles and business schools, housing aid and a one-year job search permit after a master's.",

  quickFacts: {
    tuition: "≈ €2,900 – €3,950 / year",
    tuitionNote:
      "State-set fees for non-EU students at public universities: about €2,900 for a licence (bachelor's) and €3,950 for a master's (2026–27, set by decree). Grandes écoles and business schools charge more.",
    living: "≈ €700 – €1,200 / month",
    livingNote: "Paris is the most expensive. Visa applicants must show at least about €615 per month in resources.",
    intakes: "September (main) · January (some)",
    language: "French · many English-taught master's",
    work: "964 hours per year",
    postStudy: "1-year job search permit (master's)",
    visa: "VLS-TS long-stay student visa",
  },
};

export const belgiumMeta = {
  slug: "belgium",
  name: "Belgium",
  code: "BE",
  flag: "🇧🇪",
  flagColors: ["#000000", "#fdda24", "#ef3340"],
  status: "live",
  region: "Western Europe",
  inEU: true,
  schengen: true,
  currency: "EUR (€)",
  headline: "Study in Belgium",
  tagline: "Top research universities at the heart of the EU, with a post-study search year.",
  intro:
    "Belgium is home to the EU institutions and to highly ranked universities like KU Leuven and Ghent University. Many master's programmes are taught in English, tuition is moderate by Western European standards, and graduates get a 12-month search year to find work.",
  shortDescription:
    "KU Leuven, Ghent and other top universities, English-taught master's, moderate tuition and a 12-month search year.",

  quickFacts: {
    tuition: "≈ €4k – €12k / year",
    tuitionNote:
      "Non-EU fees vary by university and programme. At French-speaking universities, non-exempt non-EU students pay about €5,010 (e.g. UCLouvain: €835 + €4,175 contribution); Flemish universities set their own fees.",
    living: "≈ €1,062 / month (proof)",
    livingNote: "Minimum proof of means for 2026–27 is about €1,062 net per month (≈ €12,700 per year), up from €835 in 2025–26.",
    intakes: "September (main) · February (some)",
    language: "Dutch · French · many English-taught master's",
    work: "Up to 20 h/week in term",
    postStudy: "12-month search year",
    visa: "Type D long-stay student visa",
  },
};

export const romaniaMeta = {
  slug: "romania",
  name: "Romania",
  code: "RO",
  flag: "🇷🇴",
  flagColors: ["#002b7f", "#fcd116", "#ce1126"],
  status: "live",
  region: "South-Eastern Europe",
  inEU: true,
  schengen: true,
  currency: "Romanian Leu (RON)",
  headline: "Study in Romania",
  tagline: "An EU degree at some of the lowest fees in Europe, famous for medicine in English.",
  intro:
    "Romania offers EU-recognised degrees with low tuition and low living costs. It is especially known for English-taught medicine, dentistry and pharmacy at its universities of medicine and pharmacy (UMF). Non-EU students need a Letter of Acceptance from the Ministry of Education before the visa, so starting early is essential.",
  shortDescription:
    "Low-cost EU degrees, English-taught medicine at UMF universities and a full Schengen member since 2025.",

  quickFacts: {
    tuition: "≈ €2k – €3.5k / year",
    tuitionNote:
      "Typical non-EU fees for bachelor's/master's at state universities (often quoted per month). English-taught medicine usually costs ≈ €5,000–€7,500 per year.",
    living: "≈ €400 – €700 / month",
    livingNote: "Bucharest and Cluj are the priciest. University dorms are very cheap where available.",
    intakes: "October",
    language: "Romanian (prep year) · English · French",
    work: "Part-time allowed (limited hours)",
    postStudy: "Change status with a job offer",
    visa: "Long-stay student visa (D/SD)",
  },
};

export const lithuaniaMeta = {
  slug: "lithuania",
  name: "Lithuania",
  code: "LT",
  flag: "🇱🇹",
  flagColors: ["#fdb913", "#006a44", "#c1272d"],
  status: "live",
  region: "Baltic / Northern Europe",
  inEU: true,
  schengen: true,
  currency: "EUR (€)",
  headline: "Study in Lithuania",
  tagline: "Affordable, English-taught EU degrees in a safe, digital Baltic country.",
  intro:
    "Lithuania is a small, safe and highly digital EU country with many English-taught programmes, moderate tuition and a 12-month post-study job search permit. Vilnius and Kaunas have growing tech, fintech and life-science sectors.",
  shortDescription:
    "Moderate tuition, many English-taught programmes, generous work rights and a 12-month post-study permit in the EU.",

  quickFacts: {
    tuition: "≈ €2.5k – €6k / year",
    tuitionNote:
      "Typical bachelor's and master's fees. Medicine and dentistry usually cost ≈ €10,000–€15,000+ per year.",
    living: "≈ €500 – €800 / month",
    livingNote: "Vilnius is the most expensive; Kaunas and Klaipėda are cheaper. Proof of funds is required for the residence permit.",
    intakes: "September (main) · February (some)",
    language: "Many English-taught programmes",
    work: "20 h/week (bachelor's); master's can work more",
    postStudy: "12-month job search permit",
    visa: "Temporary residence permit (TRP)",
  },
};

export const turkeyMeta = {
  slug: "turkey",
  name: "Turkey",
  code: "TR",
  flag: "🇹🇷",
  flagColors: ["#e30a17", "#ffffff", "#e30a17"],
  status: "live",
  region: "Europe & Asia",
  inEU: false,
  schengen: false,
  currency: "Turkish Lira (₺)",
  headline: "Study in Turkey",
  tagline: "Affordable degrees, a fully funded government scholarship and a familiar culture.",
  intro:
    "Turkey sits between Europe and Asia and offers low public tuition, many English-taught programmes and one of the most generous government scholarships in the world: Türkiye Bursları. For Pakistani students it also feels culturally close, with halal food everywhere and a warm welcome.",
  shortDescription:
    "Low public tuition, the fully funded Türkiye Bursları scholarship and many English-taught programmes in Istanbul and Ankara.",

  quickFacts: {
    tuition: "≈ $300 – $3k / year (public)",
    tuitionNote:
      "State universities are low cost; fees vary by programme and are often set in lira. Foundation (private) universities typically charge ≈ $3,000–$20,000+ per year, with large merit discounts.",
    living: "≈ $400 – $700 / month",
    livingNote: "Istanbul is the most expensive city. Prices change quickly with inflation, so we re-check before every application.",
    intakes: "Fall (Sep) · Spring (Feb, some)",
    language: "Turkish · English-taught programmes",
    work: "Part-time with a work permit",
    postStudy: "Switch to a work permit with a job offer",
    visa: "Student visa + residence permit (ikamet)",
  },
};

export const chinaMeta = {
  slug: "china",
  name: "China",
  code: "CN",
  flag: "🇨🇳",
  flagColors: ["#de2910", "#ffde00", "#de2910"],
  status: "live",
  region: "East Asia",
  inEU: false,
  schengen: false,
  currency: "Chinese Yuan (CNY ¥)",
  headline: "Study in China",
  tagline: "Top-ranked universities, the CSC scholarship and a close Pakistan connection.",
  intro:
    "China has some of Asia's highest ranked universities, a huge range of English-taught programmes and the fully funded Chinese Government (CSC) Scholarship. It is a popular route for Pakistani students in engineering, computer science, business and MBBS, provided degree recognition is checked carefully.",
  shortDescription:
    "Highly ranked universities, the fully funded CSC scholarship, English-taught engineering, business and MBBS routes.",

  quickFacts: {
    tuition: "≈ ¥18k – ¥35k / year",
    tuitionNote:
      "Typical English-taught bachelor's fees. English-taught MBBS usually costs ≈ ¥30,000–¥75,000 per year depending on the university.",
    living: "≈ ¥2,500 – ¥5,000 / month",
    livingNote: "Beijing and Shanghai are the most expensive. Many universities offer affordable on-campus housing.",
    intakes: "September (main) · March (some)",
    language: "Chinese (HSK) · English-taught programmes",
    work: "Only with university & immigration approval",
    postStudy: "Some graduates move to work permits",
    visa: "X1 student visa + residence permit",
  },
};

export const vietnamMeta = {
  slug: "vietnam",
  name: "Vietnam",
  code: "VN",
  flag: "🇻🇳",
  flagColors: ["#da251d", "#ffcd00", "#da251d"],
  status: "live",
  region: "South-East Asia",
  inEU: false,
  schengen: false,
  currency: "Vietnamese Dong (₫)",
  headline: "Study in Vietnam",
  tagline: "A fast-growing Asian economy with low living costs and international campuses.",
  intro:
    "Vietnam is one of Asia's fastest-growing economies. Students can choose low-cost public universities or international campuses like RMIT Vietnam, VinUniversity and Fulbright University Vietnam, which offer strong financial aid. Living costs are among the lowest of any destination we cover.",
  shortDescription:
    "Low living costs, international campuses with generous aid, and a booming South-East Asian economy.",

  quickFacts: {
    tuition: "≈ $1k – $4k / year (public)",
    tuitionNote:
      "Public universities are low cost. International universities (RMIT Vietnam, VinUni, Fulbright) charge much more but offer substantial financial aid.",
    living: "≈ $400 – $700 / month",
    livingNote: "Ho Chi Minh City and Hanoi are the most expensive; Da Nang is cheaper.",
    intakes: "September (main) · February/March (some)",
    language: "Vietnamese · English-taught programmes",
    work: "DH visa is for study only",
    postStudy: "Employer-sponsored work permit",
    visa: "DH student visa + temporary residence card",
  },
};
