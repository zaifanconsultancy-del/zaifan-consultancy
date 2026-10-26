import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  BadgeCheck,
  BookOpen,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  ChevronDown,
  Clock3,
  Coins,
  ExternalLink,
  FileCheck2,
  GraduationCap,
  Languages,
  MapPin,
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
import { fadeUp, getUniversityPath } from "../../components/public/destinations/destinationUtils";
import NotFoundPage from "./NotFoundPage";

const BAND_STYLES = {
  Low: "bg-emerald-50 text-emerald-700 ring-emerald-100",
  Moderate: "bg-amber-50 text-amber-700 ring-amber-100",
  High: "bg-rose-50 text-rose-700 ring-rose-100",
};

function monthlyRange(symbol, budget) {
  if (!budget) return null;
  const values = Object.values(budget);
  const low = values.reduce((sum, [value]) => sum + value, 0);
  const high = values.reduce((sum, [, value]) => sum + value, 0);
  return `${symbol}${low.toLocaleString("en-US")} – ${symbol}${high.toLocaleString("en-US")} / month`;
}

function buildFaqs(university, country, city) {
  const faqs = [
    {
      q: `Is ${university.name} public or private?`,
      a: `${university.name} is listed as a ${university.type.toLowerCase()} institution. ${university.tuitionNote}.`,
    },
    {
      q: `How much does it cost to study at ${university.name}?`,
      a: `Fees: ${university.tuitionNote}. Living costs in ${university.city} are ${city?.budget ? monthlyRange(country.currencySymbol || "", city.budget) : `in line with ${country.name}'s typical ${country.quickFacts.living}`}. Always confirm the current fee table for your programme.`,
    },
    {
      q: `Does ${university.name} teach in English?`,
      a: university.english || `Many universities in ${country.name} offer English-taught programmes, especially at master's level. Check the language of your specific programme.`,
    },
    {
      q: `Can Pakistani students apply to ${university.name}?`,
      a: `Yes, international students can apply if they meet the programme's academic and language requirements. Pakistani documents usually need IBCC/HEC attestation. We check your eligibility before you apply.`,
    },
    {
      q: `Which visa do I need?`,
      a: `${country.visa.name}. ${country.visa.summary}`,
    },
  ];
  return faqs;
}

