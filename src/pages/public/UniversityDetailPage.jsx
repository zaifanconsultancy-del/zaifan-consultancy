import React, { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  BadgePercent,
  BookOpenCheck,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  CircleHelp,
  ClipboardCheck,
  FileCheck2,
  GraduationCap,
  Home,
  Landmark,
  MapPin,
  Route,
  ShieldCheck,
  Sparkles,
  Star,
  Train,
  Wallet,
} from "lucide-react";

import {
  buildUniversityDetail,
  findItalianUniversityBySlug,
  getScholarshipBadge,
  getTuitionBadge,
  italianUniversities,
} from "../../data/italianUniversities";
import Footer from "../../components/public/layout/Footer";
import NotFoundPage from "./NotFoundPage.jsx";

const MOTION = {
  duration: 0.55,
  ease: [0.22, 1, 0.36, 1],
};

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: MOTION.duration, ease: MOTION.ease },
  },
};

const pageSections = [
  "Overview",
  "Quick Facts",
  "Programs",
  "Student Fit",
  "Costs",
  "Scholarships",
  "Requirements",
  "Documents",
  "City Life",
  "Compare",
  "Next Steps",
  "Roadmap",
  "FAQs",
];

const cityFundingBodies = {
  Milan: {
    body: "DSU Lombardia",
    route: "Strong DSU planning route for Milan-based universities.",
    citySlug: "milan",
  },
  Rome: {
    body: "LazioDisco",
    route: "Regional student support route for Rome universities.",
    citySlug: "rome",
  },
  Bologna: {
    body: "ER.GO",
    route: "Important Emilia-Romagna student support route.",
    citySlug: "bologna",
  },
  Padua: {
    body: "Regional + university support",
    route: "Good route for students comparing Padua scholarships and university awards.",
    citySlug: "padua",
  },
  Pisa: {
    body: "DSU Toscana",
    route: "Tuscany regional scholarship route for Pisa students.",
    citySlug: "pisa",
  },
  Florence: {
    body: "DSU Toscana",
    route: "Tuscany scholarship route for Florence-based study plans.",
    citySlug: "florence",
  },
  Turin: {
    body: "EDISU Piemonte",
    route: "Piedmont student support route for Turin universities.",
    citySlug: "turin",
  },
  Venice: {
    body: "Regional + university aid",
    route: "Veneto-based support planning route for Venice students.",
    citySlug: "venice",
  },
};

