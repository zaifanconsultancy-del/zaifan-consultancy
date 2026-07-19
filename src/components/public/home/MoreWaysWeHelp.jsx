import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  BadgeDollarSign,
  BookOpenCheck,
  FileCheck2,
  GraduationCap,
  Headphones,
  Pause,
  Play,
  ShieldCheck,
  Users,
  MessageCircle,
} from "lucide-react";

import mascotImage from "../../../assets/images/services/zaifan-services-mascot.png";
import scholarshipsImage from "../../../assets/images/services/scholarships.png";
import applicationImage from "../../../assets/images/services/application.png";
import visaImage from "../../../assets/images/services/visa.png";
import accommodationImage from "../../../assets/images/services/accommodation.png";
import testPreparationImage from "../../../assets/images/services/test-preparation.png";
import careerImage from "../../../assets/images/services/career.png";

const MOTION = {
  duration: 0.55,
  ease: [0.22, 1, 0.36, 1],
};

const services = [
  {
    title: "University Selection",
    desc: "Compare Italian universities by course fit, city, tuition, scholarship route and application readiness.",
    image: accommodationImage,
    link: "/services/university-selection",
    accent: "#ff4b12",
    soft: "bg-orange-50",
    icon: GraduationCap,
    wins: ["Profile shortlist", "City comparison", "Course fit"],
  },
  {
    title: "Scholarship Guidance",
    desc: "Explore DSU, regional funding, merit routes and scholarship-document planning through the dedicated hub.",
    image: scholarshipsImage,
    link: "/scholarships",
    accent: "#10b981",
    soft: "bg-emerald-50",
    icon: BadgeDollarSign,
    wins: ["DSU routes", "Regional funding", "Cost planning"],
  },
  {
    title: "Admission Guidance",
    desc: "Turn requirements, deadlines, applications and university portals into one clear admission roadmap.",
    image: testPreparationImage,
    link: "/services/admission-guidance",
    accent: "#2563eb",
    soft: "bg-blue-50",
    icon: FileCheck2,
    wins: ["Deadline map", "Requirements", "Application plan"],
  },
  {
    title: "SOP & Documentation",
    desc: "Organize SOP, CV, academic records, translations and supporting files before deadlines create pressure.",
    image: applicationImage,
    link: "/services/sop-documentation",
    accent: "#f97316",
    soft: "bg-orange-50",
    icon: BookOpenCheck,
    wins: ["SOP direction", "Document audit", "File structure"],
  },
  {
    title: "Visa Guidance",
    desc: "Understand the Italy student visa direction, financial proof, appointment preparation and file readiness.",
    image: visaImage,
    link: "/services/visa-guidance",
    accent: "#0ea5e9",
    soft: "bg-sky-50",
    icon: ShieldCheck,
    wins: ["Visa checklist", "Financial proof", "Readiness review"],
  },
  {
    title: "Free Consultation",
    desc: "Start with a profile review and find the right next step before committing to a deeper service.",
    image: careerImage,
    link: "/services/free-consultation",
    accent: "#071f50",
    soft: "bg-blue-50",
    icon: MessageCircle,
    wins: ["Profile review", "Next-step clarity", "Service direction"],
  },
];

const trustItems = [
  {
    title: "Real Service Pages",
    desc: "Explore the service before you are asked to book it.",
    icon: Users,
    color: "text-orange-600 bg-orange-50",
  },
  {
    title: "Italy-First Guidance",
    desc: "Every service connects back to the live Italy ecosystem.",
    icon: GraduationCap,
    color: "text-[#071f50] bg-blue-50",
  },
  {
    title: "Trust & Transparency",
    desc: "No fake guarantees for admission, funding or visas.",
    icon: ShieldCheck,
    color: "text-emerald-600 bg-emerald-50",
  },
  {
    title: "Connected Support",
    desc: "University, scholarship, admission, documents and visa planning work together.",
    icon: Headphones,
    color: "text-orange-600 bg-orange-50",
  },
];

const AUTOPLAY_DELAY = 6200;
const SWIPE_THRESHOLD = 44;

