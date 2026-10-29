import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, RotateCcw, X } from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";

import { iconFor } from "../destinations/destinationUtils";
import StepIntro from "./StepIntro";

const WHATSAPP_NUMBER = "923305718131";

function verdictFor(good, bad, name) {
  if (!good && !bad) return { tone: "idle", title: "Tap the lines above", text: "Your result shows up here as soon as you tap something." };
  if (bad >= 3) return { tone: "red", title: "Think twice for now", text: `${name} may be hard for you right now. Talk to us before you spend money on applications.` };
  if (good >= 4 && bad === 0) return { tone: "green", title: "Strong fit", text: `${name} suits you well. The next five steps are worth your time.` };
  if (good >= 3) {
    return { tone: "amber", title: "Good fit, with homework", text: `${bad} thing${bad === 1 ? "" : "s"} to sort out first. We can help you plan around ${bad === 1 ? "it" : "them"}.` };
  }
  return { tone: "amber", title: "Not sure yet", text: "Keep going through the guide, or ask us to look at your profile honestly." };
}

const TONES = {
  idle: { bar: "bg-[#c9d0dc]", text: "text-[#7a879c]" },
  green: { bar: "bg-emerald-500", text: "text-emerald-700" },
  amber: { bar: "bg-amber-400", text: "text-amber-700" },
  red: { bar: "bg-rose-500", text: "text-rose-700" },
};

