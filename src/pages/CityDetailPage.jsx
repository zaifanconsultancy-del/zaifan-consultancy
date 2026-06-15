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
} from "lucide-react";

import Footer from "../components/Footer";
import NotFoundPage from "./NotFoundPage.jsx";
import { findItalianCityBySlug } from "../data/italianCities";
import { italianUniversities } from "../data/italianUniversities";

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: "easeOut" } },
};

const iconCycle = [BriefcaseBusiness, Building2, GraduationCap, Landmark];
const lifeIcons = [Coffee, Utensils, Train, Home];

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

function CityDetailPage() {
  const { citySlug } = useParams();
  const city = findItalianCityBySlug(citySlug);

  const cityUniversities = useMemo(() => {
    if (!city) return [];

    return italianUniversities.filter(
      (university) => university.city.toLowerCase() === city.name.toLowerCase()
    );
  }, [city]);

  if (!city) {
    return <NotFoundPage />;
  }

  return (
    <>
      <main className="overflow-hidden bg-[#fff7ed] text-[#071f50]">
        <section className="relative px-5 pb-20 pt-32 md:pt-36">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_16%_22%,rgba(255,75,18,0.16),transparent_30%),radial-gradient(circle_at_84%_12%,rgba(255,178,89,0.18),transparent_26%)]" />
          <div className="pointer-events-none absolute -left-28 top-16 h-96 w-96 rounded-full bg-orange-300/20 blur-3xl" />
          <div className="pointer-events-none absolute -right-28 top-32 h-96 w-96 rounded-full bg-[#ff4b12]/10 blur-3xl" />

          <div className="relative mx-auto max-w-[1450px]">
            <Link
              to="/countries/italy"
              className="mb-6 inline-flex items-center gap-2 rounded-full bg-white/90 px-4 py-2 text-xs font-black text-[#ff4b12] shadow-sm ring-1 ring-orange-100 transition hover:-translate-y-0.5 hover:bg-[#fff1ea]"
            >
              <ArrowLeft size={16} strokeWidth={3} />
              Back to Italy Guide
            </Link>

            <div className="grid items-center gap-10 lg:grid-cols-[1.05fr_0.95fr]">
              <motion.div initial="hidden" animate="show" variants={fadeUp}>
                <Badge>{city.name} Student City Guide</Badge>

                <h1 className="mt-6 max-w-4xl text-5xl font-black leading-[0.9] tracking-[-0.07em] text-[#071f50] md:text-7xl xl:text-[88px]">
                  Study in <span className="text-[#ff4b12]">{city.name}</span>.
                </h1>

                <p className="mt-7 max-w-3xl text-lg font-semibold leading-9 text-[#526178]">
                  {city.intro}
                </p>

                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <a
                    href={`/appointment?country=Italy&city=${encodeURIComponent(city.name)}`}
                    className="inline-flex items-center justify-center gap-3 rounded-full bg-[#ff4b12] px-8 py-5 text-base font-black text-white shadow-[0_20px_44px_rgba(255,75,18,0.3)] transition hover:-translate-y-1 hover:bg-[#ff642f] focus:outline-none focus:ring-4 focus:ring-[#ff4b12]/20"
                  >
                    Plan {city.name} Study Route
                    <ArrowRight size={21} strokeWidth={3} />
                  </a>

                  <Link
                    to="/universities"
                    className="inline-flex items-center justify-center gap-3 rounded-full bg-white px-8 py-5 text-base font-black text-[#ff4b12] shadow-[0_14px_32px_rgba(255,75,18,0.1)] ring-1 ring-orange-100 transition hover:-translate-y-1 hover:bg-[#fff1ea] focus:outline-none focus:ring-4 focus:ring-[#ff4b12]/20"
                  >
                    Explore Universities
                  </Link>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 32, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.7, delay: 0.08 }}
                className="relative"
              >
                <div className="relative overflow-hidden rounded-[42px] bg-white p-6 shadow-[0_35px_100px_rgba(9,31,80,0.12)] ring-1 ring-orange-100">
                  <div className="rounded-[34px] bg-[radial-gradient(circle_at_18%_20%,rgba(255,75,18,0.18),transparent_28%),linear-gradient(135deg,#fffaf5,#ffffff)] p-6 md:p-8">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="text-xs font-black uppercase tracking-[0.18em] text-[#ff4b12]">
                          Italy City
                        </p>
                        <h2 className="mt-2 text-4xl font-black tracking-[-0.055em] text-[#071f50]">
                          {city.name}
                        </h2>
                      </div>
                      <div className="grid h-20 w-20 place-items-center rounded-[26px] bg-white text-5xl shadow-inner ring-1 ring-orange-100">
                        {city.emoji}
                      </div>
                    </div>

                    <div className="mt-7 grid gap-4 sm:grid-cols-2">
                      <div className="rounded-[24px] bg-white/88 p-4 shadow-sm ring-1 ring-orange-100">
                        <p className="text-xs font-black uppercase tracking-[0.15em] text-[#ff4b12]">
                          Universities
                        </p>
                        <p className="mt-2 text-2xl font-black text-[#071f50]">
                          {cityUniversities.length}+
                        </p>
                      </div>

                      {city.heroStats.map(([label, value]) => (
                        <div
                          key={label}
                          className="rounded-[24px] bg-white/88 p-4 shadow-sm ring-1 ring-orange-100"
                        >
                          <p className="text-xs font-black uppercase tracking-[0.15em] text-[#ff4b12]">
                            {label}
                          </p>
                          <p className="mt-2 text-2xl font-black text-[#071f50]">
                            {value}
                          </p>
                        </div>
                      ))}
                    </div>

                    <div className="mt-7 rounded-[26px] bg-[#071f50] p-5 text-white">
                      <div className="flex items-start gap-4">
                        <ShieldCheck className="mt-1 text-[#ffb36d]" size={28} />
                        <div>
                          <h3 className="text-xl font-black tracking-[-0.035em]">
                            Honest {city.name} note
                          </h3>
                          <p className="mt-2 text-sm font-semibold leading-7 text-white/76">
                            {city.name} should be chosen when the university, course, scholarship route, budget and lifestyle fit make sense together.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        <section className="px-5 py-20">
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
                    className="rounded-[30px] bg-white/90 p-6 shadow-[0_20px_55px_rgba(9,31,80,0.07)] ring-1 ring-orange-100 transition duration-300 hover:-translate-y-1 hover:shadow-[0_28px_70px_rgba(255,75,18,0.13)]"
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

        <section className="bg-white/52 px-5 py-20">
          <div className="mx-auto max-w-[1350px]">
            <SectionHeader
              eyebrow={`${city.name} Universities`}
              title={`Universities in ${city.name} from your live database.`}
              text="These cards are pulled from the Italy university database, so city pages stay connected to real university detail pages."
            />

            {cityUniversities.length > 0 ? (
              <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {cityUniversities.map((university) => (
                  <Link
                    key={university.slug}
                    to={`/universities/${university.slug}`}
                    className="group rounded-[26px] bg-white p-5 shadow-[0_18px_48px_rgba(9,31,80,0.07)] ring-1 ring-orange-100 transition duration-300 hover:-translate-y-1 hover:shadow-[0_26px_65px_rgba(255,75,18,0.13)]"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[#fff1ea] text-[#ff4b12]">
                          <Building2 size={23} />
                        </div>
                        <div>
                          <h3 className="font-black leading-tight text-[#071f50] group-hover:text-[#ff4b12]">
                            {university.name}
                          </h3>
                          <p className="mt-1 text-xs font-black uppercase tracking-[0.12em] text-[#ff4b12]">
                            {university.type} · {university.tuitionLevel}
                          </p>
                        </div>
                      </div>
                      <ArrowRight className="mt-1 shrink-0 text-[#ff4b12] transition group-hover:translate-x-1" size={18} />
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
                className="inline-flex items-center justify-center gap-3 rounded-full bg-[#071f50] px-8 py-5 text-sm font-black text-white shadow-[0_20px_44px_rgba(9,31,80,0.18)] transition hover:-translate-y-1 hover:bg-[#092b72]"
              >
                Explore Full Italy University Database
                <ArrowRight size={20} strokeWidth={3} />
              </Link>
            </div>
          </div>
        </section>

        <section className="px-5 py-20">
          <div className="mx-auto max-w-[1250px]">
            <SectionHeader
              eyebrow="Cost of Living"
              title={`${city.name} needs realistic budgeting.`}
              text={`Living costs in ${city.name} should be checked before finalizing the route. Rent, food, transport and lifestyle can change the student's full study plan.`}
            />

            <div className="mt-12 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
              {city.costCards.map((card) => (
                <div
                  key={card.label}
                  className="rounded-[32px] bg-white/90 p-7 shadow-[0_22px_65px_rgba(9,31,80,0.08)] ring-1 ring-orange-100"
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
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-[#071f50] px-5 py-20 text-white">
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
                className="mt-8 inline-flex items-center gap-3 rounded-full bg-[#ff4b12] px-8 py-5 font-black text-white shadow-[0_20px_44px_rgba(255,75,18,0.3)] transition hover:-translate-y-1 hover:bg-[#ff642f]"
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

        <section className="px-5 py-20">
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
                  <div
                    key={item.title}
                    className="rounded-[30px] bg-white/90 p-6 shadow-[0_20px_55px_rgba(9,31,80,0.07)] ring-1 ring-orange-100 transition duration-300 hover:-translate-y-1 hover:shadow-[0_28px_70px_rgba(255,75,18,0.13)]"
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
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section className="bg-[#fff1ea] px-5 py-20">
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
              <a
                href={`/appointment?country=Italy&city=${encodeURIComponent(city.name)}&service=City Guidance`}
                className="inline-flex items-center justify-center gap-3 rounded-full bg-[#ff4b12] px-9 py-5 font-black text-white shadow-[0_20px_44px_rgba(255,75,18,0.3)] transition hover:-translate-y-1 hover:bg-[#ff642f]"
              >
                Get {city.name} Guidance
                <Plane size={22} strokeWidth={3} />
              </a>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}

export default CityDetailPage;
