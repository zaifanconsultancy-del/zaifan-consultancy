// Italy-level depth for Romania. Merged into romaniaData by the registry.
export const romaniaDeep = {
  currencySymbol: "€",

  tuitionOptions: [
    { id: "state", label: "Bachelor's / master's (state)", min: 2000, max: 3500, note: "Often quoted per month (≈ €220–€320)" },
    { id: "medicine", label: "Medicine / dentistry (English)", min: 5000, max: 7500, note: "UMF universities" },
    { id: "prep", label: "Romanian preparatory year", min: 2000, max: 2500, note: "Before Romanian-taught degrees" },
  ],

  timeline: [
    { phase: "Research & choose language", timing: "9–12 months before", text: "Decide between English-taught programmes (mostly medicine, engineering, business) and Romanian-taught ones with a prep year." },
    { phase: "Prepare documents", timing: "8–10 months before", text: "Attest and translate your documents (IBCC/HEC), get a medical certificate and prepare passport copies." },
    { phase: "Apply to universities", timing: "Spring – early summer", text: "Submit your file to the university. Medicine programmes may hold entrance tests or interviews." },
    { phase: "Ministry Letter of Acceptance", timing: "Allow 30–60+ days", text: "The university sends your file to the Ministry of Education, which issues the Letter of Acceptance for Studies." },
    { phase: "Pay tuition & apply for visa", timing: "Summer", text: "Pay the first year's tuition, then apply for the long-stay student visa at the Romanian Embassy in Islamabad." },
    { phase: "Arrival", timing: "Late September", text: "Enrol before 1 October, get health insurance and apply for your residence permit at the immigration office." },
  ],

  requirements: {
    bachelor: [
      "HSSC/FSc (or A-levels) with good grades, especially in sciences for medicine",
      "English-taught programmes need IELTS/TOEFL or proof of English",
      "Romanian-taught programmes need a one-year Romanian preparatory course",
      "Medicine may require an entrance test or interview",
    ],
    master: [
      "A recognised bachelor's in a related field",
      "Transcripts and degree attested by HEC",
      "Proof of English for English-taught programmes",
      "Motivation letter and CV",
    ],
    language: [
      { test: "IELTS / TOEFL", note: "For English-taught programmes (some universities test you themselves)" },
      { test: "Romanian preparatory year", note: "For Romanian-taught programmes" },
      { test: "Basic Romanian", note: "Very helpful with patients in clinical years" },
    ],
    documents: [
      "Matric/HSSC attested by IBCC (translated where required)",
      "Degree and transcripts attested by HEC",
      "Birth certificate",
      "Passport copy",
      "Medical certificate",
      "Application form for the Letter of Acceptance",
    ],
  },

  studentLife: [
    { icon: "home", title: "Housing", text: "University dorms are very cheap but limited for international students. Shared flats near campus are the usual option." },
    { icon: "utensils", title: "Food & halal", text: "Groceries are affordable. Halal food is available in Bucharest and the big university cities, and many students cook at home." },
    { icon: "train", title: "Transport", text: "Cheap city buses and trams with student discounts. Trains between cities are slow but inexpensive." },
    { icon: "briefcase", title: "Part-time work", text: "Students can work part-time with limited hours. Medicine students rarely have time, so don't plan your budget around a job." },
    { icon: "cloud", title: "Weather", text: "Hot summers and cold, snowy winters (often below 0°C)." },
    { icon: "users", title: "Community", text: "Large international medical student communities in Cluj, Iași, Timișoara and Bucharest, including South Asian students." },
  ],

  decision: {
    choose: [
      "You want an EU degree at some of Europe's lowest costs",
      "You're aiming for medicine, dentistry or pharmacy in English",
      "You want Schengen travel (Romania joined fully in 2025)",
      "You prefer a lower cost of living than Western Europe",
      "You can pay the first year's tuition upfront",
      "You're patient with the Ministry acceptance process",
    ],
    avoid: [
      "You need a fast admission (the Ministry letter takes weeks)",
      "You can't pay a year of tuition before the visa",
      "You want a big English-speaking job market",
      "You're not ready for cold winters",
      "You haven't checked PMDC rules for medicine",
      "You want many English-taught bachelor's choices outside medicine",
    ],
  },

  realityChecks: [
    { expectation: "University admission means I'm accepted", reality: "Non-EU students also need the Ministry's Letter of Acceptance before the visa." },
    { expectation: "I can pay tuition monthly", reality: "Usually the first year is paid in one go before the visa application." },
    { expectation: "Medicine is easy to get into", reality: "Places in English are limited, and good universities test or interview applicants." },
    { expectation: "Everyone speaks English", reality: "Young people often do, but patients and offices often expect Romanian." },
    { expectation: "My EU degree lets me practise in Pakistan automatically", reality: "You must follow PMDC rules and licensing exams to practise in Pakistan." },
    { expectation: "Living costs are tiny everywhere", reality: "Bucharest and Cluj are noticeably more expensive than Iași or Craiova." },
  ],

  cityGoals: [
    { goal: "Medicine (top choice)", citySlug: "bucharest", reason: "Carol Davila, Romania's best-known medical university." },
    { goal: "Medicine (student city)", citySlug: "cluj-napoca", reason: "Iuliu Hațieganu and a lively student life." },
    { goal: "Low budget", citySlug: "iasi", reason: "Respected medical university in a very affordable city." },
    { goal: "Engineering & IT", citySlug: "timisoara", reason: "Politehnica University and a strong tech sector." },
    { goal: "Medicine & pharmacy", citySlug: "targu-mures", reason: "UMFST, a well-known medical university." },
    { goal: "Lowest cost", citySlug: "craiova", reason: "Very affordable city with a medical university." },
    { goal: "Seaside study", citySlug: "constanta", reason: "Ovidius University on the Black Sea coast." },
  ],

  pathways: [
    { title: "Medicine route", icon: "stethoscope", slugs: ["carol-davila-umf", "umf-cluj", "umf-iasi"] },
    { title: "Affordable medicine route", icon: "wallet", slugs: ["umf-craiova", "umfst-targu-mures", "university-of-oradea"] },
    { title: "Engineering route", icon: "cpu", slugs: ["politehnica-bucharest", "technical-university-cluj", "politehnica-timisoara"] },
    { title: "Business route", icon: "briefcase", slugs: ["ase-bucharest", "babes-bolyai", "west-university-timisoara"] },
    { title: "Computer science route", icon: "cpu", slugs: ["babes-bolyai", "politehnica-bucharest", "cuza-iasi"] },
    { title: "Dentistry & pharmacy route", icon: "stethoscope", slugs: ["umf-timisoara", "umf-cluj", "ovidius-university"] },
  ],

  extraCities: [
    {
      slug: "targu-mures",
      name: "Târgu Mureș",
      emoji: "🩺",
      region: "Transylvania",
      headline: "A medical university town in Transylvania",
      intro: "Târgu Mureș is a mid-sized Transylvanian city best known for its medical university (UMFST), which teaches medicine and pharmacy in several languages including English.",
      livingCost: "Low",
      bestFor: ["Medicine", "Pharmacy", "Dentistry"],
      highlights: [
        { title: "Medical focus", text: "UMFST is the city's main university." },
        { title: "Affordable", text: "Low rent and living costs." },
        { title: "Multicultural", text: "Romanian and Hungarian communities." },
      ],
      costCards: [
        { label: "Rent", value: "≈ €150 – €300", text: "Shared flats are affordable." },
        { label: "Food", value: "≈ €150", text: "Low prices." },
        { label: "Transport", value: "Bus", text: "Small city." },
      ],
      studentLife: ["Quiet, focused city", "Big medical student community", "Close to Transylvanian mountains"],
    },
    {
      slug: "craiova",
      name: "Craiova",
      emoji: "🌳",
      region: "Oltenia",
      headline: "One of the cheapest university cities in the EU",
      intro: "Craiova in south-western Romania is home to a medical university and the University of Craiova. It is among the most affordable places to study in the EU.",
      livingCost: "Low",
      bestFor: ["Medicine", "Engineering", "Agriculture"],
      highlights: [
        { title: "Very affordable", text: "Low rent and food prices." },
        { title: "Medical university", text: "UMF Craiova teaches medicine in English." },
        { title: "Green parks", text: "Large parks across the city." },
      ],
      costCards: [
        { label: "Rent", value: "≈ €130 – €280", text: "Very cheap." },
        { label: "Food", value: "≈ €140", text: "Low prices." },
        { label: "Transport", value: "Tram + bus", text: "Cheap passes." },
      ],
      studentLife: ["Calm city", "Low cost of living", "Smaller international community"],
    },
    {
      slug: "constanta",
      name: "Constanța",
      emoji: "🌊",
      region: "Dobruja",
      headline: "Study by the Black Sea",
      intro: "Constanța is Romania's main port on the Black Sea, home to Ovidius University, which offers medicine and other programmes.",
      livingCost: "Low–Medium",
      bestFor: ["Medicine", "Maritime Studies", "Tourism"],
      highlights: [
        { title: "Black Sea coast", text: "Beaches and a summer resort atmosphere." },
        { title: "Ovidius University", text: "Medicine, dentistry and pharmacy." },
        { title: "Port city", text: "Maritime and logistics careers." },
      ],
      costCards: [
        { label: "Rent", value: "≈ €180 – €350", text: "Higher in summer season." },
        { label: "Food", value: "≈ €160", text: "Affordable." },
        { label: "Transport", value: "Bus", text: "City buses." },
      ],
      studentLife: ["Seaside summers", "Quiet winters", "Port-city atmosphere"],
    },
    {
      slug: "oradea",
      name: "Oradea",
      emoji: "🏛️",
      region: "Crișana",
      headline: "Art nouveau city near Hungary",
      intro: "Oradea is a beautifully restored city close to the Hungarian border, with the University of Oradea offering medicine in English.",
      livingCost: "Low",
      bestFor: ["Medicine", "Engineering", "Business"],
      highlights: [
        { title: "Beautiful city", text: "Restored art nouveau centre." },
        { title: "Medicine in English", text: "Faculty of Medicine and Pharmacy." },
        { title: "Near Hungary", text: "Easy travel into Central Europe." },
      ],
      costCards: [
        { label: "Rent", value: "≈ €150 – €300", text: "Affordable." },
        { label: "Food", value: "≈ €150", text: "Low prices." },
        { label: "Transport", value: "Tram", text: "Compact city." },
      ],
      studentLife: ["Clean, safe city", "Thermal spas nearby", "Calm student life"],
    },
  ],

  cityExtras: {
    bucharest: { budget: { rent: [250, 450], food: [180, 250], transport: [10, 20], other: [50, 100] }, fit: { good: ["Top medical and technical universities", "Biggest job market", "International airport"], consider: ["Busier and pricier than other cities", "Traffic", "Large, spread-out city"] }, scholarshipNote: "Romanian Government scholarships can be used at Bucharest universities; some universities add merit awards after year one." },
    "cluj-napoca": { budget: { rent: [250, 450], food: [170, 230], transport: [10, 15], other: [50, 100] }, fit: { good: ["Medicine and IT", "Lively student life", "Safe, green city"], consider: ["Rising rents", "High housing demand", "Cold winters"] }, scholarshipNote: "Babeș-Bolyai and UMF Cluj offer merit and social scholarships to enrolled students." },
    iasi: { budget: { rent: [150, 350], food: [150, 210], transport: [5, 15], other: [40, 90] }, fit: { good: ["Affordable medicine", "Historic university city", "Low costs"], consider: ["Far from Western Europe", "Cold winters", "Smaller job market"] }, scholarshipNote: "Lower costs make self-funding realistic; ask about merit awards after the first year." },
    timisoara: { budget: { rent: [200, 400], food: [160, 220], transport: [5, 15], other: [40, 90] }, fit: { good: ["Engineering and IT", "Western, multicultural city", "Medicine in English"], consider: ["Smaller than Bucharest", "Romanian helps for jobs", "Hot summers"] }, scholarshipNote: "Politehnica and UMF Timișoara offer merit-based scholarships to enrolled students." },
    "targu-mures": { budget: { rent: [150, 300], food: [150, 200], transport: [5, 15], other: [40, 80] }, fit: { good: ["Medicine and pharmacy", "Low budgets", "Focused study"], consider: ["Small city", "Fewer job options", "Limited nightlife"] }, scholarshipNote: "Mainly self-funded; Romanian Government scholarships can apply." },
    craiova: { budget: { rent: [130, 280], food: [140, 190], transport: [5, 15], other: [40, 80] }, fit: { good: ["Lowest budgets", "Medicine in English", "Calm city"], consider: ["Smaller international community", "Fewer flights", "Hot summers"] }, scholarshipNote: "Very low living costs make this one of the cheapest EU options overall." },
    constanta: { budget: { rent: [180, 350], food: [160, 210], transport: [5, 15], other: [40, 90] }, fit: { good: ["Medicine by the sea", "Maritime studies", "Summer lifestyle"], consider: ["Seasonal rent increases", "Quiet winters", "Smaller university"] }, scholarshipNote: "Mainly self-funded; ask Ovidius about merit awards." },
    oradea: { budget: { rent: [150, 300], food: [150, 200], transport: [5, 15], other: [40, 80] }, fit: { good: ["Affordable medicine", "Beautiful, safe city", "Close to Hungary"], consider: ["Small city", "Fewer job options", "Smaller international community"] }, scholarshipNote: "Mainly self-funded; Romanian Government scholarships can apply." },
  },

  extraUniversities: [
    { slug: "umfst-targu-mures", name: "George Emil Palade University of Medicine, Pharmacy, Science and Technology (UMFST)", citySlug: "targu-mures", city: "Târgu Mureș", type: "Medical", tuitionBand: "Moderate", tuitionNote: "English-taught medicine; check current fee", programs: ["Medicine", "Pharmacy", "Dentistry"], popularFor: "Medicine and pharmacy in Transylvania", website: "https://www.umfst.ro/en/" },
    { slug: "umf-craiova", name: "University of Medicine and Pharmacy of Craiova", citySlug: "craiova", city: "Craiova", type: "Medical", tuitionBand: "Moderate", tuitionNote: "English-taught medicine; check current fee", programs: ["Medicine", "Dentistry", "Pharmacy"], popularFor: "Affordable medicine in English", website: "https://www.umfcv.ro/" },
    { slug: "ovidius-university", name: "Ovidius University of Constanța", citySlug: "constanta", city: "Constanța", type: "Public", tuitionBand: "Moderate", tuitionNote: "Non-EU state fee; medicine higher", programs: ["Medicine", "Dentistry", "Pharmacy", "Engineering"], popularFor: "Medicine and more on the Black Sea", website: "https://www.univ-ovidius.ro/en/" },
    { slug: "university-of-oradea", name: "University of Oradea", citySlug: "oradea", city: "Oradea", type: "Public", tuitionBand: "Moderate", tuitionNote: "Non-EU state fee; medicine higher", programs: ["Medicine", "Engineering", "Business"], popularFor: "Medicine in English near Hungary", website: "https://www.uoradea.ro/" },
    { slug: "transilvania-brasov", name: "Transilvania University of Brașov", citySlug: null, city: "Brașov", type: "Public", tuitionBand: "Low", tuitionNote: "Non-EU state fee", programs: ["Engineering", "Forestry", "Music", "Medicine"], popularFor: "Engineering in a beautiful mountain city", website: "https://www.unitbv.ro/en/" },
  ],

  universityExtras: {
    "carol-davila-umf": { about: "Carol Davila is Romania's best-known university of medicine and pharmacy, based in Bucharest, with English-taught programmes.", highlights: ["Romania's most famous medical university", "Large teaching hospitals", "Capital-city location"], english: "Medicine and dentistry offered in English" },
    "university-of-bucharest": { about: "The University of Bucharest is Romania's leading comprehensive university, covering sciences, humanities, law and business.", highlights: ["Romania's flagship university", "Wide range of subjects", "Central Bucharest"], english: "Selected master's programmes in English" },
    "politehnica-bucharest": { about: "POLITEHNICA Bucharest is Romania's largest technical university, with engineering, IT and energy programmes.", highlights: ["Largest technical university in Romania", "Programmes in English and French", "Strong IT and engineering"], english: "Several programmes in English" },
    "ase-bucharest": { about: "The Bucharest University of Economic Studies (ASE) is Romania's leading economics and business university.", highlights: ["Top economics school in Romania", "Strong business and finance", "Large alumni network"], english: "Several programmes in English" },
    "babes-bolyai": { about: "Babeș-Bolyai University in Cluj-Napoca is Romania's largest university, teaching in Romanian, Hungarian, German and English.", highlights: ["Romania's largest university", "Multilingual teaching", "Strong computer science"], english: "Several programmes in English" },
    "umf-cluj": { about: "Iuliu Hațieganu is a highly regarded medical university in Cluj-Napoca, teaching medicine in Romanian, English and French.", highlights: ["Highly regarded medical school", "English and French tracks", "Lively student city"], english: "Medicine, dentistry and pharmacy in English" },
    "technical-university-cluj": { about: "The Technical University of Cluj-Napoca is a leading engineering university in one of Romania's tech hubs.", highlights: ["Strong IT industry nearby", "Engineering and automation", "Growing city"], english: "Selected programmes in English" },
    "cuza-iasi": { about: "Alexandru Ioan Cuza University is Romania's oldest modern university, founded in 1860 in Iași.", highlights: ["Romania's oldest university", "Broad subject range", "Very affordable city"], english: "Selected programmes in English" },
    "umf-iasi": { about: "Grigore T. Popa University of Medicine and Pharmacy in Iași is popular with international students for affordable medicine.", highlights: ["English and French medicine tracks", "Low living costs", "Large international community"], english: "Medicine and dentistry in English" },
    tuiasi: { about: "Gheorghe Asachi Technical University is the main engineering university in Iași.", highlights: ["Engineering and architecture", "Low living costs", "Historic city"], english: "Selected programmes in English" },
    "west-university-timisoara": { about: "West University of Timișoara is a comprehensive university in western Romania's most multicultural city.", highlights: ["Economics and computer science", "Western-oriented city", "Lively campus"], english: "Selected programmes in English" },
    "umf-timisoara": { about: "Victor Babeș University of Medicine and Pharmacy in Timișoara teaches medicine, dentistry and pharmacy in English.", highlights: ["Medicine in English", "Western Romanian city", "Modern facilities"], english: "Medicine and dentistry in English" },
    "politehnica-timisoara": { about: "Politehnica University of Timișoara is a leading technical university with strong IT and engineering links.", highlights: ["Strong tech industry links", "Engineering and computer science", "Affordable city"], english: "Selected programmes in English" },
    "umfst-targu-mures": { about: "UMFST in Târgu Mureș is a well-known medical university that also teaches science and technology.", highlights: ["Medicine and pharmacy", "Affordable city", "English-taught tracks"], english: "Medicine and pharmacy in English" },
    "umf-craiova": { about: "The University of Medicine and Pharmacy of Craiova offers English-taught medicine in one of the EU's cheapest university cities.", highlights: ["Very low living costs", "English medicine", "Teaching hospital links"], english: "Medicine in English" },
    "ovidius-university": { about: "Ovidius University is a comprehensive public university in the Black Sea port of Constanța.", highlights: ["Medicine and dentistry", "Seaside city", "Maritime programmes"], english: "Medicine and selected programmes in English" },
    "university-of-oradea": { about: "The University of Oradea is a comprehensive public university with a Faculty of Medicine and Pharmacy teaching in English.", highlights: ["Medicine in English", "Beautiful, affordable city", "Close to Hungary"], english: "Medicine and selected programmes in English" },
    "transilvania-brasov": { about: "Transilvania University of Brașov is a comprehensive university in a popular mountain city.", highlights: ["Engineering and forestry", "Beautiful mountain setting", "Affordable"], english: "Selected programmes in English" },
  },

  moreFaqs: [
    { q: "How long does the Romanian Letter of Acceptance take?", a: "Usually 30–60 days or more after the university submits your file, so apply early." },
    { q: "Which Romanian city is cheapest?", a: "Craiova, Iași, Oradea and Târgu Mureș are among the cheapest; Bucharest and Cluj cost more." },
    { q: "Is an entrance exam required for medicine?", a: "Some universities test or interview international applicants; others admit based on grades. It depends on the university." },
    { q: "Can I transfer to another EU country later?", a: "Transfers are sometimes possible but never guaranteed. Choose your university as if you'll graduate there." },
    { q: "Is Romania safe?", a: "Romania is generally safe for students. Normal city precautions apply." },
  ],
};
