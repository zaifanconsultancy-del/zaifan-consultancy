// Italy-level depth for Lithuania. Merged into lithuaniaData by the registry.
export const lithuaniaDeep = {
  currencySymbol: "€",

  tuitionOptions: [
    { id: "bachelor", label: "Bachelor's", min: 2500, max: 4500, note: "IT and engineering cost more" },
    { id: "master", label: "Master's", min: 4000, max: 6000, note: "Business schools may cost more" },
    { id: "medicine", label: "Medicine / dentistry", min: 10000, max: 15000, note: "LSMU and Vilnius University" },
  ],

  timeline: [
    { phase: "Research & shortlist", timing: "9–12 months before", text: "Shortlist English-taught programmes on Study in Lithuania and university sites; check entry requirements." },
    { phase: "English test", timing: "8–10 months before", text: "Take IELTS or TOEFL. Some universities run their own English interview or test." },
    { phase: "Applications", timing: "January – June", text: "Apply online via university portals. Deadlines for non-EU students are often in spring or early summer." },
    { phase: "Admission & first payment", timing: "After admission", text: "Accept your offer and pay any required first instalment or deposit." },
    { phase: "Residence permit (TRP)", timing: "As soon as admitted", text: "Your university helps you apply on MIGRIS; you give biometrics at a designated embassy or visa centre. Allow several weeks." },
    { phase: "Arrival", timing: "Late August – September", text: "Collect your TRP card, register with the university and arrange health insurance and housing." },
  ],

  requirements: {
    bachelor: [
      "HSSC/A-levels with good grades (some programmes need maths or sciences)",
      "IELTS 5.5–6.0 or equivalent for English programmes",
      "Some universities hold an online interview or entrance test",
      "Medicine and dentistry have higher academic requirements",
    ],
    master: [
      "A recognised bachelor's in a related field",
      "IELTS 6.0–6.5 or equivalent",
      "Motivation letter and CV; sometimes an interview",
      "Some programmes ask for work experience or a portfolio",
    ],
    language: [
      { test: "IELTS / TOEFL", note: "For English-taught programmes" },
      { test: "University English test", note: "Accepted by some universities instead" },
      { test: "Basic Lithuanian", note: "Not required, but nice for daily life" },
    ],
    documents: [
      "Matric/HSSC attested by IBCC",
      "Degree and transcripts attested by HEC",
      "Passport copy",
      "CV and motivation letter",
      "English certificate",
      "Proof of funds and health insurance (for the TRP)",
    ],
  },

  studentLife: [
    { icon: "home", title: "Housing", text: "Universities offer dorm places for international students, which are much cheaper than private flats. Apply as soon as you're admitted." },
    { icon: "utensils", title: "Food & halal", text: "Supermarket prices are moderate. Halal options are limited but available in Vilnius and Kaunas; many students cook." },
    { icon: "train", title: "Transport", text: "Students get large discounts on city transport, and buses and trains connect the main cities cheaply." },
    { icon: "briefcase", title: "Part-time work", text: "Bachelor's students can work 20 hours a week; master's students have been allowed more. Check current rules." },
    { icon: "cloud", title: "Weather", text: "Long, cold winters with snow and short days; bright, mild summers." },
    { icon: "shield", title: "Safety & digital life", text: "Very safe, with excellent internet and e-government. Most services work online." },
  ],

  decision: {
    choose: [
      "You want an affordable EU degree taught fully in English",
      "You like a calm, safe and digital country",
      "You're interested in IT, business or health sciences",
      "You'd like to work part-time while studying",
      "You want a 12-month post-study job search permit",
      "You prefer smaller classes and a quieter lifestyle",
    ],
    avoid: [
      "You can't handle long, dark winters",
      "You want a large South Asian community nearby",
      "You need a big English-speaking job market",
      "You're relying on halal restaurants everywhere",
      "You want the cheapest possible EU option",
      "You want a huge, busy city",
    ],
  },

  realityChecks: [
    { expectation: "There's a Lithuanian embassy in Pakistan", reality: "Biometrics are given at a designated embassy or visa centre; your university tells you where." },
    { expectation: "Work rules are fixed", reality: "Proposals to change student work hours have been discussed, so we confirm current rules before you travel." },
    { expectation: "Winters are like Pakistan's", reality: "Expect −10°C or colder and very short days." },
    { expectation: "Jobs are easy without Lithuanian", reality: "IT and international firms hire in English; many local jobs need Lithuanian." },
    { expectation: "Dorms are guaranteed", reality: "Dorm places are limited, so apply early." },
    { expectation: "Medicine is cheap here", reality: "Medicine and dentistry cost ≈ €10,000–€15,000+ a year, much more than other programmes." },
  ],

  cityGoals: [
    { goal: "IT & fintech", citySlug: "vilnius", reason: "Startups, fintech firms and the most universities." },
    { goal: "Engineering", citySlug: "kaunas", reason: "KTU, the Baltics' largest technical university." },
    { goal: "Medicine", citySlug: "kaunas", reason: "LSMU, Lithuania's largest medical university." },
    { goal: "Marine studies", citySlug: "klaipeda", reason: "Lithuania's port and Klaipėda University." },
    { goal: "Lowest cost", citySlug: "siauliai", reason: "A small, very affordable student city." },
  ],

  pathways: [
    { title: "IT & engineering route", icon: "cpu", slugs: ["ktu", "vilnius-tech", "vilnius-university"] },
    { title: "Business route", icon: "briefcase", slugs: ["ism-university", "vytautas-magnus-university", "vilnius-university"] },
    { title: "Medicine route", icon: "stethoscope", slugs: ["lsmu", "vilnius-university", "klaipeda-university"] },
    { title: "Applied & practical route", icon: "graduation", slugs: ["vilnius-applied-sciences", "kaunas-applied-sciences", "ksu"] },
    { title: "Law & social sciences route", icon: "landmark", slugs: ["mykolas-romeris-university", "vilnius-university", "vytautas-magnus-university"] },
    { title: "Arts & creative route", icon: "sun", slugs: ["vilnius-academy-of-arts", "vytautas-magnus-university", "ktu"] },
  ],

  extraCities: [
    {
      slug: "siauliai",
      name: "Šiauliai",
      emoji: "✝️",
      region: "Šiauliai County",
      headline: "Small, affordable university city",
      intro: "Šiauliai is Lithuania's fourth-largest city, home to Vilnius University's Šiauliai Academy. It's quiet and among the cheapest places to study in the country.",
      livingCost: "Low",
      bestFor: ["Education", "IT", "Business"],
      highlights: [
        { title: "Very affordable", text: "Low rent and daily costs." },
        { title: "Vilnius University academy", text: "A branch of Lithuania's top university." },
        { title: "Hill of Crosses", text: "A famous landmark nearby." },
      ],
      costCards: [
        { label: "Rent", value: "≈ €150 – €300", text: "Cheap rooms and dorms." },
        { label: "Food", value: "≈ €170", text: "Low prices." },
        { label: "Transport", value: "Bus", text: "Small city." },
      ],
      studentLife: ["Very quiet", "Low costs", "Small international community"],
    },
  ],

  cityExtras: {
    vilnius: { budget: { rent: [300, 500], food: [200, 260], transport: [10, 20], other: [60, 120] }, fit: { good: ["IT and fintech", "Most programme choice", "Capital-city life"], consider: ["Highest rents in Lithuania", "Cold winters", "Lithuanian helps for local jobs"] }, scholarshipNote: "Vilnius universities offer tuition waivers for top applicants; Lithuanian state scholarships can apply." },
    kaunas: { budget: { rent: [220, 380], food: [180, 240], transport: [10, 15], other: [50, 100] }, fit: { good: ["Engineering and medicine", "Lower costs", "Student-focused city"], consider: ["Smaller than Vilnius", "Fewer international jobs", "Cold winters"] }, scholarshipNote: "KTU and VMU offer merit-based fee reductions for strong international applicants." },
    klaipeda: { budget: { rent: [200, 350], food: [180, 230], transport: [10, 15], other: [50, 100] }, fit: { good: ["Marine and logistics studies", "Seaside summers", "Low costs"], consider: ["Small city", "Quiet winters", "Fewer programmes in English"] }, scholarshipNote: "Klaipėda University offers some fee reductions; living costs stay low." },
    siauliai: { budget: { rent: [150, 300], food: [170, 220], transport: [5, 15], other: [50, 90] }, fit: { good: ["Tight budgets", "Quiet study", "Small classes"], consider: ["Very small city", "Limited programmes", "Few part-time jobs"] }, scholarshipNote: "Lowest living costs in Lithuania; ask about tuition reductions." },
  },

  extraUniversities: [
    { slug: "vilnius-academy-of-arts", name: "Vilnius Academy of Arts", citySlug: "vilnius", city: "Vilnius", type: "Public", tuitionBand: "Moderate", tuitionNote: "Check official fee table", programs: ["Fine Arts", "Design", "Architecture"], popularFor: "Lithuania's leading art and design school", website: "https://www.vda.lt/en" },
    { slug: "ksu", name: "Kazimieras Simonavičius University", citySlug: "vilnius", city: "Vilnius", type: "Private", tuitionBand: "Moderate", tuitionNote: "Private university fees", programs: ["Business", "Law", "Media"], popularFor: "Private university with business and creative industries", website: "https://www.ksu.lt/en/" },
    { slug: "lithuanian-sports-university", name: "Lithuanian Sports University", citySlug: "kaunas", city: "Kaunas", type: "Public", tuitionBand: "Low", tuitionNote: "Check official fee table", programs: ["Sports Science", "Physiotherapy", "Tourism"], popularFor: "Sports science and physiotherapy", website: "https://www.lsu.lt/en/" },
    { slug: "vilnius-applied-sciences", name: "Vilnius University of Applied Sciences", citySlug: "vilnius", city: "Vilnius", type: "Public", tuitionBand: "Low", tuitionNote: "Check official fee table", programs: ["Business", "IT", "Health Care"], popularFor: "Practical, career-focused programmes", website: "https://www.viko.lt/en/" },
    { slug: "kaunas-applied-sciences", name: "Kaunas University of Applied Sciences", citySlug: "kaunas", city: "Kaunas", type: "Public", tuitionBand: "Low", tuitionNote: "Check official fee table", programs: ["Engineering", "Business", "Health"], popularFor: "Applied engineering and health programmes", website: "https://en.kauno-kolegija.lt/" },
  ],

  universityExtras: {
    "vilnius-university": { about: "Founded in 1579, Vilnius University is Lithuania's oldest and highest-ranked university, with a beautiful historic campus in the old town.", highlights: ["Lithuania's top-ranked university", "Historic old-town campus", "Medicine, business and IT"], english: "Many programmes in English" },
    "vilnius-tech": { about: "VILNIUS TECH is a leading technical university focused on engineering, IT, architecture and business.", highlights: ["Strong engineering and IT", "Industry partnerships", "Published fee table"], english: "Many programmes in English" },
    "mykolas-romeris-university": { about: "Mykolas Romeris University specialises in law, public administration, psychology and social sciences.", highlights: ["Law and public administration", "Modern Vilnius campus", "International partnerships"], english: "Several programmes in English" },
    "ism-university": { about: "ISM University of Management and Economics is a private business school known for management and economics.", highlights: ["Business-focused", "Strong industry links", "Small classes"], english: "Programmes in English" },
    ktu: { about: "Kaunas University of Technology is the largest technical university in the Baltic states, strong in engineering and IT.", highlights: ["Largest Baltic technical university", "Modern labs and campus", "Merit scholarships"], english: "Many programmes in English" },
    "vytautas-magnus-university": { about: "Vytautas Magnus University follows a liberal arts model, letting students combine subjects across disciplines.", highlights: ["Liberal arts approach", "Wide subject choice", "Affordable Kaunas"], english: "Several programmes in English" },
    lsmu: { about: "The Lithuanian University of Health Sciences is the country's largest medical university, with its own teaching hospital.", highlights: ["Largest medical university in Lithuania", "Own clinical hospital", "Medicine, dentistry and veterinary"], english: "Medicine, dentistry and other programmes in English" },
    "klaipeda-university": { about: "Klaipėda University is a coastal university known for marine sciences and maritime studies.", highlights: ["Marine and maritime focus", "Seaside city", "Low costs"], english: "Selected programmes in English" },
    "vilnius-academy-of-arts": { about: "Vilnius Academy of Arts is Lithuania's main university for fine arts, design and architecture.", highlights: ["Art, design and architecture", "Creative Vilnius scene", "Portfolio-based admission"], english: "Selected programmes in English" },
    ksu: { about: "Kazimieras Simonavičius University is a private university focused on business, law and creative industries.", highlights: ["Creative industries focus", "Business and law", "Central Vilnius"], english: "Selected programmes in English" },
    "lithuanian-sports-university": { about: "Lithuanian Sports University specialises in sports science, physiotherapy and tourism.", highlights: ["Sports science specialist", "Physiotherapy programmes", "Affordable Kaunas"], english: "Selected programmes in English" },
    "vilnius-applied-sciences": { about: "Vilnius University of Applied Sciences offers practical, career-oriented degrees.", highlights: ["Career-focused teaching", "Internships built in", "Affordable fees"], english: "Selected programmes in English" },
    "kaunas-applied-sciences": { about: "Kaunas University of Applied Sciences offers practical degrees in engineering, business and health.", highlights: ["Applied, practical study", "Health and engineering", "Low costs"], english: "Selected programmes in English" },
  },

  moreFaqs: [
    { q: "Is Lithuania good for Pakistani students?", a: "It suits students who want an affordable, English-taught EU degree in a calm, safe country, but expect cold winters and a smaller Pakistani community." },
    { q: "How much money do I need for the TRP?", a: "You must show sufficient funds for your stay; the amount is set by the authorities and can change. Your university confirms the current figure." },
    { q: "Can I travel in Europe with a Lithuanian TRP?", a: "Yes, for short visits within the Schengen area (up to 90 days in any 180)." },
    { q: "Are there tuition waivers?", a: "Many universities offer merit-based fee reductions for strong applicants, and state scholarships open some years." },
  ],
};
