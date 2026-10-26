// Italy-level depth for Belgium. Merged into belgiumData by the registry.
export const belgiumDeep = {
  currencySymbol: "€",

  tuitionOptions: [
    { id: "flemish", label: "Flemish university (non-EU)", min: 4000, max: 12000, note: "Set per programme" },
    { id: "french", label: "French-speaking university", min: 5010, max: 5010, note: "€835 + €4,175 non-EU contribution" },
    { id: "business", label: "Business school / specialised", min: 10000, max: 25000, note: "e.g. management schools" },
  ],

  timeline: [
    { phase: "Research & shortlist", timing: "12 months before", text: "Focus on English-taught master's; check each university's non-EU fee and whether your nationality qualifies for reductions." },
    { phase: "Language tests", timing: "9–12 months before", text: "IELTS (6.5–7.0 is common) or TOEFL for English programmes; Dutch or French for most bachelor's programmes." },
    { phase: "Applications", timing: "October – March", text: "Non-EU deadlines are early, often around 1 March, and earlier for scholarships. Apply through each university's portal." },
    { phase: "Proof of means", timing: "As soon as admitted", text: "Arrange ≈ €1,062 per month (2026–27): a blocked account at the university, a scholarship, or a Belgian guarantor (Annex 32)." },
    { phase: "Visa", timing: "May – August", text: "Apply for the Type D visa with admission, proof of means, medical certificate and police clearance. Processing can take several weeks." },
    { phase: "Arrival", timing: "September", text: "Register at your commune (town hall) within 8 days, join a health insurance fund and collect your residence card." },
  ],

  requirements: {
    bachelor: [
      "Most bachelor's programmes are taught in Dutch or French",
      "French-speaking universities require an official equivalence of your HSSC",
      "Some bachelor's programmes (e.g. medicine, engineering) have entrance exams",
      "English-taught bachelor's options are limited",
    ],
    master: [
      "A recognised bachelor's in a related field. 16 years of education is strongly preferred",
      "Strong grades. Flemish universities in particular are selective",
      "IELTS 6.5–7.0 or TOEFL equivalent for English programmes",
      "Motivation letter, CV and sometimes recommendation letters",
    ],
    language: [
      { test: "IELTS / TOEFL", note: "For English-taught master's programmes" },
      { test: "Dutch (NT2) / French (DELF)", note: "For Dutch- or French-taught programmes" },
      { test: "Basic Dutch or French", note: "Helps with part-time jobs and daily life" },
    ],
    documents: [
      "Matric/HSSC attested by IBCC",
      "Degree and transcripts attested by HEC",
      "Equivalence decision (French-speaking bachelor's)",
      "Passport copy",
      "CV and motivation letter",
      "Language certificate",
      "Medical certificate and police clearance (for the visa)",
    ],
  },

  studentLife: [
    { icon: "home", title: "Housing ('kot')", text: "Student rooms, called 'kots', are common in Leuven and Ghent. University housing services list verified rooms, so book early." },
    { icon: "utensils", title: "Food & halal", text: "Student restaurants are affordable. Halal shops and restaurants are easy to find in Brussels, Antwerp, Ghent and Liège." },
    { icon: "train", title: "Transport", text: "Small country, great trains. Students and under-26s get big discounts on buses, trams and trains." },
    { icon: "briefcase", title: "Part-time work", text: "Up to 20 hours a week during term, more in holidays. Student jobs are common in Belgium." },
    { icon: "cloud", title: "Weather", text: "Mild but often rainy and grey. A good raincoat matters more than a heavy one." },
    { icon: "users", title: "Community", text: "Brussels and Antwerp have established Pakistani and South Asian communities, plus mosques in every major city." },
  ],

  decision: {
    choose: [
      "You want a top-ranked research university (KU Leuven, Ghent)",
      "You're aiming at an English-taught master's",
      "You're interested in EU policy, law, or international careers",
      "You can show ≈ €1,062 a month in proof of means",
      "You like a compact country where everything is close",
      "You want a 12-month search year after graduating",
    ],
    avoid: [
      "You want an English-taught bachelor's (options are few)",
      "You can't show the proof-of-means amount",
      "You're applying after the early non-EU deadlines",
      "You expect low tuition at every university",
      "You want an easy, non-selective admission",
      "You dislike rainy weather",
    ],
  },

  realityChecks: [
    { expectation: "Belgium is cheap like Germany", reality: "Non-EU tuition is moderate, and proof of means rises to ≈ €1,062 a month in 2026–27." },
    { expectation: "I can apply in summer", reality: "Many non-EU deadlines are around 1 March. Late applicants miss the intake." },
    { expectation: "Everything is in English", reality: "Belgium is Dutch- and French-speaking. English works on campus, less so outside." },
    { expectation: "Admission is easy", reality: "Flemish universities are selective, and first-year exams can be tough." },
    { expectation: "Brussels is the only option", reality: "Leuven and Ghent are true student cities with lower rents." },
    { expectation: "Scholarships are open to everyone", reality: "Many Belgian scholarships only cover specific nationalities, so check eligibility first." },
  ],

  cityGoals: [
    { goal: "Top research", citySlug: "leuven", reason: "KU Leuven, Belgium's highest-ranked university." },
    { goal: "EU & international careers", citySlug: "brussels", reason: "EU institutions, NATO and thousands of organisations." },
    { goal: "Life sciences", citySlug: "ghent", reason: "Ghent University's biotech and life-science strength." },
    { goal: "Public health & business", citySlug: "antwerp", reason: "Institute of Tropical Medicine and a big port economy." },
    { goal: "Low budget (French)", citySlug: "liege", reason: "Lower rents and the University of Liège." },
    { goal: "Data & innovation", citySlug: "hasselt", reason: "A young university with strong data science." },
  ],

  pathways: [
    { title: "Engineering route", icon: "cpu", slugs: ["ku-leuven", "ghent-university", "uclouvain"] },
    { title: "Business & economics route", icon: "briefcase", slugs: ["vlerick", "university-of-antwerp", "ulb"] },
    { title: "Public health route", icon: "stethoscope", slugs: ["itm-antwerp", "ghent-university", "ku-leuven"] },
    { title: "Politics & EU route", icon: "landmark", slugs: ["ulb", "vub", "universite-saint-louis"] },
    { title: "Data & computer science route", icon: "cpu", slugs: ["hasselt-university", "vub", "university-of-liege"] },
    { title: "French-speaking route", icon: "languages", slugs: ["uclouvain", "university-of-liege", "unamur"] },
  ],

  extraCities: [
    {
      slug: "louvain-la-neuve",
      name: "Louvain-la-Neuve",
      emoji: "🏫",
      region: "Walloon Brabant",
      headline: "A car-free town built for students",
      intro: "Louvain-la-Neuve is a purpose-built university town around UCLouvain, about 30 minutes from Brussels. It's compact, safe and almost entirely student-focused.",
      livingCost: "Medium",
      bestFor: ["Engineering", "Economics", "Sciences"],
      highlights: [
        { title: "Built around a university", text: "Students make up most of the town." },
        { title: "Car-free centre", text: "Everything is walkable." },
        { title: "Near Brussels", text: "Easy train connection." },
      ],
      costCards: [
        { label: "Rent", value: "≈ €400 – €580", text: "Kots and student residences." },
        { label: "Food", value: "≈ €230", text: "Student restaurants." },
        { label: "Transport", value: "Walk + train", text: "Brussels is close." },
      ],
      studentLife: ["Tight-knit student town", "Very safe", "Quiet outside term"],
    },
    {
      slug: "hasselt",
      name: "Hasselt",
      emoji: "📊",
      region: "Limburg",
      headline: "Small, friendly and data-driven",
      intro: "Hasselt is a small, friendly city in eastern Flanders with Hasselt University, known for data science, business and engineering.",
      livingCost: "Low–Medium",
      bestFor: ["Data Science", "Business", "Engineering"],
      highlights: [
        { title: "Young university", text: "Hasselt University is modern and innovative." },
        { title: "Affordable", text: "Cheaper than Brussels or Leuven." },
        { title: "Friendly city", text: "Easy to settle in." },
      ],
      costCards: [
        { label: "Rent", value: "≈ €380 – €550", text: "Affordable student rooms." },
        { label: "Food", value: "≈ €220", text: "Student-friendly." },
        { label: "Transport", value: "Bus", text: "Compact city." },
      ],
      studentLife: ["Shopping and fashion city", "Calm and safe", "Close to Germany and the Netherlands"],
    },
  ],

  cityExtras: {
    brussels: { budget: { rent: [550, 800], food: [250, 320], transport: [5, 30], other: [90, 170] }, fit: { good: ["EU, politics and law", "International careers", "Multilingual life"], consider: ["Highest rents in Belgium", "Big-city pace", "Some areas need care at night"] }, scholarshipNote: "ULB and VUB offer their own international master's scholarships." },
    leuven: { budget: { rent: [450, 650], food: [240, 300], transport: [0, 20], other: [90, 160] }, fit: { good: ["Top research", "True student town", "Cycling life"], consider: ["Selective admissions", "Rooms go fast", "Quiet outside term"] }, scholarshipNote: "KU Leuven offers Science@Leuven and other master's scholarships, but they're very competitive." },
    ghent: { budget: { rent: [420, 620], food: [240, 300], transport: [0, 25], other: [90, 160] }, fit: { good: ["Life sciences and engineering", "Lively student culture", "Progressive city"], consider: ["Competitive housing", "Rainy weather", "Dutch helps outside campus"] }, scholarshipNote: "Ghent University offers top-up grants for some students from specific countries; check your eligibility." },
    antwerp: { budget: { rent: [420, 620], food: [240, 300], transport: [5, 30], other: [90, 160] }, fit: { good: ["Business, logistics and public health", "Big, diverse city", "Port economy"], consider: ["Fewer English bachelor's options", "Busy city", "Rents rising"] }, scholarshipNote: "The Institute of Tropical Medicine and the University of Antwerp offer some scholarships for eligible countries." },
    liege: { budget: { rent: [350, 520], food: [220, 280], transport: [5, 25], other: [80, 150] }, fit: { good: ["Lower budgets", "French-speaking study", "Engineering and veterinary"], consider: ["French needed day to day", "Smaller job market", "Hilly city"] }, scholarshipNote: "French-speaking universities may grant fee exemptions to some nationalities; ask before applying." },
    "louvain-la-neuve": { budget: { rent: [400, 580], food: [230, 290], transport: [10, 30], other: [80, 150] }, fit: { good: ["Engineering and economics", "Safe, walkable town", "Student-focused life"], consider: ["Very quiet on weekends", "French needed outside class", "Small town"] }, scholarshipNote: "UCLouvain offers some scholarships and fee reductions for eligible international students." },
    hasselt: { budget: { rent: [380, 550], food: [220, 280], transport: [5, 20], other: [80, 150] }, fit: { good: ["Data science and business", "Lower costs", "Friendly, small city"], consider: ["Smaller city life", "Dutch helps a lot", "Fewer jobs than Brussels"] }, scholarshipNote: "Hasselt University offers master's scholarships for some international students." },
  },

  extraUniversities: [
    { slug: "unamur", name: "University of Namur", citySlug: null, city: "Namur", type: "Public", tuitionBand: "Moderate", tuitionNote: "Non-EU contribution applies; check exemptions", programs: ["Computer Science", "Economics", "Biology"], popularFor: "Small French-speaking university in Wallonia's capital", website: "https://www.unamur.be/en" },
    { slug: "umons", name: "University of Mons", citySlug: null, city: "Mons", type: "Public", tuitionBand: "Moderate", tuitionNote: "Non-EU contribution applies; check exemptions", programs: ["Engineering", "Computer Science", "Translation"], popularFor: "Engineering and translation in a small city", website: "https://web.umons.ac.be/en/" },
    { slug: "universite-saint-louis", name: "UCLouvain Saint-Louis Brussels", citySlug: "brussels", city: "Brussels", type: "Public", tuitionBand: "Moderate", tuitionNote: "Non-EU contribution applies; check exemptions", programs: ["Law", "Political Science", "Economics"], popularFor: "Law and social sciences in central Brussels", website: "https://www.usaintlouis.be/" },
    { slug: "vlerick", name: "Vlerick Business School", citySlug: "ghent", city: "Ghent / Leuven / Brussels", type: "Private", tuitionBand: "High", tuitionNote: "Business school fees, scholarships available", programs: ["Management", "Finance", "MBA"], popularFor: "Belgium's best-known business school", website: "https://www.vlerick.com/en/" },
    { slug: "itm-antwerp", name: "Institute of Tropical Medicine Antwerp", citySlug: "antwerp", city: "Antwerp", type: "Medical", tuitionBand: "Moderate", tuitionNote: "Master's fees vary; scholarships for eligible countries", programs: ["Public Health", "Tropical Medicine", "Epidemiology"], popularFor: "World-renowned public health master's", website: "https://www.itg.be/en" },
  ],

  universityExtras: {
    "ku-leuven": { about: "KU Leuven is Belgium's largest and highest-ranked university and one of Europe's most innovative research universities.", highlights: ["Belgium's top-ranked university", "Very strong engineering and sciences", "Classic student town"], english: "Many master's programmes in English" },
    "ghent-university": { about: "Ghent University is a major research university in Flanders, strong in life sciences, engineering and veterinary medicine.", highlights: ["Top-100 global research university", "Biotech and life sciences strength", "Lively student city"], english: "Many master's programmes in English" },
    ulb: { about: "Université libre de Bruxelles is a French-speaking research university in the EU capital, with a famous business school (Solvay).", highlights: ["Solvay Brussels School of Economics", "EU institutions nearby", "Strong political science"], english: "Several master's programmes in English" },
    vub: { about: "Vrije Universiteit Brussel is a Dutch-speaking university in Brussels with many English-taught programmes.", highlights: ["English-friendly Brussels campus", "Engineering and business", "Diverse student body"], english: "Many programmes in English" },
    "university-of-antwerp": { about: "The University of Antwerp is a young, research-focused university in Belgium's port city.", highlights: ["Strong business and pharmacy", "Port and logistics links", "Modern campuses"], english: "Several master's programmes in English" },
    "university-of-liege": { about: "The University of Liège is a comprehensive French-speaking university, strong in engineering and veterinary medicine.", highlights: ["Large engineering faculty", "Veterinary medicine", "Affordable city"], english: "Selected master's programmes in English" },
    uclouvain: { about: "UCLouvain is Belgium's largest French-speaking university, based in Louvain-la-Neuve with campuses in Brussels.", highlights: ["Strong economics and engineering", "Purpose-built student town", "Large research university"], english: "Several master's programmes in English", citySlug: "louvain-la-neuve" },
    "hasselt-university": { about: "Hasselt University is a young, innovative university known for data science, statistics and business.", highlights: ["Strong data science and statistics", "Modern campus", "Friendly, affordable city"], english: "Several master's programmes in English", citySlug: "hasselt" },
    unamur: { about: "The University of Namur is a smaller French-speaking university known for computer science and economics.", highlights: ["Small classes", "Calm capital city", "Computer science focus"], english: "Selected programmes in English" },
    umons: { about: "The University of Mons is a French-speaking university with engineering, computer science and a respected translation school.", highlights: ["Engineering faculty", "Translation and interpreting", "Low costs"], english: "Selected programmes in English" },
    "universite-saint-louis": { about: "UCLouvain Saint-Louis Brussels is a small campus in central Brussels focused on law, politics and social sciences.", highlights: ["Central Brussels", "Law and political science", "Small, personal campus"], english: "Mostly French-taught" },
    vlerick: { about: "Vlerick Business School is a leading European business school with campuses in Ghent, Leuven and Brussels.", highlights: ["Top-ranked masters in management", "Strong corporate links", "Scholarships available"], english: "Programmes taught in English" },
    "itm-antwerp": { about: "The Institute of Tropical Medicine is a world-renowned institute for public health and tropical medicine research and training.", highlights: ["Famous public health master's", "Global health research", "Scholarships for eligible countries"], english: "Programmes taught in English" },
  },

  moreFaqs: [
    { q: "What is a 'kot'?", a: "A student room, usually in a shared house with other students. It's the most common student housing in Leuven and Ghent." },
    { q: "Do I need an equivalence for a Belgian bachelor's?", a: "For French-speaking universities, yes. Your secondary diploma needs an official equivalence decision. Flemish universities assess it themselves." },
    { q: "When are Belgian non-EU deadlines?", a: "Often around 1 March for September entry, and earlier for scholarships. Check each programme." },
    { q: "Can I travel around Europe on a Belgian permit?", a: "Yes, for short visits within the Schengen area (up to 90 days in any 180)." },
    { q: "Which Belgian city is cheapest?", a: "Liège and Hasselt are among the most affordable; Brussels is the most expensive." },
  ],
};
