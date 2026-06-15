import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowRight,
  BadgeCheck,
  BadgeDollarSign,
  BookOpenCheck,
  Building2,
  CheckCircle2,
  Compass,
  GraduationCap,
  Headphones,
  Hourglass,
  MapPin,
  Plane,
  Route,
  ShieldCheck,
  Sparkles,
  Star,
  UsersRound,
} from "lucide-react";

import australiaImage from "../assets/images/country-explorer/australia.png";
import canadaImage from "../assets/images/country-explorer/canada.png";
import guideCharacter from "../assets/images/country-explorer/country-guide-character.png";
import germanyImage from "../assets/images/country-explorer/germany.png";
import italyImage from "../assets/images/country-explorer/italy.png";
import turkeyImage from "../assets/images/country-explorer/turkey.png";
import ukImage from "../assets/images/country-explorer/united-kingdom.png";

const destinations = [
  {
    flag: "🇮🇹",
    code: "IT",
    name: "Italy",
    status: "available",
    badge: "Live Destination",
    image: italyImage,
    headline: "Zaifan’s first deep-focus study destination.",
    description:
      "Italy is our priority destination right now — so we can build real guidance, real university profiles, real scholarship knowledge and a stronger student journey instead of pretending to cover every country at once.",
    universities: "Italian universities",
    tuition: "Low tuition pathways",
    visa: "Guided step-by-step",
    fit: "Students who want affordable Europe, culture, design, business, engineering and globally respected education.",
    scholarship: "Italy scholarship guidance available",
    courses: ["Business", "Design", "Engineering", "Arts", "Architecture"],
    highlights: [
      "Public university pathways",
      "Regional scholarship guidance",
      "Affordable European study route",
      "Italy-first counseling support",
    ],
    href: "/countries/italy",
  },
  {
    flag: "🇩🇪",
    code: "DE",
    name: "Germany",
    status: "coming-soon",
    badge: "Coming Soon",
    image: germanyImage,
    headline: "Germany pathway is being researched.",
    description:
      "We will open Germany once the guidance, university information and student requirements are strong enough to publish with confidence.",
    universities: "Coming soon",
    tuition: "Coming soon",
    visa: "Coming soon",
    fit: "Engineering, IT and career-focused students.",
    scholarship: "Germany guidance coming soon",
    courses: ["Engineering", "IT", "Management"],
    highlights: ["University research", "Admissions pathway", "Visa notes", "Cost guide"],
  },
  {
    flag: "🇬🇧",
    code: "GB",
    name: "United Kingdom",
    status: "coming-soon",
    badge: "Coming Soon",
    image: ukImage,
    headline: "UK destination hub will open later.",
    description:
      "The UK is not the main focus today. It will be added when Zaifan is ready to provide deeper university and scholarship guidance.",
    universities: "Coming soon",
    tuition: "Coming soon",
    visa: "Coming soon",
    fit: "Fast-track degree seekers and global recognition.",
    scholarship: "UK guidance coming soon",
    courses: ["Business", "Law", "Health"],
    highlights: ["University profiles", "Course options", "Funding notes", "Visa route"],
  },
  {
    flag: "🇨🇦",
    code: "CA",
    name: "Canada",
    status: "coming-soon",
    badge: "Coming Soon",
    image: canadaImage,
    headline: "Canada pathway will be added country by country.",
    description:
      "Canada will join after Italy becomes strong. This keeps the website honest, focused and easier to maintain with real information.",
    universities: "Coming soon",
    tuition: "Coming soon",
    visa: "Coming soon",
    fit: "Long-term planning and settlement-minded students.",
    scholarship: "Canada guidance coming soon",
    courses: ["CS", "Business", "Health"],
    highlights: ["Study routes", "Cost planning", "Program matching", "Student life"],
  },
  {
    flag: "🇦🇺",
    code: "AU",
    name: "Australia",
    status: "coming-soon",
    badge: "Coming Soon",
    image: australiaImage,
    headline: "Australia destination guide is planned.",
    description:
      "Australia will be expanded later with honest, researched information instead of shallow placeholder claims.",
    universities: "Coming soon",
    tuition: "Coming soon",
    visa: "Coming soon",
    fit: "Lifestyle, career balance and international study.",
    scholarship: "Australia guidance coming soon",
    courses: ["Nursing", "IT", "Business"],
    highlights: ["University options", "Visa route", "Scholarships", "Living costs"],
  },
  {
    flag: "🇹🇷",
    code: "TR",
    name: "Turkey",
    status: "coming-soon",
    badge: "Coming Soon",
    image: turkeyImage,
    headline: "Turkey will be explored after the Italy hub.",
    description:
      "Turkey remains on the future roadmap, but Italy comes first so Zaifan can build one excellent country hub before expanding.",
    universities: "Coming soon",
    tuition: "Coming soon",
    visa: "Coming soon",
    fit: "Budget-friendly education and regional access.",
    scholarship: "Turkey guidance coming soon",
    courses: ["Medicine", "Business", "Tourism"],
    highlights: ["Affordable routes", "University list", "Admission guide", "Student life"],
  },
];

