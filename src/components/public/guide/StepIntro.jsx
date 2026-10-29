import { GUIDE_STEPS } from "./guideSteps";

// Colours for each section background: cream, orange or navy.
const TONES = {
  light: {
    pill: "bg-[#071f50] text-white",
    dot: "bg-[#ff7b1c]",
    label: "text-[#ffb36d]",
    accent: "text-[#ff4b12]",
    text: "text-[#5f6f89]",
    howTo: "bg-white text-[#071f50] ring-1 ring-orange-100",
    howToLabel: "text-[#ff4b12]",
  },
  orange: {
    pill: "bg-[#071f50]/25 text-white ring-1 ring-white/15",
    dot: "bg-white",
    label: "text-[#ffd9c7]",
    accent: "text-[#071f50]",
    text: "text-white/85",
    howTo: "bg-[#071f50]/20 text-white",
    howToLabel: "text-[#ffd9c7]",
  },
  navy: {
    pill: "bg-white/[0.08] text-white ring-1 ring-white/10",
    dot: "bg-[#ff7b1c]",
    label: "text-[#ffb36d]",
    accent: "text-[#ff7b1c]",
    text: "text-white/70",
    howTo: "bg-white/[0.07] text-white ring-1 ring-white/10",
    howToLabel: "text-[#ffb36d]",
  },
};

/**
 * The top of every step: "Step 2 of 6 · Money" with a dot per step, a plain
 * headline and one line on how to use the section, so visitors always know
 * where they are and what to do.
 */
function StepIntro({ step, title, accent, text, howTo, tone = "light" }) {
  const colors = TONES[tone] || TONES.light;
  const current = GUIDE_STEPS[step - 1];

  return (
    <div>
      <div className={`inline-flex flex-wrap items-center gap-3 rounded-full px-4 py-2 font-mono text-[11px] font-black uppercase tracking-[0.16em] ${colors.pill}`}>
        <span className="flex gap-1" aria-hidden="true">
          {GUIDE_STEPS.map((item, index) => (
            <span key={item.id} className={`h-1.5 rounded-full ${index < step ? `w-4 ${colors.dot}` : "w-1.5 bg-white/30"}`} />
          ))}
        </span>
        <span>
          Step {step} of {GUIDE_STEPS.length} · <span className={colors.label}>{current.label}</span>
        </span>
      </div>
      <h2 className="mt-5 max-w-4xl text-[2.4rem] font-black leading-[0.95] tracking-[-0.055em] sm:text-5xl md:text-6xl">
        {title}
        {accent && <span className={`block ${colors.accent}`}>{accent}</span>}
      </h2>
      {text && <p className={`mt-4 max-w-2xl text-base font-semibold leading-7 ${colors.text}`}>{text}</p>}
      {howTo && (
        <p className={`mt-4 flex max-w-2xl items-start gap-2.5 rounded-2xl px-4 py-2.5 text-sm font-bold leading-6 ${colors.howTo}`}>
          <span className={`mt-[3px] shrink-0 font-mono text-[10px] font-black uppercase tracking-[0.14em] ${colors.howToLabel}`}>How to use</span>
          {howTo}
        </p>
      )}
    </div>
  );
}

export default StepIntro;
