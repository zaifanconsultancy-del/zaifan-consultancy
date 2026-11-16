import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight } from "lucide-react";

import StepIntro from "../guide/StepIntro";
import UniCard from "../universities/UniCard";
import { useShortlist } from "../universities/useShortlist";
import { CITY_STEPS } from "../../../data/countries/cityGuides";

const PAGE_SIZE = 6;

/** Step 3: every university in this city that has a full profile, paged. */
function CityUniversities({ city, country, universities }) {
  const { has, toggle } = useShortlist();
  const topRef = useRef(null);
  const [page, setPage] = useState(0);
  const pages = Math.ceil(universities.length / PAGE_SIZE);
  const shown = universities.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);
  const count = universities.length;
  // A city without a profile yet still shows where else in the country you could study.
  const elsewhere = count ? [] : country.universities.slice(0, 3);

  const goToPage = (next) => {
    setPage(next);
    topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <section id="universities" className="scroll-mt-20 bg-[#071f50] px-4 pb-20 pt-10 text-white sm:px-5 md:pb-28 md:pt-14">
      <div className="mx-auto max-w-[1350px]">
        <StepIntro
          step={3}
          steps={CITY_STEPS}
          tone="navy"
          title="Where you could study"
          accent={`in ${city.name}.`}
          text={
            count
              ? `${count} ${count === 1 ? "university" : "universities"} in ${city.name} with a full profile: fees, courses, entry rules and how to apply.`
              : `We don't have a full university profile for ${city.name} yet, but we can still plan it with you.`
          }
          howTo={count ? "Open a profile to see fees and entry rules. Tap the heart to save one to your shortlist." : undefined}
        />

        {count > 0 ? (
          <div ref={topRef} className="scroll-mt-28">
            {pages > 1 && (
              <p className="mt-8 font-mono text-xs font-black uppercase tracking-[0.14em] text-white/55">
                Page {page + 1} of {pages} · {count} universities
              </p>
            )}
            <motion.div layout className={`grid gap-5 sm:grid-cols-2 lg:grid-cols-3 ${pages > 1 ? "mt-4" : "mt-10"}`}>
              <AnimatePresence mode="popLayout">
                {shown.map((university) => (
                  <UniCard key={university.key} university={university} tone="dark" saved={has(university.key)} onToggle={toggle} />
                ))}
              </AnimatePresence>
            </motion.div>

            {pages > 1 && (
              <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => goToPage(page - 1)}
                  disabled={page === 0}
                  className="inline-flex items-center gap-2 rounded-full bg-white/10 px-5 py-3 text-sm font-black transition hover:bg-white/20 disabled:opacity-30"
                >
                  <ArrowLeft size={16} strokeWidth={3} /> Previous
                </button>
                <span className="font-mono text-sm font-black text-white/70">
                  Page {page + 1} of {pages}
                </span>
                <button
                  type="button"
                  onClick={() => goToPage(page + 1)}
                  disabled={page === pages - 1}
                  className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-black text-[#071f50] transition hover:bg-[#ffb36d] disabled:opacity-30"
                >
                  Next page <ArrowRight size={16} strokeWidth={3} />
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="mt-10">
            <p className="font-mono text-xs font-black uppercase tracking-[0.14em] text-white/55">Universities in other {country.name} cities</p>
            <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {elsewhere.map((university) => (
                <UniCard key={university.key} university={university} tone="dark" saved={has(university.key)} onToggle={toggle} />
              ))}
            </div>
          </div>
        )}

        <div className="mt-12 flex flex-col items-start justify-between gap-4 rounded-[24px] bg-white/[0.06] p-5 ring-1 ring-white/10 sm:flex-row sm:items-center md:p-6">
          <p className="text-sm font-bold leading-6 text-white/80">
            Want to see every university in {country.name}, or filter by subject, fees and English-taught courses?
          </p>
          <Link
            to={`/universities?country=${country.slug}`}
            className="inline-flex shrink-0 items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-black text-[#071f50] transition hover:bg-[#ffb36d]"
          >
            Open the university finder <ArrowRight size={16} strokeWidth={3} />
          </Link>
        </div>
      </div>
    </section>
  );
}

export default CityUniversities;
