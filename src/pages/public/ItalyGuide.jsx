import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  BadgePercent,
  BadgeDollarSign,
  BookOpenCheck,
  BriefcaseBusiness,
  Building2,
  CheckCircle2,
  ChevronDown,
  CircleHelp,
  Coffee,
  Compass,
  Euro,
  FileCheck2,
  GraduationCap,
  HeartHandshake,
  Home,
  Landmark,
  Plane,
  Route,
  ShieldCheck,
  Sparkles,
  Train,
  Utensils,
  WalletCards,
  ClipboardCheck,
  MapPinned,
  Scale,
  Search,
  Star,
  Trophy,
  UsersRound,
  CalendarDays,
  Clock3,
  Globe2,
  Map,
  Languages,
  Lightbulb,
  Rocket,
  Zap,
  TrendingUp,
  ArrowUpRight,
  MousePointer2,
} from "lucide-react";

import { italianUniversities } from "../../data/italianUniversities";
import { italianCities } from "../../data/italianCities";

const italyHighlights = [
  {
    icon: GraduationCap,
    title: "Public university pathways",
    text: "Explore affordable Italian public universities with course, city and scholarship planning.",
  },
  {
    icon: BadgeDollarSign,
    title: "DSU scholarship guidance",
    text: "Understand regional scholarship preparation, financial documents and deadline planning.",
  },
  {
    icon: Landmark,
    title: "Culture + career exposure",
    text: "Study in a country known for design, architecture, business, engineering, art and food culture.",
  },
  {
    icon: FileCheck2,
    title: "Visa roadmap support",
    text: "Plan admission, pre-enrolment, documents, appointment preparation and embassy steps clearly.",
  },
];

const tableOfContents = [
  "Why Italy",
  "Study Pathway",
  "Costs",
  "Comparison Center",
  "DSU Scholarship",
  "Universities",
  "Scholarship Map",
  "Scholarships",
  "Cities",
  "Student Life",
  "Decision Framework",
  "City Goals",
  "Reality Check",
  "University Pathways",
  "Visa Roadmap",
  "FAQs",
];

const pathwaySteps = [
  {
    icon: Compass,
    title: "Profile Review",
    text: "We understand your education, budget, target course and preferred intake.",
  },
  {
    icon: Building2,
    title: "University Shortlist",
    text: "We help you compare public universities, city fit, tuition range and admission requirements.",
  },
  {
    icon: BadgeDollarSign,
    title: "Scholarship Planning",
    text: "We prepare a DSU-focused document checklist and timeline before deadlines arrive.",
  },
  {
    icon: Plane,
    title: "Visa Preparation",
    text: "We guide pre-enrolment, file organization, appointment preparation and next steps.",
  },
];

const costCards = [
  {
    label: "Public University Tuition",
    value: "Approx. €500–€4,000 / year",
    text: "Many Italian public universities use comparatively moderate tuition structures. The exact fee can depend on the university, programme, nationality and financial documentation, so students must verify the current official fee table for their course.",
  },
  {
    label: "Typical Student Living Budget",
    value: "Approx. €700–€1,500+ / month",
    text: "Rent is usually the biggest variable. Milan, Rome and central Venice can cost substantially more, while Turin, Pisa, Padua and other student cities may offer more manageable routes depending on accommodation.",
  },
  {
    label: "Scholarship Strategy",
    value: "DSU + regional + university aid",
    text: "Eligible students may explore regional right-to-study benefits, merit awards and university-specific support. Funding should be treated as a planned opportunity—not guaranteed money—and a backup budget remains essential.",
  },
];

const practicalPlanning = [
  {
    title: "Bachelor's applicants",
    items: [
      "Check whether your secondary education meets the university's entry-equivalence rules",
      "Verify programme language and any entrance-test requirements",
      "Prepare academic records, identity documents and required translations",
      "Check programme-specific deadlines before starting scholarship planning",
    ],
  },
  {
    title: "Master's applicants",
    items: [
      "Match your previous degree and credits with the target programme",
      "Prepare transcripts, degree documents, CV and programme-specific material",
      "Check English or Italian language evidence required by the university",
      "Compare admission deadlines with regional scholarship preparation windows",
    ],
  },
  {
    title: "Before committing",
    items: [
      "Compare tuition, rent and realistic monthly living costs",
      "Identify the scholarship body connected to the university's region",
      "Build a backup budget that does not depend entirely on scholarship approval",
      "Plan admission, pre-enrolment, visa and accommodation as one connected timeline",
    ],
  },
];

const monthlyBudget = [
  ["Shared accommodation", "€300–€900+", "Largest variable; premium cities and central locations can cost more."],
  ["Food & groceries", "€180–€350+", "Cooking at home and student canteens can reduce monthly spending."],
  ["Local transport", "€25–€60+", "Student passes may be available depending on the city and operator."],
  ["Phone & essentials", "€20–€50+", "SIM, toiletries and routine personal expenses."],
  ["Study & personal buffer", "€75–€200+", "Books, social life, clothing and unexpected small expenses."],
];

const applicationTimeline = [
  { phase: "Research", timing: "9–12+ months before", text: "Choose subject area, degree level, language, cities and a realistic budget. Build a shortlist instead of applying randomly." },
  { phase: "University Applications", timing: "6–10 months before", text: "Track each programme separately. Requirements and deadlines vary, so the course page—not a generic country deadline—must guide the application." },
  { phase: "Funding Documents", timing: "Start early", text: "Prepare family, income, property and supporting documents early enough for translation, legalization or other formalities where applicable." },
  { phase: "Admission & Pre-enrolment", timing: "After the relevant admission stage", text: "Follow the university and official pre-enrolment procedure applicable to your case. Keep names and document details consistent." },
  { phase: "Visa Preparation", timing: "As soon as eligible to proceed", text: "Organize financial evidence, accommodation, insurance and the rest of the required file according to the competent official authority." },
  { phase: "Arrival", timing: "Before & after landing", text: "Confirm housing, travel, local registration and residence-permit responsibilities. Keep original documents accessible." },
];

const dsuChecklist = [
  "Admission or pre-enrolment planning",
  "Family income / financial documents",
  "Property or asset documents where required",
  "Passport and personal identity documents",
  "Translations, legalization or attestation planning",
  "Regional application deadline tracking",
];

const universities = [
  {
    name: "Politecnico di Milano",
    slug: "politecnico-di-milano",
    city: "Milan",
    type: "Technical",
    note: "Engineering, design and architecture powerhouse",
  },
  {
    name: "University of Bologna",
    slug: "university-of-bologna",
    city: "Bologna",
    type: "Public",
    note: "Historic prestige and classic student-city life",
  },
  {
    name: "University of Padua",
    slug: "university-of-padua",
    city: "Padua",
    type: "Public",
    note: "Scholarship-friendly research university",
  },
  {
    name: "Sapienza University of Rome",
    slug: "sapienza-university-of-rome",
    city: "Rome",
    type: "Public",
    note: "Big-city university with global recognition",
  },
  {
    name: "University of Milan",
    slug: "university-of-milan",
    city: "Milan",
    type: "Public",
    note: "Medicine, law, science and economics in Milan",
  },
  {
    name: "University of Pisa",
    slug: "university-of-pisa",
    city: "Pisa",
    type: "Public",
    note: "Strong science, computer science and research route",
  },
];

const cityIconMap = {
  milan: Building2,
  rome: Landmark,
  bologna: GraduationCap,
  padua: BookOpenCheck,
  florence: Landmark,
  turin: Building2,
  pisa: BookOpenCheck,
  venice: Landmark,
};

const scholarshipCards = [
  {
    title: "DSU Scholarship",
    icon: BadgeDollarSign,
    label: "Income-based support",
    text: "Plan financial, family and regional documents early so the student does not miss DSU windows.",
  },
  {
    title: "Regional Scholarships",
    icon: Landmark,
    label: "Different by region",
    text: "Italy scholarship rules can change by region, so students should match the university city with the right funding body.",
  },
  {
    title: "Merit Scholarships",
    icon: GraduationCap,
    label: "Academic performance",
    text: "Some universities offer merit-based awards for strong profiles, but they are selective and deadline-driven.",
  },
  {
    title: "University Grants",
    icon: WalletCards,
    label: "Institution-specific funding",
    text: "Many universities have their own fee reductions, benefits or partial support options worth checking.",
  },
];


const comparisonRows = [
  {
    city: "Milan",
    slug: "milan",
    cost: "High",
    scholarship: "DSU Lombardia",
    bestFor: "Business, Design, Engineering",
    vibe: "Fast-paced, premium, international",
    difficulty: "Competitive",
  },
  {
    city: "Rome",
    slug: "rome",
    cost: "High",
    scholarship: "LazioDisco",
    bestFor: "Medicine, Architecture, Humanities",
    vibe: "Historic, capital-city, broad",
    difficulty: "Moderate",
  },
  {
    city: "Bologna",
    slug: "bologna",
    cost: "Medium",
    scholarship: "ER.GO",
    bestFor: "Student Life, Business, Law",
    vibe: "Classic student city",
    difficulty: "Moderate",
  },
  {
    city: "Padua",
    slug: "padua",
    cost: "Medium",
    scholarship: "Regional + Padua Excellence",
    bestFor: "Research, Psychology, Data Science",
    vibe: "Historic, student-friendly",
    difficulty: "Balanced",
  },
  {
    city: "Pisa",
    slug: "pisa",
    cost: "Medium",
    scholarship: "DSU Toscana",
    bestFor: "Computer Science, Physics, Research",
    vibe: "Focused student city",
    difficulty: "Balanced",
  },
  {
    city: "Florence",
    slug: "florence",
    cost: "Medium",
    scholarship: "DSU Toscana",
    bestFor: "Arts, Architecture, Culture",
    vibe: "Creative and historic",
    difficulty: "Moderate",
  },
  {
    city: "Turin",
    slug: "turin",
    cost: "Medium",
    scholarship: "EDISU Piemonte",
    bestFor: "Engineering, Automotive, Business",
    vibe: "Industrial, practical, better value",
    difficulty: "Balanced",
  },
  {
    city: "Venice",
    slug: "venice",
    cost: "High",
    scholarship: "Regional + university aid",
    bestFor: "Languages, Business, Tourism",
    vibe: "Unique, cultural, international",
    difficulty: "Lifestyle-sensitive",
  },
];

