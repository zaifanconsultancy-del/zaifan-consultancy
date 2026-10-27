import { useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Award,
  BadgeCheck,
  BookOpen,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  CircleAlert,
  CircleCheck,
  Clock3,
  Coins,
  Compass,
  ExternalLink,
  FileCheck2,
  GraduationCap,
  Languages,
  MapPin,
  MessageCircle,
  Search,
  Sparkles,
  Users,
  Wallet,
} from "lucide-react";

import { getCountryBySlug } from "../../data/countries";
import {
  ConsultationBand,
  DripDivider,
  FlagMark,
  HonestyNote,
  SectionHeader,
} from "../../components/public/destinations/DestinationUI";
import {
  CareerPaths,
  DocumentChecklist,
  FaqList,
  JumpNav,
  YearlyLivingEstimate,
} from "../../components/public/destinations/DetailSections";
import { fadeUp, getUniversityPath, iconFor } from "../../components/public/destinations/destinationUtils";
import NotFoundPage from "./NotFoundPage";

const BAND_STYLES = {
  Low: "bg-emerald-50 text-emerald-700 ring-emerald-100",
  Moderate: "bg-amber-50 text-amber-700 ring-amber-100",
  High: "bg-rose-50 text-rose-700 ring-rose-100",
};

// Position on a 1–5 scale, used only to draw the snapshot meters.
const TUITION_LEVEL = { Low: 1, Moderate: 3, High: 5 };
const LIVING_LEVEL = { Low: 1, "Low–Medium": 2, Medium: 3, "Medium–High": 4, High: 5 };

const NAV_ITEMS = [
  { id: "overview", label: "Overview" },
  { id: "fit", label: "Fit check" },
  { id: "careers", label: "Careers" },
  { id: "costs", label: "Costs & funding" },
  { id: "requirements", label: "Requirements" },
  { id: "documents", label: "Document checklist" },
  { id: "city", label: "City & roadmap" },
  { id: "next", label: "Next steps" },
  { id: "faqs", label: "FAQs" },
];

function monthlyRange(symbol, budget) {
  if (!budget) return null;
  const values = Object.values(budget);
  const low = values.reduce((sum, [value]) => sum + value, 0);
  const high = values.reduce((sum, [, value]) => sum + value, 0);
  return `${symbol}${low.toLocaleString("en-US")} – ${symbol}${high.toLocaleString("en-US")} / month`;
}

function buildFaqs(university, country, city) {
  const symbol = country.currencySymbol || "";
  const facts = country.quickFacts;
  const applyStep = country.timeline?.find((step) => /appl/i.test(step.phase));
  const housing = country.studentLife?.find((item) => item.icon === "home");
  const scholarshipNames = country.scholarships.slice(0, 3).map((item) => item.name).join(", ");

  return [
    {
      q: `Is ${university.name} public or private?`,
      a: `${university.name} is listed as a ${university.type.toLowerCase()} institution. Fees: ${university.tuitionNote}.`,
    },
    {
      q: `How much does it cost to study at ${university.name}?`,
      a: `Fees: ${university.tuitionNote}. Living costs in ${university.city} are ${
        city?.budget ? `around ${monthlyRange(symbol, city.budget)}` : `in line with ${country.name}'s typical ${facts.living}`
      }. Always confirm the current fee table for your programme.`,
    },
    {
      q: `Does ${university.name} teach in English?`,
      a:
        university.english ||
        `Many universities in ${country.name} offer English-taught programmes, especially at master's level. Check the language of your specific programme.`,
    },
    {
      q: `Can Pakistani students apply to ${university.name}?`,
      a: "Yes, international students can apply if they meet the programme's academic and language requirements. Pakistani documents usually need IBCC/HEC attestation. We check your eligibility before you apply.",
    },
    {
      q: `When should I apply to ${university.name}?`,
      a: `Intakes in ${country.name}: ${facts.intakes}. ${
        applyStep ? `Applications usually run ${applyStep.timing.toLowerCase()}. ${applyStep.text}` : "Deadlines differ by programme, so start 9–12 months ahead."
      }`,
    },
    {
      q: `Are there scholarships for ${university.name}?`,
      a: `Students here can usually apply for ${scholarshipNames}.${city?.scholarshipNote ? ` ${city.scholarshipNote}` : ""} Eligibility and deadlines change every year.`,
    },
    {
      q: `Can I work while studying at ${university.name}?`,
      a: `Student work rules in ${country.name}: ${facts.work}. Part-time income helps, but it should not be your plan for paying tuition or rent at the start.`,
    },
    {
      q: `Where will I live in ${university.city}?`,
      a: housing
        ? housing.text
        : `Most international students share flats or use university residences. Start looking as soon as you are admitted.`,
    },
    {
      q: "Which visa do I need?",
      a: `${country.visa.name}. ${country.visa.summary}`,
    },
    {
      q: `What can I do after graduating from ${university.name}?`,
      a: `After study: ${facts.postStudy}. Your options depend on your degree, language skills and the job market in ${country.name}.`,
    },
  ];
}

