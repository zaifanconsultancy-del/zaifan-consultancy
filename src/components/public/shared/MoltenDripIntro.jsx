import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";

import emblemCream from "../../../assets/images/brand/intro/emblem-cream.webp";
import outerRing from "../../../assets/images/brand/intro/outer-cream.webp";
import innerRing from "../../../assets/images/brand/intro/inner-cream.webp";
import letterSwoosh from "../../../assets/images/brand/intro/core-cream.webp";
import globe from "../../../assets/images/brand/intro/globe.webp";
import plane from "../../../assets/images/brand/intro/plane.webp";

// Zaifan "molten orange" intro: amber then orange liquid pours down over navy
// in gooey drips. A cream drop falls and splashes, its ripples become the
// emblem's rings, the globe drops in spinning and the plane pulls the Z into
// view. The wordmark drops with a liquid bounce, then both layers melt off
// the screen to reveal the site underneath.

const NAVY = "#071d43";
const CREAM = "#fff4e8";

// Viscous pour: slow to start, then gravity takes over.
const POUR_EASE = [0.6, 0, 0.8, 0.45];
// Melt: hangs for a moment, then slides away.
const MELT_EASE = [0.55, 0, 0.9, 0.5];

const LAYERS = [
  {
    id: "zaifan-amber",
    seed: 11,
    color: "#fbbf24",
    pourAt: 0.1,
    meltAt: 3.72,
  },
  {
    id: "zaifan-orange",
    seed: 29,
    color: "#f97316",
    pourAt: 0.38,
    meltAt: 3.5,
  },
];

// Timeline (seconds)
const T = {
  drop: 1.15,
  splash: 1.5,
  word: 2.05,
  subword: 2.4,
  tagline: 2.6,
  shine: 2.75,
  contentOut: 3.35,
  reveal: 3.72,
};

const TOTAL_MS = 5250;
const REDUCED_TOTAL_MS = 900;

const BRAND_WORD = "ZAIFAN";

function seeded(seed) {
  let value = seed;
  return () => {
    value = (value * 16807) % 2147483647;
    return (value - 1) / 2147483646;
  };
}

function getViewport() {
  return {
    width: Math.max(320, window.innerWidth),
    height: Math.max(480, window.innerHeight),
  };
}

function buildDrips(width, height, seed) {
  const rand = seeded(seed);
  const count = Math.max(7, Math.ceil(width / 85));
  const slot = width / count;

  return Array.from({ length: count }, (_, index) => {
    const w = slot * (0.45 + rand() * 0.45);
    const length = height * (0.25 + rand() * 0.75);
    return {
      id: index,
      x: index * slot + rand() * (slot - w),
      w,
      length,
      bulb: w * (0.6 + rand() * 0.15),
      pourDelay: rand() * 0.3,
      pourDuration: 0.75 + rand() * 0.4,
      // Small lag behind the sheet = short gooey tongues, not long bars.
      meltDelay: rand() * 0.07,
      meltDuration: 0.85 + rand() * 0.06,
    };
  });
}

// Bumps along the sheet's top edge so it melts with a wavy, liquid rim.
function buildScallops(width, seed) {
  const rand = seeded(seed);
  const count = Math.max(6, Math.ceil(width / 110));
  const slot = width / count;

  return Array.from({ length: count + 1 }, (_, index) => ({
    id: index,
    x: index * slot + (rand() - 0.5) * slot * 0.5,
    r: 26 + rand() * 34,
  }));
}

// One keyframed translate per element: drop in (pour), hang, slide off (melt).
function pourMeltMotion({ pourStart, pourDuration, pourDistance, meltStart, meltDuration, meltDistance }) {
  const end = meltStart + meltDuration;
  const total = end - pourStart;

  return {
    initial: { y: 0 },
    animate: { y: [0, pourDistance, pourDistance, pourDistance + meltDistance] },
    transition: {
      delay: pourStart,
      duration: total,
      times: [0, pourDuration / total, (meltStart - pourStart) / total, 1],
      ease: [POUR_EASE, "linear", MELT_EASE],
    },
  };
}

