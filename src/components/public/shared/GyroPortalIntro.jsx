import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";

import emblem from "../../../assets/images/brand/intro/emblem.webp";
import outerRing from "../../../assets/images/brand/intro/outer.webp";
import innerRing from "../../../assets/images/brand/intro/inner.webp";
import letterSwoosh from "../../../assets/images/brand/intro/core.webp";
import globe from "../../../assets/images/brand/intro/globe.webp";
import plane from "../../../assets/images/brand/intro/plane.webp";

// Zaifan "gyroscope portal" intro, built from the real emblem split into
// layers: the rings swing open like a gyroscope, the globe drops in spinning,
// the plane flies in and pulls the Z/swoosh into view, a shine sweeps across,
// then the inner ring opens as a portal and we fly through it into the site.

const NAVY = "#071d43";
const CREAM = "#fff4e8";
const EASE = [0.22, 1, 0.36, 1];
const BACK = [0.34, 1.4, 0.64, 1];

// Timeline (seconds)
const T = {
  outer: 0.2,
  inner: 0.38,
  globe: 0.9,
  plane: 1.1,
  core: 1.2,
  shine: 2.05,
  word: 2.05,
  portal: 3.25,
};

const PORTAL_DURATION = 1.05;
const TOTAL_MS = (T.portal + PORTAL_DURATION + 0.05) * 1000;
const REDUCED_TOTAL_MS = 900;

// The emblem's inner ring interior, as a fraction of the emblem's width.
const PORTAL_RADIUS = 0.33;
const PORTAL_SCALE = 15;
const LOGO_CENTER_Y = "42%";

const WORD = "ZAIFAN";

function getLogoSize() {
  const shortSide = Math.min(window.innerWidth, window.innerHeight);
  return Math.round(Math.min(300, shortSide * 0.52));
}

function layerStyle(src) {
  return {
    backgroundImage: `url(${src})`,
    backgroundSize: "100% 100%",
  };
}

function SunRays() {
  return (
    <motion.div
      className="pointer-events-none absolute left-1/2 h-[220vmax] w-[220vmax] -translate-x-1/2 -translate-y-1/2"
      style={{
        top: LOGO_CENTER_Y,
        background:
          "repeating-conic-gradient(from 0deg, rgba(234,88,12,0.07) 0deg 6deg, rgba(234,88,12,0) 6deg 18deg)",
        maskImage: "radial-gradient(circle, #000 0%, transparent 45%)",
        WebkitMaskImage: "radial-gradient(circle, #000 0%, transparent 45%)",
      }}
      initial={{ opacity: 0, rotate: -20 }}
      animate={{ opacity: 1, rotate: 25 }}
      transition={{ opacity: { duration: 1 }, rotate: { duration: 6, ease: "linear" } }}
    />
  );
}

function Emblem({ size }) {
  const layer = "absolute inset-0";

  return (
    <div
      className="relative"
      style={{ width: size, height: size, perspective: 900 }}
    >
      {/* Rings swing open like a gyroscope, from opposite axes */}
      <motion.div
        className={layer}
        style={layerStyle(outerRing)}
        initial={{ rotateY: 88, rotateZ: -160, opacity: 0 }}
        animate={{ rotateY: 0, rotateZ: 0, opacity: 1 }}
        transition={{ delay: T.outer, duration: 1.2, ease: BACK, opacity: { delay: T.outer, duration: 0.2 } }}
      />
      <motion.div
        className={layer}
        style={layerStyle(innerRing)}
        initial={{ rotateX: 88, rotateZ: 160, opacity: 0 }}
        animate={{ rotateX: 0, rotateZ: 0, opacity: 1 }}
        transition={{ delay: T.inner, duration: 1.2, ease: BACK, opacity: { delay: T.inner, duration: 0.2 } }}
      />

      {/* Globe drops in spinning */}
      <motion.div
        className={layer}
        style={{ ...layerStyle(globe), originX: "27%", originY: "48%" }}
        initial={{ scale: 0, rotate: -270, y: -size * 0.6 }}
        animate={{ scale: 1, rotate: 0, y: 0 }}
        transition={{ delay: T.globe, type: "spring", stiffness: 140, damping: 13 }}
      />

      {/* Z + swoosh revealed by a wipe that trails the plane */}
      <motion.div
        className={layer}
        style={{
          ...layerStyle(letterSwoosh),
          maskImage:
            "linear-gradient(105deg, #000 calc(var(--wipe) - 14%), transparent var(--wipe))",
          WebkitMaskImage:
            "linear-gradient(105deg, #000 calc(var(--wipe) - 14%), transparent var(--wipe))",
        }}
        initial={{ "--wipe": "-15%", scale: 1.06 }}
        animate={{ "--wipe": "130%", scale: 1 }}
        transition={{ delay: T.core, duration: 0.85, ease: [0.45, 0, 0.3, 1] }}
      />

      {/* Plane flies in along the swoosh and settles */}
      <motion.div
        className={layer}
        style={layerStyle(plane)}
        initial={{ x: "-78%", y: "42%", opacity: 0, scale: 0.7 }}
        animate={{
          x: ["-78%", "-48%", "-18%", "4%", "0%"],
          y: ["42%", "33%", "17%", "-3%", "0%"],
          opacity: [0, 1, 1, 1, 1],
          scale: [0.7, 0.9, 1.05, 1.08, 1],
        }}
        transition={{ delay: T.plane, duration: 1.05, ease: "easeOut" }}
      />

      {/* Shine sweep clipped to the emblem's shape */}
      <motion.div
        className={layer}
        style={{
          backgroundImage:
            "linear-gradient(115deg, transparent 42%, rgba(255,255,255,0.9) 50%, transparent 58%)",
          backgroundSize: "300% 100%",
          maskImage: `url(${emblem})`,
          WebkitMaskImage: `url(${emblem})`,
          maskSize: "100% 100%",
          WebkitMaskSize: "100% 100%",
        }}
        initial={{ backgroundPosition: "100% 0%" }}
        animate={{ backgroundPosition: "0% 0%" }}
        transition={{ delay: T.shine, duration: 0.9, ease: "easeInOut" }}
      />
    </div>
  );
}

