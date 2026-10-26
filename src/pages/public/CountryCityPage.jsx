import { useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Award,
  CircleAlert,
  CircleCheck,
  ArrowRight,
  ArrowUpRight,
  ExternalLink,
  MapPin,
  School,
  Sparkles,
} from "lucide-react";

import {
  getCityBySlug,
  getCountryAppointmentPath,
  getCountryBySlug,
  getUniversitiesForCity,
} from "../../data/countries";
import {
  ConsultationBand,
  DripDivider,
  FlagMark,
  HonestyNote,
  SectionHeader,
} from "../../components/public/destinations/DestinationUI";
import { fadeUp, getUniversityPath } from "../../components/public/destinations/destinationUtils";
import NotFoundPage from "./NotFoundPage";

const BUDGET_LABELS = {
  rent: "Rent",
  food: "Food & groceries",
  transport: "Transport",
  other: "Insurance, phone & personal",
};

function CountryCityPage() {
  const { countrySlug, citySlug } = useParams();
  const country = getCountryBySlug(countrySlug);
  const city = getCityBySlug(country, citySlug);

  useEffect(() => {
    if (!country || !city) return;
    document.title = `Study in ${city.name}, ${country.name} | Zaifan Consultancy`;
  }, [country, city]);

  if (!country || country.slug === "italy" || !city) return <NotFoundPage />;

  const universities = getUniversitiesForCity(country, city.slug);
  const otherCities = country.cities.filter((item) => item.slug !== city.slug);
  const appointmentPath = getCountryAppointmentPath(country);
  const symbol = country.currencySymbol || "";
  const budgetTotals = city.budget
    ? Object.values(city.budget).reduce(
        (totals, [low, high]) => ({ low: totals.low + low, high: totals.high + high }),
        { low: 0, high: 0 }
      )
    : null;

  return (
    <main className="cv-sections overflow-hidden bg-[#fff7ed] text-[#071f50]">
      {/* Hero */}
      <section className="relative isolate overflow-hidden px-4 pb-12 pt-28 sm:px-5 md:pb-16 md:pt-36">
        <div className="pointer-events-none absolute left-[-8%] top-[10%] -z-10 h-[420px] w-[420px] rounded-full bg-orange-300/28 blur-[95px]" />
        <div className="pointer-events-none absolute right-[-6%] top-[0%] -z-10 h-[480px] w-[480px] rounded-full bg-[#ff4b12]/14 blur-[110px]" />
        <div className="pointer-events-none absolute right-[6%] top-[18%] -z-10 hidden text-[260px] leading-none opacity-[0.07] lg:block">
          {city.emoji}
        </div>

        <motion.div initial="hidden" animate="show" variants={fadeUp} className="mx-auto max-w-[1350px]">
          <Link
            to={`/countries/${country.slug}#cities`}
            className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-black text-[#071f50] shadow-sm ring-1 ring-orange-100 transition hover:text-[#ff4b12]"
          >
            <ArrowLeft size={14} strokeWidth={3} />
            {country.name} guide
          </Link>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <FlagMark country={country} className="h-8 w-12" />
            <span className="rounded-full bg-white/84 px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-[#ff4b12] ring-1 ring-orange-100">
              {city.region} · {country.name}
            </span>
          </div>

          <h1 className="mt-6 max-w-5xl text-[2.6rem] font-black leading-[0.92] tracking-[-0.06em] sm:text-6xl md:text-7xl xl:text-[86px]">
            Study in <span className="text-[#ff4b12]">{city.name}</span>.
            <br />
            <span className="text-[#071f50]/90">{city.headline}.</span>
          </h1>
          <p className="mt-6 max-w-3xl text-[15px] font-semibold leading-7 text-[#526178] sm:text-lg sm:leading-9">{city.intro}</p>

          <div className="mt-8 grid max-w-3xl grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              ["Living cost", city.livingCost],
              ["Universities", universities.length ? `${universities.length} listed` : "Ask us"],
              ["Best for", city.bestFor[0]],
              ["Country", country.name],
            ].map(([label, value]) => (
              <div key={label} className="rounded-[20px] bg-white p-4 shadow-[0_14px_35px_rgba(9,31,80,0.06)] ring-1 ring-orange-100">
                <p className="text-[10px] font-black uppercase tracking-[0.15em] text-[#ff4b12]">{label}</p>
                <p className="mt-1 text-base font-black tracking-[-0.02em]">{value}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* Highlights */}
      <section className="px-4 py-10 sm:px-5 md:py-16">
        <div className="mx-auto max-w-[1350px]">
          <SectionHeader eyebrow={`Why ${city.name}`} title="What makes this city different." />
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.2 }}
            transition={{ staggerChildren: 0.08 }}
            className="mt-10 grid gap-5 md:grid-cols-3"
          >
            {city.highlights.map((item, index) => (
              <motion.div
                key={item.title}
                variants={fadeUp}
                className={`rounded-[30px] p-6 shadow-[0_20px_55px_rgba(9,31,80,0.07)] ring-1 ${
                  index === 0 ? "bg-[#071f50] text-white ring-[#071f50]" : "bg-white ring-orange-100"
                }`}
              >
                <Sparkles size={22} className={index === 0 ? "text-[#ffb36d]" : "text-[#ff4b12]"} />
                <h3 className="mt-4 text-xl font-black tracking-[-0.035em]">{item.title}</h3>
                <p className={`mt-3 text-sm font-semibold leading-7 ${index === 0 ? "text-white/75" : "text-[#61708a]"}`}>{item.text}</p>
              </motion.div>
            ))}
          </motion.div>

          <div className="mt-8 flex flex-wrap justify-center gap-2">
            {city.bestFor.map((item) => (
              <span key={item} className="rounded-full bg-white px-4 py-2 text-xs font-black ring-1 ring-orange-100">
                {item}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Costs */}
      <DripDivider color="#fff7ed" background="#071f50" />
      <section className="bg-[#071f50] px-4 py-12 text-white sm:px-5 md:py-16">
        <div className="mx-auto max-w-[1350px]">
          <SectionHeader tone="dark" eyebrow="Monthly budget" title={`Living in ${city.name}.`} text={country.quickFacts.livingNote} />
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {city.costCards.map((item) => (
              <div key={item.label} className="rounded-[28px] bg-white/[0.06] p-6 ring-1 ring-white/10">
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#ffb36d]">{item.label}</p>
                <p className="mt-2 text-3xl font-black tracking-[-0.05em]">{item.value}</p>
                <p className="mt-3 text-sm font-semibold leading-6 text-white/70">{item.text}</p>
              </div>
            ))}
          </div>
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            {city.studentLife.map((item) => (
              <span key={item} className="rounded-full bg-white/10 px-4 py-2 text-xs font-black text-white/85 ring-1 ring-white/10">
                {item}
              </span>
            ))}
          </div>
        </div>
      </section>
      <DripDivider color="#071f50" background="#fff7ed" />

      {/* Universities */}
      <section className="px-4 py-10 sm:px-5 md:py-16">
        <div className="mx-auto max-w-[1350px]">
          <SectionHeader
            eyebrow="Universities"
            title={`Universities in ${city.name}.`}
            text={universities.length ? "Well-known options in this city. Ask us to check which ones fit your profile." : "Ask us for university options in this city."}
          />
          <div className="mt-10 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {universities.map((university) => (
              <div key={university.slug} className="flex flex-col rounded-[28px] bg-white p-5 shadow-[0_18px_50px_rgba(9,31,80,0.07)] ring-1 ring-orange-100">
                <div className="flex items-center justify-between">
                  <div className="grid h-11 w-11 place-items-center rounded-2xl bg-[#fff1ea] text-[#ff4b12]">
                    <School size={20} strokeWidth={2.6} />
                  </div>
                  <span className="rounded-full bg-[#071f50] px-3 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-white">{university.type}</span>
                </div>
                <h3 className="mt-4 text-lg font-black leading-6 tracking-[-0.03em]">{university.name}</h3>
                <p className="mt-2 text-sm font-semibold leading-6 text-[#61708a]">{university.popularFor}</p>
                <p className="mt-3 text-xs font-bold text-[#526178]">
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
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Monthly budget breakdown */}
      {city.budget && (
        <section className="px-4 pb-6 sm:px-5">
          <div className="mx-auto max-w-[1350px] rounded-[30px] bg-white p-6 shadow-[0_20px_55px_rgba(9,31,80,0.07)] ring-1 ring-orange-100 md:p-8">
            <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#ff4b12]">Monthly budget</p>
                <h2 className="mt-1 text-3xl font-black tracking-[-0.05em]">
                  {symbol}
                  {budgetTotals.low.toLocaleString("en-US")} – {symbol}
                  {budgetTotals.high.toLocaleString("en-US")} per month
                </h2>
              </div>
              <Link to={`/countries/${country.slug}#budget`} className="text-xs font-black text-[#ff4b12] hover:underline">
                Plan your full year →
              </Link>
            </div>
            <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {Object.entries(city.budget).map(([key, [low, high]]) => (
                <div key={key} className="rounded-[20px] bg-[#fff7ed] p-4 ring-1 ring-orange-100">
                  <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#7a879c]">{BUDGET_LABELS[key] || key}</p>
                  <p className="mt-1 text-lg font-black">
                    {symbol}
                    {low.toLocaleString("en-US")} – {symbol}
                    {high.toLocaleString("en-US")}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Fit check + scholarships */}
      {(city.fit || city.scholarshipNote) && (
        <section className="px-4 py-10 sm:px-5 md:py-14">
          <div className="mx-auto grid max-w-[1350px] gap-5 lg:grid-cols-3">
            {city.fit && (
              <>
                <div className="rounded-[30px] bg-white p-6 shadow-[0_18px_50px_rgba(9,31,80,0.07)] ring-1 ring-emerald-100">
                  <p className="text-lg font-black">{city.name} suits you if…</p>
                  <ul className="mt-4 space-y-2.5">
                    {city.fit.good.map((item) => (
                      <li key={item} className="flex gap-2.5 text-sm font-semibold leading-6 text-[#526178]">
                        <CircleCheck size={18} className="mt-0.5 shrink-0 text-emerald-500" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="rounded-[30px] bg-[#071f50] p-6 text-white shadow-[0_18px_50px_rgba(7,31,80,0.18)]">
                  <p className="text-lg font-black">Consider carefully</p>
                  <ul className="mt-4 space-y-2.5">
                    {city.fit.consider.map((item) => (
                      <li key={item} className="flex gap-2.5 text-sm font-semibold leading-6 text-white/80">
                        <CircleAlert size={18} className="mt-0.5 shrink-0 text-[#ff7b1c]" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </>
            )}
            <div className="rounded-[30px] bg-gradient-to-br from-[#ff7b1c] to-[#ff4b12] p-6 text-white shadow-[0_22px_55px_rgba(255,75,18,0.25)]">
              <p className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.16em] text-white/80">
                <Award size={14} /> Funding in {city.name}
              </p>
              <p className="mt-3 text-sm font-bold leading-6">
                {city.scholarshipNote || `Students in ${city.name} can apply for ${country.name}'s national scholarships below.`}
              </p>
              <ul className="mt-4 space-y-1.5">
                {country.scholarships.slice(0, 3).map((scholarship) => (
                  <li key={scholarship.name} className="text-xs font-black text-white/90">
                    • {scholarship.name}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      )}

      {/* Roadmap */}
      {country.timeline && (
        <section className="bg-[#fff1ea] px-4 py-10 sm:px-5 md:py-14">
          <div className="mx-auto max-w-[1350px]">
            <SectionHeader eyebrow={`${city.name} roadmap`} title="Your path to arriving here." />
            <div className="mt-8 grid gap-3 md:grid-cols-3 xl:grid-cols-6">
              {country.timeline.map((step, index) => (
                <div key={step.phase} className="rounded-[22px] bg-white p-4 ring-1 ring-orange-100">
                  <span className="grid h-8 w-8 place-items-center rounded-full bg-[#ff4b12] text-xs font-black text-white">{index + 1}</span>
                  <p className="mt-3 text-sm font-black leading-5">{step.phase}</p>
                  <p className="mt-1 text-[11px] font-bold text-[#7a879c]">{step.timing}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Other cities */}
      {otherCities.length > 0 && (
        <section className="px-4 pb-16 sm:px-5">
          <div className="mx-auto max-w-[1350px] rounded-[30px] bg-white/88 p-6 shadow-[0_20px_55px_rgba(9,31,80,0.06)] ring-1 ring-orange-100 md:p-8">
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#ff4b12]">Compare other cities</p>
            <div className="mt-4 flex flex-wrap gap-3">
              {otherCities.map((item) => (
                <Link
                  key={item.slug}
                  to={`/countries/${country.slug}/${item.slug}`}
                  className="group inline-flex items-center gap-2 rounded-full bg-[#fff7ed] px-4 py-2.5 text-sm font-black ring-1 ring-orange-100 transition hover:bg-[#ff4b12] hover:text-white"
                >
                  <MapPin size={14} className="text-[#ff4b12] group-hover:text-white" />
                  {item.name}
                  <ArrowUpRight size={14} />
                </Link>
              ))}
            </div>
          </div>
          <HonestyNote lastReviewed={country.lastReviewed} sources={country.sources} />
        </section>
      )}

      <ConsultationBand
        title={`Thinking about ${city.name}?`}
        text={`We'll compare universities, rent and scholarships in ${city.name} against other ${country.name} cities for your profile.`}
        to={appointmentPath}
        label="Plan my city choice"
      />
    </main>
  );
}

export default CountryCityPage;
