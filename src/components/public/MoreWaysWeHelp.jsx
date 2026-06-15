import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Users,
  Globe2,
  ShieldCheck,
  Headphones,
  Pause,
  Play,
} from "lucide-react";

import mascotImage from "../../assets/images/services/zaifan-services-mascot.png";
import scholarshipsImage from "../../assets/images/services/scholarships.png";
import applicationImage from "../../assets/images/services/application.png";
import visaImage from "../../assets/images/services/visa.png";
import accommodationImage from "../../assets/images/services/accommodation.png";
import testImage from "../../assets/images/services/test-preparation.png";
import careerImage from "../../assets/images/services/career.png";

const services = [
  {
    title: "Scholarships & Funding",
    desc: "We help you discover funding opportunities and reduce study costs.",
    image: scholarshipsImage,
    link: "/scholarships",
    newTab: true,
    accent: "#a855f7",
    soft: "bg-purple-50",
    wins: ["Funding routes", "Profile fit", "Cost planning"],
  },
  {
    title: "Application Support",
    desc: "Expert guidance for applications, documents, and admissions.",
    image: applicationImage,
    link: "/application-support",
    accent: "#f97316",
    soft: "bg-orange-50",
    wins: ["Document review", "Application checks", "Deadline support"],
  },
  {
    title: "Visa Assistance",
    desc: "Complete visa guidance from preparation to approval.",
    image: visaImage,
    link: "/visa-assistance",
    accent: "#2563eb",
    soft: "bg-blue-50",
    wins: ["Visa checklist", "Interview prep", "File guidance"],
  },
  {
    title: "Student Housing",
    desc: "Find safe and comfortable housing before you arrive.",
    image: accommodationImage,
    link: "/accommodation",
    accent: "#22c55e",
    soft: "bg-green-50",
    wins: ["Safe options", "Arrival planning", "Budget support"],
  },
  {
    title: "Test Preparation",
    desc: "Support for IELTS, PTE and other language requirements.",
    image: testImage,
    link: "/test-preparation",
    accent: "#6366f1",
    soft: "bg-indigo-50",
    wins: ["IELTS route", "PTE support", "Score planning"],
  },
  {
    title: "Career Advice",
    desc: "Build skills and prepare for opportunities after graduation.",
    image: careerImage,
    link: "/career-advice",
    accent: "#d97706",
    soft: "bg-amber-50",
    wins: ["Career map", "Skill planning", "Future goals"],
  },
];

const trustItems = [
  {
    title: "Expert Guidance",
    desc: "Years of experience helping students succeed.",
    icon: Users,
    color: "text-purple-500 bg-purple-50",
  },
  {
    title: "Global Network",
    desc: "Strong university partnerships worldwide.",
    icon: Globe2,
    color: "text-blue-500 bg-blue-50",
  },
  {
    title: "Trust & Transparency",
    desc: "Honest advice. No hidden surprises.",
    icon: ShieldCheck,
    color: "text-green-500 bg-green-50",
  },
  {
    title: "End-to-End Support",
    desc: "We're with you at every step of your journey.",
    icon: Headphones,
    color: "text-pink-500 bg-pink-50",
  },
];

const AUTOPLAY_DELAY = 6200;
const SWIPE_THRESHOLD = 44;

function buildServiceLink(service) {
  if (service.link) return service.link;

  const serviceParam = encodeURIComponent(
    service.title.toLowerCase().replace(/&/g, "and").replace(/\s+/g, "-")
  );

  return `/appointment?service=${serviceParam}`;
}

function getLinkProps(service) {
  if (!service.newTab) return {};

  return {
    target: "_blank",
    rel: "noopener noreferrer",
  };
}

