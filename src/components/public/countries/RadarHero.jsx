import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowRight, CalendarDays, Check, GitCompareArrows, GraduationCap, Heart, Plane } from "lucide-react";

import { countryList } from "../../../data/countries";
import { formatUsd } from "../../../data/countries/costs";
import { FlagMark } from "../destinations/DestinationUI";
import { SNAPSHOTS, STEPS, firstPart, gatewayOf, traitsOf } from "./countriesData";
import StepLabel from "./StepLabel";

// Islamabad, and the city each destination's flights usually land in.
const HOME = [33.69, 73.06];
const GATEWAY_COORDS = {
  italy: [45.46, 9.19],
  germany: [48.14, 11.58],
  france: [48.86, 2.35],
  belgium: [50.85, 4.35],
  romania: [44.43, 26.1],
  lithuania: [54.69, 25.28],
  turkey: [41.01, 28.98],
  china: [31.23, 121.47],
  vietnam: [21.03, 105.85],
};

const toRad = (degrees) => (degrees * Math.PI) / 180;

/** Great-circle distance (km) and compass bearing (degrees) from Islamabad. */
function fromHome([lat, lon]) {
  const [lat1, lat2, dLon] = [toRad(HOME[0]), toRad(lat), toRad(lon - HOME[1])];
  const a = Math.sin((lat2 - lat1) / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  const distance = 6371 * 2 * Math.asin(Math.sqrt(a));
  const y = Math.sin(dLon) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
  return { distance, bearing: ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360 };
}

// The radar starts at 3,000 km (nothing is closer) so the distances spread out.
const RING_KM = [3000, 4000, 5000, 6000];
const radiusFor = (km) => 0.18 + ((Math.min(km, 6200) - 3000) / 3000) * 0.78;

const BLIPS = (() => {
  const raw = countryList.map((country) => ({ country, ...fromHome(GATEWAY_COORDS[country.slug]) }));
  // The European destinations all sit 295–317° from Islamabad; fan them out
  // (keeping their order) so their dots don't overlap.
  const europe = raw.filter((blip) => blip.bearing > 270 && blip.bearing < 340).sort((a, b) => a.bearing - b.bearing);
  europe.forEach((blip, index) => {
    blip.angle = 250 + (index * 100) / Math.max(1, europe.length - 1);
  });
  return raw.map((blip) => {
    const angle = blip.angle ?? blip.bearing;
    const radius = radiusFor(blip.distance);
    return {
      ...blip,
      angle,
      x: 50 + Math.sin(toRad(angle)) * radius * 50,
      y: 50 - Math.cos(toRad(angle)) * radius * 50,
      hours: Math.round(blip.distance / 830 + 0.5),
    };
  });
})();

function Radar({ selected, picks, onSelect }) {
  const active = BLIPS.find((blip) => blip.country.slug === selected);

  return (
    <div className="relative mx-auto aspect-square w-full max-w-[600px]">
      {/* Readouts in the corners outside the dish */}
      <div aria-hidden="true" className="pointer-events-none font-mono text-[9px] font-black uppercase leading-4 tracking-[0.12em] text-[#7a879c] sm:text-[10px]">
        <p className="absolute left-0 top-0 flex items-center gap-1.5 text-[#071f50]">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" /> Live · {BLIPS.length} destinations
        </p>
        <p className="absolute right-0 top-0 text-right">
          Origin ISB
          <br />
          {HOME[0].toFixed(1)}°N {HOME[1].toFixed(1)}°E
        </p>
        <p className="absolute bottom-0 left-0 hidden sm:block">
          Sweep 6s
          <br />
          Range 6,000 km
        </p>
        {active && (
          <p className="absolute bottom-0 right-0 text-right text-[#ff4b12]">
            Target {active.country.code}
            <br />
            {(Math.round(active.distance / 10) * 10).toLocaleString("en-US")} km · {Math.round(active.bearing)}°
          </p>
        )}
      </div>

      <div className="absolute inset-0 overflow-hidden rounded-full bg-[radial-gradient(circle,#0d2b66_0%,#071f50_70%)] shadow-[0_40px_90px_rgba(7,31,80,0.35)] ring-8 ring-white">
        {/* Rotating sweep */}
        {/* Bright leading edge, fading trail behind it */}
        <div className="zaifan-radar-sweep absolute inset-0 rounded-full bg-[conic-gradient(from_0deg,transparent_0%,transparent_74%,rgba(255,123,28,0.5)_100%)]" />

        <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full" aria-hidden="true">
          {RING_KM.map((km) => (
            <g key={km}>
              <circle cx="50" cy="50" r={radiusFor(km) * 50} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="0.25" strokeDasharray="1 1" />
              {/* Distance labels run down the empty south-south-west side */}
              <text
                x={50 + Math.sin(toRad(200)) * radiusFor(km) * 50}
                y={50 - Math.cos(toRad(200)) * radiusFor(km) * 50 + 0.7}
                fill="rgba(255,255,255,0.35)"
                fontSize="2"
                fontWeight="700"
                textAnchor="middle"
              >
                {km.toLocaleString("en-US")} km
              </text>
            </g>
          ))}
          <line x1="50" y1="3" x2="50" y2="97" stroke="rgba(255,255,255,0.06)" strokeWidth="0.25" />
          <line x1="3" y1="50" x2="97" y2="50" stroke="rgba(255,255,255,0.06)" strokeWidth="0.25" />
          {["N", "E", "S", "W"].map((label, index) => (
            <text
              key={label}
              x={50 + Math.sin((index * Math.PI) / 2) * 46.5}
              y={50 - Math.cos((index * Math.PI) / 2) * 46.5 + 1}
              fill="rgba(255,255,255,0.3)"
              fontSize="2.6"
              fontWeight="800"
              textAnchor="middle"
            >
              {label}
            </text>
          ))}

          {/* Route to the chosen country */}
          {active && (
            <motion.line
              key={active.country.slug}
              x1="50"
              y1="50"
              x2={active.x}
              y2={active.y}
              stroke="#ff7b1c"
              strokeWidth="0.5"
              strokeDasharray="1.4 1"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
            />
          )}
          {/* A flight that keeps leaving Pakistan for the chosen country */}
          {active && (
            <motion.circle
              key={`flight-${active.country.slug}`}
              r="1"
              fill="#ffcc00"
              style={{ filter: "drop-shadow(0 0 1.2px #ffcc00)" }}
              initial={{ cx: 50, cy: 50, opacity: 0 }}
              animate={{ cx: [50, active.x], cy: [50, active.y], opacity: [0, 1, 1, 0] }}
              transition={{ duration: 2, ease: "easeInOut", repeat: Infinity, repeatDelay: 0.4 }}
            />
          )}
        </svg>

        {/* Home */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
          <span className="relative mx-auto flex h-4 w-4">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
            <span className="relative inline-flex h-4 w-4 rounded-full border-2 border-white bg-emerald-500" />
          </span>
          <span className="mt-1 block font-mono text-[9px] font-black uppercase tracking-[0.14em] text-emerald-300 sm:text-[10px]">You · PAK</span>
        </div>
      </div>

      {/* Country dots (outside the clipped circle so labels never cut off) */}
      {BLIPS.map((blip) => {
        const isActive = blip.country.slug === selected;
        const picked = picks.some((pick) => pick.slug === blip.country.slug);
        return (
          <button
            key={blip.country.slug}
            type="button"
            onClick={() => onSelect(blip.country.slug)}
            aria-pressed={isActive}
            aria-label={`${blip.country.name}, about ${Math.round(blip.distance / 100) * 100} km from Pakistan`}
            className={`group absolute -translate-x-1/2 -translate-y-1/2 ${isActive ? "z-30" : "z-20"}`}
            style={{ left: `${blip.x}%`, top: `${blip.y}%` }}
          >
            {/* Ping as the sweep passes over this country */}
            <span
              aria-hidden="true"
              className="zaifan-radar-ping pointer-events-none absolute inset-0 rounded-full border-2 border-[#ff7b1c] opacity-0"
              style={{ animationDelay: `${(blip.angle / 360) * 6}s` }}
            />
            <span
              className={`relative grid place-items-center rounded-full p-[3px] transition duration-300 ${
                isActive ? "scale-125 bg-[#ff4b12] shadow-[0_0_0_6px_rgba(255,75,18,0.3)]" : "bg-white/90 group-hover:scale-110"
              }`}
            >
              <FlagMark country={blip.country} className="h-4 w-6 rounded-full shadow-none sm:h-5 sm:w-[30px]" />
              {picked && (
                <span className="absolute -right-1.5 -top-1.5 grid h-4 w-4 place-items-center rounded-full bg-[#ff4b12] text-white ring-2 ring-[#071f50]">
                  <Heart size={8} fill="currentColor" />
                </span>
              )}
            </span>
            {/* Name on the outer side of the flag, away from the centre */}
            <span
              className={`absolute top-1/2 -translate-y-1/2 whitespace-nowrap rounded-full px-1.5 text-[9px] font-black sm:text-[11px] ${
                blip.x < 50 ? "right-full mr-1.5" : "left-full ml-1.5"
              } ${isActive ? "bg-[#ff4b12] text-white" : "hidden bg-white text-[#071f50] shadow-sm sm:inline"}`}
            >
              {blip.country.name}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function CountryPanel({ blip, picked, onToggle, onNext }) {
  const { country } = blip;
  const snapshot = SNAPSHOTS[country.slug];
  const gateway = gatewayOf(country);

  return (
    <motion.div
      key={country.slug}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.25 }}
      className="rounded-[28px] bg-white p-5 shadow-[0_24px_60px_rgba(9,31,80,0.1)] ring-1 ring-orange-100 sm:p-6"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <FlagMark country={country} className="h-10 w-[60px] rounded-[7px]" />
          <div>
            <h2 className="text-3xl font-black leading-none tracking-[-0.05em]">{country.name}</h2>
            <p className="mt-1 text-xs font-bold text-[#7a879c]">
              Flights land in {gateway.city} ({gateway.airport})
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onNext}
          className="inline-flex shrink-0 items-center gap-1 rounded-full bg-[#fff7ed] px-3 py-2 text-xs font-black ring-1 ring-orange-100 transition hover:ring-[#071f50]"
        >
          Next <ArrowRight size={13} strokeWidth={3} />
        </button>
      </div>

      <p className="mt-3 text-sm font-semibold leading-6 text-[#5f6f89]">{country.tagline}</p>

      <div className="mt-4 flex flex-wrap gap-2 text-xs font-black">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#071f50] px-3 py-1.5 text-white">
          <Plane size={13} className="text-[#ff7b1c]" /> ≈ {(Math.round(blip.distance / 100) * 100).toLocaleString("en-US")} km · ≈ {blip.hours} h flying
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
            <dd className={`mt-0.5 text-base font-black tracking-[-0.03em] ${stat.hot ? "text-[#ff7b1c]" : ""}`}>{formatUsd(stat.value)}</dd>
          </div>
        ))}
      </dl>

      <p className="mt-3 flex items-start gap-2 text-xs font-bold leading-5 text-emerald-800">
        <GraduationCap size={15} className="mt-0.5 shrink-0" /> After you graduate: {country.quickFacts.postStudy}
      </p>
      <p className="mt-1 text-[11px] font-bold text-[#7a879c]">Good for: {traitsOf(country).map((trait) => trait.label).join(" · ")}</p>

      <div className="mt-5 flex flex-col gap-2 sm:flex-row">
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

const TOUR_MS = 4500;

/** Step 1: every destination on a radar around Pakistan; tap one, shortlist it. */
function RadarHero({ picks, onAdd, onRemove, onCompare }) {
  const [selected, setSelected] = useState(BLIPS[0].country.slug);
  const [touched, setTouched] = useState(false);
  const reduceMotion = useReducedMotion();
  const blip = BLIPS.find((item) => item.country.slug === selected);
  const picked = picks.some((pick) => pick.slug === selected);

  // Tour the radar on its own until the visitor picks something.
  useEffect(() => {
    if (touched || reduceMotion) return undefined;
    const timer = window.setInterval(() => {
      setSelected((current) => BLIPS[(BLIPS.findIndex((item) => item.country.slug === current) + 1) % BLIPS.length].country.slug);
    }, TOUR_MS);
    return () => window.clearInterval(timer);
  }, [touched, reduceMotion]);

  const select = (slug) => {
    setTouched(true);
    setSelected(slug);
  };
  const next = () => select(BLIPS[(BLIPS.findIndex((item) => item.country.slug === selected) + 1) % BLIPS.length].country.slug);
  const toggle = (slug) => {
    setTouched(true);
    if (picks.some((pick) => pick.slug === slug)) onRemove(slug);
    else onAdd(slug);
  };

  return (
    <section id="shortlist" className="relative isolate scroll-mt-20 overflow-hidden bg-[#fff7ed] px-4 pb-14 pt-32 text-[#071f50] sm:px-5 md:pt-40">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_10%_15%,rgba(255,75,18,0.12),transparent_32%),radial-gradient(circle_at_85%_60%,rgba(7,31,80,0.08),transparent_40%)]" />

      {/* Phones: headline, radar, country card. Desktop: words left, radar right. */}
      <div className="mx-auto grid max-w-[1350px] gap-8 lg:grid-cols-[1fr_1.05fr] lg:grid-rows-[auto_1fr] lg:gap-x-14">
        <div className="lg:col-start-1 lg:row-start-1">
          <StepLabel step={1} />
          <h1 className="mt-5 text-[2.6rem] font-black leading-[0.92] tracking-[-0.06em] sm:text-6xl xl:text-[72px]">
            Where in the world
            <span className="block text-[#ff4b12]">will you study?</span>
          </h1>
          <p className="mt-4 max-w-xl text-base font-semibold leading-7 text-[#526178] sm:text-lg">
            Every flag on the radar is a country we can help you get into, placed by how far it is from Pakistan. Tap one to see what it
            costs, then add the ones you like to your shortlist.
          </p>
        </div>

        <div className="lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:self-center">
          <Radar selected={selected} picks={picks} onSelect={select} />
          <p className="mt-4 text-center text-[11px] font-bold text-[#7a879c]">
            Real distances from Islamabad; European countries are spread out slightly so you can tap them. Flying time excludes stopovers.
          </p>
        </div>

        <div className="lg:col-start-1 lg:row-start-2">
          <div>
            <AnimatePresence mode="wait">
              <CountryPanel key={selected} blip={blip} picked={picked} onToggle={toggle} onNext={next} />
            </AnimatePresence>
          </div>

          {/* Shortlist so far */}
          <div className="mt-4 flex flex-wrap items-center gap-3 rounded-2xl bg-white/70 px-4 py-3 ring-1 ring-orange-100">
            <span className="text-xs font-black text-[#7a879c]">Your shortlist:</span>
            {picks.length ? (
              <span className="flex flex-wrap gap-1.5">
                {picks.map((country) => (
                  <button
                    key={country.slug}
                    type="button"
                    onClick={() => select(country.slug)}
                    className="inline-flex items-center gap-1.5 rounded-full bg-white px-2 py-1 text-[11px] font-black ring-1 ring-orange-100 hover:ring-[#ff4b12]"
                  >
                    <FlagMark country={country} className="h-3 w-[18px] rounded-[2px] shadow-none" /> {country.name}
                  </button>
                ))}
              </span>
            ) : (
              <span className="text-xs font-bold text-[#9aa5b8]">empty for now, tap a heart</span>
            )}
            {picks.length > 1 && (
              <button
                type="button"
                onClick={onCompare}
                className="ml-auto inline-flex items-center gap-1.5 rounded-full bg-[#071f50] px-3.5 py-2 text-xs font-black text-white hover:bg-[#0b2a6b]"
              >
                <GitCompareArrows size={14} /> Compare {picks.length}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* The four steps of this page */}
      <ol className="mx-auto mt-12 grid max-w-[1350px] grid-cols-2 gap-2 lg:grid-cols-4">
        {STEPS.map((item, index) => (
          <li key={item.id}>
            <a
              href={`#${item.id}`}
              className={`flex h-full items-center gap-3 rounded-2xl p-3 ring-1 transition hover:-translate-y-0.5 ${
                index === 0 ? "bg-[#071f50] text-white ring-[#071f50]" : "bg-white ring-orange-100 hover:ring-[#ff4b12]"
              }`}
            >
              <span
                className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl text-sm font-black ${
                  index === 0 ? "bg-[#ff4b12] text-white" : "bg-[#fff1ea] text-[#ff4b12]"
                }`}
              >
                {index + 1}
              </span>
              <span>
                <span className="block text-sm font-black">{item.label}</span>
                <span className={`block text-[11px] font-semibold leading-4 sm:text-xs ${index === 0 ? "text-white/65" : "text-[#7a879c]"}`}>{item.hint}</span>
              </span>
            </a>
          </li>
        ))}
      </ol>
    </section>
  );
}

export default RadarHero;
