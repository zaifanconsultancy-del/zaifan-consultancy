import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowRight,
  CheckCircle2,
  CircleAlert,
  Compass,
  Lightbulb,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import { serviceCatalog } from "../../data/servicesData";

const MOTION = {
  duration: 0.55,
  ease: [0.22, 1, 0.36, 1],
};

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: MOTION.duration, ease: MOTION.ease },
  },
};

const compareRows = serviceCatalog.map((service) => [
  service.title,
  service.summary,
  `/services/${service.slug}`,
]);

export default function ServicesPage() {
  return (
    <main className="overflow-hidden bg-[#fff7ee] text-[#071b3a]">
      <section className="relative px-5 pb-16 pt-32">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_14%_18%,rgba(255,91,18,0.15),transparent_30%),radial-gradient(circle_at_88%_12%,rgba(255,190,92,0.18),transparent_28%)]" />

        <div className="relative mx-auto max-w-[1450px]">
          <div className="grid gap-8 lg:grid-cols-[1.04fr_0.96fr] lg:items-center">
            <motion.div initial="hidden" animate="show" variants={fadeUp}>
              <div className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2 text-xs font-black uppercase tracking-[0.18em] text-orange-600 ring-1 ring-orange-100">
                <Sparkles size={15} />
                Zaifan Service Ecosystem
              </div>

              <h1 className="mt-6 max-w-5xl text-5xl font-black leading-[0.92] tracking-[-0.065em] sm:text-6xl lg:text-7xl">
                Six service paths.{" "}
                <span className="text-orange-600">Six proper destinations.</span>
              </h1>

              <p className="mt-6 max-w-3xl text-lg font-bold leading-8 text-slate-700">
                Explore the service first, understand what it solves, then book only when the route makes sense for your current stage.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  to="/services/free-consultation"
                  className="inline-flex items-center justify-center gap-3 rounded-full bg-orange-600 px-8 py-5 font-black text-white transition duration-300 hover:-translate-y-1 hover:bg-orange-700"
                >
                  Find My Next Step
                  <ArrowRight size={18} />
                </Link>

                <Link
                  to="/countries/italy"
                  className="inline-flex items-center justify-center gap-3 rounded-full bg-white px-8 py-5 font-black text-[#071b3a] ring-1 ring-orange-100 transition duration-300 hover:-translate-y-1 hover:text-orange-600"
                >
                  Explore Italy Guide
                </Link>
              </div>
            </motion.div>

            <motion.div
              initial="hidden"
              animate="show"
              variants={fadeUp}
              className="rounded-[2.7rem] bg-[#071b3a] p-7 text-white shadow-[0_32px_90px_rgba(7,27,58,0.22)]"
            >
              <p className="text-xs font-black uppercase tracking-[0.18em] text-orange-300">
                The new structure
              </p>
              <h2 className="mt-3 text-4xl font-black tracking-[-0.05em]">
                Every card leads somewhere useful.
              </h2>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {[
                  ["01", "Explore", "Understand the service before booking"],
                  ["02", "Compare", "See what problem the route actually solves"],
                  ["03", "Prepare", "Know what information or documents help"],
                  ["04", "Book", "Move into consultation with context"],
                ].map(([number, title, text]) => (
                  <div key={title} className="rounded-[1.6rem] bg-white/10 p-4 ring-1 ring-white/10">
                    <span className="text-xs font-black text-orange-300">{number}</span>
                    <h3 className="mt-2 text-xl font-black">{title}</h3>
                    <p className="mt-1 text-sm font-semibold leading-6 text-white/70">{text}</p>
                  </div>
                ))}
              </div>

              <div className="mt-5 rounded-[1.6rem] bg-white p-5 text-[#071b3a]">
                <Lightbulb className="text-orange-600" />
                <p className="mt-3 text-sm font-black leading-6">
                  Scholarship Guidance now has a service page for planning context and still links deeper into the full Scholarship Hub.
                </p>
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
              {serviceCatalog.map((service) => {
                const Icon = service.icon;

                return (
                  <motion.article
                    key={service.slug}
                    initial="hidden"
                    whileInView="show"
                    viewport={{ once: true, amount: 0.15 }}
                    variants={fadeUp}
                    className="group rounded-[2.2rem] bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.07)] ring-1 ring-orange-100 transition duration-300 hover:-translate-y-1 hover:shadow-[0_28px_80px_rgba(255,91,18,0.14)]"
                  >
                    <div className="grid h-14 w-14 place-items-center rounded-2xl bg-orange-600 text-white">
                      <Icon size={26} />
                    </div>

                    <p className="mt-5 text-[10px] font-black uppercase tracking-[0.16em] text-orange-600">
                      {service.eyebrow}
                    </p>

                    <h3 className="mt-2 text-2xl font-black">{service.title}</h3>

                    <p className="mt-3 text-sm font-bold leading-7 text-slate-600">
                      {service.summary}
                    </p>

                    <Link
                      to={`/services/${service.slug}`}
                      className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#071b3a] px-5 py-4 text-sm font-black text-white transition duration-300 hover:-translate-y-1 hover:bg-orange-600"
                    >
                      Explore {service.shortTitle}
                      <ArrowRight size={16} />
                    </Link>
                  </motion.article>
                );
              })}
            </div>
          </section>

          <section className="mt-14 rounded-[2.6rem] bg-white p-6 shadow-[0_24px_70px_rgba(15,23,42,0.08)] ring-1 ring-orange-100 md:p-8">
            <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">
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
                    className="grid gap-2 border-b border-orange-100 bg-[#fffaf5] px-5 py-4 transition duration-300 last:border-0 hover:bg-white sm:grid-cols-[0.8fr_1.4fr_auto] sm:items-center"
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
              <h2 className="mt-4 text-3xl font-black">What this ecosystem should do.</h2>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {[
                  "Explain the student’s current stage",
                  "Show what the service actually includes",
                  "Connect to the right Italy ecosystem pages",
                  "Move naturally toward consultation",
                  "Avoid fake guarantees",
                  "Give useful information before booking",
                ].map((item) => (
                  <div key={item} className="flex gap-3 rounded-2xl bg-white p-4 text-sm font-bold ring-1 ring-emerald-100">
                    <CheckCircle2 className="mt-0.5 shrink-0 text-emerald-600" size={18} />
                    {item}
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[2.4rem] bg-orange-50 p-7 ring-1 ring-orange-100">
              <CircleAlert className="text-orange-600" size={28} />
              <h2 className="mt-4 text-3xl font-black">What we should never do.</h2>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {[
                  "Send every card straight to booking",
                  "Pretend every service is the same",
                  "Promise admission, scholarship or visa outcomes",
                  "Hide important preparation requirements",
                  "Use dead or fake service pages",
                  "Create shallow pages with no student value",
                ].map((item) => (
                  <div key={item} className="flex gap-3 rounded-2xl bg-white p-4 text-sm font-bold ring-1 ring-orange-100">
                    <CircleAlert className="mt-0.5 shrink-0 text-orange-600" size={18} />
                    {item}
                  </div>
                ))}
              </div>
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
                className="inline-flex items-center justify-center gap-3 rounded-full bg-orange-600 px-8 py-5 font-black text-white transition duration-300 hover:-translate-y-1"
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
