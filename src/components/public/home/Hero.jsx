import {
  ArrowRight,
  CalendarDays,
  ChevronRight,
  GraduationCap as UniversityIcon,
  Globe2,
  GraduationCap,
  Sparkles,
  University,
  WalletCards,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import heroStudent from "../../../assets/images/zaifan/hero-student-globe.webp";
import heroStudentSmall from "../../../assets/images/zaifan/hero-student-globe-760.webp";
import { countryIndex as countryList } from "../../../data/countries/countryIndex";
import { FlagMark } from "../destinations/DestinationUI";

const EU_FLAG = { slug: "european-union", code: "EU", name: "European Union" };

const trustStats = [
  { icon: Globe2, value: String(countryList.length), label: "Destinations" },
  { icon: University, value: "190+", label: "University Profiles" },
  { icon: WalletCards, value: "Gov + EU", label: "Scholarship Routes" },
  { icon: GraduationCap, value: "Visa", label: "Planning Route" },
];

const INTERACTIVE_TRANSITION =
  "transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]";

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

  return (
    <section className="relative overflow-hidden bg-[#fff5e9] pb-6 text-[#071f50] lg:pb-8">
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

      <div className="relative mx-auto max-w-[1780px] px-4 pb-5 pt-24 sm:px-7 lg:pb-4 lg:pt-20 xl:px-12">
        <main className="mt-1 grid items-center gap-4 sm:gap-5 lg:mt-0 lg:grid-cols-[29%_34%_37%] lg:gap-3 xl:gap-5">
          <div className="order-1 lg:col-auto">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-orange-200/70 bg-white/75 px-4 py-2 text-[11px] font-black uppercase tracking-[0.08em] text-[#ff4b12] shadow-[0_10px_28px_rgba(255,75,18,0.10)] backdrop-blur sm:text-xs sm:normal-case sm:tracking-normal">
              <Sparkles size={17} fill="currentColor" /> Your future, our guidance
            </div>

            <h1 className="max-w-[520px] text-[44px] font-black leading-[0.92] tracking-[-0.05em] text-[#071f50] sm:text-[58px] lg:text-[54px] xl:text-[66px]">
              Explore your <br /> study abroad <br />
              <span className="relative inline-block text-[#ff4b12]">
                future
                <span className="absolute -bottom-2 left-0 h-1.5 w-[102%] rounded-full bg-[#ff4b12]" />
              </span>
              <span className="ml-5 inline-block rotate-[-10deg] text-[34px] font-normal text-[#ff4b12]">
                ♡
              </span>
            </h1>

            <p className="mt-5 max-w-[440px] text-[15px] font-semibold leading-7 text-[#274465] sm:text-base">
              Honest guidance for Pakistani students heading to Europe and Asia:
              the right country, the right university, real scholarships and a
              visa plan that holds up.
            </p>

            <div className="mt-4 relative z-20 flex flex-wrap items-center gap-2.5 sm:gap-3">
              <button
                type="button"
                onClick={goToAppointment}
                className={`hero-motion-safe flex items-center gap-2.5 whitespace-nowrap rounded-full bg-[#ff4b12] px-6 py-3.5 text-sm font-black text-white shadow-[0_18px_38px_rgba(255,75,18,0.32)] hover:-translate-y-1 hover:bg-[#ff642f] hover:shadow-[0_24px_48px_rgba(255,75,18,0.38)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-orange-300 ${INTERACTIVE_TRANSITION}`}
              >
                Book Free Consultation <CalendarDays size={18} />
              </button>

              <button
                type="button"
                onClick={() => scrollToSection("countries")}
                className={`hero-motion-safe flex items-center gap-2.5 whitespace-nowrap rounded-full border border-orange-100/80 bg-white/90 px-5 py-3 text-xs font-black text-[#071f50] shadow-[0_16px_36px_rgba(9,31,80,0.10)] backdrop-blur hover:-translate-y-1 hover:border-orange-200 hover:text-[#ff4b12] hover:shadow-[0_20px_44px_rgba(255,91,24,0.13)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-orange-200 ${INTERACTIVE_TRANSITION}`}
              >
                Explore Countries <Globe2 size={18} />
              </button>

              <button
                type="button"
                onClick={() => goToRoute("/universities")}
                className={`hero-motion-safe flex items-center gap-2.5 whitespace-nowrap rounded-full border border-orange-100/80 bg-white/90 px-5 py-3 text-xs font-black text-[#071f50] shadow-[0_16px_36px_rgba(9,31,80,0.10)] backdrop-blur hover:-translate-y-1 hover:border-orange-200 hover:text-[#ff4b12] hover:shadow-[0_20px_44px_rgba(255,91,24,0.13)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-orange-200 ${INTERACTIVE_TRANSITION}`}
              >
                <UniversityIcon size={18} /> Find a University
              </button>
            </div>

            <div className="mt-4 grid max-w-[430px] grid-cols-2 gap-2 sm:grid-cols-4">
              {trustStats.map((stat) => {
                const Icon = stat.icon;

                return (
                  <div
                    key={stat.label}
                    className={`group hero-motion-safe rounded-[17px] border border-orange-100/75 bg-white/76 px-3 py-2.5 shadow-[0_13px_28px_rgba(9,31,80,0.07)] backdrop-blur hover:-translate-y-1 hover:border-orange-200 hover:bg-white hover:shadow-[0_18px_36px_rgba(255,91,24,0.12)] ${INTERACTIVE_TRANSITION}`}
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

          <div className="order-3 flex flex-wrap gap-2 lg:hidden">
            {countryList.map((country) => (
              <button
                key={country.slug}
                type="button"
                onClick={() => goToRoute(`/countries/${country.slug}`)}
                className="inline-flex items-center gap-2 rounded-full border border-orange-100 bg-white/85 px-3 py-2 text-xs font-black text-[#071f50] shadow-sm"
              >
                <FlagMark country={country} className="h-4 w-6 rounded-[3px]" />
                {country.name}
              </button>
            ))}
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
              srcSet={`${heroStudentSmall} 760w, ${heroStudent} 1400w`}
              sizes="(max-width: 1023px) 100vw, 46vw"
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
              Where will you study?
            </div>

            <div
              className={`group hero-motion-safe relative overflow-hidden rounded-[32px] border border-orange-100/80 bg-gradient-to-br from-[#fff0da] via-[#fffaf3] to-[#ffe1bf] p-5 shadow-[0_25px_70px_rgba(255,91,24,0.14)] ring-1 ring-white/90 hover:-translate-y-2 hover:border-orange-200 hover:shadow-[0_35px_90px_rgba(255,91,24,0.22)] ${INTERACTIVE_TRANSITION}`}
            >
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_16%_18%,rgba(255,255,255,0.95),transparent_30%),radial-gradient(circle_at_88%_12%,rgba(255,107,26,0.22),transparent_25%),linear-gradient(135deg,rgba(255,255,255,0.60),rgba(255,255,255,0.14))]" />
              <div className="card-shine pointer-events-none absolute -left-24 top-[-20%] h-[150%] w-16 bg-white/60 blur-xl" />
              <div className="absolute bottom-0 left-0 h-1 w-full bg-gradient-to-r from-transparent via-orange-400 to-transparent opacity-60" />

              <div className="relative z-10">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.22em] text-orange-600">
                      {countryList.length} destinations live
                    </p>
                    <h3 className="mt-0.5 text-[22px] font-black leading-tight tracking-[-0.03em] text-[#071f50]">
                      Europe & Asia, one plan
                    </h3>
                    <p className="mt-1 max-w-[390px] text-[11px] font-bold leading-5 text-[#264161]">
                      Full guides with cities, universities, scholarships and a visa roadmap for every country.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => goToRoute("/countries")}
                    className={`hero-motion-safe grid h-11 w-11 shrink-0 place-items-center rounded-full bg-white text-orange-500 shadow-[0_12px_26px_rgba(255,107,26,0.22)] ring-1 ring-white/80 hover:scale-110 hover:bg-[#ff4b12] hover:text-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-orange-300 ${INTERACTIVE_TRANSITION}`}
                    aria-label="Compare all destinations"
                  >
                    <ArrowRight size={22} strokeWidth={3} className="arrow-nudge" />
                  </button>
                </div>

                <div className="mt-4 grid grid-cols-3 gap-2">
                  {countryList.map((country) => (
                    <button
                      key={country.slug}
                      type="button"
                      onClick={() => goToRoute(`/countries/${country.slug}`)}
                      className={`group/item hero-motion-safe flex flex-col items-start gap-2 rounded-2xl border border-white/80 bg-white/70 p-2.5 text-left shadow-sm hover:-translate-y-1 hover:border-orange-100 hover:bg-white hover:shadow-md ${INTERACTIVE_TRANSITION}`}
                    >
                      <FlagMark country={country} className="h-5 w-[30px] rounded-[4px]" />
                      <span className="text-xs font-black leading-tight text-[#071f50] group-hover/item:text-[#ff4b12]">
                        {country.name}
                      </span>
                      <span className="text-[9px] font-bold leading-3 text-[#405672]">
                        {country.quickFacts.tuition}
                      </span>
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => goToRoute("/countries/european-union")}
                  className={`hero-motion-safe mt-3 flex w-full items-center justify-between gap-3 rounded-2xl bg-[#003399] px-4 py-2.5 text-left text-white hover:-translate-y-0.5 ${INTERACTIVE_TRANSITION}`}
                >
                  <span className="flex items-center gap-2.5">
                    <FlagMark country={EU_FLAG} className="h-5 w-[30px] rounded-[4px]" />
                    <span className="text-xs font-black">Study in the EU</span>
                    <span className="text-[10px] font-bold text-white/70">Schengen · Erasmus+</span>
                  </span>
                  <ChevronRight size={16} strokeWidth={3} className="text-[#ffcc00]" />
                </button>

                <button
                  type="button"
                  onClick={() => goToRoute("/countries")}
                  className={`hero-motion-safe mt-3 flex w-full items-center justify-center gap-2 rounded-full bg-[#ff4b12] px-5 py-3.5 text-sm font-black text-white shadow-[0_16px_34px_rgba(255,75,18,0.25)] hover:-translate-y-1 hover:bg-[#ff642f] hover:shadow-[0_24px_50px_rgba(255,75,18,0.38)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-orange-300 ${INTERACTIVE_TRANSITION}`}
                >
                  Compare All Destinations
                  <ArrowRight size={18} className="arrow-nudge" />
                </button>
              </div>
            </div>
          </div>
        </main>

      </div>
    </section>
  );
}