import { useRef, useState } from "react";
import { AnimatePresence, motion, useInView } from "framer-motion";
import { FileCheck2, GraduationCap, Luggage, MessageCircle, Plane, Send, Stamp } from "lucide-react";

const STEPS = [
  {
    icon: MessageCircle,
    title: "Free consultation",
    when: "Day 1",
    you: "Share your grades, budget and dream subject.",
    we: "Tell you honestly which countries and courses fit you.",
  },
  {
    icon: GraduationCap,
    title: "Your shortlist",
    when: "Week 1–2",
    you: "Pick the universities you like best from our list.",
    we: "Match universities, courses and scholarships to your profile.",
  },
  {
    icon: FileCheck2,
    title: "Documents & tests",
    when: "1–3 months",
    you: "Get your IELTS and collect your certificates.",
    we: "Guide your IBCC/HEC attestation, SOP, CV and letters.",
  },
  {
    icon: Send,
    title: "Applications",
    when: "6–9 months before you start",
    you: "Review and approve each application.",
    we: "Submit everything and track every deadline for you.",
  },
  {
    icon: Stamp,
    title: "Offer & visa",
    when: "3–5 months before",
    you: "Arrange your funds and attend the embassy appointment.",
    we: "Prepare your visa file and practise the interview with you.",
  },
  {
    icon: Luggage,
    title: "Fly & settle in",
    when: "Arrival",
    you: "Pack your bags and say goodbye at the airport.",
    we: "Help with housing, registration and your first-week checklist.",
  },
];

const STEP_SECONDS = 6;

function HowItWorks() {
  const ref = useRef(null);
  const inView = useInView(ref, { amount: 0.4 });
  const [active, setActive] = useState(0);
  const [hovered, setHovered] = useState(false);
  const step = STEPS[active];
  const playing = inView && !hovered;

  const next = () => setActive((current) => (current + 1) % STEPS.length);

  return (
    <section ref={ref} className="relative overflow-hidden bg-[#ff4b12] px-4 py-16 text-white sm:px-5 md:py-24">
      <div className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full border-[48px] border-white/10" />
      <div className="pointer-events-none absolute -bottom-32 left-10 h-80 w-80 rounded-full bg-[#ffb36d]/30 blur-[90px]" />

      <div className="relative mx-auto max-w-[1200px]">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-4xl font-black leading-[0.95] tracking-[-0.055em] md:text-6xl">How it works</h2>
          <p className="mx-auto mt-4 max-w-xl text-sm font-semibold leading-7 text-white/85 md:text-base">
            Six simple steps from your first call to your first lecture. We're with you at every one.
          </p>
        </div>

        <div
          className="mt-12 grid gap-6 lg:grid-cols-[1.25fr_0.75fr]"
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
        >
          {/* The story card */}
          <div className="rounded-[32px] bg-white p-6 text-[#071f50] shadow-[0_40px_90px_rgba(122,30,0,0.3)] md:p-9">
            <div className="flex gap-1.5" aria-hidden="true">
              {STEPS.map((item, index) => (
                <span key={item.title} className="h-1.5 flex-1 overflow-hidden rounded-full bg-[#fff1ea]">
                  {index < active && <span className="block h-full w-full bg-[#ff4b12]" />}
                  {index === active && (
                    <span
                      key={active}
                      className="zaifan-story-bar block h-full bg-[#ff4b12]"
                      style={{ animationDuration: `${STEP_SECONDS}s`, animationPlayState: playing ? "running" : "paused" }}
                      onAnimationEnd={next}
                    />
                  )}
                </span>
              ))}
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={active}
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                className="mt-8"
              >
                <div className="flex flex-wrap items-center gap-4">
                  <motion.span
                    initial={{ rotate: -20, scale: 0.6 }}
                    animate={{ rotate: 0, scale: 1 }}
                    transition={{ type: "spring", stiffness: 260, damping: 14 }}
                    className="grid h-16 w-16 place-items-center rounded-[22px] bg-[#ff4b12] text-white shadow-[0_16px_34px_rgba(255,75,18,0.35)]"
                  >
                    <step.icon size={30} strokeWidth={2.4} />
                  </motion.span>
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.16em] text-[#7a879c]">
                      Step {active + 1} of {STEPS.length}
                    </p>
                    <h3 className="text-3xl font-black tracking-[-0.05em] md:text-4xl">{step.title}</h3>
                  </div>
                  <span className="rounded-full bg-[#fff1ea] px-3 py-1.5 text-xs font-black text-[#ff4b12] sm:ml-auto">{step.when}</span>
                </div>

                <div className="mt-8 grid gap-4 sm:grid-cols-2">
                  <div className="rounded-[24px] bg-[#fff7ed] p-5 ring-1 ring-orange-100">
                    <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[#7a879c]">You</p>
                    <p className="mt-2 text-base font-black leading-6">{step.you}</p>
                  </div>
                  <div className="rounded-[24px] bg-[#071f50] p-5 text-white">
                    <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[#ffb36d]">We</p>
                    <p className="mt-2 text-base font-black leading-6">{step.we}</p>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* All steps */}
          <ol className="grid gap-2">
            {STEPS.map((item, index) => {
              const current = index === active;
              return (
                <li key={item.title}>
                  <button
                    type="button"
                    onClick={() => setActive(index)}
                    aria-current={current ? "step" : undefined}
                    className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left transition ${
                      current ? "bg-[#071f50] shadow-[0_16px_36px_rgba(7,31,80,0.3)]" : "bg-white/[0.12] hover:bg-white/20"
                    }`}
                  >
                    <span
                      className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl text-sm font-black ${
                        current ? "bg-[#ff4b12]" : index < active ? "bg-white text-[#ff4b12]" : "bg-white/15"
                      }`}
                    >
                      {index + 1}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-black">{item.title}</span>
                      <span className="block truncate text-[11px] font-bold text-white/70">{item.when}</span>
                    </span>
                    {current && <Plane size={16} className="ml-auto shrink-0 text-[#ff7b1c]" fill="currentColor" />}
                  </button>
                </li>
              );
            })}
          </ol>
        </div>
      </div>
    </section>
  );
}

export default HowItWorks;