function buildCitySlug(city = "") {
  return city
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/['’]/g, "")
    .replace(/\s+/g, "-");
}

function buildStudentFit(university) {
  if (!university) return [];

  return [
    `Students interested in ${university.popularFor}`,
    `Students who want to study in ${university.city}`,
    `Students comparing ${university.type.toLowerCase()} university routes in Italy`,
    `Students who want scholarship planning through ${university.scholarship}`,
    `Students who can prepare documents early and track deadlines carefully`,
    "Students who want university choice, city life, costs and visa planning connected together",
  ];
}

function buildAvoidList(university) {
  if (!university) return [];

  return [
    "You want a guaranteed scholarship without checking eligibility, ranking and deadlines",
    "You are choosing only by university name or ranking without checking the course fit",
    `You have not researched living costs and housing options in ${university.city}`,
    "You want to apply late without preparing academic, financial and scholarship documents",
    "You prefer a completely different city style, lifestyle or budget range",
    "You are not ready to compare at least 2-3 alternative universities before deciding",
  ];
}

function buildCareerPathways(university) {
  if (!university) return [];

  return Array.from(
    new Set([
      ...university.programs,
      "Graduate Study",
      "International Career Planning",
      "Italy + Europe Exposure",
    ])
  ).slice(0, 8);
}

function buildScorecard(university) {
  if (!university) return [];

  const costScore =
    university.tuitionLevel === "Budget"
      ? "8/10"
      : university.tuitionLevel === "Moderate"
        ? "7/10"
        : "5/10";

  const scholarshipScore =
    university.scholarshipStrength === "Excellent"
      ? "9/10"
      : university.scholarshipStrength === "Good"
        ? "8/10"
        : "6/10";

  const careerScore =
    university.city === "Milan"
      ? "10/10"
      : ["Rome", "Turin", "Bologna"].includes(university.city)
        ? "9/10"
        : "8/10";

  return [
    ["Scholarship Potential", scholarshipScore],
    ["Tuition Value", costScore],
    ["Career Exposure", careerScore],
    ["International Student Fit", "8/10"],
    ["Document Planning Need", "High"],
    ["City Research Importance", "High"],
  ];
}

function buildScholarshipMatch(university) {
  if (!university) return [];

  const regional = cityFundingBodies[university.city];

  return [
    {
      title: "DSU / Regional Route",
      value: regional?.body || university.scholarship,
      text:
        regional?.route ||
        "Italy scholarship planning depends on the region, university, documents and deadlines.",
      strength:
        university.scholarshipStrength === "Excellent"
          ? "Very Strong"
          : university.scholarshipStrength === "Good"
            ? "Strong"
            : "Needs Review",
      icon: BadgePercent,
    },
    {
      title: "University Awards",
      value: university.scholarship,
      text: "Check whether this university has merit awards, tuition reductions, department benefits or course-based funding.",
      strength: "Profile Based",
      icon: Landmark,
    },
    {
      title: "Document Readiness",
      value: "High Priority",
      text: "Income, family, property, identity and legalization documents should be planned before scholarship windows become urgent.",
      strength: "Critical",
      icon: FileCheck2,
    },
    {
      title: "Backup Funding Plan",
      value: "Required",
      text: "Students should never build the full Italy plan on guaranteed scholarship support. A backup budget keeps the plan realistic.",
      strength: "Important",
      icon: ShieldCheck,
    },
  ];
}

function buildCostReality(university) {
  if (!university) return [];

  const regional = cityFundingBodies[university.city];

  return [
    {
      label: "Tuition Direction",
      value: university.tuition,
      note: `${getTuitionBadge(university.tuitionLevel)}. Final tuition depends on course, intake and university rules.`,
    },
    {
      label: "Living Cost Pressure",
      value: ["Milan", "Rome", "Venice"].includes(university.city)
        ? "Higher"
        : "Moderate",
      note: `${university.city} should be compared with other cities before finalizing the plan.`,
    },
    {
      label: "Scholarship Route",
      value: regional?.body || university.scholarship,
      note: "Regional route must be checked with current deadlines and document requirements.",
    },
    {
      label: "Budget Safety",
      value: university.tuitionLevel === "Budget" ? "Better Value" : "Needs Planning",
      note: "A strong plan includes tuition, rent, food, transport, visa proof and emergency margin.",
    },
  ];
}

function buildNextSteps(university) {
  if (!university) return [];

  return [
    {
      title: "Check Program Fit",
      text: `Confirm that ${university.name} actually offers the right course, language, entry route and intake for your profile.`,
      cta: "View Programs",
      targetId: "university-programs",
      icon: BookOpenCheck,
    },
    {
      title: "Check Scholarship Route",
      text: `Match ${university.city} with its regional funding system and prepare scholarship documents early.`,
      cta: "View Scholarships",
      targetId: "university-scholarships",
      icon: BadgePercent,
    },
    {
      title: "Explore City Fit",
      text: `Understand rent, transport, student life and comfort level in ${university.city} before finalizing this university.`,
      cta: "Explore City",
      href: `/countries/italy/${buildCitySlug(university.city)}`,
      icon: MapPin,
    },
    {
      title: "Book Strategy Session",
      text: "Get profile-based guidance before spending time, money and effort on the wrong application route.",
      cta: "Book Consultation",
      href: `/appointment?country=Italy&university=${encodeURIComponent(
        university.name
      )}&city=${encodeURIComponent(university.city)}&service=University Application Plan`,
      icon: Sparkles,
    },
  ];
}

function getComparisonLabel(item, currentUniversity) {
  if (item.city === currentUniversity.city) return "Same City Alternative";
  if (item.scholarshipStrength === "Excellent") return "Scholarship Alternative";
  if (item.tuitionLevel === "Budget") return "Budget Alternative";
  if (item.type === currentUniversity.type) return "Similar Type";
  return "Related Route";
}

function UniversityDetailPage() {
  const { slug } = useParams();
  const university = findItalianUniversityBySlug(slug);
  const detail = buildUniversityDetail(university);
  const [openFaq, setOpenFaq] = useState(0);
  const shouldReduceMotion = useReducedMotion();

  const faqs = useMemo(() => {
    if (!university) return [];

    return [
      {
        q: `Is ${university.name} good for international students?`,
        a: `${university.name} can be a strong option if the course, city, tuition, scholarship possibility and admission requirements match your profile. Final fit should be checked before applying.`,
      },
      {
        q: `Can I get a scholarship at ${university.name}?`,
        a: `Scholarship possibilities depend on the university, region, student profile, deadlines and documents. DSU or regional support may be relevant in Italy, but no scholarship should be treated as guaranteed.`,
      },
      {
        q: `What documents do I need for ${university.name}?`,
        a: `Usually students should prepare academic documents, passport, transcripts, certificates, language proof where required, CV or motivation documents if needed, and scholarship/financial documents where relevant.`,
      },
      {
        q: `Is ${university.city} expensive for students?`,
        a: `Living cost depends heavily on accommodation, lifestyle and city. ${university.city} should be compared with other Italian student cities before finalizing the university choice.`,
      },
      {
        q: "When should I start preparing?",
        a: "Start early. Italy applications, scholarship documents, pre-enrolment and visa preparation can take time, and late planning creates avoidable risk.",
      },
    ];
  }, [university]);

  const studentFitItems = useMemo(() => buildStudentFit(university), [university]);
  const avoidItems = useMemo(() => buildAvoidList(university), [university]);
  const careerPathways = useMemo(() => buildCareerPathways(university), [university]);
  const scorecardItems = useMemo(() => buildScorecard(university), [university]);
  const scholarshipMatch = useMemo(() => buildScholarshipMatch(university), [university]);
  const costReality = useMemo(() => buildCostReality(university), [university]);
  const nextSteps = useMemo(() => buildNextSteps(university), [university]);

  const relatedUniversities = useMemo(() => {
    if (!university) return [];

    return italianUniversities
      .filter((item) => {
        if (item.slug === university.slug) return false;

        const sameCity = item.city === university.city;
        const sameType = item.type === university.type;
        const sharedPrograms = item.programs.some((program) =>
          university.programs.includes(program)
        );
        const scholarshipAlternative =
          item.scholarshipStrength === "Excellent" &&
          university.scholarshipStrength !== "Excellent";
        const budgetAlternative =
          item.tuitionLevel === "Budget" && university.tuitionLevel !== "Budget";

        return (
          sameCity ||
          sameType ||
          sharedPrograms ||
          scholarshipAlternative ||
          budgetAlternative
        );
      })
      .sort((a, b) => {
        const score = (item) => {
          let value = 0;
          if (item.city === university.city) value += 5;
          if (item.scholarshipStrength === "Excellent") value += 4;
          if (item.tuitionLevel === "Budget") value += 3;
          if (item.type === university.type) value += 2;
          value += item.programs.filter((program) =>
            university.programs.includes(program)
          ).length;
          return value;
        };

        return score(b) - score(a);
      })
      .slice(0, 3);
  }, [university]);

  const cityGuideHref = `/countries/italy/${buildCitySlug(university?.city)}`;
  const regionalFunding = cityFundingBodies[university?.city];

  if (!university || !detail) {
    return <NotFoundPage />;
  }

  const scrollToId = (id) => {
    const target = document.getElementById(id);
    if (!target) return;
    const y = target.getBoundingClientRect().top + window.scrollY - 96;
    window.scrollTo({ top: y, behavior: shouldReduceMotion ? "auto" : "smooth" });
  };

  const appointmentHref = `/appointment?country=Italy&university=${encodeURIComponent(
    university.name
  )}&city=${encodeURIComponent(university.city)}&service=University Guidance`;

  return (
    <>
      <main className="relative overflow-hidden bg-[#fff7ed] pt-28 text-[#071b3a]">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_76%_8%,rgba(255,110,28,0.16),transparent_30%),radial-gradient(circle_at_12%_80%,rgba(255,172,92,0.16),transparent_28%)]" />
        <div className="pointer-events-none absolute left-[-140px] top-20 h-96 w-96 rounded-full bg-orange-300/20 blur-3xl" />
        <div className="pointer-events-none absolute right-[-140px] bottom-28 h-96 w-96 rounded-full bg-[#ff4b12]/10 blur-3xl" />

        <section className="relative mx-auto max-w-[1500px] px-4 pb-10 sm:px-6 lg:px-10">
          <Link
            to="/universities"
            className="mb-5 inline-flex items-center gap-2 rounded-full bg-white/90 px-4 py-2 text-xs font-black text-orange-600 shadow-sm ring-1 ring-orange-100 transition hover:-translate-y-0.5 hover:bg-orange-50"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to all universities
          </Link>

          <div className="grid gap-6 lg:grid-cols-[1fr_430px] lg:items-stretch">
            <motion.div
              initial={shouldReduceMotion ? false : { opacity: 0, x: -24 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: MOTION.duration, ease: MOTION.ease }}
              className="h-full overflow-hidden rounded-[2.7rem] border border-orange-100 bg-white shadow-[0_28px_85px_rgba(15,23,42,0.09)]"
            >
              <div className="relative h-full min-h-[500px] overflow-hidden bg-gradient-to-br from-orange-100 via-white to-emerald-50">
                <img
                  src={university.image}
                  alt={`${university.name} Italy university`}
                  decoding="async"
                  fetchPriority="high"
                  className="absolute inset-0 h-full w-full object-cover object-center"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-[#071b3a]/90 via-[#071b3a]/64 to-[#071b3a]/20" />

                <div className="relative z-10 flex h-full min-h-[500px] flex-col justify-end p-6 text-white sm:p-8 lg:p-10">
                  <div className="mb-4 flex flex-wrap gap-2">
                    <span className="rounded-full bg-white/95 px-4 py-2 text-xs font-black text-orange-600 shadow-md">
                      {university.rank} Italy Choice
                    </span>
                    <span className="rounded-full bg-orange-500 px-4 py-2 text-xs font-black text-white shadow-md">
                      {university.type}
                    </span>
                    <span className="rounded-full bg-white/15 px-4 py-2 text-xs font-black text-white ring-1 ring-white/20">
                      🇮🇹 Italy University
                    </span>
                  </div>

                  <h1 className="max-w-5xl text-4xl font-black leading-[1.01] tracking-[-0.055em] sm:text-6xl lg:text-7xl">
                    {university.name}
                  </h1>

                  <div className="mt-5 flex flex-wrap items-center gap-4 text-sm font-black text-white/90">
                    <span className="inline-flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      {university.city}, {university.region}
                    </span>
                    <span className="inline-flex items-center gap-2">
                      <CalendarDays className="h-4 w-4" />
                      {university.intake}
                    </span>
                    <span className="inline-flex items-center gap-2">
                      <Wallet className="h-4 w-4" />
                      {university.tuition}
                    </span>
                  </div>

                  <p className="mt-6 max-w-3xl text-base font-semibold leading-8 text-white/90">
                    {detail.overview}
                  </p>
                </div>
              </div>
            </motion.div>

            <motion.aside
              initial={shouldReduceMotion ? false : { opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: MOTION.duration, ease: MOTION.ease }}
              className="rounded-[2.7rem] border border-orange-100 bg-white/94 p-6 shadow-[0_28px_85px_rgba(15,23,42,0.09)] backdrop-blur"
            >
              <p className="text-xs font-black uppercase tracking-[0.18em] text-orange-600">
                Quick decision card
              </p>
              <h2 className="mt-3 text-3xl font-black leading-tight tracking-[-0.04em]">
                Is this university right for you?
              </h2>

              <div className="mt-5 space-y-3">
                <DecisionRow icon={GraduationCap} label="Best For" value={university.popularFor} />
                <DecisionRow icon={Wallet} label="Tuition" value={university.tuition} />
                <DecisionRow icon={BadgePercent} label="Scholarship" value={university.scholarship} />
                <DecisionRow icon={Landmark} label="Type" value={university.type} />
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                <span className="rounded-full bg-green-50 px-3 py-1.5 text-[11px] font-black text-green-700 ring-1 ring-green-100">
                  {getTuitionBadge(university.tuitionLevel)}
                </span>
                <span className="rounded-full bg-orange-50 px-3 py-1.5 text-[11px] font-black text-orange-700 ring-1 ring-orange-100">
                  {getScholarshipBadge(university.scholarshipStrength)}
                </span>
              </div>

              <Link
                to={appointmentHref}
                className="mt-6 inline-flex w-full items-center justify-center gap-3 rounded-full bg-orange-600 px-7 py-4 text-sm font-black text-white shadow-[0_16px_34px_rgba(234,88,12,0.24)] transition hover:-translate-y-1 hover:bg-orange-700"
              >
                Get Guidance For This University
                <ArrowRight className="h-4 w-4" />
              </Link>

              <div className="mt-5 rounded-[1.8rem] bg-[#071f50] p-5 text-white">
                <div className="flex gap-3">
                  <ShieldCheck className="mt-1 shrink-0 text-[#ffb36d]" />
                  <div>
                    <h3 className="font-black">Honest guidance note</h3>
                    <p className="mt-2 text-sm font-semibold leading-6 text-white/72">
                      Program availability, scholarship rules and deadlines must be verified before application.
                    </p>
                  </div>
                </div>
              </div>
            </motion.aside>
          </div>

          <div className="mt-6 rounded-[2rem] bg-white/88 p-4 shadow-[0_18px_48px_rgba(15,23,42,0.07)] ring-1 ring-orange-100">
            <div className="flex flex-wrap gap-2">
              {pageSections.map((item) => {
                const id = `university-${item.toLowerCase().replace(/\s+/g, "-")}`;
                return (
                  <button
                    key={item}
                    type="button"
                    onClick={() => scrollToId(id)}
                    className="rounded-full bg-[#fff8f1] px-4 py-2 text-xs font-black text-[#071b3a] ring-1 ring-orange-100 transition hover:-translate-y-0.5 hover:bg-orange-50 hover:text-orange-600"
                  >
                    {item}
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        <section id="university-overview" className="relative px-4 py-10 sm:px-6 lg:px-10">
          <div className="mx-auto grid max-w-[1500px] gap-5 lg:grid-cols-[1fr_0.85fr]">
            <ContentCard title="Why choose this university?" icon={Sparkles}>
              <div className="grid gap-3 md:grid-cols-2">
                {detail.whyChoose.map((item) => (
                  <CheckItem key={item}>{item}</CheckItem>
                ))}
              </div>
            </ContentCard>

            <ContentCard title="University snapshot" icon={Building2}>
              <div className="grid gap-3 sm:grid-cols-2">
                <InfoBox label="Country" value="Italy" />
                <InfoBox label="City" value={university.city} />
                <InfoBox label="Region" value={university.region} />
                <InfoBox label="Intake" value={university.intake} />
              </div>
            </ContentCard>
          </div>
        </section>

        <section id="university-quick-facts" className="relative px-4 py-10 sm:px-6 lg:px-10">
          <div className="mx-auto max-w-[1500px]">
            <SectionTitle
              badge="Quick Facts"
              title="A fast profile check before deeper planning."
              text="These cards help students quickly understand the basic fit before moving into programs, cost, documents and application planning."
            />

            <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <FactCard icon={MapPin} label="Location" value={`${university.city}, ${university.region}`} />
              <FactCard icon={Landmark} label="University Type" value={university.type} />
              <FactCard icon={Wallet} label="Tuition Direction" value={university.tuition} />
              <FactCard icon={BadgePercent} label="Scholarship Direction" value={university.scholarship} />
            </div>
          </div>
        </section>

        <section id="university-programs" className="relative px-4 py-10 sm:px-6 lg:px-10">
          <div className="mx-auto grid max-w-[1500px] gap-5 lg:grid-cols-[0.95fr_1.05fr]">
            <ContentCard title="Popular programs" icon={BookOpenCheck}>
              <div className="flex flex-wrap gap-2">
                {university.programs.map((program) => (
                  <span
                    key={program}
                    className="rounded-full bg-orange-50 px-4 py-2 text-sm font-black text-orange-700 ring-1 ring-orange-100"
                  >
                    {program}
                  </span>
                ))}
              </div>
              <p className="mt-4 text-sm font-semibold leading-6 text-slate-600">
                Program availability, language, entry requirements and deadlines can change by intake.
              </p>
            </ContentCard>

            <ContentCard title="Best-fit student profile" icon={ClipboardCheck}>
              <div className="grid gap-3 md:grid-cols-2">
                <CheckItem>Students interested in {university.popularFor}</CheckItem>
                <CheckItem>Students comparing affordable European public university routes</CheckItem>
                <CheckItem>Students who can prepare documents early</CheckItem>
                <CheckItem>Students who want Italy city + scholarship planning together</CheckItem>
              </div>
            </ContentCard>
          </div>
        </section>

        <section id="university-student-fit" className="relative px-4 py-10 sm:px-6 lg:px-10">
          <div className="mx-auto grid max-w-[1500px] gap-5 lg:grid-cols-[1fr_0.9fr]">
            <ContentCard title="Perfect for students who..." icon={CheckCircle2}>
              <div className="grid gap-3 md:grid-cols-2">
                {studentFitItems.map((item) => (
                  <CheckItem key={item}>{item}</CheckItem>
                ))}
              </div>
            </ContentCard>

            <ContentCard title="Avoid this route if..." icon={ShieldCheck}>
              <div className="grid gap-3">
                {avoidItems.map((item) => (
                  <WarningItem key={item}>{item}</WarningItem>
                ))}
              </div>
            </ContentCard>
          </div>

          <div className="mx-auto mt-5 grid max-w-[1500px] gap-5 lg:grid-cols-[0.95fr_1.05fr]">
            <ContentCard title="Student life scorecard" icon={Star}>
              <div className="grid gap-3 sm:grid-cols-2">
                {scorecardItems.map(([label, value]) => (
                  <ScoreRow key={label} label={label} value={value} />
                ))}
              </div>
            </ContentCard>

            <ContentCard title="Career pathways this route can support" icon={BriefcaseBusiness}>
              <div className="flex flex-wrap gap-2">
                {careerPathways.map((pathway) => (
                  <span
                    key={pathway}
                    className="rounded-full bg-orange-50 px-4 py-2 text-sm font-black text-orange-700 ring-1 ring-orange-100"
                  >
                    {pathway}
                  </span>
                ))}
              </div>

              <p className="mt-4 text-sm font-semibold leading-7 text-slate-600">
                Career direction depends on the exact program, language, internships, portfolio, networking, city exposure and the student's effort after arrival.
              </p>
            </ContentCard>
          </div>
        </section>

        <section id="university-costs" className="relative px-4 py-10 sm:px-6 lg:px-10">
          <div className="mx-auto max-w-[1500px]">
            <ContentCard title="Estimated cost & scholarship snapshot" icon={Wallet}>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {detail.costNotes.map(([label, value]) => (
                  <InfoBox key={label} label={label} value={value} />
                ))}
              </div>

              <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                {costReality.map((item) => (
                  <div
                    key={item.label}
                    className="rounded-[1.6rem] bg-[#071f50] p-5 text-white ring-1 ring-white/10"
                  >
                    <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#ffb36d]">
                      {item.label}
                    </p>
                    <h3 className="mt-2 text-xl font-black">{item.value}</h3>
                    <p className="mt-3 text-xs font-semibold leading-6 text-white/72">
                      {item.note}
                    </p>
                  </div>
                ))}
              </div>
            </ContentCard>
          </div>
        </section>

        <section id="university-scholarships" className="relative bg-[#071f50] px-4 py-16 text-white sm:px-6 lg:px-10">
          <div className="mx-auto grid max-w-[1500px] gap-7 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-[#ffb36d] ring-1 ring-white/10">
                <BadgePercent size={15} />
                Scholarship planning
              </span>

              <h2 className="mt-5 text-4xl font-black leading-[0.98] tracking-[-0.055em] text-white md:text-6xl">
                Scholarship planning must start before deadlines.
              </h2>

              <p className="mt-5 text-base font-semibold leading-8 text-white/74">
                Italy scholarship support can depend on regional rules, university process, student profile, financial documents and deadlines. Treat this as a planning route, not a guaranteed outcome.
              </p>

              <div className="mt-6 rounded-[1.8rem] bg-white/10 p-5 ring-1 ring-white/10">
                <p className="text-xs font-black uppercase tracking-[0.16em] text-[#ffb36d]">
                  Connected regional route
                </p>
                <h3 className="mt-2 text-2xl font-black text-white">
                  {regionalFunding?.body || university.scholarship}
                </h3>
                <p className="mt-2 text-sm font-semibold leading-7 text-white/72">
                  {regionalFunding?.route ||
                    "Scholarship route must be verified against the university city, region and current application window."}
                </p>
              </div>

              <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                <Link
                  to={`/appointment?country=Italy&university=${encodeURIComponent(
                    university.name
                  )}&service=Scholarships and Funding`}
                  className="inline-flex items-center justify-center gap-3 rounded-full bg-[#ff4b12] px-8 py-5 font-black text-white shadow-[0_20px_44px_rgba(255,75,18,0.3)] transition hover:-translate-y-1 hover:bg-[#ff642f]"
                >
                  Plan Scholarship File
                  <ArrowRight size={21} strokeWidth={3} />
                </Link>

                <Link
                  to="/scholarships"
                  className="inline-flex items-center justify-center gap-3 rounded-full bg-white/10 px-8 py-5 font-black text-white ring-1 ring-white/10 transition hover:-translate-y-1 hover:bg-white/14"
                >
                  Open Scholarship Hub
                  <ArrowRight size={21} strokeWidth={3} />
                </Link>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {scholarshipMatch.map((item) => (
                <div
                  key={item.title}
                  className="rounded-[1.6rem] bg-white/10 p-5 text-sm font-bold leading-7 text-white/86 ring-1 ring-white/10"
                >
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <div className="grid h-12 w-12 place-items-center rounded-2xl bg-white/10 text-[#ffb36d] ring-1 ring-white/10">
                      <item.icon className="h-6 w-6" />
                    </div>
                    <span className="rounded-full bg-white/10 px-3 py-1 text-[10px] font-black uppercase tracking-wide text-[#ffb36d] ring-1 ring-white/10">
                      {item.strength}
                    </span>
                  </div>

                  <p className="text-xs font-black uppercase tracking-[0.14em] text-[#ffb36d]">
                    {item.title}
                  </p>
                  <h3 className="mt-2 text-xl font-black text-white">
                    {item.value}
                  </h3>
                  <p className="mt-3 text-sm font-semibold leading-7 text-white/72">
                    {item.text}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="university-requirements" className="relative px-4 py-12 sm:px-6 lg:px-10">
          <div className="mx-auto grid max-w-[1500px] gap-5 lg:grid-cols-2">
            <ContentCard title="General admission requirements" icon={GraduationCap}>
              <div className="grid gap-2">
                {detail.requirements.map((item) => (
                  <CheckItem key={item}>{item}</CheckItem>
                ))}
              </div>
            </ContentCard>

            <ContentCard title="Documents usually needed" icon={FileCheck2}>
              <div className="grid gap-2">
                {detail.documents.map((item) => (
                  <CheckItem key={item}>{item}</CheckItem>
                ))}
              </div>
            </ContentCard>
          </div>
        </section>

        <section id="university-documents" className="relative px-4 py-10 sm:px-6 lg:px-10">
          <div className="mx-auto max-w-[1500px] rounded-[2.5rem] bg-white/90 p-6 shadow-[0_24px_70px_rgba(15,23,42,0.08)] ring-1 ring-orange-100 lg:p-8">
            <div className="grid gap-7 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
              <div>
                <span className="inline-flex items-center gap-2 rounded-full bg-orange-50 px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-orange-600 ring-1 ring-orange-100">
                  <FileCheck2 size={15} />
                  Document strategy
                </span>
                <h2 className="mt-5 text-4xl font-black leading-tight tracking-[-0.05em]">
                  Strong applications are built before the deadline.
                </h2>
                <p className="mt-4 text-sm font-semibold leading-7 text-slate-600">
                  The biggest student mistake is waiting until the portal opens. Academic, identity, language, financial and scholarship documents should be checked early.
                </p>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <CheckItem>Academic records and transcripts</CheckItem>
                <CheckItem>Passport and identity documents</CheckItem>
                <CheckItem>Language or course-specific proof where required</CheckItem>
                <CheckItem>Scholarship and financial documents where relevant</CheckItem>
              </div>
            </div>
          </div>
        </section>

        <section id="university-city-life" className="relative bg-white/52 px-4 py-16 sm:px-6 lg:px-10">
          <div className="mx-auto max-w-[1500px]">
            <SectionTitle
              badge="City Life"
              title={`Living as a student in ${university.city}.`}
              text="University choice is not only about rankings. The city affects rent, lifestyle, transport, part-time possibilities, comfort and student experience."
            />

            <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <FactCard icon={Home} label="Accommodation" value="Dorms, shared rooms or private rentals depending on availability" />
              <FactCard icon={Train} label="Transport" value="Plan city transport and regional travel before arrival" />
              <FactCard icon={BriefcaseBusiness} label="Part-time Work" value="Possible for many students, but should not be your only budget plan" />
              <FactCard icon={MapPin} label="City Fit" value={`${university.city} should match your budget and lifestyle`} />
            </div>

            <div className="mt-8 rounded-[2rem] bg-white/92 p-6 shadow-[0_18px_55px_rgba(15,23,42,0.07)] ring-1 ring-orange-100">
              <div className="grid gap-5 lg:grid-cols-[1fr_auto] lg:items-center">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-orange-600">
                    Connected City Guide
                  </p>
                  <h3 className="mt-2 text-2xl font-black tracking-[-0.04em] text-[#071b3a]">
                    Explore student life in {university.city}
                  </h3>
                  <p className="mt-3 text-sm font-semibold leading-7 text-slate-600">
                    University choice and city choice go together. Compare living costs, accommodation, transport, student lifestyle, scholarship routes and local opportunities before finalizing {university.name}.
                  </p>
                </div>

                <Link
                  to={cityGuideHref}
                  className="inline-flex items-center justify-center gap-3 rounded-full bg-orange-600 px-8 py-4 text-sm font-black text-white shadow-[0_16px_34px_rgba(234,88,12,0.22)] transition hover:-translate-y-1 hover:bg-orange-700"
                >
                  Explore {university.city}
                  <ArrowRight size={18} strokeWidth={3} />
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section id="university-compare" className="relative px-4 py-12 sm:px-6 lg:px-10">
          <div className="mx-auto max-w-[1500px]">
            <SectionTitle
              badge="Compare Options"
              title="Students also compare these universities."
              text="The right university choice usually comes from comparing similar routes by city, program, tuition, scholarship direction and student lifestyle."
            />

            <div className="mt-8 grid gap-4 md:grid-cols-3">
              {relatedUniversities.map((item) => (
                <Link
                  key={item.slug}
                  to={`/universities/${item.slug}`}
                  className="group overflow-hidden rounded-[2rem] bg-white shadow-[0_18px_55px_rgba(15,23,42,0.07)] ring-1 ring-orange-100 transition hover:-translate-y-1 hover:shadow-[0_26px_65px_rgba(255,91,18,0.14)]"
                >
                  <div className="relative h-40 overflow-hidden bg-orange-50">
                    <img
                      src={item.image}
                      alt={`${item.name} Italy university`}
                      loading="lazy"
                      decoding="async"
                      className="h-full w-full object-cover transition duration-700 ease-out group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#071b3a]/82 via-[#071b3a]/25 to-transparent" />
                    <div className="absolute left-4 top-4 rounded-full bg-white/95 px-3 py-1 text-[10px] font-black text-orange-600 shadow-md">
                      {getComparisonLabel(item, university)}
                    </div>
                    <div className="absolute bottom-4 left-4 right-4">
                      <h3 className="line-clamp-2 text-xl font-black leading-tight text-white">
                        {item.name}
                      </h3>
                      <p className="mt-1 text-xs font-black text-white/88">
                        {item.city}, {item.region}
                      </p>
                    </div>
                  </div>

                  <div className="p-5">
                    <p className="text-sm font-semibold leading-6 text-slate-600">
                      {item.popularFor}
                    </p>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <span className="rounded-full bg-green-50 px-3 py-1 text-[10px] font-black text-green-700 ring-1 ring-green-100">
                        {getTuitionBadge(item.tuitionLevel)}
                      </span>
                      <span className="rounded-full bg-orange-50 px-3 py-1 text-[10px] font-black text-orange-700 ring-1 ring-orange-100">
                        {getScholarshipBadge(item.scholarshipStrength)}
                      </span>
                    </div>

                    <div className="mt-5 inline-flex items-center gap-2 text-sm font-black text-orange-600">
                      View University
                      <ArrowRight size={16} strokeWidth={3} />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section id="university-next-steps" className="relative bg-[#fff1ea] px-4 py-16 sm:px-6 lg:px-10">
          <div className="mx-auto max-w-[1450px]">
            <SectionTitle
              badge="Next Steps"
              title={`What should you do after viewing ${university.name}?`}
              text="This turns the university page into a guided decision journey instead of a dead-end information page."
            />

            <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {nextSteps.map((step, index) => (
                <div
                  key={step.title}
                  className="rounded-[2rem] bg-white p-6 shadow-[0_18px_55px_rgba(15,23,42,0.07)] ring-1 ring-orange-100"
                >
                  <div className="mb-5 flex items-center justify-between gap-3">
                    <div className="grid h-14 w-14 place-items-center rounded-2xl bg-orange-50 text-orange-600">
                      <step.icon className="h-6 w-6" />
                    </div>
                    <span className="text-4xl font-black tracking-[-0.06em] text-orange-100">
                      0{index + 1}
                    </span>
                  </div>

                  <h3 className="text-xl font-black tracking-[-0.035em] text-[#071b3a]">
                    {step.title}
                  </h3>
                  <p className="mt-3 text-sm font-semibold leading-7 text-slate-600">
                    {step.text}
                  </p>

                  {step.href ? (
                    <Link
                      to={step.href}
                      className="mt-5 inline-flex items-center gap-2 rounded-full bg-orange-600 px-5 py-3 text-xs font-black text-white transition hover:-translate-y-1 hover:bg-orange-700"
                    >
                      {step.cta}
                      <ArrowRight size={15} strokeWidth={3} />
                    </Link>
                  ) : (
                    <button
                      type="button"
                      onClick={() => scrollToId(step.targetId)}
                      className="mt-5 inline-flex items-center gap-2 rounded-full bg-orange-600 px-5 py-3 text-xs font-black text-white transition hover:-translate-y-1 hover:bg-orange-700"
                    >
                      {step.cta}
                      <ArrowRight size={15} strokeWidth={3} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="university-roadmap" className="relative px-4 py-16 sm:px-6 lg:px-10">
          <div className="mx-auto max-w-[1200px]">
            <SectionTitle
              badge="Application Roadmap"
              title={`How to prepare for ${university.name}.`}
              text="A simple student journey from profile checking to application and visa preparation."
            />

            <div className="mt-8 overflow-hidden rounded-[2rem] bg-white shadow-[0_24px_70px_rgba(15,23,42,0.08)] ring-1 ring-orange-100">
              {detail.timeline.map(([title, text], index) => (
                <div key={title} className="flex gap-5 border-b border-orange-100 p-5 last:border-b-0 md:p-6">
                  <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-orange-600 text-sm font-black text-white">
                    {index + 1}
                  </div>
                  <div>
                    <p className="text-lg font-black">{title}</p>
                    <p className="mt-1 text-sm font-semibold leading-6 text-slate-600">{text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="university-faqs" className="relative px-4 py-16 sm:px-6 lg:px-10">
          <div className="mx-auto max-w-[1050px]">
            <SectionTitle
              badge="FAQs"
              title="Questions students usually ask before applying."
              text="These answers are a safe starting point. Final advice should always be checked against the latest university and visa process."
            />

            <div className="mt-8 space-y-3">
              {faqs.map((faq, index) => {
                const isOpen = openFaq === index;

                return (
                  <div
                    key={faq.q}
                    className="overflow-hidden rounded-[1.6rem] bg-white shadow-[0_16px_42px_rgba(9,31,80,0.06)] ring-1 ring-orange-100"
                  >
                    <button
                      type="button"
                      onClick={() => setOpenFaq(isOpen ? -1 : index)}
                      aria-expanded={isOpen}
                      aria-controls={`university-faq-panel-${index}`}
                      className="flex w-full items-center justify-between gap-4 px-5 py-5 text-left font-black text-[#071f50] transition-colors duration-300 hover:bg-orange-50/60 focus:outline-none focus-visible:ring-4 focus-visible:ring-inset focus-visible:ring-orange-100 md:px-6"
                    >
                      <span className="flex items-center gap-3">
                        <CircleHelp className="text-orange-600" size={21} />
                        {faq.q}
                      </span>
                      <ChevronDown
                        className={`shrink-0 text-orange-600 transition-transform duration-300 ${
                          isOpen ? "rotate-180" : ""
                        }`}
                      />
                    </button>

                    <AnimatePresence initial={false}>
                      {isOpen && (
                        <motion.div
                          id={`university-faq-panel-${index}`}
                          initial={shouldReduceMotion ? false : { height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{
                            duration: shouldReduceMotion ? 0 : 0.35,
                            ease: MOTION.ease,
                          }}
                          className="overflow-hidden"
                        >
                          <p className="px-5 pb-5 text-sm font-semibold leading-7 text-slate-600 md:px-6">
                            {faq.a}
                          </p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section className="relative px-4 pb-20 sm:px-6 lg:px-10">
          <div className="mx-auto max-w-[1300px] overflow-hidden rounded-[2.4rem] bg-gradient-to-r from-[#ff7b1c] via-[#ff4b12] to-[#ff7b1c] p-6 text-white shadow-[0_24px_70px_rgba(255,75,18,0.24)] sm:p-8">
            <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-white/75">
                  Want to apply smartly?
                </p>
                <h2 className="mt-2 text-3xl font-black leading-tight tracking-[-0.04em] md:text-5xl">
                  Build your {university.name} plan.
                </h2>
                <p className="mt-3 max-w-3xl text-sm font-semibold leading-7 text-white/90">
                  We can check program fit, scholarship direction, documents, deadline risk, city fit and visa preparation.
                </p>
              </div>

              <Link
                to={`/appointment?country=Italy&university=${encodeURIComponent(
                  university.name
                )}&city=${encodeURIComponent(
                  university.city
                )}&service=University Application Plan`}
                className="inline-flex shrink-0 items-center justify-center gap-3 rounded-full bg-[#071f50] px-7 py-4 text-sm font-black text-white shadow-[0_18px_38px_rgba(7,31,80,0.26)] transition hover:-translate-y-1 hover:bg-[#092b72]"
              >
                Book University Consultation
                <Star className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}

function SectionTitle({ badge, title, text }) {
  return (
    <div className="mx-auto max-w-4xl text-center">
      <span className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-orange-600 shadow-sm ring-1 ring-orange-100">
        <Route size={15} />
        {badge}
      </span>
      <h2 className="mt-5 text-4xl font-black leading-[0.98] tracking-[-0.055em] text-[#071f50] md:text-6xl">
        {title}
      </h2>
      {text && (
        <p className="mx-auto mt-5 max-w-3xl text-base font-semibold leading-8 text-slate-600 md:text-lg">
          {text}
        </p>
      )}
    </div>
  );
}

function DecisionRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-[#fff8f1] p-4 ring-1 ring-orange-100">
      <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-orange-50 text-orange-600">
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-[10px] font-black uppercase tracking-wide text-orange-600">
          {label}
        </p>
        <p className="mt-1 text-sm font-black text-[#071b3a]">{value}</p>
      </div>
    </div>
  );
}

function ContentCard({ title, icon: Icon, children }) {
  return (
    <motion.section
      variants={fadeUp}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.18 }}
      className="rounded-[2rem] border border-orange-100 bg-white/92 p-6 shadow-[0_18px_55px_rgba(15,23,42,0.07)]"
    >
      <div className="mb-5 flex items-center gap-3">
        <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-orange-50 text-orange-600">
          <Icon className="h-6 w-6" />
        </div>
        <h2 className="text-2xl font-black tracking-[-0.035em]">{title}</h2>
      </div>
      {children}
    </motion.section>
  );
}

function CheckItem({ children }) {
  return (
    <div className="flex items-start gap-3 rounded-2xl bg-[#fff8f1] p-4 text-sm font-bold leading-6 text-slate-700 ring-1 ring-orange-100">
      <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-orange-600" />
      {children}
    </div>
  );
}

function InfoBox({ label, value }) {
  return (
    <div className="rounded-2xl bg-[#fff8f1] p-4 ring-1 ring-orange-100">
      <p className="text-[10px] font-black uppercase tracking-wide text-orange-600">
        {label}
      </p>
      <p className="mt-2 text-base font-black text-[#071b3a]">{value}</p>
    </div>
  );
}

function FactCard({ icon: Icon, label, value }) {
  return (
    <motion.div
      variants={fadeUp}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.18 }}
      className="rounded-[2rem] bg-white/92 p-6 shadow-[0_18px_55px_rgba(15,23,42,0.07)] ring-1 ring-orange-100"
    >
      <div className="mb-5 grid h-14 w-14 place-items-center rounded-2xl bg-orange-50 text-orange-600">
        <Icon className="h-6 w-6" />
      </div>
      <p className="text-xs font-black uppercase tracking-[0.16em] text-orange-600">
        {label}
      </p>
      <h3 className="mt-2 text-lg font-black leading-tight text-[#071b3a]">
        {value}
      </h3>
    </motion.div>
  );
}

function WarningItem({ children }) {
  return (
    <div className="flex items-start gap-3 rounded-2xl bg-red-50/70 p-4 text-sm font-bold leading-6 text-slate-700 ring-1 ring-red-100">
      <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />
      {children}
    </div>
  );
}

function ScoreRow({ label, value }) {
  return (
    <div className="rounded-2xl bg-[#fff8f1] p-4 ring-1 ring-orange-100">
      <div className="flex items-center justify-between gap-4">
        <p className="text-xs font-black uppercase tracking-[0.12em] text-orange-600">
          {label}
        </p>
        <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-[#071b3a] ring-1 ring-orange-100">
          {value}
        </span>
      </div>
    </div>
  );
}

export default UniversityDetailPage;