import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Sparkles,
  Compass,
  Plane,
  Trophy,
  GraduationCap,
  CheckCircle2,
  MousePointerClick,
  MapPin,
  BadgeDollarSign,
  FileCheck2,
} from "lucide-react";

import courseExplorer from "../assets/images/dream-support/course-explorer.png";
import scholarshipHunter from "../assets/images/dream-support/scholarship-hunter.png";
import movePlanner from "../assets/images/dream-support/move-planner.png";
import acceptanceSuccess from "../assets/images/dream-support/acceptance-success.png";
import dreamSupportMascot from "../assets/images/dream-support/dream-support-mascot.png";

const supportCards = [
  {
    number: "01",
    icon: GraduationCap,
    eyebrow: "Course Match",
    title: "Find Your Perfect Course",
    text: "Explore the right course that matches your passion, goals and future career.",
    image: courseExplorer,
    bg: "from-[#fff4ea] via-[#fffaf5] to-white",
    ring: "ring-orange-100",
    accent: "#ff4b12",
    glow: "bg-orange-300/35",
    stats: [
      { value: "18k+", label: "Courses" },
      { value: "45+", label: "Fields" },
    ],
    chips: ["Business", "Computer Science", "Medicine", "Engineering"],
    checklist: ["Profile review", "Career fit", "Course shortlist"],
    footer: "Smart course matching",
  },
  {
    number: "02",
    icon: Trophy,
    eyebrow: "Funding Route",
    title: "Unlock Scholarships",
    text: "Discover funding opportunities and maximize your scholarship potential.",
    image: scholarshipHunter,
    bg: "from-[#eafff6] via-[#f7fffb] to-white",
    ring: "ring-emerald-100",
    accent: "#10b981",
    glow: "bg-emerald-300/30",
    stats: [
      { value: "92%", label: "Match" },
      { value: "$50k", label: "Routes" },
    ],
    chips: ["Merit", "Need-based", "Country funds", "University awards"],
    checklist: ["Eligibility scan", "Funding plan", "Deadline tracker"],
    footer: "Scholarship match found",
  },
  {
    number: "03",
    icon: Plane,
    eyebrow: "Travel Ready",
    title: "Plan Your Move",
    text: "From visas to flights and accommodation, we help you prepare stress-free.",
    image: movePlanner,
    bg: "from-[#eaf7ff] via-[#f8fcff] to-white",
    ring: "ring-sky-100",
    accent: "#0284c7",
    glow: "bg-sky-300/30",
    stats: [
      { value: "4", label: "Steps" },
      { value: "0", label: "Stress" },
    ],
    chips: ["Visa", "Flights", "Housing", "Packing"],
    checklist: ["Visa documents", "Arrival plan", "Accommodation"],
    footer: "Move plan prepared",
  },
  {
    number: "04",
    icon: Compass,
    eyebrow: "Admission Win",
    title: "Get Accepted",
    text: "Complete your application with confidence and move toward your dream university.",
    image: acceptanceSuccess,
    bg: "from-[#fff0fb] via-[#fff9fd] to-white",
    ring: "ring-pink-100",
    accent: "#ec4899",
    glow: "bg-pink-300/30",
    stats: [
      { value: "Offer", label: "Letter" },
      { value: "CAS", label: "Ready" },
    ],
    chips: ["SOP", "Documents", "Application", "Offer"],
    checklist: ["Application check", "Offer tracking", "Final guidance"],
    footer: "Acceptance journey complete",
  },
];

const promiseChips = [
  "Course clarity",
  "Scholarship route",
  "Application confidence",
];

