import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, BadgeCheck, MessageCircleQuestion, RefreshCw } from "lucide-react";

import { countryList } from "../../../data/countries";
import { FlagMark } from "../destinations/DestinationUI";

const COUNTRIES = countryList.filter((country) => country.realityChecks?.length);

function FlipCard({ check, flipped, onFlip, index }) {
  return (
    <motion.button
      type="button"
      onClick={onFlip}
      aria-pressed={flipped}
      aria-label={flipped ? `Reality: ${check.reality}` : `Myth: ${check.expectation}. Tap to see the reality.`}
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.05 }}
      className="h-52 w-full text-left [perspective:1200px]"
    >
      <motion.span
        animate={{ rotateY: flipped ? 180 : 0 }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        className="relative block h-full w-full [transform-style:preserve-3d]"
      >
        {/* What people think */}
        <span className="absolute inset-0 flex flex-col rounded-[24px] bg-white p-6 ring-1 ring-orange-100 transition [backface-visibility:hidden] hover:ring-[#ff4b12]">
          <span className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.14em] text-[#7a879c]">
            <MessageCircleQuestion size={15} className="text-[#ff4b12]" /> What people think
          </span>
          <span className="mt-4 text-2xl font-black leading-7 tracking-[-0.03em]">&ldquo;{check.expectation}&rdquo;</span>
          <span className="mt-auto inline-flex items-center gap-1.5 text-xs font-black text-[#ff4b12]">
            <RefreshCw size={13} strokeWidth={3} /> Tap for the reality
          </span>
        </span>

        {/* What's actually true */}
        <span className="absolute inset-0 flex flex-col rounded-[24px] bg-[#071f50] p-6 text-white [backface-visibility:hidden] [transform:rotateY(180deg)]">
          <span className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.14em] text-emerald-300">
            <BadgeCheck size={15} /> Reality check
          </span>
          <span className="mt-4 text-base font-bold leading-7 text-white/90">{check.reality}</span>
          <span className="mt-auto text-[11px] font-bold text-white/45">Tap to flip back</span>
        </span>
      </motion.span>
    </motion.button>
  );
}

/** Popular beliefs about each destination, flipped to what's really true. */
function RealityCheck() {
  const [slug, setSlug] = useState(COUNTRIES[0].slug);
  const [flipped, setFlipped] = useState([]);
  const country = COUNTRIES.find((item) => item.slug === slug);
  const checks = country.realityChecks;
  const allFlipped = flipped.length === checks.length;

  const pick = (nextSlug) => {
    setSlug(nextSlug);
    setFlipped([]);
  };
  const flip = (index) => setFlipped((current) => (current.includes(index) ? current.filter((item) => item !== index) : [...current, index]));

  return (
    <section className="bg-[#fff7ed] px-4 py-16 text-[#071f50] sm:px-5 md:py-24">
      <div className="mx-auto max-w-[1350px]">
        <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#ff4b12]">Things nobody tells you</p>
            <h2 className="mt-3 text-4xl font-black leading-[0.95] tracking-[-0.055em] md:text-6xl">
              Expectation
              <span className="block text-[#ff4b12]">vs reality.</span>
            </h2>
          </div>
          <p className="max-w-md text-sm font-semibold leading-7 text-[#5f6f89] md:text-base">
            What students hear before they go, and what&apos;s actually true. Pick a country and tap a card to flip it. No sugar-coating.
          </p>
        </div>

        <div className="mt-8 flex flex-wrap items-center gap-2" role="group" aria-label="Choose a country">
          {COUNTRIES.map((item) => (
            <button
              key={item.slug}
              type="button"
              onClick={() => pick(item.slug)}
              aria-pressed={item.slug === slug}
              className={`inline-flex items-center gap-2 rounded-full py-1.5 pl-1.5 pr-3.5 text-xs font-black transition ${
                item.slug === slug ? "bg-[#071f50] text-white" : "bg-white ring-1 ring-orange-100 hover:ring-[#ff4b12]"
              }`}
            >
              <FlagMark country={item} className="h-5 w-[30px] rounded-full shadow-none" />
              {item.name}
            </button>
          ))}
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {checks.map((check, index) => (
            <FlipCard key={`${slug}-${check.expectation}`} check={check} index={index} flipped={flipped.includes(index)} onFlip={() => flip(index)} />
          ))}
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3">
          <button
            type="button"
            onClick={() => setFlipped(allFlipped ? [] : checks.map((_, index) => index))}
            className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-black ring-1 ring-orange-100 transition hover:ring-[#071f50]"
          >
            <RefreshCw size={15} strokeWidth={3} /> {allFlipped ? "Flip them back" : "Flip all"}
          </button>
          <Link to={`/countries/${country.slug}`} className="inline-flex items-center gap-1.5 text-sm font-black text-[#ff4b12] hover:gap-2.5">
            Read the honest {country.name} guide <ArrowRight size={15} strokeWidth={3} />
          </Link>
        </div>
      </div>
    </section>
  );
}

export default RealityCheck;
