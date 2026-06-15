import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
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
  Star,
  Trophy,
  UsersRound,
} from "lucide-react";

import { italianUniversities } from "../data/italianUniversities";

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
    label: "Tuition",
    value: "Often lower than many popular destinations",
    text: "Exact tuition depends on university, course, degree level and student profile.",
  },
  {
    label: "Living Costs",
    value: "City dependent",
    text: "Milan and Rome are usually more expensive; smaller student cities can feel easier to manage.",
  },
  {
    label: "Scholarship Impact",
    value: "Can reduce pressure",
    text: "Regional scholarships may support eligible students, but deadlines and documents matter a lot.",
  },
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

const cityCards = [
  {
    city: "Milan",
    slug: "milan",
    vibe: "Business, fashion, design, technology",
    icon: Building2,
    status: "Live City Guide",
  },
  {
    city: "Rome",
    slug: "rome",
    vibe: "History, culture, international student life",
    icon: Landmark,
    status: "Live City Guide",
  },
  {
    city: "Bologna",
    slug: "bologna",
    vibe: "Classic student city with strong academic identity",
    icon: GraduationCap,
    status: "Live City Guide",
  },
  {
    city: "Padua",
    slug: "padua",
    vibe: "Historic, student-friendly and education focused",
    icon: BookOpenCheck,
    status: "Live City Guide",
  },
  {
    city: "Florence",
    slug: "florence",
    vibe: "Arts, architecture, culture and Tuscany lifestyle",
    icon: Landmark,
    status: "Live City Guide",
  },
  {
    city: "Turin",
    slug: "turin",
    vibe: "Engineering, automotive, business and value",
    icon: Building2,
    status: "Live City Guide",
  },
  {
    city: "Pisa",
    slug: "pisa",
    vibe: "Science, research and focused student life",
    icon: BookOpenCheck,
    status: "Live City Guide",
  },
  {
    city: "Venice",
    slug: "venice",
    vibe: "Languages, business, tourism and culture",
    icon: Landmark,
    status: "Live City Guide",
  },
];

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
  { icon: Coffee, title: "Daily Life", text: "Cafes, piazzas, local markets and city walking culture." },
  { icon: Utensils, title: "Food", text: "Pasta, pizza, regional dishes and affordable student meals." },
  { icon: Train, title: "Transport", text: "Public transport and trains help students move between cities." },
  { icon: Home, title: "Housing", text: "Options can include dorms, shared apartments and private rentals." },
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
  { goal: "Engineering", city: "Turin", slug: "turin", reason: "Politecnico di Torino, automotive links and strong northern Italy value." },
  { goal: "Business", city: "Milan", slug: "milan", reason: "Finance, consulting, fashion, management and international exposure." },
  { goal: "Medicine", city: "Rome", slug: "rome", reason: "Sapienza and major public university routes in a capital-city ecosystem." },
  { goal: "Research", city: "Padua", slug: "padua", reason: "Strong research identity, scholarship-friendly positioning and student focus." },
  { goal: "Student Life", city: "Bologna", slug: "bologna", reason: "Classic student-city atmosphere with deep academic identity." },
  { goal: "Arts & Architecture", city: "Florence", slug: "florence", reason: "Culture, architecture, museums, heritage and creative pathways." },
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