export default function DreamSupportSection() {
  const [activeCard, setActiveCard] = useState(null);
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
    <section
      id="dream-support"
      className="relative overflow-hidden bg-[#fff5e9] px-5 pb-12 pt-3 text-[#071f50] lg:pb-14 lg:pt-3"
    >
      <style>{`
        @keyframes zaifanDash {
          from { stroke-dashoffset: 0; }
          to { stroke-dashoffset: -260; }
        }

        .zaifan-dash-hover {
          stroke-dasharray: 10 14;
          stroke-dashoffset: 0;
        }

        .group:hover .zaifan-dash-hover {
          animation: zaifanDash 12s linear infinite;
        }
      `}</style>

      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_14%_18%,rgba(255,75,18,0.10),transparent_28%),radial-gradient(circle_at_82%_32%,rgba(255,178,87,0.12),transparent_34%),radial-gradient(circle_at_50%_100%,rgba(255,255,255,0.72),transparent_42%),linear-gradient(180deg,rgba(255,255,255,0.42),rgba(255,245,233,0))]" />
      <div className="pointer-events-none absolute left-[-90px] top-16 h-64 w-64 rounded-full bg-orange-300/14 blur-3xl" />
      <div className="pointer-events-none absolute right-[-110px] bottom-16 h-72 w-72 rounded-full bg-[#ff4b12]/8 blur-3xl" />

      <div className="relative mx-auto max-w-[1660px]">
        <div className="relative mb-4 overflow-hidden rounded-[34px] border border-orange-100/80 bg-gradient-to-br from-white/88 via-[#fff9f1] to-[#fff0df] px-6 py-3 shadow-[0_18px_58px_rgba(9,31,80,0.07)] ring-1 ring-white/75 sm:px-8 lg:px-12 lg:py-4 xl:px-14">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_18%,rgba(255,75,18,0.07),transparent_28%),radial-gradient(circle_at_82%_48%,rgba(255,178,87,0.15),transparent_36%),linear-gradient(90deg,rgba(255,255,255,0.9)_0%,rgba(255,255,255,0.68)_44%,rgba(255,241,222,0.16)_100%)]" />
          <div className="pointer-events-none absolute -left-28 -top-28 h-64 w-64 rounded-full bg-[#ff4b12]/8 blur-3xl" />

          <div className="pointer-events-none absolute right-[-160px] top-[-185px] hidden h-[690px] w-[690px] rounded-full bg-gradient-to-br from-orange-100/42 via-white/14 to-orange-200/26 lg:block xl:right-[-120px] xl:top-[-180px] xl:h-[740px] xl:w-[740px]" />
          <div className="pointer-events-none absolute right-[11%] top-[12%] hidden h-56 w-56 rounded-full bg-orange-300/10 blur-3xl xl:block" />

          <div className="relative z-10 grid min-h-[370px] items-center gap-5 lg:grid-cols-[48%_52%] xl:min-h-[405px]">
            <div className="relative z-30 max-w-[760px]">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-black text-[#ff4b12] shadow-[0_14px_35px_rgba(9,31,80,0.08)] ring-1 ring-orange-100">
                <Sparkles size={17} fill="currentColor" />
                Your future, our guidance
              </div>

              <h2 className="max-w-[720px] text-5xl font-black leading-[0.92] tracking-[-0.06em] text-[#071f50] sm:text-6xl md:text-7xl xl:text-[80px]">
                Your{" "}
                <span className="text-[#ff4b12] drop-shadow-[0_10px_22px_rgba(255,75,18,0.13)]">
                  dream,
                </span>
                <br className="hidden sm:block" /> our{" "}
                <span className="text-[#ff4b12] drop-shadow-[0_10px_22px_rgba(255,75,18,0.13)]">
                  support
                </span>{" "}
                <span className="inline-block rotate-[-10deg] text-[#ff4b12]">
                  ♡
                </span>
              </h2>

              <p className="mt-4 max-w-2xl text-lg font-semibold leading-8 text-[#526178] xl:text-[19px] xl:leading-8">
                We’re with you at every step, turning your study abroad dream into a
                successful reality.
              </p>

              <div className="relative z-40 mt-5 grid max-w-[650px] gap-2.5 sm:grid-cols-3">
                {promiseChips.map((item) => (
                  <div
                    key={item}
                    className="flex min-h-[58px] items-center gap-3 rounded-2xl bg-white/94 px-4 py-3 text-sm font-black text-[#071f50] shadow-[0_10px_28px_rgba(9,31,80,0.055)] ring-1 ring-orange-100/80 backdrop-blur"
                  >
                    <CheckCircle2 size={17} className="shrink-0 text-[#ff4b12]" />
                    <span className="leading-tight">{item}</span>
                  </div>
                ))}
              </div>

              <div className="relative z-40 mt-5 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={goToAppointment}
                  className="inline-flex items-center gap-3 rounded-full bg-[#ff4b12] px-7 py-4 text-sm font-black text-white shadow-[0_18px_38px_rgba(255,75,18,0.28)] transition hover:-translate-y-1 hover:bg-[#ff642f]"
                >
                  Explore your support
                  <ArrowRight size={21} strokeWidth={3} />
                </button>
                <button
                  type="button"
                  onClick={() => scrollToSection("more-help")}
                  className="inline-flex items-center gap-3 rounded-full bg-white px-7 py-4 text-sm font-black text-[#071f50] shadow-[0_12px_30px_rgba(9,31,80,0.06)] ring-1 ring-orange-100 transition hover:-translate-y-1 hover:bg-orange-50"
                >
                  View scholarships
                </button>
              </div>
            </div>

            <div className="relative hidden min-h-[370px] items-end justify-center lg:flex xl:min-h-[405px]">
              <div className="absolute bottom-0 h-16 w-[70%] rounded-full bg-[#071f50]/8 blur-2xl" />
              <div className="absolute bottom-8 left-[7%] h-20 w-20 rounded-full bg-orange-300/14 blur-2xl" />

              <img
                src={dreamSupportMascot}
                alt="Dream Support Mascot"
                className="
                  pointer-events-none
                  relative
                  z-10

                  w-[122%]
                  max-w-none

                  translate-x-[2%]
                  translate-y-[-55px]

                  object-contain
                  object-bottom

                  drop-shadow-[0_32px_48px_rgba(9,31,80,0.16)]

                  xl:w-[130%]
                  xl:translate-x-[4%]
                  xl:translate-y-[-70px]

                  2xl:w-[136%]
                  2xl:translate-x-[6%]
                  2xl:translate-y-[-75px]
                "
              />
            </div>
          </div>
        </div>

        <div className="mb-5 grid gap-3 md:grid-cols-4">
          {supportCards.map((card, index) => {
            const Icon = card.icon;
            const isActive = activeCard === index;

            return (
              <button
                key={card.title}
                type="button"
                onMouseEnter={() => setActiveCard(index)}
                onMouseLeave={() => setActiveCard(null)}
                onFocus={() => setActiveCard(index)}
                onBlur={() => setActiveCard(null)}
                className={`group relative overflow-hidden rounded-[20px] border bg-white/78 p-3.5 text-left shadow-[0_12px_32px_rgba(9,31,80,0.055)] ring-1 transition-all duration-300 hover:-translate-y-1 ${
                  isActive
                    ? "border-[#ff4b12]/25 ring-[#ff4b12]/20 shadow-[0_18px_45px_rgba(255,75,18,0.11)]"
                    : "border-white/80 ring-orange-100/70"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span
                    className="grid h-10 w-10 place-items-center rounded-2xl text-white shadow-lg"
                    style={{ backgroundColor: card.accent }}
                  >
                    <Icon size={18} />
                  </span>
                  <span>
                    <span className="block text-[9px] font-black uppercase tracking-[0.18em] text-[#ff4b12]">
                      Step {card.number}
                    </span>
                    <span className="mt-1 block text-sm font-black leading-tight text-[#071f50]">
                      {card.title}
                    </span>
                  </span>
                </div>

                <div
                  className={`absolute bottom-0 left-0 h-1 rounded-r-full transition-all duration-300 ${
                    isActive ? "w-full" : "w-0"
                  }`}
                  style={{ backgroundColor: card.accent }}
                />
              </button>
            );
          })}
        </div>

        <div className="grid gap-7 lg:grid-cols-2">
          {supportCards.map((card, index) => {
            const Icon = card.icon;
            const isActive = activeCard === index;

            return (
              <article
                key={card.number}
                onMouseEnter={() => setActiveCard(index)}
                onMouseLeave={() => setActiveCard(null)}
                className={`group relative min-h-[430px] overflow-hidden rounded-[40px] border border-white/85 bg-gradient-to-br ${card.bg} p-6 shadow-[0_24px_65px_rgba(9,31,80,0.09)] ring-1 ${card.ring} transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_36px_95px_rgba(9,31,80,0.15)]`}
              >
                <div
                  className={`absolute -left-24 -top-24 h-64 w-64 rounded-full ${card.glow} blur-3xl transition duration-700 group-hover:scale-125`}
                />
                <div className="absolute -bottom-16 -right-16 h-56 w-56 rounded-full bg-white/65 blur-xl" />

                <svg
                  className="pointer-events-none absolute inset-x-8 top-8 h-24 w-[calc(100%-4rem)] text-[#ff8a4b]/35"
                  viewBox="0 0 600 120"
                  preserveAspectRatio="none"
                >
                  <path
                    d="M8 78 C120 8 210 110 318 45 S500 5 592 72"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className="zaifan-dash-hover"
                  />
                </svg>

                <div className="absolute right-7 top-7 z-20 flex items-center gap-3">
                  <div className="hidden rounded-full bg-white/80 px-4 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-[#ff4b12] shadow-sm md:block">
                    {card.footer}
                  </div>
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#ffe5d6] text-lg font-black text-[#ff4b12] shadow-inner ring-8 ring-white/40">
                    {card.number}
                  </div>
                </div>

                <div className="relative z-10 grid h-full items-center gap-6 md:grid-cols-[52%_48%]">
                  <div className="relative flex min-h-[330px] items-center justify-center">
                    <div className="absolute bottom-10 h-20 w-[78%] rounded-full bg-[#071f50]/10 blur-2xl" />

                    <div className="absolute left-2 top-8 z-20 hidden rounded-2xl bg-white/85 px-4 py-3 shadow-[0_14px_35px_rgba(9,31,80,0.10)] ring-1 ring-white/70 backdrop-blur md:block">
                      <div className="flex items-center gap-2">
                        <MousePointerClick size={15} className="text-[#ff4b12]" />
                        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#526178]">
                          Interactive
                        </p>
                      </div>
                      <p className="mt-1 text-sm font-black text-[#071f50]">
                        Tap to explore
                      </p>
                    </div>

                    <div className="absolute bottom-4 left-5 z-20 grid grid-cols-2 gap-2">
                      {card.stats.map((stat) => (
                        <div
                          key={stat.label}
                          className="rounded-2xl bg-white/85 px-4 py-3 text-center shadow-[0_14px_35px_rgba(9,31,80,0.09)] ring-1 ring-white/70 backdrop-blur"
                        >
                          <p
                            className="text-lg font-black"
                            style={{ color: card.accent }}
                          >
                            {stat.value}
                          </p>
                          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#526178]">
                            {stat.label}
                          </p>
                        </div>
                      ))}
                    </div>

                    <img
                      src={card.image}
                      alt={card.title}
                      className={`relative z-10 max-h-[340px] w-full object-contain object-bottom drop-shadow-[0_26px_30px_rgba(9,31,80,0.14)] transition duration-700 group-hover:scale-[1.055] ${
                        isActive ? "scale-[1.035]" : ""
                      }`}
                    />
                  </div>

                  <div className="relative pr-2">
                    <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-white/85 px-4 py-2 text-[11px] font-black uppercase tracking-[0.18em] text-[#ff4b12] shadow-sm ring-1 ring-white/70">
                      <Icon size={15} />
                      {card.eyebrow}
                    </div>

                    <h3 className="max-w-[350px] text-4xl font-black leading-[1.02] tracking-[-0.045em] text-[#071f50]">
                      {card.title}
                    </h3>

                    <p className="mt-5 max-w-[340px] text-[16px] font-semibold leading-7 text-[#526178]">
                      {card.text}
                    </p>

                    <div className="mt-6 flex flex-wrap gap-2">
                      {card.chips.map((chip) => (
                        <span
                          key={chip}
                          className="rounded-full bg-white/80 px-3.5 py-2 text-xs font-black text-[#071f50] shadow-sm ring-1 ring-white/80"
                        >
                          {chip}
                        </span>
                      ))}
                    </div>

                    <div className="mt-6 rounded-[24px] bg-white/70 p-4 shadow-[0_16px_36px_rgba(9,31,80,0.07)] ring-1 ring-white/80 backdrop-blur">
                      <div className="mb-3 flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-[#ff4b12]">
                        {index === 0 && <GraduationCap size={15} />}
                        {index === 1 && <BadgeDollarSign size={15} />}
                        {index === 2 && <MapPin size={15} />}
                        {index === 3 && <FileCheck2 size={15} />}
                        What we handle
                      </div>

                      <div className="space-y-2.5">
                        {card.checklist.map((item) => (
                          <div key={item} className="flex items-center gap-2.5">
                            <CheckCircle2
                              size={17}
                              style={{ color: card.accent }}
                            />
                            <span className="text-sm font-bold text-[#233a63]">
                              {item}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={goToAppointment}
                      className="mt-7 inline-flex items-center gap-3 rounded-full bg-[#ff4b12] px-6 py-4 text-sm font-black text-white shadow-[0_18px_35px_rgba(255,75,18,0.32)] transition-all duration-300 hover:-translate-y-1 hover:bg-[#ff642f] group-hover:gap-4"
                    >
                      Start this step
                      <ArrowRight size={22} strokeWidth={3} />
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        <div className="relative mt-14 overflow-hidden rounded-[34px] bg-[#071f50] p-7 text-white shadow-[0_26px_70px_rgba(7,31,80,0.18)]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_40%,rgba(255,75,18,0.32),transparent_30%),radial-gradient(circle_at_86%_40%,rgba(255,190,92,0.22),transparent_30%)]" />

          <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.28em] text-orange-200">
                Ready when you are
              </p>
              <h3 className="mt-2 text-3xl font-black tracking-[-0.035em] md:text-4xl">
                Start with one step. We’ll guide the whole journey.
              </h3>
            </div>

            <div className="flex flex-wrap gap-3">
              {["Dream", "Choose", "Apply", "Fly"].map((step, index) => (
                <div
                  key={step}
                  className="flex items-center gap-2 rounded-full bg-white/10 px-4 py-3 text-sm font-black ring-1 ring-white/15 backdrop-blur"
                >
                  <span className="grid h-6 w-6 place-items-center rounded-full bg-[#ff4b12] text-[11px]">
                    {index + 1}
                  </span>
                  {step}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="relative mt-10">
          <svg
            className="pointer-events-none h-12 w-full text-[#ff8a4b]/35"
            viewBox="0 0 1200 60"
            preserveAspectRatio="none"
          >
            <path
              d="M0 35 C180 0 320 60 500 30 S820 0 1020 30 S1160 55 1200 25"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="zaifan-dash-hover"
            />
          </svg>

          <div className="pointer-events-none absolute -bottom-4 left-[9%] text-3xl">
            💗
          </div>
          <div className="pointer-events-none absolute -bottom-6 right-[4%] text-5xl">
            🎈
          </div>
        </div>
      </div>
    </section>
  );
}
