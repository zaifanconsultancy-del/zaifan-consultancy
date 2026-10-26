import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Plane } from "lucide-react";

import emblem from "../../../assets/images/brand/intro/emblem.webp";

// Zaifan "take-off" intro: a plane flies the logo's orbit ring, the logo lands
// inside it, the wordmark rises, a departures board flips through destinations,
// then the navy curtain lifts away with an orange hem.

const EASE = [0.22, 1, 0.36, 1];
const NAVY = "#071d43";
const CREAM = "#fff4e8";

const BRAND_WORD = "ZAIFAN";
const DESTINATIONS = [
  "ITALY",
  "GERMANY",
  "CANADA",
  "TURKEY",
  "AUSTRALIA",
  "UK",
  "YOUR FUTURE",
];

// Timeline (seconds)
const T = {
  orbit: 0.25,
  orbitDuration: 1.15,
  logo: 1.25,
  word: 1.55,
  subword: 1.95,
  rule: 2.2,
  board: 2.35,
  flip: 0.15,
};

const TOTAL_MS = 4000;
const REDUCED_TOTAL_MS = 900;

// Deterministic star field so renders stay pure.
function seeded(seed) {
  let value = seed;
  return () => {
    value = (value * 16807) % 2147483647;
    return (value - 1) / 2147483646;
  };
}

const rand = seeded(42);
const STARS = Array.from({ length: 46 }, (_, index) => ({
  id: index,
  left: rand() * 100,
  top: rand() * 100,
  size: 1 + rand() * 2.2,
  delay: rand() * 2.4,
  duration: 1.8 + rand() * 2.2,
}));

function GlobeLines() {
  return (
    <motion.svg
      viewBox="0 0 400 400"
      className="pointer-events-none absolute left-1/2 top-1/2 h-[150vmin] w-[150vmin] -translate-x-1/2 -translate-y-1/2"
      initial={{ opacity: 0, rotate: -12, scale: 0.9 }}
      animate={{ opacity: 1, rotate: 8, scale: 1 }}
      transition={{ duration: 4, ease: EASE }}
      fill="none"
      stroke="rgba(255,255,255,0.055)"
      strokeWidth="0.6"
    >
      <circle cx="200" cy="200" r="190" />
      {[40, 85, 130, 170].map((rx) => (
        <ellipse key={`m-${rx}`} cx="200" cy="200" rx={rx} ry="190" />
      ))}
      {[-140, -95, -48, 0, 48, 95, 140].map((offset) => {
        const half = Math.sqrt(190 * 190 - offset * offset);
        return (
          <line
            key={`p-${offset}`}
            x1={200 - half}
            x2={200 + half}
            y1={200 + offset}
            y2={200 + offset}
          />
        );
      })}
    </motion.svg>
  );
}

function PulseRings() {
  return (
    <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
      {[0, 1, 2].map((ring) => (
        <motion.span
          key={ring}
          className="absolute left-1/2 top-1/2 block h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full border border-orange-400/25"
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: [0.6, 2.6], opacity: [0, 0.55, 0] }}
          transition={{
            duration: 3.2,
            delay: 0.2 + ring * 1.05,
            repeat: Infinity,
            ease: "easeOut",
          }}
        />
      ))}
    </div>
  );
}

function StarField() {
  return (
    <div className="pointer-events-none absolute inset-0">
      {STARS.map((star) => (
        <motion.span
          key={star.id}
          className="absolute rounded-full bg-white"
          style={{
            left: `${star.left}%`,
            top: `${star.top}%`,
            width: star.size,
            height: star.size,
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0.8, 0.15, 0.7] }}
          transition={{
            duration: star.duration,
            delay: star.delay,
            repeat: Infinity,
            repeatType: "mirror",
          }}
        />
      ))}
    </div>
  );
}