function Statement({ text, picked, kind, onToggle }) {
  const good = kind === "good";
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={picked}
      className={`flex w-full items-start gap-3 rounded-2xl px-3.5 py-3 text-left text-sm font-bold leading-6 ring-1 transition ${
        picked
          ? good
            ? "bg-emerald-50 text-emerald-900 ring-emerald-300"
            : "bg-rose-50 text-rose-900 ring-rose-300"
          : "bg-[#fffaf5] text-[#071f50] ring-orange-100 hover:ring-[#ff4b12]/40"
      }`}
    >
      <span
        className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-md border-2 transition ${
          picked ? (good ? "border-emerald-500 bg-emerald-500 text-white" : "border-rose-500 bg-rose-500 text-white") : "border-[#c9d0dc] bg-white"
        }`}
      >
        {picked && (good ? <Check size={13} strokeWidth={4} /> : <X size={13} strokeWidth={4} />)}
      </span>
      {text}
    </button>
  );
}

/** A myth students hear, with a "not quite" stamp that reveals the truth. */
function MythCard({ item, index }) {
  const [open, setOpen] = useState(false);

  return (
    <motion.button
      type="button"
      onClick={() => setOpen((value) => !value)}
      aria-expanded={open}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ delay: (index % 3) * 0.08 }}
      className="relative flex min-h-[210px] flex-col overflow-hidden rounded-[24px] bg-white p-5 text-left text-[#071f50] shadow-[0_20px_45px_rgba(7,31,80,0.18)]"
    >
      <span className="font-mono text-[10px] font-black uppercase tracking-[0.16em] text-[#7a879c]">You heard</span>
      <span className={`mt-2 text-xl font-black leading-tight tracking-[-0.03em] transition ${open ? "text-[#9aa5b8] line-through decoration-[#ff4b12] decoration-[3px]" : ""}`}>
        “{item.expectation}”
      </span>

      <AnimatePresence initial={false}>
        {open ? (
          <motion.span key="truth" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-4 block">
            <span className="font-mono text-[10px] font-black uppercase tracking-[0.16em] text-emerald-600">The truth</span>
            <span className="mt-1 block text-sm font-bold leading-6 text-[#526178]">{item.reality}</span>
          </motion.span>
        ) : (
          <motion.span key="hint" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="mt-auto pt-4 text-xs font-black text-[#ff4b12]">
            Tap to check it →
          </motion.span>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {open && (
          <motion.span
            initial={{ scale: 2.2, opacity: 0, rotate: -24 }}
            animate={{ scale: 1, opacity: 1, rotate: -12 }}
            exit={{ opacity: 0 }}
            transition={{ type: "spring", stiffness: 500, damping: 22 }}
            className="pointer-events-none absolute right-3 top-3 rounded-lg border-[3px] border-[#ff4b12] px-2.5 py-1 font-mono text-xs font-black uppercase tracking-[0.12em] text-[#ff4b12]"
          >
            Not quite
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  );
}

/** Step 1: why students pick the country, a self-check, and the myths to ignore. */
function FitCheck({ country }) {
  const [picked, setPicked] = useState({});
  const choose = country.decision?.choose || [];
  const avoid = country.decision?.avoid || [];
  const good = choose.filter((item) => picked[item]).length;
  const bad = avoid.filter((item) => picked[item]).length;
  const verdict = verdictFor(good, bad, country.name);
  const meter = Math.max(4, Math.min(100, (good / Math.max(choose.length, 1)) * 100 - bad * 18));
  const toggle = (item) => setPicked((current) => ({ ...current, [item]: !current[item] }));

  const message = [
    `Hi Zaifan, I did the ${country.name} self-check: "${verdict.title}".`,
    good ? `True for me: ${choose.filter((item) => picked[item]).join("; ")}.` : "",
    bad ? `My worries: ${avoid.filter((item) => picked[item]).join("; ")}.` : "",
    "Can you help me plan?",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <section id="fit" className="scroll-mt-20 bg-[#ff4b12] px-4 pb-20 pt-10 text-white sm:px-5 md:pb-28 md:pt-14">
      <div className="mx-auto max-w-[1350px]">
        <StepIntro
          step={1}
          tone="orange"
          title={`Is ${country.name}`}
          accent="right for you?"
          howTo="Read the four reasons, then tap every line that's true for you. Your result updates as you go."
        />

        <div className="mt-12 grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
          <ol className="grid content-start gap-3">
            {country.whyStudy.map((item, index) => {
              const Icon = iconFor(item.icon);
              return (
                <li key={item.title} className="flex gap-4 rounded-[22px] bg-[#071f50]/15 p-5 ring-1 ring-white/15">
                  <span className="font-mono text-3xl font-black leading-none text-white/40">0{index + 1}</span>
                  <div>
                    <h3 className="flex items-center gap-2 text-lg font-black tracking-[-0.02em]">
                      <Icon size={18} className="text-[#ffd9c7]" /> {item.title}
                    </h3>
                    <p className="mt-1.5 text-sm font-semibold leading-6 text-white/85">{item.text}</p>
                  </div>
                </li>
              );
            })}
          </ol>

          <div className="rounded-[28px] bg-white p-5 text-[#071f50] shadow-[0_30px_70px_rgba(7,31,80,0.25)] sm:p-7">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-2xl font-black tracking-[-0.04em]">Quick self-check</h3>
              {(good > 0 || bad > 0) && (
                <button type="button" onClick={() => setPicked({})} className="inline-flex items-center gap-1 text-xs font-black text-[#7a879c] hover:text-[#ff4b12]">
                  <RotateCcw size={13} /> Start again
                </button>
              )}
            </div>

            <div className="mt-5 grid gap-5 md:grid-cols-2">
              <div>
                <p className="font-mono text-[11px] font-black uppercase tracking-[0.14em] text-emerald-600">Sounds like me</p>
                <div className="mt-2.5 grid gap-2">
                  {choose.map((item) => (
                    <Statement key={item} text={item} kind="good" picked={!!picked[item]} onToggle={() => toggle(item)} />
                  ))}
                </div>
              </div>
              <div>
                <p className="font-mono text-[11px] font-black uppercase tracking-[0.14em] text-rose-600">Be honest: is this you?</p>
                <div className="mt-2.5 grid gap-2">
                  {avoid.map((item) => (
                    <Statement key={item} text={item} kind="bad" picked={!!picked[item]} onToggle={() => toggle(item)} />
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-6 rounded-2xl bg-[#fff7ed] p-4 ring-1 ring-orange-100" aria-live="polite">
              <div className="flex items-center justify-between gap-3">
                <p className={`text-lg font-black tracking-[-0.02em] ${TONES[verdict.tone].text}`}>{verdict.title}</p>
                <p className="font-mono text-xs font-black text-[#7a879c]">
                  {good} ✓ · {bad} ✗
                </p>
              </div>
              <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-[#071f50]/10">
                <motion.div className={`h-full rounded-full ${TONES[verdict.tone].bar}`} animate={{ width: `${good || bad ? meter : 0}%` }} transition={{ type: "spring", stiffness: 120, damping: 20 }} />
              </div>
              <p className="mt-2 text-sm font-semibold leading-6 text-[#526178]">{verdict.text}</p>
              {(good > 0 || bad > 0) && (
                <a
                  href={`https://api.whatsapp.com/send?phone=${WHATSAPP_NUMBER}&text=${encodeURIComponent(message)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-3 inline-flex items-center gap-2 rounded-full bg-[#25d366] px-4 py-2.5 text-xs font-black text-[#062b16] transition hover:bg-[#3ee07a]"
                >
                  <FaWhatsapp size={15} /> Send my result to an advisor
                </a>
              )}
            </div>
          </div>
        </div>

        {country.realityChecks?.length > 0 && (
          <div className="mt-16">
            <h3 className="text-3xl font-black tracking-[-0.045em] md:text-4xl">Things students hear about {country.name}.</h3>
            <p className="mt-2 text-sm font-bold text-white/85">Tap a card to see what's actually true.</p>
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {country.realityChecks.map((item, index) => (
                <MythCard key={item.expectation} item={item} index={index} />
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

export default FitCheck;
