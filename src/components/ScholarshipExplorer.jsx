import React, { useMemo, useState } from "react";
import {
  ArrowRight,
  BadgePercent,
  Calculator,
  CheckCircle2,
  ChevronDown,
  CircleHelp,
  ClipboardCheck,
  FileCheck2,
  Globe2,
  Info,
  Landmark,
  LockKeyhole,
  MapPin,
  PiggyBank,
  Route,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  Trophy,
  Clock3,
  AlertTriangle,
  BookOpenCheck,
  Building2,
  GraduationCap,
  WalletCards,
  Target,
  Lightbulb,
  ArrowUpRight,
  Compass,
  Layers3,
  TrendingUp,
  CalendarDays,
  HeartHandshake,
} from "lucide-react";

const scholarshipTypes = [
  {
    title: "Government & Regional Support",
    text: "Italy funding is often connected to regions, public systems and student welfare routes.",
    icon: Landmark,
    items: ["DSU", "Regional grants", "Student services"],
  },
  {
    title: "University Scholarships",
    text: "Some universities offer fee reductions, merit awards or course-specific funding.",
    icon: Building2,
    items: ["Tuition discounts", "Department awards", "Profile-based support"],
  },
  {
    title: "Need-Based Routes",
    text: "Strong for students who need affordability planning and can prepare family documents early.",
    icon: PiggyBank,
    items: ["Income documents", "Family records", "Regional ranking"],
  },
  {
    title: "Merit & Profile Awards",
    text: "Useful for students with strong grades, strong course fit or competitive academic profiles.",
    icon: Trophy,
    items: ["High grades", "Strong profile", "Competitive awards"],
  },
];

const scholarshipRoutes = [
  {
    tag: "Most Popular",
    title: "DSU Scholarship",
    short: "Best first check",
    icon: PiggyBank,
    accent: "from-orange-500 to-amber-500",
    soft: "bg-orange-50 text-orange-600",
    text: "A major Italy affordability route for many international students. It can support eligible students through regional benefits, but it depends on documents, deadlines and ranking.",
    benefits: [
      "Tuition pressure reduction",
      "Possible accommodation support",
      "Possible meal support",
      "Need-based regional route",
    ],
    warning: "Not guaranteed. Eligibility and ranking depend on regional rules.",
  },
  {
    tag: "Region Specific",
    title: "Regional Grants",
    short: "City-based support",
    icon: MapPin,
    accent: "from-emerald-500 to-teal-500",
    soft: "bg-emerald-50 text-emerald-600",
    text: "Different Italian regions can have their own student support systems. The university city matters because funding rules and application portals may change by region.",
    benefits: [
      "Local student support",
      "Regional assistance",
      "City-specific benefits",
      "Public university focused",
    ],
    warning: "Rules change by region, so the correct region must be checked early.",
  },
  {
    tag: "University Awards",
    title: "University Scholarships",
    short: "University-based",
    icon: Landmark,
    accent: "from-blue-500 to-sky-500",
    soft: "bg-blue-50 text-blue-600",
    text: "Some universities offer their own scholarships, fee reductions or awards for selected courses and strong profiles.",
    benefits: [
      "Tuition discounts",
      "University awards",
      "Department support",
      "Course-based funding",
    ],
    warning: "Usually competitive and can depend on course, grades and deadlines.",
  },
  {
    tag: "Top Profiles",
    title: "Merit Scholarships",
    short: "Competitive awards",
    icon: Trophy,
    accent: "from-purple-500 to-fuchsia-500",
    soft: "bg-purple-50 text-purple-600",
    text: "Merit-based awards are usually for strong academic profiles, excellent grades or competitive admissions.",
    benefits: [
      "Strong academic route",
      "Profile-based awards",
      "Competitive funding",
      "Recognition for top students",
    ],
    warning: "Best for strong profiles; not every student will qualify.",
  },
];

const futureScholarshipCountries = [
  {
    flag: "🇩🇪",
    country: "Germany",
    status: "Coming Soon",
    focus: "Public universities, DAAD-style funding, low tuition routes",
    note: "Germany scholarship guides will be added after Italy data is fully polished.",
  },
  {
    flag: "🇬🇧",
    country: "United Kingdom",
    status: "Coming Soon",
    focus: "Merit awards, university discounts, postgraduate funding",
    note: "UK scholarship planning will be built when verified university routes are ready.",
  },
  {
    flag: "🇨🇦",
    country: "Canada",
    status: "Coming Soon",
    focus: "Entrance awards, college funding, province-based options",
    note: "Canada scholarship support will come with a dedicated college/university database.",
  },
  {
    flag: "🇦🇺",
    country: "Australia",
    status: "Coming Soon",
    focus: "University grants, regional study support, merit discounts",
    note: "Australia funding routes will be added after the Italy ecosystem is stable.",
  },
  {
    flag: "🇹🇷",
    country: "Turkey",
    status: "Coming Soon",
    focus: "Affordable universities, institutional awards, future partner routes",
    note: "Turkey remains on the roadmap for future affordability-focused guidance.",
  },
];

const scholarshipComparison = [
  {
    route: "DSU Scholarship",
    country: "Italy",
    support: "High",
    accommodation: "Possible",
    meals: "Possible",
    difficulty: "Medium",
    bestFor: "Need-based regional support",
  },
  {
    route: "Regional Grants",
    country: "Italy",
    support: "Medium / High",
    accommodation: "Sometimes",
    meals: "Sometimes",
    difficulty: "Medium",
    bestFor: "Students choosing public universities by region",
  },
  {
    route: "University Scholarships",
    country: "Italy",
    support: "Medium",
    accommodation: "Usually No",
    meals: "Usually No",
    difficulty: "Medium / High",
    bestFor: "Strong course and university-specific profiles",
  },
  {
    route: "Merit Scholarships",
    country: "Italy",
    support: "Medium / High",
    accommodation: "Usually No",
    meals: "Usually No",
    difficulty: "High",
    bestFor: "High-performing students with strong academics",
  },
];

