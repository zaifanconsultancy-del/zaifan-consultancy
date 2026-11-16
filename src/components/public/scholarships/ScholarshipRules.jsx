import { Link } from "react-router-dom";
import { AlertTriangle, ArrowRight } from "lucide-react";

import StepIntro from "../guide/StepIntro";
import { COMMON_MISTAKES, HONEST_RULES, SCHOLARSHIP_STEPS } from "../../../data/countries/scholarshipFinder";

/** Step 3: what is true for every scholarship, and the mistakes that lose them. */
function ScholarshipRules({ appointmentPath }) {
  return (
    <section id="rules" className="scroll-mt-20 bg-[#071f50] px-4 pb-20 pt-10 text-white sm:px-5 md:pb-28 md:pt-14">
      <div className="mx-auto max-w-[1350px]">
        <StepIntro
          step={3}
          steps={SCHOLARSHIP_STEPS}
          tone="navy"
          title="Four things nobody"
          accent="tells you first."
          text="These are true for every scholarship on this page, in every country. Read them before you plan your budget."
        />

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {HONEST_RULES.map((rule, index) => (
            <div key={rule.title} className="rounded-[24px] bg-white/[0.06] p-5 ring-1 ring-white/10 md:p-6">
              <span className="font-mono text-4xl font-black tracking-[-0.04em] text-[#ff7b1c]">{index + 1}</span>
              <h3 className="mt-3 text-xl font-black leading-6 tracking-[-0.03em]">{rule.title}</h3>
              <p className="mt-2 text-sm font-semibold leading-6 text-white/70">{rule.text}</p>
            </div>
          ))}
        </div>

        <div className="mt-5 grid gap-5 lg:grid-cols-[1.3fr_1fr]">
          <div className="rounded-[24px] bg-white p-5 text-[#071f50] md:p-7">
            <p className="flex items-center gap-2 font-mono text-[11px] font-black uppercase tracking-[0.14em] text-[#ff4b12]">
              <AlertTriangle size={15} /> Mistakes that cost students the money
            </p>
            <ol className="mt-4 grid gap-3">
              {COMMON_MISTAKES.map((mistake, index) => (
                <li key={mistake} className="flex items-start gap-3 text-[15px] font-bold leading-6">
                  <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[#fff1ea] font-mono text-[11px] font-black text-[#ff4b12]">{index + 1}</span>
                  {mistake}
                </li>
              ))}
            </ol>
          </div>

          <div className="flex flex-col justify-between gap-6 rounded-[24px] bg-[#ff4b12] p-5 md:p-7">
            <div>
              <h3 className="text-2xl font-black leading-7 tracking-[-0.03em]">Want an honest answer about your chances?</h3>
              <p className="mt-2 text-sm font-semibold leading-6 text-white/90">
                Send us your marks and budget. We tell you which scholarships are realistic for you, which are not, and what to prepare first. The first
                call is free.
              </p>
            </div>
            <Link
              to={appointmentPath}
              className="inline-flex w-fit items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-black text-[#071f50] transition hover:bg-[#071f50] hover:text-white"
            >
              Book a free scholarship call <ArrowRight size={16} strokeWidth={3} />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

export default ScholarshipRules;
