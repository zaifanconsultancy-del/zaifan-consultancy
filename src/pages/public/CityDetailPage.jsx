import { useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  BadgeDollarSign,
  BookOpenCheck,
  BriefcaseBusiness,
  Building2,
  CheckCircle2,
  Coffee,
  Euro,
  GraduationCap,
  Home,
  Landmark,
  MapPin,
  Plane,
  Route,
  ShieldCheck,
  Sparkles,
  Train,
  Utensils,
  Wallet,
  Clock3,
  Compass,
  HeartHandshake,
  Target,
  Lightbulb,
  Star,
  CircleAlert,
  Map,
  CalendarDays,
} from "lucide-react";

import NotFoundPage from "./NotFoundPage.jsx";
import { findItalianCityBySlug } from "../../data/italianCities";
import { italianUniversities } from "../../data/italianUniversities";

const MOTION = {
  duration: 0.55,
  ease: [0.22, 1, 0.36, 1],
  stagger: 0.06,
  hoverY: -4,
};

const INTERACTIVE_TRANSITION =
  "transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: MOTION.duration, ease: MOTION.ease },
  },
};

const fadeScale = {
  hidden: { opacity: 0, y: 24, scale: 0.985 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: MOTION.duration, ease: MOTION.ease },
  },
};

const iconCycle = [BriefcaseBusiness, Building2, GraduationCap, Landmark];
const lifeIcons = [Coffee, Utensils, Train, Home];

const cityThemes = {
  milan: {
    eyebrow: "Career Capital",
    accent: "from-[#ff4b12] via-[#ff7a32] to-[#071f50]",
    soft: "from-[#fff1ea] via-white to-[#eef4ff]",
    symbol: "MI",
    signals: ["Career exposure", "Design culture", "International network"],
  },
  rome: {
    eyebrow: "Capital Experience",
    accent: "from-[#e9542f] via-[#ff8d52] to-[#071f50]",
    soft: "from-[#fff0e8] via-white to-[#f4eee8]",
    symbol: "RM",
    signals: ["Historic capital", "Major universities", "Broad opportunity"],
  },
  bologna: {
    eyebrow: "Student City",
    accent: "from-[#c84d2f] via-[#ff7144] to-[#071f50]",
    soft: "from-[#fff1e9] via-white to-[#fff7e8]",
    symbol: "BO",
    signals: ["Academic identity", "Student community", "Balanced lifestyle"],
  },
  padua: {
    eyebrow: "Research City",
    accent: "from-[#ff5a32] via-[#ff9663] to-[#123865]",
    soft: "from-[#fff0e8] via-white to-[#eef5ff]",
    symbol: "PD",
    signals: ["Research focus", "Historic university", "Connected location"],
  },
  florence: {
    eyebrow: "Creative City",
    accent: "from-[#e85b32] via-[#ff9a5e] to-[#5c315f]",
    soft: "from-[#fff0e8] via-white to-[#f7efff]",
    symbol: "FI",
    signals: ["Arts and culture", "Architecture", "International visibility"],
  },
  turin: {
    eyebrow: "Engineering City",
    accent: "from-[#ff5b2d] via-[#ff8b44] to-[#123865]",
    soft: "from-[#fff1e9] via-white to-[#edf3fb]",
    symbol: "TO",
    signals: ["Engineering", "Industry links", "Northern Italy value"],
  },
  pisa: {
    eyebrow: "Compact Research City",
    accent: "from-[#ff6035] via-[#ffa05d] to-[#254b77]",
    soft: "from-[#fff2ea] via-white to-[#eef7ff]",
    symbol: "PI",
    signals: ["Computer science", "Research", "Compact student life"],
  },
  venice: {
    eyebrow: "Global Culture City",
    accent: "from-[#ff5b32] via-[#ff9c67] to-[#305b77]",
    soft: "from-[#fff0e8] via-white to-[#edf8fb]",
    symbol: "VE",
    signals: ["Languages", "Tourism", "Unique international setting"],
  },
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
      {text && (
        <p className="mx-auto mt-5 max-w-3xl text-base font-semibold leading-8 text-[#5f6f89] md:text-lg">
          {text}
        </p>
      )}
    </div>
  );
}