function SectionHeader({ eyebrow, title, text }) {
  return (
    <div className="mx-auto max-w-4xl text-center">
      <Badge>{eyebrow}</Badge>
      <h2 className="mt-5 text-4xl font-black leading-[0.98] tracking-[-0.055em] text-[#071f50] md:text-6xl">
        {title}
      </h2>
      {text && <p className="mx-auto mt-5 max-w-3xl text-base font-semibold leading-8 text-[#5f6f89] md:text-lg">{text}</p>}
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
  const [openFaq, setOpenFaq] = useState(0);

  const toc = useMemo(() => tableOfContents, []);

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

  const scrollToId = (id) => {
    const target = document.getElementById(id);
    if (!target) return;
    const y = target.getBoundingClientRect().top + window.scrollY - 95;
    window.scrollTo({ top: y, behavior: "smooth" });
  };

  return (
    <main className="overflow-hidden bg-[#fff7ed] text-[#071f50]">
      <section className="relative px-5 pb-20 pt-32 md:pt-36">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_16%_22%,rgba(255,75,18,0.16),transparent_30%),radial-gradient(circle_at_84%_12%,rgba(255,178,89,0.18),transparent_26%)]" />
        <div className="pointer-events-none absolute -left-28 top-16 h-96 w-96 rounded-full bg-orange-300/20 blur-3xl" />
        <div className="pointer-events-none absolute -right-28 top-32 h-96 w-96 rounded-full bg-[#ff4b12]/10 blur-3xl" />

        <div className="relative mx-auto grid max-w-[1450px] items-center gap-10 lg:grid-cols-[1.05fr_0.95fr]">
          <motion.div initial="hidden" animate="show" variants={fadeUp}>
            <Badge>Italy Destination Guide</Badge>
            <h1 className="mt-6 max-w-4xl text-5xl font-black leading-[0.9] tracking-[-0.07em] text-[#071f50] md:text-7xl xl:text-[88px]">
              Study in <span className="text-[#ff4b12]">Italy</span> with a clear plan.
            </h1>
            <p className="mt-7 max-w-3xl text-lg font-semibold leading-9 text-[#526178]">
              This is Zaifan’s Italy-first guide for students who want affordable European education, scholarship planning, university shortlisting and a step-by-step route from research to consultation.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a
                href="/appointment?country=Italy"
                className="inline-flex items-center justify-center gap-3 rounded-full bg-[#ff4b12] px-8 py-5 text-base font-black text-white shadow-[0_20px_44px_rgba(255,75,18,0.3)] transition hover:-translate-y-1 hover:bg-[#ff642f] focus:outline-none focus:ring-4 focus:ring-[#ff4b12]/20"
              >
                Book Italy Consultation
                <ArrowRight size={21} strokeWidth={3} />
              </a>
              <button
                type="button"
                onClick={() => scrollToId("italy-dsu-scholarship")}
                className="inline-flex items-center justify-center gap-3 rounded-full bg-white px-8 py-5 text-base font-black text-[#ff4b12] shadow-[0_14px_32px_rgba(255,75,18,0.1)] ring-1 ring-orange-100 transition hover:-translate-y-1 hover:bg-[#fff1ea] focus:outline-none focus:ring-4 focus:ring-[#ff4b12]/20"
              >
                Understand DSU
              </button>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 32, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.08 }}
            className="relative"
          >
            <div className="absolute -left-6 -top-6 h-24 w-24 rounded-full bg-[#ff4b12]/15 blur-2xl" />
            <div className="relative overflow-hidden rounded-[42px] bg-white p-6 shadow-[0_35px_100px_rgba(9,31,80,0.12)] ring-1 ring-orange-100">
              <div className="rounded-[34px] bg-[radial-gradient(circle_at_18%_20%,rgba(255,75,18,0.18),transparent_28%),linear-gradient(135deg,#fffaf5,#ffffff)] p-6 md:p-8">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.18em] text-[#ff4b12]">Live Destination</p>
                    <h2 className="mt-2 text-4xl font-black tracking-[-0.055em] text-[#071f50]">Italy</h2>
                  </div>
                  <div className="grid h-20 w-20 place-items-center rounded-[26px] bg-white text-5xl shadow-inner ring-1 ring-orange-100">🇮🇹</div>
                </div>

                <div className="mt-7 grid gap-4 sm:grid-cols-2">
                  {italyHighlights.map((item) => (
                    <div key={item.title} className="rounded-[24px] bg-white/88 p-4 shadow-sm ring-1 ring-orange-100">
                      <div className="flex items-center gap-3">
                        <div className="grid h-11 w-11 place-items-center rounded-2xl bg-[#fff1ea] text-[#ff4b12]">
                          <item.icon size={22} strokeWidth={2.7} />
                        </div>
                        <h3 className="text-sm font-black leading-tight text-[#071f50]">{item.title}</h3>
                      </div>
                      <p className="mt-3 text-xs font-semibold leading-6 text-[#61708a]">{item.text}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-7 rounded-[26px] bg-[#071f50] p-5 text-white">
                  <div className="flex items-start gap-4">
                    <ShieldCheck className="mt-1 text-[#ffb36d]" size={28} />
                    <div>
                      <h3 className="text-xl font-black tracking-[-0.035em]">Honest Italy-first guidance</h3>
                      <p className="mt-2 text-sm font-semibold leading-7 text-white/76">
                        No fake country database. No fake promises. Italy is the focus, and this page will grow into Zaifan’s complete student guide.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="px-5 pb-10">
        <div className="mx-auto max-w-[1250px] rounded-[34px] bg-white/86 p-5 shadow-[0_24px_70px_rgba(9,31,80,0.08)] ring-1 ring-orange-100 md:p-7">
          <div className="mb-4 flex items-center gap-2 text-sm font-black uppercase tracking-[0.16em] text-[#ff4b12]">
            <Route size={18} strokeWidth={3} />
            Table of Contents
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {toc.map((item) => {
              const id = `italy-${item.toLowerCase().replace(/\s+/g, "-")}`;
              return (
                <button
                  key={item}
                  type="button"
                  onClick={() => scrollToId(id)}
                  className="flex items-center gap-3 rounded-2xl bg-[#fffaf5] px-4 py-4 text-left text-sm font-black text-[#071f50] ring-1 ring-orange-100 transition hover:-translate-y-0.5 hover:bg-[#fff1ea] hover:text-[#ff4b12]"
                >
                  <CheckCircle2 size={18} className="text-[#ff4b12]" strokeWidth={3} />
                  {item}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      <section id="italy-why-italy" className="px-5 py-20">
        <div className="mx-auto max-w-[1350px]">
          <SectionHeader
            eyebrow="Why Italy"
            title="A European study route with culture, value and opportunity."
            text="Italy is not just a destination card. It needs a real guide because students must understand universities, cities, documents, costs, scholarships and lifestyle before choosing it."
          />
          <motion.div initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.18 }} className="mt-12 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {italyHighlights.map((item) => <InfoCard key={item.title} {...item} />)}
          </motion.div>
        </div>
      </section>

      <section id="italy-study-pathway" className="bg-white/52 px-5 py-20">
        <div className="mx-auto max-w-[1350px]">
          <SectionHeader eyebrow="Study Pathway" title="From interest to application — one step at a time." />
          <div className="mt-12 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {pathwaySteps.map((step, index) => (
              <div key={step.title} className="rounded-[30px] bg-white p-6 shadow-[0_20px_55px_rgba(9,31,80,0.07)] ring-1 ring-orange-100">
                <div className="mb-5 flex items-center justify-between">
                  <div className="grid h-14 w-14 place-items-center rounded-2xl bg-[#fff1ea] text-[#ff4b12]">
                    <step.icon size={27} strokeWidth={2.7} />
                  </div>
                  <span className="text-4xl font-black tracking-[-0.06em] text-orange-100">0{index + 1}</span>
                </div>
                <h3 className="text-xl font-black tracking-[-0.035em] text-[#071f50]">{step.title}</h3>
                <p className="mt-3 text-sm font-semibold leading-7 text-[#61708a]">{step.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="italy-costs" className="px-5 py-20">
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

      <section id="italy-comparison-center" className="bg-white/52 px-5 py-20">
        <div className="mx-auto max-w-[1450px]">
          <SectionHeader
            eyebrow="Comparison Center"
            title="Compare Italy's top student cities before choosing."
            text="This is where the Italy guide becomes useful: city, cost, scholarship region, program strength and lifestyle should be compared together before a student falls in love with one destination."
          />

          <div className="mt-12 overflow-hidden rounded-[34px] bg-white shadow-[0_24px_70px_rgba(9,31,80,0.08)] ring-1 ring-orange-100">
            <div className="hidden grid-cols-[0.75fr_0.65fr_1fr_1.15fr_1.05fr_0.75fr] bg-[#071f50] px-5 py-4 text-xs font-black uppercase tracking-[0.14em] text-white lg:grid">
              <div>City</div>
              <div>Cost</div>
              <div>Scholarship</div>
              <div>Best For</div>
              <div>Student Vibe</div>
              <div>Difficulty</div>
            </div>

            <div className="divide-y divide-orange-100">
              {comparisonRows.map((row) => (
                <Link
                  key={row.city}
                  to={`/countries/italy/${row.slug}`}
                  className="grid gap-3 px-5 py-5 transition hover:bg-[#fff7ed] lg:grid-cols-[0.75fr_0.65fr_1fr_1.15fr_1.05fr_0.75fr] lg:items-center"
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

      <section id="italy-dsu-scholarship" className="bg-[#071f50] px-5 py-20 text-white">
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

      <section id="italy-universities" className="px-5 py-20">
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

      <section id="italy-scholarship-map" className="bg-[#071f50] px-5 py-20 text-white">
        <div className="mx-auto max-w-[1350px]">
          <SectionHeader
            eyebrow="Scholarship Map"
            title="Funding route depends on the region, not just the university."
            text="Italy scholarship planning becomes much clearer when students understand which regional body connects to which city and university cluster."
          />

          <div className="mt-12 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
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

      <section id="italy-scholarships" className="bg-[#fff1ea] px-5 py-20">
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

      <section id="italy-cities" className="bg-white/52 px-5 py-20">
        <div className="mx-auto max-w-[1350px]">
          <SectionHeader eyebrow="Cities" title="The city matters almost as much as the university." />
          <div className="mt-12 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {cityCards.map((city) => (
              <Link
                key={city.city}
                to={`/countries/italy/${city.slug}`}
                className="group rounded-[30px] bg-white p-6 shadow-[0_20px_55px_rgba(9,31,80,0.07)] ring-1 ring-orange-100 transition duration-300 hover:-translate-y-1 hover:shadow-[0_28px_70px_rgba(255,75,18,0.13)]"
              >
                <div className="mb-5 grid h-14 w-14 place-items-center rounded-2xl bg-[#fff1ea] text-[#ff4b12]">
                  <city.icon size={27} />
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

      <section id="italy-student-life" className="px-5 py-20">
        <div className="mx-auto max-w-[1350px]">
          <SectionHeader eyebrow="Student Life" title="Italy is not only study. It is lifestyle, culture and adjustment." />
          <div className="mt-12 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {lifeItems.map((item) => <InfoCard key={item.title} {...item} />)}
          </div>
        </div>
      </section>

      <section id="italy-decision-framework" className="bg-white/52 px-5 py-20">
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

      <section id="italy-city-goals" className="px-5 py-20">
        <div className="mx-auto max-w-[1350px]">
          <SectionHeader
            eyebrow="Best Cities By Goal"
            title="Choose your Italian city by purpose, not by random popularity."
            text="Every city has a different personality. This helps students move from vague interest to a smarter shortlist."
          />

          <div className="mt-12 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {cityGoals.map((item) => (
              <Link
                key={item.goal}
                to={`/countries/italy/${item.slug}`}
                className="group rounded-[32px] bg-white/90 p-6 shadow-[0_20px_55px_rgba(9,31,80,0.07)] ring-1 ring-orange-100 transition duration-300 hover:-translate-y-1 hover:shadow-[0_28px_70px_rgba(255,75,18,0.13)]"
              >
                <div className="mb-5 flex items-start justify-between gap-3">
                  <div className="grid h-14 w-14 place-items-center rounded-2xl bg-[#fff1ea] text-[#ff4b12] ring-1 ring-orange-100">
                    <MapPinned size={27} strokeWidth={2.7} />
                  </div>
                  <ArrowRight className="text-[#ff4b12] transition group-hover:translate-x-1" size={20} strokeWidth={3} />
                </div>
                <p className="text-xs font-black uppercase tracking-[0.16em] text-[#ff4b12]">Best for {item.goal}</p>
                <h3 className="mt-2 text-3xl font-black tracking-[-0.05em] text-[#071f50]">{item.city}</h3>
                <p className="mt-3 text-sm font-semibold leading-7 text-[#61708a]">{item.reason}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section id="italy-reality-check" className="bg-[#071f50] px-5 py-20 text-white">
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

      <section id="italy-university-pathways" className="bg-white/52 px-5 py-20">
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

      <section id="italy-visa-roadmap" className="bg-[#fff1ea] px-5 py-20">
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

      <section id="italy-faqs" className="px-5 py-20">
        <div className="mx-auto max-w-[1050px]">
          <SectionHeader eyebrow="FAQs" title="Common Italy questions students ask first." />
          <div className="mt-12 space-y-3">
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
        <div className="mx-auto max-w-[1200px] overflow-hidden rounded-[38px] bg-[#071f50] p-6 text-white shadow-[0_30px_90px_rgba(9,31,80,0.18)] md:p-9">
          <div className="grid gap-7 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-[#ffb36d]">Start with Italy</p>
              <h2 className="mt-3 text-3xl font-black tracking-[-0.045em] text-white md:text-5xl">Want to know if Italy fits your profile?</h2>
              <p className="mt-4 max-w-3xl text-base font-semibold leading-8 text-white/76">Book a consultation and we’ll help you understand course fit, university direction, scholarship planning and next steps.</p>
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
