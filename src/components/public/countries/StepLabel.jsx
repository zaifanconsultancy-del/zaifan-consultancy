import { STEPS } from "./countriesData";

/** "Step 2 of 4 · Compare" with a dot per step, so visitors always know where they are. */
function StepLabel({ step, tone = "light" }) {
  const dark = tone === "dark";
  const current = STEPS[step - 1];

  return (
    <div
      className={`inline-flex flex-wrap items-center gap-3 rounded-full px-4 py-2 font-mono text-[11px] font-black uppercase tracking-[0.16em] ${
        dark ? "bg-white/[0.08] text-white ring-1 ring-white/10" : "bg-[#071f50] text-white"
      }`}
    >
      <span className="flex gap-1" aria-hidden="true">
        {STEPS.map((item, index) => (
          <span key={item.id} className={`h-1.5 rounded-full ${index < step ? "w-4 bg-[#ff7b1c]" : "w-1.5 bg-white/25"}`} />
        ))}
      </span>
      <span>
        Step {step} of {STEPS.length} · <span className="text-[#ffb36d]">{current.label}</span>
      </span>
    </div>
  );
}

export default StepLabel;
