import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowUpRight, Check } from "lucide-react";

import StepIntro from "../guide/StepIntro";
import { COUNTERS, DETAIL_STEPS, counterLabel } from "./serviceMeta";

function verdictFor(count, total) {
  if (!count) return { tone: "idle", title: "Tap the lines that sound like you", text: "Your answer shows up here as soon as you tap one." };
  if (count === 1) return { tone: "amber", title: "Partly you", text: "This counter may help. A free call will tell you for sure." };
  if (count === total) return { tone: "green", title: "This counter is made for you", text: "Every line fits. The steps below show exactly how it goes." };
  return { tone: "green", title: "Good match", text: `${count} of ${total} lines fit. Keep scrolling to see how it works.` };
}

const TONES = {
  idle: "bg-white/[0.07] text-white/70",
  amber: "bg-amber-400 text-[#3a2600]",
  green: "bg-emerald-400 text-[#052e1c]",
};

/** Step 1 of a service page: tap the student descriptions that fit you. */
function FitTap({ service }) {
  const [picked, setPicked] = useState({});
  const lines = service.audience;
  const count = lines.filter((line) => picked[line]).length;
  const verdict = verdictFor(count, lines.length);
  const others = COUNTERS.filter((item) => item.slug !== service.slug);

  return (
    <section id="fit" className="scroll-mt-20 bg-[#071f50] px-4 pb-20 pt-10 text-white sm:px-5 md:pb-28 md:pt-14">
      <div className="mx-auto max-w-[1350px]">
        <StepIntro
          steps={DETAIL_STEPS}
          step={1}
          tone="navy"
          title="Is this counter for you?"
          accent="Tap what sounds like you."
          text={service.summary}
          howTo="Tap every line that describes you. If none fit, one of the other counters on the right will."
        />

        <div className="mt-12 grid gap-8 lg:grid-cols-[1.25fr_0.75fr] lg:gap-10">
          <div>
            <div className="grid gap-3 sm:grid-cols-2">
              {lines.map((line, index) => {
                const on = Boolean(picked[line]);
                return (
                  <motion.button
                    key={line}
                    type="button"
                    whileTap={{ scale: 0.97 }}
                    onClick={() => setPicked((current) => ({ ...current, [line]: !current[line] }))}
                    aria-pressed={on}
                    className={`relative flex min-h-[130px] flex-col justify-between rounded-[24px] p-5 text-left transition ${
                      on ? "bg-white text-[#071f50]" : "bg-white/[0.07] text-white ring-1 ring-white/10 hover:bg-white/[0.12]"
                    }`}
                  >
                    <span className={`font-mono text-[10px] font-black uppercase tracking-[0.16em] ${on ? "text-[#ff4b12]" : "text-[#ffb36d]"}`}>
                      Student {String.fromCharCode(65 + index)}
                    </span>
                    <span className="mt-3 pr-8 text-lg font-black leading-snug tracking-[-0.02em]">{line}</span>
                    <span
                      className={`absolute right-4 top-4 grid h-7 w-7 place-items-center rounded-full border-2 transition ${
                        on ? "border-emerald-500 bg-emerald-500 text-white" : "border-white/25"
                      }`}
                    >
                      {on && <Check size={15} strokeWidth={4} />}
                    </span>
                  </motion.button>
                );
              })}
            </div>

            <div className={`mt-5 flex flex-col gap-1 rounded-[22px] px-5 py-4 transition sm:flex-row sm:items-center sm:justify-between sm:gap-6 ${TONES[verdict.tone]}`}>
              <div>
                <p className="text-lg font-black tracking-[-0.02em]">{verdict.title}</p>
                <p className="text-sm font-bold opacity-80">{verdict.text}</p>
              </div>
              <span className="shrink-0 font-mono text-3xl font-black">
                {count}/{lines.length}
              </span>
            </div>
          </div>

          <aside className="rounded-[26px] bg-white/[0.05] p-5 ring-1 ring-white/10">
            <p className="font-mono text-[11px] font-black uppercase tracking-[0.16em] text-[#ffb36d]">None of these? Try another counter</p>
            <div className="mt-4 grid gap-2">
              {others.map((item) => (
                <Link
                  key={item.slug}
                  to={`/services/${item.slug}`}
                  className="group flex items-center gap-3 rounded-2xl bg-white/[0.06] px-3.5 py-3 transition hover:bg-white/[0.12]"
                >
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-black/30 font-mono text-xs font-black text-[#ffb36d]">
                    {String(item.counter).padStart(2, "0")}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-bold leading-5">&ldquo;{item.problem}&rdquo;</span>
                    <span className="block text-[11px] font-black text-white/50">
                      {counterLabel(item)} · {item.shortTitle}
                    </span>
                  </span>
                  <ArrowUpRight size={15} strokeWidth={3} className="shrink-0 text-[#ffb36d] transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                </Link>
              ))}
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}

export default FitTap;
