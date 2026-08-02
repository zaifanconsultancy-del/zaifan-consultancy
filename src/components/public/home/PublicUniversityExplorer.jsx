import React from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  BadgePercent,
  BookOpenCheck,
  Building2,
  CheckCircle2,
  ExternalLink,
  CalendarCheck2,
  GraduationCap,
  Heart,
  Landmark,
  MessageCircleQuestion,
  MapPin,
  Search,
  Sparkles,
  Star,
  Target,
  Trophy,
  UsersRound,
  Wallet,
  Zap,
} from "lucide-react";

import australiaUniversity from "../../../assets/images/universities/australia-university.webp";
import canadaUniversity from "../../../assets/images/universities/canada-university.webp";
import germanyUniversity from "../../../assets/images/universities/germany-university.webp";
import italyUniversity from "../../../assets/images/universities/politecnico-di-milano.webp";
import turkeyUniversity from "../../../assets/images/universities/turkey-university.webp";
import ukUniversity from "../../../assets/images/universities/uk-university.webp";
import mascotExplorer from "../../../assets/images/universities/mascot-explorer.webp";
import mascotThumbsup from "../../../assets/images/universities/mascot-thumbsup.webp";

import {
  getScholarshipBadge,
  getTopItalianUniversities,
  getTuitionBadge,
} from "../../../data/italianUniversities";

const comingSoonCountries = [
  {
    flag: "🇩🇪",
    name: "Germany",
    image: germanyUniversity,
    copy: "Public universities, engineering routes and low-tuition pathways will be added after Italy is complete.",
  },
  {
    flag: "🇬🇧",
    name: "United Kingdom",
    image: ukUniversity,
    copy: "UK universities, scholarships and fast-track degrees are planned for the next expansion phase.",
  },
  {
    flag: "🇨🇦",
    name: "Canada",
    image: canadaUniversity,
    copy: "Canada pathways, colleges and post-study options will be built when real data is ready.",
  },
  {
    flag: "🇦🇺",
    name: "Australia",
    image: australiaUniversity,
    copy: "Australian universities and lifestyle-focused study routes are coming in a future rollout.",
  },
  {
    flag: "🇹🇷",
    name: "Turkey",
    image: turkeyUniversity,
    copy: "Turkey stays on the roadmap for affordable education and future partner routes.",
  },
];

const journeySteps = [
  {
    step: "01",
    title: "Featured First",
    copy: "Begin with a featured Italian university and understand the essentials clearly.",
    icon: Trophy,
  },
  {
    step: "02",
    title: "Explore More",
    copy: "Move into the full university directory when you are ready to compare more options.",
    icon: Search,
  },
  {
    step: "03",
    title: "Open Details",
    copy: "Open a dedicated profile for university fit, costs, programs and student context.",
    icon: BookOpenCheck,
  },
  {
    step: "04",
    title: "Book Guidance",
    copy: "Book shortlist guidance when you want help turning research into a clear next step.",
    icon: UsersRound,
  },
];

const buildAppointmentUrl = (universityName, service = "University Guidance") =>
  `/appointment?country=Italy&university=${encodeURIComponent(universityName)}&service=${encodeURIComponent(service)}`;

const INTERACTIVE_TRANSITION =
  "transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]";