function Meter({ value, max = 5, label, text }) {
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#7a879c]">{label}</p>
        <p className="text-xs font-black">{text}</p>
      </div>
      <div className="mt-2 flex gap-1">
        {Array.from({ length: max }, (_, index) => (
          <span key={index} className={`h-2 flex-1 rounded-full ${index < value ? "bg-[#ff4b12]" : "bg-[#fff1ea]"}`} />
        ))}
      </div>
    </div>
  );
}

function UniversityProfilePage() {
  const { countrySlug, universitySlug } = useParams();
  const country = getCountryBySlug(countrySlug);
  const university = country?.universities?.find((item) => item.slug === universitySlug);

  useEffect(() => {
    if (!country || !university) return;
    document.title = `${university.name} | Study in ${country.name} | Zaifan Consultancy`;
  }, [country, university]);

  if (!country || country.slug === "italy" || !university) return <NotFoundPage />;

  const city = country.cities.find((item) => item.slug === university.citySlug);
  const symbol = country.currencySymbol || "";
  const facts = country.quickFacts;
  const appointmentPath = `/appointment?country=${encodeURIComponent(country.name)}&service=${encodeURIComponent(
    "University Selection"
  )}&university=${encodeURIComponent(university.name)}`;

  const similar = country.universities
    .filter((item) => item.slug !== university.slug)
    .map((item) => ({
      item,
      score:
        item.programs.filter((program) => university.programs.includes(program)).length * 2 +
        (item.type === university.type ? 1 : 0) +
        (item.citySlug && item.citySlug === university.citySlug ? 1 : 0),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map(({ item }) => item);

  const routes = (country.pathways || []).filter((pathway) => pathway.slugs.includes(university.slug));

  const suits = [
    `Students targeting ${university.programs.slice(0, 3).join(", ")}`,
    university.popularFor,
    city ? `Students who'd enjoy ${city.name}: ${city.headline.charAt(0).toLowerCase()}${city.headline.slice(1)}` : `Students happy to live in ${university.city}`,
    university.english || "Students ready to check programme language requirements",
  ];

  // Real caveats only: the city's own trade-offs first, then the country's.
  const thinkTwice = [...(city?.fit?.consider || []), ...(country.decision?.avoid || [])].slice(0, 5);

  const nextSteps = [
    {
      icon: Search,
      title: "Check your eligibility",
      text: `Compare your grades and documents with ${country.name}'s entry rules.`,
      to: `/countries/${country.slug}#requirements`,
    },
    {
      icon: Wallet,
      title: "Plan the full budget",
      text: "Tuition, rent and visa funds for your first year in one planner.",
      to: `/countries/${country.slug}#budget`,
    },
    {
      icon: Award,
      title: "Find funding",
      text: `Every scholarship route we track for ${country.name}.`,
      to: `/scholarships?country=${country.slug}`,
    },
    {
      icon: MessageCircle,
      title: "Talk it through",
      text: "A free consultation to check your fit and build the timeline.",
      to: appointmentPath,
    },
  ];

  const faqs = buildFaqs(university, country, city);

  return (
    <main className="cv-sections overflow-hidden bg-[#fff7ed] text-[#071f50]">
      {/* Hero */}
      <section className="relative isolate overflow-hidden px-4 pb-10 pt-28 sm:px-5 md:pb-14 md:pt-36">
        <div className="pointer-events-none absolute left-[-8%] top-[10%] -z-10 h-[420px] w-[420px] rounded-full bg-orange-300/28 blur-[95px]" />
        <div className="pointer-events-none absolute right-[-6%] top-[0%] -z-10 h-[480px] w-[480px] rounded-full bg-[#ff4b12]/14 blur-[110px]" />

        <div className="mx-auto grid max-w-[1400px] gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <motion.div initial="hidden" animate="show" variants={fadeUp}>
            <Link
              to={`/countries/${country.slug}#universities`}
              className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-black shadow-sm ring-1 ring-orange-100 transition hover:text-[#ff4b12]"
            >
              <ArrowLeft size={14} strokeWidth={3} />
              {country.name} universities
            </Link>

            <div className="mt-6 flex flex-wrap items-center gap-2">
              <FlagMark country={country} className="h-8 w-12" />
              <span className="rounded-full bg-[#071f50] px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.12em] text-white">{university.type}</span>
              <span
                className={`rounded-full px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.12em] ring-1 ${
                  BAND_STYLES[university.tuitionBand] || BAND_STYLES.Moderate
                }`}
              >
                {university.tuitionBand} cost
              </span>
              {routes.map((route) => (
                <span key={route.title} className="rounded-full bg-white px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.12em] text-[#ff4b12] ring-1 ring-orange-100">
                  {route.title}
                </span>
              ))}
            </div>

            <h1 className="mt-5 max-w-4xl text-[2.4rem] font-black leading-[0.95] tracking-[-0.055em] sm:text-6xl md:text-7xl">
              {university.name}
            </h1>
            <p className="mt-4 flex items-center gap-2 text-sm font-black text-[#526178]">
              <MapPin size={17} className="text-[#ff4b12]" />
              {city ? (
                <Link to={`/countries/${country.slug}/${city.slug}`} className="hover:text-[#ff4b12]">
                  {university.city}, {country.name}
                </Link>
              ) : (
                <span>
                  {university.city}, {country.name}
                </span>
              )}
            </p>
            <p className="mt-5 max-w-2xl text-[15px] font-semibold leading-7 text-[#526178] sm:text-lg sm:leading-8">
              {university.about || university.popularFor}
            </p>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Link
                to={appointmentPath}
                className="inline-flex items-center justify-center gap-3 rounded-full bg-[#ff4b12] px-7 py-4 text-sm font-black text-white shadow-[0_20px_44px_rgba(255,75,18,0.3)] transition hover:-translate-y-1 hover:bg-[#ff642f] sm:text-base"
              >
                Check my fit for this university
                <ArrowRight size={19} strokeWidth={3} />
              </Link>
              {university.website && (
                <a
                  href={university.website}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-7 py-4 text-sm font-black ring-1 ring-orange-100 transition hover:-translate-y-1 hover:text-[#ff4b12] sm:text-base"
                >
                  Official website
                  <ExternalLink size={17} />
                </a>
              )}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.08 }}
            className="relative overflow-hidden rounded-[32px] bg-white p-6 shadow-[0_24px_65px_rgba(9,31,80,0.10)] ring-1 ring-orange-100 md:p-7"
          >
            <div className="pointer-events-none absolute -right-14 -top-12 h-44 w-44 rounded-full border-[28px] border-[#ff4b12]/7" />
            <p className="relative text-xs font-black uppercase tracking-[0.18em] text-[#ff4b12]">Quick facts</p>
            <div className="relative mt-5 grid grid-cols-2 gap-3">
              {[
                [Wallet, "Fees", university.tuitionNote],
                [Coins, "Living", city?.budget ? monthlyRange(symbol, city.budget) : facts.living],
                [CalendarDays, "Intakes", facts.intakes],
                [Languages, "Teaching", university.english || facts.language],
                [BriefcaseBusiness, "Work", facts.work],
                [GraduationCap, "After study", facts.postStudy],
              ].map(([Icon, label, value]) => (
                <div key={label} className="rounded-[20px] bg-[#fff7ed] p-3.5 ring-1 ring-orange-100">
                  <Icon size={17} className="text-[#ff4b12]" strokeWidth={2.6} />
                  <p className="mt-2 text-[10px] font-black uppercase tracking-[0.14em] text-[#7a879c]">{label}</p>
                  <p className="mt-0.5 text-[13px] font-black leading-5">{value}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      <JumpNav title={`Jump to any part of the ${university.name} profile`} items={NAV_ITEMS} />

      {/* Overview + programmes */}
      <section id="overview" className="px-4 py-10 sm:px-5 md:py-16">
        <div className="mx-auto grid max-w-[1350px] gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-[30px] bg-white p-6 shadow-[0_20px_55px_rgba(9,31,80,0.07)] ring-1 ring-orange-100 md:p-8">
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#ff4b12]">Why students choose it</p>
            <h2 className="mt-2 text-3xl font-black tracking-[-0.05em] md:text-4xl">{university.popularFor}.</h2>
            <div className="mt-6 grid gap-3">
              {(university.highlights || [university.popularFor]).map((highlight) => (
                <div key={highlight} className="flex items-start gap-3 rounded-2xl bg-[#fff7ed] p-4 ring-1 ring-orange-100">
                  <Sparkles size={18} className="mt-0.5 shrink-0 text-[#ff4b12]" />
                  <p className="text-sm font-bold leading-6 text-[#405672]">{highlight}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[30px] bg-[#071f50] p-6 text-white shadow-[0_24px_65px_rgba(7,31,80,0.18)] md:p-8">
            <p className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.16em] text-[#ffb36d]">
              <BookOpen size={14} /> Popular programmes
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {university.programs.map((program) => (
                <span key={program} className="rounded-full bg-white/10 px-3.5 py-2 text-xs font-black ring-1 ring-white/10">
                  {program}
                </span>
              ))}
            </div>
            <p className="mt-7 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.16em] text-[#ffb36d]">
              <Compass size={14} /> Before you pick a programme, check
            </p>
            <ul className="mt-3 grid gap-2.5 sm:grid-cols-2">
              {[
                "Teaching language and test score needed",
                "Application deadline for your intake",
                "Exact fee for non-EU students",
                "Subject match with your previous degree",
              ].map((item) => (
                <li key={item} className="flex gap-2.5 text-sm font-semibold leading-6 text-white/85">
                  <BadgeCheck size={17} className="mt-0.5 shrink-0 text-[#ff7b1c]" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Fit check */}
      <section id="fit" className="bg-[linear-gradient(180deg,#fff7ed_0%,#fff1ea_100%)] px-4 py-10 sm:px-5 md:py-16">
        <div className="mx-auto max-w-[1350px]">
          <SectionHeader
            eyebrow="Fit check"
            title={`Is ${university.name} right for you?`}
            text="An honest read on who usually does well here and what to weigh up before you apply."
          />
          <div className="mt-10 grid gap-5 lg:grid-cols-3">
            <div className="rounded-[30px] bg-white p-6 shadow-[0_18px_50px_rgba(9,31,80,0.07)] ring-1 ring-emerald-100">
              <p className="flex items-center gap-2 text-lg font-black">
                <Users size={19} className="text-emerald-500" /> Great fit if you are…
              </p>
              <ul className="mt-4 space-y-2.5">
                {suits.map((item) => (
                  <li key={item} className="flex gap-2.5 text-sm font-semibold leading-6 text-[#526178]">
                    <CircleCheck size={18} className="mt-0.5 shrink-0 text-emerald-500" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-[30px] bg-[#071f50] p-6 text-white shadow-[0_18px_50px_rgba(7,31,80,0.18)]">
              <p className="text-lg font-black">Think twice if…</p>
              <ul className="mt-4 space-y-2.5">
                {thinkTwice.map((item) => (
                  <li key={item} className="flex gap-2.5 text-sm font-semibold leading-6 text-white/80">
                    <CircleAlert size={18} className="mt-0.5 shrink-0 text-[#ff7b1c]" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-[30px] bg-white p-6 shadow-[0_18px_50px_rgba(9,31,80,0.07)] ring-1 ring-orange-100">
              <p className="text-lg font-black">Snapshot</p>
              <div className="mt-5 space-y-5">
                <Meter label="Tuition level" value={TUITION_LEVEL[university.tuitionBand] || 3} text={university.tuitionBand} />
                {city?.livingCost && (
                  <Meter label={`Cost of living in ${city.name}`} value={LIVING_LEVEL[city.livingCost] || 3} text={city.livingCost} />
                )}
              </div>
              <div className="mt-6 grid grid-cols-2 gap-2.5">
                {[
                  ["Type", university.type],
                  ["City", university.city],
                  ["Intakes", facts.intakes],
                  ["Visa", country.visa.name],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-2xl bg-[#fff7ed] p-3 ring-1 ring-orange-100">
                    <p className="text-[10px] font-black uppercase tracking-[0.12em] text-[#7a879c]">{label}</p>
                    <p className="mt-0.5 text-xs font-black leading-5">{value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <CareerPaths country={country} programs={university.programs} title={`Where ${university.programs[0]} at ${university.name} can lead.`} />

      {/* Costs + scholarships */}
      <DripDivider color="#ff4b12" background="#071f50" />
      <section id="costs" className="bg-[#071f50] px-4 py-12 text-white sm:px-5 md:py-16">
        <div className="mx-auto max-w-[1350px]">
          <SectionHeader tone="dark" eyebrow="Money" title="Costs and funding." text={facts.tuitionNote} />
          <div className="mt-10 grid gap-5 lg:grid-cols-[0.95fr_1.05fr]">
            <div className="grid gap-5">
              <div className="rounded-[28px] bg-white/[0.06] p-6 ring-1 ring-white/10">
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#ffb36d]">Tuition at {university.name}</p>
                <p className="mt-2 text-2xl font-black tracking-[-0.03em]">{university.tuitionNote}</p>
                <p className="mt-3 text-xs font-semibold leading-5 text-white/60">
                  Living costs: {facts.living}. {facts.livingNote}
                </p>
                <Link
                  to={`/countries/${country.slug}#budget`}
                  className="mt-5 inline-flex items-center gap-2 rounded-full bg-[#ff4b12] px-5 py-3 text-xs font-black transition hover:bg-[#ff642f]"
                >
                  Plan your full first year
                  <ArrowRight size={14} strokeWidth={3} />
                </Link>
              </div>
              <YearlyLivingEstimate country={country} city={city} />
            </div>
            <div className="grid content-start gap-3 sm:grid-cols-2">
              {country.scholarships.map((scholarship) => (
                <div key={scholarship.name} className="flex flex-col rounded-[24px] bg-white/[0.06] p-5 ring-1 ring-white/10">
                  <span className="self-start rounded-full bg-[#ff4b12] px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.12em]">
                    {scholarship.level}
                  </span>
                  <p className="mt-3 text-lg font-black leading-6">{scholarship.name}</p>
                  <p className="mt-1 text-[11px] font-bold text-white/50">{scholarship.provider}</p>
                  <p className="mt-2 text-xs font-semibold leading-5 text-white/75">{scholarship.covers}</p>
                  {scholarship.link && (
                    <a
                      href={scholarship.link}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-auto inline-flex items-center gap-1.5 pt-3 text-xs font-black text-[#ffb36d] hover:text-white"
                    >
                      Official page <ArrowUpRight size={13} strokeWidth={3} />
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
      <DripDivider color="#071f50" background="#fff7ed" />

      {/* Requirements */}
      {country.requirements && (
        <section id="requirements" className="px-4 py-10 sm:px-5 md:py-16">
          <div className="mx-auto max-w-[1350px]">
            <SectionHeader
              eyebrow="Requirements"
              title="What you'll need."
              text="General entry rules for Pakistani applicants in this country. Your programme page has the final requirements."
            />
            <div className="mt-10 grid gap-5 lg:grid-cols-3">
              {[
                ["Bachelor's", country.requirements.bachelor],
                ["Master's", country.requirements.master],
              ].map(([title, items]) => (
                <div key={title} className="rounded-[28px] bg-white p-6 shadow-[0_18px_50px_rgba(9,31,80,0.07)] ring-1 ring-orange-100">
                  <p className="flex items-center gap-2 text-lg font-black">
                    <FileCheck2 size={18} className="text-[#ff4b12]" />
                    {title}
                  </p>
                  <ul className="mt-4 space-y-2.5">
                    {items.map((item) => (
                      <li key={item} className="flex gap-2.5 text-sm font-semibold leading-6 text-[#526178]">
                        <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#ff4b12]" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
              <div className="rounded-[28px] bg-[#fff1ea] p-6 ring-1 ring-orange-100">
                <p className="flex items-center gap-2 text-lg font-black">
                  <Languages size={18} className="text-[#ff4b12]" />
                  Language tests
                </p>
                <div className="mt-4 space-y-3">
                  {(country.requirements.language || []).map((item) => (
                    <div key={item.test} className="rounded-2xl bg-white p-4 ring-1 ring-orange-100">
                      <p className="text-sm font-black">{item.test}</p>
                      <p className="mt-1 text-xs font-semibold leading-5 text-[#61708a]">{item.note}</p>
                    </div>
                  ))}
                </div>
                {university.english && (
                  <p className="mt-4 text-xs font-bold leading-5 text-[#526178]">
                    <span className="font-black text-[#ff4b12]">At {university.name}: </span>
                    {university.english}
                  </p>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      <DocumentChecklist country={country} />

      {/* City + roadmap */}
      <section id="city" className="bg-[#fff1ea] px-4 py-10 sm:px-5 md:py-16">
        <div className="mx-auto grid max-w-[1350px] gap-6 lg:grid-cols-[0.85fr_1.15fr]">
          <div className="rounded-[30px] bg-white p-6 shadow-[0_18px_50px_rgba(9,31,80,0.07)] ring-1 ring-orange-100 md:p-7">
            <p className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.16em] text-[#ff4b12]">
              <Building2 size={14} /> Student city
            </p>
            <h2 className="mt-2 text-3xl font-black tracking-[-0.05em]">{university.city}</h2>
            {city ? (
              <>
                <p className="mt-2 text-sm font-semibold leading-6 text-[#61708a]">{city.intro}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {city.studentLife.map((item) => (
                    <span key={item} className="rounded-full bg-[#fff7ed] px-3 py-1.5 text-xs font-black ring-1 ring-orange-100">
                      {item}
                    </span>
                  ))}
                </div>
                <Link
                  to={`/countries/${country.slug}/${city.slug}`}
                  className="mt-5 inline-flex items-center gap-2 rounded-full bg-[#071f50] px-5 py-3 text-xs font-black text-white transition hover:bg-[#ff4b12]"
                >
                  Open the {city.name} city guide
                  <ArrowUpRight size={14} strokeWidth={3} />
                </Link>
              </>
            ) : (
              <p className="mt-2 text-sm font-semibold leading-6 text-[#61708a]">
                Ask us about housing, costs and student life in {university.city}. We'll compare it with other {country.name} cities for you.
              </p>
            )}

            {country.studentLife && (
              <div className="mt-6 grid gap-2.5 border-t border-orange-100 pt-5">
                {country.studentLife.slice(0, 3).map((item) => {
                  const Icon = iconFor(item.icon);
                  return (
                    <div key={item.title} className="flex gap-3">
                      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#fff1ea] text-[#ff4b12]">
                        <Icon size={16} strokeWidth={2.6} />
                      </div>
                      <div>
                        <p className="text-sm font-black">{item.title}</p>
                        <p className="text-xs font-semibold leading-5 text-[#61708a]">{item.text}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {country.timeline && (
            <div className="rounded-[30px] bg-white p-6 shadow-[0_18px_50px_rgba(9,31,80,0.07)] ring-1 ring-orange-100 md:p-7">
              <p className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.16em] text-[#ff4b12]">
                <Clock3 size={14} /> Your roadmap to {university.name}
              </p>
              <ol className="relative mt-5 space-y-4 before:absolute before:bottom-4 before:left-4 before:top-4 before:w-0.5 before:bg-orange-100">
                {country.timeline.map((step, index) => (
                  <li key={step.phase} className="relative flex gap-3">
                    <span className="relative grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#ff4b12] text-xs font-black text-white ring-4 ring-white">
                      {index + 1}
                    </span>
                    <div>
                      <p className="text-sm font-black">
                        {step.phase} <span className="font-bold text-[#7a879c]">· {step.timing}</span>
                      </p>
                      <p className="mt-0.5 text-xs font-semibold leading-5 text-[#61708a]">{step.text}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          )}
        </div>
      </section>

      {/* Next steps */}
      <section id="next" className="px-4 py-10 sm:px-5 md:py-16">
        <div className="mx-auto max-w-[1350px]">
          <SectionHeader eyebrow="Next steps" title={`What to do after reading about ${university.name}.`} />
          <div className="mt-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {nextSteps.map((step, index) => (
              <Link
                key={step.title}
                to={step.to}
                className={`group flex flex-col rounded-[28px] p-6 ring-1 transition hover:-translate-y-1 ${
                  index === nextSteps.length - 1
                    ? "bg-[#ff4b12] text-white ring-[#ff4b12] shadow-[0_22px_55px_rgba(255,75,18,0.25)]"
                    : "bg-white ring-orange-100 shadow-[0_18px_50px_rgba(9,31,80,0.07)] hover:shadow-[0_24px_60px_rgba(255,75,18,0.12)]"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div
                    className={`grid h-12 w-12 place-items-center rounded-2xl ${
                      index === nextSteps.length - 1 ? "bg-white/15" : "bg-[#fff1ea] text-[#ff4b12]"
                    }`}
                  >
                    <step.icon size={22} strokeWidth={2.6} />
                  </div>
                  <span className={`text-xs font-black ${index === nextSteps.length - 1 ? "text-white/70" : "text-orange-300"}`}>0{index + 1}</span>
                </div>
                <h3 className="mt-5 text-lg font-black tracking-[-0.03em]">{step.title}</h3>
                <p className={`mt-2 text-sm font-semibold leading-6 ${index === nextSteps.length - 1 ? "text-white/85" : "text-[#61708a]"}`}>{step.text}</p>
                <ArrowUpRight size={18} strokeWidth={3} className="mt-auto pt-4 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Similar universities */}
      {similar.length > 0 && (
        <section className="px-4 py-10 sm:px-5 md:py-14">
          <div className="mx-auto max-w-[1350px]">
            <SectionHeader
              eyebrow="Compare"
              title="Similar universities."
              text={`Other ${country.name} universities students usually compare with ${university.name}.`}
            />
            <div className="mt-10 grid gap-5 md:grid-cols-3">
              {similar.map((item) => (
                <Link
                  key={item.slug}
                  to={getUniversityPath(country, item)}
                  className="group rounded-[28px] bg-white p-5 shadow-[0_16px_45px_rgba(9,31,80,0.07)] ring-1 ring-orange-100 transition hover:-translate-y-1 hover:shadow-[0_24px_60px_rgba(255,75,18,0.12)]"
                >
                  <div className="flex items-center justify-between">
                    <span className="rounded-full bg-[#071f50] px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.1em] text-white">{item.type}</span>
                    <ArrowUpRight size={18} className="text-orange-200 transition group-hover:text-[#ff4b12]" />
                  </div>
                  <h3 className="mt-4 text-lg font-black leading-6 tracking-[-0.03em] group-hover:text-[#ff4b12]">{item.name}</h3>
                  <p className="mt-1 text-xs font-bold text-[#7a879c]">{item.city}</p>
                  <p className="mt-3 text-sm font-semibold leading-6 text-[#61708a]">{item.popularFor}</p>
                  <p className="mt-3 text-xs font-bold text-[#526178]">
                    <span className="font-black text-[#ff4b12]">Fees: </span>
                    {item.tuitionNote}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* FAQs */}
      <section id="faqs" className="px-4 pb-14 pt-6 sm:px-5">
        <div className="mx-auto max-w-[1000px]">
          <SectionHeader eyebrow="FAQs" title={`About ${university.name}.`} />
          <FaqList faqs={faqs} />
        </div>
        <HonestyNote
          lastReviewed={country.lastReviewed}
          sources={[...(university.website ? [{ label: `${university.name} (official)`, url: university.website }] : []), ...(country.sources || [])]}
        />
      </section>

      <ConsultationBand
        title={`Thinking about ${university.name}?`}
        text={`We'll check your eligibility, compare it with other ${country.name} options and plan your application, scholarship and visa timeline.`}
        to={appointmentPath}
        label="Check my fit"
      />
    </main>
  );
}

export default UniversityProfilePage;