const italyMilestones = [
  {
    icon: Compass,
    title: "Discover Italy",
    text: "Explore cities, costs, lifestyle and study routes.",
  },
  {
    icon: GraduationCap,
    title: "Choose Universities",
    text: "Find the right universities and courses for your goals.",
  },
  {
    icon: BadgeDollarSign,
    title: "Find Funding",
    text: "Explore scholarships, regional support and affordable pathways.",
  },
  {
    icon: Plane,
    title: "Apply With Guidance",
    text: "Move from interest to application with expert support.",
  },
];

const focusStats = [
  {
    icon: Star,
    value: "01",
    label: "Priority Country",
    text: "Italy first, not every country at once.",
  },
  {
    icon: Building2,
    value: "50+",
    label: "Universities",
    text: "Italian universities in our roadmap.",
  },
  {
    icon: GraduationCap,
    value: "DSU",
    label: "Scholarship Focus",
    text: "Regional, DSU and university funding.",
  },
  {
    icon: ShieldCheck,
    value: "Real",
    label: "Guidance",
    text: "No fake data or random country lists.",
  },
];

const whyItalyReasons = [
  {
    icon: BookOpenCheck,
    title: "Quality Over Quantity",
    text: "One strong country hub before we expand further.",
  },
  {
    icon: GraduationCap,
    title: "Real Guidance",
    text: "University, scholarship, admission and visa info you can rely on.",
  },
  {
    icon: ShieldCheck,
    title: "Student-first Approach",
    text: "Designed to reduce confusion and make every step clearer.",
  },
  {
    icon: Headphones,
    title: "Personal Counseling",
    text: "Italy-first counseling and consultation support.",
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 34, scale: 0.98 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.55, ease: "easeOut" },
  },
};

