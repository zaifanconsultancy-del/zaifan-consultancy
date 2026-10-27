import { useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Award,
  CircleAlert,
  CircleCheck,
  ExternalLink,
  MapPin,
  School,
  Sparkles,
  Trophy,
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
import {
  CareerPaths,
  FaqList,
  JumpNav,
  YearlyLivingEstimate,
} from "../../components/public/destinations/DetailSections";
import { BUDGET_LABELS, fadeUp, getUniversityPath, iconFor } from "../../components/public/destinations/destinationUtils";
import NotFoundPage from "./NotFoundPage";

function ordinal(n) {
  const suffixes = ["th", "st", "nd", "rd"];
  const value = n % 100;
  return n + (suffixes[(value - 20) % 10] || suffixes[value] || suffixes[0]);
}

function budgetTotals(budget) {
  if (!budget) return null;
  return Object.values(budget).reduce(
    (totals, [low, high]) => ({ low: totals.low + low, high: totals.high + high }),
    { low: 0, high: 0 }
  );
}

function buildCityFaqs(city, country, universities, totals) {
  const symbol = country.currencySymbol || "";
  const housing = country.studentLife?.find((item) => item.icon === "home");
  const food = country.studentLife?.find((item) => item.icon === "utensils");
  const community = country.studentLife?.find((item) => item.icon === "users");

  return [
    {
      q: `How much does it cost to live in ${city.name} as a student?`,
      a: totals
        ? `Plan for roughly ${symbol}${totals.low.toLocaleString("en-US")} – ${symbol}${totals.high.toLocaleString("en-US")} a month for rent, food, transport and essentials, depending on your lifestyle. Tuition is separate.`
        : `${city.name} is rated "${city.livingCost}" for living costs. We build an exact budget with you.`,
    },
    {
      q: `Which universities can I study at in ${city.name}?`,
      a: universities.length
        ? `${universities.map((item) => item.name).join(", ")}. Each has a full profile on this site.`
        : `Ask us for current university options in ${city.name}.`,
    },
    {
      q: `Is it easy to find housing in ${city.name}?`,
      a: housing ? housing.text : "Start searching as soon as you are admitted; good rooms go quickly in student cities.",
    },
    {
      q: `Can I find halal food in ${city.name}?`,
      a: food ? food.text : `Most big student cities in ${country.name} have halal shops and restaurants. We share local tips before you travel.`,
    },
    {
      q: `Are there other Pakistani students in ${city.name}?`,
      a: community ? community.text : `${country.name} has a growing Pakistani student community. We connect you with students already there where we can.`,
    },
    {
      q: `Can I work part-time in ${city.name}?`,
      a: `${country.name}'s rules: ${country.quickFacts.work}. Bigger cities usually have more part-time options, but also higher rent.`,
    },
    {
      q: `Is ${city.name} a good choice for ${city.bestFor[0]}?`,
      a: `${city.name} is especially known for ${city.bestFor.join(", ")}. ${city.fit?.good?.[0] ? `It suits: ${city.fit.good.join("; ").toLowerCase()}.` : ""}`,
    },
  ];
}

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
  const totals = budgetTotals(city.budget);
  const goals = (country.cityGoals || []).filter((goal) => goal.citySlug === city.slug);
  const programs = [...new Set([...universities.flatMap((item) => item.programs), ...city.bestFor])];

  // Monthly midpoints for every city with budget data, cheapest first.
  const comparison = country.cities
    .filter((item) => item.budget)
    .map((item) => {
      const itemTotals = budgetTotals(item.budget);
      return { slug: item.slug, name: item.name, value: (itemTotals.low + itemTotals.high) / 2 };
    })
    .sort((a, b) => a.value - b.value);
  const comparisonMax = Math.max(...comparison.map((item) => item.value), 1);
  const rank = comparison.findIndex((item) => item.slug === city.slug) + 1;

  const navItems = [
    { id: "why", label: `Why ${city.name}` },
    { id: "costs", label: "Living costs" },
    { id: "universities", label: "Universities" },
    { id: "fit", label: "Fit check" },
    { id: "life", label: "Student life", show: country.studentLife },
    { id: "careers", label: "Careers" },
    { id: "funding", label: "Scholarships" },
    { id: "roadmap", label: "Roadmap", show: country.timeline },
    { id: "faqs", label: "FAQs" },
  ].filter((item) => !("show" in item) || item.show);

  const faqs = buildCityFaqs(city, country, universities, totals);

  return (
    <main className="cv-sections overflow-hidden bg-[#fff7ed] text-[#071f50]">
      {/* Hero */}
      <section className="relative isolate overflow-hidden px-4 pb-10 pt-28 sm:px-5 md:pb-14 md:pt-36">
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
            {goals.map((goal) => (
              <span
                key={goal.goal}
                className="inline-flex items-center gap-1.5 rounded-full bg-[#071f50] px-3.5 py-2 text-[10px] font-black uppercase tracking-[0.12em] text-white"
              >
                <Trophy size={13} className="text-[#ffb36d]" />
                Top pick for {goal.goal}
              </span>
            ))}
          </div>

          <h1 className="mt-6 max-w-5xl text-[2.6rem] font-black leading-[0.92] tracking-[-0.06em] sm:text-6xl md:text-7xl xl:text-[86px]">
            Study in <span className="text-[#ff4b12]">{city.name}</span>.
            <br />
            <span className="text-[#071f50]/90">{city.headline}.</span>
          </h1>
          <p className="mt-6 max-w-3xl text-[15px] font-semibold leading-7 text-[#526178] sm:text-lg sm:leading-9">{city.intro}</p>

          <div className="mt-8 grid max-w-4xl grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              ["Living cost", city.livingCost],
              ["Per month", totals ? `${symbol}${totals.low.toLocaleString("en-US")}+` : "Ask us"],
              ["Universities", universities.length ? `${universities.length} profiled` : "Ask us"],
              ["Best for", city.bestFor[0]],
            ].map(([label, value]) => (
              <div key={label} className="rounded-[20px] bg-white p-4 shadow-[0_14px_35px_rgba(9,31,80,0.06)] ring-1 ring-orange-100">
                <p className="text-[10px] font-black uppercase tracking-[0.15em] text-[#ff4b12]">{label}</p>
                <p className="mt-1 text-base font-black tracking-[-0.02em]">{value}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </section>

      <JumpNav title={`Jump to any part of the ${city.name} guide`} items={navItems} />

      {/* Highlights */}
      <section id="why" className="px-4 py-10 sm:px-5 md:py-16">
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

          {goals.length > 0 && (
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {goals.map((goal) => (
                <div key={goal.goal} className="flex items-start gap-4 rounded-[24px] bg-[#fff1ea] p-5 ring-1 ring-orange-100">
                  <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[#ff4b12] text-white">
                    <Trophy size={20} />
                  </div>
                  <div>
                    <p className="text-sm font-black">Our pick in {country.name} for {goal.goal}</p>
                    <p className="mt-1 text-sm font-semibold leading-6 text-[#61708a]">{goal.reason}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

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
      <DripDivider color="#ff4b12" background="#071f50" />
      <section id="costs" className="bg-[#071f50] px-4 py-12 text-white sm:px-5 md:py-16">
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

          {city.budget && (
            <div className="mt-5 grid gap-5 lg:grid-cols-2">
              <YearlyLivingEstimate country={country} city={city} />

              {comparison.length > 1 && (
                <div className="rounded-[28px] bg-white/[0.06] p-6 ring-1 ring-white/10">
                  <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#ffb36d]">Compared with other {country.name} cities</p>
                  <p className="mt-1 text-sm font-semibold text-white/70">
                    {city.name} is the {rank === 1 ? "cheapest" : `${ordinal(rank)} cheapest`} of{" "}
                    {comparison.length} cities we cover (typical monthly total).
                  </p>
                  <div className="mt-5 space-y-2.5">
                    {comparison.map((item) => {
                      const current = item.slug === city.slug;
                      return (
                        <Link key={item.slug} to={`/countries/${country.slug}/${item.slug}`} className="group block">
                          <div className="flex justify-between text-xs font-bold">
                            <span className={current ? "font-black text-white" : "text-white/65 group-hover:text-white"}>{item.name}</span>
                            <span className={current ? "font-black text-[#ff7b1c]" : "text-white/65"}>
                              {symbol}
                              {Math.round(item.value).toLocaleString("en-US")}
                            </span>
                          </div>
                          <div className="mt-1 h-2 overflow-hidden rounded-full bg-white/10">
                            <motion.div
                              initial={{ width: 0 }}
                              whileInView={{ width: `${(item.value / comparisonMax) * 100}%` }}
                              viewport={{ once: true }}
                              transition={{ duration: 0.7 }}
                              className={`h-full rounded-full ${current ? "bg-[#ff4b12]" : "bg-white/30 group-hover:bg-white/50"}`}
                            />
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

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
      <section id="universities" className="px-4 py-10 sm:px-5 md:py-16">
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
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {university.programs.slice(0, 4).map((program) => (
                    <span key={program} className="rounded-full bg-[#fff7ed] px-2.5 py-1 text-[10px] font-black ring-1 ring-orange-100">
                      {program}
                    </span>
                  ))}
                </div>
                <p className="mt-3 text-xs font-bold text-[#526178]">
                  <span className="font-black text-[#ff4b12]">Fees: </span>
                  {university.tuitionNote}
                </p>
                <div className="mt-auto flex gap-2 pt-5">
                  <Link
                    to={getUniversityPath(country, university)}
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-[#071f50] px-4 py-3 text-xs font-black text-white transition hover:bg-[#ff4b12]"
                  >
                    View full profile
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

      {/* Monthly budget breakdown + fit check */}
      <section id="fit" className="px-4 py-10 sm:px-5 md:py-14">
        <div className="mx-auto max-w-[1350px]">
          {city.budget && (
            <div className="mb-5 rounded-[30px] bg-white p-6 shadow-[0_20px_55px_rgba(9,31,80,0.07)] ring-1 ring-orange-100 md:p-8">
              <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#ff4b12]">Monthly budget</p>
                  <h2 className="mt-1 text-3xl font-black tracking-[-0.05em]">
                    {symbol}
                    {totals.low.toLocaleString("en-US")} – {symbol}
                    {totals.high.toLocaleString("en-US")} per month
                  </h2>
                </div>
                <Link to={`/countries/${country.slug}#budget`} className="text-xs font-black text-[#ff4b12] hover:underline">
                  Plan your full year with tuition →
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
          )}

          {city.fit && (
            <div className="grid gap-5 lg:grid-cols-2">
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
            </div>
          )}
        </div>
      </section>

      {/* Student life */}
      {country.studentLife && (
        <section id="life" className="bg-[linear-gradient(180deg,#fff7ed_0%,#fff1ea_100%)] px-4 py-10 sm:px-5 md:py-16">
          <div className="mx-auto max-w-[1350px]">
            <SectionHeader
              eyebrow="Student life"
              title={`Everyday life in ${city.name}.`}
              text={`Housing, food, work and community: what your first months in ${city.name} will really look like.`}
            />
            <motion.div
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, amount: 0.15 }}
              transition={{ staggerChildren: 0.06 }}
              className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-3"
            >
              {country.studentLife.map((item) => {
                const Icon = iconFor(item.icon);
                return (
                  <motion.div key={item.title} variants={fadeUp} className="rounded-[28px] bg-white p-6 shadow-[0_18px_50px_rgba(9,31,80,0.07)] ring-1 ring-orange-100">
                    <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[#fff1ea] text-[#ff4b12]">
                      <Icon size={22} strokeWidth={2.6} />
                    </div>
                    <h3 className="mt-4 text-lg font-black tracking-[-0.03em]">{item.title}</h3>
                    <p className="mt-2 text-sm font-semibold leading-6 text-[#61708a]">{item.text}</p>
                  </motion.div>
                );
              })}
            </motion.div>
          </div>
        </section>
      )}

      <CareerPaths country={country} programs={programs} title={`Where studying in ${city.name} can lead.`} />

      {/* Scholarships */}
      <DripDivider color="#071f50" background="#ff4b12" />
      <section id="funding" className="bg-[#ff4b12] px-4 py-12 text-white sm:px-5 md:py-16">
        <div className="mx-auto max-w-[1350px]">
          <SectionHeader
            tone="dark"
            eyebrow={`Funding in ${city.name}`}
            title="Scholarships you can aim for."
            text={city.scholarshipNote || `Students in ${city.name} can apply for ${country.name}'s national scholarships below.`}
          />
          <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {country.scholarships.map((scholarship) => (
              <div key={scholarship.name} className="flex flex-col rounded-[26px] bg-white p-5 text-[#071f50] shadow-[0_22px_55px_rgba(122,30,0,0.22)]">
                <div className="flex items-center justify-between gap-2">
                  <div className="grid h-10 w-10 place-items-center rounded-2xl bg-[#fff1ea] text-[#ff4b12]">
                    <Award size={19} />
                  </div>
                  <span className="rounded-full bg-[#071f50] px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.1em] text-white">{scholarship.level}</span>
                </div>
                <p className="mt-4 text-lg font-black leading-6 tracking-[-0.02em]">{scholarship.name}</p>
                <p className="mt-1 text-[11px] font-bold text-[#7a879c]">{scholarship.provider}</p>
                <p className="mt-3 text-sm font-semibold leading-6 text-[#526178]">{scholarship.covers}</p>
                {scholarship.note && <p className="mt-2 text-xs font-semibold leading-5 text-[#7a879c]">{scholarship.note}</p>}
                {scholarship.link && (
                  <a
                    href={scholarship.link}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-auto inline-flex items-center gap-1.5 pt-4 text-xs font-black text-[#ff4b12] hover:underline"
                  >
                    Official page <ArrowUpRight size={13} strokeWidth={3} />
                  </a>
                )}
              </div>
            ))}
          </div>
          <div className="mt-8 flex justify-center">
            <Link
              to={`/scholarships?country=${country.slug}`}
              className="inline-flex items-center gap-2 rounded-full bg-[#071f50] px-6 py-3.5 text-sm font-black text-white transition hover:-translate-y-0.5 hover:bg-[#0b2a6b]"
            >
              All {country.name} scholarships
              <ArrowRight size={16} strokeWidth={3} />
            </Link>
          </div>
        </div>
      </section>
      <DripDivider color="#ff4b12" background="#fff1ea" />

      {/* Roadmap */}
      {country.timeline && (
        <section id="roadmap" className="bg-[#fff1ea] px-4 py-10 sm:px-5 md:py-14">
          <div className="mx-auto max-w-[1350px]">
            <SectionHeader eyebrow={`${city.name} roadmap`} title="Your path to arriving here." />
            <div className="mt-8 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {country.timeline.map((step, index) => (
                <div key={step.phase} className="rounded-[24px] bg-white p-5 ring-1 ring-orange-100">
                  <div className="flex items-center gap-3">
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#ff4b12] text-xs font-black text-white">{index + 1}</span>
                    <div>
                      <p className="text-sm font-black leading-5">{step.phase}</p>
                      <p className="text-[11px] font-bold text-[#7a879c]">{step.timing}</p>
                    </div>
                  </div>
                  <p className="mt-3 text-xs font-semibold leading-5 text-[#61708a]">{step.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* FAQs */}
      <section id="faqs" className="px-4 py-10 sm:px-5 md:py-14">
        <div className="mx-auto max-w-[1000px]">
          <SectionHeader eyebrow="FAQs" title={`${city.name} questions, answered.`} />
          <FaqList faqs={faqs} />
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