export default function MoreWaysWeHelp() {
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState("idle");
  const [direction, setDirection] = useState("next");
  const [isPaused, setIsPaused] = useState(false);
  const [touchStartX, setTouchStartX] = useState(null);
  const timeoutRef = useRef(null);

  const visibleServices = useMemo(() => {
    return [0, 1, 2].map((offset) => services[(index + offset) % services.length]);
  }, [index]);

  const activeService = services[index];

  const clearSlideTimeout = () => {
    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  const changeSlide = (dir = "next") => {
    if (phase !== "idle") return;

    clearSlideTimeout();
    setDirection(dir);
    setPhase("leave");

    timeoutRef.current = window.setTimeout(() => {
      setIndex((prev) => {
        if (dir === "next") return (prev + 1) % services.length;
        return (prev - 1 + services.length) % services.length;
      });

      setPhase("enter");

      window.requestAnimationFrame(() => {
        timeoutRef.current = window.setTimeout(() => setPhase("idle"), 40);
      });
    }, 320);
  };

  const goToSlide = (targetIndex) => {
    if (targetIndex === index || phase !== "idle") return;

    clearSlideTimeout();
    setDirection(targetIndex > index ? "next" : "prev");
    setPhase("leave");

    timeoutRef.current = window.setTimeout(() => {
      setIndex(targetIndex);
      setPhase("enter");

      window.requestAnimationFrame(() => {
        timeoutRef.current = window.setTimeout(() => setPhase("idle"), 40);
      });
    }, 320);
  };

  const nextSlide = () => changeSlide("next");
  const prevSlide = () => changeSlide("prev");

  useEffect(() => {
    if (isPaused || phase !== "idle") return undefined;

    const timer = window.setInterval(() => {
      changeSlide("next");
    }, AUTOPLAY_DELAY);

    return () => window.clearInterval(timer);
  }, [isPaused, phase]);

  useEffect(() => {
    return () => clearSlideTimeout();
  }, []);

  const handleTouchStart = (event) => {
    setTouchStartX(event.touches[0].clientX);
  };

  const handleTouchEnd = (event) => {
    if (touchStartX === null) return;

    const touchEndX = event.changedTouches[0].clientX;
    const difference = touchStartX - touchEndX;

    if (Math.abs(difference) > SWIPE_THRESHOLD) {
      if (difference > 0) nextSlide();
      else prevSlide();
    }

    setTouchStartX(null);
  };

  const slideClass =
    phase === "leave"
      ? direction === "next"
        ? "-translate-x-12 opacity-0"
        : "translate-x-12 opacity-0"
      : phase === "enter"
      ? direction === "next"
        ? "translate-x-12 opacity-0"
        : "-translate-x-12 opacity-0"
      : "translate-x-0 opacity-100";

  return (
    <section
      id="more-help"
      className="relative overflow-hidden bg-[#fff7ed] py-20 sm:py-24"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocus={() => setIsPaused(true)}
      onBlur={() => setIsPaused(false)}
    >
      <style>{`
        @keyframes zaifanTrailMove {
          0% { stroke-dashoffset: 0; }
          100% { stroke-dashoffset: -170; }
        }

        @keyframes zaifanFloat {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-14px) rotate(3deg); }
        }

        @keyframes serviceProgress {
          0% { transform: scaleX(0); }
          100% { transform: scaleX(1); }
        }

        .zaifan-trail {
          animation: zaifanTrailMove 10s linear infinite;
        }

        .zaifan-float {
          animation: zaifanFloat 5s ease-in-out infinite;
        }

        .service-progress {
          transform-origin: left;
          animation: serviceProgress ${AUTOPLAY_DELAY}ms linear infinite;
          animation-play-state: running;
        }

        .service-progress-paused {
          animation-play-state: paused;
        }

        @media (prefers-reduced-motion: reduce) {
          .zaifan-trail,
          .zaifan-float,
          .service-progress {
            animation: none !important;
          }
        }
      `}</style>

      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-x-0 top-0 h-72 bg-gradient-to-b from-white/80 to-transparent" />

        <div className="zaifan-float absolute left-[5%] top-36 text-7xl drop-shadow-sm sm:text-8xl">
          🛫
        </div>

        <div className="zaifan-float absolute right-[8%] top-40 text-6xl opacity-80 sm:text-7xl">
          ☁️
        </div>

        <div className="zaifan-float absolute left-[18%] top-[270px] text-5xl opacity-70">
          ☁️
        </div>

        <div className="absolute right-[20%] top-[300px] text-4xl opacity-80">
          🎓
        </div>

        <div className="absolute right-[9%] top-[350px] text-4xl opacity-80">
          📍
        </div>

        <svg
          className="absolute left-0 top-[250px] h-[360px] w-full"
          viewBox="0 0 1440 360"
          fill="none"
          preserveAspectRatio="none"
        >
          <path
            className="zaifan-trail"
            d="M80 120 C260 290 400 90 565 170 C760 265 865 40 1030 130 C1205 225 1245 135 1390 180"
            stroke="#fb923c"
            strokeWidth="3"
            strokeDasharray="12 16"
            strokeLinecap="round"
            opacity="0.68"
          />
          <path
            className="zaifan-trail"
            d="M160 310 C330 120 470 315 650 210 C850 90 960 310 1125 185 C1260 80 1345 105 1440 150"
            stroke="#fed7aa"
            strokeWidth="3"
            strokeDasharray="12 16"
            strokeLinecap="round"
            opacity="0.9"
          />
        </svg>

        <div className="absolute left-[24%] top-[335px] text-3xl text-orange-400">
          ✦
        </div>
        <div className="absolute right-[28%] top-[450px] text-4xl text-orange-400">
          ✦
        </div>
        <div className="absolute right-[11%] top-[310px] text-3xl text-orange-400">
          ✦
        </div>
      </div>

      <div className="relative mx-auto max-w-[1460px] px-5 sm:px-8 lg:px-24">
        <div className="mx-auto max-w-5xl text-center">
          <div className="mx-auto mb-5 inline-flex items-center gap-2 rounded-full border border-orange-200 bg-white/90 px-6 py-2 text-xs font-black uppercase tracking-[0.28em] text-orange-600 shadow-sm sm:text-sm">
            <span>✈</span>
            Explore. Compare. Choose your future.
          </div>

          <h2 className="text-4xl font-black tracking-tight text-[#2d145f] sm:text-6xl lg:text-7xl">
            More Ways{" "}
            <span className="bg-gradient-to-r from-orange-500 to-orange-700 bg-clip-text text-transparent">
              We Help Students
            </span>
          </h2>

          <p className="mx-auto mt-5 max-w-3xl text-lg font-semibold leading-8 text-slate-700 sm:text-xl">
            From your first application to your{" "}
            <span className="font-black text-orange-600">first day abroad</span>,
            we&apos;re here to guide every step of your journey.
          </p>

          <div className="mx-auto mt-5 flex w-fit items-center gap-2 rounded-full bg-white/85 px-4 py-2 text-xs font-black text-slate-500 shadow-sm ring-1 ring-orange-100">
            {isPaused ? <Pause className="h-3.5 w-3.5 text-orange-600" /> : <Play className="h-3.5 w-3.5 text-orange-600" />}
            {isPaused ? "Carousel paused" : `Showing ${activeService.title}`}
          </div>
        </div>

        <div className="relative mx-auto -mb-8 mt-6 flex justify-center sm:-mb-12 lg:-mb-16">
          <img
            src={mascotImage}
            alt="Zaifan student mascot"
            className="relative z-10 h-[280px] w-auto object-contain sm:h-[360px] lg:h-[430px]"
          />
        </div>

        <button
          type="button"
          onClick={prevSlide}
          className="absolute left-5 top-[58%] z-40 hidden h-14 w-14 items-center justify-center rounded-full bg-orange-500 text-white shadow-xl transition hover:scale-110 hover:bg-[#2d145f] focus:outline-none focus:ring-4 focus:ring-orange-200 lg:flex"
          aria-label="Previous service"
        >
          <ArrowLeft size={25} />
        </button>

        <button
          type="button"
          onClick={nextSlide}
          className="absolute right-5 top-[58%] z-40 hidden h-14 w-14 items-center justify-center rounded-full bg-white text-orange-500 shadow-xl transition hover:scale-110 hover:bg-orange-500 hover:text-white focus:outline-none focus:ring-4 focus:ring-orange-200 lg:flex"
          aria-label="Next service"
        >
          <ArrowRight size={25} />
        </button>

        <div className="relative z-20">
          <div className="mx-auto hidden max-w-[1280px] overflow-hidden lg:block">
            <div
              className={`grid grid-cols-3 gap-6 transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${slideClass}`}
            >
              {visibleServices.map((service) => (
                <ServiceCard key={service.title} service={service} />
              ))}
            </div>
          </div>

          <div
            className="lg:hidden"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={prevSlide}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-orange-500 shadow-lg focus:outline-none focus:ring-4 focus:ring-orange-100"
                aria-label="Previous service"
              >
                <ArrowLeft size={20} />
              </button>

              <a
                href={buildServiceLink(services[index])}
                {...getLinkProps(services[index])}
                className="group flex min-h-[430px] flex-1 flex-col items-center justify-center rounded-[30px] border border-orange-100 bg-white p-7 text-center shadow-[0_24px_60px_rgba(251,146,60,0.20)] transition hover:-translate-y-1 focus:outline-none focus:ring-4 focus:ring-orange-100"
              >
                <img
                  src={services[index].image}
                  alt={services[index].title}
                  className="mb-5 h-[180px] w-full object-contain transition duration-500 group-hover:scale-105"
                />

                <h3 className="text-2xl font-black leading-tight text-[#2d145f]">
                  {services[index].title}
                </h3>

                <p className="mx-auto mt-4 max-w-xs text-base font-semibold leading-7 text-slate-600">
                  {services[index].desc}
                </p>

                <div className="mt-5 flex flex-wrap justify-center gap-2">
                  {services[index].wins.map((win) => (
                    <span
                      key={win}
                      className="rounded-full bg-orange-50 px-3 py-1.5 text-[11px] font-black text-orange-700"
                    >
                      {win}
                    </span>
                  ))}
                </div>

                <div
                  className="mx-auto mt-7 inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-black text-white"
                  style={{ backgroundColor: services[index].accent }}
                >
                  Open Details
                  <ArrowRight size={18} />
                </div>
              </a>

              <button
                type="button"
                onClick={nextSlide}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-orange-500 shadow-lg focus:outline-none focus:ring-4 focus:ring-orange-100"
                aria-label="Next service"
              >
                <ArrowRight size={20} />
              </button>
            </div>
          </div>

          <div className="mx-auto mt-6 max-w-md">
            <div className="mb-4 h-1.5 overflow-hidden rounded-full bg-orange-100">
              <div
                key={`${index}-${isPaused}`}
                className={`service-progress h-full rounded-full ${isPaused ? "service-progress-paused" : ""}`}
                style={{ backgroundColor: activeService.accent }}
              />
            </div>

            <div className="flex justify-center gap-2">
              {services.map((service, dotIndex) => (
                <button
                  key={service.title}
                  type="button"
                  onClick={() => goToSlide(dotIndex)}
                  className="h-3 rounded-full transition-all focus:outline-none focus:ring-4 focus:ring-orange-100"
                  style={{
                    width: dotIndex === index ? "36px" : "12px",
                    backgroundColor:
                      dotIndex === index ? service.accent : "#fed7aa",
                  }}
                  aria-label={`Go to ${service.title}`}
                  aria-current={dotIndex === index ? "true" : undefined}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="relative z-20 mx-auto mt-12 grid max-w-7xl gap-5 rounded-[34px] border border-orange-100 bg-white/75 p-6 shadow-[0_18px_55px_rgba(251,146,60,0.12)] backdrop-blur md:grid-cols-2 lg:grid-cols-4">
          {trustItems.map((item) => {
            const Icon = item.icon;

            return (
              <div
                key={item.title}
                className="group flex items-center gap-4 border-orange-100 transition duration-300 hover:-translate-y-1 lg:border-r lg:last:border-r-0"
              >
                <div
                  className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl ${item.color} transition duration-300 group-hover:scale-105`}
                >
                  <Icon size={34} />
                </div>

                <div>
                  <h4 className="font-black text-[#3b1d73]">{item.title}</h4>
                  <p className="mt-1 text-sm font-semibold leading-5 text-slate-600">
                    {item.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function ServiceCard({ service }) {
  return (
    <a
      href={buildServiceLink(service)}
      {...getLinkProps(service)}
      className="group grid min-h-[270px] grid-cols-[43%_57%] items-center overflow-hidden rounded-[30px] border border-orange-100 bg-white/95 p-6 shadow-[0_28px_70px_rgba(251,146,60,0.18)] backdrop-blur transition duration-500 hover:-translate-y-2 hover:shadow-[0_34px_90px_rgba(251,146,60,0.30)] focus:outline-none focus:ring-4 focus:ring-orange-100"
    >
      <div className="relative flex items-center justify-center">
        <div className={`absolute inset-2 rounded-full ${service.soft} blur-2xl`} />
        <img
          src={service.image}
          alt={service.title}
          className="relative z-10 h-[185px] w-full object-contain transition duration-500 group-hover:scale-110"
        />
      </div>

      <div className="min-w-0 pl-3">
        <h3 className="max-w-[245px] break-words text-[25px] font-black leading-[1.15] text-[#2d145f] xl:text-[27px]">
          {service.title}
        </h3>

        <p className="mt-4 max-w-[250px] text-[15px] font-semibold leading-7 text-slate-600">
          {service.desc}
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          {service.wins.slice(0, 2).map((win) => (
            <span
              key={win}
              className="rounded-full bg-orange-50 px-3 py-1 text-[10px] font-black text-orange-700 opacity-0 transition duration-300 group-hover:opacity-100 group-focus:opacity-100"
            >
              {win}
            </span>
          ))}
        </div>

        <div
          className="mt-5 inline-flex items-center gap-2 rounded-full px-4 py-3 text-sm font-black text-white shadow-sm transition group-hover:scale-105"
          style={{ backgroundColor: service.accent }}
        >
          {service.newTab ? "Open Details" : "Book Guidance"}
          <ArrowRight size={18} />
        </div>
      </div>
    </a>
  );
}
