import React from "react";
import {
  ArrowRight,
  CalendarDays,
  ChevronRight,
  CirclePlay,
  Globe2,
  GraduationCap,
  Search,
  Sparkles,
  University,
  WalletCards,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import heroStudent from "../assets/images/zaifan/hero-student-globe.png";
import walkingStudent from "../assets/images/zaifan/student-walking.png";
import guideStudent from "../assets/images/zaifan/student-guide.png";


const countries = [
  {
    flag: "🇬🇧",
    name: "UK",
    code: "GB",
    lines: ["🎓 Top Universities", "⚡ Fast Visa Process"],
    bg: "from-[#fff1dd] via-[#fff8ed] to-[#ffe1bd]",
    ink: "text-orange-500",
    accent: "#ff6b1a",
    glow: "rgba(255,107,26,0.22)",
    tuition: "£11k–£22k",
    work: "20 hrs/week",
    visa: "3–6 weeks",
    scholarships: "High",
    courses: ["Business", "CS", "Health"],
  },
  {
    flag: "🇦🇺",
    name: "Australia",
    code: "AU",
    lines: ["💼 Career Opportunities", "🧑‍🎓 Work While Study"],
    bg: "from-[#eafff4] via-[#f5fff8] to-[#d9ffe9]",
    ink: "text-emerald-500",
    accent: "#20c977",
    glow: "rgba(32,201,119,0.22)",
    tuition: "A$22k–A$38k",
    work: "48 hrs/fortnight",
    visa: "4–8 weeks",
    scholarships: "Medium",
    courses: ["IT", "Nursing", "MBA"],
  },
  {
    flag: "🇨🇦",
    name: "Canada",
    code: "CA",
    lines: ["🛡️ PR Pathways", "🤝 Safe & Friendly"],
    bg: "from-[#fff0f3] via-[#fff8f5] to-[#ffe2e7]",
    ink: "text-rose-500",
    accent: "#ff5475",
    glow: "rgba(255,84,117,0.2)",
    tuition: "C$16k–C$32k",
    work: "Part-time",
    visa: "6–10 weeks",
    scholarships: "Medium",
    courses: ["Data", "Business", "Eng"],
  },
  {
    flag: "🇪🇺",
    name: "Europe",
    code: "EU",
    lines: ["🐷 Affordable Education", "🌎 Multiple Destinations"],
    bg: "from-[#f3efff] via-[#fbf8ff] to-[#eadfff]",
    ink: "text-violet-500",
    accent: "#8b5cff",
    glow: "rgba(139,92,255,0.22)",
    tuition: "€4k–€15k",
    work: "Country based",
    visa: "3–8 weeks",
    scholarships: "Strong",
    courses: ["AI", "Design", "Finance"],
  },
];

const supportCards = [
  { icon: "🎓", title: "Find Your Perfect Course", text: "Discover courses that match your goals." },
  { icon: "🏆", title: "Unlock Scholarships", text: "Find and apply for the best scholarships." },
  { icon: "🌍", title: "Plan Your Move", text: "From visa to stay, we’ve got you covered." },
  { icon: "📄", title: "Get Accepted", text: "Expert guidance to secure your admission." },
];

const adventureSteps = [
  { icon: "💭", title: "Dream", text: "You dream it, we listen." },
  { icon: "🧭", title: "Choose", text: "Pick the right course and university." },
  { icon: "📝", title: "Apply", text: "We help you apply smartly." },
  { icon: "✈️", title: "Fly", text: "Get your visa and fly with confidence." },
  { icon: "🏆", title: "Graduate", text: "Achieve your goals and shine!" },
];

const explorers = [
  { icon: "🌎", title: "Country Explorer", section: "countries", text: "Discover top study destinations worldwide." },
  { icon: "🏛️", title: "University Explorer", section: "universities", text: "Find the best universities that shape your future." },
  { icon: "🏆", title: "Scholarship Explorer", section: "more-help", text: "Explore scholarships that make your dreams possible." },
  { icon: "🚀", title: "Success Stories", section: "contact", text: "Real stories. Real students. Real achievements." },
];

const trustStats = [
  { icon: GraduationCap, value: "18k+", label: "Courses" },
  { icon: University, value: "1k+", label: "Universities" },
  { icon: WalletCards, value: "Scholarships", label: "Available" },
  { icon: Globe2, value: "6+", label: "Destinations" },
];

function Landmark({ label, className = "" }) {
  return (
    <div className={`pointer-events-none absolute bottom-3 right-5 opacity-60 ${className}`}>
      <div className="relative h-24 w-24">
        <div className="absolute bottom-0 right-10 h-20 w-8 rounded-t-full border-2 border-current" />
        <div className="absolute bottom-0 right-2 h-12 w-20 rounded-t-[48px] border-2 border-current" />
        <div className="absolute bottom-0 right-0 h-1 w-24 rounded-full bg-current" />
        <div className="absolute bottom-8 right-14 h-14 w-px bg-current" />
        <div className="absolute bottom-[84px] right-12 h-5 w-5 rotate-45 border-l-2 border-t-2 border-current" />
        <span className="sr-only">{label}</span>
      </div>
    </div>
  );
}

function CountryCard({ country, onExplore }) {
  return (
    <article
      className={`group relative min-h-[148px] overflow-hidden rounded-[24px] bg-gradient-to-br ${country.bg} p-5 shadow-[0_20px_50px_rgba(255,91,24,0.11)] ring-1 ring-white/85 transition duration-300 hover:-translate-y-1.5 hover:shadow-[0_30px_70px_rgba(255,91,24,0.18)]`}
      style={{ "--country-accent": country.accent, "--country-glow": country.glow }}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(255,255,255,0.95),transparent_34%),radial-gradient(circle_at_82%_12%,var(--country-glow),transparent_24%),linear-gradient(135deg,rgba(255,255,255,0.55),rgba(255,255,255,0.12))]" />
      <div className="absolute -right-10 -top-12 h-28 w-28 rounded-full bg-white/55 blur-xl transition duration-500 group-hover:scale-125" />
      <div className="absolute bottom-0 left-0 h-1 w-full bg-[linear-gradient(90deg,transparent,var(--country-accent),transparent)] opacity-45" />

      <div className="relative z-10 flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-4">
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-white/70 text-xl font-black text-[#071f50] shadow-inner ring-1 ring-white/80">
            {country.code}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-2xl drop-shadow-sm">{country.flag}</span>
              <h3 className="text-base font-black leading-tight text-[#071f50]">{country.name}</h3>
            </div>
            <div className="mt-2 space-y-1">
              {country.lines.map((line) => (
                <p key={line} className="text-xs font-extrabold leading-tight text-[#0a2556]">{line}</p>
              ))}
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => onExplore?.()}
          className="relative z-20 grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white text-[var(--country-accent)] shadow-[0_12px_26px_var(--country-glow)] ring-1 ring-white/80 transition duration-300 group-hover:translate-x-1 group-hover:scale-110"
          aria-label={`Explore ${country.name}`}
        >
          <ArrowRight size={20} strokeWidth={3} />
        </button>
      </div>

      <div className="relative z-10 mt-4 grid grid-cols-2 gap-2">
        <div className="rounded-2xl bg-white/62 px-3 py-2 shadow-sm ring-1 ring-white/70">
          <p className="text-[9px] font-black uppercase tracking-[0.16em] text-[var(--country-accent)]">Tuition</p>
          <p className="mt-0.5 text-[11px] font-black text-[#071f50]">{country.tuition}</p>
        </div>
        <div className="rounded-2xl bg-white/62 px-3 py-2 shadow-sm ring-1 ring-white/70">
          <p className="text-[9px] font-black uppercase tracking-[0.16em] text-[var(--country-accent)]">Work</p>
          <p className="mt-0.5 text-[11px] font-black text-[#071f50]">{country.work}</p>
        </div>
        <div className="rounded-2xl bg-white/62 px-3 py-2 shadow-sm ring-1 ring-white/70">
          <p className="text-[9px] font-black uppercase tracking-[0.16em] text-[var(--country-accent)]">Visa</p>
          <p className="mt-0.5 text-[11px] font-black text-[#071f50]">{country.visa}</p>
        </div>
        <div className="rounded-2xl bg-white/62 px-3 py-2 shadow-sm ring-1 ring-white/70">
          <p className="text-[9px] font-black uppercase tracking-[0.16em] text-[var(--country-accent)]">Funding</p>
          <p className="mt-0.5 text-[11px] font-black text-[#071f50]">{country.scholarships}</p>
        </div>
      </div>

      <div className="relative z-10 mt-3 flex flex-wrap gap-1.5">
        {country.courses.map((course) => (
          <span key={course} className="rounded-full bg-white/72 px-2.5 py-1 text-[10px] font-black text-[#071f50] shadow-sm ring-1 ring-white/75">
            {course}
          </span>
        ))}
      </div>

      <Landmark label={country.name} className={country.ink} />
    </article>
  );
}

