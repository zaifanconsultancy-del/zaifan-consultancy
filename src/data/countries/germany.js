export const germanyData = {
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

  whyStudy: [
    {
      icon: "wallet",
      title: "Tuition that barely exists",
      text: "Most public universities only charge a semester contribution that often includes a regional transport ticket.",
    },
    {
      icon: "cpu",
      title: "Engineering & research power",
      text: "TU9 technical universities, Max Planck and Fraunhofer institutes make Germany a serious route for engineering, IT and science.",
    },
    {
      icon: "briefcase",
      title: "Real career runway",
      text: "Graduates can stay up to 18 months to find a job, and Germany actively recruits skilled workers.",
    },
    {
      icon: "globe",
      title: "Heart of Europe",
      text: "A German residence permit lets you travel across the Schengen area for short trips.",
    },
  ],

  costs: {
    tuition: [
      { label: "Public universities (most states)", value: "€0 tuition", note: "Pay a semester contribution of ≈ €150–€400." },
      { label: "Baden-Württemberg (non-EU)", value: "€1,500 / semester", note: "Applies at Heidelberg, KIT, Stuttgart and other BW universities." },
      { label: "TUM (new non-EU students)", value: "€2,000 – €6,000 / semester", note: "Set per programme since winter 2024/25." },
      { label: "Private universities", value: "≈ €10k – €20k+ / year", note: "Check accreditation and visa acceptance carefully." },
    ],
    living: [
      { label: "Blocked account (visa)", value: "€992 / month", note: "€11,904 for 12 months, released monthly after arrival." },
      { label: "Rent (shared room)", value: "≈ €350 – €700", note: "Munich, Frankfurt and Hamburg sit at the top of this range." },
      { label: "Health insurance", value: "≈ €130 / month", note: "Public student insurance is mandatory." },
      { label: "Food & transport", value: "≈ €250 – €350", note: "Semester ticket often covers local transport." },
    ],
  },

  scholarships: [
    {
      name: "DAAD Scholarships",
      provider: "German Academic Exchange Service",
      covers: "Monthly stipend, insurance, travel allowance (varies by programme)",
      level: "Master's · PhD · Research",
      note: "Includes EPOS development-related postgraduate courses popular with Pakistani graduates who have work experience.",
      link: "https://www.daad.de/en/",
    },
    {
      name: "Deutschlandstipendium",
      provider: "German universities + private sponsors",
      covers: "€300 per month",
      level: "Bachelor's · Master's",
      note: "Merit-based, applied for through your university after admission.",
      link: "https://www.deutschlandstipendium.de/",
    },
    {
      name: "Political & Church Foundations",
      provider: "Heinrich Böll, Konrad Adenauer, Friedrich Ebert and others",
      covers: "Monthly stipend + extras",
      level: "Master's · PhD",
      note: "Look for values and social engagement alongside grades.",
    },
    {
      name: "Erasmus Mundus Joint Masters",
      provider: "European Union",
      covers: "Tuition, travel and a monthly allowance",
      level: "Master's",
      note: "Study in two or more EU countries, often including Germany.",
      link: "https://www.eacea.ec.europa.eu/scholarships/erasmus-mundus-catalogue_en",
    },
  ],

  admissionSteps: [
    { title: "Check eligibility", text: "Pakistani FSc/HSSC usually does not give direct bachelor's entry. Most students need a Studienkolleg (foundation year) or prior university study. Master's applicants need a recognised bachelor's in a related field." },
    { title: "Choose programmes", text: "Shortlist on the DAAD database. Note language (German or English), deadlines and any NC (grade) restrictions." },
    { title: "Apply", text: "Apply directly or through uni-assist, depending on the university. Winter deadlines are often 15 July (earlier for many master's)." },
    { title: "Prove language", text: "IELTS/TOEFL for English programmes, TestDaF/DSH for German programmes." },
    { title: "Fund the blocked account", text: "Open a blocked account and deposit the full annual amount before the visa appointment." },
  ],

  visa: {
    name: "National (D) Student Visa",
    summary:
      "Apply at the German Embassy in Islamabad or the Consulate General in Karachi. Appointment waiting times can be long, so book as soon as you have admission.",
    steps: [
      "Receive your admission letter (or conditional admission / Studienkolleg place)",
      "Open and fund a blocked account (€11,904 for one year)",
      "Arrange travel and German health insurance",
      "Book and attend your embassy appointment",
      "Arrive, register your address (Anmeldung) and get your residence permit",
    ],
    documents: [
      "Valid passport and biometric photos",
      "University admission letter",
      "Blocked account confirmation",
      "Health insurance proof",
      "Academic certificates (attested) and language certificate",
      "Motivation letter and CV",
    ],
  },

  cities: [
    {
      slug: "berlin",
      name: "Berlin",
      emoji: "🏛️",
      region: "Berlin",
      headline: "Capital energy, startups and three big universities",
      intro:
        "Berlin mixes world-class universities with a huge startup scene and a relaxed, international lifestyle. Housing is competitive, so students should start searching before they land.",
      livingCost: "Medium–High",
      bestFor: ["Computer Science", "Startups", "Social Sciences", "Arts"],
      highlights: [
        { title: "Startup capital", text: "One of Europe's biggest startup ecosystems for internships and part-time work." },
        { title: "Three major universities", text: "Humboldt, Free University and TU Berlin give students a wide choice." },
        { title: "International city", text: "English is widely spoken and the student community is very diverse." },
      ],
      costCards: [
        { label: "Rent", value: "≈ €450 – €700", text: "Shared flats (WG) are the most common student option." },
        { label: "Food", value: "≈ €200", text: "Supermarkets and Mensa canteens keep costs manageable." },
        { label: "Transport", value: "Semester ticket", text: "Usually included in the semester contribution." },
      ],
      studentLife: ["Huge international community", "Strong tech and creative scenes", "Excellent public transport"],
    },
    {
      slug: "munich",
      name: "Munich",
      emoji: "🏔️",
      region: "Bavaria",
      headline: "Engineering prestige with Germany's highest rents",
      intro:
        "Munich is home to TUM and LMU, BMW, Siemens and a strong engineering job market. It is also Germany's most expensive student city, so budgeting matters more here than anywhere else.",
      livingCost: "High",
      bestFor: ["Engineering", "Automotive", "Medicine", "Business"],
      highlights: [
        { title: "Industry on the doorstep", text: "BMW, Siemens, Allianz and many tech firms recruit from Munich's universities." },
        { title: "Two top universities", text: "TUM and LMU are consistently among Germany's highest ranked." },
        { title: "Quality of life", text: "Safe, clean and close to the Alps." },
      ],
      costCards: [
        { label: "Rent", value: "≈ €600 – €900", text: "Apply for student dorms very early." },
        { label: "Food", value: "≈ €220", text: "Similar to other German cities." },
        { label: "Transport", value: "Semester ticket", text: "Deutschlandticket upgrades available." },
      ],
      studentLife: ["Strong engineering culture", "Big Oktoberfest and outdoor scene", "Expensive but well paid part-time jobs"],
    },
    {
      slug: "hamburg",
      name: "Hamburg",
      emoji: "⚓",
      region: "Hamburg",
      headline: "Port city with media, logistics and aviation careers",
      intro:
        "Hamburg is Germany's second largest city, with strong logistics, media and aviation industries. It is international, green and slightly cheaper than Munich.",
      livingCost: "Medium–High",
      bestFor: ["Logistics", "Media", "Business", "Physics"],
      highlights: [
        { title: "Global port", text: "Logistics, shipping and trade careers start here." },
        { title: "Aviation hub", text: "Airbus has a major site in Hamburg." },
        { title: "Green & livable", text: "Lakes, parks and a big harbour scene." },
      ],
      costCards: [
        { label: "Rent", value: "≈ €450 – €700", text: "Dorms are limited, start early." },
        { label: "Food", value: "≈ €200", text: "Plenty of affordable options." },
        { label: "Transport", value: "Semester ticket", text: "Covers the city network." },
      ],
      studentLife: ["Harbour city vibe", "Strong media and music scenes", "Rainy but lively"],
    },
    {
      slug: "aachen",
      name: "Aachen",
      emoji: "⚙️",
      region: "North Rhine-Westphalia",
      headline: "A true engineering student town",
      intro:
        "Aachen is built around RWTH, one of Europe's leading technical universities. It is affordable, compact and right on the borders with Belgium and the Netherlands.",
      livingCost: "Low–Medium",
      bestFor: ["Mechanical Engineering", "Electrical Engineering", "Computer Science"],
      highlights: [
        { title: "RWTH Aachen", text: "Huge engineering faculty with strong industry partnerships." },
        { title: "Affordable", text: "Much cheaper than Munich or Frankfurt." },
        { title: "Three-country corner", text: "Belgium and the Netherlands are a short trip away." },
      ],
      costCards: [
        { label: "Rent", value: "≈ €350 – €550", text: "Student dorms and shared flats are common." },
        { label: "Food", value: "≈ €180", text: "Student-town prices." },
        { label: "Transport", value: "Semester ticket", text: "Covers much of NRW." },
      ],
      studentLife: ["Students are a large share of the city", "Engineering clubs and racing teams", "Easy weekend trips"],
    },
    {
      slug: "frankfurt",
      name: "Frankfurt",
      emoji: "🏦",
      region: "Hesse",
      headline: "Finance capital of continental Europe",
      intro:
        "Frankfurt hosts the European Central Bank and many banks and consultancies. Goethe University gives a strong route into finance, economics and law.",
      livingCost: "High",
      bestFor: ["Finance", "Economics", "Law", "Data"],
      highlights: [
        { title: "Banking hub", text: "ECB, Bundesbank and global banks are based here." },
        { title: "Major airport", text: "Direct connections, including to Pakistan via the Gulf." },
        { title: "Compact city", text: "Easy to get around for work and study." },
      ],
      costCards: [
        { label: "Rent", value: "≈ €500 – €800", text: "One of Germany's pricier rental markets." },
        { label: "Food", value: "≈ €220", text: "Lots of international food options." },
        { label: "Transport", value: "Semester ticket", text: "Covers the RMV region." },
      ],
      studentLife: ["Business-focused city", "Diverse international community", "Skyline and riverside life"],
    },
  ],

  universities: [
    { slug: "tum", name: "Technical University of Munich (TUM)", citySlug: "munich", city: "Munich", type: "Technical", tuitionBand: "Moderate", tuitionNote: "€2,000–€6,000 per semester for new non-EU students", programs: ["Engineering", "Computer Science", "Management"], popularFor: "Engineering, informatics and management", website: "https://www.tum.de/en/" },
    { slug: "lmu-munich", name: "LMU Munich", citySlug: "munich", city: "Munich", type: "Public", tuitionBand: "Low", tuitionNote: "No tuition, semester contribution only", programs: ["Medicine", "Physics", "Economics", "Law"], popularFor: "Research, medicine and natural sciences", website: "https://www.lmu.de/en/" },
    { slug: "humboldt-berlin", name: "Humboldt University of Berlin", citySlug: "berlin", city: "Berlin", type: "Public", tuitionBand: "Low", tuitionNote: "No tuition, semester contribution only", programs: ["Social Sciences", "Humanities", "Life Sciences"], popularFor: "Humanities, social sciences and research", website: "https://www.hu-berlin.de/en" },
    { slug: "fu-berlin", name: "Free University of Berlin", citySlug: "berlin", city: "Berlin", type: "Public", tuitionBand: "Low", tuitionNote: "No tuition, semester contribution only", programs: ["Political Science", "Computer Science", "Biology"], popularFor: "International relations and sciences", website: "https://www.fu-berlin.de/en/" },
    { slug: "tu-berlin", name: "Technical University of Berlin", citySlug: "berlin", city: "Berlin", type: "Technical", tuitionBand: "Low", tuitionNote: "No tuition, semester contribution only", programs: ["Engineering", "Computer Science", "Architecture"], popularFor: "Engineering and IT in the capital", website: "https://www.tu.berlin/en/" },
    { slug: "rwth-aachen", name: "RWTH Aachen University", citySlug: "aachen", city: "Aachen", type: "Technical", tuitionBand: "Low", tuitionNote: "No tuition, semester contribution only", programs: ["Mechanical Engineering", "Electrical Engineering", "Computer Science"], popularFor: "One of Europe's leading engineering schools", website: "https://www.rwth-aachen.de/" },
    { slug: "uni-hamburg", name: "University of Hamburg", citySlug: "hamburg", city: "Hamburg", type: "Public", tuitionBand: "Low", tuitionNote: "No tuition, semester contribution only", programs: ["Physics", "Economics", "Law", "Climate Science"], popularFor: "Physics, climate research and economics", website: "https://www.uni-hamburg.de/en.html" },
    { slug: "goethe-frankfurt", name: "Goethe University Frankfurt", citySlug: "frankfurt", city: "Frankfurt", type: "Public", tuitionBand: "Low", tuitionNote: "No tuition, semester contribution only", programs: ["Finance", "Economics", "Law", "Medicine"], popularFor: "Finance and economics close to the ECB", website: "https://www.goethe-university-frankfurt.de/en" },
    { slug: "heidelberg-university", name: "Heidelberg University", citySlug: null, city: "Heidelberg", type: "Public", tuitionBand: "Moderate", tuitionNote: "€1,500 per semester for non-EU (Baden-Württemberg)", programs: ["Medicine", "Life Sciences", "Physics"], popularFor: "Germany's oldest university, strong in medicine", website: "https://www.uni-heidelberg.de/en" },
    { slug: "kit", name: "Karlsruhe Institute of Technology (KIT)", citySlug: null, city: "Karlsruhe", type: "Technical", tuitionBand: "Moderate", tuitionNote: "€1,500 per semester for non-EU (Baden-Württemberg)", programs: ["Engineering", "Computer Science", "Physics"], popularFor: "Engineering and applied research", website: "https://www.kit.edu/english/" },
    { slug: "tu-dresden", name: "TU Dresden", citySlug: null, city: "Dresden", type: "Technical", tuitionBand: "Low", tuitionNote: "No tuition, semester contribution only", programs: ["Engineering", "Microelectronics", "Medicine"], popularFor: "Affordable city with a big technical university", website: "https://tu-dresden.de/?set_language=en" },
  ],

  faqs: [
    { q: "Is studying in Germany really free?", a: "At most public universities, yes, apart from a semester contribution. Non-EU students pay €1,500 per semester in Baden-Württemberg and €2,000–€6,000 per semester at TUM. Living costs are the real expense." },
    { q: "Can I enter a German bachelor's directly after FSc?", a: "Usually not. Most Pakistani students need a Studienkolleg (foundation year) or one to two years of university study first. A-level students may qualify depending on subjects. We check this case by case." },
    { q: "How much money do I need for the visa?", a: "The blocked account amount is €11,904 for one year (€992 per month). Embassies may ask for a different amount in special cases, so confirm before you apply." },
    { q: "Do I need German?", a: "Not for English-taught programmes, which are common at master's level. Basic German still helps a lot for part-time jobs and daily life." },
    { q: "Can I work after graduating?", a: "Yes. Graduates can get an 18-month residence permit to look for a job related to their degree." },
  ],

  lastReviewed: "October 2026",
  sources: [
    { label: "DAAD – Study in Germany", url: "https://www.daad.de/en/" },
    { label: "TUM tuition for non-EU students", url: "https://www.tum.de/en/studies/fees/tuition" },
    { label: "German Embassy Islamabad", url: "https://pakistan.diplo.de/pk-en" },
  ],
};
