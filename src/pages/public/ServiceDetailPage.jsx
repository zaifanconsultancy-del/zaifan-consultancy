import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  CircleAlert,
  ClipboardCheck,
  Route,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import Footer from "../../components/public/layout/Footer.jsx";
import NotFoundPage from "./NotFoundPage.jsx";
import { findServiceBySlug } from "../../data/servicesData.js";

const MOTION = {
  duration: 0.55,
  ease: [0.22, 1, 0.36, 1],
};

const ACCORDION_MOTION = {
  duration: 0.32,
  ease: MOTION.ease,
};

const INTERACTIVE_TRANSITION =
  "transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      duration: MOTION.duration,
      ease: MOTION.ease,
    },
  },
};

function ServiceDetailPage() {
  const prefersReducedMotion = useReducedMotion();
  const { serviceSlug } = useParams();
  const [openFaq, setOpenFaq] = useState(0);

  const service = findServiceBySlug(serviceSlug);

  if (!service) return <NotFoundPage />;

  const ServiceIcon = service.icon;
  const appointmentHref = `/appointment?country=Italy&service=${encodeURIComponent(
    service.title
  )}`;

  const heroSignals = [
    ["01", "Understand", service.audience?.[0] || "Start with your current profile and goals."],
    ["02", "Plan", service.outcomes?.[0] || "Build a clear route instead of guessing."],
    ["03", "Act", service.outcomes?.[1] || "Leave with practical next steps."],
  ];

  return (
    <>
      <main
        id="service-detail-page"
        className="overflow-hidden bg-[#fff7ee] text-[#071b3a]"
      >
        <style>{`
          @media (prefers-reduced-motion: reduce) {
            #service-detail-page *,
            #service-detail-page *::before,
            #service-detail-page *::after {
              scroll-behavior: auto !important;
              transition-duration: 0.01ms !important;
              animation-duration: 0.01ms !important;
              animation-iteration-count: 1 !important;
            }
          }
        `}</style>
        <section className="relative px-5 pb-16 pt-32">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_16%_20%,rgba(255,91,18,0.14),transparent_30%),radial-gradient(circle_at_86%_10%,rgba(255,190,92,0.16),transparent_28%)]" />

          <div className="relative mx-auto max-w-[1400px]">
            <Link
              to="/services"
              className={`inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-black text-orange-600 ring-1 ring-orange-100 hover:-translate-y-1 hover:bg-orange-50 focus:outline-none focus-visible:ring-4 focus-visible:ring-orange-200 ${INTERACTIVE_TRANSITION}`}
            >
              <ArrowLeft size={15} />
              Back to Services
            </Link>

            <div className="mt-8 grid gap-8 lg:grid-cols-[1.04fr_0.96fr] lg:items-center">
              <motion.div initial="hidden" animate="show" variants={fadeUp}>
                <div className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-orange-600 ring-1 ring-orange-100">
                  <Sparkles size={14} />
                  {service.eyebrow}
                </div>

                <h1 className="mt-5 max-w-4xl text-5xl font-black leading-[0.94] tracking-[-0.06em] sm:text-6xl lg:text-7xl">
                  {service.title}
                </h1>

                <p className="mt-6 max-w-3xl text-lg font-bold leading-8 text-slate-700">
                  {service.hero}
                </p>

                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <Link
                    to={appointmentHref}
                    className={`inline-flex items-center justify-center gap-3 rounded-full bg-orange-600 px-8 py-5 font-black text-white shadow-[0_18px_38px_rgba(234,88,12,0.24)] hover:-translate-y-1 hover:bg-orange-700 focus:outline-none focus-visible:ring-4 focus-visible:ring-orange-200 ${INTERACTIVE_TRANSITION}`}
                  >
                    {service.primaryCta}
                    <ArrowRight size={19} />
                  </Link>

                  <Link
                    to={service.secondaryHref}
                    className={`inline-flex items-center justify-center gap-3 rounded-full bg-white px-8 py-5 font-black text-[#071b3a] ring-1 ring-orange-100 hover:-translate-y-1 hover:bg-orange-50 hover:text-orange-600 focus:outline-none focus-visible:ring-4 focus-visible:ring-orange-200 ${INTERACTIVE_TRANSITION}`}
                  >
                    {service.secondaryCta}
                  </Link>
                </div>

                <div className="mt-7 grid gap-3 sm:grid-cols-3">
                  {heroSignals.map(([number, title, body]) => (
                    <div
                      key={number}
                      className="rounded-[1.35rem] bg-white/88 p-4 shadow-[0_12px_30px_rgba(15,23,42,0.06)] ring-1 ring-orange-100 backdrop-blur"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-[10px] font-black uppercase tracking-[0.16em] text-orange-500">
                          {number}
                        </span>
                        <CheckCircle2 size={16} className="text-orange-500" />
                      </div>
                      <h3 className="mt-2 text-sm font-black text-[#071b3a]">{title}</h3>
                      <p className="mt-1 line-clamp-2 text-xs font-bold leading-5 text-slate-600">
                        {body}
                      </p>
                    </div>
                  ))}
                </div>
              </motion.div>

              <motion.div
                initial="hidden"
                animate="show"
                variants={fadeUp}
                className="group relative overflow-hidden rounded-[2.6rem] bg-[#071b3a] p-7 text-white shadow-[0_30px_90px_rgba(7,27,58,0.2)] ring-1 ring-white/5"
              >
                <div className="pointer-events-none absolute -right-16 -top-16 h-52 w-52 rounded-full border-[34px] border-white/5" />
                <div className="pointer-events-none absolute -bottom-20 -left-14 h-48 w-48 rounded-full bg-orange-500/10 blur-3xl" />

                <div className="relative grid h-16 w-16 place-items-center rounded-2xl bg-orange-600 text-white shadow-lg shadow-orange-600/20 transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-105">
                  <ServiceIcon size={30} />
                </div>

                <p className="mt-6 text-xs font-black uppercase tracking-[0.18em] text-orange-300">
                  What this service solves
                </p>

                <p className="mt-3 text-xl font-black leading-8 text-white">
                  {service.summary}
                </p>

                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  {service.outcomes.slice(0, 4).map((item) => (
                    <div
                      key={item}
                      className="flex items-center gap-3 rounded-2xl bg-white/10 px-4 py-3 text-sm font-bold ring-1 ring-white/10 transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-0.5 hover:bg-white/14"
                    >
                      <CheckCircle2 className="shrink-0 text-orange-300" size={18} />
                      {item}
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        <section className="px-5 py-16">
          <div className="mx-auto max-w-[1350px]">
            <div className="grid gap-6 lg:grid-cols-2">
              <div className="rounded-[2.4rem] bg-white p-7 shadow-[0_22px_65px_rgba(15,23,42,0.08)] ring-1 ring-orange-100">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-orange-600">
                  Who this is for
                </p>

                <div className="mt-5 space-y-3">
                  {service.audience.map((item) => (
                    <div
                      key={item}
                      className="flex gap-3 rounded-2xl bg-[#fff8f1] p-4 text-sm font-bold leading-6 ring-1 ring-orange-100 transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-0.5 hover:bg-white hover:shadow-sm"
                    >
                      <CheckCircle2 className="mt-0.5 shrink-0 text-orange-600" size={18} />
                      {item}
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-[2.4rem] bg-white p-7 shadow-[0_22px_65px_rgba(15,23,42,0.08)] ring-1 ring-orange-100">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-orange-600">
                  What you should leave with
                </p>

                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  {service.outcomes.map((item) => (
                    <div
                      key={item}
                      className="rounded-2xl bg-[#fff8f1] p-4 text-sm font-black ring-1 ring-orange-100 transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-0.5 hover:bg-white hover:shadow-sm"
                    >
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="px-5 py-16">
          <div className="mx-auto max-w-[1350px] rounded-[2.7rem] bg-white p-7 shadow-[0_24px_70px_rgba(15,23,42,0.08)] ring-1 ring-orange-100 md:p-9">
            <div className="mx-auto max-w-4xl text-center">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-orange-600">
                Service-specific framework
              </p>
              <h2 className="mt-4 text-4xl font-black tracking-[-0.05em] md:text-5xl">
                {service.uniqueTitle}
              </h2>
              <p className="mx-auto mt-4 max-w-3xl text-base font-bold leading-8 text-slate-600">
                {service.uniqueIntro}
              </p>
            </div>

            <div className="mt-9 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {service.uniqueCards.map(([title, text], index) => (
                <motion.div
                  key={title}
                  initial="hidden"
                  whileInView="show"
                  viewport={{ once: true, amount: 0.2 }}
                  variants={fadeUp}
                  className="rounded-[1.8rem] bg-[#fff8f1] p-5 ring-1 ring-orange-100 transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-1 hover:bg-white hover:shadow-[0_18px_45px_rgba(15,23,42,0.08)]"
                >
                  <span className="text-xs font-black text-orange-500">
                    0{index + 1}
                  </span>
                  <h3 className="mt-2 text-xl font-black">{title}</h3>
                  <p className="mt-2 text-sm font-bold leading-6 text-slate-600">
                    {text}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-[#071b3a] px-5 py-16 text-white">
          <div className="mx-auto max-w-[1350px]">
            <div className="mx-auto max-w-4xl text-center">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-orange-300">
                How it works
              </p>
              <h2 className="mt-4 text-4xl font-black tracking-[-0.05em] md:text-5xl">
                A structured route instead of random advice.
              </h2>
            </div>

            <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {service.process.map(([title, text], index) => (
                <div
                  key={title}
                  className="rounded-[1.8rem] bg-white/10 p-5 ring-1 ring-white/10 transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-1 hover:bg-white/14"
                >
                  <span className="grid h-10 w-10 place-items-center rounded-full bg-orange-600 text-sm font-black">
                    {index + 1}
                  </span>
                  <h3 className="mt-4 text-xl font-black">{title}</h3>
                  <p className="mt-2 text-sm font-semibold leading-6 text-white/70">
                    {text}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="px-5 py-16">
          <div className="mx-auto grid max-w-[1350px] gap-6 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="rounded-[2.4rem] bg-orange-50 p-7 ring-1 ring-orange-100">
              <ClipboardCheck className="text-orange-600" size={30} />
              <h2 className="mt-4 text-3xl font-black">Prepare before the call.</h2>
              <p className="mt-3 text-sm font-bold leading-7 text-slate-600">
                You do not need everything complete, but these details make the discussion more useful.
              </p>

              <div className="mt-5 space-y-3">
                {service.checklist.map((item) => (
                  <div
                    key={item}
                    className="flex gap-3 rounded-2xl bg-white p-4 text-sm font-bold ring-1 ring-orange-100 transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-0.5 hover:shadow-sm"
                  >
                    <CheckCircle2 className="mt-0.5 shrink-0 text-orange-600" size={18} />
                    {item}
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[2.4rem] bg-white p-7 shadow-[0_22px_65px_rgba(15,23,42,0.08)] ring-1 ring-orange-100">
              <div className="flex items-center gap-3">
                <ShieldCheck className="text-orange-600" />
                <h2 className="text-3xl font-black">Clear expectations.</h2>
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <div className="rounded-[1.8rem] bg-emerald-50 p-5 ring-1 ring-emerald-100">
                  <CheckCircle2 className="text-emerald-600" />
                  <h3 className="mt-3 text-xl font-black">What Zaifan does</h3>
                  <p className="mt-2 text-sm font-bold leading-6 text-slate-700">
                    Provides planning, comparison, organization and guidance based on your situation.
                  </p>
                </div>

                <div className="rounded-[1.8rem] bg-orange-50 p-5 ring-1 ring-orange-100">
                  <CircleAlert className="text-orange-600" />
                  <h3 className="mt-3 text-xl font-black">What Zaifan does not promise</h3>
                  <p className="mt-2 text-sm font-bold leading-6 text-slate-700">
                    Guaranteed admission, guaranteed scholarship, guaranteed visa or invented shortcuts.
                  </p>
                </div>
              </div>

              <div className="mt-5 rounded-[1.8rem] bg-[#071b3a] p-5 text-white">
                <Route className="text-orange-300" />
                <h3 className="mt-3 text-xl font-black">Connected ecosystem</h3>
                <p className="mt-2 text-sm font-semibold leading-6 text-white/70">
                  This service connects naturally with the Italy guide, universities, scholarships and appointment journey.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="px-5 pb-20">
          <div className="mx-auto max-w-[1050px]">
            <div className="text-center">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-orange-600">
                FAQs
              </p>
              <h2 className="mt-3 text-4xl font-black tracking-[-0.05em]">
                Questions before choosing this service.
              </h2>
            </div>

            <div className="mt-8 space-y-3">
              {service.faqs.map(([question, answer], index) => {
                const isOpen = openFaq === index;

                return (
                  <div
                    key={question}
                    className="overflow-hidden rounded-[1.5rem] bg-white ring-1 ring-orange-100"
                  >
                    <button
                      type="button"
                      onClick={() => setOpenFaq(isOpen ? -1 : index)}
                      className="flex w-full items-center justify-between gap-4 px-5 py-5 text-left font-black transition-colors duration-300 hover:bg-orange-50/70 focus:outline-none focus-visible:ring-4 focus-visible:ring-inset focus-visible:ring-orange-200"
                    >
                      <span>{question}</span>
                      <ChevronDown
                        className={`shrink-0 text-orange-600 transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                          isOpen ? "rotate-180" : ""
                        }`}
                      />
                    </button>

                    <AnimatePresence initial={false}>
                      {isOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={
                            prefersReducedMotion
                              ? { duration: 0 }
                              : ACCORDION_MOTION
                          }
                          className="overflow-hidden"
                        >
                          <p className="px-5 pb-5 text-sm font-bold leading-7 text-slate-600">
                            {answer}
                          </p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>

            <div className="relative mt-8 overflow-hidden rounded-[2.4rem] bg-gradient-to-r from-orange-600 via-[#ff4b12] to-orange-500 p-7 text-center text-white shadow-[0_24px_60px_rgba(234,88,12,0.24)]">
              <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full border-[26px] border-white/10" />
              <h2 className="text-3xl font-black">Ready to plan your next step?</h2>
              <p className="mx-auto mt-3 max-w-2xl text-sm font-semibold leading-7 text-white/85">
                Book the service with your current profile and goals so the consultation starts with context.
              </p>
              <Link
                to={appointmentHref}
                className={`mt-6 inline-flex items-center gap-3 rounded-full bg-[#071b3a] px-8 py-4 font-black text-white hover:-translate-y-1 hover:bg-[#0b2a58] focus:outline-none focus-visible:ring-4 focus-visible:ring-white/30 ${INTERACTIVE_TRANSITION}`}
              >
                {service.primaryCta}
                <ArrowRight size={18} />
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}

export default ServiceDetailPage;
