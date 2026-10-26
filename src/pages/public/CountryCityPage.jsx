import { useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
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
import { fadeUp } from "../../components/public/destinations/destinationUtils";
import NotFoundPage from "./NotFoundPage";

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

  return (
    <main className="overflow-hidden bg-[#fff7ed] text-[#071f50]">
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
                    to={`/appointment?country=${encodeURIComponent(country.name)}&service=${encodeURIComponent(`University Selection – ${university.name}`)}`}
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-[#071f50] px-4 py-3 text-xs font-black text-white transition hover:bg-[#ff4b12]"
                  >
                    Ask about this
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
