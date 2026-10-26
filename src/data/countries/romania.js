import { romaniaMeta } from "./meta";

export const romaniaData = {
  ...romaniaMeta,

  whyStudy: [
    { icon: "wallet", title: "Very low costs", text: "Among the cheapest tuition and living costs in the EU." },
    { icon: "stethoscope", title: "Medicine in English", text: "Long-established English-taught medicine, dentistry and pharmacy." },
    { icon: "shield", title: "EU degree", text: "Degrees recognised across the European Union." },
    { icon: "plane", title: "Schengen member", text: "Full Schengen member since January 2025." },
  ],

  costs: {
    tuition: [
      { label: "Bachelor's / master's (state)", value: "≈ €2,000 – €3,500 / year", note: "Some universities quote ≈ €220–€320 per month." },
      { label: "Medicine / dentistry (English)", value: "≈ €5,000 – €7,500 / year", note: "UMF universities in Bucharest, Cluj, Iași and Timișoara." },
      { label: "Romanian preparatory year", value: "≈ €2,000 – €2,500 / year", note: "Required for Romanian-taught programmes." },
      { label: "First-year payment", value: "Before visa", note: "Non-EU students usually pay one year upfront." },
    ],
    living: [
      { label: "Dorm / rent", value: "≈ €100 – €400", note: "Dorms are very cheap; private flats cost more." },
      { label: "Food", value: "≈ €150 – €250", note: "Affordable supermarkets." },
      { label: "Transport", value: "≈ €10 – €25", note: "Student discounts available." },
      { label: "Health insurance", value: "Required", note: "Needed for the residence permit." },
    ],
  },

  scholarships: [
    {
      name: "Romanian Government Scholarships",
      provider: "Ministry of Foreign Affairs of Romania",
      covers: "Tuition waiver and monthly allowance",
      level: "Bachelor's · Master's · PhD",
      note: "For non-EU citizens. Calls are usually published early in the year, so check studyinromania.gov.ro.",
      link: "https://www.studyinromania.gov.ro/",
    },
    {
      name: "University scholarships",
      provider: "Romanian universities",
      covers: "Merit and social scholarships",
      level: "Enrolled students",
      note: "Some universities offer merit awards after the first year.",
    },
    {
      name: "Erasmus+",
      provider: "European Union",
      covers: "Monthly grant for an exchange semester",
      level: "Enrolled students",
      note: "Spend a semester at another EU university.",
    },
  ],

  admissionSteps: [
    { title: "Choose university & language", text: "English-taught programmes are mainly in medicine, engineering and business. Romanian-taught programmes need a prep year." },
    { title: "Apply to the university", text: "Submit your file (attested documents, passport, photos). Some universities run entrance tests for medicine." },
    { title: "Ministry Letter of Acceptance", text: "The university forwards your file to the Ministry of Education, which issues the Letter of Acceptance. This can take 30–60+ days." },
    { title: "Pay first-year tuition", text: "Usually required before the visa application." },
    { title: "Apply for the visa", text: "Apply at the Romanian Embassy in Islamabad." },
  ],

  visa: {
    name: "Long-Stay Student Visa (D/SD)",
    summary:
      "Apply at the Romanian Embassy in Islamabad with your Ministry Letter of Acceptance and proof of tuition payment. After arrival you register and get a residence permit from the General Inspectorate for Immigration.",
    steps: [
      "Receive the Letter of Acceptance for Studies from the Ministry",
      "Pay one year of tuition",
      "Apply for the long-stay student visa",
      "Arrive and enrol at your university",
      "Apply for your residence permit",
    ],
    documents: [
      "Passport and photos",
      "Letter of Acceptance for Studies",
      "Proof of tuition payment",
      "Proof of funds",
      "Medical insurance",
      "Criminal record certificate",
    ],
  },

  cities: [
    {
      slug: "bucharest",
      name: "Bucharest",
      emoji: "🏛️",
      region: "Bucharest",
      headline: "The capital and largest university centre",
      intro:
        "Bucharest is Romania's capital, with Carol Davila medicine, Politehnica, ASE and the University of Bucharest. It has the most job opportunities and the highest prices in Romania.",
      livingCost: "Medium",
      bestFor: ["Medicine", "Engineering", "Business", "IT"],
      highlights: [
        { title: "Most choice", text: "The widest range of universities in Romania." },
        { title: "IT jobs", text: "Big tech and outsourcing industry." },
        { title: "Connected", text: "Main international airport." },
      ],
      costCards: [
        { label: "Rent", value: "≈ €250 – €450", text: "Dorms are much cheaper." },
        { label: "Food", value: "≈ €200", text: "Affordable." },
        { label: "Transport", value: "Metro + bus", text: "Student discounts." },
      ],
      studentLife: ["Busy capital", "Parks and cafés", "Lively nightlife"],
    },
    {
      slug: "cluj-napoca",
      name: "Cluj-Napoca",
      emoji: "🎓",
      region: "Transylvania",
      headline: "Romania's favourite student city",
      intro:
        "Cluj-Napoca is young, safe and full of students, with Babeș-Bolyai University and the Iuliu Hațieganu medical university. It also has a booming IT sector.",
      livingCost: "Medium",
      bestFor: ["Medicine", "IT", "Business"],
      highlights: [
        { title: "Student capital", text: "Huge student population and festivals." },
        { title: "Medical school", text: "Iuliu Hațieganu is highly regarded." },
        { title: "Tech scene", text: "Strong IT companies." },
      ],
      costCards: [
        { label: "Rent", value: "≈ €250 – €450", text: "High demand, start early." },
        { label: "Food", value: "≈ €180", text: "Affordable." },
        { label: "Transport", value: "Bus", text: "Compact city." },
      ],
      studentLife: ["Festival city", "Safe and green", "Strong community"],
    },
    {
      slug: "iasi",
      name: "Iași",
      emoji: "⛪",
      region: "Moldavia",
      headline: "Historic university city with low costs",
      intro:
        "Iași is home to Romania's oldest university and a respected medical university. It is one of the most affordable student cities in the EU.",
      livingCost: "Low",
      bestFor: ["Medicine", "Engineering", "Humanities"],
      highlights: [
        { title: "Oldest university", text: "Alexandru Ioan Cuza University dates to 1860." },
        { title: "Medicine", text: "Grigore T. Popa UMF teaches in English and French." },
        { title: "Very affordable", text: "Low rent and living costs." },
      ],
      costCards: [
        { label: "Rent", value: "≈ €150 – €350", text: "Very affordable." },
        { label: "Food", value: "≈ €150", text: "Low prices." },
        { label: "Transport", value: "Tram", text: "Student passes." },
      ],
      studentLife: ["Calm city", "Historic architecture", "Large medical student community"],
    },
    {
      slug: "timisoara",
      name: "Timișoara",
      emoji: "🌸",
      region: "Banat",
      headline: "Western, multicultural and close to Central Europe",
      intro:
        "Timișoara is one of Romania's most Western-oriented cities, with Politehnica, West University and Victor Babeș medical university.",
      livingCost: "Low–Medium",
      bestFor: ["Engineering", "Medicine", "IT"],
      highlights: [
        { title: "Engineering", text: "Politehnica University is well known." },
        { title: "Medicine", text: "Victor Babeș UMF teaches in English." },
        { title: "Near Hungary & Serbia", text: "Easy travel into Central Europe." },
      ],
      costCards: [
        { label: "Rent", value: "≈ €200 – €400", text: "Reasonable." },
        { label: "Food", value: "≈ €170", text: "Affordable." },
        { label: "Transport", value: "Tram", text: "Good coverage." },
      ],
      studentLife: ["Parks and squares", "Multicultural", "Relaxed"],
    },
  ],

  universities: [
    { slug: "carol-davila-umf", name: "Carol Davila University of Medicine and Pharmacy", citySlug: "bucharest", city: "Bucharest", type: "Medical", tuitionBand: "Moderate", tuitionNote: "English-taught medicine, check current fee", programs: ["Medicine", "Dentistry", "Pharmacy"], popularFor: "Romania's best-known medical university", website: "https://umfcd.ro/en/" },
    { slug: "university-of-bucharest", name: "University of Bucharest", citySlug: "bucharest", city: "Bucharest", type: "Public", tuitionBand: "Low", tuitionNote: "Non-EU state fee", programs: ["Business", "Law", "Sciences", "Languages"], popularFor: "Comprehensive capital university", website: "https://unibuc.ro/?lang=en" },
    { slug: "politehnica-bucharest", name: "National University of Science and Technology POLITEHNICA Bucharest", citySlug: "bucharest", city: "Bucharest", type: "Technical", tuitionBand: "Low", tuitionNote: "Non-EU state fee", programs: ["Engineering", "Computer Science", "Energy"], popularFor: "Largest technical university in Romania", website: "https://upb.ro/en/" },
    { slug: "ase-bucharest", name: "Bucharest University of Economic Studies (ASE)", citySlug: "bucharest", city: "Bucharest", type: "Public", tuitionBand: "Low", tuitionNote: "Non-EU state fee", programs: ["Economics", "Business", "Finance"], popularFor: "Economics and business", website: "https://www.ase.ro/" },
    { slug: "babes-bolyai", name: "Babeș-Bolyai University", citySlug: "cluj-napoca", city: "Cluj-Napoca", type: "Public", tuitionBand: "Low", tuitionNote: "≈ €220–€950 per month depending on programme", programs: ["Business", "Computer Science", "Psychology"], popularFor: "Romania's largest university", website: "https://www.ubbcluj.ro/en/" },
    { slug: "umf-cluj", name: "Iuliu Hațieganu University of Medicine and Pharmacy", citySlug: "cluj-napoca", city: "Cluj-Napoca", type: "Medical", tuitionBand: "Moderate", tuitionNote: "English and French-taught medicine", programs: ["Medicine", "Dentistry", "Pharmacy"], popularFor: "Highly regarded medical university", website: "https://umfcluj.ro/en/" },
    { slug: "technical-university-cluj", name: "Technical University of Cluj-Napoca", citySlug: "cluj-napoca", city: "Cluj-Napoca", type: "Technical", tuitionBand: "Low", tuitionNote: "Non-EU state fee", programs: ["Engineering", "Computer Science", "Automation"], popularFor: "Engineering in a tech-hub city", website: "https://www.utcluj.ro/en/" },
    { slug: "cuza-iasi", name: "Alexandru Ioan Cuza University", citySlug: "iasi", city: "Iași", type: "Public", tuitionBand: "Low", tuitionNote: "≈ €2,070–€3,500 per year for undergraduates", programs: ["Humanities", "Business", "Computer Science"], popularFor: "Romania's oldest university", website: "https://www.uaic.ro/en/" },
    { slug: "umf-iasi", name: "Grigore T. Popa University of Medicine and Pharmacy", citySlug: "iasi", city: "Iași", type: "Medical", tuitionBand: "Moderate", tuitionNote: "English and French-taught medicine", programs: ["Medicine", "Dentistry", "Pharmacy"], popularFor: "Affordable medical studies", website: "https://www.umfiasi.ro/en" },
    { slug: "tuiasi", name: "Gheorghe Asachi Technical University of Iași", citySlug: "iasi", city: "Iași", type: "Technical", tuitionBand: "Low", tuitionNote: "Non-EU state fee", programs: ["Engineering", "Architecture"], popularFor: "Engineering in a low-cost city", website: "https://www.tuiasi.ro/" },
    { slug: "west-university-timisoara", name: "West University of Timișoara", citySlug: "timisoara", city: "Timișoara", type: "Public", tuitionBand: "Low", tuitionNote: "Non-EU state fee", programs: ["Economics", "Computer Science", "Arts"], popularFor: "Comprehensive university in western Romania", website: "https://www.uvt.ro/en/" },
    { slug: "umf-timisoara", name: "Victor Babeș University of Medicine and Pharmacy", citySlug: "timisoara", city: "Timișoara", type: "Medical", tuitionBand: "Moderate", tuitionNote: "English-taught medicine", programs: ["Medicine", "Dentistry", "Pharmacy"], popularFor: "Medicine in English", website: "https://www.umft.ro/en/" },
    { slug: "politehnica-timisoara", name: "Politehnica University of Timișoara", citySlug: "timisoara", city: "Timișoara", type: "Technical", tuitionBand: "Low", tuitionNote: "Non-EU state fee", programs: ["Engineering", "Computer Science"], popularFor: "Engineering and IT", website: "https://www.upt.ro/" },
  ],

  faqs: [
    { q: "What is the Letter of Acceptance?", a: "Non-EU students need a Letter of Acceptance for Studies issued by the Romanian Ministry of Education, not just the university. It is required for the visa and usually takes 30–60+ days." },
    { q: "Is medicine in Romania recognised in Pakistan?", a: "Romanian medical degrees are EU-recognised. For practice in Pakistan you must follow PMDC rules and licensing exams, so check before applying." },
    { q: "Is Romania in Schengen?", a: "Yes. Romania became a full Schengen member in January 2025." },
    { q: "Do I need to learn Romanian?", a: "Only for Romanian-taught programmes, which require a one-year preparatory course. English-taught programmes don't, though basic Romanian helps with patients in clinical years." },
  ],

  lastReviewed: "October 2026",
  sources: [
    { label: "Study in Romania (official)", url: "https://www.studyinromania.gov.ro/" },
    { label: "Romanian Ministry of Education", url: "https://www.edu.ro/" },
  ],
};
