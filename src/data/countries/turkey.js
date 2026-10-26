import { turkeyMeta } from "./meta";

export const turkeyData = {
  ...turkeyMeta,

  whyStudy: [
    { icon: "award", title: "Türkiye Bursları", text: "A fully funded government scholarship covering tuition, stipend, housing, insurance, a Turkish course and flights." },
    { icon: "wallet", title: "Low cost of study", text: "State university tuition is among the lowest of any popular destination." },
    { icon: "heart", title: "Culturally close", text: "Halal food, familiar values and a large Pakistani student community." },
    { icon: "globe", title: "Two continents", text: "Istanbul is a global hub with flights everywhere, including direct to Pakistan." },
  ],

  costs: {
    tuition: [
      { label: "State universities", value: "≈ $300 – $3,000 / year", note: "Engineering and medicine sit at the higher end." },
      { label: "Foundation (private) universities", value: "≈ $3k – $20k+ / year", note: "Merit discounts of 25–100% are common." },
      { label: "Medicine & dentistry", value: "Higher", note: "Varies widely. Check each university's fee table." },
      { label: "Turkish preparatory year", value: "Separate fee", note: "Needed for Turkish-taught programmes." },
    ],
    living: [
      { label: "Rent / dorm", value: "≈ $150 – $400", note: "State dorms (KYK) and university dorms are cheapest." },
      { label: "Food", value: "≈ $150 – $250", note: "University canteens are very affordable." },
      { label: "Transport", value: "≈ $15 – $30", note: "Student transport cards give discounts." },
      { label: "Health insurance", value: "Required", note: "Needed for the residence permit." },
    ],
  },

  scholarships: [
    {
      name: "Türkiye Bursları",
      provider: "Government of Türkiye (YTB)",
      covers: "Tuition, monthly stipend, accommodation, health insurance, 1-year Turkish course, one return flight",
      level: "Bachelor's · Master's · PhD",
      note: "Applications usually open January–February each year on turkiyeburslari.gov.tr. 2026 stipends were reported as 6,500 TL (master's) and 9,000 TL (PhD) per month.",
      link: "https://www.turkiyeburslari.gov.tr/",
    },
    {
      name: "Foundation University Merit Scholarships",
      provider: "Koç, Sabancı, Bilkent and others",
      covers: "25% – 100% tuition, sometimes housing",
      level: "Bachelor's · Master's",
      note: "Based on grades, SAT or entrance exams. Some top universities also offer living stipends.",
    },
    {
      name: "Erasmus+ Exchange",
      provider: "European Union",
      covers: "Monthly grant for an exchange semester in Europe",
      level: "Once enrolled",
      note: "Turkey takes part in Erasmus+, so enrolled students can spend a semester in an EU country.",
    },
  ],

  admissionSteps: [
    { title: "Pick programme & language", text: "Choose between Turkish-taught (with a prep year) and English-taught programmes." },
    { title: "Check entrance requirements", text: "Many universities accept SAT, YÖS-type exams, or their own exam. Others admit on HSSC/A-level grades." },
    { title: "Apply to universities", text: "Most universities run their own international portals. Deadlines are usually spring–summer for fall entry." },
    { title: "Or apply for Türkiye Bursları", text: "One application covers both the scholarship and university placement." },
    { title: "Receive acceptance letter", text: "You need it for the student visa." },
  ],

  visa: {
    name: "Student Visa + Residence Permit",
    summary:
      "Apply for a student visa at the Turkish Embassy in Islamabad or a Consulate (Karachi/Lahore) after admission. After arrival you apply online for a student residence permit (ikamet).",
    steps: [
      "Get your university acceptance letter",
      "Book an appointment and apply for the student visa",
      "Travel to Turkey and enrol at your university",
      "Apply online for your student residence permit (usually within one month of arrival)",
      "Collect your residence permit card",
    ],
    documents: [
      "Valid passport and photos",
      "Acceptance letter",
      "Proof of financial means or scholarship letter",
      "Academic documents (attested, sometimes translated)",
      "Health insurance (for the residence permit)",
    ],
  },

  cities: [
    {
      slug: "istanbul",
      name: "Istanbul",
      emoji: "🕌",
      region: "Marmara",
      headline: "A mega-city across two continents",
      intro:
        "Istanbul is Turkey's economic and cultural capital, home to dozens of universities including Boğaziçi, ITU, Koç and Sabancı. It is exciting and full of opportunity, and the most expensive city in the country.",
      livingCost: "Medium–High",
      bestFor: ["Engineering", "Business", "Architecture", "Medicine"],
      highlights: [
        { title: "University density", text: "More universities than any other Turkish city, public and private." },
        { title: "Global connections", text: "Direct flights to Pakistan and the whole world." },
        { title: "History everywhere", text: "Byzantine and Ottoman landmarks on your daily route." },
      ],
      costCards: [
        { label: "Rent", value: "≈ $250 – $500", text: "Dorms are much cheaper than private flats." },
        { label: "Food", value: "≈ $180", text: "Street food and canteens keep it affordable." },
        { label: "Transport", value: "Istanbulkart", text: "Student discounts on metro, bus and ferry." },
      ],
      studentLife: ["Ferries between Europe and Asia", "Huge international community", "Very busy and crowded"],
    },
    {
      slug: "ankara",
      name: "Ankara",
      emoji: "🏛️",
      region: "Central Anatolia",
      headline: "The capital and a true university city",
      intro:
        "Ankara is calmer and cheaper than Istanbul, with METU, Bilkent and Hacettepe among Turkey's best universities. Many government and embassy offices are here too.",
      livingCost: "Low–Medium",
      bestFor: ["Engineering", "Medicine", "Political Science"],
      highlights: [
        { title: "Top universities", text: "METU and Bilkent teach in English and are highly ranked." },
        { title: "Affordable", text: "Lower rent and living costs than Istanbul." },
        { title: "Student-focused", text: "Large campuses with dorms and facilities." },
      ],
      costCards: [
        { label: "Rent", value: "≈ $150 – $350", text: "Campus dorms are common." },
        { label: "Food", value: "≈ $150", text: "Affordable canteens." },
        { label: "Transport", value: "Student card", text: "Metro and buses with discounts." },
      ],
      studentLife: ["Big campus life", "Quieter than Istanbul", "Cold winters"],
    },
    {
      slug: "izmir",
      name: "Izmir",
      emoji: "🌊",
      region: "Aegean",
      headline: "Relaxed coastal city with strong public universities",
      intro:
        "Izmir is Turkey's third city, known for its seaside lifestyle, mild weather and liberal atmosphere. Ege and Dokuz Eylül are its largest public universities.",
      livingCost: "Low–Medium",
      bestFor: ["Medicine", "Agriculture", "Engineering", "Tourism"],
      highlights: [
        { title: "Coastal lifestyle", text: "Long seafront and a relaxed pace of life." },
        { title: "Strong medicine", text: "Ege and Dokuz Eylül have large medical faculties." },
        { title: "Good value", text: "Cheaper than Istanbul with a high quality of life." },
      ],
      costCards: [
        { label: "Rent", value: "≈ $180 – $350", text: "Shared flats near campus." },
        { label: "Food", value: "≈ $150", text: "Fresh Aegean food." },
        { label: "Transport", value: "Izmirim Kart", text: "Metro, tram and ferries." },
      ],
      studentLife: ["Seaside evenings", "Mild winters", "Friendly, open city"],
    },
    {
      slug: "eskisehir",
      name: "Eskişehir",
      emoji: "🎓",
      region: "Central Anatolia",
      headline: "Turkey's classic student town",
      intro:
        "Eskişehir is small, clean and full of students. It is one of the cheapest places to study in Turkey and is home to Anadolu University.",
      livingCost: "Low",
      bestFor: ["Communication", "Education", "Engineering"],
      highlights: [
        { title: "Student town", text: "Students make up a large share of the population." },
        { title: "Very affordable", text: "Among the lowest living costs in Turkey." },
        { title: "Good connections", text: "High-speed train to Istanbul and Ankara." },
      ],
      costCards: [
        { label: "Rent", value: "≈ $120 – $250", text: "Lots of student housing." },
        { label: "Food", value: "≈ $130", text: "Student-friendly prices." },
        { label: "Transport", value: "Tram", text: "Small city, easy to get around." },
      ],
      studentLife: ["Riverside cafés", "Compact and walkable", "Lively student nightlife"],
    },
  ],

  universities: [
    { slug: "bogazici-university", name: "Boğaziçi University", citySlug: "istanbul", city: "Istanbul", type: "Public", tuitionBand: "Low", tuitionNote: "Low state tuition, English-medium", programs: ["Engineering", "Economics", "Computer Science"], popularFor: "English-medium, highly selective public university", website: "https://bogazici.edu.tr/en-US/" },
    { slug: "istanbul-technical-university", name: "Istanbul Technical University (ITU)", citySlug: "istanbul", city: "Istanbul", type: "Technical", tuitionBand: "Low", tuitionNote: "Low state tuition", programs: ["Engineering", "Architecture", "Naval Engineering"], popularFor: "Turkey's historic engineering school", website: "https://www.itu.edu.tr/en" },
    { slug: "istanbul-university", name: "Istanbul University", citySlug: "istanbul", city: "Istanbul", type: "Public", tuitionBand: "Low", tuitionNote: "Low state tuition", programs: ["Medicine", "Law", "Humanities"], popularFor: "Large, historic public university", website: "https://www.istanbul.edu.tr/en/" },
    { slug: "yildiz-technical-university", name: "Yıldız Technical University", citySlug: "istanbul", city: "Istanbul", type: "Technical", tuitionBand: "Low", tuitionNote: "Low state tuition", programs: ["Engineering", "Architecture"], popularFor: "Engineering in central Istanbul", website: "https://www.yildiz.edu.tr/en" },
    { slug: "koc-university", name: "Koç University", citySlug: "istanbul", city: "Istanbul", type: "Private", tuitionBand: "High", tuitionNote: "Foundation university, merit scholarships available", programs: ["Business", "Medicine", "Engineering", "Law"], popularFor: "Top private university with generous scholarships", website: "https://www.ku.edu.tr/en/" },
    { slug: "sabanci-university", name: "Sabancı University", citySlug: "istanbul", city: "Istanbul", type: "Private", tuitionBand: "High", tuitionNote: "Foundation university, merit scholarships available", programs: ["Engineering", "Management", "Social Sciences"], popularFor: "Research-focused, interdisciplinary private university", website: "https://www.sabanciuniv.edu/en" },
    { slug: "metu", name: "Middle East Technical University (METU)", citySlug: "ankara", city: "Ankara", type: "Technical", tuitionBand: "Low", tuitionNote: "International fees set per programme (some published in USD)", programs: ["Engineering", "Architecture", "Computer Science"], popularFor: "English-medium engineering powerhouse", website: "https://www.metu.edu.tr/" },
    { slug: "bilkent-university", name: "Bilkent University", citySlug: "ankara", city: "Ankara", type: "Private", tuitionBand: "High", tuitionNote: "Foundation university, merit scholarships available", programs: ["Engineering", "Business", "Computer Science"], popularFor: "Turkey's first private university, English-medium", website: "https://w3.bilkent.edu.tr/bilkent/" },
    { slug: "hacettepe-university", name: "Hacettepe University", citySlug: "ankara", city: "Ankara", type: "Public", tuitionBand: "Low", tuitionNote: "Low state tuition", programs: ["Medicine", "Health Sciences", "Engineering"], popularFor: "Medicine and health sciences", website: "https://www.hacettepe.edu.tr/english/" },
    { slug: "ankara-university", name: "Ankara University", citySlug: "ankara", city: "Ankara", type: "Public", tuitionBand: "Low", tuitionNote: "Low state tuition", programs: ["Law", "Political Science", "Medicine"], popularFor: "Law and political science in the capital", website: "https://en.ankara.edu.tr/" },
    { slug: "ege-university", name: "Ege University", citySlug: "izmir", city: "Izmir", type: "Public", tuitionBand: "Low", tuitionNote: "Low state tuition", programs: ["Medicine", "Agriculture", "Engineering"], popularFor: "Large Aegean university with strong medicine", website: "https://ege.edu.tr/en-0.html" },
    { slug: "dokuz-eylul-university", name: "Dokuz Eylül University", citySlug: "izmir", city: "Izmir", type: "Public", tuitionBand: "Low", tuitionNote: "Low state tuition", programs: ["Medicine", "Engineering", "Business"], popularFor: "Broad public university in Izmir", website: "https://www.deu.edu.tr/en/" },
    { slug: "anadolu-university", name: "Anadolu University", citySlug: "eskisehir", city: "Eskişehir", type: "Public", tuitionBand: "Low", tuitionNote: "Low state tuition", programs: ["Communication", "Fine Arts", "Aviation"], popularFor: "Communication, arts and aviation", website: "https://www.anadolu.edu.tr/en" },
  ],

  faqs: [
    { q: "Is Türkiye Bursları really fully funded?", a: "Yes. It covers tuition, a monthly stipend, accommodation, health insurance, a one-year Turkish course and one return flight. It is very competitive, so a strong application matters." },
    { q: "Do I need to speak Turkish?", a: "Not for English-taught programmes. For Turkish-taught programmes you usually take a one-year Turkish preparatory course first." },
    { q: "Can I work while studying?", a: "Students can work part-time with a work permit. Bachelor's students are usually only eligible after their first year. Check the current rules before planning on income." },
    { q: "Are Turkish degrees recognised in Pakistan?", a: "Degrees from recognised Turkish universities are generally accepted, but always check HEC equivalence (and PMDC rules for medicine) before you choose." },
  ],

  lastReviewed: "October 2026",
  sources: [
    { label: "Türkiye Bursları (official)", url: "https://www.turkiyeburslari.gov.tr/" },
    { label: "Study in Türkiye", url: "https://www.studyinturkiye.gov.tr/" },
  ],
};
