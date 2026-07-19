import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowRight,
  BadgeCheck,
  Building2,
  Clock3,
  Compass,
  FileCheck2,
  GraduationCap,
  Hourglass,
  MapPin,
  Plane,
  Route,
  ShieldCheck,
  Sparkles,
  Star,
  WalletCards,
} from "lucide-react";

import italyImage from "../../assets/images/country-explorer/italy.png";
import germanyImage from "../../assets/images/country-explorer/germany.png";
import ukImage from "../../assets/images/country-explorer/united-kingdom.png";
import canadaImage from "../../assets/images/country-explorer/canada.png";
import australiaImage from "../../assets/images/country-explorer/australia.png";
import turkeyImage from "../../assets/images/country-explorer/turkey.png";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: "easeOut" } },
};

const liveCountry = {
  name: "Italy",
  flag: "🇮🇹",
  image: italyImage,
  href: "/countries/italy",
  title: "Study in Italy",
  text: "Italy is Zaifan’s first deep-focus destination. Start here for universities, DSU scholarship guidance, student life, costs, visa planning and a complete Italy study journey.",
  stats: [
    ["Live Guide", "Flagship"],
    ["Cities", "8+"],
    ["Universities", "50 Target"],
    ["Scholarship", "DSU Focus"],
  ],
  ecosystem: [
    {
      icon: GraduationCap,
      title: "University Finder",
      text: "Browse Italian universities by city, program, tuition, scholarship strength and student fit.",
      href: "/universities",
      cta: "Explore Universities",
    },
    {
      icon: WalletCards,
      title: "Scholarship Hub",
      text: "Understand DSU, regional grants, merit awards, documents, deadlines and funding routes.",
      href: "/scholarships",
      cta: "View Scholarships",
    },
    {
      icon: MapPin,
      title: "City Guides",
      text: "Compare Milan, Rome, Bologna, Padua, Florence, Turin, Pisa and Venice before choosing.",
      href: "/countries/italy",
      cta: "Open City Map",
    },
    {
      icon: FileCheck2,
      title: "Visa + Document Planning",
      text: "Move from admission planning to scholarship documents, pre-enrolment and visa readiness.",
      href: "/appointment?country=Italy&service=Italy Planning",
      cta: "Plan My Route",
    },
  ],
};

const italyDepthCards = [
  {
    icon: Compass,
    title: "Country Guide",
    text: "A complete Italy destination hub instead of a shallow country card.",
  },
  {
    icon: Building2,
    title: "City System",
    text: "Milan, Rome, Bologna, Padua, Florence, Turin, Pisa and Venice connected.",
  },
  {
    icon: GraduationCap,
    title: "University Database",
    text: "Smart university finder plus individual detail pages for deeper decisions.",
  },
  {
    icon: WalletCards,
    title: "Funding Route",
    text: "DSU, regional scholarships, merit awards and document planning direction.",
  },
  {
    icon: FileCheck2,
    title: "Document Strategy",
    text: "Application, scholarship, pre-enrolment and visa readiness connected.",
  },
  {
    icon: Plane,
    title: "Guided Action",
    text: "Move from research to consultation, shortlisting and application planning.",
  },
];