function DripLayer({ layer, width, height }) {
  const [drips] = useState(() => buildDrips(width, height, layer.seed));
  const [scallops] = useState(() => buildScallops(width, layer.seed + 1));
  const bandHeight = height + 120;

  return (
    <svg
      className="pointer-events-none absolute inset-0 h-full w-full"
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <defs>
        <filter id={`${layer.id}-goo`} x="-5%" y="-5%" width="110%" height="110%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="10" result="blur" />
          <feColorMatrix
            in="blur"
            mode="matrix"
            values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 24 -10"
          />
        </filter>
      </defs>

      <g filter={`url(#${layer.id}-goo)`} fill={layer.color}>
        {/* Main flood: slides in from above until it covers the screen.
            Its wavy top edge is what you see as the sheet melts away. */}
        <motion.g
          {...pourMeltMotion({
            pourStart: layer.pourAt + 0.3,
            pourDuration: 1,
            pourDistance: height + 80,
            meltStart: layer.meltAt,
            meltDuration: 0.85,
            meltDistance: height + 260,
          })}
        >
          <rect x={-40} y={-bandHeight - 40} width={width + 80} height={bandHeight} />
          {scallops.map((scallop) => (
            <circle
              key={scallop.id}
              cx={scallop.x}
              cy={-bandHeight - 40 + scallop.r * 0.35}
              r={scallop.r}
            />
          ))}
        </motion.g>

        {/* Drips lead the pour and lag behind the melt */}
        {drips.map((drip) => {
          const columnHeight = drip.length + 70;
          return (
            <motion.g
              key={drip.id}
              {...pourMeltMotion({
                pourStart: layer.pourAt + drip.pourDelay,
                pourDuration: drip.pourDuration,
                pourDistance: drip.length + 40,
                meltStart: layer.meltAt + drip.meltDelay,
                meltDuration: drip.meltDuration,
                meltDistance: height + 260,
              })}
            >
              <rect
                x={drip.x}
                y={-columnHeight - 40}
                width={drip.w}
                height={columnHeight}
                rx={drip.w / 2}
              />
              <circle cx={drip.x + drip.w / 2} cy={-40 - drip.bulb * 0.4} r={drip.bulb} />
            </motion.g>
          );
        })}
      </g>
    </svg>
  );
}

const SPLASH_BLOBS = Array.from({ length: 10 }, (_, index) => {
  const angle = (index / 10) * Math.PI * 2 + 0.2;
  const reach = index % 2 === 0 ? 150 : 115;
  return {
    id: index,
    x: Math.cos(angle) * reach,
    y: Math.sin(angle) * reach * 0.8,
    r: index % 2 === 0 ? 16 : 11,
  };
});

function layerStyle(src) {
  return { backgroundImage: `url(${src})`, backgroundSize: "100% 100%" };
}

