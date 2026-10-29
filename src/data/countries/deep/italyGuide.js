import { italianCities } from "../../italianCities";

// Italy's country guide in the same shape the other eight countries use, so
// one destination template serves all nine. Application facts (timeline,
// requirements, scholarships, admission steps) live in universities/italyContext.js
// and are merged in by guides.js. Review every year with the rest of the data.

// Monthly saver → comfort ranges in EUR. Totals match ITALY_CITY_BUDGETS in costs.js.
const CITY_BUDGETS = {
  milan: { rent: [600, 950], food: [220, 320], transport: [22, 40], other: [158, 290] },
  rome: { rent: [550, 900], food: [220, 310], transport: [25, 35], other: [155, 255] },
  florence: { rent: [500, 820], food: [210, 300], transport: [25, 35], other: [165, 245] },
  venice: { rent: [500, 800], food: [220, 320], transport: [30, 40], other: [150, 240] },
  bologna: { rent: [470, 750], food: [210, 300], transport: [25, 35], other: [145, 215] },
  padua: { rent: [400, 650], food: [200, 280], transport: [20, 30], other: [130, 190] },
  turin: { rent: [380, 620], food: [200, 280], transport: [25, 35], other: [145, 215] },
  pisa: { rent: [400, 640], food: [200, 280], transport: [20, 30], other: [130, 200] },
};