const roadmapCountries = [
  {
    name: "Germany",
    flag: "🇩🇪",
    code: "DE",
    image: germanyImage,
    priority: "Next Architecture",
    focus: "Public universities, engineering, low-tuition routes and practical career planning.",
    modules: ["Country Guide", "Cities", "Universities", "Funding", "Visa"],
  },
  {
    name: "United Kingdom",
    flag: "🇬🇧",
    code: "GB",
    image: ukImage,
    priority: "Coming Soon",
    focus: "Fast-track degrees, university scholarships, strong postgraduate routes and city-based planning.",
    modules: ["University Finder", "Scholarships", "Intakes", "Cost Guide"],
  },
  {
    name: "Canada",
    flag: "🇨🇦",
    code: "CA",
    image: canadaImage,
    priority: "Coming Soon",
    focus: "Colleges, universities, province-based routes and post-study planning when data is ready.",
    modules: ["Colleges", "Universities", "Province Guide", "Funding"],
  },
  {
    name: "Australia",
    flag: "🇦🇺",
    code: "AU",
    image: australiaImage,
    priority: "Coming Soon",
    focus: "University grants, regional study options, lifestyle planning and future student pathways.",
    modules: ["Cities", "Universities", "Scholarships", "Lifestyle"],
  },
  {
    name: "Turkey",
    flag: "🇹🇷",
    code: "TR",
    image: turkeyImage,
    priority: "Future Route",
    focus: "Affordable education, institutional awards and future partner university routes.",
    modules: ["Affordable Routes", "Partners", "Scholarships", "Guide"],
  },
];

const decisionPoints = [
  {
    icon: Compass,
    title: "Choose with confidence",
    text: "Start with a destination that has real guidance instead of a fake country database.",
  },
  {
    icon: Route,
    title: "Follow a connected journey",
    text: "Country → city → university → scholarship → consultation should feel like one ecosystem.",
  },
  {
    icon: ShieldCheck,
    title: "Trust honest availability",
    text: "Italy is live now. Other countries are visible, but not pretending to be finished.",
  },
];

const italyJourney = [
  {
    icon: Compass,
    title: "Discover Italy",
    text: "Understand why Italy may fit your academic, financial and lifestyle goals.",
    href: "/countries/italy",
  },
  {
    icon: Building2,
    title: "Compare Cities",
    text: "Choose between Milan, Rome, Bologna, Padua, Turin and other student cities.",
    href: "/countries/italy",
  },
  {
    icon: GraduationCap,
    title: "Shortlist Universities",
    text: "Filter universities by program, scholarship strength, tuition and student fit.",
    href: "/universities",
  },
  {
    icon: WalletCards,
    title: "Plan Scholarships",
    text: "Check DSU, regional grants, merit awards and document preparation.",
    href: "/scholarships",
  },
  {
    icon: Plane,
    title: "Book Guidance",
    text: "Turn research into an application, scholarship and visa preparation plan.",
    href: "/appointment?country=Italy",
  },
];

const comparisonRows = [
  ["Current depth", "Flagship guide live", "Preview only"],
  ["Universities", "Smart finder live", "Coming later"],
  ["Scholarships", "DSU + regional planning live", "Roadmap"],
  ["City guides", "Dynamic city system live", "Future architecture"],
  ["Best action", "Explore now", "Request / waitlist"],
];

