import { belgiumMeta } from "./meta";

export const belgiumData = {
  ...belgiumMeta,

  whyStudy: [
    { icon: "trophy", title: "Top-ranked universities", text: "KU Leuven and Ghent are among Europe's best research universities." },
    { icon: "landmark", title: "Capital of the EU", text: "Brussels hosts the European Commission, Parliament and NATO." },
    { icon: "languages", title: "Multilingual", text: "Study in English while picking up Dutch or French." },
    { icon: "briefcase", title: "Search year", text: "12 months after graduation to find a job or start a business." },
  ],

  costs: {
    tuition: [
      { label: "Flemish universities (non-EU)", value: "≈ €4k – €12k / year", note: "Varies widely. Check each programme's fee page." },
      { label: "French-speaking universities", value: "≈ €5,010 / year", note: "€835 registration + €4,175 non-EU contribution (UCLouvain); check exemptions and each university." },
      { label: "Medicine / specialised", value: "Higher", note: "Some programmes are restricted for non-EU students." },
      { label: "Blocked account fee", value: "≈ €150", note: "Universities may charge a handling fee." },
    ],
    living: [
      { label: "Proof of means (2026–27)", value: "≈ €1,062 / month", note: "≈ €12,700 per year in a blocked account or via a guarantor." },
      { label: "Rent (student room)", value: "≈ €400 – €650", note: "Called a 'kot' in Leuven and Ghent." },
      { label: "Food", value: "≈ €250", note: "Student restaurants help." },
      { label: "Insurance", value: "≈ €15 – €30", note: "Health insurance via a mutualité / ziekenfonds." },
    ],
  },

  scholarships: [
    {
      name: "Master Mind Scholarships",
      provider: "Flemish Government",
      covers: "Tuition waiver and living allowance",
      level: "Master's",
      note: "For excellent students at Flemish universities. Check eligible nationalities each year.",
      link: "https://www.studyinflanders.be/scholarships/master-mind-scholarships",
    },
    {
      name: "VLIR-UOS & ARES Scholarships",
      provider: "Belgian development cooperation",
      covers: "Full scholarships for selected programmes",
      level: "Master's · Training",
      note: "Only for nationals of eligible countries, so check the current country list.",
    },
    {
      name: "University scholarships",
      provider: "KU Leuven, Ghent, UCLouvain and others",
      covers: "Partial or full tuition, sometimes living costs",
      level: "Master's",
      note: "E.g. KU Leuven Science@Leuven, and other university-specific awards.",
    },
    {
      name: "Erasmus Mundus Joint Masters",
      provider: "European Union",
      covers: "Tuition, travel and a monthly allowance",
      level: "Master's",
      note: "Many joint masters include Belgian universities.",
      link: "https://www.eacea.ec.europa.eu/scholarships/erasmus-mundus-catalogue_en",
    },
  ],

  admissionSteps: [
    { title: "Shortlist programmes", text: "Focus on English-taught master's programmes; most bachelor's programmes are in Dutch or French." },
    { title: "Apply online", text: "Apply directly through university portals. Non-EU deadlines are often in early spring (Feb–Mar)." },
    { title: "Receive admission", text: "You'll receive an admission or enrolment letter for the visa." },
    { title: "Prove financial means", text: "Blocked account, scholarship or guarantor (Annex 32)." },
    { title: "Apply for the visa", text: "Apply at the Belgian Embassy in Islamabad via its visa partner." },
  ],

  visa: {
    name: "Type D Long-Stay Student Visa",
    summary:
      "Apply in Pakistan with your admission letter and proof of means. After arrival you register at your local commune (town hall) to get your residence card.",
    steps: [
      "Receive your admission letter",
      "Prove financial means (≈ €1,062/month for 2026–27)",
      "Get a medical certificate and police clearance",
      "Apply for the Type D visa",
      "Register at your commune within 8 days of arrival",
    ],
    documents: [
      "Passport and photos",
      "Admission/enrolment letter",
      "Proof of sufficient means",
      "Medical certificate",
      "Police clearance certificate",
      "Academic documents",
    ],
  },

  cities: [
    {
      slug: "brussels",
      name: "Brussels",
      emoji: "🇪🇺",
      region: "Brussels-Capital",
      headline: "Capital of Europe",
      intro:
        "Brussels is the EU's capital, with ULB and VUB and thousands of international organisations. It is ideal for students interested in policy, law and international careers.",
      livingCost: "Medium–High",
      bestFor: ["Law", "Political Science", "Business", "Engineering"],
      highlights: [
        { title: "EU institutions", text: "Internships at EU bodies, NGOs and think tanks." },
        { title: "Two universities", text: "French-speaking ULB and Dutch-speaking VUB." },
        { title: "Very international", text: "A third of residents are non-Belgian." },
      ],
      costCards: [
        { label: "Rent", value: "≈ €500 – €750", text: "The most expensive Belgian city." },
        { label: "Food", value: "≈ €270", text: "Plenty of choice." },
        { label: "Transport", value: "STIB pass", text: "Discounted for students." },
      ],
      studentLife: ["International careers", "Multilingual", "Central for Europe travel"],
    },
    {
      slug: "leuven",
      name: "Leuven",
      emoji: "🎓",
      region: "Flemish Brabant",
      headline: "A true university town",
      intro:
        "Leuven is built around KU Leuven, one of Europe's most innovative universities. It is compact, safe and very student-focused, just 25 minutes from Brussels.",
      livingCost: "Medium",
      bestFor: ["Engineering", "Sciences", "Economics", "Medicine"],
      highlights: [
        { title: "KU Leuven", text: "Consistently ranked among Europe's top universities." },
        { title: "Student town", text: "Students make up a large share of the city." },
        { title: "Near Brussels", text: "Easy access to the capital." },
      ],
      costCards: [
        { label: "Rent", value: "≈ €450 – €600", text: "Book a 'kot' early." },
        { label: "Food", value: "≈ €240", text: "University restaurants (Alma)." },
        { label: "Transport", value: "Bike", text: "Most students cycle." },
      ],
      studentLife: ["Very student-focused", "Historic centre", "Bike culture"],
    },
    {
      slug: "ghent",
      name: "Ghent",
      emoji: "🏰",
      region: "East Flanders",
      headline: "Medieval charm, modern research",
      intro:
        "Ghent combines canals and medieval architecture with Ghent University, a top research university. It is lively, progressive and student-friendly.",
      livingCost: "Medium",
      bestFor: ["Life Sciences", "Engineering", "Veterinary", "Economics"],
      highlights: [
        { title: "Ghent University", text: "Strong in life sciences and engineering." },
        { title: "Lively city", text: "Festivals and a large student population." },
        { title: "Well connected", text: "Short trains to Brussels and Bruges." },
      ],
      costCards: [
        { label: "Rent", value: "≈ €420 – €600", text: "Student rooms available." },
        { label: "Food", value: "≈ €240", text: "Student restaurants." },
        { label: "Transport", value: "Bike + tram", text: "Very bike-friendly." },
      ],
      studentLife: ["Canals and castles", "Big festival scene", "Progressive city"],
    },
    {
      slug: "antwerp",
      name: "Antwerp",
      emoji: "💎",
      region: "Antwerp",
      headline: "Port city of fashion and diamonds",
      intro:
        "Antwerp has one of Europe's biggest ports, a famous fashion academy and the University of Antwerp. It is dynamic and multicultural.",
      livingCost: "Medium",
      bestFor: ["Business", "Logistics", "Design", "Sciences"],
      highlights: [
        { title: "Major port", text: "Logistics and trade careers." },
        { title: "Fashion & design", text: "A global name in fashion." },
        { title: "University of Antwerp", text: "Modern research university." },
      ],
      costCards: [
        { label: "Rent", value: "≈ €420 – €600", text: "Student rooms near campus." },
        { label: "Food", value: "≈ €240", text: "Diverse food scene." },
        { label: "Transport", value: "Tram + bike", text: "Good coverage." },
      ],
      studentLife: ["Fashion and art", "Multicultural", "Port city energy"],
    },
    {
      slug: "liege",
      name: "Liège",
      emoji: "🔥",
      region: "Wallonia",
      headline: "Affordable French-speaking student city",
      intro:
        "Liège is the largest city in French-speaking Wallonia, home to the University of Liège. It is cheaper than Brussels and has a friendly, lively atmosphere.",
      livingCost: "Low–Medium",
      bestFor: ["Engineering", "Veterinary", "Sciences"],
      highlights: [
        { title: "University of Liège", text: "Comprehensive public university." },
        { title: "Affordable", text: "Lower rent than Flanders or Brussels." },
        { title: "French language", text: "Perfect for students learning French." },
      ],
      costCards: [
        { label: "Rent", value: "≈ €350 – €500", text: "Affordable student housing." },
        { label: "Food", value: "≈ €220", text: "Lower prices." },
        { label: "Transport", value: "Bus", text: "TEC network." },
      ],
      studentLife: ["Friendly locals", "Lively student quarter", "Near Germany and the Netherlands"],
    },
  ],

  universities: [
    { slug: "ku-leuven", name: "KU Leuven", citySlug: "leuven", city: "Leuven", type: "Public", tuitionBand: "Moderate", tuitionNote: "Non-EU fees vary by programme", programs: ["Engineering", "Sciences", "Economics", "Medicine"], popularFor: "Belgium's highest-ranked university", website: "https://www.kuleuven.be/english/" },
    { slug: "ghent-university", name: "Ghent University", citySlug: "ghent", city: "Ghent", type: "Public", tuitionBand: "Moderate", tuitionNote: "Non-EU fees vary by programme", programs: ["Life Sciences", "Engineering", "Veterinary", "Economics"], popularFor: "Top research university in Flanders", website: "https://www.ugent.be/en" },
    { slug: "ulb", name: "Université libre de Bruxelles (ULB)", citySlug: "brussels", city: "Brussels", type: "Public", tuitionBand: "Moderate", tuitionNote: "Non-EU contribution applies; check current fee and exemptions", programs: ["Political Science", "Engineering", "Medicine", "Economics"], popularFor: "French-speaking university in the EU capital", website: "https://www.ulb.be/en" },
    { slug: "vub", name: "Vrije Universiteit Brussel (VUB)", citySlug: "brussels", city: "Brussels", type: "Public", tuitionBand: "Moderate", tuitionNote: "Non-EU fees vary by programme", programs: ["Engineering", "Business", "Law"], popularFor: "English-friendly Dutch-speaking university", website: "https://www.vub.be/en" },
    { slug: "university-of-antwerp", name: "University of Antwerp", citySlug: "antwerp", city: "Antwerp", type: "Public", tuitionBand: "Moderate", tuitionNote: "Non-EU fees vary by programme", programs: ["Business", "Pharmacy", "Sciences"], popularFor: "Modern research university", website: "https://www.uantwerpen.be/en/" },
    { slug: "university-of-liege", name: "University of Liège", citySlug: "liege", city: "Liège", type: "Public", tuitionBand: "Moderate", tuitionNote: "Non-EU contribution applies; check current fee and exemptions", programs: ["Engineering", "Veterinary", "Sciences"], popularFor: "Comprehensive French-speaking university", website: "https://www.uliege.be/cms/c_9038317/en/uliege" },
    { slug: "uclouvain", name: "UCLouvain", citySlug: null, city: "Louvain-la-Neuve", type: "Public", tuitionBand: "Moderate", tuitionNote: "Non-EU contribution applies; check current fee and exemptions", programs: ["Engineering", "Economics", "Sciences"], popularFor: "Large French-speaking university near Brussels", website: "https://uclouvain.be/en/" },
    { slug: "hasselt-university", name: "Hasselt University", citySlug: null, city: "Hasselt", type: "Public", tuitionBand: "Moderate", tuitionNote: "Non-EU fees vary by programme", programs: ["Data Science", "Business", "Engineering"], popularFor: "Young, innovative university", website: "https://www.uhasselt.be/en" },
  ],

  faqs: [
    { q: "How much money do I need for a Belgian student visa?", a: "For 2026–27, about €1,062 net per month (≈ €12,700 per year), up from €835 in 2025–26. It can be shown through a blocked account, scholarship or Belgian guarantor." },
    { q: "Can I work while studying?", a: "Yes, usually up to 20 hours per week during term and more during holidays." },
    { q: "Do I need Dutch or French?", a: "Not for English-taught master's programmes. Most bachelor's programmes are in Dutch or French." },
    { q: "What is the search year?", a: "After graduating, you can apply for a 12-month residence permit to look for work or start a business." },
  ],

  lastReviewed: "October 2026",
  sources: [
    { label: "Study in Flanders", url: "https://www.studyinflanders.be/" },
    { label: "Study in Belgium (Wallonia-Brussels)", url: "https://www.studyinbelgium.be/en" },
    { label: "Immigration Office – sufficient means", url: "https://dofi.ibz.be/en" },
  ],
};
