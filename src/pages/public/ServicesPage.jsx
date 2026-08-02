import { Link } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  CheckCircle2,
  CircleAlert,
  Compass,
  Lightbulb,
  Route,
  ShieldCheck,
  Sparkles,
  Target,
  Zap,
} from "lucide-react";

import { serviceCatalog } from "../../data/servicesData";

const MOTION = {
  duration: 0.55,
  ease: [0.22, 1, 0.36, 1],
};

const INTERACTIVE_TRANSITION =
  "transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: MOTION.duration, ease: MOTION.ease },
  },
};


const serviceVisuals = [
  {
    code: "START",
    label: "Best first step",
    tone: "navy",
  },
  {
    code: "UNI",
    label: "University direction",
    tone: "orange",
  },
  {
    code: "FUND",
    label: "Funding route",
    tone: "cream",
  },
  {
    code: "DOCS",
    label: "Application preparation",
    tone: "cream",
  },
  {
    code: "VISA",
    label: "Visa planning",
    tone: "cream",
  },
  {
    code: "ARRIVE",
    label: "Pre-departure support",
    tone: "cream",
  },
];

const compareRows = serviceCatalog.map((service) => [
  service.title,
  service.summary,
  `/services/${service.slug}`,
]);

const journeySteps = [
  {
    icon: Compass,
    number: "01",
    title: "Understand",
    text: "Start with the problem you are trying to solve.",
  },
  {
    icon: Target,
    number: "02",
    title: "Choose",
    text: "Open the service page that matches your current stage.",
  },
  {
    icon: Route,
    number: "03",
    title: "Prepare",
    text: "Know what details or documents make the guidance useful.",
  },
  {
    icon: Zap,
    number: "04",
    title: "Move",
    text: "Book only when you are ready for a clear next step.",
  },
];

const decisionPrompts = [
  {
    eyebrow: "I am completely unsure",
    title: "Start with Free Consultation",
    href: "/services/free-consultation",
  },
  {
    eyebrow: "I need university direction",
    title: "Open University Selection",
    href: "/services/university-selection",
  },
  {
    eyebrow: "I need funding guidance",
    title: "Open Scholarship Guidance",
    href: "/services/scholarship-guidance",
  },
];

