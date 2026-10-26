import { lithuaniaMeta } from "./meta";

export const lithuaniaData = {
  ...lithuaniaMeta,

  whyStudy: [
    { icon: "languages", title: "English-taught", text: "A wide choice of programmes fully in English." },
    { icon: "shield", title: "Safe & digital", text: "Fast internet, e-government and a calm lifestyle." },
    { icon: "briefcase", title: "Work rights", text: "Part-time work while studying and a 12-month post-study permit." },
    { icon: "plane", title: "EU & Schengen", text: "Travel across Schengen on your residence permit." },
  ],

  costs: {
    tuition: [
      { label: "Bachelor's", value: "≈ €2,500 – €4,500 / year", note: "IT and engineering are usually at the higher end." },
      { label: "Master's", value: "≈ €4,000 – €6,000 / year", note: "Business schools may cost more." },
      { label: "Medicine / dentistry", value: "≈ €10k – €15k+ / year", note: "Lithuanian University of Health Sciences and Vilnius University." },
      { label: "Application fee", value: "≈ €100 – €150", note: "Most universities charge a non-refundable fee." },
    ],
    living: [
      { label: "Dorm / rent", value: "≈ €150 – €450", note: "Dorms are much cheaper than flats." },
      { label: "Food", value: "≈ €200 – €250", note: "Supermarket prices are moderate." },
      { label: "Transport", value: "≈ €10 – €20", note: "Large student discounts." },
      { label: "Health insurance", value: "Required", note: "Needed for the residence permit." },
    ],
  },

  scholarships: [
    {
      name: "Lithuanian State Scholarships",
      provider: "Government of Lithuania",
      covers: "Tuition waiver and/or monthly stipend (varies)",
      level: "Master's · PhD · summer courses",
      note: "Calls change each year, so check Study in Lithuania for eligible countries and deadlines.",
      link: "https://www.studyin.lt/",
    },
    {
      name: "University scholarships",
      provider: "KTU, VMU, Vilnius Tech and others",
      covers: "Partial or full tuition waivers",
      level: "Bachelor's · Master's",
      note: "Many universities offer merit-based fee reductions for strong applicants.",
    },
    {
      name: "Erasmus+",
      provider: "European Union",
      covers: "Monthly grant for an exchange semester",
      level: "Enrolled students",
      note: "Spend a semester elsewhere in the EU.",
    },
  ],

  admissionSteps: [
    { title: "Choose programmes", text: "Most universities have English-taught programmes listed on their admissions sites." },
    { title: "Apply online", text: "Apply via the university portal with attested documents and English test." },
    { title: "Receive admission", text: "Pay the first tuition instalment if required." },
    { title: "Apply for the TRP", text: "Your university usually helps with the residence permit application on MIGRIS." },
    { title: "Submit documents", text: "Attend the designated Lithuanian embassy or visa centre your university confirms." },
  ],

  visa: {
    name: "Temporary Residence Permit (TRP) for Studies",
    summary:
      "Apply for a TRP through the MIGRIS online system, usually with your university's help, then give biometrics at a designated Lithuanian embassy or visa centre. A national D visa may be issued so you can enter while the TRP is processed.",
    steps: [
      "Receive your admission letter",
      "University submits an intermediation letter",
      "Apply for the TRP on MIGRIS",
      "Provide biometrics at the designated embassy or visa centre",
      "Arrive and collect your TRP card",
    ],
    documents: [
      "Passport and photos",
      "Admission letter",
      "Proof of sufficient funds",
      "Health insurance",
      "Proof of accommodation",
      "Academic documents",
    ],
  },

  cities: [
    {
      slug: "vilnius",
      name: "Vilnius",
      emoji: "🏰",
      region: "Vilnius County",
      headline: "Green capital with a UNESCO old town",
      intro:
        "Vilnius is Lithuania's capital and largest city, with Vilnius University, Vilnius Tech, Mykolas Romeris and ISM. It has a strong startup and fintech scene.",
      livingCost: "Medium",
      bestFor: ["IT", "Business", "Law", "Fintech"],
      highlights: [
        { title: "Fintech hub", text: "Many international tech and finance companies." },
        { title: "UNESCO old town", text: "One of Europe's largest baroque old towns." },
        { title: "Green city", text: "Forests and parks inside the city." },
      ],
      costCards: [
        { label: "Rent", value: "≈ €250 – €450", text: "Dorms are cheaper." },
        { label: "Food", value: "≈ €230", text: "Moderate prices." },
        { label: "Transport", value: "Bus + trolley", text: "Student discounts." },
      ],
      studentLife: ["Startup events", "Café culture", "Snowy winters"],
    },
    {
      slug: "kaunas",
      name: "Kaunas",
      emoji: "🎓",
      region: "Kaunas County",
      headline: "Lithuania's student city",
      intro:
        "Kaunas is home to KTU, VMU and the Lithuanian University of Health Sciences. It is cheaper than Vilnius and very student-friendly.",
      livingCost: "Low–Medium",
      bestFor: ["Engineering", "Medicine", "Liberal Arts"],
      highlights: [
        { title: "Student-friendly", text: "Large student population and affordable life." },
        { title: "Health sciences", text: "LSMU is a major medical university." },
        { title: "Modernist architecture", text: "Interwar 'Modernist Kaunas' is a UNESCO World Heritage site." },
      ],
      costCards: [
        { label: "Rent", value: "≈ €200 – €380", text: "Affordable." },
        { label: "Food", value: "≈ €200", text: "Low prices." },
        { label: "Transport", value: "Bus", text: "Compact city." },
      ],
      studentLife: ["Basketball culture", "Calm and affordable", "Strong campus life"],
    },
    {
      slug: "klaipeda",
      name: "Klaipėda",
      emoji: "⚓",
      region: "Klaipėda County",
      headline: "Seaside port city",
      intro:
        "Klaipėda is Lithuania's only seaport and the gateway to the Curonian Spit, with Klaipėda University specialising in marine studies.",
      livingCost: "Low",
      bestFor: ["Marine Studies", "Logistics", "Health"],
      highlights: [
        { title: "Baltic coast", text: "Beaches and the UNESCO Curonian Spit nearby." },
        { title: "Marine focus", text: "Shipping and marine sciences." },
        { title: "Low cost", text: "Cheapest of the three cities." },
      ],
      costCards: [
        { label: "Rent", value: "≈ €180 – €350", text: "Affordable." },
        { label: "Food", value: "≈ €190", text: "Low prices." },
        { label: "Transport", value: "Bus", text: "Small city." },
      ],
      studentLife: ["Seaside summers", "Quiet winters", "Close-knit community"],
    },
  ],

  universities: [
    { slug: "vilnius-university", name: "Vilnius University", citySlug: "vilnius", city: "Vilnius", type: "Public", tuitionBand: "Moderate", tuitionNote: "≈ €2,600–€3,900 bachelor's · ≈ €5,000 master's · higher for medicine", programs: ["Medicine", "Business", "Computer Science", "Law"], popularFor: "Lithuania's oldest and top-ranked university", website: "https://www.vu.lt/en/" },
    { slug: "vilnius-tech", name: "Vilnius Gediminas Technical University (VILNIUS TECH)", citySlug: "vilnius", city: "Vilnius", type: "Technical", tuitionBand: "Moderate", tuitionNote: "Published fee table for 2026–27", programs: ["Engineering", "IT", "Architecture"], popularFor: "Engineering and technology", website: "https://vilniustech.lt/en/" },
    { slug: "mykolas-romeris-university", name: "Mykolas Romeris University", citySlug: "vilnius", city: "Vilnius", type: "Public", tuitionBand: "Moderate", tuitionNote: "Check official fee table", programs: ["Law", "Public Administration", "Psychology"], popularFor: "Law and social sciences", website: "https://www.mruni.eu/en/" },
    { slug: "ism-university", name: "ISM University of Management and Economics", citySlug: "vilnius", city: "Vilnius", type: "Private", tuitionBand: "High", tuitionNote: "Private business school fees", programs: ["Business", "Finance", "Economics"], popularFor: "Private business school", website: "https://www.ism.lt/en/" },
    { slug: "ktu", name: "Kaunas University of Technology (KTU)", citySlug: "kaunas", city: "Kaunas", type: "Technical", tuitionBand: "Moderate", tuitionNote: "Check official fee table; scholarships available", programs: ["Engineering", "IT", "Design"], popularFor: "Largest technical university in the Baltics", website: "https://en.ktu.edu/" },
    { slug: "vytautas-magnus-university", name: "Vytautas Magnus University (VMU)", citySlug: "kaunas", city: "Kaunas", type: "Public", tuitionBand: "Moderate", tuitionNote: "Check official fee table", programs: ["Liberal Arts", "Business", "Agriculture"], popularFor: "Liberal arts approach", website: "https://www.vdu.lt/en/" },
    { slug: "lsmu", name: "Lithuanian University of Health Sciences (LSMU)", citySlug: "kaunas", city: "Kaunas", type: "Medical", tuitionBand: "High", tuitionNote: "Medicine and dentistry fees are higher", programs: ["Medicine", "Dentistry", "Veterinary"], popularFor: "Largest medical university in Lithuania", website: "https://lsmu.lt/en/" },
    { slug: "klaipeda-university", name: "Klaipėda University", citySlug: "klaipeda", city: "Klaipėda", type: "Public", tuitionBand: "Low", tuitionNote: "Check official fee table", programs: ["Marine Studies", "Health", "Business"], popularFor: "Marine and coastal studies", website: "https://www.ku.lt/en/" },
  ],

  faqs: [
    { q: "Can I work while studying in Lithuania?", a: "Bachelor's students with a study residence permit can work up to 20 hours per week. Master's students have been allowed to work full-time, but proposals to change this have been discussed, so we confirm current rules before you travel." },
    { q: "Is there a post-study work option?", a: "Yes. Graduates can apply for a 12-month residence permit to look for a job." },
    { q: "Where do Pakistani students give biometrics?", a: "At a designated Lithuanian embassy or visa centre. Your university will confirm the correct location when it submits your MIGRIS application." },
    { q: "Do I need IELTS?", a: "Most English-taught programmes require IELTS/TOEFL or an equivalent. Some accept other proof of English or run their own test." },
  ],

  lastReviewed: "October 2026",
  sources: [
    { label: "Study in Lithuania", url: "https://www.studyin.lt/" },
    { label: "Migration Department (MIGRIS)", url: "https://www.migracija.lt/" },
  ],
};