const cityFundingRoutes = [
  {
    city: "Milan",
    region: "Lombardy",
    funding: "DSU Lombardia",
    link: "/countries/italy/milan",
    vibe: "Strong universities, higher living costs, excellent opportunity city.",
  },
  {
    city: "Rome",
    region: "Lazio",
    funding: "LazioDisco",
    link: "/countries/italy/rome",
    vibe: "Capital city, large universities, broad student life.",
  },
  {
    city: "Bologna",
    region: "Emilia-Romagna",
    funding: "ER.GO",
    link: "/countries/italy/bologna",
    vibe: "Historic student city with strong public university routes.",
  },
  {
    city: "Padua",
    region: "Veneto",
    funding: "DSU / regional support",
    link: "/countries/italy/padua",
    vibe: "Scholarship-friendly planning route with respected universities.",
  },
  {
    city: "Florence / Pisa",
    region: "Tuscany",
    funding: "DSU Toscana",
    link: "/countries/italy/florence",
    vibe: "Strong academic cities with culture and student communities.",
  },
  {
    city: "Turin",
    region: "Piedmont",
    funding: "EDISU Piemonte",
    link: "/countries/italy/turin",
    vibe: "Technical, business and budget-friendly north Italy route.",
  },
];

const documentGroups = [
  {
    title: "Identity",
    icon: ShieldCheck,
    items: ["Passport", "Personal details", "Application account"],
  },
  {
    title: "Academic",
    icon: GraduationCap,
    items: ["Transcripts", "Certificates", "Admission / pre-enrolment proof"],
  },
  {
    title: "Family & Income",
    icon: WalletCards,
    items: ["Income documents", "Family composition", "Property / asset records"],
  },
  {
    title: "Processing",
    icon: FileCheck2,
    items: ["Translations", "Legalization planning", "Deadline calendar"],
  },
];

const documentChecklist = [
  "Passport",
  "Academic transcripts",
  "Family income documents",
  "Family composition certificate",
  "Property / asset documents where required",
  "Bank or financial documents where required",
  "Translations and legalization planning",
  "University admission / pre-enrolment proof",
  "Regional application account",
  "Deadline tracking calendar",
];

const timelineSteps = [
  {
    title: "Explore",
    text: "Understand country, city, university, course and scholarship route together.",
  },
  {
    title: "Choose",
    text: "Shortlist universities by region, cost, funding route and student fit.",
  },
  {
    title: "Prepare",
    text: "Start income, family, academic and translation documents early.",
  },
  {
    title: "Apply",
    text: "Submit university and scholarship applications before deadlines.",
  },
  {
    title: "Arrive",
    text: "Track regional steps, accommodation, meals and local student support.",
  },
];

const readinessCards = [
  {
    title: "Ready",
    text: "You already have academic records, passport and family financial information prepared.",
    icon: CheckCircle2,
    tone: "bg-green-50 text-green-700 ring-green-100",
  },
  {
    title: "Almost Ready",
    text: "You have the main documents but still need translations, legalization or missing records.",
    icon: ClipboardCheck,
    tone: "bg-orange-50 text-orange-700 ring-orange-100",
  },
  {
    title: "Need Guidance",
    text: "You are unsure which documents matter for your region, course or university choice.",
    icon: CircleHelp,
    tone: "bg-blue-50 text-blue-700 ring-blue-100",
  },
];

const mistakes = [
  {
    title: "Waiting too long",
    text: "Scholarship documents can take time. Starting late can destroy an otherwise strong plan.",
  },
  {
    title: "Choosing city blindly",
    text: "In Italy, region matters. The city can affect the scholarship route and support system.",
  },
  {
    title: "Thinking DSU is guaranteed",
    text: "DSU is valuable, but it depends on eligibility, ranking, rules and deadlines.",
  },
  {
    title: "Ignoring backup budget",
    text: "Students should always plan a safe budget instead of depending on one outcome.",
  },
];

const pathwayCards = [
  {
    title: "Computer Science Route",
    path: "Italy → City → University → DSU / merit check → Consultation",
    links: [
      ["Explore Italy", "/countries/italy"],
      ["Find Universities", "/universities"],
    ],
  },
  {
    title: "Business Route",
    path: "Italy → Affordable city → Public university → Regional support → Consultation",
    links: [
      ["Explore Cities", "/countries/italy"],
      ["Book Planning", "/appointment?country=Italy&service=Scholarship Guidance"],
    ],
  },
  {
    title: "Engineering Route",
    path: "Italy → Technical city → University fit → Funding comparison → Consultation",
    links: [
      ["University Finder", "/universities"],
      ["Compare Options", "/appointment?country=Italy&service=Scholarship Comparison"],
    ],
  },
];

const programs = [
  "Business",
  "Engineering",
  "Computer Science",
  "Medicine",
  "Architecture",
  "Design",
];

const levels = ["Bachelor", "Master", "Foundation"];
const budgets = ["Under €3,000", "€3,000 - €6,000", "€6,000+"];
const nationalities = ["Pakistan", "International", "South Asia", "Other"];

const facts = [
  { icon: PiggyBank, value: "DSU", label: "Main Italy Route" },
  { icon: MapPin, value: "Region", label: "Rules Matter" },
  { icon: FileCheck2, value: "Early", label: "Documents Needed" },
  { icon: ShieldCheck, value: "No", label: "Fake Guarantees" },
];


const fundingDecisionCards = [
  {
    icon: Target,
    label: "Start With Fit",
    title: "University + region first",
    text: "Scholarship planning works best when the university, city, region and course are already connected.",
  },
  {
    icon: FileCheck2,
    label: "Documents Matter",
    title: "Preparation beats panic",
    text: "Family, income, property and legalization documents can take longer than students expect.",
  },
  {
    icon: WalletCards,
    label: "Budget Safety",
    title: "Never rely on one outcome",
    text: "A safe plan includes a scholarship strategy and a realistic backup budget.",
  },
  {
    icon: CalendarDays,
    label: "Timing Wins",
    title: "Deadlines can decide everything",
    text: "Strong students still lose opportunities when documents and regional applications start too late.",
  },
];

const scholarshipJourneySignals = [
  { icon: Compass, title: "Discover", text: "Country, city and university fit" },
  { icon: Layers3, title: "Match", text: "Regional + university funding" },
  { icon: FileCheck2, title: "Prepare", text: "Documents and deadlines" },
  { icon: TrendingUp, title: "Decide", text: "Compare support vs backup budget" },
];

