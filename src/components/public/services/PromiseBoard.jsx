import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Ban, Check, Hand } from "lucide-react";

import StepIntro from "../guide/StepIntro";
import { HUB_STEPS } from "./serviceMeta";

const COLUMNS = [
  {
    id: "we",
    title: "We do this for you",
    icon: Check,
    mark: "bg-emerald-500 text-white",
    items: [
      "Look at your grades, budget and goals honestly, and tell you where you stand",
      "Build a university shortlist with safe backup options",
      "Map the scholarships you can apply for, with their deadlines",
      "Keep one deadline plan for every university you apply to",
      "Organise your SOP, CV and papers, folder by folder",
      "Prepare your visa file and appointment plan with you",
    ],
  },
  {
    id: "you",
    title: "You do this part",
    icon: Hand,
    mark: "bg-[#071f50] text-white",
    items: [
      "Tell us the truth about grades, gaps and budget",
      "Collect your original papers: degree, transcripts, passport",
      "Take a language test where the course asks for one",
      "Write your SOP in your own words (we help shape it)",
      "Make the final choice. It's your future",
      "Attend your visa appointment in person",
    ],
  },
  {
    id: "nobody",
    title: "Nobody can promise you",
    icon: Ban,
    mark: "bg-rose-500 text-white",
    items: [
      "Admission. The university decides",
      "A scholarship. The funding body ranks and decides",
      "A visa. The embassy decides",
      "That rules and fees stay the same next year",
    ],
    footnote: "If an agent promises you any of these, walk away.",
  },
];

/** Step 3 of the hub: one boarding pass split into what we do, what you do, and what nobody can promise. */
function PromiseBoard() {
  const [stamped, setStamped] = useState(false);

  return (
    <section id="promise" className="scroll-mt-20 bg-[#ff4b12] px-4 pb-20 pt-10 text-white sm:px-5 md:pb-28 md:pt-14">
      <div className="mx-auto max-w-[1350px]">
        <StepIntro
          steps={HUB_STEPS}
          step={3}
          tone="orange"
          title="Who does what."
          accent="No fake guarantees."
          text="Before you trust anyone with your plans, you should know exactly what they will and won't do. Here is ours, in writing."
          howTo="Read the three parts of the pass. Press the stamp when you've read it, so you know what to expect from us."
        />

        <div className="relative mt-12">
          <div className="grid overflow-hidden rounded-[30px] bg-white text-[#071f50] shadow-[0_34px_70px_rgba(7,31,80,0.28)] lg:grid-cols-3">
            {COLUMNS.map((column, index) => (
              <div
                key={column.id}
                className={`relative p-6 md:p-8 ${index > 0 ? "border-t-2 border-dashed border-[#071f50]/15 lg:border-l-2 lg:border-t-0" : ""}`}
              >
                {index > 0 && (
                  <>
                    {/* Punched holes where the pass tears */}
                    <span aria-hidden="true" className="absolute -left-3 -top-3 hidden h-6 w-6 rounded-full bg-[#ff4b12] lg:block" />
                    <span aria-hidden="true" className="absolute -bottom-3 -left-3 hidden h-6 w-6 rounded-full bg-[#ff4b12] lg:block" />
                  </>
                )}
                <p className="font-mono text-[10px] font-black uppercase tracking-[0.18em] text-[#7a879c]">Part {index + 1} of 3</p>
                <h3 className="mt-1 text-2xl font-black tracking-[-0.04em]">{column.title}</h3>
                <ul className="mt-5 grid gap-3">
                  {column.items.map((item) => (
                    <li key={item} className="flex items-start gap-3 text-sm font-bold leading-6">
                      <span className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full ${column.mark}`}>
                        <column.icon size={11} strokeWidth={4} />
                      </span>
                      {item}
                    </li>
                  ))}
                </ul>
                {column.footnote && (
                  <p className="mt-6 rounded-2xl bg-rose-50 px-4 py-3 text-sm font-black text-rose-700 ring-1 ring-rose-100">{column.footnote}</p>
                )}
              </div>
            ))}
          </div>

          <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <button
              type="button"
              onClick={() => setStamped((value) => !value)}
              aria-pressed={stamped}
              className="inline-flex items-center gap-2 rounded-full bg-[#071f50] px-6 py-3.5 text-sm font-black text-white transition hover:bg-[#0b2c6e]"
            >
              {stamped ? "Stamped. Press again to undo" : "I've read it. Stamp my pass"}
            </button>
          </div>

          <AnimatePresence>
            {stamped && (
              <motion.span
                initial={{ scale: 2.4, opacity: 0, rotate: -30 }}
                animate={{ scale: 1, opacity: 1, rotate: -12 }}
                exit={{ opacity: 0 }}
                transition={{ type: "spring", stiffness: 480, damping: 22 }}
                className="pointer-events-none absolute -top-6 right-4 rounded-xl border-[4px] border-emerald-600 bg-white/90 px-4 py-2 text-center font-mono text-sm font-black uppercase leading-5 tracking-[0.14em] text-emerald-700 md:right-10"
              >
                Honest
                <br />
                advice only
              </motion.span>
            )}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}

export default PromiseBoard;