function OrbitLogo() {
  return (
    <div className="relative h-40 w-40 md:h-52 md:w-52">
      {/* Orbit ring drawn by the plane */}
      <svg
        viewBox="0 0 100 100"
        className="absolute inset-0 h-full w-full -rotate-90"
        fill="none"
      >
        <motion.circle
          cx="50"
          cy="50"
          r="47"
          stroke="url(#zaifan-orbit)"
          strokeWidth="1.6"
          strokeLinecap="round"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{
            pathLength: {
              delay: T.orbit,
              duration: T.orbitDuration,
              ease: "easeInOut",
            },
            opacity: { delay: T.orbit, duration: 0.2 },
          }}
        />
        <defs>
          <linearGradient id="zaifan-orbit" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#fdba74" />
            <stop offset="100%" stopColor="#ea580c" />
          </linearGradient>
        </defs>
      </svg>

      {/* Plane riding the ring */}
      <motion.div
        className="absolute inset-0"
        initial={{ rotate: 0 }}
        animate={{ rotate: 360 }}
        transition={{
          delay: T.orbit,
          duration: T.orbitDuration,
          ease: "easeInOut",
        }}
      >
        <motion.div
          className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2"
          initial={{ opacity: 0, scale: 0.6 }}
          animate={{ opacity: [0, 1, 1, 0], scale: [0.6, 1.1, 1, 0.4] }}
          transition={{
            delay: T.orbit,
            duration: T.orbitDuration + 0.15,
            times: [0, 0.12, 0.85, 1],
          }}
        >
          <Plane
            className="h-6 w-6 rotate-45 fill-white text-white drop-shadow-[0_0_10px_rgba(251,146,60,0.95)] md:h-7 md:w-7"
            strokeWidth={1.5}
          />
        </motion.div>
      </motion.div>

      {/* Landing shockwave */}
      <motion.span
        className="absolute inset-0 rounded-full border-2 border-orange-400"
        initial={{ scale: 0.7, opacity: 0 }}
        animate={{ scale: [0.7, 1.7], opacity: [0, 0.8, 0] }}
        transition={{ delay: T.logo + 0.1, duration: 0.9, ease: "easeOut" }}
      />

      {/* Cream disc + logo */}
      <motion.div
        className="absolute inset-[7%] flex items-center justify-center rounded-full shadow-[0_0_60px_rgba(234,88,12,0.45)]"
        style={{ background: CREAM }}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{
          delay: T.logo,
          type: "spring",
          stiffness: 210,
          damping: 16,
        }}
      >
        <motion.img
        src={emblem}
        alt="Zaifan Consultancy"
        className="h-[92%] w-[92%]"
        decoding="async"
        initial={{ scale: 0.3, opacity: 0, rotate: -25 }}
        animate={{ scale: 1, opacity: 1, rotate: 0 }}
        transition={{ delay: T.logo + 0.1, type: "spring", stiffness: 220, damping: 15 }}
      />
      </motion.div>
    </div>
  );
}

function Wordmark() {
  return (
    <div className="mt-8 flex flex-col items-center text-center">
      <h1 className="flex overflow-hidden text-5xl font-black tracking-[0.08em] text-white md:text-7xl">
        {BRAND_WORD.split("").map((letter, index) => (
          <motion.span
            key={`${letter}-${index}`}
            className="inline-block"
            initial={{ y: "110%", rotate: 8 }}
            animate={{ y: "0%", rotate: 0 }}
            transition={{
              delay: T.word + index * 0.06,
              duration: 0.6,
              ease: EASE,
            }}
          >
            {letter}
          </motion.span>
        ))}
      </h1>

      <motion.p
        className="mt-2 text-xs font-black uppercase text-orange-400 md:text-sm"
        initial={{ opacity: 0, letterSpacing: "0.1em", filter: "blur(6px)" }}
        animate={{ opacity: 1, letterSpacing: "0.55em", filter: "blur(0px)" }}
        transition={{ delay: T.subword, duration: 0.9, ease: EASE }}
      >
        Consultancy
      </motion.p>

      <motion.span
        className="mt-5 block h-[2px] w-40 origin-center rounded-full bg-gradient-to-r from-transparent via-orange-500 to-transparent md:w-56"
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ delay: T.rule, duration: 0.7, ease: EASE }}
      />
    </div>
  );
}