export const italyGuide = {
  intro:
    "Italy's public universities charge fees by family income, DSU scholarships can cover rent and meals, and hundreds of programmes are taught in English. Here is the honest picture: costs, cities, scholarships and every step to your visa.",

  whyStudy: [
    {
      icon: "wallet",
      title: "Low fees at public universities",
      text: "Fees are set by your family income, so most Pakistani students pay low fees, and DSU scholarship winners usually pay none.",
    },
    {
      icon: "award",
      title: "Scholarships based on need",
      text: "DSU regional scholarships look at your family income, not just your grades, and can include cash, a room and free meals.",
    },
    {
      icon: "languages",
      title: "Hundreds of English programmes",
      text: "Especially at master's level: engineering, business, design, economics, computer science and sciences.",
    },
    {
      icon: "globe",
      title: "A base in Europe",
      text: "An Italian residence permit lets you travel across the Schengen area, and graduates can stay up to 12 months to look for work.",
    },
  ],

  tuitionOptions: [
    { id: "public", label: "Public university", min: 900, max: 4000, note: "Fees set by your family income" },
    { id: "dsu", label: "Public + DSU scholarship", min: 0, max: 200, note: "Winners usually pay only a small regional tax" },
    { id: "private", label: "Private university", min: 10000, max: 17000, note: "Bocconi, LUISS, Cattolica and similar" },
  ],

  costs: {
    tuition: [
      { label: "Public universities", value: "≈ €900 – €4,000 / year", note: "Set by your family income (an ISEE-style calculation from your papers)." },
      { label: "With a DSU scholarship", value: "Usually €0 tuition", note: "Most winners only pay a small regional tax." },
      { label: "Private universities", value: "≈ €10k – €17k / year", note: "Bocconi, LUISS and Cattolica have their own merit awards." },
      { label: "Application fees", value: "€0 – €100 per university", note: "Some universities charge nothing; check each portal." },
    ],
    living: [
      { label: "Money proof for the visa", value: "≈ €6,000+ / year", note: "The amount is updated every year. A DSU or government scholarship letter also counts." },
      { label: "Rent (room in a shared flat)", value: "≈ €380 – €950 / month", note: "Milan and Rome sit at the top; Padua, Pisa and Turin at the bottom." },
      { label: "Food & transport", value: "≈ €220 – €360 / month", note: "University canteens (mensa) and student travel passes keep this down." },
      { label: "Health cover", value: "≈ €150 – €700 / year", note: "A private policy, or registering with the national health service (SSN)." },
    ],
  },

  decision: {
    choose: [
      "You want a European degree with low public university fees",
      "Your family income is modest, so a DSU scholarship could really help",
      "You can collect family income and property papers and get them translated",
      "You're happy to compare cities, not just university names",
      "You enjoy history, food, travel and a slower pace of life",
      "You can keep a backup budget in case the scholarship money comes late",
    ],
    avoid: [
      "You want everything handled at the last minute",
      "You're counting on a scholarship being guaranteed",
      "You need daily life to work fully in English",
      "You can't show around €6,000 a year for the visa",
      "You want to apply without checking each programme's own deadline",
      "You need a job straight after landing to pay your rent",
    ],
  },

  studentLife: [
    { icon: "home", title: "Housing", text: "DSU winners can get a university residence room. Everyone else shares flats, and rooms in Milan, Rome and Bologna go fast, so start looking as soon as you're accepted." },
    { icon: "utensils", title: "Food & halal", text: "University canteens (mensa) are cheap. Halal butchers and Pakistani shops are easy to find in Milan, Rome, Bologna, Turin and most big cities." },
    { icon: "train", title: "Transport", text: "Cities sell cheap student bus and metro passes, and fast trains link Milan, Bologna, Florence, Rome and Naples in a few hours." },
    { icon: "briefcase", title: "Part-time work", text: "You can work 20 hours a week. Restaurant, delivery and tutoring jobs are common, and basic Italian helps a lot." },
    { icon: "cloud", title: "Weather", text: "Hot summers everywhere. The south has mild winters; Milan and Turin get cold, foggy ones." },
    { icon: "users", title: "Pakistani community", text: "Large Pakistani communities in Lombardy, Rome and Bologna, plus student groups at most big universities." },
  ],

  cityGoals: [
    { goal: "Engineering", citySlug: "turin", reason: "Politecnico di Torino, car-industry links and good value for northern Italy." },
    { goal: "Business", citySlug: "milan", reason: "Finance, consulting, fashion and the most international job market." },
    { goal: "Medicine", citySlug: "rome", reason: "Sapienza and other big public universities in the capital." },
    { goal: "Research", citySlug: "padua", reason: "A research university with strong scholarship chances and a student focus." },
    { goal: "Student life", citySlug: "bologna", reason: "Europe's oldest university and the classic Italian student city." },
    { goal: "Arts & architecture", citySlug: "florence", reason: "Museums, heritage and creative programmes everywhere you look." },
    { goal: "Computer science", citySlug: "pisa", reason: "Strong computer science and physics in a small, affordable city." },
    { goal: "Languages & tourism", citySlug: "venice", reason: "Ca' Foscari's languages, tourism and business in a truly global city." },
  ],

  pathways: [
    { title: "Engineering route", icon: "cpu", slugs: ["politecnico-di-milano", "politecnico-di-torino", "university-of-pisa"] },
    { title: "Business route", icon: "briefcase", slugs: ["bocconi-university", "university-of-bologna", "university-of-turin"] },
    { title: "Scholarship route", icon: "award", slugs: ["university-of-padua", "university-of-bologna", "sapienza-university-of-rome"] },
    { title: "Medicine route", icon: "stethoscope", slugs: ["sapienza-university-of-rome", "university-of-milan", "university-of-pavia"] },
    { title: "Computer science route", icon: "cpu", slugs: ["university-of-pisa", "university-of-trento", "politecnico-di-torino"] },
    { title: "Design & arts route", icon: "landmark", slugs: ["politecnico-di-milano", "university-of-florence", "ca-foscari-university-of-venice"] },
  ],

  cities: italianCities.map((city) => ({
    slug: city.slug,
    name: city.name,
    emoji: city.emoji,
    region: city.region,
    headline: city.headline,
    livingCost: city.livingCost,
    bestFor: city.bestFor,
    budget: CITY_BUDGETS[city.slug],
  })),

  // Italy's scholarships are run region by region, so the guide explains how.
  funding: {
    title: "How DSU actually works",
    explainer: [
      { title: "It's regional", text: "Each region has its own DSU office with its own portal, deadline and rules. Your university's city decides which one you apply to." },
      { title: "It's based on family income", text: "Your family's income and property, proven with translated and legalised papers, decide whether you qualify. Grades matter later, to keep it." },
      { title: "It can cover a lot", text: "Winners usually pay no tuition and can get a yearly cash grant, a residence room and free or cheap meals." },
      { title: "It's never guaranteed", text: "Places depend on ranking and the region's budget. Some regions pay the first instalment months after you arrive." },
    ],
    bodies: [
      { region: "Lombardy", body: "DSU Lombardia (per university)", cities: "Milan, Pavia, Bergamo, Brescia", citySlug: "milan" },
      { region: "Lazio", body: "DiSCo Lazio", cities: "Rome", citySlug: "rome" },
      { region: "Emilia-Romagna", body: "ER.GO", cities: "Bologna, Parma, Ferrara, Modena", citySlug: "bologna" },
      { region: "Tuscany", body: "DSU Toscana", cities: "Florence, Pisa, Siena", citySlug: "pisa" },
      { region: "Piedmont", body: "EDISU Piemonte", cities: "Turin, Novara", citySlug: "turin" },
      { region: "Veneto", body: "ESU (Padua, Venice, Verona)", cities: "Padua, Venice, Verona", citySlug: "padua" },
    ],
    mistakes: [
      "Choosing a university without checking which region's DSU it belongs to",
      "Starting family income and property papers too late to translate and legalise them",
      "Assuming you'll win because a friend did",
      "Missing the region's own portal and deadline",
      "Building your whole budget around scholarship money",
    ],
  },

  visa: {
    steps: [
      "Get your acceptance letter from the university",
      "Pre-enrol on Universitaly and wait for the university to approve it",
      "Get your Declaration of Value (DOV) or CIMEA statement",
      "Book your appointment with the Italian Embassy in Islamabad or its visa centre",
      "Attend with your full file: money proof, housing, insurance and documents",
      "Within 8 days of landing, apply for your permesso di soggiorno at the post office",
    ],
    documents: [
      "Passport and recent photos",
      "Universitaly pre-enrolment summary",
      "University acceptance letter",
      "Proof of money (≈ €6,000+ a year) or a scholarship letter",
      "Proof of accommodation in Italy",
      "Health insurance",
      "Attested degrees, DOV or CIMEA, and translations",
    ],
  },

  faqs: [
    { q: "Is Italy good for Pakistani students?", a: "Yes, for students who want a European degree at low public fees, especially if a DSU scholarship is realistic for their family income. The right choice still depends on your subject, budget and documents." },
    { q: "Is the DSU scholarship guaranteed?", a: "No. It depends on your family income papers, the region's ranking and budget, and meeting the deadline. Prepare early and never treat it as guaranteed." },
    { q: "Can Pakistani students apply for DSU?", a: "Yes. International students apply to the DSU office of the region their university is in, with translated and legalised family income and property papers." },
    { q: "Can I study in Italy without Italian?", a: "Yes. Hundreds of programmes are taught in English, especially master's. Daily life, part-time jobs and offices are much easier with basic Italian, though." },
    { q: "Which Italian city is cheapest for students?", a: "Padua, Pisa and Turin are usually the most affordable of the big student cities. Milan, Rome and Venice cost the most, mainly because of rent." },
    { q: "Is Milan worth the higher cost?", a: "For business, design, engineering, fashion and finance it can be, because of the internships and jobs. Plan your rent early and keep a bigger budget." },
    { q: "Which city is best for engineering?", a: "Milan (Politecnico di Milano) and Turin (Politecnico di Torino) are the strongest, with Pisa and Padua close behind." },
    { q: "Which city is best for computer science?", a: "Pisa, Turin, Milan, Trento and Bologna are all strong. Compare programme language, scholarships and rent." },
    { q: "Which city is best for medicine?", a: "Rome, Milan, Pavia and Padua all teach medicine in English, but you must pass the IMAT entrance test first." },
    { q: "What happens if my DSU is rejected?", a: "You pay your normal income-based fee and cover living costs yourself, which is why every Italy plan needs a backup budget." },
    { q: "Can a scholarship cover all my costs?", a: "A full DSU award can cover most living costs in cheaper cities, but never plan as if it will cover everything." },
    { q: "Which documents matter for DSU?", a: "Passport, family composition certificate, family income and property papers, all translated and legalised. Each region publishes its own list." },
    { q: "Should I choose the university or the scholarship first?", a: "Both together. In Italy the university's city decides which DSU office, deadline and documents apply to you." },
    { q: "Can I work part-time in Italy?", a: "Yes, up to 20 hours a week (1,040 hours a year). Don't build your budget around it, though." },
    { q: "Is finding accommodation hard?", a: "In Milan, Rome and Bologna, yes. Search as soon as you're accepted and compare DSU residences, shared flats and student housing." },
    { q: "How much money should I plan for Italy?", a: "Your tuition, plus roughly €750–€1,600 a month depending on the city, plus flights, visa costs and an emergency buffer. Use the budget calculator on this page." },
    { q: "What is pre-enrolment?", a: "The form every non-EU student fills in on the Universitaly website after being accepted. The university approves it, and the embassy uses it for your visa." },
    { q: "What is a DOV or CIMEA statement?", a: "Proof that your Pakistani qualification is equivalent to the Italian one. The DOV comes from the Italian embassy; CIMEA issues a faster online statement that many universities accept." },
    { q: "Which intake should I target?", a: "September is the main intake. A few programmes start in February. Always follow the programme's own deadline." },
    { q: "When should I start?", a: "About a year before your intake. Late family income papers and late visa appointments are the most common reasons students miss a year." },
    { q: "Can I change university later?", a: "Sometimes, but it's never guaranteed and can affect your scholarship and permit. Choose carefully first." },
    { q: "Can Zaifan help me choose city and university together?", a: "Yes. We plan the country, city, university, DSU scholarship, documents and visa as one connected plan." },
  ],

  lastReviewed: "October 2026",
  sources: [
    { label: "Universitaly pre-enrolment", url: "https://www.universitaly.it/" },
    { label: "Study in Italy (Ministry of Foreign Affairs)", url: "https://studyinitaly.esteri.it/" },
    { label: "Italian Embassy Islamabad", url: "https://ambislamabad.esteri.it/" },
    { label: "CIMEA qualification statements", url: "https://www.cimea.it/" },
  ],
};