const comparisonFilters = [
  { id: "all", label: "All Cities" },
  { id: "value", label: "Best Value" },
  { id: "scholarship", label: "Scholarships" },
  { id: "engineering", label: "Engineering" },
  { id: "business", label: "Business" },
  { id: "medicine", label: "Medicine" },
];

const dsuDeepDive = [
  {
    icon: CircleHelp,
    title: "What DSU actually means",
    text: "DSU is not one magic scholarship. It is a regional student support route where eligibility, ranking, documents and deadlines matter.",
  },
  {
    icon: UsersRound,
    title: "Who should check it",
    text: "Students targeting public universities, lower tuition routes and regional support should check DSU or similar regional benefits early.",
  },
  {
    icon: FileCheck2,
    title: "Documents decide everything",
    text: "Income, family, property, identity, translations and legalization planning can become the real challenge.",
  },
  {
    icon: ShieldCheck,
    title: "What it is not",
    text: "It is not guaranteed, not automatic and not something students should start after admission deadlines are already close.",
  },
];

const dsuMistakes = [
  "Choosing a university without checking its scholarship region",
  "Starting family income or property documents too late",
  "Assuming DSU is guaranteed because another student received support",
  "Ignoring translation, legalization or attestation time",
  "Missing regional portals and deadline differences",
  "Building the whole budget only around expected scholarship support",
];

const scholarshipRegionMap = [
  {
    region: "Lombardy",
    body: "DSU Lombardia",
    cities: "Milan, Pavia, Bergamo, Brescia",
    universities: "Polimi, Milan, Bicocca, Bocconi, Pavia",
    link: "/countries/italy/milan",
  },
  {
    region: "Lazio",
    body: "LazioDisco",
    cities: "Rome",
    universities: "Sapienza, Tor Vergata, Roma Tre, LUISS",
    link: "/countries/italy/rome",
  },
  {
    region: "Emilia-Romagna",
    body: "ER.GO",
    cities: "Bologna, Parma, Ferrara, Modena",
    universities: "Bologna, Parma, Ferrara, Modena",
    link: "/countries/italy/bologna",
  },
  {
    region: "Tuscany",
    body: "DSU Toscana",
    cities: "Pisa, Florence, Siena",
    universities: "Pisa, Florence, Siena, Sant'Anna",
    link: "/countries/italy/pisa",
  },
  {
    region: "Piedmont",
    body: "EDISU Piemonte",
    cities: "Turin, Novara",
    universities: "Politecnico di Torino, University of Turin",
    link: "/countries/italy/turin",
  },
  {
    region: "Veneto",
    body: "Regional Support",
    cities: "Padua, Venice, Verona",
    universities: "Padua, Ca' Foscari, Verona",
    link: "/countries/italy/padua",
  },
];

const universityCategoryBlocks = [
  {
    title: "Best for Engineering",
    icon: Building2,
    programs: ["Engineering", "Computer Science", "Automotive"],
    fallback: ["politecnico-di-milano", "politecnico-di-torino", "university-of-pisa"],
  },
  {
    title: "Best for Business",
    icon: BriefcaseBusiness,
    programs: ["Business", "Economics", "Finance", "Management"],
    fallback: ["bocconi-university", "university-of-bologna", "university-of-turin"],
  },
  {
    title: "Best for Scholarships",
    icon: BadgeDollarSign,
    programs: [],
    scholarshipStrength: "Excellent",
    fallback: ["university-of-padua", "university-of-bologna", "politecnico-di-milano"],
  },
  {
    title: "Best for Medicine",
    icon: HeartHandshake,
    programs: ["Medicine", "Surgery", "Biomedical Sciences"],
    fallback: ["sapienza-university-of-rome", "university-of-milan", "university-of-pavia"],
  },
  {
    title: "Best Budget Routes",
    icon: WalletCards,
    programs: [],
    tuitionLevel: "Budget",
    fallback: ["university-of-pisa", "university-of-turin", "university-of-padua"],
  },
  {
    title: "Best for Design & Arts",
    icon: Landmark,
    programs: ["Design", "Architecture", "Arts", "Fashion"],
    fallback: ["politecnico-di-milano", "university-of-florence", "naba"],
  },
];

const lifeItems = [
  { icon: Coffee, emoji: "☕", title: "Daily Life", text: "Cafes, piazzas, local markets and city walking culture." },
  { icon: Utensils, emoji: "🍝", title: "Food", text: "Pasta, pizza, regional dishes and affordable student meals." },
  { icon: Train, emoji: "🚆", title: "Transport", text: "Public transport and trains help students move between cities." },
  { icon: Home, emoji: "🏡", title: "Housing", text: "Options can include dorms, shared apartments and private rentals." },
];

const decisionFramework = {
  choose: [
    "You want affordable public university options compared with many popular destinations",
    "You value scholarship possibilities but understand they require documents and deadlines",
    "You enjoy culture, history, travel, food and a European student lifestyle",
    "You are willing to compare cities instead of choosing only by university name",
    "You can prepare academic, financial, family and visa documents carefully",
    "You want country, city, university, scholarship and visa planning connected together",
  ],
  avoid: [
    "You want everything handled last minute without document pressure",
    "You expect DSU or any scholarship to be guaranteed before eligibility checks",
    "You need every city, office and daily-life interaction to be fully English-speaking",
    "You are unwilling to compare housing, living cost and city lifestyle before deciding",
    "You plan with no backup budget if scholarship support is delayed or rejected",
    "You want to apply randomly without checking program fit, deadlines and requirements",
  ],
};

const cityGoals = [
  { goal: "Engineering", city: "Turin", slug: "turin", icon: Building2, emoji: "⚙️", reason: "Politecnico di Torino, automotive links and strong northern Italy value." },
  { goal: "Business", city: "Milan", slug: "milan", icon: BriefcaseBusiness, emoji: "💼", reason: "Finance, consulting, fashion, management and international exposure." },
  { goal: "Medicine", city: "Rome", slug: "rome", icon: HeartHandshake, emoji: "🩺", reason: "Sapienza and major public university routes in a capital-city ecosystem." },
  { goal: "Research", city: "Padua", slug: "padua", icon: BookOpenCheck, emoji: "🔬", reason: "Strong research identity, scholarship-friendly positioning and student focus." },
  { goal: "Student Life", city: "Bologna", slug: "bologna", icon: GraduationCap, emoji: "🎒", reason: "Classic student-city atmosphere with deep academic identity." },
  { goal: "Arts & Architecture", city: "Florence", slug: "florence", icon: Landmark, emoji: "🎨", reason: "Culture, architecture, museums, heritage and creative pathways." },
  { goal: "Computer Science", city: "Pisa", slug: "pisa", icon: BookOpenCheck, emoji: "💻", reason: "Strong computer science, physics and research routes in a compact student city." },
  { goal: "Languages & Tourism", city: "Venice", slug: "venice", icon: Globe2, emoji: "🌍", reason: "Languages, tourism, business and international study in a uniquely global setting." },
];

const realityChecks = [
  { expectation: "Italy is cheap everywhere", reality: "Milan, Rome and Venice can create real budget pressure. City choice matters." },
  { expectation: "DSU is automatic", reality: "DSU depends on eligibility, ranking, documents, regional portals and deadlines." },
  { expectation: "All Italian cities feel the same", reality: "Milan, Bologna, Padua, Rome, Turin and Pisa give very different student lives." },
  { expectation: "Part-time work solves everything", reality: "Work can help, but the core plan needs tuition, rent, food, documents and backup budget." },
  { expectation: "University ranking is enough", reality: "Course fit, language, deadlines, scholarship route and city comfort matter just as much." },
  { expectation: "Documents can wait", reality: "Late income, property, family, translation or visa documents can damage the whole route." },
];

const pathwayUniversityGoals = [
  { title: "Engineering Route", icon: Building2, slugs: ["politecnico-di-milano", "politecnico-di-torino", "university-of-pisa"] },
  { title: "Business Route", icon: BriefcaseBusiness, slugs: ["bocconi-university", "university-of-bologna", "university-of-turin"] },
  { title: "Scholarship Route", icon: BadgeDollarSign, slugs: ["university-of-padua", "university-of-bologna", "sapienza-university-of-rome"] },
  { title: "Medicine Route", icon: HeartHandshake, slugs: ["sapienza-university-of-rome", "university-of-milan", "university-of-pavia"] },
  { title: "Computer Science Route", icon: BookOpenCheck, slugs: ["university-of-pisa", "university-of-trento", "politecnico-di-torino"] },
  { title: "Design & Arts Route", icon: Landmark, slugs: ["politecnico-di-milano", "university-of-florence", "ca-foscari-university-of-venice"] },
];

const visaSteps = [
  "Get admission / conditional admission",
  "Complete university and pre-enrolment steps where required",
  "Prepare academic, financial and personal documents",
  "Book visa appointment through the relevant process",
  "Attend appointment and track outcome",
  "Prepare arrival, accommodation and permit steps after landing",
];

