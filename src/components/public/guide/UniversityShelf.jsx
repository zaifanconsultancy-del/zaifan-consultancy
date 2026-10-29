import { useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight, LayoutGrid } from "lucide-react";

import { iconFor } from "../destinations/destinationUtils";
import UniCard from "../universities/UniCard";
import { useShortlist } from "../universities/useShortlist";
import StepIntro from "./StepIntro";

const PAGE_SIZE = 6;

/** Step 3: a route picker (three universities per goal) and every university, paged. */
function UniversityShelf({ country }) {
  const { has, toggle } = useShortlist();
  const topRef = useRef(null);
  const all = country.universities;

  // Routes only keep universities we actually have profiles for.
  const routes = useMemo(
    () =>
      (country.pathways || [])
        .map((route) => ({ ...route, universities: route.slugs.map((slug) => all.find((university) => university.slug === slug)).filter(Boolean) }))
        .filter((route) => route.universities.length),
    [country.pathways, all],
  );

  const [routeTitle, setRouteTitle] = useState(null);
  const [page, setPage] = useState(0);
  const route = routes.find((item) => item.title === routeTitle);
  const pages = Math.ceil(all.length / PAGE_SIZE);
  const shown = route ? route.universities : all.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);

  const pickRoute = (title) => {
    setRouteTitle(title);
    setPage(0);
  };
  const goToPage = (next) => {
    setPage(next);
    topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <section id="universities" className="scroll-mt-20 bg-[#071f50] px-4 pb-20 pt-10 text-white sm:px-5 md:pb-28 md:pt-14">
      <div className="mx-auto max-w-[1350px]">
        <StepIntro
          step={3}
          tone="navy"
          title="Where could you"
          accent="actually study?"
          text={`${all.length} universities in ${country.name}, each with a full profile: fees, courses, entry rules and the city around it.`}
          howTo="Pick what you want to study for a three-university shortlist, or browse them all. Tap the heart to save one."
        />

        <div ref={topRef} className="scroll-mt-28">
          <div className="mt-10 flex gap-2 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:flex-wrap">
            <button
              type="button"
              onClick={() => pickRoute(null)}
              aria-pressed={!route}
              className={`inline-flex shrink-0 items-center gap-2 rounded-full px-4 py-2.5 text-sm font-black transition ${
                !route ? "bg-[#ff4b12] text-white" : "bg-white/[0.07] text-white/80 ring-1 ring-white/10 hover:bg-white/15"
              }`}
            >
              <LayoutGrid size={15} /> All {all.length}
            </button>
            {routes.map((item) => {
              const Icon = iconFor(item.icon);
              const active = item.title === routeTitle;
              return (
                <button
                  key={item.title}
                  type="button"
                  onClick={() => pickRoute(item.title)}
                  aria-pressed={active}
                  className={`inline-flex shrink-0 items-center gap-2 rounded-full px-4 py-2.5 text-sm font-black transition ${
                    active ? "bg-[#ff4b12] text-white" : "bg-white/[0.07] text-white/80 ring-1 ring-white/10 hover:bg-white/15"
                  }`}
                >
                  <Icon size={15} /> {item.title.replace(/ route$/i, "")}
                </button>
              );
            })}
          </div>

          <p className="mt-5 font-mono text-xs font-black uppercase tracking-[0.14em] text-white/55">
            {route ? `${route.title}: our three picks to start with` : `Page ${page + 1} of ${pages} · ${all.length} universities`}
          </p>

          <motion.div layout className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <AnimatePresence mode="popLayout">
              {shown.map((university) => (
                <UniCard key={university.key} university={university} tone="dark" saved={has(university.key)} onToggle={toggle} />
              ))}
            </AnimatePresence>
          </motion.div>

          {!route && pages > 1 && (
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

        <div className="mt-12 flex flex-col items-start justify-between gap-4 rounded-[24px] bg-white/[0.06] p-5 ring-1 ring-white/10 sm:flex-row sm:items-center md:p-6">
          <p className="text-sm font-bold leading-6 text-white/80">
            Want to filter by subject, fees or English-taught programmes, or compare three side by side?
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

export default UniversityShelf;
