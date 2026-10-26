export const chinaData = {
  slug: "china",
  name: "China",
  code: "CN",
  flag: "🇨🇳",
  flagColors: ["#de2910", "#ffde00", "#de2910"],
  status: "live",
  region: "East Asia",
  inEU: false,
  schengen: false,
  currency: "Chinese Yuan (CNY ¥)",
  headline: "Study in China",
  tagline: "Top-ranked universities, the CSC scholarship and a close Pakistan connection.",
  intro:
    "China has some of Asia's highest ranked universities, a huge range of English-taught programmes and the fully funded Chinese Government (CSC) Scholarship. It is a popular route for Pakistani students in engineering, computer science, business and MBBS, provided degree recognition is checked carefully.",
  shortDescription:
    "Highly ranked universities, the fully funded CSC scholarship, English-taught engineering, business and MBBS routes.",

  quickFacts: {
    tuition: "≈ ¥18k – ¥35k / year",
    tuitionNote:
      "Typical English-taught bachelor's fees. English-taught MBBS usually costs ≈ ¥30,000–¥75,000 per year depending on the university.",
    living: "≈ ¥2,500 – ¥5,000 / month",
    livingNote: "Beijing and Shanghai are the most expensive. Many universities offer affordable on-campus housing.",
    intakes: "September (main) · March (some)",
    language: "Chinese (HSK) · English-taught programmes",
    work: "Only with university & immigration approval",
    postStudy: "Some graduates move to work permits",
    visa: "X1 student visa + residence permit",
  },

  whyStudy: [
    { icon: "award", title: "CSC Scholarship", text: "Fully funded: tuition, accommodation, insurance and a monthly stipend." },
    { icon: "trophy", title: "Highly ranked universities", text: "Tsinghua, Peking, Fudan, SJTU and Zhejiang rank among Asia's best." },
    { icon: "cpu", title: "Tech & engineering", text: "Study in the world's largest manufacturing and technology economy." },
    { icon: "handshake", title: "Pakistan–China ties", text: "Long-standing education links and a large Pakistani student community." },
  ],

  costs: {
    tuition: [
      { label: "English-taught bachelor's", value: "≈ ¥18k – ¥35k / year", note: "Engineering and science usually cost more than humanities." },
      { label: "Master's / PhD", value: "≈ ¥25k – ¥45k / year", note: "Many students study for free on scholarships." },
      { label: "MBBS (English-taught)", value: "≈ ¥30k – ¥75k / year", note: "Only apply to universities whose MBBS is recognised by PMDC." },
      { label: "Chinese language year", value: "≈ ¥10k – ¥25k / year", note: "Optional foundation before Chinese-taught degrees." },
    ],
    living: [
      { label: "On-campus housing", value: "≈ ¥600 – ¥2,000 / month", note: "Shared rooms are cheapest." },
      { label: "Food", value: "≈ ¥1,000 – ¥1,800", note: "Campus canteens are very cheap." },
      { label: "Transport", value: "≈ ¥100 – ¥200", note: "Excellent metro and high-speed rail." },
      { label: "Insurance", value: "≈ ¥800 / year", note: "Usually mandatory and paid through the university." },
    ],
  },

  scholarships: [
    {
      name: "Chinese Government Scholarship (CSC)",
      provider: "China Scholarship Council",
      covers: "Tuition, accommodation, insurance and a monthly stipend (¥2,500 bachelor's · ¥3,000 master's · ¥3,500 PhD)",
      level: "Bachelor's · Master's · PhD",
      note: "Apply through campuschina.org, either via the Chinese Embassy route or directly through a university. Applications usually run around December–April.",
      link: "https://www.campuschina.org/",
    },
    {
      name: "Provincial Government Scholarships",
      provider: "Beijing, Shanghai, Jiangsu and other provinces",
      covers: "Full or partial tuition, sometimes a stipend",
      level: "Bachelor's · Master's · PhD",
      note: "Offered by the province where your university is located.",
    },
    {
      name: "University Scholarships",
      provider: "Individual universities",
      covers: "Full or partial tuition, sometimes housing",
      level: "All levels",
      note: "Many universities have their own merit scholarships for international students.",
    },
    {
      name: "International Chinese Language Teachers Scholarship",
      provider: "Center for Language Education and Cooperation",
      covers: "Tuition, housing, stipend, insurance",
      level: "Chinese language · Master's in Chinese teaching",
      note: "For students who want to study Chinese language.",
    },
  ],

  admissionSteps: [
    { title: "Choose programme & medium", text: "Decide between English-taught and Chinese-taught (HSK 4+ is often required)." },
    { title: "Check recognition", text: "For MBBS, confirm the university and programme are recognised by PMDC before applying." },
    { title: "Apply online", text: "Apply through university portals, plus the CSC portal if you want the scholarship." },
    { title: "Receive admission documents", text: "You'll get an admission notice and a JW201/JW202 visa form." },
    { title: "Medical check", text: "Complete the Foreigner Physical Examination Form." },
  ],

  visa: {
    name: "X1 Student Visa + Residence Permit",
    summary:
      "Apply at the Chinese Embassy in Islamabad or a Consulate (Karachi/Lahore) with your admission notice and JW202 form. Within 30 days of arrival you convert the X1 visa into a residence permit.",
    steps: [
      "Receive the admission notice and JW201/JW202 form",
      "Complete the physical examination form",
      "Apply for the X1 visa",
      "Arrive and register at the university and local police",
      "Apply for your residence permit within 30 days",
    ],
    documents: [
      "Passport and photos",
      "Admission notice (original)",
      "JW201 or JW202 form",
      "Foreigner Physical Examination Form",
      "Visa application form",
    ],
  },

  cities: [
    {
      slug: "beijing",
      name: "Beijing",
      emoji: "🏯",
      region: "Beijing",
      headline: "The capital of Chinese higher education",
      intro:
        "Beijing is home to Tsinghua, Peking University and dozens more. It is the political and academic centre of China, with a rich history and huge international student community.",
      livingCost: "High",
      bestFor: ["Engineering", "Computer Science", "International Relations"],
      highlights: [
        { title: "Top universities", text: "Tsinghua and Peking University are China's most famous." },
        { title: "History & culture", text: "The Forbidden City and Great Wall are nearby." },
        { title: "Embassy city", text: "Pakistan's embassy and many organisations are here." },
      ],
      costCards: [
        { label: "Housing", value: "≈ ¥1,000 – ¥3,000", text: "On-campus is far cheaper than off-campus." },
        { label: "Food", value: "≈ ¥1,500", text: "Canteens are affordable." },
        { label: "Transport", value: "Metro", text: "Huge, cheap metro network." },
      ],
      studentLife: ["Big international community", "Cold winters, hot summers", "Halal options in many areas"],
    },
    {
      slug: "shanghai",
      name: "Shanghai",
      emoji: "🌆",
      region: "Shanghai",
      headline: "China's global business capital",
      intro:
        "Shanghai is modern, international and finance-driven, with Fudan, Shanghai Jiao Tong and Tongji. It is the best city in China for business and international careers.",
      livingCost: "High",
      bestFor: ["Business", "Finance", "Engineering", "Medicine"],
      highlights: [
        { title: "International hub", text: "Global companies and a huge expat community." },
        { title: "Strong universities", text: "Fudan and SJTU are among China's top five." },
        { title: "Modern lifestyle", text: "Skyscrapers, riverside walks and great transport." },
      ],
      costCards: [
        { label: "Housing", value: "≈ ¥1,200 – ¥3,500", text: "One of China's priciest rental markets." },
        { label: "Food", value: "≈ ¥1,600", text: "Anything from street food to international dining." },
        { label: "Transport", value: "Metro", text: "One of the world's largest metro systems." },
      ],
      studentLife: ["Most international Chinese city", "Internship opportunities", "Fast-paced"],
    },
    {
      slug: "hangzhou",
      name: "Hangzhou",
      emoji: "🌿",
      region: "Zhejiang",
      headline: "Tech city by the West Lake",
      intro:
        "Hangzhou is home to Zhejiang University and Alibaba. It combines China's digital economy with a beautiful lake setting.",
      livingCost: "Medium",
      bestFor: ["Computer Science", "E-commerce", "Engineering"],
      highlights: [
        { title: "Digital economy", text: "Alibaba and many tech firms are based here." },
        { title: "Zhejiang University", text: "One of China's best research universities." },
        { title: "West Lake", text: "A UNESCO World Heritage landscape in the city." },
      ],
      costCards: [
        { label: "Housing", value: "≈ ¥800 – ¥2,500", text: "Campus housing is good value." },
        { label: "Food", value: "≈ ¥1,300", text: "Cheaper than Shanghai." },
        { label: "Transport", value: "Metro + bikes", text: "Shared bikes everywhere." },
      ],
      studentLife: ["Green and scenic", "Tech-focused", "Near Shanghai by high-speed rail"],
    },
    {
      slug: "wuhan",
      name: "Wuhan",
      emoji: "🌉",
      region: "Hubei",
      headline: "Central China's biggest student city",
      intro:
        "Wuhan has more than a million students and two leading universities, Wuhan University and HUST. It is affordable and well connected by high-speed rail.",
      livingCost: "Low–Medium",
      bestFor: ["Engineering", "Medicine", "Optoelectronics"],
      highlights: [
        { title: "Huge student population", text: "One of the largest university cities in the world." },
        { title: "Affordable", text: "Lower costs than coastal mega-cities." },
        { title: "Transport hub", text: "High-speed rail across China." },
      ],
      costCards: [
        { label: "Housing", value: "≈ ¥600 – ¥1,800", text: "Mostly on-campus." },
        { label: "Food", value: "≈ ¥1,100", text: "Famous local breakfast culture." },
        { label: "Transport", value: "Metro", text: "Growing metro network." },
      ],
      studentLife: ["Riverside city on the Yangtze", "Hot summers", "Very student-focused"],
    },
    {
      slug: "nanjing",
      name: "Nanjing",
      emoji: "🏮",
      region: "Jiangsu",
      headline: "Historic capital with strong universities",
      intro:
        "Nanjing is a former imperial capital with Nanjing University and Southeast University. It is cheaper than Shanghai and just over an hour away by train.",
      livingCost: "Medium",
      bestFor: ["Engineering", "Sciences", "Architecture"],
      highlights: [
        { title: "Academic history", text: "Nanjing University is one of China's oldest." },
        { title: "Jiangsu scholarships", text: "Provincial scholarships are available for international students." },
        { title: "Close to Shanghai", text: "Easy access to Shanghai's opportunities." },
      ],
      costCards: [
        { label: "Housing", value: "≈ ¥700 – ¥2,000", text: "Campus housing is common." },
        { label: "Food", value: "≈ ¥1,200", text: "Affordable and varied." },
        { label: "Transport", value: "Metro", text: "Comprehensive network." },
      ],
      studentLife: ["Tree-lined historic streets", "Calmer than Shanghai", "Strong academic culture"],
    },
  ],

  universities: [
    { slug: "tsinghua-university", name: "Tsinghua University", citySlug: "beijing", city: "Beijing", type: "Public", tuitionBand: "Moderate", tuitionNote: "Check official fee table; CSC available", programs: ["Engineering", "Computer Science", "Economics"], popularFor: "China's leading engineering university", website: "https://www.tsinghua.edu.cn/en/" },
    { slug: "peking-university", name: "Peking University", citySlug: "beijing", city: "Beijing", type: "Public", tuitionBand: "Moderate", tuitionNote: "Check official fee table; CSC available", programs: ["Sciences", "Humanities", "Medicine", "Economics"], popularFor: "China's most famous comprehensive university", website: "https://english.pku.edu.cn/" },
    { slug: "beijing-institute-of-technology", name: "Beijing Institute of Technology", citySlug: "beijing", city: "Beijing", type: "Technical", tuitionBand: "Moderate", tuitionNote: "Check official fee table", programs: ["Engineering", "Aerospace", "Computer Science"], popularFor: "Engineering and defence technology", website: "https://english.bit.edu.cn/" },
    { slug: "fudan-university", name: "Fudan University", citySlug: "shanghai", city: "Shanghai", type: "Public", tuitionBand: "Moderate", tuitionNote: "Check official fee table; CSC available", programs: ["Medicine", "Business", "Journalism", "Economics"], popularFor: "Top comprehensive university in Shanghai", website: "https://www.fudan.edu.cn/en/" },
    { slug: "shanghai-jiao-tong-university", name: "Shanghai Jiao Tong University", citySlug: "shanghai", city: "Shanghai", type: "Public", tuitionBand: "Moderate", tuitionNote: "Check official fee table; CSC available", programs: ["Engineering", "Medicine", "Business"], popularFor: "Engineering, medicine and business", website: "https://en.sjtu.edu.cn/" },
    { slug: "tongji-university", name: "Tongji University", citySlug: "shanghai", city: "Shanghai", type: "Public", tuitionBand: "Moderate", tuitionNote: "Check official fee table", programs: ["Civil Engineering", "Architecture", "Urban Planning"], popularFor: "Architecture and civil engineering", website: "https://en.tongji.edu.cn/" },
    { slug: "zhejiang-university", name: "Zhejiang University", citySlug: "hangzhou", city: "Hangzhou", type: "Public", tuitionBand: "Moderate", tuitionNote: "Check official fee table; CSC available", programs: ["Computer Science", "Engineering", "Agriculture", "Medicine"], popularFor: "Research powerhouse in China's tech city", website: "https://www.zju.edu.cn/english/" },
    { slug: "wuhan-university", name: "Wuhan University", citySlug: "wuhan", city: "Wuhan", type: "Public", tuitionBand: "Low", tuitionNote: "Check official fee table; CSC available", programs: ["Remote Sensing", "Law", "Medicine", "Engineering"], popularFor: "Beautiful campus, strong in remote sensing", website: "https://en.whu.edu.cn/" },
    { slug: "hust", name: "Huazhong University of Science and Technology (HUST)", citySlug: "wuhan", city: "Wuhan", type: "Technical", tuitionBand: "Low", tuitionNote: "Check official fee table; CSC available", programs: ["Engineering", "Medicine", "Optoelectronics"], popularFor: "Engineering and medicine", website: "https://english.hust.edu.cn/" },
    { slug: "nanjing-university", name: "Nanjing University", citySlug: "nanjing", city: "Nanjing", type: "Public", tuitionBand: "Low", tuitionNote: "Check official fee table; CSC available", programs: ["Sciences", "Humanities", "Business"], popularFor: "Historic, research-led university", website: "https://www.nju.edu.cn/en/" },
    { slug: "southeast-university", name: "Southeast University", citySlug: "nanjing", city: "Nanjing", type: "Technical", tuitionBand: "Low", tuitionNote: "Check official fee table", programs: ["Architecture", "Engineering", "Medicine"], popularFor: "Architecture and engineering", website: "https://www.seu.edu.cn/english/" },
  ],

  faqs: [
    { q: "How competitive is the CSC scholarship?", a: "Very competitive, but thousands are awarded every year. Applying through a university with a strong study plan and recommendation letters improves your chances." },
    { q: "Is MBBS in China recognised in Pakistan?", a: "Only at universities and programmes recognised by PMDC, and graduates must pass the national licensing exam. We check recognition before suggesting any medical university." },
    { q: "Do I need to learn Chinese?", a: "Not for English-taught programmes, but basic Chinese makes daily life much easier. Many universities require HSK for graduation even on English programmes, so check." },
    { q: "Can I work part-time?", a: "Only with approval from your university and the immigration authority, and the work must be noted on your residence permit. Do not plan your budget around part-time income." },
  ],

  lastReviewed: "October 2026",
  sources: [
    { label: "Campus China (CSC portal)", url: "https://www.campuschina.org/" },
    { label: "Study in China", url: "https://www.studyinchina.edu.cn/" },
  ],
};