function SoftCard({ children, className = "" }) {
  return (
    <div className={`rounded-[22px] bg-white/72 shadow-[0_16px_42px_rgba(9,31,80,0.08)] ring-1 ring-orange-100/80 backdrop-blur ${className}`}>
      {children}
    </div>
  );
}

export default function Hero() {
  const navigate = useNavigate();

  const goToAppointment = () => {
    navigate("/appointment");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const scrollToSection = (sectionId) => {
    const target = document.getElementById(sectionId);
    if (!target) return;

    const navbarOffset = 92;
    const targetTop = target.getBoundingClientRect().top + window.scrollY - navbarOffset;

    window.scrollTo({
      top: targetTop,
      behavior: "smooth",
    });
  };

  return (
    <section className="relative min-h-screen overflow-hidden bg-[#fff5e9] text-[#071f50]">
      <style>{`
        @keyframes floatSoft { 0%,100% { transform: translateY(0px); } 50% { transform: translateY(-10px); } }
        @keyframes orbitDash { 0% { stroke-dashoffset: 0; } 100% { stroke-dashoffset: -260; } }
        @keyframes mapDash { 0% { stroke-dashoffset: 0; } 100% { stroke-dashoffset: -180; } }
        @keyframes pulseDot { 0%,100% { transform: scale(1); opacity: .95; } 50% { transform: scale(1.12); opacity: .72; } }
        @keyframes softGlow { 0%,100% { opacity: .52; transform: scale(1); } 50% { opacity: .78; transform: scale(1.05); } }
        @keyframes ctaPlane { 0%,100% { transform: translateX(0) rotate(-6deg); } 50% { transform: translateX(8px) rotate(2deg); } }
        @keyframes sparkleBlink { 0%,100% { opacity: .3; transform: scale(.92); } 45% { opacity: 1; transform: scale(1.15); } }
        .float-soft { animation: floatSoft 5s ease-in-out infinite; }
        .float-soft-delay { animation: floatSoft 6s ease-in-out infinite; animation-delay: -2s; }
        .orbit-line { stroke-dasharray: 9 10; animation: orbitDash 9s linear infinite; }
        .map-line { stroke-dasharray: 8 12; animation: mapDash 10s linear infinite; }
        .soft-glow { animation: softGlow 6s ease-in-out infinite; }
        .cta-plane { animation: ctaPlane 4.5s ease-in-out infinite; }
        .sparkle-blink { animation: sparkleBlink 3.2s ease-in-out infinite; }
      `}</style>

      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_38%_20%,rgba(255,118,42,0.18),transparent_28%),radial-gradient(circle_at_84%_72%,rgba(255,177,86,0.16),transparent_30%),linear-gradient(180deg,rgba(255,255,255,0.35),rgba(255,244,229,0))]" />
      <div className="pointer-events-none absolute inset-0 opacity-[0.30] [background-image:radial-gradient(#ffb27a_1px,transparent_1px)] [background-size:32px_32px]" />
      <div className="pointer-events-none absolute left-[19%] top-[11%] text-2xl text-[#ffb000] sparkle-blink">✦</div>
      <div className="pointer-events-none absolute right-[19%] bottom-[22%] text-2xl text-[#ffb000] sparkle-blink">✦</div>

      <div className="relative mx-auto max-w-[1840px] px-5 pb-5 pt-28 sm:px-7 lg:pb-2 lg:pt-28 xl:px-14">
        <main className="mt-8 grid items-center gap-7 lg:mt-4 lg:grid-cols-[30%_32%_38%] lg:gap-5 xl:gap-7">
          <div className="order-1 lg:col-auto">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-orange-100/70 px-4 py-2.5 text-xs font-black text-[#ff4b12] shadow-sm">
              <Sparkles size={17} fill="currentColor" /> Your future, our guidance
            </div>
            <h1 className="max-w-[440px] text-[42px] font-black leading-[0.94] tracking-[-0.045em] text-[#071f50] sm:text-[48px] lg:text-[46px] xl:text-[52px]">
              Explore your <br /> study abroad <br />
              <span className="relative inline-block text-[#ff4b12]">
                future
                <span className="absolute -bottom-2 left-0 h-1.5 w-[102%] rounded-full bg-[#ff4b12]" />
              </span>
              <span className="ml-5 inline-block rotate-[-10deg] text-[34px] font-normal text-[#ff4b12]">♡</span>
            </h1>
            <p className="mt-5 max-w-[395px] text-[14px] font-semibold leading-6 text-[#14305f]">
              Dream big, we&apos;ll help you get there. Find the right course, win scholarships and start your journey with confidence.
            </p>
            <div className="mt-5 flex flex-wrap items-center gap-4 xl:flex-nowrap">
              <button
                type="button"
                onClick={() => scrollToSection("universities")}
                className="flex items-center gap-3 rounded-full bg-[#ff4b12] px-5 py-3.5 text-xs font-black text-white shadow-[0_18px_38px_rgba(255,75,18,0.32)] transition hover:-translate-y-1 hover:bg-[#ff642f]"
              >
                Find My Course <Search size={18} />
              </button>
              <button
                type="button"
                onClick={() => scrollToSection("countries")}
                className="flex items-center gap-3 rounded-full bg-white px-5 py-3.5 text-xs font-black text-[#071f50] shadow-[0_16px_36px_rgba(9,31,80,0.10)] transition hover:-translate-y-1 hover:text-[#ff4b12]"
              >
                Explore Countries <Globe2 size={18} />
              </button>
              <button
                type="button"
                onClick={() => scrollToSection("more-help")}
                className="flex items-center gap-3 rounded-full bg-white px-5 py-3.5 text-xs font-black text-[#071f50] shadow-[0_16px_36px_rgba(9,31,80,0.10)] transition hover:-translate-y-1 hover:text-[#ff4b12]"
              >
                <CirclePlay size={18} /> How It Works
              </button>
            </div>

            <div className="mt-5 grid max-w-[430px] grid-cols-2 gap-2 sm:grid-cols-4">
              {trustStats.map((stat) => {
                const Icon = stat.icon;
                return (
                  <div key={stat.label} className="group rounded-[18px] bg-white/72 px-3 py-3 shadow-[0_13px_28px_rgba(9,31,80,0.07)] ring-1 ring-orange-100/70 backdrop-blur transition hover:-translate-y-1 hover:bg-white">
                    <Icon size={17} className="text-[#ff4b12]" strokeWidth={3} />
                    <p className="mt-2 text-[12px] font-black leading-tight text-[#071f50]">{stat.value}</p>
                    <p className="mt-0.5 text-[9px] font-black uppercase tracking-[0.16em] text-[#61708a]">{stat.label}</p>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="relative order-2 min-h-[330px] sm:min-h-[410px] lg:col-auto lg:min-h-[455px]">
            <div className="absolute left-1/2 top-1/2 h-[330px] w-[330px] soft-glow -translate-x-1/2 -translate-y-1/2 rounded-full bg-orange-300/25 blur-3xl sm:h-[440px] sm:w-[440px] lg:h-[560px] lg:w-[560px]" />
            <svg className="pointer-events-none absolute left-1/2 top-2 h-[250px] w-[92%] -translate-x-1/2 overflow-visible sm:h-[320px] lg:left-[-8%] lg:top-[-2%] lg:h-[360px] lg:w-[116%] lg:translate-x-0" viewBox="0 0 500 430">
              <path d="M40 245 C90 55, 358 10, 432 122 C510 240, 310 368, 116 324" fill="none" stroke="#ff6b2b" strokeWidth="2" className="orbit-line" />
            </svg>

            <img
              src={heroStudent}
              alt="Zaifan student with globe"
              className="relative z-10 mx-auto h-[365px] w-full max-w-none object-contain drop-shadow-[0_28px_32px_rgba(9,31,80,0.18)] transition duration-700 hover:scale-[1.012] sm:h-[450px] lg:h-[610px] lg:w-[128%] lg:-translate-x-[8%] lg:drop-shadow-[0_34px_38px_rgba(9,31,80,0.20)]"
            />
          </div>

          <div className="order-3 hidden lg:col-auto lg:block">
            <div className="mb-4 flex items-center gap-3 text-[20px] font-black tracking-[-0.02em] text-[#071f50]">
              <span className="text-[#ffb000]">✦</span> Where will your story begin? <span>🌎</span>
            </div>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              {countries.map((country) => <CountryCard key={country.name} country={country} onExplore={goToAppointment} />)}
            </div>
          </div>
        </main>

        <section className="mt-6 grid grid-cols-12 gap-3 lg:mt-2">
          <SoftCard className="col-span-12 p-5 lg:col-span-5">
            <h2 className="mb-3 text-lg font-black tracking-[-0.02em]">Your dream, our support <span className="text-[#ffb000]">✦</span></h2>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-0">
              {supportCards.map((card, index) => (
                <div key={card.title} className={`px-4 ${index !== supportCards.length - 1 ? "md:border-r md:border-orange-100" : ""}`}>
                  <div className="mb-2 grid h-16 w-16 place-items-center rounded-full bg-gradient-to-br from-orange-50 to-blue-50 text-4xl shadow-inner transition duration-300 hover:scale-105">
                    {card.icon}
                  </div>
                  <h3 className="text-sm font-black leading-tight">{card.title}</h3>
                  <p className="mt-1.5 text-[11px] font-semibold leading-4 text-[#17335f]">{card.text}</p>
                </div>
              ))}
            </div>
          </SoftCard>

          <SoftCard className="col-span-12 p-5 lg:col-span-7">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-black tracking-[-0.02em]">Choose your adventure 🗺️</h2>
              <button
                type="button"
                onClick={() => scrollToSection("more-help")}
                className="rounded-full bg-orange-50 px-5 py-2 text-xs font-black text-[#ff4b12] transition hover:bg-orange-100"
              >
                See Full Process
              </button>
            </div>
            <div className="relative grid grid-cols-5 items-start gap-4">
              <svg className="pointer-events-none absolute left-[12%] top-[45px] h-7 w-[76%]" viewBox="0 0 760 40" preserveAspectRatio="none">
                <path d="M0 20 C45 0, 75 40, 120 20 S195 0, 240 20 S315 40, 360 20 S435 0, 480 20 S555 40, 600 20 S675 0, 760 20" fill="none" stroke="#ff6b2b" strokeWidth="2" className="map-line" />
              </svg>
              {adventureSteps.map((step, index) => (
                <div key={step.title} className="relative z-10 text-center">
                  <div className="relative mx-auto h-[104px] w-[104px]">
                    <div className="grid h-full w-full place-items-center rounded-full bg-orange-50 text-4xl shadow-inner transition duration-300 hover:scale-105">
                      {index === 0 ? (
                        <img
                          src={walkingStudent}
                          alt="Student walking"
                          className="h-[108px] w-[108px] object-contain drop-shadow-xl"
                        />
                      ) : (
                        <span>{step.icon}</span>
                      )}
                    </div>
                    <div className="absolute -bottom-1 left-1/2 z-30 grid h-6 w-6 -translate-x-1/2 place-items-center rounded-full bg-[#ff4b12] text-[11px] font-black text-white shadow-[0_7px_16px_rgba(255,75,18,0.35)] ring-2 ring-white">
                      {index + 1}
                    </div>
                  </div>
                  <h3 className="mt-3 text-xs font-black">{step.title}</h3>
                  <p className="mx-auto mt-1 max-w-[120px] text-[10px] font-semibold leading-4 text-[#17335f]">{step.text}</p>
                </div>
              ))}
            </div>
          </SoftCard>
        </section>

        <section className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
          {explorers.map((card) => (
            <article key={card.title} className="group relative min-h-[94px] overflow-hidden rounded-[20px] bg-white/72 p-4 pl-28 shadow-[0_18px_45px_rgba(9,31,80,0.07)] ring-1 ring-orange-100/80 transition duration-300 hover:-translate-y-1 hover:shadow-[0_24px_55px_rgba(255,91,24,0.14)]">
              <div className="absolute left-4 top-1/2 grid h-16 w-16 -translate-y-1/2 place-items-center rounded-full bg-gradient-to-br from-orange-50 to-blue-50 text-4xl shadow-inner transition duration-300 group-hover:scale-105">
                {card.icon}
              </div>
              <h3 className="text-sm font-black">{card.title}</h3>
              <p className="mt-1 text-[11px] font-semibold leading-4 text-[#17335f]">{card.text}</p>
              <button
                type="button"
                onClick={() => scrollToSection(card.section)}
                className="mt-1.5 grid h-6 w-6 place-items-center rounded-full bg-[#ff4b12] text-white transition group-hover:translate-x-1"
                aria-label={`Open ${card.title}`}
              >
                <ChevronRight size={17} strokeWidth={4} />
              </button>
            </article>
          ))}
        </section>

        <section className="relative mt-8 h-[112px] overflow-visible rounded-[22px] bg-gradient-to-r from-[#ff7b1c] via-[#ff4b12] to-[#ff7b1c] px-8 shadow-[0_22px_48px_rgba(255,75,18,0.24)]">
          <div className="absolute inset-0 overflow-hidden rounded-[22px] bg-[radial-gradient(circle_at_20%_50%,rgba(255,255,255,0.22),transparent_22%),radial-gradient(circle_at_82%_40%,rgba(255,255,255,0.20),transparent_20%)]" />

          <div className="relative z-10 flex h-[112px] flex-col items-start justify-center gap-3 py-4 md:flex-row md:items-center md:justify-between md:gap-6 md:py-0">
            <div className="relative hidden h-[112px] w-[420px] shrink-0 overflow-visible lg:block">
              <div className="absolute bottom-0 left-[78px] z-20 h-[176px] w-[178px] overflow-hidden">
                <img
                  src={guideStudent}
                  alt="Zaifan guide"
                  className="h-[238px] w-full translate-y-[2px] object-contain object-top drop-shadow-[0_18px_18px_rgba(9,31,80,0.24)]"
                />
              </div>

              <div className="absolute left-[230px] top-[34px] z-30 min-w-[168px] rounded-[22px] bg-orange-100 px-5 py-3 text-center text-[10px] font-black leading-4 text-[#071f50] shadow-xl ring-1 ring-white/60 before:absolute before:left-[-9px] before:top-1/2 before:h-5 before:w-5 before:-translate-y-1/2 before:rotate-45 before:bg-orange-100">
                Not sure where <br /> to start?
              </div>
            </div>

            <div className="min-w-0 flex-1 pl-0 lg:-ml-8">
              <h2 className="text-[22px] font-black leading-tight tracking-[-0.03em] text-white xl:text-[27px]">Let’s turn your dreams into reality!</h2>
              <p className="mt-1 text-xs font-semibold text-white/95">Book a free 1-on-1 consultation with our study abroad experts.</p>
            </div>

            <button
              type="button"
              onClick={goToAppointment}
              className="hidden shrink-0 items-center gap-3 rounded-full bg-[#071f50] px-7 py-3.5 text-xs font-black text-white shadow-[0_18px_35px_rgba(7,31,80,0.28)] transition hover:-translate-y-1 hover:bg-[#092b72] md:flex"
            >
              <CalendarDays size={20} /> Book Free Consultation
            </button>
            <div className="cta-plane hidden text-4xl text-white lg:block">✈︎</div>
          </div>
        </section>
      </div>
    </section>
  );
}