export default function MoreWaysWeHelp() {
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState("next");
  const [isPaused, setIsPaused] = useState(false);
  const [touchStartX, setTouchStartX] = useState(null);

  const visibleServices = useMemo(
    () => [0, 1, 2].map((offset) => services[(index + offset) % services.length]),
    [index]
  );

  const activeService = services[index];

  const changeSlide = (dir = "next") => {
    setDirection(dir);
    setIndex((prev) =>
      dir === "next"
        ? (prev + 1) % services.length
        : (prev - 1 + services.length) % services.length
    );
  };

  const goToSlide = (targetIndex) => {
    if (targetIndex === index) return;
    setDirection(targetIndex > index ? "next" : "prev");
    setIndex(targetIndex);
  };

  const nextSlide = () => changeSlide("next");
  const prevSlide = () => changeSlide("prev");

  useEffect(() => {
    if (isPaused) return undefined;

    const timer = window.setInterval(() => {
      setDirection("next");
      setIndex((prev) => (prev + 1) % services.length);
    }, AUTOPLAY_DELAY);

    return () => window.clearInterval(timer);
  }, [isPaused]);

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

        @keyframes serviceProgress {
          0% { transform: scaleX(0); }
          100% { transform: scaleX(1); }
        }

        .zaifan-trail {
          animation: zaifanTrailMove 10s linear infinite;
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
          .service-progress {
            animation: none !important;
          }
        }
      `}</style>

      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-x-0 top-0 h-72 bg-gradient-to-b from-white/80 to-transparent" />

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
            opacity="0.55"
          />
          <path
            className="zaifan-trail"
            d="M160 310 C330 120 470 315 650 210 C850 90 960 310 1125 185 C1260 80 1345 105 1440 150"
            stroke="#fed7aa"
            strokeWidth="3"
            strokeDasharray="12 16"
            strokeLinecap="round"
            opacity="0.8"
          />
        </svg>
      </div>

      <div className="relative mx-auto max-w-[1460px] px-5 sm:px-8 lg:px-24">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: MOTION.duration, ease: MOTION.ease }}
          className="mx-auto max-w-5xl text-center"
        >
          <div className="mx-auto mb-5 inline-flex items-center gap-2 rounded-full border border-orange-200 bg-white px-6 py-2 text-xs font-black uppercase tracking-[0.28em] text-orange-600 shadow-sm sm:text-sm">
            <span>✈</span>
            Explore the support before you book
          </div>

          <h2 className="text-4xl font-black tracking-tight text-[#071f50] sm:text-6xl lg:text-7xl">
            More Ways{" "}
            <span className="text-orange-600">
              We Help Students
            </span>
          </h2>

          <p className="mx-auto mt-5 max-w-3xl text-lg font-semibold leading-8 text-slate-700 sm:text-xl">
            Six real service routes. Each one now leads to useful guidance instead of sending you straight to a booking form.
          </p>

          <div className="mx-auto mt-5 flex w-fit items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-black text-slate-500 shadow-sm ring-1 ring-orange-100">
            {isPaused ? (
              <Pause className="h-3.5 w-3.5 text-orange-600" />
            ) : (
              <Play className="h-3.5 w-3.5 text-orange-600" />
            )}
            {isPaused ? "Carousel paused" : `Showing ${activeService.title}`}
          </div>
        </motion.div>

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
          className="absolute left-5 top-[58%] z-40 hidden h-14 w-14 items-center justify-center rounded-full bg-orange-500 text-white shadow-xl transition duration-300 hover:-translate-y-1 hover:bg-[#071f50] focus:outline-none focus:ring-4 focus:ring-orange-200 lg:flex"
          aria-label="Previous service"
        >
          <ArrowLeft size={25} />
        </button>

        <button
          type="button"
          onClick={nextSlide}
          className="absolute right-5 top-[58%] z-40 hidden h-14 w-14 items-center justify-center rounded-full bg-white text-orange-500 shadow-xl transition duration-300 hover:-translate-y-1 hover:bg-orange-500 hover:text-white focus:outline-none focus:ring-4 focus:ring-orange-200 lg:flex"
          aria-label="Next service"
        >
          <ArrowRight size={25} />
        </button>

        <div className="relative z-20">
          <div className="mx-auto hidden max-w-[1280px] overflow-hidden lg:block">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={index}
                initial={{
                  opacity: 0,
                  x: direction === "next" ? 56 : -56,
                  scale: 0.99,
                }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{
                  opacity: 0,
                  x: direction === "next" ? -56 : 56,
                  scale: 0.99,
                }}
                transition={{
                  duration: MOTION.duration,
                  ease: MOTION.ease,
                }}
                className="grid grid-cols-3 gap-6"
              >
                {visibleServices.map((service) => (
                  <ServiceCard key={service.title} service={service} />
                ))}
              </motion.div>
            </AnimatePresence>
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

              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={index}
                  initial={{
                    opacity: 0,
                    x: direction === "next" ? 36 : -36,
                  }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{
                    opacity: 0,
                    x: direction === "next" ? -36 : 36,
                  }}
                  transition={{
                    duration: MOTION.duration,
                    ease: MOTION.ease,
                  }}
                  className="flex-1"
                >
                  <Link
                    to={services[index].link}
                    className="group flex min-h-[430px] flex-col items-center justify-center rounded-[30px] border border-orange-100 bg-white p-7 text-center shadow-[0_24px_60px_rgba(251,146,60,0.20)] transition duration-300 hover:-translate-y-1 focus:outline-none focus:ring-4 focus:ring-orange-100"
                  >
                    <div
                      className={`mb-4 grid h-12 w-12 place-items-center rounded-2xl ${services[index].soft}`}
                      style={{ color: services[index].accent }}
                    >
                      {React.createElement(services[index].icon, { size: 23 })}
                    </div>

                    <img
                      src={services[index].image}
                      alt={services[index].title}
                      className="mb-5 h-[180px] w-full object-contain transition duration-300 group-hover:scale-105"
                    />

                    <h3 className="text-2xl font-black leading-tight text-[#071f50]">
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
                      Explore Service
                      <ArrowRight size={18} />
                    </div>
                  </Link>
                </motion.div>
              </AnimatePresence>

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
                className={`service-progress h-full rounded-full ${
                  isPaused ? "service-progress-paused" : ""
                }`}
                style={{ backgroundColor: activeService.accent }}
              />
            </div>

            <div className="flex justify-center gap-2">
              {services.map((service, dotIndex) => (
                <button
                  key={service.title}
                  type="button"
                  onClick={() => goToSlide(dotIndex)}
                  className="h-3 rounded-full transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-orange-100"
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

        <div className="relative z-20 mx-auto mt-12 grid max-w-7xl gap-5 rounded-[34px] border border-orange-100 bg-white p-6 shadow-[0_18px_55px_rgba(251,146,60,0.12)] md:grid-cols-2 lg:grid-cols-4">
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
                  <Icon size={32} />
                </div>

                <div>
                  <h4 className="font-black text-[#071f50]">{item.title}</h4>
                  <p className="mt-1 text-sm font-semibold leading-5 text-slate-600">
                    {item.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-8 flex justify-center">
          <Link
            to="/services"
            className="inline-flex items-center gap-3 rounded-full bg-[#071f50] px-8 py-4 font-black text-white transition duration-300 hover:-translate-y-1 hover:bg-orange-600"
          >
            Explore Full Services Hub
            <ArrowRight size={18} />
          </Link>
        </div>
      </div>
    </section>
  );
}

function ServiceCard({ service }) {
  const Icon = service.icon;

  return (
    <Link
      to={service.link}
      className="group grid min-h-[290px] grid-cols-[43%_57%] items-center overflow-hidden rounded-[30px] border border-orange-100 bg-white p-6 shadow-[0_28px_70px_rgba(251,146,60,0.18)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_34px_90px_rgba(251,146,60,0.30)] focus:outline-none focus:ring-4 focus:ring-orange-100"
    >
      <div className="relative flex items-center justify-center">
        <div className={`absolute inset-2 rounded-full ${service.soft} blur-2xl`} />

        <img
          src={service.image}
          alt={service.title}
          className={`relative z-10 w-full object-contain transition duration-300 group-hover:scale-105 ${
  service.title === "Admission Guidance"
    ? "h-[225px] scale-[1.18]"
    : "h-[185px]"
}`}
        />
      </div>

      <div className="min-w-0 pl-3">
        <div
          className={`mb-3 grid h-10 w-10 place-items-center rounded-xl ${service.soft}`}
          style={{ color: service.accent }}
        >
          <Icon size={20} />
        </div>

        <h3 className="max-w-[245px] break-words text-[25px] font-black leading-[1.15] text-[#071f50] xl:text-[27px]">
          {service.title}
        </h3>

        <p className="mt-4 max-w-[250px] text-[15px] font-semibold leading-7 text-slate-600">
          {service.desc}
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          {service.wins.slice(0, 2).map((win) => (
            <span
              key={win}
              className="rounded-full bg-orange-50 px-3 py-1 text-[10px] font-black text-orange-700"
            >
              {win}
            </span>
          ))}
        </div>

        <div
          className="mt-5 inline-flex items-center gap-2 rounded-full px-4 py-3 text-sm font-black text-white shadow-sm transition duration-300 group-hover:gap-3"
          style={{ backgroundColor: service.accent }}
        >
          Explore Service
          <ArrowRight size={18} />
        </div>
      </div>
    </Link>
  );
}
