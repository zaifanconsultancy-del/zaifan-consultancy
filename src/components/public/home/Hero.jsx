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

import heroStudent from "../../../assets/images/zaifan/hero-student-globe.webp";
import walkingStudent from "../../../assets/images/zaifan/student-walking.webp";
import guideStudent from "../../../assets/images/zaifan/student-guide.webp";
import italyImage from "../../../assets/images/country-explorer/italy.webp";

const supportCards = [
  {
    icon: "🎓",
    title: "Find Your Perfect Course",
    text: "Discover courses that match your goals.",
  },
  {
    icon: "🏆",
    title: "Unlock Scholarships",
    text: "Find the best scholarships.",
  },
  {
    icon: "🌍",
    title: "Plan Your Move",
    text: "From visa to stay, we’ve got you covered.",
  },
  {
    icon: "📄",
    title: "Get Accepted",
    text: "Expert guidance to secure admission.",
  },
];

const adventureSteps = [
  { icon: "💭", title: "Dream", text: "You dream it, we listen." },
  { icon: "🧭", title: "Choose", text: "Pick the right course and university." },
  { icon: "📝", title: "Apply", text: "We help you apply smartly." },
  { icon: "✈️", title: "Fly", text: "Get your visa and fly with confidence." },
  { icon: "🏆", title: "Graduate", text: "Achieve your goals and shine!" },
];

const explorers = [
  {
    icon: "🌎",
    title: "Country Explorer",
    action: "scroll",
    target: "countries",
    text: "Explore Italy now and see which destinations are coming next.",
  },
  {
    icon: "🏛️",
    title: "University Explorer",
    action: "route",
    target: "/universities",
    text: "Compare 50+ Italian university profiles, cities and study routes.",
  },
  {
    icon: "🏆",
    title: "Scholarship Explorer",
    action: "route",
    target: "/scholarships",
    text: "Explore DSU, regional funding and university scholarship routes.",
  },
  {
    icon: "🇮🇹",
    title: "Italy Study Guide",
    action: "route",
    target: "/countries/italy",
    text: "Open the complete Italy guide for costs, cities, universities and planning.",
  },
];

const trustStats = [
  { icon: Globe2, value: "Italy", label: "Live Now" },
  { icon: University, value: "50+", label: "University Profiles" },
  { icon: WalletCards, value: "DSU", label: "Funding Hub" },
  { icon: GraduationCap, value: "Visa", label: "Planning Route" },
];

const ITALY_FEATURES = [
  ["🎓", "DSU Scholarships", "Regional need-based funding routes"],
  ["💶", "Low Tuition Universities", "From €500–€4,000/year"],
  ["🌍", "English-Taught Programs", "Bachelor & master options"],
  ["💼", "Student Planning", "Work rules + budget planning"],
  ["🏙️", "City Guides", "Compare lifestyle, costs and universities"],
  ["✈️", "Visa Planning", "Documents and preparation roadmap"],
];

const ITALY_STATS = [
  ["Universities", "50+ Profiles"],
  ["Scholarships", "DSU + Regional"],
  ["City Guides", "Live"],
  ["Planning", "Admission → Visa"],
];

const ITALY_CITIES = ["Milan", "Rome", "Bologna", "Padua", "Turin"];

const INTERACTIVE_TRANSITION =
  "transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]";

function SoftCard({ children, className = "" }) {
  return (
    <div
      className={`rounded-[22px] bg-white/72 shadow-[0_16px_42px_rgba(9,31,80,0.08)] ring-1 ring-orange-100/80 backdrop-blur ${className}`}
    >
      {children}
    </div>
  );
}

