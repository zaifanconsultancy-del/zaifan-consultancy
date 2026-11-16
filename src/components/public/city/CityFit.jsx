import { useState } from "react";
import { Check, RotateCcw, ThumbsUp } from "lucide-react";

import StepIntro from "../guide/StepIntro";
import { CITY_STEPS } from "../../../data/countries/cityGuides";

function verdictFor(wants, fine, good, consider, name) {
  if (!wants && !fine) return { tone: "idle", title: "Tap the lines above", text: "Your result shows up here as soon as you tap something." };
  const worries = consider - fine;
  if (wants >= Math.ceil(good / 2) && worries === 0) return { tone: "green", title: "Strong fit", text: `${name} gives you what you want and nothing here puts you off. Keep going.` };
  if (wants >= Math.ceil(good / 2)) {
    return { tone: "amber", title: "Good fit, with homework", text: `${worries} thing${worries === 1 ? "" : "s"} to think about first. Step 5 shows you cities where ${worries === 1 ? "it is" : "they are"} easier.` };
  }
  if (!wants && fine) return { tone: "amber", title: "Nothing puts you off", text: `But nothing pulls you to ${name} either. Compare it with the other cities in step 5.` };
  return { tone: "amber", title: "Maybe not your city", text: `${name} is known for other things. Compare it with the other cities in step 5, or ask us.` };
}

const TONES = {
  idle: { bar: "bg-[#c9d0dc]", text: "text-[#7a879c]" },
  green: { bar: "bg-emerald-500", text: "text-emerald-700" },
  amber: { bar: "bg-amber-400", text: "text-amber-700" },
};

function Statement({ text, picked, onToggle }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={picked}
      className={`flex w-full items-start gap-3 rounded-2xl px-3.5 py-3 text-left text-sm font-bold leading-6 ring-1 transition ${
        picked ? "bg-emerald-50 text-emerald-900 ring-emerald-300" : "bg-[#fffaf5] text-[#071f50] ring-orange-100 hover:ring-[#ff4b12]/40"
      }`}
    >
      <span
        className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-md border-2 transition ${
          picked ? "border-emerald-500 bg-emerald-500 text-white" : "border-[#c9d0dc] bg-white"
        }`}
      >
        {picked && <Check size={13} strokeWidth={4} />}
      </span>
      {text}
    </button>
  );
}

/** Step 1: tick what you want and what you can live with; get an honest verdict. */
function CityFit({ city }) {
  const good = city.fit?.good || [];
  const consider = city.fit?.consider || [];
  const [wants, setWants] = useState([]);
  const [fine, setFine] = useState([]);

  const toggle = (list, setList, item) => setList(list.includes(item) ? list.filter((value) => value !== item) : [...list, item]);
  const verdict = verdictFor(wants.length, fine.length, good.length, consider.length, city.name);
  const tone = TONES[verdict.tone];
  const answered = wants.length + fine.length;

  return (
    <section id="fit" className="scroll-mt-20 bg-[#ff4b12] px-4 pb-20 pt-10 text-white sm:px-5 md:pb-28 md:pt-14">
      <div className="mx-auto max-w-[1350px]">
        <StepIntro
          step={1}
          steps={CITY_STEPS}
          tone="orange"
          title={`Is ${city.name}`}
          accent="right for you?"
          text={`Every city suits some students and not others. Here is who ${city.name} is good for, and what you should think about first.`}
          howTo="Tap every line that is true for you. Your result appears underneath."
        />

        <div className="mt-10 rounded-[30px] bg-white p-4 text-[#071f50] shadow-[0_30px_70px_rgba(7,31,80,0.25)] sm:p-6 md:p-8">
          <div className="grid gap-6 md:grid-cols-2 md:gap-8">
            <div>
              <p className="font-mono text-[11px] font-black uppercase tracking-[0.14em] text-emerald-600">I want this</p>
              <h3 className="mt-1 text-xl font-black tracking-[-0.03em]">{city.name} is good for</h3>
              <div className="mt-4 grid gap-2">
                {good.map((item) => (
                  <Statement key={item} text={item} picked={wants.includes(item)} onToggle={() => toggle(wants, setWants, item)} />
                ))}
              </div>
            </div>
            <div>
              <p className="font-mono text-[11px] font-black uppercase tracking-[0.14em] text-[#ff4b12]">I can live with this</p>
              <h3 className="mt-1 text-xl font-black tracking-[-0.03em]">Think about these first</h3>
              <div className="mt-4 grid gap-2">
                {consider.map((item) => (
                  <Statement key={item} text={item} picked={fine.includes(item)} onToggle={() => toggle(fine, setFine, item)} />
                ))}
              </div>
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-4 rounded-[22px] bg-[#fff7ed] p-4 sm:flex-row sm:items-center sm:p-5" aria-live="polite">
            <span className={`h-2 w-full shrink-0 rounded-full sm:h-14 sm:w-2 ${tone.bar}`} />
            <div className="min-w-0 flex-1">
              <p className={`font-mono text-[11px] font-black uppercase tracking-[0.14em] ${tone.text}`}>Your result</p>
              <p className="mt-0.5 text-xl font-black tracking-[-0.03em]">{verdict.title}</p>
              <p className="mt-1 text-sm font-semibold leading-6 text-[#5f6f89]">{verdict.text}</p>
            </div>
            {answered > 0 && (
              <button
                type="button"
                onClick={() => {
                  setWants([]);
                  setFine([]);
                }}
                className="inline-flex shrink-0 items-center gap-2 self-start rounded-full bg-white px-4 py-2.5 text-xs font-black ring-1 ring-orange-100 transition hover:text-[#ff4b12] sm:self-center"
              >
                <RotateCcw size={14} strokeWidth={3} /> Start again
              </button>
            )}
          </div>
        </div>

        {city.highlights.length > 0 && (
          <div className="mt-12">
            <p className="flex items-center gap-2 font-mono text-[11px] font-black uppercase tracking-[0.16em] text-[#ffd9c7]">
              <ThumbsUp size={14} /> What {city.name} is known for
            </p>
            <div className={`mt-4 grid gap-3 sm:grid-cols-2 ${city.highlights.length === 3 ? "lg:grid-cols-3" : "lg:grid-cols-4"}`}>
              {city.highlights.slice(0, 4).map((item, index) => (
                <div key={item.title} className="rounded-[22px] bg-[#071f50]/20 p-5 ring-1 ring-white/15">
                  <span className="font-mono text-xs font-black text-[#ffd9c7]">0{index + 1}</span>
                  <h3 className="mt-2 text-lg font-black leading-6 tracking-[-0.03em]">{item.title}</h3>
                  <p className="mt-2 text-sm font-semibold leading-6 text-white/85">{item.text}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

export default CityFit;
