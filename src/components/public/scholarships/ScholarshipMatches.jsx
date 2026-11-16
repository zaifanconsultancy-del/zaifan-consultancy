import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight, ArrowUpRight, Check, Minus, SlidersHorizontal } from "lucide-react";

import StepIntro from "../guide/StepIntro";
import { FlagMark } from "../destinations/DestinationUI";
import { COVERAGE, LEVELS, SCHOLARSHIP_STEPS } from "../../../data/countries/scholarshipFinder";

const PAGE_SIZE = 6;

function planPath(scholarship) {
  const country = scholarship.shared ? "" : scholarship.country.name;
  return `/appointment?country=${encodeURIComponent(country)}&service=${encodeURIComponent("Scholarship Guidance")}&message=${encodeURIComponent(
    `I want help applying for: ${scholarship.name}.`,
  )}`;
}

/** One scholarship as a ticket: the country on the stub, what it can pay for as ticks. */
function Ticket({ scholarship }) {
  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ duration: 0.25 }}
      className="relative flex overflow-hidden rounded-[22px] bg-white shadow-[0_18px_45px_rgba(7,31,80,0.08)] ring-1 ring-orange-100"
    >
      <div className="flex w-[76px] shrink-0 flex-col items-center justify-center gap-2 bg-[#071f50] px-2 py-4 text-center sm:w-[92px]">
        <FlagMark country={scholarship.country} className="h-7 w-[42px] rounded-[4px]" />
        <span className="font-mono text-[10px] font-black uppercase leading-4 tracking-[0.1em] text-[#ffb36d]">{scholarship.country.name}</span>
      </div>

      {/* Perforation between stub and body, with notches cut from the page colour */}
      <div aria-hidden="true" className="relative w-0 border-l-2 border-dashed border-[#071f50]/15">
        <span className="absolute -left-[11px] -top-[11px] h-5 w-5 rounded-full bg-[#fff7ed]" />
        <span className="absolute -bottom-[11px] -left-[11px] h-5 w-5 rounded-full bg-[#fff7ed]" />
      </div>

      <div className="flex min-w-0 flex-1 flex-col p-5 sm:p-6">
        <span className="w-fit rounded-full bg-[#fff1ea] px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-[#ff4b12]">For {scholarship.level}</span>
        <h3 className="mt-3 text-xl font-black leading-tight tracking-[-0.03em]">{scholarship.name}</h3>
        <p className="mt-1 text-xs font-bold text-[#7a879c]">{scholarship.provider}</p>

        <ul className="mt-4 grid grid-cols-2 gap-x-3 gap-y-1.5" aria-label="What it can pay for">
          {COVERAGE.map((cover) => {
            const yes = scholarship.coverage.includes(cover.id);
            return (
              <li key={cover.id} className={`flex items-center gap-2 text-[13px] font-black ${yes ? "text-[#071f50]" : "text-[#b6bfcd]"}`}>
                <span className={`grid h-5 w-5 shrink-0 place-items-center rounded-full ${yes ? "bg-emerald-500 text-white" : "bg-[#eef1f7] text-[#b6bfcd]"}`}>
                  {yes ? <Check size={12} strokeWidth={4} /> : <Minus size={12} strokeWidth={4} />}
                </span>
                {cover.short}
              </li>
            );
          })}
        </ul>

        <p className="mt-4 rounded-2xl bg-[#fff7ed] px-3.5 py-2.5 text-sm font-black leading-6 ring-1 ring-orange-100">{scholarship.covers}</p>
        <p className="mt-3 text-sm font-semibold leading-6 text-[#5f6f89]">{scholarship.note}</p>

        <div className="mt-auto flex flex-wrap items-center gap-2 pt-5">
          <Link
            to={planPath(scholarship)}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-[#071f50] px-4 py-3 text-xs font-black text-white transition hover:bg-[#ff4b12]"
          >
            Help me apply <ArrowRight size={14} strokeWidth={3} />
          </Link>
          {scholarship.link && (
            <a
              href={scholarship.link}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 rounded-full bg-[#fff1ea] px-4 py-3 text-xs font-black text-[#ff4b12] ring-1 ring-orange-100 transition hover:bg-[#ff4b12] hover:text-white"
            >
              Official page <ArrowUpRight size={13} strokeWidth={3} />
            </a>
          )}
        </div>
      </div>
    </motion.article>
  );
}

