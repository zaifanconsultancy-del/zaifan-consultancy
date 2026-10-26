// Italy-level depth for Vietnam. Merged into vietnamData by the registry.
export const vietnamDeep = {
  currencySymbol: "$",

  tuitionOptions: [
    { id: "public", label: "Public university", min: 1000, max: 4000, note: "English programmes cost more" },
    { id: "private", label: "Private university", min: 3000, max: 8000, note: "e.g. FPT, Duy Tan" },
    { id: "international", label: "International university", min: 10000, max: 35000, note: "Large aid at VinUni & Fulbright" },
  ],

  timeline: [
    { phase: "Research & shortlist", timing: "9–12 months before", text: "Choose between low-cost public universities and English-only international campuses with stronger financial aid." },
    { phase: "Scholarship & aid applications", timing: "October – March", text: "VinUniversity, Fulbright and RMIT have early deadlines for scholarships and financial aid." },
    { phase: "University applications", timing: "January – June", text: "Apply online with transcripts, English test and personal statement; some universities interview applicants." },
    { phase: "Admission", timing: "Spring – summer", text: "Accept your offer and pay any deposit. Your university then sponsors your visa." },
    { phase: "DH visa approval", timing: "Allow several weeks", text: "The university requests visa approval from Vietnamese Immigration; you then collect your DH student visa." },
    { phase: "Arrival", timing: "August – September", text: "Register with the university and apply for your temporary residence card." },
  ],

  requirements: {
    bachelor: [
      "HSSC/A-levels with good grades; international universities look at the whole profile",
      "IELTS 5.5–6.5 for English-taught programmes",
      "Vietnamese-taught programmes need a Vietnamese language year",
      "Personal statement and sometimes an interview",
    ],
    master: [
      "A recognised bachelor's in a related field",
      "IELTS 6.0–6.5 or equivalent",
      "Statement of purpose and recommendation letters",
      "Some programmes ask for work experience",
    ],
    language: [
      { test: "IELTS / TOEFL", note: "For English-taught programmes" },
      { test: "Vietnamese language year", note: "For Vietnamese-taught programmes" },
      { test: "Basic Vietnamese", note: "Very helpful in daily life" },
    ],
    documents: [
      "Matric/HSSC attested by IBCC",
      "Degree and transcripts attested by HEC (for master's)",
      "Passport copy",
      "English certificate",
      "Personal statement and recommendation letters",
      "Health check (if requested)",
    ],
  },

  studentLife: [
    { icon: "home", title: "Housing", text: "Dorms and shared apartments are cheap. International universities often help you find housing near campus." },
    { icon: "utensils", title: "Food & halal", text: "Food is cheap and delicious. Halal options exist in Hanoi and Ho Chi Minh City (including Indian and Malaysian restaurants), but you'll need to look." },
    { icon: "train", title: "Transport", text: "Motorbike ride-hailing (Grab) is everywhere and cheap; Hanoi and HCMC have growing metro lines." },
    { icon: "briefcase", title: "Part-time work", text: "The DH student visa is for study only, so don't count on part-time income." },
    { icon: "cloud", title: "Weather", text: "Hot and humid in the south all year; Hanoi has a cool winter. Expect monsoon rains." },
    { icon: "shield", title: "Safety", text: "Generally safe for students. Traffic is the biggest everyday risk." },
  ],

  decision: {
    choose: [
      "You want a very low cost of living",
      "You're interested in international campuses like VinUni, Fulbright or RMIT",
      "You'd like to experience a fast-growing Asian economy",
      "You enjoy warm weather and great food",
      "You're interested in business, IT, design or tourism",
      "You want generous financial aid at international universities",
    ],
    avoid: [
      "You need part-time work to pay your way",
      "You want a post-study work route",
      "You need halal food everywhere",
      "You want a famous, globally ranked public university",
      "You're uncomfortable with heavy traffic",
      "You expect English outside international campuses",
    ],
  },

  realityChecks: [
    { expectation: "I can work part-time on a student visa", reality: "The DH visa is for study. Work rights were proposed but not confirmed, so plan without them." },
    { expectation: "International universities are unaffordable", reality: "VinUni and Fulbright give large need-based aid. With aid they can cost less than you'd expect." },
    { expectation: "English is common", reality: "English is good on international campuses but limited elsewhere." },
    { expectation: "Halal food is everywhere", reality: "It's available in the big cities, but you'll need to plan." },
    { expectation: "Vietnam is all beaches", reality: "Hanoi has cold-ish winters and Ho Chi Minh City is a huge, busy metropolis." },
    { expectation: "My degree is recognised automatically", reality: "Check HEC equivalence for your university and programme before enrolling." },
  ],

  cityGoals: [
    { goal: "Public universities", citySlug: "hanoi", reason: "VNU Hanoi, HUST and the capital's top public universities." },
    { goal: "Business & international study", citySlug: "ho-chi-minh-city", reason: "RMIT, Fulbright and the country's business hub." },
    { goal: "Beach lifestyle on a budget", citySlug: "da-nang", reason: "Affordable, clean and coastal." },
    { goal: "History & culture", citySlug: "hue", reason: "The former imperial capital with Hue University." },
    { goal: "Agriculture", citySlug: "can-tho", reason: "Can Tho University in the Mekong Delta." },
  ],

  pathways: [
    { title: "International campus route", icon: "building", slugs: ["vinuniversity", "fulbright-vietnam", "rmit-vietnam"] },
    { title: "Engineering & IT route", icon: "cpu", slugs: ["hust-vietnam", "vnu-hcm", "fpt-university"] },
    { title: "Business & economics route", icon: "briefcase", slugs: ["ueh", "neu", "foreign-trade-university"] },
    { title: "Low-cost public route", icon: "wallet", slugs: ["vnu-hanoi", "university-of-da-nang", "can-tho-university"] },
    { title: "British / Australian degree route", icon: "graduation", slugs: ["rmit-vietnam", "buv", "vinuniversity"] },
    { title: "Medicine & health route", icon: "stethoscope", slugs: ["vinuniversity", "duy-tan-university", "hue-university"] },
  ],

  extraCities: [
    {
      slug: "hue",
      name: "Huế",
      emoji: "🏯",
      region: "Central Vietnam",
      headline: "Imperial city with a calm student life",
      intro: "Huế was Vietnam's imperial capital and is now a quiet, historic city with Hue University, one of the country's larger regional universities.",
      livingCost: "Low",
      bestFor: ["Medicine", "Agriculture", "Languages"],
      highlights: [
        { title: "Imperial heritage", text: "UNESCO-listed citadel." },
        { title: "Very affordable", text: "Low living costs." },
        { title: "Calm city", text: "Quieter than the big cities." },
      ],
      costCards: [
        { label: "Rent", value: "≈ $100 – $200", text: "Very cheap." },
        { label: "Food", value: "≈ $110", text: "Famous local cuisine." },
        { label: "Transport", value: "Motorbike", text: "Small city." },
      ],
      studentLife: ["Historic sights", "Rainy season", "Quiet nights"],
    },
    {
      slug: "can-tho",
      name: "Cần Thơ",
      emoji: "🛶",
      region: "Mekong Delta",
      headline: "Heart of the Mekong Delta",
      intro: "Cần Thơ is the largest city in the Mekong Delta, known for floating markets and Can Tho University, a leader in agriculture and aquaculture.",
      livingCost: "Low",
      bestFor: ["Agriculture", "Aquaculture", "Environmental Science"],
      highlights: [
        { title: "Floating markets", text: "Famous river life." },
        { title: "Agricultural research", text: "Can Tho University." },
        { title: "Low costs", text: "Very affordable." },
      ],
      costCards: [
        { label: "Rent", value: "≈ $100 – $200", text: "Cheap rooms." },
        { label: "Food", value: "≈ $110", text: "Fresh produce." },
        { label: "Transport", value: "Motorbike", text: "Compact city." },
      ],
      studentLife: ["River-city life", "Hot all year", "Small international community"],
    },
  ],

  cityExtras: {
    hanoi: { budget: { rent: [150, 300], food: [120, 200], transport: [15, 40], other: [40, 80] }, fit: { good: ["Top public universities", "Culture and history", "Four seasons"], consider: ["Heavy traffic", "Air pollution in winter", "Limited English off campus"] }, scholarshipNote: "VinUniversity's aid and scholarships are based in Hanoi; public universities have low fees." },
    "ho-chi-minh-city": { budget: { rent: [200, 350], food: [140, 220], transport: [20, 40], other: [40, 80] }, fit: { good: ["Business and international study", "Most jobs and internships", "Lively city"], consider: ["Busiest traffic", "Hot all year", "Higher costs than other cities"] }, scholarshipNote: "Fulbright and RMIT offer need-based aid and scholarships here." },
    "da-nang": { budget: { rent: [130, 250], food: [110, 170], transport: [15, 30], other: [30, 60] }, fit: { good: ["Low budgets", "Beach lifestyle", "IT and tourism"], consider: ["Smaller job market", "Typhoon season", "Fewer international universities"] }, scholarshipNote: "Mainly low-cost public and private universities." },
    hue: { budget: { rent: [100, 200], food: [100, 150], transport: [10, 25], other: [30, 60] }, fit: { good: ["Tightest budgets", "Calm study", "History lovers"], consider: ["Rainy season", "Small city", "Little English"] }, scholarshipNote: "Very low costs; ask Hue University about fee reductions." },
    "can-tho": { budget: { rent: [100, 200], food: [100, 150], transport: [10, 25], other: [30, 60] }, fit: { good: ["Agriculture and environment", "Low costs", "River-city life"], consider: ["Hot all year", "Few English programmes", "Small international community"] }, scholarshipNote: "Very low costs; Can Tho University has international partnerships." },
  },

  extraUniversities: [
    { slug: "hue-university", name: "Hue University", citySlug: "hue", city: "Huế", type: "Public", tuitionBand: "Low", tuitionNote: "Check official fee table", programs: ["Medicine", "Agriculture", "Languages"], popularFor: "Regional university in the imperial city", website: "https://hueuni.edu.vn/" },
    { slug: "can-tho-university", name: "Can Tho University", citySlug: "can-tho", city: "Cần Thơ", type: "Public", tuitionBand: "Low", tuitionNote: "Check official fee table", programs: ["Agriculture", "Aquaculture", "Environmental Science"], popularFor: "Mekong Delta's leading university", website: "https://www.ctu.edu.vn/" },
    { slug: "ueh", name: "University of Economics Ho Chi Minh City (UEH)", citySlug: "ho-chi-minh-city", city: "Ho Chi Minh City", type: "Public", tuitionBand: "Low", tuitionNote: "Check official fee table", programs: ["Economics", "Business", "Finance"], popularFor: "Top economics university in the south", website: "https://ueh.edu.vn/" },
    { slug: "neu", name: "National Economics University", citySlug: "hanoi", city: "Hanoi", type: "Public", tuitionBand: "Low", tuitionNote: "Check official fee table", programs: ["Economics", "Business", "Management"], popularFor: "Leading economics university in the north", website: "https://neu.edu.vn/" },
    { slug: "hanoi-university", name: "Hanoi University", citySlug: "hanoi", city: "Hanoi", type: "Public", tuitionBand: "Low", tuitionNote: "Check official fee table", programs: ["Languages", "Business", "IT"], popularFor: "Programmes taught in foreign languages", website: "https://www.hanu.edu.vn/" },
    { slug: "fpt-university", name: "FPT University", citySlug: "hanoi", city: "Hanoi / HCMC / Da Nang", type: "Private", tuitionBand: "Moderate", tuitionNote: "Private university fees", programs: ["Software Engineering", "AI", "Business"], popularFor: "Tech-focused private university with industry links", website: "https://fpt.edu.vn/" },
    { slug: "buv", name: "British University Vietnam", citySlug: "hanoi", city: "Hanoi area", type: "International", tuitionBand: "High", tuitionNote: "International fees, scholarships available", programs: ["Business", "Finance", "Computing"], popularFor: "UK-accredited degrees in Vietnam", website: "https://www.buv.edu.vn/" },
  ],

  universityExtras: {
    "vnu-hanoi": { about: "Vietnam National University, Hanoi is a group of member universities and Vietnam's leading national university system in the north.", highlights: ["Vietnam's top national university", "Wide subject range", "Low fees"], english: "Selected programmes in English" },
    "hust-vietnam": { about: "Hanoi University of Science and Technology is Vietnam's leading technical university.", highlights: ["Top technical university", "Engineering and IT", "Low fees"], english: "Selected programmes in English" },
    "foreign-trade-university": { about: "Foreign Trade University is one of Vietnam's most competitive universities for economics and international trade.", highlights: ["International trade focus", "Competitive admission", "Strong alumni in business"], english: "Selected programmes in English" },
    vinuniversity: { about: "VinUniversity is a private, not-for-profit university in Hanoi built to international standards, with partnerships with Cornell and Penn.", highlights: ["International-standard teaching", "Generous financial aid", "Modern campus"], english: "All programmes in English" },
    "vnu-hcm": { about: "Vietnam National University, Ho Chi Minh City is the leading national university system in southern Vietnam.", highlights: ["Top southern university system", "Engineering and sciences", "Low fees"], english: "Selected programmes in English" },
    "rmit-vietnam": { about: "RMIT University Vietnam is the Vietnamese campus of Australia's RMIT, offering Australian degrees in Ho Chi Minh City and Hanoi.", highlights: ["Australian degree", "Business, design and IT", "Scholarships available"], english: "All programmes in English" },
    "fulbright-vietnam": { about: "Fulbright University Vietnam is an independent liberal arts university in Ho Chi Minh City with need-based aid.", highlights: ["American-style liberal arts", "Need-based aid up to full cost", "Small classes"], english: "All programmes in English" },
    "ton-duc-thang-university": { about: "Ton Duc Thang University is a fast-rising public university in Ho Chi Minh City.", highlights: ["Rising rankings", "Modern campus", "Low fees"], english: "Selected programmes in English" },
    "university-of-da-nang": { about: "The University of Da Nang is the main public university system in central Vietnam.", highlights: ["Regional university system", "Affordable coastal city", "Engineering and economics"], english: "Selected programmes in English" },
    "duy-tan-university": { about: "Duy Tan University is a research-active private university in Da Nang.", highlights: ["Research-active", "IT and medicine", "Coastal city"], english: "Selected programmes in English" },
    "hue-university": { about: "Hue University is a regional university system in Vietnam's former imperial capital.", highlights: ["Medicine and agriculture", "Very low costs", "Historic city"], english: "Mostly Vietnamese-taught" },
    "can-tho-university": { about: "Can Tho University is the leading university of the Mekong Delta, known for agriculture and aquaculture.", highlights: ["Agriculture and aquaculture", "International partnerships", "Low costs"], english: "Selected programmes in English" },
    ueh: { about: "UEH is one of Vietnam's leading economics and business universities, based in Ho Chi Minh City.", highlights: ["Economics and finance", "Business hub city", "International programmes"], english: "Several programmes in English" },
    neu: { about: "National Economics University in Hanoi is a leading university for economics, business and management.", highlights: ["Economics specialist", "Strong alumni network", "Capital city"], english: "Several programmes in English" },
    "hanoi-university": { about: "Hanoi University teaches many programmes in foreign languages, including English, and is known for language studies.", highlights: ["Foreign-language teaching", "Languages and business", "Central Hanoi"], english: "Many programmes in English" },
    "fpt-university": { about: "FPT University is a private university founded by Vietnam's FPT technology group, focused on IT and business.", highlights: ["Industry-linked IT degrees", "Campuses in several cities", "Practical teaching"], english: "Many programmes in English" },
    buv: { about: "British University Vietnam offers UK-accredited degrees near Hanoi in partnership with British universities.", highlights: ["UK-accredited degrees", "Modern campus", "Scholarships available"], english: "All programmes in English" },
  },

  moreFaqs: [
    { q: "Which is better: public or international university in Vietnam?", a: "Public universities are cheaper; international ones offer English-only teaching and stronger aid. It depends on your budget and goals." },
    { q: "Is Vietnam cheap for students?", a: "Living costs are among the lowest of any destination we cover, often $400–$700 a month in the big cities." },
    { q: "Do I need to speak Vietnamese?", a: "Not on English-taught programmes, but basic Vietnamese helps a lot in daily life." },
    { q: "Can I stay in Vietnam after graduating?", a: "There's no general post-study visa; you'd need an employer to sponsor a work permit." },
  ],
};