export default function ServicesPage() {
  const prefersReducedMotion = useReducedMotion();
  const motionViewport = prefersReducedMotion
    ? { once: true, amount: 0 }
    : { once: true, amount: 0.15 };

  return (
    <main
      id="services-page"
      className="overflow-hidden bg-[#fff7ee] text-[#071b3a]"
    >
      <style>{`
        @media (prefers-reduced-motion: reduce) {
          #services-page *,
          #services-page *::before,
          #services-page *::after {
            scroll-behavior: auto !important;
            transition-duration: 0.01ms !important;
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
          }
        }
      `}</style>
      <section className="relative overflow-hidden px-5 pb-18 pt-32">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_14%_18%,rgba(255,91,18,0.16),transparent_30%),radial-gradient(circle_at_88%_12%,rgba(255,190,92,0.18),transparent_28%),linear-gradient(180deg,rgba(255,255,255,0.45),rgba(255,247,238,0))]" />
        <div className="pointer-events-none absolute -left-24 top-24 h-72 w-72 rounded-full bg-orange-200/35 blur-3xl" />
        <div className="pointer-events-none absolute -right-24 top-40 h-80 w-80 rounded-full bg-[#071b3a]/8 blur-3xl" />

        <div className="relative mx-auto max-w-[1450px]">
          <div className="grid gap-10 xl:grid-cols-[0.92fr_1.08fr] xl:items-center">
            <motion.div initial="hidden" animate="show" variants={fadeUp}>
              <div className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2 text-xs font-black uppercase tracking-[0.18em] text-orange-600 ring-1 ring-orange-100">
                <Sparkles size={15} />
                Zaifan Service Ecosystem
              </div>

              <h1 className="mt-6 max-w-[820px] text-5xl font-black leading-[0.91] tracking-[-0.068em] sm:text-6xl lg:text-7xl xl:text-[82px]">
                Six service paths.{" "}
                <span className="text-orange-600">Six proper destinations.</span>
              </h1>

              <p className="mt-6 max-w-3xl text-lg font-bold leading-8 text-slate-700">
                Explore the service first, understand what it solves, then book only when the route makes sense for your current stage.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  to="/services/free-consultation"
                  className={`inline-flex items-center justify-center gap-3 rounded-full bg-orange-600 px-8 py-5 font-black text-white shadow-[0_18px_40px_rgba(234,88,12,0.24)] hover:-translate-y-1 hover:bg-orange-700 focus:outline-none focus-visible:ring-4 focus-visible:ring-orange-200 ${INTERACTIVE_TRANSITION}`}
                >
                  Find My Next Step
                  <ArrowRight size={18} />
                </Link>

                <Link
                  to="/countries/italy"
                  className={`inline-flex items-center justify-center gap-3 rounded-full bg-white px-8 py-5 font-black text-[#071b3a] ring-1 ring-orange-100 hover:-translate-y-1 hover:bg-orange-50 hover:text-orange-600 focus:outline-none focus-visible:ring-4 focus-visible:ring-orange-200 ${INTERACTIVE_TRANSITION}`}
                >
                  Explore Italy Guide
                </Link>
              </div>
            </motion.div>

            <motion.div
              initial="hidden"
              animate="show"
              variants={fadeUp}
              className="relative overflow-hidden rounded-[2.8rem] bg-[linear-gradient(145deg,#ff5a12_0%,#ff8d49_28%,#071b3a_72%)] p-[3px] text-white shadow-[0_38px_105px_rgba(7,27,58,0.24)]"
            >
              <div className="rounded-[2.62rem] bg-[#071b3a]/96 p-7 backdrop-blur-xl">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-orange-300">
                The new structure
              </p>
              <h2 className="mt-3 text-4xl font-black tracking-[-0.05em]">
                Every card leads somewhere useful.
              </h2>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {journeySteps.map((step) => {
                  const Icon = step.icon;

                  return (
                    <div
                      key={step.title}
                      className="group rounded-[1.6rem] bg-white/10 p-4 ring-1 ring-white/10 transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-1 hover:bg-white/14"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="grid h-10 w-10 place-items-center rounded-2xl bg-white/10 text-orange-300">
                          <Icon size={19} />
                        </div>
                        <span className="text-xs font-black text-orange-300">{step.number}</span>
                      </div>
                      <h3 className="mt-3 text-xl font-black">{step.title}</h3>
                      <p className="mt-1 text-sm font-semibold leading-6 text-white/70">{step.text}</p>
                    </div>
                  );
                })}
              </div>

              <div className="mt-5 rounded-[1.6rem] bg-white p-5 text-[#071b3a]">
                <Lightbulb className="text-orange-600" />
                <p className="mt-3 text-sm font-black leading-6">
                  Scholarship Guidance now has a service page for planning context and still links deeper into the full Scholarship Hub.
                </p>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2">
                {[
                  ["6", "Service paths"],
                  ["1", "Italy ecosystem"],
                  ["0", "Fake promises"],
                ].map(([value, label]) => (
                  <div
                    key={label}
                    className="rounded-2xl bg-white/10 px-3 py-3 text-center ring-1 ring-white/10"
                  >
                    <p className="text-xl font-black text-white">{value}</p>
                    <p className="mt-1 text-[9px] font-black uppercase tracking-[0.12em] text-orange-200">
                      {label}
                    </p>
                  </div>
                ))}
              </div>
              </div>
            </motion.div>
          </div>

          <section className="mt-12">
            <div className="mx-auto max-w-4xl text-center">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-orange-600">
                Service library
              </p>
              <h2 className="mt-4 text-4xl font-black tracking-[-0.05em] md:text-5xl">
                Explore the support before you book it.
              </h2>
            </div>

            <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {serviceCatalog.map((service, index) => {
                const Icon = service.icon;
                const visual = serviceVisuals[index] || serviceVisuals[serviceVisuals.length - 1];
                const isFeatured = index === 0;
                const isSecondary = index === 1;

                return (
                  <motion.article
                    key={service.slug}
                    initial="hidden"
                    whileInView="show"
                    viewport={motionViewport}
                    variants={fadeUp}
                    className={`group relative overflow-hidden rounded-[2.2rem] p-6 shadow-[0_20px_60px_rgba(15,23,42,0.07)] ring-1 transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-1 hover:shadow-[0_28px_80px_rgba(255,91,18,0.14)] ${
                      isFeatured
                        ? "bg-[#071b3a] text-white ring-[#071b3a] xl:col-span-2"
                        : isSecondary
                          ? "bg-orange-600 text-white ring-orange-600"
                          : "bg-white text-[#071b3a] ring-orange-100"
                    }`}
                  >
                    <div className="absolute right-5 top-4 text-7xl font-black tracking-[-0.08em] opacity-[0.06]">
                      0{index + 1}
                    </div>

                    <div className="relative">
                      <div className="flex items-center justify-between gap-3">
                        <div className={`grid h-14 w-14 place-items-center rounded-2xl ${
                          isFeatured || isSecondary
                            ? "bg-white/12 text-orange-200 ring-1 ring-white/10"
                            : "bg-orange-600 text-white"
                        }`}>
                          <Icon size={26} />
                        </div>
                        <span className={`rounded-full px-3 py-1 text-[9px] font-black uppercase tracking-[0.14em] ${
                          isFeatured || isSecondary
                            ? "bg-white/10 text-white ring-1 ring-white/10"
                            : "bg-orange-50 text-orange-700 ring-1 ring-orange-100"
                        }`}>
                          {visual.code}
                        </span>
                      </div>

                    <p className={`mt-5 text-[10px] font-black uppercase tracking-[0.16em] ${
                      isFeatured || isSecondary ? "text-orange-200" : "text-orange-600"
                    }`}>
                      {service.eyebrow}
                    </p>

                    <h3 className="mt-2 text-2xl font-black">{service.title}</h3>

                    <p className={`mt-3 max-w-2xl text-sm font-bold leading-7 ${
                      isFeatured || isSecondary ? "text-white/72" : "text-slate-600"
                    }`}>
                      {service.summary}
                    </p>

                    <div className="mt-4 flex flex-wrap gap-2">
                      {service.outcomes?.slice(0, 2).map((outcome) => (
                        <span
                          key={outcome}
                          className={`rounded-full px-3 py-1.5 text-[10px] font-black ring-1 ${
                            isFeatured || isSecondary
                              ? "bg-white/10 text-white ring-white/10"
                              : "bg-[#fff5ed] text-orange-700 ring-orange-100"
                          }`}
                        >
                          {outcome}
                        </span>
                      ))}
                    </div>

                    <Link
                      to={`/services/${service.slug}`}
                      className={`mt-6 inline-flex w-full items-center justify-center gap-2 rounded-2xl px-5 py-4 text-sm font-black focus:outline-none focus-visible:ring-4 focus-visible:ring-orange-200 ${
                        isFeatured || isSecondary
                          ? "bg-white text-[#071b3a] hover:-translate-y-1 hover:bg-orange-50"
                          : "bg-[#071b3a] text-white hover:-translate-y-1 hover:bg-orange-600"
                      } ${INTERACTIVE_TRANSITION}`}
                    >
                      Explore {service.shortTitle}
                      <ArrowRight size={16} />
                    </Link>
                    </div>
                  </motion.article>
                );
              })}
            </div>
          </section>

          <section className="mt-16 overflow-hidden rounded-[2.7rem] bg-white p-6 shadow-[0_28px_85px_rgba(15,23,42,0.10)] ring-1 ring-orange-100 md:p-8">
            <div className="grid gap-8 xl:grid-cols-[0.72fr_1.28fr]">
              <div>
                <Compass className="text-orange-600" size={32} />
                <p className="mt-4 text-xs font-black uppercase tracking-[0.18em] text-orange-600">
                  Which service do I need?
                </p>
                <h2 className="mt-3 text-4xl font-black tracking-[-0.05em]">
                  Start with the problem, not the service name.
                </h2>
              </div>

              <div className="overflow-hidden rounded-[1.8rem] ring-1 ring-orange-100">
                {compareRows.map(([name, problem, href]) => (
                  <Link
                    key={name}
                    to={href}
                    className="grid gap-2 border-b border-orange-100 bg-[#fffaf5] px-5 py-4 transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] last:border-0 hover:bg-white hover:pl-6 focus:outline-none focus-visible:ring-4 focus-visible:ring-inset focus-visible:ring-orange-200 sm:grid-cols-[0.8fr_1.4fr_auto] sm:items-center"
                  >
                    <span className="font-black">{name}</span>
                    <span className="text-sm font-bold text-slate-600">{problem}</span>
                    <ArrowRight className="text-orange-600" size={17} />
                  </Link>
                ))}
              </div>
            </div>
          </section>

          <section className="mt-14 grid gap-5 lg:grid-cols-2">
            <div className="rounded-[2.4rem] bg-emerald-50 p-7 ring-1 ring-emerald-100">
              <CheckCircle2 className="text-emerald-600" size={28} />
              <p className="mt-4 text-[10px] font-black uppercase tracking-[0.16em] text-emerald-700">What Zaifan believes</p>
              <h2 className="mt-2 text-3xl font-black">Guidance should make the next step clearer.</h2>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {[
                  "Explain the student’s current stage",
                  "Show what the service actually includes",
                  "Connect to the right Italy ecosystem pages",
                  "Move naturally toward consultation",
                  "Avoid fake guarantees",
                  "Give useful information before booking",
                ].map((item) => (
                  <div key={item} className="flex gap-3 rounded-2xl bg-white p-4 text-sm font-bold ring-1 ring-emerald-100 transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-0.5 hover:shadow-sm">
                    <CheckCircle2 className="mt-0.5 shrink-0 text-emerald-600" size={18} />
                    {item}
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[2.4rem] bg-orange-50 p-7 ring-1 ring-orange-100">
              <CircleAlert className="text-orange-600" size={28} />
              <p className="mt-4 text-[10px] font-black uppercase tracking-[0.16em] text-orange-700">What Zaifan avoids</p>
              <h2 className="mt-2 text-3xl font-black">No shortcuts, fake promises or empty service pages.</h2>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {[
                  "Send every card straight to booking",
                  "Pretend every service is the same",
                  "Promise admission, scholarship or visa outcomes",
                  "Hide important preparation requirements",
                  "Use dead or fake service pages",
                  "Create shallow pages with no student value",
                ].map((item) => (
                  <div key={item} className="flex gap-3 rounded-2xl bg-white p-4 text-sm font-bold ring-1 ring-orange-100 transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-0.5 hover:shadow-sm">
                    <CircleAlert className="mt-0.5 shrink-0 text-orange-600" size={18} />
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="mt-14">
            <div className="mx-auto max-w-4xl text-center">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-orange-600">
                Quick decision helper
              </p>
              <h2 className="mt-3 text-4xl font-black tracking-[-0.05em]">
                Not sure where to start? Pick the sentence that sounds like you.
              </h2>
            </div>

            <div className="mt-7 grid gap-4 md:grid-cols-3">
              {decisionPrompts.map((item, index) => (
                <Link
                  key={item.title}
                  to={item.href}
                  className={`group rounded-[2rem] p-5 shadow-[0_18px_50px_rgba(15,23,42,0.06)] ring-1 hover:-translate-y-1 hover:shadow-[0_24px_60px_rgba(255,91,18,0.12)] focus:outline-none focus-visible:ring-4 focus-visible:ring-orange-200 ${
                    index === 0
                      ? "bg-[#071b3a] text-white ring-[#071b3a]"
                      : index === 1
                        ? "bg-orange-600 text-white ring-orange-600"
                        : "bg-white text-[#071b3a] ring-orange-100"
                  } ${INTERACTIVE_TRANSITION}`}
                >
                  <p className={`text-[10px] font-black uppercase tracking-[0.16em] ${
                    index < 2 ? "text-orange-200" : "text-orange-600"
                  }`}>
                    {item.eyebrow}
                  </p>
                  <div className="mt-3 flex items-center justify-between gap-4">
                    <h3 className={`text-lg font-black ${index < 2 ? "text-white" : "text-[#071b3a]"}`}>
                      {item.title}
                    </h3>
                    <ArrowRight
                      size={18}
                      className={`shrink-0 transition-transform duration-300 group-hover:translate-x-1 ${
                        index < 2 ? "text-orange-200" : "text-orange-600"
                      }`}
                    />
                  </div>
                </Link>
              ))}
            </div>
          </section>

          <section className="mt-14 rounded-[2.6rem] bg-[#071b3a] p-7 text-white">
            <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
              <div>
                <div className="flex items-center gap-3">
                  <ShieldCheck className="text-orange-300" />
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-orange-300">
                    Still unsure?
                  </p>
                </div>

                <h2 className="mt-3 text-4xl font-black tracking-[-0.05em]">
                  Start with the free consultation service page.
                </h2>
              </div>

              <Link
                to="/services/free-consultation"
                className={`inline-flex items-center justify-center gap-3 rounded-full bg-orange-600 px-8 py-5 font-black text-white shadow-[0_18px_40px_rgba(234,88,12,0.22)] hover:-translate-y-1 hover:bg-orange-700 focus:outline-none focus-visible:ring-4 focus-visible:ring-orange-200 ${INTERACTIVE_TRANSITION}`}
              >
                Explore Free Consultation
                <ArrowRight size={18} />
              </Link>
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}