const faqs = [
  { q: "Is Italy good for international students?", a: "Yes, Italy can be a strong option for students who want European education, public university pathways, culture and scholarship possibilities. The right choice depends on your course, budget, documents and long-term goals." },
  { q: "Is DSU guaranteed?", a: "No. DSU and regional benefits depend on eligibility, documents, deadlines, ranking and regional rules. Students should prepare early and avoid treating any scholarship as guaranteed." },
  { q: "Can Pakistani students apply for DSU?", a: "Many international students explore DSU-style regional support in Italy, but the exact route depends on the university, region, current rules and document preparation." },
  { q: "Can I study in Italy without Italian?", a: "Many programs are available in English, especially at master's level, but daily life can still require basic Italian. Students should check language requirements for each program." },
  { q: "Which Italian city is cheapest for students?", a: "Costs vary, but smaller student cities usually feel easier than Milan, Rome or Venice. Padua, Pisa, Turin and Bologna can be more manageable depending on housing." },
  { q: "Is Milan worth the higher cost?", a: "Milan can be worth it for business, design, engineering, fashion, finance and career exposure, but students must plan rent and lifestyle spending carefully." },
  { q: "Is Rome good for students?", a: "Rome is strong for medicine, architecture, humanities, engineering, economics and capital-city life. It can be expensive and spread out, so commute and housing planning matter." },
  { q: "Which city is best for engineering?", a: "Milan and Turin are usually strong engineering choices because of technical universities, industry exposure and northern Italy opportunities." },
  { q: "Which city is best for computer science?", a: "Pisa, Turin, Milan, Trento and Bologna can be strong options depending on program availability, language, scholarships and budget." },
  { q: "Which city is best for medicine?", a: "Rome, Milan, Pavia, Padua and several public universities can be considered, but admission requirements and language must be checked carefully." },
  { q: "What happens if DSU is rejected?", a: "Students should have a backup budget and alternative funding plan. DSU can reduce pressure, but the full Italy plan should not depend on one outcome." },
  { q: "Can scholarship cover all costs?", a: "Some students may receive meaningful support, but no student should assume full coverage before eligibility, ranking, documents and regional rules are confirmed." },
  { q: "What documents are important for DSU?", a: "Common planning documents include passport, academic records, family income records, family composition, property or asset documents where required, translations and legalization planning." },
  { q: "Should I choose university first or scholarship first?", a: "Both should be checked together. In Italy, the university city and region can affect scholarship route, deadlines and documents." },
  { q: "Can I work part-time in Italy?", a: "Many international students plan part-time work, but rules, availability and income expectations should be checked carefully. Do not build your full budget only around part-time work." },
  { q: "Is accommodation difficult in Italy?", a: "Accommodation can be competitive, especially in Milan, Rome, Bologna and central areas. Students should search early and compare dorms, shared rooms and private rentals." },
  { q: "How much money should I plan for Italy?", a: "It depends on tuition, city, rent, food, visa proof, travel and emergency margin. Milan and Rome need more careful budgeting than smaller cities." },
  { q: "What is pre-enrolment?", a: "Pre-enrolment is part of the Italy study process for many international students after admission planning. Exact requirements depend on the university and official procedure." },
  { q: "Can I change university later?", a: "Changes may be possible in some cases, but students should not rely on switching later. It is better to choose carefully before application and visa planning." },
  { q: "Which intake should I target?", a: "Most Italy planning focuses on September intake, but some universities or programs may have other windows. Always check the exact course deadline." },
  { q: "When should I start?", a: "Start early. Italy planning needs admission, scholarship documents, pre-enrolment and visa preparation. Late document preparation is one of the biggest student mistakes." },
  { q: "Can Zaifan help me choose city and university together?", a: "Yes. The best Italy plan connects country, city, university, scholarships, documents and visa preparation instead of treating each step separately." },
];


const italySnapshot = [
  {
    label: "Public tuition",
    value: "€500–€4,000",
    suffix: "/ year",
    icon: Euro,
    emoji: "💶",
    note: "Planning range for many public-university routes",
  },
  {
    label: "Living budget",
    value: "€700–€1,500+",
    suffix: "/ month",
    icon: WalletCards,
    emoji: "🏠",
    note: "City and housing choice make the biggest difference",
  },
  {
    label: "Main intake",
    value: "September",
    suffix: "",
    icon: CalendarDays,
    emoji: "📅",
    note: "Exact programme deadlines can open much earlier",
  },
  {
    label: "Scholarship route",
    value: "Regional",
    suffix: "+ university",
    icon: BadgePercent,
    emoji: "🎓",
    note: "DSU-style support is connected to regions and institutions",
  },
];

const quickChoices = [
  {
    eyebrow: "I care about budget",
    title: "Find the best-value city route",
    text: "Compare rent pressure, tuition, scholarship body and student lifestyle before choosing.",
    icon: WalletCards,
    action: "Compare cities",
    target: "italy-comparison-center",
  },
  {
    eyebrow: "I care about scholarships",
    title: "Understand DSU before applying",
    text: "See what regional support means, which documents matter and why preparation must start early.",
    icon: BadgeDollarSign,
    action: "Explore DSU",
    target: "italy-dsu-scholarship",
  },
  {
    eyebrow: "I care about universities",
    title: "Build a serious shortlist",
    text: "Move from broad interest to university pathways grouped by engineering, business, medicine and more.",
    icon: GraduationCap,
    action: "See universities",
    target: "italy-universities",
  },
];

const journeySignals = [
  { icon: Search, title: "Discover", text: "Country, cities and study routes" },
  { icon: Scale, title: "Compare", text: "Cost, scholarships and fit" },
  { icon: ClipboardCheck, title: "Prepare", text: "Admission and documents" },
  { icon: Rocket, title: "Move", text: "Visa, arrival and next steps" },
];

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: "easeOut" } },
};

function Badge({ children }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full bg-white/84 px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-[#ff4b12] shadow-sm ring-1 ring-orange-100">
      <Sparkles size={14} fill="currentColor" />
      {children}
    </span>
  );
}

function SectionHeader({ eyebrow, title, text, align = "center" }) {
  const centered = align === "center";
  return (
    <div className={centered ? "mx-auto max-w-4xl text-center" : "max-w-4xl"}>
      <Badge>{eyebrow}</Badge>
      <h2 className={`mt-4 text-3xl font-black leading-[0.98] tracking-[-0.05em] text-[#071f50] sm:text-4xl md:mt-5 md:text-6xl md:tracking-[-0.06em] ${centered ? "" : "max-w-3xl"}`}>
        {title}
      </h2>
      {text && (
        <p className={`${centered ? "mx-auto" : ""} mt-3 max-w-3xl text-sm font-semibold leading-7 text-[#5f6f89] sm:text-base md:mt-5 md:text-lg md:leading-8`}>
          {text}
        </p>
      )}
    </div>
  );
}

function InfoCard({ icon: Icon, title, text }) {
  return (
    <motion.div
      variants={fadeUp}
      className="group rounded-[30px] bg-white/90 p-6 shadow-[0_20px_55px_rgba(9,31,80,0.07)] ring-1 ring-orange-100 transition duration-300 hover:-translate-y-1 hover:shadow-[0_28px_70px_rgba(255,75,18,0.13)]"
    >
      <div className="mb-5 grid h-14 w-14 place-items-center rounded-2xl bg-[#fff1ea] text-[#ff4b12] ring-1 ring-orange-100 transition group-hover:scale-105">
        <Icon size={27} strokeWidth={2.6} />
      </div>
      <h3 className="text-xl font-black tracking-[-0.035em] text-[#071f50]">{title}</h3>
      <p className="mt-3 text-sm font-semibold leading-7 text-[#61708a]">{text}</p>
    </motion.div>
  );
}