function getCityProfile(city) {
  const name = city?.name || "This city";

  const profiles = {
    Milan: {
      personality: "Career-driven, international and fast-paced",
      bestFor: "Business, engineering, design, fashion and ambitious career exposure",
      watchOut: "Housing can be expensive, so accommodation planning matters early",
      pace: "Fast",
      opportunity: "Very High",
    },
    Rome: {
      personality: "Historic, massive and globally connected",
      bestFor: "Medicine, humanities, research and students who enjoy capital-city energy",
      watchOut: "Commutes and housing location can strongly affect daily life",
      pace: "Energetic",
      opportunity: "High",
    },
    Bologna: {
      personality: "Academic, social and deeply student-centered",
      bestFor: "Students who want a classic university-city atmosphere",
      watchOut: "Student housing demand can make early searching important",
      pace: "Balanced",
      opportunity: "High",
    },
    Padua: {
      personality: "Academic, practical and well connected",
      bestFor: "Research-focused students seeking strong university identity",
      watchOut: "Compare housing availability and regional scholarship timing early",
      pace: "Balanced",
      opportunity: "Strong",
    },
    Turin: {
      personality: "Industrial, elegant and value-conscious",
      bestFor: "Engineering, automotive, architecture and students seeking northern-Italy value",
      watchOut: "Choose neighbourhoods based on campus and transport connections",
      pace: "Balanced",
      opportunity: "High",
    },
    Florence: {
      personality: "Creative, historic and internationally visible",
      bestFor: "Arts, architecture, humanities and culture-focused students",
      watchOut: "Tourism can influence central-area rent and lifestyle costs",
      pace: "Moderate",
      opportunity: "Strong",
    },
    Pisa: {
      personality: "Compact, academic and research-oriented",
      bestFor: "Students who prefer a smaller university-city environment",
      watchOut: "Career exposure differs from larger cities, depending on field",
      pace: "Calm",
      opportunity: "Focused",
    },
    Venice: {
      personality: "Unique, international and culturally distinctive",
      bestFor: "Economics, languages, humanities and globally minded students",
      watchOut: "Housing geography and commuting from the mainland need careful planning",
      pace: "Distinctive",
      opportunity: "Specialized",
    },
  };

  return profiles[name] || {
    personality: "Student-focused with its own local Italian character",
    bestFor: "Students whose university, budget and lifestyle priorities align with the city",
    watchOut: "Housing, transport and scholarship rules should be verified before committing",
    pace: "Balanced",
    opportunity: "Good",
  };
}

function buildDecisionFactors(city, cityUniversities) {
  const profile = getCityProfile(city);

  return [
    {
      icon: GraduationCap,
      label: "University Choice",
      value: `${cityUniversities.length}+ linked options`,
      text: "Start with the exact course and university fit, not the city name alone.",
    },
    {
      icon: Wallet,
      label: "Budget Reality",
      value: city.heroStats?.find(([label]) => /cost|budget|living/i.test(label))?.[1] || "Plan carefully",
      text: "Rent is usually the biggest variable in the monthly student budget.",
    },
    {
      icon: BadgeDollarSign,
      label: "Funding Route",
      value: city.scholarshipBody,
      text: "Regional and university funding should be researched before deadlines arrive.",
    },
    {
      icon: Compass,
      label: "City Personality",
      value: profile.personality,
      text: "Your lifestyle and daily routine matter almost as much as the university.",
    },
  ];
}

function buildCityFit(city) {
  const profile = getCityProfile(city);

  return {
    good: [
      `You found a strong academic route in ${city.name}.`,
      "Your realistic monthly budget can support rent and daily living.",
      `The ${city.name} lifestyle matches the pace and environment you want.`,
      "You have researched scholarships without treating funding as guaranteed.",
      "You are comfortable planning housing and documents early.",
    ],
    reconsider: [
      `You are choosing ${city.name} only because the city is famous.`,
      "Your budget depends entirely on finding a scholarship.",
      "You have not checked the exact campus location or commute.",
      "You have not compared the same course in other Italian cities.",
      "You are leaving accommodation and visa preparation until the last minute.",
    ],
    profile,
  };
}

