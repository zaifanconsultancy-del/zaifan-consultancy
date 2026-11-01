import { useEffect, useId, useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowLeft, ArrowRight, CalendarDays, Check, GitCompareArrows, GraduationCap, Heart, Plane } from "lucide-react";

import { formatUsd } from "../../../data/countries/costs";
import { FlagMark } from "../destinations/DestinationUI";
import { SNAPSHOTS, STEPS, firstPart, gatewayOf, traitsOf } from "./countriesData";
import StepLabel from "./StepLabel";
import { HOME_POINT, LAND_PATH, ROUTES } from "./worldMap";

// The part of the dot grid on screen: western Europe to Shanghai.
const VIEW = { x: 1, y: 0, width: 114, height: 44 };

// Where each name tag sits (grid units), pulled away from Europe's crowded
// dots and joined to its airport by a thin line.
const TAGS = {
  france: [7.5, 15.5],
  belgium: [9, 6],
  germany: [23, 5.5],
  italy: [17, 22],
  lithuania: [37, 3],
  romania: [42, 19.5],
  turkey: [32, 25.5],
  china: [108, 19],
  vietnam: [97, 41],
};

// A small plane pointing along +x, so animateMotion's rotate="auto" faces it down the route.
const PLANE =
  "M1.5 0 L0.3 0.3 L-0.4 1.2 L-0.75 1.2 L-0.35 0.3 L-1.1 0.25 L-1.35 0.65 L-1.6 0.65 L-1.4 0 L-1.6 -0.65 L-1.35 -0.65 L-1.1 -0.25 L-0.35 -0.3 L-0.75 -1.2 L-0.4 -1.2 L0.3 -0.3 Z";
const TOUR_MS = 5000;

const percent = ([x, y]) => ({ left: `${((x - VIEW.x) / VIEW.width) * 100}%`, top: `${((y - VIEW.y) / VIEW.height) * 100}%` });

