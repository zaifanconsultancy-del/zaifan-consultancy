import { motion } from "framer-motion";
import { ArrowRight, Check, PlaneTakeoff } from "lucide-react";

import StepIntro from "../guide/StepIntro";
import { DETAIL_STEPS, counterLabel } from "./serviceMeta";

/** Step 2 of a service page: the gates you pass through, then a receipt of what you leave with. */
function ProcessRoute({ service }) {
  return (
    <section id="how" className="scroll-mt-20 bg-[#fff7ed] px-4 pb-20 pt-10 text-[#071f50] sm:px-5 md:pb-28 md:pt-14">
      <div className="mx-auto max-w-[1350px]">
        <StepIntro
          steps={DETAIL_STEPS}
          step={2}
          title="How it works,"
          accent="gate by gate."
          text={`${service.title} goes in ${service.process.length} steps. You always know which one you're at.`}
          howTo="Read the gates from left to right. The receipt underneath is everything you leave with."
        />

        <ol className="relative mt-12 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {service.process.map(([title, text], index) => (
            <motion.li
              key={title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ delay: index * 0.12, duration: 0.45 }}
              className="relative flex flex-col rounded-[26px] bg-white p-6 ring-1 ring-orange-100"
            >
              <div className="flex items-center justify-between">
                <span className="rounded-xl bg-[#071f50] px-3 py-2 font-mono text-xs font-black uppercase tracking-[0.14em] text-[#ffb36d]">
                  Gate {String.fromCharCode(65 + index)}
                </span>
                <span className="font-mono text-4xl font-black text-[#071f50]/10">0{index + 1}</span>
              </div>
              <h3 className="mt-6 text-2xl font-black tracking-[-0.04em]">{title}</h3>
              <p className="mt-2 text-sm font-semibold leading-6 text-[#5f6f89]">{text}</p>
              {index === service.process.length - 1 && (
                <span className="mt-5 inline-flex w-fit items-center gap-2 rounded-full bg-[#fff1ea] px-3 py-1.5 text-xs font-black text-[#ff4b12]">
                  <PlaneTakeoff size={14} /> Ready for the next stage
                </span>
              )}
              {/* Arrow to the next gate when the four sit in one row */}
              {index < service.process.length - 1 && (
                <span
                  aria-hidden="true"
                  className="absolute -right-[22px] top-1/2 z-10 hidden h-9 w-9 -translate-y-1/2 place-items-center rounded-full bg-[#ff4b12] text-white ring-4 ring-[#fff7ed] xl:grid"
                >
                  <ArrowRight size={16} strokeWidth={3} />
                </span>
              )}
            </motion.li>
          ))}
        </ol>

        {/* Receipt */}
        <div className="mx-auto mt-14 max-w-[620px]">
          <div className="relative bg-white px-6 pb-8 pt-7 font-mono text-[#071f50] shadow-[0_26px_55px_rgba(7,31,80,0.12)] sm:px-8">
            <div className="text-center">
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[#7a879c]">Zaifan Consultancy</p>
              <p className="mt-1 text-lg font-black uppercase tracking-[0.06em]">
                {counterLabel(service)} · Receipt
              </p>
            </div>
            <div className="my-5 border-t-2 border-dashed border-[#071f50]/15" />
            <ul className="grid gap-3">
              {service.outcomes.map((outcome, index) => (
                <li key={outcome} className="flex items-baseline gap-3 text-sm font-bold">
                  <span className="text-[#7a879c]">{String(index + 1).padStart(2, "0")}</span>
                  <span className="flex-1 font-sans">{outcome}</span>
                  <span className="grid h-5 w-5 shrink-0 place-items-center self-center rounded-full bg-emerald-500 text-white">
                    <Check size={12} strokeWidth={4} />
                  </span>
                </li>
              ))}
            </ul>
            <div className="my-5 border-t-2 border-dashed border-[#071f50]/15" />
            <div className="flex items-baseline justify-between text-sm font-black uppercase tracking-[0.08em]">
              <span>Total</span>
              <span className="text-[#ff4b12]">1 clear plan</span>
            </div>
            <p className="mt-2 text-xs font-bold text-[#7a879c]">First conversation: free</p>
            {/* Torn bottom edge */}
            <div
              aria-hidden="true"
              className="absolute inset-x-0 -bottom-3 h-3"
              style={{ background: "radial-gradient(circle at 6px 12px, transparent 6px, #fff 6.5px) 0 0 / 12px 12px repeat-x" }}
            />
          </div>
        </div>
      </div>
    </section>
  );
}

export default ProcessRoute;
