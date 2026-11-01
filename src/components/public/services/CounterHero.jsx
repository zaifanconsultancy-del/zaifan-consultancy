import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowDown, ArrowLeft, ArrowRight, CalendarCheck, Check, ChevronRight } from "lucide-react";

import { COUNTERS, appointmentHref, counterLabel } from "./serviceMeta";

function scrollTo(id) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

/** Service page hero: the counter's overhead screen, what it solves, and a way to the next counter. */
function CounterHero({ service }) {
  const index = COUNTERS.findIndex((item) => item.slug === service.slug);
  const previous = COUNTERS[(index - 1 + COUNTERS.length) % COUNTERS.length];
  const next = COUNTERS[(index + 1) % COUNTERS.length];

  return (
    <section className="relative overflow-hidden bg-[#fff7ed] px-4 pb-16 pt-28 text-[#071f50] sm:px-5 md:pb-24 md:pt-36">
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -right-6 top-16 select-none font-mono text-[16rem] font-black leading-none tracking-[-0.08em] text-[#071f50]/[0.04] md:text-[24rem]"
      >
        {String(service.counter).padStart(2, "0")}
      </span>

      <div className="relative mx-auto grid max-w-[1350px] items-center gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
        <div>
          <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1.5 text-xs font-black text-[#7a879c]">
            <Link to="/services" className="hover:text-[#ff4b12]">
              Services
            </Link>
            <ChevronRight size={13} />
            <span className="text-[#071f50]">{service.title}</span>
          </nav>

          <div className="mt-5 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-2 rounded-full bg-[#071f50] px-3.5 py-2 font-mono text-[11px] font-black uppercase tracking-[0.16em] text-white">
              <service.icon size={14} className="text-[#ffb36d]" /> {counterLabel(service)} · {service.code}
            </span>
            <span className="rounded-full bg-white px-3.5 py-2 text-[11px] font-black uppercase tracking-[0.12em] text-[#ff4b12] ring-1 ring-orange-100">
              {service.eyebrow}
            </span>
          </div>

          <h1 className="mt-6 text-[3rem] font-black leading-[0.9] tracking-[-0.065em] sm:text-7xl xl:text-[5.4rem]">{service.title}</h1>
          <p className="mt-5 max-w-xl text-lg font-semibold leading-8 text-[#5f6f89]">{service.hero}</p>

          <p className="mt-6 inline-flex max-w-xl items-start gap-3 rounded-2xl bg-white px-4 py-3 text-sm font-bold leading-6 ring-1 ring-orange-100">
            <span className="shrink-0 font-mono text-[10px] font-black uppercase leading-6 tracking-[0.14em] text-[#ff4b12]">Sounds like</span>
            &ldquo;{service.problem}&rdquo;
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              to={appointmentHref(service)}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-[#ff4b12] px-7 py-4 font-black text-white shadow-[0_18px_40px_rgba(255,75,18,0.28)] transition hover:-translate-y-0.5 hover:bg-[#ff642f]"
            >
              <CalendarCheck size={18} /> {service.primaryCta}
            </Link>
            <button
              type="button"
              onClick={() => scrollTo("fit")}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-7 py-4 font-black ring-1 ring-orange-100 transition hover:-translate-y-0.5 hover:text-[#ff4b12]"
            >
              Is this for me? <ArrowDown size={18} strokeWidth={3} />
            </button>
          </div>
        </div>

        {/* Overhead screen + the ticket you get */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="relative mx-auto w-full max-w-[540px]"
        >
          <div className="rounded-[28px] bg-[#071f50] p-5 text-white shadow-[0_34px_70px_rgba(7,31,80,0.3)] sm:p-6">
            <div className="flex items-center justify-between font-mono text-[10px] font-black uppercase tracking-[0.18em] text-white/50">
              <span>{counterLabel(service)}</span>
              <span className="flex items-center gap-1.5 text-emerald-300">
                <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" /> First call free
              </span>
            </div>
            <p className="mt-3 font-mono text-5xl font-black tracking-[0.06em] text-[#ffb36d] sm:text-6xl">{service.code}</p>
            <p className="mt-1 text-lg font-black">{service.shortTitle}</p>
          </div>

          <div aria-hidden="true" className="mx-auto flex w-1/2 justify-between">
            <span className="h-5 w-1 bg-[#071f50]/20" />
            <span className="h-5 w-1 bg-[#071f50]/20" />
          </div>

          <div className="relative rotate-[1.5deg] rounded-[22px] bg-white p-5 shadow-[0_26px_55px_rgba(7,31,80,0.16)] ring-1 ring-[#071f50]/5 sm:p-6">
            <p className="font-mono text-[10px] font-black uppercase tracking-[0.16em] text-[#7a879c]">You walk away with</p>
            <ul className="mt-3 grid gap-2.5">
              {service.outcomes.slice(0, 4).map((outcome) => (
                <li key={outcome} className="flex items-start gap-2.5 text-sm font-black leading-6">
                  <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-emerald-500 text-white">
                    <Check size={12} strokeWidth={4} />
                  </span>
                  {outcome}
                </li>
              ))}
            </ul>
            <div className="my-4 border-t-2 border-dashed border-[#071f50]/10" />
            <p className="text-xs font-bold leading-5 text-[#5f6f89]">
              {service.process.length} steps · bring {service.checklist.length} things · first conversation free
            </p>
          </div>

          <div className="mt-6 flex items-center justify-between gap-3 text-xs font-black">
            <Link to={`/services/${previous.slug}`} className="inline-flex items-center gap-1.5 rounded-full bg-white px-3.5 py-2.5 ring-1 ring-orange-100 transition hover:text-[#ff4b12]">
              <ArrowLeft size={14} strokeWidth={3} /> {counterLabel(previous)}
            </Link>
            <Link to={`/services/${next.slug}`} className="inline-flex items-center gap-1.5 rounded-full bg-white px-3.5 py-2.5 ring-1 ring-orange-100 transition hover:text-[#ff4b12]">
              {counterLabel(next)} <ArrowRight size={14} strokeWidth={3} />
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

export default CounterHero;