function ItalyGuide() {
  const location = useLocation();
  const [openFaq, setOpenFaq] = useState(0);
  const [comparisonFilter, setComparisonFilter] = useState("all");

  const toc = useMemo(() => tableOfContents, []);

  const cityCards = useMemo(
    () =>
      italianCities
        .filter(Boolean)
        .map((city) => ({
          emoji: city.emoji,
          city: city.name,
          slug: city.slug,
          vibe:
            city.headline ||
            city.intro ||
            city.bestFor?.slice(0, 4).join(", ") ||
            "Explore this Italian student city.",
          icon: cityIconMap[city.slug] || MapPinned,
          status: "Live City Guide",
        })),
    []
  );

  const universityCategories = useMemo(() => {
    return universityCategoryBlocks.map((block) => {
      const matches = italianUniversities
        .filter((university) => {
          const programMatch =
            block.programs?.length > 0 &&
            university.programs.some((program) => block.programs.includes(program));

          const scholarshipMatch =
            block.scholarshipStrength &&
            university.scholarshipStrength === block.scholarshipStrength;

          const tuitionMatch =
            block.tuitionLevel && university.tuitionLevel === block.tuitionLevel;

          const fallbackMatch = block.fallback?.includes(university.slug);

          return programMatch || scholarshipMatch || tuitionMatch || fallbackMatch;
        })
        .slice(0, 3);

      return { ...block, universities: matches };
    });
  }, []);

  const pathwayUniversities = useMemo(() => {
    return pathwayUniversityGoals.map((goal) => ({
      ...goal,
      universities: goal.slugs
        .map((slug) => italianUniversities.find((university) => university.slug === slug))
        .filter(Boolean),
    }));
  }, []);

  const filteredComparisonRows = useMemo(() => {
    if (comparisonFilter === "all") return comparisonRows;

    if (comparisonFilter === "value") {
      return comparisonRows.filter((row) => row.cost !== "High");
    }

    if (comparisonFilter === "scholarship") {
      return comparisonRows.filter((row) =>
        /dsu|er\.go|edisu|laziodisco|regional/i.test(row.scholarship)
      );
    }

    return comparisonRows.filter((row) =>
      row.bestFor.toLowerCase().includes(comparisonFilter)
    );
  }, [comparisonFilter]);

  const scrollToId = (id) => {
    const target = document.getElementById(id);
    if (!target) return;
    const y = target.getBoundingClientRect().top + window.scrollY - 95;
    window.scrollTo({ top: y, behavior: "smooth" });
  };

  useEffect(() => {
    if (!location.hash) return undefined;

    const requestedId = location.hash.replace("#", "");
    const resolvedId = requestedId === "cities" ? "italy-cities" : requestedId;

    const timer = window.setTimeout(() => {
      scrollToId(resolvedId);
    }, 180);

    return () => window.clearTimeout(timer);
  }, [location.hash]);

  return (
    <main className="overflow-hidden bg-[#fff7ed] text-[#071f50]">
      <section className="relative isolate overflow-hidden px-4 pb-10 pt-24 sm:px-5 sm:pb-12 md:min-h-[820px] md:pb-16 md:pt-32">
        <div className="pointer-events-none absolute inset-0 -z-20 bg-[#fff7ed]" />
        <div className="pointer-events-none absolute left-[-8%] top-[10%] -z-10 h-[460px] w-[460px] rounded-full bg-orange-300/28 blur-[95px]" />
        <div className="pointer-events-none absolute right-[-5%] top-[4%] -z-10 h-[520px] w-[520px] rounded-full bg-[#ff4b12]/14 blur-[110px]" />
        <div className="pointer-events-none absolute bottom-[-18%] left-[32%] -z-10 h-[420px] w-[420px] rounded-full bg-amber-200/28 blur-[100px]" />

        <div className="mx-auto max-w-[1450px]">
          <div className="grid items-center gap-8 md:gap-10 lg:grid-cols-[0.94fr_1.06fr] lg:gap-12">
            <motion.div initial="hidden" animate="show" variants={fadeUp} className="relative z-10">
              <Badge>Italy Destination Experience</Badge>

              <div className="mt-4 inline-flex max-w-full items-center gap-2 rounded-full bg-[#071f50] px-3 py-2 text-[9px] font-black uppercase tracking-[0.11em] text-white shadow-[0_14px_35px_rgba(7,31,80,0.18)] sm:mt-7 sm:px-4 sm:text-xs sm:tracking-[0.16em]">
                <Zap size={14} className="text-[#ffb36d]" fill="currentColor" />
                Built for students who want clarity, not brochure talk
              </div>

              <h1 className="mt-5 max-w-4xl text-[2.65rem] font-black leading-[0.9] tracking-[-0.06em] text-[#071f50] sm:mt-6 sm:text-6xl sm:tracking-[-0.075em] md:text-7xl xl:text-[92px]">
                Your complete
                <span className="ml-3 inline-block text-[#ff4b12]">
                  Italy
                </span>
                <span className="ml-3 inline-block text-[#071f50]">IT</span>
                <br />
                study game plan.
              </h1>

              <p className="mt-4 max-w-2xl text-[15px] font-semibold leading-7 text-[#526178] sm:mt-7 sm:text-lg sm:leading-9">
                Compare cities, universities, costs, scholarships and the application journey in one place—then turn everything into a clear next-step plan.
              </p>

              <div className="mt-5 flex flex-col gap-3 sm:mt-8 sm:flex-row sm:flex-wrap">
                <Link
                  to="/appointment?country=Italy"
                  className="inline-flex w-full items-center justify-center gap-3 rounded-full bg-[#ff4b12] px-6 py-4 text-sm font-black text-white shadow-[0_20px_44px_rgba(255,75,18,0.3)] transition hover:-translate-y-1 hover:bg-[#ff642f] sm:w-auto sm:px-8 sm:py-5 sm:text-base"
                >
                  Build My Italy Plan
                  <ArrowRight size={21} strokeWidth={3} />
                </Link>
                <button
                  type="button"
                  onClick={() => scrollToId("italy-comparison-center")}
                  className="inline-flex w-full items-center justify-center gap-3 rounded-full bg-white px-6 py-4 text-sm font-black text-[#071f50] shadow-[0_14px_32px_rgba(9,31,80,0.08)] ring-1 ring-orange-100 transition hover:-translate-y-1 hover:text-[#ff4b12] sm:w-auto sm:px-8 sm:py-5 sm:text-base"
                >
                  <MousePointer2 size={19} />
                  Explore the Guide
                </button>
              </div>

              <div className="mt-6 grid max-w-2xl grid-cols-2 gap-2.5 sm:mt-9 sm:grid-cols-4 sm:gap-3">
                {journeySignals.map((item, index) => (
                  <div key={item.title} className="relative rounded-[18px] bg-white/88 p-3 shadow-[0_14px_35px_rgba(9,31,80,0.06)] ring-1 ring-orange-100 backdrop-blur sm:rounded-[22px] sm:p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <div className="grid h-9 w-9 place-items-center rounded-xl bg-[#fff1ea] text-[#ff4b12]">
                        <item.icon size={17} strokeWidth={2.8} />
                      </div>
                      <span className="text-[10px] font-black text-orange-200">0{index + 1}</span>
                    </div>
                    <p className="text-sm font-black text-[#071f50]">{item.title}</p>
                    <p className="mt-1 hidden text-[11px] font-semibold leading-5 text-[#7a879c] sm:block">{item.text}</p>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 35, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.75, delay: 0.08 }}
              className="relative"
            >
              <div className="relative overflow-hidden rounded-[26px] bg-white/96 p-4 shadow-[0_24px_65px_rgba(9,31,80,0.10)] ring-1 ring-orange-100 sm:rounded-[34px] sm:p-6 md:p-8">
                <div className="pointer-events-none absolute -right-14 -top-12 h-44 w-44 rounded-full border-[28px] border-[#ff4b12]/7" />
                <div className="pointer-events-none absolute -bottom-20 -left-16 h-48 w-48 rounded-full bg-orange-100/50 blur-2xl" />
                <div className="relative">
                  <div className="pointer-events-none absolute right-[-70px] top-[-70px] h-52 w-52 rounded-full border-[34px] border-[#ff4b12]/8" />
                  <div className="pointer-events-none absolute bottom-[-90px] left-[-70px] h-64 w-64 rounded-full border-[44px] border-[#071f50]/5" />

                  <div className="relative flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.18em] text-[#ff4b12]">Live Italy Dashboard</p>
                      <h2 className="mt-2 text-3xl font-black tracking-[-0.055em] text-[#071f50] sm:text-4xl md:text-5xl">
                        Know before you decide.
                      </h2>
                      <p className="mt-3 max-w-md text-sm font-semibold leading-7 text-[#61708a]">
                        A quick overview of the things that actually shape your decision.
                      </p>
                    </div>
                    <div className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-[#fffaf5] text-xl font-black text-[#071f50] shadow-inner ring-[8px] ring-[#fff1ea] sm:h-20 sm:w-20 sm:text-3xl sm:ring-[12px]">
                      IT
                    </div>
                  </div>

                  <div className="relative mt-5 grid grid-cols-2 gap-2.5 sm:mt-7 sm:gap-3">
                    {italySnapshot.map((item) => (
                      <div key={item.label} className="group rounded-[18px] bg-white p-3 shadow-[0_10px_28px_rgba(9,31,80,0.045)] ring-1 ring-orange-100/80 transition hover:-translate-y-1 sm:rounded-[24px] sm:p-5">
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2">
                            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-[#fff1ea] text-[#ff4b12]">
                              <item.icon size={21} strokeWidth={2.8} />
                            </div>
                            <span className="text-xl" aria-hidden="true">{item.emoji}</span>
                          </div>
                          <ArrowUpRight size={17} className="text-orange-200 transition group-hover:text-[#ff4b12]" />
                        </div>
                        <p className="mt-4 text-[10px] font-black uppercase tracking-[0.15em] text-[#ff4b12]">{item.label}</p>
                        <p className="mt-1 text-2xl font-black tracking-[-0.04em] text-[#071f50]">
                          {item.value} <span className="text-xs text-[#7c899b]">{item.suffix}</span>
                        </p>
                        <p className="mt-2 hidden text-xs font-semibold leading-5 text-[#7a879c] sm:block">{item.note}</p>
                      </div>
                    ))}
                  </div>

                  <div className="relative mt-4 hidden rounded-[24px] bg-[#fff7ed] p-5 ring-1 ring-orange-100 sm:block">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-start gap-3">
                        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[#ffe7d7] text-[#ff4b12]">
                          <Lightbulb size={22} />
                        </div>
                        <div>
                          <p className="text-sm font-black text-[#071f50]">The Zaifan approach</p>
                          <p className="mt-1 text-xs font-semibold leading-5 text-[#61708a]">
                            University + city + money + scholarship + visa = one decision.
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => scrollToId("italy-decision-framework")}
                        className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-black text-[#071f50] shadow-sm ring-1 ring-orange-100 transition hover:text-[#ff4b12]"
                      >
                        Check my fit
                        <ArrowRight size={14} strokeWidth={3} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          <div className="mt-12 hidden gap-4 md:grid md:grid-cols-2 lg:grid-cols-3">
            {quickChoices.map((item, index) => (
              <button
                key={item.title}
                type="button"
                onClick={() => scrollToId(item.target)}
                className="group relative overflow-hidden rounded-[22px] bg-white p-4 text-left shadow-[0_18px_50px_rgba(9,31,80,0.07)] ring-1 ring-orange-100 transition hover:-translate-y-1 hover:shadow-[0_26px_65px_rgba(255,75,18,0.12)] sm:rounded-[28px] sm:p-5"
              >
                <div className="absolute right-4 top-4 text-5xl font-black tracking-[-0.08em] text-orange-50">0{index + 1}</div>
                <div className="relative">
                  <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[#fff1ea] text-[#ff4b12]">
                    <item.icon size={23} strokeWidth={2.8} />
                  </div>
                  <p className="mt-4 text-[10px] font-black uppercase tracking-[0.15em] text-[#ff4b12]">{item.eyebrow}</p>
                  <h3 className="mt-2 text-xl font-black tracking-[-0.035em] text-[#071f50]">{item.title}</h3>
                  <p className="mt-2 max-w-md text-sm font-semibold leading-6 text-[#69778d]">{item.text}</p>
                  <span className="mt-4 inline-flex items-center gap-2 text-xs font-black text-[#ff4b12]">
                    {item.action}
                    <ArrowRight size={14} strokeWidth={3} className="transition group-hover:translate-x-1" />
                  </span>
                </div>
              </button>
            ))}
          </div>
          <div className="mt-10 hidden rounded-[30px] bg-white/88 p-5 shadow-[0_20px_55px_rgba(9,31,80,0.06)] ring-1 ring-orange-100 md:block">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#ff4b12]">Italy Pulse</p>
                <h3 className="mt-1 text-xl font-black text-[#071f50]">A country that feels different from city to city.</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {["🏙️ Milan", "🏛️ Rome", "🎒 Bologna", "📚 Padua", "🔬 Pisa", "🏎️ Turin", "🎨 Florence", "🚤 Venice"].map((item) => (
                  <span key={item} className="rounded-full bg-[#fff1ea] px-3 py-2 text-xs font-black text-[#071f50] ring-1 ring-orange-100">
                    {item}
                  </span>
                ))}
              </div>
            </div>
          </div>

        </div>
      </section>

      <section className="relative z-30 -mt-2 hidden px-5 pb-10 md:block">
        <div className="mx-auto max-w-[1380px] overflow-hidden rounded-[28px] bg-white/94 shadow-[0_22px_65px_rgba(9,31,80,0.10)] ring-1 ring-orange-100 backdrop-blur-xl md:sticky md:top-[94px] md:z-40">
          <div className="flex items-center gap-3 border-b border-orange-100 bg-[#071f50] px-4 py-3 text-white sm:px-5">
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white/10 text-[#ffb36d]">
              <Route size={18} strokeWidth={3} />
            </div>
            <div className="min-w-0">
              <p className="text-[9px] font-black uppercase tracking-[0.16em] text-[#ffb36d]">
                Explore your way
              </p>
              <p className="truncate text-sm font-black text-white">
                Jump directly to any part of the Italy guide
              </p>
            </div>
          </div>

          <div className="flex snap-x snap-mandatory gap-2 overflow-x-auto p-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {toc.map((item) => {
              const id = `italy-${item.toLowerCase().replace(/\s+/g, "-")}`;

              return (
                <button
                  key={item}
                  type="button"
                  onClick={() => scrollToId(id)}
                  className="group flex min-w-fit snap-start items-center gap-2 rounded-full bg-[#fffaf5] px-4 py-2.5 text-xs font-black text-[#071f50] ring-1 ring-orange-100 transition hover:-translate-y-0.5 hover:bg-[#fff1ea] hover:text-[#ff4b12]"
                >
                  <CheckCircle2
                    size={15}
                    className="text-[#ff4b12]"
                    strokeWidth={3}
                  />
                  {item}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      <section id="italy-why-italy" className="px-4 py-8 sm:px-5 md:py-16">
        <div className="mx-auto max-w-[1350px]">
          <SectionHeader
            eyebrow="Why Italy"
            title="A European study route with culture, value and opportunity."
            text="Italy is not just a destination card. It needs a real guide because students must understand universities, cities, documents, costs, scholarships and lifestyle before choosing it."
          />
          <motion.div initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.18 }} className="mt-12 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {italyHighlights.map((item, index) => (
              <motion.div
                key={item.title}
                variants={fadeUp}
                className={`group relative overflow-hidden rounded-[30px] p-6 shadow-[0_20px_55px_rgba(9,31,80,0.07)] ring-1 transition duration-300 hover:-translate-y-1 ${
                  index === 0
                    ? "bg-[#071f50] text-white ring-[#071f50] xl:col-span-2"
                    : index === 3
                    ? "bg-[#ff4b12] text-white ring-[#ff4b12]"
                    : "bg-white text-[#071f50] ring-orange-100"
                }`}
              >
                <div className={`mb-5 grid h-14 w-14 place-items-center rounded-2xl ${
                  index === 0 || index === 3 ? "bg-white/12 text-[#ffb36d] ring-1 ring-white/10" : "bg-[#fff1ea] text-[#ff4b12] ring-1 ring-orange-100"
                }`}>
                  <item.icon size={27} strokeWidth={2.6} />
                </div>
                <p className={`text-[10px] font-black uppercase tracking-[0.16em] ${
                  index === 0 || index === 3 ? "text-[#ffb36d]" : "text-[#ff4b12]"
                }`}>Reason 0{index + 1}</p>
                <h3 className={`mt-2 text-2xl font-black tracking-[-0.04em] ${
                  index === 0 || index === 3 ? "text-white" : "text-[#071f50]"
                }`}>{item.title}</h3>
                <p className={`mt-3 max-w-xl text-sm font-semibold leading-7 ${
                  index === 0 || index === 3 ? "text-white/72" : "text-[#61708a]"
                }`}>{item.text}</p>
                {index === 0 && (
                  <div className="mt-6 flex flex-wrap gap-2">
                    {["Universities", "Cities", "Scholarships", "Visa"].map((tag) => (
                      <span key={tag} className="rounded-full bg-white/10 px-3 py-2 text-[10px] font-black uppercase tracking-[0.12em] text-white ring-1 ring-white/10">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      <section id="italy-study-pathway" className="hidden overflow-hidden bg-[#071f50] px-5 py-20 text-white md:block">
        <div className="mx-auto max-w-[1350px]">
          <div className="mx-auto max-w-4xl text-center">
            <Badge>Study Pathway</Badge>
            <h2 className="mt-5 text-4xl font-black leading-[0.96] tracking-[-0.06em] text-white md:text-6xl">
              From “I like Italy” to “I know exactly what I’m doing.”
            </h2>
            <p className="mx-auto mt-5 max-w-3xl text-base font-semibold leading-8 text-white/68 md:text-lg">
              A good journey should feel like progress. Each step answers a different question and unlocks the next one.
            </p>
          </div>
          <div className="mt-12 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {pathwaySteps.map((step, index) => (
              <div key={step.title} className="group relative overflow-hidden rounded-[30px] bg-white/10 p-6 text-white ring-1 ring-white/10 backdrop-blur transition hover:-translate-y-1 hover:bg-white/14">
                <div className="mb-5 flex items-center justify-between">
                  <div className="grid h-14 w-14 place-items-center rounded-2xl bg-[#fff1ea] text-[#ff4b12]">
                    <step.icon size={27} strokeWidth={2.7} />
                  </div>
                  <span className="text-4xl font-black tracking-[-0.06em] text-white/10">0{index + 1}</span>
                </div>
                <h3 className="text-xl font-black tracking-[-0.035em] text-white">{step.title}</h3>
                <p className="mt-3 text-sm font-semibold leading-7 text-white/68">{step.text}</p>
                <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-white/10">
                  <div className="h-full rounded-full bg-[#ff4b12]" style={{ width: `${25 * (index + 1)}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="italy-costs" className="relative bg-[linear-gradient(180deg,#fff7ed_0%,#fff1ea_100%)] px-4 py-8 sm:px-5 md:py-20">
        <div className="mx-auto max-w-[1250px]">
          <SectionHeader eyebrow="Costs" title="Understand costs before you fall in love with the destination." text="Italy can be affordable compared with many popular routes, but students still need realistic budgeting by city, university and scholarship status." />
          <div className="mt-12 grid gap-5 lg:grid-cols-3">
            {costCards.map((card) => (
              <div key={card.label} className="rounded-[32px] bg-white/90 p-7 shadow-[0_22px_65px_rgba(9,31,80,0.08)] ring-1 ring-orange-100">
                <Euro className="text-[#ff4b12]" size={34} strokeWidth={2.5} />
                <p className="mt-5 text-xs font-black uppercase tracking-[0.18em] text-[#ff4b12]">{card.label}</p>
                <h3 className="mt-2 text-2xl font-black tracking-[-0.045em] text-[#071f50]">{card.value}</h3>
                <p className="mt-3 text-sm font-semibold leading-7 text-[#61708a]">{card.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="hidden bg-white/52 px-5 py-16 md:block">
        <div className="mx-auto max-w-[1350px]">
          <SectionHeader
            eyebrow="Admission Planning"
            title="Bachelor's and master's routes need different preparation."
            text="A useful Italy plan starts with the student's actual academic level. These are planning checkpoints—not universal admission rules—because every university and programme can set its own requirements."
          />
          <div className="mt-12 grid gap-5 lg:grid-cols-3">
            {practicalPlanning.map((group) => (
              <div key={group.title} className="rounded-[32px] bg-white p-7 shadow-[0_22px_65px_rgba(9,31,80,0.07)] ring-1 ring-orange-100">
                <h3 className="text-2xl font-black tracking-[-0.04em] text-[#071f50]">{group.title}</h3>
                <div className="mt-5 space-y-3">
                  {group.items.map((item) => (
                    <div key={item} className="flex items-start gap-3 rounded-2xl bg-[#fffaf5] p-4 text-sm font-bold leading-6 text-[#61708a] ring-1 ring-orange-100">
                      <CheckCircle2 className="mt-0.5 shrink-0 text-[#ff4b12]" size={18} strokeWidth={3} />
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="hidden px-5 py-16 md:block">
        <div className="mx-auto max-w-[1250px]">
          <SectionHeader
            eyebrow="Realistic Budget"
            title="Build the monthly budget before choosing the city."
            text="These figures are broad planning ranges rather than quotes. Housing and lifestyle can move the total significantly, so students should verify current local costs before committing."
          />
          <div className="mt-12 overflow-hidden rounded-[34px] bg-white shadow-[0_24px_70px_rgba(9,31,80,0.08)] ring-1 ring-orange-100">
            <div className="hidden grid-cols-[1fr_0.65fr_1.7fr] bg-[#071f50] px-6 py-4 text-xs font-black uppercase tracking-[0.14em] text-white md:grid">
              <div>Expense</div><div>Planning Range</div><div>What to Know</div>
            </div>
            {monthlyBudget.map(([expense, range, note]) => (
              <div key={expense} className="grid gap-2 border-b border-orange-100 px-6 py-5 last:border-0 md:grid-cols-[1fr_0.65fr_1.7fr] md:items-center">
                <p className="font-black text-[#071f50]">{expense}</p>
                <p className="font-black text-[#ff4b12]">{range}</p>
                <p className="text-sm font-semibold leading-6 text-[#61708a]">{note}</p>
              </div>
            ))}
          </div>
          <p className="mt-4 text-center text-xs font-bold leading-6 text-[#7b879b]">
            Planning ranges change over time and by city. Always verify current university fees, housing prices and official requirements before making financial decisions.
          </p>
        </div>
      </section>

      <section className="hidden bg-[#fff1ea] px-5 py-16 md:block">
        <div className="mx-auto max-w-[1350px]">
          <SectionHeader
            eyebrow="Application Timeline"
            title="Plan Italy as one connected timeline—not six separate tasks."
            text="Admission, funding documents, pre-enrolment, visa preparation and arrival planning affect one another. Starting early creates room to solve problems instead of reacting to them."
          />
          <div className="mt-12 grid gap-4 lg:grid-cols-2">
            {applicationTimeline.map((item, index) => (
              <div key={item.phase} className="flex gap-5 rounded-[30px] bg-white p-6 shadow-[0_18px_50px_rgba(9,31,80,0.06)] ring-1 ring-orange-100">
                <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[#ff4b12] text-sm font-black text-white">{index + 1}</div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-xl font-black text-[#071f50]">{item.phase}</h3>
                    <span className="rounded-full bg-[#fff1ea] px-3 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-[#ff4b12]">{item.timing}</span>
                  </div>
                  <p className="mt-3 text-sm font-semibold leading-7 text-[#61708a]">{item.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="italy-comparison-center" className="bg-white/52 px-4 py-8 sm:px-5 md:py-16">
        <div className="mx-auto max-w-[1450px]">
          <SectionHeader
            eyebrow="Comparison Center"
            title="Compare Italy's top student cities before choosing."
            text="This is where the Italy guide becomes useful: city, cost, scholarship region, program strength and lifestyle should be compared together before a student falls in love with one destination."
          />

          <div className="-mx-1 mt-8 flex snap-x snap-mandatory gap-2 overflow-x-auto px-1 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {comparisonFilters.map((filter) => {
              const isActive = comparisonFilter === filter.id;

              return (
                <button
                  key={filter.id}
                  type="button"
                  onClick={() => setComparisonFilter(filter.id)}
                  className={`min-w-fit snap-start rounded-full px-5 py-3 text-xs font-black transition ${
                    isActive
                      ? "bg-[#ff4b12] text-white shadow-[0_14px_30px_rgba(255,75,18,0.24)]"
                      : "bg-white text-[#071f50] ring-1 ring-orange-100 hover:-translate-y-0.5 hover:text-[#ff4b12]"
                  }`}
                >
                  {filter.label}
                </button>
              );
            })}
          </div>

          <div className="mt-5 overflow-hidden rounded-[34px] bg-white shadow-[0_24px_70px_rgba(9,31,80,0.08)] ring-1 ring-orange-100">
            <div className="flex items-center justify-between gap-4 border-b border-orange-100 bg-[#fffaf5] px-5 py-4">
              <p className="text-sm font-black text-[#071f50]">
                Showing {filteredComparisonRows.length} city
                {filteredComparisonRows.length === 1 ? "" : "ies"}
              </p>
              <button
                type="button"
                onClick={() => setComparisonFilter("all")}
                className="text-xs font-black text-[#ff4b12] transition hover:opacity-70"
              >
                Reset filters
              </button>
            </div>

            <div className="hidden grid-cols-[0.75fr_0.65fr_1fr_1.15fr_1.05fr_0.75fr] bg-[#071f50] px-5 py-4 text-xs font-black uppercase tracking-[0.14em] text-white lg:grid">
              <div>City</div>
              <div>Cost</div>
              <div>Scholarship</div>
              <div>Best For</div>
              <div>Student Vibe</div>
              <div>Difficulty</div>
            </div>

            <div className="divide-y divide-orange-100">
              {filteredComparisonRows.map((row) => (
                <Link
                  key={row.city}
                  to={`/countries/italy/${row.slug}`}
                  className="grid grid-cols-2 gap-3 px-4 py-4 transition hover:bg-[#fff7ed] sm:px-5 sm:py-5 lg:grid-cols-[0.75fr_0.65fr_1fr_1.15fr_1.05fr_0.75fr] lg:items-center"
                >
                  <div>
                    <p className="text-lg font-black text-[#071f50]">{row.city}</p>
                    <p className="mt-1 text-xs font-black uppercase tracking-[0.12em] text-[#ff4b12]">
                      View city guide
                    </p>
                  </div>
                  <p className="text-sm font-black text-[#071f50]">{row.cost}</p>
                  <p className="text-sm font-bold text-[#61708a]">{row.scholarship}</p>
                  <p className="text-sm font-bold text-[#61708a]">{row.bestFor}</p>
                  <p className="text-sm font-bold text-[#61708a]">{row.vibe}</p>
                  <div className="inline-flex w-fit items-center gap-2 rounded-full bg-[#fff1ea] px-3 py-2 text-xs font-black text-[#ff4b12] ring-1 ring-orange-100">
                    {row.difficulty}
                    <ArrowRight size={13} strokeWidth={3} />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="italy-dsu-scholarship" className="bg-[#071f50] px-4 py-9 text-white sm:px-5 md:py-16">
        <div className="mx-auto grid max-w-[1350px] gap-8 lg:grid-cols-[0.92fr_1.08fr] lg:items-center">
          <div>
            <Badge>DSU Scholarship</Badge>
            <h2 className="mt-6 text-4xl font-black leading-[0.98] tracking-[-0.055em] text-white md:text-6xl">
              DSU needs early documents, not last-minute panic.
            </h2>
            <p className="mt-6 text-base font-semibold leading-8 text-white/76 md:text-lg">
              Regional scholarships in Italy can support eligible students, including international students, but rules are region-based and documents must be prepared carefully. This page avoids guarantees and focuses on planning.
            </p>
            <a href="/appointment?service=scholarships-and-funding&country=Italy" className="mt-8 inline-flex items-center gap-3 rounded-full bg-[#ff4b12] px-8 py-5 font-black text-white shadow-[0_20px_44px_rgba(255,75,18,0.3)] transition hover:-translate-y-1 hover:bg-[#ff642f]">
              Plan My DSU File
              <ArrowRight size={21} strokeWidth={3} />
            </a>
          </div>

          <div className="rounded-[36px] bg-white/10 p-5 ring-1 ring-white/10 backdrop-blur md:p-7">
            <h3 className="mb-5 flex items-center gap-3 text-2xl font-black tracking-[-0.04em] text-white">
              <FileCheck2 className="text-[#ffb36d]" />
              Common DSU preparation checklist
            </h3>
            <div className="grid gap-3 sm:grid-cols-2">
              {dsuChecklist.map((item) => (
                <div key={item} className="flex items-center gap-3 rounded-2xl bg-white/10 px-4 py-4 text-sm font-bold text-white/88 ring-1 ring-white/10">
                  <CheckCircle2 size={18} className="text-[#ffb36d]" strokeWidth={3} />
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mx-auto mt-10 grid max-w-[1350px] gap-5 md:grid-cols-2 xl:grid-cols-4">
          {dsuDeepDive.map((item) => (
            <div
              key={item.title}
              className="rounded-[28px] bg-white/10 p-5 ring-1 ring-white/10"
            >
              <div className="mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-white/10 text-[#ffb36d] ring-1 ring-white/10">
                <item.icon size={26} strokeWidth={2.7} />
              </div>
              <h3 className="text-lg font-black text-white">{item.title}</h3>
              <p className="mt-3 text-sm font-semibold leading-7 text-white/72">{item.text}</p>
            </div>
          ))}
        </div>

        <div className="mx-auto mt-6 max-w-[1350px] rounded-[32px] bg-white/10 p-6 ring-1 ring-white/10 md:p-7">
          <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-[#ffb36d]">
                DSU Reality Check
              </p>
              <h3 className="mt-3 text-3xl font-black tracking-[-0.045em] text-white">
                Common mistakes that hurt scholarship planning.
              </h3>
              <p className="mt-3 text-sm font-semibold leading-7 text-white/72">
                This section exists because most students do not fail due to lack of dreams. They fail because document timing, region choice and deadlines are misunderstood.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {dsuMistakes.map((item) => (
                <div
                  key={item}
                  className="flex items-start gap-3 rounded-2xl bg-white/10 px-4 py-4 text-sm font-bold leading-6 text-white/86 ring-1 ring-white/10"
                >
                  <ShieldCheck size={18} className="mt-0.5 shrink-0 text-[#ffb36d]" strokeWidth={3} />
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="italy-universities" className="relative overflow-hidden bg-[radial-gradient(circle_at_80%_10%,rgba(255,75,18,0.10),transparent_28%),#fff7ed] px-4 py-9 sm:px-5 md:py-20">
        <div className="mx-auto max-w-[1250px]">
          <SectionHeader
            eyebrow="Universities"
            title="Start with Italy's strongest university routes."
            text="Italy is now connected to the live university database. Students can start from this guide, open real university profiles, compare options, then move toward scholarships and consultation."
          />

          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {universities.map((uni) => (
              <Link
                key={uni.slug}
                to={`/universities/${uni.slug}`}
                className="group rounded-[26px] bg-white p-5 shadow-[0_18px_48px_rgba(9,31,80,0.07)] ring-1 ring-orange-100 transition duration-300 hover:-translate-y-1 hover:shadow-[0_26px_65px_rgba(255,75,18,0.13)]"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[#fff1ea] text-[#ff4b12]">
                      <Building2 size={23} />
                    </div>
                    <div>
                      <h3 className="font-black leading-tight text-[#071f50] group-hover:text-[#ff4b12]">
                        {uni.name}
                      </h3>
                      <p className="mt-1 text-xs font-black uppercase tracking-[0.12em] text-[#ff4b12]">
                        {uni.city} · {uni.type}
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="mt-1 shrink-0 text-[#ff4b12] transition group-hover:translate-x-1" size={18} />
                </div>

                <p className="mt-4 text-sm font-semibold leading-6 text-[#61708a]">
                  {uni.note}
                </p>

                <div className="mt-5 inline-flex items-center gap-2 rounded-full bg-[#fff1ea] px-4 py-2 text-xs font-black text-[#ff4b12] ring-1 ring-orange-100">
                  Explore University
                  <ArrowRight size={14} strokeWidth={3} />
                </div>
              </Link>
            ))}
          </div>

          <div className="mt-10 grid gap-5 lg:grid-cols-2 xl:grid-cols-3">
            {universityCategories.map((category) => (
              <div
                key={category.title}
                className="rounded-[30px] bg-white p-6 shadow-[0_20px_55px_rgba(9,31,80,0.07)] ring-1 ring-orange-100"
              >
                <div className="mb-5 flex items-center gap-3">
                  <div className="grid h-14 w-14 place-items-center rounded-2xl bg-[#fff1ea] text-[#ff4b12]">
                    <category.icon size={25} strokeWidth={2.7} />
                  </div>
                  <h3 className="text-xl font-black tracking-[-0.035em] text-[#071f50]">
                    {category.title}
                  </h3>
                </div>

                <div className="space-y-3">
                  {category.universities.map((uni) => (
                    <Link
                      key={uni.slug}
                      to={`/universities/${uni.slug}`}
                      className="flex items-center justify-between gap-4 rounded-2xl bg-[#fffaf5] px-4 py-3 ring-1 ring-orange-100 transition hover:-translate-y-0.5 hover:bg-[#fff1ea]"
                    >
                      <div>
                        <p className="text-sm font-black text-[#071f50]">{uni.name}</p>
                        <p className="mt-1 text-xs font-bold text-[#61708a]">
                          {uni.city} · {uni.popularFor}
                        </p>
                      </div>
                      <ArrowRight className="shrink-0 text-[#ff4b12]" size={16} strokeWidth={3} />
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 flex justify-center">
            <Link
              to="/universities"
              className="inline-flex items-center justify-center gap-3 rounded-full bg-[#071f50] px-8 py-5 text-sm font-black text-white shadow-[0_20px_44px_rgba(9,31,80,0.18)] transition hover:-translate-y-1 hover:bg-[#092b72]"
            >
              Explore All 50 Universities
              <ArrowRight size={20} strokeWidth={3} />
            </Link>
          </div>
        </div>
      </section>

      <section id="italy-scholarship-map" className="hidden bg-[#071f50] px-5 py-16 text-white md:block">
        <div className="mx-auto max-w-[1350px]">
          <SectionHeader
            eyebrow="Scholarship Map"
            title="Funding route depends on the region, not just the university."
            text="Italy scholarship planning becomes much clearer when students understand which regional body connects to which city and university cluster."
          />

          <div className="mt-12 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {scholarshipRegionMap.map((region) => (
              <Link
                key={region.region}
                to={region.link}
                className="group rounded-[30px] bg-white/10 p-6 ring-1 ring-white/10 transition hover:-translate-y-1 hover:bg-white/14"
              >
                <div className="mb-5 flex items-start justify-between gap-4">
                  <div className="grid h-14 w-14 place-items-center rounded-2xl bg-white/10 text-[#ffb36d] ring-1 ring-white/10">
                    <MapPinned size={25} strokeWidth={2.7} />
                  </div>
                  <ArrowRight className="text-[#ffb36d] transition group-hover:translate-x-1" size={20} strokeWidth={3} />
                </div>

                <p className="text-xs font-black uppercase tracking-[0.16em] text-[#ffb36d]">
                  {region.region}
                </p>
                <h3 className="mt-2 text-2xl font-black text-white">{region.body}</h3>

                <div className="mt-5 space-y-3">
                  <div className="rounded-2xl bg-white/10 p-4 ring-1 ring-white/10">
                    <p className="text-[10px] font-black uppercase tracking-[0.14em] text-white/55">Cities</p>
                    <p className="mt-1 text-sm font-bold leading-6 text-white/82">{region.cities}</p>
                  </div>
                  <div className="rounded-2xl bg-white/10 p-4 ring-1 ring-white/10">
                    <p className="text-[10px] font-black uppercase tracking-[0.14em] text-white/55">University Cluster</p>
                    <p className="mt-1 text-sm font-bold leading-6 text-white/82">{region.universities}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          <div className="mt-8 flex justify-center">
            <Link
              to="/scholarships"
              className="inline-flex items-center justify-center gap-3 rounded-full bg-[#ff4b12] px-8 py-5 text-sm font-black text-white shadow-[0_20px_44px_rgba(255,75,18,0.26)] transition hover:-translate-y-1 hover:bg-[#ff642f]"
            >
              Open Full Scholarship Hub
              <ArrowRight size={20} strokeWidth={3} />
            </Link>
          </div>
        </div>
      </section>

      <section id="italy-scholarships" className="hidden bg-[#fff1ea] px-5 py-16 md:block">
        <div className="mx-auto max-w-[1350px]">
          <SectionHeader
            eyebrow="Scholarships"
            title="Connect university choice with scholarship planning."
            text="A strong Italy plan should not separate universities from funding. Students need to understand DSU, regional support, merit awards and university grants before choosing a final shortlist."
          />

          <div className="mt-12 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {scholarshipCards.map((item) => (
              <div
                key={item.title}
                className="rounded-[30px] bg-white p-6 shadow-[0_20px_55px_rgba(9,31,80,0.07)] ring-1 ring-orange-100 transition duration-300 hover:-translate-y-1 hover:shadow-[0_28px_70px_rgba(255,75,18,0.13)]"
              >
                <div className="mb-5 grid h-14 w-14 place-items-center rounded-2xl bg-[#fff1ea] text-[#ff4b12] ring-1 ring-orange-100">
                  <item.icon size={27} strokeWidth={2.6} />
                </div>
                <p className="text-xs font-black uppercase tracking-[0.16em] text-[#ff4b12]">
                  {item.label}
                </p>
                <h3 className="mt-2 text-xl font-black tracking-[-0.035em] text-[#071f50]">
                  {item.title}
                </h3>
                <p className="mt-3 text-sm font-semibold leading-7 text-[#61708a]">
                  {item.text}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-8 flex justify-center">
            <Link
              to="/scholarships"
              className="inline-flex items-center justify-center gap-3 rounded-full bg-[#ff4b12] px-8 py-5 text-sm font-black text-white shadow-[0_20px_44px_rgba(255,75,18,0.26)] transition hover:-translate-y-1 hover:bg-[#ff642f]"
            >
              Explore Scholarship Hub
              <ArrowRight size={20} strokeWidth={3} />
            </Link>
          </div>
        </div>
      </section>

      <section id="italy-cities" className="relative overflow-hidden bg-[linear-gradient(180deg,#fff_0%,#fff7ed_100%)] px-4 py-9 sm:px-5 md:py-20">
        <span id="cities" className="pointer-events-none absolute -top-24" aria-hidden="true" />
        <div className="mx-auto max-w-[1350px]">
          <SectionHeader
            eyebrow={`${cityCards.length} Live City Guides`}
            title="The city matters almost as much as the university."
            text="Explore every currently published Italian city from one reliable data source, so the guide, routes and city count stay synchronized."
          />
          <div className="mt-12 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {cityCards.map((city) => (
              <Link
                key={city.city}
                to={`/countries/italy/${city.slug}`}
                className="group rounded-[30px] bg-white p-6 shadow-[0_20px_55px_rgba(9,31,80,0.07)] ring-1 ring-orange-100 transition duration-300 hover:-translate-y-1 hover:shadow-[0_28px_70px_rgba(255,75,18,0.13)]"
              >
                <div className="mb-5 flex items-center gap-3">
                  <div className="grid h-14 w-14 place-items-center rounded-2xl bg-[#fff1ea] text-[#ff4b12]">
                    <city.icon size={27} />
                  </div>
                  <span className="text-3xl" aria-hidden="true">{city.emoji}</span>
                </div>
                <h3 className="text-2xl font-black tracking-[-0.045em] text-[#071f50] group-hover:text-[#ff4b12]">
                  {city.city}
                </h3>
                <p className="mt-3 text-sm font-semibold leading-7 text-[#61708a]">{city.vibe}</p>
                <div className="mt-5 inline-flex items-center gap-2 rounded-full bg-orange-100 px-3 py-1 text-[10px] font-black uppercase text-orange-700">
                  {city.status}
                  <ArrowRight size={13} strokeWidth={3} />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section id="italy-student-life" className="hidden px-5 py-16 md:block">
        <div className="mx-auto max-w-[1350px]">
          <SectionHeader eyebrow="Student Life" title="Italy is not only study. It is lifestyle, culture and adjustment." />
          <div className="mt-12 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {lifeItems.map((item, index) => (
              <div
                key={item.title}
                className={`group relative min-h-[240px] overflow-hidden rounded-[32px] p-6 shadow-[0_22px_60px_rgba(9,31,80,0.08)] transition hover:-translate-y-1 ${
                  index % 2 === 0 ? "bg-[#071f50] text-white" : "bg-[#ff4b12] text-white"
                }`}
              >
                <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full border-[20px] border-white/5" />
                <div className="relative">
                  <span
                    className="pointer-events-none absolute -right-2 -top-5 text-6xl opacity-20"
                    aria-hidden="true"
                  >
                    {item.emoji}
                  </span>

                  <div className="grid h-14 w-14 place-items-center rounded-2xl bg-white/10 text-[#ffb36d] ring-1 ring-white/10">
                    <item.icon size={27} strokeWidth={2.7} />
                  </div>

                  <p className="mt-8 text-[10px] font-black uppercase tracking-[0.16em] text-[#ffb36d]">
                    Student life 0{index + 1}
                  </p>
                  <h3 className="mt-2 text-2xl font-black tracking-[-0.04em] text-white">
                    {item.title}
                  </h3>
                  <p className="mt-3 text-sm font-semibold leading-7 text-white/72">
                    {item.text}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="italy-decision-framework" className="hidden bg-white/52 px-5 py-16 md:block">
        <div className="mx-auto max-w-[1350px]">
          <SectionHeader
            eyebrow="Decision Framework"
            title="Is Italy actually right for you?"
            text="Not every destination fits every student. This section builds trust by helping students decide honestly before they apply."
          />

          <div className="mt-12 grid gap-6 lg:grid-cols-2">
            <div className="rounded-[36px] bg-green-50 p-7 shadow-[0_22px_65px_rgba(9,31,80,0.06)] ring-1 ring-green-100 md:p-8">
              <div className="mb-6 flex items-center gap-3">
                <div className="grid h-14 w-14 place-items-center rounded-2xl bg-white text-green-700 ring-1 ring-green-100">
                  <CheckCircle2 size={28} strokeWidth={2.8} />
                </div>
                <h3 className="text-3xl font-black tracking-[-0.045em] text-green-800">Choose Italy If...</h3>
              </div>

              <div className="grid gap-3">
                {decisionFramework.choose.map((item) => (
                  <div key={item} className="flex items-start gap-3 rounded-2xl bg-white px-4 py-4 text-sm font-bold leading-6 text-slate-700 ring-1 ring-green-100">
                    <CheckCircle2 className="mt-0.5 shrink-0 text-green-600" size={18} strokeWidth={3} />
                    {item}
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[36px] bg-orange-50 p-7 shadow-[0_22px_65px_rgba(9,31,80,0.06)] ring-1 ring-orange-100 md:p-8">
              <div className="mb-6 flex items-center gap-3">
                <div className="grid h-14 w-14 place-items-center rounded-2xl bg-white text-[#ff4b12] ring-1 ring-orange-100">
                  <CircleHelp size={28} strokeWidth={2.8} />
                </div>
                <h3 className="text-3xl font-black tracking-[-0.045em] text-[#ff4b12]">Avoid Italy If...</h3>
              </div>

              <div className="grid gap-3">
                {decisionFramework.avoid.map((item) => (
                  <div key={item} className="flex items-start gap-3 rounded-2xl bg-white px-4 py-4 text-sm font-bold leading-6 text-slate-700 ring-1 ring-orange-100">
                    <CircleHelp className="mt-0.5 shrink-0 text-[#ff4b12]" size={18} strokeWidth={3} />
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="italy-city-goals" className="hidden px-5 py-16 md:block">
        <div className="mx-auto max-w-[1350px]">
          <SectionHeader
            eyebrow="Best Cities By Goal"
            title="Choose your Italian city by purpose, not by random popularity."
            text="Every city has a different personality. This helps students move from vague interest to a smarter shortlist."
          />

          <div className="mt-12 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {cityGoals.map((item, index) => (
              <Link
                key={item.goal}
                to={`/countries/italy/${item.slug}`}
                className="group relative overflow-hidden rounded-[32px] bg-white p-7 shadow-[0_20px_55px_rgba(9,31,80,0.07)] ring-1 ring-orange-100 transition duration-300 hover:-translate-y-1 hover:shadow-[0_28px_70px_rgba(255,75,18,0.13)]"
              >
                <div className="pointer-events-none absolute -right-10 -top-10 text-[110px] font-black leading-none text-[#fff1ea] transition duration-300 group-hover:scale-110">
                  {item.emoji}
                </div>

                <div className="relative">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 text-[#ff4b12]">
                      <item.icon size={24} strokeWidth={2.5} />
                      <span className="text-xs font-black uppercase tracking-[0.16em]">
                        {item.goal}
                      </span>
                    </div>
                    <span className="text-xs font-black text-orange-200">0{index + 1}</span>
                  </div>

                  <h3 className="mt-8 text-4xl font-black tracking-[-0.055em] text-[#071f50]">
                    {item.city}
                  </h3>
                  <p className="mt-4 max-w-md text-sm font-semibold leading-7 text-[#61708a]">
                    {item.reason}
                  </p>

                  <div className="mt-6 inline-flex items-center gap-2 text-xs font-black text-[#ff4b12]">
                    Explore {item.city}
                    <ArrowRight size={14} strokeWidth={3} className="transition group-hover:translate-x-1" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section id="italy-reality-check" className="hidden bg-[#071f50] px-5 py-16 text-white md:block">
        <div className="mx-auto max-w-[1350px]">
          <div className="mx-auto max-w-4xl text-center">
            <Badge>Reality Check</Badge>
            <h2 className="mt-5 text-4xl font-black leading-[0.98] tracking-[-0.055em] text-white md:text-6xl">
              What students expect vs what Italy is actually like.
            </h2>
            <p className="mx-auto mt-5 max-w-3xl text-base font-semibold leading-8 text-white/70 md:text-lg">
              This is the trust section. It makes the page feel like real guidance, not a brochure.
            </p>
          </div>

          <div className="mt-12 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {realityChecks.map((item) => (
              <div key={item.expectation} className="rounded-[30px] bg-white/10 p-6 ring-1 ring-white/10">
                <div className="mb-5 grid h-14 w-14 place-items-center rounded-2xl bg-white/10 text-[#ffb36d] ring-1 ring-white/10">
                  <Scale size={27} strokeWidth={2.7} />
                </div>
                <p className="text-xs font-black uppercase tracking-[0.16em] text-[#ffb36d]">Expectation</p>
                <h3 className="mt-2 text-xl font-black text-white">{item.expectation}</h3>
                <div className="my-5 h-px bg-white/10" />
                <p className="text-xs font-black uppercase tracking-[0.16em] text-[#ffb36d]">Reality</p>
                <p className="mt-2 text-sm font-semibold leading-7 text-white/74">{item.reality}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="italy-university-pathways" className="hidden bg-white/52 px-5 py-16 md:block">
        <div className="mx-auto max-w-[1450px]">
          <SectionHeader
            eyebrow="University Pathways"
            title="Turn Italy interest into real university routes."
            text="This connects the Italy guide directly into the University Finder and detail pages so students keep moving through the ecosystem."
          />

          <div className="mt-12 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {pathwayUniversities.map((goal) => (
              <div key={goal.title} className="rounded-[34px] bg-white/92 p-6 shadow-[0_22px_65px_rgba(9,31,80,0.08)] ring-1 ring-orange-100">
                <div className="mb-5 flex items-center gap-3">
                  <div className="grid h-14 w-14 place-items-center rounded-2xl bg-[#fff1ea] text-[#ff4b12] ring-1 ring-orange-100">
                    <goal.icon size={27} strokeWidth={2.7} />
                  </div>
                  <h3 className="text-2xl font-black tracking-[-0.045em] text-[#071f50]">{goal.title}</h3>
                </div>

                <div className="space-y-3">
                  {goal.universities.map((university) => (
                    <Link
                      key={university.slug}
                      to={`/universities/${university.slug}`}
                      className="group flex items-start justify-between gap-3 rounded-2xl bg-[#fffaf5] p-4 ring-1 ring-orange-100 transition hover:bg-[#fff1ea]"
                    >
                      <div>
                        <p className="text-sm font-black text-[#071f50]">{university.name}</p>
                        <p className="mt-1 text-xs font-bold text-[#61708a]">{university.city} • {university.popularFor}</p>
                      </div>
                      <ArrowRight className="shrink-0 text-[#ff4b12] transition group-hover:translate-x-1" size={17} strokeWidth={3} />
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="italy-visa-roadmap" className="bg-[#fff1ea] px-4 py-9 sm:px-5 md:py-16">
        <div className="mx-auto max-w-[1150px]">
          <SectionHeader eyebrow="Visa Roadmap" title="A clear visa file starts before the appointment." text="The exact process depends on your profile and the official procedure for your country, but this is the high-level student journey." />
          <div className="mt-12 overflow-hidden rounded-[34px] bg-white shadow-[0_24px_70px_rgba(9,31,80,0.08)] ring-1 ring-orange-100">
            {visaSteps.map((step, index) => (
              <div key={step} className="flex gap-5 border-b border-orange-100 p-5 last:border-b-0 md:p-6">
                <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[#ff4b12] text-sm font-black text-white">{index + 1}</div>
                <div>
                  <h3 className="text-lg font-black text-[#071f50]">{step}</h3>
                  <p className="mt-1 text-sm font-semibold leading-6 text-[#61708a]">Zaifan can help you organize this stage into a practical checklist.</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="italy-faqs" className="px-4 py-9 sm:px-5 md:py-16">
        <div className="mx-auto max-w-[1050px]">
          <SectionHeader eyebrow="FAQs" title="Common Italy questions students ask first." />
          <div className="mt-7 space-y-2.5 md:mt-12 md:space-y-3">
            {faqs.map((faq, index) => {
              const isOpen = openFaq === index;
              return (
                <div key={faq.q} className="overflow-hidden rounded-[24px] bg-white shadow-[0_16px_42px_rgba(9,31,80,0.06)] ring-1 ring-orange-100">
                  <button type="button" onClick={() => setOpenFaq(isOpen ? -1 : index)} className="flex w-full items-center justify-between gap-4 px-5 py-5 text-left font-black text-[#071f50] md:px-6">
                    <span className="flex items-center gap-3"><CircleHelp className="text-[#ff4b12]" size={21} />{faq.q}</span>
                    <ChevronDown className={`shrink-0 text-[#ff4b12] transition ${isOpen ? "rotate-180" : ""}`} />
                  </button>
                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.22 }} className="overflow-hidden">
                        <p className="px-5 pb-5 text-sm font-semibold leading-7 text-[#61708a] md:px-6">{faq.a}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="px-5 pb-24">
        <div className="relative mx-auto max-w-[1200px] overflow-hidden rounded-[42px] bg-[#071f50] p-6 text-white shadow-[0_35px_100px_rgba(9,31,80,0.22)] md:p-10">
          <div className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full border-[48px] border-white/5" />
          <div className="pointer-events-none absolute -bottom-28 left-1/3 h-64 w-64 rounded-full bg-[#ff4b12]/18 blur-3xl" />
          <div className="grid gap-7 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-[#ffb36d]">Start with Italy</p>
              <h2 className="mt-3 text-3xl font-black tracking-[-0.045em] text-white md:text-5xl">Want to know if Italy fits your profile?</h2>
              <p className="mt-4 max-w-3xl text-base font-semibold leading-8 text-white/76">
                You have now seen the full Italy journey—universities, cities, costs, scholarships, student life and visa planning. Book a consultation and we’ll turn that information into a route built around your own profile.
              </p>
            </div>
            <a href="/appointment?country=Italy" className="inline-flex items-center justify-center gap-3 rounded-full bg-[#ff4b12] px-9 py-5 font-black text-white shadow-[0_20px_44px_rgba(255,75,18,0.3)] transition hover:-translate-y-1 hover:bg-[#ff642f]">
              Get Italy Guidance
              <ArrowRight size={22} strokeWidth={3} />
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}

export default ItalyGuide;