function FocusStat({ item }) {
  const Icon = item.icon;

  return (
    <div className="group/stat relative overflow-hidden rounded-[26px] bg-white/90 p-5 text-left shadow-[0_18px_42px_rgba(9,31,80,0.07)] ring-1 ring-orange-100 transition duration-300 hover:-translate-y-1 hover:shadow-[0_24px_58px_rgba(255,75,18,0.13)]">
      <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-[#fff1ea]" />
      <div className="relative flex items-start gap-4">
        <div className="grid h-13 w-13 shrink-0 place-items-center rounded-2xl bg-[#fff1ea] text-[#ff4b12] shadow-inner ring-1 ring-orange-100 transition duration-300 group-hover/stat:scale-105">
          <Icon size={25} strokeWidth={2.7} />
        </div>
        <div>
          <p className="text-3xl font-black leading-none tracking-[-0.05em] text-[#ff4b12]">
            {item.value}
          </p>
          <p className="mt-1 text-sm font-black text-[#071f50]">{item.label}</p>
          <p className="mt-2 text-xs font-bold leading-5 text-[#61708a]">
            {item.text}
          </p>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ icon, label, value, muted = false }) {
  return (
    <div className="grid grid-cols-[1fr_auto] items-center gap-3 border-t border-orange-100/80 py-3 first:border-t-0 first:pt-0 last:pb-0">
      <div className="flex min-w-0 items-center gap-2">
        <span className="shrink-0 text-[13px] text-[#ff4b12]">{icon}</span>
        <span className="whitespace-nowrap text-[11px] font-extrabold text-[#526178]">
          {label}
        </span>
      </div>
      <span
        className={`whitespace-nowrap text-right text-[12px] font-black ${
          muted ? "text-[#98a2b3]" : "text-[#071f50]"
        }`}
      >
        {value}
      </span>
    </div>
  );
}

function ItalyReasonPanel() {
  return (
    <motion.div variants={cardVariants} className="space-y-5">
      <div>
        <div className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-xs font-black uppercase tracking-[0.18em] text-[#ff4b12] shadow-sm ring-1 ring-orange-100">
          <Star size={15} fill="currentColor" strokeWidth={3} />
          Live Destination
        </div>

        <h3 className="mt-5 max-w-2xl text-5xl font-black leading-[0.92] tracking-[-0.06em] text-[#071f50] md:text-6xl">
          Why Italy is our{" "}
          <span className="text-[#ff4b12]">first destination.</span>
        </h3>

        <p className="mt-5 max-w-2xl text-base font-semibold leading-8 text-[#526178]">
          Zaifan is choosing depth over quantity. Italy is our first deep-focus
          destination so we can build real guidance, real university profiles,
          real scholarships and a stronger student journey.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {whyItalyReasons.map((item) => {
          const Icon = item.icon;

          return (
            <div
              key={item.title}
              className="rounded-[24px] bg-white/90 p-5 text-center shadow-[0_16px_38px_rgba(9,31,80,0.06)] ring-1 ring-orange-100 transition hover:-translate-y-1 hover:shadow-[0_22px_50px_rgba(255,75,18,0.12)]"
            >
              <div className="mx-auto grid h-13 w-13 place-items-center rounded-2xl bg-[#fff1ea] text-[#ff4b12] ring-1 ring-orange-100">
                <Icon size={25} strokeWidth={2.7} />
              </div>
              <h4 className="mt-4 text-sm font-black leading-tight text-[#071f50]">
                {item.title}
              </h4>
              <p className="mt-2 text-xs font-bold leading-5 text-[#61708a]">
                {item.text}
              </p>
            </div>
          );
        })}
      </div>

      <div className="rounded-[30px] bg-white/86 p-6 shadow-[0_20px_55px_rgba(9,31,80,0.07)] ring-1 ring-orange-100">
        <p className="text-center text-xs font-black uppercase tracking-[0.2em] text-[#ff4b12]">
          The Italy Journey With Zaifan
        </p>

        <div className="mt-6 grid gap-4 sm:grid-cols-4">
          {italyMilestones.map((item, index) => {
            const Icon = item.icon;

            return (
              <div key={item.title} className="text-center">
                <div className="relative mx-auto grid h-14 w-14 place-items-center rounded-full bg-white text-[#ff4b12] shadow-md ring-1 ring-orange-100">
                  <Icon size={24} strokeWidth={2.7} />
                  <span className="absolute -bottom-3 grid h-6 w-6 place-items-center rounded-full bg-[#ff4b12] text-[10px] font-black text-white">
                    {index + 1}
                  </span>
                </div>

                <h4 className="mt-6 text-sm font-black text-[#071f50]">
                  {item.title}
                </h4>
                <p className="mt-2 text-xs font-semibold leading-5 text-[#61708a]">
                  {item.text}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid gap-4 rounded-[30px] bg-white/86 p-5 shadow-[0_18px_45px_rgba(9,31,80,0.06)] ring-1 ring-orange-100 sm:grid-cols-2 xl:grid-cols-4">
  {focusStats.map((item) => {
    const Icon = item.icon;

    return (
      <div
        key={item.label}
        className="rounded-[22px] bg-white p-5 text-center shadow-sm ring-1 ring-orange-100"
      >
        <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-[#fff1ea] text-[#ff4b12] ring-1 ring-orange-100">
          <Icon size={23} strokeWidth={2.7} />
        </div>

        <p className="mt-4 text-3xl font-black leading-none tracking-[-0.04em] text-[#ff4b12]">
          {item.value}
        </p>

        <h4 className="mt-2 text-xs font-black leading-tight text-[#071f50]">
          {item.label}
        </h4>

        <p className="mt-2 text-[11px] font-semibold leading-5 text-[#61708a]">
          {item.text}
        </p>
      </div>
    );
  })}
</div>
    </motion.div>
  );
}

function ItalySpotlightCard({ country, onActivate }) {
  return (
    <motion.article
      variants={cardVariants}
      onMouseEnter={onActivate}
      onFocus={onActivate}
      tabIndex={0}
      className="group relative overflow-hidden rounded-[34px] bg-white shadow-[0_26px_75px_rgba(255,75,18,0.14)] ring-2 ring-[#ff4b12]/28 focus:outline-none focus:ring-4 focus:ring-[#ff4b12]/20"
    >
      <div className="relative h-[380px] overflow-hidden bg-orange-50">
        <img
          src={country.image}
          alt="Study in Italy with Zaifan"
          className="h-full w-full object-cover transition duration-700 group-hover:scale-105 group-focus:scale-105"
        />

        <div className="absolute inset-0 bg-gradient-to-t from-[#071f50]/72 via-[#071f50]/10 to-transparent" />

        <div className="absolute left-6 top-6 inline-flex items-center gap-2 rounded-full bg-white/95 px-4 py-2 text-[11px] font-black uppercase tracking-[0.14em] text-[#ff4b12] shadow-lg ring-1 ring-white/70 backdrop-blur">
          <Star size={14} fill="currentColor" strokeWidth={3} />
          {country.badge}
        </div>

        <div className="absolute bottom-6 left-6 max-w-[360px] rounded-[24px] bg-white/94 p-5 shadow-xl ring-1 ring-white/80 backdrop-blur">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-[#ff4b12]">
            Featured Destination
          </p>
          <div className="mt-2 flex items-center gap-3">
            <span className="text-4xl">{country.flag}</span>
            <h3 className="text-3xl font-black tracking-[-0.05em] text-[#071f50]">
              Study in {country.name}
            </h3>
          </div>
        </div>
      </div>

      <div className="relative bg-[#fffaf5] p-6 md:p-8">
        <div className="absolute right-0 top-0 h-36 w-36 rounded-bl-[70px] bg-[#fff1ea]" />

        <div className="relative">
          <div className="inline-flex w-fit items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-[#ff4b12] shadow-sm ring-1 ring-orange-100">
            <Sparkles size={15} fill="currentColor" />
            Italy-first study route
          </div>

          <h3 className="mt-5 text-4xl font-black leading-[0.95] tracking-[-0.055em] text-[#071f50] md:text-5xl">
            Your Italian Journey{" "}
            <span className="text-[#ff4b12]">Starts Here.</span>
          </h3>

          <p className="mt-5 text-[15px] font-semibold leading-7 text-[#526178]">
            {country.description}
          </p>
        </div>

        <div className="relative mt-6 grid gap-3 md:grid-cols-[1fr_0.9fr]">
          <div className="rounded-[22px] bg-white/80 p-4 ring-1 ring-orange-100">
            <InfoRow icon="🎓" label="Focus" value={country.universities} />
            <InfoRow icon="💰" label="Funding" value={country.tuition} />
            <InfoRow icon="🛂" label="Process" value={country.visa} />
          </div>

          <div className="grid gap-2">
            {country.highlights.map((item) => (
              <div
                key={item}
                className="flex items-center gap-2 rounded-2xl bg-white px-3.5 py-3 text-xs font-black text-[#071f50] shadow-sm ring-1 ring-orange-100"
              >
                <CheckCircle2
                  size={16}
                  className="text-[#ff4b12]"
                  strokeWidth={3}
                />
                {item}
              </div>
            ))}
          </div>
        </div>

        <div className="relative mt-5 flex flex-wrap gap-2">
          {country.courses.map((course) => (
            <span
              key={course}
              className="rounded-full bg-white px-3.5 py-2 text-xs font-black text-[#071f50] shadow-sm ring-1 ring-orange-100"
            >
              {course}
            </span>
          ))}
        </div>

        <div className="relative mt-6 grid gap-3 sm:grid-cols-2">
          <a
            href={country.href}
            className="inline-flex items-center justify-center gap-3 rounded-2xl bg-[#ff4b12] px-5 py-4 text-sm font-black text-white shadow-[0_16px_34px_rgba(255,75,18,0.28)] transition hover:-translate-y-1 hover:bg-[#ff642f]"
          >
            Explore Italy Hub
            <ArrowRight size={18} strokeWidth={3} />
          </a>

          <a
            href="/appointment?country=Italy"
            className="inline-flex items-center justify-center gap-3 rounded-2xl border border-[#ff4b12]/25 bg-white px-5 py-4 text-sm font-black text-[#ff4b12] shadow-sm transition hover:-translate-y-1 hover:bg-[#fff1ea]"
          >
            Book Consultation
          </a>
        </div>
      </div>
    </motion.article>
  );
}

function ComingSoonCountryCard({ country, isActive, onActivate }) {
  return (
    <motion.article
      variants={cardVariants}
      tabIndex={0}
      onMouseEnter={onActivate}
      onFocus={onActivate}
      aria-label={`${country.name} study destination coming soon`}
      className={`group relative flex h-full min-h-[268px] flex-col overflow-hidden rounded-[26px] bg-white shadow-[0_16px_34px_rgba(9,31,80,0.08)] ring-1 transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_22px_48px_rgba(9,31,80,0.12)] focus:outline-none focus:ring-4 focus:ring-[#ff4b12]/20 ${
        isActive ? "ring-[#ffb36d]/90" : "ring-orange-100/90"
      }`}
    >
      <div className="relative h-[145px] overflow-hidden bg-orange-50">
        <img
          src={country.image}
          alt={`${country.name} destination preview`}
          className="h-full w-full object-cover opacity-[0.62] grayscale transition duration-700 group-hover:scale-105 group-focus:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#071f50]/32 via-white/10 to-white/0" />

        <div className="absolute left-4 top-4 inline-flex items-center gap-2 rounded-full bg-white/95 px-3.5 py-2 text-[11px] font-black text-[#071f50] shadow-[0_10px_24px_rgba(9,31,80,0.12)] ring-1 ring-white/70 backdrop-blur">
          <span>{country.code}</span>
          <span>{country.name}</span>
        </div>

        <div className="absolute bottom-4 left-4 inline-flex items-center gap-2 rounded-full bg-[#ff4b12] px-3.5 py-2 text-[11px] font-black text-white shadow-[0_12px_24px_rgba(255,75,18,0.22)]">
          <Hourglass size={13} strokeWidth={3} />
          Coming Soon
        </div>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <p className="text-[14px] font-bold leading-7 text-[#526178]">
          {country.description}
        </p>

        <div className="mt-auto flex flex-wrap gap-2 pt-4">
          {country.highlights.slice(0, 2).map((item) => (
            <span
              key={item}
              className="rounded-full bg-[#fff8f1] px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.12em] text-[#a1682d] ring-1 ring-orange-100"
            >
              {item}
            </span>
          ))}
        </div>
      </div>
    </motion.article>
  );
}

function Milestone({ item, index }) {
  const Icon = item.icon;

  return (
    <motion.div
      variants={cardVariants}
      className="relative rounded-[26px] bg-white/90 p-5 shadow-[0_18px_44px_rgba(9,31,80,0.07)] ring-1 ring-orange-100"
    >
      <div className="mb-4 flex items-center justify-between">
        <div className="grid h-13 w-13 place-items-center rounded-2xl bg-[#fff1ea] text-[#ff4b12] ring-1 ring-orange-100">
          <Icon size={25} strokeWidth={2.7} />
        </div>
        <span className="text-4xl font-black tracking-[-0.06em] text-orange-100">
          0{index + 1}
        </span>
      </div>
      <h4 className="text-lg font-black tracking-[-0.03em] text-[#071f50]">
        {item.title}
      </h4>
      <p className="mt-2 text-sm font-semibold leading-6 text-[#61708a]">
        {item.text}
      </p>
    </motion.div>
  );
}

function Countries() {
  const [activeCountry, setActiveCountry] = useState(destinations[0].name);

  const selectedCountry = useMemo(
    () =>
      destinations.find((country) => country.name === activeCountry) ||
      destinations[0],
    [activeCountry]
  );

  const italy = destinations[0];
  const comingSoon = destinations.slice(1);

  return (
    <section
      id="countries"
      className="relative overflow-hidden bg-[#fff5e9] px-5 py-28 text-[#071f50]"
    >
      <style>{`
        @keyframes countryFloat {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-14px) rotate(2deg); }
        }

        @keyframes routeDash {
          from { stroke-dashoffset: 0; }
          to { stroke-dashoffset: -260; }
        }

        @keyframes guidePeek {
          0%, 100% { transform: translateY(0px) translateX(0px); }
          50% { transform: translateY(-8px) translateX(4px); }
        }

        @keyframes softPulse {
          0%, 100% { transform: scale(1); opacity: .9; }
          50% { transform: scale(1.04); opacity: 1; }
        }

        .country-float { animation: countryFloat 6s ease-in-out infinite; }
        .country-float-delay { animation: countryFloat 7s ease-in-out infinite; animation-delay: -2.5s; }
        .country-route { stroke-dasharray: 10 14; animation: routeDash 12s linear infinite; }
        .guide-peek { animation: guidePeek 6.5s ease-in-out infinite; }
        .soft-pulse { animation: softPulse 3.4s ease-in-out infinite; }

        @media (prefers-reduced-motion: reduce) {
          .country-float,
          .country-float-delay,
          .country-route,
          .guide-peek,
          .soft-pulse {
            animation: none !important;
          }
        }
      `}</style>

      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(255,75,18,0.14),transparent_30%),radial-gradient(circle_at_88%_15%,rgba(255,190,92,0.16),transparent_28%),linear-gradient(180deg,rgba(255,255,255,0.52),rgba(255,245,233,0))]" />
      <div className="pointer-events-none absolute left-[-120px] top-12 h-96 w-96 rounded-full bg-orange-300/18 blur-3xl" />
      <div className="pointer-events-none absolute right-[-140px] bottom-16 h-96 w-96 rounded-full bg-[#ff4b12]/10 blur-3xl" />

      <svg
        className="pointer-events-none absolute left-0 top-10 h-[270px] w-full text-[#ff7a3b]/24"
        viewBox="0 0 1500 270"
        preserveAspectRatio="none"
      >
        <path
          d="M0 170 C170 20 340 120 520 56 S830 210 1060 84 S1340 5 1500 108"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="country-route"
        />
      </svg>

      <div className="pointer-events-none absolute left-10 top-24 text-5xl country-float-delay">
        ✈️
      </div>
      <div className="pointer-events-none absolute right-[11%] top-32 text-3xl text-[#ffb000] country-float">
        ✦
      </div>
      <div className="pointer-events-none absolute right-[7%] top-52 text-5xl opacity-70 country-float-delay">
        ☁️
      </div>

      <div className="relative mx-auto max-w-[1500px]">
        <div className="relative pb-8 pt-4 text-center">
          <motion.img
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7 }}
            viewport={{ once: true }}
            src={guideCharacter}
            alt="Zaifan guide pointing to Italy study destination"
            className="guide-peek pointer-events-none absolute left-[-12px] top-[-18px] z-0 hidden h-[430px] w-[310px] object-contain object-left-top drop-shadow-[0_28px_34px_rgba(9,31,80,0.16)] lg:block xl:left-[8px] xl:h-[460px] xl:w-[340px]"
          />

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55 }}
            viewport={{ once: true }}
            className="relative z-10 mx-auto mb-7 inline-flex items-center gap-2 rounded-full bg-white/85 px-5 py-3 text-xs font-black uppercase tracking-[0.22em] text-[#ff4b12] shadow-[0_14px_34px_rgba(9,31,80,0.08)] ring-1 ring-orange-100"
          >
            <Sparkles size={16} fill="currentColor" />
            Italy first. More countries coming soon.
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 25 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, delay: 0.05 }}
            viewport={{ once: true }}
            className="relative z-10 mx-auto max-w-5xl text-5xl font-black leading-[0.98] tracking-[-0.06em] text-[#071f50] md:text-7xl xl:text-[82px]"
          >
            We’re building the{" "}
            <span className="text-[#ff4b12]">Italy Study Hub</span> first.
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.12 }}
            viewport={{ once: true }}
            className="relative z-10 mx-auto mt-6 max-w-3xl text-lg font-semibold leading-8 text-[#526178]"
          >
            Zaifan is going deep before going wide. Italy is live now, while
            other destinations will open when we have enough real guidance,
            university knowledge and scholarship information to help students properly.
          </motion.p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.16 }}
          viewport={{ once: true }}
          className="relative z-20 mx-auto mt-8 flex max-w-5xl flex-wrap justify-center gap-2"
          aria-label="Country quick selector"
        >
          {destinations.map((country) => {
            const isActive = activeCountry === country.name;
            const isLive = country.status === "available";

            return (
              <button
                key={country.name}
                type="button"
                onClick={() => setActiveCountry(country.name)}
                className={`inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-xs font-black shadow-sm ring-1 transition duration-300 focus:outline-none focus:ring-4 focus:ring-[#ff4b12]/20 ${
                  isActive
                    ? isLive
                      ? "bg-[#ff4b12] text-white ring-[#ff4b12]"
                      : "bg-[#fff1ea] text-[#a1682d] ring-orange-200"
                    : "bg-white/90 text-[#071f50] ring-orange-100 hover:-translate-y-0.5 hover:bg-orange-50 hover:text-[#ff4b12]"
                }`}
              >
                <span>{country.flag}</span>
                {country.name}
                {!isLive && (
                  <span className="rounded-full bg-orange-100 px-2 py-0.5 text-[9px] uppercase tracking-[0.12em] text-[#a1682d]">
                    Soon
                  </span>
                )}
              </button>
            );
          })}
        </motion.div>

        <motion.div
          key={selectedCountry.name}
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="relative z-20 mx-auto mt-6 max-w-4xl rounded-[24px] bg-white/82 p-4 text-center shadow-[0_16px_38px_rgba(9,31,80,0.07)] ring-1 ring-orange-100 backdrop-blur md:p-5"
        >
          <p className="text-sm font-black text-[#071f50] md:text-base">
            Selected:{" "}
            <span className="text-[#ff4b12]">
              {selectedCountry.flag} {selectedCountry.name}
            </span>
            <span className="mx-2 text-orange-200">•</span>
            {selectedCountry.status === "available"
              ? "Available now"
              : "Coming soon after Italy"}
            <span className="mx-2 hidden text-orange-200 sm:inline">•</span>
            <span className="hidden sm:inline">{selectedCountry.scholarship}</span>
          </p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.12 }}
          className="relative z-20 mx-auto mt-12 grid max-w-[1350px] gap-8 lg:grid-cols-[0.92fr_1.08fr] lg:items-start"
        >
          <ItalyReasonPanel />

          <ItalySpotlightCard
            country={italy}
            isActive={activeCountry === italy.name}
            onActivate={() => setActiveCountry(italy.name)}
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 26 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.08 }}
          viewport={{ once: true }}
          className="relative z-20 mt-9 overflow-hidden rounded-[34px] bg-white/86 p-5 shadow-[0_24px_70px_rgba(9,31,80,0.08)] ring-1 ring-orange-100 backdrop-blur md:p-6"
        >
          <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-[#fff1ea] px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-[#ff4b12] ring-1 ring-orange-100">
                <Route size={15} strokeWidth={3} />
                Country expansion roadmap
              </div>
              <h3 className="mt-4 text-3xl font-black leading-tight tracking-[-0.045em] text-[#071f50] md:text-4xl">
                More countries are visible — but honestly marked coming soon.
              </h3>
              <p className="mt-3 max-w-3xl text-sm font-semibold leading-7 text-[#61708a]">
                Germany, UK, Canada, Australia and Turkey stay on the roadmap.
                They should not act like finished country guides until real Zaifan
                information is added.
              </p>
            </div>

            <a
              href="/countries/italy"
              className="inline-flex shrink-0 items-center justify-center gap-3 rounded-[20px] bg-[#ff4b12] px-7 py-4 text-sm font-black text-white shadow-[0_16px_34px_rgba(255,75,18,0.26)] transition-all duration-300 hover:-translate-y-1 hover:bg-[#ff642f] focus:outline-none focus:ring-4 focus:ring-[#ff4b12]/20"
            >
              Start With Italy
              <ArrowRight size={18} strokeWidth={3} />
            </a>
          </div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.12 }}
            className="grid items-stretch gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5"
          >
            {comingSoon.map((country) => (
              <ComingSoonCountryCard
                key={country.name}
                country={country}
                isActive={activeCountry === country.name}
                onActivate={() => setActiveCountry(country.name)}
              />
            ))}
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65 }}
          viewport={{ once: true }}
          className="mt-9 overflow-hidden rounded-[34px] bg-[#071f50] p-5 text-white shadow-[0_28px_80px_rgba(9,31,80,0.18)] ring-1 ring-white/10 md:p-7"
        >
          <div className="relative flex flex-col gap-6 overflow-hidden rounded-[28px] bg-[radial-gradient(circle_at_12%_20%,rgba(255,122,59,0.26),transparent_30%),linear-gradient(135deg,rgba(255,255,255,0.09),rgba(255,255,255,0.03))] p-6 lg:flex-row lg:items-center lg:justify-between lg:p-8">
            <div className="absolute right-8 top-6 text-6xl opacity-20 soft-pulse">
              🇮🇹
            </div>

            <div className="relative flex items-center gap-5">
              <div className="hidden h-24 w-24 shrink-0 items-center justify-center rounded-[28px] bg-white/10 text-5xl shadow-inner ring-1 ring-white/10 md:flex">
                <MapPin size={46} className="text-[#ffb36d]" strokeWidth={2.4} />
              </div>
              <div>
                <h3 className="text-2xl font-black tracking-[-0.035em] text-white md:text-3xl">
                  Want to study in Italy?
                </h3>
                <p className="mt-2 max-w-2xl text-[15px] font-semibold leading-7 text-white/76">
                  Start with the destination Zaifan is focusing on first. We’ll
                  help you understand Italy, shortlist universities and plan the
                  next step based on your profile.
                </p>
              </div>
            </div>

            <a
              href="/appointment?country=Italy"
              className="relative inline-flex min-w-[260px] items-center justify-center gap-3 rounded-[20px] bg-[#ff4b12] px-8 py-5 text-base font-black text-white shadow-[0_18px_38px_rgba(255,75,18,0.32)] transition-all duration-300 hover:-translate-y-1 hover:bg-[#ff642f] focus:outline-none focus:ring-4 focus:ring-white/20 md:min-w-[320px]"
            >
              Get Free Italy Consultation
              <ArrowRight size={22} strokeWidth={3} />
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

export default Countries;