import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Check, RotateCcw, ScanLine } from "lucide-react";

import StepIntro from "../guide/StepIntro";
import { DETAIL_STEPS } from "./serviceMeta";

/**
 * Step 3 of a service page: an airport security scanner. Each thing we check
 * in your plan goes through the machine one at a time and gets a green tick.
 */
function SecurityScan({ service }) {
  const items = service.uniqueCards;
  const [current, setCurrent] = useState(0);
  const [scanned, setScanned] = useState(() => new Set([0]));
  const [title, text] = items[current];
  const allDone = scanned.size === items.length;

  const scan = (index) => {
    setCurrent(index);
    setScanned((done) => new Set(done).add(index));
  };
  const next = () => scan((current + 1) % items.length);
  const reset = () => {
    setCurrent(0);
    setScanned(new Set([0]));
  };

  return (
    <section id="checks" className="scroll-mt-20 bg-[#ff4b12] px-4 pb-20 pt-10 text-white sm:px-5 md:pb-28 md:pt-14">
      <div className="mx-auto max-w-[1350px]">
        <StepIntro
          steps={DETAIL_STEPS}
          step={3}
          tone="orange"
          title={service.uniqueTitle}
          text={service.uniqueIntro}
          howTo={`Press "Scan next" or tap any bag. Each one is a thing we check in your plan at this counter.`}
        />

        <div className="mt-12 grid gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:gap-10">
          {/* Scanner */}
          <div className="rounded-[30px] bg-[#071f50] p-5 shadow-[0_34px_70px_rgba(7,31,80,0.35)] sm:p-6">
            <div className="flex items-center justify-between font-mono text-[10px] font-black uppercase tracking-[0.18em] text-white/50">
              <span className="flex items-center gap-2">
                <ScanLine size={14} className="text-[#ffb36d]" /> Plan scanner
              </span>
              <span>
                Bag {current + 1} of {items.length}
              </span>
            </div>

            <div className="relative mt-4 min-h-[240px] overflow-hidden rounded-[20px] bg-[#04122f] p-6 ring-1 ring-white/10">
              {/* Grid like an X-ray screen */}
              <div
                aria-hidden="true"
                className="absolute inset-0 opacity-[0.08]"
                style={{ background: "linear-gradient(#7dd3fc 1px, transparent 1px) 0 0 / 100% 24px, linear-gradient(90deg, #7dd3fc 1px, transparent 1px) 0 0 / 24px 100%" }}
              />
              <motion.div
                key={`beam-${current}`}
                aria-hidden="true"
                initial={{ top: "0%" }}
                animate={{ top: "100%" }}
                transition={{ duration: 0.9, ease: "easeInOut" }}
                className="absolute inset-x-0 h-1 bg-emerald-300/70 shadow-[0_0_18px_4px_rgba(110,231,183,0.35)]"
              />
              <AnimatePresence mode="wait">
                <motion.div
                  key={title}
                  initial={{ opacity: 0, filter: "blur(6px)" }}
                  animate={{ opacity: 1, filter: "blur(0px)" }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  className="relative"
                >
                  <p className="font-mono text-[11px] font-black uppercase tracking-[0.18em] text-sky-300">Inside this bag</p>
                  <p className="mt-2 text-3xl font-black tracking-[-0.04em] text-white md:text-4xl">{title}</p>
                  <p className="mt-3 max-w-lg text-base font-semibold leading-7 text-white/75">{text}</p>
                  <span className="mt-5 inline-flex items-center gap-1.5 rounded-full bg-emerald-400 px-3 py-1.5 font-mono text-[11px] font-black uppercase tracking-[0.14em] text-[#052e1c]">
                    <Check size={13} strokeWidth={4} /> We check this
                  </span>
                </motion.div>
              </AnimatePresence>
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              <span className="font-mono text-xs font-black uppercase tracking-[0.14em] text-white/60">
                {allDone ? "All bags checked" : `${scanned.size} of ${items.length} checked`}
              </span>
              <div className="flex gap-2">
                {allDone && (
                  <button
                    type="button"
                    onClick={reset}
                    className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-4 py-3 text-sm font-black text-white transition hover:bg-white/20"
                  >
                    <RotateCcw size={14} strokeWidth={3} /> Again
                  </button>
                )}
                <button
                  type="button"
                  onClick={next}
                  className="inline-flex items-center gap-2 rounded-full bg-[#ff4b12] px-5 py-3 text-sm font-black text-white transition hover:bg-[#ff642f]"
                >
                  Scan next <ArrowRight size={16} strokeWidth={3} />
                </button>
              </div>
            </div>
          </div>

          {/* Belt of bags */}
          <ul className="grid grid-cols-2 content-start gap-3">
            {items.map(([name], index) => {
              const active = index === current;
              const done = scanned.has(index);
              return (
                <li key={name}>
                  <button
                    type="button"
                    onClick={() => scan(index)}
                    aria-pressed={active}
                    className={`relative flex w-full flex-col items-start rounded-[20px] px-4 pb-4 pt-6 text-left transition ${
                      active
                        ? "bg-white text-[#071f50] shadow-[0_18px_40px_rgba(7,31,80,0.25)]"
                        : "bg-[#071f50]/20 text-white hover:bg-[#071f50]/30"
                    }`}
                  >
                    {/* Bag handle */}
                    <span
                      aria-hidden="true"
                      className={`absolute -top-2 left-1/2 h-4 w-12 -translate-x-1/2 rounded-t-xl border-[3px] border-b-0 ${
                        active ? "border-white" : "border-[#071f50]/30"
                      }`}
                    />
                    <span className={`font-mono text-[10px] font-black uppercase tracking-[0.16em] ${active ? "text-[#ff4b12]" : "text-white/70"}`}>
                      Bag {index + 1}
                    </span>
                    <span className="mt-1 text-base font-black leading-tight">{name}</span>
                    <span
                      className={`absolute right-3 top-3 grid h-6 w-6 place-items-center rounded-full transition ${
                        done ? "bg-emerald-500 text-white" : active ? "bg-[#071f50]/10" : "bg-white/15"
                      }`}
                    >
                      {done && <Check size={13} strokeWidth={4} />}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </section>
  );
}

export default SecurityScan;
