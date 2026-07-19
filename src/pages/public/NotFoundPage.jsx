import { Link } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowLeft, Compass, Plane, Sparkles } from "lucide-react";

const MOTION = {
  duration: 0.55,
  ease: [0.22, 1, 0.36, 1],
};

function NotFoundPage() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <section className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#FFF7EA] px-6 py-16 text-center text-[#241506]">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-10 top-10 h-24 w-24 rounded-full bg-orange-200/50 blur-2xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute bottom-16 right-12 h-32 w-32 rounded-full bg-[#F97316]/20 blur-3xl"
      />

      <Plane
        aria-hidden="true"
        className="pointer-events-none absolute right-[14%] top-[18%] h-10 w-10 rotate-12 text-orange-400/50"
      />
      <Compass
        aria-hidden="true"
        className="pointer-events-none absolute bottom-[18%] left-[12%] h-12 w-12 text-orange-300/50"
      />
      <Sparkles
        aria-hidden="true"
        className="pointer-events-none absolute left-[20%] top-[24%] h-8 w-8 text-yellow-400/60"
      />

      <motion.div
        initial={shouldReduceMotion ? false : { opacity: 0, y: 24, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{
          duration: shouldReduceMotion ? 0 : MOTION.duration,
          ease: MOTION.ease,
        }}
        className="relative max-w-2xl rounded-[2rem] border border-orange-100 bg-white/80 px-8 py-12 shadow-[0_24px_80px_rgba(249,115,22,0.16)] backdrop-blur"
      >
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-100 text-orange-600">
          <Compass className="h-8 w-8" aria-hidden="true" />
        </div>

        <p className="text-sm font-black uppercase tracking-[0.35em] text-orange-500">
          Lost on the journey
        </p>

        <h1 className="mt-4 text-7xl font-black leading-none text-[#F97316] sm:text-8xl">
          404
        </h1>

        <h2 className="mt-5 text-3xl font-black sm:text-4xl">
          This path is not on the map
        </h2>

        <p className="mx-auto mt-5 max-w-xl text-base font-medium leading-8 text-[#6B4A2B] sm:text-lg">
          The page you are looking for may have moved, or this study abroad
          route has not been created yet.
        </p>

        <Link
          to="/"
          className="mt-9 inline-flex items-center gap-3 rounded-full bg-[#F97316] px-8 py-4 text-sm font-black text-white shadow-[0_18px_40px_rgba(249,115,22,0.32)] transition-all duration-300 ease-out hover:-translate-y-1 hover:bg-orange-600 hover:shadow-[0_22px_46px_rgba(249,115,22,0.36)] focus:outline-none focus-visible:ring-4 focus-visible:ring-orange-200"
        >
          <ArrowLeft className="h-5 w-5" aria-hidden="true" />
          Return Home
        </Link>
      </motion.div>
    </section>
  );
}

export default NotFoundPage;