function FlightMap({ selected, picks, onSelect }) {
  const reduceMotion = useReducedMotion();
  const idPrefix = useId().replace(/:/g, "");

  return (
    <div className="relative aspect-[114/44] w-full">
      {/* Land on its own layer so the moving planes never repaint 4,000 dots */}
      <svg viewBox={`${VIEW.x} ${VIEW.y} ${VIEW.width} ${VIEW.height}`} className="absolute inset-0 h-full w-full [will-change:transform]" aria-hidden="true">
        <path d={LAND_PATH} stroke="rgba(255,255,255,0.26)" strokeWidth="0.5" strokeLinecap="round" />
      </svg>
      <svg viewBox={`${VIEW.x} ${VIEW.y} ${VIEW.width} ${VIEW.height}`} className="absolute inset-0 h-full w-full" aria-hidden="true">
        {ROUTES.map((route) => {
          const active = route.country.slug === selected;
          const tag = TAGS[route.country.slug];
          return (
            <g key={route.country.slug}>
              {/* Leader from the airport to its name tag */}
              <line x1={route.point[0]} y1={route.point[1]} x2={tag[0]} y2={tag[1]} stroke={active ? "#ff7b1c" : "rgba(255,255,255,0.22)"} strokeWidth="0.15" className="hidden md:block" />
              <path
                id={`${idPrefix}-${route.country.slug}`}
                d={route.path}
                fill="none"
                stroke={active ? "#ff7b1c" : "rgba(255,255,255,0.18)"}
                strokeWidth={active ? 0.38 : 0.2}
                strokeDasharray={active ? undefined : "0.8 0.8"}
              />
              {active && (
                <motion.path
                  key={`draw-${route.country.slug}`}
                  d={route.path}
                  fill="none"
                  stroke="#ffb36d"
                  strokeWidth="0.6"
                  strokeLinecap="round"
                  initial={{ pathLength: 0, opacity: 1 }}
                  animate={{ pathLength: 1, opacity: 0 }}
                  transition={{ duration: 1.1, ease: "easeOut" }}
                />
              )}
              <circle cx={route.point[0]} cy={route.point[1]} r={active ? 0.75 : 0.5} fill={active ? "#ff7b1c" : "#ffffff"} />
              {active && (
                <circle cx={route.point[0]} cy={route.point[1]} r="0.75" fill="none" stroke="#ff7b1c" strokeWidth="0.2">
                  {!reduceMotion && <animate attributeName="r" values="0.75;2.6" dur="1.6s" repeatCount="indefinite" />}
                  {!reduceMotion && <animate attributeName="opacity" values="1;0" dur="1.6s" repeatCount="indefinite" />}
                </circle>
              )}
              {/* A plane always in the air on every route; bigger on the one you're tracking */}
              {!reduceMotion && (
                <g opacity={active ? 1 : 0.45}>
                  <path d={PLANE} fill={active ? "#ffcc00" : "#ffffff"} transform={active ? "scale(1.25)" : "scale(0.8)"}>
                    <animateMotion dur={`${(route.distance / 900).toFixed(1)}s`} repeatCount="indefinite" rotate="auto">
                      <mpath href={`#${idPrefix}-${route.country.slug}`} />
                    </animateMotion>
                  </path>
                </g>
              )}
            </g>
          );
        })}

        {/* Home */}
        <circle cx={HOME_POINT[0]} cy={HOME_POINT[1]} r="0.9" fill="#34d399" stroke="#ffffff" strokeWidth="0.3" />
        <circle cx={HOME_POINT[0]} cy={HOME_POINT[1]} r="0.9" fill="none" stroke="#34d399" strokeWidth="0.25">
          {!reduceMotion && <animate attributeName="r" values="0.9;3.2" dur="2s" repeatCount="indefinite" />}
          {!reduceMotion && <animate attributeName="opacity" values="1;0" dur="2s" repeatCount="indefinite" />}
        </circle>
      </svg>

      <span
        className="pointer-events-none absolute -translate-x-1/2 translate-y-2 whitespace-nowrap rounded-full bg-emerald-400 px-2 py-0.5 font-mono text-[9px] font-black uppercase tracking-[0.12em] text-[#052e1c] sm:text-[10px]"
        style={percent(HOME_POINT)}
      >
        You · ISB
      </span>

      {/* Name tags (flags only on phones) */}
      {ROUTES.map((route) => {
        const active = route.country.slug === selected;
        const picked = picks.some((pick) => pick.slug === route.country.slug);
        return (
          <button
            key={route.country.slug}
            type="button"
            onClick={() => onSelect(route.country.slug)}
            aria-pressed={active}
            aria-label={`${route.country.name}, about ${Math.round(route.distance / 100) * 100} km from Pakistan`}
            className={`group absolute -translate-x-1/2 -translate-y-1/2 ${active ? "z-20" : "z-10"}`}
            style={percent(TAGS[route.country.slug])}
          >
            <span
              className={`relative inline-flex items-center gap-1.5 rounded-full p-[3px] text-[11px] font-black shadow-[0_6px_16px_rgba(0,0,0,0.25)] transition md:pr-2.5 ${
                active ? "bg-[#ff4b12] text-white" : "bg-white text-[#071f50] group-hover:-translate-y-0.5"
              }`}
            >
              <FlagMark country={route.country} className="h-3.5 w-5 rounded-full shadow-none sm:h-4 sm:w-6" />
              <span className={`${active ? "inline pr-1.5 md:pr-0" : "hidden md:inline"} whitespace-nowrap`}>{route.country.name}</span>
              {picked && (
                <span className="absolute -right-1 -top-1.5 grid h-4 w-4 place-items-center rounded-full bg-[#ff4b12] text-white ring-2 ring-[#071f50]">
                  <Heart size={8} fill="currentColor" />
                </span>
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
}

/** The flight-info sidebar: where the tracked flight lands, what it costs, and the shortlist button. */
function FlightCard({ route, picked, onToggle, onStep }) {
  const { country } = route;
  const snapshot = SNAPSHOTS[country.slug];
  const gateway = gatewayOf(country);

  return (
    <motion.div
      key={country.slug}
      initial={{ opacity: 0, x: 16 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -16 }}
      transition={{ duration: 0.25 }}
      className="flex h-full flex-col rounded-[24px] bg-white p-5 text-[#071f50] sm:p-6"
    >
      <div className="flex items-center justify-between gap-3">
        <span className="rounded-lg bg-[#071f50] px-2.5 py-1.5 font-mono text-[10px] font-black uppercase tracking-[0.16em] text-[#ffb36d]">
          Flight ZF {gateway.airport}
        </span>
        <div className="flex gap-1">
          <button type="button" onClick={() => onStep(-1)} aria-label="Previous country" className="grid h-8 w-8 place-items-center rounded-full bg-[#fff7ed] ring-1 ring-orange-100 transition hover:ring-[#071f50]">
            <ArrowLeft size={14} strokeWidth={3} />
          </button>
          <button type="button" onClick={() => onStep(1)} aria-label="Next country" className="grid h-8 w-8 place-items-center rounded-full bg-[#fff7ed] ring-1 ring-orange-100 transition hover:ring-[#071f50]">
            <ArrowRight size={14} strokeWidth={3} />
          </button>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-3">
        <FlagMark country={country} className="h-10 w-[60px] rounded-[7px]" />
        <div>
          <h2 className="text-3xl font-black leading-none tracking-[-0.05em]">{country.name}</h2>
          <p className="mt-1 text-xs font-bold text-[#7a879c]">
            ISB → {gateway.airport} · lands in {gateway.city}
          </p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2 text-xs font-black">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#071f50] px-3 py-1.5 text-white">
          <Plane size={13} className="text-[#ff7b1c]" /> ≈ {(Math.round(route.distance / 100) * 100).toLocaleString("en-US")} km · ≈ {route.hours} h
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#fff1ea] px-3 py-1.5 text-[#ff4b12]">
          <CalendarDays size={13} /> Starts {firstPart(country.quickFacts.intakes)}
        </span>
      </div>

      <dl className="mt-4 grid grid-cols-3 gap-2">
        {[
          { label: "1st year", value: snapshot.firstYear, hot: true },
          { label: "Tuition / yr", value: snapshot.tuitionPerYear },
          { label: "Living / mo", value: snapshot.livingPerMonth },
        ].map((stat) => (
          <div key={stat.label} className={`rounded-2xl px-3 py-2.5 ${stat.hot ? "bg-[#071f50] text-white" : "bg-[#fff7ed] ring-1 ring-orange-100"}`}>
            <dt className={`text-[10px] font-black uppercase tracking-[0.1em] ${stat.hot ? "text-white/55" : "text-[#7a879c]"}`}>{stat.label}</dt>
            <dd className={`mt-0.5 text-sm font-black tracking-[-0.03em] sm:text-base ${stat.hot ? "text-[#ff7b1c]" : ""}`}>{formatUsd(stat.value)}</dd>
          </div>
        ))}
      </dl>

      <p className="mt-3 flex items-start gap-2 text-xs font-bold leading-5 text-emerald-800">
        <GraduationCap size={15} className="mt-0.5 shrink-0" /> After you graduate: {country.quickFacts.postStudy}
      </p>
      <p className="mt-1 text-[11px] font-bold text-[#7a879c]">Good for: {traitsOf(country).map((trait) => trait.label).join(" · ")}</p>

      <div className="mt-auto flex flex-col gap-2 pt-5 sm:flex-row">
        <motion.button
          type="button"
          whileTap={{ scale: 0.95 }}
          onClick={() => onToggle(country.slug)}
          aria-pressed={picked}
          className={`inline-flex flex-1 items-center justify-center gap-2 rounded-full px-5 py-3.5 text-sm font-black transition ${
            picked ? "bg-emerald-500 text-white hover:bg-emerald-600" : "bg-[#ff4b12] text-white shadow-[0_14px_30px_rgba(255,75,18,0.3)] hover:bg-[#ff642f]"
          }`}
        >
          {picked ? <Check size={17} strokeWidth={3} /> : <Heart size={17} fill="currentColor" />}
          {picked ? "On your shortlist" : "Add to my shortlist"}
        </motion.button>
        <Link
          to={`/countries/${country.slug}`}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-5 py-3.5 text-sm font-black ring-1 ring-orange-100 transition hover:ring-[#071f50]"
        >
          Full guide <ArrowRight size={15} strokeWidth={3} />
        </Link>
      </div>
    </motion.div>
  );
}

/** Step 1: a live flight tracker of the nine routes out of Pakistan. Tap one, shortlist it. */
function FlightTrackerHero({ picks, onAdd, onRemove, onCompare }) {
  const [selected, setSelected] = useState(ROUTES[0].country.slug);
  const [touched, setTouched] = useState(false);
  const reduceMotion = useReducedMotion();
  const index = ROUTES.findIndex((item) => item.country.slug === selected);
  const route = ROUTES[index];
  const picked = picks.some((pick) => pick.slug === selected);

  // Track each flight in turn until the visitor picks one.
  useEffect(() => {
    if (touched || reduceMotion) return undefined;
    const timer = window.setInterval(() => {
      setSelected((current) => ROUTES[(ROUTES.findIndex((item) => item.country.slug === current) + 1) % ROUTES.length].country.slug);
    }, TOUR_MS);
    return () => window.clearInterval(timer);
  }, [touched, reduceMotion]);

  const select = (slug) => {
    setTouched(true);
    setSelected(slug);
  };
  const step = (direction) => select(ROUTES[(index + direction + ROUTES.length) % ROUTES.length].country.slug);
  const toggle = (slug) => {
    setTouched(true);
    if (picks.some((pick) => pick.slug === slug)) onRemove(slug);
    else onAdd(slug);
  };

  return (
    <section id="shortlist" className="relative isolate scroll-mt-20 overflow-hidden bg-[#fff7ed] px-4 pb-14 pt-28 text-[#071f50] sm:px-5 md:pt-36">
      <div className="mx-auto max-w-[1350px]">
        <div className="grid gap-6 lg:grid-cols-[1fr_420px] lg:items-end">
          <div>
            <StepLabel step={1} />
            <h1 className="mt-5 text-[2.6rem] font-black leading-[0.92] tracking-[-0.06em] sm:text-6xl xl:text-[76px]">
              Where in the world
              <span className="block text-[#ff4b12]">will you study?</span>
            </h1>
            <p className="mt-4 max-w-2xl text-base font-semibold leading-7 text-[#526178] sm:text-lg">
              These are the nine flights we can get you on, live from Islamabad. Tap a country to track its flight and see what it costs, then
              add the ones you like to your shortlist.
            </p>
          </div>

          {/* Shortlist so far */}
          <div className="rounded-[24px] bg-white p-4 shadow-[0_18px_40px_rgba(7,31,80,0.08)] ring-1 ring-orange-100">
            <div className="flex items-center justify-between gap-3">
              <p className="flex items-center gap-2 text-sm font-black">
                <Heart size={16} className="text-[#ff4b12]" fill="currentColor" /> Your shortlist
              </p>
              <span className="font-mono text-xs font-black text-[#7a879c]">{picks.length} / 9</span>
            </div>
            {picks.length ? (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {picks.map((country) => (
                  <button
                    key={country.slug}
                    type="button"
                    onClick={() => select(country.slug)}
                    className="inline-flex items-center gap-1.5 rounded-full bg-[#fff7ed] px-2 py-1 text-[11px] font-black ring-1 ring-orange-100 hover:ring-[#ff4b12]"
                  >
                    <FlagMark country={country} className="h-3 w-[18px] rounded-[2px] shadow-none" /> {country.name}
                  </button>
                ))}
              </div>
            ) : (
              <p className="mt-2 text-xs font-bold text-[#9aa5b8]">Empty for now. Tap the heart on a country to add it.</p>
            )}
            <button
              type="button"
              onClick={onCompare}
              disabled={picks.length < 2}
              className="mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-full bg-[#071f50] px-4 py-2.5 text-xs font-black text-white transition hover:bg-[#0b2a6b] disabled:bg-[#071f50]/10 disabled:text-[#7a879c]"
            >
              <GitCompareArrows size={14} /> {picks.length < 2 ? "Pick 2 or more to compare" : `Compare ${picks.length} side by side`}
            </button>
          </div>
        </div>

        {/* The tracker */}
        <div className="mt-10 grid gap-3 rounded-[32px] bg-[#071f50] p-3 text-white shadow-[0_40px_90px_rgba(7,31,80,0.3)] sm:p-4 xl:grid-cols-[1fr_390px]">
          <div className="relative flex flex-col justify-center overflow-hidden rounded-[24px] bg-[radial-gradient(ellipse_at_60%_45%,#0d2b66_0%,#071f50_75%)] px-2 pb-4 pt-12 sm:px-4 sm:pb-10">
            <div className="pointer-events-none absolute left-4 right-4 top-4 flex items-center justify-between font-mono text-[10px] font-black uppercase tracking-[0.14em] text-white/55">
              <span className="flex items-center gap-1.5 text-white">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" /> Live · {ROUTES.length} routes from Islamabad
              </span>
              <span className="hidden text-[#ffb36d] sm:inline">
                Tracking ISB → {gatewayOf(route.country).airport} · {(Math.round(route.distance / 10) * 10).toLocaleString("en-US")} km
              </span>
            </div>
            <FlightMap selected={selected} picks={picks} onSelect={select} />
            <p className="pointer-events-none absolute bottom-3 left-4 right-4 hidden text-[11px] font-bold text-white/40 sm:block">
              Tap a flag to track that flight. Real airport locations; flying time is non-stop and excludes stopovers.
            </p>
          </div>

          {/* Phones: pick from a row of flags */}
          <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1 [scrollbar-width:none] md:hidden [&::-webkit-scrollbar]:hidden">
            {ROUTES.map((item) => (
              <button
                key={item.country.slug}
                type="button"
                onClick={() => select(item.country.slug)}
                aria-pressed={item.country.slug === selected}
                className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-2 text-xs font-black transition ${
                  item.country.slug === selected ? "bg-[#ff4b12] text-white" : "bg-white/[0.08] text-white"
                }`}
              >
                <FlagMark country={item.country} className="h-3.5 w-5 rounded-[2px] shadow-none" /> {item.country.name}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            <FlightCard key={selected} route={route} picked={picked} onToggle={toggle} onStep={step} />
          </AnimatePresence>
        </div>
      </div>

      {/* The four steps of this page */}
      <ol className="mx-auto mt-10 grid max-w-[1350px] grid-cols-2 gap-2 lg:grid-cols-4">
        {STEPS.map((item, stepIndex) => (
          <li key={item.id}>
            <a
              href={`#${item.id}`}
              className={`flex h-full items-center gap-3 rounded-2xl p-3 ring-1 transition hover:-translate-y-0.5 ${
                stepIndex === 0 ? "bg-[#071f50] text-white ring-[#071f50]" : "bg-white ring-orange-100 hover:ring-[#ff4b12]"
              }`}
            >
              <span
                className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl text-sm font-black ${
                  stepIndex === 0 ? "bg-[#ff4b12] text-white" : "bg-[#fff1ea] text-[#ff4b12]"
                }`}
              >
                {stepIndex + 1}
              </span>
              <span>
                <span className="block text-sm font-black">{item.label}</span>
                <span className={`block text-[11px] font-semibold leading-4 sm:text-xs ${stepIndex === 0 ? "text-white/65" : "text-[#7a879c]"}`}>{item.hint}</span>
              </span>
            </a>
          </li>
        ))}
      </ol>
    </section>
  );
}

export default FlightTrackerHero;
