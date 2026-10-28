// Italy's application facts in the same shape the other countries use
// (quickFacts, admissionSteps, timeline, requirements, scholarships, visa), so
// every university profile can be built by one template. Review yearly.

export const ITALY_CONTEXT = {
  currencySymbol: "€",
  lastReviewed: "October 2026",
  quickFacts: {
    tuition: "≈ €900 – €4k / year (public)",
    livingNote: "For the visa you show roughly €6,000+ per year for living costs (the amount is updated every year), as a bank statement or a scholarship letter.",
    tuitionNote: "Public universities set fees by family income (ISEE-style), so most Pakistani students pay low fees, and DSU winners usually pay none. Private universities charge much more.",
    intakes: "September (main) · February (some)",
    language: "Italian · hundreds of English-taught programmes",
    work: "20 h/week (1,040 h/year)",
    postStudy: "12-month job search permit",
    visa: "Type D study visa + permesso di soggiorno",
  },

  admissionSteps: [
    { title: "Shortlist programmes", text: "Pick English-taught programmes at a few universities. Each programme has its own deadline and entry test rules." },
    { title: "Apply to the university", text: "Upload your documents on the university's own portal and get a pre-admission or acceptance letter." },
    { title: "Pre-enrol on Universitaly", text: "Every non-EU student fills in the pre-enrolment form on the Universitaly website. The embassy uses it for your visa." },
    { title: "Get your degree checked", text: "Get a Declaration of Value (DOV) from the Italian embassy, or a CIMEA statement, so Italy can read your Pakistani grades." },
    { title: "Apply for DSU and the visa", text: "Send your DSU scholarship file to the regional body and book your study visa appointment." },
  ],

  timeline: [
    { phase: "Shortlist", timing: "October – December", text: "Choose 4–6 English-taught programmes and note each one's deadline and entry test." },
    { phase: "University applications", timing: "January – April", text: "Most non-EU application windows run in these months. Popular programmes close early, so apply as soon as the window opens." },
    { phase: "Pre-enrolment & DOV", timing: "April – July", text: "Pre-enrol on Universitaly after you are accepted, and start your Declaration of Value or CIMEA check." },
    { phase: "DSU scholarship file", timing: "June – September", text: "Regional DSU deadlines fall in summer. Family income and property papers must be translated and legalised first." },
    { phase: "Visa appointment", timing: "June – August", text: "Book as soon as your pre-enrolment is approved; appointments fill up quickly in summer." },
    { phase: "Arrival", timing: "September – October", text: "Apply for your permesso di soggiorno within 8 days of arriving, get your codice fiscale and enrol." },
  ],

  requirements: {
    bachelor: [
      "12 years of schooling: Matric + FSc/HSSC (or A-levels), usually with good marks",
      "Some universities run their own entrance test or accept SAT for English bachelor's",
      "English-taught medicine and dentistry need the IMAT entrance test",
      "English test: IELTS 5.5–6.5 is typical; some accept a Medium of Instruction letter",
    ],
    master: [
      "A bachelor's degree in a related subject (16 years of education)",
      "Your courses and credits must match the programme's required subjects",
      "English test: IELTS 6.0–6.5 is typical",
      "CV, motivation letter and sometimes recommendation letters or a portfolio",
    ],
    language: [
      { test: "IELTS / TOEFL / Duolingo", note: "For English-taught programmes; scores vary by programme" },
      { test: "Medium of Instruction letter", note: "Accepted by some universities instead of IELTS" },
      { test: "Italian (A2–B2)", note: "Needed only for Italian-taught programmes, but helpful for jobs" },
    ],
    documents: [
      "Matric/HSSC (and degree) attested by IBCC / HEC and the Ministry of Foreign Affairs",
      "Transcripts with grading scale",
      "Passport copy",
      "English test or Medium of Instruction letter",
      "CV and motivation letter",
      "Declaration of Value (DOV) or CIMEA statement",
    ],
  },

  scholarships: [
    { name: "DSU regional scholarship", provider: "Each region's student-aid body (DSU Lombardia, LazioDisco, ER.GO, ESU, EDISU…)", covers: "Yearly cash grant, free or cheap housing, free meals and usually no tuition", level: "Bachelor's · Master's", note: "Based on family income and assets, not grades alone. Papers must be translated and legalised." },
    { name: "Invest Your Talent in Italy", provider: "Italian Ministry of Foreign Affairs", covers: "Tuition waiver plus a monthly stipend", level: "Master's", note: "For selected master's in engineering, economics and related fields at partner universities." },
    { name: "Italian Government (MAECI) Scholarships", provider: "Italian Ministry of Foreign Affairs", covers: "Monthly allowance, health insurance, tuition exemption", level: "Master's · PhD", note: "Opens once a year, usually in spring." },
    { name: "University merit awards", provider: "Individual universities", covers: "Fee waivers or cash awards", level: "Bachelor's · Master's", note: "Examples: Padua Excellence, Bocconi merit awards, PoliMi merit scholarships." },
  ],

  visa: {
    name: "Type D Study Visa",
    summary: "Apply at the Italian Embassy in Islamabad (or its visa centre) after your pre-enrolment is approved. Within 8 days of arriving you apply for a permesso di soggiorno (residence permit) at the post office.",
  },

  applyVia: "University portal + Universitaly",
};

