import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { AlertTriangle, ArrowRight, BadgeCheck, Check, FileCheck2, Plane, Printer } from "lucide-react";

import StepIntro from "./StepIntro";
import { formatMonth, formatRange, scheduleFor, upcomingIntakes } from "./guideDates";

const STATUS = {
  done: { label: "Should be done by now", dot: "border-emerald-500 bg-emerald-500 text-white", chip: "bg-emerald-100 text-emerald-800" },
  now: { label: "Do this now", dot: "border-[#ff4b12] bg-[#ff4b12] text-white", chip: "bg-[#ff4b12] text-white" },
  next: { label: null, dot: "border-[#071f50]/20 bg-white text-[#071f50]", chip: "" },
};

function Timeline({ phases }) {
  return (
    <ol className="relative mt-8">
      <span aria-hidden="true" className="absolute bottom-6 left-[18px] top-6 w-1 rounded-full bg-[#071f50]/10 md:left-[222px]" />
      {phases.map((phase, index) => {
        const status = STATUS[phase.status] || STATUS.next;
        return (
          <motion.li
            key={phase.phase}
            initial={{ opacity: 0, x: -16 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ delay: index * 0.05 }}
            className="relative grid grid-cols-[40px_1fr] gap-x-4 pb-6 md:grid-cols-[180px_40px_1fr] md:gap-x-6"
          >
            <p className="col-start-2 font-mono text-sm font-black text-[#ff4b12] md:col-start-1 md:row-start-1 md:pt-2.5 md:text-right">
              {phase.range ? formatRange(phase.range.start, phase.range.end) : "Right after the step above"}
            </p>
            <span
              className={`relative z-10 col-start-1 row-span-2 row-start-1 grid h-10 w-10 place-items-center rounded-full border-4 font-mono text-sm font-black md:col-start-2 ${status.dot}`}
            >
              {phase.status === "now" && <span className="absolute inset-0 animate-ping rounded-full bg-[#ff4b12]/40" />}
              {phase.status === "done" ? <Check size={16} strokeWidth={4} /> : index + 1}
            </span>
            <div className="col-start-2 rounded-[20px] bg-white p-4 ring-1 ring-orange-100 md:col-start-3 md:row-start-1 md:p-5">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-lg font-black tracking-[-0.02em]">{phase.phase}</h3>
                {status.label && <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-black ${status.chip}`}>{status.label}</span>}
              </div>
              {phase.relative && <p className="mt-0.5 text-xs font-bold text-[#7a879c]">{phase.relative}</p>}
              {!phase.range && <p className="mt-0.5 text-xs font-bold text-[#7a879c]">{phase.timing}</p>}
              <p className="mt-2 text-sm font-semibold leading-6 text-[#5f6f89]">{phase.text}</p>
            </div>
          </motion.li>
        );
      })}
    </ol>
  );
}

function BulletList({ items }) {
  return (
    <ul className="grid gap-2.5">
      {items.map((item) => (
        <li key={item} className="flex gap-2.5 text-sm font-semibold leading-6 text-[#526178]">
          <BadgeCheck size={17} className="mt-0.5 shrink-0 text-[#ff4b12]" />
          {item}
        </li>
      ))}
    </ul>
  );
}

/** Step 6: pick a start date; every step becomes real months, then what to prepare and the visa. */
function ApplyRoute({ country, appointmentPath }) {
  const today = useMemo(() => new Date(), []);
  const { options, suggested } = upcomingIntakes(country.quickFacts.intakes, today);
  const [intake, setIntake] = useState(suggested.index);
  const phases = scheduleFor(country.timeline, intake, today);
  const late = phases.filter((phase) => phase.status === "done").length;
  const requirements = country.requirements || {};

  const tabs = [
    requirements.bachelor && { id: "bachelor", label: "Bachelor's", items: requirements.bachelor },
    requirements.master && { id: "master", label: "Master's", items: requirements.master },
    country.admissionSteps && { id: "steps", label: "How applying works", steps: country.admissionSteps },
  ].filter(Boolean);
  const [tabId, setTabId] = useState(tabs[0]?.id);
  const tab = tabs.find((item) => item.id === tabId) || tabs[0];

  return (
    <section id="apply" className="scroll-mt-20 bg-[#fff7ed] px-4 pb-16 pt-10 text-[#071f50] sm:px-5 md:pb-20 md:pt-14">
      <div className="mx-auto max-w-[1350px]">
        <StepIntro
          step={6}
          title="From application"
          accent="to arrival."
          howTo="Pick when you want to start. Every step turns into real months, and the orange step is where you should be today."
        />

        <div className="mt-10 flex flex-wrap items-center gap-2">
          <span className="mr-1 text-sm font-black">I want to start in:</span>
          {options.map((option) => {
            const active = option.index === intake;
            return (
              <button
                key={option.index}
                type="button"
                onClick={() => setIntake(option.index)}
                aria-pressed={active}
                className={`rounded-full px-4 py-2.5 text-sm font-black ring-1 transition ${
                  active ? "bg-[#071f50] text-white ring-[#071f50]" : "bg-white ring-orange-100 hover:ring-[#ff4b12]"
                }`}
              >
                {formatMonth(option.index)}
                <span className={`ml-2 font-mono text-[11px] ${active ? "text-[#ffb36d]" : "text-[#9aa5b8]"}`}>
                  {option.rushed ? "too soon for most" : `in ${option.monthsAway} months`}
                </span>
              </button>
            );
          })}
        </div>

        {late > 0 && (
          <p className="mt-5 flex max-w-3xl items-start gap-3 rounded-2xl bg-amber-50 px-4 py-3 text-sm font-bold leading-6 text-amber-900 ring-1 ring-amber-200">
            <AlertTriangle size={18} className="mt-0.5 shrink-0 text-amber-600" />
            For {formatMonth(intake)}, {late === 1 ? "one step should" : `${late} steps should`} already be done. Not started? You can still catch up with
            help, or plan for the intake after.
          </p>
        )}

        <Timeline phases={phases} />

        <div className="mt-10 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-[28px] bg-white p-5 shadow-[0_20px_50px_rgba(7,31,80,0.07)] ring-1 ring-orange-100 sm:p-7">
            <h3 className="text-2xl font-black tracking-[-0.04em]">What they'll ask from you</h3>
            <div className="mt-4 flex flex-wrap gap-2" role="tablist">
              {tabs.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  role="tab"
                  aria-selected={item.id === tab.id}
                  onClick={() => setTabId(item.id)}
                  className={`rounded-full px-4 py-2 text-sm font-black transition ${
                    item.id === tab.id ? "bg-[#ff4b12] text-white" : "bg-[#fff1ea] text-[#071f50] hover:bg-[#ffe2d3]"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
            <div className="mt-5" role="tabpanel">
              {tab?.items && <BulletList items={tab.items} />}
              {tab?.steps && (
                <ol className="grid gap-3">
                  {tab.steps.map((step, index) => (
                    <li key={step.title} className="flex gap-3">
                      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[#071f50] font-mono text-xs font-black text-white">{index + 1}</span>
                      <div>
                        <p className="text-sm font-black">{step.title}</p>
                        <p className="mt-0.5 text-sm font-semibold leading-6 text-[#5f6f89]">{step.text}</p>
                      </div>
                    </li>
                  ))}
                </ol>
              )}
            </div>

            {requirements.language?.length > 0 && (
              <div className="mt-6 border-t border-orange-100 pt-5">
                <p className="font-mono text-[11px] font-black uppercase tracking-[0.14em] text-[#ff4b12]">Language tests</p>
                <dl className="mt-3 grid gap-2 sm:grid-cols-2">
                  {requirements.language.map((item) => (
                    <div key={item.test} className="rounded-2xl bg-[#fff7ed] p-3">
                      <dt className="text-sm font-black">{item.test}</dt>
                      <dd className="mt-0.5 text-xs font-semibold leading-5 text-[#7a879c]">{item.note}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            )}

            {requirements.documents?.length > 0 && (
              <div className="mt-6 border-t border-orange-100 pt-5">
                <p className="font-mono text-[11px] font-black uppercase tracking-[0.14em] text-[#ff4b12]">Papers for your application</p>
                <div className="mt-3">
                  <BulletList items={requirements.documents} />
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-5">
            <div className="rounded-[28px] bg-[#071f50] p-5 text-white shadow-[0_24px_60px_rgba(7,31,80,0.22)] sm:p-7">
              <p className="flex items-center gap-2 font-mono text-[11px] font-black uppercase tracking-[0.14em] text-[#ffb36d]">
                <Plane size={14} /> Your visa
              </p>
              <h3 className="mt-2 text-2xl font-black tracking-[-0.04em]">{country.visa.name}</h3>
              <p className="mt-2 text-sm font-semibold leading-6 text-white/75">{country.visa.summary}</p>
              {country.visa.steps?.length > 0 && (
                <ol className="mt-5 grid gap-2.5">
                  {country.visa.steps.map((step, index) => (
                    <li key={step} className="flex gap-3 text-sm font-semibold leading-6 text-white/90">
                      <span className="mt-0.5 font-mono text-xs font-black text-[#ff7b1c]">0{index + 1}</span>
                      {step}
                    </li>
                  ))}
                </ol>
              )}
              {country.visa.documents?.length > 0 && (
                <div className="mt-5 rounded-2xl bg-white/[0.07] p-4 ring-1 ring-white/10">
                  <p className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.12em] text-[#ffb36d]">
                    <FileCheck2 size={14} /> For the visa appointment
                  </p>
                  <ul className="mt-2.5 grid gap-1.5">
                    {country.visa.documents.map((doc) => (
                      <li key={doc} className="flex gap-2 text-sm font-semibold leading-6 text-white/85">
                        <Check size={15} strokeWidth={3} className="mt-1 shrink-0 text-[#ff7b1c]" />
                        {doc}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="rounded-[28px] border-2 border-dashed border-[#071f50]/20 bg-white p-5 sm:p-6">
              <p className="flex items-center gap-2 text-lg font-black tracking-[-0.02em]">
                <Printer size={19} className="text-[#ff4b12]" /> Your printable {country.name} checklist
              </p>
              <p className="mt-1.5 text-sm font-semibold leading-6 text-[#5f6f89]">
                Every paper, where to get it, and which ones we prepare for you, on Zaifan letterhead with your name.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Link
                  to={`/countries?checklist=${country.slug}#documents`}
                  className="inline-flex items-center gap-2 rounded-full bg-[#ff4b12] px-5 py-3 text-sm font-black text-white transition hover:bg-[#ff642f]"
                >
                  Open my checklist <ArrowRight size={16} strokeWidth={3} />
                </Link>
                <Link
                  to={appointmentPath}
                  className="inline-flex items-center gap-2 rounded-full bg-[#fff1ea] px-5 py-3 text-sm font-black text-[#071f50] transition hover:bg-[#ffe2d3]"
                >
                  Or let us do it with you
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default ApplyRoute;
