import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowRight,
  BadgeDollarSign,
  BookOpenCheck,
  CheckCircle2,
  GraduationCap,
  Globe2,
  Plane,
  Sparkles,
  UsersRound,
} from "lucide-react";

import australiaImage from "../assets/images/country-explorer/australia.png";
import canadaImage from "../assets/images/country-explorer/canada.png";
import guideCharacter from "../assets/images/country-explorer/country-guide-character.png";
import germanyImage from "../assets/images/country-explorer/germany.png";
import italyImage from "../assets/images/country-explorer/italy.png";
import turkeyImage from "../assets/images/country-explorer/turkey.png";
import ukImage from "../assets/images/country-explorer/united-kingdom.png";

const countries = [
  {
    flag: "🇮🇹",
    code: "IT",
    name: "Italy",
    image: italyImage,
    description: "Experience timeless culture and world-class education.",
    universities: "60+",
    tuition: "€6K – €15K",
    visa: "4 – 8 Weeks",
    fit: "Creative + culture lovers",
    scholarship: "Merit options available",
    courses: ["Arts", "Design", "Business"],
  },
  {
    flag: "🇩🇪",
    code: "DE",
    name: "Germany",
    image: germanyImage,
    description: "Affordable education with strong career paths.",
    universities: "60+",
    tuition: "€0 – €3K",
    visa: "6 – 10 Weeks",
    fit: "Engineering + career focused",
    scholarship: "Low tuition advantage",
    courses: ["Engineering", "IT", "Management"],
  },
  {
    flag: "🇬🇧",
    code: "GB",
    name: "United Kingdom",
    image: ukImage,
    description: "World-class education with global recognition.",
    universities: "90+",
    tuition: "£10K – £24K",
    visa: "3 – 6 Weeks",
    fit: "Fast-track global degrees",
    scholarship: "University awards available",
    courses: ["Business", "Law", "Health"],
  },
  {
    flag: "🇨🇦",
    code: "CA",
    name: "Canada",
    image: canadaImage,
    description: "Safe, diverse and immigration-friendly.",
    universities: "80+",
    tuition: "CAD 13K – 20K",
    visa: "4 – 8 Weeks",
    fit: "Long-term settlement plans",
    scholarship: "Entrance awards available",
    courses: ["CS", "Business", "Health"],
  },
  {
    flag: "🇦🇺",
    code: "AU",
    name: "Australia",
    image: australiaImage,
    description: "Quality education in a vibrant environment.",
    universities: "70+",
    tuition: "AUD 14K – 28K",
    visa: "4 – 8 Weeks",
    fit: "Lifestyle + career balance",
    scholarship: "Regional options available",
    courses: ["Nursing", "IT", "Business"],
  },
  {
    flag: "🇹🇷",
    code: "TR",
    name: "Turkey",
    image: turkeyImage,
    description: "Quality education at an affordable cost.",
    universities: "50+",
    tuition: "$3K – $8K",
    visa: "4 – 6 Weeks",
    fit: "Budget-friendly education",
    scholarship: "Affordable pathway",
    courses: ["Medicine", "Business", "Tourism"],
  },
];

const stats = [
  { icon: GraduationCap, value: "1000+", label: "Universities" },
  { icon: BadgeDollarSign, value: "500+", label: "Scholarships" },
  { icon: Globe2, value: "60+", label: "Countries" },
  { icon: UsersRound, value: "25K+", label: "Students Guided" },
];

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
    },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 36, scale: 0.98 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.55, ease: "easeOut" },
  },
};