function LiquidEmblem() {
  const layer = "absolute inset-0";

  return (
    <div className="relative h-52 w-52 md:h-64 md:w-64">
      {/* Cream drop falls into the pool */}
      <motion.div
        className="absolute left-1/2 top-1/2 -ml-4 -mt-6 h-12 w-8"
        style={{ background: CREAM, borderRadius: "50% 50% 50% 50% / 62% 62% 38% 38%" }}
        initial={{ y: "-70vh", scaleY: 1.5, opacity: 1 }}
        animate={{ y: ["-70vh", "0vh", "0vh"], scaleY: [1.5, 1.2, 0], opacity: [1, 1, 0] }}
        transition={{
          delay: T.drop,
          duration: T.splash - T.drop + 0.06,
          times: [0, 0.85, 1],
          ease: "easeIn",
        }}
      />

      {/* Gooey splash crown */}
      <svg
        viewBox="-200 -200 400 400"
        className="pointer-events-none absolute left-1/2 top-1/2 h-[170%] w-[170%] -translate-x-1/2 -translate-y-1/2 overflow-visible"
        aria-hidden="true"
      >
        <defs>
          <filter id="zaifan-splash-goo" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="6" result="blur" />
            <feColorMatrix
              in="blur"
              mode="matrix"
              values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 20 -9"
            />
          </filter>
        </defs>
        <g filter="url(#zaifan-splash-goo)" fill={CREAM}>
          <motion.circle
            cx={0}
            cy={0}
            initial={{ r: 0 }}
            animate={{ r: [0, 42, 0] }}
            transition={{ delay: T.splash, duration: 0.5, times: [0, 0.35, 1] }}
          />
          {SPLASH_BLOBS.map((blob) => (
            <motion.circle
              key={blob.id}
              initial={{ cx: 0, cy: 0, r: 0 }}
              animate={{
                cx: [0, blob.x, blob.x * 1.15],
                cy: [0, blob.y, blob.y * 1.15 + 30],
                r: [0, blob.r, 0],
              }}
              transition={{
                delay: T.splash + 0.02,
                duration: 0.7,
                times: [0, 0.45, 1],
                ease: "easeOut",
              }}
            />
          ))}
        </g>
      </svg>

      {/* Ripples settle into the two rings */}
      <motion.div
        className={layer}
        style={layerStyle(outerRing)}
        initial={{ scale: 0.1, opacity: 0 }}
        animate={{ scale: [0.1, 1.12, 0.96, 1], opacity: [0, 1, 1, 1] }}
        transition={{
          delay: T.splash + 0.05,
          duration: 0.85,
          times: [0, 0.5, 0.78, 1],
          ease: "easeOut",
        }}
      />
      <motion.div
        className={layer}
        style={layerStyle(innerRing)}
        initial={{ scale: 0.1, opacity: 0, rotate: -40 }}
        animate={{
          scale: [0.1, 1.1, 0.97, 1],
          opacity: [0, 1, 1, 1],
          rotate: [-40, 6, -2, 0],
        }}
        transition={{
          delay: T.splash + 0.15,
          duration: 0.85,
          times: [0, 0.5, 0.78, 1],
          ease: "easeOut",
        }}
      />

      {/* Globe drops in spinning */}
      <motion.div
        className={layer}
        style={{ ...layerStyle(globe), originX: "27%", originY: "48%" }}
        initial={{ scale: 0, rotate: -300 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ delay: T.splash + 0.3, type: "spring", stiffness: 150, damping: 12 }}
      />

      {/* Z + swoosh revealed in the plane's wake */}
      <motion.div
        className={layer}
        style={{
          ...layerStyle(letterSwoosh),
          maskImage:
            "linear-gradient(105deg, #000 calc(var(--wipe) - 14%), transparent var(--wipe))",
          WebkitMaskImage:
            "linear-gradient(105deg, #000 calc(var(--wipe) - 14%), transparent var(--wipe))",
        }}
        initial={{ "--wipe": "-15%" }}
        animate={{ "--wipe": "130%" }}
        transition={{ delay: T.splash + 0.5, duration: 0.8, ease: [0.45, 0, 0.3, 1] }}
      />

      {/* Plane flies in along the swoosh */}
      <motion.div
        className={layer}
        style={layerStyle(plane)}
        initial={{ x: "-80%", y: "44%", opacity: 0, scale: 0.7 }}
        animate={{
          x: ["-80%", "-48%", "-18%", "4%", "0%"],
          y: ["44%", "33%", "17%", "-3%", "0%"],
          opacity: [0, 1, 1, 1, 1],
          scale: [0.7, 0.9, 1.05, 1.08, 1],
        }}
        transition={{ delay: T.splash + 0.4, duration: 1, ease: "easeOut" }}
      />

      {/* Wet shine sweeping across the finished emblem */}
      <motion.div
        className={layer}
        style={{
          backgroundImage:
            "linear-gradient(115deg, transparent 42%, rgba(255,255,255,0.95) 50%, transparent 58%)",
          backgroundSize: "300% 100%",
          maskImage: `url(${emblemCream})`,
          WebkitMaskImage: `url(${emblemCream})`,
          maskSize: "100% 100%",
          WebkitMaskSize: "100% 100%",
        }}
        initial={{ backgroundPosition: "100% 0%" }}
        animate={{ backgroundPosition: "0% 0%" }}
        transition={{ delay: T.shine, duration: 0.8, ease: "easeInOut" }}
      />
    </div>
  );
}