export default function PublicUniversityExplorer() {
  const [featuredUniversity, secondUniversity, thirdUniversity] = getTopItalianUniversities(3);

  if (!featuredUniversity) {
    return null;
  }

  return (
    <section
      id="universities"
      className="relative overflow-hidden bg-[#fff8f1] py-12 text-[#071b3a] sm:py-16 lg:py-20"
    >
      <style>{`
        @keyframes uniFloat {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-12px) rotate(2deg); }
        }

        @keyframes uniRoute {
          from { stroke-dashoffset: 0; }
          to { stroke-dashoffset: -220; }
        }

        @keyframes uniPulse {
          0%, 100% { transform: scale(1); opacity: 0.9; }
          50% { transform: scale(1.04); opacity: 1; }
        }

        .uni-float { animation: uniFloat 6s ease-in-out infinite; }
        .uni-float-delay { animation: uniFloat 7.5s ease-in-out infinite; animation-delay: -2.5s; }
        .uni-route { stroke-dasharray: 8 13; animation: uniRoute 12s linear infinite; }
        .uni-pulse { animation: uniPulse 4s ease-in-out infinite; }

        @media (prefers-reduced-motion: reduce) {
          .uni-float,
          .uni-float-delay,
          .uni-route,
          .uni-pulse {
            transition: none !important;
            transform: none !important;
            animation: none !important;
          }

          #universities *,
          #universities *::before,
          #universities *::after {
            scroll-behavior: auto !important;
            transition-duration: 0.01ms !important;
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
          }
        }
      `}</style>

      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_70%_5%,rgba(255,110,28,0.16),transparent_32%),radial-gradient(circle_at_10%_80%,rgba(255,172,92,0.18),transparent_28%)]" />
      <div className="pointer-events-none absolute left-[-120px] top-24 h-96 w-96 rounded-full bg-orange-300/20 blur-3xl" />
      <div className="pointer-events-none absolute right-[-120px] bottom-20 h-96 w-96 rounded-full bg-[#ff4b12]/10 blur-3xl" />

      <svg
        className="pointer-events-none absolute left-0 top-10 h-[220px] w-full text-orange-400/25"
        viewBox="0 0 1500 220"
        preserveAspectRatio="none"
      >
        <path
          d="M0 135 C170 25 330 125 500 58 S800 185 1030 72 S1340 25 1500 115"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="uni-route"
        />
      </svg>

      <div className="pointer-events-none absolute left-10 top-20 text-5xl uni-float-delay">✈️</div>
      <div className="pointer-events-none absolute right-[9%] top-28 text-4xl uni-float">🎓</div>
      <div className="pointer-events-none absolute right-[5%] top-52 text-5xl opacity-70 uni-float-delay">☁️</div>

      <div className="relative mx-auto max-w-[1500px] px-4 sm:px-6 lg:px-10">
        <div className="grid gap-6 sm:gap-8 lg:grid-cols-[1.05fr_1fr] lg:items-center">
          <div className="pt-2 text-center lg:pt-4 lg:text-left">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-orange-100 bg-white/90 px-4 py-2 text-[10px] font-black uppercase tracking-[0.14em] text-orange-600 shadow-[0_12px_30px_rgba(255,91,18,0.08)] backdrop-blur sm:mb-5 sm:px-5 sm:text-xs sm:tracking-[0.18em]">
              <Sparkles className="h-4 w-4 fill-orange-500" />
              Italy university hub — available now
            </div>

            <h2 className="mx-auto max-w-4xl text-[2.55rem] font-black leading-[1] tracking-[-0.05em] text-[#071b3a] sm:text-6xl lg:mx-0 lg:text-7xl lg:leading-[0.98]">
              Explore <span className="text-orange-600">Italy's Top</span>
              <br />
              Universities
            </h2>

            <p className="mx-auto mt-4 max-w-2xl text-sm font-semibold leading-6 text-slate-700 sm:mt-5 sm:text-lg sm:leading-8 lg:mx-0">
              Start with a featured Italian university, compare the essentials, then open the full directory or ask for shortlist guidance when you need deeper support.
            </p>

            <div className="mx-auto mt-5 grid max-w-3xl grid-cols-2 overflow-hidden rounded-[1.35rem] border border-orange-100 bg-white/92 shadow-[0_18px_55px_rgba(15,23,42,0.08)] sm:mt-7 sm:grid-cols-4 sm:rounded-3xl lg:mx-0">
              {[
                [GraduationCap, "50+", "Universities"],
                [Building2, "8+", "Student Cities"],
                [BadgePercent, "DSU", "Scholarships"],
                [UsersRound, "Italy", "Focused Help"],
              ].map(([Icon, value, label]) => (
                <div
                  key={label}
                  className="flex items-center justify-center gap-2.5 border-orange-100 px-3 py-4 transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:bg-orange-50/60 sm:border-r sm:px-4 sm:py-5 sm:last:border-r-0 lg:justify-start lg:px-5"
                >
                  <div className="rounded-2xl bg-orange-50 p-2 text-orange-600">
                    <Icon className="h-6 w-6 sm:h-7 sm:w-7" />
                  </div>
                  <div className="text-left">
                    <div className="text-xl font-black leading-none text-[#071b3a] sm:text-2xl">{value}</div>
                    <div className="mt-1 text-[11px] font-bold text-slate-600 sm:text-xs">{label}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-5 flex flex-col gap-2.5 sm:mt-7 sm:flex-row sm:justify-center sm:gap-3 lg:justify-start">
              <Link
                to="/universities"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2.5 rounded-full bg-orange-600 px-5 py-3.5 text-sm font-black text-white shadow-[0_16px_34px_rgba(234,88,12,0.24)] transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-1 hover:bg-orange-700 hover:shadow-[0_22px_46px_rgba(234,88,12,0.30)] focus:outline-none focus-visible:ring-4 focus:ring-orange-100 sm:px-6 sm:py-4"
              >
                Explore More Universities
                <ExternalLink className="h-4 w-4" />
              </Link>

              <a
                href="/appointment?country=Italy&service=University Selection"
                className="inline-flex items-center justify-center gap-2.5 rounded-full border border-orange-100 bg-white/95 px-5 py-3.5 text-sm font-black text-[#071b3a] shadow-sm transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-1 hover:border-orange-300 hover:text-orange-600 hover:shadow-[0_16px_34px_rgba(255,91,18,0.10)] focus:outline-none focus-visible:ring-4 focus:ring-orange-100 sm:px-6 sm:py-4"
              >
                Get Shortlist Help
                <ArrowRight className="h-4 w-4" />
              </a>
            </div>
          </div>

          <div className="relative hidden min-h-[520px] lg:block">
            <div className="absolute left-4 top-6 h-[390px] w-[390px] rounded-full bg-orange-400/20 blur-3xl" />
            <div className="absolute right-4 top-10 h-72 w-72 rounded-full bg-white/80 blur-2xl" />

            <div className="relative mx-auto flex max-w-[620px] justify-center">
              <div className="absolute right-8 top-10 h-[370px] w-[370px] rounded-full bg-gradient-to-br from-orange-200 via-orange-100 to-white shadow-inner" />

              <img
                src={mascotExplorer}
                alt="Zaifan student exploring Italian universities"
                loading="lazy"
                decoding="async"
                className="relative z-10 max-h-[535px] w-full object-contain drop-shadow-[0_28px_35px_rgba(15,23,42,0.16)]"
              />

              <div className="absolute right-0 top-20 z-20 rounded-3xl border border-orange-100 bg-white/95 px-5 py-4 shadow-xl">
                <div className="text-sm font-black text-[#071b3a]">Study in Italy</div>
                <div className="mt-1 flex items-center gap-2 text-lg font-black text-orange-600">
                  Made Simple <Heart className="h-4 w-4" />
                </div>
              </div>

              <div className="absolute -right-1 bottom-8 z-20 w-[340px] rounded-3xl border border-orange-100 bg-white/95 p-5 shadow-[0_22px_50px_rgba(15,23,42,0.12)]">
                <h3 className="text-sm font-black text-[#071b3a]">Find an Italian University</h3>

                <div className="relative mt-4">
                  <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    readOnly
                    placeholder="Search on full universities page"
                    className="h-11 w-full rounded-xl border border-orange-100 bg-white pl-11 pr-4 text-xs font-bold text-slate-500 outline-none"
                  />
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2">
                  <Link
                    to="/universities"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex h-10 items-center justify-center rounded-xl border border-orange-100 bg-white px-3 text-xs font-black text-slate-700 transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:border-orange-300 hover:text-orange-600"
                  >
                    All Cities
                  </Link>
                  <Link
                    to="/universities"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex h-10 items-center justify-center rounded-xl border border-orange-100 bg-white px-3 text-xs font-black text-slate-700 transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:border-orange-300 hover:text-orange-600"
                  >
                    All Programs
                  </Link>
                </div>

                <Link
                  to="/universities"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-flex h-11 w-full items-center justify-center rounded-xl bg-orange-600 text-sm font-black text-white shadow-lg shadow-orange-600/20 transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-0.5 hover:bg-orange-700 focus:outline-none focus-visible:ring-4 focus:ring-orange-200"
                >
                  Open Full Database
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-7 overflow-hidden rounded-[1.6rem] border border-orange-100 bg-white/84 p-3 shadow-[0_25px_80px_rgba(15,23,42,0.08)] backdrop-blur-xl sm:mt-8 sm:rounded-[2rem] sm:p-4 lg:p-5">
          <div className="flex flex-col gap-4 rounded-[1.35rem] border border-orange-100/70 bg-gradient-to-r from-orange-50 via-white to-orange-50 p-4 sm:gap-5 sm:rounded-[1.6rem] sm:p-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="inline-flex rounded-full border border-orange-100 bg-white px-4 py-2 text-xs font-black uppercase tracking-wide text-orange-600">
                Featured university spotlight
              </div>

              <h3 className="mt-4 text-3xl font-black leading-tight text-[#071b3a] sm:text-4xl">
                Start with a university spotlight. <span className="text-orange-600">Explore the full directory when ready.</span>
              </h3>

              <p className="mt-3 max-w-2xl text-sm font-semibold leading-6 text-slate-600">
                Review the key facts here, then open the complete university directory and detailed profiles when you want a deeper comparison.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {["Milan", "Rome", "Bologna", "Padua", "Florence", "Turin", "Pisa", "Venice"].map((item) => (
                <Link
                  key={item}
                  to="/universities"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-full border border-orange-100 bg-white px-4 py-2 text-xs font-black text-slate-600 transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-0.5 hover:border-orange-300 hover:text-orange-600 focus:outline-none focus-visible:ring-4 focus:ring-orange-100"
                >
                  {item}
                </Link>
              ))}
            </div>
          </div>

          <div className="mt-5 grid gap-4 sm:mt-6 sm:gap-5 xl:grid-cols-[1.1fr_0.9fr]">
            <FeaturedUniversityCard university={featuredUniversity} />

            <div className="grid gap-5">
              <div className="rounded-[1.6rem] border border-orange-100 bg-white p-4 shadow-sm sm:rounded-[2rem] sm:p-5">
                <div className="inline-flex rounded-full bg-orange-50 px-4 py-2 text-xs font-black uppercase tracking-wide text-orange-600 ring-1 ring-orange-100">
                  Next inside database
                </div>

                <div className="mt-4 grid gap-3">
                  {[secondUniversity, thirdUniversity].filter(Boolean).map((university) => (
                    <article
                      key={university.slug}
                      className="group rounded-[1.25rem] border border-orange-100 bg-[#fff8f1] p-3 transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-1 hover:border-orange-200 hover:bg-white hover:shadow-md sm:rounded-[1.4rem]"
                    >
                      <Link
                        to={`/universities/${university.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3"
                      >
                        <img
                          src={university.image}
                          alt={`${university.name} Italy university`}
                          loading="lazy"
                          decoding="async"
                          className="h-16 w-16 rounded-2xl object-cover"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="line-clamp-1 text-sm font-black text-[#071b3a] group-hover:text-orange-600">
                            {university.name}
                          </p>
                          <p className="mt-1 text-xs font-bold text-slate-500">
                            {university.city} · {university.tuition} · {university.type}
                          </p>
                        </div>
                        <ExternalLink className="h-4 w-4 text-orange-600" />
                      </Link>

                      <div className="mt-3 grid grid-cols-2 gap-2">
                        <Link
                          to={`/universities/${university.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl bg-white px-3 text-[11px] font-black text-[#071b3a] ring-1 ring-orange-100 transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:text-orange-600 hover:ring-orange-300"
                        >
                          View Details
                          <ExternalLink className="h-3.5 w-3.5" />
                        </Link>
                        <a
                          href={buildAppointmentUrl(university.name, "Ask About This University")}
                          className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl bg-orange-600 px-3 text-[11px] font-black text-white shadow-sm shadow-orange-600/20 transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:bg-orange-700"
                        >
                          Ask Zaifan
                          <MessageCircleQuestion className="h-3.5 w-3.5" />
                        </a>
                      </div>
                    </article>
                  ))}
                </div>

                <Link
                  to="/universities"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#071b3a] px-5 py-4 text-sm font-black text-white transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-1 hover:bg-[#092b72]"
                >
                  View All 50 Universities
                  <ExternalLink className="h-4 w-4" />
                </Link>
              </div>

              <div className="rounded-[1.6rem] border border-orange-100 bg-gradient-to-br from-white via-orange-50 to-purple-50 p-4 shadow-sm sm:rounded-[2rem] sm:p-5">
                <div className="flex items-start gap-4">
                  <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-orange-50 text-orange-600">
                    <BookOpenCheck className="h-7 w-7" />
                  </div>
                  <div>
                    <h4 className="text-xl font-black text-[#071b3a]">Dedicated university pages</h4>
                    <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
                      Each university opens into a dedicated profile with clearer context for programs, costs, scholarships, location and student fit.
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-[1.6rem] border border-orange-100 bg-white p-4 shadow-sm sm:rounded-[2rem] sm:p-5">
                <img
                  src={mascotThumbsup}
                  alt="Zaifan university guide"
                  loading="lazy"
                  decoding="async"
                  className="mx-auto h-40 object-contain"
                />
                <a
                  href="/appointment?country=Italy&service=University Shortlist"
                  className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-orange-600 px-5 py-4 text-sm font-black text-white shadow-lg shadow-orange-600/20 transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-1 hover:bg-orange-700"
                >
                  Get Italy Consultation
                  <ArrowRight className="h-4 w-4" />
                </a>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 hidden gap-4 md:grid md:grid-cols-2 lg:grid-cols-4">
          {journeySteps.map((item) => (
            <div
              key={item.title}
              className="group rounded-[1.6rem] border border-orange-100 bg-white/88 p-5 shadow-[0_16px_45px_rgba(15,23,42,0.05)] transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-1 hover:border-orange-200 hover:bg-white hover:shadow-[0_22px_60px_rgba(255,91,18,0.12)]"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="grid h-14 w-14 place-items-center rounded-2xl bg-orange-50 text-orange-600">
                  <item.icon className="h-7 w-7" />
                </div>
                <span className="rounded-full bg-[#fff8f1] px-3 py-1 text-xs font-black text-orange-600 ring-1 ring-orange-100">
                  {item.step}
                </span>
              </div>
              <h4 className="mt-4 text-lg font-black text-[#071b3a]">{item.title}</h4>
              <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">{item.copy}</p>
            </div>
          ))}
        </div>

        <div className="mt-6 hidden overflow-hidden rounded-[2rem] border border-orange-100 bg-white/88 p-5 shadow-[0_20px_60px_rgba(15,23,42,0.07)] md:block">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="inline-flex rounded-full bg-orange-50 px-4 py-2 text-xs font-black uppercase tracking-wide text-orange-600 ring-1 ring-orange-100">
                Country expansion roadmap
              </div>
              <h3 className="mt-3 text-2xl font-black tracking-tight text-[#071b3a] md:text-3xl">
                More countries are visible — but honestly marked coming soon
              </h3>
              <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-600">
                Germany, UK, Canada, Australia and Turkey stay on the website roadmap.
                They should not act like finished university databases until real information is added.
              </p>
            </div>

            <a
              href="/appointment?country=Italy"
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-orange-600 px-6 py-4 text-sm font-black text-white shadow-lg shadow-orange-600/20 transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-1 hover:bg-orange-700 focus:outline-none focus-visible:ring-4 focus:ring-orange-100"
            >
              Start With Italy
              <ArrowRight className="h-4 w-4" />
            </a>
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {comingSoonCountries.map((item) => (
              <article
                key={item.name}
                className="group overflow-hidden rounded-[1.5rem] border border-orange-100 bg-white shadow-sm transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-2 hover:border-orange-200 hover:shadow-[0_24px_55px_rgba(15,23,42,0.12)]"
              >
                <div className="relative h-36 overflow-hidden bg-orange-50">
                  <img
                    src={item.image}
                    alt={`${item.name} coming soon university image`}
                    loading="lazy"
                    decoding="async"
                    className="h-full w-full object-cover opacity-65 grayscale transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-110 group-hover:grayscale-0"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#071b3a]/55 via-[#071b3a]/10 to-transparent" />
                  <div className="absolute left-3 top-3 rounded-full bg-white/95 px-3 py-1 text-xs font-black text-[#071b3a] shadow-md">
                    {item.flag} {item.name}
                  </div>
                  <div className="absolute bottom-3 left-3 rounded-full bg-orange-600 px-3 py-1 text-xs font-black text-white shadow-md">
                    Coming Soon
                  </div>
                </div>

                <div className="p-4">
                  <p className="text-xs font-semibold leading-5 text-slate-600">{item.copy}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function FeaturedUniversityCard({ university }) {
  return (
    <article className="group overflow-hidden rounded-[1.6rem] border border-orange-100 bg-white shadow-[0_24px_70px_rgba(15,23,42,0.10)] transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-2 hover:border-orange-200 hover:shadow-[0_34px_90px_rgba(255,91,18,0.18)] sm:rounded-[1.9rem]">
      <Link
        to={`/universities/${university.slug}`}
        target="_blank"
        rel="noopener noreferrer"
        className="relative block h-[285px] overflow-hidden bg-gradient-to-br from-orange-100 via-white to-emerald-50 sm:h-[330px]"
        aria-label={`Open ${university.name} full university profile in a new tab`}
      >
        <img
          src={university.image}
          alt={`${university.name} Italy university`}
          loading="lazy"
          decoding="async"
          className="h-full w-full object-cover transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#071b3a]/76 via-[#071b3a]/22 to-white/8" />

        <div className="absolute left-4 top-4 rounded-full bg-white/95 px-3 py-1.5 text-xs font-black text-orange-600 shadow-md">
          🇮🇹 Featured University
        </div>

        <div className="absolute right-4 top-4 rounded-full bg-white/95 px-3 py-1.5 text-xs font-black text-[#071b3a] shadow-md">
          {university.rank}
        </div>

        <div className="absolute bottom-5 left-5 right-5">
          <p className="mb-2 inline-flex rounded-full bg-orange-600 px-3 py-1 text-xs font-black text-white shadow-lg">
            {university.city}, {university.region}
          </p>
          <h3 className="text-3xl font-black leading-tight text-white drop-shadow sm:text-4xl">
            {university.name}
          </h3>
          <p className="mt-2 max-w-lg text-sm font-bold leading-6 text-white/90">
            {university.vibe}
          </p>
        </div>
      </Link>

      <div className="p-4 sm:p-5">
        <div className="mb-3 flex flex-wrap gap-2 sm:mb-4">
          <span className="rounded-full bg-green-50 px-3 py-1.5 text-[11px] font-black text-green-700 ring-1 ring-green-100">
            {getTuitionBadge(university.tuitionLevel)}
          </span>
          <span className="rounded-full bg-orange-50 px-3 py-1.5 text-[11px] font-black text-orange-700 ring-1 ring-orange-100">
            {getScholarshipBadge(university.scholarshipStrength)}
          </span>
          <span className="rounded-full bg-purple-50 px-3 py-1.5 text-[11px] font-black text-purple-700 ring-1 ring-purple-100">
            {university.type}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <InfoBox icon={Wallet} label="Tuition" value={university.tuition} />
          <InfoBox icon={BadgePercent} label="Scholarship" value={university.scholarship} />
          <InfoBox icon={GraduationCap} label="Intake" value={university.intake} />
          <InfoBox icon={MapPin} label="City" value={university.city} />
        </div>

        <div className="mt-4 rounded-[1.5rem] bg-[#fff8f1] p-4 ring-1 ring-orange-100">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-orange-600">
            Best For
          </p>
          <p className="mt-2 text-base font-black text-[#071b3a]">
            {university.popularFor}
          </p>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {university.programs.map((program) => (
            <span
              key={program}
              className="rounded-full bg-orange-50 px-3 py-1.5 text-[11px] font-black text-orange-700 ring-1 ring-orange-100"
            >
              {program}
            </span>
          ))}
        </div>

        <div className="mt-4 rounded-[1.35rem] border border-orange-100 bg-white p-3 shadow-sm sm:mt-5 sm:rounded-[1.5rem]">
          <div className="mb-3 flex items-center gap-2 px-1 text-xs font-black uppercase tracking-[0.14em] text-orange-600">
            <Zap className="h-4 w-4 fill-orange-500" />
            Ready to compare this university?
          </div>

          <div className="grid gap-2.5 sm:gap-3 lg:grid-cols-3">
            <Link
              to={`/universities/${university.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#071b3a] px-4 py-4 text-sm font-black text-white shadow-[0_16px_34px_rgba(7,27,58,0.20)] transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-1 hover:bg-[#092b72]"
            >
              View Details
              <ExternalLink className="h-4 w-4" />
            </Link>

            <a
              href={buildAppointmentUrl(university.name, "Ask About This University")}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-4 py-4 text-sm font-black text-[#071b3a] ring-1 ring-orange-100 transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-1 hover:text-orange-600 hover:ring-orange-300"
            >
              Ask About This
              <MessageCircleQuestion className="h-4 w-4" />
            </a>

            <a
              href={buildAppointmentUrl(university.name, "Book Consultation")}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-orange-600 px-4 py-4 text-sm font-black text-white shadow-[0_16px_34px_rgba(234,88,12,0.24)] transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-1 hover:bg-orange-700"
            >
              Book Consultation
              <CalendarCheck2 className="h-4 w-4" />
            </a>
          </div>
        </div>
      </div>
    </article>
  );
}

function InfoBox({ icon: Icon, label, value }) {
  return (
    <div className="rounded-2xl bg-[#fff8f1] p-3 ring-1 ring-orange-100">
      <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-wide text-orange-600">
        <Icon className="h-4 w-4" />
        {label}
      </div>
      <p className="mt-2 text-sm font-black text-[#071b3a]">{value}</p>
    </div>
  );
}