export default function Hero() {
  const navigate = useNavigate();

  const goToRoute = (path) => {
    navigate(path);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const goToAppointment = () => {
    goToRoute("/appointment");
  };

  const scrollToSection = (sectionId) => {
    const target = document.getElementById(sectionId);
    if (!target) return;

    const navbarOffset = 92;
    const targetTop =
      target.getBoundingClientRect().top + window.scrollY - navbarOffset;

    window.scrollTo({
      top: targetTop,
      behavior: "smooth",
    });
  };

  const handleExplorerAction = (card) => {
    if (card.action === "route") {
      goToRoute(card.target);
      return;
    }

    scrollToSection(card.target);
  };

  return (
    <section className="relative min-h-screen overflow-hidden bg-[#fff5e9] text-[#071f50] lg:min-h-[820px]">
      <style>{`
        @keyframes floatSoft {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }

        @keyframes orbitDash {
          0% { stroke-dashoffset: 0; }
          100% { stroke-dashoffset: -260; }
        }

        @keyframes mapDash {
          0% { stroke-dashoffset: 0; }
          100% { stroke-dashoffset: -180; }
        }

        @keyframes softGlow {
          0%, 100% { opacity: .52; transform: scale(1); }
          50% { opacity: .78; transform: scale(1.05); }
        }

        @keyframes ctaPlane {
          0%, 100% { transform: translateX(0) rotate(-6deg); }
          50% { transform: translateX(8px) rotate(2deg); }
        }

        @keyframes sparkleBlink {
          0%, 100% { opacity: .3; transform: scale(.92); }
          45% { opacity: 1; transform: scale(1.15); }
        }

        @keyframes cardShine {
          0% { transform: translateX(-130%) rotate(18deg); opacity: 0; }
          18% { opacity: .45; }
          48% { opacity: 0; }
          100% { transform: translateX(160%) rotate(18deg); opacity: 0; }
        }

        @keyframes arrowNudge {
          0%, 100% { transform: translateX(0); }
          50% { transform: translateX(5px); }
        }

        .float-soft {
          animation: floatSoft 5s ease-in-out infinite;
          will-change: transform;
        }

        .orbit-line {
          stroke-dasharray: 9 10;
          animation: orbitDash 9s linear infinite;
        }

        .map-line {
          stroke-dasharray: 8 12;
          animation: mapDash 10s linear infinite;
        }

        .soft-glow {
          animation: softGlow 6s ease-in-out infinite;
          will-change: transform, opacity;
        }

        .cta-plane {
          animation: ctaPlane 4.5s ease-in-out infinite;
          will-change: transform;
        }

        .sparkle-blink {
          animation: sparkleBlink 3.2s ease-in-out infinite;
          will-change: transform, opacity;
        }

        .card-shine {
          animation: cardShine 5.2s ease-in-out infinite;
          will-change: transform, opacity;
        }

        .arrow-nudge {
          animation: arrowNudge 2.4s ease-in-out infinite;
          will-change: transform;
        }

        @media (prefers-reduced-motion: reduce) {
          .float-soft,
          .orbit-line,
          .map-line,
          .soft-glow,
          .cta-plane,
          .sparkle-blink,
          .card-shine,
          .arrow-nudge {
            animation: none !important;
          }

          .hero-motion-safe {
            transition-duration: 0.01ms !important;
          }
        }
      `}</style>

      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_38%_20%,rgba(255,118,42,0.18),transparent_28%),radial-gradient(circle_at_84%_72%,rgba(255,177,86,0.16),transparent_30%),linear-gradient(180deg,rgba(255,255,255,0.35),rgba(255,244,229,0))]" />
      <div className="pointer-events-none absolute inset-0 opacity-[0.30] [background-image:radial-gradient(#ffb27a_1px,transparent_1px)] [background-size:32px_32px]" />
      <div className="sparkle-blink pointer-events-none absolute left-[19%] top-[11%] text-2xl text-[#ffb000]">
        ✦
      </div>
      <div className="sparkle-blink pointer-events-none absolute bottom-[22%] right-[19%] text-2xl text-[#ffb000]">
        ✦
      </div>

      <div className="relative mx-auto max-w-[1780px] px-5 pb-4 pt-24 sm:px-7 lg:pb-3 lg:pt-20 xl:px-12">
        <main className="mt-2 grid items-center gap-5 lg:mt-0 lg:grid-cols-[29%_34%_37%] lg:gap-3 xl:gap-5">
          <div className="order-1 lg:col-auto">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-orange-100/70 px-4 py-2 text-xs font-black text-[#ff4b12] shadow-sm">
              <Sparkles size={17} fill="currentColor" /> Your future, our guidance
            </div>

            <h1 className="max-w-[430px] text-[40px] font-black leading-[0.92] tracking-[-0.045em] text-[#071f50] sm:text-[46px] lg:text-[44px] xl:text-[50px]">
              Explore your <br /> study abroad <br />
              <span className="relative inline-block text-[#ff4b12]">
                future
                <span className="absolute -bottom-2 left-0 h-1.5 w-[102%] rounded-full bg-[#ff4b12]" />
              </span>
              <span className="ml-5 inline-block rotate-[-10deg] text-[34px] font-normal text-[#ff4b12]">
                ♡
              </span>
            </h1>

            <p className="mt-4 max-w-[390px] text-[13px] font-semibold leading-6 text-[#14305f]">
              Dream big, we&apos;ll help you get there. Find the right course,
              win scholarships and start your journey with confidence.
            </p>

            <div className="mt-4 flex flex-wrap items-center gap-3 xl:flex-nowrap">
              <button
                type="button"
                onClick={() => goToRoute("/universities")}
                className={`hero-motion-safe flex items-center gap-3 rounded-full bg-[#ff4b12] px-5 py-3 text-xs font-black text-white shadow-[0_18px_38px_rgba(255,75,18,0.32)] hover:-translate-y-1 hover:bg-[#ff642f] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-orange-300 ${INTERACTIVE_TRANSITION}`}
              >
                Find My Course <Search size={18} />
              </button>

              <button
                type="button"
                onClick={() => scrollToSection("countries")}
                className={`hero-motion-safe flex items-center gap-3 rounded-full bg-white px-5 py-3 text-xs font-black text-[#071f50] shadow-[0_16px_36px_rgba(9,31,80,0.10)] hover:-translate-y-1 hover:text-[#ff4b12] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-orange-200 ${INTERACTIVE_TRANSITION}`}
              >
                Explore Countries <Globe2 size={18} />
              </button>

              <button
                type="button"
                onClick={() => goToRoute("/services")}
                className={`hero-motion-safe flex items-center gap-3 rounded-full bg-white px-5 py-3 text-xs font-black text-[#071f50] shadow-[0_16px_36px_rgba(9,31,80,0.10)] hover:-translate-y-1 hover:text-[#ff4b12] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-orange-200 ${INTERACTIVE_TRANSITION}`}
              >
                <CirclePlay size={18} /> How It Works
              </button>
            </div>

            <div className="mt-4 grid max-w-[430px] grid-cols-2 gap-2 sm:grid-cols-4">
              {trustStats.map((stat) => {
                const Icon = stat.icon;

                return (
                  <div
                    key={stat.label}
                    className={`group hero-motion-safe rounded-[17px] bg-white/72 px-3 py-2.5 shadow-[0_13px_28px_rgba(9,31,80,0.07)] ring-1 ring-orange-100/70 backdrop-blur hover:-translate-y-1 hover:bg-white ${INTERACTIVE_TRANSITION}`}
                  >
                    <Icon
                      size={17}
                      className="text-[#ff4b12]"
                      strokeWidth={3}
                    />
                    <p className="mt-2 text-[12px] font-black leading-tight text-[#071f50]">
                      {stat.value}
                    </p>
                    <p className="mt-0.5 text-[9px] font-black uppercase tracking-[0.16em] text-[#61708a]">
                      {stat.label}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="relative order-2 min-h-[315px] sm:min-h-[390px] lg:col-auto lg:min-h-[425px]">
            <div className="soft-glow absolute left-1/2 top-1/2 h-[330px] w-[330px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-orange-300/25 blur-3xl sm:h-[420px] sm:w-[420px] lg:h-[520px] lg:w-[520px]" />

            <svg
              className="pointer-events-none absolute left-1/2 top-2 h-[250px] w-[92%] -translate-x-1/2 overflow-visible sm:h-[300px] lg:left-[-8%] lg:top-[-4%] lg:h-[330px] lg:w-[116%] lg:translate-x-0"
              viewBox="0 0 500 430"
              aria-hidden="true"
            >
              <path
                d="M40 245 C90 55, 358 10, 432 122 C510 240, 310 368, 116 324"
                fill="none"
                stroke="#ff6b2b"
                strokeWidth="2"
                className="orbit-line"
              />
            </svg>

            <img
              src={heroStudent}
              alt="Zaifan student with globe"
              width="1536"
              height="1024"
              loading="eager"
              fetchPriority="high"
              decoding="async"
              className={`float-soft hero-motion-safe relative z-10 mx-auto h-[390px] w-full max-w-none object-contain drop-shadow-[0_32px_38px_rgba(9,31,80,0.22)] hover:scale-[1.025] sm:h-[485px] lg:h-[650px] lg:w-[138%] lg:-translate-x-[12%] lg:drop-shadow-[0_40px_46px_rgba(9,31,80,0.24)] ${INTERACTIVE_TRANSITION}`}
            />
          </div>

          <div className="order-3 hidden lg:col-auto lg:block">
            <div className="mb-3 flex items-center gap-3 text-[19px] font-black tracking-[-0.02em] text-[#071f50]">
              <span className="sparkle-blink text-[#ffb000]">✦</span>
              Why Italy?
              <span>🇮🇹</span>
            </div>

            <div
              className={`group hero-motion-safe relative overflow-hidden rounded-[32px] bg-gradient-to-br from-[#fff1dd] via-[#fff9f1] to-[#ffe3c4] p-5 shadow-[0_25px_70px_rgba(255,91,24,0.14)] ring-1 ring-white/90 hover:-translate-y-2 hover:shadow-[0_35px_90px_rgba(255,91,24,0.22)] ${INTERACTIVE_TRANSITION}`}
            >
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_16%_18%,rgba(255,255,255,0.95),transparent_30%),radial-gradient(circle_at_88%_12%,rgba(255,107,26,0.22),transparent_25%),linear-gradient(135deg,rgba(255,255,255,0.60),rgba(255,255,255,0.14))]" />
              <div className={`absolute right-[-60px] top-[-60px] h-[180px] w-[180px] rounded-full bg-orange-300/30 opacity-0 blur-3xl group-hover:opacity-100 ${INTERACTIVE_TRANSITION}`} />
              <div className={`absolute bottom-[-40px] left-[-40px] h-[120px] w-[120px] rounded-full bg-orange-200/40 opacity-0 blur-2xl group-hover:opacity-100 ${INTERACTIVE_TRANSITION}`} />
              <div className="card-shine pointer-events-none absolute -left-24 top-[-20%] h-[150%] w-16 bg-white/60 blur-xl" />
              <div className="absolute bottom-0 left-0 h-1 w-full bg-gradient-to-r from-transparent via-orange-400 to-transparent opacity-60" />

              <div className={`pointer-events-none absolute right-4 top-4 z-20 h-[78px] w-[78px] overflow-hidden rounded-full bg-white p-1.5 shadow-[0_14px_34px_rgba(9,31,80,0.16)] ring-1 ring-orange-100 group-hover:scale-105 ${INTERACTIVE_TRANSITION}`}>
                <img
                  src={italyImage}
                  alt=""
                  width="1088"
                  height="976"
                  loading="lazy"
                  decoding="async"
                  className="h-full w-full rounded-full object-cover"
                />
              </div>

              <div className="relative z-10">
                <div className="flex items-start justify-between gap-3 pr-20">
                  <div className="min-w-0">
                    <div className="flex items-center gap-3">
                      <div
                        className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-white text-lg font-black text-[#071f50] shadow-[0_14px_30px_rgba(9,31,80,0.10)] ring-1 ring-orange-100 group-hover:-translate-y-1 group-hover:rotate-[-3deg] ${INTERACTIVE_TRANSITION}`}
                      >
                        IT
                      </div>

                      <div>
                        <p className="text-xs font-black uppercase tracking-[0.22em] text-orange-600">
                          Italy Focus
                        </p>
                        <h3 className="mt-0.5 text-[22px] font-black leading-tight tracking-[-0.03em] text-[#071f50]">
                          Study In Italy
                        </h3>
                      </div>
                    </div>

                    <p className="mt-2 max-w-[390px] text-[11px] font-bold leading-5 text-[#264161]">
                      Affordable public universities, scholarship routes and a
                      clear roadmap from application to visa.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={goToAppointment}
                    className={`hero-motion-safe grid h-11 w-11 shrink-0 place-items-center rounded-full bg-white text-orange-500 shadow-[0_12px_26px_rgba(255,107,26,0.22)] ring-1 ring-white/80 hover:scale-110 hover:bg-[#ff4b12] hover:text-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-orange-300 ${INTERACTIVE_TRANSITION}`}
                    aria-label="Start Italy plan"
                  >
                    <ArrowRight
                      size={22}
                      strokeWidth={3}
                      className="arrow-nudge"
                    />
                  </button>
                </div>

                <div className="mt-4 grid gap-2.5 sm:grid-cols-2">
                  {ITALY_FEATURES.map(([icon, title, text]) => (
                    <div
                      key={title}
                      className={`group/item hero-motion-safe flex items-start gap-2.5 rounded-2xl bg-white/64 px-3 py-2.5 shadow-sm ring-1 ring-white/70 hover:-translate-y-1 hover:bg-white hover:shadow-md ${INTERACTIVE_TRANSITION}`}
                    >
                      <div
                        className={`grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-orange-50 text-base shadow-inner group-hover/item:scale-110 ${INTERACTIVE_TRANSITION}`}
                      >
                        {icon}
                      </div>
                      <div>
                        <p className="text-xs font-black leading-tight text-[#071f50]">
                          {title}
                        </p>
                        <p className="mt-1 text-[10px] font-bold leading-4 text-[#405672]">
                          {text}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2.5">
                  {ITALY_STATS.map(([label, value]) => (
                    <div
                      key={label}
                      className={`hero-motion-safe rounded-2xl bg-white/75 p-2.5 shadow-sm ring-1 ring-white/70 hover:-translate-y-1 hover:bg-white hover:shadow-md ${INTERACTIVE_TRANSITION}`}
                    >
                      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-orange-500">
                        {label}
                      </p>
                      <p className="mt-1 text-sm font-black text-[#071f50]">
                        {value}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="mt-3 flex flex-wrap gap-1.5">
                  {ITALY_CITIES.map((city) => (
                    <span
                      key={city}
                      className={`hero-motion-safe rounded-full bg-white/80 px-3 py-1.5 text-[11px] font-black text-[#071f50] shadow-sm ring-1 ring-white/70 hover:-translate-y-1 hover:bg-white hover:shadow-md ${INTERACTIVE_TRANSITION}`}
                    >
                      📍 {city}
                    </span>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => goToRoute("/countries/italy")}
                  className={`hero-motion-safe mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-[#ff4b12] px-5 py-3.5 text-sm font-black text-white shadow-[0_16px_34px_rgba(255,75,18,0.25)] hover:-translate-y-1 hover:bg-[#ff642f] hover:shadow-[0_24px_50px_rgba(255,75,18,0.38)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-orange-300 ${INTERACTIVE_TRANSITION}`}
                >
                  Start Your Italy Plan
                  <ArrowRight size={18} className="arrow-nudge" />
                </button>
              </div>
            </div>
          </div>
        </main>

        <section className="mt-4 grid grid-cols-12 gap-3 lg:mt-1">
          <SoftCard className="col-span-12 p-4 lg:col-span-5">
            <h2 className="mb-2 text-base font-black tracking-[-0.02em]">
              Your dream, our support{" "}
              <span className="text-[#ffb000]">✦</span>
            </h2>

            <div className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-0">
              {supportCards.map((card, index) => (
                <div
                  key={card.title}
                  className={`px-3 ${
                    index !== supportCards.length - 1
                      ? "md:border-r md:border-orange-100"
                      : ""
                  }`}
                >
                  <div
                    className={`hero-motion-safe mb-2 grid h-12 w-12 place-items-center rounded-full bg-gradient-to-br from-orange-50 to-blue-50 text-4xl shadow-inner hover:scale-105 ${INTERACTIVE_TRANSITION}`}
                  >
                    {card.icon}
                  </div>
                  <h3 className="text-xs font-black leading-tight">
                    {card.title}
                  </h3>
                  <p className="mt-1 text-[8px] font-semibold leading-[1.3] text-[#17335f] sm:text-[10px] sm:leading-4">
                    {card.text}
                  </p>
                </div>
              ))}
            </div>
          </SoftCard>

          <SoftCard className="col-span-12 p-4 lg:col-span-7">
            <div className="mb-2 flex items-center justify-between gap-2">
              <h2 className="min-w-0 text-[14px] font-black tracking-[-0.02em] sm:text-base">
                Choose your adventure 🗺️
              </h2>
              <button
                type="button"
                onClick={() => goToRoute("/services")}
                className={`hero-motion-safe shrink-0 rounded-full bg-orange-50 px-2.5 py-1.5 text-[9px] font-black text-[#ff4b12] sm:px-4 sm:text-[11px] hover:bg-orange-100 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-orange-200 ${INTERACTIVE_TRANSITION}`}
              >
                See Full Process
              </button>
            </div>

            <div className="relative grid grid-cols-5 items-start gap-1 sm:gap-4">
              <svg
                className="pointer-events-none absolute left-[12%] top-[25px] h-5 w-[76%] sm:top-[36px] sm:h-6"
                viewBox="0 0 760 40"
                preserveAspectRatio="none"
                aria-hidden="true"
              >
                <path
                  d="M0 20 C45 0, 75 40, 120 20 S195 0, 240 20 S315 40, 360 20 S435 0, 480 20 S555 40, 600 20 S675 0, 760 20"
                  fill="none"
                  stroke="#ff6b2b"
                  strokeWidth="2"
                  className="map-line"
                />
              </svg>

              {adventureSteps.map((step, index) => (
                <div key={step.title} className="relative z-10 text-center">
                  <div className="relative mx-auto h-[52px] w-[52px] sm:h-[82px] sm:w-[82px]">
                    <div
                      className={`hero-motion-safe grid h-full w-full place-items-center rounded-full bg-orange-50 text-xl shadow-inner sm:text-3xl hover:scale-105 ${INTERACTIVE_TRANSITION}`}
                    >
                      {index === 0 ? (
                        <img
                          src={walkingStudent}
                          alt="Student walking"
                          width="1024"
                          height="1536"
                          loading="lazy"
                          decoding="async"
                          className="h-[58px] w-[58px] object-contain drop-shadow-xl sm:h-[90px] sm:w-[90px]"
                        />
                      ) : (
                        <span>{step.icon}</span>
                      )}
                    </div>

                    <div className="absolute -bottom-1 left-1/2 z-30 grid h-5 w-5 -translate-x-1/2 place-items-center rounded-full bg-[#ff4b12] text-[11px] font-black text-white shadow-[0_7px_16px_rgba(255,75,18,0.35)] ring-2 ring-white">
                      {index + 1}
                    </div>
                  </div>

                  <h3 className="mt-2 text-[11px] font-black">
                    {step.title}
                  </h3>
                  <p className="mx-auto mt-1 max-w-[110px] text-[9px] font-semibold leading-4 text-[#17335f]">
                    {step.text}
                  </p>
                </div>
              ))}
            </div>
          </SoftCard>
        </section>

        <section className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
          {explorers.map((card) => (
            <article
              key={card.title}
              className={`group hero-motion-safe relative min-h-[78px] overflow-hidden rounded-[20px] bg-white/72 p-3 pl-24 shadow-[0_18px_45px_rgba(9,31,80,0.07)] ring-1 ring-orange-100/80 hover:-translate-y-1 hover:shadow-[0_24px_55px_rgba(255,91,24,0.14)] ${INTERACTIVE_TRANSITION}`}
            >
              <div
                className={`absolute left-4 top-1/2 grid h-12 w-12 -translate-y-1/2 place-items-center rounded-full bg-gradient-to-br from-orange-50 to-blue-50 text-4xl shadow-inner group-hover:scale-105 ${INTERACTIVE_TRANSITION}`}
              >
                {card.icon}
              </div>

              <h3 className="text-sm font-black">{card.title}</h3>
              <p className="mt-1 text-[11px] font-semibold leading-4 text-[#17335f]">
                {card.text}
              </p>

              <button
                type="button"
                onClick={() => handleExplorerAction(card)}
                className={`hero-motion-safe mt-1.5 grid h-6 w-6 place-items-center rounded-full bg-[#ff4b12] text-white group-hover:translate-x-1 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-orange-200 ${INTERACTIVE_TRANSITION}`}
                aria-label={`Open ${card.title}`}
              >
                <ChevronRight size={17} strokeWidth={4} />
              </button>
            </article>
          ))}
        </section>

        <section className="relative mt-4 h-[96px] overflow-visible rounded-[22px] bg-gradient-to-r from-[#071f50] via-[#0b3478] to-[#071f50] px-8 shadow-[0_22px_52px_rgba(7,31,80,0.28)]">
          <div className="absolute inset-0 overflow-hidden rounded-[22px] bg-[radial-gradient(circle_at_20%_50%,rgba(255,122,59,0.22),transparent_22%),radial-gradient(circle_at_82%_40%,rgba(255,255,255,0.16),transparent_20%)]" />

          <div className="relative z-10 flex h-[96px] flex-col items-start justify-center gap-3 py-4 md:flex-row md:items-center md:justify-between md:gap-6 md:py-0">
            <div className="relative hidden h-[96px] w-[390px] shrink-0 overflow-visible lg:block">
              <div className="absolute bottom-0 left-[78px] z-20 h-[152px] w-[158px] overflow-hidden">
                <img
                  src={guideStudent}
                  alt="Zaifan guide"
                  width="1024"
                  height="1536"
                  loading="lazy"
                  decoding="async"
                  className="h-[210px] w-full translate-y-[2px] object-contain object-top drop-shadow-[0_18px_18px_rgba(9,31,80,0.24)]"
                />
              </div>

              <div className="absolute left-[215px] top-[26px] z-30 min-w-[168px] rounded-[22px] bg-orange-100 px-5 py-3 text-center text-[10px] font-black leading-4 text-[#071f50] shadow-xl ring-1 ring-white/60 before:absolute before:left-[-9px] before:top-1/2 before:h-5 before:w-5 before:-translate-y-1/2 before:rotate-45 before:bg-orange-100">
                Not sure where <br /> to start?
              </div>
            </div>

            <div className="min-w-0 flex-1 pl-0 lg:ml-4 xl:ml-6">
              <h2 className="text-[20px] font-black leading-tight tracking-[-0.03em] text-white xl:text-[27px]">
                Let’s turn your dreams into reality!
              </h2>
              <p className="mt-1 text-xs font-semibold text-white/95">
                Book a free 1-on-1 consultation with our study abroad experts.
              </p>
            </div>

            <button
              type="button"
              onClick={goToAppointment}
              className={`hero-motion-safe hidden shrink-0 items-center gap-3 rounded-full bg-[#ff4b12] px-7 py-3.5 text-xs font-black text-white shadow-[0_18px_35px_rgba(255,75,18,0.28)] hover:-translate-y-1 hover:bg-[#ff642f] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-orange-300 md:flex ${INTERACTIVE_TRANSITION}`}
            >
              <CalendarDays size={20} /> Book Free Consultation
            </button>

            <div className="cta-plane hidden text-4xl text-white lg:block">
              ✈︎
            </div>
          </div>
        </section>
      </div>
    </section>
  );
}