function Wordmark() {
  return (
    <div className="mt-6 flex flex-col items-center text-center">
      <h1 className="flex text-6xl font-black tracking-[0.06em] md:text-8xl" style={{ color: NAVY }}>
        {BRAND_WORD.split("").map((letter, index) => (
          <motion.span
            key={`${letter}-${index}`}
            className="inline-block origin-bottom"
            initial={{ y: -90, opacity: 0, scaleY: 1.4, scaleX: 0.8 }}
            animate={{
              y: [-90, 0, -14, 0],
              opacity: [0, 1, 1, 1],
              scaleY: [1.4, 0.7, 1.08, 1],
              scaleX: [0.8, 1.25, 0.96, 1],
            }}
            transition={{
              delay: T.word + index * 0.07,
              duration: 0.75,
              times: [0, 0.45, 0.72, 1],
              ease: "easeOut",
            }}
          >
            {letter}
          </motion.span>
        ))}
      </h1>

      <motion.p
        className="mt-1 text-xs font-black uppercase md:text-base"
        style={{ color: NAVY }}
        initial={{ opacity: 0, letterSpacing: "0.1em", y: 10 }}
        animate={{ opacity: 1, letterSpacing: "0.6em", y: 0 }}
        transition={{ delay: T.subword, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      >
        Consultancy
      </motion.p>

      <motion.p
        className="mt-5 rounded-full px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.3em] md:text-xs"
        style={{ background: NAVY, color: CREAM }}
        initial={{ opacity: 0, scale: 0.6 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: T.tagline, type: "spring", stiffness: 260, damping: 15 }}
      >
        Your study abroad journey starts here
      </motion.p>
    </div>
  );
}

export default function MoltenDripIntro({ onReveal, onComplete }) {
  const reducedMotion = useReducedMotion();
  const [viewport] = useState(getViewport);

  useEffect(() => {
    if (reducedMotion) {
      const timer = window.setTimeout(onComplete, REDUCED_TOTAL_MS);
      return () => window.clearTimeout(timer);
    }

    const revealTimer = window.setTimeout(() => onReveal?.(), T.reveal * 1000);
    const doneTimer = window.setTimeout(onComplete, TOTAL_MS);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      window.clearTimeout(revealTimer);
      window.clearTimeout(doneTimer);
      document.body.style.overflow = previousOverflow;
    };
  }, [onReveal, onComplete, reducedMotion]);

  if (reducedMotion) {
    return (
      <motion.div
        className="fixed inset-0 z-[99999] flex items-center justify-center"
        style={{ background: "#f97316" }}
        initial={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="flex flex-col items-center">
          <div className="flex h-32 w-32 items-center justify-center rounded-full" style={{ background: CREAM }}>
            <img src={emblemCream} alt="Zaifan Consultancy" className="h-36 w-36" />
          </div>
          <p className="mt-5 text-5xl font-black" style={{ color: NAVY }}>ZAIFAN</p>
          <p className="text-xs font-black uppercase tracking-[0.6em]" style={{ color: CREAM }}>Consultancy</p>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="pointer-events-none fixed inset-0 z-[99999] overflow-hidden">
      {/* Navy base, hidden once the amber layer has covered it */}
      <motion.div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(circle at 50% 30%, #12306a 0%, ${NAVY} 55%, #030b1c 100%)`,
        }}
        initial={{ opacity: 1 }}
        animate={{ opacity: 0 }}
        transition={{ delay: T.reveal - 0.3, duration: 0 }}
      />

      {LAYERS.map((layer) => (
        <DripLayer
          key={layer.id}
          layer={layer}
          width={viewport.width}
          height={viewport.height}
        />
      ))}

      {/* Fixed shading for depth: moving drips can't carry a gradient seamlessly */}
      <motion.div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at 50% 40%, rgba(255,237,213,0.35) 0%, rgba(255,237,213,0) 45%, rgba(124,45,18,0.3) 100%)",
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 1, 1, 0] }}
        transition={{ delay: 1, duration: T.contentOut + 0.2 - 1, times: [0, 0.3, 0.85, 1] }}
      />

      <motion.div
        className="absolute inset-0 flex flex-col items-center justify-center px-4"
        initial={{ opacity: 1, y: 0 }}
        animate={{ opacity: 0, y: 70 }}
        transition={{ delay: T.contentOut, duration: 0.35, ease: "easeIn" }}
      >
        <LiquidEmblem />
        <Wordmark />
      </motion.div>

      <motion.button
        type="button"
        onClick={onComplete}
        className="pointer-events-auto absolute bottom-6 right-6 text-[10px] font-black uppercase tracking-[0.3em] text-white/60 transition hover:text-white md:text-xs"
        initial={{ opacity: 1 }}
        animate={{ opacity: 0 }}
        transition={{ delay: T.contentOut, duration: 0.2 }}
      >
        Skip intro
      </motion.button>
    </div>
  );
}