/** Step 2: the scholarships that fit the three answers, paged. */
function ScholarshipMatches({ results, filters, countries, onReset }) {
  const topRef = useRef(null);
  // The page number belongs to one set of answers; new answers start at page 1.
  const answersKey = JSON.stringify(filters);
  const [paging, setPaging] = useState({ key: answersKey, page: 0 });
  const pages = Math.max(Math.ceil(results.length / PAGE_SIZE), 1);
  const current = paging.key === answersKey ? Math.min(paging.page, pages - 1) : 0;
  const shown = results.slice(current * PAGE_SIZE, current * PAGE_SIZE + PAGE_SIZE);

  const goToPage = (next) => {
    setPaging({ key: answersKey, page: next });
    topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const answers = [
    filters.needs.length ? `Pays for: ${COVERAGE.filter((item) => filters.needs.includes(item.id)).map((item) => item.short).join(" + ")}` : "Pays for: anything",
    filters.level === "all" ? "Any degree" : LEVELS.find((item) => item.id === filters.level)?.label,
    filters.country === "all" ? "Any country" : countries.find((item) => item.slug === filters.country)?.name,
  ];

  return (
    <section id="matches" className="scroll-mt-20 bg-[#fff7ed] px-4 pb-20 pt-10 text-[#071f50] sm:px-5 md:pb-28 md:pt-14">
      <div className="mx-auto max-w-[1350px]">
        <StepIntro
          step={2}
          steps={SCHOLARSHIP_STEPS}
          title={results.length === 1 ? "1 scholarship" : `${results.length} scholarships`}
          accent="that fit you."
          howTo="A green tick means the scholarship can pay for that. A grey dash means it usually does not. Read the note before you get your hopes up."
        />

        <div ref={topRef} className="mt-8 flex scroll-mt-28 flex-wrap items-center gap-2">
          <span className="font-mono text-[11px] font-black uppercase tracking-[0.14em] text-[#7a879c]">Your answers</span>
          {answers.map((answer) => (
            <span key={answer} className="rounded-full bg-white px-3.5 py-2 text-xs font-black ring-1 ring-orange-100">
              {answer}
            </span>
          ))}
          <a href="#pick" className="inline-flex items-center gap-1.5 rounded-full bg-[#071f50] px-3.5 py-2 text-xs font-black text-white transition hover:bg-[#ff4b12]">
            <SlidersHorizontal size={13} /> Change
          </a>
        </div>

        {results.length > 0 ? (
          <>
            {pages > 1 && (
              <p className="mt-6 font-mono text-xs font-black uppercase tracking-[0.14em] text-[#7a879c]">
                Page {current + 1} of {pages}
              </p>
            )}
            <motion.div layout className="mt-4 grid gap-5 lg:grid-cols-2">
              <AnimatePresence mode="popLayout">
                {shown.map((scholarship) => (
                  <Ticket key={scholarship.key} scholarship={scholarship} />
                ))}
              </AnimatePresence>
            </motion.div>

            {pages > 1 && (
              <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => goToPage(current - 1)}
                  disabled={current === 0}
                  className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-black ring-1 ring-orange-100 transition hover:text-[#ff4b12] disabled:opacity-40"
                >
                  <ArrowLeft size={16} strokeWidth={3} /> Previous
                </button>
                <span className="font-mono text-sm font-black text-[#7a879c]">
                  Page {current + 1} of {pages}
                </span>
                <button
                  type="button"
                  onClick={() => goToPage(current + 1)}
                  disabled={current === pages - 1}
                  className="inline-flex items-center gap-2 rounded-full bg-[#071f50] px-5 py-3 text-sm font-black text-white transition hover:bg-[#ff4b12] disabled:opacity-40"
                >
                  Next page <ArrowRight size={16} strokeWidth={3} />
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="mt-6 rounded-[26px] bg-white p-8 text-center ring-1 ring-orange-100">
            <p className="text-2xl font-black tracking-[-0.03em]">Nothing fits all of that.</p>
            <p className="mx-auto mt-2 max-w-lg text-sm font-semibold leading-6 text-[#5f6f89]">
              Very few scholarships pay for everything. Try asking for less, or pick “Any country”. Many universities also have their own awards that
              are not listed here, so ask us.
            </p>
            <button
              type="button"
              onClick={onReset}
              className="mt-5 inline-flex items-center gap-2 rounded-full bg-[#071f50] px-5 py-3 text-sm font-black text-white transition hover:bg-[#ff4b12]"
            >
              Show every scholarship
            </button>
          </div>
        )}
      </div>
    </section>
  );
}

export default ScholarshipMatches;
