import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowUpRight, CalendarCheck, Check, Luggage } from "lucide-react";

import StepIntro from "../guide/StepIntro";
import { COUNTERS, HUB_STEPS, appointmentHref, counterLabel } from "./serviceMeta";

/** One check-in desk: an overhead screen with the counter number, and the desk under it. */
function Desk({ service, active, onSelect }) {
  return (
    <button
      type="button"
      onClick={() => onSelect(service.slug)}
      aria-pressed={active}
      className="group flex w-full flex-col items-stretch text-left"
    >
      {/* Overhead screen */}
      <span
        className={`relative rounded-xl px-3 py-2.5 font-mono ring-1 transition ${
          active ? "bg-[#ff4b12] text-white ring-[#ff4b12]" : "bg-black/35 text-[#ffb36d] ring-white/10 group-hover:bg-black/50"
        }`}
      >
        <span className="block text-[10px] font-black uppercase tracking-[0.18em] opacity-70">{counterLabel(service)}</span>
        <span className="block text-lg font-black tracking-[0.1em]">{service.code}</span>
      </span>
      {/* Hanging poles */}
      <span aria-hidden="true" className="mx-auto flex w-1/2 justify-between">
        <span className="h-3 w-0.5 bg-white/20" />
        <span className="h-3 w-0.5 bg-white/20" />
      </span>
      {/* Desk */}
      <span
        className={`flex min-h-[92px] flex-col justify-between rounded-t-[18px] rounded-b-md px-3 pb-3 pt-3 transition ${
          active ? "bg-white text-[#071f50]" : "bg-white/[0.07] text-white group-hover:bg-white/[0.12]"
        }`}
      >
        <service.icon size={20} className={active ? "text-[#ff4b12]" : "text-[#ffb36d]"} />
        <span className="mt-2 text-sm font-black leading-tight">{service.shortTitle}</span>
      </span>
      <span aria-hidden="true" className={`h-1.5 rounded-b-md ${active ? "bg-[#ff4b12]" : "bg-white/10"}`} />
    </button>
  );
}

/** Step 1 of the hub: the six counters side by side, with a quick look at the chosen one. */
function CounterHall({ selected, onSelect }) {
  const service = COUNTERS.find((item) => item.slug === selected) || COUNTERS[0];

  return (
    <section id="counters" className="scroll-mt-20 bg-[#071f50] px-4 pb-20 pt-10 text-white sm:px-5 md:pb-28 md:pt-14">
      <div className="mx-auto max-w-[1350px]">
        <StepIntro
          steps={HUB_STEPS}
          step={1}
          tone="navy"
          title="Six counters."
          accent="Each one solves one problem."
          text="Every counter is a different kind of help. You can use one, a few, or all six."
          howTo="Tap a counter to see what you get there, how it goes and what to bring. Open the counter for the full page."
        />

        <div className="mt-12 grid grid-cols-3 gap-3 md:grid-cols-6 md:gap-4">
          {COUNTERS.map((item) => (
            <Desk key={item.slug} service={item} active={item.slug === service.slug} onSelect={onSelect} />
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.article
            key={service.slug}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.28 }}
            className="mt-6 grid gap-6 rounded-[30px] bg-white p-6 text-[#071f50] md:p-8 lg:grid-cols-[1fr_1.1fr] lg:gap-10"
          >
            <div className="flex flex-col">
              <p className="font-mono text-[11px] font-black uppercase tracking-[0.16em] text-[#ff4b12]">
                {counterLabel(service)} · {service.eyebrow}
              </p>
              <h3 className="mt-2 text-3xl font-black leading-tight tracking-[-0.05em] md:text-4xl">{service.title}</h3>
              <p className="mt-3 text-base font-semibold leading-7 text-[#5f6f89]">{service.summary}</p>

              <div className="mt-6 rounded-2xl bg-[#fff7ed] p-4 ring-1 ring-orange-100">
                <p className="flex items-center gap-2 font-mono text-[10px] font-black uppercase tracking-[0.16em] text-[#7a879c]">
                  <Luggage size={14} className="text-[#ff4b12]" /> Bring to this counter
                </p>
                <p className="mt-2 text-sm font-bold leading-6">{service.checklist.join(" · ")}</p>
              </div>

              <div className="mt-auto flex flex-col gap-2.5 pt-6 sm:flex-row">
                <Link
                  to={`/services/${service.slug}`}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-[#071f50] px-5 py-3.5 text-sm font-black text-white transition hover:bg-[#ff4b12]"
                >
                  Open {counterLabel(service)} <ArrowUpRight size={16} strokeWidth={3} />
                </Link>
                <Link
                  to={appointmentHref(service)}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-[#fff1ea] px-5 py-3.5 text-sm font-black text-[#ff4b12] transition hover:bg-[#ffe1d1]"
                >
                  <CalendarCheck size={16} /> {service.primaryCta}
                </Link>
              </div>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:gap-8">
              <div>
                <p className="font-mono text-[10px] font-black uppercase tracking-[0.16em] text-[#7a879c]">You walk away with</p>
                <ul className="mt-3 grid gap-2.5">
                  {service.outcomes.map((outcome) => (
                    <li key={outcome} className="flex items-start gap-2.5 text-sm font-bold leading-6">
                      <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-emerald-500 text-white">
                        <Check size={12} strokeWidth={4} />
                      </span>
                      {outcome}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="font-mono text-[10px] font-black uppercase tracking-[0.16em] text-[#7a879c]">How it goes</p>
                <ol className="mt-3 grid gap-0">
                  {service.process.map(([title, text], index) => (
                    <li key={title} className="relative flex gap-3 pb-4 last:pb-0">
                      {index < service.process.length - 1 && (
                        <span aria-hidden="true" className="absolute left-[13px] top-7 h-[calc(100%-1.5rem)] w-0.5 bg-orange-100" />
                      )}
                      <span className="relative grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[#ff4b12] font-mono text-[11px] font-black text-white">
                        {index + 1}
                      </span>
                      <span>
                        <span className="block text-sm font-black">{title}</span>
                        <span className="block text-xs font-semibold leading-5 text-[#5f6f89]">{text}</span>
                      </span>
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          </motion.article>
        </AnimatePresence>
      </div>
    </section>
  );
}

export default CounterHall;