function CountriesPage() {
  return (
    <section className="relative overflow-hidden bg-[#fff5e9] px-5 pb-24 pt-28 text-[#071f50]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_12%,rgba(255,75,18,0.13),transparent_30%),radial-gradient(circle_at_88%_18%,rgba(255,190,92,0.18),transparent_28%)]" />
      <div className="pointer-events-none absolute -left-36 top-28 h-96 w-96 rounded-full bg-orange-300/20 blur-3xl" />
      <div className="pointer-events-none absolute -right-36 bottom-32 h-96 w-96 rounded-full bg-orange-500/10 blur-3xl" />

      <div className="relative mx-auto max-w-[1600px]">
        <motion.div
          initial="hidden"
          whileInView="show"
          variants={fadeUp}
          viewport={{ once: true }}
          className="mb-10 text-center"
        >
          <div className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-xs font-black uppercase tracking-[0.2em] text-[#ff4b12] shadow-sm ring-1 ring-orange-100">
            <Sparkles size={16} fill="currentColor" />
            Italy live. More countries coming soon.
          </div>

          <h1 className="mx-auto mt-6 max-w-5xl text-5xl font-black leading-[0.98] tracking-[-0.06em] md:text-7xl">
            Start with the destination we’re building{" "}
            <span className="text-[#ff4b12]">properly.</span>
          </h1>

          <p className="mx-auto mt-6 max-w-3xl text-lg font-semibold leading-8 text-[#526178]">
            This hub is not just country cards. It shows which destination is ready,
            what ecosystem exists inside it, and what future destinations will unlock later.
          </p>
        </motion.div>

        <div className="mx-auto grid max-w-[1450px] gap-7 xl:grid-cols-[minmax(0,1.55fr)_minmax(380px,0.85fr)]">
          <motion.article
            initial={{ opacity: 0, x: -28 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.65 }}
            viewport={{ once: true }}
            className="group relative overflow-hidden rounded-[42px] bg-white shadow-[0_34px_95px_rgba(255,75,18,0.16)] ring-1 ring-orange-100"
          >
            <div className="grid md:grid-cols-[1.05fr_1.15fr]">
              <div className="relative min-h-[410px] overflow-hidden bg-orange-50 md:h-full">
                <img
                  src={liveCountry.image}
                  alt="Study in Italy"
                  className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#071f50]/62 via-transparent to-transparent" />

                <div className="absolute left-6 top-6 inline-flex items-center gap-2 rounded-full bg-white/95 px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-[#ff4b12] shadow-lg">
                  <BadgeCheck size={15} />
                  Live Destination
                </div>

                <div className="absolute bottom-6 left-6 right-6 rounded-[28px] bg-white/94 p-5 shadow-xl backdrop-blur">
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-[#ff4b12]">
                    Featured Country
                  </p>
                  <h3 className="mt-2 text-3xl font-black tracking-[-0.055em] text-[#071f50] md:text-4xl">
                    {liveCountry.flag} {liveCountry.title}
                  </h3>
                </div>
              </div>

              <div className="flex min-w-0 flex-col p-7 md:p-9">
                <div className="inline-flex w-fit items-center gap-2 rounded-full bg-[#fff1ea] px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-[#ff4b12] ring-1 ring-orange-100">
                  <MapPin size={15} />
                  Best place to start
                </div>

                <h2 className="mt-5 text-4xl font-black leading-[0.96] tracking-[-0.055em] md:text-5xl">
                  Your complete Italy journey starts here.
                </h2>

                <p className="mt-5 text-[15px] font-semibold leading-8 text-[#526178]">
                  {liveCountry.text}
                </p>

                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  {liveCountry.stats.map(([label, value]) => (
                    <div
                      key={label}
                      className="rounded-2xl bg-[#fffaf5] px-4 py-4 ring-1 ring-orange-100"
                    >
                      <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#ff4b12]">
                        {label}
                      </p>
                      <p className="mt-1 text-xl font-black text-[#071f50]">
                        {value}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="mt-7 grid gap-3 sm:grid-cols-2">
                  <Link
                    to={liveCountry.href}
                    className="inline-flex items-center justify-center gap-3 rounded-full bg-[#ff4b12] px-6 py-4 text-sm font-black text-white shadow-[0_18px_38px_rgba(255,75,18,0.28)] transition hover:-translate-y-1 hover:bg-[#ff642f]"
                  >
                    Explore Italy Guide
                    <ArrowRight size={19} strokeWidth={3} />
                  </Link>

                  <a
                    href="/appointment?country=Italy"
                    className="inline-flex items-center justify-center gap-3 rounded-full bg-white px-6 py-4 text-sm font-black text-[#ff4b12] ring-1 ring-orange-200 transition hover:-translate-y-1 hover:bg-[#fff1ea]"
                  >
                    Book Italy Consultation
                  </a>
                </div>
              </div>

              <div className="border-t border-orange-100 bg-[#fffaf5] p-6 md:col-span-2 md:p-7">
                <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                  <div>
                    <div className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-[#ff4b12] shadow-sm ring-1 ring-orange-100">
                      <Route size={15} />
                      Italy depth map
                    </div>
                    <h3 className="mt-3 text-2xl font-black tracking-[-0.04em] text-[#071f50] md:text-3xl">
                      Everything inside Italy connects to the next step.
                    </h3>
                  </div>

                  <p className="max-w-xl text-sm font-semibold leading-7 text-[#526178]">
                    This fills the card with useful guidance instead of empty space:
                    country, cities, universities, scholarships, documents and action.
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {italyDepthCards.map((item) => {
                    const Icon = item.icon;

                    return (
                      <div
                        key={item.title}
                        className="rounded-[22px] bg-white p-4 shadow-sm ring-1 ring-orange-100"
                      >
                        <div className="flex items-start gap-3">
                          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[#fff1ea] text-[#ff4b12] ring-1 ring-orange-100">
                            <Icon size={21} strokeWidth={2.7} />
                          </div>

                          <div>
                            <h4 className="text-sm font-black text-[#071f50]">
                              {item.title}
                            </h4>
                            <p className="mt-1 text-xs font-semibold leading-5 text-[#61708a]">
                              {item.text}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </motion.article>

          <motion.aside
            initial={{ opacity: 0, x: 28 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.65 }}
            viewport={{ once: true }}
            className="rounded-[42px] bg-[#071f50] p-7 text-white shadow-[0_32px_90px_rgba(7,31,80,0.18)]"
          >
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-[#ffb36d] ring-1 ring-white/10">
              <Clock3 size={15} />
              How to use this hub
            </div>

            <h3 className="mt-5 text-4xl font-black leading-tight tracking-[-0.05em]">
              No fake country wall. Just a real path.
            </h3>

            <p className="mt-4 text-sm font-semibold leading-7 text-white/72">
              This page guides students toward the destination with the most complete
              ecosystem first, while still making it clear Zaifan will expand beyond Italy.
            </p>

            <div className="mt-7 space-y-4">
              {decisionPoints.map((item) => {
                const Icon = item.icon;

                return (
                  <div
                    key={item.title}
                    className="rounded-[26px] bg-white/8 p-5 ring-1 ring-white/10"
                  >
                    <div className="flex gap-4">
                      <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[#ff4b12] text-white">
                        <Icon size={22} strokeWidth={3} />
                      </div>

                      <div>
                        <h4 className="font-black text-white">{item.title}</h4>
                        <p className="mt-2 text-sm font-semibold leading-6 text-white/68">
                          {item.text}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-6 rounded-[26px] bg-white/10 p-5 ring-1 ring-white/10">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-[#ffb36d]">
                Current recommendation
              </p>
              <h4 className="mt-2 text-2xl font-black">Start with Italy.</h4>
              <p className="mt-2 text-sm font-semibold leading-7 text-white/70">
                Italy has the guide, university finder, city pages and scholarship ecosystem ready now.
              </p>
            </div>
          </motion.aside>
        </div>

        <section className="mx-auto mt-10 max-w-[1450px] rounded-[42px] bg-white/88 p-6 shadow-[0_24px_70px_rgba(9,31,80,0.08)] ring-1 ring-orange-100 md:p-8">
          <div className="mb-7 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-[#fff1ea] px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-[#ff4b12] ring-1 ring-orange-100">
                <Route size={15} />
                Italy ecosystem
              </div>

              <h3 className="mt-4 max-w-4xl text-4xl font-black leading-tight tracking-[-0.05em]">
                Italy is not just one page — it is a connected student journey.
              </h3>
            </div>
          </div>

          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {liveCountry.ecosystem.map((item) => {
              const Icon = item.icon;

              return (
                <Link
                  key={item.title}
                  to={item.href}
                  className="group rounded-[30px] bg-[#fffaf5] p-6 ring-1 ring-orange-100 transition duration-300 hover:-translate-y-1 hover:bg-white hover:shadow-[0_24px_60px_rgba(255,75,18,0.12)]"
                >
                  <div className="mb-5 flex items-start justify-between gap-3">
                    <div className="grid h-14 w-14 place-items-center rounded-2xl bg-white text-[#ff4b12] ring-1 ring-orange-100">
                      <Icon size={27} strokeWidth={2.7} />
                    </div>
                    <ArrowRight
                      size={20}
                      strokeWidth={3}
                      className="text-[#ff4b12] transition group-hover:translate-x-1"
                    />
                  </div>

                  <h4 className="text-xl font-black tracking-[-0.035em] text-[#071f50]">
                    {item.title}
                  </h4>
                  <p className="mt-3 text-sm font-semibold leading-7 text-[#526178]">
                    {item.text}
                  </p>
                  <p className="mt-5 text-xs font-black uppercase tracking-[0.15em] text-[#ff4b12]">
                    {item.cta}
                  </p>
                </Link>
              );
            })}
          </div>
        </section>

        <section className="mx-auto mt-10 max-w-[1450px] rounded-[42px] bg-[#071f50] p-6 text-white shadow-[0_30px_90px_rgba(7,31,80,0.18)] md:p-8">
          <div className="mb-8 text-center">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-[#ffb36d] ring-1 ring-white/10">
              <Plane size={15} />
              Student journey
            </div>

            <h3 className="mx-auto mt-4 max-w-4xl text-4xl font-black leading-tight tracking-[-0.05em] md:text-5xl">
              From country research to real action.
            </h3>
          </div>

          <div className="grid gap-4 md:grid-cols-5">
            {italyJourney.map((step, index) => {
              const Icon = step.icon;

              return (
                <Link
                  key={step.title}
                  to={step.href}
                  className="group rounded-[28px] bg-white/10 p-5 ring-1 ring-white/10 transition hover:-translate-y-1 hover:bg-white/14"
                >
                  <div className="mb-5 flex items-center justify-between gap-3">
                    <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[#ff4b12] text-white">
                      <Icon size={23} strokeWidth={3} />
                    </div>
                    <span className="text-3xl font-black tracking-[-0.06em] text-white/15">
                      0{index + 1}
                    </span>
                  </div>

                  <h4 className="text-lg font-black text-white">{step.title}</h4>
                  <p className="mt-3 text-xs font-semibold leading-6 text-white/68">
                    {step.text}
                  </p>
                </Link>
              );
            })}
          </div>
        </section>

        <section className="mx-auto mt-10 max-w-[1450px] rounded-[42px] bg-white/88 p-6 shadow-[0_24px_70px_rgba(9,31,80,0.08)] ring-1 ring-orange-100 md:p-8">
          <div className="mb-7 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-[#fff1ea] px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-[#ff4b12] ring-1 ring-orange-100">
                <Star size={15} />
                Country readiness comparison
              </div>

              <h3 className="mt-4 text-4xl font-black leading-tight tracking-[-0.05em]">
                What is ready now vs what is still coming.
              </h3>
            </div>

            <Link
              to="/countries/italy"
              className="inline-flex items-center justify-center gap-3 rounded-[20px] bg-[#ff4b12] px-7 py-4 text-sm font-black text-white shadow-[0_18px_38px_rgba(255,75,18,0.26)] transition hover:-translate-y-1 hover:bg-[#ff642f]"
            >
              Start With Italy
              <ArrowRight size={18} strokeWidth={3} />
            </Link>
          </div>

          <div className="overflow-hidden rounded-[28px] ring-1 ring-orange-100">
            <div className="hidden grid-cols-[0.9fr_1.1fr_1.1fr] bg-[#071f50] px-5 py-4 text-xs font-black uppercase tracking-[0.14em] text-white md:grid">
              <div>Factor</div>
              <div>Italy</div>
              <div>Other Countries</div>
            </div>

            <div className="divide-y divide-orange-100 bg-white">
              {comparisonRows.map(([factor, italy, others]) => (
                <div
                  key={factor}
                  className="grid gap-3 px-5 py-5 text-sm font-bold text-[#526178] md:grid-cols-[0.9fr_1.1fr_1.1fr]"
                >
                  <div className="font-black text-[#071f50]">{factor}</div>
                  <div>{italy}</div>
                  <div>{others}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto mt-10 max-w-[1450px] rounded-[42px] bg-white/84 p-6 shadow-[0_24px_70px_rgba(9,31,80,0.08)] ring-1 ring-orange-100 backdrop-blur md:p-8">
          <div className="mb-7 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-[#fff1ea] px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-[#ff4b12] ring-1 ring-orange-100">
                <Hourglass size={15} />
                Country expansion roadmap
              </div>

              <h3 className="mt-4 text-4xl font-black leading-tight tracking-[-0.05em]">
                More countries are visible — but honestly marked coming soon.
              </h3>
            </div>

            <a
              href="/appointment?service=Request Country Guide"
              className="inline-flex items-center justify-center gap-3 rounded-[20px] bg-[#071f50] px-7 py-4 text-sm font-black text-white shadow-[0_18px_38px_rgba(7,31,80,0.18)] transition hover:-translate-y-1 hover:bg-[#092b72]"
            >
              Request Country Guide
              <ArrowRight size={18} strokeWidth={3} />
            </a>
          </div>

          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-5">
            {roadmapCountries.map((country, index) => (
              <motion.article
                key={country.name}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.06 }}
                viewport={{ once: true }}
                className="group overflow-hidden rounded-[28px] bg-white shadow-[0_18px_45px_rgba(9,31,80,0.07)] ring-1 ring-orange-100"
              >
                <div className="relative h-40 overflow-hidden bg-orange-50">
                  <img
                    src={country.image}
                    alt={`${country.name} coming soon`}
                    className="h-full w-full object-cover opacity-75 grayscale transition duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#071f50]/40 to-transparent" />

                  <div className="absolute left-4 top-4 rounded-full bg-white/95 px-3 py-1.5 text-xs font-black text-[#071f50] shadow-sm">
                    {country.code} {country.name}
                  </div>

                  <div className="absolute bottom-4 left-4 rounded-full bg-[#ff4b12] px-3 py-1.5 text-xs font-black uppercase text-white shadow-lg">
                    {country.priority}
                  </div>
                </div>

                <div className="p-5">
                  <h4 className="text-xl font-black tracking-[-0.035em] text-[#071f50]">
                    {country.flag} {country.name}
                  </h4>

                  <p className="mt-3 text-sm font-bold leading-7 text-[#526178]">
                    {country.focus}
                  </p>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {country.modules.map((module) => (
                      <span
                        key={module}
                        className="rounded-full bg-[#fff1ea] px-3 py-1 text-[10px] font-black text-[#ff4b12] ring-1 ring-orange-100"
                      >
                        {module}
                      </span>
                    ))}
                  </div>
                </div>
              </motion.article>
            ))}
          </div>
        </section>

        <section className="mx-auto mt-10 max-w-[1450px] overflow-hidden rounded-[42px] bg-gradient-to-r from-[#ff7b1c] via-[#ff4b12] to-[#ff7b1c] p-7 text-white shadow-[0_24px_70px_rgba(255,75,18,0.24)] md:p-9">
          <div className="grid gap-7 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-white/76">
                Ready to choose smartly?
              </p>
              <h3 className="mt-3 text-3xl font-black tracking-[-0.045em] md:text-5xl">
                Start with the country that has the deepest guide.
              </h3>
              <p className="mt-4 max-w-3xl text-base font-semibold leading-8 text-white/88">
                Italy is live now with universities, cities, scholarships and consultation pathways.
                More destinations will unlock when they can be built properly.
              </p>
            </div>

            <Link
              to="/countries/italy"
              className="inline-flex items-center justify-center gap-3 rounded-full bg-[#071f50] px-9 py-5 font-black text-white shadow-[0_20px_44px_rgba(7,31,80,0.28)] transition hover:-translate-y-1 hover:bg-[#092b72]"
            >
              Explore Italy Ecosystem
              <ArrowRight size={22} strokeWidth={3} />
            </Link>
          </div>
        </section>
      </div>
    </section>
  );
}

export default CountriesPage;