const faqs = [
  {
    q: "Is DSU guaranteed?",
    a: "No. DSU and regional scholarships depend on eligibility, documents, deadlines, regional rules and ranking. Students should plan early and avoid treating any scholarship as guaranteed.",
  },
  {
    q: "Can Pakistani students apply for DSU?",
    a: "Many international students explore DSU-style regional support in Italy, but the exact process depends on the university, region, documents and current rules.",
  },
  {
    q: "What documents are usually important?",
    a: "Common planning documents include passport, academic records, family income documents, family composition certificate, property or asset documents where required, translations and legalization planning.",
  },
  {
    q: "Should I choose university first or scholarship first?",
    a: "Both should be checked together. In Italy, the city and region can affect the funding route, so university choice and scholarship planning should not be separate decisions.",
  },
  {
    q: "Can scholarship cover all costs?",
    a: "Some students may receive meaningful support, but students should never build their entire plan on a guaranteed full scholarship. Budget planning should include backup options.",
  },
];

function getRecommendation(profile) {
  const recommendations = ["DSU Scholarship", "Regional Student Support"];

  if (profile.level === "Master" || profile.budget === "Under €3,000") {
    recommendations.push("University Merit Award");
  }

  if (["Engineering", "Computer Science", "Medicine"].includes(profile.program)) {
    recommendations.push("Program-Based Scholarship Check");
  }

  return recommendations.slice(0, 4);
}

