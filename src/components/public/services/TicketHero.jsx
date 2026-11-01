import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowDown, ArrowRight, ArrowUpRight, Ticket } from "lucide-react";

import { COUNTERS, counterLabel } from "./serviceMeta";

function scrollTo(id) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

/** The paper ticket the machine prints: which counter to go to, and why. */
function PrintedTicket({ service, number, onShowDesk }) {
  return (
    <motion.div
      initial={{ y: -150, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 140, damping: 18 }}
      className="relative mx-auto w-[92%] rounded-b-[18px] bg-white px-5 pb-5 pt-6 text-[#071f50] shadow-[0_26px_50px_rgba(7,31,80,0.22)]"
    >
      {/* Torn top edge */}
      <div
        aria-hidden="true"
        className="absolute inset-x-0 -top-2 h-3"
        style={{ background: "radial-gradient(circle at 6px 0, transparent 6px, #fff 6.5px) 0 0 / 12px 12px repeat-x" }}
      />
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-mono text-[10px] font-black uppercase tracking-[0.18em] text-[#7a879c]">Your ticket</p>
          <p className="font-mono text-4xl font-black leading-none tracking-[-0.04em]">
            {service.code.slice(0, 1)}-{String(number).padStart(3, "0")}
          </p>
        </div>
        <span className="rounded-xl bg-[#ff4b12] px-3 py-2 text-right font-mono text-[10px] font-black uppercase leading-4 tracking-[0.14em] text-white">
          Go to
          <br />
          <span className="text-base">{counterLabel(service)}</span>
        </span>
      </div>
      <div className="my-4 border-t-2 border-dashed border-[#071f50]/15" />
      <p className="text-xl font-black tracking-[-0.03em]">{service.title}</p>
      <p className="mt-1 text-sm font-semibold leading-6 text-[#5f6f89]">{service.hero}</p>
      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        <Link
          to={`/services/${service.slug}`}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-[#071f50] px-4 py-3 text-sm font-black text-white transition hover:bg-[#ff4b12]"
        >
          Open this counter <ArrowUpRight size={15} strokeWidth={3} />
        </Link>
        <button
          type="button"
          onClick={onShowDesk}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-[#fff1ea] px-4 py-3 text-sm font-black text-[#ff4b12] transition hover:bg-[#ffe1d1]"
        >
          Quick look below <ArrowDown size={15} strokeWidth={3} />
        </button>
      </div>
    </motion.div>
  );
}

/**
 * Services hub hero: a queue-ticket machine. Press the sentence that sounds
 * like your problem and it prints a ticket telling you which counter helps.
 */
function TicketHero({ onPick }) {
  const [picked, setPicked] = useState(null);
  const [pulls, setPulls] = useState(0);
  const slotRef = useRef(null);

  // On short screens the ticket prints below the fold; bring it into view.
  useEffect(() => {
    if (!pulls) return undefined;
    const timer = window.setTimeout(() => slotRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" }), 250);
    return () => window.clearTimeout(timer);
  }, [pulls]);

  const service = COUNTERS.find((item) => item.slug === picked);

  const press = (slug) => {
    setPicked(slug);
    setPulls((count) => count + 1);
    onPick(slug);
  };

  return (
    <section className="relative overflow-hidden bg-[#fff7ed] px-4 pb-16 pt-28 text-[#071f50] sm:px-5 md:pb-24 md:pt-36">
      <div className="relative mx-auto grid max-w-[1350px] items-start gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
        <div className="lg:pt-6">
          <span className="inline-flex items-center gap-2 rounded-full bg-[#071f50] px-3.5 py-2 font-mono text-[11px] font-black uppercase tracking-[0.16em] text-white">
            <Ticket size={14} className="text-[#ffb36d]" /> Zaifan services · 6 counters
          </span>

          <h1 className="mt-6 text-[3rem] font-black leading-[0.9] tracking-[-0.065em] sm:text-7xl xl:text-[5.6rem]">
            What do you need
            <span className="block text-[#ff4b12]">help with?</span>
          </h1>
          <p className="mt-6 max-w-xl text-lg font-semibold leading-8 text-[#5f6f89]">
            Our help is split into six counters, like an airport check-in hall. Press the sentence that sounds like you and the
            machine tells you which counter to go to. The first conversation is always free.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() => scrollTo("counters")}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-[#ff4b12] px-7 py-4 font-black text-white shadow-[0_18px_40px_rgba(255,75,18,0.28)] transition hover:-translate-y-0.5 hover:bg-[#ff642f]"
            >
              See all six counters <ArrowDown size={18} strokeWidth={3} />
            </button>
            <Link
              to="/services/free-consultation"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-7 py-4 font-black ring-1 ring-orange-100 transition hover:-translate-y-0.5 hover:text-[#ff4b12]"
            >
              Not sure? Start at Counter 01 <ArrowRight size={18} strokeWidth={3} />
            </Link>
          </div>

          {/* Counter directory, like the overhead signs */}
          <ol className="mt-10 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {COUNTERS.map((item) => (
              <li key={item.slug}>
                <Link
                  to={`/services/${item.slug}`}
                  className="group flex items-center gap-2.5 rounded-2xl bg-white px-3 py-2.5 ring-1 ring-orange-100 transition hover:ring-[#ff4b12]/40"
                >
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[#071f50] font-mono text-xs font-black text-[#ffb36d]">
                    {String(item.counter).padStart(2, "0")}
                  </span>
                  <span className="min-w-0 truncate text-xs font-black group-hover:text-[#ff4b12]">{item.shortTitle}</span>
                </Link>
              </li>
            ))}
          </ol>
        </div>

        {/* The machine */}
        <div className="relative mx-auto w-full max-w-[520px]">
          <div className="relative rounded-[34px] bg-[#071f50] p-5 text-white shadow-[0_40px_80px_rgba(7,31,80,0.3)] sm:p-6">
            <div className="flex items-center justify-between rounded-2xl bg-black/40 px-4 py-3 ring-1 ring-white/10">
              <div>
                <p className="font-mono text-[10px] font-black uppercase tracking-[0.2em] text-white/50">Now serving</p>
                <p className="font-mono text-lg font-black tracking-[0.06em] text-[#ffb36d] sm:text-2xl sm:tracking-[0.08em]">
                  {service ? `${counterLabel(service).toUpperCase()} · ${service.code}` : "PRESS A LINE"}
                </p>
              </div>
              <span className="flex items-center gap-1.5 font-mono text-[10px] font-black uppercase tracking-[0.16em] text-emerald-300">
                <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" /> Free
              </span>
            </div>

            <p className="mt-5 font-mono text-[11px] font-black uppercase tracking-[0.16em] text-white/60">
              Press the line that sounds like you
            </p>
            <div className="mt-3 grid gap-2">
              {COUNTERS.map((item) => {
                const active = item.slug === picked;
                return (
                  <motion.button
                    key={item.slug}
                    type="button"
                    whileTap={{ scale: 0.97, y: 2 }}
                    onClick={() => press(item.slug)}
                    aria-pressed={active}
                    className={`flex items-center gap-3 rounded-2xl px-3.5 py-3 text-left text-sm font-black transition ${
                      active
                        ? "bg-[#ff4b12] text-white shadow-[inset_0_-3px_0_rgba(0,0,0,0.2)]"
                        : "bg-white/[0.07] text-white shadow-[inset_0_-3px_0_rgba(0,0,0,0.25)] ring-1 ring-white/10 hover:bg-white/[0.12]"
                    }`}
                  >
                    <span
                      className={`grid h-7 w-7 shrink-0 place-items-center rounded-full font-mono text-[11px] ${
                        active ? "bg-white text-[#ff4b12]" : "bg-white/10 text-[#ffb36d]"
                      }`}
                    >
                      {item.counter}
                    </span>
                    &ldquo;{item.problem}&rdquo;
                  </motion.button>
                );
              })}
            </div>

            {/* Ticket slot */}
            <div className="mx-auto mt-6 h-3 w-[80%] rounded-full bg-black/60 shadow-[inset_0_2px_4px_rgba(0,0,0,0.6)]" />
          </div>

          {/* Clips the ticket while it slides out of the slot; padding leaves room for its shadow */}
          <div ref={slotRef} className="relative -mx-4 -mt-1.5 min-h-[120px] overflow-hidden px-4 pb-14">
            <AnimatePresence mode="wait">
              {service ? (
                <PrintedTicket
                  key={pulls}
                  service={service}
                  number={40 + pulls}
                  onShowDesk={() => scrollTo("counters")}
                />
              ) : (
                <motion.p
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="mx-auto mt-4 w-[86%] rounded-b-[18px] border-2 border-dashed border-[#071f50]/15 px-5 py-6 text-center text-sm font-bold text-[#7a879c]"
                >
                  Your ticket prints here.
                </motion.p>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}

export default TicketHero;