function Wordmark() {
  return (
    <div className="flex flex-col items-center text-center">
      <h1
        className="flex overflow-hidden text-5xl font-black tracking-[0.12em] md:text-7xl"
        style={{ color: NAVY }}
      >
        {WORD.split("").map((letter, index) => (
          <motion.span
            key={`${letter}-${index}`}
            className="inline-block"
            initial={{ y: "110%" }}
            animate={{ y: "0%" }}
            transition={{ delay: T.word + index * 0.05, duration: 0.55, ease: EASE }}
          >
            {letter}
          </motion.span>
        ))}
      </h1>
      <motion.p
        className="mt-1 text-xs font-black uppercase text-orange-600 md:text-sm"
        initial={{ opacity: 0, letterSpacing: "0.15em" }}
        animate={{ opacity: 1, letterSpacing: "0.6em" }}
        transition={{ delay: T.word + 0.35, duration: 0.8, ease: EASE }}
      >
        Consultancy
      </motion.p>
      <motion.p
        className="mt-4 text-[10px] font-bold uppercase tracking-[0.35em] md:text-xs"
        style={{ color: `${NAVY}99` }}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: T.word + 0.6, duration: 0.5, ease: EASE }}
      >
        Admissions · Scholarships · Visas
      </motion.p>
    </div>
  );
}

export default function GyroPortalIntro({ onReveal, onComplete }) {
  const reducedMotion = useReducedMotion();
  const [logoSize] = useState(getLogoSize);

  useEffect(() => {
    if (reducedMotion) {
      const timer = window.setTimeout(onComplete, REDUCED_TOTAL_MS);
      return () => window.clearTimeout(timer);
    }

    const revealTimer = window.setTimeout(() => onReveal?.(), T.portal * 1000);
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
        className="fixed inset-0 z-[99999] flex flex-col items-center justify-center"
        style={{ background: CREAM }}
        initial={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.4 }}
      >
        <img src={emblem} alt="Zaifan Consultancy" className="h-40 w-40" />
        <p className="mt-5 text-5xl font-black tracking-[0.12em]" style={{ color: NAVY }}>
          ZAIFAN
        </p>
        <p className="text-xs font-black uppercase tracking-[0.6em] text-orange-600">
          Consultancy
        </p>
      </motion.div>
    );
  }

  const portalRadius = logoSize * PORTAL_RADIUS;
  const portalTimes = [0, 0.12, 1];
  const portalTransition = {
    delay: T.portal,
    duration: PORTAL_DURATION,
    times: portalTimes,
    ease: [0.7, 0, 0.84, 0],
  };
  const holeMask = `radial-gradient(circle at 50% ${LOGO_CENTER_Y}, transparent var(--hole), #000 calc(var(--hole) + 1px))`;

  return (
    <motion.div
      className="fixed inset-0 z-[99999] overflow-hidden"
      style={{
        background: `radial-gradient(circle at 50% ${LOGO_CENTER_Y}, #ffffff 0%, ${CREAM} 45%, #fde3c8 100%)`,
        maskImage: holeMask,
        WebkitMaskImage: holeMask,
      }}
      initial={{ "--hole": "0px" }}
      animate={{
        "--hole": ["0px", `${portalRadius}px`, `${portalRadius * PORTAL_SCALE}px`],
      }}
      transition={portalTransition}
    >
      <SunRays />

      {/* Emblem scales up as the portal hole (sized to the inner ring) opens,
          so we fly through the ring into the site */}
      <motion.div
        className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2"
        style={{ top: LOGO_CENTER_Y }}
        initial={{ scale: 1 }}
        animate={{ scale: [1, 1, PORTAL_SCALE] }}
        transition={portalTransition}
      >
        <Emblem size={logoSize} />
      </motion.div>

      <motion.div
        className="absolute inset-x-0 flex justify-center px-4"
        style={{ top: `calc(${LOGO_CENTER_Y} + ${logoSize / 2 + 24}px)` }}
        initial={{ opacity: 1, y: 0 }}
        animate={{ opacity: 0, y: 30 }}
        transition={{ delay: T.portal - 0.1, duration: 0.3, ease: "easeIn" }}
      >
        <Wordmark />
      </motion.div>

      <motion.button
        type="button"
        onClick={onComplete}
        className="absolute bottom-6 right-6 text-[10px] font-black uppercase tracking-[0.3em] text-[#071d43]/40 transition hover:text-orange-600 md:text-xs"
        initial={{ opacity: 1 }}
        animate={{ opacity: 0 }}
        transition={{ delay: T.portal - 0.1, duration: 0.2 }}
      >
        Skip intro
      </motion.button>
    </motion.div>
  );
}