// Official websites for the Italian universities.
export const ITALY_WEBSITES = {
  "politecnico-di-milano": "https://www.polimi.it/en",
  "sapienza-university-of-rome": "https://www.uniroma1.it/en",
  "university-of-bologna": "https://www.unibo.it/en",
  "university-of-padua": "https://www.unipd.it/en/",
  "university-of-milan": "https://www.unimi.it/en",
  "politecnico-di-torino": "https://www.polito.it/en",
  "university-of-pisa": "https://www.unipi.it/index.php/english",
  "university-of-naples-federico-ii": "https://www.unina.it/en_GB/home",
  "university-of-turin": "https://en.unito.it/",
  "bocconi-university": "https://www.unibocconi.it/en",
  "university-of-florence": "https://www.unifi.it/en",
  "university-of-pavia": "https://portale.unipv.it/en",
  "university-of-trento": "https://www.unitn.it/en",
  "university-of-verona": "https://www.univr.it/en/",
  "university-of-parma": "https://en.unipr.it/",
  "university-of-genoa": "https://unige.it/en",
  "ca-foscari-university-of-venice": "https://www.unive.it/web/en",
  "university-of-siena": "https://en.unisi.it/",
  "university-of-rome-tor-vergata": "https://en.uniroma2.it/",
  "roma-tre-university": "https://www.uniroma3.it/en/",
  "university-of-bari-aldo-moro": "https://www.uniba.it/en",
  "university-of-ferrara": "https://www.unife.it/en",
  "university-of-palermo": "https://www.unipa.it/en/",
  "university-of-catania": "https://www.unict.it/en",
  "university-of-salerno": "https://web.unisa.it/en",
  "university-of-calabria": "https://www.unical.it/en/",
  "university-of-bergamo": "https://en.unibg.it/",
  "university-of-trieste": "https://portale.units.it/en",
  "university-of-udine": "https://www.uniud.it/en",
  "university-of-messina": "https://international.unime.it/",
  "university-of-milan-bicocca": "https://en.unimib.it/",
  "university-of-brescia": "https://en.unibs.it/",
  "university-of-perugia": "https://www.unipg.it/en/",
  "university-of-modena-and-reggio-emilia": "https://www.unimore.it/en",
  "university-of-insubria": "https://www.uninsubria.eu/",
  "university-of-eastern-piedmont": "https://www.uniupo.it/en",
  "university-of-camerino": "https://international.unicam.it/",
  "university-of-macerata": "https://www.unimc.it/en",
  "university-of-chieti-pescara": "https://www.unich.it/en",
  "university-of-laquila": "https://www.univaq.it/en/",
  "luiss-guido-carli": "https://www.luiss.edu/",
  "catholic-university-of-the-sacred-heart": "https://www.unicatt.it/en",
  "humanitas-university": "https://www.hunimed.eu/",
  "iulm-university": "https://www.iulm.it/en",
  "free-university-of-bozen-bolzano": "https://www.unibz.it/en/",
  "domus-academy": "https://www.domusacademy.com/",
  naba: "https://www.naba.it/en",
  "istituto-europeo-di-design": "https://www.ied.edu/",
  "istituto-marangoni": "https://www.istitutomarangoni.com/en",
  "scuola-superiore-sant-anna": "https://www.santannapisa.it/en",
};

// Where Zaifan applies on the student's behalf for each country.
export const APPLY_VIA = {
  italy: "University portal + Universitaly",
  germany: "uni-assist or the university portal",
  france: "Campus France (Études en France)",
  belgium: "Directly on the university portal",
  romania: "University, then the Ministry's acceptance letter",
  lithuania: "University online portal",
  turkey: "University portal or Türkiye Bursları",
  china: "University portal (+ CSC for the scholarship)",
  vietnam: "Directly with the university",
};