export default function ScholarshipExplorer() {
  const [profile, setProfile] = useState({
    nationality: "Pakistan",
    level: "Bachelor",
    program: "Business",
    budget: "Under €3,000",
  });

  const [tuition, setTuition] = useState(3000);
  const [living, setLiving] = useState(6500);
  const [activeRoute, setActiveRoute] = useState("DSU Scholarship");
  const [openFaq, setOpenFaq] = useState(0);

  const selectedRoute =
    scholarshipRoutes.find((route) => route.title === activeRoute) ||
    scholarshipRoutes[0];

  const recommendations = useMemo(() => getRecommendation(profile), [profile]);

  const scholarshipImpact = useMemo(() => {
    const tuitionAfter = Math.max(600, Math.round(tuition * 0.35));
    const livingAfter = Math.max(2800, Math.round(living * 0.52));
    const before = tuition + living;
    const after = tuitionAfter + livingAfter;

    return {
      before,
      after,
      saved: before - after,
      tuitionAfter,
      livingAfter,
    };
  }, [tuition, living]);

  const updateProfile = (key, value) => {
    setProfile((current) => ({ ...current, [key]: value }));
  };

  const scrollToId = (id) => {
    const target = document.getElementById(id);
    if (!target) return;

    const y = target.getBoundingClientRect().top + window.scrollY - 95;
    window.scrollTo({ top: y, behavior: "smooth" });
  };

  return (
    <section
      id="scholarships"
      className="relative overflow-hidden bg-[#fff7ed] py-16 text-[#071f50] sm:py-20 lg:py-24"
    >
      <style>{`
        @keyframes scholarshipFloat {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-10px) rotate(2deg); }
        }

        @keyframes scholarshipShine {
          0% { transform: translateX(-120%); }
          100% { transform: translateX(140%); }
        }

        .scholarship-float { animation: scholarshipFloat 6s ease-in-out infinite; }
        .scholarship-shine { animation: scholarshipShine 5.5s ease-in-out infinite; }

        @media (prefers-reduced-motion: reduce) {
          .scholarship-float,
          .scholarship-shine {
            animation: none !important;
          }
        }
      `}</style>

      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_12%,rgba(255,126,37,0.16),transparent_28%),radial-gradient(circle_at_85%_20%,rgba(255,185,95,0.16),transparent_24%),linear-gradient(180deg,rgba(255,255,255,0.65),rgba(255,247,237,0))]" />
      <div className="pointer-events-none absolute left-[-120px] top-28 h-[360px] w-[360px] rounded-full bg-orange-300/20 blur-3xl" />
      <div className="pointer-events-none absolute right-[-110px] bottom-20 h-[320px] w-[320px] rounded-full bg-amber-300/20 blur-3xl" />

      <div className="relative mx-auto max-w-[1500px] px-4 sm:px-6 lg:px-10">
        <div className="grid gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-orange-100 bg-white/90 px-5 py-2 text-xs font-black uppercase tracking-[0.18em] text-orange-600 shadow-sm">
              <Sparkles className="h-4 w-4 fill-orange-500" />
              Italy Scholarship Intelligence
            </div>

            <h2 className="mt-6 max-w-5xl text-5xl font-black leading-[0.94] tracking-[-0.06em] sm:text-6xl lg:text-7xl">
              Build your funding plan
              <span className="text-orange-600"> before the deadline builds pressure.</span>
            </h2>

            <p className="mt-6 max-w-3xl text-base font-semibold leading-8 text-slate-700 md:text-lg">
              DSU, regional support, university awards and merit scholarships only make sense when they are connected to the right university, city, documents and timeline.
            </p>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <a
                href="/appointment?country=Italy&service=Scholarship Guidance"
                className="inline-flex items-center justify-center gap-3 rounded-full bg-orange-600 px-8 py-5 text-base font-black text-white shadow-[0_20px_44px_rgba(255,91,18,0.28)] transition hover:-translate-y-1 hover:bg-orange-700"
              >
                Build My Scholarship Plan
                <ArrowRight className="h-5 w-5" />
              </a>

              <button
                type="button"
                onClick={() => scrollToId("scholarship-calculator")}
                className="inline-flex items-center justify-center gap-3 rounded-full bg-white px-8 py-5 text-base font-black text-[#071f50] ring-1 ring-orange-100 transition hover:-translate-y-1 hover:text-orange-600"
              >
                Check My Profile
                <ArrowRight className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {scholarshipJourneySignals.map((item, index) => (
                <div key={item.title} className="rounded-[1.5rem] bg-white/90 p-4 shadow-[0_14px_36px_rgba(15,23,42,0.055)] ring-1 ring-orange-100">
                  <div className="flex items-center justify-between">
                    <div className="grid h-10 w-10 place-items-center rounded-xl bg-orange-50 text-orange-600">
                      <item.icon className="h-5 w-5" />
                    </div>
                    <span className="text-xs font-black text-orange-200">0{index + 1}</span>
                  </div>
                  <p className="mt-3 text-sm font-black">{item.title}</p>
                  <p className="mt-1 text-[11px] font-semibold leading-5 text-slate-500">{item.text}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[2.6rem] bg-[#071f50] p-6 text-white shadow-[0_32px_90px_rgba(7,31,80,0.20)] sm:p-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-orange-300">
                  Funding Command Center
                </p>
                <h3 className="mt-3 text-4xl font-black leading-[0.98] tracking-[-0.05em]">
                  Start with the right route.
                </h3>
                <p className="mt-4 max-w-xl text-sm font-semibold leading-7 text-white/70">
                  Choose a funding route to understand what it supports, what it depends on and where students usually make mistakes.
                </p>
              </div>
              <div className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-white/10 text-3xl ring-1 ring-white/10">
                🎓
              </div>
            </div>

            <div className="mt-6 grid gap-3">
              {scholarshipRoutes.map((route) => (
                <button
                  key={route.title}
                  type="button"
                  onClick={() => setActiveRoute(route.title)}
                  className={`flex w-full items-center gap-4 rounded-2xl p-4 text-left ring-1 transition ${
                    activeRoute === route.title
                      ? "bg-white text-[#071f50] ring-white shadow-lg"
                      : "bg-white/8 text-white ring-white/10 hover:bg-white/12"
                  }`}
                >
                  <div
                    className={`grid h-12 w-12 shrink-0 place-items-center rounded-xl ${
                      activeRoute === route.title
                        ? "bg-orange-500 text-white"
                        : "bg-white/10 text-orange-300"
                    }`}
                  >
                    <route.icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-black">{route.title}</p>
                    <p
                      className={`mt-1 text-xs font-semibold ${
                        activeRoute === route.title
                          ? "text-slate-600"
                          : "text-white/65"
                      }`}
                    >
                      {route.short}
                    </p>
                  </div>
                  <ArrowUpRight className={`h-4 w-4 shrink-0 ${
                    activeRoute === route.title ? "text-orange-600" : "text-white/40"
                  }`} />
                </button>
              ))}
            </div>

            <div className="mt-5 rounded-[1.8rem] bg-white/10 p-5 ring-1 ring-white/10">
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-orange-300">
                Selected Route
              </p>
              <h4 className="mt-2 text-2xl font-black">{selectedRoute.title}</h4>
              <p className="mt-3 text-sm font-semibold leading-7 text-white/72">
                {selectedRoute.text}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {fundingDecisionCards.map((item, index) => (
            <article
              key={item.title}
              className={`rounded-[1.8rem] p-5 shadow-[0_16px_48px_rgba(15,23,42,0.06)] ${
                index === 0
                  ? "bg-orange-600 text-white"
                  : index === 1
                    ? "bg-[#071f50] text-white"
                    : "bg-white/92 text-[#071f50] ring-1 ring-orange-100"
              }`}
            >
              <div className={`grid h-12 w-12 place-items-center rounded-2xl ${
                index < 2 ? "bg-white/10 text-orange-200" : "bg-orange-50 text-orange-600"
              }`}>
                <item.icon className="h-6 w-6" />
              </div>
              <p className={`mt-5 text-[10px] font-black uppercase tracking-[0.16em] ${
                index < 2 ? "text-orange-200" : "text-orange-600"
              }`}>
                {item.label}
              </p>
              <h3 className="mt-2 text-xl font-black">{item.title}</h3>
              <p className={`mt-3 text-sm font-semibold leading-6 ${
                index < 2 ? "text-white/72" : "text-slate-600"
              }`}>
                {item.text}
              </p>
            </article>
          ))}
        </div>

        <div className="mt-7 flex flex-wrap justify-center gap-2 rounded-[1.6rem] bg-white/80 p-3 ring-1 ring-orange-100">
          {[
            ["Types", "scholarship-types"],
            ["DSU", "scholarship-dsu"],
            ["Documents", "scholarship-documents"],
            ["Regions", "scholarship-regions"],
            ["Compare", "scholarship-comparison"],
            ["Calculator", "scholarship-calculator"],
            ["FAQ", "scholarship-faq"],
          ].map(([label, id]) => (
            <button
              key={label}
              type="button"
              onClick={() => scrollToId(id)}
              className="rounded-full bg-white px-4 py-2 text-xs font-black text-orange-700 ring-1 ring-orange-100 transition hover:-translate-y-0.5 hover:bg-orange-50"
            >
              {label}
            </button>
          ))}
        </div>

        <section id="scholarship-types" className="mt-6">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {scholarshipTypes.map((type) => {
              const Icon = type.icon;

              return (
                <article
                  key={type.title}
                  className="rounded-[1.8rem] bg-white/92 p-5 shadow-[0_16px_48px_rgba(15,23,42,0.06)] ring-1 ring-orange-100 transition hover:-translate-y-1 hover:bg-white"
                >
                  <div className="grid h-13 w-13 place-items-center rounded-2xl bg-orange-50 text-orange-600">
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="mt-4 text-xl font-black">{type.title}</h3>
                  <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
                    {type.text}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {type.items.map((item) => (
                      <span
                        key={item}
                        className="rounded-full bg-[#fff7ed] px-3 py-1.5 text-[11px] font-black text-orange-700 ring-1 ring-orange-100"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <section id="scholarship-dsu" className="mt-6">
          <div className="grid gap-5 lg:grid-cols-[0.85fr_1.15fr]">
            <div className="rounded-[2rem] bg-white/92 p-6 shadow-[0_20px_65px_rgba(15,23,42,0.07)] ring-1 ring-orange-100">
              <div
                className={`mb-5 grid h-16 w-16 place-items-center rounded-2xl ${selectedRoute.soft} ring-1 ring-orange-100`}
              >
                <selectedRoute.icon className="h-8 w-8" />
              </div>

              <p className="text-xs font-black uppercase tracking-[0.16em] text-orange-600">
                Funding route deep dive
              </p>
              <h3 className="mt-2 text-3xl font-black tracking-[-0.04em]">
                {selectedRoute.title}
              </h3>
              <p className="mt-4 text-sm font-semibold leading-7 text-slate-600">
                {selectedRoute.text}
              </p>

              <div className="mt-5 rounded-[1.5rem] bg-[#fff7ed] p-4 ring-1 ring-orange-100">
                <div className="flex gap-3">
                  <Info className="mt-1 shrink-0 text-orange-600" />
                  <p className="text-sm font-bold leading-6 text-slate-700">
                    {selectedRoute.warning}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {selectedRoute.benefits.map((benefit) => (
                <div
                  key={benefit}
                  className="rounded-[1.7rem] bg-white/92 p-5 shadow-[0_16px_48px_rgba(15,23,42,0.06)] ring-1 ring-orange-100"
                >
                  <CheckCircle2 className="mb-4 h-6 w-6 text-orange-600" />
                  <h4 className="text-lg font-black text-[#071f50]">
                    {benefit}
                  </h4>
                  <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
                    This should be checked against the student profile, chosen
                    region and application deadline.
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mt-6">
          <div className="rounded-[2.3rem] bg-white/92 p-5 shadow-[0_20px_65px_rgba(15,23,42,0.07)] ring-1 ring-orange-100 md:p-7">
            <div className="mb-6 flex items-center gap-3">
              <BookOpenCheck className="h-7 w-7 text-orange-600" />
              <div>
                <p className="text-xs font-black uppercase tracking-[0.16em] text-orange-600">
                  Scholarship readiness
                </p>
                <h3 className="text-3xl font-black tracking-[-0.04em]">
                  Know your readiness level before the application window opens.
                </h3>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              {readinessCards.map((card) => {
                const Icon = card.icon;

                return (
                  <article
                    key={card.title}
                    className={`rounded-[1.7rem] p-5 ring-1 ${card.tone}`}
                  >
                    <Icon className="h-7 w-7" />
                    <h4 className="mt-4 text-xl font-black">{card.title}</h4>
                    <p className="mt-2 text-sm font-bold leading-6">
                      {card.text}
                    </p>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section id="scholarship-comparison" className="mt-6">
          <div className="rounded-[2.3rem] bg-white/92 p-5 shadow-[0_20px_65px_rgba(15,23,42,0.07)] ring-1 ring-orange-100 md:p-7">
            <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full bg-orange-50 px-4 py-2 text-xs font-black uppercase tracking-wide text-orange-600 ring-1 ring-orange-100">
                  <ClipboardCheck className="h-4 w-4" />
                  Compare funding routes
                </div>
                <h3 className="mt-4 text-3xl font-black tracking-[-0.04em] md:text-4xl">
                  Italy scholarships are not one single thing.
                </h3>
                <p className="mt-3 max-w-3xl text-sm font-semibold leading-7 text-slate-600">
                  Students usually hear “DSU” and think everything is solved.
                  Real planning means comparing DSU, regional support,
                  university awards and merit scholarships with documents and
                  deadlines.
                </p>
              </div>

              <a
                href="/appointment?country=Italy&service=Scholarship Comparison"
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#071f50] px-6 py-4 text-sm font-black text-white transition hover:-translate-y-1 hover:bg-[#092b72]"
              >
                Compare My Options
                <ArrowRight className="h-4 w-4" />
              </a>
            </div>

            <div className="overflow-hidden rounded-[1.7rem] ring-1 ring-orange-100">
              <div className="hidden grid-cols-[1.1fr_0.7fr_0.8fr_0.8fr_0.8fr_1.1fr] bg-[#071f50] px-4 py-4 text-xs font-black uppercase tracking-wide text-white md:grid">
                <div>Route</div>
                <div>Support</div>
                <div>Housing</div>
                <div>Meals</div>
                <div>Difficulty</div>
                <div>Best For</div>
              </div>

              <div className="divide-y divide-orange-100 bg-white">
                {scholarshipComparison.map((item) => (
                  <div
                    key={item.route}
                    className="grid gap-3 px-4 py-4 text-sm font-semibold text-slate-700 md:grid-cols-[1.1fr_0.7fr_0.8fr_0.8fr_0.8fr_1.1fr] md:items-center"
                  >
                    <div>
                      <p className="font-black text-[#071f50]">{item.route}</p>
                      <p className="mt-1 text-xs font-black uppercase tracking-wide text-orange-600">
                        {item.country}
                      </p>
                    </div>
                    <div>{item.support}</div>
                    <div>{item.accommodation}</div>
                    <div>{item.meals}</div>
                    <div>{item.difficulty}</div>
                    <div>{item.bestFor}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section id="scholarship-regions" className="mt-6">
          <div className="rounded-[2.3rem] bg-white/88 p-5 shadow-[0_20px_65px_rgba(15,23,42,0.07)] ring-1 ring-orange-100 md:p-7">
            <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full bg-orange-50 px-4 py-2 text-xs font-black uppercase tracking-wide text-orange-600 ring-1 ring-orange-100">
                  <MapPin className="h-4 w-4" />
                  City + region matters
                </div>
                <h3 className="mt-4 text-3xl font-black tracking-[-0.04em] md:text-4xl">
                  The scholarship route changes by region.
                </h3>
                <p className="mt-3 max-w-3xl text-sm font-semibold leading-7 text-slate-600">
                  This is why Zaifan should not shortlist universities without
                  checking the city, region and funding system together.
                </p>
              </div>

              <a
                href="/universities"
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#071f50] px-6 py-4 text-sm font-black text-white transition hover:-translate-y-1 hover:bg-[#092b72]"
              >
                View Italy Universities
                <ArrowRight className="h-4 w-4" />
              </a>
            </div>

            <div className="mb-5 grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
              <div className="rounded-[1.8rem] bg-[#071f50] p-6 text-white">
                <MapPin className="h-7 w-7 text-orange-300" />
                <p className="mt-4 text-[10px] font-black uppercase tracking-[0.16em] text-orange-300">
                  Regional Logic
                </p>
                <h4 className="mt-2 text-2xl font-black">
                  In Italy, your city can change your funding route.
                </h4>
                <p className="mt-3 text-sm font-semibold leading-7 text-white/70">
                  That is why scholarship planning should happen at the same time as university shortlisting.
                </p>
              </div>

              <div className="rounded-[1.8rem] bg-orange-50 p-6 ring-1 ring-orange-100">
                <div className="flex items-start gap-4">
                  <Lightbulb className="mt-1 h-7 w-7 shrink-0 text-orange-600" />
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.16em] text-orange-600">
                      Smart planning rule
                    </p>
                    <h4 className="mt-2 text-2xl font-black text-[#071f50]">
                      Never shortlist the university and check the scholarship later.
                    </h4>
                    <p className="mt-3 text-sm font-semibold leading-7 text-slate-600">
                      University, city, region, tuition, scholarship documents and deadlines should be reviewed as one connected decision.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {cityFundingRoutes.map((route) => (
                <a
                  key={`${route.city}-${route.funding}`}
                  href={route.link}
                  className="rounded-[1.7rem] bg-[#fff7ed] p-5 ring-1 ring-orange-100 transition hover:-translate-y-1 hover:bg-white hover:shadow-[0_18px_45px_rgba(15,23,42,0.07)]"
                >
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-orange-600">
                    {route.region}
                  </p>
                  <h4 className="mt-2 text-xl font-black">{route.city}</h4>
                  <p className="mt-2 rounded-full bg-white px-3 py-2 text-xs font-black text-orange-700 ring-1 ring-orange-100">
                    {route.funding}
                  </p>
                  <p className="mt-3 text-sm font-semibold leading-6 text-slate-600">
                    {route.vibe}
                  </p>
                </a>
              ))}
            </div>
          </div>
        </section>

        <section id="scholarship-documents" className="mt-6">
          <div className="grid gap-5 lg:grid-cols-[0.8fr_1.2fr]">
            <div className="rounded-[2rem] bg-[#071f50] p-6 text-white shadow-[0_24px_70px_rgba(7,31,80,0.18)]">
              <div className="grid h-14 w-14 place-items-center rounded-2xl bg-white/10 text-orange-300 ring-1 ring-white/10">
                <FileCheck2 className="h-7 w-7" />
              </div>
              <h3 className="mt-5 text-3xl font-black tracking-[-0.04em]">
                Documents are the real scholarship battle.
              </h3>
              <p className="mt-4 text-sm font-semibold leading-7 text-white/72">
                Students often lose time because family, income, property,
                translations or legalization documents are started too late.
                This section helps them understand preparation before panic.
              </p>

              <a
                href="/appointment?country=Italy&service=DSU Document Planning"
                className="mt-6 inline-flex items-center gap-3 rounded-full bg-orange-500 px-7 py-4 text-sm font-black text-white transition hover:-translate-y-1 hover:bg-orange-600"
              >
                Check My Documents
                <ArrowRight className="h-4 w-4" />
              </a>
            </div>

            <div className="rounded-[2rem] bg-white/92 p-5 shadow-[0_20px_65px_rgba(15,23,42,0.07)] ring-1 ring-orange-100">
              <div className="mb-4 flex items-center gap-3">
                <ClipboardCheck className="h-6 w-6 text-orange-600" />
                <h3 className="text-2xl font-black">
                  Common preparation checklist
                </h3>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {documentChecklist.map((item) => (
                  <div
                    key={item}
                    className="flex items-center gap-3 rounded-2xl bg-[#fff7ed] px-4 py-3 text-sm font-bold text-slate-700 ring-1 ring-orange-100"
                  >
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-orange-600" />
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {documentGroups.map((group) => {
              const Icon = group.icon;

              return (
                <article
                  key={group.title}
                  className="rounded-[1.7rem] bg-white/92 p-5 shadow-[0_16px_48px_rgba(15,23,42,0.06)] ring-1 ring-orange-100"
                >
                  <Icon className="h-7 w-7 text-orange-600" />
                  <h4 className="mt-4 text-xl font-black">{group.title}</h4>
                  <div className="mt-3 space-y-2">
                    {group.items.map((item) => (
                      <p
                        key={item}
                        className="rounded-2xl bg-[#fff7ed] px-3 py-2 text-xs font-black text-slate-700 ring-1 ring-orange-100"
                      >
                        {item}
                      </p>
                    ))}
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <section className="mt-6">
          <div className="rounded-[2.3rem] bg-white/92 p-5 shadow-[0_20px_65px_rgba(15,23,42,0.07)] ring-1 ring-orange-100 md:p-7">
            <div className="mb-6 flex items-center gap-3">
              <AlertTriangle className="h-7 w-7 text-orange-600" />
              <div>
                <p className="text-xs font-black uppercase tracking-[0.16em] text-orange-600">
                  Avoid these mistakes
                </p>
                <h3 className="text-3xl font-black tracking-[-0.04em]">
                  Scholarship mistakes that hurt students.
                </h3>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {mistakes.map((mistake) => (
                <article
                  key={mistake.title}
                  className="rounded-[1.7rem] bg-red-50/60 p-5 ring-1 ring-red-100 transition hover:-translate-y-1 hover:bg-white"
                >
                  <h4 className="text-lg font-black">{mistake.title}</h4>
                  <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
                    {mistake.text}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="scholarship-calculator" className="mt-6">
          <div className="grid gap-5 lg:grid-cols-[0.95fr_1.05fr]">
            <div className="rounded-[2rem] border border-orange-100 bg-white/92 p-6 shadow-[0_20px_65px_rgba(15,23,42,0.07)]">
              <div className="flex items-center gap-3">
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-orange-50 text-orange-600">
                  <Search className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-orange-600">
                    Scholarship finder
                  </p>
                  <h3 className="text-2xl font-black">What's your profile?</h3>
                </div>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <SmartSelect
                  label="Nationality"
                  value={profile.nationality}
                  options={nationalities}
                  onChange={(value) => updateProfile("nationality", value)}
                />
                <SmartSelect
                  label="Academic Level"
                  value={profile.level}
                  options={levels}
                  onChange={(value) => updateProfile("level", value)}
                />
                <SmartSelect
                  label="Program"
                  value={profile.program}
                  options={programs}
                  onChange={(value) => updateProfile("program", value)}
                />
                <SmartSelect
                  label="Budget"
                  value={profile.budget}
                  options={budgets}
                  onChange={(value) => updateProfile("budget", value)}
                />
              </div>

              <div className="mt-5 rounded-[1.5rem] bg-[#fff7ed] p-4 ring-1 ring-orange-100">
                <p className="text-sm font-black text-[#071f50]">
                  Recommended opportunities
                </p>
                <div className="mt-3 grid gap-2">
                  {recommendations.map((item) => (
                    <div
                      key={item}
                      className="flex items-center justify-between rounded-2xl bg-white px-4 py-3 ring-1 ring-orange-100"
                    >
                      <span className="text-sm font-black text-slate-700">
                        {item}
                      </span>
                      <BadgePercent className="h-4 w-4 text-orange-600" />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="rounded-[2rem] border border-orange-100 bg-white/92 p-6 shadow-[0_20px_65px_rgba(15,23,42,0.07)]">
              <div className="flex items-center gap-3">
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-orange-50 text-orange-600">
                  <Calculator className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-orange-600">
                    Cost impact
                  </p>
                  <h3 className="text-2xl font-black">
                    How much could support change?
                  </h3>
                </div>
              </div>

              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <RangeControl
                  label="Tuition estimate"
                  value={tuition}
                  min={500}
                  max={12000}
                  step={250}
                  onChange={setTuition}
                />
                <RangeControl
                  label="Living estimate"
                  value={living}
                  min={3000}
                  max={12000}
                  step={250}
                  onChange={setLiving}
                />
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <CostBox
                  title="Without Scholarship"
                  total={scholarshipImpact.before}
                  items={[
                    ["Tuition", tuition],
                    ["Living", living],
                  ]}
                />
                <CostBox
                  title="With Support Estimate"
                  total={scholarshipImpact.after}
                  items={[
                    ["Tuition", scholarshipImpact.tuitionAfter],
                    ["Living", scholarshipImpact.livingAfter],
                  ]}
                  highlight
                />
              </div>

              <div className="mt-4 rounded-[1.5rem] bg-green-50 p-4 text-green-800 ring-1 ring-green-100">
                <p className="text-sm font-black">Possible yearly impact</p>
                <p className="mt-1 text-3xl font-black">
                  €{scholarshipImpact.saved.toLocaleString()}
                </p>
                <p className="mt-1 text-xs font-bold leading-5">
                  This is a planning estimate, not a guarantee. Final
                  eligibility depends on region, university, documents and
                  deadlines.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-6">
          <div className="rounded-[2rem] bg-white/88 p-5 shadow-[0_18px_55px_rgba(15,23,42,0.07)] ring-1 ring-orange-100">
            <div className="mb-5 flex items-center gap-3">
              <Route className="h-6 w-6 text-orange-600" />
              <h3 className="text-2xl font-black">Scholarship journey</h3>
            </div>

            <div className="grid gap-3 md:grid-cols-5">
              {timelineSteps.map((step, index) => (
                <div
                  key={step.title}
                  className="rounded-[1.5rem] bg-[#fff7ed] p-4 ring-1 ring-orange-100"
                >
                  <div className="grid h-10 w-10 place-items-center rounded-full bg-orange-600 text-sm font-black text-white">
                    {index + 1}
                  </div>
                  <h4 className="mt-4 font-black">{step.title}</h4>
                  <p className="mt-2 text-xs font-semibold leading-5 text-slate-600">
                    {step.text}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="scholarship-pathways" className="mt-6">
          <div className="rounded-[2.3rem] bg-white/92 p-5 shadow-[0_20px_65px_rgba(15,23,42,0.07)] ring-1 ring-orange-100 md:p-7">
            <div className="mb-6">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-orange-600">
                Ecosystem linking
              </p>
              <h3 className="mt-2 text-3xl font-black tracking-[-0.04em] md:text-4xl">
                Scholarships should naturally lead to countries, cities and
                universities.
              </h3>
            </div>

            <div className="grid gap-4 lg:grid-cols-3">
              {pathwayCards.map((card) => (
                <article
                  key={card.title}
                  className="rounded-[1.8rem] bg-[#fff7ed] p-5 ring-1 ring-orange-100"
                >
                  <h4 className="text-xl font-black">{card.title}</h4>
                  <p className="mt-3 text-sm font-bold leading-6 text-slate-700">
                    {card.path}
                  </p>
                  <div className="mt-5 flex flex-wrap gap-2">
                    {card.links.map(([label, href]) => (
                      <a
                        key={label}
                        href={href}
                        className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-black text-orange-700 ring-1 ring-orange-100 transition hover:-translate-y-0.5"
                      >
                        {label}
                        <ArrowRight className="h-3.5 w-3.5" />
                      </a>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="scholarship-countries" className="mt-6">
          <div className="rounded-[2.3rem] bg-[#071f50] p-5 text-white shadow-[0_24px_70px_rgba(7,31,80,0.18)] md:p-7">
            <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-wide text-orange-300 ring-1 ring-white/10">
                  <Globe2 className="h-4 w-4" />
                  More countries coming
                </div>
                <h3 className="mt-4 text-3xl font-black tracking-[-0.04em] md:text-4xl">
                  Italy is live first — not the final destination.
                </h3>
                <p className="mt-3 max-w-3xl text-sm font-semibold leading-7 text-white/72">
                  Zaifan is building country scholarship guides one by one.
                  Italy is live because the university, city and scholarship
                  database is ready. Other countries stay visible but honestly
                  marked as coming soon.
                </p>
              </div>

              <a
                href="/appointment?service=Request Country Scholarship Guide"
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-orange-500 px-6 py-4 text-sm font-black text-white transition hover:-translate-y-1 hover:bg-orange-600"
              >
                Request a Country Guide
                <Send className="h-4 w-4" />
              </a>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
              {futureScholarshipCountries.map((item) => (
                <article
                  key={item.country}
                  className="relative overflow-hidden rounded-[1.7rem] bg-white/10 p-5 ring-1 ring-white/10 transition hover:-translate-y-1 hover:bg-white/14"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="text-4xl">{item.flag}</div>
                    <div className="inline-flex items-center gap-1 rounded-full bg-white/10 px-3 py-1 text-[10px] font-black uppercase text-orange-200 ring-1 ring-white/10">
                      <Clock3 className="h-3 w-3" />
                      {item.status}
                    </div>
                  </div>

                  <h4 className="mt-4 text-xl font-black text-white">
                    {item.country}
                  </h4>
                  <p className="mt-2 text-sm font-bold leading-6 text-white/78">
                    {item.focus}
                  </p>
                  <p className="mt-3 text-xs font-semibold leading-5 text-white/58">
                    {item.note}
                  </p>

                  <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-2 text-[10px] font-black uppercase text-white/80 ring-1 ring-white/10">
                    <LockKeyhole className="h-3 w-3" />
                    Future Guide
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <div className="mt-6 grid gap-4 rounded-[2rem] border border-orange-100 bg-white/85 p-5 shadow-[0_18px_55px_rgba(15,23,42,0.07)] sm:grid-cols-2 lg:grid-cols-4">
          {facts.map((fact) => {
            const Icon = fact.icon;

            return (
              <div
                key={fact.label}
                className="flex items-center gap-4 rounded-[1.4rem] bg-[#fff7ed] p-4 ring-1 ring-orange-100 transition hover:-translate-y-1 hover:bg-white"
              >
                <div className="grid h-14 w-14 place-items-center rounded-2xl bg-orange-50 p-3 text-orange-600">
                  <Icon className="h-7 w-7" />
                </div>
                <div>
                  <p className="text-2xl font-black">{fact.value}</p>
                  <p className="text-xs font-black uppercase tracking-wide text-slate-500">
                    {fact.label}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        <section id="scholarship-faq" className="mt-6">
          <div className="mx-auto max-w-[1050px]">
            <div className="mb-6 text-center">
              <div className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-orange-600 shadow-sm ring-1 ring-orange-100">
                <CircleHelp className="h-4 w-4" />
                Scholarship FAQs
              </div>
              <h3 className="mt-4 text-4xl font-black tracking-[-0.05em]">
                Questions students ask before planning DSU.
              </h3>
            </div>

            <div className="space-y-3">
              {faqs.map((faq, index) => {
                const isOpen = openFaq === index;

                return (
                  <div
                    key={faq.q}
                    className="overflow-hidden rounded-[1.5rem] bg-white shadow-[0_16px_42px_rgba(9,31,80,0.06)] ring-1 ring-orange-100"
                  >
                    <button
                      type="button"
                      onClick={() => setOpenFaq(isOpen ? -1 : index)}
                      className="flex w-full items-center justify-between gap-4 px-5 py-5 text-left font-black text-[#071f50] md:px-6"
                    >
                      <span className="flex items-center gap-3">
                        <CircleHelp className="text-orange-600" size={21} />
                        {faq.q}
                      </span>
                      <ChevronDown
                        className={`shrink-0 text-orange-600 transition ${
                          isOpen ? "rotate-180" : ""
                        }`}
                      />
                    </button>

                    {isOpen && (
                      <div className="px-5 pb-5 text-sm font-semibold leading-7 text-slate-600 md:px-6">
                        {faq.a}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <div className="mt-6 rounded-[1.7rem] bg-white/85 p-5 text-center ring-1 ring-orange-100">
          <p className="mx-auto max-w-4xl text-xs font-bold leading-6 text-slate-500">
            Scholarship values, eligibility rules, deadlines and benefits can change. This page is a planning tool, not a guarantee of funding. Always verify the current official rules for the relevant university and region.
          </p>
        </div>

        <div className="mt-6 overflow-hidden rounded-[2rem] bg-gradient-to-r from-[#ff7b1c] via-[#ff4b12] to-[#ff7b1c] p-6 text-white shadow-[0_24px_70px_rgba(255,75,18,0.24)] sm:p-7">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-white/75">
                Not sure which route fits?
              </p>
              <h3 className="mt-2 text-3xl font-black leading-tight">
                Book a scholarship planning consultation.
              </h3>
              <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-white/90">
                Share your marks, budget, target country, course and city
                preference. We'll help you understand the best scholarship
                direction, starting with Italy where the live database is ready.
              </p>
            </div>

            <a
              href="/appointment?country=Italy&service=Scholarship Guidance"
              className="inline-flex shrink-0 items-center justify-center gap-3 rounded-full bg-[#071f50] px-7 py-4 text-sm font-black text-white shadow-[0_18px_38px_rgba(7,31,80,0.26)] transition hover:-translate-y-1 hover:bg-[#092b72]"
            >
              Find My Best Scholarship
              <ArrowRight className="h-4 w-4" />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

function SmartSelect({ label, value, options, onChange }) {
  return (
    <label>
      <span className="mb-2 block text-xs font-black uppercase tracking-wide text-slate-500">
        {label}
      </span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-12 w-full rounded-2xl border border-orange-100 bg-white px-4 text-sm font-black text-[#071f50] outline-none transition focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
      >
        {options.map((item) => (
          <option key={item}>{item}</option>
        ))}
      </select>
    </label>
  );
}

function RangeControl({ label, value, min, max, step, onChange }) {
  return (
    <label className="rounded-2xl bg-[#fff7ed] p-4 ring-1 ring-orange-100">
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs font-black uppercase tracking-wide text-slate-500">
          {label}
        </span>
        <span className="text-sm font-black text-orange-600">
          €{value.toLocaleString()}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="mt-4 w-full accent-orange-600"
      />
    </label>
  );
}

function CostBox({ title, total, items, highlight = false }) {
  return (
    <div
      className={`rounded-[1.5rem] p-4 ring-1 ${
        highlight ? "bg-orange-50 ring-orange-100" : "bg-white ring-orange-100"
      }`}
    >
      <p className="text-sm font-black text-[#071f50]">{title}</p>
      <p
        className={`mt-2 text-3xl font-black ${
          highlight ? "text-orange-600" : "text-[#071f50]"
        }`}
      >
        €{total.toLocaleString()}
      </p>
      <div className="mt-3 space-y-2">
        {items.map(([label, amount]) => (
          <div
            key={label}
            className="flex items-center justify-between text-xs font-bold text-slate-600"
          >
            <span>{label}</span>
            <span>€{amount.toLocaleString()}</span>
          </div>
        ))}
      </div>
    </div>
  );
}