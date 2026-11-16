import { ArrowDown, BedDouble, Check, GraduationCap, Plane, RotateCcw, Wallet } from "lucide-react";

import StepIntro from "../guide/StepIntro";
import { FlagMark } from "../destinations/DestinationUI";
import { COVERAGE, LEVELS, SCHOLARSHIP_STEPS } from "../../../data/countries/scholarshipFinder";

const COVER_ICONS = { tuition: GraduationCap, living: Wallet, housing: BedDouble, travel: Plane };

function Question({ number, title, hint, children }) {
  return (
    <div className="rounded-[26px] bg-white p-5 text-[#071f50] shadow-[0_24px_60px_rgba(7,31,80,0.2)] md:p-6">
      <p className="font-mono text-[11px] font-black uppercase tracking-[0.14em] text-[#ff4b12]">Question {number} of 3</p>
      <h3 className="mt-1 text-2xl font-black tracking-[-0.04em]">{title}</h3>
      <p className="mt-1 text-sm font-semibold text-[#7a879c]">{hint}</p>
      <div className="mt-4">{children}</div>
    </div>
  );
}

function Choice({ picked, onClick, children, className = "" }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={picked}
      className={`inline-flex items-center gap-2 rounded-2xl px-3.5 py-3 text-left text-sm font-black ring-1 transition ${
        picked ? "bg-[#071f50] text-white ring-[#071f50]" : "bg-[#fffaf5] text-[#071f50] ring-orange-100 hover:ring-[#ff4b12]/50"
      } ${className}`}
    >
      {children}
    </button>
  );
}

/** Step 1: three plain questions. Every answer updates the count straight away. */
function ScholarshipPicker({ filters, setFilters, countries, count }) {
  const { needs, level, country } = filters;
  const toggleNeed = (id) => setFilters({ ...filters, needs: needs.includes(id) ? needs.filter((item) => item !== id) : [...needs, id] });
  const changed = needs.length > 0 || level !== "all" || country !== "all";

  return (
    <section id="pick" className="scroll-mt-20 bg-[#ff4b12] px-4 pb-20 pt-10 text-white sm:px-5 md:pb-28 md:pt-14">
      <div className="mx-auto max-w-[1350px]">
        <StepIntro
          step={1}
          steps={SCHOLARSHIP_STEPS}
          tone="orange"
          title="What do you need"
          accent="a scholarship to pay?"
          text="Answer three quick questions. Skip any you are not sure about."
          howTo="Tap your answers. The number at the bottom shows how many scholarships fit."
        />

        <div className="mt-10 grid gap-4 lg:grid-cols-3">
          <Question number={1} title="What should it pay for?" hint="Pick everything you need. Fewer picks gives more results.">
            <div className="grid grid-cols-2 gap-2 lg:grid-cols-1">
              {COVERAGE.map((item) => {
                const Icon = COVER_ICONS[item.id];
                const picked = needs.includes(item.id);
                return (
                  <Choice key={item.id} picked={picked} onClick={() => toggleNeed(item.id)}>
                    <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-lg ${picked ? "bg-white/15" : "bg-[#fff1ea] text-[#ff4b12]"}`}>
                      {picked ? <Check size={15} strokeWidth={4} /> : <Icon size={15} />}
                    </span>
                    {item.label}
                  </Choice>
                );
              })}
            </div>
          </Question>

          <Question number={2} title="What will you study?" hint="The degree you are applying for next.">
            <div className="grid gap-2">
              {LEVELS.map((item) => (
                <Choice key={item.id} picked={level === item.id} onClick={() => setFilters({ ...filters, level: level === item.id ? "all" : item.id })}>
                  {item.label}
                </Choice>
              ))}
              <Choice picked={level === "all"} onClick={() => setFilters({ ...filters, level: "all" })}>
                Not sure yet
              </Choice>
            </div>
          </Question>

          <Question number={3} title="Which country?" hint="Leave it on “Any country” to compare them all.">
            <div className="grid grid-cols-2 gap-2">
              <Choice picked={country === "all"} onClick={() => setFilters({ ...filters, country: "all" })} className="col-span-2">
                Any country
              </Choice>
              {countries.map((item) => (
                <Choice key={item.slug} picked={country === item.slug} onClick={() => setFilters({ ...filters, country: country === item.slug ? "all" : item.slug })}>
                  <FlagMark country={item} className="h-4 w-6 shrink-0 rounded-[3px]" />
                  <span className="truncate">{item.name}</span>
                </Choice>
              ))}
            </div>
          </Question>
        </div>

        <div className="mt-5 flex flex-col items-start justify-between gap-4 rounded-[26px] bg-[#071f50] p-5 sm:flex-row sm:items-center md:p-6" aria-live="polite">
          <p className="text-lg font-black tracking-[-0.02em]">
            <span className="mr-2 font-mono text-4xl tabular-nums tracking-[-0.04em] text-[#ffb36d]">{count}</span>
            {count === 1 ? "scholarship fits" : "scholarships fit"} your answers.
          </p>
          <div className="flex flex-wrap gap-2">
            {changed && (
              <button
                type="button"
                onClick={() => setFilters({ needs: [], level: "all", country: "all" })}
                className="inline-flex items-center gap-2 rounded-full bg-white/10 px-5 py-3 text-sm font-black transition hover:bg-white/20"
              >
                <RotateCcw size={15} strokeWidth={3} /> Start again
              </button>
            )}
            <a href="#matches" className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-black text-[#071f50] transition hover:bg-[#ffb36d]">
              See them <ArrowDown size={16} strokeWidth={3} />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

export default ScholarshipPicker;
