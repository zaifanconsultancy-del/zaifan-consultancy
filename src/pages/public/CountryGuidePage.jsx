import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  ArrowUpRight,
  BadgeCheck,
  BriefcaseBusiness,
  CalendarDays,
  ChevronDown,
  Coins,
  ExternalLink,
  FileCheck2,
  GraduationCap,
  Languages,
  MapPin,
  MousePointer2,
  Plane,
  Route,
  School,
  Wallet,
} from "lucide-react";

import {
  getCountryAppointmentPath,
  getCountryBySlug,
} from "../../data/countries";
import {
  ConsultationBand,
  DripDivider,
  FlagMark,
  HonestyNote,
  SectionHeader,
} from "../../components/public/destinations/DestinationUI";
import { fadeUp, getUniversityPath, iconFor } from "../../components/public/destinations/destinationUtils";
import {
  ApplicationTimeline,
  BudgetPlanner,
  CityComparison,
  FitCheck,
  PathwaysBlock,
  RealityCheck,
  RequirementsBlock,
  StudentLifeBlock,
} from "../../components/public/destinations/GuideSections";
import NotFoundPage from "./NotFoundPage";

// `needs` hides a jump link when the country has no data for that section.
const SECTIONS = [
  { id: "why", label: "Why study here" },
  { id: "fit", label: "Fit check", needs: "decision" },
  { id: "costs", label: "Costs" },
  { id: "budget", label: "Budget planner", needs: "tuitionOptions" },
  { id: "timeline", label: "Timeline", needs: "timeline" },
  { id: "requirements", label: "Requirements", needs: "requirements" },
  { id: "universities", label: "Universities" },
  { id: "scholarships", label: "Scholarships" },
  { id: "cities", label: "Cities" },
  { id: "life", label: "Student life", needs: "studentLife" },
  { id: "reality", label: "Reality check", needs: "realityChecks" },
  { id: "apply", label: "Admission & visa" },
  { id: "faqs", label: "FAQs" },
];

const BAND_STYLES = {
  Low: "bg-emerald-50 text-emerald-700 ring-emerald-100",
  Moderate: "bg-amber-50 text-amber-700 ring-amber-100",
  High: "bg-rose-50 text-rose-700 ring-rose-100",
};

function scrollToId(id) {
  const target = document.getElementById(id);
  if (!target) return;
  const y = target.getBoundingClientRect().top + window.scrollY - 95;
  window.scrollTo({ top: y, behavior: "smooth" });
}

function QuickFact({ icon: Icon, label, value }) {
  return (
    <div className="rounded-[18px] bg-white p-3 shadow-[0_10px_28px_rgba(9,31,80,0.045)] ring-1 ring-orange-100/80 sm:rounded-[22px] sm:p-4">
      <div className="grid h-10 w-10 place-items-center rounded-2xl bg-[#fff1ea] text-[#ff4b12]">
        <Icon size={19} strokeWidth={2.8} />
      </div>
      <p className="mt-3 text-[10px] font-black uppercase tracking-[0.15em] text-[#ff4b12]">{label}</p>
      <p className="mt-1 text-sm font-black leading-5 tracking-[-0.02em] text-[#071f50] sm:text-base">{value}</p>
    </div>
  );
}

