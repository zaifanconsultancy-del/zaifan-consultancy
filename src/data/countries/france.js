export const franceData = {
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

  whyStudy: [
    { icon: "wallet", title: "State-set public tuition", text: "Public university fees are fixed nationally, far below UK or US prices." },
    { icon: "trophy", title: "Grandes écoles & business schools", text: "Sciences Po, Polytechnique, HEC and ESSEC are known worldwide." },
    { icon: "home", title: "Housing aid (CAF)", text: "International students can apply for monthly housing assistance." },
    { icon: "plane", title: "Schengen access", text: "Travel across Europe on your French residence permit." },
  ],

  costs: {
    tuition: [
      { label: "Public university – licence", value: "≈ €2,900 / year", note: "Non-EU state-set fee for 2026–27." },
      { label: "Public university – master's", value: "≈ €3,950 / year", note: "Some universities grant partial exemptions (now capped)." },
      { label: "Engineering schools", value: "Varies", note: "Public schools are moderate; private schools are higher." },
      { label: "Business schools", value: "≈ €10k – €25k+ / year", note: "Strong career services and English programmes." },
    ],
    living: [
      { label: "Rent", value: "≈ €350 – €800", note: "CROUS student residences are cheapest." },
      { label: "Food", value: "≈ €250", note: "CROUS restaurants offer cheap meals." },
      { label: "CVEC (student life fee)", value: "≈ €105 / year", note: "Paid once a year by all students." },
      { label: "Transport", value: "≈ €25 – €90", note: "Student passes; Paris is higher." },
    ],
  },

  scholarships: [
    {
      name: "Eiffel Excellence Scholarship",
      provider: "French Ministry for Europe and Foreign Affairs",
      covers: "Monthly allowance, travel, insurance, cultural activities",
      level: "Master's · PhD",
      note: "Nominated by the French institution you apply to, so you cannot apply directly. Deadlines are usually in January.",
      link: "https://www.campusfrance.org/en/eiffel-scholarship-program-of-excellence",
    },
    {
      name: "Embassy of France in Pakistan scholarships",
      provider: "French Embassy / Campus France Pakistan",
      covers: "Varies by programme",
      level: "Master's · PhD",
      note: "Check Campus France Pakistan for current calls.",
      link: "https://www.pakistan.campusfrance.org/",
    },
    {
      name: "University & school scholarships",
      provider: "French universities and grandes écoles",
      covers: "Tuition waivers or stipends",
      level: "Master's",
      note: "Many schools offer excellence scholarships for international master's students.",
    },
    {
      name: "Erasmus Mundus Joint Masters",
      provider: "European Union",
      covers: "Tuition, travel and a monthly allowance",
      level: "Master's",
      note: "Many joint masters include a semester in France.",
      link: "https://www.eacea.ec.europa.eu/scholarships/erasmus-mundus-catalogue_en",
    },
  ],

  admissionSteps: [
    { title: "Shortlist programmes", text: "Use the Campus France catalogue to find English- or French-taught programmes." },
    { title: "Create an Études en France account", text: "Pakistani students follow the Campus France Pakistan procedure." },
    { title: "Apply & get admitted", text: "Apply through the platform or directly to the school, then confirm your admission ('Je suis accepté')." },
    { title: "Pay the Campus France fee & interview", text: "Pay the registration fee (≈ PKR 25,000) and complete the academic interview." },
    { title: "Apply for the visa", text: "Complete France-Visas and book your appointment." },
  ],

  visa: {
    name: "VLS-TS Long-Stay Student Visa",
    summary:
      "After the Campus France procedure, apply on France-Visas and attend your appointment. The VLS-TS works as a residence permit for the first year, and you validate it online within 3 months of arriving.",
    steps: [
      "Receive admission from a French institution",
      "Complete the Études en France procedure with Campus France Pakistan",
      "Fill the France-Visas application and book an appointment",
      "Submit documents and biometrics",
      "Arrive and validate your VLS-TS online",
    ],
    documents: [
      "Passport and photos",
      "Admission letter",
      "Campus France certificate",
      "Proof of resources (≈ €615 per month minimum)",
      "Proof of accommodation for the first months",
      "Academic documents",
    ],
  },

  cities: [
    {
      slug: "paris",
      name: "Paris",
      emoji: "🗼",
      region: "Île-de-France",
      headline: "Prestige, culture and the highest costs",
      intro:
        "Paris concentrates France's most famous universities and grandes écoles, global companies and cultural life. It is expensive, so CROUS housing and CAF aid matter a lot.",
      livingCost: "High",
      bestFor: ["Business", "Political Science", "Engineering", "Arts"],
      highlights: [
        { title: "Elite institutions", text: "PSL, Sorbonne, Sciences Po, Paris-Saclay and Polytechnique." },
        { title: "Career capital", text: "Headquarters of many European and global firms." },
        { title: "Culture everywhere", text: "Many national museums are free for under-26s living in the EU." },
      ],
      costCards: [
        { label: "Rent", value: "≈ €600 – €1,000", text: "Apply for CROUS and CAF early." },
        { label: "Food", value: "≈ €280", text: "CROUS canteens help a lot." },
        { label: "Transport", value: "Navigo Imagine R", text: "Discounted student transport pass." },
      ],
      studentLife: ["World city lifestyle", "Huge international community", "Expensive but full of opportunity"],
    },
    {
      slug: "lyon",
      name: "Lyon",
      emoji: "🦁",
      region: "Auvergne-Rhône-Alpes",
      headline: "Second student city with lower costs",
      intro:
        "Lyon is France's gastronomic capital and a major student city with strong engineering, medicine and business schools. It is cheaper and calmer than Paris.",
      livingCost: "Medium",
      bestFor: ["Engineering", "Medicine", "Business"],
      highlights: [
        { title: "Strong schools", text: "INSA Lyon, Lyon 1 and emlyon business school." },
        { title: "Value for money", text: "Much cheaper than Paris." },
        { title: "Central location", text: "Close to the Alps, Switzerland and Italy." },
      ],
      costCards: [
        { label: "Rent", value: "≈ €400 – €650", text: "Good student housing stock." },
        { label: "Food", value: "≈ €230", text: "Famous food city." },
        { label: "Transport", value: "TCL student pass", text: "Metro, tram and bus." },
      ],
      studentLife: ["Riverside city", "Big student population", "Food culture"],
    },
    {
      slug: "toulouse",
      name: "Toulouse",
      emoji: "✈️",
      region: "Occitanie",
      headline: "Europe's aerospace capital",
      intro:
        "Toulouse is home to Airbus and a major aerospace cluster, with strong universities and engineering schools. The weather is sunny and costs are moderate.",
      livingCost: "Medium",
      bestFor: ["Aerospace", "Engineering", "Sciences"],
      highlights: [
        { title: "Aerospace hub", text: "Airbus and the space industry are based here." },
        { title: "Student city", text: "Over 100,000 students." },
        { title: "Affordable", text: "Lower living costs than Paris or Lyon." },
      ],
      costCards: [
        { label: "Rent", value: "≈ €380 – €600", text: "Plenty of student options." },
        { label: "Food", value: "≈ €220", text: "Affordable markets." },
        { label: "Transport", value: "Tisséo pass", text: "Metro and tram." },
      ],
      studentLife: ["Sunny southern city", "Pink-brick old town", "Strong engineering community"],
    },
    {
      slug: "grenoble",
      name: "Grenoble",
      emoji: "🏔️",
      region: "Auvergne-Rhône-Alpes",
      headline: "Science and innovation in the Alps",
      intro:
        "Grenoble is a science city surrounded by mountains, with Université Grenoble Alpes and major research labs in physics, nanotech and energy.",
      livingCost: "Low–Medium",
      bestFor: ["Physics", "Electronics", "Energy", "Computer Science"],
      highlights: [
        { title: "Research hub", text: "Major labs and innovation campuses." },
        { title: "Alpine setting", text: "Skiing and hiking on your doorstep." },
        { title: "Affordable", text: "Cheaper than most big French cities." },
      ],
      costCards: [
        { label: "Rent", value: "≈ €350 – €550", text: "CROUS residences on campus." },
        { label: "Food", value: "≈ €210", text: "Student-friendly." },
        { label: "Transport", value: "Tram + bike", text: "Very bike-friendly." },
      ],
      studentLife: ["Outdoor lifestyle", "Very international research community", "Compact city"],
    },
    {
      slug: "strasbourg",
      name: "Strasbourg",
      emoji: "🇪🇺",
      region: "Grand Est",
      headline: "A European capital on the German border",
      intro:
        "Strasbourg hosts the European Parliament and the University of Strasbourg. It is bilingual, very international and well placed for European careers.",
      livingCost: "Medium",
      bestFor: ["Law", "International Relations", "Chemistry", "Medicine"],
      highlights: [
        { title: "EU institutions", text: "The European Parliament and Council of Europe are here." },
        { title: "Strong university", text: "The University of Strasbourg has several Nobel laureates." },
        { title: "Cross-border", text: "Germany is just across the Rhine." },
      ],
      costCards: [
        { label: "Rent", value: "≈ €400 – €600", text: "Mix of CROUS and private flats." },
        { label: "Food", value: "≈ €220", text: "Franco-German cuisine." },
        { label: "Transport", value: "CTS pass", text: "Tram network." },
      ],
      studentLife: ["European atmosphere", "Picturesque old town", "Bike city"],
    },
  ],

  universities: [
    { slug: "psl-university", name: "Université PSL", citySlug: "paris", city: "Paris", type: "Public", tuitionBand: "Moderate", tuitionNote: "State-set fees at member schools; some charge more", programs: ["Sciences", "Economics", "Humanities"], popularFor: "France's top-ranked university group", website: "https://psl.eu/en" },
    { slug: "sorbonne-universite", name: "Sorbonne University", citySlug: "paris", city: "Paris", type: "Public", tuitionBand: "Moderate", tuitionNote: "State-set non-EU fees", programs: ["Sciences", "Medicine", "Humanities"], popularFor: "Historic research university", website: "https://www.sorbonne-universite.fr/en" },
    { slug: "universite-paris-saclay", name: "Université Paris-Saclay", citySlug: "paris", city: "Paris region", type: "Public", tuitionBand: "Moderate", tuitionNote: "State-set non-EU fees", programs: ["Mathematics", "Physics", "Engineering"], popularFor: "Science and maths powerhouse", website: "https://www.universite-paris-saclay.fr/en" },
    { slug: "institut-polytechnique-de-paris", name: "Institut Polytechnique de Paris", citySlug: "paris", city: "Paris region", type: "Technical", tuitionBand: "High", tuitionNote: "Programme-specific fees", programs: ["Engineering", "Data Science", "Applied Maths"], popularFor: "Elite engineering schools including École Polytechnique", website: "https://www.ip-paris.fr/en" },
    { slug: "sciences-po", name: "Sciences Po", citySlug: "paris", city: "Paris", type: "Private", tuitionBand: "High", tuitionNote: "Income-based fees, scholarships available", programs: ["Political Science", "International Affairs", "Law"], popularFor: "Politics and international affairs", website: "https://www.sciencespo.fr/en/" },
    { slug: "universite-lyon-1", name: "Université Claude Bernard Lyon 1", citySlug: "lyon", city: "Lyon", type: "Public", tuitionBand: "Moderate", tuitionNote: "State-set non-EU fees", programs: ["Medicine", "Sciences", "Pharmacy"], popularFor: "Health and sciences", website: "https://www.univ-lyon1.fr/en" },
    { slug: "insa-lyon", name: "INSA Lyon", citySlug: "lyon", city: "Lyon", type: "Technical", tuitionBand: "Moderate", tuitionNote: "Public engineering school fees", programs: ["Engineering", "Computer Science"], popularFor: "Public engineering school", website: "https://www.insa-lyon.fr/en/" },
    { slug: "university-toulouse-3", name: "Université Toulouse III – Paul Sabatier", citySlug: "toulouse", city: "Toulouse", type: "Public", tuitionBand: "Moderate", tuitionNote: "State-set non-EU fees", programs: ["Sciences", "Health", "Engineering"], popularFor: "Sciences in Europe's aerospace capital", website: "https://www.univ-tlse3.fr/" },
    { slug: "universite-grenoble-alpes", name: "Université Grenoble Alpes", citySlug: "grenoble", city: "Grenoble", type: "Public", tuitionBand: "Moderate", tuitionNote: "State-set non-EU fees", programs: ["Physics", "Computer Science", "Energy"], popularFor: "Science and engineering in the Alps", website: "https://www.univ-grenoble-alpes.fr/english/" },
    { slug: "universite-de-strasbourg", name: "University of Strasbourg", citySlug: "strasbourg", city: "Strasbourg", type: "Public", tuitionBand: "Moderate", tuitionNote: "State-set non-EU fees", programs: ["Chemistry", "Law", "Medicine"], popularFor: "Research university in a European capital", website: "https://en.unistra.fr/" },
  ],

  faqs: [
    { q: "Do I need French to study in France?", a: "Not for English-taught programmes, which are common at master's level. Some French helps a lot with part-time work, housing and daily life." },
    { q: "What is Études en France?", a: "It is the mandatory Campus France online procedure for Pakistani students. It includes a registration fee and an interview before the visa application." },
    { q: "Can I work while studying?", a: "Yes, up to 964 hours per year (about 60% of full-time), which works out to roughly 20 hours per week." },
    { q: "Can I stay after my degree?", a: "Master's graduates can apply for a one-year residence permit to look for a job or start a business." },
  ],

  lastReviewed: "October 2026",
  sources: [
    { label: "Campus France Pakistan", url: "https://www.pakistan.campusfrance.org/" },
    { label: "France-Visas", url: "https://france-visas.gouv.fr/" },
  ],
};