function CityDetailPage() {
  const { citySlug } = useParams();
  const normalizedCitySlug = String(citySlug || "").trim().toLowerCase();
  const city = findItalianCityBySlug(normalizedCitySlug);

  const cityUniversities = useMemo(() => {
    if (!city?.name) return [];

    const normalizedCityName = city.name.trim().toLowerCase();

    return italianUniversities
      .filter(Boolean)
      .filter(
        (university) =>
          String(university?.city || "").trim().toLowerCase() ===
          normalizedCityName
      );
  }, [city]);

  const decisionFactors = useMemo(
    () => (city ? buildDecisionFactors(city, cityUniversities) : []),
    [city, cityUniversities]
  );

  const cityFit = useMemo(
    () => (city ? buildCityFit(city) : null),
    [city]
  );

  const cityTheme =
    cityThemes[normalizedCitySlug] || {
      eyebrow: "Italian Student City",
      accent: "from-[#ff4b12] via-[#ff8a4c] to-[#071f50]",
      soft: "from-[#fff1ea] via-white to-[#eef4ff]",
      symbol: city?.name?.slice(0, 2).toUpperCase() || "IT",
      signals: ["University fit", "Budget reality", "Student lifestyle"],
    };

  const cityChapters = [
    ["city-why", "Why this city"],
    ["city-universities", "Universities"],
    ["city-costs", "Costs"],
    ["city-scholarships", "Scholarships"],
    ["city-life", "Student life"],
    ["city-fit", "Fit check"],
    ["city-roadmap", "Roadmap"],
  ];

  const scrollToChapter = (id) => {
    const target = document.getElementById(id);
    if (!target) return;

    const y = target.getBoundingClientRect().top + window.scrollY - 108;
    window.scrollTo({ top: y, behavior: "smooth" });
  };

  if (!city) {
    return <NotFoundPage />;
  }

  return (
    <main
      id="city-detail-page"
        className="overflow-hidden bg-[#fff7ed] text-[#071f50]"
      >
        <style>{`
          @media (prefers-reduced-motion: reduce) {
            #city-detail-page *,
            #city-detail-page *::before,
            #city-detail-page *::after {
              scroll-behavior: auto !important;
              transition-duration: 0.01ms !important;
              animation-duration: 0.01ms !important;
              animation-iteration-count: 1 !important;
            }
          }
        `}</style>
        <section className={`relative overflow-hidden bg-gradient-to-br ${cityTheme.soft} px-5 pb-20 pt-32 md:pt-36`}>
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_16%_22%,rgba(255,75,18,0.16),transparent_30%),radial-gradient(circle_at_84%_12%,rgba(255,178,89,0.18),transparent_26%)]" />
          <div className="pointer-events-none absolute -left-28 top-16 h-96 w-96 rounded-full bg-orange-300/20 blur-3xl" />
          <div className="pointer-events-none absolute -right-28 top-32 h-96 w-96 rounded-full bg-[#ff4b12]/10 blur-3xl" />

          <div className="relative mx-auto max-w-[1450px]">
            <Link
              to="/countries/italy"
              className="mb-6 inline-flex items-center gap-2 rounded-full bg-white/90 px-4 py-2 text-xs font-black text-[#ff4b12] shadow-sm ring-1 ring-orange-100 transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-1 hover:bg-[#fff1ea]"
            >
              <ArrowLeft size={16} strokeWidth={3} />
              Back to Italy Guide
            </Link>

            <div className="grid items-center gap-10 lg:grid-cols-[1.05fr_0.95fr]">
              <motion.div initial="hidden" animate="show" variants={fadeUp}>
                <Badge>{city.name} Student City Guide</Badge>

                <div className="mt-5 inline-flex items-center gap-2 rounded-full bg-[#071f50] px-4 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-white shadow-[0_14px_34px_rgba(7,31,80,0.16)]">
                  <Star size={14} className="text-[#ffb36d]" fill="currentColor" />
                  {cityTheme.eyebrow}
                </div>

                <h1 className="mt-6 max-w-4xl text-5xl font-black leading-[0.9] tracking-[-0.07em] text-[#071f50] md:text-7xl xl:text-[88px]">
                  Study in <span className="text-[#ff4b12]">{city.name}</span>.
                </h1>

                <p className="mt-7 max-w-3xl text-lg font-semibold leading-9 text-[#526178]">
                  {city.intro}
                </p>

                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <Link
                    to={`/appointment?country=Italy&city=${encodeURIComponent(city.name)}`}
                    className={`inline-flex items-center justify-center gap-3 rounded-full bg-[#ff4b12] px-8 py-5 text-base font-black text-white shadow-[0_20px_44px_rgba(255,75,18,0.3)] hover:-translate-y-1 hover:bg-[#ff642f] focus:outline-none focus-visible:ring-4 focus-visible:ring-[#ff4b12]/20 ${INTERACTIVE_TRANSITION}`}
                  >
                    Plan {city.name} Study Route
                    <ArrowRight size={21} strokeWidth={3} />
                  </Link>

                  <Link
                    to="/universities"
                    className="inline-flex items-center justify-center gap-3 rounded-full bg-white px-8 py-5 text-base font-black text-[#ff4b12] shadow-[0_14px_32px_rgba(255,75,18,0.1)] ring-1 ring-orange-100 transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-1 hover:bg-[#fff1ea] focus:outline-none focus-visible:ring-4 focus:ring-[#ff4b12]/20"
                  >
                    Explore Universities
                  </Link>
                </div>
              </motion.div>

              <motion.div
                initial="hidden"
                animate="show"
                variants={fadeScale}
                className="relative"
              >
                <div className={`relative overflow-hidden rounded-[42px] bg-gradient-to-br ${cityTheme.accent} p-[3px] text-white shadow-[0_38px_110px_rgba(9,31,80,0.22)]`}>
                  <div className="pointer-events-none absolute -right-16 -top-16 h-52 w-52 rounded-full border-[34px] border-white/10" />
                  <div className="relative rounded-[39px] bg-[#071f50]/94 p-6 backdrop-blur-xl">
                    <div className="flex items-start justify-between gap-5">
                      <div>
                        <p className="text-xs font-black uppercase tracking-[0.18em] text-[#ffb36d]">
                          Live City Dashboard
                        </p>
                        <h2 className="mt-2 text-4xl font-black tracking-[-0.055em] text-white">
                          Know {city.name} before you commit.
                        </h2>
                        <p className="mt-3 max-w-xl text-sm font-semibold leading-7 text-white/68">
                          A quick decision view combining universities, cost direction, funding and city fit.
                        </p>
                      </div>
                      <div className="relative grid h-24 w-24 shrink-0 place-items-center rounded-[28px] bg-white text-[#071f50] shadow-xl">
                        <span className="text-4xl">{city.emoji}</span>
                        <span className="absolute -bottom-2 -right-2 rounded-full bg-[#ff4b12] px-3 py-1 text-[10px] font-black tracking-[0.12em] text-white shadow-lg">
                          {cityTheme.symbol}
                        </span>
                      </div>
                    </div>

                    <div className="mt-7 grid gap-3 sm:grid-cols-2">
                      <div className="rounded-[24px] bg-white/10 p-5 ring-1 ring-white/10 transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-1 hover:bg-white/14">
                        <Building2 className="text-[#ffb36d]" size={24} />
                        <p className="mt-4 text-[10px] font-black uppercase tracking-[0.15em] text-[#ffb36d]">
                          Linked Universities
                        </p>
                        <p className="mt-1 text-2xl font-black text-white">{cityUniversities.length}+</p>
                      </div>

                      {city.heroStats.slice(0, 3).map(([label, value]) => (
                        <div key={label} className="rounded-[24px] bg-white/10 p-5 ring-1 ring-white/10 transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-1 hover:bg-white/14">
                          <MapPin className="text-[#ffb36d]" size={24} />
                          <p className="mt-4 text-[10px] font-black uppercase tracking-[0.15em] text-[#ffb36d]">
                            {label}
                          </p>
                          <p className="mt-1 text-xl font-black text-white">{value}</p>
                        </div>
                      ))}
                    </div>

                    <div className="mt-5 rounded-[26px] bg-white p-5 text-[#071f50]">
                      <div className="flex items-start gap-4">
                        <Lightbulb className="mt-1 shrink-0 text-[#ff4b12]" size={26} />
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-[0.15em] text-[#ff4b12]">
                            Zaifan City Verdict
                          </p>
                          <h3 className="mt-1 text-lg font-black">{cityFit.profile.personality}</h3>
                          <p className="mt-2 text-sm font-semibold leading-6 text-[#61708a]">
                            Best when your university, course, budget, scholarship route and lifestyle fit all point in the same direction.
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="mt-4 grid grid-cols-3 gap-2">
                      {cityTheme.signals.map((signal, index) => (
                        <div
                          key={signal}
                          className="rounded-2xl bg-white/10 px-3 py-3 text-center ring-1 ring-white/10"
                        >
                          <p className="text-[9px] font-black uppercase tracking-[0.12em] text-[#ffb36d]">
                            Signal 0{index + 1}
                          </p>
                          <p className="mt-1 text-xs font-black leading-5 text-white">
                            {signal}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        <section className="relative z-20 -mt-8 hidden px-5 pb-8 lg:block">
          <div className="mx-auto flex max-w-[1250px] items-center gap-2 overflow-x-auto rounded-[26px] bg-white/96 p-3 shadow-[0_22px_65px_rgba(9,31,80,0.10)] ring-1 ring-orange-100 backdrop-blur-xl">
            {cityChapters.map(([id, label], index) => (
              <button
                key={id}
                type="button"
                onClick={() => scrollToChapter(id)}
                className="group flex min-w-fit items-center gap-2 rounded-full px-4 py-3 text-xs font-black text-[#071f50] transition hover:bg-[#fff1ea] hover:text-[#ff4b12]"
              >
                <span className="grid h-7 w-7 place-items-center rounded-full bg-[#fff1ea] text-[10px] text-[#ff4b12] ring-1 ring-orange-100">
                  {index + 1}
                </span>
                {label}
              </button>
            ))}
          </div>
        </section>

        <section className="px-5 pb-8">
          <div className="mx-auto max-w-[1450px]">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {decisionFactors.map((factor, index) => (
                <motion.div
                  key={factor.label}
                  initial="hidden"
                  whileInView="show"
                  viewport={{ once: true, amount: 0.2 }}
                  variants={fadeUp}
                  transition={{ delay: index * MOTION.stagger }}
                  className={`rounded-[30px] p-6 shadow-[0_20px_60px_rgba(9,31,80,0.08)] ${
                    index === 0
                      ? "bg-[#071f50] text-white"
                      : index === 1
                        ? "bg-[#ff4b12] text-white"
                        : "bg-white text-[#071f50] ring-1 ring-orange-100"
                  }`}
                >
                  <div className={`grid h-13 w-13 place-items-center rounded-2xl p-3 ${
                    index < 2 ? "bg-white/12 text-[#ffb36d]" : "bg-[#fff1ea] text-[#ff4b12]"
                  }`}>
                    <factor.icon size={24} />
                  </div>
                  <p className={`mt-5 text-[10px] font-black uppercase tracking-[0.16em] ${
                    index < 2 ? "text-[#ffb36d]" : "text-[#ff4b12]"
                  }`}>
                    {factor.label}
                  </p>
                  <h3 className="mt-2 text-xl font-black leading-7">{factor.value}</h3>
                  <p className={`mt-3 text-sm font-semibold leading-6 ${
                    index < 2 ? "text-white/72" : "text-[#61708a]"
                  }`}>
                    {factor.text}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <section id="city-why" className="px-5 py-20">
          <div className="mx-auto max-w-[1350px]">
            <SectionHeader
              eyebrow={`Why ${city.name}`}
              title={city.headline}
              text={`${city.name} has its own student personality. The goal is not to choose the most famous city; the goal is to choose the city that fits the student's course, budget and future plan.`}
            />

            <motion.div
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, amount: 0.18 }}
              className="mt-12 grid gap-5 md:grid-cols-2 xl:grid-cols-4"
            >
              {city.highlights.map((item, index) => {
                const Icon = iconCycle[index % iconCycle.length];

                return (
                  <motion.div
                    key={item.title}
                    variants={fadeUp}
                    className="rounded-[30px] bg-white/90 p-6 shadow-[0_20px_55px_rgba(9,31,80,0.07)] ring-1 ring-orange-100 transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-1 hover:shadow-[0_28px_70px_rgba(255,75,18,0.13)]"
                  >
                    <div className="mb-5 grid h-14 w-14 place-items-center rounded-2xl bg-[#fff1ea] text-[#ff4b12] ring-1 ring-orange-100">
                      <Icon size={27} strokeWidth={2.6} />
                    </div>
                    <h3 className="text-xl font-black tracking-[-0.035em] text-[#071f50]">
                      {item.title}
                    </h3>
                    <p className="mt-3 text-sm font-semibold leading-7 text-[#61708a]">
                      {item.text}
                    </p>
                  </motion.div>
                );
              })}
            </motion.div>
          </div>
        </section>

        <section id="city-universities" className="relative overflow-hidden bg-white/52 px-5 py-20">
          <div className="pointer-events-none absolute -right-24 top-10 h-80 w-80 rounded-full bg-orange-200/30 blur-3xl" />
          <div className="pointer-events-none absolute -left-24 bottom-10 h-72 w-72 rounded-full bg-blue-100/35 blur-3xl" />
          <div className="relative mx-auto max-w-[1350px]">
            <SectionHeader
              eyebrow={`${city.name} Universities`}
              title={`Universities in ${city.name} from your live database.`}
              text="These cards are pulled from the Italy university database, so city pages stay connected to real university detail pages."
            />

            {cityUniversities.length > 0 ? (
              <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {cityUniversities.map((university, index) => (
                  <Link
                    key={university.slug}
                    to={`/universities/${university.slug}`}
                    className={`group overflow-hidden rounded-[30px] bg-white shadow-[0_18px_48px_rgba(9,31,80,0.07)] ring-1 ring-orange-100 transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-1 hover:shadow-[0_26px_65px_rgba(255,75,18,0.13)] ${
                      index === 0 && cityUniversities.length > 3 ? "lg:col-span-2" : ""
                    }`}
                  >
                    <div className={`relative overflow-hidden ${index === 0 && cityUniversities.length > 3 ? "h-64 lg:h-72" : "h-52"}`}>
                      <img
                        src={university.image}
                        alt={`${university.name} campus`}
                        loading="lazy"
                        decoding="async"
                        className="h-full w-full object-cover transition duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#071f50]/88 via-[#071f50]/15 to-transparent" />
                      <div className="absolute bottom-4 left-4 right-4">
                        <span className="rounded-full bg-[#ff4b12] px-3 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-white">
                          {university.type}
                        </span>
                        <h3 className="mt-2 text-xl font-black leading-tight text-white">
                          {university.name}
                        </h3>
                      </div>
                    </div>

                    <div className="p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[#fff1ea] text-[#ff4b12]">
                          <Building2 size={23} />
                        </div>
                        <div>
                          <p className="text-xs font-black uppercase tracking-[0.12em] text-[#ff4b12]">
                            {university.city} · {university.tuitionLevel}
                          </p>
                          <p className="mt-1 text-sm font-black text-[#071f50]">
                            {university.tuition}
                          </p>
                        </div>
                      </div>
                      <ArrowRight className="mt-1 shrink-0 text-[#ff4b12] transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:translate-x-1" size={18} />
                    </div>

                    <p className="mt-4 text-sm font-semibold leading-6 text-[#61708a]">
                      {university.popularFor}
                    </p>

                    <div className="mt-4 flex flex-wrap gap-2">
                      {university.programs.slice(0, 3).map((program) => (
                        <span
                          key={program}
                          className="rounded-full bg-[#fff1ea] px-3 py-1 text-[10px] font-black text-[#ff4b12] ring-1 ring-orange-100"
                        >
                          {program}
                        </span>
                      ))}
                    </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="mx-auto mt-12 max-w-2xl rounded-[30px] bg-white p-8 text-center shadow-[0_20px_55px_rgba(9,31,80,0.07)] ring-1 ring-orange-100">
                <BookOpenCheck className="mx-auto text-[#ff4b12]" size={42} />
                <h3 className="mt-4 text-2xl font-black text-[#071f50]">
                  University links coming soon
                </h3>
                <p className="mt-3 text-sm font-semibold leading-7 text-[#61708a]">
                  This city page is ready. Add universities with city "{city.name}" in the Italy university database and they will appear here automatically.
                </p>
              </div>
            )}

            <div className="mt-8 flex justify-center">
              <Link
                to="/universities"
                className="inline-flex items-center justify-center gap-3 rounded-full bg-[#071f50] px-8 py-5 text-sm font-black text-white shadow-[0_20px_44px_rgba(9,31,80,0.18)] transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-1 hover:bg-[#092b72]"
              >
                Explore Full Italy University Database
                <ArrowRight size={20} strokeWidth={3} />
              </Link>
            </div>
          </div>
        </section>

        <section id="city-costs" className="px-5 py-20">
          <div className="mx-auto max-w-[1250px]">
            <SectionHeader
              eyebrow="Cost of Living"
              title={`${city.name} needs realistic budgeting.`}
              text={`Living costs in ${city.name} should be checked before finalizing the route. Rent, food, transport and lifestyle can change the student's full study plan.`}
            />

            <div className="mt-12 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
              {city.costCards.map((card) => (
                <motion.div
                  key={card.label}
                  initial="hidden"
                  whileInView="show"
                  viewport={{ once: true, amount: 0.2 }}
                  variants={fadeUp}
                  className="rounded-[32px] bg-white/90 p-7 shadow-[0_22px_65px_rgba(9,31,80,0.08)] ring-1 ring-orange-100 transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-1 hover:shadow-[0_28px_70px_rgba(255,75,18,0.13)]"
                >
                  <Euro className="text-[#ff4b12]" size={34} strokeWidth={2.5} />
                  <p className="mt-5 text-xs font-black uppercase tracking-[0.18em] text-[#ff4b12]">
                    {card.label}
                  </p>
                  <h3 className="mt-2 text-2xl font-black tracking-[-0.045em] text-[#071f50]">
                    {card.value}
                  </h3>
                  <p className="mt-3 text-sm font-semibold leading-7 text-[#61708a]">
                    {card.text}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <section id="city-scholarships" className="relative overflow-hidden bg-[#071f50] px-5 py-20 text-white">
          <div className="mx-auto grid max-w-[1350px] gap-8 lg:grid-cols-[0.92fr_1.08fr] lg:items-center">
            <div>
              <Badge>Scholarships in {city.name}</Badge>
              <h2 className="mt-6 text-4xl font-black leading-[0.98] tracking-[-0.055em] text-white md:text-6xl">
                {city.scholarshipBody} and university funding need early planning.
              </h2>
              <p className="mt-6 text-base font-semibold leading-8 text-white/76 md:text-lg">
                {city.scholarshipNote} Funding should never be treated as guaranteed; it depends on profile, deadlines, documents and rules.
              </p>
              <Link
                to="/scholarships"
                className="mt-8 inline-flex items-center gap-3 rounded-full bg-[#ff4b12] px-8 py-5 font-black text-white shadow-[0_20px_44px_rgba(255,75,18,0.3)] transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-1 hover:bg-[#ff642f]"
              >
                Open Scholarship Hub
                <ArrowRight size={21} strokeWidth={3} />
              </Link>
            </div>

            <div className="rounded-[36px] bg-white/10 p-5 ring-1 ring-white/10 backdrop-blur md:p-7">
              <h3 className="mb-5 flex items-center gap-3 text-2xl font-black tracking-[-0.04em] text-white">
                <BadgeDollarSign className="text-[#ffb36d]" />
                Scholarship planning checklist
              </h3>
              <div className="grid gap-3 sm:grid-cols-2">
                {[
                  `${city.scholarshipBody} planning`,
                  "University merit awards",
                  "Need-based or regional support",
                  "Financial document preparation",
                  "Deadline tracking",
                  "Translations and legalization planning",
                ].map((item) => (
                  <div
                    key={item}
                    className="flex items-center gap-3 rounded-2xl bg-white/10 px-4 py-4 text-sm font-bold text-white/88 ring-1 ring-white/10"
                  >
                    <CheckCircle2 size={18} className="text-[#ffb36d]" strokeWidth={3} />
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section id="city-life" className="px-5 py-20">
          <div className="mx-auto max-w-[1350px]">
            <SectionHeader
              eyebrow="Student Life"
              title={`${city.name} student life is part of the decision.`}
              text="Students should compare lifestyle, housing, transport, food, community and comfort before choosing a city."
            />

            <div className="mt-12 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
              {city.studentLife.map((item, index) => {
                const Icon = lifeIcons[index % lifeIcons.length];

                return (
                  <motion.div
                    key={item.title}
                    initial="hidden"
                    whileInView="show"
                    viewport={{ once: true, amount: 0.2 }}
                    variants={fadeUp}
                    className="rounded-[30px] bg-white/90 p-6 shadow-[0_20px_55px_rgba(9,31,80,0.07)] ring-1 ring-orange-100 transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-1 hover:shadow-[0_28px_70px_rgba(255,75,18,0.13)]"
                  >
                    <div className="mb-5 grid h-14 w-14 place-items-center rounded-2xl bg-[#fff1ea] text-[#ff4b12] ring-1 ring-orange-100">
                      <Icon size={27} strokeWidth={2.6} />
                    </div>
                    <h3 className="text-xl font-black tracking-[-0.035em] text-[#071f50]">
                      {item.title}
                    </h3>
                    <p className="mt-3 text-sm font-semibold leading-7 text-[#61708a]">
                      {item.text}
                    </p>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        <section id="city-fit" className="px-5 py-20">
          <div className="mx-auto max-w-[1350px]">
            <SectionHeader
              eyebrow="City Fit Check"
              title={`Is ${city.name} actually right for you?`}
              text="A famous city is not automatically the right student city. Use this check to challenge your decision before you commit."
            />

            <div className="mt-12 grid gap-5 lg:grid-cols-2">
              <div className="rounded-[34px] bg-emerald-50 p-7 ring-1 ring-emerald-100">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="text-emerald-600" size={28} />
                  <h3 className="text-2xl font-black text-emerald-950">
                    Choose {city.name} if...
                  </h3>
                </div>
                <div className="mt-6 space-y-3">
                  {cityFit.good.map((item) => (
                    <div key={item} className="flex gap-3 rounded-2xl bg-white/80 p-4 text-sm font-bold leading-6 text-emerald-950 ring-1 ring-emerald-100">
                      <CheckCircle2 className="mt-0.5 shrink-0 text-emerald-600" size={18} />
                      {item}
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-[34px] bg-orange-50 p-7 ring-1 ring-orange-100">
                <div className="flex items-center gap-3">
                  <CircleAlert className="text-[#ff4b12]" size={28} />
                  <h3 className="text-2xl font-black text-[#071f50]">
                    Reconsider {city.name} if...
                  </h3>
                </div>
                <div className="mt-6 space-y-3">
                  {cityFit.reconsider.map((item) => (
                    <div key={item} className="flex gap-3 rounded-2xl bg-white/80 p-4 text-sm font-bold leading-6 text-[#071f50] ring-1 ring-orange-100">
                      <CircleAlert className="mt-0.5 shrink-0 text-[#ff4b12]" size={18} />
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-3">
              <div className="rounded-[28px] bg-[#071f50] p-6 text-white">
                <p className="text-[10px] font-black uppercase tracking-[0.15em] text-[#ffb36d]">Best For</p>
                <p className="mt-2 font-black leading-7">{cityFit.profile.bestFor}</p>
              </div>
              <div className="rounded-[28px] bg-white p-6 ring-1 ring-orange-100">
                <p className="text-[10px] font-black uppercase tracking-[0.15em] text-[#ff4b12]">City Pace</p>
                <p className="mt-2 text-xl font-black text-[#071f50]">{cityFit.profile.pace}</p>
              </div>
              <div className="rounded-[28px] bg-white p-6 ring-1 ring-orange-100">
                <p className="text-[10px] font-black uppercase tracking-[0.15em] text-[#ff4b12]">Opportunity Direction</p>
                <p className="mt-2 text-xl font-black text-[#071f50]">{cityFit.profile.opportunity}</p>
              </div>
            </div>
          </div>
        </section>

        <section id="city-roadmap" className="bg-[#fff1ea] px-5 py-20">
          <div className="mx-auto max-w-[1150px]">
            <SectionHeader
              eyebrow={`${city.name} Roadmap`}
              title={`How to plan a ${city.name} study route.`}
              text="A simple planning route from profile checking to university shortlisting, scholarship preparation and visa file readiness."
            />

            <div className="mt-12 overflow-hidden rounded-[34px] bg-white shadow-[0_24px_70px_rgba(9,31,80,0.08)] ring-1 ring-orange-100">
              {city.roadmap.map(([title, text], index) => (
                <div
                  key={title}
                  className="flex gap-5 border-b border-orange-100 p-5 last:border-b-0 md:p-6"
                >
                  <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[#ff4b12] text-sm font-black text-white">
                    {index + 1}
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-[#071f50]">{title}</h3>
                    <p className="mt-1 text-sm font-semibold leading-6 text-[#61708a]">
                      {text}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="px-5 pb-24 pt-10">
          <div className="mx-auto max-w-[1200px] overflow-hidden rounded-[38px] bg-[#071f50] p-6 text-white shadow-[0_30px_90px_rgba(9,31,80,0.18)] md:p-9">
            <div className="grid gap-7 lg:grid-cols-[1fr_auto] lg:items-center">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.2em] text-[#ffb36d]">
                  Study in {city.name}
                </p>
                <h2 className="mt-3 text-3xl font-black tracking-[-0.045em] text-white md:text-5xl">
                  Want to know if {city.name} fits your profile?
                </h2>
                <p className="mt-4 max-w-3xl text-base font-semibold leading-8 text-white/76">
                  We can check university options, budget, scholarship direction, documents and whether {city.name} is worth choosing over other Italian cities.
                </p>
              </div>
              <Link
                to={`/appointment?country=Italy&city=${encodeURIComponent(city.name)}&service=City%20Guidance`}
                className={`inline-flex items-center justify-center gap-3 rounded-full bg-[#ff4b12] px-9 py-5 font-black text-white shadow-[0_20px_44px_rgba(255,75,18,0.3)] hover:-translate-y-1 hover:bg-[#ff642f] focus:outline-none focus-visible:ring-4 focus-visible:ring-orange-200 ${INTERACTIVE_TRANSITION}`}
              >
                Get {city.name} Guidance
                <Plane size={22} strokeWidth={3} />
              </Link>
            </div>
          </div>
        </section>
    </main>
  );
}

export default CityDetailPage;
