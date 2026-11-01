import { useState } from "react";
import { Link } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import { Plane } from "lucide-react";

import { countryList } from "../../../data/countries";
import { formatUsd } from "../../../data/countries/costs";
import { FlagMark } from "../destinations/DestinationUI";
import { SNAPSHOTS } from "./countriesData";
import { ROUTES } from "./worldMap";

// One short fact per country, rotating between tuition, living and flight time.
const FACTS = countryList.map((country, index) => {
  const snapshot = SNAPSHOTS[country.slug];
  const route = ROUTES.find((item) => item.country.slug === country.slug);
  const facts = [
    snapshot.tuitionPerYear !== null && `tuition from ${formatUsd(snapshot.tuitionPerYear)} a year`,
    snapshot.livingPerMonth !== null && `living from ${formatUsd(snapshot.livingPerMonth)} a month`,
    route && `just ≈ ${route.hours} hours from Islamabad`,
  ].filter(Boolean);
  return { country, text: facts[index % facts.length] };
});

// Fly in, hang in the middle long enough to read, fly out.
const FLIGHT = { duration: 8, times: [0, 0.22, 0.78, 1], ease: ["easeOut", "linear", "easeIn"] };

function Cloud({ className, duration, delay }) {
  return (
    <motion.span
      aria-hidden="true"
      className={`absolute h-8 rounded-full bg-white shadow-[0_6px_14px_rgba(7,31,80,0.05)] before:absolute before:-top-4 before:left-4 before:h-9 before:w-9 before:rounded-full before:bg-white after:absolute after:-top-2.5 after:left-11 after:h-7 after:w-7 after:rounded-full after:bg-white ${className}`}
      initial={{ x: "-20vw" }}
      animate={{ x: "120vw" }}
      transition={{ duration, delay, repeat: Infinity, ease: "linear" }}
    />
  );
}

/** The banner the plane tows: flag, country and one fact, big enough to read. */
function Banner({ fact }) {
  return (
    <Link
      to={`/countries/${fact.country.slug}`}
      className="relative flex items-center gap-3 rounded-l-md rounded-r-sm bg-white py-3 pl-4 pr-5 shadow-[0_14px_30px_rgba(7,31,80,0.14)] ring-1 ring-orange-100 sm:gap-4 sm:py-4 sm:pl-5 sm:pr-7"
      style={{ clipPath: "polygon(0 0, 100% 4%, 100% 96%, 0 100%, 3% 50%)" }}
    >
      <FlagMark country={fact.country} className="h-6 w-9 shrink-0 rounded-[4px] sm:h-8 sm:w-12" />
      {/* Phones: country and fact on two lines so the whole plane fits on screen */}
      <span className="whitespace-nowrap text-base font-black leading-tight tracking-[-0.02em] text-[#071f50] sm:text-2xl">
        {fact.country.name}
        <span className="hidden sm:inline"> · </span>
        <span className="block text-sm text-[#ff4b12] sm:inline sm:text-2xl">{fact.text}</span>
      </span>
    </Link>
  );
}

/**
 * Between the tracker and the line-up: a little plane tows a banner across the
 * page, stops in the middle so you can read it, then flies off and the next
 * country's plane comes in.
 */
function BannerPlane() {
  const [index, setIndex] = useState(0);
  const reduceMotion = useReducedMotion();
  const fact = FACTS[index];
  const next = () => setIndex((current) => (current + 1) % FACTS.length);

  return (
    <section aria-label="A fact from each destination" className="relative h-[170px] overflow-hidden bg-[#fff7ed] sm:h-[200px]">
      <Cloud className="top-6 w-24" duration={60} delay={-20} />
      <Cloud className="top-24 w-16 opacity-80" duration={45} delay={-5} />
      <Cloud className="bottom-6 w-20 opacity-90" duration={75} delay={-50} />

      <motion.div
        key={index}
        className="absolute top-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center"
        initial={{ left: reduceMotion ? "50%" : "-60%" }}
        animate={reduceMotion ? { left: "50%" } : { left: ["-60%", "50%", "50%", "160%"], y: [0, -6, 6, 0] }}
        transition={reduceMotion ? { duration: 0 } : FLIGHT}
        onAnimationComplete={reduceMotion ? undefined : next}
      >
        {/* Banner flutters a little behind the plane */}
        <motion.div
          animate={reduceMotion ? undefined : { skewY: [-1.5, 1.5, -1.5] }}
          transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
        >
          <Banner fact={fact} />
        </motion.div>
        {/* Tow rope */}
        <span aria-hidden="true" className="h-px w-5 border-t-2 border-dashed border-[#071f50]/40 sm:w-16" />
        {/* The plane, pointing right */}
        <span aria-hidden="true" className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#071f50] text-[#ffb36d] shadow-[0_14px_28px_rgba(7,31,80,0.3)] sm:h-16 sm:w-16">
          <Plane size={26} className="rotate-45 sm:h-[30px] sm:w-[30px]" fill="currentColor" />
        </span>
      </motion.div>

      {reduceMotion && (
        <button
          type="button"
          onClick={next}
          className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-white px-4 py-1.5 text-xs font-black ring-1 ring-orange-100"
        >
          Next fact
        </button>
      )}
    </section>
  );
}

export default BannerPlane;