function StatItem({ item }) {
  const Icon = item.icon;

  return (
    <div className="group/stat flex items-center justify-center gap-4 px-5 py-5 text-left transition duration-300 hover:bg-[#fff8f1]">
      <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-[#fff1ea] text-[#ff4b12] shadow-inner ring-1 ring-orange-100 transition duration-300 group-hover/stat:-translate-y-1 group-hover/stat:scale-105">
        <Icon size={28} strokeWidth={2.5} />
      </div>
      <div>
        <p className="text-2xl font-black leading-none tracking-[-0.04em] text-[#071f50] md:text-3xl">
          {item.value}
        </p>
        <p className="mt-1 text-sm font-black text-[#334968]">{item.label}</p>
      </div>
    </div>
  );
}

function InfoRow({ icon, label, value }) {
  return (
    <div className="grid grid-cols-[1fr_auto] items-center gap-3 border-t border-orange-100/80 py-3 first:border-t-0 first:pt-0 last:pb-0">
      <div className="flex min-w-0 items-center gap-2">
        <span className="shrink-0 text-[13px] text-[#ff4b12]">{icon}</span>
        <span className="whitespace-nowrap text-[11px] font-extrabold text-[#526178]">
          {label}
        </span>
      </div>
      <span className="whitespace-nowrap text-right text-[12px] font-black text-[#071f50]">
        {value}
      </span>
    </div>
  );
}

function CountryCard({ country, isActive, onActivate }) {
  return (
    <motion.article
      variants={cardVariants}
      tabIndex={0}
      onMouseEnter={onActivate}
      onFocus={onActivate}
      aria-label={`Explore study options in ${country.name}`}
      className={`group flex h-full min-h-[520px] flex-col overflow-hidden rounded-[30px] bg-white shadow-[0_22px_55px_rgba(9,31,80,0.08)] ring-1 transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_32px_80px_rgba(255,75,18,0.14)] focus:outline-none focus:ring-4 focus:ring-[#ff4b12]/20 ${
        isActive ? "ring-[#ff4b12]/45 shadow-[0_32px_80px_rgba(255,75,18,0.14)]" : "ring-orange-100/80"
      }`}
    >
      <div className="relative h-[245px] overflow-hidden rounded-t-[30px] bg-orange-50">
        <img
          src={country.image}
          alt={`${country.name} study destination`}
          className="h-full w-full object-cover transition duration-700 group-hover:scale-110 group-focus:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#071f50]/22 via-transparent to-white/5" />
        <div className="absolute left-5 top-5 rounded-full bg-white/95 px-4 py-2 text-xs font-black text-[#071f50] shadow-[0_12px_28px_rgba(9,31,80,0.12)] ring-1 ring-white/70 backdrop-blur transition duration-300 group-hover:scale-105 group-focus:scale-105">
          {country.code}
        </div>
        <div className="absolute bottom-5 left-5 right-5 translate-y-4 rounded-2xl bg-white/92 px-4 py-3 opacity-0 shadow-[0_16px_36px_rgba(9,31,80,0.16)] ring-1 ring-white/80 backdrop-blur transition-all duration-500 group-hover:translate-y-0 group-hover:opacity-100 group-focus:translate-y-0 group-focus:opacity-100">
          <div className="flex items-center gap-2 text-xs font-black text-[#071f50]">
            <CheckCircle2 size={16} className="text-[#ff4b12]" strokeWidth={3} />
            Best for {country.fit}
          </div>
        </div>
      </div>

      <div className="flex flex-1 flex-col p-6">
        <div className="flex items-center gap-3">
          <span className="text-3xl drop-shadow-sm transition duration-300 group-hover:scale-110 group-focus:scale-110">
            {country.flag}
          </span>
          <h3 className="text-[27px] font-black leading-tight tracking-[-0.035em] text-[#071f50]">
            {country.name}
          </h3>
        </div>

        <p className="mt-4 min-h-[48px] text-[15px] font-semibold leading-7 text-[#334968]">
          {country.description}
        </p>

        <div className="mt-5 rounded-[22px] bg-[#fffaf5] px-3.5 py-4 ring-1 ring-orange-100/80 transition duration-300 group-hover:bg-[#fff6ee] group-focus:bg-[#fff6ee]">
          <InfoRow icon="🎓" label="Universities" value={country.universities} />
          <InfoRow icon="💰" label="Tuition / Year" value={country.tuition} />
          <InfoRow icon="🛂" label="Visa Time" value={country.visa} />
        </div>

        <div className="mt-4 flex items-center gap-2 rounded-2xl bg-white px-3.5 py-3 text-xs font-black text-[#071f50] shadow-sm ring-1 ring-orange-100 transition duration-300 group-hover:text-[#ff4b12] group-focus:text-[#ff4b12]">
          <BookOpenCheck size={16} strokeWidth={3} />
          {country.scholarship}
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          {country.courses.map((course) => (
            <span
              key={course}
              className="rounded-full bg-white px-3.5 py-2 text-xs font-black text-[#071f50] shadow-sm ring-1 ring-orange-100 transition duration-300 group-hover:bg-orange-50 group-hover:text-[#ff4b12] group-focus:bg-orange-50 group-focus:text-[#ff4b12]"
            >
              {course}
            </span>
          ))}
        </div>

        <a
          href={`/appointment?country=${encodeURIComponent(country.name)}`}
          className="mt-auto inline-flex w-full items-center justify-center gap-3 rounded-full border border-[#ff4b12]/30 bg-white px-6 py-4 text-sm font-black text-[#ff4b12] shadow-[0_14px_28px_rgba(255,75,18,0.08)] transition-all duration-300 hover:-translate-y-1 hover:bg-[#ff4b12] hover:text-white hover:shadow-[0_18px_38px_rgba(255,75,18,0.24)] focus:outline-none focus:ring-4 focus:ring-[#ff4b12]/20"
        >
          Explore {country.name}
          <ArrowRight size={19} strokeWidth={3} className="transition duration-300 group-hover:translate-x-1" />
        </a>
      </div>
    </motion.article>
  );
}

function Countries() {
  const [activeCountry, setActiveCountry] = useState(countries[0].name);

  const selectedCountry = useMemo(
    () => countries.find((country) => country.name === activeCountry) || countries[0],
    [activeCountry]
  );

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

        .country-float { animation: countryFloat 6s ease-in-out infinite; }
        .country-float-delay { animation: countryFloat 7s ease-in-out infinite; animation-delay: -2.5s; }
        .country-route { stroke-dasharray: 10 14; animation: routeDash 12s linear infinite; }
        .guide-peek { animation: guidePeek 6.5s ease-in-out infinite; }

        @media (prefers-reduced-motion: reduce) {
          .country-float,
          .country-float-delay,
          .country-route,
          .guide-peek {
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
            alt="Zaifan guide pointing to study destinations"
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
            Explore. Compare. Choose your future.
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 25 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, delay: 0.05 }}
            viewport={{ once: true }}
            className="relative z-10 mx-auto max-w-5xl text-5xl font-black leading-[0.98] tracking-[-0.06em] text-[#071f50] md:text-7xl xl:text-[82px]"
          >
            Explore Top <span className="text-[#ff4b12]">Study Destinations</span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.12 }}
            viewport={{ once: true }}
            className="relative z-10 mx-auto mt-6 max-w-3xl text-lg font-semibold leading-8 text-[#526178]"
          >
            Compare countries, costs, scholarships, visa process and more. Find
            the perfect place for your <span className="font-black text-[#ff4b12]">dream education.</span>
          </motion.p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, delay: 0.12 }}
          viewport={{ once: true }}
          className="relative z-30 mx-auto mt-2 grid max-w-6xl divide-y divide-orange-100 overflow-hidden rounded-[30px] bg-white/90 shadow-[0_22px_55px_rgba(9,31,80,0.08)] ring-1 ring-orange-100 backdrop-blur md:grid-cols-4 md:divide-x md:divide-y-0"
        >
          {stats.map((item) => (
            <StatItem key={item.label} item={item} />
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.16 }}
          viewport={{ once: true }}
          className="relative z-20 mx-auto mt-8 flex max-w-5xl flex-wrap justify-center gap-2"
          aria-label="Country quick selector"
        >
          {countries.map((country) => (
            <button
              key={country.name}
              type="button"
              onClick={() => setActiveCountry(country.name)}
              className={`inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-xs font-black shadow-sm ring-1 transition duration-300 focus:outline-none focus:ring-4 focus:ring-[#ff4b12]/20 ${
                activeCountry === country.name
                  ? "bg-[#ff4b12] text-white ring-[#ff4b12]"
                  : "bg-white/90 text-[#071f50] ring-orange-100 hover:-translate-y-0.5 hover:bg-orange-50 hover:text-[#ff4b12]"
              }`}
            >
              <span>{country.flag}</span>
              {country.name}
            </button>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="relative z-20 mx-auto mt-6 max-w-4xl rounded-[24px] bg-white/82 p-4 text-center shadow-[0_16px_38px_rgba(9,31,80,0.07)] ring-1 ring-orange-100 backdrop-blur md:p-5"
        >
          <p className="text-sm font-black text-[#071f50] md:text-base">
            Selected: <span className="text-[#ff4b12]">{selectedCountry.flag} {selectedCountry.name}</span>
            <span className="mx-2 text-orange-200">•</span>
            {selectedCountry.fit}
            <span className="mx-2 hidden text-orange-200 sm:inline">•</span>
            <span className="hidden sm:inline">{selectedCountry.scholarship}</span>
          </p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.12 }}
          className="relative z-20 mt-12 grid items-stretch gap-7 md:grid-cols-2 xl:grid-cols-3"
        >
          {countries.map((country) => (
            <CountryCard
              key={country.name}
              country={country}
              isActive={activeCountry === country.name}
              onActivate={() => setActiveCountry(country.name)}
            />
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65 }}
          viewport={{ once: true }}
          className="mt-9 overflow-hidden rounded-[30px] bg-white/86 p-5 shadow-[0_22px_55px_rgba(9,31,80,0.08)] ring-1 ring-orange-100 backdrop-blur md:p-6"
        >
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-5">
              <div className="hidden h-24 w-24 shrink-0 items-center justify-center rounded-[24px] bg-[#fff1ea] text-5xl shadow-inner ring-1 ring-orange-100 md:flex">
                🌍
              </div>
              <div>
                <h3 className="text-2xl font-black tracking-[-0.035em] text-[#071f50] md:text-3xl">
                  Not sure which country is right for you?
                </h3>
                <p className="mt-2 max-w-xl text-[15px] font-semibold leading-7 text-[#526178]">
                  Our experts will help you choose the best destination based on
                  your goals, budget and profile.
                </p>
              </div>
            </div>

            <a
              href={`/appointment?country=${encodeURIComponent(selectedCountry.name)}`}
              className="inline-flex min-w-[260px] items-center justify-center gap-3 rounded-[18px] bg-[#ff4b12] px-8 py-5 text-base font-black text-white shadow-[0_18px_38px_rgba(255,75,18,0.28)] transition-all duration-300 hover:-translate-y-1 hover:bg-[#ff642f] focus:outline-none focus:ring-4 focus:ring-[#ff4b12]/20 md:min-w-[320px]"
            >
              Get Free {selectedCountry.name} Consultation
              <ArrowRight size={22} strokeWidth={3} />
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

export default Countries;