function UniversityProfilePage() {
  const { countrySlug, universitySlug } = useParams();
  const country = getCountryBySlug(countrySlug);
  const university = country?.universities?.find((item) => item.slug === universitySlug);
  const [openFaq, setOpenFaq] = useState(0);

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

  const suits = [
    `Students targeting ${university.programs.slice(0, 3).join(", ")}`,
    university.popularFor,
    city ? `Students who'd enjoy ${city.name}: ${city.headline.toLowerCase()}` : `Students happy to live in ${university.city}`,
    university.english || "Students ready to check programme language requirements",
  ];

  const faqs = buildFaqs(university, country, city);

  return (
    <main className="cv-sections overflow-hidden bg-[#fff7ed] text-[#071f50]">
      {/* Hero */}
      <section className="relative isolate overflow-hidden px-4 pb-12 pt-28 sm:px-5 md:pb-16 md:pt-36">
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
              <span className={`rounded-full px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.12em] ring-1 ${BAND_STYLES[university.tuitionBand] || BAND_STYLES.Moderate}`}>
                {university.tuitionBand} cost
              </span>
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
                <span>{university.city}, {country.name}</span>
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

      {/* Overview + programmes */}
      <section className="px-4 py-10 sm:px-5 md:py-16">
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
              <Users size={14} /> Who it suits
            </p>
            <ul className="mt-3 space-y-2.5">
              {suits.map((item) => (
                <li key={item} className="flex gap-2.5 text-sm font-semibold leading-6 text-white/85">
                  <BadgeCheck size={17} className="mt-0.5 shrink-0 text-[#ff7b1c]" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Costs + scholarships */}
      <DripDivider color="#fff7ed" background="#071f50" />
      <section className="bg-[#071f50] px-4 py-12 text-white sm:px-5 md:py-16">
        <div className="mx-auto max-w-[1350px]">
          <SectionHeader tone="dark" eyebrow="Money" title="Costs and funding." text={facts.tuitionNote} />
          <div className="mt-10 grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="rounded-[28px] bg-white/[0.06] p-6 ring-1 ring-white/10">
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#ffb36d]">Tuition at {university.name}</p>
              <p className="mt-2 text-2xl font-black tracking-[-0.03em]">{university.tuitionNote}</p>
              {city?.budget && (
                <>
                  <p className="mt-6 text-[10px] font-black uppercase tracking-[0.16em] text-[#ffb36d]">Living in {city.name}</p>
                  <p className="mt-2 text-2xl font-black tracking-[-0.03em]">{monthlyRange(symbol, city.budget)}</p>
                </>
              )}
              <Link
                to={`/countries/${country.slug}#budget`}
                className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#ff4b12] px-5 py-3 text-xs font-black transition hover:bg-[#ff642f]"
              >
                Plan your full budget
                <ArrowRight size={14} strokeWidth={3} />
              </Link>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {country.scholarships.slice(0, 4).map((scholarship) => (
                <div key={scholarship.name} className="rounded-[24px] bg-white/[0.06] p-5 ring-1 ring-white/10">
                  <span className="rounded-full bg-[#ff4b12] px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.12em]">{scholarship.level}</span>
                  <p className="mt-3 text-lg font-black leading-6">{scholarship.name}</p>
                  <p className="mt-2 text-xs font-semibold leading-5 text-white/70">{scholarship.covers}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
      <DripDivider color="#071f50" background="#fff7ed" />

      {/* Requirements */}
      {country.requirements && (
        <section className="px-4 py-10 sm:px-5 md:py-16">
          <div className="mx-auto max-w-[1350px]">
            <SectionHeader eyebrow="Requirements" title="What you'll need." text="General entry rules for Pakistani applicants in this country. Your programme page has the final requirements." />
            <div className="mt-10 grid gap-5 lg:grid-cols-3">
              {[
                ["Bachelor's", country.requirements.bachelor],
                ["Master's", country.requirements.master],
                ["Documents", country.requirements.documents],
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
            </div>
          </div>
        </section>
      )}

      {/* City + roadmap */}
      <section className="bg-[#fff1ea] px-4 py-10 sm:px-5 md:py-16">
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
          </div>

          {country.timeline && (
            <div className="rounded-[30px] bg-white p-6 shadow-[0_18px_50px_rgba(9,31,80,0.07)] ring-1 ring-orange-100 md:p-7">
              <p className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.16em] text-[#ff4b12]">
                <Clock3 size={14} /> Your roadmap
              </p>
              <ol className="mt-4 space-y-3">
                {country.timeline.map((step, index) => (
                  <li key={step.phase} className="flex gap-3">
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#ff4b12] text-xs font-black text-white">{index + 1}</span>
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

      {/* Similar universities */}
      {similar.length > 0 && (
        <section className="px-4 py-10 sm:px-5 md:py-16">
          <div className="mx-auto max-w-[1350px]">
            <SectionHeader eyebrow="Compare" title="Similar universities." text={`Other ${country.name} universities students usually compare with ${university.name}.`} />
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
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* FAQs */}
      <section className="px-4 pb-14 sm:px-5">
        <div className="mx-auto max-w-[1000px]">
          <SectionHeader eyebrow="FAQs" title={`About ${university.name}.`} />
          <div className="mt-10 space-y-3">
            {faqs.map((faq, index) => {
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
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}>
                        <p className="px-5 pb-5 text-sm font-semibold leading-7 text-[#61708a] md:px-6">{faq.a}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>
        <HonestyNote lastReviewed={country.lastReviewed} sources={[...(university.website ? [{ label: `${university.name} (official)`, url: university.website }] : []), ...(country.sources || [])]} />
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