function DepartureBoard() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    let interval;
    const start = window.setTimeout(() => {
      interval = window.setInterval(() => {
        setIndex((current) => {
          if (current >= DESTINATIONS.length - 1) {
            window.clearInterval(interval);
            return current;
          }
          return current + 1;
        });
      }, T.flip * 1000);
    }, (T.board + 0.25) * 1000);

    return () => {
      window.clearTimeout(start);
      window.clearInterval(interval);
    };
  }, []);

  const destination = DESTINATIONS[index];
  const landed = index === DESTINATIONS.length - 1;

  return (
    <motion.div
      className="mt-6 flex items-center gap-3 rounded-full border border-white/10 bg-white/[0.04] py-2 pl-4 pr-2 backdrop-blur-sm"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: T.board, duration: 0.5, ease: EASE }}
    >
      <span className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-white/60 md:text-xs">
        <motion.span
          className="h-1.5 w-1.5 rounded-full bg-orange-500"
          animate={{ opacity: [1, 0.2, 1] }}
          transition={{ duration: 0.9, repeat: Infinity }}
        />
        Now boarding
      </span>

      <span
        className={`relative min-w-[8.5rem] overflow-hidden rounded-full px-4 py-1 text-center font-mono text-xs font-bold tracking-[0.2em] transition-colors duration-300 md:min-w-[10rem] md:text-sm ${
          landed ? "bg-orange-500 text-white" : "bg-white/10 text-orange-300"
        }`}
        style={{ perspective: 400 }}
      >
        <motion.span
          key={destination}
          className="block"
          initial={{ rotateX: -90, opacity: 0 }}
          animate={{ rotateX: 0, opacity: 1 }}
          transition={{ duration: T.flip * 0.9, ease: "easeOut" }}
        >
          {destination}
        </motion.span>
      </span>
    </motion.div>
  );
}

export default function OpeningAnimation({ onComplete }) {
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    const timer = window.setTimeout(
      onComplete,
      reducedMotion ? REDUCED_TOTAL_MS : TOTAL_MS
    );
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      window.clearTimeout(timer);
      document.body.style.overflow = previousOverflow;
    };
  }, [onComplete, reducedMotion]);

  if (reducedMotion) {
    return (
      <motion.div
        className="fixed inset-0 z-[99999] flex items-center justify-center"
        style={{ background: NAVY }}
        initial={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="flex flex-col items-center">
          <div
            className="flex h-32 w-32 items-center justify-center rounded-full"
            style={{ background: CREAM }}
          >
            <img src={emblem} alt="Zaifan Consultancy" className="h-28 w-28" />
          </div>
          <p className="mt-6 text-4xl font-black tracking-[0.08em] text-white">ZAIFAN</p>
          <p className="mt-1 text-xs font-black uppercase tracking-[0.55em] text-orange-400">Consultancy</p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="fixed inset-0 z-[99999]"
      initial={{ y: 0 }}
      exit={{ y: "-118%" }}
      transition={{ duration: 0.95, ease: [0.76, 0, 0.24, 1] }}
    >
      <div
        className="absolute inset-0 flex items-center justify-center overflow-hidden"
        style={{
          background: `radial-gradient(circle at 50% 42%, #12306a 0%, ${NAVY} 45%, #030b1c 100%)`,
        }}
      >
        <StarField />
        <GlobeLines />
        <PulseRings />

        <motion.div
          className="pointer-events-none absolute left-1/2 top-[42%] h-[60vmin] w-[60vmin] -translate-x-1/2 -translate-y-1/2 rounded-full bg-orange-600/20 blur-[90px]"
          initial={{ opacity: 0, scale: 0.6 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: T.logo, duration: 1.4, ease: EASE }}
        />

        <div className="relative flex flex-col items-center px-4">
          <OrbitLogo />
          <Wordmark />
          <DepartureBoard />
        </div>

        <button
          type="button"
          onClick={onComplete}
          className="absolute bottom-6 right-6 text-[10px] font-black uppercase tracking-[0.3em] text-white/40 transition hover:text-orange-400 md:text-xs"
        >
          Skip intro
        </button>
      </div>

      {/* Curtain hem: trails the navy panel as it lifts */}
      <div className="pointer-events-none absolute left-0 right-0 top-full">
        <div className="h-[6vh] bg-gradient-to-b from-orange-500 to-orange-600" />
        <svg
          viewBox="0 0 100 10"
          preserveAspectRatio="none"
          className="block h-[8vh] w-full"
        >
          <path d="M0 0 H100 V2 Q50 12 0 2 Z" fill="#ea580c" />
        </svg>
      </div>
    </motion.div>
  );
}
