export const vietnamData = {
  slug: "vietnam",
  name: "Vietnam",
  code: "VN",
  flag: "🇻🇳",
  flagColors: ["#da251d", "#ffcd00", "#da251d"],
  status: "live",
  region: "South-East Asia",
  inEU: false,
  schengen: false,
  currency: "Vietnamese Dong (₫)",
  headline: "Study in Vietnam",
  tagline: "A fast-growing Asian economy with low living costs and international campuses.",
  intro:
    "Vietnam is one of Asia's fastest-growing economies. Students can choose low-cost public universities or international campuses like RMIT Vietnam, VinUniversity and Fulbright University Vietnam, which offer strong financial aid. Living costs are among the lowest of any destination we cover.",
  shortDescription:
    "Low living costs, international campuses with generous aid, and a booming South-East Asian economy.",

  quickFacts: {
    tuition: "≈ $1k – $4k / year (public)",
    tuitionNote:
      "Public universities are low cost. International universities (RMIT Vietnam, VinUni, Fulbright) charge much more but offer substantial financial aid.",
    living: "≈ $400 – $700 / month",
    livingNote: "Ho Chi Minh City and Hanoi are the most expensive; Da Nang is cheaper.",
    intakes: "September (main) · February/March (some)",
    language: "Vietnamese · English-taught programmes",
    work: "DH visa is for study only",
    postStudy: "Employer-sponsored work permit",
    visa: "DH student visa + temporary residence card",
  },

  whyStudy: [
    { icon: "wallet", title: "Very low living costs", text: "Rent, food and transport cost far less than in Europe." },
    { icon: "trendingUp", title: "Booming economy", text: "Manufacturing, tech and tourism are growing fast." },
    { icon: "building", title: "International campuses", text: "RMIT Vietnam, VinUniversity and Fulbright teach fully in English." },
    { icon: "sun", title: "Lifestyle", text: "Beaches, mountains and famous food culture." },
  ],

  costs: {
    tuition: [
      { label: "Public universities", value: "≈ $1,000 – $4,000 / year", note: "English-taught programmes cost more than Vietnamese-taught ones." },
      { label: "International universities", value: "≈ $10k – $35k / year", note: "Large merit and need-based aid at VinUni and Fulbright." },
      { label: "Vietnamese language year", value: "Optional", note: "For Vietnamese-taught degrees." },
      { label: "Application fees", value: "Varies", note: "Check each university." },
    ],
    living: [
      { label: "Rent", value: "≈ $150 – $350", note: "Dorms and shared flats." },
      { label: "Food", value: "≈ $120 – $200", note: "Street food is very cheap." },
      { label: "Transport", value: "≈ $15 – $40", note: "Ride-hailing motorbikes and buses." },
      { label: "Health insurance", value: "Required", note: "Often via the university." },
    ],
  },

  scholarships: [
    {
      name: "VinUniversity Scholarships & Financial Aid",
      provider: "VinUniversity",
      covers: "Up to full tuition, sometimes living support",
      level: "Bachelor's",
      note: "Merit and need-based aid for international students.",
      link: "https://vinuni.edu.vn/",
    },
    {
      name: "Fulbright University Vietnam Financial Aid",
      provider: "Fulbright University Vietnam",
      covers: "Need-based aid, up to full cost",
      level: "Bachelor's",
      note: "Liberal arts education in Ho Chi Minh City.",
      link: "https://fulbright.edu.vn/",
    },
    {
      name: "RMIT Vietnam Scholarships",
      provider: "RMIT University Vietnam",
      covers: "Partial to full tuition",
      level: "Bachelor's · Master's",
      note: "Several scholarships for international students each year.",
      link: "https://www.rmit.edu.vn/",
    },
    {
      name: "Vietnamese Government Scholarship",
      provider: "Government of Vietnam",
      covers: "Tuition and stipend",
      level: "All levels",
      note: "Mainly for partner countries. Check eligibility for Pakistani citizens before applying.",
    },
  ],

  admissionSteps: [
    { title: "Choose public or international", text: "Public universities are cheaper; international campuses offer English-only education and stronger aid." },
    { title: "Apply to the university", text: "Submit academic records, English test and personal statement." },
    { title: "Receive admission", text: "The university will sponsor your student visa." },
    { title: "Visa approval", text: "The university requests your DH visa approval from the Immigration Department." },
    { title: "Travel & register", text: "Arrive and apply for your temporary residence card." },
  ],

  visa: {
    name: "DH Student Visa",
    summary:
      "The DH visa is sponsored by your university. After approval you collect it at a Vietnamese embassy or on arrival, then convert to a temporary residence card. The DH visa is for study only and does not automatically allow work.",
    steps: [
      "Receive your admission letter",
      "University requests visa approval from Vietnamese Immigration",
      "Collect your DH visa at the embassy (or as instructed)",
      "Arrive and enrol",
      "Apply for a temporary residence card",
    ],
    documents: [
      "Passport and photos",
      "Admission letter",
      "Visa approval letter",
      "Health check (if requested)",
      "Proof of funds",
    ],
  },

  cities: [
    {
      slug: "hanoi",
      name: "Hanoi",
      emoji: "🏮",
      region: "Red River Delta",
      headline: "The historic capital",
      intro:
        "Hanoi is Vietnam's capital, with VNU Hanoi, HUST, Foreign Trade University and VinUniversity. It blends French colonial streets, lakes and a fast-modernising economy.",
      livingCost: "Low–Medium",
      bestFor: ["Engineering", "Economics", "Medicine"],
      highlights: [
        { title: "Top public universities", text: "VNU Hanoi and HUST are leading institutions." },
        { title: "VinUniversity", text: "A new international university with strong aid." },
        { title: "Culture", text: "Old Quarter, lakes and street food." },
      ],
      costCards: [
        { label: "Rent", value: "≈ $150 – $300", text: "Shared flats and dorms." },
        { label: "Food", value: "≈ $150", text: "Very cheap street food." },
        { label: "Transport", value: "Bus + motorbike", text: "Ride-hailing apps." },
      ],
      studentLife: ["Four seasons", "Busy motorbike traffic", "Rich culture"],
    },
    {
      slug: "ho-chi-minh-city",
      name: "Ho Chi Minh City",
      emoji: "🌆",
      region: "Southeast",
      headline: "Vietnam's economic engine",
      intro:
        "Ho Chi Minh City is Vietnam's largest and most dynamic city, home to VNU-HCM, RMIT Vietnam, Fulbright and Ton Duc Thang. It is the best city for business and internships.",
      livingCost: "Medium",
      bestFor: ["Business", "IT", "Design", "Liberal Arts"],
      highlights: [
        { title: "Business capital", text: "International companies and startups." },
        { title: "International campuses", text: "RMIT Vietnam and Fulbright University Vietnam." },
        { title: "Energy", text: "A fast, lively and modern city." },
      ],
      costCards: [
        { label: "Rent", value: "≈ $200 – $350", text: "Higher than Hanoi." },
        { label: "Food", value: "≈ $170", text: "Endless street food." },
        { label: "Transport", value: "Motorbike + metro", text: "New metro line." },
      ],
      studentLife: ["Warm all year", "Lively nightlife", "Big expat community"],
    },
    {
      slug: "da-nang",
      name: "Da Nang",
      emoji: "🏖️",
      region: "South Central Coast",
      headline: "Beach city with a relaxed pace",
      intro:
        "Da Nang is a clean coastal city between Hanoi and Ho Chi Minh City, home to the University of Da Nang and Duy Tan University. It is cheaper and calmer than the big two.",
      livingCost: "Low",
      bestFor: ["Tourism", "IT", "Engineering"],
      highlights: [
        { title: "Beaches", text: "Long sandy beaches inside the city." },
        { title: "Affordable", text: "Lower costs than Hanoi or HCMC." },
        { title: "Growing IT sector", text: "Tech parks and outsourcing companies." },
      ],
      costCards: [
        { label: "Rent", value: "≈ $130 – $250", text: "Good value near the beach." },
        { label: "Food", value: "≈ $130", text: "Seafood and local dishes." },
        { label: "Transport", value: "Motorbike", text: "Easy to get around." },
      ],
      studentLife: ["Beach lifestyle", "Clean and safe", "Close to Hoi An and Hue"],
    },
  ],

  universities: [
    { slug: "vnu-hanoi", name: "Vietnam National University, Hanoi", citySlug: "hanoi", city: "Hanoi", type: "Public", tuitionBand: "Low", tuitionNote: "Check official fee table", programs: ["Sciences", "Economics", "Languages", "IT"], popularFor: "Vietnam's leading national university", website: "https://vnu.edu.vn/eng/" },
    { slug: "hust-vietnam", name: "Hanoi University of Science and Technology", citySlug: "hanoi", city: "Hanoi", type: "Technical", tuitionBand: "Low", tuitionNote: "Check official fee table", programs: ["Engineering", "IT", "Electronics"], popularFor: "Vietnam's top technical university", website: "https://hust.edu.vn/en/" },
    { slug: "foreign-trade-university", name: "Foreign Trade University", citySlug: "hanoi", city: "Hanoi", type: "Public", tuitionBand: "Low", tuitionNote: "Check official fee table", programs: ["Economics", "Business", "International Trade"], popularFor: "Economics and trade", website: "https://ftu.edu.vn/" },
    { slug: "vinuniversity", name: "VinUniversity", citySlug: "hanoi", city: "Hanoi", type: "Private", tuitionBand: "High", tuitionNote: "International fees with large financial aid", programs: ["Business", "Computer Science", "Medicine", "Engineering"], popularFor: "International-standard private university", website: "https://vinuni.edu.vn/" },
    { slug: "vnu-hcm", name: "Vietnam National University, Ho Chi Minh City", citySlug: "ho-chi-minh-city", city: "Ho Chi Minh City", type: "Public", tuitionBand: "Low", tuitionNote: "Check official fee table", programs: ["Engineering", "Sciences", "Economics"], popularFor: "Leading university system in the south", website: "https://vnuhcm.edu.vn/" },
    { slug: "rmit-vietnam", name: "RMIT University Vietnam", citySlug: "ho-chi-minh-city", city: "Ho Chi Minh City", type: "International", tuitionBand: "High", tuitionNote: "International fees, scholarships available", programs: ["Business", "Design", "IT"], popularFor: "Australian degree taught in Vietnam", website: "https://www.rmit.edu.vn/" },
    { slug: "fulbright-vietnam", name: "Fulbright University Vietnam", citySlug: "ho-chi-minh-city", city: "Ho Chi Minh City", type: "Private", tuitionBand: "High", tuitionNote: "Need-based aid up to full cost", programs: ["Liberal Arts", "Engineering", "Economics"], popularFor: "American-style liberal arts", website: "https://fulbright.edu.vn/" },
    { slug: "ton-duc-thang-university", name: "Ton Duc Thang University", citySlug: "ho-chi-minh-city", city: "Ho Chi Minh City", type: "Public", tuitionBand: "Low", tuitionNote: "Check official fee table", programs: ["Engineering", "Business", "Sciences"], popularFor: "Fast-rising public university", website: "https://www.tdtu.edu.vn/en" },
    { slug: "university-of-da-nang", name: "University of Da Nang", citySlug: "da-nang", city: "Da Nang", type: "Public", tuitionBand: "Low", tuitionNote: "Check official fee table", programs: ["Engineering", "Economics", "Languages"], popularFor: "Regional university system", website: "https://www.udn.vn/" },
    { slug: "duy-tan-university", name: "Duy Tan University", citySlug: "da-nang", city: "Da Nang", type: "Private", tuitionBand: "Moderate", tuitionNote: "Check official fee table", programs: ["IT", "Medicine", "Tourism"], popularFor: "Research-active private university", website: "https://duytan.edu.vn/" },
  ],

  faqs: [
    { q: "Can I work part-time in Vietnam?", a: "The DH student visa is for study only and does not automatically allow work. A proposal for 20 hours per week of work rights has been discussed but was not confirmed in force. Do not plan your budget around part-time income." },
    { q: "Are international universities worth the higher fees?", a: "They offer English-only education, international faculty and large financial aid. With a scholarship, they can cost less than you expect." },
    { q: "Is Vietnam safe?", a: "Vietnam is generally safe for students. Traffic is the biggest day-to-day risk." },
  ],

  lastReviewed: "October 2026",
  sources: [
    { label: "Vietnam Immigration Department", url: "https://evisa.gov.vn/" },
  ],
};