function UniversityCard({ university, country }) {
  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.3 }}
      className="group flex flex-col rounded-[28px] bg-white p-5 shadow-[0_18px_50px_rgba(9,31,80,0.07)] ring-1 ring-orange-100 transition hover:-translate-y-1 hover:shadow-[0_26px_65px_rgba(255,75,18,0.12)]"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[#fff1ea] text-[#ff4b12]">
          <School size={22} strokeWidth={2.6} />
        </div>
        <div className="flex flex-wrap justify-end gap-1.5">
          <span className="rounded-full bg-[#071f50] px-3 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-white">
            {university.type}
          </span>
          <span className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.12em] ring-1 ${BAND_STYLES[university.tuitionBand] || BAND_STYLES.Moderate}`}>
            {university.tuitionBand} cost
          </span>
        </div>
      </div>

      <h3 className="mt-4 text-lg font-black leading-6 tracking-[-0.03em] text-[#071f50]">
        <Link to={getUniversityPath(country, university)} className="hover:text-[#ff4b12]">
          {university.name}
        </Link>
      </h3>
      <p className="mt-1 flex items-center gap-1.5 text-xs font-bold text-[#7a879c]">
        <MapPin size={13} className="text-[#ff4b12]" />
        {university.city}
      </p>
      <p className="mt-3 text-sm font-semibold leading-6 text-[#61708a]">{university.popularFor}</p>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {university.programs.map((program) => (
          <span key={program} className="rounded-full bg-[#fff7ed] px-2.5 py-1 text-[11px] font-black text-[#071f50] ring-1 ring-orange-100">
            {program}
          </span>
        ))}
      </div>

      <p className="mt-4 rounded-2xl bg-[#fff7ed] px-3 py-2 text-xs font-bold leading-5 text-[#526178]">
        <span className="font-black text-[#ff4b12]">Fees: </span>
        {university.tuitionNote}
      </p>

      <div className="mt-auto flex gap-2 pt-5">
        <Link
          to={getUniversityPath(country, university)}
          className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-[#071f50] px-4 py-3 text-xs font-black text-white transition hover:bg-[#ff4b12]"
        >
          View details
          <ArrowRight size={14} strokeWidth={3} />
        </Link>
        {university.website && (
          <a
            href={university.website}
            target="_blank"
            rel="noreferrer"
            aria-label={`${university.name} official website`}
            className="grid h-11 w-11 place-items-center rounded-full bg-[#fff1ea] text-[#ff4b12] ring-1 ring-orange-100 transition hover:bg-[#ff4b12] hover:text-white"
          >
            <ExternalLink size={16} strokeWidth={2.8} />
          </a>
        )}
      </div>
    </motion.article>
  );
}

function CountryGuidePage() {
  const { countrySlug } = useParams();
  const location = useLocation();
  const country = getCountryBySlug(countrySlug);
  const [cityFilter, setCityFilter] = useState("all");
  const [openFaq, setOpenFaq] = useState(0);

  useEffect(() => {
    if (!country) return;
    document.title = `Study in ${country.name} | Zaifan Consultancy`;
  }, [country]);

  // Deep links like /countries/germany#scholarships land on that section.
  useEffect(() => {
    if (!location.hash) return undefined;
    const timer = window.setTimeout(() => scrollToId(location.hash.slice(1)), 350);
    return () => window.clearTimeout(timer);
  }, [location.hash, countrySlug]);

  const filteredUniversities = useMemo(() => {
    if (!country) return [];
    if (cityFilter === "all") return country.universities;
    return country.universities.filter((university) => university.city === cityFilter);
  }, [country, cityFilter]);

  const universityCities = useMemo(() => {
    if (!country) return [];
    return [...new Set(country.universities.map((university) => university.city))];
  }, [country]);

  // Italy keeps its own hand-built guide at /countries/italy.
  if (!country || country.slug === "italy") return <NotFoundPage />;

  const facts = country.quickFacts;
  const appointmentPath = getCountryAppointmentPath(country);

  return (
    <main className="overflow-hidden bg-[#fff7ed] text-[#071f50]">
      {/* Hero */}
      <section className="relative isolate overflow-hidden px-4 pb-12 pt-28 sm:px-5 md:pb-16 md:pt-36">
        <div className="pointer-events-none absolute left-[-8%] top-[10%] -z-10 h-[460px] w-[460px] rounded-full bg-orange-300/28 blur-[95px]" />
        <div className="pointer-events-none absolute right-[-5%] top-[4%] -z-10 h-[520px] w-[520px] rounded-full bg-[#ff4b12]/14 blur-[110px]" />

        <div className="mx-auto grid max-w-[1450px] items-center gap-10 lg:grid-cols-[0.95fr_1.05fr]">
          <motion.div initial="hidden" animate="show" variants={fadeUp}>
            <div className="flex flex-wrap items-center gap-3">
              <FlagMark country={country} className="h-9 w-[54px]" />
              <span className="rounded-full bg-white/84 px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-[#ff4b12] shadow-sm ring-1 ring-orange-100">
                {country.region}
              </span>
              {country.inEU && (
                <span className="rounded-full bg-[#003399] px-3 py-2 text-[10px] font-black uppercase tracking-[0.14em] text-[#ffcc00]">
                  EU · Schengen
                </span>
              )}
            </div>

            <h1 className="mt-6 max-w-4xl text-[2.65rem] font-black leading-[0.9] tracking-[-0.06em] sm:text-6xl md:text-7xl xl:text-[88px]">
              Your complete
              <span className="ml-3 inline-block text-[#ff4b12]">{country.name}</span>
              <br />
              study game plan.
            </h1>

            <p className="mt-5 inline-flex max-w-full items-center gap-2 rounded-full bg-[#071f50] px-4 py-2 text-[10px] font-black uppercase tracking-[0.12em] text-white sm:text-xs">
              <BadgeCheck size={15} className="text-[#ffb36d]" />
              {country.tagline}
            </p>

            <p className="mt-5 max-w-2xl text-[15px] font-semibold leading-7 text-[#526178] sm:text-lg sm:leading-9">
              {country.intro}
            </p>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Link
                to={appointmentPath}
                className="inline-flex items-center justify-center gap-3 rounded-full bg-[#ff4b12] px-7 py-4 text-sm font-black text-white shadow-[0_20px_44px_rgba(255,75,18,0.3)] transition hover:-translate-y-1 hover:bg-[#ff642f] sm:px-8 sm:py-5 sm:text-base"
              >
                Build My {country.name} Plan
                <ArrowRight size={20} strokeWidth={3} />
              </Link>
              <button
                type="button"
                onClick={() => scrollToId("universities")}
                className="inline-flex items-center justify-center gap-3 rounded-full bg-white px-7 py-4 text-sm font-black text-[#071f50] shadow-[0_14px_32px_rgba(9,31,80,0.08)] ring-1 ring-orange-100 transition hover:-translate-y-1 hover:text-[#ff4b12] sm:px-8 sm:py-5 sm:text-base"
              >
                <MousePointer2 size={18} />
                See universities
              </button>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 35, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.75, delay: 0.08 }}
            className="relative overflow-hidden rounded-[30px] bg-white/96 p-5 shadow-[0_24px_65px_rgba(9,31,80,0.10)] ring-1 ring-orange-100 sm:rounded-[34px] sm:p-7"
          >
            <div className="pointer-events-none absolute -right-14 -top-12 h-44 w-44 rounded-full border-[28px] border-[#ff4b12]/7" />
            <div className="relative flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-[#ff4b12]">{country.name} at a glance</p>
                <h2 className="mt-2 text-3xl font-black tracking-[-0.055em] sm:text-4xl">Know before you decide.</h2>
              </div>
              <FlagMark country={country} className="h-12 w-[72px] sm:h-14 sm:w-[84px]" />
            </div>

            <div className="relative mt-6 grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-3">
              <QuickFact icon={Wallet} label="Tuition" value={facts.tuition} />
              <QuickFact icon={Coins} label="Living" value={facts.living} />
              <QuickFact icon={CalendarDays} label="Intakes" value={facts.intakes} />
              <QuickFact icon={Languages} label="Language" value={facts.language} />
              <QuickFact icon={BriefcaseBusiness} label="Work" value={facts.work} />
              <QuickFact icon={GraduationCap} label="After study" value={facts.postStudy} />
            </div>

            <p className="relative mt-4 rounded-[20px] bg-[#fff7ed] p-4 text-xs font-semibold leading-6 text-[#61708a] ring-1 ring-orange-100">
              <span className="font-black text-[#071f50]">Visa: </span>
              {facts.visa}. {facts.livingNote}
            </p>
          </motion.div>
        </div>
      </section>

      {/* Jump navigation */}
      <section className="relative z-30 px-4 pb-8 sm:px-5">
        <div className="mx-auto max-w-[1380px] overflow-hidden rounded-[24px] bg-white/94 shadow-[0_22px_65px_rgba(9,31,80,0.10)] ring-1 ring-orange-100 backdrop-blur-xl md:sticky md:top-[94px]">
          <div className="flex items-center gap-3 bg-[#071f50] px-4 py-3 text-white">
            <Route size={18} className="text-[#ffb36d]" strokeWidth={3} />
            <p className="truncate text-sm font-black">Jump to any part of the {country.name} guide</p>
          </div>
          <div className="flex gap-2 overflow-x-auto p-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {SECTIONS.filter((section) => !section.needs || country[section.needs]).map((section) => (
              <button
                key={section.id}
                type="button"
                onClick={() => scrollToId(section.id)}
                className="min-w-fit rounded-full bg-[#fffaf5] px-4 py-2.5 text-xs font-black text-[#071f50] ring-1 ring-orange-100 transition hover:bg-[#fff1ea] hover:text-[#ff4b12]"
              >
                {section.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Why */}
      <section id="why" className="px-4 py-10 sm:px-5 md:py-16">
        <div className="mx-auto max-w-[1350px]">
          <SectionHeader
            eyebrow={`Why ${country.name}`}
            title={`Why students choose ${country.name}.`}
            text={country.shortDescription}
          />
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.18 }}
            transition={{ staggerChildren: 0.08 }}
            className="mt-12 grid gap-5 md:grid-cols-2 xl:grid-cols-4"
          >
            {country.whyStudy.map((item, index) => {
              const Icon = iconFor(item.icon);
              const tone =
                index === 0
                  ? "bg-[#071f50] text-white ring-[#071f50]"
                  : index === 3
                  ? "bg-[#ff4b12] text-white ring-[#ff4b12]"
                  : "bg-white text-[#071f50] ring-orange-100";
              const muted = index === 0 || index === 3;

              return (
                <motion.div
                  key={item.title}
                  variants={fadeUp}
                  className={`rounded-[30px] p-6 shadow-[0_20px_55px_rgba(9,31,80,0.07)] ring-1 transition duration-300 hover:-translate-y-1 ${tone}`}
                >
                  <div className={`mb-5 grid h-14 w-14 place-items-center rounded-2xl ${muted ? "bg-white/12 text-[#ffb36d]" : "bg-[#fff1ea] text-[#ff4b12]"}`}>
                    <Icon size={27} strokeWidth={2.6} />
                  </div>
                  <h3 className="text-xl font-black tracking-[-0.035em]">{item.title}</h3>
                  <p className={`mt-3 text-sm font-semibold leading-7 ${muted ? "text-white/78" : "text-[#61708a]"}`}>{item.text}</p>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      <FitCheck country={country} />

      {/* Costs */}
      <section id="costs" className="bg-[linear-gradient(180deg,#fff7ed_0%,#fff1ea_100%)] px-4 py-10 sm:px-5 md:py-20">
        <div className="mx-auto max-w-[1350px]">
          <SectionHeader
            eyebrow="Costs"
            title="What it really costs."
            text={facts.tuitionNote}
          />
          <div className="mt-12 grid gap-5 lg:grid-cols-2">
            {[
              { title: "Tuition", icon: Wallet, rows: country.costs.tuition },
              { title: "Monthly living", icon: Coins, rows: country.costs.living },
            ].map((block) => (
              <div key={block.title} className="rounded-[30px] bg-white p-6 shadow-[0_20px_55px_rgba(9,31,80,0.07)] ring-1 ring-orange-100 md:p-8">
                <div className="flex items-center gap-3">
                  <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[#fff1ea] text-[#ff4b12]">
                    <block.icon size={22} strokeWidth={2.6} />
                  </div>
                  <h3 className="text-2xl font-black tracking-[-0.04em]">{block.title}</h3>
                </div>
                <div className="mt-6 divide-y divide-orange-100">
                  {block.rows.map((row) => (
                    <div key={row.label} className="flex flex-col gap-1 py-4 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
                      <div>
                        <p className="text-sm font-black text-[#071f50]">{row.label}</p>
                        <p className="mt-1 text-xs font-semibold leading-5 text-[#7a879c]">{row.note}</p>
                      </div>
                      <p className="shrink-0 text-base font-black tracking-[-0.02em] text-[#ff4b12] sm:text-right">{row.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <BudgetPlanner country={country} />
      <ApplicationTimeline country={country} />
      <RequirementsBlock country={country} />

      {/* Universities */}
      <section id="universities" className="relative px-4 py-10 sm:px-5 md:py-20">
        <div className="mx-auto max-w-[1350px]">
          <SectionHeader
            eyebrow="Universities"
            title={`Where students go in ${country.name}.`}
            text="A shortlist of well-known universities we guide students towards. Filter by city, then ask us to check your fit."
          />

          <div className="mt-8 flex flex-wrap justify-center gap-2">
            {["all", ...universityCities].map((city) => (
              <button
                key={city}
                type="button"
                onClick={() => setCityFilter(city)}
                className={`rounded-full px-4 py-2.5 text-xs font-black ring-1 transition ${
                  cityFilter === city
                    ? "bg-[#ff4b12] text-white ring-[#ff4b12] shadow-[0_12px_30px_rgba(255,75,18,0.25)]"
                    : "bg-white text-[#071f50] ring-orange-100 hover:text-[#ff4b12]"
                }`}
              >
                {city === "all" ? `All (${country.universities.length})` : city}
              </button>
            ))}
          </div>

          <motion.div layout className="mt-10 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            <AnimatePresence mode="popLayout">
              {filteredUniversities.map((university) => (
                <UniversityCard key={university.slug} university={university} country={country} />
              ))}
            </AnimatePresence>
          </motion.div>

          <PathwaysBlock country={country} />
        </div>
      </section>

      {/* Scholarships */}
      <DripDivider color="#fff7ed" background="#071f50" />
      <section id="scholarships" className="bg-[#071f50] px-4 py-12 text-white sm:px-5 md:py-20">
        <div className="mx-auto max-w-[1350px]">
          <SectionHeader
            tone="dark"
            eyebrow="Scholarships"
            title={`Funding routes for ${country.name}.`}
            text="Real programmes with real rules. We help you check eligibility and deadlines before you spend time on an application."
          />
          <div className="mt-12 grid gap-5 md:grid-cols-2">
            {country.scholarships.map((scholarship) => (
              <div key={scholarship.name} className="flex flex-col rounded-[30px] bg-white/[0.06] p-6 ring-1 ring-white/10 backdrop-blur md:p-7">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <span className="rounded-full bg-[#ff4b12] px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em]">{scholarship.level}</span>
                  <span className="text-xs font-bold text-white/55">{scholarship.provider}</span>
                </div>
                <h3 className="mt-4 text-2xl font-black tracking-[-0.04em]">{scholarship.name}</h3>
                <p className="mt-3 text-sm font-black leading-6 text-[#ffb36d]">{scholarship.covers}</p>
                <p className="mt-2 text-sm font-semibold leading-7 text-white/72">{scholarship.note}</p>
                {scholarship.link && (
                  <a
                    href={scholarship.link}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-auto inline-flex items-center gap-2 pt-5 text-xs font-black text-[#ffb36d] hover:text-white"
                  >
                    Official page
                    <ArrowUpRight size={14} strokeWidth={3} />
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>
      <DripDivider color="#071f50" background="#fff7ed" />

      {/* Cities */}
      <section id="cities" className="px-4 py-10 sm:px-5 md:py-16">
        <div className="mx-auto max-w-[1350px]">
          <SectionHeader
            eyebrow="Student cities"
            title={`Pick the right ${country.name} city.`}
            text="Your city shapes your rent, your part-time options and your daily life. Open any city for a full guide."
          />
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {country.cities.map((city) => (
              <Link
                key={city.slug}
                to={`/countries/${country.slug}/${city.slug}`}
                className="group relative overflow-hidden rounded-[30px] bg-white p-6 shadow-[0_20px_55px_rgba(9,31,80,0.07)] ring-1 ring-orange-100 transition hover:-translate-y-1 hover:shadow-[0_28px_70px_rgba(255,75,18,0.13)]"
              >
                <div className="pointer-events-none absolute -right-8 -top-8 text-[110px] leading-none opacity-[0.08] transition group-hover:opacity-[0.16]">
                  {city.emoji}
                </div>
                <div className="relative">
                  <div className="flex items-center justify-between">
                    <span className="rounded-full bg-[#fff1ea] px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-[#ff4b12]">
                      {city.livingCost} cost
                    </span>
                    <ArrowUpRight size={20} className="text-orange-200 transition group-hover:text-[#ff4b12]" />
                  </div>
                  <h3 className="mt-5 text-3xl font-black tracking-[-0.05em]">{city.name}</h3>
                  <p className="mt-1 text-xs font-bold uppercase tracking-[0.12em] text-[#7a879c]">{city.region}</p>
                  <p className="mt-3 text-sm font-semibold leading-6 text-[#61708a]">{city.headline}</p>
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {city.bestFor.slice(0, 3).map((item) => (
                      <span key={item} className="rounded-full bg-[#fff7ed] px-2.5 py-1 text-[11px] font-black ring-1 ring-orange-100">
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              </Link>
            ))}
          </div>

          <CityComparison country={country} />
        </div>
      </section>

      <StudentLifeBlock country={country} />
      <RealityCheck country={country} />

      {/* Admission + visa */}
      <section id="apply" className="bg-[#fff1ea] px-4 py-10 sm:px-5 md:py-20">
        <div className="mx-auto max-w-[1350px]">
          <SectionHeader
            eyebrow="Admission & visa"
            title="From application to arrival."
            text={country.visa.summary}
          />
          <div className="mt-12 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="rounded-[30px] bg-white p-6 shadow-[0_20px_55px_rgba(9,31,80,0.07)] ring-1 ring-orange-100 md:p-8">
              <div className="flex items-center gap-3">
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[#fff1ea] text-[#ff4b12]">
                  <GraduationCap size={22} strokeWidth={2.6} />
                </div>
                <h3 className="text-2xl font-black tracking-[-0.04em]">Admission steps</h3>
              </div>
              <ol className="mt-6 space-y-4">
                {country.admissionSteps.map((step, index) => (
                  <li key={step.title} className="flex gap-4">
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#ff4b12] text-sm font-black text-white">
                      {index + 1}
                    </span>
                    <div>
                      <p className="text-sm font-black">{step.title}</p>
                      <p className="mt-1 text-sm font-semibold leading-6 text-[#61708a]">{step.text}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>

            <div className="rounded-[30px] bg-[#071f50] p-6 text-white shadow-[0_24px_65px_rgba(7,31,80,0.18)] md:p-8">
              <div className="flex items-center gap-3">
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-white/10 text-[#ffb36d]">
                  <Plane size={22} strokeWidth={2.6} />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#ffb36d]">Visa roadmap</p>
                  <h3 className="text-2xl font-black tracking-[-0.04em]">{country.visa.name}</h3>
                </div>
              </div>
              <ol className="mt-6 space-y-3">
                {country.visa.steps.map((step, index) => (
                  <li key={step} className="flex gap-3 text-sm font-semibold leading-6 text-white/85">
                    <span className="mt-0.5 text-xs font-black text-[#ffb36d]">0{index + 1}</span>
                    {step}
                  </li>
                ))}
              </ol>
              <div className="mt-6 rounded-[22px] bg-white/[0.07] p-5 ring-1 ring-white/10">
                <p className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.14em] text-[#ffb36d]">
                  <FileCheck2 size={15} />
                  Typical documents
                </p>
                <ul className="mt-3 grid gap-2 text-sm font-semibold text-white/80">
                  {country.visa.documents.map((doc) => (
                    <li key={doc} className="flex gap-2">
                      <BadgeCheck size={16} className="mt-0.5 shrink-0 text-[#ff7b1c]" />
                      {doc}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQs */}
      <section id="faqs" className="px-4 py-10 sm:px-5 md:py-16">
        <div className="mx-auto max-w-[1000px]">
          <SectionHeader eyebrow="FAQs" title={`${country.name} questions, answered.`} />
          <div className="mt-10 space-y-3">
            {country.faqs.map((faq, index) => {
              const open = openFaq === index;
              return (
                <div key={faq.q} className="overflow-hidden rounded-[24px] bg-white shadow-[0_14px_40px_rgba(9,31,80,0.06)] ring-1 ring-orange-100">
                  <button
                    type="button"
                    onClick={() => setOpenFaq(open ? -1 : index)}
                    className="flex w-full items-center justify-between gap-4 px-5 py-5 text-left md:px-6"
                    aria-expanded={open}
                  >
                    <span className="text-base font-black tracking-[-0.02em]">{faq.q}</span>
                    <ChevronDown size={20} className={`shrink-0 text-[#ff4b12] transition ${open ? "rotate-180" : ""}`} />
                  </button>
                  <AnimatePresence initial={false}>
                    {open && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25 }}
                      >
                        <p className="px-5 pb-5 text-sm font-semibold leading-7 text-[#61708a] md:px-6">{faq.a}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>
        <HonestyNote lastReviewed={country.lastReviewed} sources={country.sources} />
      </section>

      <ConsultationBand
        title={`Ready to plan ${country.name}?`}
        text="Tell us your grades, budget and goals. We'll shortlist universities, scholarships and a visa timeline that actually fits you."
        to={appointmentPath}
        label={`Book my ${country.name} consultation`}
      />
    </main>
  );
}

export default CountryGuidePage;
